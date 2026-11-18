"""Write the overlay CSV once, and compare K4 cell readbacks."""
import csv
import json
import struct
from pathlib import Path

BASE = 0x60021020
ROW = 0x6031E978
STOCK = 0x6158DC44
image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
src = Path("ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv")
by_off = {}
with src.open(encoding="utf-8") as f:
    for row in csv.DictReader(f):
        off = int(row["component_offset"], 16)
        by_off[off] = (int(row["stock_byte"], 16), int(row["proposed_byte"], 16), row["purpose"])
stock = image[STOCK - BASE:STOCK - BASE + 36]
for i in range(36):
    off = (ROW - BASE) + i
    neu = [0x6F, 0x3D, 0x00, 0x00][i] if i < 4 else stock[i]
    old = image[off]
    by_off[off] = (old, neu, "E1 stock-shaped row, id 0x3D6F")

sec_off = 0x60029B28 - BASE
sections = []
for i in range(10):
    dest, src_addr, flag = struct.unpack_from("<III", image, sec_off + i * 12)
    sections.append((dest, flag, i))
sections.sort()

def section_of(addr):
    for n, (dest, flag, i) in enumerate(sections):
        end = sections[n + 1][0] if n + 1 < len(sections) else 0x62000000
        if dest <= addr < end:
            return i + 1, flag
    return None, None

rows = []
compressed = []
for off in sorted(by_off):
    old, neu, purpose = by_off[off]
    if old == neu:
        continue
    addr = BASE + off
    sec, flag = section_of(addr)
    if flag:
        compressed.append(addr)
    rows.append((off, addr, old, neu, purpose, sec, flag))

out = Path("work/out/overlay-changed-bytes.csv")
with out.open("w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["component_offset", "runtime_address", "stock_byte", "proposed_byte", "purpose"])
    for off, addr, old, neu, purpose, sec, flag in rows:
        w.writerow([f"{off:08x}", f"{addr:08x}", f"{old:02x}", f"{neu:02x}", purpose])

lines = [
    f"changed {len(rows)}",
    f"compressed {len(compressed)}",
    "sections " + ", ".join(f"sec{sec}/flag{flag}" for *_, sec, flag in rows[:1]),
]
secs = sorted({(sec, flag) for *_, sec, flag in rows})
lines.append("overlay sections " + ", ".join(f"section {s} flag {fl}" for s, fl in secs))

k4 = [json.loads(line) for line in Path("work/out/exp-k4-d1.jsonl").read_text(encoding="utf-8").splitlines()]
before = next(r for r in k4 if r.get("step") == "before-ok")["cells"]
confirm = next(r for r in k4 if r.get("step") == "confirm")["cells"]
cancel = next(r for r in k4 if r.get("step") == "cancel")["cells"]
for name, later in (("cancel", cancel), ("confirm", confirm)):
    diffs = [key for key in before if before[key] != later[key]]
    if diffs:
        for key in diffs:
            lines.append(f"{name} differs {key}: {before[key]} -> {later[key]}")
    else:
        lines.append(f"{name} cell readback matches before-ok")
Path("work/out/overlay-check-d1.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
