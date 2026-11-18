# Walk the key-dispatch tables the way FUN_6119a2be does, for 0x900C.
# Writes work/out/static-keytable-d1.txt.
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out" / "static-keytable-d1.txt"


def u32(addr):
    o = addr - BASE
    return struct.unpack_from("<I", BIN, o)[0]


def walk(table, end, mask, delta):
    slot = table + (delta & mask) * 8
    start = slot
    seen = 0
    while seen < 64:
        key = u32(slot)
        fn = u32(slot + 4)
        if key == delta:
            return slot, fn, seen
        if key == 0:
            return None, None, seen
        slot += 8
        if slot >= end:
            slot = table
        seen += 1
        if slot == start:
            break
    return None, None, seen


lines = []
say = lines.append
delta = 0x900C - 0x9003
say(f"key 0x900C delta={delta} (0x{delta:x})")
for name, table, end, mask in (
    ("table-a", 0x61502934, 0x615029B4, 0xF),
    ("table-b", 0x61502834, 0x61502934, 0x1F),
):
    slot, fn, probes = walk(table, end, mask, delta)
    say(f"{name} base=0x{table:08x} probes={probes} slot={None if slot is None else hex(slot)} fn={None if fn is None else hex(fn)}")
    # also show the hash slot even on a miss
    hashed = table + (delta & mask) * 8
    say(f"  hash slot 0x{hashed:08x} key={u32(hashed)} fn=0x{u32(hashed + 4):08x}")

# Show every entry whose key is 9, in both tables, and the neighbouring keys 0..16.
say("== entries with key delta 9, or the first 20 of table-a ==")
for i in range(20):
    slot = 0x61502934 + i * 8
    say(f"  0x{slot:08x} delta={u32(slot)} fn=0x{u32(slot + 4):08x}")

text = "\n".join(lines) + "\n"
OUT.write_text(text, encoding="utf-8")
print(text)
