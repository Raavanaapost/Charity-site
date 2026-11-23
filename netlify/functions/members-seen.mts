// Members' activity (SURESH, 23 Nov 2026: "who is online, their activity log").
//   POST /api/members/seen  { k, p, d }  -> 204
// track.js sends this only when someone is signed in to the members sign-in. The server checks the sign-in itself,
// so nobody can write activity for another person. Visitors without an account are never recorded here.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";

const KINDS = ["view", "share", "give", "memory", "request", "vouch", "install"];
const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let b: Record<string, unknown>;
  try { b = JSON.parse(await req.text()); } catch { return done(); }
  const kind = KINDS.includes(String(b.k)) ? String(b.k) : "";
  if (!kind) return done();
  const path = String(b.p || "/").split(/[?#]/)[0].replace(/[^\w\/.~-]/g, "").slice(0, 160) || "/";
  if (/^\/(portal|admin)/.test(path)) return done();
  const page = path.replace(/^(\/ta)?\/e\/[^/]+/, "$1/e/(vouching link)");
  const detail = String(b.d || "").replace(/[^\w .-]/g, "").slice(0, 20);
  const user = await getUser().catch(() => null);
  const email = String(user?.email || "").toLowerCase();
  if (!email) return done();
  try { await getDatabase().sql`INSERT INTO member_activity (email, kind, path, detail) VALUES (${email}, ${kind}, ${page}, ${detail})`; }
  catch (e) { console.log("activity not saved:", (e as Error).message); }
  return done();
};

export const config: Config = {
  path: "/api/members/seen", method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 60 },
};
