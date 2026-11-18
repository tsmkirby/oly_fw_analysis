# role: observe. Check the UI-id store listings against the image.
import re
from pathlib import Path

image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
files = [
    "work/out/disasm-611f7abb-h1.txt",
    "work/out/disasm-611f7aff-h1.txt",
    "work/out/disasm-611f7f40-h1.txt",
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
                first_bad = raw.split("\t")[0]
    lines.append("%s ok %d bad %d skipped %d first %s" % (name, ok, bad, skipped, first_bad))
text = "\n".join(lines) + "\n"
Path("work/out/listing-check-h3.txt").write_text(text, encoding="utf-8")
print(text)
