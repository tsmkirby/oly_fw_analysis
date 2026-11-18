# Extend every mov 0x5b8 candidate past its first use, and replace
# unaligned-byte / no-coverage exclusions with a per-row status.
import bisect
import collections
import re
import struct
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
ASM = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'all-functions.asm'
FUNCS = ROOT / 'ref' / 'analysis' / 'decompiled-main' / 'functions.tsv'
OLD = ROOT / 'work' / 'out' / 'candidates-5b82-v3.tsv'
OUT = ROOT / 'work' / 'out' / 'close-5b82-v4.txt'
TSV = ROOT / 'work' / 'out' / 'candidates-5b82-v4.tsv'

SOL_MOV = [
    0x6007f39b, 0x604df354, 0x608f8614, 0x60cc0c5a, 0x60cebcac, 0x60d68d49,
    0x60d68d56, 0x61102019, 0x6118bf47, 0x6118c058, 0x6118c10e, 0x61195d1d,
    0x61195d7f, 0x61195dc1, 0x61195e4e, 0x61195ec2, 0x61195ee7, 0x61195f36,
    0x61195fc3, 0x611fcdcc, 0x61206ef6, 0x612072f3, 0x6128c262, 0x6128c9c0,
    0x612c37f0, 0x616cd897, 0x616cf1d0, 0x616ddb03, 0x616e369a,
]
UNALIGNED = [0x60539e07, 0x607c8e19, 0x607e2ef9]
ADDR_ROWS = [0x60e29138, 0x615fbdb0, 0x615b9d55, 0x615b9d91]
SETTERS = {0x60063431, 0x60063567, 0x60063962, 0x60063116, 0x6041937f}
UI_MAP = 0x60419315
REG = r'(?:D[0-3]|A[0-3])'
BRA = re.compile(r'^(bra|jmp) 0x([0-9a-fA-F]+)$')
COND = re.compile(r'^(beq|bne|bcc|bcs|bhi|bls|bgt|bge|blt|ble|bvc|bvs|bge|blt) 0x([0-9a-fA-F]+)$')
CALL = re.compile(r'^call 0x([0-9a-fA-F]+)(?:,\[([^\]]*)\])?')
MEM = re.compile(r'\((?:(-?0x[0-9a-fA-F]+|-?\d+),)?(D[0-3]|A[0-3]|sp)\)')
MOV = re.compile(r'^(mov|movhu|movbu)\s+(.+),((?:D[0-3]|A[0-3])|\([^)]+\))$')
ALU = re.compile(r'^(add|addc|sub|subc|or|and|xor|asl|asr|lsr)\s+(.+),(%s)$' % REG)
UNARY = re.compile(r'^(exthu|extbu|inc|dec|clr)\s+(%s)$' % REG)


def off(va):
    return va - BASE


def u16(va):
    return struct.unpack_from('<H', MAIN, off(va))[0]


def u32(va):
    return struct.unpack_from('<I', MAIN, off(va))[0]


def hx(va, n):
    b = MAIN[off(va):off(va) + n]
    return b.hex()


log = []


def w(s=''):
    log.append(s)


ranges = []
for line in FUNCS.read_text(encoding='utf-8').splitlines()[1:]:
    p = line.split('\t')
    if len(p) < 3:
        continue
    a = int(p[0], 16)
    n = int(p[2])
    ranges.append((a, a + n, p[1]))
ranges.sort()
fstarts = [a for a, _, _ in ranges]


def func_of(va):
    i = bisect.bisect_right(fstarts, va) - 1
    if i < 0:
        return None
    a, b, name = ranges[i]
    if a <= va < b:
        return a, b, name
    return None


def gap_of(va):
    i = bisect.bisect_right(fstarts, va)
    prev = ranges[i - 1] if i else None
    nxt = ranges[i] if i < len(ranges) else None
    return prev, nxt


keep = []
for site in SOL_MOV + UNALIGNED:
    hit = func_of(site)
    if hit:
        keep.append((hit[0], hit[1]))
keep.sort()
merged = []
for lo, hi in keep:
    if merged and lo <= merged[-1][1]:
        merged[-1] = (merged[-1][0], max(merged[-1][1], hi))
    else:
        merged.append((lo, hi))


def in_merged(va, spans):
    i = bisect.bisect_right(spans, (va, 10 ** 12)) - 1
    return i >= 0 and spans[i][0] <= va < spans[i][1]


