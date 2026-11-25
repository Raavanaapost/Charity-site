// Public: vouches, star ratings and comments on a project page (SURESH, 22 Nov 2026).
//   GET  /api/voices/:slug   who vouched (from the request's /e/ page and from the project page), the star rating and
//                            the comments
//   POST /api/voices/:slug   signed in only, no phone or other personal details:
//                            { kind: "vouch", name, relation: role|know|seen, how }          any stage, one per account
//                            { kind: "rating", name, involved, stars: 1-5, comment }        Impact projects only, one per account
//                            { kind: "comment", name, comment }                             any stage, as many as they like
// SURESH 22 Nov: "For comment, you already should have been logged in. And don't need any personal information.
// People just will comment." The account is the identity (email confirmed at sign-up, or Google). Words show at
// once; the team can hide anything false or unkind in the portal (Vouches & ratings). Set CHECK_FIRST to true to
// hold written words until the team has read them, as on 22 Nov morning.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { whoIs } from "../lib/whois.mts";

const CHECK_FIRST = false;
type Row = Record<string, any>;
type DB = ReturnType<typeof getDatabase>;
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const text = (v: unknown, max: number) => String(v ?? "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const REL: Record<string, string> = { know: "Knows the people behind it", seen: "Has seen the need" };

// The project as the website shows it (projects.json wins over the portal's copy, like on the page), or null.
async function projectOf(db: DB, slug: string, req: Request): Promise<Row | null> {
  try {
    const r = await fetch(new URL("/projects.json", req.url));
    const d = await r.json();
    const p = (d.projects || []).find((x: Row) => x && x.slug === slug && !x.hidden);
    if (p) return p;
  } catch { /* fall through to the portal's projects */ }
  const [m] = await db.sql<Row>`SELECT data FROM site_projects WHERE slug = ${slug} AND NOT hidden`;
  return m ? m.data || {} : null;
}
// Ratings open once the day has happened (Impact), for the people involved (SURESH 22 Nov 2026: "Lets have it after
// the day happened. Impact projects. People involved can give star").
const isImpact = (p: Row) => /complete/i.test(String(p.status || ""));
const INVOLVED: Record<string, string> = { day: "Was there on the day", parent: "Parent or teacher", gave: "Gave to it", organised: "Helped organise it", community: "From the community there" };

async function request(db: DB, slug: string) {
  const [s] = await db.sql<Row>`SELECT id, reach, member_email, endorse_token FROM suggestions WHERE project_slug = ${slug} LIMIT 1`;
  return s || null;
}

async function view(db: DB, slug: string) {
  const s = await request(db, slug);
  const fromRequest = s ? ((await db.sql<Row>`SELECT name, relation, role, created_at FROM endorsements WHERE suggestion_id = ${s.id} AND NOT hidden ORDER BY created_at`) as Row[]) : [];
  const fromPage = (await db.sql<Row>`SELECT name, relation, role, created_at FROM project_voices WHERE slug = ${slug} AND kind = 'vouch' AND NOT hidden ORDER BY created_at`) as Row[];
  const vouches = [...fromRequest, ...fromPage].map((v) => ({ name: v.name, role: v.role || REL[v.relation] || "", inRole: v.relation === "role", at: v.created_at }));
  const rated = (await db.sql<Row>`SELECT stars FROM project_voices WHERE slug = ${slug} AND kind = 'rating' AND NOT hidden`) as Row[];
  const count = rated.length, sum = rated.reduce((a, r) => a + Number(r.stars || 0), 0);
  const spread = [1, 2, 3, 4, 5].map((n) => rated.filter((r) => Number(r.stars) === n).length);
  const words = (await db.sql<Row>`
    SELECT kind, name, role, stars, comment, comment_ok, updated_at FROM project_voices
    WHERE slug = ${slug} AND kind IN ('rating', 'comment') AND comment <> '' AND NOT hidden ORDER BY updated_at DESC LIMIT 200`) as Row[];
  const comments = words.filter((r) => r.comment_ok || !CHECK_FIRST)
    .map((r) => ({ name: r.name, involved: r.kind === "rating" ? r.role : "", stars: r.kind === "rating" ? Number(r.stars) : 0, comment: r.comment, at: r.updated_at }));
  return { vouches, rating: { count, average: count ? Math.round((sum / count) * 10) / 10 : 0, spread }, comments };
}

export default async (req: Request) => {
  const slug = decodeURIComponent(new URL(req.url).pathname.replace(/^\/api\/voices\/?/, "").split("/")[0] || "").toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,90}$/.test(slug)) return json({ ok: false, error: "Unknown project." }, 404);
  const db = getDatabase();
  if (req.method === "GET") return Response.json({ ok: true, ...(await view(db, slug)) }, { headers: { "Cache-Control": "public, max-age=30" } });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  let f: Row;
  try { f = await req.json(); } catch { return json({ ok: false, error: "Could not read the form." }, 400); }
  if (clip(f["bot-field"], 10)) return json({ ok: true, ...(await view(db, slug)) }); // robots fill the hidden field
  const user = await whoIs(req);
  if (!user) return json({ ok: false, error: "Please sign in first.", signin: true }, 401);
  const project = await projectOf(db, slug, req);
  if (!project) return json({ ok: false, error: "We couldn't find this project." }, 404);

  const kind = ["vouch", "rating", "comment"].includes(f.kind) ? String(f.kind) : "";
  if (!kind) return json({ ok: false, error: "Please choose vouch, rating or comment." }, 400);
  const email = user.email.toLowerCase(), key = "acct:" + email;
  const meta = ((user as Row).user_metadata || (user as Row).metadata || {}) as Row;
  const name = clip(f.name, 80) || clip(meta.full_name || meta.name || (user as Row).name, 80) || email.split("@")[0];
  const s = await request(db, slug);

  if (kind === "vouch") {
    const relation = clip(f.relation, 10);
    if (!["role", "know", "seen"].includes(relation)) return json({ ok: false, error: "Please say how you know about this project." }, 400);
    const role = clip(f.how ?? f.role, 120);
    if (relation === "role" && !role) return json({ ok: false, error: "Please add your role, for example Principal of the school." }, 400);
    if (s && s.member_email && s.member_email === email) return json({ ok: false, error: "You sent this request, so please ask other people to vouch for it." }, 409);
    if (s) {
      const [dup] = await db.sql<Row>`SELECT id FROM endorsements WHERE suggestion_id = ${s.id} AND (phone_key = ${key} OR (member_email <> '' AND member_email = ${email}))`;
      if (dup) return json({ ok: false, error: "You have already vouched for this project." }, 409);
    }
    const added = await db.sql<Row>`
      INSERT INTO project_voices (slug, kind, name, relation, role, phone_key, member_email)
      VALUES (${slug}, 'vouch', ${name}, ${relation}, ${role}, ${key}, ${email})
      ON CONFLICT (slug, kind, phone_key) WHERE kind <> 'comment' DO NOTHING RETURNING id`;
    if (!(added as Row[]).length) return json({ ok: false, error: "You have already vouched for this project." }, 409);
    await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${email}, 'project.vouched', ${slug}, ${JSON.stringify({ name, relation, role })}::jsonb)`;
  } else if (kind === "rating") {
    if (!isImpact(project)) return json({ ok: false, error: "Ratings open once the day has happened." }, 409);
    const involved = INVOLVED[clip(f.involved, 20)];
    if (!involved) return json({ ok: false, error: "Please say how you were involved." }, 400);
    const stars = Math.round(Number(f.stars));
    if (!(stars >= 1 && stars <= 5)) return json({ ok: false, error: "Please choose 1 to 5 stars." }, 400);
    const comment = text(f.comment, 1000);
    await db.sql`
      INSERT INTO project_voices (slug, kind, name, role, stars, comment, phone_key, member_email)
      VALUES (${slug}, 'rating', ${name}, ${involved}, ${stars}, ${comment}, ${key}, ${email})
      ON CONFLICT (slug, kind, phone_key) WHERE kind <> 'comment' DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, stars = EXCLUDED.stars,
        comment = EXCLUDED.comment, comment_ok = FALSE, checked_by = '', updated_at = NOW()`;
    await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${email}, 'project.rated', ${slug}, ${JSON.stringify({ name, stars, words: !!comment })}::jsonb)`;
  } else {
    const comment = text(f.comment, 1000);
    if (comment.length < 2) return json({ ok: false, error: "Please write your comment." }, 400);
    await db.sql`INSERT INTO project_voices (slug, kind, name, comment, phone_key, member_email) VALUES (${slug}, 'comment', ${name}, ${comment}, ${key}, ${email})`;
    await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${email}, 'project.comment', ${slug}, ${JSON.stringify({ name })}::jsonb)`;
  }
  return json({ ok: true, ...(await view(db, slug)) });
};

export const config: Config = {
  path: "/api/voices/*",
  method: ["GET", "POST"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 20 },
};
