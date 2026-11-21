// Turn a request (suggestions row) into an Initiated project on the website (site_projects), in projects.json shape.
// Used by the portal's "Create the Initiated project" and "Publish now", and by the vouch page when the person in
// charge vouches (SURESH 20 Nov 2026: their one vouch puts it live).
import { getDatabase } from "@netlify/database";
import { notify } from "./notify.mts";

type DB = ReturnType<typeof getDatabase>;

// How many vouches put a request live, and whether one must come from someone in a role. SURESH 20 Nov 2026: one
// vouch from the person in charge for now; "eventually we make the voucher 3 people as we had before". To go back,
// set VOUCHES_NEEDED = 3 and VOUCH_NEEDS_ROLE = true.
export const VOUCHES_NEEDED = 1;
export const VOUCH_NEEDS_ROLE = false;
// A request goes live by itself once it has enough vouches (and the team approved its page for sharing).
export const LIVE_ON_VOUCH = true;

const day = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");
const amount = (v: unknown) => Math.max(0, Math.round(Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0));
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "project";
const ART: [RegExp, string][] = [[/kandy|temple of the tooth|perahera|dalada/i, "kandy"], [/beach|sea|ocean|casuarina/i, "beach"], [/bowl/i, "bowling"], [/zoo|animal|dehiwala/i, "zoo"],
  [/arcade|games|play ?zone|fun ?zone/i, "arcade"], [/mum|mother|women/i, "mums"], [/hill|mountain|waterfall|kovil|picnic|park|garden|trip|bus|excursion/i, "hills"]];
export const artFor = (t: string) => { for (const [re, n] of ART) if (re.test(t)) return `/img/project-${n}.svg`; return "/img/hero-initiated.svg"; };
const noNotes = (v: unknown) => String(v ?? "").replace(/\s*\([^)]*not (stated|given|known|mentioned)[^)]*\)/gi, "").trim();

// Budget lines: the portal's step 5 lines if there are any, otherwise the page's "Budget" box ("Bus: Rs 30,000").
function budgetOf(r: Record<string, any>) {
  const q = r.plan || {}, pf = r.profile || {};
  const fromPlan = (q.lines || []).filter((x: any) => x && x.item && x.amount > 0);
  if (fromPlan.length) return fromPlan;
  const fromPage = String(pf.budget || "").split("\n").map((l) => {
    const m = l.match(/^(.*?)[:\-–]\s*(?:rs\.?|lkr|රු)?\s*([\d,]+(?:\.\d+)?)\s*$/i);
    return m ? { item: m[1].trim(), amount: amount(m[2]) } : null;
  }).filter((x): x is { item: string; amount: number } => !!x && !!x.item && x.amount > 0);
  if (fromPage.length) return fromPage;
  const total = amount(pf.budget_total);
  return total ? [{ item: "Estimated cost", amount: total }] : [];
}

export type By = { email: string; name: string };

// Returns the project's slug (the existing one if it is already a project).
export async function makeProject(db: DB, id: number, by: By, how: "portal" | "publish" | "vouch"): Promise<string> {
  const [r] = await db.sql<Record<string, any>>`SELECT * FROM suggestions WHERE id = ${id}`;
  if (!r) throw new Error("Request not found");
  if (r.status === "project" && r.project_slug) return r.project_slug;
  const d = r.details || {}, q = r.plan || {}, pf = r.profile || {};
  const budget = budgetOf(r);
  const title = pf.title || d.title || r.title;
  const story = String(pf.summary || d.story || r.description || "").trim();
  let slug = slugify(title);
  const taken = await db.sql<{ slug: string }>`SELECT slug FROM site_projects WHERE slug LIKE ${slug + "%"}`;
  if ((taken as any[]).some((x) => x.slug === slug)) slug = `${slug}-${String(r.ref).toLowerCase()}`;
  const vouched = await db.sql<Record<string, any>>`SELECT name, relation, role FROM endorsements WHERE suggestion_id = ${id} AND NOT hidden ORDER BY created_at`;
  const place = pf.place || [r.village, r.city].filter(Boolean).join(", ") || r.location;
  const label = how === "vouch" || (vouched as any[]).length ? "Checked by Raavanaa and vouched for" : "Checked and approved by Raavanaa";
  const data = {
    title, slug, hidden: false, featured: false, theme: r.category === "Education" ? "Education" : "Trips & Events", status: "Planning",
    location: place, city: r.city || String(place).split(",").pop()!.trim(), organization: d.org || "Raavanaa",
    started: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    reach: noNotes(pf.children || r.children), verified: true, verified_label: label, currency: "Rs ",
    budget, goal: budget.reduce((a: number, x: any) => a + x.amount, 0), funders: [],
    date_set: false, booked: false, volunteers: false, steps: [],
    tagline: pf.tagline || "", summary: story.split("\n")[0],
    // Each saved line is its own paragraph on the page.
    story: `## The need and the plan\n\n${story.split("\n").filter(Boolean).join("\n\n")}` + (pf.impact ? `\n\n## The impact it will make\n\n${String(pf.impact).split("\n").filter(Boolean).join("\n\n")}` : ""), cover: artFor([title, pf.activity, story].join(" ")),
    expectations: (q.expect || []).map((text: string) => ({ text, result: "", note: "" })), impact: [], updates: [], photos: [], media: [],
    vouched: (vouched as any[]).map((v) => ({ name: v.name, role: v.role || (v.relation === "know" ? "Knows the person who asked" : "Has seen the need") })),
    submitted_by: r.request_type === "referred" && r.incharge_name ? r.incharge_name : String(r.contact || "").split(/[,(]/)[0].trim(),
    people: {
      requested_by: String(r.contact || "").split(/[,(]/)[0].trim(), requested_on: day(r.received_at),
      verified_by: r.verified_by || by.name, verified_on: day(r.verified_at || new Date()), approved_by: r.approved_by || by.name, approved_on: day(r.approved_at || new Date()),
    },
    from_request: r.ref,
  };
  await db.sql`INSERT INTO site_projects (slug, suggestion_id, data, created_by) VALUES (${slug}, ${id}, ${JSON.stringify(data)}::jsonb, ${by.email})`;
  await db.sql`UPDATE suggestions SET status = 'project', project_slug = ${slug}, updated_at = NOW() WHERE id = ${id}`;
  const why = how === "vouch" ? "Vouched for, so it went live as an Initiated project" : how === "publish" ? "Published by an admin as an Initiated project" : "Turned into an Initiated project";
  await db.sql`INSERT INTO suggestion_notes (suggestion_id, by_email, by_name, body) VALUES (${id}, ${by.email}, ${by.name}, ${why + ": /projects/" + slug})`;
  await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${by.email}, ${"suggestion.project." + how}, ${r.ref}, ${JSON.stringify({ slug })}::jsonb)`;
  // "Your project is listed" with the link, to the sender, the person in charge and who vouched (SURESH 21 Nov 2026).
  await notify(db, id, "listed", slug, data);
  return slug;
}
