#!/usr/bin/env python3
"""Picture robot for RaavanaaPost.

Reads each story (title, place, stage, text), asks Gemini to plan pictures in the RaavanaaPost
house style, makes them with Gemini's image model, and has Gemini check each one: no recognisable
children's faces and no text. A picture that fails the check is made again (up to 3 tries).

Pictures land in source/content/photos/ai/<STORY KEY>/ with a manifest.json. load-news.php uses
them in place of the story's real photos the next time the site is built.

Needs GEMINI_API_KEY in the environment (Google AI Studio key).

  python3 tools/pictures/make_pictures.py --story KT          # one story
  python3 tools/pictures/make_pictures.py --story KT --story B
  python3 tools/pictures/make_pictures.py --all               # every story without pictures yet
  python3 tools/pictures/make_pictures.py --story KT --force  # make them again
  python3 tools/pictures/make_pictures.py --story KT --dry-run  # plan only, prints prompts, no images
"""
import argparse, base64, datetime, io, json, os, subprocess, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "source", "content", "photos", "ai")
API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
# Google renames its models often, so by default the robot asks which ones this key can use.
TEXT_MODEL = os.environ.get("GEMINI_TEXT_MODEL", "")
TEXT_SPARES = []
IMAGE_MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "")


def pick_models(key):
    """Choose a fast text model and an image model from the models this key can use."""
    global TEXT_MODEL, IMAGE_MODEL, TEXT_SPARES
    names, token = [], ""
    while True:
        url = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200" + ("&pageToken=" + token if token else "")
        req = urllib.request.Request(url, headers={"x-goog-api-key": key})
        with urllib.request.urlopen(req, timeout=60) as r:
            d = json.load(r)
        names += [m["name"].split("/", 1)[1] for m in d.get("models", [])
                  if "generateContent" in m.get("supportedGenerationMethods", [])]
        token = d.get("nextPageToken", "")
        if not token: break

    def ver(n):
        import re
        m = re.search(r"(\d+(?:\.\d+)?)", n)
        return float(m.group(1)) if m else 0.0

    def best(cands):
        # newest version first; a finished model beats a preview of the same version
        return sorted(cands, key=lambda n: (ver(n), "preview" not in n and "exp" not in n), reverse=True)[0] if cands else ""

    if not TEXT_MODEL:
        if "gemini-flash-latest" in names: TEXT_MODEL = "gemini-flash-latest"
        else: TEXT_MODEL = best([n for n in names if n.startswith("gemini") and "flash" in n
                                 and not any(w in n for w in ("image", "lite", "tts", "audio", "live", "embedding"))])
    # other text models to switch to when the first one is overloaded (newest first)
    plain = [n for n in names if n.startswith("gemini") and not any(
        w in n for w in ("image", "tts", "audio", "live", "embedding", "robotics", "computer"))]
    TEXT_SPARES = sorted([n for n in plain if n != TEXT_MODEL],
                         key=lambda n: (ver(n), "flash" in n, "preview" not in n and "exp" not in n), reverse=True)[:5]
    if not IMAGE_MODEL:
        img = [n for n in names if "image" in n and n.startswith("gemini")]
        IMAGE_MODEL = best([n for n in img if "flash" in n]) or best(img)
    print(f"models: text={TEXT_MODEL or '?'} image={IMAGE_MODEL or '?'}", flush=True)
    print("spare text models: " + ", ".join(TEXT_SPARES), flush=True)
    if not TEXT_MODEL or not IMAGE_MODEL:
        sys.exit("Could not find a usable model. Models this key can use: " + ", ".join(sorted(names)))

HOUSE = """You make pictures for RaavanaaPost (raavanaapost.raavanaa.org), the news site of RAAVANAA,
a small volunteer charity in Sri Lanka. Raavanaa - Beyond the Lanes: "Creating moments, creating smiles".
Raavanaa gives children a day of joy: a school trip, a beach day, a meal, games, a temple or park visit.
Most children come from tea-estate communities in the central hills (Pussellawa, Kandy District) and
from war-affected villages in the North (Mullaitivu, Kilinochchi, Jaffna). Friends and families in the
Tamil diaspora pay for each day. Projects move through Initiated (need checked), Activated (funded and
prepared) and Impact (the day happened). The site's look is warm and royal: forest green, honey gold
and marigold on cream.

Rules for every picture:
1. Photo-realistic, like a documentary photograph taken in Sri Lanka: natural light, true colours, real places.
2. Warm, hopeful and dignified. Never pity; never poverty as a spectacle.
3. No recognisable faces of children, ever: show them from behind, far away, as small figures, or as
   hands, feet, shoes, school bags or shadows. Adults also only from behind or far away.
4. No text, letters, numbers, logos, signs or watermarks anywhere in the picture.
5. Landscape 16:9, main subject a little to one side.
6. Sri Lankan details right: misty tea estates in the hills; palmyra palms and red earth in the North;
   white school uniforms; Hindu kovils with colourful gopurams; Buddhist temples in white and gold.
7. For a story whose day has not happened yet (Initiated or Activated), picture the place and the hope,
   not the day itself as if it already happened."""

PLAN = """Plan {n} pictures for this RaavanaaPost story: 1 cover picture, then {m} for inside the story.
Each needs: "file" (cover, 1, 2, ...), "prompt" (one rich paragraph for an image model, following every
rule), and "caption" (short, plain English, under 12 words, describing what is shown, no claims that it
is a real photo). Return JSON: {{"pictures": [{{"file": "...", "prompt": "...", "caption": "..."}}]}}

Story:
{story}"""

CHECK = """You are checking a picture for a children's charity news site. Answer in JSON only:
{"recognisable_child_face": true/false, "any_text_or_logo": true/false, "looks_photo_realistic": true/false,
 "fits_sri_lanka": true/false, "note": "one short sentence"}
A face counts as recognisable if a parent could tell who the child is."""


