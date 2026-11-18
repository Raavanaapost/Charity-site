// Public: "I'd like to give" (SURESH, 12 Nov 2026).
//   POST /api/pledge   { kind, project, name, contact, amount, message, tribute..., listing, listing_words, lang } -> { ok, ref }
// No money is taken here and no bank details are ever shown on the site. The request is saved for the team
// (portal: Sponsors & pledges), and a volunteer replies to the person themselves. The same form is also sent
// to Netlify Forms ("give-request"), which keeps a copy and can email the team.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";
import { TRIBUTE_WORDS } from "../lib/give-core.mts";
import { escHtml, sendMail, teamEmail } from "../lib/mail.mts";
import data from "../../projects.json" with { type: "json" };

type P = { slug?: string; title?: string; currency?: string };
const PROJECTS = ((data as { projects?: P[] }).projects || []).filter((p) => p && p.title);

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
  // The amount as a number in the project's own money (simple project pledge, 17 Nov 2026), so it adds to the % bar.
  const value = Math.max(0, Math.min(10_000_000, Math.round(Number(String(f.amount_value ?? "").replace(/[^0-9.]/g, "")) || 0)));
  const follow = f.follow === "yes" || f.follow === true;
  const user = await getUser().catch(() => null);
  const memberEmail = user && user.email ? user.email.toLowerCase() : "";
  const row = {
    amount: clip(f.amount, 60), message: clip(f.message ?? f.wish, 500), lang: f.lang === "ta" ? "ta" : "en",
    kind: kind === "project" && !slug ? "general" : kind,
    listing: listing === "own" && !words ? "both" : listing, words: listing === "own" ? words : "",
  };

  try {
    const db = getDatabase();
    const [saved] = await db.sql<{ ref: string }>`
      INSERT INTO give_requests (ref, name, contact, amount, kind, project_slug, moment_code, tribute, message, lang, listing, listing_words, amount_value, member_email, follow)
      VALUES ('G-' || nextval('give_request_ref_seq'), ${name}, ${contact}, ${row.amount}, ${row.kind}, ${slug}, ${moment},
              ${tribute ? JSON.stringify(tribute) : null}::jsonb, ${row.message}, ${row.lang}, ${row.listing}, ${row.words},
              ${row.kind === "project" ? value : 0}, ${memberEmail}, ${follow})
      RETURNING ref`;
    await db.sql`INSERT INTO audit_log (actor, action, target) VALUES ('website', 'give_request.received', ${saved.ref})`;
    await tell(new URL(req.url).origin, saved.ref, { name, contact, isEmail, slug, amount: row.amount, follow, message: row.message, tribute, listing: row.listing, words: row.words });
    return json({ ok: true, ref: saved.ref });
  } catch (e) {
    console.log("give request not saved:", (e as Error).message);
    return json({ ok: false, error: "We could not save that just now. Please try again." }, 503);
  }
};

// "We'll send you the ways to fund": a short note to the giver (when they gave an email) and a copy to the team.
// Sent only when email is set up (lib/mail.mts). Never any bank details here.
async function tell(SITE: string, ref: string, x: { name: string; contact: string; isEmail: boolean; slug: string; amount: string; follow: boolean; message: string; tribute: Record<string, string> | null; listing: string; words: string }) {
  const p = x.slug ? PROJECTS.find((y) => y.slug === x.slug) : undefined;
  const what = p ? `"${p.title}"` : "the Raavanaa Fund";
  const link = p ? `${SITE}/projects/${x.slug}` : `${SITE}/overview`;
  const team = teamEmail();
  const jobs: Promise<boolean>[] = [];
  if (x.isEmail) {
    const text = [`Dear ${x.name},`, "", `Thank you for your pledge of ${x.amount} towards ${what}. It now shows on the project page:`, link, "",
      "We will send you the ways to fund in a personal email very soon. Raavanaa only ever shares bank details in a personal reply from our official email. Never pay into an account sent to you any other way.",
      "", x.follow ? `You are following the project: we will send you every step. (Optional: make a free account at ${SITE}/members with this email to keep it in My account.)` : "", "", `Your reference: ${ref}`, "", "With thanks,", "Raavanaa"].join("\n");
    const html = `<p>Dear ${escHtml(x.name)},</p><p>Thank you for your pledge of <b>${escHtml(x.amount)}</b> towards ${escHtml(what)}. It now shows on the <a href="${link}">project page</a>.</p>
      <p><b>We will send you the ways to fund in a personal email very soon.</b> Raavanaa only ever shares bank details in a personal reply from our official email. Never pay into an account sent to you any other way.</p>
      ${x.follow ? `<p>You are following the project: we will send you every step. (Optional: <a href="${SITE}/members">make a free account</a> with this email to keep it in My account.)</p>` : ""}<p>Your reference: ${ref}</p><p>With thanks,<br>Raavanaa</p>`;
    jobs.push(sendMail(x.contact, `Thank you for your pledge, ${x.name}`, text, html, team));
  }
  if (team) {
    const tr = x.tribute ? `${x.tribute.words} ${x.tribute.name}` : "";
    const lines = [["Ref", ref], ["Name", x.name], ["Contact", x.contact], ["Amount", x.amount], ["For", p ? p.title || "" : "Raavanaa Fund"], ["Listed as", x.listing === "own" ? x.words : x.listing],
      ["Follow", x.follow ? "yes" : "no"], ["In the name of", tr], ["Message", x.message]].filter(([, v]) => v);
    jobs.push(sendMail(team, `New pledge ${ref}: ${x.name}, ${x.amount}`, lines.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nReply with the ways to fund, then mark it in the portal: ${SITE}/portal#/sponsors`,
      `<table>${lines.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escHtml(v)}</td></tr>`).join("")}</table><p>Reply with the ways to fund, then mark it in the <a href="${SITE}/portal#/sponsors">portal</a>.</p>`,
      x.isEmail ? x.contact : ""));
  }
  await Promise.all(jobs);
}

export const config: Config = {
  path: "/api/pledge",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 5 },
};
