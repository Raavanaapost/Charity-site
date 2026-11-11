// Members area (/members): sign in, join, password reset and "My account".
// Uses Netlify Identity, the same login the team portal uses. Only raavanaa.org has it; RaavanaaPost stays open.
// Team access is still decided by roles (admin / team) on the server, so a member who joins here cannot open the portal.
const ID_URL = "https://esm.sh/@netlify/identity@2.0.0";
let ID = null;
const identity = async () => (ID ||= await import(ID_URL));

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const onTa = /^\/ta(\/|$)/.test(location.pathname);
const HOME = onTa ? "/ta/members" : "/members";
const niceError = (err, fallback) => {
  const m = String((err && err.message) || "");
  if (/invalid_grant|invalid.*(password|credentials)|No user found/i.test(m)) return "That email and password do not match. Try again, or reset your password.";
  if (/not.*confirmed|email_not_confirmed/i.test(m)) return "Please confirm your email first. Open the link we sent you.";
  if (/already.*registered|exists/i.test(m)) return "There is already an account with that email. Sign in instead.";
  if (/signups? not allowed|disabled/i.test(m)) return "Joining is not open yet. Ask the Raavanaa team for an invite.";
  if (/password.*(short|least|characters)/i.test(m)) return "Please use a password of at least 8 characters.";
  return m && m.length < 140 ? m : fallback;
};

/** The signed-in member, or null. Other pages (for example Donate) can use this to fill in the name and email. */
export async function getMember() {
  try { const id = await identity(); return await id.getUser(); } catch (e) { return null; }
}

// "?next=/initiate": after signing in or confirming the email, go back there. Kept for a day in localStorage,
// because the confirmation email may open in a new tab. Only paths on this site are accepted.
const NEXT_KEY = "raav-next";
const nextFromUrl = new URLSearchParams(location.search).get("next") || "";
if (/^\/[a-z0-9\/-]*$/i.test(nextFromUrl) && !nextFromUrl.startsWith("//")) { try { localStorage.setItem(NEXT_KEY, JSON.stringify({ to: nextFromUrl, at: Date.now() })); } catch (e) {} }
function goNext() {
  try {
    const n = JSON.parse(localStorage.getItem(NEXT_KEY) || "null");
    localStorage.removeItem(NEXT_KEY);
    if (n && n.to && Date.now() - n.at < 864e5) { location.replace(n.to); return true; }
  } catch (e) {}
  return false;
}

export async function render(app, site) {
  // Links from Identity emails arrive with a token in the address.
  const h = location.hash;
  const tok = k => { const m = h.match(new RegExp(k + "=([^&]+)")); return m ? decodeURIComponent(m[1]) : ""; };
  const clean = () => history.replaceState(null, "", HOME);
  if (tok("invite_token")) { location.replace("/portal" + h); return; }
  if (tok("recovery_token")) { const t = tok("recovery_token"); clean(); return newPassword(app, t); }
  if (tok("confirmation_token")) {
    const t = tok("confirmation_token"); clean();
    try { const id = await identity(); await id.confirmEmail(t); return account(app, site, "Your email is confirmed. Welcome to Raavanaa!"); }
    catch (e) { return signedOut(app, site, "login", "That confirmation link has expired or was already used. Try signing in."); }
  }
  if (/access_token=|error=/.test(h)) { // coming back from "Continue with Google"
    try { const id = await identity(); await id.handleAuthCallback(); } catch (e) { /* show the sign-in form below */ }
    clean();
  }
  const me = await getMember();
  if (me) return account(app, site);
  return signedOut(app, site, new URLSearchParams(location.search).get("join") !== null ? "join" : "login");
}

const header = (eyebrow, title, sub) => `<div class="m-head"><span class="m-ribbon">${esc(eyebrow)}</span>
  <h1 class="m-title" data-rot="title">${title}</h1>${sub ? `<p class="lede" data-rot="sub">${esc(sub)}</p>` : ""}</div>`;
