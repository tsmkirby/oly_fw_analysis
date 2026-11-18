# Follow-up measurements. Does not modify pack_static_t4.py.
import struct
from pathlib import Path

BASE = 0x60021020
data = Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
out = []


def emit(s=''):
    out.append(s)


def u32(addr):
    return struct.unpack_from('<I', data, addr - BASE)[0]


def find_all(needle, limit=32):
    hits = []
    start = 0
    while len(hits) < limit:
        i = data.find(needle, start)
        if i < 0:
            break
        hits.append(i)
        start = i + 1
    return hits


emit('== duplicate editor 0x216 records ==')
base = 0x615C540C
for idx in (62, 151):
    addr = base + idx * 24
    raw = data[addr - BASE:addr - BASE + 24]
    words = struct.unpack('<6I', raw)
    emit(f'  index {idx} {addr:#x} words {[hex(w) for w in words]} raw {raw.hex()}')
    hits = find_all(struct.pack('<I', addr))
    emit(f'    immediate hits {len(hits)} {[hex(h + BASE) for h in hits]}')

emit('')
emit('== directory and array immediates ==')
for addr in (0x615CC934, 0x615CC938, 0x615C540C, 0x615C7B0C, 0x615C6234, 0x615C59DC):
    hits = find_all(struct.pack('<I', addr))
    emit(f'  {addr:#x} hits {len(hits)} {[hex(h + BASE) for h in hits]}')

emit('')
emit('== face-table keys versus binding +16 ==')
DIR = 0x615CC934
bound = set()
for i in range(14):
    key, ptr, count, pad = struct.unpack_from('<IIHH', data, DIR - BASE + i * 12)
    if ptr == 0 or count == 0:
        continue
    for n in range(count):
        face = struct.unpack_from('<I', data, ptr - BASE + n * 24 + 16)[0] & 0xFFFF
        bound.add(face)
unused = []
used = []
keys = []
for i in range(0x60):
    k = struct.unpack_from('<H', data, 0x6037BEDC - BASE + i * 0x24)[0]
    keys.append(k)
    (used if k in bound else unused).append((i, k))
emit(f'  table keys {len(keys)} unique {len(set(keys))} duplicate table keys '
     f'{sorted(k for k in set(keys) if keys.count(k) > 1)}')
emit(f'  table keys with no binding +16: {unused}')
emit(f'  binding keys with no table record in the 96: '
     f'{sorted(k for k in bound if k not in keys)[:40]} count {sum(1 for k in bound if k not in keys)}')

emit('')
emit('== descriptor-end immediate context (8 bytes before the immediate) ==')
for addr in (0x604048F7, 0x60404A9D, 0x6040595C, 0x60405A6C, 0x60405B64, 0x60405C21, 0x60405878):
    raw = data[addr - BASE - 2:addr - BASE + 4]
    emit(f'  {addr:#x} {raw.hex()}')

emit('')
emit('== table-base immediate context ==')
for addr in (0x60045EE9, 0x60045F9A, 0x60046097):
    raw = data[addr - BASE - 2:addr - BASE + 8]
    emit(f'  {addr:#x} {raw.hex()}')

emit('')
emit('== 0x60320000 immediate context ==')
addr = 0x6136B9D6
emit(f'  {addr:#x} {data[addr - BASE - 8:addr - BASE + 8].hex()}')

emit('')
emit('== head window 0x600210e0..0x60021180 ==')
emit(data[0x600210E0 - BASE:0x60021180 - BASE].hex())

emit('')
emit('== bytes after face table as words ==')
for i in range(8):
    a = 0x6037CC5C + i * 4
    emit(f'  {a:#x} {u32(a):#x}')

emit('')
emit('== 24 bytes at the key-8 / key-15 boundary as one record ==')
raw = data[0x615C7B0C - BASE:0x615C7B0C - BASE + 24]
emit(f'  {raw.hex()} words {[hex(w) for w in struct.unpack("<6I", raw)]}')

emit('')
emit('== value-site first 12 bytes, instruction-sized groups left to the listing ==')
for addr in (0x6041931E, 0x6041937F, 0x60419446, 0x60419696):
    emit(f'  {addr:#x} {data[addr - BASE:addr - BASE + 12].hex()}')

text = '\n'.join(out) + '\n'
Path('work/out/static-t4b.txt').write_text(text, encoding='utf-8')
ranges = Path('work/out/disasm-ranges.txt').read_text(encoding='utf-8')
extra = (
    'section-init-b 0x60045f70 80\n'
    'section-init-c 0x60046040 50\n'
    'head 0x600210c0 70\n'
    'face-tail 0x611f7f90 40\n'
    'desc-end-a 0x604048e0 16\n'
    'desc-end-b 0x60405940 20\n'
)
Path('work/out/disasm-ranges-full.txt').write_text(ranges + extra, encoding='utf-8')
print(text)
