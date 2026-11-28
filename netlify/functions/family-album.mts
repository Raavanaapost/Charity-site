// Family photo albums (SURESH 28 Nov 2026, option C): each event's photos stay in its own Google Drive folder;
// each family gets its own code; the team sees who opened the album and what they downloaded.
// Families (no Google account, no app; a phone is enough):
//   GET    /photos/:slug                       the album page (asks for the family code first)
//   POST   /api/photos/:slug/code              { code }  check the code, remember it on this phone for 30 days
//   POST   /api/photos/:slug/out               forget the code on this phone
//   GET    /api/photos/:slug                   what is in the album (only with a good code)
//   GET    /api/photos/:slug/file/:id?s=small|big|download   one photo or video, through the robot (Drive link never shown)
// Team only (portal, signed in):
//   GET    /api/family-albums                  every project and its album (Drive robot set up or not)
//   GET    /api/family-albums/:slug            one album: folder, codes, who opened it
//   PUT    /api/family-albums/:slug            { folder, open, closes_on }
//   POST   /api/family-albums/:slug/check      look in the Drive folder now (how many photos)
//   POST   /api/family-albums/:slug/codes      { family, phone }  a new family code
//   POST   /api/family-albums/codes/:id/renew  a new code for the same family (the old one stops)
//   DELETE /api/family-albums/codes/:id        stop a code
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { teamAccess } from "../lib/team-access.mts";
import { projectTitles } from "../lib/materials.mts";
import { robot, folderId, listAlbum, fileInAlbum, fetchFile } from "../lib/drive.mts";

type Row = Record<string, any>;
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const DAYS30 = 30 * 86400;
const SIZES: Record<string, number> = { small: 480, big: 1600 };

// The key that signs the "code remembered on this phone" cookie.
const secret = () => Netlify.env.get("FAMILY_ALBUM_SECRET") || robot()?.key || "";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url").slice(0, 32);
const cookieName = (slug: string) => `fa_${slug.replace(/-/g, "_")}`;
function readCookie(req: Request, slug: string): number {
  const raw = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(cookieName(slug) + "="));
  if (!raw || !secret()) return 0;
  const [id, exp, sig] = raw.slice(cookieName(slug).length + 1).split(".");
  if (!id || !exp || !sig || Number(exp) < Date.now() / 1000) return 0;
  const want = Buffer.from(sign(`${slug}.${id}.${exp}`)), got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got) ? Number(id) : 0;
}
const setCookie = (slug: string, id: number) => {
  const exp = Math.floor(Date.now() / 1000) + DAYS30;
  return `${cookieName(slug)}=${id}.${exp}.${sign(`${slug}.${id}.${exp}`)}; Path=/; Max-Age=${DAYS30}; HttpOnly; Secure; SameSite=Lax`;
};
const ipHash = (req: Request, context: Context) => createHash("sha256").update(`${context.ip || req.headers.get("x-nf-client-connection-ip") || ""}|${secret().slice(0, 40)}`).digest("hex").slice(0, 16);
const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); // Sri Lanka date
const isClosed = (a: Row | undefined) => !a || !a.is_open || (a.closes_on && String(a.closes_on instanceof Date ? a.closes_on.toISOString() : a.closes_on).slice(0, 10) < today());

