// Signed-in members: the requests they sent, so they can follow each one (SURESH, 9 Nov 2026).
//   GET /api/my-requests
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";

const STEP: Record<string, string> = {
  new: "Raavanaa is checking it", visit: "A visit is planned", verified: "Visited and verified", approved: "Approved by Raavanaa",
  declined: "Not taken forward", project: "Now a project",
};

export default async () => {
  const user = await getUser().catch(() => null);
  if (!user || !user.email) return Response.json({ ok: false, error: "Please sign in." }, { status: 401 });
  const db = getDatabase();
  const rows = await db.sql<Record<string, any>>`
    SELECT s.ref, s.title, s.received_at, s.status, s.share_ok, s.endorse_token, s.profile, s.project_slug,
           (SELECT COUNT(*)::int FROM endorsements e WHERE e.suggestion_id = s.id AND NOT e.hidden) AS vouched
    FROM suggestions s WHERE s.member_email = ${user.email.toLowerCase()} ORDER BY s.received_at DESC LIMIT 50`;
  const requests = (rows as Record<string, any>[]).map((r) => ({
    ref: r.ref, title: (r.profile || {}).title || r.title, received: r.received_at,
    step: r.status === "new" && r.share_ok ? "Approved: share it for people to vouch" : STEP[r.status] || r.status,
    shareOk: !!r.share_ok, vouched: r.vouched, link: r.endorse_token ? `/e/${r.endorse_token}` : "",
    project: r.project_slug ? `/projects/${r.project_slug}` : "",
  }));
  return Response.json({ ok: true, requests }, { headers: { "Cache-Control": "no-store" } });
};

export const config: Config = { path: "/api/my-requests", method: "GET" };
