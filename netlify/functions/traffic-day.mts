// The nightly GitHub copy of the traffic record (SURESH, 16 Nov 2026: "keep this in GitHub so we can see how it transitioned").
//   GET /api/traffic/day?d=YYYY-MM-DD   header x-traffic-key: <TRAFFIC_KEY>   -> that day's summary (UTC day)
// Only totals, never single visits. The key lives in Netlify (TRAFFIC_KEY) and in GitHub (secret TRAFFIC_KEY).
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { summary } from "../lib/traffic-core.mts";

export default async (req: Request) => {
  const key = Netlify.env.get("TRAFFIC_KEY") || "";
  if (!key || req.headers.get("x-traffic-key") !== key) return Response.json({ error: "Not allowed." }, { status: 403 });
  const d = new URL(req.url).searchParams.get("d") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return Response.json({ error: "Use ?d=YYYY-MM-DD" }, { status: 400 });
  const from = new Date(d + "T00:00:00Z"), to = new Date(from.getTime() + 864e5);
  const s = await summary(getDatabase(), from, to, "UTC");
  return Response.json({ day: d, ...s }, { headers: { "Cache-Control": "no-store" } });
};

export const config: Config = { path: "/api/traffic/day", method: "GET" };
