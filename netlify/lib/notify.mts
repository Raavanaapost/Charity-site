// Messages to the people behind a request (SURESH 21 Nov 2026):
//   1. "We received your request", right away, to the person who sent it and to the person in charge they named.
//   2. "Your project is listed", with the project link so they can follow it, when it goes live on Projects.
// Email goes out by itself through Resend once RESEND_API_KEY is set (see mail.mts); until then nothing is emailed.
// WhatsApp has no automatic sender yet (it needs a paid provider), so the portal shows a "Send on WhatsApp" button
// with the same words for each person; a volunteer taps it. Every message sent is noted on the request.
import { getDatabase } from "@netlify/database";
import { sendMail, mailOn, escHtml } from "./mail.mts";

type DB = ReturnType<typeof getDatabase>;
type Row = Record<string, any>;
export type Kind = "received" | "listed";
export type Person = { who: "requester" | "in charge" | "vouched"; name: string; email: string; phone: string };
export type Message = { to: Person; subject: string; text: string };

const SITE = "https://raavanaa.org";
// First name, skipping a title such as Mr or Rev.
const first = (n: string) => String(n || "").trim().split(/\s+/).filter((w) => !/^(mr|mrs|ms|miss|dr|rev|fr|sr|sir|madam|prof)\.?$/i.test(w))[0] || "there";
const emailsIn = (v: unknown) => String(v ?? "").match(/[^\s,;<>()]+@[^\s,;<>()]+\.[a-z]{2,}/gi) || [];
const phonesIn = (v: unknown) => (String(v ?? "").match(/\+?\d[\d\s-]{7,}\d/g) || []).map((p) => p.trim());
const key = (p: string) => String(p).replace(/\D/g, "").slice(-9);

// The person who sent it, the person in charge (referred requests) and, once listed, anyone who vouched.
export function peopleFor(r: Row, vouchers: Row[] = [], kind: Kind = "received"): Person[] {
  const name = String(r.contact || "").split(/[,(]/)[0].trim();
  const email = emailsIn(r.reach)[0] || emailsIn(r.contact)[0] || String(r.member_email || "");
  const out: Person[] = [{ who: "requester", name, email: email.toLowerCase(), phone: phonesIn(r.reach)[0] || "" }];
  if (r.request_type === "referred" && r.incharge_name) {
    out.push({ who: "in charge", name: r.incharge_name, email: String(r.incharge_email || "").toLowerCase(), phone: r.incharge_phone || "" });
  }
  if (kind === "listed") for (const v of vouchers) if (v.phone) out.push({ who: "vouched", name: v.name, email: "", phone: v.phone });
  // One message per person: drop repeats by email or phone.
  const seen = new Set<string>();
  return out.filter((p) => {
    const ids = [p.email, p.phone && key(p.phone)].filter(Boolean) as string[];
    if (!ids.length || ids.some((i) => seen.has(i))) return false;
    ids.forEach((i) => seen.add(i));
    return true;
  });
}

const titleOf = (r: Row, data?: Row) => String(data?.title || r.profile?.title || r.details?.title || r.title || "your request").trim();
const placeOf = (r: Row) => [r.village, r.city].filter(Boolean).join(", ") || r.location || "";

export function message(kind: Kind, r: Row, p: Person, slug = "", data?: Row): Message {
  const title = titleOf(r, data), place = placeOf(r), hi = `Hello ${first(p.name)},`;
  const sender = String(r.contact || "").split(/[,(]/)[0].trim() || "Someone";
  const end = "With thanks,\nThe Raavanaa team\nraavanaa.org";
  if (kind === "received") {
    const body = p.who === "requester"
      ? `Thank you. Raavanaa has received your request: "${title}"${place ? ` in ${place}` : ""}. Your reference is ${r.ref}.\n\nA volunteer will look at it and get in touch with you soon. When it is listed on raavanaa.org, we will send you the link so you can follow it.`
      : `${sender} has sent Raavanaa a request: "${title}"${place ? ` in ${place}` : ""}, and named you as the person in charge. The reference is ${r.ref}.\n\nWe will send you the page to check soon. When it is listed on raavanaa.org, we will send you the link so you can follow it.`;
    return { to: p, subject: `We received your request (${r.ref})`, text: `${hi}\n\n${body}\n\n${end}` };
  }
  const url = `${SITE}/projects/${slug}`;
  const body = `Good news: "${title}" is now listed on raavanaa.org as an Initiated project.\n\nYou can follow it here:\n${url}\n\nPlease share the link with people who may want to help. We will keep you posted as it moves from Initiated to Activated and then Impact.${p.who === "vouched" ? "" : `\n\nOne step before the day: each adult in charge reads and signs our short agreement (English and Tamil, about a minute). The day is run by you and the school; Raavanaa's part is finding the funding. Sign here:\n${SITE}/agree?p=${slug}${p.who === "in charge" ? "&role=person%20in%20charge" : "&role=organiser"}`}`;
  return { to: p, subject: `Your project is listed on Raavanaa`, text: `${hi}\n\n${body}\n\n${end}` };
}

const asHtml = (t: string) => `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:#1f2a24">${escHtml(t).replace(/(https:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').split("\n\n").map((x) => `<p>${x.replace(/\n/g, "<br>")}</p>`).join("")}</div>`;

// Sends the emails it can and notes on the request what went out and what still needs WhatsApp.
export async function notify(db: DB, suggestionId: number, kind: Kind, slug = "", data?: Row): Promise<void> {
  try {
    const [r] = await db.sql<Row>`SELECT * FROM suggestions WHERE id = ${suggestionId}`;
    if (!r) return;
    const vouchers = kind === "listed" ? await db.sql<Row>`SELECT name, phone FROM endorsements WHERE suggestion_id = ${suggestionId} AND NOT hidden ORDER BY created_at` : [];
    const lines: string[] = [];
    for (const p of peopleFor(r, vouchers as Row[], kind)) {
      const m = message(kind, r, p, slug, data);
      const label = `${p.name || p.who} (${p.who})`;
      if (p.email && (await sendMail(p.email, m.subject, m.text, asHtml(m.text)))) lines.push(`Emailed ${label} at ${p.email}`);
      else if (p.email) lines.push(`Email to ${label} not sent${mailOn() ? "" : " (email sending is off)"}: send it from the portal`);
      if (p.phone) lines.push(`WhatsApp to ${label}: tap Send on WhatsApp in the portal`);
    }
    if (!lines.length) return;
    const head = kind === "received" ? "\"We received your request\" message" : "\"Your project is listed\" message";
    await db.sql`INSERT INTO suggestion_notes (suggestion_id, by_email, by_name, body) VALUES (${suggestionId}, 'website', 'Raavanaa website', ${head + ": " + lines.join("; ")})`;
  } catch (e) {
    console.error("notify", kind, (e as Error).message);
  }
}
