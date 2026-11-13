// Family circle, stage 1 (SURESH, 13 Nov 2026): the routes under one family page. See moments.mts for the list.
// Kept apart from moments.mts so these (opened on every page view) can have a looser limit than making a new page.
// Added the same day (SURESH): invites in family words (to, relation, from), and holding one project per circle:
//   POST /api/moments/:code/project  { slug } hold this project for the circle ({ slug: "" } lets it go); organiser only
//   GET  /api/circle-claims          every held project: { slug: { name } }, so the directory can say "Being funded by"
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
type Row = Record<string, any>;
const REF = /^[a-z0-9]{6,16}$/;
const CHANNELS = ["whatsapp", "sms", "facebook", "instagram", "link"];
const member = async () => { const u = await getUser().catch(() => null); return u && u.email ? { email: u.email.toLowerCase(), name: String((u as any).name || (u as any).user_metadata?.full_name || "") } : null; };
const sameKey = (a: string, b: string) => {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};
async function findMoment(code: string) {
  if (!REF.test(code)) return null;
  const [m] = await getDatabase().sql<Row>`SELECT code, owner_key, owner_email, name, held_slug FROM moments WHERE code = ${code} AND NOT hidden`;
  return m || null;
}
const isOwner = (m: Row, req: Request, me: { email: string } | null) =>
  sameKey(String(m.owner_key || ""), (req.headers.get("x-owner-key") || "").trim()) || (!!me && !!m.owner_email && m.owner_email === me.email);
const readBody = async (req: Request): Promise<Record<string, unknown>> => { try { return await req.json(); } catch { return {}; } };

