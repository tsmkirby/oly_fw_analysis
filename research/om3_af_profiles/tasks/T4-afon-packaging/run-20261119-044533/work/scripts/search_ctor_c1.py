# Where the builder's caller chain and the key-port hook are stored as words.
import pathlib
import struct

BASE = 0x60021020
data = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
lines = []
for val in (0x602182D0, 0x6021A029, 0x603F0DB6, 0x6040476D, 0x60405865, 0x6017A5FC):
    pat = struct.pack('<I', val)
    hits = []
    start = 0
    while True:
        i = data.find(pat, start)
        if i < 0:
            break
        hits.append(BASE + i)
        start = i + 1
    shown = ', '.join(f'{a:#x}' for a in hits[:16])
    lines.append(f'{val:#x} count {len(hits)} {shown}')
text = '\n'.join(lines) + '\n'
pathlib.Path('work/out/ctor-ptrs-c1.txt').write_text(text, encoding='utf-8')
print(text)
