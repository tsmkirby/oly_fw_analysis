# Correction-round static pass for key 0x5b82.
# Dispositions every raw 82 5b hit and every instruction immediate 0x5b8.
# Extracts the omitted route listings and the AF-target field widths.
# Reads inputs and ref. Writes only the paths given below.
import bisect
import hashlib
import re
import struct
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
RES = (ROOT / 'inputs' / '02_0106_458c0020.decoded.bin').read_bytes()
BASE = 0x60021020
ASM = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
FUNCS = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'functions.tsv'

OUT_TSV = ROOT / 'work' / 'out' / 'candidates-5b82.tsv'
OUT_REPORT = ROOT / 'work' / 'out' / 'classify-5b82-v1.txt'
OUT_LIST = ROOT / 'work' / 'out' / 'listings-5b82-v2.txt'
OUT_FIELDS = ROOT / 'work' / 'out' / 'af-profile-fields-v1.txt'

MAIN_SHA = '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
RES_SHA = '3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059'

# Sol's review, claim 1. These are the hits absent from the round-1 use table.
SOL_82 = [
    0x60045589, 0x6016abc3, 0x601b1bd4, 0x601bc4cb, 0x601e50b3, 0x6020217a,
    0x60300cad, 0x6030a9e5, 0x6030ac1c, 0x6030ac50, 0x6030ac80, 0x6030acb1,
    0x60496c13, 0x60539e07, 0x6057f43c, 0x60590a44, 0x605952fc, 0x605ae1e7,
    0x607c69f4, 0x607c8e19, 0x607cb986, 0x607e2ef9, 0x60855691, 0x60856974,
    0x60856a4c, 0x6085ba42, 0x6085ba5a, 0x6085ba6d, 0x6085c33c, 0x6085daef,
    0x6085f547, 0x60860006, 0x60860565, 0x6086cbd8, 0x6087a8e0, 0x609aa986,
    0x60b4d6c8, 0x60bd0ad6, 0x60c575a2, 0x60e29138, 0x6108f9ba, 0x611aeb7c,
    0x615b9d55, 0x615b9d91, 0x615fbdb0, 0x6180c41b, 0x6180c42d, 0x618309c4,
    0x6187d443,
]
SOL_MOV = [
    0x6007f39b, 0x604df354, 0x608f8614, 0x60cc0c5a, 0x60cebcac, 0x60d68d49,
    0x60d68d56, 0x61102019, 0x6118bf47, 0x6118c058, 0x6118c10e, 0x61195d1d,
    0x61195d7f, 0x61195dc1, 0x61195e4e, 0x61195ec2, 0x61195ee7, 0x61195f36,
    0x61195fc3, 0x611fcdcc, 0x61206ef6, 0x612072f3, 0x6128c262, 0x6128c9c0,
    0x612c37f0, 0x616cd897, 0x616cf1d0, 0x616ddb03, 0x616e369a,
]
WATCH_CALLS = {
    0x604193ca, 0x6041937f, 0x60419446, 0x60419696, 0x60063962, 0x6006398b,
    0x60063a68, 0x60061453, 0x60063684, 0x60063567, 0x600630a3, 0x600619a9,
    0x60063116, 0x60063431,
}
LIST_FUNCS = {
    0x60061453, 0x600619a9, 0x60063087, 0x600630a3, 0x60063116, 0x6006327f,
    0x60063567, 0x60063684, 0x60063962, 0x6006398b, 0x60063a68, 0x60419368,
    0x6041937f, 0x604193ca, 0x60419446, 0x60419696, 0x60419c7d, 0x618cfda1,
    0x60196b06,
}
TOKEN_5B8 = re.compile(r'(?<![0-9a-fA-F])0x0*5b8(?![0-9a-fA-F])', re.I)
TOKEN_5B82 = re.compile(r'(?<![0-9a-fA-F])0x0*5b82(?![0-9a-fA-F])', re.I)
CALL_RE = re.compile(r'\bcall\s+0x([0-9a-fA-F]+)\b')
SHIFT4_RE = re.compile(r'\basl\s+0x4\b|\basl2\b', re.I)

