# Static packaging measurements for T4. Read-only on inputs and ref.
# Writes work/out/static-t4.txt and work/out/disasm-ranges.txt.
import struct
from pathlib import Path

BASE = 0x60021020
FLASH = 0x50000020
IMG = Path('inputs/00_0100_50000020.decoded.bin')
RES = Path('inputs/02_0106_458c0020.decoded.bin')
OUT = Path('work/out/static-t4.txt')
RANGES = Path('work/out/disasm-ranges.txt')

data = IMG.read_bytes()
res = RES.read_bytes()
lines = []


def emit(s=''):
    lines.append(s)


def u16(off):
    return struct.unpack_from('<H', data, off)[0]


def u32(off):
    return struct.unpack_from('<I', data, off)[0]


def off_of(addr):
    return addr - BASE


def hexb(b):
    return b.hex()


def find_all(blob, needle, limit=64):
    hits = []
    start = 0
    while len(hits) < limit:
        i = blob.find(needle, start)
        if i < 0:
            break
        hits.append(i)
        start = i + 1
    return hits


def section_of(addr, sections):
    for s in sections:
        if s['dest'] <= addr < s['end']:
            return s['n']
    return None


def pointers_into(blob, lo, hi, limit=40):
    """Any-alignment little-endian words in [lo, hi), cached and uncached."""
    hits = []
    more = 0
    for alias in (0, 0x40000000):
        page = (lo + alias) & ~0xFFFF
        last = hi + alias
        while page < last:
            sig = bytes([(page >> 16) & 0xFF, (page >> 24) & 0xFF])
            idx = 0
            while True:
                j = blob.find(sig, idx)
                if j < 0:
                    break
                at = j - 2
                if at >= 0 and at + 4 <= len(blob):
                    v = struct.unpack_from('<I', blob, at)[0]
                    if lo + alias <= v < hi + alias:
                        if len(hits) < limit:
                            hits.append((at, v))
                        else:
                            more += 1
                idx = j + 1
            page += 0x10000
    return hits, more


def ff_runs(blob, lo, hi, minlen):
    chunk = blob[lo - BASE:hi - BASE]
    runs = []
    i = 0
    n = len(chunk)
    while i < n:
        if chunk[i] != 0xFF:
            i += 1
            continue
        j = i + 1
        while j < n and chunk[j] == 0xFF:
            j += 1
        if j - i >= minlen:
            runs.append((lo + i, j - i))
        i = j
    return runs


def cluster(addrs):
    if not addrs:
        return []
    addrs = sorted(addrs)
    spans = [[addrs[0], addrs[0]]]
    for a in addrs[1:]:
        if a == spans[-1][1] + 1:
            spans[-1][1] = a
        else:
            spans.append([a, a])
    return [(a, b, b - a + 1) for a, b in spans]


emit('T4 static packaging measurements')
emit(f'image bytes {len(data)} resource bytes {len(res)}')
emit(f'image sha input path {IMG.as_posix()}')
magic = b'olycompress'
emit(f'olycompress in main: {len(find_all(data, magic, 8))} hits')
emit(f'olycompress in 0106: {len(find_all(res, magic, 8))} hits (first file offs {[hex(x) for x in find_all(res, magic, 4)]})')
emit(f'image starts {hexb(data[:16])} OE header {data[:2] == b"OE"}')

# Section table and end words.
TABLE = 0x60029B28
emit('')
emit('== section descriptors at 0x60029b28, 12 bytes: dest, source, word2 ==')
sections = []
for n in range(10):
    o = off_of(TABLE) + n * 12
    dest, src, flag = struct.unpack_from('<III', data, o)
    file_off = src - FLASH
    in_place = file_off == dest - BASE
    same = False
    if 0 <= file_off < len(data) and 0 <= dest - BASE < len(data):
        # identity is by address mapping; bytes are the same cells when in_place
        same = in_place
    sections.append({
        'n': n + 1, 'dest': dest, 'src': src, 'flag': flag,
        'file': file_off, 'in_place': in_place,
    })
    emit(f'  section {n+1} dest {dest:#x} source {src:#x} file {file_off:#x} '
         f'word2 {flag:#x} in_place {in_place} raw {hexb(data[o:o+12])}')

