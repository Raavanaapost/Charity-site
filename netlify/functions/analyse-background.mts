// Team only: the AI check of a request (SURESH, 9 Nov 2026). Runs in the background (up to 15 minutes), because reading
// voice notes, videos and documents takes longer than a normal page request.
//   POST /.netlify/functions/analyse-background   { ref: "S-1001" }
// Sends the request's words and its files (documents, photos, video, voice notes) to Gemini, which writes a draft
// profile, transcribes and translates voice notes, and lists what is missing. The result is saved on the request
// (ai_draft) for the team to check in the portal. Nothing is shown to the public until the team approves it.
// Needs GEMINI_API_KEY in Netlify (Project configuration → Environment variables).
import type { Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";
import { getStore } from "@netlify/blobs";

const MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
const MAX_INLINE = 14 * 1024 * 1024; // Gemini takes about 20 MB per request, and files grow by a third when sent

async function isTeam() {
  const user = await getUser();
  if (!user || !user.email) return null;
  const email = user.email.toLowerCase();
  const admins = (Netlify.env.get("PORTAL_ADMINS") || "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  return roles.includes("admin") || roles.includes("team") || admins.includes(email) ? email : null;
}

const PROMPT = `You help RAAVANAA, a small volunteer charity in Sri Lanka that gives children a day of joy (a school trip, a meal,
games, a festival, help with learning). Anyone can ask for a "moment" through a short form, in English or Tamil, by
writing, by voice note, or by attaching photos and documents. Before a request can be shared for people to vouch for
it, the team checks it. Your job is to prepare that check.

Read everything below: the form, then every attached file. Voice notes and videos may be in Tamil, English or
Sinhala: transcribe them and translate to English. Then reply ONLY with JSON in the given schema.

Rules:
- Use only what is in the form and the files. Never guess or invent a figure, name, date or place. If something is
  not there, leave it empty and list it under "missing".
- "summary" is for a public page: 2 to 4 warm, plain sentences. Never name a child. Never name a school or home unless
  the requester clearly is that school or home. The town or village is fine.
- "missing" lists what the team still needs before the page can be approved. Always check: who the children are and
  how many; exact village or place; what the day is; when; a rough budget; who the requester is and how they know the
  children; someone in a role (principal, teacher, Grama Niladhari, temple, organisation) who can vouch.
- "concerns" lists anything that looks wrong, inconsistent, unsafe for children, or not like a children's day out
  (for example a request for cash to a person). Empty if none.
- For each file, say in one line what it shows or says ("what"), and its kind.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "A short page title, under 70 characters" },
    summary: { type: "STRING" },
    activity: { type: "STRING", description: "What the day is" },
    place: { type: "STRING", description: "Village or town, district" },
    children: { type: "STRING", description: "How many children and their ages, as stated" },
    when: { type: "STRING", description: "Date or time of year wanted, as stated" },
    budget_items: { type: "ARRAY", items: { type: "OBJECT", properties: { item: { type: "STRING" }, amount: { type: "STRING" } }, required: ["item", "amount"] } },
    budget_total: { type: "STRING" },
    requester: { type: "STRING", description: "Who is asking and how they know the children" },
    people: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, role: { type: "STRING" } }, required: ["name", "role"] } },
    files: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, kind: { type: "STRING", enum: ["document", "image", "video", "audio"] }, what: { type: "STRING" } }, required: ["name", "kind", "what"] } },
    transcripts: { type: "ARRAY", items: { type: "OBJECT", properties: { file: { type: "STRING" }, language: { type: "STRING" }, original: { type: "STRING" }, english: { type: "STRING" } }, required: ["file", "language", "english"] } },
    missing: { type: "ARRAY", items: { type: "OBJECT", properties: { field: { type: "STRING" }, why: { type: "STRING" } }, required: ["field", "why"] } },
    concerns: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "summary", "missing", "concerns", "files"],
};

const toB64 = (buf: Uint8Array) => {
  let s = ""; const CH = 0x8000;
  for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode(...buf.subarray(i, i + CH));
  return btoa(s);
};

async function callGemini(key: string, parts: unknown[]) {
  let last = "";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.2 } }),
      });
      if (res.ok) {
        const out = await res.json();
        const text = out?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
        return { model, draft: JSON.parse(text) };
      }
      last = `${model}: ${res.status} ${(await res.text()).slice(0, 300)}`;
      if (res.status === 503 || res.status === 429 || res.status === 500) { await new Promise((r) => setTimeout(r, 4000)); continue; }
      break; // 404 (model not available) or 400: try the next model
    }
  }
  throw new Error(last || "Gemini did not answer");
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return;
  const by = await isTeam();
  if (!by) return;
  let ref = "";
  try { ref = String((await req.json()).ref || "").slice(0, 20); } catch { return; }
  const db = getDatabase();
  const [s] = await db.sql<Record<string, any>>`SELECT * FROM suggestions WHERE ref = ${ref}`;
  if (!s) return;
  const fail = async (msg: string) => {
    await db.sql`UPDATE suggestions SET ai_status = 'failed', ai_error = ${msg.slice(0, 500)}, ai_at = NOW() WHERE id = ${s.id}`;
  };
  const key = Netlify.env.get("GEMINI_API_KEY");
  if (!key) return fail("GEMINI_API_KEY is not set in Netlify yet.");
  await db.sql`UPDATE suggestions SET ai_status = 'running', ai_error = '' WHERE id = ${s.id}`;

  try {
    const form = {
      moment: (s.focus || [])[0] || "", title_given: s.title, description: s.description, city_or_district: s.city, village: s.village,
      how_many: s.children, requester_name: s.contact, more: s.additional, received: s.received_at,
    };
    const parts: unknown[] = [{ text: PROMPT + "\n\nTHE FORM:\n" + JSON.stringify(form, null, 2) }];
    const files = await db.sql<{ file_key: string; name: string; type: string; parts: number; size: number }>`
      SELECT file_key, name, type, parts, size FROM suggestion_files WHERE suggestion_id = ${s.id} AND complete ORDER BY id`;
    const store = getStore({ name: context.deploy?.context === "production" ? "evidence" : "evidence-preview", consistency: "strong" });
    let used = 0; const skipped: string[] = [];
    for (const f of files as { file_key: string; name: string; type: string; parts: number; size: number }[]) {
      if (used + f.size > MAX_INLINE) { skipped.push(f.name); continue; }
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < f.parts; i++) {
        const c = await store.get(`${f.file_key}/${i}`, { type: "arrayBuffer" });
        if (c) chunks.push(new Uint8Array(c as ArrayBuffer));
      }
      const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
      let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
      used += all.length;
      parts.push({ text: `FILE: ${f.name} (${f.type})` });
      parts.push({ inline_data: { mime_type: f.type, data: toB64(all) } });
    }
    if (skipped.length) parts.push({ text: `These files were too big to send and still need a person to check them: ${skipped.join(", ")}` });

    const { model, draft } = await callGemini(key, parts);
    draft._model = model;
    if (skipped.length) draft._skipped = skipped;
    await db.sql`UPDATE suggestions SET ai_draft = ${JSON.stringify(draft)}::jsonb, ai_status = 'done', ai_error = '', ai_at = NOW() WHERE id = ${s.id}`;
    await db.sql`INSERT INTO audit_log (actor, action, target, details) VALUES (${by}, 'suggestion.ai_check', ${ref}, ${JSON.stringify({ model })}::jsonb)`;
  } catch (e) {
    await fail(String((e as Error)?.message || e));
  }
};
