// Public: "I'd like to give" (SURESH, 12 Nov 2026).
//   POST /api/pledge   { kind, project, name, contact, amount, message, tribute..., listing, listing_words, lang } -> { ok, ref }
// No money is taken here and no bank details are ever shown on the site. The request is saved for the team
// (portal: Sponsors & pledges), and a volunteer replies to the person themselves. The same form is also sent
// to Netlify Forms ("give-request"), which keeps a copy and can email the team.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { TRIBUTE_WORDS } from "../lib/give-core.mts";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let f: Record<string, unknown>;
  try { f = await req.json(); } catch { return json({ ok: false, error: "Could not read the form." }, 400); }
  if (clip(f["bot-field"], 10)) return json({ ok: true, ref: "" }); // robots fill the hidden field

  const name = clip(f.name, 80), contact = clip(f.contact, 120);
  if (!name) return json({ ok: false, error: "Please add your name." }, 400);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact), isPhone = contact.replace(/\D/g, "").length >= 7;
  if (!isEmail && !isPhone) return json({ ok: false, error: "Please add a WhatsApp number or an email address, so we can reply." }, 400);

  const kind = ["project", "general", "member"].includes(String(f.kind)) ? String(f.kind) : "general";
  // The project's short name from its address (/projects/<slug>); without one the gift is for the Raavanaa Fund.
  const slug = /^[a-z0-9-]{1,80}$/.test(String(f.project || "")) ? String(f.project) : "";
  const moment = /^[a-z0-9]{6,16}$/.test(String(f.moment || "")) ? String(f.moment) : "";
  let tribute: Record<string, string> | null = null;
  if (f.tribute_on === "yes" && clip(f.tribute_name, 60)) {
    const tk = String(f.tribute_kind || "");
    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(f.remind_day || "")) && f.remind === "yes" ? String(f.remind_day) : "";
    tribute = { kind: tk in TRIBUTE_WORDS ? tk : "custom", words: clip(f.tribute_words, 60) || TRIBUTE_WORDS[tk] || "", name: clip(f.tribute_name, 60), note: clip(f.tribute_note, 140), day };
  }
  // How the gift is listed in public: name and amount, name only, anonymous, or the giver's own wording.
  const words = clip(f.listing_words, 80);
  const listing = ["both", "name", "anonymous", "own"].includes(String(f.listing)) ? String(f.listing) : "both";
  const row = {
    amount: clip(f.amount, 60), message: clip(f.message ?? f.wish, 500), lang: f.lang === "ta" ? "ta" : "en",
    kind: kind === "project" && !slug ? "general" : kind,
    listing: listing === "own" && !words ? "both" : listing, words: listing === "own" ? words : "",
  };

  try {
    const db = getDatabase();
    const [saved] = await db.sql<{ ref: string }>`
      INSERT INTO give_requests (ref, name, contact, amount, kind, project_slug, moment_code, tribute, message, lang, listing, listing_words)
      VALUES ('G-' || nextval('give_request_ref_seq'), ${name}, ${contact}, ${row.amount}, ${row.kind}, ${slug}, ${moment},
              ${tribute ? JSON.stringify(tribute) : null}::jsonb, ${row.message}, ${row.lang}, ${row.listing}, ${row.words})
      RETURNING ref`;
    await db.sql`INSERT INTO audit_log (actor, action, target) VALUES ('website', 'give_request.received', ${saved.ref})`;
    return json({ ok: true, ref: saved.ref });
  } catch (e) {
    console.log("give request not saved:", (e as Error).message);
    return json({ ok: false, error: "We could not save that just now. Please try again." }, 503);
  }
};

export const config: Config = {
  path: "/api/pledge",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 5 },
};
