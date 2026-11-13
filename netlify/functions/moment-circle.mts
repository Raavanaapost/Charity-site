// Family circle, stage 1 (SURESH, 13 Nov 2026): the routes under one family page. See moments.mts for the list.
// Kept apart from moments.mts so these (opened on every page view) can have a looser limit than making a new page.
// Added the same day (SURESH): invites in family words (to, relation, from), and holding one project per circle:
//   POST /api/moments/:code/project  { slug } hold this project for the circle ({ slug: "" } lets it go); organiser only
//   GET  /api/circle-claims          every held project the team approved: { slug: { name } }, for "Being funded by"
//   GET  /api/circle-team            (team) every hold, approved or waiting, with the circle's gifts
//   POST /api/circle-team            (team) { code, action: "approve" | "release" }
// Safety (13 Nov 2026, after a review before launch): only a signed-in organiser can hold a project, only an open and
// verified project can be held, nothing shows publicly until the team approves it, and a hold the team has not
// approved lapses after 7 days.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";
import data from "../../projects.json" with { type: "json" };

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
  const [m] = await getDatabase().sql<Row>`SELECT code, owner_key, owner_email, name, held_slug, held_ok FROM moments WHERE code = ${code} AND NOT hidden`;
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
    if (!me) return json({ ok: false, signIn: true, error: "Please sign in first, so the project is held in your name." }, 401);
    if (!isOwner(m, req, me)) return json({ ok: false, error: "Only the person who made this page can choose its project." }, 403);
    if (m.owner_email && m.owner_email !== me.email) return json({ ok: false, error: "Please sign in with the account you made this page with." }, 403);
    if (!m.owner_email) await db.sql`UPDATE moments SET owner_email = ${me.email} WHERE code = ${code} AND owner_email = ''`;
    const b = await readBody(req), slug = String(b.slug || "");
    if (slug === "") {
      await db.sql`UPDATE moments SET held_slug = '', held_at = NULL, held_ok = FALSE, held_ok_by = '' WHERE code = ${code}`;
      return json({ ok: true, slug: "" });
    }
    if (!(await openProject(slug))) return json({ ok: false, error: "This project cannot be chosen. Please choose an open project from the list." }, 400);
    // A hold the team never approved lapses after 7 days, so a project is not locked away for long.
    await db.sql`UPDATE moments SET held_slug = '', held_at = NULL WHERE held_slug = ${slug} AND code <> ${code} AND NOT held_ok AND held_at < NOW() - INTERVAL '7 days'`;
    const [other] = await db.sql<Row>`SELECT name FROM moments WHERE held_slug = ${slug} AND code <> ${code} AND NOT hidden`;
    if (other) return json({ ok: false, taken: true, error: `${other.name}'s circle is already funding this project. Please choose another one.` }, 409);
    try {
      await db.sql`UPDATE moments SET held_slug = ${slug}, held_at = NOW(), held_ok = FALSE, held_ok_by = '', project_slug = ${slug} WHERE code = ${code}`;
    } catch (e) {
      if (/duplicate|unique/i.test(String((e as Error).message))) return json({ ok: false, taken: true, error: "Another circle took this project a moment ago. Please choose another one." }, 409);
      throw e;
    }
    return json({ ok: true, slug, waiting: true });
  }
  return json({ error: "Not found" }, 404);
}

// Open and verified: in projects.json or made in the portal, verified, not hidden, not complete.
async function openProject(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return false;
  const ok = (p: Row | undefined) => !!p && p.slug === slug && !!p.verified && !p.hidden && !/complete/i.test(String(p.status || ""));
  if (ok(((data as Row).projects || []).find((p: Row) => p && p.slug === slug))) return true;
  const rows = await getDatabase().sql<Row>`SELECT data FROM site_projects WHERE NOT hidden AND data->>'slug' = ${slug} LIMIT 1`;
  return ok((rows as Row[])[0] ? (rows as Row[])[0].data : undefined);
}

// Team members only: the same rule as the team portal (role admin or team, or listed in PORTAL_ADMINS).
async function teamMember() {
  const u = await getUser().catch(() => null);
  if (!u || !u.email) return null;
  const email = u.email.toLowerCase();
  const admins = (Netlify.env.get("PORTAL_ADMINS") || "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);
  const roles: string[] = Array.isArray((u as any).roles) ? (u as any).roles : [];
  return roles.includes("admin") || roles.includes("team") || admins.includes(email) ? email : null;
}

async function team(req: Request) {
  const who = await teamMember();
  if (!who) return json({ ok: false, error: "Team only." }, 403);
  const db = getDatabase();
  if (req.method === "POST") {
    const b = await readBody(req), code = String(b.code || "");
    if (!REF.test(code)) return json({ ok: false }, 400);
    if (b.action === "approve") await db.sql`UPDATE moments SET held_ok = TRUE, held_ok_by = ${who} WHERE code = ${code} AND held_slug <> ''`;
    else if (b.action === "release") await db.sql`UPDATE moments SET held_slug = '', held_at = NULL, held_ok = FALSE, held_ok_by = ${who} WHERE code = ${code}`;
    else return json({ ok: false }, 400);
  }
  const rows = await db.sql<Row>`SELECT m.code, m.name, m.words, m.held_slug, m.held_at, m.held_ok, m.held_ok_by, m.owner_email, m.from_name,
      (SELECT COUNT(*)::int FROM gifts g WHERE g.moment_code = m.code) AS gifts,
      (SELECT COUNT(*)::int FROM moment_members mm WHERE mm.moment_code = m.code AND NOT mm.hidden) AS members
    FROM moments m WHERE m.held_slug <> '' AND NOT m.hidden ORDER BY m.held_ok, m.held_at DESC LIMIT 200`;
  return json({ ok: true, holds: (rows as Row[]).map((r) => ({
    code: r.code, name: r.name, words: r.words, project: r.held_slug, since: r.held_at, approved: r.held_ok, approvedBy: r.held_ok_by,
    owner: r.owner_email, from: r.from_name, gifts: r.gifts, members: r.members,
    lapses: !r.held_ok && r.held_at ? new Date(new Date(r.held_at).getTime() + 7 * 864e5).toISOString() : null,
  })) });
}

async function claims() {
  const rows = await getDatabase().sql<Row>`SELECT held_slug, name FROM moments WHERE held_slug <> '' AND held_ok AND NOT hidden`;
  const out: Record<string, { name: string }> = {};
  for (const r of rows as Row[]) out[r.held_slug] = { name: r.name };
  return Response.json({ ok: true, claims: out }, { headers: { "Cache-Control": "public, max-age=30" } });
}

export default async (req: Request) => {
  const parts = new URL(req.url).pathname.replace(/\/+$/, "").split("/");
  try {
    if (parts[2] === "circle-claims" && req.method === "GET") return await claims();
    if (parts[2] === "circle-team") return await team(req);
    if (parts.length === 5) return await circleAction(parts[3], parts[4], req);
    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error("moment-circle:", e);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
};

export const config: Config = {
  path: ["/api/moments/:code/me", "/api/moments/:code/invites", "/api/moments/:code/open", "/api/moments/:code/join", "/api/moments/:code/project", "/api/circle-claims", "/api/circle-team"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 60 },
};