report = []
def w(s=''):
    report.append(s)

def sha(b):
    return hashlib.sha256(b).hexdigest()

def off_of(va):
    return va - BASE

def u16_at(va):
    return struct.unpack_from('<H', MAIN, off_of(va))[0]

def u32_at(va):
    return struct.unpack_from('<I', MAIN, off_of(va))[0]

def hex_at(va, n):
    o = off_of(va)
    return MAIN[o:o + n].hex()

assert sha(MAIN) == MAIN_SHA
assert sha(RES) == RES_SHA
assert len(SOL_82) == 49 and len(set(SOL_82)) == 49
assert len(SOL_MOV) == 29 and len(set(SOL_MOV)) == 29

# function ranges
ranges = []
for line in FUNCS.read_text(encoding='utf-8').splitlines()[1:]:
    p = line.split('\t')
    if len(p) < 3:
        continue
    a = int(p[0], 16)
    n = int(p[2])
    ranges.append((a, a + n, p[1]))
ranges.sort()
starts = [a for a, _, _ in ranges]

def func_at(va):
    i = bisect.bisect_right(starts, va) - 1
    if i < 0:
        return None
    a, b, name = ranges[i]
    if a <= va < b:
        return a, b, name
    return None

def region_of(va):
    hit = func_at(va)
    if hit:
        a, b, name = hit
        return '%s 0x%08x-0x%08x' % (name, a, b)
    return 'data outside any function in functions.tsv'

# registration walk, same rule as the research note
TABLES = [0x60095584, 0x600b8f54, 0x600bb5ec, 0x600bda78, 0x600e4bec]
reg = {}
for start in TABLES:
    a = start
    for _ in range(5000):
        k = u16_at(a)
        if k == 0:
            break
        c = u16_at(a + 2)
        width = (k & 3) or 4
        payload = 4 + c * width
        reg.setdefault(k, []).append((start, a, c, width))
        a = (a + payload + 3) & ~3

def map_entry(sid):
    if 0 <= sid <= 0x8CF:
        return 0x6062555c + sid * 4, 'map0'
    if 0xBB8 <= sid <= 0xBE6:
        return 0x606249bc + (sid - 0xBB8) * 4, 'map3000'
    if 0x2710 <= sid <= 0x2756:
        return 0x6061dd72 + (sid - 0x2710) * 4, 'map10000'
    if 0x3A98 <= sid <= 0x3C5F:
        return 0x6061906e + (sid - 0x3A98) * 4, 'map15000'
    return None, None

# The round-1 scanner used sid * 4 from the table base without subtracting the
# range start for the later maps. FUN_60419446 is the authority. Record both
# only as a note if they differ; the field dump below uses the range-relative
# formula and checks it against a known id.

raw_hits = []
start = 0
blob = MAIN
while True:
    i = blob.find(b'\x82\x5b', start)
    if i < 0:
        break
    raw_hits.append(BASE + i)
    start = i + 1

sol_set = set(SOL_82)
mov_set = set(SOL_MOV)
raw_set = set(raw_hits)
raw_min = min(raw_set)
raw_max = max(raw_set)

# ---- one pass over the export ----
covered = {}          # va -> instruction dict
imm_5b8 = []          # instruction dicts whose mnemonic has token 0x5b8
calls = []            # {target, at, fn, window}
listing = {a: [] for a in LIST_FUNCS}
current = None
current_addr = None
window = []
pending = []
checked = 0
mismatches = []

def take_inst(line):
    global checked
    parts = line.split('\t')
    if len(parts) < 3:
        return None
    try:
        va = int(parts[0], 16)
    except ValueError:
        return None
    raw = parts[1].strip()
    if not raw or any(c not in '0123456789abcdefABCDEF' for c in raw):
        return None
    mnem = parts[2].strip()
    n = len(raw) // 2
    got = hex_at(va, n)
    checked += 1
    if got != raw.lower():
        mismatches.append((va, raw, got))
    return {'va': va, 'raw': raw.lower(), 'n': n, 'mnem': mnem, 'line': line}