// Sign in: three messages take turns at the top and under the picture (SURESH, 10 Nov 2026).
const JOIN_SETS = [
  { title: 'Join <span class="org">Raavanaa</span> Community', sub: "Make an account now, and soon you will see your gifts and receipts in one place.", cap: "A bridge between people who need a hand <br>and people ready to give one." },
  { title: 'Be part of a <span class="org">smile</span>', sub: "Members can start a moment for children they know, and follow it from the first call to the day itself.", cap: "One small idea can light up <br>a child's whole day." },
  { title: 'Give a <span class="org">hand</span>', sub: "Join free. Vouch for projects you know, volunteer near you, or give to a day of joy.", cap: "Everyone here is a volunteer, <br>and every gift is shown in the open." },
];
const SIGNIN_SETS = [
  { title: 'Welcome <span class="org">back</span>', sub: "Sign in to see your account. You do not need an account to read about our projects.", cap: "A bridge between people who need a hand <br>and people ready to give one." },
  { title: 'Every <span class="org">smile</span> counts', sub: "Sign in to follow the moments you started and the ones you helped make happen.", cap: "One small idea can light up <br>a child's whole day." },
  { title: 'Together we <span class="org">create</span>', sub: "Members can start a moment, vouch for one, and see where every rupee goes.", cap: "Everyone here is a volunteer, <br>and every gift is shown in the open." },
];
// The bridge picture from the Raavanaa Community poster, with its line underneath.
const hero = (small = false) => `<figure class="m-hero${small ? " small" : ""}">
    <picture><source srcset="/img/members-bridge.webp" type="image/webp"><img src="/img/members-bridge.jpg" alt="Neighbours crossing a little bridge to help each other: carrying food, a box, a hand for an elder." width="941" height="395"></picture>
    ${small ? "" : `<figcaption data-rot="cap">A bridge between people who need a hand <br>and people ready to give one.</figcaption>`}
  </figure>`;
const ICONS = {
  join: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="16" r="8"/><path d="M8 42c2-9 8-14 16-14s14 5 16 14"/></svg>',
  give: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 22s-9-6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12z" class="fill"/><path d="M6 34c6-4 12-4 18 0h10c2 0 2 4 0 4H22"/><path d="M6 42h24l12-8c2-2 0-5-3-4l-9 5"/></svg>',
  see: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="6" width="26" height="34" rx="3"/><path d="M15 32v-6M21 32V20M27 32v-9"/><circle cx="36" cy="36" r="7" class="fill"/><path d="M33 36l2 2 4-4" class="tick"/></svg>'
};
const steps = () => `<ol class="m-steps">
    <li>${ICONS.join}<b>Join</b><span>Make a free account in a minute.</span></li>
    <li>${ICONS.give}<b>Give openly</b><span>Soon: give by card. Every cost is shown clearly.</span></li>
    <li>${ICONS.see}<b>See results</b><span>Your gifts, receipts and the smiles they made, in one place.</span></li>
  </ol>`;

