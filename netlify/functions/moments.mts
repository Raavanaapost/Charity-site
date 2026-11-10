// "A moment in their name", given together (SURESH, 10 Nov 2026).
//   POST /api/moments         make a family page: { kind, words, name, note, from, project, wish, day, lang } -> { code }
//   GET  /api/moments/:code   the page (/m/<code>): the words and name, the day of joy it is for, and who has given
// The name is the person remembered or celebrated (or the family or group giving), never a child's.
// Givers show by name only if they ticked "show my name"; amounts are shown only as the total.
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
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
  for (let i = 0; i < 4; i++) {
    const code = newCode();
    try {
      await db.sql`INSERT INTO moments (code, kind, words, name, note, from_name, project_slug, wish, day, lang)
        VALUES (${code}, ${kind}, ${words}, ${name}, ${clip(b.note, 140)}, ${clip(b.from, 60)}, ${project}, ${clip(b.wish, 300)}, ${day}, ${b.lang === "ta" ? "ta" : "en"})`;
      return json({ ok: true, code });
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
  const totals: Record<string, number> = {};
  for (const r of rows as Row[]) totals[String(r.currency).toUpperCase()] = (totals[String(r.currency).toUpperCase()] || 0) + Number(r.amount_cents) / 100;
  return json({
    ok: true, code, kind: m.kind, words: m.words, name: m.name, note: m.note, from: m.from_name,
    project: m.project_slug, wish: m.wish, day: m.day ? new Date(m.day).toISOString().slice(0, 10) : "", lang: m.lang, created: m.created_at,
    givers: (rows as Row[]).map((r) => (r.show_name && r.display_name ? r.display_name : FRIEND)),
    count: rows.length, totals, test: !live,
  }, 200, "public, max-age=20");
}

export default async (req: Request, context: Context) => {
  const parts = new URL(req.url).pathname.replace(/\/+$/, "").split("/");
  try {
    if (parts.length === 3 && req.method === "POST") return await create(req);
    if (parts.length === 4 && req.method === "GET") return await view(parts[3], context);
    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error("moments:", e);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
};

export const config: Config = {
  path: ["/api/moments", "/api/moments/:code"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 20 },
};
