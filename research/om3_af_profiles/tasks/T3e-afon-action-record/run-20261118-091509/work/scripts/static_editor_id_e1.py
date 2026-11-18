# Search for a u16 table that maps the action-record second word onto a UI id.
import struct
from pathlib import Path

BIN = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
needle = struct.pack("<HHHHH", 2156, 2157, 2205, 2154, 2155)
start = 0
hits = []
while True:
    j = BIN.find(needle, start)
    if j < 0:
        break
    hits.append(BASE + j)
    start = j + 1
print("packed sequence hits", [hex(h) for h in hits])
# Also a word-strided table: u32 entries.
needle32 = b"".join(struct.pack("<I", v) for v in (2156, 2157, 2205, 2154, 2155))
start = 0
hits32 = []
while True:
    j = BIN.find(needle32, start)
    if j < 0:
        break
    hits32.append(BASE + j)
    start = j + 1
print("u32 sequence hits", [hex(h) for h in hits32])
# Indexed check: some base B where half[B + id*2] matches for the five ids.
# Scan only addresses where the 2154 halfword sits, and the neighbours match.
pat = struct.pack("<H", 2154)
start = 0
indexed = []
while True:
    j = BIN.find(pat, start)
    if j < 0:
        break
    start = j + 1
    # candidate index address is j; base = j - 0x1e3*2
    base_off = j - 0x1E3 * 2
    if base_off < 0 or base_off + 0x1E4 * 2 + 2 > len(BIN):
        continue
    ok = True
    for ident, ui in ((0x1E0, 2156), (0x1E1, 2157), (0x1E2, 2205), (0x1E4, 2155)):
        off = base_off + ident * 2
        if struct.unpack_from("<H", BIN, off)[0] != ui:
            ok = False
            break
    if ok:
        indexed.append(BASE + base_off)
print("u16 index-table bases", [hex(h) for h in indexed])