async function signedOut(app, site, mode = "login", msg = "") {
  let settings = { disableSignup: true, providers: {} };
  try { const id = await identity(); settings = await id.getSettings(); } catch (e) { /* keep defaults */ }
  const canJoin = !settings.disableSignup;
  const ask = mode === "join" && !canJoin; // sign-ups are invite-only in Netlify: collect a request instead
  const google = settings.providers && settings.providers.google;
  const join = mode === "join";
  app.innerHTML = `<section class="intro about-page member-page">
    ${header("Members", join ? "Join <span class=\"org\">Raavanaa</span> Community" : "Welcome <span class=\"org\">back</span>",
      join ? "Make an account now, and soon you will see your gifts and receipts in one place."
           : "Sign in to see your account. You do not need an account to read about our projects.")}
    ${hero()}
    <div class="member-grid">
      <form class="panel form member-card" id="m-form" novalidate>
        <div class="member-tabs" role="tablist">
          <button type="button" role="tab" aria-selected="${!join}" data-mode="login">Sign in</button>
          <button type="button" role="tab" aria-selected="${join}" data-mode="join">Join</button></div>
        ${ask ? `<p class="member-flash">Joining is by invite while we get ready. Leave your name and email and we will send you an invite.</p>` : ""}
        ${google && !ask ? `<button type="button" class="btn ghost member-google" data-google>Continue with Google</button>
          <p class="member-or"><span>or with email</span></p>` : ""}
        ${join ? `<label>Your name<input name="name" autocomplete="name" required></label>` : ""}
        <label>Email<input name="email" type="email" autocomplete="${join ? "email" : "username"}" required></label>
        ${ask ? "" : `<label>Password<input name="password" type="password" minlength="8" autocomplete="${join ? "new-password" : "current-password"}" required>
          ${join ? `<span class="opt">At least 8 characters.</span>` : ""}</label>`}
        <button class="btn" type="submit">${ask ? "Ask for an invite" : join ? "Create my account" : "Sign in"}</button>
        ${join ? "" : `<button type="button" class="member-link" data-forgot>Forgot your password?</button>`}
        <p class="note member-msg" role="status">${esc(msg)}</p>
      </form>
      <aside class="panel member-why">
        <h2>How it works for members</h2>
        ${steps()}
        <p class="note">Part of the Raavanaa team? Use the <a href="/portal">team portal</a>.</p>
      </aside>
    </div>
  </section>`;
  if (window.raavRotate) window.raavRotate(app, join ? JOIN_SETS : SIGNIN_SETS);
  const f = app.querySelector("#m-form"), out = f.querySelector(".member-msg");
  app.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => signedOut(app, site, b.dataset.mode));
  const g = app.querySelector("[data-google]");
  if (g) g.onclick = async () => { try { const id = await identity(); id.oauthLogin("google"); } catch (e) { out.textContent = niceError(e, "Google sign-in is not available right now."); } };
  f.onsubmit = async e => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    const fd = new FormData(f), email = String(fd.get("email")).trim(), pw = String(fd.get("password"));
    const btn = f.querySelector("button[type=submit]"); btn.disabled = true; out.textContent = "One moment...";
    if (ask) { // saved under Forms → "updates" in Netlify, marked page = members-join
      try {
        const body = new URLSearchParams({ "form-name": "updates", page: "members-join", name: String(fd.get("name") || "").trim(), email });
        const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
        if (!r.ok) throw new Error();
        f.innerHTML = `<h2>Thank you!</h2><p>We have your request. We will email <b>${esc(email)}</b> an invite to join Raavanaa Community.</p>`;
      } catch (err) { out.textContent = "We could not send that. Please try again."; btn.disabled = false; }
      return;
    }
    try {
      const id = await identity();
      if (join) {
        const u = await id.signup(email, pw, { full_name: String(fd.get("name") || "").trim() });
        if (u && u.confirmedAt) return account(app, site, "Welcome to Raavanaa!");
        f.innerHTML = `<h2>Check your email</h2><p>We sent a link to <b>${esc(email)}</b>. Open it to confirm your account, then you are in.</p>
          <p class="note">Nothing there? Look in Spam or Promotions.</p>`;
        return;
      }
      await id.login(email, pw);
      account(app, site);
    } catch (err) {
      out.textContent = niceError(err, join ? "We could not create the account. Please try again." : "That did not work. Check the email and password.");
      btn.disabled = false;
    }
  };
  const fg = app.querySelector("[data-forgot]");
  if (fg) fg.onclick = async () => {
    const email = String(f.querySelector("[name=email]").value).trim();
    if (!email) { out.textContent = "Type your email first, then tap Forgot."; return; }
    try { const id = await identity(); await id.requestPasswordRecovery(email); out.textContent = "If that email has an account, a reset link is on its way."; }
    catch (err) { out.textContent = "We could not send the reset email. Please try again later."; }
  };
}

