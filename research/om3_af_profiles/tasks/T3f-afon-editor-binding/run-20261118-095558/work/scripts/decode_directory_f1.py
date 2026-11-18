# role: observe. Decode the editor-directory at 0x615cc934 and the bytes FUN_6124f4e5 searches.
import struct
from pathlib import Path

ROOT = Path(".").resolve()
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out"


def u16(addr):
    return struct.unpack_from("<H", BIN, addr - BASE)[0]


def u32(addr):
    return struct.unpack_from("<I", BIN, addr - BASE)[0]


lines = []
say = lines.append
say("== directory candidates, stride 12, around 0x615cc934 ==")
for addr in range(0x615CC900, 0x615CCA40, 12):
    key, ptr, count = u32(addr), u32(addr + 4), u16(addr + 8)
    tail = u16(addr + 10)
    note = ""
    if 0x61000000 <= ptr < 0x62000000:
        note = " first %s" % BIN[ptr - BASE:ptr - BASE + 8].hex()
    say("  0x%08x key 0x%x ptr 0x%08x count %d tail %d%s" % (addr, key, ptr, count, tail, note))

say("== which directory word is 8, and does its pointer reach 0x615c59f4 ==")
for addr in range(0x615CC800, 0x615CCB00, 4):
    if u32(addr) == 8 and 0x61000000 <= u32(addr + 4) < 0x62000000:
        ptr, count = u32(addr + 4), u16(addr + 8)
        say("  key8 at 0x%08x ptr 0x%08x count %d end 0x%08x" % (addr, ptr, count, ptr + count * 24))

text = "\n".join(lines) + "\n"
(OUT / "binding-directory-f1.txt").write_text(text, encoding="utf-8")
print(text)