print('pass 1', flush=True)
ins = {}
n_bad = 0
n_ins = 0
pending_callees = set()
with ASM.open('r', encoding='utf-8', errors='replace') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        try:
            va = int(parts[0], 16)
        except ValueError:
            continue
        raw = parts[1].strip().lower()
        if not raw or any(c not in '0123456789abcdef' for c in raw):
            continue
        nb = len(raw) // 2
        if MAIN[off(va):off(va) + nb].hex() != raw:
            n_bad += 1
            continue
        n_ins += 1
        if not in_merged(va, merged):
            continue
        mnem = parts[2].strip()
        ins[va] = (nb, mnem, raw)
        m = CALL.match(mnem)
        if m:
            pending_callees.add(int(m.group(1), 16))

# drop callees already kept, and huge ones (body > 20000)
callee_spans = []
for tgt in sorted(pending_callees):
    hit = func_of(tgt)
    if not hit:
        continue
    if hit[1] - hit[0] > 20000:
        continue
    if in_merged(tgt, merged):
        continue
    callee_spans.append((hit[0], hit[1]))
callee_spans.sort()
cmerged = []
for lo, hi in callee_spans:
    if cmerged and lo <= cmerged[-1][1]:
        cmerged[-1] = (cmerged[-1][0], max(cmerged[-1][1], hi))
    else:
        cmerged.append((lo, hi))

print('pass 2 callees', len(cmerged), flush=True)
if cmerged:
    with ASM.open('r', encoding='utf-8', errors='replace') as f:
        for line in f:
            parts = line.rstrip('\n').split('\t')
            if len(parts) < 3:
                continue
            try:
                va = int(parts[0], 16)
            except ValueError:
                continue
            if not in_merged(va, cmerged):
                continue
            raw = parts[1].strip().lower()
            if not raw or any(c not in '0123456789abcdef' for c in raw):
                continue
            nb = len(raw) // 2
            if MAIN[off(va):off(va) + nb].hex() != raw:
                n_bad += 1
                continue
            ins[va] = (nb, parts[2].strip(), raw)

print('kept', len(ins), 'mismatches', n_bad, flush=True)
w('instructions kept %d mismatches %d' % (len(ins), n_bad))

# successor index
by_va = sorted(ins)
succ = {}
for va in by_va:
    nb, mnem, raw = ins[va]
    nxt = va + nb
    m = BRA.match(mnem)
    c = COND.match(mnem)
    if mnem.startswith('ret'):
        succ[va] = []
    elif m:
        succ[va] = [int(m.group(2), 16)]
    elif c:
        succ[va] = [int(c.group(2), 16), nxt]
    else:
        succ[va] = [nxt]


def slot_of(text):
    m = re.fullmatch(r'\((0x[0-9a-fA-F]+|\d+),sp\)', text)
    if not m:
        return None
    return int(m.group(1), 16)


def reg_of(text):
    return text if re.fullmatch(REG, text) else None


def mem_bases(text):
    return [(int(a, 16) if a else 0, b) for a, b in MEM.findall(text)]


def classify_insn(mnem):
    """Return (dest_loc or None, reads_old_dest, sources, address_regs, call or None)."""
    cm = CALL.match(mnem)
    if cm:
        saved = set()
        if cm.group(2):
            saved = set(x.strip().upper() for x in cm.group(2).split(',') if x.strip())
        return None, False, [], [], (int(cm.group(1), 16), saved)
    if mnem.startswith('ret'):
        return None, False, [], [], ('ret', set())
    um = UNARY.match(mnem)
    if um:
        dest = um.group(2)
        reads = um.group(1) != 'clr'
        return dest, reads, [], [], None
    mm = MOV.match(mnem)
    if mm:
        src, dest = mm.group(2).strip(), mm.group(3).strip()
        dloc = reg_of(dest)
        if dloc is None:
            s = slot_of(dest)
            dloc = ('slot', s) if s is not None else ('mem', dest)
        sources = []
        sr = reg_of(src)
        if sr:
            sources.append(sr)
        ss = slot_of(src)
        if ss is not None:
            sources.append(('slot', ss))
        aregs = [b for _, b in mem_bases(src) if b != 'sp']
        return dloc, False, sources, aregs, None
    am = ALU.match(mnem)
    if am:
        src, dest = am.group(2).strip(), am.group(3)
        sources = []
        sr = reg_of(src)
        if sr:
            sources.append(sr)
        aregs = [b for _, b in mem_bases(src) if b != 'sp']
        return dest, True, sources, aregs, None
    # generic: address uses, no dest we understand
    aregs = [b for _, b in mem_bases(mnem) if b != 'sp']
    # unknown op with a trailing register destination, e.g. udfu01 0xf4240,D0
    m = re.search(r',\s*(D[0-3]|A[0-3])\s*$', mnem)
    if m:
        return m.group(1), True, [], aregs, None
    return None, False, [], aregs, None


