/* "Gift a Moment, in their name" (/moment, /ta/moment), SURESH 10 Nov 2026.
   Simpler before launch (SURESH, 13 Nov 2026), so it can be followed on a phone in a few screens:
   1 the reason (four in view, the rest under "More reasons"), 2 who it is for (a few names, the rest under "More";
   a few words; From, with other names folded away), 3 the Moment Card, with their name at the top, 4 where the joy
   goes (the projects at a glance: tap the heart on one or more, or let Raavanaa choose, or a wish of my own), then
   one button to give. Two small extras fold out at the end: every year, and a family page (family or friends circle,
   made with Copy and Share, no long link). The name is the person remembered or celebrated (or the family or group
   giving), never a child's. */
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
  // A headline for each reason (SURESH, 12 Nov 2026): three for each, taking turns. The first half is in the page's
  // green, the second half (<em>) in the reason's own colour.
  var TITLES = {
    memory: [["Gone from sight. <em>Never from the heart.</em>", "கண்ணில் மறைந்தாலும், <em>நெஞ்சில் என்றும்.</em>"],
      ["Their light. <em>Still shining.</em>", "அவர்களின் ஒளி. <em>இன்னும் ஒளிர்கிறது.</em>"],
      ["Love remembered. <em>Joy passed on.</em>", "நினைவில் அன்பு. <em>பகிர்வில் மகிழ்ச்சி.</em>"]],
    remembrance: [["One day each year. <em>A lifetime of love.</em>", "ஆண்டுக்கு ஒரு நாள். <em>வாழ்நாள் முழுவதும் அன்பு.</em>"],
      ["The day returns. <em>So does their kindness.</em>", "அந்த நாள் மீண்டும் வருகிறது. <em>அவர்களின் கருணையும்.</em>"],
      ["Light a lamp. <em>Light up a childhood.</em>", "ஒரு விளக்கேற்றுங்கள். <em>ஒரு குழந்தையின் நாள் ஒளிரட்டும்.</em>"]],
    birthday: [["Another year of you. <em>A day of joy for them.</em>", "இன்னோர் ஆண்டு. <em>இன்னொரு புன்னகை.</em>"],
      ["Make a wish. <em>Make a child's day.</em>", "ஒரு வேண்டுதல். <em>ஒரு குழந்தைக்கு இனிய நாள்.</em>"],
      ["Your birthday. <em>Their best day.</em>", "உங்கள் பிறந்தநாள். <em>அவர்களின் சிறந்த நாள்.</em>"]],
    wedding: [["Two hearts, one promise. <em>Many little smiles.</em>", "இரு இதயங்கள், ஓர் உறுதி. <em>பல சின்னப் புன்னகைகள்.</em>"],
      ["Years of love. <em>Shared with children.</em>", "பல ஆண்டு அன்பு. <em>குழந்தைகளுடன் பகிர்ந்து.</em>"],
      ["Love that grows <em>is love that gives.</em>", "வளரும் அன்பு <em>கொடுக்கும் அன்பு.</em>"]],
    newborn: [["A new life begins. <em>Let a blessing begin too.</em>", "ஒரு புதிய உயிர் பிறந்தது. <em>ஓர் ஆசியும் பிறக்கட்டும்.</em>"],
      ["Tiny hands. <em>A big welcome.</em>", "சின்னஞ்சிறு கைகள். <em>பெரிய வரவேற்பு.</em>"],
      ["One child arrives. <em>Many children smile.</em>", "ஒரு குழந்தை வந்தது. <em>பல குழந்தைகள் சிரிக்கின்றன.</em>"]],
    success: [["You made it. <em>Now lift another child.</em>", "நீங்கள் சாதித்தீர்கள். <em>இன்னொரு குழந்தையை உயர்த்துங்கள்.</em>"],
      ["A dream achieved. <em>A dream begun.</em>", "ஒரு கனவு நிறைவேறியது. <em>ஒரு கனவு தொடங்குகிறது.</em>"],
      ["Success is sweeter <em>when it is shared.</em>", "பகிர்ந்தால் <em>வெற்றி இன்னும் இனிக்கும்.</em>"]],
    recovery: [["Health returned. <em>Gratitude given.</em>", "நலம் திரும்பியது. <em>நன்றி செலுத்துவோம்.</em>"],
      ["Stronger every day. <em>Kinder every day.</em>", "நாளும் வலிமை. <em>நாளும் கருணை.</em>"],
      ["A prayer answered. <em>A joy passed on.</em>", "வேண்டுதல் நிறைவேறியது. <em>மகிழ்ச்சியைப் பகிர்வோம்.</em>"]],
    gratitude: [["Thank you, <em>said with a smile.</em>", "நன்றி, <em>ஒரு புன்னகையால்.</em>"],
      ["A grateful heart <em>gives the best gifts.</em>", "நன்றியுள்ள இதயம் <em>சிறந்த பரிசைத் தரும்.</em>"],
      ["For all you gave me. <em>This is for them.</em>", "நீங்கள் எனக்குத் தந்ததற்காக. <em>இது அவர்களுக்காக.</em>"]],
    festival: [["Light the lamps. <em>Share the feast.</em>", "விளக்கேற்றுங்கள். <em>விருந்தைப் பகிருங்கள்.</em>"],
      ["A festival is brighter <em>with every child in it.</em>", "ஒவ்வொரு குழந்தையும் சேரும்போது <em>பண்டிகை இன்னும் ஒளிரும்.</em>"],
      ["Celebrate at home. <em>Celebrate with them.</em>", "வீட்டில் கொண்டாடுங்கள். <em>அவர்களுடனும் கொண்டாடுங்கள்.</em>"]],
    honour: [["Some people lift us. <em>Lift a child in their name.</em>", "உயர்த்தியவர் பெயரில், <em>ஒரு குழந்தை உயரட்டும்.</em>"],
      ["Honour them <em>with a child's happiest day.</em>", "அவர்களைப் போற்ற, <em>ஒரு குழந்தைக்கு இனிய நாள்.</em>"],
      ["A name worth honouring. <em>A day worth giving.</em>", "போற்றத்தக்க பெயர். <em>கொடுக்கத்தக்க நாள்.</em>"]],
    behalf: [["Together we give. <em>Together they smile.</em>", "ஒன்றாகக் கொடுப்போம். <em>ஒன்றாகச் சிரிப்பார்கள்.</em>"],
      ["One family. One gift. <em>Many smiles.</em>", "ஒரு குடும்பம். ஒரு பரிசு. <em>பல புன்னகைகள்.</em>"],
      ["From all of us, <em>with love.</em>", "எம் அனைவரிடமிருந்தும், <em>அன்புடன்.</em>"]],
    custom: [["Your moment. <em>Their smile.</em>", "உங்கள் தருணம். <em>அவர்களின் புன்னகை.</em>"],
      ["Your reason. <em>Their joy.</em>", "உங்கள் காரணம். <em>அவர்களின் மகிழ்ச்சி.</em>"],
      ["Every reason to give <em>is a good one.</em>", "கொடுக்க எந்தக் காரணமும் <em>நல்ல காரணமே.</em>"]]
  };
  // The round button under the picture: its own words and its own little picture for each reason. It takes the giver
  // on to the next step.
  var ACTS = {
    memory: ["flame", "Light a lamp", "விளக்கு ஏற்றுங்கள்"],
    remembrance: ["day", "Mark the day", "நினைவு கூருங்கள்"],
    birthday: ["gift", "Sponsor a smile", "புன்னகை தாருங்கள்"],
    wedding: ["heart", "Share the love", "அன்பைப் பகிருங்கள்"],
    newborn: ["spark", "Bless a child", "ஆசி வழங்குங்கள்"],
    success: ["rise", "Lift a dream", "கனவை உயர்த்துங்கள்"],
    recovery: ["sun", "Give thanks", "நன்றி செலுத்துங்கள்"],
    gratitude: ["flower", "Say thank you", "நன்றி சொல்லுங்கள்"],
    festival: ["feast", "Share the feast", "விருந்தைப் பகிருங்கள்"],
    honour: ["medal", "Honour them", "அவர்களைப் போற்றுங்கள்"],
    behalf: ["people", "Give together", "சேர்ந்து கொடுங்கள்"],
    custom: ["wand", "Make it happen", "நனவாக்குங்கள்"]
  };
  var ACT_ICONS = {
    flame: '<path d="M12 3c3 4 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 2-6 5-10z"/><path d="M12 12.5c1.2 1.6 2 2.6 2 3.9a2 2 0 0 1-4 0c0-1.3.8-2.3 2-3.9z" fill="currentColor" stroke="none"/>',
    day: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/><path d="M12 17.6s-2.8-1.7-2.8-3.6a1.6 1.6 0 0 1 2.8-1 1.6 1.6 0 0 1 2.8 1c0 1.900-2.8 3.6-2.8 3.6z" fill="currentColor" stroke="none"/>',
    gift: '<rect x="4.5" y="11" width="15" height="9" rx="1.5"/><rect x="3" y="7.5" width="18" height="3.5" rx="1"/><path d="M12 7.5V20M12 7.5c-1.500-3.500-5.500-3.500-5-1 .3 1.300 2.800 1.300 5 1zM12 7.5c1.500-3.500 5.500-3.500 5-1-.3 1.300-2.800 1.300-5 1z"/>',
    heart: '<path d="M12 20s-7-4.400-7-9.600A4.200 4.200 0 0 1 12 7.700a4.200 4.200 0 0 1 7 2.700C19 15.600 12 20 12 20z" fill="currentColor"/>',
    spark: '<path d="M11 4l1.900 5.600L18.500 11.500l-5.600 1.900L11 19l-1.900-5.600L3.500 11.500l5.600-1.900z" fill="currentColor"/><path d="M18.500 3v3M17 4.500h3M19 16v3M17.500 17.500h3"/>',
    rise: '<path d="M4 19l6-6 3.500 3.500L20 9M15 8.500h5.500V14"/><path d="M6 5l.8 1.700L8.500 7.500l-1.700.8L6 10l-.8-1.700L3.500 7.500l1.700-.8z" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M5.600 18.400l1.800-1.800M16.600 7.400l1.800-1.800"/>',
    flower: '<circle cx="12" cy="6.800" r="2.700"/><circle cx="16.900" cy="10.400" r="2.700"/><circle cx="15" cy="16.200" r="2.700"/><circle cx="9" cy="16.200" r="2.700"/><circle cx="7.100" cy="10.400" r="2.700"/><circle cx="12" cy="12" r="2.200" fill="currentColor" stroke="none"/>',
    feast: '<path d="M4 12h16a8 8 0 0 1-16 0zM9 20.500h6M9 8.500c0-1.500 1.500-1.500 1.500-3M13.500 8.500c0-1.500 1.500-1.500 1.500-3"/>',
    medal: '<circle cx="12" cy="15" r="5"/><path d="M9.300 10.800L7 3.500h10l-2.300 7.300"/><circle cx="12" cy="15" r="1.700" fill="currentColor" stroke="none"/>',
    people: '<circle cx="8" cy="8.500" r="2.600"/><circle cx="16.500" cy="9.500" r="2.200"/><path d="M3 19c0-3.200 2.200-5.200 5-5.200s5 2 5 5.200M14 14.300c.8-.4 1.600-.6 2.500-.6 2.500 0 4.500 1.800 4.500 4.800"/>',
    wand: '<path d="M5 19L14.500 9.500M14.500 9.500l2-2"/><path d="M18.500 3v3M17 4.500h3M8 4v2.400M6.800 5.200h2.400M19 12.500v2.400M17.800 13.700h2.400"/>'
  };
  var actIcon = function (k) { return '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ACT_ICONS[k] + "</svg>"; };
  // The emblem beside the title: always a heart, with a different sign inside for each reason, and a rim that runs
  // from gold into the reason's own colour.
  var MARKS = {
    memory: '<path d="M48 20c7.500 9 11.500 14.800 11.500 21.500C59.500 48.400 54.400 53 48 53s-11.500-4.600-11.500-11.500C36.500 34.800 40.500 29 48 20z" fill="url(#mm-flame)"/><path d="M48 33c3.600 4.400 5.500 7.200 5.500 10.400 0 3.300-2.500 5.600-5.500 5.600s-5.500-2.300-5.500-5.600c0-3.200 1.900-6 5.500-10.400z" fill="#ffe27a"/><path d="M31 55h34c-1.600 8.200-8.400 13-17 13s-15.400-4.800-17-13z" fill="url(#mm-brass)"/><path d="M29 55h38" stroke="#8a5c12" stroke-width="2.400" stroke-linecap="round"/><path d="M43.500 68h9l2.500 6h-14z" fill="url(#mm-brass)"/>',
    remembrance: '<path d="M48 16c4.700 5.600 7.200 9.300 7.200 13.500 0 4.300-3.200 7.200-7.200 7.200s-7.200-2.900-7.200-7.200c0-4.200 2.500-7.900 7.200-13.500z" fill="url(#mm-flame)"/><path d="M48 24.500c2.200 2.700 3.400 4.400 3.400 6.400a3.400 3.400 0 0 1-6.800 0c0-2 1.200-3.700 3.400-6.400z" fill="#ffe27a"/><rect x="42" y="39" width="12" height="22" rx="2.500" fill="#fff6e0" stroke="#b9831a" stroke-width="2"/><path d="M33 61h30c-1.300 5.500-6.700 8.500-15 8.500s-13.700-3-15-8.500z" fill="url(#mm-brass)"/><circle cx="33.500" cy="56" r="4.600" fill="#f29a1f"/><circle cx="62.500" cy="56" r="4.600" fill="#e4561b"/><circle cx="33.500" cy="56" r="1.600" fill="#ffe27a"/><circle cx="62.500" cy="56" r="1.600" fill="#ffe27a"/>',
    birthday: '<path d="M48 16c2.800 3.400 4.300 5.600 4.300 8.100a4.300 4.300 0 0 1-8.600 0c0-2.500 1.500-4.700 4.300-8.100z" fill="url(#mm-flame)"/><rect x="45.800" y="30" width="4.400" height="10" rx="1.200" fill="#fff6e0" stroke="#b9831a" stroke-width="1.200"/><rect x="37" y="40" width="22" height="12" rx="3.500" style="fill:var(--accent)"/><path d="M37 45.500c3.700 3 7.300 3 11 0s7.300-3 11 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><rect x="30" y="51" width="36" height="13.500" rx="3.500" fill="url(#mm-brass)"/><path d="M34 57h28" stroke="#fff3d6" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5"/><path d="M27 65.500h42" stroke="#8a5c12" stroke-width="2.400" stroke-linecap="round"/>',
    wedding: '<path d="M48 32s-6.500-4.100-6.500-8.900a3.900 3.900 0 0 1 6.500-2.500 3.900 3.900 0 0 1 6.500 2.500c0 4.800-6.500 8.900-6.500 8.900z" style="fill:var(--accent)"/><circle cx="40" cy="50" r="11" fill="none" stroke="url(#mm-brass)" stroke-width="5"/><circle cx="56" cy="50" r="11" fill="none" stroke="#e9a013" stroke-width="5"/><path d="M47.300 41.800a11 11 0 0 1 3.200 5.200" fill="none" stroke="url(#mm-brass)" stroke-width="5" stroke-linecap="round"/>',
    newborn: '<g style="fill:var(--accent)"><ellipse cx="39.500" cy="51" rx="6.500" ry="10.500" transform="rotate(-9 39.500 51)"/><circle cx="32" cy="38" r="2.200"/><circle cx="36" cy="35" r="2.400"/><circle cx="40.500" cy="34.200" r="2.300"/><circle cx="44.500" cy="36.200" r="2"/></g><g fill="#e9a013"><ellipse cx="56.500" cy="51" rx="6.500" ry="10.500" transform="rotate(9 56.500 51)"/><circle cx="51.500" cy="36.200" r="2"/><circle cx="55.500" cy="34.200" r="2.300"/><circle cx="60" cy="35" r="2.400"/><circle cx="64" cy="38" r="2.200"/></g>',
    success: '<path d="M35 44v10c0 4.400 5.800 7.500 13 7.500s13-3.100 13-7.500V44l-13 6.500z" fill="url(#mm-brass)"/><path d="M48 25l25 12.500L48 50 23 37.500z" style="fill:var(--accent)" stroke="#fff3d6" stroke-width="1.500" stroke-linejoin="round"/><path d="M70.500 38.500V52" stroke="#e4561b" stroke-width="2.600" stroke-linecap="round"/><circle cx="70.500" cy="54.500" r="3" fill="#e4561b"/>',
    recovery: '<path d="M48 68V44" stroke="#2f7a3a" stroke-width="3.600" stroke-linecap="round"/><path d="M48 55c-12 0-18.500-7.500-19.500-18.500C40 36.500 48 43 48 55z" fill="#6ab868"/><path d="M48 46c0-12.500 7.500-20.500 20-21.500C68 37 60.500 46 48 46z" style="fill:var(--accent)"/><path d="M36 68.500h24" stroke="#b9831a" stroke-width="3" stroke-linecap="round"/>',
    gratitude: '<path d="M48 58c-10 2.500-18.500-1-23.500-9.500 8.500-3.500 18-.5 23.500 9.500z" fill="#f7c63a"/><path d="M48 58c10 2.500 18.500-1 23.500-9.500-8.500-3.500-18-.5-23.500 9.500z" fill="#f7c63a"/><path d="M48 57c-9.500-3-16.500-10.500-18.500-22 9.500 1 17 8.500 18.500 22z" fill="#f29a1f"/><path d="M48 57c9.500-3 16.500-10.500 18.500-22-9.500 1-17 8.500-18.500 22z" fill="#f29a1f"/><path d="M48 23c6.500 9 7.500 22 0 33.500-7.500-11.500-6.500-24.500 0-33.500z" fill="url(#mm-flame)"/><path d="M39 61c3 4.500 15 4.500 18 0z" fill="#2f8a4a"/>',
    festival: '<g stroke-width="3.800" stroke-linecap="round"><path d="M48 31V21M48 53v10M59 42h10M37 42H27" stroke="#e4561b"/><path d="M55.800 34.200l7-7M55.800 49.800l7 7M40.200 34.200l-7-7M40.200 49.800l-7 7" stroke="#e9a013"/></g><circle cx="48" cy="42" r="6.500" fill="#ffe27a" stroke="#e4561b" stroke-width="2.200"/><g style="fill:var(--accent)"><circle cx="66" cy="24" r="2.300"/><circle cx="30" cy="24" r="2.300"/><circle cx="66" cy="60" r="2.300"/><circle cx="30" cy="60" r="2.300"/></g>',
    honour: '<path d="M29 58l-3.500-22.500L38 46l10-17.500L58 46l12.500-10.500L67 58z" fill="url(#mm-brass)" stroke="#8a5c12" stroke-width="1.500" stroke-linejoin="round"/><rect x="28.500" y="57.500" width="39" height="7.500" rx="2.500" style="fill:var(--accent)"/><circle cx="25.500" cy="34.500" r="3.200" fill="#e4561b"/><circle cx="48" cy="27" r="3.500" fill="#e4561b"/><circle cx="70.500" cy="34.500" r="3.200" fill="#e4561b"/><circle cx="48" cy="61.200" r="1.900" fill="#ffe27a"/><circle cx="38" cy="61.200" r="1.500" fill="#ffe27a"/><circle cx="58" cy="61.200" r="1.500" fill="#ffe27a"/>',
    behalf: '<circle cx="32.500" cy="40" r="4.800" fill="#e4761b"/><path d="M23.500 63c0-8.500 3.700-13.500 9-13.500s9 5 9 13.500z" fill="#e4761b"/><circle cx="63.500" cy="40" r="4.800" fill="#e9a013"/><path d="M54.500 63c0-8.500 3.700-13.500 9-13.500s9 5 9 13.500z" fill="#e9a013"/><circle cx="48" cy="31" r="5.800" style="fill:var(--accent)" stroke="#fff6e0" stroke-width="1.500"/><path d="M36.500 65c0-11.500 4.800-18.500 11.500-18.500S59.500 53.500 59.500 65z" style="fill:var(--accent)" stroke="#fff6e0" stroke-width="1.500"/>',
    custom: '<g transform="rotate(38 48 44)"><rect x="43" y="17" width="10" height="7" rx="2.500" style="fill:var(--accent)"/><rect x="43" y="23" width="10" height="31" fill="url(#mm-brass)"/><path d="M43 26.500h10" stroke="#8a5c12" stroke-width="1.500"/><path d="M43 54h10l-5 10.500z" fill="#fff3d6" stroke="#b9831a" stroke-width="1.200" stroke-linejoin="round"/><path d="M46.300 61l1.700 3.500 1.700-3.500z" fill="#3d2a10"/></g><path d="M64 26l1.300 3.200 3.200 1.300-3.200 1.300L64 35l-1.300-3.200-3.200-1.300 3.200-1.300z" fill="#e4561b"/>'
  };
  var markSVG = function (k) {
    return '<svg viewBox="0 0 96 96" aria-hidden="true"><defs>' +
      '<linearGradient id="mm-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7c63a"/><stop offset=".45" stop-color="#e9a013"/><stop offset="1" style="stop-color:var(--accent)"/></linearGradient>' +
      '<radialGradient id="mm-glow" cx=".5" cy=".46" r=".6"><stop offset="0" stop-color="#fffdf2"/><stop offset=".55" stop-color="#fff3d0"/><stop offset="1" stop-color="#fbdf9c"/></radialGradient>' +
      '<linearGradient id="mm-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f29a1f"/><stop offset=".6" stop-color="#e4561b"/><stop offset="1" stop-color="#c8381e"/></linearGradient>' +
      '<linearGradient id="mm-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7cf5a"/><stop offset="1" stop-color="#b9831a"/></linearGradient></defs>' +
      '<path d="M48 86C22 67 7 49 7 31 7 17 17.500 7 30 7c7.600 0 14 3.600 18 9.800C52 10.600 58.400 7 66 7c12.500 0 23 10 23 24 0 18-15 36-41 55z" fill="url(#mm-glow)" stroke="url(#mm-rim)" stroke-width="6" stroke-linejoin="round"/>' +
      (MARKS[k] || MARKS.memory) +
      '<path d="M17 28l1.100 2.800 2.800 1.100-2.800 1.100L17 35.800l-1.100-2.800-2.800-1.100 2.800-1.100zM79 22l.9 2.200 2.200.9-2.200.9-.9 2.200-.9-2.200-2.200-.9 2.200-.9z" fill="#fff" opacity=".95"/></svg>';
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

  // Simpler page before launch (SURESH, 13 Nov 2026): four reasons in view and the rest under "More"; a few choices in
  // each step with the rest under "More"; the Moment Card after the steps, with the name at the top; the projects
  // list is where the joy goes (tap the heart, one or more); one button to give at the very end.
  var MAIN = ["memory", "remembrance", "birthday", "wedding"];
  // "Who is it for?" in the words of each reason
  var WHO_H = {
    memory: ["Whose memory do you carry?", "யாருடைய நினைவைச் சுமக்கிறீர்கள்?"], remembrance: ["Who are we remembering?", "யாரை நினைவுகூர்கிறோம்?"],
    birthday: ["Whose birthday is it?", "யாருடைய பிறந்தநாள்?"], wedding: ["Whose anniversary is it?", "யாருடைய திருமண நாள்?"],
    newborn: ["Who are we welcoming?", "யாரை வரவேற்கிறோம்?"], success: ["Who are we proud of?", "யாரை நினைத்துப் பெருமைப்படுகிறோம்?"],
    recovery: ["Who is well again?", "யார் நலம் பெற்றார்?"], gratitude: ["Who are we thanking?", "யாருக்கு நன்றி சொல்கிறோம்?"],
    festival: ["In whose name?", "யாருடைய பெயரில்?"], honour: ["Who are we honouring?", "யாரைக் கௌரவிக்கிறோம்?"],
    behalf: ["Who is giving together?", "யார் சேர்ந்து கொடுக்கிறார்கள்?"], custom: ["Whose moment is it?", "யாருடைய தருணம்?"]
  };
  var WHO_MAIN = TA ? ["அம்மா", "அப்பா", "தாத்தா", "பாட்டி"] : ["Amma", "Appa", "Thatha", "Paati"];
  var chevron = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var moreBtn = function (key, n) { return '<button type="button" class="mo-more" data-more="' + key + '" aria-expanded="false"><span>' + T("More", "மேலும்") + (n ? " (" + n + ")" : "") + "</span>" + chevron + "</button>"; };
  var heartSVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 20.5s-7.5-4.700-7.5-10.300A4.500 4.500 0 0 1 12 7.300a4.500 4.500 0 0 1 7.500 2.900C19.500 15.800 12 20.500 12 20.500z"/></svg>';
  var homeSVG = '<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><path d="M6 22L24 7l18 15" fill="none" stroke="#c9a24a" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 19.500V40h26V19.500" fill="#fffaf0" stroke="#1f4d3a" stroke-width="3" stroke-linejoin="round"/><path d="M24 35s-6-3.700-6-8a3.500 3.500 0 0 1 6-2.300 3.500 3.500 0 0 1 6 2.300c0 4.300-6 8-6 8z" fill="#c8381e"/></svg>';

  var q = new URLSearchParams(location.search);
  var today = function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  // picks: the projects chosen with the heart (one or more); goes: "pick" (those projects), "fund" or "wish"
  var st = { k: q.get("for") || "memory", custom: "", name: "", note: "", from: "", others: "", picks: [], goes: "pick", wish: "", every: "once", day: today(), remind: true, code: "", cat: "All", circle: "family", open: {} };
  if (!OCCASIONS.some(function (o) { return o.k === st.k; })) st.k = "memory";
  var occ = function () { return OCCASIONS.filter(function (o) { return o.k === st.k; })[0]; };
  // Gemini paintings, one per reason (10 Nov 2026); the hand-drawn .svg versions stay as a fallback.
  var art = function () { return "/img/moment/" + st.k + ".jpg"; };
  var words = function () { var o = occ(); return o.k === "custom" ? st.custom.trim() : o.words[TA ? 1 : 0]; };
  var chip = function (o) { return '<button type="button" role="radio" class="mo-chip" data-k="' + o.k + '">' + icon(o.icon) + "<span>" + esc(TA ? o.ta : o.en) + "</span></button>"; };

  root.innerHTML =
    '<section class="mo-hero">' +
      '<div class="mo-petals" aria-hidden="true">' + Array.apply(null, Array(14)).map(function (_, i) { return '<i style="--i:' + i + '"></i>'; }).join("") + "</div>" +
      '<div class="wrap mo-hero-in">' +
        '<div class="mo-art">' +
          '<img class="mo-lamp" data-hero-art src="/img/moment/memory.jpg" alt="" width="300" height="400">' +
          '<a class="mo-act" data-act href="#mo-step-2"><span class="mo-act-ic" data-act-ic></span><span class="mo-act-l"><span data-act-l></span> <i aria-hidden="true">→</i></span></a>' +
        "</div>" +
        '<div class="mo-hero-text">' +
          '<p class="mo-brand"><span class="mo-mark" data-mark></span>' +
            '<span class="mo-brand-words"><span class="mt-title' + (TA ? " ta" : "") + '"><span>' + T("Gift a", "பரிசளியுங்கள்") + "</span> <b>" + T("Moment", "ஒரு தருணம்") + "</b></span>" +
            '<span class="mt-ribbon">' + T("in their name", "அவர்கள் பெயரில்") + "</span></span></p>" +
          '<h1 class="mo-titles" data-titles></h1>' +
          '<p class="mo-lede" data-lede></p>' +
        "</div>" +
        '<div class="mo-pick" id="mo-step-1">' +
          '<p class="mo-pick-q"><span class="mo-num">1</span>' + T("Tap the one that is close to your heart", "உங்கள் இதயத்துக்கு நெருக்கமானதைத் தொடுங்கள்") + "</p>" +
          '<div class="mo-occ" role="radiogroup" aria-label="' + T("The reason", "காரணம்") + '">' +
            OCCASIONS.filter(function (o) { return MAIN.indexOf(o.k) > -1; }).map(chip).join("") +
          "</div>" +
          '<div class="mo-occ mo-occ-more" data-fold="reasons" hidden>' + OCCASIONS.filter(function (o) { return MAIN.indexOf(o.k) < 0; }).map(chip).join("") + "</div>" +
          '<div class="mo-more-row">' + moreBtn("reasons", OCCASIONS.length - MAIN.length).replace(T("More", "மேலும்"), T("More reasons", "மேலும் காரணங்கள்")) + "</div>" +
          '<label class="mo-field mo-custom" hidden><span>' + T("Your own words, before their name", "அவர்கள் பெயருக்கு முன் வர வேண்டிய உங்கள் வார்த்தைகள்") + '</span><input name="custom" maxlength="60" placeholder="' + T("e.g. With love from the whole family, for", "எ.கா. முழுக் குடும்பத்தின் அன்புடன்,") + '"></label>' +
        "</div>" +
      "</div></section>" +
    '<div class="wrap mo-body">' +
      // 2. who it is for: a shaded section with a title in the words of the reason
      '<section class="mo-step mo-who" id="mo-step-2"><p class="mo-num">2</p><h2 data-who-h></h2>' +
        '<label class="mo-field"><span data-name-l></span><input name="name" maxlength="60" autocomplete="off"></label>' +
        '<div class="mo-quick" data-who-quick></div>' +
        '<div class="mo-quick" data-fold="who" hidden data-who-more></div>' +
        '<label class="mo-field"><span>' + T("A few words", "சில வார்த்தைகள்") + ' <small>' + T("(optional)", "(விருப்பமானால்)") + '</small></span><textarea name="note" maxlength="140" rows="2"></textarea></label>' +
        '<div class="mo-quick" data-sayings></div>' +
        '<div class="mo-quick" data-fold="say" hidden data-say-more></div>' +
        '<div data-from-field>' +
          '<label class="mo-field"><span>' + T("From", "அனுப்புபவர்") + ' <small>' + T("(optional)", "(விருப்பமானால்)") + '</small></span><input name="from" maxlength="60" placeholder="' + T("Your name, e.g. Ravi", "உங்கள் பெயர், எ.கா. ரவி") + '"></label>' +
          '<button type="button" class="mo-more mo-add" data-more="from" aria-expanded="false"><span data-from-more-l>' + T("+ Add family and friends' names", "+ குடும்பத்தினர், நண்பர்களின் பெயர்கள்") + "</span>" + chevron + "</button>" +
          '<div class="mo-fold-box" data-fold="from" hidden>' +
            '<label class="mo-field"><span>' + T("Other names on the card", "அட்டையில் வேறு பெயர்கள்") + '</span><input name="others" maxlength="120" placeholder="' + T("e.g. Malar, Kumar and the kids", "எ.கா. மலர், குமார், பிள்ளைகள்") + '"></label>' +
            '<button type="button" class="mo-done" data-more="from">' + T("Done", "சரி") + "</button>" +
          "</div>" +
        "</div>" +
      "</section>" +
      // 3. the Moment Card
      '<section class="mo-cardsec" id="mo-card">' +
        '<p class="mo-kicker"><span class="mo-num">3</span>' + T("Your Moment Card", "உங்கள் தருண அட்டை") + "</p>" +
        '<h2 class="mo-card-h">' + T("A moment, created in their name", "அவர்கள் பெயரில் உருவான ஒரு தருணம்") + "</h2>" +
        '<figure class="mo-card" data-card>' +
          '<span class="mo-card-c tl" aria-hidden="true"></span><span class="mo-card-c tr" aria-hidden="true"></span><span class="mo-card-c bl" aria-hidden="true"></span><span class="mo-card-c br" aria-hidden="true"></span>' +
          '<p class="mo-card-words" data-c-words></p>' +
          '<p class="mo-card-name" data-c-name></p>' +
          '<div class="mo-card-rule" aria-hidden="true"><i></i><b>❀</b><i></i></div>' +
          '<img class="mo-card-lamp" data-card-art src="/img/moment/memory.jpg" alt="" width="150" height="200">' +
          '<p class="mo-card-note" data-c-note></p>' +
          '<p class="mo-card-gift" data-c-gift></p>' +
          '<p class="mo-card-what" data-c-what></p>' +
          '<p class="mo-card-from" data-c-from></p>' +
          '<img class="mo-card-logo" src="/img/logo-450.webp?v=6" alt="Raavanaa" width="450" height="149">' +
        "</figure>" +
        '<div class="mo-card-actions"><button type="button" data-save>' + T("Save the card", "அட்டையைச் சேமி") + '</button><button type="button" data-share>' + T("Share the card", "அட்டையைப் பகிர்") + "</button></div>" +
      "</section>" +
      // 4. where the joy goes: the projects at a glance, tap the heart to choose (one or more)
      '<section class="mo-step mo-where" id="projects"><p class="mo-num">4</p><h2>' + T("Where should the joy go?", "மகிழ்ச்சி எங்கே செல்ல வேண்டும்?") + "</h2>" +
        '<p class="mo-note">' + T("Tap the heart on one or more projects. Every rupee is shown openly.", "ஒன்று அல்லது பல திட்டங்களில் இதயத்தைத் தொடுங்கள். ஒவ்வொரு ரூபாயும் வெளிப்படையாகக் காட்டப்படும்.") + "</p>" +
        '<div class="mo-tabs" role="tablist" data-tabs></div>' +
        '<ul class="mo-list" data-list><li class="mo-note">' + T("Loading the days that need you…", "உங்களுக்காகக் காத்திருக்கும் நாட்கள் ஏற்றப்படுகின்றன…") + "</li></ul>" +
        '<div class="mo-other">' +
          '<button type="button" class="mo-alt" data-goes="fund" aria-pressed="false"><span class="mo-alt-ic" aria-hidden="true">❀</span><span><b>' + T("Let Raavanaa choose", "ராவணா தேர்ந்தெடுக்கட்டும்") + "</b><small>" + T("The Raavanaa Fund: the next day of joy that needs it", "ராவணா நிதியம்: தேவையுள்ள அடுத்த மகிழ்ச்சியான நாள்") + "</small></span></button>" +
          '<button type="button" class="mo-alt" data-goes="wish" aria-pressed="false"><span class="mo-alt-ic" aria-hidden="true">✎</span><span><b>' + T("A wish of my own", "என் சொந்த விருப்பம்") + "</b><small>" + T("Something specific you would love your gift to do", "உங்கள் அன்பளிப்பு செய்ய வேண்டுமென நீங்கள் விரும்புவது") + "</small></span></button>" +
        "</div>" +
        '<label class="mo-field mo-wish" data-wish-field hidden><span>' + T("Tell us your wish", "உங்கள் விருப்பத்தைச் சொல்லுங்கள்") + '</span><textarea name="wish" maxlength="300" rows="3" placeholder="' + T("e.g. school shoes for a class, a meal at an elders' home, books for a village library", "எ.கா. ஒரு வகுப்புக்குப் பாடசாலைக் காலணிகள், முதியோர் இல்லத்தில் ஒரு உணவு, கிராம நூலகத்துக்குப் புத்தகங்கள்") + '"></textarea>' +
          '<small>' + T("Your gift waits safely in the Raavanaa Fund. A volunteer will write to you, and we will show you the day it made happen.", "உங்கள் அன்பளிப்பு ராவணா நிதியத்தில் பாதுகாப்பாகக் காத்திருக்கும். ஒரு தன்னார்வலர் உங்களுக்கு எழுதுவார்; அது உருவாக்கிய நாளை நாம் உங்களுக்குக் காட்டுவோம்.") + "</small></label>" +
      "</section>" +
      // 5. give, with two small extras folded away: every year, and a family page
      '<section class="mo-final">' +
        '<p class="mo-final-sum" data-final-sum></p>' +
        '<a class="mo-go" data-go href="/give"></a>' +
        '<div class="mo-extras">' +
          '<button type="button" class="mo-extra" data-more="every" aria-expanded="false"><span class="mo-extra-ic" aria-hidden="true">↻</span><span><b>' + T("Every year", "ஒவ்வோர் ஆண்டும்") + "</b><small>" + T("A reminder before their day", "அவர்களின் நாளுக்கு முன் நினைவூட்டல்") + "</small></span></button>" +
          '<button type="button" class="mo-extra" data-more="family" aria-expanded="false"><span class="mo-extra-ic home" aria-hidden="true">' + homeSVG + "</span><span><b>" + T("Family page", "குடும்பப் பக்கம்") + "</b><small>" + T("Their card on a page of their own", "அவர்களின் அட்டை, தனிப் பக்கத்தில்") + "</small></span></button>" +
        "</div>" +
        '<div class="mo-fold-box" data-fold="every" hidden>' +
          '<div class="mo-seg" role="radiogroup" aria-label="' + T("How often", "எத்தனை முறை") + '">' +
            '<button type="button" role="radio" data-every="once">' + T("Just this once", "இம்முறை மட்டும்") + "</button>" +
            '<button type="button" role="radio" data-every="year">' + T("Every year", "ஒவ்வோர் ஆண்டும்") + "</button></div>" +
          '<div data-every-year hidden>' +
            '<label class="mo-field"><span>' + T("Their day", "அவர்களின் நாள்") + ' <small>' + T("(the date to remember)", "(நினைவில் கொள்ள வேண்டிய திகதி)") + '</small></span><input type="date" name="day"></label>' +
            '<label class="mo-check"><input type="checkbox" name="remind" checked> <span>' + T("Remind me a week before, every year", "ஒவ்வோர் ஆண்டும் ஒரு வாரத்துக்கு முன் எனக்கு நினைவூட்டுங்கள்") + "</span></label>" +
          "</div>" +
          '<button type="button" class="mo-done" data-more="every">' + T("Done", "சரி") + "</button>" +
        "</div>" +
        '<div class="mo-fold-box mo-together" data-fold="family" hidden>' +
          '<p class="mo-note" data-together-text></p>' +
          '<div data-together-make>' +
            '<p class="mo-together-q">' + T("Who will share this page?", "இந்தப் பக்கத்தை யார் பகிர்வார்கள்?") + "</p>" +
            '<div class="mo-seg" role="radiogroup" aria-label="' + T("Circle", "வட்டம்") + '">' +
              '<button type="button" role="radio" data-circle="family">' + T("Family circle", "குடும்ப வட்டம்") + "</button>" +
              '<button type="button" role="radio" data-circle="friends">' + T("Friends circle", "நண்பர்கள் வட்டம்") + "</button></div>" +
            '<button type="button" class="mo-together-btn" data-together>' + T("Make the page", "பக்கத்தை உருவாக்கு") + "</button>" +
          "</div>" +
          '<p class="mo-note mo-together-msg" data-together-msg role="status" hidden></p>' +
          '<div class="mo-together-out" data-together-out hidden>' +
            '<a class="mo-page-icon" data-together-open href="#"><span aria-hidden="true">' + homeSVG + "</span><b data-together-title></b><small data-together-sub></small></a>" +
            '<div class="mo-card-actions"><button type="button" data-together-copy>' + T("Copy", "நகலெடு") + '</button><button type="button" data-together-share>' + T("Share", "பகிர்") + "</button></div>" +
          "</div>" +
        "</div>" +
        '<p class="mo-note mo-privacy">' + T("Their name shows on the project page only if you choose, on the next step. We never show children's names or faces.", "அடுத்த படியில் நீங்கள் தேர்ந்தெடுத்தால் மட்டுமே அவர்களின் பெயர் திட்டப் பக்கத்தில் காட்டப்படும். குழந்தைகளின் பெயர்களையோ முகங்களையோ நாம் ஒருபோதும் காட்டுவதில்லை.") + "</p>" +
        '<p class="mo-all-foot"><a href="' + L + '/initiate">' + T("Know children who need a day of joy? Start a project", "மகிழ்ச்சியான ஒரு நாள் தேவைப்படும் குழந்தைகளைத் தெரியுமா? ஒரு திட்டத்தைத் தொடங்குங்கள்") + " →</a></p>" +
      "</section>" +
    "</div>";

  var $ = function (s) { return root.querySelector(s); };
  var input = function (n) { return root.querySelector('[name="' + n + '"]'); };
  var projects = [];   // the days that still need sponsors
  var all = [];        // every public project (the explorer)
  input("day").value = st.day;
  var chosen = function () { return st.goes === "pick" ? st.picks.filter(function (s) { return projects.some(function (p) { return p.slug === s; }); }) : []; };
  var fromLine = function () { return [st.from, st.others].filter(Boolean).join(", "); };

  function tributeParams(u) {
    u.set("tribute", st.k); u.set("tw", words()); if (st.name) u.set("tn", st.name); if (st.note) u.set("tnote", st.note);
    if (st.every === "year" && st.day) { u.set("every", "year"); u.set("day", st.day); if (st.remind) u.set("remind", "1"); }
    if (st.code) u.set("m", st.code);
    return u;
  }
  function giveUrl() {
    var u = new URLSearchParams(), c = chosen();
    // The Raavanaa Fund and "a wish of my own" go to the fund page; projects go to the first one's Give form,
    // with the others named (they share the gift).
    if (st.goes === "wish") { if (st.wish) u.set("wish", st.wish); return L + "/fund?" + tributeParams(u).toString() + "#give"; }
    if (!c.length) return L + "/fund?" + tributeParams(u).toString() + "#give";
    u.set("project", c[0]); if (c.length > 1) u.set("also", c.slice(1).join(","));
    return L + "/give?" + tributeParams(u).toString() + "#give";
  }
  function giftLine() { return st.k === "behalf" ? T("A day of joy for children, given together", "குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாள், ஒன்றாக வழங்கப்பட்டது") : T("A day of joy for children, given in their name", "அவர்கள் பெயரில், குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாள்"); }
  function giftWhat() {
    if (st.goes === "wish") return st.wish ? T("A wish: ", "விருப்பம்: ") + st.wish : T("A wish of their own", "அவர்களின் சொந்த விருப்பம்");
    var c = chosen().map(function (s) { return projects.filter(function (x) { return x.slug === s; })[0]; });
    if (!c.length) return T("The Raavanaa Fund, for the next day of joy", "ராவணா நிதியம், அடுத்த மகிழ்ச்சியான நாளுக்கு");
    return c.length === 1 ? c[0].short : c.length + T(" days of joy, shared", " மகிழ்ச்சியான நாட்கள், பகிர்ந்து");
  }
  var lastK = "";
  // The headlines of the chosen reason take turns, one every few seconds (not when the visitor asked for less motion).
  var titleI = 0, titleTimer = 0;
  function turnTitles() {
    clearInterval(titleTimer);
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    titleTimer = setInterval(function () {
      if (document.hidden) return;
      var all = root.querySelectorAll("[data-titles] > span"); if (all.length < 2) return;
      titleI = (titleI + 1) % all.length;
      all.forEach(function (el, i) { el.classList.toggle("on", i === titleI); if (i === titleI) el.removeAttribute("aria-hidden"); else el.setAttribute("aria-hidden", "true"); });
    }, 4200);
  }
  // A "More" part opens, and closes again with "Done" or another tap.
  function fold(key, open) {
    var box = root.querySelector('[data-fold="' + key + '"]'); if (!box) return;
    if (open == null) open = box.hidden;
    box.hidden = !open; st.open[key] = open;
    root.querySelectorAll('[data-more="' + key + '"]').forEach(function (b) { if (b.hasAttribute("aria-expanded")) { b.setAttribute("aria-expanded", String(open)); b.classList.toggle("open", open); } });
    if (key === "done") return;
    if (key === "reasons") $(".mo-more-row .mo-more span").textContent = open ? T("Fewer reasons", "குறைவான காரணங்கள்") : T("More reasons", "மேலும் காரணங்கள்") + " (" + (OCCASIONS.length - MAIN.length) + ")";
  }
  var quick = function (list, attr) { return list.map(function (x) { return '<button type="button" ' + attr + '="' + esc(x) + '">' + esc(x) + "</button>"; }).join(""); };
  function draw() {
    root.querySelectorAll(".mo-chip").forEach(function (b) { var on = b.dataset.k === st.k; b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    $(".mo-custom").hidden = st.k !== "custom";
    var group = st.k === "behalf", w = words();
    $("[data-lede]").textContent = occ().lede[TA ? 1 : 0];
    if (lastK !== st.k) {
      // step 2 asks for a person, or for a family or group when it is "on behalf of"
      $("[data-who-h]").textContent = (WHO_H[st.k] || WHO_H.custom)[TA ? 1 : 0];
      $("[data-name-l]").textContent = group ? T("The family, group or person", "குடும்பம், குழு அல்லது நபர்") : T("Their name", "அவர்களின் பெயர்");
      input("name").placeholder = group ? T("e.g. the Rajan family, Class of 1998", "எ.கா. ராஜன் குடும்பம், 1998 வகுப்பு") : T("e.g. Amma, Kamala Rajan", "எ.கா. அம்மா, கமலா ராஜன்");
      var whoAll = group ? GROUPS : WHO_MAIN.concat(WHO.filter(function (x) { return WHO_MAIN.indexOf(x) < 0; }));
      var nShow = group ? 3 : 4;
      $("[data-who-quick]").innerHTML = quick(whoAll.slice(0, nShow), "data-who") + moreBtn("who", whoAll.length - nShow);
      $("[data-who-more]").innerHTML = quick(whoAll.slice(nShow), "data-who");
      var says = (SAYINGS[st.k] || []).map(function (s) { return s[TA ? 1 : 0]; });
      $("[data-sayings]").innerHTML = quick(says.slice(0, 2), "data-say") + (says.length > 2 ? moreBtn("say", says.length - 2) : "");
      $("[data-say-more]").innerHTML = quick(says.slice(2), "data-say");
      fold("who", false); fold("say", false);
      $("[data-from-field]").hidden = group;
      // its own headlines, emblem and link (SURESH, 12 Nov 2026)
      var tl = TITLES[st.k] || TITLES.custom, act = ACTS[st.k] || ACTS.custom;
      $("[data-titles]").innerHTML = tl.map(function (x, i) { return "<span" + (i ? ' aria-hidden="true"' : ' class="on"') + ">" + x[TA ? 1 : 0] + "</span>"; }).join("");
      titleI = 0; turnTitles();
      var mk = $("[data-mark]"); mk.innerHTML = markSVG(st.k); mk.classList.remove("pop"); void mk.offsetWidth; mk.classList.add("pop");
      $("[data-act-ic]").innerHTML = actIcon(act[0]);
      $("[data-act-l]").textContent = act[TA ? 2 : 1];
      lastK = st.k;
    }
    $("[data-c-words]").textContent = w || T("Your words", "உங்கள் வார்த்தைகள்");
    $("[data-c-name]").textContent = st.name || (group ? T("Your family or group", "உங்கள் குடும்பம் அல்லது குழு") : T("Their name", "அவர்களின் பெயர்"));
    $("[data-c-name]").classList.toggle("ghost", !st.name);
    $("[data-c-note]").textContent = st.note ? "“" + st.note + "”" : "";
    $("[data-c-gift]").textContent = giftLine();
    $("[data-c-what]").textContent = giftWhat();
    $("[data-c-from]").textContent = fromLine() && !group ? T("With love, ", "அன்புடன், ") + fromLine() : "";
    $("[data-from-more-l]").textContent = st.others ? "+ " + st.others : T("+ Add family and friends' names", "+ குடும்பத்தினர், நண்பர்களின் பெயர்கள்");
    $("[data-card]").dataset.k = st.k;
    // Each reason has its own picture and colours (SURESH, 10 Nov 2026).
    var th = occ().theme;
    root.style.setProperty("--tint", th[0]); root.style.setProperty("--accent", th[1]); root.style.setProperty("--frame", th[2]); root.style.setProperty("--petal", th[3]);
    if ($("[data-hero-art]").getAttribute("src") !== art()) { $("[data-hero-art]").setAttribute("src", art()); $("[data-card-art]").setAttribute("src", art()); }
    // where the joy goes
    var c = chosen();
    root.querySelectorAll("[data-heart]").forEach(function (b) { var on = c.indexOf(b.dataset.heart) > -1; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); b.closest(".mo-row").classList.toggle("picked", on); b.querySelector("span").textContent = on ? T("Chosen", "தேர்ந்தது") : T("Choose", "தேர்ந்தெடு"); });
    root.querySelectorAll("[data-goes]").forEach(function (b) { var on = b.dataset.goes === st.goes || (b.dataset.goes === "fund" && st.goes === "pick" && !c.length && projects.length === 0); b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
    $("[data-wish-field]").hidden = st.goes !== "wish";
    $("[data-go]").href = giveUrl();
    $("[data-go]").textContent = st.name ? T("Give in " + st.name + "'s name", st.name + " பெயரில் கொடுங்கள்") : T("Give in their name", "அவர்கள் பெயரில் கொடுங்கள்");
    $("[data-final-sum]").textContent = st.name ? (w ? w + " " : "") + st.name : "";
    $("[data-final-sum]").hidden = !st.name;
    // every year?
    root.querySelectorAll("[data-every]").forEach(function (b) { var on = b.dataset.every === st.every; b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    $("[data-every-year]").hidden = st.every !== "year";
    // the family page
    root.querySelectorAll("[data-circle]").forEach(function (b) { var on = b.dataset.circle === st.circle; b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    var nm = st.name || T("them", "அவர்கள்");
    $("[data-together-text]").textContent = T("A page for " + nm + ", with their Moment Card. Share it with the people who love them.", nm + " அவர்களுக்கான பக்கம், அவர்களின் தருண அட்டையுடன். அவர்களை நேசிப்பவர்களுடன் பகிருங்கள்.");
    $("[data-together-out]").hidden = !st.code;
    $("[data-together-make]").hidden = !!st.code;
    if (st.code) {
      $("[data-together-open]").href = L + "/m/" + st.code + "#invite";
      $("[data-together-sub]").textContent = st.circle === "friends" ? T("Open the page, and invite your friends", "பக்கத்தைத் திறந்து, நண்பர்களை அழையுங்கள்") : T("Open the page, and invite your family", "பக்கத்தைத் திறந்து, குடும்பத்தை அழையுங்கள்");
      $("[data-together-title]").textContent = st.circle === "friends" ? T(nm + "'s friends page", nm + " நண்பர்கள் பக்கம்") : T(nm + "'s family page", nm + " குடும்பப் பக்கம்");
    }
  }
  // Anything on the card changed: the family page made earlier no longer matches, so a new one is offered.
  function stale() { if (st.code) { st.code = ""; $("[data-together-msg]").hidden = true; } }
  var pageUrl = function () { return location.origin + L + "/m/" + st.code; };
  var shareText = function (url) { var w = words(); return (w ? w + " " : "") + st.name + (st.note ? "\n“" + st.note + "”" : "") + "\n" + T("We are giving children in Sri Lanka a day of joy in their name. ", "அவர்கள் பெயரில் இலங்கைக் குழந்தைகளுக்கு ஒரு மகிழ்ச்சியான நாளை வழங்குகிறோம். ") + url; };
  var copy = function (t) { return navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject(); };
  var shareOut = function (text, url) {
    if (navigator.share) { navigator.share({ text: text }).catch(function () {}); return; }
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
  };

  function makeTogether() {
    var msg = $("[data-together-msg]"), btn = $("[data-together]");
    var say = function (t) { msg.hidden = false; msg.textContent = t; };
    if (!st.name) { say(T("Add their name first, in step 2.", "முதலில் படி 2 இல் அவர்களின் பெயரைச் சேருங்கள்.")); input("name").focus(); return; }
    if (!words()) { say(T("Add your own words first, at the top.", "முதலில் மேலே உங்கள் சொந்த வார்த்தைகளைச் சேருங்கள்.")); input("custom").focus(); return; }
    btn.disabled = true; say(T("Making the page…", "பக்கம் உருவாக்கப்படுகிறது…"));
    var c = chosen();
    fetch("/api/moments", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: st.k, words: words(), name: st.name, note: st.note, from: st.k === "behalf" ? "" : st.from, others: st.k === "behalf" ? "" : st.others,
        project: c[0] || "", also: c.slice(1).join(","), wish: st.goes === "wish" ? st.wish : "", day: st.every === "year" ? st.day : "", lang: TA ? "ta" : "en", circle: st.circle }) })
      .then(function (r) { return r.json().then(function (o) { return { ok: r.ok, o: o }; }); })
      .then(function (r) {
        btn.disabled = false;
        if (r.ok && r.o.code) {
          st.code = r.o.code; msg.hidden = true;
          // The organiser's key stays on this phone, so the family page shows them the invite form and the Give button.
          if (r.o.ownerKey) { try { localStorage.setItem("raav-own-" + r.o.code, r.o.ownerKey); } catch (_) {} }
          draw();
        }
        else say(r.o.error || T("We could not make the page. Please try again.", "பக்கத்தை உருவாக்க முடியவில்லை. மீண்டும் முயலுங்கள்."));
      })
      .catch(function () { btn.disabled = false; say(T("We could not reach the site. Please check your connection and try again.", "தளத்தை அணுக முடியவில்லை. உங்கள் இணைப்பைச் சரிபார்த்து மீண்டும் முயலுங்கள்.")); });
  }

  root.addEventListener("click", function (e) {
    var t = e.target.closest("button, a");
    if (!t || !root.contains(t)) return;
    if (t.classList.contains("mo-chip")) {
      st.k = t.dataset.k; stale();
      // a reason picked from "More" moves up beside the main four, and "More" closes again
      if (MAIN.indexOf(st.k) < 0 && st.open.reasons) { fold("reasons", false); }
      draw(); if (st.k === "custom") input("custom").focus();
      showPicked();
    }
    else if (t.dataset.more) { fold(t.dataset.more); }
    else if (t.dataset.who) { input("name").value = st.name = t.dataset.who; stale(); fold("who", false); draw(); input("name").focus(); }
    else if (t.dataset.say) { input("note").value = st.note = t.dataset.say; stale(); fold("say", false); draw(); }
    else if (t.dataset.heart) {
      var s = t.dataset.heart, i = st.picks.indexOf(s);
      if (st.goes !== "pick") { st.goes = "pick"; st.picks = []; i = -1; }
      if (i > -1) st.picks.splice(i, 1); else st.picks.push(s);
      if (!st.picks.length) st.goes = "fund";
      stale(); draw();
    }
    else if (t.dataset.goes) { st.goes = t.dataset.goes; st.picks = []; stale(); draw(); if (st.goes === "wish") input("wish").focus(); }
    else if (t.dataset.every) { st.every = t.dataset.every; draw(); }
    else if (t.dataset.circle) { st.circle = t.dataset.circle; draw(); }
    else if (t.hasAttribute("data-together")) makeTogether();
    else if (t.hasAttribute("data-together-copy")) {
      copy(pageUrl()).then(function () { t.textContent = T("Copied", "நகலெடுக்கப்பட்டது"); }).catch(function () { window.prompt(T("Copy this", "இதை நகலெடுங்கள்"), pageUrl()); });
    }
    else if (t.hasAttribute("data-together-share")) shareOut(shareText(pageUrl()));
    else if (t.hasAttribute("data-share")) shareOut(shareText(location.origin + L + "/moment"));
    else if (t.dataset.cat) { st.cat = t.dataset.cat; drawList(); draw(); }
    else if (t.hasAttribute("data-act")) {
      // the link under the picture: on to "Who is it for?", ready to type
      e.preventDefault();
      document.getElementById("mo-step-2").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(function () { try { input("name").focus({ preventScroll: true }); } catch (_) { input("name").focus(); } }, 500);
    }
    else if (t.hasAttribute("data-save")) saveCard();
  });
  // A reason from "More" shows beside the main four while it is the chosen one.
  function showPicked() {
    var extra = $(".mo-occ:not(.mo-occ-more)");
    extra.querySelectorAll(".mo-chip.mo-extra-k").forEach(function (b) { b.remove(); });
    root.querySelectorAll(".mo-occ-more .mo-chip").forEach(function (b) { b.hidden = false; });
    if (MAIN.indexOf(st.k) > -1) return;
    var src = root.querySelector('.mo-occ-more .mo-chip[data-k="' + st.k + '"]'); if (!src) return;
    var cl = src.cloneNode(true); cl.classList.add("mo-extra-k"); extra.appendChild(cl); src.hidden = true;
    draw();
  }
  root.addEventListener("input", function (e) {
    var n = e.target.name;
    if (n === "custom" || n === "name" || n === "note" || n === "from" || n === "others" || n === "wish") { st[n] = e.target.value.replace(/\s+/g, " ").replace(/^\s/, ""); stale(); draw(); }
    else if (n === "day") { st.day = /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) ? e.target.value : ""; draw(); }
    else if (n === "remind") { st.remind = e.target.checked; draw(); }
  });

  // Projects: the ones in projects.json plus the ones made from requests in the team portal, with card gifts added.
  var num = function (v) { var n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
  var getJSON = function (u, d) { return fetch(u).then(function (r) { return r.ok ? r.json() : d; }).catch(function () { return d; }); };
  var STAGE = [T("Initiated", "தொடங்கியவை"), T("Activated", "செயல்படுபவை"), T("Impact", "தாக்கம்")];
  var CATS = ["Trips & Events", "Education", "Livelihood"];
  var CAT_TA = { "All": "அனைத்தும்", "Needs you": "உங்களுக்காக", "Trips & Events": "பயணங்களும் நிகழ்வுகளும்", "Education": "கல்வி", "Livelihood": "வாழ்வாதாரம்" };
  var catName = function (c) { return TA && CAT_TA[c] ? CAT_TA[c] : c; };

  function drawList() {
    var cats = ["All"].concat(CATS, all.map(function (p) { return p.cat; })).filter(function (c, i, a) { return c && a.indexOf(c) === i; })
      .filter(function (c) { return c === "All" || all.some(function (p) { return p.cat === c; }); });
    $("[data-tabs]").innerHTML = cats.length < 3 ? "" : cats.map(function (c) {
      var n = c === "All" ? all.length : all.filter(function (p) { return p.cat === c; }).length;
      return '<button type="button" role="tab" data-cat="' + esc(c) + '" aria-selected="' + (c === st.cat) + '"' + (c === st.cat ? ' class="on"' : "") + ">" + esc(catName(c)) + " <i>" + n + "</i></button>";
    }).join("");
    var rows = all.filter(function (p) { return st.cat === "All" || p.cat === st.cat; });
    // the days that still need sponsors first; the funded and finished ones under "More"
    var openN = rows.filter(function (p) { return p.open; }).length, restN = rows.length - openN;
    var row = function (p) {
      var need = p.stage === 1 && p.goal > 0
        ? esc(p.cur) + " " + Math.round(p.left).toLocaleString("en-US") + T(" still needed", " இன்னும் தேவை")
        : p.stage === 2 ? T("Fully funded, getting ready", "முழு நிதியும் கிடைத்தது, தயாராகிறது") : p.stage === 3 ? T("Done: see the day", "நிறைவு: அந்த நாளைப் பாருங்கள்") : T("Budget being prepared", "வரவுசெலவு தயாராகிறது");
      return '<li class="mo-row s' + p.stage + (p.open ? " can" : "") + '">' +
        '<a class="mo-row-main" href="' + L + "/projects/" + esc(p.slug) + '" target="_blank" rel="noopener">' +
          '<span class="mo-row-pic" style="background-image:url(\'' + esc(p.art) + '\')"></span>' +
          '<span class="mo-row-text"><b>' + esc(p.title) + "</b>" +
            "<small>" + esc([p.place, p.reach].filter(Boolean).join(" · ")) + "</small>" +
            '<span class="mo-row-meta"><span class="mo-pill">' + esc(STAGE[p.stage - 1]) + "</span><span>" + need + "</span></span>" +
            (p.stage === 1 && p.goal > 0 ? '<span class="mo-bar"><i style="width:' + p.pct + '%"></i></span>' : "") +
          "</span></a>" +
        (p.open ? '<button type="button" class="mo-heart" data-heart="' + esc(p.slug) + '" aria-pressed="false" aria-label="' + esc(p.title) + '">' + heartSVG + "<span>" + T("Choose", "தேர்ந்தெடு") + "</span></button>" : "") +
        "</li>";
    };
    $("[data-list]").innerHTML = rows.length ? rows.filter(function (p) { return p.open; }).map(row).join("") +
      (restN ? '<li class="mo-list-more">' + moreBtn("done", 0).replace(T("More", "மேலும்"), openN ? T("More projects, funded or done", "மேலும் திட்டங்கள், நிதி பெற்றவை அல்லது நிறைவானவை") + " (" + restN + ")" : T("See the projects", "திட்டங்களைப் பாருங்கள்") + " (" + restN + ")") + "</li>" +
        '<li class="mo-list-rest" data-fold="done"' + (st.open.done ? "" : " hidden") + '><ul class="mo-list">' + rows.filter(function (p) { return !p.open; }).map(row).join("") + "</ul></li>" : "")
      : '<li class="mo-empty">' + T("No " + st.cat + " projects yet. ", "இன்னும் " + catName(st.cat) + " திட்டங்கள் இல்லை. ") + '<a href="' + L + '/initiate">' + T("Know of one? Start it here", "ஒன்றைத் தெரியுமா? இங்கே தொடங்குங்கள்") + " →</a></li>";
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
    }).sort(function (a, b) { return (b.open - a.open) || a.stage - b.stage || b.pct - a.pct; });
    // The days that still need sponsors: Initiated projects, visited and verified, not fully funded.
    projects = all.filter(function (p) { return p.open; });
    if (projects.length && !q.get("any")) st.picks = [projects[0].slug];
    var want = q.get("project"); if (want && projects.some(function (p) { return p.slug === want; })) st.picks = [want];
    if (!st.picks.length) st.goes = "fund";
    if (q.get("wish") != null) st.goes = "wish";
    drawList(); draw();
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
    g.fillStyle = th[2]; [[58, 58], [W - 58, 58], [58, H - 58], [W - 58, H - 58]].forEach(function (pt) { g.beginPath(); g.arc(pt[0], pt[1], 12, 0, Math.PI * 2); g.fill(); });
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
      // their name at the top (SURESH, 13 Nov 2026), the painting under it
      g.font = "600 24px Inter, sans-serif"; g.fillStyle = th[2]; g.textAlign = "center"; g.fillText((TA ? "தருண அட்டை" : "MOMENT CARD"), W / 2, 128);
      var y = wrap(words() || "", "italic 500 " + (TA ? 38 : 46) + "px " + serif, 200, 860, TA ? 56 : 58, th[1]);
      y = wrap(st.name || "", "600 " + (TA ? 66 : 84) + "px " + (TA ? serif : "Cinzel, serif"), y + 60, 900, TA ? 88 : 96, "#1f4d3a");
      g.strokeStyle = th[2]; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 220, y + 10); g.lineTo(W / 2 - 40, y + 10); g.moveTo(W / 2 + 40, y + 10); g.lineTo(W / 2 + 220, y + 10); g.stroke();
      g.font = "34px serif"; g.fillStyle = "#e4761b"; g.fillText("❀", W / 2, y + 22);
      g.drawImage(off, W / 2 - 120, y + 50, 240, 320);
      y += 400;
      if (st.note) y = wrap("“" + st.note + "”", "italic 500 " + (TA ? 34 : 40) + "px " + serif, y + 10, 840, TA ? 52 : 54, "#2d5c48");
      y = wrap(giftLine(), "600 " + (TA ? 30 : 34) + "px " + serif, y + 40, 860, 46, "#1f4d3a");
      y = wrap(giftWhat(), "italic 500 " + (TA ? 26 : 32) + "px " + serif, y + 4, 860, 44, "#5d6b64");
      if (fromLine() && st.k !== "behalf") wrap(T("With love, ", "அன்புடன், ") + fromLine(), "italic 500 " + (TA ? 30 : 36) + "px " + serif, y + 20, 860, 48, "#5d6b64");
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
