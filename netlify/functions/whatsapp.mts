// The Raavanaa WhatsApp number (Meta WhatsApp Cloud API), SURESH 27 Nov 2026.
//   GET  /api/whatsapp   Meta checks the address once when the team connects it (hub.verify_token must match)
//   POST /api/whatsapp   Meta sends every message people send to the Raavanaa number
// What an organiser sends (photos, videos, voice notes, bills, documents, a line of text) is filed under their project
// by their phone number (portal: People in charge). If they are in charge of more than one open project, the number asks
// "Which project?" with buttons; their tap holds for the rest of that Sri Lanka day. Files are fetched from Meta by the
// background worker (Meta keeps them only a few days). Nothing is shown publicly until the team ticks it in the portal.
// Replies stay inside the free 24-hour "service" window: Raavanaa only answers people who wrote first.
// Needs in Netlify (Project configuration > Environment variables):
//   WHATSAPP_TOKEN          the permanent access key (system user token) from Meta Business
//   WHATSAPP_VERIFY_TOKEN   any long word the team chooses; typed in Meta too when connecting the webhook
//   WHATSAPP_APP_SECRET     the app's secret (Meta app > Settings > Basic), to check each message really comes from Meta
import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { createHmac, timingSafeEqual } from "node:crypto";
import { phoneKey, projectsForPhone, projectTitles, kindOf, wakeWorker } from "../lib/materials.mts";

type Row = Record<string, any>;
const GRAPH = () => `https://graph.facebook.com/${Netlify.env.get("WHATSAPP_GRAPH_VERSION") || "v23.0"}`;
const slDay = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const clip = (v: unknown, max: number) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max);

const TEXT = {
  thanks: (title: string) => `Thank you! Received for "${title}". Keep sending during the day.\n\nAfter the event, please choose your best 10 photos and send only those here. Keep the rest on your phone for the school's private album.\n\nPlease no children's names. Write "bill" with a receipt photo so we add it to the money page.`,
  which: "Which project are you sending for today? Tap one below. We will keep it for today.",
  unknown: "Hello, this is Raavanaa. Thank you for your message. We could not find this number on a project yet, so a Raavanaa volunteer will look at it and be in touch.",
  chosen: (title: string) => `Thank you. Everything you send today goes to "${title}". To change it, write "project".`,
};

