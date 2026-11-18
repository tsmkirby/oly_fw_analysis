# Static scan for bank-7 keys 0x5b82, 0x5b52, 0xf5f1, 0xf5e1.
# Reads only inputs and ref. Writes the report path given as argv[1].
import hashlib, json, struct, sys
from pathlib import Path

ROOT = Path('.').resolve()
OUT = Path(sys.argv[1])
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
RES = (ROOT / 'inputs' / '02_0106_458c0020.decoded.bin').read_bytes()
BASE = 0x60021020
NAMES = json.loads((ROOT / 'ref' / 'analysis' / 'review' / 'setting-name-candidates.json').read_text(encoding='utf-8'))
NAME = {x['id']: x['name'] for x in NAMES['names']}

def sha(b):
    return hashlib.sha256(b).hexdigest()

lines = []
def w(s=''):
    lines.append(s)

w('scan_keys_v2')
w(f'main bytes {len(MAIN)} sha256 {sha(MAIN)}')
w(f'res  bytes {len(RES)} sha256 {sha(RES)}')
w(f'names {len(NAME)} component_offset {NAMES.get("component_offset")} stride {NAMES.get("stride")}')
assert sha(MAIN) == '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
assert sha(RES) == '3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059'
assert BASE <= 0x60627ace < BASE + len(MAIN)

def u16(buf, off):
    return struct.unpack_from('<H', buf, off)[0]
def u32(buf, off):
    return struct.unpack_from('<I', buf, off)[0]
def off_of(va):
    return va - BASE

# functions.tsv -> sorted (start, end, name)
funcs = []
for line in (ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'functions.tsv').read_text(encoding='utf-8').splitlines()[1:]:
    p = line.split('\t')
    if len(p) < 3:
        continue
    a = int(p[0], 16)
    n = int(p[2])
    funcs.append((a, a + n, p[1]))
funcs.sort()
starts = [a for a, _, _ in funcs]

def func_at(va):
    import bisect
    i = bisect.bisect_right(starts, va) - 1
    if i < 0:
        return None
    a, b, name = funcs[i]
    if a <= va < b:
        return a, b, name
    return None

KEYS = [0x5b82, 0x5b52, 0xf5f1, 0xf5e1]
KEYSET = set(KEYS)

# ---- registration tables, walked until a zero key ----
TABLES = [0x60095584, 0x600b8f54, 0x600bb5ec, 0x600bda78, 0x600e4bec]
records = []  # (table, addr, key, count, width, payload_off, payload_len, next)
reg_keys = set()
w('')
w('## registration tables')
for start in TABLES:
    a = start
    n = 0
    while n < 5000:
        k = u16(MAIN, off_of(a))
        if k == 0:
            w(f'table 0x{start:08x} records {n} zero-key at 0x{a:08x}')
            break
        c = u16(MAIN, off_of(a) + 2)
        width = (k & 3) or 4
        payload = 4 + c * width
        nxt = (a + payload + 3) & ~3
        records.append((start, a, k, c, width, a + 4, c * width, nxt))
        reg_keys.add(k)
        n += 1
        a = nxt
    else:
        w(f'table 0x{start:08x} UNBOUNDED')

w(f'registered distinct keys {len(reg_keys)}')
w('')
w('## target registration records')
for start, a, k, c, width, po, plen, nxt in records:
    if k not in KEYSET:
        continue
    raw = MAIN[off_of(po):off_of(po) + plen]
    w(f'key 0x{k:04x} table 0x{start:08x} record 0x{a:08x} count {c} width {width} payload 0x{po:08x} len {plen} next 0x{nxt:08x}')
    w(f'  header bytes {MAIN[off_of(a):off_of(a)+4].hex()}')
    w(f'  payload hex {raw.hex()}')
    if width == 2:
        vals = [struct.unpack_from('<H', raw, i)[0] for i in range(0, plen, 2)]
        w(f'  u16 values {vals}')
    elif width == 1:
        w(f'  u8 values {list(raw)}')
    else:
        vals = [struct.unpack_from('<I', raw, i)[0] for i in range(0, plen, 4)]
        w(f'  u32 values {vals}')

# record spans for classification
rec_by_addr = {a: (start, k, c, width) for start, a, k, c, width, po, plen, nxt in records}

