/* Shared site script: loads content/*.json and renders the current page.
   Content is edited from /admin — no code changes needed for new projects. */
/* ---------- Feature switches (SURESH, 14 Nov 2026: "go feature by feature") ----------
   The launch carries ONE feature: giving in loving memory of someone, with one simple page for that person (/m/<code>).
   Everything else stays built and comes back one at a time: set its switch to true and publish.
     sponsor  Sponsor a Smile and Donate (Home icons, /give and /fund opened directly, Donate on project pages).
              While false, every way to give goes through /moment, in someone's memory.
     circle   family and friends circles on the moment page and the family page (invites, joining, circle choice).
     vetting  people asking for a project and vouching for it (/initiate, /create, /e/<link>, "Start a project",
              "Vouched for by").
     pledge   the simple project giving form (SURESH, 17 Nov 2026): Give on a project opens one short form on that
              project (amount, name, email or WhatsApp, follow); the pledge shows on the project at once.
     group    "Just me / A group" on Spark a Smile (/spark) and its group words (SURESH 16 Nov 2026: a next feature).
     reasons  the reasons shown on /moment; [] shows all twelve.
     left     the red "See what's left to reach 100%" button on project pages and the fold it opens (funders list,
              Make this happen, Help another way). Off for now (SURESH, 22 Nov 2026: "out now, keep it under to do").
     voices   on project pages: open vouching (anyone, no limit) and, on Impact projects only, 1-5 star ratings from the
              people involved, with comments the team reads first (SURESH, 22 Nov 2026). false goes back to the static "Vouched for by" list and the old comments.
   On a draft or local preview, ?features=all shows everything for this browser tab (?features=launch goes back). */
// Every skill people can bring to Raavanaa (SURESH, 17 Nov 2026: "have all the skills captured"). Shown on /spark (Join
// Raavanaa) and /volunteer; both send the Netlify form "volunteer" (field skills[]).
window.RAAV_SKILLS = ["Visiting and checking projects near me", "Driving and transport", "Cooking and food", "Teaching and tutoring", "Sports and games",
  "Music, dance and art", "Photos and video", "Writing and stories", "Tamil and English translation", "Social media", "Fundraising and events",
  "Accounts and bookkeeping", "Website and IT", "Medical and first aid", "Counselling and care", "Legal advice", "Building and repairs",
  "Farming and livelihoods", "Organising and leading", "Something else"];
window.RAAV_FEATURES = (function () {
  const F = { sponsor: false, pledge: true, reserve: false, circle: false, vetting: true, voices: true, left: false, tamil: false, group: false, join: false, volunteers: false, moment: false, map: false, reasons: [] };  // join: "Join Raavanaa" cards and links (off, SURESH 20 Nov 2026: "take join raavanaa out")  // all twelve reasons back on /moment (SURESH 17 Nov 2026: "All")
  try {
    const q = new URLSearchParams(location.search).get("features");
    const test = /^(draft--|localhost$|127\.0\.0\.1$)/.test(location.hostname) || /--charity-projects-draft\./.test(location.hostname);
    if (test && q === "all") sessionStorage.setItem("raav-features", "all");
    if (q === "launch") sessionStorage.removeItem("raav-features");
    if (test && sessionStorage.getItem("raav-features") === "all") { F.sponsor = F.circle = F.vetting = F.tamil = F.group = F.join = F.volunteers = F.moment = F.map = F.left = F.reserve = true; F.reasons = []; }
  } catch (e) { /* storage blocked: the launch switches stay */ }
  ["sponsor", "circle", "vetting", "tamil"].forEach(k => { if (!F[k]) document.documentElement.classList.add("no-" + k); });
  // No "Reserved" step (SURESH 23 Nov 2026: "better we remove reserve. So it will directly place the name"): a giver from the
  // Be the smile form shows at once by name and amount on one line, counts as Funded and stays until the team Closes it in
  // the portal. Set reserve: true to bring back the RESERVED tag, the Reserved ring line and the words about it.
  // Tamil hidden for now (SURESH 15 Nov 2026): no தமிழ் switch, and a /ta/ page opens the same page in English.
  // The Tamil pages and ta.js stay; set tamil: true to bring them back.
  // Volunteers pages taken out (SURESH, 20 Nov 2026: "take join volunteer page out"); set volunteers: true to bring them back.
  if (!F.volunteers && /^\/(ta\/)?volunteers?(\.html)?\/?$/.test(location.pathname)) location.replace("/projects");
  // Gift a Moment taken out for this release (SURESH, 20 Nov 2026: "we do it in phases, next release"). The page, its
  // project list and the moment cards stay in the code; set moment: true to bring them all back. Family pages /m/ still open.
  // Smile Map taken out for this release (SURESH, 20 Nov 2026: "another release"); set map: true to bring it back.
  if (!F.map && /^\/(ta\/)?smile-map(-v2)?(\.html)?\/?$/.test(location.pathname)) location.replace("/projects");
  if (!F.moment && /^\/(ta\/)?moment(\.html)?\/?$/.test(location.pathname)) location.replace("/projects");
  if (!F.tamil && /^\/ta(\/|$)/.test(location.pathname)) location.replace((location.pathname.replace(/^\/ta/, "") || "/") + location.search + location.hash);
  return F;
})();
// The site's own visit counter (16 Nov 2026, track.js): free, no cookies, nothing personal.
(function () {
  if (document.querySelector('script[src^="/track.js"]')) return;
  const t = document.createElement("script"); t.src = "/track.js?v=1"; t.defer = true; document.head.appendChild(t);
})();
(function () {
  let COMMENTS = [];
  const FEAT = window.RAAV_FEATURES;
  const PALETTES = [
    ["#2f7f8f", "#163a45", "#f2c14e"], ["#c0583a", "#5a2a2a", "#f6d79a"],
    ["#3d7a4f", "#1b3a2a", "#9fd3c7"], ["#b07d2b", "#4a3418", "#f1e3b5"],
    ["#4f5d9a", "#22284a", "#ffb38a"], ["#2e6d5c", "#10302a", "#cde8a0"]
  ];

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slugify = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
  const slugOf = p => p.slug ? slugify(p.slug) : slugify(p.title);
  // Small Markdown renderer: headings, paragraphs, lists, bold, italic, links, images.
  const inline = t => esc(t)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, h) => h.startsWith("/") ? `<a href="${h}">${t}</a>` : `<a href="${h}" target="_blank" rel="noopener">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, "$1<em>$2</em>");
  const md = src => {
    const blocks = String(src || "").replace(/\r/g, "").split(/\n{2,}/);
    return blocks.map(b => {
      const t = b.trim(); if (!t) return "";
      const h = t.match(/^(#{1,4})\s+(.*)$/);
      if (h && !t.includes("\n")) { const n = Math.min(Math.max(h[1].length, 2), 4); return `<h${n}>${inline(h[2])}</h${n}>`; }
      const lines = t.split("\n");
      if (lines.every(l => /^\s*[-*]\s+/.test(l))) return `<ul>${lines.map(l => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`;
      if (lines.every(l => /^\s*\d+[.)]\s+/.test(l))) return `<ol>${lines.map(l => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`;
      if (lines.every(l => /^>\s?/.test(l))) return `<p class="pull">${inline(lines.map(l => l.replace(/^>\s?/, "")).join(" "))}</p>`;
      return `<p>${lines.map(inline).join("<br>")}</p>`;
    }).join("");
  };
  const fmtDate = d => {
    if (!d) return "";
    const dt = new Date(String(d).length === 10 ? d + "T12:00:00" : d);
    return isNaN(dt) ? esc(d) : dt.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
  };
  // Resize uploaded photos through Netlify's image service so pages load fast on phones.
  const imgUrl = (src, w) => {
    const u = String(src || "");
    // Uploaded photos are resized on the fly; drawings (SVG) are served as they are.
    return u.startsWith("/") && !u.startsWith("//") && !/\.svg$/i.test(u) ? `/.netlify/images?url=${encodeURIComponent(u)}&w=${w}&q=75` : u;
  };
  const art = i => { const [a, b, c] = PALETTES[i % PALETTES.length]; return `background:radial-gradient(circle at 78% 28%, ${c} 0 12%, transparent 13%),linear-gradient(160deg, ${a} 0%, ${b} 100%)`; };
  const coverHTML = (p, i, label, w = 800) => p.cover
    ? `<img src="${esc(imgUrl(p.cover, w))}" alt="" loading="lazy">${label ? `<span>${esc(label)}</span>` : ""}`
    : (label ? `<span>${esc(label)}</span>` : "");
  const coverStyle = (p, i) => p.cover ? "" : art(i);

  async function load(path) {
    const r = await fetch(path, { cache: "no-cache" });
    if (!r.ok) throw new Error(path);
    return r.json();
  }

  /* ---------- Raavanaa as a web app (SURESH, 12 Nov 2026: "I want to build this as a web app") ----------
     The site can be put on a phone's home screen and then opens like any other app: its own icon, no address bar,
     a bar of five buttons along the bottom, and pages that still open when the connection is weak or gone.
     The parts: /manifest.json (name, icon, colours, where it opens), /sw.js (the saved copies), /offline.html (no connection),
     img/app/ (icons, made by tools/logo/make_app_icons.py), and this block (install button, bottom bar).
     To see the app look in an ordinary browser, add ?app=1 to any address (?app=0 turns it off again). */
  const APP = (() => {
    const TA = /^\/ta(\/|$)/.test(location.pathname);
    const qs = new URLSearchParams(location.search);
    const keep = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } return null; };
    // Opened from the home-screen icon: carry on in the language used last time.
    if (qs.get("from") === "app") {
      if (!TA && keep("raav-lang") === "ta") { location.replace("/ta" + location.pathname + location.search); return { inApp: true, install() {} }; }
      qs.delete("from");
      try { history.replaceState(null, "", location.pathname + (qs.toString() ? "?" + qs : "") + location.hash); } catch (e) { /* keep the address as it is */ }
    }
    keep("raav-lang", TA ? "ta" : "en");

    const head = document.head;
    const add = (tag, attrs) => { const el = document.createElement(tag); Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k])); head.appendChild(el); return el; };
    if (!head.querySelector('link[rel="manifest"]')) add("link", { rel: "manifest", href: "/manifest.json" });
    [["mobile-web-app-capable", "yes"], ["apple-mobile-web-app-capable", "yes"], ["apple-mobile-web-app-title", "Raavanaa"]]
      .forEach(([name, content]) => { if (!head.querySelector(`meta[name="${name}"]`)) add("meta", { name, content }); });
    const touch = head.querySelector('link[rel="apple-touch-icon"]');
    if (touch) touch.setAttribute("href", "/img/app/apple-touch-icon.png?v=1"); else add("link", { rel: "apple-touch-icon", href: "/img/app/apple-touch-icon.png?v=1" });

    // Saved copies for a weak or lost connection. Each page opened is kept for later.
    if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) {
      const start = () => navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready)
        .then(reg => { if (reg.active) reg.active.postMessage({ keep: location.pathname }); }).catch(() => { /* the site works without it */ });
      if (document.readyState === "complete") start(); else window.addEventListener("load", start);
    }

    const mq = q => !!(window.matchMedia && window.matchMedia(q).matches);
    const installed = mq("(display-mode: standalone)") || mq("(display-mode: fullscreen)") || mq("(display-mode: minimal-ui)") || navigator.standalone === true;
    let preview = false;
    try {
      if (qs.get("app") === "1") sessionStorage.setItem("raav-app", "1");
      if (qs.get("app") === "0") sessionStorage.removeItem("raav-app");
      preview = sessionStorage.getItem("raav-app") === "1";
    } catch (e) { /* storage blocked */ }
    const inApp = installed || preview;
    const page = document.body.dataset.page || "";

    // The bar along the bottom of the phone, as in any app. Shown only inside the app.
    if (inApp && page !== "welcome") {
      document.documentElement.classList.add("in-app");
      let signedIn = false; try { signedIn = !!localStorage.getItem("gotrue.user"); } catch (e) { /* storage blocked */ }
      const ico = d => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
      // SURESH 17 Nov 2026: in the app, Projects comes first (the app also opens on it, see manifest.json start_url).
      const TABS = [
        ["Projects", "/projects", /^(projects|stage|project|home|create|initiate|spark)$/, ico('<rect x="3.5" y="4.5" width="17" height="4.6" rx="1.6"/><rect x="3.5" y="11" width="17" height="4.6" rx="1.6"/><path d="M4.5 19.5h15"/>')],
        ["Home", "/overview", /^overview$/, ico('<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 9.8V20h4.4v-5.4h3.6V20h4.4V9.8"/>')],
        FEAT.moment ? ["Gift", "/moment", /^(moment|together|give|fund|thanks)$/, '<span class="appbar-gift"><img src="/img/moment-mark.svg" alt="" width="34" height="34"></span>']
          // SURESH 20 Nov 2026: Submit a need is the big round button in the middle, as Gift a Moment was.
          : ["Submit", "/initiate?way=need", /^(initiate|spark)$/, '<span class="appbar-gift appbar-submit"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span>'],
        FEAT.map && ["Map", "/smile-map", /^map2?$/, ico('<path d="M12 21s6.5-5.6 6.5-10.6A6.5 6.5 0 0 0 5.5 10.4C5.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.2" r="2.4"/>')],
        [signedIn ? "Sign out" : "Sign in", signedIn ? "/members?signout" : "/members", /^members$/, ico('<circle cx="12" cy="8.4" r="3.7"/><path d="M4.6 20c.9-3.6 3.8-5.4 7.4-5.4s6.5 1.8 7.4 5.4"/>')]
      ].filter(Boolean);
      const nav = document.createElement("nav");
      nav.className = "appbar"; nav.setAttribute("aria-label", "App");
      nav.innerHTML = TABS.map(([t, h, on, pic], i) => `<a class="appbar-tab${h === "/moment" || h === "/initiate?way=need" ? " gift" : ""}" href="${h}"${on.test(page) ? ' aria-current="page"' : ""}>${pic}<span>${t}</span></a>`).join("");
      document.body.appendChild(nav);
    }

    // "Install": Android and computers can ask the phone directly; iPhones need three taps, which we show.
    const ua = navigator.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    // Facebook's and Instagram's own browsers cannot add anything to a home screen, so the offer stays out of the way there.
    const boxed = /FBAN|FBAV|FB_IAB|Instagram|Line\//i.test(ua);
    if (installed) keep("raav-app-have", "1");
    let ask = null, strip = null;
    const STEPS = {
      ios: ["On an iPhone or iPad", ["Tap the Share button (the square with an arrow) in your browser.", "Scroll down and tap “Add to Home Screen”.", "Tap “Add”. Raavanaa is now on your home screen."]],
      android: ["On an Android phone", ["Tap the three dots at the top of your browser.", "Tap “Install app” or “Add to Home screen”.", "Tap “Install”. Raavanaa is now on your home screen."]],
      computer: ["On a computer", ["In Chrome or Edge, click the install icon at the end of the address bar.", "Click “Install”. Raavanaa opens in its own window."]]
    };
    function help() {
      if (document.querySelector(".app-sheet")) return;
      const order = ios ? ["ios", "android", "computer"] : android ? ["android", "ios", "computer"] : ["computer", "android", "ios"];
      const part = k => `<h3>${STEPS[k][0]}</h3><ol>${STEPS[k][1].map(t => `<li>${t}</li>`).join("")}</ol>`;
      const box = document.createElement("div");
      box.className = "app-sheet"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "app-sheet-t");
      box.innerHTML = `<div class="app-sheet-box">
        <button type="button" class="app-sheet-x" aria-label="Close">×</button>
        <img src="/img/app/icon-192.png" alt="" width="72" height="72">
        <h2 id="app-sheet-t">Put Raavanaa on your home screen</h2>
        <p>It opens like any other app, and it still opens when the connection is weak.</p>
        <div class="app-sheet-mine">${part(order[0])}</div>
        <details><summary>On another device</summary>${order.slice(1).map(part).join("")}</details>
      </div>`;
      const shut = () => { box.remove(); document.removeEventListener("keydown", onKey); };
      const onKey = e => { if (e.key === "Escape") shut(); };
      box.addEventListener("click", e => { if (e.target === box || e.target.closest(".app-sheet-x")) shut(); });
      document.addEventListener("keydown", onKey);
      document.body.appendChild(box);
      box.querySelector(".app-sheet-x").focus();
    }
    function install() {
      if (!ask) { help(); return; }
      const e = ask; ask = null;
      e.prompt();
      Promise.resolve(e.userChoice).then(c => { if (c && c.outcome === "accepted" && strip) strip.remove(); }).catch(() => {});
    }
    // A slim strip at the top of Home that offers the app. "×" hides it for a month.
    function offer() {
      if (strip || inApp || page !== "overview" || keep("raav-app-have")) return;
      if (!(ask || ((ios || android) && !boxed))) return;
      const hidden = +keep("raav-app-later") || 0;
      if (hidden && Date.now() - hidden < 30 * 24 * 3600 * 1000) return;
      const main = document.getElementById("app"); if (!main) return;
      const phone = ios || android;
      strip = document.createElement("aside");
      strip.className = "app-strip wrap"; strip.setAttribute("aria-label", "Get the app");
      strip.innerHTML = `<div class="app-strip-in"><img src="/img/app/icon-192.png" alt="" width="46" height="46">
        <span class="app-strip-t"><b>${phone ? "Raavanaa on your phone" : "Raavanaa as an app"}</b><small>${phone ? "Add it to your home screen. It is free." : "Install it on this computer. It is free."}</small></span>
        <button type="button" class="app-strip-go">Install</button>
        <button type="button" class="app-strip-x" aria-label="Close">×</button></div>`;
      strip.querySelector(".app-strip-go").addEventListener("click", install);
      strip.querySelector(".app-strip-x").addEventListener("click", () => { keep("raav-app-later", String(Date.now())); strip.remove(); });
      main.before(strip);
    }
    window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); ask = e; offer(); });
    window.addEventListener("appinstalled", () => { ask = null; keep("raav-app-have", "1"); if (strip) strip.remove(); });
    document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("[data-get-app]"); if (a) { e.preventDefault(); install(); } });
    offer();
    // A link that opens the install steps by itself (SURESH, 15 Nov 2026): raavanaa.org/app (or any page with ?install=1).
    if (qs.get("install") === "1" && !inApp) {
      const go = () => setTimeout(help, 600);
      if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    }
    return { inApp, install };
  })();

  // Footer shown on every page. Social links and email appear only when filled in under Site settings.
  // Shown where a switched-off feature used to be (see the feature switches at the top).
  const soonHTML = () => `<section class="soon-note panel">
      <img src="/img/moment-mark.svg" alt="" width="72" height="72">
      <h1>Starting a project opens soon</h1>
      <p>For now, you can give children a day of joy in loving memory of someone dear to you.</p>
      <a class="btn" href="/moment?for=memory">Give in loving memory</a>
    </section>`;
  function frame(site) {
    // English / Tamil switch in the header: the same page in the other language.
    const bar = document.querySelector(".bar .wrap");
    if (bar && FEAT.tamil && !bar.querySelector(".lang-switch")) {
      const onTa = /^\/ta(\/|$)/.test(location.pathname);
      const path = onTa ? (location.pathname.replace(/^\/ta/, "") || "/") : "/ta" + (location.pathname === "/" ? "/" : location.pathname);
      const a = document.createElement("a");
      a.className = "lang-switch lang-link"; a.href = path + location.search;
      a.textContent = onTa ? "English" : "தமிழ்"; a.lang = onTa ? "en" : "ta";
      a.setAttribute("aria-label", onTa ? "Read this page in English" : "இந்தப் பக்கத்தைத் தமிழில் படிக்க");
      bar.appendChild(a);
    }
    // Members link at the end of the menu: "Sign in", or "My account" once signed in (Netlify Identity keeps the session in localStorage).
    const navEl = document.getElementById("site-nav");
    if (navEl && !FEAT.map) navEl.querySelectorAll('a[href="/smile-map"], a[href="/ta/smile-map"]').forEach(a => a.remove());
    if (navEl && !navEl.querySelector(".nav-member")) {
      let signedIn = false; try { signedIn = !!localStorage.getItem("gotrue.user"); } catch (e) { /* storage blocked */ }
      const m = document.createElement("a");
      // SURESH 20 Nov 2026: once signed in, the menu says "Sign out" (was "My account").
      m.className = "nav-member"; m.href = (/^\/ta(\/|$)/.test(location.pathname) ? "/ta" : "") + "/members" + (signedIn ? "?signout" : "");
      m.textContent = signedIn ? "Sign out" : "Sign in";
      if (document.body.dataset.page === "members") m.setAttribute("aria-current", "page");
      navEl.appendChild(m);
    }
    // "Volunteers" in every menu, after Projects (SURESH 17 Nov 2026: build the Volunteers page into the site).
    if (navEl && FEAT.volunteers && !navEl.querySelector('a[href$="/volunteers"]')) {
      const v = document.createElement("a"); v.href = "/volunteers"; v.textContent = "Volunteers";
      if (document.body.dataset.page === "volunteers") v.setAttribute("aria-current", "page");
      const after = navEl.querySelector('a[href="/initiated"], a[href="/projects"]');
      if (after) after.after(v); else navEl.insertBefore(v, navEl.querySelector(".nav-member"));
    }
    // "Gift a Moment": a button in every menu that opens the moment page (/moment). SURESH, 10 Nov 2026: that page
    // is very important and needs a clear way in from everywhere; the Home page itself stays as it was (/overview).
    // The title "Gift a Moment, in their name" and its heart-and-lamp mark (img/moment-mark.svg) are the same everywhere.
    if (navEl && FEAT.moment && !navEl.querySelector(".nav-moment")) {
      const g = document.createElement("a");
      g.className = "nav-moment"; g.href = (/^\/ta(\/|$)/.test(location.pathname) ? "/ta" : "") + "/moment";
      g.innerHTML = '<img src="/img/moment-mark.svg" alt="" width="26" height="26"><span>Gift a Moment</span>';
      if (/^(moment|together)$/.test(document.body.dataset.page || "")) g.setAttribute("aria-current", "page");
      navEl.insertBefore(g, navEl.querySelector(".nav-member"));
    }
    // "Submit a need": an eye-catching button in the header of every page, beside the menu button, so the way to
    // start a project is always in sight (SURESH, 17 Nov 2026). Hidden while starting projects is switched off.
    const barWrap = document.querySelector(".bar .wrap");
    if (barWrap && FEAT.vetting && !barWrap.querySelector(".bar-submit") && !/^(initiate|spark|portal|admin)$/.test(document.body.dataset.page || "")) {
      const sb = document.createElement("a");
      sb.className = "bar-submit"; sb.href = "/initiate?way=need";  // straight to the form (SURESH 20 Nov 2026); /spark stays the how-it-works page
      sb.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span><b>Submit</b> <small>a need</small></span>';
      barWrap.insertBefore(sb, barWrap.querySelector(".menu-btn") || null);
    }
    // Projects menu: a small drop-down with the three stages (on phones they show indented under Projects).
    const proj = document.querySelector('#site-nav a[href="/initiated"], #site-nav a[href="/ta/initiated"]');
    if (proj && !proj.closest(".nav-drop")) {
      const wrap = document.createElement("div"); wrap.className = "nav-drop";
      proj.replaceWith(wrap); wrap.appendChild(proj); proj.classList.add("nav-top");
      // SURESH 26 Nov 2026: "Projects" itself opens the page with every project (/projects), not only Initiated.
      proj.href = (/^\/ta(\/|$)/.test(location.pathname) ? "/ta" : "") + "/projects";
      if (document.body.dataset.page === "projects") proj.setAttribute("aria-current", "page");
      const sub = document.createElement("div"); sub.className = "nav-sub";
      sub.innerHTML = [["Initiated", "/initiated", "s1"], ["Activated", "/activated", "s2"], ["Impact", "/impact", "s3"]]
        .map(([t, h, c]) => `<a class="${c}" href="${h}"><i aria-hidden="true"></i>${t}</a>`).join("");
      wrap.appendChild(sub);
    }
    document.querySelectorAll("[data-site-name]").forEach(el => el.textContent = site.name || "");
    const foot = document.querySelector("footer");
    if (!foot) return;
    const safe = u => /^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "";
    const fb = safe(site.facebook), ig = safe(site.instagram);
    const mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(site.email || "").trim()) ? String(site.email).trim() : "";
    const col = (title, links) => `<div class="foot-col"><h3>${title}</h3><ul>${links.map(([t, h, ext]) => `<li><a href="${esc(h)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${esc(t)}</a></li>`).join("")}</ul></div>`;
    const follow = [fb && ["Facebook", fb, 1], ig && ["Instagram", ig, 1], mail && [mail, "mailto:" + mail]].filter(Boolean);
    foot.className = "foot";
    foot.innerHTML = `
      <svg class="foot-wave" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true"><path class="w1" d="M0 16C70 2 140 4 200 12 260 20 330 4 400 10V30H0Z"/><path class="w2" d="M0 24C80 10 150 12 210 18 270 24 336 12 400 16V30H0Z"/></svg>
      <div class="foot-main"><div class="wrap">
        <!-- Footer kept very simple (SURESH, 17 Nov 2026): one row of links, no stages, no Gift a Moment. -->
        <nav class="foot-simple" aria-label="Footer">
          ${[["Projects", "/projects"], ["Submit a need", "/initiate?way=need"], ...(FEAT.volunteers ? [["Volunteers", "/volunteers"]] : []), ["About us", "/about"], ["Contact", "/contact"]].map(([t, h]) => `<a href="${h}">${t}</a>`).join("")}${APP.inApp ? "" : `<a href="#app" data-get-app>Get the app</a>`}
        </nav>
        ${follow.length ? `<p class="foot-follow">${follow.map(([t, h, ext]) => `<a href="${esc(h)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${esc(t)}</a>`).join("")}</p>` : ""}
      </div></div>
      <div class="foot-bar"><div class="wrap">
        <span>© ${new Date().getFullYear()} ${esc(site.name)}</span>
        ${site.footer ? `<span>${esc(site.footer)}</span>` : ""}
        <span class="foot-links"><a href="/report">Report a concern</a><a href="/privacy">Privacy &amp; child safety</a><a href="/admin">Team login</a></span>
      </div></div>`;
  }

  // "Follow our updates" box. The matching hidden form in index.html lets Netlify collect it.
  const signupHTML = (where, title = "Follow our updates") => `
    <form class="panel follow" name="updates" data-ajax data-done="Thank you! We'll email you when we post new updates.">
      <h2 class="follow-title">${headline(title)}</h2>
      <p class="note" style="margin:0">Get an email when we post news from our projects.</p>
      <input type="hidden" name="form-name" value="updates">
      <input type="hidden" name="page" value="${esc(where)}">
      <p hidden><label>Leave empty <input name="bot-field"></label></p>
      <label class="sr" for="su-name-${esc(where)}">Name</label>
      <input id="su-name-${esc(where)}" name="name" autocomplete="name" placeholder="Your name (optional)">
      <label class="sr" for="su-email-${esc(where)}">Email</label>
      <input id="su-email-${esc(where)}" name="email" type="email" required autocomplete="email" placeholder="you@example.com">
      <button class="btn" type="submit">Follow</button>
      <p class="note" data-msg hidden></p>
    </form>`;

  // Request form: show the "person in charge" boxes only when someone asked you to send it.
  function wireWayIn(root) {
    const box = root.querySelector("[data-incharge]"); if (!box) return;
    const sync = () => { const on = !!root.querySelector("[name=request_type][value=referred]:checked"); box.hidden = !on; root.querySelector("#o-ic-name") && (root.querySelector("#o-ic-name").required = on); };
    root.querySelectorAll("[name=request_type]").forEach(r => r.addEventListener("change", sync)); sync();
  }
  // After "Submit a request": the Create a Moment mark, the request number, and the steps from here (SURESH 23 Nov 2026:
  // "a mini template with moment or ticket no. and the process"). In Tamil when the form was in Tamil.
  function requestDone(f, pj, warn) {
    const T = document.documentElement.dataset.formLang === "ta";
    const L = T ? { h: "உங்கள் கோரிக்கை கிடைத்தது", no: "கோரிக்கை எண்", keep: "இந்த எண்ணை வைத்திருங்கள். எங்களுடன் பேசும்போது இதைக் குறிப்பிடுங்கள்.", next: "அடுத்து என்ன நடக்கும்",
        s: [["நாங்கள் படிக்கிறோம்", "சில கேள்விகளுக்காக உங்களை அழைக்கலாம்."], ["திட்டப் பக்கத்தை உருவாக்குகிறோம்", "உங்களுடனும், பொறுப்பானவர் இருந்தால் அவருடனும் சரிபார்க்கிறோம்."], ["திட்டங்கள் பக்கத்தில் வெளியாகும்", "Raavanaa அங்கீகரித்ததும், மக்கள் உதவ முடியும்."]],
        acc: "என் கணக்கில் பார்க்க", home: "முகப்புக்குச் செல்ல" }
      : { h: "Your request is in", no: "Request number", keep: "Keep this number. Mention it when you talk to us.", next: "What happens next",
        s: [["We read it", "and may call you with a few questions."], ["We make the project page", "and check it with you, and with the person in charge if there is one."], ["It goes live on Projects", "once Raavanaa approves it, and people can help."]],
        acc: "Follow it in My account", home: "Back to Home" };
    const ref = pj && pj.ref ? String(pj.ref) : "";
    const card = document.createElement("section");
    card.className = "initiate-card rq-done"; card.setAttribute("role", "status"); card.tabIndex = -1;
    card.innerHTML = `<img class="rq-mark" src="/img/spark-mark.svg" width="84" height="84" alt="">
      <h2>${esc(L.h)}</h2>
      ${ref ? `<p class="rq-ticket"><span>${esc(L.no)}</span><b>${esc(ref)}</b></p><p class="rq-keep">${esc(L.keep)}</p>` : ""}
      ${warn ? `<p class="note error">${esc(warn)}</p>` : ""}
      <p class="rq-next">${esc(L.next)}</p>
      <ol class="rq-steps">${L.s.map((x, i) => `<li><i>${i + 1}</i><span><b>${esc(x[0])}</b> ${esc(x[1])}</span></li>`).join("")}</ol>
      <div class="rq-btns"><a class="i-submit" href="/members">${esc(L.acc)}</a><a class="rq-home" href="/overview">${esc(L.home)}</a></div>`;
    f.hidden = true; const lang = document.querySelector(".i-lang"); if (lang) lang.hidden = true;
    f.parentNode.insertBefore(card, f);
    card.scrollIntoView({ behavior: "smooth", block: "start" }); card.focus({ preventScroll: true });
  }
  function wireForms(root) {
    wireWayIn(root);
    root.querySelectorAll("form[data-ajax]").forEach(f => f.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = f.querySelector("button[type=submit]"), msg = f.querySelector("[data-msg]");
      if (f._check && !f._check()) return; // e.g. evidence missing
      // Sent for someone else: their name and a phone or email are needed (SURESH 20 Nov 2026).
      if (f.getAttribute("name") === "opportunity" && f.querySelector('[name=request_type][value=referred]:checked')) {
        const v = n => (f.querySelector(`[name=${n}]`) || {}).value?.trim() || "";
        const m = f.querySelector("[data-msg]");
        if (!v("incharge_name") || (!v("incharge_phone") && !v("incharge_email"))) {
          if (m) { m.hidden = false; m.textContent = "Please add the name of the person in charge, and their phone or email."; }
          f.querySelector("[data-incharge]")?.scrollIntoView({ behavior: "smooth", block: "center" }); return;
        }
      }
      btn.disabled = true;
      const fd = new FormData(f); // read the entries before the fields are disabled
      try {
        const toForms = fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fd).toString() });
        // Suggestions also go straight into the team portal's database.
        let toPortal = Promise.resolve(null);
        if (f.getAttribute("name") === "opportunity") {
          const data = {}; for (const [k, v] of fd.entries()) { if (k === "focus[]") (data.focus = data.focus || []).push(v); else data[k] = v; }
          if (f._evCount) data.evidence_files = f._evCount();
          toPortal = fetch("/api/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
        }
        // People who volunteer also go on the community list (/volunteers), shown only if they ticked "Show me".
        if (f.getAttribute("name") === "volunteer") {
          const data = { source: "volunteer" }; for (const [k, v] of fd.entries()) { const kk = k.replace("[]", ""); if (k.endsWith("[]")) (data[kk] = data[kk] || []).push(v); else data[kk] = v; }
          toPortal = fetch("/api/volunteers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
        }
        const [r, p] = await Promise.all([toForms.catch(() => null), toPortal]);
        if (p && p.status === 401) { btn.disabled = false; msg.textContent = "Please sign in first, then send it again."; msg.className = "note error"; msg.hidden = false; const g = document.querySelector("[data-gate]"); if (g) { g.hidden = false; f.hidden = true; } return; }
        if (!(r && r.ok) && !(p && p.ok)) throw new Error(r ? r.status : "offline");
        // Then the evidence files, once the suggestion exists.
        const pj = p && p.ok ? await p.json().catch(() => ({})) : null;
        if (f._after && pj) { msg.hidden = false; msg.className = "note"; await f._after(pj, msg); }
        f.querySelectorAll("input:not([type=hidden]),textarea,select").forEach(el => el.disabled = true);
        if (f._done) f._done();
        // A request: a small card with its number and what happens next, in place of the form (SURESH 23 Nov 2026).
        if (f.getAttribute("name") === "opportunity") { requestDone(f, pj, msg.dataset.warn); return; }
        msg.textContent = msg.dataset.warn || f.dataset.done; msg.className = msg.dataset.warn ? "note error" : "toast";
        // A new request gets its own endorse page: the person shares it so people who know the project can vouch.
        if (pj && pj.endorse) {
          const to = `/e/${encodeURIComponent(pj.endorse)}?new=1`;
          msg.insertAdjacentHTML("beforeend", ` <a href="${to}"><b>Next: ask 3 people to vouch for it →</b></a>`);
          if (!msg.dataset.warn) setTimeout(() => { location.href = to; }, 2500);
        }
        if (f.hasAttribute("data-comment")) {
          const art = document.createElement("article");
          const nm = String(fd.get("name") || "Anonymous");
          art.className = "comment";
          art.innerHTML = `<div class="who"><span class="avatar">${esc(nm.trim().charAt(0).toUpperCase() || "?")}</span><strong>${esc(nm)}</strong><span class="meta">Just now</span></div><p>${esc(fd.get("comment"))}</p>`;
          f.parentNode.insertBefore(art, f);
          const empty = f.parentNode.querySelector(":scope > p.note"); if (empty) empty.remove();
        }
      } catch (err) {
        btn.disabled = false;
        msg.textContent = "That didn't go through. Check your connection and try again."; msg.className = "note error";
      }
      msg.hidden = false;
    }));
  }

  // Home page totals: a white icon on a tile shaded in the logo's colors.
  const icon = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    // heart holding people: projects that help people
    projects: icon('<path class="fill" d="M12 21s-8-4.9-8-10.9A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8 2.9C20 16.1 12 21 12 21z"/><circle cx="9.3" cy="11" r="1.5"/><circle cx="14.7" cy="11" r="1.5"/><path d="M7.2 15.6c.5-1.4 1.2-2.1 2.1-2.1s1.6.7 2.1 2.1M12.6 15.6c.5-1.4 1.2-2.1 2.1-2.1s1.6.7 2.1 2.1"/>'),
    // spark burst: work happening now
    active: icon('<circle class="fill" cx="12" cy="12" r="5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><path d="M10.2 12.2l1.3 1.3 2.4-2.8"/>'),
    // megaphone: news shared
    updates: icon('<path class="fill" d="M3.5 10v4a1 1 0 0 0 1 1H7l6.5 4.5v-15L7 9H4.5a1 1 0 0 0-1 1z"/><path d="M17 9.2a3.8 3.8 0 0 1 0 5.6M19.4 6.6a7.3 7.3 0 0 1 0 10.8"/><path d="M7.5 15l1.2 4.5h2.2L10 15.8"/>'),
    // star: extra numbers added in the admin page
    extra: icon('<path class="fill" d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9z"/>')
  };

  // Home headline: first letter always uppercase, set in the logo's script style.
  const headline = t => {
    const str = String(t || "").trim();
    if (!str) return "";
    const first = [...str][0];
    const rest = esc(str.slice(first.length)).replace(/\s+[-–—]\s+(.*)$/, ' <span class="dash">–</span> <span class="hl2">$1</span>');
    return `<span class="initial">${esc(first.toUpperCase())}</span>${rest}`;
  };

  // Keep the home headline on one line: shrink it until it fits the screen.
  function fitHeadline() {
    const h = document.querySelector(".headline");
    if (!h) return;
    h.style.fontSize = "";
    let size = parseFloat(getComputedStyle(h).fontSize);
    while (h.scrollWidth > h.clientWidth + 1 && size > 16) { size -= 1; h.style.fontSize = size + "px"; }
  }
  let fitTimer;
  window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitHeadline, 120); });
  if (document.fonts) document.fonts.ready.then(fitHeadline);

  function card(p, i, extra = "") {
    return `
      <a class="card${p.sample ? " sample-card" : ""}" href="${p.sample ? "/sample" : `/projects/${slugOf(p)}`}">
        <div class="cover" style="${coverStyle(p, i)}">${coverHTML(p, i, p.location)}</div>
        <div class="body">
          ${p.theme ? `<span class="tag">${esc(p.theme)}</span>` : ""}
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.summary)}</p>
          ${extra || `<div class="meta"><span>${esc(p.organization)}</span>${p.status ? `<span>· ${esc(p.status)}</span>` : ""}</div>`}
        </div>
      </a>`;
  }

  const isActive = p => /active/i.test(p.status || "");
  const STAGES = {
    initiated: { label: "Initiated", key: "projects", title: "Initiated projects", intro: "Every project we have started, grouped by what it works on." },
    activated: { label: "Activated", key: "active", title: "Activated projects", intro: "Projects that are running right now." },
    impact: { label: "Impact", key: "updates", title: "Impact", intro: "News and results from our projects, newest first." }
  };

  // Home: headline, intro, then the three stage circles. Each circle opens its own page.
  // Home (/home): a search page like Google's front page. Title, slogan, one long search box,
  // city and category buttons, then every project in tabs by stage.
  const CITIES = ["Kilinochchi", "Batticaloa", "Jaffna", "Kandy"];
  // A project not visited yet can say how it was checked instead, e.g. "Checked and approved by Raavanaa" (projects.json "verified_label", SURESH 20 Nov 2026).
  const vLabel = p => (p && p.verified_label) || "Visited and verified";
  const CATEGORIES = ["Livelihood", "Education", "Trips & Events"];
  const cityOf = p => p.city || CITIES.find(c => new RegExp(c, "i").test(p.location || "")) || "";
  // Search page: one picture per stage, taking turns. The stage's slogan and sentence sit on the
  // left, in the middle of the sky; the stage name and its count sit in the coloured band.
  // Tapping a tab below shows that stage and stops the turning; tapping the picture opens its tab.
  // A stage banner built in layers (sky, drawing, ground), so the drawing can shrink to fit
  // a phone instead of being cut off.
  const stageLayersHTML = (slug, lazy) => `<img class="sl-art" src="/img/stage-art-${slug}.svg" alt="" width="356" height="130"${lazy ? ' loading="lazy"' : ""}><img class="sl-ground" src="/img/stage-ground-${slug}.svg" alt="" width="400" height="22">`;
  function stageShowHTML(projects) {
    const count = n => projects.filter(p => stageNum(p) === n).length;
    const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const stories = projects.reduce((t, p) => t + (stageNum(p) === 3 ? (p.updates || []).length : 0), 0);
    const SUB = [
      count(1) ? `${plural(count(1), "project")} getting ready to activate` : "New projects coming soon",
      count(2) ? `${plural(count(2), "project")} in action` : "First projects starting soon",
      stories ? `${stories === 1 ? "1 story" : stories + " stories"} of impact · ${plural(count(3), "project")}` : "First stories coming soon"
    ];
    const slides = ["initiated", "activated", "impact"].map((slug, k) => {
      const cfg = STAGE_PAGES[slug];
      return `<figure class="ss-slide s${k + 1}${k ? "" : " on"}" data-n="${k + 1}" aria-hidden="${k ? "true" : "false"}">
          ${stageLayersHTML(slug, k > 0)}
          <figcaption class="ss-cap"><b class="ss-say">${STAGE_SAY[k]}</b><span class="ss-lead">${cfg.lead}</span></figcaption>
          <div class="ss-band"><span class="ss-name">${cfg.title}</span><span class="ss-sub">${SUB[k]}</span></div>
        </figure>`;
    }).join("");
    return `<section class="stage-show" aria-roledescription="carousel" aria-label="Our three stages">
        <div class="ss-track" role="button" tabindex="0" aria-label="Show the projects at this stage">${slides}</div>
        <div class="ss-dots" role="group" aria-label="Choose a stage">${["Initiated", "Activated", "Impact"].map((t, k) =>
          `<button type="button" class="s${k + 1}" aria-label="${t}" aria-current="${k === 0}"><i></i></button>`).join("")}</div>
      </section>`;
  }
  function startStageShow(root, onOpen) {
    const box = root.querySelector(".stage-show"); if (!box) return null;
    const slides = [...box.querySelectorAll(".ss-slide")], dots = [...box.querySelectorAll(".ss-dots button")], track = box.querySelector(".ss-track");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cur = 0, locked = false;
    // The bar filling the active dot is the clock: when it is full, the next stage shows.
    // Pausing the bar (pointer over the picture, finger on it) pauses the turning too.
    const show = i => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, j) => { s.classList.toggle("on", j === cur); s.setAttribute("aria-hidden", String(j !== cur)); });
      dots.forEach((d, j) => d.setAttribute("aria-current", String(j === cur)));
      box.classList.remove("ticking"); void box.offsetWidth; if (!locked && !reduce) box.classList.add("ticking");
    };
    box.addEventListener("animationend", e => { if (e.animationName === "ss-fill" && !locked) show(cur + 1); });
    const hold = v => box.classList.toggle("paused", v);
    dots.forEach((d, j) => d.addEventListener("click", () => show(j)));
    box.addEventListener("mouseenter", () => hold(true)); box.addEventListener("mouseleave", () => hold(false));
    let x0 = null;
    track.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; hold(true); }, { passive: true });
    track.addEventListener("touchend", e => { const dx = x0 === null ? 0 : e.changedTouches[0].clientX - x0; x0 = null; hold(false); if (Math.abs(dx) > 40) { e.preventDefault(); show(cur + (dx < 0 ? 1 : -1)); } });
    const open = () => onOpen && onOpen(cur + 1);
    track.addEventListener("click", open);
    track.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } if (e.key === "ArrowRight") show(cur + 1); if (e.key === "ArrowLeft") show(cur - 1); });
    show(0);
    // Called when a tab is chosen: show that stage and stay there.
    return n => { locked = true; show(n - 1); };
  }

  function renderHome(app, site, projects) {
    const TABS = [["Initiated", 1], ["Activated", 2], ["Impact", 3]];
    const st = { q: "", city: "All", tab: 1 };
    // Cities come from the projects themselves, so a new city appears here as soon as it has a project.
    const cities = [...new Set(projects.map(cityOf).filter(Boolean))].sort();
    app.innerHTML = `
      <section class="finder">
        <h1 class="arc-title">${arcTitleHTML()}</h1>
        <p class="finder-slogan">A day of joy for every child</p>
        <form class="finder-search" role="search" action="#" onsubmit="return false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>
          <input id="find-q" type="search" placeholder="Search projects, places or ideas" aria-label="Search projects" autocomplete="off">
          <label class="finder-city"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>
            <select id="find-city" aria-label="City"><option value="All">All</option>${cities.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select></label>
        </form>
      </section>
      ${stageShowHTML(projects)}
      <section class="finder-results">
        <div class="finder-tabs" role="tablist" aria-label="Projects by stage"></div>
        <div id="find-list" role="tabpanel"></div>
      </section>`;
    // A one-line footer, only on this page, in the same green as the site footer.
    const foot = document.querySelector("footer.foot");
    if (foot) {
      foot.classList.add("foot-slim");
      foot.innerHTML = `
        <svg class="foot-wave" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true"><path class="w1" d="M0 16C70 2 140 4 200 12 260 20 330 4 400 10V30H0Z"/><path class="w2" d="M0 24C80 10 150 12 210 18 270 24 336 12 400 16V30H0Z"/></svg>
        <div class="foot-bar"><div class="wrap">
          <span>© ${new Date().getFullYear()} Raavanaa Community</span>
          <span class="foot-links"><a href="/about">About us</a><a href="/contact">Contact</a><a href="/report">Report a concern</a><a href="/privacy">Privacy &amp; child safety</a><a href="/admin">Team login</a></span>
        </div></div>`;
    }
    const match = p => {
      if (st.city !== "All" && cityOf(p) !== st.city) return false;
      if (!st.q) return true;
      const hay = [p.title, p.summary, p.story, p.body, p.theme, p.location, cityOf(p), p.organization].filter(Boolean).join(" ").toLowerCase();
      return st.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
    };
    const tabsBox = app.querySelector(".finder-tabs"), listBox = app.querySelector("#find-list");
    const draw = (auto) => {
      const found = projects.filter(match);
      // After a search or a city change, open the first stage that has results.
      if (auto && !found.some(p => stageNum(p) === st.tab)) { const first = TABS.find(([, n]) => found.some(p => stageNum(p) === n)); if (first) st.tab = first[1]; }
      tabsBox.innerHTML = TABS.map(([name, n]) => { const c = found.filter(p => stageNum(p) === n).length;
        return `<button type="button" role="tab" class="ftab s${n}" data-n="${n}" aria-selected="${st.tab === n}">${name} <span>${c}</span></button>`; }).join("");
      const list = found.filter(p => stageNum(p) === st.tab), stageName = TABS[st.tab - 1][0].toLowerCase();
      const filtered = st.q || st.city !== "All";
      listBox.innerHTML = list.length ? `<div class="plist" role="list">${projectRowsHTML(list, projects)}</div>`
        : `<div class="panel empty-state finder-empty"><p>${filtered ? `No ${found.length ? stageName + " " : ""}projects match your search${st.city !== "All" ? ` in ${esc(st.city)}` : ""}.`
            : st.tab === 2 ? "No project is activated yet. See how one will look." : st.tab === 3 ? "The first impact stories are coming soon." : "No projects yet."}</p>
            ${!filtered && st.tab === 2 ? `<a class="btn" href="/sample">See an example project</a>` : ""}</div>`;
    };
    app.querySelector("#find-q").addEventListener("input", e => { st.q = e.target.value.trim(); draw(true); });
    const citySel = app.querySelector("#find-city");
    citySel.addEventListener("change", () => { st.city = citySel.value; citySel.closest(".finder-city").classList.toggle("on", st.city !== "All"); draw(true); });
    tabsBox.addEventListener("click", e => { const b = e.target.closest(".ftab"); if (!b) return; st.tab = Number(b.dataset.n); draw(); if (pick) pick(st.tab); });
    draw();
    rotTimers.forEach(clearInterval); rotTimers = [];
    // Tapping the picture opens that stage's tab and brings the list into view.
    const pick = startStageShow(app, n => { st.tab = n; draw(); pick(n); const r = tabsBox.getBoundingClientRect(); if (r.top > innerHeight * .6 || r.top < 0) tabsBox.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }

  // The earlier home page, kept at /overview: stage circles with numbers, latest projects and the sign-up box.
  // Home: one row per stage, each with its own title.
  const HOME_ROWS = [
    { n: 1, title: "Smiles in the Making", href: "/initiated", empty: "New ideas for a day of joy are on their way." },
    { n: 2, title: "Moments on the Way", href: "/activated", empty: "Projects arrive here once they are fully funded and the day is being planned." },
    { n: 3, title: "Days of Joy, Created", href: "/impact", show: 1, empty: "After each day happens, its smiles, pictures and story will be shared here." },
  ];
  // Each row shows the newest few; Impact keeps just one here and the rest live on the Impact page.
  const rowShow = r => r.show || 3;
  // Home lists: one row per project, picture on the left, words on the right.
  const homeListHTML = (list, projects) => `<div class="hlist" role="list">${list.map(p => {
      const i = projects.indexOf(p), meta = [cityOf(p) || (p.location || "").split(",")[0], p.theme].filter(Boolean).join(" · ");
      return `<a class="hrow" role="listitem" href="/projects/${slugOf(p)}">
        <span class="hrow-pic" style="${coverStyle(p, i)}">${p.cover ? `<img src="${esc(imgUrl(p.cover, 320))}" alt="" loading="lazy">` : ""}</span>
        <span class="hrow-text">${meta ? `<small>${esc(meta)}</small>` : ""}<b>${esc(p.title)}</b>${p.summary ? `<span class="hrow-sum">${esc(p.summary)}</span>` : ""}</span>
        <span class="hrow-go" aria-hidden="true">→</span>
      </a>`; }).join("")}</div>`;
  function homeRowHTML(r, projects) {
    const all = projects.filter(p => stageNum(p) === r.n), k = HOME_ROWS.indexOf(r);
    return `<section class="home-latest s${r.n}" data-row="${k}">
        <h2 class="section-title latest-title">${r.title}</h2>
        ${all.length ? `<div class="latest-filters" role="group" aria-label="Show projects by category">
          ${["All", "Trips & Events", "Livelihood", "Education"].map(t => `<button type="button" class="chip" data-cat="${esc(t)}" aria-pressed="${t === "All"}">${esc(t)}</button>`).join("")}
        </div>
        <div class="grid">${homeListHTML(all.slice(0, rowShow(r)), projects)}</div>
        <p class="more"><a href="${r.href}">See all →</a></p>`
        : `<p class="latest-soon">${r.empty}</p>`}
      </section>`;
  }

  // Home top, like GlobalGiving: one big picture, then four smaller ones, each with its
  // place and title written on the photo. Tapping a picture opens that project's page.
  const isPhoto = u => !!u && !/\.svg$/i.test(u);
  const STAGE_LABEL = ["Initiated", "Activated", "Impact"];
  // "Explore projects" choices under the pictures; tapping one swaps the pictures above.
  const EXPLORE = [
    ["All", ps => [...ps].sort((x, y) => (!!y.featured - !!x.featured) || (isPhoto(y.cover) - isPhoto(x.cover)))],
    ["Initiated", ps => ps.filter(p => stageNum(p) === 1)],
    ["Activated", ps => ps.filter(p => stageNum(p) === 2)],
    ["Impact", ps => ps.filter(p => stageNum(p) === 3)],
    ...["Trips & Events", "Education", "Livelihood"].map(t => [t, ps => ps.filter(p => p.theme === t)])
  ];
  const CATS = ["All", "Trips & Events", "Livelihood", "Education"];
  const STAGE_SAY = ["Smiles in the Making", "Moments on the Way", "Days of Joy, Created"];
  // "Create a Smile": a round, tappable icon with three little pictures taking turns,
  // a title above and a line below. It opens Spark a Smile (/spark, 16 Nov 2026), which leads on to the form.
  // Five slogans take turns on the Home page (SURESH, 12 Nov 2026); the kept home page (/front-4) stays on the first three.
  const CREATE = [
    // SURESH 15 Nov 2026: not only children. A moment can be for anyone: a mum, an elder, a family, a whole village.
    { img: "/img/create-smile.svg", title: "Create a Smile", say: "One small idea can light up someone's whole day." },
    { img: "/img/create-moment.svg", title: "Create a Moment", say: "For a child, a mum, an elder or a whole village. Tell us who." },
    { img: "/img/create-day.svg", title: "Spark a Smile", say: "A trip, a celebration, a good meal, a helping hand. Start it here." },
    { img: "/img/create-smile.svg", title: "Spark a Day of Joy", say: "Know a family, a school or a neighbour who could use a lift? Tell us." },
    { img: "/img/create-moment.svg", title: "Start a Smile", say: "You dream it. Together we make it real." }
  ];
  // Home: "Gift a Moment, in their name" (title and design, SURESH 10 Nov 2026). A cream banner with the
  // heart-and-lamp mark, the title, and four reasons to tap: each opens the moment page with that reason chosen.
  const TA_PATH = /^\/ta(\/|$)/.test(location.pathname);
  const MOMENT_TITLE = TA_PATH ? ["பரிசளியுங்கள்", "ஒரு தருணம்", "அவர்கள் பெயரில்"] : ["Gift a", "Moment", "in their name"];
  const MOMENT_REASONS = [
    { k: "memory", en: "In loving memory", ta: "அன்பு நினைவாக" },
    { k: "birthday", en: "A birthday", ta: "பிறந்தநாள்" },
    { k: "wedding", en: "A wedding day", ta: "திருமண நாள்" },
    { k: "festival", en: "A festival", ta: "பண்டிகை" },
    { k: "remembrance", en: "Remembrance day", ta: "நினைவு நாள்" }
  ].filter((r, i) => FEAT.reasons.length ? FEAT.reasons.includes(r.k) : i < 4);
  const momentTitleHTML = () => `<span class="mt-title${TA_PATH ? " ta" : ""}"><span>${MOMENT_TITLE[0]}</span> <b>${MOMENT_TITLE[1]}</b></span><span class="mt-ribbon">${MOMENT_TITLE[2]}</span>`;
  const momentBandHTML = () => `<section class="moment-band" aria-label="Gift a Moment, in their name">
      <i class="mb-sparks" aria-hidden="true"></i>
      <div class="mb-main">
        <a class="mb-head" href="/moment">
          <img class="mb-mark" src="/img/moment-mark.svg" alt="" width="96" height="96">
          ${momentTitleHTML()}
        </a>
        <p class="mb-say">${FEAT.reasons.length && FEAT.reasons.every(k => k === "memory" || k === "remembrance") ? "Remember someone you love with a child's happiest day." : "Turn a day that matters to you into a child's happiest day."}</p>
        <a class="mb-go" href="/moment${FEAT.reasons.length === 0 ? "" : "?for=" + FEAT.reasons[0]}">${FEAT.reasons[0] === "memory" ? "Give in loving memory" : "Gift a moment"} →</a>
      </div>
      <div class="mb-reasons">
        <p class="mb-tap">Tap your moment</p>
        ${MOMENT_REASONS.map(r => `<a href="/moment?for=${r.k}"><span class="mb-pic"><img src="/img/moment/${r.k}.jpg" alt="" width="200" height="200" loading="lazy"></span><span>${TA_PATH ? r.ta : r.en}</span></a>`).join("")}
      </div>
    </section>`;
  // On phones the menu is folded away, so the Home page also carries a slim strip at the very top.
  const momentRibbonHTML = () => `<a class="moment-ribbon" href="/moment"><img src="/img/moment-mark.svg" alt="" width="34" height="34"><span><b>Gift a Moment</b> <em>in their name</em></span><i aria-hidden="true">→</i></a>`;
  // Gift a Moment as a small round icon that sits with the story pictures (Home, 14 Nov 2026).
  // Home's "All projects" icon (SURESH 26 Nov 2026), in the calm cream style of the Gift a Moment pill.
  const allChipHTML = n => `<a class="all-chip" href="${TA_PATH ? "/ta" : ""}/projects"><span class="all-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="4.6" rx="1.6"/><rect x="3.5" y="11" width="17" height="4.6" rx="1.6"/><path d="M4.5 19.5h15"/></svg></span><span class="all-txt"><b>All projects</b> <em>${n ? `${n} ${n === 1 ? "project" : "projects"} in every stage` : "every stage"}</em></span><i aria-hidden="true">→</i></a>`;
  const momentChipHTML = () => `<a class="moment-chip" href="/moment"><img src="/img/moment-mark.svg" alt="" width="40" height="40"><span><b>Gift a Moment</b> <em>in their name</em></span><i aria-hidden="true">→</i></a>`;
  const createHTML = (list = CREATE, o = {}) => `<a class="create-cta${o.cls ? " " + o.cls : ""}" href="${o.href || "/spark"}">
      <span class="cc-titles">${list.map((c, i) => `<b class="${i ? "" : "on"}">${c.title}</b>`).join("")}</span>
      <span class="cc-icon" aria-hidden="true"><i class="cc-ring"></i><i class="cc-orbit"><b>✦</b><b>♥</b><b>✦</b><b>♥</b></i>${list.map((c, i) => `<img class="${i ? "" : "on"}" src="${c.img}" alt="" width="200" height="200">`).join("")}<i class="cc-plus">${o.plus || "+"}</i></span>
      <span class="cc-says">${list.map((c, i) => `<span class="${i ? "" : "on"}">${c.say}</span>`).join("")}</span>
      <span class="cc-go">${o.go || "Start here"} →</span>
    </a>`;
  // Home, 15 Nov 2026 (SURESH): a round "Sponsor a Smile" icon in the same design as Create a Smile, under the
  // Gift a Moment section. While the sponsor switch is off (memory launch) it opens the moment page, in loving memory.
  const SPONSOR = [
    { img: "/img/create-smile.svg", title: "Sponsor a Smile", say: "Give children a day of joy, in the name of someone you love." },
    { img: "/img/create-day.svg", title: "Fund a Smile", say: "A trip, a game, a good meal. Every rupee is shown openly." },
    { img: "/img/create-moment.svg", title: "Be the Reason for a Smile", say: "Your gift becomes a child's happiest day." }
  ];
  const sponsorHTML = () => createHTML(SPONSOR, { cls: "sponsor-cta", href: FEAT.sponsor ? "/give" : "/moment?for=memory", plus: "♥", go: FEAT.sponsor ? "Sponsor a smile" : "Give in loving memory" });
  // Home, 16 Nov 2026 (SURESH): the "Spark a Smile" section in the same design as the Gift a Moment band: its own
  // heart mark and title, current projects taking turns (three in view, drawings only; a new project joins by
  // itself), and two clear ways to start, Request a project or Submit a project, as one person or a group.
  // Both open the Spark a Smile page (/spark) with that way chosen.
  // SURESH 17 Nov 2026: one way to start instead of Request / Submit, and a second card to join Raavanaa.
  const SPARK_WAYS = [
    { k: "request", href: "/initiate?way=need", t: "Submit a need", s: "Request a moment, share a plan, start a movement", go: "Start",
      ic: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10z"/><path d="M14 3.5v5h5"/><path d="M12 17v-6M9.3 13.6 12 11l2.7 2.6"/>' },
    { k: "submit", href: "/volunteers#join", t: "Join Raavanaa", s: "Volunteer, share a skill, create moments together", go: "Join",
      ic: '<circle cx="8" cy="8.5" r="2.6"/><circle cx="16.5" cy="9.5" r="2.2"/><path d="M3 19c0-3.2 2.2-5.2 5-5.2s5 2 5 5.2M14 14.3c.8-.4 1.6-.6 2.5-.6 2.5 0 4.5 1.8 4.5 5.3"/>' },
    // SURESH 20 Nov 2026: in place of Join Raavanaa, a card to see the projects; its title turns View projects / moments / smiles.
    { k: "view", cls: "submit", href: "/projects", t: "View projects", turn: ["View projects", "View moments", "View smiles"], s: "Days of joy waiting for you", go: "View",
      ic: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>' }
  ];
  // Five titles and lines that take turns (SURESH, 16 Nov 2026: "make it impressive, say things profound: creating a
  // moment, be part of creating impact"). [small words, big word, ribbon, the line under it]
  const SPARK_SAYS = [
    ["Spark a", "Smile", "start a project", "Every great change began as one small kindness. <b>Yours can be next.</b>"],
    ["Create a", "Moment", "they will never forget", "A day of joy ends by evening. <b>Its memory lasts a lifetime.</b>"],
    ["Be part of", "Impact", "start where you stand", "You don't need to change the whole world. <b>Change one child's world, for one day.</b>"],
    ["Light a", "Spark", "see it become a flame", "One person who cares is all it takes. <b>Together, we carry it the rest of the way.</b>"],
    ["Make it", "Happen", "dream it, and we build it together", "Somewhere a child is waiting for a day like this. <b>You can be the reason it comes.</b>"]
  ];
  const sparkBandHTML = projects => {
    const isDrawn = u => /\.svg(\?|$)/i.test(u || "") || /^\/img\/(members-bridge|project-)/.test(u || "");
    const pics = projects.map((p, i) => ({ p, i, n: stageNum(p) })).sort((a, b) => a.n - b.n || b.i - a.i).slice(0, 9);
    return `<section class="spark-band" data-c="1" aria-label="Spark a Smile, start a project">
      <i class="mb-sparks" aria-hidden="true"></i>
      <a class="mb-head" href="/spark">
        <img class="mb-mark sb-mark" src="/img/spark-mark.svg" alt="" width="96" height="96">
        <span class="sb-rot" data-sb-rot>${SPARK_SAYS.map((x, i) => `<span class="sb-slide c${i % 5 + 1}${i ? "" : " on"}"${i ? ' aria-hidden="true"' : ""}><span class="mt-title sb-title"><span>${x[0]}</span> <b>${x[1]}</b></span><span class="mt-ribbon sb-ribbon">${x[2]}</span></span>`).join("")}</span>
      </a>
      ${pics.length ? `<div class="sb-stack" data-sb-stack>${pics.map(({ p, n }, j) => `<a class="sb-frame s${n} ${j < 3 ? "p" + j : "off"}" href="/projects/${slugOf(p)}" data-t="${esc(p.title)}"${j ? ' tabindex="-1" aria-hidden="true"' : ""}><img src="${esc(isDrawn(p.cover) ? p.cover : "/img/project-hills.svg")}" alt="" width="300" height="225"${j > 2 ? ' loading="lazy"' : ""}><span>${STAGE_LABEL[n - 1]}</span></a>`).join("")}</div>
      <p class="sb-cap" data-sb-cap>${esc(pics[0].p.title)}</p>` : ""}
      <p class="mb-say sb-says" data-sb-says>${SPARK_SAYS.map((x, i) => `<span class="c${i % 5 + 1}${i ? "" : " on"}">${x[3]}</span>`).join("")}</p>
      <p class="sb-anyone">${FEAT.group ? "Anyone can start a project: one person or a whole group." : "Anyone can start one. Share it, and follow every step when you sign in."}</p>
      <div class="sb-ways">${SPARK_WAYS.filter(w => w.k === "request" || (FEAT.join ? w.k === "submit" : w.k === "view")).map(w => `<a class="sb-way ${w.cls || w.k}" href="${w.href}"><span class="sb-ic"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${w.ic}</svg></span><b${w.turn ? ` data-sb-turn="${esc(w.turn.join("|"))}" aria-live="off"` : ""}>${w.t}</b><small>${w.s}</small><span class="sb-start">${w.go} →</span></a>`).join("")}</div>
    </section>`;
  };
  function startSparkBand(app) {
    // the View projects card: its title turns through its words
    app.querySelectorAll("[data-sb-turn]").forEach(b => { const w = b.dataset.sbTurn.split("|"); let i = 0;
      if (w.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) rotTimers.push(setInterval(() => { if (document.hidden) return; i = (i + 1) % w.length; b.textContent = w[i]; }, 9000)); });
    // the titles and their lines take turns together
    // SURESH 21 Nov 2026: slower, and the line under the pictures types itself out letter by letter (no blinking).
    const rot = app.querySelector("[data-sb-rot]"), says = app.querySelector("[data-sb-says]");
    if (rot && says && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const ts = [...rot.children], ss = [...says.children]; let t = 0;
      ss.forEach(typeReady); typeOut(ss[0]);
      rotTimers.push(setInterval(() => {
        if (document.hidden) return;
        t = (t + 1) % ts.length;
        ts.forEach((el, i) => { el.classList.toggle("on", i === t); el.setAttribute("aria-hidden", i === t ? "false" : "true"); });
        ss.forEach((el, i) => el.classList.toggle("on", i === t));
        typeOut(ss[t]);
        const band = rot.closest(".spark-band"); if (band) band.dataset.c = t % 5 + 1;
      }, 14000));
    }
    const box = app.querySelector("[data-sb-stack]"); if (!box) return;
    const frames = [...box.children], cap = app.querySelector("[data-sb-cap]"), n = frames.length;
    if (n < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let k = 0;
    rotTimers.push(setInterval(() => {
      if (document.hidden) return;
      k = (k + 1) % n;
      frames.forEach((f, i) => { const pos = (i - k + n) % n; f.classList.remove("p0", "p1", "p2", "off"); f.classList.add(pos < 3 ? "p" + pos : "off"); f.tabIndex = pos ? -1 : 0; f.setAttribute("aria-hidden", pos ? "true" : "false"); });
      if (cap) cap.textContent = frames[k].dataset.t || "";
    }, 7000));
  }
  // Typing effect (SURESH 21 Nov 2026): every letter of a line gets its own span (keeping <b> parts), so the line
  // keeps its size and the letters simply appear one after another, slowly. No cursor, nothing blinks.
  function typeReady(el) {
    if (el.dataset.typed) return; el.dataset.typed = "1"; let n = 0;
    const walk = node => [...node.childNodes].forEach(c => {
      if (c.nodeType === 3) { const frag = document.createDocumentFragment();
        [...c.textContent].forEach(ch => { const s = document.createElement("span"); s.className = "tch"; s.style.setProperty("--i", n++); s.textContent = ch; frag.append(s); });
        c.replaceWith(frag); }
      else if (c.nodeType === 1) walk(c); });
    walk(el); el.style.setProperty("--n", n);
  }
  function typeOut(el) { if (!el) return; el.classList.remove("typing"); void el.offsetWidth; el.classList.add("typing"); }
  // Under the stage circles: one slogan in the middle, and a fine curved line from it up to
  // its stage. The line glides from stage to stage on its own; tapping a circle keeps it there.
  const STAGE_COLOR = ["#1f7a47", "#d08e0c", "#c8381e"];
  function startRail(app) {
    const rail = app.querySelector(".stage-rail"), nav = app.querySelector(".stages");
    if (!nav) return; // the 14 Nov Home has no slogan line, but its circles still light up in turn
    const circles = [...nav.querySelectorAll(".stage")], says = rail ? [...rail.querySelectorAll(".rail-say span")] : [];
    const paths = [...nav.querySelectorAll(".stage-path")];
    let k = 0, locked = false;
    // Moving forward a stage, a glowing spark runs along the little arrow, then the next stage lights up.
    const flow = (from, to) => {
      const arrow = to === from + 1 ? paths[from] : null;
      const anim = arrow && arrow.querySelector("animateMotion");
      if (anim && anim.beginElement) { arrow.classList.add("run"); anim.beginElement(); setTimeout(() => arrow.classList.remove("run"), 900); return 700; }
      return 0;
    };
    const show = i => {
      k = i;
      says.forEach((sp, j) => sp.classList.toggle("on", j === i));
      circles.forEach((c, j) => { c.classList.toggle("lit", j === i); if (j === i) { c.classList.remove("arrive"); void c.offsetWidth; c.classList.add("arrive"); } });
    };
    const go = i => { if (i === k) return show(i); const wait = flow(k, i); wait ? setTimeout(() => show(i), wait) : show(i); };
    show(0);
    nav.addEventListener("click", e => { const c = e.target.closest(".stage"); if (!c) return; locked = true; go(circles.indexOf(c)); });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      rotTimers.push(setInterval(() => { if (!locked && !document.hidden) go((k + 1) % circles.length); }, 3600));
    // For the Home page's folder tabs: light this stage and stay on it.
    return i => { locked = true; go(i); };
  }
  function startCreate(app) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // each round icon turns through its own pictures, a beat apart
    app.querySelectorAll(".create-cta").forEach((box, n) => {
      const count = box.querySelectorAll(".cc-icon img").length; if (count < 2) return;
      let k = 0;
      const turn = () => {
        if (document.hidden) return;
        k = (k + 1) % count;
        box.querySelectorAll(".cc-titles b, .cc-icon img, .cc-says span").forEach(el => el.classList.toggle("on", [...el.parentNode.children].filter(x => x.tagName === el.tagName).indexOf(el) === k));
      };
      setTimeout(() => rotTimers.push(setInterval(turn, 3200)), n * 1600);
    });
  }
  function mosaicTiles(list, projects, max = 3) {
    const pick = list.slice(0, max);
    if (!pick.length) return `<p class="mosaic-empty">No projects in this group yet. <a href="/initiate">Start the first one →</a></p>`;
    const odd = (pick.length - 1) % 2 === 1; // a lone last picture fills the row
    const tile = (p, k) => {
      const n = stageNum(p), town = p.city || (p.location || "").split(",")[0];
      const wide = k === 0 || (odd && k === pick.length - 1);
      return `<a class="mosaic-tile s${n}${k === 0 ? " big" : wide ? " wide" : ""}" href="/projects/${slugOf(p)}" style="${coverStyle(p, projects.indexOf(p))}">
          ${p.cover ? `<img src="${esc(imgUrl(p.cover, wide ? 1400 : 800))}" alt=""${k ? ' loading="lazy"' : ""}>` : ""}
          <span class="mosaic-text">
            <span class="mosaic-eyebrow"><i>${STAGE_LABEL[n - 1]}</i>${town ? ` ${esc(town)}` : ""}</span>
            <span class="mosaic-title">${esc(p.title)}</span>
          </span>
        </a>`;
    };
    return pick.map(tile).join("");
  }
  // Home's three top pictures (SURESH, 17 Nov 2026): the big one is always an Initiated project, with a
  // turning call on it ("Make this happen", "Own it", ...); all three take turns through the listed projects.
  const MAKE_SAYS = ["Make this happen", "Own it", "Create the moment", "Be the smile", "Start it today"];
  // SURESH 21 Nov 2026: the top pictures show Initiated projects only (the days still waiting to happen).
  // SURESH 24 Nov 2026: a project marked "main_story": true stays as the big picture and never swaps;
  // only the two smaller pictures take turns.
  const homeDeck = (shown, k) => {
    const main = shown.find(p => p.main_story);
    if (main) {
      const others = shown.filter(p => p !== main && stageNum(p) === 1), pool = others.length ? others : shown.filter(p => p !== main);
      return [main, ...(pool.length ? [0, 1].map(j => pool[(k * 2 + j) % pool.length]).filter((p, j, a) => a.indexOf(p) === j) : [])];
    }
    const init = shown.filter(p => stageNum(p) === 1);
    if (init.length) return [0, 1, 2].map(j => init[(k + j) % init.length]).filter((p, j, a) => a.indexOf(p) === j);
    const big = null;
    const rest = shown.filter(p => p !== big);
    const two = rest.length ? [0, 1].map(j => rest[(k * 2 + j) % rest.length]).filter((p, j, a) => a.indexOf(p) === j) : [];
    return big ? [big, ...two] : two;
  };
  function glanceHTML(projects) {
    const shown = projects.filter(p => !p.hidden);
    if (!shown.length) return "";
    const first = homeDeck(shown, 0);
    return `<div class="mosaic n${Math.min(first.length, 3)}" data-deck aria-live="polite">${mosaicTiles(first, projects)}</div>`;
  }
  // Every 6 s the pictures move on to the next projects; the call on the big picture turns every 2.8 s.
  // Stops when someone picks a stage or a category, and pauses while a finger or mouse is on the pictures.
  function startDeck(app, projects) {
    const mo = app.querySelector(".mosaic[data-deck]"); if (!mo) return;
    const shown = projects.filter(p => !p.hidden), calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 0, w = 0, hold = false;
    const say = () => { const big = mo.querySelector(".mosaic-tile.big.s1"); if (!big) return;
      let c = big.querySelector(".mosaic-call");
      if (!c) { c = document.createElement("span"); c.className = "mosaic-call"; big.append(c); }
      c.innerHTML = `<b>${MAKE_SAYS[w % MAKE_SAYS.length]}</b> <i aria-hidden="true">→</i>`; c.classList.remove("in"); void c.offsetWidth; c.classList.add("in"); };
    say();
    if (calm) return;
    mo.addEventListener("pointerenter", () => hold = true); mo.addEventListener("pointerleave", () => hold = false);
    rotTimers.push(setInterval(() => { if (document.hidden || !mo.hasAttribute("data-deck")) return; w++; say(); }, 9000));
    if (shown.length < 2) return;
    rotTimers.push(setInterval(() => {
      if (document.hidden || hold || !mo.hasAttribute("data-deck")) return;
      k++; const list = homeDeck(shown, k);
      mo.classList.add("turning");
      setTimeout(() => { mo.className = `mosaic n${Math.min(list.length, 3)}`; mo.innerHTML = mosaicTiles(list, projects); say(); }, 700);
    }, 10000));
  }
  function wireExplore(app, projects) {
    const box = app.querySelector(".explore-tabs"), mo = app.querySelector(".mosaic"), circles = app.querySelector(".stages");
    if (!mo) return;
    const shown = projects.filter(p => !p.hidden);
    const show = name => {
      const e = EXPLORE.find(([t]) => t === name); if (!e) return;
      if (box) box.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x.dataset.ex === name));
      if (circles) { circles.querySelectorAll(".stage").forEach(c => c.classList.toggle("on", c.dataset.ex === name));
        circles.classList.toggle("picking", [...circles.querySelectorAll(".stage")].some(c => c.dataset.ex === name)); }
      const list = e[1](shown);
      mo.removeAttribute("data-deck");
      mo.className = `mosaic n${Math.min(list.length, 3)}`;
      mo.innerHTML = mosaicTiles(list, projects);
    };
    if (box) box.addEventListener("click", e => { const b = e.target.closest("button"); if (b) show(b.dataset.ex); });
    // The three stage circles at the top switch the pictures too, instead of opening a new page.
    if (circles) circles.addEventListener("click", e => { const c = e.target.closest(".stage"); if (!c) return; e.preventDefault(); show(c.dataset.ex); });
  }

  // The home page as it was until 12 Nov 2026, kept at /front-4 (SURESH: "keep the current page as another main backup").
  function renderOverviewClassic(app, site, projects) {
    const counts = {
      initiated: projects.filter(p => stageNum(p) === 1).length,
      activated: projects.filter(p => stageNum(p) === 2).length,
      impact: projects.filter(p => stageNum(p) === 3).length
    };
    const extras = (site.highlights || []).filter(h => h && h.value);
    const latest = projects.slice(0, 3); // newest first, as ordered in the admin page
    const slides = (site.sayings || []).map(x => typeof x === "string" ? { text: x } : x).filter(x => x && x.text);
    const start = slides.length ? Math.floor(Math.random() * slides.length) : 0; // a different slide comes first on each visit
    const follow = (site.follow || []).filter(x => x && x.title && x.text);
    const fstart = follow.length ? Math.floor(Math.random() * follow.length) : 0;
    // The 14 Nov 2026 Home (SURESH): no Gift a Moment strip on top, a bolder headline that turns through
    // the sayings, softer stage circles, no slogan under them, and Gift a Moment as a small icon beside the stories.
    // /front-4 (no data-light) keeps the page exactly as it was.
    const light = document.body.hasAttribute("data-light");
    app.innerHTML = `
      ${light || !FEAT.moment ? "" : momentRibbonHTML()}
      ${light ? "" : `<section class="intro">
        <h1 class="headline">${headline((slides[start] && slides[start].title) || site.tagline)}</h1>
      </section>`}
      <nav class="stages" aria-label="Show pictures by stage">
        ${Object.entries(STAGES).map(([slug, st], k) => `${k ? `<span class="stage-path p${k}" aria-hidden="true"><svg viewBox="0 0 60 34"><path class="sp-base" d="M6 17H50"/><path class="sp-chev c1" d="M12 9l8 8-8 8"/><path class="sp-chev c2" d="M26 9l8 8-8 8"/><path class="sp-chev c3" d="M40 9l8 8-8 8"/><circle class="sp-spark" r="3.6" cx="0" cy="0"><animateMotion dur="0.75s" begin="indefinite" fill="freeze" path="M6 17H54" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.55 1"/></circle></svg></span>` : ""}
          <a class="stage art stat-${st.key}" href="/${slug}" data-ex="${st.label}">
            <i>${ICONS[st.key]}</i>
            <b${counts[slug] ? "" : ' class="zero"'}>${counts[slug] || "Soon"}</b>
            <span>${st.label}</span>
          </a>`).join("")}
      </nav>
      ${light ? `<section class="intro">
        <h1 class="headline">${headline((slides[start] && slides[start].title) || site.tagline)}</h1>
      </section>` : ""}
      ${/* SURESH 26 Nov 2026: a round icon on Home that opens the page with every project (/projects) */ ""}${light ? allChipHTML(projects.length) : ""}
      ${light ? "" : `<div class="stage-rail" aria-live="polite">
        <p class="rail-say">${STAGE_SAY.map((t, i) => `<span class="s${i + 1}${i ? "" : " on"}">${t}</span>`).join("")}</p>
      </div>`}
      ${glanceHTML(projects)}
      ${light && FEAT.vetting ? sparkBandHTML(projects) : createHTML(light ? CREATE : CREATE.slice(0, 3))}
      ${light && FEAT.sponsor ? sponsorHTML() : ""}
      ${HOME_ROWS.map(r => homeRowHTML(r, projects)).join("")}
      ${/* Gift a Moment after the three stage sections (SURESH, 20 Nov 2026) */ ""}${FEAT.moment ? momentBandHTML() : ""}
      ${extras.length ? `<div class="stage-extras">${extras.map(h => `<div><b>${esc(h.value)}</b> ${esc(h.label)}</div>`).join("")}</div>` : ""}
      <section class="signup-band" id="keep-posted">${follow.length ? followHTML(site, follow, fstart) : signupHTML("home")}</section>`;
    app.querySelectorAll(".home-latest").forEach(sec => {
      const lf = sec.querySelector(".latest-filters"), lg = sec.querySelector(".grid"), r = HOME_ROWS[+sec.dataset.row];
      if (lf) lf.addEventListener("click", e => {
        const b = e.target.closest(".chip"); if (!b) return;
        lf.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x === b));
        const cat = b.dataset.cat, all = projects.filter(p => stageNum(p) === r.n),
          list = (cat === "All" ? all : all.filter(p => (p.theme || "") === cat)).slice(0, rowShow(r));
        lg.innerHTML = list.length ? homeListHTML(list, projects)
          : `<div class="panel empty-state latest-empty"><p>No ${esc(cat)} projects here yet.</p>${r.n === 1 ? '<a class="btn" href="/initiate">Suggest one</a>' : ""}</div>`;
      });
    });
    wireExplore(app, projects);
    wireForms(app);
    fitHeadline();
    rotTimers.forEach(clearInterval); rotTimers = [];
    startDeck(app, projects);
    startSayings(app);
    startFollow(app);
    startCreate(app);
    startSparkBand(app);
    if (!light) startRail(app); // SURESH 21 Nov 2026: the Home stage circles stay still, no blinking
    if (light) startHeadlines(app, slides.map(x => x.title).filter(Boolean), start);
    // arriving from the footer's "Keep me posted" button on another page
    if (location.hash === "#keep-posted") { const t = document.getElementById("keep-posted"); if (t) t.scrollIntoView(); }
  }

  // Home (/overview), the design of 12 Nov 2026 (SURESH). Three round icons whose words take turns
  // (Gift a Moment, Sponsor a Smile, Donate), the three stage circles, then every project in folder tabs:
  // Initiated first, then Activated, Impact and All. Each project is one line in the format of the team
  // portal's list (picture, title, category · place · next step, its stage, its progress ring), shaded in
  // the colour of its stage. Pointing at a line opens "Project at a glance"; on a phone the small "i" on
  // the picture does the same. This page shows drawings only and the titles from share.json: never a
  // child's photo, never the name of a school or a home. The home page as it was is kept at /front-4.
  const HOME_ACTS = [
    FEAT.moment && { k: "moment", href: "/moment", says: ["Gift a Moment", "In their name", "For a birthday", "In loving memory", "For a festival"] },
    FEAT.sponsor && { k: "sponsor", href: "/give", says: ["Sponsor a Smile", "Fund a Smile", "Give a Day of Joy", "Be the Reason for a Smile", "Sponsor a Moment"] },
    FEAT.sponsor && { k: "donate", href: "/fund", says: ["Donate", "Any amount helps", "Every rupee is shown", "To the Raavanaa Fund", "Give what you can"] }
  ].filter(Boolean);
  const HOME_ACT_ICONS = {
    moment: `<img src="/img/moment-mark.svg" alt="" width="64" height="64">`,
    sponsor: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="13" r="7.2"/><path d="M8 14.4c.8 1.4 1.8 2.1 3 2.1s2.2-.7 3-2.1"/><path class="dot" d="M8.6 11.1h.01M13.4 11.1h.01"/><path class="spark" d="M19.2 2.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/></svg>`,
    donate: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="heart" d="M12 10.6S8.2 8.3 8.2 5.5A2.2 2.2 0 0 1 12 4.1a2.2 2.2 0 0 1 3.8 1.4c0 2.8-3.8 5.1-3.8 5.1z"/><path d="M2.8 14.4h3.4l3.5 1.5h3.7a1.4 1.4 0 0 1 0 2.8h-3"/><path d="M13.9 17.3l4.9-2.3a1.5 1.5 0 0 1 1.4 2.6l-5.6 3.3a3 3 0 0 1-2.3.3l-5.9-1.6H2.8"/></svg>`
  };
  const HOME_STAGE = ["Initiated", "Activated", "Impact"];
  const nextStepOf = p => { const st = ringSteps(p).find(x => x.done < 1); return st ? st.name : stageNum(p) === 2 ? "Ready for the day" : "All done"; };
  // Each round icon turns through its own words, a beat apart from its neighbours.
  function startActs(app) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    app.querySelectorAll(".hm-act").forEach((box, n) => {
      const says = [...box.querySelectorAll(".hm-act-says b")]; if (says.length < 2) return;
      let k = 0;
      const turn = () => { if (document.hidden) return; k = (k + 1) % says.length; says.forEach((el, i) => { el.classList.toggle("on", i === k); el.setAttribute("aria-hidden", String(i !== k)); }); };
      setTimeout(() => rotTimers.push(setInterval(turn, 3000)), n * 1000);
    });
  }
  async function renderOverview(app, site, projects) {
    const share = await load("/share.json").catch(() => null);
    const safe = p => { const sh = (share && share.projects && share.projects[slugOf(p)]) || {};
      return { title: (TA_PATH && sh.title_ta) || sh.title || p.title,
        art: sh.art || (/\.svg$/i.test(p.cover || "") ? p.cover : "/img/project-hills.svg"),
        reach: (TA_PATH && sh.reach_ta) || sh.reach || (/TBD/i.test(p.reach || "") ? "" : p.reach || "") }; };
    const TABS = [[1, "Initiated"], [2, "Activated"], [3, "Impact"], [0, "All"]];
    const count = n => n ? projects.filter(p => stageNum(p) === n).length : projects.length;
    const slides = (site.sayings || []).map(x => typeof x === "string" ? { text: x } : x).filter(x => x && x.text);
    const start = slides.length ? Math.floor(Math.random() * slides.length) : 0;
    const follow = (site.follow || []).filter(x => x && x.title && x.text);
    const fstart = follow.length ? Math.floor(Math.random() * follow.length) : 0;
    let tab = 1;
    app.innerHTML = `
      <section class="intro">
        <h1 class="headline">${headline((slides[start] && slides[start].title) || site.tagline)}</h1>
      </section>
      <nav class="hm-acts" aria-label="Ways to give">
        ${HOME_ACTS.map(a => `<a class="hm-act a-${a.k}" href="${a.href}" aria-label="${a.says[0]}">
          <span class="hm-act-ic" aria-hidden="true">${HOME_ACT_ICONS[a.k]}</span>
          <span class="hm-act-says">${a.says.map((t, i) => `<b${i ? ' aria-hidden="true"' : ' class="on"'}>${t}</b>`).join("")}</span>
        </a>`).join("")}
      </nav>
      <nav class="stages hm-stages" aria-label="Show projects by stage">
        ${Object.entries(STAGES).map(([slug, st], k) => `${k ? `<span class="stage-path p${k}" aria-hidden="true"><svg viewBox="0 0 60 34"><path class="sp-base" d="M6 17H50"/><path class="sp-chev c1" d="M12 9l8 8-8 8"/><path class="sp-chev c2" d="M26 9l8 8-8 8"/><path class="sp-chev c3" d="M40 9l8 8-8 8"/><circle class="sp-spark" r="3.6" cx="0" cy="0"><animateMotion dur="0.75s" begin="indefinite" fill="freeze" path="M6 17H54" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.55 1"/></circle></svg></span>` : ""}
          <a class="stage art stat-${st.key}" href="/${slug}" data-n="${k + 1}">
            <i>${ICONS[st.key]}</i>
            <b${count(k + 1) ? "" : ' class="zero"'}>${count(k + 1) || "Soon"}</b>
            <span>${st.label}</span>
          </a>`).join("")}
      </nav>
      <div class="stage-rail" aria-live="polite">
        <p class="rail-say">${STAGE_SAY.map((t, i) => `<span class="s${i + 1}${i ? "" : " on"}">${t}</span>`).join("")}</p>
      </div>
      <section class="hm-book" aria-label="Projects">
        <div class="hm-tabs" role="tablist" aria-label="Projects by stage">
          ${TABS.map(([n, name]) => `<button type="button" role="tab" class="hm-tab s${n}" data-n="${n}" aria-selected="${tab === n}" aria-controls="hm-folder"><span>${name}</span><b>${count(n)}</b></button>`).join("")}
        </div>
        <div class="hm-folder s${tab}" id="hm-folder" role="tabpanel"></div>
        <div class="hm-pop" id="hm-pop" role="tooltip" hidden></div>
      </section>
      ${createHTML()}
      <section class="signup-band" id="keep-posted">${follow.length ? followHTML(site, follow, fstart) : signupHTML("home")}</section>`;

    const book = app.querySelector(".hm-book"), tabsBox = app.querySelector(".hm-tabs"), folder = app.querySelector(".hm-folder"), pop = app.querySelector(".hm-pop");
    const circles = [...app.querySelectorAll(".hm-stages .stage")];
    const ring = pct => `<svg class="hm-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" pathLength="100" class="tr"/><circle cx="20" cy="20" r="15" pathLength="100" class="fl" stroke-dasharray="${pct} 100" transform="rotate(-90 20 20)"/></svg>`;
    const rowHTML = p => { const n = stageNum(p), s = safe(p), pct = ringPercent(p), slug = slugOf(p);
      const place = cityOf(p) || (p.location || "").split(",")[0].trim();
      const meta = [p.theme, place].filter(Boolean).map(t => `<span>${esc(t)}</span>`).concat(`<span class="hm-next"><span>Next:</span> <span>${esc(nextStepOf(p))}</span></span>`).join('<i aria-hidden="true"> · </i>');
      return `<div class="hm-row s${n}" role="listitem" data-slug="${esc(slug)}">
          <a class="hm-row-link" href="/projects/${slug}">
            <span class="hm-thumb"><img src="${esc(s.art)}" alt="" loading="lazy" width="58" height="58"></span>
            <span class="hm-main"><b>${esc(s.title)}</b><small>${meta}</small></span>
            <span class="hm-side"><span class="hm-pill">${HOME_STAGE[n - 1]}</span><span class="hm-pct">${ring(pct)}<b>${pct}%</b></span></span>
          </a>
          <button type="button" class="hm-i" aria-label="Project at a glance" aria-expanded="false" aria-controls="hm-pop"><span aria-hidden="true">i</span></button>
        </div>`; };
    const EMPTY = { 0: "No projects yet." };
    const draw = () => {
      const list = tab ? projects.filter(p => stageNum(p) === tab) : projects;
      folder.className = `hm-folder s${tab}`;
      folder.innerHTML = list.length ? `<div class="hm-list" role="list">${list.map(rowHTML).join("")}</div>`
        : `<p class="hm-empty">${tab ? HOME_ROWS[tab - 1].empty : EMPTY[0]}</p>${tab > 1 ? "" : `<p class="hm-empty-go"><a class="btn" href="/initiate">Suggest one</a></p>`}`;
      tabsBox.querySelectorAll(".hm-tab").forEach(b => b.setAttribute("aria-selected", String(+b.dataset.n === tab)));
      circles.forEach((c, k) => c.classList.toggle("on", k + 1 === tab));
    };

    // "Project at a glance": the same facts as on the project's own page, in a small window.
    const RING_WORD = { 1: "Funded so far", 2: "Preparations done", 3: "Results reported" };
    const popHTML = p => { const n = stageNum(p), s = safe(p), b = budgetOf(p), pct = ringPercent(p);
      const facts = [["Where", esc(p.location || cityOf(p))], ["Who it is for", esc(s.reach)], ["Started", esc(p.started || "")], ["Cost of the day", b.goal ? moneyOf(site, b.goal, p) : ""],
        [RING_WORD[n], pct + "%"], ["Next step", esc(nextStepOf(p))]].filter(x => x[1]);
      return `<p class="hm-pop-k"><span>Project at a glance</span><b class="hm-pill">${HOME_STAGE[n - 1]}</b></p>
        <b class="hm-pop-t">${esc(s.title)}</b>
        <dl class="hm-facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        ${n === 3 && (p.impact || []).length ? `<p class="hm-pop-stats">${p.impact.slice(0, 3).map(x => `<span><b>${esc(x.value)}</b> ${esc(x.label)}</span>`).join("")}</p>` : ""}
        <a class="hm-pop-go" href="/projects/${slugOf(p)}">Open the project →</a>`; };
    let popRow = null, tIn = 0, tOut = 0;
    const closePop = () => { clearTimeout(tIn); if (!popRow) return; popRow.classList.remove("peek"); const b = popRow.querySelector(".hm-i"); if (b) b.setAttribute("aria-expanded", "false"); popRow = null; pop.hidden = true; };
    // by: "hover" (a pointer over the line; the window follows it and never gets in the way) or "tap" (the small i).
    const openPop = (row, by, x) => {
      const p = projects.find(q => slugOf(q) === row.dataset.slug); if (!p) return;
      if (popRow && popRow !== row) closePop();
      popRow = row; row.classList.add("peek");
      pop.className = `hm-pop s${stageNum(p)} by-${by}`; pop.innerHTML = popHTML(p); pop.hidden = false;
      if (by === "tap") row.querySelector(".hm-i").setAttribute("aria-expanded", "true");
      const br = book.getBoundingClientRect(), rr = row.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
      const below = rr.bottom + ph + 12 < innerHeight || rr.top - ph - 8 < 70;
      pop.style.top = Math.round((below ? rr.bottom + 6 : rr.top - ph - 6) - br.top) + "px";
      const want = by === "hover" && x != null ? x - br.left + 14 : rr.left - br.left + 12;
      pop.style.left = Math.round(Math.max(8, Math.min(want, br.width - pw - 8))) + "px";
    };
    const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
    folder.addEventListener("mouseover", e => { if (!canHover) return; const row = e.target.closest(".hm-row"); if (!row) return; clearTimeout(tOut);
      if (row === popRow) return; clearTimeout(tIn); const x = e.clientX; tIn = setTimeout(() => openPop(row, "hover", x), popRow ? 60 : 220); });
    folder.addEventListener("mouseout", e => { if (!canHover) return; const row = e.target.closest(".hm-row"); if (!row || row.contains(e.relatedTarget)) return; clearTimeout(tIn); tOut = setTimeout(closePop, 160); });
    folder.addEventListener("focusin", e => { if (e.target.matches(".hm-row-link:focus-visible")) openPop(e.target.closest(".hm-row"), "hover"); });
    folder.addEventListener("focusout", e => { if (e.target.matches(".hm-row-link")) closePop(); });
    folder.addEventListener("click", e => { const b = e.target.closest(".hm-i"); if (!b) return; e.preventDefault(); const row = b.closest(".hm-row"); if (row === popRow) closePop(); else openPop(row, "tap"); });
    document.addEventListener("click", e => { if (popRow && !e.target.closest(".hm-pop, .hm-i")) closePop(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closePop(); });
    addEventListener("scroll", () => { if (popRow && pop.classList.contains("by-hover")) closePop(); }, { passive: true });

    wireForms(app);
    fitHeadline();
    rotTimers.forEach(clearInterval); rotTimers = [];
    startFollow(app);
    startCreate(app);
    startActs(app);
    const light = startRail(app);
    const setTab = n => { closePop(); tab = n; draw(); if (n && light) light(n - 1); };
    tabsBox.addEventListener("click", e => { const b = e.target.closest(".hm-tab"); if (b) setTab(+b.dataset.n); });
    tabsBox.addEventListener("keydown", e => { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; const all = [...tabsBox.querySelectorAll(".hm-tab")], i = all.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); const nx = all[(i + (e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length]; nx.focus(); setTab(+nx.dataset.n); });
    // A stage circle opens its tab (instead of leaving the page) and brings the list into view.
    app.querySelector(".hm-stages").addEventListener("click", e => { const c = e.target.closest(".stage"); if (!c) return; e.preventDefault(); closePop(); tab = +c.dataset.n; draw();
      const r = tabsBox.getBoundingClientRect(); if (r.top > innerHeight * .7 || r.top < 0) tabsBox.scrollIntoView({ behavior: "smooth", block: "start" }); });
    draw();
    if (location.hash === "#keep-posted") { const t = document.getElementById("keep-posted"); if (t) t.scrollIntoView(); }
  }

  // Projects page (/projects, the web app's Projects tab), 15 Nov 2026 (SURESH): search box, then the stages as
  // folder tabs (All first and open), each project one line in the team portal's style, shaded in its stage
  // colour, with "Project at a glance" on hover (or the small i on a phone). Same rows as the /front-5 Home.
  // When a project was listed: p.listed (a date), else the month in p.started ("October 2026"). Used to sort
  // the Projects list newest first (SURESH, 17 Nov 2026). Same month keeps the order of projects.json.
  const listedAt = p => { const raw = p.listed || p.created_at || p.started || ""; const t = Date.parse(raw) || Date.parse("1 " + raw); return isNaN(t) ? 0 : t; };
  const listedLabel = p => { const t = listedAt(p); return t ? new Date(t).toLocaleDateString(TA_PATH ? "ta-LK" : "en-GB", p.listed ? { day: "numeric", month: "short", year: "numeric" } : { month: "short", year: "numeric" }) : ""; };
  // Turning titles over the project lists (SURESH, 17 Nov 2026): words that invite people to sponsor.
  // Use the same LIST_SAYS wherever a list of projects is shown, so the site speaks with one voice.
  const LIST_SAYS = ["Listed moments", "Requested needs", "Requested movements", "Requested smiles", "Moments waiting for you"];
  function startListSays(app) {
    const box = app.querySelector(".pj-says"); if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const w = [...box.children]; let k = 0;
    rotTimers.push(setInterval(() => { if (document.hidden) return; w[k].classList.remove("on"); w[k].setAttribute("aria-hidden", "true"); k = (k + 1) % w.length; w[k].classList.add("on"); w[k].removeAttribute("aria-hidden"); }, 3200));
  }
  // The project the giver ticked on the choose list: from the address (?project=) or kept from earlier in this visit.
  function choosePicked() {
    const q = new URLSearchParams(location.search).get("project");
    if (q) return q;
    try { const o = JSON.parse(sessionStorage.getItem("raav-pick") || "null"); return (o && o.slug) || ""; } catch (e) { return ""; }
  }
  // On a project page opened from the choose list (?choose=<reason>): a bar to go back to the list, or choose this one.
  function chooseBarHTML(slug) {
    const k = (new URLSearchParams(location.search).get("choose") || "").replace(/[^a-z]/g, "");
    if (!k) return "";
    const can = GIVE_OPEN.has(slug);
    return `<div class="ch-bar ch-on-page" role="region" aria-label="Choosing a project for your moment">
      <a class="ch-back" href="/projects?choose=${k}">← Back to the list</a>
      <span class="ch-now"><small>Gift a Moment</small><b>${can ? "This one?" : "Already funded"}</b></span>
      ${can ? `<a class="ch-go" href="/moment?for=${k}&project=${encodeURIComponent(slug)}&from=pick#projects">✓ Choose it</a>` : ""}
    </div>`;
  }
  async function renderProjects(app, site, projects) {
    // Gift a Moment, choose a project (SURESH, 20 Nov 2026): /projects?choose=<reason> is the same list, showing only the
    // Initiated projects that still need money. Tap a line to tick it, "Glance" for the facts, "Read the story" opens
    // the project page with a bar to come back here; Continue goes back to /moment with that project chosen.
    const CHOOSE = (() => { const k = new URLSearchParams(location.search).get("choose"); return k == null ? null : (k.replace(/[^a-z]/g, "") || "memory"); })();
    if (CHOOSE) projects = projects.filter(p => GIVE_OPEN.has(slugOf(p)));
    const storyHref = slug => `/projects/${slug}${CHOOSE ? `?choose=${CHOOSE}` : ""}`;
    projects = projects.map((p, k) => [p, k]).sort((a, b) => (listedAt(b[0]) - listedAt(a[0])) || (a[1] - b[1])).map(x => x[0]);
    const share = await load("/share.json").catch(() => null);
    const safe = p => { const sh = (share && share.projects && share.projects[slugOf(p)]) || {};
      return { title: (TA_PATH && sh.title_ta) || sh.title || p.title,
        art: sh.art || (/\.svg$/i.test(p.cover || "") ? p.cover : "/img/project-hills.svg"),
        reach: (TA_PATH && sh.reach_ta) || sh.reach || (/TBD/i.test(p.reach || "") ? "" : p.reach || "") }; };
    // SURESH 18 Nov 2026: no stage tabs (each row already shows its stage in its colour); instead one row of
    // place chips from the projects we have, newest listed first, that filter the list, with "All" at the end.
    const cities = [...new Set(projects.map(cityOf).filter(Boolean))];
    const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';
    const st = { q: "", city: "All", by: "" };
    // Who submitted each project: an organisation or a person, by name (SURESH, 17 Nov 2026).
    const byOf = p => String(p.submitted_by || p.organization || "").trim();
    // SURESH 17 Nov 2026: under each stage, the name of someone who has already given to that project (one picked at
    // random on each visit), so the list feels close. Only listed givers: no reservations, no "list": false entries.
    const giverOf = p => { const g = (p.funders || []).filter(f => f && f.name && !f.pledged && f.list !== false && !/test/i.test(f.name)); return g.length ? String(g[Math.floor(Math.random() * g.length)].name).trim() : ""; };
    const match = p => {
      if (st.city !== "All" && cityOf(p) !== st.city) return false;
      if (st.by && byOf(p) !== st.by) return false;
      if (!st.q) return true;
      const sh = safe(p), hay = [sh.title, p.summary, p.theme, cityOf(p), (p.location || "").split(",")[0]].filter(Boolean).join(" ").toLowerCase();
      return st.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
    };
    const picked = { slug: CHOOSE ? choosePicked() : "" };
    if (picked.slug && !projects.some(p => slugOf(p) === picked.slug)) picked.slug = "";
    app.innerHTML = CHOOSE ? `
      <section class="finder home-finder ch-head">
        <p class="ch-step"><span>Gift a Moment</span> Step 2 of 4</p>
        <h1 class="section-title latest-title">Choose a project</h1>
        <p class="pj-sub">Tick the one you would like your moment to make happen. Tap <b>Glance</b> for a quick look, or read its story and come back.</p>
      </section>
      <section class="hm-book pj-book ch-book" aria-label="Projects you can choose">
        ${cities.length > 1 ? `<div class="pj-places" role="group" aria-label="Places">
          ${cities.concat("All").map(c => `<button type="button" class="pj-place${c === "All" ? " all" : ""}" data-city="${esc(c)}" aria-pressed="${c === st.city}">${c === "All" ? "" : PIN}<span>${esc(c)}</span><b></b></button>`).join("")}
        </div>` : ""}
        <div class="hm-folder s0 pj-nofolder" id="hm-folder" role="radiogroup" aria-label="Choose a project"></div>
        <div class="hm-pop" id="hm-pop" role="tooltip" hidden></div>
        <a class="ch-fund" href="/moment?for=${CHOOSE}&any=1&from=pick#projects">Not sure? <b>Let Raavanaa choose</b> the next day that needs it →</a>
      </section>
      <div class="ch-bar" role="region" aria-label="Your choice">
        <a class="ch-back" href="/moment?for=${CHOOSE}&from=pick">← Back</a>
        <span class="ch-now" data-ch-now></span>
        <a class="ch-go" data-ch-go href="#" aria-disabled="true">Continue →</a>
      </div>` : `
      <section class="finder home-finder">
        ${/* SURESH 21 Nov 2026: one still, centred title in the Home headline's display style; no line under it */ ""}
        <h1 class="pj-title"><span>Requested</span> <em>Projects</em></h1>
        <form class="finder-search" role="search" action="#" onsubmit="return false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>
          <input id="find-q" type="search" placeholder="Search projects, places or ideas" aria-label="Search projects" autocomplete="off">
        </form>
      </section>
      <section class="hm-book pj-book" aria-label="Projects">
        ${cities.length ? `<div class="pj-places" role="group" aria-label="Places">
          ${cities.concat("All").map(c => `<button type="button" class="pj-place${c === "All" ? " all" : ""}" data-city="${esc(c)}" aria-pressed="${c === st.city}">${c === "All" ? "" : PIN}<span>${esc(c)}</span><b></b></button>`).join("")}
        </div>` : ""}
        <div class="hm-folder s0 pj-nofolder" id="hm-folder"></div>
        <div class="hm-pop" id="hm-pop" role="tooltip" hidden></div>
      </section>
      ${(() => { const who = {}; projects.forEach(p => { const b = byOf(p); if (!b) return; (who[b] = who[b] || { n: [0, 0, 0, 0], type: p.submitted_type || (b === "Raavanaa" ? "Organisation" : "") }).n[stageNum(p)]++; });
        const names = Object.keys(who).sort((a, b) => who[b].n.reduce((x, y) => x + y) - who[a].n.reduce((x, y) => x + y) || a.localeCompare(b));
        return names.length ? `<section class="pj-who" aria-labelledby="pj-who-h">
          <h2 id="pj-who-h" class="section-title">Organisations and people</h2>
          <p class="pj-who-say">Everyone who has submitted a project, with where their projects stand. Tap a name to see only theirs.</p>
          <div class="pj-who-list">${names.map(nm => `<button type="button" class="pj-who-b" data-by="${esc(nm)}" aria-pressed="false">
            <span class="pj-who-av">${esc(nm.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase())}</span>
            <span class="pj-who-t"><b>${esc(nm)}</b>${who[nm].type ? `<small>${esc(who[nm].type)}</small>` : ""}</span>
            <span class="pj-who-st">${[1, 2, 3].filter(k => who[nm].n[k]).map(k => `<i class="s${k}">${HOME_STAGE[k - 1]} ${who[nm].n[k]}</i>`).join("")}</span></button>`).join("")}</div>
        </section>` : ""; })()}`;
    const book = app.querySelector(".hm-book"), placesBox = app.querySelector(".pj-places"), folder = app.querySelector(".hm-folder"), pop = app.querySelector(".hm-pop");
    const ring = pct => `<svg class="hm-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" pathLength="100" class="tr"/><circle cx="20" cy="20" r="15" pathLength="100" class="fl" stroke-dasharray="${pct} 100" transform="rotate(-90 20 20)"/></svg>`;
    const TICK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    const pickRowHTML = p => { const n = stageNum(p), s = safe(p), pct = ringPercent(p), slug = slugOf(p), on = slug === picked.slug, b = budgetOf(p);
      const place = cityOf(p) || (p.location || "").split(",")[0].trim();
      const left = b.goal > b.raised ? `<span class="ch-left">${moneyOf(site, b.goal - b.raised, p)} still needed</span>` : "";
      return `<div class="hm-row s${n} ch-row${on ? " on" : ""}" data-slug="${esc(slug)}">
          <button type="button" class="hm-row-link ch-pick" role="radio" aria-checked="${on}" data-pick="${esc(slug)}">
            <span class="ch-tick">${TICK}</span>
            <span class="hm-thumb"><img src="${esc(s.art)}" alt="" loading="lazy" width="58" height="58"></span>
            <span class="hm-main"><b>${esc(s.title)}</b><small>${[p.theme, place].filter(Boolean).map(t => esc(t)).join(" · ")}</small>${left}</span>
            <span class="hm-side"><span class="hm-pct">${ring(pct)}<b>${pct}%</b></span></span>
          </button>
          <div class="ch-acts">
            <button type="button" class="hm-i ch-glance" aria-expanded="false" aria-controls="hm-pop"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg><span>Glance</span></button>
            <a class="ch-story" href="${storyHref(slug)}">Read the story →</a>
            <span class="ch-chosen" aria-hidden="true">${on ? "Chosen" : ""}</span>
          </div>
        </div>`; };
    const rowHTML = p => { if (CHOOSE) return pickRowHTML(p); const n = stageNum(p), s = safe(p), pct = ringPercent(p), slug = slugOf(p);
      const place = cityOf(p) || (p.location || "").split(",")[0].trim();
      const meta = [p.theme, place].filter(Boolean).map(t => `<span>${esc(t)}</span>`).concat(`<span class="hm-next"><span>Next:</span> <span>${esc(nextStepOf(p))}</span></span>`).concat(listedLabel(p) ? `<span class="hm-listed">Listed ${esc(listedLabel(p))}</span>` : []).join('<i aria-hidden="true"> · </i>');
      return `<div class="hm-row s${n}" role="listitem" data-slug="${esc(slug)}">
          <a class="hm-row-link" href="/projects/${slug}">
            <span class="hm-thumb"><img src="${esc(s.art)}" alt="" loading="lazy" width="58" height="58"></span>
            <span class="hm-main"><b>${esc(s.title)}</b><small>${meta}</small>${moreHTML(p, s)}</span>
            <span class="hm-side"><span class="hm-pill">${HOME_STAGE[n - 1]}</span>${(f => f ? `<small class="hm-by">with ${esc(f)}</small>` : byOf(p) ? `<small class="hm-by">by ${esc(byOf(p))}</small>` : "")(giverOf(p))}<span class="hm-pct">${ring(pct)}<b>${pct}%</b></span></span>
          </a>
          <button type="button" class="hm-i" aria-label="Project at a glance" aria-expanded="false" aria-controls="hm-pop"><span aria-hidden="true">i</span></button>
        </div>`; };
    // SURESH 18 Nov 2026: on computers each row also tells a little more (the short story, who it is for, the cost
    // and what is raised), to fill the space; hidden on phones by CSS so the phone list stays as it is.
    const moreHTML = (p, s) => { const desc = String((TA_PATH && "") || p.summary || "").trim(), b = budgetOf(p);
      const facts = [s.reach ? `<span><span>For:</span> ${esc(s.reach)}</span>` : "",
        b.goal ? `<span><span>Cost of the day:</span> ${moneyOf(site, b.goal, p)}</span>` : "",
        b.goal && b.raised ? `<span><span>${stageNum(p) === 3 ? "Given:" : "Raised so far:"}</span> ${moneyOf(site, b.raised, p)}</span>` : ""].filter(Boolean);
      return desc || facts.length ? `<span class="hm-more">${desc ? `<span class="hm-desc">${esc(desc)}</span>` : ""}${facts.length ? `<span class="hm-facts-line">${facts.join('<i aria-hidden="true"> · </i>')}</span>` : ""}</span>` : ""; };
    const EMPTY = { 0: "No projects yet." };
    let draw = () => {
      const list = projects.filter(match);
      if (placesBox) placesBox.querySelectorAll(".pj-place").forEach(b => { const c = b.dataset.city, keep = st.city;
        st.city = c; b.querySelector("b").textContent = projects.filter(match).length; st.city = keep;
        b.setAttribute("aria-pressed", String(c === st.city)); });
      folder.innerHTML = list.length ? `<div class="hm-list"${CHOOSE ? "" : ' role="list"'}>${list.map(rowHTML).join("")}</div>`
        : CHOOSE ? `<p class="hm-empty">Every project is funded right now. Let Raavanaa choose the next one that needs it.</p>` : `<p class="hm-empty">${st.q || st.city !== "All" ? "No projects match your search." : EMPTY[0]}</p><p class="hm-empty-go"><a class="btn" href="/initiate">Suggest one</a></p>`;
    };

    // "Project at a glance": the same facts as on the project's own page, in a small window.
    const RING_WORD = { 1: "Funded so far", 2: "Preparations done", 3: "Results reported" };
    const popHTML = p => { const n = stageNum(p), s = safe(p), b = budgetOf(p), pct = ringPercent(p);
      const facts = [["Submitted by", esc(byOf(p))], ["Where", esc(p.location || cityOf(p))], ["Who it is for", esc(s.reach)], ["Started", esc(p.started || "")], ["Cost of the day", b.goal ? moneyOf(site, b.goal, p) : ""],
        [RING_WORD[n], pct + "%"], ["Next step", esc(nextStepOf(p))]].filter(x => x[1]);
      return `<p class="hm-pop-k"><span>Project at a glance</span><b class="hm-pill">${HOME_STAGE[n - 1]}</b></p>
        <b class="hm-pop-t">${esc(s.title)}</b>
        <dl class="hm-facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        ${n === 3 && (p.impact || []).length ? `<p class="hm-pop-stats">${p.impact.slice(0, 3).map(x => `<span><b>${esc(x.value)}</b> ${esc(x.label)}</span>`).join("")}</p>` : ""}
        <a class="hm-pop-go" href="${storyHref(slugOf(p))}">${CHOOSE ? "Read the story" : "Open the project"} →</a>`; };
    let popRow = null, tIn = 0, tOut = 0;
    const closePop = () => { clearTimeout(tIn); if (!popRow) return; popRow.classList.remove("peek"); const b = popRow.querySelector(".hm-i"); if (b) b.setAttribute("aria-expanded", "false"); popRow = null; pop.hidden = true; };
    // by: "hover" (a pointer over the line; the window follows it and never gets in the way) or "tap" (the small i).
    const openPop = (row, by, x) => {
      const p = projects.find(q => slugOf(q) === row.dataset.slug); if (!p) return;
      if (popRow && popRow !== row) closePop();
      popRow = row; row.classList.add("peek");
      pop.className = `hm-pop s${stageNum(p)} by-${by}`; pop.innerHTML = popHTML(p); pop.hidden = false;
      if (by === "tap") row.querySelector(".hm-i").setAttribute("aria-expanded", "true");
      const br = book.getBoundingClientRect(), rr = row.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
      const below = rr.bottom + ph + 12 < innerHeight || rr.top - ph - 8 < 70;
      pop.style.top = Math.round((below ? rr.bottom + 6 : rr.top - ph - 6) - br.top) + "px";
      const want = by === "hover" && x != null ? x - br.left + 14 : rr.left - br.left + 12;
      pop.style.left = Math.round(Math.max(8, Math.min(want, br.width - pw - 8))) + "px";
    };
    const canHover = !CHOOSE && matchMedia("(hover: hover) and (pointer: fine)").matches;
    folder.addEventListener("mouseover", e => { if (!canHover) return; const row = e.target.closest(".hm-row"); if (!row) return; clearTimeout(tOut);
      if (row === popRow) return; clearTimeout(tIn); const x = e.clientX; tIn = setTimeout(() => openPop(row, "hover", x), popRow ? 60 : 220); });
    folder.addEventListener("mouseout", e => { if (!canHover) return; const row = e.target.closest(".hm-row"); if (!row || row.contains(e.relatedTarget)) return; clearTimeout(tIn); tOut = setTimeout(closePop, 160); });
    folder.addEventListener("focusin", e => { if (e.target.matches(".hm-row-link:focus-visible")) openPop(e.target.closest(".hm-row"), "hover"); });
    folder.addEventListener("focusout", e => { if (e.target.matches(".hm-row-link")) closePop(); });
    folder.addEventListener("click", e => { const b = e.target.closest(".hm-i"); if (!b) return; e.preventDefault(); const row = b.closest(".hm-row"); if (row === popRow) closePop(); else openPop(row, "tap"); });
    document.addEventListener("click", e => { if (popRow && !e.target.closest(".hm-pop, .hm-i")) closePop(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closePop(); });
    addEventListener("scroll", () => { if (popRow && pop.classList.contains("by-hover")) closePop(); }, { passive: true });

    if (placesBox) placesBox.addEventListener("click", e => { if (e.target.closest(".pj-more")) return; const b = e.target.closest(".pj-place"); if (!b) return; st.city = b.dataset.city; closePop(); draw(); fitPlaces(); });
    // SURESH 21 Nov 2026: the places fit on one line; the rest open with "More".
    let placesOpen = false;
    const fitPlaces = () => {
      if (!placesBox) return;
      const chips = [...placesBox.querySelectorAll(".pj-place")], all = chips.find(b => b.classList.contains("all"));
      let more = placesBox.querySelector(".pj-more");
      if (!more) { more = document.createElement("button"); more.type = "button"; more.className = "pj-more";
        more.addEventListener("click", () => { placesOpen = !placesOpen; fitPlaces(); }); placesBox.append(more); }
      chips.forEach(b => b.hidden = false); more.hidden = true;
      placesBox.classList.toggle("open", placesOpen);
      const cities = chips.filter(b => b !== all);
      if (placesOpen) { more.hidden = false; more.innerHTML = 'Less <i aria-hidden="true">▴</i>'; more.setAttribute("aria-expanded", "true"); return; }
      const gap = parseFloat(getComputedStyle(placesBox).columnGap) || 8, W = placesBox.clientWidth - 4, w = b => b.getBoundingClientRect().width;
      const total = chips.reduce((a, b) => a + w(b) + gap, -gap);
      if (total <= W) return;
      more.hidden = false; more.innerHTML = 'More <i aria-hidden="true">▾</i>'; more.setAttribute("aria-expanded", "false");
      let used = w(all) + gap + w(more) + gap, shown = 0;
      cities.forEach(b => { const keep = b.getAttribute("aria-pressed") === "true"; if (!keep && used + w(b) > W && shown) { b.hidden = true; return; } used += w(b) + gap; shown++; });
      more.innerHTML = `More <span>+${cities.filter(b => b.hidden).length}</span> <i aria-hidden="true">▾</i>`;
    };
    addEventListener("resize", () => fitPlaces());
    if (CHOOSE) {
      // ticking one: only one project at a time; tapping it again takes the tick off
      const now = app.querySelector("[data-ch-now]"), go = app.querySelector("[data-ch-go]");
      const show = () => {
        const p = projects.find(x => slugOf(x) === picked.slug);
        folder.querySelectorAll(".ch-row").forEach(r => { const on = r.dataset.slug === picked.slug; r.classList.toggle("on", on);
          r.querySelector(".ch-pick").setAttribute("aria-checked", String(on)); r.querySelector(".ch-chosen").textContent = on ? "Chosen" : ""; });
        now.innerHTML = p ? `<small>Your project</small><b>${esc(safe(p).title)}</b>` : "<small>Tick a project above</small>";
        go.setAttribute("aria-disabled", String(!p));
        go.href = p ? `/moment?for=${CHOOSE}&project=${encodeURIComponent(picked.slug)}&from=pick#projects` : "#";
        app.querySelector(".ch-bar .ch-back").href = `/moment?for=${CHOOSE}${p ? `&project=${encodeURIComponent(picked.slug)}` : ""}&from=pick${p ? "#projects" : ""}`;
        try { sessionStorage.setItem("raav-pick", JSON.stringify({ k: CHOOSE, slug: picked.slug })); } catch (e) { /* fine without it */ }
      };
      folder.addEventListener("click", e => { const b = e.target.closest("[data-pick]"); if (!b) return; picked.slug = picked.slug === b.dataset.pick ? "" : b.dataset.pick; show(); });
      go.addEventListener("click", e => { if (go.getAttribute("aria-disabled") === "true") { e.preventDefault(); now.classList.remove("nudge"); void now.offsetWidth; now.classList.add("nudge"); } });
      const redraw = draw; draw = () => { redraw(); show(); };
      draw(); fitPlaces();
      if (picked.slug) { const r = folder.querySelector(`.ch-row[data-slug="${CSS.escape(picked.slug)}"]`); if (r) r.scrollIntoView({ block: "center" }); }
      return;
    }
    app.querySelector("#find-q").addEventListener("input", e => { st.q = e.target.value.trim(); closePop(); draw(); });
    const whoBox = app.querySelector(".pj-who-list");
    if (whoBox) whoBox.addEventListener("click", e => { const b = e.target.closest(".pj-who-b"); if (!b) return;
      st.by = st.by === b.dataset.by ? "" : b.dataset.by;
      whoBox.querySelectorAll(".pj-who-b").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.by === st.by)));
      closePop(); draw(); if (st.by) book.scrollIntoView({ behavior: "smooth", block: "start" }); });
    draw();
    fitPlaces(); if (document.fonts) document.fonts.ready.then(fitPlaces);
  }

  // Front page (raavanaa.org): arched title, picture slideshow, and one button into the site.
  function renderWelcome(app, site) {
    const slides = (site.welcome_slides || site.sayings || []).map(x => typeof x === "string" ? { text: x } : x).filter(x => x && x.text);
    const start = 0;
    if (document.body.dataset.variant === "logo") {
      app.innerHTML = `
        <section class="logo-entry">
          <span class="le-glow" aria-hidden="true"></span>
          <h1 class="sr">Raavanaa Community: creating smiles, creating moments</h1>
          <picture class="le-logo"><source srcset="/img/logo.webp?v=6" type="image/webp"><img src="/img/logo.jpg?v=6" alt="Raavanaa · Creating Smiles" width="900" height="298"></picture>
          <div class="le-rule" aria-hidden="true"><i></i><b></b><i></i></div>
          <p class="le-slogan">Creating smiles, creating moments</p>
          <p class="le-sub">A day of joy, together</p>
          <a class="enter-btn le-btn" href="/overview">Enter Raavanaa <span aria-hidden="true">→</span></a>
          <p class="le-places">Kilinochchi <span>·</span> Batticaloa <span>·</span> Jaffna</p>
        </section>`;
      return;
    }
    if (document.body.dataset.variant === "picture") {
      app.innerHTML = `
        <section class="splash">
          <h1 class="sr">Raavanaa Community: a day of joy for every child</h1>
          <picture class="splash-pic">
            <source media="(max-aspect-ratio: 4/5)" srcset="/img/front-tall-720.webp 720w, /img/front-tall.webp 1080w" sizes="100vw">
            <img src="/img/front-wide.webp" srcset="/img/front-wide-1200.webp 1200w, /img/front-wide.webp 1920w" sizes="100vw" width="1920" height="1080"
              alt="Raavanaa Community: a day of joy for every child. Children cheer by a ferris wheel, a school bus and a picnic under a smiling sun.">
          </picture>
          <a class="enter-btn splash-btn" href="/overview">Enter Raavanaa <span aria-hidden="true">→</span></a>
        </section>`;
      return;
    }
    const big = document.body.dataset.variant === "2";
    app.innerHTML = `
      <section class="home-hero welcome${big ? " welcome-big" : ""}">
        <h1 class="arc-title">${big ? bigArcHTML() : arcTitleHTML()}</h1>
        ${big ? "" : `<p class="arc-sub">Creating Smiles</p>`}
        ${sayingsHTML(site, slides, start)}
        <a class="enter-btn" href="/overview">Enter Raavanaa <span aria-hidden="true">→</span></a>
      </section>`;
    rotTimers.forEach(clearInterval); rotTimers = [];
    startSayings(app);
  }

  // Front page (/front): two arched doors, one for people who want to make a day of joy happen
  // and one for people who know children who need one. Then how a smile happens, in its three
  // stages, and three projects to show it is real.
  const sparkPath = (x, y, r) => `M${x} ${y - r}l${r * .32} ${r * .68} ${r * .68} ${r * .32}-${r * .68} ${r * .32}-${r * .32} ${r * .68}-${r * .32}-${r * .68}-${r * .68}-${r * .32} ${r * .68}-${r * .32}z`;
  const DOOR_GIVE_SVG = `<svg class="door-svg" viewBox="0 0 200 200" aria-hidden="true">
      <g class="d-spark"><path d="${sparkPath(42, 60, 11)}" fill="#f2b21c"/><path d="${sparkPath(160, 44, 9)}" fill="#e5851a"/><path d="${sparkPath(166, 120, 7)}" fill="#f2b21c"/></g>
      <ellipse cx="100" cy="177" rx="58" ry="6" fill="#5a2a00" opacity=".1"/>
      <rect x="56" y="112" width="88" height="62" rx="6" fill="#e5851a"/>
      <rect x="56" y="112" width="88" height="9" fill="#b0560f" opacity=".35"/>
      <rect x="92" y="112" width="16" height="62" fill="#c8381e"/>
      <g class="dg-heart"><g transform="translate(0 -20)"><path d="M100 106C70 86 63 58 81 49c10-5 18 1 19 8 1-7 9-13 19-8 18 9 11 37-19 57z" fill="#c8381e"/>
        <circle cx="91" cy="68" r="3.6" fill="#fff"/><circle cx="109" cy="68" r="3.6" fill="#fff"/><path d="M89 78q11 10 22 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g></g>
      <g class="dg-lid"><rect x="48" y="96" width="104" height="20" rx="5" fill="#f2b21c"/><rect x="92" y="96" width="16" height="20" fill="#c8381e"/>
        <path d="M100 96c-4-14-26-20-28-8-1 7 14 9 28 8zM100 96c4-14 26-20 28-8 1 7-14 9-28 8z" fill="#c8381e"/><circle cx="100" cy="95" r="5" fill="#9c2a14"/></g>
    </svg>`;
  const DOOR_ASK_SVG = `<svg class="door-svg" viewBox="0 0 200 200" aria-hidden="true">
      <g class="d-spark"><path d="${sparkPath(44, 52, 10)}" fill="#f2b21c"/><path d="${sparkPath(170, 120, 8)}" fill="#3f9a5f"/><path d="${sparkPath(150, 170, 6)}" fill="#f2b21c"/></g>
      <path class="da-trail" d="M30 170C54 152 38 128 64 122s30 8 40-4" fill="none" stroke="#1f7a47" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="1 11" opacity=".6"/>
      <path d="M24 170c-5-6 3-11 6-5 3-6 11-1 6 5l-6 6z" fill="#c8381e"/>
      <g class="da-plane" stroke="#1f7a47" stroke-width="5" stroke-linejoin="round">
        <path d="M172 44L70 100l38 12z" fill="#fff"/>
        <path d="M172 44l-64 68 14 36z" fill="#cfe6d6"/>
        <path d="M108 112l-6 24 14-8z" fill="#1f7a47"/>
        <g transform="rotate(-27 116 88)" stroke="none"><circle cx="108" cy="86" r="3.4" fill="#16432c"/><circle cx="124" cy="86" r="3.4" fill="#16432c"/><path d="M107 94q9 8 18 0" fill="none" stroke="#c8381e" stroke-width="3.6" stroke-linecap="round"/></g>
      </g>
    </svg>`;
  const DOORS = [
    { cls: "give", href: "/create", svg: DOOR_GIVE_SVG, title: "Make a Smile Happen", say: "Choose a day of joy that's waiting, and make it happen.", btn: "Make this happen" },
    { cls: "ask", href: "/initiate", svg: DOOR_ASK_SVG, title: "Request a Smile", say: "Know children who deserve a day of joy? Tell us about them.", btn: "Request a smile" }
  ];
  const doorsHTML = () => `<div class="doors">${DOORS.map(d => `
      <a class="door ${d.cls}" href="${d.href}">
        <span class="door-art">${d.svg}</span>
        <span class="door-title">${d.title}</span>
        <span class="door-say">${d.say}</span>
        <span class="door-btn">${d.btn} <span aria-hidden="true">→</span></span>
      </a>`).join("")}</div>`;
  const HAPPENS = [
    { slug: "initiated", key: "projects", say: "Someone asks for a smile. Our team visits and plans the day." },
    { slug: "activated", key: "active", say: "The whole day is covered and checked. Everything gets ready." },
    { slug: "impact", key: "updates", say: "The children have their day, and the story comes back to you." }
  ];
  const happensHTML = () => `<section class="happens" aria-labelledby="happens-h">
      <h2 class="happens-h" id="happens-h">How a smile happens</h2>
      <ol class="happens-steps">${HAPPENS.map((h, i) => `
        <li class="s${i + 1}"><a href="/${h.slug}">
          <span class="hs-dot">${ICONS[h.key]}</span>
          <span class="hs-text"><span class="hs-stage">${STAGES[h.slug].label}</span><span class="hs-say">${STAGE_SAY[i]}</span><span class="hs-line">${h.say}</span></span>
        </a></li>`).join("")}</ol>
      <a class="happens-more" href="/how-it-works">See the journey of a smile</a>
    </section>`;
  function renderFront(app, site, projects) {
    // One project from each stage, so the three pictures tell the whole story; topped up if a stage is empty.
    const picks = [1, 2, 3].map(n => projects.find(p => stageNum(p) === n)).filter(Boolean);
    projects.forEach(p => { if (picks.length < 3 && !picks.includes(p)) picks.push(p); });
    app.innerHTML = `
      <section class="front-hero">
        <h1 class="front-title">Creating smiles, creating moments</h1>
        <p class="front-sub">Every child deserves a day of joy. Here are two ways to make one.</p>
        ${doorsHTML()}
        <p class="front-promise">Every penny goes to the day, and every smile is shared.</p>
      </section>
      ${happensHTML()}
      ${picks.length ? `<section class="front-now">
        <h2 class="happens-h">Smiles happening now</h2>
        <div class="mosaic n${Math.min(picks.length, 3)}">${mosaicTiles(picks, projects)}</div>
        <a class="happens-more" href="/overview">See all projects</a>
      </section>` : ""}`;
  }

  // Second front page (/front-2): one live "smile lane" from request to done, with real numbers.
  // The days waiting for help come first and big; the requests still being checked are listed with
  // no links and no details (kind of day, district, how many children, month, step); then days already
  // done, and a small "Request a smile" band. The two-door version stays at /front.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthOf = ym => { const m = /^(\d{4})-(\d{2})/.exec(ym || ""); return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : ""; };
  const Q_STEP = { received: [1, "Received"], checking: [2, "Being checked"], visit: [2, "Visit planned"], planning: [3, "Visited, planning the day"] };
  const Q_KIND = { "Trips & Events": "A day out or trip", "Education": "Help with learning" };
  const Q_DISTRICTS = ["Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"];
  const qDistrict = v => { const t = String(v || "").replace(/\s+district$/i, "").trim().toLowerCase(); return Q_DISTRICTS.find(d => d.toLowerCase() === t) || ""; };
  // Only on the draft preview and on this computer: example rows so the layout can be judged before real requests come in.
  const isPreview = /^(draft--|localhost$|127\.0\.0\.1$)/.test(location.hostname);
  const Q_EXAMPLE = [
    { kind: "A game or sports day", town: "Batticaloa", children: "25 to 50", month: "2026-10", step: "received", example: true },
    { kind: "A day out or trip", town: "Kilinochchi", children: "10 to 25", month: "2026-10", step: "visit", example: true },
    { kind: "A celebration or festival", town: "Jaffna", children: "50 to 100", month: "2026-09", step: "planning", example: true }
  ];
  const VERIFIED_TICK = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  function laneHTML(n) {
    const stops = [
      { cls: "q", href: "#checking", num: n.checking, label: "Being checked", sub: "New requests" },
      { cls: "s1 you", href: "#waiting", num: n.waiting, label: "Waiting for you", sub: "Initiated" },
      { cls: "s2", href: "/activated", num: n.onway, label: "On the way", sub: "Activated" },
      { cls: "s3", href: "/impact", num: n.done, label: "Done", sub: "Impact" }
    ];
    return `<div class="lane-wrap">
        <p class="lane-push" aria-hidden="true"><span>Your help makes it happen</span>
          <svg viewBox="0 0 200 44" preserveAspectRatio="none"><path d="M24 40C50 2 150 2 180 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9"/></svg>
          <svg class="lane-push-tip" viewBox="0 0 16 16"><path d="M2 3l12 5-12 5 3-5z" fill="currentColor"/></svg></p>
        <ol class="lane" aria-label="Where every smile is right now">${stops.map(s => `
          <li class="${s.cls}"><a href="${s.href}">
            <span class="lane-dot"><b data-lane="${s.cls.split(" ")[0]}">${s.num}</b></span>
            <span class="lane-label">${s.label}</span>
            <span class="lane-sub">${s.sub}</span>
          </a></li>`).join("")}</ol>
      </div>`;
  }
  function waitCard(p, site, i, projects) {
    const goal = numOf(p.goal) || (p.budget || []).filter(x => x && x.item).reduce((s, x) => s + numOf(x.amount), 0);
    const raised = (p.funders || []).filter(x => x && x.name).reduce((s, x) => s + numOf(x.amount), 0);
    const left = Math.max(0, goal - raised), pct = goal ? Math.min(100, Math.round(raised / goal * 100)) : 0;
    const town = p.city || (p.location || "").split(",")[0].trim();
    const covers = (p.budget || []).filter(x => x && x.item).slice(0, 3);
    const href = `/projects/${slugOf(p)}`;
    return `<article class="wait-card">
        <a class="wait-pic" href="${href}" tabindex="-1" aria-hidden="true" style="${coverStyle(p, projects.indexOf(p))}">${p.cover ? `<img src="${esc(imgUrl(p.cover, 900))}" alt=""${i ? ' loading="lazy"' : ""}>` : ""}</a>
        <div class="wait-body">
          <span class="wait-ok">${VERIFIED_TICK} <span>${esc(vLabel(p))}</span></span>
          <h3><a href="${href}">${esc(p.title)}</a></h3>
          ${town || p.reach ? `<p class="wait-meta">${[town, p.reach].filter(Boolean).map(esc).join(" · ")}</p>` : ""}
          ${goal ? `<div class="wait-money">
              <p class="wait-gap">${left ? `<b>${moneyOf(site, left, p)}</b> <span>to go</span>` : `<span>The whole day is covered</span>`}</p>
              <span class="wait-bar" role="img" aria-label="${pct}% covered"><i style="width:${Math.max(pct, 3)}%"></i></span>
              <p class="wait-of">${moneyOf(site, raised, p)} of ${moneyOf(site, goal, p)} covered</p>
            </div>` : `<div class="wait-money"><p class="wait-gap"><span>Costs being worked out</span></p><p class="wait-of"><span>You can join now. Tell us how you'd like to help.</span></p></div>`}
          ${covers.length ? `<p class="wait-covers"><span class="wc-h">It covers</span> ${covers.map(x => `<span class="wc">${esc(x.item)}</span>`).join("")}</p>` : ""}
          <a class="wait-btn" href="${href}">Make this happen <span aria-hidden="true">→</span></a>
        </div>
      </article>`;
  }
  const queueRow = r => {
    const [lvl, say] = Q_STEP[r.step] || Q_STEP.received;
    return `<li class="${r.example ? "q-example" : ""}">
        <span class="q-steps l${lvl}" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="q-kind">${esc(r.kind)}${r.example ? ` <i class="q-ex">Example</i>` : ""}</span>
        <span class="q-facts">${[r.town, r.children ? `${r.children} children` : "", monthOf(r.month)].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join("")}</span>
        <span class="q-say l${lvl}">${esc(say)}</span>
      </li>`;
  };
  function queueHTML(rows, received, example) {
    if (!rows.length) return `<p class="queue-empty">No requests waiting to be checked right now. <a href="/initiate">Request a smile</a></p>`;
    const shown = rows.slice(0, 6), more = rows.length - shown.length;
    return `<ul class="queue">${shown.map(queueRow).join("")}</ul>
      ${more > 0 ? `<p class="queue-more">And ${more} more being checked</p>` : ""}
      ${received > rows.length ? `<p class="queue-more">Requests received so far: ${received}</p>` : ""}
      ${example ? `<p class="queue-note">Rows marked "Example" only show on the preview, to show the layout. Real requests replace them as they come in.</p>` : ""}`;
  }
  async function renderLane(app, site, projects, raw) {
    const waiting = projects.filter(p => stageNum(p) === 1);
    const onway = projects.filter(p => stageNum(p) === 2);
    const done = projects.filter(p => stageNum(p) === 3);
    // Projects the team has added but not yet visited and verified: listed as being checked, never shown in full.
    const unchecked = (raw || []).filter(p => p && p.title && !p.hidden && !p.verified).map(p => ({
      kind: Q_KIND[p.theme] || "A day of joy", town: qDistrict(p.city), children: "",
      month: (() => { const m = /([A-Za-z]+)\s+(\d{4})/.exec(p.started || ""); const k = m ? MONTHS.findIndex(x => m[1].startsWith(x)) : -1; return k >= 0 ? `${m[2]}-${String(k + 1).padStart(2, "0")}` : ""; })(),
      step: "checking"
    }));
    const n = { checking: unchecked.length, waiting: waiting.length, onway: onway.length, done: done.length };
    app.innerHTML = `
      <section class="lane-hero">
        <h1 class="front-title">Creating smiles, creating moments</h1>
        <p class="front-sub">Every day of joy here is real, and checked by our team. Pick one that's waiting, and make it happen.</p>
        ${laneHTML(n)}
      </section>
      <section class="front-block" id="waiting" aria-labelledby="waiting-h">
        <h2 class="block-h" id="waiting-h"><span>Waiting for you</span> <b class="block-n s1">${waiting.length}</b></h2>
        <p class="block-say">Visited, planned and ready. When the whole day is covered, it moves on to Activated.</p>
        ${waiting.length ? `<div class="wait-list">${waiting.slice(0, 3).map((p, i) => waitCard(p, site, i, projects)).join("")}</div>`
          : `<p class="queue-empty">Every checked day is already on its way. The next ones appear here as soon as they're checked.</p>`}
      </section>
      <section class="front-block" id="checking" aria-labelledby="checking-h">
        <h2 class="block-h" id="checking-h"><span>Being checked</span> <b class="block-n q" data-lane-n>${unchecked.length}</b></h2>
        <p class="block-say">New requests for a day of joy. Our team calls and visits each one first, so we keep the details private until then.</p>
        <div data-queue><ul class="queue">${unchecked.map(queueRow).join("")}</ul></div>
      </section>
      ${done.length ? `<section class="front-block front-done" aria-labelledby="done-h">
        <h2 class="block-h" id="done-h"><span>Days of Joy, Created</span> <b class="block-n s3">${done.length}</b></h2>
        <div class="mosaic n${Math.min(done.length, 3)}">${mosaicTiles(done, projects)}</div>
        <a class="happens-more" href="/impact">See every story</a>
      </section>` : ""}
      <a class="ask-band" href="/initiate">
        <span class="ask-art">${DOOR_ASK_SVG}</span>
        <span class="ask-text"><b>Know children who deserve a day of joy?</b><span>Tell us about them. Our team will call, visit and plan it with you.</span></span>
        <span class="ask-btn">Request a smile <span aria-hidden="true">→</span></span>
      </a>
      <p class="front-promise">Every penny goes to the day, and every smile is shared.</p>`;
    // The requests still being checked come from the team's list, through a summary with no personal details.
    let rows = unchecked, received = 0, example = false;
    try {
      const r = await fetch("/api/pipeline", { headers: { accept: "application/json" } });
      const j = r.ok && /json/.test(r.headers.get("content-type") || "") ? await r.json() : null;
      if (j && Array.isArray(j.list)) { rows = [...j.list, ...unchecked]; received = (j.received || 0) + unchecked.length; n.checking = (j.checking || 0) + unchecked.length; }
    } catch (e) {}
    if (rows.length < 2 && isPreview) { rows = [...rows, ...Q_EXAMPLE]; example = true; n.checking = rows.length; }
    const box = app.querySelector("[data-queue]"); if (!box) return;
    box.innerHTML = queueHTML(rows, received, example);
    app.querySelectorAll('[data-lane="q"], [data-lane-n]').forEach(b => { b.textContent = n.checking; });
  }

  // "Make a Smile Happen" (/create): three plain steps, then the days of joy waiting to happen.
  const GIVE_STEPS = [
    ["Choose a smile", "Each one below is a real day of joy our team has visited and planned."],
    ["Make this happen", "Open it and tap \"Make this happen\". Cover the whole day or a part, on your own or with friends. We'll be in touch."],
    ["See the joy", "When the day is done, the story and the photos come back to you."]
  ];
  function renderCreate(app, site, projects) {
    const waiting = projects.filter(p => stageNum(p) === 1);
    app.innerHTML = `
      <section class="give-page">
        <div class="give-head">
          <span class="door-art give">${DOOR_GIVE_SVG}</span>
          <div>
            <h1 class="front-title">Make a Smile Happen</h1>
            <p class="front-sub">Choose a day of joy that's waiting, and make it happen.</p>
          </div>
        </div>
        <ol class="give-steps">${GIVE_STEPS.map(([t, d], k) => `<li><span class="gs-n">${k + 1}</span><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join("")}</ol>
        <h2 class="happens-h">Smiles waiting for you</h2>
        ${waiting.length ? `<div class="mosaic stage-mosaic n${Math.min(waiting.length, 3)}">${mosaicTiles(waiting, projects, 5)}</div>`
          : `<p class="mosaic-empty">Every smile is on its way right now. New ones are added soon.</p>`}
        <p class="front-promise">Every penny goes to the day, and every smile is shared.</p>
        <p class="give-other">Know children who need a day of joy? <a href="/initiate">Request a smile</a></p>
      </section>`;
  }

  // Second version: a deeper arch with heavier, larger lettering and the tagline inside the arch.
  function bigArcHTML() {
    const words = `<tspan class="arc-1">Raavanaa</tspan> <tspan class="arc-2">Community</tspan>`;
    const tp = cls => `<text class="${cls}"><textPath href="#big-arc" startOffset="50%" text-anchor="middle" textLength="1180" lengthAdjust="spacingAndGlyphs">${words}</textPath></text>`;
    const heart = (x, y, s, c) => `<path d="M0 3.2C-5.5-3.4-13 2.6 0 12.5 13 2.6 5.5-3.4 0 3.2Z" transform="translate(${x} ${y}) scale(${s})" fill="${c}"/>`;
    const spark = (x, y, r) => `<path class="arc-spark" d="M${x} ${y - r}l${r * .3} ${r * .7} ${r * .7} ${r * .3}-${r * .7} ${r * .3}-${r * .3} ${r * .7}-${r * .3}-${r * .7}-${r * .7}-${r * .3} ${r * .7}-${r * .3}z"/>`;
    return `<svg viewBox="-30 -80 1060 560" role="img" aria-label="Raavanaa Community">
      <defs>
        <path id="big-arc" d="M60 450 A440 360 0 0 1 940 450"/>
        <linearGradient id="arc-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a9a62"/><stop offset="1" stop-color="#0c4a2c"/></linearGradient>
        <linearGradient id="arc-fire" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7c63a"/><stop offset=".4" stop-color="#e5851a"/><stop offset="1" stop-color="#c8381e"/></linearGradient>
      </defs>
      ${tp("arc-depth")}
      ${tp("arc-face")}
      ${heart(500, 250, 3.4, "#c8381e")}${heart(440, 290, 1.8, "#f2b21c")}${heart(560, 290, 1.8, "#f2b21c")}
      ${spark(400, 230, 16)}${spark(600, 230, 16)}${spark(70, 400, 18)}${spark(930, 400, 18)}
      <text class="arc-tag" x="500" y="372" text-anchor="middle">CREATING SMILES</text>
    </svg>`;
  }

  // "Raavanaa Community" set on an arc at the top of the front page.
  function arcTitleHTML() {
    return `<svg viewBox="0 0 1000 250" role="img" aria-label="Raavanaa Community">
      <defs>
        <path id="arc-path" d="M60 236 Q500 -16 940 236"/>
        <linearGradient id="arc-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8a55"/><stop offset="1" stop-color="#0f5132"/></linearGradient>
        <linearGradient id="arc-fire" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2b21c"/><stop offset=".45" stop-color="#e5851a"/><stop offset="1" stop-color="#c8381e"/></linearGradient>
      </defs>
      <path class="arc-spark" d="M30 228l6 14 14 6-14 6-6 14-6-14-14-6 14-6z"/>
      <path class="arc-spark" d="M970 228l6 14 14 6-14 6-6 14-6-14-14-6 14-6z"/>
      <text><textPath href="#arc-path" startOffset="50%" text-anchor="middle" textLength="930" lengthAdjust="spacingAndGlyphs"><tspan class="arc-1">Raavanaa</tspan> <tspan class="arc-2">Community</tspan></textPath></text>
    </svg>`;
  }

  // Rotating messages under the home headline.
  function sayingsHTML(site, list, start) {
    if (!list.length) return `<p>${esc(site.intro)}</p>`;
    const slide = (x, i) => `<figure class="saying${i === start ? " on" : ""}${x.image ? " has-img" : ""}" aria-hidden="${i !== start}" data-title="${esc(x.title || site.tagline)}">
        ${x.image ? (/\.svg$/i.test(x.image) ? `<img src="${esc(x.image)}" alt="" width="400" height="200">`
          : `<img src="${esc(imgUrl(x.image, 1600))}" srcset="${esc(imgUrl(x.image, 900))} 900w, ${esc(imgUrl(x.image, 1600))} 1600w" sizes="(min-width:1000px) 1100px, 100vw" alt="${esc(x.title || "")}" width="1600" height="800"${i === start ? "" : ' loading="lazy"'}>`) : ""}
        <figcaption>${esc(x.text)}</figcaption>
      </figure>`;
    return `<div class="sayings" aria-roledescription="carousel" aria-label="Our message" data-start="${start}">
      <div class="sayings-track">${list.map(slide).join("")}</div>
      ${list.length > 1 ? `<div class="sayings-dots">${list.map((_, i) => `<button type="button" aria-label="Slide ${i + 1}" aria-current="${i === start}"></button>`).join("")}</div>` : ""}
    </div>`;
  }

  // Shared slideshow engine: fades between items, with dots, swipe, and pauses while touched, hovered or typed in.
  let rotTimers = [];
  function rotator(box, o) {
    const items = [...box.querySelectorAll(o.item)], dots = [...box.querySelectorAll(o.dots)];
    if (items.length < 2) return;
    let cur = o.start || 0, paused = false, timer;
    const show = n => {
      const next = (n + items.length) % items.length;
      if (next === cur) return;
      cur = next;
      items.forEach((el, i) => { el.classList.toggle("on", i === cur); el.setAttribute("aria-hidden", String(i !== cur)); });
      dots.forEach((d, i) => d.setAttribute("aria-current", String(i === cur)));
      if (o.onShow) o.onShow(items[cur]);
    };
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const restart = () => { clearInterval(timer); if (!reduce) { timer = setInterval(() => { if (!paused && !document.hidden) show(cur + 1); }, o.interval || 6500); rotTimers.push(timer); } };
    dots.forEach((d, i) => d.onclick = () => { show(i); restart(); });
    const track = items[0].parentNode; let x0 = null;
    track.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; paused = true; }, { passive: true });
    track.addEventListener("touchend", e => { if (x0 !== null) { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); } x0 = null; paused = false; restart(); });
    box.addEventListener("mouseenter", () => paused = true);
    box.addEventListener("mouseleave", () => paused = false);
    box.addEventListener("focusin", e => { if (e.target.matches("input,textarea,select")) paused = true; });
    box.addEventListener("focusout", () => paused = false);
    restart();
  }

  // Swap a heading's text with a short fade.
  function fadeText(el, html, after) {
    if (!el) return;
    clearTimeout(el._t); el.style.opacity = "0";
    el._t = setTimeout(() => { el.innerHTML = html; if (after) after(); el.style.opacity = "1"; }, 320);
  }

  // Home headline turns through the sayings' titles ("Together – Real Change", "Small Steps – Big Smiles"...).
  // SURESH 21 Nov 2026: a new title on every visit (picked at random), coming in slowly from a soft blur, and
  // changing only very slowly after that (every 16 s, a 1.6 s blur-and-rise), never a quick flick.
  function startHeadlines(root, titles, start) {
    const head = root.querySelector(".headline");
    if (!head || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    head.classList.add("hl-slow", "hl-in");
    if (titles.length < 2) return;
    let k = start;
    rotTimers.push(setInterval(() => { if (document.hidden) return; k = (k + 1) % titles.length;
      head.classList.remove("hl-in"); head.classList.add("hl-out");
      setTimeout(() => { head.innerHTML = headline(titles[k]); fitHeadline(); setTimeout(fitHeadline, 80);
        head.classList.remove("hl-out"); void head.offsetWidth; head.classList.add("hl-in"); }, 1500); }, 16000));
  }
  function startSayings(root) {
    const box = root.querySelector(".sayings");
    if (!box) return;
    const head = root.querySelector(".headline");
    rotator(box, { item: ".saying", dots: ".sayings-dots button", start: Number(box.dataset.start) || 0, interval: 6500,
      onShow: el => fadeText(head, headline(el.dataset.title), fitHeadline) });
  }

  // Sign-up box on the home page: rotating title + message on a small picture.
  function followHTML(site, list, start) {
    const cur = list[start];
    const slide = (x, i) => `<figure class="follow-slide${i === start ? " on" : ""}${x.image && !/\.svg$/i.test(x.image) ? " photo" : ""}" aria-hidden="${i !== start}" data-title="${esc(x.title)}">
        ${x.image ? `<img src="${esc(/\.svg$/i.test(x.image) ? x.image : imgUrl(x.image, 900))}" alt="" width="400" height="160">` : ""}
        <figcaption>${esc(x.text)}</figcaption>
      </figure>`;
    return `
    <form class="panel follow follow-rot" name="updates" data-ajax data-start="${start}" data-done="Thank you! We'll email you when we post new updates.">
      <h2 class="follow-title">${headline(cur.title)}</h2>
      <div class="follow-track">${list.map(slide).join("")}</div>
      ${list.length > 1 ? `<div class="sayings-dots follow-dots">${list.map((_, i) => `<button type="button" aria-label="Message ${i + 1}" aria-current="${i === start}"></button>`).join("")}</div>` : ""}
      <input type="hidden" name="form-name" value="updates">
      <input type="hidden" name="page" value="home">
      <p hidden><label>Leave empty <input name="bot-field"></label></p>
      <label class="sr" for="su-name-home">Name</label>
      <input id="su-name-home" name="name" autocomplete="name" placeholder="Your name (optional)">
      <label class="sr" for="su-email-home">Email</label>
      <input id="su-email-home" name="email" type="email" required autocomplete="email" placeholder="you@example.com">
      <button class="btn" type="submit">Keep me posted</button>
      <p class="note fine">We only use your email to send you our news. <a href="/privacy">Privacy</a></p>
      <p class="note" data-msg hidden></p>
    </form>`;
  }
  function startFollow(root) {
    root.querySelectorAll(".follow-rot").forEach(box => {
      const title = box.querySelector(".follow-title");
      rotator(box, { item: ".follow-slide", dots: ".follow-dots button", start: Number(box.dataset.start) || 0, interval: 7600,
        onShow: el => fadeText(title, headline(el.dataset.title)) });
    });
  }

  // A rotating title with its message on a small picture (used at the top of the Volunteer page).
  function slideBoxHTML(list, start, tag = "h2") {
    const slide = (x, i) => `<figure class="follow-slide${i === start ? " on" : ""}${x.image && !/\.svg$/i.test(x.image) ? " photo" : ""}" aria-hidden="${i !== start}" data-title="${esc(x.title)}">
        ${x.image ? `<img src="${esc(/\.svg$/i.test(x.image) ? x.image : imgUrl(x.image, 900))}" alt="" width="400" height="160">` : ""}
        <figcaption>${esc(x.text)}</figcaption>
      </figure>`;
    return `<${tag} class="follow-title">${headline(list[start].title)}</${tag}>
      <div class="follow-track">${list.map(slide).join("")}</div>
      ${list.length > 1 ? `<div class="sayings-dots follow-dots">${list.map((_, i) => `<button type="button" aria-label="Message ${i + 1}" aria-current="${i === start}"></button>`).join("")}</div>` : ""}`;
  }

  // Smile Map: a hand-drawn map of Sri Lanka with a dot per village (never a home or school) where we have a project.
  // Positions come from places.json; a project is placed by the village or city named in its Location.
  async function renderMap(projects) {
    const P = (await load("/places.json").catch(() => ({}))).places || [];
    const LON0 = 79.45, LAT1 = 10.05, K = 250, C = Math.cos(7.9 * Math.PI / 180), FULL = [0, 0, 640, 1065];
    const xy = p => [(p.lng - LON0) * K * C, (LAT1 - p.lat) * K];
    const SN = ["", "Smiles in the Making", "Moments on the Way", "Days of Joy, Created"];
    const svgNS = "http://www.w3.org/2000/svg", mk = (tag, a, txt) => { const e = document.createElementNS(svgNS, tag); for (const k in a) e.setAttribute(k, a[k]); if (txt) e.textContent = txt; return e; };
    const findPlace = p => {
      const loc = `${p.location || ""}, ${p.city || ""}`.toLowerCase();
      const has = n => new RegExp(`(^|[^a-z])${n.toLowerCase()}([^a-z]|$)`).test(loc);
      return P.find(x => x.type === "village" && has(x.name)) || P.find(x => x.type === "city" && has(x.name)) || null;
    };
    const spots = new Map(), unplaced = [];
    projects.forEach(p => { const pl = findPlace(p); if (!pl) return unplaced.push(p); if (!spots.has(pl.name)) spots.set(pl.name, { place: pl, projects: [] }); spots.get(pl.name).projects.push(p); });
    const cityOfSpot = s => s.place.type === "city" ? s.place.name : s.place.city;
    const citiesUsed = new Set([...spots.values()].map(cityOfSpot).filter(Boolean));
    const svg = document.querySelector(".smap-svg"), ref = svg.querySelector("[data-smap-ref]"), lines = svg.querySelector("[data-smap-lines]"), dots = svg.querySelector("[data-smap-dots]");
    const card = document.querySelector("[data-smap-card]"), fig = card.parentElement;
    const money = p => { const st = stageNum(p), goal = numOf(p.goal) || (p.budget || []).reduce((t, x) => t + numOf(x && x.amount), 0), raised = (p.funders || []).reduce((t, x) => t + numOf(x && x.amount), 0);
      return st === 3 ? "Day done" : st === 2 ? "Fully funded" : goal ? `${Math.min(100, Math.round(raised / goal * 100))}% funded` : "Budget being prepared"; };
    const cardHTML = s => `<button type="button" class="smap-x" aria-label="Close">✕</button>
      <p class="smap-card-place">${esc(s.place.name)}${s.place.type === "village" && s.place.city ? `, ${esc(s.place.city)}` : ""}</p>
      ${s.projects.map(p => { const st = stageNum(p); return `<a class="smap-proj" href="/projects/${esc(p.slug)}">
        ${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : ""}
        <span class="smap-proj-t"><em class="sp sp${st}">${SN[st]}</em><b>${esc(p.title)}</b>${p.summary ? `<small>${esc(String(p.summary).slice(0, 110))}${String(p.summary).length > 110 ? "…" : ""}</small>` : ""}<i>${money(p)} · See the project →</i></span></a>`; }).join("")}`;
    let pinned = null;
    const show = (s, g, pin) => {
      card.innerHTML = cardHTML(s); card.hidden = false; pinned = pin ? s : pinned;
      card.querySelector(".smap-x").onclick = () => hide(true);
      dots.querySelectorAll(".sm-spot").forEach(d => d.classList.toggle("on", d === g));
      if (window.matchMedia("(max-width: 640px)").matches) { card.removeAttribute("style"); card.classList.add("sheet"); return; }
      card.classList.remove("sheet");
      const r = g.querySelector(".sm-dot").getBoundingClientRect(), f = fig.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight;
      let left = r.right - f.left + 16; if (left + w > f.width - 8) left = r.left - f.left - w - 16; if (left < 8) left = 8;
      let top = r.top - f.top - 20; top = Math.max(8, Math.min(top, f.height - h - 8));
      card.style.left = left + "px"; card.style.top = top + "px";
    };
    const hide = force => { if (pinned && !force) return; pinned = null; card.hidden = true; dots.querySelectorAll(".sm-spot").forEach(d => d.classList.remove("on")); };
    // Everything is drawn at size k (1 = whole island; smaller when zoomed in, so labels and dots keep their size on screen).
    const draw = k => {
      ref.textContent = ""; lines.textContent = ""; dots.textContent = "";
      const fs = n => (n * k).toFixed(1);
      P.filter(x => x.type === "ref").forEach(x => { const [cx, cy] = xy(x), left = x.side ? x.side === "left" : x.lng > 80.75; ref.append(mk("circle", { cx, cy, r: fs(2.4), class: "sm-ref-dot" }), mk("text", { x: cx + (left ? -7 : 7) * k, y: cy + 5 * k, "text-anchor": left ? "end" : "start", "font-size": fs(19), class: "sm-ref-name" }, x.name)); });
      P.filter(x => x.type === "city" && citiesUsed.has(x.name)).forEach(x => {
        const [cx, cy] = xy(x), left = x.lng > 81; const d = 6 * k;
        ref.append(mk("rect", { x: cx - d, y: cy - d, width: 2 * d, height: 2 * d, rx: fs(2), class: "sm-city", transform: `rotate(45 ${cx} ${cy})` }),
          mk("text", { x: cx + (left ? -16 : 16) * k, y: cy + 9 * k, "text-anchor": left ? "end" : "start", "font-size": fs(30), "stroke-width": fs(5), class: "sm-city-name" }, x.name));
      });
      spots.forEach(s => { if (s.place.type !== "village") return; const c = P.find(x => x.type === "city" && x.name === s.place.city); if (!c) return; const [a, b] = xy(s.place), [e, f] = xy(c); lines.append(mk("path", { d: `M${a} ${b} Q${(a + e) / 2 + 6 * k} ${(b + f) / 2 - 12 * k} ${e} ${f}`, "stroke-width": fs(1.5), "stroke-dasharray": `${fs(3)} ${fs(5)}`, class: "sm-link" })); });
      [...spots.values()].sort((a, b) => b.place.lat - a.place.lat).forEach(s => {
        const [cx, cy] = xy(s.place), st = Math.max(...s.projects.map(stageNum)), n = s.projects.length;
        const g = mk("g", { class: `sm-spot s${st}`, tabindex: 0, role: "button", "aria-label": `${s.place.name}: ${n} project${n > 1 ? "s" : ""}. Show details` });
        g.append(mk("circle", { cx, cy, r: fs(22), class: "sm-hit" }), mk("circle", { cx, cy, r: fs(15), "stroke-width": fs(2), class: "sm-halo" }), mk("circle", { cx, cy, r: fs(8 + Math.min(4, n - 1) * 1.5), "stroke-width": fs(3), class: "sm-dot" }));
        if (n > 1) g.append(mk("text", { x: cx, y: cy + 4 * k, "text-anchor": "middle", "font-size": fs(11), class: "sm-count" }, String(n)));
        if (s.place.type === "village") g.append(mk("text", { x: cx - 14 * k, y: cy + 6 * k, "text-anchor": "end", "font-size": fs(23), "stroke-width": fs(5), class: "sm-village-name" }, s.place.name));
        g.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(s, g, false); });
        g.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") setTimeout(() => { if (!card.matches(":hover")) hide(false); }, 250); });
        g.addEventListener("click", () => show(s, g, true));
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(s, g, true); } });
        dots.append(g);
      });
    };
    // Zoom: the whole island, or the North / the East where most projects are. The view glides between them.
    const box = (w, e, n, s) => { const [x1, y1] = xy({ lng: w, lat: n }), [x2, y2] = xy({ lng: e, lat: s }); return [x1, y1, x2 - x1, y2 - y1]; };
    const VIEWS = { all: FULL, north: box(79.55, 80.95, 9.98, 8.75), east: box(80.85, 82.0, 8.75, 6.85) };
    // Filter chips: "All", then one chip per project village. A chip glides the map to that village and opens its card.
    const chipBar = document.querySelector(".smap-zoom");
    const spotList = [...spots.values()].sort((a, b) => a.place.name.localeCompare(b.place.name));
    spotList.forEach(s => { const [cx, cy] = xy(s.place), w = 190, h = w * FULL[3] / FULL[2]; VIEWS["p:" + s.place.name] = [cx - w / 2, cy - h / 2, w, h]; });
    if (chipBar) chipBar.innerHTML = `<button type="button" class="chip" data-smap-zoom="all" aria-pressed="true">All</button>`
      + spotList.map(s => `<button type="button" class="chip" data-smap-zoom="p:${esc(s.place.name)}" aria-pressed="false">${esc(s.place.name)}</button>`).join("");
    let cur = FULL.slice();
    const zoomTo = name => {
      const to = VIEWS[name] || FULL, from = cur.slice(), t0 = performance.now(), dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
      hide(true); svg.classList.toggle("zoomed", name !== "all");
      document.querySelectorAll("[data-smap-zoom]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.smapZoom === name)));
      const step = now => {
        const t = dur ? Math.min(1, (now - t0) / dur) : 1, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        cur = from.map((v, i) => v + (to[i] - v) * e);
        svg.setAttribute("viewBox", cur.map(v => v.toFixed(1)).join(" "));
        if (t === 1) { draw(cur[2] / 640); if (name.startsWith("p:")) { const n = name.slice(2), g = [...dots.querySelectorAll(".sm-spot")].find(x => (x.getAttribute("aria-label") || "").startsWith(n + ":")), sp = spots.get(n); if (g && sp) show(sp, g, true); } }
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    document.querySelectorAll("[data-smap-zoom]").forEach(b => b.addEventListener("click", () => zoomTo(b.dataset.smapZoom)));
    draw(1);
    card.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") hide(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") hide(true); });
    svg.addEventListener("click", e => { if (!e.target.closest(".sm-spot")) hide(true); });
    // Numbers and the list under the map (the same places, for reading without the map).
    const placed = [...spots.values()].flatMap(s => s.projects), days = projects.filter(p => stageNum(p) === 3).length;
    document.querySelector("[data-smap-stats]").innerHTML = `<b>${spots.size}</b> place${spots.size === 1 ? "" : "s"} · <b>${placed.length}</b> project${placed.length === 1 ? "" : "s"} on the map · <b>${days}</b> day${days === 1 ? "" : "s"} of joy delivered`;
    const byCity = {}; spots.forEach(s => { const c = cityOfSpot(s) || s.place.name; (byCity[c] = byCity[c] || []).push(s); });
    const li = (p, sub) => `<li><a href="/projects/${esc(p.slug)}"><i class="sp-dot sp${stageNum(p)}"></i><span>${esc(p.title)}<small>${sub}${SN[stageNum(p)]}</small></span></a></li>`;
    document.querySelector("[data-smap-list]").innerHTML = Object.keys(byCity).sort().map(c => `<section><h2>${esc(c)}</h2><ul>${byCity[c].flatMap(s => s.projects.map(p => li(p, s.place.type === "village" ? esc(s.place.name) + " · " : ""))).join("")}</ul></section>`).join("")
      + (unplaced.length ? `<section class="smap-soon"><h2>Place being confirmed</h2><ul>${unplaced.map(p => li(p, "")).join("")}</ul></section>` : "");
  }

  // Smile Map, second version (/smile-map-v2): close dots merge into numbered bubbles; free zoom.
  async function renderMapV2(projects) {
    const P = (await load("/places.json").catch(() => ({}))).places || [];
    const LON0 = 79.45, LAT1 = 10.05, K = 250, C = Math.cos(7.9 * Math.PI / 180), FULL = [0, 0, 640, 1065];
    const xy = p => [(p.lng - LON0) * K * C, (LAT1 - p.lat) * K];
    const SN = ["", "Smiles in the Making", "Moments on the Way", "Days of Joy, Created"];
    const svgNS = "http://www.w3.org/2000/svg", mk = (tag, a, txt) => { const e = document.createElementNS(svgNS, tag); for (const k in a) e.setAttribute(k, a[k]); if (txt) e.textContent = txt; return e; };
    const findPlace = p => {
      const loc = `${p.location || ""}, ${p.city || ""}`.toLowerCase();
      const has = n => new RegExp(`(^|[^a-z0-9])${n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(loc);
      return P.find(x => x.type === "village" && has(x.name)) || P.find(x => x.type === "city" && has(x.name)) || null;
    };
    const spots = new Map(), unplaced = [];
    projects.forEach(p => { const pl = findPlace(p); if (!pl) return unplaced.push(p); if (!spots.has(pl.name)) spots.set(pl.name, { place: pl, projects: [] }); spots.get(pl.name).projects.push(p); });
    const cityOfSpot = s => s.place.type === "city" ? s.place.name : s.place.city;
    const citiesUsed = new Set([...spots.values()].map(cityOfSpot).filter(Boolean));
    const svg = document.querySelector(".smap-svg"), ref = svg.querySelector("[data-smap-ref]"), lines = svg.querySelector("[data-smap-lines]"), dots = svg.querySelector("[data-smap-dots]");
    const card = document.querySelector("[data-smap-card]"), fig = card.parentElement;
    const money = p => { const st = stageNum(p), goal = numOf(p.goal) || (p.budget || []).reduce((t, x) => t + numOf(x && x.amount), 0), raised = (p.funders || []).reduce((t, x) => t + numOf(x && x.amount), 0);
      return st === 3 ? "Day done" : st === 2 ? "Fully funded" : goal ? `${Math.min(100, Math.round(raised / goal * 100))}% funded` : "Budget being prepared"; };
    const cardHTML = s => `<button type="button" class="smap-x" aria-label="Close">✕</button>
      <p class="smap-card-place">${esc(s.place.name)}${s.place.type === "village" && s.place.city ? `, ${esc(s.place.city)}` : ""}</p>
      ${projHTML(s, false)}`;
    let pinned = null;
    const show = (s, g, pin) => { card.innerHTML = cardHTML(s); dots.querySelectorAll(".sm-spot").forEach(d => d.classList.toggle("on", d === g)); place(g, pin); };
    const hide = force => { if (pinned && !force) return; pinned = null; card.hidden = true; dots.querySelectorAll(".sm-spot").forEach(d => d.classList.remove("on")); };
    // Everything is drawn at size k (1 = whole island; smaller when zoomed in, so labels and dots keep their size on screen).
    // Dots that would overlap at this zoom merge into one numbered bubble; tapping it zooms in until they separate.
    let zoomBox = () => {};
    const projHTML = (s, short) => s.projects.map(p => { const st = stageNum(p); return `<a class="smap-proj${short ? " short" : ""}" href="/projects/${esc(p.slug)}">
        ${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : ""}
        <span class="smap-proj-t"><em class="sp sp${st}">${SN[st]}</em><b>${esc(p.title)}</b>${!short && p.summary ? `<small>${esc(String(p.summary).slice(0, 110))}${String(p.summary).length > 110 ? "…" : ""}</small>` : ""}<i>${money(p)} · See the project →</i></span></a>`; }).join("");
    const groupHTML = members => `<button type="button" class="smap-x" aria-label="Close">✕</button>
      <p class="smap-card-place">${members.length} places</p><p class="smap-card-hint">Tap the bubble to zoom in</p>
      ${members.map(m => `<p class="smap-card-sub">${esc(m.s.place.name)}</p>${projHTML(m.s, true)}`).join("")}`;
    const wire = (g, open, onClick) => {
      g.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") open(false); });
      g.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") setTimeout(() => { if (!card.matches(":hover")) hide(false); }, 250); });
      g.addEventListener("click", () => { if (dragged) return; onClick(); });
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } });
    };
    const draw = k => {
      ref.textContent = ""; lines.textContent = ""; dots.textContent = "";
      const fs = n => (n * k).toFixed(1);
      P.filter(x => x.type === "ref").forEach(x => { const [cx, cy] = xy(x), left = x.side ? x.side === "left" : x.lng > 80.75; ref.append(mk("circle", { cx, cy, r: fs(2.4), class: "sm-ref-dot" }), mk("text", { x: cx + (left ? -7 : 7) * k, y: cy + 5 * k, "text-anchor": left ? "end" : "start", "font-size": fs(19), class: "sm-ref-name" }, x.name)); });
      P.filter(x => x.type === "city" && citiesUsed.has(x.name)).forEach(x => {
        const [cx, cy] = xy(x), left = x.lng > 81; const d = 6 * k;
        ref.append(mk("rect", { x: cx - d, y: cy - d, width: 2 * d, height: 2 * d, rx: fs(2), class: "sm-city", transform: `rotate(45 ${cx} ${cy})` }),
          mk("text", { x: cx + (left ? -16 : 16) * k, y: cy + 9 * k, "text-anchor": left ? "end" : "start", "font-size": fs(30), "stroke-width": fs(5), class: "sm-city-name" }, x.name));
      });
      // Group the dots that are too close at this zoom.
      const items = [...spots.values()].map(s => { const [x, y] = xy(s.place); return { s, x, y, n: s.projects.length }; }).sort((a, b) => b.n - a.n);
      const R = 30 * k, groups = [];
      items.forEach(it => { const g = groups.find(c => Math.hypot(c.x - it.x, c.y - it.y) < R); if (g) { g.m.push(it); g.x = g.m.reduce((t, m) => t + m.x, 0) / g.m.length; g.y = g.m.reduce((t, m) => t + m.y, 0) / g.m.length; } else groups.push({ x: it.x, y: it.y, m: [it] }); });
      const singles = groups.filter(g => g.m.length === 1).map(g => g.m[0]);
      if (singles.filter(m => m.s.place.type === "village").length <= 6) spots.forEach(s => { if (s.place.type !== "village" || !singles.some(m => m.s === s)) return; const c = P.find(x => x.type === "city" && x.name === s.place.city); if (!c) return; const [a, b] = xy(s.place), [e, f] = xy(c); lines.append(mk("path", { d: `M${a} ${b} Q${(a + e) / 2 + 6 * k} ${(b + f) / 2 - 12 * k} ${e} ${f}`, "stroke-width": fs(1.5), "stroke-dasharray": `${fs(3)} ${fs(5)}`, class: "sm-link" })); });
      groups.sort((a, b) => a.y - b.y).forEach(gr => {
        if (gr.m.length > 1) {
          const n = gr.m.reduce((t, m) => t + m.n, 0), st = Math.max(...gr.m.flatMap(m => m.s.projects.map(stageNum)));
          const g = mk("g", { class: `sm-spot sm-group s${st}`, tabindex: 0, role: "button", "aria-label": `${gr.m.length} places, ${n} projects. Zoom in` });
          g.append(mk("circle", { cx: gr.x, cy: gr.y, r: fs(26), class: "sm-hit" }), mk("circle", { cx: gr.x, cy: gr.y, r: fs(19), "stroke-width": fs(2), class: "sm-halo" }),
            mk("circle", { cx: gr.x, cy: gr.y, r: fs(13 + Math.min(7, n) * 0.9), "stroke-width": fs(3), class: "sm-dot" }),
            mk("text", { x: gr.x, y: gr.y + 5.5 * k, "text-anchor": "middle", "font-size": fs(15), class: "sm-count" }, String(n)));
          const zoomIn = () => { const xs = gr.m.map(m => m.x), ys = gr.m.map(m => m.y); hide(true); zoomBox(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)); };
          wire(g, pin => { card.innerHTML = groupHTML(gr.m); place(g, pin); }, zoomIn);
          dots.append(g); return;
        }
        const it = gr.m[0], s = it.s, st = Math.max(...s.projects.map(stageNum)), n = it.n, cx = it.x, cy = it.y;
        const g = mk("g", { class: `sm-spot s${st}`, tabindex: 0, role: "button", "aria-label": `${s.place.name}: ${n} project${n > 1 ? "s" : ""}. Show details` });
        g.append(mk("circle", { cx, cy, r: fs(22), class: "sm-hit" }), mk("circle", { cx, cy, r: fs(15), "stroke-width": fs(2), class: "sm-halo" }), mk("circle", { cx, cy, r: fs(8 + Math.min(4, n - 1) * 1.5), "stroke-width": fs(3), class: "sm-dot" }));
        if (n > 1) g.append(mk("text", { x: cx, y: cy + 4 * k, "text-anchor": "middle", "font-size": fs(11), class: "sm-count" }, String(n)));
        const roomy = singles.every(o => o === it || Math.abs(o.y - cy) > 26 * k || Math.abs(o.x - cx) > 120 * k);
        if (s.place.type === "village" && roomy) g.append(mk("text", { x: cx - 14 * k, y: cy + 6 * k, "text-anchor": "end", "font-size": fs(23), "stroke-width": fs(5), class: "sm-village-name" }, s.place.name));
        wire(g, pin => show(s, g, pin), () => show(s, g, true));
        dots.append(g);
      });
    };
    // Show the card next to a bubble (computer) or as a sheet at the bottom of the map (phone).
    const place = (g, pin) => {
      card.hidden = false; if (pin) pinned = true;
      card.querySelector(".smap-x").onclick = () => hide(true);
      if (window.matchMedia("(max-width: 640px)").matches) { card.removeAttribute("style"); card.classList.add("sheet"); return; }
      card.classList.remove("sheet");
      const r = g.querySelector(".sm-dot").getBoundingClientRect(), f = fig.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight;
      let left = r.right - f.left + 16; if (left + w > f.width - 8) left = r.left - f.left - w - 16; if (left < 8) left = 8;
      let top = r.top - f.top - 20; top = Math.max(8, Math.min(top, f.height - h - 8));
      card.style.left = left + "px"; card.style.top = top + "px";
    };
    // Zoom and move: quick views, + and −, pinch with two fingers, drag with the mouse, Ctrl + scroll.
    const AR = FULL[3] / FULL[2];
    const fit = (x1, y1, x2, y2, minW) => { let w = Math.max(x2 - x1, minW), h = Math.max(y2 - y1, w * AR); w = Math.max(w, h / AR); h = w * AR; return [(x1 + x2) / 2 - w / 2, (y1 + y2) / 2 - h / 2, w, h]; };
    const clamp = v => { let [x, y, w] = v; w = Math.max(70, Math.min(FULL[2], w)); const h = w * AR; x = Math.max(-w * .3, Math.min(x, FULL[2] - w * .7)); y = Math.max(-h * .3, Math.min(y, FULL[3] - h * .7)); return [x, y, w, h]; };
    const geo = (w, e, n, s, minW = 0) => { const [x1, y1] = xy({ lng: w, lat: n }), [x2, y2] = xy({ lng: e, lat: s }); return fit(x1, y1, x2, y2, minW); };
    const pts = [...spots.values()].map(s => xy(s.place));
    const VIEWS = {
      ours: pts.length ? fit(Math.min(...pts.map(p => p[0])) - 60, Math.min(...pts.map(p => p[1])) - 60, Math.max(...pts.map(p => p[0])) + 60, Math.max(...pts.map(p => p[1])) + 60, 260) : FULL,
      north: geo(79.6, 80.95, 9.98, 8.7), centre: geo(79.9, 81.25, 8.9, 6.9), east: geo(80.95, 82.0, 8.75, 6.85), all: FULL.slice()
    };
    VIEWS.ours[1] = Math.max(0, Math.min(VIEWS.ours[1], Math.min(...pts.map(p => p[1]), 1e9) - 70));
    let cur = VIEWS.ours.slice(), raf = 0;
    const setBox = v => { cur = clamp(v); svg.setAttribute("viewBox", cur.map(n => n.toFixed(1)).join(" ")); svg.classList.toggle("zoomed", cur[2] < 560); };
    const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => draw(cur[2] / FULL[2])); };
    const press = name => document.querySelectorAll("[data-smap-zoom]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.smapZoom === name)));
    const glide = (to, name) => {
      hide(true); press(name || "");
      const from = cur.slice(), dest = clamp(to), t0 = performance.now(), dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600;
      const step = now => { const t = dur ? Math.min(1, (now - t0) / dur) : 1, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setBox(from.map((v, i) => v + (dest[i] - v) * e)); if (t < 1) requestAnimationFrame(step); else draw(cur[2] / FULL[2]); };
      requestAnimationFrame(step);
    };
    zoomBox = (x1, y1, x2, y2) => glide(fit(x1 - 50, y1 - 50, x2 + 50, y2 + 50, Math.max(70, cur[2] * 0.4)));
    const zoomAt = (f, px, py) => { const [x, y, w, h] = cur; setBox([px - (px - x) * f, py - (py - y) * f, w * f, h * f]); press(""); redraw(); };
    const toUser = (cx, cy) => { const p = new DOMPoint(cx, cy).matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y]; };
    document.querySelectorAll("[data-smap-zoom]").forEach(b => b.addEventListener("click", () => glide(VIEWS[b.dataset.smapZoom] || FULL, b.dataset.smapZoom)));
    document.querySelectorAll("[data-smap-step]").forEach(b => b.addEventListener("click", () => { hide(true); const f = b.dataset.smapStep === "in" ? 0.6 : 1 / 0.6; glide([cur[0] + cur[2] * (1 - f) / 2, cur[1] + cur[3] * (1 - f) / 2, cur[2] * f, cur[3] * f]); }));
    let dragged = false, drag = null;
    svg.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" || e.button) return; drag = { x: e.clientX, y: e.clientY, v: cur.slice() }; dragged = false; });
    window.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!dragged && Math.hypot(dx, dy) < 5) return; if (!dragged) { dragged = true; hide(true); svg.classList.add("grabbing"); }
      const s = cur[2] / svg.getBoundingClientRect().width; setBox([drag.v[0] - dx * s, drag.v[1] - dy * s, drag.v[2], drag.v[3]]); press(""); });
    window.addEventListener("pointerup", () => { if (!drag) return; drag = null; svg.classList.remove("grabbing"); if (dragged) { redraw(); setTimeout(() => dragged = false, 0); } });
    svg.addEventListener("wheel", e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); hide(true); const [px, py] = toUser(e.clientX, e.clientY); zoomAt(Math.exp(e.deltaY * 0.01), px, py); }, { passive: false });
    let pinch = null; // two fingers: pinch to zoom, move to pan (one finger still scrolls the page)
    const mid = t => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2], gap = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    svg.addEventListener("touchstart", e => { if (e.touches.length !== 2) return; e.preventDefault(); hide(true); const [mx, my] = mid(e.touches); pinch = { d: gap(e.touches), v: cur.slice(), p: toUser(mx, my), m: [mx, my] }; }, { passive: false });
    svg.addEventListener("touchmove", e => { if (!pinch || e.touches.length !== 2) return; e.preventDefault();
      const f = pinch.d / Math.max(10, gap(e.touches)), [mx, my] = mid(e.touches), s = pinch.v[2] * f / svg.getBoundingClientRect().width;
      const [x, y, w, h] = pinch.v, [px, py] = pinch.p; setBox([px - (px - x) * f - (mx - pinch.m[0]) * s, py - (py - y) * f - (my - pinch.m[1]) * s, w * f, h * f]); press(""); }, { passive: false });
    svg.addEventListener("touchend", e => { if (pinch && e.touches.length < 2) { pinch = null; redraw(); } });
    setBox(cur); press("ours"); draw(cur[2] / FULL[2]);
    card.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") hide(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") hide(true); });
    svg.addEventListener("click", e => { if (!e.target.closest(".sm-spot")) hide(true); });
    // Numbers and the list under the map (the same places, for reading without the map).
    const placed = [...spots.values()].flatMap(s => s.projects), days = projects.filter(p => stageNum(p) === 3).length;
    document.querySelector("[data-smap-stats]").innerHTML = `<b>${spots.size}</b> place${spots.size === 1 ? "" : "s"} · <b>${placed.length}</b> project${placed.length === 1 ? "" : "s"} on the map · <b>${days}</b> day${days === 1 ? "" : "s"} of joy delivered`;
    const byCity = {}; spots.forEach(s => { const c = cityOfSpot(s) || s.place.name; (byCity[c] = byCity[c] || []).push(s); });
    const li = (p, sub) => `<li><a href="/projects/${esc(p.slug)}"><i class="sp-dot sp${stageNum(p)}"></i><span>${esc(p.title)}<small>${sub}${SN[stageNum(p)]}</small></span></a></li>`;
    document.querySelector("[data-smap-list]").innerHTML = Object.keys(byCity).sort().map(c => `<section><h2>${esc(c)}</h2><ul>${byCity[c].flatMap(s => s.projects.map(p => li(p, s.place.type === "village" ? esc(s.place.name) + " · " : ""))).join("")}</ul></section>`).join("")
      + (unplaced.length ? `<section class="smap-soon"><h2>Place being confirmed</h2><ul>${unplaced.map(p => li(p, "")).join("")}</ul></section>` : "");
  }

  // How far a project has come: 1 Initiated, 2 Activated, 3 Impact (from its Status in the admin page).
  // Stage comes from the facts, not only the status word: Impact once the day is marked complete,
  // Activated only when the project is verified and its whole budget is covered, otherwise Initiated.
  const stageNum = p => {
    if (/complete/i.test(p.status || "")) return 3;
    const goal = numOf(p.goal) || (p.budget || []).filter(x => x && x.item).reduce((s, x) => s + numOf(x.amount), 0);
    const raised = (p.funders || []).filter(x => x && x.name).reduce((s, x) => s + numOf(x.amount), 0);
    return p.verified && goal > 0 && raised >= goal ? 2 : 1;
  };
  // The steps of the "Activating" ring. Used on the project page and in the project lists, so both show the same %.
  const numOf = v => { const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
  // Each stage has its own checklist, so a project is never shown as "activating" once it is Activated.
  //   Initiated -> "Activating": verified, budget ready, fully funded. All three done = Activated.
  //   Activated -> "Preparing the day": date, place and transport, volunteers (+ any extra steps).
  //   Impact    -> "Delivered": the day happened, story shared, money reported, expectations reviewed.
  function ringSteps(p) {
    const goal = numOf(p.goal) || (p.budget || []).filter(x => x && x.item).reduce((s, x) => s + numOf(x.amount), 0);
    const raised = (p.funders || []).filter(x => x && x.name).reduce((s, x) => s + numOf(x.amount), 0);
    const st = stageNum(p);
    if (st === 1) return [
      { name: vLabel(p), done: p.verified ? 1 : 0, c: "#1f7a47" },
      { name: "Budgeted", done: goal > 0 ? 1 : 0, c: "#3f9a5f" },
      // Reserved (pledged, not yet received) gets its own line (SURESH, 17 Nov 2026): one neat line each, no names.
      ...(FEAT.pledge && FEAT.reserve ? (() => {
        const res = (p.funders || []).filter(x => x && x.name && x.pledged).reduce((s, x) => s + numOf(x.amount), 0);
        const fun = Math.max(0, raised - res);
        return [{ name: "Funded", done: goal > 0 ? Math.min(1, fun / goal) : 0, c: "#eaa21c", pctLabel: true, icon: "tick" },
          ...(res > 0 ? [{ name: "Reserved", done: goal > 0 ? Math.min(1, res / goal) : 0, c: "#c8381e", pctLabel: true, icon: "res" }] : [])];
      })() : [{ name: "Funded", done: goal > 0 ? Math.min(1, raised / goal) : 0, c: "#eaa21c", pctLabel: true, ...(FEAT.pledge ? { icon: "tick" } : {}) }])
    ];
    if (st === 2) return [
      { name: "Date confirmed", done: p.date_set ? 1 : 0, c: "#eaa21c" },
      { name: "Place and transport booked", done: p.booked ? 1 : 0, c: "#d08a00" },
      { name: "Volunteers ready", done: p.volunteers ? 1 : 0, c: "#b97a06" },
      ...(p.steps || []).filter(x => x && x.name).map((x, k) => ({ name: x.name, done: x.done ? 1 : 0, c: ["#8f6200", "#b4560a", "#0f5132"][k % 3] }))
    ];
    const ex = (p.expectations || []).filter(x => x && x.text);
    return [
      { name: "The day happened", done: 1, c: "#1f7a47" },
      { name: "Story shared", done: (p.updates || []).length || p.story ? 1 : 0, c: "#3f9a5f" },
      { name: "Money reported", done: (p.budget || []).some(x => x && x.item) ? 1 : 0, c: "#e5851a" },
      { name: "Expectations reviewed", done: !ex.length ? 0 : ex.filter(x => x.result).length / ex.length, c: "#c8381e" }
    ];
  }
  // Initiated: the % is only how much is funded so far; verified and budgeted are shown as ticks but do not count (SURESH, 6 Nov 2026).
  const ringArcs = p => stageNum(p) === 1 ? ringSteps(p).filter(x => x.name === "Funded" || x.name === "Reserved") : ringSteps(p);
  // Activated = fully funded, so its % is 100 everywhere (SURESH 25 Nov 2026: the Kandy trip showed 33% after it reached 100%,
  // because the ring had switched to counting the preparation steps). The steps still show as ticks on the project page.
  const ringPercent = p => stageNum(p) === 2 ? 100 : stageNum(p) === 1 ? Math.min(100, Math.round(ringArcs(p).reduce((s, x) => s + x.done, 0) * 100)) : (st => Math.round(st.reduce((s, x) => s + x.done, 0) / st.length * 100))(ringArcs(p));
  // Small icons at the end of a step line: a tick for money funded, a little bookmark for money reserved (17 Nov 2026).
  const STEP_ICON = { tick: `<span class="st-ic tick" aria-label="funded">✓</span>`,
    res: `<svg class="st-ic res" viewBox="0 0 24 24" width="15" height="15" aria-label="reserved"><path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" fill="currentColor"/></svg>` };
  const RING_TEXT = {
    1: { h: "Activating", l: "FUNDED", done: "ACTIVATED", aria: "funded so far" },
    2: { h: "Fully funded · Preparing the day", l: "FUNDED", done: "FUNDED", aria: "funded" },
    3: { h: "Delivered", l: "REPORTING", done: "DELIVERED", aria: "of the results reported" }
  };

  // One line per project: small picture, title, category and place, and the progress circle with its %.
  function projectRowsHTML(list, all) {
    const ring = pct => `<svg class="pl-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" pathLength="100" class="pl-track"/><circle cx="20" cy="20" r="16" pathLength="100" class="pl-fill" stroke-dasharray="${pct} 100" transform="rotate(-90 20 20)"/></svg>`;
    return `${list.map(p => { const i = all.indexOf(p), pct = ringPercent(p); return `
          <a class="plist-row" role="listitem" href="/projects/${slugOf(p)}">
            <span class="plist-thumb" style="${coverStyle(p, i)}">${p.cover ? `<img src="${esc(imgUrl(p.cover, 160))}" alt="" loading="lazy" width="56" height="56">` : ""}</span>
            <span class="plist-main"><b>${esc(p.title)}</b><small>${esc([...new Set([p.theme, cityOf(p), p.location].filter(Boolean))].join(" · "))}</small></span>
            <span class="plist-pct">${ring(pct)}<b>${pct}%</b></span>
          </a>`; }).join("")}`;
  }

  // Sponsors' names and their share of the budget, shown under "Funded" (SURESH, 6 Nov 2026).
  const whoFunded = p => { const b = budgetOf(p); if (!b.goal || !b.funders.length) return "";
    return `<small class="who">${b.funders.map(f => `${esc(f.name)}${f.hide_amount ? "" : ` <b>${Math.round(numOf(f.amount) / b.goal * 100)}%</b>`}`).join(" · ")}</small>`; };
  // The Donate button (wireDonate): it opens the giving form.
  const DONATE_BTN = `<button class="donate-btn" type="button" data-donate><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg><span>${FEAT.sponsor ? "Donate" : FEAT.pledge ? "Be the smile" : "Give in loving memory"}</span></button>`;
  // The "Activating" circle with its list of steps, as on a project page.
  function activatingPanelHTML(p, cls = "") {
    const T = RING_TEXT[stageNum(p)];
    // Activated: one full "Funded" ring, with the preparation steps listed under a Funded ✓ line.
    const steps = stageNum(p) === 2 ? [{ name: "Funded", done: 1, c: "#eaa21c" }, ...ringSteps(p)] : ringSteps(p);
    const ringPct = ringPercent(p);
    const ringSVG = () => {
      const arcs = stageNum(p) === 2 ? [{ done: 1, c: "#eaa21c" }] : ringArcs(p), n = arcs.length, gap = n === 1 ? 0 : n > 5 ? 16 : 20, len = 360 / n - gap; // the rounded ends eat most of the gap
      const arc = (start, l, c, o) => l > 0.01 ? `<circle cx="60" cy="60" r="48" fill="none" stroke="${c}" stroke-opacity="${o}" stroke-width="13" stroke-linecap="round" pathLength="360" stroke-dasharray="${l.toFixed(2)} ${(360 - l).toFixed(2)}" stroke-dashoffset="${(-start).toFixed(2)}"/>` : "";
      return `<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="${ringPct}% ${T.aria}">
        <g transform="rotate(-90 60 60)">${stageNum(p) === 1 ? (() => { let at = 0; return arc(0, 359.9, arcs[0].c, .18) + arcs.map(x => { const l = Math.min(360 - at, 360 * x.done), o = arc(at, l, x.c, 1); at += l; return o; }).join(""); })()
          : arcs.map((x, k) => { const start = k * (len + gap) + gap / 2; return arc(start, len, x.c, .18) + arc(start, len * x.done, x.c, 1); }).join("")}</g>
        <text x="60" y="${ringPct === 100 ? 60 : 62}" text-anchor="middle" class="ring-n">${ringPct}%</text>
        <text x="60" y="${ringPct === 100 ? 77 : 78}" text-anchor="middle" class="ring-l">${ringPct === 100 ? T.done : T.l}</text>
      </svg>`;
    };
    return `
      <div class="panel activating ${cls}">
        <h2>${T.h}</h2>
        <div class="ring-row">
          ${ringSVG()}
          <ul class="ring-steps">${steps.map(x => { const d = x.done; return `<li class="${d >= 1 ? "done" : d > 0 ? "part" : ""}"><i style="background:${x.c}"></i><span>${esc(x.name)}${x.name === "Funded" && !FEAT.pledge ? whoFunded(p) : ""}</span><b>${x.icon && d > 0 ? `${Math.round(d * 100)}% ${STEP_ICON[x.icon]}` : d >= 1 ? "✓" : x.pctLabel && d > 0 ? Math.round(d * 100) + "%" : "–"}</b></li>`; }).join("")}</ul>
        </div>
      </div>`;
  }

  // Initiated project page: "Let's take this to 100%". The ring, then a fold that opens to show
  // what is still missing (each with the % it adds) and a short note form to help make it happen.
  // No payment here: people send a note and the team gets back to them.
  function goPanelHTML(p, site, cls) {
    const steps = ringSteps(p), pct = ringPercent(p), b = budgetOf(p), money = n => moneyOf(site, n, p);
    const kids = String(p.reach || "").match(/\d+/), slice = 100 / ringArcs(p).length, id = cls.replace(/\W/g, "");
    const need = Math.max(0, b.goal - b.raised);
    const say = [
      d => d ? "Our team visited and saw the need for themselves." : "Our team visits to make sure the need is real. Know this place? Tell us below.",
      d => d ? `We know what the day costs: ${money(b.goal)}.` : "We're working out what the day will cost: transport, food, tickets.",
      d => d >= 1 ? "Every part of the day is covered." : b.goal ? `${money(need)} still to go. This is where you come in.` : "Opens as soon as the budget is ready. Send a note and we'll tell you first."
    ];
    // Ways to help without money (SURESH, 17 Nov 2026: food, van, share with friends, local support...).
    const WAYS = FEAT.pledge ? ["Food for the day", "A van or transport", "Share it with friends", "Local support in the village", "Help on the day", "Gifts or school things"]
      : ["Give something the day needs (a van, food, gifts)", "Help on the day", "Share it with friends"];
    const ring = activatingPanelHTML(p, "").match(/<svg class="ring"[\s\S]*?<\/svg>/)[0];
    const raw = ringArcs(p).reduce((t, x) => t + Math.min(1, x.done), 0) * slice;
    return `<div class="panel activating go100 ${cls}" data-pct="${pct}" data-raw="${raw}">
        <p class="go-kicker">Activating</p>
        <h2 class="go-title">Help ${kids ? kids[0] + " children" : "these children"} laugh. <span>Let's take this to 100%.</span></h2>
        <div class="ring-row">
          ${ring}
          <ul class="ring-steps">${steps.map(x => { const d = x.done; return `<li class="${d >= 1 ? "done" : d > 0 ? "part" : ""}"><i style="background:${x.c}"></i><span>${esc(x.name)}${x.name === "Funded" && !FEAT.pledge ? whoFunded(p) : ""}</span><b>${x.icon && d > 0 ? `${Math.round(d * 100)}% ${STEP_ICON[x.icon]}` : d >= 1 ? "✓" : x.pctLabel && d > 0 ? Math.round(d * 100) + "%" : "–"}</b></li>`; }).join("")}</ul>
        </div>
        ${pct < 100 && FEAT.left ? `<button class="go-open" type="button" aria-expanded="false" aria-controls="go-fold-${id}"><span>See what's left to reach 100%</span><i aria-hidden="true">⌄</i></button>
        <div class="go-fold" id="go-fold-${id}" hidden>
          <ol class="go-list">${b.funders.map(f => `<li class="done funder"><i aria-hidden="true">${f.hide_amount ? "♥" : (b.goal ? Math.round(numOf(f.amount) / b.goal * 100) : 0) + "%"}</i>
              <div><b>${esc(f.name)}</b>${f.tribute ? `<small class="f-tribute">${esc(f.tribute)}</small>` : ""}<span>Pledged ${money(numOf(f.amount))} for this day.</span></div></li>`).join("")}
            <li class="todo" data-add="${slice * (1 - Math.min(1, b.goal ? b.raised / b.goal : 0))}" tabindex="0">
              <i aria-hidden="true">${b.goal ? Math.max(0, 100 - b.pct) + "%" : "…"}</i>
              <div><b>${b.funders.length ? "Still to fund" : "Be the first sponsor"}</b><span>${b.goal ? `${money(need)} still to go. This is where you come in.` : "Opens as soon as the budget is ready. Send a note and we'll tell you first."}</span></div></li></ol>
          <div class="go-form go-make">
            <h3>Make this happen</h3>
            <div class="mk-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-mk="donate"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg>${FEAT.sponsor ? "Donate" : "Give"}</button><button type="button" role="tab" aria-selected="false" data-mk="other">Help another way</button></div>
            ${!FEAT.sponsor && FEAT.pledge ? `<div class="mk-pane" data-mkpane="donate"><p class="go-sub">${FEAT.reserve ? "Reserve your part, and a volunteer will contact you with the ways to fund. A reservation is held for 24 hours, then that part opens to everyone again." : "Add your name and your part, and a volunteer will contact you with the ways to fund."}</p>
              <button type="button" class="mk-jump" data-jump-give><span>Be the smile</span><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>` : `<div class="mk-pane" data-mkpane="donate"><p class="go-sub">${!FEAT.sponsor ? "Give towards this day in loving memory of someone dear to you. Their name goes with the gift, and a volunteer will reply to you personally." : canGive(p) ? `Give towards this day by card. Secure payment by ${GIVE_BY}.` : "Want to give towards this day? Tap Donate and tell us what you would like to give. A volunteer will reply to you personally."}</p>${DONATE_BTN}
              <p class="go-name"${FEAT.sponsor ? "" : " hidden"}><a href="/moment?project=${encodeURIComponent(slugOf(p))}">♡ Give in someone's name, or on behalf of a family or group →</a></p></div>`}
            <form class="mk-pane" data-mkpane="other" hidden name="make-it-happen" data-ajax data-done="Thank you! Your note is on its way. We'll be in touch soon, and you'll be part of a child's best day.">
              ${FEAT.pledge ? `<p class="go-sub mk-community">A day of joy is made by many hands. Someone cooks the food, someone drives the van, someone tells a friend, someone in the village makes sure every child is there. <b>Raavanaa is a community of volunteers</b>, and there is a place in it for you. Choose how you would like to help, and a volunteer will be in touch.</p>` : `<p class="go-sub">Not able to give money? There are other ways to make this day happen. Tell us how you'd like to help and we'll reach out.</p>`}
              <input type="hidden" name="form-name" value="make-it-happen">
              <input type="hidden" name="project" value="${esc(slugOf(p))}">
              <p hidden><label>Leave empty <input name="bot-field"></label></p>
              <fieldset class="go-ways"><legend>I'd love to…</legend>
                ${WAYS.map(w => `<label class="go-way"><input type="checkbox" name="ways[]" value="${esc(w)}"><span>${esc(w)}</span></label>`).join("")}
              </fieldset>
              <label for="go-name-${id}">Your name<input id="go-name-${id}" name="name" required maxlength="80" autocomplete="name"></label>
              <label for="go-contact-${id}">Email or WhatsApp<input id="go-contact-${id}" name="contact" required maxlength="120"></label>
              <label for="go-note-${id}">A note for us (optional)<textarea id="go-note-${id}" name="note" maxlength="1500" rows="3"></textarea></label>
              <button class="btn go-send" type="submit">${FEAT.pledge ? "Be part of Raavanaa" : "Send my note"}</button>
              <p class="note" data-msg hidden></p>
            </form>
          </div>
        </div>` : ""}
      </div>`;
  }
  function wireGo(root) {
    root.querySelectorAll(".go100").forEach(box => {
      const pct = +box.dataset.pct, n = box.querySelector(".ring-n"), l = box.querySelector(".ring-l");
      const label = l ? l.textContent : "";
      const setN = (v, preview) => { if (n) n.textContent = Math.round(v) + "%"; if (l) l.textContent = preview ? "IF DONE" : label; box.classList.toggle("previewing", !!preview); };
      // The % counts up the first time the panel comes into view.
      const countUp = () => { const t0 = performance.now(), dur = 1100; const step = now => { const t = Math.min(1, (now - t0) / dur); setN(pct * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
      if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window) || box.offsetParent === null) setN(pct);
      else { setN(0); const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); countUp(); } }, { threshold: .4 }); io.observe(box); }
      const btn = box.querySelector(".go-open"), fold = box.querySelector(".go-fold");
      if (btn && fold) btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", open); fold.hidden = !open; box.classList.toggle("open", open);
        btn.querySelector("span").textContent = open ? "Fold it away" : "See what's left to reach 100%";
      });
      // "Make this happen": Donate, or Help another way.
      box.querySelectorAll(".go-make").forEach(m => m.querySelectorAll("[data-mk]").forEach(t => t.addEventListener("click", () => {
        m.querySelectorAll("[data-mk]").forEach(x => x.setAttribute("aria-selected", String(x === t)));
        m.querySelectorAll("[data-mkpane]").forEach(pn => { pn.hidden = pn.dataset.mkpane !== t.dataset.mk; });
      })));
      // Pointing at a missing step shows what the % would become once it's done.
      box.querySelectorAll(".go-list li.todo").forEach(li => {
        const on = () => setN(Math.min(100, +box.dataset.raw + +li.dataset.add), true), off = () => setN(pct);
        li.addEventListener("mouseenter", on); li.addEventListener("mouseleave", off);
        li.addEventListener("focus", on); li.addEventListener("blur", off);
      });
    });
  }
  /* "At a glance": tap or click the small icon to open; tap it again, tap anywhere else or press Esc to close. */
  function wireGlance(root) {
    root.querySelectorAll(".glance").forEach(g => {
      const b = g.querySelector(".glance-btn");
      const set = on => { g.classList.toggle("is-open", on); g.classList.toggle("is-shut", !on); b.setAttribute("aria-expanded", String(on)); };
      b.addEventListener("click", e => { e.stopPropagation(); set(!g.classList.contains("is-open")); });
      g.addEventListener("pointerleave", e => { if (e.pointerType !== "mouse") return; set(false); g.classList.remove("is-shut"); });
    });
    if (!wireGlance.done) {
      wireGlance.done = true;
      const shut = () => document.querySelectorAll(".glance.is-open").forEach(g => { g.classList.remove("is-open"); g.querySelector(".glance-btn").setAttribute("aria-expanded", "false"); });
      document.addEventListener("click", e => { if (!e.target.closest(".glance")) shut(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") shut(); });
    }
  }

  // Donate on a project page. While the project still needs money it opens that project's giving form; otherwise the
  // Raavanaa Fund. With card payments off (launch, SURESH 12 Nov 2026) the form is "I'd like to give": a volunteer replies.
  function wireDonate(root, slug) {
    // "Fund it fully" by the budget: opens the form there with the whole amount left already filled in (18 Nov 2026).
    root.querySelectorAll("[data-fullfund]").forEach(fb => fb.addEventListener("click", () => {
      const btn = fb.parentElement.querySelector("[data-donate]");
      if (!root.querySelector(".pl-inline")) { btn.dataset.noScroll = "1"; btn.click(); delete btn.dataset.noScroll; }
      const fl = root.querySelector(".pl-inline [data-fill]"); if (fl) fl.click();
      const own = root.querySelector('.pl-inline [name="own"]'); if (own) own.scrollIntoView({ block: "center", behavior: "smooth" });
    }));
    // The Be the smile button by the budget: its words take turns (Be the smile, Make the moment...).
    root.querySelectorAll(".b-give [data-donate] span").forEach(sp => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let k = 0; setInterval(() => { k = (k + 1) % PL_SAYS.length; sp.classList.remove("in"); void sp.offsetWidth; sp.textContent = PL_SAYS[k]; sp.classList.add("in"); }, 2600);
    });
    // The light "Be the smile ↓" in Make this happen goes down to the one giving form, by the budget (17 Nov 2026).
    root.querySelectorAll("[data-jump-give]").forEach(j => j.addEventListener("click", () => {
      const btn = root.querySelector(".b-give [data-donate]");
      if (!btn) return;
      // The Budget panel comes into view from its top, with the form open inside it (SURESH, 17 Nov 2026).
      if (!root.querySelector(".pl-inline")) { btn.dataset.noScroll = "1"; btn.click(); delete btn.dataset.noScroll; }
      const panel = btn.closest(".panel") || btn;
      panel.style.scrollMarginTop = "86px"; panel.scrollIntoView({ block: "start", behavior: "smooth" });
    }));
    root.querySelectorAll("[data-donate]").forEach(b => b.addEventListener("click", () => {
      // Memory launch (FEAT.sponsor off): every gift goes through the moment page, in someone's memory.
      // The short form opens right here, under the button (SURESH, 17 Nov 2026); /give?project= still works as a page.
      if (!FEAT.sponsor && FEAT.pledge && GIVE_OPEN.has(slug)) {
        if (!G_CTX) { location.href = (TA_PATH ? "/ta" : "") + "/give?project=" + encodeURIComponent(slug); return; }
        const at = b.closest(".b-give, .mk-pane, .mny-need") || b, open = document.querySelector(".pl-inline");
        if (open && open.previousElementSibling === at) { open.scrollIntoView({ block: "start", behavior: "smooth" }); return; }
        if (open) open.remove();
        const box = document.createElement("div"); box.className = "pl-inline";
        at.after(box);
        renderGive(box, G_CTX.site, G_CTX.projects, G_CTX.give, { inline: true, q: new URLSearchParams({ project: slug }) });
        const shut = document.createElement("button"); shut.type = "button"; shut.className = "pl-shut"; shut.setAttribute("aria-label", "Close"); shut.textContent = "×";
        shut.addEventListener("click", () => box.remove()); box.prepend(shut);
        if (!b.dataset.noScroll) box.scrollIntoView({ block: "start", behavior: "smooth" });
        return;
      }
      if (!FEAT.sponsor && FEAT.moment) { location.href = (TA_PATH ? "/ta" : "") + "/moment?for=memory" + (GIVE_OPEN.has(slug) ? "&project=" + encodeURIComponent(slug) : "") + "#mo-step-2"; return; }
      location.href = (TA_PATH ? "/ta" : "") + (GIVE_OPEN.has(slug) ? "/give?project=" + encodeURIComponent(slug) : "/fund");
    }));
  }
  function wireTale(root, open, remember) {
    const box = root.querySelector(".ptale"); if (!box) return;
    const text = box.querySelector(".ptale-text"), btn = box.querySelector(".ptale-more");
    const label = btn.querySelector("span").textContent;
    const set = v => { box.classList.toggle("open", v); btn.setAttribute("aria-expanded", v); btn.querySelector("span").textContent = v ? "Show less" : label; remember(v); };
    // Only offer the link when the story is longer than three lines.
    // The opening paragraph shows in full; the link opens the rest (SURESH, 6 Nov 2026).
    if (text.querySelector(".ptale-rest")) { btn.hidden = false; set(open); } else box.classList.add("short");
    btn.addEventListener("click", () => { const v = !box.classList.contains("open"); set(v); if (!v) box.scrollIntoView({ block: "nearest", behavior: "smooth" }); });
  }

  // Card payments are open for a verified project that is still being planned and isn't fully covered yet.
  // PayHere (Sri Lanka) takes rupees, so it serves rupee projects; Stripe takes Canadian dollars (rupee projects
  // too, at the team's rate). Until one is switched on in Netlify, Donate shows the pilot note.
  let GIVE_ON = false;
  const GIVE_OPEN = new Set();
  let G_CTX = null;   // site, projects and gift totals, so the giving form can open in place on a project page
  // "?p=<funded %>" on shared project links (SURESH 25 Nov 2026: "why 100% not updated in the sharing snapshot").
  // WhatsApp and Facebook keep a link's preview by its address, so the same link shared again showed the old %.
  // A new % makes a new address and so a fresh preview with today's ring. The page itself ignores ?p.
  const sharePct = slug => { const p = G_CTX && (G_CTX.projects || []).find(x => slugOf(x) === slug); if (!p) return "";
    const n = stageNum(p), b = budgetOf(p); return n < 3 && b.goal > 0 ? (n === 2 || b.pct >= 100 ? 100 : b.pct) : ""; };
  const withPct = (url, slug) => { const v = sharePct(slug); return v === "" ? url : url + (url.includes("?") ? "&" : "?") + "p=" + v; };
  let GIVE_RATE = 0; // Sri Lankan rupees to one Canadian dollar (site.json "rate_lkr_per_cad"), Stripe only
  let GIVE_BY = "Stripe", GIVE_CUR = "CAD";
  const isRupees = p => /rs|lkr|රු|ரூ/i.test(p.currency || "");
  const takesCards = p => GIVE_CUR === "LKR" ? isRupees(p) : (!p.currency || /^\s*\$\s*$/.test(p.currency) || (isRupees(p) && GIVE_RATE > 0));
  // What a project still needs, in the card currency (rupees with PayHere, Canadian dollars with Stripe).
  const leftCad = p => { const b = budgetOf(p), left = Math.max(0, b.goal - b.raised); if (GIVE_CUR === "LKR") return isRupees(p) ? left : 0; return isRupees(p) ? (GIVE_RATE ? left / GIVE_RATE : 0) : left; };
  // Money in the card currency: "Rs 2,500" or "$25".
  const cash = (n, cur = GIVE_CUR) => (cur === "LKR" ? "Rs " : "$") + (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const canGive = p => { if (!GIVE_ON || !p || !p.verified || stageNum(p) !== 1 || !takesCards(p)) return false; const b = budgetOf(p); return b.goal > 0 && b.raised < b.goal; };

  // Budget figures for a project: what it costs, what supporters have given, and the share funded.
  // Pledges this browser sent in the last hour (sessionStorage "raav-pledged"): shown on the project at once.
  function justPledged(add) {
    let list = [];
    try { list = JSON.parse(sessionStorage.getItem("raav-pledged") || "[]").filter(x => x && Date.now() - x.at < 3600e3); } catch (e) { list = []; }
    if (add) { list.push({ ...add, at: Date.now() }); try { sessionStorage.setItem("raav-pledged", JSON.stringify(list)); } catch (e) { /* storage blocked */ } }
    return list.map(x => ({ name: x.name, amount: x.amount, pledged: true, ref: x.ref, slug: x.slug, ...(x.hide_amount ? { hide_amount: true } : {}) }));
  }
  function budgetOf(p) {
    const lines = (p.budget || []).filter(x => x && x.item), funders = (p.funders || []).filter(x => x && x.name);
    const goal = numOf(p.goal) || lines.reduce((s, x) => s + numOf(x.amount), 0);
    const raised = funders.reduce((s, x) => s + numOf(x.amount), 0);
    return { lines, funders, goal, raised, pct: goal ? Math.min(100, Math.round(raised / goal * 100)) : 0, full: goal > 0 && raised >= goal };
  }
  const moneyOf = (site, n, p) => `${esc((p && p.currency) || site.currency || "$")}${Math.round(n).toLocaleString("en-US")}`;
  // The same budget box as on a project page, for the project featured at the top of a stage page.
  // Budget by stage. Initiated: the total only. Activated: funding and who sponsored it.
  // Impact (delivered): funding, sponsors and the full breakdown of where the money went.
  // Budget by stage.
  //   Initiated: budget, how much is funded, what is still needed; the estimated costs on the project's Budget tab.
  //   Activated: the budget, "Fully funded", and the sponsors.
  //   Impact: the same, plus where the money went.
  function budgetDetailHTML(p, site, detail = false) {
    const b = budgetOf(p), money = n => moneyOf(site, n, p), st = stageNum(p);
    if (!b.goal) return `<p class="b-wait">The budget for this project is being prepared. It will be shown here as soon as it is ready.</p>`;
    const sum = b.lines.reduce((t, x) => t + numOf(x.amount), 0);
    const listOf = (h, total) => b.lines.length ? `<h3 class="money-h">${h}</h3><ul class="bx-list">${b.lines.map(x => `<li><span>${esc(x.item)}</span><b>${money(numOf(x.amount))}</b></li>`).join("")}</ul>
        <p class="bx-total"><span>${total}</span><b>${money(sum)}</b></p>` : "";
    const funders = h => b.funders.length ? `<h3 class="money-h">${h}</h3>
        <ul class="funders">${b.funders.map(f => `<li><span class="avatar">${esc(String(f.name).trim().split(/\s+/).filter(w => /^[A-Za-z0-9]/.test(w)).map(w => w[0]).slice(0, 2).join("").toUpperCase())}</span><span class="f-name">${esc(f.name)}${f.pledged && FEAT.reserve ? ` <em class="f-pledged">reserved</em>` : ""}${f.tribute ? `<small class="f-tribute">${esc(f.tribute)}</small>` : ""}</span>${numOf(f.amount) && !f.hide_amount ? `<b>${money(numOf(f.amount))}</b>` : ""}</li>`).join("")}</ul>` : "";
    if (st === 1) {
      const need = Math.max(0, b.goal - b.raised), kids = String(p.reach || "").match(/\d+/);
      return `
        <p class="b-top"><b>${money(b.goal)}</b> <span>budget</span></p>
        <div class="b-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b.pct}" aria-label="Share of the budget funded"><i style="width:${b.pct}%"></i></div>
        <dl class="b-facts">
          <div><dt>Funded</dt><dd>${b.pct}%</dd></div>
          <div><dt>Still needed</dt><dd>${money(need)}</dd></div>
        </dl>
        <p class="b-ask">${b.raised ? "Help us close the gap" : "Be the first to sponsor"}${kids ? ` and give ${kids[0]} children their day` : " and make this day happen"}.</p>
        ${!FEAT.sponsor && FEAT.pledge && GIVE_OPEN.has(slugOf(p)) ? `<div class="b-give" id="be-the-smile">${DONATE_BTN}<button type="button" class="b-full" data-fullfund><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8 12.3l2.6 2.6L16.2 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Fund it fully</button></div>` : ""}
        ${funders(FEAT.pledge ? "Making it happen" : "Pledged so far")}
        ${detail ? listOf("Estimated costs", "Estimated total") : ""}`;
    }
    return `
        <p class="b-top"><b>${money(b.goal)}</b> <span>budget</span> <em class="b-full">✓ Fully funded</em></p>
        ${funders("Made possible by")}
        ${st === 3 ? listOf("Where the money went", "Total spent") : ""}`;
  }
  // Expected impact: set by the organizers while a project is Activated, closed with a tick for each one after the day.
  function expectHTML(p) {
    const xs = (p.expectations || []).filter(x => x && x.text), st = stageNum(p);
    if (!xs.length || st === 1) return "";
    const R = { met: ["✓", "Met"], partly: ["◐", "Partly met"], not: ["✗", "Not met"] };
    if (st === 2) return `<section class="expect">
        <h3 class="money-h">What the organizers expect this day to achieve</h3>
        <ul class="expect-list">${xs.map(x => `<li><span class="ex-mark pending" aria-hidden="true">◎</span><span>${esc(x.text)}</span></li>`).join("")}</ul>
        <p class="note">After the day, the organizers come back and mark each one, so you can see if it was achieved.</p>
      </section>`;
    const met = xs.filter(x => x.result === "met").length;
    return `<section class="expect closed">
        <h3 class="money-h">Did the day deliver?</h3>
        <p class="ex-score"><b>${met} of ${xs.length}</b> expectations met</p>
        <ul class="expect-list">${xs.map(x => { const r = R[x.result] || ["…", "Being reviewed"]; return `<li class="r-${esc(x.result || "open")}"><span class="ex-mark" aria-hidden="true">${r[0]}</span><span>${esc(x.text)}${x.note ? `<small>${esc(x.note)}</small>` : ""}</span><em>${r[1]}</em></li>`; }).join("")}</ul>
      </section>`;
  }
  function budgetBoxHTML(p, site, link = true) {
    const b = budgetOf(p);
    return `<div class="panel budget${b.full && stageNum(p) > 1 ? " full" : ""}">
      <h2>Budget</h2>
      ${budgetDetailHTML(p, site)}
      ${link ? `<a class="more" href="/projects/${slugOf(p)}">See the full project →</a>` : ""}
    </div>`;
  }


  // Compact list of every project at a stage: small picture, title, and how far along it is.
  function projectListHTML(list, all, title) {
    if (!list.length) return "";
    return `
      <section class="plist-wrap">
        <h2 class="section-title lined">${title} <span class="count">${list.length}</span></h2>
        <div class="plist" role="list">
          <div class="plist-head" aria-hidden="true"><span>Project</span><span>Progress</span></div>
          ${projectRowsHTML(list, all)}
        </div>
      </section>`;
  }
  const STAGE_NAMES = ["Initiated", "Activated", "Impact"];
  const journey = p => {
    const n = stageNum(p);
    return `<div class="journey" aria-label="Stage: ${STAGE_NAMES[n - 1]}">
      <span class="j-dots">${[1, 2, 3].map(k => `<i class="${k <= n ? "done s" + k : ""}"></i>`).join("")}</span>
      <span class="j-now s${n}">${STAGE_NAMES[n - 1]}</span>
      <span class="j-org">${esc(p.organization)}</span>
    </div>`;
  };
  const stageNav = slug => `<nav class="stage-steps" aria-label="Stages">${Object.entries(STAGES).map(([k, s], i) =>
    `${i ? '<span class="arrow" aria-hidden="true">→</span>' : ""}<a class="stage-tab stat-${s.key}" href="/${k}" ${k === slug ? 'aria-current="page"' : ""}>${s.label}</a>`).join("")}</nav>`;
  const ICON = d => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  // What each stage page says and shows. A project appears on a stage page once it has reached that stage.
  const STAGE_PAGES = {
    initiated: {
      n: 1, title: "Initiated", hero: "/img/hero-initiated-wide.svg",
      lead: "Every project begins when someone tells us about children who are waiting for a day of joy. We visit, listen and make sure the need is real.",
      tags: [
        ["Reaching out", '<path d="M4 6.5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H10l-4 3v-3H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"/><path d="M7 10.5h8M7 13.5h5"/>'],
        ["Spotting an opportunity", '<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5.5 5.5"/><path d="m10 6.8.9 2 2.2.3-1.6 1.5.4 2.1-1.9-1-1.9 1 .4-2.1L6.9 9.1l2.2-.3z" fill="currentColor" stroke="none"/>'],
        ["Opening a relationship", '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 19c.6-3.4 2.6-5 5.5-5 1.6 0 2.9.5 4 1.5 1.1-1 2.4-1.5 4-1.5 2.9 0 4.9 1.6 5.5 5"/>'],
        ["Starting an initiative", '<path d="M12 21v-9"/><path d="M12 14c-4 0-6-2.2-6.5-6 3.9 0 6 2 6.5 6z"/><path d="M12 11c0-4 2.3-6 6.5-6.5 0 4-2.3 6-6.5 6.500z"/>']
      ],
      links: [
        ["How a project starts", "/how-it-works#initiated", '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01" stroke-width="2.2"/>'],
        ["Suggest a project", "/initiate", '<path d="M12 21v-9"/><path d="M12 14c-4 0-6-2.2-6.5-6 3.9 0 6 2 6.5 6z"/><path d="M12 11c0-4 2.3-6 6.5-6.5 0 4-2.3 6-6.5 6.5z"/>']
      ],
      heading: 'Projects we have <span class="stage-word s1">Initiated</span>', empty: { text: "Our first projects are being planned. Check back soon, or tell us about a need you see.", btn: "Suggest a project", href: "/contact?topic=suggest" },
      cta: { title: "Have an idea for a project?", text: "Every project on this page began with someone reaching out. Tell us about a need you see, and we'll explore it together.", btn: "Suggest a project", href: "/contact?topic=suggest" },
      next: { slug: "activated", kicker: "Next stage", label: "Activated", text: "See the projects that have moved into action." }
    },
    activated: {
      n: 2, title: "Activated", hero: "/img/hero-activated-wide.svg",
      lead: "The day is funded and being planned: the date, the place, the food and the helpers.",
      tags: [
        ["Taking part", '<circle cx="12" cy="6" r="2.6"/><path d="M5 5l4.5 5.500h5L19 5"/><path d="M9.5 10.500V20M14.5 10.500V20"/>'],
        ["Getting organized", '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.500h6v-2H9z"/><path d="m8.5 11 1.5 1.5 2.5-2.500M8.5 16l1.5 1.5 2.5-2.500M14.5 11.500h2M14.5 16.500h2"/>'],
        ["Working together", '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>'],
        ["Making it happen", '<path d="M13 2.5 5 13.500h6l-1 8 8-11h-6z"/>']
      ],
      links: [
        ["How funding works", "/how-it-works#activated", '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01" stroke-width="2.2"/>'],
        ["Sponsor or help", "/contact", '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.2c0 5.6-7.5 10.2-7.5 10.2z"/>']
      ],
      heading: 'Projects we have <span class="stage-word s2">Activated</span>', empty: { text: "Nothing is in action just yet. Our first projects are getting ready to start, and you can follow them from the beginning.", btn: "See what we have initiated", href: "/initiated" },
      cta: { title: "Want to take part?", text: "Projects move because people show up. Lend an hour, a skill or a helping hand, and be part of what's happening.", btn: FEAT.volunteers ? "Volunteer with us" : "Get in touch", href: FEAT.volunteers ? "/volunteers#join" : "/contact" },
      next: { slug: "impact", kicker: "Next stage", label: "Impact", text: "See the difference these projects are making." }
    },
    impact: {
      n: 3, title: "Impact", hero: "/img/hero-impact-wide.svg",
      lead: "The day has happened. Here are the stories and the pictures, so everyone who gave can see the smiles they created.",
      tags: [
        ["Smiles created", '<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.8 2.4 2.7 4 2.700s3-.9 4-2.7"/><path d="M8.5 9.500h.01M15.5 9.500h.01" stroke-width="2.6"/>'],
        ["Everyone included", '<circle cx="12" cy="6" r="2.4"/><circle cx="5.5" cy="9" r="2"/><circle cx="18.5" cy="9" r="2"/><path d="M7.5 20c.4-4 2-6 4.5-6s4.1 2 4.5 6M2 18c.3-2.6 1.4-4 3.5-4M22 18c-.3-2.6-1.4-4-3.5-4"/>'],
        ["Real connection", '<path d="M12 20s-7.5-4.6-7.5-10.200A4.3 4.3 0 0 1 12 7.600a4.3 4.3 0 0 1 7.5 2.200c0 5.6-7.5 10.2-7.5 10.200z"/>'],
        ["Lasting difference", '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>']
      ],
      links: [
        ["How we share results", "/how-it-works#impact", '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01" stroke-width="2.2"/>'],
        ["Be part of the next one", FEAT.volunteers ? "/volunteers#join" : "/contact", '<circle cx="12" cy="6" r="2.4"/><circle cx="5.5" cy="9" r="2"/><circle cx="18.5" cy="9" r="2"/><path d="M7.5 20c.4-4 2-6 4.5-6s4.1 2 4.5 6M2 18c.3-2.6 1.4-4 3.5-4M22 18c-.3-2.6-1.4-4-3.5-4"/>']
      ],
      heading: '<span class="stage-word s3">Impact</span> Stories', empty: { text: "Our first impact stories are on the way. As soon as a trip or event has happened, the smiles and the stories will be shared here.", btn: "See what we have initiated", href: "/initiated" },
      cta: { title: "Be part of the next one", text: "Every smile on this page started with people who cared. Stay close and see what we create together next.", btn: "Get involved", href: FEAT.volunteers ? "/volunteers#join" : "/contact" },
      next: { slug: "initiated", kicker: "Back to the start", label: "Initiated", text: "See every project from where it began." }
    }
  };

  // Raavanaa Post: a monthly magazine. Tabs Video · Stories · Photos · Numbers; the Video magazine is designed first.
  function renderPost(app, data) {
    const iss = (data.issues || [])[0]; if (!iss) { app.innerHTML = "<p>The first issue is on its way.</p>"; return; }
    const play = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
    const all = [iss.featured, ...iss.sections.flatMap(x => x.items)];
    const card = (v, vertical) => { const k = all.indexOf(v); return `
      <button type="button" class="vm-card${vertical ? " vm-reel" : ""}" data-v="${k}">
        <span class="vm-thumb"><img src="${esc(v.poster)}" alt="" loading="lazy"><span class="vm-play">${play}</span><span class="vm-dur">${esc(v.duration)}</span></span>
        <span class="vm-meta">${v.tag ? `<small>${esc(v.tag)}</small>` : ""}<b>${esc(v.title)}</b>${v.summary && !vertical ? `<span>${esc(v.summary)}</span>` : ""}</span>
      </button>`; };
    const f = iss.featured;
    app.innerHTML = `
      <div class="vm">
        <header class="vm-mast">
          <p class="vm-issue">Issue ${String(iss.issue).padStart(2, "0")} · ${esc(iss.month)}</p>
          <h1 class="sr">Raavanaa Post, ${esc(iss.month)}</h1>
          <p class="vm-tag">${document.body.dataset.variant === "royal" ? "Chronicles of the kingdom" : "The month in smiles"}</p>
        </header>
        <nav class="vm-tabs" role="tablist" aria-label="Magazine sections">
          ${[["video", "Video"], ["stories", "Stories"], ["photos", "Photos"], ["numbers", "Numbers"]].map(([k, l], j) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${j === 0}">${l}</button>`).join("")}
        </nav>
        <section class="vm-pane" data-pane="video">
          <div class="vm-cinema">
            <button type="button" class="vm-hero" data-v="0" aria-label="Play: ${esc(f.title)}">
              <img src="${esc(f.poster)}" alt="">
              <span class="vm-hero-shade"></span>
              <span class="vm-hero-text"><small>${esc(f.kicker)} · ${esc(f.duration)}</small><b>${esc(f.title)}</b><span>${esc(f.summary)}</span></span>
              <span class="vm-play big">${play}</span>
            </button>
            <div class="vm-lead">
              <h2>${esc(iss.headline)}</h2>
              <p>${esc(iss.intro)}</p>
              <ul class="vm-nums">${iss.numbers.map(n => `<li><b>${esc(n.value)}</b><span>${esc(n.label)}</span></li>`).join("")}</ul>
            </div>
          </div>
          ${iss.sections.map(sec => `
            <section class="vm-sec${sec.vertical ? " vm-sec-reels" : ""}">
              <div class="vm-sec-head"><h2>${esc(sec.title)}</h2><p>${esc(sec.note || "")}</p></div>
              <div class="${sec.vertical ? "vm-reels" : "vm-grid"}">${sec.items.map(v => card(v, sec.vertical)).join("")}</div>
            </section>`).join("")}
          <section class="vm-end">
            <p>Every film here began with someone who cared.</p>
            <div><a class="btn" href="/initiated">Help start the next one</a> <a href="#keep-posted" data-subscribe>Get the Post every month →</a></div>
          </section>
        </section>
        ${["stories", "photos", "numbers"].map(k => `<section class="vm-pane vm-soon" data-pane="${k}" hidden><p>The ${k} section of the Post is designed next.</p></section>`).join("")}
        <dialog class="vm-player" aria-label="Video player"><div class="vm-frame"></div><div class="vm-under"><b></b><a class="vm-proj"></a></div><button type="button" class="vm-x" aria-label="Close">✕</button></dialog>
      </div>`;
    app.querySelectorAll(".vm-tabs [data-tab]").forEach(b => b.onclick = () => {
      app.querySelectorAll(".vm-tabs [data-tab]").forEach(x => x.setAttribute("aria-selected", x === b));
      app.querySelectorAll(".vm-pane").forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab);
    });
    const dlg = app.querySelector(".vm-player"), frame = dlg.querySelector(".vm-frame");
    app.querySelectorAll("[data-v]").forEach(b => b.onclick = () => {
      const v = all[+b.dataset.v], e = v.url ? embedFor(v.url) : "";
      frame.className = "vm-frame" + (b.classList.contains("vm-reel") ? " tall" : "");
      frame.innerHTML = e ? `<iframe src="${esc(e)}?autoplay=1" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
        : `<img src="${esc(v.poster)}" alt=""><p class="vm-nofilm">${play}<span>The film will play here in the real issue.</span></p>`;
      dlg.querySelector(".vm-under b").textContent = v.title;
      const pj = dlg.querySelector(".vm-proj"); pj.hidden = !v.project; if (v.project) { pj.href = `/projects/${v.project}`; pj.textContent = "See the project →"; }
      dlg.showModal();
    });
    const close = () => { dlg.close(); frame.innerHTML = ""; };
    dlg.querySelector(".vm-x").onclick = close;
    dlg.addEventListener("click", e => { if (e.target === dlg) close(); });
    dlg.addEventListener("close", () => { frame.innerHTML = ""; });
    const sub = app.querySelector("[data-subscribe]"); if (sub) sub.href = "/overview#keep-posted";
  }

  // "How it works": one page, a tab for each stage of a project.
  const HOW = [
    { key: "initiated", n: 1, label: "Initiated", title: "How a project starts",
      intro: "Every project begins with someone who sees children waiting for a day of joy: a teacher, a parent, a neighbour, a children's home.",
      steps: [
        ["Someone reaches out", "Anyone can tell us about an opportunity through the Initiate form: who the children are, where they are, and what kind of day would mean the most."],
        ["We visit and listen", "A member of our team visits, meets the people who care for the children and makes sure the need is real. The project is then marked Visited and verified. During the visit we show you how feedback and reporting work, and you send us a practice message together. If you do not use a phone, a family member or someone close to you can be your contact. Afterwards, you tell us privately how the visit went."],
        ["We plan the day and the budget", "Together we decide what the day looks like and what it will cost: transport, food, tickets, small gifts. The estimated costs are shown on the project's Budget tab."],
        ["The project goes on the site", "It appears under Initiated with its budget and how much is still needed, so sponsors can see exactly what their gift will do."]
      ],
      cta: ["Suggest a project", "/initiate"] },
    { key: "activated", n: 2, label: "Activated", title: "How funding works",
      intro: "A project becomes Activated when its full budget is covered. From then on, it is all about making the day happen.",
      steps: [
        ["Sponsors cover the budget", "A family, a group of friends or an association pledges the amount. Once the total is reached, the project shows Fully funded and the sponsors' names."],
        ["The date is set", "We agree the date with the children's home or school and the families."],
        ["Place and transport are booked", "Tickets, the venue, the bus or van and the food are arranged and paid for."],
        ["Volunteers get ready", "Helpers sign up to travel with the group, keep everyone safe and make sure every child is included."]
      ],
      cta: ["Sponsor or help", "/contact"] },
    { key: "impact", n: 3, label: "Impact", title: "How we share results",
      intro: "After the day, we come back and show everyone who gave what their gift created.",
      steps: [
        ["The story is written", "A short story of the day: what happened, who came and the moments the children will remember."],
        ["Pictures and video are shared", "Shared with care and with permission, following our child-safety rules."],
        ["Every dollar is shown", "The Budget tab changes to Where the money went, line by line, with the total spent."],
        ["You tell us how it went", "The organizers get a short feedback form after the day, and anyone can report a concern at any time. Concerns go to our safeguarding lead and an independent reviewer."],
        ["The numbers are counted", "How many children, families and volunteers took part, shown on the project and on the Impact page."]
      ],
      cta: ["Be part of the next one", FEAT.volunteers ? "/volunteers#join" : "/contact"] }
  ];
  function renderHow(app) {
    const pick = () => Math.max(0, HOW.findIndex(h => "#" + h.key === location.hash));
    const pane = h => `
      <h2 class="follow-title">${esc(h.title)}</h2>
      <p class="big">${esc(h.intro)}</p>
      <ol class="how-steps s${h.n}">${h.steps.map(([t, d], k) => `<li><span class="how-n">${k + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join("")}</ol>
      <p class="how-actions"><a class="btn" href="${h.cta[1]}">${esc(h.cta[0])}</a> <a href="/${h.key}">See ${esc(h.label)} projects →</a></p>`;
    const draw = k => {
      app.innerHTML = `<section class="intro about-page how-page">
        <span class="eyebrow">How it works</span>
        <h1 class="follow-title">${headline("The Journey of a Smile")}</h1>
        <p>Every project travels the same three stages, so you always know where it stands and where the money goes.</p>
        <div class="tabs how-tabs" role="tablist">${HOW.map((h, i) => `<button class="tab" role="tab" style="--c:${["#1f7a47", "#d08a00", "#c8381e"][i]}" aria-selected="${i === k}" data-k="${i}"><span>${i + 1}. ${h.label}</span></button>`).join("")}</div>
        <section class="folder" role="tabpanel" style="--c:${["#1f7a47", "#d08a00", "#c8381e"][k]}">${pane(HOW[k])}</section>
      </section>`;
      app.querySelectorAll(".how-tabs .tab").forEach(b => b.onclick = () => { history.replaceState(null, "", "#" + HOW[+b.dataset.k].key); draw(+b.dataset.k); });
    };
    draw(pick());
    window.addEventListener("hashchange", () => draw(pick()));
  }

  function renderStage(app, site, projects, slug, example) {
    const cfg = STAGE_PAGES[slug], key = STAGES[slug].key;
    document.title = `${cfg.title} · ${site.name}`;
    const reached = projects.filter(p => stageNum(p) === Math.min(cfg.n, 2));
    const stories = projects.flatMap((p, i) => (p.updates || []).map(u => ({ p, i, u }))).sort((a, b) => String(b.u.date).localeCompare(String(a.u.date)));
    // "Impact in numbers": the tiles set in the admin page (Site settings). Some count themselves from the site;
    // the rest show the number typed in. With none set, each project's own numbers are shown instead.
    const auto = {
      trips: () => projects.filter(p => p.theme === "Trips & Events" && stageNum(p) === 3).length, // only the ones that have happened
      projects: () => projects.length,
      stories: () => projects.reduce((n, p) => n + (p.updates || []).length, 0)
    };
    const tiles = (site.impact || []).filter(x => x && x.label).map(x => ({
      label: x.label, note: x.note || "",
      value: auto[x.count] ? String(auto[x.count]()) : String(x.value == null ? "" : x.value),
      href: x.count === "trips" || x.count === "projects" ? "/initiated" : x.count === "stories" ? "#stories" : /volunteer/i.test(x.label) && FEAT.volunteers ? "/volunteers" : ""
    })).filter(x => x.value !== "" && x.value !== "0"); // nothing to show yet → no tile
    const numbers = tiles.length ? tiles.map(x => ({ x }))
      : projects.flatMap(p => (p.impact || []).filter(x => x && x.value).map(x => ({ p, x })));
    const items = slug === "impact" ? stories : reached.map(p => ({ p, i: projects.indexOf(p) }));
    // Categories always appear in this order; any others follow, with Other last.
    const ORDER = ["Trips & Events", "Education"];
    const rank = t => t === "Other" ? 999 : ORDER.indexOf(t) < 0 ? 500 : ORDER.indexOf(t);
    const themes = [...new Set(items.map(x => x.p.theme || "Other"))].sort((a, b) => rank(a) - rank(b));
    const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const fresh = projects.filter(p => stageNum(p) === 1).length;
    const sub = slug === "initiated" ? (reached.length ? `${plural(reached.length, "project")} getting ready to activate` : "New projects coming soon")
      : slug === "activated" ? (reached.length ? `${plural(reached.length, "project")} in action` : "First projects starting soon")
      : stories.length ? `${stories.length === 1 ? "1 story" : stories.length + " stories"} of impact · ${plural(new Set(stories.map(x => x.p)).size, "project")}` : "First stories coming soon";
    // Short message shown under each category heading in "Impact Stories" (Site settings → Impact story sections).
    const notes = Object.fromEntries((site.categories || []).filter(c => c && c.name && c.note).map(c => [c.name, c.note]));
    let filter = "All";
    const draw = () => {
      const groups = themes.filter(t => filter === "All" || t === filter).map(t => [t, items.filter(x => (x.p.theme || "Other") === t)]);
      // While nothing is activated yet, the Activated page shows the example project as a template of what is coming.
      const exampleHTML = example ? `
          <section class="theme-group example-group">
            <h3 class="theme-title">How an activated project will look</h3>
            <p class="theme-note">This is an example, not a real project. Open it to see the budget, where the money goes and who made it possible.</p>
            <div class="grid">${card(example, 0, journey(example))}</div>
          </section>` : "";
      // The projects at this stage, shown GlobalGiving-style: one big picture, then smaller ones, words on the photos.
      const stageList = projects.filter(p => stageNum(p) === cfg.n && (filter === "All" || (p.theme || "Other") === filter));
      const body = !items.length ? `<div class="panel empty-state"><p>${cfg.empty.text}</p><a class="btn" href="${cfg.empty.href}">${cfg.empty.btn}</a></div>${exampleHTML}`
        : (stageList.length ? `<div class="mosaic n${Math.min(stageList.length, 5)} stage-mosaic">${mosaicTiles(stageList, projects, 5)}</div>` : "")
          + (slug !== "impact" ? "" : `<h3 class="section-title stories-title">Stories from the day</h3>` + groups.map(([t, xs]) => `
          <section class="theme-group">
            <h3 class="theme-title">${esc(t)} <span class="count">${xs.length}</span></h3>
            ${slug === "impact" && notes[t] ? `<p class="theme-note">${esc(notes[t])}</p>` : ""}
            ${slug === "impact" ? `<div class="impact-list">${xs.map(({ p, u }) => `
            <a class="impact-item" href="/projects/${slugOf(p)}#updates">
              <div class="meta">${fmtDate(u.date)}</div>
              <h3>${esc(u.title)}</h3>
              <div class="excerpt">${md(u.body)}</div>
              <div class="from">${esc(p.title)} →</div>
            </a>`).join("")}</div>`
            : `<div class="grid">${xs.map(({ p, i }) => card(p, i, journey(p))).join("")}</div>`}
          </section>`).join(""));
      app.innerHTML = `
        ${stageNav(slug)}
        <header class="stage-hero slim s${cfg.n}">
          ${stageLayersHTML(slug)}
          <p class="stage-hero-lead">${cfg.lead}</p>
          <div class="stage-hero-text"><h1>${cfg.title}</h1><p>${sub}</p></div>
        </header>
        <div class="stage-shade s${cfg.n}">
        <section class="stage-lead s${cfg.n}">
          <ul class="meaning two">${cfg.links.map(([t, h, d]) => `<li><a href="${h}">${ICON(d)}<span>${t}</span><b aria-hidden="true">→</b></a></li>`).join("")}</ul>
        </section>
        ${slug === "impact" && numbers.length ? `
          <h2 class="section-title lined"><span class="stage-word s3">Impact</span> in numbers</h2>
          <div class="impact-numbers">${numbers.map(({ p, x }) => { const href = p ? `/projects/${slugOf(p)}` : x.href; return `<${href ? `a href="${esc(href)}"` : "div"}><b>${esc(x.value)}</b><span>${esc(x.label)}</span>${p ? `<small>${esc(p.title)}</small>` : x.note ? `<small>${esc(x.note)}</small>` : ""}</${href ? "a" : "div"}>`; }).join("")}</div>` : ""}
        <h2 class="section-title lined" id="stories">${cfg.heading}</h2>
        ${themes.length > 1 && slug === "impact" ? `<div class="filters" role="group" aria-label="Filter by theme">
          ${["All", ...themes].map(t => `<button class="chip" aria-pressed="${t === filter}" data-t="${esc(t)}">${esc(t)}</button>`).join("")}
        </div>` : ""}
        ${body}
        ${projectListHTML(slug === "initiated" ? projects.filter(p => stageNum(p) === 1) : slug === "activated" ? projects.filter(p => stageNum(p) === 2) : projects.filter(p => stageNum(p) === 3), projects,
          slug === "initiated" ? "Initiated projects" : slug === "activated" ? "Activated projects" : "Delivered projects")}
        <section class="stage-next">
          <div class="panel idea">
            <h2>${cfg.cta.title}</h2>
            <p>${cfg.cta.text}</p>
            <a class="btn" href="${cfg.cta.href}">${cfg.cta.btn}</a>
          </div>
          <a class="next-stage to-${cfg.next.slug}" href="/${cfg.next.slug}"><span>${cfg.next.kicker}</span><b>${cfg.next.label} →</b><small>${cfg.next.text}</small></a>
        </section>
        </div>`;
      app.querySelectorAll(".chip").forEach(b => b.onclick = () => { filter = b.dataset.t; draw(); });
    };
    draw();
  }

  function embedFor(url) {
    try {
      const u = new URL(url);
      const h = u.hostname.replace(/^www\.|^m\./, "");
      let id;
      if (h === "youtu.be") id = u.pathname.slice(1);
      if (h === "youtube.com") id = u.searchParams.get("v") || (u.pathname.match(/\/(shorts|embed|live)\/([^/?]+)/) || [])[2];
      if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
      if (h === "vimeo.com") { const v = u.pathname.split("/").filter(Boolean)[0]; if (/^\d+$/.test(v)) return `https://player.vimeo.com/video/${v}`; }
      if (h === "soundcloud.com") return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=false`;
    } catch (e) { }
    return null;
  }

  // Visitor comments: shown right away; admins can hide or delete them in the admin page.
  function commentsHTML(slug) {
    const list = COMMENTS.filter(c => c && c.approved !== false && c.project === slug && c.comment)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return `
      <section class="comments" aria-labelledby="c-title">
        <h2 id="c-title">Comments${list.length ? ` (${list.length})` : ""}</h2>
        ${list.length ? list.map(c => `<article class="comment">
            <div class="who"><span class="avatar">${esc(String(c.name || "?").trim().charAt(0).toUpperCase() || "?")}</span><strong>${esc(c.name || "Anonymous")}</strong><span class="meta">${fmtDate(c.date)}</span></div>
            <p>${esc(c.comment)}</p>
          </article>`).join("") : `<p class="note">No comments yet. Be the first to share a few kind words.</p>`}
        <form class="panel form comment-form" name="comments" data-ajax data-done="Thank you! Your comment is posted. It may take a minute to show for everyone." data-comment>
          <h3>Leave a comment</h3>
          <input type="hidden" name="form-name" value="comments">
          <input type="hidden" name="project" value="${esc(slug)}">
          <p hidden><label>Leave empty <input name="bot-field"></label></p>
          <label for="cm-name">Your name<input id="cm-name" name="name" required maxlength="80" autocomplete="name"></label>
          <label for="cm-text">Comment<textarea id="cm-text" name="comment" required maxlength="2000"></textarea></label>
          <button class="btn" type="submit">Post comment</button>
          <p class="note" data-msg hidden></p>
        </form>
      </section>`;
  }

  // The journey: every step from the request to the impact review, with who did it and when.
  // Names and dates come from the project's "people" (requested_by, verified_by, approved_by, day_lead, impact_by + *_on dates).
  // "Vouched for by": people who vouched for the request through its share link (projects.json "vouched":
  // [{ "name", "role" }]). Shown with the check by a Raavanaa volunteer, so visitors see why the project is real.
  function vouchedHTML(p) {
    const list = (Array.isArray(p.vouched) ? p.vouched : []).filter(v => v && v.name);
    if (!list.length) return "";
    const w = p.people || {};
    return `<section class="panel vouched" aria-labelledby="vouched-h">
      <h2 id="vouched-h">Vouched for by</h2>
      <ul>${list.map(v => `<li><b>${esc(v.name)}</b>${v.role ? `<span>${esc(v.role)}</span>` : ""}</li>`).join("")}</ul>
      ${p.verified ? `<p class="vouched-check">${VERIFIED_TICK} <span>Checked by a Raavanaa volunteer${w.verified_by ? `, ${esc(w.verified_by)}` : ""}${w.verified_on ? ` (${esc(w.verified_on)})` : ""}</span></p>` : `<p class="vouched-check wait">A Raavanaa volunteer is checking it.</p>`}
    </section>`;
  }

  // Vouches and ratings (SURESH, 22 Nov 2026: "Let it vouched as much as people possible. Anybody can vouch it." and
  // "We need a feed back or comment and star rating. So that it can be more authentic and who responsible will take it
  // as serious and care."). Filled from /api/voices/<slug>; projects.json "vouched" names show until it answers.
  const STAR = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor"/></svg>`;
  const starsHTML = (v, cls = "") => `<span class="stars ${cls}" aria-label="${v} out of 5 stars">${[1, 2, 3, 4, 5].map(n => `<i class="${v >= n - 0.25 ? "on" : v >= n - 0.75 ? "half" : ""}">${STAR}</i>`).join("")}</span>`;
  function voicesHTML(p) {
    const seed = (Array.isArray(p.vouched) ? p.vouched : []).filter(v => v && v.name);
    const impact = stageNum(p) === 3;
    // Signed in = the account is who they are (SURESH, 22 Nov 2026: no phone or other personal details).
    const signin = what => `<a class="btn v-signin" data-v-signin href="/members?next=${encodeURIComponent(location.pathname + "#voices-h")}">Sign in to ${what}</a>`;
    // Two sections that open and close (SURESH 25 Nov: "Vouched and its comment is a different section ... expand view").
    return `<div class="voices" data-voices>
      <section class="panel v-sec v-vouch" data-fold="vouch">
      <h2 id="voices-h">Vouched for by <b class="v-count" data-v-count>${seed.length || ""}</b></h2>
      <ul class="v-list" data-v-list>${seed.map(v => `<li><b>${esc(v.name)}</b>${v.role ? `<span>${esc(v.role)}</span>` : ""}</li>`).join("") || `<li class="v-none">Nobody yet. Do you know this project? Be the first.</li>`}</ul>
      <button type="button" class="btn ghost v-open" data-v-open="vouch">I know this is real: vouch for it</button>
      <form class="v-form" data-v-form="vouch" hidden novalidate>
        <p hidden><label>Leave empty <input name="bot-field"></label></p>
        <fieldset><legend>How do you know about it?</legend>
          <label class="v-choice"><input type="radio" name="relation" value="know" checked> I know the people behind it</label>
          <label class="v-choice"><input type="radio" name="relation" value="seen"> I have seen the need myself</label>
          <label class="v-choice"><input type="radio" name="relation" value="role"> I hold a role there (principal, teacher, Grama Niladhari, temple)</label>
        </fieldset>
        <label>In a few words <small>Shown, for example "Teacher at the school" or "Friend of the organiser"</small><input name="how" maxlength="120"></label>
        <label>Your name <small>Shown on the page</small><input name="name" maxlength="80" autocomplete="name" required></label>
        <button class="btn" type="submit">Vouch</button>${signin("vouch")}
        <p class="v-err" data-v-err hidden></p>
      </form>
      </section>
      <section class="panel v-sec v-talk" data-fold="comments">
      <h2 id="comments-h">Comments <b class="v-count" data-c-count></b></h2>
      ${impact ? `<div class="v-rate">
        <h2>How did the day go?</h2>
        <p class="v-avg" data-v-avg><span class="v-none">No ratings yet.</span></p>
        <button type="button" class="btn ghost v-open" data-v-open="rating">Rate the day</button>
        <form class="v-form" data-v-form="rating" hidden novalidate>
          <p hidden><label>Leave empty <input name="bot-field"></label></p>
          <fieldset class="v-pick"><legend>Your stars</legend>
            ${[1, 2, 3, 4, 5].map(n => `<label title="${n} star${n > 1 ? "s" : ""}"><input type="radio" name="stars" value="${n}"><i>${STAR}</i><span class="sr">${n}</span></label>`).join("")}
          </fieldset>
          <label>How were you involved?<select name="involved" required><option value="">Choose one</option><option value="day">I was there on the day</option><option value="parent">Parent or teacher</option><option value="organised">I helped organise it</option><option value="gave">I gave to it</option><option value="community">From the community there</option></select></label>
          <label>A few words <small>Optional. How did the day go? Please don't name any child.</small><textarea name="comment" maxlength="1000" rows="3"></textarea></label>
          <label>Your name <small>Shown with your stars</small><input name="name" maxlength="80" autocomplete="name" required></label>
          <button class="btn" type="submit">Send my rating</button>${signin("rate")}
          <p class="v-err" data-v-err hidden></p>
        </form>
      </div>` : `<p class="v-note v-later">Once the day has happened, the people involved can rate it with stars.</p>`}
      <div class="v-talk-in">
        <ul class="v-comments" data-v-comments><li class="v-none">No comments yet.</li></ul>
        <form class="v-form v-say" data-v-form="comment" novalidate>
          <p hidden><label>Leave empty <input name="bot-field"></label></p>
          <input type="hidden" name="name">
          <label class="sr" for="v-say-${esc(slugOf(p))}">Write a comment</label>
          <textarea id="v-say-${esc(slugOf(p))}" name="comment" maxlength="1000" rows="2" placeholder="Write a comment… (please don't name any child)"></textarea>
          <button class="btn" type="submit">Post</button>${signin("comment")}
          <p class="v-err" data-v-err hidden></p>
        </form>
      </div>
      </section>
    </div>`;
  }
  const VOICES = {};
  // Who is signed in on this browser (Netlify Identity keeps it in localStorage).
  function account() {
    try {
      const u = JSON.parse(localStorage.getItem("gotrue.user") || "null");
      if (!u || !u.email) return null;
      const m = u.user_metadata || {};
      return { email: u.email, name: m.full_name || m.name || u.email.split("@")[0] };
    } catch (e) { return null; }
  }
  function fillVoices(root, d) {
    const box = root.querySelector("[data-voices]"); if (!box || !d) return;
    const seen = new Set(), list = [];
    d.vouches.forEach(v => { const k = String(v.name).trim().toLowerCase(); if (!seen.has(k)) { seen.add(k); list.push(v); } });
    if (list.length) {
      box.querySelector("[data-v-list]").innerHTML = list.map(v => `<li><b>${esc(v.name)}</b>${v.role ? `<span>${esc(v.role)}</span>` : ""}</li>`).join("");
      box.querySelector("[data-v-count]").textContent = list.length;
    }
    const cm = d.comments || [];
    box.querySelector("[data-c-count]").textContent = cm.length || "";
    const c2 = root.querySelector("[data-c-count2]"); if (c2) c2.textContent = cm.length || "";
    box.querySelector("[data-v-comments]").innerHTML = cm.length ? cm.slice(0, 50).map(c => `<li>${c.stars ? starsHTML(c.stars, "sm") : ""}<p>${esc(c.comment)}</p><small>${esc(c.name)}${c.involved ? `, ${esc(c.involved)}` : ""} · ${fmtDate(c.at)}</small></li>`).join("") : `<li class="v-none">No comments yet. Be the first.</li>`;
    const r = d.rating || {}, avg = box.querySelector("[data-v-avg]");
    if (avg) avg.innerHTML = r.count
      ? `${starsHTML(r.average)} <b>${r.average.toFixed(1)}</b> <span>from ${r.count} rating${r.count > 1 ? "s" : ""}</span>`
      : `<span class="v-none">No ratings yet. Be the first.</span>`;
    const chip = root.querySelector("[data-rate-chip]");
    if (chip && r.count) { chip.hidden = false; chip.innerHTML = `${starsHTML(r.average, "sm")} ${r.average.toFixed(1)} <span>(${r.count})</span>`; }
  }
  // A fresh sign-in token for vouch, rate and comment (25 Nov 2026): the sign-in cookie runs out after an hour while the
  // browser still shows the person as signed in, so the token is refreshed here and sent with the request.
  async function authHeader() {
    try {
      const u = JSON.parse(localStorage.getItem("gotrue.user") || "null"); if (!u || !u.token) return {};
      let t = u.token;
      if (t.refresh_token && (!t.expires_at || t.expires_at < Date.now() + 60e3)) {
        const r = await fetch("/.netlify/identity/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(t.refresh_token) });
        if (r.ok) { const n = await r.json(); t = { ...t, ...n, expires_at: Date.now() + (n.expires_in || 3600) * 1000 }; u.token = t; try { localStorage.setItem("gotrue.user", JSON.stringify(u)); } catch (e2) { } }
      }
      return t.access_token ? { Authorization: "Bearer " + t.access_token } : {};
    } catch (e) { return {}; }
  }
  // Share, Vouched for by, The journey and Comments open and close (SURESH 25 Nov: "in a expand shrinking view").
  // Each panel's own title becomes the line you tap; they start closed so the page stays short.
  function foldPanels(root) {
    root.querySelectorAll(".share-box, .journey, .v-sec").forEach(sec => {
      if (sec.querySelector(":scope > details.pfold")) return;
      const h = sec.querySelector(":scope > h2"); if (!h) return;
      const d = document.createElement("details"); d.className = "pfold";
      const sm = document.createElement("summary"); sm.appendChild(h);
      sm.insertAdjacentHTML("beforeend", `<i class="pfold-chev" aria-hidden="true"></i>`);
      d.appendChild(sm);
      const body = document.createElement("div"); body.className = "pfold-body";
      while (sec.firstChild) body.appendChild(sec.firstChild);
      d.appendChild(body); sec.appendChild(d); sec.classList.add("folded");
      // Comments and Share start open (SURESH 26 Nov); Vouched for by and The journey start closed.
      if (sec.matches(".v-talk, .share-box")) d.open = true;
    });
    // Order (SURESH 26 Nov): 1 Comments, 2 Share, then Vouched for by, then The journey.
    const v = root.querySelector("[data-voices]"), sh = root.querySelector(".share-box"), talk = v && v.querySelector(".v-talk");
    if (v && sh && talk) talk.after(sh);
  }
  async function wireVoices(root, p) {
    const box = root.querySelector("[data-voices]"); if (!box) return;
    const slug = slugOf(p), api = `/api/voices/${encodeURIComponent(slug)}`, me = account();
    box.classList.toggle("signed-in", !!me);
    box.querySelectorAll("input[name=name]").forEach(i => { if (me && !i.value) i.value = me.name; });
    if (VOICES[slug]) fillVoices(root, VOICES[slug]);
    else fetch(api).then(r => r.ok ? r.json() : null).then(d => { if (d && d.ok) { VOICES[slug] = d; fillVoices(root, d); } }).catch(() => { });
    box.querySelectorAll("[data-v-open]").forEach(b => b.onclick = () => {
      const f = box.querySelector(`[data-v-form="${b.dataset.vOpen}"]`); f.hidden = !f.hidden; b.setAttribute("aria-expanded", String(!f.hidden));
      const first = f.querySelector("input[type=radio], select, textarea, input[name=how]"); if (!f.hidden && first && me) first.focus();
    });
    // The Comment and Vouch buttons under the story (SURESH 25 Nov: "a comment icon below the story").
    root.querySelectorAll("[data-v-jump]").forEach(j => j.onclick = () => {
      const to = j.dataset.vJump === "comment" ? box.querySelector(".v-talk") : box.querySelector(".v-vouch");
      const d = to.closest("details") || to.querySelector("details") || to; if (d.tagName === "DETAILS") d.open = true;
      to.style.scrollMarginTop = "90px"; to.scrollIntoView({ block: "start", behavior: "smooth" });
      if (j.dataset.vJump === "vouch") { const f = box.querySelector('[data-v-form="vouch"]'); if (f && f.hidden) box.querySelector('[data-v-open="vouch"]').click(); }
      else { const t = box.querySelector(".v-say textarea"); if (account() && t) setTimeout(() => t.focus({ preventScroll: true }), 400); }
    });
    const doneKey = k => `raav-${k}-${slug}`;
    box.querySelectorAll("[data-v-form]").forEach(f => {
      const kind = f.dataset.vForm, err = f.querySelector("[data-v-err]");
      try { if (kind !== "comment" && localStorage.getItem(doneKey(kind))) { const b = box.querySelector(`[data-v-open="${kind}"]`); b.textContent = kind === "vouch" ? "✓ You vouched for it" : "✓ Thank you for rating. Change my rating"; if (kind === "vouch") b.disabled = true; } } catch (e) { }
      f.onsubmit = async e => {
        e.preventDefault();
        if (!account()) { location.href = "/members?next=" + encodeURIComponent(location.pathname + "#voices-h"); return; }
        const fd = new FormData(f), data = Object.fromEntries(fd.entries()); data.kind = kind;
        if (kind === "comment") data.name = account().name;
        const fail = m => { err.textContent = m; err.hidden = false; };
        err.hidden = true;
        if (kind === "rating" && !data.stars) return fail("Please choose 1 to 5 stars.");
        if (kind === "rating" && !data.involved) return fail("Please say how you were involved.");
        if (kind === "comment" && String(data.comment || "").trim().length < 2) return fail("Please write your comment.");
        if (kind !== "comment" && String(data.name || "").trim().length < 2) return fail("Please add your name.");
        const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
        try {
          const res = await fetch(api, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", ...(await authHeader()) }, body: JSON.stringify(data) });
          const out = await res.json().catch(() => ({}));
          // Signed out on the server: say so and keep what they wrote, instead of leaving the page (their vouch was lost before).
          if (out.signin) { btn.disabled = false; err.innerHTML = `Your sign-in has run out. <a href="/members?next=${encodeURIComponent(location.pathname)}">Sign in again</a>, then press the button once more.`; err.hidden = false; return; }
          if (!res.ok || !out.ok) { btn.disabled = false; return fail(out.error || "That didn't go through. Please try again."); }
          VOICES[slug] = out; fillVoices(root, out); btn.disabled = false;
          if (kind === "comment") { f.reset(); return; }
          try { localStorage.setItem(doneKey(kind), "1"); } catch (e2) { }
          f.hidden = true;
          const b = box.querySelector(`[data-v-open="${kind}"]`);
          b.textContent = kind === "vouch" ? "✓ Thank you. Your name is on the list" : "✓ Thank you for rating";
          if (kind === "vouch") b.disabled = true;
        } catch (e3) { btn.disabled = false; fail("That didn't go through. Check your connection and try again."); }
      };
    });
  }

  function journeyHTML(p, full) {
    const w = p.people || {}, st = stageNum(p), d = v => v ? fmtDate(v) : "";
    const ex = (p.expectations || []).filter(x => x && x.text), reviewed = ex.length && ex.every(x => x.result);
    const funders = (p.funders || []).filter(x => x && x.name);
    const S = [
      { g: 1, label: "Requested", who: w.requested_by, when: w.requested_on, done: true },
      { g: 1, label: vLabel(p), who: w.verified_by, when: w.verified_on, done: !!p.verified },
      { g: 1, label: "Approved", who: w.approved_by, when: w.approved_on, done: !!(w.approved_by || w.approved_on) || st > 1 },
      { g: 1, label: "Fully funded", who: funders.length ? `${funders.length} sponsor${funders.length > 1 ? "s" : ""}` : "", when: w.funded_on, done: full || st > 1 },
      { g: 2, label: "Day prepared", who: w.day_lead ? `Led by ${w.day_lead}` : "", when: "", done: st > 2 || !!(p.date_set && p.booked && p.volunteers) },
      { g: 2, label: "The day", who: p.reach || "", when: w.day_on, done: st > 2 },
      { g: 3, label: "Impact reviewed", who: w.impact_by, when: w.impact_on, done: st > 2 && (!!reviewed || !!w.impact_by) }
    ];
    const now = S.findIndex(x => !x.done);
    const G = ["", "Smiles in the Making", "Moments on the Way", "Days of Joy, Created"];
    let html = "", g = 0;
    // "Moments on the Way" and "Days of Joy, Created" are shown once the day has happened (SURESH, 6 Nov 2026).
    // "Moments on the Way" also shows from Activated, so the dots move on past Fully funded (SURESH 25 Nov 2026:
    // "The dot didn't move to activated").
    S.filter(x => st === 3 || x.g === 1 || (st === 2 && x.g === 2)).forEach((x, k) => {
      if (x.g !== g) { g = x.g; html += `${k ? "</ol>" : ""}<p class="jr-g jr-g${g}">${G[g]}</p><ol class="jr">`; }
      const state = x.done ? "done" : k === now ? "now" : "next", info = [x.who && esc(x.who), x.when && d(x.when)].filter(Boolean).join(" · ");
      // The funding step, while it is the current one, gets a small "Make it happen" nudge (SURESH, 6 Nov 2026).
      const cta = state === "now" && x.label === "Fully funded" && st === 1 && !p.sample ? `<span class="jr-nudge"><svg class="jr-arrow" viewBox="0 0 56 34" width="44" height="27" aria-hidden="true"><path class="jr-arrow-line" d="M5 3c2 15 14 24 40 22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" pathLength="100"/><path class="jr-arrow-head" d="M37 17l9 8-10 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><button type="button" class="jr-cta" data-fund><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg>Be the reason they smile. Make it happen</button></span>` : "";
      html += `<li class="${state} jr${x.g}"><i aria-hidden="true">${x.done ? "✓" : ""}</i><span><b>${x.label}</b>${info ? `<small>${info}</small>` : state === "now" ? "<small>In progress</small>" : ""}${cta}</span></li>`;
    });
    return `<div class="panel journey"><h2>The journey</h2>${html}</ol></div>`;
  }

  // "Share this moment": WhatsApp, Facebook, X, copy link, and an Instagram story picture
  // (SURESH, 10 Nov 2026). Words come from share.json, which never names a child or a school.
  // Pictures in img/share/ are made by tools/share-cards.mjs; a project without its own uses the default.
  const shareIcon = d => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${d}</svg>`;
  const SHARE_ICONS = {
    wa: shareIcon('<path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.3.9 2.5 1 2.6.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.6-.2z"/>'),
    fb: shareIcon('<path fill="currentColor" d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21z"/>'),
    x: shareIcon('<path fill="currentColor" d="M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7-8.1L2 3h6.2l4.4 5.8zm-1 16.2h1.7L7.3 4.7H5.5z"/>'),
    ig: shareIcon('<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/>'),
    link: shareIcon('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'),
    more: shareIcon('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 13v6.5h14V13"/>')
  };
  const shareHTML = p => `
    <div class="panel share-box" data-share="${esc(slugOf(p))}">
      <h2>Share this moment</h2>
      ${sendButtonHTML(p, "box")}
      <p class="note">Or share it more widely. One share can bring the next sponsor. Every rupee is shown openly.</p>
      <div class="share-row">
        <a class="sh sh-wa" data-sh="wa" target="_blank" rel="noopener">${SHARE_ICONS.wa}<span>WhatsApp</span></a>
        <a class="sh sh-fb" data-sh="fb" target="_blank" rel="noopener">${SHARE_ICONS.fb}<span>Facebook</span></a>
        <a class="sh sh-x" data-sh="x" target="_blank" rel="noopener">${SHARE_ICONS.x}<span>X</span></a>
        <button class="sh sh-link" type="button" data-sh="link">${SHARE_ICONS.link}<span>Copy link</span></button>
        <button class="sh sh-ig" type="button" data-sh="ig">${SHARE_ICONS.ig}<span>Instagram story</span></button>
        <button class="sh sh-more" type="button" data-sh="more" hidden>${SHARE_ICONS.more}<span>More</span></button>
      </div>
      <p class="share-tip note" hidden></p>
    </div>`;
  // The WhatsApp message from a project's Share box, as a neat glance that fits the stage (SURESH 26 Nov 2026: "Not
  // professional. Can you create a nice glance when shared"). Bold title, one line, then when / where / who and the money.
  function glanceText(p, site, url) {
    const plain = t => String(t || "").replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim();
    const n = stageNum(p), b = budgetOf(p), money = v => moneyOf(site, v, p).replace(/&amp;/g, "&");
    const line = plain(p.tagline) || (plain(p.summary).match(/^.+?[.!?](\s|$)/) || [""])[0].trim();
    const day = p.money && p.money.day, dt = day ? new Date(day + "T12:00:00") : null;
    const when = dt && !isNaN(dt) ? dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
    const who = !plain(p.reach) ? "" : /^[\d\s,.+–-]*(to|and)?[\d\s,.+–-]*$/i.test(plain(p.reach)) ? `${plain(p.reach)} children` : plain(p.reach);
    const head = n === 3 ? "\u{1F389} *The day happened*" : n === 2 ? "\u2705 *Fully funded, thank you*" : "\u{1F331} *A need on Raavanaa*";
    const facts = [
      when && `\u{1F4C5} ${when}`,
      p.location && `\u{1F4CD} ${plain(p.location)}`,
      who && `\u{1F465} ${who}`,
      n === 1 && b.goal > 0 ? `\u{1F3AF} ${b.pct}% funded · ${money(Math.max(0, b.goal - b.raised))} still to go` : n === 2 && b.goal ? `\u{1F49B} ${money(b.goal)} raised, every rupee shown openly` : "",
    ].filter(Boolean);
    const ask = n === 1 ? "Help make it happen \u{1F447}" : n === 2 ? "Follow the day \u{1F447}" : "See the story \u{1F447}";
    return [head, "", `*${plain(p.title)}*`, ...(line ? [`_${line}_`] : []), ...(facts.length ? ["", ...facts] : []), "", ask, url].join("\n");
  }
  // The picture that goes with it: the funding card for Initiated / Activated projects, else the project's own share picture.
  const glancePic = (p, own) => { const n = stageNum(p), b = budgetOf(p);
    return n < 3 && b.goal > 0 ? `/api/share-card/${slugOf(p)}.jpg?v=${n === 2 || b.pct >= 100 ? 100 : b.pct}` : `/img/share/${own ? slugOf(p) : "default"}.jpg`; };

  async function wireShare(root) {
    const box = root.querySelector("[data-share]");
    if (!box) return;
    const slug = box.dataset.share;
    const ta = location.pathname.startsWith("/ta/");
    const url = withPct(`${location.origin}${ta ? "/ta" : ""}/projects/${slug}`, slug);
    let data = null;
    try { data = await (await fetch("/share.json")).json(); } catch (_) {}
    const own = data && data.projects && data.projects[slug];
    const c = Object.assign({}, data && data.default, own);
    const title = (ta && c.title_ta) || c.title || document.title;
    const text = (ta && c.text_ta) || c.text || "";
    const pic = `/img/share/${own ? slug : "default"}-story${ta ? "-ta" : ""}.jpg`;
    const enc = encodeURIComponent;
    // The story picture (100-200 KB) is fetched only when the share box comes near the screen, not with every page (speed, 13 Nov 2026).
    // It is still fetched before a tap, because a phone only opens its share sheet straight after the tap.
    let picP = null;
    const getPic = () => picP || (picP = fetch(pic).then(r => r.ok ? r.blob() : Promise.reject()).catch(() => { picP = null; return null; }));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); getPic(); } }, { rootMargin: "400px" });
      io.observe(box);
    } else getPic();
    box.querySelector('[data-sh="ig"]').addEventListener("pointerdown", getPic);
    // WhatsApp: the glance message. On phones that can share pictures, the funding card goes with it as a photo, so the
    // picture always shows even when WhatsApp does not load a link preview (SURESH 26 Nov 2026).
    const proj = !ta && G_CTX && (G_CTX.projects || []).find(x => slugOf(x) === slug);
    const waText = proj ? glanceText(proj, G_CTX.site, url) : `${title}\n${text}\n${url}`;
    const wa = box.querySelector('[data-sh="wa"]');
    wa.href = `https://wa.me/?text=${enc(waText)}`;
    if (proj && navigator.canShare && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      let cardP = null, cardFile = null;
      const getCard = () => cardP || (cardP = fetch(glancePic(proj, own)).then(r => r.ok ? r.blob() : null).catch(() => null)
        .then(b => { if (b) cardFile = new File([b], `raavanaa-${slug}.jpg`, { type: "image/jpeg" }); else cardP = null; return b; }));
      if ("IntersectionObserver" in window) { const io2 = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io2.disconnect(); getCard(); } }, { rootMargin: "400px" }); io2.observe(box); } else getCard();
      wa.addEventListener("pointerdown", getCard);
      wa.addEventListener("click", e => {
        // The share sheet has to open straight from the tap, so this only happens once the picture is already here;
        // otherwise the wa.me link opens as before with the glance message.
        if (!cardFile || !navigator.canShare({ files: [cardFile], text: waText })) return;
        e.preventDefault();
        navigator.share({ files: [cardFile], text: waText }).catch(() => { });
      });
    }
    box.querySelector('[data-sh="fb"]').href = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
    box.querySelector('[data-sh="x"]').href = `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`;
    const tip = box.querySelector(".share-tip");
    const say = t => { tip.textContent = t; tip.hidden = false; };
    const more = box.querySelector('[data-sh="more"]');
    if (navigator.share) {
      more.hidden = false;
      more.onclick = () => navigator.share({ title, text, url }).catch(() => {});
    }
    box.querySelector('[data-sh="link"]').onclick = async () => {
      try { await navigator.clipboard.writeText(url); say("Link copied. Paste it anywhere."); }
      catch (_) { say(url); }
    };
    // Instagram takes no links in posts: phones get the story picture straight in the share sheet
    // (pick Instagram); computers download it. The tip says to add the link sticker.
    box.querySelector('[data-sh="ig"]').onclick = async () => {
      try {
        const blob = await getPic();
        if (!blob) throw new Error("no picture");
        const file = new File([blob], `raavanaa-${slug}.jpg`, { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.clipboard.writeText(url); } catch (_) {}
          await navigator.share({ files: [file] });
          say("Pick Instagram, then Story. The link is copied: add it with the link sticker.");
          return;
        }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = file.name;
        document.body.appendChild(a); a.click(); a.remove();
        say("Story picture saved. Post it to your Instagram story and add this page's link with the link sticker.");
      } catch (_) { say("Could not get the picture. Please try again."); }
    };
  }

  // "Send to someone": a reader thinks of one person while reading a project (SURESH, 18 Nov 2026:
  // "a very professional neat message that he won't feel as spam"). A short, calm, personal message:
  // their name, "I thought of you", one or two lines on the project (share.json "personal"), one link,
  // no pressure, the sender's name. The reader can change every word before it goes. Nothing is sent
  // by Raavanaa: it goes from the reader's own WhatsApp, email or phone.
  const SEND_ICONS = {
    send: shareIcon('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3.5 11.2L20.5 4l-6.7 16.5-2.6-6.9z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M11.2 13.6l3.6-3.6"/>'),
    mail: shareIcon('<rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.8 7l8.2 6 8.2-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
    copy: shareIcon('<rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/>')
  };
  const sendButtonHTML = (p, where) => p.sample ? "" : `<button type="button" class="send-one send-one-${where}" data-send-open>${SEND_ICONS.send}<span>${stageNum(p) === 1 ? "Thought of someone? Send it to them" : "Send this to someone you know"}</span></button>`;
  const sendDialogHTML = () => `
    <dialog class="send-dlg" aria-labelledby="send-h">
      <form method="dialog" class="send-in">
        <button type="submit" class="send-x" aria-label="Close">✕</button>
        <p class="send-kick">A personal note, from you</p>
        <h2 id="send-h">Send this to someone you have in mind</h2>
        <div class="send-names">
          <label><span>Their name <small>(optional)</small></span><input name="to" autocomplete="off" placeholder="e.g. Priya"></label>
          <label><span>Your name <small>(optional)</small></span><input name="from" autocomplete="given-name" placeholder="e.g. Suresh"></label>
        </div>
        <label class="send-msg-l"><span>Your message <small>you can change any word</small></span>
          <textarea name="msg" rows="7"></textarea></label>
        <button type="button" class="send-reset" hidden>Start the message again</button>
        <div class="send-go">
          <a class="sg sg-wa" data-go="wa" target="_blank" rel="noopener">${SHARE_ICONS.wa}<span>WhatsApp</span></a>
          <a class="sg sg-mail" data-go="mail">${SEND_ICONS.mail}<span>Email</span></a>
          <button type="button" class="sg sg-copy" data-go="copy">${SEND_ICONS.copy}<span>Copy message</span></button>
          <button type="button" class="sg sg-more" data-go="more" hidden>${SHARE_ICONS.more}<span>Other apps</span></button>
        </div>
        <p class="send-tip" role="status"></p>
        <p class="send-note">Raavanaa never sends anything or keeps their name. It goes from you, to them.</p>
      </form>
    </dialog>`;
  async function wireSend(root, p) {
    const opens = root.querySelectorAll("[data-send-open]");
    if (!opens.length) return;
    let dlg = document.querySelector(".send-dlg");
    if (!dlg) { document.body.insertAdjacentHTML("beforeend", sendDialogHTML()); dlg = document.querySelector(".send-dlg"); }
    const slug = slugOf(p), url = withPct(`${location.origin}/projects/${slug}`, slug);
    let data = null;
    const words = async () => {
      if (!data) { try { data = await (await fetch("/share.json")).json(); } catch (_) { data = {}; } }
      const own = (data.projects || {})[slug] || {};
      return {
        about: own.personal || p.tagline || `${p.title}. ${(data.default || {}).personal || ""}`.trim(),
        subject: own.subject || (data.default || {}).subject || "Thought you might like to see this"
      };
    };
    const f = dlg.querySelector("form"), msg = f.elements.msg, tip = dlg.querySelector(".send-tip"), reset = dlg.querySelector(".send-reset");
    let w = null, edited = false;
    const build = () => {
      const to = f.elements.to.value.trim(), from = f.elements.from.value.trim();
      // Plain and personal (SURESH, 18 Nov 2026: no pitch, and no "saw this and thought of you", which reads as spam):
      // his own opening line, one line about the project, the link, and the sender's name.
      return `${to ? `Hi ${to},` : "Hi,"} this is a project from raavanaa.org. I think you will be interested in this.\n\n${w.about}\n\n${url}${from ? `\n\n${from}` : ""}`;
    };
    const update = () => {
      if (!edited) msg.value = build();
      const enc = encodeURIComponent, text = msg.value;
      dlg.querySelector('[data-go="wa"]').href = `https://wa.me/?text=${enc(text)}`;
      dlg.querySelector('[data-go="mail"]').href = `mailto:?subject=${enc(w.subject)}&body=${enc(text)}`;
    };
    const say = t => { tip.textContent = t; };
    f.elements.to.oninput = f.elements.from.oninput = () => {
      if (edited) { // keep their own words, but follow the names in the greeting and the sign-off
        const to = f.elements.to.value.trim();
        msg.value = msg.value.replace(/^Hi[^,\n]*,/, to ? `Hi ${to},` : "Hi,");
      }
      try { localStorage.setItem("raav-send-from", f.elements.from.value.trim()); } catch (_) {}
      update();
    };
    msg.oninput = () => { edited = true; reset.hidden = false; update(); };
    reset.onclick = () => { edited = false; reset.hidden = true; update(); msg.focus(); };
    const more = dlg.querySelector('[data-go="more"]');
    if (navigator.share) { more.hidden = false; more.onclick = () => navigator.share({ text: msg.value }).catch(() => {}); }
    dlg.querySelector('[data-go="copy"]').onclick = async () => {
      try { await navigator.clipboard.writeText(msg.value); say("Message copied. Paste it into any chat or email."); }
      catch (_) { msg.select(); say("Select the message and copy it."); }
    };
    dlg.querySelector('[data-go="wa"]').onclick = () => say("WhatsApp opens: pick the person, and the message is ready to send.");
    dlg.querySelector('[data-go="mail"]').onclick = () => say("Your email app opens with the message. Add their email address and send.");
    dlg.onclick = e => { if (e.target === dlg) dlg.close(); };
    opens.forEach(b => b.onclick = async () => {
      w = await words();
      edited = false; reset.hidden = true; say("");
      try { if (!f.elements.from.value) f.elements.from.value = localStorage.getItem("raav-send-from") || ""; } catch (_) {}
      update();
      dlg.showModal();
      if (!matchMedia("(pointer:coarse)").matches) f.elements.to.focus();
    });
  }

  // Project page: a small picture of the three stages, the same circles and words as on Home, with this
  // project's place among them (SURESH, 17 Nov 2026: "a small graphic of which stage it has moved to").
  // The current stage is full, marked "Now" and carries the green tick dot, which moves on with the project
  // (SURESH 25 Nov 2026: "for activated the green dot stays at Initiated instead of moving"); later ones are faded.
  function stageJourneyHTML(p) {
    const n = stageNum(p), art = ["initiated", "activated", "impact"], say = STAGE_SAY;
    return `<nav class="pjour" aria-label="Where this project stands: ${STAGE_LABEL[n - 1]}">${STAGE_LABEL.map((l, k) => `${k ? `<span class="pjour-arrow${k < n ? " past" : ""}" aria-hidden="true">›</span>` : ""}<a class="pjour-st s${k + 1}${k + 1 < n ? " past" : k + 1 === n ? " now" : " next"}" href="/${art[k]}"${k + 1 === n ? ' aria-current="step"' : ""}>
        <i style="background-image:url(/img/stage-${art[k]}.svg)">${k + 1 === n ? `<em aria-label="this project is here">✓</em>` : ""}</i>
        <b>${l}</b><small>${k + 1 === n ? "Now · " + say[k] : say[k]}</small></a>`).join("")}</nav>`;
  }
  // Follow this project (SURESH 25 Nov 2026: "Need a way for them to follow"): a name and a WhatsApp number or email,
  // no sign-in. The team posts each update in the portal (Followers & updates) and sends it with one tap per person.
  const FOLLOW_KEY = "raav-follows";
  const followsHere = () => { try { return JSON.parse(localStorage.getItem(FOLLOW_KEY) || "[]"); } catch (e) { return []; } };
  function followBoxHTML(p) {
    const slug = slugOf(p), on = followsHere().includes(slug), n = +p.followers || 0, last = (p.updates || [])[0];
    return `<section class="panel follow pfollow" data-pfollow>
      <h2 class="follow-title">${headline("Follow this project")}</h2>
      ${n ? `<p class="pfollow-n"><b>${n}</b> ${n === 1 ? "person follows" : "people follow"} this project</p>` : ""}
      ${last ? `<p class="pfollow-last"><small>Latest news · ${fmtDate(last.date)}</small><b>${esc(last.title)}</b></p>` : ""}
      <div data-pf-done${on ? "" : " hidden"}><p class="pfollow-ok">✓ You're following it. We'll send you each update.</p></div>
      <form data-pf-form${on ? " hidden" : ""} novalidate>
        <p class="note" style="margin:0 0 8px">Get each step of this project on WhatsApp or by email: when it is funded, when the day is set, and how the day went. No sign-in.</p>
        <p hidden><label>Leave empty <input name="bot-field"></label></p>
        <label class="sr" for="pf-name">Your name</label>
        <input id="pf-name" name="name" autocomplete="name" placeholder="Your name">
        <label class="sr" for="pf-contact">WhatsApp number or email</label>
        <input id="pf-contact" name="contact" required autocomplete="tel" inputmode="email" placeholder="WhatsApp number or email">
        <button class="btn" type="submit">Follow</button>
        <p class="note" data-msg hidden></p>
        <p class="note pfollow-small">Only the team sees your number or email. Every message has a link to stop.</p>
      </form>
    </section>`;
  }
  function wireFollowBox(root, p) {
    const box = root.querySelector("[data-pfollow]"); if (!box) return;
    const f = box.querySelector("[data-pf-form]"), msg = f.querySelector("[data-msg]");
    try { const me = account && account(); if (me && me.name && !f.name.value) f.name.value = me.name; } catch (e) { /* no account */ }
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = f.querySelector("button"), contact = f.contact.value.trim();
      const bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && contact.replace(/\D/g, "").length < 7;
      if (bad) { msg.hidden = false; msg.textContent = "Please add a WhatsApp number (with the country code if you are abroad) or an email address."; return; }
      btn.disabled = true; msg.hidden = true;
      try {
        const r = await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: slugOf(p), name: f.name.value.trim(), contact, "bot-field": f["bot-field"].value }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.ok) throw new Error(d.error || "Could not save that just now. Please try again.");
        try { const l = followsHere(); if (!l.includes(slugOf(p))) localStorage.setItem(FOLLOW_KEY, JSON.stringify([...l, slugOf(p)])); } catch (er) { /* storage blocked */ }
        f.hidden = true; box.querySelector("[data-pf-done]").hidden = false;
        root.querySelectorAll("[data-pact-follow]").forEach(b => { b.disabled = true; b.textContent = "✓ You're following this day"; });
      } catch (er) { msg.hidden = false; msg.textContent = er.message; btn.disabled = false; }
    });
  }
  // "Live from the day" (SURESH 26 Nov 2026, Kandy trip): what the organiser posts from the bus with the phone link,
  // newest first, with the Sri Lanka time, so the sponsors and families feel the day as it happens. A project can carry
  // "dedication": { "words": "In loving memory of", "name": "…", "note": "…" } when a sponsor gives the day in someone's name.
  const lkTime = iso => { try { return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Colombo" }) + " in Sri Lanka"; } catch (e) { return ""; } };
  function liveHTML(p) {
    const live = (p.updates || []).filter(u => u.live && u.at).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const ded = p.dedication && p.dedication.name ? p.dedication : null;
    if (!live.length && !ded) return "";
    const day = live.length ? new Date(live[0].at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Colombo" }) : "";
    const item = (u, k) => `<li class="plive-i${k > 2 ? " more" : ""}"><time>${esc(lkTime(u.at))}</time><b>${esc(u.title)}</b>${u.body ? `<p>${esc(u.body)}</p>` : ""}${u.image ? `<a href="${esc(u.image)}" target="_blank" rel="noopener"><img src="${esc(u.image)}" alt="" loading="lazy"></a>` : ""}</li>`;
    return `<section class="plive" id="live">
      ${ded ? `<div class="plive-ded"><span>${esc(ded.words || "This day is given in loving memory of")}</span><b>${esc(ded.name)}</b>${ded.note ? `<small>${esc(ded.note)}</small>` : ""}</div>` : ""}
      ${live.length ? `<h2><i aria-hidden="true"></i>Live from the day <small>${esc(day)}</small></h2>
      <ol>${live.map(item).join("")}</ol>
      ${live.length > 3 ? `<button type="button" class="btn ghost plive-more" onclick="this.closest('.plive').classList.add('all');this.remove()">See all ${live.length} posts from the day</button>` : ""}` : ""}
    </section>`;
  }
  // Activated page top (SURESH 26 Nov 2026, thread "Show funded status on Activated pages"): Initiated and Activated
  // keep the same template; on Activated the top says plainly that the day is fully funded and when it happens, in
  // place of any ask to give, and offers Follow so people come back for the day. The day comes from "day" or
  // money.day (YYYY-MM-DD) in projects.json, else from date_text or the "When" line of At a glance.
  const actDayISO = p => String(p.day || (p.money && p.money.day) || "").slice(0, 10);
  function activatedTopHTML(p) {
    const iso = actDayISO(p), slug = slugOf(p), on = followsHere().includes(slug);
    let when = "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const d = new Date(iso + "T12:00:00Z"), nice = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" }); // YYYY-MM-DD in Sri Lanka
      const diff = Math.round((Date.parse(iso) - Date.parse(today)) / 864e5);
      when = diff > 1 ? `Happening on <b>${esc(nice)}</b>` : diff === 1 ? `Happening tomorrow, <b>${esc(nice)}</b>`
        : diff === 0 ? `Happening <b>today</b> in Sri Lanka, ${esc(nice)}` : `The day was <b>${esc(nice)}</b>. The story is on its way.`;
    } else {
      const t = p.date_text || ((p.glance || []).find(g => /^(when|the day|date)$/i.test(g.k)) || {}).v || "";
      when = t ? `Happening on <b>${esc(t)}</b>` : "The date is being set";
    }
    return `<section class="pact" data-pact>
      <p class="pact-k"><i aria-hidden="true">✓</i> Fully funded</p>
      <p class="pact-day">${when}</p>
      <p class="pact-note">Thank you to everyone who gave. Nothing more is needed for this day. Follow it to see the day as it happens.</p>
      <button type="button" class="btn pact-follow" data-pact-follow${on ? " disabled" : ""}>${on ? "✓ You're following this day" : "Follow the day"}</button>
    </section>`;
  }
  // The Impact page (SURESH 26 Nov 2026, thread "Redesign Impact story page"): once the day has happened, the top of the
  // project page stops asking for help and shows what happened, as highlights at a glance:
  //   1 one impact line + the best picture, 2 highlight tiles, 3 "In their words" (Tamil with English, never names),
  //   4 thank-you from the children to each sponsor + the organisers' letter, 5 the day hour by hour (from the
  //   Live from the day posts), 6 where every rupee went (Books closed), 7 make the next moment happen.
  // Everything is optional, from projects.json "impact_page":
  //   { "line", "date", "picture": {image, caption}, "highlights": [{value,label}], "quotes": [{ta,en,who}],
  //     "thanks": {title, to: [{name, words}], from}, "letter": {words, who, link}, "timeline": [{time, what}] }
  // Missing parts fall back to what the project already has (tagline, cover, who, funders, live posts, money books).
  function impactTopHTML(p, site, i) {
    const ip = p.impact_page || {}, b = budgetOf(p), money = n => moneyOf(site, n, p), ex = !!ip.example;
    const exTag = ex ? `<span class="imp-ex">Example words</span>` : "";
    let secN = 0; const sec = (h, tag = "") => `<p class="imp-k"><span>${++secN} · ${h}</span>${tag}</p>`;
    const dayISO = ip.date || (p.money && p.money.day) || "";
    const dayTxt = dayISO ? new Date(dayISO + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
    // 2 Highlights: the team's own tiles, else the people counts and the money, then the books.
    const realFunders = b.funders.filter(f => !/test/i.test(f.name || ""));
    const tiles = (ip.highlights || []).length ? ip.highlights : [
      ...(p.who || []).map(w => ({ value: w.value, label: w.label })), ...(p.impact || []).map(w => ({ value: w.value, label: w.label })),
      ...(b.goal && !(p.impact || []).length ? [{ value: money(b.raised || b.goal), label: realFunders.length ? `given by ${realFunders.length} ${realFunders.length === 1 ? "sponsor" : "sponsors"}` : "for the day" }] : [])];
    const closed = !!((p.books && p.books.closed) || (ex && ip.money && ip.money.closed));
    // 6 Money: given, spent with receipts, left over.
    const spentList = ex && ip.money ? (ip.money.lines || []) : ((p.money && p.money.spent) || []).filter(x => x && x.item);
    const spent = ex && ip.money ? numOf(ip.money.spent) : spentList.reduce((t, x) => t + numOf(x.amount), 0);
    const given = b.raised || (ex ? b.goal : 0);
    const byLine = {}; spentList.forEach(x => { const k = x.line || x.item; byLine[k] = (byLine[k] || 0) + numOf(x.amount); });
    // 5 The day: the team's own timeline, else the Live from the day posts, oldest first.
    const short = iso => { try { return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Colombo" }); } catch (e) { return ""; } };
    const tl = (ip.timeline || []).length ? ip.timeline : (p.updates || []).filter(u => u.live && u.at).sort((a, c) => String(a.at).localeCompare(String(c.at))).map(u => ({ time: short(u.at), what: u.title }));
    const hasLive = (p.updates || []).some(u => u.live && u.at);
    // 4 Thanks: the children's words to each sponsor, else a plain thank-you to each listed sponsor.
    const th = ip.thanks || {};
    const thanksTo = (th.to || []).length ? th.to : realFunders.filter(f => f.list !== false).map(f => ({ name: f.name }));
    const pic = ip.picture || {};
    return `<section class="imp" aria-label="What this day made happen">
      ${ex ? `<p class="imp-banner"><b>Preview.</b> This is how the page will look after the day. The words marked <em>Example words</em> are made up; the real ones come from the children, teachers and organisers.</p>` : ""}
      <p class="imp-pills"><span class="imp-pill">Impact · It happened</span>${dayTxt ? `<span class="imp-date">${esc(dayTxt)}</span>` : ""}</p>
      ${sec("The impact", ip.line ? exTag : "")}
      <p class="imp-line">${esc(ip.line || p.tagline || p.summary || "")}</p>
      <figure class="imp-pic">
        ${pic.image ? `<img src="${esc(imgUrl(pic.image, 1200))}" alt="${esc(pic.caption || "")}">` : `<div class="hero cover" style="${coverStyle(p, i)}">${coverHTML(p, i, "", 1200)}</div>`}
        <figcaption>${esc(pic.caption || "Best picture of the day")}</figcaption>
      </figure>
      ${tiles.length || closed ? `${sec("Highlights at a glance", (ip.highlights || []).length ? exTag : "")}
      <div class="imp-tiles">${tiles.map(t => `<div class="imp-tile"><b>${esc(t.value)}</b><span>${esc(t.label)}</span></div>`).join("")}${closed ? `<div class="imp-tile done"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 12.5l5 5L20 6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg><b>Books closed</b><span>every rupee shown</span></div>` : ""}</div>` : ""}
      ${(ip.quotes || []).length ? `${sec("In their words", exTag)}
      <div class="imp-quotes">${ip.quotes.map((q, k) => `<blockquote class="imp-q${k ? "" : " first"}">${q.ta ? `<p class="imp-ta" lang="ta">“${esc(q.ta)}”</p>` : ""}${q.en ? `<p class="imp-en">“${esc(q.en)}”</p>` : ""}${q.who ? `<footer>${esc(q.who)}</footer>` : ""}</blockquote>`).join("")}</div>` : ""}
      ${thanksTo.length || ip.letter ? `${sec("Thank you", th.to || ip.letter ? exTag : "")}
      <div class="imp-thanks">
        ${thanksTo.length ? `<h3>${esc(th.title || ((th.to || []).length ? "From the children, to the people who gave" : "Thank you to the people who gave"))}</h3>
        <ul>${thanksTo.map(t => `<li><b>Dear ${esc(t.name)},</b>${t.words ? `<span>${esc(t.words)}</span>` : `<span>thank you.</span>`}</li>`).join("")}</ul>
        ${th.from ? `<p class="imp-from">${esc(th.from)}</p>` : ""}` : ""}
        ${ip.letter ? `<div class="imp-letter"><h4>From the organisers</h4><p>“${esc(ip.letter.words)}”</p>${ip.letter.who ? `<p class="imp-from">${esc(ip.letter.who)}</p>` : ""}${ip.letter.link ? `<a href="${esc(ip.letter.link)}">Read the full letter</a>` : ""}</div>` : ""}
      </div>` : ""}
      ${tl.length ? `${sec("The day, hour by hour", (ip.timeline || []).length ? exTag : "")}
      ${hasLive || ex ? `<p class="imp-sub">From the Live from the day posts · Sri Lanka time</p>` : ""}
      <ol class="imp-tl">${tl.map(t => `<li><time>${esc(t.time)}</time><span>${esc(t.what)}</span></li>`).join("")}</ol>
      ${hasLive ? `<p><a class="imp-a" href="#live" data-imp-live>See every photo and post from the day</a></p>` : ""}` : ""}
      ${spent || (given && p.money) ? `${sec("Where every rupee went", ex && ip.money ? exTag : "")}
      <div class="imp-money">
        ${closed ? `<span class="imp-stamp">Books closed</span>` : ""}
        <dl>
          <div><dt>Given</dt><dd>${money(given)}</dd></div>
          ${spent ? `<div><dt>Spent, with receipts</dt><dd>${money(spent)}</dd></div>
          <div><dt>${given - spent >= 0 ? "Left over" : "Over budget"}</dt><dd>${money(Math.abs(given - spent))}</dd></div>` : `<div><dt>Spent</dt><dd><small>receipts coming</small></dd></div>`}
        </dl>
        ${given && spent ? `<div class="imp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, Math.round(spent / given * 100))}" aria-label="Share of the money spent"><i style="width:${Math.min(100, Math.round(spent / given * 100))}%"></i></div>` : ""}
        ${Object.keys(byLine).length ? `<p class="imp-lines">${Object.entries(byLine).map(([k, v]) => `${esc(k)} ${money(v)}`).join(" · ")}</p>` : ""}
        ${p.money ? `<a class="imp-a" href="/projects/${slugOf(p)}/money">Follow every rupee: the full money page</a>` : ""}
      </div>` : ""}
      <div class="imp-next">
        <h3>Make the next moment happen</h3>
        <p>Another school is waiting for its first day out.</p>
        <a class="btn imp-go" href="/projects">See projects waiting</a>
        <button type="button" class="btn ghost" data-imp-share>Share this day</button>
      </div>
    </section>`;
  }
  function renderProject(app, site, projects, slug) {
    const i = projects.findIndex(p => slugOf(p) === slug);
    const p = projects[i];
    if (!p) {
      app.innerHTML = `<section class="intro"><h1>Project not found</h1><p>It may have been renamed or removed.</p><p><a href="/initiated">See all projects</a></p></section>`;
      return;
    }
    document.title = `${p.title} · ${site.name}`;
    const initials = String(p.organization || site.name || "").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const updates = (p.updates || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const photos = p.photos || [];
    const media = p.media || [];
    const count = n => n ? ` (${n})` : "";
    // Budget: what the day costs (lines), who paid for it (funders), and how far along it is.
    const num = v => { const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
    const money = n => `${esc(p.currency || site.currency || "$")}${Math.round(n).toLocaleString("en-US")}`;
    const lines = (p.budget || []).filter(x => x && x.item);
    const funders = (p.funders || []).filter(x => x && x.name);
    const goal = num(p.goal) || lines.reduce((s, x) => s + num(x.amount), 0);
    const raised = funders.reduce((s, x) => s + num(x.amount), 0);
    const pct = goal ? Math.min(100, Math.round(raised / goal * 100)) : 0;
    const full = goal > 0 && raised >= goal;
    const budgetPanel = cls => `
      <div class="panel budget ${cls}${full ? " full" : ""}">
        <h2>Budget</h2>
        ${goal ? `
          <p class="b-top"><b>${money(raised)}</b> <span>funded of ${money(goal)}</span></p>
          <div class="b-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Share of the budget funded"><i style="width:${pct}%"></i></div>
          <dl class="b-facts">
            <div><dt>${funders.length === 1 ? "Supporter" : "Supporters"}</dt><dd>${funders.length}</dd></div>
            <div><dt>${full ? "Status" : "Still needed"}</dt><dd>${full ? "Fully funded" : money(goal - raised)}</dd></div>
          </dl>`
        : `<p class="b-wait">The budget for this project is being prepared. It will be shown here as soon as it is ready.</p>`}
        <p class="b-pledge"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 20s-7-4.4-7-9.6A4.2 4.2 0 0 1 12 7.7a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20z" fill="currentColor"/></svg> Every penny goes to the day itself.</p>
      </div>`;
    // "Activating" ring: every step a project needs before the day can happen is one slice of the circle.
    // Funding fills its slice little by little; the other steps are either done or still to come.
    const steps = ringSteps(p);
    const delivered = stageNum(p) === 3;
    const ringPct = delivered ? 100 : Math.round(steps.reduce((s, x) => s + x.done, 0) / steps.length * 100);
    const ringPanel = cls => stageNum(p) === 1 && !p.sample ? goPanelHTML(p, site, cls) : activatingPanelHTML(p, cls);
    const moneyHTML = `
      ${lines.length ? `<section class="money">
        <h2 class="section-title">Where the money goes</h2>
        <ul class="money-list">${lines.map(x => `<li><b>${num(x.amount) ? money(num(x.amount)) : ""}</b><span>${esc(x.item)}</span></li>`).join("")}</ul>
        ${goal ? `<p class="money-total"><span>Total budget</span><b>${money(goal)}</b></p>` : ""}
      </section>` : ""}
      ${funders.length ? `<section class="money">
        <h2 class="section-title">Made possible by</h2>
        <ul class="funders">${funders.map(f => `<li><span class="avatar">${esc(String(f.name).trim().split(/\s+/).filter(w => /^[A-Za-z0-9]/.test(w)).map(w => w[0]).slice(0, 2).join("").toUpperCase())}</span><span class="f-name">${esc(f.name)}${f.pledged && FEAT.reserve ? ` <em class="f-pledged">reserved</em>` : ""}${f.tribute ? `<small class="f-tribute">${esc(f.tribute)}</small>` : ""}</span>${num(f.amount) && !f.hide_amount ? `<b>${money(num(f.amount))}</b>` : ""}</li>`).join("")}</ul>
      </section>` : ""}`;
    // Small line icons for the folder tabs: book, heart, camera, play.
    const ic = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const TAB_ICONS = {
      story: ic('<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.500V5c-3-.5-6 0-8 1.500z"/><path d="M12 6.500V19.5"/>'),
      updates: ic('<path d="M12 20s-7-4.4-7-9.600A4.2 4.2 0 0 1 12 7.700a4.2 4.2 0 0 1 7 2.700C19 15.6 12 20 12 20z"/>'),
      pictures: ic('<path d="M4 8h3.200l1.5-2h6.600l1.5 2H20v11H4z"/><circle cx="12" cy="13.2" r="3.3"/>'),
      media: ic('<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M10.2 9.300v5.400l4.6-2.700z" fill="currentColor"/>'),
      budget: ic('<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17"/><path d="M7 14.500h4"/>')
    };
    // Under the picture: the story, cut to three lines, with an inviting link to open the rest.
    const st = stageNum(p);
    const taleSrc = String(p.story || "").replace(/^\s*#{1,4}\s*Summary\s*\n+/i, "").trim() || p.summary || "";
    const TALE_MORE = ["", "See how this smile begins", "See how this moment comes together", "Relive the whole day"];
    const taleHTML = taleSrc ? `<section class="ptale s${st}">
        ${p.quote ? `<p class="pull">“${esc(p.quote)}”</p>` : ""}
        <div class="ptale-text story" id="ptale-text">${(h => { const k = h.indexOf("</p>") + 4; return k > 3 && h.slice(k).trim() ? h.slice(0, k) + `<div class="ptale-rest">${h.slice(k)}</div>` : h; })(md(taleSrc))}</div>
        <button class="ptale-more" type="button" aria-expanded="false" aria-controls="ptale-text" hidden><span>${TALE_MORE[st]}</span><i aria-hidden="true">⌄</i></button>
      </section>` : "";
    // Overview at the top of the Story tab (SURESH, 23 Nov 2026: "some overview at the top, the places they
    // visit, kids and teachers"). All optional, from projects.json: overview {lead, facts[{k,v}]},
    // who [{value,label}], places [{name, local, when, about}].
    const ov = p.overview || {}, who = p.who || [], places = p.places || [];
    const overviewHTML = (ov.lead || (ov.facts || []).length || who.length || places.length) ? `<section class="pov s${st}">
        <div class="pov-top"><p class="pov-k">Overview</p>
        ${ov.lead ? `<p class="pov-lead">${esc(ov.lead)}</p>` : ""}</div>
        <div class="pov-body">
        ${who.length ? `<div class="pov-who">${who.map(w => `<div><b>${esc(w.value)}</b><span>${esc(w.label)}</span></div>`).join("")}</div>${ov.who_note ? `<p class="pov-note">${esc(ov.who_note)}</p>` : ""}` : ""}
        ${(ov.facts || []).length ? `<dl class="pov-facts">${ov.facts.map(f => `<div><dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd></div>`).join("")}</dl>` : ""}
        ${places.length ? `<h3 class="pov-h">Where they go</h3>
        <ol class="pov-route">${places.map((pl, k) => `<li><span class="pov-n" aria-hidden="true">${k + 1}</span><div><b>${esc(pl.name)}</b>${pl.local ? `<i>${esc(pl.local)}</i>` : ""}${pl.when ? `<em>${esc(pl.when)}</em>` : ""}${pl.about ? `<p>${esc(pl.about)}</p>` : ""}</div></li>`).join("")}</ol>` : ""}
        </div>
      </section>` : "";
    // Title card at the top of the Impact tab: the main points of the difference the day makes (SURESH, 23 Nov 2026).
    const icard = p.impact_card;
    const impactCardHTML = icard && (icard.points || []).length ? `<section class="picard s${st}">
        <p class="picard-k">${esc(icard.kicker || (st === 3 ? "The impact it made" : "The impact it will make"))}</p>
        ${icard.title ? `<h3>${esc(icard.title)}</h3>` : ""}
        <ul>${icard.points.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      </section>` : "";
    // Story first, then Impact, Budget, Media: the same order as on RaavanaaPost (SURESH, 6 Nov 2026).
    const tabs = [["story", "Story"], ["updates", "Impact"], ["budget", "Budget"], ["media", `Media${count(photos.length + media.length)}`]];

    const panes = {
      // The story tab: the opening paragraph in full, the rest behind "See how this smile begins".
      story: overviewHTML + (taleHTML || (overviewHTML ? "" : `<p class="empty">The story is on its way.</p>`)),
      updates: impactCardHTML + expectHTML(p) + (updates.length ? updates.map(u => `<article class="update"><div class="meta">${fmtDate(u.date)}${u.at ? ` · ${lkTime(u.at)}` : ""}</div><h3>${esc(u.title)}</h3>${u.image ? `<img class="update-img" src="${esc(u.image)}" alt="" loading="lazy">` : ""}<div>${md(u.body)}</div></article>`).join("") : `<p class="empty">No impact updates yet.</p>`) + (p.sample || FEAT.voices ? "" : commentsHTML(slugOf(p))),
      budget: `<div class="budget-tab">${budgetDetailHTML(p, site, true)}${p.money ? `<p class="mny-link"><a class="btn ghost" href="/projects/${slugOf(p)}/money">See every rupee in and out</a></p>` : ""}${stageNum(p) === 1 && budgetOf(p).lines.length ? `<p class="note">These are estimates. Once the day has happened, the real costs are shown here.</p>` : stageNum(p) === 2 ? `<p class="note">Once the day has happened, a breakdown of where the money went is shown here.</p>` : ""}</div>`,
      media: (photos.length || media.length) ? `${media.length ? `<div class="media">${media.map(m => { const e = embedFor(m.url); return e ? `<figure style="margin:0"><div class="embed"><iframe src="${esc(e)}" title="${esc(m.title)}" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy"></iframe></div>${m.title ? `<figcaption class="note" style="padding-top:6px">${esc(m.title)}</figcaption>` : ""}</figure>` : `<a class="media-link" href="${esc(m.url)}" target="_blank" rel="noopener">▶ ${esc(m.title || m.url)}</a>`; }).join("")}</div>` : ""}${photos.length ? `<div class="photos">${photos.map((ph, k) => `<figure><button data-src="${esc(imgUrl(ph.image, 1600))}" aria-label="Open picture"><div class="cover"><img src="${esc(imgUrl(ph.image, 600))}" alt="${esc(ph.caption)}" loading="lazy"></div></button>${ph.caption ? `<figcaption>${esc(ph.caption)}</figcaption>` : ""}</figure>`).join("")}</div>` : ""}` : `<p class="empty">${p.photos_private ? "To protect the children, we do not put their photos on this website. The day is told here in words, and the organisers and families keep the photos." : "No videos or pictures yet."}</p>`
    };

    let taleOpen = false;
    const draw = tab => {
      app.innerHTML = `
        ${chooseBarHTML(slugOf(p))}
        ${p.sample ? `<p class="sample-note"><b>Sample page.</b> This shows how a project page looks once it is filled in. The project, the figures and the names are examples, not real.</p>` : ""}
        <nav class="crumbs"><a href="/projects">Projects</a>${p.theme ? ` / ${esc(p.theme)}` : ""}</nav>
        <div class="layout">
          <div style="min-width:0">
            <header class="phead">
              ${p.theme ? `<span class="tag">${esc(p.theme)}</span>` : ""}
              <h1>${esc(p.title)}</h1>
              <div class="byline">${p.organization ? `<span class="avatar">${esc(initials)}</span><span>Submitted by <strong>${esc(p.submitted_by || p.organization)}</strong>${p.location ? ` · ${esc(p.location)}` : ""}</span>` : ""}${p.verified ? `<span class="verified"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> ${esc(vLabel(p))}</span>` : ""}${FEAT.voices && !p.sample && stageNum(p) === 3 ? `<a class="rate-chip" href="#voices-h" data-rate-chip hidden></a>` : ""}
              <div class="glance">
                <button type="button" class="glance-btn" aria-expanded="false" aria-controls="glance-card"><span>At a glance</span><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
                <div class="panel glance-card" id="glance-card">
                  <h2>Project at a glance</h2>
                  <dl class="facts">
                    <dt>Stage</dt><dd>${STAGE_LABEL[stageNum(p) - 1]}</dd>
                    ${(p.glance || []).length ? p.glance.map(g => `<dt>${esc(g.k)}</dt><dd>${esc(g.v)}</dd>`).join("") : `
                    ${p.location ? `<dt>Location</dt><dd>${esc(p.location)}</dd>` : ""}
                    ${p.started ? `<dt>Started</dt><dd>${esc(p.started)}</dd>` : ""}
                    ${p.reach ? `<dt>Reach</dt><dd>${esc(p.reach)}</dd>` : ""}`}
                  </dl>
                  ${(p.impact || []).length ? `<div class="stats">${p.impact.map(s => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>` : ""}
                </div>
              </div>
              </div>
            </header>
            ${stageJourneyHTML(p)}
            ${st === 3 ? `${impactTopHTML(p, site, i)}
            <h2 class="imp-more">The full story, from the start</h2>
            ${liveHTML(p)}` : `
            ${st === 2 && !p.sample ? activatedTopHTML(p) : ""}
            ${p.tagline ? `<p class="psum">${esc(p.tagline)}</p>` : ""}
            ${liveHTML(p)}
            <div class="hero-wrap">
              <div class="hero cover" style="${coverStyle(p, i)}">${coverHTML(p, i, p.cover ? "" : "Cover photo", 1400)}</div>
            </div>
            ${ringPanel("only-narrow")}`}
            ${stageNum(p) === 3 ? "" : `<div class="only-narrow">${budgetBoxHTML(p, site, false)}</div>`}
            <div class="tabs" role="tablist">
              ${tabs.map(([k, l]) => `<button class="tab t-${k}" role="tab" aria-selected="${k === tab}" data-t="${k}">${TAB_ICONS[k]}<span>${l}</span></button>`).join("")}
            </div>
            <section class="folder t-${tab}" role="tabpanel">${panes[tab]}</section>
            ${FEAT.voices && !p.sample ? `<div class="v-jumps"><button type="button" class="v-jump" data-v-jump="comment"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg><span>Comment</span><b data-c-count2></b></button><button type="button" class="v-jump" data-v-jump="vouch"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>Vouch</span></button></div>${voicesHTML(p)}` : ""}
          </div>
          <aside class="side">
            ${ringPanel("only-wide")}
            ${stageNum(p) === 3 ? "" : `<div class="only-wide">${budgetBoxHTML(p, site, false)}</div>`}
            ${p.sample ? "" : shareHTML(p)}
            ${FEAT.voices && !p.sample ? "" : vouchedHTML(p)}
            ${journeyHTML(p, full)}
            ${p.sample ? "" : followBoxHTML(p)}
            <a class="btn ghost" href="/initiated">Back to all projects</a>
          </aside>
        </div>`;
      wireForms(app);
      app.querySelectorAll(".tab").forEach(b => b.onclick = () => { draw(b.dataset.t); history.replaceState(null, "", "#" + b.dataset.t); });
      wireTale(app, taleOpen, v => { taleOpen = v; });
      wireGo(app);
      wireDonate(app, slugOf(p));
      wireGlance(app);
      wireShare(app);
      wireSend(app, p);
      if (FEAT.voices) wireVoices(app, p);
      foldPanels(app);
      wireFollowBox(app, p);
      // Activated top: "Follow the day" opens the Follow box in the side column and puts the cursor in it.
      app.querySelectorAll("[data-pact-follow]").forEach(bt => bt.onclick = () => {
        const box = app.querySelector("[data-pfollow]"); if (!box) return;
        box.style.scrollMarginTop = "86px"; box.scrollIntoView({ block: "start", behavior: "smooth" });
        const inp = box.querySelector("[data-pf-form]:not([hidden]) input[name=name]");
        if (inp) setTimeout(() => inp.focus({ preventScroll: true }), 450);
      });
      // Impact page: "Share this day" uses the phone's share sheet, else copies the link.
      app.querySelectorAll("[data-imp-share]").forEach(bt => bt.onclick = async () => {
        const url = location.origin + "/projects/" + slugOf(p);
        try { if (navigator.share) { await navigator.share({ title: p.title, url }); return; } await navigator.clipboard.writeText(url); bt.textContent = "Link copied"; } catch (e) {}
      });
      app.querySelectorAll("[data-fund]").forEach(b => b.addEventListener("click", () => {
        // With the 100% fold off, "Make it happen" goes straight to the giving form by the budget.
        if (!FEAT.left) { const give = app.querySelector(".b-give [data-donate]"); if (give) { if (!app.querySelector(".pl-inline")) { give.dataset.noScroll = "1"; give.click(); delete give.dataset.noScroll; } const pn = give.closest(".panel") || give; pn.style.scrollMarginTop = "86px"; pn.scrollIntoView({ block: "start", behavior: "smooth" }); } return; }
        const g = [...app.querySelectorAll(".go100")].find(x => x.offsetParent !== null); if (!g) return;
        const open = g.querySelector(".go-open"); if (open && open.getAttribute("aria-expanded") !== "true") open.click();
        const t = g.querySelector("[data-mk=donate]") || g.querySelector(".go-make") || g; if (t.matches && t.matches("[data-mk]")) t.click();
        (g.querySelector(".go-make") || g).scrollIntoView({ block: "center", behavior: "smooth" });
      }));
      app.querySelectorAll(".photos button").forEach(b => b.onclick = () => {
        const lb = document.createElement("div");
        lb.className = "lightbox"; lb.innerHTML = `<img src="${esc(b.dataset.src)}" alt="">`;
        lb.onclick = () => lb.remove(); document.body.appendChild(lb);
      });
    };
    const start = location.hash.slice(1);
    draw(tabs.some(([k]) => k === start) ? start : tabs[0][0]);
    if (start === "live") { const l = document.getElementById("live"); if (l) setTimeout(() => l.scrollIntoView({ block: "start" }), 50); }
  }

  // The money page of a project (/projects/<slug>/money): every rupee in, every rupee out, and the receipts.
  // It is shown for projects that carry a "money" block in projects.json:
  //   "money": { "as_of": "2026-11-12", "day": "2026-11-27",
  //              "spent": [{ "date": "2026-11-27", "item": "Bus to Kandy and back", "amount": 30000, "receipt": "/img/projects/<folder>/receipts/bus.jpg" }],
  //              "receipts": [{ "image": "/img/…", "caption": "…" }] }
  // Money in comes from the project's "funders"; add "received": "2026-11-20" to a funder once the money has arrived
  // (until then it shows as Pledged). A giver who asked for "my name only" gets "hide_amount": true: the name shows,
  // the amount is counted in the totals but not shown beside the name. Receipts: cover names, phone numbers and the school's name before a photo goes up.
  function renderMoney(app, site, projects, slug) {
    const p = projects.find(x => slugOf(x) === slug);
    if (!p || !p.money) {
      app.innerHTML = `<section class="intro"><h1>${p ? "No money page yet" : "Project not found"}</h1><p>${p ? "This project does not have a money page yet." : "It may have been renamed or removed."}</p><p><a href="${p ? "/projects/" + slugOf(p) : "/initiated"}">${p ? "Back to the project" : "See all projects"}</a></p></section>`;
      return;
    }
    document.title = `${p.title} · ${site.name}`;
    const m = p.money, b = budgetOf(p), money = n => moneyOf(site, n, p);
    const day = d => { if (!d) return ""; const dt = new Date(String(d).length === 10 ? d + "T12:00:00" : d);
      return isNaN(dt) ? esc(d) : dt.toLocaleDateString(TA_PATH ? "ta-LK" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); };
    const short = d => { if (!d || d === true) return ""; const dt = new Date(String(d).length === 10 ? d + "T12:00:00" : d);
      return isNaN(dt) ? "" : dt.toLocaleDateString(TA_PATH ? "ta-LK" : "en-GB", { day: "numeric", month: "short", year: "numeric" }); };
    const spent = (m.spent || []).filter(x => x && x.item), out = spent.reduce((t, x) => t + numOf(x.amount), 0);
    const got = b.funders.filter(f => f.received).reduce((t, f) => t + numOf(f.amount), 0);
    const need = Math.max(0, b.goal - b.raised), planned = b.lines.reduce((t, x) => t + numOf(x.amount), 0);
    const receipts = [...spent.filter(x => x.receipt).map(x => ({ image: x.receipt, caption: x.item })), ...(m.receipts || []).filter(x => x && x.image)];
    const open = GIVE_OPEN.has(slugOf(p));
    const tile = (cls, label, value, small) => `<div class="mny-tile ${cls}"><span>${label}</span><b>${value}</b>${small ? `<small>${small}</small>` : ""}</div>`;
    app.innerHTML = `
      <nav class="crumbs"><a href="/projects">Projects</a> / <a href="/projects/${slugOf(p)}">${esc(p.title)}</a></nav>
      <section class="mny">
        <header class="mny-head">
          <span class="eyebrow">Every rupee, in the open</span>
          <h1>Money in, money out</h1>
          <p class="mny-for"><a href="/projects/${slugOf(p)}">${esc(p.title)}</a></p>
          ${m.as_of ? `<p class="mny-date"><span>Last updated</span> <time datetime="${esc(m.as_of)}">${day(m.as_of)}</time></p>` : ""}
        </header>
        <div class="mny-tiles">
          ${tile("goal", "Budget", money(b.goal))}
          ${tile("in", "Money in", money(b.raised), !b.raised ? "" : got >= b.raised ? "received" : got ? "pledged and received" : "pledged so far")}
          ${tile("out", "Money out", money(out), out ? "spent so far" : "nothing spent yet")}
          ${need > 0 ? tile("need", "Still needed", money(need)) : tile("bal", "Balance", money(Math.max(0, b.raised - out)), "money in, less money out")}
        </div>

        <section class="mny-box">
          <h2>Money in</h2>
          ${b.funders.length ? `<table class="mny-table">
            <thead><tr><th scope="col">From</th><th scope="col">Status</th><th scope="col" class="num">Amount</th></tr></thead>
            <tbody>${b.funders.map(f => `<tr><td><span class="f-name">${esc(f.name)}</span>${f.tribute ? `<small class="f-tribute">${esc(f.tribute)}</small>` : ""}</td>
              <td>${f.received ? `<span class="mny-st got"><b>Received</b>${short(f.received) ? ` <time>${short(f.received)}</time>` : ""}</span>` : `<span class="mny-st"><b>Pledged</b></span>`}</td>
              <td class="num">${f.hide_amount ? `<small>in the total</small>` : money(numOf(f.amount))}</td></tr>`).join("")}</tbody>
            <tfoot><tr><th scope="row" colspan="2">Total</th><td class="num">${money(b.raised)}</td></tr></tfoot>
          </table>
          <p class="note">Pledged means the giver has told us the amount. We mark it Received when the money reaches Raavanaa.</p>` : `<p class="empty">No gifts yet.</p>`}
          ${need > 0 ? `<p class="mny-need"><span><b>${money(need)}</b> <span>still to go</span></span>${open ? DONATE_BTN : ""}</p>` : ""}
        </section>

        <section class="mny-box">
          <h2>Money out</h2>
          ${spent.length ? `<table class="mny-table">
            <thead><tr><th scope="col">Date</th><th scope="col">What for</th><th scope="col" class="num">Amount</th></tr></thead>
            <tbody>${spent.map(x => `<tr><td><time>${short(x.date)}</time></td><td>${esc(x.item)}${x.note ? `<small>${esc(x.note)}</small>` : ""}${x.receipt ? ` <a class="mny-rc" href="${esc(x.receipt)}" target="_blank" rel="noopener">See receipt</a>` : ""}</td><td class="num">${money(numOf(x.amount))}</td></tr>`).join("")}</tbody>
            <tfoot><tr><th scope="row" colspan="2">Total spent</th><td class="num">${money(out)}</td></tr></tfoot>
          </table>` : `<p class="mny-wait"><b>Nothing has been spent yet.</b> <span>Each cost is written here when it is paid, with its receipt.</span></p>
          ${m.day ? `<p class="mny-day"><span>The day:</span> <time datetime="${esc(m.day)}">${day(m.day)}</time></p>` : ""}`}
          ${!spent.length && b.lines.length ? `<h3 class="money-h">Planned costs</h3>
          <ul class="bx-list">${b.lines.map(x => `<li><span>${esc(x.item)}</span><b>${money(numOf(x.amount))}</b></li>`).join("")}</ul>
          <p class="bx-total"><span>Planned total</span><b>${money(planned)}</b></p>` : ""}
        </section>

        <section class="mny-box">
          <h2>Receipts</h2>
          ${receipts.length ? `<div class="mny-receipts">${receipts.map(r => `<a href="${esc(r.image)}" target="_blank" rel="noopener"><img src="${esc(imgUrl(r.image, 480))}" alt="" loading="lazy"><span>${esc(r.caption || "")}</span></a>`).join("")}</div>`
            : `<p class="mny-wait"><span>A photo of each receipt is put here after the cost is paid.</span></p>`}
        </section>

        <p class="mny-back"><a class="btn ghost" href="/projects/${slugOf(p)}">Back to the project</a></p>
      </section>`;
    wireDonate(app, slugOf(p));
  }

  function renderPrivacy(app, site) {
    app.innerHTML = `<section class="intro about-page"><span class="eyebrow">Our promise</span><h1 class="follow-title">${headline("Privacy & Child Safety")}</h1><div class="story">${md(site.privacy || "")}</div><p><a href="/contact">Contact us</a></p></section>`;
  }

  function renderAbout(app, site) {
    const org = site.name.charAt(0).toUpperCase() + site.name.slice(1).toLowerCase();
    // /about = site.about (+ about_title if set). Kept versions: /about-before = the first About us (about_old),
    // /about-letter = SURESH's "To everyone who wants to change a life" words (live 20-22 Nov 2026, about_letter).
    const path = location.pathname;
    const OLD = /^\/about-before/.test(path) && !!site.about_old;
    const LETTER = /^\/about-letter/.test(path) && !!site.about_letter;
    const title = LETTER ? site.about_letter_title : OLD ? "" : site.about_title;
    const body = LETTER ? site.about_letter : OLD ? site.about_old : site.about;
    app.innerHTML = `<section class="intro about-page"><span class="eyebrow">About us</span>${!title ? `<h1 class="follow-title"><span class="initial">${esc(org.charAt(0))}</span><span class="org">${esc(org.slice(1))}</span> Community</h1>` : `<h1 class="follow-title about-title">${esc(title)}</h1>`}<div class="story">${md(body)}</div><p><a href="/initiated">See our projects</a></p></section>`;
  }

  // Phone menu button
  const menuBtn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = menuBtn.getAttribute("aria-expanded") !== "true";
      menuBtn.setAttribute("aria-expanded", String(open)); nav.classList.toggle("open", open);
    });
    nav.addEventListener("click", e => { if (e.target.closest("a")) { menuBtn.setAttribute("aria-expanded", "false"); nav.classList.remove("open"); } });
  }

  // Links from Identity emails land on the site. Team invites and email changes go to the portal;
  // sign-up confirmations and password resets go to the members page (it links team members on to the portal).
  if (/(invite_token|email_change_token)=/.test(location.hash) && !/^\/portal/.test(location.pathname)) {
    location.replace("/portal" + location.hash);
  } else if (/(recovery_token|confirmation_token)=/.test(location.hash) && !/^\/(portal|members|ta\/members)/.test(location.pathname)) {
    location.replace("/members" + location.hash);
  }

  // Giving from anywhere (SURESH, 17 Nov 2026): the giver types any amount in their own money; the project counts in
  // rupees. Today's rates come from /api/fx; this table (17 Nov 2026) is used until they arrive or if they can't.
  const PL_CURS = ["LKR", "USD", "CAD", "GBP", "EUR", "AUD", "NZD", "CHF", "NOK", "SEK", "DKK", "INR", "SGD", "MYR", "AED", "QAR", "SAR", "KWD", "JPY"];
  // What the giver sees inside the amount box, so the number means something: C$ 132 CAD, £ 70 GBP, Rs 30,500.
  const PL_SYM = { LKR: "Rs", USD: "$", CAD: "$", GBP: "£", EUR: "€", AUD: "$", NZD: "$", CHF: "Fr", NOK: "kr", SEK: "kr", DKK: "kr", INR: "₹", SGD: "$", MYR: "RM", AED: "AED", QAR: "QR", SAR: "SR", KWD: "KD", JPY: "¥" };
  const PL_FX_TABLE = { LKR: 1, USD: 332.67, CAD: 232.67, GBP: 438.98, EUR: 366.17, AUD: 224.57, NZD: 183.39, CHF: 395.73, NOK: 34.42, SEK: 32.99, DKK: 48.73, INR: 3.54, SGD: 257.93, MYR: 81.29, AED: 90.59, QAR: 91.39, SAR: 88.72, KWD: 1074.11, JPY: 2.08 };
  let PL_FX = null;
  // A first guess at the giver's money from their phone's time zone and language; they can change it.
  const guessCur = () => {
    let tz = "", lang = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; lang = navigator.language || ""; } catch (e) { /* none */ }
    const byTz = [[/^Asia\/Colombo/, "LKR"], [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Montreal)/, "CAD"], [/^Europe\/London/, "GBP"], [/^Australia\//, "AUD"],
      [/^Pacific\/Auckland/, "NZD"], [/^Europe\/Zurich/, "CHF"], [/^Europe\/Oslo/, "NOK"], [/^Europe\/Stockholm/, "SEK"], [/^Europe\/Copenhagen/, "DKK"], [/^Asia\/(Kolkata|Calcutta)/, "INR"],
      [/^Asia\/Singapore/, "SGD"], [/^Asia\/Kuala_Lumpur/, "MYR"], [/^Asia\/Dubai/, "AED"], [/^Asia\/Qatar/, "QAR"], [/^Asia\/Riyadh/, "SAR"], [/^Asia\/Kuwait/, "KWD"], [/^Asia\/Tokyo/, "JPY"],
      [/^Europe\//, "EUR"], [/^America\//, "USD"]];
    const hit = byTz.find(([re]) => re.test(tz));
    return hit ? hit[1] : /-CA$/.test(lang) ? "CAD" : /-GB$/.test(lang) ? "GBP" : /-IN$/.test(lang) ? "INR" : "LKR";
  };
  const PL_SAYS = ["Be the smile", "Make the smile", "Make the moment", "Complete the day", "Light up their day"];
  const HEART_SVG = `<svg class="pl-heart" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg>`;

  // Sponsor a smile: card payments through PayHere (rupees) or Stripe Checkout (Canadian dollars).
  //   /give                  monthly Smile member, a one-time gift to Raavanaa, or pick a project
  //   /give?project=<slug>   sponsor that project (never more than what it still needs)
  // opts.inline (SURESH, 17 Nov 2026): the short form opens in place on the project page, inside `app` (a box there).
  function renderGive(app, site, projects, GIVE, opts = {}) {
    const q = opts.q || new URLSearchParams(location.search);
    // Memory launch (FEAT.sponsor off): /give and /fund open only from the moment page (which sends ?tribute=).
    // Opened directly, they go to the moment page instead, keeping the project chosen.
    // The simple project pledge (FEAT.pledge) opens /give?project=<slug> straight from the project, with no detour.
    if (!FEAT.sponsor && !q.get("tribute") && !(FEAT.pledge && q.get("project"))) {
      const pj = q.get("project");
      location.replace(FEAT.moment ? (TA_PATH ? "/ta" : "") + "/moment?for=memory" + (pj ? "&project=" + encodeURIComponent(pj) : "") : "/projects");
      return;
    }
    const on = !!(GIVE && GIVE.enabled);
    // No card payments at launch (SURESH, 12 Nov 2026): the form asks what the person would like to give, and a volunteer
    // replies to them personally. No money is taken on the site and no bank details are shown anywhere on it.
    // The card forms below stay built; they come back by themselves when PayHere is switched on in Netlify.
    const ASK = !on;
    const SAFE = `<p class="note give-safe"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3l7 2.6v5.6c0 4.3-2.9 7.6-7 9.3-4.1-1.7-7-5-7-9.3V5.6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12l2.2 2.2L15.2 10" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Raavanaa will only ever share bank details in a personal reply from our official email. Never pay into an account sent to you any other way.</span></p>`;
    const needsMoney = x => { if (!x || !x.verified || stageNum(x) !== 1) return false; const b = budgetOf(x); return b.goal > 0 && b.raised < b.goal; };
    const LKR = GIVE_CUR === "LKR";
    // An estimate of the card fee, so a giver can choose to cover it (PayHere about 3.3%, Stripe about 2.9% + 30¢).
    const fee = c => LKR ? Math.max(0, Math.ceil((c / (1 - 0.033) - c) / 100) * 100) : Math.max(0, Math.ceil((c + 30) / (1 - 0.029)) - c);
    const dollars = n => cash(n);
    const MIN = LKR ? 500 : 5;
    // /fund: the Raavanaa Fund on a page of its own (SURESH, 10 Nov 2026). The team chooses the next day of joy.
    const FUND = document.body.dataset.page === "fund";
    const p = !FUND && q.get("project") ? projects.find(x => slugOf(x) === slugify(q.get("project"))) : null;
    const open = projects.filter(canGive);
    if (!opts.inline) document.title = (FUND ? "The Raavanaa Fund" : p ? `Sponsor a smile: ${p.title}` : "Sponsor a smile") + ` · ${site.name}`;
    const TR_EN = { memory: "In loving memory of", remembrance: "Remembering, on the anniversary of", birthday: "Celebrating the birthday of", wedding: "Celebrating the wedding anniversary of",
      newborn: "Welcoming", success: "Celebrating the success of", recovery: "Giving thanks for the recovery of", gratitude: "With gratitude for", festival: "A festival gift in the name of", honour: "In honour of" };
    const REASONS = [["memory", "In loving memory of"], ["remembrance", "Remembering, on the anniversary of"], ["birthday", "Celebrating the birthday of"], ["wedding", "Celebrating the wedding anniversary of"],
      ["newborn", "Welcoming"], ["success", "Celebrating the success of"], ["recovery", "Giving thanks for the recovery of"], ["gratitude", "With gratitude for"], ["festival", "A festival gift in the name of"], ["honour", "In honour of"]];

    const formHTML = (kind, amounts, opts = {}) => {
      const id = "g-" + kind;
      // "I'd like to give": the same choices, then a name and a way to reply. Nothing is paid here.
      const tail = ASK ? `
        <label><span>Your name</span><input name="name" maxlength="80" autocomplete="name" required></label>
        <label><span>WhatsApp number or email</span><input name="contact" maxlength="120" required placeholder="077 123 4567 or you@example.com"></label>
        <fieldset class="give-for give-list"><legend>How should we list your gift?</legend>
          <label class="give-chip"><input type="radio" name="listing" value="both" checked><span>My name and the amount</span></label>
          <label class="give-chip"><input type="radio" name="listing" value="name"><span>My name only</span></label>
          <label class="give-chip"><input type="radio" name="listing" value="anonymous"><span>Anonymous</span></label>
          <label class="give-chip"><input type="radio" name="listing" value="own"><span>In my own words</span></label>
        </fieldset>
        <label class="give-list-own" hidden><span>List my gift as</span><input name="listing_words" maxlength="80" placeholder="e.g. The Rajan family, Toronto"></label>
        <p class="note give-list-note">Every gift is shown openly. You choose how yours appears.</p>
        <label class="give-wish"><span>${kind === "general" ? "Your wish" : "A few words for us"} <small>(optional)</small></span><textarea name="wish" maxlength="300" rows="2"${kind === "general" ? ` placeholder="Is there something you would love this gift to do?"` : ""}></textarea></label>
        <button class="btn give-pay" type="submit">I'd like to give</button>
        ${SAFE}
        <p class="note give-msg" role="status" hidden></p>
      </form>` : "";
      return `<form class="give-form${ASK ? " give-ask" : ""}" data-kind="${kind}" ${opts.left ? `data-left="${opts.left}"` : ""}${ASK ? " data-ask" : ""}${ASK && opts.goal ? ` data-goal="${opts.goal}" data-raised="${opts.raised || 0}" data-cur="${esc(opts.cur || "")}"` : ""} novalidate>
        <input type="hidden" name="kind" value="${kind}">
        ${opts.slug ? `<input type="hidden" name="project" value="${esc(opts.slug)}">` : ""}
        <p hidden><label>Leave empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
        ${/^[a-z0-9]{6,16}$/.test(q.get("m") || "") ? `<input type="hidden" name="moment" value="${esc(q.get("m"))}">` : ""}
        <fieldset class="give-for"><legend>Who is this gift for?</legend>
          <label class="give-chip"><input type="radio" name="tribute_mode" value="none" checked><span>From me</span></label>
          <label class="give-chip"><input type="radio" name="tribute_mode" value="name"><span>In someone's name</span></label>
          <label class="give-chip"><input type="radio" name="tribute_mode" value="behalf"><span>On behalf of a family or group</span></label>
        </fieldset>
        <div class="give-tribute" hidden>
          <p class="note give-tr-note">Remember a loved one, or mark a birthday or anniversary. Tamil families have always given on these days; now the day of joy carries their name.</p>
          <label class="give-tr-kind"><span>This gift is</span><select name="tribute_kind">
            ${REASONS.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
          <label><span class="give-tr-who">Their name</span><input name="tribute_name" maxlength="60" placeholder="e.g. Amma, Kamala Rajan"></label>
          <label><span>A few words <small>(optional)</small></span><input name="tribute_note" maxlength="140"></label>
          ${kind === "project" ? `<label class="give-check"><input type="checkbox" name="tribute_show" value="yes" checked> <span>Show this name on the project page</span></label>` : ""}
          ${kind === "member" ? "" : `<label class="give-check"><input type="checkbox" name="remind" value="yes"> <span>Remind me every year, a week before the day</span></label>
          <label class="give-remind-day" hidden><span>The day <small>(a birthday, a remembrance day...)</small></span><input type="date" name="remind_day"></label>`}
          <p class="note give-moment-link"${FEAT.moment ? "" : " hidden"}><a href="/moment">More reasons, and a card to keep →</a></p>
        </div>
        <fieldset class="give-amounts"><legend>${ASK ? (kind === "member" ? "Roughly how much each month?" : "Roughly how much?") : `${kind === "member" ? "Each month" : "Amount"} (${LKR ? "Sri Lankan rupees" : "CAD"})`}</legend>
          ${amounts.map((a, i) => `<label class="give-chip${a.what ? " give-real" : ""}"><input type="radio" name="pick" value="${a.v}" data-label="${esc(a.label || dollars(a.v))}"${i === (opts.pick || 0) ? " checked" : ""}><span>${a.what ? `<b>${esc(a.label || dollars(a.v))}</b><small>${esc(a.what)}</small>` : esc(a.label || dollars(a.v))}</span></label>`).join("")}
          <label class="give-chip give-other"><input type="radio" name="pick" value="other"><span>Other</span></label>
          ${ASK ? `<label class="give-chip"><input type="radio" name="pick" value="unsure"><span>Not sure yet</span></label>` : ""}
        </fieldset>
        ${ASK ? `<label class="give-own" hidden><span>Your amount <small>(any currency)</small></span><input name="own" maxlength="40" autocomplete="off" placeholder="Rs 7,500 or $40"></label>${opts.goal ? `<p class="give-reach" role="status" hidden></p>` : ""}${tail}` : `<label class="give-own" hidden>Your amount
          <span class="give-dollar"><b aria-hidden="true">${LKR ? "Rs" : "$"}</b><input name="own" inputmode="decimal" autocomplete="off" placeholder="0" aria-label="Your amount in ${LKR ? "Sri Lankan rupees" : "Canadian dollars"}"></span></label>
        ${kind === "general" ? "" : `<label><span>Your name <small>(optional)</small></span><input name="name" maxlength="60" autocomplete="name"></label>
        <label class="give-check"><input type="checkbox" name="show_name" value="yes"> <span>${kind === "member" ? "Show my name with the Smile members" : "Show my name on the project page"}</span></label>
        <p class="note give-hint">If you leave this unticked, you'll appear as “Anonymous”.</p>`}
        ${kind === "general" ? `<label class="give-wish"><span>Your wish <small>(optional)</small></span><textarea name="wish" maxlength="300" rows="2" placeholder="Is there something you would love this gift to do?"></textarea></label>` : ""}
        ${LKR ? `<label><span>Email <small>(for your receipt)</small></span><input name="email" type="email" maxlength="120" autocomplete="email" required></label>
        <label><span>Phone</span><input name="phone" type="tel" maxlength="20" autocomplete="tel" required placeholder="07X XXX XXXX"></label>` : ""}
        <label class="give-check"><input type="checkbox" name="cover_fee" value="yes" checked> <span>Add <b class="give-fee">${dollars(0)}</b> so the card fee doesn't come out of the gift</span></label>
        <button class="btn give-pay" type="submit"${on ? "" : " disabled"}>${on ? "Continue to secure payment" : "Card payments coming soon"}</button>
        <p class="note give-msg" role="status" hidden></p>
      </form>`}`;
    };
    const card = x => { const b = budgetOf(x), left = Math.max(0, b.goal - b.raised), cad = leftCad(x);
      const need = ASK ? `${moneyOf(site, left, x)} still needed` : isRupees(x) && !LKR ? `${moneyOf(site, left, x)} still needed (about ${dollars(Math.round(cad))} CAD)` : `${isRupees(x) ? moneyOf(site, left, x) : dollars(left)} still needed`;
      return `<a class="give-proj" href="/give?project=${encodeURIComponent(slugOf(x))}">
        <span class="give-proj-pic" style="${coverStyle(x, 0)}">${x.cover ? `<img src="${esc(imgUrl(x.cover, 400))}" alt="" loading="lazy">` : ""}</span>
        <span class="give-proj-text"><b>${esc(x.title)}</b><span>${esc(need)} · ${b.pct}% covered</span>
        <span class="b-bar" aria-hidden="true"><i style="width:${b.pct}%"></i></span></span></a>`; };
    const notes = ASK ? `<ul class="give-notes">
        <li>No money is taken on this site, and no bank details are shown on it. A volunteer replies to you personally and tells you how to send your gift.</li>
        <li>Raavanaa Community is a nonprofit, not a registered charity, so gifts don't come with a tax receipt.</li>
        <li>Every gift shows on the project page, and after the day you'll see how it went and where the money went.</li>
      </ul>` : `<ul class="give-notes">
        <li>Payments are handled securely by ${GIVE_BY}. Raavanaa never sees your card details.${LKR ? " Cards from any country are welcome; your bank converts from rupees." : ""}</li>
        <li>Raavanaa Community is a nonprofit, not a registered charity, so gifts don't come with a tax receipt. ${GIVE_BY} emails you a payment receipt.</li>
        <li>Every gift shows on the project page, and after the day you'll see the photos and where the money went.</li>
      </ul>`;
    const banner = `${q.get("cancelled") ? `<p class="give-banner">Payment cancelled. Nothing was charged.</p>` : ""}
      ${on ? (GIVE.test ? `<p class="give-banner test">Test mode: ${LKR ? "this opens PayHere's sandbox; use one of PayHere's test cards" : "use Stripe's test card 4242 4242 4242 4242"}. No real money is taken.</p>` : "") : `<p class="give-banner ask">Tell us what you would like to give, and a Raavanaa volunteer will reply to you personally.</p>`}`;

    // The fund's ready-made amounts: "give_amounts" in site.json (what each amount pays for) while asking, else the usual three.
    const fundPicks = ASK && LKR && (site.give_amounts || []).some(x => x && numOf(x.amount) > 0 && x.label)
      ? site.give_amounts.filter(x => x && numOf(x.amount) > 0 && x.label).map(x => ({ v: numOf(x.amount), label: dollars(numOf(x.amount)), what: x.label }))
      : (LKR ? [2500, 5000, 10000] : [25, 50, 100]).map(v => ({ v }));
    // The simple project pledge (SURESH, 17 Nov 2026): one short form on the project. Amount, name, email or WhatsApp,
    // follow, send. "We'll send you the ways to fund." The pledge shows on the project at once and the % bar goes up.
    // Coming from Gift a Moment (?tribute=&tn=) it is the same short form (SURESH, 20 Nov 2026: "after you said give in
    // their name, why this page with all the details?"): the moment is shown as one line with Change, not asked again.
    const MOMENT = q.get("tribute") && q.get("tn") ? { k: String(q.get("tribute")).replace(/[^a-z]/g, ""), words: (q.get("tw") || "").slice(0, 60), name: q.get("tn").slice(0, 60),
      note: (q.get("tnote") || "").slice(0, 140), code: /^[a-z0-9]{6,16}$/.test(q.get("m") || "") ? q.get("m") : "",
      day: q.get("every") === "year" && q.get("remind") && /^\d{4}-\d{2}-\d{2}$/.test(q.get("day") || "") ? q.get("day") : "" } : null;
    const SIMPLE = ASK && !!p && FEAT.pledge && (!q.get("tribute") || !!MOMENT);
    if (SIMPLE) load("/api/fx").then(d => { if (d && d.lkr) { PL_FX = d.lkr; app.querySelectorAll(".pledge-form").forEach(f => f.dispatchEvent(new Event("input"))); } }).catch(() => {});
    const wirePledge = (f, x) => {
      const goal = +f.dataset.goal || 0, raised = +f.dataset.raised || 0, left = +f.dataset.left || 0, cur = f.dataset.cur || "";
      const own = f.querySelector(".give-own"), ownIn = f.querySelector('[name="own"]'), reach = f.querySelector(".give-reach"), msg = f.querySelector(".give-msg"), pay = f.querySelector(".give-pay");
      const bar = app.querySelector(".pl-proj .b-bar i"), barText = app.querySelector(".pl-proj .give-proj-text > span:not(.b-bar)");
      const say = (t, bad) => { msg.hidden = false; msg.textContent = t; msg.classList.toggle("bad", !!bad); };
      // Any amount, in the giver's own money; the project counts in rupees (today's rate from /api/fx).
      const curSel = f.querySelector('[name="cur"]');
      if (curSel) { let c = ""; try { c = localStorage.getItem("raav-cur") || ""; } catch (e) { /* none */ } curSel.value = PL_CURS.includes(c) ? c : guessCur(); }
      const typed = () => { const v = parseFloat(String(ownIn.value).replace(/,/g, "").replace(/[^0-9.]/g, "")); return isFinite(v) && v > 0 ? v : 0; };
      const rate = () => !curSel ? 1 : ((PL_FX && PL_FX[curSel.value]) || PL_FX_TABLE[curSel.value] || 0);
      const amount = () => Math.round(typed() * rate());
      // "Complete the day" (SURESH, 17 Nov 2026): one tap fills in what is left, in the giver's own money.
      const fullIn = cur => { const r = cur === "LKR" || !curSel ? 1 : ((PL_FX && PL_FX[cur]) || PL_FX_TABLE[cur] || 0); return r ? (cur === "LKR" || !curSel ? left : Math.ceil(left / r)) : 0; };
      // Tapped once, it stays "full": choosing another currency fills in the full amount in that money again.
      const fullBtn = f.querySelector("[data-full]"), rateEl = f.querySelector("[data-rate]");
      let full = false;
      const fill = () => { ownIn.value = fullIn(curSel ? curSel.value : "LKR").toLocaleString("en-US"); };
      const fillBtn = f.querySelector("[data-fill]");
      if (fillBtn) fillBtn.addEventListener("click", () => { full = true; fill(); f.dispatchEvent(new Event("input")); });
      if (fullBtn) fullBtn.addEventListener("click", () => { full = true; fill(); f.dispatchEvent(new Event("input")); ownIn.scrollIntoView({ block: "center", behavior: "smooth" }); });
      ownIn.addEventListener("input", () => { full = false; });
      if (curSel) curSel.addEventListener("change", () => { if (full) fill(); });
      // The title on the button takes turns (SURESH, 17 Nov 2026).
      const sayEl = app.querySelector("[data-say]");
      if (sayEl && !matchMedia("(prefers-reduced-motion: reduce)").matches) { let k = 0; setInterval(() => { k = (k + 1) % PL_SAYS.length; sayEl.classList.remove("in"); void sayEl.offsetWidth; sayEl.textContent = PL_SAYS[k]; sayEl.classList.add("in"); }, 2600); }
      // An amount of rupees, said in the giver's chosen money (rounded up): "$131 CAD", "£70 GBP", "Rs 30,500".
      const inTheirs = rs => { const c = curSel ? curSel.value : "LKR"; if (!curSel || c === "LKR") return moneyOf(site, rs, x); const r = (PL_FX && PL_FX[c]) || PL_FX_TABLE[c] || 0; return r ? `${PL_SYM[c] && PL_SYM[c].length <= 2 ? PL_SYM[c] : ""}${Math.ceil(rs / r).toLocaleString("en-US")} ${c}` : moneyOf(site, rs, x); };
      const typedText = () => !curSel || curSel.value === "LKR" ? moneyOf(site, typed(), x) : `${curSel.value} ${typed().toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
      const pctWith = v => goal ? Math.min(100, Math.round((raised + v) / goal * 100)) : 0;
      const update = () => {
        const v = amount(), pct = pctWith(v), foreign = curSel && curSel.value !== "LKR";
        try { if (curSel) localStorage.setItem("raav-cur", curSel.value); } catch (e) { /* none */ }
        // Inside the amount box: the currency sign before the number and its code after it.
        if (curSel) { const c = curSel.value; f.querySelector("[data-sym]").textContent = PL_SYM[c] || c; f.querySelector("[data-code]").textContent = c === "LKR" || ["AED"].includes(c) ? "" : c; }
        // Just above the amount: what it is in Sri Lankan rupees.
        if (rateEl) {
          const c = curSel ? curSel.value : "LKR", r = rate();
          rateEl.hidden = true;   // no exchange line (SURESH, 18 Nov 2026): the amounts left are shown in their money instead
        }
        // The button keeps showing what is still left, after this giver's part, and its little ring moves with it.
        if (fullBtn) {
          const after = Math.max(0, left - v), c = curSel ? curSel.value : "LKR", lt = f.querySelector("[data-left-text]");
          // What is left, in the giver's own money (SURESH, 18 Nov 2026).
          lt.innerHTML = v && v >= left ? `<strong>Fully funded</strong> with yours` : `<strong>${esc(inTheirs(left))}</strong> left${foreign ? ` <span class="pl-eq-s">(${esc(moneyOf(site, left, x))})</span>` : ""}`;
          const pm = pctWith(v); f.querySelector(".pl-mini-arc").setAttribute("stroke-dasharray", `${pm} 100`); f.querySelector("[data-mini-n]").textContent = pm + "%"; f.querySelector("[data-mini-n]").style.fontSize = pm >= 100 ? "9.5px" : "";
          fullBtn.classList.toggle("on", !!v && v >= left);
        }
        const conv = "";
        // Under the amount: what would still be left after their part, in their money.
        const after = Math.max(0, left - v);
        const text = !v ? "" : conv + (after <= 0 ? "Your part completes this project: 100% of its goal." : `Still left after yours: ${inTheirs(after)}${foreign ? ` (${moneyOf(site, after, x)})` : ""}. The project reaches ${pct}%.`);
        if (reach.textContent !== text) reach.textContent = text;
        reach.hidden = !text;
        if (msg.classList.contains("bad")) msg.hidden = true;
      };
      f.addEventListener("change", update); f.addEventListener("input", update); update();
      f.addEventListener("submit", async e => {
        e.preventDefault();
        const v = amount(), nameIn = f.querySelector('[name="name"]'), ct = f.querySelector('[name="contact"]');
        if (!v) { say("Please type how much you would like to give.", true); ownIn.focus(); return; }
        const name = nameIn.value.trim(), contact = ct.value.trim();
        if (!name) { say("Please add your name.", true); nameIn.focus(); return; }
        if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || contact.replace(/\D/g, "").length >= 7)) { say("Please add your email or a WhatsApp number, so we can send you the ways to fund.", true); ct.focus(); return; }
        const show = f.querySelector('[name="show"]').checked, follow = f.querySelector('[name="follow"]').checked;
        const trName = f.querySelector('[name="tribute_name"]').value.trim(), trSel = f.querySelector('[name="tribute_kind"]');
        const trWords = trSel.dataset.words || (trSel.selectedOptions && trSel.selectedOptions[0] ? trSel.selectedOptions[0].textContent.trim() : "");
        const amountText = curSel && curSel.value !== "LKR" ? `${typedText()} (about ${moneyOf(site, v, x)})` : moneyOf(site, v, x), slug = f.dataset.slug;
        const body = { kind: "project", project: slug, name, contact, amount: amountText, amount_value: Math.min(v, left || v), listing: show ? "both" : "anonymous",
          follow: follow ? "yes" : "no", lang: "en", message: "", "bot-field": f.querySelector('[name="bot-field"]').value };
        if (trName) Object.assign(body, { tribute_on: "yes", tribute_kind: trSel.value, tribute_words: trWords, tribute_name: trName, tribute_show: "yes" });
        if (trName && MOMENT) { if (MOMENT.note) body.tribute_note = MOMENT.note; if (MOMENT.code) body.moment = MOMENT.code; if (MOMENT.day) Object.assign(body, { remind: "yes", remind_day: MOMENT.day }); }
        pay.disabled = true; say("Sending…");
        const copy = new URLSearchParams({ "form-name": "give-request", name, contact, amount: amountText, kind: "project", project: slug, moment: body.moment || "",
          tribute: trName ? `${body.tribute_words} ${trName}` : "", message: follow ? "Wants to follow the project" : "", lang: "en", "bot-field": body["bot-field"], listing: show ? "Name and amount" : "Anonymous" });
        try {
          const [r, n] = await Promise.all([
            fetch("/api/pledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null),
            fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: copy.toString() }).catch(() => null)]);
          const out = r ? await r.json().catch(() => ({})) : {};
          if (r && r.status === 400 && out.error) { say(out.error, true); pay.disabled = false; return; }
          if (!(r && r.ok && out.ok) && !(n && n.ok)) throw new Error("not saved");
          // Show it at once: on this page, and on the project page (this browser) until the list catches up.
          const pct = pctWith(body.amount_value);
          justPledged({ slug, ref: out.ref || "local-" + Date.now(), name: show ? name : "Anonymous", amount: body.amount_value });
          if (bar) bar.style.width = pct + "%";
          if (barText) barText.textContent = `${moneyOf(site, Math.max(0, left - body.amount_value), x)} still needed · ${pct}% covered`;
          // The giver's own room for this project (SURESH, 17 Nov 2026): welcome, a proud line, share, follow, the story.
          const room = new URLSearchParams({ p: slug, r: out.ref || "", n: name.split(/\s+/)[0], a: String(body.amount_value) });
          if (trName) room.set("t", `${body.tribute_words} ${trName}`);
          if (follow) room.set("f", "1");
          room.set("c", /@/.test(contact) ? "email" : "wa");
          if (curSel && curSel.value !== "LKR") room.set("g", typedText());
          location.href = "/room?" + room.toString();
          return;
          const isMail = /@/.test(contact), box = document.createElement("div");
          box.className = "give-done"; box.tabIndex = -1; box.setAttribute("role", "status");
          box.innerHTML = `<p class="give-done-heart" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg></p>
            <h3><span>Thank you,</span> <b>${esc(name)}</b></h3>
            <p class="pl-shows"><b>${esc(amountText)}</b> pledged by <b>${esc(show ? name : "Anonymous")}</b> now shows on the project. It is <b>${pct}%</b> covered.</p>
            <p><b>We'll send you the ways to fund</b> ${isMail ? "by email" : "on WhatsApp"} at <b>${esc(contact)}</b>.</p>
            ${SAFE}
            <p class="give-done-next"><a class="btn" href="/projects/${esc(slug)}">See it on the project</a>${follow ? ` <span class="pl-following">✓ You're following it</span>` : ""}</p>`;
          f.replaceWith(box); box.focus({ preventScroll: true }); box.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch (_) { say("We couldn't send that. Please check your connection and try again.", true); pay.disabled = false; }
      });
    };
    const pledgeHTML = (x, picks, bp, left) => {
      const cur = String(x.currency || site.currency || "$").trim();
      return `<section class="give-one pledge-one">
        <div class="give-proj big pl-proj">${card(x).replace(/^<a [^>]*>/, "").replace(/<\/a>$/, "")}</div>
        <div class="panel give-box">
          <h2>${HEART_SVG} <span class="pl-say" data-say>${PL_SAYS[0]}</span></h2>
          <p class="pl-lede">${FEAT.reserve ? "<b>Reserve and follow.</b> Give from anywhere, in your own money. A volunteer will follow up with the ways to fund. Your part is held for 24 hours." : "<b>Add your name and follow.</b> Give from anywhere, in your own money. Your name shows on the project straight away, and a volunteer will follow up with the ways to fund."}</p>
          <form class="give-form pledge-form give-ask" data-slug="${esc(slugOf(x))}" data-goal="${bp.goal}" data-raised="${bp.raised}" data-left="${left}" data-cur="${esc(cur)}" novalidate>
            <p hidden><label>Leave empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
            ${MOMENT ? `<div class="pl-moment"><span class="pl-moment-ic" aria-hidden="true">♡</span>
              <span class="pl-moment-t"><small>Your moment</small><b>${esc(MOMENT.k === "behalf" ? "On behalf of" : MOMENT.words)} ${esc(MOMENT.name)}</b>${MOMENT.note ? `<i>“${esc(MOMENT.note)}”</i>` : ""}</span>
              <a class="pl-moment-x" href="/moment?for=${esc(MOMENT.k)}&project=${esc(slugOf(x))}&from=pick#mo-step-2">Change</a>
              <input type="hidden" name="tribute_kind" value="${esc(MOMENT.k)}" data-words="${esc(MOMENT.k === "behalf" ? "Given on behalf of" : MOMENT.words)}"><input type="hidden" name="tribute_name" value="${esc(MOMENT.name)}"></div>` : ""}
            ${left > 0 ? `<button type="button" class="pl-full" data-full><svg class="pl-mini" viewBox="0 0 44 44" aria-hidden="true"><defs><linearGradient id="pl-mini-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f7a47"/><stop offset=".5" stop-color="#eaa21c"/><stop offset="1" stop-color="#c8381e"/></linearGradient></defs><circle cx="22" cy="22" r="17" fill="#fff" stroke="#f6dcae" stroke-width="6"/><circle class="pl-mini-arc" cx="22" cy="22" r="17" fill="none" stroke="url(#pl-mini-g)" stroke-width="6" stroke-linecap="round" pathLength="100" stroke-dasharray="${bp.goal ? Math.round(bp.raised / bp.goal * 100) : 0} 100" transform="rotate(-90 22 22)"/><text x="22" y="26" text-anchor="middle" data-mini-n>${bp.goal ? Math.round(bp.raised / bp.goal * 100) : 0}%</text></svg><span><b>${(m => m ? `Complete the moment for all ${m[0]} children` : "Complete the whole moment")(String(x.reach || "").match(/\d+/))}</b><small data-left-text><strong>${esc(moneyOf(site, left, x))}</strong> left</small></span></button>` : ""}
            <label class="pl-amt"><span>Or any amount <small>(in your own money)</small></span>
              <span class="pl-rate" data-rate hidden></span>
              <span class="pl-amt-row">${isRupees(x) ? `<select name="cur" aria-label="Currency">${PL_CURS.map(c => `<option value="${c}">${c === "LKR" ? "Rs" : c}</option>`).join("")}</select>` : `<b class="pl-cur">${esc(cur)}</b>`}
              <span class="pl-money"><i data-sym aria-hidden="true">${isRupees(x) ? "Rs" : esc(cur)}</i><input name="own" inputmode="decimal" maxlength="12" autocomplete="off" placeholder="Any amount" required><em data-code aria-hidden="true"></em><button type="button" class="pl-fill" data-fill title="Fund it fully" aria-label="Fund it fully"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8 12.3l2.6 2.6L16.2 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Full</span></button></span></span></label>
            <p class="give-reach" role="status" hidden></p>
            <label><span>Your name</span><input name="name" maxlength="80" autocomplete="name" required></label>
            <label><span>Email or WhatsApp</span><input name="contact" maxlength="120" required autocomplete="email" placeholder="you@example.com or 077 123 4567"></label>
            <label class="give-check"><input type="checkbox" name="show" value="yes" checked> <span>Show my name and amount on the project <small>(untick to show it as anonymous)</small></span></label>
            <label class="give-check"><input type="checkbox" name="follow" value="yes" checked> <span>Follow this project <small>(sign in with this email to see it in My account)</small></span></label>
            ${MOMENT ? "" : `<details class="pl-tribute"><summary>Give it in someone's name <small>(optional)</small></summary>
              <label><span>This gift is</span><select name="tribute_kind">${REASONS.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
              <label><span>Their name</span><input name="tribute_name" maxlength="60" placeholder="e.g. Amma, Kamala Rajan"></label>
            </details>`}
            <button class="btn give-pay" type="submit">${HEART_SVG}<span>Create the moment</span></button>
            ${SAFE}
            <p class="note give-msg" role="status" hidden></p>
          </form>
        </div>
      </section>`;
    };
    let body;
    if (p) {
      // Until card payments are switched on, the form still shows (its button says "coming soon"), so a giver sees what is ahead.
      const bp = budgetOf(p), needs = !!p.verified && stageNum(p) === 1 && bp.goal > 0 && bp.raised < bp.goal && takesCards(p);
      // When asking, amounts are in the project's own money (rupees or dollars); with cards, in the card currency.
      const left = ASK ? Math.max(0, bp.goal - bp.raised) : Math.floor(leftCad(p) * 100) / 100, open1 = ASK ? needsMoney(p) : canGive(p);
      // Ready-made amounts tied to real things (SURESH, 12 Nov 2026): "give_amounts" in projects.json, e.g. { "amount": 1100, "label": "about one child's whole day in Kandy" }.
      const real = ASK ? (p.give_amounts || []).filter(x => x && numOf(x.amount) > 0 && numOf(x.amount) < left && x.label).map(x => ({ v: numOf(x.amount), label: moneyOf(site, numOf(x.amount), p), what: x.label })) : [];
      const picks = real.length ? real : ((ASK ? isRupees(p) : LKR) ? [2500, 5000, 10000] : [25, 50, 100]).filter(v => v < left).map(v => (ASK ? { v, label: moneyOf(site, v, p) } : { v }));
      picks.push({ v: left, label: `All of it: ${ASK ? moneyOf(site, left, p) : dollars(left)}` });
      if (SIMPLE && open1) body = pledgeHTML(p, picks, bp, left);
      else body = `<section class="give-one">
        <div class="give-proj big">${card(p).replace(/^<a [^>]*>/, "").replace(/<\/a>$/, "")}</div>
        <div class="panel give-box">
          <h2>${open1 ? "Sponsor a smile" : "This project is fully covered"}</h2>
          ${open1 ? formHTML("project", picks, { slug: slugOf(p), left, pick: Math.min(1, picks.length - 1), goal: bp.goal, raised: bp.raised, cur: String(p.currency || site.currency || "$").trim() }) : `<p>Thank you to everyone who made it happen. <a href="/projects/${esc(slugOf(p))}">See the project</a>.</p>`}
          ${open1 && isRupees(p) && !LKR ? `<p class="note">This project's budget is in Sri Lankan rupees. Card gifts are in Canadian dollars and shown on the project at 1 CAD = Rs ${GIVE_RATE}.</p>` : ""}
        </div>
      </section>`;
    } else if (FUND) {
      body = `<section class="give-one give-fund">
        <div class="panel give-box give-fund-how">
          <p class="give-tag">How the fund works</p>
          <ol class="give-fund-steps">
            <li><b>You give once.</b> Your gift goes into the Raavanaa Fund, with every other gift made this way.</li>
            <li><b>Volunteers choose.</b> The team picks the next day of joy from projects that have been visited and verified, where the need is greatest.</li>
            <li><b>Everyone can see.</b> What comes into the fund and where it goes is shown openly, down to the rupee.</li>
          </ol>
          <p class="note">Have something specific in mind? Write your wish in the form, and a volunteer will contact you.</p>
          <p class="note"${FEAT.moment ? "" : " hidden"}><a href="/moment">Give in someone's name →</a> &nbsp; <a href="/moment#projects">Or choose a project yourself →</a></p>
        </div>
        <div class="panel give-box">
          <h2>Give to the Raavanaa Fund</h2>
          ${formHTML("general", fundPicks, { pick: 1 })}
        </div>
      </section>`;
    } else {
      body = `<section class="give-two">
          <div class="panel give-box member">
            <p class="give-tag">Every month</p>
            <h2>Become a Smile member</h2>
            <p>A small gift every month keeps the bridge open, so the next need can be met quickly.${GIVE && GIVE.members ? ` <b>${GIVE.members} Smile member${GIVE.members === 1 ? "" : "s"}</b> already.` : ""}</p>
            ${formHTML("member", (LKR ? [1000, 2500, 5000] : [15, 25, 50]).map(v => ({ v })))}
            <p class="note">${ASK ? `You can stop your monthly gift at any time: just tell us.` : `You can stop your monthly gift at any time: reply to your receipt email or <a href="/contact">contact us</a>.`}</p>
          </div>
          <div class="panel give-box">
            <p class="give-tag">Once</p>
            <h2>Give to Raavanaa</h2>
            <p>A one-time gift the team uses where it is needed most. <a href="/fund">About the Raavanaa Fund →</a></p>
            ${formHTML("general", fundPicks, { pick: 1 })}
          </div>
        </section>
        ${(ASK ? projects.filter(needsMoney) : open).length ? `<section class="give-list"><h2>Or sponsor a project</h2><div class="give-grid">${(ASK ? projects.filter(needsMoney) : open).map(card).join("")}</div></section>` : ""}`;
    }
    if (opts.inline) app.innerHTML = `<div class="give-inline">${body}</div>`;
    else app.innerHTML = `<div class="give-page">
      <header class="give-head"><p class="eyebrow">${FUND ? "The Raavanaa Fund" : "Sponsor a smile"}</p>
        <h1>${FUND ? "Give once. We find the smile." : p ? esc(p.title) : "Be part of the next moment"}</h1>
        <p>${FUND ? "For when you want to help and are happy for us to choose where. Volunteers decide, and every rupee in and out is shown openly." : p ? (ASK ? "Your gift goes straight to this project. You'll see it on the project page, and after the day you'll see how it went and where the money went." : "Your gift goes straight to this project. You'll see it on the project page, and after the day you'll see the photos and where every " + (LKR ? "rupee" : "dollar") + " went.") : "Raavanaa is a bridge between people who need a hand and people ready to give one. Choose how you'd like to help."}</p>
      </header>
      ${SIMPLE ? "" : banner}${body}${SIMPLE ? "" : notes}</div>`;

    app.querySelectorAll(".pledge-form").forEach(f => wirePledge(f, p));
    app.querySelectorAll(".give-form:not(.pledge-form)").forEach(f => {
      const own = f.querySelector(".give-own"), ownIn = f.querySelector('[name="own"]'), feeEl = f.querySelector(".give-fee"), pay = f.querySelector(".give-pay"), msg = f.querySelector(".give-msg");
      const left = +f.dataset.left || 0;
      const amount = () => { const pick = (f.querySelector('[name="pick"]:checked') || {}).value; const v = pick === "other" ? parseFloat(String(ownIn.value).replace(/[^0-9.]/g, "")) : parseFloat(pick); return isFinite(v) ? Math.min(v, left || v) : 0; };
      const update = () => {
        own.hidden = (f.querySelector('[name="pick"]:checked') || {}).value !== "other";
        const mode = (f.querySelector('[name="tribute_mode"]:checked') || {}).value || "none", trBox = f.querySelector(".give-tribute");
        if (trBox && trBox.dataset.mode !== mode) {
          // "In someone's name" asks for the reason and their name; "on behalf of" asks only who the gift is from.
          trBox.dataset.mode = mode; trBox.hidden = mode === "none";
          const group = mode === "behalf", nameIn = f.querySelector('[name="tribute_name"]');
          f.querySelector(".give-tr-kind").hidden = group; f.querySelector(".give-tr-note").hidden = group;
          f.querySelector(".give-tr-who").textContent = group ? "The family, group or person" : "Their name";
          nameIn.placeholder = group ? "e.g. the Rajan family, Class of 1998" : "e.g. Amma, Kamala Rajan";
        }
        const rem = f.querySelector('[name="remind"]'), remDay = f.querySelector(".give-remind-day");
        if (rem && remDay) remDay.hidden = !rem.checked;
        const listOwn = f.querySelector(".give-list-own");
        if (listOwn) listOwn.hidden = (f.querySelector('[name="listing"]:checked') || {}).value !== "own";
        // "Your gift brings this project to N% of its goal": shown when the amount is in the project's own money.
        const reach = f.querySelector(".give-reach");
        if (reach) {
          const pk = (f.querySelector('[name="pick"]:checked') || {}).value, goal = +f.dataset.goal || 0, cur = (f.dataset.cur || "").toLowerCase();
          let v = parseFloat(pk);
          if (pk === "other") { const t = ownIn.value.trim().toLowerCase().replace(cur, "").replace(/^(rs\.?|lkr)/, "").trim(); v = /^[\d,]+(\.\d+)?$/.test(t) ? parseFloat(t.replace(/,/g, "")) : NaN; }
          const pct = goal && v > 0 ? Math.min(100, Math.round(((+f.dataset.raised || 0) + v) / goal * 100)) : 0;
          const text = !pct ? "" : pct >= 100 ? "Your gift completes this project: 100% of its goal." : `Your gift brings this project to ${pct}% of its goal.`;
          if (reach.textContent !== text) reach.textContent = text;
          reach.hidden = !text;
        }
        if (ASK) { if (msg.classList.contains("bad")) msg.hidden = true; return; }
        const a = amount(), c = Math.round(a * 100), add = fee(c) / 100, cover = f.querySelector('[name="cover_fee"]').checked;
        feeEl.textContent = dollars(add);
        if (msg.classList.contains("bad") && a >= MIN) msg.hidden = true;
        if (on) pay.textContent = a >= MIN ? `Pay ${dollars(a + (cover ? add : 0))}${f.dataset.kind === "member" ? " a month" : ""} securely` : "Continue to secure payment";
      };
      // Coming from /moment (or a remembrance post): ?tribute=<reason>&tw=<their words>&tn=<name>&tnote=<words>
      //   &every=year&day=2026-11-27&remind=1  a reminder every year   &m=<code>  the family page   &wish=<their own wish>
      const trPick = q.get("tribute");
      if (trPick && f.querySelector('[name="tribute_mode"]')) {
        f.querySelector(`[name="tribute_mode"][value="${trPick === "behalf" ? "behalf" : "name"}"]`).checked = true;
        const sel = f.querySelector('[name="tribute_kind"]'), tw = (q.get("tw") || "").slice(0, 60);
        if (trPick === "behalf") { /* the box asks only for the family or group */ }
        else if (tw) { const o = document.createElement("option"); o.value = /^[a-z]{3,12}$/.test(trPick) ? trPick : "custom"; o.textContent = tw; o.dataset.own = "1"; [...sel.options].filter(x => x.value === o.value).forEach(x => x.remove()); sel.prepend(o); sel.value = o.value; o.selected = true; }
        else if ([...sel.options].some(o => o.value === trPick)) sel.value = trPick;
        if (q.get("tn")) f.querySelector('[name="tribute_name"]').value = q.get("tn").slice(0, 60);
        if (q.get("tnote")) f.querySelector('[name="tribute_note"]').value = q.get("tnote").slice(0, 140);
        const rem = f.querySelector('[name="remind"]'), day = q.get("day") || "";
        if (rem && q.get("every") === "year" && /^\d{4}-\d{2}-\d{2}$/.test(day)) { f.querySelector('[name="remind_day"]').value = day; rem.checked = q.get("remind") === "1"; }
      }
      if (q.get("wish") && f.querySelector('[name="wish"]')) f.querySelector('[name="wish"]').value = q.get("wish").slice(0, 300);
      // Coming from Gift a Moment with a name (SURESH, 13 Nov 2026): the moment already says who the gift is for, so the
      // form does not ask again. It shows one line instead, with "Change" to open the questions.
      if (trPick && q.get("tn") && f.querySelector(".give-tribute")) {
        const ta = location.pathname.startsWith("/ta/");
        f.classList.add("from-moment");
        const line = document.createElement("p"); line.className = "give-moment-sum";
        line.innerHTML = `<span aria-hidden="true">♡</span><span>${esc(trPick === "behalf" ? (ta ? "சார்பில்:" : "On behalf of") : (q.get("tw") || "").slice(0, 60))} <b>${esc(q.get("tn").slice(0, 60))}</b></span><button type="button">${ta ? "மாற்று" : "Change"}</button>`;
        line.querySelector("button").addEventListener("click", () => { f.classList.remove("from-moment"); line.remove(); });
        f.querySelector(".give-for").before(line);
      }
      // More than one project chosen with the heart: the gift is shared, and the team sees which ones.
      const also = (q.get("also") || "").split(",").map(x => projects.find(y => slugOf(y) === slugify(x))).filter(Boolean).slice(0, 6);
      if (also.length && f.dataset.kind === "project") {
        f.dataset.also = also.map(x => x.title).join("; ");
        const line = document.createElement("p"); line.className = "note give-also";
        line.textContent = (location.pathname.startsWith("/ta/") ? "இவற்றுடனும் பகிரப்படும்: " : "Shared with: ") + also.map(x => x.title).join(" · ");
        (f.querySelector(".give-moment-sum") || f.querySelector(".give-for")).after(line);
      }
      f.addEventListener("change", update); f.addEventListener("input", update); update();
      // "I'd like to give": save the request for the team (and a copy in Netlify Forms), then say what happens next.
      const ask = async () => {
        const say = (t, bad) => { msg.hidden = false; msg.textContent = t; msg.classList.toggle("bad", !!bad); };
        const nameIn = f.querySelector('[name="name"]'), ct = f.querySelector('[name="contact"]'), chip = f.querySelector('[name="pick"]:checked');
        const pick = chip ? chip.value : "unsure";
        if (pick === "other" && !ownIn.value.trim()) { say("Please tell us roughly how much, or choose “Not sure yet”.", true); ownIn.focus(); return; }
        if (!nameIn.value.trim()) { say("Please add your name.", true); nameIn.focus(); return; }
        const contact = ct.value.trim();
        if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || contact.replace(/\D/g, "").length >= 7)) { say("Please add a WhatsApp number or an email address, so we can reply.", true); ct.focus(); return; }
        const mode = (f.querySelector('[name="tribute_mode"]:checked') || {}).value || "none", trName = f.querySelector('[name="tribute_name"]');
        if (mode !== "none" && !trName.value.trim()) { say(mode === "behalf" ? "Please add the name of the family or group." : "Please add the name of the person this gift is for.", true); trName.focus(); return; }
        const remOn = f.querySelector('[name="remind"]'), remDay = f.querySelector('[name="remind_day"]');
        if (mode !== "none" && remOn && remOn.checked && !remDay.value) { say("Please choose the day you would like to be reminded of.", true); remDay.focus(); return; }
        const listing = (f.querySelector('[name="listing"]:checked') || {}).value || "both", listIn = f.querySelector('[name="listing_words"]'), listWords = listIn ? listIn.value.trim() : "";
        if (listing === "own" && !listWords) { say("Please write how you would like your gift to be listed.", true); listIn.focus(); return; }
        const taPage = location.pathname.startsWith("/ta/");
        const fd = new FormData(f), body = { lang: taPage ? "ta" : "en" };
        for (const [k, v] of fd.entries()) if (k !== "pick" && k !== "own" && k !== "tribute_mode" && k !== "wish") body[k] = v;
        body.amount = (pick === "other" ? ownIn.value.trim() : pick === "unsure" ? "Not sure yet" : chip.dataset.label || chip.value) + (f.dataset.kind === "member" && pick !== "unsure" ? " a month" : "");
        body.message = String(fd.get("wish") || "").trim();
        if (f.dataset.also) body.message = ("Also for: " + f.dataset.also + (body.message ? "\n" + body.message : "")).slice(0, 500);
        body.listing = listing; if (listing === "own") body.listing_words = listWords; else delete body.listing_words;
        const trSel = f.querySelector('[name="tribute_kind"]');
        if (mode === "none") { delete body.remind; delete body.remind_day; ["tribute_kind", "tribute_name", "tribute_note", "tribute_show"].forEach(k => delete body[k]); }
        else {
          body.tribute_on = "yes";
          if (mode === "behalf") { body.tribute_kind = "behalf"; body.tribute_words = "Given on behalf of"; }
          else if (trSel && trSel.selectedOptions[0]) body.tribute_words = (TA_PATH && TR_EN[trSel.value]) || trSel.selectedOptions[0].textContent.trim();
        }
        pay.disabled = true; say("Sending…");
        const copy = new URLSearchParams({ "form-name": "give-request", name: body.name, contact, amount: body.amount, kind: body.kind || "", project: body.project || "", moment: body.moment || "",
          tribute: mode === "none" ? "" : [body.tribute_words, body.tribute_name, body.tribute_note ? "(" + body.tribute_note + ")" : ""].filter(Boolean).join(" "), message: body.message, lang: body.lang, "bot-field": body["bot-field"] || "",
          listing: listing === "own" ? "In their own words: " + listWords : { both: "Name and amount", name: "Name only", anonymous: "Anonymous" }[listing] || "" });
        try {
          const [r, n] = await Promise.all([
            fetch("/api/pledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null),
            fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: copy.toString() }).catch(() => null)]);
          const out = r ? await r.json().catch(() => ({})) : {};
          if (r && r.status === 400 && out.error) { say(out.error, true); pay.disabled = false; return; }
          if (!(r && r.ok && out.ok) && !(n && n.ok)) throw new Error("not saved");
          const slug = body.project || "", box = document.createElement("div");
          box.className = "give-done"; box.tabIndex = -1; box.setAttribute("role", "status");
          box.innerHTML = `<p class="give-done-heart" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg></p>
            <h3><span>Thank you,</span> <b>${esc(body.name)}</b></h3>
            <p>A Raavanaa volunteer will write to you personally and tell you how to send your gift.</p>
            <p class="give-done-at"><span>We will reply to:</span> <b>${esc(contact)}</b></p>
            <p class="give-done-at"><span>Your gift will be listed as:</span> <b>${listing === "own" ? esc(listWords) : listing === "anonymous" ? "Anonymous" : esc(body.name)}</b>${listing === "both" ? ` <span>with the amount</span>` : listing === "name" ? ` <span>without the amount</span>` : ""}</p>
            ${SAFE}
            <p class="give-done-next">${slug ? `<a class="btn ghost" href="/projects/${esc(slug)}">Back to the project</a>` : `<a class="btn ghost" href="/overview">See the projects</a>`}</p>`;
          f.replaceWith(box); box.focus({ preventScroll: true }); box.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch (_) { say("We couldn't send that. Please check your connection and try again.", true); pay.disabled = false; }
      };
      f.addEventListener("submit", async e => {
        e.preventDefault();
        if (ASK) { ask(); return; }
        const a = amount();
        const say = (t, bad) => { msg.hidden = false; msg.textContent = t; msg.classList.toggle("bad", !!bad); };
        if (!(a >= MIN)) { say(`The smallest gift by card is ${dollars(MIN)}.`, true); (ownIn.offsetParent ? ownIn : pay).focus(); return; }
        const em = f.querySelector('[name="email"]'), ph = f.querySelector('[name="phone"]');
        if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { say("Please add your email address for the receipt.", true); em.focus(); return; }
        if (ph && ph.value.replace(/\D/g, "").length < 7) { say("Please add your phone number.", true); ph.focus(); return; }
        const mode = (f.querySelector('[name="tribute_mode"]:checked') || {}).value || "none", trName = f.querySelector('[name="tribute_name"]');
        if (mode !== "none" && !trName.value.trim()) { say(mode === "behalf" ? "Please add the name of the family or group." : "Please add the name of the person this gift is for.", true); trName.focus(); return; }
        const remOn = f.querySelector('[name="remind"]'), remDay = f.querySelector('[name="remind_day"]');
        if (mode !== "none" && remOn && remOn.checked && !remDay.value) { say("Please choose the day you would like to be reminded of.", true); remDay.focus(); return; }
        const taPage = location.pathname.startsWith("/ta/");
        const fd = new FormData(f), body = { amount: a, lang: taPage ? "ta" : "en" };
        for (const [k, v] of fd.entries()) if (k !== "pick" && k !== "own" && k !== "tribute_mode") body[k] = v;
        const trSel = f.querySelector('[name="tribute_kind"]');
        if (mode === "none") { delete body.remind; delete body.remind_day; }
        else {
          body.tribute_on = "yes";
          if (mode === "behalf") { body.tribute_kind = "behalf"; body.tribute_words = taPage ? "சார்பில் வழங்கப்பட்டது:" : "Given on behalf of"; }
          else if (trSel && trSel.selectedOptions[0]) body.tribute_words = trSel.selectedOptions[0].textContent.trim();
        }
        pay.disabled = true; say("Opening the secure payment page…");
        try {
          const r = await fetch("/api/give/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          const out = await r.json().catch(() => ({}));
          if (r.ok && out.url) { location.href = out.url; return; }
          // PayHere: the browser posts the signed form straight to PayHere's secure checkout page.
          if (r.ok && out.form && out.form.action) {
            const go = document.createElement("form");
            go.method = "POST"; go.action = out.form.action; go.hidden = true;
            for (const [k, v] of Object.entries(out.form.fields || {})) { const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = v; go.appendChild(i); }
            document.body.appendChild(go); go.submit(); return;
          }
          say(out.error || "We couldn't start the payment. Please try again.", true);
        } catch (_) { say("We couldn't reach the payment service. Please check your connection and try again.", true); }
        pay.disabled = false;
      });
    });
  }

  // The giver's own project room (SURESH, 17 Nov 2026): "They should feel connected with the project."
  //   /room?p=<slug>&r=<ref>&n=<first name>&a=<amount>&t=<in someone's name>&f=1 (follow)&c=email|wa
  // Opens after "Reserve my part". Welcome by name, a proud line for the kind of project, the project at a glance with
  // their part on the bar, share it, follow it, what happens next (a volunteer works with them), then the project's tabs.
  // The words change with the kind of project: a moment in someone's name, a children's day out, school funding.
  const ROOM_KINDS = {
    moment: { tag: "Creating a moment", proud: ["Creating a moment is something to be proud of.", "A name remembered, a day lived.", "Some gifts become memories that never fade."],
      sub: (p, t) => `${t ? `${esc(t)}. ` : ""}On the day, these children will live a memory that carries this name with it.` },
    dayout: { tag: "A children's day out", proud: ["Be proud. You are making these kids' memories.", "Make these children's memory live.", "A day they will remember all their lives."],
      sub: p => `${p.reach ? esc(String(p.reach).replace(/ and \d+ (teachers?|adults?)/i, "")).replace(/^./, c => c.toUpperCase()) : "These children"} will remember this day for the rest of their lives, and you are part of it.` },
    school: { tag: "School funding", proud: ["Be proud. You are keeping a child in school.", "Every term you help with is a door kept open.", "Learning today, a different life tomorrow."],
      sub: p => `${p.reach ? esc(p.reach) : "These children"} keep learning because of people like you.` },
    other: { tag: "Creating smiles", proud: ["Be proud. You are creating a moment.", "Small acts, lasting smiles.", "Together we make it happen."],
      sub: () => FEAT.reserve ? "Every part reserved brings the day closer." : "Every part brings the day closer." },
  };
  const roomKind = (p, t) => {
    const words = `${p.theme || ""} ${p.title || ""} ${p.summary || ""}`.toLowerCase();
    if (t) return "moment";
    if (/school fee|school fund|books|uniform|tuition|scholar/.test(words)) return "school";
    if (/trip|day out|beach|outing|excursion|events/.test(words)) return "dayout";
    return "other";
  };
  const SAFE_NOTE = `<p class="note give-safe room-safe"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3l7 2.6v5.6c0 4.3-2.9 7.6-7 9.3-4.1-1.7-7-5-7-9.3V5.6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12l2.2 2.2L15.2 10" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Raavanaa will only ever share bank details in a personal reply from our official email. Never pay into an account sent to you any other way.</span></p>`;
  // The giver's WhatsApp message from the room (SURESH, 23 Nov 2026: "make this template a neat design").
  // Same layout for every project: a warm first line, the title in bold, the one-line story in italics,
  // short facts each on its own line, then the link alone on the last line so WhatsApp shows the preview card.
  // WhatsApp marks: *bold*, _italic_. Lines left out when a project has no such fact.
  function roomShareText(p, o) {
    const plain = t => String(t || "").replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim();
    const line = plain(p.tagline) || (plain(p.summary).match(/^.+?[.!?](\s|$)/) || [""])[0].trim();
    const dt = o.day ? new Date(o.day + "T12:00:00") : null;
    const when = dt && !isNaN(dt) ? dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "";
    const who = !plain(p.reach) ? "" : /^[\d\s,.+–-]*(to|and)?[\d\s,.+–-]*$/i.test(plain(p.reach)) ? `${plain(p.reach)} children` : plain(p.reach);
    const facts = [
      p.location && `\u{1F4CD} ${plain(p.location)}`,
      when && `\u{1F4C5} ${when}`,
      who && `\u{1F465} ${who}`,
      o.left > 0 && `\u{1F3AF} ${o.pct > 0 ? `${o.pct}% there · ` : ""}${o.money(o.left)} still to go`,
    ].filter(Boolean);
    return [
      o.tr ? `\u{1F49B} _${plain(o.tr)}_` : null,
      `${o.tr ? "" : "\u{1F49B} "}I'm part of this with Raavanaa`,
      "",
      `*${plain(p.title)}*`,
      line ? `_${line}_` : null,
      facts.length ? "" : null,
      ...facts,
      "",
      `You can be part of it too \u{1F447}`,
    ].filter(x => x !== null && x !== undefined && x !== false).join("\n");
  }
  function renderRoom(app, site, projects) {
    const q = new URLSearchParams(location.search), p = projects.find(x => slugOf(x) === slugify(q.get("p") || ""));
    if (!p) { location.replace("/overview"); return; }
    const first = (q.get("n") || "").slice(0, 40), amt = Math.max(0, parseFloat(q.get("a")) || 0), tr = (q.get("t") || "").slice(0, 90), ref = /^G-\d+$/.test(q.get("r") || "") ? q.get("r") : "";
    const kind = roomKind(p, tr), K = ROOM_KINDS[kind], b = budgetOf(p), money = n => moneyOf(site, n, p), slug = slugOf(p);
    const mineIn = b.funders.some(f => f.pledged && (!ref || f.ref === ref)) ? amt : 0;   // already counted in the bar?
    const before = Math.max(0, b.raised - mineIn), pctBefore = b.goal ? Math.min(100, Math.round(before / b.goal * 100)) : 0;
    const pctNow = b.goal ? Math.min(100, Math.round((before + amt) / b.goal * 100)) : 0;
    const day = p.money && p.money.day ? fmtDate(p.money.day) : "";
    const url = withPct(`${location.origin}/projects/${slug}?from=room`, slug);
    const shareText = roomShareText(p, { tr, day: p.money && p.money.day, left: b.goal ? Math.max(0, b.goal - before - amt) : 0, pct: pctNow, money: n => moneyOf(site, n, p).replace(/&amp;/g, "&") });
    document.title = `Your room: ${p.title} · ${site.name}`;
    const drawing = /\.svg(\?|$)/i.test(p.cover || "") ? p.cover : "/img/project-hills.svg";
    const exp = (p.expectations || []).filter(x => x && x.text);
    const tabs = [
      ["story", "Story", `<div class="room-story">${p.quote ? `<p class="pull">“${esc(p.quote)}”</p>` : ""}${md(String(p.story || p.summary || "").replace(/^##\s*Summary\s*\n+/i, ""))}</div>`],
      ["day", "The day", `<dl class="room-glance">${[["Where", p.location], ["When", day], ["Who", p.reach]].filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        ${exp.length ? `<h3 class="money-h">What the day should achieve</h3><ul class="room-list">${exp.map(x => `<li>${esc(x.text)}</li>`).join("")}</ul>` : ""}
        ${(p.updates || []).length ? `<h3 class="money-h">Latest news</h3>${p.updates.slice(0, 3).map(u => `<p class="room-upd"><b>${esc(u.title)}</b> <small>${fmtDate(u.date)}</small><br>${esc(u.body)}</p>`).join("")}` : ""}`],
      ["budget", "Budget", budgetDetailHTML(p, site, true)],
    ];
    app.innerHTML = `<section class="room room-k-${kind}">
      <header class="room-hero">
        <p class="room-tag">${esc(K.tag)} · Your project room</p>
        <h1>Welcome${first ? `, <span>${esc(first)}</span>` : ""}</h1>
        <p class="room-proud in">${esc(K.proud[0])}</p>
        <p class="room-sub">${K.sub(p, tr)}</p>
      </header>
      <article class="room-card">
        <a class="room-pic" href="/projects/${esc(slug)}"><img src="${esc(drawing)}" alt=""></a>
        <div class="room-card-text">
          <h2><a href="/projects/${esc(slug)}">${esc(p.title)}</a></h2>
          ${p.tagline ? `<p class="room-tagline">${esc(p.tagline)}</p>` : ""}
          ${amt ? `<p class="room-mine">${FEAT.reserve ? `<span class="f-pledged">reserved</span> ` : ""}Your part: <b>${q.get("g") ? esc(q.get("g").slice(0, 30)) : money(amt)}</b>${q.get("g") ? ` <span class="room-about">about ${money(amt)}</span>` : ""}${tr ? ` <small>${esc(tr)}</small>` : ""}</p>` : ""}
          ${b.goal ? `<div class="room-bar" role="img" aria-label="${pctNow}% covered"><i style="width:${pctBefore}%"></i><i class="mine" style="width:${Math.max(0, pctNow - pctBefore)}%"></i></div>
          <p class="room-pct"><b>${pctNow}%</b> covered · ${money(Math.max(0, b.goal - before - amt))} still to go</p>` : ""}
        </div>
      </article>
      <div class="room-acts">
        <section class="room-act share"><h3>Share it with someone</h3><p>One share can bring the next person in.</p>
          <p class="room-btns"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(shareText + "\n" + url)}">WhatsApp</a>
          <a class="btn ghost" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}">Facebook</a>
          <button class="btn ghost" type="button" data-copy>Copy link</button></p></section>
        ${(() => { // Following needs no sign-in (SURESH 18 Nov: it asked him to log in again). The tick on the form already saved it.
          let signedIn = false; try { signedIn = !!localStorage.getItem("gotrue.user"); } catch (e) { /* storage blocked */ }
          const how = q.get("c") === "wa" ? "on WhatsApp" : "by email", same = q.get("c") === "wa" ? "the same details" : "the same email";
          return q.get("f")
            ? `<section class="room-act follow"><h3><span class="room-tick" aria-hidden="true">✓</span> You're following it</h3><p>Nothing more to do. We will keep you updated ${how} as the project moves.${signedIn ? " It is also in My account." : ""}</p>
              <p class="room-btns">${signedIn ? `<a class="btn ghost" href="/members">Open My account</a>` : `<a class="btn ghost" href="/members">Optional: make a free account</a>`}</p>${signedIn ? "" : `<p class="room-small">An account with ${same} keeps all your projects in one place. You can skip it.</p>`}</section>`
            : `<section class="room-act follow"><h3>Follow the project</h3><p>The volunteer who writes to you will keep you updated ${how}.${signedIn ? " It is also in My account." : ""}</p>
              <p class="room-btns"><a class="btn ghost" href="/members">${signedIn ? "Open My account" : "Optional: make a free account"}</a></p></section>`;
        })()}
        <section class="room-act helper"><h3>A volunteer is with you</h3><p>A Raavanaa volunteer will follow up with the ways to fund ${q.get("c") === "wa" ? "on WhatsApp" : "by email"}, and keep you updated as the project moves.${ref ? ` Your reference: <b>${esc(ref)}</b>.` : ""}</p></section>
      </div>
      <h2 class="room-h">What happens next</h2>
      <ol class="room-steps">
        <li class="done"><b>${FEAT.reserve ? "Your part is reserved" : "Your name is on the project"}</b><span>${FEAT.reserve ? "Your name shows on the project, held for 24 hours" : "It shows on the project page now, with your part"}</span></li>
        <li><b>Ways to fund</b><span>A volunteer writes to you personally</span></li>
        <li><b>Gift received</b><span>Marked on the project, open for all to see</span></li>
        <li><b>The day${day ? `: ${day}` : ""}</b><span>The children live it</span></li>
        <li><b>Photos and the story</b><span>And where every rupee went</span></li>
      </ol>
      <div class="room-tabs" role="tablist">${tabs.map(([k, l], i) => `<button type="button" role="tab" data-rt="${k}" aria-selected="${i === 0}">${l}</button>`).join("")}</div>
      ${tabs.map(([k, , h], i) => `<section class="panel room-pane" data-rp="${k}"${i ? " hidden" : ""}>${h}</section>`).join("")}
      ${SAFE_NOTE}
      <p class="room-foot"><a class="btn ghost" href="/projects/${esc(slug)}">Open the full project page</a></p>
    </section>`;
    app.querySelectorAll("[data-rt]").forEach(t => t.addEventListener("click", () => {
      app.querySelectorAll("[data-rt]").forEach(x => x.setAttribute("aria-selected", String(x === t)));
      app.querySelectorAll("[data-rp]").forEach(x => { x.hidden = x.dataset.rp !== t.dataset.rt; });
    }));
    const cp = app.querySelector("[data-copy]");
    cp.addEventListener("click", async () => { try { await navigator.clipboard.writeText(url); cp.textContent = "Link copied"; } catch (e) { cp.textContent = url; } });
    // The proud line turns slowly through the words for this kind of project.
    const line = app.querySelector(".room-proud");
    if (K.proud.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let i = 0; setInterval(() => { i = (i + 1) % K.proud.length; line.classList.remove("in"); void line.offsetWidth; line.textContent = K.proud[i]; line.classList.add("in"); }, 4200);
    }
  }

  // After paying (PayHere or Stripe): thank the giver and say where their gift went.
  async function renderThanks(app, site) {
    document.title = `Thank you · ${site.name}`;
    const q = new URLSearchParams(location.search), id = q.get("session_id") || "", order = q.get("order") || q.get("order_id") || "";
    const s = /^RV[A-Z0-9]+$/.test(order) ? await load("/api/give/session?order=" + encodeURIComponent(order)).catch(() => null)
      : /^cs_/.test(id) ? await load("/api/give/session?id=" + encodeURIComponent(id)).catch(() => null) : null;
    const by = s && s.provider === "payhere" ? "PayHere" : GIVE_BY;
    const dollars = n => cash(Number(n), (s && s.currency) || GIVE_CUR);
    const TAp = location.pathname.startsWith("/ta/");
    let h = "Thank you", t = `Your gift is on its way. ${by} will email you a receipt.`, link = FEAT.sponsor ? `<a class="btn" href="/give">Back to Sponsor a smile</a>` : (FEAT.moment ? `<a class="btn" href="/moment">Back to Gift a Moment</a>` : `<a class="btn" href="/projects">See the projects</a>`);
    if (s && s.ok) {
      if (s.kind === "project" && s.project) { h = "Thank you for sponsoring a smile"; t = TAp ? `உங்கள் ${dollars(s.amount)} “${esc(s.project.title)}” நடக்க உதவுகிறது. ${s.status === "pending" ? "உங்கள் வங்கி உறுதிப்படுத்தியதும், " : ""}ஒரு நிமிடத்துக்குள் இது திட்டப் பக்கத்தில் காட்டப்படும்; அந்த நாளுக்குப் பின் படங்களையும் பணம் எங்கே சென்றது என்பதையும் பார்ப்பீர்கள்.`
        : `Your ${dollars(s.amount)} is helping make “${esc(s.project.title)}” happen. It will show on the project page within a minute${s.status === "pending" ? " once your bank confirms it" : ""}, and after the day you'll see the photos and where the money went.`; link = `<a class="btn" href="/projects/${esc(s.project.slug)}">See the project</a>`; }
      else if (s.kind === "member") { h = "Welcome, Smile member"; t = `Your ${dollars(s.amount)} a month keeps the bridge open for the next person who needs a hand. ${by} will email you a receipt each month.`; }
      else { h = "Thank you for your gift"; t = `Your ${dollars(s.amount)} goes where it's needed most. ${by} will email you a receipt.`; }
    }
    const TA = TAp;
    const TR = TA ? { memory: "அன்பு நினைவாக", birthday: "பிறந்தநாள் கொண்டாட்டமாக", anniversary: "நினைவு நாள் கொண்டாட்டமாக", honour: "கௌரவிக்கும் வகையில்" }
      : { memory: "in loving memory of", birthday: "to celebrate the birthday of", anniversary: "to celebrate the anniversary of", honour: "in honour of" };
    const tr = s && s.ok && s.tribute && s.tribute.name ? s.tribute : null;
    if (tr && !TR[tr.kind]) TR[tr.kind] = "";
    const shareUrl = `${location.origin}${TA ? "/ta" : ""}${s && s.project ? `/projects/${s.project.slug}` : "/give"}`;
    const shareText = TA
      ? (tr ? `${tr.words ? tr.words + " " + tr.name : tr.name + " " + TR[tr.kind]}. இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை உருவாக்கினேன். நீங்களும் ஒரு தருணத்தை உருவாக்கலாம்: ${shareUrl}` : `இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை உருவாக்க உதவினேன். நீங்களும் ஒரு தருணத்தை உருவாக்கலாம்: ${shareUrl}`)
      : (tr ? `${tr.words ? tr.words + " " + tr.name + ": I" : "I"} made a day of joy happen for children in Sri Lanka${tr.words ? "" : " " + TR[tr.kind] + " " + tr.name}. You can make a moment too: ${shareUrl}` : `I just helped make a day of joy happen for children in Sri Lanka. You can make a moment too: ${shareUrl}`);
    const trLine = !tr ? "" : tr.words ? `${esc(tr.words)} <b>${esc(tr.name)}</b>` : TA ? `<b>${esc(tr.name)}</b> ${esc(TR[tr.kind])} உருவான தருணம்.` : `A moment made ${esc(TR[tr.kind])} <b>${esc(tr.name)}</b>.`;
    app.innerHTML = `<section class="give-thanks panel">
      <p class="give-heart" aria-hidden="true">♥</p>
      <h1>${h}</h1><p>${t}</p>
      ${trLine ? `<p class="give-tribute-line">${trLine}</p>` : ""}
      ${s && s.remind ? `<p class="note">${TA ? "ஒவ்வோர் ஆண்டும் இந்த நாளுக்கு ஒரு வாரத்துக்கு முன் உங்களுக்கு நினைவூட்டுவோம்." : "We will remind you every year, a week before the day."}</p>` : ""}
      ${s && s.moment ? `<p><a class="btn" href="${TA ? "/ta" : ""}/m/${esc(s.moment)}">${TA ? "குடும்பப் பக்கத்துக்குத் திரும்புங்கள்" : "Back to the family page"}</a></p>` : ""}
      <p class="give-share"><a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(shareText)}">Tell your family on WhatsApp</a>
        <a class="btn ghost" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}">Share on Facebook</a></p>
      ${s && s.test ? `<p class="give-banner test">This was a test payment. No real money was taken.</p>` : ""}
      ${link}</section>`;
  }

  async function main() {
    const app = document.getElementById("app");
    const page = document.body.dataset.page;
    try {
      // All five data calls start together (13 Nov 2026, speed): the gift totals used to wait for the other four.
      // Gifts from the website decide which projects are fully funded (Activated). On a weak phone connection the first
      // try can fail and the project would show as Initiated (SURESH 26 Nov 2026, Kandy), so try once more.
      const giveP = load("/api/give/totals").catch(() => new Promise(r => setTimeout(r, 1200)).then(() => load("/api/give/totals?retry=1")).catch(() => null));
      const followP = load("/api/follow").catch(() => null); // news the team posts + how many follow each project (25 Nov 2026)
      const [site, data, cm, made] = await Promise.all([load("/site.json"), load("/projects.json"), load("/comments.json").catch(() => ({})), load("/api/projects").catch(() => null)]);
      // Projects created from requests in the team portal come from the database; projects.json wins if a slug is in both.
      if (made && made.projects) { const have = new Set((data.projects || []).map(p => p.slug)); data.projects = [...(data.projects || []), ...made.projects.filter(p => p && !have.has(p.slug))]; }
      COMMENTS = (cm && cm.comments) || [];
      frame(site);
      // Asking for a project and vouching for it are switched off for the memory launch (FEAT.vetting): the form pages
      // show a short note instead. The form itself stays in the HTML and comes back when the switch is true.
      if (!FEAT.vetting && (page === "initiate" || page === "create")) { app.innerHTML = soonHTML(); document.title = `Opening soon · ${site.name}`; return; }
      // Only projects that have been visited and verified are public (Decisions log, 10 Oct 2026).
      const projects = (data.projects || []).filter(p => p && p.title && !p.hidden && p.verified);
      // Updates posted in the portal (Followers & updates, 25 Nov 2026) join the project's own updates, newest first.
      const FOL = await followP;
      if (FOL) projects.forEach(p => { const ups = (FOL.updates || {})[slugOf(p)] || []; if (ups.length) p.updates = [...ups, ...(p.updates || [])]; p.followers = (FOL.followers || {})[slugOf(p)] || 0; });
      // Receipts posted from the day (phone link, 26 Nov 2026) join the project's money page as money out.
      if (FOL) projects.forEach(p => { const rc = (FOL.receipts || {})[slugOf(p)] || []; if (rc.length) { p.money = p.money || {}; p.money.spent = [...(p.money.spent || []), ...rc.slice().reverse()]; } });
      // Card gifts (PayHere or Stripe) are added to each project's supporters, so the budget bars and stages stay right.
      const GIVE = await giveP;
      GIVE_ON = !!(GIVE && GIVE.enabled);
      // PayHere (rupees) is the card service chosen for launch, so the forms show rupees even before it is switched on.
      if ((GIVE && GIVE.provider === "payhere") || !GIVE || !GIVE.enabled) { GIVE_BY = "PayHere"; GIVE_CUR = "LKR"; }
      GIVE_RATE = (GIVE && +GIVE.rate) || +site.rate_lkr_per_cad || 0;
      // Sponsors added by hand that the team took off in the portal (SURESH, 22 Nov 2026) no longer count or show.
      if (GIVE && GIVE.removed) projects.forEach(p => { const off = (GIVE.removed[slugOf(p)] || []).slice(); if (!off.length || !p.funders) return;
        p.funders = p.funders.filter(f => { const i = off.findIndex(x => x.name === String(f && f.name || "").trim() && +x.amount === numOf(f.amount)); if (i < 0) return true; off.splice(i, 1); return false; }); });
      if (GIVE && GIVE.projects) projects.forEach(p => { const t = GIVE.projects[slugOf(p)]; if (t && takesCards(p)) p.funders = [...(p.funders || []), ...t.gifts]; });
      // Pledges from the project giving form show straight away (SURESH, 17 Nov 2026), marked "pledged". The one this
      // browser just sent is added at once too, in case the list is a few seconds old.
      const mine = justPledged();
      projects.forEach(p => {
        const list = ((GIVE && GIVE.pledges) || {})[slugOf(p)] || [], refs = new Set(list.map(x => x.ref));
        const add = [...list, ...mine.filter(x => x.slug === slugOf(p) && !refs.has(x.ref))];
        if (add.length) p.funders = [...(p.funders || []), ...add];
      });
      projects.filter(canGive).forEach(p => GIVE_OPEN.add(slugOf(p)));
      // With card payments off, Donate still opens the project's form ("I'd like to give") while the project needs money.
      if (!GIVE_ON) projects.forEach(p => { if (p.verified && stageNum(p) === 1) { const b = budgetOf(p); if (b.goal > 0 && b.raised < b.goal) GIVE_OPEN.add(slugOf(p)); } });
      G_CTX = { site, projects, give: GIVE };
      if (page === "give" || page === "fund") renderGive(app, site, projects, GIVE);
      else if (page === "room") renderRoom(app, site, projects);
      else if (page === "thanks") renderThanks(app, site);
      else if (page === "contact" || page === "volunteer") {
        // Rotating slides at the top of the Contact and Volunteer pages; a different one comes first on each visit.
        const isVol = page === "volunteer";
        // The footer's "Suggest a project" and "Partner with us" links open the Contact page under their own name.
        const TOPICS = {
          suggest: { key: "suggest", label: "Suggest a project", match: /suggest/i, reason: "Suggest a project" },
          partner: { key: "partner", label: "Partner with us", match: /partner/i, reason: "Partner with you" }
        };
        const topic = isVol ? null : TOPICS[new URLSearchParams(location.search).get("topic")];
        const label = isVol ? "Volunteer with us" : topic ? topic.label : "Contact us";
        document.title = `${isVol ? "Volunteer" : topic ? topic.label : "Contact us"} · ${site.name}`;
        const ok = x => x && x.title && x.text;
        let list = ((isVol ? site.volunteer : site.contact) || []).filter(ok);
        // A topic page shows its own set of slides when one has been written (Site settings);
        // otherwise it keeps to the one Contact slide that matches the link that was tapped.
        const mine = topic ? (site[topic.key] || []).filter(ok) : [];
        const own = topic ? list.find(x => topic.match.test(x.title)) : null;
        if (mine.length) list = mine; else if (own) list = [own];
        const box = document.getElementById(isVol ? "vol-slides" : "contact-slides");
        if (list.length && box) {
          const start = Math.floor(Math.random() * list.length);
          box.classList.add("follow-rot"); box.dataset.start = start;
          box.innerHTML = `<span class="eyebrow">${label}</span>${slideBoxHTML(list, start, "h1")}`;
          startFollow(document);
        }
        if (topic) {
          const sel = document.getElementById("c-reason");
          if (sel) [...sel.options].forEach(o => { if (o.text === topic.reason) sel.value = o.value; });
        }
        wireForms(document);
      } else if (page === "project") {
        const parts = location.pathname.replace(/\/+$/, "").split("/");
        // /projects/<slug>/money is the project's money page: money in, money out, receipts.
        const moneyPage = parts.length > 3 && parts[parts.length - 1] === "money";
        if (moneyPage) parts.pop();
        const slug = decodeURIComponent(parts.pop());
        if (moneyPage) renderMoney(app, site, projects, slugify(slug));
        else if (slug === "sample") {
          // A filled-in example of the project page. It is not a real project and is not listed anywhere.
          const sample = await load("/sample-project.json");
          sample.sample = true;
          const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex"; document.head.appendChild(m);
          renderProject(app, site, [sample], "sample");
        } else {
          // Impact page preview (SURESH 26 Nov 2026): /projects/<slug>?impact=preview shows how the page will look once
          // the day has happened, filled with made-up EXAMPLE words from sample-impact.json. Nothing real changes.
          if (/[?&]impact=preview\b/.test(location.search)) {
            const pp = projects.find(x => slugOf(x) === slugify(slug));
            const ex = pp ? ((await load("/sample-impact.json").catch(() => ({})))[slugOf(pp)]) : null;
            if (pp && ex) { pp.impact_page = ex; pp.status = "Completed"; pp.impact_preview = true;
              const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex"; document.head.appendChild(m); }
          }
          renderProject(app, site, projects, slugify(slug));
        }
      } else if (page === "map") {
        renderMap(projects);
      } else if (page === "map2") {
        renderMapV2(projects);
      } else if (page === "report" || page === "feedback") {
        // Report a concern / after-visit feedback: plain forms. Anonymous unless the person chooses otherwise;
        // worrying feedback answers are pointed to a full report.
        const anon = document.querySelector("[data-anon]"), who = document.querySelector("[data-who]");
        if (anon && who) { const sync = () => { who.hidden = anon.checked; }; anon.addEventListener("change", sync); sync(); }
        const q = new URLSearchParams(location.search);
        const ref = document.querySelector("[data-ref]"); if (ref) ref.value = q.get("ref") || "";
        if (q.get("practice")) { // a practice run with the visitor, so the person knows how it works
          const pb = document.querySelector("[data-practice]"), pf = document.querySelector("[data-practice-field]");
          if (pb) pb.hidden = false; if (pf) pf.value = "yes";
        }
        const flag = document.querySelector("[data-flag]");
        if (flag) document.addEventListener("change", () => {
          const v = n => (document.querySelector(`input[name="${n}"]:checked`) || {}).value;
          flag.hidden = !(v("asked") === "yes" || v("safe") === "no" || v("respectful") === "no");
        });
        wireForms(document);
      } else if (page === "initiate") {
        // "Create a Moment" (the Initiate form): live letter count and the pick-several "Project Focus" box.
        document.title = `Create a Moment · ${site.name}`;
        // The banner title rotates through the "create" slogans (Site settings); a first visit starts on the first one.
        const mt = document.querySelector("[data-moment-title]"), SL = ((site.slogans || {})[(mt && mt.dataset.momentTitle) || "create"] || (site.slogans || {}).create || []).filter(x => x && x.key);
        if (mt && SL.length) {
          let i = 0; try { const n = +localStorage.getItem("raav-slogan"); if (n >= 0 && isFinite(n) && localStorage.getItem("raav-slogan") !== null) i = (n + 1) % SL.length; localStorage.setItem("raav-slogan", String(i)); } catch (e) {}
          // Each slogan shows with its own picture in the slideshow behind it.
          const slides = [...document.querySelectorAll("[data-moment-slides] img")];
          // The line under the title takes turns too, three messages (SURESH, 10 Nov 2026); not on the Tamil page.
          const sub = document.querySelector(".moment-sub"), SUBS = document.documentElement.lang === "ta" ? [] : [
            "Know children who deserve a day of joy? Tell us your idea, and together we'll make it happen.",
            "A trip, a meal, a game or a festival: one small idea can light up a child's whole day.",
            "Tell us who the children are and what would make them smile. Our volunteers do the rest with you."];
          const put = k => { const x = SL[k]; mt.innerHTML = `<span class="mt-lead">${esc(x.lead || "")}</span><span class="mt-key">${esc(x.key)}</span>`;
            if (sub && SUBS.length) sub.textContent = SUBS[k % SUBS.length];
            slides.forEach((im, j) => im.classList.toggle("on", slides.length && j === k % slides.length)); };
          put(i);
          if (SL.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(() => {
            if (document.hidden) return;
            mt.classList.add("out"); if (sub) sub.classList.add("rot-out");
            setTimeout(() => { i = (i + 1) % SL.length; put(i); mt.classList.remove("out"); if (sub) sub.classList.remove("rot-out"); }, 450);
          }, 5200);
        }
        // Coming from Spark a Smile (/spark): carry the choices made there (request or submit, one person or a group,
        // the kind of day) into the form, and show them in one line with a way back to change them.
        {
          const sq = new URLSearchParams(location.search), sf = document.querySelector('form[name="opportunity"]');
          const way = ["submit", "request", "need"].includes(sq.get("way")) ? sq.get("way") : "";
          if (sf && way) {
            const by = sq.get("by") === "group" ? "group" : sq.get("by") === "me" ? "me" : "";
            const vals = { way: way === "submit" ? "Submit a project" : way === "need" ? "Submit a need" : "Request a project", by: by === "group" ? "A group" : by === "me" ? "One person" : "",
              group: by === "group" ? (sq.get("group") || "").slice(0, 60) : "", gname: by === "group" ? (sq.get("gname") || "").slice(0, 80) : "" };
            sf.querySelectorAll("[data-spark-f]").forEach(i => { i.value = vals[i.dataset.sparkF] || ""; });
            const kind = sf.querySelector("#o-kind"), k = sq.get("kind");
            if (kind && k && k !== "Something else") kind.value = k.slice(0, 60); // "Something else" left the box looking filled in
            const line = sf.querySelector("[data-spark]");
            if (line) {
              const who = by === "group" ? [vals.gname, vals.group].filter(Boolean).join(", ") || "A group" : by === "me" ? "Just me" : "";
              line.innerHTML = `<b>${esc(vals.way)}</b>${who ? ` · ${esc(who)}` : ""} ${way === "need" ? `<a href="/spark">How it works</a>` : `<a href="/spark?${esc(sq.toString())}">Change</a>`}`;
              line.hidden = false;
            }
            if (way === "submit") {
              const h = sf.querySelector(".initiate-head h2"), hp = sf.querySelector(".initiate-head p");
              if (h) h.textContent = "Tell us about your project";
              if (hp) hp.textContent = "Share your plan below. Our team will call or visit, and help it get funded openly.";
            }
          }
        }
        // Step 1 of 2: only members can send a request (SURESH, 9 Nov 2026). Not signed in: show the sign-in card instead.
        const gate = document.querySelector("[data-gate]"), oform = document.querySelector('form[name="opportunity"]');
        if (gate && oform) {
          oform.hidden = true;
          import("/members.js").then(m => m.getMember()).catch(() => null).then(me => {
            if (!me) { gate.hidden = false; return; }
            oform.hidden = false;
            const c = oform.querySelector("#o-contact"), nm = me.name || (me.userMetadata && me.userMetadata.full_name) || (me.user_metadata && me.user_metadata.full_name) || "";
            if (c && !c.value && nm) c.value = nm;
            // A small line, not a big welcome: the person sees whose account sends the request.
            const who = oform.querySelector("[data-who]");
            if (who) { who.dataset.name = nm || me.email; who.textContent = (document.documentElement.dataset.formLang === "ta" ? "உள்நுழைந்தவர்: " : "Signed in as ") + (nm || me.email); who.hidden = false; }
            // No need to type your email again: the signed-in one is sent with the request (SURESH 23 Nov 2026).
            const em = oform.querySelector("[data-member-email]"), en = oform.querySelector("[data-email-note]");
            if (em && me.email) em.value = me.email;
            if (en && me.email) { en.dataset.email = me.email; en.textContent = (document.documentElement.dataset.formLang === "ta" ? "உங்கள் மின்னஞ்சலுக்கும் பதில் அனுப்புவோம்: " : "We'll also reply to your email: ") + me.email; en.hidden = false; }
          });
        }
        const area = document.getElementById("o-description"), count = document.getElementById("o-count");
        if (area && count) { const upd = () => { count.textContent = area.value.length; }; area.addEventListener("input", upd); upd(); }
        const multi = document.getElementById("o-focus"), shown = document.getElementById("o-focus-value");
        if (multi && shown) {
          const sync = () => {
            const picked = [...multi.querySelectorAll("input:checked")].map(i => i.value);
            shown.textContent = picked.length ? picked.join(", ") : shown.dataset.empty;
            shown.classList.toggle("has", picked.length > 0);
          };
          multi.addEventListener("change", sync); sync();
          document.addEventListener("click", e => { if (multi.open && !multi.contains(e.target)) multi.open = false; });
          multi.addEventListener("keydown", e => { if (e.key === "Escape" && multi.open) { multi.open = false; multi.querySelector("summary").focus(); } });
        }
        // Evidence: take a photo or choose files (up to 3). Photos are made smaller on the phone before sending.
        const ev = document.querySelector("[data-evidence]");
        if (ev) {
          const form = ev.closest("form"), list = ev.querySelector("[data-ev-list]"), say = ev.querySelector("[data-ev-msg]"), skip = ev.querySelector("[data-ev-skip]");
          const items = [], MAX = 4, PART = 4 * 1024 * 1024;
          const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
          const draw = () => {
            list.innerHTML = items.map((it, k) => `<li>${it.preview ? `<img src="${it.preview}" alt="">` : `<span class="ev-ico">${it.type === "application/pdf" ? "PDF" : it.type.startsWith("audio/") ? "VOICE" : "VIDEO"}</span>`}<span class="ev-name">${esc(it.name)}<small>${kb(it.blob.size)}</small></span><button type="button" data-ev-del="${k}" aria-label="Remove">✕</button></li>`).join("");
            list.querySelectorAll("[data-ev-del]").forEach(b => b.onclick = () => { const it = items.splice(+b.dataset.evDel, 1)[0]; if (it && it.preview) URL.revokeObjectURL(it.preview); draw(); keep(); });
            ev.classList.toggle("has", items.length > 0);
          };
          const shrink = file => new Promise(resolve => {
            const img = new Image(), url = URL.createObjectURL(file);
            img.onload = () => {
              const max = 1600, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
              const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
              c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
              c.toBlob(b => resolve(b && b.size < file.size ? b : file), "image/jpeg", 0.82);
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
            img.src = url;
          });
          const videoLength = file => new Promise(resolve => {
            const v = document.createElement("video"), url = URL.createObjectURL(file);
            v.preload = "metadata"; v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration || 0); }; v.onerror = () => { URL.revokeObjectURL(url); resolve(0); }; v.src = url;
          });
          const add = async files => {
            for (const file of files) {
              if (items.length >= MAX) { say.textContent = `Up to ${MAX} files.`; break; }
              const t = (file.type || guess(file.name) || (fromCamera ? "image/jpeg" : "")).toLowerCase();
              if (t.startsWith("image/")) {
                const blob = await shrink(file);
                if (blob.size > 8 * 1048576) { say.textContent = "That photo is too big."; continue; }
                items.push({ blob, name: (file.name || "photo").replace(/\.\w+$/, "") + (blob.type === "image/jpeg" ? ".jpg" : ""), type: blob.type || t, preview: URL.createObjectURL(blob) });
              } else if (t === "application/pdf") {
                if (file.size > 8 * 1048576) { say.textContent = "That document is too big (8 MB at most)."; continue; }
                items.push({ blob: file, name: file.name, type: t });
              } else if (t.startsWith("video/")) {
                const secs = await videoLength(file);
                if (secs > 20 || file.size > 30 * 1048576) { say.textContent = "Videos must be short (about 15 seconds). For longer ones, paste a YouTube or WhatsApp link under Additional Information."; continue; }
                items.push({ blob: file, name: file.name || "video.mp4", type: t });
              } else if (t.startsWith("audio/")) {
                if (file.size > 12 * 1048576) { say.textContent = "That voice note is too long. Please keep it under about 5 minutes."; continue; }
                items.push({ blob: file, name: file.name || "voice-note", type: t.split(";")[0] });
              } else { say.textContent = "Only voice notes, photos, PDF documents and short videos."; }
            }
            if (say.textContent === "Adding...") say.textContent = "";
            if (items.length && skip) skip.checked = false;
            draw(); keep();
          };
          // Some phones close the page while the camera is open, so the form is kept on the phone (and cleared once sent).
          const guess = n => { const x = (String(n || "").match(/\.(\w+)$/) || [])[1]; x && (x = x.toLowerCase()); return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif", pdf: "application/pdf", mp4: "video/mp4", mov: "video/quicktime", "3gp": "video/3gpp", webm: "video/webm", ogg: "audio/ogg", opus: "audio/ogg", oga: "audio/ogg", m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac" }[x] || ""; };
          let fromCamera = false;
          const db = () => new Promise((ok, no) => { try { const r = indexedDB.open("raavanaa-initiate", 1); r.onupgradeneeded = () => r.result.createObjectStore("draft"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } });
          const idb = async (mode, fn) => { try { const d = await db(); return await new Promise(ok => { const tx = d.transaction("draft", mode), st = tx.objectStore("draft"), r = fn(st); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => ok(null); }); } catch (e) { return null; } };
          const fieldsNow = () => { const o = {}; form.querySelectorAll("input[name],select[name],textarea[name]").forEach(el => { if (el.type === "hidden" || el.type === "file" || el.name === "bot-field") return; if (el.type === "checkbox" || el.type === "radio") { if (el.checked) (o[el.name] = o[el.name] || []).push(el.value); } else o[el.name] = el.value; }); return o; };
          let keepT = 0, restoring = true;
          const keep = () => { if (restoring) return; clearTimeout(keepT); keepT = setTimeout(() => idb("readwrite", st => st.put({ at: Date.now(), fields: fieldsNow(), files: items.map(it => ({ blob: it.blob, name: it.name, type: it.type })) }, "d")), 300); };
          const forget = () => { restoring = true; clearTimeout(keepT); idb("readwrite", st => st.delete("d")); try { localStorage.removeItem("raav-cam"); } catch (e) {} };
          form.addEventListener("input", keep); form.addEventListener("change", keep);
          form._done = forget;
          (async () => {
            const d = await idb("readonly", st => st.get("d"));
            let cam = 0; try { cam = +localStorage.getItem("raav-cam") || 0; localStorage.removeItem("raav-cam"); } catch (e) {}
            if (d && Date.now() - d.at < 3 * 3600e3) {
              const f = d.fields || {};
              form.querySelectorAll("input[name],select[name],textarea[name]").forEach(el => {
                if (!(el.name in f) || el.type === "hidden" || el.type === "file") return;
                if (el.type === "checkbox" || el.type === "radio") el.checked = [].concat(f[el.name]).includes(el.value); else el.value = f[el.name];
                el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
              });
              (d.files || []).forEach(x => x && x.blob && items.push({ ...x, preview: /^image\//.test(x.type) ? URL.createObjectURL(x.blob) : "" }));
              draw();
              const more = form.querySelector("[data-more]"); if (more && (items.length || [...more.querySelectorAll("input:not([type=file]),select,textarea")].some(el => (el.type === "checkbox" ? el.checked : el.value)))) more.open = true;
            }
            if (cam && Date.now() - cam < 15 * 60e3) { const more = form.querySelector("[data-more]"); if (more) more.open = true; }
            if (cam && Date.now() - cam < 15 * 60e3) say.textContent = "Your phone closed this page while the camera was open, so the photo was lost. What you typed is kept. Please take the photo with your camera app first, then tap \"Attach a file\" and pick it from your gallery.";
            restoring = false;
          })();
          const camIn = ev.querySelector("[data-ev-camera]") || ev.querySelector("[data-ev-pick]");
          // "Record your voice": a voice note in English or Tamil (up to 3 minutes). The team turns it into text.
          const rec = ev.querySelector("[data-ev-rec]");
          if (rec) {
            const label = rec.querySelector("[data-rec-label]"), LIMIT = 180;
            let mr = null, chunks = [], tick = 0, started = 0;
            const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
            const stop = () => { if (mr && mr.state !== "inactive") mr.stop(); };
            rec.addEventListener("click", async () => {
              if (mr && mr.state === "recording") return stop();
              if (items.length >= MAX) { say.textContent = `Up to ${MAX} files.`; return; }
              if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)) { say.textContent = "This phone can't record here. Record a WhatsApp voice note instead, then tap \"Attach a file\" and pick it."; return; }
              let stream;
              try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
              catch (e) { say.textContent = "The microphone was not allowed. Allow it in your browser and try again."; return; }
              const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
              mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined); chunks = [];
              mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
              mr.onstop = () => {
                clearInterval(tick); stream.getTracks().forEach(t => t.stop());
                rec.classList.remove("on"); rec.setAttribute("aria-pressed", "false"); label.textContent = "Record your voice";
                const t = (mr.mimeType || type || "audio/webm").split(";")[0], ext = t === "audio/mp4" ? "m4a" : t === "audio/ogg" ? "ogg" : "webm";
                const secs = Math.round((Date.now() - started) / 1000);
                if (chunks.length && secs >= 1) { say.textContent = "Adding..."; add([new File(chunks, `voice-note-${mmss(secs).replace(":", "m")}s.${ext}`, { type: t })]); }
                mr = null;
              };
              mr.start(1000); started = Date.now();
              rec.classList.add("on"); rec.setAttribute("aria-pressed", "true"); say.textContent = "";
              const upd = () => { const n = Math.round((Date.now() - started) / 1000); label.textContent = `Stop recording ${mmss(n)}`; if (n >= LIMIT) stop(); };
              upd(); tick = setInterval(upd, 500);
            });
          }
          // "Take a photo" opens the camera inside this page, so the phone never closes the form.
          // Phones without that (or old browsers) fall back to the phone's own camera.
          const live = ev.querySelector("[data-ev-live]");
          if (live) live.addEventListener("click", async () => {
            if (items.length >= MAX) { say.textContent = `Up to ${MAX} files.`; return; }
            if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { camIn.click(); return; }
            let stream;
            try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); }
            catch (e) {
              if (e && e.name === "NotAllowedError") say.textContent = "The camera was not allowed. Allow it in your browser, or tap \"Attach a file\" and pick a photo from your gallery.";
              else camIn.click();
              return;
            }
            const box = document.createElement("div");
            box.className = "ev-cam"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Take a photo");
            box.innerHTML = `<video playsinline autoplay muted></video><p class="ev-cam-tip">Please don't show children's faces.</p><div class="ev-cam-bar"><button type="button" class="ev-cam-x" data-x>Cancel</button><button type="button" class="ev-cam-shot" data-shot aria-label="Take the photo"></button><span></span></div>`;
            document.body.appendChild(box); document.documentElement.classList.add("ev-cam-on");
            const v = box.querySelector("video"); v.srcObject = stream;
            const close = () => { stream.getTracks().forEach(t => t.stop()); box.remove(); document.documentElement.classList.remove("ev-cam-on"); live.focus(); };
            box.querySelector("[data-x]").onclick = close;
            box.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
            box.querySelector("[data-shot]").onclick = () => {
              const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
              if (!c.width) return; // camera not ready yet
              c.getContext("2d").drawImage(v, 0, 0);
              c.toBlob(b => { close(); if (b) { say.textContent = "Adding..."; add([new File([b], "photo-" + Date.now() + ".jpg", { type: "image/jpeg" })]); } }, "image/jpeg", 0.9);
            };
            box.querySelector("[data-shot]").focus();
          });
          camIn.addEventListener("click", () => { try { localStorage.setItem("raav-cam", String(Date.now())); } catch (e) {} keep(); });
          window.addEventListener("focus", () => setTimeout(() => { try { localStorage.removeItem("raav-cam"); } catch (e) {} }, 4000));
          ev.querySelectorAll("input[type=file]").forEach(inp => inp.addEventListener("change", () => { try { localStorage.removeItem("raav-cam"); } catch (e) {} fromCamera = inp === camIn; const fl = [...inp.files]; inp.value = ""; if (fl.length) { say.textContent = "Adding..."; add(fl); } }));
          if (skip) skip.addEventListener("change", () => { if (skip.checked) say.textContent = ""; });
          form._evCount = () => items.length;
          form._check = () => true; // a photo or document is optional (inside "Add more details")
          form._after = async (res, msg) => {
            if (!items.length || !res.upload) return;
            let failed = 0;
            for (let i = 0; i < items.length; i++) {
              const it = items[i], parts = Math.max(1, Math.ceil(it.blob.size / PART)), id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + i).replace(/[^0-9a-z-]/gi, "");
              try {
                for (let p = 0; p < parts; p++) {
                  msg.textContent = `Uploading ${i + 1} of ${items.length}${parts > 1 ? ` (${Math.round((p / parts) * 100)}%)` : ""}...`;
                  const r = await fetch("/api/suggest/evidence", { method: "POST", body: it.blob.slice(p * PART, (p + 1) * PART),
                    headers: { "x-upload": res.upload, "x-file": id, "x-part": String(p), "x-parts": String(parts), "x-name": it.name, "x-type": it.type, "x-size": String(it.blob.size) } });
                  if (!r.ok) throw new Error(String(r.status));
                }
              } catch (e) { failed++; }
            }
            if (failed) f_warn(msg, failed);
          };
          const f_warn = (msg, n) => { msg.dataset.warn = `Your suggestion was sent, but ${n} file${n > 1 ? "s" : ""} could not be uploaded. Our team will ask you for ${n > 1 ? "them" : "it"} at the visit.`; };
        }
        // "How?" next to "Tell us a little more": write, record or attach.
        const info = document.querySelector("[data-info]"), tip = document.getElementById("o-desc-tip");
        if (info && tip) info.addEventListener("click", () => { tip.hidden = !tip.hidden; info.setAttribute("aria-expanded", String(!tip.hidden)); });
        // Where and village: typed, or picked in the window of choices (initiate-pick.js, 23 Nov 2026).
        wireForms(document);
      } else if (page === "privacy") {
        document.title = `Privacy & child safety · ${site.name}`;
        renderPrivacy(app, site);
      } else if (page === "post") {
        document.title = `Raavanaa Post · ${site.name}`;
        renderPost(app, await load("/post.json").catch(() => ({ issues: [] })));
      } else if (page === "how") {
        document.title = `How it works · ${site.name}`;
        renderHow(app);
      } else if (page === "about") {
        document.title = `About us · ${site.name}`;
        renderAbout(app, site);
      } else if (page === "stage") {
        const slug = location.pathname.replace(/\/+$/, "").split("/").pop();
        const stage = STAGES[slug] ? slug : "initiated";
        // The example project is only fetched for the Activated page, and only shown there while it has no real projects.
        let example = null;
        if (stage === "activated" && !projects.some(p => stageNum(p) >= 2)) {
          example = await load("/sample-project.json").catch(() => null);
          if (example) example.sample = true;
        }
        renderStage(app, site, projects, stage, example);
      } else if (page === "overview") {
        document.title = "Raavanaa · Creating moments";   // Google showed the old "Coming soon" title (SURESH, 20 Nov 2026)
        if (document.body.dataset.variant === "classic") renderOverviewClassic(app, site, projects);
        else await renderOverview(app, site, projects);
      } else if (page === "welcome") {
        document.title = site.name;
        renderWelcome(app, site);
      } else if (page === "front") {
        document.title = site.name;
        renderFront(app, site, projects);
      } else if (page === "front-2") {
        document.title = site.name;
        await renderLane(app, site, projects, data.projects);
      } else if (page === "members") {
        document.title = `Members · ${site.name}`;
        await (await import("/members.js")).render(app, site);
      } else if (page === "projects") {
        document.title = `Our projects · ${site.name}`;
        await renderProjects(app, site, projects);
      } else if (page === "volunteers") {
        // Our volunteers (/volunteers, 17 Nov 2026): volunteers.js draws the page itself.
        document.title = `Our volunteers · ${site.name}`;
      } else if (page === "spark") {
        // "Spark a Smile" (/spark, 16 Nov 2026): spark.js draws the page itself; nothing goes in #app.
        document.title = `Spark a Smile, start a project · ${site.name}`;
      } else if (page === "create") {
        document.title = `Make a Smile Happen · ${site.name}`;
        renderCreate(app, site, projects);
      } else {
        document.title = site.name;
        renderHome(app, site, projects);
      }
    } catch (e) {
      app.innerHTML = `<p class="empty">The page couldn't load its content. Refresh to try again.</p>`;
      console.error(e);
    }
  }
  main();
})();