with ASM.open('r', encoding='utf-8', errors='replace') as f:
    for line in f:
        line = line.rstrip('\n')
        if line.startswith('; Function '):
            bits = line.split()
            current_addr = int(bits[2], 16) if len(bits) > 2 else None
            current = bits[3] if len(bits) > 3 else ''
            window = []
            pending = []
            if current_addr in listing:
                listing[current_addr].append(line)
            continue
        if current_addr in listing:
            listing[current_addr].append(line)
        inst = take_inst(line)
        if not inst:
            continue
        inst['fn'] = current
        inst['fn_addr'] = current_addr
        for p in pending:
            if len(p['follow']) < 8:
                p['follow'].append(inst['mnem'])
        if inst['n'] and inst['va'] <= raw_max and inst['va'] + inst['n'] > raw_min:
            for b in range(inst['n']):
                a = inst['va'] + b
                if a in raw_set:
                    covered.setdefault(a, inst)
        if TOKEN_5B8.search(inst['mnem']):
            rec = {'inst': inst, 'follow': []}
            imm_5b8.append(rec)
            pending.append(rec)
        m = CALL_RE.search(inst['mnem'])
        if m and int(m.group(1), 16) in WATCH_CALLS:
            calls.append({
                'target': int(m.group(1), 16),
                'at': inst['va'],
                'fn': current,
                'fn_addr': current_addr,
                'mnem': inst['mnem'],
                'window': [x['line'] for x in window[-12:]],
            })
        window.append(inst)
        if len(window) > 16:
            window.pop(0)

w('classify_5b82_v1')
w('main bytes %d sha256 %s' % (len(MAIN), sha(MAIN)))
w('res  bytes %d sha256 %s' % (len(RES), sha(RES)))
w('asm instruction lines checked %d mismatches %d' % (checked, len(mismatches)))
w('raw 82 5b hits %d' % len(raw_hits))
w('instruction immediates with token 0x5b8: %d' % len(imm_5b8))
w('watched call sites: %d' % len(calls))
for m in mismatches[:10]:
    w('MISMATCH 0x%08x asm %s image %s' % m)

def ascii_window(va):
    o = off_of(va)
    chunk = MAIN[max(0, o - 8):o + 16]
    return ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk)

def looks_like_address(dword):
    return 0x60000000 <= dword <= 0x61FFFFFF or 0x50000000 <= dword <= 0x51FFFFFF

def data_disposition(va):
    o = off_of(va)
    window = hex_at(va, 8) if o + 8 <= len(MAIN) else hex_at(va, max(0, len(MAIN) - o))
    text = ascii_window(va)
    dword = u32_at(va) if o + 4 <= len(MAIN) else None
    half = u16_at(va) if o + 2 <= len(MAIN) else None
    # pointer / address constant whose low half is 5b82
    if dword is not None and looks_like_address(dword):
        return ('not code',
                'dword LE 0x%08x at this address is an address constant; bytes %s ascii %s' % (dword, window, text))
    # unaligned: the 82 is not the first byte of a halfword key
    if va & 1:
        # check the aligned dword that contains this byte
        base = va & ~3
        contained = u32_at(base)
        if looks_like_address(contained):
            return ('not code',
                    'unaligned inside address constant 0x%08x at 0x%08x; bytes %s' % (contained, base, window))
        return ('not code',
                'unaligned data byte, not a halfword key; window %s ascii %s; containing function/region %s' % (
                    window, text, region_of(va)))
    if half == 0x5b82:
        nxt = u16_at(va + 2)
        places = reg.get(0x5b82, [])
        in_reg = any(a == va for _, a, _, _ in places)
        # UI maps store u16 key, u16 index
        in_map = False
        for sid in range(0, 0x8D0):
            e, _ = map_entry(sid)
            if e == va:
                in_map = True
                break
        if in_reg or in_map or nxt <= 32:
            kind = 'registration' if in_reg else ('ui-map' if in_map else 'halfword pair')
            return ('key use',
                    'aligned u16 0x5b82 followed by 0x%04x (%s); window %s; %s' % (nxt, kind, window, region_of(va)))
        return ('other meaning',
                'aligned u16 0x5b82 followed by 0x%04x, not a registration or UI-map slot; window %s; %s' % (
                    nxt, window, region_of(va)))
    return ('not code',
            'data bytes %s ascii %s; %s' % (window, text, region_of(va)))

