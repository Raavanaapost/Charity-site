// "A moment in their name", given together (SURESH, 10 Nov 2026).
//   POST /api/moments         make a family page: { kind, words, name, note, from, project, wish, day, lang } -> { code }
//   GET  /api/moments/:code   the page (/m/<code>): the words and name, the day of joy it is for, who has given, and the circle
// Family circle, stage 1 (SURESH, 13 Nov 2026): the organiser invites people and they join the page.
//   GET  /api/moments/:code/me       am I the organiser, have I joined (members sign-in, or the organiser's key)
//   GET  /api/moments/:code/invites  the organiser's invite list: who it was for, the channel, sent/opened/joined
//   POST /api/moments/:code/invites  { ref, label, channel } a new invite (the ref is made on the phone, so the link opens at once)
//   POST /api/moments/:code/open     { ref } someone opened an invite link
//   POST /api/moments/:code/join     { name, country, ref } a signed-in member joins the circle
// The organiser is whoever holds the key returned when the page was made (kept on their phone), or the member who was
// signed in when they made it. Emails, invite names and the invite list are never shown to anyone else.
// The name is the person remembered or celebrated (or the family or group giving), never a child's.
// Givers show by name only if they ticked "show my name"; amounts are shown only as the total.
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";
import { TRIBUTE_WORDS } from "../lib/give-core.mts";

const json = (body: unknown, status = 200, cache = "no-store") => Response.json(body, { status, headers: { "Cache-Control": cache } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
const FRIEND = "A friend of Raavanaa";
const env = (k: string) => (Netlify.env.get(k) || "").trim();
// Same rule as /api/give: real gifts only count on the live site, test gifts everywhere else.
const liveSite = (context: Context) => {
  if (context.deploy?.context !== "production") return false;
  if (env("PAYHERE_MERCHANT_ID") && env("PAYHERE_MERCHANT_SECRET")) return env("PAYHERE_LIVE").toLowerCase() === "yes";
  return env("STRIPE_SECRET_KEY").startsWith("sk_live_");
};
// Easy to read out on the phone: no 0/o, 1/l/i.
const newCode = () => {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789", b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b, (x) => abc[x % abc.length]).join("");
};

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
  const [m] = await getDatabase().sql<Row>`SELECT code, owner_key, owner_email FROM moments WHERE code = ${code} AND NOT hidden`;
  return m || null;
}
const isOwner = (m: Row, req: Request, me: { email: string } | null) =>
  sameKey(String(m.owner_key || ""), (req.headers.get("x-owner-key") || "").trim()) || (!!me && !!m.owner_email && m.owner_email === me.email);
const readBody = async (req: Request): Promise<Record<string, unknown>> => { try { return await req.json(); } catch { return {}; } };

async function create(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ ok: false, error: "Could not read the form." }, 400); }
  if (String(b["bot-field"] || "")) return json({ ok: false, error: "Something went wrong." }, 400);
  const kind = String(b.kind || "");
  if (!(kind in TRIBUTE_WORDS)) return json({ ok: false, error: "Please choose the reason." }, 400);
  const name = clip(b.name, 60);
  if (!name) return json({ ok: false, error: "Please add their name first." }, 400);
  const words = clip(b.words, 60) || TRIBUTE_WORDS[kind];
  const project = /^[a-z0-9-]{1,80}$/.test(String(b.project || "")) ? String(b.project) : "";
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(b.day || "")) && !isNaN(Date.parse(String(b.day))) ? String(b.day) : null;
  const db = getDatabase();
  const me = await member();
  const ownerKey = newCode() + newCode() + newCode();
  for (let i = 0; i < 4; i++) {
    const code = newCode();
    try {
      await db.sql`INSERT INTO moments (code, kind, words, name, note, from_name, project_slug, wish, day, lang, owner_key, owner_email)
        VALUES (${code}, ${kind}, ${words}, ${name}, ${clip(b.note, 140)}, ${clip(b.from, 60)}, ${project}, ${clip(b.wish, 300)}, ${day}, ${b.lang === "ta" ? "ta" : "en"}, ${ownerKey}, ${me ? me.email : ""})`;
      return json({ ok: true, code, ownerKey });
    } catch (e) {
      if (!/duplicate|unique/i.test(String((e as Error).message))) throw e;
    }
  }
  return json({ ok: false, error: "Please try again." }, 500);
}

