// Follow every rupee (SURESH 26 Nov 2026, option B). Public, no sign-in.
//   GET  /api/books        for each project: checked costs (with their budget line and receipt), how many wait for a
//                          check, checked hand-overs to the organiser, the bank details of received gifts (what was
//                          sent, the rupees that arrived, the bank fee) and whether the books are closed.
//   GET  /got/:token       the organiser's own page: "I received Rs 61,000 from Raavanaa on 25 Nov" + their name + tick
//   POST /api/got/:token   { name, agree: true }  the organiser confirms the hand-over
// Only what a second team member has checked shows in public. Phone numbers, bank details and emails never leave here.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { photoUrl } from "../lib/day.mts";
import data from "../../projects.json" with { type: "json" };

type P = { slug?: string; title?: string; currency?: string };
const PROJECTS: P[] = ((data as { projects?: P[] }).projects || []).filter((p) => p && p.slug);
const json = (body: unknown, status = 200, cache = "no-store") => Response.json(body, { status, headers: { "Cache-Control": cache } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const day = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");
const n = (v: unknown) => Number(v) || 0;

const page = (title: string, body: string) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)} · Raavanaa</title>
<style>:root{--bg:#f6efe2;--card:#fffaf2;--ink:#2b2520;--soft:#6d6157;--red:#b4402a;--line:#e7dccb;--green:#2f7d4f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:32rem;margin:0 auto;padding:20px 16px 48px}.logo{display:block;width:150px;margin:6px auto 18px}
.card{background:var(--card);border-radius:18px;box-shadow:0 8px 30px #0001;padding:22px 20px;margin:0 0 16px}
h1{font-size:1.4rem;line-height:1.3;margin:0 0 .5rem}.soft{color:var(--soft);font-size:.92rem}
.big{font-size:2rem;font-weight:800;color:var(--red);margin:.2rem 0}dl{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;margin:12px 0}dt{color:var(--soft)}dd{margin:0;font-weight:600}
label{display:block;font-weight:600;margin:14px 0 6px}input[type=text]{width:100%;font:inherit;padding:12px;border:1.5px solid var(--line);border-radius:12px;background:#fff}
.tick{display:flex;gap:10px;align-items:flex-start;font-weight:500}.tick input{width:22px;height:22px;margin-top:2px;flex:none}
.btn{display:block;width:100%;border:0;border-radius:14px;background:var(--red);color:#fff;font:inherit;font-weight:700;font-size:1.1rem;padding:15px;margin-top:16px}
.ok{background:#e8f4ec;color:var(--green);border-radius:12px;padding:14px;font-weight:600}</style></head>
<body><main><img class="logo" src="/img/logo-450.webp?v=6" alt="Raavanaa" onerror="this.style.display='none'">${body}</main></body></html>`,
  { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

const longDay = (d: string) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");
const HOW: Record<string, string> = { bank: "Bank transfer", cash: "Cash in hand", other: "Another way" };

async function books() {
  const db = getDatabase();
  const out: Record<string, any> = {};
  const of = (slug: string) => (out[slug] ||= { spent: [], waiting: 0, handovers: [], handover_waiting: 0, gifts: {}, closed: null });
  // Costs: receipts from the organiser's phone link and costs the team entered in the portal (Money books).
  const costs = (await db.sql`SELECT id, slug, title, body, image, amount, line, spent_on, created_at, checked_by, checked_at FROM project_updates
    WHERE kind = 'receipt' AND NOT hidden ORDER BY COALESCE(spent_on, created_at::date), id`) as Record<string, any>[];
  for (const c of costs) {
    const b = of(c.slug);
    if (!c.checked_at) { b.waiting++; continue; }
    b.spent.push({ id: c.id, date: day(c.spent_on || c.created_at), item: c.title, note: c.body || "", line: c.line || "", amount: n(c.amount), receipt: photoUrl(c.image), checked_by: c.checked_by, checked_on: day(c.checked_at) });
  }
  const hand = (await db.sql`SELECT slug, amount, handed_on, method, to_name, to_role, confirmed_at, confirmed_name, checked_by, checked_at FROM money_handovers
    WHERE NOT hidden ORDER BY handed_on NULLS LAST, id`) as Record<string, any>[];
  for (const h of hand) {
    const b = of(h.slug);
    if (!h.checked_at) { b.handover_waiting++; continue; }
    b.handovers.push({ date: day(h.handed_on), amount: n(h.amount), how: HOW[h.method] || "", to: h.to_name, role: h.to_role, confirmed: day(h.confirmed_at), checked_by: h.checked_by, checked_on: day(h.checked_at) });
  }
  // Gifts that reached the bank: what was sent, the rupees that arrived and the fee (by gift number, no names here).
  const gifts = (await db.sql`SELECT ref, project_slug, currency, sent_value, arrived_lkr, fee_lkr, received_on FROM give_requests
    WHERE status = 'received' AND project_slug <> ''`) as Record<string, any>[];
  for (const g of gifts) of(g.project_slug).gifts[g.ref] = { currency: g.currency || "", sent: n(g.sent_value), arrived: n(g.arrived_lkr), fee: n(g.fee_lkr), received: day(g.received_on) };
  const closed = (await db.sql`SELECT slug, leftover_amount, leftover_to, closed_by, closed_at FROM money_books WHERE closed_at IS NOT NULL`) as Record<string, any>[];
  for (const c of closed) of(c.slug).closed = { leftover: n(c.leftover_amount), to: c.leftover_to, by: c.closed_by, on: day(c.closed_at) };
  return out;
}

export default async (req: Request) => {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  try {
    if (path === "/api/books" && req.method === "GET") return json({ projects: await books() }, 200, "public, max-age=20");
    const m = /^\/(api\/)?got\/([0-9a-f]{32})$/.exec(path);
    if (!m) return json({ error: "Not found" }, 404);
    const db = getDatabase(), token = m[2];
    const [h] = (await db.sql`SELECT * FROM money_handovers WHERE token = ${token} AND NOT hidden`) as Record<string, any>[];
    if (!h) return m[1] ? json({ ok: false, error: "This link is not known." }, 404) : page("Link not found", `<section class="card"><h1>This link is not active</h1><p>Please ask the Raavanaa volunteer for a new one.</p></section>`);
    const p = PROJECTS.find((x) => x.slug === h.slug), cur = (p && p.currency) || "Rs ";
    const amount = `${cur}${Math.round(n(h.amount)).toLocaleString("en-US")}`;
    if (m[1] && req.method === "POST") {
      let b: Record<string, unknown> = {};
      try { b = await req.json(); } catch { /* empty */ }
      const name = clip(b.name, 80);
      if (!name || b.agree !== true) return json({ ok: false, error: "Tick the box and type your name." }, 400);
      await db.sql`UPDATE money_handovers SET confirmed_at = COALESCE(confirmed_at, NOW()), confirmed_name = CASE WHEN confirmed_at IS NULL THEN ${name} ELSE confirmed_name END WHERE id = ${h.id}`;
      await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${"got:" + token.slice(0, 8)}, 'handover.confirm', ${h.slug}, ${JSON.stringify({ id: h.id, name })}::jsonb)`;
      return json({ ok: true });
    }
    if (m[1] || req.method !== "GET") return json({ error: "Not allowed" }, 405);
    const facts = `<dl><dt>Project</dt><dd>${esc(p ? p.title : h.slug)}</dd><dt>Amount</dt><dd>${esc(amount)}</dd>${h.handed_on ? `<dt>Date</dt><dd>${esc(longDay(day(h.handed_on)))}</dd>` : ""}${h.method ? `<dt>How</dt><dd>${esc(HOW[h.method] || h.method)}</dd>` : ""}<dt>To</dt><dd>${esc(h.to_name)}${h.to_role ? `, ${esc(h.to_role)}` : ""}</dd></dl>`;
    if (h.confirmed_at) return page("Money received", `<section class="card"><p class="soft" style="margin:0">Money from Raavanaa</p><p class="big">${esc(amount)}</p>${facts}
      <p class="ok">Thank you. ${esc(h.confirmed_name)} confirmed this on ${esc(longDay(day(h.confirmed_at)))}.</p>
      <p class="soft">Please send a photo of each bill from your day link within 14 days. Anything left over goes back to Raavanaa and is shown on the project's money page.</p></section>`);
    return page("Did you receive the money?", `<section class="card"><p class="soft" style="margin:0">Money from Raavanaa</p><p class="big">${esc(amount)}</p>${facts}
      <form id="f"><label for="name">Your name</label><input type="text" id="name" name="name" maxlength="80" value="${esc(h.to_name)}" required>
      <label class="tick"><input type="checkbox" id="agree"> <span>I received ${esc(amount)} from Raavanaa for this project. I will use it only for the project and send a photo of every bill within 14 days.</span></label>
      <button class="btn" type="submit">I received it</button><p id="msg" class="soft" hidden></p></form></section>
      <p class="soft" style="text-align:center">If the amount is wrong, do not tick. Reply to the Raavanaa volunteer instead.</p>
<script>
(() => { const f = document.getElementById("f"), msg = document.getElementById("msg");
  f.onsubmit = async e => { e.preventDefault(); msg.hidden = false;
    if (!document.getElementById("agree").checked) { msg.textContent = "Please tick the box first."; return; }
    const r = await fetch("/api/got/${token}", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name.value, agree: true }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (d.ok) location.reload(); else msg.textContent = d.error || "Could not save just now. Please try again."; };
})();
</script>`);
  } catch (e) {
    console.log("books:", (e as Error).message);
    return path === "/api/books" ? json({ projects: {} }, 200, "public, max-age=5") : json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
};

export const config: Config = { path: ["/api/books", "/got/*", "/api/got/*"] };
