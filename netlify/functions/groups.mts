// Community groups (SURESH, 23 Nov 2026): small groups that already collect money in their own WhatsApp circle and run
// projects together get a profile on Raavanaa, and anyone can follow them.
//   GET   /api/groups                      public: listed groups (name, kind, places, counts)
//   POST  /api/groups                      signed in: register a group (waits for the team's check)
//   GET   /api/groups/mine                 signed in: groups I run and groups I follow, with their latest news
//   GET   /api/groups/team                 team: every group with its private contact, to check and list
//   PATCH /api/groups/team                 team: { id, status?, checked?, team_note?, link?: slug, unlink?: projectId }
//   GET   /api/groups/:slug                the profile (listed, or waiting/hidden for its own admins and the team)
//   PATCH /api/groups/:slug                group admin: edit the profile, add admins
//   POST  /api/groups/:slug/follow         signed in: { on: true|false }
//   POST  /api/groups/:slug/projects       group admin: add or edit one of its own projects { id?, title, ... , remove? }
//   POST  /api/groups/:slug/updates        group admin: post a short update { body, project_id? } or { remove: id }
// Organisations (SURESH 25 Nov 2026, option B): the same profile with profile_type "organisation", a registration body
// and number, website and logo; only the team sets verified ("Verified organisation") after seeing the certificate.
//   GET   /api/groups/:slug/logo           the profile's logo picture (if any)
// The group's money stays in its own circle; Raavanaa never holds it. What a group types about money is shown as
// "reported by the group". Linking a raavanaa.org project to a group is for the team only, so nobody can claim
// someone else's project. Phone and contact details are never public.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";
import { teamAccess } from "../lib/team-access.mts";

