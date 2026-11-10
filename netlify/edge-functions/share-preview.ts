// Link previews for shared pages (WhatsApp, Facebook, X, Telegram...).
// Project pages and vouching pages are built in the browser, but the apps that make link previews
// do not run JavaScript: they only read the <meta> tags. This puts each project's own title, words
// and picture (from share.json and img/share/) into those tags, in Tamil on /ta/ links.
// No children's names and no school names go in share.json (SURESH, 9 Nov 2026).
// While SITE_PASSWORD is set, the apps can only reach the open pages (/e/ vouching links); project
// previews start working for everyone once the password is removed at launch.
type Card = { title: string; text: string; title_ta?: string; text_ta?: string };
type Share = { default: Card; vouch?: Card; moment?: Card; projects: Record<string, Card> };

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

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const res = await context.next();
  if (res.status !== 200 || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  const url = new URL(request.url);
  const ta = url.pathname.startsWith("/ta/");
  const path = ta ? url.pathname.slice(3) : url.pathname;
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
    const slug = decodeURIComponent(path.replace(/^\/projects\//, "").replace(/\/+$/, "")).toLowerCase();
    card = share.projects[slug] || share.default;
    image = share.projects[slug] ? slug : "default";
  }
  const title = (ta && card.title_ta) || card.title;
  const text = (ta && card.text_ta) || card.text;
  const img = `${url.origin}/img/share/${image}${ta ? "-ta" : ""}.jpg`;

  let html = await res.text();
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", text);
  html = setMeta(html, "property", "og:image", img);
  html = setMeta(html, "property", "og:image:width", "1200");
  html = setMeta(html, "property", "og:image:height", "630");
  html = setMeta(html, "property", "og:url", url.origin + url.pathname);
  html = setMeta(html, "property", "og:locale", ta ? "ta_LK" : "en_GB");
  html = setMeta(html, "name", "twitter:card", "summary_large_image");
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", text);
  html = setMeta(html, "name", "twitter:image", img);
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  return new Response(html, { status: 200, headers });
};

export const config = { path: ["/projects/*", "/ta/projects/*", "/e/*", "/ta/e/*", "/moment", "/ta/moment", "/m/*", "/ta/m/*", "/fund", "/ta/fund"] };
