// Emails from the website (SURESH, 17 Nov 2026): a note to the person who pledged, and a copy to the team.
// Sent through Resend (free up to 3,000 emails a month) once these are set in Netlify:
//   RESEND_API_KEY   the key from resend.com (raavanaa.org must be added and checked there first)
//   MAIL_FROM        who it is from, e.g. "Raavanaa <info@raavanaa.org>"
//   MAIL_TEAM        where the team copy goes (defaults to the email in site.json)
// Until RESEND_API_KEY is set nothing is sent and nothing breaks: the pledge is still saved, shown on the project,
// and copied to Netlify Forms ("give-request"), whose own email notification can tell the team.
// Never put bank details in these emails: they go only in a volunteer's personal reply.
import siteData from "../../site.json" with { type: "json" };

const env = (k: string) => (Netlify.env.get(k) || "").trim();
export const mailOn = () => !!env("RESEND_API_KEY");
export const teamEmail = () => env("MAIL_TEAM") || String((siteData as { email?: string }).email || "");
export const escHtml = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendMail(to: string, subject: string, text: string, html: string, replyTo = ""): Promise<boolean> {
  if (!mailOn() || !to) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env("MAIL_FROM") || "Raavanaa <info@raavanaa.org>", to: [to], subject, text, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!r.ok) console.log("email not sent:", r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.log("email not sent:", (e as Error).message);
    return false;
  }
}
