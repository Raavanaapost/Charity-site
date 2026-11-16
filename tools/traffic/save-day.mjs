// Nightly traffic record (SURESH, 16 Nov 2026: "keep the record in GitHub so we can see how Raavanaa transitioned,
// and study which campaigns and groups work"). Run by .github/workflows/traffic-record.yml.
//   node save-day.mjs <record-folder> [YYYY-MM-DD]    (default: yesterday, UTC)
// Saves <record>/daily/YYYY/YYYY-MM-DD.json (the day's totals from https://raavanaa.org/api/traffic/day),
// rebuilds <record>/daily.csv, the weekly notes <record>/weekly/YYYY-Www.md and <record>/README.md.
// Only totals are saved. Memory page codes (/m/<code>) are folded together so no single family's page is listed.
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] || "traffic");
const day = process.argv[3] || new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const key = process.env.TRAFFIC_KEY || "";
const site = process.env.SITE || "https://raavanaa.org";
if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) { console.error("Day must be YYYY-MM-DD"); process.exit(1); }
if (!key) { console.log("::notice::TRAFFIC_KEY is not set in GitHub secrets yet, so nothing was saved."); process.exit(0); }

const res = await fetch(`${site}/api/traffic/day?d=${day}`, { headers: { "x-traffic-key": key, "user-agent": "raavanaa-traffic-record" } });
if (res.status === 404) { console.log("::notice::The counter is not live on the site yet."); process.exit(0); }
if (!res.ok) { console.error(`The site answered ${res.status}`); process.exit(1); }
const s = await res.json();

// Fold the memory pages (/m/<code>) and Tamil memory pages into one line each.
const fold = new Map();
for (const p of s.pages || []) {
  const k = String(p.key).replace(/^(\/ta)?\/m\/[^/]+$/, "$1/m/(memory pages)");
  const o = fold.get(k) || { key: k, views: 0, visits: 0 };
  o.views += p.views; o.visits += p.visits; fold.set(k, o);
}
s.pages = [...fold.values()].sort((a, b) => b.views - a.views);
delete s.before; // the day before is its own file

const yearDir = path.join(dir, "daily", day.slice(0, 4));
fs.mkdirSync(yearDir, { recursive: true });
fs.writeFileSync(path.join(yearDir, `${day}.json`), JSON.stringify(s, null, 2) + "\n");
console.log(`Saved ${day}: ${s.now.visits} visits, ${s.now.views} pages`);

// ---- daily.csv: one line per day, rebuilt from every saved day ----
const all = [];
for (const y of fs.readdirSync(path.join(dir, "daily")).filter(x => /^\d{4}$/.test(x)).sort())
  for (const f of fs.readdirSync(path.join(dir, "daily", y)).filter(x => x.endsWith(".json")).sort())
    all.push(JSON.parse(fs.readFileSync(path.join(dir, "daily", y, f), "utf8")));
const SRC = ["direct", "whatsapp", "facebook", "instagram", "google", "search", "raavanaapost", "email", "print", "other"];
const visitsFrom = (d, k) => (d.sources || []).find(x => x.key === k)?.visits || 0;
const top = (list, k) => (list || [])[0]?.[k] ?? "";
const acted = n => (n.give || 0) + (n.memory || 0) + (n.request || 0) + (n.vouch || 0);
const head = ["day", "visits", "pages", "led_to_something", "give_requests", "memory_pages", "project_requests", "vouches", "shares", "app_installs",
  ...SRC.map(k => "from_" + k), "top_campaign", "top_country", "top_page"];
const rows = all.map(d => [d.day, d.now.visits, d.now.views, acted(d.now), d.now.give, d.now.memory, d.now.request, d.now.vouch, d.now.shares, d.now.install,
  ...SRC.map(k => visitsFrom(d, k)), top(d.campaigns, "key"), top(d.countries, "key"), top(d.pages, "key")]);
const csv = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
fs.writeFileSync(path.join(dir, "daily.csv"), [head, ...rows].map(r => r.map(csv).join(",")).join("\n") + "\n");

// ---- weekly notes (Monday to Sunday), rebuilt for every week that has days ----
const isoWeek = d => {
  const t = new Date(d + "T12:00:00Z"), wd = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - wd + 3);
  const y = t.getUTCFullYear(), first = new Date(Date.UTC(y, 0, 4));
  return `${y}-W${String(1 + Math.round(((t - first) / 864e5 - 3 + ((first.getUTCDay() + 6) % 7)) / 7)).padStart(2, "0")}`;
};
const add = (m, k, v) => m.set(k, (m.get(k) || 0) + v);
const list = (m, n = 8) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
const NAMES = { direct: "Direct or WhatsApp (unknown)", whatsapp: "WhatsApp", facebook: "Facebook", instagram: "Instagram", google: "Google", search: "Other search",
  raavanaapost: "RaavanaaPost", email: "Email", print: "Poster or QR", x: "X", youtube: "YouTube", tiktok: "TikTok", other: "Other websites" };