# End selector immediates: mov imm32,d0 is fc cc + u32, near 0x60045e6c.
emit('')
emit('== end immediates (fc cc imm32) whose value is a section end candidate ==')
sel = off_of(0x60045E6C)
window = data[sel:sel + 0x80]
ends = {}
for i in range(len(window) - 6):
    if window[i] == 0xFC and window[i + 1] == 0xCC:
        val = struct.unpack_from('<I', window, i + 2)[0]
        addr = 0x60045E6C + i
        ends[val] = addr
        emit(f'  mov imm32 at {addr:#x} value {val:#x}')
for s in sections:
    # pair with the next known end if present; filled after we know order
    pass
# Known pairing: the selector returns the exclusive end. Match each dest to the
# smallest immediate strictly above it.
end_values = sorted(ends)
for s in sections:
    above = [v for v in end_values if v > s['dest']]
    s['end'] = above[0] if above else None
    s['end_at'] = ends.get(s['end'])
    if s['end'] is not None:
        s['loaded'] = s['end'] - s['dest']
        gap_to_next = None
        emit(f'  section {s["n"]} loaded {s["dest"]:#x}..{s["end"]:#x} '
             f'({s["loaded"]} bytes) end word at {s["end_at"]:#x}')

emit('')
emit('== gaps between loaded end and the next destination (not copied by the loader) ==')
for i, s in enumerate(sections):
    nxt = sections[i + 1]['dest'] if i + 1 < len(sections) else BASE + len(data)
    gap = nxt - s['end']
    emit(f'  after section {s["n"]}: {s["end"]:#x}..{nxt:#x} gap {gap} bytes')
    s['gap_end'] = nxt
    s['gap'] = gap

# Loader does not contain the flag word address. Count immediates of the table base
# and of each word2's address.
emit('')
emit('== immediates of the descriptor table and of each word2 address ==')
table_hits = find_all(data, struct.pack('<I', TABLE), 32)
emit(f'  table base {TABLE:#x} hits {len(table_hits)} file offs {[hex(x) for x in table_hits]} '
     f'runtime {[hex(x + BASE) for x in table_hits]}')
for n in range(10):
    flag_addr = TABLE + n * 12 + 8
    hits = find_all(data, struct.pack('<I', flag_addr), 8)
    emit(f'  word2 address section {n+1} {flag_addr:#x} pointer hits {len(hits)}')

# Prove a known section-7 instruction is plain bytes at the in-place offset.
emit('')
emit('== plain-byte checks ==')
checks = {
    0x60045ED5: bytes.fromhex('f1e38fffe3cd'),
    0x6124F4E5: bytes.fromhex('f8972004461c'),
    0x60405865: bytes.fromhex('00fcdc7049a862'),
    0x611F7F35: bytes.fromhex('fcd2dcbe3760'),
    0x6041931E: data[off_of(0x6041931E):off_of(0x6041931E) + 8],
}
for addr, expect in (
    (0x60045ED5, bytes.fromhex('f1e38fffe3')),
    (0x6124F4E5, bytes.fromhex('f8972004')),
    (0x60405876, bytes.fromhex('fcdf2c916160')),  # mov 0x6061912c,A3
    (0x611F7F35, bytes.fromhex('fcd2dcbe3760')),  # add 0x6037bedc,A2
    (0x604058B3, bytes.fromhex('fac9b006')),      # cmp 0x6b0,D1
):
    got = data[off_of(addr):off_of(addr) + len(expect)]
    emit(f'  {addr:#x} expect {expect.hex()} got {got.hex()} match {got == expect}')

emit('')
emit('== loader string candidates at 0x60047790 and 0x600477a6 ==')
for a in (0x60047790, 0x600477A6):
    raw = data[off_of(a):off_of(a) + 24]
    emit(f'  {a:#x} {raw!r}')

# Binding directory.
emit('')
emit('== binding directory 0x615cc934, 14 x 12 ==')
DIR = 0x615CC934
entries = []
for i in range(14):
    o = off_of(DIR) + i * 12
    key, ptr, count, pad = struct.unpack_from('<IIHH', data, o)
    entries.append((i, key, ptr, count, pad))
    emit(f'  [{i}] key {key:#x} ptr {ptr:#x} count {count} pad {pad:#x} raw {hexb(data[o:o+12])}')
keys = [e[1] for e in entries]
emit(f'  duplicate keys: {[k for k in set(keys) if keys.count(k) > 1]}')