# ---- UI maps, formulas from FUN_60419446 / FUN_60419696 ----
# id in range -> (entry_va for that id)
def map_entry(sid):
    if 0 <= sid <= 0x8CF:
        return 0x6062555c + sid * 4, 'map0'
    if 0xBB8 <= sid <= 0xBE6:
        return 0x606249bc + sid * 4, 'map3000'
    if 0x2710 <= sid <= 0x2756:
        return 0x6061dd72 + sid * 4, 'map10000'
    if 0x3A98 <= sid <= 0x3C5F:
        return 0x6061906e + sid * 4, 'map15000'
    return None, None

# halfword-only ranges seen in FUN_60419446
def half_entry(sid):
    if 0xFA0 <= sid <= 0xFB6:
        return 0x60625a44 + sid * 2, 'half4000'
    if 0x1194 <= sid <= 0x11A9:
        return 0x60625630 + sid * 2, 'half4500'
    if sid == 6000:
        return 0x6062530e + sid * 2, 'half6000'
    return None, None

w('')
w('## map sanity')
# 2154 -> key 0x90a1 index 0 at 0x60627704
e, tag = map_entry(2154)
assert e == 0x60627704, hex(e)
assert u16(MAIN, off_of(e)) == 0x90a1
assert u16(MAIN, off_of(e) + 2) == 0
w(f'2154 entry 0x{e:08x} key 0x{u16(MAIN, off_of(e)):04x} index {u16(MAIN, off_of(e)+2)} tag {tag}')
e, tag = map_entry(2155)
w(f'2155 entry 0x{e:08x} key 0x{u16(MAIN, off_of(e)):04x} index {u16(MAIN, off_of(e)+2)} tag {tag}')

# enumerate every id the four maps cover, plus the halfword ranges
RANGES = [(0, 0x8D0), (3000, 47), (10000, 71), (15000, 456), (4000, 23), (4500, 22), (6000, 1)]
hits_by_key = {k: [] for k in KEYS}
w('')
w('## every map/halfword slot whose key is a target')
for start_id, count in RANGES:
    for sid in range(start_id, start_id + count):
        e, tag = map_entry(sid)
        if e is not None:
            if not (BASE <= e < BASE + len(MAIN) - 2):
                continue
            k = u16(MAIN, off_of(e))
            idx = u16(MAIN, off_of(e) + 2)
            if k in KEYSET:
                hits_by_key[k].append((sid, idx, e, tag, NAME.get(sid, '')))
        h, htag = half_entry(sid)
        if h is not None and BASE <= h < BASE + len(MAIN) - 2:
            k = u16(MAIN, off_of(h))
            if k in KEYSET:
                hits_by_key[k].append((sid, None, h, htag, NAME.get(sid, '')))

for k in KEYS:
    rows = hits_by_key[k]
    w(f'key 0x{k:04x} named slots {len(rows)}')
    for sid, idx, e, tag, name in rows:
        w(f'  id {sid} index {idx} entry 0x{e:08x} {tag} {name}')

# cursor / art-effect neighbourhood: print key+index for a window of names
w('')
w('## COLORTONE cursor and ART_EFFECT hybrid ids')
for sid, name in sorted(NAME.items()):
    if 'COLORTONE' in name and 'CURSOR' in name or 'ART_EFFECT_HYBRID' in name or name in ('MODE_ART_EFFECT', 'MODE_COLORTONE', 'MODE_COLORTONE_CURSOR'):
        e, tag = map_entry(sid)
        if e is None:
            w(f'  id {sid} {name} NOT IN FOUR MAPS')
            continue
        k = u16(MAIN, off_of(e))
        idx = u16(MAIN, off_of(e) + 2)
        mark = ' TARGET' if k in KEYSET else ''
        w(f'  id {sid} key 0x{k:04x} index {idx} entry 0x{e:08x} {name}{mark}')

# ---- instruction immediate scan ----
# MOV imm16, An 24-27; MOV imm16, Dn 2C-2F
MOV16 = set(range(0x24, 0x28)) | set(range(0x2C, 0x30))
FA_IMM = set()
for base_op in (0xC0, 0xC8, 0xD0, 0xD8, 0xE0, 0xE4, 0xE8, 0xEC):
    FA_IMM.update(range(base_op, base_op + 4))
