/* Family circles on the projects list and project pages (SURESH, 13 Nov 2026).
   - A project held by a family circle shows "Being funded by <name>'s circle", so two circles never take the same one.
   - The organiser of a family page comes here from "Choose a project for our circle" (/initiated?circle=<code>): each
     open project gets a "Choose this one" button; choosing holds it for their circle and takes them back to their page. */
(function () {
  "use strict";
  var TA = /^\/ta(\/|$)/.test(location.pathname), L = TA ? "/ta" : "";
  var T = function (en, ta) { return TA ? ta : en; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var ss = { get: function (k) { try { return sessionStorage.getItem(k) || ""; } catch (_) { return ""; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} }, del: function (k) { try { sessionStorage.removeItem(k); } catch (_) {} } };
  var q = (new URLSearchParams(location.search).get("circle") || "").toLowerCase();
  if (/^[a-z0-9]{6,16}$/.test(q)) ss.set("raav-picking", q);
  var picking = ss.get("raav-picking");
  var ownerKey = ""; try { ownerKey = picking ? localStorage.getItem("raav-own-" + picking) || "" : ""; } catch (_) {}
  var getJSON = function (u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
  var app = document.getElementById("app") || document.body;
  var circleWord = function (name) { return T(name + "'s circle", name + " வட்டம்"); };

  Promise.all([getJSON("/api/circle-claims"), picking ? getJSON("/api/moments/" + picking) : null, picking ? getJSON("/projects.json") : null, picking ? getJSON("/api/projects") : null]).then(function (r) {
    var claims = r[0] && r[0].claims || {}, mine = r[1] && r[1].ok ? r[1] : null;
    if (picking && !mine) { ss.del("raav-picking"); picking = ""; }
    var open = {};
    ((r[2] && r[2].projects) || []).concat((r[3] && r[3].projects) || []).forEach(function (p) {
      if (p && p.slug && p.verified && !p.hidden && !/complete/i.test(p.status || "")) open[p.slug] = 1;
    });

    if (picking) {
      var bar = document.createElement("div");
      bar.className = "cp-bar";
      bar.innerHTML = '<div class="wrap cp-bar-in"><span>' + T("Choosing a project for <b>" + esc(circleWord(mine.name)) + "</b>. Tap <b>Choose this one</b> on the project you want.", "<b>" + esc(circleWord(mine.name)) + "</b> க்காக ஒரு திட்டத்தைத் தேர்ந்தெடுக்கிறீர்கள். விரும்பும் திட்டத்தில் <b>இதைத் தேர்ந்தெடு</b> என்பதைத் தட்டுங்கள்.") +
        '</span><a href="' + L + "/m/" + picking + '#giving" data-cp-cancel>' + T("Back to our page", "எங்கள் பக்கத்துக்குத் திரும்பு") + "</a></div>";
      var hd = document.querySelector("header.bar"); if (hd) hd.parentNode.insertBefore(bar, hd.nextSibling); else document.body.insertBefore(bar, document.body.firstChild);
      bar.querySelector("[data-cp-cancel]").addEventListener("click", function () { ss.del("raav-picking"); });
    }

    var choose = function (slug, btn, note) {
      btn.disabled = true;
      fetch("/api/moments/" + picking + "/project", { method: "POST", headers: { "Content-Type": "application/json", "x-owner-key": ownerKey }, body: JSON.stringify({ slug: slug }) })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function (o) {
          if (o.ok) { ss.del("raav-picking"); location.href = L + "/m/" + picking + "#giving"; return; }
          btn.disabled = false; note.hidden = false;
          note.textContent = o.error || T("We could not choose this one. Please try again.", "இதைத் தேர்ந்தெடுக்க முடியவில்லை. மீண்டும் முயலுங்கள்.");
        }).catch(function () { btn.disabled = false; });
    };
    var slugOf = function (href) { var m = String(href || "").match(/\/projects\/([a-z0-9-]+)/); return m ? m[1] : ""; };

    // The projects list: a badge on held projects, and (while choosing) a button on the open ones.
    var mark = function () {
      Array.prototype.forEach.call(app.querySelectorAll('a.card[href*="/projects/"], a.plist-row[href*="/projects/"], a.mosaic-tile[href*="/projects/"]'), function (a) {
        if (a.dataset.cp) return;
        a.dataset.cp = "1";
        var slug = slugOf(a.getAttribute("href")), body = a.querySelector(".body, .plist-main") || a, held = claims[slug];
        if (a.classList.contains("mosaic-tile")) { if (held) a.insertAdjacentHTML("beforeend", '<span class="cp-held cp-on-tile">♥ ' + T("Being funded by " + esc(circleWord(held.name)), esc(circleWord(held.name)) + " நிதியளிக்கிறது") + "</span>"); return; }
        if (held && !(mine && held.name === mine.name && mine.held === slug)) {
          body.insertAdjacentHTML("afterbegin", '<span class="cp-held">♥ ' + T("Being funded by " + esc(circleWord(held.name)), esc(circleWord(held.name)) + " நிதியளிக்கிறது") + "</span>");
          return;
        }
        if (picking && open[slug]) {
          body.insertAdjacentHTML("beforeend", '<span class="cp-choose" role="button" tabindex="0">' + T("Choose this one", "இதைத் தேர்ந்தெடு") + '</span><span class="cp-note" hidden></span>');
          var btn = body.querySelector(".cp-choose"), note = body.querySelector(".cp-note");
          var go = function (e) { e.preventDefault(); e.stopPropagation(); if (!btn.disabled) choose(slug, btn, note); };
          btn.addEventListener("click", go);
          btn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") go(e); });
        }
      });
    };

    // A project page: the badge under the header, and (while choosing) the same button.
    var page = slugOf(location.pathname);
    var markPage = function () {
      if (!page || document.querySelector(".cp-page")) return;
      var held = claims[page], box = document.createElement("div");
      box.className = "cp-page wrap";
      if (held) box.innerHTML = '<span class="cp-held">♥ ' + T("Being funded by " + esc(circleWord(held.name)), esc(circleWord(held.name)) + " நிதியளிக்கிறது") + "</span>";
      else if (picking && open[page]) {
        box.innerHTML = '<button type="button" class="cp-choose">' + T("Choose this one for " + esc(circleWord(mine.name)), esc(circleWord(mine.name)) + " க்காக இதைத் தேர்ந்தெடு") + '</button><span class="cp-note" hidden></span>';
        box.querySelector("button").addEventListener("click", function (e) { choose(page, e.currentTarget, box.querySelector(".cp-note")); });
      } else return;
      app.insertBefore(box, app.firstChild);
    };

    var run = function () { mark(); markPage(); };
    run();
    new MutationObserver(run).observe(app, { childList: true, subtree: true });
  });
})();
