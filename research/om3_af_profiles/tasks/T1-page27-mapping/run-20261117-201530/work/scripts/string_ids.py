# Map string IDs around the AF Button cluster and collect @A049@ / glyph contexts.
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
blob = (ROOT / "om-emu" / "unpacked" / "E147" / "OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin").read_bytes()
KNOWN = 0x24783E  # string 0x1279, "@A02C@@A065@AF Button"

def prev_start(end):
    # end is the offset of a string; the preceding NUL is at end-2
    nul = end - 2
    if blob[nul:nul + 2] != b"\x00\x00":
        return None
    a = nul
    while a >= 2 and blob[a - 2:a] != b"\x00\x00" and nul - a < 800:
        a -= 2
    if blob[a:a + 2] == b"\x00\x00":
        a += 2
    return a

def forward(start, count, first_id):
    out = []
    i = start
    sid = first_id
    for _ in range(count):
        j = i
        while j + 1 < len(blob) and blob[j:j + 2] != b"\x00\x00":
            j += 2
            if j - i > 800:
                break
        text = blob[i:j].decode("utf-16le", "replace").replace("\r", "\\r").replace("\n", "\\n")
        out.append((sid, i, text))
        sid += 1
        i = j + 2
    return out

# Walk back 80 strings from the known ID, then forward through them plus 16.
ids = {}
off = KNOWN
sid = 0x1279
ids[sid] = off
for _ in range(90):
    p = prev_start(off)
    if p is None:
        break
    sid -= 1
    off = p
    ids[sid] = off
start_id = min(ids)
rows = forward(ids[start_id], 0x1290 - start_id + 1, start_id)
lines = [f"walk starts at id 0x{start_id:04x} off 0x{ids[start_id]:x}", ""]
for sid, off, text in rows:
    if 0x1240 <= sid <= 0x1290:
        lines.append(f"0x{sid:04x} blk+0x{off:x} {text}")

def latin_strings(needle, limit=40):
    pat = needle.encode("utf-16le")
    found = []
    start = 0
    while len(found) < limit:
        i = blob.find(pat, start)
        if i < 0:
            break
        a = i
        while a >= 2 and blob[a - 2:a] != b"\x00\x00" and i - a < 240:
            a -= 2
        if blob[a:a + 2] == b"\x00\x00":
            a += 2
        b = i + len(pat)
        while b + 1 < len(blob) and blob[b:b + 2] != b"\x00\x00" and b - i < 360:
            b += 2
        text = blob[a:b].decode("utf-16le", "replace")
        letters = [c for c in text if c.isalpha()]
        latin = sum(1 for c in letters if ("A" <= c <= "Z") or ("a" <= c <= "z"))
        if letters and latin / len(letters) >= 0.85:
            found.append((a, text.replace("\r", "\\r").replace("\n", "\\n")))
        start = i + 2
    return found

lines.append("\n== @A049@ ==")
for off, text in latin_strings("@A049@", 50):
    lines.append(f"blk+0x{off:x} {text}")
lines.append("\n== @A066@ sample (first 25 latin) ==")
for off, text in latin_strings("@A066@", 25):
    lines.append(f"blk+0x{off:x} {text}")
lines.append("\n== @A02F@ sample (first 25 latin) ==")
for off, text in latin_strings("@A02F@", 25):
    lines.append(f"blk+0x{off:x} {text}")

path = ROOT / "work" / "out" / "string-ids.txt"
path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"wrote {path} lines={len(lines)} back_to=0x{start_id:04x}")
