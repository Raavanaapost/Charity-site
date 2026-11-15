/* GuruShiya – Stage 1 app: sign in, teacher groups and classes, public group pages, homepage,
   class join link with consent, student practice screen, weekly practice and the teacher's practice chart. */
(() => {
const C = window.ABHYASA_CONFIG || {};
const ARTS = {
  dance:{label:"Dance",dot:"#e0607a"}, flute:{label:"Flute",dot:"#0f7c86"}, violin:{label:"Violin",dot:"#b5651d"},
  piano:{label:"Piano",dot:"#1b2350"}, veena:{label:"Veena",dot:"#8a4fb0"}, mridangam:{label:"Mridangam",dot:"#7a5230"},
  vocal:{label:"Vocal",dot:"#c4651a"}, karlakattai:{label:"Karlakattai",dot:"#7a1424"}, yoga:{label:"Yoga",dot:"#5a9e4b"},
  art:{label:"Art",dot:"#f2a43a"}, other:{label:"Other",dot:"#6a7194"}
};
/* Line icons for the front page (stroke = currentColor) */
const svg = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
const IC = {
  dance: svg(`<circle cx="13" cy="3.6" r="1.8"/><path d="M12.6 6.2 11 13l-4.5 7.5M11 13l4 2.6 1.6 5.4M12.4 8.2 7 6.2 4.6 3M12.4 8.2l5 1.8 2.6-2.4"/>`),
  music: svg(`<path d="M9 18V5.5l11-2.5v12.5"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="15.5" r="3"/><path d="M9 9.5 20 7"/>`),
  clubs: svg(`<g transform="rotate(-32 12 15)"><path d="M12 22.2V16"/><path d="M10.9 16 9.5 6.2a2.6 2.6 0 1 1 5 0L13.1 16z"/></g><g transform="rotate(32 12 15)"><path d="M12 22.2V16"/><path d="M10.9 16 9.5 6.2a2.6 2.6 0 1 1 5 0L13.1 16z"/></g>`),
  yoga: svg(`<circle cx="12" cy="4.2" r="2"/><path d="M12 6.8v6.4M12 9l-4.6 3.6L5 11.4M12 9l4.6 3.6 2.4-1.2M4 19.5c2.6-2.4 13.4-2.4 16 0M8 17.2l4 1.8 4-1.8"/>`),
  palette: svg(`<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.9 0-1.4-1-1.9-1-3 0-1 .9-1.9 2.4-1.9H18a3 3 0 0 0 3-3C21 6.7 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="9.6" cy="7" r="1.1"/><circle cx="14.4" cy="6.8" r="1.1"/>`),
  more: svg(`<path d="M7.2 8C4.9 8 3 9.8 3 12s1.9 4 4.2 4c4.2 0 5.4-8 9.6-8C19.1 8 21 9.8 21 12s-1.9 4-4.2 4c-4.2 0-5.4-8-9.6-8z"/>`),
  people: svg(`<circle cx="12" cy="7" r="3"/><path d="M6 20v-1.5A4.5 4.5 0 0 1 10.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20"/><circle cx="5" cy="9" r="2.2"/><path d="M1.5 19v-1a3.5 3.5 0 0 1 4.6-3.3"/><circle cx="19" cy="9" r="2.2"/><path d="M22.5 19v-1a3.5 3.5 0 0 0-4.6-3.3"/>`),
  calendar: svg(`<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15.2l2.1 2.1 4-4.3"/>`),
  chart: svg(`<path d="M4 20.5h16"/><rect x="5" y="14" width="3" height="6.5" rx=".6"/><rect x="10.5" y="10.5" width="3" height="10" rx=".6"/><rect x="16" y="7" width="3" height="13.5" rx=".6"/><path d="M4 11 9.5 6.5l3 2.2L19 3.5M15.5 3.5H19V7"/>`),
  teacher: svg(`<circle cx="9" cy="6" r="2.6"/><path d="M3.5 20v-3.5a5 5 0 0 1 9.5-2.2M13 20h8M14.5 13.5 21 10"/><rect x="13" y="16" width="8" height="4" rx="1"/>`),
  student: svg(`<circle cx="8" cy="8" r="2.6"/><circle cx="16" cy="8" r="2.6"/><path d="M3 19.5v-1.2A4.3 4.3 0 0 1 7.3 14h1.4a4.3 4.3 0 0 1 3.3 1.5A4.3 4.3 0 0 1 15.3 14h1.4a4.3 4.3 0 0 1 4.3 4.3v1.2"/>`),
  chev: svg(`<path d="m9 6 6 6-6 6"/>`, ` class="chev"`)
};
/* The six front-page families and the class types inside each */
const FAMILIES = [
  { k:"dance", label:"Dance", types:["dance"], icon:IC.dance },
  { k:"music", label:"Music", types:["flute","violin","piano","veena","mridangam","vocal"], icon:IC.music },
  { k:"karlakattai", label:"Karlakattai", types:["karlakattai"], icon:IC.clubs },
  { k:"yoga", label:"Yoga", types:["yoga"], icon:IC.yoga },
  { k:"creative", label:"Creative Classes", types:["art"], icon:IC.palette },
  { k:"more", label:"And Many More", types:["other"], icon:IC.more }
];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const $app = document.getElementById("app"), $nav = document.getElementById("topnav");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const val = id => document.getElementById(id).value.trim();
const LOADING = `<p class="muted">Loading…</p>`;
let sb = null, user = null, roles = { teacher:false, family:false };

/* ---------- addresses ---------- */
function hostSlug(){
  const root = (C.rootDomain || "").toLowerCase(), h = location.hostname.toLowerCase();
  if (!root || h === root || h === "www." + root || !h.endsWith("." + root)) return null;
  return h.slice(0, -(root.length + 1));
}
const onRoot = () => !hostSlug();
const siteUrl = p => (C.rootDomain ? "https://" + C.rootDomain : location.origin) + p;
const groupUrl = slug => C.rootDomain ? `https://${slug}.${C.rootDomain}` : `${location.origin}/g/${slug}`;
const bare = u => u.replace(/^https?:\/\//, "");
const link = (p, text, cls = "") => onRoot()
  ? `<a href="${p}" data-link class="${cls}">${text}</a>` : `<a href="${siteUrl(p)}" class="${cls}">${text}</a>`;
const wa = text => `https://wa.me/?text=${encodeURIComponent(text)}`;
function go(p){ history.pushState(null, "", p); route(); }
function redirect(p){ history.replaceState(null, "", p); route(); }

/* ---------- small helpers ---------- */
function fmtTime(t){ if(!t) return ""; const [h,m] = t.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; return `${((h+11)%12)+1}:${String(m).padStart(2,"0")} ${ap}`; }
function slugify(s){ return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40); }
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today0 = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const weekStartFor = classDay => { const t = today0(); return addDays(t, -((t.getDay() - classDay + 7) % 7)); };
const shortDate = d => d.toLocaleDateString(undefined, { weekday:"short", day:"numeric", month:"short" });
const mmss = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
async function copy(text, btn){
  try { await navigator.clipboard.writeText(text); const o = btn.textContent; btn.textContent = "Copied"; setTimeout(()=>btn.textContent=o,1500); }
  catch(e){ btn.textContent = "Select the link above to copy"; }
}
function friendly(err){
  const m = (err && (err.message || err.error_description)) || "Something went wrong. Please try again.";
  if (/duplicate key|groups_slug_key/i.test(m)) return "That web address is already taken. Please try another.";
  if (/rate limit/i.test(m)) return "Too many tries. Please wait a minute and try again.";
  if (/Failed to fetch|NetworkError/i.test(m)) return "Can't reach GuruShiya. Check your internet connection.";
  return m;
}
function safeNext(){ const n = new URLSearchParams(location.search).get("next") || ""; return /^\/[a-z0-9/_-]*$/i.test(n) && !n.startsWith("//") ? n : "/me"; }

/* ---------- start ---------- */
async function loadRoles(){
  roles = { teacher:false, family:false };
  if (!user) return;
  const [g, s] = await Promise.all([
    sb.from("groups").select("id", { count:"exact", head:true }).eq("owner_id", user.id),
    sb.from("students").select("id", { count:"exact", head:true }).eq("guardian_id", user.id).eq("status", "active")
  ]);
  roles = { teacher: (g.count || 0) > 0, family: (s.count || 0) > 0 };
}
async function init(){
  if (!C.supabaseUrl || !C.supabaseAnonKey || !window.supabase) return viewSetup();
  sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey);
  const { data } = await sb.auth.getSession();
  user = data.session?.user || null;
  await loadRoles();
  sb.auth.onAuthStateChange(async (_e, s) => { const was = user?.id; user = s?.user || null; if (was !== user?.id) { await loadRoles(); route(); } });
  route();
}
addEventListener("popstate", route);
document.addEventListener("click", e => {
  const s = e.target.closest("[data-scroll]");
  if (s) {
    const t = document.getElementById(s.dataset.scroll);
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"start" }); }
    return;
  }
  const a = e.target.closest("a[data-link]");
  if (a && !e.metaKey && !e.ctrlKey) { e.preventDefault(); go(a.getAttribute("href")); }
});

/* The front page has its own maroon-and-gold look; every other page keeps the app look */
function setTheme(home){
  document.body.classList.toggle("home", home);
}
const isHome = () => onRoot() && !/^\/(g|join|consent|signin|me|teacher|practice)(\/|$)/.test(location.pathname);

function route(){
  if (!sb) return;
  clearInterval(poll); setTheme(isHome()); document.title = "GuruShiya";
  renderNav(); scrollTo(0,0);
  const p = location.pathname, hs = hostSlug();
  let m;
  if (hs && (p === "/" || p === "")) return viewGroup(hs);
  if ((m = p.match(/^\/g\/([a-z0-9-]+)\/?$/))) return viewGroup(m[1]);
  if ((m = p.match(/^\/join\/([a-f0-9]{24,64})\/?$/))) return viewJoin(m[1]);
  if ((m = p.match(/^\/consent\/([a-f0-9]{24,64})\/?$/))) return viewConsent(m[1]);
  if (p === "/signin") return viewSignIn();
  if (p === "/me") return redirect(roles.teacher ? "/teacher" : roles.family ? "/practice" : "/teacher");
  if ((m = p.match(/^\/practice(?:\/(notes|chat))?\/?$/))) return viewDesk(m[1] || "");
  if ((m = p.match(/^\/teacher(?:\/(students|classes|chat|page)(?:\/([0-9a-f-]{36}))?)?\/?$/))) return viewTeacher(m[1] || "", m[2] || "");
  if (p === "/v2") return viewHome(2);
  if (p === "/v1") return viewHome(1);
  return viewHomeSimple();
}
function renderNav(){
  const items = [];
  if (isHome() && location.pathname === "/") items.push(`<span class="navlinks"><a href="#about" data-scroll="about" class="navlink">About</a></span>`);
  else if (isHome()) items.push(`<span class="navlinks">
    <a href="#classes" data-scroll="classes" class="navlink">Classes</a><a href="#teachers" data-scroll="teachers" class="navlink">For Teachers</a>
    <a href="#students" data-scroll="students" class="navlink">For Students</a><a href="#about" data-scroll="about" class="navlink">About</a></span>`);
  if (user) {
    if (roles.family) items.push(link("/practice", "Practice", "btn small ghost"));
    if (roles.teacher || !roles.family) items.push(link("/teacher", "Teacher", "btn small ghost"));
    items.push(`<button class="btn small ghost icon" id="signout" type="button" aria-label="Sign out" title="Sign out"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></button>`);
  } else {
    items.push(link("/signin", "Sign in", "btn small ghost"));
    if (isHome()) items.push(link("/teacher", "Get started", "btn small"));
  }
  $nav.innerHTML = items.join("");
  const so = document.getElementById("signout");
  if (so) so.onclick = async () => { await sb.auth.signOut(); user = null; roles = { teacher:false, family:false }; onRoot() ? go("/") : location.href = siteUrl("/"); };
}

/* ---------- setup notice (before Supabase is connected) ---------- */
function viewSetup(){
  $app.innerHTML = `<section class="hero"><span class="eyebrow">Almost ready</span><h1>GuruShiya needs its database</h1>
  <p class="lead">The site is installed. To switch it on, create the free Supabase project and fill in <strong>config.js</strong>. The steps are in SETUP.md.</p></section>`;
}

/* Front page, matched to the GuruShiya logo: ivory, maroon and gold. What it is, and where to tap.
   Everything else is inside after sign-in. */
