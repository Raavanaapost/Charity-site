// Public: a safe summary of the smile requests our team is still checking, for the front page.
// It only ever shows the kind of day (from the form's fixed list), the district (only if it is a
// known district), the children band (fixed list), the month it came in and where it is in the checks.
// Never names, villages, contacts, descriptions or anything the person typed freely.
import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";

const KINDS = ["A day out or trip", "A game or sports day", "A good meal together", "A celebration or festival", "Help with learning"];
const CHILDREN = ["Fewer than 10", "10 to 25", "25 to 50", "50 to 100", "More than 100"];
const DISTRICTS = ["Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"];
const district = (v: unknown) => {
  const t = String(v ?? "").replace(/\s+district$/i, "").trim().toLowerCase();
  return DISTRICTS.find((d) => d.toLowerCase() === t) || "";
};
// new: just arrived; visit: a visit is planned; verified: visited and checked, the day is being planned.
const STEPS: Record<string, string> = { new: "received", visit: "visit", verified: "planning" };

export default async () => {
  try {
    const db = getDatabase();
    const rows = (await db.sql`
      SELECT status, received_at, focus, city, children FROM suggestions
      WHERE status IN ('new', 'visit', 'verified') ORDER BY received_at DESC LIMIT 200`) as {
      status: string; received_at: string; focus: string[]; city: string; children: string;
    }[];
    const [all] = (await db.sql`SELECT COUNT(*)::int AS n FROM suggestions`) as { n: number }[];
    const list = rows.map((r) => ({
      kind: KINDS.find((k) => (r.focus || []).includes(k)) || "A day of joy",
      town: district(r.city),
      children: CHILDREN.includes(r.children) ? r.children : "",
      month: new Date(r.received_at).toISOString().slice(0, 7),
      step: STEPS[r.status] || "received",
    }));
    return Response.json({ checking: list.length, received: all ? all.n : list.length, list: list.slice(0, 12) },
      { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return Response.json({ checking: 0, received: 0, list: [], unavailable: true }, { headers: { "Cache-Control": "no-store" } });
  }
};

export const config: Config = { path: "/api/pipeline" };
