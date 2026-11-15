/* Raavanaa web app: keeps the site usable on a weak or lost connection.
   What it does, in plain words:
   - Styles and scripts: the fresh copy when it comes within 1.5 seconds, else the saved copy. Site data (.json): the same, but it waits 4.5 seconds.
   - Pictures: the saved copy at once, and a fresh copy fetched quietly for next time.
   - Pages: every page someone opens is saved. With no connection the saved page opens; a page never opened shows /offline.html.
   - Never saved: sign-in, the team portal, the admin, vouching links and anything under /api (people's own details and live money figures).

   The site password (netlify/edge-functions/preview-lock.ts): while it is on, this file leaves page loads to the browser whenever
   the phone is online, because only the browser itself can ask for the password. It works out by itself whether the password is on
   (see checkGate), so nothing here needs changing on launch day.

   To make every phone drop its saved copies (after a big redesign, say), raise the number in VERSION. */
const VERSION = "v3";
const SHELL = "raav-app-" + VERSION;      // pages, styles, scripts, data
const PICS = "raav-pics-" + VERSION;      // pictures
const PICS_MAX = 220;                     // oldest pictures are dropped beyond this
const WAIT = 1500;                        // ms to wait for the network before using a saved style, script or page (was 4.5 s; 13 Nov 2026, speed)
const WAIT_DATA = 4500;                   // ms to wait for fresh site data (.json): data stays fresh whenever the network allows

// Open to everyone (no password), so they can always be fetched when the app is installed.
const FIRST = ["/offline.html", "/img/app/icon-192.png"];
// Fetched too when the password allows it (it does for anyone who has already opened the site).
const NICE = ["/style.css", "/site.js", "/ta.js", "/site.json", "/projects.json", "/share.json"];

const PRIVATE = /^\/(api|portal|admin|members|e)(\/|$|\.)|^\/ta\/(members|e)(\/|$)|^\/\.netlify\/(?!images)/;
const isPicture = url => /^\/img\//.test(url.pathname) || /^\/\.netlify\/images/.test(url.pathname) || /\.(png|jpe?g|webp|svg|gif|ico)$/i.test(url.pathname);
const isPage = url => !/\.[a-z0-9]{2,5}$/i.test(url.pathname) || /\.html$/i.test(url.pathname);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await Promise.all(FIRST.map(u => fetch(u, { cache: "no-cache" }).then(r => r.ok && cache.put(u, r)).catch(() => {})));
    await Promise.all(NICE.map(u => fetch(u, { cache: "no-cache" }).then(r => r.ok && cache.put(u, r)).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => /^raav-/.test(n) && n !== SHELL && n !== PICS).map(n => caches.delete(n)));
    await self.clients.claim();
    checkGate();
  })());
});

// Is the site password on? A request sent without the password answers 401 when it is.
// Until we know, assume it is on: that is the safe choice (the browser then loads pages itself).
let gated = true, gateChecked = 0;
function checkGate() {
  if (Date.now() - gateChecked < 30 * 60 * 1000) return;
  gateChecked = Date.now();
  fetch("/overview", { method: "HEAD", credentials: "omit", cache: "no-store" })
    .then(r => { gated = r.status === 401; })
    .catch(() => { gateChecked = 0; });
}
checkGate();

const fits = res => res && res.ok && res.type === "basic";

async function trimPictures() {
  const cache = await caches.open(PICS);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - PICS_MAX; i++) await cache.delete(keys[i]);
}

// Fresh copy first; the saved copy if the network is slow or gone.
function freshFirst(event, cacheName, wait = WAIT) {
  const req = event.request;
  return (async () => {
    const cache = await caches.open(cacheName);
    const saved = await cache.match(req);
    const fresh = fetch(req).then(res => {
      if (fits(res)) event.waitUntil(cache.put(req, res.clone()).catch(() => {}));
      return res;
    });
    if (!saved) return fresh;
    event.waitUntil(fresh.catch(() => {}));
    return Promise.race([
      fresh.then(res => (res.ok || res.status === 304 ? res : saved)).catch(() => saved),
      new Promise(done => setTimeout(() => done(saved), wait))
    ]);
  })();
}

// Saved copy at once; a fresh one is fetched quietly for next time.
function savedFirst(event) {
  const req = event.request;
  return (async () => {
    const cache = await caches.open(PICS);
    const saved = (await cache.match(req)) || (await caches.match(req));
    const fresh = fetch(req).then(res => {
      if (fits(res)) event.waitUntil(cache.put(req, res.clone()).then(trimPictures).catch(() => {}));
      return res;
    });
    if (saved) { event.waitUntil(fresh.catch(() => {})); return saved; }
    return fresh;
  })();
}

// A page: the network when it answers in time, else the saved page, else the "no connection" page.
function page(event, url) {
  return (async () => {
    const cache = await caches.open(SHELL);
    const saved = () => cache.match(url.pathname).then(hit => hit || cache.match("/offline.html"));
    if (self.navigator.onLine === false) return (await saved()) || Response.error();
    const fresh = fetch(event.request).then(res => {
      if (fits(res) && !res.redirected) event.waitUntil(cache.put(url.pathname, res.clone()).catch(() => {}));
      return res;
    });
    event.waitUntil(fresh.catch(() => {}));
    const hit = await cache.match(url.pathname);
    return Promise.race([
      fresh.catch(async () => (await saved()) || Response.error()),
      // a slow network: show the saved page after a while (only when there is one), and keep fetching for next time
      new Promise(done => { if (hit) setTimeout(() => done(hit), WAIT + 1500); })
    ]);
  })();
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (PRIVATE.test(url.pathname) || url.pathname === "/sw.js") return;
  if (req.headers.has("range")) return;
  checkGate();

  if (req.mode === "navigate") {
    // While the password is on and the phone is online, the browser must load the page itself (it alone can ask for the password).
    if (gated && self.navigator.onLine !== false) return;
    event.respondWith(page(event, url));
    return;
  }
  if (isPicture(url)) { event.respondWith(savedFirst(event)); return; }
  if (/\.(css|js)$/i.test(url.pathname)) { event.respondWith(freshFirst(event, SHELL)); return; }
  if (/\.json$/i.test(url.pathname)) { event.respondWith(freshFirst(event, SHELL, WAIT_DATA)); return; }
});

// Each page tells us it was opened, so we can keep a copy for a day with no connection.
self.addEventListener("message", event => {
  // For checking by hand: postMessage({ ask: "state" }) on a MessageChannel answers with the version and whether the password is on.
  if (event.data && event.data.ask === "state" && event.ports && event.ports[0]) { event.ports[0].postMessage({ version: VERSION, gated }); return; }
  const keep = event.data && event.data.keep;
  if (typeof keep !== "string" || keep.charAt(0) !== "/" || keep.indexOf("//") === 0) return;
  const url = new URL(keep, self.location.origin);
  if (url.origin !== self.location.origin || PRIVATE.test(url.pathname) || !isPage(url)) return;
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(SHELL);
      // With the password off, page loads pass through this file and are saved there already.
      if (!gated && await cache.match(url.pathname)) return;
      const res = await fetch(url.pathname, { credentials: "include", cache: "no-cache" });
      if (fits(res) && /text\/html/i.test(res.headers.get("content-type") || "")) await cache.put(url.pathname, res);
    } catch (e) { /* no connection: the copy we have stays */ }
  })());
});