def formula_step(old, mnem, src_text):
    head = mnem.split()[0]
    if head in ('exthu', 'extbu', 'inc', 'dec'):
        return ('same', old)
    if head in ('add', 'addc', 'sub', 'or', 'and', 'xor', 'asl', 'asr', 'lsr') or head.startswith('udf'):
        return ('der', head, src_text, old)
    return ('der', head, src_text, old)


def trace_site(site):
    nb, mnem, raw = ins[site]
    mm = MOV.match(mnem)
    if not mm:
        return 'UNRESOLVED', 'mov not parsed: %s' % mnem
    dest = reg_of(mm.group(3).strip())
    if dest is None:
        return 'UNRESOLVED', 'mov destination is not a register: %s' % mnem
    # state items: loc -> formula. loc is reg str or ('slot', n)
    start_state = {dest: ('imm', 0x5B8)}
    # BFS
    # each item: (va, state, chain, terminals-so-far-for-this-path)
    # We collect terminals. A path ends when no tracked locs remain, a setter is hit,
    # or the step budget runs out.
    found = []
    seen = set()
    queue = [(site + nb, start_state, [], 0)]
    steps = 0
    while queue and steps < 400 and len(found) < 8:
        va, state, chain, depth = queue.pop(0)
        steps += 1
        if not state:
            found.append(('dead', chain))
            continue
        if depth > 60:
            found.append(('depth', chain))
            continue
        key = (va, tuple(sorted((str(k), repr(v)) for k, v in state.items())))
        if key in seen:
            continue
        seen.add(key)
        if va not in ins:
            found.append(('gap', chain + [(va, 'gap', '')]))
            continue
        nb2, m2, raw2 = ins[va]
        dest_loc, reads_old, sources, aregs, call = classify_insn(m2)
        # address use of a tracked register
        used_addr = [r for r in aregs if r in state]
        new_state = dict(state)
        extra = []
        if used_addr:
            extra.append('addr ' + ','.join('%s=%s' % (r, state[r]) for r in used_addr))
        if call:
            tgt, saved = call
            if tgt == 'ret':
                live = {k: v for k, v in state.items() if k == 'D0'}
                if live:
                    found.append(('return', chain + [(va, raw2, m2)]))
                else:
                    found.append(('dead-at-ret', chain + [(va, raw2, m2)]))
                continue
            passed = []
            for reg, form in state.items():
                if not isinstance(reg, str):
                    continue
                if reg.lower() in saved or reg.upper() in saved:
                    continue
                if reg in ('D0', 'D1', 'A0', 'A1'):
                    passed.append((reg, form))
            # clobber caller-saved regs that are not preserved
            for reg in ('D0', 'D1', 'A0', 'A1'):
                if reg.lower() not in saved and reg.upper() not in saved:
                    new_state.pop(reg, None)
            chain2 = chain + [(va, raw2, m2 + ((' pass ' + str(passed)) if passed else ''))]
            if tgt in SETTERS and any(r == 'D0' for r, _ in passed):
                found.append(('setter', chain2))
                continue
            if tgt == UI_MAP and any(r == 'D0' for r, _ in passed):
                found.append(('ui-id', chain2))
                continue
            # follow callee for each passed reg, and also continue in the caller
            if passed:
                hit = func_of(tgt)
                if hit and hit[0] in ins or tgt in ins:
                    entry = hit[0] if hit else tgt
                    if entry in ins:
                        sub = {}
                        for reg, form in passed:
                            sub[reg] = form
                        queue.append((entry, sub, chain2 + [(entry, 'enter', hex(tgt))], depth + 1))
                    else:
                        found.append(('callee-missing', chain2))
                else:
                    found.append(('callee-missing', chain2))
            queue.append((va + nb2, new_state, chain2, depth + 1))
            continue
        # dataflow update
        chain2 = chain + [(va, raw2, m2)]
        if dest_loc is not None and dest_loc in new_state and not reads_old:
            # overwritten from sources
            if sources:
                # copy from a tracked source?
                copied = None
                for s in sources:
                    if s in new_state:
                        copied = new_state[s]
                        break
                if copied is not None:
                    new_state[dest_loc] = copied
                else:
                    new_state.pop(dest_loc, None)
            else:
                new_state.pop(dest_loc, None)
        elif dest_loc is not None and reads_old and dest_loc in new_state:
            src_text = m2.split(' ', 1)[1] if ' ' in m2 else ''
            new_state[dest_loc] = formula_step(new_state[dest_loc], m2, src_text)
        elif dest_loc is not None and dest_loc not in new_state:
            copied = None
            for s in sources:
                if s in new_state:
                    copied = new_state[s]
                    break
            if copied is not None:
                new_state[dest_loc] = copied
        # a mov to memory that is not a stack slot drops that source if dest is ('mem', ...)
        if isinstance(dest_loc, tuple) and dest_loc[0] == 'mem':
            for s in sources:
                if s in new_state and s != dest_loc:
                    # value escaped to memory
                    found.append(('stored', chain2))
                    new_state.pop(s, None)
        if used_addr and not any(isinstance(k, str) and k in used_addr and k in new_state for k in list(new_state)):
            pass
        if not new_state:
            # value died. If we saw an address use on this insn or earlier, say so.
            kind = 'consumed'
            if used_addr:
                kind = 'address'
            found.append((kind, chain2))
            continue
        queue.append((succ[va][0] if succ.get(va) else va + nb2, new_state, chain2, depth + 1))
        if succ.get(va) and len(succ[va]) > 1:
            for extra_va in succ[va][1:]:
                queue.append((extra_va, dict(new_state), chain2, depth + 1))
    if not found:
        found.append(('no-terminal', []))
    return found


