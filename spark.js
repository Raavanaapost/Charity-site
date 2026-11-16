/* "Spark a Smile" (/spark), SURESH 16 Nov 2026: the way in for anyone who wants to START a project, in the same
   template as Gift a Moment (/moment): cream hero, heart mark, turning headlines, numbered steps, a card on the side.
   It makes two things very clear:
     1 there are two ways to start: REQUEST a project (you know who needs a day of joy, we plan it with you) or
       SUBMIT a project (you have a plan and people to run it, we check it and help fund it openly);
     2 one person or a whole group (family, friends, a school, a temple, a society, a charity) can start it.
   At the top, the pictures of current projects take turns (three in view); a new project joins by itself.
   Drawings only (never a photo of a child), and the public share titles (no school or home names).
   The details are then filled in on the existing form (/initiate), which receives the choices made here. */
(function () {
  var root = document.getElementById("spark");
  if (!root) return;
  var FEAT = window.RAAV_FEATURES || {};
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return [].slice.call(root.querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var svg = function (d, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 28) + '" height="' + (w || 28) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };

  // Requests are switched off (FEAT.vetting false): the page says it opens soon, like /initiate does.
  if (FEAT.vetting === false) {
    root.innerHTML = '<section class="mo-hero"><div class="wrap sp-soon"><img src="/img/spark-mark.svg" alt="" width="80" height="80"><h1>Starting a project opens soon</h1><p>Until then, you can <a href="/moment">give in loving memory</a> of someone.</p></div></section>';
    return;
  }

  // The two ways to start
  var WAYS = {
    request: {
      icon: '<path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10M11 9.5V4a1.5 1.5 0 0 1 3 0v6M14 9.5V5.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6 7-2.6 0-4-1.3-5.4-3.4L3.8 14a1.5 1.5 0 0 1 2.4-1.8L8 14V11"/>',
      title: "Request a project", short: "Request",
      say: "You know children, a family or a village who need a day of joy. Tell us, and our volunteers plan it with you.",
      eg: "e.g. a trip for a small school that has never had one",
      titles: ["You know who needs it. <em>Tell us.</em>", "One request <em>can start a whole day of joy.</em>", "You ask. <em>Together we make it happen.</em>"],
      lede: "Know children, a mum, an elder or a whole village who could use a lift? One person or a whole group can ask.",
      go: "Next: tell us who it is for"
    },
    submit: {
      icon: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10z"/><path d="M14 3.5v5h5"/><path d="M12 17v-6M9.3 13.6 12 11l2.7 2.6"/>',
      title: "Submit a project", short: "Submit",
      say: "You already have a plan, a place and people to run it. Send it in: we check it and help it get funded, with every rupee shown.",
      eg: "e.g. a festival meal your temple or society will host",
      titles: ["Your plan. <em>Our open books.</em>", "You run it. <em>We help fund it.</em>", "A project ready to go? <em>Bring it here.</em>"],
      lede: "A school, a temple, a youth club, a family or just you: send in a day you are ready to run. We check it, and show every rupee.",
      go: "Next: tell us about your project"
    }
  };
  // Who is starting it
  var BY = {
    me: { icon: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.8 3.5-5.8 7-5.8s6.2 2 7 5.8"/>', title: "Just me", say: "One person can start a project." },
    group: { icon: '<circle cx="8" cy="8.5" r="2.6"/><circle cx="16.5" cy="9.5" r="2.2"/><path d="M3 19c0-3.2 2.2-5.2 5-5.2s5 2 5 5.2M14 14.3c.8-.4 1.6-.6 2.5-.6 2.5 0 4.5 1.8 4.5 5.3"/>', title: "A group", say: "Family, friends, a school, a temple, a society or a charity." }
  };
  var GROUPS = ["Family", "Friends", "A school or teachers", "A temple, church or mosque", "A society or club", "A charity or organisation", "Another group"];
  // The kinds of day (the same words as the form at /initiate, so the choice carries over)
  var KINDS = [
    ["A day out or trip", '<path d="M3 17h18M5 17V9.5L12 5l7 4.5V17"/><path d="M9.5 17v-4h5v4"/>'],
    ["A game or sports day", '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3c3 2.5 3 8.9 0 11.4M17.7 6.3c-3 2.5-3 8.9 0 11.4"/>'],
    ["A good meal together", '<path d="M4 12h16a8 8 0 0 1-16 0zM9 20.5h6M9 8.5c0-1.5 1.5-1.5 1.5-3M13.5 8.5c0-1.5 1.5-1.5 1.5-3"/>'],
    ["A celebration or festival", '<path d="M12 3c3 4 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 2-6 5-10z"/><path d="M8 21h8"/>'],
    ["Help with learning", '<path d="M3 7.5 12 4l9 3.5-9 3.5z"/><path d="M7 9.2V14c0 1.6 2.2 3 5 3s5-1.4 5-3V9.2"/>'],
    ["Something else", '<path d="M11 4l1.9 5.6 5.6 1.9-5.6 1.9L11 19l-1.9-5.6-5.6-1.9 5.6-1.9z"/>']
  ];

  var q = new URLSearchParams(location.search);
  var st = { way: q.get("way") === "submit" ? "submit" : "request", by: q.get("by") === "group" ? "group" : q.get("by") === "me" ? "me" : "", group: "", gname: "", kind: "" };
  var kindIn = q.get("kind"); if (KINDS.some(function (k) { return k[0] === kindIn; })) st.kind = kindIn;

  var wayCard = function (k) { var w = WAYS[k]; return '<button type="button" role="radio" class="sp-way" data-way="' + k + '"><span class="sp-way-ic">' + svg(w.icon, 30) + '</span><span class="sp-way-t"><b>' + w.title + "</b><span>" + w.say + "</span><small>" + w.eg + '</small></span><i class="sp-tick" aria-hidden="true">✓</i></button>'; };
  var byCard = function (k) { var b = BY[k]; return '<button type="button" role="radio" class="sp-by" data-by="' + k + '"><span class="sp-way-ic">' + svg(b.icon, 30) + '</span><span class="sp-way-t"><b>' + b.title + "</b><span>" + b.say + '</span></span><i class="sp-tick" aria-hidden="true">✓</i></button>'; };
  var STAGES = [
    ["s1", "Initiated", "You send it in. Three people who know about it vouch for it, and a volunteer near you checks it with a call or a visit."],
    ["s2", "Activated", "It goes on the site. Gifts come in and every rupee is shown openly. The day is booked."],
    ["s3", "Impact", "The day happens. Its story and its spending are shared with everyone."]
  ];

  root.innerHTML =
    '<section class="mo-hero sp-hero">' +
      '<div class="mo-petals sp-sparks" aria-hidden="true">' + Array.apply(null, Array(14)).map(function (_, i) { return '<i style="--i:' + i + '"></i>'; }).join("") + "</div>" +
      '<div class="wrap mo-hero-in">' +
        '<div class="mo-art sp-art">' +
          '<div class="sp-stack" data-stack aria-live="polite"><span class="sp-frame sp-ghost p0"></span><span class="sp-frame sp-ghost p1"></span><span class="sp-frame sp-ghost p2"></span></div>' +
          '<a class="sp-cap" data-cap href="/projects"><span class="sp-cap-kick">Projects people started</span><b data-cap-t>&nbsp;</b><small data-cap-s>&nbsp;</small></a>' +
          '<div class="sp-dots" data-dots></div>' +
        "</div>" +
        '<div class="mo-hero-text">' +
          '<p class="mo-brand"><img class="mo-mark" src="/img/spark-mark.svg" alt="" width="66" height="66">' +
            '<span class="mo-brand-words"><span class="mt-title sp-title"><span>Spark a</span> <b>Smile</b></span>' +
            '<span class="mt-ribbon sp-ribbon">start a project</span></span></p>' +
          '<h1 class="mo-titles" data-titles></h1>' +
          '<p class="mo-lede" data-lede></p>' +
        "</div>" +
        '<div class="mo-pick" id="sp-step-1">' +
          '<p class="mo-pick-q"><span class="mo-num">1</span>How would you like to start?</p>' +
          '<div class="sp-ways" role="radiogroup" aria-label="How would you like to start?">' + wayCard("request") + wayCard("submit") + "</div>" +
        "</div>" +
      "</div></section>" +
    '<div class="wrap mo-body sp-body">' +
      '<div class="sp-steps">' +
        '<section class="mo-step" id="sp-step-2"><p class="mo-num">2</p><h2>Who is starting it?</h2>' +
          '<p class="mo-note">Anyone can start a project on Raavanaa: one person, or a whole group together.</p>' +
          '<div class="sp-bys" role="radiogroup" aria-label="Who is starting it?">' + byCard("me") + byCard("group") + "</div>" +
          '<div class="sp-group" data-group hidden>' +
            '<p class="sp-group-q">What kind of group?</p>' +
            '<div class="sp-chips" role="radiogroup" aria-label="What kind of group?">' + GROUPS.map(function (g) { return '<button type="button" role="radio" class="sp-chip" data-group-k="' + esc(g) + '">' + esc(g) + "</button>"; }).join("") + "</div>" +
            '<label class="mo-field"><span>Name of the group <small>(optional)</small></span><input name="gname" maxlength="80" placeholder="e.g. Toronto Tamil Youth Club, or the Kumar family"></label>' +
          "</div>" +
        "</section>" +
        '<section class="mo-step" id="sp-step-3"><p class="mo-num">3</p><h2>What kind of day?</h2>' +
          '<p class="mo-note">Pick the closest one. You can tell us everything in your own words next, or in a voice note.</p>' +
          '<div class="mo-occ sp-kinds" role="radiogroup" aria-label="What kind of day?">' + KINDS.map(function (k) { return '<button type="button" role="radio" class="mo-chip" data-kind="' + esc(k[0]) + '">' + svg(k[1], 26) + "<span>" + esc(k[0]) + "</span></button>"; }).join("") + "</div>" +
        "</section>" +
      "</div>" +
      '<aside class="mo-side"><div class="mo-sticky">' +
        '<p class="mo-side-label">Your project, at a glance</p>' +
        '<figure class="mo-card sp-card">' +
          '<img class="sp-card-mark" src="/img/spark-mark.svg" alt="" width="64" height="64">' +
          '<p class="sp-card-way" data-c-way></p>' +
          '<dl class="sp-card-list">' +
            '<div><dt>Started by</dt><dd data-c-by></dd></div>' +
            '<div><dt>The day</dt><dd data-c-kind></dd></div>' +
          "</dl>" +
          '<div class="mo-card-rule" aria-hidden="true"><i></i><b>✦</b><i></i></div>' +
          '<p class="sp-next-h">What happens next</p>' +
          '<ol class="sp-journey">' + STAGES.map(function (s) { return '<li class="' + s[0] + '"><b>' + s[1] + "</b><span>" + s[2] + "</span></li>"; }).join("") + "</ol>" +
        "</figure>" +
        '<a class="mo-go sp-go" data-go href="/initiate"></a>' +
        '<p class="mo-privacy">You sign in once, so every project is accountable. Phone numbers and places stay private with our team.</p>' +
      "</div></aside>" +
    "</div>";

  // ---- the choices ----
  var titleTimer = null;
  function drawTitles() {
    var w = WAYS[st.way], box = $("[data-titles]");
    box.innerHTML = w.titles.map(function (t, i) { return '<span class="' + (i ? "" : "on") + '">' + t + "</span>"; }).join("");
    $("[data-lede]").textContent = w.lede;
    clearInterval(titleTimer);
    if (reduce) return;
    var k = 0, spans = [].slice.call(box.children);
    titleTimer = setInterval(function () { if (document.hidden) return; k = (k + 1) % spans.length; spans.forEach(function (s, j) { s.classList.toggle("on", j === k); }); }, 4200);
  }
  function draw() {
    $$("[data-way]").forEach(function (b) { var on = b.dataset.way === st.way; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    $$("[data-by]").forEach(function (b) { var on = b.dataset.by === st.by; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    $$("[data-group-k]").forEach(function (b) { var on = b.dataset.groupK === st.group; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    $$("[data-kind]").forEach(function (b) { var on = b.dataset.kind === st.kind; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    $("[data-group]").hidden = st.by !== "group";
    root.classList.toggle("sp-submit", st.way === "submit");
    var w = WAYS[st.way];
    $("[data-c-way]").textContent = w.title;
    var by = st.by === "me" ? "Just me" : st.by === "group" ? (st.gname.trim() || st.group || "A group") + (st.gname.trim() && st.group ? " (" + st.group.replace(/^An? /, "").toLowerCase() + ")" : "") : "";
    $("[data-c-by]").innerHTML = by ? esc(by) : '<span class="sp-ghost-t">One person or a group</span>';
    $("[data-c-kind]").innerHTML = st.kind ? esc(st.kind) : '<span class="sp-ghost-t">Pick one in step 3</span>';
    var p = new URLSearchParams();
    p.set("way", st.way);
    if (st.by) p.set("by", st.by);
    if (st.by === "group" && st.group) p.set("group", st.group);
    if (st.by === "group" && st.gname.trim()) p.set("gname", st.gname.trim());
    if (st.kind) p.set("kind", st.kind);
    var go = $("[data-go]");
    go.href = "/initiate?" + p.toString();
    go.textContent = w.go + " →";
  }
  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-way],[data-by],[data-group-k],[data-kind]");
    if (!b) return;
    if (b.dataset.way) { var changed = st.way !== b.dataset.way; st.way = b.dataset.way; if (changed) drawTitles(); }
    else if (b.dataset.by) st.by = b.dataset.by;
    else if (b.dataset.groupK) st.group = b.dataset.groupK;
    else if (b.dataset.kind) st.kind = b.dataset.kind;
    draw();
  });
  root.addEventListener("input", function (e) { if (e.target.name === "gname") { st.gname = e.target.value; draw(); } });
  drawTitles(); draw();

  // ---- the projects taking turns at the top ----
  var getJSON = function (u, d) { return fetch(u).then(function (r) { return r.ok ? r.json() : d; }).catch(function () { return d; }); };
  var THEME_ART = { "Education": "/img/project-arcade.svg", "Livelihood": "/img/project-mums.svg" };
  // drawings only: an .svg drawing, or one of the site's own drawn pictures; never a photo
  var isDrawing = function (u) { return /\.svg(\?|$)/i.test(u || "") || /^\/img\/(members-bridge|project-)/.test(u || ""); };
  var STAGE = ["Initiated", "Activated", "Impact"];
  Promise.all([getJSON("/projects.json", { projects: [] }), getJSON("/share.json", null), getJSON("/api/projects", null)]).then(function (res) {
    var share = (res[1] && res[1].projects) || {}, made = (res[2] && res[2].projects) || [];
    var list = (res[0].projects || []).slice(), have = {};
    list.forEach(function (p) { if (p) have[p.slug] = 1; });
    made.forEach(function (p) { if (p && !have[p.slug]) list.push(p); });
    var all = list.filter(function (p) { return p && p.title && p.slug && !p.hidden && p.verified; }).map(function (p, i) {
      var sh = share[p.slug] || {};
      var stage = /complete/i.test(p.status || "") ? 3 : /active/i.test(p.status || "") ? 2 : 1;
      return { slug: p.slug, title: sh.title || p.title, stage: stage, i: i,
        art: sh.art || (isDrawing(p.cover) ? p.cover : THEME_ART[p.theme] || "/img/project-hills.svg"),
        place: p.city || String(p.location || "").split(",")[0], reach: sh.reach || "" };
    // current projects first (Initiated, then Activated), the finished ones after; the newest added comes first in its stage
    }).sort(function (a, b) { return a.stage - b.stage || b.i - a.i; });
    if (!all.length) { $(".sp-art").hidden = true; return; }
    var stack = $("[data-stack]"), dots = $("[data-dots]");
    stack.innerHTML = all.map(function (p, i) {
      return '<a class="sp-frame s' + p.stage + '" href="/projects/' + esc(p.slug) + '" data-i="' + i + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + esc(p.art) + '" alt="" width="300" height="225"' + (i > 2 ? ' loading="lazy"' : "") + '><span class="sp-pill">' + STAGE[p.stage - 1] + "</span></a>";
    }).join("");
    dots.innerHTML = all.length > 1 ? all.map(function (p, i) { return '<button type="button" data-dot="' + i + '" aria-label="' + esc(p.title) + '"></button>'; }).join("") : "";
    var frames = [].slice.call(stack.children), k = 0, timer = null;
    function show(n) {
      k = (n + all.length) % all.length;
      frames.forEach(function (f, i) {
        var pos = (i - k + all.length) % all.length;
        f.className = f.className.replace(/\s*p\d|\s*off/g, "") + (pos < 3 ? " p" + pos : " off");
        f.setAttribute("tabindex", pos ? "-1" : "0"); f.setAttribute("aria-hidden", pos ? "true" : "false");
      });
      var p = all[k], cap = $("[data-cap]");
      cap.href = "/projects/" + p.slug;
      $("[data-cap-t]").textContent = p.title;
      $("[data-cap-s]").textContent = [STAGE[p.stage - 1], p.place, p.reach].filter(Boolean).join(" · ");
      cap.className = "sp-cap s" + p.stage;
      [].slice.call(dots.children).forEach(function (d, i) { d.classList.toggle("on", i === k); });
    }
    function play() { clearInterval(timer); if (reduce || all.length < 2) return; timer = setInterval(function () { if (!document.hidden) show(k + 1); }, 4500); }
    dots.addEventListener("click", function (e) { var d = e.target.closest("[data-dot]"); if (d) { show(+d.dataset.dot); play(); } });
    show(0); play();
  });
})();
