# Check each disassembly hex column against the window bytes.
import json
from pathlib import Path

ROOT = Path('.')
windows = json.loads((ROOT / 'work/out/static-windows-k1.json').read_text(encoding='utf-8'))
by_addr = {}
for name, win in windows.items():
    base = int(win['address'], 16)
    raw = bytes.fromhex(win['hex'])
    for i, b in enumerate(raw):
        by_addr[base + i] = b
files = [
    'work/out/disasm-home-k1.txt',
    'work/out/disasm-stub-k1.txt',
    'work/out/disasm-ensure-k1.txt',
    'work/out/disasm-converter-k1.txt',
    'work/out/disasm-callsite-k1.txt',
    'work/out/disasm-reconcile-head-k1.txt',
]
bad = []
checked = 0
for path in files:
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        parts = line.split('\t')
        if len(parts) < 2 or parts[1] in ('??',) or 'window' in parts[1] or 'short' in parts[1]:
            continue
        addr = int(parts[0], 16)
        hexbytes = parts[1]
        if len(hexbytes) % 2:
            bad.append(line + ' odd hex')
            continue
        raw = bytes.fromhex(hexbytes)
        for i, b in enumerate(raw):
            got = by_addr.get(addr + i)
            if got != b:
                bad.append(f'{path} {addr + i:08x} listing {b:02x} image {got}')
        checked += 1
print('instructions', checked, 'mismatches', len(bad))
for row in bad[:20]:
    print(row)
raise SystemExit(1 if bad else 0)
