// Public: the Initiate form ("Initiate an Opportunity") saves each suggestion into the database.
// The same form is also sent to Netlify Forms, which keeps a copy and can email the team.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";

const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const clipText = (v: unknown, max: number) => String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let f: Record<string, unknown>;
  try {
    f = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Could not read the form." }, { status: 400 });
  }
  if (clip(f["bot-field"], 10)) return Response.json({ ok: true }); // robots fill the hidden field

  const s = {
    title: clip(f.title, 120),
    category: clip(f.category, 40),
    focus: (Array.isArray(f.focus) ? f.focus : String(f.focus ?? "").split(",")).map((x) => clip(x, 60)).filter(Boolean).slice(0, 10),
    description: clipText(f.description, 1000),
    location: clip(f.location, 160),
    children: clip(f.children, 20),
    contact: clip(f.contact, 120),
    reach: clip(f.reach, 120),
    trusted: clip(f.trusted_contact, 200),
    additional: clipText(f.additional, 1000),
  };
  if (!s.title || !s.description || !s.location || !s.children || !s.reach) {
    return Response.json({ ok: false, error: "Please fill in every required field." }, { status: 400 });
  }

  const db = getDatabase();
  const [row] = await db.sql<{ ref: string }>`
    INSERT INTO suggestions (ref, title, category, focus, description, location, children, contact, reach, trusted, additional)
    VALUES ('S-' || nextval('suggestion_ref_seq'), ${s.title}, ${s.category}, ${s.focus}, ${s.description}, ${s.location},
            ${s.children}, ${s.contact}, ${s.reach}, ${s.trusted}, ${s.additional})
    RETURNING ref`;
  await db.sql`INSERT INTO audit_log (actor, action, target) VALUES ('website', 'suggestion.received', ${row.ref})`;
  return Response.json({ ok: true, ref: row.ref });
};

export const config: Config = {
  path: "/api/suggest",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 5 },
};
