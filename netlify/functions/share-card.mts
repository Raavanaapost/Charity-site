// The picture shown when a project page is shared (WhatsApp, Facebook, X...), made fresh with the project's own
// funding %: the same ring as the "Activating" box on the page (SURESH, 25 Nov 2026: "when I share that 30% completed
// ... tag the % section as the preview of the sharing link so people can see it right away").
//   /api/share-card/<slug>.jpg?v=<pct>   1200x630 JPEG
// The ?v= is only there so the address changes when the % changes (apps keep a picture per address); the % drawn is
// always worked out here from the live data. No children's photos: the right side is the project's drawing.
import type { Config, Context } from "@netlify/functions";
import { Resvg } from "@resvg/resvg-js";
import jpeg from "jpeg-js";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { allProgress, money, showsProgress, happeningWhen, type Progress } from "../lib/share-progress.mts";
import * as A from "../lib/card-assets.mts";

// resvg reads fonts from files only, so they are written to /tmp once per warm function.
const FONT_DIR = "/tmp/raav-card-fonts";
function fontFiles() {
  const files = { "cinzel700.ttf": A.cinzel700, "inter500.ttf": A.inter500, "inter600.ttf": A.inter600, "inter800.ttf": A.inter800 };
  mkdirSync(FONT_DIR, { recursive: true });
  return Object.entries(files).map(([name, b64]) => { const f = `${FONT_DIR}/${name}`; if (!existsSync(f)) writeFileSync(f, Buffer.from(b64, "base64")); return f; });
}

const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

// Word wrap by a rough width per letter (good enough for a fixed card); the last line gets "…" if it runs over.
function wrap(text: string, perLine: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean), lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > perLine && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); keep[maxLines - 1] = keep[maxLines - 1].replace(/[\s,.:;]*\S*$/, "") + "…"; return keep; }
  return lines;
}

