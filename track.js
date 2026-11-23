/* Raavanaa's own visit counter (SURESH, 16 Nov 2026). Free, no cookies, nothing personal.
   It tells /api/hit: the page opened (without the part after "?"), where the visit came from (the other website's
   name and any campaign words such as ?from=kandy-whatsapp), and what the visit led to: a share, an "I'd like to give",
   a page in someone's memory, a project request, a vouch, or installing the app.
   A visit is one browser tab: a random id kept in sessionStorage, gone when the tab closes.
   The team's own phones can opt out in the portal (Traffic → "Don't count this device"). */
(function () {
  "use strict";
  if (window.__raavTrack) return;
  window.__raavTrack = true;
  var store = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };
  try { if (localStorage.getItem("raav-notrack") === "1") return; } catch (e) { /* storage blocked: still count */ }
  if (/^\/(portal|admin)/.test(location.pathname)) return;

  var q = new URLSearchParams(location.search);
  var visit = null;
  try { visit = JSON.parse(store("raav-visit") || "null"); } catch (e) { visit = null; }
  var landing = !visit || !visit.v;
  if (landing) {
    var ref = "";
    try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) { ref = ""; }
    // Android apps sometimes say who they are: android-app://com.whatsapp/
    if (!ref && /^android-app:\/\//.test(document.referrer || "")) ref = document.referrer.replace(/^android-app:\/\//, "").split("/")[0];
    visit = {
      v: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      r: ref,
      c: q.get("from") || q.get("utm_campaign") || "",
      u: q.get("utm_source") || "",
      x: q.has("fbclid") ? "fb" : q.has("igshid") || q.has("igsh") ? "ig" : q.has("gclid") ? "g" : ""
    };
    store("raav-visit", JSON.stringify(visit));
  }
  var app = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  var lang = /^\/ta(\/|$)/.test(location.pathname) ? "ta" : "en";

  // Signed-in members only (SURESH, 23 Nov 2026: "who is online, their activity log"): the same note also goes to
  // /api/members/seen, which checks the sign-in itself. Visitors without an account send nothing extra.
  var member = false;
  try { member = !!localStorage.getItem("gotrue.user"); } catch (e) { member = false; }
  var memberReady = member ? import("/members.js").then(function (m) { return m.getMember(); }).then(function (u) { return !!u; }, function () { return false; }) : null;
  function seen(kind, detail) {
    if (!memberReady) return;
    memberReady.then(function (ok) {
      if (!ok) return;
      try { fetch("/api/members/seen", { method: "POST", credentials: "same-origin", keepalive: true, body: JSON.stringify({ k: kind, p: location.pathname, d: detail || "" }) }).catch(function () {}); } catch (e) { /* never break the page */ }
    });
  }

  function send(kind, detail, first) {
    seen(kind, detail);
    var body = JSON.stringify({
      k: kind, p: location.pathname, d: detail || "", v: visit.v, l: first ? 1 : 0,
      r: first ? visit.r : "", c: visit.c, u: visit.u, x: visit.x, a: app ? 1 : 0, lang: lang
    });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/api/hit", new Blob([body], { type: "text/plain" }))) return;
    } catch (e) { /* fall through */ }
    try { fetch("/api/hit", { method: "POST", body: body, keepalive: true }).catch(function () {}); } catch (e) { /* never break the page */ }
  }
  window.raavTrack = function (kind, detail) { send(kind, detail, false); };

  send("view", "", landing);

  // Shares: the project share box (data-sh), the moment and family-page share buttons, and any share link.
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-sh],[data-share],[data-copy],a[href]") : null;
    if (!t) return;
    var net = "";
    if (t.hasAttribute("data-sh")) net = t.getAttribute("data-sh");
    else if (t.tagName === "BUTTON" && t.hasAttribute("data-share")) net = "phone";
    else if (t.tagName === "BUTTON" && t.hasAttribute("data-copy")) net = "link";
    else if (t.tagName === "A") {
      var h = t.getAttribute("href") || "";
      if (/wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//.test(h)) net = "wa";
      else if (/facebook\.com\/sharer/.test(h)) net = "fb";
      else if (/twitter\.com\/intent|x\.com\/intent/.test(h)) net = "x";
    }
    if (net) send("share", net, false);
  }, true);

  // What a visit led to: watch the site's own form calls succeed (nothing from the form is sent here).
  var DONE = [[/^\/api\/pledge$/, "give"], [/^\/api\/moments$/, "memory"], [/^\/api\/suggest$/, "request"], [/^\/api\/endorse\/[^/]+$/, "vouch"]];
  if (window.fetch) {
    var plain = window.fetch;
    window.fetch = function (input, init) {
      var p = plain.apply(this, arguments);
      try {
        var method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
        if (method === "POST") {
          var path = new URL(typeof input === "string" ? input : input.url, location.href).pathname, kind = "";
          for (var i = 0; i < DONE.length; i++) if (DONE[i][0].test(path)) { kind = DONE[i][1]; break; }
          if (kind) p.then(function (r) { if (r && r.ok) send(kind, "", false); }, function () {});
        }
      } catch (e) { /* never break the page */ }
      return p;
    };
  }
  window.addEventListener("appinstalled", function () { send("install", "", false); });
})();
