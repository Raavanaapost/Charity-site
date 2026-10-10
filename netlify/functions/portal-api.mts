// Team portal API. Only signed-in team members (Netlify Identity) can use it.
//   GET   /api/portal/me                          who is signed in
//   GET   /api/portal/suggestions                 all suggestions with their notes
//   PATCH /api/portal/suggestions/:ref            change status, who looks after it, visit date, visit checklist (+ optional note)
//   POST  /api/portal/suggestions/:ref/notes      add a team note
// Access: a user with the Identity role "admin" or "team", or whose email is listed in the PORTAL_ADMINS environment variable.
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";
import { getStore } from "@netlify/blobs";

const STATUSES = ["new", "visit", "verified", "declined", "project"];
const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

type Member = { email: string; name: string; roles: string[]; admin: boolean };

async function member(): Promise<Member | null> {
  const user = await getUser();
  if (!user || !user.email) return null;
  const email = user.email.toLowerCase();
  const admins = (Netlify.env.get("PORTAL_ADMINS") || "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  const admin = roles.includes("admin") || admins.includes(email);
  if (!admin && !roles.includes("team")) return null;
  const meta = (user as { user_metadata?: { full_name?: string }; userMetadata?: { full_name?: string } });
  const name = meta.user_metadata?.full_name || meta.userMetadata?.full_name || email.split("@")[0];
  return { email, name, roles, admin };
}

const evidenceStore = (context: Context) =>
  getStore({ name: context.deploy?.context === "production" ? "evidence" : "evidence-preview", consistency: "strong" });

async function filesFor(db: ReturnType<typeof getDatabase>, ids: number[]) {
  const by = new Map<number, unknown[]>();
  if (!ids.length) return by;
  const rows = await db.sql`SELECT id, suggestion_id, name, type, size FROM suggestion_files WHERE complete AND suggestion_id = ANY(${ids}::int[]) ORDER BY id`;
  for (const f of rows as { id: number; suggestion_id: number; name: string; type: string; size: number }[]) {
    const list = by.get(f.suggestion_id) || [];
    list.push({ id: f.id, name: f.name, type: f.type, size: f.size });
    by.set(f.suggestion_id, list);
  }
  return by;
}

async function allSuggestions(db: ReturnType<typeof getDatabase>) {
  const rows = await db.sql`SELECT * FROM suggestions ORDER BY received_at DESC LIMIT 500`;
  const notes = await db.sql`SELECT suggestion_id, by_name, body, created_at FROM suggestion_notes ORDER BY created_at`;
  const bySid = new Map<number, unknown[]>();
  for (const n of notes as { suggestion_id: number; by_name: string; body: string; created_at: string }[]) {
    const list = bySid.get(n.suggestion_id) || [];
    list.push({ by: n.by_name, at: n.created_at, text: n.body });
    bySid.set(n.suggestion_id, list);
  }
  const files = await filesFor(db, (rows as { id: number }[]).map((r) => r.id));
  return (rows as Record<string, any>[]).map((r) => shape(r, bySid.get(r.id) || [], files.get(r.id) || []));
}

function shape(r: Record<string, any>, notes: unknown[], files: unknown[] = []) {
  return {
    id: r.ref, received: r.received_at, status: r.status, assigned: r.assigned,
    visit: r.visit_date ? new Date(r.visit_date).toISOString().slice(0, 10) : "",
    title: r.title, category: r.category, focus: r.focus || [], description: r.description, location: r.location, city: r.city || "", village: r.village || "",
    children: r.children, contact: r.contact, reach: r.reach, trusted: r.trusted, additional: r.additional,
    onboard: r.onboard || {}, project: r.project_slug, notes, files, noEvidence: !!r.no_evidence,
  };
}

export default async (req: Request, context: Context) => {
  const me = await member();
  if (!me) return json({ error: "Please sign in with a team account." }, 401);
  const db = getDatabase();
  const parts = new URL(req.url).pathname.replace(/^\/api\/portal\/?/, "").split("/").filter(Boolean);

  if (parts[0] === "me" && req.method === "GET") return json({ email: me.email, name: me.name, roles: me.roles, admin: me.admin });

  // Evidence files, streamed part by part from Netlify Blobs (team only).
  if (parts[0] === "files" && parts[1] && req.method === "GET") {
    const [f] = await db.sql<{ file_key: string; type: string; parts: number; name: string }>`
      SELECT file_key, type, parts, name FROM suggestion_files WHERE id = ${Number(parts[1]) || 0} AND complete`;
    if (!f) return json({ error: "Not found" }, 404);
    const store = evidenceStore(context);
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < f.parts; i++) {
          const chunk = await store.get(`${f.file_key}/${i}`, { type: "arrayBuffer" });
          if (chunk) controller.enqueue(new Uint8Array(chunk as ArrayBuffer));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": f.type, "Cache-Control": "private, max-age=3600", "Content-Disposition": `inline; filename="${f.name.replace(/"/g, "")}"` } });
  }

  if (parts[0] === "suggestions" && parts.length === 1 && req.method === "GET") {
    return json({ suggestions: await allSuggestions(db) });
  }

  if (parts[0] === "suggestions" && parts[1]) {
    const ref = clip(parts[1], 20);
    const [row] = await db.sql<{ id: number }>`SELECT id FROM suggestions WHERE ref = ${ref}`;
    if (!row) return json({ error: "Not found" }, 404);
    let body: Record<string, any> = {};
    try { body = await req.json(); } catch { /* empty body */ }

    if (parts[2] === "notes" && req.method === "POST") {
      const text = clip(body.text, 2000);
      if (!text) return json({ error: "Write a note first." }, 400);
      await db.sql`INSERT INTO suggestion_notes (suggestion_id, by_email, by_name, body) VALUES (${row.id}, ${me.email}, ${me.name}, ${text})`;
      await db.sql`INSERT INTO audit_log (actor, action, target) VALUES (${me.email}, 'suggestion.note', ${ref})`;
    } else if (!parts[2] && req.method === "PATCH") {
      const changes: Record<string, unknown> = {};
      if (body.status !== undefined && !STATUSES.includes(body.status)) return json({ error: "Unknown status" }, 400);
      if (body.assigned !== undefined) {
        changes.assigned = clip(body.assigned, 80);
        await db.sql`UPDATE suggestions SET assigned = ${changes.assigned as string}, updated_at = NOW() WHERE id = ${row.id}`;
      }
      if (body.visit !== undefined) {
        const v = /^\d{4}-\d{2}-\d{2}$/.test(String(body.visit)) ? String(body.visit) : null;
        changes.visit = v;
        await db.sql`UPDATE suggestions SET visit_date = ${v}, updated_at = NOW() WHERE id = ${row.id}`;
      }
      if (body.onboard !== undefined && typeof body.onboard === "object") {
        const o = body.onboard;
        const clean = {
          explained: !!o.explained, showed: !!o.showed, safety: !!o.safety, test: !!o.test,
          contact: o.contact === "trusted" ? "trusted" : "self",
          trusted: { name: clip(o.trusted?.name, 80), relation: clip(o.trusted?.relation, 60), phone: clip(o.trusted?.phone, 40) },
        };
        changes.onboard = clean;
        await db.sql`UPDATE suggestions SET onboard = ${JSON.stringify(clean)}::jsonb, updated_at = NOW() WHERE id = ${row.id}`;
      }
      if (body.status !== undefined) {
        // Verifying needs the full visit checklist (the same rule as the portal screen).
        if (body.status === "verified") {
          const [cur] = await db.sql<{ onboard: any }>`SELECT onboard FROM suggestions WHERE id = ${row.id}`;
          const o = cur.onboard || {};
          const ok = o.explained && o.showed && o.safety && o.test && (o.contact !== "trusted" || (o.trusted?.name && o.trusted?.phone));
          if (!ok) return json({ error: "Finish the visit checklist first." }, 400);
        }
        changes.status = body.status;
        await db.sql`UPDATE suggestions SET status = ${body.status}, updated_at = NOW() WHERE id = ${row.id}`;
      }
      const note = clip(body.note, 2000);
      if (note) await db.sql`INSERT INTO suggestion_notes (suggestion_id, by_email, by_name, body) VALUES (${row.id}, ${me.email}, ${me.name}, ${note})`;
      await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${me.email}, 'suggestion.update', ${ref}, ${JSON.stringify(changes)}::jsonb)`;
    } else {
      return json({ error: "Not allowed" }, 405);
    }

    const [r] = await db.sql`SELECT * FROM suggestions WHERE id = ${row.id}`;
    const notes = await db.sql`SELECT by_name, body, created_at FROM suggestion_notes WHERE suggestion_id = ${row.id} ORDER BY created_at`;
    const files = await filesFor(db, [row.id]);
    return json({ suggestion: shape(r as Record<string, any>, (notes as any[]).map((n) => ({ by: n.by_name, at: n.created_at, text: n.body })), files.get(row.id) || []) });
  }

  return json({ error: "Not found" }, 404);
};

export const config: Config = { path: "/api/portal/*" };