FA_IMM.update((0xFC, 0xFD, 0xFE))
FC_IMM = set()
for base_op in (0xC0, 0xC4, 0xC8, 0xCC, 0xD0, 0xD4, 0xD8, 0xDC, 0xE0, 0xE4, 0xE8, 0xEC):
    FC_IMM.update(range(base_op, base_op + 4))
FC_IMM.add(0xFE)

# values worth collecting as immediates
WANT16 = set(KEYS)
WANT16.update({0x05B8, 0x05B5, 0x0F5F, 0x0F5E, 0x5B80, 0x5B50, 0xF5F0, 0xF5E0, 0x5B00, 0x5B50})
# also the named cursor UI ids and 2148, filled after map walk
named_ids = set()
for k, rows in hits_by_key.items():
    for sid, idx, e, tag, name in rows:
        named_ids.add(sid)
named_ids.add(2148)
WANT16.update(named_ids)

WANT32 = set(KEYS)
WANT32.update({
    0x6062555c, 0x606249bc, 0x6061dd72, 0x6061906e,
    0x6062789c, 0x606279b2, 0x60627ace, 0x60627984, 0x60627958,
    0x600e4bec, 0x60095584, 0x600b8f54, 0x600bb5ec, 0x600bda78,
})

insn_hits = []  # (va, kind, value, opcode bytes)
n = len(MAIN)
for i in range(n - 6):
    op = MAIN[i]
    if op in MOV16:
        v = u16(MAIN, i + 1)
        if v in WANT16:
            insn_hits.append((BASE + i, 'mov.imm16', v, MAIN[i:i+3].hex()))
    if op == 0xFA and MAIN[i+1] in FA_IMM:
        v = u16(MAIN, i + 2)
        if v in WANT16:
            insn_hits.append((BASE + i, 'fa.imm16', v, MAIN[i:i+4].hex()))
    if op == 0xFC and MAIN[i+1] in FC_IMM:
        v = u32(MAIN, i + 2)
        if v in WANT32 or (v & 0xFFFF) in KEYSET or (v >> 16) in KEYSET:
            insn_hits.append((BASE + i, 'fc.imm32', v, MAIN[i:i+6].hex()))

# MOV imm8 of 0x82 (opcodes 0x80, 0x85, 0x8a, 0x8f) followed within 8 bytes by OR/ADD imm16 0x5b00
MOV8 = {0x80, 0x85, 0x8A, 0x8F}
split_hits = []
for i in range(n - 8):
    if MAIN[i] in MOV8 and MAIN[i+1] == 0x82:
        window = MAIN[i+2:i+10]
        for j in range(0, 6):
            if window[j] == 0xFA and j + 3 < len(window) and window[j+1] in FA_IMM:
                v = window[j+2] | (window[j+3] << 8)
                if v in (0x5B00, 0x5B80, 0x0500):
                    split_hits.append((BASE + i, 'mov8-82 then fa', v, MAIN[i:i+10].hex()))
            if window[j] in MOV16 and j + 2 < len(window):
                v = window[j+1] | (window[j+2] << 8)
                if v in (0x5B00, 0x5B80):
                    split_hits.append((BASE + i, 'mov8-82 then mov16', v, MAIN[i:i+10].hex()))
    if MAIN[i] in MOV16:
        v = u16(MAIN, i + 1)
        if v in (0x5B00, 0x5B80, 0x05B8):
            # already recorded if in WANT16. Look ahead for OR/ADD of 0x82.
            window = MAIN[i+3:i+12]
            for j in range(len(window) - 1):
                if window[j] in MOV8 and window[j+1] == 0x82:
                    split_hits.append((BASE + i, f'mov16-0x{v:04x} then mov8-82', v, MAIN[i:i+12].hex()))
                    break
                if window[j] == 0xFA and j + 3 < len(window) and window[j+1] in range(0xE4, 0xE8):
                    imm = window[j+2] | (window[j+3] << 8)
                    if imm == 0x82 or imm == 0x02:
                        split_hits.append((BASE + i, f'mov16-0x{v:04x} then or-imm16', imm, MAIN[i:i+12].hex()))
                        break

