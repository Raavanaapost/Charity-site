// The nightly GitHub copy of the traffic record (SURESH, 16 Nov 2026: "keep this in GitHub so we can see how it transitioned").
//   GET /api/traffic/day?d=YYYY-MM-DD   -> that day's summary (UTC day). Only totals, never single visits.
// No password to set up: the GitHub job proves who it is with GitHub's own signed token (OIDC), and this checks that
// the token was made by GitHub for a job in the Raavanaapost/Charity-site repository. (A TRAFFIC_KEY environment
// variable, sent as the x-traffic-key header, also works, for running it by hand.)
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { summary } from "../lib/traffic-core.mts";

const ISSUER = "https://token.actions.githubusercontent.com";
const REPO = "raavanaapost/charity-site";
const AUDIENCE = "raavanaa-traffic";

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));

async function fromGitHub(token: string) {
  const [h, p, sig] = token.split(".");
  if (!h || !p || !sig) return false;
  const head = JSON.parse(new TextDecoder().decode(b64url(h)));
  const claims = JSON.parse(new TextDecoder().decode(b64url(p)));
  if (head.alg !== "RS256" || claims.iss !== ISSUER || claims.aud !== AUDIENCE) return false;
  if (String(claims.repository || "").toLowerCase() !== REPO) return false;
  const now = Date.now() / 1000;
  if (!(claims.exp > now) || (claims.nbf && claims.nbf > now + 60)) return false;
  const jwks = await (await fetch(`${ISSUER}/.well-known/jwks`)).json();
  const jwk = (jwks.keys || []).find((k: { kid: string }) => k.kid === head.kid);
  if (!jwk) return false;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
}

export default async (req: Request) => {
  const key = Netlify.env.get("TRAFFIC_KEY") || "";
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  let ok = !!key && req.headers.get("x-traffic-key") === key;
  if (!ok && bearer) { try { ok = await fromGitHub(bearer); } catch { ok = false; } }
  if (!ok) return Response.json({ error: "Not allowed." }, { status: 403 });
  const d = new URL(req.url).searchParams.get("d") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return Response.json({ error: "Use ?d=YYYY-MM-DD" }, { status: 400 });
  const from = new Date(d + "T00:00:00Z"), to = new Date(from.getTime() + 864e5);
  const s = await summary(getDatabase(), from, to, "UTC");
  return Response.json({ day: d, ...s }, { headers: { "Cache-Control": "no-store" } });
};

export const config: Config = { path: "/api/traffic/day", method: "GET" };
