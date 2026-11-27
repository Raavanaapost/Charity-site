// The project day, live (SURESH 26 Nov 2026, Kandy trip: sponsors should feel the day as it happens).
//   GET    /day/:token                  the organiser's phone page: post a photo and a line, or a receipt. No sign-in.
//   GET    /api/day/:token              what this link has posted (for the phone page)
//   POST   /api/day/:token              { kind: live|receipt, title, body, item, amount, image (data URL) }
//   DELETE /api/day/:token/:id          take one of this link's own posts down (wrong photo)
//   GET    /api/day/photo/:key          a day photo
//   GET    /thanks/:token               a sponsor's own thank-you page (from the children and the school), never listed
// The team makes links in the portal (Followers & updates) and can stop them at any time.
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { dayStore, savePhoto, photoUrl } from "../lib/day.mts";
import data from "../../projects.json" with { type: "json" };

type P = { slug?: string; title?: string; goal?: number | string; budget?: { item?: string; amount?: number | string }[]; currency?: string; day_steps?: string[]; places?: { name?: string }[] };
const PROJECTS: P[] = ((data as { projects?: P[] }).projects || []).filter((p) => p && p.slug);
const proj = (slug: string) => PROJECTS.find((p) => p.slug === slug);
const num = (v: unknown) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
const goalOf = (p?: P) => (p ? num(p.goal) || (p.budget || []).reduce((t, x) => t + num(x.amount), 0) : 0);
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
const lines = (v: unknown, max: number) => String(v ?? "").split(/\r?\n/).map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max).replace(/[<>]/g, "");
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const rs = (n: number, cur = "Rs ") => `${cur}${Math.round(n).toLocaleString("en-US")}`;

const STEPS = ["We are on our way", "We have arrived", "Lunch together", "On the way home", "Home safe"];
const stepsFor = (p?: P) => (p?.day_steps?.length ? p.day_steps : p?.places?.length ? ["We are on our way", ...p.places.map((x) => `At ${x.name}`), "Lunch together", "Home safe"] : STEPS);

