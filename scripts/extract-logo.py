"""One-off: turn the supplied Zyvilo banner into transparent PNG logo assets."""
import sys
from PIL import Image

src = sys.argv[1]
out_dir = sys.argv[2]
im = Image.open(src).convert("RGB")
W, H = im.size
NAVY = (8, 11, 44)
PURPLE = (115, 0, 255)

def knockout(box):
    c = im.crop(box)
    px = c.load()
    out = Image.new("RGBA", c.size)
    op = out.load()
    for y in range(c.size[1]):
        for x in range(c.size[0]):
            r, g, b = px[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            a = max(0.0, min(1.0, (238 - lum) / 150))
            if a <= 0.02:
                op[x, y] = (0, 0, 0, 0)
                continue
            col = PURPLE if (b - r) > 90 and (b - g) > 110 else NAVY
            op[x, y] = (*col, int(a * 255))
    bbox = out.getbbox()
    return out.crop(bbox)

sx, sy = W / 1774, H / 887
s = lambda b: tuple(int(v * (sx if i % 2 == 0 else sy)) for i, v in enumerate(b))
word = knockout(s((440, 300, 1330, 585)))
word.save(f"{out_dir}/zyvilo-wordmark.png")
full = knockout(s((270, 300, 1500, 650)))
full.save(f"{out_dir}/zyvilo-logo.png")
print(im.size, word.size, full.size)
