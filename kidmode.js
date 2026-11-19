/* Kid mode — a small, self-contained plugin (no dependencies).
   A parent hands the device to a child; the app stays on the pages you allow until the parent's PIN is entered.
   See KIDMODE.md for how to use it in another project.

   KidMode.init({ appName, storageKey, home, allow(path), navigate(path), verifyParent(password), onChange(active), hide: [css selectors] })
   KidMode.start({ name, key })  -> Promise<boolean>   asks for / sets the PIN, then locks
   KidMode.requestExit()         -> Promise<boolean>   asks for the PIN, then unlocks
   KidMode.active() / KidMode.who() / KidMode.allowed(path) / KidMode.clear()
*/
(function () {
  "use strict";
  const O = { appName: "this app", storageKey: "kidmode", home: "/", allow: () => true, navigate: p => { location.href = p; }, verifyParent: null, onChange: null, hide: [] };
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(O.storageKey + "." + k) || "null"); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(O.storageKey + "." + k) : localStorage.setItem(O.storageKey + "." + k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/></svg>`;

  async function hash(pin, salt) {
    const data = new TextEncoder().encode(salt + ":" + pin);
    if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest("SHA-256", data); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
    let h = 5381; for (const c of data) h = ((h << 5) + h + c) >>> 0; return "x" + h.toString(16);   // very old browsers only
  }
  const newSalt = () => { const a = new Uint8Array(8); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 256); return [...a].map(x => x.toString(16).padStart(2, "0")).join(""); };
  const hasPin = () => !!LS.get("pin");
  async function setPin(pin) { const salt = newSalt(); LS.set("pin", { salt, hash: await hash(pin, salt) }); LS.set("tries", null); }
  async function checkPin(pin) { const p = LS.get("pin"); return !!p && (await hash(pin, p.salt)) === p.hash; }

  /* ---------- look ---------- */
  function injectCss() {
    if (document.getElementById("kidmode-css")) return;
    const hide = ["[data-kid-hide]"].concat(O.hide || []).map(s => "body.kid-mode " + s).join(",");
    const st = document.createElement("style"); st.id = "kidmode-css";
    st.textContent = `
${hide}{display:none!important}
body.kid-mode{padding-bottom:calc(58px + env(safe-area-inset-bottom,0px))}
.km-bar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px max(14px,env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) max(14px,env(safe-area-inset-left,0px));background:var(--km-bar-bg,#4f0a08);color:var(--km-bar-fg,#fff7ea);font:600 15px/1.2 system-ui,sans-serif;box-shadow:0 -4px 14px rgba(0,0,0,.18)}
.km-bar span{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.km-bar svg{width:20px;height:20px;flex:none}
.km-btn{font:700 15px/1 system-ui,sans-serif;min-height:44px;padding:0 18px;border-radius:999px;border:0;cursor:pointer;background:var(--km-accent,#6e0f0c);color:var(--km-accent-fg,#fff7ea)}
.km-btn.ghost{background:transparent;color:inherit;box-shadow:inset 0 0 0 1.5px currentColor}
.km-bar .km-btn{min-height:40px;background:var(--km-bar-fg,#fff7ea);color:var(--km-bar-bg,#4f0a08)}
.km-btn:disabled{opacity:.5;cursor:default}
.km-dlg{border:0;border-radius:22px;padding:0;width:min(400px,calc(100vw - 28px));max-height:calc(100dvh - 28px);background:var(--km-bg,#fffdf8);color:var(--km-fg,#260c09);box-shadow:0 20px 60px rgba(0,0,0,.35);font:500 16px/1.45 system-ui,sans-serif}
.km-dlg::backdrop{background:rgba(30,8,6,.55)}
.km-in{display:flex;flex-direction:column;gap:14px;padding:22px}
.km-in h2{margin:0;font-size:1.35rem;line-height:1.2;color:var(--km-accent,#6e0f0c)}
.km-in p{margin:0}
.km-muted{color:var(--km-muted,#4a3127);font-size:.95rem}
.km-dots{display:flex;justify-content:center;gap:14px;padding:6px 0}
.km-dots i{width:16px;height:16px;border-radius:50%;box-shadow:inset 0 0 0 2px var(--km-accent,#6e0f0c)}
.km-dots i.on{background:var(--km-accent,#6e0f0c)}
.km-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.km-pad button{font:700 1.35rem/1 system-ui,sans-serif;min-height:54px;border-radius:14px;border:1.5px solid var(--km-line,#e7d3ad);background:var(--km-key,#fbf5ea);color:inherit;cursor:pointer}
.km-pad button:active{background:var(--km-line,#e7d3ad)}
.km-pad button.km-x{font-size:1rem;font-weight:700}
.km-msg{min-height:1.4em;text-align:center;font-weight:700;color:var(--km-warn,#a3201a)}
.km-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;align-items:center}
.km-link{background:none;border:0;padding:6px 0;font:inherit;font-weight:700;text-decoration:underline;color:var(--km-accent,#6e0f0c);cursor:pointer}
.km-tips{border:1px solid var(--km-line,#e7d3ad);border-radius:14px;padding:10px 14px;background:var(--km-key,#fbf5ea);font-size:.93rem}
.km-tips summary{cursor:pointer;font-weight:700}
.km-tips ol{margin:8px 0 4px;padding-left:20px}
.km-tips b{color:var(--km-accent,#6e0f0c)}
.km-in input[type=password]{font:inherit;width:100%;box-sizing:border-box;min-height:48px;padding:0 14px;border-radius:12px;border:1.5px solid var(--km-line,#e7d3ad);background:#fff;color:inherit}
.km-toast{position:fixed;left:50%;bottom:calc(74px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483001;max-width:calc(100vw - 32px);padding:10px 16px;border-radius:999px;background:#260c09;color:#fff7ea;font:600 14px/1.3 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3)}`;
    document.head.appendChild(st);
  }
  let toastT = null;
  function toast(t) { let el = document.querySelector(".km-toast"); if (!el) { el = document.createElement("div"); el.className = "km-toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = t; clearTimeout(toastT); toastT = setTimeout(() => el.remove(), 2600); }

  /* ---------- dialogs ---------- */
  function dialog(html) {
    const d = document.createElement("dialog"); d.className = "km-dlg"; d.innerHTML = `<div class="km-in">${html}</div>`;
    document.body.appendChild(d); d.addEventListener("cancel", e => { e.preventDefault(); d.dispatchEvent(new Event("km-cancel")); });
    d.showModal(); return d;
  }
  /* A 4-digit keypad. Resolves with the digits, or null when cancelled. check(pin) may return an error message to keep it open. */
  function pinPad({ title, note, check, extra }) {
    return new Promise(resolve => {
      const d = dialog(`<h2>${esc(title)}</h2>${note ? `<p class="km-muted">${note}</p>` : ""}
        <div class="km-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="km-msg" role="alert"></div>
        <div class="km-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-n="${n}">${n}</button>`).join("")}<button type="button" class="km-x" data-cancel>Cancel</button><button type="button" data-n="0">0</button><button type="button" class="km-x" data-back aria-label="Delete last digit">⌫</button></div>
        ${extra || ""}`);
      let pin = "", busy = false;
      const dots = d.querySelectorAll(".km-dots i"), msg = d.querySelector(".km-msg");
      const paint = () => dots.forEach((x, i) => x.classList.toggle("on", i < pin.length));
      const done = v => { d.close(); d.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
      const push = async n => {
        if (busy || pin.length >= 4) return; pin += n; msg.textContent = ""; paint();
        if (pin.length < 4) return;
        busy = true; const err = check ? await check(pin) : ""; busy = false;
        if (err) { msg.textContent = err; pin = ""; paint(); return; }
        done(pin);
      };
      const onKey = e => { if (/^\d$/.test(e.key)) { e.preventDefault(); push(e.key); } else if (e.key === "Backspace") { pin = pin.slice(0, -1); paint(); } };
      document.addEventListener("keydown", onKey, true);
      d.querySelectorAll("[data-n]").forEach(b => b.onclick = () => push(b.dataset.n));
      d.querySelector("[data-back]").onclick = () => { pin = pin.slice(0, -1); paint(); };
      d.querySelector("[data-cancel]").onclick = () => done(null);
      d.addEventListener("km-cancel", () => done(null));
      const f = d.querySelector("[data-forgot]"); if (f) f.onclick = () => done("forgot");
    });
  }
  async function choosePin() {
    const a = await pinPad({ title: "Choose a parent PIN", note: "4 digits that your child doesn't know. You'll need it to leave Kid mode." });
    if (!a) return false;
    const b = await pinPad({ title: "Type the PIN again", note: "Just to be sure.", check: p => p === a ? "" : "That didn't match. Try again." });
    if (!b) return false;
    await setPin(a); return true;
  }
  const tips = () => `<details class="km-tips"><summary>Also lock the phone to ${esc(O.appName)} (recommended)</summary>
    <p>Kid mode keeps your child on their page inside ${esc(O.appName)}. To stop them leaving the app, use your phone's own lock:</p>
    <p><b>Android:</b></p><ol><li>Settings → search "pin" → turn on <b>Pin app</b> (App pinning) and <b>Ask for PIN before unpinning</b>.</li><li>Open ${esc(O.appName)}, open Recent apps, tap its icon and choose <b>Pin</b>.</li><li>To unlock: hold Back and Recents together, then enter the phone's PIN.</li></ol>
    <p><b>iPhone or iPad:</b></p><ol><li>Settings → Accessibility → <b>Guided Access</b> → turn on and set a passcode.</li><li>Open ${esc(O.appName)} and triple-click the side button to start.</li><li>Triple-click again and enter the passcode to end.</li></ol>
    <p>Tip: use your browser's menu → <b>Add to Home screen</b> first, so ${esc(O.appName)} opens like an app.</p></details>`;

  /* ---------- state ---------- */
  const state = () => LS.get("state");
  const active = () => !!state();
  const allowed = path => !active() || !!O.allow(path);
  function paintBar() {
    injectCss();
    const s = state(); document.body.classList.toggle("kid-mode", !!s);
    let bar = document.querySelector(".km-bar");
    if (!s) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement("div"); bar.className = "km-bar"; document.body.appendChild(bar); }
    bar.innerHTML = `<span>${LOCK}Kid mode${s.name ? " · " + esc(s.name) : ""}</span><button type="button" class="km-btn">Parent</button>`;
    bar.querySelector("button").onclick = () => requestExit();
  }
  function enter(who) {
    LS.set("state", { name: who.name || "", key: who.key || "", since: Date.now() });
    paintBar();
    try { const el = document.documentElement; if (el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" }).catch(() => {}); } catch (e) {}
    if (O.onChange) O.onChange(true);
  }
  function clear(silent) {
    const was = active(); LS.set("state", null); paintBar();
    try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) {}
    if (was && !silent && O.onChange) O.onChange(false);
  }
  async function start(who) {
    injectCss(); who = who || {};
    const ok = await new Promise(resolve => {
      const d = dialog(`<h2>Hand the phone to ${esc(who.name || "your child")}</h2>
        <p>Kid mode shows only ${esc(who.name ? who.name + "'s" : "your child's")} own pages. Menus, sign-out and links that leave ${esc(O.appName)} are hidden until you enter your parent PIN.</p>
        ${hasPin() ? `<p class="km-muted">You'll use the parent PIN you already chose on this device.</p>` : `<p class="km-muted">First you'll choose a 4-digit parent PIN.</p>`}
        ${tips()}
        <div class="km-row"><button type="button" class="km-btn ghost" data-no>Cancel</button><button type="button" class="km-btn" data-yes>${hasPin() ? "Start Kid mode" : "Choose PIN"}</button></div>`);
      const end = v => { d.close(); d.remove(); resolve(v); };
      d.querySelector("[data-no]").onclick = () => end(false); d.addEventListener("km-cancel", () => end(false));
      d.querySelector("[data-yes]").onclick = () => end(true);
    });
    if (!ok) return false;
    if (!hasPin() && !(await choosePin())) return false;
    enter(who); return true;
  }
  async function forgot() {
    if (!O.verifyParent) { toast("Ask the account owner to sign in again to reset the PIN."); return false; }
    return new Promise(resolve => {
      const d = dialog(`<h2>Forgot the PIN?</h2><p class="km-muted">Enter your ${esc(O.appName)} account password to leave Kid mode. You can choose a new PIN next time.</p>
        <form><label>Account password<input type="password" autocomplete="current-password" required></label>
        <div class="km-msg" role="alert"></div>
        <div class="km-row"><button type="button" class="km-btn ghost" data-no>Cancel</button><button type="submit" class="km-btn">Continue</button></div></form>`);
      const end = v => { d.close(); d.remove(); resolve(v); };
      d.querySelector("[data-no]").onclick = () => end(false); d.addEventListener("km-cancel", () => end(false));
      d.querySelector("form").onsubmit = async e => {
        e.preventDefault(); const b = d.querySelector("[type=submit]"); b.disabled = true;
        let good = false; try { good = await O.verifyParent(d.querySelector("input").value); } catch (er) {}
        b.disabled = false;
        if (!good) { d.querySelector(".km-msg").textContent = "That password didn't match."; return; }
        LS.set("pin", null); LS.set("tries", null); end(true);
      };
    });
  }
  async function requestExit() {
    if (!active()) return true;
    const check = async pin => {
      const t = LS.get("tries") || { n: 0, until: 0 };
      if (Date.now() < t.until) return `Too many tries. Wait ${Math.ceil((t.until - Date.now()) / 1000)} seconds.`;
      if (await checkPin(pin)) { LS.set("tries", null); return ""; }
      t.n++; if (t.n >= 5) { t.until = Date.now() + 30000; t.n = 0; } LS.set("tries", t);
      return t.until > Date.now() ? "Too many tries. Wait 30 seconds." : "Wrong PIN. Try again.";
    };
    const r = await pinPad({ title: "Parent PIN", note: "Enter your PIN to leave Kid mode.", check: p => check(p), extra: `<button type="button" class="km-link" data-forgot>Forgot PIN?</button>` });
    if (r === "forgot") { if (!(await forgot())) return false; clear(); return true; }
    if (!r) return false;
    clear(); return true;
  }

  /* ---------- guards ---------- */
  function onClick(e) {
    if (!active()) return;
    const a = e.target.closest && e.target.closest("a[href]"); if (!a || a.closest(".km-dlg")) return;
    let u; try { u = new URL(a.getAttribute("href"), location.href); } catch (er) { return; }
    const outside = u.origin !== location.origin || !/^https?:$/.test(u.protocol);
    if (outside ? !a.hasAttribute("data-kid-allow") : !O.allow(u.pathname)) {
      e.preventDefault(); e.stopPropagation();
      toast(outside ? "Ask a parent to open this." : "Ask a parent to leave Kid mode first.");
    }
  }
  function guardNow() { if (active() && !O.allow(location.pathname)) { O.navigate(O.home); return false; } return true; }

  function init(opts) {
    Object.assign(O, opts || {});
    document.addEventListener("click", onClick, true);
    window.addEventListener("storage", e => { if (e.key && e.key.startsWith(O.storageKey + ".")) paintBar(); });
    if (document.body) paintBar(); else document.addEventListener("DOMContentLoaded", paintBar);
  }
  window.KidMode = { init, start, requestExit, active, who: state, allowed, guard: guardNow, clear: () => clear(true), hasPin, version: "1.0.0" };
})();
