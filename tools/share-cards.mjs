// Makes the pictures shown when a raavanaa.org page is shared (WhatsApp, Facebook, X) and the
// Instagram story pictures, from share.json. Run from the site folder after changing share.json:
//   node tools/share-cards.mjs
// Writes img/share/<name>.jpg (1200x630 link card) and img/share/<name>-story.jpg (1080x1920),
// each in English and Tamil (-ta). Needs Playwright (Chromium) on the machine that runs it.
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Playwright from the project or, failing that, a global install (NODE_PATH=$(npm root -g)).
const { chromium } = await import("playwright").catch(() => createRequire(import.meta.url)("playwright"));
const root = process.cwd();
const share = JSON.parse(readFileSync(join(root, "share.json"), "utf8"));
const out = join(root, "img/share");
mkdirSync(out, { recursive: true });
const dataUrl = (p) => {
  const ext = p.split(".").pop();
  const type = ext === "svg" ? "image/svg+xml" : ext === "webp" ? "image/webp" : "image/jpeg";
  return `data:${type};base64,${readFileSync(join(root, p.replace(/^\//, ""))).toString("base64")}`;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const logo = dataUrl("img/logo.webp");

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@500;600&family=Noto+Serif+Tamil:wght@600;700&family=Noto+Sans+Tamil:wght@500;600&display=block">`;
const BASE = `*{box-sizing:border-box;margin:0}body{background:#fbf6ea;color:#1f4d3a;font-family:Inter,'Noto Sans Tamil',sans-serif;overflow:hidden}
 .ta h1{font-family:'Noto Serif Tamil',serif;letter-spacing:0;line-height:1.35}
 h1{font-family:Cinzel,serif;font-weight:700;letter-spacing:.01em;line-height:1.12}
 .bar{width:84px;height:5px;border-radius:3px;background:#c9a24a}
 .kicker{font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#b0812a}
 .ta .kicker{letter-spacing:0;text-transform:none}
 .url{font-weight:600;color:#1f4d3a}`;

function card(c, lang) {
  const ta = lang === "ta";
  const title = ta ? c.title_ta : c.title, text = ta ? c.text_ta : c.text;
  const long = title.length > (ta ? 48 : 52);
  return `<!doctype html><html><head><meta charset=utf-8>${FONTS}<style>${BASE}
  body{width:1200px;height:630px;display:flex}
  .l{width:640px;padding:44px 40px 40px 56px;display:flex;flex-direction:column;gap:20px}
  .l img{width:270px}
  h1{font-size:${ta ? (long ? 34 : 40) : (long ? 42 : 50)}px}
  p.t{font-size:${ta ? 21 : 23}px;line-height:1.45;color:#2d5c48}
  .foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:20px}
  .r{flex:1;position:relative;background:url('${c.artUrl}') center/${/lamp/.test(c.art) ? "contain no-repeat,radial-gradient(#fff1c9,#fbf6ea 70%)" : "cover"}}
  .r:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#fbf6ea 0,rgba(251,246,234,0) 22%)}
  .kicker{font-size:16px}</style></head><body class="${lang}">
  <div class=l><img src="${logo}" alt=""><div class=bar></div><h1>${esc(title)}</h1><p class=t>${esc(text)}</p>
  <div class=foot><span class=url>raavanaa.org</span><span class=kicker>${ta ? "ஒவ்வொரு ரூபாயும் வெளிப்படையாக" : "Every rupee shown openly"}</span></div></div>
  <div class=r></div></body></html>`;
}

function story(c, lang) {
  const ta = lang === "ta";
  const title = ta ? c.title_ta : c.title, text = ta ? c.text_ta : c.text;
  return `<!doctype html><html><head><meta charset=utf-8>${FONTS}<style>${BASE}
  body{width:1080px;height:1920px;display:flex;flex-direction:column}
  .top{padding:90px 0 40px;text-align:center}.top img{width:520px}
  .art{height:820px;margin:0 60px;border-radius:36px;background:url('${c.artUrl}') center/${/lamp/.test(c.art) ? "contain no-repeat,radial-gradient(#fff1c9,#fbf6ea 70%)" : "cover"};box-shadow:0 10px 40px rgba(31,77,58,.18)}
  .b{padding:64px 80px 0;display:flex;flex-direction:column;gap:30px;align-items:center;text-align:center;flex:1}
  h1{font-size:${ta ? 54 : 66}px}
  p.t{font-size:${ta ? 34 : 38}px;line-height:1.45;color:#2d5c48}
  .pill{margin:auto 0 110px;background:#1f4d3a;color:#fbf6ea;border-radius:60px;padding:26px 48px;font-size:36px;font-weight:600}
  .kicker{font-size:26px}</style></head><body class="${lang}">
  <div class=top><img src="${logo}" alt=""></div><div class=art></div>
  <div class=b><div class=bar></div><h1>${esc(title)}</h1><p class=t>${esc(text)}</p>
  <div class=pill>${ta ? "raavanaa.org · பயோவில் உள்ள இணைப்பு" : "raavanaa.org · link in bio"}</div></div></body></html>`;
}

const items = [["default", share.default], ...Object.entries(share.projects), ["vouch", share.vouch], ["moment", share.moment]].filter(([, c]) => c);
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, raw] of items) {
  const c = { ...share.default, ...raw };
  c.artUrl = dataUrl(c.art);
  for (const lang of ["en", "ta"]) {
    const sfx = lang === "ta" ? "-ta" : "";
    for (const [kind, w, h, fn] of [["", 1200, 630, card], ["-story", 1080, 1920, story]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.setContent(fn(c, lang), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      writeFileSync(join(out, `${name}${kind}${sfx}.jpg`), await page.screenshot({ type: "jpeg", quality: 86 }));
      console.log("made", `img/share/${name}${kind}${sfx}.jpg`);
    }
  }
}
await browser.close();
