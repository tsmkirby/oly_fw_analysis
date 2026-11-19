# Compare every Ghidra listing under work/out/listings with the decoded image.
# Header lines and TRUNCATED lines are not instruction rows.
import pathlib
import sys

base = 0x60021020
data = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
root = pathlib.Path('work/out/listings')
bad = 0
rows = 0
files = 0
for path in sorted(root.glob('*.txt')):
    files += 1
    for line in path.read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.startswith('#') or line.startswith('TRUNCATED'):
            continue
        parts = line.split('\t')
        if len(parts) < 2 or parts[1] in ('??',):
            continue
        try:
            addr = int(parts[0], 16)
            raw = bytes.fromhex(parts[1])
        except ValueError:
            print(f'SKIP {path.name} {line[:80]}')
            continue
        off = addr - base
        got = data[off:off + len(raw)] if 0 <= off and off + len(raw) <= len(data) else b''
        rows += 1
        if got != raw:
            print(f'MISMATCH {path.name} {addr:#x} listing {parts[1]} image {got.hex()}')
            bad += 1
print(f'files {files} rows {rows} mismatches {bad}')
if bad:
    sys.exit(1)
