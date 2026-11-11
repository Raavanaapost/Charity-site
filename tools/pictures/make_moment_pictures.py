"""Gemini pictures for "A moment in their name" (/moment): one painted picture for each reason.
SURESH asked for these on 10 Nov 2026 to replace the hand-drawn img/moment/<reason>.svg.
Each picture is made with Gemini's image model and then checked by Gemini: no faces, no text.
Up to 3 tries each. Writes img/moment/<reason>.jpg (portrait 3:4) and img/moment/pictures.json.
Run by .github/workflows/moment-pictures.yml (needs the GEMINI_API_KEY secret).
Usage: python3 tools/pictures/make_moment_pictures.py [reason ...]   (no reasons = all)"""
import base64, io, json, os, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "img", "moment")
API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
TEXT_MODEL = os.environ.get("GEMINI_TEXT_MODEL", "")
IMAGE_MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "")

STYLE = ("A warm, dignified illustration in a soft hand-painted gouache style for a Sri Lankan Tamil charity. "
         "The subject sits in the centre, isolated on a plain warm cream background (#fbf6ea) that fades softly to cream at every edge, "
         "with a gentle golden glow behind it and plenty of empty cream space around it. Gold, marigold orange and leaf green accents. "
         "Absolutely no people, no faces, no figures, no animals, no text, no letters, no numbers, no logos, no watermark, no frame or border. "
         "Portrait format.")
PICTURES = {
    "memory": "A lit brass kuthuvilakku (tall South Indian oil lamp) with a small steady flame, marigold flowers and mango leaves at its base.",
    "remembrance": "Three small lit clay agal oil lamps resting on a round green lotus leaf, strings of white jasmine flowers around them, calm and quiet.",
    "birthday": "A small two-tier birthday cake in soft pink and cream with three lit candles, three balloons (pink, gold, green) floating beside it.",
    "wedding": "Two interlinked gold wedding rings resting on red silk, under a garland of fresh mango leaves and marigolds (a Tamil thoranam), a few jasmine buds.",
    "newborn": "An empty traditional wooden baby cradle (thottil) hanging from a beam, a soft cotton cloth inside, a crescent moon and small stars above, soft blue night glow.",
    "success": "A dark blue graduation cap with a gold tassel resting on a rolled certificate tied with a red ribbon, a few gold stars sparkling around.",
    "recovery": "A young green plant with two fresh leaves growing from rich soil towards a gentle morning sun, dew drops on the leaves, hopeful light.",
    "gratitude": "Two open cupped hands (only the hands, no arms or bodies) gently holding a glowing red heart, marigold petals falling softly.",
    "festival": "A traditional clay Pongal pot boiling over with white milk rice, two sugarcane stalks on either side, turmeric leaves tied around the pot, a colourful kolam drawn in front, morning sun.",
    "honour": "A golden laurel wreath around a shining gold star, a red ribbon at the bottom of the wreath.",
    "behalf": "A big round woven palmyra basket overflowing with gifts brought together by many people: bananas, mangoes, a coconut, marigold garlands and jasmine, tied with several colourful ribbons.",
    "custom": "A single pink lotus flower in full bloom floating on still water with two green lotus leaves.",
}
CHECK = """Look at this picture and answer only with JSON:
{"any_face": true/false, "any_person_or_figure": true/false, "any_text_or_logo": true/false, "note": "one short sentence"}
Hands alone are not a person or figure."""


