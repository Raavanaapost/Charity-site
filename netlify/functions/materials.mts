// Today's materials and the private album for each event (SURESH 27 Nov 2026).
// Team only (portal, signed in):
//   GET    /api/materials                    every project with materials, the unsorted tray, what is connected
//   GET    /api/materials/:slug              one project's items, the suggested best photos, its album links, people in charge
//                                            (:slug "_unsorted" = senders we do not know yet, or who still have to pick a project)
//   GET    /api/materials/file/:id           the file itself (photo, video, voice note, document)
//   PATCH  /api/materials/item/:id           { status: new|set_aside|hidden } or { slug } (file it under a project)
//   POST   /api/materials/item/:id/check     run the checks again (after a setting was fixed)
//   POST   /api/materials/publish            { ids, title, body, permission }  photos onto the project page (Live from the day)
//   POST   /api/materials/bill/:id           { item, amount, line, date }  a bill into the Money books (a second person checks it there)
//   POST   /api/materials/albums             { slug, label }   a new private album link
//   DELETE /api/materials/albums/:token                        stop it
// Public, by private link only (the school and the organisers; never listed, never sponsors):
//   GET    /album/:token                     the album page
//   GET    /api/album/:token                 what is in it
//   GET    /api/album/:token/file/:id        one file
//   POST   /api/album/:token                 { image (data URL), caption }  add a photo from the phone
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { teamAccess } from "../lib/team-access.mts";
import { materialsStore, storeFor, dayStoreOf, projectTitles, hamming, saveUpload, photoBytes, wakeWorker, phoneKey } from "../lib/materials.mts";
import data from "../../projects.json" with { type: "json" };

type Row = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
const lines = (v: unknown, max: number) => String(v ?? "").split(/\r?\n/).map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max).replace(/[<>]/g, "");
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const BUDGET = new Map<string, string[]>((((data as any).projects || []) as Row[]).filter((p) => p && p.slug).map((p) => [p.slug, (p.budget || []).map((x: Row) => String(x?.item || "")).filter(Boolean)]));
const BEST = 8;

// The best photos to suggest: good AI score and sharp, never two of the same scene, never a receipt or a weak one.
function suggest(items: Row[]) {
  const pool = items.filter((m) => m.kind === "photo" && m.status === "new" && !m.ai?.receipt && m.ai?.hint !== "bill")
    .map((m) => ({ m, score: (Number(m.ai?.quality) || 5) * 10 + Math.min(Number(m.sharp) || 0, 400) / 40 }))
    .sort((a, b) => b.score - a.score);
  const picked: Row[] = [];
  for (const { m } of pool) {
    if (picked.length >= BEST) break;
    if (m.dhash && picked.some((p) => p.dhash && hamming(p.dhash, m.dhash) <= 10)) continue;
    picked.push(m);
  }
  return picked.map((m) => m.id);
}

const view = (m: Row, fileUrl: (id: number) => string) => ({
  id: m.id, slug: m.slug, source: m.source, sender: m.sender, senderName: m.sender_name, kind: m.kind, mime: m.mime, size: m.size, name: m.name,
  caption: m.caption, status: m.status, reason: m.reason, sharp: m.sharp, bright: m.bright, ai: m.ai || {}, aiStatus: m.ai_status, aiError: m.ai_error,
  url: m.blob ? fileUrl(m.id) : "", at: m.created_at, by: m.decided_by, decidedAt: m.decided_at,
});

async function sendFile(context: Context, m: Row | undefined) {
  if (!m || !m.blob) return new Response("Not found", { status: 404 });
  const r = await storeFor(context, m.store).getWithMetadata(m.blob, { type: "stream" });
  if (!r) return new Response("Not found", { status: 404 });
  const type = String((r.metadata as Row)?.type || m.mime || "application/octet-stream");
  const safe = /^(image|video|audio)\//.test(type) || type === "application/pdf" ? type : "application/octet-stream";
  return new Response(r.data as ReadableStream, { headers: { "Content-Type": safe, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff",
    ...(safe === "application/octet-stream" ? { "Content-Disposition": `attachment; filename="${(m.name || "file").replace(/[^\w.-]/g, "_")}"` } : {}) } });
}

