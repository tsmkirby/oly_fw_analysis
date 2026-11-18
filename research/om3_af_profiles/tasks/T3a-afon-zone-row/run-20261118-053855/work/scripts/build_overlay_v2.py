# Overlay v2: v1's row data plus a 20-byte editor descriptor cloned from UI 238.
# The hash link is not an overlay byte. It is built in RAM after boot.
import pathlib
import struct

ROOT = pathlib.Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
UI = 0x3D6F
PROFILE = 0x6031E920
IDS = 0x6031E928
ROWS = 0x6031E930
DESC = 0x6031E9A0
SEC1 = (0x60134000, 0x6031F000)
SEC7 = (0x6103F000, 0x6164B000)

stock0 = BIN[0x6158DC44 - BASE:0x6158DC44 - BASE + 36]
stock1 = BIN[0x6158DC68 - BASE:0x6158DC68 - BASE + 36]
third = struct.pack("<IHHIIIIIII", UI, 4, 0x0DD2, 0x6158AEB4, 0x6158BA1C, 10, 0, 0x6158AEB4, 0x6158BA1C, 10)
desc = bytearray(BIN[0x606200E4 - BASE:0x606200E4 - BASE + 20])
assert struct.unpack_from("<H", desc)[0] == 238
struct.pack_into("<H", desc, 0, UI)
blob = {
    PROFILE: bytes([0, 0xA7, 1, 0]),
    IDS: struct.pack("<HHHH", 2154, 2155, UI, 0),
    ROWS: stock0 + stock1 + third,
    DESC: bytes(desc),
}
rows = ["component_offset,runtime_address,stock_byte,proposed_byte,purpose"]
for addr, data in blob.items():
    assert SEC1[0] <= addr and addr + len(data) <= SEC1[1]
    assert not (SEC7[0] <= addr < SEC7[1])
    purpose = "section-1 editor descriptor cloned from UI 238" if addr == DESC else "section-1 tail AF-ON zone row"
    for i, new in enumerate(data):
        old = BIN[addr + i - BASE]
        if old == new:
            continue
        rows.append(f"{addr + i - BASE:08x},{addr + i:08x},{old:02x},{new:02x},{purpose}")
out = ROOT / "work" / "out" / "overlay-changed-bytes.csv"
out.write_text("\n".join(rows) + "\n", encoding="utf-8")
print(f"bytes {len(rows)-1} desc {DESC:#x} {bytes(desc).hex()}")
