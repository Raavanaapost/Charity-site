// Card payments: PayHere (Sri Lanka, in rupees) or Stripe Checkout (Canadian dollars), whichever is switched on.
//   POST /api/give/checkout   start a payment: sponsor a project, a monthly Smile member gift, or a general gift
//   POST /api/give/payhere    PayHere tells us a payment went through (signed); the gift is recorded here
//   POST /api/give/webhook    Stripe tells us a payment went through (signed); the gift is recorded here
//   GET  /api/give/totals     what has been given by card to each project (names only with permission)
//   GET  /api/give/session    a short summary for the thank-you page
// PayHere needs PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET in Netlify (PAYHERE_LIVE=yes for real money;
// without it the PayHere sandbox is used). Stripe needs STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.
// PayHere wins when both are set. Until one is set, the site says card payments are coming soon and nothing is charged.
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import data from "../../projects.json" with { type: "json" };
import siteData from "../../site.json" with { type: "json" };
import {
  checkoutParams, currencyOf, newOrderId, openFor, payhereFields, payhereUrl, readRequest, slugOf,
  toProjectUnits, verifyPayhere, verifyStripe, TRIBUTE_WORDS, type Cur, type Project, type Provider, type Tribute,
} from "../lib/give-core.mts";

const json = (body: unknown, status = 200, cache = "no-store") => Response.json(body, { status, headers: { "Cache-Control": cache } });
const projects = ((data as { projects?: Project[] }).projects || []).filter((p) => p && p.title);
const find = (slug: string) => projects.find((p) => slugOf(p) === slug);
const FRIEND = "A friend of Raavanaa";
// Sri Lankan rupees to one Canadian dollar, set by the team in site.json (only used for Stripe gifts in CAD).
const RATE = Number((siteData as { rate_lkr_per_cad?: unknown }).rate_lkr_per_cad) || 0;

const env = (k: string) => (Netlify.env.get(k) || "").trim();
const payhereOn = () => !!(env("PAYHERE_MERCHANT_ID") && env("PAYHERE_MERCHANT_SECRET"));
const stripeOn = () => !!env("STRIPE_SECRET_KEY");
const providerOf = (): Provider | null => (payhereOn() ? "payhere" : stripeOn() ? "stripe" : null);

async function stripe(path: string, body?: URLSearchParams) {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) throw Object.assign(new Error("not configured"), { code: 503 });
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body,
  });
  const out = await r.json();
  if (!r.ok) throw Object.assign(new Error(out?.error?.message || "Stripe error"), { code: 502 });
  return out;
}

// Gifts count only in their own world: real payments on the live site, test payments everywhere else.
const liveSite = (context: Context, provider: Provider | null = providerOf()) =>
  context.deploy?.context === "production" &&
  (provider === "payhere" ? env("PAYHERE_LIVE").toLowerCase() === "yes" : env("STRIPE_SECRET_KEY").startsWith("sk_live_"));

// Card gifts already recorded for a project, in the project's own currency.
async function paidFor(db: ReturnType<typeof getDatabase>, p: Project, live: boolean) {
  const rows = await db.sql<{ currency: string; cents: number }>`
    SELECT currency, COALESCE(SUM(amount_cents), 0)::bigint AS cents FROM gifts
    WHERE kind = 'project' AND project_slug = ${slugOf(p)} AND livemode = ${live} GROUP BY currency`;
  return rows.reduce((s, r) => s + toProjectUnits(p, Number(r.cents), r.currency, RATE), 0);
}

