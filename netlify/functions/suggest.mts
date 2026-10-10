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
    kind: clip(f.kind, 60),
    description: clipText(f.description, 1000),
    city: clip(f.city === "Other" ? f.city_other : f.city, 60),
    village: clip(f.village, 80),
    location: "",
    children: clip(f.children, 30),
    contact: clip(f.contact, 120),
    reach: clip(f.reach, 120),
    trusted: clip(f.trusted_contact, 200),
    additional: clipText(f.additional, 1000),
  };
  s.location = [s.village, s.city].filter(Boolean).join(", ");
  // The public form asks four things: what kind of moment (+ optional details), where, how many, and who to call.
  // The team fills in the rest (title, category, evidence...) after calling and visiting.
  const KINDS: Record<string, string> = { "A day out or trip": "Trips & Events", "A game or sports day": "Trips & Events", "A celebration or festival": "Trips & Events", "Help with learning": "Education" };
  if (s.kind) { if (!s.focus.includes(s.kind)) s.focus.unshift(s.kind); if (!s.category) s.category = KINDS[s.kind] || "Other"; }
  const first = s.description.split(/[.!?\n]/)[0];
  if (!s.title) s.title = first ? clip(first, 70) + (first.length > 70 ? "…" : "") : s.kind ? `${s.kind} in ${s.village || s.city}` : "";
  if (!s.description) s.description = s.kind;
  if (!s.title || !s.description || !s.city || !s.village || !s.children || !s.contact || !s.reach) {
    return Response.json({ ok: false, error: "Please fill in every required field." }, { status: 400 });
  }
  // A photo or document is optional; without one, the team sees it at the visit.
  const files = Math.max(0, Math.min(3, Number(f.evidence_files) || 0));
  const noEvidence = !files;
  const nonce = files ? crypto.randomUUID() : "";

  const db = getDatabase();
  const [row] = await db.sql<{ ref: string }>`
    INSERT INTO suggestions (ref, title, category, focus, description, city, village, location, children, contact, reach, trusted, additional, upload_nonce, no_evidence)
    VALUES ('S-' || nextval('suggestion_ref_seq'), ${s.title}, ${s.category}, ${s.focus}, ${s.description}, ${s.city}, ${s.village}, ${s.location},
            ${s.children}, ${s.contact}, ${s.reach}, ${s.trusted}, ${s.additional}, ${nonce}, ${noEvidence && !files})
    RETURNING ref`;
  await db.sql`INSERT INTO audit_log (actor, action, target) VALUES ('website', 'suggestion.received', ${row.ref})`;
  return Response.json({ ok: true, ref: row.ref, upload: nonce });
};

export const config: Config = {
  path: "/api/suggest",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 5 },
};
