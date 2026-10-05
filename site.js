/* Shared site script: loads content/*.json and renders the current page.
   Content is edited from /admin — no code changes needed for new projects. */
(function () {
  let COMMENTS = [];
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

  // Footer shown on every page. Social links and email appear only when filled in under Site settings.
  function frame(site) {
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
        <nav class="foot-cols" aria-label="Footer">
          ${col("Explore", [["Home", "/"], ["About us", "/about"], ["Contact", "/contact"]])}
          ${col("Our stages", [["Initiated", "/initiated"], ["Activated", "/activated"], ["Impact", "/impact"]])}
          ${col("Get involved", [["Volunteer with us", "/volunteer"], ["Suggest a project", "/contact?topic=suggest"], ["Partner with us", "/contact?topic=partner"]])}
          ${follow.length ? col("Follow us", follow) : ""}
        </nav>
      </div></div>
      <div class="foot-bar"><div class="wrap">
        <span>© ${new Date().getFullYear()} ${esc(site.name)} · Beyond the Lanes</span>
        ${site.footer ? `<span>${esc(site.footer)}</span>` : ""}
        <span class="foot-links"><a href="/privacy">Privacy &amp; child safety</a><a href="/admin">Team login</a></span>
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

  function wireForms(root) {
    root.querySelectorAll("form[data-ajax]").forEach(f => f.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = f.querySelector("button[type=submit]"), msg = f.querySelector("[data-msg]");
      btn.disabled = true;
      const fd = new FormData(f); // read the entries before the fields are disabled
      try {
        const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fd).toString() });
        if (!r.ok) throw new Error(r.status);
        f.querySelectorAll("input:not([type=hidden]),textarea,select").forEach(el => el.disabled = true);
        msg.textContent = f.dataset.done; msg.className = "toast";
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
    const rest = esc(str.slice(first.length)).replace(/\s+[-–—]\s+/, ' <span class="dash">–</span> ');
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
      <a class="card" href="/projects/${slugOf(p)}">
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
  function renderHome(app, site, projects) {
    const counts = {
      initiated: projects.length,
      activated: projects.filter(p => stageNum(p) >= 2).length,
      impact: projects.reduce((n, p) => n + (p.updates || []).length, 0)
    };
    const extras = (site.highlights || []).filter(h => h && h.value);
    const latest = projects.slice(0, 3); // newest first, as ordered in the admin page
    const slides = (site.sayings || []).map(x => typeof x === "string" ? { text: x } : x).filter(x => x && x.text);
    const start = slides.length ? Math.floor(Math.random() * slides.length) : 0; // a different slide comes first on each visit
    const follow = (site.follow || []).filter(x => x && x.title && x.text);
    const fstart = follow.length ? Math.floor(Math.random() * follow.length) : 0;
    app.innerHTML = `
      <section class="intro">
        <h1 class="headline">${headline((slides[start] && slides[start].title) || site.tagline)}</h1>
        ${sayingsHTML(site, slides, start)}
      </section>
      <nav class="stages" aria-label="Our projects by stage">
        ${Object.entries(STAGES).map(([slug, st]) => `
          <a class="stage art stat-${st.key}" href="/${slug}">
            <i>${ICONS[st.key]}</i>
            <b${counts[slug] ? "" : ' class="zero"'}>${counts[slug] || "Soon"}</b>
            <span>${st.label}</span>
          </a>`).join("")}
      </nav>
      <p class="stage-hint">Choose a stage to see its projects</p>
      ${latest.length ? `<section class="home-latest">
        <h2 class="section-title">Our latest projects</h2>
        <div class="grid">${latest.map(p => card(p, projects.indexOf(p), journey(p))).join("")}</div>
        <p class="more"><a href="/initiated">See all our projects →</a></p>
      </section>` : ""}
      ${extras.length ? `<div class="stage-extras">${extras.map(h => `<div><b>${esc(h.value)}</b> ${esc(h.label)}</div>`).join("")}</div>` : ""}
      <section class="signup-band" id="keep-posted">${follow.length ? followHTML(site, follow, fstart) : signupHTML("home")}</section>`;
    wireForms(app);
    fitHeadline();
    rotTimers.forEach(clearInterval); rotTimers = [];
    startSayings(app);
    startFollow(app);
    // arriving from the footer's "Keep me posted" button on another page
    if (location.hash === "#keep-posted") { const t = document.getElementById("keep-posted"); if (t) t.scrollIntoView(); }
  }

  // Rotating messages under the home headline.
  function sayingsHTML(site, list, start) {
    if (!list.length) return `<p>${esc(site.intro)}</p>`;
    const slide = (x, i) => `<figure class="saying${i === start ? " on" : ""}${x.image ? " has-img" : ""}" aria-hidden="${i !== start}" data-title="${esc(x.title || site.tagline)}">
        ${x.image ? `<img src="${esc(/\.svg$/i.test(x.image) ? x.image : imgUrl(x.image, 1000))}" alt="" width="400" height="200">` : ""}
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

  // How far a project has come: 1 Initiated, 2 Activated, 3 Impact (from its Status in the admin page).
  const stageNum = p => /complete/i.test(p.status || "") ? 3 : /active|pause/i.test(p.status || "") ? 2 : 1;
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
      n: 1, title: "Initiated", hero: "/img/hero-initiated.svg",
      lead: "Every project begins when someone tells us about children who are waiting for a day of joy. We visit, listen and make sure the need is real.",
      tags: [
        ["Reaching out", '<path d="M4 6.5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H10l-4 3v-3H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"/><path d="M7 10.5h8M7 13.5h5"/>'],
        ["Spotting an opportunity", '<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5.5 5.5"/><path d="m10 6.8.9 2 2.2.3-1.6 1.5.4 2.1-1.9-1-1.9 1 .4-2.1L6.9 9.1l2.2-.3z" fill="currentColor" stroke="none"/>'],
        ["Opening a relationship", '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 19c.6-3.4 2.6-5 5.5-5 1.6 0 2.9.5 4 1.5 1.1-1 2.4-1.5 4-1.5 2.9 0 4.9 1.6 5.5 5"/>'],
        ["Starting an initiative", '<path d="M12 21v-9"/><path d="M12 14c-4 0-6-2.2-6.5-6 3.9 0 6 2 6.5 6z"/><path d="M12 11c0-4 2.3-6 6.5-6.5 0 4-2.3 6-6.5 6.500z"/>']
      ],
      heading: 'Projects we have <span class="stage-word s1">Initiated</span>', empty: { text: "Our first projects are being planned. Check back soon, or tell us about a need you see.", btn: "Suggest a project", href: "/contact?topic=suggest" },
      cta: { title: "Have an idea for a project?", text: "Every project on this page began with someone reaching out. Tell us about a need you see, and we'll explore it together.", btn: "Suggest a project", href: "/contact?topic=suggest" },
      next: { slug: "activated", kicker: "Next stage", label: "Activated", text: "See the projects that have moved into action." }
    },
    activated: {
      n: 2, title: "Activated", hero: "/img/hero-activated.svg",
      lead: "The day is funded and being planned: the date, the place, the food and the helpers.",
      tags: [
        ["Taking part", '<circle cx="12" cy="6" r="2.6"/><path d="M5 5l4.5 5.500h5L19 5"/><path d="M9.5 10.500V20M14.5 10.500V20"/>'],
        ["Getting organized", '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.500h6v-2H9z"/><path d="m8.5 11 1.5 1.5 2.5-2.500M8.5 16l1.5 1.5 2.5-2.500M14.5 11.500h2M14.5 16.500h2"/>'],
        ["Working together", '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>'],
        ["Making it happen", '<path d="M13 2.5 5 13.500h6l-1 8 8-11h-6z"/>']
      ],
      heading: 'Projects we have <span class="stage-word s2">Activated</span>', empty: { text: "Nothing is in action just yet. Our first projects are getting ready to start, and you can follow them from the beginning.", btn: "See what we have initiated", href: "/initiated" },
      cta: { title: "Want to take part?", text: "Projects move because people show up. Lend an hour, a skill or a helping hand, and be part of what's happening.", btn: "Volunteer with us", href: "/volunteer" },
      next: { slug: "impact", kicker: "Next stage", label: "Impact", text: "See the difference these projects are making." }
    },
    impact: {
      n: 3, title: "Impact", hero: "/img/hero-impact.svg",
      lead: "The day has happened. Here are the stories and the pictures, so everyone who gave can see the smiles they created.",
      tags: [
        ["Smiles created", '<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.8 2.4 2.7 4 2.700s3-.9 4-2.7"/><path d="M8.5 9.500h.01M15.5 9.500h.01" stroke-width="2.6"/>'],
        ["Everyone included", '<circle cx="12" cy="6" r="2.4"/><circle cx="5.5" cy="9" r="2"/><circle cx="18.5" cy="9" r="2"/><path d="M7.5 20c.4-4 2-6 4.5-6s4.1 2 4.5 6M2 18c.3-2.6 1.4-4 3.5-4M22 18c-.3-2.6-1.4-4-3.5-4"/>'],
        ["Real connection", '<path d="M12 20s-7.5-4.6-7.5-10.200A4.3 4.3 0 0 1 12 7.600a4.3 4.3 0 0 1 7.5 2.200c0 5.6-7.5 10.2-7.5 10.200z"/>'],
        ["Lasting difference", '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>']
      ],
      heading: '<span class="stage-word s3">Impact</span> Stories', empty: { text: "Our first impact stories are on the way. As soon as a trip or event has happened, the smiles and the stories will be shared here.", btn: "See what we have initiated", href: "/initiated" },
      cta: { title: "Be part of the next one", text: "Every smile on this page started with people who cared. Stay close and see what we create together next.", btn: "Keep me posted", href: "/#keep-posted" },
      next: { slug: "initiated", kicker: "Back to the start", label: "Initiated", text: "See every project from where it began." }
    }
  };

  function renderStage(app, site, projects, slug) {
    const cfg = STAGE_PAGES[slug], key = STAGES[slug].key;
    document.title = `${cfg.title} · ${site.name}`;
    const reached = projects.filter(p => stageNum(p) >= Math.min(cfg.n, 2));
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
      href: x.count === "trips" || x.count === "projects" ? "/initiated" : x.count === "stories" ? "#stories" : /volunteer/i.test(x.label) ? "/volunteer" : ""
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
    const sub = slug === "initiated" ? `${plural(projects.length, "project")} started${fresh ? ` · ${fresh} just beginning` : ""}`
      : slug === "activated" ? (reached.length ? `${plural(reached.length, "project")} in action` : "First projects starting soon")
      : stories.length ? `${stories.length === 1 ? "1 story" : stories.length + " stories"} of impact · ${plural(new Set(stories.map(x => x.p)).size, "project")}` : "First stories coming soon";
    // Short message shown under each category heading in "Impact Stories" (Site settings → Impact story sections).
    const notes = Object.fromEntries((site.categories || []).filter(c => c && c.name && c.note).map(c => [c.name, c.note]));
    let filter = "All";
    const draw = () => {
      const groups = themes.filter(t => filter === "All" || t === filter).map(t => [t, items.filter(x => (x.p.theme || "Other") === t)]);
      const body = !items.length ? `<div class="panel empty-state"><p>${cfg.empty.text}</p><a class="btn" href="${cfg.empty.href}">${cfg.empty.btn}</a></div>`
        : groups.map(([t, xs]) => `
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
          </section>`).join("");
      app.innerHTML = `
        ${stageNav(slug)}
        <header class="stage-hero s${cfg.n}">
          <img src="${cfg.hero}" alt="" width="400" height="200">
          <div class="stage-hero-text"><h1>${cfg.title}</h1><p>${sub}</p></div>
        </header>
        <section class="stage-lead s${cfg.n}">
          <p class="big">${cfg.lead}</p>
          <ul class="meaning">${cfg.tags.map(([t, d]) => `<li>${ICON(d)}<span>${t}</span></li>`).join("")}</ul>
        </section>
        ${slug === "impact" && numbers.length ? `
          <h2 class="section-title lined"><span class="stage-word s3">Impact</span> in numbers</h2>
          <div class="impact-numbers">${numbers.map(({ p, x }) => { const href = p ? `/projects/${slugOf(p)}` : x.href; return `<${href ? `a href="${esc(href)}"` : "div"}><b>${esc(x.value)}</b><span>${esc(x.label)}</span>${p ? `<small>${esc(p.title)}</small>` : x.note ? `<small>${esc(x.note)}</small>` : ""}</${href ? "a" : "div"}>`; }).join("")}</div>` : ""}
        <h2 class="section-title lined" id="stories">${cfg.heading}</h2>
        ${themes.length > 1 ? `<div class="filters" role="group" aria-label="Filter by theme">
          ${["All", ...themes].map(t => `<button class="chip" aria-pressed="${t === filter}" data-t="${esc(t)}">${esc(t)}</button>`).join("")}
        </div>` : ""}
        ${body}
        <section class="stage-next">
          <div class="panel idea">
            <h2>${cfg.cta.title}</h2>
            <p>${cfg.cta.text}</p>
            <a class="btn" href="${cfg.cta.href}">${cfg.cta.btn}</a>
          </div>
          <a class="next-stage to-${cfg.next.slug}" href="/${cfg.next.slug}"><span>${cfg.next.kicker}</span><b>${cfg.next.label} →</b><small>${cfg.next.text}</small></a>
        </section>`;
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

  function renderProject(app, site, projects, slug) {
    const i = projects.findIndex(p => slugOf(p) === slug);
    const p = projects[i];
    if (!p) {
      app.innerHTML = `<section class="intro"><h1>Project not found</h1><p>It may have been renamed or removed.</p><p><a href="/">See all projects</a></p></section>`;
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
    const money = n => `${esc(site.currency || "$")}${Math.round(n).toLocaleString("en-US")}`;
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
    const steps = [
      { name: "Visited and verified", done: p.verified ? 1 : 0, c: "#1f7a47" },
      { name: "Budget ready", done: goal > 0 ? 1 : 0, c: "#3f9a5f" },
      { name: "Funded", done: goal > 0 ? Math.min(1, raised / goal) : 0, c: "#eaa21c", pctLabel: true },
      { name: "Date confirmed", done: p.date_set ? 1 : 0, c: "#e5851a" },
      { name: "Place and transport booked", done: p.booked ? 1 : 0, c: "#d9632b" },
      { name: "Volunteers ready", done: p.volunteers ? 1 : 0, c: "#c8381e" },
      ...(p.steps || []).filter(x => x && x.name).map((x, k) => ({ name: x.name, done: x.done ? 1 : 0, c: ["#8f6200", "#b4560a", "#0f5132"][k % 3] }))
    ];
    const delivered = stageNum(p) === 3;
    const ringPct = delivered ? 100 : Math.round(steps.reduce((s, x) => s + x.done, 0) / steps.length * 100);
    const ringSVG = () => {
      const n = steps.length, gap = n > 5 ? 16 : 20, len = 360 / n - gap; // the rounded ends eat most of the gap
      const arc = (start, l, c, o) => l > 0.01 ? `<circle cx="60" cy="60" r="48" fill="none" stroke="${c}" stroke-opacity="${o}" stroke-width="13" stroke-linecap="round" pathLength="360" stroke-dasharray="${l.toFixed(2)} ${(360 - l).toFixed(2)}" stroke-dashoffset="${(-start).toFixed(2)}"/>` : "";
      return `<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="${ringPct}% of the way to being activated">
        <g transform="rotate(-90 60 60)">${steps.map((x, k) => { const start = k * (len + gap) + gap / 2; return arc(start, len, x.c, .18) + arc(start, len * (delivered ? 1 : x.done), x.c, 1); }).join("")}</g>
        <text x="60" y="${ringPct === 100 ? 60 : 62}" text-anchor="middle" class="ring-n">${ringPct}%</text>
        <text x="60" y="${ringPct === 100 ? 77 : 78}" text-anchor="middle" class="ring-l">${delivered ? "DELIVERED" : ringPct === 100 ? "READY" : "ACTIVATING"}</text>
      </svg>`;
    };
    const ringPanel = cls => `
      <div class="panel activating ${cls}">
        <h2>${delivered ? "Delivered" : ringPct === 100 ? "Activated" : "Activating"}</h2>
        <div class="ring-row">
          ${ringSVG()}
          <ul class="ring-steps">${steps.map(x => { const d = delivered ? 1 : x.done; return `<li class="${d >= 1 ? "done" : d > 0 ? "part" : ""}"><i style="background:${x.c}"></i><span>${esc(x.name)}</span><b>${d >= 1 ? "✓" : x.pctLabel && d > 0 ? Math.round(d * 100) + "%" : "–"}</b></li>`; }).join("")}</ul>
        </div>
      </div>`;
    const moneyHTML = `
      ${lines.length ? `<section class="money">
        <h2 class="section-title">Where the money goes</h2>
        <ul class="money-list">${lines.map(x => `<li><b>${num(x.amount) ? money(num(x.amount)) : ""}</b><span>${esc(x.item)}</span></li>`).join("")}</ul>
        ${goal ? `<p class="money-total"><span>Total budget</span><b>${money(goal)}</b></p>` : ""}
      </section>` : ""}
      ${funders.length ? `<section class="money">
        <h2 class="section-title">Made possible by</h2>
        <ul class="funders">${funders.map(f => `<li><span class="avatar">${esc(String(f.name).trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase())}</span><span class="f-name">${esc(f.name)}</span>${num(f.amount) ? `<b>${money(num(f.amount))}</b>` : ""}</li>`).join("")}</ul>
      </section>` : ""}`;
    // Small line icons for the folder tabs: book, heart, camera, play.
    const ic = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const TAB_ICONS = {
      story: ic('<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.500V5c-3-.5-6 0-8 1.500z"/><path d="M12 6.500V19.5"/>'),
      updates: ic('<path d="M12 20s-7-4.4-7-9.600A4.2 4.2 0 0 1 12 7.700a4.2 4.2 0 0 1 7 2.700C19 15.6 12 20 12 20z"/>'),
      pictures: ic('<path d="M4 8h3.200l1.5-2h6.600l1.5 2H20v11H4z"/><circle cx="12" cy="13.2" r="3.3"/>'),
      video: ic('<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M10.2 9.300v5.400l4.6-2.700z" fill="currentColor"/>')
    };
    const tabs = [
      ["story", "Story"],
      ["updates", "Impact"],
      ["pictures", `Pictures${count(photos.length)}`],
      ["video", `Video${count(media.length)}`]
    ];

    const panes = {
      story: `<div class="story">${p.quote ? `<p class="pull">“${esc(p.quote)}”</p>` : ""}${md(p.story)}</div>`,
      updates: (updates.length ? updates.map(u => `<article class="update"><div class="meta">${fmtDate(u.date)}</div><h3>${esc(u.title)}</h3><div>${md(u.body)}</div></article>`).join("") : `<p class="empty">No impact updates yet.</p>`) + commentsHTML(slugOf(p)),
      pictures: photos.length ? `<div class="photos">${photos.map((ph, k) => `<figure><button data-src="${esc(imgUrl(ph.image, 1600))}" aria-label="Open picture"><div class="cover"><img src="${esc(imgUrl(ph.image, 600))}" alt="${esc(ph.caption)}" loading="lazy"></div></button>${ph.caption ? `<figcaption>${esc(ph.caption)}</figcaption>` : ""}</figure>`).join("")}</div>` : `<p class="empty">No pictures yet.</p>`,
      video: media.length ? `<div class="media">${media.map(m => { const e = embedFor(m.url); return e ? `<figure style="margin:0"><div class="embed"><iframe src="${esc(e)}" title="${esc(m.title)}" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy"></iframe></div>${m.title ? `<figcaption class="note" style="padding-top:6px">${esc(m.title)}</figcaption>` : ""}</figure>` : `<a class="media-link" href="${esc(m.url)}" target="_blank" rel="noopener">▶ ${esc(m.title || m.url)}</a>`; }).join("")}</div>` : `<p class="empty">No videos yet.</p>`
    };

    const draw = tab => {
      app.innerHTML = `
        <nav class="crumbs"><a href="/">Projects</a>${p.theme ? ` / ${esc(p.theme)}` : ""}</nav>
        <header class="phead">
          ${p.theme ? `<span class="tag">${esc(p.theme)}</span>` : ""}
          <h1>${esc(p.title)}</h1>
          <p class="lede">${esc(p.summary)}</p>
          <div class="byline">${p.organization ? `<span class="avatar">${esc(initials)}</span><span>by <strong>${esc(p.organization)}</strong>${p.location ? ` · ${esc(p.location)}` : ""}</span>` : ""}${p.verified ? `<span class="verified"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> Visited and verified</span>` : ""}</div>
        </header>
        <div class="layout">
          <div style="min-width:0">
            <div class="hero cover" style="${coverStyle(p, i)}">${coverHTML(p, i, p.cover ? "" : "Cover photo", 1400)}</div>
            ${ringPanel("only-narrow")}
            ${budgetPanel("only-narrow")}
            <div class="tabs" role="tablist">
              ${tabs.map(([k, l]) => `<button class="tab t-${k}" role="tab" aria-selected="${k === tab}" data-t="${k}">${TAB_ICONS[k]}<span>${l}</span></button>`).join("")}
            </div>
            <section class="folder t-${tab}" role="tabpanel">${panes[tab]}</section>
            ${moneyHTML}
          </div>
          <aside class="side">
            ${ringPanel("only-wide")}
            ${budgetPanel("only-wide")}
            <div class="panel">
              <h2>Project at a glance</h2>
              <dl class="facts">
                ${p.status ? `<dt>Status</dt><dd>${esc(p.status)}</dd>` : ""}
                ${p.location ? `<dt>Location</dt><dd>${esc(p.location)}</dd>` : ""}
                ${p.started ? `<dt>Started</dt><dd>${esc(p.started)}</dd>` : ""}
                ${p.reach ? `<dt>Reach</dt><dd>${esc(p.reach)}</dd>` : ""}
              </dl>
              ${(p.impact || []).length ? `<div class="stats">${p.impact.map(s => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>` : ""}
            </div>
            ${signupHTML(slugOf(p), "Follow this project")}
            <a class="btn ghost" href="/">Back to all projects</a>
          </aside>
        </div>`;
      wireForms(app);
      app.querySelectorAll(".tab").forEach(b => b.onclick = () => { draw(b.dataset.t); history.replaceState(null, "", "#" + b.dataset.t); });
      app.querySelectorAll(".photos button").forEach(b => b.onclick = () => {
        const lb = document.createElement("div");
        lb.className = "lightbox"; lb.innerHTML = `<img src="${esc(b.dataset.src)}" alt="">`;
        lb.onclick = () => lb.remove(); document.body.appendChild(lb);
      });
    };
    const start = location.hash.slice(1);
    draw(tabs.some(([k]) => k === start) ? start : "story");
  }

  function renderPrivacy(app, site) {
    app.innerHTML = `<section class="intro about-page"><span class="eyebrow">Our promise</span><h1 class="follow-title">${headline("Privacy & Child Safety")}</h1><div class="story">${md(site.privacy || "")}</div><p><a href="/contact">Contact us</a></p></section>`;
  }

  function renderAbout(app, site) {
    const org = site.name.charAt(0).toUpperCase() + site.name.slice(1).toLowerCase();
    app.innerHTML = `<section class="intro about-page"><span class="eyebrow">About us</span><h1 class="follow-title"><span class="initial">${esc(org.charAt(0))}</span><span class="org">${esc(org.slice(1))}</span> Community</h1><div class="story">${md(site.about)}</div><p><a href="/initiated">See our projects</a></p></section>`;
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

  async function main() {
    const app = document.getElementById("app");
    const page = document.body.dataset.page;
    try {
      const [site, data, cm] = await Promise.all([load("/site.json"), load("/projects.json"), load("/comments.json").catch(() => ({}))]);
      COMMENTS = (cm && cm.comments) || [];
      frame(site);
      const projects = (data.projects || []).filter(p => p && p.title && !p.hidden);
      if (page === "contact" || page === "volunteer") {
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
        const slug = decodeURIComponent(location.pathname.replace(/\/+$/, "").split("/").pop());
        renderProject(app, site, projects, slugify(slug));
      } else if (page === "privacy") {
        document.title = `Privacy & child safety · ${site.name}`;
        renderPrivacy(app, site);
      } else if (page === "about") {
        document.title = `About us · ${site.name}`;
        renderAbout(app, site);
      } else if (page === "stage") {
        const slug = location.pathname.replace(/\/+$/, "").split("/").pop();
        renderStage(app, site, projects, STAGES[slug] ? slug : "initiated");
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
