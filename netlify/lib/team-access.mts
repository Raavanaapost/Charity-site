// Who may use the team portal (one rule for every function).
// A signed-in Netlify Identity user is on the team when ANY of these is true:
//   1. their Identity role is "admin" or "team" (set by hand in Netlify),
//   2. their email is in the PORTAL_ADMINS environment variable (the owner; always admin, cannot be removed in the portal),
//   3. their email was added in the portal under Team & logins (table portal_access, 20 Nov 2026).
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";

export type TeamMember = { email: string; name: string; roles: string[]; admin: boolean; owner: boolean };

export const ownerEmails = () => (Netlify.env.get("PORTAL_ADMINS") || "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);

export async function teamAccess(): Promise<TeamMember | null> {
  const user = await getUser().catch(() => null);
  if (!user || !user.email) return null;
  const email = user.email.toLowerCase();
  const roles: string[] = Array.isArray((user as any).roles) ? (user as any).roles : [];
  const owner = ownerEmails().includes(email);
  let admin = owner || roles.includes("admin");
  let team = admin || roles.includes("team");
  let listedName = "";
  if (!admin) {
    try {
      const rows = await getDatabase().sql<Record<string, any>>`SELECT name, role FROM portal_access WHERE email = ${email} LIMIT 1`;
      const r = (rows as Record<string, any>[])[0];
      if (r) { team = true; admin = r.role === "admin"; listedName = r.name || ""; }
    } catch { /* table not there yet: fall back to roles only */ }
  }
  if (!team) return null;
  const meta = user as { user_metadata?: { full_name?: string }; userMetadata?: { full_name?: string } };
  const name = meta.user_metadata?.full_name || meta.userMetadata?.full_name || listedName || email.split("@")[0];
  return { email, name, roles, admin, owner };
}
