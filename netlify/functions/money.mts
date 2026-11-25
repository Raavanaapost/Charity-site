// Public: Open Books, raavanaa.org/money (SURESH, 25 Nov 2026, option B): every gift and every spend in one place.
//   GET /api/money -> { as_of, rate_cad, projects: [...], gifts: [...], spent: [...] }
// Gifts come from the same two places the project pages use, so the % on a project and this page always agree:
//   1. the Be the smile form (give_requests: new, replied or received; Close in the portal takes one off)
//   2. sponsors written into projects.json "funders" (minus the ones the team removed in the portal)
// A gift is "received" once the team pressed Gift received (or the funder has a "received" date, or the project is in
// Impact, where the day already happened); until then it is "promised". All amounts are in Sri Lankan rupees.
// Never shown: phone numbers, emails, cities, team notes. Names follow each giver's own choice (Anonymous stays Anonymous,
// "name only" hides the amount in the list but it still counts in the totals).
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import data from "../../projects.json" with { type: "json" };
import siteData from "../../site.json" with { type: "json" };

type Funder = { name?: string; amount?: number | string; received?: string; date?: string; country?: string; hide_amount?: boolean; list?: boolean };
type Spend = { date?: string; item?: string; amount?: number | string; receipt?: string };
type Project = {
  slug?: string; title?: string; status?: string; currency?: string; goal?: number | string; verified?: boolean; hidden?: boolean;
  location?: string; budget?: { item?: string; amount?: number | string }[]; funders?: Funder[]; money?: { spent?: Spend[] };
};

const FRIEND = "Anonymous";
const RATE_CAD = Number((siteData as { rate_lkr_per_cad?: unknown }).rate_lkr_per_cad) || 0;
const num = (v: unknown) => Number(String(v ?? "").replace(/[^0-9.]/g, "")) || 0;
const isRupees = (p: Project) => /rs|lkr|රු|ரூ/i.test(p.currency || "");
// Projects in dollars ("$", the site's default) are Canadian dollars, at the team's rate in site.json.
const toRs = (p: Project, v: number) => Math.round(isRupees(p) ? v : v * RATE_CAD);
const day = (v: unknown) => (/^\d{4}-\d{2}-\d{2}/.test(String(v || "")) ? String(v).slice(0, 10) : "");
// Only projects the public can see (checked and not hidden), as on the project pages.
const isPublic = (p: Project) => !!(p && p.title && p.slug && !p.hidden && p.verified);
const FILE_PROJECTS = ((data as { projects?: Project[] }).projects || []).filter(isPublic);

type Gift = { date: string; name: string; amount: number | null; counted: number; project: string; status: "received" | "promised"; country: string; via: "form" | "team" };

export default async () => {
  const db = getDatabase();
  let rows: { ref: string; project_slug: string; name: string; amount_value: number; listing: string; listing_words: string; status: string; received_at: string; received_on: string | null; country: string }[] = [];
  let removed: { slug: string; name: string; amount: number }[] = [];
  try {
    rows = await db.sql`SELECT ref, project_slug, name, amount_value, listing, listing_words, status, received_at, received_on, country FROM give_requests
      WHERE kind = 'project' AND project_slug <> '' AND amount_value > 0 AND status IN ('new', 'replied', 'received') ORDER BY received_at`;
  } catch (e) { console.log("money: gifts not read:", (e as Error).message); }
  try { removed = await db.sql`SELECT slug, name, amount FROM funder_removals`; } catch (e) { console.log("money: removals not read:", (e as Error).message); }

  // Projects the team made from requests in the portal live in the database (site_projects); projects.json wins on a clash.
  let PROJECTS = FILE_PROJECTS;
  try {
    const made = (await db.sql`SELECT data FROM site_projects WHERE NOT hidden`) as { data: Project }[];
    const have = new Set(FILE_PROJECTS.map((p) => p.slug));
    PROJECTS = [...FILE_PROJECTS, ...made.map((r) => r.data).filter((p) => isPublic(p) && !have.has(p.slug))];
  } catch (e) { console.log("money: site projects not read:", (e as Error).message); }
  const gifts: Gift[] = [];
  const bySlug = new Map(PROJECTS.map((p) => [p.slug as string, p]));
  for (const p of PROJECTS) {
    const off = removed.filter((r) => r.slug === p.slug);
    for (const f of p.funders || []) {
      if (!f || !f.name || /test/i.test(f.name)) continue;
      const i = off.findIndex((r) => r.name === f.name && Number(r.amount) === num(f.amount));
      if (i >= 0) { off.splice(i, 1); continue; }
      const v = toRs(p, num(f.amount));
      if (!v) continue;
      const got = !!day(f.received) || /complete/i.test(p.status || "");
      gifts.push({ date: day(f.received) || day(f.date), name: f.list === false ? FRIEND : String(f.name), amount: f.hide_amount ? null : v, counted: v,
        project: p.slug as string, status: got ? "received" : "promised", country: String(f.country || ""), via: "team" });
    }
  }
  for (const r of rows) {
    const p = bySlug.get(r.project_slug);
    if (!p) continue;
    const v = Math.round(Number(r.amount_value));
    const name = r.listing === "anonymous" ? FRIEND : r.listing === "own" && r.listing_words ? r.listing_words : r.name;
    const got = r.status === "received";
    gifts.push({ date: got && r.received_on ? day(new Date(r.received_on).toISOString()) : day(new Date(r.received_at).toISOString()), name, amount: r.listing === "name" ? null : v, counted: v,
      project: r.project_slug, status: got ? "received" : "promised", country: r.country || "", via: "form" });
  }
  gifts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const spent = PROJECTS.flatMap((p) => (p.money?.spent || []).filter((s) => s && s.item && num(s.amount) > 0)
    .map((s) => ({ date: day(s.date), project: p.slug as string, item: String(s.item), amount: toRs(p, num(s.amount)), receipt: !!s.receipt })));

  // Each project's stage, worked out the way the project pages do it: Impact when the day is done; Activated when it
  // is checked and its whole goal is covered; otherwise Initiated.
  const projects = PROJECTS.map((p) => {
    const goal = toRs(p, num(p.goal) || (p.budget || []).filter((x) => x && x.item).reduce((s, x) => s + num(x.amount), 0));
    const raised = gifts.filter((g) => g.project === p.slug).reduce((s, g) => s + g.counted, 0);
    const stage = /complete/i.test(p.status || "") ? "Impact" : p.verified && goal > 0 && raised >= goal ? "Activated" : "Initiated";
    return { slug: p.slug, title: p.title, stage, goal, place: String(p.location || "").split(",")[0].trim() };
  });

  return Response.json({ as_of: new Date().toISOString(), rate_cad: RATE_CAD, projects, gifts, spent },
    { headers: { "Cache-Control": "public, max-age=30" } });
};

export const config: Config = { path: "/api/money", method: ["GET"], rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 60 } };
