/* Open Books, raavanaa.org/money (SURESH 25 Nov 2026, option B): "a dashboard summary where total amount and
   subcategories or filter on how much funded from around the world. Also the people funded and which projects and dates."
   One page: Received and Promised totals, filters (stage, project, country, month), by project, by country, by month,
   every gift, money out with receipts, and Download all (CSV). Data: GET /api/money (all in rupees).
   Never shown: phone numbers, emails, cities. Names follow each giver's own choice.
   Room kept for later (thread "Plan monthly giving and Raavanaa trust fund"): the Monthly givers and Trust Fund tiles. */
(function () {
  const root = document.getElementById("ob");
  if (!root) return;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rs = n => "Rs " + Math.round(n).toLocaleString("en-US");
  const short = n => n >= 1e6 ? "Rs " + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M" : n >= 1e3 ? "Rs " + Math.round(n / 1e3) + "k" : rs(n);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = m => { const [y, mm] = m.split("-"); return `${MONTHS[+mm - 1]} ${y}`; };
  const dayName = d => { if (!d) return "Not dated"; const [y, m, dd] = d.split("-"); return `${+dd} ${MONTHS[+m - 1]} ${y}`; };
  const STAGES = ["Initiated", "Activated", "Impact"];
  const NOT_SAID = "Not said yet";
  const f = { stage: "All", project: "All", country: "All", month: "All" };
  let D = null;

  root.innerHTML = `<header class="ob-head"><p class="ob-eyebrow">Open Books</p><h1>Every rupee, out in the open</h1>
    <p class="ob-tag">Every gift to Raavanaa, where it came from, which project it went to, and where it was spent.</p></header>
    <p class="ob-loading">Counting every gift…</p>`;

  fetch("/api/money", { headers: { Accept: "application/json" } }).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => { D = d; build(); })
    .catch(() => { root.querySelector(".ob-loading").textContent = "We couldn't load the books just now. Please try again in a minute."; });

  const proj = slug => (D.projects.find(p => p.slug === slug) || { title: slug, stage: "Initiated", slug });
  const countryOf = g => g.country || NOT_SAID;
  const rows = () => D.gifts.filter(g => (f.stage === "All" || proj(g.project).stage === f.stage) && (f.project === "All" || g.project === f.project)
    && (f.country === "All" || countryOf(g) === f.country) && (f.month === "All" || (g.date || "").startsWith(f.month)));
  const sum = (list, st) => list.filter(g => !st || g.status === st).reduce((s, g) => s + g.counted, 0);

  function build() {
    const countries = [...new Set(D.gifts.map(countryOf))].sort((a, b) => (a === NOT_SAID) - (b === NOT_SAID) || a.localeCompare(b));
    const months = [...new Set(D.gifts.map(g => (g.date || "").slice(0, 7)).filter(Boolean))].sort().reverse();
    const withGifts = D.projects.filter(p => D.gifts.some(g => g.project === p.slug));
    const opt = (v, t) => `<option value="${esc(v)}">${esc(t)}</option>`;
    root.innerHTML = `
      <header class="ob-head"><p class="ob-eyebrow">Open Books</p><h1>Every rupee, out in the open</h1>
        <p class="ob-tag">Every gift to Raavanaa, where it came from, which project it went to, and where it was spent.</p></header>
      <section class="ob-tiles" aria-label="Totals">
        <div class="ob-tile main"><span class="lbl">Received</span><b class="big" data-t="rec"></b><small>money that has arrived</small></div>
        <div class="ob-tile"><span class="lbl">Promised</span><b class="big" data-t="pro"></b><small>given on the site, on its way</small></div>
        <div class="ob-tile"><span class="lbl">Gifts</span><b class="big" data-t="n"></b><small data-t="nsub"></small></div>
        <div class="ob-tile"><span class="lbl">Countries</span><b class="big" data-t="c"></b><small>giving from around the world</small></div>
        <div class="ob-tile"><span class="lbl">Spent with receipts</span><b class="big" data-t="out"></b><small>checked by a volunteer</small></div>
        <div class="ob-tile soon"><span class="lbl">Monthly givers</span><b class="big">Coming</b><small>people who give every month</small></div>
        <div class="ob-tile soon"><span class="lbl">Raavanaa Trust Fund</span><b class="big">Coming</b><small>its balance and where it went</small></div>
      </section>
      <section class="ob-panel ob-filters" aria-label="Filters">
        <div class="ob-chips" role="group" aria-label="Stage">${["All", ...STAGES].map(s => `<button type="button" class="ob-chip${s === "All" ? "" : " s-" + s}" data-stage="${s}" aria-pressed="${s === f.stage}">${s === "All" ? "All stages" : s}</button>`).join("")}</div>
        <div class="ob-selects">
          <label><span>Project</span><select id="ob-project">${opt("All", "All projects")}${withGifts.map(p => opt(p.slug, p.title)).join("")}</select></label>
          <label><span>Giving from</span><select id="ob-country">${opt("All", "All countries")}${countries.map(c => opt(c, c)).join("")}</select></label>
          <label><span>Month</span><select id="ob-month">${opt("All", "All months")}${months.map(m => opt(m, monthName(m))).join("")}</select></label>
          <button type="button" class="ob-clear" data-clear hidden>Clear filters</button>
        </div>
      </section>
      <div class="ob-two">
        <section class="ob-panel"><h2>By project</h2><div class="ob-rows" data-by="project"></div>
          <p class="ob-legend"><span><i class="rec"></i>Received</span><span><i class="pro"></i>Promised</span></p></section>
        <section class="ob-panel"><h2>Where gifts come from</h2><div class="ob-rows" data-by="country"></div>
          <p class="ob-note">Givers choose their country on the giving form. We show the country only, never a city.</p></section>
      </div>
      <section class="ob-panel"><h2>By month</h2><div class="ob-months" data-by="month"></div></section>
      <section class="ob-panel"><div class="ob-h2row"><h2>Every gift</h2><button type="button" class="ob-dl" data-dl>Download all (CSV)</button></div>
        <div class="ob-table"><table><thead><tr><th>Date</th><th>Giver</th><th>Project</th><th>From</th><th class="r">Amount</th><th>Status</th></tr></thead><tbody data-by="gifts"></tbody></table></div>
        <p class="ob-note">Names are shown the way each giver chose. Anonymous stays anonymous, and “name only” hides the amount here (it still counts in the totals). We never show phone numbers or emails. Gifts made in other money are counted in rupees at the rate on the day.</p></section>
      <section class="ob-panel"><h2>Money out</h2><div data-by="spent"></div></section>
      <p class="ob-asof">Updated ${dayName(D.as_of.slice(0, 10))}. Questions about any line? <a href="/contact">Ask us</a>.</p>`;
    root.querySelectorAll("[data-stage]").forEach(b => b.onclick = () => { f.stage = b.dataset.stage; draw(); });
    [["ob-project", "project"], ["ob-country", "country"], ["ob-month", "month"]].forEach(([id, k]) => { const s = root.querySelector("#" + id); s.onchange = () => { f[k] = s.value; draw(); }; });
    root.querySelector("[data-clear]").onclick = () => { Object.assign(f, { stage: "All", project: "All", country: "All", month: "All" }); draw(); };
    root.querySelector("[data-dl]").onclick = download;
    draw();
  }

  const bar = (r, p, max) => `<span class="ob-bar"><i class="rec" style="width:${max ? r / max * 100 : 0}%"></i><i class="pro" style="width:${max ? p / max * 100 : 0}%"></i></span>`;
  function group(list, key) {
    const m = new Map();
    list.forEach(g => { const k = key(g), v = m.get(k) || { r: 0, p: 0, n: 0 }; v[g.status === "received" ? "r" : "p"] += g.counted; v.n++; m.set(k, v); });
    return [...m.entries()].sort((a, b) => (b[1].r + b[1].p) - (a[1].r + a[1].p));
  }

  function draw() {
    const list = rows(), rec = sum(list, "received"), pro = sum(list, "promised");
    const pick = (k, v) => root.querySelector(`[data-t="${k}"]`).textContent = v;
    pick("rec", rs(rec)); pick("pro", rs(pro)); pick("n", list.length);
    const np = new Set(list.map(g => g.project)).size;
    pick("nsub", `to ${np} project${np === 1 ? "" : "s"}`);
    pick("c", new Set(list.map(g => g.country).filter(Boolean)).size || "–");
    const out = D.spent.filter(s => (f.project === "All" || s.project === f.project) && (f.stage === "All" || proj(s.project).stage === f.stage) && (f.month === "All" || (s.date || "").startsWith(f.month)));
    pick("out", rs(out.reduce((s, x) => s + x.amount, 0)));
    root.querySelectorAll("[data-stage]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.stage === f.stage)));
    root.querySelector("#ob-project").value = f.project; root.querySelector("#ob-country").value = f.country; root.querySelector("#ob-month").value = f.month;
    root.querySelector("[data-clear]").hidden = f.stage === "All" && f.project === "All" && f.country === "All" && f.month === "All";
    const none = `<p class="ob-empty">No gifts match these filters.</p>`;

    // By project: each links to its page, with its stage and how much of its goal is covered.
    const bp = group(list, g => g.project), maxP = Math.max(0, ...bp.map(([, v]) => v.r + v.p));
    root.querySelector('[data-by="project"]').innerHTML = bp.length ? bp.map(([slug, v]) => { const p = proj(slug), pct = p.goal ? Math.min(100, Math.round(sum(D.gifts.filter(g => g.project === slug)) / p.goal * 100)) : 0;
      return `<div class="ob-row"><a class="name" href="/projects/${esc(slug)}">${esc(p.title)}</a><span class="amt">${rs(v.r + v.p)}</span>${bar(v.r, v.p, maxP)}
        <small class="ob-meta"><span class="ob-pill s-${esc(p.stage)}">${esc(p.stage)}</span>${p.place ? esc(p.place) + " · " : ""}${v.n} gift${v.n === 1 ? "" : "s"}${p.goal ? ` · ${pct}% of its ${short(p.goal)} goal` : ""}</small></div>`; }).join("") : none;

    const bc = group(list, countryOf), maxC = Math.max(0, ...bc.map(([, v]) => v.r + v.p));
    root.querySelector('[data-by="country"]').innerHTML = bc.length ? bc.map(([c, v]) => `<div class="ob-row${c === NOT_SAID ? " quiet" : ""}"><button type="button" class="name" data-pickc="${esc(c)}">${esc(c)}</button><span class="amt">${rs(v.r + v.p)}</span>${bar(v.r, v.p, maxC)}
      <small class="ob-meta">${v.n} gift${v.n === 1 ? "" : "s"}</small></div>`).join("") : none;
    root.querySelectorAll("[data-pickc]").forEach(b => b.onclick = () => { f.country = b.dataset.pickc; draw(); });

    // By month, oldest on the left; undated gifts (added by hand before dates were kept) are counted but not drawn.
    const bm = group(list.filter(g => g.date), g => g.date.slice(0, 7)).sort((a, b) => a[0].localeCompare(b[0])), maxM = Math.max(0, ...bm.map(([, v]) => v.r + v.p));
    const undated = list.filter(g => !g.date);
    root.querySelector('[data-by="month"]').innerHTML = bm.length ? `<div class="ob-cols">${bm.map(([m, v]) => `<button type="button" class="ob-col" data-pickm="${m}" title="${monthName(m)}: ${rs(v.r + v.p)}">
        <span class="v">${short(v.r + v.p)}</span><span class="stack" style="height:${maxM ? (v.r + v.p) / maxM * 120 : 0}px"><i class="pro" style="flex:${v.p}"></i><i class="rec" style="flex:${v.r}"></i></span><span class="m">${monthName(m)}</span></button>`).join("")}</div>
      ${undated.length ? `<p class="ob-note">${undated.length} older gift${undated.length === 1 ? "" : "s"} (${rs(sum(undated))}) came in before we kept dates, so ${undated.length === 1 ? "it isn't" : "they aren't"} drawn here.</p>` : ""}` : none;
    root.querySelectorAll("[data-pickm]").forEach(b => b.onclick = () => { f.month = b.dataset.pickm; draw(); });

    root.querySelector('[data-by="gifts"]').innerHTML = list.length ? list.map(g => { const p = proj(g.project); return `<tr>
      <td class="nw">${esc(g.date ? dayName(g.date) : "Before dates")}</td><td>${esc(g.name)}</td>
      <td><a href="/projects/${esc(g.project)}">${esc(p.title)}</a> <span class="ob-pill s-${esc(p.stage)}">${esc(p.stage)}</span></td>
      <td>${esc(g.country || "–")}</td><td class="r nw">${g.amount == null ? "<i>Not shown</i>" : rs(g.amount)}</td>
      <td><span class="ob-st ${g.status}">${g.status === "received" ? "Received" : "Promised"}</span></td></tr>`; }).join("") : `<tr><td colspan="6">${none}</td></tr>`;

    root.querySelector('[data-by="spent"]').innerHTML = out.length ? `<div class="ob-table"><table><thead><tr><th>Date</th><th>Project</th><th>What it paid for</th><th class="r">Amount</th><th>Receipt</th></tr></thead><tbody>
      ${out.map(s => `<tr><td class="nw">${esc(dayName(s.date))}</td><td><a href="/projects/${esc(s.project)}">${esc(proj(s.project).title)}</a></td><td>${esc(s.item)}</td><td class="r nw">${rs(s.amount)}</td><td>${s.receipt ? "Checked by a volunteer" : "Coming"}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="ob-empty">Nothing spent yet${f.project === "All" ? "" : " on this project"}. Each payment shows here, with its receipt checked by a volunteer, as soon as it is made.</p>`;
  }

  // Download all (CSV): the same lines as the table, so anyone can check the sums themselves.
  function download() {
    const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const lines = [["Date", "Giver", "Project", "Stage", "Giving from", "Amount (Rs)", "Status"].map(q).join(",")]
      .concat(rows().map(g => [g.date, g.name, proj(g.project).title, proj(g.project).stage, g.country, g.amount == null ? "" : g.amount, g.status === "received" ? "Received" : "Promised"].map(q).join(",")));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `raavanaa-open-books-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
})();
