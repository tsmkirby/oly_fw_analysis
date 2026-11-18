# role: observe. Bytes after the key-8 editor table, and the directory entry the lookup uses.
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"
DIR = 0x615CC934
PTR = struct.unpack_from("<I", BIN, DIR + 4 - BASE)[0]
COUNT = struct.unpack_from("<H", BIN, DIR + 8 - BASE)[0]
END = PTR + COUNT * 24
lines = []
say = lines.append
say("directory 0x%08x key %d ptr 0x%08x count %d end 0x%08x" % (
    DIR, struct.unpack_from("<I", BIN, DIR - BASE)[0], PTR, COUNT, END))
say("entry raw %s" % BIN[DIR - BASE:DIR - BASE + 12].hex())
say("first record %s" % BIN[PTR - BASE:PTR - BASE + 24].hex())
say("record at 0x1e3 offset %d" % ((0x615C5E14 - PTR) // 24))
say("last record %s" % BIN[END - 24 - BASE:END - BASE].hex())
say("next 64 bytes %s" % BIN[END - BASE:END - BASE + 64].hex())
# FF runs in the section-1 tail past the T3e table.
tail = 0x6031EA48
blob = BIN[tail - BASE:0x6031F000 - BASE]
ff = 0
for b in blob:
    if b == 0xFF:
        ff += 1
    else:
        break
say("ff run at 0x%08x length %d" % (tail, ff))
# A larger FF run anywhere in 0x60200000..0x603ba800 of at least 10000 bytes.
need = 10000
best = (0, 0)
run_at = None
run = 0
lo = 0x602E0000
hi = 0x603BA800
chunk = BIN[lo - BASE:hi - BASE]
for i, b in enumerate(chunk):
    if b == 0xFF:
        if run == 0:
            run_at = lo + i
        run += 1
        if run > best[1]:
            best = (run_at, run)
    else:
        run = 0
say("longest ff in 0x602e0000..0x603ba800 at 0x%08x length %d" % best)
text = "\n".join(lines) + "\n"
(OUT / "binding-tail-f1.txt").write_text(text, encoding="utf-8")
print(text)