async function checkout(req: Request, context: Context) {
  const provider = providerOf();
  if (!provider) return json({ ok: false, error: "Card payments are coming soon. Please check back shortly." }, 503);
  const cur: Cur = currencyOf(provider);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read the form." }, 400); }
  if (String(body["bot-field"] || "")) return json({ ok: false, error: "Something went wrong." }, 400);
  const g = readRequest(body, cur);
  if (typeof g === "string") return json({ ok: false, error: g }, 400);
  const live = liveSite(context, provider);

  let title = "";
  if (g.kind === "project") {
    const p = find(g.slug);
    const db = getDatabase();
    const open = p ? openFor(p, await paidFor(db, p, live), RATE, cur) : null;
    if (!p || !open) return json({ ok: false, error: "This project isn't taking gifts right now. It may already be fully covered." }, 409);
    if (g.amountCents > open.leftCents) g.amountCents = open.leftCents; // never more than what is still needed
    if (g.amountCents < 100) return json({ ok: false, error: "This project is fully covered. Thank you!" }, 409);
    title = String(p.title);
  }
  const origin = new URL(req.url).origin;

  if (provider === "payhere") {
    // Remember the order, so PayHere's confirmation can be matched to what the giver chose.
    const orderId = newOrderId();
    await getDatabase().sql`INSERT INTO give_orders (order_id, kind, project_slug, amount_cents, fee_cents, currency, display_name, show_name, email, livemode, tribute)
      VALUES (${orderId}, ${g.kind}, ${g.slug}, ${g.amountCents}, ${g.feeCents}, 'lkr', ${g.name}, ${g.showName}, ${g.email}, ${live}, ${g.tribute ? JSON.stringify(g.tribute) : null})`;
    const fields = payhereFields(g, { origin, title, orderId, merchantId: env("PAYHERE_MERCHANT_ID"), secret: env("PAYHERE_MERCHANT_SECRET") });
    // Real money only on the live site with PAYHERE_LIVE=yes; the draft and previews always use PayHere's sandbox.
    return json({ ok: true, form: { action: payhereUrl(!live), fields } });
  }

  try {
    const s = await stripe("checkout/sessions", checkoutParams(g, origin, title));
    return json({ ok: true, url: s.url });
  } catch (e) {
    return json({ ok: false, error: "We couldn't start the payment. Please try again in a moment." }, (e as { code?: number }).code || 502);
  }
}

// PayHere's notification (a form post). status_code: 2 paid, 0 pending, -1 cancelled, -2 failed, -3 charged back.
// A monthly gift arrives here each month with the same order_id, a new payment_id and its subscription_id.
async function payhereNotify(req: Request) {
  const merchantId = env("PAYHERE_MERCHANT_ID"), secret = env("PAYHERE_MERCHANT_SECRET");
  if (!merchantId || !secret) return new Response("Not configured", { status: 503 });
  const f = Object.fromEntries([...(await req.formData()).entries()].map(([k, v]) => [k, String(v)])) as Record<string, string>;
  if (!verifyPayhere(f, merchantId, secret)) return new Response("Bad signature", { status: 400 });
  const db = getDatabase();
  const [o] = await db.sql<{ order_id: string; kind: string; project_slug: string; amount_cents: number; fee_cents: number; display_name: string; show_name: boolean; email: string; livemode: boolean; tribute: unknown }>`
    SELECT order_id, kind, project_slug, amount_cents, fee_cents, display_name, show_name, email, livemode, tribute FROM give_orders WHERE order_id = ${String(f.order_id)}`;
  if (!o) return new Response("Unknown order", { status: 404 });
  const status = Number(f.status_code);
  const sub = String(f.subscription_id || "");
  const word = status === 2 ? "paid" : status === 0 ? "pending" : status === -3 ? "charged_back" : status === -1 ? "cancelled" : "failed";
  await db.sql`UPDATE give_orders SET status = ${word}, payment_id = ${String(f.payment_id || "")}, updated_at = NOW() WHERE order_id = ${o.order_id}`;

  if (status === 2 && String(f.payhere_currency).toUpperCase() === "LKR") {
    const paid = Math.round(parseFloat(f.payhere_amount) * 100) || 0;
    const amount = Math.min(paid, Number(o.amount_cents) || paid); // only what reaches the cause counts, not the fee
    if (o.kind === "member" && sub) {
      await db.sql`INSERT INTO members (subscription_id, display_name, show_name, email, monthly_cents, fee_cents, livemode, provider)
        VALUES (${sub}, ${o.display_name}, ${o.show_name}, ${o.email}, ${Number(o.amount_cents)}, ${Number(o.fee_cents)}, ${o.livemode}, 'payhere')
        ON CONFLICT (subscription_id) DO NOTHING`;
    }
    if (paid > 0 && f.payment_id) {
      await db.sql`INSERT INTO gifts (stripe_id, kind, project_slug, amount_cents, paid_cents, currency, display_name, show_name, email, subscription_id, livemode, provider, tribute)
        VALUES (${"ph_" + String(f.payment_id)}, ${o.kind}, ${o.project_slug}, ${amount}, ${paid}, 'lkr', ${o.display_name}, ${o.show_name}, ${o.email}, ${sub}, ${o.livemode}, 'payhere', ${o.tribute ? JSON.stringify(o.tribute) : null})
        ON CONFLICT (stripe_id) DO NOTHING`;
    }
  } else if (status === -3 && f.payment_id) {
    // A chargeback: the money went back, so the gift no longer counts.
    await db.sql`DELETE FROM gifts WHERE stripe_id = ${"ph_" + String(f.payment_id)}`;
  }
  // A monthly gift that was cancelled or has stopped (item_rec_status -1 cancelled, -2 failed).
  if (sub && Number(f.item_rec_status) < 0) await db.sql`UPDATE members SET status = 'canceled', updated_at = NOW() WHERE subscription_id = ${sub}`;
  return new Response("ok");
}

