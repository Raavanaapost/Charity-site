// Organiser agreement, saved against each project (SURESH 27 Nov 2026).
//   POST   /api/agree                              a signature from /agree (public; the page also sends the Netlify form,
//                                                  so the team still gets the email)
//   GET    /api/agree/person/:token                 who a personal link is for (fills in the name and role on the page)
//   GET    /api/agree/status/:slug                  public: how many have signed (the tick on the project page; no names)
//   GET    /api/agreements                          team: every project's agreement count (dashboard, tracker list)
//   GET    /api/agreements/:slug                    team: the tracker for one project (people, signatures, steps)
//   POST   /api/agreements/:slug/people             team: add someone who must sign {name, role, contact, in_charge}
//   PATCH  /api/agreements/people/:id               team: {asked: true} notes the link was sent; {removed: true} takes them off
//   POST   /api/agreements/:slug/signatures         team: a signature that came by email {name, role, organisation, phone, signed_at, person_id}
//   PATCH  /api/agreements/signatures/:id           team: {hidden: true|false}
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { teamAccess } from "../lib/team-access.mts";
import data from "../../projects.json" with { type: "json" };

type Row = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
const FILE_SLUGS = new Set(((data as { projects?: { slug?: string }[] }).projects || []).map((p) => p && p.slug).filter(Boolean) as string[]);

async function projectExists(db: ReturnType<typeof getDatabase>, slug: string) {
  if (!SLUG.test(slug)) return false;
  if (FILE_SLUGS.has(slug)) return true;
  const r = await db.sql`SELECT 1 FROM site_projects WHERE slug = ${slug} LIMIT 1`;
  return r.length > 0;
}
const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z0-9஀-௿]+/g, " ").trim();

// Each person on the list counts as signed when a signature is tied to their link, or carries the same name.
function matchPeople(people: Row[], sigs: Row[]) {
  return people.map((p) => {
    const s = sigs.find((x) => x.person_id === p.id) || (p.name ? sigs.find((x) => !x.person_id && norm(x.name) === norm(p.name)) : undefined);
    return { ...p, signed: s ? { id: s.id, name: s.name, at: s.signed_at, source: s.source } : null };
  });
}

// Small reads for the other tracker steps. Each one may be missing on a database that has not caught up yet.
async function safe<T>(f: () => Promise<T>, d: T): Promise<T> { try { return await f(); } catch { return d; } }

