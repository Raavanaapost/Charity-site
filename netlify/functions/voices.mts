// Public: vouches and star ratings on a project page (SURESH, 22 Nov 2026).
//   GET  /api/voices/:slug   who vouched (from the request's /e/ page and from the project page), the star rating and
//                            the comments the team has read
//   POST /api/voices/:slug   { kind: "vouch", name, relation: role|know|seen, role|how, phone, agree }
//                            { kind: "rating", name, stars: 1-5, comment, phone, agree }
// Anyone can vouch, with no limit (open vouching). Stars count at once; written words show once the team has read
// them, so no child's name or phone number reaches the page. Phones are kept for the team only; one phone gives one
// vouch and one rating per project (a new rating replaces the old one).
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";

type Row = Record<string, any>;
type DB = ReturnType<typeof getDatabase>;
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const phoneKey = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-9);
const REL: Record<string, string> = { know: "Knows the person who asked", seen: "Has seen the need" };

async function projectExists(db: DB, slug: string, req: Request) {
  const [m] = await db.sql<Row>`SELECT slug FROM site_projects WHERE slug = ${slug} AND NOT hidden`;
  if (m) return true;
  try {
    const r = await fetch(new URL("/projects.json", req.url));
    const d = await r.json();
    return (d.projects || []).some((p: Row) => p && p.slug === slug && !p.hidden);
  } catch { return false; }
}

async function request(db: DB, slug: string) {
  const [s] = await db.sql<Row>`SELECT id, reach, endorse_token FROM suggestions WHERE project_slug = ${slug} LIMIT 1`;
  return s || null;
}

async function view(db: DB, slug: string) {
  const s = await request(db, slug);
  const fromRequest = s ? ((await db.sql<Row>`SELECT name, relation, role, created_at FROM endorsements WHERE suggestion_id = ${s.id} AND NOT hidden ORDER BY created_at`) as Row[]) : [];
  const fromPage = (await db.sql<Row>`SELECT name, relation, role, created_at FROM project_voices WHERE slug = ${slug} AND kind = 'vouch' AND NOT hidden ORDER BY created_at`) as Row[];
  const vouches = [...fromRequest, ...fromPage].map((v) => ({ name: v.name, role: v.role || REL[v.relation] || "", inRole: v.relation === "role", at: v.created_at }));
  const rated = (await db.sql<Row>`SELECT name, stars, comment, comment_ok, updated_at FROM project_voices WHERE slug = ${slug} AND kind = 'rating' AND NOT hidden ORDER BY updated_at DESC`) as Row[];
  const count = rated.length, sum = rated.reduce((a, r) => a + Number(r.stars || 0), 0);
  const spread = [1, 2, 3, 4, 5].map((n) => rated.filter((r) => Number(r.stars) === n).length);
  const comments = rated.filter((r) => r.comment_ok && r.comment).map((r) => ({ name: r.name, stars: Number(r.stars), comment: r.comment, at: r.updated_at }));
  return { vouches, rating: { count, average: count ? Math.round((sum / count) * 10) / 10 : 0, spread }, comments, waiting: rated.filter((r) => r.comment && !r.comment_ok).length };
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
  if (!(await projectExists(db, slug, req))) return json({ ok: false, error: "We couldn't find this project." }, 404);

  const kind = f.kind === "rating" ? "rating" : f.kind === "vouch" ? "vouch" : "";
  if (!kind) return json({ ok: false, error: "Please choose vouch or rating." }, 400);
  const name = clip(f.name, 80), phone = clip(f.phone, 40), key = phoneKey(phone);
  if (name.length < 2) return json({ ok: false, error: "Please add your name." }, 400);
  if (key.length < 9) return json({ ok: false, error: "Please add a mobile number we can call." }, 400);
  if (f.agree !== true && f.agree !== "on" && f.agree !== "yes") return json({ ok: false, error: "Please tick the box to confirm." }, 400);
  const user = await getUser().catch(() => null);
  const memberEmail = user && user.email ? user.email.toLowerCase() : "";
  const s = await request(db, slug);

  if (kind === "vouch") {
    const relation = clip(f.relation, 10);
    if (!["role", "know", "seen"].includes(relation)) return json({ ok: false, error: "Please say how you know about this project." }, 400);
    const role = relation === "role" ? clip(f.role, 120) : clip(f.how, 120);
    if (relation === "role" && !role) return json({ ok: false, error: "Please add your role, for example Principal of the school." }, 400);
    if (s && key === phoneKey(s.reach)) return json({ ok: false, error: "This is the number that sent the request. Please ask other people to vouch for it." }, 409);
    if (s) {
      const [dup] = await db.sql<Row>`SELECT id FROM endorsements WHERE suggestion_id = ${s.id} AND phone_key = ${key}`;
      if (dup) return json({ ok: false, error: "This phone number has already vouched for this project." }, 409);
    }
    const added = await db.sql<Row>`
      INSERT INTO project_voices (slug, kind, name, relation, role, phone, phone_key, member_email)
      VALUES (${slug}, 'vouch', ${name}, ${relation}, ${role}, ${phone}, ${key}, ${memberEmail})
      ON CONFLICT (slug, kind, phone_key) DO NOTHING RETURNING id`;
    if (!(added as Row[]).length) return json({ ok: false, error: "This phone number has already vouched for this project." }, 409);
    await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES ('website', 'project.vouched', ${slug}, ${JSON.stringify({ name, relation, role })}::jsonb)`;
  } else {
    const stars = Math.round(Number(f.stars));
    if (!(stars >= 1 && stars <= 5)) return json({ ok: false, error: "Please choose 1 to 5 stars." }, 400);
    const comment = String(f.comment ?? "").replace(/[ \t]+/g, " ").trim().slice(0, 1000);
    await db.sql`
      INSERT INTO project_voices (slug, kind, name, stars, comment, phone, phone_key, member_email)
      VALUES (${slug}, 'rating', ${name}, ${stars}, ${comment}, ${phone}, ${key}, ${memberEmail})
      ON CONFLICT (slug, kind, phone_key) DO UPDATE SET name = EXCLUDED.name, stars = EXCLUDED.stars, comment = EXCLUDED.comment,
        comment_ok = FALSE, checked_by = '', member_email = EXCLUDED.member_email, updated_at = NOW()`;
    await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES ('website', 'project.rated', ${slug}, ${JSON.stringify({ name, stars, words: !!comment })}::jsonb)`;
  }
  return json({ ok: true, ...(await view(db, slug)) });
};

export const config: Config = {
  path: "/api/voices/*",
  method: ["GET", "POST"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 20 },
};
