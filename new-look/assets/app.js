/* Raavanaa · Beyond the Lanes — the new look.
   One script for every page: it draws the header and footer, the page banner,
   the Initiate → Activate → Impact circle, and the project cards from /data/projects.json. */
(() => {
  "use strict";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slugify = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
  const slugOf = p => p.slug ? slugify(p.slug) : slugify(p.title);
  const numOf = v => { const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
  const imgUrl = (src, w) => {
    const u = String(src || "");
    const local = /^(localhost|127\.)/.test(location.hostname);
    return !local && u.startsWith("/") && !/\.svg$/i.test(u) ? `/.netlify/images?url=${encodeURIComponent(u)}&w=${w}&q=75` : u;
  };
  const page = document.body.dataset.page;
  // This new look lives in its own folder (/new-look) next to the current site. Page links get the
  // folder name added; pictures (/img) and the project list (/projects.json) come from the current site.
  const BASE = "/new-look";
  const fixLinks = root => root.querySelectorAll('a[href^="/"]').forEach(a => {
    const h = a.getAttribute("href");
    if (!/^\/(new-look|img|\.netlify)(\/|$)/.test(h)) a.setAttribute("href", BASE + h);
  });

  // ---------- Icons (24 × 24, drawn with lines) ----------
  const P = {
    home: '<path fill="currentColor" stroke="none" d="M12 3 2 11.2h2.9V20H10v-5.6h4V20h5.1v-8.8H22z"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    heart: '<path fill="currentColor" stroke="none" d="M12 21s-8.5-5.2-8.5-11.2A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 8.5 2.8C20.5 15.8 12 21 12 21z"/>',
    handHeart: '<path d="M12 11.6s-3.6-2.3-3.6-4.8A2 2 0 0 1 12 5.6a2 2 0 0 1 3.6 1.2c0 2.5-3.6 4.8-3.6 4.8z" fill="currentColor"/><path d="M2.5 14.5h3.2l3.1 2.2h4.4a1.5 1.5 0 0 1 0 3H8.6"/><path d="M13.4 19.7h1.9l5.6-3.7a1.5 1.5 0 0 0-1.6-2.6l-3.9 2.2"/><path d="M2.5 20.8h3.4"/>',
    peopleHeart: '<circle cx="12" cy="5.6" r="2.4"/><circle cx="5" cy="7.6" r="2"/><circle cx="19" cy="7.6" r="2"/><path d="M1.6 16v-1.4a3.6 3.6 0 0 1 5.4-3.1"/><path d="M22.4 16v-1.4a3.6 3.6 0 0 0-5.4-3.1"/><path d="M12 21.4s-5.2-3.1-5.2-6.6A2.7 2.7 0 0 1 12 13.2a2.7 2.7 0 0 1 5.2 1.6c0 3.5-5.2 6.6-5.2 6.6z" fill="currentColor"/>',
    people: '<circle cx="12" cy="7" r="3"/><circle cx="5.2" cy="9" r="2.3"/><circle cx="18.8" cy="9" r="2.3"/><path d="M6.8 20v-1.6a5.2 5.2 0 0 1 10.4 0V20"/><path d="M1.5 19v-1.2a3.8 3.8 0 0 1 4.9-3.6"/><path d="M22.5 19v-1.2a3.8 3.8 0 0 0-4.9-3.6"/>',
    bulb: '<path d="M9.2 17.6h5.6M10.2 20.8h3.6"/><path d="M12 3.2a5.8 5.8 0 0 0-3.4 10.5c.8.6 1.1 1.3 1.1 2.1h4.6c0-.8.3-1.5 1.1-2.1A5.8 5.8 0 0 0 12 3.2z"/>',
    rays: '<path d="M12 .2v1.4M3.4 3.7l1 1M20.6 3.7l-1 1M.4 10.2h1.4M22.2 10.2h1.4"/>',
    sprout: '<path d="M12 21v-8.2"/><path d="M12 13C12 8.4 8.8 5.4 4.2 5.4c0 4.7 3.3 7.6 7.8 7.6z" fill="currentColor" fill-opacity=".25"/><path d="M12 11.2c0-4 2.9-6.8 7.8-6.8 0 4.3-3 6.8-7.8 6.8z" fill="currentColor" fill-opacity=".25"/><path d="M7.5 21h9"/>',
    search: '<circle cx="10.6" cy="10.6" r="6.4"/><path d="m20 20-4.6-4.6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3v4M16 3v4M7.6 13.6h2M11 13.6h2M14.4 13.6h2M7.6 16.8h2M11 16.8h2"/>',
    handshake: '<path d="m2 11.5 3.8-3.8 3.6 1.4 2.4-1.6h3.4l6.8 5.6"/><path d="M5.8 7.7 2 11.5l6.5 6.4 1.6-1 1.8 1.2 1.8-1 1.8 1 4.5-4.3"/><path d="m11.8 7.5-3 3a1.3 1.3 0 0 0 1.8 1.8l2.2-1.6 4.4 3.9"/>',
    coins: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v4c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 10v4c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-4M5 14v4c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.9 3.1 2.9 14.9 0 18M12 3c-2.9 3.1-2.9 14.9 0 18"/>',
    pin: '<path fill="currentColor" stroke="none" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.7 7.4-4.3M8.3 13.3l7.4 4.3"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    star: '<path fill="currentColor" stroke="none" d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/>',
    gamepad: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor"/><circle cx="17.8" cy="13.8" r="1" fill="currentColor"/>',
    bus: '<rect x="4" y="3.5" width="16" height="14" rx="3"/><path d="M4 11h16M8 21v-3.5M16 21v-3.5"/><circle cx="8" cy="14.5" r="1" fill="currentColor"/><circle cx="16" cy="14.5" r="1" fill="currentColor"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7.5c0-1.5 1-2 1-3.5M12 7.5c0-1.5 1-2 1-3.5M16 7.5c0-1.5 1-2 1-3.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    sparkle: '<path fill="currentColor" stroke="none" d="M12 2c.6 4.6 2.8 6.8 7.4 7.4-4.6.6-6.8 2.8-7.4 7.4-.6-4.6-2.8-6.8-7.4-7.4C9.2 8.8 11.4 6.6 12 2z"/>'
  };
  const ico = (k, cls = "") => `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${P[k] || ""}</svg>`;

  // ---------- Stages ----------
  const STAGE = [
    null,
    { key: "initiate", word: "Initiate", label: "Initiated", cls: "s1", icon: "bulb",
      say: ["Bring people together", "and start change"],
      chips: [["search", "Find Needs"], ["calendar", "Plan Initiatives"], ["handshake", "Build Partners"]] },
    { key: "activate", word: "Activate", label: "Activated", cls: "s2", icon: "people",
      say: ["Turn ideas into", "action and engage", "the community"],
      chips: [["handHeart", "Volunteer"], ["people", "Participate"], ["coins", "Fund & Support"]] },
    { key: "impact", word: "Impact", label: "Impact", cls: "s3", icon: "sprout",
      say: ["Create lasting", "opportunities and", "brighter lives"],
      chips: [["heart", "Support Programs"], ["people", "Empower Individuals"], ["globe", "Build Inclusion"]] }
  ];
  const goalOf = p => numOf(p.goal) || (p.budget || []).filter(x => x && x.item).reduce((s, x) => s + numOf(x.amount), 0);
  const raisedOf = p => (p.funders || []).filter(x => x && x.name).reduce((s, x) => s + numOf(x.amount), 0);
  const stageNum = p => {
    if (/complete/i.test(p.status || "")) return 3;
    const goal = goalOf(p);
    return p.verified && goal > 0 && raisedOf(p) >= goal ? 2 : 1;
  };
  const pctOf = p => { const g = goalOf(p); return stageNum(p) > 1 ? 100 : g ? Math.min(100, Math.round(raisedOf(p) / g * 100)) : 0; };
  const fundLabel = p => {
    const n = stageNum(p), g = goalOf(p);
    if (n === 1 && !g) return "Planning the day";
    return `${pctOf(p)}% Funded`;
  };
  const townOf = p => p.city || String(p.location || "").split(",").pop().replace(/district/i, "").trim();
  const placeOf = p => { const t = townOf(p); return t ? `${t}, Sri Lanka` : "Sri Lanka"; };
  const money = (p, n) => `${p.currency || "$"}${Math.round(n).toLocaleString("en-US")}`;

  // ---------- Header & footer ----------
  const NAV = [
    { k: "home", href: "/", label: "Home", icon: "home" },
    { k: "initiatives", label: "Initiatives", menu: [["/initiatives#initiate", "Initiate", "s1"], ["/initiatives#activate", "Activate", "s2"], ["/initiatives#impact", "Impact", "s3"], ["/initiatives", "How it all works", ""]] },
    { k: "projects", href: "/projects", label: "Projects" },
    { k: "impact", href: "/impact", label: "Impact" },
    { k: "involved", label: "Get Involved", menu: [["/sponsor", "Sponsor a Smile", "s2"], ["/request", "Request a Smile", "s3"], ["/get-involved#volunteer", "Volunteer", "s1"], ["/get-involved#partner", "Partner with us", ""]] },
    { k: "about", href: "/about", label: "About" }
  ];
  const ACTIVE = { home: "home", initiatives: "initiatives", projects: "projects", project: "projects", impact: "impact", involved: "involved", sponsor: "involved", request: "involved", about: "about" };
  function header() {
    const on = ACTIVE[page];
    const el = document.getElementById("site-header");
    if (!el) return;
    el.className = "hdr";
    el.innerHTML = `<div class="hdr-in">
        <a class="brand" href="/" aria-label="Raavanaa Beyond the Lanes, home"><picture><source srcset="/img/logo.webp" type="image/webp"><img src="/img/logo.jpg" alt="Raavanaa · Beyond the Lanes · Creating Smiles" width="900" height="298"></picture></a>
        <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">${ico("menu")}</button>
        <nav class="nav" id="nav" aria-label="Main">
          ${NAV.map(n => n.menu
            ? `<div class="dd${on === n.k ? " on" : ""}"><button class="nav-a" type="button" aria-expanded="false">${n.label}${ico("chev", "nav-chev")}</button>
                <div class="dd-menu">${n.menu.map(([h, t, c]) => `<a href="${h}" class="${c}"><i></i>${t}</a>`).join("")}</div></div>`
            : `<a class="nav-a${on === n.k ? " on" : ""}" href="${n.href}"${on === n.k ? ' aria-current="page"' : ""}>${n.icon ? ico(n.icon, "nav-home") : ""}${n.label}</a>`).join("")}
          <a class="donate" href="/sponsor">Donate ${ico("heart")}</a>
        </nav>
      </div>`;
    const burger = el.querySelector(".burger"), nav = el.querySelector(".nav");
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", open); nav.classList.toggle("open", open);
      burger.innerHTML = ico(open ? "close" : "menu");
    });
    el.querySelectorAll(".dd > button").forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      const open = b.getAttribute("aria-expanded") !== "true";
      el.querySelectorAll(".dd > button").forEach(x => x.setAttribute("aria-expanded", "false"));
      b.setAttribute("aria-expanded", open);
    }));
    document.addEventListener("click", () => el.querySelectorAll(".dd > button").forEach(x => x.setAttribute("aria-expanded", "false")));
  }
  function footer() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "ftr";
    el.innerHTML = `<svg class="ftr-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34C240 4 480 4 720 26s480 28 720-6V60H0z"/></svg>
      <div class="ftr-in">
        <div class="ftr-brand">
          <a class="ftr-logo" href="/"><picture><source srcset="/img/logo.webp" type="image/webp"><img src="/img/logo.jpg" alt="Raavanaa · Beyond the Lanes" width="900" height="298" loading="lazy"></picture></a>
          <p>Every penny goes to the day, and every smile is shared.</p>
        </div>
        <div><h3>Explore</h3><a href="/initiatives">Initiatives</a><a href="/projects">Projects</a><a href="/impact">Impact</a><a href="/about">About us</a></div>
        <div><h3>Get involved</h3><a href="/sponsor">Sponsor a Smile</a><a href="/request">Request a Smile</a><a href="/get-involved#volunteer">Volunteer</a><a href="/get-involved#partner">Partner with us</a></div>
        <div><h3>Children come first</h3><p class="ftr-safe">${ico("shield")}<span>First names only. Faces only with a parent's or guardian's permission. We mark the town, never a home or school.</span></p></div>
      </div>
      <div class="ftr-bottom"><span>© ${new Date().getFullYear()} Raavanaa · Beyond the Lanes</span><span>Creating smiles, creating moments</span></div>`;
  }

  // ---------- The circle: Initiate → Activate → Impact ----------
  // full: with the small labels around it (computer). compact: the circle only (phone).
  function cycleSVG(id, compact) {
    const C = [380, 300], R = 165, A = 205;
    const at = (deg, r) => { const a = deg * Math.PI / 180; return [C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)].map(v => +v.toFixed(1)); };
    const centers = [null, at(-90, R), at(30, R), at(150, R)];
    const arc = (a0, a1, cls, mk) => { const [x0, y0] = at(a0, A), [x1, y1] = at(a1, A); return `<path class="cy-arc" d="M${x0} ${y0}A${A} ${A} 0 0 1 ${x1} ${y1}" stroke="url(#${id}-${cls})" marker-end="url(#${id}-m${mk})"/>`; };
    const GRAD = { 1: ["#5bbcff", "#1a7fdc", "#0b4a9a"], 2: ["#ffbf5e", "#f47b20", "#cf4512"], 3: ["#8fdc6e", "#2fa84f", "#106b2c"] };
    const BAND = { 1: "#0b3f86", 2: "#b8400f", 3: "#0e5f27" };
    const TINT = { 1: "#e3f0ff", 2: "#ffeedd", 3: "#e3f5e1" };
    const node = n => {
      const [x, y] = centers[n], s = STAGE[n];
      const lines = s.say.map((t, i) => `<tspan x="0" dy="${i ? 15.5 : 0}">${esc(t)}</tspan>`).join("");
      return `<a href="/initiatives#${s.key}" class="cy-node ${s.cls}" transform="translate(${x} ${y})">
          <circle r="114" fill="url(#${id}-h${n})"/>
          <circle r="100" fill="url(#${id}-g${n})" stroke="#fff" stroke-width="6"/>
          <ellipse cx="-8" cy="-56" rx="60" ry="28" fill="#fff" opacity=".2"/>
          <g transform="translate(-21 ${compact ? -70 : -82}) scale(1.75)" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[s.icon]}${n === 1 ? P.rays : ""}</g>
          <path d="M-88 ${compact ? -12 : -24}h178l-8 ${compact ? 46 : 40}h-178z" fill="${BAND[n]}" opacity=".92"/>
          <text class="cy-word" y="${compact ? 23 : 8}" text-anchor="middle">${s.word.toUpperCase()}</text>
          ${compact ? "" : `<text class="cy-say" y="${n === 1 ? 40 : 36}" text-anchor="middle">${lines}</text>`}
        </a>`;
    };
    const chips = n => {
      if (compact) return "";
      const s = STAGE[n];
      const spots = { 1: [[546, 30], [560, 78], [574, 126]], 2: [[650, 324], [650, 372], [650, 420]], 3: [[-14, 318], [-14, 370], [-14, 422]] }[n];
      const w = n === 3 ? 146 : n === 2 ? 178 : 204, h = n === 3 ? 46 : 42;
      return s.chips.map(([ic, t], i) => {
        const [x, y] = spots[i];
        const words = n === 3 ? t.split(" ") : [t];
        return `<g class="cy-chip" transform="translate(${x} ${y})">
            <rect width="${w}" height="${h}" rx="${h / 2}" fill="${TINT[n]}"/>
            <circle cx="${h / 2}" cy="${h / 2}" r="${h / 2 - 3}" fill="url(#${id}-g${n})"/>
            <g transform="translate(${h / 2 - 8.5} ${h / 2 - 8.5}) scale(.71)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${P[ic].replace(/fill="currentColor"/g, 'fill="#fff"')}</g>
            <text x="${h + 8}" y="${words.length > 1 ? h / 2 - 3 : h / 2 + 5}">${words.map((wd, k) => `<tspan x="${h + 8}" dy="${k ? 16 : 0}">${esc(wd)}</tspan>`).join("")}</text>
          </g>`;
      }).join("");
    };
    const vb = compact ? "118 14 524 510" : "-18 18 848 510";
    const mk = (n, c) => `<marker id="${id}-m${n}" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="30" markerHeight="30" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5 0 10z" fill="${c}"/></marker>`;
    return `<svg class="cycle${compact ? " compact" : ""}" viewBox="${vb}" role="img" aria-label="Initiate, then Activate, then Impact, and round again">
      <defs>
        ${[1, 2, 3].map(n => `<radialGradient id="${id}-g${n}" cx="42%" cy="30%" r="75%"><stop offset="0" stop-color="${GRAD[n][0]}"/><stop offset=".55" stop-color="${GRAD[n][1]}"/><stop offset="1" stop-color="${GRAD[n][2]}"/></radialGradient>
          <radialGradient id="${id}-h${n}"><stop offset=".8" stop-color="${GRAD[n][1]}" stop-opacity=".35"/><stop offset="1" stop-color="${GRAD[n][1]}" stop-opacity="0"/></radialGradient>`).join("")}
        <linearGradient id="${id}-a1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc24a"/><stop offset="1" stop-color="#f05a22"/></linearGradient>
        <linearGradient id="${id}-a2" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#7ccf55"/><stop offset="1" stop-color="#1f8a3a"/></linearGradient>
        <linearGradient id="${id}-a3" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2fa84f"/><stop offset="1" stop-color="#1a7fdc"/></linearGradient>
        <linearGradient id="${id}-hrt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2fa84f"/><stop offset=".5" stop-color="#f9a51f"/><stop offset="1" stop-color="#d9361b"/></linearGradient>
        ${mk(1, "#f05a22")}${mk(2, "#1f8a3a")}${mk(3, "#1a7fdc")}
      </defs>
      ${arc(-55, -11, "a1", 1)}${arc(65, 109, "a2", 2)}${arc(185, 229, "a3", 3)}
      <g transform="translate(${C[0]} ${C[1] + 4})"><g class="cy-heart">
        <path d="M0 40C-31 19-56-2-56-25c0-18 14-30 29-30 13 0 22 8 27 17 5-9 14-17 27-17 15 0 29 12 29 30 0 23-25 44-56 65z" fill="#fff" stroke="url(#${id}-hrt)" stroke-width="9" stroke-linejoin="round"/>
        <circle cx="-20" cy="-17" r="7" fill="#2fa84f"/><path d="M-32 14q12-30 24 0z" fill="#2fa84f"/>
        <circle cx="0" cy="-25" r="8" fill="#f9a51f"/><path d="M-13 13q13-34 26 0z" fill="#f9a51f"/>
        <circle cx="20" cy="-17" r="7" fill="#d9361b"/><path d="M8 14q12-30 24 0z" fill="#d9361b"/>
        <g transform="translate(52 -34) rotate(18)"><path d="M0-24c-5 0-7 6-4 11-7 6-8 19-4 29h16c4-10 3-23-4-29 3-5 1-11-4-11z" fill="#fff" stroke="#c9ccd1" stroke-width="2"/><path d="M-6.4-9h12.8M-7.6-5h15.2" stroke="#d9361b" stroke-width="2.6"/></g>
      </g></g>
      ${node(1)}${node(2)}${node(3)}
      ${chips(1)}${chips(2)}${chips(3)}
    </svg>`;
  }
  const cycleHTML = id => `<div class="cycle-wrap">${cycleSVG(id, false)}${cycleSVG(id + "c", true)}</div>`;

  // ---------- Page banner ----------
  // a: the green words, b: the orange script word with a little heart, sub: one line, img: the picture on the left.
  const heartSwash = `<svg class="st-heart" viewBox="0 0 60 64" aria-hidden="true"><path d="M30 58C10 44 3 31 4 20 5 9 14 4 22 6c5 1 7 5 8 9 1-4 4-8 9-9 9-2 17 5 16 15-1 12-10 22-25 37" fill="none" stroke="url(#st-h)" stroke-width="5.5" stroke-linecap="round"/><defs><linearGradient id="st-h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9a51f"/><stop offset="1" stop-color="#e0451b"/></linearGradient></defs></svg>`;
  const swoosh = `<svg class="st-swoosh" viewBox="0 0 300 30" preserveAspectRatio="none" aria-hidden="true"><path d="M4 20C80 6 190 2 296 12c-90 0-170 6-250 16z" fill="url(#st-s)"/><defs><linearGradient id="st-s"><stop offset="0" stop-color="#f9a51f"/><stop offset="1" stop-color="#d9361b"/></linearGradient></defs></svg>`;
  const titleHTML = (a, b, tag = "h1") => `<${tag} class="script-title">${a ? `<span class="st-a">${esc(a)}</span> ` : ""}<span class="st-b">${heartSwash}<span class="st-word">${esc(b)}</span>${swoosh}</span></${tag}>`;
  const bigButtons = () => `<div class="hero-btns">
      <a class="big-btn orange" href="/sponsor"><span class="bb-ico">${ico("handHeart")}</span><span class="bb-t">Sponsor<br>a Smile</span>${ico("right", "bb-chev")}</a>
      <a class="big-btn green" href="/request"><span class="bb-ico">${ico("peopleHeart")}</span><span class="bb-t">Request<br>a Smile</span>${ico("right", "bb-chev")}</a>
    </div>`;
  function hero({ a, b, sub, img, pos = "50% 60%", side = "", btns = true, extra = "", small = false }) {
    const el = document.getElementById("hero");
    if (!el) return;
    el.className = `hero${small ? " small" : ""}${side ? "" : " solo"}`;
    el.innerHTML = `<div class="hero-photo"><img src="${esc(imgUrl(img, 1400))}" alt="" style="object-position:${pos}" fetchpriority="high"></div>
      <div class="hero-in">
        <div class="hero-copy">
          ${titleHTML(a, b)}
          ${sub ? `<p class="hero-sub">${sub}</p>` : ""}
          ${extra}
          ${btns ? bigButtons() : ""}
        </div>
        ${side ? `<div class="hero-side">${side}</div>` : ""}
      </div>`;
  }

  // ---------- Project cards ----------
  const pill = p => { const n = stageNum(p); return `<span class="pill ${STAGE[n].cls}">${STAGE[n].label}</span>`; };
  const bar = p => `<div class="fund"><div class="fund-bar ${STAGE[stageNum(p)].cls}"><i style="width:${pctOf(p)}%"></i></div><b>${fundLabel(p)}</b></div>`;
  const cardH = p => `<a class="pcard h" href="/projects/${slugOf(p)}">
      <span class="pc-img"><img src="${esc(imgUrl(p.cover, 600))}" alt="" loading="lazy">${pill(p)}</span>
      <span class="pc-body"><span class="pc-title">${esc(p.title)}</span><span class="pc-place">${ico("pin")}${esc(placeOf(p))}</span>${bar(p)}</span>
    </a>`;
  const cardV = p => `<a class="pcard v" href="/projects/${slugOf(p)}">
      <span class="pc-img"><img src="${esc(imgUrl(p.cover, 800))}" alt="" loading="lazy">${pill(p)}</span>
      <span class="pc-body"><span class="pc-title">${esc(p.title)}</span><span class="pc-place">${ico("pin")}${esc(placeOf(p))}</span>
        ${p.summary ? `<span class="pc-sum">${esc(p.summary)}</span>` : ""}${bar(p)}<span class="pc-go">See this smile ${ico("right")}</span></span>
    </a>`;
  const byNeed = list => [...list].sort((x, y) => stageNum(x) - stageNum(y));

  function featured(list, title = "Featured Initiatives") {
    return `<section class="featured">
        <div class="feat-in">
          <div class="feat-head"><h2>${title.replace(" ", " <br>")}</h2><i class="feat-bar"></i>
            <div class="feat-nav"><button type="button" class="fn prev" aria-label="Previous">${ico("left")}</button><button type="button" class="fn next" aria-label="Next">${ico("right")}</button></div></div>
          <div class="feat-track" tabindex="0" aria-label="${esc(title)}">${list.map(cardH).join("")}</div>
        </div>
      </section>`;
  }
  function wireFeatured(root) {
    root.querySelectorAll(".featured").forEach(f => {
      const t = f.querySelector(".feat-track");
      const step = () => { const c = t.querySelector(".pcard"); return c ? c.getBoundingClientRect().width + 20 : 300; };
      f.querySelector(".prev").onclick = () => t.scrollBy({ left: -step(), behavior: "smooth" });
      f.querySelector(".next").onclick = () => t.scrollBy({ left: step(), behavior: "smooth" });
    });
  }

  // ---------- Tiny Markdown for project stories ----------
  const inline = t => esc(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*\s][^*]*)\*/g, "<i>$1</i>").replace(/(^|[\s(])_([^_]+)_/g, "$1<i>$2</i>").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  function md(src) {
    const out = []; let list = null;
    String(src || "").split(/\n/).forEach(line => {
      const l = line.trim();
      if (/^[-*] /.test(l)) { if (!list) { list = []; } list.push(`<li>${inline(l.slice(2))}</li>`); return; }
      if (list) { out.push(`<ul>${list.join("")}</ul>`); list = null; }
      if (!l) return;
      const h = l.match(/^(#{2,3})\s+(.*)/);
      out.push(h ? `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>` : `<p>${inline(l)}</p>`);
    });
    if (list) out.push(`<ul>${list.join("")}</ul>`);
    return out.join("");
  }

  const fmtDate = d => new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const textOf = u => u.body || u.text || "";

  // ---------- Pages ----------
  const SAY_LONG = {
    1: "A teacher, a children's home or one of our members tells us about children waiting for a day of joy. We visit, listen and make sure the need is real.",
    2: "Friends, family and supporters cover the day, and then we plan it: the date, the place, the food and the helpers.",
    3: "The day happens. We come back with the story, the pictures and what was spent, so everyone who gave can see the smiles they created."
  };
  const CHIP_SAY = {
    "Find Needs": "Teachers, homes and members point us to children who are waiting.",
    "Plan Initiatives": "We visit, listen and plan one simple, happy day with a clear budget.",
    "Build Partners": "Local helpers, homes and groups join in to make the day work.",
    "Volunteer": "Help on the day with games, food, driving or photos.",
    "Participate": "Join the day and cheer the children on.",
    "Fund & Support": "Cover the whole day or a part, on your own or with friends.",
    "Support Programs": "Days out, games and good meals that children talk about for years.",
    "Empower Individuals": "Every child is seen, cheered and celebrated.",
    "Build Inclusion": "Every child is welcome, including children with special needs."
  };

  function renderHome(projects) {
    hero({ a: "Sponsor a", b: "Smile", img: "/img/moment-hero.webp", pos: "45% 70%",
      sub: "Create opportunities, build inclusion and make a real difference beyond the lanes.",
      side: cycleHTML("hc") });
    document.getElementById("app").innerHTML = featured(byNeed(projects));
    wireFeatured(document);
  }

  function renderInitiatives(projects) {
    hero({ a: "Our", b: "Initiatives", img: "/img/moment-hero.webp", pos: "50% 40%",
      sub: "Every smile travels the same three steps, so you always know where it stands and where the money goes.",
      side: cycleHTML("ic") });
    const count = n => projects.filter(p => stageNum(p) === n).length;
    document.getElementById("app").innerHTML = `<div class="steps-page">${[1, 2, 3].map(n => {
      const s = STAGE[n];
      return `<section class="stage-row ${s.cls}" id="${s.key}">
          <div class="orb ${s.cls}"><span class="orb-ico">${ico(s.icon)}</span><b>${s.word.toUpperCase()}</b><span>${s.say.join(" ")}</span></div>
          <div class="stage-text">
            <p class="stage-step">Step ${n} of 3</p>
            <h2>${s.word}</h2>
            <p class="lead">${SAY_LONG[n]}</p>
            <ul class="chip-list">${s.chips.map(([ic, t]) => `<li><span class="chip-ico ${s.cls}">${ico(ic)}</span><span><b>${t}</b>${CHIP_SAY[t]}</span></li>`).join("")}</ul>
            <a class="text-link ${s.cls}" href="/projects?stage=${n}">See ${count(n)} ${count(n) === 1 ? "project" : "projects"} in ${s.word} ${ico("right")}</a>
          </div>
        </section>`;
    }).join("")}</div>${featured(byNeed(projects), "Featured Initiatives")}`;
    wireFeatured(document);
  }

  function renderProjects(projects) {
    hero({ a: "Our", b: "Projects", img: "/img/members-bridge.webp", pos: "50% 55%",
      sub: "Real days of joy, each one checked in person. Choose one and help it happen.", small: true });
    const app = document.getElementById("app");
    const q = +(new URLSearchParams(location.search).get("stage") || 0);
    const tabs = [[0, "All", ""], [1, "Initiated", "s1"], [2, "Activated", "s2"], [3, "Impact", "s3"]];
    const draw = k => {
      const list = byNeed(projects.filter(p => !k || stageNum(p) === k));
      app.innerHTML = `<section class="list-sec">
          <div class="filters" role="group" aria-label="Show projects by stage">${tabs.map(([n, t, c]) => `<button type="button" class="filter ${c}" data-k="${n}" aria-pressed="${n === k}">${t}<span>${n ? projects.filter(p => stageNum(p) === n).length : projects.length}</span></button>`).join("")}</div>
          <div class="pgrid">${list.length ? list.map(cardV).join("") : `<p class="empty">No projects here yet. <a href="/request">Request a smile</a></p>`}</div>
        </section>`;
      app.querySelector(".filters").onclick = e => { const b = e.target.closest(".filter"); if (!b) return; const n = +b.dataset.k; history.replaceState(null, "", n ? `?stage=${n}` : location.pathname); draw(n); };
    };
    draw(q);
  }

  function renderProject(projects) {
    const slug = new URLSearchParams(location.search).get("p") || location.pathname.replace(/\/+$/, "").split("/").pop();
    const p = projects.find(x => slugOf(x) === slug);
    const app = document.getElementById("app");
    if (!p) { hero({ a: "Smile", b: "Not Found", img: "/img/moment-hero.webp", sub: "This project isn't here. Have a look at all our projects instead.", btns: false, small: true, extra: `<a class="btn orange" href="/projects">See all projects</a>` }); return; }
    document.title = `${p.title} · Raavanaa · Beyond the Lanes`;
    const n = stageNum(p), goal = goalOf(p), raised = raisedOf(p);
    const el = document.getElementById("hero");
    el.className = "hero project-hero";
    el.innerHTML = `<div class="hero-photo"><img src="${esc(imgUrl(p.cover, 1400))}" alt=""></div>
      <div class="hero-in">
        <div class="hero-copy left">
          <div class="ph-tags">${pill(p)}<span class="pc-place">${ico("pin")}${esc(placeOf(p))}</span></div>
          <h1 class="ph-title">${esc(p.title)}</h1>
          ${p.summary ? `<p class="hero-sub">${esc(p.summary)}</p>` : ""}
          <div class="ph-fund">${bar(p)}${goal ? `<span>${money(p, raised)} of ${money(p, goal)}</span>` : ""}</div>
          <div class="ph-btns">${n === 1 ? `<a class="btn orange" href="/sponsor?p=${slugOf(p)}">${ico("handHeart")} Sponsor this Smile</a>` : n === 3 ? `<a class="btn orange" href="#story">${ico("heart")} See the smiles</a>` : `<a class="btn orange" href="/get-involved#volunteer">${ico("handHeart")} Help on the day</a>`}
            <button class="btn ghost share" type="button">${ico("share")} Share</button></div>
        </div>
      </div>`;
    const budget = (p.budget || []).filter(x => x && x.item), funders = (p.funders || []).filter(x => x && x.name);
    const ex = (p.expectations || []).filter(x => x && x.text), photos = (p.photos || []).filter(x => x && x.image), ups = (p.updates || []).filter(x => x && (x.title || textOf(x)));
    const more = byNeed(projects.filter(x => x !== p)).slice(0, 6);
    app.innerHTML = `<section class="proj-body" id="story">
        <article class="story">${p.quote ? `<blockquote>${esc(p.quote)}</blockquote>` : ""}${md(p.story || p.summary)}</article>
        <aside class="side">
          ${budget.length ? `<div class="side-card"><h3>Where the money goes</h3><ul class="budget">${budget.map(x => `<li><span>${esc(x.item)}</span><b>${money(p, numOf(x.amount))}</b></li>`).join("")}<li class="total"><span>Total</span><b>${money(p, goal)}</b></li></ul></div>` : ""}
          ${funders.length ? `<div class="side-card"><h3>Made possible by</h3><ul class="funders">${funders.map(x => `<li>${ico("heart")}${esc(x.name)}</li>`).join("")}</ul></div>` : ""}
          ${ex.length ? `<div class="side-card"><h3>What we hope for</h3><ul class="hopes">${ex.map(x => `<li>${ico("check")}<span>${esc(x.text)}${x.result ? `<em>${esc(x.result)}</em>` : ""}</span></li>`).join("")}</ul></div>` : ""}
        </aside>
      </section>
      ${ups.length ? `<section class="updates"><h2 class="sec-h">From the day</h2>${ups.map(u => `<article class="update">${u.date ? `<time>${esc(fmtDate(u.date))}</time>` : ""}<h3>${esc(u.title || "")}</h3>${md(textOf(u))}</article>`).join("")}</section>` : ""}
      ${photos.length ? `<section class="gallery-sec"><h2 class="sec-h">Moments</h2><div class="gallery">${photos.map(x => `<figure><img src="${esc(imgUrl(x.image, 900))}" alt="${esc(x.caption || "")}" loading="lazy">${x.caption ? `<figcaption>${esc(x.caption)}</figcaption>` : ""}</figure>`).join("")}</div></section>` : ""}
      ${more.length ? featured(more, "More Smiles") : ""}`;
    wireFeatured(document);
    el.querySelector(".share").onclick = async e => {
      const data = { title: p.title, url: location.href };
      try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); e.currentTarget.lastChild.textContent = " Link copied"; } } catch (_) { /* closed */ }
    };
  }

  function renderImpact(projects) {
    hero({ a: "Our", b: "Impact", img: "/img/members-bridge.webp", pos: "50% 55%",
      sub: "Every day of joy comes back to you as a story, the pictures and what was spent.", btns: false,
      extra: `<a class="btn orange" href="/sponsor">${ico("handHeart")} Sponsor the next smile</a>`, small: true });
    const done = projects.filter(p => stageNum(p) === 3);
    const kids = done.reduce((s, p) => { const m = String(p.reach || "").match(/(\d+)\s+children/i); return s + (m ? +m[1] : 0); }, 0);
    const towns = new Set(projects.map(townOf).filter(Boolean)).size;
    const ups = done.flatMap(p => (p.updates || []).filter(u => u && u.title).map((u, k) => ({ u, p, img: ((p.photos || []).filter(x => x && x.image)[k] || {}).image || p.cover }))).sort((a, b) => String(b.u.date).localeCompare(String(a.u.date)));
    const photos = done.flatMap(p => (p.photos || []).filter(x => x && x.image).map(x => ({ x, p }))).slice(0, 6);
    const stat = (n, t, c, ic) => `<div class="stat ${c}"><span class="stat-ico">${ico(ic)}</span><b>${n}</b><span>${t}</span></div>`;
    document.getElementById("app").innerHTML = `
      <section class="stats">${stat(done.length, done.length === 1 ? "Day of joy delivered" : "Days of joy delivered", "s3", "sprout")}${stat(kids ? kids + "+" : "Many", "Children who had their day", "s2", "people")}${stat(towns, towns === 1 ? "Town with a project" : "Towns with a project", "s1", "pin")}${stat("100%", "Of every gift goes to the day", "s2", "heart")}</section>
      ${ups.length ? `<section class="stories"><h2 class="sec-h">Stories from the day</h2><div class="story-grid">${ups.slice(0, 6).map(({ u, p, img }) => `<a class="story-card" href="/projects/${slugOf(p)}"><span class="sc-img"><img src="${esc(imgUrl(img, 700))}" alt="" loading="lazy"></span><span class="sc-body">${u.date ? `<time>${esc(fmtDate(u.date))}</time>` : ""}<b>${esc(u.title)}</b><span>${esc(textOf(u).replace(/[*_#>\[\]]/g, "").slice(0, 150))}${textOf(u).length > 150 ? "…" : ""}</span><span class="pc-place">${ico("pin")}${esc(placeOf(p))}</span></span></a>`).join("")}</div></section>` : ""}
      ${photos.length ? `<section class="gallery-sec"><h2 class="sec-h">Smiles we've seen</h2><div class="gallery">${photos.map(({ x, p }) => `<figure><a href="/projects/${slugOf(p)}"><img src="${esc(imgUrl(x.image, 900))}" alt="${esc(x.caption || "")}" loading="lazy"></a>${x.caption ? `<figcaption>${esc(x.caption)}</figcaption>` : ""}</figure>`).join("")}</div></section>` : ""}
      ${featured(done, "Completed Smiles")}`;
    wireFeatured(document);
  }

  function renderInvolved() {
    hero({ a: "Get", b: "Involved", img: "/img/home-3.webp", pos: "60% 55%",
      sub: "There's a place for everyone in a child's day of joy.", small: true });
  }
  function renderSponsor(projects) {
    hero({ a: "Sponsor a", b: "Smile", img: "/img/home-2.webp", pos: "50% 60%", btns: false, small: true,
      sub: "Choose a day of joy that's waiting, and make it happen. Every penny goes to the day." });
    const box = document.getElementById("waiting"), sel = document.getElementById("s-project");
    const waiting = projects.filter(p => stageNum(p) === 1);
    if (box) box.innerHTML = waiting.length ? waiting.map(cardV).join("") : `<p class="empty">Every smile is on its way right now. New ones are added soon.</p>`;
    if (sel) {
      sel.insertAdjacentHTML("beforeend", waiting.map(p => `<option value="${esc(p.title)}">${esc(p.title)}</option>`).join(""));
      const want = new URLSearchParams(location.search).get("p"), hit = waiting.find(p => slugOf(p) === want);
      if (hit) sel.value = hit.title;
    }
  }
  function renderRequest() {
    hero({ a: "Request a", b: "Smile", img: "/img/moment-hero.webp", pos: "62% 60%", btns: false, small: true,
      sub: "Know children who deserve a day of joy? Tell us about them. We'll visit, listen and plan it together." });
  }
  function renderAbout(projects) {
    hero({ a: "About", b: "Raavanaa", img: "/img/home-4.webp", pos: "50% 55%", small: true,
      sub: "We exist for one thing: giving children a day of joy they will remember." });
    const c = document.getElementById("about-cycle");
    if (c) c.innerHTML = cycleHTML("ac");
  }

  // ---------- Forms: send without leaving the page ----------
  function wireForms() {
    document.querySelectorAll("form[data-netlify]").forEach(f => f.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = f.querySelector("[type=submit]"); btn.disabled = true;
      try {
        const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(f)).toString() });
        if (!r.ok) throw new Error(r.status);
        f.innerHTML = `<div class="sent">${ico("heart")}<h3>Thank you!</h3><p>${esc(f.dataset.done || "We'll be in touch soon.")}</p></div>`;
      } catch (_) {
        btn.disabled = false;
        let m = f.querySelector(".form-err"); if (!m) { m = document.createElement("p"); m.className = "form-err"; btn.after(m); }
        m.textContent = "That didn't send. Check your connection and try again.";
      }
    }));
  }

  async function main() {
    header(); footer();
    let projects = [];
    try { projects = ((await (await fetch("/projects.json")).json()).projects || []).filter(p => p && p.title && !p.hidden && p.verified); } catch (_) { /* pages still show */ }
    const R = { home: renderHome, initiatives: renderInitiatives, projects: renderProjects, project: renderProject, impact: renderImpact, involved: renderInvolved, sponsor: renderSponsor, request: renderRequest, about: renderAbout }[page];
    if (R) R(projects);
    document.querySelectorAll("i[data-ico]").forEach(i => { i.outerHTML = ico(i.dataset.ico); });
    fixLinks(document);
    new MutationObserver(() => fixLinks(document)).observe(document.body, { childList: true, subtree: true });
    wireForms();
    if (location.hash) { const t = document.querySelector(location.hash); if (t) setTimeout(() => t.scrollIntoView(), 60); }
  }
  main();
})();