w('')
w(f'## instruction immediates ({len(insn_hits)})')
w('patterns: mov imm16 opcodes 24-27/2C-2F; FA imm16 subops C0-C3,C8-CB,D0-D3,D8-DB,E0-EF,FC,FD,FE; FC imm32 subops C0-EF,FE')
w(f'wanted imm16: keys, slots 05b8/05b5/0f5f/0f5e, masked 5b80/5b50/f5f0/f5e0, 5b00, named UI ids {sorted(named_ids)}')
for va, kind, v, hx in insn_hits:
    f = func_at(va)
    fs = f'{f[2]} 0x{f[0]:08x}+{va-f[0]}' if f else 'not-in-function'
    w(f'  0x{va:08x} {kind} value 0x{v:x} bytes {hx} {fs}')

w('')
w(f'## split-immediate candidates ({len(split_hits)})')
for va, kind, v, hx in split_hits:
    f = func_at(va)
    fs = f'{f[2]} 0x{f[0]:08x}' if f else 'not-in-function'
    w(f'  0x{va:08x} {kind} 0x{v:x} {hx} {fs}')

# ---- every aligned u16 equal to a target key ----
w('')
w('## aligned u16 occurrences of target keys')
for k in KEYS:
    sig = struct.pack('<H', k)
    pos = 0
    addrs = []
    while True:
        p = MAIN.find(sig, pos)
        if p < 0:
            break
        if p % 2 == 0:
            addrs.append(BASE + p)
        pos = p + 1
    w(f'key 0x{k:04x} aligned hits {len(addrs)} (unaligned search is separate)')
    # classify
    map_entries = {e for sid, idx, e, tag, name in hits_by_key[k]}
    for va in addrs:
        tag = []
        if va in rec_by_addr:
            tag.append('REG-KEY')
        if va in map_entries:
            tag.append('MAP')
        nxt = u16(MAIN, off_of(va) + 2) if off_of(va) + 4 <= len(MAIN) else None
        # instruction at va-1 or va-2
        o = off_of(va)
        insn = ''
        if o >= 1 and MAIN[o-1] in MOV16:
            insn = 'MOV16'
        if o >= 2 and MAIN[o-2] == 0xFA and MAIN[o-1] in FA_IMM:
            insn = 'FA16'
        if o >= 2 and MAIN[o-2] == 0xFC and MAIN[o-1] in FC_IMM:
            insn = 'FC32-LO'
        if o >= 4 and MAIN[o-4] == 0xFC and MAIN[o-3] in FC_IMM:
            insn = 'FC32-HI'
        f = func_at(va)
        fs = f[2] if f else '-'
        # neighbour keys if this looks like a map outside the known maps
        neigh = ''
        if nxt is not None and nxt < 64 and 'MAP' not in tag and 'REG-KEY' not in tag:
            tag.append(f'idx-like-{nxt}')
        if not tag and not insn:
            tag.append('other')
        if insn:
            tag.append(insn)
        ctx = MAIN[max(0, o-4):o+8].hex()
        if tag != ['other'] or insn:
            w(f'  0x{va:08x} next {nxt} {",".join(tag)} {fs} ctx {ctx}')
    # compact other-count
    shown = 0
    other = 0
    for va in addrs:
        o = off_of(va)
        special = va in rec_by_addr or va in map_entries
        nxt = u16(MAIN, off_of(va) + 2)
        insn = (o >= 1 and MAIN[o-1] in MOV16) or (o >= 2 and MAIN[o-2] in (0xFA, 0xFC))
        if special or insn or nxt < 64:
            shown += 1
        else:
            other += 1
    w(f'  classified-or-nearby {shown} plain-other {other}')
    if other:
        plain = []
        for va in addrs:
            o = off_of(va)
            special = va in rec_by_addr or va in map_entries
            nxt = u16(MAIN, off_of(va) + 2)
            insn = (o >= 1 and MAIN[o-1] in MOV16) or (o >= 2 and MAIN[o-2] in (0xFA, 0xFC))
            if not (special or insn or nxt < 64):
                plain.append(va)
        w('  plain-other addresses ' + ' '.join(f'0x{a:08x}' for a in plain))

# repeated key: 82 5b 82 5b
w('')
w('## repeated target-key halfwords (two in a row)')
for k in KEYS:
    sig = struct.pack('<HH', k, k)
    pos = 0
    nrep = 0
    while True:
        p = MAIN.find(sig, pos)
        if p < 0:
            break
        if nrep < 20:
            w(f'  0x{k:04x} at 0x{BASE+p:08x} ctx {MAIN[p:p+8].hex()}')
        nrep += 1
        pos = p + 2
    w(f'  key 0x{k:04x} adjacent-pair count {nrep}')