# Key-8 array, which T3f says is the first entry. Confirm by key value 8.
emit('')
emit('== records walked when the directory key is 8 ==')
key8 = [e for e in entries if e[1] == 8]
emit(f'  entries with key 8: {len(key8)}')
if key8:
    _, _, ptr, count, _ = key8[0]
    end = ptr + count * 24
    emit(f'  first key-8 entry ptr {ptr:#x} count {count} end {end:#x} bytes {count * 24}')
    ids = []
    recs = []
    for i in range(count):
        o = off_of(ptr) + i * 24
        words = struct.unpack_from('<6I', data, o)
        recs.append(words)
        ids.append(words[0])
    from collections import Counter
    c = Counter(ids)
    dups = sorted((k, v) for k, v in c.items() if v > 1)
    emit(f'  unique editor ids {len(c)} of {count}')
    emit(f'  id 0x1e6 present {0x1e6 in c}')
    emit(f'  id 0 present {0 in c} count {c.get(0, 0)}')
    emit(f'  duplicate id groups {len(dups)}')
    for k, v in dups[:40]:
        idxs = [i for i, x in enumerate(ids) if x == k]
        same = len({recs[i] for i in idxs}) == 1
        emit(f'    id {k:#x} x{v} indexes {idxs} records-identical {same}')
    emit(f'  first id {ids[0]:#x} last id {ids[-1]:#x}')
    # face keys at +16
    face_keys = [w[4] & 0xFFFF for w in recs]
    emit(f'  key-8 +16 halfwords unique {len(set(face_keys))} min {min(face_keys):#x} max {max(face_keys):#x}')
    tail = data[off_of(end):off_of(end) + 64]
    emit(f'  64 bytes after the counted array {tail.hex()}')
    emit(f'  those 24 bytes all FF {tail[:24] == bytes([0xFF]) * 24}')
    # does any directory range cover the next 24 bytes?
    cover = []
    for i, key, p, cnt, _pad in entries:
        a, b = p, p + cnt * 24
        if p and a < end + 24 and end < b:
            cover.append((i, key, a, b))
    emit(f'  directory ranges that cover the next 24 bytes: {cover}')
    emit(f'  pointer hits of array base {ptr:#x}: {len(find_all(data, struct.pack("<I", ptr), 32))} '
         f'{[hex(x + BASE) for x in find_all(data, struct.pack("<I", ptr), 16)]}')

emit('')
emit('== every directory array: id 0x1e6, span, bytes immediately after ==')
all_face = set()
for i, key, ptr, count, _pad in entries:
    if ptr == 0 or count == 0:
        emit(f'  [{i}] key {key:#x} empty')
        continue
    ids = []
    faces = []
    for n in range(count):
        o = off_of(ptr) + n * 24
        eid, _a, _ui, _b, face, _c = struct.unpack_from('<6I', data, o)
        ids.append(eid)
        faces.append(face & 0xFFFF)
        all_face.add(face & 0xFFFF)
    end = ptr + count * 24
    nxt = data[off_of(end):off_of(end) + 8]
    emit(f'  [{i}] key {key:#x} {ptr:#x}..{end:#x} count {count} '
         f'0x1e6 {0x1e6 in ids} unique ids {len(set(ids))} '
         f'after {nxt.hex()} section {section_of(ptr, sections)}')

emit('')
emit('== face keys selected by any directory array +16 ==')
emit(f'  union size {len(all_face)} missing 0..95: {[k for k in range(96) if k not in all_face]}')
emit(f'  keys outside 0..95: {sorted(k for k in all_face if k > 95)[:20]} count {sum(1 for k in all_face if k > 95)}')

# Face table.
FACE = 0x6037BEDC
STRIDE = 0x24
NFACE = 0x60
emit('')
emit('== face table 0x6037bedc stride 0x24 count immediate 0x60 ==')
face_end = FACE + NFACE * STRIDE
emit(f'  end {face_end:#x} bytes {NFACE * STRIDE}')
emit(f'  section of table {section_of(FACE, sections)} section of end {section_of(face_end, sections)}')
fkeys = []
for i in range(NFACE):
    o = off_of(FACE) + i * STRIDE
    k = u16(o)
    fkeys.append(k)