def summarise(found):
    kinds = [k for k, _ in found]
    bad = [k for k in kinds if k in ('setter', 'gap', 'depth', 'callee-missing', 'stored', 'return', 'no-terminal')]
    if 'setter' in kinds:
        return 'UNRESOLVED', 'a path passes the value to a settings setter'
    if bad:
        return 'UNRESOLVED', 'path ends without a demonstrated non-key consumer: ' + ','.join(kinds)
    if all(k in ('address', 'consumed', 'dead', 'dead-at-ret', 'ui-id') for k in kinds):
        return 'not a key', 'terminal ' + ','.join(kinds)
    return 'UNRESOLVED', 'unclassified ' + ','.join(kinds)


w('== extended mov 0x5b8 traces ==')
mov_result = {}
for site in SOL_MOV:
    if site not in ins:
        w('MISSING 0x%08x' % site)
        mov_result[site] = ('UNRESOLVED', 'instruction not in the kept listing', [])
        continue
    found = trace_site(site)
    if isinstance(found, tuple):
        status, why = found
        chains = []
    else:
        status, why = summarise(found)
        chains = found
    mov_result[site] = (status, why, chains)
    nb, mnem, raw = ins[site]
    w('0x%08x %s %s -> %s (%s)' % (site, raw, mnem, status, why))
    for kind, chain in chains:
        w('  path %s' % kind)
        for va, raw2, m2 in chain[:18]:
            w('    0x%08x %s %s' % (va, raw2, m2))
        if len(chain) > 18:
            w('    ... %d more' % (len(chain) - 18))
w()

# UI map for 0x5b8, re-read
slot = 0x6062555c + 0x5B8 * 4
w('UI-map dword for UI id 0x5b8 at 0x%08x bytes %s' % (slot, hx(slot, 4)))
w('  key 0x%04x index %d' % (u16(slot), u16(slot + 2)))
w()

# ---- unaligned / address-constant rows ----
w('== unaligned and address-constant rows ==')
row_extra = {}


def pointer_run(va):
    """If va is 4-aligned and holds a plausible pointer, measure the run of such dwords."""
    if va % 4 != 0:
        return None
    v = u32(va)
    if not (0x60000000 <= v < 0x63000000):
        return None
    lo = va
    while lo - 4 >= BASE and 0x60000000 <= u32(lo - 4) < 0x63000000:
        lo -= 4
        if va - lo > 256:
            break
    hi = va + 4
    end = BASE + len(MAIN)
    while hi + 4 <= end and 0x60000000 <= u32(hi) < 0x63000000:
        hi += 4
        if hi - va > 256:
            break
    return lo, hi, v


