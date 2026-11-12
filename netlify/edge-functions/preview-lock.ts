// Keeps the site private until launch.
// While the SITE_PASSWORD environment variable is set in Netlify, visitors must enter it.
// To go live, delete SITE_PASSWORD in Netlify (Project configuration → Environment variables) and redeploy.
// The "Coming soon" home page and its pictures are open to everyone; the rest stays private.
const PUBLIC = new Set([
  "/", "/index.html",
  "/img/coming-soon-wide.webp", "/img/coming-soon-wide.jpg",
  "/img/coming-soon-tall.webp", "/img/coming-soon-tall.jpg",
  "/img/og-coming-soon.jpg",
  "/img/favicon-32.png", "/img/icon-192.png", "/img/apple-touch-icon.png",
  "/robots.txt", "/favicon.ico",
  // The web app's own files: its name and icon, the "no connection" page and the script that keeps saved copies.
  // A phone fetches these in the background, where it cannot ask for the password. They hold nothing private.
  "/app.webmanifest", "/sw.js", "/offline.html",
]);

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const password = Netlify.env.get("SITE_PASSWORD");
  if (!password) return context.next();
  const path = new URL(request.url).pathname;
  if (PUBLIC.has(path)) return context.next();
  // Share pictures (logo, drawings and share titles; never a photo of a child) are open so vouch links
  // show their picture on WhatsApp before launch (SURESH, 10 Nov 2026).
  if (/^\/img\/share\/[a-z0-9-]+\.jpg$/.test(path)) return context.next();
  // The web app's icons (the heart from the logo on cream).
  if (/^\/img\/app\/[a-z0-9-]+\.png$/.test(path)) return context.next();
  // Endorse links (/e/<link>) are shared on WhatsApp before launch too, so people can vouch without the password.
  if (path.startsWith("/e/") || path.startsWith("/ta/e/") || path === "/endorse.html" || path === "/endorse.js" || path === "/endorse.css"
    || /^\/img\/(project-[a-z]+|hero-initiated)\.svg$/.test(path) || /^\/img\/(logo|members-bridge)\.(webp|jpg)$/.test(path)) return context.next();

  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (given === password) return context.next();
    } catch (_) { /* fall through to the prompt */ }
  }

  return new Response(
    "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><title>Raavanaa · Coming soon</title><body style='font-family:system-ui;padding:40px 20px;text-align:center;color:#0f5132'><h1>Raavanaa · Beyond the Lanes</h1><p>Our website is coming soon.</p>",
    { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Raavanaa preview", charset="UTF-8"', "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } }
  );
};

// Sign-in requests (Netlify Identity) and the portal API carry their own login, so the site password must not block them.
export const config = { path: "/*", excludedPath: ["/.netlify/*", "/api/*"] };
