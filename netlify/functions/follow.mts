// Public: follow a project and get each update (SURESH, 25 Nov 2026, option A).
//   POST /api/follow             { slug, name, contact (WhatsApp number or email), bot-field }  no sign-in
//   GET  /api/follow             every project's updates (newest first) and how many people follow it
//   GET  /api/follow/stop/:token the person's own "stop updates" link (short form in messages: /stop/:token)
// Numbers and emails are for the team only and never come back from here.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { follow } from "../lib/follow.mts";
import data from "../../projects.json" with { type: "json" };

const json = (body: unknown, status = 200, cache = "no-store") => Response.json(body, { status, headers: { "Cache-Control": cache } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const TITLE: Record<string, string> = Object.fromEntries(((data as { projects?: { slug?: string; title?: string }[] }).projects || []).filter((p) => p && p.slug).map((p) => [p.slug!, p.title || p.slug!]));

const page = (title: string, text: string, slug = "") => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Raavanaa</title><style>body{margin:0;background:#f6efe2;color:#2b2520;font:17px/1.55 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}
main{max-width:30rem;margin:16px;padding:28px;background:#fffaf2;border-radius:18px;box-shadow:0 8px 30px #0001}h1{font-size:1.4rem;margin:0 0 .5rem}a{color:#b4402a;font-weight:600}</style></head>
<body><main><h1>${esc(title)}</h1><p>${text}</p><p>${slug ? `<a href="/projects/${esc(slug)}">See the project</a> · ` : ""}<a href="/">raavanaa.org</a></p></main></body></html>`,
  { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

export default async (req: Request) => {
  const db = getDatabase();
  const parts = new URL(req.url).pathname.replace(/^\/api\/follow\/?/, "").replace(/^\/(?=stop\/)/, "").split("/").filter(Boolean);

  if (parts[0] === "stop" && parts[1] && req.method === "GET") {
    const token = clip(parts[1], 64);
    const [r] = await db.sql<{ slug: string }>`UPDATE project_follows SET stopped_at = COALESCE(stopped_at, NOW()) WHERE token = ${token} RETURNING slug`;
    if (!r) return page("Link not found", "This stop link is not known. If you keep getting updates, reply to the message and we will take you off.");
    const t = TITLE[r.slug] || "this project";
    return page("Updates stopped", `You will not get any more updates about “${esc(t)}”. Thank you for following it. You can follow it again on the project page at any time.`, r.slug);
  }

  if (req.method === "GET" && !parts[0]) {
    const ups = (await db.sql<Record<string, any>>`SELECT id, slug, title, body, image, kind, amount, created_at FROM project_updates WHERE NOT hidden ORDER BY created_at DESC LIMIT 500`) as Record<string, any>[];
    const counts = (await db.sql<Record<string, any>>`SELECT slug, COUNT(*)::int AS n FROM project_follows WHERE stopped_at IS NULL GROUP BY slug`) as Record<string, any>[];
    const updates: Record<string, unknown[]> = {};
    // Live posts from the day carry a photo and the exact time. Receipts are not news: they go to the money page through
    // /api/books, and only once a second team member has checked them (Follow every rupee, 26 Nov 2026).
    for (const u of ups) {
      if (u.kind === "receipt") continue;
      const at = new Date(u.created_at).toISOString(), image = u.image ? `/api/day/photo/${u.image}` : "";
      (updates[u.slug] = updates[u.slug] || []).push({ id: u.id, date: at.slice(0, 10), at, title: u.title, body: u.body, image, live: u.kind === "live" });
    }
    return json({ updates, followers: Object.fromEntries(counts.map((c) => [c.slug, c.n])) }, 200, "public, max-age=30");
  }

  if (req.method === "POST" && !parts[0]) {
    let f: Record<string, unknown>;
    try { f = await req.json(); } catch { return json({ ok: false, error: "Could not read the form." }, 400); }
    if (clip(f["bot-field"], 10)) return json({ ok: true });
    const slug = String(f.slug || ""), name = clip(f.name, 80), contact = clip(f.contact, 120);
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) return json({ ok: false, error: "Unknown project." }, 400);
    if (!(await follow(db, slug, name, contact, "page"))) return json({ ok: false, error: "Please add a WhatsApp number (with country code if you are abroad) or an email address." }, 400);
    return json({ ok: true });
  }
  return json({ ok: false, error: "Not allowed" }, 405);
};

export const config: Config = { path: ["/api/follow", "/api/follow/*", "/stop/*"] };