def pick_models(key):
    global TEXT_MODEL, IMAGE_MODEL
    names, token = [], ""
    while True:
        url = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200" + ("&pageToken=" + token if token else "")
        with urllib.request.urlopen(urllib.request.Request(url, headers={"x-goog-api-key": key}), timeout=60) as r:
            d = json.load(r)
        names += [m["name"].split("/", 1)[1] for m in d.get("models", []) if "generateContent" in m.get("supportedGenerationMethods", [])]
        token = d.get("nextPageToken", "")
        if not token: break
    import re
    def ver(n):
        m = re.search(r"(\d+(?:\.\d+)?)", n)
        return float(m.group(1)) if m else 0.0
    best = lambda c: sorted(c, key=lambda n: (ver(n), "preview" not in n and "exp" not in n), reverse=True)[0] if c else ""
    if not TEXT_MODEL:
        TEXT_MODEL = "gemini-flash-latest" if "gemini-flash-latest" in names else best(
            [n for n in names if n.startswith("gemini") and "flash" in n and not any(w in n for w in ("image", "lite", "tts", "audio", "live", "embedding"))])
    if not IMAGE_MODEL:
        img = [n for n in names if "image" in n and n.startswith("gemini")]
        IMAGE_MODEL = best([n for n in img if "flash" in n]) or best(img)
    print(f"models: text={TEXT_MODEL} image={IMAGE_MODEL}", flush=True)
    if not TEXT_MODEL or not IMAGE_MODEL:
        sys.exit("No usable model. Models this key can use: " + ", ".join(sorted(names)))


def call(model, body, key, tries=6):
    req = urllib.request.Request(API.format(model=model), data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    for t in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:500]
            if "limit: 0" in msg:
                sys.exit("Google says this key has no image allowance (free tier, limit 0). Billing must be on for the key's project in AI Studio. " + msg)
            if e.code in (429, 500, 503) and t < tries - 1:
                print(f"  ({model} busy, {e.code}; waiting)", flush=True); time.sleep(min(10 * 2 ** t, 120)); continue
            sys.exit(f"Gemini {model} said {e.code}: {msg}")
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            if t < tries - 1: time.sleep(min(10 * 2 ** t, 120)); continue
            sys.exit(f"Could not reach Gemini: {e}")


def text_of(resp):
    return "".join(p.get("text", "") for c in resp.get("candidates", []) for p in c.get("content", {}).get("parts", []))


def make(prompt, key):
    body = {"contents": [{"role": "user", "parts": [{"text": STYLE + "\n\nThe picture: " + prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "3:4"}}}
    for c in call(IMAGE_MODEL, body, key).get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            d = p.get("inlineData") or p.get("inline_data")
            if d and d.get("data"):
                return base64.b64decode(d["data"]), d.get("mimeType") or d.get("mime_type") or "image/png"
    return None, None


def check(img, mime, key):
    body = {"contents": [{"role": "user", "parts": [{"inlineData": {"mimeType": mime, "data": base64.b64encode(img).decode()}}, {"text": CHECK}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0}}
    try:
        r = json.loads(text_of(call(TEXT_MODEL, body, key)))
    except Exception:
        return False, {"note": "check did not answer"}
    return not (r.get("any_face", True) or r.get("any_person_or_figure", True) or r.get("any_text_or_logo", True)), r


def main():
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key: sys.exit("GEMINI_API_KEY is not set.")
    from PIL import Image
    pick_models(key)
    os.makedirs(OUT, exist_ok=True)
    want = sys.argv[1:] or list(PICTURES)
    log_path = os.path.join(OUT, "pictures.json")
    log = json.load(open(log_path)) if os.path.exists(log_path) else {}
    for k in want:
        print(f"{k}:", flush=True)
        for attempt in range(1, 4):
            img, mime = make(PICTURES[k], key)
            if not img:
                print(f"  try {attempt}: no picture came back", flush=True); continue
            ok, r = check(img, mime, key)
            print(f"  try {attempt}: {'ok' if ok else 'rejected'} ({r.get('note', '')})", flush=True)
            if ok:
                im = Image.open(io.BytesIO(img)).convert("RGB")
                if im.width > 900: im = im.resize((900, round(im.height * 900 / im.width)))
                im.save(os.path.join(OUT, k + ".jpg"), "JPEG", quality=84, optimize=True)
                log[k] = {"prompt": PICTURES[k], "model": IMAGE_MODEL, "tries": attempt, "check": r, "made": time.strftime("%Y-%m-%d")}
                break
        else:
            print(f"  {k}: no picture passed the check", flush=True)
    json.dump(log, open(log_path, "w"), indent=1)


if __name__ == "__main__":
    main()
