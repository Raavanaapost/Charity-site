/* Riyaz – Stage 1 app: sign in, teacher groups and classes, public group pages, homepage,
   class join link with consent, student practice screen, weekly practice and the teacher's practice chart. */
(() => {
const C = window.ABHYASA_CONFIG || {};
const ARTS = {
  dance:{label:"Dance",dot:"#e0607a"}, flute:{label:"Flute",dot:"#0f7c86"}, violin:{label:"Violin",dot:"#b5651d"},
  piano:{label:"Piano",dot:"#1b2350"}, veena:{label:"Veena",dot:"#8a4fb0"}, mridangam:{label:"Mridangam",dot:"#7a5230"},
  vocal:{label:"Vocal",dot:"#c4651a"}, yoga:{label:"Yoga",dot:"#5a9e4b"}, art:{label:"Art",dot:"#f2a43a"}, other:{label:"Other",dot:"#6a7194"}
};
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
  if (/Failed to fetch|NetworkError/i.test(m)) return "Can't reach Riyaz. Check your internet connection.";
  return m;
}
function safeNext(){ const n = new URLSearchParams(location.search).get("next") || ""; return /^\/[a-z0-9/_-]*$/i.test(n) && !n.startsWith("//") ? n : "/me"; }

/* ---------- start ---------- */
async function loadRoles(){
  roles = { teacher:false, family:false };
  if (!user) return;
  const [g, s] = await Promise.all([
    sb.from("groups").select("id", { count:"exact", head:true }).eq("owner_id", user.id),
    sb.from("students").select("id", { count:"exact", head:true }).eq("guardian_id", user.id)
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
  const a = e.target.closest("a[data-link]");
  if (a && !e.metaKey && !e.ctrlKey) { e.preventDefault(); go(a.getAttribute("href")); }
});

function route(){
  if (!sb) return;
  renderNav(); scrollTo(0,0);
  const p = location.pathname, hs = hostSlug();
  let m;
  if (hs && (p === "/" || p === "")) return viewGroup(hs);
  if ((m = p.match(/^\/g\/([a-z0-9-]+)\/?$/))) return viewGroup(m[1]);
  if ((m = p.match(/^\/join\/([a-z0-9]{4,16})\/?$/i))) return viewJoin(m[1].toLowerCase());
  if (p === "/signin") return viewSignIn();
  if (p === "/me") return redirect(roles.teacher ? "/teacher" : roles.family ? "/practice" : "/teacher");
  if (p === "/teacher") return viewTeacher();
  if (p === "/practice") return viewPractice();
  return viewHome();
}
function renderNav(){
  const items = [];
  if (user) {
    if (roles.family) items.push(link("/practice", "Practice", "btn small ghost"));
    if (roles.teacher || !roles.family) items.push(link("/teacher", "Classes", "btn small ghost"));
    items.push(`<button class="btn small ghost icon" id="signout" type="button" aria-label="Sign out" title="Sign out"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></button>`);
  } else items.push(link("/signin", "Sign in", "btn small ghost"));
  $nav.innerHTML = items.join("");
  const so = document.getElementById("signout");
  if (so) so.onclick = async () => { await sb.auth.signOut(); user = null; roles = { teacher:false, family:false }; onRoot() ? go("/") : location.href = siteUrl("/"); };
}

/* ---------- setup notice (before Supabase is connected) ---------- */
function viewSetup(){
  $app.innerHTML = `<section class="hero"><span class="eyebrow">Almost ready</span><h1>Riyaz needs its database</h1>
  <p class="lead">The site is installed. To switch it on, create the free Supabase project and fill in <strong>config.js</strong>. The steps are in SETUP.md.</p></section>`;
}

/* ---------- homepage ---------- */
async function viewHome(){
  $app.innerHTML = `<section class="hero"><span class="tagline">Learn <i></i> Practise <i></i> Progress</span>
    <h1>A little practice, every day.</h1>
    <svg class="wave" viewBox="0 0 140 18" aria-hidden="true"><path d="M2 12 C 30 0, 50 0, 70 9 S 112 18, 138 4" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>
    <p class="lead">Find a teacher, join their class, and keep up your practice between lessons.</p>
    <div class="row">${link("/teacher","I'm a teacher","btn")}${roles.family ? link("/practice","My practice","btn ghost") : ""}</div></section>
    <section class="card" style="gap:16px"><div class="row between"><h2>Browse classes</h2></div>
    <div class="chips" id="chips" role="group" aria-label="Filter by class type"></div>
    <div class="grid" id="groups">${LOADING}</div></section>`;
  const { data, error } = await sb.from("groups").select("slug,name,art_type,teacher_name,location,is_online").eq("approved", true).order("name");
  const box = document.getElementById("groups"), chips = document.getElementById("chips");
  if (error) { box.innerHTML = `<p class="notice">${esc(friendly(error))}</p>`; return; }
  const used = ["all", ...Object.keys(ARTS).filter(k => data.some(g => g.art_type === k))];
  let pick = "all";
  const draw = () => {
    chips.innerHTML = used.map(k => `<button type="button" class="chip" data-k="${k}" aria-pressed="${k===pick}">${k==="all"?"All":ARTS[k].label}</button>`).join("");
    const list = data.filter(g => pick === "all" || g.art_type === pick);
    box.innerHTML = list.length ? list.map(g => `
      <a class="card" style="text-decoration:none" href="${groupUrl(g.slug)}" ${C.rootDomain ? "" : "data-link"}>
        <span class="row" style="gap:8px"><span class="dot" style="background:${ARTS[g.art_type]?.dot}"></span><span class="eyebrow">${esc(ARTS[g.art_type]?.label)}</span></span>
        <h3>${esc(g.name)}</h3>
        <span class="muted">${esc(g.teacher_name)} · ${g.is_online ? "Online" : ""}${g.is_online && g.location ? " and " : ""}${esc(g.location || "")}</span>
      </a>`).join("")
      : `<div class="empty">No classes listed yet. Teachers can create their group page in a few minutes.</div>`;
    chips.querySelectorAll(".chip").forEach(b => b.onclick = () => { pick = b.dataset.k; draw(); });
  };
  draw();
}

/* ---------- public group page ---------- */
async function viewGroup(slug){
  $app.innerHTML = LOADING;
  const { data: g } = await sb.from("groups").select("*").eq("slug", slug).maybeSingle();
  if (!g) { $app.innerHTML = `<section class="hero"><h1>Page not found</h1><p class="lead">This class page isn't available. It may not be approved yet.</p>${link("/","See all classes","btn ghost")}</section>`; return; }
  document.title = g.name + " · Riyaz";
  const { data: classes } = await sb.from("classes").select("name,day_of_week,start_time,duration_min").eq("group_id", g.id).order("day_of_week").order("start_time");
  const mine = user && user.id === g.owner_id;
  $app.innerHTML = `
    ${!g.approved && mine ? `<p class="notice">Only you can see this page for now. It goes public once Riyaz approves it.</p>` : ""}
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

/* ---------- sign in by email link ---------- */
function emailForm(id, redirectPath, button = "Email me a link"){
  return { html: `<form id="${id}"><label for="${id}-email">Email<input id="${id}-email" type="email" required autocomplete="email"></label>
      <button class="btn" type="submit">${button}</button><div id="${id}-out" role="status"></div></form>`,
    wire(){
      document.getElementById(id).onsubmit = async e => {
        e.preventDefault(); const b = e.target.querySelector("button"), out = document.getElementById(id + "-out"); b.disabled = true;
        const { error } = await sb.auth.signInWithOtp({ email: val(id + "-email"), options: { emailRedirectTo: siteUrl(redirectPath) } });
        b.disabled = false;
        out.innerHTML = error ? `<div class="notice">${esc(friendly(error))}</div>`
          : `<div class="notice ok">Check your email and tap the link to continue. It may be in your spam folder.</div>`;
      };
    } };
}
function viewSignIn(){
  const next = safeNext();
  if (user) return redirect(next);
  const f = emailForm("si", next);
  $app.innerHTML = `<section class="card narrow">
    <h1 style="font-size:1.7rem">Sign in</h1><p class="muted" style="margin:0">We'll email you a sign-in link. No password needed.</p>${f.html}</section>`;
  f.wire();
}

/* ---------- join a class by link ---------- */
async function viewJoin(code){
  if (!onRoot()) { location.href = siteUrl("/join/" + code); return; }
  $app.innerHTML = LOADING;
  const { data } = await sb.rpc("class_by_code", { code });
  const k = data && data[0];
  if (!k) { $app.innerHTML = `<section class="card narrow"><h1 style="font-size:1.6rem">This class link isn't working</h1>
    <p class="muted" style="margin:0">Please ask your teacher for a new link.</p>${link("/","Go to Riyaz","btn ghost")}</section>`; return; }
  const head = `<span class="eyebrow">Join a class</span><h1 style="font-size:1.7rem">${esc(k.class_name)}</h1>
    <p class="muted" style="margin:0">${esc(k.group_name)} with ${esc(k.teacher_name)} · ${DAYS[k.day_of_week]}s at ${fmtTime(k.start_time)}</p>`;
  if (!user) {
    const f = emailForm("jn", "/join/" + code, "Continue");
    $app.innerHTML = `<section class="card narrow">${head}
      <p style="margin:0">First, confirm your email. We'll send you a link. No password needed.</p>${f.html}
      <p class="hint" style="margin:0">Parents: use your own email, not your child's.</p></section>`;
    f.wire(); return;
  }
  $app.innerHTML = `<section class="card narrow">${head}
    <form id="jf">
      <fieldset class="choice"><legend>Who is joining?</legend>
        <label class="check" for="jf-child"><input type="radio" name="who" id="jf-child" value="child" checked>My child</label>
        <label class="check" for="jf-adult"><input type="radio" name="who" id="jf-adult" value="adult">Myself</label>
      </fieldset>
      <label for="jf-name"><span id="jf-name-label">Child's first name</span><input id="jf-name" required maxlength="40" autocomplete="off">
        <span class="hint">First name only. We don't ask for age, school or address.</span></label>
      <label class="check" for="jf-consent"><input id="jf-consent" type="checkbox" required><span id="jf-consent-text"></span></label>
      <button class="btn" type="submit">Join class</button><div id="jf-out" role="status"></div>
    </form></section>`;
  const setWho = () => {
    const adult = document.getElementById("jf-adult").checked;
    document.getElementById("jf-name-label").textContent = adult ? "Your first name" : "Child's first name";
    document.getElementById("jf-consent-text").textContent = adult
      ? "I agree to Riyaz keeping my first name and practice ticks. Only I and this teacher can see them."
      : "I'm this child's parent or guardian. I agree to Riyaz keeping their first name and practice ticks. Only our family and this teacher can see them.";
  };
  document.querySelectorAll('input[name="who"]').forEach(r => r.onchange = setWho); setWho();
  document.getElementById("jf").onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector("button[type=submit]"), out = document.getElementById("jf-out"); b.disabled = true;
    const adult = document.getElementById("jf-adult").checked, name = val("jf-name");
    const { error } = await sb.rpc("join_class", { code, first_name: name, adult, consent: document.getElementById("jf-consent").checked });
    b.disabled = false;
    if (error) { out.innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    roles.family = true; renderNav();
    $app.innerHTML = `<section class="card narrow"><span class="eyebrow">Joined</span>
      <h1 style="font-size:1.7rem">${esc(name)} is in ${esc(k.class_name)}</h1>
      <p class="muted" style="margin:0">Each day, open Riyaz, start the timer and tick the day. ${esc(k.teacher_name)} will see the ticks.</p>
      <div class="row">${link("/practice","Go to practice","btn")}${adult ? "" : link("/join/" + code,"Add another child","btn ghost")}</div>
      <p class="hint" style="margin:0">Tip: add Riyaz to your home screen so it opens like an app.</p></section>`;
  };
}

/* ---------- family: practice screen ---------- */
const timers = {};
let wake = null;
async function keepAwake(){ try { wake = await navigator.wakeLock?.request("screen"); } catch(e){} }
function chime(){ try { const a = new (window.AudioContext||window.webkitAudioContext)(); [0,.25,.5].forEach((o,i)=>{ const g=a.createGain(), s=a.createOscillator(); s.frequency.value=[660,880,990][i]; s.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.2,a.currentTime+o); g.gain.exponentialRampToValueAtTime(.001,a.currentTime+o+.6); s.start(a.currentTime+o); s.stop(a.currentTime+o+.6); }); } catch(e){} }
function streak(done, classDay){
  let d = today0(), n = 0;
  if (!done.has(ymd(d))) d = addDays(d, -1);
  for (let i = 0; i < 70; i++) {
    if (d.getDay() === classDay) { d = addDays(d, -1); continue; }
    if (!done.has(ymd(d))) break;
    n++; d = addDays(d, -1);
  }
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
  const d = addDays(today0(), diff);
  return (diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : shortDate(d)) + ", " + fmtTime(k.start_time);
}
const FLAME = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/></svg>`;

async function viewPractice(){
  if (!onRoot()) { location.href = siteUrl("/practice"); return; }
  if (!user) return go("/signin?next=/practice");
  $app.innerHTML = LOADING;
  const { data: kids, error } = await sb.from("students")
    .select("id,first_name,is_adult,class_id,classes(id,name,day_of_week,start_time,duration_min,groups(name,teacher_name))")
    .eq("guardian_id", user.id).order("created_at");
  if (error) { $app.innerHTML = `<p class="notice">${esc(friendly(error))}</p>`; return; }
  const ready = (kids || []).filter(k => k.classes);
  if (!ready.length) { $app.innerHTML = `<section class="card narrow"><h1 style="font-size:1.6rem">No classes yet</h1>
    <p class="muted" style="margin:0">Ask your teacher for their Riyaz class link, then open it to join.</p></section>`; return; }
  const classIds = [...new Set(ready.map(k => k.class_id))], ids = ready.map(k => k.id);
  const [tasks, links, logs] = await Promise.all([
    sb.from("practice_tasks").select("*").in("class_id", classIds).lte("week_start", ymd(today0())).order("week_start", { ascending:false }),
    sb.from("class_links").select("*").in("class_id", classIds),
    sb.from("practice_logs").select("student_id,day").in("student_id", ids).gte("day", ymd(addDays(today0(), -75)))
  ]);
  const done = {}; ready.forEach(k => done[k.id] = new Set());
  (logs.data || []).forEach(l => done[l.student_id]?.add(l.day));
  $app.innerHTML = `<section><span class="eyebrow">${today0().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})}</span>
    <h1 style="font-size:1.8rem">My practice</h1></section><div class="stack" id="kids"></div>`;
  const box = document.getElementById("kids");
  ready.forEach(kid => {
    const el = document.createElement("section"); el.className = "card"; box.appendChild(el);
    const task = (tasks.data || []).find(t => t.class_id === kid.class_id);
    const url = (links.data || []).find(l => l.class_id === kid.class_id)?.meeting_url;
    renderKid(el, kid, done[kid.id], task, url);
  });
}

function renderKid(el, kid, done, task, url, note = ""){
  const k = kid.classes, g = k.groups || {}, t0 = today0(), todayKey = ymd(t0);
  const days = Array.from({ length:7 }, (_, i) => addDays(weekStartFor(k.day_of_week), i));
  const count = days.slice(1).filter(d => done.has(ymd(d))).length;
  const doneToday = done.has(todayKey), mins = task?.minutes || 10;
  const tm = timers[kid.id], total = mins * 60, left = tm ? tm.left : total, st = streak(done, k.day_of_week);
  const again = (msg = "") => renderKid(el, kid, done, task, url, msg);
  el.innerHTML = `
    <div class="row between"><div style="min-width:0"><h2>${esc(kid.first_name)}</h2>
      <span class="muted">${esc(k.name)} · ${esc(g.name)} with ${esc(g.teacher_name)}</span></div>
      ${st ? `<span class="pill streak">${FLAME}${st}-day streak</span>` : ""}</div>
    <div class="task">
      <span class="eyebrow light">This week's practice · ${mins} min a day</span>
      <p class="task-title">${task ? esc(task.title) : "Practise what you learned in class. Your teacher will add this week's task soon."}</p>
      ${task?.demo_url ? `<a class="demo" href="${esc(task.demo_url)}" target="_blank" rel="noopener">Watch the demo</a>` : ""}
      <div class="timer"><span class="clock" id="clk-${kid.id}">${mmss(left)}</span>
        <div class="row"><button class="btn" type="button" data-a="start">${tm?.int ? "Pause" : tm ? "Resume" : `Start ${mins} min`}</button>
        ${tm ? `<button class="btn ghost light" type="button" data-a="reset">Reset</button>` : ""}</div></div>
      <div class="bar" aria-hidden="true"><i id="bar-${kid.id}" style="width:${(1 - left/total) * 100}%"></i></div>
    </div>
    <button class="btn big ${doneToday ? "done" : "dark"}" type="button" data-a="today" aria-pressed="${doneToday}">${doneToday ? "Done today ✓" : "I practised today"}</button>
    <div>
      <div class="row between"><strong>This week</strong><span class="count">${count} of 6 days</span></div>
      <div class="week">${days.map((d, i) => {
        const key = ymd(d), on = done.has(key);
        if (i === 0) return `<div class="day class"><span>${SHORT[d.getDay()]}</span><b>${d.getDate()}</b><small>Class${on ? " ✓" : ""}</small></div>`;
        return `<button type="button" class="day${on ? " done" : ""}${+d === +t0 ? " today" : ""}" data-day="${key}" ${d > t0 ? "disabled" : ""} aria-pressed="${on}"
          aria-label="${DAYS[d.getDay()]} ${d.getDate()}${on ? ", practised" : ""}"><span>${SHORT[d.getDay()]}</span><b>${d.getDate()}</b><small>${on ? "✓" : ""}</small></button>`;
      }).join("")}</div>
      <p class="hint" style="margin:6px 0 0">Forgot to tick? Tap the day.</p>
    </div>
    ${url && classOpenNow(k) ? `<a class="btn big teal" href="${esc(url)}" target="_blank" rel="noopener">Join online class now</a>`
      : `<p class="muted" style="margin:0">Next class: ${nextClassText(k)}${url ? ". The Join button appears here 10 minutes before." : ""}</p>`}
    <div class="out" role="status">${note ? `<div class="notice ok">${esc(note)}</div>` : ""}</div>`;

  const out = el.querySelector(".out");
  const setDay = async (key, on) => {
    const r = on
      ? await sb.from("practice_logs").upsert({ student_id: kid.id, day: key, minutes: mins }, { onConflict:"student_id,day", ignoreDuplicates:true })
      : await sb.from("practice_logs").delete().eq("student_id", kid.id).eq("day", key);
    if (r.error) { out.innerHTML = `<div class="notice">${esc(friendly(r.error))}</div>`; return false; }
    on ? done.add(key) : done.delete(key); return true;
  };
  el.querySelector('[data-a="today"]').onclick = async () => { if (await setDay(todayKey, !doneToday)) again(); };
  el.querySelectorAll("[data-day]").forEach(b => b.onclick = async () => { const key = b.dataset.day; if (await setDay(key, !done.has(key))) again(); });
  el.querySelector('[data-a="start"]').onclick = () => {
    const t = timers[kid.id] || (timers[kid.id] = { left: total, int: null, endAt: 0 });
    if (t.int) { clearInterval(t.int); t.int = null; t.left = Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000)); return again(); }
    keepAwake(); t.endAt = Date.now() + t.left * 1000;
    t.int = setInterval(async () => {
      t.left = Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000));
      const c = document.getElementById("clk-" + kid.id), b = document.getElementById("bar-" + kid.id);
      if (c) c.textContent = mmss(t.left);
      if (b) b.style.width = (1 - t.left/total) * 100 + "%";
      if (t.left <= 0) {
        clearInterval(t.int); delete timers[kid.id]; chime(); try { wake?.release(); } catch(e){}
        const ok = await setDay(ymd(today0()), true);
        if (ok) again(`Well done, ${kid.first_name}! Today is ticked.`);
      }
    }, 500);
    again();
  };
  const r = el.querySelector('[data-a="reset"]');
  if (r) r.onclick = () => { const t = timers[kid.id]; if (t) { clearInterval(t.int); delete timers[kid.id]; } again(); };
}

/* ---------- teacher area ---------- */
async function viewTeacher(){
  if (!onRoot()) { location.href = siteUrl("/teacher"); return; }
  if (!user) return go("/signin?next=/teacher");
  $app.innerHTML = LOADING;
  const { data: groups, error } = await sb.from("groups").select("*").eq("owner_id", user.id).order("created_at");
  if (error) { $app.innerHTML = `<p class="notice">${esc(friendly(error))}</p>`; return; }
  if (!groups.length) return viewNewGroup();
  $app.innerHTML = `<section class="row between"><div><span class="eyebrow">My classes</span><h1 style="font-size:1.8rem">Teacher dashboard</h1></div>
    <button class="btn ghost small" id="add-group" type="button">Add another group</button></section><div id="groups" class="stack"></div>`;
  document.getElementById("add-group").onclick = () => viewNewGroup(true);
  const box = document.getElementById("groups");
  for (const g of groups) { const el = document.createElement("section"); el.className = "stack"; box.appendChild(el); await renderGroupAdmin(el, g); }
}

function groupForm(g = {}){
  return `
    <div class="two"><label for="gf-name">Group name<input id="gf-name" required minlength="2" maxlength="80" value="${esc(g.name)}" placeholder="Priya's Bharatanatyam School"></label>
    <label for="gf-teacher">Teacher name shown on the page<input id="gf-teacher" required maxlength="80" value="${esc(g.teacher_name)}"></label></div>
    <div class="two"><label for="gf-art">Type of class<select id="gf-art">${Object.entries(ARTS).map(([k,a]) => `<option value="${k}" ${g.art_type===k?"selected":""}>${a.label}</option>`).join("")}</select></label>
    <label for="gf-loc">Area<input id="gf-loc" maxlength="120" value="${esc(g.location)}" placeholder="Scarborough, ON"></label></div>
    <label class="check" for="gf-online"><input id="gf-online" type="checkbox" ${g.is_online?"checked":""}>Classes are offered online</label>
    <label for="gf-bio">About the group<textarea id="gf-bio" maxlength="1500" placeholder="Your training, style, and who the classes are for.">${esc(g.bio)}</textarea></label>`;
}
const groupValues = () => ({ name: val("gf-name"), teacher_name: val("gf-teacher"), art_type: val("gf-art"), location: val("gf-loc") || null, is_online: document.getElementById("gf-online").checked, bio: val("gf-bio") || null });

function viewNewGroup(more = false){
  $app.innerHTML = `<section class="card narrow wide">
    <span class="eyebrow">${more ? "New group" : "Welcome"}</span><h1 style="font-size:1.7rem">Create your group page</h1>
    <p class="muted" style="margin:0">This becomes your class page. Riyaz checks each new teacher before the page goes public.</p>
    <form id="ng">${groupForm()}
      <label for="gf-slug">Web address<input id="gf-slug" required pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" maxlength="40">
      <span class="hint" id="slug-prev"></span></label>
      <div class="row"><button class="btn" type="submit">Create page</button>${more ? link("/teacher","Cancel","btn ghost") : ""}</div>
      <div id="ng-out" role="status"></div></form></section>`;
  const name = document.getElementById("gf-name"), slug = document.getElementById("gf-slug"), prev = document.getElementById("slug-prev");
  let touched = false;
  const show = () => prev.textContent = "Your page: " + bare(groupUrl(slug.value || "your-name"));
  name.oninput = () => { if (!touched) slug.value = slugify(name.value); show(); };
  slug.oninput = () => { touched = true; slug.value = slugify(slug.value); show(); };
  show();
  document.getElementById("ng").onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector("button[type=submit]"); b.disabled = true;
    const { error } = await sb.from("groups").insert({ ...groupValues(), slug: slug.value, owner_id: user.id });
    b.disabled = false;
    if (error) { document.getElementById("ng-out").innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    roles.teacher = true; go("/teacher");
  };
}

function needsNudge(s, ds, classDay){
  if (new Date(s.created_at) > addDays(today0(), -3)) return false;   // joined in the last 3 days
  let d = today0(), checked = 0;
  while (checked < 3) { if (d.getDay() !== classDay) { if (ds.has(ymd(d))) return false; checked++; } d = addDays(d, -1); }
  return true;
}

function classAdmin(k, g, ctx){
  const t0 = today0(), ws = weekStartFor(k.day_of_week), wsKey = ymd(ws);
  const cur = ctx.tasks.find(t => t.class_id === k.id && t.week_start === wsKey);
  const last = ctx.tasks.find(t => t.class_id === k.id);
  const kids = ctx.studs.filter(s => s.class_id === k.id);
  const classToday = t0.getDay() === k.day_of_week, cs = classToday ? addDays(ws, -7) : ws;
  const days = Array.from({ length:6 }, (_, i) => addDays(cs, i + 1));
  const doneBy = sid => new Set(ctx.logs.filter(l => l.student_id === sid).map(l => l.day));
  const joinUrl = siteUrl("/join/" + k.join_code);
  const rows = kids.map(s => { const ds = doneBy(s.id); return { s, ds, n: days.filter(d => ds.has(ymd(d))).length, nudge: needsNudge(s, ds, k.day_of_week) }; });
  const practisedToday = rows.filter(r => r.ds.has(ymd(t0))).length, nudges = rows.filter(r => r.nudge).length;
  const strong = rows.filter(r => r.n >= 4).length;
  const shareTask = cur ? wa(`This week's practice for ${k.name}: ${cur.title}. ${cur.minutes} min a day.\nTick it on Riyaz: ${siteUrl("/practice")}`) : "";
  return `
  <li class="class-item" data-id="${k.id}">
    <div class="row between"><h3>${esc(k.name)}</h3><span class="muted">${DAYS[k.day_of_week]}s · ${fmtTime(k.start_time)} · ${k.duration_min} min</span></div>

    <div class="sub"><div class="row between"><strong>${classToday ? "How last week went" : "Who practised this week"}</strong><span class="hint">${classToday ? `${shortDate(addDays(cs,1))} to ${shortDate(addDays(cs,6))}` : `since ${shortDate(ws)} class`}</span></div>
      ${rows.length ? `<div class="scroll"><table class="chart"><thead><tr><th>Student</th>${days.map(d => `<th scope="col">${SHORT[d.getDay()].slice(0,2)}</th>`).join("")}<th>Days</th></tr></thead><tbody>
        ${rows.map(r => `<tr><td><span class="who">${esc(r.s.first_name)}</span>${r.s.is_adult ? ` <span class="hint">adult</span>` : ""}${r.nudge ? `<br><span class="pill wait">Needs a nudge</span>` : ""}</td>
          ${days.map(d => { const key = ymd(d), on = r.ds.has(key); return `<td><span class="sq${on ? " on" : d > t0 ? " fut" : ""}" role="img" aria-label="${DAYS[d.getDay()]}: ${on ? "practised" : d > t0 ? "not yet" : "no practice"}"></span></td>`; }).join("")}
          <td class="num">${r.n}</td></tr>`).join("")}
      </tbody></table></div>
      <p class="hint" style="margin:0">${classToday ? `${strong} of ${rows.length} practised on 4 or more days` : `${practisedToday} of ${rows.length} practised today`}${nudges ? ` · ${nudges} need${nudges === 1 ? "s" : ""} a nudge (nothing in 3 days)` : ""}.</p>`
      : `<div class="empty">No students yet. Share the join link below with your class.</div>`}
    </div>

    <div class="sub"><strong>This week's practice</strong>
      <form data-f="task">
        <label for="pt-title-${k.id}">What to practise<input id="pt-title-${k.id}" required maxlength="200" value="${esc(cur?.title || "")}" placeholder="${esc(last?.title || "e.g. Tatta adavu 1 to 4, slow then medium speed")}"></label>
        <div class="two"><label for="pt-min-${k.id}">Minutes a day<input id="pt-min-${k.id}" type="number" min="1" max="180" required value="${cur?.minutes || last?.minutes || 10}"></label>
          <label for="pt-demo-${k.id}">Demo video link (optional)<input id="pt-demo-${k.id}" type="url" pattern="https://.*" value="${esc(cur?.demo_url || "")}" placeholder="https://youtu.be/…"></label></div>
        <div class="row"><button class="btn small" type="submit">${cur ? "Update practice" : "Set practice"}</button>
          ${cur && g.approved ? `<a class="btn small wa" target="_blank" rel="noopener" href="${shareTask}">Share on WhatsApp</a>` : ""}
          <span class="muted" data-out role="status"></span></div>
      </form></div>

    <div class="sub"><strong>Join link for families</strong>
      ${g.approved ? `<div class="code">${esc(bare(joinUrl))}</div>
        <div class="row"><button class="btn small ghost" type="button" data-copy="${esc(joinUrl)}">Copy link</button>
          <a class="btn small wa" target="_blank" rel="noopener" href="${wa(`Join ${k.name} (${g.name}) on Riyaz to tick your daily practice:\n${joinUrl}`)}">Share on WhatsApp</a></div>
        <p class="hint" style="margin:0">Parents join with their child's first name and give consent. Adults can join for themselves.</p>`
      : `<p class="hint" style="margin:0">Your join link appears here once your page is approved.</p>`}
    </div>

    <details class="sub"><summary>Class settings</summary>
      <form data-f="link" class="row" style="flex-wrap:nowrap;margin-top:10px"><label class="hint" style="flex:1;min-width:0" for="ml-${k.id}">Zoom or Meet link (only your students see it)
        <input id="ml-${k.id}" type="url" pattern="https://.*" placeholder="https://zoom.us/j/…" value="${esc(ctx.linkOf(k.id))}"></label>
        <button class="btn small ghost" type="submit" style="align-self:flex-end">Save</button></form>
      <div class="row" style="margin-top:10px"><button class="btn small ghost" type="button" data-del>Remove class</button><span class="muted" data-msg role="status"></span></div>
    </details>
  </li>`;
}

async function renderGroupAdmin(el, g){
  const { data: classes } = await sb.from("classes").select("*").eq("group_id", g.id).order("day_of_week").order("start_time");
  const cids = (classes || []).map(k => k.id);
  const none = { data: [] };
  const [links, enq, studs, tasks] = await Promise.all([
    cids.length ? sb.from("class_links").select("*").in("class_id", cids) : none,
    sb.from("enquiries").select("*").eq("group_id", g.id).order("created_at", { ascending:false }),
    cids.length ? sb.from("students").select("id,first_name,is_adult,class_id,created_at").in("class_id", cids).order("first_name") : none,
    cids.length ? sb.from("practice_tasks").select("*").in("class_id", cids).lte("week_start", ymd(today0())).order("week_start", { ascending:false }) : none
  ]);
  const sids = (studs.data || []).map(s => s.id);
  const logs = sids.length ? await sb.from("practice_logs").select("student_id,day").in("student_id", sids).gte("day", ymd(addDays(today0(), -10))) : none;
  const ctx = { tasks: tasks.data || [], studs: studs.data || [], logs: logs.data || [], linkOf: id => (links.data || []).find(l => l.class_id === id)?.meeting_url || "" };
  const page = groupUrl(g.slug), enquiries = enq.data || [];
  el.innerHTML = `
    <div class="card"><div class="row between"><div><h2>${esc(g.name)}</h2><span class="muted">${esc(ARTS[g.art_type]?.label)} · ${esc(g.teacher_name)}</span></div>
      ${g.approved ? `<span class="pill ok">Public</span>` : `<span class="pill wait">Waiting for approval</span>`}</div>
      <div class="code">${esc(bare(page))}</div>
      <div class="row"><a class="btn small ghost" href="${page}" ${C.rootDomain ? "" : "data-link"}>View page</a>
        <button class="btn small ghost" type="button" data-copy="${esc(page)}">Copy link</button>
        ${g.approved ? `<a class="btn small wa" target="_blank" rel="noopener" href="${wa(g.name + "\n" + page)}">Share on WhatsApp</a>` : ""}</div>
      <details><summary>Edit page details</summary>
        <form data-f="edit" style="margin-top:12px">${groupForm(g)}<div class="row"><button class="btn" type="submit">Save</button><span class="muted" data-out role="status"></span></div></form></details>
    </div>
    <div class="card"><h2>Classes</h2>
      ${classes.length ? `<ul class="list">${classes.map(k => classAdmin(k, g, ctx)).join("")}</ul>` : `<div class="empty">No classes yet. Add your first one below.</div>`}
      <details ${classes.length ? "" : "open"}><summary>Add a class</summary>
        <form data-f="class" style="margin-top:12px">
          <label for="nc-name-${g.id}">Class name<input id="nc-name-${g.id}" required minlength="2" maxlength="80" placeholder="Beginners"></label>
          <div class="two"><label for="nc-day-${g.id}">Day<select id="nc-day-${g.id}">${DAYS.map((d,i) => `<option value="${i}" ${i===6?"selected":""}>${d}</option>`).join("")}</select></label>
            <label for="nc-time-${g.id}">Start time<input id="nc-time-${g.id}" type="time" required value="10:00"></label>
            <label for="nc-len-${g.id}">Length (minutes)<input id="nc-len-${g.id}" type="number" min="10" max="300" value="60" required></label></div>
          <label for="nc-url-${g.id}">Zoom or Meet link (optional)<input id="nc-url-${g.id}" type="url" pattern="https://.*" placeholder="https://zoom.us/j/…"></label>
          <div class="row"><button class="btn" type="submit">Add class</button><span class="muted" data-out role="status"></span></div></form></details>
    </div>
    <div class="card"><h2>Enquiries</h2>
      ${enquiries.length ? `<ul class="list">${enquiries.map(q => `<li class="class-item"><div class="row between"><strong>${esc(q.name)}</strong><span class="muted">${new Date(q.created_at).toLocaleDateString()}</span></div>
        <span class="code">${esc(q.contact)}</span>${q.message ? `<span style="white-space:pre-line">${esc(q.message)}</span>` : ""}</li>`).join("")}</ul>`
        : `<div class="empty">No enquiries yet. They appear here when someone writes from your page.</div>`}
    </div>`;

  const refresh = () => renderGroupAdmin(el, g);
  el.querySelectorAll("[data-copy]").forEach(b => b.onclick = () => copy(b.dataset.copy, b));
  el.querySelector('[data-f="edit"]').onsubmit = async e => {
    e.preventDefault(); const out = e.target.querySelector("[data-out]");
    const { data, error } = await sb.from("groups").update(groupValues()).eq("id", g.id).select().single();
    if (error) { out.textContent = friendly(error); return; }
    Object.assign(g, data); refresh();
  };
  el.querySelector('[data-f="class"]').onsubmit = async e => {
    e.preventDefault(); const out = e.target.querySelector("[data-out]"), b = e.target.querySelector("button"); b.disabled = true;
    const v = id => document.getElementById(id + "-" + g.id).value.trim();
    const { data: k, error } = await sb.from("classes").insert({ group_id: g.id, name: v("nc-name"), day_of_week: +v("nc-day"), start_time: v("nc-time"), duration_min: +v("nc-len") }).select().single();
    if (!error && v("nc-url")) { const r = await sb.from("class_links").upsert({ class_id: k.id, meeting_url: v("nc-url") }); if (r.error) { b.disabled = false; out.textContent = friendly(r.error); return; } }
    b.disabled = false;
    if (error) { out.textContent = friendly(error); return; }
    refresh();
  };
  el.querySelectorAll(".class-item[data-id]").forEach(li => {
    const id = li.dataset.id, k = classes.find(c => c.id === id);
    li.querySelector('[data-f="task"]').onsubmit = async e => {
      e.preventDefault(); const out = e.target.querySelector("[data-out]"), b = e.target.querySelector("button"); b.disabled = true;
      const demo = val("pt-demo-" + id);
      const { error } = await sb.from("practice_tasks").upsert({ class_id: id, week_start: ymd(weekStartFor(k.day_of_week)), title: val("pt-title-" + id), minutes: +val("pt-min-" + id), demo_url: demo || null }, { onConflict:"class_id,week_start" });
      b.disabled = false;
      if (error) { out.textContent = friendly(error); return; }
      refresh();
    };
    li.querySelector('[data-f="link"]').onsubmit = async e => {
      e.preventDefault(); const url = e.target.querySelector("input").value.trim(), msg = li.querySelector("[data-msg]");
      const r = url ? await sb.from("class_links").upsert({ class_id: id, meeting_url: url }) : await sb.from("class_links").delete().eq("class_id", id);
      msg.textContent = r.error ? friendly(r.error) : "Link saved.";
    };
    const del = li.querySelector("[data-del]");
    del.onclick = async () => {
      if (!del.dataset.sure) { del.dataset.sure = "1"; del.textContent = "Tap again to remove this class and its practice record"; return; }
      const { error } = await sb.from("classes").delete().eq("id", id);
      if (error) { li.querySelector("[data-msg]").textContent = friendly(error); return; }
      refresh();
    };
  });
}

init();
})();
