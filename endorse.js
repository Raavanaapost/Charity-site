// The endorse page (/e/<link>): someone who knows a requested project vouches for it.
// Data comes from /api/endorse/<link>; ?new=1 is added when the person who sent the request lands here.
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const token = (location.pathname.match(/^\/(?:ta\/)?e\/([a-z0-9]+)/i) || [])[1] || new URLSearchParams(location.search).get("t") || "";
  const params = new URLSearchParams(location.search);
  const isNew = params.get("new") === "1";
  const pageUrl = location.origin + "/e/" + token;
  const api = "/api/endorse/" + encodeURIComponent(token.toLowerCase());
  const RELATION = { role: "", know: "Knows the person who asked", seen: "Has seen the need" };
  const doneKey = "raavanaa-endorsed-" + token;

  function missing(msg) {
    $("[data-loading]").hidden = true;
    $("[data-missing]").hidden = false;
    if (msg) $("[data-missing-msg]").textContent = msg;
  }

  function render(r) {
    $("[data-loading]").hidden = true;
    $("[data-page]").hidden = false;
    $("[data-new]").hidden = !isNew;
    $("[data-kicker]").textContent = r.by ? r.by + " asked for help" : "A request for a day of joy";
    $("[data-title]").textContent = r.title;
    $("[data-desc]").textContent = r.description || "";
    $("[data-desc]").hidden = !r.description;
    const facts = [r.kind, r.place, r.children ? (/child/i.test(r.children) ? r.children : r.children + " children") : "", r.when, r.budget].filter(Boolean);
    $("[data-pending]").hidden = !r.pending;
    $("[data-people-card]").hidden = !!r.pending;
    $("[data-share-card]").hidden = !!r.pending;
    $("[data-facts]").innerHTML = facts.map((f) => `<li><b>${esc(f)}</b></li>`).join("");
    document.title = (r.title ? r.title + " · " : "") + "Vouch for a project · Raavanaa";

    const n = r.endorsements.length, L = r.ladder;
    const step = (done, num, title, text) => `<li class="${done ? "done" : ""}"><i aria-hidden="true">${done ? "✓" : num}</i><div><b>${esc(title)}</b><span>${esc(text)}</span></div></li>`;
    $("[data-ladder]").innerHTML =
      step(true, 1, "Request sent", r.by ? `${r.by} told us about the children and the day.` : "Someone told us about the children and the day.") +
      step(!r.pending, 2, r.pending ? "Raavanaa is checking it" : "Checked and approved by Raavanaa", r.pending ? "The team reads it and may call with a few questions." : "The team read it and approved this page for sharing.") +
      step(L.backed, 3, L.backed ? "Backed by the community" : "Waiting for people to vouch",
        L.backed ? `${n} people vouched, including someone in a role.` : `${n} of ${r.needed} so far${n >= r.needed && !L.hasRole ? ". Still needs someone in a role, like a principal or teacher." : "."}`) +
      step(L.verified, 4, L.verified ? "Visited by a Raavanaa volunteer" : "A Raavanaa volunteer visits",
        L.verified ? "A volunteer called or visited and confirmed it. It can now take gifts." : "A volunteer near the children calls or visits. Only then can it take any money.");

    $("[data-count]").textContent = `${Math.min(n, r.needed)} of ${r.needed}`;
    $("[data-bars]").innerHTML = Array.from({ length: r.needed }, (_, i) => `<span class="${i < n ? "on" : ""}"></span>`).join("");
    if (r.pending) { $("[data-form-card]").hidden = true; $("[data-thanks]").hidden = true; return; }
    $("[data-people]").innerHTML = n
      ? r.endorsements.map((e) => `<li><span class="dot" aria-hidden="true">${esc((e.name || "?").trim().charAt(0).toUpperCase())}</span><span class="who"><b>${esc(e.name)}</b><small>${esc(e.role || RELATION[e.relation] || "")}</small></span>${e.relation === "role" ? '<span class="tag">ROLE</span>' : ""}</li>`).join("")
      : `<li class="note">Nobody has vouched yet. Be the first.</li>`;

    const text = `Can you vouch for this? "${r.title}"${r.place ? " in " + r.place : ""}. Raavanaa helps give children a day of joy, and needs people who know about it to say it's real: ${pageUrl}`;
    $("[data-wa]").href = "https://wa.me/?text=" + encodeURIComponent(text);
    $("[data-link]").textContent = pageUrl.replace(/^https?:\/\//, "");

    const already = (() => { try { return localStorage.getItem(doneKey) === "1"; } catch (_) { return false; } })();
    const closed = r.closed || L.verified || r.pending;
    $("[data-form-card]").hidden = isNew || already || closed;
    $("[data-thanks]").hidden = !already;
  }

  async function load() {
    if (!token) return missing();
    try {
      const res = await fetch(api, { headers: { Accept: "application/json" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return missing(data.error);
      render(data.request);
    } catch (_) { missing("We couldn't load this page. Check your connection and try again."); }
  }

  // Role field or "in a few words", depending on how they know about it.
  const form = $("[data-form]");
  const syncRelation = () => {
    const rel = (form.querySelector("input[name=relation]:checked") || {}).value;
    $("[data-role-field]").hidden = rel !== "role";
    $("[data-how-field]").hidden = rel === "role";
  };
  form.querySelectorAll("input[name=relation]").forEach((i) => i.addEventListener("change", syncRelation));
  syncRelation();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("[data-err]"), btn = form.querySelector("button[type=submit]");
    const fd = new FormData(form), data = Object.fromEntries(fd.entries());
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    err.hidden = true;
    if (!String(data.name || "").trim()) return fail("Please add your name.");
    if (data.relation === "role" && !String(data.role || "").trim()) return fail("Please add your role, for example Principal of the school.");
    if (String(data.phone || "").replace(/\D/g, "").length < 9) return fail("Please add a mobile number we can call.");
    if (!fd.get("agree")) return fail("Please tick the box to confirm.");
    btn.disabled = true;
    try {
      const res = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) { btn.disabled = false; return fail(out.error || "That didn't go through. Please try again."); }
      try { localStorage.setItem(doneKey, "1"); } catch (_) { /* private mode */ }
      render(out.request);
      $("[data-thanks]").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (_) { btn.disabled = false; fail("That didn't go through. Check your connection and try again."); }
  });

  $("[data-copy]").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(pageUrl); b.textContent = "Link copied"; }
    catch (_) { b.textContent = pageUrl; }
  });

  load();
})();