// --- The album page (school and organisers) ----------------------------------------------------------------------
function albumPage(token: string, title: string, label: string) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Our album · ${esc(title)} · Raavanaa</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#f6efe2;--card:#fffaf2;--ink:#2b2520;--soft:#6d6157;--red:#b4402a;--line:#e7dccb;--green:#2f7d4f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:60rem;margin:0 auto;padding:20px 16px 48px}.logo{display:block;width:150px;margin:6px auto 18px}
.card{background:var(--card);border-radius:18px;box-shadow:0 8px 30px #0001;padding:20px;margin:0 0 16px}
h1{font-family:Cinzel,Georgia,serif;font-size:1.5rem;line-height:1.25;margin:0 0 .3rem}h2{font-size:1.05rem;margin:0 0 .7rem}
.soft{color:var(--soft);font-size:.92rem}.lock{display:inline-block;background:#fff3df;border:1px solid #edd3a5;border-radius:999px;padding:4px 12px;font-size:.85rem;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}.grid a{display:block;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#eee}
.grid img{width:100%;height:100%;object-fit:cover;display:block}video,audio{width:100%;border-radius:10px;margin:0 0 8px}
.list a{display:block;padding:8px 0;border-top:1px solid var(--line);color:var(--red);font-weight:600}
.btn{display:block;width:100%;border:0;border-radius:14px;background:var(--red);color:#fff;font:inherit;font-weight:700;font-size:1.05rem;padding:14px;margin-top:12px;text-align:center}
.ok{background:#e8f4ec;color:var(--green);border-radius:12px;padding:12px;font-weight:600}input[type=text]{width:100%;font:inherit;padding:12px;border:1.5px solid var(--line);border-radius:12px;margin-top:8px}
</style></head><body><main><img class="logo" src="/img/logo-450.webp?v=6" alt="Raavanaa" onerror="this.style.display='none'">
<section class="card"><span class="lock">🔒 Private album</span><h1>${esc(title)}</h1>
<p class="soft">Everything sent for this event, kept by Raavanaa for the school and the organisers${label ? ` (link for ${esc(label)})` : ""}. Only people with this link can open it. It is never public and never shown to givers. Please do not forward it.</p></section>
<form class="card" id="add"><h2>Add photos</h2><p class="soft">Choose as many as you like from your phone. For videos, send them to the Raavanaa WhatsApp number.</p>
<input id="files" type="file" accept="image/*" multiple><input type="text" id="cap" maxlength="300" placeholder="A line about them (optional). No children's names, please.">
<button class="btn" type="submit">Add to the album</button><p id="msg" class="soft" hidden></p></form>
<section class="card"><h2>Photos <span class="soft" id="np"></span></h2><div class="grid" id="photos"><p class="soft">Loading…</p></div></section>
<section class="card" id="vbox" hidden><h2>Videos</h2><div id="videos"></div></section>
<section class="card" id="abox" hidden><h2>Voice notes</h2><div id="audios"></div></section>
<section class="card" id="dbox" hidden><h2>Documents</h2><div class="list" id="docs"></div></section>
<script>
(() => {
  const T = ${JSON.stringify(token)}, msg = document.getElementById("msg");
  const say = (t, ok) => { msg.hidden = false; msg.className = ok ? "ok" : "soft"; msg.textContent = t; };
  const load = async () => {
    const d = await fetch("/api/album/" + T).then(r => r.json()).catch(() => ({ items: [] }));
    const it = d.items || [], f = k => it.filter(x => x.kind === k);
    const ph = f("photo");
    document.getElementById("np").textContent = ph.length ? "(" + ph.length + ")" : "";
    document.getElementById("photos").innerHTML = ph.length ? ph.map(x => '<a href="' + x.url + '" target="_blank" rel="noopener"><img loading="lazy" src="' + x.url + '" alt=""></a>').join("") : '<p class="soft">No photos yet.</p>';
    const show = (box, el, list, html) => { document.getElementById(box).hidden = !list.length; document.getElementById(el).innerHTML = list.map(html).join(""); };
    show("vbox", "videos", f("video"), x => '<video controls preload="none" src="' + x.url + '"></video>');
    show("abox", "audios", f("audio"), x => '<audio controls preload="none" src="' + x.url + '"></audio>');
    show("dbox", "docs", f("document"), x => '<a href="' + x.url + '" target="_blank" rel="noopener">' + (x.name || "Document").replace(/</g, "&lt;") + '</a>');
  };
  const small = file => new Promise((ok, no) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, 2400 / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); ok(c.toDataURL("image/jpeg", 0.85)); };
    img.onerror = () => no(new Error("A photo could not be opened.")); img.src = u;
  });
  document.getElementById("add").onsubmit = async e => {
    e.preventDefault();
    const files = [...document.getElementById("files").files], btn = e.target.querySelector(".btn");
    if (!files.length) return say("Choose one or more photos first.");
    btn.disabled = true; let n = 0;
    for (const file of files) {
      say("Adding " + (n + 1) + " of " + files.length + "…");
      try { const image = await small(file);
        const r = await fetch("/api/album/" + T, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, caption: document.getElementById("cap").value }) });
        if (r.ok) n++; } catch (er) { /* skip that one */ }
    }
    btn.disabled = false; e.target.reset();
    say(n === files.length ? "Added " + n + " photo" + (n === 1 ? "" : "s") + ". Thank you!" : "Added " + n + " of " + files.length + ". Please try the others again.", n === files.length); load();
  };
  load();
})();
</script></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

