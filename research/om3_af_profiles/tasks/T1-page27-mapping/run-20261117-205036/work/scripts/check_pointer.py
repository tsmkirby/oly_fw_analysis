# Read the u32 words around the 2154/2155 metadata records. Writes work/out/pointer-0x60621340.txt.
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
main = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
start = 0x60621300
chunk = main[start - BASE : start - BASE + 96]
lines = [
    "Decoded main inputs\\00_0100_50000020.decoded.bin",
    "CPU base 0x60021020. File offset = CPU address - base.",
    "Window 0x60621300, 96 bytes, little-endian u32.",
    "",
]
for i in range(0, 96, 4):
    addr = start + i
    raw = chunk[i : i + 4]
    word = struct.unpack_from("<I", chunk, i)[0]
    lines.append(f"0x{addr:08x} {raw.hex()} u32=0x{word:08x}")
lines.append("")
id2155 = struct.unpack_from("<I", main, 0x60621340 - BASE)[0]
ptr2155 = struct.unpack_from("<I", main, 0x60621344 - BASE)[0]
next_id = struct.unpack_from("<I", main, 0x60621354 - BASE)[0]
next_ptr = struct.unpack_from("<I", main, 0x60621358 - BASE)[0]
lines.append(f"2155 id word at 0x60621340 u32=0x{id2155:08x}")
lines.append(f"pointer immediately after it at 0x60621344 u32=0x{ptr2155:08x}")
lines.append(f"following id word at 0x60621354 u32=0x{next_id:08x}")
lines.append(f"pointer after that id at 0x60621358 u32=0x{next_ptr:08x}")
text = "\n".join(lines) + "\n"
out = ROOT / "work" / "out" / "pointer-0x60621340.txt"
out.write_text(text, encoding="utf-8", newline="\n")
print(text, end="")
