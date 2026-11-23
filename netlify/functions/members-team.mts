// Members dashboard (SURESH, 23 Nov 2026): "a dashboard with all the sign in users we have in our members sign in.
// Name, email, phone. We have to make as many people as possible to sign in. That is our success."
//   GET /api/members/team   ADMINS ONLY: every account in the members sign-in (Netlify Identity), newest first.
//     -> { members: [{ name, email, phone, phoneFrom, via, joined, confirmed, lastSeen, lastActive, online, pages30,
//          days30, did: { requests, pledges, vouches, ratings, comments, volunteer, memories } , team }], total, at }
//   GET /api/members/team?email=x   ADMINS ONLY: that member's activity, newest first -> { events: [{ at, kind, text, path }] }
//     From the activity record (pages and actions while signed in, from 23 Nov 2026) and from what the site already
//     kept with their email: requests, pledges, vouches, ratings, comments, volunteer joins, memory and family pages.
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

const ONLINE_MS = 5 * 60 * 1000;
async function rows(q: () => PromiseLike<unknown>): Promise<Row[]> { try { return (await q()) as Row[]; } catch { return []; } }

// Per email: last activity, pages and active days in the last 30 days, and what they have done on the site.
async function summaries() {
  const db = getDatabase();
  const out = new Map<string, Row>();
  const get = (e: string) => { const k = String(e || "").toLowerCase(); if (!out.has(k)) out.set(k, { lastActive: "", pages30: 0, days30: 0, did: {} }); return out.get(k)!; };
  for (const r of await rows(() => db.sql<Row>`SELECT email, MAX(at) AS last, COUNT(*) FILTER (WHERE kind = 'view' AND at > NOW() - INTERVAL '30 days') AS pages,
      COUNT(DISTINCT date_trunc('day', at)) FILTER (WHERE at > NOW() - INTERVAL '30 days') AS days FROM member_activity GROUP BY email`)) {
    const m = get(r.email); m.lastActive = r.last ? new Date(r.last).toISOString() : ""; m.pages30 = Number(r.pages) || 0; m.days30 = Number(r.days) || 0;
  }
  const count = async (key: string, q: () => PromiseLike<unknown>) => { for (const r of await rows(q)) if (r.e) get(r.e).did[key] = Number(r.n) || 0; };
  await count("requests", () => db.sql<Row>`SELECT lower(member_email) AS e, COUNT(*) AS n FROM suggestions WHERE member_email <> '' GROUP BY 1`);
  await count("pledges", () => db.sql<Row>`SELECT lower(member_email) AS e, COUNT(*) AS n FROM give_requests WHERE member_email <> '' GROUP BY 1`);
  await count("vouches", () => db.sql<Row>`SELECT lower(member_email) AS e, COUNT(*) AS n FROM project_voices WHERE member_email <> '' AND kind = 'vouch' GROUP BY 1`);
  await count("ratings", () => db.sql<Row>`SELECT lower(member_email) AS e, COUNT(*) AS n FROM project_voices WHERE member_email <> '' AND kind = 'rating' GROUP BY 1`);
  await count("comments", () => db.sql<Row>`SELECT lower(member_email) AS e, COUNT(*) AS n FROM project_voices WHERE member_email <> '' AND kind = 'comment' GROUP BY 1`);
  await count("requestVouches", () => db.sql<Row>`SELECT lower(member_email) AS e, COUNT(*) AS n FROM endorsements WHERE member_email <> '' GROUP BY 1`);
  await count("volunteer", () => db.sql<Row>`SELECT lower(member_email) AS e, COUNT(*) AS n FROM volunteers WHERE member_email <> '' GROUP BY 1`);
  await count("memories", () => db.sql<Row>`SELECT lower(owner_email) AS e, COUNT(*) AS n FROM moments WHERE owner_email <> '' GROUP BY 1`);
  for (const m of out.values()) { m.did.vouches = (m.did.vouches || 0) + (m.did.requestVouches || 0); delete m.did.requestVouches; }
  return out;
}

const WHAT: Record<string, string> = { view: "Opened", share: "Shared", give: "Sent an \"I'd like to give\"", memory: "Made a memory page", request: "Sent a request", vouch: "Vouched", install: "Installed the app" };
const nice = (d: unknown) => d ? new Date(d as string).toISOString() : "";
const money = (r: Row) => r.amount_value && Number(r.amount_value) ? String(r.amount_value) : String(r.amount || "");

