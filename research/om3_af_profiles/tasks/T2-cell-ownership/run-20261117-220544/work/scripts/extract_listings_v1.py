# Slice bounded listings out of the exported disassembly and check them against the raw image.
import hashlib
import pathlib

ROOT = pathlib.Path(".")
MAIN = (ROOT / "inputs/00_0100_50000020.decoded.bin").read_bytes()
assert hashlib.sha256(MAIN).hexdigest() == "5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59"
BASE = 0x60021020
ASM = ROOT / "ref/analysis/decompiled-main/all-functions.asm"

WANT = {
    0x600610D2, 0x6006148F, 0x600619A9, 0x60062A60, 0x60062D28, 0x60062D93,
    0x60062FE5, 0x60063380, 0x600633A2, 0x600633FF, 0x60063431, 0x600634EE,
    0x60063684, 0x60063A20, 0x60063DC0, 0x60419315, 0x6041931E, 0x60419408,
    0x60419446, 0x60419696,
}
WINDOWS = [
    0x601886F7, 0x603CD465, 0x603CD472, 0x6042E20C, 0x604800C0, 0x60C930EA,
    0x60C93115, 0x610F2144, 0x610F2159, 0x61217EC4, 0x617046B7, 0x61709E27,
    0x61709E67, 0x6173B56F, 0x60063EB2,
]

out = []
def w(s=""):
    out.append(s)

def hex_at(va, n):
    o = va - BASE
    return MAIN[o:o + n].hex()

w("listings for key 0x5b82")
w("image sha256 5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59")
w("image bytes %d base 0x%08x" % (len(MAIN), BASE))
w("")
w("registration record 0x600e5874 bytes %s" % hex_at(0x600E5874, 36))
w("map id 2017 at 0x606274e0 bytes %s" % hex_at(0x606274E0, 4))
w("map id 2031 at 0x60627518 bytes %s" % hex_at(0x60627518, 4))
w("map id 2034 at 0x60627524 bytes %s" % hex_at(0x60627524, 4))
w("debug-table slot 0x602ec448 words %s" % hex_at(0x602EC448, 8))
comp = 0x602EC2E8
raw = MAIN[comp - BASE:comp - BASE + 48]
w("companion 0x602ec2e8 ascii %s" % "".join(chr(b) if 32 <= b < 127 else "." for b in raw))
w("")

# stream the asm once
want_txt = set("%08x" % a for a in WANT)
win_txt = set("%08x" % a for a in WINDOWS)
capturing = False
cap = []
checked = 0
mismatches = []
window_buf = []
windows_out = {a: [] for a in win_txt}

def check_line(line):
    global checked
    parts = line.split("\t")
    if len(parts) < 3:
        return
    try:
        va = int(parts[0], 16)
    except ValueError:
        return
    raw = parts[1].strip()
    if not raw or any(c not in "0123456789abcdef" for c in raw):
        return
    got = hex_at(va, len(raw) // 2)
    checked += 1
    if got != raw:
        mismatches.append((parts[0], raw, got))

with ASM.open("r", encoding="utf-8", errors="replace") as f:
    for line in f:
        line = line.rstrip("\n")
        if line.startswith("; Function "):
            if capturing:
                w("\n".join(cap))
                w("")
                capturing = False
                cap = []
            bits = line.split()
            addr = bits[2] if len(bits) > 2 else ""
            if addr.lower() in want_txt or addr in want_txt:
                capturing = True
                cap = [line]
            continue
        if capturing:
            cap.append(line)
            check_line(line)
        # rolling window for the UI-id sites
        head = line.split("\t", 1)[0]
        window_buf.append(line)
        if len(window_buf) > 40:
            window_buf.pop(0)
        if head.lower() in windows_out or head in windows_out:
            key = head.lower() if head.lower() in windows_out else head
            windows_out[key] = list(window_buf)
if capturing:
    w("\n".join(cap))

w("==== windows around UI-id immediates and the bank-7 boot arm ====")
for addr in WINDOWS:
    key = "%08x" % addr
    lines = windows_out.get(key) or windows_out.get(key.upper()) or []
    w("")
    w("--- window %s (%d lines) ---" % (key, len(lines)))
    w("\n".join(lines) if lines else "NOT FOUND")

w("")
w("byte-check of listed instructions: %d checked, %d mismatches" % (checked, len(mismatches)))
for m in mismatches[:20]:
    w("MISMATCH %s asm %s image %s" % m)

dest = ROOT / "work/out/listings-5b82.txt"
dest.write_text("\n".join(out) + "\n", encoding="utf-8")
print("wrote", dest, "lines", len(out), "checked", checked, "mismatches", len(mismatches))