const weeks = new Map();
for (const d of all) { const w = isoWeek(d.day); if (!weeks.has(w)) weeks.set(w, []); weeks.get(w).push(d); }
fs.mkdirSync(path.join(dir, "weekly"), { recursive: true });
const sumWeek = days => {
  const t = { visits: 0, views: 0, acted: 0, give: 0, memory: 0, request: 0, vouch: 0, shares: 0, install: 0 };
  const src = new Map(), camp = new Map(), ctry = new Map(), page = new Map();
  for (const d of days) {
    for (const k of ["visits", "views", "give", "memory", "request", "vouch", "shares", "install"]) t[k] += d.now[k] || 0;
    t.acted += acted(d.now);
    (d.sources || []).forEach(x => add(src, x.key, x.visits)); (d.campaigns || []).forEach(x => add(camp, x.key, x.visits));
    (d.countries || []).forEach(x => add(ctry, x.key, x.visits)); (d.pages || []).forEach(x => add(page, x.key, x.views));
  }
  return { t, src, camp, ctry, page };
};
const wkList = [...weeks.keys()].sort();
const summaries = new Map(wkList.map(w => [w, sumWeek(weeks.get(w))]));
wkList.forEach((w, i) => {
  const { t, src, camp, ctry, page } = summaries.get(w), prev = i ? summaries.get(wkList[i - 1]).t : null;
  const days = weeks.get(w).map(d => d.day).sort();
  const ch = (a, b) => b == null ? "" : !b ? (a ? " (new)" : "") : ` (${a >= b ? "+" : ""}${Math.round((a - b) / b * 100)}% on the week before)`;
  const md = [`# Raavanaa traffic, week ${w}`, "", `${days[0]} to ${days[days.length - 1]} (${days.length} day${days.length === 1 ? "" : "s"} recorded)`, "",
    `- **Visits:** ${t.visits}${ch(t.visits, prev?.visits)}`, `- **Pages seen:** ${t.views}${ch(t.views, prev?.views)}`,
    `- **Led to something:** ${t.acted}${ch(t.acted, prev?.acted)} (give requests ${t.give}, memory pages ${t.memory}, project requests ${t.request}, vouches ${t.vouch})`,
    `- **Shares:** ${t.shares}${ch(t.shares, prev?.shares)} · **App installs:** ${t.install}`, "",
    "## Where visitors came from", "", ...list(src).map(([k, v]) => `- ${NAMES[k] || k}: ${v}`), "",
    "## Campaigns", "", ...(camp.size ? list(camp).map(([k, v]) => `- ${k}: ${v}`) : ["- none used"]), "",
    "## Countries", "", ...list(ctry).map(([k, v]) => `- ${k}: ${v}`), "",
    "## Top pages", "", ...list(page).map(([k, v]) => `- ${k}: ${v}`), ""].join("\n");
  fs.writeFileSync(path.join(dir, "weekly", `${w}.md`), md);
});

// ---- README: the story so far, one line per week ----
const readme = ["# Raavanaa traffic record", "",
  "raavanaa.org's own count of visits, saved every night by the GitHub job *Traffic record* (SURESH, 16 Nov 2026).",
  "Netlify keeps only 7 days; this keeps everything, so we can see how Raavanaa grows and which campaigns and groups work.",
  "Only totals are kept: no IP address, cookie, name or exact place. WhatsApp hides where its visitors come from, so they count as",
  "\"Direct or WhatsApp (unknown)\" unless they arrive through a campaign link (made in the team portal, Traffic).", "",
  "- `daily.csv`: one line per day (open it in Google Sheets or Excel to make charts)",
  "- `daily/YYYY/YYYY-MM-DD.json`: everything for one day", "- `weekly/YYYY-Www.md`: a short note per week", "",
  "| Week | Visits | Pages | Led to something | Shares | Top source | Top campaign |", "|---|---:|---:|---:|---:|---|---|",
  ...[...wkList].reverse().map(w => { const { t, src, camp } = summaries.get(w); const s1 = list(src, 1)[0], c1 = list(camp, 1)[0];
    return `| [${w}](weekly/${w}.md) | ${t.visits} | ${t.views} | ${t.acted} | ${t.shares} | ${s1 ? NAMES[s1[0]] || s1[0] : ""} | ${c1 ? c1[0] : ""} |`; }), ""].join("\n");
fs.writeFileSync(path.join(dir, "README.md"), readme);
