// Signed-in members: the requests they sent, so they can follow each one (SURESH, 9 Nov 2026).
//   GET /api/my-requests
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";
import data from "../../projects.json" with { type: "json" };
const TITLE: Record<string, string> = Object.fromEntries(((data as { projects?: { slug?: string; title?: string }[] }).projects || []).filter((p) => p && p.slug).map((p) => [p.slug!, p.title || p.slug!]));

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
  // Pledges this member made (signed in, or with the same email), so they can follow each project (17 Nov 2026).
  const em = user.email.toLowerCase();
  const gifts = ((await db.sql<Record<string, any>>`
    SELECT ref, amount, project_slug, status, received_at FROM give_requests
    WHERE (member_email = ${em} OR LOWER(contact) = ${em}) AND status <> 'closed' ORDER BY received_at DESC LIMIT 50`.catch(() => [])) as Record<string, any>[])
    .map((g) => ({ ref: g.ref, amount: g.amount, project: g.project_slug ? `/projects/${g.project_slug}` : "", title: g.project_slug ? TITLE[g.project_slug] || g.project_slug : "The Raavanaa Fund", received: g.received_at,
      step: g.status === "received" ? "Gift received. Thank you!" : g.status === "replied" ? "We have sent you the ways to fund" : "Pledged: we'll send you the ways to fund" }));
  return Response.json({ ok: true, requests, gifts }, { headers: { "Cache-Control": "no-store" } });
};

export const config: Config = { path: "/api/my-requests", method: "GET" };
