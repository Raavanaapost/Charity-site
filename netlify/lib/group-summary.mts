// One group's or organisation's profile in short, for its link preview (share-preview edge function) and its share
// pictures (share-card.mts): name, badge, places, how many projects and how many are done (Impact), followers, logo.
// Linked raavanaa.org projects count with their live stage. Only listed profiles (the public API) are seen here.
// The made-up sample profiles exist on the draft preview and localhost only, never on raavanaa.org.
// No Node-only or Deno-only calls here: it runs in both.
import { allProgress } from "./share-progress.mts";

export type GroupSummary = {
  slug: string; name: string; type: "group" | "organisation"; kind: string; verified: boolean; checked: boolean;
  places: string; about: string; projects: number; done: number; followers: number; logo: string; v: string;
};

export const isTestHost = (host: string) => /^(draft--|localhost$|127\.0\.0\.1$)/.test(host) || /--charity-projects-draft\./.test(host);

const SAMPLE_LOGO = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#2f7f8f"/><path d="M50 22 74 66H26z" fill="#f2c14e"/><rect x="24" y="70" width="52" height="7" rx="2" fill="#fff"/></svg>');
const SAMPLES: Record<string, Omit<GroupSummary, "v">> = {
  "sample-group": { slug: "sample-group", name: "Jaffna Friends Circle", type: "group", kind: "WhatsApp circle", verified: false, checked: true, places: "Toronto, London, Jaffna",
    about: "Forty school friends from Jaffna, now in Toronto and London, making days happen back home.", projects: 3, done: 1, followers: 37, logo: "" },
  "sample-organisation": { slug: "sample-organisation", name: "Vanni Hope Foundation", type: "organisation", kind: "Charity or NGO", verified: true, checked: true, places: "Mullaitivu, Kilinochchi, London",
    about: "A registered charity that runs after-school classes and school days for children in Mullaitivu and Kilinochchi.", projects: 3, done: 1, followers: 112, logo: SAMPLE_LOGO },
  "sample-family": { slug: "sample-family", name: "The Rajan Family", type: "group", kind: "Family", verified: false, checked: true, places: "Toronto, Jaffna, Chennai",
    about: "Three generations of one family giving a day of joy every year, in Amma's memory.", projects: 2, done: 1, followers: 22, logo: "" },
};

export async function groupSummary(origin: string, slug: string): Promise<GroupSummary | null> {
  const u = new URL(origin);
  if (SAMPLES[slug]) { const s = SAMPLES[slug]; return isTestHost(u.hostname) ? { ...s, v: `${s.projects}-${s.done}` } : null; }
  let d: Record<string, any> | null = null;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
  try { const r = await fetch(new URL("/api/groups/" + encodeURIComponent(slug), origin), { signal: ctl.signal }); d = r.ok ? await r.json() : null; } catch (_) { d = null; } finally { clearTimeout(t); }
  if (!d || !d.ok || !d.group || d.group.status !== "listed") return null;
  const g = d.group, list: Record<string, any>[] = d.projects || [];
  let live: Record<string, { stage: number }> = {};
  if (list.some((p) => p.slug)) { try { live = await allProgress(origin); } catch (_) { live = {}; } }
  let projects = 0, done = 0;
  for (const p of list) {
    if (p.slug) { const pr = live[p.slug]; if (!pr) continue; projects++; if (pr.stage === 3) done++; }
    else { projects++; if (p.stage === "Impact") done++; }
  }
  const logoV = (String(g.logo || "").match(/v=(\d+)/) || [])[1] || "0";
  return { slug: g.slug, name: g.name, type: g.type === "organisation" ? "organisation" : "group", kind: g.kind || "", verified: !!g.verified, checked: !!g.checked,
    places: g.places || "", about: g.about || "", projects, done, followers: Number(g.followers) || 0, logo: g.logo || "", v: `${projects}-${done}-${logoV.slice(-6)}` };
}

// "3 projects, 2 done" (or "No projects yet").
export const projectLine = (s: GroupSummary) => !s.projects ? "No projects yet" : `${s.projects} project${s.projects === 1 ? "" : "s"}${s.done ? `, ${s.done} done` : ""}`;
export const badgeWord = (s: GroupSummary) => s.type === "organisation" ? (s.verified ? "Verified organisation" : "Organisation") : s.kind === "Family" ? "Family" : "Group";

// Who runs a Raavanaa project (the group or organisation the team linked as its owner), for the project's share picture
// and link preview: "Run by <name>". Empty when no listed group runs it (then Raavanaa runs it).
let linksCache: { at: number; map: Record<string, string> } | null = null;
export async function projectOwner(origin: string, slug: string): Promise<string> {
  if (!linksCache || Date.now() - linksCache.at > 60_000) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2000);
    try {
      const r = await fetch(new URL("/api/groups", origin), { signal: ctl.signal });
      const d = r.ok ? await r.json() : null, map: Record<string, string> = {};
      for (const l of (d && d.links) || []) if (l.role !== "partner" && !map[l.project]) map[l.project] = l.name;
      linksCache = { at: Date.now(), map };
    } catch (_) { linksCache = linksCache || { at: Date.now(), map: {} }; } finally { clearTimeout(t); }
  }
  return linksCache.map[slug] || "";
}