const LOTUS = `<svg class="gs-lotus" viewBox="0 0 48 22" aria-hidden="true"><path d="M24 2c4.2 5 4.2 11.5 0 17-4.2-5.5-4.2-12 0-17zM24 19c-6.5 0-12-3.2-15-9 6.5 0 12 3.2 15 9zm0 0c6.5 0 12-3.2 15-9-6.5 0-12 3.2-15 9z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const GS_WAYS = [
  ["Learn", "Your guru shares lessons, class notes and homework in one place.",
    `<path d="M3 5.5C6 4 9 4 12 6c3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6v13.5"/>`],
  ["Practise Daily", "A few minutes every day. Press Start, practise, press Stop.",
    `<path d="M12 3c2.2 2.6 2.2 4.8 0 6.6-2.2-1.8-2.2-4 0-6.6z"/><path d="M3.5 12.5h17c-.9 4.3-4.3 7-8.5 7s-7.6-2.7-8.5-7z"/><path d="M20.5 12.5 22 11"/>`],
  ["Progress", "Gurus and families watch the practice add up, week by week.",
    `<path d="M3 20h5v-5h5v-5h5V5h3"/><path d="M17.5 5H21v3.5"/>`]
];
function viewHomeSimple(){
  document.title = "GuruShiya · Connecting gurus and students";
  const studentHref = roles.family ? "/practice" : "/signin?next=/practice";
  $app.innerHTML = `
  <section class="gs2-hero" aria-labelledby="h-title">
    <div class="wrap gs2-hero-in">
      <div class="gs2-intro">
        <h1 id="h-title" class="gs2-logo"><img src="/assets/gs-logo.png" alt="GuruShiya" width="880" height="527"></h1>
        <p class="gs2-tag">Connecting Gurus and Students</p>
        <div class="gs2-orn">${LOTUS}</div>
        <p class="gs2-lead">One simple platform for teachers and students.</p>
        <div class="gs2-ctas">${link("/teacher", `${IC.teacher}<span>I'm a Teacher</span>${IC.chev}`, "gs2-btn maroon")}${link(studentHref, `${IC.student}<span>I'm a Student</span>${IC.chev}`, "gs2-btn ivory")}</div>
      </div>
      <figure class="gs2-arch">
        <picture>
          <source media="(max-width: 600px)" srcset="/assets/bg-tall-600.jpg 600w, /assets/bg-tall.jpg 941w" sizes="100vw">
          <source media="(max-width: 860px)" srcset="/assets/bg-wide-1100.jpg 1100w, /assets/bg-wide.jpg 1672w" sizes="100vw">
          <img src="/assets/bg-tall-600.jpg" srcset="/assets/bg-tall-600.jpg 600w, /assets/bg-tall.jpg 941w" sizes="(max-width: 1180px) 42vw, 480px" width="941" height="1672"
            alt="A guru's hall at sunset: students practising music, dance, Karlakattai, painting and yoga">
        </picture>
      </figure>
    </div>
  </section>
  <section class="gs2-ways" aria-label="How GuruShiya works"><div class="wrap gs2-ways-in">
    ${GS_WAYS.map(([t, d, ic]) => `<div class="gs2-way"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg><div><h2>${t}</h2><p>${d}</p></div></div>`).join("")}
  </div></section>
  <section id="about" class="gs2-about"><div class="wrap gs2-about-in">
    <img class="gs2-about-mark" src="/assets/gs-emblem-light.png" alt="" width="320" height="179">
    <span class="gs2-eyebrow">About us</span>
    <h2 class="gs2-motto">A Digital Kalai Koodam for the Modern Learner</h2>
    <p>GuruShiya brings the timeless bond between guru and student online. Gurus guide, students practise a little every day, and both can see the progress.</p>
    <p>Teachers and students sign in to find their classes, practice, notes and messages.</p>
  </div></section>`;
}

/* ---------- homepage ---------- */
const catStrip = () => `<div class="h-cats" role="group" aria-label="Find classes by type">
      ${FAMILIES.map(f => `<button type="button" class="h-cat" data-fam="${f.k}">${f.icon}<span>${f.label}</span></button>`).join("")}
    </div>`;
const heroText = () => `
      <div class="h-lockup"><img src="/assets/mark-maroon-320.png" alt="" width="132" height="132"><h1 id="h-title">GuruShiya</h1></div>
      <p class="h-tag"><span aria-hidden="true"></span>The Practice Platform for Every Passion<span aria-hidden="true"></span></p>
      <p class="h-band">Learn<i aria-hidden="true">◆</i>Practise Daily<i aria-hidden="true">◆</i>Progress</p>
      <p class="h-lead">A simple and powerful platform for teachers and students across music, dance, movement, arts and many more classes.</p>`;
/* Front page, layout 1: painted sky with the performers scene below it */
const heroV1 = () => `
  <section class="h-hero" aria-labelledby="h-title">
    <div class="h-sky"><div class="wrap h-sky-in">${heroText()}</div></div>
    <div class="h-scene"><img src="/assets/hero-scene.jpg" srcset="/assets/hero-scene-800.jpg 800w, /assets/hero-scene.jpg 1199w" sizes="100vw" width="1199" height="328"
      alt="Students practising flute, Bharatanatyam, Karlakattai, painting and yoga in a temple courtyard at sunset"></div>
    <div class="wrap wide h-cats-wrap">${catStrip()}</div>
  </section>`;
/* Front page, layout 2: the full temple-hall picture behind everything */
const heroV2 = () => `
  <section class="v2-hero" aria-labelledby="h-title">
    <picture class="v2-bg">
      <source media="(max-width: 600px)" srcset="/assets/bg-tall-600.jpg 600w, /assets/bg-tall.jpg 941w" sizes="100vw">
      <img src="/assets/bg-wide.jpg" srcset="/assets/bg-wide-1100.jpg 1100w, /assets/bg-wide.jpg 1672w" sizes="100vw" width="1672" height="941"
        alt="Students practising flute, Bharatanatyam, Karlakattai, painting and yoga in a temple hall at sunset">
    </picture>
    <div class="wrap wide v2-top">${heroText()}</div>
    <div class="wrap wide v2-cats-wrap">${catStrip()}</div>
  </section>`;

async function viewHome(layout = 1){
  document.title = "GuruShiya · The Practice Platform for Every Passion";
  const studentBtn = roles.family
    ? link("/practice", `${IC.student}<span>I'm a Student</span>${IC.chev}`, "h-btn cream")
    : `<a href="#students" data-scroll="students" class="h-btn cream">${IC.student}<span>I'm a Student</span>${IC.chev}</a>`;
  $app.innerHTML = `
  ${layout === 2 ? heroV2() : heroV1()}
  <section class="h-maroon"><div class="wrap wide h-maroon-in">
    <ul class="h-feats">
      <li>${IC.people}<div><h2>Run Your Classes</h2><p>Manage students, lessons and practice plans.</p></div></li>
      <li>${IC.calendar}<div><h2>Build a Daily Practice Habit</h2><p>Short, guided practice between lessons.</p></div></li>
      <li>${IC.chart}<div><h2>Track Real Progress</h2><p>Stay consistent and see the improvement.</p></div></li>
    </ul>
    <div class="h-ctas">${link("/teacher", `${IC.teacher}<span>I'm a Teacher</span>${IC.chev}`, "h-btn gold")}${studentBtn}</div>
    <p class="h-motto"><span aria-hidden="true"></span>A Digital Kalai Koodam for the Modern Learner<span aria-hidden="true"></span></p>
  </div></section>

  <section id="classes" class="h-sec"><div class="wrap wide h-col">
    <div><span class="h-eyebrow">Classes</span><h2 class="h-h2" id="cls-title">Find a class</h2></div>
    <div class="chips" id="chips" role="group" aria-label="Filter classes"></div>
    <div class="grid" id="groups">${LOADING}</div>
  </div></section>

  <section id="teachers" class="h-sec alt"><div class="wrap wide h-two">
    <div class="h-col"><span class="h-eyebrow">For teachers</span><h2 class="h-h2">Keep your class going between lessons</h2>
      <p class="h-p">GuruShiya gives every teacher their own page, a class link for families, and a simple view of who practised this week.</p>
      <div>${link("/teacher", "Create your group page", "h-btn gold small")}</div></div>
    <ol class="h-steps">
      <li><div><strong>Create your group page</strong><span>Your classes, timetable and a way for new students to ask about joining.</span></div></li>
      <li><div><strong>Share the class link on WhatsApp</strong><span>Families join in a minute with the child's first name.</span></div></li>
      <li><div><strong>Set the week's practice</strong><span>See who practised each day, and who needs a gentle nudge.</span></div></li>
    </ol>
  </div></section>

  <section id="students" class="h-sec"><div class="wrap wide h-two">
    <div class="h-col"><span class="h-eyebrow">For students and parents</span><h2 class="h-h2">A little practice, every day</h2>
      <p class="h-p">Your teacher sets a short practice for the week. Open GuruShiya, start the timer, and tick the day. Your teacher sees it too.</p>
      <div>${roles.family ? link("/practice", "Go to my practice", "h-btn gold small") : link("/signin?next=/practice", "Sign in to practise", "h-btn gold small")}</div></div>
    <ol class="h-steps">
      <li><div><strong>Get the class link from your teacher</strong><span>It usually comes on WhatsApp.</span></div></li>
      <li><div><strong>Join with a first name</strong><span>Parents give consent for children. We never ask for age, school or address.</span></div></li>
      <li><div><strong>Practise and tick it off</strong><span>Build a streak, and join online classes from the same place.</span></div></li>
    </ol>
  </div></section>

  <section id="about" class="h-sec alt"><div class="wrap h-col h-about">
    <span class="h-eyebrow">About GuruShiya</span><h2 class="h-h2">A digital Kalai Koodam</h2>
    <p class="h-p">In Tamil, a kalai koodam is a hall where the arts are taught and practised. GuruShiya brings that hall online. Teachers of dance, music, Karlakattai, yoga, art and more run their classes in one place, and students keep up the daily practice that turns lessons into skill.</p>
    <p class="h-p"><em>Guru</em> and <em>shishya</em>: the teacher and the student, learning together.</p>
  </div></section>`;

  const box = document.getElementById("groups"), chips = document.getElementById("chips"), title = document.getElementById("cls-title");
  let pick = "all", data = [];
  const draw = () => {
    const used = FAMILIES.filter(f => f.k === pick || data.some(g => f.types.includes(g.art_type)));
    chips.innerHTML = [`<button type="button" class="chip" data-k="all" aria-pressed="${pick === "all"}">All</button>`,
      ...used.map(f => `<button type="button" class="chip" data-k="${f.k}" aria-pressed="${f.k === pick}">${f.label}</button>`)].join("");
    const fam = FAMILIES.find(f => f.k === pick);
    title.textContent = fam ? `${fam.label} classes` : "Find a class";
    const list = data.filter(g => !fam || fam.types.includes(g.art_type));
    box.innerHTML = list.length ? list.map(g => `
      <a class="card" style="text-decoration:none" href="${groupUrl(g.slug)}" ${C.rootDomain ? "" : "data-link"}>
        <span class="row" style="gap:8px"><span class="dot" style="background:${ARTS[g.art_type]?.dot}"></span><span class="eyebrow">${esc(ARTS[g.art_type]?.label)}</span></span>
        <h3>${esc(g.name)}</h3>
        <span class="muted">${esc(g.teacher_name)} · ${g.is_online ? "Online" : ""}${g.is_online && g.location ? " and " : ""}${esc(g.location || "")}</span>
      </a>`).join("")
      : `<div class="empty">${fam ? `No ${esc(fam.label.toLowerCase())} listed yet.` : "No classes listed yet."} Teachers can create their group page in a few minutes.</div>`;
    chips.querySelectorAll(".chip").forEach(b => b.onclick = () => { pick = b.dataset.k; draw(); });
  };
  document.querySelectorAll(".h-cat").forEach(b => b.onclick = () => {
    pick = b.dataset.fam; draw();
    document.getElementById("classes").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
  const res = await sb.from("groups").select("slug,name,art_type,teacher_name,location,is_online").eq("approved", true).order("name");
  if (res.error) { box.innerHTML = `<p class="notice">${esc(friendly(res.error))}</p>`; return; }
  data = res.data || []; draw();
}

/* ---------- public group page ---------- */
async function viewGroup(slug){
  $app.innerHTML = LOADING;
  const { data: g } = await sb.from("groups").select("*").eq("slug", slug).maybeSingle();
  if (!g) { $app.innerHTML = `<section class="hero"><h1>Page not found</h1><p class="lead">This class page isn't available. It may not be approved yet.</p>${link("/","See all classes","btn ghost")}</section>`; return; }
  document.title = g.name + " · GuruShiya";
  const { data: classes } = await sb.from("classes").select("name,day_of_week,start_time,duration_min").eq("group_id", g.id).order("day_of_week").order("start_time");
  const mine = user && user.id === g.owner_id;
  $app.innerHTML = `
    ${!g.approved && mine ? `<p class="notice">Only you can see this page for now. It goes public once GuruShiya approves it.</p>` : ""}
    <section class="hero"><span class="row" style="gap:8px"><span class="dot" style="background:${ARTS[g.art_type]?.dot}"></span><span class="eyebrow">${esc(ARTS[g.art_type]?.label)}</span></span>
      <h1>${esc(g.name)}</h1>
      <p class="lead">With ${esc(g.teacher_name)}${g.location ? " · " + esc(g.location) : ""}${g.is_online ? " · Online classes" : ""}</p></section>
    ${g.bio ? `<section class="card"><h2>About</h2><p style="margin:0;white-space:pre-line;max-width:65ch">${esc(g.bio)}</p></section>` : ""}
    <section class="card"><h2>Timetable</h2>
      ${classes && classes.length ? `<div class="scroll"><table class="tt"><thead><tr><th>Class</th><th>Day</th><th>Time</th><th>Length</th></tr></thead><tbody>
        ${classes.map(k => `<tr><td>${esc(k.name)}</td><td>${DAYS[k.day_of_week]}</td><td>${fmtTime(k.start_time)}</td><td>${k.duration_min} min</td></tr>`).join("")}
      </tbody></table></div>` : `<div class="empty">No classes listed yet.</div>`}
    </section>
    <section class="card"><h2>Ask about classes</h2>
      <form id="enq"><div class="two">
        <label for="enq-name">Your name<input id="enq-name" required maxlength="80" autocomplete="name"></label>
        <label for="enq-contact">Email or phone<input id="enq-contact" required maxlength="120" autocomplete="email"></label></div>
        <label for="enq-msg">Message<textarea id="enq-msg" maxlength="1000" placeholder="Which class are you interested in? For a child, please share their age group only."></textarea></label>
        <div class="row"><button class="btn" type="submit">Send</button><span id="enq-out" class="muted" role="status"></span></div>
      </form></section>`;
  document.getElementById("enq").onsubmit = async e => {
    e.preventDefault();
    const out = document.getElementById("enq-out"), b = e.target.querySelector("button"); b.disabled = true;
    const { error } = await sb.from("enquiries").insert({ group_id: g.id, name: val("enq-name"), contact: val("enq-contact"), message: val("enq-msg") || null });
    b.disabled = false;
    if (error) { out.textContent = g.approved ? friendly(error) : "Enquiries open once the page is approved."; return; }
    e.target.reset(); out.textContent = "Sent. The teacher will get back to you.";
  };
}