rows = []

def add_row(addr, where, context, disposition, evidence, source):
    rows.append({
        'address': addr,
        'where': where,
        'context': context,
        'disposition': disposition,
        'evidence': evidence,
        'source': source,
    })

# every raw 82 5b hit, Sol's 49 first in his order, then any extra
ordered = list(SOL_82) + [a for a in raw_hits if a not in sol_set]
for va in ordered:
    inst = covered.get(va)
    where = region_of(va)
    if inst:
        where = '%s+0x%x' % (inst['fn'], va - (inst['fn_addr'] or va))
        if TOKEN_5B82.search(inst['mnem']):
            disp = 'key use'
            why = 'instruction operand is the key immediate 0x5b82'
        elif 'call ' in inst['mnem'] or 'jmp ' in inst['mnem'] or 'bra ' in inst['mnem']:
            disp = 'not code'
            why = 'bytes fall inside a control-transfer displacement, not a key operand'
        else:
            disp = 'not code'
            why = 'bytes fall inside an instruction whose operand is not the key 0x5b82'
        context = '0x%08x %s %s' % (inst['va'], inst['raw'], inst['mnem'])
        evidence = '%s; hit at +%d of %d bytes; %s' % (why, va - inst['va'], inst['n'], where)
    else:
        disp, evidence = data_disposition(va)
        context = 'no instruction covers this address; ' + evidence
    src = 'sol-82-5b' if va in sol_set else 'raw-82-5b-extra'
    add_row(va, where, context, disp, evidence, src)

# every 0x5b8 immediate, Sol's mov sites included
seen_mov = set()
for rec in imm_5b8:
    inst = rec['inst']
    seen_mov.add(inst['va'])
    follow = ' | '.join(rec['follow'])
    mnem = inst['mnem']
    shifted = any(SHIFT4_RE.search(x) for x in rec['follow'])
    if '(0x5b8' in mnem.lower() or mnem.lower().startswith('add 0x5b8') or 'add 0x5b8' in mnem.lower():
        disp = 'other meaning'
        why = 'structure displacement or addend 0x5b8, not slot<<4'
    elif shifted and re.search(r'\bmov\s+0x0*5b8\b', mnem, re.I):
        disp = 'key use'
        why = 'mov 0x5b8 is followed by a x4 shift; could form slot 0x5b8 << 4'
    elif re.search(r'\bmov\s+0x0*5b8\b', mnem, re.I):
        disp = 'other meaning'
        why = 'mov immediate 0x5b8 with no following x4 shift in the next 8 instructions; not formed into key 0x5b82'
    else:
        disp = 'other meaning'
        why = 'instruction immediate 0x5b8 is not the key and is not shifted into it'
    where = '%s+0x%x' % (inst['fn'], inst['va'] - (inst['fn_addr'] or inst['va']))
    context = '0x%08x %s %s' % (inst['va'], inst['raw'], mnem)
    evidence = '%s; next: %s' % (why, follow if follow else '(end of function)')
    src = 'sol-mov-5b8' if inst['va'] in mov_set else 'imm-5b8'
    add_row(inst['va'], where, context, disp, evidence, src)

missing_mov = [a for a in SOL_MOV if a not in seen_mov]
w('')
w('sol mov sites missing from the 0x5b8 token scan: %d' % len(missing_mov))
for a in missing_mov:
    inst = covered.get(a)
    w('  missing 0x%08x covered %s region %s' % (a, inst['mnem'] if inst else 'no', region_of(a)))
    # still emit a row so the TSV has every site Sol listed
    if inst:
        disp = 'other meaning'
        evidence = 'Sol listed this mov site; the export line is `%s` and it did not match token 0x5b8. %s' % (inst['mnem'], region_of(a))
        context = '0x%08x %s %s' % (inst['va'], inst['raw'], inst['mnem'])
        where = inst['fn']
    else:
        disp, evidence = data_disposition(a)
        context = evidence
        where = region_of(a)
    add_row(a, where, context, disp, evidence, 'sol-mov-5b8-unmatched')

