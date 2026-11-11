"""Make img/logo-light.webp: the Raavanaa logo for dark backgrounds (dark mode header).

The logo's "Raavanaa" letters are a very dark green, which disappears on a dark page. This keeps the
whole logo as it is and only turns the letters to a warm cream; the gold outline, the king, the heart
and the hand are untouched. Run from the repository root:  python3 tools/logo/make_light_logo.py
"""
from PIL import Image
import numpy as np

src = Image.open("img/logo-1200.webp").convert("RGBA")
a = np.asarray(src).astype(np.float32)
H, W = a.shape[:2]
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = 0.299 * r + 0.587 * g + 0.114 * b
# how strongly a pixel is the dark green letter fill (not the king's brown lines, not the brighter heart)
w = np.clip((50 - lum) / 18, 0, 1) * np.clip((g - r + 6) / 10, 0, 1) * np.clip((g - b + 6) / 10, 0, 1)
X = np.arange(W)[None, :] * (1200 / W)
Y = np.arange(H)[:, None] * (1200 / W)
w = w * ((X > 300) & (X < 972) & (Y > 40) & (Y < 326))
# the heart's dark inner edge runs right beside the last "a": keep it out (above the a, and right of its stem)
w = w * ~(((X >= 884) & (Y < 157)) | ((X >= 929) & (Y < 231)))
m = w > 0.25

def grow(x):
    y = x.copy()
    y[1:, :] |= x[:-1, :]; y[:-1, :] |= x[1:, :]; y[:, 1:] |= x[:, :-1]; y[:, :-1] |= x[:, 1:]
    y[1:, 1:] |= x[:-1, :-1]; y[:-1, :-1] |= x[1:, 1:]; y[1:, :-1] |= x[:-1, 1:]; y[:-1, 1:] |= x[1:, :-1]
    return y

# only what is joined to the letters themselves
reach = m & (X < 880)
for _ in range(600):
    n = grow(reach) & m
    if (n == reach).all():
        break
    reach = n
w = w * grow(grow(reach))
cream = np.array([255, 244, 214], np.float32)
out = a.copy()
for c in range(3):
    out[..., c] = a[..., c] * (1 - w) + cream[c] * w
res = Image.fromarray(out.astype(np.uint8), "RGBA")
res.resize((900, round(900 * H / W)), Image.LANCZOS).save("img/logo-light.webp", quality=90, method=6)
print("img/logo-light.webp written")
