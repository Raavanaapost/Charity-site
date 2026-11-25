// Followers of a project (SURESH, 25 Nov 2026, option A: free, WhatsApp by tap). Shared by the public Follow box
// (/api/follow), the Be the smile form (pledge.mts) and the portal (Followers & updates).
import { getDatabase } from "@netlify/database";

export const SITE = "https://raavanaa.org";
// A WhatsApp number or an email, as one key per person: emails in lower case; numbers as digits only, with a Sri
// Lankan 07x number turned into 947x (the same rule as the portal's WhatsApp buttons).
export function contactOf(raw: string): { kind: "whatsapp" | "email"; key: string } | null {
  const v = String(raw || "").trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { kind: "email", key: v.toLowerCase() };
  const d = v.replace(/\D/g, "").replace(/^00/, "").replace(/^0(?=7\d{8}$)/, "94");
  return d.length >= 7 && d.length <= 15 ? { kind: "whatsapp", key: d } : null;
}

// Adds (or re-starts) a follower. Returns false when the contact is not a number or an email.
export async function follow(db: ReturnType<typeof getDatabase>, slug: string, name: string, contact: string, source: string) {
  const c = contactOf(contact);
  if (!c || !/^[a-z0-9-]{1,80}$/.test(slug)) return false;
  await db.sql`INSERT INTO project_follows (slug, name, contact, kind, contact_key, source)
    VALUES (${slug}, ${name.slice(0, 80)}, ${contact.slice(0, 120)}, ${c.kind}, ${c.key}, ${source})
    ON CONFLICT (slug, contact_key) DO UPDATE SET stopped_at = NULL, name = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE project_follows.name END`;
  return true;
}

// The message a follower gets for one update: their first name, the news, the project link and their own stop link.
export function updateMessage(o: { name: string; project: string; slug: string; title: string; body: string; token: string }) {
  const first = String(o.name || "").trim().split(/\s+/)[0];
  return [`${first ? `Hi ${first},` : "Hello,"} here is news from "${o.project}" on Raavanaa.`, "", `*${o.title}*`, o.body ? o.body : "", "",
    `See the project: ${SITE}/projects/${o.slug}`, "", "Thank you for following it.", "The Raavanaa team", "", `(To stop these updates: ${SITE}/stop/${o.token})`]
    .filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}
