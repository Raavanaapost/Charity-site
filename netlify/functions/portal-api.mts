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

const STATUSES = ["new", "visit", "verified", "approved", "declined", "project"];
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

// Like clip, but keeps line breaks (paragraphs of the story, one budget item per line).
const lines = (v: unknown, max: number) => String(v ?? "").split(/\r?\n/).map((l) => l.replace(/[ \t]+/g, " ").trim()).filter(Boolean).join("\n").slice(0, max);

const day = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");
const amount = (v: unknown) => Math.max(0, Math.round(Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0));
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "project";

// The drawing for a new project, picked from what the day is (never a photo of the children). Same list as endorse.js.
const ART: [RegExp, string][] = [[/kandy|temple of the tooth|perahera|dalada/i, "kandy"], [/beach|sea|ocean|casuarina/i, "beach"], [/bowl/i, "bowling"], [/zoo|animal|dehiwala/i, "zoo"],
  [/arcade|games|play ?zone|fun ?zone/i, "arcade"], [/mum|mother|women/i, "mums"], [/hill|mountain|waterfall|kovil|picnic|park|garden|trip|bus|excursion/i, "hills"]];
const artFor = (t: string) => { for (const [re, n] of ART) if (re.test(t)) return `/img/project-${n}.svg`; return "/img/hero-initiated.svg"; };

// A check still "running" after 16 minutes has died (background functions stop at 15), so it can be run again.
const stuck = (r: Record<string, any>) => r.ai_status === "running" && r.ai_at && Date.now() - new Date(r.ai_at).getTime() > 16 * 60e3;

// Every file is sorted into one of four kinds for the request dashboard.
const kindOf = (type: string) => type.startsWith("image/") ? "image" : type.startsWith("video/") ? "video" : type.startsWith("audio/") ? "audio" : "document";

async function filesFor(db: ReturnType<typeof getDatabase>, ids: number[]) {
  const by = new Map<number, unknown[]>();
  if (!ids.length) return by;
  const rows = await db.sql`SELECT id, suggestion_id, name, type, size FROM suggestion_files WHERE complete AND suggestion_id = ANY(${ids}::int[]) ORDER BY id`;
  for (const f of rows as { id: number; suggestion_id: number; name: string; type: string; size: number }[]) {
    const list = by.get(f.suggestion_id) || [];
    list.push({ id: f.id, name: f.name, type: f.type, size: f.size, kind: kindOf(f.type) });
    by.set(f.suggestion_id, list);
  }
  return by;
}

