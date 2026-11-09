// Public: community endorsement of a request (SURESH, 9 Nov 2026).
//   GET  /api/endorse/:token   the request as people see it on /e/:token, with who has vouched so far
//   POST /api/endorse/:token   vouch for it: { name, relation: role|know|seen, role, phone, agree: true }
// Phone numbers are kept for the team only and never sent back. One phone vouches once per request, and the
// person who sent the request cannot vouch for their own.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";

const NEEDED = 3; // endorsements to become community-backed, at least one of them from someone in a role
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const phoneKey = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-9);
const firstName = (v: string) => clip(v.split(/[,(]/)[0], 40);

type Row = Record<string, any>;

async function load(db: ReturnType<typeof getDatabase>, token: string) {
  if (!/^[a-z0-9]{8,32}$/.test(token)) return null;
  const [s] = await db.sql<Row>`SELECT * FROM suggestions WHERE endorse_token = ${token}`;
  return s || null;
}

async function view(db: ReturnType<typeof getDatabase>, s: Row) {
  const rows = await db.sql<Row>`
    SELECT name, relation, role, created_at FROM endorsements WHERE suggestion_id = ${s.id} AND NOT hidden ORDER BY created_at`;
  const endorsements = (rows as Row[]).map((e) => ({ name: e.name, relation: e.relation, role: e.role, at: e.created_at }));
  const hasRole = endorsements.some((e) => e.relation === "role");
  const backed = endorsements.length >= NEEDED && hasRole;
  const verified = ["verified", "project"].includes(s.status);
  const p = (s.profile || {}) as Record<string, string>;
  // Until the team approves the page, people only see that it is being checked (SURESH, 9 Nov 2026).
  if (!s.share_ok) {
    return {
      pending: true, title: p.title || s.title, by: firstName(s.contact || ""), received: s.received_at, closed: s.status === "declined",
      needed: NEEDED, endorsements: [], ladder: { submitted: true, backed: false, hasRole: false, verified: false, project: false },
    };
  }
  return {
    pending: false,
    title: p.title || s.title,
    kind: p.activity || (s.focus || [])[0] || "",
    description: p.summary || (s.description === (s.focus || [])[0] ? "" : s.description),
    place: p.place || s.location || [s.village, s.city].filter(Boolean).join(", "),
    children: p.children || s.children,
    when: p.when || "",
    budget: p.budget || "",
    by: firstName(s.contact || ""),
    received: s.received_at,
    closed: s.status === "declined",
    needed: NEEDED,
    endorsements,
    ladder: { submitted: true, backed, hasRole, verified, project: s.status === "project" },
  };
}

export default async (req: Request) => {
  const token = new URL(req.url).pathname.replace(/^\/api\/endorse\/?/, "").split("/")[0].toLowerCase();
  const db = getDatabase();
  const s = await load(db, token);
  if (!s) return json({ ok: false, error: "We couldn't find this request. Check the link and try again." }, 404);

  if (req.method === "GET") return json({ ok: true, request: await view(db, s) });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  let f: Record<string, unknown>;
  try { f = await req.json(); } catch { return json({ ok: false, error: "Could not read the form." }, 400); }
  if (clip(f["bot-field"], 10)) return json({ ok: true, request: await view(db, s) }); // robots fill the hidden field

  if (s.status === "declined") return json({ ok: false, error: "This request is closed, so it can't take endorsements." }, 409);
  if (!s.share_ok) return json({ ok: false, error: "Raavanaa is still checking this request. You can vouch once it is approved." }, 409);
  const e = {
    name: clip(f.name, 80),
    relation: clip(f.relation, 10),
    role: clip(f.role, 120),
    phone: clip(f.phone, 40),
  };
  if (!["role", "know", "seen"].includes(e.relation)) return json({ ok: false, error: "Please say how you know about this project." }, 400);
  if (e.relation !== "role") e.role = clip(f.how, 120); // optional few words, e.g. "Friend of the organiser"
  if (!e.name || e.name.length < 2) return json({ ok: false, error: "Please add your name." }, 400);
  if (e.relation === "role" && !e.role) return json({ ok: false, error: "Please add your role, for example Principal of the school." }, 400);
  const key = phoneKey(e.phone);
  if (key.length < 9) return json({ ok: false, error: "Please add a mobile number we can call." }, 400);
  if (f.agree !== true && f.agree !== "on" && f.agree !== "yes") return json({ ok: false, error: "Please tick the box to confirm." }, 400);
  if (key === phoneKey(s.reach)) return json({ ok: false, error: "This is the number that sent the request. Please ask other people to vouch for it." }, 409);

  const added = await db.sql<{ id: number }>`
    INSERT INTO endorsements (suggestion_id, name, relation, role, phone, phone_key)
    VALUES (${s.id}, ${e.name}, ${e.relation}, ${e.role}, ${e.phone}, ${key})
    ON CONFLICT (suggestion_id, phone_key) DO NOTHING
    RETURNING id`;
  if (!(added as unknown[]).length) return json({ ok: false, error: "This phone number has already vouched for this request." }, 409);
  await db.sql`INSERT INTO audit_log (actor, action, target, details)
    VALUES ('website', 'suggestion.endorsed', ${s.ref}, ${JSON.stringify({ name: e.name, relation: e.relation, role: e.role })}::jsonb)`;
  return json({ ok: true, request: await view(db, s) });
};

export const config: Config = {
  path: "/api/endorse/*",
  method: ["GET", "POST"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 20 },
};
