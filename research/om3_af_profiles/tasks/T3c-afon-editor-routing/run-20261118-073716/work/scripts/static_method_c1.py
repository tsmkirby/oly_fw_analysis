# Read the kind-11 list vtable slot that FUN_6120308d calls.
import struct
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
VT = 0x6151346C
words = [struct.unpack_from("<I", BIN, VT - BASE + i * 4)[0] for i in range(8)]
lines = [f"vtable 0x{VT:08x} " + " ".join(f"0x{w:08x}" for w in words)]
# Also the viewer vtable slot +0x68, which E4 measured as FUN_61203082.
VIEW = 0x6158AE0C
slot = struct.unpack_from("<I", BIN, VIEW - BASE + 0x68)[0]
lines.append(f"viewer 0x{VIEW:08x} +0x68 = 0x{slot:08x}")
text = "\n".join(lines) + "\n"
(ROOT / "work" / "out" / "static-method-c1.txt").write_text(text, encoding="utf-8")
print(text)