// The drawing for the right side: the one share.json names for the project, else its own drawing, else the hills.
async function artData(origin: string, pr: Progress) {
  let art = "";
  try { const s = await (await fetch(new URL("/share.json", origin))).json(); art = (s.projects && s.projects[pr.slug] && s.projects[pr.slug].art) || ""; } catch (_) { /* fall back below */ }
  const ok = (a: string) => /\.(svg|jpe?g|png)(\?|$)/i.test(a);
  if (!ok(art)) art = ok(pr.cover) && pr.cover.startsWith("/") ? pr.cover : "/img/project-hills.svg";
  try {
    const r = await fetch(new URL(art, origin));
    if (r.ok) {
      const type = /\.svg/i.test(art) ? "image/svg+xml" : /\.png/i.test(art) ? "image/png" : "image/jpeg";
      return `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
    }
  } catch (_) { /* no drawing: the cream panel still reads well */ }
  return "";
}

// Activated (fully funded, the day is coming): the picture shows that it is happening, not the money (SURESH 26 Nov
// 2026: "happenings now as highlight ... Simple but dont need to focus the 100% circle").
function happeningSVG(pr: Progress, art: string) {
  // v4 (SURESH 26 Nov 2026: back to the cream card, no green; title and heading toward the centre; make "Happening
  // today" stand out): the words sit centred in the cream part, the day is white on a warm red-to-amber ribbon.
  const w = happeningWhen(pr.day), title = wrap(pr.title, 36, 2), cx = 418;
  const top = w.top.toUpperCase(), big = w.big.toUpperCase();
  const fsTop = Math.min(54, Math.floor(680 / (top.length * 0.8))), fsBig = Math.min(118, Math.floor(600 / (big.length * 0.8)));
  const bw = Math.min(740, Math.round(big.length * fsBig * 0.8 + 90)), bh = Math.round(fsBig * 1.18);
  const yTop = 162 + fsTop, yBox = yTop + 22, yBig = yBox + Math.round(bh / 2 + fsBig * 0.36);
  const yTitle = yBox + bh + 52;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#fbf6ea" stop-opacity="0"/></linearGradient>
    <linearGradient id="rib" x1="0" x2="1"><stop offset="0" stop-color="#b8321a"/><stop offset="1" stop-color="#e0780f"/></linearGradient>
    <clipPath id="right"><rect x="836" y="0" width="364" height="630"/></clipPath>
    <filter id="sh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#7a2a0a" flood-opacity=".28"/></filter>
  </defs>
  <rect width="1200" height="630" fill="#fbf6ea"/>
  ${art ? `<image x="836" y="0" width="364" height="630" preserveAspectRatio="xMidYMid slice" clip-path="url(#right)" xlink:href="${art}" href="${art}"/>` : ""}
  <rect x="836" y="0" width="90" height="630" fill="url(#fade)"/>
  <image x="${cx - 105}" y="26" width="210" height="70" href="data:image/png;base64,${A.logoPng}" xlink:href="data:image/png;base64,${A.logoPng}"/>
  <rect x="${cx - 80}" y="110" width="160" height="34" rx="17" fill="#eaa21c"/>
  <circle cx="${cx - 58}" cy="127" r="5.5" fill="#fff"/>
  <text x="${cx + 8}" y="133.5" text-anchor="middle" font-family="Inter" font-weight="800" font-size="16" letter-spacing="2" fill="#fff">ACTIVATED</text>
  <text x="${cx}" y="${yTop}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${fsTop}" fill="#4a2a06">${esc(top)}</text>
  <rect x="${cx - bw / 2}" y="${yBox}" width="${bw}" height="${bh}" rx="${Math.round(bh / 2)}" fill="url(#rib)" filter="url(#sh)"/>
  <text x="${cx}" y="${yBig}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${fsBig}" fill="#fff">${esc(big)}</text>
  ${title.map((l, i) => `<text x="${cx}" y="${yTitle + i * 38}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="31" fill="#3a2410">${esc(l)}</text>`).join("")}
  <g transform="translate(${cx - 310} 538)">
    <rect width="280" height="58" rx="29" fill="#4a2a06"/>
    <text x="32" y="37" font-family="Inter" font-weight="800" font-size="22" fill="#fff">Follow the day</text>
    <circle cx="244" cy="29" r="18" fill="#eaa21c"/><path d="M237 20.5l11 8.5-11 8.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="translate(${cx - 10} 538)">
    <rect width="320" height="58" rx="29" fill="#fff" stroke="#e0780f" stroke-width="2.5"/>
    <path d="M38 22c-3.6-4.6-11-3-11 3 0 5 6.5 9 11 13 4.5-4 11-8 11-13 0-6-7.4-7.6-11-3z" fill="#c8381e"/>
    <text x="62" y="37" font-family="Inter" font-weight="800" font-size="20" fill="#4a2a06">Thanks for the moment</text>
  </g>
</svg>`;
}

function cardSVG(pr: Progress, art: string) {
  const full = pr.stage === 2 || pr.pct >= 100, pct = full ? 100 : pr.pct, left = Math.max(0, pr.goal - pr.raised);
  if (pr.stage === 2) return happeningSVG(pr, art);
  const title = wrap(pr.title, 27, 2);
  const kicker = full ? "ACTIVATED" : "ACTIVATING", kc = full ? "#b97a06" : "#1f7a47";
  const who = pr.kids ? `Help ${pr.kids} children laugh.` : "Help these children laugh.";
  const head = full ? ["Fully funded.", "The day is being planned."] : [who, "Let's take this to 100%."];
  const C = 2 * Math.PI * 112, dash = (C * Math.max(pct, 2)) / 100;
  // The ring sits in the middle of the card, half on the drawing, so it is still seen when an app crops the
  // picture to a square (WhatsApp does for small previews).
  const titleY = 212, textY = title.length > 1 ? 340 : 300;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#fbf6ea" stop-opacity="0"/></linearGradient>
    <clipPath id="right"><rect x="640" y="0" width="560" height="630"/></clipPath>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#1f4d3a" flood-opacity=".22"/></filter>
  </defs>
  <rect width="1200" height="630" fill="#fbf6ea"/>
  ${art ? `<image x="640" y="0" width="560" height="630" preserveAspectRatio="xMidYMid slice" clip-path="url(#right)" xlink:href="${art}" href="${art}"/>` : ""}
  <rect x="640" y="0" width="160" height="630" fill="url(#fade)"/>
  <image x="52" y="34" width="232" height="77" href="data:image/png;base64,${A.logoPng}" xlink:href="data:image/png;base64,${A.logoPng}"/>
  <rect x="56" y="128" width="84" height="5" rx="2.5" fill="#c9a24a"/>
  <text x="56" y="170" font-family="Inter" font-weight="600" font-size="17" letter-spacing="2.5" fill="${kc}">${kicker}</text>
  ${title.map((l, i) => `<text x="56" y="${titleY + i * 40}" font-family="Cinzel" font-weight="700" font-size="32" fill="#1f4d3a">${esc(l)}</text>`).join("")}
  <g transform="translate(56 ${textY})">
    <text y="0" font-family="Inter" font-weight="800" font-size="27" fill="#1c2a22">${esc(head[0])}</text>
    <text y="36" font-family="Inter" font-weight="800" font-size="27" fill="#d9661a">${esc(head[1])}</text>
    <text y="92" font-family="Inter" font-weight="500" font-size="22" fill="#2d5c48">${esc(money(pr, pr.raised))} of ${esc(money(pr, pr.goal))}</text>
    <text y="126" font-family="Inter" font-weight="600" font-size="22" fill="#1f7a47">${full ? "Every part is covered" : esc(money(pr, left)) + " still to go"}</text>
  </g>
  <g transform="translate(660 ${title.length > 1 ? 400 : 380})">
    <circle r="158" fill="#fbf6ea" filter="url(#sh)"/>
    <circle r="112" fill="none" stroke="#f6e7c4" stroke-width="30"/>
    <circle r="112" fill="none" stroke="#eaa21c" stroke-width="30" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90)"/>
    <text y="18" text-anchor="middle" font-family="Inter" font-weight="800" font-size="${pct === 100 ? 58 : 66}" fill="#1c2a22">${pct}%</text>
    <text y="54" text-anchor="middle" font-family="Inter" font-weight="600" font-size="18" letter-spacing="2" fill="#6f6a5e">FUNDED</text>
  </g>
  <text x="56" y="592" font-family="Inter" font-weight="600" font-size="20" fill="#1f4d3a">raavanaa.org</text>
  <text x="56" y="560" font-family="Inter" font-weight="600" font-size="15" letter-spacing="2.2" fill="#b0812a">EVERY RUPEE SHOWN OPENLY</text>
</svg>`;
}

// The picture for Home, Projects, About and other general pages (SURESH 26 Nov 2026: a shared raavanaa.org link
// showed only the plain logo; "something like heading or the % circle and logo ... to catch the eyes").
// Logo, the heading, and the three stage circles from Home with how many projects are in each today.
export type SiteCounts = { n1: number; n2: number; n3: number };
function siteSVG(c: SiteCounts, art: string, stages: string[]) {
  const ST = [["INITIATED", "#1f7a47", c.n1], ["ACTIVATED", "#b97a06", c.n2], ["IMPACT", "#c8381e", c.n3]] as const;
  const ring = ["#1f7a47", "#eaa21c", "#c8381e"];
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#fbf6ea" stop-opacity="0"/></linearGradient>
    <clipPath id="right"><rect x="700" y="0" width="500" height="630"/></clipPath>
    ${[0, 1, 2].map((k) => `<clipPath id="c${k}"><circle cx="${130 + k * 190}" cy="420" r="66"/></clipPath>`).join("")}
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#1f4d3a" flood-opacity=".2"/></filter>
  </defs>
  <rect width="1200" height="630" fill="#fbf6ea"/>
  ${art ? `<image x="700" y="0" width="500" height="630" preserveAspectRatio="xMidYMid slice" clip-path="url(#right)" xlink:href="${art}" href="${art}"/>` : ""}
  <rect x="700" y="0" width="170" height="630" fill="url(#fade)"/>
  <image x="52" y="30" width="300" height="99" href="data:image/png;base64,${A.logoPng}" xlink:href="data:image/png;base64,${A.logoPng}"/>
  <rect x="56" y="146" width="84" height="5" rx="2.5" fill="#c9a24a"/>
  <text x="56" y="205" font-family="Cinzel" font-weight="700" font-size="40" fill="#1f4d3a">Make a moment happen</text>
  <text x="56" y="253" font-family="Cinzel" font-weight="700" font-size="40" fill="#d9661a">for children in Sri Lanka</text>
  ${ST.map(([label, col, n], k) => { const cx = 130 + k * 190; return `
  <circle cx="${cx}" cy="420" r="74" fill="#fff" filter="url(#sh)"/>
  ${stages[k] ? `<image x="${cx - 66}" y="354" width="132" height="132" clip-path="url(#c${k})" xlink:href="${stages[k]}" href="${stages[k]}"/>` : ""}
  <circle cx="${cx}" cy="420" r="70" fill="none" stroke="${ring[k]}" stroke-width="7"/>
  <circle cx="${cx + 52}" cy="368" r="26" fill="${ring[k]}" stroke="#fff" stroke-width="4"/>
  <text x="${cx + 52}" y="378" text-anchor="middle" font-family="Inter" font-weight="800" font-size="27" fill="#fff">${n}</text>
  <text x="${cx}" y="530" text-anchor="middle" font-family="Inter" font-weight="800" font-size="19" letter-spacing="1.6" fill="${col}">${label}</text>`; }).join("")}
  <text x="56" y="596" font-family="Inter" font-weight="600" font-size="20" fill="#1f4d3a">raavanaa.org</text>
  <text x="${56 + 150}" y="596" font-family="Inter" font-weight="600" font-size="15" letter-spacing="2.2" fill="#b0812a">EVERY RUPEE SHOWN OPENLY</text>
</svg>`;
}

function toJpeg(svg: string) {
  const r = new Resvg(svg, { font: { fontFiles: fontFiles(), loadSystemFonts: false, defaultFontFamily: "Inter" }, fitTo: { mode: "width", value: 1200 } }).render();
  return Buffer.from(jpeg.encode({ data: r.pixels, width: r.width, height: r.height }, 86).data);
}
export const renderCard = (pr: Progress, art: string) => toJpeg(cardSVG(pr, art));
export const renderSite = (c: SiteCounts, art: string, stages: string[]) => toJpeg(siteSVG(c, art, stages));

async function dataUrl(origin: string, path: string) {
  try { const r = await fetch(new URL(path, origin)); if (r.ok) return `data:image/svg+xml;base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`; } catch (_) { /* left out */ }
  return "";
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const slug = String(context.params.slug || "").replace(/\.(jpe?g|png)$/i, "").toLowerCase();
  const all = await allProgress(url.origin);
  if (slug === "site") {
    const list = Object.values(all), count = (n: number) => list.filter((p) => p.stage === n).length;
    const [art, ...stages] = await Promise.all(["/img/project-hills.svg", "/img/stage-initiated.svg", "/img/stage-activated.svg", "/img/stage-impact.svg"].map((x) => dataUrl(url.origin, x)));
    return new Response(renderSite({ n1: count(1), n2: count(2), n3: count(3) }, art, stages), { headers: {
      "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=600",
      "Netlify-CDN-Cache-Control": "public, durable, s-maxage=86400, stale-while-revalidate=3600" } });
  }
  const pr = all[slug];
  // Not a project with a budget (or Impact): send the project's usual picture instead.
  if (!showsProgress(pr)) return Response.redirect(new URL(`/img/share/default.jpg`, url.origin), 302);
  const img = renderCard(pr!, await artData(url.origin, pr!));
  return new Response(img, { headers: {
    "Content-Type": "image/jpeg",
    // Browsers and apps keep it 10 minutes; Netlify's own cache keeps each ?v= for a day (a new % = a new address).
    "Cache-Control": "public, max-age=600",
    "Netlify-CDN-Cache-Control": "public, durable, s-maxage=86400, stale-while-revalidate=3600",
  } });
};

export const config: Config = { path: "/api/share-card/:slug", method: ["GET"] };