emit(f'  record0 key {fkeys[0]:#x} record76 key {fkeys[76]:#x} last key {fkeys[-1]:#x}')
emit(f'  keys equal to index 0..95: {fkeys == list(range(96))}')
after_face = data[off_of(face_end):off_of(face_end) + 48]
emit(f'  48 bytes after record 96 {after_face.hex()}')
emit(f'  next 36 all FF {after_face[:36] == bytes([0xFF]) * 36}')
for label, addr in (('table', FACE), ('end', face_end), ('record76', 0x6037C98C)):
    hits = find_all(data, struct.pack('<I', addr), 32)
    emit(f'  immediate {label} {addr:#x} hits {len(hits)} runtime {[hex(x + BASE) for x in hits]}')
# count immediate byte 0x60 at the cmp in the walker
emit(f'  bytes at 0x611f7f47 {data[off_of(0x611F7F47):off_of(0x611F7F47)+2].hex()}')

# Head-copy constants in the low image.
emit('')
emit('== head-copy address constants in the first 0x8000 image bytes ==')
head = data[:0x8000]
for addr in (0x60030000, 0x60357000, 0x60387094, 0x6039B800, 0x603A4000,
             0x6037BEDC, 0x60320000, 0x6031F000, 0x60129000):
    hits = find_all(head, struct.pack('<I', addr), 8)
    emit(f'  {addr:#x} in head {len(hits)} runtime {[hex(x + BASE) for x in hits]}')
# also whole image for 0x60320000
hits = find_all(data, struct.pack('<I', 0x60320000), 16)
emit(f'  whole-image immediate 0x60320000 hits {len(hits)} runtime {[hex(x + BASE) for x in hits]}')

# Descriptor table.
DESC = 0x6061912C
DSTR = 20
DCOUNT = 0x6B0
emit('')
emit('== descriptor table ==')
dend = DESC + DCOUNT * DSTR
emit(f'  {DESC:#x} stride {DSTR} count {DCOUNT} end {dend:#x} section {section_of(DESC, sections)}')
ids = [u16(off_of(DESC) + i * DSTR) for i in range(DCOUNT)]
emit(f'  id 0x3D6F present {0x3D6F in ids} id 2154 count {ids.count(2154)} id 238 count {ids.count(238)}')
emit(f'  duplicate descriptor ids {sum(1 for k, v in Counter(ids).items() if v > 1)}')
after = data[off_of(dend):off_of(dend) + 32]
emit(f'  32 bytes after table {after.hex()} all FF {after == bytes([0xFF]) * 32}')
# what is the next non-ff
chunk = data[off_of(dend):off_of(dend) + 256]
ff = 0
while ff < len(chunk) and chunk[ff] == 0xFF:
    ff += 1
emit(f'  FF run after table {ff} bytes then {chunk[ff:ff+16].hex() if ff < len(chunk) else "end"}')
for addr in (DESC, dend, 0x606200E4, 0x6062132C):
    hits = find_all(data, struct.pack('<I', addr), 16)
    emit(f'  immediate {addr:#x} hits {len(hits)} runtime {[hex(x + BASE) for x in hits]}')
emit(f'  builder count bytes at 0x604058b3 {data[off_of(0x604058B3):off_of(0x604058B3)+4].hex()}')
emit(f'  builder in section {section_of(0x60405865, sections)}')

# Value-routing bounds. 0x3D6F against the constants in the two functions.
emit('')
emit('== 0x3D6F against mapped/index range constants ==')
uid = 0x3D6F
bounds = [0x8D0, 3000, 0xBE6, 4000, 0xFB6, 0x1194, 0x11A9, 10000, 0x2756, 15000, 0x3C5F, 6000]
emit(f'  id {uid} ({uid:#x})')
for b in bounds:
    emit(f'    vs {b} ({b:#x}): id < bound {uid < b} id > bound {uid > b}')

# Sites whose first bytes a branch would replace.
emit('')
emit('== entry bytes at the value sites and the key-port hook ==')
for addr, n in (
    (0x6041931E, 16), (0x6041937F, 16), (0x60419446, 16), (0x60419696, 16),
    (0x6017A5FC, 16), (0x611F7F42, 8), (0x60405865, 16),
):
    raw = data[off_of(addr):off_of(addr) + n]
    emit(f'  {addr:#x} section {section_of(addr, sections)} {raw.hex()}')

