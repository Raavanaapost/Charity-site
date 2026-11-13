/* The family page of a moment (/m/<code>, /ta/m/<code>), SURESH 10 Nov 2026.
   13 Nov 2026 (SURESH): a family circle in family words. The organiser invites people by name and family word
   ("Malar Akka, it's me, Ravi"); whoever opens the invite is greeted the same way and told it is safe; Join goes
   straight to sign-in and back here with their name in the circle; the page shows what the circle has given; and the
   organiser can choose one project from the directory, which then shows as "Being funded by <name>'s circle".
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


  var store = { get: function (k) { try { return localStorage.getItem(k) || ""; } catch (_) { return ""; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
  var ownerKey = store.get("raav-own-" + code);
  var REL = [["Akka", "அக்கா", "elder sister"], ["Annan", "அண்ணா", "elder brother"], ["Thangachi", "தங்கச்சி", "younger sister"], ["Thambi", "தம்பி", "younger brother"],
    ["Amma", "அம்மா", "mother"], ["Appa", "அப்பா", "father"], ["Machan", "மச்சான்", "cousin, brother-in-law"], ["Machal", "மச்சாள்", "cousin, sister-in-law"],
    ["Mama", "மாமா", "uncle"], ["Mami", "மாமி", "aunt"], ["Chithappa", "சித்தப்பா", "uncle"], ["Chithi", "சித்தி", "aunt"], ["Periyappa", "பெரியப்பா", "uncle"],
    ["Periyamma", "பெரியம்மா", "aunt"], ["Thaatha", "தாத்தா", "grandfather"], ["Paati", "பாட்டி", "grandmother"], ["friend", "நண்பர்", "friend"], ["family", "உறவினர்", "family"]];
  var relWord = function (k) { var r = REL.filter(function (x) { return x[0] === k; })[0]; return !r || k === "friend" || k === "family" ? "" : TA ? r[1] : r[0]; };
  // "Malar Akka", the way a family calls someone
  var greetName = function (to, rel) { var w = relWord(rel); return to && w ? to + " " + w : to || w; };
  var invited = (new URLSearchParams(location.search).get("i") || "").toLowerCase();
  if (/^[a-z0-9]{6,16}$/.test(invited) && code) { store.set("raav-invite-" + code, invited); try { history.replaceState(null, "", location.pathname + location.hash); } catch (_) {} }
  else invited = "";
  var api = function (path, opts) {
    opts = opts || {}; opts.headers = opts.headers || {};
    if (ownerKey) opts.headers["x-owner-key"] = ownerKey;
    if (opts.body) opts.headers["Content-Type"] = "application/json";
    return fetch("/api/moments/" + code + path, opts).then(function (r) { return r.json().catch(function () { return {}; }).then(function (o) { o.status = r.status; return o; }); });
  };
  var newRef = function () { var abc = "abcdefghjkmnpqrstuvwxyz23456789", b = crypto.getRandomValues(new Uint8Array(8)); return Array.prototype.map.call(b, function (x) { return abc[x % abc.length]; }).join(""); };
  var COUNTRIES = ["Sri Lanka", "India", "United Kingdom", "Canada", "Australia", "United States", "Switzerland", "Germany", "France", "Norway", "Denmark", "Netherlands", "Italy", "New Zealand", "Singapore", "Malaysia", "United Arab Emirates", "Qatar"];
  var countrySelect = function (id) { return '<select id="' + id + '"><option value="">' + T("Where do you live?", "நீங்கள் எந்த நாட்டில்?") + "</option>" + COUNTRIES.map(function (c) { return "<option>" + c + "</option>"; }).join("") + "</select>"; };
  var shield = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z" fill="#1f7a47"/><path d="M8 12l3 3 5-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function circleList(c) {
    if (!c.length) return '<p class="mo-note tg-circle-count">' + T("No one has joined yet.", "இன்னும் யாரும் இணையவில்லை.") + "</p>";
    var places = {}; c.forEach(function (x) { if (x.country) places[x.country] = 1; });
    var n = Object.keys(places).length;
    return '<p class="tg-circle-count"><b>' + c.length + "</b> " + (c.length === 1 ? T("person so far", "நபர் இதுவரை") : T("of us", "பேர்")) +
      (n > 1 ? T(", in ", ", ") + "<b>" + n + "</b> " + T("countries", "நாடுகளில்") : n === 1 ? T(", in ", ", ") + esc(Object.keys(places)[0]) : "") + "</p>" +
      '<ul class="tg-givers tg-members">' + c.map(function (x) { return "<li>" + esc(x.name) + (x.country ? " <small>· " + esc(x.country) + "</small>" : "") + "</li>"; }).join("") + "</ul>";
  }

  function missing() {
    root.innerHTML = '<section class="mo-hero"><div class="wrap tg-in"><p class="mo-kicker">' + T("Raavanaa · A moment in their name", "ராவணா · அவர்கள் பெயரில் ஒரு தருணம்") + "</p>" +
      '<h1 class="tg-name">' + T("We could not find this page", "இந்தப் பக்கத்தைக் கண்டுபிடிக்க முடியவில்லை") + "</h1>" +
      '<p class="mo-lede tg-lede">' + T("The link may be incomplete. You can still make a moment of your own.", "இணைப்பு முழுமையாக இல்லாமல் இருக்கலாம். நீங்களே ஒரு தருணத்தை உருவாக்கலாம்.") + "</p>" +
      '<p><a class="mo-start" href="' + L + '/moment">' + T("Make a moment", "ஒரு தருணத்தை உருவாக்குங்கள்") + "</a></p></div></section>";
  }
  if (!code) { missing(); return; }

  var openInvite = invited ? fetch("/api/moments/" + code + "/open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: invited }) })
    .then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }) : Promise.resolve(null);

  // First launch (SURESH, 13 Nov 2026): keep it simple. Only the person who made the page gives from it; everyone can
  // see the Moment Card and share it. Joining the circle and holding a project stay built, switched off until later.
  var JOIN = false, HOLD = false;
  var homeSVG = '<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><path d="M6 22L24 7l18 15" fill="none" stroke="#c9a24a" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 19.500V40h26V19.500" fill="#fffaf0" stroke="#1f4d3a" stroke-width="3" stroke-linejoin="round"/><path d="M24 35s-6-3.700-6-8a3.500 3.500 0 0 1 6-2.300 3.500 3.500 0 0 1 6 2.300c0 4.300-6 8-6 8z" fill="#c8381e"/></svg>';

  Promise.all([getJSON("/api/moments/" + code, null), getJSON("/projects.json", { projects: [] }), getJSON("/share.json", null), getJSON("/api/projects", null), getJSON("/api/give/totals", null), api("/me").catch(function () { return {}; }), openInvite]).then(function (res) {
    var m = res[0], me = res[5] || {}, inv = res[6];
    if (!m || !m.ok) { missing(); return; }
    var friends = m.circle === "friends";
    var th = THEME[m.kind] || THEME.memory, share = res[2] && res[2].projects || {}, gifts = res[4] && res[4].projects || {};
    root.style.setProperty("--tint", th[0]); root.style.setProperty("--accent", th[1]); root.style.setProperty("--frame", th[2]); root.style.setProperty("--petal", th[3]);
    var list = (res[1].projects || []).concat(res[3] && res[3].projects || []);
    var toProj = function (p) {
      var sh = share[p.slug] || {}, goal = num(p.goal) || (p.budget || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0);
      var raised = (p.funders || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0) + ((gifts[p.slug] || {}).gifts || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0);
      return { slug: p.slug, title: (TA && sh.title_ta) || sh.title || p.title, art: sh.art || (/\.svg$/.test(p.cover || "") ? p.cover : "/img/project-hills.svg"),
        cur: String(p.currency || "$").trim(), goal: goal, raised: raised, left: Math.max(0, goal - raised), pct: goal ? Math.min(100, Math.round(raised / goal * 100)) : 0,
        open: !/complete/i.test(p.status || "") && goal > 0 && raised < goal, held: m.held === p.slug };
    };
    var find = function (slug) { var p = list.filter(function (x) { return x && x.slug === slug && !x.hidden && x.verified; })[0]; return p ? toProj(p) : null; };
    var projs = [m.project].concat(m.also || []).filter(Boolean).map(find).filter(Boolean);
    var proj = projs[0] || null;
    // The gift goes to the first project while it still needs sponsors (the others named with it); after that, to the Raavanaa Fund.
    var u = new URLSearchParams();
    if (proj && proj.open) { u.set("project", proj.slug); var more = projs.slice(1).filter(function (p) { return p.open; }); if (more.length) u.set("also", more.map(function (p) { return p.slug; }).join(",")); }
    u.set("tribute", m.kind); u.set("tw", m.words); u.set("tn", m.name); if (m.note) u.set("tnote", m.note); u.set("m", code);
    var give = L + (proj && proj.open ? "/give?" : "/fund?") + u.toString() + "#give";
    var page = location.origin + L + "/m/" + code;
    var circleName = T(m.name + "'s circle", m.name + " வட்டம்");
    var day = "";
    if (m.day) { var d = new Date(m.day + "T12:00:00"); if (!isNaN(d)) day = d.toLocaleDateString(TA ? "ta-LK" : "en-GB", { day: "numeric", month: "long" }); }
    var money = function (c, v) { return (c === "LKR" ? "Rs " : c === "USD" ? "$" : c + " ") + Math.round(v).toLocaleString("en-US"); };
    var total = Object.keys(m.totals || {}).map(function (c) { return money(c, m.totals[c]); }).join(" + ");
    document.title = (m.words ? m.words + " " : "") + m.name + " · Raavanaa";
    var from = inv && inv.from || m.from || "";
    var fromAll = [m.from, m.others].filter(Boolean).join(", ");
    var pageName = friends ? T(m.name + "'s friends page", m.name + " நண்பர்கள் பக்கம்") : T(m.name + "'s family page", m.name + " குடும்பப் பக்கம்");
    var shareText = (m.words ? m.words + " " : "") + m.name + (m.note ? "\n“" + m.note + "”" : "") + "\n" +
      (friends ? T("As friends, we are giving children in Sri Lanka a day of joy in this name: ", "நண்பர்களாக, இந்தப் பெயரில் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறோம்: ")
        : T("Our family is giving children in Sri Lanka a day of joy in this name: ", "இந்தப் பெயரில் எங்கள் குடும்பம் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறது: ")) + page;

    // 1. Someone opened an invite: greet them the way the family talks, and tell them it is safe.
    var welcome = inv && (inv.to || inv.from) && !me.joined ?
      '<section class="tg-welcome"><div class="wrap"><div class="tg-welcome-card">' +
        '<p class="tg-hi">' + esc(greetName(inv.to, inv.relation) || T("Hello", "வணக்கம்")) + ",</p>" +
        (inv.from ? '<p class="tg-hi-from">' + T("this is from <b>" + esc(inv.from) + "</b>.", "இது <b>" + esc(inv.from) + "</b> அனுப்பியது.") + "</p>" : "") +
        '<p class="tg-hi-why">' + (friends ? T(esc(inv.from || "A friend") + " made this page for " + esc(m.name) + " and wanted you to see it.", esc(inv.from || "ஒரு நண்பர்") + " " + esc(m.name) + " அவர்களுக்காக இந்தப் பக்கத்தை உருவாக்கி, நீங்களும் பார்க்க விரும்பினார்.")
          : T(esc(inv.from || "Your family") + " made this page for " + esc(m.name) + " and wants you with the family.", esc(inv.from || "உங்கள் குடும்பத்தினர்") + " " + esc(m.name) + " அவர்களுக்காக இந்தப் பக்கத்தை உருவாக்கி, நீங்களும் குடும்பத்துடன் இருக்க விரும்புகிறார்.")) + "</p>" +
        (JOIN ? '<div class="tg-join" data-join></div>' : "") +
        '<p class="tg-safe">' + shield + "<span>" + T("Safe to open. Raavanaa is a volunteer charity. We never ask for passwords, codes or bank details by message.", "பாதுகாப்பானது. ராவணா ஒரு தன்னார்வத் தொண்டு நிறுவனம். கடவுச்சொல், குறியீடு அல்லது வங்கி விவரங்களை நாம் செய்தி மூலம் ஒருபோதும் கேட்பதில்லை.") +
          (inv.from ? " " + T("Not sure? Call " + esc(inv.from) + " first.", "சந்தேகமா? முதலில் " + esc(inv.from) + " அவர்களை அழையுங்கள்.") : "") + "</span></p>" +
      "</div></div></section>" : "";

    // 2. The Moment Card, the same card the organiser made, with the name at the top
    var whatLine = proj ? (projs.length > 1 ? projs.length + T(" days of joy, shared", " மகிழ்ச்சியான நாட்கள், பகிர்ந்து") : proj.title) : m.wish ? T("A wish: ", "விருப்பம்: ") + m.wish : T("The Raavanaa Fund, for the next day of joy", "ராவணா நிதியம், அடுத்த மகிழ்ச்சியான நாளுக்கு");
    var card = '<section class="mo-cardsec tg-cardsec">' +
      '<a class="tg-pageicon" href="#giving"><span aria-hidden="true">' + homeSVG + "</span><b>" + esc(pageName) + "</b>" +
        (fromAll || day ? "<small>" + (from ? T("Started with love by ", "அன்புடன் தொடங்கியவர்: ") + esc(from) : "") + (from && day ? " · " : "") + (day ? T("every year on ", "ஒவ்வோர் ஆண்டும் ") + esc(day) : "") + "</small>" : "") + "</a>" +
      '<figure class="mo-card">' +
        '<span class="mo-card-c tl" aria-hidden="true"></span><span class="mo-card-c tr" aria-hidden="true"></span><span class="mo-card-c bl" aria-hidden="true"></span><span class="mo-card-c br" aria-hidden="true"></span>' +
        '<p class="mo-card-words">' + esc(m.words) + "</p>" +
        '<h1 class="mo-card-name">' + esc(m.name) + "</h1>" +
        '<div class="mo-card-rule" aria-hidden="true"><i></i><b>❀</b><i></i></div>' +
        '<img class="mo-card-lamp" src="/img/moment/' + (ART[m.kind] || (THEME[m.kind] ? m.kind : "memory")) + '.jpg" alt="" width="150" height="200">' +
        (m.note ? '<p class="mo-card-note">“' + esc(m.note) + "”</p>" : "") +
        '<p class="mo-card-gift">' + (m.kind === "behalf" ? T("A day of joy for children, given together", "குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாள், ஒன்றாக வழங்கப்பட்டது") : T("A day of joy for children, given in their name", "அவர்கள் பெயரில், குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாள்")) + "</p>" +
        '<p class="mo-card-what">' + esc(whatLine) + "</p>" +
        (fromAll && m.kind !== "behalf" ? '<p class="mo-card-from">' + T("With love, ", "அன்புடன், ") + esc(fromAll) + "</p>" : "") +
        '<img class="mo-card-logo" src="/img/logo-450.webp?v=6" alt="Raavanaa" width="450" height="149">' +
      "</figure>" +
      '<div class="mo-card-actions"><button type="button" data-copy>' + T("Copy", "நகலெடு") + '</button><button type="button" data-share>' + T("Share", "பகிர்") + "</button></div>" +
    "</section>";

    // 3. Where the joy goes, and what has been given
    var held = !HOLD || !proj || !proj.held ? "" : m.heldOk ? '<span class="tg-held">' + T("Being funded by " + esc(circleName), esc(circleName) + " நிதியளிக்கிறது") + "</span>"
      : '<span class="tg-held wait">' + T("Chosen by our circle · the team will confirm it soon", "எங்கள் வட்டம் தேர்ந்தெடுத்தது · குழு விரைவில் உறுதிசெய்யும்") + "</span>";
    var projCard = function (p, i) {
      return '<a class="mo-proj tg-proj" href="' + L + "/projects/" + esc(p.slug) + '"><span class="mo-proj-art" style="background-image:url(\'' + esc(p.art) + '\')"></span>' +
        '<span class="mo-proj-text">' + (i ? "" : held) + "<b>" + esc(p.title) + "</b><small>" + (p.open ? esc(p.cur) + " " + Math.round(p.raised).toLocaleString("en-US") + T(" of ", " / ") + esc(p.cur) + " " + Math.round(p.goal).toLocaleString("en-US") + " · " + T("still needs ", "இன்னும் தேவை ") + esc(p.cur) + " " + Math.round(p.left).toLocaleString("en-US") : T("Fully funded. New gifts go to the Raavanaa Fund, for the next day of joy.", "முழு நிதியும் கிடைத்தது. புதிய அன்பளிப்புகள் அடுத்த மகிழ்ச்சியான நாளுக்காக ராவணா நிதியத்துக்குச் செல்லும்.")) + "</small>" +
        '<span class="mo-bar"><i style="width:' + p.pct + '%"></i></span></span></a>';
    };
    var where = projs.length ? projs.map(projCard).join("")
      : '<a class="mo-proj tg-proj" href="' + L + '/fund"><span class="mo-proj-art any" aria-hidden="true">' + (m.wish ? "✎" : "❀") + '</span><span class="mo-proj-text"><b>' +
          (m.wish ? T("Their wish: ", "அவர்களின் விருப்பம்: ") + esc(m.wish) : T("The Raavanaa Fund", "ராவணா நிதியம்")) + "</b><small>" +
          (m.wish ? T("Gifts wait in the Raavanaa Fund until the right day is found for this wish.", "இந்த விருப்பத்துக்கான சரியான நாள் கிடைக்கும் வரை அன்பளிப்புகள் ராவணா நிதியத்தில் காத்திருக்கும்.") : T("The team chooses the next day of joy, and shows openly where it went.", "அடுத்த மகிழ்ச்சியான நாளைக் குழு தேர்ந்தெடுத்து, அது எங்கே சென்றது என்பதை வெளிப்படையாகக் காட்டும்.")) + "</small></span></a>";
    var pick = L + "/initiated?circle=" + code;
    var ownerPick = !HOLD ? "" : me.owner && !me.signedIn ? '<div class="tg-pick"><a class="mo-go tg-pick-btn" href="' + L + "/members?next=" + encodeURIComponent(L + "/m/" + code) + '">' + T("Sign in to choose a project", "திட்டத்தைத் தேர்ந்தெடுக்க உள்நுழையுங்கள்") + "</a></div>"
      : me.owner ? '<div class="tg-pick">' + (m.held
        ? '<a class="tg-link" href="' + pick + '">' + T("Change the project", "திட்டத்தை மாற்று") + '</a><button type="button" class="tg-link" data-letgo>' + T("Let it go for another circle", "வேறு வட்டத்துக்கு விட்டுக்கொடு") + "</button>"
        : '<a class="mo-go tg-pick-btn" href="' + pick + '">' + T("Choose a project for our circle", "எங்கள் வட்டத்துக்கு ஒரு திட்டத்தைத் தேர்ந்தெடு") + "</a>") + "</div>" : "";
    var givers = (m.givers || []).length ? '<p class="mo-note tg-gave">' + T("Given by ", "கொடுத்தவர்கள்: ") + m.givers.map(function (g) { return esc(TA && g === "A friend of Raavanaa" ? "ராவணாவின் நண்பர்" : g); }).join(", ") + "</p>" : "";
    // Only the person who made the page gives from it, for now. Everyone else can share it, or make a moment of their own.
    var giveBtn = me.owner ? '<a class="mo-go tg-give" href="' + esc(give) + '">' + T("Give in " + esc(m.name) + "'s name", esc(m.name) + " பெயரில் கொடுங்கள்") + "</a>"
      : '<p class="mo-note tg-own">' + T("This moment was made by " + esc(from || (friends ? "a friend" : "the family")) + ". You can share it, or ", "இந்தத் தருணத்தை உருவாக்கியவர் " + esc(from || (friends ? "ஒரு நண்பர்" : "குடும்பத்தினர்")) + ". இதைப் பகிரலாம், அல்லது ") +
          '<a href="' + L + '/moment">' + T("make a moment of your own", "உங்கள் சொந்தத் தருணத்தை உருவாக்கலாம்") + "</a>.</p>";

    root.innerHTML = welcome +
      '<section class="mo-hero tg-hero">' + petals + '<div class="wrap tg-in">' + card + "</div></section>" +
      '<div class="wrap tg-body">' +
        '<section class="mo-step tg-step tg-wide tg-fund" id="giving"><h2>' + T("Where the joy goes", "மகிழ்ச்சி செல்லும் இடம்") + "</h2>" +
          where + givers + ownerPick +
          ((m.count || 0) ? '<div class="tg-sum"><div><b>' + esc(total || money("LKR", 0)) + "</b><span>" + T("given so far", "இதுவரை கொடுத்தது") + "</span></div>" +
            "<div><b>" + (m.count || 0) + "</b><span>" + ((m.count || 0) === 1 ? T("gift", "அன்பளிப்பு") : T("gifts", "அன்பளிப்புகள்")) + "</span></div></div>" : "") +
          giveBtn +
          (m.test ? '<p class="mo-note tg-test">' + T("Preview: only test gifts are counted here.", "முன்னோட்டம்: இங்கே சோதனை அன்பளிப்புகள் மட்டுமே கணக்கிடப்படும்.") + "</p>" : "") +
          '<p class="mo-note mo-privacy">' + T("Every gift shows on the project's open money page. We never show children's names or faces.", "ஒவ்வொரு அன்பளிப்பும் திட்டத்தின் திறந்த பணப் பக்கத்தில் காட்டப்படும். குழந்தைகளின் பெயர்களையோ முகங்களையோ நாம் ஒருபோதும் காட்டுவதில்லை.") + "</p>" +
        "</section>" +
        '<section class="mo-step tg-step tg-wide tg-invite" id="invite" data-invite hidden></section>' +
        (JOIN ? '<section class="mo-step tg-step tg-wide tg-circle" id="circle"><h2>' + (friends ? T("Our friends circle", "எங்கள் நண்பர்கள் வட்டம்") : T("Our family circle", "எங்கள் குடும்ப வட்டம்")) + "</h2>" + circleList(m.circle || []) +
          (welcome ? "" : '<div class="tg-join" data-join></div>') + "</section>" : "") +
      "</div>";

    var lb = root.querySelector("[data-letgo]");
    if (lb) lb.addEventListener("click", function () {
      lb.disabled = true;
      api("/project", { method: "POST", body: JSON.stringify({ slug: "" }) }).then(function () { location.reload(); });
    });
    // Copy and Share, for everyone: no long link on the page
    root.querySelector("[data-copy]").addEventListener("click", function (e) {
      var b = e.currentTarget;
      (navigator.clipboard ? navigator.clipboard.writeText(page) : Promise.reject()).then(function () { b.textContent = T("Copied", "நகலெடுக்கப்பட்டது"); }).catch(function () { window.prompt(T("Copy this", "இதை நகலெடுங்கள்"), page); });
    });
    root.querySelector("[data-share]").addEventListener("click", function () {
      if (navigator.share) { navigator.share({ text: shareText }).catch(function () {}); return; }
      window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank", "noopener");
    });
    if (JOIN) joinArea(m, me, inv);
    if (me.owner) invitePanel(m, page, me, friends);
    if (location.hash === "#invite" || location.hash === "#giving") setTimeout(function () { var t = document.getElementById(location.hash.slice(1)); if (t && !t.hidden) t.scrollIntoView({ behavior: "smooth", block: "start" }); }, 300);
  });

  // Join: not signed in -> sign in or make an account, and come straight back; signed in -> join at once, with the
  // name from their invite, and show them in the circle.
  function joinArea(m, me, inv) {
    var join = root.querySelector("[data-join]");
    if (!join) return;
    var ref = store.get("raav-invite-" + code);
    var name0 = inv && inv.to || String(me.suggest || "").split(/\s+/)[0] || "";
    var showIn = function (name, country) {
      join.innerHTML = '<p class="tg-in-circle">' + T("Welcome, <b>" + esc(name) + "</b>. You are in the family circle.", "வரவேற்கிறோம், <b>" + esc(name) + "</b>. நீங்கள் குடும்ப வட்டத்தில் இருக்கிறீர்கள்.") + "</p>" +
        (country ? "" : '<p class="tg-where">' + countrySelect("tg-where") + "</p>");
      var sel = join.querySelector("#tg-where");
      if (sel) sel.addEventListener("change", function () { doJoin(name, sel.value, true); });
    };
    var redraw = function (name, country) {
      var c = (m.circle || []).filter(function (x) { return x.name !== name; }).concat([{ name: name, country: country }]);
      m.circle = c;
      var circle = root.querySelector(".tg-circle"), countEl = circle.querySelector(".tg-circle-count"), ul = circle.querySelector(".tg-members");
      var tmp = document.createElement("div"); tmp.innerHTML = circleList(c);
      if (countEl) countEl.remove(); if (ul) ul.remove();
      circle.querySelector("h2").insertAdjacentHTML("afterend", tmp.innerHTML);
      var w = root.querySelector(".tg-welcome"); if (w) { w.querySelector(".tg-hi-why").remove(); }
    };
    var doJoin = function (name, country, quiet) {
      return api("/join", { method: "POST", body: JSON.stringify({ name: name, country: country, ref: ref }) }).then(function (o) {
        if (!o.ok) { join.innerHTML = '<p class="mo-note">' + esc(o.error || T("Please try again.", "மீண்டும் முயலுங்கள்.")) + "</p>"; return; }
        redraw(name, country);
        if (!quiet) showIn(name, country); else join.querySelector(".tg-where") && join.querySelector(".tg-where").remove();
      });
    };
    if (me.joined) { join.innerHTML = '<p class="tg-in-circle">' + T("You are in this circle as <b>" + esc(me.name) + "</b>.", "நீங்கள் இந்த வட்டத்தில் <b>" + esc(me.name) + "</b> ஆக இருக்கிறீர்கள்.") + "</p>"; return; }
    if (!me.signedIn) {
      join.innerHTML = '<a class="mo-go tg-join-btn" href="' + L + "/members?join=&next=" + encodeURIComponent(L + "/m/" + code) + '">' + T("Join the family circle", "குடும்ப வட்டத்தில் இணையுங்கள்") + "</a>" +
        '<p class="mo-note">' + T("Sign in with Google or your email. You come straight back here.", "Google அல்லது மின்னஞ்சல் மூலம் உள்நுழையுங்கள். நேராக இங்கே திரும்புவீர்கள்.") + "</p>";
      return;
    }
    if (name0 && ref) { doJoin(name0, ""); return; } // came from an invite: they are in, by the name the family uses
    join.innerHTML = '<form class="tg-join-form" novalidate><label>' + T("Your name, as the family calls you", "குடும்பம் உங்களை அழைக்கும் பெயர்") + '<input id="tg-join-name" maxlength="40" value="' + esc(name0) + '" autocomplete="given-name"></label>' +
      '<button class="mo-go tg-join-btn" type="submit">' + T("Join the family circle", "குடும்ப வட்டத்தில் இணையுங்கள்") + "</button></form>";
    join.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var n = join.querySelector("#tg-join-name").value.trim();
      if (!n) { join.querySelector("#tg-join-name").focus(); return; }
      doJoin(n, "");
    });
  }

  // The organiser's invites, in family words. Each goes from their own phone or account with its own link.
  function invitePanel(m, page, me, friends) {
    var inv = root.querySelector("[data-invite]");
    var CH = {
      whatsapp: ["W", T("WhatsApp", "வட்ஸ்அப்")], sms: ["#", T("Text message", "குறுஞ்செய்தி")], facebook: ["f", "Facebook"],
      instagram: ["◎", "Instagram"], link: ["⧉", T("Copy link", "இணைப்பை நகலெடு")]
    };
    var STATUS = { sent: T("Sent", "அனுப்பப்பட்டது"), opened: T("Opened", "திறந்தார்"), joined: T("Joined", "இணைந்தார்") };
    var myName = store.get("raav-my-name") || m.from || String(me.suggest || "").split(/\s+/)[0] || "";
    inv.hidden = false;
    inv.innerHTML = "<h2>" + (friends ? T("Invite your friends", "உங்கள் நண்பர்களை அழையுங்கள்") : T("Invite your family", "உங்கள் குடும்பத்தை அழையுங்கள்")) + "</h2>" +
      '<p class="mo-note">' + T("Write their name, and the message is ready. Send it from your own phone.", "அவர்களின் பெயரை எழுதுங்கள்; செய்தி தயார். உங்கள் சொந்தத் தொலைபேசியிலிருந்து அனுப்புங்கள்.") + "</p>" +
      '<div class="tg-inv-form">' +
        '<label>' + T("Their name", "அவர்களின் பெயர்") + '<input id="tg-inv-to" maxlength="40" placeholder="' + T("Malar", "மலர்") + '"></label>' +
        '<label' + (friends ? " hidden" : "") + '>' + T("They are your", "அவர் உங்கள்") + '<select id="tg-inv-rel"><option value="">' + T("Choose", "தேர்ந்தெடு") + "</option>" +
          REL.map(function (r) { return '<option value="' + r[0] + '">' + (TA ? r[1] : r[0] === "friend" || r[0] === "family" ? r[2].replace(/^./, function (c) { return c.toUpperCase(); }) : r[0] + " (" + r[2] + ")") + "</option>"; }).join("") + "</select></label>" +
        '<label>' + T("Your name", "உங்கள் பெயர்") + '<input id="tg-inv-from" maxlength="40" value="' + esc(myName) + '"></label>' +
      "</div>" +
      '<p class="tg-preview" data-preview></p>' +
      '<div class="tg-inv-btns">' + Object.keys(CH).map(function (k) {
        var c = CH[k], tag = k === "instagram" || k === "link" ? "button" : "a";
        return "<" + tag + (tag === "a" ? ' target="_blank" rel="noopener" href="#"' : ' type="button"') + ' class="tg-inv" data-ch="' + k + '"><span class="tg-ic tg-ic-' + k + '" aria-hidden="true">' + c[0] + "</span><b>" + c[1] + "</b></" + tag + ">";
      }).join("") + "</div>" +
      '<p class="mo-note tg-inv-msg" data-inv-msg hidden></p>' +
      '<div class="tg-inv-list" data-inv-list></div>' +
      '<p class="mo-note mo-privacy">' + T("It goes from your own phone, so they know it is you. Only you see this list.", "இது உங்கள் சொந்தத் தொலைபேசியிலிருந்து செல்லும்; அது நீங்கள்தான் என்று அவர்களுக்குத் தெரியும். இந்தப் பட்டியலை நீங்கள் மட்டுமே பார்ப்பீர்கள்.") + "</p>";
    var $ = function (s) { return inv.querySelector(s); };
    var msg = $("[data-inv-msg]"), list = $("[data-inv-list]");
    var text = function (url) {
      var to = $("#tg-inv-to").value.trim(), rel = $("#tg-inv-rel").value, fr = $("#tg-inv-from").value.trim();
      var hi = greetName(to, rel) || T("Hi", "வணக்கம்");
      var title = (m.words ? m.words + " " : "") + m.name;
      if (friends) return TA
        ? hi + ", நான் " + (fr || "") + ".\n" + m.name + " அவர்களுக்காக ராவணாவில் ஒரு பக்கம் உருவாக்கியுள்ளேன்: “" + title + "”. இந்தப் பெயரில் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறோம். பாருங்கள்: " + url
        : hi + ", it's " + (fr || "me") + ".\nI made a page on Raavanaa: “" + title + "”. We are giving children in Sri Lanka a day of joy in this name. Have a look: " + url;
      return TA
        ? hi + ", நான் " + (fr || "") + ".\nராவணாவில் ஒரு பக்கம் உருவாக்கியுள்ளேன்: “" + title + "”. குடும்பமாக இந்தப் பெயரில் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறோம். " + (JOIN ? "என்னுடன் இணையுங்கள், ஒரு நிமிடம் போதும்: " : "பாருங்கள்: ") + url
        : hi + ", it's me, " + (fr || "") + ".\nI made a page on Raavanaa: “" + title + "”. As a family we are giving children in Sri Lanka a day of joy in this name. " + (JOIN ? "Join me, it takes a minute: " : "Have a look: ") + url;
    };
    var preview = function () { $("[data-preview]").textContent = text(page + "?i=…"); };
    ["#tg-inv-to", "#tg-inv-rel", "#tg-inv-from"].forEach(function (s) { $(s).addEventListener("input", preview); $(s).addEventListener("change", preview); });
    preview();
    function draw() {
      api("/invites").then(function (o) {
        if (!o.ok || !o.invites.length) { list.innerHTML = ""; return; }
        list.innerHTML = "<h3>" + T("Your invites", "உங்கள் அழைப்புகள்") + "</h3><ul>" + o.invites.map(function (x) {
          return "<li><span>" + esc(greetName(x.label, x.relation) || x.joinedAs || T("No name", "பெயர் இல்லை")) + " <small>" + esc((CH[x.channel] || CH.link)[1]) + "</small></span>" +
            '<span class="tg-pill tg-' + x.status + '">' + STATUS[x.status] + "</span></li>";
        }).join("") + "</ul>";
      });
    }
    draw();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) draw(); });
    var copy = function (t) { return navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject(); };
    inv.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ch]");
      if (!b) return;
      var ch = b.dataset.ch, ref = newRef(), url = page + "?i=" + ref, words = text(url), fr = $("#tg-inv-from").value.trim();
      if (fr) store.set("raav-my-name", fr);
      // The link is ready before the invite is saved, so WhatsApp or Messages opens at once.
      if (ch === "whatsapp") b.href = "https://wa.me/?text=" + encodeURIComponent(words);
      else if (ch === "sms") b.href = "sms:?&body=" + encodeURIComponent(words);
      else if (ch === "facebook") b.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
      else copy(ch === "instagram" ? url : words).then(function () {
        msg.hidden = false;
        msg.textContent = ch === "instagram" ? T("Link copied. Paste it in an Instagram message.", "இணைப்பு நகலெடுக்கப்பட்டது. Instagram செய்தியில் ஒட்டுங்கள்.") : T("Message and link copied. Paste it anywhere.", "செய்தியும் இணைப்பும் நகலெடுக்கப்பட்டன. எங்கும் ஒட்டலாம்.");
      }).catch(function () { window.prompt(T("Copy this", "இதை நகலெடுங்கள்"), words); });
      api("/invites", { method: "POST", body: JSON.stringify({ ref: ref, label: $("#tg-inv-to").value.trim(), relation: $("#tg-inv-rel").value, from: fr, channel: ch }), keepalive: true })
        .then(function () { $("#tg-inv-to").value = ""; $("#tg-inv-rel").value = ""; preview(); draw(); }).catch(function () {});
    });
  }
})();
