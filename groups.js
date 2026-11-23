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
  var KINDS = ["WhatsApp circle", "Friends", "Family", "Past pupils", "Village or society", "Temple or church", "Youth or sports club", "Workplace", "Other"];
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

  var m = location.pathname.match(/^\/g\/([^/]+)/);
  if (m) groupPage(decodeURIComponent(m[1])); else listPage();

  /* ---------- /groups ---------- */
  function listPage() {
    var TITLES = ["Small circles, <em>big days.</em>", "Your WhatsApp group, <em>now with a home.</em>", "Collect together, <em>show it openly.</em>"];
    root.innerHTML =
      '<header class="vh">' +
        '<p class="vh-ribbon">Community groups</p>' +
        '<h1 class="vh-title">Groups that make it happen</h1>' +
        '<p class="vh-turn" data-turn>' + TITLES.map(function (t, i) { return '<span class="' + (i ? "" : "on") + '">' + t + "</span>"; }).join("") + "</p>" +
        '<p class="vh-lede">Friends, families, past pupils and villages already collect in their own WhatsApp circles and make days of joy happen. Give your group a page on Raavanaa, show your projects openly, and let people follow you.</p>' +
        '<a class="vh-join" href="#register" data-go-reg><span class="vh-join-ic" aria-hidden="true">+</span><span><b>Register our group</b><small>free, takes two minutes</small></span><i aria-hidden="true">↓</i></a>' +
      "</header>" +
      '<ol class="g-how">' +
        '<li><b>1</b><span><strong>Register your group</strong>Name, what you do, where you are.</span></li>' +
        '<li><b>2</b><span><strong>We call you</strong>A Raavanaa volunteer says hello and checks it is real.</span></li>' +
        '<li><b>3</b><span><strong>Your page goes live</strong>Add your projects and news. People follow you.</span></li>' +
      "</ol>" +
      '<section class="g-list" data-list aria-live="polite"><p class="v-empty">Loading…</p></section>' +
      '<section class="v-join g-reg" id="register" aria-labelledby="reg-h" data-reg></section>' +
      '<p class="v-fine">Your group\'s money stays in your own circle: Raavanaa never holds it. Phone numbers are never shown on the page.</p>';
    turnTitles(root.querySelector("[data-turn]"));
    root.querySelector("[data-go-reg]").onclick = function (e) { e.preventDefault(); var t = document.getElementById("register"); t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); t.classList.remove("glow"); void t.offsetWidth; t.classList.add("glow"); };
    drawRegister(root.querySelector("[data-reg]"));
    api("/api/groups").then(function (d) {
      var box = root.querySelector("[data-list]"), list = d.groups || [];
      if (!list.length) { box.innerHTML = '<p class="v-empty">No groups yet. <a href="#register">Be the first group on Raavanaa.</a></p>'; return; }
      box.innerHTML = list.map(card).join("");
    }).catch(function () { root.querySelector("[data-list]").innerHTML = '<p class="v-empty">Could not load the groups just now.</p>'; });
  }
  function card(g) {
    return '<a class="g-card" href="/g/' + encodeURIComponent(g.slug) + '">' +
      '<span class="g-av" style="--t:' + tone(g.name) + '">' + esc(initials(g.name)) + "</span>" +
      '<span class="g-card-body"><b>' + esc(g.name) + "</b>" +
        '<small>' + esc(g.kind) + (g.places ? " · " + esc(g.places) : "") + "</small>" +
        '<span class="g-chips">' + (g.checked ? '<i class="g-ok">✓ Checked by Raavanaa</i>' : "") +
          "<i>" + (g.projects || 0) + " project" + (g.projects === 1 ? "" : "s") + "</i><i>" + (g.followers || 0) + " follower" + (g.followers === 1 ? "" : "s") + "</i></span>" +
      "</span></a>";
  }
  function drawRegister(box) {
    var me = account();
    if (!me) {
      box.innerHTML = '<h2 id="reg-h">Register our group</h2><p>Sign in first (Google or email), so the group stays yours and only you and the people you add can change its page.</p>' +
        '<p><a class="v-btn" href="' + signinURL("/groups#register") + '">Sign in to register</a></p>';
      return;
    }
    box.innerHTML = '<h2 id="reg-h">Register our group</h2>' +
      '<p>Tell us about your group. A Raavanaa volunteer will call the number you give, and then your page goes live.</p>' +
      '<form class="v-form g-form" data-form>' +
        '<p hidden><label>Leave empty <input name="bot-field"></label></p>' +
        '<label><span>Group name</span><input name="name" required maxlength="80" placeholder="e.g. Jaffna Friends Circle"></label>' +
        '<fieldset class="g-kinds"><legend>What kind of group?</legend>' + KINDS.map(function (k, i) { return '<label class="v-sk"><input type="radio" name="kind" value="' + esc(k) + '"' + (i ? "" : " checked") + "><span>" + esc(k) + "</span></label>"; }).join("") + "</fieldset>" +
        '<label><span>What does your group do?</span><textarea name="about" required rows="4" maxlength="1200" placeholder="Who you are, what you have done so far, and what you would like to do next."></textarea></label>' +
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
        '<button class="v-btn" type="submit">Register our group →</button>' +
        '<p class="v-msg" data-msg hidden></p>' +
      "</form>";
    var f = box.querySelector("[data-form]"), msg = f.querySelector("[data-msg]");
    f.onsubmit = function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(f).entries()), btn = f.querySelector("button");
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
      (g.status !== "listed" ? '<p class="g-wait' + (fresh ? " fresh" : "") + '">' + (fresh ? "<b>Thank you! Your group is registered.</b> " : "") +
        (g.status === "hidden" ? "This page is taken off Raavanaa. Please <a href=\"/contact\">contact us</a>." : "Only you can see this page for now. A Raavanaa volunteer will call you soon, and then it goes live for everyone. You can already add your projects below.") + "</p>" : "") +
      '<header class="g-hero">' +
        '<span class="g-av big" style="--t:' + tone(g.name) + '">' + esc(initials(g.name)) + "</span>" +
        '<p class="vh-ribbon">' + esc(g.kind || "Community group") + "</p>" +
        '<h1 class="vh-title">' + esc(g.name) + "</h1>" +
        (g.places ? '<p class="g-places">' + esc(g.places) + "</p>" : "") +
        (g.checked ? '<p class="g-ok big">✓ Checked by Raavanaa</p>' : "") +
        '<div class="vh-stats">' +
          (g.members ? "<span><b>" + g.members + "</b> members</span>" : "") +
          "<span><b>" + total + "</b> project" + (total === 1 ? "" : "s") + "</span>" +
          '<span><b data-fcount>' + g.followers + "</b> follower" + (g.followers === 1 ? "" : "s") + "</span>" +
          (g.started ? "<span>Together since <b>" + esc(g.started) + "</b></span>" : "") +
        "</div>" +
        (g.status !== "listed" ? "" : '<div class="g-acts">' +
          '<button type="button" class="v-btn g-follow' + (g.following ? " on" : "") + '" data-follow aria-pressed="' + !!g.following + '">' + (g.following ? "✓ Following" : "+ Follow this group") + "</button>" +
          '<a class="v-btn ghost" href="https://wa.me/?text=' + encodeURIComponent(g.name + " on Raavanaa: see our projects and follow us " + share) + '" target="_blank" rel="noopener">Share on WhatsApp</a>' +
        "</div>" +
        '<p class="g-fnote" data-fnote>' + (g.following ? "You will find this group's news in My account." : "Follow to see their news and projects in My account.") + "</p>") +
      "</header>" +
      '<section class="g-about"><h2>About us</h2><p>' + esc(g.about).replace(/\n/g, "<br>") + "</p>" +
        '<div class="g-money"><b>Our money stays in our own circle.</b> ' + (g.collect ? esc(g.collect) + " " : "") + "Raavanaa never holds it. The amounts on this page are reported by the group.</div>" +
      "</section>" +
      (admin ? manageHTML() : "") +
      '<section class="g-projs"><h2>Our projects</h2>' +
        (total ? STAGES.map(function (s) {
          var list = byStage[s[0]];
          return '<div class="g-stage ' + s[1] + '"><h3><span class="stage-dot"></span>' + s[0] + " <small>" + s[2] + " · " + list.length + "</small></h3>" +
            (list.length ? list.map(projCard).join("") : '<p class="g-none">Nothing here yet.</p>') + "</div>";
        }).join("") : '<p class="g-none">No projects yet.' + (admin ? " Add your first one in Manage our group above." : "") + "</p>") +
      "</section>" +
      '<section class="g-news"><h2>News from the group</h2>' +
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
      '<label><span>Group name</span><input name="name" required maxlength="80" value="' + esc(g.name) + '"></label>' +
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
    return '<section class="g-manage" id="manage"><h2>Manage our group <small>only you and your group\'s admins see this</small></h2>' +
      '<div class="vf-chips g-tabs">' + tab("news", "Post news") + tab("proj", "Add a project") + tab("about", "Edit our page") + "</div>" +
      body + '<p class="v-msg err" data-merr hidden></p>' +
      '<p class="g-need">Need help from more people for a project? <a href="/initiate?way=submit&by=group&gname=' + encodeURIComponent(g.name) + '">Submit it as a need on Raavanaa</a>. Once it is approved, the team links it to this page.</p>' +
      "</section>";
  }
  function wire() {
    var fbtn = root.querySelector("[data-follow]");
    if (fbtn) fbtn.onclick = function () {
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
        if (!d.ok) { if (err) { err.hidden = false; err.textContent = d.error || "That didn't go through. Please try again."; } return; }
        G = d; OPEN = ""; draw();
      }).catch(function () { if (err) { err.hidden = false; err.textContent = "That didn't go through. Check your connection and try again."; } });
    };
    var form = function (sel, fn) { var f = root.querySelector(sel); if (f) f.onsubmit = function (e) { e.preventDefault(); f.querySelector("button[type=submit]").disabled = true; fn(Object.fromEntries(new FormData(f).entries())); }; };
    form("[data-news]", function (d) { send("/updates", "POST", d); });
    form("[data-proj]", function (d) { send("/projects", "POST", d); });
    form("[data-about]", function (d) { d.admins = String(d.admins || "").split(/[\s,;]+/).filter(Boolean); send("", "PATCH", d); });
    root.querySelectorAll("[data-premove]").forEach(function (b) { b.onclick = function () { send("/projects", "POST", { remove: Number(b.dataset.premove) }); }; });
    root.querySelectorAll("[data-unpost]").forEach(function (b) { b.onclick = function () { send("/updates", "POST", { remove: Number(b.dataset.unpost) }); }; });
  }
  function jump() { var mg = document.getElementById("manage"); if (mg) mg.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
})();
