// Card payments (PayHere in Sri Lankan rupees, or Stripe in Canadian dollars): the parts that don't touch
// the network or the database, kept here so they can be tested on their own. Used by netlify/functions/give.mts.
import { createHash } from "node:crypto";

// Which card service is switched on. PayHere wins when both are set up (SURESH chose PayHere, 6 Nov 2026).
export type Provider = "payhere" | "stripe";
export type Cur = "lkr" | "cad";
export const currencyOf = (provider: Provider): Cur => (provider === "payhere" ? "lkr" : "cad");

export type Project = {
  title?: string; slug?: string; status?: string; verified?: boolean; hidden?: boolean;
  currency?: string; goal?: unknown; budget?: { item?: string; amount?: unknown }[];
  funders?: { name?: string; amount?: unknown }[];
};

// A gift made in someone's name: remembering a loved one, or marking a birthday, anniversary and so on.
// `words` is what the giver chose or typed before the name ("In loving memory of"), in English or Tamil.
export type Tribute = { kind: string; words: string; name: string; note: string; show: boolean };
export const TRIBUTE_WORDS: Record<string, string> = {
  memory: "In loving memory of", remembrance: "Remembering, on the anniversary of", birthday: "Celebrating the birthday of",
  anniversary: "Celebrating the anniversary of", wedding: "Celebrating the wedding anniversary of", newborn: "Welcoming",
  success: "Celebrating the success of", recovery: "Giving thanks for the recovery of", gratitude: "With gratitude for",
  festival: "A festival gift in the name of", honour: "In honour of", behalf: "Given on behalf of", custom: "",
};
export function readTribute(body: Record<string, unknown>): Tribute | null {
  if (!(body.tribute_on === true || body.tribute_on === "yes")) return null;
  const kind = String(body.tribute_kind || "memory");
  const name = clip(body.tribute_name, 60);
  if (!name || !(kind in TRIBUTE_WORDS)) return null;
  const words = clip(body.tribute_words, 60).replace(/[<>]/g, "") || TRIBUTE_WORDS[kind];
  if (!words) return null;
  return { kind, words, name, note: clip(body.tribute_note, 140), show: body.tribute_show === true || body.tribute_show === "yes" };
}

// Yearly reminder before their day ("Make it a moment every year", SURESH 10 Nov 2026).
export type Remind = { every: "year"; day: string; phone: string };
export type GiveRequest = {
  tribute?: Tribute | null;
  moment?: string;       // the family page (/m/<code>) this gift was given from
  wish?: string;         // the giver's own wish for a Raavanaa Fund gift
  remind?: Remind | null;
  ta?: boolean;          // the giver used the Tamil site, so PayHere sends them back to the Tamil pages
  kind: "project" | "general" | "member";
  slug: string;
  amountCents: number;   // what goes to the cause
  feeCents: number;      // optional extra so the card fee doesn't come out of the gift
  name: string;
  showName: boolean;
  email: string;
  phone?: string;
};

// Smallest and largest gifts by card, in cents of the gift currency (rupee cents for PayHere).
export const LIMITS: Record<Cur, { min: number; max: number; memberMax: number; sign: string }> = {
  cad: { min: 500, max: 500000, memberMax: 50000, sign: "$" },              // $5 to $5,000; $500 a month
  lkr: { min: 50000, max: 150000000, memberMax: 10000000, sign: "Rs " },  // Rs 500 to Rs 1,500,000; Rs 100,000 a month
};
export const MIN_CENTS = LIMITS.cad.min;
export const MAX_CENTS = LIMITS.cad.max;
export const MEMBER_MAX_CENTS = LIMITS.cad.memberMax;

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
// The same for any gift currency: rupee gifts go only to rupee projects (one rupee = 100 rupee cents).
export const takesCardsIn = (p: Project, cur: Cur, rate = 0) => (cur === "lkr" ? isRupees(p) : takesCards(p, rate));
export const unitCents = (p: Project, cur: Cur, rate = 0) => (cur === "lkr" ? (isRupees(p) ? 100 : 0) : centsPerUnit(p, rate));
// A recorded gift (cents in its own currency) in the project's currency, or 0 if it can't count towards it.
export const toProjectUnits = (p: Project, cents: number, cur: string, rate = 0) => {
  const c: Cur = String(cur || "cad").toLowerCase() === "lkr" ? "lkr" : "cad";
  if (!takesCardsIn(p, c, rate)) return 0;
  return cents / unitCents(p, c, rate);
};

export const goalOf = (p: Project) =>
  numOf(p.goal) || (p.budget || []).filter((x) => x && x.item).reduce((s, x) => s + numOf(x.amount), 0);
export const listedOf = (p: Project) =>
  (p.funders || []).filter((x) => x && x.name).reduce((s, x) => s + numOf(x.amount), 0);

// A project can be sponsored by card while it is public, verified, still being planned,
// has a budget in dollars and is not yet fully covered.
// paidUnits = card gifts already recorded, in the project's own currency; the answer is in cents of `cur`.
export function openFor(p: Project | undefined, paidUnits: number, rate = 0, cur: Cur = "cad") {
  if (!p || p.hidden || !p.verified || /complete/i.test(p.status || "") || !takesCardsIn(p, cur, rate)) return null;
  const unit = unitCents(p, cur, rate);
  const goal = Math.round(goalOf(p) * unit);
  if (!goal) return null;
  const left = goal - Math.round(listedOf(p) * unit) - Math.round(paidUnits * unit);
  return left > 0 ? { goalCents: goal, leftCents: left } : null;
}

// An estimate of Stripe's fee on a Canadian card (about 2.9% + 30¢), so a giver can choose to cover it.
export const feeFor = (cents: number) => Math.max(0, Math.ceil((cents + 30) / (1 - 0.029)) - cents);

