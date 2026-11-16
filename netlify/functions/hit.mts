// Public: the site's own visit counter (SURESH, 16 Nov 2026). track.js sends one small note per page opened and
// per share, gift request, memory page, project request, vouch or app install.
//   POST /api/hit  { k, p, d, v, l, r, c, u, x, a, lang }  -> 204
// Stored without anything personal (see the site_hits migration). Robots and the team's own devices are not counted.
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { KINDS, classify, clean, device, isBot } from "../lib/traffic-core.mts";

const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const ua = req.headers.get("user-agent") || "";
  if (isBot(ua)) return done();
  let b: Record<string, unknown>;
  try { b = JSON.parse(await req.text()); } catch { return done(); }
  const kind = KINDS.includes(String(b.k)) ? String(b.k) : "";
  if (!kind) return done();
  const path = String(b.p || "/").split(/[?#]/)[0].replace(/[^\w\/.~-]/g, "").slice(0, 160) || "/";
  if (/^\/(portal|admin)/.test(path)) return done(); // team pages are not traffic
  const visit = /^[a-z0-9]{8,24}$/.test(String(b.v)) ? String(b.v) : "";
  if (!visit) return done();
  const landing = b.l === 1 || b.l === true;
  const own = new URL(req.url).hostname;
  // Only the landing page says where the visit came from; later pages carry the same source and campaign.
  const campaign = clean(b.c, 60);
  const { source, host } = classify(String(b.r || ""), campaign, String(b.u || ""), String(b.x || ""), own);
  const row = {
    detail: clean(b.d, 20), source: landing ? source : clean(b.s, 20) || source, host: landing ? host : "",
    country: String(context.geo?.country?.code || "").toUpperCase().slice(0, 2), device: device(ua),
    app: b.a === 1 || b.a === true, lang: b.lang === "ta" ? "ta" : "en",
  };
  try {
    await getDatabase().sql`INSERT INTO site_hits (kind, path, detail, visit, landing, source, ref_host, campaign, country, device, app, lang)
      VALUES (${kind}, ${path}, ${row.detail}, ${visit}, ${landing && kind === "view"}, ${row.source}, ${row.host}, ${campaign},
              ${row.country}, ${row.device}, ${row.app}, ${row.lang})`;
  } catch (e) { console.log("hit not saved:", (e as Error).message); }
  return done();
};

export const config: Config = { path: "/api/hit", method: "POST" };
