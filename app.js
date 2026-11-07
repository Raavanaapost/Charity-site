/* Riyaz – Stage 1 app (steps 1–3: sign in, teacher groups and classes, public group pages, homepage) */
(() => {
const C = window.ABHYASA_CONFIG || {};
const ARTS = {
  dance:{label:"Dance",dot:"#e0607a"}, flute:{label:"Flute",dot:"#0f7c86"}, violin:{label:"Violin",dot:"#b5651d"},
  piano:{label:"Piano",dot:"#1b2350"}, veena:{label:"Veena",dot:"#8a4fb0"}, mridangam:{label:"Mridangam",dot:"#7a5230"},
  vocal:{label:"Vocal",dot:"#c4651a"}, yoga:{label:"Yoga",dot:"#5a9e4b"}, art:{label:"Art",dot:"#f2a43a"}, other:{label:"Other",dot:"#6a7194"}
};
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const $app = document.getElementById("app"), $nav = document.getElementById("topnav");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let sb = null, user = null;

/* ---------- addresses ---------- */
function hostSlug(){
  const root = (C.rootDomain || "").toLowerCase(), h = location.hostname.toLowerCase();
  if (!root || h === root || h === "www." + root || !h.endsWith("." + root)) return null;
  return h.slice(0, -(root.length + 1));
}
const onRoot = () => !hostSlug();
const siteUrl = p => (C.rootDomain ? "https://" + C.rootDomain : location.origin) + p;
const groupUrl = slug => C.rootDomain ? `https://${slug}.${C.rootDomain}` : `${location.origin}/g/${slug}`;
const link = (p, text, cls = "") => onRoot()
  ? `<a href="${p}" data-link class="${cls}">${text}</a>` : `<a href="${siteUrl(p)}" class="${cls}">${text}</a>`;
function go(p){ history.pushState(null, "", p); route(); }
function fmtTime(t){ if(!t) return ""; const [h,m] = t.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; return `${((h+11)%12)+1}:${String(m).padStart(2,"0")} ${ap}`; }
function slugify(s){ return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40); }
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

/* ---------- start ---------- */
async function init(){
  if (!C.supabaseUrl || !C.supabaseAnonKey || !window.supabase) return viewSetup();
  sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey);
  const { data } = await sb.auth.getSession();
  user = data.session?.user || null;
  sb.auth.onAuthStateChange((_e, s) => { const was = user?.id; user = s?.user || null; if (was !== user?.id) route(); });
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
  const p = location.pathname, hs = hostSlug(), m = p.match(/^\/g\/([a-z0-9-]+)\/?$/);
  if (hs && (p === "/" || p === "")) return viewGroup(hs);
  if (m) return viewGroup(m[1]);
  if (p === "/signin") return viewSignIn();
  if (p === "/teacher") return viewTeacher();
  return viewHome();
}
function renderNav(){
  $nav.innerHTML = user
    ? `${link("/teacher","My classes","btn small ghost")}<button class="btn small ghost" id="signout" type="button">Sign out</button>`
    : link("/signin","Sign in","btn small ghost");
  const so = document.getElementById("signout");
  if (so) so.onclick = async () => { await sb.auth.signOut(); user = null; onRoot() ? go("/") : location.href = siteUrl("/"); };
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
    <div class="row">${link("/teacher","I'm a teacher","btn")}</div></section>
    <section class="card" style="gap:16px"><div class="row between"><h2>Browse classes</h2></div>
    <div class="chips" id="chips" role="group" aria-label="Filter by class type"></div>
    <div class="grid" id="groups"><p class="muted">Loading…</p></div></section>`;
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
  $app.innerHTML = `<p class="muted">Loading…</p>`;
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
const val = id => document.getElementById(id).value.trim();

/* ---------- sign in by email link ---------- */
function viewSignIn(){
  if (user) return go("/teacher");
  $app.innerHTML = `<section class="card" style="max-width:460px;width:100%;margin:0 auto">
    <h1 style="font-size:1.7rem">Sign in</h1><p class="muted" style="margin:0">We'll email you a sign-in link. No password needed.</p>
    <form id="si"><label for="si-email">Email<input id="si-email" type="email" required autocomplete="email"></label>
    <button class="btn" type="submit">Email me a link</button><div id="si-out" role="status"></div></form></section>`;
  document.getElementById("si").onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector("button"), out = document.getElementById("si-out"); b.disabled = true;
    const { error } = await sb.auth.signInWithOtp({ email: val("si-email"), options: { emailRedirectTo: siteUrl("/teacher") } });
    b.disabled = false;
    out.innerHTML = error ? `<div class="notice">${esc(friendly(error))}</div>` : `<div class="notice ok">Check your email and tap the link to sign in. You can close this page.</div>`;
  };
}

/* ---------- teacher area ---------- */
async function viewTeacher(){
  if (!onRoot()) { location.href = siteUrl("/teacher"); return; }
  if (!user) return go("/signin");
  $app.innerHTML = `<p class="muted">Loading…</p>`;
  const { data: groups, error } = await sb.from("groups").select("*").eq("owner_id", user.id).order("created_at");
  if (error) { $app.innerHTML = `<p class="notice">${esc(friendly(error))}</p>`; return; }
  if (!groups.length) return viewNewGroup();
  $app.innerHTML = `<section class="row between"><div><span class="eyebrow">My classes</span><h1 style="font-size:1.8rem">Teacher dashboard</h1></div>
    <button class="btn ghost small" id="add-group" type="button">Add another group</button></section><div id="groups" style="display:flex;flex-direction:column;gap:24px"></div>`;
  document.getElementById("add-group").onclick = () => viewNewGroup(true);
  const box = document.getElementById("groups");
  for (const g of groups) { const el = document.createElement("section"); el.style.cssText = "display:flex;flex-direction:column;gap:16px"; box.appendChild(el); await renderGroupAdmin(el, g); }
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
  $app.innerHTML = `<section class="card" style="max-width:640px;width:100%;margin:0 auto">
    <span class="eyebrow">${more ? "New group" : "Welcome"}</span><h1 style="font-size:1.7rem">Create your group page</h1>
    <p class="muted" style="margin:0">This becomes your class page. Riyaz checks each new teacher before the page goes public.</p>
    <form id="ng">${groupForm()}
      <label for="gf-slug">Web address<input id="gf-slug" required pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" maxlength="40">
      <span class="hint" id="slug-prev"></span></label>
      <div class="row"><button class="btn" type="submit">Create page</button>${more ? link("/teacher","Cancel","btn ghost") : ""}</div>
      <div id="ng-out" role="status"></div></form></section>`;
  const name = document.getElementById("gf-name"), slug = document.getElementById("gf-slug"), prev = document.getElementById("slug-prev");
  let touched = false;
  const show = () => prev.textContent = "Your page: " + groupUrl(slug.value || "your-name").replace(/^https?:\/\//, "");
  name.oninput = () => { if (!touched) slug.value = slugify(name.value); show(); };
  slug.oninput = () => { touched = true; slug.value = slugify(slug.value); show(); };
  show();
  document.getElementById("ng").onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector("button[type=submit]"); b.disabled = true;
    const { error } = await sb.from("groups").insert({ ...groupValues(), slug: slug.value, owner_id: user.id });
    b.disabled = false;
    if (error) { document.getElementById("ng-out").innerHTML = `<div class="notice">${esc(friendly(error))}</div>`; return; }
    go("/teacher");
  };
}

async function renderGroupAdmin(el, g){
  const [{ data: classes }, { data: links }, { data: enq }] = await Promise.all([
    sb.from("classes").select("*").eq("group_id", g.id).order("day_of_week").order("start_time"),
    sb.from("class_links").select("*"),
    sb.from("enquiries").select("*").eq("group_id", g.id).order("created_at", { ascending: false })
  ]);
  const linkOf = id => (links || []).find(l => l.class_id === id)?.meeting_url || "";
  const page = groupUrl(g.slug);
  el.innerHTML = `
    <div class="card"><div class="row between"><div><h2>${esc(g.name)}</h2><span class="muted">${esc(ARTS[g.art_type]?.label)} · ${esc(g.teacher_name)}</span></div>
      ${g.approved ? `<span class="pill ok">Public</span>` : `<span class="pill wait">Waiting for approval</span>`}</div>
      <div class="code">${esc(page.replace(/^https?:\/\//,""))}</div>
      <div class="row"><a class="btn small ghost" href="${page}" ${C.rootDomain ? "" : "data-link"}>View page</a>
        <button class="btn small ghost" type="button" data-copy="${esc(page)}">Copy link</button>
        ${g.approved ? `<a class="btn small wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(g.name + "\n" + page)}">Share on WhatsApp</a>` : ""}</div>
      <details><summary style="cursor:pointer;font-weight:600">Edit page details</summary>
        <form data-f="edit" style="margin-top:12px">${groupForm(g)}<div class="row"><button class="btn" type="submit">Save</button><span class="muted" data-out role="status"></span></div></form></details>
    </div>
    <div class="card"><h2>Classes</h2>
      ${classes.length ? `<ul class="list">${classes.map(k => `
        <li class="class-item" data-id="${k.id}"><div class="row between"><strong>${esc(k.name)}</strong><span class="muted">${DAYS[k.day_of_week]} · ${fmtTime(k.start_time)} · ${k.duration_min} min</span></div>
          <form data-f="link" class="row" style="flex-wrap:nowrap"><label class="hint" style="flex:1;min-width:0" for="ml-${k.id}">Zoom or Meet link (only your students see it)
            <input id="ml-${k.id}" type="url" pattern="https://.*" placeholder="https://zoom.us/j/…" value="${esc(linkOf(k.id))}"></label>
            <button class="btn small ghost" type="submit" style="align-self:flex-end">Save</button></form>
          <div class="row"><button class="btn small ghost" type="button" data-del>Remove class</button><span class="muted" data-out role="status"></span></div></li>`).join("")}</ul>`
        : `<div class="empty">No classes yet. Add your first one below.</div>`}
      <details ${classes.length ? "" : "open"}><summary style="cursor:pointer;font-weight:600">Add a class</summary>
        <form data-f="class" style="margin-top:12px">
          <label for="nc-name-${g.id}">Class name<input id="nc-name-${g.id}" required minlength="2" maxlength="80" placeholder="Beginners"></label>
          <div class="two"><label for="nc-day-${g.id}">Day<select id="nc-day-${g.id}">${DAYS.map((d,i) => `<option value="${i}" ${i===6?"selected":""}>${d}</option>`).join("")}</select></label>
            <label for="nc-time-${g.id}">Start time<input id="nc-time-${g.id}" type="time" required value="10:00"></label>
            <label for="nc-len-${g.id}">Length (minutes)<input id="nc-len-${g.id}" type="number" min="10" max="300" value="60" required></label></div>
          <label for="nc-url-${g.id}">Zoom or Meet link (optional)<input id="nc-url-${g.id}" type="url" pattern="https://.*" placeholder="https://zoom.us/j/…"></label>
          <div class="row"><button class="btn" type="submit">Add class</button><span class="muted" data-out role="status"></span></div></form></details>
    </div>
    <div class="card"><h2>Enquiries</h2>
      ${enq && enq.length ? `<ul class="list">${enq.map(q => `<li class="class-item"><div class="row between"><strong>${esc(q.name)}</strong><span class="muted">${new Date(q.created_at).toLocaleDateString()}</span></div>
        <span class="code">${esc(q.contact)}</span>${q.message ? `<span style="white-space:pre-line">${esc(q.message)}</span>` : ""}</li>`).join("")}</ul>`
        : `<div class="empty">No enquiries yet. They appear here when someone writes from your page.</div>`}
    </div>`;

  const refresh = () => renderGroupAdmin(el, { ...g });
  el.querySelectorAll("[data-copy]").forEach(b => b.onclick = () => copy(b.dataset.copy, b));
  el.querySelector('[data-f="edit"]').onsubmit = async e => {
    e.preventDefault(); const out = e.target.querySelector("[data-out]");
    const { data, error } = await sb.from("groups").update(groupValues()).eq("id", g.id).select().single();
    if (error) { out.textContent = friendly(error); return; }
    Object.assign(g, data); renderGroupAdmin(el, g);
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
    const id = li.dataset.id, out = li.querySelector("[data-out]");
    li.querySelector('[data-f="link"]').onsubmit = async e => {
      e.preventDefault(); const url = e.target.querySelector("input").value.trim();
      const r = url ? await sb.from("class_links").upsert({ class_id: id, meeting_url: url }) : await sb.from("class_links").delete().eq("class_id", id);
      out.textContent = r.error ? friendly(r.error) : "Link saved.";
    };
    const del = li.querySelector("[data-del]");
    del.onclick = async () => {
      if (!del.dataset.sure) { del.dataset.sure = "1"; del.textContent = "Tap again to remove"; return; }
      const { error } = await sb.from("classes").delete().eq("id", id);
      if (error) { out.textContent = friendly(error); return; }
      refresh();
    };
  });
}

init();
})();
