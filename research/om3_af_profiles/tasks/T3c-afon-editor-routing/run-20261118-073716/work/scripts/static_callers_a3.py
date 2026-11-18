# Callers of the priority-editor opener 0x610cdf05, and the lookup it uses.
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
lines = []


def say(s=""):
    lines.append(s)


def call_sites(targets):
    want = {a - BASE for a in targets}
    found = []
    n = len(BIN)
    start = 0
    while True:
        i = BIN.find(b"\xdd", start)
        if i < 0 or i + 7 > n:
            break
        rel = struct.unpack_from("<i", BIN, i + 1)[0]
        tgt = (i + rel) & 0xFFFFFFFF
        if tgt in want:
            found.append((BASE + i, BASE + tgt, "call32"))
        start = i + 1
    start = 0
    while True:
        i = BIN.find(b"\xcd", start)
        if i < 0 or i + 5 > n:
            break
        rel = struct.unpack_from("<h", BIN, i + 1)[0]
        tgt = (i + rel) & 0xFFFFFFFF
        if tgt in want:
            found.append((BASE + i, BASE + tgt, "call16"))
        start = i + 1
    return found


tsv = (ROOT / "ref/analysis/decompiled-main/functions.tsv").read_text(encoding="utf-8").splitlines()[1:]
ranges = []
for line in tsv:
    if not line:
        continue
    a, name = line.split("\t", 2)[:2]
    ranges.append((int(a, 16), name))
ranges.sort()


def fn_of(addr):
    lo, hi, best = 0, len(ranges) - 1, None
    while lo <= hi:
        mid = (lo + hi) // 2
        if ranges[mid][0] <= addr:
            best = ranges[mid]
            lo = mid + 1
        else:
            hi = mid - 1
    return best


for target in (0x610CDF05, 0x610E2536, 0x61203816, 0x61203E81):
    say(f"== calls to 0x{target:08x} ==")
    for site, tgt, kind in call_sites([target]):
        fn = fn_of(site)
        say(f"  {kind} 0x{site:08x} in {fn[1] if fn else '?'} 0x{fn[0]:08x}" if fn else f"  {kind} 0x{site:08x}")

text = "\n".join(lines) + "\n"
(ROOT / "work/out/static-callers-a3.txt").write_text(text, encoding="utf-8")
print(text, end="")