async function tracker(db: ReturnType<typeof getDatabase>, slug: string) {
  const people = (await db.sql`SELECT id, name, role, contact, in_charge, token, added_by, created_at, asked_at FROM agreement_people
    WHERE slug = ${slug} AND NOT removed ORDER BY in_charge DESC, created_at`) as Row[];
  const sigs = (await db.sql`SELECT id, person_id, name, role, organisation, phone, language, version, source, added_by, signed_at, hidden
    FROM agreement_signatures WHERE slug = ${slug} ORDER BY signed_at`) as Row[];
  const live = sigs.filter((s) => !s.hidden);
  const site = await safe(async () => ((await db.sql`SELECT suggestion_id, created_by, created_at FROM site_projects WHERE slug = ${slug}`) as Row[])[0] || null, null as Row | null);
  const sug = site?.suggestion_id ? await safe(async () => ((await db.sql`SELECT id, ref, contact, reach, request_type, incharge_name, incharge_phone, incharge_email, received_at
    FROM suggestions WHERE id = ${site.suggestion_id}`) as Row[])[0] || null, null as Row | null) : null;
  const vouches = sug ? await safe(async () => (await db.sql`SELECT name, role, created_at FROM endorsements WHERE suggestion_id = ${sug.id} AND NOT hidden ORDER BY created_at`) as Row[], [] as Row[]) : [];
  const receipts = await safe(async () => ((await db.sql`SELECT COUNT(*)::int AS n, COALESCE(SUM(amount), 0)::float AS total FROM project_updates WHERE slug = ${slug} AND kind = 'receipt' AND NOT hidden`) as Row[])[0], { n: 0, total: 0 });
  const thanks = await safe(async () => ((await db.sql`SELECT COUNT(*)::int AS n, COUNT(opened_at)::int AS opened FROM sponsor_thanks WHERE slug = ${slug} AND NOT hidden`) as Row[])[0], { n: 0, opened: 0 });
  const handed = await safe(async () => ((await db.sql`SELECT COUNT(*)::int AS n, COALESCE(SUM(amount), 0)::float AS total FROM money_handovers WHERE slug = ${slug}`) as Row[])[0], null as Row | null);
  return {
    slug,
    people: matchPeople(people, live),
    signatures: sigs,
    request: sug ? { ref: sug.ref, by: String(sug.contact || "").split(/[,(]/)[0].trim(), at: sug.received_at, type: sug.request_type,
      in_charge: sug.incharge_name ? { name: sug.incharge_name, phone: sug.incharge_phone, email: sug.incharge_email } : null } : null,
    approved: site ? { by: site.created_by, at: site.created_at } : null,
    vouches: vouches.map((v) => ({ name: v.name, role: v.role, at: v.created_at })),
    receipts, thanks, handed,
  };
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean); // ["api","agree",...] or ["api","agreements",...]
  const db = getDatabase();
  const m = req.method;

  // ---------- Public: the /agree page ----------
  if (parts[1] === "agree") {
    if (m === "POST" && parts.length === 2) {
      let b: Row = {}; try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
      if (b["bot-field"]) return json({ ok: true });
      const slug = clip(b.project, 100), name = clip(b.name, 120), sign = clip(b.signature, 120);
      if (!name || !sign || !/yes/i.test(String(b.agreed || ""))) return json({ error: "Please add your name, tick and sign." }, 400);
      if (!(await projectExists(db, slug))) return json({ error: "Unknown project" }, 400);
      let personId: number | null = null;
      const t = clip(b.t, 40);
      if (t) { const [p] = (await db.sql`SELECT id FROM agreement_people WHERE token = ${t} AND slug = ${slug} AND NOT removed`) as Row[]; if (p) personId = p.id; }
      // The same person signing twice from the same link keeps one record.
      if (personId) {
        const [had] = (await db.sql`SELECT id FROM agreement_signatures WHERE person_id = ${personId} AND NOT hidden`) as Row[];
        if (had) return json({ ok: true, again: true });
      }
      await db.sql`INSERT INTO agreement_signatures (slug, person_id, name, role, organisation, phone, language, version, source)
        VALUES (${slug}, ${personId}, ${name}, ${clip(b.role, 60)}, ${clip(b.organisation, 160)}, ${clip(b.phone, 40)}, ${clip(b.language, 20) || "English"}, ${clip(b.agreement_version, 60)}, 'page')`;
      return json({ ok: true });
    }
    if (m === "GET" && parts[2] === "person" && parts[3]) {
      const [p] = (await db.sql`SELECT slug, name, role FROM agreement_people WHERE token = ${clip(parts[3], 40)} AND NOT removed`) as Row[];
      return p ? json(p) : json({ error: "Not found" }, 404);
    }
    if (m === "GET" && parts[2] === "status" && parts[3]) {
      const slug = clip(parts[3], 100);
      const [r] = (await db.sql`SELECT COUNT(*)::int AS n FROM agreement_signatures WHERE slug = ${slug} AND NOT hidden`) as Row[];
      const [need] = (await db.sql`SELECT COUNT(*)::int AS n FROM agreement_people WHERE slug = ${slug} AND NOT removed`) as Row[];
      return Response.json({ signed: r?.n || 0, people: need?.n || 0 }, { headers: { "Cache-Control": "public, max-age=60" } });
    }
    return json({ error: "Not found" }, 404);
  }

  // ---------- Team only ----------
  const me = await teamAccess();
  if (!me) return json({ error: "Please sign in to the portal." }, 401);
  const who = me.name || me.email;

  if (m === "GET" && parts.length === 2) {
    const sig = (await db.sql`SELECT slug, COUNT(*)::int AS n FROM agreement_signatures WHERE NOT hidden GROUP BY slug`) as Row[];
    const ppl = (await db.sql`SELECT slug, COUNT(*)::int AS n FROM agreement_people WHERE NOT removed GROUP BY slug`) as Row[];
    const out: Record<string, { signed: number; people: number }> = {};
    for (const r of sig) out[r.slug] = { signed: r.n, people: 0 };
    for (const r of ppl) out[r.slug] = { signed: out[r.slug]?.signed || 0, people: r.n };
    return json({ projects: out });
  }
  if (m === "GET" && parts.length === 3) {
    const slug = clip(parts[2], 100);
    if (!SLUG.test(slug)) return json({ error: "Not found" }, 404);
    return json(await tracker(db, slug));
  }
  if (m === "POST" && parts[3] === "people") {
    const slug = clip(parts[2], 100);
    if (!(await projectExists(db, slug))) return json({ error: "Unknown project" }, 400);
    let b: Row = {}; try { b = await req.json(); } catch { /* empty */ }
    const role = clip(b.role, 60);
    if (!role) return json({ error: "Please choose their role." }, 400);
    await db.sql`INSERT INTO agreement_people (slug, name, role, contact, in_charge, added_by)
      VALUES (${slug}, ${clip(b.name, 120)}, ${role}, ${clip(b.contact, 120)}, ${!!b.in_charge}, ${who})`;
    return json(await tracker(db, slug));
  }
  if (m === "PATCH" && parts[2] === "people" && parts[3]) {
    const id = parseInt(parts[3], 10);
    let b: Row = {}; try { b = await req.json(); } catch { /* empty */ }
    const [p] = (await db.sql`SELECT slug FROM agreement_people WHERE id = ${id}`) as Row[];
    if (!p) return json({ error: "Not found" }, 404);
    if (b.asked) await db.sql`UPDATE agreement_people SET asked_at = NOW() WHERE id = ${id}`;
    if (b.removed === true) await db.sql`UPDATE agreement_people SET removed = TRUE WHERE id = ${id}`;
    if (typeof b.in_charge === "boolean") await db.sql`UPDATE agreement_people SET in_charge = ${b.in_charge} WHERE id = ${id}`;
    if (typeof b.name === "string") await db.sql`UPDATE agreement_people SET name = ${clip(b.name, 120)} WHERE id = ${id}`;
    if (typeof b.contact === "string") await db.sql`UPDATE agreement_people SET contact = ${clip(b.contact, 120)} WHERE id = ${id}`;
    return json(await tracker(db, p.slug));
  }
  if (m === "POST" && parts[3] === "signatures") {
    const slug = clip(parts[2], 100);
    if (!(await projectExists(db, slug))) return json({ error: "Unknown project" }, 400);
    let b: Row = {}; try { b = await req.json(); } catch { /* empty */ }
    const name = clip(b.name, 120);
    if (!name) return json({ error: "Please add their name." }, 400);
    const at = b.signed_at && !isNaN(Date.parse(b.signed_at)) ? new Date(b.signed_at).toISOString() : new Date().toISOString();
    const pid = b.person_id ? parseInt(b.person_id, 10) || null : null;
    await db.sql`INSERT INTO agreement_signatures (slug, person_id, name, role, organisation, phone, language, version, source, added_by, signed_at)
      VALUES (${slug}, ${pid}, ${name}, ${clip(b.role, 60)}, ${clip(b.organisation, 160)}, ${clip(b.phone, 40)}, ${clip(b.language, 20) || "English"}, ${clip(b.version, 60) || "v1 26 Nov 2026 (9 points)"}, 'email', ${who}, ${at})`;
    return json(await tracker(db, slug));
  }
  if (m === "PATCH" && parts[2] === "signatures" && parts[3]) {
    const id = parseInt(parts[3], 10);
    let b: Row = {}; try { b = await req.json(); } catch { /* empty */ }
    const [s] = (await db.sql`SELECT slug FROM agreement_signatures WHERE id = ${id}`) as Row[];
    if (!s) return json({ error: "Not found" }, 404);
    if (typeof b.hidden === "boolean") await db.sql`UPDATE agreement_signatures SET hidden = ${b.hidden} WHERE id = ${id}`;
    return json(await tracker(db, s.slug));
  }
  return json({ error: "Not found" }, 404);
};

export const config: Config = { path: ["/api/agree", "/api/agree/*", "/api/agreements", "/api/agreements/*"] };
