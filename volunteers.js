/* Our volunteers (/volunteers), SURESH 17 Nov 2026: "for now just have all the volunteers under a volunteers page".
   One community list: volunteers, members and Champions together, each with small badges, because one person is often
   all three. Shows only what people agreed to share: first name, town and skills. Never a phone or email.
   Data: GET /api/volunteers. Later (to-do 18): a dashboard where everyone's work sits under one roof, open to comments. */
(function () {
  var root = document.getElementById("vols");
  if (!root) return;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BADGE = { Champion: "vb-champ", Member: "vb-member", Volunteer: "vb-vol" };
  var BADGE_SAY = { Champion: "Visits and checks projects near them", Member: "Has a members account", Volunteer: "Gives time or a skill" };
  var TONES = ["#1f7a47", "#b97a06", "#c8381e", "#2f7f8f", "#7a4fa0", "#8a5c12"];
  var tone = function (n) { var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return TONES[h % TONES.length]; };
  var initials = function (n) { return n.split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase(); };
  var SKILLS = window.RAAV_SKILLS || [];
  var TITLES = ["Hands that <em>make it happen.</em>", "Every smile <em>has a helper.</em>", "One community, <em>many hands.</em>"];

  root.innerHTML =
    '<header class="vh">' +
      '<p class="vh-ribbon">Our community</p>' +
      '<h1 class="vh-title">Our volunteers</h1>' +
      '<p class="vh-turn" data-turn>' + TITLES.map(function (t, i) { return '<span class="' + (i ? "" : "on") + '">' + t + "</span>"; }).join("") + "</p>" +
      '<p class="vh-lede">Everyone here gives an hour, a skill or a visit. Many are members too, so we keep one list for all of us.</p>' +
      '<a class="vh-join" href="#join" data-go-join><span class="vh-join-ic" aria-hidden="true">+</span><span><b>I want to join</b><small>the Raavanaa community</small></span><i aria-hidden="true">↓</i></a>' +
      '<div class="vh-stats" data-stats aria-live="polite"></div>' +
    "</header>" +
    '<div class="vf" data-filters hidden>' +
      '<div class="vf-chips" role="group" aria-label="Show">' +
        ["All", "Champion", "Member", "Volunteer"].map(function (k, i) { return '<button type="button" data-f="' + k + '" aria-pressed="' + (i ? "false" : "true") + '">' + (k === "All" ? "Everyone" : k + "s") + "</button>"; }).join("") +
      "</div>" +
      '<label class="vf-skill"><span>Skill</span><select data-skill><option value="">Any skill</option></select></label>' +
    "</div>" +
    '<section class="vg" data-list aria-live="polite"><p class="v-empty">Loading…</p></section>' +
    '<p class="v-key">' + ["Champion", "Member", "Volunteer"].map(function (b) { return '<span class="vb ' + BADGE[b] + '">' + b + "</span> " + BADGE_SAY[b]; }).join(" &nbsp;·&nbsp; ") + "</p>" +
    '<section class="v-join" id="join" aria-labelledby="join-h">' +
      '<h2 id="join-h">Join them</h2>' +
      '<p>Give an hour, share a skill, or be the trusted person near a project. Pick what you can bring and a volunteer will reply to you.</p>' +
      '<p class="v-member">Already a member? <a href="/members?next=/volunteers">Sign in first</a> and your <span class="vb vb-member">Member</span> badge shows next to your name.</p>' +
      '<form class="v-form" name="volunteer" data-join>' +
        '<input type="hidden" name="form-name" value="volunteer"><p hidden><label>Leave empty <input name="bot-field"></label></p>' +
        '<input type="hidden" name="help[]" value="Joined from the Volunteers page">' +
        '<fieldset class="v-skills"><legend>What can you bring? <small>(pick any)</small></legend>' + SKILLS.map(function (k, i) { return '<label class="v-sk' + (i >= 6 ? " vx" : "") + '"><input type="checkbox" name="skills[]" value="' + esc(k) + '"><span>' + esc(k) + "</span></label>"; }).join("") +
          (SKILLS.length > 6 ? '<button type="button" class="v-sk-more" data-more aria-expanded="false">See all ' + SKILLS.length + " skills ▾</button>" : "") + "</fieldset>" +
        '<div class="v-row">' +
          '<label><span>Your name</span><input name="name" required autocomplete="name"></label>' +
          '<label><span>WhatsApp or email</span><input name="email" required placeholder="+94 7... or you@example.com"></label>' +
          '<label><span>Town and country</span><input name="city" autocomplete="address-level2" placeholder="e.g. Jaffna, or Toronto"></label>' +
        "</div>" +
        '<label class="v-show"><input type="checkbox" name="show" value="yes"><span>Show me on this page <small>(first name, town and skills only)</small></span></label>' +
        '<button class="v-btn" type="submit">I want to join →</button>' +
        '<p class="v-msg" data-msg hidden></p>' +
      "</form>" +
      '<p class="v-fine">Phone numbers and emails are never shown; a volunteer uses them only to reply to you. To be taken off, <a href="/contact">tell us</a>.</p>' +
    "</section>";

  var turn = root.querySelector("[data-turn]"), spans = [].slice.call(turn.children), k = 0;
  if (!reduce) setInterval(function () { if (document.hidden) return; spans[k].classList.remove("on"); k = (k + 1) % spans.length; spans[k].classList.add("on"); }, 4200);

  var ALL = [], F = "All", SKILL = "";
  var card = function (p) {
    var more = p.skills.length > 3 ? '<li class="vs-more">+' + (p.skills.length - 3) + "</li>" : "";
    return '<article class="vc">' +
      '<span class="vc-av" style="--t:' + tone(p.name) + '" aria-hidden="true">' + esc(initials(p.name)) + "</span>" +
      '<div class="vc-body"><h3>' + esc(p.name) + "</h3>" +
        (p.town ? '<p class="vc-town">' + esc(p.town) + "</p>" : "") +
        '<p class="vc-badges">' + p.badges.map(function (b) { return '<span class="vb ' + (BADGE[b] || "") + '" title="' + esc(BADGE_SAY[b] || "") + '">' + esc(b) + "</span>"; }).join("") + "</p>" +
        (p.skills.length ? '<ul class="vc-skills">' + p.skills.slice(0, 3).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + more + "</ul>" : "") +
      "</div></article>";
  };
  function draw() {
    var list = ALL.filter(function (p) { return (F === "All" || p.badges.indexOf(F) >= 0) && (!SKILL || p.skills.indexOf(SKILL) >= 0); });
    root.querySelector("[data-list]").innerHTML = list.length ? list.map(card).join("")
      : ALL.length ? '<p class="v-empty">Nobody here yet for that. <a href="#join">Be the first →</a></p>'
      : '<p class="v-empty"><b>Be the first name on this page.</b> <a href="#join">Join below</a>, tick “Show me on this page”, and you will appear here.</p>';
    [].slice.call(root.querySelectorAll("[data-f]")).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.f === F)); });
  }
  function load() { return fetch("/api/volunteers", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) {
    ALL = (d && d.people) || [];
    var towns = {}, champs = 0;
    ALL.forEach(function (p) { if (p.town) towns[p.town.toLowerCase()] = 1; if (p.badges.indexOf("Champion") >= 0) champs++; });
    var n = Object.keys(towns).length;
    root.querySelector("[data-stats]").innerHTML = ALL.length
      ? '<span><b>' + ALL.length + "</b> " + (ALL.length === 1 ? "person" : "people") + "</span>" + (n ? '<span><b>' + n + "</b> " + (n === 1 ? "town" : "towns") + "</span>" : "") + (champs ? '<span><b>' + champs + "</b> Champion" + (champs === 1 ? "" : "s") + "</span>" : "")
      : "";
    var skills = Object.keys((d && d.skills) || {}).sort(function (a, b) { return d.skills[b] - d.skills[a]; });
    root.querySelector("[data-skill]").innerHTML = '<option value="">Any skill</option>' + skills.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + " (" + d.skills[s] + ")</option>"; }).join("");
    root.querySelector("[data-filters]").hidden = ALL.length < 2;
    draw();
  }); }
  load();
  // Join right here (SURESH 17 Nov 2026: send this link to people so they can join directly).
  // Sent to the Netlify form "volunteer" (a copy for the team) and to /api/volunteers (this list).
  var jf = root.querySelector("[data-join]"), more = root.querySelector("[data-more]");
  if (more) more.addEventListener("click", function () { var box = more.parentNode, open = !box.classList.contains("open"); box.classList.toggle("open", open); more.setAttribute("aria-expanded", String(open)); more.textContent = open ? "Show fewer ▴" : "See all " + SKILLS.length + " skills ▾"; box.appendChild(more); });
  jf.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = jf.querySelector("button[type=submit]"), msg = jf.querySelector("[data-msg]"), fd = new FormData(jf);
    var say = function (t, ok) { msg.hidden = false; msg.className = "v-msg " + (ok ? "ok" : "err"); msg.innerHTML = t; };
    if (!fd.getAll("skills[]").length) { say("Pick at least one thing you can bring."); return; }
    btn.disabled = true;
    var data = { source: "volunteers" }; fd.forEach(function (v, k) { var kk = k.replace("[]", ""); if (/\[\]$/.test(k)) (data[kk] = data[kk] || []).push(v); else data[kk] = v; });
    Promise.all([
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fd).toString() }).catch(function () { return null; }),
      fetch("/api/volunteers", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(function () { return null; })
    ]).then(function (res) {
      if (!(res[0] && res[0].ok) && !(res[1] && res[1].ok)) throw 0;
      [].slice.call(jf.querySelectorAll("input,button")).forEach(function (x) { x.disabled = true; });
      say(data.show === "yes" ? "Welcome to Raavanaa! You are on the list above, and a volunteer will be in touch soon." : "Welcome to Raavanaa! A volunteer will be in touch soon.", true);
      if (data.show === "yes") load();
    }).catch(function () { btn.disabled = false; say("That did not send. Please try again."); });
  });
  // The big "I want to join" button at the top (SURESH 17 Nov 2026): one tap glides down to the form.
  root.querySelector("[data-go-join]").addEventListener("click", function (e) {
    e.preventDefault();
    var j = document.getElementById("join");
    j.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    j.classList.remove("v-flash"); void j.offsetWidth; j.classList.add("v-flash");
    try { history.replaceState(null, "", "#join"); } catch (x) { /* ignore */ }
  });
  root.addEventListener("click", function (e) { var b = e.target.closest("[data-f]"); if (b) { F = b.dataset.f; draw(); } });
  root.querySelector("[data-skill]").addEventListener("change", function (e) { SKILL = e.target.value; draw(); });
})();
