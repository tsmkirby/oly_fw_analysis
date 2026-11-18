# Static map of Z, the central-edge overlay, and the ten-byte target producer.
# Reads the decoded main image and the two CSVs. Writes JSON under work/out.
# Does not modify an image. EMULATOR-ONLY research. No firmware image.
import csv
import hashlib
import json
from pathlib import Path

BASE = 0x60021020
ROOT = Path('.')
STOCK_PATH = ROOT / 'inputs/00_0100_50000020.decoded.bin'
Z_PATH = ROOT / 'ref/tasks/T3j-afon-acceptance-assertions/run-20261118-132500/work/out/overlay-changed-bytes.csv'
Z_PROMOTED = ROOT / 'ref/analysis/button-af/readiness/t3-afon-zone-row/t3j/overlay-changed-bytes.csv'
EDGE_PATH = ROOT / 'ref/analysis/button-af/readiness/om-emu-af-native1/central-edge-v2.csv'
OUT = ROOT / 'work/out/static-overlay-k1.json'

STOCK_SHA = '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'

# Immediates the home builder and the reconcile are known to use.
NEEDLES = {
    'key_9fa1': bytes.fromhex('a19f0000'),
    'key_99d2': bytes.fromhex('d2990000'),
    'key_dfa1': bytes.fromhex('a1df0000'),
    'key_1e01': bytes.fromhex('011e0000'),
    'key_1db1': bytes.fromhex('b11d0000'),
    'key_1dc1': bytes.fromhex('c11d0000'),
    'key_0e91': bytes.fromhex('910e0000'),
    'state_uncached': bytes.fromhex('20e931a0'),
    'state_cached': bytes.fromhex('20e93160'),
    'converter': bytes.fromhex('cd3eb960'),  # not a reliable encoding; also scan abs
    'getter': (0x60063380).to_bytes(4, 'little'),
    'converter_abs': (0x609b3ecd).to_bytes(4, 'little'),
    'target_cache': (0xA33CA384).to_bytes(4, 'little'),
}


def load_csv(path):
    rows = []
    with path.open(newline='') as f:
        for rec in csv.DictReader(f):
            off = int(rec['component_offset'], 16)
            rows.append({
                'offset': off,
                'address': int(rec['runtime_address'], 16),
                'stock': int(rec['stock_byte'], 16),
                'new': int(rec['proposed_byte'], 16),
                'purpose': rec.get('purpose') or rec.get('reason') or '',
            })
    return rows


def apply_rows(image, rows):
    out = bytearray(image)
    for rec in rows:
        if out[rec['offset']] != rec['stock']:
            raise SystemExit(f"stock mismatch at {rec['address']:08x}")
        out[rec['offset']] = rec['new']
    return out


def ranges(addrs):
    if not addrs:
        return []
    ordered = sorted(addrs)
    start = prev = ordered[0]
    out = []
    for a in ordered[1:]:
        if a == prev + 1:
            prev = a
            continue
        out.append({'lo': f'{start:08x}', 'hi': f'{prev:08x}', 'count': prev - start + 1})
        start = prev = a
    out.append({'lo': f'{start:08x}', 'hi': f'{prev:08x}', 'count': prev - start + 1})
    return out


def find_all(blob, needle, base_off):
    hits = []
    start = 0
    while True:
        i = blob.find(needle, start)
        if i < 0:
            break
        hits.append(base_off + i)
        start = i + 1
    return hits


