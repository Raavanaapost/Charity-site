/* Clear form alerts (SURESH 28 Nov 2026, "the email organizer").
   Every form entry sent to Netlify Forms gets an "about" line first, so the alert email in Gmail says
   in plain words what came in and where from. Gmail filters can sort the alerts by these words
   (for example "RAAVANAA REQUEST"). Each form's static definition carries an empty "about" field so
   Netlify keeps it. */
(function () {
  if (window.__raavAbout) return; window.__raavAbout = true;
  var ABOUT = {
    "opportunity": "RAAVANAA REQUEST: a new project request (Submit a need) on raavanaa.org. Open raavanaa.org/portal#/suggestions",
    "give-request": "RAAVANAA GIFT: someone wants to give or pledge on raavanaa.org",
    "follow": "RAAVANAA FOLLOW: someone wants updates on one raavanaa.org project",
    "updates": "RAAVANAA UPDATES: someone signed up for news by email on raavanaa.org",
    "make-it-happen": "RAAVANAA HELP OFFER: someone offers help on a raavanaa.org project",
    "comments": "RAAVANAA COMMENT: a new comment on a raavanaa.org project",
    "contact": "RAAVANAA MESSAGE: a message from the raavanaa.org contact page",
    "volunteer": "RAAVANAA VOLUNTEER: someone wants to volunteer (raavanaa.org)",
    "concern": "RAAVANAA SAFETY CONCERN: a concern was reported on raavanaa.org. Read it today",
    "visit-feedback": "RAAVANAA VISIT FEEDBACK: feedback after a visit (raavanaa.org)",
    "organiser-agreement": "RAAVANAA AGREEMENT: an organiser signed the agreement on raavanaa.org",
    "teacher-letter": "RAAVANAA LETTER: an after-the-day letter on raavanaa.org"
  };
  window.raavAbout = function (name) { return ABOUT[name] || ("RAAVANAA FORM: " + name + " (raavanaa.org)"); };
  // Put "about" first in any form entry posted to "/".
  var withAbout = function (body) {
    var p = new URLSearchParams(String(body)), name = p.get("form-name");
    if (!name || p.get("about")) return body;
    var out = new URLSearchParams(); out.append("form-name", name); out.append("about", window.raavAbout(name));
    p.forEach(function (v, k) { if (k !== "form-name" && k !== "about") out.append(k, v); });
    return out.toString();
  };
  var orig = window.fetch;
  if (orig) window.fetch = function (input, init) {
    try {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      if (init && init.method && /post/i.test(init.method) && (url === "/" || url === location.origin + "/") &&
          (typeof init.body === "string" || init.body instanceof URLSearchParams)) {
        init = Object.assign({}, init, { body: withAbout(init.body) });
      }
    } catch (e) { }
    return orig.call(this, input, init);
  };
  // Plain (non-script) form posts: fill the empty "about" field before the form is sent.
  document.addEventListener("submit", function (e) {
    var f = e.target, n = f && f.querySelector && f.querySelector('[name="form-name"]'), a = f && f.querySelector && f.querySelector('[name="about"]');
    if (n && a && !a.value) a.value = window.raavAbout(n.value);
  }, true);
})();
