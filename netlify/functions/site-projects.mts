// Public: projects the team created from requests in the portal (SURESH, 10 Nov 2026). The website shows them next to
// the ones in projects.json, in the same shape. Only what the team approved for the page is in here.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";

export default async () => {
  const rows = await getDatabase().sql<{ data: Record<string, unknown> }>`SELECT data FROM site_projects WHERE NOT hidden ORDER BY created_at DESC`;
  return Response.json({ projects: (rows as { data: Record<string, unknown> }[]).map((r) => r.data) }, { headers: { "Cache-Control": "public, max-age=60" } });
};

export const config: Config = { path: "/api/projects", method: ["GET"] };
