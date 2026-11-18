# role: observe. Check disassembly listings against the main image.
import re
from pathlib import Path

image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
files = [
    "work/out/disasm-01e8-f1.txt",
    "work/out/disasm-01ee-f1.txt",
    "work/out/disasm-e750-f1.txt",
    "work/out/disasm-3bd0-f1.txt",
    "work/out/disasm-3b1c-f1.txt",
    "work/out/disasm-3d90-f1.txt",
    "work/out/disasm-3e70-f1.txt",
    "work/out/disasm-f4e5-f1.txt",
    "work/out/disasm-f11a-f1.txt",
]
lines = []
for name in files:
    ok = bad = skipped = 0
    first_bad = None
    for raw in Path(name).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^([0-9a-fA-F]+)\t([0-9a-fA-F]+)\t", raw)
        if not m:
            skipped += 1
            continue
        addr = int(m.group(1), 16)
        want = bytes.fromhex(m.group(2))
        got = image[addr - BASE:addr - BASE + len(want)]
        if got == want:
            ok += 1
        else:
            bad += 1
            if first_bad is None:
                first_bad = "%s image %s" % (raw.split("\t")[0], got.hex())
    lines.append("%s ok %d bad %d skipped %d first %s" % (name, ok, bad, skipped, first_bad))
Path("work/out/listing-check-f1.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
