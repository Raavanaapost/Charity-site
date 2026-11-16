/* Gurushishya – Stage 1 app: sign in, teacher groups and classes, public group pages, homepage,
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
const LOADING = `<p class="muted loading-msg">Loading…</p>`;
let sb = null, user = null, roles = { teacher:false, family:false, admin:false };

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
  if (/email rate limit/i.test(m)) return "Too many emails for now. If you've set a password, sign in with it. Otherwise please try the email link again in an hour.";
  if (/rate limit/i.test(m)) return "Too many tries. Please wait a minute and try again.";
  if (/invalid login credentials/i.test(m)) return "Email or password doesn't match. If you haven't set a password yet, use \"Email me a sign-in link\" once, then set one under Account.";
  if (/email not confirmed/i.test(m)) return "Please confirm your email first: tap the link we emailed you, then sign in.";
  if (/user already registered/i.test(m)) return "There's already an account with this email. Sign in instead, or use \"Forgot password?\".";
  if (/should be different from the old password/i.test(m)) return "That's the same as your current password. Please choose a new one.";
  if (/password should be at least/i.test(m)) return "Please use a longer password (at least 8 characters).";
  if (/Failed to fetch|NetworkError/i.test(m)) return "Can't reach Gurushishya. Check your internet connection.";
  return m;
}
function safeNext(){ const n = new URLSearchParams(location.search).get("next") || ""; return /^\/[a-z0-9/_-]*$/i.test(n) && !n.startsWith("//") ? n : "/me"; }

/* ---------- start ---------- */
async function loadRoles(){
  roles = { teacher:false, family:false, admin:false };
  if (!user) return;
  const [g, s, a] = await Promise.all([
    sb.from("groups").select("id", { count:"exact", head:true }).eq("owner_id", user.id),
    sb.from("students").select("id", { count:"exact", head:true }).eq("guardian_id", user.id).eq("status", "active"),
    sb.rpc("am_i_admin")
  ]);
  roles = { teacher: (g.count || 0) > 0, family: (s.count || 0) > 0, admin: a.data === true };
}
async function init(){
  if (!C.supabaseUrl || !C.supabaseAnonKey || !window.supabase) return viewSetup();
  // No cross-tab lock: on phones a sign-in link often opens a second tab, and a paused tab could hold the lock and stall this one.
  sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { lock: async (_name, _wait, fn) => await fn() } });
  const { data } = await sb.auth.getSession();
  user = data.session?.user || null;
  await loadRoles();
  // Run our follow-up work after the sign-in library has finished its own step (Supabase's advice, avoids stalls).
  sb.auth.onAuthStateChange((e, s) => setTimeout(async () => {
    const was = user?.id; user = s?.user || null;
    if (e === "PASSWORD_RECOVERY") { if (was !== user?.id) await loadRoles(); return go("/account?reset=1"); }
    if (was !== user?.id) { await loadRoles(); route(); }
  }, 0));
  // If a page is still on "Loading…" after 15 seconds, offer a reload instead of leaving people waiting.
  new MutationObserver(() => {
    clearTimeout(window.__gsLoad);
    if ($app.querySelector(".loading-msg")) window.__gsLoad = setTimeout(() => {
      const m = $app.querySelector(".loading-msg");
      if (m) m.outerHTML = `<div class="card narrow"><p class="m0"><strong>This is taking longer than usual.</strong> If you have Gurushishya open in another tab, close it, then reload.</p><button class="btn" type="button" onclick="location.reload()">Reload</button></div>`;
    }, 15000);
  }).observe($app, { childList: true });
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
const isHome = () => onRoot() && !/^\/(g|join|consent|register|signin|me|teacher|practice|admin|account)(\/|$)/.test(location.pathname);

function route(){
  if (!sb) return;
  clearInterval(poll); setTheme(isHome()); document.title = "Gurushishya";
  renderNav(); scrollTo(0,0);
  const p = location.pathname, hs = hostSlug();
  let m;
  if (hs && (p === "/" || p === "")) return viewGroup(hs);
  if ((m = p.match(/^\/g\/([a-z0-9-]+)\/?$/))) return viewGroup(m[1]);
  if ((m = p.match(/^\/(?:register|join|consent)\/([a-f0-9]{24,64})\/?$/))) return viewRegister(m[1]);
  if (p === "/signin") return viewSignIn();
  if (p === "/account") return viewAccount();
  if (p === "/admin" || p === "/admin/") return viewAdmin();
  if (p === "/me") return redirect(roles.teacher ? "/teacher" : roles.family ? "/practice" : "/teacher");
  if ((m = p.match(/^\/practice(?:\/(notes|chat))?\/?$/))) return viewDesk(m[1] || "");
  if ((m = p.match(/^\/teacher(?:\/(students|classes|chat|page|approve)(?:\/([0-9a-f-]{36}))?)?\/?$/))) return viewTeacher(m[1] || "", m[2] || "");
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
    if (roles.teacher || !roles.family) items.push(link("/teacher", "Dashboard", "btn small ghost"));
    items.push(`<button class="btn small ghost icon" id="signout" type="button" aria-label="Sign out" title="Sign out"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></button>`);
  } else {
    items.push(link("/signin", "Sign in", "btn small ghost"));
    if (isHome()) items.push(link("/teacher", "Get started", "btn small"));
  }
  $nav.innerHTML = items.join("");
  const so = document.getElementById("signout");
  if (so) so.onclick = async () => { await sb.auth.signOut(); user = null; roles = { teacher:false, family:false, admin:false }; onRoot() ? go("/") : location.href = siteUrl("/"); };
}

/* ---------- setup notice (before Supabase is connected) ---------- */
function viewSetup(){
  $app.innerHTML = `<section class="hero"><span class="eyebrow">Almost ready</span><h1>Gurushishya needs its database</h1>
  <p class="lead">The site is installed. To switch it on, create the free Supabase project and fill in <strong>config.js</strong>. The steps are in SETUP.md.</p></section>`;
}

/* Front page, matched to the Gurushishya logo: ivory, maroon and gold. What it is, and where to tap.
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
  document.title = "Gurushishya · Connecting gurus and students";
  const studentHref = roles.family ? "/practice" : "/signin?next=/practice";
  $app.innerHTML = `
  <section class="gs2-hero" aria-labelledby="h-title">
    <div class="wrap gs2-hero-in">
      <div class="gs2-intro">
        <h1 id="h-title" class="gs2-logo"><img src="/assets/gs-logo.png" alt="Gurushishya" width="880" height="520"></h1>
        <p class="gs2-tag">Connecting Gurus and Students</p>
        <div class="gs2-orn">${LOTUS}</div>
        <p class="gs2-lead">One simple platform for teachers and students.</p>
        <div class="gs2-ctas">${link("/teacher", `${IC.teacher}<span>I'm a Teacher</span>${IC.chev}`, "gs2-btn maroon")}${link(studentHref, `${IC.student}<span>I'm a Student</span>${IC.chev}`, "gs2-btn ivory")}</div>
      </div>
    </div>
  </section>
  <section class="gs2-ways" aria-label="How Gurushishya works"><div class="wrap gs2-ways-in">
    ${GS_WAYS.map(([t, d, ic]) => `<div class="gs2-way"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg><div><h2>${t}</h2><p>${d}</p></div></div>`).join("")}
  </div></section>
  <section id="about" class="gs2-about"><div class="wrap gs2-about-in">
    <img class="gs2-about-glow" src="/assets/gs-glow.jpg" alt="" width="540" height="281">
    <span class="gs2-eyebrow">About us</span>
    <h2 class="gs2-motto">A Digital Kalai Koodam for the Modern Learner</h2>
    <p>Gurushishya brings the timeless bond between guru and student online. Gurus guide, students practise a little every day, and both can see the progress.</p>
    <p>Teachers and students sign in to find their classes, practice, notes and messages.</p>
  </div></section>`;
}

/* ---------- homepage ---------- */
const catStrip = () => `<div class="h-cats" role="group" aria-label="Find classes by type">
      ${FAMILIES.map(f => `<button type="button" class="h-cat" data-fam="${f.k}">${f.icon}<span>${f.label}</span></button>`).join("")}
    </div>`;
const heroText = () => `
      <div class="h-lockup"><img src="/assets/mark-maroon-320.png" alt="" width="132" height="132"><h1 id="h-title">Gurushishya</h1></div>
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
  document.title = "Gurushishya · The Practice Platform for Every Passion";
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
      <p class="h-p">Gurushishya gives every teacher their own page, a class link for families, and a simple view of who practised this week.</p>
      <div>${link("/teacher", "Create your group page", "h-btn gold small")}</div></div>
    <ol class="h-steps">
      <li><div><strong>Create your group page</strong><span>Your classes, timetable and a way for new students to ask about joining.</span></div></li>
      <li><div><strong>Share the class link on WhatsApp</strong><span>Families join in a minute with the child's first name.</span></div></li>
      <li><div><strong>Set the week's practice</strong><span>See who practised each day, and who needs a gentle nudge.</span></div></li>
    </ol>
  </div></section>

  <section id="students" class="h-sec"><div class="wrap wide h-two">
    <div class="h-col"><span class="h-eyebrow">For students and parents</span><h2 class="h-h2">A little practice, every day</h2>
      <p class="h-p">Your teacher sets a short practice for the week. Open Gurushishya, start the timer, and tick the day. Your teacher sees it too.</p>
      <div>${roles.family ? link("/practice", "Go to my practice", "h-btn gold small") : link("/signin?next=/practice", "Sign in to practise", "h-btn gold small")}</div></div>
    <ol class="h-steps">
      <li><div><strong>Get the class link from your teacher</strong><span>It usually comes on WhatsApp.</span></div></li>
      <li><div><strong>Join with a first name</strong><span>Parents give consent for children. We never ask for age, school or address.</span></div></li>
      <li><div><strong>Practise and tick it off</strong><span>Build a streak, and join online classes from the same place.</span></div></li>
    </ol>
  </div></section>

  <section id="about" class="h-sec alt"><div class="wrap h-col h-about">
    <span class="h-eyebrow">About Gurushishya</span><h2 class="h-h2">A digital Kalai Koodam</h2>
    <p class="h-p">In Tamil, a kalai koodam is a hall where the arts are taught and practised. Gurushishya brings that hall online. Teachers of dance, music, Karlakattai, yoga, art and more run their classes in one place, and students keep up the daily practice that turns lessons into skill.</p>
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
  document.title = g.name + " · Gurushishya";
  const { data: classes } = await sb.from("classes").select("name,day_of_week,start_time,duration_min").eq("group_id", g.id).order("day_of_week").order("start_time");
  const mine = user && user.id === g.owner_id;
  $app.innerHTML = `
    ${!g.approved && mine ? `<p class="notice">Only you can see this page for now. It goes public once Gurushishya approves it.</p>` : ""}
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

