"""Make the web app's icons (img/app/) from the heart of the Raavanaa logo.

The app icon is the heart with the three people and the open hand, cut out of img/logo-1200.webp and set
on the site's cream. In the logo the last letter of "Raavanaa" sits over the heart's green left side, so
that letter and the gold line under the name are taken away and the small bite the letter left in the
green is filled in again. Run from the repository root:  python3 tools/logo/make_app_icons.py
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

src = Image.open("img/logo-1200.webp").convert("RGBA")
X0, Y0, X1, Y1 = 860, 0, 1200, 397            # the right end of the logo: the heart, the people, the hand, the leaf
a = np.asarray(src.crop((X0, Y0, X1, Y1))).astype(np.float32)
H, W = a.shape[:2]
solid = a[..., 3] > 60

def label(mask):
    """Number the separate shapes in a mask (4-neighbour flood fill)."""
    lab = np.zeros(mask.shape, np.int32); n = 0
    for sy, sx in zip(*np.nonzero(mask)):
        if lab[sy, sx]:
            continue
        n += 1; stack = [(sy, sx)]; lab[sy, sx] = n
        while stack:
            y, x = stack.pop()
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; stack.append((yy, xx))
    return lab, n

lab, n = label(solid)
drop = set()
for (px, py) in ((915 - X0, 200), (875 - X0, 238), (940 - X0, 244), (880 - X0, 288), (1000 - X0, 307)):   # the letter a (three spots) and the gold line (two spots)
    if lab[py, px]:
        drop.add(int(lab[py, px]))
gone = np.isin(lab, list(drop))
# soft edges of the removed shapes go too
grow = gone.copy()
for _ in range(3):
    g = grow.copy()
    g[1:, :] |= grow[:-1, :]; g[:-1, :] |= grow[1:, :]; g[:, 1:] |= grow[:, :-1]; g[:, :-1] |= grow[:, 1:]
    grow = g
out = a.copy()
out[grow & ~(solid & ~gone), 3] = 0
out[gone, 3] = 0

# Small leftovers of the name at the far left edge go as well.
lab2, n2 = label(out[..., 3] > 60)
for k in range(1, n2 + 1):
    ys, xs = np.nonzero(lab2 == k)
    if xs.max() < 26:
        out[lab2 == k, 3] = 0
out[:, :3][out[:, :3, 3] < 250] = 0

# The green's outer edge just above the bite is at (893, 150) and leans right by about a third: carry on from there.
# Fill the bite the letter left in the heart's green side: the outer edge runs on smoothly down to the tip.
def bez(p0, c, p1, k=60):
    t = np.linspace(0, 1, k)[:, None]
    return (1 - t) ** 2 * np.array(p0, float) + 2 * (1 - t) * t * np.array(c, float) + t ** 2 * np.array(p1, float)
edge = bez((893 - X0, 149), (908 - X0, 196), (981 - X0, 224))
poly = [tuple(p) for p in edge] + [(981 - X0, 224), (942 - X0, 192), (926 - X0, 149)]
Q = 6                                             # drawn six times larger, then shrunk, so the new edge is smooth
m = Image.new("L", (W * Q, H * Q), 0); ImageDraw.Draw(m).polygon([(x * Q, y * Q) for x, y in poly], fill=255)
cover = np.asarray(m.resize((W, H), Image.LANCZOS)).astype(np.float32)
bite = (cover > 2) & (out[..., 3] < 250)
filled = out[..., 3] >= 250
todo = bite.copy()
col = out[..., :3].copy()
for _ in range(120):                              # carry the green in from its edge, a pixel ring at a time
    if not todo.any():
        break
    acc = np.zeros((H, W, 3), np.float32); cnt = np.zeros((H, W), np.float32)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
        sh = np.roll(np.roll(filled, dy, 0), dx, 1); c2 = np.roll(np.roll(col, dy, 0), dx, 1)
        acc += c2 * sh[..., None]; cnt += sh
    ring = todo & (cnt > 0)
    if not ring.any():
        break
    col[ring] = acc[ring] / cnt[ring][:, None]
    filled |= ring; todo &= ~ring
# even out the carried colour, then lay it under what is already there
smooth = np.asarray(Image.fromarray(col.clip(0, 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(2.2))).astype(np.float32)
old_a = out[..., 3] / 255.0
new_a = np.maximum(old_a, np.where(bite, cover / 255.0, 0))
mix = np.where(new_a > 0, old_a / np.maximum(new_a, 1e-6), 1)[..., None]
out[..., :3] = np.where(bite[..., None], out[..., :3] * mix + smooth * (1 - mix), out[..., :3])
out[..., 3] = new_a * 255
emblem = Image.fromarray(out.clip(0, 255).astype(np.uint8), "RGBA")
emblem = emblem.crop(emblem.getbbox())
emblem.save("tools/logo/app-emblem.png")       # the heart alone, see-through around it (kept beside this tool, not on the site)

CREAM = (251, 246, 234)
def icon(size, share, name, round_corners=False):
    S = size * 4
    bg = Image.new("RGBA", (S, S), CREAM + (255,))
    w = int(S * share); h = round(w * emblem.height / emblem.width)
    e = emblem.resize((w, h), Image.LANCZOS)
    bg.alpha_composite(e, ((S - w) // 2, (S - h) // 2 + int(S * .01)))
    bg = bg.resize((size, size), Image.LANCZOS).convert("RGB")
    bg.save(f"img/app/{name}", optimize=True)
    print(name, bg.size)

icon(192, .74, "icon-192.png")
icon(512, .74, "icon-512.png")
icon(512, .56, "maskable-512.png")      # Android cuts this one to a circle or a rounded square: keep the heart well inside
icon(180, .72, "apple-touch-icon.png")
icon(96, .76, "icon-96.png")
