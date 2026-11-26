// Photos for the project day (live posts, receipts, sponsor thank-you pages), SURESH 26 Nov 2026.
// The browser makes each photo small (about 1600 px, JPEG) before sending it, so one request is enough.
import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export const dayStore = (context: Context) =>
  getStore({ name: context.deploy?.context === "production" ? "day" : "day-preview", consistency: "strong" });

const MAX = 3.5 * 1024 * 1024;
// Saves a "data:image/jpeg;base64,..." photo and returns its key, "" when there is none, or null when it is not a photo.
export async function savePhoto(context: Context, slug: string, dataUrl: unknown): Promise<string | null> {
  const s = String(dataUrl || "");
  if (!s) return "";
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(s);
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > MAX) return null;
  const b = new Uint8Array(buf);
  const ok = m[1] === "jpeg" ? b[0] === 0xff && b[1] === 0xd8 : m[1] === "png" ? b[0] === 0x89 && b[1] === 0x50 : b[8] === 0x57 && b[9] === 0x45;
  if (!ok) return null;
  const key = `${slug}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  await dayStore(context).set(key, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) as ArrayBuffer, { metadata: { type: `image/${m[1]}` } });
  return key;
}
export const photoUrl = (key: string) => (key ? `/api/day/photo/${key}` : "");
