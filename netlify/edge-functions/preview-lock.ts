// Keeps the site private until launch.
// While the SITE_PASSWORD environment variable is set in Netlify, visitors must enter it.
// To go live, delete SITE_PASSWORD in Netlify (Project configuration → Environment variables) and redeploy.
export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const password = Netlify.env.get("SITE_PASSWORD");
  if (!password) return context.next();

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

export const config = { path: "/*" };
