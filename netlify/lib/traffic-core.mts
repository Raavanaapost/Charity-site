// Traffic record (SURESH, 16 Nov 2026). Shared by /api/hit (counting), the portal's Traffic screen and the nightly
// GitHub copy. Nothing personal is stored: see netlify/database/migrations/20261116100000_site_hits.sql.
import type { getDatabase } from "@netlify/database";

type DB = ReturnType<typeof getDatabase>;

export const KINDS = ["view", "share", "give", "memory", "request", "vouch", "install"];
export const ACTIONS = ["give", "memory", "request", "vouch"]; // a visit "led to something"

// Names a visitor's source from the other website's name and the campaign words in the link.
// WhatsApp (and most phone apps) send no website name at all, so without a campaign link those visits are "direct".
const HOSTS: [RegExp, string][] = [
  [/(^|\.)whatsapp\.(com|net)$|^wa\.me$|^com\.whatsapp/, "whatsapp"],
  [/(^|\.)(facebook|fb)\.(com|me)$|^com\.facebook/, "facebook"],
  [/(^|\.)instagram\.com$|^com\.instagram/, "instagram"],
  [/(^|\.)google\.[a-z.]+$|^com\.google\.android\.(googlequicksearchbox|gm)/, "google"],
  [/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|ecosia\.org|baidu\.com|yandex\.[a-z]+|search\.brave\.com)$/, "search"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
  [/^raavanaapost\.raavanaa\.org$/, "raavanaapost"],
  [/(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com)$/, "email"],
];
const WORDS: [RegExp, string][] = [
  [/whats ?app|^wa[-_]|[-_]wa$|^wa$/, "whatsapp"], [/facebook|^fb[-_]|[-_]fb$|^fb$/, "facebook"], [/insta|^ig[-_]|[-_]ig$|^ig$/, "instagram"],
  [/google/, "google"], [/youtube|^yt[-_]|^yt$/, "youtube"], [/tiktok/, "tiktok"], [/email|newsletter|^mail/, "email"],
  [/raavanaapost|^rp[-_]/, "raavanaapost"], [/twitter|^x[-_]/, "x"], [/sms|text/, "sms"], [/qr|poster|flyer|leaflet/, "print"],
];

export const clean = (v: unknown, max: number) => String(v ?? "").toLowerCase().trim().replace(/[^a-z0-9._\/-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max);

export function classify(refHost: string, campaign: string, utmSource: string, clickId: string, ownHost: string) {
  const host = clean(refHost, 120).replace(/^www\./, "");
  const words = [clean(utmSource, 60), clean(campaign, 60)].filter(Boolean);
  for (const w of words) for (const [re, name] of WORDS) if (re.test(w)) return { source: name, host };
  if (clickId === "fb") return { source: "facebook", host };
  if (clickId === "ig") return { source: "instagram", host };
  if (clickId === "g") return { source: "google", host };
  if (!host || host === ownHost.replace(/^www\./, "")) return { source: words.length ? "other" : "direct", host: "" };
  for (const [re, name] of HOSTS) if (re.test(host)) return { source: name, host };
  return { source: "other", host };
}

export function device(ua: string) {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Opera Mini|IEMobile/i.test(ua)) return "phone";
  return "computer";
}
export const isBot = (ua: string) => !ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|headless|lighthouse|pingdom|uptime|curl|wget|python|node-fetch|axios|go-http|java\/|monitor|scan/i.test(ua);

const okTz = (tz: string) => /^(UTC|[A-Za-z]+(\/[A-Za-z0-9_+-]+){1,2})$/.test(tz) ? tz : "UTC";

type Row = Record<string, any>;
const n = (v: unknown) => Number(v) || 0;

