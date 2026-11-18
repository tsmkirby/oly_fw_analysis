# Build the T3a in-memory overlay. Bytes land only in the section-1 tail.
# Section 7 records are not patched here: that section is compressed.
import pathlib
import struct

ROOT = pathlib.Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
UI = 0x3D6F
DEFAULT = 0  # first zone-list value; registration default of key 0x99a1
PROFILE = 0x6031E920
IDS = 0x6031E928
ROWS = 0x6031E930

stock0 = BIN[0x6158DC44 - BASE:0x6158DC44 - BASE + 36]
stock1 = BIN[0x6158DC68 - BASE:0x6158DC68 - BASE + 36]
third = struct.pack(
    "<IHHIIIIIII",
    UI, 4, 0x0DD2,
    0x6158AEB4, 0x6158BA1C, 10, 0,
    0x6158AEB4, 0x6158BA1C, 10,
)
assert len(stock0) == len(stock1) == len(third) == 36
assert stock0[:4] == struct.pack("<I", 2154)
assert stock1[:4] == struct.pack("<I", 2155)

blob = {
    PROFILE: bytes([DEFAULT, 0xA7, 1, 0]),
    IDS: struct.pack("<HHHH", 2154, 2155, UI, 0),
    ROWS: stock0 + stock1 + third,
}

# Section 1 is uncompressed and contains this tail. Sections 6 and 7 do not.
SEC1 = (0x60134000, 0x6031F000)
SEC6 = (0x60ADC000, 0x60ADB800)  # end is below start in the selector; checked separately
SEC7 = (0x6103F000, 0x6164B000)

rows = ["component_offset,runtime_address,stock_byte,proposed_byte,purpose"]
for addr, data in blob.items():
    assert SEC1[0] <= addr and addr + len(data) <= SEC1[1], hex(addr)
    assert not (SEC7[0] <= addr < SEC7[1])
    for i, new in enumerate(data):
        old = BIN[addr + i - BASE]
        if old == new:
            continue
        rows.append(f"{addr + i - BASE:08x},{addr + i:08x},{old:02x},{new:02x},section-1 tail AF-ON zone row")

out = ROOT / "work" / "out" / "overlay-changed-bytes.csv"
out.write_text("\n".join(rows) + "\n", encoding="utf-8")
print(f"rows {len(rows) - 1} profile {PROFILE:#x} ids {IDS:#x} rows_at {ROWS:#x} ui {UI:#x}")
print("third", third.hex())
