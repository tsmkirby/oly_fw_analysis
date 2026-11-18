"""Check the deciding listing against the image and locate the action table."""
import json
import struct
from pathlib import Path

BASE = 0x60021020
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
out = []

def file_off(addr):
    return addr - BASE

def check(path):
    mismatches = 0
    checked = 0
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        addr = int(parts[0], 16)
        raw = parts[1]
        if raw == "??":
            continue
        expect = bytes.fromhex(raw)
        got = image[file_off(addr):file_off(addr) + len(expect)]
        checked += 1
        if got != expect:
            mismatches += 1
            out.append(f"MISMATCH {path} {parts[0]} listing {raw} image {got.hex()}")
    out.append(f"{path}: checked {checked} mismatches {mismatches}")

for name in [
    "work/out/disasm-2631-d1.txt",
    "work/out/disasm-2747-d1.txt",
    "work/out/disasm-1ab9-d1.txt",
    "work/out/disasm-182e-d1.txt",
    "work/out/disasm-1229-d1.txt",
    "work/out/disasm-13c0-d1.txt",
    "work/out/disasm-3082-d1.txt",
    "work/out/disasm-308d-d1.txt",
]:
    check(name)

# Section table: 10 rows of u32 dest, src, flag at 0x60029b28.
sec_off = file_off(0x60029B28)
out.append("sections:")
for i in range(10):
    dest, src, flag = struct.unpack_from("<III", image, sec_off + i * 12)
    out.append(f"  {i} dest=0x{dest:08x} src=0x{src:08x} flag=0x{flag:x}")

def section_of(addr):
    rows = []
    for i in range(10):
        dest, src, flag = struct.unpack_from("<III", image, sec_off + i * 12)
        rows.append((dest, flag, i))
    rows.sort()
    owner = None
    for n, (dest, flag, i) in enumerate(rows):
        end = rows[n + 1][0] if n + 1 < len(rows) else 0x62000000
        if dest <= addr < end:
            owner = (i, dest, flag, end)
    return owner

for addr in (0x611A26E1, 0x611A277E, 0x611A182E, 0x611A1AB9, 0x6150C514, 0x6150C4CC, 0x6062555C, 0x60419446):
    sec = section_of(addr)
    out.append(f"addr 0x{addr:08x} section {sec}")

needle = struct.pack("<I", 0x6150C514)
hits = []
start = 0
while True:
    i = image.find(needle, start)
    if i < 0:
        break
    hits.append(BASE + i)
    start = i + 1
out.append("pointers to table 0x6150c514: " + ", ".join(f"0x{h:08x}" for h in hits))

table = image[file_off(0x6150C514):file_off(0x6150C514) + 48]
out.append("image table 0x6150c514: " + table.hex())
caf = image[file_off(0x6150C4CC):file_off(0x6150C4CC) + 72]
out.append("image table 0x6150c4cc: " + caf.hex())

# UI map slot for 2154 and the fact 0x3D6F is outside map 0 (ids below 0x8d0).
slot = file_off(0x6062555C + 0x086A * 4)
key, index = struct.unpack_from("<HH", image, slot)
out.append(f"map0 id 2154 at 0x{0x6062555C + 0x086A * 4:08x} key=0x{key:04x} index={index}")
out.append(f"0x3D6F={0x3D6F} map0 limit 0x8d0={0x8d0} map3 end 0x3c5f={0x3c5f}")

# Match-trace keys, without the record dump.
for line in Path("work/out/trace-match-d1.jsonl").read_text(encoding="utf-8").splitlines():
    row = json.loads(line)
    if row.get("step") != "ok":
        continue
    reads = row.get("decideReads") or []
    ids = sorted({(r.get("fn"), r.get("d0")) for r in reads})
    out.append(f"decideReads {row.get('label')}: {ids}")

Path("work/out/static-decision-d1.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("\n".join(out[:20]))
print("...")
print(f"wrote {len(out)} lines")