/* ======================= SIGN IN (Google, Facebook, email) ======================= */
const FB_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#fff"/><path fill="#1877F2" d="M13.4 24v-8.4h2.8l.4-3.3h-3.2v-2.1c0-.9.3-1.6 1.6-1.6h1.7V5.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.2v3.3H10V24z"/></svg>`;
let gisPromise = null;
function loadGis(){
  if (!gisPromise) gisPromise = new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = res; s.onerror = () => { gisPromise = null; rej(new Error("Google sign-in could not load")); };
    document.head.appendChild(s);
  });
  return gisPromise;
}
async function sha256hex(t){ const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }

function signInBlock(next){
  const gHtml = C.googleClientId ? `<div class="g-wrap"><div id="si-google" class="g-btn"></div></div>` : "";
  const fbHtml = C.facebookLogin ? `<button type="button" class="btn fb" id="si-fb">${FB_ICON}<span>Continue with Facebook</span></button>` : "";
  const social = !!(gHtml || fbHtml);
  const html = `<div class="signin">${gHtml}${fbHtml}
    ${social ? `<div class="or"><span>or use your email</span></div>` : ""}
    <form id="si"><label for="si-email">Email<input id="si-email" type="email" required autocomplete="email"></label>
      <button class="btn${social ? " ghost" : ""}" type="submit">Email me a sign-in link</button></form>
    <div id="si-out" role="status"></div></div>`;
  async function wire(){
    const out = document.getElementById("si-out"), fail = m => out.innerHTML = `<div class="notice">${esc(m)}</div>`;
    document.getElementById("si").onsubmit = async e => {
      e.preventDefault(); const b = e.target.querySelector("button"); b.disabled = true;
      const { error } = await sb.auth.signInWithOtp({ email: val("si-email"), options: { emailRedirectTo: siteUrl(next) } });
      b.disabled = false;
      out.innerHTML = error ? `<div class="notice">${esc(friendly(error))}</div>`
        : `<div class="notice ok">Check your email and tap the link to continue. It may be in your spam folder.</div>`;
    };
    const fb = document.getElementById("si-fb");
    if (fb) fb.onclick = async () => { const { error } = await sb.auth.signInWithOAuth({ provider: "facebook", options: { redirectTo: siteUrl(next) } }); if (error) fail(friendly(error)); };
    const gEl = document.getElementById("si-google");
    if (gEl) {
      try {
        await loadGis();
        const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
        window.google.accounts.id.initialize({ client_id: C.googleClientId, nonce: await sha256hex(raw), use_fedcm_for_prompt: true,
          callback: async r => { const { error } = await sb.auth.signInWithIdToken({ provider: "google", token: r.credential, nonce: raw }); if (error) fail(friendly(error)); } });
        window.google.accounts.id.renderButton(gEl, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "pill", logo_alignment: "left", width: Math.min(360, gEl.clientWidth || 320) });
      } catch (e) { gEl.closest(".g-wrap").hidden = true; }
    }
  }
  return { html, wire };
}
function viewSignIn(){
  const next = safeNext();
  if (user) return redirect(next);
  const b = signInBlock(next);
  $app.innerHTML = `<section class="card narrow"><span class="eyebrow">Welcome to GuruShiya</span><h1 class="page-h">Sign in</h1>
    <p class="muted m0">Teachers sign in or create an account here. Students and families use the link their teacher sends.</p>${b.html}
    <p class="hint m0">First time here? Signing in creates your account. No password needed.</p></section>`;
  b.wire();
}
const notWorking = () => { $app.innerHTML = `<section class="card narrow"><h1 class="page-h">This link isn't working</h1>
  <p class="muted m0">It may be old or already used. Please ask your teacher to send a new one.</p>${link("/", "Go to GuruShiya", "btn ghost")}</section>`; };

/* ======================= PARENT CONSENT (no account needed) ======================= */
async function viewConsent(token){
  if (!onRoot()) { location.href = siteUrl("/consent/" + token); return; }
  $app.innerHTML = LOADING;
  const { data } = await sb.rpc("invite_info", { token });
  const k = data && data[0];
  if (!k || k.step !== "consent") return notWorking();
  const head = `<span class="eyebrow">Parent consent</span>
    <h1 class="page-h">${esc(k.teacher_name)} would like to add ${esc(k.first_name)} to ${esc(k.class_name)}</h1>
    <p class="muted m0">${esc(k.group_name)} · ${DAYS[k.day_of_week]}s at ${fmtTime(k.start_time)}</p>`;
  const done = (title, text) => { $app.innerHTML = `<section class="card narrow">${head}<div class="notice ok"><strong>${esc(title)}</strong><br>${esc(text)}</div></section>`; };
  if (k.status === "declined") return done("You said no", `${k.first_name} won't be added. If you change your mind, ask ${k.teacher_name} to send a new request.`);
  if (k.status !== "waiting_consent") return done("Consent already given. Thank you.", `${k.teacher_name} will send you a link to start practising.`);
  $app.innerHTML = `<section class="card narrow">${head}
    <div class="facts">
      <div><strong>What GuruShiya keeps</strong><span>${esc(k.first_name)}'s first name, the days and minutes they practise, and messages with the teacher.</span></div>
      <div><strong>Who can see it</strong><span>Only your family and ${esc(k.teacher_name)}.</span></div>
      <div><strong>What we never ask for</strong><span>Age, school, address or photos.</span></div>
    </div>
    <form id="cf">
      <label for="cf-name">Your name<input id="cf-name" required minlength="2" maxlength="80" autocomplete="name"></label>
      <label class="check" for="cf-ok"><input id="cf-ok" type="checkbox" required><span>I'm ${esc(k.first_name)}'s parent or guardian, and I agree.</span></label>
      <div class="row"><button class="btn" type="submit">Yes, I agree</button><button class="btn ghost" type="button" id="cf-no">No, thank you</button></div>
      <div id="cf-out" role="status"></div>
    </form></section>`;
  const out = document.getElementById("cf-out");
  document.getElementById("cf").onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector("button[type=submit]"); b.disabled = true;
    const { error } = await sb.rpc("answer_consent", { token, parent_name: val("cf-name"), agree: true });
    b.disabled = false;
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    done("Thank you. Consent given.", `${k.teacher_name} will now send you a link to start ${k.first_name}'s practice.`);
  };
  const no = document.getElementById("cf-no");
  no.onclick = async () => {
    if (!no.dataset.sure) { no.dataset.sure = "1"; no.textContent = "Tap again to say no"; return; }
    const { error } = await sb.rpc("answer_consent", { token, parent_name: "", agree: false });
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    done("Thanks for letting us know", `${k.first_name} won't be added to the class.`);
  };
}

/* ======================= JOIN INVITATION (teacher sends it after consent) ======================= */
async function viewJoin(token){
  if (!onRoot()) { location.href = siteUrl("/join/" + token); return; }
  $app.innerHTML = LOADING;
  const { data } = await sb.rpc("invite_info", { token });
  const k = data && data[0];
  if (!k || k.step !== "join") return notWorking();
  if (k.mine) return redirect("/practice");
  const head = `<span class="eyebrow">Your invitation</span>
    <h1 class="page-h">${k.is_adult ? `Join ${esc(k.class_name)}` : `Start ${esc(k.first_name)}'s practice in ${esc(k.class_name)}`}</h1>
    <p class="muted m0">${esc(k.group_name)} with ${esc(k.teacher_name)} · ${DAYS[k.day_of_week]}s at ${fmtTime(k.start_time)}</p>`;
  const say = (t) => { $app.innerHTML = `<section class="card narrow">${head}<div class="notice">${esc(t)}</div></section>`; };
  if (k.status === "waiting_consent" || k.status === "declined") return say("A parent needs to give consent first. Your teacher will send this link again after that.");
  if (k.status === "active") return say("This invitation has already been used. If that wasn't you, ask your teacher for a new one.");
  if (!user) {
    const b = signInBlock("/join/" + token);
    $app.innerHTML = `<section class="card narrow">${head}
      <p class="m0">${k.is_adult ? "Sign in to start." : `Sign in with the parent's account. ${esc(k.first_name)}'s practice will be kept on it.`}</p>${b.html}</section>`;
    b.wire(); return;
  }
  $app.innerHTML = `<section class="card narrow">${head}
    <p class="m0">You're signed in as <strong>${esc(user.email || "this account")}</strong>. ${k.is_adult ? "Your practice will be kept here." : `${esc(k.first_name)}'s practice will be kept on this account.`}</p>
    <form id="jf">${k.is_adult ? `<label class="check" for="jf-ok"><input id="jf-ok" type="checkbox" required><span>I agree to GuruShiya keeping my first name, practice and messages. Only I and ${esc(k.teacher_name)} can see them.</span></label>` : ""}
      <button class="btn big" type="submit">Start practising</button><div id="jf-out" role="status"></div></form></section>`;
  document.getElementById("jf").onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector("button"); b.disabled = true;
    const ok = document.getElementById("jf-ok");
    const { data: sid, error } = await sb.rpc("accept_invite", { token, agree: ok ? ok.checked : false });
    b.disabled = false;
    if (error) { document.getElementById("jf-out").innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    roles.family = true; store.set("riyaz.enrol", sid); go("/practice");
  };
}

/* ======================= SHARED BITS ======================= */
const store = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }, del(k){ try { localStorage.removeItem(k); } catch(e){} } };
let poll = null;
const AV = ["#e0607a","#0f7c86","#b5651d","#5a9e4b","#8a4fb0","#c4651a","#1b5fa8","#7a1424"];
const avColor = n => AV[[...String(n).toLowerCase()].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
const avatar = (n, size = 44) => `<span class="avatar" style="background:${avColor(n)};width:${size}px;height:${size}px;font-size:${Math.round(size*.42)}px" aria-hidden="true">${esc(String(n).trim().charAt(0).toUpperCase())}</span>`;
const fmtMins = m => m >= 60 ? `${Math.floor(m/60)} h${m % 60 ? " " + (m % 60) + " min" : ""}` : `${m} min`;
const timeAgo = t => { const d = new Date(t), s = (Date.now() - d) / 1000; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s/60) + " min ago"; if (s < 86400) return Math.floor(s/3600) + " h ago"; if (s < 7*86400) return d.toLocaleDateString(undefined,{weekday:"short"}); return d.toLocaleDateString(undefined,{day:"numeric",month:"short"}); };
const POST_KINDS = { homework: { label: "Homework", cls: "hw" }, class_note: { label: "Class notes", cls: "cn" }, post: { label: "Announcement", cls: "an" } };
function bestStreak(done, classDay, days = 56){
  let best = 0, run = 0;
  for (let i = days; i >= 0; i--) { const d = addDays(today0(), -i); if (d.getDay() === classDay) continue; if (done.has(ymd(d))) { run++; best = Math.max(best, run); } else run = 0; }
  return best;
}
const tabsNav = (items, active, label) => `<nav class="tabs" aria-label="${label}">${items.map(([href, text, badge]) =>
  `<a href="${href}" data-link class="tab" ${href === active ? 'aria-current="page"' : ""}>${text}${badge ? `<span class="badge">${badge}</span>` : ""}</a>`).join("")}</nav>`;

