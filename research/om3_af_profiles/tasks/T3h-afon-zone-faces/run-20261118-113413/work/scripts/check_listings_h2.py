# role: observe. Check the second batch of listings against the image.
import re
from pathlib import Path

image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
files = [
    "work/out/disasm-611f7f01-h1.txt",
    "work/out/disasm-611f81aa-h1.txt",
    "work/out/disasm-611f820c-h1.txt",
    "work/out/disasm-611f83aa-h1.txt",
    "work/out/disasm-611f8437-h1.txt",
]
lines = []
for name in files:
    ok = bad = skipped = 0
    nbytes = 0
    first_bad = None
    for raw in Path(name).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^([0-9a-fA-F]+)\t([0-9a-fA-F]+)\t", raw)
        if not m:
            skipped += 1
            continue
        addr = int(m.group(1), 16)
        want = bytes.fromhex(m.group(2))
        got = image[addr - BASE:addr - BASE + len(want)]
        nbytes += len(want)
        if got == want:
            ok += 1
        else:
            bad += 1
            if first_bad is None:
                first_bad = "%s image %s" % (raw.split("\t")[0], got.hex())
    lines.append("%s ok %d bad %d skipped %d bytes %d first %s" % (name, ok, bad, skipped, nbytes, first_bad))
text = "\n".join(lines) + "\n"
Path("work/out/listing-check-h2.txt").write_text(text, encoding="utf-8")
print(text)