def main():
    stock = STOCK_PATH.read_bytes()
    digest = hashlib.sha256(stock).hexdigest()
    if digest != STOCK_SHA:
        raise SystemExit('stock sha mismatch ' + digest)
    z_rows = load_csv(Z_PATH)
    z_promoted = Z_PROMOTED.read_bytes()
    z_task = Z_PATH.read_bytes()
    edge_rows = load_csv(EDGE_PATH)
    z_by = {r['address']: r for r in z_rows}
    e_by = {r['address']: r for r in edge_rows}
    both = sorted(set(z_by) & set(e_by))
    conflicts = []
    same = []
    for addr in both:
        z, e = z_by[addr], e_by[addr]
        row = {
            'address': f'{addr:08x}',
            'z': f"{z['new']:02x}",
            'central': f"{e['new']:02x}",
            'z_purpose': z['purpose'],
            'central_purpose': e['purpose'],
        }
        if z['new'] == e['new']:
            same.append(row)
        else:
            conflicts.append(row)
    only_z = sorted(set(z_by) - set(e_by))
    only_e = sorted(set(e_by) - set(z_by))
    image = apply_rows(stock, edge_rows)
    # Confirm Z bytes are still FF in stock where Z writes them.
    z_not_ff = [f"{r['address']:08x}" for r in z_rows if stock[r['offset']] != 0xFF]
    needles = {}
    # Search the central-edge changed span only, plus the converter in stock.
    edge_lo = min(r['offset'] for r in edge_rows)
    edge_hi = max(r['offset'] for r in edge_rows)
    span = bytes(image[edge_lo:edge_hi + 1])
    for name, needle in NEEDLES.items():
        hits = find_all(span, needle, BASE + edge_lo)
        needles[name] = [f'{h:08x}' for h in hits]
    # State-base immediates: any little-endian address in [0xa031e920, 0xa031e960).
    state_hits = []
    for i in range(len(span) - 3):
        word = int.from_bytes(span[i:i + 4], 'little')
        if 0xA031E920 <= word < 0xA031E980 or 0x6031E920 <= word < 0x6031E980:
            state_hits.append({
                'at': f'{BASE + edge_lo + i:08x}',
                'word': f'{word:08x}',
                'opcode': f'{span[i - 2]:02x}{span[i - 1]:02x}' if i >= 2 else None,
            })
    # Jump table of the stock converter. Type n -> pointer at 0x60a7da08 + 4*n.
    table_addr = 0x60A7DA08
    table = []
    for n in range(11):
        off = table_addr - BASE + 4 * n
        ptr = int.from_bytes(stock[off:off + 4], 'little')
        entry = {'type': n, 'pointer': f'{ptr:08x}', 'bytes': None, 'head': None}
        if BASE <= ptr < BASE + len(stock):
            raw = stock[ptr - BASE:ptr - BASE + 8]
            entry['bytes'] = raw.hex()
        table.append(entry)
    # Home builder window and ensure window, hex, for the listing check.
    windows = {}
    for name, addr, length in (
        ('home_builder', 0x60A8F6BB, 282),
        ('reconcile', 0x60A8F2AC, 926),
        ('ensure', 0x6031EAD0, 176),
        ('stub', 0x6031EB80, 287),
        ('callsite', 0x610BF5E2, 7),
        ('converter', 0x609B3ECD, 270),
        ('jump_table', 0x60A7DA08, 44),
    ):
        off = addr - BASE
        raw = bytes(image[off:off + length])
        windows[name] = {
            'address': f'{addr:08x}',
            'length': length,
            'sha256': hashlib.sha256(raw).hexdigest(),
            'hex': raw.hex(),
        }
    # Z address extent and whether the stub/ensure/section-4 code sit inside it.
    z_addrs = sorted(z_by)
    report = {
        'stock_sha256': digest,
        'z_task_sha256': hashlib.sha256(z_task).hexdigest(),
        'z_promoted_sha256': hashlib.sha256(z_promoted).hexdigest(),
        'z_promoted_matches_task': z_promoted == z_task,
        'z_bytes': len(z_rows),
        'central_bytes': len(edge_rows),
        'z_not_ff_in_stock': z_not_ff,
        'overlap_addresses': len(both),
        'overlap_same_value': len(same),
        'overlap_conflict': len(conflicts),
        'conflicts': conflicts,
        'same_value_overlap': same,
        'only_z_ranges': ranges(only_z),
        'only_central_ranges': ranges(only_e),
        'z_ranges': ranges(z_addrs),
        'central_ranges': ranges(e_by),
        'needles_in_central_image': needles,
        'state_immediates': state_hits,
        'converter_jump_table': table,
        'windows': {k: {kk: vv for kk, vv in v.items() if kk != 'hex'} | {'hex_bytes': len(v['hex']) // 2} for k, v in windows.items()},
    }
    # Full windows go to a sidecar so the summary stays readable.
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'work/out/static-windows-k1.json').write_text(json.dumps(windows) + '\n', encoding='utf-8')
    print('z', len(z_rows), 'central', len(edge_rows))
    print('overlap', len(both), 'conflict', len(conflicts), 'same', len(same))
    print('z matches promoted', z_promoted == z_task)
    print('conflict lo/hi', conflicts[0]['address'] if conflicts else None, conflicts[-1]['address'] if conflicts else None)
    print('state immediates', len(state_hits))
    for name, hits in needles.items():
        print(f'needle {name} {len(hits)} {hits[:8]}')
    for row in table:
        print('type', row['type'], row['pointer'], row['bytes'])


if __name__ == '__main__':
    main()