/* Chat thread used by teachers and families */
async function chatThread(el, s, asTeacher, otherName){
  const draw = async () => {
    if (!el.isConnected) { clearInterval(poll); return; }
    const { data } = await sb.from("chat_messages").select("id,body,from_teacher,created_at,read_at").eq("student_id", s.id).eq("kind", "chat").order("created_at");
    const list = el.querySelector(".chat-list"), atEnd = !list || list.scrollTop + list.clientHeight >= list.scrollHeight - 30;
    const msgs = data || [];
    const html = msgs.length ? msgs.map(m => { const mine = m.from_teacher === asTeacher;
      return `<div class="bubble ${mine ? "me" : "them"}"><p>${esc(m.body)}</p><span>${mine ? "You" : esc(otherName)} · ${timeAgo(m.created_at)}${mine && m.read_at ? " · Seen" : ""}</span></div>`; }).join("")
      : `<div class="empty">No messages yet. Say hello!</div>`;
    if (list) { list.innerHTML = html; if (atEnd) list.scrollTop = list.scrollHeight; }
    if (msgs.some(m => m.from_teacher !== asTeacher && !m.read_at)) await sb.rpc("mark_chat_read", { student: s.id, as_teacher: asTeacher });
  };
  el.innerHTML = `<div class="chat"><div class="chat-list" aria-live="polite">${LOADING}</div>
    <form class="chat-form"><label class="sr" for="cm-${s.id}">Message</label><textarea id="cm-${s.id}" rows="2" maxlength="2000" placeholder="Write a message…" required></textarea>
    <button class="btn" type="submit">Send</button></form><div class="out" role="status"></div></div>`;
  el.querySelector(".chat-form").onsubmit = async e => {
    e.preventDefault(); const ta = e.target.querySelector("textarea"), b = e.target.querySelector("button"); if (!ta.value.trim()) return; b.disabled = true;
    const { error } = await sb.rpc("send_chat", { student: s.id, body: ta.value, as_teacher: asTeacher });
    b.disabled = false;
    if (error) { el.querySelector(".out").innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    ta.value = ""; await draw(); const l = el.querySelector(".chat-list"); l.scrollTop = l.scrollHeight;
  };
  el.querySelector("textarea").onkeydown = e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.target.form.requestSubmit(); };
  await draw(); const l = el.querySelector(".chat-list"); l.scrollTop = l.scrollHeight;
  clearInterval(poll); poll = setInterval(() => { if (!document.hidden) draw(); }, 15000);
}

