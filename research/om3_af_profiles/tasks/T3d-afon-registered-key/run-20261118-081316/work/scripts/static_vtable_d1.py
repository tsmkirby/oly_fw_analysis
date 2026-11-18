# Dump the inner vtable and check the chain listing against image bytes.
# Writes work/out/static-vtable-d1.txt.
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out" / "static-vtable-d1.txt"
TSV = ROOT / "ref" / "analysis" / "decompiled-main" / "functions.tsv"

fns = []
for line in TSV.read_text(encoding="utf-8").splitlines()[1:]:
    if not line:
        continue
    parts = line.split("\t")
    fns.append((int(parts[0], 16), parts[1]))
starts = [a for a, _ in fns]


def owner(addr):
    lo, hi, best = 0, len(starts) - 1, None
    while lo <= hi:
        mid = (lo + hi) >> 1
        if starts[mid] <= addr:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return fns[best][1] if best is not None else ""


def u32(addr):
    o = addr - BASE
    return int.from_bytes(BIN[o:o + 4], "little")


lines = []
say = lines.append
say("== vtable 0x6151346c, 32 slots ==")
for i in range(32):
    p = u32(0x6151346C + i * 4)
    say(f"  +0x{i * 4:02x} 0x{p:08x} {owner(p)}")

say("== listing bytes against the image ==")
listing = (ROOT / "work" / "out" / "disasm-a2be-d1.txt").read_text(encoding="utf-8").splitlines()
listing += (ROOT / "work" / "out" / "disasm-308d-d1.txt").read_text(encoding="utf-8").splitlines()
bad = 0
checked = 0
for line in listing:
    parts = line.split("\t")
    if len(parts) < 3 or parts[1] == "??":
        continue
    addr = int(parts[0], 16)
    raw = bytes.fromhex(parts[1])
    got = BIN[addr - BASE:addr - BASE + len(raw)]
    checked += 1
    if got != raw:
        bad += 1
        say(f"  MISMATCH 0x{addr:08x} listing {parts[1]} image {got.hex()}")
say(f"checked={checked} mismatches={bad}")

# Section of the addresses the decision runs in.
sections = []
for i in range(10):
    o = (0x60029B28 - BASE) + i * 12
    dest = int.from_bytes(BIN[o:o + 4], "little")
    flag = int.from_bytes(BIN[o + 8:o + 12], "little")
    sections.append((i + 1, dest, flag))
def place(addr):
    hit = None
    for n, dest, flag in sections:
        if dest <= addr:
            hit = (n, dest, flag)
    return hit
for addr in (0x6119A2BE, 0x61203082, 0x6120308D, 0x6124F7D4, 0x60419446, 0x6062555C, 0x6158AE0C, 0x6151346C):
    n, dest, flag = place(addr)
    say(f"  0x{addr:08x} section {n} dest 0x{dest:08x} compressed={flag == 1}")

text = "\n".join(lines) + "\n"
OUT.write_text(text, encoding="utf-8")
print(text)
