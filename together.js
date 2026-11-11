/* The family page of a moment (/m/<code>, /ta/m/<code>), SURESH 10 Nov 2026.
   Someone made "a moment in their name" and shared this page, so family and friends can give to the same moment:
   the words and the name, where the joy goes, who has given so far, and one button to join in.
   The name is the person remembered or celebrated (or the family or group giving), never a child's.
   Givers show by name only if they ticked "show my name"; amounts show only as the total. */
(function () {
  "use strict";
  var TA = /^\/ta(\/|$)/.test(location.pathname), L = TA ? "/ta" : "";
  var root = document.getElementById("together");
  if (!root) return;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var T = function (en, ta) { return TA ? ta : en; };
  var code = (location.pathname.match(/\/m\/([a-z0-9]{6,16})\/?$/) || [])[1] || "";
  // The same colours as the moment page: [tint, words, frame, petals] for each reason.
  var THEME = {
    memory: ["#fff3cf", "#8a5c12", "#c9a24a", "#f29a1f"], remembrance: ["#f6f1e4", "#6b5a3a", "#b9a77a", "#fffdf6"], birthday: ["#ffe3ea", "#b83b62", "#e8899f", "#e8547a"],
    wedding: ["#ffe7d6", "#a8321e", "#c9a24a", "#c8381e"], anniversary: ["#ffe7d6", "#a8321e", "#c9a24a", "#c8381e"], newborn: ["#e3f0ff", "#3b6aa8", "#9ec0e8", "#a9c8f0"],
    success: ["#fff0c7", "#1f3b63", "#c9a24a", "#f2b33d"], recovery: ["#eef7df", "#3f7a3a", "#8cc07a", "#78b36f"], gratitude: ["#ffe1dc", "#b0423a", "#e8a093", "#e2493a"],
    festival: ["#fff0c2", "#b5532a", "#f2b33d", "#f29a1f"], honour: ["#f3efd8", "#1f4d3a", "#c9a24a", "#e6b94f"], behalf: ["#e4f1e6", "#1f5c45", "#7fb394", "#4f9a6f"],
    custom: ["#ffe3ee", "#b0457a", "#f2a3c0", "#f48fb1"]
  };
  var ART = { anniversary: "wedding" };
  var num = function (v) { var n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
  var getJSON = function (u, d) { return fetch(u).then(function (r) { return r.ok ? r.json() : d; }).catch(function () { return d; }); };
  var petals = '<div class="mo-petals" aria-hidden="true">' + Array.apply(null, Array(14)).map(function (_, i) { return '<i style="--i:' + i + '"></i>'; }).join("") + "</div>";

  function missing() {
    root.innerHTML = '<section class="mo-hero"><div class="wrap tg-in"><p class="mo-kicker">' + T("Raavanaa · A moment in their name", "ராவணா · அவர்கள் பெயரில் ஒரு தருணம்") + "</p>" +
      '<h1 class="tg-name">' + T("We could not find this page", "இந்தப் பக்கத்தைக் கண்டுபிடிக்க முடியவில்லை") + "</h1>" +
      '<p class="mo-lede tg-lede">' + T("The link may be incomplete. You can still make a moment of your own.", "இணைப்பு முழுமையாக இல்லாமல் இருக்கலாம். நீங்களே ஒரு தருணத்தை உருவாக்கலாம்.") + "</p>" +
      '<p><a class="mo-start" href="' + L + '/moment">' + T("Make a moment", "ஒரு தருணத்தை உருவாக்குங்கள்") + "</a></p></div></section>";
  }
  if (!code) { missing(); return; }

  Promise.all([getJSON("/api/moments/" + code, null), getJSON("/projects.json", { projects: [] }), getJSON("/share.json", null), getJSON("/api/projects", null), getJSON("/api/give/totals", null)]).then(function (res) {
    var m = res[0];
    if (!m || !m.ok) { missing(); return; }
    var th = THEME[m.kind] || THEME.memory, share = res[2] && res[2].projects || {}, gifts = res[4] && res[4].projects || {};
    root.style.setProperty("--tint", th[0]); root.style.setProperty("--accent", th[1]); root.style.setProperty("--frame", th[2]); root.style.setProperty("--petal", th[3]);
    var list = (res[1].projects || []).concat(res[3] && res[3].projects || []);
    var p = m.project ? list.filter(function (x) { return x && x.slug === m.project && !x.hidden && x.verified; })[0] : null, proj = null;
    if (p) {
      var sh = share[p.slug] || {}, goal = num(p.goal) || (p.budget || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0);
      var raised = (p.funders || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0) + ((gifts[p.slug] || {}).gifts || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0);
      proj = { slug: p.slug, title: (TA && sh.title_ta) || sh.title || p.title, art: sh.art || (/\.svg$/.test(p.cover || "") ? p.cover : "/img/project-hills.svg"),
        cur: String(p.currency || "$").trim(), left: Math.max(0, goal - raised), pct: goal ? Math.min(100, Math.round(raised / goal * 100)) : 0,
        open: !/complete/i.test(p.status || "") && goal > 0 && raised < goal };
    }
    // The gift goes to the same project while it still needs sponsors; after that, to the Raavanaa Fund.
    var u = new URLSearchParams();
    if (proj && proj.open) u.set("project", proj.slug);
    u.set("tribute", m.kind); u.set("tw", m.words); u.set("tn", m.name); if (m.note) u.set("tnote", m.note); u.set("m", code);
    var give = L + (proj && proj.open ? "/give?" : "/fund?") + u.toString() + "#give";
    var page = location.origin + L + "/m/" + code;
    var day = "";
    if (m.day) { var d = new Date(m.day + "T12:00:00"); if (!isNaN(d)) day = d.toLocaleDateString(TA ? "ta-LK" : "en-GB", { day: "numeric", month: "long" }); }
    var total = Object.keys(m.totals || {}).map(function (c) { return (c === "LKR" ? "Rs " : "$") + Math.round(m.totals[c]).toLocaleString("en-US"); }).join(" + ");
    var wa = (m.words ? m.words + " " : "") + m.name + (m.note ? "\n“" + m.note + "”" : "") + "\n" +
      T("We are giving children in Sri Lanka a day of joy in their name. Join us here: ", "அவர்கள் பெயரில் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறோம். எம்முடன் இணையுங்கள்: ") + page;
    document.title = (m.words ? m.words + " " : "") + m.name + " · Raavanaa";

    var where = proj
      ? '<a class="mo-proj tg-proj" href="' + L + "/projects/" + esc(proj.slug) + '"><span class="mo-proj-art" style="background-image:url(\'' + esc(proj.art) + '\')"></span>' +
          '<span class="mo-proj-text"><b>' + esc(proj.title) + "</b><small>" + (proj.open ? esc(proj.cur) + " " + Math.round(proj.left).toLocaleString("en-US") + T(" still needed", " இன்னும் தேவை") + " · " + proj.pct + "%" : T("Fully funded. New gifts go to the Raavanaa Fund, for the next day of joy.", "முழு நிதியும் கிடைத்தது. புதிய அன்பளிப்புகள் அடுத்த மகிழ்ச்சியான நாளுக்காக ராவணா நிதியத்துக்குச் செல்லும்.")) + "</small>" +
          '<span class="mo-bar"><i style="width:' + proj.pct + '%"></i></span></span></a>'
      : '<a class="mo-proj tg-proj" href="' + L + '/fund"><span class="mo-proj-art any" aria-hidden="true">' + (m.wish ? "✎" : "❀") + '</span><span class="mo-proj-text"><b>' +
          (m.wish ? T("Their wish: ", "அவர்களின் விருப்பம்: ") + esc(m.wish) : T("The Raavanaa Fund", "ராவணா நிதியம்")) + "</b><small>" +
          (m.wish ? T("Gifts wait in the Raavanaa Fund until the right day is found for this wish.", "இந்த விருப்பத்துக்கான சரியான நாள் கிடைக்கும் வரை அன்பளிப்புகள் ராவணா நிதியத்தில் காத்திருக்கும்.") : T("The team chooses the next day of joy, and shows openly where it went.", "அடுத்த மகிழ்ச்சியான நாளைக் குழு தேர்ந்தெடுத்து, அது எங்கே சென்றது என்பதை வெளிப்படையாகக் காட்டும்.")) + "</small></span></a>";
    var givers = (m.givers || []).length
      ? '<ul class="tg-givers">' + m.givers.map(function (g) { return "<li><i aria-hidden=\"true\">♥</i>" + esc(TA && g === "A friend of Raavanaa" ? "ராவணாவின் நண்பர்" : g) + "</li>"; }).join("") + "</ul>"
      : '<p class="mo-note">' + T("No one has given yet. Be the first, and your name leads the way.", "இன்னும் யாரும் கொடுக்கவில்லை. முதலாவதாக நீங்கள் கொடுங்கள்; உங்கள் பெயர் வழிகாட்டும்.") + "</p>";

    root.innerHTML =
      '<section class="mo-hero tg-hero">' + petals + '<div class="wrap tg-in">' +
        '<p class="mo-kicker">' + T("Raavanaa · A moment in their name", "ராவணா · அவர்கள் பெயரில் ஒரு தருணம்") + "</p>" +
        '<img class="mo-lamp tg-art" src="/img/moment/' + (ART[m.kind] || (THEME[m.kind] ? m.kind : "memory")) + '.jpg" alt="" width="300" height="400">' +
        '<p class="tg-words">' + esc(m.words) + "</p>" +
        '<h1 class="tg-name">' + esc(m.name) + "</h1>" +
        (m.note ? '<p class="tg-note">“' + esc(m.note) + "”</p>" : "") +
        (m.from ? '<p class="tg-from">' + T("Started with love by ", "அன்புடன் தொடங்கியவர்: ") + esc(m.from) + "</p>" : "") +
        (day ? '<p class="tg-from">' + T("Remembered every year on ", "ஒவ்வோர் ஆண்டும் நினைவுகூரும் நாள்: ") + esc(day) + "</p>" : "") +
        '<div class="tg-panel">' +
          '<p class="tg-lede">' + T("Family and friends are giving children in Sri Lanka a day of joy in this name. Add your gift, and your name joins theirs.", "குடும்பத்தினரும் நண்பர்களும் இந்தப் பெயரில் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறார்கள். உங்கள் அன்பளிப்பையும் சேருங்கள்; உங்கள் பெயரும் அவர்களுடன் இணையும்.") + "</p>" +
          '<p class="tg-count">' + (m.count ? "<b>" + m.count + "</b> " + (m.count === 1 ? T("gift so far", "அன்பளிப்பு இதுவரை") : T("gifts so far", "அன்பளிப்புகள் இதுவரை")) + (total ? " · <b>" + esc(total) + "</b>" : "") : T("Be the first to give", "முதலாவதாகக் கொடுங்கள்")) + "</p>" +
          '<a class="mo-go" href="' + esc(give) + '">' + T("Give in this name", "இந்தப் பெயரில் கொடுங்கள்") + "</a>" +
          '<div class="mo-card-actions three"><a target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(wa) + '">' + T("Share on WhatsApp", "வட்ஸ்அப்பில் பகிர்") + '</a><button type="button" data-copy>' + T("Copy link", "இணைப்பை நகலெடு") + '</button><a href="' + L + '/moment">' + T("Make your own", "உங்களுடையதை உருவாக்கு") + "</a></div>" +
          (m.test ? '<p class="mo-note tg-test">' + T("Preview: only test gifts are counted here.", "முன்னோட்டம்: இங்கே சோதனை அன்பளிப்புகள் மட்டுமே கணக்கிடப்படும்.") + "</p>" : "") +
        "</div>" +
      "</div></section>" +
      '<div class="wrap tg-body">' +
        '<section class="mo-step tg-step"><h2>' + T("Where the joy goes", "மகிழ்ச்சி எங்கே செல்கிறது") + "</h2>" + where + "</section>" +
        '<section class="mo-step tg-step"><h2>' + T("Giving together", "ஒன்றாகக் கொடுப்பவர்கள்") + "</h2>" + givers +
          '<p class="mo-note mo-privacy">' + T("A name shows here only when the giver chose to show it. We never show children's names or faces.", "கொடுப்பவர் தேர்ந்தெடுத்தால் மட்டுமே பெயர் இங்கே காட்டப்படும். குழந்தைகளின் பெயர்களையோ முகங்களையோ நாம் ஒருபோதும் காட்டுவதில்லை.") + "</p></section>" +
      "</div>";
    root.querySelector("[data-copy]").addEventListener("click", function (e) {
      var b = e.currentTarget;
      (navigator.clipboard ? navigator.clipboard.writeText(page) : Promise.reject()).then(function () { b.textContent = T("Copied", "நகலெடுக்கப்பட்டது"); }).catch(function () { window.prompt(T("Copy this link", "இந்த இணைப்பை நகலெடுங்கள்"), page); });
    });
  });
})();
