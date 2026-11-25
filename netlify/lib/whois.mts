// Who is signed in, for vouches, ratings and comments (25 Nov 2026). The sign-in cookie (nf_jwt) runs out after an hour
// while the browser still shows the person as signed in, so their vouch came back "please sign in" and was lost
// (SURESH's Kandy trip vouch, 25 Nov). The page now also sends a fresh token as "Authorization: Bearer"; it is checked
// with Netlify Identity itself.
import { getUser } from "@netlify/identity";

export type Who = { email: string; user_metadata: Record<string, any> };

export async function whoIs(req: Request): Promise<Who | null> {
  const auth = req.headers.get("authorization") || "";
  if (/^Bearer\s+\S+/i.test(auth)) {
    try {
      const r = await fetch(new URL("/.netlify/identity/user", req.url), { headers: { Authorization: auth } });
      if (r.ok) {
        const u = await r.json();
        if (u && u.email) return { email: String(u.email).toLowerCase(), user_metadata: u.user_metadata || {} };
      }
    } catch { /* fall back to the cookie */ }
  }
  const u = await getUser().catch(() => null) as Record<string, any> | null;
  if (u && u.email) return { email: String(u.email).toLowerCase(), user_metadata: u.user_metadata || u.metadata || {} };
  return null;
}
