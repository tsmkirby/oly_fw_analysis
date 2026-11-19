# Facts taken from the watch summary and the flash listings. Read-only.
import hashlib
import json
import pathlib

base = 0x60021020
image = pathlib.Path('inputs/00_0100_50000020.decoded.bin').read_bytes()
summary = json.loads(pathlib.Path('work/out/watch-b1-hits.json').read_text(encoding='utf-8'))
print('counts', json.dumps(summary['counts'], sort_keys=True))
print('stored', summary['stored'], 'dropped', summary['dropped'])
print('firsts')
for row in summary['firsts']:
    extra = {k: row[k] for k in row if k not in ('id', 'pc', 'insns', 'caller', 'labNs')}
    print(' ', row['id'], row['pc'], 'caller', row['caller'], 'insns', row['insns'], extra)

print('invocations', len(summary['invocations']))
by_caller = {}
for inv in summary['invocations']:
    by_caller.setdefault(inv['caller'], []).append(inv['maxIndex'])
for caller, indexes in by_caller.items():
    print(' caller', caller, 'n', len(indexes), 'max', max(indexes), 'ge151', sum(1 for i in indexes if i >= 151), 'ge152', sum(1 for i in indexes if i >= 152))
passed = [inv for inv in summary['invocations'] if inv['passed151']]
print('passed151', len(passed))
for inv in passed:
    print(' ', inv['id'], 'caller', inv['caller'], 'max', inv['maxIndex'], 'samples', inv['samples'], 'insns', inv['insns'])

ids = {}
for row in summary['pageIds']:
    ids[row['pageId']] = ids.get(row['pageId'], 0) + 1
print('pageIds', ids)

# directory pointer recorded on the first dir hit
for row in summary['firsts']:
    if row['id'] == 'dir':
        print('dir4', row.get('dir4'), hex(row.get('dir4', 0)), 'count', row.get('count'), 'dir0', row.get('dir0'))
        print('array', hex(0x615c540c))

# second bucket write from the jsonl
for line in pathlib.Path('work/out/watch-b1.jsonl').read_text(encoding='utf-8').splitlines():
    if '"id":"bucket"' in line or '"id": "bucket"' in line:
        rec = json.loads(line)
        if rec.get('kind') == 'hit':
            print('bucket', rec['n'], 'pc', hex(rec['pc']), 'value', hex(rec['value']), 'caller', hex(rec['caller']))

off = 0x61203690 - base
print('bytes at 0x61203690', image[off:off + 24].hex())
b1 = pathlib.Path('work/scripts/T4bListB1.java').read_bytes()
print('B1 sha256', hashlib.sha256(b1).hexdigest(), 'bytes', len(b1))

high = 0
high_callers = {}
dup_lines = 0
past_lines = 0
walk2 = 0
walk3 = 0
dir_pcs = {}
for line in pathlib.Path('work/out/watch-b1.jsonl').read_text(encoding='utf-8').splitlines():
    if '"id":"idx-walk-1"' in line and '"index":' in line:
        rec = json.loads(line)
        if rec.get('kind') == 'hit' and rec.get('index', 0) >= 151:
            high += 1
            high_callers[rec['caller']] = high_callers.get(rec['caller'], 0) + 1
    if '"kind":"hit"' not in line:
        continue
    if '"id":"dup"' in line or '"id":"dup-uncached"' in line:
        dup_lines += 1
    if '"id":"past151"' in line:
        past_lines += 1
    if '"id":"walk-2"' in line or '"id":"idx-walk-2"' in line:
        walk2 += 1
    if '"id":"walk-3"' in line or '"id":"idx-walk-3"' in line:
        walk3 += 1
    if '"id":"dir"' in line and '"id":"dir-uncached"' not in line:
        rec2 = json.loads(line)
        if rec2.get('kind') == 'hit':
            pc = hex(rec2['pc'])
            dir_pcs[pc] = dir_pcs.get(pc, 0) + 1
print('idx>=151', high, 'callers', {hex(k): v for k, v in high_callers.items()})
print('jsonl hits dup', dup_lines, 'past151', past_lines, 'walk-2', walk2, 'walk-3', walk3)
print('dir pcs', dir_pcs)

# listing bounds
root = pathlib.Path('work/out/listings')
trunc = []
rets = []
for path in sorted(root.glob('d0-flash-*.txt')):
    lines = [ln for ln in path.read_text(encoding='utf-8').splitlines() if ln and not ln.startswith('#')]
    last = lines[-1] if lines else ''
    trunc.append((path.name, 'TRUNCATED' in last or any(ln.startswith('TRUNCATED') for ln in lines), last[:80]))
print('flash roots')
for name, bad, last in trunc:
    print(' ', name, 'truncated' if bad else 'complete', last)

# A checksum of copied bytes loads a byte or word and adds it into another register.
print('checksum-shaped')
import re
load_re = re.compile(r'^(movbu|movhu|mov) \([^)]+\),(D[0-3])$')
for path in sorted(root.glob('*.txt')):
    text = path.read_text(encoding='utf-8')
    if 'TRUNCATED' in text:
        print(' truncated', path.name)
    body = []
    for ln in text.splitlines():
        if not ln or ln.startswith('#') or ln.startswith('TRUNCATED'):
            continue
        parts = ln.split('\t')
        if len(parts) < 3:
            continue
        body.append((int(parts[0], 16), parts[2]))
    hits = []
    for i, (addr, mnem) in enumerate(body):
        m = load_re.match(mnem)
        if not m:
            continue
        reg = m.group(2)
        for addr2, mnem2 in body[i + 1:i + 6]:
            if mnem2.startswith('add ' + reg + ',') or mnem2.startswith('addc ' + reg + ','):
                hits.append(f'{addr:#x} {mnem} -> {addr2:#x} {mnem2}')
                break
    if hits:
        print(' ', path.name, len(hits))
        for h in hits[:6]:
            print('   ', h)
