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

  // Team preview from the portal (?preview=1): the profile being edited is passed through this browser's storage, so the
  // team sees the finished page before approving it. Nothing is saved or shared by previewing.
  const isPreview = params.get("preview") === "1";
  function previewProfile() {
    try { return JSON.parse(localStorage.getItem("raav-preview-" + token.toLowerCase()) || "null"); } catch (_) { return null; }
  }

  // The picture: one of our drawings, picked from what the day is (never a photo of the children).
  const ART = [[/kandy|temple of the tooth|perahera|dalada/i, "kandy"], [/beach|sea|ocean|casuarina/i, "beach"], [/bowl/i, "bowling"], [/zoo|animal|dehiwala/i, "zoo"],
    [/arcade|games|play ?zone|fun ?zone/i, "arcade"], [/mum|mother|women/i, "mums"], [/hill|mountain|waterfall|kovil|picnic|park|garden|trip|bus|excursion/i, "hills"]];
  const artFor = (text) => { for (const [re, n] of ART) if (re.test(text)) return "/img/project-" + n + ".svg"; return "/img/hero-initiated.svg"; };

  const ICON = {
    day: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
    place: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    kids: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M13.5 20a4 4 0 0 1 8 0"/></svg>',
    when: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  };
  const STEP_ICON = ["✓", "🔍", "🤝", "🏠"];

  // Budget lines: "Bus to Kandy and back: Rs 30,000", one per line (or a list from the server).
  function budgetRows(r) {
    let rows = Array.isArray(r.budget_items) ? r.budget_items.filter((x) => x && (x.item || x.amount)) : [];
    if (!rows.length && r.budget) {
      rows = String(r.budget).split(/\n|;/).map((l) => l.trim()).filter(Boolean).map((l) => {
        const m = l.match(/^(.*?)[:\-–]\s*((?:rs\.?|lkr)?\s*[\d,.]+.*)$/i);
        return m ? { item: m[1].trim(), amount: m[2].trim() } : { item: l, amount: "" };
      });
    }
    return rows;
  }

  function render(r) {
    if (isPreview) {
      const p = previewProfile();
      if (p) r = { ...r, ...p, description: p.summary || r.description, kind: p.activity || r.kind, pending: false };
      $("[data-preview-bar]").hidden = false;
    }
    $("[data-loading]").hidden = true;
    $("[data-page]").hidden = false;
    $("[data-new]").hidden = !isNew;
    $("[data-kicker]").textContent = ["A day of joy", r.place].filter(Boolean).join(" · ");
    $("[data-title]").textContent = r.title;
    const tagline = r.tagline || (r.description || "").split(/(?<=[.!?])\s/)[0] || "";
    $("[data-tagline]").textContent = tagline;
    $("[data-tagline]").hidden = !tagline || r.pending;
    const received = r.received ? new Date(r.received).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
    $("[data-byline]").innerHTML = [r.by ? `Asked by <b>${esc(r.by)}</b>` : "", received ? esc(received) : ""].filter(Boolean).join(" · ");
    $("[data-stage]").textContent = r.pending ? "Being checked" : r.ladder.verified ? "Verified" : "Initiated";
    $("[data-stage]").classList.toggle("check", !!r.pending);

    const glance = [["day", "The day", r.kind], ["place", "Where", r.place], ["kids", "Children", r.children ? (/child|kid|pupil|student/i.test(r.children) ? r.children : r.children + " children") : ""], ["when", "When", r.when]].filter((g) => g[2]);
    $("[data-glance]").innerHTML = glance.map(([i, l, v]) => `<li><small>${ICON[i]}${esc(l)}</small><b>${esc(v)}</b></li>`).join("");
    $("[data-glance]").hidden = !glance.length || r.pending;

    const paras = String(r.description || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
    $("[data-story]").innerHTML = paras.map((x) => `<p>${esc(x)}</p>`).join("");
    $("[data-story-card]").hidden = !paras.length || r.pending;

    const rows = budgetRows(r);
    const total = r.budget_total || "";
    $("[data-budget]").innerHTML = rows.map((x) => `<li><span>${esc(x.item)}</span><b>${esc(x.amount)}</b></li>`).join("") + (total ? `<li class="total"><span>In all</span><b>${esc(total)}</b></li>` : "");
    $("[data-budget-card]").hidden = (!rows.length && !total) || r.pending;

    $("[data-pending]").hidden = !r.pending;
    $("[data-people-card]").hidden = !!r.pending;
    $("[data-share-card]").hidden = !!r.pending;
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

    const at = r.pending ? 1 : !L.backed ? 2 : !L.verified ? 3 : 4;
    const steps = ["Requested", "Checked", "Vouched", "Visited"];
    $("[data-journey]").innerHTML = steps.map((t, i) => `<li class="${i < at ? "done" : i === at ? "now" : ""}"><i aria-hidden="true">${i < at ? "✓" : STEP_ICON[i]}</i><span>${t}</span></li>`).join("");
    $("[data-journey-note]").innerHTML = r.pending
      ? "<b>Being checked.</b> The Raavanaa team reads every request first, and may call with a few questions."
      : !L.backed ? `<b>Waiting for people to vouch.</b> ${n} of ${r.needed} so far. It needs people who know about it, and at least one in a role, like a principal or teacher.`
      : !L.verified ? "<b>Backed by the community.</b> Next, a Raavanaa volunteer near the children calls or visits."
      : "<b>Visited and verified.</b> A Raavanaa volunteer has confirmed it. It can now take gifts.";

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
    const closed = r.closed || L.verified || r.pending || isPreview;
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
