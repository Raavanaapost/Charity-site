// Card payments through Stripe Checkout.
//   POST /api/give/checkout   start a payment: sponsor a project, a monthly Smile member gift, or a general gift
//   POST /api/give/webhook    Stripe tells us a payment went through; the gift is recorded here (and only here)
//   GET  /api/give/totals     what has been given by card to each project (names only with permission)
//   GET  /api/give/session    a short summary for the thank-you page
// Needs two environment variables in Netlify: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.
// Until they are set, the site says card payments are coming soon and nothing is charged.
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import data from "../../projects.json" with { type: "json" };
import siteData from "../../site.json" with { type: "json" };
import { centsPerUnit, checkoutParams, openFor, readRequest, slugOf, takesCards, verifyStripe, type Project } from "../lib/give-core.mts";

const json = (body: unknown, status = 200, cache = "no-store") => Response.json(body, { status, headers: { "Cache-Control": cache } });
const projects = ((data as { projects?: Project[] }).projects || []).filter((p) => p && p.title);
const find = (slug: string) => projects.find((p) => slugOf(p) === slug);
const FRIEND = "A friend of Raavanaa";
// Sri Lankan rupees to one Canadian dollar, set by the team in site.json (0 = rupee projects don't take cards).
const RATE = Number((siteData as { rate_lkr_per_cad?: unknown }).rate_lkr_per_cad) || 0;

async function stripe(path: string, body?: URLSearchParams) {
  const key = Netlify.env.get("STRIPE_SECRET_KEY");
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

// Gifts count only in their own world: live payments on the live site, test payments everywhere else.
const liveSite = (context: Context) => context.deploy?.context === "production" && (Netlify.env.get("STRIPE_SECRET_KEY") || "").startsWith("sk_live_");

async function paidFor(db: ReturnType<typeof getDatabase>, slug: string, live: boolean) {
  const [row] = await db.sql<{ cents: number }>`SELECT COALESCE(SUM(amount_cents), 0)::int AS cents FROM gifts WHERE kind = 'project' AND project_slug = ${slug} AND livemode = ${live}`;
  return row ? Number(row.cents) : 0;
}

async function checkout(req: Request, context: Context) {
  if (!Netlify.env.get("STRIPE_SECRET_KEY")) return json({ ok: false, error: "Card payments are coming soon. Please check back shortly." }, 503);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read the form." }, 400); }
  if (String(body["bot-field"] || "")) return json({ ok: false, error: "Something went wrong." }, 400);
  const g = readRequest(body);
  if (typeof g === "string") return json({ ok: false, error: g }, 400);

  let title = "";
  if (g.kind === "project") {
    const p = find(g.slug);
    const db = getDatabase();
    const open = openFor(p, p ? await paidFor(db, g.slug, liveSite(context)) : 0, RATE);
    if (!p || !open) return json({ ok: false, error: "This project isn't taking gifts right now. It may already be fully covered." }, 409);
    if (g.amountCents > open.leftCents) g.amountCents = open.leftCents; // never more than what is still needed
    if (g.amountCents < 100) return json({ ok: false, error: "This project is fully covered. Thank you!" }, 409);
    title = String(p.title);
  }
  const origin = new URL(req.url).origin;
  try {
    const s = await stripe("checkout/sessions", checkoutParams(g, origin, title));
    return json({ ok: true, url: s.url });
  } catch (e) {
    return json({ ok: false, error: "We couldn't start the payment. Please try again in a moment." }, (e as { code?: number }).code || 502);
  }
}

async function webhook(req: Request) {
  const secret = Netlify.env.get("STRIPE_WEBHOOK_SECRET");
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
  if (!Netlify.env.get("STRIPE_SECRET_KEY")) return json({ enabled: false, projects: {}, members: 0 }, 200, "public, max-age=60");
  const db = getDatabase();
  const live = liveSite(context);
  const rows = await db.sql<{ project_slug: string; amount_cents: number; display_name: string; show_name: boolean }>`
    SELECT project_slug, amount_cents, display_name, show_name FROM gifts WHERE kind = 'project' AND livemode = ${live} ORDER BY created_at`;
  const [m] = await db.sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM members WHERE status = 'active' AND livemode = ${live}`;
  const out: Record<string, { cents: number; gifts: { name: string; amount: number }[] }> = {};
  for (const r of rows) {
    const p = find(r.project_slug);
    if (!p || !takesCards(p, RATE)) continue;
    const t = (out[r.project_slug] ||= { cents: 0, gifts: [] });
    t.cents += Number(r.amount_cents);
    // Amounts are given in the project's own currency, so they add up with its budget.
    t.gifts.push({ name: r.show_name && r.display_name ? r.display_name : FRIEND, amount: Math.round((Number(r.amount_cents) / centsPerUnit(p, RATE)) * 100) / 100 });
  }
  return json({ enabled: true, test: !live, rate: RATE, projects: out, members: m ? Number(m.n) : 0 }, 200, "public, max-age=30");
}

async function session(req: Request) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return json({ ok: false }, 400);
  try {
    const s = await stripe(`checkout/sessions/${id}`);
    const m = s.metadata || {};
    const p = m.kind === "project" ? find(String(m.project || "")) : undefined;
    return json({ ok: true, kind: m.kind, amount: (Number(m.amount_cents) || Number(s.amount_total) || 0) / 100, paid: (Number(s.amount_total) || 0) / 100,
      project: p ? { title: p.title, slug: slugOf(p) } : null, status: s.payment_status || s.status, test: !s.livemode });
  } catch {
    return json({ ok: false }, 502);
  }
}

export default async (req: Request, context: Context) => {
  const route = new URL(req.url).pathname.replace(/\/+$/, "").split("/").pop();
  try {
    if (route === "checkout" && req.method === "POST") return await checkout(req, context);
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
  path: ["/api/give/checkout", "/api/give/webhook", "/api/give/totals", "/api/give/session"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 30 },
};
