// Public: how many Sri Lankan rupees one unit of each currency is worth today (SURESH, 17 Nov 2026: people all around
// the world can give, in their own money, and the project counts in rupees).
//   GET /api/fx -> { as_of, source, lkr: { USD: 332.67, CAD: 232.67, ... } }
// Rates come from the free ExchangeRate-API (open.er-api.com, updated once a day, no key). If it can't be reached,
// the table below (17 Nov 2026) is used, so the form always works. Amounts are shown as "about", never as exact.
import type { Config } from "@netlify/functions";

export const CURRENCIES = ["LKR", "USD", "CAD", "GBP", "EUR", "AUD", "NZD", "CHF", "NOK", "SEK", "DKK", "INR", "SGD", "MYR", "AED", "QAR", "SAR", "KWD", "JPY"];
const FALLBACK: Record<string, number> = { LKR: 1, USD: 332.67, CAD: 232.67, GBP: 438.98, EUR: 366.17, AUD: 224.57, NZD: 183.39, CHF: 395.73, NOK: 34.42, SEK: 32.99,
  DKK: 48.73, INR: 3.54, SGD: 257.93, MYR: 81.29, AED: 90.59, QAR: 91.39, SAR: 88.72, KWD: 1074.11, JPY: 2.08 };

export default async () => {
  let lkr = FALLBACK, as_of = "2026-11-17", source = "table";
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/LKR", { signal: AbortSignal.timeout(4000) });
    const d = await r.json();
    if (d && d.result === "success" && d.rates) {
      const out: Record<string, number> = {};
      for (const c of CURRENCIES) if (d.rates[c] > 0) out[c] = Math.round((1 / d.rates[c]) * 100) / 100;
      if (Object.keys(out).length > 5) { lkr = { ...FALLBACK, ...out, LKR: 1 }; as_of = String(d.time_last_update_utc || "").slice(5, 16); source = "ExchangeRate-API"; }
    }
  } catch { /* the table above */ }
  return Response.json({ as_of, source, lkr }, { headers: { "Cache-Control": "public, max-age=21600" } });
};

export const config: Config = { path: "/api/fx", method: ["GET"] };