async function webhook(req: Request) {
  const secret = env("STRIPE_WEBHOOK_SECRET");
  if (!secret) return new Response("Not configured", { status: 503 });
  const payload = await req.text();
  if (!(await verifyStripe(payload, req.headers.get("stripe-signature") || "", secret))) return new Response("Bad signature", { status: 400 });
  const ev = JSON.parse(payload);
  const o = ev.data?.object || {};
  const db = getDatabase();
  const live = !!ev.livemode;

  if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") {
    const m = o.metadata || {};
    const show = m.show_name === "yes";
    const email = String(o.customer_details?.email || o.customer_email || "").slice(0, 120);
    if (o.mode === "subscription") {
      // A new monthly Smile member. Each month's payment is recorded from the invoice below.
      await db.sql`INSERT INTO members (subscription_id, display_name, show_name, email, monthly_cents, fee_cents, livemode)
        VALUES (${String(o.subscription)}, ${String(m.name || "")}, ${show}, ${email}, ${Number(m.amount_cents) || 0}, ${Number(m.fee_cents) || 0}, ${live})
        ON CONFLICT (subscription_id) DO NOTHING`;
    } else if (o.payment_status === "paid") {
      const paid = Number(o.amount_total) || 0;
      const amount = Math.min(paid, Number(m.amount_cents) || paid);
      await db.sql`INSERT INTO gifts (stripe_id, kind, project_slug, amount_cents, paid_cents, currency, display_name, show_name, email, livemode)
        VALUES (${String(o.id)}, ${m.kind === "project" ? "project" : "general"}, ${String(m.project || "")}, ${amount}, ${paid}, ${String(o.currency || "cad")},
                ${String(m.name || "")}, ${show}, ${email}, ${live})
        ON CONFLICT (stripe_id) DO NOTHING`;
    }
  } else if (ev.type === "invoice.paid" || ev.type === "invoice.payment_succeeded") {
    const sub = String(o.subscription || o.parent?.subscription_details?.subscription || "");
    const paid = Number(o.amount_paid) || 0;
    if (sub && paid > 0) {
      const [mem] = await db.sql<{ display_name: string; show_name: boolean; email: string; monthly_cents: number }>`SELECT display_name, show_name, email, monthly_cents FROM members WHERE subscription_id = ${sub}`;
      const meta = o.parent?.subscription_details?.metadata || o.subscription_details?.metadata || {};
      const amount = Math.min(paid, (mem && Number(mem.monthly_cents)) || Number(meta.amount_cents) || paid);
      await db.sql`INSERT INTO gifts (stripe_id, kind, amount_cents, paid_cents, currency, display_name, show_name, email, subscription_id, livemode)
        VALUES (${String(o.id)}, 'member', ${amount}, ${paid}, ${String(o.currency || "cad")}, ${mem ? mem.display_name : String(meta.name || "")},
                ${mem ? mem.show_name : meta.show_name === "yes"}, ${mem ? mem.email : String(o.customer_email || "")}, ${sub}, ${live})
        ON CONFLICT (stripe_id) DO NOTHING`;
    }
  } else if (ev.type === "customer.subscription.deleted") {
    await db.sql`UPDATE members SET status = 'canceled', updated_at = NOW() WHERE subscription_id = ${String(o.id)}`;
  }
  return new Response("ok");
}

