# Compare every listing hex byte with the decoded image.
import pathlib
base = 0x60021020
data = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
root = pathlib.Path('work/out/listings')
bad = 0
rows = 0
for path in sorted(root.glob('*.txt')):
    for line in path.read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        parts = line.split('\t')
        if len(parts) < 2:
            continue
        addr = int(parts[0], 16)
        hexb = parts[1]
        if len(hexb) % 2:
            print(f'odd hex {path.name} {line}')
            bad += 1
            continue
        raw = bytes.fromhex(hexb)
        got = data[addr - base:addr - base + len(raw)]
        rows += 1
        if got != raw:
            print(f'MISMATCH {path.name} {addr:#x} listing {hexb} image {got.hex()}')
            bad += 1
print(f'rows {rows} mismatches {bad}')