const notActive = () => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link not active · Raavanaa</title>
<body style="font:17px system-ui;background:#f6efe2;padding:40px 16px;text-align:center"><h1>This link is not active</h1><p>It may have been stopped by the team. Please ask the Raavanaa volunteer for a new one.</p></body>`,
  { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });

export default async (req: Request, context: Context) => {
  const path = new URL(req.url).pathname;
  const db = getDatabase();

  // --- Album (by private link) ---
  let m = /^\/(api\/)?album\/([0-9a-f]{32})(?:\/file\/(\d+))?\/?$/.exec(path);
  if (m || path.startsWith("/album/")) {
    if (!m) return notActive();
    const api = !!m[1], token = m[2], fid = Number(m[3] || 0);
    const [link] = (await db.sql`SELECT slug, label FROM album_links WHERE token = ${token} AND stopped_at IS NULL`) as Row[];
    if (!link) return api ? json({ error: "This link has been stopped." }, 403) : notActive();
    if (!api && req.method === "GET") return albumPage(token, (await projectTitles(db)).get(link.slug) || link.slug, link.label);
    if (fid && req.method === "GET") {
      const [f] = (await db.sql`SELECT * FROM event_materials WHERE id = ${fid} AND slug = ${link.slug} AND status <> 'hidden'`) as Row[];
      return sendFile(context, f);
    }
    if (req.method === "GET") {
      const rows = (await db.sql`SELECT * FROM event_materials WHERE slug = ${link.slug} AND status <> 'hidden' AND blob <> '' AND kind <> 'text' ORDER BY created_at`) as Row[];
      return json({ items: rows.map((r) => ({ id: r.id, kind: r.kind, name: r.name, url: `/api/album/${token}/file/${r.id}` })) });
    }
    if (req.method === "POST") {
      let b: Row = {};
      try { b = await req.json(); } catch { return json({ error: "Could not read that." }, 400); }
      const p = photoBytes(b.image);
      if (!p) return json({ error: "That photo could not be saved." }, 400);
      await saveUpload(context, db, { slug: link.slug, source: "album", sender: `album:${link.label || "link"}`, mime: p.mime, buf: p.buf, caption: clip(b.caption, 300) });
      await wakeWorker(req);
      return json({ ok: true });
    }
    return json({ error: "Not allowed" }, 405);
  }

  // --- Team ---
  const me = await teamAccess();
  if (!me) return json({ error: "Please sign in with a team account." }, 401);
  const parts = path.replace(/^\/api\/materials\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const who = me.name || me.email;
  const log = (action: string, target: string, details: unknown) => db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${me.email}, ${action}, ${target}, ${JSON.stringify(details)}::jsonb)`;
  let b: Row = {};
  if (req.method !== "GET") { try { b = await req.json(); } catch { /* empty */ } }
  const fileUrl = (id: number) => `/api/materials/file/${id}`;

  if (!parts.length && req.method === "GET") {
    const titles = await projectTitles(db);
    const counts = (await db.sql`SELECT slug, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE status = 'new')::int AS fresh, MAX(created_at) AS last
      FROM event_materials WHERE status <> 'hidden' GROUP BY slug`) as Row[];
    const albums = (await db.sql`SELECT slug, COUNT(*)::int AS n FROM album_links WHERE stopped_at IS NULL GROUP BY slug`) as Row[];
    return json({
      projects: [...titles].map(([slug, title]) => { const c = counts.find((x) => x.slug === slug); return { slug, title, items: c?.n || 0, fresh: c?.fresh || 0, last: c?.last || null, albums: albums.find((x) => x.slug === slug)?.n || 0 }; }),
      unsorted: counts.find((x) => x.slug === "")?.n || 0,
      whatsapp: { token: !!Netlify.env.get("WHATSAPP_TOKEN"), secret: !!Netlify.env.get("WHATSAPP_APP_SECRET"), verify: !!Netlify.env.get("WHATSAPP_VERIFY_TOKEN"), webhook: new URL("/api/whatsapp", req.url).toString() },
      gemini: !!Netlify.env.get("GEMINI_API_KEY"),
    });
  }

  if (parts[0] === "file" && req.method === "GET") {
    const [f] = (await db.sql`SELECT * FROM event_materials WHERE id = ${Number(parts[1]) || 0}`) as Row[];
    return sendFile(context, f);
  }

  if (parts[0] === "item" && parts[1]) {
    const id = Number(parts[1]) || 0;
    const [it] = (await db.sql`SELECT * FROM event_materials WHERE id = ${id}`) as Row[];
    if (!it) return json({ error: "Not found" }, 404);
    if (parts[2] === "check" && req.method === "POST") {
      const next = it.wa_media_id && !it.blob ? "fetch" : it.kind === "photo" || it.kind === "audio" ? "queued" : "";
      await db.sql`UPDATE event_materials SET ai_status = ${next}, ai_error = '' WHERE id = ${id}`;
      await wakeWorker(req);
      return json({ ok: true });
    }
    if (req.method === "PATCH") {
      if (b.slug !== undefined) {
        const slug = String(b.slug || "");
        if (!SLUG.test(slug) || !(await projectTitles(db)).has(slug)) return json({ error: "Pick a project" }, 400);
        await db.sql`UPDATE event_materials SET slug = ${slug}, status = CASE WHEN status IN ('waiting', 'unknown') THEN 'new' ELSE status END WHERE id = ${id}`;
        // Everything else from the same unknown phone goes with it.
        if (it.sender && it.source === "whatsapp" && !it.slug) await db.sql`UPDATE event_materials SET slug = ${slug}, status = 'new' WHERE sender = ${it.sender} AND slug = '' AND status IN ('waiting', 'unknown')`;
        await log("materials.file", String(id), { slug });
        return json({ ok: true });
      }
      const st = String(b.status || "");
      if (!["new", "set_aside", "hidden"].includes(st)) return json({ error: "Not allowed" }, 400);
      await db.sql`UPDATE event_materials SET status = ${st}, reason = CASE WHEN ${st} = 'set_aside' THEN 'set aside by the team' ELSE reason END, decided_by = ${who}, decided_at = NOW() WHERE id = ${id}`;
      await log("materials.status", String(id), { status: st });
      return json({ ok: true });
    }
  }

  if (parts[0] === "publish" && req.method === "POST") {
    const ids = (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Boolean).slice(0, 30);
    if (!ids.length) return json({ error: "Tick at least one photo" }, 400);
    const rows = (await db.sql`SELECT * FROM event_materials WHERE id = ANY(${ids}::int[]) AND kind = 'photo' AND blob <> '' AND slug <> ''`) as Row[];
    if (rows.length !== ids.length) return json({ error: "Some of these photos cannot be published (not filed under a project yet, or still downloading)." }, 400);
    if (new Set(rows.map((r) => r.slug)).size > 1) return json({ error: "Publish one project at a time." }, 400);
    const faces = rows.filter((r) => r.ai?.child_face);
    if (faces.length && b.permission !== true) return json({ error: `${faces.length} of these show a child's face. Tick "The parents agreed" first, or leave those out.`, faces: faces.map((r) => r.id) }, 409);
    const slug = rows[0].slug, title = clip(b.title, 120) || "From the day", body = lines(b.body, 1200);
    for (const r of rows) {
      let key = r.blob;
      if (r.store !== "day") {
        // Copy into the public day photos (the private album keeps its own copy).
        const bytes = (await materialsStore(context).get(r.blob, { type: "arrayBuffer" })) as ArrayBuffer | null;
        if (!bytes) continue;
        const ext = /png/.test(r.mime) ? "png" : /webp/.test(r.mime) ? "webp" : "jpg";
        key = `${slug}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        await dayStoreOf(context).set(key, bytes, { metadata: { type: r.mime || "image/jpeg" } });
      }
      const [u] = (await db.sql`INSERT INTO project_updates (slug, title, body, posted_by, image, kind) VALUES (${slug}, ${title}, ${body}, ${who}, ${key}, 'live') RETURNING id`) as Row[];
      await db.sql`UPDATE event_materials SET status = 'published', update_id = ${u.id}, decided_by = ${who}, decided_at = NOW() WHERE id = ${r.id}`;
    }
    await log("materials.publish", slug, { ids, faces: faces.map((r) => r.id), permission: b.permission === true });
    return json({ ok: true, published: rows.length });
  }

  if (parts[0] === "bill" && parts[1] && req.method === "POST") {
    const id = Number(parts[1]) || 0;
    const [it] = (await db.sql`SELECT * FROM event_materials WHERE id = ${id} AND kind = 'photo' AND blob <> ''`) as Row[];
    if (!it || !it.slug) return json({ error: "File this under a project first." }, 400);
    const item = clip(b.item, 120), amt = Math.max(0, Math.round(Number(String(b.amount ?? "").replace(/[^\d.]/g, "")) || 0));
    if (!item || !amt) return json({ error: "Write what was paid for and the amount." }, 400);
    if (((await db.sql`SELECT 1 FROM money_books WHERE slug = ${it.slug} AND closed_at IS NOT NULL`) as Row[]).length) return json({ error: "The books of this project are closed." }, 409);
    let key = it.blob;
    if (it.store !== "day") {
      const bytes = (await materialsStore(context).get(it.blob, { type: "arrayBuffer" })) as ArrayBuffer | null;
      if (!bytes) return json({ error: "The photo is missing." }, 404);
      key = `${it.slug}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      await dayStoreOf(context).set(key, bytes, { metadata: { type: it.mime || "image/jpeg" } });
    }
    const line = (BUDGET.get(it.slug) || []).includes(String(b.line || "")) ? String(b.line) : clip(b.line, 200);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? String(b.date) : new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
    // Entered by this team member: the Money books rule still needs a second person to press Check.
    await db.sql`INSERT INTO project_updates (slug, title, body, posted_by, image, kind, amount, line, spent_on, entered_email)
      VALUES (${it.slug}, ${item}, ${lines(it.ai?.shop ? `${it.ai.shop}${it.ai.date ? `, ${it.ai.date}` : ""}` : "", 600)}, ${who}, ${key}, 'receipt', ${amt}, ${line}, ${date}, ${me.email})`;
    await db.sql`UPDATE event_materials SET status = 'bill_added', decided_by = ${who}, decided_at = NOW() WHERE id = ${id}`;
    await log("materials.bill", it.slug, { id, item, amount: amt });
    return json({ ok: true });
  }

  if (parts[0] === "albums") {
    if (req.method === "POST" && !parts[1]) {
      const slug = String(b.slug || "");
      if (!SLUG.test(slug)) return json({ error: "Pick a project" }, 400);
      const [l] = (await db.sql`INSERT INTO album_links (slug, label, created_by) VALUES (${slug}, ${clip(b.label, 80)}, ${who}) RETURNING token`) as Row[];
      await log("album.add", slug, { label: clip(b.label, 80) });
      return json({ ok: true, token: l.token });
    }
    if (req.method === "DELETE" && parts[1]) {
      await db.sql`UPDATE album_links SET stopped_at = COALESCE(stopped_at, NOW()) WHERE token = ${clip(parts[1], 64)}`;
      await log("album.stop", clip(parts[1], 64), {});
      return json({ ok: true });
    }
  }

  if (parts.length === 1 && req.method === "GET") {
    const slug = parts[0] === "_unsorted" ? "" : parts[0];
    if (slug && !SLUG.test(slug)) return json({ error: "Not found" }, 404);
    const rows = (await db.sql`SELECT * FROM event_materials WHERE slug = ${slug} ORDER BY created_at DESC LIMIT 2000`) as Row[];
    const albums = slug ? ((await db.sql`SELECT token, label, created_by, created_at, stopped_at FROM album_links WHERE slug = ${slug} ORDER BY created_at DESC`) as Row[])
      .map((l) => ({ token: l.token, label: l.label, by: l.created_by, at: l.created_at, stopped: !!l.stopped_at })) : [];
    const people = slug ? ((await db.sql`SELECT name, role, contact FROM agreement_people WHERE slug = ${slug} AND NOT removed ORDER BY in_charge DESC, id`) as Row[])
      .map((p) => ({ name: p.name, role: p.role, phone: phoneKey(p.contact) && !String(p.contact).includes("@") ? phoneKey(p.contact) : "" })) : [];
    return json({ slug, items: rows.map((r) => view(r, fileUrl)), suggested: suggest(rows), albums, people, budget: BUDGET.get(slug) || [] });
  }
  return json({ error: "Not allowed" }, 405);
};

export const config: Config = { path: ["/api/materials", "/api/materials/*", "/album/*", "/api/album/*"] };