for va in UNALIGNED + ADDR_ROWS:
    prev, nxt = gap_of(va)
    aligned = va & ~1
    w('0x%08x prev %s end 0x%08x next %s at 0x%08x' % (
        va,
        prev[2] if prev else '-', prev[1] if prev else 0,
        nxt[2] if nxt else '-', nxt[0] if nxt else 0))
    w('  window %s' % hx(va - 16, 48))
    w('  aligned u16 at 0x%08x = 0x%04x  u16 at hit = 0x%04x' % (aligned, u16(aligned), u16(va) if va % 2 == 0 else -1))
    # containing dword
    dw = va & ~3
    w('  dword at 0x%08x = 0x%08x bytes %s' % (dw, u32(dw), hx(dw, 4)))
    run = pointer_run(dw)
    if run:
        lo, hi, v = run
        w('  pointer run 0x%08x..0x%08x (%d bytes) this dword 0x%08x' % (lo, hi, hi - lo, v))
        row_extra[va] = ('address-constant', lo, hi, dw, v)
    else:
        gs = prev[1] if prev else va
        ge = nxt[0] if nxt else va
        row_extra[va] = ('unresolved-data', gs, ge, dw, u32(dw))
        w('  no pointer run at the containing dword')
    # exact dword pointers to the byte or the containing dword
    sigs = []
    for target in (va, dw):
        sig = struct.pack('<I', target)
        s = 0
        n = 0
        while n < 4:
            i = MAIN.find(sig, s)
            if i < 0:
                break
            sigs.append((target, BASE + i))
            s = i + 4
            n += 1
    w('  image dwords pointing here: %s' % (
        ' '.join('0x%08x->0x%08x' % (p, t) for t, p in sigs) or 'none'))
w()

# ---- v4 table ----
def evidence_mov(site):
    status, why, chains = mov_result[site]
    bits = []
    for kind, chain in chains[:3]:
        steps = []
        for va, raw2, m2 in chain[:8]:
            steps.append('0x%08x %s' % (va, m2))
        bits.append(kind + ': ' + ' | '.join(steps))
    text = '%s. %s' % (why, ' || '.join(bits))
    return status, text


rows_out = []
header = OLD.read_text(encoding='utf-8').splitlines()[0]
# v3 header already ends with v3; add v4
if not header.endswith('v4'):
    header = header + '\tv4'
rows_out.append(header)
n_un = 0
n_mov = 0
for line in OLD.read_text(encoding='utf-8').splitlines()[1:]:
    if not line.strip():
        continue
    p = line.split('\t')
    while len(p) < 7:
        p.append('')
    addr = int(p[0], 16)
    v4 = 'carried'
    if addr in mov_result:
        status, text = evidence_mov(addr)
        p[3] = status if status != 'not a key' else 'not a key'
        p[4] = 'cf-v4'
        p[5] = text
        v4 = status
        n_mov += 1
        if status == 'UNRESOLVED':
            n_un += 1
    elif addr in row_extra:
        kind, lo, hi, dw, val = row_extra[addr]
        if kind == 'address-constant':
            p[3] = 'not a key'
            p[4] = 'ptr-v4'
            p[5] = (
                'bytes sit in the dword at 0x%08x value 0x%08x (%s). '
                'That dword is inside a run of image pointers 0x%08x..0x%08x (%d bytes). '
                'The 82 5b bytes are part of the pointer, not a standalone key halfword.'
                % (dw, val, hx(dw, 4), lo, hi, hi - lo)
            )
            v4 = 'not a key'
        else:
            p[3] = 'UNRESOLVED'
            p[4] = 'data-v4'
            p[5] = (
                'UNRESOLVED data. The earlier unaligned-byte / no-coverage exclusion is withdrawn. '
                'Gap 0x%08x..0x%08x. Window %s. Containing dword at 0x%08x is 0x%08x. '
                'No image dword equals this address. Structure not identified, so the byte is not excluded.'
                % (lo, hi, hx(addr - 8, 24), dw, val)
            )
            v4 = 'UNRESOLVED'
            n_un += 1
    p[6] = v4
    rows_out.append('\t'.join(p[:7]))

# count unresolved in the full table
n_un_all = sum(1 for r in rows_out[1:] if '\tUNRESOLVED\t' in r)
w('mov rows %d' % n_mov)
w('UNRESOLVED rows in v4 %d' % n_un_all)
w()

OUT.write_text('\n'.join(log) + '\n', encoding='utf-8')
TSV.write_text('\n'.join(rows_out) + '\n', encoding='utf-8')
print('wrote', OUT)
print('rows', len(rows_out) - 1, 'UNRESOLVED', n_un_all)
print('DONE')