async function totals(context: Context) {
  const provider = providerOf();
  if (!provider) return json({ enabled: false, projects: {}, members: 0 }, 200, "public, max-age=60");
  const db = getDatabase();
  const live = liveSite(context, provider);
  const rows = await db.sql<{ project_slug: string; amount_cents: number; currency: string; display_name: string; show_name: boolean; tribute: Tribute | null }>`
    SELECT project_slug, amount_cents, currency, display_name, show_name, tribute FROM gifts WHERE kind = 'project' AND livemode = ${live} ORDER BY created_at`;
  const [m] = await db.sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM members WHERE status = 'active' AND livemode = ${live}`;
  const out: Record<string, { cents: number; gifts: { name: string; amount: number; tribute?: string }[] }> = {};
  for (const r of rows) {
    const p = find(r.project_slug);
    if (!p) continue;
    // Amounts are given in the project's own currency, so they add up with its budget.
    const units = toProjectUnits(p, Number(r.amount_cents), r.currency, RATE);
    if (!units) continue;
    const t = (out[r.project_slug] ||= { cents: 0, gifts: [] });
    t.cents += Number(r.amount_cents);
    const tr = r.tribute && r.tribute.show && TRIBUTE_WORDS[r.tribute.kind] ? `${TRIBUTE_WORDS[r.tribute.kind]} ${r.tribute.name}` : "";
    t.gifts.push({ name: r.show_name && r.display_name ? r.display_name : FRIEND, amount: Math.round(units * 100) / 100, ...(tr ? { tribute: tr } : {}) });
  }
  return json({ enabled: true, provider, currency: currencyOf(provider).toUpperCase(), test: !live, rate: RATE, projects: out, members: m ? Number(m.n) : 0 }, 200, "public, max-age=30");
}

async function session(req: Request) {
  const q = new URL(req.url).searchParams;
  const order = q.get("order") || "";
  if (order) {
    // PayHere: what the giver chose, and whether PayHere has confirmed it yet.
    if (!/^RV[A-Z0-9]{6,24}$/.test(order)) return json({ ok: false }, 400);
    const [o] = await getDatabase().sql<{ kind: string; project_slug: string; amount_cents: number; fee_cents: number; status: string; livemode: boolean; tribute: Tribute | null }>`
      SELECT kind, project_slug, amount_cents, fee_cents, status, livemode, tribute FROM give_orders WHERE order_id = ${order}`;
    if (!o) return json({ ok: false }, 404);
    const p = o.kind === "project" ? find(o.project_slug) : undefined;
    return json({ ok: true, provider: "payhere", currency: "LKR", kind: o.kind, amount: Number(o.amount_cents) / 100, paid: (Number(o.amount_cents) + Number(o.fee_cents)) / 100,
      project: p ? { title: p.title, slug: slugOf(p) } : null, status: o.status, test: !o.livemode,
      tribute: o.tribute ? { kind: o.tribute.kind, name: o.tribute.name } : null });
  }
  const id = q.get("id") || "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return json({ ok: false }, 400);
  try {
    const s = await stripe(`checkout/sessions/${id}`);
    const m = s.metadata || {};
    const p = m.kind === "project" ? find(String(m.project || "")) : undefined;
    return json({ ok: true, provider: "stripe", currency: "CAD", kind: m.kind, amount: (Number(m.amount_cents) || Number(s.amount_total) || 0) / 100, paid: (Number(s.amount_total) || 0) / 100,
      project: p ? { title: p.title, slug: slugOf(p) } : null, status: s.payment_status || s.status, test: !s.livemode });
  } catch {
    return json({ ok: false }, 502);
  }
}

export default async (req: Request, context: Context) => {
  const route = new URL(req.url).pathname.replace(/\/+$/, "").split("/").pop();
  try {
    if (route === "checkout" && req.method === "POST") return await checkout(req, context);
    if (route === "payhere" && req.method === "POST") return await payhereNotify(req);
    if (route === "webhook" && req.method === "POST") return await webhook(req);
    if (route === "totals" && req.method === "GET") return await totals(context);
    if (route === "session" && req.method === "GET") return await session(req);
    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error("give:", e);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
};

export const config: Config = {
  path: ["/api/give/checkout", "/api/give/payhere", "/api/give/webhook", "/api/give/totals", "/api/give/session"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 30 },
};