# ---- TSV ----
def clean(s):
    return s.replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')

tsv = ['address\tregion\tinstruction_or_context\tdisposition\tsource\tevidence']
for r in rows:
    tsv.append('\t'.join([
        '0x%08x' % r['address'],
        clean(r['where']),
        clean(r['context']),
        r['disposition'],
        r['source'],
        clean(r['evidence']),
    ]))
OUT_TSV.write_text('\n'.join(tsv) + '\n', encoding='utf-8')

# counts
from collections import Counter
c = Counter((r['source'], r['disposition']) for r in rows)
w('')
w('disposition counts')
for k in sorted(c):
    w('  %s %s %d' % (k[0], k[1], c[k]))

# ---- call sites ----
w('')
w('## watched call sites')
by_target = {}
for c_ in calls:
    by_target.setdefault(c_['target'], []).append(c_)
for target in sorted(by_target):
    sites = by_target[target]
    w('')
    w('call 0x%08x from %d sites' % (target, len(sites)))
    for s in sites:
        # last mov-immediate or register move into D0 in the window
        d0 = ''
        for line in reversed(s['window']):
            mnem = line.split('\t')[-1] if '\t' in line else line
            if re.search(r'\bD0\b', mnem) and (mnem.strip().startswith('mov') or mnem.strip().startswith('clr')):
                d0 = mnem.strip()
                break
        w('  at 0x%08x in %s d0~ %s :: %s' % (s['at'], s['fn'], d0, s['mnem']))
        for line in s['window']:
            w('    ' + line)

# ---- debug slots ----
w('')
w('## debug handler slots')
NEEDLES = {
    'slot-address-602ec448': (0x602ec448).to_bytes(4, 'little'),
    'slot-address-602eda1c': (0x602eda1c).to_bytes(4, 'little'),
    'handler-pointer-600619a9': (0x600619a9).to_bytes(4, 'little'),
}
for name, pat in NEEDLES.items():
    w('')
    w(name + ' ' + pat.hex())
    start = 0
    n = 0
    while n < 40:
        i = MAIN.find(pat, start)
        if i < 0:
            break
        va = BASE + i
        w('  hit 0x%08x %s window %s' % (va, region_of(va), hex_at(va, 16)))
        start = i + 1
        n += 1
    w('  count shown %d' % n)

for slot in (0x602ec448, 0x602eda1c):
    w('')
    w('dump 0x%08x-64' % slot)
    base = slot - 64
    raw = MAIN[off_of(base):off_of(slot) + 32]
    for i in range(0, len(raw), 16):
        chunk = raw[i:i + 16]
        text = ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk)
        w('  0x%08x %s %s' % (base + i, chunk.hex(), text))

# asm references to the slot addresses and the handler
w('')
w('## asm tokens for the handler and the slots')
tokens = ('0x600619a9', '0x602ec448', '0x602eda1c', '0x602ec2e8')
# second small scan would re-read the file; the call scan already caught call 0x600619a9.
# Search the collected call list and say if zero. A dedicated count:
token_hits = {t: 0 for t in tokens}
with ASM.open('r', encoding='utf-8', errors='replace') as f:
    for line in f:
        for t in tokens:
            if t in line.lower() or t in line:
                token_hits[t] += 1
                if token_hits[t] <= 8:
                    w('  %s %s' % (t, line.rstrip('\n')[:200]))
for t, n in token_hits.items():
    w('token %s lines %d' % (t, n))

# ---- AF field widths ----
fields = []
def fw(s=''):
    fields.append(s)

fw('af profile field widths')
fw('main sha256 %s' % sha(MAIN))
fw('')
fw('map formula check: id 2154')
e, tag = map_entry(2154)
fw('  entry 0x%08x tag %s bytes %s key 0x%04x index %d' % (e, tag, hex_at(e, 4), u16_at(e), u16_at(e + 2)))