# Page / source / action / directory field bytes.
emit('')
emit('== section-7 fields the prototype rewrites (stock bytes) ==')
fields = [
    ('page descriptor', 0x6158F0F8, 16),
    ('source record', 0x61529CE8, 16),
    ('action pointer', 0x6150F5F0, 12),
    ('directory entry', 0x615CC934, 12),
    ('stock action table', 0x6150C514, 48),
    ('page rows', 0x6158DC44, 72),
]
for name, addr, n in fields:
    raw = data[off_of(addr):off_of(addr) + n]
    emit(f'  {name} {addr:#x} section {section_of(addr, sections)} {raw.hex()}')

# Alignment of those fields.
emit('')
emit('== alignment of rewrite addresses ==')
for name, addr in (
    ('page+4', 0x6158F0FC), ('page count', 0x6158F100),
    ('source+4', 0x61529CEC), ('source count', 0x61529CF0),
    ('action ptr', 0x6150F5F0), ('action count', 0x6150F5F4),
    ('dir ptr', 0x615CC938), ('dir count', 0x615CC93C),
    ('bucket ram', 0x62A84970 + (0x3D6F & 0x7F) * 4),
    ('face immediate', 0x611F7F35), ('face count cmp', 0x611F7F47),
):
    emit(f'  {name} {addr:#x} mod4 {addr & 3} mod2 {addr & 1}')

# Owned tails and FF runs.
emit('')
emit('== stage-0 tails: FF and pointer hits (cached and uncached, any alignment) ==')
tails = [
    ('section1', 0x6031E920, 0x6031F000),
    ('section2', 0x607187A4, 0x60718800),
    ('section4', 0x60A8F088, 0x60A8F800),
    ('section9-code-space', 0x619A9680, 0x619A9800),
]
for name, lo, hi in tails:
    blob = data[off_of(lo):off_of(hi)]
    ff = blob.count(0xFF)
    emit(f'  {name} {lo:#x}..{hi:#x} {hi - lo} bytes FF {ff} other {hi - lo - ff} '
         f'section {section_of(lo, sections)}')
    hits, more = pointers_into(data, lo, hi, 24)
    emit(f'    pointer hits shown {len(hits)} more {more}')
    for at, v in hits:
        emit(f'    from {at + BASE:#x} value {v:#x} context {data[at:at+4].hex()}')

emit('')
emit('== FF runs of at least 10008 bytes inside loaded sections ==')
big = []
for s in sections:
    if s['end'] is None:
        continue
    runs = ff_runs(data, s['dest'], s['end'], 10008)
    for a, n in runs:
        big.append((s['n'], a, n))
        emit(f'  section {s["n"]} {a:#x} length {n}')
if not big:
    emit('  none')
emit('== FF runs of at least 4096 bytes inside loaded sections ==')
mid = []
for s in sections:
    if s['end'] is None:
        continue
    for a, n in ff_runs(data, s['dest'], s['end'], 4096):
        mid.append((s['n'], a, n))
        emit(f'  section {s["n"]} {a:#x} length {n}')
if not mid:
    emit('  none')

# Largest FF run per loaded section (capped search at 64).
emit('')
emit('== longest FF run inside each loaded section ==')
for s in sections:
    if s['end'] is None:
        continue
    runs = ff_runs(data, s['dest'], s['end'], 64)
    if not runs:
        emit(f'  section {s["n"]} none >= 64')
        continue
    a, n = max(runs, key=lambda t: t[1])
    emit(f'  section {s["n"]} longest {a:#x} length {n} (runs >= 64: {len(runs)})')

# Overlay and archived placement.
emit('')
emit('== prototype overlay spans ==')
ov_path = Path('ref/analysis/button-af/readiness/t3-afon-zone-row/t3j/overlay-changed-bytes.csv')
ov = {}
for line in ov_path.read_text(encoding='utf-8').splitlines()[1:]:
    parts = line.split(',')
    addr = int(parts[1], 16)
    purpose = parts[4]
    ov.setdefault(purpose, []).append(addr)
all_ov = [a for xs in ov.values() for a in xs]
emit(f'  changed bytes {len(all_ov)} span {min(all_ov):#x}..{max(all_ov):#x} '
     f'({max(all_ov) - min(all_ov) + 1} span bytes)')
for purpose, xs in ov.items():
    spans = cluster(xs)
    emit(f'  purpose {purpose!r} bytes {len(xs)} spans {[(hex(a), hex(b), n) for a, b, n in spans]}')

emit('')
emit('== archived queue-95 placement spans ==')
ar_path = Path('ref/analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv')
ar = {}
for line in ar_path.read_text(encoding='utf-8').splitlines()[1:]:
    parts = line.split(',')
    addr = int(parts[1], 16)
    reason = parts[4]
    ar.setdefault(reason, []).append(addr)
