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
import { allProgress, money, showsProgress, type Progress } from "../lib/share-progress.mts";
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

function cardSVG(pr: Progress, art: string) {
  const full = pr.stage === 2 || pr.pct >= 100, pct = full ? 100 : pr.pct, left = Math.max(0, pr.goal - pr.raised);
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

export function renderCard(pr: Progress, art: string) {
  const svg = cardSVG(pr, art);
  const r = new Resvg(svg, { font: { fontFiles: fontFiles(), loadSystemFonts: false, defaultFontFamily: "Inter" }, fitTo: { mode: "width", value: 1200 } }).render();
  return Buffer.from(jpeg.encode({ data: r.pixels, width: r.width, height: r.height }, 86).data);
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const slug = String(context.params.slug || "").replace(/\.(jpe?g|png)$/i, "").toLowerCase();
  const pr = (await allProgress(url.origin))[slug];
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