function newPassword(app, token) {
  app.innerHTML = `<section class="intro about-page member-page">
    ${header("Members", "Choose a <span class=\"org\">new password</span>")}
    <form class="panel form member-card" id="m-pw">
      <label>New password<input name="password" type="password" minlength="8" autocomplete="new-password" required><span class="opt">At least 8 characters.</span></label>
      <button class="btn" type="submit">Save password</button>
      <p class="note member-msg" role="status"></p>
    </form></section>`;
  const f = app.querySelector("#m-pw"), out = f.querySelector(".member-msg");
  f.onsubmit = async e => {
    e.preventDefault(); out.textContent = "One moment...";
    try { const id = await identity(); await id.recoverPassword(token, String(new FormData(f).get("password"))); account(app, null, "Your new password is saved."); }
    catch (err) { out.textContent = niceError(err, "That reset link has expired. Ask for a new one from the sign-in page."); }
  };
}

async function account(app, site, msg = "") {
  const me = await getMember();
  if (!me) return signedOut(app, site, "login", msg);
  if (goNext()) return;
  const name = me.name || (me.email || "").split("@")[0];
  const roles = [].concat(me.roles || [], me.role ? [me.role] : []);
  const team = roles.some(r => r === "admin" || r === "team");
  const since = me.createdAt ? new Date(me.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";
  app.innerHTML = `<section class="intro about-page member-page">
    ${header("My account", `Welcome, <span class="org">${esc(name)}</span>`, since ? `Member since ${since}.` : "")}
    ${hero(true)}
    ${msg ? `<p class="member-flash" role="status">${esc(msg)}</p>` : ""}
    <section class="panel member-card m-requests" data-my-requests hidden>
      <h2>My requests</h2>
      <ul class="m-req-list" data-req-list></ul>
    </section>
    <div class="member-grid">
      <section class="panel member-card">
        <h2>My donations</h2>
        <p>Card payments are not open yet. When they are, every gift you make while signed in will show here, with a receipt you can download.</p>
        <p class="note">You can already help by suggesting a project or volunteering.</p>
        <p class="member-actions"><a class="btn" href="${onTa ? "/ta" : ""}/initiated">See projects</a><a class="btn ghost" href="${onTa ? "/ta" : ""}/volunteer">Volunteer</a></p>
      </section>
      <form class="panel form member-card" id="m-me">
        <h2>My details</h2>
        <label>Name<input name="name" value="${esc(me.name || "")}" autocomplete="name"></label>
        <label>Email<input value="${esc(me.email || "")}" disabled></label>
        <button class="btn" type="submit">Save</button>
        <p class="note member-msg" role="status"></p>
      </form>
    </div>
    <p class="member-foot">${team ? `<a href="/portal">Open the team portal</a> · ` : ""}<button type="button" class="member-link" data-signout>Sign out</button></p>
  </section>`;
  // The requests this member sent, with where each one is and its page link.
  fetch("/api/my-requests", { credentials: "same-origin" }).then(r => r.ok ? r.json() : null).then(d => {
    const box = app.querySelector("[data-my-requests]"), list = d && d.requests;
    if (!box || !list || !list.length) return;
    box.hidden = false;
    box.querySelector("[data-req-list]").innerHTML = list.map(r => `<li>
      <a href="${esc(r.project || r.link)}"><b>${esc(r.title)}</b></a>
      <span>${esc(r.step)}${r.shareOk ? ` · vouched ${r.vouched} of 3` : ""}</span>
      <small>${esc(r.ref)} · sent ${esc(new Date(r.received).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}</small></li>`).join("");
  }).catch(() => {});
  const f = app.querySelector("#m-me"), out = f.querySelector(".member-msg");
  f.onsubmit = async e => {
    e.preventDefault(); out.textContent = "Saving...";
    try { const id = await identity(); await id.updateUser({ data: { full_name: String(new FormData(f).get("name")).trim() } }); out.textContent = "Saved."; markNav(true); }
    catch (err) { out.textContent = niceError(err, "Could not save. Please try again."); }
  };
  app.querySelector("[data-signout]").onclick = async () => {
    try { const id = await identity(); await id.logout(); } catch (e) { /* ignore */ }
    markNav(false); signedOut(app, site, "login", "You are signed out.");
  };
  markNav(true);
}

function markNav(signedIn) {
  const a = document.querySelector("#site-nav .nav-member");
  if (a) a.textContent = signedIn ? "My account" : "Sign in";
}