async function send(phoneId: string, to: string, body: Record<string, unknown>) {
  const token = Netlify.env.get("WHATSAPP_TOKEN");
  if (!token || !phoneId) return;
  const r = await fetch(`${GRAPH()}/${phoneId}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...body }),
  });
  if (!r.ok) console.log(`whatsapp: reply to ${to.slice(0, 4)}… failed ${r.status} ${(await r.text()).slice(0, 300)}`);
}
const sendText = (phoneId: string, to: string, text: string) => send(phoneId, to, { type: "text", text: { preview_url: false, body: text } });

// Up to 3 projects as buttons, more as a list (WhatsApp allows 10 rows).
async function askWhich(phoneId: string, to: string, slugs: string[], titles: Map<string, string>) {
  const t = (s: string, n: number) => { const x = titles.get(s) || s; return x.length > n ? x.slice(0, n - 1) + "…" : x; };
  const action = slugs.length <= 3
    ? { buttons: slugs.map((s) => ({ type: "reply", reply: { id: `p:${s}`.slice(0, 256), title: t(s, 20) } })) }
    : { button: "Choose project", sections: [{ title: "Projects", rows: slugs.slice(0, 10).map((s) => ({ id: `p:${s}`.slice(0, 200), title: t(s, 24), description: (titles.get(s) || "").slice(0, 72) })) }] };
  await send(phoneId, to, { type: "interactive", interactive: { type: slugs.length <= 3 ? "button" : "list", body: { text: TEXT.which }, action } });
}

function signatureOk(raw: string, header: string | null) {
  const secret = Netlify.env.get("WHATSAPP_APP_SECRET");
  if (!secret) return false; // not connected yet: nothing is taken in until the secret is set
  if (!header || !header.startsWith("sha256=")) return false;
  const want = createHmac("sha256", secret).update(raw, "utf8").digest();
  const got = Buffer.from(header.slice(7), "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const want = Netlify.env.get("WHATSAPP_VERIFY_TOKEN");
    if (want && url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === want) return new Response(url.searchParams.get("hub.challenge") || "", { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Not allowed", { status: 405 });
  const raw = await req.text();
  if (!signatureOk(raw, req.headers.get("x-hub-signature-256"))) { console.log(Netlify.env.get("WHATSAPP_APP_SECRET") ? "whatsapp: signature did not match, ignored" : "whatsapp: WHATSAPP_APP_SECRET is not set in Netlify yet, message ignored"); return new Response("Forbidden", { status: 403 }); }
  let body: Row;
  try { body = JSON.parse(raw); } catch { return new Response("ok"); }
  const db = getDatabase();
  let titles: Map<string, string> | null = null;
  const T = async () => (titles ||= await projectTitles(db));
  let queued = false;

  for (const entry of body.entry || []) for (const ch of entry.changes || []) {
    const v = ch.value || {};
    const phoneId = String(v.metadata?.phone_number_id || Netlify.env.get("WHATSAPP_PHONE_ID") || "");
    const names = new Map<string, string>((v.contacts || []).map((c: Row) => [String(c.wa_id), clip(c.profile?.name, 80)]));
    for (const m of v.messages || []) {
      const id = String(m.id || "");
      if (!id) continue;
      const fresh = (await db.sql`INSERT INTO wa_seen (id) VALUES (${id}) ON CONFLICT DO NOTHING RETURNING id`) as Row[];
      if (!fresh.length) continue; // Meta sent it again
      const phone = phoneKey(m.from);
      const name = names.get(String(m.from)) || "";
      const [s0] = (await db.sql`INSERT INTO wa_senders (phone) VALUES (${phone}) ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone RETURNING *`) as Row[];
      const slugs = await projectsForPhone(db, phone);

      // A tap on "Which project?"
      const tap = m.type === "interactive" ? String(m.interactive?.button_reply?.id || m.interactive?.list_reply?.id || "") : "";
      if (tap.startsWith("p:")) {
        const slug = tap.slice(2);
        if (slugs.includes(slug)) {
          await db.sql`UPDATE wa_senders SET slug = ${slug}, chosen_on = ${slDay()}::date WHERE phone = ${phone}`;
          await db.sql`UPDATE event_materials SET slug = ${slug}, status = 'new' WHERE sender = ${phone} AND status = 'waiting'`;
          await sendText(phoneId, String(m.from), TEXT.chosen((await T()).get(slug) || slug));
        }
        continue;
      }
      const text = m.type === "text" ? clip(m.text?.body, 2000) : "";
      // "project" asks again which project.
      if (text && /^\s*(project|change|திட்டம்)\s*$/i.test(text) && slugs.length > 1) {
        await db.sql`UPDATE wa_senders SET chosen_on = NULL, asked_at = NOW() WHERE phone = ${phone}`;
        await askWhich(phoneId, String(m.from), slugs, await T());
        continue;
      }

      // Which project this message is for.
      let slug = "", status = "new";
      if (slugs.length === 1) slug = slugs[0];
      else if (slugs.length > 1) {
        const today = s0.chosen_on ? new Date(s0.chosen_on).toISOString().slice(0, 10) === slDay() : false;
        if (today && slugs.includes(s0.slug)) slug = s0.slug;
        else {
          status = "waiting";
          const askedRecently = s0.asked_at && Date.now() - new Date(s0.asked_at).getTime() < 30 * 60e3;
          if (!askedRecently) { await db.sql`UPDATE wa_senders SET asked_at = NOW() WHERE phone = ${phone}`; await askWhich(phoneId, String(m.from), slugs, await T()); }
        }
      } else status = "unknown";

      const media = m.image || m.video || m.audio || m.document || m.sticker || null;
      const mime = String(media?.mime_type || (m.type === "text" ? "text/plain" : "")).split(";")[0];
      const caption = clip(media?.caption || text, 2000);
      const kind = m.type === "text" ? "text" : m.type === "sticker" ? "" : media ? kindOf(mime) : "";
      if (kind) {
        const hint = /\b(bill|receipt|பில்|பற்றுச்சீட்டு)\b/i.test(caption) ? "bill" : "";
        await db.sql`INSERT INTO event_materials (slug, source, sender, sender_name, kind, mime, size, name, wa_media_id, caption, status, ai_status, ai)
          VALUES (${slug}, 'whatsapp', ${phone}, ${name}, ${kind}, ${mime}, ${Number(media?.file_size) || 0}, ${clip(media?.filename, 200)}, ${String(media?.id || "")},
            ${caption}, ${status}, ${media ? "fetch" : ""}, ${JSON.stringify(hint ? { hint } : {})}::jsonb)`;
        if (media) queued = true;
      }

      // A short thank-you, at most once every 30 minutes (free: they wrote first).
      if (status === "unknown") {
        if (!s0.unknown_at || Date.now() - new Date(s0.unknown_at).getTime() > 20 * 3600e3) {
          await db.sql`UPDATE wa_senders SET unknown_at = NOW() WHERE phone = ${phone}`;
          await sendText(phoneId, String(m.from), TEXT.unknown);
        }
      } else if (slug && (!s0.acked_at || Date.now() - new Date(s0.acked_at).getTime() > 30 * 60e3)) {
        await db.sql`UPDATE wa_senders SET acked_at = NOW() WHERE phone = ${phone}`;
        await sendText(phoneId, String(m.from), TEXT.thanks((await T()).get(slug) || slug));
      }
    }
  }
  if (queued) await wakeWorker(req); // the worker answers at once (background function) and works on its own
  return new Response("ok");
};

export const config: Config = { path: "/api/whatsapp" };