/* ======================= STUDENT DESK (the practice app) ======================= */
let wake = null;
async function keepAwake(){ try { wake = await navigator.wakeLock?.request("screen"); } catch(e){} }
function chime(){ try { const a = new (window.AudioContext||window.webkitAudioContext)(); [0,.25,.5].forEach((o,i)=>{ const g=a.createGain(), s=a.createOscillator(); s.frequency.value=[660,880,990][i]; s.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.2,a.currentTime+o); g.gain.exponentialRampToValueAtTime(.001,a.currentTime+o+.6); s.start(a.currentTime+o); s.stop(a.currentTime+o+.6); }); } catch(e){} }
function streak(done, classDay){
  let d = today0(), n = 0;
  if (!done.has(ymd(d))) d = addDays(d, -1);
  for (let i = 0; i < 90; i++) { if (d.getDay() === classDay) { d = addDays(d, -1); continue; } if (!done.has(ymd(d))) break; n++; d = addDays(d, -1); }
  return n;
}
function classOpenNow(k){
  const now = new Date(), [h,m] = k.start_time.split(":").map(Number), st = h*60+m, cur = now.getHours()*60+now.getMinutes();
  return now.getDay() === k.day_of_week && cur >= st - 10 && cur <= st + k.duration_min;
}
function nextClassText(k){
  const [h,m] = k.start_time.split(":").map(Number), now = new Date();
  let diff = (k.day_of_week - now.getDay() + 7) % 7;
  if (diff === 0 && now.getHours()*60 + now.getMinutes() > h*60 + m + k.duration_min) diff = 7;
  return (diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : shortDate(addDays(today0(), diff))) + ", " + fmtTime(k.start_time);
}
const FLAME = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/></svg>`;

async function viewDesk(tab = ""){
  if (!onRoot()) { location.href = siteUrl("/practice"); return; }
  if (!user) return go("/signin?next=/practice");
  $app.innerHTML = LOADING;
  const { data: rows, error } = await sb.from("students")
    .select("id,first_name,is_adult,class_id,classes(id,name,day_of_week,start_time,duration_min,groups(name,teacher_name))")
    .eq("guardian_id", user.id).eq("status", "active").order("created_at");
  if (error) { $app.innerHTML = `<p class="notice">${esc(friendly(error))}</p>`; return; }
  const enrols = (rows || []).filter(r => r.classes);
  if (!enrols.length) { $app.innerHTML = `<section class="card narrow"><h1 class="page-h">No classes yet</h1>
    <p class="muted m0">Your teacher will send you a link to join. Open it on this device to start practising.</p></section>`; return; }
  // One profile per first name; each profile can have several classes
  const people = [];
  enrols.forEach(r => { const key = r.first_name.trim().toLowerCase(); let p = people.find(x => x.key === key); if (!p) people.push(p = { key, name: r.first_name.trim(), enrols: [] }); p.enrols.push(r); });
  let cur = enrols.find(r => r.id === store.get("riyaz.enrol")) || enrols[0];
  const person = people.find(p => p.enrols.includes(cur));
  store.set("riyaz.enrol", cur.id);
  const k = cur.classes, g = k.groups || {};
  const ids = enrols.map(r => r.id);
  const [logsR, taskR, linkR, postsR, unreadR] = await Promise.all([
    sb.from("practice_logs").select("student_id,day,minutes,sessions").in("student_id", ids).gte("day", ymd(addDays(today0(), -70))),
    sb.from("practice_tasks").select("*").eq("class_id", k.id).lte("week_start", ymd(today0())).order("week_start", { ascending: false }).limit(1),
    sb.from("class_links").select("meeting_url").eq("class_id", k.id),
    sb.from("chat_messages").select("id,kind,body,created_at").eq("class_id", k.id).is("student_id", null).order("created_at", { ascending: false }).limit(50),
    sb.from("chat_messages").select("id", { count: "exact", head: true }).eq("student_id", cur.id).eq("from_teacher", true).is("read_at", null)
  ]);
  const logs = logsR.data || [], task = (taskR.data || [])[0], url = (linkR.data || [])[0]?.meeting_url, posts = postsR.data || [];
  const myLogs = logs.filter(l => l.student_id === cur.id), done = new Set(myLogs.map(l => l.day));
  const personLogs = logs.filter(l => person.enrols.some(e => e.id === l.student_id));
  const monthKey = ymd(today0()).slice(0, 7), monthMins = personLogs.filter(l => l.day.startsWith(monthKey)).reduce((a, l) => a + (l.minutes || 0), 0);
  const st = streak(done, k.day_of_week);
  const seenKey = "riyaz.seen." + cur.id, seen = store.get(seenKey) || "";
  const newPosts = posts.filter(p => p.created_at > seen).length, unread = unreadR.count || 0;

  $app.innerHTML = `
    <section class="me-head">
      <div class="row" style="gap:12px;flex-wrap:nowrap">${avatar(person.name, 56)}
        <div style="min-width:0"><h1 class="page-h">${esc(person.name)}</h1>
          <span class="muted">${st ? `${st}-day streak · ` : ""}${fmtMins(monthMins)} this month</span></div></div>
      ${people.length > 1 ? `<div class="chips" role="group" aria-label="Switch student">${people.map(p => `<button type="button" class="chip" data-person="${esc(p.key)}" aria-pressed="${p === person}">${esc(p.name)}</button>`).join("")}</div>` : ""}
    </section>
    ${person.enrols.length > 1 ? `<div class="chips" role="group" aria-label="Choose a class">${person.enrols.map(e => `<button type="button" class="chip" data-enrol="${e.id}" aria-pressed="${e === cur}">${esc(e.classes.name)}</button>`).join("")}</div>` : ""}
    <p class="muted m0 cls-line"><strong>${esc(k.name)}</strong> · ${esc(g.name)} with ${esc(g.teacher_name)}</p>
    ${tabsNav([["/practice", "Practice"], ["/practice/notes", "Homework & notes", newPosts], ["/practice/chat", "Chat", unread]], "/practice" + (tab ? "/" + tab : ""), "Student menu")}
    <div id="pane"></div>`;
  $app.querySelectorAll("[data-person]").forEach(b => b.onclick = () => { const p = people.find(x => x.key === b.dataset.person); store.set("riyaz.enrol", p.enrols[0].id); viewDesk(tab); });
  $app.querySelectorAll("[data-enrol]").forEach(b => b.onclick = () => { store.set("riyaz.enrol", b.dataset.enrol); viewDesk(tab); });
  const pane = document.getElementById("pane");

  if (tab === "notes") {
    let filter = "all";
    const draw = () => {
      const list = posts.filter(p => filter === "all" || p.kind === filter);
      pane.innerHTML = `<div class="chips" role="group" aria-label="Show">${[["all","All"],["homework","Homework"],["class_note","Class notes"],["post","Announcements"]].map(([v,t]) => `<button type="button" class="chip" data-f="${v}" aria-pressed="${v===filter}">${t}</button>`).join("")}</div>
        <div class="stack" style="gap:12px;margin-top:12px">${list.length ? list.map(p => `<article class="post ${POST_KINDS[p.kind].cls}${p.created_at > seen ? " new" : ""}">
          <div class="row between"><span class="pill ${POST_KINDS[p.kind].cls}">${POST_KINDS[p.kind].label}</span><span class="hint">${timeAgo(p.created_at)}${p.created_at > seen ? " · New" : ""}</span></div>
          <p>${esc(p.body)}</p></article>`).join("") : `<div class="empty">Nothing here yet. Your teacher's homework and class notes will appear here.</div>`}</div>`;
      pane.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { filter = b.dataset.f; draw(); });
    };
    draw(); if (posts[0]) store.set(seenKey, posts[0].created_at);
    return;
  }
  if (tab === "chat") {
    pane.innerHTML = `<div class="card"><h2>Chat with ${esc(g.teacher_name)}</h2><div id="thread"></div></div>`;
    return chatThread(document.getElementById("thread"), cur, false, g.teacher_name);
  }

  // ---- Practice tab: Start / Stop ----
  const goal = task?.minutes || 10, TK = "riyaz.timer." + cur.id, ws = weekStartFor(k.day_of_week), t0 = today0();
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const minsOn = key => myLogs.filter(l => l.day === key).reduce((a, l) => a + (l.minutes || 0), 0);
  const todayLog = myLogs.find(l => l.day === ymd(t0));
  const weekDays = days.slice(1).filter(d => done.has(ymd(d))).length, weekMins = days.reduce((a, d) => a + minsOn(ymd(d)), 0);
  const latestHw = posts.find(p => p.kind === "homework");
  pane.innerHTML = `
    <section class="practice">
      <span class="eyebrow light">This week's practice · goal ${goal} min a day</span>
      <p class="task-title">${task ? esc(task.title) : "Practise what you learned in class."}</p>
      ${task?.demo_url ? `<a class="demo" href="${esc(task.demo_url)}" target="_blank" rel="noopener">Watch the demo</a>` : ""}
      <div class="ring-wrap">
        <svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" id="ring" stroke-dasharray="326.7" stroke-dashoffset="326.7" transform="rotate(-90 60 60)"/></svg>
        <div class="ring-text"><span class="clock" id="clock">0:00</span><span class="hint light" id="goal-txt">of ${goal} min</span></div>
      </div>
      <div class="row center"><button class="btn big start" type="button" id="go">Start</button><button class="btn ghost light small" type="button" id="cancel" hidden>Cancel</button></div>
      <div id="p-out" role="status"></div>
    </section>
    <section class="card">
      <div class="row between"><h2>This week</h2><span class="count">${weekDays} of 6 days · ${fmtMins(weekMins)}</span></div>
      <div class="week">${days.map((d, i) => { const key = ymd(d), on = done.has(key), m = minsOn(key);
        if (i === 0) return `<div class="day class"><span>${SHORT[d.getDay()]}</span><b>${d.getDate()}</b><small>Class</small></div>`;
        return `<button type="button" class="day${on ? " done" : ""}${+d === +t0 ? " today" : ""}" data-day="${key}" ${d > t0 ? "disabled" : ""} aria-pressed="${on}" aria-label="${DAYS[d.getDay()]} ${d.getDate()}${on ? `, practised ${m} minutes` : ""}"><span>${SHORT[d.getDay()]}</span><b>${d.getDate()}</b><small>${on ? (m ? m + "m" : "✓") : ""}</small></button>`; }).join("")}</div>
      <p class="hint m0">${todayLog ? `Today: ${fmtMins(todayLog.minutes || 0)}${todayLog.sessions > 1 ? ` in ${todayLog.sessions} sessions` : ""}.` : "Not practised yet today."} Forgot to time it? Tap a day to tick it.</p>
      <details><summary>Add time I practised without the timer</summary>
        <form id="addm" class="row" style="margin-top:10px;align-items:flex-end">
          <label for="addm-day">Day<select id="addm-day">${Array.from({ length: 7 }, (_, i) => addDays(t0, -i)).map((d, i) => `<option value="${ymd(d)}">${i === 0 ? "Today" : i === 1 ? "Yesterday" : shortDate(d)}</option>`).join("")}</select></label>
          <label for="addm-min">Minutes<input id="addm-min" type="number" min="1" max="300" value="${goal}" required style="width:110px"></label>
          <button class="btn small" type="submit">Add</button></form></details>
    </section>
    ${latestHw ? `<section class="card"><div class="row between"><h2>Latest homework</h2>${link("/practice/notes", "All notes", "btn small ghost")}</div><p class="m0" style="white-space:pre-line">${esc(latestHw.body)}</p></section>` : ""}
    <section class="card">${url && classOpenNow(k) ? `<a class="btn big teal" href="${esc(url)}" target="_blank" rel="noopener">Join online class now</a>`
      : `<p class="m0"><strong>Next class:</strong> ${nextClassText(k)}${url ? `<br><span class="hint">The Join button appears here 10 minutes before class.</span>` : ""}</p>`}</section>`;

  const out = document.getElementById("p-out"), goBtn = document.getElementById("go"), cancel = document.getElementById("cancel");
  const ring = document.getElementById("ring"), clock = document.getElementById("clock");
  let tick = null, chimed = false;
  const startedAt = () => +store.get(TK) || 0;
  const paint = () => {
    const s0 = startedAt(), secs = s0 ? Math.floor((Date.now() - s0) / 1000) : 0;
    clock.textContent = mmss(secs);
    ring.setAttribute("stroke-dashoffset", String(326.7 * (1 - Math.min(1, secs / (goal * 60)))));
    if (s0 && !chimed && secs >= goal * 60) { chimed = true; chime(); out.innerHTML = `<div class="notice ok">Goal reached! Keep going or press Stop to save.</div>`; }
    goBtn.textContent = s0 ? "Stop" : "Start"; goBtn.classList.toggle("stop", !!s0); cancel.hidden = !s0;
  };
  const run = () => { clearInterval(tick); tick = setInterval(() => { if (!clock.isConnected) { clearInterval(tick); return; } paint(); }, 1000); paint(); };
  goBtn.onclick = async () => {
    if (!startedAt()) { store.set(TK, String(Date.now())); chimed = false; out.innerHTML = ""; keepAwake(); run(); return; }
    const mins = Math.min(300, Math.round((Date.now() - startedAt()) / 60000));
    if (mins < 1) { out.innerHTML = `<div class="notice">Practise for at least a minute to save it. Keep going, or press Cancel.</div>`; return; }
    goBtn.disabled = true;
    const { error } = await sb.rpc("add_practice", { student: cur.id, mins, on_day: ymd(today0()) });
    goBtn.disabled = false;
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    store.del(TK); clearInterval(tick); try { wake?.release(); } catch(e){}
    viewDesk(""); setTimeout(() => { const o = document.getElementById("p-out"); if (o) o.innerHTML = `<div class="notice ok">Saved ${fmtMins(mins)}. Well done, ${esc(person.name)}! ${esc(g.teacher_name)} will see it.</div>`; }, 400);
  };
  cancel.onclick = () => { if (!cancel.dataset.sure) { cancel.dataset.sure = "1"; cancel.textContent = "Tap again to cancel"; return; } store.del(TK); clearInterval(tick); out.innerHTML = ""; cancel.dataset.sure = ""; cancel.textContent = "Cancel"; paint(); };
  if (startedAt()) run(); else paint();
  pane.querySelectorAll("[data-day]").forEach(b => b.onclick = async () => {
    const key = b.dataset.day;
    const r = done.has(key) ? await sb.from("practice_logs").delete().eq("student_id", cur.id).eq("day", key)
                            : await sb.rpc("add_practice", { student: cur.id, mins: 0, on_day: key });
    if (r.error) { out.innerHTML = `<div class="notice">${esc(friendly(r.error))}</div>`; return; }
    viewDesk("");
  });
  document.getElementById("addm").onsubmit = async e => {
    e.preventDefault();
    const { error } = await sb.rpc("add_practice", { student: cur.id, mins: +val("addm-min"), on_day: val("addm-day") });
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    viewDesk("");
  };
}

/* ======================= TEACHER PORTAL ======================= */
const STATUS = {
  waiting_consent: { label: "Waiting for parent", cls: "wait" },
  consented: { label: "Parent said yes", cls: "info" },
  invited: { label: "Invited", cls: "info" },
  active: { label: "Active", cls: "ok" },
  declined: { label: "Parent said no", cls: "grey" }
};
const statusPill = s => `<span class="pill ${STATUS[s.status]?.cls || ""}">${STATUS[s.status]?.label || esc(s.status)}</span>`;
const waDigits = p => { let d = String(p || "").replace(/\D/g, ""); if (d.length === 10) d = "1" + d; return d; };
const nextStep = s => s.status === "waiting_consent" ? { which: "consent", label: s.consent_sent_at ? "Send again" : "Ask for consent" }
  : s.status === "consented" ? { which: "join", label: "Send join link" }
  : s.status === "invited" ? { which: "join", label: s.join_sent_at ? "Send again" : "Send join link" } : null;

function inviteText(s, which, g, k){
  const url = siteUrl(which === "consent" ? "/consent/" + s.consent_token : "/join/" + s.join_token);
  if (which === "consent") return `Hello${s.contact_name ? " " + s.contact_name : ""}, this is ${g.teacher_name} from ${g.name}. I'd like to add ${s.first_name} to my ${k.name} class on GuruShiya, where students keep track of their daily practice. Please confirm you agree here: ${url}`;
  if (s.is_adult) return `Hello ${s.first_name}, this is ${g.teacher_name} from ${g.name}. Here is your link to join ${k.name} on GuruShiya and keep track of your daily practice: ${url}`;
  return `Hello${s.contact_name ? " " + s.contact_name : ""}, thank you for agreeing. ${s.first_name}'s place in ${k.name} is ready. Open this link to start practising: ${url}`;
}
function openInvite(s, which, g, k, onDone){
  const text = inviteText(s, which, g, k), phone = s.contact_phone, email = s.contact_email;
  const subject = which === "consent" ? `Consent for ${s.first_name} to join ${k.name} on GuruShiya` : `${s.first_name}'s GuruShiya link for ${k.name}`;
  const dlg = document.createElement("dialog"); dlg.className = "dlg"; dlg.setAttribute("aria-labelledby", "dlg-h");
  dlg.innerHTML = `<div class="dlg-in">
    <h2 id="dlg-h">${which === "consent" ? `Ask ${esc(s.contact_name || "the parent")} for consent` : `Send ${esc(s.first_name)}'s join link`}</h2>
    <p class="muted m0">Choose how to send it. Your WhatsApp, messages or email opens with this message ready. Just press send.</p>
    <div class="msg-preview">${esc(text)}</div>
    <div class="send-btns">
      <a class="btn wa" data-send target="_blank" rel="noopener" href="${phone ? `https://wa.me/${waDigits(phone)}?text=${encodeURIComponent(text)}` : wa(text)}">WhatsApp</a>
      ${phone ? `<a class="btn ghost" data-send href="sms:${esc(phone.replace(/[^\d+]/g, ""))}?&body=${encodeURIComponent(text)}">Text message</a>` : ""}
      ${email ? `<a class="btn ghost" data-send href="mailto:${esc(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}">Email</a>` : ""}
      <button class="btn ghost" type="button" data-copy>Copy message</button>
    </div>
    <div class="row between"><span class="hint">${[phone, email].filter(Boolean).map(esc).join(" · ")}</span><button class="btn small" type="button" data-close>Done</button></div>
  </div>`;
  document.body.appendChild(dlg);
  let sent = false;
  const mark = async () => { if (sent) return; sent = true; await sb.rpc("mark_invite_sent", { student: s.id, which }); };
  dlg.querySelectorAll("[data-send]").forEach(a => a.addEventListener("click", mark));
  dlg.querySelector("[data-copy]").onclick = e => { mark(); copy(text, e.currentTarget); };
  const close = () => { dlg.close(); dlg.remove(); if (onDone) onDone(); };
  dlg.querySelector("[data-close]").onclick = close;
  dlg.addEventListener("cancel", e => { e.preventDefault(); close(); });
  dlg.showModal();
}

async function loadGroup(g){
  const none = { data: [] };
  const { data: classes } = await sb.from("classes").select("*").eq("group_id", g.id).order("day_of_week").order("start_time");
  const cl = classes || [], cids = cl.map(k => k.id);
  const [links, studs, tasks, unread] = await Promise.all([
    cids.length ? sb.from("class_links").select("*").in("class_id", cids) : none,
    cids.length ? sb.from("students").select("*").in("class_id", cids).order("first_name") : none,
    cids.length ? sb.from("practice_tasks").select("*").in("class_id", cids).lte("week_start", ymd(today0())).order("week_start", { ascending: false }) : none,
    sb.from("chat_messages").select("id", { count: "exact", head: true }).eq("group_id", g.id).eq("kind", "chat").eq("from_teacher", false).is("read_at", null)
  ]);
  const st = studs.data || [], act = st.filter(s => s.status === "active").map(s => s.id);
  const logs = act.length ? ((await sb.from("practice_logs").select("student_id,day,minutes,sessions").in("student_id", act).gte("day", ymd(addDays(today0(), -63)))).data || []) : [];
  const D = { classes: cl, links: links.data || [], studs: st, tasks: tasks.data || [], logs, unread: unread.count || 0 };
  D.classOf = id => cl.find(k => k.id === id) || { name: "", day_of_week: 0, start_time: "00:00", duration_min: 60 };
  D.linkOf = id => D.links.find(l => l.class_id === id)?.meeting_url || "";
  D.done = sid => new Set(logs.filter(l => l.student_id === sid).map(l => l.day));
  D.mins = (sid, day) => logs.filter(l => l.student_id === sid && l.day === day).reduce((a, l) => a + (l.minutes || 0), 0);
  D.taskFor = cid => D.tasks.find(t => t.class_id === cid && t.week_start === ymd(weekStartFor(D.classOf(cid).day_of_week)));
  D.lastTask = cid => D.tasks.find(t => t.class_id === cid);
  D.weekOf = (sid, k) => { const ws = weekStartFor(k.day_of_week), ds = D.done(sid); let n = 0, m = 0;
    for (let i = 0; i < 7; i++) { const key = ymd(addDays(ws, i)); if (i > 0 && ds.has(key)) n++; m += D.mins(sid, key); } return { n, m }; };
  return D;
}
function needsNudge(s, ds, classDay){
  if (new Date(s.joined_at || s.created_at) > addDays(today0(), -3)) return false;
  let d = today0(), checked = 0;
  while (checked < 3) { if (d.getDay() !== classDay) { if (ds.has(ymd(d))) return false; checked++; } d = addDays(d, -1); }
  return true;
}

const TTABS = [["/teacher", "Today"], ["/teacher/students", "Students"], ["/teacher/classes", "Classes"], ["/teacher/chat", "Chat"], ["/teacher/page", "My page"]];
async function viewTeacher(sub = "", id = ""){
  if (!onRoot()) { location.href = siteUrl("/teacher"); return; }
  if (!user) return go("/signin?next=/teacher");
  $app.innerHTML = LOADING;
  const { data: groups, error } = await sb.from("groups").select("*").eq("owner_id", user.id).order("created_at");
  if (error) { $app.innerHTML = `<p class="notice">${esc(friendly(error))}</p>`; return; }
  if (!groups.length) return viewNewGroup();
  roles.teacher = true;
  const g = groups.find(x => x.id === store.get("riyaz.group")) || groups[0];
  const D = await loadGroup(g);
  const active = sub ? "/teacher/" + sub : "/teacher";
  $app.innerHTML = `<section class="row between portal-head"><div style="min-width:0"><span class="eyebrow">Teacher</span><h1 class="page-h">${esc(g.name)}</h1></div>
      <div class="row">${groups.length > 1 ? `<label class="sr" for="grp">Choose group</label><select id="grp" class="grp">${groups.map(x => `<option value="${x.id}" ${x.id === g.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : ""}
      <button class="btn ghost small" type="button" id="add-group">Add a group</button></div></section>
    ${g.approved ? "" : `<p class="notice m0">Your page is waiting for approval. You can set up classes and students now. Invitations start working once GuruShiya approves your page.</p>`}
    ${tabsNav(TTABS.map(([h, t]) => [h, t, h === "/teacher/chat" ? D.unread : 0]), active, "Teacher menu")}
    <div id="pane" class="stack"></div>`;
  const sel = document.getElementById("grp");
  if (sel) sel.onchange = () => { store.set("riyaz.group", sel.value); go("/teacher"); };
  document.getElementById("add-group").onclick = () => viewNewGroup(true);
  const pane = document.getElementById("pane"), again = () => viewTeacher(sub, id);
  if (sub === "students" && id) return tReport(pane, g, D, id, again);
  if (sub === "students") return tStudents(pane, g, D, again);
  if (sub === "classes") return tClasses(pane, g, D, again);
  if (sub === "chat") return tChat(pane, g, D, id);
  if (sub === "page") return tPage(pane, g, again);
  return tToday(pane, g, D, again);
}

/* ---- Today ---- */
function tToday(pane, g, D, again){
  const act = D.studs.filter(s => s.status === "active"), tKey = ymd(today0());
  const practisedToday = act.filter(s => D.done(s.id).has(tKey)).length;
  const weekMins = act.reduce((a, s) => a + D.weekOf(s.id, D.classOf(s.class_id)).m, 0);
  const waiting = D.studs.filter(s => ["waiting_consent", "consented", "invited"].includes(s.status)).length;
  const old = t => t && new Date(t) < addDays(new Date(), -3);
  const todo = [];
  if (D.unread) todo.push({ hot: true, text: `${D.unread} new message${D.unread === 1 ? "" : "s"} from students`, btn: link("/teacher/chat", "Open chat", "btn small") });
  if (!D.classes.length) todo.push({ text: "Add your first class", btn: link("/teacher/classes", "Add a class", "btn small") });
  else if (!D.studs.length) todo.push({ text: "Add your first student", btn: link("/teacher/students", "Add a student", "btn small") });
  D.classes.forEach(k => { if (!D.taskFor(k.id) && D.studs.some(s => s.class_id === k.id)) todo.push({ text: `Set this week's practice for ${k.name}`, btn: link("/teacher/classes", "Set practice", "btn small ghost") }); });
  D.studs.forEach(s => {
    const k = D.classOf(s.class_id);
    if (s.status === "waiting_consent" && !s.consent_sent_at) todo.push({ s, which: "consent", text: `Ask ${s.contact_name || "the parent"} for consent for ${s.first_name}`, label: "Send request" });
    else if (s.status === "waiting_consent" && old(s.consent_sent_at)) todo.push({ s, which: "consent", text: `No answer yet from ${s.first_name}'s parent`, label: "Send again" });
    else if (s.status === "consented") todo.push({ hot: true, s, which: "join", text: `${s.first_name}'s parent said yes. Send the join link`, label: "Send join link" });
    else if (s.status === "invited" && !s.join_sent_at) todo.push({ s, which: "join", text: `Send ${s.first_name} the join link`, label: "Send join link" });
    else if (s.status === "invited" && old(s.join_sent_at)) todo.push({ s, which: "join", text: `${s.first_name} hasn't started yet`, label: "Send again" });
    else if (s.status === "declined") todo.push({ text: `${s.first_name}'s parent said no`, btn: link("/teacher/students/" + s.id, "View", "btn small ghost") });
    else if (s.status === "active" && needsNudge(s, D.done(s.id), k.day_of_week)) todo.push({ text: `${s.first_name} hasn't practised for 3 days`, btn: link("/teacher/chat/" + s.id, "Send a message", "btn small ghost") });
  });
  pane.innerHTML = `
    <div class="tiles">
      <div class="tile"><b>${act.length}</b><span>Active students</span></div>
      <div class="tile"><b>${practisedToday}<small> of ${act.length}</small></b><span>Practised today</span></div>
      <div class="tile"><b>${fmtMins(weekMins)}</b><span>Practice this week</span></div>
      <div class="tile"><b>${waiting}</b><span>Waiting to join</span></div>
    </div>
    <section class="card"><h2>To do</h2>
      ${todo.length ? `<ul class="todo">${todo.map((t, i) => `<li class="${t.hot ? "hot" : ""}"><span>${esc(t.text)}</span>${t.btn || (g.approved ? `<button class="btn small" type="button" data-i="${i}">${t.label}</button>` : `<span class="hint">After approval</span>`)}</li>`).join("")}</ul>`
        : `<div class="empty">All caught up. Nice work!</div>`}
    </section>
    <section class="card"><div class="row between"><h2>Your classes</h2>${link("/teacher/classes", "Manage", "btn small ghost")}</div>
      ${D.classes.length ? `<ul class="list">${D.classes.map(k => { const n = D.studs.filter(s => s.class_id === k.id && s.status === "active").length, t = D.taskFor(k.id);
        return `<li class="class-row"><div><strong>${esc(k.name)}</strong> <span class="muted">· ${DAYS[k.day_of_week]}s ${fmtTime(k.start_time)}</span></div><span class="hint">${n} student${n === 1 ? "" : "s"} · ${t ? "practice set" : "no practice set yet"}</span></li>`; }).join("")}</ul>`
        : `<div class="empty">No classes yet.</div>`}
    </section>`;
  pane.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const t = todo[+b.dataset.i]; openInvite(t.s, t.which, g, D.classOf(t.s.class_id), again); });
}

