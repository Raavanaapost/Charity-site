// How far a project's money has come, worked out on the server for link previews (SURESH, 25 Nov 2026: "when I share
// that 30% completed ... tag the % section as the preview of the sharing link"). Used by the share-preview edge
// function (og:image address and words) and by share-card.mts (the picture itself).
// It follows the same rules as site.js (budgetOf, stageNum, the "Funded" ring step), so the % in the preview is the
// % on the page: projects.json + projects made in the portal (/api/projects), hand-added sponsors the team removed
// are left out, card gifts and pledges from the giving form are added.
// No Node-only or Deno-only calls here: it runs in both.

export type Progress = {
  slug: string; title: string; stage: 1 | 2 | 3; goal: number; raised: number; pct: number;
  currency: string; kids: number | null; cover: string; blurb: string;
};
type P = Record<string, any>;

const numOf = (v: unknown) => { const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
const slugify = (s: string) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
const slugOf = (p: P) => slugify(p.slug || p.title);

let cache: { at: number; data: Record<string, Progress> } | null = null;

async function getJSON(url: URL, ms = 2500) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal }); return r.ok ? await r.json() : null; } catch (_) { return null; } finally { clearTimeout(t); }
}

export async function allProgress(origin: string): Promise<Record<string, Progress>> {
  if (cache && Date.now() - cache.at < 60_000) return cache.data;
  const [data, made, give] = await Promise.all([
    getJSON(new URL("/projects.json", origin)), getJSON(new URL("/api/projects", origin)), getJSON(new URL("/api/give/totals", origin))]);
  if (!data) return cache?.data ?? {};
  let list: P[] = data.projects || [];
  if (made && made.projects) { const have = new Set(list.map((p) => p.slug)); list = [...list, ...made.projects.filter((p: P) => p && !have.has(p.slug))]; }
  const out: Record<string, Progress> = {};
  for (const p0 of list) {
    if (!p0 || !p0.title || p0.hidden || !p0.verified) continue;
    const p = { ...p0 }, slug = slugOf(p);
    let funders: P[] = (p.funders || []).slice();
    const off = ((give && give.removed && give.removed[slug]) || []).slice();
    if (off.length) funders = funders.filter((f) => { const i = off.findIndex((x: P) => x.name === String(f && f.name || "").trim() && +x.amount === numOf(f.amount)); if (i < 0) return true; off.splice(i, 1); return false; });
    const gifts = give && give.projects && give.projects[slug];
    if (gifts && gifts.gifts) funders = [...funders, ...gifts.gifts];
    funders = [...funders, ...((give && give.pledges && give.pledges[slug]) || [])];
    const goal = numOf(p.goal) || (p.budget || []).filter((x: P) => x && x.item).reduce((s: number, x: P) => s + numOf(x.amount), 0);
    const raised = funders.filter((x) => x && x.name).reduce((s, x) => s + numOf(x.amount), 0);
    const stage = /complete/i.test(p.status || "") ? 3 : goal > 0 && raised >= goal ? 2 : 1;
    const kids = String(p.reach || "").match(/\d+/);
    out[slug] = {
      slug, title: String(p.title), stage, goal, raised, pct: goal ? Math.min(100, Math.round(raised / goal * 100)) : 0,
      currency: String(p.currency || "$").trim() || "$", kids: kids ? +kids[0] : null, cover: String(p.cover || ""),
      blurb: String(p.tagline || String(p.summary || "").split(/(?<=[.!?])\s/)[0] || "").trim(),
    };
  }
  cache = { at: Date.now(), data: out };
  return out;
}

// "Rs 46,377" / "$450", as on the page.
export const money = (pr: Progress, n: number) => `${pr.currency}${pr.currency.length > 1 ? " " : ""}${Math.round(n).toLocaleString("en-US")}`;

// A preview card with the % only makes sense while money is being raised (Initiated with a budget) or once it is all
// raised (Activated). Impact projects keep their own picture.
export const showsProgress = (pr: Progress | undefined) => !!pr && pr.goal > 0 && pr.stage < 3;