all_ar = [a for xs in ar.values() for a in xs]
emit(f'  changed bytes {len(all_ar)} sections '
     f'{sorted({section_of(a, sections) for a in all_ar})}')
for reason, xs in sorted(ar.items(), key=lambda kv: min(kv[1])):
    spans = cluster(xs)
    emit(f'  {reason!r} bytes {len(xs)} spans {[(hex(a), hex(b), n) for a, b, n in spans]}')

emit('')
emit('== overlap of overlay addresses with archived addresses ==')
ar_set = set(all_ar)
both = sorted(set(all_ov) & ar_set)
emit(f'  shared addresses {len(both)} first { [hex(a) for a in both[:12]] } last { [hex(a) for a in both[-4:]] }')
# span overlap even where the bytes differ
ov_spans = cluster(all_ov)
ar_spans = cluster(all_ar)
emit('  span intersections:')
for a, b, n in ov_spans:
    for c, d, m in ar_spans:
        lo, hi = max(a, c), min(b, d)
        if lo <= hi:
            emit(f'    overlay {a:#x}..{b:#x} x archived {c:#x}..{d:#x} -> {lo:#x}..{hi:#x} ({hi - lo + 1})')

# Section-4 tail remainder against the archived high address.
emit('')
emit('== section-4 tail versus archived high water ==')
s4 = [a for a in all_ar if 0x60A8F088 <= a < 0x60A8F800]
if s4:
    emit(f'  archived bytes in section-4 tail {len(s4)} {min(s4):#x}..{max(s4):#x}')
    emit(f'  bytes after last archived byte through 0x60a8f7ff: {0x60A8F800 - (max(s4) + 1)}')

# 0x60320000 neighbourhood: is it FF, which region.
emit('')
emit('== scratch 0x60320000 ==')
region = section_of(0x60320000, sections)
emit(f'  section {region}')
for s in sections:
    if s['end'] <= 0x60320000 < s['gap_end']:
        emit(f'  sits in the unloaded gap after section {s["n"]} ({s["end"]:#x}..{s["gap_end"]:#x})')
raw = data[off_of(0x60320000):off_of(0x60320000) + 16]
emit(f'  first 16 file bytes {raw.hex()}')
span = data[off_of(0x60320000):off_of(0x60320000) + 10008]
emit(f'  10008 bytes all FF {span == bytes([0xFF]) * 10008}')

# Constructor pointer the stage-0 record names.
emit('')
emit('== constructor site 0x602153fb ==')
emit(f'  bytes {data[off_of(0x602153FB):off_of(0x602153FB)+12].hex()}')

# Bucket arithmetic.
emit('')
emit(f'== hash bucket for 0x3D6F: index {0x3D6F & 0x7F:#x} '
     f'addr {0x62A84970 + (0x3D6F & 0x7F) * 4:#x} == 0x62a84b2c {0x62A84970 + (0x3D6F & 0x7F) * 4 == 0x62A84B2C}')

# Where 0x6061912c and the count live, section flags.
emit('')
emit('== section flags only ==')
for s in sections:
    emit(f'  section {s["n"]} word2 {s["flag"]:#x} loaded {s["loaded"]}')

text = '\n'.join(lines) + '\n'
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(text, encoding='utf-8')

ranges = [
    ('loader', 0x60045ED5, 40),
    ('end-selector', 0x60045E6C, 40),
    ('flash-entry', 0x600232D1, 30),
    ('alias', 0x60070FD4, 24),
    ('flash-read', 0x60023389, 70),
    ('boot-task', 0x600455C5, 120),
    ('binding', 0x6124F4E5, 45),
    ('builder', 0x60405865, 36),
    ('lookup', 0x604058BC, 24),
    ('getter', 0x6041931E, 28),
    ('setter', 0x6041937F, 30),
    ('mapped', 0x60419446, 220),
    ('index', 0x60419696, 46),
    ('face', 0x611F7F01, 40),
    ('hook', 0x6017A5FC, 16),
    ('section-init', 0x60045F44, 40),
]
RANGES.write_text(''.join(f'{name} {addr:#x} {n}\n' for name, addr, n in ranges), encoding='utf-8')
print(text)
print(f'wrote {OUT} and {RANGES}')
