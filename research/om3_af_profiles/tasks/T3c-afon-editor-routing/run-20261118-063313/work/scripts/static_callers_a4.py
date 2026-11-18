# Callers and u32 references of FUN_610cdebf.
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
            found.append((BASE + i, "call32"))
        start = i + 1
    start = 0
    while True:
        i = BIN.find(b"\xcd", start)
        if i < 0 or i + 5 > n:
            break
        rel = struct.unpack_from("<h", BIN, i + 1)[0]
        tgt = (i + rel) & 0xFFFFFFFF
        if tgt in want:
            found.append((BASE + i, "call16"))
        start = i + 1
    return found


target = 0x610CDEBF
say(f"== calls to 0x{target:08x} ==")
for site, kind in call_sites([target]):
    say(f"  {kind} 0x{site:08x}")
needle = struct.pack("<I", target)
say("== u32 refs ==")
start = 0
while True:
    i = BIN.find(needle, start)
    if i < 0:
        break
    say(f"  0x{BASE + i:08x}")
    start = i + 1
text = "\n".join(lines) + "\n"
(ROOT / "work/out/static-callers-a4.txt").write_text(text, encoding="utf-8")
print(text, end="")
