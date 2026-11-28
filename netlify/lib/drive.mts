// Read-only Google Drive access for the family albums (SURESH 28 Nov 2026).
// A Google "service account" (the Raavanaa robot) is given VIEW access to the "Raavanaa – Projects" Drive folder.
// Its key goes in the Netlify setting GOOGLE_SERVICE_ACCOUNT_JSON (the whole JSON file Google gives you).
// The robot can only look: the scope below is drive.readonly, so it can never change or delete anything.
import { createSign } from "node:crypto";

type Row = Record<string, any>;
const API = "https://www.googleapis.com/drive/v3";
let cached: { token: string; until: number } | null = null;

export function robot(): { email: string; key: string } | null {
  try {
    const raw = Netlify.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "";
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (!j.client_email || !j.private_key) return null;
    return { email: String(j.client_email), key: String(j.private_key).replace(/\\n/g, "\n") };
  } catch { return null; }
}

async function token(): Promise<string> {
  if (cached && cached.until > Date.now() + 60_000) return cached.token;
  const r = robot();
  if (!r) throw new Error("The Drive robot is not set up yet (GOOGLE_SERVICE_ACCOUNT_JSON).");
  const b64 = (v: unknown) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT" });
  const claim = b64({ iss: r.email, scope: "https://www.googleapis.com/auth/drive.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(r.key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }) });
  const d = (await res.json().catch(() => ({}))) as Row;
  if (!res.ok || !d.access_token) throw new Error(`Google sign-in for the robot failed: ${d.error_description || d.error || res.status}`);
  cached = { token: d.access_token, until: Date.now() + (Number(d.expires_in) || 3600) * 1000 };
  return cached.token;
}

async function call(path: string, params: Record<string, string> = {}): Promise<Row> {
  const q = new URLSearchParams({ supportsAllDrives: "true", ...params });
  const res = await fetch(`${API}${path}?${q}`, { headers: { Authorization: `Bearer ${await token()}` } });
  const d = (await res.json().catch(() => ({}))) as Row;
  if (!res.ok) {
    const e = new Error(res.status === 404 ? "The robot cannot see that Drive folder. Share it with the robot's email (Viewer)." : `Drive said: ${d.error?.message || res.status}`);
    (e as any).status = res.status;
    throw e;
  }
  return d;
}

// The folder id from anything the team pastes: a folder link, an "open?id=" link, or the bare id.
export function folderId(input: string): string {
  const s = String(input || "").trim();
  const m = /\/folders\/([\w-]{10,})/.exec(s) || /[?&]id=([\w-]{10,})/.exec(s) || /^([\w-]{10,})$/.exec(s);
  return m ? m[1] : "";
}

export type Item = { id: string; name: string; kind: "photo" | "video"; mime: string; size: number; at: string; w?: number; h?: number };
export type Section = { id: string; name: string; items: Item[] };
const FOLDER = "application/vnd.google-apps.folder";
const kindOf = (mime: string) => (mime.startsWith("image/") ? "photo" : mime.startsWith("video/") ? "video" : null);

async function children(id: string): Promise<Row[]> {
  const out: Row[] = [];
  let pageToken = "";
  do {
    const d = await call("/files", { q: `'${id.replace(/'/g, "")}' in parents and trashed = false`, includeItemsFromAllDrives: "true", pageSize: "1000", orderBy: "name",
      fields: "nextPageToken, files(id, name, mimeType, size, createdTime, imageMediaMetadata(width, height, time))", ...(pageToken ? { pageToken } : {}) });
    out.push(...(d.files || []));
    pageToken = d.nextPageToken || "";
  } while (pageToken && out.length < 5000);
  return out;
}

// The album as the family sees it: the photos in the folder itself, then one section per sub-folder (one level down).
export async function listAlbum(root: string): Promise<{ name: string; sections: Section[] }> {
  const meta = await call(`/files/${root}`, { fields: "id, name, mimeType" });
  if (meta.mimeType !== FOLDER) throw new Error("That Drive link is a file, not a folder.");
  const toItems = (rows: Row[]) => rows.map((f) => {
    const k = kindOf(String(f.mimeType || ""));
    return k ? { id: f.id, name: f.name, kind: k, mime: f.mimeType, size: Number(f.size) || 0, at: f.imageMediaMetadata?.time || f.createdTime, w: f.imageMediaMetadata?.width, h: f.imageMediaMetadata?.height } as Item : null;
  }).filter(Boolean) as Item[];
  const top = await children(root);
  const sections: Section[] = [{ id: root, name: "", items: toItems(top) }];
  for (const f of top.filter((x) => x.mimeType === FOLDER).slice(0, 30)) sections.push({ id: f.id, name: f.name, items: toItems(await children(f.id)) });
  return { name: meta.name, sections: sections.filter((s) => s.items.length) };
}

// Is this file inside the album folder (in it, or one sub-folder down)? Families can never reach any other Drive file.
export async function fileInAlbum(root: string, id: string): Promise<Row | null> {
  try {
    const f = await call(`/files/${id}`, { fields: "id, name, mimeType, size, parents, thumbnailLink, trashed" });
    if (f.trashed || !kindOf(String(f.mimeType || ""))) return null;
    const parents: string[] = f.parents || [];
    if (parents.includes(root)) return f;
    for (const p of parents) {
      const pf = await call(`/files/${p}`, { fields: "parents, mimeType" });
      if (pf.mimeType === FOLDER && (pf.parents || []).includes(root)) return f;
    }
  } catch { /* not found or not shared */ }
  return null;
}

// A small copy: Drive's own thumbnail at the size asked (photos and videos both have one).
export async function fetchThumb(f: Row, size: number): Promise<Response | null> {
  if (!f.thumbnailLink) return null;
  const res = await fetch(String(f.thumbnailLink).replace(/=s\d+$/, `=s${size}`), { headers: { Authorization: `Bearer ${await token()}` } });
  return res.ok ? res : null;
}

// Part of the original file (bytes start..end). Netlify functions cannot send very big answers in one go,
// so videos and downloads always come in pieces of a few MB (the video player and the download button ask piece by piece).
export async function fetchBytes(f: Row, start: number, end: number): Promise<Response> {
  return fetch(`${API}/files/${f.id}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${await token()}`, Range: `bytes=${start}-${end}` } });
}
