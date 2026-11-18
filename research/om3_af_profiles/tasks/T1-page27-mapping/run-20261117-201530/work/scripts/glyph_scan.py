# Extract Latin-leaning UTF-16 strings that contain the page-27 glyphs,
# plus the English block around "AF Button".
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
block_path = ROOT / "om-emu" / "unpacked" / "E147" / "OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin"
blob = block_path.read_bytes()
out = []

def strings_in(blob, start, end):
    i = start
    while i + 1 < end:
        if blob[i] == 0 and blob[i + 1] == 0:
            i += 2
            continue
        j = i
        while j + 1 < end and not (blob[j] == 0 and blob[j + 1] == 0):
            j += 2
            if j - i > 800:
                break
        raw = blob[i:j]
        try:
            text = raw.decode("utf-16le")
        except UnicodeDecodeError:
            text = raw.decode("utf-16le", "replace")
        yield i, text
        i = j + 2

def latin_ratio(text):
    body = text
    # drop icon escapes @Axxx@
    while "@" in body:
        a = body.find("@")
        b = body.find("@", a + 1)
        if b < 0 or b - a > 8:
            break
        body = body[:a] + body[b + 1:]
    letters = [c for c in body if c.isalpha()]
    if not letters:
        return 0
    latin = sum(1 for c in letters if "A" <= c <= "Z" or "a" <= c <= "z")
    return latin / len(letters)

glyphs = ("@A066@", "@A02F@", "@A0BF@", "@A052@", "@A065@", "@A02C@")
out.append(f"block_sha256={hashlib.sha256(blob).hexdigest()} bytes={len(blob)}")
for g in glyphs:
    rows = []
    for off, text in strings_in(blob, 0, len(blob)):
        if g in text and latin_ratio(text) >= 0.8 and len(text) >= len(g):
            rows.append((off, text.replace("\r", "\\r").replace("\n", "\\n")))
    out.append(f"\n== {g} latin-leaning strings: {len(rows)} ==")
    for off, text in rows:
        out.append(f"  blk+0x{off:x} {text}")

# Window around the known English "AF Button" and "AF Target Point".
for label, center, radius in (("AF Button", 0x247856, 0x3000), ("AF Target Point", 0x230052, 0x1500)):
    out.append(f"\n== window {label} blk+0x{center:x} +/-0x{radius:x} ==")
    a = max(0, center - radius)
    b = min(len(blob), center + radius)
    for off, text in strings_in(blob, a, b):
        if latin_ratio(text) < 0.6 and "@" not in text:
            continue
        if len(text) < 2:
            continue
        shown = text.replace("\r", "\\r").replace("\n", "\\n")
        out.append(f"  blk+0x{off:x} {shown}")

# Phrases that would be the owner's option sentences, any language ratio.
out.append("\n== phrase search ==")
for phrase in (
    "Always tracks", "tracks focus", "selected AF", "Target Point",
    "when it is detected", "Subject Detection", "disregard", "Priority",
    "AF-ON", "half-press", "half press", "custom",
):
    pat = phrase.encode("utf-16le")
    n = 0
    start = 0
    samples = []
    while n < 6:
        i = blob.find(pat, start)
        if i < 0:
            break
        # expand to string
        a = i
        while a >= 2 and blob[a - 2:a] != b"\x00\x00" and i - a < 200:
            a -= 2
        c = i + len(pat)
        while c + 1 < len(blob) and blob[c:c + 2] != b"\x00\x00" and c - i < 300:
            c += 2
        text = blob[a:c].decode("utf-16le", "replace").replace("\r", "\\r").replace("\n", "\\n")
        if latin_ratio(text) >= 0.7:
            samples.append(f"  blk+0x{a:x} {text}")
            n += 1
        start = i + 2
    out.append(f"[{phrase}] latin_samples={len(samples)}")
    out.extend(samples)

path = ROOT / "work" / "out" / "glyph-scan.txt"
path.write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"wrote {path} lines={len(out)}")
