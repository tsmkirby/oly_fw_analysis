# Raw bytes of the FUN_6071327d jump stubs the listing skips.
from pathlib import Path
ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
OUT = ROOT / 'work' / 'out' / 'fa64-stubs-v1.txt'
start, end = 0x607132b6, 0x607132fb
lines = ['stub bytes 0x%08x..0x%08x' % (start, end)]
va = start
while va < end:
    raw = MAIN[va - BASE:va - BASE + 4].hex()
    lines.append('  0x%08x %s' % (va, raw))
    va += 4
# also the id/pointer pairs that point at these stubs, first non-zero ids
lines.append('nonzero ids:')
import struct
va = 0x60718658
while va < 0x60718758:
    ident, ptr = struct.unpack_from('<II', MAIN, va - BASE)
    if ident:
        lines.append('  id 0x%x -> 0x%08x' % (ident, ptr))
    va += 8
text = '\n'.join(lines) + '\n'
OUT.write_text(text, encoding='utf-8')
print(text)
print('DONE')
