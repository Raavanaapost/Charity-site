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
  var TITLES = ["Hands that <em>make it happen.</em>", "Every smile <em>has a helper.</em>", "One community, <em>many hands.</em>"];

  root.innerHTML =
    '<header class="vh">' +
      '<p class="vh-ribbon">Our community</p>' +
      '<h1 class="vh-title">Our volunteers</h1>' +
      '<p class="vh-turn" data-turn>' + TITLES.map(function (t, i) { return '<span class="' + (i ? "" : "on") + '">' + t + "</span>"; }).join("") + "</p>" +
      '<p class="vh-lede">Everyone here gives an hour, a skill or a visit. Many are members too, so we keep one list for all of us.</p>' +
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
    '<section class="v-join">' +
      '<h2>Join them</h2>' +
      '<p>Pick what you can bring and tick “Show me on our Volunteers page”. A volunteer will reply to you.</p>' +
      '<div class="v-join-go"><a class="v-btn" href="/spark#join">Join Raavanaa →</a><a class="v-btn ghost" href="/volunteer">Volunteer form</a></div>' +
      '<p class="v-fine">We only show a first name, the first letter of the last name, a town and skills. Phone numbers and emails are never shown. To be taken off, <a href="/contact">tell us</a>.</p>' +
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
      : ALL.length ? '<p class="v-empty">Nobody here yet for that. <a href="/spark#join">Be the first →</a></p>'
      : '<p class="v-empty"><b>Be the first name on this page.</b> Join Raavanaa, tick “Show me on our Volunteers page”, and you will appear here.</p>';
    [].slice.call(root.querySelectorAll("[data-f]")).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.f === F)); });
  }
  fetch("/api/volunteers").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) {
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
  });
  root.addEventListener("click", function (e) { var b = e.target.closest("[data-f]"); if (b) { F = b.dataset.f; draw(); } });
  root.querySelector("[data-skill]").addEventListener("change", function (e) { SKILL = e.target.value; draw(); });
})();
