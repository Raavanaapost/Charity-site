// Link previews for shared pages (WhatsApp, Facebook, X, Telegram...).
// Project pages and vouching pages are built in the browser, but the apps that make link previews
// do not run JavaScript: they only read the <meta> tags. This puts each project's own title, words
// and picture (from share.json and img/share/) into those tags, in Tamil on /ta/ links.
// No children's names and no school names go in share.json (SURESH, 9 Nov 2026).
// While SITE_PASSWORD is set, the apps can only reach the open pages (/e/ vouching links); project
// previews start working for everyone once the password is removed at launch.
import { allProgress, money, showsProgress, showsImpact, madePossibleBy, smilesLine, happeningWhen, lkDate } from "../lib/share-progress.mts";
import { groupSummary, projectLine, badgeWord, projectOwner } from "../lib/group-summary.mts";

type Card = { title: string; text: string; title_ta?: string; text_ta?: string };
type Share = { default: Card; vouch?: Card; moment?: Card; projects: Record<string, Card> };

const SITE_PAGES = /^\/(|index(\.html)?|overview|projects|initiated|activated|impact|about|spark|initiate|contact|how-it-works|money|groups)\/?$/;

let cache: { at: number; data: Share } | null = null;
async function loadShare(origin: string): Promise<Share | null> {
  if (cache && Date.now() - cache.at < 60_000) return cache.data;
  try {
    const password = Netlify.env.get("SITE_PASSWORD");
    const headers: Record<string, string> = password ? { Authorization: "Basic " + btoa("share:" + password) } : {};
    const res = await fetch(new URL("/share.json", origin), { headers });
    if (!res.ok) return cache?.data ?? null;
    cache = { at: Date.now(), data: await res.json() };
    return cache.data;
  } catch (_) {
    return cache?.data ?? null;
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function setMeta(html: string, attr: "property" | "name", key: string, value: string) {
  const tag = `<meta ${attr}="${key}" content="${esc(value)}">`;
  const re = new RegExp(`<meta ${attr}="${key.replace(/[:.]/g, "\\$&")}"[^>]*>`);
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `${tag}\n</head>`);
}

export default async (request: Request, context: { next: (req?: Request) => Promise<Response> }) => {
  // Facebook's crawler asks for the page with a Range header. The page then came back as "206 Partial Content", which
  // this function used to skip, so Facebook saw the plain logo and no og:url (SURESH 26 Nov 2026, Sharing Debugger).
  // Ask for the whole page instead; it is small, and the apps only read the <head>.
  let req = request;
  if (request.headers.has("range")) { const h = new Headers(request.headers); h.delete("range"); h.delete("if-range"); req = new Request(request, { headers: h }); }
  const res = await context.next(req);
  if (res.status !== 200 || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  const url = new URL(request.url);
  const ta = url.pathname.startsWith("/ta/");
  const path = ta ? url.pathname.slice(3) : url.pathname;
  // General pages (Home, Projects, the stage pages, About, Spark, Submit a need, Contact): the Raavanaa picture with the
  // heading and the three stage circles with today's counts, instead of the plain logo (SURESH, 26 Nov 2026).
  // ?v= changes with the counts, so apps fetch a fresh picture when a project moves stage.
  if (SITE_PAGES.test(path)) {
    let html = await res.text(), v = "";
    try { const list = Object.values(await allProgress(url.origin)); v = [1, 2, 3].map((n) => list.filter((p) => p.stage === n).length).join("-"); } catch (_) { /* no counts: still the picture */ }
    const img = `${url.origin}/api/share-card/site.jpg${v ? "?v=" + v : ""}`;
    html = setMeta(html, "property", "og:image", img);
    html = setMeta(html, "property", "og:image:width", "1200");
    html = setMeta(html, "property", "og:image:height", "630");
    html = setMeta(html, "property", "og:image:type", "image/jpeg");
    html = setMeta(html, "name", "twitter:card", "summary_large_image");
    html = setMeta(html, "name", "twitter:image", img);
    // A bare "Raavanaa" title says little in a feed: give it the line from the picture.
    if (/<meta property="og:title" content="Raavanaa">/.test(html)) {
      html = setMeta(html, "property", "og:title", "Raavanaa · Make a moment happen for children in Sri Lanka");
      html = setMeta(html, "name", "twitter:title", "Raavanaa · Make a moment happen for children in Sri Lanka");
    }
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    return new Response(html, { status: 200, headers });
  }
  // A group's or organisation's profile (SURESH 26 Nov 2026): its name, badge and "3 projects, 2 done", with its own
  // picture (logo or initials) from /api/share-card/g--<slug>.jpg. ?v= changes when the counts or the logo change.
  const gm = path.match(/^\/g\/([a-z0-9-]{1,80})\/?$/);
  if (gm) {
    const g = await groupSummary(url.origin, gm[1]).catch(() => null);
    if (!g) return res;
    let html = await res.text();
    const title = `${g.name} · Raavanaa`;
    const text = `${g.type === "organisation" || !g.kind || g.kind === "Other" ? badgeWord(g) : g.kind}${g.places ? " in " + g.places : ""}. ${projectLine(g)}. Follow us and see every project openly.`;
    const img = `${url.origin}/api/share-card/g--${g.slug}.jpg?v=${g.v}`;
    html = setMeta(html, "property", "og:title", title);
    html = setMeta(html, "property", "og:description", text);
    html = setMeta(html, "name", "description", text);
    html = setMeta(html, "property", "og:image", img);
    html = setMeta(html, "property", "og:image:width", "1200");
    html = setMeta(html, "property", "og:image:height", "630");
    html = setMeta(html, "property", "og:image:type", "image/jpeg");
    html = setMeta(html, "property", "og:url", url.origin + "/g/" + g.slug);
    html = setMeta(html, "name", "twitter:card", "summary_large_image");
    html = setMeta(html, "name", "twitter:title", title);
    html = setMeta(html, "name", "twitter:description", text);
    html = setMeta(html, "name", "twitter:image", img);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    return new Response(html, { status: 200, headers });
  }
  const share = await loadShare(url.origin);
  if (!share) return res;

  let card: Card, image: string;
  if ((path === "/moment" || path.startsWith("/m/")) && share.moment) {
    card = share.moment;
    image = "moment";
    // A family page (/m/<code>): the preview carries the words and the name ("In loving memory of Amma").
    const code = (path.match(/^\/m\/([a-z0-9]{6,16})\/?$/) || [])[1];
    if (code) {
      try {
        const r = await fetch(new URL("/api/moments/" + code, url.origin));
        const m = r.ok ? await r.json() : null;
        if (m && m.ok && m.name) card = { ...card, title: `${m.words ? m.words + " " : ""}${m.name}`, title_ta: `${m.words ? m.words + " " : ""}${m.name}` };
      } catch (_) { /* the page still gets the general moment preview */ }
    }
  } else if (path === "/fund") {
    card = share.default;
    image = "default";
  } else if (path.startsWith("/e/")) {
    card = share.vouch || share.default;
    image = "vouch";
  } else {
    const slug = decodeURIComponent(path.replace(/^\/projects\//, "").replace(/\/+$/, "").replace(/\/money$/, "")).toLowerCase();
    card = share.projects[slug] || share.default;
    image = share.projects[slug] ? slug : "default";
  }
  let title = (ta && card.title_ta) || card.title;
  let text = (ta && card.text_ta) || card.text;
  let img = `${url.origin}/img/share/${image}${ta ? "-ta" : ""}.jpg`;
  // Project pages (English) while money is being raised or once it is all raised: the picture is the project's funding
  // ring with today's % (SURESH, 25 Nov 2026), made by /api/share-card. ?v= changes with the %, so WhatsApp and
  // Facebook fetch a fresh picture when it moves. The words start with the % too, for apps that show no picture.
  if (!ta && path.startsWith("/projects/")) {
    const slug = decodeURIComponent(path.replace(/^\/projects\//, "").replace(/\/+$/, "").replace(/\/money$/, "")).toLowerCase();
    try {
      const live = url.searchParams.get("gifts") === "live" && !/(^|\.)raavanaa\.org$/.test(url.hostname);
      const pr = (await allProgress(url.origin, live))[slug];
      if (pr && showsProgress(pr)) {
        const full = pr.stage === 2 || pr.pct >= 100;
        img = `${url.origin}/api/share-card/${slug}.jpg?v=${pr.stage === 2 ? "a" + lkDate() : full ? 100 : pr.pct}${live ? "&gifts=live" : ""}`;
        // A project made in the portal has no words of its own in share.json: use its title, not the general one.
        if (!share.projects[slug]) { title = pr.title; if (pr.blurb) text = pr.blurb; }
        // Fully funded: no "help make it happen" ask in the words (SURESH 26 Nov 2026), the project's own line instead.
        if (full && pr.blurb) text = pr.blurb;
        // Activated: just that it is happening, and thank you (SURESH 26 Nov 2026: "happenings now as highlight").
        text = (full ? "Fully funded, thank you. " : `${pr.pct}% funded, ${money(pr, Math.max(0, pr.goal - pr.raised))} still to go. `) + text;
        if (pr.stage === 2) { const w = happeningWhen(pr.day); const n = pr.names || [], who = n.length > 1 ? n.slice(0, -1).join(", ") + " and " + n[n.length - 1] : n[0] || "";
          const d = pr.day ? new Date(pr.day + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : "";
          text = `Thank you ${who ? who + "," : "to everyone"} who made this possible.${d ? " " + d : ""}${pr.place ? ", " + pr.place : ""}.`; }
        // Associates (SURESH 26 Nov 2026): the group or organisation that runs it.
        const owner = await projectOwner(url.origin, slug).catch(() => "");
        if (owner) text = `Run by ${owner}. ` + text;
      } else if (pr && showsImpact(pr)) {
        // Impact (SURESH 27 Nov 2026): "52 smiles made", the givers by name, a picture from the day; no date.
        img = `${url.origin}/api/share-card/${slug}.jpg?v=i2${live ? "&gifts=live" : ""}`;
        if (!share.projects[slug]) title = pr.title;
        const who = madePossibleBy(pr);
        text = `${smilesLine(pr)}.${who ? ` Moment created by ${who}.` : ""}`;
      }
    } catch (_) { /* keep the usual picture */ }
  }

  let html = await res.text();
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", text);
  html = setMeta(html, "property", "og:image", img);
  html = setMeta(html, "property", "og:image:width", "1200");
  html = setMeta(html, "property", "og:image:type", "image/jpeg");
  html = setMeta(html, "property", "og:image:height", "630");
  // Keep ?p=<funded %> in og:url, so Facebook treats a link with a new % as new and shows the fresh picture.
  const pq = url.searchParams.get("p");
  html = setMeta(html, "property", "og:url", url.origin + url.pathname + (pq && /^\d{1,3}$/.test(pq) ? "?p=" + pq : ""));
  html = setMeta(html, "property", "og:locale", ta ? "ta_LK" : "en_GB");
  html = setMeta(html, "name", "twitter:card", "summary_large_image");
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", text);
  html = setMeta(html, "name", "twitter:image", img);
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  return new Response(html, { status: 200, headers });
};

export const config = { path: ["/", "/index.html", "/overview", "/projects", "/initiated", "/activated", "/impact", "/about", "/spark", "/initiate", "/contact", "/how-it-works", "/money", "/projects/*", "/ta/projects/*", "/e/*", "/ta/e/*", "/moment", "/ta/moment", "/m/*", "/ta/m/*", "/fund", "/ta/fund", "/groups", "/g/*"] };
