// Event-day materials (SURESH 27 Nov 2026): one place for every photo, video, voice note, bill and document an
// organiser sends, from the Raavanaa WhatsApp number, the phone link for the day or the private album link.
// Files go to Netlify Blobs ("materials"; "materials-preview" on the draft), never to a public address.
// Photos get quick checks here (sharpness, light, a fingerprint to find near-duplicates); the AI checks (best photos,
// children's faces, receipts, voice notes) run later in materials-background.
import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { getDatabase } from "@netlify/database";
import jpeg from "jpeg-js";
import data from "../../projects.json" with { type: "json" };

type DB = ReturnType<typeof getDatabase>;
type Row = Record<string, any>;

export const isLive = (context: Context) => context.deploy?.context === "production";
export const materialsStore = (context: Context) => getStore({ name: isLive(context) ? "materials" : "materials-preview", consistency: "strong" });
export const dayStoreOf = (context: Context) => getStore({ name: isLive(context) ? "day" : "day-preview", consistency: "strong" });
export const storeFor = (context: Context, store: string) => (store === "day" ? dayStoreOf(context) : materialsStore(context));

// --- Phones -------------------------------------------------------------------------------------------------------
// WhatsApp gives "94771234567"; the team types "077 123 4567" or "+94 77 123 4567". Sri Lanka is the default country.
export function phoneKey(v: unknown): string {
  let d = String(v ?? "").replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = "94" + d.slice(1);
  else if (d.length === 9 && d.startsWith("7")) d = "94" + d;
  return d.length >= 8 && d.length <= 15 ? d : "";
}
export const looksLikePhone = (v: unknown) => !String(v ?? "").includes("@") && !!phoneKey(v);

// --- Projects ----------------------------------------------------------------------------------------------------
const FILE: { slug?: string; title?: string; hidden?: boolean }[] = ((data as { projects?: any[] }).projects || []).filter((p) => p && p.slug);
export async function projectTitles(db: DB): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  FILE.forEach((p) => m.set(String(p.slug), String(p.title || p.slug)));
  try {
    const rows = (await db.sql`SELECT slug, data FROM site_projects WHERE NOT hidden`) as Row[];
    rows.forEach((r) => { if (r.slug && !m.has(r.slug)) m.set(r.slug, String(r.data?.title || r.slug)); });
  } catch { /* table missing on an old database */ }
  return m;
}

// Which open projects a phone is in charge of (People in charge, thread "Write organiser responsibility agreement").
// Projects whose money books are closed are left out: their day is over.
export async function projectsForPhone(db: DB, phone: string): Promise<string[]> {
  if (!phone) return [];
  const rows = (await db.sql`SELECT DISTINCT p.slug, p.contact FROM agreement_people p
    WHERE NOT p.removed AND p.contact <> '' AND NOT EXISTS (SELECT 1 FROM money_books b WHERE b.slug = p.slug AND b.closed_at IS NOT NULL)`) as Row[];
  return [...new Set(rows.filter((r) => phoneKey(r.contact) === phone).map((r) => String(r.slug)))];
}

// --- Photo checks ------------------------------------------------------------------------------------------------
export type PhotoCheck = { sharp: number; bright: number; dhash: string };
// Sharpness = how much the picture changes from one dot to the next (variance of the Laplacian) on a small grey copy.
// A blurry or shaken photo scores low. Brightness = average light, 0 to 255. dhash = 64-bit fingerprint of the shapes.
export function checkJpeg(buf: Uint8Array): PhotoCheck | null {
  let img: { width: number; height: number; data: Uint8Array };
  try { img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxResolutionInMP: 60, maxMemoryUsageInMB: 700 }) as any; } catch { return null; }
  const { width: W, height: H, data: px } = img;
  if (!W || !H) return null;
  const gw = Math.min(400, W), gh = Math.max(1, Math.round((H * gw) / W));
  const g = new Float32Array(gw * gh);
  // Box-average the photo into a small grey picture.
  for (let y = 0; y < gh; y++) {
    const y0 = Math.floor((y * H) / gh), y1 = Math.max(y0 + 1, Math.floor(((y + 1) * H) / gh));
    for (let x = 0; x < gw; x++) {
      const x0 = Math.floor((x * W) / gw), x1 = Math.max(x0 + 1, Math.floor(((x + 1) * W) / gw));
      let s = 0, n = 0;
      for (let yy = y0; yy < y1; yy += 2) for (let xx = x0; xx < x1; xx += 2) {
        const i = (yy * W + xx) * 4; s += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; n++;
      }
      g[y * gw + x] = n ? s / n : 0;
    }
  }
  let sum = 0;
  for (let i = 0; i < g.length; i++) sum += g[i];
  const bright = sum / g.length;
  let ls = 0, ls2 = 0, ln = 0;
  for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
    const i = y * gw + x, l = g[i - 1] + g[i + 1] + g[i - gw] + g[i + gw] - 4 * g[i];
    ls += l; ls2 += l * l; ln++;
  }
  const sharp = ln ? ls2 / ln - (ls / ln) ** 2 : 0;
  // dHash: 9 x 8 grey, each bit says whether a cell is lighter than its right neighbour.
  const cell = (cx: number, cy: number) => {
    const x0 = Math.floor((cx * gw) / 9), x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * gw) / 9));
    const y0 = Math.floor((cy * gh) / 8), y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * gh) / 8));
    let s = 0, n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { s += g[y * gw + x]; n++; }
    return n ? s / n : 0;
  };
  let bits = "";
  for (let y = 0; y < 8; y++) { const row = Array.from({ length: 9 }, (_, x) => cell(x, y)); for (let x = 0; x < 8; x++) bits += row[x] > row[x + 1] ? "1" : "0"; }
  const dhash = bits.match(/.{4}/g)!.map((b) => parseInt(b, 2).toString(16)).join("");
  return { sharp: Math.round(sharp * 10) / 10, bright: Math.round(bright), dhash };
}
export function hamming(a: string, b: string) {
  if (a.length !== 16 || b.length !== 16) return 64;
  let d = 0;
  for (let i = 0; i < 16; i++) { let x = parseInt(a[i], 16) ^ parseInt(b[i], 16); while (x) { d += x & 1; x >>= 1; } }
  return d;
}
// Tuned to set aside only clearly poor photos; the team can always bring one back.
export const BLURRY = 25, DARK = 30, SAME = 6;
export function weakReason(c: PhotoCheck) {
  if (c.bright < DARK) return "too dark";
  if (c.sharp < BLURRY) return "blurry";
  return "";
}

