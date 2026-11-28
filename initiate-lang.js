// The "Submit a need" form (/initiate) in English or Tamil (SURESH 23 Nov 2026).
// Only the form changes language; the rest of the site stays English while Tamil pages are switched off.
// The Tamil words were written by Claude and still need a check by a Tamil speaker.
(() => {
  const TA = {
    head: "கோரிக்கையைச் சமர்ப்பிக்கவும்",
    choose: "தேர்வு",
    kind: "நீங்கள் உருவாக்க விரும்பும் தருணம் என்ன?",
    evhelp: "மேலும் சொல்லுங்கள்: உங்கள் குரலைப் பதிவுசெய்யுங்கள், படம் எடுங்கள் அல்லது கோப்பை இணையுங்கள்",
    evopt: "(விருப்பம், 4 வரை)",
    photo: "படம் எடு",
    attach: "கோப்பை இணை",
    evnote: "குரல் பதிவுகள் 3 நிமிடம் வரை (WhatsApp குரல் பதிவுகளும் சரி), படங்கள், PDF ஆவணங்கள் அல்லது 15 விநாடி வரையான சிறிய காணொளி. Word கோப்பு என்றால், முதலில் PDF ஆகச் சேமியுங்கள்.",
    write: "அல்லது இங்கே எழுதுங்கள்",
    opt: "(விருப்பம்)",
    where: "எங்கே?",
    village: "கிராமம் அல்லது பகுதி",
    cityother: "எந்த நகரம் அல்லது மாவட்டம்?",
    many: "ஏறத்தாழ எத்தனை பேர் பங்கேற்பார்கள்?",
    incharge: "இந்தத் தேவைக்குப் பொறுப்பானவர் யார்?",
    me: "நான்",
    mesub: "நானே அனுப்புகிறேன், அல்லது அங்கே எனக்கு யாரையும் தெரியாது",
    ref: "ஒருவர் என்னை அனுப்பச் சொன்னார்",
    refsub: "அவரின் பெயர், தொலைபேசி, மின்னஞ்சலைச் சேர்க்கிறேன்",
    ich: "பொறுப்பானவர்",
    icnote: "நாங்கள் திட்டப் பக்கத்தை உருவாக்கி அவருக்கு அனுப்புவோம். அவர் அதைச் சரிபார்த்து உறுதிப்படுத்துவார், பின்னர் அது வெளியிடப்படும்.",
    icname: "அவரின் பெயர்",
    icphone: "அவரின் தொலைபேசி அல்லது WhatsApp",
    icemail: "அவரின் மின்னஞ்சல்",
    icboth: "தொலைபேசி எண், மின்னஞ்சல், அல்லது இரண்டும்.",
    name: "உங்கள் பெயர்",
    namenote: "இது திட்டப் பக்கத்தில் காட்டப்படலாம். புனைபெயரும் பரவாயில்லை.",
    phone: "உங்கள் தொலைபேசி, WhatsApp அல்லது மின்னஞ்சல்",
    send: "இந்தத் தருணத்தை உருவாக்கு",
    gstep: "படி 1 / 2",
    gh: "ஒரு தருணத்தைத் தொடங்க உள்நுழையுங்கள்",
    gp: "Raavanaa-வில் ஒவ்வொரு கோரிக்கையும் ஒரு உறுப்பினரிடமிருந்து வருகிறது, எனவே ஒவ்வொன்றுக்கும் பொறுப்பு உண்டு. ஒரு நிமிடம் போதும், ஒருமுறை செய்தால் போதும்.",
    gbtn: "உள்நுழையுங்கள் அல்லது இணையுங்கள்",
  };
  const TP = {
    kind: "எழுதுங்கள், அல்லது தேர்வு என்பதைத் தட்டுங்கள்",
    city: "நகரம் அல்லது மாவட்டம்",
    desc: "இது யாருக்காக, எது மாற்றத்தை ஏற்படுத்தும்?",
    village: "எ.கா. காரைநகர்",
    many: "எண்ணை எழுதுங்கள், எ.கா. 35",
    icname: "எ.கா. அதிபர், அல்லது ஒரு பெற்றோர்",
    name: "உங்கள் பெயர், அமைப்பு இருந்தால் அதுவும்",
    phone: "உங்களைத் திரும்ப அழைக்க",
  };
  const html = document.documentElement, form = document.querySelector('form[name="opportunity"]');
  const keep = new WeakMap(); // the English, so the switch can go back
  const swap = (el, ta, attr) => {
    if (!keep.has(el)) keep.set(el, attr ? el.getAttribute(attr) : el.innerHTML);
    const v = ta == null ? keep.get(el) : ta;
    if (attr) el.setAttribute(attr, v); else el.innerHTML = v;
  };
  let fontOn = false;
  const font = () => { if (fontOn) return; fontOn = true;
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap"; document.head.appendChild(l); };
  const apply = lang => {
    const ta = lang === "ta";
    if (ta) font();
    html.dataset.formLang = ta ? "ta" : "en";
    document.querySelectorAll("[data-t]").forEach(el => swap(el, ta ? TA[el.dataset.t] : null));
    document.querySelectorAll("[data-tp]").forEach(el => swap(el, ta ? TP[el.dataset.tp] : null, "placeholder"));
    const rec = document.querySelector("[data-rec-label]"); if (rec && /^(Record your voice|குரலைப் பதிவுசெய்)$/.test(rec.textContent)) rec.textContent = ta ? "குரலைப் பதிவுசெய்" : "Record your voice";
    const who = document.querySelector("[data-who]"), em = document.querySelector("[data-email-note]");
    if (who && who.dataset.name) who.textContent = (ta ? "உள்நுழைந்தவர்: " : "Signed in as ") + who.dataset.name;
    if (em && em.dataset.email) em.textContent = (ta ? "உங்கள் மின்னஞ்சலுக்கும் பதில் அனுப்புவோம்: " : "We'll also reply to your email: ") + em.dataset.email;
    if (form) { if (!form.dataset.doneEn) form.dataset.doneEn = form.dataset.done || ""; form.dataset.done = ta ? "நன்றி! உங்கள் தருணம் தொடங்கிவிட்டது." : form.dataset.doneEn; }
    let ln = form && form.querySelector('[name="form_lang"]');
    if (form && !ln) { ln = document.createElement("input"); ln.type = "hidden"; ln.name = "form_lang"; form.appendChild(ln); }
    if (ln) ln.value = ta ? "Tamil" : "English";
    document.querySelectorAll(".i-lang [data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    try { localStorage.setItem("raav-form-lang", lang); } catch (e) {}
  };
  document.querySelectorAll(".i-lang [data-lang]").forEach(b => b.addEventListener("click", () => apply(b.dataset.lang)));
  let start = "en";
  try { start = new URLSearchParams(location.search).get("lang") === "ta" ? "ta" : localStorage.getItem("raav-form-lang") === "ta" ? "ta" : "en"; } catch (e) {}
  if (start === "ta") apply("ta");
  window.raavFormLang = apply;
})();
