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
import { allProgress, money, showsProgress, showsImpact, madePossibleBy, smilesLine, happeningWhen, type Progress } from "../lib/share-progress.mts";
import * as A from "../lib/card-assets.mts";
import { groupSummary, projectLine, badgeWord, projectOwner, type GroupSummary } from "../lib/group-summary.mts";

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
  const yTitle = yBox + bh + 46;
  // SURESH 27 Nov 2026: the place and the date under the title, as in the first glance.
  const dateTxt = pr.day ? new Date(pr.day + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : "";
  const facts = [w.big === "today" || w.top === "It happened on" ? dateTxt : "", (pr.place || "").length <= 34 ? pr.place : (pr.place || "").split(",")[0]].filter(Boolean).join("  \u00b7  ");
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
  ${facts ? `<text x="${cx}" y="${yTitle + (title.length - 1) * 38 + 44}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="21" fill="#8a3a14">${esc(facts)}</text>` : ""}
  <g transform="translate(${cx - 310} 538)">
    <rect width="280" height="58" rx="29" fill="url(#rib)"/>
    <text x="32" y="37" font-family="Inter" font-weight="800" font-size="22" fill="#fff">Follow the day</text>
    <circle cx="244" cy="29" r="18" fill="#fff"/><path d="M237 20.5l11 8.5-11 8.5" fill="none" stroke="#c8381e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="translate(${cx - 10} 538)">
    <rect width="320" height="58" rx="29" fill="#fff" stroke="#e0780f" stroke-width="2.5"/>
    <path d="M38 22c-3.6-4.6-11-3-11 3 0 5 6.5 9 11 13 4.5-4 11-8 11-13 0-6-7.4-7.6-11-3z" fill="#c8381e"/>
    <text x="62" y="37" font-family="Inter" font-weight="800" font-size="20" fill="#4a2a06">Thanks for the moment</text>
  </g>
</svg>`;
}

function impactSVG(pr: Progress, art: string) {
  // Impact (SURESH 27 Nov 2026: "what is the highlight to outstand for impact, may be smile, moment created"; no date):
  // the same cream card as Activated, "52 SMILES MADE" in white on a gold ribbon, the givers by name, a picture from the day.
  const title = wrap(pr.title, 36, 2), cx = 418, top = "MOMENT CREATED", big = smilesLine(pr).toUpperCase();
  const who = madePossibleBy(pr), by = who ? wrap(`Moment made possible by ${who}`, 58, 2) : [];
  const fsTop = 46, fsBig = Math.min(104, Math.floor(690 / (big.length * 0.7)));
  const bw = Math.min(780, Math.round(big.length * fsBig * 0.7 + 90)), bh = Math.round(fsBig * 1.25);
  const yTop = 156 + fsTop, yBox = yTop + 22, yBig = yBox + Math.round(bh / 2 + fsBig * 0.36);
  const yTitle = yBox + bh + 50, yBy = yTitle + (title.length - 1) * 36 + 44;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#fbf6ea" stop-opacity="0"/></linearGradient>
    <linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#9c6604"/><stop offset="1" stop-color="#e0a21c"/></linearGradient>
    <clipPath id="right"><rect x="836" y="0" width="364" height="630"/></clipPath>
    <filter id="sh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#6b4a06" flood-opacity=".28"/></filter>
  </defs>
  <rect width="1200" height="630" fill="#fbf6ea"/>
  ${art ? `<image x="836" y="0" width="364" height="630" preserveAspectRatio="xMidYMid slice" clip-path="url(#right)" xlink:href="${art}" href="${art}"/>` : ""}
  <rect x="836" y="0" width="60" height="630" fill="url(#fade)"/>
  <image x="${cx - 105}" y="22" width="210" height="70" href="data:image/png;base64,${A.logoPng}" xlink:href="data:image/png;base64,${A.logoPng}"/>
  <rect x="${cx - 62}" y="104" width="124" height="34" rx="17" fill="#c8381e"/>
  <circle cx="${cx - 40}" cy="121" r="5.5" fill="#fff"/>
  <text x="${cx + 8}" y="127.5" text-anchor="middle" font-family="Inter" font-weight="800" font-size="16" letter-spacing="2" fill="#fff">IMPACT</text>
  <text x="${cx}" y="${yTop}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${fsTop}" fill="#4a2a06">${top}</text>
  <rect x="${cx - bw / 2}" y="${yBox}" width="${bw}" height="${bh}" rx="${Math.round(bh / 2)}" fill="url(#gold)" filter="url(#sh)"/>
  <text x="${cx}" y="${yBig}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${fsBig}" fill="#fff">${esc(big)}</text>
  ${title.map((l, i) => `<text x="${cx}" y="${yTitle + i * 36}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="29" fill="#3a2410">${esc(l)}</text>`).join("")}
  ${by.map((l, i) => `<text x="${cx}" y="${yBy + i * 28}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="21" fill="#8a5a04">${i === 0 && l.startsWith("Moment ") ? `<tspan fill="#c8381e" font-weight="800">Moment</tspan>${esc(l.slice(6))}` : esc(l)}</text>`).join("")}
  <g transform="translate(${cx - 300} 548)">
    <rect width="270" height="56" rx="28" fill="url(#gold)"/>
    <text x="32" y="36" font-family="Inter" font-weight="800" font-size="22" fill="#fff">See the day</text>
    <circle cx="234" cy="28" r="17" fill="#fff"/><path d="M227.5 20l10.5 8-10.5 8" fill="none" stroke="#9c6604" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="translate(${cx - 10} 548)">
    <rect width="310" height="56" rx="28" fill="#fff" stroke="#e0a21c" stroke-width="2.5"/>
    <path d="M38 21c-3.6-4.6-11-3-11 3 0 5 6.5 9 11 13 4.5-4 11-8 11-13 0-6-7.4-7.6-11-3z" fill="#c8381e"/>
    <text x="60" y="36" font-family="Inter" font-weight="800" font-size="20" fill="#4a2a06">Thanks for the moment</text>
  </g>
</svg>`;
}

function cardSVG(pr: Progress, art: string, owner = "") {
  const full = pr.stage === 2 || pr.pct >= 100, pct = full ? 100 : pr.pct, left = Math.max(0, pr.goal - pr.raised);
  if (pr.stage === 2) return happeningSVG(pr, art);
  if (pr.stage === 3) return impactSVG(pr, art);
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
  <text x="56" y="170" font-family="Inter" font-weight="600" font-size="17" letter-spacing="2.5" fill="${kc}">${kicker}${owner ? `<tspan fill="#6f6a5e"> · RUN BY ${esc(wrap(owner.toUpperCase(), 30, 1)[0])}</tspan>` : ""}</text>
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

function toJpeg(svg: string, width = 1200) {
  const r = new Resvg(svg, { font: { fontFiles: fontFiles(), loadSystemFonts: false, defaultFontFamily: "Inter" }, fitTo: { mode: "width", value: width } }).render();
  return Buffer.from(jpeg.encode({ data: r.pixels, width: r.width, height: r.height }, 86).data);
}
export const renderCard = (pr: Progress, art: string, owner = "") => toJpeg(cardSVG(pr, art, owner));
export const renderSite = (c: SiteCounts, art: string, stages: string[]) => toJpeg(siteSVG(c, art, stages));

async function picData(origin: string, path: string) {
  try { const r = await fetch(new URL(path, origin)); if (r.ok) return `data:${/\.png/i.test(path) ? "image/png" : "image/jpeg"};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`; } catch (_) { /* left out */ }
  return "";
}
async function dataUrl(origin: string, path: string) {
  try { const r = await fetch(new URL(path, origin)); if (r.ok) return `data:image/svg+xml;base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`; } catch (_) { /* left out */ }
  return "";
}


// A group's or organisation's own picture (SURESH 26 Nov 2026: share a profile on WhatsApp/Facebook/Instagram):
//   /api/share-card/g--<slug>.jpg        1200x630 link preview
//   /api/share-card/g--<slug>-story.jpg  1080x1920 Instagram story
// Its logo (or initials), the badge, its name, places and "3 projects, 2 done". Logos and drawings only, no photos.
const TONES = ["#1f7a47", "#b97a06", "#c8381e", "#2f7f8f", "#7a4fa0", "#8a5c12"];
const tone = (n: string) => { let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return TONES[h % TONES.length]; };
const initials = (n: string) => n.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w) && !/^(of|the|and|for)$/i.test(w)).map((w) => w.charAt(0)).join("").slice(0, 2).toUpperCase() || "G";
const BADGE_COL = (g: GroupSummary) => g.type === "organisation" ? (g.verified ? ["#1f7a47", "#e3f1e7"] : ["#2f5f8f", "#e5eef8"]) : ["#1f7a47", "#e3f1e7"];

function avatarSVG(g: GroupSummary, logo: string, cx: number, cy: number, r: number) {
  return `<circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="#fff" filter="url(#sh)"/><circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="none" stroke="#c9a24a" stroke-width="4"/>` + (logo
    ? `<clipPath id="av"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/><image x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" preserveAspectRatio="xMidYMid meet" clip-path="url(#av)" href="${logo}" xlink:href="${logo}"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${tone(g.name)}"/><text x="${cx}" y="${cy + r * 0.3}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${Math.round(r * 0.86)}" fill="#fff">${esc(initials(g.name))}</text>`);
}
// The ✓ is drawn, because the card fonts have no ✓ letter.
const tick = (x: number, y: number, size: number, col: string) => `<path d="M${x} ${y - size * 0.35} l${size * 0.32} ${size * 0.32} l${size * 0.62} -${size * 0.7}" fill="none" stroke="${col}" stroke-width="${Math.max(2.5, size * 0.17)}" stroke-linecap="round" stroke-linejoin="round"/>`;
function badgeSVG(g: GroupSummary, x: number, y: number, size: number, anchor: "start" | "middle") {
  const word = badgeWord(g).toUpperCase(), [fg, bg] = BADGE_COL(g), ok = g.type === "organisation" && g.verified;
  const tw = word.length * size * 0.78, extra = ok ? size * 1.3 : 0;
  const w = Math.round(tw + extra + size * 1.6), h = Math.round(size * 2.1), bx = anchor === "middle" ? x - w / 2 : x;
  return `<rect x="${bx}" y="${y - h + size * 0.55}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}"/>` +
    (ok ? tick(bx + size * 0.8, y - size * 0.05, size, fg) : "") +
    `<text x="${bx + extra + w / 2 - extra / 2}" y="${y}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="${size}" letter-spacing="${size * 0.12}" fill="${fg}">${esc(word)}</text>`;
}
const DEFS = `<linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#fbf6ea" stop-opacity="0"/></linearGradient>
    <linearGradient id="fadeV" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#fbf6ea" stop-opacity="0"/></linearGradient>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#1f4d3a" flood-opacity=".2"/></filter>`;

function groupSVG(g: GroupSummary, logo: string, art: string) {
  const name = wrap(g.name, 19, 2), y0 = name.length > 1 ? 262 : 292;
  const stats = `${projectLine(g)}${g.followers ? ` · ${g.followers} follower${g.followers === 1 ? "" : "s"}` : ""}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>${DEFS}<clipPath id="right"><rect x="800" y="0" width="400" height="630"/></clipPath></defs>
  <rect width="1200" height="630" fill="#fbf6ea"/>
  ${art ? `<image x="800" y="0" width="400" height="630" preserveAspectRatio="xMidYMid slice" clip-path="url(#right)" xlink:href="${art}" href="${art}"/>` : ""}
  <rect x="800" y="0" width="150" height="630" fill="url(#fade)"/>
  <image x="52" y="34" width="232" height="77" href="data:image/png;base64,${A.logoPng}" xlink:href="data:image/png;base64,${A.logoPng}"/>
  ${avatarSVG(g, logo, 170, 330, 104)}
  ${badgeSVG(g, 318, y0 - 66, 17, "start")}
  ${name.map((l, i) => `<text x="318" y="${y0 + i * 50}" font-family="Cinzel" font-weight="700" font-size="42" fill="#1f4d3a">${esc(l)}</text>`).join("")}
  ${g.places ? `<text x="318" y="${y0 + name.length * 50 + 2}" font-family="Inter" font-weight="500" font-size="22" fill="#6f6a5e">${esc(wrap(g.places, 40, 1)[0])}</text>` : ""}
  <text x="318" y="${y0 + name.length * 50 + 58}" font-family="Inter" font-weight="800" font-size="28" fill="#d9661a">${esc(stats)}</text>
  ${g.checked && !g.verified ? `${tick(318, y0 + name.length * 50 + 98, 20, "#1f7a47")}<text x="346" y="${y0 + name.length * 50 + 100}" font-family="Inter" font-weight="600" font-size="20" fill="#1f7a47">Checked by Raavanaa</text>` : ""}
  <text x="56" y="566" font-family="Inter" font-weight="600" font-size="15" letter-spacing="2.2" fill="#b0812a">EVERY PROJECT SHOWN OPENLY</text>
  <text x="56" y="598" font-family="Inter" font-weight="700" font-size="22" fill="#1f4d3a">Follow us on raavanaa.org</text>
</svg>`;
}
function groupStorySVG(g: GroupSummary, logo: string, art: string) {
  const name = wrap(g.name, 16, 3), ny = 930, top = ny + name.length * 78 + (g.places ? 110 : 40), btn = top + 240;
  const box = (x: number, n: number | string, label: string, col: string) => `<g transform="translate(${x} 0)"><rect x="-140" y="${top}" width="280" height="190" rx="28" fill="#fff" stroke="#eadfc2" stroke-width="3"/>
    <text y="${top + 100}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="74" fill="${col}">${n}</text>
    <text y="${top + 152}" text-anchor="middle" font-family="Inter" font-weight="700" font-size="26" letter-spacing="2" fill="#6f6a5e">${label}</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>${DEFS}<clipPath id="bot"><rect x="0" y="1560" width="1080" height="360"/></clipPath></defs>
  <rect width="1080" height="1920" fill="#fbf6ea"/>
  ${art ? `<image x="0" y="1560" width="1080" height="360" preserveAspectRatio="xMidYMid slice" clip-path="url(#bot)" xlink:href="${art}" href="${art}"/>` : ""}
  <rect x="0" y="1560" width="1080" height="140" fill="url(#fadeV)"/>
  <image x="300" y="110" width="480" height="159" href="data:image/png;base64,${A.logoPng}" xlink:href="data:image/png;base64,${A.logoPng}"/>
  ${avatarSVG(g, logo, 540, 540, 180)}
  ${badgeSVG(g, 540, 810, 30, "middle")}
  ${name.map((l, i) => `<text x="540" y="${ny + i * 78}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="66" fill="#1f4d3a">${esc(l)}</text>`).join("")}
  ${g.places ? `<text x="540" y="${ny + name.length * 78 + 20}" text-anchor="middle" font-family="Inter" font-weight="500" font-size="34" fill="#6f6a5e">${esc(wrap(g.places, 36, 1)[0])}</text>` : ""}
  ${box(240, g.projects, "PROJECTS", "#1f7a47")}${box(540, g.done, "DONE", "#c8381e")}${box(840, g.followers, "FOLLOWERS", "#b97a06")}
  <rect x="190" y="${btn}" width="700" height="96" rx="48" fill="#1f4d3a"/>
  <text x="540" y="${btn + 62}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="36" fill="#fff">Follow us on raavanaa.org</text>
</svg>`;
}
async function logoData(origin: string, logo: string) {
  if (!logo) return "";
  if (logo.startsWith("data:")) return logo;
  try {
    const r = await fetch(new URL(logo, origin));
    if (!r.ok) return "";
    const type = r.headers.get("content-type") || "image/png";
    return `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  } catch (_) { return ""; }
}
async function groupCard(origin: string, key: string) {
  const story = /-story$/.test(key), slug = key.replace(/-story$/, "");
  const g = await groupSummary(origin, slug);
  if (!g) return null;
  const [logo, art] = await Promise.all([logoData(origin, g.logo), dataUrl(origin, "/img/project-hills.svg")]);
  return toJpeg(story ? groupStorySVG(g, logo, art) : groupSVG(g, logo, art), story ? 1080 : 1200);
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const slug = String(context.params.slug || "").replace(/\.(jpe?g|png)$/i, "").toLowerCase();
  if (slug.startsWith("g--")) {
    const img = await groupCard(url.origin, slug.slice(3)).catch((e) => { console.log("group card:", (e as Error).message); return null; });
    if (!img) return Response.redirect(new URL("/img/share/default.jpg", url.origin), 302);
    return new Response(img, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=600",
      "Netlify-CDN-Cache-Control": "public, durable, s-maxage=3600, stale-while-revalidate=600" } });
  }
  const all = await allProgress(url.origin, url.searchParams.get("gifts") === "live" && !/(^|\.)raavanaa\.org$/.test(url.hostname));
  if (slug === "site") {
    const list = Object.values(all), count = (n: number) => list.filter((p) => p.stage === n).length;
    const [art, ...stages] = await Promise.all(["/img/project-hills.svg", "/img/stage-initiated.svg", "/img/stage-activated.svg", "/img/stage-impact.svg"].map((x) => dataUrl(url.origin, x)));
    return new Response(renderSite({ n1: count(1), n2: count(2), n3: count(3) }, art, stages), { headers: {
      "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=600",
      "Netlify-CDN-Cache-Control": "public, durable, s-maxage=86400, stale-while-revalidate=3600" } });
  }
  const pr = all[slug];
  // Not a project with a budget (or Impact): send the project's usual picture instead.
  if (!showsProgress(pr) && !showsImpact(pr)) return Response.redirect(new URL(`/img/share/default.jpg`, url.origin), 302);
  // Impact: a picture from the day when there is one (photos shared with the parents' agreement), else the drawing.
  const artP = showsImpact(pr) && pr!.pic.startsWith("/") ? picData(url.origin, pr!.pic).then((d) => d || artData(url.origin, pr!)) : artData(url.origin, pr!);
  const [art, owner] = await Promise.all([artP, projectOwner(url.origin, slug).catch(() => "")]);
  const img = renderCard(pr!, art, owner);
  return new Response(img, { headers: {
    "Content-Type": "image/jpeg",
    // Browsers and apps keep it 10 minutes; Netlify's own cache keeps each ?v= for a day (a new % = a new address).
    "Cache-Control": "public, max-age=600",
    "Netlify-CDN-Cache-Control": "public, durable, s-maxage=86400, stale-while-revalidate=3600",
  } });
};

export const config: Config = { path: "/api/share-card/:slug", method: ["GET"] };