// Everything the Traffic screen shows for one period [from, to).
export async function summary(db: DB, from: Date, to: Date, tzIn = "UTC") {
  const tz = okTz(tzIn);
  const f = from.toISOString(), t = to.toISOString();
  const span = to.getTime() - from.getTime();
  const pf = new Date(from.getTime() - span).toISOString();

  const totals = async (a: string, b: string) => {
    const [r] = await db.sql<Row>`SELECT
        count(*) FILTER (WHERE kind = 'view') AS views,
        count(DISTINCT visit) FILTER (WHERE kind = 'view') AS visits,
        count(*) FILTER (WHERE kind = 'share') AS shares,
        count(*) FILTER (WHERE kind = 'give') AS give,
        count(*) FILTER (WHERE kind = 'memory') AS memory,
        count(*) FILTER (WHERE kind = 'request') AS request,
        count(*) FILTER (WHERE kind = 'vouch') AS vouch,
        count(*) FILTER (WHERE kind = 'install') AS install,
        count(DISTINCT visit) FILTER (WHERE kind = 'view' AND app) AS app_visits
      FROM site_hits WHERE at >= ${a} AND at < ${b}`;
    return Object.fromEntries(Object.entries(r || {}).map(([k, v]) => [k, n(v)]));
  };

  // One row per visit (its landing page) with what it went on to do.
  const byVisit = (col: "source" | "campaign") => db.sql<Row>`
    WITH v AS (SELECT DISTINCT ON (visit) visit, source, campaign FROM site_hits
               WHERE kind = 'view' AND landing AND at >= ${f} AND at < ${t} ORDER BY visit, at),
         a AS (SELECT visit,
                 bool_or(kind IN ('give','memory','request','vouch')) AS acted,
                 count(*) FILTER (WHERE kind = 'share') AS shares,
                 count(*) FILTER (WHERE kind = 'view') AS pages
               FROM site_hits WHERE at >= ${f} AND at < ${t} GROUP BY visit)
    SELECT CASE WHEN ${col}::text = 'source' THEN v.source ELSE v.campaign END AS key,
           count(*) AS visits, count(*) FILTER (WHERE a.acted) AS acted, coalesce(sum(a.shares), 0) AS shares,
           round(avg(a.pages)::numeric, 1) AS pages
    FROM v LEFT JOIN a USING (visit)
    WHERE ${col}::text = 'source' OR v.campaign <> ''
    GROUP BY 1 ORDER BY visits DESC LIMIT 40`;

  const [now, before, daily, sources, campaigns, pages, countries, devices, hours, weekdays, shares, refs] = await Promise.all([
    totals(f, t), totals(pf, f),
    db.sql<Row>`SELECT to_char(date_trunc('day', at AT TIME ZONE ${tz}), 'YYYY-MM-DD') AS day,
        count(*) FILTER (WHERE kind = 'view') AS views, count(DISTINCT visit) FILTER (WHERE kind = 'view') AS visits,
        count(*) FILTER (WHERE kind IN ('give','memory','request','vouch')) AS actions, count(*) FILTER (WHERE kind = 'share') AS shares
      FROM site_hits WHERE at >= ${f} AND at < ${t} GROUP BY 1 ORDER BY 1`,
    byVisit("source"), byVisit("campaign"),
    db.sql<Row>`SELECT path AS key, count(*) AS views, count(DISTINCT visit) AS visits FROM site_hits
      WHERE kind = 'view' AND at >= ${f} AND at < ${t} GROUP BY 1 ORDER BY views DESC LIMIT 30`,
    db.sql<Row>`SELECT coalesce(nullif(country, ''), '??') AS key, count(DISTINCT visit) AS visits FROM site_hits
      WHERE kind = 'view' AND at >= ${f} AND at < ${t} GROUP BY 1 ORDER BY visits DESC LIMIT 30`,
    db.sql<Row>`SELECT CASE WHEN app THEN 'app' ELSE device END AS key, count(DISTINCT visit) AS visits FROM site_hits
      WHERE kind = 'view' AND at >= ${f} AND at < ${t} GROUP BY 1 ORDER BY visits DESC`,
    db.sql<Row>`SELECT extract(hour FROM at AT TIME ZONE ${tz})::int AS key, count(*) AS views FROM site_hits
      WHERE kind = 'view' AND at >= ${f} AND at < ${t} GROUP BY 1 ORDER BY 1`,
    db.sql<Row>`SELECT extract(isodow FROM at AT TIME ZONE ${tz})::int AS key, count(*) AS views FROM site_hits
      WHERE kind = 'view' AND at >= ${f} AND at < ${t} GROUP BY 1 ORDER BY 1`,
    db.sql<Row>`SELECT detail AS key, count(*) AS shares, count(DISTINCT path) AS pages FROM site_hits
      WHERE kind = 'share' AND at >= ${f} AND at < ${t} GROUP BY 1 ORDER BY shares DESC`,
    db.sql<Row>`SELECT ref_host AS key, count(*) AS visits FROM site_hits
      WHERE kind = 'view' AND landing AND ref_host <> '' AND at >= ${f} AND at < ${t} GROUP BY 1 ORDER BY visits DESC LIMIT 20`,
  ]);
  const num = (rows: Row[]) => rows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, k === "key" || k === "day" ? v : n(v)])));
  return {
    from: f, to: t, tz, now, before,
    daily: num(daily), sources: num(sources), campaigns: num(campaigns), pages: num(pages), countries: num(countries),
    devices: num(devices), hours: num(hours), weekdays: num(weekdays), shares: num(shares), refs: num(refs),
  };
}