AF = {
    40: 'MODE_AF_AREA',
    85: 'MODE_AF_FRAME',
    163: 'MODE_AF_AREA_TYPE',
    1338: 'MODE_AF_FRAME_POS',
    1803: 'MODE_AF_TARGET_SIZE',
    1657: 'MODE_AF_AREA_SIZE_VERTICAL',
    1658: 'MODE_AF_AREA_SIZE_HORIZONTAL',
}
for sid in list(range(1642, 1650)) + list(range(1659, 1675)):
    AF[sid] = 'orientation-or-custom-%d' % sid

fw('')
fw('ui id -> key/index, and the registration record of that key')
seen_keys = {}
for sid in sorted(AF):
    e, tag = map_entry(sid)
    if e is None or off_of(e) < 0 or off_of(e) + 4 > len(MAIN):
        fw('id %d %s NO MAP' % (sid, AF[sid]))
        continue
    key = u16_at(e)
    index = u16_at(e + 2)
    fw('id %d %-40s %s entry 0x%08x bytes %s key 0x%04x index %d width-from-key %d' % (
        sid, AF[sid], tag, e, hex_at(e, 4), key, index, (key & 3) or 4))
    seen_keys.setdefault(key, []).append((sid, index, AF[sid]))

fw('')
fw('registration records for those keys')
for key in sorted(seen_keys):
    places = reg.get(key, [])
    fw('key 0x%04x width %d uses %s' % (key, (key & 3) or 4, seen_keys[key]))
    if not places:
        fw('  NOT IN THE FIVE REGISTRATION TABLES')
        continue
    for table, addr, count, width in places:
        payload = MAIN[off_of(addr + 4):off_of(addr + 4) + count * width]
        fw('  table 0x%08x record 0x%08x count %d width %d payload %s' % (
            table, addr, count, width, payload.hex()))

fw('')
fw('key 0x5b82 registration %s' % reg.get(0x5b82))
fw('named cursor map entries')
for sid, name in ((2017, 'TOY'), (2031, 'VINTAGE'), (2034, 'PARTCOLOR')):
    e, tag = map_entry(sid)
    fw('  %d %s 0x%08x %s key 0x%04x index %d' % (sid, name, e, hex_at(e, 4), u16_at(e), u16_at(e + 2)))

# also try the round-1 formula (sid * 4 from the published base, no range subtract)
# and report if 2154 still lands on 0x60627704
fw('')
fw('round-1 formula 0x6062555c+sid*4 for 2154 = 0x%08x' % (0x6062555c + 2154 * 4))

OUT_FIELDS.write_text('\n'.join(fields) + '\n', encoding='utf-8')

# ---- listings ----
lst = []
def lw(s=''):
    lst.append(s)
lw('listings-5b82-v2 omitted routes and their direct callers')
lw('image sha256 %s' % MAIN_SHA)
lw('instruction byte-check of every extracted line is in classify-5b82-v1.txt (whole-file check)')
lw('mismatches in the whole export pass: %d' % len(mismatches))
lw('')
for addr in sorted(listing):
    lines = listing[addr]
    lw('')
    lw('==== function 0x%08x (%d lines) ====' % (addr, len(lines)))
    if not lines:
        lw('NOT FOUND in all-functions.asm')
        continue
    # byte-check these lines specifically
    bad = 0
    for line in lines:
        inst = take_inst(line) if '\t' in line else None
        if inst and hex_at(inst['va'], inst['n']) != inst['raw']:
            bad += 1
    lw('byte mismatches in this function: %d' % bad)
    lw('\n'.join(lines))

OUT_LIST.write_text('\n'.join(lst) + '\n', encoding='utf-8')
OUT_REPORT.write_text('\n'.join(report) + '\n', encoding='utf-8')
print('hits', len(raw_hits), 'imm5b8', len(imm_5b8), 'calls', len(calls),
      'rows', len(rows), 'mismatches', len(mismatches), 'missing_mov', len(missing_mov))
print('wrote', OUT_TSV.name, OUT_REPORT.name, OUT_LIST.name, OUT_FIELDS.name)