function signInBlock(next, startMode = "password"){
  const gHtml = C.googleClientId ? `<div class="g-wrap"><div id="si-google" class="g-btn"></div></div>` : "";
  const fbHtml = C.facebookLogin ? `<button type="button" class="btn fb" id="si-fb">${FB_ICON}<span>Continue with Facebook</span></button>` : "";
  const social = !!(gHtml || fbHtml);
  const html = `<div class="signin">${gHtml}${fbHtml}
    ${social ? `<div class="or"><span>or use your email</span></div>` : ""}
    <form id="si" novalidate>
      <label for="si-email">Email<input id="si-email" type="email" required autocomplete="email" maxlength="120"></label>
      <label for="si-pass" id="si-pass-wrap">Password<input id="si-pass" type="password" autocomplete="current-password" minlength="8" maxlength="72"></label>
      <button class="btn" type="submit" id="si-go">Sign in</button>
    </form>
    <div class="si-alt" id="si-alt"></div>
    <div id="si-out" role="status"></div></div>`;
  let mode = startMode;
  function setMode(m){
    mode = m;
    const pw = document.getElementById("si-pass"), wrap = document.getElementById("si-pass-wrap"), go_ = document.getElementById("si-go");
    wrap.hidden = m === "link" || m === "forgot";
    pw.autocomplete = m === "signup" ? "new-password" : "current-password";
    wrap.firstChild.textContent = m === "signup" ? "Choose a password (8 or more characters)" : "Password";
    go_.textContent = { password: "Sign in", link: "Email me a sign-in link", signup: "Create account", forgot: "Email me a reset link" }[m];
    const a = (id, t) => `<button type="button" class="link-btn" data-m="${id}">${t}</button>`;
    document.getElementById("si-alt").innerHTML = {
      password: `${a("forgot", "Forgot password?")}${a("link", "Email me a sign-in link instead")}${a("signup", "New here? Create an account")}`,
      link: `${a("password", "Sign in with a password instead")}`,
      signup: `${a("password", "Already have an account? Sign in")}`,
      forgot: `${a("password", "Back to sign in")}`
    }[m];
    document.querySelectorAll("#si-alt [data-m]").forEach(b => b.onclick = () => { document.getElementById("si-out").innerHTML = ""; setMode(b.dataset.m); });
  }
  async function wire(){
    const out = document.getElementById("si-out"), fail = m => out.innerHTML = `<div class="notice">${esc(m)}</div>`, ok = m => out.innerHTML = `<div class="notice ok">${esc(m)}</div>`;
    setMode(mode);
    document.getElementById("si").onsubmit = async e => {
      e.preventDefault();
      const email = val("si-email"), pass = document.getElementById("si-pass").value;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Please check the email address.");
      if ((mode === "password" || mode === "signup") && pass.length < 8) return fail(mode === "signup" ? "Please choose a password with at least 8 characters." : "Please type your password.");
      const b = document.getElementById("si-go"); b.disabled = true;
      let r;
      if (mode === "password") r = await sb.auth.signInWithPassword({ email, password: pass });
      else if (mode === "signup") r = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: siteUrl(next), data: { has_password: true } } });
      else if (mode === "forgot") r = await sb.auth.resetPasswordForEmail(email, { redirectTo: siteUrl("/account") });
      else r = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: siteUrl(next) } });
      b.disabled = false;
      if (r.error) return fail(friendly(r.error));
      if (mode === "password") return;                       // signed in: the page moves on by itself
      if (mode === "signup") {
        if (r.data?.session) return;
        // Supabase answers "ok" for an email that already has an account, but sends nothing. Spot that and say so.
        if (r.data?.user && Array.isArray(r.data.user.identities) && r.data.user.identities.length === 0) {
          setMode("password"); document.getElementById("si-pass").value = "";
          return fail("You already have a Gurushishya account with this email. Sign in with your password below. No password yet, or forgotten it? Tap \"Forgot password?\".");
        }
        return ok("Account created. Check your email and tap the link to confirm it. After that you can sign in with your password.");
      }
      if (mode === "forgot") return ok("Check your email and tap the link. It opens a page where you choose a new password.");
      ok("Check your email and tap the link to continue. It may be in your spam folder.");
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
  $app.innerHTML = `<section class="card narrow"><span class="eyebrow">Welcome to Gurushishya</span><h1 class="page-h">Sign in</h1>
    <p class="muted m0">Teachers sign in or create an account here. Students and families use the link their teacher sends.</p>${b.html}
    <p class="hint m0">No password yet? Use "Email me a sign-in link" once, then set a password under Account.</p></section>`;
  b.wire();
}
/* Account: set or change the password (also where "Forgot password?" links land) */
function viewAccount(){
  if (!user) return go("/signin?next=/account");
  document.title = "Account · Gurushishya";
  const reset = /reset=1/.test(location.search), has = !!user.user_metadata?.has_password;
  $app.innerHTML = `<section class="card narrow"><span class="eyebrow">Account</span><h1 class="page-h">${reset ? "Choose a new password" : has ? "Change your password" : "Set a password"}</h1>
    <p class="muted m0">Signed in as <strong>${esc(user.email || "")}</strong>. ${has || reset ? "" : "With a password you can sign in any time, without waiting for an email."}</p>
    <form id="pw" novalidate>
      <label for="pw-1">New password (8 or more characters)<input id="pw-1" type="password" autocomplete="new-password" minlength="8" maxlength="72" required></label>
      <label for="pw-2">Type it again<input id="pw-2" type="password" autocomplete="new-password" minlength="8" maxlength="72" required></label>
      <button class="btn" type="submit">Save password</button>
      <div id="pw-out" role="status"></div>
    </form>
    <div class="row">${roles.admin ? link("/admin", "Admin", "btn small ghost") : ""}${roles.teacher || !roles.family ? link("/teacher", "Dashboard", "btn small ghost") : ""}${roles.family ? link("/practice", "Practice", "btn small ghost") : ""}</div></section>`;
  const out = document.getElementById("pw-out");
  document.getElementById("pw").onsubmit = async e => {
    e.preventDefault();
    const a = document.getElementById("pw-1").value, b2 = document.getElementById("pw-2").value;
    if (a.length < 8) { out.innerHTML = `<div class="notice">Please use at least 8 characters.</div>`; return; }
    if (a !== b2) { out.innerHTML = `<div class="notice">The two passwords don't match.</div>`; return; }
    const btn = e.target.querySelector("button"); btn.disabled = true;
    const { data, error } = await sb.auth.updateUser({ password: a, data: { has_password: true } });
    btn.disabled = false;
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    if (data?.user) user = data.user;
    // Done: show a clear finished screen (and finish a registration left half-way, if there is one)
    let pending = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("gs.reg.")) { pending = k.slice(7); break; } } } catch (er) {}
    document.querySelector(".card.narrow").innerHTML = `<span class="eyebrow">Account</span><h1 class="page-h">Password saved ✓</h1>
      <p class="m0">From now on, sign in with <strong>${esc(user.email || "")}</strong> and your new password. No email needed.</p>
      ${pending ? `<div class="notice ok"><strong>You have a registration to finish.</strong><br>Tap below and it completes by itself.</div>${link("/register/" + pending, "Finish registration", "btn big")}` : ""}
      <div class="row">${roles.admin ? link("/admin", "Admin", "btn small ghost") : ""}${roles.teacher || !roles.family ? link("/teacher", "Dashboard", "btn small ghost") : ""}${roles.family ? link("/practice", "Practice", "btn small ghost") : ""}</div>`;
  };
}
const notWorking = () => { $app.innerHTML = `<section class="card narrow"><h1 class="page-h">This link isn't working</h1>
  <p class="muted m0">It may be old or already used. Please ask your teacher to send a new one.</p>${link("/", "Go to Gurushishya", "btn ghost")}</section>`; };

/* ======================= REGISTRATION: one link from the teacher =======================
   The parent (or an adult student) fills in the student's first name, email and mobile,
   gives consent, signs in, and the student is joined. Old /consent and /join links land here too. */
