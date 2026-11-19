# Words around the one stored pointer to FUN_602182d0, and the one to the hook.
import pathlib
import struct

BASE = 0x60021020
data = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
lines = []
for addr, n in ((0x60039520, 24), (0x6017A5C0, 16)):
    lines.append(f'-- {addr:#x}')
    for i in range(n):
        a = addr + 4 * i
        w = struct.unpack_from('<I', data, a - BASE)[0]
        lines.append(f'{a:#x} {w:#010x}')
text = '\n'.join(lines) + '\n'
pathlib.Path('work/out/ctor-window-c1.txt').write_text(text, encoding='utf-8')
print(text)
