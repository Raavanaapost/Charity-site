/* "A moment in their name" (/moment, /ta/moment), SURESH 10 Nov 2026.
   The reasons sit right at the top: a giver taps one (in loving memory, a birthday, a wedding anniversary, on
   behalf of a family... or their own words), types the name and a few words, sees the card come alive, and picks
   where the joy goes: a project, the Raavanaa Fund, or a wish of their own. Under "Continue to give" they can make
   it a moment every year (with a reminder) and make a family page so others give to the same moment (/m/<code>).
   Below, every project at a glance, in category tabs. The name is the person being remembered or celebrated
   (or the family or group giving), never a child's. */
(function () {
  "use strict";
  var TA = /^\/ta(\/|$)/.test(location.pathname);
  var root = document.getElementById("moment");
  if (!root) return;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var T = function (en, ta) { return TA ? ta : en; };
  var L = TA ? "/ta" : "";

  // The reasons. `words` is what the card and the project page say before the name; `lede` is the line under the title.
  var OCCASIONS = [
    { k: "memory", theme: ["#fff3cf", "#8a5c12", "#c9a24a", "#f29a1f"], icon: "lamp", en: "In loving memory", ta: "அன்பு நினைவாக", words: ["In loving memory of", "அன்பு நினைவாக:"],
      lede: ["Some days, we carry someone with us. Give children a day of joy in their name, and let their kindness live on.", "சில நாட்களில், ஒருவரை நம்முடன் சுமந்து செல்கிறோம். அவர்கள் பெயரில் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குங்கள்; அவர்களின் கருணை தொடர்ந்து வாழட்டும்."] },
    { k: "remembrance", theme: ["#f6f1e4", "#6b5a3a", "#b9a77a", "#fffdf6"], icon: "lamp", en: "Remembrance day", ta: "நினைவு நாள்", words: ["Remembering, on the anniversary of", "நினைவு நாளில் நினைவுகூர்ந்து:"],
      lede: ["Every year on their day, light a lamp the way they would have loved: with children laughing.", "ஒவ்வோர் ஆண்டும் அவர்களின் நாளில், அவர்கள் விரும்பியபடி ஒரு விளக்கேற்றுங்கள்: குழந்தைகளின் சிரிப்புடன்."] },
    { k: "birthday", theme: ["#ffe3ea", "#b83b62", "#e8899f", "#e8547a"], icon: "cake", en: "A birthday", ta: "பிறந்தநாள்", words: ["Celebrating the birthday of", "பிறந்தநாள் வாழ்த்துடன்:"],
      lede: ["Another year to celebrate. Share the joy with children who have never had a day out.", "கொண்டாட இன்னோர் ஆண்டு. ஒருநாளும் வெளியே சென்றிராத குழந்தைகளுடன் அந்த மகிழ்ச்சியைப் பகிருங்கள்."] },
    { k: "wedding", theme: ["#ffe7d6", "#a8321e", "#c9a24a", "#c8381e"], icon: "rings", en: "Wedding anniversary", ta: "திருமண நாள்", words: ["Celebrating the wedding anniversary of", "திருமண நாள் வாழ்த்துடன்:"],
      lede: ["Years of love, shared. Mark your anniversary with a day the children will never forget.", "பல ஆண்டு அன்பு, பகிர்ந்து. குழந்தைகள் என்றும் மறக்காத ஒரு நாளுடன் உங்கள் திருமண நாளைக் கொண்டாடுங்கள்."] },
    { k: "newborn", theme: ["#e3f0ff", "#3b6aa8", "#9ec0e8", "#a9c8f0"], icon: "cradle", en: "A new baby", ta: "புதிய குழந்தை", words: ["Welcoming", "அன்புடன் வரவேற்று:"],
      lede: ["A new life, a new smile. Let their very first gift be joy for other children.", "புதிய உயிர், புதிய புன்னகை. அவர்களின் முதல் அன்பளிப்பு பிற குழந்தைகளுக்கு மகிழ்ச்சியாக இருக்கட்டும்."] },
    { k: "success", theme: ["#fff0c7", "#1f3b63", "#c9a24a", "#f2b33d"], icon: "star", en: "Exams or graduation", ta: "தேர்வு / பட்டம்", words: ["Celebrating the success of", "வெற்றியைக் கொண்டாடி:"],
      lede: ["Exams passed, a degree done. Turn a proud day into a day out for children.", "தேர்வில் வெற்றி, பட்டம் நிறைவு. பெருமைமிகு நாளைக் குழந்தைகளுக்கான ஒரு மகிழ்ச்சியான நாளாக மாற்றுங்கள்."] },
    { k: "recovery", theme: ["#eef7df", "#3f7a3a", "#8cc07a", "#78b36f"], icon: "leaf", en: "Getting well", ta: "நலம் பெற்றது", words: ["Giving thanks for the recovery of", "நலம் பெற்றதற்கு நன்றியுடன்:"],
      lede: ["Back in good health. Say thank you with a day of joy for children who need it.", "மீண்டும் நலமுடன். தேவையுள்ள குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளுடன் நன்றி சொல்லுங்கள்."] },
    { k: "gratitude", theme: ["#ffe1dc", "#b0423a", "#e8a093", "#e2493a"], icon: "hands", en: "With gratitude", ta: "நன்றியுடன்", words: ["With gratitude for", "நன்றியுடன்:"],
      lede: ["For a teacher, a friend, a helping hand: say thank you in a way that keeps on giving.", "ஓர் ஆசிரியர், ஒரு நண்பர், ஓர் உதவிக்கரம்: தொடர்ந்து பலன் தரும் வகையில் நன்றி சொல்லுங்கள்."] },
    { k: "festival", theme: ["#fff0c2", "#b5532a", "#f2b33d", "#f29a1f"], icon: "kolam", en: "A festival", ta: "பண்டிகை", words: ["A festival gift in the name of", "பண்டிகைப் பரிசாக, பெயரில்:"],
      lede: ["Deepavali, Thai Pongal, New Year: festivals are for sharing. Bring children into the celebration.", "தீபாவளி, தைப்பொங்கல், புத்தாண்டு: பண்டிகைகள் பகிர்வதற்கே. குழந்தைகளையும் கொண்டாட்டத்தில் சேருங்கள்."] },
    { k: "honour", theme: ["#f3efd8", "#1f4d3a", "#c9a24a", "#e6b94f"], icon: "crown", en: "In honour of", ta: "கௌரவிக்க", words: ["In honour of", "கௌரவிக்கும் வகையில்:"],
      lede: ["Honour someone who shaped you, with a day that shapes a child's happiest memories.", "உங்களை உருவாக்கிய ஒருவரைக் கௌரவியுங்கள்: ஒரு குழந்தையின் இனிய நினைவுகளை உருவாக்கும் ஒரு நாளுடன்."] },
    { k: "behalf", theme: ["#e4f1e6", "#1f5c45", "#7fb394", "#4f9a6f"], icon: "people", en: "On behalf of", ta: "சார்பாக", words: ["Given on behalf of", "சார்பில் வழங்கப்பட்டது:"],
      lede: ["Giving for your family, your friends, your workplace or your temple? Give together, in one name.", "உங்கள் குடும்பம், நண்பர்கள், பணியிடம் அல்லது கோவில் சார்பாகக் கொடுக்கிறீர்களா? ஒரே பெயரில், ஒன்றாகக் கொடுங்கள்."] },
    { k: "custom", theme: ["#ffe3ee", "#b0457a", "#f2a3c0", "#f48fb1"], icon: "pen", en: "My own words", ta: "என் சொந்த வார்த்தைகள்", words: ["", ""],
      lede: ["Your reason, your words. Every moment that matters can make a child smile.", "உங்கள் காரணம், உங்கள் வார்த்தைகள். முக்கியமான ஒவ்வொரு தருணமும் ஒரு குழந்தையைப் புன்னகைக்க வைக்கலாம்."] }
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
    people: '<circle cx="8" cy="8.5" r="2.6"/><circle cx="16.5" cy="9.5" r="2.2"/><path d="M3 19c0-3.2 2.200-5.200 5-5.200s5 2 5 5.200M14 14.300c.8-.4 1.600-.6 2.500-.6 2.500 0 4.500 1.800 4.500 4.800"/>',
    pen: '<path d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3"/>'
  };
  var icon = function (k) { return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[k] + "</svg>"; };
  var WHO = TA ? ["அம்மா", "அப்பா", "அம்மம்மா", "அப்பம்மா", "அப்பப்பா", "அம்மப்பா", "ஆச்சி", "தாத்தா", "பாட்டி", "அக்கா", "அண்ணா", "தம்பி", "தங்கை", "என் மனைவி", "என் கணவர்", "என் மகன்", "என் மகள்", "என் நண்பர்", "என் ஆசிரியர்"]
    : ["Amma", "Appa", "Ammamma", "Appamma", "Appappa", "Ammappa", "Aachchi", "Thatha", "Paati", "Akka", "Anna", "Thambi", "Thangachchi", "my wife", "my husband", "my son", "my daughter", "my friend", "my teacher"];
  // "On behalf of": a family, a group of friends, a workplace, a temple...
  var GROUPS = TA ? ["எம் குடும்பம்", "எம் நண்பர்கள்", "எம் பழைய மாணவர்கள்", "எம் கோவில்", "எம் பணியிடக் குழு", "எம் சமூகம்"]
    : ["our family", "our friends", "our old students", "our temple", "our team at work", "our community"];
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
    behalf: [["Together, for the children", "குழந்தைகளுக்காக, ஒன்றாக"], ["From all of us, with love", "எம் அனைவரிடமிருந்தும், அன்புடன்"]],
    custom: [["With all our love", "எம் முழு அன்புடன்"]]
  };


  var q = new URLSearchParams(location.search);
  var today = function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  // project: a slug, "" (the Raavanaa Fund) or "wish" (their own wish)
  var st = { k: q.get("for") || "memory", custom: "", name: "", note: "", from: "", project: "", wish: "", every: "once", day: today(), remind: true, code: "", cat: "All" };
  if (!OCCASIONS.some(function (o) { return o.k === st.k; })) st.k = "memory";
  var occ = function () { return OCCASIONS.filter(function (o) { return o.k === st.k; })[0]; };
  // Gemini paintings, one per reason (10 Nov 2026); the hand-drawn .svg versions stay as a fallback.
  var art = function () { return "/img/moment/" + st.k + ".jpg"; };
  var words = function () { var o = occ(); return o.k === "custom" ? st.custom.trim() : o.words[TA ? 1 : 0]; };

  root.innerHTML =
    '<section class="mo-hero">' +
      '<div class="mo-petals" aria-hidden="true">' + Array.apply(null, Array(14)).map(function (_, i) { return '<i style="--i:' + i + '"></i>'; }).join("") + "</div>" +
      '<div class="wrap mo-hero-in">' +
        '<img class="mo-lamp" data-hero-art src="/img/moment/memory.jpg" alt="" width="300" height="400">' +
        '<div class="mo-hero-text">' +
          '<p class="mo-kicker">' + T("Raavanaa · A moment in their name", "ராவணா · அவர்கள் பெயரில் ஒரு தருணம்") + "</p>" +
          "<h1>" + T("Your moment. <em>Their smile.</em>", "உங்கள் தருணம். <em>அவர்களின் புன்னகை.</em>") + "</h1>" +
          '<p class="mo-lede" data-lede></p>' +
        "</div>" +
        '<div class="mo-pick" id="mo-step-1">' +
          '<p class="mo-pick-q"><span class="mo-num">1</span>' + T("Tap the one that is close to your heart", "உங்கள் இதயத்துக்கு நெருக்கமானதைத் தொடுங்கள்") + "</p>" +
          '<div class="mo-occ" role="radiogroup" aria-label="' + T("The reason", "காரணம்") + '">' +
          OCCASIONS.map(function (o) { return '<button type="button" role="radio" class="mo-chip" data-k="' + o.k + '">' + icon(o.icon) + "<span>" + esc(TA ? o.ta : o.en) + "</span></button>"; }).join("") +
          "</div>" +
          '<label class="mo-field mo-custom" hidden><span>' + T("Your own words, before their name", "அவர்கள் பெயருக்கு முன் வர வேண்டிய உங்கள் வார்த்தைகள்") + '</span><input name="custom" maxlength="60" placeholder="' + T("e.g. With love from the whole family, for", "எ.கா. முழுக் குடும்பத்தின் அன்புடன்,") + '"></label>' +
        "</div>" +
      "</div></section>" +
    '<div class="wrap mo-body">' +
      '<div class="mo-steps">' +
        '<section class="mo-step" id="mo-step-2"><p class="mo-num">2</p><h2 data-who-h></h2>' +
          '<label class="mo-field"><span data-name-l></span><input name="name" maxlength="60" list="mo-who" autocomplete="off"></label>' +
          '<datalist id="mo-who">' + WHO.map(function (w) { return '<option value="' + esc(w) + '">'; }).join("") + "</datalist>" +
          '<div class="mo-quick" data-who-quick></div>' +
          '<label class="mo-field"><span>' + T("A few words", "சில வார்த்தைகள்") + ' <small>' + T("(optional)", "(விருப்பமானால்)") + '</small></span><textarea name="note" maxlength="140" rows="2"></textarea></label>' +
          '<div class="mo-quick" data-sayings></div>' +
          '<label class="mo-field" data-from-field><span>' + T("From", "அனுப்புபவர்") + ' <small>' + T("(optional)", "(விருப்பமானால்)") + '</small></span><input name="from" maxlength="60" placeholder="' + T("e.g. the Rajan family, Toronto", "எ.கா. ராஜன் குடும்பம், ரொறன்ரோ") + '"></label>' +
        "</section>" +
        '<section class="mo-step" id="mo-step-3"><p class="mo-num">3</p><h2>' + T("Where should the joy go?", "மகிழ்ச்சி எங்கே செல்ல வேண்டும்?") + "</h2>" +
          '<p class="mo-note">' + T("Your gift pays for a real day for real children. Every rupee is shown openly.", "உங்கள் அன்பளிப்பு உண்மையான குழந்தைகளுக்கான உண்மையான ஒரு நாளுக்குச் செல்கிறது. ஒவ்வொரு ரூபாயும் வெளிப்படையாகக் காட்டப்படும்.") + "</p>" +
          '<div class="mo-projects" data-projects><p class="mo-note">' + T("Loading the days that need you…", "உங்களுக்காகக் காத்திருக்கும் நாட்கள் ஏற்றப்படுகின்றன…") + "</p></div>" +
          '<label class="mo-field mo-wish" data-wish-field hidden><span>' + T("Tell us your wish", "உங்கள் விருப்பத்தைச் சொல்லுங்கள்") + '</span><textarea name="wish" maxlength="300" rows="3" placeholder="' + T("e.g. school shoes for a class, a meal at an elders' home, books for a village library", "எ.கா. ஒரு வகுப்புக்குப் பாடசாலைக் காலணிகள், முதியோர் இல்லத்தில் ஒரு உணவு, கிராம நூலகத்துக்குப் புத்தகங்கள்") + '"></textarea>' +
            '<small>' + T("Your gift waits safely in the Raavanaa Fund. A volunteer will write to you, and we will show you the day it made happen.", "உங்கள் அன்பளிப்பு ராவணா நிதியத்தில் பாதுகாப்பாகக் காத்திருக்கும். ஒரு தன்னார்வலர் உங்களுக்கு எழுதுவார்; அது உருவாக்கிய நாளை நாம் உங்களுக்குக் காட்டுவோம்.") + "</small></label>" +
        "</section>" +
      "</div>" +
      '<aside class="mo-side"><div class="mo-sticky">' +
        '<p class="mo-side-label">' + T("Their card", "அவர்களுக்கான அட்டை") + "</p>" +
        '<figure class="mo-card" data-card>' +
          '<img class="mo-card-lamp" data-card-art src="/img/moment/memory.jpg" alt="" width="150" height="200">' +
          '<p class="mo-card-words" data-c-words></p>' +
          '<p class="mo-card-name" data-c-name></p>' +
          '<p class="mo-card-note" data-c-note></p>' +
          '<div class="mo-card-rule" aria-hidden="true"><i></i><b>❀</b><i></i></div>' +
          '<p class="mo-card-gift" data-c-gift></p>' +
          '<p class="mo-card-what" data-c-what></p>' +
          '<p class="mo-card-from" data-c-from></p>' +
          '<img class="mo-card-logo" src="/img/logo.webp?v=6" alt="Raavanaa" width="900" height="298">' +
        "</figure>" +
        '<a class="mo-go" data-go href="/give">' + T("Continue to give", "கொடுக்கத் தொடருங்கள்") + "</a>" +
        '<details class="mo-fold" data-every-fold><summary><span aria-hidden="true">↻</span> ' + T("Make it a moment every year?", "ஒவ்வோர் ஆண்டும் இந்தத் தருணத்தை உருவாக்கவா?") + "</summary>" +
          '<div class="mo-fold-in">' +
            '<div class="mo-seg" role="radiogroup" aria-label="' + T("How often", "எத்தனை முறை") + '">' +
              '<button type="button" role="radio" data-every="once">' + T("Just this once", "இம்முறை மட்டும்") + "</button>" +
              '<button type="button" role="radio" data-every="year">' + T("Every year", "ஒவ்வோர் ஆண்டும்") + "</button></div>" +
            '<div data-every-year hidden>' +
              '<label class="mo-field"><span>' + T("Their day", "அவர்களின் நாள்") + ' <small>' + T("(the date to remember)", "(நினைவில் கொள்ள வேண்டிய திகதி)") + '</small></span><input type="date" name="day"></label>' +
              '<label class="mo-check"><input type="checkbox" name="remind" checked> <span>' + T("Remind me a week before, every year", "ஒவ்வோர் ஆண்டும் ஒரு வாரத்துக்கு முன் எனக்கு நினைவூட்டுங்கள்") + "</span></label>" +
              '<p class="mo-note">' + T("We will send a gentle reminder by email or WhatsApp, to the details you give on the next step. Nothing is charged by itself, and you can stop it at any time.", "அடுத்த படியில் நீங்கள் தரும் மின்னஞ்சலுக்கு அல்லது வட்ஸ்அப் இலக்கத்துக்கு ஓர் இனிய நினைவூட்டலை அனுப்புவோம். தானாக எந்தப் பணமும் அறவிடப்படாது; எப்போது வேண்டுமானாலும் நிறுத்தலாம்.") + "</p>" +
            "</div>" +
          "</div></details>" +
        '<div class="mo-together">' +
          '<p class="mo-together-h">' + T("Giving with family and friends?", "குடும்பத்துடனும் நண்பர்களுடனும் சேர்ந்து கொடுக்கிறீர்களா?") + "</p>" +
          '<p class="mo-note" data-together-text></p>' +
          '<button type="button" class="mo-together-btn" data-together>' + T("Make a family page", "குடும்பப் பக்கத்தை உருவாக்கு") + "</button>" +
          '<p class="mo-note mo-together-msg" data-together-msg role="status" hidden></p>' +
          '<div class="mo-together-out" data-together-out hidden>' +
            '<p class="mo-note">' + T("Your family page is ready. Share it:", "உங்கள் குடும்பப் பக்கம் தயார். இதைப் பகிருங்கள்:") + "</p>" +
            '<input readonly data-together-link aria-label="' + T("The link to your family page", "உங்கள் குடும்பப் பக்கத்தின் இணைப்பு") + '">' +
            '<div class="mo-card-actions three"><button type="button" data-together-copy>' + T("Copy link", "இணைப்பை நகலெடு") + '</button><a data-together-wa target="_blank" rel="noopener">WhatsApp</a><a data-together-open>' + T("Open", "திற") + "</a></div>" +
          "</div>" +
        "</div>" +
        '<div class="mo-card-actions"><button type="button" data-save>' + T("Save the card", "அட்டையைச் சேமி") + '</button><a data-wa target="_blank" rel="noopener">' + T("Send on WhatsApp", "வட்ஸ்அப்பில் அனுப்பு") + "</a></div>" +
        '<p class="mo-note mo-privacy">' + T("Their name shows on the project page only if you choose, on the next step. We never show children's names or faces.", "அடுத்த படியில் நீங்கள் தேர்ந்தெடுத்தால் மட்டுமே அவர்களின் பெயர் திட்டப் பக்கத்தில் காட்டப்படும். குழந்தைகளின் பெயர்களையோ முகங்களையோ நாம் ஒருபோதும் காட்டுவதில்லை.") + "</p>" +
      "</div></aside>" +
    "</div>" +
    '<section class="mo-all" id="projects"><div class="wrap">' +
      '<p class="mo-kicker">' + T("Every day of joy", "ஒவ்வொரு மகிழ்ச்சியான நாளும்") + "</p>" +
      "<h2>" + T("All projects, at a glance", "அனைத்துத் திட்டங்களும், ஒரே பார்வையில்") + "</h2>" +
      '<div class="mo-tabs" role="tablist" data-tabs></div>' +
      '<ul class="mo-list" data-list><li class="mo-note">' + T("Loading…", "ஏற்றப்படுகிறது…") + "</li></ul>" +
      '<p class="mo-all-foot"><a href="' + L + '/fund">' + T("Not sure which? Give to the Raavanaa Fund", "எது என்று தெரியவில்லையா? ராவணா நிதியத்துக்குக் கொடுங்கள்") + ' →</a><a href="' + L + '/initiate">' + T("Know children who need a day of joy? Start a project", "மகிழ்ச்சியான ஒரு நாள் தேவைப்படும் குழந்தைகளைத் தெரியுமா? ஒரு திட்டத்தைத் தொடங்குங்கள்") + " →</a></p>" +
    "</div></section>";

  var $ = function (s) { return root.querySelector(s); };
  var input = function (n) { return root.querySelector('[name="' + n + '"]'); };
  var projects = [];   // the days that still need sponsors (step 3)
  var all = [];        // every public project (the list at the bottom)
  input("day").value = st.day;

  function tributeParams(u) {
    u.set("tribute", st.k); u.set("tw", words()); if (st.name) u.set("tn", st.name); if (st.note) u.set("tnote", st.note);
    if (st.every === "year" && st.day) { u.set("every", "year"); u.set("day", st.day); if (st.remind) u.set("remind", "1"); }
    if (st.code) u.set("m", st.code);
    return u;
  }
  function giveUrl() {
    var u = new URLSearchParams();
    // The Raavanaa Fund and "a wish of my own" go to the fund page; a project goes to its own Give form.
    if (st.project === "wish") { if (st.wish) u.set("wish", st.wish); return L + "/fund?" + tributeParams(u).toString() + "#give"; }
    if (!st.project) return L + "/fund?" + tributeParams(u).toString() + "#give";
    u.set("project", st.project);
    return L + "/give?" + tributeParams(u).toString() + "#give";
  }
  function giftLine() { return st.k === "behalf" ? T("A day of joy for children, given together", "குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாள், ஒன்றாக வழங்கப்பட்டது") : T("A day of joy for children, given in their name", "அவர்கள் பெயரில், குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாள்"); }
  function giftWhat() {
    if (st.project === "wish") return st.wish ? T("A wish: ", "விருப்பம்: ") + st.wish : T("A wish of their own", "அவர்களின் சொந்த விருப்பம்");
    var p = projects.filter(function (x) { return x.slug === st.project; })[0];
    return p ? p.short : T("The Raavanaa Fund, for the next day of joy", "ராவணா நிதியம், அடுத்த மகிழ்ச்சியான நாளுக்கு");
  }
  var lastK = "";
  function draw() {
    root.querySelectorAll(".mo-chip").forEach(function (b) { var on = b.dataset.k === st.k; b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    $(".mo-custom").hidden = st.k !== "custom";
    var group = st.k === "behalf", w = words();
    $("[data-lede]").textContent = occ().lede[TA ? 1 : 0];
    if (lastK !== st.k) {
      // step 2 asks for a person, or for a family or group when it is "on behalf of"
      $("[data-who-h]").textContent = group ? T("On behalf of whom?", "யார் சார்பாக?") : T("Who is it for?", "யாருக்காக?");
      $("[data-name-l]").textContent = group ? T("The family, group or person", "குடும்பம், குழு அல்லது நபர்") : T("Their name", "அவர்களின் பெயர்");
      input("name").placeholder = group ? T("e.g. the Rajan family, Class of 1998", "எ.கா. ராஜன் குடும்பம், 1998 வகுப்பு") : T("e.g. Amma, Kamala Rajan", "எ.கா. அம்மா, கமலா ராஜன்");
      $("[data-who-quick]").innerHTML = (group ? GROUPS : WHO.slice(0, 8)).map(function (x) { return '<button type="button" data-who="' + esc(x) + '">' + esc(x) + "</button>"; }).join("");
      $("[data-from-field]").hidden = group;
      var says = SAYINGS[st.k] || [];
      $("[data-sayings]").innerHTML = says.map(function (s) { var t = s[TA ? 1 : 0]; return '<button type="button" data-say="' + esc(t) + '">' + esc(t) + "</button>"; }).join("");
      lastK = st.k;
    }
    $("[data-c-words]").textContent = w || T("Your words", "உங்கள் வார்த்தைகள்");
    $("[data-c-name]").textContent = st.name || (group ? T("Your family or group", "உங்கள் குடும்பம் அல்லது குழு") : T("Their name", "அவர்களின் பெயர்"));
    $("[data-c-name]").classList.toggle("ghost", !st.name);
    $("[data-c-note]").textContent = st.note ? "“" + st.note + "”" : "";
    $("[data-c-gift]").textContent = giftLine();
    $("[data-c-what]").textContent = giftWhat();
    $("[data-c-from]").textContent = st.from && !group ? T("With love, ", "அன்புடன், ") + st.from : "";
    $("[data-card]").dataset.k = st.k;
    // Each reason has its own picture and colours (SURESH, 10 Nov 2026).
    var th = occ().theme;
    root.style.setProperty("--tint", th[0]); root.style.setProperty("--accent", th[1]); root.style.setProperty("--frame", th[2]); root.style.setProperty("--petal", th[3]);
    if ($("[data-hero-art]").getAttribute("src") !== art()) { $("[data-hero-art]").setAttribute("src", art()); $("[data-card-art]").setAttribute("src", art()); }
    $("[data-go]").href = giveUrl();
    var link = location.origin + L + "/moment";
    var msg = (w ? w + " " : "") + (st.name || "") + (st.note ? "\n“" + st.note + "”" : "") + "\n" +
      T("I am giving children in Sri Lanka a day of joy in their name. You can make a moment too: ", "அவர்கள் பெயரில் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறேன். நீங்களும் ஒரு தருணத்தை உருவாக்கலாம்: ") + link;
    $("[data-wa]").href = "https://wa.me/?text=" + encodeURIComponent(msg);
    root.querySelectorAll(".mo-proj").forEach(function (b) { b.classList.toggle("on", b.dataset.slug === st.project); b.setAttribute("aria-checked", b.dataset.slug === st.project ? "true" : "false"); });
    $("[data-wish-field]").hidden = st.project !== "wish";
    // every year?
    root.querySelectorAll("[data-every]").forEach(function (b) { var on = b.dataset.every === st.every; b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    $("[data-every-year]").hidden = st.every !== "year";
    // the family page
    $("[data-together-text]").textContent = st.name
      ? T("Make a page for " + st.name + ". Share it, and everyone can give to the same moment.", st.name + " அவர்களுக்காக ஒரு பக்கத்தை உருவாக்குங்கள். அதைப் பகிருங்கள்; அனைவரும் இதே தருணத்துக்குக் கொடுக்கலாம்.")
      : T("Make a page for them. Share it, and everyone can give to the same moment.", "அவர்களுக்காக ஒரு பக்கத்தை உருவாக்குங்கள். அதைப் பகிருங்கள்; அனைவரும் இதே தருணத்துக்குக் கொடுக்கலாம்.");
    $("[data-together-out]").hidden = !st.code;
    $("[data-together]").hidden = !!st.code;
    if (st.code) {
      var page = location.origin + L + "/m/" + st.code;
      $("[data-together-link]").value = page;
      $("[data-together-open]").href = L + "/m/" + st.code;
      $("[data-together-wa]").href = "https://wa.me/?text=" + encodeURIComponent((w ? w + " " : "") + st.name + (st.note ? "\n“" + st.note + "”" : "") + "\n" +
        T("We are giving children in Sri Lanka a day of joy in their name. Join us here: ", "அவர்கள் பெயரில் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறோம். எம்முடன் இணையுங்கள்: ") + page);
    }
  }
  // Anything on the card changed: the family page made earlier no longer matches, so a new one is offered.
  function stale() { if (st.code) { st.code = ""; $("[data-together-msg]").hidden = true; } }

  function makeTogether() {
    var msg = $("[data-together-msg]"), btn = $("[data-together]");
    var say = function (t) { msg.hidden = false; msg.textContent = t; };
    if (!st.name) { say(T("Add their name first, in step 2.", "முதலில் படி 2 இல் அவர்களின் பெயரைச் சேருங்கள்.")); input("name").focus(); return; }
    if (!words()) { say(T("Add your own words first, at the top.", "முதலில் மேலே உங்கள் சொந்த வார்த்தைகளைச் சேருங்கள்.")); input("custom").focus(); return; }
    btn.disabled = true; say(T("Making the page…", "பக்கம் உருவாக்கப்படுகிறது…"));
    fetch("/api/moments", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: st.k, words: words(), name: st.name, note: st.note, from: st.k === "behalf" ? "" : st.from, project: st.project && st.project !== "wish" ? st.project : "", wish: st.project === "wish" ? st.wish : "", day: st.every === "year" ? st.day : "", lang: TA ? "ta" : "en" }) })
      .then(function (r) { return r.json().then(function (o) { return { ok: r.ok, o: o }; }); })
      .then(function (r) {
        btn.disabled = false;
        if (r.ok && r.o.code) { st.code = r.o.code; msg.hidden = true; draw(); }
        else say(r.o.error || T("We could not make the page. Please try again.", "பக்கத்தை உருவாக்க முடியவில்லை. மீண்டும் முயலுங்கள்."));
      })
      .catch(function () { btn.disabled = false; say(T("We could not reach the site. Please check your connection and try again.", "தளத்தை அணுக முடியவில்லை. உங்கள் இணைப்பைச் சரிபார்த்து மீண்டும் முயலுங்கள்.")); });
  }

  root.addEventListener("click", function (e) {
    var t = e.target.closest("button, a");
    if (!t || !root.contains(t)) return;
    if (t.classList.contains("mo-chip")) { st.k = t.dataset.k; stale(); draw(); if (st.k === "custom") input("custom").focus(); }
    else if (t.dataset.who) { input("name").value = st.name = t.dataset.who; stale(); draw(); input("name").focus(); }
    else if (t.dataset.say) { input("note").value = st.note = t.dataset.say; stale(); draw(); }
    else if (t.classList.contains("mo-proj")) { st.project = t.dataset.slug; stale(); draw(); if (st.project === "wish") input("wish").focus(); }
    else if (t.dataset.every) { st.every = t.dataset.every; draw(); }
    else if (t.hasAttribute("data-together")) makeTogether();
    else if (t.hasAttribute("data-together-copy")) {
      var link = $("[data-together-link]"); link.select();
      (navigator.clipboard ? navigator.clipboard.writeText(link.value) : Promise.reject()).catch(function () { try { document.execCommand("copy"); } catch (_) {} });
      t.textContent = T("Copied", "நகலெடுக்கப்பட்டது");
    }
    else if (t.dataset.cat) { st.cat = t.dataset.cat; drawList(); }
    else if (t.dataset.pick) {
      // "In someone's name" on a project in the list: choose it, and go up to the name.
      st.project = t.dataset.pick; stale(); draw();
      document.getElementById("mo-step-2").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    else if (t.hasAttribute("data-save")) saveCard();
  });
  root.addEventListener("input", function (e) {
    var n = e.target.name;
    if (n === "custom" || n === "name" || n === "note" || n === "from" || n === "wish") { st[n] = e.target.value.replace(/\s+/g, " ").replace(/^\s/, ""); stale(); draw(); }
    else if (n === "day") { st.day = /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) ? e.target.value : ""; draw(); }
    else if (n === "remind") { st.remind = e.target.checked; draw(); }
  });

  // Projects: the ones in projects.json plus the ones made from requests in the team portal, with card gifts added.
  var num = function (v) { var n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
  var getJSON = function (u, d) { return fetch(u).then(function (r) { return r.ok ? r.json() : d; }).catch(function () { return d; }); };
  var STAGE = [T("Initiated", "தொடங்கியவை"), T("Activated", "செயல்படுபவை"), T("Impact", "தாக்கம்")];
  var CATS = ["Trips & Events", "Education", "Livelihood"];
  var CAT_TA = { "All": "அனைத்தும்", "Trips & Events": "பயணங்களும் நிகழ்வுகளும்", "Education": "கல்வி", "Livelihood": "வாழ்வாதாரம்" };
  var catName = function (c) { return TA && CAT_TA[c] ? CAT_TA[c] : c; };

  function drawList() {
    var cats = ["All"].concat(CATS, all.map(function (p) { return p.cat; })).filter(function (c, i, a) { return c && a.indexOf(c) === i; });
    $("[data-tabs]").innerHTML = cats.map(function (c) {
      var n = c === "All" ? all.length : all.filter(function (p) { return p.cat === c; }).length;
      return '<button type="button" role="tab" data-cat="' + esc(c) + '" aria-selected="' + (c === st.cat) + '"' + (c === st.cat ? ' class="on"' : "") + ">" + esc(catName(c)) + " <i>" + n + "</i></button>";
    }).join("");
    var rows = all.filter(function (p) { return st.cat === "All" || p.cat === st.cat; });
    $("[data-list]").innerHTML = rows.length ? rows.map(function (p) {
      var need = p.stage === 1 && p.goal > 0
        ? esc(p.cur) + " " + Math.round(p.left).toLocaleString("en-US") + T(" still needed", " இன்னும் தேவை")
        : p.stage === 2 ? T("Fully funded, getting ready", "முழு நிதியும் கிடைத்தது, தயாராகிறது") : p.stage === 3 ? T("Done: see the day", "நிறைவு: அந்த நாளைப் பாருங்கள்") : T("Budget being prepared", "வரவுசெலவு தயாராகிறது");
      return '<li class="mo-row s' + p.stage + '">' +
        '<a class="mo-row-main" href="' + L + "/projects/" + esc(p.slug) + '">' +
          '<span class="mo-row-pic" style="background-image:url(\'' + esc(p.art) + '\')"></span>' +
          '<span class="mo-row-text"><b>' + esc(p.title) + "</b>" +
            "<small>" + esc([p.place, p.reach].filter(Boolean).join(" · ")) + "</small>" +
            '<span class="mo-row-meta"><span class="mo-pill">' + esc(STAGE[p.stage - 1]) + "</span><span>" + need + "</span></span>" +
            (p.stage === 1 && p.goal > 0 ? '<span class="mo-bar"><i style="width:' + p.pct + '%"></i></span>' : "") +
          '</span><span class="mo-row-go" aria-hidden="true">›</span></a>' +
        (p.open ? '<button type="button" class="mo-row-give" data-pick="' + esc(p.slug) + '">♡ ' + T("Give in someone's name", "ஒருவர் பெயரில் கொடுங்கள்") + "</button>" : "") +
        "</li>";
    }).join("") : '<li class="mo-empty">' + T("No " + st.cat + " projects yet. ", "இன்னும் " + catName(st.cat) + " திட்டங்கள் இல்லை. ") + '<a href="' + L + '/initiate">' + T("Know of one? Start it here", "ஒன்றைத் தெரியுமா? இங்கே தொடங்குங்கள்") + " →</a></li>";
  }

  Promise.all([
    getJSON("/projects.json", { projects: [] }), getJSON("/share.json", null), getJSON("/api/projects", null), getJSON("/api/give/totals", null)
  ]).then(function (res) {
    var share = res[1] && res[1].projects || {}, made = res[2] && res[2].projects || [], gifts = res[3] && res[3].projects || {};
    var list = (res[0].projects || []).slice(), have = {};
    list.forEach(function (p) { if (p) have[p.slug] = 1; });
    made.forEach(function (p) { if (p && !have[p.slug]) list.push(p); });
    all = list.filter(function (p) { return p && p.title && p.slug && !p.hidden && p.verified; }).map(function (p) {
      var sh = share[p.slug] || {}, rupees = /^rs/i.test(String(p.currency || "").trim());
      var goal = num(p.goal) || (p.budget || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0);
      var raised = (p.funders || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0);
      if (rupees && gifts[p.slug]) raised += (gifts[p.slug].gifts || []).reduce(function (s, x) { return s + num(x && x.amount); }, 0);
      var stage = /complete/i.test(p.status || "") ? 3 : goal > 0 && raised >= goal ? 2 : 1;
      var title = (TA && sh.title_ta) || sh.title || p.title;
      return { slug: p.slug, title: title, short: title, cat: p.theme || "Trips & Events", stage: stage, goal: goal, left: Math.max(0, goal - raised), pct: goal ? Math.min(100, Math.round(raised / goal * 100)) : 0,
        // drawings only on this page: never a photo of a child
        art: sh.art || (/\.svg$/.test(p.cover || "") ? p.cover : "/img/project-hills.svg"),
        cur: String(p.currency || "$").trim(), place: p.city || String(p.location || "").split(",")[0], reach: (TA && sh.reach_ta) || sh.reach || (/TBD/i.test(p.reach || "") ? "" : (p.reach || "")),
        open: stage === 1 && goal > 0 && raised < goal && rupees };
    }).sort(function (a, b) { return a.stage - b.stage || b.pct - a.pct; });
    // The days that still need sponsors: Initiated projects, visited and verified, not fully funded.
    projects = all.filter(function (p) { return p.open; });
    var box = $("[data-projects]");
    box.setAttribute("role", "radiogroup");
    box.innerHTML = projects.map(function (p) {
      return '<button type="button" role="radio" class="mo-proj" data-slug="' + esc(p.slug) + '"><span class="mo-proj-art" style="background-image:url(\'' + esc(p.art) + '\')"></span>' +
        '<span class="mo-proj-text"><b>' + esc(p.title) + "</b><small>" + esc(p.cur) + " " + Math.round(p.left).toLocaleString("en-US") + T(" still needed", " இன்னும் தேவை") + " · " + p.pct + "%</small>" +
        '<span class="mo-bar"><i style="width:' + p.pct + '%"></i></span></span></button>';
    }).join("") +
      '<button type="button" role="radio" class="mo-proj mo-proj-any" data-slug=""><span class="mo-proj-art any" aria-hidden="true">❀</span><span class="mo-proj-text"><b>' + T("The Raavanaa Fund", "ராவணா நிதியம்") + "</b><small>" + T("We choose the next day of joy, and show you openly where it went.", "அடுத்த மகிழ்ச்சியான நாளை நாம் தேர்ந்தெடுப்போம்; அது எங்கே சென்றது என்பதை வெளிப்படையாகக் காட்டுவோம்.") + "</small></span></button>" +
      '<button type="button" role="radio" class="mo-proj mo-proj-any" data-slug="wish"><span class="mo-proj-art any wish" aria-hidden="true">✎</span><span class="mo-proj-text"><b>' + T("A wish of my own", "என் சொந்த விருப்பம்") + "</b><small>" + T("Something specific you would love your gift to do.", "உங்கள் அன்பளிப்பு செய்ய வேண்டுமென நீங்கள் விரும்பும் ஒரு குறிப்பிட்ட விடயம்.") + "</small></span></button>";
    if (projects.length && !q.get("any")) st.project = projects[0].slug;
    var want = q.get("project"); if (want && projects.some(function (p) { return p.slug === want; })) st.project = want;
    if (q.get("wish") != null) st.project = "wish";
    draw(); drawList();
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
      // the painting, faded softly into the card at its edges
      var pw = 300, ph = 400, off = document.createElement("canvas"); off.width = pw; off.height = ph;
      var o = off.getContext("2d"); o.drawImage(img, 0, 0, pw, ph);
      o.globalCompositeOperation = "destination-in";
      o.translate(pw / 2, ph / 2); o.scale(1, ph / pw);
      var fade = o.createRadialGradient(0, 0, 0, 0, 0, pw / 2);
      fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(.6, "rgba(0,0,0,1)"); fade.addColorStop(1, "rgba(0,0,0,0)");
      o.fillStyle = fade; o.fillRect(-pw / 2, -pw / 2, pw, pw);
      g.drawImage(off, W / 2 - 135, 80, 270, 360);
      var y = wrap(words() || "", "italic 500 " + (TA ? 40 : 50) + "px " + serif, 520, 860, TA ? 60 : 62, th[1]);
      y = wrap(st.name || "", "600 " + (TA ? 64 : 78) + "px " + (TA ? serif : "Cinzel, serif"), y + 70, 900, TA ? 88 : 92, "#1f4d3a");
      if (st.note) y = wrap("“" + st.note + "”", "italic 500 " + (TA ? 34 : 42) + "px " + serif, y + 40, 840, TA ? 54 : 56, "#2d5c48");
      g.strokeStyle = th[2]; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 220, y + 40); g.lineTo(W / 2 - 40, y + 40); g.moveTo(W / 2 + 40, y + 40); g.lineTo(W / 2 + 220, y + 40); g.stroke();
      g.font = "34px serif"; g.fillStyle = "#e4761b"; g.textAlign = "center"; g.fillText("❀", W / 2, y + 52);
      y = wrap(giftLine(), "600 " + (TA ? 30 : 36) + "px " + serif, y + 120, 860, 48, "#1f4d3a");
      y = wrap(giftWhat(), "italic 500 " + (TA ? 26 : 32) + "px " + serif, y + 4, 860, 44, "#5d6b64");
      if (st.from && st.k !== "behalf") wrap(T("With love, ", "அன்புடன், ") + st.from, "italic 500 " + (TA ? 30 : 36) + "px " + serif, y + 20, 860, 48, "#5d6b64");
      g.font = "600 26px Inter, sans-serif"; g.fillStyle = "#b0812a"; g.fillText("raavanaa.org", W / 2, H - 84);
      finish();
    };
    // the Raavanaa logo at the foot of the card, then save or share it
    var finish = function () {
      var logo = new Image();
      logo.onload = function () { g.drawImage(logo, W / 2 - 150, H - 222, 300, 300 * logo.height / logo.width); out(); };
      logo.onerror = out;
      logo.src = "/img/logo-1200.webp";
    };
    var out = function () {
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
