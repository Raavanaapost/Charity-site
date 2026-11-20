// Volunteers page (SURESH, 17 Nov 2026): everyone who joined Raavanaa, in one community list.
//   GET   /api/volunteers            public: the people who agreed to be listed, plus active Champions
//                                    -> { people: [{ name, town, skills, badges, since }], skills: { skill: count } }
//   POST  /api/volunteers            public: saves a "Join Raavanaa" / Volunteer form (also sent to Netlify Forms)
//   GET   /api/volunteers/team       team: everyone who joined, with their contact details
//   PATCH /api/volunteers/team       team: { id, hidden } takes a person off the page or puts them back
// What the public sees: first name and the first letter of the last name, town, skills and badges. Never a phone or email.
// Badges: Volunteer (joined through a form), Member (joined while signed in to a members account), Champion (the team's
// trusted local volunteers who visit requests; first name and district only, the same as on the vouching page).
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";
import { teamAccess } from "../lib/team-access.mts";

type Row = Record<string, any>;
const json = (body: unknown, status = 200, cache = "no-store") => Response.json(body, { status, headers: { "Cache-Control": cache } });
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max).replace(/[<>]/g, "");
const list = (v: unknown, max: number) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => clip(x, 80)).filter(Boolean).slice(0, max);

// "Suresh Ganesh" -> "Suresh G."; one word stays as it is.
const shortName = (n: string) => {
  const w = clip(n, 80).split(" ").filter(Boolean);
  if (!w.length) return "";
  const first = w[0].charAt(0).toUpperCase() + w[0].slice(1);
  return w.length > 1 ? `${first} ${w[w.length - 1].charAt(0).toUpperCase()}.` : first;
};

async function teamMember() {
  const m = await teamAccess();
  return m ? m.email : null;
}

async function publicList() {
  const db = getDatabase();
  const vols = await db.sql<Row>`SELECT name, contact, city, skills, member_email, created_at FROM volunteers
    WHERE show_public AND NOT hidden ORDER BY created_at DESC LIMIT 500`;
  const champs = await db.sql<Row>`SELECT name, email, district, created_at FROM champions WHERE active AND show_public ORDER BY created_at LIMIT 200`;
  const people: { name: string; town: string; skills: string[]; badges: string[]; since: string }[] = [];
  const byEmail = new Map<string, number>();
  for (const v of vols as Row[]) {
    const badges = ["Volunteer"]; if (v.member_email) badges.push("Member");
    people.push({ name: shortName(v.name), town: clip(v.city, 60), skills: v.skills || [], badges, since: new Date(v.created_at).toISOString().slice(0, 7) });
    for (const e of [v.member_email, v.contact]) if (e && /@/.test(e)) byEmail.set(String(e).toLowerCase(), people.length - 1);
  }
  for (const c of champs as Row[]) {
    const at = c.email ? byEmail.get(String(c.email).toLowerCase()) : undefined;
    if (at !== undefined) { people[at].badges.push("Champion"); if (!people[at].town) people[at].town = c.district; continue; }
    // Champions: first name and district only, as on the vouching page.
    people.push({ name: clip(c.name, 80).split(" ")[0], town: c.district, skills: ["Visiting and checking projects near me"], badges: ["Champion"], since: new Date(c.created_at).toISOString().slice(0, 7) });
  }
  // Champions first, then everyone else, newest first.
  people.sort((a, b) => Number(b.badges.includes("Champion")) - Number(a.badges.includes("Champion")));
  const skills: Record<string, number> = {};
  for (const p of people) for (const s of p.skills) skills[s] = (skills[s] || 0) + 1;
  return { people, skills };
}

export default async (req: Request) => {
  const isTeam = /\/team\/?$/.test(new URL(req.url).pathname);
  try {
    if (isTeam) {
      const who = await teamMember();
      if (!who) return json({ ok: false, error: "Team only." }, 403);
      const db = getDatabase();
      if (req.method === "PATCH") {
        let b: Row = {}; try { b = await req.json(); } catch { /* empty */ }
        const id = Number(b.id) || 0;
        await db.sql`UPDATE volunteers SET hidden = ${!!b.hidden} WHERE id = ${id}`;
        await db.sql`INSERT INTO audit_log (actor, action, target) VALUES (${who}, ${b.hidden ? "volunteer.hide" : "volunteer.show"}, ${String(id)})`;
      }
      const rows = await db.sql<Row>`SELECT * FROM volunteers ORDER BY created_at DESC LIMIT 1000`;
      return json({ ok: true, volunteers: rows });
    }
    if (req.method === "GET") return json({ ok: true, ...(await publicList()) }, 200, "public, max-age=60");
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    let f: Row;
    try { f = await req.json(); } catch { return json({ ok: false, error: "Could not read the form." }, 400); }
    if (clip(f["bot-field"], 10)) return json({ ok: true }); // robots fill the hidden field
    const name = clip(f.name, 80), contact = clip(f.email ?? f.contact, 120);
    if (!name || !contact) return json({ ok: false, error: "Please add your name and a WhatsApp number or email." }, 400);
    const user = await getUser().catch(() => null);
    const member = user && user.email ? user.email.toLowerCase() : "";
    const db = getDatabase();
    await db.sql`INSERT INTO volunteers (name, contact, phone, city, skills, help, availability, message, source, member_email, show_public)
      VALUES (${name}, ${contact}, ${clip(f.phone, 40)}, ${clip(f.city, 80)}, ${list(f.skills, 20)}::text[], ${list(f.help, 10)}::text[],
              ${clip(f.availability, 40)}, ${clip(f.message, 800)}, ${["spark", "volunteers"].includes(String(f.source)) ? String(f.source) : "volunteer"}, ${member},
              ${f.show === "yes" || f.show === true})`;
    await db.sql`INSERT INTO audit_log (actor, action, target) VALUES ('website', 'volunteer.joined', ${name})`;
    return json({ ok: true });
  } catch (e) {
    console.log("volunteers:", (e as Error).message);
    return json({ ok: false, error: "We could not do that just now. Please try again." }, 503);
  }
};

export const config: Config = {
  path: ["/api/volunteers", "/api/volunteers/team"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 30 },
};