// PayHere's fee is a share of the payment (about 3.3% on the Lite plan; check the plan once registered).
export const PAYHERE_FEE = 0.033;
export const feeForIn = (cents: number, cur: Cur) => (cur === "lkr" ? Math.max(0, Math.ceil((cents / (1 - PAYHERE_FEE) - cents) / 100) * 100) : feeFor(cents)) // whole rupees;

const fmt = (cents: number, cur: Cur) => LIMITS[cur].sign + (cents / 100).toLocaleString("en-US");

export function readRequest(body: Record<string, unknown>, cur: Cur = "cad"): GiveRequest | string {
  const kind = String(body.kind || "");
  if (!["project", "general", "member"].includes(kind)) return "Please choose what you would like to give to.";
  const amountCents = Math.round(numOf(body.amount) * 100);
  const L = LIMITS[cur];
  const max = kind === "member" ? L.memberMax : L.max;
  if (amountCents < L.min) return `The smallest gift by card is ${fmt(L.min, cur)}.`;
  if (amountCents > max) return `For gifts over ${fmt(max, cur)}, please contact us and we'll arrange it.`;
  const feeCents = body.cover_fee === true || body.cover_fee === "yes" ? feeForIn(amountCents, cur) : 0;
  const showName = body.show_name === true || body.show_name === "yes";
  const name = clip(body.name, 60);
  const email = clip(body.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please check your email address.";
  const phone = clip(body.phone, 20).replace(/[^\d+ ]/g, "");
  if (cur === "lkr") {
    // PayHere asks every payer for an email and a phone number (its receipts and card checks use them).
    if (!email) return "Please add your email address for the receipt.";
    if (phone.replace(/\D/g, "").length < 7) return "Please add your phone number.";
  }
  const moment = /^[a-z0-9]{6,16}$/.test(String(body.moment || "")) ? String(body.moment) : "";
  const wish = kind === "general" ? clip(body.wish, 300).replace(/[<>]/g, "") : "";
  const day = String(body.remind_day || "");
  const remind: Remind | null = (body.remind === true || body.remind === "yes") && /^\d{4}-\d{2}-\d{2}$/.test(day) && !isNaN(Date.parse(day))
    ? { every: "year", day, phone } : null;
  return { kind: kind as GiveRequest["kind"], slug: kind === "project" ? slugify(body.project) : "", amountCents, feeCents, name, showName: showName && !!name, email, phone, tribute: readTribute(body), ta: body.lang === "ta", moment, wish, remind };
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

// ---------- PayHere (Sri Lanka) ----------
// Checkout: the browser posts a form straight to PayHere; we only sign it. PayHere then calls our notify URL
// with the result, signed with the same merchant secret. Docs: support.payhere.lk (Checkout API, Recurring API).

const md5 = (v: string) => createHash("md5").update(v, "utf8").digest("hex").toUpperCase();
// Amounts go to PayHere as rupees with two decimals and no thousands separators, e.g. "1500.00".
export const phAmount = (cents: number) => (Math.round(cents) / 100).toFixed(2);
export const payhereHash = (merchantId: string, orderId: string, amount: string, currency: string, secret: string) =>
  md5(merchantId + orderId + amount + currency + md5(secret));
export const payhereUrl = (sandbox: boolean) => `https://${sandbox ? "sandbox" : "www"}.payhere.lk/pay/checkout`;

export const newOrderId = (now = Date.now()) =>
  "RV" + now.toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();

export const whatFor = (g: GiveRequest, title: string) =>
  (g.kind === "project" ? `Sponsor a smile: ${title}` : g.kind === "member" ? "Smile member: monthly gift" : "A gift to Raavanaa Community").slice(0, 250);

// The fields of the form the browser sends to PayHere's checkout page.
export function payhereFields(g: GiveRequest, o: { origin: string; title: string; orderId: string; merchantId: string; secret: string }) {
  const amount = phAmount(g.amountCents + g.feeCents);
  const [first, ...rest] = (g.name || "").split(" ").filter(Boolean);
  const f: Record<string, string> = {
    merchant_id: o.merchantId,
    return_url: `${o.origin}${g.ta ? "/ta" : ""}/thank-you?order=${o.orderId}`,
    cancel_url: g.kind === "project" ? `${o.origin}${g.ta ? "/ta" : ""}/give?project=${encodeURIComponent(g.slug)}&cancelled=1` : `${o.origin}${g.ta ? "/ta" : ""}/give?cancelled=1`,
    notify_url: `${o.origin}/api/give/payhere`,
    order_id: o.orderId,
    items: whatFor(g, o.title),
    currency: "LKR",
    amount,
    first_name: first || "Friend",
    last_name: rest.join(" ") || "of Raavanaa",
    email: g.email,
    phone: g.phone || "",
    address: "Online gift",
    city: "Online",
    country: "Sri Lanka",
    custom_1: g.kind,
    custom_2: g.slug,
    hash: payhereHash(o.merchantId, o.orderId, amount, "LKR", o.secret),
  };
  if (g.kind === "member") { f.recurrence = "1 Month"; f.duration = "Forever"; }
  return f;
}

// Checks that a notification really came from PayHere (its md5sig field).
export function verifyPayhere(f: Record<string, string>, merchantId: string, secret: string) {
  if (!f.md5sig || String(f.merchant_id) !== String(merchantId)) return false;
  const want = md5(String(f.merchant_id) + String(f.order_id) + String(f.payhere_amount) + String(f.payhere_currency) + String(f.status_code) + md5(secret));
  const got = String(f.md5sig).toUpperCase();
  return want.length === got.length && timingSafe(want, got);
}