async function viewRegister(token){
  if (!onRoot()) { location.href = siteUrl("/register/" + token); return; }
  $app.innerHTML = LOADING;
  const { data } = await sb.rpc("invite_info", { token });
  const k = data && data[0];
  if (!k) return notWorking();
  if (k.mine) return redirect("/practice");
  const adult = k.is_adult, KEY = "gs.reg." + token, first = k.first_name;
  const head = `<div class="reg-head"><img class="reg-mark" src="/assets/gs-emblem.png" alt="" width="240" height="134">
    <div><span class="eyebrow">${adult ? "Registration" : "Registration and consent"}</span>
    <h1 class="page-h">${adult ? `Join ${esc(k.class_name)}` : `Register ${esc(first)} for ${esc(k.class_name)}`}</h1>
    <p class="muted m0">${esc(k.group_name)} with ${esc(k.teacher_name)} · ${DAYS[k.day_of_week]}s at ${fmtTime(k.start_time)}</p></div></div>`;
  const steps = n => `<ol class="reg-steps">${["Details and consent", "Sign in", "Start practising"].map((t, i) =>
    `<li class="${i < n ? "done" : i === n ? "now" : ""}"${i === n ? ' aria-current="step"' : ""}><b>${i < n ? "✓" : i + 1}</b><span>${t}</span></li>`).join("")}</ol>`;
  const say = (t, ok) => { $app.innerHTML = `<section class="card narrow reg">${head}<div class="notice${ok ? " ok" : ""}">${t}</div></section>`; };
  if (k.status === "declined") return say(`You said no, so ${esc(first)} won't be added. If you change your mind, ask ${esc(k.teacher_name)} for a new link.`, true);
  if (k.status === "active") return say("This link has already been used. If that wasn't you, please ask the teacher for a new one.");
  let saved = null; try { saved = JSON.parse(store.get(KEY) || "null"); } catch (e) {}
  const finish = async v => {
    const { data: sid, error } = await sb.rpc("register_student", { token, student_name: v.name, email: v.email, phone: v.phone, agree: true });
    if (error) return form(v, friendly(error));
    store.del(KEY); roles.family = true; store.set("riyaz.enrol", sid);
    $app.innerHTML = `<section class="card narrow reg">${head}${steps(2)}
      <div class="notice ok"><strong>Thank you. ${adult ? "You're registered." : `${esc(v.name)} is registered.`}</strong><br>
        ${adult ? "Your" : `${esc(v.name)}'s`} practice page is ready. ${esc(k.teacher_name)} will see the practice each day.</div>
      ${link("/practice", adult ? "Start practising" : `Open ${esc(v.name)}'s practice`, "btn big")}</section>`;
  };
  function form(v, err){
    $app.innerHTML = `<section class="card narrow reg">${head}${steps(0)}
      <form id="rf" novalidate>
        <label for="rf-name">${adult ? "Your first name" : "Student's first name"}<input id="rf-name" required maxlength="40" autocomplete="${adult ? "given-name" : "off"}" value="${esc(v.name)}"></label>
        ${adult ? "" : `<p class="hint m0 reg-note">First name only. We never ask for age, school or address.</p>`}
        <div class="two">
          <label for="rf-email">${adult ? "Your email" : "Parent's email"}<input id="rf-email" type="email" required maxlength="120" autocomplete="email" value="${esc(v.email)}"></label>
          <label for="rf-phone">${adult ? "Your mobile" : "Parent's mobile"} <span class="opt">(optional)</span><input id="rf-phone" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="416 555 0100" value="${esc(v.phone)}"></label>
        </div>
        <div class="facts">
          <div><strong>What Gurushishya keeps</strong><span>${adult ? "Your" : "The student's"} first name, the days and minutes of practice, and messages with ${esc(k.teacher_name)}.</span></div>
          <div><strong>Who can see it</strong><span>Only ${adult ? "you" : "your family"} and ${esc(k.teacher_name)}. Other students can't.</span></div>
        </div>
        <label class="check" for="rf-ok"><input id="rf-ok" type="checkbox" ${v.ok ? "checked" : ""}><span>${adult
          ? `I agree to Gurushishya keeping my first name, practice and messages as described above.`
          : `I am the student's parent or guardian. I give consent for them to join ${esc(k.class_name)} and for Gurushishya to keep their first name, practice and messages as described above.`}</span></label>
        <div class="row"><button class="btn" type="submit">${user ? "Register and start" : "Agree and continue"}</button>
          ${!adult && k.step === "consent" ? `<button class="btn ghost" type="button" id="rf-no">No, thank you</button>` : ""}</div>
        <div id="rf-out" role="status">${err ? `<div class="notice">${esc(err)}</div>` : ""}</div>
      </form></section>`;
    const out = document.getElementById("rf-out"), bad = (m, id) => { out.innerHTML = `<div class="notice">${esc(m)}</div>`; if (id) document.getElementById(id).focus(); };
    document.getElementById("rf").onsubmit = async e => {
      e.preventDefault();
      const nv = { name: val("rf-name").replace(/\s+/g, " "), email: val("rf-email"), phone: val("rf-phone"), ok: document.getElementById("rf-ok").checked };
      if (!nv.name) return bad(adult ? "Please type your first name." : "Please type the student's first name.", "rf-name");
      if (!adult && nv.name.includes(" ")) return bad("Please type the first name only.", "rf-name");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nv.email)) return bad("Please check the email address.", "rf-email");
      if (nv.phone && !/^\+?[0-9 ().-]{7,20}$/.test(nv.phone)) return bad("Please check the mobile number, or leave it empty.", "rf-phone");
      if (!nv.ok) return bad("Please tick the box to give consent.", "rf-ok");
      e.target.querySelector("button[type=submit]").disabled = true;
      if (user) return finish(nv);
      store.set(KEY, JSON.stringify(nv)); signInStep(nv);
    };
    const no = document.getElementById("rf-no");
    if (no) no.onclick = async () => {
      if (!no.dataset.sure) { no.dataset.sure = "1"; no.textContent = "Tap again to say no"; return; }
      const { error } = await sb.rpc("answer_consent", { token, parent_name: "", agree: false });
      if (error) return bad(friendly(error));
      store.del(KEY); say(`Thanks for letting us know. ${esc(first)} won't be added to the class.`, true);
    };
  }
  function signInStep(v){
    const b = signInBlock("/register/" + token, "signup");
    $app.innerHTML = `<section class="card narrow reg">${head}${steps(1)}
      <p class="m0"><strong>Last step: create your account</strong> so you can open ${adult ? "your" : esc(v.name) + "'s"} practice page. Choose a password, then tap the link we email you once to confirm. Already have an account? Sign in instead.</p>
      ${b.html}
      <p class="hint m0">Details: ${[v.name, v.email, v.phone].filter(Boolean).map(esc).join(" · ")} <button class="link-btn" type="button" id="rf-edit">Change</button></p></section>`;
    b.wire();
    const em = document.getElementById("si-email"); if (em && !em.value) em.value = v.email;
    document.getElementById("rf-edit").onclick = () => form(v);
  }
  if (user && saved && saved.ok) { $app.innerHTML = `<section class="card narrow reg">${head}<p class="muted m0">Finishing your registration…</p></section>`; return finish(saved); }
  if (!user && saved && saved.ok) return signInStep(saved);
  form(saved || { name: first, email: user?.email || "", phone: "", ok: false });
}

