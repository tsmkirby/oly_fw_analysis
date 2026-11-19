# Compare DisasmStockM2 hex to the stock image. Do not edit after it has run.
import json
from pathlib import Path

IMAGE = Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
files = [
    'work/out/disasm-mapped-m2.txt',
    'work/out/disasm-setcall-m2.txt',
    'work/out/disasm-wrap-m2.txt',
    'work/out/disasm-getter-m2.txt',
    'work/out/disasm-cellset-m2.txt',
]
problems = []
checked = 0
for name in files:
    for line in Path(name).read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        addr_s, hex_s, *_ = line.split('\t')
        addr = int(addr_s, 16)
        raw = bytes.fromhex(hex_s)
        off = addr - BASE
        got = IMAGE[off:off + len(raw)]
        checked += 1
        if got != raw:
            problems.append(f'{name} {addr_s} image {got.hex()} listing {hex_s}')
report = {'checked': checked, 'problems': problems, 'ok': not problems}
Path('work/out/listing-check-e3.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report))
if problems:
    raise SystemExit(1)
