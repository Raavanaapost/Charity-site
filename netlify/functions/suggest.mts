// Public: the Initiate form ("Initiate an Opportunity") saves each suggestion into the database.
// The same form is also sent to Netlify Forms, which keeps a copy and can email the team.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";
import { notify } from "../lib/notify.mts";

const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const clipText = (v: unknown, max: number) => String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);

// 12 letters and digits, without look-alikes (0/o, 1/l/i), so it can be read out over the phone.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const endorseToken = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => ALPHABET[b % ALPHABET.length]).join("");

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let f: Record<string, unknown>;
  try {
    f = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Could not read the form." }, { status: 400 });
  }
  if (clip(f["bot-field"], 10)) return Response.json({ ok: true }); // robots fill the hidden field

  // Anyone can send a request; signing in is no longer needed (SURESH 28 Nov 2026, was members only since 9 Nov).
  // Signed in: the request is tied to the account and the email is used to reach them. Not signed in: they give
  // a phone, WhatsApp or email in "reach". SURESH still approves every request before anything goes public.
  const user = await getUser().catch(() => null);
  const memberEmail = user && user.email ? user.email.toLowerCase() : null;

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
    // Phone is optional now; without one the team reaches the person on their signed-in email (SURESH 23 Nov 2026).
    reach: clip(f.reach, 120) || memberEmail || "",
    trusted: clip(f.trusted_contact, 200),
    additional: clipText(f.additional, 1000),
    requestType: f.request_type === "referred" ? "referred" : "open",
    inName: clip(f.incharge_name, 120),
    inPhone: clip(f.incharge_phone, 40),
    inEmail: clip(f.incharge_email, 120).toLowerCase(),
  };
  if (s.requestType === "open") { s.inName = ""; s.inPhone = ""; s.inEmail = ""; }
  else if (!s.inName || (!s.inPhone && !s.inEmail)) {
    return Response.json({ ok: false, error: "Please add the name of the person in charge, and their phone or email." }, { status: 400 });
  }
  // From the Spark a Smile page (16 Nov 2026): request or submit, and one person or a group. Kept at the top of
  // "additional" so the team sees it in the portal without a new database column.
  const spark = [clip(f.way, 40), clip(f.started_by, 40), clip(f.group_type, 60), clip(f.group_name, 80)].filter(Boolean);
  // Sent from the Tamil form (23 Nov 2026): tell the team, so someone who reads Tamil picks it up.
  if (f.form_lang === "Tamil") spark.push("Sent in Tamil");
  if (spark.length) s.additional = clipText(`Started as: ${spark.join(" · ")}` + (s.additional ? `\n${s.additional}` : ""), 1000);
  s.location = [s.village, s.city].filter(Boolean).join(", ");
  // The public form asks four things: what kind of moment (+ optional details), where, how many, and who to call.
  // The team fills in the rest (title, category, evidence...) after calling and visiting.
  const KINDS: Record<string, string> = { "A day out or trip": "Trips & Events", "A game or sports day": "Trips & Events", "A celebration or festival": "Trips & Events", "Help with learning": "Education",
    // the same ideas on the Tamil form
    "ஒரு நாள் சுற்றுலா அல்லது பயணம்": "Trips & Events", "விளையாட்டு நாள்": "Trips & Events", "கொண்டாட்டம் அல்லது விழா": "Trips & Events", "கல்விக்கு உதவி": "Education" };
  if (s.kind) { if (!s.focus.includes(s.kind)) s.focus.unshift(s.kind); if (!s.category) s.category = KINDS[s.kind] || "Other"; }
  const first = s.description.split(/[.!?\n]/)[0];
  if (!s.title) s.title = first ? clip(first, 70) + (first.length > 70 ? "…" : "") : s.kind ? `${s.kind} in ${s.village || s.city}` : "";
  if (!s.description) s.description = s.kind;
  if (!s.reach) return Response.json({ ok: false, error: "Please add a phone, WhatsApp or email so we can reach you." }, { status: 400 });
  if (!s.title || !s.description || !s.city || !s.village || !s.children || !s.contact || !s.reach) {
    return Response.json({ ok: false, error: "Please fill in every required field." }, { status: 400 });
  }
  // A photo or document is optional; without one, the team sees it at the visit.
  const files = Math.max(0, Math.min(4, Number(f.evidence_files) || 0));
  const noEvidence = !files;
  const nonce = files ? crypto.randomUUID() : "";

  // The private link the person shares so people who know the project can vouch for it (/e/<token>).
  const endorse = endorseToken();

  const db = getDatabase();
  const [row] = await db.sql<{ id: number; ref: string }>`
    INSERT INTO suggestions (ref, title, category, focus, description, city, village, location, children, contact, reach, trusted, additional, upload_nonce, no_evidence, endorse_token, member_email, request_type, incharge_name, incharge_phone, incharge_email)
    VALUES ('S-' || nextval('suggestion_ref_seq'), ${s.title}, ${s.category}, ${s.focus}, ${s.description}, ${s.city}, ${s.village}, ${s.location},
            ${s.children}, ${s.contact}, ${s.reach}, ${s.trusted}, ${s.additional}, ${nonce}, ${noEvidence && !files}, ${endorse}, ${memberEmail}, ${s.requestType}, ${s.inName}, ${s.inPhone}, ${s.inEmail})
    RETURNING id, ref`;
  await db.sql`INSERT INTO audit_log (actor, action, target) VALUES ('website', 'suggestion.received', ${row.ref})`;
  // "We received your request" to the sender and the person in charge, right away (SURESH 21 Nov 2026).
  await notify(db, row.id, "received");
  return Response.json({ ok: true, ref: row.ref, upload: nonce, endorse });
};

export const config: Config = {
  path: "/api/suggest",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 5 },
};
