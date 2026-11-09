// Public, but only for a suggestion that was just sent: uploads its evidence files (photos, PDFs, short videos).
// The browser sends each file in parts of up to 4 MB (functions accept about 4.5 MB per request).
// Headers: x-upload (the code returned by /api/suggest), x-file (an id for this file), x-part, x-parts, x-name, x-type, x-size.
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getStore } from "@netlify/blobs";

const MAX_FILES = 3, MAX_PARTS = 8, MAX_PART = 4 * 1024 * 1024 + 1024, WINDOW_MIN = 60;
const TYPES = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf|video\/(mp4|quicktime|webm|3gpp))$/;
const evidenceStore = (context: Context) =>
  getStore({ name: context.deploy?.context === "production" ? "evidence" : "evidence-preview", consistency: "strong" });

// The first bytes of a file say what it really is. A file named "photo.jpg" that is really a program is refused.
function looksLike(type: string, b: Uint8Array) {
  const at = (o: number, ...xs: number[]) => xs.every((x, i) => b[o + i] === x);
  const ascii = (o: number, t: string) => at(o, ...[...t].map((c) => c.charCodeAt(0)));
  if (type === "image/jpeg") return at(0, 0xff, 0xd8, 0xff);
  if (type === "image/png") return at(0, 0x89, 0x50, 0x4e, 0x47);
  if (type === "image/webp") return ascii(0, "RIFF") && ascii(8, "WEBP");
  if (type === "application/pdf") return ascii(0, "%PDF");
  if (type === "video/webm") return at(0, 0x1a, 0x45, 0xdf, 0xa3);
  // HEIC/HEIF photos, MP4, MOV and 3GP videos all start with a "ftyp" box
  return ascii(4, "ftyp");
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const h = (k: string) => (req.headers.get(k) || "").trim();
  const nonce = h("x-upload"), fileId = h("x-file"), type = h("x-type").toLowerCase();
  const part = Number(h("x-part")), parts = Number(h("x-parts")), size = Number(h("x-size")) || 0;
  const name = h("x-name").replace(/[^\w.\- ()]/g, "_").slice(0, 120) || "file";
  const bad = (msg: string, status = 400) => Response.json({ ok: false, error: msg }, { status });

  if (!/^[0-9a-f-]{36}$/.test(nonce) || !/^[0-9a-z-]{8,40}$/i.test(fileId)) return bad("Upload not allowed.", 403);
  if (!TYPES.test(type)) return bad("Only photos, PDF documents and short videos can be added.");
  if (!Number.isInteger(part) || !Number.isInteger(parts) || parts < 1 || parts > MAX_PARTS || part < 0 || part >= parts) return bad("That file is too big.");

  const db = getDatabase();
  const [sug] = await db.sql<{ id: number }>`
    SELECT id FROM suggestions WHERE upload_nonce = ${nonce} AND received_at > NOW() - (${WINDOW_MIN} * INTERVAL '1 minute')`;
  if (!sug) return bad("Upload not allowed.", 403);

  const key = `${nonce}/${fileId}`;
  const [existing] = await db.sql<{ id: number }>`SELECT id FROM suggestion_files WHERE file_key = ${key}`;
  if (!existing) {
    const [count] = await db.sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM suggestion_files WHERE suggestion_id = ${sug.id}`;
    if (count.n >= MAX_FILES) return bad(`Up to ${MAX_FILES} files can be added.`);
    await db.sql`INSERT INTO suggestion_files (suggestion_id, file_key, name, type, size, parts)
                 VALUES (${sug.id}, ${key}, ${name}, ${type}, ${size}, ${parts})`;
  }

  const body = await req.arrayBuffer();
  if (!body.byteLength || body.byteLength > MAX_PART) return bad("That part of the file is too big.");
  if (part === 0 && !looksLike(type, new Uint8Array(body, 0, Math.min(16, body.byteLength)))) {
    await db.sql`DELETE FROM suggestion_files WHERE file_key = ${key} AND NOT complete`;
    return bad("That file doesn't look like a real photo, PDF or video, so it was not added.");
  }
  await evidenceStore(context).set(`${key}/${part}`, body, { metadata: { type } });
  if (part === parts - 1) {
    await db.sql`UPDATE suggestion_files SET complete = TRUE WHERE file_key = ${key}`;
    const [s] = await db.sql<{ ref: string }>`SELECT ref FROM suggestions WHERE id = ${sug.id}`;
    await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES ('website', 'suggestion.evidence', ${s.ref}, ${JSON.stringify({ name, type, size })}::jsonb)`;
  }
  return Response.json({ ok: true });
};

export const config: Config = {
  path: "/api/suggest/evidence",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 40 },
};