// Who vouched for each request through its endorse link (/e/<link>). Phone numbers are for the team only.
async function endorsementsFor(db: ReturnType<typeof getDatabase>, ids: number[]) {
  const by = new Map<number, unknown[]>();
  if (!ids.length) return by;
  const rows = await db.sql`SELECT suggestion_id, name, relation, role, phone, created_at FROM endorsements
    WHERE NOT hidden AND suggestion_id = ANY(${ids}::int[]) ORDER BY created_at`;
  for (const e of rows as Record<string, any>[]) {
    const list = by.get(e.suggestion_id) || [];
    list.push({ name: e.name, relation: e.relation, role: e.role, phone: e.phone, at: e.created_at });
    by.set(e.suggestion_id, list);
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
  const ids = (rows as { id: number }[]).map((r) => r.id);
  const files = await filesFor(db, ids);
  const endorsed = await endorsementsFor(db, ids);
  return (rows as Record<string, any>[]).map((r) => shape(r, bySid.get(r.id) || [], files.get(r.id) || [], endorsed.get(r.id) || []));
}

function shape(r: Record<string, any>, notes: unknown[], files: unknown[] = [], endorsements: unknown[] = []) {
  return {
    id: r.ref, received: r.received_at, status: r.status, assigned: r.assigned,
    visit: r.visit_date ? new Date(r.visit_date).toISOString().slice(0, 10) : "",
    title: r.title, category: r.category, focus: r.focus || [], description: r.description, location: r.location, city: r.city || "", village: r.village || "",
    children: r.children, contact: r.contact, reach: r.reach, trusted: r.trusted, additional: r.additional,
    onboard: r.onboard || {}, project: r.project_slug, notes, files, noEvidence: !!r.no_evidence,
    details: r.details || {}, called: day(r.called), takenAt: r.taken_at || "", verifiedBy: r.verified_by || "", verifiedAt: r.verified_at || "",
    champion: r.champion_id || null,
    approvedBy: r.approved_by || "", approvedAt: r.approved_at || "", approvedOverride: !!r.approved_override, plan: { lines: [], expect: [], ...(r.plan || {}) },
    memberEmail: r.member_email || "",
    endorseLink: r.endorse_token ? `/e/${r.endorse_token}` : "", endorsements,
    ai: stuck(r)
      ? { status: "failed", error: "The AI check stopped without an answer. Press Run the AI check again.", at: r.ai_at, draft: r.ai_draft || {} }
      : { status: r.ai_status || "", error: r.ai_error || "", at: r.ai_at, draft: r.ai_draft || {} },
    profile: r.profile || {}, shareOk: !!r.share_ok, shareOkBy: r.share_ok_by || "", shareOkAt: r.share_ok_at,
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
    return new Response(stream, { headers: { "Content-Type": f.type, "Cache-Control": "private, max-age=3600", "Content-Disposition": `inline; filename="${f.name.replace(/"/g, "")}"`,
      // Never let the browser treat a file as something else, and never let it run scripts from it.
      "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'" } });
  }

  // Champions: trusted local volunteers who visit requests (SURESH, 10 Nov 2026).
  if (parts[0] === "champions") {
    const DISTRICTS = ["Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
      "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
      "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"];
    const read = (b: Record<string, any>) => ({
      name: clip(b.name, 80), phone: clip(b.phone, 40), email: clip(b.email, 120).toLowerCase(),
      district: DISTRICTS.includes(b.district) ? b.district : "", areas: clip(b.areas, 300), note: clip(b.note, 500),
    });
    const list = async () => db.sql`
      SELECT c.*, (SELECT COUNT(*)::int FROM suggestions s WHERE s.champion_id = c.id) AS visits
      FROM champions c ORDER BY c.active DESC, c.district, c.name`;
    if (req.method === "GET" && !parts[1]) return json({ champions: await list(), districts: DISTRICTS });
    let b: Record<string, any> = {};
    try { b = await req.json(); } catch { /* empty */ }
    if (req.method === "POST" && !parts[1]) {
      const c = read(b);
      if (!c.name || !c.phone || !c.district) return json({ error: "Add a name, a phone number and a district." }, 400);
      await db.sql`INSERT INTO champions (name, phone, email, district, areas, note, added_by) VALUES (${c.name}, ${c.phone}, ${c.email}, ${c.district}, ${c.areas}, ${c.note}, ${me.email})`;
      await db.sql`INSERT INTO audit_log (actor, action, target) VALUES (${me.email}, 'champion.add', ${c.name})`;
      return json({ champions: await list() });
    }
    if (req.method === "PATCH" && parts[1]) {
      const id = Number(parts[1]) || 0;
      if (b.active !== undefined) await db.sql`UPDATE champions SET active = ${!!b.active} WHERE id = ${id}`;
      if (b.name !== undefined) {
        const c = read(b);
        if (!c.name || !c.phone || !c.district) return json({ error: "Add a name, a phone number and a district." }, 400);
        await db.sql`UPDATE champions SET name = ${c.name}, phone = ${c.phone}, email = ${c.email}, district = ${c.district}, areas = ${c.areas}, note = ${c.note} WHERE id = ${id}`;
      }
      await db.sql`INSERT INTO audit_log (actor, action, target) VALUES (${me.email}, 'champion.update', ${String(id)})`;
      return json({ champions: await list() });
    }
    return json({ error: "Not allowed" }, 405);
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

    if (parts[2] === "analyse" && req.method === "POST") {
      // Start the AI check: mark it running here, where the team sign-in is checked, then hand it to the background
      // function with a one-time job code.
      if (!Netlify.env.get("GEMINI_API_KEY")) {
        await db.sql`UPDATE suggestions SET ai_status = 'failed', ai_error = 'GEMINI_API_KEY is not set in Netlify for this site yet.', ai_at = NOW() WHERE id = ${row.id}`;
        return json({ error: "GEMINI_API_KEY is not set in Netlify for this site yet." }, 503);
      }
      const job = crypto.randomUUID();
      await db.sql`UPDATE suggestions SET ai_status = 'running', ai_error = '', ai_job = ${job}, ai_by = ${me.email}, ai_at = NOW() WHERE id = ${row.id}`;
      const res = await fetch(new URL("/.netlify/functions/analyse-background", req.url), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref, job }),
      }).catch((e) => ({ ok: false, status: 0, statusText: String(e) }) as Response);
      if (!res.ok) {
        const msg = `The AI check could not start (${res.status || "no answer"}).`;
        await db.sql`UPDATE suggestions SET ai_status = 'failed', ai_error = ${msg}, ai_job = '' WHERE id = ${row.id}`;
        return json({ error: msg }, 502);
      }
      return json({ ok: true, started: true }, 202);
    }

    // Step 6: create the Initiated project from the request. It shows on the website straight away (next to projects.json).
    if (parts[2] === "project" && req.method === "POST") {
      const [r] = await db.sql<Record<string, any>>`SELECT * FROM suggestions WHERE id = ${row.id}`;
      if (r.status === "project" && r.project_slug) return json({ ok: true, slug: r.project_slug });
      if (r.status !== "approved") return json({ error: "It needs to be approved first." }, 400);
      const d = r.details || {}, q = r.plan || {}, pf = r.profile || {};
      const budget = (q.lines || []).filter((x: any) => x.item && x.amount > 0);
      if (!budget.length || !(q.expect || []).length) return json({ error: "Add the budget and what the organisers hope for first." }, 400);
      const title = pf.title || d.title || r.title;
      const story = String(d.story || pf.summary || r.description || "").trim();
      let slug = slugify(title);
      const taken = await db.sql<{ slug: string }>`SELECT slug FROM site_projects WHERE slug LIKE ${slug + "%"}`;
      if ((taken as any[]).some((x) => x.slug === slug)) slug = `${slug}-${r.ref.toLowerCase()}`;
      const vouched = await db.sql<Record<string, any>>`SELECT name, relation, role FROM endorsements WHERE suggestion_id = ${row.id} AND NOT hidden ORDER BY created_at`;
      const place = pf.place || [r.village, r.city].filter(Boolean).join(", ") || r.location;
      const data = {
        title, slug, hidden: false, featured: false, theme: "Trips & Events", status: "Planning",
        location: place, city: r.city || String(place).split(",").pop()!.trim(), organization: d.org || "Raavanaa",
        started: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        reach: pf.children || r.children, verified: true, currency: "Rs ",
        budget, goal: budget.reduce((a: number, x: any) => a + x.amount, 0), funders: [],
        date_set: false, booked: false, volunteers: false, steps: [],
        tagline: pf.tagline || "", summary: pf.summary ? String(pf.summary).split("\n")[0] : story.split("\n")[0],
        story: `## The need and the plan\n\n${story}`, cover: artFor([title, pf.activity, story].join(" ")),
        expectations: q.expect.map((text: string) => ({ text, result: "", note: "" })), impact: [], updates: [], photos: [], media: [],
        vouched: (vouched as any[]).map((v) => ({ name: v.name, role: v.role || (v.relation === "know" ? "Knows the person who asked" : "Has seen the need") })),
        people: {
          requested_by: String(r.contact || "").split(/[,(]/)[0].trim(), requested_on: day(r.received_at),
          verified_by: r.verified_by, verified_on: day(r.verified_at), approved_by: r.approved_by, approved_on: day(r.approved_at),
        },
        from_request: r.ref,
      };
      await db.sql`INSERT INTO site_projects (slug, suggestion_id, data, created_by) VALUES (${slug}, ${row.id}, ${JSON.stringify(data)}::jsonb, ${me.email})`;
      await db.sql`UPDATE suggestions SET status = 'project', project_slug = ${slug}, updated_at = NOW() WHERE id = ${row.id}`;
      await db.sql`INSERT INTO suggestion_notes (suggestion_id, by_email, by_name, body) VALUES (${row.id}, ${me.email}, ${me.name}, ${"Turned into an Initiated project: /projects/" + slug})`;
      await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${me.email}, 'suggestion.project', ${ref}, ${JSON.stringify({ slug })}::jsonb)`;
      return json({ ok: true, slug });
    }

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
      // Step 1: who takes it (and when).
      if (body.assigned !== undefined) await db.sql`UPDATE suggestions SET taken_at = ${changes.assigned ? new Date().toISOString() : null} WHERE id = ${row.id}`;
      // Step 3: which Champion visits.
      if (body.champion !== undefined) {
        const cid = Number(body.champion) || null;
        changes.champion = cid;
        await db.sql`UPDATE suggestions SET champion_id = ${cid}, updated_at = NOW() WHERE id = ${row.id}`;
      }
      // Step 2: the first call and the details it collects. The exact place stays private to the team.
      if (body.details !== undefined && typeof body.details === "object") {
        const d = body.details;
        const clean = { title: clip(d.title, 120), story: lines(d.story, 4000), org: clip(d.org, 120), place: clip(d.place, 200), evidenceSeen: !!d.evidenceSeen };
        changes.details = { title: clean.title };
        await db.sql`UPDATE suggestions SET details = ${JSON.stringify(clean)}::jsonb, updated_at = NOW() WHERE id = ${row.id}`;
      }
      if (body.called !== undefined) {
        const c = /^\d{4}-\d{2}-\d{2}$/.test(String(body.called)) ? String(body.called) : null;
        changes.called = c;
        await db.sql`UPDATE suggestions SET called = ${c}, updated_at = NOW() WHERE id = ${row.id}`;
      }
      // Step 5: the budget, line by line, and what the organisers hope for.
      if (body.plan !== undefined && typeof body.plan === "object") {
        const q = body.plan;
        const clean = {
          lines: (Array.isArray(q.lines) ? q.lines : []).slice(0, 30).map((x: any) => ({ item: clip(x?.item, 160), amount: amount(x?.amount) })).filter((x: any) => x.item || x.amount),
          expect: (Array.isArray(q.expect) ? q.expect : []).slice(0, 6).map((x: unknown) => clip(x, 200)).filter(Boolean),
        };
        changes.plan = { lines: clean.lines.length, total: clean.lines.reduce((a: number, x: any) => a + x.amount, 0) };
        await db.sql`UPDATE suggestions SET plan = ${JSON.stringify(clean)}::jsonb, updated_at = NOW() WHERE id = ${row.id}`;
      }
      if (body.status !== undefined) {
        const [cur0] = await db.sql<Record<string, any>>`SELECT status, verified_by FROM suggestions WHERE id = ${row.id}`;
        // Step 4: only an admin approves, and not the person who visited (unless they say they did both).
        if (body.status === "approved") {
          if (!me.admin) return json({ error: "Only an admin can approve." }, 403);
          if (cur0.status !== "verified") return json({ error: "It needs the visit first." }, 400);
          const own = !!cur0.verified_by && cur0.verified_by === me.name;
          if (own && body.override !== true) return json({ error: "You verified this visit, so another admin should approve it." }, 403);
          await db.sql`UPDATE suggestions SET approved_by = ${me.name}, approved_at = NOW(), approved_override = ${own} WHERE id = ${row.id}`;
        }
        if (body.status === "project") return json({ error: "Use Create the Initiated project." }, 400);
      }
      if (body.status !== undefined) {
        // Verifying needs the full visit checklist (the same rule as the portal screen).
        if (body.status === "verified") {
          const [cur] = await db.sql<{ onboard: any }>`SELECT onboard FROM suggestions WHERE id = ${row.id}`;
          const o = cur.onboard || {};
          const ok = o.explained && o.showed && o.safety && o.test && (o.contact !== "trusted" || (o.trusted?.name && o.trusted?.phone));
          if (!ok) return json({ error: "Finish the visit checklist first." }, 400);
          await db.sql`UPDATE suggestions SET verified_by = ${me.name}, verified_at = NOW() WHERE id = ${row.id}`;
        }
        changes.status = body.status;
        await db.sql`UPDATE suggestions SET status = ${body.status}, updated_at = NOW() WHERE id = ${row.id}`;
      }
      // Approve the request's page for sharing and vouching, with the profile the team checked.
      if (body.share !== undefined) {
        const ok = body.share === true;
        const p = (body.profile && typeof body.profile === "object") ? body.profile : {};
        const profile = {
          title: clip(p.title, 120), tagline: clip(p.tagline, 200), summary: lines(p.summary, 2000), place: clip(p.place, 120), children: clip(p.children, 60),
          when: clip(p.when, 80), activity: clip(p.activity, 300), budget: lines(p.budget, 1000), budget_total: clip(p.budget_total, 60),
        };
        if (ok && !profile.title) return json({ error: "Give the page a title first." }, 400);
        changes.share = ok;
        if (ok) await db.sql`UPDATE suggestions SET share_ok = TRUE, share_ok_by = ${me.name}, share_ok_at = NOW(), profile = ${JSON.stringify(profile)}::jsonb, updated_at = NOW() WHERE id = ${row.id}`;
        else await db.sql`UPDATE suggestions SET share_ok = FALSE, updated_at = NOW() WHERE id = ${row.id}`;
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
    const endorsed = await endorsementsFor(db, [row.id]);
    return json({ suggestion: shape(r as Record<string, any>, (notes as any[]).map((n) => ({ by: n.by_name, at: n.created_at, text: n.body })), files.get(row.id) || [], endorsed.get(row.id) || []) });
  }

  return json({ error: "Not found" }, 404);
};

export const config: Config = { path: "/api/portal/*" };