// --- Saving ------------------------------------------------------------------------------------------------------
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/3gpp": "3gp", "video/quicktime": "mov",
  "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac", "audio/amr": "amr", "application/pdf": "pdf" };
export const kindOf = (mime: string, hint = "") =>
  hint === "bill" ? "photo" : mime.startsWith("image/") ? "photo" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "document";
export function newKey(slug: string, mime: string) {
  const ext = EXT[mime.split(";")[0].trim()] || "bin";
  return `${slug || "unsorted"}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

// Runs the quick photo checks on a stored item and sets aside a weak photo or a near-duplicate of a better one.
export async function quickCheck(db: DB, id: number, buf: Uint8Array, mime: string) {
  if (!/jpe?g/.test(mime)) return;
  const c = checkJpeg(buf);
  if (!c) return;
  let status = "", reason = weakReason(c);
  const [me] = (await db.sql`SELECT slug, status FROM event_materials WHERE id = ${id}`) as Row[];
  if (!me) return;
  if (!reason && me.slug) {
    const others = (await db.sql`SELECT id, sharp, dhash, status FROM event_materials WHERE slug = ${me.slug} AND kind = 'photo' AND id <> ${id} AND dhash <> '' AND status IN ('new', 'published')`) as Row[];
    const twin = others.find((o) => hamming(o.dhash, c.dhash) <= SAME);
    if (twin) {
      if (twin.status === "published" || twin.sharp >= c.sharp) reason = "near-duplicate";
      else await db.sql`UPDATE event_materials SET status = 'set_aside', reason = 'near-duplicate' WHERE id = ${twin.id} AND status = 'new'`;
    }
  }
  if (reason && me.status === "new") status = "set_aside";
  await db.sql`UPDATE event_materials SET sharp = ${c.sharp}, bright = ${c.bright}, dhash = ${c.dhash},
    status = CASE WHEN ${status} <> '' THEN ${status} ELSE status END, reason = CASE WHEN ${reason} <> '' THEN ${reason} ELSE reason END WHERE id = ${id}`;
}

// Asks the background worker to take the next items in the queue (downloads from WhatsApp, AI checks).
export async function wakeWorker(req: Request) {
  try {
    await fetch(new URL("/.netlify/functions/materials-background", req.url), { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  } catch (e) { console.log("materials: could not wake the worker", e); }
}

// Saves a file sent through a page (album link or portal), as bytes, and files it. Returns the new id.
export async function saveUpload(context: Context, db: DB, o: { slug: string; source: string; sender: string; mime: string; name?: string; caption?: string; buf: Uint8Array; hint?: string }) {
  const key = newKey(o.slug, o.mime);
  await materialsStore(context).set(key, o.buf.buffer.slice(o.buf.byteOffset, o.buf.byteOffset + o.buf.length) as ArrayBuffer, { metadata: { type: o.mime } });
  const kind = kindOf(o.mime, o.hint);
  const [r] = (await db.sql`INSERT INTO event_materials (slug, source, sender, kind, mime, size, name, blob, caption, ai_status, ai)
    VALUES (${o.slug}, ${o.source}, ${o.sender}, ${kind}, ${o.mime}, ${o.buf.length}, ${o.name || ""}, ${key}, ${o.caption || ""}, ${kind === "photo" || kind === "audio" ? "queued" : ""}, ${JSON.stringify(o.hint === "bill" ? { hint: "bill" } : {})}::jsonb) RETURNING id`) as Row[];
  await quickCheck(db, r.id, o.buf, o.mime);
  return r.id as number;
}

// A data URL from a page ("data:image/jpeg;base64,...") into bytes, checked to really be a photo.
export function photoBytes(dataUrl: unknown, max = 4.5 * 1024 * 1024): { mime: string; buf: Uint8Array } | null {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  const buf = new Uint8Array(Buffer.from(m[2], "base64"));
  if (!buf.length || buf.length > max) return null;
  const ok = m[1] === "jpeg" ? buf[0] === 0xff && buf[1] === 0xd8 : m[1] === "png" ? buf[0] === 0x89 && buf[1] === 0x50 : buf[8] === 0x57 && buf[9] === 0x45;
  return ok ? { mime: `image/${m[1]}`, buf } : null;
}