/* ---- Students ---- */
function tStudents(pane, g, D, again){
  let classFilter = "all";
  const picked = new Set();
  pane.innerHTML = `<section class="card">
    <div class="row between"><h2>Students</h2><div class="row">
      ${D.classes.length > 1 ? `<label class="sr" for="sf">Show class</label><select id="sf"><option value="all">All classes</option>${D.classes.map(k => `<option value="${k.id}">${esc(k.name)}</option>`).join("")}</select>` : ""}
      <button class="btn small" type="button" id="add-btn" ${D.classes.length ? "" : "disabled"}>Add a student</button></div></div>
    ${D.classes.length ? "" : `<p class="notice m0">Add a class first, then add students to it. ${link("/teacher/classes", "Add a class", "")}</p>`}
    <form id="add-form" class="add-form" hidden>
      <h3>Add a student</h3>
      <div class="two"><label for="ns-class">Class<select id="ns-class">${D.classes.map(k => `<option value="${k.id}">${esc(k.name)} · ${DAYS[k.day_of_week]}</option>`).join("")}</select></label>
        <label for="ns-name">Student's first name<input id="ns-name" required maxlength="40" autocomplete="off"></label></div>
      <fieldset class="choice"><legend>The student is</legend>
        <label class="check" for="ns-child"><input type="radio" name="ns-who" id="ns-child" checked>A child (under 18)</label>
        <label class="check" for="ns-adult"><input type="radio" name="ns-who" id="ns-adult">An adult (18 or over)</label></fieldset>
      <label for="ns-pname" id="ns-pname-wrap">Parent or guardian's name<input id="ns-pname" maxlength="80" autocomplete="off"></label>
      <div class="two"><label for="ns-phone"><span id="ns-phone-l">Parent's mobile (WhatsApp or text)</span><input id="ns-phone" type="tel" inputmode="tel" maxlength="20" pattern="[+]?[0-9 ().\\-]{7,20}" placeholder="416 555 0100"></label>
        <label for="ns-email"><span id="ns-email-l">Parent's email</span><input id="ns-email" type="email" maxlength="120"></label></div>
      <p class="hint m0" id="ns-hint">GuruShiya asks the parent for consent before a child can join. Add a mobile number or an email.</p>
      <div class="row"><button class="btn" type="submit">Add student</button><button class="btn ghost" type="button" id="ns-cancel">Cancel</button></div>
      <div id="ns-out" role="status"></div>
    </form>
    <div id="sel-bar" class="sel-bar" hidden><span id="sel-n"></span><button class="btn small" type="button" id="sel-msg">Message selected</button></div>
    <form id="sel-compose" class="compose" hidden><label for="sel-text">Message to <span id="sel-who"></span></label>
      <textarea id="sel-text" rows="3" maxlength="2000" required></textarea>
      <div class="row"><button class="btn small" type="submit">Send</button><button class="btn small ghost" type="button" id="sel-cancel">Cancel</button></div><div class="out" role="status"></div></form>
    <div id="s-list"></div></section>`;
  const form = document.getElementById("add-form"), list = document.getElementById("s-list");
  const setWho = () => { const adult = document.getElementById("ns-adult").checked;
    document.getElementById("ns-pname-wrap").hidden = adult;
    document.getElementById("ns-phone-l").textContent = adult ? "Student's mobile (WhatsApp or text)" : "Parent's mobile (WhatsApp or text)";
    document.getElementById("ns-email-l").textContent = adult ? "Student's email" : "Parent's email";
    document.getElementById("ns-hint").textContent = adult ? "Adults agree for themselves when they open their join link." : "GuruShiya asks the parent for consent before a child can join. Add a mobile number or an email."; };
  form.querySelectorAll('input[name="ns-who"]').forEach(r => r.onchange = setWho);
  document.getElementById("add-btn").onclick = () => { form.hidden = false; document.getElementById("ns-name").focus(); };
  document.getElementById("ns-cancel").onclick = () => { form.reset(); setWho(); form.hidden = true; };
  form.onsubmit = async e => {
    e.preventDefault(); const out = document.getElementById("ns-out"), adult = document.getElementById("ns-adult").checked;
    const phone = val("ns-phone") || null, email = val("ns-email") || null;
    if (!adult && !phone && !email) { out.innerHTML = `<div class="notice">Please add the parent's mobile number or email, so GuruShiya can ask for consent.</div>`; return; }
    const b = form.querySelector("button[type=submit]"); b.disabled = true;
    const { data: s, error } = await sb.from("students").insert({ class_id: val("ns-class"), first_name: val("ns-name"), is_adult: adult,
      contact_name: adult ? null : (val("ns-pname") || null), contact_phone: phone, contact_email: email }).select().single();
    b.disabled = false;
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    if (g.approved) openInvite(s, adult ? "join" : "consent", g, D.classOf(s.class_id), again); else again();
  };
  const bar = document.getElementById("sel-bar"), comp = document.getElementById("sel-compose");
  const updBar = () => { bar.hidden = !picked.size; document.getElementById("sel-n").textContent = `${picked.size} selected`;
    document.getElementById("sel-who").textContent = D.studs.filter(s => picked.has(s.id)).map(s => s.first_name).join(", "); };
  document.getElementById("sel-msg").onclick = () => { comp.hidden = false; document.getElementById("sel-text").focus(); };
  document.getElementById("sel-cancel").onclick = () => { comp.hidden = true; };
  comp.onsubmit = async e => {
    e.preventDefault(); const out = comp.querySelector(".out"), b = comp.querySelector("button"); b.disabled = true;
    const { data: n, error } = await sb.rpc("message_students", { student_ids: [...picked], body: val("sel-text") });
    b.disabled = false;
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    out.innerHTML = `<div class="notice ok">Sent to ${n} student${n === 1 ? "" : "s"}. They'll see it in their chat.</div>`;
    document.getElementById("sel-text").value = ""; picked.clear(); list.querySelectorAll("input[type=checkbox]").forEach(c => c.checked = false); bar.hidden = true;
    setTimeout(() => { comp.hidden = true; out.innerHTML = ""; }, 2500);
  };
  const draw = () => {
    const rows = D.studs.filter(s => classFilter === "all" || s.class_id === classFilter);
    list.innerHTML = rows.length ? `<ul class="slist">${rows.map(s => { const k = D.classOf(s.class_id), w = s.status === "active" ? D.weekOf(s.id, k) : null, nx = nextStep(s);
        return `<li><input type="checkbox" data-pick="${s.id}" aria-label="Select ${esc(s.first_name)}" ${s.status === "active" ? "" : "disabled title=\"Not joined yet\""}>
          <a href="/teacher/students/${s.id}" data-link class="sl-main">${avatar(s.first_name, 36)}<span><strong>${esc(s.first_name)}</strong>${s.is_adult ? ` <span class="hint">adult</span>` : ""}
            <span class="hint sl-sub">${esc(k.name)}${w ? ` · ${w.n} of 6 days · ${fmtMins(w.m)}` : ""}</span></span></a>
          <span class="sl-side">${statusPill(s)}${nx && g.approved ? `<button class="btn tiny" type="button" data-inv="${s.id}">${nx.label}</button>` : ""}</span></li>`; }).join("")}</ul>
      <p class="hint m0">Tick students to message them together. Tap a name for their report.</p>`
      : `<div class="empty">No students yet. Tap "Add a student" to start.</div>`;
    list.querySelectorAll("[data-pick]").forEach(c => c.onchange = () => { c.checked ? picked.add(c.dataset.pick) : picked.delete(c.dataset.pick); updBar(); });
    list.querySelectorAll("[data-inv]").forEach(b => b.onclick = () => { const s = D.studs.find(x => x.id === b.dataset.inv); openInvite(s, nextStep(s).which, g, D.classOf(s.class_id), again); });
  };
  const sf = document.getElementById("sf"); if (sf) sf.onchange = () => { classFilter = sf.value; draw(); };
  draw();
}

