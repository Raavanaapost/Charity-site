// The worker behind Today's materials (SURESH 27 Nov 2026). Runs in the background (up to 15 minutes) and empties
// the queue, one item at a time:
//   1. "fetch":  a file sent to the Raavanaa WhatsApp number is downloaded from Meta (Meta keeps it only a few days)
//                into our own private store, and photos get the quick checks (blurry, dark, near-duplicate).
//   2. "queued": Gemini looks at each photo (how good it is, whether a child's face shows, whether it is a receipt and
//                what it says) and writes out each voice note in its own language and in English.
// What it finds is for the team only and waits in the portal. Nothing is published from here.
// Anyone may wake it: it only works through the queue. Needs WHATSAPP_TOKEN (downloads) and GEMINI_API_KEY (checks).
import type { Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { materialsStore, newKey, quickCheck } from "../lib/materials.mts";

type Row = Record<string, any>;
const GRAPH = () => `https://graph.facebook.com/${Netlify.env.get("WHATSAPP_GRAPH_VERSION") || "v23.0"}`;
const MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-flash-lite-latest"];
const MAX_AI = 14 * 1024 * 1024;

const PHOTO_PROMPT = `You help RAAVANAA, a small volunteer charity in Sri Lanka that gives children a day of joy (a school trip,
a meal, a festival). An organiser sent this photo from the day. Look at it and reply ONLY with JSON in the schema.
- "quality": 1 to 10, how good this photo is for the project page: sharp, well lit, shows the joy or the place,
  not a blurry, shaken, accidental or dark shot. 10 = one of the best of the day.
- "child_face": true if any child's face can be recognised (front or side, not tiny, not from behind).
- "receipt": true only if this is a photo of a bill, receipt or invoice.
- If it is a receipt: "shop", "date" (as written), "amount" (the total paid, digits only), "currency", "what" (what was paid for).
  Never guess a figure; leave it empty if you cannot read it.
- "caption": one short warm line describing the moment, for the team (never a name).`;
const PHOTO_SCHEMA = { type: "OBJECT", properties: {
  quality: { type: "INTEGER" }, child_face: { type: "BOOLEAN" }, receipt: { type: "BOOLEAN" },
  shop: { type: "STRING" }, date: { type: "STRING" }, amount: { type: "STRING" }, currency: { type: "STRING" }, what: { type: "STRING" }, caption: { type: "STRING" },
}, required: ["quality", "child_face", "receipt", "caption"] };

const AUDIO_PROMPT = `You help RAAVANAA, a small volunteer charity in Sri Lanka that gives children a day of joy. An organiser,
teacher or parent sent this voice note from the day. It may be in Tamil, Sinhala or English. Reply ONLY with JSON:
"language", "original" (word for word in its own language and script), "english" (a faithful English translation),
"quote" (the one or two warmest sentences, in English, that could go on the project's Impact page).
Replace any child's name with "a child" in "english" and "quote".`;
const AUDIO_SCHEMA = { type: "OBJECT", properties: { language: { type: "STRING" }, original: { type: "STRING" }, english: { type: "STRING" }, quote: { type: "STRING" } }, required: ["language", "english"] };

class Stop extends Error {}

async function gemini(key: string, prompt: string, schema: unknown, mime: string, buf: Uint8Array) {
  const parts = [{ text: prompt }, { inline_data: { mime_type: mime, data: Buffer.from(buf).toString("base64") } }];
  let last = "";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.2 } }),
      });
      if (res.ok) {
        const out = await res.json();
        return JSON.parse(out?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "{}");
      }
      const body = await res.text();
      if (/API_KEY_INVALID|API key not valid/i.test(body)) throw new Stop("Google says the GEMINI_API_KEY in Netlify is not valid.");
      if (/limit: 0|free_tier/i.test(body)) throw new Stop("Google's free tier does not allow this. Turn on billing for the key in AI Studio.");
      const busy = res.status === 503 || res.status === 429 || res.status === 500;
      last = busy ? "Gemini is busy right now." : `${model}: ${res.status}`;
      if (busy) { await new Promise((r) => setTimeout(r, 6000 * (attempt + 1))); continue; }
      break;
    }
  }
  throw new Error(last || "Gemini did not answer");
}