// One member's activity, newest first.
async function activity(email: string) {
  const db = getDatabase();
  const ev: { at: string; kind: string; text: string; path: string }[] = [];
  for (const r of await rows(() => db.sql<Row>`SELECT kind, path, detail, at FROM member_activity WHERE email = ${email} ORDER BY at DESC LIMIT 400`))
    ev.push({ at: nice(r.at), kind: r.kind, text: r.kind === "view" ? "Opened" : r.kind === "share" ? `Shared${r.detail ? " (" + r.detail + ")" : ""}` : WHAT[r.kind] || r.kind, path: r.path || "" });
  for (const r of await rows(() => db.sql<Row>`SELECT ref, title, received_at FROM suggestions WHERE lower(member_email) = ${email} ORDER BY received_at DESC LIMIT 50`))
    ev.push({ at: nice(r.received_at), kind: "request", text: `Sent request ${r.ref || ""}: ${r.title || ""}`.trim(), path: "" });
  for (const r of await rows(() => db.sql<Row>`SELECT ref, project_slug, amount, amount_value, follow, status, received_at FROM give_requests WHERE lower(member_email) = ${email} ORDER BY received_at DESC LIMIT 50`))
    ev.push({ at: nice(r.received_at), kind: "give", text: `Pledged ${money(r)}${r.project_slug ? " to " + r.project_slug : " to the Raavanaa Fund"} (${r.ref}, ${r.status})${r.follow ? ", following it" : ""}`, path: r.project_slug ? "/projects/" + r.project_slug : "" });
  for (const r of await rows(() => db.sql<Row>`SELECT kind, slug, stars, created_at FROM project_voices WHERE lower(member_email) = ${email} ORDER BY created_at DESC LIMIT 50`))
    ev.push({ at: nice(r.created_at), kind: r.kind === "vouch" ? "vouch" : "comment", text: r.kind === "vouch" ? `Vouched for ${r.slug}` : r.kind === "rating" ? `Rated ${r.slug} ${r.stars || ""}★` : `Commented on ${r.slug}`, path: "/projects/" + r.slug });
  for (const r of await rows(() => db.sql<Row>`SELECT e.created_at, s.title FROM endorsements e LEFT JOIN suggestions s ON s.id = e.suggestion_id WHERE lower(e.member_email) = ${email} ORDER BY e.created_at DESC LIMIT 50`))
    ev.push({ at: nice(r.created_at), kind: "vouch", text: `Vouched for a request${r.title ? ": " + r.title : ""}`, path: "" });
  for (const r of await rows(() => db.sql<Row>`SELECT created_at FROM volunteers WHERE lower(member_email) = ${email} ORDER BY created_at DESC LIMIT 10`))
    ev.push({ at: nice(r.created_at), kind: "volunteer", text: "Joined as a volunteer", path: "" });
  for (const r of await rows(() => db.sql<Row>`SELECT code, created_at FROM moments WHERE lower(owner_email) = ${email} ORDER BY created_at DESC LIMIT 20`))
    ev.push({ at: nice(r.created_at), kind: "memory", text: "Made a memory page", path: "/m/" + r.code });
  for (const r of await rows(() => db.sql<Row>`SELECT mm.joined_at, mm.moment_code AS code FROM moment_members mm WHERE lower(mm.email) = ${email} ORDER BY mm.joined_at DESC LIMIT 20`))
    ev.push({ at: nice(r.joined_at), kind: "memory", text: "Joined a family page", path: r.code ? "/m/" + r.code : "" });
  return ev.filter((e) => e.at).sort((a, b) => b.at.localeCompare(a.at));
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
  const one = new URL(req.url).searchParams.get("email");
  if (one) return json({ events: await activity(one.toLowerCase().trim().slice(0, 200)) });

  let users: any[];
  try { users = await allUsers(); }
  catch (e) { return json({ error: "Could not read the members sign-in list: " + ((e as Error).message || "unknown error") }, 502); }

  const [phones, sums] = await Promise.all([phonesByEmail(), summaries()]);
  const now = Date.now();
  const teamEmails = new Set<string>(ownerEmails());
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
      lastActive: sums.get(email)?.lastActive || "",
      online: !!sums.get(email)?.lastActive && now - new Date(sums.get(email)!.lastActive).getTime() < ONLINE_MS,
      pages30: sums.get(email)?.pages30 || 0,
      days30: sums.get(email)?.days30 || 0,
      did: sums.get(email)?.did || {},
      team: teamEmails.has(email) || roles.includes("admin") || roles.includes("team"),
    };
  }).sort((a, b) => String(b.joined).localeCompare(String(a.joined)));

  return json({ members, total: members.length, at: new Date().toISOString() });
};

export const config: Config = { path: "/api/members/team", method: ["GET"] };