function page(slug: string, title: string, state: "ready" | "closed" | "none") {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Family album · ${esc(title)} · Raavanaa</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#f6efe2;--card:#fffaf2;--ink:#2b2520;--soft:#6d6157;--red:#b4402a;--line:#e7dccb;--gold:#b8862f;--green:#2f7d4f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:62rem;margin:0 auto;padding:20px 16px 48px}.logo{display:block;width:150px;margin:6px auto 18px}
.card{background:var(--card);border-radius:18px;box-shadow:0 8px 30px #0001;padding:20px;margin:0 0 16px}
h1{font-family:Cinzel,Georgia,serif;font-size:1.5rem;line-height:1.25;margin:.4rem 0 .3rem}h2{font-family:Cinzel,Georgia,serif;font-size:1.1rem;margin:0 0 .7rem}
.soft{color:var(--soft);font-size:.92rem;margin:.3rem 0}.lock{display:inline-block;background:#fff3df;border:1px solid #edd3a5;border-radius:999px;padding:4px 12px;font-size:.85rem;font-weight:600}
.code{display:block;width:100%;max-width:16rem;margin:14px auto 0;font:700 1.9rem/1 ui-monospace,Menlo,monospace;letter-spacing:.35em;text-align:center;padding:14px 8px 14px 18px;border:2px solid var(--line);border-radius:14px;background:#fff}
.code:focus{outline:none;border-color:var(--gold)}
.btn{display:block;width:100%;max-width:16rem;margin:12px auto 0;border:0;border-radius:14px;background:var(--red);color:#fff;font:inherit;font-weight:700;font-size:1.05rem;padding:14px;text-align:center;cursor:pointer;text-decoration:none}
.btn.ghost{background:transparent;color:var(--red);border:1.5px solid var(--red)}.center{text-align:center}.err{color:var(--red);font-weight:600;min-height:1.4em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.grid button{display:block;aspect-ratio:1;border:0;padding:0;border-radius:10px;overflow:hidden;background:#e9dfcf;cursor:pointer;position:relative}
.grid img{width:100%;height:100%;object-fit:cover;display:block}.grid .play{position:absolute;inset:auto 8px 8px auto;background:#000a;color:#fff;border-radius:999px;padding:2px 9px;font-size:.8rem}
.sec{margin-top:6px}.top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.who{font-size:.9rem;color:var(--soft)}
.link{background:none;border:0;color:var(--red);font:inherit;font-size:.9rem;text-decoration:underline;cursor:pointer;padding:0}
.view{position:fixed;inset:0;background:#120e0b;display:flex;flex-direction:column;z-index:9}.view[hidden]{display:none}
.view .stage{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;padding:8px}.view img,.view video{max-width:100%;max-height:100%;border-radius:6px}
.view .bar{display:flex;gap:8px;justify-content:space-between;align-items:center;padding:10px 12px calc(10px + env(safe-area-inset-bottom));color:#f6efe2;font-size:.9rem}
.view .bar button,.view .bar a{background:#ffffff1c;color:#fff;border:0;border-radius:12px;padding:10px 14px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}
.view .bar .dl{background:var(--gold)}.note{font-size:.85rem;color:var(--soft);text-align:center;margin-top:20px}
</style></head><body><main><img class="logo" src="/img/logo-450.webp?v=6" alt="Raavanaa" onerror="this.style.display='none'">
<section class="card center" id="gate"><span class="lock">🔒 Family album</span><h1>${esc(title)}</h1>
${state === "none" ? `<p class="soft">There is no family album for this event.</p>`
  : state === "closed" ? `<p class="soft">This album is closed now. If you still need a photo, please ask the Raavanaa volunteer.</p>`
  : `<p class="soft">The photos from the day, kept privately for the families. Please type the code Raavanaa sent you on WhatsApp.</p>
<form id="f"><input class="code" id="c" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" placeholder="······" aria-label="Your family code" required>
<p class="err" id="e"></p><button class="btn" type="submit">Open the album</button></form>
<p class="soft">Your code is just for your family. Please do not share it.</p>`}</section>
<section id="album" hidden></section>
<p class="note" id="note" hidden>These photos are for your family only. Please do not post them on Facebook, Instagram or WhatsApp groups.</p>
<div class="view" id="v" hidden><div class="stage" id="vs"></div><div class="bar"><button type="button" id="vp" aria-label="Previous">‹</button>
<span id="vn"></span><a class="dl" id="vd" href="#">Download</a><button type="button" id="vx">Close</button><button type="button" id="vf" aria-label="Next">›</button></div></div>
<script>
(() => {
  const S = ${JSON.stringify(slug)}, A = "/api/photos/" + S, $ = id => document.getElementById(id);
  const h = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let all = [], at = 0;
  const open = i => { at = (i + all.length) % all.length; const x = all[at], u = A + "/file/" + x.id;
    $("vs").innerHTML = x.kind === "video" ? '<video controls autoplay playsinline src="' + u + '?s=play"></video>' : '<img alt="" src="' + u + '?s=big">';
    $("vd").href = u + "?s=download"; $("vn").textContent = (at + 1) + " / " + all.length; $("v").hidden = false; };
  $("vx").onclick = () => { $("v").hidden = true; $("vs").innerHTML = ""; };
  $("vp").onclick = () => open(at - 1); $("vf").onclick = () => open(at + 1);
  document.addEventListener("keydown", e => { if ($("v").hidden) return; if (e.key === "Escape") $("vx").onclick(); if (e.key === "ArrowLeft") open(at - 1); if (e.key === "ArrowRight") open(at + 1); });
  const show = d => {
    $("gate").hidden = true; $("note").hidden = false; all = [];
    const secs = d.sections || [], n = secs.reduce((t, s) => t + s.items.length, 0);
    $("album").innerHTML = '<section class="card"><div class="top"><div><span class="lock">🔒 Family album</span><h1>' + h(d.title) + '</h1><p class="soft">' + n + ' photo' + (n === 1 ? '' : 's') + '. Tap one to see it big or download it.</p></div>'
      + '<p class="who">Opened with the code for ' + h(d.family || "your family") + '<br><button class="link" id="out" type="button">Not you? Forget the code on this phone</button></p></div></section>'
      + (n ? secs.map(s => '<section class="card sec">' + (s.name ? '<h2>' + h(s.name) + '</h2>' : '') + '<div class="grid">' + s.items.map(x => { const i = all.push(x) - 1;
          return '<button type="button" data-i="' + i + '"><img loading="lazy" alt="" src="' + A + '/file/' + x.id + '?s=small">' + (x.kind === "video" ? '<span class="play">▶ Video</span>' : '') + '</button>'; }).join("") + '</div></section>').join("")
        : '<section class="card"><p class="soft">No photos have been added yet. Please check again in a few days.</p></section>');
    $("album").hidden = false;
    document.querySelectorAll("[data-i]").forEach(b => b.onclick = () => open(+b.dataset.i));
    $("out").onclick = () => fetch(A + "/out", { method: "POST" }).then(() => location.reload());
  };
  const load = () => fetch(A).then(r => r.ok ? r.json() : null).then(d => d && d.sections && show(d)).catch(() => {});
  const f = $("f");
  if (f) { f.onsubmit = async e => { e.preventDefault(); $("e").textContent = ""; const b = f.querySelector("button"); b.disabled = true;
      const r = await fetch(A + "/code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: $("c").value.replace(/\\D/g, "") }) }).catch(() => null);
      const d = r ? await r.json().catch(() => ({})) : { error: "No connection. Please try again." };
      b.disabled = false; if (r && r.ok) load(); else $("e").textContent = d.error || "That code did not work."; };
    load(); }
})();
</script></main></body></html>`, { status: state === "none" ? 404 : 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url), path = url.pathname;
  const db = getDatabase();

  // --- Families ---
  let m = /^\/(api\/)?photos\/([a-z0-9-]+)(?:\/(code|out|file\/([\w-]{10,})))?\/?$/.exec(path);
  if (path.startsWith("/photos/") || path.startsWith("/api/photos/")) {
    if (!m || !SLUG.test(m[2])) return new Response("Not found", { status: 404 });
    const api = !!m[1], slug = m[2], what = m[3] || "", fid = m[4] || "";
    const [alb] = (await db.sql`SELECT * FROM family_albums WHERE slug = ${slug}`) as Row[];
    const live = alb && alb.folder_id && robot();
    if (!api) return page(slug, (await projectTitles(db)).get(slug) || "Raavanaa", !live ? "none" : isClosed(alb) ? "closed" : "ready");
    if (!live) return json({ error: "There is no family album for this event." }, 404);
    if (isClosed(alb)) return json({ error: "This album is closed now. Please ask the Raavanaa volunteer." }, 403);
    const ip = ipHash(req, context);
    const log = (code: Row | null, action: string, detail = "") =>
      db.sql`INSERT INTO family_album_log (slug, code_id, family, action, detail, ip_hash) VALUES (${slug}, ${code?.id ?? null}, ${code?.family || ""}, ${action}, ${clip(detail, 200)}, ${ip})`;

    if (what === "code" && req.method === "POST") {
      const [t] = (await db.sql`SELECT COUNT(*)::int AS n FROM family_album_log WHERE ip_hash = ${ip} AND action = 'wrong' AND at > NOW() - INTERVAL '1 hour'`) as Row[];
      if (t.n >= 8) return json({ error: "Too many tries. Please wait an hour, or ask the Raavanaa volunteer for your code." }, 429);
      let b: Row = {};
      try { b = await req.json(); } catch { /* empty */ }
      const code = String(b.code || "").replace(/\D/g, "").slice(0, 6);
      const [c] = code.length === 6 ? ((await db.sql`SELECT id, family FROM family_album_codes WHERE slug = ${slug} AND code = ${code} AND stopped_at IS NULL`) as Row[]) : [];
      if (!c) { await log(null, "wrong", code ? `${code.slice(0, 2)}····` : ""); return json({ error: "That code did not work. Please check the WhatsApp message from Raavanaa." }, 403); }
      await db.sql`UPDATE family_album_codes SET last_seen = NOW() WHERE id = ${c.id}`;
      await log(c, "open");
      return json({ ok: true }, 200, { "Set-Cookie": setCookie(slug, c.id) });
    }
    if (what === "out" && req.method === "POST") return json({ ok: true }, 200, { "Set-Cookie": `${cookieName(slug)}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });

    const cid = readCookie(req, slug);
    const [code] = cid ? ((await db.sql`SELECT id, family FROM family_album_codes WHERE id = ${cid} AND slug = ${slug} AND stopped_at IS NULL`) as Row[]) : [];
    if (!code) return json({ error: "Please type your family code." }, 401);

    if (!what && req.method === "GET") {
      try {
        const a = await listAlbum(alb.folder_id);
        await db.sql`UPDATE family_album_codes SET last_seen = NOW() WHERE id = ${code.id}`;
        return json({ title: (await projectTitles(db)).get(slug) || a.name, family: code.family, sections: a.sections.map((s) => ({ name: s.name, items: s.items.map((x) => ({ id: x.id, kind: x.kind })) })) });
      } catch { return json({ error: "The album could not be opened just now. Please try again later." }, 502); }
    }
    if (fid && req.method === "GET") {
      const f = await fileInAlbum(alb.folder_id, fid);
      if (!f) return new Response("Not found", { status: 404 });
      const s = url.searchParams.get("s") || "small";
      if (s === "download") await log(code, "download", f.name);
      const res = await fetchFile(f, f.mimeType.startsWith("image/") ? SIZES[s] ?? null : null, s === "play" ? req.headers.get("range") : null);
      if (!res.ok && res.status !== 206) return new Response("Not found", { status: 404 });
      const type = String(res.headers.get("content-type") || f.mimeType);
      const h: Record<string, string> = { "Content-Type": /^(image|video)\//.test(type) ? type : "application/octet-stream", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" };
      for (const k of ["content-length", "content-range", "accept-ranges"]) { const v = res.headers.get(k); if (v) h[k] = v; }
      if (s === "download") h["Content-Disposition"] = `attachment; filename="${String(f.name || "photo").replace(/[^\w.-]/g, "_")}"`;
      return new Response(res.body, { status: res.status, headers: h });
    }
    return json({ error: "Not allowed" }, 405);
  }

  // --- Team ---
  const me = await teamAccess();
  if (!me) return json({ error: "Please sign in with a team account." }, 401);
  const parts = path.replace(/^\/api\/family-albums\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const who = me.name || me.email;
  const audit = (action: string, target: string, details: unknown) => db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${me.email}, ${action}, ${target}, ${JSON.stringify(details)}::jsonb)`;
  let b: Row = {};
  if (req.method !== "GET") { try { b = await req.json(); } catch { /* empty */ } }
  const base = `${url.origin}/photos/`;
  const r = robot();

  if (!parts.length && req.method === "GET") {
    const titles = await projectTitles(db);
    const albums = (await db.sql`SELECT a.slug, a.folder_id, a.is_open, a.closes_on, (SELECT COUNT(*)::int FROM family_album_codes c WHERE c.slug = a.slug AND c.stopped_at IS NULL) AS codes FROM family_albums a`) as Row[];
    return json({ robot: r ? r.email : "", base, projects: [...titles].map(([slug, title]) => { const a = albums.find((x) => x.slug === slug);
      return { slug, title, folder: !!a?.folder_id, open: a ? !isClosed(a) : false, codes: a?.codes || 0 }; }) });
  }

  if (parts[0] === "codes" && parts[1]) {
    const id = Number(parts[1]);
    const [c] = (await db.sql`SELECT * FROM family_album_codes WHERE id = ${id}`) as Row[];
    if (!c) return json({ error: "Not found" }, 404);
    if (req.method === "DELETE") {
      await db.sql`UPDATE family_album_codes SET stopped_at = COALESCE(stopped_at, NOW()) WHERE id = ${id}`;
      await audit("album.code.stop", c.slug, { id, family: c.family });
      return json({ ok: true });
    }
    if (parts[2] === "renew" && req.method === "POST") {
      await db.sql`UPDATE family_album_codes SET stopped_at = COALESCE(stopped_at, NOW()) WHERE id = ${id}`;
      const n = await newCode(db, c.slug, c.family, c.phone, who);
      await audit("album.code.renew", c.slug, { id, family: c.family, now: n.id });
      return json({ ok: true, id: n.id, code: n.code });
    }
    return json({ error: "Not allowed" }, 405);
  }

  const slug = parts[0];
  if (!SLUG.test(slug || "")) return json({ error: "Pick a project" }, 400);

  if (parts.length === 1 && req.method === "GET") {
    const [a] = (await db.sql`SELECT * FROM family_albums WHERE slug = ${slug}`) as Row[];
    const codes = (await db.sql`SELECT c.*, (SELECT COUNT(*)::int FROM family_album_log l WHERE l.code_id = c.id AND l.action = 'open') AS opens,
        (SELECT COUNT(*)::int FROM family_album_log l WHERE l.code_id = c.id AND l.action = 'download') AS downloads
      FROM family_album_codes c WHERE c.slug = ${slug} ORDER BY c.stopped_at IS NOT NULL, c.created_at DESC`) as Row[];
    const logRows = (await db.sql`SELECT family, action, detail, at FROM family_album_log WHERE slug = ${slug} ORDER BY at DESC LIMIT 200`) as Row[];
    return json({
      slug, robot: r ? r.email : "", link: base + slug,
      album: a ? { folderUrl: a.folder_url, folderId: a.folder_id, open: !!a.is_open, closed: isClosed(a), closesOn: a.closes_on ? String(a.closes_on instanceof Date ? a.closes_on.toISOString() : a.closes_on).slice(0, 10) : "" } : null,
      codes: codes.map((c) => ({ id: c.id, family: c.family, phone: c.phone, code: c.code, by: c.created_by, at: c.created_at, stopped: !!c.stopped_at, lastSeen: c.last_seen, opens: c.opens, downloads: c.downloads })),
      log: logRows.map((l) => ({ family: l.family, action: l.action, detail: l.detail, at: l.at })),
    });
  }

  if (parts.length === 1 && req.method === "PUT") {
    const [old] = (await db.sql`SELECT * FROM family_albums WHERE slug = ${slug}`) as Row[];
    const url2 = b.folder !== undefined ? clip(b.folder, 300) : old?.folder_url || "";
    const fid = folderId(url2);
    if (url2 && !fid) return json({ error: "That does not look like a Google Drive folder link." }, 400);
    const open = b.open !== undefined ? !!b.open : old ? !!old.is_open : true;
    const closes = /^\d{4}-\d{2}-\d{2}$/.test(String(b.closes_on || "")) ? String(b.closes_on) : b.closes_on === "" ? null
      : old?.closes_on ?? new Date(Date.now() + 365 * 86400e3).toISOString().slice(0, 10); // closes by itself after a year
    await db.sql`INSERT INTO family_albums (slug, folder_id, folder_url, is_open, closes_on, created_by) VALUES (${slug}, ${fid}, ${url2}, ${open}, ${closes}, ${who})
      ON CONFLICT (slug) DO UPDATE SET folder_id = EXCLUDED.folder_id, folder_url = EXCLUDED.folder_url, is_open = EXCLUDED.is_open, closes_on = EXCLUDED.closes_on, updated_at = NOW()`;
    await audit("album.save", slug, { folder: fid, open, closes });
    return json({ ok: true });
  }

  if (parts[1] === "check" && req.method === "POST") {
    const [a] = (await db.sql`SELECT folder_id FROM family_albums WHERE slug = ${slug}`) as Row[];
    if (!a?.folder_id) return json({ error: "Paste the Drive folder link first." }, 400);
    if (!r) return json({ error: "The Drive robot is not set up yet." }, 400);
    try {
      const al = await listAlbum(a.folder_id);
      const photos = al.sections.reduce((t, s) => t + s.items.filter((x) => x.kind === "photo").length, 0), videos = al.sections.reduce((t, s) => t + s.items.filter((x) => x.kind === "video").length, 0);
      return json({ ok: true, name: al.name, photos, videos, folders: al.sections.filter((s) => s.name).map((s) => s.name) });
    } catch (e) { return json({ error: (e as Error).message }, 400); }
  }

  if (parts[1] === "codes" && req.method === "POST") {
    const family = clip(b.family, 80);
    if (!family) return json({ error: "Type the parent's name" }, 400);
    const phone = clip(b.phone, 30).replace(/[^\d+]/g, "");
    const n = await newCode(db, slug, family, phone, who);
    await audit("album.code.add", slug, { family });
    return json({ ok: true, id: n.id, code: n.code });
  }
  return json({ error: "Not allowed" }, 405);
};

// A 6-digit code no other family on this album has.
async function newCode(db: ReturnType<typeof getDatabase>, slug: string, family: string, phone: string, by: string) {
  for (let i = 0; i < 20; i++) {
    const code = String(randomInt(100000, 1000000));
    try {
      const [c] = (await db.sql`INSERT INTO family_album_codes (slug, family, phone, code, created_by) VALUES (${slug}, ${family}, ${phone}, ${code}, ${by}) RETURNING id, code`) as Row[];
      return c;
    } catch { /* that code is taken on this album: try another */ }
  }
  throw new Error("Could not make a code");
}

export const config: Config = { path: ["/photos/*", "/api/photos/*", "/api/family-albums", "/api/family-albums/*"] };