async function fetchFromMeta(context: Context, db: ReturnType<typeof getDatabase>, m: Row) {
  const token = Netlify.env.get("WHATSAPP_TOKEN");
  if (!token) throw new Stop("WHATSAPP_TOKEN is not set in Netlify yet.");
  const info = await fetch(`${GRAPH()}/${m.wa_media_id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!info.ok) throw new Error(`Meta did not give the file (${info.status}). It may be older than 7 days.`);
  const j = await info.json();
  const file = await fetch(j.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!file.ok) throw new Error(`Download failed (${file.status})`);
  const buf = new Uint8Array(await file.arrayBuffer());
  const mime = String(j.mime_type || m.mime || "application/octet-stream").split(";")[0];
  const key = newKey(m.slug, mime);
  await materialsStore(context).set(key, buf.buffer as ArrayBuffer, { metadata: { type: mime } });
  const next = m.kind === "photo" || m.kind === "audio" ? "queued" : "done";
  await db.sql`UPDATE event_materials SET blob = ${key}, mime = ${mime}, size = ${buf.length}, ai_status = ${next}, ai_error = '' WHERE id = ${m.id}`;
  if (m.kind === "photo") await quickCheck(db, m.id, buf, mime);
}

async function check(context: Context, db: ReturnType<typeof getDatabase>, m: Row) {
  const key = Netlify.env.get("GEMINI_API_KEY");
  if (!key) throw new Stop("GEMINI_API_KEY is not set in Netlify yet.");
  const got = (await materialsStore(context).get(m.blob, { type: "arrayBuffer" })) as ArrayBuffer | null;
  const buf = new Uint8Array(got || new ArrayBuffer(0));
  if (!buf.length) throw new Error("The file is missing from the store.");
  if (buf.length > MAX_AI) { await db.sql`UPDATE event_materials SET ai_status = 'done', ai_error = 'Too large for the AI check' WHERE id = ${m.id}`; return; }
  const out = m.kind === "audio" ? await gemini(key, AUDIO_PROMPT, AUDIO_SCHEMA, m.mime || "audio/ogg", buf)
    : await gemini(key, PHOTO_PROMPT, PHOTO_SCHEMA, m.mime || "image/jpeg", buf);
  const ai = { ...(m.ai || {}), ...out };
  await db.sql`UPDATE event_materials SET ai = ${JSON.stringify(ai)}::jsonb, ai_status = 'done', ai_error = '' WHERE id = ${m.id}`;
}

export default async (_req: Request, context: Context) => {
  const db = getDatabase();
  const until = Date.now() + 13 * 60e3;
  let stopFetch = "", stopCheck = "";
  while (Date.now() < until) {
    const want = [stopFetch ? "" : "fetch", stopCheck ? "" : "queued"].filter(Boolean);
    if (!want.length) break;
    const [m] = (await db.sql`UPDATE event_materials SET ai_status = ai_status || '-running' WHERE id = (
      SELECT id FROM event_materials WHERE ai_status = ANY(${want}::text[]) ORDER BY (ai_status = 'fetch') DESC, id LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`) as Row[];
    if (!m) break;
    const job = String(m.ai_status).replace(/-running$/, "");
    try {
      if (job === "fetch") await fetchFromMeta(context, db, m);
      else await check(context, db, m);
    } catch (e) {
      const msg = String((e as Error).message || e).slice(0, 400);
      console.log(`materials: #${m.id} ${job} failed: ${msg}`);
      if (e instanceof Stop) {
        // Put it back in the queue and stop this kind of work until the setting is fixed.
        await db.sql`UPDATE event_materials SET ai_status = ${job}, ai_error = ${msg} WHERE id = ${m.id}`;
        if (job === "fetch") stopFetch = msg; else stopCheck = msg;
      } else await db.sql`UPDATE event_materials SET ai_status = 'failed', ai_error = ${msg} WHERE id = ${m.id}`;
    }
  }
};
