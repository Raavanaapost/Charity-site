/* "A moment in their name" (/moment, /ta/moment), SURESH 10 Nov 2026.
   A giver picks the reason (in loving memory, a birthday, a wedding anniversary... or their own words),
   types the name and a few words, sees the tribute card come alive, picks the day of joy it pays for,
   and goes on to the Give form with everything filled in. The card can be saved or sent on WhatsApp.
   The name is the person being remembered or celebrated, never a child's. */
(function () {
  "use strict";
  var TA = /^\/ta(\/|$)/.test(location.pathname);
  var root = document.getElementById("moment");
  if (!root) return;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var T = function (en, ta) { return TA ? ta : en; };

  // The reasons. `words` is what the card and the project page say before the name.
  var OCCASIONS = [
    { k: "memory", theme: ["#fff3cf", "#8a5c12", "#c9a24a", "#f29a1f"], icon: "lamp", en: "In loving memory", ta: "அன்பு நினைவாக", words: ["In loving memory of", "அன்பு நினைவாக:"] },
    { k: "remembrance", theme: ["#f6f1e4", "#6b5a3a", "#b9a77a", "#fffdf6"], icon: "lamp", en: "Remembrance day", ta: "நினைவு நாள்", words: ["Remembering, on the anniversary of", "நினைவு நாளில் நினைவுகூர்ந்து:"] },
    { k: "birthday", theme: ["#ffe3ea", "#b83b62", "#e8899f", "#e8547a"], icon: "cake", en: "A birthday", ta: "பிறந்தநாள்", words: ["Celebrating the birthday of", "பிறந்தநாள் வாழ்த்துடன்:"] },
    { k: "wedding", theme: ["#ffe7d6", "#a8321e", "#c9a24a", "#c8381e"], icon: "rings", en: "Wedding anniversary", ta: "திருமண நாள்", words: ["Celebrating the wedding anniversary of", "திருமண நாள் வாழ்த்துடன்:"] },
    { k: "newborn", theme: ["#e3f0ff", "#3b6aa8", "#9ec0e8", "#a9c8f0"], icon: "cradle", en: "A new baby", ta: "புதிய குழந்தை", words: ["Welcoming", "அன்புடன் வரவேற்று:"] },
    { k: "success", theme: ["#fff0c7", "#1f3b63", "#c9a24a", "#f2b33d"], icon: "star", en: "Exams or graduation", ta: "தேர்வு / பட்டம்", words: ["Celebrating the success of", "வெற்றியைக் கொண்டாடி:"] },
    { k: "recovery", theme: ["#eef7df", "#3f7a3a", "#8cc07a", "#78b36f"], icon: "leaf", en: "Getting well", ta: "நலம் பெற்றது", words: ["Giving thanks for the recovery of", "நலம் பெற்றதற்கு நன்றியுடன்:"] },
    { k: "gratitude", theme: ["#ffe1dc", "#b0423a", "#e8a093", "#e2493a"], icon: "hands", en: "With gratitude", ta: "நன்றியுடன்", words: ["With gratitude for", "நன்றியுடன்:"] },
    { k: "festival", theme: ["#fff0c2", "#b5532a", "#f2b33d", "#f29a1f"], icon: "kolam", en: "A festival", ta: "பண்டிகை", words: ["A festival gift in the name of", "பண்டிகைப் பரிசாக, பெயரில்:"] },
    { k: "honour", theme: ["#f3efd8", "#1f4d3a", "#c9a24a", "#e6b94f"], icon: "crown", en: "In honour of", ta: "கௌரவிக்க", words: ["In honour of", "கௌரவிக்கும் வகையில்:"] },
    { k: "custom", theme: ["#ffe3ee", "#b0457a", "#f2a3c0", "#f48fb1"], icon: "pen", en: "My own words", ta: "என் சொந்த வார்த்தைகள்", words: ["", ""] }
  ];
  var ICONS = {
    lamp: '<path d="M12 3c2 3 3 4.6 3 6a3 3 0 0 1-6 0c0-1.4 1-3 3-6z" fill="#f29a1f" stroke="none"/><path d="M5 13h14c-.6 3-3.4 4.5-7 4.5S5.6 16 5 13zM12 17.5V21M8 21h8"/>',
    cake: '<path d="M4 20h16M5 20v-7h14v7M5 15.5c2 1.2 3.5 1.2 5 0s3-1.2 5 0 3 1.2 4 0M12 13V9.5"/><path d="M12 4.5c1 1.2 1.4 2 1.4 2.7a1.4 1.4 0 0 1-2.8 0c0-.7.4-1.5 1.4-2.7z" fill="#f29a1f" stroke="none"/>',
    rings: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M9 9l1.5-3h-3zM15 9l1.5-3h-3z"/>',
    cradle: '<path d="M4 11h16a8 8 0 0 1-16 0zM7 19l-1.5 2M17 19l1.5 2"/><circle cx="12" cy="6.5" r="2.5"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/>',
    hands: '<path d="M12 20s-7-4.4-7-9.6A4.2 4.2 0 0 1 12 7.700a4.2 4.2 0 0 1 7 2.700C19 15.600 12 20 12 20z"/>',
    kolam: '<circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="6" r="1.3" fill="currentColor"/><circle cx="12" cy="18" r="1.3" fill="currentColor"/><path d="M12 3.5c4.5 0 4.5 8.500 8.500 8.500-4.5 0-4.5 8.500-8.500 8.500-4.500 0-4.500-8.500-8.500-8.500 4.500 0 4.500-8.500 8.500-8.500z"/>',
    crown: '<path d="M4 18h16l1-10-5 4-4-6-4 6-5-4z"/>',
    pen: '<path d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3"/>'
  };
  var icon = function (k) { return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[k] + "</svg>"; };
  var WHO = TA ? ["அம்மா", "அப்பா", "அம்மம்மா", "அப்பம்மா", "அப்பப்பா", "அம்மப்பா", "ஆச்சி", "தாத்தா", "பாட்டி", "அக்கா", "அண்ணா", "தம்பி", "தங்கை", "என் மனைவி", "என் கணவர்", "என் மகன்", "என் மகள்", "என் நண்பர்", "என் ஆசிரியர்"]
    : ["Amma", "Appa", "Ammamma", "Appamma", "Appappa", "Ammappa", "Aachchi", "Thatha", "Paati", "Akka", "Anna", "Thambi", "Thangachchi", "my wife", "my husband", "my son", "my daughter", "my friend", "my teacher"];
  var SAYINGS = {
    memory: [["Forever in our hearts", "என்றும் எம் இதயங்களில்"], ["Your kindness lives on in every smile", "உங்கள் கருணை ஒவ்வொரு புன்னகையிலும் வாழ்கிறது"], ["Gone from our sight, never from our hearts", "கண்களிலிருந்து மறைந்தாலும், இதயங்களிலிருந்து ஒருபோதும் இல்லை"], ["May your light keep shining", "உங்கள் ஒளி என்றும் ஒளிரட்டும்"]],
    remembrance: [["Every year we remember, every year we give", "ஒவ்வோர் ஆண்டும் நினைக்கிறோம், ஒவ்வோர் ஆண்டும் கொடுக்கிறோம்"], ["You taught us to share", "பகிர்ந்து வாழ எமக்குக் கற்றுத் தந்தீர்கள்"], ["Forever in our hearts", "என்றும் எம் இதயங்களில்"]],
    birthday: [["Many happy returns", "இனிய பிறந்தநாள் வாழ்த்துகள்"], ["A smile for every year", "ஒவ்வோர் ஆண்டுக்கும் ஒரு புன்னகை"], ["With all our love", "எம் முழு அன்புடன்"]],
    wedding: [["Years of love, shared with children who need it", "பல ஆண்டு அன்பு, தேவையுள்ள குழந்தைகளுடன் பகிர்ந்து"], ["Together, still", "இன்றும் ஒன்றாக"]],
    newborn: [["Welcome to the world, little one", "உலகுக்கு வருக, சின்னஞ்சிறியவரே"], ["Your first gift is a smile for others", "உங்கள் முதல் அன்பளிப்பு பிறருக்கு ஒரு புன்னகை"]],
    success: [["So proud of you", "உங்களை நினைத்துப் பெருமைப்படுகிறோம்"], ["Your success, their day of joy", "உங்கள் வெற்றி, அவர்களின் மகிழ்ச்சியான நாள்"]],
    recovery: [["Thankful every day", "ஒவ்வொரு நாளும் நன்றியுடன்"], ["Health is the greatest gift", "ஆரோக்கியமே பெரிய செல்வம்"]],
    gratitude: [["Thank you for everything", "எல்லாவற்றுக்கும் நன்றி"], ["What you gave us, we give on", "நீங்கள் தந்ததை நாம் தொடர்ந்து கொடுக்கிறோம்"]],
    festival: [["Joy shared is joy doubled", "பகிர்ந்த மகிழ்ச்சி இரட்டிப்பு மகிழ்ச்சி"], ["Happy Deepavali", "இனிய தீபாவளி வாழ்த்துகள்"], ["Happy Thai Pongal", "இனிய தைப்பொங்கல் வாழ்த்துகள்"], ["Happy New Year", "இனிய புத்தாண்டு வாழ்த்துகள்"]],
    honour: [["You made us who we are", "நாம் இன்று இருப்பதற்கு நீங்களே காரணம்"], ["With respect and love", "மரியாதையுடனும் அன்புடனும்"]],
    custom: [["With all our love", "எம் முழு அன்புடன்"]]
  };

  var q = new URLSearchParams(location.search);
  var st = { k: q.get("for") || "memory", custom: "", name: "", note: "", from: "", project: "" };
  if (!OCCASIONS.some(function (o) { return o.k === st.k; })) st.k = "memory";
  var occ = function () { return OCCASIONS.filter(function (o) { return o.k === st.k; })[0]; };
  var art = function () { return "/img/moment/" + st.k + ".svg"; };
  var words = function () { var o = occ(); return o.k === "custom" ? st.custom.trim() : o.words[TA ? 1 : 0]; };

  root.innerHTML =
    '<section class="mo-hero">' +
      '<div class="mo-petals" aria-hidden="true">' + Array.apply(null, Array(14)).map(function (_, i) { return '<i style="--i:' + i + '"></i>'; }).join("") + "</div>" +
      '<div class="wrap mo-hero-in">' +
        '<img class="mo-lamp" data-hero-art src="/img/moment/memory.svg" alt="" width="320" height="420">' +
        '<div class="mo-hero-text">' +
          '<p class="mo-kicker">' + T("Raavanaa · A moment in their name", "ராவணா · அவர்கள் பெயரில் ஒரு தருணம்") + "</p>" +
          "<h1>" + T("Some days, we carry someone with us.", "சில நாட்களில், ஒருவரை நம்முடன் சுமந்து செல்கிறோம்.") + "</h1>" +
          '<p class="mo-lede">' + T("Remember someone you love, or mark a day that matters, by giving children in Sri Lanka a day of joy. Their name goes with it, and the smiles become theirs too.",
            "அன்புக்குரிய ஒருவரை நினைவுகூருங்கள், அல்லது முக்கியமான ஒரு நாளைக் கொண்டாடுங்கள்: இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குவதன் மூலம். அவர்களின் பெயர் அதனுடன் செல்லும்; அந்தப் புன்னகைகளும் அவர்களுடையதாகும்.") + "</p>" +
          '<a class="mo-start" href="#mo-step-1">' + T("Begin", "தொடங்குங்கள்") + ' <span aria-hidden="true">↓</span></a>' +
        "</div></div></section>" +
    '<div class="wrap mo-body">' +
      '<div class="mo-steps">' +
        '<section class="mo-step" id="mo-step-1"><p class="mo-num">1</p><h2>' + T("What is the moment?", "இது என்ன தருணம்?") + "</h2>" +
          '<div class="mo-occ" role="radiogroup" aria-label="' + T("The reason", "காரணம்") + '">' +
          OCCASIONS.map(function (o) { return '<button type="button" role="radio" class="mo-chip" data-k="' + o.k + '">' + icon(o.icon) + "<span>" + esc(TA ? o.ta : o.en) + "</span></button>"; }).join("") +
          "</div>" +
          '<label class="mo-field mo-custom" hidden><span>' + T("Your own words, before their name", "அவர்கள் பெயருக்கு முன் வர வேண்டிய உங்கள் வார்த்தைகள்") + '</span><input name="custom" maxlength="60" placeholder="' + T("e.g. With love from the whole family, for", "எ.கா. முழுக் குடும்பத்தின் அன்புடன்,") + '"></label>' +
        "</section>" +
        '<section class="mo-step"><p class="mo-num">2</p><h2>' + T("Who is it for?", "யாருக்காக?") + "</h2>" +
          '<label class="mo-field"><span>' + T("Their name", "அவர்களின் பெயர்") + '</span><input name="name" maxlength="60" list="mo-who" autocomplete="off" placeholder="' + T("e.g. Amma, Kamala Rajan", "எ.கா. அம்மா, கமலா ராஜன்") + '"></label>' +
          '<datalist id="mo-who">' + WHO.map(function (w) { return '<option value="' + esc(w) + '">'; }).join("") + "</datalist>" +
          '<div class="mo-quick" data-who-quick>' + WHO.slice(0, 8).map(function (w) { return '<button type="button" data-who="' + esc(w) + '">' + esc(w) + "</button>"; }).join("") + "</div>" +
          '<label class="mo-field"><span>' + T("A few words", "சில வார்த்தைகள்") + ' <small>' + T("(optional)", "(விருப்பமானால்)") + '</small></span><textarea name="note" maxlength="140" rows="2"></textarea></label>' +
          '<div class="mo-quick" data-sayings></div>' +
          '<label class="mo-field"><span>' + T("From", "அனுப்புபவர்") + ' <small>' + T("(optional)", "(விருப்பமானால்)") + '</small></span><input name="from" maxlength="60" placeholder="' + T("e.g. the Rajan family, Toronto", "எ.கா. ராஜன் குடும்பம், ரொறன்ரோ") + '"></label>' +
        "</section>" +
        '<section class="mo-step"><p class="mo-num">3</p><h2>' + T("Choose the day of joy", "மகிழ்ச்சியான நாளைத் தேர்ந்தெடுங்கள்") + "</h2>" +
          '<p class="mo-note">' + T("Your gift pays for a real day for real children. Every rupee is shown openly on the project page.", "உங்கள் அன்பளிப்பு உண்மையான குழந்தைகளுக்கான உண்மையான ஒரு நாளுக்குச் செல்கிறது. ஒவ்வொரு ரூபாயும் திட்டப் பக்கத்தில் வெளிப்படையாகக் காட்டப்படும்.") + "</p>" +
          '<div class="mo-projects" data-projects><p class="mo-note">' + T("Loading the days that need you…", "உங்களுக்காகக் காத்திருக்கும் நாட்கள் ஏற்றப்படுகின்றன…") + "</p></div>" +
        "</section>" +
      "</div>" +
      '<aside class="mo-side"><div class="mo-sticky">' +
        '<p class="mo-side-label">' + T("Their card", "அவர்களுக்கான அட்டை") + "</p>" +
        '<figure class="mo-card" data-card>' +
          '<img class="mo-card-lamp" data-card-art src="/img/moment/memory.svg" alt="" width="96" height="126">' +
          '<p class="mo-card-words" data-c-words></p>' +
          '<p class="mo-card-name" data-c-name></p>' +
          '<p class="mo-card-note" data-c-note></p>' +
          '<div class="mo-card-rule" aria-hidden="true"><i></i><b>❀</b><i></i></div>' +
          '<p class="mo-card-gift" data-c-gift></p>' +
          '<p class="mo-card-what" data-c-what></p>' +
          '<p class="mo-card-from" data-c-from></p>' +
          '<p class="mo-card-brand">raavanaa.org</p>' +
        "</figure>" +
        '<a class="mo-go" data-go href="/give">' + T("Continue to give", "கொடுக்கத் தொடருங்கள்") + "</a>" +
        '<div class="mo-card-actions"><button type="button" data-save>' + T("Save the card", "அட்டையைச் சேமி") + '</button><a data-wa target="_blank" rel="noopener">' + T("Send on WhatsApp", "வட்ஸ்அப்பில் அனுப்பு") + "</a></div>" +
        '<p class="mo-note mo-privacy">' + T("Their name shows on the project page only if you choose, on the next step. We never show children's names or faces.", "அடுத்த படியில் நீங்கள் தேர்ந்தெடுத்தால் மட்டுமே அவர்களின் பெயர் திட்டப் பக்கத்தில் காட்டப்படும். குழந்தைகளின் பெயர்களையோ முகங்களையோ நாம் ஒருபோதும் காட்டுவதில்லை.") + "</p>" +
      "</div></aside>" +
    "</div>";

  var $ = function (s) { return root.querySelector(s); };
  var input = function (n) { return root.querySelector('[name="' + n + '"]'); };
  var projects = [];

  function giveUrl() {
    var u = new URLSearchParams();
    if (st.project) u.set("project", st.project);
    u.set("tribute", st.k); u.set("tw", words()); if (st.name) u.set("tn", st.name); if (st.note) u.set("tnote", st.note);
    return (TA ? "/ta" : "") + "/give?" + u.toString() + "#give";
  }
  function giftLine() { return T("A day of joy for children, given in their name", "அவர்கள் பெயரில், குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாள்"); }
  function giftWhat() {
    var p = projects.filter(function (x) { return x.slug === st.project; })[0];
    return p ? p.short : T("Wherever it's needed most in Sri Lanka", "இலங்கையில் மிகவும் தேவையான இடத்தில்");
  }
  function draw() {
    root.querySelectorAll(".mo-chip").forEach(function (b) { var on = b.dataset.k === st.k; b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    $(".mo-custom").hidden = st.k !== "custom";
    var w = words();
    $("[data-c-words]").textContent = w || T("Your words", "உங்கள் வார்த்தைகள்");
    $("[data-c-name]").textContent = st.name || T("Their name", "அவர்களின் பெயர்");
    $("[data-c-name]").classList.toggle("ghost", !st.name);
    $("[data-c-note]").textContent = st.note ? "“" + st.note + "”" : "";
    $("[data-c-gift]").textContent = giftLine();
    $("[data-c-what]").textContent = giftWhat();
    $("[data-c-from]").textContent = st.from ? T("With love, ", "அன்புடன், ") + st.from : "";
    $("[data-card]").dataset.k = st.k;
    // Each reason has its own picture and colours (SURESH, 10 Nov 2026). Gemini pictures are on the to-do list.
    var th = occ().theme;
    root.style.setProperty("--tint", th[0]); root.style.setProperty("--accent", th[1]); root.style.setProperty("--frame", th[2]); root.style.setProperty("--petal", th[3]);
    if ($("[data-hero-art]").getAttribute("src") !== art()) { $("[data-hero-art]").setAttribute("src", art()); $("[data-card-art]").setAttribute("src", art()); }
    $("[data-go]").href = giveUrl();
    var link = location.origin + (TA ? "/ta" : "") + "/moment";
    var msg = (w ? w + " " : "") + (st.name || "") + (st.note ? "\n“" + st.note + "”" : "") + "\n" +
      T("I am giving children in Sri Lanka a day of joy in their name. You can make a moment too: ", "அவர்கள் பெயரில் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறேன். நீங்களும் ஒரு தருணத்தை உருவாக்கலாம்: ") + link;
    $("[data-wa]").href = "https://wa.me/?text=" + encodeURIComponent(msg);
    var says = SAYINGS[st.k] || [];
    $("[data-sayings]").innerHTML = says.map(function (s) { var t = s[TA ? 1 : 0]; return '<button type="button" data-say="' + esc(t) + '">' + esc(t) + "</button>"; }).join("");
    root.querySelectorAll(".mo-proj").forEach(function (b) { b.classList.toggle("on", b.dataset.slug === st.project); b.setAttribute("aria-checked", b.dataset.slug === st.project ? "true" : "false"); });
  }

  root.addEventListener("click", function (e) {
    var t = e.target.closest("button, a");
    if (!t || !root.contains(t)) return;
    if (t.classList.contains("mo-chip")) { st.k = t.dataset.k; draw(); if (st.k === "custom") input("custom").focus(); }
    else if (t.dataset.who) { input("name").value = st.name = t.dataset.who; draw(); input("name").focus(); }
    else if (t.dataset.say) { input("note").value = st.note = t.dataset.say; draw(); }
    else if (t.classList.contains("mo-proj")) { st.project = t.dataset.slug; draw(); }
    else if (t.hasAttribute("data-save")) saveCard();
  });
  root.addEventListener("input", function (e) {
    var n = e.target.name;
    if (n === "custom" || n === "name" || n === "note" || n === "from") { st[n] = e.target.value.replace(/\s+/g, " ").replace(/^\s/, ""); draw(); }
  });

  // The days that still need sponsors: Initiated projects, visited and verified, not fully funded.
  var num = function (v) { var n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
  Promise.all([
    fetch("/projects.json").then(function (r) { return r.json(); }).catch(function () { return { projects: [] }; }),
    fetch("/share.json").then(function (r) { return r.json(); }).catch(function () { return null; })
  ]).then(function (res) {
    var share = res[1] && res[1].projects || {};
    projects = (res[0].projects || []).filter(function (p) {
      if (!p || p.hidden || !p.verified || /complete/i.test(p.status || "")) return false;
      var goal = num(p.goal) || (p.budget || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0);
      var raised = (p.funders || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0);
      p._left = goal - raised; p._goal = goal; p._pct = goal ? Math.round(raised / goal * 100) : 0;
      return goal > 0 && raised < goal && /^rs/i.test(String(p.currency || "").trim());
    }).map(function (p) {
      var sh = share[p.slug] || {};
      return { slug: p.slug, title: (TA && sh.title_ta) || sh.title || p.title, short: (TA && sh.title_ta) || sh.title || p.title, art: sh.art || (/\.svg$/.test(p.cover || "") ? p.cover : "/img/project-hills.svg"), left: p._left, pct: p._pct, cur: String(p.currency || "Rs ").trim() };
    });
    var box = $("[data-projects]");
    box.setAttribute("role", "radiogroup");
    box.innerHTML = projects.map(function (p) {
      return '<button type="button" role="radio" class="mo-proj" data-slug="' + esc(p.slug) + '"><span class="mo-proj-art" style="background-image:url(\'' + esc(p.art) + '\')"></span>' +
        '<span class="mo-proj-text"><b>' + esc(p.title) + "</b><small>" + esc(p.cur) + " " + Math.round(p.left).toLocaleString("en-US") + T(" still needed", " இன்னும் தேவை") + " · " + p.pct + "%</small>" +
        '<span class="mo-bar"><i style="width:' + p.pct + '%"></i></span></span></button>';
    }).join("") +
      '<button type="button" role="radio" class="mo-proj mo-proj-any" data-slug=""><span class="mo-proj-art any" aria-hidden="true">❀</span><span class="mo-proj-text"><b>' + T("Wherever it's needed most", "மிகவும் தேவையான இடத்தில்") + "</b><small>" + T("The team chooses the next day of joy", "அடுத்த மகிழ்ச்சியான நாளைக் குழு தேர்ந்தெடுக்கும்") + "</small></span></button>";
    if (projects.length && !q.get("any")) st.project = projects[0].slug;
    var want = q.get("project"); if (want && projects.some(function (p) { return p.slug === want; })) st.project = want;
    draw();
  });

  // Save the card as a picture (1080 x 1350, the size Instagram and WhatsApp show best).
  function saveCard() {
    var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
    var g = c.getContext("2d");
    var th = occ().theme;
    var bg = g.createRadialGradient(W / 2, 260, 40, W / 2, 400, 900); bg.addColorStop(0, th[0]); bg.addColorStop(1, "#fbf6ea");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = th[2]; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, H - 80);
    g.lineWidth = 2; g.strokeRect(58, 58, W - 116, H - 116);
    var serif = TA ? "'Noto Serif Tamil', serif" : "'Cormorant Garamond', Georgia, serif";
    var wrap = function (text, font, y, max, lh, color) {
      g.font = font; g.fillStyle = color; g.textAlign = "center";
      var ws = String(text).split(" "), line = "", lines = [];
      ws.forEach(function (w) { var t = line ? line + " " + w : w; if (g.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; });
      if (line) lines.push(line);
      lines.forEach(function (l, i) { g.fillText(l, W / 2, y + i * lh); });
      return y + lines.length * lh;
    };
    var img = new Image();
    img.onload = function () {
      g.drawImage(img, W / 2 - 120, 110, 240, 315);
      var y = wrap(words() || "", "italic 500 " + (TA ? 40 : 50) + "px " + serif, 500, 860, TA ? 60 : 62, th[1]);
      y = wrap(st.name || "", "600 " + (TA ? 64 : 78) + "px " + (TA ? serif : "Cinzel, serif"), y + 70, 900, TA ? 88 : 92, "#1f4d3a");
      if (st.note) y = wrap("“" + st.note + "”", "italic 500 " + (TA ? 34 : 42) + "px " + serif, y + 40, 840, TA ? 54 : 56, "#2d5c48");
      g.strokeStyle = th[2]; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 220, y + 40); g.lineTo(W / 2 - 40, y + 40); g.moveTo(W / 2 + 40, y + 40); g.lineTo(W / 2 + 220, y + 40); g.stroke();
      g.font = "34px serif"; g.fillStyle = "#e4761b"; g.textAlign = "center"; g.fillText("❀", W / 2, y + 52);
      y = wrap(giftLine(), "600 " + (TA ? 30 : 36) + "px " + serif, y + 120, 860, 48, "#1f4d3a");
      y = wrap(giftWhat(), "italic 500 " + (TA ? 26 : 32) + "px " + serif, y + 4, 860, 44, "#5d6b64");
      if (st.from) wrap(T("With love, ", "அன்புடன், ") + st.from, "italic 500 " + (TA ? 30 : 36) + "px " + serif, y + 20, 860, 48, "#5d6b64");
      g.font = "600 30px Inter, sans-serif"; g.fillStyle = "#b0812a"; g.fillText("raavanaa.org", W / 2, H - 100);
      c.toBlob(function (b) {
        var file = new File([b], "raavanaa-moment.jpg", { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(function () {}); return; }
        var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      }, "image/jpeg", 0.92);
    };
    img.src = art();
  }

  draw();
})();
