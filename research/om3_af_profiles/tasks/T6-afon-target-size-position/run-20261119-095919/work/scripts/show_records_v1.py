# Compact readback of the correction runs. Does not change an experiment.
# Usage: python -I work/scripts/show_records_v1.py
import base64
import json
from pathlib import Path

OUT = Path('work/out/records-v1-summary.json')


def load_jsonl(path):
    rows = []
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def banks(path):
    doc = json.loads(Path(path).read_text(encoding='utf-8'))
    return {name: base64.b64decode(doc[name]) for name in ('M', 'E')}


def diff(a, b):
    n = max(len(a), len(b))
    return [i for i in range(n) if (a[i] if i < len(a) else None) != (b[i] if i < len(b) else None)]


def pick(row):
    actual = row.get('actual') or {}
    expected = row.get('expected') or {}
    return {
        'id': row.get('id'),
        'pass': row.get('pass'),
        'problems': row.get('problems'),
        'key': row.get('key'),
        'dir': row.get('dir'),
        'expectedTarget': expected.get('target'),
        'expectedSize': expected.get('sizeByte'),
        'expectedSource': expected.get('sizeSource'),
        'target': actual.get('target'),
        'sizeByte': actual.get('sizeByte'),
        'dfa1': actual.get('dfa1'),
        'k9a41_0': actual.get('k9a41_0'),
        'k9a41_1': actual.get('k9a41_1'),
        'mirrorSize': actual.get('mirrorSize'),
        'owner': actual.get('owner'),
        'sizeReads': actual.get('sizeReads'),
        'sizeReadsBefore': actual.get('sizeReadsBefore'),
        'counts': row.get('counts'),
    }


size = [pick(r) for r in load_jsonl('work/out/size-v1.jsonl') if str(r.get('id', '')).startswith('size-v1')]
accept = load_jsonl('work/out/accept-v1.jsonl')
keep = []
for row in accept:
    ident = str(row.get('id', ''))
    if ident.endswith('-store') or ident.endswith('-save') or 'reopen' in ident or ident in ('accept-v1-plan', 'accept-v1-done'):
        item = {
            'id': ident,
            'pass': row.get('pass'),
            'problems': row.get('problems'),
            'step': row.get('step'),
        }
        actual = row.get('actual') or {}
        expected = row.get('expected') or {}
        if 'target' in actual:
            item['target'] = actual['target']
            item['owner'] = actual.get('owner')
            item['expectedTarget'] = expected.get('target')
        if 'mDiffs' in actual:
            item['mDiffs'] = actual['mDiffs']
            item['eDiffs'] = actual['eDiffs']
            item['mSha256'] = actual.get('mSha256')
            item['eSha256'] = actual.get('eSha256')
            item['mBytes'] = actual.get('mBytes')
            item['eBytes'] = actual.get('eBytes')
        if row.get('fallback'):
            item['fallback'] = row['fallback']
        if row.get('counts'):
            item['counts'] = row['counts']
        if ident.endswith('-save'):
            item['log'] = actual.get('log')
            item['events'] = actual.get('events')
        keep.append(item)

pairs = {
    'q2': ('work/out/nvram-q2-candidate-t6.json', 'work/out/nvram-q2-k2-t6.json'),
    'accept-c1': ('work/out/nvram-accept-v1-c1.json', 'work/out/nvram-accept-v1-k2.json'),
    'accept-c2': ('work/out/nvram-accept-v1-c2.json', 'work/out/nvram-accept-v1-k2.json'),
}
stores = {}
for name, (left, right) in pairs.items():
    a = banks(left)
    b = banks(right)
    stores[name] = {
        'M': diff(a['M'], b['M']),
        'E': diff(a['E'], b['E']),
        'mBytes': [len(a['M']), len(b['M'])],
        'eBytes': [len(a['E']), len(b['E'])],
    }

summary = {'size': size, 'accept': keep, 'stores': stores}
OUT.write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
print('size', [r['id'] for r in size if r['id'] and r['id'].startswith('size-v1-e')])
print('q2 M', len(stores['q2']['M']), 'E', len(stores['q2']['E']))
print('c1 M', len(stores['accept-c1']['M']), 'E', len(stores['accept-c1']['E']))
print('c2 M', len(stores['accept-c2']['M']), 'E', len(stores['accept-c2']['E']))
