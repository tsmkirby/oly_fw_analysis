# Fast follow-up: unused UI id, the one empty map slot, 0x99a1 defaults.
import pathlib
import struct

ROOT = pathlib.Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out" / "static-afon-v2.txt"
lines = []


def say(s=""):
    lines.append(s)


def u16_at(o):
    return struct.unpack_from("<H", BIN, o)[0]


def u32_at(o):
    return struct.unpack_from("<I", BIN, o)[0]


# One pass: mov-imm16 opcodes and every u32 in the post-map id space.
mov16 = set()
u32hit = set()
n = len(BIN)
for i in range(n - 3):
    op = BIN[i]
    if op in (0x2C, 0x2D, 0x2E, 0x2F):
        mov16.add(u16_at(i + 1))
    v = u32_at(i)
    if 0x3C60 <= v <= 0xFFFE:
        u32hit.add(v)

# cmp imm16: fa ca / fa c8 / fa c9 seen in the getter. Record every fa ?? imm16.
cmp16 = set()
for i in range(n - 4):
    if BIN[i] == 0xFA and BIN[i + 1] in (0xC8, 0xC9, 0xCA, 0xCB, 0x64, 0x65):
        cmp16.add(u16_at(i + 2))

say(f"mov16 distinct {len(mov16)} cmp16 distinct {len(cmp16)} u32-in-range distinct {len(u32hit)}")

# The single zero map slot.
ranges = [
    ("low", 0, 0x8CF, lambda i: 0x6062555C + i * 4),
    ("3000", 0xBB8, 0xBE6, lambda i: 0x606249BC + i * 4),
    ("4000", 0xFA0, 0xFB6, lambda i: 0x60627984 + (i * 2) - 0x1F40),
    ("4500", 0x1194, 0x11A9, lambda i: 0x60627958 + (i * 2) - 0x2328),
    ("10000", 0x2710, 0x2756, lambda i: 0x606279B2 + i * 4 - 0x9C40),
    ("15000", 0x3A98, 0x3C5F, lambda i: 0x60627ACE + i * 4 - 0xEA60),
]


def key_at(addr):
    o = addr - BASE
    return struct.unpack_from("<HH", BIN, o)


zeros = []
for name, lo, hi, addr_of in ranges:
    for i in range(lo, hi + 1):
        key, index = key_at(addr_of(i))
        if key == 0:
            zeros.append((name, i, index, addr_of(i)))
say(f"zero-key slots {len(zeros)}")
for row in zeros:
    say(f"  {row}")

# First ids above the maps with no u32, no mov16, no cmp16.
found = []
for sid in range(0x3C60, 0x8000):
    if sid in u32hit or sid in mov16 or sid in cmp16:
        continue
    found.append(sid)
    if len(found) >= 12:
        break
say("first quiet ids above 0x3c5f (no u32, no mov16, no cmp16): " + " ".join(f"{s:#x}" for s in found))

# 0x99a1 registration in the bank-7 table 0x600e4bec-0x6011fe20.
region = BIN[0x600E4BEC - BASE:0x6011FE20 - BASE]
needle = struct.pack("<H", 0x99A1)
say("0x99a1 hits inside bank-7 registration")
start = 0
while True:
    j = region.find(needle, start)
    if j < 0:
        break
    addr = 0x600E4BEC + j
    window = region[j:j + 24]
    say(f"  {addr:#x} {window.hex()}")
    start = j + 1

# Also the other profile keys, first hit only, 16 bytes.
for key in (0x9A41, 0x5962, 0x1DD1, 0x9FA1, 0x99D2, 0xDFA1, 0x1EA1, 0x90A1):
    j = region.find(struct.pack("<H", key))
    if j < 0:
        say(f"  key {key:#x} not in bank-7 window")
        continue
    addr = 0x600E4BEC + j
    say(f"  key {key:#x} at {addr:#x} {region[j:j+16].hex()}")

OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
