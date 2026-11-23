// Members dashboard (SURESH, 23 Nov 2026): "a dashboard with all the sign in users we have in our members sign in.
// Name, email, phone. We have to make as many people as possible to sign in. That is our success."
//   GET /api/members/team   ADMINS ONLY: every account in the members sign-in (Netlify Identity), newest first.
//     -> { members: [{ name, email, phone, phoneFrom, via, joined, confirmed, lastSeen, team }], total, at }
// Identity keeps only name and email. A phone is shown when the same email left one on the website:
// a Volunteer / Join form, an "I'd like to give" pledge, or a Submit a need request (newest first).
// Personal data: never cached, never public, never logged.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { admin } from "@netlify/identity";
import { teamAccess, ownerEmails } from "../lib/team-access.mts";

type Row = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store, private" } });
const looksLikePhone = (s: string) => /^[+\d][\d\s()./-]{6,}$/.test(String(s || "").trim()) && String(s).replace(/\D/g, "").length >= 7;

// Phones the same email left on the website. First one found (newest) wins.
async function phonesByEmail(): Promise<Map<string, { phone: string; from: string }>> {
  const out = new Map<string, { phone: string; from: string }>();
  const add = (email: string, phone: string, from: string) => {
    const e = String(email || "").toLowerCase().trim(), p = String(phone || "").trim();
    if (e && p && looksLikePhone(p) && !out.has(e)) out.set(e, { phone: p, from });
  };
  const db = getDatabase();
  const tries: [string, () => Promise<Row[]>][] = [
    ["Volunteer form", async () => (await db.sql<Row>`SELECT member_email AS e, contact AS c, phone AS p FROM volunteers WHERE member_email <> '' ORDER BY created_at DESC LIMIT 5000`) as Row[]],
    ["Volunteer form", async () => (await db.sql<Row>`SELECT contact AS e, phone AS p FROM volunteers WHERE contact LIKE '%@%' AND phone <> '' ORDER BY created_at DESC LIMIT 5000`) as Row[]],
    ["Pledge form", async () => (await db.sql<Row>`SELECT member_email AS e, contact AS c FROM give_requests WHERE member_email <> '' ORDER BY id DESC LIMIT 5000`) as Row[]],
    ["Request form", async () => (await db.sql<Row>`SELECT member_email AS e, contact AS c FROM suggestions WHERE member_email <> '' ORDER BY received_at DESC LIMIT 5000`) as Row[]],
  ];
  for (const [from, q] of tries) {
    try { for (const r of await q()) add(r.e, r.p || r.c, from); } catch { /* table or column not there: skip */ }
  }
  return out;
}

async function allUsers() {
  const users: any[] = [];
  for (let page = 1; page <= 100; page++) {
    const batch = await admin.listUsers({ page, perPage: 100 });
    users.push(...batch);
    if (batch.length < 100) break;
  }
  return users;
}

export default async (req: Request) => {
  if (req.method !== "GET") return json({ error: "Not allowed" }, 405);
  const me = await teamAccess();
  if (!me) return json({ error: "Please sign in to the team portal." }, 401);
  if (!me.admin) return json({ error: "Only admins can see the members list." }, 403);

  let users: any[];
  try { users = await allUsers(); }
  catch (e) { return json({ error: "Could not read the members sign-in list: " + ((e as Error).message || "unknown error") }, 502); }

  const phones = await phonesByEmail();
  let teamEmails = new Set<string>(ownerEmails());
  try { for (const r of (await getDatabase().sql<Row>`SELECT email FROM portal_access`) as Row[]) teamEmails.add(String(r.email).toLowerCase()); } catch { /* no table */ }

  const members = users.map((u) => {
    const email = String(u.email || "").toLowerCase();
    const meta = (u.userMetadata || {}) as Record<string, unknown>;
    const own = String(meta.phone || meta.whatsapp || "").trim();
    const found = own ? { phone: own, from: "Their account" } : phones.get(email);
    const roles: string[] = Array.isArray(u.roles) ? u.roles : [];
    return {
      name: String(u.name || meta.full_name || meta.name || "").trim(),
      email,
      phone: found?.phone || "",
      phoneFrom: found?.from || "",
      via: u.provider === "google" ? "Google" : u.provider && u.provider !== "email" ? String(u.provider) : "Email",
      joined: u.createdAt || "",
      confirmed: !!u.confirmedAt,
      lastSeen: u.lastSignInAt || "",
      team: teamEmails.has(email) || roles.includes("admin") || roles.includes("team"),
    };
  }).sort((a, b) => String(b.joined).localeCompare(String(a.joined)));

  return json({ members, total: members.length, at: new Date().toISOString() });
};

export const config: Config = { path: "/api/members/team", method: ["GET"] };