# registration signature anywhere: key, count matching the walked record
w('')
w('## orphan key+count signatures outside walked records')
for k in KEYS:
    # count from the walked record
    counts = sorted({c for start, a, kk, c, width, po, plen, nxt in records if kk == k})
    w(f'key 0x{k:04x} walked counts {counts}')
    for c in counts:
        sig = struct.pack('<HH', k, c)
        pos = 0
        while True:
            p = MAIN.find(sig, pos)
            if p < 0:
                break
            va = BASE + p
            known = va in rec_by_addr
            w(f'  sig at 0x{va:08x} known-record {known} ctx {MAIN[p:p+8].hex()}')
            pos = p + 1

# u32 search for named UI ids
w('')
w('## u32 occurrences of named UI ids (and 2148, 867)')
search_ids = sorted(named_ids | {2148, 867, 897})
for sid in search_ids:
    sig = struct.pack('<I', sid)
    pos = 0
    found = []
    while True:
        p = MAIN.find(sig, pos)
        if p < 0:
            break
        found.append(BASE + p)
        pos = p + 1
    w(f'id {sid} {NAME.get(sid, "")} u32 hits {len(found)}')
    for va in found[:40]:
        f = func_at(va)
        fs = f[2] if f else '-'
        o = off_of(va)
        w(f'  0x{va:08x} {fs} ctx {MAIN[max(0,o-4):o+16].hex()}')
    if len(found) > 40:
        w(f'  ... {len(found)-40} more')

# resource: count and list key+small-index and key+count
w('')
w('## resource 0106 byte scan')
for k in KEYS:
    sig = struct.pack('<H', k)
    pos = 0
    total = 0
    interesting = []
    while True:
        p = RES.find(sig, pos)
        if p < 0:
            break
        total += 1
        if p + 4 <= len(RES):
            nxt = u16(RES, p + 2)
            if nxt < 32 or nxt in (16, 25):
                interesting.append((p, nxt))
        pos = p + 1
    w(f'key 0x{k:04x} raw hits {total} followed-by-u16<32-or-count {len(interesting)}')
    for p, nxt in interesting[:30]:
        w(f'  off 0x{p:x} next {nxt} ctx {RES[p:p+8].hex()}')

# asm / c token scan
w('')
w('## decompiled export token scan')
tokens = ['0x5b82', '0x5b52', '0xf5f1', '0xf5e1', '0x5b80', '0x5b8,', '0x05b8']
asm_path = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
c_path = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.c'
counts = {t: 0 for t in tokens}
samples = {t: [] for t in tokens}
for path in (asm_path, c_path):
    counts = {t: 0 for t in tokens}
    samples = {t: [] for t in tokens}
    with path.open('r', encoding='utf-8', errors='replace') as f:
        for nline, line in enumerate(f, 1):
            low = line.lower()
            for t in tokens:
                if t in low:
                    counts[t] += 1
                    if len(samples[t]) < 8:
                        samples[t].append(f'{nline}:{line.strip()[:160]}')
    w(f'file {path.name}')
    for t in tokens:
        w(f'  token {t} count {counts[t]}')
        for s in samples[t]:
            w(f'    {s}')

# callers of bulk / accessor functions, counts only plus a short list
w('')
w('## calls.tsv caller counts')
targets = {
    '60063380', '60063431', '600634ee', '60063a20', '60063912', '600624d3', '60062536',
    '60062d93', '60062d28', '600633ff', '600633a2', '60063684', '600619a9', '6006148f',
    '600610d2', '60063356', '60419408', '60419446', '60419696',
}
callers = {t: [] for t in targets}
calls_path = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'calls.tsv'
with calls_path.open('r', encoding='utf-8', errors='replace') as f:
    next(f)
    for line in f:
        p = line.rstrip('\n').split('\t')
        if len(p) < 3:
            continue
        t = p[2].strip()
        if t in callers:
            callers[t].append((p[0], p[1]))
for t, rows in callers.items():
    uniq = sorted(set(r[0] for r in rows))
    w(f'  target 0x{t} calls {len(rows)} from {len(uniq)} functions')
    if len(uniq) <= 24:
        w('    callers ' + ' '.join(uniq))

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'wrote {OUT} lines {len(lines)} bytes {OUT.stat().st_size}')