def call(model, body, key, tries=7, busy_ok=False):
    req = urllib.request.Request(API.format(model=model), data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    for t in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=420) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:400]
            if e.code in (429, 500, 503) and t < tries - 1 and "limit: 0" not in msg:
                print(f"  ({model} is busy ({e.code}); waiting and trying again)", flush=True)
                time.sleep(min(10 * 2 ** t, 120)); continue
            if busy_ok and e.code in (429, 500, 503, 404): raise Busy()
            sys.exit(f"Gemini {model} said {e.code}: {msg}")
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            print(f"  ({model} did not answer: {e}; trying again)", flush=True)
            if t < tries - 1: time.sleep(min(10 * 2 ** t, 120)); continue
            sys.exit(f"Could not reach Gemini: {e}")


class Busy(Exception):
    pass


def call_text(body, key):
    """Ask the text model; if it stays overloaded, move on to the next one."""
    global TEXT_MODEL
    for m in [TEXT_MODEL] + [x for x in TEXT_SPARES if x != TEXT_MODEL]:
        try:
            r = call(m, body, key, tries=3, busy_ok=True)
            if m != TEXT_MODEL:
                print(f"  (using {m} from now on)", flush=True); TEXT_MODEL = m
            return r
        except Busy:
            print(f"  ({m} stays busy; trying another model)", flush=True)
    sys.exit("Every Gemini text model is busy right now. Please run the robot again later.")


def text_of(resp):
    return "".join(p.get("text", "") for c in resp.get("candidates", []) for p in c.get("content", {}).get("parts", []))


def plan(story, n_inside, key):
    s = "\n".join(f"{k}: {story[k]}" for k in ("title", "place", "stage", "excerpt", "tagline", "reach", "body") if story.get(k))
    body = {"systemInstruction": {"parts": [{"text": HOUSE}]},
            "contents": [{"role": "user", "parts": [{"text": PLAN.format(n=n_inside + 1, m=n_inside, story=s)}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.8}}
    return json.loads(text_of(call_text(body, key)))["pictures"]


def make_image(prompt, key):
    body = {"contents": [{"role": "user", "parts": [{"text": HOUSE + "\n\nPicture to make:\n" + prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9"}}}
    resp = call(IMAGE_MODEL, body, key)
    for c in resp.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            d = p.get("inlineData") or p.get("inline_data")
            if d and d.get("data"):
                return base64.b64decode(d["data"]), d.get("mimeType") or d.get("mime_type") or "image/png"
    return None, None


def check(img, mime, key):
    body = {"contents": [{"role": "user", "parts": [{"inlineData": {"mimeType": mime, "data": base64.b64encode(img).decode()}}, {"text": CHECK}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0}}
    try:
        r = json.loads(text_of(call_text(body, key)))
    except Exception:
        return False, {"note": "check did not answer"}
    ok = not r.get("recognisable_child_face", True) and not r.get("any_text_or_logo", True)
    return ok, r


def save_jpeg(img, path):
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(img)).convert("RGB")
        if im.width > 1800: im = im.resize((1800, round(im.height * 1800 / im.width)))
        im.save(path, "JPEG", quality=84, optimize=True)
    except ImportError:
        open(path, "wb").write(img)


def stories():
    return json.loads(subprocess.check_output(["php", os.path.join(ROOT, "tools", "pictures", "export_stories.php")]))


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("--story", action="append", default=[], help="story key, e.g. KT (repeatable)")
    a.add_argument("--all", action="store_true", help="every story that has no AI pictures yet")
    a.add_argument("--inside", type=int, default=2, help="pictures inside the story besides the cover (default 2)")
    a.add_argument("--force", action="store_true", help="make them again even if they exist")
    a.add_argument("--dry-run", action="store_true", help="plan and print prompts only")
    o = a.parse_args()
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key: sys.exit("GEMINI_API_KEY is not set.")
    pick_models(key)
    todo = [s for s in stories() if (o.all or s["key"] in o.story)]
    if not todo: sys.exit("No matching stories. Keys: " + ", ".join(s["key"] for s in stories()))
    for s in todo:
        folder = os.path.join(OUT, s["key"])
        if os.path.exists(os.path.join(folder, "manifest.json")) and not o.force:
            print(f"{s['key']}: already has pictures (use --force)"); continue
        print(f"{s['key']}: planning pictures for '{s['title']}'")
        pics = plan(s, o.inside, key)
        if o.dry_run:
            print(json.dumps(pics, indent=2, ensure_ascii=False)); continue
        os.makedirs(folder, exist_ok=True)
        done = []
        for p in pics:
            for attempt in range(1, 4):
                img, mime = make_image(p["prompt"], key)
                if not img: print(f"  {p['file']}: no picture came back (try {attempt})"); continue
                ok, r = check(img, mime, key)
                print(f"  {p['file']}: try {attempt}, check {'passed' if ok else 'failed'} ({r.get('note', '')})")
                if ok:
                    save_jpeg(img, os.path.join(folder, f"{p['file']}.jpg"))
                    done.append({**p, "file": f"{p['file']}.jpg", "check": r, "tries": attempt})
                    break
            else:
                print(f"  {p['file']}: gave up after 3 tries")
        if done:
            json.dump({"story": s["key"], "title": s["title"], "made": datetime.date.today().isoformat(),
                       "models": [TEXT_MODEL, IMAGE_MODEL], "pictures": done},
                      open(os.path.join(folder, "manifest.json"), "w"), indent=2, ensure_ascii=False)
            print(f"{s['key']}: saved {len(done)} picture(s) in {os.path.relpath(folder, ROOT)}")


if __name__ == "__main__":
    main()