/* ---- One student's report ---- */
async function tReport(pane, g, D, id, again){
  const s = D.studs.find(x => x.id === id);
  if (!s) { pane.innerHTML = `<p class="notice">This student isn't in ${esc(g.name)}.</p>${link("/teacher/students", "Back to students", "btn ghost")}`; return; }
  const k = D.classOf(s.class_id), done = D.done(s.id), t0 = today0(), ws = weekStartFor(k.day_of_week), nx = nextStep(s);
  const { data: note } = await sb.from("teacher_notes").select("body,updated_at").eq("student_id", s.id).maybeSingle();
  const week = D.weekOf(s.id, k);
  let d28 = 0, m28 = 0; for (let i = 0; i < 28; i++) { const d = addDays(t0, -i), key = ymd(d); m28 += D.mins(s.id, key); if (d.getDay() !== k.day_of_week && done.has(key)) d28++; }
  const lvl = (on, m) => !on ? "" : m >= 20 ? "l3" : m >= 10 ? "l2" : "l1";
  const grid = Array.from({ length: 8 }, (_, w) => { const start = addDays(ws, -7 * w);
    return `<tr><th scope="row">${start.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</th>${Array.from({ length: 7 }, (_, i) => { const d = addDays(start, i), key = ymd(d), m = D.mins(s.id, key), on = done.has(key);
      if (i === 0) return `<td><span class="hc cls${on ? " " + (lvl(on, m) || "l1") : ""}" title="Class day${on ? `, practised ${m} min` : ""}">${on && m ? m : "C"}</span></td>`;
      return `<td><span class="hc ${lvl(on, m)}${d > t0 ? " fut" : ""}" title="${DAYS[d.getDay()]} ${d.getDate()}: ${on ? (m ? m + " min" : "practised") : "no practice"}">${on ? (m || "✓") : ""}</span></td>`; }).join("")}</tr>`; }).join("");
  pane.innerHTML = `
    <div>${link("/teacher/students", "← All students", "btn small ghost")}</div>
    <section class="card">
      <div class="row" style="gap:14px;flex-wrap:nowrap">${avatar(s.first_name, 56)}<div style="min-width:0"><h2>${esc(s.first_name)}</h2>
        <span class="muted">${esc(k.name)} · ${DAYS[k.day_of_week]}s ${fmtTime(k.start_time)}</span></div><div style="margin-left:auto">${statusPill(s)}</div></div>
      <dl class="facts-dl">
        ${s.is_adult ? `<div><dt>Student</dt><dd>Adult${s.status === "active" ? `, agreed when joining on ${new Date(s.joined_at).toLocaleDateString()}` : ""}</dd></div>`
          : `<div><dt>Parent</dt><dd>${esc(s.contact_name || "Not given")}</dd></div>
             <div><dt>Consent</dt><dd>${s.consent_at ? `Given by ${esc(s.consent_by)} on ${new Date(s.consent_at).toLocaleDateString()}` : s.status === "declined" ? "Parent said no" : s.consent_sent_at ? `Asked on ${new Date(s.consent_sent_at).toLocaleDateString()}, no answer yet` : "Not asked yet"}</dd></div>`}
        ${s.contact_phone ? `<div><dt>Mobile</dt><dd>${esc(s.contact_phone)}</dd></div>` : ""}
        ${s.contact_email ? `<div><dt>Email</dt><dd>${esc(s.contact_email)}</dd></div>` : ""}
        ${s.joined_at ? `<div><dt>Joined</dt><dd>${new Date(s.joined_at).toLocaleDateString()}</dd></div>` : ""}
      </dl>
      ${nx ? (g.approved ? `<div class="row"><button class="btn" type="button" id="r-inv">${nx.label}</button></div>` : `<p class="hint m0">You can send invitations once your page is approved.</p>`) : ""}
      ${s.status === "declined" ? `<div class="row"><button class="btn ghost" type="button" id="r-again">Ask the parent again</button></div>` : ""}
    </section>
    ${s.status === "active" ? `
    <div class="tiles">
      <div class="tile"><b>${week.n}<small> of 6</small></b><span>Days this week · ${fmtMins(week.m)}</span></div>
      <div class="tile"><b>${d28}<small> of 24</small></b><span>Days in 4 weeks · ${fmtMins(m28)}</span></div>
      <div class="tile"><b>${streak(done, k.day_of_week)}</b><span>Day streak now</span></div>
      <div class="tile"><b>${bestStreak(done, k.day_of_week)}</b><span>Best streak (8 weeks)</span></div>
    </div>
    <section class="card"><div class="row between"><h2>Last 8 weeks</h2><span class="hint">Minutes each day · C = class day</span></div>
      <div class="scroll"><table class="heat"><thead><tr><th>Week of</th>${Array.from({ length: 7 }, (_, i) => `<th>${SHORT[addDays(ws, i).getDay()].slice(0, 2)}</th>`).join("")}</tr></thead><tbody>${grid}</tbody></table></div>
    </section>
    <section class="card"><h2>Chat with ${esc(s.first_name)}</h2><div id="thread"></div></section>` : `<section class="card"><h2>Practice</h2><p class="muted m0">${esc(s.first_name)}'s practice report and chat start once they join.</p></section>`}
    <section class="card"><h2>Private notes</h2><p class="hint m0">Only you can see these.</p>
      <form id="nt"><label class="sr" for="nt-body">Notes</label><textarea id="nt-body" rows="4" maxlength="4000" placeholder="Progress, things to work on, reminders…">${esc(note?.body || "")}</textarea>
      <div class="row"><button class="btn small" type="submit">Save notes</button><span class="hint" data-out role="status">${note ? "Last saved " + timeAgo(note.updated_at) : ""}</span></div></form></section>
    <section class="card"><details><summary>Change details or remove</summary>
      <form id="ed" style="margin-top:12px">
        <div class="two"><label for="ed-name">First name<input id="ed-name" required maxlength="40" value="${esc(s.first_name)}"></label>
          <label for="ed-class">Class<select id="ed-class">${D.classes.map(c => `<option value="${c.id}" ${c.id === s.class_id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label></div>
        ${s.is_adult ? "" : `<label for="ed-pname">Parent or guardian's name<input id="ed-pname" maxlength="80" value="${esc(s.contact_name || "")}"></label>`}
        <div class="two"><label for="ed-phone">Mobile<input id="ed-phone" type="tel" maxlength="20" pattern="[+]?[0-9 ().\\-]{7,20}" value="${esc(s.contact_phone || "")}"></label>
          <label for="ed-email">Email<input id="ed-email" type="email" maxlength="120" value="${esc(s.contact_email || "")}"></label></div>
        <div class="row"><button class="btn small" type="submit">Save changes</button><span class="hint" data-out role="status"></span></div>
      </form>
      <div class="row" style="margin-top:14px">${s.status !== "active" ? `<button class="btn small ghost" type="button" id="r-new">Make new invitation links</button>` : ""}<button class="btn small ghost danger" type="button" id="r-del">Remove ${esc(s.first_name)}</button></div>
    </details></section>`;
  const inv = document.getElementById("r-inv"); if (inv) inv.onclick = () => openInvite(s, nx.which, g, k, again);
  const ag = document.getElementById("r-again"); if (ag) ag.onclick = async () => { await sb.rpc("new_invite_links", { student: s.id }); again(); };
  const nw = document.getElementById("r-new"); if (nw) nw.onclick = async () => { await sb.rpc("new_invite_links", { student: s.id }); again(); };
  if (s.status === "active") chatThread(document.getElementById("thread"), s, true, s.first_name);
  document.getElementById("nt").onsubmit = async e => {
    e.preventDefault(); const out = e.target.querySelector("[data-out]");
    const { error } = await sb.from("teacher_notes").upsert({ student_id: s.id, body: val("nt-body"), updated_at: new Date().toISOString() });
    out.textContent = error ? friendly(error) : "Saved.";
  };
  document.getElementById("ed").onsubmit = async e => {
    e.preventDefault(); const out = e.target.querySelector("[data-out]");
    const upd = { first_name: val("ed-name"), class_id: val("ed-class"), contact_phone: val("ed-phone") || null, contact_email: val("ed-email") || null };
    if (!s.is_adult) upd.contact_name = val("ed-pname") || null;
    const { error } = await sb.from("students").update(upd).eq("id", s.id);
    if (error) { out.textContent = friendly(error); return; }
    again();
  };
  const del = document.getElementById("r-del");
  del.onclick = async () => {
    if (!del.dataset.sure) { del.dataset.sure = "1"; del.textContent = `Tap again to remove ${s.first_name} and their practice record`; return; }
    const { error } = await sb.from("students").delete().eq("id", s.id);
    if (error) { del.textContent = friendly(error); return; }
    go("/teacher/students");
  };
}

/* ---- Classes: practice, class board, who practised, settings ---- */
async function tClasses(pane, g, D, again){
  const { data: posts } = await sb.from("chat_messages").select("id,class_id,kind,body,created_at").eq("group_id", g.id).neq("kind", "chat").order("created_at", { ascending: false }).limit(100);
  const t0 = today0();
  const card = k => {
    const classToday = t0.getDay() === k.day_of_week, ws = weekStartFor(k.day_of_week), cs = classToday ? addDays(ws, -7) : ws;
    const days = Array.from({ length: 6 }, (_, i) => addDays(cs, i + 1));
    const act = D.studs.filter(s => s.class_id === k.id && s.status === "active"), cur = D.taskFor(k.id), last = D.lastTask(k.id);
    const kp = (posts || []).filter(p => p.class_id === k.id).slice(0, 4);
    const shareTask = cur ? wa(`This week's practice for ${k.name}: ${cur.title}. ${cur.minutes} min a day.\nTrack it on GuruShiya: ${siteUrl("/practice")}`) : "";
    return `<li class="class-item" data-id="${k.id}">
      <div class="row between"><h3>${esc(k.name)}</h3><span class="muted">${DAYS[k.day_of_week]}s · ${fmtTime(k.start_time)} · ${k.duration_min} min · ${act.length} student${act.length === 1 ? "" : "s"}</span></div>
      <div class="sub"><strong>This week's practice</strong>
        <form data-f="task">
          <label for="pt-title-${k.id}">What to practise<input id="pt-title-${k.id}" required maxlength="200" value="${esc(cur?.title || "")}" placeholder="${esc(last?.title || "e.g. Tatta adavu 1 to 4, slow then medium speed")}"></label>
          <div class="two"><label for="pt-min-${k.id}">Goal: minutes a day<input id="pt-min-${k.id}" type="number" min="1" max="180" required value="${cur?.minutes || last?.minutes || 10}"></label>
            <label for="pt-demo-${k.id}">Demo video link (optional)<input id="pt-demo-${k.id}" type="url" pattern="https://.*" value="${esc(cur?.demo_url || "")}" placeholder="https://youtu.be/…"></label></div>
          <div class="row"><button class="btn small" type="submit">${cur ? "Update practice" : "Set practice"}</button>
            ${cur && g.approved ? `<a class="btn small wa" target="_blank" rel="noopener" href="${shareTask}">Share on WhatsApp</a>` : ""}<span class="hint" data-out role="status"></span></div>
        </form></div>
      <div class="sub"><strong>Post to the class</strong><span class="hint">Everyone in ${esc(k.name)} sees it under Homework &amp; notes.</span>
        <form data-f="post">
          <div class="two"><label for="pk-${k.id}">Type<select id="pk-${k.id}"><option value="homework">Homework</option><option value="class_note">Class notes</option><option value="post">Announcement</option></select></label></div>
          <label for="pb-${k.id}" class="sr">Post</label><textarea id="pb-${k.id}" rows="3" maxlength="2000" required placeholder="e.g. Today we learned… / Homework for next class…"></textarea>
          <div class="row"><button class="btn small" type="submit">Post</button><span class="hint" data-out role="status"></span></div>
        </form>
        ${kp.length ? `<ul class="posts">${kp.map(p => `<li><div class="row between"><span class="pill ${POST_KINDS[p.kind].cls}">${POST_KINDS[p.kind].label}</span><span class="hint">${timeAgo(p.created_at)} <button class="link-btn" type="button" data-delpost="${p.id}">Delete</button></span></div><p>${esc(p.body)}</p></li>`).join("")}</ul>` : ""}
      </div>
      <div class="sub"><div class="row between"><strong>${classToday ? "How last week went" : "Who practised this week"}</strong><span class="hint">Minutes each day</span></div>
        ${act.length ? `<div class="scroll"><table class="chart"><thead><tr><th>Student</th>${days.map(d => `<th scope="col">${SHORT[d.getDay()].slice(0, 2)}</th>`).join("")}<th>Total</th></tr></thead><tbody>
          ${act.map(s => { const ds = D.done(s.id); let tot = 0;
            const cells = days.map(d => { const key = ymd(d), on = ds.has(key), m = D.mins(s.id, key); tot += m;
              return `<td><span class="sq${on ? " on" : d > t0 ? " fut" : ""}" title="${DAYS[d.getDay()]}: ${on ? (m ? m + " min" : "practised") : "no practice"}">${on ? (m || "✓") : ""}</span></td>`; }).join("");
            return `<tr><td><a href="/teacher/students/${s.id}" data-link class="who">${esc(s.first_name)}</a>${needsNudge(s, ds, k.day_of_week) ? `<br><span class="pill wait">Needs a nudge</span>` : ""}</td>${cells}<td class="num">${fmtMins(tot)}</td></tr>`; }).join("")}
        </tbody></table></div>` : `<div class="empty">No active students yet. Add students from the Students tab.</div>`}
      </div>
      <details class="sub"><summary>Online class link and settings</summary>
        <form data-f="link" class="row" style="flex-wrap:nowrap;margin-top:10px"><label class="hint" style="flex:1;min-width:0" for="ml-${k.id}">Zoom or Meet link (only your students see it)
          <input id="ml-${k.id}" type="url" pattern="https://.*" placeholder="https://zoom.us/j/…" value="${esc(D.linkOf(k.id))}"></label>
          <button class="btn small ghost" type="submit" style="align-self:flex-end">Save</button></form>
        <div class="row" style="margin-top:10px"><button class="btn small ghost danger" type="button" data-del>Remove class</button><span class="hint" data-msg role="status"></span></div>
      </details></li>`;
  };
  pane.innerHTML = `<section class="card"><h2>Classes</h2>
    ${D.classes.length ? `<ul class="list">${D.classes.map(card).join("")}</ul>` : `<div class="empty">No classes yet. Add your first one below.</div>`}
    <details ${D.classes.length ? "" : "open"}><summary>Add a class</summary>
      <form id="nc" style="margin-top:12px">
        <label for="nc-name">Class name<input id="nc-name" required minlength="2" maxlength="80" placeholder="Beginners"></label>
        <div class="two"><label for="nc-day">Day<select id="nc-day">${DAYS.map((d, i) => `<option value="${i}" ${i === 6 ? "selected" : ""}>${d}</option>`).join("")}</select></label>
          <label for="nc-time">Start time<input id="nc-time" type="time" required value="10:00"></label>
          <label for="nc-len">Length (minutes)<input id="nc-len" type="number" min="10" max="300" value="60" required></label></div>
        <label for="nc-url">Zoom or Meet link (optional)<input id="nc-url" type="url" pattern="https://.*" placeholder="https://zoom.us/j/…"></label>
        <div class="row"><button class="btn" type="submit">Add class</button><span class="hint" data-out role="status"></span></div></form></details></section>`;
  document.getElementById("nc").onsubmit = async e => {
    e.preventDefault(); const out = e.target.querySelector("[data-out]"), b = e.target.querySelector("button"); b.disabled = true;
    const { data: k, error } = await sb.from("classes").insert({ group_id: g.id, name: val("nc-name"), day_of_week: +val("nc-day"), start_time: val("nc-time"), duration_min: +val("nc-len") }).select().single();
    if (!error && val("nc-url")) await sb.from("class_links").upsert({ class_id: k.id, meeting_url: val("nc-url") });
    b.disabled = false;
    if (error) { out.textContent = friendly(error); return; }
    again();
  };
  pane.querySelectorAll(".class-item[data-id]").forEach(li => {
    const id = li.dataset.id, k = D.classes.find(c => c.id === id);
    li.querySelector('[data-f="task"]').onsubmit = async e => {
      e.preventDefault(); const out = e.target.querySelector("[data-out]"), demo = val("pt-demo-" + id);
      const { error } = await sb.from("practice_tasks").upsert({ class_id: id, week_start: ymd(weekStartFor(k.day_of_week)), title: val("pt-title-" + id), minutes: +val("pt-min-" + id), demo_url: demo || null }, { onConflict: "class_id,week_start" });
      if (error) { out.textContent = friendly(error); return; }
      again();
    };
    li.querySelector('[data-f="post"]').onsubmit = async e => {
      e.preventDefault(); const out = e.target.querySelector("[data-out]"), b = e.target.querySelector("button"); b.disabled = true;
      const { error } = await sb.rpc("post_to_class", { class: id, post_kind: val("pk-" + id), body: val("pb-" + id) });
      b.disabled = false;
      if (error) { out.textContent = friendly(error); return; }
      again();
    };
    li.querySelectorAll("[data-delpost]").forEach(b => b.onclick = async () => {
      if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Tap again to delete"; return; }
      await sb.from("chat_messages").delete().eq("id", b.dataset.delpost); again();
    });
    li.querySelector('[data-f="link"]').onsubmit = async e => {
      e.preventDefault(); const url = e.target.querySelector("input").value.trim(), msg = li.querySelector("[data-msg]");
      const r = url ? await sb.from("class_links").upsert({ class_id: id, meeting_url: url }) : await sb.from("class_links").delete().eq("class_id", id);
      msg.textContent = r.error ? friendly(r.error) : "Link saved.";
    };
    const del = li.querySelector("[data-del]");
    del.onclick = async () => {
      if (!del.dataset.sure) { del.dataset.sure = "1"; del.textContent = "Tap again to remove this class, its students and their practice record"; return; }
      const { error } = await sb.from("classes").delete().eq("id", id);
      if (error) { li.querySelector("[data-msg]").textContent = friendly(error); return; }
      again();
    };
  });
}

/* ---- Chat: inbox and one-to-one threads ---- */
async function tChat(pane, g, D, id){
  const act = D.studs.filter(s => s.status === "active");
  if (id) {
    const s = D.studs.find(x => x.id === id);
    if (!s) { pane.innerHTML = `<p class="notice">This student isn't in ${esc(g.name)}.</p>`; return; }
    pane.innerHTML = `<div>${link("/teacher/chat", "← All chats", "btn small ghost")}</div>
      <section class="card"><div class="row" style="gap:12px;flex-wrap:nowrap">${avatar(s.first_name, 40)}<div><h2>${esc(s.first_name)}</h2><span class="muted">${esc(D.classOf(s.class_id).name)} · ${link("/teacher/students/" + s.id, "View report", "")}</span></div></div>
      ${s.status === "active" ? `<div id="thread"></div>` : `<p class="muted m0">Chat opens once ${esc(s.first_name)} joins.</p>`}</section>`;
    if (s.status === "active") chatThread(document.getElementById("thread"), s, true, s.first_name);
    return;
  }
  const { data } = await sb.from("chat_messages").select("student_id,body,from_teacher,created_at,read_at").eq("group_id", g.id).eq("kind", "chat").order("created_at", { ascending: false }).limit(400);
  const th = new Map();
  (data || []).forEach(m => { const t = th.get(m.student_id) || { last: m, unread: 0 }; if (!m.from_teacher && !m.read_at) t.unread++; th.set(m.student_id, t); });
  const withMsgs = act.filter(s => th.has(s.id)).sort((a, b) => th.get(b.id).last.created_at.localeCompare(th.get(a.id).last.created_at));
  const without = act.filter(s => !th.has(s.id));
  pane.innerHTML = `<section class="card"><div class="row between"><h2>Chat</h2>${link("/teacher/students", "Message several students", "btn small ghost")}</div>
    ${withMsgs.length ? `<ul class="inbox">${withMsgs.map(s => { const t = th.get(s.id);
      return `<li><a href="/teacher/chat/${s.id}" data-link class="${t.unread ? "unread" : ""}">${avatar(s.first_name, 40)}<div class="ib-main"><div class="row between"><strong>${esc(s.first_name)}</strong><span class="hint">${timeAgo(t.last.created_at)}</span></div>
        <span class="ib-last">${t.last.from_teacher ? "You: " : ""}${esc(t.last.body)}</span></div>${t.unread ? `<span class="badge">${t.unread}</span>` : ""}</a></li>`; }).join("")}</ul>`
      : `<div class="empty">No messages yet.</div>`}
    ${without.length ? `<h3 style="margin-top:8px">Start a chat</h3><div class="chips">${without.map(s => link("/teacher/chat/" + s.id, esc(s.first_name), "chip")).join("")}</div>` : ""}
    ${!act.length ? `<p class="hint m0">Chat opens with each student once they join.</p>` : ""}
    <p class="hint m0">For homework and class notes for everyone, use the Classes tab.</p></section>`;
}

/* ---- My page (public group page) ---- */
function tPage(pane, g, again){
  const page = groupUrl(g.slug);
  pane.innerHTML = `<section class="card"><div class="row between"><h2>Your public page</h2>${g.approved ? `<span class="pill ok">Public</span>` : `<span class="pill wait">Waiting for approval</span>`}</div>
    <div class="code">${esc(bare(page))}</div>
    <div class="row"><a class="btn small ghost" href="${page}" ${C.rootDomain ? "" : "data-link"}>View page</a><button class="btn small ghost" type="button" data-copy="${esc(page)}">Copy link</button>
      ${g.approved ? `<a class="btn small wa" target="_blank" rel="noopener" href="${wa(g.name + "\n" + page)}">Share on WhatsApp</a>` : ""}</div>
    <form id="pg" style="margin-top:8px">${groupForm(g)}<div class="row"><button class="btn" type="submit">Save</button><span class="hint" data-out role="status"></span></div></form></section>`;
  pane.querySelector("[data-copy]").onclick = e => copy(page, e.currentTarget);
  document.getElementById("pg").onsubmit = async e => {
    e.preventDefault(); const out = e.target.querySelector("[data-out]");
    const { error } = await sb.from("groups").update(groupValues()).eq("id", g.id);
    if (error) { out.textContent = friendly(error); return; }
    again();
  };
}

function groupForm(g = {}){
  return `
    <div class="two"><label for="gf-name">Group name<input id="gf-name" required minlength="2" maxlength="80" value="${esc(g.name)}" placeholder="Priya's Bharatanatyam School"></label>
    <label for="gf-teacher">Teacher name shown on the page<input id="gf-teacher" required maxlength="80" value="${esc(g.teacher_name)}"></label></div>
    <div class="two"><label for="gf-art">Type of class<select id="gf-art">${Object.entries(ARTS).map(([k, a]) => `<option value="${k}" ${g.art_type === k ? "selected" : ""}>${a.label}</option>`).join("")}</select></label>
    <label for="gf-loc">Area<input id="gf-loc" maxlength="120" value="${esc(g.location)}" placeholder="Scarborough, ON"></label></div>
    <label class="check" for="gf-online"><input id="gf-online" type="checkbox" ${g.is_online ? "checked" : ""}>Classes are offered online</label>
    <label for="gf-bio">About the group<textarea id="gf-bio" maxlength="1500" placeholder="Your training, style, and who the classes are for.">${esc(g.bio)}</textarea></label>`;
}
const groupValues = () => ({ name: val("gf-name"), teacher_name: val("gf-teacher"), art_type: val("gf-art"), location: val("gf-loc") || null, is_online: document.getElementById("gf-online").checked, bio: val("gf-bio") || null });

function viewNewGroup(more = false){
  $app.innerHTML = `<section class="card narrow wide">
    <span class="eyebrow">${more ? "New group" : "Welcome, teacher"}</span><h1 class="page-h">Set up your group</h1>
    <p class="muted m0">This becomes your class page and your teacher dashboard. GuruShiya checks each new teacher before the page goes public.</p>
    <form id="ng">${groupForm()}
      <label for="gf-slug">Web address<input id="gf-slug" required pattern="[a-z0-9][a-z0-9\\-]{1,38}[a-z0-9]" maxlength="40">
      <span class="hint" id="slug-prev"></span></label>
      <label class="check" for="gf-agree"><input id="gf-agree" type="checkbox" required><span>I will keep my students' details private, use GuruShiya only for my own classes, and only add children with a parent's consent.</span></label>
      <div class="row"><button class="btn" type="submit">Create my group</button>${more ? link("/teacher", "Cancel", "btn ghost") : ""}</div>
      <div id="ng-out" role="status"></div></form></section>`;
  const name = document.getElementById("gf-name"), slug = document.getElementById("gf-slug"), prev = document.getElementById("slug-prev");
  let touched = false;
  const show = () => prev.textContent = "Your page: " + bare(groupUrl(slug.value || "your-name"));
  name.oninput = () => { if (!touched) slug.value = slugify(name.value); show(); };
  slug.oninput = () => { touched = true; slug.value = slugify(slug.value); show(); };
  show();
  document.getElementById("ng").onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector("button[type=submit]"); b.disabled = true;
    const { data, error } = await sb.from("groups").insert({ ...groupValues(), slug: slug.value, owner_id: user.id, agreed_at: new Date().toISOString() }).select().single();
    b.disabled = false;
    if (error) { document.getElementById("ng-out").innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    roles.teacher = true; store.set("riyaz.group", data.id); go("/teacher/classes");
  };
}

init();
})();