type Row = Record<string, any>;
type DB = ReturnType<typeof getDatabase>;
const json = (body: unknown, status = 200, cache = "no-store") => Response.json(body, { status, headers: { "Cache-Control": cache } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
const text = (v: unknown, max: number) => String(v ?? "").replace(/[<>]/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^\d.]/g, "")); return Number.isFinite(n) && n > 0 ? Math.round(n) : 0; };
const STAGES = ["Initiated", "Activated", "Impact"];
const KINDS = ["WhatsApp circle", "Friends", "Family", "Past pupils", "Village or society", "Temple or church", "Youth or sports club", "Workplace", "Charity or NGO", "School or education", "Other"];
const CUR = ["LKR", "CAD", "GBP", "EUR", "USD", "AUD", "CHF", "NOK", "INR"];
const REG_BODIES = ["NGO Secretariat", "Companies Act (guarantee company)", "Divisional Secretariat / social services", "Registered charity abroad", "Other"];
const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const site = (v: unknown) => { const u = clip(v, 160); if (!u) return ""; const w = /^https?:\/\//i.test(u) ? u : "https://" + u; try { const x = new URL(w); return /\./.test(x.hostname) ? x.href : ""; } catch { return ""; } };
// Facebook Page and Instagram (SURESH 26 Nov 2026: "Follow us" on the profile). Only real facebook.com / instagram.com
// addresses are kept, so a profile cannot send people to some other site with a Facebook icon. A bare name or @name works too.
const social = (v: unknown, kind: "facebook" | "instagram") => {
  let s = clip(v, 200).replace(/\s+/g, "");
  if (!s) return "";
  const hosts = kind === "facebook" ? /^(www\.|m\.|web\.)?(facebook\.com|fb\.com)$/i : /^(www\.)?instagram\.com$/i;
  // A bare name or @name (Instagram names may have dots: @jaffna.friends).
  if (/^@?[\w.\-]{1,80}$/.test(s) && !/\.(com|org|net|lk)$/i.test(s)) s = (kind === "facebook" ? "facebook.com/" : "instagram.com/") + s.replace(/^@/, "");
  try {
    const x = new URL(/^https?:\/\//i.test(s) ? s : "https://" + s);
    if (!hosts.test(x.hostname)) return "";
    const path = x.pathname.replace(/\/+$/, "");
    if (!/^\/[\w.\-\/]{2,120}$/.test(path)) return "";
    const keepQ = kind === "facebook" && path === "/profile.php" && /^\d+$/.test(x.searchParams.get("id") || "") ? "?id=" + x.searchParams.get("id") : "";
    return (kind === "facebook" ? "https://www.facebook.com" : "https://www.instagram.com") + path + keepQ;
  } catch { return ""; }
};
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "group";

async function me() {
  const u = await getUser().catch(() => null);
  if (!u || !u.email) return null;
  const meta = u as { user_metadata?: { full_name?: string }; userMetadata?: { full_name?: string } };
  const email = u.email.toLowerCase();
  return { email, name: meta.user_metadata?.full_name || meta.userMetadata?.full_name || email.split("@")[0] };
}
const isAdmin = (g: Row, email: string | undefined) => !!email && (g.owner_email === email || (g.admins || []).includes(email));

// The public face of a group (never the contact details or the team's note).
const face = (g: Row, extra: Row = {}) => ({
  slug: g.slug, name: g.name, kind: g.kind, about: g.about, places: g.places, members: g.members_count, started: g.started,
  collect: g.collect, checked: !!g.checked, status: g.status, since: g.listed_at || g.created_at,
  type: g.profile_type === "organisation" ? "organisation" : "group", verified: g.profile_type === "organisation" && !!g.verified,
  reg_body: g.profile_type === "organisation" ? g.reg_body : "", reg_number: g.profile_type === "organisation" ? g.reg_number : "",
  website: g.website || "", facebook: g.facebook || "", instagram: g.instagram || "", logo: g.logo ? `/api/groups/${encodeURIComponent(g.slug)}/logo?v=${new Date(g.updated_at || g.created_at).getTime()}` : "", ...extra,
});
const proj = (p: Row) => ({
  id: p.id, slug: p.raavanaa_slug || "", title: p.title, place: p.place, stage: STAGES.includes(p.stage) ? p.stage : "Initiated",
  story: p.story, day: p.day, cost: Number(p.cost) || 0, collected: Number(p.collected) || 0, currency: p.currency, updated: p.updated_at,
});
const upd = (u: Row) => ({ id: u.id, body: u.body, by: u.by_name, project: u.project_id, at: u.created_at });

async function counts(db: DB, ids: number[]) {
  const out: Record<number, { followers: number; projects: number }> = {};
  if (!ids.length) return out;
  for (const id of ids) out[id] = { followers: 0, projects: 0 };
  const f = await db.sql<Row>`SELECT group_id, COUNT(*)::int AS n FROM group_follows WHERE group_id = ANY(${ids}::int[]) GROUP BY group_id`;
  for (const r of f as Row[]) out[r.group_id].followers = r.n;
  const p = await db.sql<Row>`SELECT group_id, COUNT(*)::int AS n FROM group_projects WHERE NOT hidden AND group_id = ANY(${ids}::int[]) GROUP BY group_id`;
  for (const r of p as Row[]) out[r.group_id].projects = r.n;
  return out;
}

async function profile(db: DB, g: Row, who: { email: string } | null, team: boolean) {
  const projects = ((await db.sql<Row>`SELECT * FROM group_projects WHERE group_id = ${g.id} AND NOT hidden ORDER BY created_at DESC LIMIT 100`) as Row[]).map(proj);
  const updates = ((await db.sql<Row>`SELECT * FROM group_updates WHERE group_id = ${g.id} AND NOT hidden ORDER BY created_at DESC LIMIT 30`) as Row[]).map(upd);
  const [{ n: followers }] = (await db.sql<Row>`SELECT COUNT(*)::int AS n FROM group_follows WHERE group_id = ${g.id}`) as Row[];
  let following = false;
  if (who) following = ((await db.sql<Row>`SELECT 1 FROM group_follows WHERE group_id = ${g.id} AND email = ${who.email}`) as Row[]).length > 0;
  const admin = isAdmin(g, who?.email);
  return {
    ok: true, group: face(g, { followers, following, admin, team }), projects, updates,
    // Only the group's own admins see who can manage it and the private contact they gave.
    ...(admin ? { manage: { admins: g.admins || [], owner: g.owner_email, contact_name: g.contact_name, contact_phone: g.contact_phone } } : {}),
  };
}

async function freeSlug(db: DB, name: string) {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const s = i ? `${base}-${i + 1}` : base;
    if (["new", "mine", "team"].includes(s)) continue;
    const taken = (await db.sql<Row>`SELECT 1 FROM community_groups WHERE slug = ${s}`) as Row[];
    if (!taken.length) return s;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// The profile fields a group can set (on register and on edit).
const fields = (b: Row) => ({
  name: clip(b.name, 80), kind: KINDS.includes(clip(b.kind, 40)) ? clip(b.kind, 40) : "Other", about: text(b.about, 1200),
  places: clip(b.places, 160), members: Math.min(num(b.members), 100000), started: clip(b.started, 40), collect: text(b.collect, 400),
  contact_name: clip(b.contact_name, 80), contact_phone: clip(b.contact_phone, 40),
  type: b.type === "organisation" ? "organisation" : "group", reg_body: REG_BODIES.includes(clip(b.reg_body, 60)) ? clip(b.reg_body, 60) : "",
  reg_number: clip(b.reg_number, 60), website: site(b.website),
  facebook: social(b.facebook, "facebook"), instagram: social(b.instagram, "instagram"),
});
// A picture typed in the browser (shrunk there to 256 px): data URL, at most about 90 KB. "" = no logo; undefined = keep.
const logoOf = (v: unknown) => v === "" || v === null ? "" : typeof v === "string" && v.length <= 120000 && LOGO_RE.test(v) ? v : undefined;
const orgCheck = (f: ReturnType<typeof fields>) => f.type === "organisation" && (!f.reg_body || f.reg_number.length < 2)
  ? "Please say where your organisation is registered and its registration number." : "";

const linkCheck = (b: Row) => clip(b.facebook, 200) && !social(b.facebook, "facebook") ? "That Facebook link does not look right. Please paste your Facebook Page's address, e.g. facebook.com/yourpage."
  : clip(b.instagram, 200) && !social(b.instagram, "instagram") ? "That Instagram link does not look right. Please give your Instagram name, e.g. @yourgroup." : "";

export default async (req: Request) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/groups\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const db = getDatabase();
  let body: Row = {};
  if (req.method !== "GET") { try { body = await req.json(); } catch { /* empty */ } }
  try {
    // ---- Team: check, list, hide, link raavanaa.org projects ----
    if (parts[0] === "team") {
      const t = await teamAccess();
      if (!t) return json({ ok: false, error: "Team only." }, 403);
      if (req.method === "PATCH") {
        const id = Number(body.id) || 0;
        const [g] = (await db.sql<Row>`SELECT * FROM community_groups WHERE id = ${id}`) as Row[];
        if (!g) return json({ ok: false, error: "No such group." }, 404);
        if (["waiting", "listed", "hidden"].includes(body.status)) {
          await db.sql`UPDATE community_groups SET status = ${body.status}, updated_at = NOW(),
            listed_by = CASE WHEN ${body.status} = 'listed' THEN ${t.email} ELSE listed_by END,
            listed_at = CASE WHEN ${body.status} = 'listed' AND listed_at IS NULL THEN NOW() ELSE listed_at END WHERE id = ${id}`;
          await db.sql`INSERT INTO audit_log (actor, action, target) VALUES (${t.email}, ${"group." + body.status}, ${g.slug})`;
        }
        if (typeof body.checked === "boolean") await db.sql`UPDATE community_groups SET checked = ${body.checked}, updated_at = NOW() WHERE id = ${id}`;
        if (typeof body.verified === "boolean") {
          if (body.verified && (g.profile_type !== "organisation" || !g.reg_number)) return json({ ok: false, error: "Only an organisation with a registration number can be verified." }, 400);
          await db.sql`UPDATE community_groups SET verified = ${body.verified}, verified_by = ${body.verified ? t.email : ""}, verified_at = ${body.verified ? new Date().toISOString() : null}, updated_at = NOW() WHERE id = ${id}`;
          await db.sql`INSERT INTO audit_log (actor, action, target) VALUES (${t.email}, ${body.verified ? "group.verified" : "group.unverified"}, ${g.slug})`;
        }
        if (typeof body.team_note === "string") await db.sql`UPDATE community_groups SET team_note = ${text(body.team_note, 800)} WHERE id = ${id}`;
        if (body.link) {
          const slug = clip(body.link, 80), title = clip(body.title, 120);
          const have = (await db.sql<Row>`SELECT 1 FROM group_projects WHERE group_id = ${id} AND raavanaa_slug = ${slug} AND NOT hidden`) as Row[];
          if (!have.length) await db.sql`INSERT INTO group_projects (group_id, raavanaa_slug, title, stage) VALUES (${id}, ${slug}, ${title}, ${STAGES.includes(body.stage) ? body.stage : "Initiated"})`;
          await db.sql`INSERT INTO audit_log (actor, action, target) VALUES (${t.email}, 'group.link', ${g.slug + " " + slug})`;
        }
        if (body.unlink) await db.sql`UPDATE group_projects SET hidden = TRUE WHERE id = ${Number(body.unlink) || 0} AND group_id = ${id}`;
        if (body.hideUpdate) await db.sql`UPDATE group_updates SET hidden = TRUE WHERE id = ${Number(body.hideUpdate) || 0} AND group_id = ${id}`;
      }
      const groups = (await db.sql<Row>`SELECT * FROM community_groups ORDER BY (status = 'waiting') DESC, created_at DESC LIMIT 500`) as Row[];
      const c = await counts(db, groups.map((g) => g.id));
      for (const g of groups) g.logo = g.logo ? face(g).logo : "";
      const links = (await db.sql<Row>`SELECT id, group_id, raavanaa_slug, title, stage FROM group_projects WHERE NOT hidden ORDER BY created_at DESC LIMIT 2000`) as Row[];
      return json({ ok: true, groups: groups.map((g) => ({ ...g, ...c[g.id], projects: links.filter((l) => l.group_id === g.id) })) });
    }

    // ---- Signed in: my groups ----
    if (parts[0] === "mine") {
      const who = await me();
      if (!who) return json({ ok: true, run: [], follow: [] });
      const run = (await db.sql<Row>`SELECT * FROM community_groups WHERE (owner_email = ${who.email} OR ${who.email} = ANY(admins)) AND status <> 'hidden' ORDER BY created_at DESC`) as Row[];
      const fol = (await db.sql<Row>`SELECT g.* FROM community_groups g JOIN group_follows f ON f.group_id = g.id WHERE f.email = ${who.email} AND g.status = 'listed' ORDER BY f.created_at DESC`) as Row[];
      const ids = [...run, ...fol].map((g) => g.id);
      const latest = ids.length ? ((await db.sql<Row>`SELECT DISTINCT ON (group_id) group_id, body, created_at FROM group_updates WHERE NOT hidden AND group_id = ANY(${ids}::int[]) ORDER BY group_id, created_at DESC`) as Row[]) : [];
      const last = (id: number) => { const u = latest.find((x) => x.group_id === id); return u ? { body: u.body, at: u.created_at } : null; };
      return json({ ok: true, run: run.map((g) => face(g, { latest: last(g.id) })), follow: fol.map((g) => face(g, { latest: last(g.id) })) });
    }

    // ---- The list and registering ----
    if (!parts.length) {
      if (req.method === "GET") {
        const groups = (await db.sql<Row>`SELECT * FROM community_groups WHERE status = 'listed' ORDER BY listed_at DESC NULLS LAST LIMIT 500`) as Row[];
        const c = await counts(db, groups.map((g) => g.id));
        const links = (await db.sql<Row>`SELECT p.raavanaa_slug, g.slug, g.name FROM group_projects p JOIN community_groups g ON g.id = p.group_id
          WHERE p.raavanaa_slug <> '' AND NOT p.hidden AND g.status = 'listed'`) as Row[];
        return json({ ok: true, groups: groups.map((g) => face(g, c[g.id])), links: links.map((l) => ({ project: l.raavanaa_slug, group: l.slug, name: l.name })) }, 200, "public, max-age=60");
      }
      if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
      if (clip(body["bot-field"], 10)) return json({ ok: true });
      const who = await me();
      if (!who) return json({ ok: false, signin: true, error: "Please sign in first." }, 401);
      const f = fields(body);
      if (f.name.length < 3) return json({ ok: false, error: "Please give your group's name." }, 400);
      if (f.about.length < 20) return json({ ok: false, error: "Please say in a few lines what your group does." }, 400);
      if (!f.contact_phone) return json({ ok: false, error: "Please add a WhatsApp number so the team can call you." }, 400);
      const oc = orgCheck(f) || linkCheck(body); if (oc) return json({ ok: false, error: oc }, 400);
      const logo = logoOf(body.logo) || "";
      const mine = (await db.sql<Row>`SELECT COUNT(*)::int AS n FROM community_groups WHERE owner_email = ${who.email} AND created_at > NOW() - INTERVAL '1 day'`) as Row[];
      if (mine[0].n >= 3) return json({ ok: false, error: "You have registered three groups today. Please wait for the team to call you." }, 429);
      const slug = await freeSlug(db, f.name);
      await db.sql`INSERT INTO community_groups (slug, name, kind, about, places, members_count, started, collect, contact_name, contact_phone, owner_email,
          profile_type, reg_body, reg_number, website, logo, facebook, instagram)
        VALUES (${slug}, ${f.name}, ${f.kind}, ${f.about}, ${f.places}, ${f.members}, ${f.started}, ${f.collect}, ${f.contact_name || who.name}, ${f.contact_phone}, ${who.email},
          ${f.type}, ${f.type === "organisation" ? f.reg_body : ""}, ${f.type === "organisation" ? f.reg_number : ""}, ${f.website}, ${logo}, ${f.facebook}, ${f.instagram})`;
      await db.sql`INSERT INTO audit_log (actor, action, target) VALUES (${who.email}, 'group.registered', ${slug})`;
      return json({ ok: true, slug });
    }

    // ---- One group ----
    const [g] = (await db.sql<Row>`SELECT * FROM community_groups WHERE slug = ${parts[0]}`) as Row[];
    const who = await me();
    const team = !!(who && (await teamAccess()));
    const admin = g ? isAdmin(g, who?.email) : false;
    if (!g || (g.status !== "listed" && !admin && !team)) return json({ ok: false, error: "We could not find that group." }, 404);
    const sub = parts[1] || "";

    if (!sub && req.method === "GET") return json(await profile(db, g, who, team));

    if (sub === "logo" && req.method === "GET") {
      const m = String(g.logo || "").match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
      if (!m) return new Response("No logo", { status: 404 });
      return new Response(Buffer.from(m[2], "base64"), { headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=86400" } });
    }

    if (sub === "follow" && req.method === "POST") {
      if (!who) return json({ ok: false, signin: true, error: "Please sign in to follow." }, 401);
      if (body.on === false) await db.sql`DELETE FROM group_follows WHERE group_id = ${g.id} AND email = ${who.email}`;
      else await db.sql`INSERT INTO group_follows (group_id, email) VALUES (${g.id}, ${who.email}) ON CONFLICT DO NOTHING`;
      return json(await profile(db, g, who, team));
    }

    // Everything below changes the group: its own admins only (the team uses /api/groups/team).
    if (!admin) return json({ ok: false, error: "Only the people who run this group can change it." }, 403);

    if (!sub && req.method === "PATCH") {
      const f = fields({ ...face(g), members: g.members_count, contact_name: g.contact_name, contact_phone: g.contact_phone,
        type: g.profile_type, reg_body: g.reg_body, reg_number: g.reg_number, website: g.website, facebook: g.facebook, instagram: g.instagram, ...body });
      if (f.name.length < 3) return json({ ok: false, error: "Please give your group's name." }, 400);
      const oc = orgCheck(f) || linkCheck(body); if (oc) return json({ ok: false, error: oc }, 400);
      const logo = logoOf(body.logo);
      // A new registration (or going back to a group) needs the team to see the certificate again.
      const keepVerified = f.type === "organisation" && g.profile_type === "organisation" && f.reg_number === g.reg_number && f.reg_body === g.reg_body;
      const admins = Array.isArray(body.admins)
        ? [...new Set(body.admins.map((x: unknown) => clip(x, 120).toLowerCase()).filter((x: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x) && x !== g.owner_email))].slice(0, 8)
        : g.admins || [];
      await db.sql`UPDATE community_groups SET name = ${f.name}, kind = ${f.kind}, about = ${f.about}, places = ${f.places}, members_count = ${f.members},
        started = ${f.started}, collect = ${f.collect}, contact_name = ${f.contact_name}, contact_phone = ${f.contact_phone}, admins = ${admins}::text[],
        profile_type = ${f.type}, reg_body = ${f.type === "organisation" ? f.reg_body : ""}, reg_number = ${f.type === "organisation" ? f.reg_number : ""}, website = ${f.website},
        facebook = ${f.facebook}, instagram = ${f.instagram}, logo = ${logo === undefined ? g.logo : logo}, verified = ${keepVerified && !!g.verified}, updated_at = NOW() WHERE id = ${g.id}`;
      if (g.verified && !keepVerified) await db.sql`INSERT INTO audit_log (actor, action, target) VALUES (${who!.email}, 'group.unverified-by-edit', ${g.slug})`;
      const [n] = (await db.sql<Row>`SELECT * FROM community_groups WHERE id = ${g.id}`) as Row[];
      return json(await profile(db, n, who, team));
    }

    if (sub === "projects" && req.method === "POST") {
      const id = Number(body.id) || 0;
      if (body.remove) { await db.sql`UPDATE group_projects SET hidden = TRUE WHERE id = ${Number(body.remove) || 0} AND group_id = ${g.id} AND raavanaa_slug = ''`; return json(await profile(db, g, who, team)); }
      const p = { title: clip(body.title, 120), place: clip(body.place, 80), stage: STAGES.includes(body.stage) ? body.stage : "Initiated", story: text(body.story, 2000),
        day: clip(body.day, 40), cost: num(body.cost), collected: num(body.collected), currency: CUR.includes(body.currency) ? body.currency : "LKR" };
      if (p.title.length < 3) return json({ ok: false, error: "Please give the project a name." }, 400);
      if (id) await db.sql`UPDATE group_projects SET title = ${p.title}, place = ${p.place}, stage = ${p.stage}, story = ${p.story}, day = ${p.day}, cost = ${p.cost},
        collected = ${p.collected}, currency = ${p.currency}, updated_at = NOW() WHERE id = ${id} AND group_id = ${g.id} AND raavanaa_slug = ''`;
      else await db.sql`INSERT INTO group_projects (group_id, title, place, stage, story, day, cost, collected, currency)
        VALUES (${g.id}, ${p.title}, ${p.place}, ${p.stage}, ${p.story}, ${p.day}, ${p.cost}, ${p.collected}, ${p.currency})`;
      return json(await profile(db, g, who, team));
    }

    if (sub === "updates" && req.method === "POST") {
      if (body.remove) { await db.sql`UPDATE group_updates SET hidden = TRUE WHERE id = ${Number(body.remove) || 0} AND group_id = ${g.id}`; return json(await profile(db, g, who, team)); }
      const b = text(body.body, 800);
      if (b.length < 3) return json({ ok: false, error: "Please write your update." }, 400);
      const pid = Number(body.project_id) || 0;
      const okP = pid ? ((await db.sql<Row>`SELECT 1 FROM group_projects WHERE id = ${pid} AND group_id = ${g.id}`) as Row[]).length > 0 : false;
      await db.sql`INSERT INTO group_updates (group_id, project_id, body, by_name, by_email) VALUES (${g.id}, ${okP ? pid : null}, ${b}, ${who!.name}, ${who!.email})`;
      return json(await profile(db, g, who, team));
    }
    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    console.log("groups:", (e as Error).message);
    return json({ ok: false, error: "We could not do that just now. Please try again." }, 503);
  }
};

export const config: Config = {
  path: ["/api/groups", "/api/groups/*"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 40 },
};
