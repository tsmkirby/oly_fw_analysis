# Correction-round static checks. Does not modify the image.
# Writes work/out/static-c1.txt, the face-patch bytes, and disasm-ranges-c1.txt.
import pathlib
import struct

BASE = 0x60021020
ROOT = pathlib.Path('work/out')
ROOT.mkdir(parents=True, exist_ok=True)
data = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
lines = []


def say(s=''):
    lines.append(s)


def addr_of(off):
    return BASE + off


def off_of(addr):
    return addr - BASE


def find_all(pat):
    hits = []
    start = 0
    while True:
        i = data.find(pat, start)
        if i < 0:
            break
        hits.append(i)
        start = i + 1
    return hits


say('static-c1')
say(f'image bytes {len(data)}')

say('')
say('dword hits (little-endian immediate or stored word)')
for val in (
    0x615C6234, 0x615C59DC, 0x615C540C, 0x615CC934, 0x615CC938,
    0x615C7B0C, 0x615C6240, 0x00000E28,
):
    hits = find_all(struct.pack('<I', val))
    shown = ', '.join(f'{addr_of(i):#x}' for i in hits[:12])
    more = '' if len(hits) <= 12 else f' ... {len(hits)} total'
    say(f'  {val:#x} count {len(hits)} {shown}{more}')

say('')
say('udfu01 0x18 (byte pattern f9 14|15|16|17 18), stride-24 multiply')
for reg, b1 in ((0, 0x14), (1, 0x15), (2, 0x16), (3, 0x17)):
    hits = find_all(bytes((0xF9, b1, 0x18)))
    say(f'  D{reg} count {len(hits)}')
    for i in hits:
        say(f'    {addr_of(i):#x}')

# Branches whose displacement lands in the face match/miss window.
LO, HI = 0x611F7F3E, 0x611F7F4A
say('')
say(f'byte patterns whose relative target is in [{LO:#x}, {HI:#x})')
say('a data byte with the same opcode is included; the face listing decides which are instructions')


def consider(at, opcode, disp, nbytes):
    target = (at + disp) & 0xFFFFFFFF
    if LO <= target < HI:
        raw = data[off_of(at):off_of(at) + nbytes].hex()
        say(f'  {at:#x} {raw} disp {disp:#x} -> {target:#x}')


# Section 7 only: that is where this walker lives, and a whole-image scan of
# every 0xDC byte is mostly data. The known bne is inside this span.
sec_lo, sec_hi = 0x6103F000, 0x6164B000
blob = data[off_of(sec_lo):off_of(sec_hi)]
base_at = sec_lo
n = 0
for i, b in enumerate(blob):
    at = base_at + i
    if 0xC0 <= b <= 0xCA and i + 1 < len(blob):
        disp = struct.unpack_from('<b', blob, i + 1)[0]
        consider(at, b, disp, 2)
        n += 1
    elif b == 0xCC and i + 2 < len(blob):
        disp = struct.unpack_from('<h', blob, i + 1)[0]
        consider(at, b, disp, 3)
    elif b == 0xDC and i + 4 < len(blob):
        disp = struct.unpack_from('<i', blob, i + 1)[0]
        consider(at, b, disp, 5)
say(f'section-7 branch opcodes scanned {n} short forms plus cc/dc')

# Hole for the face helper: after the 8-byte node, before the action table.
# Node is 0x6031e9b8 for 8 bytes, so 0x6031e9c0. Action table is 0x6031ea00.
HOLE = 0x6031E9C0
HOLE_LEN = 48
hole = data[off_of(HOLE):off_of(HOLE) + HOLE_LEN]
say('')
say(f'helper hole {HOLE:#x} +{HOLE_LEN} ff {hole == bytes([0xFF]) * HOLE_LEN} unique {sorted(set(hole))[:8]}')

arch = pathlib.Path('ref/analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv')
ov = pathlib.Path('ref/analysis/button-af/readiness/t3-afon-zone-row/t3j/overlay-changed-bytes.csv')


def csv_in(path, lo, hi):
    hits = []
    for line in path.read_text(encoding='utf-8').splitlines()[1:]:
        parts = line.split(',')
        if len(parts) < 2:
            continue
        a = int(parts[1], 16)
        if lo <= a < hi:
            hits.append(a)
    return hits


say(f'archived csv rows in hole {len(csv_in(arch, HOLE, HOLE + HOLE_LEN))}')
say(f'overlay csv rows in hole {len(csv_in(ov, HOLE, HOLE + HOLE_LEN))}')
say(f'overlay csv rows at node 0x6031e9b8-0x6031e9c0 {len(csv_in(ov, 0x6031E9B8, 0x6031E9C0))}')
span_lo, span_hi = 0x6031E920, 0x6031EAE4
say(f'span {span_lo:#x}-{span_hi:#x} bytes {span_hi - span_lo}')
say(f'overlay rows in span {len(csv_in(ov, span_lo, span_hi))}')