async function view(code: string, context: Context) {
  if (!/^[a-z0-9]{6,16}$/.test(code)) return json({ ok: false }, 404);
  const db = getDatabase();
  const [m] = await db.sql<Row>`SELECT * FROM moments WHERE code = ${code} AND NOT hidden`;
  if (!m) return json({ ok: false }, 404);
  const live = liveSite(context);
  const rows = await db.sql<Row>`
    SELECT display_name, show_name, amount_cents, currency FROM gifts WHERE moment_code = ${code} AND livemode = ${live} ORDER BY created_at`;
  const circle = await db.sql<Row>`
    SELECT display_name, country FROM moment_members WHERE moment_code = ${code} AND NOT hidden ORDER BY joined_at`;
  const totals: Record<string, number> = {};
  for (const r of rows as Row[]) totals[String(r.currency).toUpperCase()] = (totals[String(r.currency).toUpperCase()] || 0) + Number(r.amount_cents) / 100;
  return json({
    ok: true, code, kind: m.kind, words: m.words, name: m.name, note: m.note, from: m.from_name,
    project: m.project_slug, wish: m.wish, day: m.day ? new Date(m.day).toISOString().slice(0, 10) : "", lang: m.lang, created: m.created_at,
    givers: (rows as Row[]).map((r) => (r.show_name && r.display_name ? r.display_name : FRIEND)),
    count: rows.length, totals, test: !live,
    circle: (circle as Row[]).map((r) => ({ name: r.display_name, country: r.country })),
  }, 200, "public, max-age=20");
}

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
    if (REF.test(ref)) await db.sql`UPDATE moment_invites SET opened_at = NOW() WHERE ref = ${ref} AND moment_code = ${code} AND opened_at IS NULL`;
    return json({ ok: true });
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
      await db.sql`INSERT INTO moment_invites (moment_code, ref, label, channel) VALUES (${code}, ${ref}, ${clip(b.label, 60)}, ${channel}) ON CONFLICT (ref) DO NOTHING`;
      return json({ ok: true, ref });
    }
    if (req.method === "GET") {
      const rows = await db.sql<Row>`SELECT i.ref, i.label, i.channel, i.created_at, i.opened_at, i.joined_at,
          (SELECT display_name FROM moment_members mm WHERE mm.moment_code = i.moment_code AND mm.invite_ref = i.ref ORDER BY joined_at LIMIT 1) AS joined_as
        FROM moment_invites i WHERE i.moment_code = ${code} AND NOT i.hidden ORDER BY i.created_at DESC LIMIT 200`;
      return json({ ok: true, invites: (rows as Row[]).map((r) => ({
        ref: r.ref, label: r.label, channel: r.channel, sent: r.created_at,
        status: r.joined_at ? "joined" : r.opened_at ? "opened" : "sent", joinedAs: r.joined_as || "",
      })) });
    }
  }
  return json({ error: "Not found" }, 404);
}

export default async (req: Request, context: Context) => {
  const parts = new URL(req.url).pathname.replace(/\/+$/, "").split("/");
  try {
    if (parts.length === 3 && req.method === "POST") return await create(req);
    if (parts.length === 4 && req.method === "GET") return await view(parts[3], context);
    if (parts.length === 5) return await circleAction(parts[3], parts[4], req);
    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error("moments:", e);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
};

export const config: Config = {
  path: ["/api/moments", "/api/moments/:code", "/api/moments/:code/:action"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 60 },
};