const html = (title: string, body: string, extraHead = "") => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)} · Raavanaa</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#f6efe2;--card:#fffaf2;--ink:#2b2520;--soft:#6d6157;--red:#b4402a;--line:#e7dccb;--green:#2f7d4f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:34rem;margin:0 auto;padding:20px 16px 48px}.logo{display:block;width:150px;margin:6px auto 18px}
.card{background:var(--card);border-radius:18px;box-shadow:0 8px 30px #0001;padding:22px 20px;margin:0 0 16px}
h1{font-family:Cinzel,Georgia,serif;font-size:1.55rem;line-height:1.25;margin:0 0 .4rem}h2{font-size:1.05rem;margin:0 0 .6rem}
.soft{color:var(--soft);font-size:.92rem}a{color:var(--red);font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.chips button{border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:9px 14px;font:inherit;font-size:.95rem;color:var(--ink)}
.chips button.on{border-color:var(--red);background:var(--red);color:#fff}
label{display:block;font-weight:600;font-size:.95rem;margin:12px 0 6px}input,textarea{width:100%;font:inherit;padding:12px;border:1.5px solid var(--line);border-radius:12px;background:#fff}
.btn{display:block;width:100%;border:0;border-radius:14px;background:var(--red);color:#fff;font:inherit;font-weight:700;font-size:1.1rem;padding:15px;margin-top:16px;text-align:center;text-decoration:none}
.btn.ghost{background:#fff;color:var(--red);border:1.5px solid var(--red)}
.pick{display:flex;align-items:center;justify-content:center;gap:10px;border:2px dashed var(--line);border-radius:14px;padding:18px;background:#fff;font-weight:700;color:var(--red)}
.pick img{max-width:100%;border-radius:10px}.seg{display:flex;gap:8px;margin:0 0 6px}.seg button{flex:1;padding:11px;border-radius:12px;border:1.5px solid var(--line);background:#fff;font:inherit;font-weight:600}
.seg button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.post{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line)}.post img{width:64px;height:64px;object-fit:cover;border-radius:10px}
.post b{display:block}.post small{color:var(--soft)}.post button{margin-left:auto;border:0;background:none;color:var(--red);font:inherit;font-size:.85rem}
.ok{background:#e8f4ec;color:var(--green);border-radius:12px;padding:12px;font-weight:600}
.dear{font-family:Cinzel,Georgia,serif;font-size:2rem;line-height:1.2;margin:0 0 14px;color:var(--red)}
.msg{white-space:pre-line;font-size:1.08rem}.from{margin-top:16px;font-style:italic;color:var(--soft)}
.photo{width:100%;border-radius:14px;margin:6px 0 10px;display:block}.video{position:relative;padding-top:56.25%;border-radius:14px;overflow:hidden;margin:6px 0 10px}.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.part{display:flex;gap:14px;align-items:center}.ring{flex:none;width:84px;height:84px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:1.15rem;color:var(--red)}
.memory{text-align:center;border:1.5px solid #e8c9a0;background:#fff7ea;border-radius:16px;padding:14px;margin:0 0 16px}.memory b{display:block;font-family:Cinzel,Georgia,serif;font-size:1.2rem}
</style>${extraHead}</head><body><main><img class="logo" src="/img/logo-450.webp?v=6" alt="Raavanaa" onerror="this.style.display='none'">${body}</main></body></html>`,
  { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

const notFound = () => html("Link not found", `<section class="card"><h1>This link is not active</h1><p>It may have been stopped by the team. Please ask the Raavanaa volunteer for a new one.</p></section>`);

// The organiser's phone page.
function phonePage(token: string, p: P | undefined, slug: string, label: string) {
  const steps = stepsFor(p);
  return html(`Post from the day`, `
<section class="card"><p class="soft" style="margin:0">Posting to</p><h1>${esc(p?.title || slug)}</h1>
<p class="soft" style="margin:0">${label ? `Link for ${esc(label)}. ` : ""}What you post shows on the project page at once, with the time. The sponsors see it as it happens.</p></section>
<form class="card" id="f">
  <div class="seg"><button type="button" class="on" data-k="live">Photo and news</button><button type="button" data-k="receipt">A receipt</button></div>
  <div data-live>
    <label>What is happening?</label>
    <div class="chips">${steps.map((s) => `<button type="button" data-t="${esc(s)}">${esc(s)}</button>`).join("")}</div>
    <input name="title" maxlength="120" placeholder="Or write your own title">
    <label for="body">A line or two (optional)</label>
    <textarea id="body" name="body" rows="3" maxlength="1200" placeholder="For example: The children saw the temple and the elephants. Everyone is happy."></textarea>
  </div>
  <div data-receipt hidden>
    ${(p?.budget || []).filter((x) => x && x.item).length ? `<label>Which part of the budget?</label>
    <div class="chips" data-lines>${(p?.budget || []).filter((x) => x && x.item).map((x) => `<button type="button" data-line="${esc(x.item)}">${esc(String(x.item).split(/[(,]/)[0].trim())}</button>`).join("")}<button type="button" data-line="">Something else</button></div>` : ""}
    <label for="item">What was paid for</label><input id="item" name="item" maxlength="120" placeholder="For example: Bus to Kandy and back">
    <label for="amount">How much (Rs)</label><input id="amount" name="amount" inputmode="decimal" placeholder="30000">
  </div>
  <label>Photo</label>
  <label class="pick" id="pick" for="photo">📷 <span>Take or choose a photo</span></label>
  <input id="photo" type="file" accept="image/*" hidden>
  <p class="soft">No children's names, ever. Photos only with the school's permission.</p>
  <button class="btn" type="submit">Post now</button>
  <p id="msg" class="soft" hidden></p>
</form>
<section class="card"><h2>Posted from this link</h2><div id="list"><p class="soft">Nothing yet.</p></div>
<p><a href="/projects/${esc(slug)}#live" target="_blank" rel="noopener">See the project page</a></p></section>
<script>
(() => {
  const T = ${JSON.stringify(token)}, f = document.getElementById("f"), msg = document.getElementById("msg");
  let kind = "live", photo = "", line = "";
  const say = (t, ok) => { msg.hidden = false; msg.className = ok ? "ok" : "soft"; msg.textContent = t; };
  f.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { kind = b.dataset.k; f.querySelectorAll("[data-k]").forEach(x => x.classList.toggle("on", x === b));
    f.querySelector("[data-live]").hidden = kind !== "live"; f.querySelector("[data-receipt]").hidden = kind !== "receipt"; });
  // Each bill belongs to one line of the budget, so the money page shows planned against spent (26 Nov 2026).
  f.querySelectorAll("[data-line]").forEach(b => b.onclick = () => { line = b.dataset.line; f.querySelectorAll("[data-line]").forEach(x => x.classList.toggle("on", x === b));
    if (line && !f.item.value.trim()) f.item.value = b.textContent; f.item.focus(); });
  f.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { f.title.value = b.dataset.t; f.querySelectorAll("[data-t]").forEach(x => x.classList.toggle("on", x === b)); f.body.focus(); });
  // Make the photo small on the phone before sending (about 1600 px, JPEG).
  document.getElementById("photo").onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      photo = c.toDataURL("image/jpeg", 0.82); URL.revokeObjectURL(url);
      document.getElementById("pick").innerHTML = '<img src="' + photo + '" alt="">';
    };
    img.onerror = () => say("That photo could not be opened. Please try another one.");
    img.src = url;
  };
  const when = iso => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo" });
  const load = async () => {
    const d = await fetch("/api/day/" + T).then(r => r.json()).catch(() => ({ posts: [] }));
    const l = document.getElementById("list");
    l.innerHTML = (d.posts || []).length ? d.posts.map(p => '<div class="post">' + (p.image ? '<img src="' + p.image + '" alt="">' : "") + '<div><b>' + (p.kind === "receipt" ? "Receipt: " : "") + p.title.replace(/</g, "&lt;") + '</b><small>' + when(p.at) + ' Sri Lanka time' + (p.kind === "receipt" ? " · Rs " + Math.round(p.amount).toLocaleString("en-US") : "") + '</small></div><button type="button" data-del="' + p.id + '">Take down</button></div>').join("") : '<p class="soft">Nothing yet.</p>';
    l.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Press again"; return; } await fetch("/api/day/" + T + "/" + b.dataset.del, { method: "DELETE" }); load(); });
  };
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector(".btn");
    const body = { kind, title: f.title.value.trim(), body: f.body.value.trim(), item: f.item.value.trim(), amount: f.amount.value, line: kind === "receipt" ? line : "", image: photo };
    if (kind === "live" && !body.title && !photo) return say("Pick what is happening, or add a photo.");
    if (kind === "receipt" && (!body.item || !photo)) return say("Write what was paid for and add a photo of the receipt.");
    btn.disabled = true; btn.textContent = "Posting…";
    try {
      const r = await fetch("/api/day/" + T, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not post just now. Please try again.");
      f.reset(); photo = ""; line = ""; f.querySelectorAll("[data-line]").forEach(x => x.classList.remove("on")); document.getElementById("pick").innerHTML = "📷 <span>Take or choose a photo</span>"; f.querySelectorAll("[data-t]").forEach(x => x.classList.remove("on"));
      say(body.kind === "receipt" ? "Receipt sent. A Raavanaa team member checks it, then it shows on the money page. Thank you!" : "Posted. It is on the project page now. Thank you!", true); load();
    } catch (er) { say(er.message); }
    btn.disabled = false; btn.textContent = "Post now";
  };
  load();
})();
</script>`);
}

const ytId = (u: string) => (/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/.exec(u) || [])[1] || "";

async function thanksPage(db: ReturnType<typeof getDatabase>, token: string) {
  const [t] = (await db.sql`SELECT * FROM sponsor_thanks WHERE token = ${token} AND NOT hidden`) as Record<string, any>[];
  if (!t) return notFound();
  if (!t.opened_at) await db.sql`UPDATE sponsor_thanks SET opened_at = NOW() WHERE token = ${token}`;
  const p = proj(t.slug), goal = goalOf(p), cur = p?.currency || "Rs ";
  const [g] = t.give_ref ? ((await db.sql`SELECT amount_value, tribute FROM give_requests WHERE ref = ${t.give_ref}`) as Record<string, any>[]) : [];
  const part = g ? num(g.amount_value) : 0, pct = goal && part ? Math.min(100, Math.round((part / goal) * 100)) : 0;
  const tr = g && g.tribute && g.tribute.name ? g.tribute : null;
  const vid = ytId(String(t.video || ""));
  return html(`A thank-you for ${t.to_name}`, `
${tr ? `<div class="memory"><span class="soft">${esc(tr.words || "In loving memory of")}</span><b>${esc(tr.name)}</b></div>` : ""}
<section class="card"><p class="dear">Dear ${esc(t.to_name)},</p>
${t.image ? `<img class="photo" src="${esc(photoUrl(t.image))}" alt="">` : ""}
${t.message ? `<div class="msg">${esc(t.message)}</div>` : ""}
${vid ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" allowfullscreen title="Video"></iframe></div>` : t.video ? `<p><a class="btn ghost" href="${esc(t.video)}" target="_blank" rel="noopener">Watch the video</a></p>` : ""}
${t.letter ? `<img class="photo" src="${esc(photoUrl(t.letter))}" alt="The letter">` : ""}
${t.from_line ? `<p class="from">With love and thanks,<br>${esc(t.from_line)}</p>` : ""}</section>
${part ? `<section class="card part"><div class="ring" style="background:conic-gradient(var(--red) ${pct * 3.6}deg,#f0e4d3 0)"><span style="background:var(--card);width:66px;height:66px;border-radius:50%;display:grid;place-items:center">${pct}%</span></div>
<div><b>Your part of the day</b><br>${esc(rs(part, cur))} of the ${esc(rs(goal, cur))} it cost${p?.title ? ` for “${esc(p.title)}”` : ""}. It happened because of you.</div></section>` : ""}
<section class="card"><a class="btn" href="/projects/${esc(t.slug)}#live">See the day as it happened</a><a class="btn ghost" href="/projects/${esc(t.slug)}/money">See where every rupee went</a></section>
<p class="soft" style="text-align:center">This page was made just for you. Shared with you by Raavanaa.<br>To protect the children and families, Raavanaa never passes on contact details. To send them a message, reply to the Raavanaa volunteer who sent you this page.</p>`);
}

export default async (req: Request, context: Context) => {
  const path = new URL(req.url).pathname;
  const db = getDatabase();

  // A day photo
  let m = /^\/api\/day\/photo\/(.+)$/.exec(path);
  if (m && req.method === "GET") {
    const key = decodeURIComponent(m[1]);
    if (!/^[a-z0-9-]{1,80}\/[a-z0-9-]+\.(jpg|png|webp)$/.test(key)) return new Response("Not found", { status: 404 });
    const r = await dayStore(context).getWithMetadata(key, { type: "arrayBuffer" });
    if (!r) return new Response("Not found", { status: 404 });
    return new Response(r.data as ArrayBuffer, { headers: { "Content-Type": String((r.metadata as Record<string, unknown>)?.type || "image/jpeg"), "Cache-Control": "public, max-age=86400, immutable" } });
  }

  // A sponsor's thank-you page
  m = /^\/thanks\/([0-9a-f]{32})\/?$/.exec(path);
  if (m && req.method === "GET") return thanksPage(db, m[1]);
  if (/^\/thanks\//.test(path)) return notFound();

  m = /^\/(?:api\/)?day\/([0-9a-f]{32})(?:\/(\d+))?\/?$/.exec(path);
  if (!m) return path.startsWith("/day/") ? notFound() : json({ ok: false, error: "Not found" }, 404);
  const token = m[1], id = Number(m[2] || 0), api = path.startsWith("/api/");
  const [link] = (await db.sql`SELECT token, slug, label FROM day_links WHERE token = ${token} AND stopped_at IS NULL`) as Record<string, any>[];
  if (!link) return api ? json({ ok: false, error: "This link has been stopped. Please ask the team for a new one." }, 403) : notFound();
  const by = `day:${token}`;

  if (!api && req.method === "GET") return phonePage(token, proj(link.slug), link.slug, link.label);

  if (req.method === "GET") {
    const rows = (await db.sql`SELECT id, title, body, image, kind, amount, created_at FROM project_updates WHERE posted_by = ${by} AND NOT hidden ORDER BY created_at DESC LIMIT 100`) as Record<string, any>[];
    return json({ posts: rows.map((r) => ({ id: r.id, title: r.title, body: r.body, image: photoUrl(r.image), kind: r.kind, amount: num(r.amount), at: r.created_at })) });
  }
  if (req.method === "DELETE" && id) {
    await db.sql`UPDATE project_updates SET hidden = TRUE WHERE id = ${id} AND posted_by = ${by}`;
    return json({ ok: true });
  }
  if (req.method === "POST" && !id) {
    let b: Record<string, unknown>;
    try { b = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }
    const kind = b.kind === "receipt" ? "receipt" : "live";
    const image = await savePhoto(context, link.slug, b.image);
    if (image === null) return json({ ok: false, error: "That photo could not be saved. Please try another one." }, 400);
    const title = kind === "receipt" ? clip(b.item, 120) : clip(b.title, 120) || "From the day";
    const amount = kind === "receipt" ? Math.max(0, Math.round(num(b.amount))) : 0;
    if (kind === "receipt" && (!title || !image)) return json({ ok: false, error: "Write what was paid for and add a photo of the receipt." }, 400);
    // A receipt names its budget line (only a line the project really has) and waits for a team member's check.
    const items = (proj(link.slug)?.budget || []).map((x) => String(x?.item || "")).filter(Boolean);
    const line = kind === "receipt" && items.includes(String(b.line || "")) ? String(b.line) : "";
    const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); // Sri Lanka date
    await db.sql`INSERT INTO project_updates (slug, title, body, posted_by, image, kind, amount, line, spent_on) VALUES (${link.slug}, ${title}, ${lines(b.body, 1200)}, ${by}, ${image}, ${kind}, ${amount}, ${line}, ${kind === "receipt" ? today : null})`;
    // The same photo also goes into the event's private album (Today's materials, 27 Nov 2026). Best effort only.
    if (image) {
      try {
        await db.sql`INSERT INTO event_materials (slug, source, sender, kind, mime, store, blob, caption, status, reason)
          VALUES (${link.slug}, 'day', ${`day:${link.label || "phone link"}`}, 'photo', ${/\.png$/.test(image) ? "image/png" : /\.webp$/.test(image) ? "image/webp" : "image/jpeg"}, 'day', ${image},
            ${title}, ${kind === "receipt" ? "bill_added" : "published"}, ${kind === "receipt" ? "sent as a receipt" : "posted from the phone link"})`;
      } catch (e) { console.log("day: could not add to the album", e); }
    }
    return json({ ok: true });
  }
  return json({ ok: false, error: "Not allowed" }, 405);
};

export const config: Config = { path: ["/day/*", "/api/day/*", "/thanks/*"] };