# Face helper. A1 is saved because the continuation's use of A1 is not assumed.
# The first instruction is the bne that used to sit at 0x611f7f3e, so the
# flags from cmp D0,D3 are still the ones that instruction tests.
# H is the candidate home. The archived installer starts at 0x6031ead0, which
# is after this hole; the script above counts archived rows inside the hole.
H = HOLE
SITE = 0x611F7F3E
DONE = 0x611F7F4A
MISS = 0x611F7F44


def u8(n):
    return bytes((n & 0xFF,))


def u16(n):
    return struct.pack('<H', n & 0xFFFF)


def s32(n):
    return struct.pack('<i', n)


body = bytearray()
fixups = []  # (offset of rel8, label)


def mark(label):
    labels[label] = len(body)


labels = {}
# 0 bne miss
mark('entry')
body += b'\xc9\x00'
fixups.append((len(body) - 1, 'miss'))
# stock store
body += b'\xf0\x18'
# save A1
body += b'\xf8\xfe\xfc'  # add -4,sp
body += b'\x47\x00'      # mov A1,(sp)
body += b'\x25\x98\x09'  # mov 0x998,A1
body += b'\xf1\x7d'      # add A3,A1
body += b'\xf0\x05'      # mov (A1),A1
body += b'\x21\x54'      # add 0x54,A1
body += b'\xf0\x61'      # movhu (A1),D0
body += b'\xfa\xc8\x6f\x3d'  # cmp 0x3d6f,D0
body += b'\xc9\x00'
fixups.append((len(body) - 1, 'restore'))
body += b'\xfc\xcc' + struct.pack('<I', 0x6031EA48)  # mov 0x6031ea48,D0
body += b'\x60'  # mov D0,(A0)
mark('restore')
body += b'\x5d\x00'      # mov (sp),A1
body += b'\xf8\xfe\x04'  # add 4,sp
mark('to_done')
body += b'\xdc' + s32(0)
done_at = len(body) - 4
mark('miss')
body += b'\xdc' + s32(0)
miss_at = len(body) - 4

for pos, lab in fixups:
    rel = labels[lab] - (pos - 1)
    if not -128 <= rel <= 127:
        raise SystemExit(f'rel8 {lab} {rel} out of range')
    body[pos] = rel & 0xFF

done_pc = H + done_at - 1  # the dc opcode, 4 bytes of disp follow; wait
# done_at is the offset of the first disp byte. The opcode is at done_at - 1.
done_op = H + (done_at - 1)
miss_op = H + (miss_at - 1)
body[done_at:done_at + 4] = s32(DONE - done_op)
body[miss_at:miss_at + 4] = s32(MISS - miss_op)

if len(body) != HOLE_LEN:
    raise SystemExit(f'helper length {len(body)} != {HOLE_LEN}')

site_disp = s32(H - SITE)
site = b'\xdc' + site_disp + b'\xcb'
if len(site) != 6:
    raise SystemExit('site patch is not 6 bytes')

say('')
say(f'helper home {H:#x} bytes {len(body)} hex {body.hex()}')
say(f'  done jmp at {done_op:#x} -> {DONE:#x}')
say(f'  miss jmp at {miss_op:#x} -> {MISS:#x}')
say(f'site {SITE:#x} bytes {site.hex()} jmp -> {H:#x} then nop')
say('stock site bytes ' + data[off_of(SITE):off_of(SITE) + 6].hex())
say('expected stock c906 f018 ca08 (bne, mov A2,(A0), bra)')

# Confirm 0x60045f70 and 0x60046040 from the bytes the earlier good stream named.
say('')
say('bytes at 0x60045f6e ' + data[off_of(0x60045F6E):off_of(0x60045F72)].hex())
say('bytes at 0x6004603b ' + data[off_of(0x6004603B):off_of(0x60046042)].hex())

ranges = ROOT / 'disasm-ranges-c1.txt'
range_lines = [
    'flash-entry-c1 0x600232d1 110',
    'flash-read-c1 0x60023389 150',
    'callee-213f0-c1 0x600213f0 40',
    'callee-235b5-c1 0x600235b5 50',
    'callee-235ff-c1 0x600235ff 40',
    'callee-2347c-c1 0x6002347c 50',
    'callee-23653-c1 0x60023653 40',
    'callee-236ea-c1 0x600236ea 50',
    'callee-21812-c1 0x60021812 50',
    'callee-23042-c1 0x60023042 40',
    'callee-23228-c1 0x60023228 40',
    'section-init-c1 0x60045f44 200',
    'face-c1 0x611f7f01 100',
    'call-site-c1 0x6040476d 16',
    f'blob face-site-c1 {SITE:x} {site.hex()}',
    f'blob face-helper-c1 {H:x} {body.hex()}',
]
ranges.write_text('\n'.join(range_lines) + '\n', encoding='utf-8')
(ROOT / 'face-patch-bytes-c1.txt').write_text(
    f'site {SITE:#x} {site.hex()}\nhelper {H:#x} {body.hex()}\n',
    encoding='utf-8',
)
(ROOT / 'static-c1.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
print(f'wrote {ranges} helper {len(body)} site {len(site)}')