/* ======================= SHARED BITS ======================= */
const store = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }, del(k){ try { localStorage.removeItem(k); } catch(e){} } };
let poll = null;
const AV = ["#9a2a22","#b07a18","#6e0f0c","#8a5a2b","#4f6b3a","#7a3b5c","#2f5d6c","#c4651a"];
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
  const ring = document.getElementById("ring"), clock = document.getElementById("clock"), goalTxt = document.getElementById("goal-txt");
  // The timer only counts while this screen is open and in front. Leaving it (another app, tab or window,
  // or the screen turning off) pauses it; the student taps Resume when they're back.
  // Saved as { acc: ms counted so far, start: when the current stretch began (null = paused), beat: last tick }.
  let tick = null, chimed = false;
  const read = () => { const raw = store.get(TK); if (!raw) return null;
    if (/^\d+$/.test(raw)) return { acc: 0, start: null, beat: 0, paused: true, acc0: Date.now() - +raw };   // older format
    try { return JSON.parse(raw); } catch (e) { return null; } };
  const write = t => t ? store.set(TK, JSON.stringify(t)) : store.del(TK);
  const elapsed = t => !t ? 0 : t.acc + (t.start ? Date.now() - t.start : 0);
  let T = read();
  if (T && T.acc0 != null) { T = { acc: 0, start: null, beat: 0, paused: true }; write(T); }          // can't tell how long an old timer really ran
  if (T && T.start) { T.acc += Math.max(0, (T.beat || T.start) - T.start); T.start = null; T.paused = true; write(T); }  // the page was closed while running
  const pause = () => {
    if (!T || !T.start) return;
    T.acc += Date.now() - T.start; T.start = null; T.paused = true; write(T); clearInterval(tick);
    try { wake?.release(); } catch (e) {}
    paint();
  };
  const resume = () => { T.start = Date.now(); T.beat = T.start; T.paused = false; write(T); out.innerHTML = ""; keepAwake(); run(); };
  const paint = () => {
    const secs = Math.floor(elapsed(T) / 1000), running = !!(T && T.start), paused = !!(T && !T.start);
    clock.textContent = mmss(secs);
    ring.setAttribute("stroke-dashoffset", String(326.7 * (1 - Math.min(1, secs / (goal * 60)))));
    ring.classList.toggle("paused", paused);
    goalTxt.textContent = paused ? "Paused" : `of ${goal} min`;
    if (running && !chimed && secs >= goal * 60) { chimed = true; chime(); out.innerHTML = `<div class="notice ok">Goal reached! Keep going or press Stop to save.</div>`; }
    if (paused && !out.innerHTML) out.innerHTML = `<div class="notice">Paused. The timer only runs while this screen is open. Tap <strong>Resume</strong> to carry on, or <strong>Save</strong> to keep the time so far.</div>`;
    goBtn.textContent = running ? "Stop" : paused ? "Resume" : "Start";
    goBtn.classList.toggle("stop", running);
    cancel.hidden = !T; save.hidden = !paused;
  };
  const save = document.createElement("button"); save.type = "button"; save.className = "btn ghost light small"; save.textContent = "Save"; save.hidden = true;
  cancel.before(save);
  const run = () => { clearInterval(tick); tick = setInterval(() => {
      if (!clock.isConnected) { clearInterval(tick); return; }
      if (T && T.start) { T.beat = Date.now(); write(T); }
      paint(); }, 1000); paint(); };
  const finish = async () => {
    const mins = Math.min(300, Math.round(elapsed(T) / 60000));
    if (mins < 1) { out.innerHTML = `<div class="notice">Practise for at least a minute to save it. Keep going, or press Cancel.</div>`; return; }
    goBtn.disabled = save.disabled = true;
    const { error } = await sb.rpc("add_practice", { student: cur.id, mins, on_day: ymd(today0()) });
    goBtn.disabled = save.disabled = false;
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    T = null; write(null); clearInterval(tick); try { wake?.release(); } catch (e) {}
    viewDesk(""); setTimeout(() => { const o = document.getElementById("p-out"); if (o) o.innerHTML = `<div class="notice ok">Saved ${fmtMins(mins)}. Well done, ${esc(person.name)}! ${esc(g.teacher_name)} will see it.</div>`; }, 400);
  };
  goBtn.onclick = () => {
    if (!T) { T = { acc: 0, start: Date.now(), beat: Date.now(), paused: false }; write(T); chimed = false; out.innerHTML = ""; keepAwake(); run(); return; }
    if (!T.start) return resume();
    pause(); out.innerHTML = ""; finish();
  };
  save.onclick = () => finish();
  cancel.onclick = () => { if (!cancel.dataset.sure) { cancel.dataset.sure = "1"; cancel.textContent = "Tap again to cancel"; return; }
    T = null; write(null); clearInterval(tick); out.innerHTML = ""; cancel.dataset.sure = ""; cancel.textContent = "Cancel"; try { wake?.release(); } catch (e) {} paint(); };
  // Leaving the screen pauses the timer
  const away = () => { if (!clock.isConnected) { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", away); window.removeEventListener("pagehide", away); return; } pause(); };
  const onVis = () => { if (document.visibilityState === "hidden") away(); };
  document.addEventListener("visibilitychange", onVis); window.addEventListener("blur", away); window.addEventListener("pagehide", away);
  paint();
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
  waiting_consent: { label: "Waiting to register", cls: "wait" },
  consented: { label: "Parent said yes", cls: "info" },
  invited: { label: "Waiting to register", cls: "wait" },
  active: { label: "Registered", cls: "ok" },
  declined: { label: "Parent said no", cls: "grey" },
  withdrawn: { label: "Request withdrawn", cls: "grey" }
};
const statusPill = s => `<span class="pill ${STATUS[s.status]?.cls || ""}">${STATUS[s.status]?.label || esc(s.status)}</span>`;
const waDigits = p => { let d = String(p || "").replace(/\D/g, ""); if (d.length === 10) d = "1" + d; return d; };
const nextStep = s => s.status === "waiting_consent" ? { which: "consent", label: s.consent_sent_at ? "Send again" : "Send registration link" }
  : s.status === "consented" ? { which: "join", label: "Send registration link" }
  : s.status === "invited" ? { which: "join", label: s.join_sent_at ? "Send again" : "Send registration link" } : null;

// The registration message. bold = true wraps key words in *stars*, which WhatsApp shows as bold.
function inviteText(s, which, g, k, bold){
  const url = siteUrl("/register/" + (which === "consent" ? s.consent_token : s.join_token));
  const B = t => bold ? `*${t}*` : t, when = `${DAYS[k.day_of_week]}s at ${fmtTime(k.start_time)}`;
  const sign = `Warm regards,\n${g.teacher_name}\n${g.name}`;
  if (s.is_adult) return [
    `${B("Gurushishya")} | ${g.name}`, ``,
    `Hello ${s.first_name},`, ``,
    `You're invited to join ${B(k.name)} (${when}) on Gurushishya, where students keep track of their daily practice between classes.`, ``,
    `Please register here. It takes about a minute:`, url, ``,
    `If you have any questions, just reply to this message.`, ``, sign].join("\n");
  return [
    `${B("Gurushishya")} | ${g.name}`, ``,
    `Hello${s.contact_name ? " " + s.contact_name : ""},`, ``,
    `I'd like to add ${B(s.first_name)} to my ${B(k.name)} class (${when}) on Gurushishya, where students keep track of their daily practice between classes.`, ``,
    `As ${s.first_name}'s parent or guardian, please register and give your consent here. It takes about a minute:`, url, ``,
    `Gurushishya keeps only ${s.first_name}'s first name and practice record, and only you and I can see them.`, ``,
    `If you have any questions, just reply to this message.`, ``, sign].join("\n");
}
function openInvite(s, which, g, k, onDone){
  const text = inviteText(s, which, g, k), waText = inviteText(s, which, g, k, true), phone = s.contact_phone, email = s.contact_email;
  const subject = s.is_adult ? `${g.name}: your registration for ${k.name}` : `${g.name}: please register ${s.first_name} for ${k.name}`;
  const dlg = document.createElement("dialog"); dlg.className = "dlg"; dlg.setAttribute("aria-labelledby", "dlg-h");
  dlg.innerHTML = `<div class="dlg-in">
    <h2 id="dlg-h">Send ${esc(s.is_adult ? s.first_name : s.contact_name || "the parent")} the registration link</h2>
    <p class="muted m0">${phone || email ? "Choose how to send it. Your WhatsApp, messages or email opens with this message ready. Just press send." : "No mobile number or email is saved for them. Copy the message and send it your own way, or add their details on the Students tab."}</p>
    <div class="msg-preview">${esc(text)}</div>
    <div class="send-btns">
      ${phone ? `<a class="btn wa" data-send target="_blank" rel="noopener" href="https://wa.me/${waDigits(phone)}?text=${encodeURIComponent(waText)}">WhatsApp</a>` : ""}
      ${phone ? `<a class="btn ghost" data-send href="sms:${esc(phone.replace(/[^\d+]/g, ""))}?&body=${encodeURIComponent(text)}">Text message</a>` : ""}
      ${email ? `<a class="btn ghost" data-send href="mailto:${esc(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}">Email</a>` : ""}
      <button class="btn ghost" type="button" data-copy>Copy message</button>
    </div>
    <div class="row between"><span class="hint">${[phone, email].filter(Boolean).map(esc).join(" · ")}</span><button class="btn small ghost" type="button" data-close>Cancel</button></div>
  </div>`;
  document.body.appendChild(dlg);
  let sent = false;
  const closeBtn = dlg.querySelector("[data-close]");
  const mark = async () => { if (sent) return; sent = true; closeBtn.textContent = "Done"; closeBtn.classList.remove("ghost"); await sb.rpc("mark_invite_sent", { student: s.id, which }); };
  dlg.querySelectorAll("[data-send]").forEach(a => a.addEventListener("click", mark));
  dlg.querySelector("[data-copy]").onclick = e => { mark(); copy(text, e.currentTarget); };
  const close = () => { dlg.close(); dlg.remove(); if (onDone) onDone(); };
  dlg.querySelector("[data-close]").onclick = close;
  dlg.addEventListener("cancel", e => { e.preventDefault(); close(); });
  dlg.showModal();
}

/* Manage one student: withdraw a request, send a new link, or delete them (and their records) */
const PENDING = ["waiting_consent", "consented", "invited"];
function openManage(s, g, D, again, after){
  const pending = PENDING.includes(s.status), active = s.status === "active", nm = esc(s.first_name);
  const acts = [];
  if (pending) acts.push({ id: "withdraw", cls: "ghost", label: "Withdraw the request", note: "The link you sent stops working. " + nm + " stays on your list as \"withdrawn\", so you can send a new link later." });
  if (s.status === "withdrawn" || s.status === "declined") acts.push({ id: "relink", cls: "", label: "Send a new link", note: "Makes a fresh registration link. Any old link stays switched off." });
  acts.push(active
    ? { id: "delete", cls: "ghost danger", label: `Delete ${s.first_name} and all their records`, note: `Removes ${nm} from your class, with their practice record, chat and your notes. This can't be undone.` }
    : { id: "delete", cls: "ghost danger", label: "Delete this request", note: `Removes ${nm} from your list completely. Any link you sent stops working.` });
  const dlg = document.createElement("dialog"); dlg.className = "dlg"; dlg.setAttribute("aria-labelledby", "dlg-h");
  dlg.innerHTML = `<div class="dlg-in">
    <h2 id="dlg-h">${nm}</h2>
    <p class="muted m0">${esc(D.classOf(s.class_id).name)} · ${STATUS[s.status]?.label || esc(s.status)}</p>
    <div class="mg-list">${acts.map(a => `<div class="mg-item"><button class="btn ${a.cls}" type="button" data-act="${a.id}">${a.label}</button><p class="hint m0">${a.note}</p></div>`).join("")}</div>
    <div class="out" role="status"></div>
    <div class="row" style="justify-content:flex-end"><button class="btn small ghost" type="button" data-close>Cancel</button></div></div>`;
  document.body.appendChild(dlg);
  const out = dlg.querySelector(".out");
  let changed = "";
  const close = () => { dlg.close(); dlg.remove(); if (changed) (after ? after(changed) : again()); };
  dlg.querySelector("[data-close]").onclick = close;
  dlg.addEventListener("cancel", e => { e.preventDefault(); close(); });
  dlg.querySelectorAll("[data-act]").forEach(b => b.onclick = async () => {
    const a = b.dataset.act;
    if ((a === "delete" || a === "withdraw") && !b.dataset.sure) { b.dataset.sure = "1"; b.textContent = a === "delete" ? "Tap again to delete" : "Tap again to withdraw"; return; }
    dlg.querySelectorAll("[data-act]").forEach(x => x.disabled = true);
    const r = a === "withdraw" ? await sb.rpc("withdraw_invite", { student: s.id })
      : a === "relink" ? await sb.rpc("new_invite_links", { student: s.id })
      : await sb.from("students").delete().eq("id", s.id);
    if (r.error) { out.innerHTML = `<div class="notice">${esc(friendly(r.error))}</div>`; dlg.querySelectorAll("[data-act]").forEach(x => x.disabled = false); return; }
    changed = a;
    out.innerHTML = `<div class="notice ok">${a === "withdraw" ? "Request withdrawn. The link no longer works." : a === "relink" ? "New link ready. Tap \"Send registration link\" to send it." : `${nm} has been deleted.`}</div>`;
    setTimeout(close, 1200);
  });
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
  while (checked < 3) { if (ds.has(ymd(d))) return false; if (d.getDay() !== classDay) checked++; d = addDays(d, -1); }
  return true;
}

const TTABS = [["/teacher", "Overview"], ["/teacher/students", "Students"], ["/teacher/classes", "Classes"], ["/teacher/chat", "Chat"], ["/teacher/page", "My page"]];
async function viewTeacher(sub = "", id = ""){
  if (!onRoot()) { location.href = siteUrl("/teacher"); return; }
  if (!user) return go("/signin?next=/teacher");
  $app.innerHTML = LOADING;
  const { data: groups, error } = await sb.from("groups").select("*").eq("owner_id", user.id).order("created_at");
  if (error) { $app.innerHTML = `<p class="notice">${esc(friendly(error))}</p>`; return; }
  if (!groups.length) return viewNewGroup();
  roles.teacher = true;
  const g = groups.find(x => x.id === store.get("riyaz.group")) || groups[0];
  const [D, adm] = await Promise.all([loadGroup(g), roles.admin ? sb.rpc("admin_groups") : Promise.resolve({ data: null })]);
  const approvals = adm.data || [];
  D.waitingTeachers = approvals.filter(x => !x.approved).length;
  const tabs = roles.admin ? [...TTABS, ["/teacher/approve", "Approvals"]] : TTABS;
  const active = sub ? "/teacher/" + sub : "/teacher";
  const first = String(g.teacher_name || "").trim().split(/\s+/)[0];
  document.title = "Dashboard · Gurushishya";
  $app.innerHTML = `<section class="dash-head">
      <img class="dash-mark" src="/assets/gs-emblem.png" alt="" width="240" height="134">
      <div class="dash-title"><span class="eyebrow">Dashboard</span><h1 class="page-h">${first ? `Welcome, ${esc(first)}` : esc(g.name)}</h1>
        <p class="muted m0">${esc(g.name)} · ${today0().toLocaleDateString(undefined, { weekday:"long", day:"numeric", month:"long" })}</p></div>
      <div class="row dash-tools">${groups.length > 1 ? `<label class="sr" for="grp">Choose group</label><select id="grp" class="grp">${groups.map(x => `<option value="${x.id}" ${x.id === g.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : ""}
      ${link("/teacher/classes?add=1", "+ Add a class", "btn small")}${link("/account", "Account", "btn ghost small")}</div></section>
    ${user.user_metadata?.has_password ? "" : `<div class="pw-tip"><span>Set a password so you can sign in any time without waiting for an email.</span>${link("/account", "Set password", "btn small ghost")}</div>`}
    ${D.waitingTeachers && sub !== "approve" ? `<div class="ap-banner">${ICO.bell}<span><strong>${D.waitingTeachers} new teacher${D.waitingTeachers === 1 ? " is" : "s are"} waiting for your approval</strong></span>${link("/teacher/approve", "Review", "btn small")}</div>` : ""}
    ${g.approved ? "" : `<p class="notice m0">Gurushishya is checking your page. You can add classes and students now. The registration links you send start working once it's approved.</p>`}
    ${tabsNav(tabs.map(([h, t]) => [h, t, h === "/teacher/chat" ? D.unread : h === "/teacher/approve" ? D.waitingTeachers : 0]), active, "Dashboard menu")}
    <div id="pane" class="stack"></div>`;
  const cur = $app.querySelector('.tab[aria-current="page"]');
  if (cur && cur.parentElement) cur.parentElement.scrollLeft = Math.max(0, cur.offsetLeft - 16);
  const sel = document.getElementById("grp");
  if (sel) sel.onchange = () => { store.set("riyaz.group", sel.value); go("/teacher"); };
  const pane = document.getElementById("pane"), again = () => viewTeacher(sub, id);
  if (sub === "students" && id) return tReport(pane, g, D, id, again);
  if (sub === "students") return tStudents(pane, g, D, again);
  if (sub === "classes") return tClasses(pane, g, D, again);
  if (sub === "chat") return tChat(pane, g, D, id);
  if (sub === "page") return tPage(pane, g, again);
  if (sub === "approve" && roles.admin) return tApprove(pane, approvals, again);
  return tOverview(pane, g, D, again);
}

/* Online classes: teachers paste a Zoom / Meet / Teams link, or the whole invitation, and we keep the link */
const meetingLink = txt => { const all = String(txt || "").match(/https:\/\/[^\s<>"')]+/g) || [];
  return (all.find(u => /zoom\.(us|com)|meet\.google|teams\.(microsoft|live)|webex/i.test(u)) || all[0] || "").replace(/[.,;]+$/, ""); };
const meetingKind = u => /zoom\./i.test(u) ? "Zoom" : /meet\.google/i.test(u) ? "Google Meet" : /teams\./i.test(u) ? "Teams" : /webex/i.test(u) ? "Webex" : "Online";
const startsIn = (k, now = new Date()) => { const [h, m] = String(k.start_time || "0:0").split(":").map(Number); const t = new Date(now); t.setHours(h, m, 0, 0);
  const diff = Math.round((t - now) / 60000); if (diff > 90) return ""; if (diff > 0) return `starts in ${diff} min`;
  return diff > -(k.duration_min || 60) ? "on now" : "finished"; };

/* ---- Overview: who practised today, who hasn't, and a quick note or reminder ---- */
const lastPractice = ds => { let last = ""; ds.forEach(d => { if (d > last) last = d; }); return last; };
const ICO = {
  check: svg(`<path d="m5 12.5 4.5 4.5L19 7.5"/>`),
  clock: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`),
  bell: svg(`<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>`),
  door: svg(`<path d="M5 20.5V9a7 7 0 0 1 14 0v11.5"/><path d="M3 20.5h18M12 13v3"/>`),
  note: svg(`<path d="M5 4.5h14v11l-4.5 4H5z"/><path d="M14.5 19.5v-4H19M8.5 9h7M8.5 12.5h4"/>`),
  lotus: svg(`<path d="M12 5c2.4 2.8 2.4 6.6 0 9.6-2.4-3-2.4-6.8 0-9.6z"/><path d="M12 14.6c-3.8 0-7-1.9-8.7-5.2 3.8 0 7 1.9 8.7 5.2zm0 0c3.8 0 7-1.9 8.7-5.2-3.8 0-7 1.9-8.7 5.2zM5 18h14"/>`),
  video: svg(`<rect x="2.5" y="6.5" width="13" height="11" rx="2.5"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>`),
  people: IC.people, calendar: IC.calendar
};
function practiceState(s, D){
  const k = D.classOf(s.class_id), ds = D.done(s.id), t = ymd(today0());
  if (ds.has(t)) { const m = D.mins(s.id, t); return { key: "done", label: m ? `Practised · ${fmtMins(m)}` : "Practised today", icon: ICO.check }; }
  if (today0().getDay() === k.day_of_week) return { key: "class", label: "Class day", icon: ICO.door };
  if (needsNudge(s, ds, k.day_of_week)) { const l = lastPractice(ds);
    const ld = l ? new Date(l + "T00:00") : null, recent = ld && ld > addDays(today0(), -7);
    return { key: "remind", label: ld ? `Last practised ${ld.toLocaleDateString(undefined, recent ? { weekday:"short" } : { day:"numeric", month:"short" })}` : "Not started yet", icon: ICO.bell }; }
  return { key: "notyet", label: "Not yet today", icon: ICO.clock };
}
function weekDots(s, D){
  const k = D.classOf(s.class_id), ws = weekStartFor(k.day_of_week), ds = D.done(s.id), t = ymd(today0());
  return `<span class="wdots" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => { const d = addDays(ws, i), key = ymd(d);
    const c = i === 0 ? "cls" : ds.has(key) ? "on" : key > t ? "fut" : key === t ? "now" : "";
    return `<i class="${c}" title="${shortDate(d)}">${SHORT[d.getDay()].charAt(0)}</i>`; }).join("")}</span>`;
}
const reminderText = (list, g, D) => {
  const cls = new Set(list.map(s => s.class_id)), t = cls.size === 1 ? D.taskFor([...cls][0]) : null;
  return `Hi${list.length === 1 ? " " + list[0].first_name : ""}, a gentle reminder to practise today${t ? `: ${t.title} (${t.minutes} min)` : ""}. Press Start in Gurushishya when you begin.\n${g.teacher_name}`;
};
const remindedKey = s => "gs.reminded." + s.id;
const remindedToday = s => store.get(remindedKey(s)) === ymd(today0());

/* One dialog for a note or a reminder, to one student or to many */
function openMessage(list, mode, g, D, onDone){
  const one = list.length === 1 ? list[0] : null;
  const names = list.map(s => s.first_name);
  const who = one ? one.first_name : names.length <= 3 ? names.join(", ") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
  const phone = one?.contact_phone, to = one ? (one.is_adult ? one.first_name : (one.contact_name || "the parent")) : "";
  const dlg = document.createElement("dialog"); dlg.className = "dlg"; dlg.setAttribute("aria-labelledby", "dlg-h");
  dlg.innerHTML = `<form class="dlg-in" method="dialog">
    <h2 id="dlg-h">${mode === "remind" ? `Remind ${esc(who)}` : `Send a note to ${esc(who)}`}</h2>
    <p class="muted m0">${one ? `${esc(one.first_name)} sees it in their Gurushishya chat.` : "Each student gets it in their own Gurushishya chat. Students can't see each other."}</p>
    <label for="msg-text" class="sr">Message</label>
    <textarea id="msg-text" rows="5" maxlength="2000" required>${mode === "remind" ? esc(reminderText(list, g, D)) : ""}</textarea>
    <div class="row"><button class="btn" type="submit">${ICO.note}<span>Send in Gurushishya</span></button>
      ${phone ? `<a class="btn ghost" data-wa target="_blank" rel="noopener" href="#">WhatsApp ${esc(to)}</a>` : ""}</div>
    <div class="out" role="status"></div>
    <div class="row between"><span class="hint">${phone ? esc(phone) : ""}</span><button class="btn small ghost" type="button" data-close>Close</button></div>
  </form>`;
  document.body.appendChild(dlg);
  const ta = dlg.querySelector("textarea"), out = dlg.querySelector(".out");
  const close = () => { dlg.close(); dlg.remove(); if (sent && onDone) onDone(); };
  let sent = false;
  const markReminded = () => { if (mode === "remind") list.forEach(s => store.set(remindedKey(s), ymd(today0()))); };
  dlg.querySelector("form").onsubmit = async e => {
    e.preventDefault(); const b = dlg.querySelector("button[type=submit]"); b.disabled = true;
    const { data: n, error } = await sb.rpc("message_students", { student_ids: list.map(s => s.id), body: ta.value });
    b.disabled = false;
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    sent = true; markReminded();
    out.innerHTML = `<div class="notice ok">Sent${one ? "" : ` to ${n} student${n === 1 ? "" : "s"}`}. ${one ? esc(one.first_name) + " will" : "They'll"} see it in their chat.</div>`;
    setTimeout(close, 1400);
  };
  const waBtn = dlg.querySelector("[data-wa]");
  if (waBtn) waBtn.onclick = () => { waBtn.href = `https://wa.me/${waDigits(phone)}?text=${encodeURIComponent(ta.value)}`; sent = true; markReminded(); };
  dlg.querySelector("[data-close]").onclick = close;
  dlg.addEventListener("cancel", e => { e.preventDefault(); close(); });
  dlg.showModal(); if (mode !== "remind") ta.focus();
}

function tOverview(pane, g, D, again){
  const act = D.studs.filter(s => s.status === "active");
  const waiting = D.studs.filter(s => ["waiting_consent", "consented", "invited"].includes(s.status)).length;
  const st = new Map(act.map(s => [s.id, practiceState(s, D)]));
  const is = (s, f) => { const k = st.get(s.id).key; return f === "all" || (f === "done" && k === "done") || (f === "notyet" && (k === "notyet" || k === "remind")) || (f === "remind" && k === "remind"); };
  let filter = "all", classFilter = "all";
  const inClass = s => classFilter === "all" || s.class_id === classFilter;
  const count = f => act.filter(s => inClass(s) && is(s, f)).length;
  const old = t => t && new Date(t) < addDays(new Date(), -3);
  const todo = [];
  if (D.unread) todo.push({ hot: true, text: `${D.unread} new message${D.unread === 1 ? "" : "s"} from students`, btn: link("/teacher/chat", "Open chat", "btn small") });
  if (!D.classes.length) todo.push({ text: "Add your first class", btn: link("/teacher/classes", "Add a class", "btn small") });
  else if (!D.studs.length) todo.push({ text: "Add your first student", btn: link("/teacher/students", "Add a student", "btn small") });
  D.classes.forEach(k => { if (!D.taskFor(k.id) && D.studs.some(s => s.class_id === k.id)) todo.push({ text: `Set this week's practice for ${k.name}`, btn: link("/teacher/classes", "Set practice", "btn small ghost") }); });
  D.studs.forEach(s => {
    if (s.status === "waiting_consent" && !s.consent_sent_at) todo.push({ s, which: "consent", text: `Send ${s.contact_name || "the parent"} the registration link for ${s.first_name}`, label: "Send link" });
    else if (s.status === "waiting_consent" && old(s.consent_sent_at)) todo.push({ s, which: "consent", text: `${s.first_name}'s parent hasn't registered yet`, label: "Send again" });
    else if (s.status === "consented") todo.push({ hot: true, s, which: "join", text: `${s.first_name}'s parent said yes. Send the registration link to finish`, label: "Send link" });
    else if (s.status === "invited" && !s.join_sent_at) todo.push({ s, which: "join", text: `Send ${s.first_name} the registration link`, label: "Send link" });
    else if (s.status === "invited" && old(s.join_sent_at)) todo.push({ s, which: "join", text: `${s.first_name} hasn't registered yet`, label: "Send again" });
    else if (s.status === "declined") todo.push({ text: `${s.first_name}'s parent said no`, btn: link("/teacher/students/" + s.id, "View", "btn small ghost") });
  });
  const FILTERS = [["all", "All"], ["done", "Practised"], ["notyet", "Not yet"], ["remind", "Need a reminder"]];
  const todays = D.classes.filter(k => k.day_of_week === today0().getDay());
  pane.innerHTML = `
    ${todays.length ? `<section class="card today-cls"><h2 class="with-ico">${ICO.calendar}Today's class${todays.length > 1 ? "es" : ""}</h2>
      <ul class="tc-list">${todays.map(k => { const u = D.linkOf(k.id), n = D.studs.filter(s => s.class_id === k.id && s.status === "active").length;
        return `<li><div class="tc-main"><strong>${esc(k.name)}</strong><span class="hint">${fmtTime(k.start_time)} · ${k.duration_min} min · ${n} student${n === 1 ? "" : "s"}${startsIn(k) ? " · " + startsIn(k) : ""}</span></div>
          ${u ? `<a class="btn small zoom" href="${esc(u)}" target="_blank" rel="noopener">${ICO.video}<span>Start ${esc(meetingKind(u))} class</span></a>` : link("/teacher/classes", "Add online link", "btn small ghost")}</li>`; }).join("")}</ul></section>` : ""}
    <div class="tiles dash-tiles">
      <button type="button" class="tile t-done" data-f="done">${ICO.check}<b id="n-done"></b><span>Practised today</span></button>
      <button type="button" class="tile t-notyet" data-f="notyet">${ICO.clock}<b id="n-notyet"></b><span>Not yet today</span></button>
      <button type="button" class="tile t-remind" data-f="remind">${ICO.bell}<b id="n-remind"></b><span>Need a reminder</span></button>
      <a class="tile t-wait" href="/teacher/students" data-link>${ICO.door}<b>${waiting}</b><span>Waiting to join</span></a>
    </div>
    <section class="card ps-card">
      <div class="row between ps-top"><div><h2>Today's practice</h2><p class="hint m0">${act.length ? "Tap a name for the full report." : ""}</p></div>
        ${D.classes.length > 1 ? `<label class="sr" for="ps-class">Show class</label><select id="ps-class" class="grp"><option value="all">All classes</option>${D.classes.map(k => `<option value="${k.id}">${esc(k.name)}</option>`).join("")}</select>` : ""}</div>
      ${act.length ? `<div class="chips ps-chips" role="group" aria-label="Show">${FILTERS.map(([f, t]) => `<button type="button" class="chip" data-chip="${f}" aria-pressed="${f === filter}">${t} <span class="chip-n" data-cn="${f}"></span></button>`).join("")}</div>
      <div class="ps-bulk"><button class="btn small" type="button" id="remind-all">${ICO.bell}<span id="remind-all-t"></span></button>
        <button class="btn small ghost" type="button" id="note-all">${ICO.note}<span>Note to everyone</span></button></div>
      <ul class="ps-list" id="ps-list"></ul>`
      : `<div class="empty">${ICO.lotus}<p class="m0">When your students join, you'll see here who practised today and who hasn't.</p>${link("/teacher/students", "Add students", "btn small")}</div>`}
    </section>
    <section class="card"><h2>To do</h2>
      ${todo.length ? `<ul class="todo">${todo.map((t, i) => `<li class="${t.hot ? "hot" : ""}"><span>${esc(t.text)}</span>${t.btn || (g.approved ? `<button class="btn small" type="button" data-i="${i}">${t.label}</button>` : `<span class="hint">After approval</span>`)}</li>`).join("")}</ul>`
        : `<div class="empty">All caught up. Nice work!</div>`}
    </section>`;
  pane.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const t = todo[+b.dataset.i]; openInvite(t.s, t.which, g, D.classOf(t.s.class_id), again); });
  if (!act.length) { ["done", "notyet", "remind"].forEach(f => document.getElementById("n-" + f).textContent = "0"); return; }
  const list = document.getElementById("ps-list");
  const notYet = () => act.filter(s => inClass(s) && is(s, "notyet"));
  const draw = () => {
    ["done", "notyet", "remind"].forEach(f => { const n = count(f), exp = act.filter(s => inClass(s) && st.get(s.id).key !== "class").length;
      document.getElementById("n-" + f).innerHTML = f === "done" ? `${n}<small> of ${exp}</small>` : String(n); });
    pane.querySelectorAll("[data-cn]").forEach(e => e.textContent = count(e.dataset.cn));
    pane.querySelectorAll("[data-chip]").forEach(c => c.setAttribute("aria-pressed", String(c.dataset.chip === filter)));
    const ny = notYet().length, ra = document.getElementById("remind-all");
    ra.disabled = !ny; document.getElementById("remind-all-t").textContent = ny ? `Remind all not yet (${ny})` : "Everyone has practised";
    const rows = act.filter(s => inClass(s) && is(s, filter));
    const order = { remind: 0, notyet: 1, class: 2, done: 3 };
    rows.sort((a, b) => order[st.get(a.id).key] - order[st.get(b.id).key] || a.first_name.localeCompare(b.first_name));
    list.innerHTML = rows.length ? rows.map(s => { const k = D.classOf(s.class_id), x = st.get(s.id), w = D.weekOf(s.id, k), canRemind = x.key === "notyet" || x.key === "remind";
      return `<li class="ps-row ps-${x.key}">
        <a class="ps-who" href="/teacher/students/${s.id}" data-link>${avatar(s.first_name, 40)}<span class="ps-name"><strong>${esc(s.first_name)}</strong>
          <span class="hint">${esc(k.name)}<span class="ps-wk"> · ${w.n} of 6 days</span></span></span></a>
        ${weekDots(s, D)}
        <span class="ps-state">${x.icon}<span>${esc(x.label)}</span></span>
        <span class="ps-acts">${canRemind && remindedToday(s) ? `<span class="hint ps-sent">Reminded today</span>` : ""}
          <button class="btn tiny ghost" type="button" data-note="${s.id}" aria-label="Send a note to ${esc(s.first_name)}">${ICO.note}<span>Note</span></button>
          ${canRemind ? `<button class="btn tiny" type="button" data-remind="${s.id}">${ICO.bell}<span>Remind</span></button>` : ""}</span>
      </li>`; }).join("")
      : `<li class="ps-none">${filter === "done" ? "No one has practised yet today." : filter === "remind" ? "No one needs a reminder. Lovely!" : "Everyone here has practised today."}</li>`;
    list.querySelectorAll("[data-note]").forEach(b => b.onclick = () => openMessage([act.find(s => s.id === b.dataset.note)], "note", g, D, draw));
    list.querySelectorAll("[data-remind]").forEach(b => b.onclick = () => openMessage([act.find(s => s.id === b.dataset.remind)], "remind", g, D, draw));
  };
  pane.querySelectorAll("[data-chip]").forEach(c => c.onclick = () => { filter = c.dataset.chip; draw(); });
  pane.querySelectorAll(".tile[data-f]").forEach(t => t.onclick = () => { filter = t.dataset.f; draw(); list.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" }); });
  const pc = document.getElementById("ps-class"); if (pc) pc.onchange = () => { classFilter = pc.value; draw(); };
  document.getElementById("remind-all").onclick = () => { const l = notYet(); if (l.length) openMessage(l, "remind", g, D, draw); };
  document.getElementById("note-all").onclick = () => openMessage(act.filter(inClass), "note", g, D, draw);
  draw();
}

/* ---- Approvals (site admin only): approve new teachers so their page and links start working ---- */
function tApprove(pane, list, again){
  const day = d => new Date(d).toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" });
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const row = x => `<li class="ap-row${x.approved ? "" : " ap-wait"}">
      <div class="ap-main"><strong>${esc(x.name)}</strong>
        <span class="hint">${esc(x.teacher_name || "")}${x.owner_email ? " · " + esc(x.owner_email) : ""}</span>
        <span class="hint">${esc((ARTS[x.art_type] || {}).label || x.art_type || "")} · ${plural(x.classes, "class").replace("classs", "classes")} · ${plural(x.students, "student")} · joined ${day(x.created_at)}</span>
        ${x.approved ? `<a class="link-btn" href="${groupUrl(x.slug)}" ${C.rootDomain ? "" : "data-link"}>View their page</a>` : ""}</div>
      <div class="ap-act">${x.approved
        ? `<span class="pill ok">Approved</span><button class="btn tiny ghost" type="button" data-un="${x.id}">Undo</button>`
        : `<button class="btn" type="button" data-ok="${x.id}">${ICO.check}<span>Approve</span></button>`}</div>
    </li>`;
  const wait = list.filter(x => !x.approved), done = list.filter(x => x.approved);
  pane.innerHTML = `
    <section class="card"><h2>Teachers waiting for approval</h2>
      <p class="hint m0">Check who the teacher is first. Once you approve, their page goes public and the registration links they send start working.</p>
      ${wait.length ? `<ul class="ap-list">${wait.map(row).join("")}</ul>` : `<div class="empty">${ICO.lotus}<p class="m0">No one is waiting. All caught up.</p></div>`}
      <div id="ap-out" role="status"></div></section>
    <section class="card"><h2>Approved teachers (${done.length})</h2>
      ${done.length ? `<ul class="ap-list">${done.map(row).join("")}</ul>` : `<p class="muted m0">None yet.</p>`}</section>`;
  const out = document.getElementById("ap-out");
  const set = async (id, approve, b) => {
    b.disabled = true;
    const { error } = await sb.rpc("admin_set_approved", { group_id: id, approve });
    if (error) { b.disabled = false; out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    again();
  };
  pane.querySelectorAll("[data-ok]").forEach(b => b.onclick = () => set(b.dataset.ok, true, b));
  pane.querySelectorAll("[data-un]").forEach(b => b.onclick = () => {
    if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Tap again to undo"; return; }
    set(b.dataset.un, false, b);
  });
}

/* ---- Private admin link: /admin (not shown anywhere on the site; only the admin account gets in) ---- */
async function viewAdmin(){
  if (!onRoot()) { location.href = siteUrl("/admin"); return; }
  if (!user) return go("/signin?next=/admin");
  document.title = "Admin · Gurushishya";
  if (!roles.admin) {
    $app.innerHTML = `<section class="card narrow"><span class="eyebrow">Admin</span><h1 class="page-h">This page is for the Gurushishya admin</h1>
      <p class="muted m0">You're signed in as <strong>${esc(user.email || "")}</strong>, which isn't an admin account. Sign out (top right) and sign in with the admin email.</p></section>`;
    return;
  }
  $app.innerHTML = LOADING;
  const { data, error } = await sb.rpc("admin_groups");
  if (error) { $app.innerHTML = `<p class="notice">${esc(friendly(error))}</p>`; return; }
  $app.innerHTML = `<section class="dash-head">
      <img class="dash-mark" src="/assets/gs-emblem.png" alt="" width="240" height="134">
      <div class="dash-title"><span class="eyebrow">Admin</span><h1 class="page-h">Approve teachers</h1>
        <p class="muted m0">Signed in as ${esc(user.email || "")}</p></div>
      <div class="row dash-tools">${link("/account", user.user_metadata?.has_password ? "Change password" : "Set password", "btn ghost small")}</div></section>
    <div id="pane" class="stack"></div>`;
  tApprove(document.getElementById("pane"), data || [], viewAdmin);
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
      <p class="hint m0" id="ns-hint">You'll send the parent a registration link. They fill in the form and give consent before the child can join. Add a mobile number or an email.</p>
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
    document.getElementById("ns-hint").textContent = adult ? "You'll send a registration link. Adults fill in the form and agree for themselves." : "You'll send the parent a registration link. They fill in the form and give consent before the child can join. Add a mobile number or an email."; };
  form.querySelectorAll('input[name="ns-who"]').forEach(r => r.onchange = setWho);
  document.getElementById("add-btn").onclick = () => { form.hidden = false; document.getElementById("ns-name").focus(); };
  document.getElementById("ns-cancel").onclick = () => { form.reset(); setWho(); form.hidden = true; };
  form.onsubmit = async e => {
    e.preventDefault(); const out = document.getElementById("ns-out"), adult = document.getElementById("ns-adult").checked;
    const phone = val("ns-phone") || null, email = val("ns-email") || null;
    if (!adult && !phone && !email) { out.innerHTML = `<div class="notice">Please add the parent's mobile number or email, so you can send the registration link.</div>`; return; }
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
          <span class="sl-side">${statusPill(s)}<span class="sl-acts">${nx && g.approved ? `<button class="btn tiny" type="button" data-inv="${s.id}">${nx.label}</button>` : ""}<button class="btn tiny ghost icon-only" type="button" data-mg="${s.id}" aria-label="Manage ${esc(s.first_name)}" title="Withdraw or delete">⋯</button></span></span></li>`; }).join("")}</ul>
      <p class="hint m0">Tick students to message them together. Tap a name for their report, or ⋯ to withdraw or delete.</p>`
      : `<div class="empty">No students yet. Tap "Add a student" to start.</div>`;
    list.querySelectorAll("[data-pick]").forEach(c => c.onchange = () => { c.checked ? picked.add(c.dataset.pick) : picked.delete(c.dataset.pick); updBar(); });
    list.querySelectorAll("[data-inv]").forEach(b => b.onclick = () => { const s = D.studs.find(x => x.id === b.dataset.inv); openInvite(s, nextStep(s).which, g, D.classOf(s.class_id), again); });
    list.querySelectorAll("[data-mg]").forEach(b => b.onclick = () => openManage(D.studs.find(x => x.id === b.dataset.mg), g, D, again));
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
      <div class="row"><button class="btn small ghost" type="button" id="r-mg">${PENDING.includes(s.status) ? "Withdraw or delete request" : s.status === "active" ? "Delete student" : "New link or delete"}</button></div>
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
    <section class="card"><details><summary>Change details</summary>
      <form id="ed" style="margin-top:12px">
        <div class="two"><label for="ed-name">First name<input id="ed-name" required maxlength="40" value="${esc(s.first_name)}"></label>
          <label for="ed-class">Class<select id="ed-class">${D.classes.map(c => `<option value="${c.id}" ${c.id === s.class_id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label></div>
        ${s.is_adult ? "" : `<label for="ed-pname">Parent or guardian's name<input id="ed-pname" maxlength="80" value="${esc(s.contact_name || "")}"></label>`}
        <div class="two"><label for="ed-phone">Mobile<input id="ed-phone" type="tel" maxlength="20" pattern="[+]?[0-9 ().\\-]{7,20}" value="${esc(s.contact_phone || "")}"></label>
          <label for="ed-email">Email<input id="ed-email" type="email" maxlength="120" value="${esc(s.contact_email || "")}"></label></div>
        <div class="row"><button class="btn small" type="submit">Save changes</button><span class="hint" data-out role="status"></span></div>
      </form>
    </details></section>`;
  const inv = document.getElementById("r-inv"); if (inv) inv.onclick = () => openInvite(s, nx.which, g, k, again);
  const ag = document.getElementById("r-again"); if (ag) ag.onclick = async () => { await sb.rpc("new_invite_links", { student: s.id }); again(); };
  document.getElementById("r-mg").onclick = () => openManage(s, g, D, again, a => a === "delete" ? go("/teacher/students") : again());
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
    const shareTask = cur ? wa(`This week's practice for ${k.name}: ${cur.title}. ${cur.minutes} min a day.\nTrack it on Gurushishya: ${siteUrl("/practice")}`) : "";
    const waiting = D.studs.filter(s => s.class_id === k.id && PENDING.includes(s.status)).length;
    const doneToday = act.filter(s => D.done(s.id).has(ymd(t0))).length, url = D.linkOf(k.id), kind = url ? meetingKind(url) : "";
    return `<li class="class-item" data-id="${k.id}">
      <div class="ci-head">
        <div class="ci-title"><h3>${esc(k.name)}</h3><span class="ci-when">${DAYS[k.day_of_week]}s · ${fmtTime(k.start_time)}${classToday ? ` · <strong>today${startsIn(k) ? ", " + startsIn(k) : ""}</strong>` : ""}</span></div>
        <div class="ci-stats">
          <div class="ci-stat">${ICO.people}<b>${act.length}</b><span>student${act.length === 1 ? "" : "s"}${waiting ? ` · ${waiting} waiting` : ""}</span></div>
          <div class="ci-stat">${ICO.check}<b>${doneToday}<small>/${act.length}</small></b><span>practised today</span></div>
          <div class="ci-stat">${ICO.clock}<b>${k.duration_min}</b><span>minutes</span></div>
          <div class="ci-stat${url ? " on" : ""}">${ICO.video}<b>${url ? esc(kind) : "None"}</b><span>${url ? "online class" : "no online link"}</span></div>
        </div>
        ${url ? `<div class="row ci-go"><a class="btn small zoom" href="${esc(url)}" target="_blank" rel="noopener">${ICO.video}<span>Start online class</span></a></div>` : ""}
      </div>
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
      <div class="sub zoom-sub"><div class="row between"><strong class="with-ico">${ICO.video}Online class</strong>${url ? `<span class="pill ok">${esc(kind)} link saved</span>` : `<span class="pill grey">Not set</span>`}</div>
        ${url ? `<div class="row"><a class="btn small zoom" href="${esc(url)}" target="_blank" rel="noopener">${ICO.video}<span>Start online class</span></a>
            <button class="btn small ghost" type="button" data-copylink>Copy link</button>
            <a class="btn small wa" target="_blank" rel="noopener" href="${wa(`${k.name} online class, ${DAYS[k.day_of_week]}s at ${fmtTime(k.start_time)}\nJoin here: ${url}`)}">Share on WhatsApp</a></div>
          <p class="hint m0">Your students see a <strong>Join online class</strong> button on their practice page from 10 minutes before class. Only students in this class can see the link.</p>`
        : `<p class="hint m0">Teaching on Zoom, Google Meet or Teams? Paste the meeting link, or the whole invitation, and save. Your students then get a <strong>Join online class</strong> button 10 minutes before class.</p>`}
        <form data-f="link"><label for="ml-${k.id}">${url ? "Change the link" : "Meeting link or invitation"}<textarea id="ml-${k.id}" rows="2" maxlength="3000" placeholder="https://us05web.zoom.us/j/123456789?pwd=…">${esc(url)}</textarea></label>
          <div class="row"><button class="btn small" type="submit">Save link</button>${url ? `<button class="btn small ghost" type="button" data-rmlink>Remove link</button>` : ""}<span class="hint" data-lmsg role="status"></span></div></form>
      </div>
      <details class="sub"><summary>Class settings</summary>
        <div class="row" style="margin-top:10px"><button class="btn small ghost danger" type="button" data-del>Remove class</button><span class="hint" data-msg role="status"></span></div>
      </details></li>`;
  };
  const wantAdd = /[?&]add=1/.test(location.search) || !D.classes.length;
  pane.innerHTML = `<section class="card"><h2>Classes</h2>
    <details id="add-class" class="add-class" ${wantAdd ? "open" : ""}><summary>+ Add a class</summary>
      <form id="nc" style="margin-top:12px">
        <label for="nc-name">Class name<input id="nc-name" required minlength="2" maxlength="80" placeholder="Beginners"></label>
        <div class="two"><label for="nc-day">Day<select id="nc-day">${DAYS.map((d, i) => `<option value="${i}" ${i === 6 ? "selected" : ""}>${d}</option>`).join("")}</select></label>
          <label for="nc-time">Start time<input id="nc-time" type="time" required value="10:00"></label>
          <label for="nc-len">Length (minutes)<input id="nc-len" type="number" min="10" max="300" value="60" required></label></div>
        <label for="nc-url">Zoom, Meet or Teams link (optional). You can paste the whole invitation.<textarea id="nc-url" rows="2" maxlength="3000" placeholder="https://us05web.zoom.us/j/…"></textarea></label>
        <div class="row"><button class="btn" type="submit">Add class</button><span class="hint" data-out role="status"></span></div></form></details>
    ${D.classes.length ? `<ul class="list">${D.classes.map(card).join("")}</ul>` : `<div class="empty">No classes yet. Add your first one above.</div>`}</section>`;
  if (wantAdd) { const n = document.getElementById("nc-name"); if (n) { n.scrollIntoView({ block: "center" }); n.focus({ preventScroll: true }); } }
  document.getElementById("nc").onsubmit = async e => {
    e.preventDefault(); const out = e.target.querySelector("[data-out]"), b = e.target.querySelector("button"); b.disabled = true;
    const { data: k, error } = await sb.from("classes").insert({ group_id: g.id, name: val("nc-name"), day_of_week: +val("nc-day"), start_time: val("nc-time"), duration_min: +val("nc-len") }).select().single();
    const ncu = meetingLink(val("nc-url"));
    if (!error && ncu) await sb.from("class_links").upsert({ class_id: k.id, meeting_url: ncu });
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
      e.preventDefault(); const raw = e.target.querySelector("textarea").value, url = meetingLink(raw), msg = li.querySelector("[data-lmsg]");
      if (raw.trim() && !url) { msg.textContent = "Couldn't find a link starting with https:// in that. Please paste the meeting link."; return; }
      const r = url ? await sb.from("class_links").upsert({ class_id: id, meeting_url: url }) : await sb.from("class_links").delete().eq("class_id", id);
      if (r.error) { msg.textContent = friendly(r.error); return; }
      again();
    };
    const rml = li.querySelector("[data-rmlink]");
    if (rml) rml.onclick = async () => { if (!rml.dataset.sure) { rml.dataset.sure = "1"; rml.textContent = "Tap again to remove"; return; }
      const { error } = await sb.from("class_links").delete().eq("class_id", id); if (error) { li.querySelector("[data-lmsg]").textContent = friendly(error); return; } again(); };
    const cpl = li.querySelector("[data-copylink]"); if (cpl) cpl.onclick = e => copy(D.linkOf(id), e.currentTarget);
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
    <form id="pg" style="margin-top:8px">${groupForm(g)}<div class="row"><button class="btn" type="submit">Save</button><span class="hint" data-out role="status"></span></div></form></section>
    <p class="hint m0">Run a completely separate school or group? <button class="link-btn" type="button" id="add-group">Add another group</button></p>`;
  document.getElementById("add-group").onclick = () => viewNewGroup(true);
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
    <p class="muted m0">This becomes your class page and your teacher dashboard. Gurushishya checks each new teacher before the page goes public.</p>
    <form id="ng">${groupForm()}
      <label for="gf-slug">Web address<input id="gf-slug" required pattern="[a-z0-9][a-z0-9\\-]{1,38}[a-z0-9]" maxlength="40">
      <span class="hint" id="slug-prev"></span></label>
      <label class="check" for="gf-agree"><input id="gf-agree" type="checkbox" required><span>I will keep my students' details private, use Gurushishya only for my own classes, and only add children with a parent's consent.</span></label>
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
