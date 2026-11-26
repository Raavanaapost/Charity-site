/* Community groups (SURESH, 23 Nov 2026): "We have small groups that collect money through their WhatsApp circle and
   coordinate and do projects. Allow them to integrate with us: create profiles for them and follow their projects."
   /groups      every listed group, how it works, and "Register our group" (signed in)
   /g/<name>    one group's page: about, how they collect, their projects in the three stages, news, Follow, Share.
                The people who run the group also see "Manage our group": post news, add or move a project, edit, admins.
   Data: /api/groups (netlify/functions/groups.mts). A group's money stays in its own circle; Raavanaa never holds it.
   Cream members look (volunteers.css + groups.css). Switch: RAAV_FEATURES.groups (draft preview only for now). */
(function () {
  var root = document.getElementById("groups");
  if (!root) return;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TONES = ["#1f7a47", "#b97a06", "#c8381e", "#2f7f8f", "#7a4fa0", "#8a5c12"];
  var tone = function (n) { var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return TONES[h % TONES.length]; };
  var initials = function (n) { return String(n).split(/\s+/).filter(function (w) { return /^[A-Za-z0-9஀-௿]/.test(w) && !/^(of|the|and|for)$/i.test(w); }).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase() || "G"; };
  var KINDS = ["WhatsApp circle", "Friends", "Family", "Past pupils", "Village or society", "Temple or church", "Youth or sports club", "Workplace", "Charity or NGO", "School or education", "Other"];
  // Option B (SURESH 25 Nov 2026): one kind of profile, three badges. Group = a circle (money stays in it); Organisation =
  // says it is registered (body + number shown); Verified organisation = the team saw the certificate.
  var REG_BODIES = ["NGO Secretariat", "Companies Act (guarantee company)", "Divisional Secretariat / social services", "Registered charity abroad", "Other"];
  var isOrg = function (g) { return g.type === "organisation"; };
  var badge = function (g, big) {
    return '<span class="g-badge ' + (g.verified ? "verified" : isOrg(g) ? "org" : "grp") + (big ? " big" : "") + '">' +
      (g.verified ? "✓ Verified organisation" : isOrg(g) ? "Organisation" : "Group") + "</span>";
  };
  var avatar = function (g, big) {
    return g.logo ? '<span class="g-av g-av-logo' + (big ? " big" : "") + '"><img src="' + esc(g.logo) + '" alt=""></span>'
      : '<span class="g-av' + (big ? " big" : "") + '" style="--t:' + tone(g.name) + '">' + esc(initials(g.name)) + "</span>";
  };
  // A logo picture is shrunk on the phone to 256 px before it is sent (about 20-60 KB).
  var shrink = function (file) {
    return new Promise(function (ok, no) {
      if (!file || !/^image\//.test(file.type)) return no(new Error("Please choose a picture."));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 256 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var d = c.toDataURL("image/webp", 0.85); if (!/^data:image\/webp/.test(d)) d = c.toDataURL("image/jpeg", 0.85);
        ok(d);
      };
      img.onerror = function () { no(new Error("That picture could not be read.")); };
      img.src = url;
    });
  };
  // The organisation fields, shown when "A registered organisation" is chosen (register and edit forms).
  var orgFields = function (g) {
    g = g || {};
    return '<div class="g-orgf" data-orgf>' +
      '<div class="v-row">' +
        '<label><span>Registered with</span><select name="reg_body"><option value="">Choose…</option>' + REG_BODIES.map(function (b) { return "<option" + (g.reg_body === b ? " selected" : "") + ">" + esc(b) + "</option>"; }).join("") + "</select></label>" +
        '<label><span>Registration number</span><input name="reg_number" maxlength="60" value="' + esc(g.reg_number || "") + '" placeholder="As on the certificate"></label>' +
        '<label><span>Website <small>(optional)</small></span><input name="website" maxlength="160" value="' + esc(g.website || "") + '" placeholder="e.g. ourcharity.org"></label>' +
      "</div>" +
      '<p class="g-small">Keep your certificate ready: a Raavanaa volunteer asks to see it before your page shows <b>Verified organisation</b>. The certificate itself is never put on the site.</p>' +
      "</div>";
  };
  var typePick = function (cur) {
    return '<fieldset class="g-type"><legend>Who are you?</legend>' +
      '<label><input type="radio" name="type" value="group"' + (cur !== "organisation" ? " checked" : "") + '><span><b>A group</b><small>Friends, family, past pupils, a village or a WhatsApp circle. Your money stays in your own circle.</small></span></label>' +
      '<label><input type="radio" name="type" value="organisation"' + (cur === "organisation" ? " checked" : "") + '><span><b>A registered organisation</b><small>A charity, NGO, society or company with a registration number.</small></span></label>' +
      "</fieldset>";
  };
  var logoField = function (g) {
    return '<label class="g-logo"><span>Logo <small>(optional)</small></span>' +
      '<span class="g-logo-row"><span class="g-logo-prev" data-logo-prev>' + (g && g.logo ? '<img src="' + esc(g.logo) + '" alt="">' : "") + '</span><input type="file" accept="image/*" data-logo-file>' +
      (g && g.logo ? '<button type="button" class="g-link" data-logo-clear>Remove logo</button>' : "") + "</span></label>";
  };
  // Wires the type switch and the logo picker of a form; returns a function that adds the logo to the data.
  var wireOrgForm = function (f) {
    var box = f.querySelector("[data-orgf]"), logo;
    var sync = function (ev) {
      var o = (f.querySelector("input[name=type]:checked") || {}).value === "organisation"; box.hidden = !o; f.classList.toggle("is-org", o);
      // Choosing an organisation on the register form picks "Charity or NGO" as its kind (they can change it).
      var k = f.querySelector('input[name=kind][value="Charity or NGO"]'), first = f.querySelector("input[name=kind]");
      if (ev && k && first) (o ? k : first).checked = true;
    };
    f.querySelectorAll("input[name=type]").forEach(function (r) { r.onchange = sync; }); sync();
    var file = f.querySelector("[data-logo-file]"), prev = f.querySelector("[data-logo-prev]"), clr = f.querySelector("[data-logo-clear]");
    if (file) file.onchange = function () {
      shrink(file.files[0]).then(function (d) { logo = d; prev.innerHTML = '<img src="' + d + '" alt="">'; }).catch(function (e) { file.value = ""; alert(e.message); });
    };
    if (clr) clr.onclick = function () { logo = ""; prev.innerHTML = ""; clr.remove(); };
    return function (data) { delete data.logo; if (logo !== undefined) data.logo = logo; if (data.type !== "organisation") { data.reg_body = ""; data.reg_number = ""; } return data; };
  };
  var STAGES = [["Initiated", "s1", "Planning it"], ["Activated", "s2", "Making it happen"], ["Impact", "s3", "Done, and what it made"]];
  var CUR = { LKR: "Rs ", CAD: "CA$", GBP: "£", EUR: "€", USD: "US$", AUD: "A$", CHF: "CHF ", NOK: "NOK ", INR: "₹" };
  var money = function (n, c) { return (CUR[c] || "Rs ") + Number(n || 0).toLocaleString("en-GB"); };
  var when = function (d) { return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""; };
  var since = function (d) { return d ? new Date(d).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : ""; };
  var account = function () { try { var u = JSON.parse(localStorage.getItem("gotrue.user") || "null"); return u && u.email ? u : null; } catch (e) { return null; } };
  var signinURL = function (next) { return "/members?next=" + encodeURIComponent(next || location.pathname + location.hash); };
  var api = function (path, method, body) {
    return fetch(path, { method: method || "GET", credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { d.status = r.status; return d; }); });
  };
  var turnTitles = function (box) {
    var spans = [].slice.call(box.children), k = 0;
    if (!reduce && spans.length > 1) setInterval(function () { if (document.hidden) return; spans[k].classList.remove("on"); k = (k + 1) % spans.length; spans[k].classList.add("on"); }, 4200);
  };
  // raavanaa.org projects (projects.json + the ones made in the portal), for the projects a group is linked to.
  var PROJ = null;
  var projects = function () {
    if (PROJ) return Promise.resolve(PROJ);
    return Promise.all([fetch("/projects.json").then(function (r) { return r.json(); }).catch(function () { return { projects: [] }; }),
      fetch("/api/projects").then(function (r) { return r.json(); }).catch(function () { return { projects: [] }; })])
      .then(function (a) { PROJ = {}; (a[1].projects || []).concat(a[0].projects || []).forEach(function (p) { if (p && p.slug && !p.hidden) PROJ[p.slug] = p; }); return PROJ; });
  };
  var stageOf = function (status) { return /complete/i.test(status) ? "Impact" : /active/i.test(status) ? "Activated" : "Initiated"; };

  // Sample profiles (SURESH 26 Nov 2026: "How will it look after we create a group, an organisation, a family?"): made-up
  // profiles so the design can be seen, on the draft preview and localhost ONLY, never on raavanaa.org.
  var TEST = /^(draft--|localhost$|127\.0\.0\.1$)/.test(location.hostname) || /--charity-projects-draft\./.test(location.hostname);
  var NOW = new Date().toISOString(), ago = function (d) { return new Date(Date.now() - d * 864e5).toISOString(); };
  var SAMPLE_LOGO = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#2f7f8f"/><path d="M50 22 74 66H26z" fill="#f2c14e"/><rect x="24" y="70" width="52" height="7" rx="2" fill="#fff"/></svg>');
  var SAMPLES = {
    "sample-group": { group: { slug: "sample-group", name: "Jaffna Friends Circle", type: "group", kind: "WhatsApp circle", places: "Toronto, London, Jaffna", members: 40, started: "2019",
        about: "Forty school friends from Jaffna, now in Toronto and London. Each month we put a little into our WhatsApp circle and make a day happen back home.",
        collect: "Each of us puts in 20 dollars a month.", checked: true, status: "listed", followers: 37, since: ago(60) },
      projects: [{ id: 1, slug: "casuarina-beach-day" },
        { id: 2, title: "School shoes for Grade 1", place: "Point Pedro", stage: "Activated", story: "New shoes for 30 children starting school in January.", cost: 60000, collected: 45000, currency: "LKR" },
        { id: 3, title: "Christmas lunch at the children's home", place: "Chavakachcheri", stage: "Impact", day: "25 Dec 2025", story: "Lunch and a small gift for 34 children. Paid in full by the circle.", cost: 85000, collected: 85000, currency: "LKR" }],
      updates: [{ id: 1, body: "Shoes are ordered. We hand them over on 6 December.", by: "Ravi", project: 2, at: ago(2) }, { id: 2, body: "We collected Rs 45,000 this month. Thank you all!", by: "Ravi", at: ago(9) }] },
    "sample-organisation": { group: { slug: "sample-organisation", name: "Vanni Hope Foundation", type: "organisation", kind: "Charity or NGO", places: "Mullaitivu, Kilinochchi, London", members: 25, started: "2015",
        about: "A registered charity that runs after-school classes and school days for children in Mullaitivu and Kilinochchi.", reg_body: "NGO Secretariat", reg_number: "FL 12345",
        website: "https://example.org/", logo: SAMPLE_LOGO, verified: true, checked: true, status: "listed", followers: 112, since: ago(120) },
      projects: [{ id: 1, slug: "prefect-uniforms-for-students-in-valaippadu" },
        { id: 2, title: "After-school maths class", place: "Puthukkudiyiruppu", stage: "Activated", story: "Two evenings a week for 40 children, with a trained teacher.", cost: 240000, collected: 180000, currency: "LKR" },
        { id: 3, title: "Sports day for three schools", place: "Mullaitivu", stage: "Impact", day: "Aug 2026", story: "Races, games and lunch for 210 children.", cost: 150000, collected: 150000, currency: "LKR" }],
      updates: [{ id: 1, body: "The prefect uniforms project is now on Raavanaa. Please vouch for it if you know the school.", by: "Nila", project: 1, at: ago(1) }] },
    "sample-family": { group: { slug: "sample-family", name: "The Rajan Family", type: "group", kind: "Family", places: "Toronto, Jaffna, Chennai", members: 14, started: "2024",
        about: "Three generations of one family. Every year on Amma's remembrance day we give a day of joy to children in her village, in her memory.",
        collect: "Brothers, sisters and cousins put in what they can before the day.", checked: true, status: "listed", followers: 22, since: ago(30) },
      projects: [{ id: 1, title: "Amma's remembrance day 2026", place: "Uduvil", stage: "Initiated", day: "14 Mar 2026", story: "Breakfast, games and a book for every child at the village school, in Amma's memory.", cost: 70000, collected: 20000, currency: "LKR" },
        { id: 2, title: "Amma's remembrance day 2025", place: "Uduvil", stage: "Impact", day: "14 Mar 2025", story: "Lunch and games for 52 children.", cost: 65000, collected: 65000, currency: "LKR" }],
      updates: [{ id: 1, body: "Date fixed for 14 March. Cousins in Chennai will be there on the day.", by: "Meena", project: 1, at: ago(4) }] }
  };

  var m = location.pathname.match(/^\/g\/([^/]+)/);
  if (m) groupPage(decodeURIComponent(m[1])); else listPage();

  /* ---------- /groups ---------- */
  function listPage() {
    var TITLES = ["Small circles, <em>big days.</em>", "Your WhatsApp group, <em>now with a home.</em>", "Your charity, <em>under one roof.</em>", "Collect together, <em>show it openly.</em>"];
    root.innerHTML =
      '<header class="vh">' +
        '<p class="vh-ribbon">Groups and organisations</p>' +
        '<h1 class="vh-title">Together, we make it happen</h1>' +
        '<p class="vh-turn" data-turn>' + TITLES.map(function (t, i) { return '<span class="' + (i ? "" : "on") + '">' + t + "</span>"; }).join("") + "</p>" +
        '<p class="vh-lede">Friends, families, past pupils and villages already collect in their own WhatsApp circles, and registered charities do it every day. Give your group or organisation a page on Raavanaa, show your projects openly, and let people follow you.</p>' +
        '<a class="vh-join" href="#register" data-go-reg><span class="vh-join-ic" aria-hidden="true">+</span><span><b>Create our profile</b><small>free, takes two minutes</small></span><i aria-hidden="true">↓</i></a>' +
      "</header>" +
      '<ol class="g-how">' +
        '<li><b>1</b><span><strong>Create your profile</strong>A group or a registered organisation: name, what you do, where you are.</span></li>' +
        '<li><b>2</b><span><strong>We call you</strong>A Raavanaa volunteer says hello and checks it is real. Organisations show us their certificate.</span></li>' +
        '<li><b>3</b><span><strong>Your page goes live</strong>Add your projects and news. People follow you.</span></li>' +
      "</ol>" +
      '<div class="vf-chips g-filter" data-filter hidden>' + [["all", "Everyone"], ["group", "Groups"], ["organisation", "Organisations"]].map(function (x, i) { return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + !i + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      '<section class="g-list" data-list aria-live="polite"><p class="v-empty">Loading…</p></section>' +
      (TEST ? '<section class="g-samples"><h2>Sample profiles <small>made up, on the draft only</small></h2><div class="g-list">' +
        ["sample-group", "sample-organisation", "sample-family"].map(function (k) { var x = SAMPLES[k].group; x.projects = SAMPLES[k].projects.length; return card(x); }).join("") + "</div></section>" : "") +
      '<section class="v-join g-reg" id="register" aria-labelledby="reg-h" data-reg></section>' +
      '<p class="v-fine">Your group\'s money stays in your own circle: Raavanaa never holds it. Phone numbers are never shown on the page.</p>';
    turnTitles(root.querySelector("[data-turn]"));
    root.querySelector("[data-go-reg]").onclick = function (e) { e.preventDefault(); var t = document.getElementById("register"); t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); t.classList.remove("glow"); void t.offsetWidth; t.classList.add("glow"); };
    drawRegister(root.querySelector("[data-reg]"));
    api("/api/groups").then(function (d) {
      var box = root.querySelector("[data-list]"), list = d.groups || [];
      if (!list.length) { box.innerHTML = '<p class="v-empty">No profiles yet. <a href="#register">Be the first on Raavanaa.</a></p>'; return; }
      var fl = root.querySelector("[data-filter]"), show = function (k) {
        var l = list.filter(function (g) { return k === "all" || g.type === k; });
        box.innerHTML = l.length ? l.map(card).join("") : '<p class="v-empty">None yet.</p>';
        fl.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.f === k)); });
      };
      fl.hidden = false; fl.querySelectorAll("button").forEach(function (b) { b.onclick = function () { show(b.dataset.f); }; }); show("all");
    }).catch(function () { root.querySelector("[data-list]").innerHTML = '<p class="v-empty">Could not load the groups just now.</p>'; });
  }
  function card(g) {
    return '<a class="g-card" href="/g/' + encodeURIComponent(g.slug) + '">' + avatar(g) +
      '<span class="g-card-body"><b>' + esc(g.name) + "</b>" +
        '<small>' + esc(g.kind) + (g.places ? " · " + esc(g.places) : "") + "</small>" +
        '<span class="g-chips">' + badge(g) + (g.checked && !g.verified ? '<i class="g-ok">✓ Checked by Raavanaa</i>' : "") +
          "<i>" + (g.projects || 0) + " project" + (g.projects === 1 ? "" : "s") + "</i><i>" + (g.followers || 0) + " follower" + (g.followers === 1 ? "" : "s") + "</i></span>" +
      "</span></a>";
  }
  function drawRegister(box) {
    var me = account();
    if (!me) {
      box.innerHTML = '<h2 id="reg-h">Create our profile</h2><p>Sign in first (Google or email), so the profile stays yours and only you and the people you add can change it.</p>' +
        '<p><a class="v-btn" href="' + signinURL("/groups#register") + '">Sign in to start</a></p>';
      return;
    }
    box.innerHTML = '<h2 id="reg-h">Create our profile</h2>' +
      '<p>Tell us about you. A Raavanaa volunteer will call the number you give, and then your page goes live.</p>' +
      '<form class="v-form g-form" data-form>' +
        '<p hidden><label>Leave empty <input name="bot-field"></label></p>' +
        typePick("group") +
        '<label><span>Name</span><input name="name" required maxlength="80" placeholder="e.g. Jaffna Friends Circle"></label>' +
        orgFields() + logoField() +
        '<fieldset class="g-kinds"><legend>What kind?</legend>' + KINDS.map(function (k, i) { return '<label class="v-sk"><input type="radio" name="kind" value="' + esc(k) + '"' + (i ? "" : " checked") + "><span>" + esc(k) + "</span></label>"; }).join("") + "</fieldset>" +
        '<label><span>What do you do?</span><textarea name="about" required rows="4" maxlength="1200" placeholder="Who you are, what you have done so far, and what you would like to do next."></textarea></label>' +
        '<div class="v-row">' +
          '<label><span>Where are your members?</span><input name="places" maxlength="160" placeholder="e.g. Toronto, London, Jaffna"></label>' +
          '<label><span>How many members?</span><input name="members" inputmode="numeric" maxlength="6" placeholder="e.g. 40"></label>' +
          '<label><span>Together since</span><input name="started" maxlength="40" placeholder="e.g. 2019"></label>' +
        "</div>" +
        '<label><span>How do you collect money? <small>(optional)</small></span><input name="collect" maxlength="400" placeholder="e.g. Each of us puts in 20 dollars a month"></label>' +
        '<div class="v-row">' +
          '<label><span>Your name</span><input name="contact_name" maxlength="80" value="' + esc((me.user_metadata && me.user_metadata.full_name) || "") + '"></label>' +
          '<label><span>Your WhatsApp number <small>(never shown)</small></span><input name="contact_phone" required maxlength="40" inputmode="tel" placeholder="+94 7… or +1 …"></label>' +
        "</div>" +
        '<button class="v-btn" type="submit">Create our profile →</button>' +
        '<p class="v-msg" data-msg hidden></p>' +
      "</form>";
    var f = box.querySelector("[data-form]"), msg = f.querySelector("[data-msg]"), addLogo = wireOrgForm(f);
    f.onsubmit = function (e) {
      e.preventDefault();
      var data = addLogo(Object.fromEntries(new FormData(f).entries())), btn = f.querySelector("button[type=submit]");
      btn.disabled = true; msg.hidden = false; msg.className = "v-msg"; msg.textContent = "Sending…";
      api("/api/groups", "POST", data).then(function (d) {
        if (d.signin) { location.href = signinURL("/groups#register"); return; }
        if (!d.ok) { btn.disabled = false; msg.className = "v-msg err"; msg.textContent = d.error || "That didn't go through. Please try again."; return; }
        location.href = "/g/" + encodeURIComponent(d.slug) + "?new=1";
      }).catch(function () { btn.disabled = false; msg.className = "v-msg err"; msg.textContent = "That didn't go through. Check your connection and try again."; });
    };
  }

  /* ---------- /g/<name> ---------- */
  var G = null, OPEN = "";
  function groupPage(slug) {
    root.innerHTML = '<p class="v-empty">Loading…</p>';
    if (TEST && SAMPLES[slug]) {
      projects().then(function () { var x = JSON.parse(JSON.stringify(SAMPLES[slug])); x.ok = true; x.sample = true; G = x; draw(); });
      return;
    }
    Promise.all([api("/api/groups/" + encodeURIComponent(slug)), projects()]).then(function (a) {
      if (!a[0].ok) {
        root.innerHTML = '<header class="vh"><p class="vh-ribbon">Community groups</p><h1 class="vh-title">Group not found</h1><p class="vh-lede">This group is not on Raavanaa, or it is still waiting for the team\'s call.' + (account() ? "" : ' If it is your group, <a href="' + signinURL() + '">sign in</a> to see it.') + '</p><a class="v-btn" href="/groups">See all groups</a></header>';
        return;
      }
      G = a[0]; draw();
    }).catch(function () { root.innerHTML = '<p class="v-empty">Could not load this group just now. Please try again.</p>'; });
  }
  function draw() {
    var g = G.group, admin = g.admin, fresh = /[?&]new=1/.test(location.search);
    document.title = g.name + " · Raavanaa";
    var byStage = { Initiated: [], Activated: [], Impact: [] };
    G.projects.forEach(function (p) {
      var rp = p.slug && PROJ[p.slug];
      if (p.slug && !rp) return;
      byStage[rp ? stageOf(rp.status) : p.stage].push(p);
    });
    var total = G.projects.length;
    var share = location.origin + "/g/" + encodeURIComponent(g.slug);
    root.innerHTML =
      (G.sample ? '<p class="g-wait g-sample"><b>Sample profile.</b> Made up to show how a ' + (g.kind === "Family" ? "family" : isOrg(g) ? "organisation" : "group") + " page looks once it is created. It shows only on the draft, never on raavanaa.org.</p>" : "") +
      (g.status !== "listed" ? '<p class="g-wait' + (fresh ? " fresh" : "") + '">' + (fresh ? "<b>Thank you! Your group is registered.</b> " : "") +
        (g.status === "hidden" ? "This page is taken off Raavanaa. Please <a href=\"/contact\">contact us</a>." : "Only you can see this page for now. A Raavanaa volunteer will call you soon, and then it goes live for everyone. You can already add your projects below.") + "</p>" : "") +
      '<header class="g-hero">' +
        avatar(g, true) + badge(g, true) +
        '<p class="vh-ribbon">' + esc(g.kind || "Community group") + "</p>" +
        '<h1 class="vh-title">' + esc(g.name) + "</h1>" +
        (g.places ? '<p class="g-places">' + esc(g.places) + "</p>" : "") +
        (isOrg(g) ? '<p class="g-reg-line">Registered with ' + esc(g.reg_body) + " · No. " + esc(g.reg_number) + (g.verified ? " · certificate seen by Raavanaa" : " · not yet checked by Raavanaa") + "</p>" : "") +
        (g.website ? '<p class="g-web"><a href="' + esc(g.website) + '" target="_blank" rel="noopener nofollow">' + esc(g.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + " ↗</a></p>" : "") +
        (g.checked && !g.verified ? '<p class="g-ok big">✓ Checked by Raavanaa</p>' : "") +
        '<div class="vh-stats">' +
          (g.members ? "<span><b>" + g.members + "</b> members</span>" : "") +
          "<span><b>" + total + "</b> project" + (total === 1 ? "" : "s") + "</span>" +
          '<span><b data-fcount>' + g.followers + "</b> follower" + (g.followers === 1 ? "" : "s") + "</span>" +
          (g.started ? "<span>Together since <b>" + esc(g.started) + "</b></span>" : "") +
        "</div>" +
        (g.status !== "listed" ? "" : '<div class="g-acts">' +
          '<button type="button" class="v-btn g-follow' + (g.following ? " on" : "") + '" data-follow aria-pressed="' + !!g.following + '">' + (g.following ? "✓ Following" : "+ Follow " + (isOrg(g) ? "this organisation" : "this group")) + "</button>" +
          '<a class="v-btn ghost" href="https://wa.me/?text=' + encodeURIComponent(g.name + " on Raavanaa: see our projects and follow us " + share) + '" target="_blank" rel="noopener">Share on WhatsApp</a>' +
        "</div>" +
        '<p class="g-fnote" data-fnote>' + (g.following ? "You will find their news in My account." : "Follow to see their news and projects in My account.") + "</p>") +
      "</header>" +
      '<section class="g-about"><h2>About us</h2><p>' + esc(g.about).replace(/\n/g, "<br>") + "</p>" +
        (isOrg(g) ? '<div class="g-money"><b>Gifts to ' + esc(g.name) + " go to " + esc(g.name) + " directly.</b> " + (g.collect ? esc(g.collect) + " " : "") + "Raavanaa never holds the money. The amounts on this page are reported by the organisation.</div>"
          : '<div class="g-money"><b>Our money stays in our own circle.</b> ' + (g.collect ? esc(g.collect) + " " : "") + "Raavanaa never holds it. The amounts on this page are reported by the group.</div>") +
      "</section>" +
      (admin ? manageHTML() : "") +
      '<section class="g-projs"><h2>Our projects</h2>' +
        (total ? STAGES.map(function (s) {
          var list = byStage[s[0]];
          return '<div class="g-stage ' + s[1] + '"><h3><span class="stage-dot"></span>' + s[0] + " <small>" + s[2] + " · " + list.length + "</small></h3>" +
            (list.length ? list.map(projCard).join("") : '<p class="g-none">Nothing here yet.</p>') + "</div>";
        }).join("") : '<p class="g-none">No projects yet.' + (admin ? " Add your first one in Manage our group above." : "") + "</p>") +
      "</section>" +
      '<section class="g-news"><h2>Latest news</h2>' +
        (G.updates.length ? '<ol class="g-feed">' + G.updates.map(function (u) {
          var p = u.project && G.projects.filter(function (x) { return x.id === u.project; })[0];
          return '<li><p>' + esc(u.body).replace(/\n/g, "<br>") + "</p><small>" + esc(u.by) + " · " + when(u.at) + (p ? " · " + esc(p.title) : "") +
            (admin ? ' · <button type="button" class="g-link" data-unpost="' + u.id + '">Remove</button>' : "") + "</small></li>";
        }).join("") + "</ol>" : '<p class="g-none">No news yet.</p>') +
      "</section>" +
      '<p class="g-back"><a href="/groups">← All groups</a> · <a href="/projects">All projects on Raavanaa</a></p>';
    wire();
  }
  function projCard(p) {
    var rp = p.slug && PROJ[p.slug], admin = G.group.admin;
    if (rp) {
      return '<a class="g-proj raav" href="/projects/' + encodeURIComponent(rp.slug) + '">' +
        (rp.cover ? '<img src="' + esc(rp.cover) + '" alt="" loading="lazy">' : "") +
        '<span><b>' + esc(rp.title) + "</b><small>" + esc(rp.location || rp.city || "") + '</small><i class="g-tag">On Raavanaa · see the project →</i></span></a>';
    }
    var pct = p.cost ? Math.min(100, Math.round(100 * p.collected / p.cost)) : 0;
    return '<article class="g-proj" id="gp-' + p.id + '">' +
      '<span><b>' + esc(p.title) + "</b><small>" + [esc(p.place), esc(p.day)].filter(Boolean).join(" · ") + "</small>" +
      (p.story ? '<p>' + esc(p.story).replace(/\n/g, "<br>") + "</p>" : "") +
      (p.cost || p.collected ? '<span class="g-bar"><span style="width:' + pct + '%"></span></span><small class="g-amt"><b>' + money(p.collected, p.currency) + "</b> collected" + (p.cost ? " of " + money(p.cost, p.currency) : "") + " · reported by the group</small>" : "") +
      (admin ? '<span class="g-pedit"><button type="button" class="g-link" data-pedit="' + p.id + '">Edit or move to the next stage</button></span>' : "") +
      "</span></article>";
  }
  function manageHTML() {
    var g = G.group, mg = G.manage || {}, own = G.projects.filter(function (p) { return !p.slug; });
    var edit = OPEN.indexOf("p:") === 0 ? own.filter(function (p) { return "p:" + p.id === OPEN; })[0] : null;
    var tab = function (k, t) { return '<button type="button" data-tab="' + k + '" aria-pressed="' + (OPEN === k || (k === "proj" && edit) ? "true" : "false") + '">' + t + "</button>"; };
    var body = "";
    if (OPEN === "news") body = '<form data-news class="g-mform"><label><span>Your news</span><textarea name="body" rows="3" maxlength="800" required placeholder="e.g. We collected Rs 45,000 this month. The day is fixed for 6 December."></textarea></label>' +
      (G.projects.length ? '<label><span>About which project? <small>(optional)</small></span><select name="project_id"><option value="">None</option>' + G.projects.map(function (p) { var rp = p.slug && PROJ[p.slug]; return '<option value="' + p.id + '">' + esc(rp ? rp.title : p.title) + "</option>"; }).join("") + "</select></label>" : "") +
      '<button class="v-btn" type="submit">Post the news</button></form>';
    if (OPEN === "proj" || edit) {
      var p = edit || { stage: "Initiated", currency: "LKR" };
      body = '<form data-proj class="g-mform">' + (edit ? '<input type="hidden" name="id" value="' + p.id + '">' : "") +
        '<label><span>Project name</span><input name="title" required maxlength="120" value="' + esc(p.title || "") + '" placeholder="e.g. School shoes for Grade 1"></label>' +
        '<fieldset class="g-kinds"><legend>Where is it now?</legend>' + STAGES.map(function (s) { return '<label class="v-sk ' + s[1] + '"><input type="radio" name="stage" value="' + s[0] + '"' + (p.stage === s[0] ? " checked" : "") + "><span>" + s[0] + " <small>" + s[2] + "</small></span></label>"; }).join("") + "</fieldset>" +
        '<div class="v-row"><label><span>Place</span><input name="place" maxlength="80" value="' + esc(p.place || "") + '" placeholder="Village or town"></label>' +
        '<label><span>Day <small>(if fixed)</small></span><input name="day" maxlength="40" value="' + esc(p.day || "") + '" placeholder="e.g. 6 Dec 2026"></label></div>' +
        '<label><span>What is it? <small>(no children\'s names, please)</small></span><textarea name="story" rows="3" maxlength="2000">' + esc(p.story || "") + "</textarea></label>" +
        '<div class="v-row"><label><span>It costs</span><input name="cost" inputmode="numeric" value="' + (p.cost || "") + '"></label>' +
        '<label><span>Collected so far</span><input name="collected" inputmode="numeric" value="' + (p.collected || "") + '"></label>' +
        '<label><span>Currency</span><select name="currency">' + Object.keys(CUR).map(function (c) { return "<option" + (p.currency === c ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></label></div>" +
        '<p class="g-row"><button class="v-btn" type="submit">' + (edit ? "Save" : "Add the project") + "</button>" + (edit ? '<button type="button" class="g-link" data-premove="' + p.id + '">Remove this project</button>' : "") + "</p></form>";
    }
    if (OPEN === "about") body = '<form data-about class="g-mform">' +
      typePick(g.type) + (isOrg(g) ? "" : '<p class="g-small">Has your group registered? Choose <b>A registered organisation</b>: your page, projects and followers stay the same.</p>') +
      '<label><span>Name</span><input name="name" required maxlength="80" value="' + esc(g.name) + '"></label>' +
      orgFields(g) + logoField(g) +
      '<label><span>Kind of group</span><select name="kind">' + KINDS.map(function (k) { return "<option" + (g.kind === k ? " selected" : "") + ">" + esc(k) + "</option>"; }).join("") + "</select></label>" +
      '<label><span>About us</span><textarea name="about" rows="4" maxlength="1200">' + esc(g.about) + "</textarea></label>" +
      '<div class="v-row"><label><span>Where are your members?</span><input name="places" maxlength="160" value="' + esc(g.places) + '"></label>' +
      '<label><span>Members</span><input name="members" inputmode="numeric" value="' + (g.members || "") + '"></label>' +
      '<label><span>Together since</span><input name="started" maxlength="40" value="' + esc(g.started) + '"></label></div>' +
      '<label><span>How do you collect money?</span><input name="collect" maxlength="400" value="' + esc(g.collect) + '"></label>' +
      '<div class="v-row"><label><span>Contact name <small>(never shown)</small></span><input name="contact_name" maxlength="80" value="' + esc(mg.contact_name || "") + '"></label>' +
      '<label><span>WhatsApp <small>(never shown)</small></span><input name="contact_phone" maxlength="40" value="' + esc(mg.contact_phone || "") + '"></label></div>' +
      '<label><span>Others who can manage this page <small>(their sign-in emails, one per line)</small></span><textarea name="admins" rows="2">' + esc((mg.admins || []).join("\n")) + "</textarea></label>" +
      '<button class="v-btn" type="submit">Save</button></form>';
    return '<section class="g-manage" id="manage"><h2>Manage our page <small>only you and your group\'s admins see this</small></h2>' +
      '<div class="vf-chips g-tabs">' + tab("news", "Post news") + tab("proj", "Add a project") + tab("about", "Edit our page and logo") + "</div>" +
      body + '<p class="v-msg err" data-merr hidden></p>' +
      '<p class="g-need">Need help from more people for a project? <a href="/initiate?way=submit&by=group&gname=' + encodeURIComponent(g.name) + '">Submit it as a need on Raavanaa</a>. Once it is approved, the team links it to this page.</p>' +
      "</section>";
  }
  function wire() {
    var fbtn = root.querySelector("[data-follow]");
    if (fbtn && G.sample) { fbtn.onclick = function () { fbtn.textContent = "✓ Following (sample, nothing saved)"; }; }
    else if (fbtn) fbtn.onclick = function () {
      if (!account()) { location.href = signinURL(); return; }
      var on = fbtn.getAttribute("aria-pressed") !== "true";
      fbtn.disabled = true;
      api("/api/groups/" + encodeURIComponent(G.group.slug) + "/follow", "POST", { on: on }).then(function (d) {
        fbtn.disabled = false;
        if (d.signin) { location.href = signinURL(); return; }
        if (!d.ok) return;
        G = d; draw();
      }).catch(function () { fbtn.disabled = false; });
    };
    root.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { OPEN = OPEN === b.dataset.tab ? "" : b.dataset.tab; draw(); jump(); }; });
    root.querySelectorAll("[data-pedit]").forEach(function (b) { b.onclick = function () { OPEN = "p:" + b.dataset.pedit; draw(); jump(); }; });
    var send = function (path, method, data) {
      var err = root.querySelector("[data-merr]");
      return api("/api/groups/" + encodeURIComponent(G.group.slug) + path, method, data).then(function (d) {
        if (!d.ok) { root.querySelectorAll(".g-mform button[type=submit]").forEach(function (b) { b.disabled = false; }); if (err) { err.hidden = false; err.textContent = d.error || "That didn't go through. Please try again."; } return; }
        G = d; OPEN = ""; draw();
      }).catch(function () { if (err) { err.hidden = false; err.textContent = "That didn't go through. Check your connection and try again."; } });
    };
    var form = function (sel, fn) { var f = root.querySelector(sel); if (f) f.onsubmit = function (e) { e.preventDefault(); f.querySelector("button[type=submit]").disabled = true; fn(Object.fromEntries(new FormData(f).entries())); }; };
    form("[data-news]", function (d) { send("/updates", "POST", d); });
    form("[data-proj]", function (d) { send("/projects", "POST", d); });
    var af = root.querySelector("[data-about]"), addLogo = af ? wireOrgForm(af) : null;
    form("[data-about]", function (d) { d.admins = String(d.admins || "").split(/[\s,;]+/).filter(Boolean); send("", "PATCH", addLogo(d)); });
    root.querySelectorAll("[data-premove]").forEach(function (b) { b.onclick = function () { send("/projects", "POST", { remove: Number(b.dataset.premove) }); }; });
    root.querySelectorAll("[data-unpost]").forEach(function (b) { b.onclick = function () { send("/updates", "POST", { remove: Number(b.dataset.unpost) }); }; });
  }
  function jump() { var mg = document.getElementById("manage"); if (mg) mg.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
})();