async function circleAction(code: string, action: string, req: Request) {
  const m = await findMoment(code);
  if (!m) return json({ ok: false }, 404);
  const db = getDatabase();
  const me = await member();

  if (action === "me" && req.method === "GET") {
    const [j] = me ? await db.sql<Row>`SELECT display_name, country FROM moment_members WHERE moment_code = ${code} AND email = ${me.email}` : [];
    return json({ ok: true, owner: isOwner(m, req, me), signedIn: !!me, suggest: me ? me.name : "", joined: !!j, name: j ? j.display_name : "", country: j ? j.country : "" });
  }

  if (action === "open" && req.method === "POST") {
    const b = await readBody(req), ref = String(b.ref || "");
    if (!REF.test(ref)) return json({ ok: true });
    await db.sql`UPDATE moment_invites SET opened_at = NOW() WHERE ref = ${ref} AND moment_code = ${code} AND opened_at IS NULL`;
    // Who it is to and from, so the page can greet them the way the family talks. Only someone holding this link sees it.
    const [i] = await db.sql<Row>`SELECT label, relation, from_name FROM moment_invites WHERE ref = ${ref} AND moment_code = ${code} AND NOT hidden`;
    return json({ ok: true, to: i ? i.label : "", relation: i ? i.relation : "", from: i ? i.from_name : "" });
  }

  if (action === "join" && req.method === "POST") {
    if (!me) return json({ ok: false, error: "Please sign in first." }, 401);
    const b = await readBody(req);
    const name = clip(b.name, 40);
    if (!name) return json({ ok: false, error: "Please add the name the family will see." }, 400);
    const country = clip(b.country, 40), ref = REF.test(String(b.ref || "")) ? String(b.ref) : "";
    await db.sql`INSERT INTO moment_members (moment_code, email, display_name, country, invite_ref) VALUES (${code}, ${me.email}, ${name}, ${country}, ${ref})
      ON CONFLICT (moment_code, email) DO UPDATE SET display_name = EXCLUDED.display_name, country = EXCLUDED.country`;
    if (ref) await db.sql`UPDATE moment_invites SET joined_at = NOW(), opened_at = COALESCE(opened_at, NOW()) WHERE ref = ${ref} AND moment_code = ${code} AND joined_at IS NULL`;
    return json({ ok: true });
  }

  if (action === "invites") {
    if (!isOwner(m, req, me)) return json({ ok: false, error: "Only the person who made this page can see its invites." }, 403);
    if (req.method === "POST") {
      const b = await readBody(req), ref = String(b.ref || "");
      if (!REF.test(ref)) return json({ ok: false, error: "Please try again." }, 400);
      const channel = CHANNELS.includes(String(b.channel)) ? String(b.channel) : "link";
      const [{ n }] = await db.sql<Row>`SELECT COUNT(*)::int AS n FROM moment_invites WHERE moment_code = ${code}`;
      if (n >= 500) return json({ ok: false, error: "This page has reached 500 invites." }, 400);
      await db.sql`INSERT INTO moment_invites (moment_code, ref, label, channel, relation, from_name)
        VALUES (${code}, ${ref}, ${clip(b.label, 60)}, ${channel}, ${clip(b.relation, 30)}, ${clip(b.from, 40)}) ON CONFLICT (ref) DO NOTHING`;
      return json({ ok: true, ref });
    }
    if (req.method === "GET") {
      const rows = await db.sql<Row>`SELECT i.ref, i.label, i.relation, i.channel, i.created_at, i.opened_at, i.joined_at,
          (SELECT display_name FROM moment_members mm WHERE mm.moment_code = i.moment_code AND mm.invite_ref = i.ref ORDER BY joined_at LIMIT 1) AS joined_as
        FROM moment_invites i WHERE i.moment_code = ${code} AND NOT i.hidden ORDER BY i.created_at DESC LIMIT 200`;
      return json({ ok: true, invites: (rows as Row[]).map((r) => ({
        ref: r.ref, label: r.label, relation: r.relation, channel: r.channel, sent: r.created_at,
        status: r.joined_at ? "joined" : r.opened_at ? "opened" : "sent", joinedAs: r.joined_as || "",
      })) });
    }
  }
  if (action === "project" && req.method === "POST") {
    if (!isOwner(m, req, me)) return json({ ok: false, error: "Only the person who made this page can choose its project." }, 403);
    const b = await readBody(req), slug = String(b.slug || "");
    if (slug === "") {
      await db.sql`UPDATE moments SET held_slug = '', held_at = NULL WHERE code = ${code}`;
      return json({ ok: true, slug: "" });
    }
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) return json({ ok: false, error: "Please choose a project from the list." }, 400);
    const [other] = await db.sql<Row>`SELECT name FROM moments WHERE held_slug = ${slug} AND code <> ${code} AND NOT hidden`;
    if (other) return json({ ok: false, taken: true, error: `${other.name}'s circle is already funding this project. Please choose another one.` }, 409);
    try {
      await db.sql`UPDATE moments SET held_slug = ${slug}, held_at = NOW(), project_slug = ${slug} WHERE code = ${code}`;
    } catch (e) {
      if (/duplicate|unique/i.test(String((e as Error).message))) return json({ ok: false, taken: true, error: "Another circle took this project a moment ago. Please choose another one." }, 409);
      throw e;
    }
    return json({ ok: true, slug });
  }
  return json({ error: "Not found" }, 404);
}

async function claims() {
  const rows = await getDatabase().sql<Row>`SELECT held_slug, name FROM moments WHERE held_slug <> '' AND NOT hidden`;
  const out: Record<string, { name: string }> = {};
  for (const r of rows as Row[]) out[r.held_slug] = { name: r.name };
  return Response.json({ ok: true, claims: out }, { headers: { "Cache-Control": "public, max-age=30" } });
}

export default async (req: Request) => {
  const parts = new URL(req.url).pathname.replace(/\/+$/, "").split("/");
  try {
    if (parts[2] === "circle-claims" && req.method === "GET") return await claims();
    if (parts.length === 5) return await circleAction(parts[3], parts[4], req);
    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error("moment-circle:", e);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
};

export const config: Config = {
  path: ["/api/moments/:code/me", "/api/moments/:code/invites", "/api/moments/:code/open", "/api/moments/:code/join", "/api/moments/:code/project", "/api/circle-claims"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 60 },
};
