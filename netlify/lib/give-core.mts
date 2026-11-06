// Card payments (Stripe): the parts that don't touch the network or the database,
// kept here so they can be tested on their own. Used by netlify/functions/give.mts.

export type Project = {
  title?: string; slug?: string; status?: string; verified?: boolean; hidden?: boolean;
  currency?: string; goal?: unknown; budget?: { item?: string; amount?: unknown }[];
  funders?: { name?: string; amount?: unknown }[];
};

export type GiveRequest = {
  kind: "project" | "general" | "member";
  slug: string;
  amountCents: number;   // what goes to the cause
  feeCents: number;      // optional extra so the card fee doesn't come out of the gift
  name: string;
  showName: boolean;
  email: string;
};

export const MIN_CENTS = 500;        // $5
export const MAX_CENTS = 500000;     // $5,000
export const MEMBER_MAX_CENTS = 50000;

const numOf = (v: unknown) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
export const slugify = (s: unknown) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
export const slugOf = (p: Project) => (p.slug ? slugify(p.slug) : slugify(p.title));
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// Card payments are in Canadian dollars. A project budgeted in Sri Lankan rupees takes them too once the
// team has set an exchange rate (site.json "rate_lkr_per_cad"); the gift is shown on the project in rupees.
export const isRupees = (p: Project) => /rs|lkr|රු|ரூ/i.test(p.currency || "");
export const takesCards = (p: Project, rate = 0) => !p.currency || /^\s*\$\s*$/.test(p.currency) || (isRupees(p) && rate > 0);
// One unit of the project's own currency, in Canadian cents.
export const centsPerUnit = (p: Project, rate = 0) => (isRupees(p) ? 100 / rate : 100);

export const goalOf = (p: Project) =>
  numOf(p.goal) || (p.budget || []).filter((x) => x && x.item).reduce((s, x) => s + numOf(x.amount), 0);
export const listedOf = (p: Project) =>
  (p.funders || []).filter((x) => x && x.name).reduce((s, x) => s + numOf(x.amount), 0);

// A project can be sponsored by card while it is public, verified, still being planned,
// has a budget in dollars and is not yet fully covered.
export function openFor(p: Project | undefined, paidCents: number, rate = 0) {
  if (!p || p.hidden || !p.verified || /complete/i.test(p.status || "") || !takesCards(p, rate)) return null;
  const unit = centsPerUnit(p, rate);
  const goal = Math.round(goalOf(p) * unit);
  if (!goal) return null;
  const left = goal - Math.round(listedOf(p) * unit) - paidCents;
  return left > 0 ? { goalCents: goal, leftCents: left } : null;
}

// An estimate of Stripe's fee on a Canadian card (about 2.9% + 30¢), so a giver can choose to cover it.
export const feeFor = (cents: number) => Math.max(0, Math.ceil((cents + 30) / (1 - 0.029)) - cents);

export function readRequest(body: Record<string, unknown>): GiveRequest | string {
  const kind = String(body.kind || "");
  if (!["project", "general", "member"].includes(kind)) return "Please choose what you would like to give to.";
  const dollars = numOf(body.amount);
  const amountCents = Math.round(dollars * 100);
  const max = kind === "member" ? MEMBER_MAX_CENTS : MAX_CENTS;
  if (amountCents < MIN_CENTS) return "The smallest gift by card is $5.";
  if (amountCents > max) return `For gifts over $${(max / 100).toLocaleString("en-US")}, please contact us and we'll arrange it.`;
  const feeCents = body.cover_fee === true || body.cover_fee === "yes" ? feeFor(amountCents) : 0;
  const showName = body.show_name === true || body.show_name === "yes";
  const name = clip(body.name, 60);
  const email = clip(body.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please check your email address.";
  return { kind: kind as GiveRequest["kind"], slug: kind === "project" ? slugify(body.project) : "", amountCents, feeCents, name, showName: showName && !!name, email };
}

// Form fields for Stripe's "create a Checkout Session" call.
export function checkoutParams(g: GiveRequest, origin: string, title: string) {
  const f = new URLSearchParams();
  const total = g.amountCents + g.feeCents;
  const what = g.kind === "project" ? `Sponsor a smile: ${title}` : g.kind === "member" ? "Smile member: monthly gift" : "A gift to Raavanaa Community";
  const meta: Record<string, string> = {
    kind: g.kind, project: g.slug, amount_cents: String(g.amountCents), fee_cents: String(g.feeCents),
    name: g.name, show_name: g.showName ? "yes" : "no",
  };
  f.set("mode", g.kind === "member" ? "subscription" : "payment");
  f.set("line_items[0][quantity]", "1");
  f.set("line_items[0][price_data][currency]", "cad");
  f.set("line_items[0][price_data][unit_amount]", String(total));
  f.set("line_items[0][price_data][product_data][name]", what.slice(0, 250));
  if (g.kind === "member") f.set("line_items[0][price_data][recurring][interval]", "month");
  f.set("success_url", `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`);
  f.set("cancel_url", g.kind === "project" ? `${origin}/give?project=${encodeURIComponent(g.slug)}&cancelled=1` : `${origin}/give?cancelled=1`);
  if (g.email) f.set("customer_email", g.email);
  f.set("billing_address_collection", "auto");
  for (const [k, v] of Object.entries(meta)) {
    f.set(`metadata[${k}]`, v);
    if (g.kind === "member") f.set(`subscription_data[metadata][${k}]`, v);
  }
  if (g.kind !== "member") {
    f.set("submit_type", "donate");
    f.set("payment_intent_data[description]", what.slice(0, 250));
  }
  return f;
}

// Checks that a webhook really came from Stripe (the Stripe-Signature header), within 5 minutes.
export async function verifyStripe(payload: string, header: string, secret: string, now = Date.now()) {
  const parts = Object.fromEntries(header.split(",").map((kv) => { const i = kv.indexOf("="); return [kv.slice(0, i).trim(), kv.slice(i + 1)]; }));
  const t = Number(parts.t);
  const sigs = header.split(",").filter((kv) => kv.trim().startsWith("v1=")).map((kv) => kv.trim().slice(3));
  if (!t || !sigs.length || Math.abs(now / 1000 - t) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => s.length === hex.length && timingSafe(s, hex));
}
const timingSafe = (a: string, b: string) => { let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
