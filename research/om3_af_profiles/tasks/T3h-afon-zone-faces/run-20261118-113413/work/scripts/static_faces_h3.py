# role: observe. Binding words that select face-table key 0x2d, and the factory table key 0x3b.
import struct
from pathlib import Path

BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()


def u16(addr):
    return struct.unpack_from("<H", image, addr - BASE)[0]


def u32(addr):
    return struct.unpack_from("<I", image, addr - BASE)[0]


lines = ["directory 0x615cc934 stride 0xc"]
for i in range(0x0E):
    a = 0x615CC934 + i * 0x0C
    key, ptr, count = u32(a), u32(a + 4), u16(a + 8)
    lines.append(f"[{i:02d}] {a:#x} key {key:#x} ptr {ptr:#x} count {count}")
    hits = []
    if 0x60000000 <= ptr < 0x62000000 and count < 2000:
        for n in range(count):
            rec = ptr + n * 0x18
            try:
                editor, mark, ui, mark2, facekey = u32(rec), u32(rec + 4), u32(rec + 8), u32(rec + 0x0C), u32(rec + 0x10)
            except Exception:
                break
            if facekey == 0x2D:
                hits.append(f"ed {editor:#x} ui {ui:#x} +4 {mark:#x} +c {mark2:#x}")
    lines.append(f"  face-key 0x2d records {len(hits)}")
    for h in hits[:12]:
        lines.append("  " + h)

lines.append("factory 0x6150244c stride 8 count 0x41")
for i in range(0x41):
    a = 0x6150244C + i * 8
    key, fn = u32(a), u32(a + 4)
    if key == 0x3B:
        lines.append(f"  [{i}] key {key:#x} fn {fn:#x}")
text = "\n".join(lines) + "\n"
Path("work/out/static-faces-h3.txt").write_text(text, encoding="utf-8")
print(text)
