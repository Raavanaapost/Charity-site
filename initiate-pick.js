// "Submit a request" form (/initiate): every question can be typed in the box, or answered from a window of
// choices that opens with "Choose" (SURESH 23 Nov 2026: "instead of drop down, a fancy nice window with options",
// for the moment, where, the village and how many). The window also has its own box to type an answer.
(() => {
  const form = document.querySelector('form[name="opportunity"]'); if (!form) return;
  const ta = () => document.documentElement.dataset.formLang === "ta";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ico = d => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const PIN = '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>';
  const HOME = '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10.5 19v-4.5h3V19"/>';
  const PPL = n => ["", '<circle cx="12" cy="8" r="3.2"/><path d="M6 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>',
    '<circle cx="9" cy="8.5" r="2.8"/><circle cx="16" cy="9.5" r="2.3"/><path d="M3.8 19c0-3 2.3-5 5.2-5s5.2 2 5.2 5M14.5 14.2c3 0 5.7 1.6 5.7 4.8"/>',
    '<circle cx="7" cy="9" r="2.3"/><circle cx="12" cy="7.5" r="2.6"/><circle cx="17" cy="9" r="2.3"/><path d="M2.8 18.5c0-2.6 1.9-4.3 4.2-4.3M21.2 18.5c0-2.6-1.9-4.3-4.2-4.3M7.4 19c0-3 2-5 4.6-5s4.6 2 4.6 5"/>'][n];
  // what each window offers: [value, Tamil words, icon]
  const KINDS = [
    ["A day out or trip", "ஒரு நாள் சுற்றுலா அல்லது பயணம்", '<path d="M3 17h18M5 17V9.5L12 5l7 4.5V17"/><path d="M9.5 17v-4h5v4"/>'],
    ["A game or sports day", "விளையாட்டு நாள்", '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3c3 2.5 3 8.9 0 11.4M17.7 6.3c-3 2.5-3 8.9 0 11.4"/>'],
    ["A good meal together", "ஒன்றாக ஒரு நல்ல உணவு", '<path d="M4 12h16a8 8 0 0 1-16 0zM9 20.5h6M9 8.5c0-1.5 1.5-1.5 1.5-3M13.5 8.5c0-1.5 1.5-1.5 1.5-3"/>'],
    ["A celebration or festival", "கொண்டாட்டம் அல்லது விழா", '<path d="M12 3c3 4 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 2-6 5-10z"/><path d="M8 21h8"/>'],
    ["Help with learning", "கல்விக்கு உதவி", '<path d="M3 7.5 12 4l9 3.5-9 3.5z"/><path d="M7 9.2V14c0 1.6 2.2 3 5 3s5-1.4 5-3V9.2"/>'],
  ];
  const MANY = [["Fewer than 10", "10க்கும் குறைவு", 1], ["10 to 25", "10 முதல் 25", 2], ["25 to 50", "25 முதல் 50", 2], ["50 to 100", "50 முதல் 100", 3], ["More than 100", "100க்கும் மேல்", 3]];
  const DIST_TA = { Jaffna: "யாழ்ப்பாணம்", Kilinochchi: "கிளிநொச்சி", Mullaitivu: "முல்லைத்தீவு", Mannar: "மன்னார்", Vavuniya: "வவுனியா", Trincomalee: "திருகோணமலை",
    Batticaloa: "மட்டக்களப்பு", Ampara: "அம்பாறை", Kandy: "கண்டி", "Nuwara Eliya": "நுவரெலியா", Badulla: "பதுளை", Matale: "மாத்தளை", Colombo: "கொழும்பு" };
  let D = [];
  fetch("/villages.json").then(r => r.json()).then(j => { D = (j && j.districts) || []; }).catch(() => {});
  const W = {
    kind: { q: ["What moment would you like to create?", "நீங்கள் உருவாக்க விரும்பும் தருணம் என்ன?"], own: ["Type your own idea", "உங்கள் சொந்த யோசனையை எழுதுங்கள்"],
      list: () => KINDS.map(k => ({ v: ta() ? k[1] : k[0], label: ta() ? k[1] : k[0], icon: k[2] })) },
    city: { q: ["Where? Choose a city or district", "எங்கே? நகரம் அல்லது மாவட்டத்தைத் தேர்ந்தெடுங்கள்"], own: ["Type a place", "இடத்தை எழுதுங்கள்"], search: true,
      list: () => D.map(d => ({ v: d.name, label: ta() && DIST_TA[d.name] ? `${DIST_TA[d.name]} · ${d.name}` : d.name, icon: PIN, find: d.name + " " + (DIST_TA[d.name] || "") })) },
    village: { q: ["Village or area", "கிராமம் அல்லது பகுதி"], own: ["Search, or type the village", "தேடுங்கள், அல்லது கிராமத்தை எழுதுங்கள்"], search: true,
      list: () => { const c = (document.getElementById("o-city").value || "").trim().toLowerCase(), d = D.find(x => x.name.toLowerCase() === c);
        return (d ? d.villages : D.flatMap(x => x.villages)).map(n => ({ v: n, label: n, icon: HOME })); } },
    many: { q: ["About how many will take part?", "ஏறத்தாழ எத்தனை பேர் பங்கேற்பார்கள்?"], own: ["Type a number, e.g. 35", "எண்ணை எழுதுங்கள், எ.கா. 35"],
      list: () => MANY.map(m => ({ v: ta() ? m[1] : m[0], label: ta() ? m[1] : m[0], icon: PPL(m[2]) })) },
  };
  const T = { use: ["Use this", "சரி"], or: ["or choose one", "அல்லது ஒன்றைத் தேர்ந்தெடுங்கள்"], close: ["Close", "மூடு"], none: ["Nothing in the list. Type it above and tap Use this.", "பட்டியலில் இல்லை. மேலே எழுதி, சரி என்பதைத் தட்டுங்கள்."] };
  const t = k => T[k][ta() ? 1 : 0];

  const sheet = document.createElement("div");
  sheet.className = "pk-sheet"; sheet.hidden = true;
  sheet.innerHTML = `<div class="pk-back" data-pk-close></div><div class="pk-panel" role="dialog" aria-modal="true" aria-labelledby="pk-q">
    <span class="pk-grab" aria-hidden="true"></span>
    <div class="pk-top"><h3 id="pk-q"></h3><button type="button" class="pk-x" data-pk-close aria-label="Close">✕</button></div>
    <form class="pk-own" novalidate><input autocomplete="off" maxlength="80" enterkeyhint="done"><button type="submit"></button></form>
    <p class="pk-or"></p><div class="pk-list" role="listbox"></div></div>`;
  document.body.appendChild(sheet);
  const own = sheet.querySelector(".pk-own input"), list = sheet.querySelector(".pk-list");
  let cur = null, back = null;

  const set = (box, v) => { box.value = v; box.dispatchEvent(new Event("input", { bubbles: true })); box.dispatchEvent(new Event("change", { bubbles: true })); };
  const draw = () => {
    const w = W[cur.dataset.pick], q = own.value.trim().toLowerCase(), box = cur.querySelector("input");
    let items = w.list();
    if (w.search && q) items = items.filter(x => (x.find || x.label).toLowerCase().includes(q));
    list.innerHTML = items.length ? items.slice(0, 80).map(x => `<button type="button" role="option" class="pk-opt${x.v === box.value ? " on" : ""}" data-v="${esc(x.v)}" aria-selected="${x.v === box.value}">
      <span class="pk-ico">${ico(x.icon)}</span><span class="pk-l">${esc(x.label)}</span><span class="pk-tick" aria-hidden="true">✓</span></button>`).join("")
      : `<p class="pk-none">${esc(t("none"))}</p>`;
  };
  const open = pk => {
    cur = pk; back = document.activeElement;
    const w = W[pk.dataset.pick], box = pk.querySelector("input");
    sheet.querySelector("h3").textContent = w.q[ta() ? 1 : 0];
    own.placeholder = w.own[ta() ? 1 : 0]; own.value = w.search ? "" : box.value;
    own.inputMode = pk.dataset.pick === "many" ? "numeric" : "text";
    sheet.querySelector(".pk-own button").textContent = t("use");
    sheet.querySelector(".pk-or").textContent = t("or");
    sheet.querySelector(".pk-x").setAttribute("aria-label", t("close"));
    draw(); sheet.hidden = false; document.documentElement.classList.add("pk-on");
    requestAnimationFrame(() => sheet.classList.add("in"));
    (list.querySelector(".on") || list.querySelector(".pk-opt") || own).focus({ preventScroll: true });
  };
  const close = () => { sheet.classList.remove("in"); document.documentElement.classList.remove("pk-on");
    setTimeout(() => { sheet.hidden = true; }, 200); if (back && back.focus) back.focus({ preventScroll: true }); cur = null; };
  const choose = v => { const box = cur.querySelector("input"), k = cur.dataset.pick; set(box, v);
    // a new district empties a village that is not in it
    if (k === "city") { const vb = document.getElementById("o-village"), d = D.find(x => x.name === v); if (vb.value && d && !d.villages.includes(vb.value)) set(vb, ""); }
    close(); };

  list.addEventListener("click", e => { const b = e.target.closest(".pk-opt"); if (b) choose(b.dataset.v); });
  sheet.querySelector(".pk-own").addEventListener("submit", e => { e.preventDefault(); const v = own.value.trim(); if (v) choose(v.slice(0, 80)); else own.focus(); });
  own.addEventListener("input", () => { if (cur && W[cur.dataset.pick].search) draw(); });
  sheet.addEventListener("click", e => { if (e.target.closest("[data-pk-close]")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) close(); });
  form.querySelectorAll("[data-pick]").forEach(pk => {
    pk.querySelector("[data-pick-open]").addEventListener("click", e => { e.preventDefault(); open(pk); });
  });
  // "Location" for Netlify Forms: village, city
  const loc = form.querySelector("[data-location]"), city = document.getElementById("o-city"), vil = document.getElementById("o-village");
  const syncLoc = () => { if (loc) loc.value = [vil.value.trim(), city.value.trim()].filter(Boolean).join(", "); };
  [city, vil].forEach(el => el.addEventListener("input", syncLoc));
})();
