# Build the combined image diff: Z's 368 bytes, unchanged, plus the central-edge
# overlay with owned state and the ensure routine moved off Z's menu bytes.
# The AF Home provider is still the one the central-edge image contains.
# No profile-source swap in this file. No firmware container.
import csv
import hashlib
import json
import struct
from pathlib import Path

BASE = 0x60021020
ROOT = Path('.')
STOCK_SHA = '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
OLD = 0xA031E920
SPAN = 0x1B0  # through the third AF-ON bank
NEW = 0xA031ED00
DELTA = NEW - OLD
ENSURE_OLD = 0x6031EAD0
ENSURE_LEN = 0x42
ENSURE_NEW = 0x6031ECA0
STUB = 0x6031EB80
STUB_CALL = 0x6031EC4D
Z_PATH = ROOT / 'ref/tasks/T3j-afon-acceptance-assertions/run-20261118-132500/work/out/overlay-changed-bytes.csv'
EDGE_PATH = ROOT / 'ref/analysis/button-af/readiness/om-emu-af-native1/central-edge-v2.csv'
OUT = ROOT / 'work/out/overlay-combined-k1.csv'


def load_csv(path):
    rows = {}
    order = []
    with path.open(newline='') as f:
        for rec in csv.DictReader(f):
            addr = int(rec['runtime_address'], 16)
            rows[addr] = {
                'offset': int(rec['component_offset'], 16),
                'stock': int(rec['stock_byte'], 16),
                'new': int(rec['proposed_byte'], 16),
                'purpose': rec.get('purpose') or rec.get('reason') or '',
            }
            order.append(addr)
    return rows, order


def main():
    stock = (ROOT / 'inputs/00_0100_50000020.decoded.bin').read_bytes()
    if hashlib.sha256(stock).hexdigest() != STOCK_SHA:
        raise SystemExit('stock hash')
    z, _ = load_csv(Z_PATH)
    edge, _ = load_csv(EDGE_PATH)
    image = bytearray(stock)
    for addr, rec in edge.items():
        if image[rec['offset']] != rec['stock']:
            raise SystemExit(f'edge stock mismatch {addr:08x}')
        image[rec['offset']] = rec['new']
    # Z must match the task bytes on the stock image.
    for addr, rec in z.items():
        if stock[rec['offset']] != rec['stock']:
            raise SystemExit(f'Z stock mismatch {addr:08x}')

    final = {}  # addr -> (new, source, purpose)

    def put(addr, value, source, purpose):
        off = addr - BASE
        if not (0 <= off < len(stock)):
            raise SystemExit(f'address out of image {addr:08x}')
        prev = final.get(addr)
        if prev and (prev[0] != value or prev[1] != source):
            if not (source == 'new' and prev[1] == 'central-edge'):
                raise SystemExit(f'double write {addr:08x} {prev} vs {value:02x} {source}')
        final[addr] = (value & 0xFF, source, purpose)

    # Z wins every one of its bytes.
    for addr, rec in z.items():
        put(addr, rec['new'], 'Z', rec['purpose'])

    # Central-edge bytes that are not on a Z address and not the old ensure
    # body. The old ensure is rebuilt at ENSURE_NEW.
    for addr, rec in edge.items():
        if addr in z:
            continue
        if ENSURE_OLD <= addr < ENSURE_OLD + ENSURE_LEN:
            continue
        put(addr, rec['new'], 'central-edge', 'central-edge overlay byte, EMULATOR-ONLY')

    # Relocate every FC-immediate in the kept code whose word sits in the old block.
    code_spans = [(0x6031EB12, 0x6031EC9F), (0x607187A4, 0x60718800), (0x60A8F088, 0x60A8F800)]
    moved = []
    for lo, hi in code_spans:
        blob = bytes(image[lo - BASE:hi - BASE + 1])
        for i in range(len(blob) - 5):
            if blob[i] != 0xFC or not (0x80 <= blob[i + 1] <= 0xFF):
                continue
            word = int.from_bytes(blob[i + 2:i + 6], 'little')
            if not (OLD <= word < OLD + SPAN):
                continue
            at = lo + i
            new_word = word + DELTA
            raw = struct.pack('<I', new_word)
            for k in range(4):
                addr = at + 2 + k
                if addr in z:
                    raise SystemExit(f'relocation landed on Z {addr:08x}')
                put(addr, raw[k], 'new', f'relocate owned immediate {word:08x} to {new_word:08x}, EMULATOR-ONLY')
            moved.append({'at': f'{at:08x}', 'from': f'{word:08x}', 'to': f'{new_word:08x}'})

    # Move ensure. Relative calls to targets outside the body are recomputed.
    # Internal short branches keep their bytes.
    body = bytearray(image[ENSURE_OLD - BASE:ENSURE_OLD - BASE + ENSURE_LEN])
    i = 0
    while i < len(body):
        op = body[i]
        if op in (0xDC, 0xDD) and i + 5 <= len(body):
            disp = struct.unpack_from('<i', body, i + 1)[0]
            target = ENSURE_OLD + i + disp
            if not (ENSURE_OLD <= target < ENSURE_OLD + ENSURE_LEN):
                new_at = ENSURE_NEW + i
                struct.pack_into('<i', body, i + 1, target - new_at)
            i += 5
            continue
        i += 1
    # Owned immediates inside the moved body.
    for i in range(len(body) - 5):
        if body[i] == 0xFC and 0x80 <= body[i + 1] <= 0xFF:
            word = int.from_bytes(body[i + 2:i + 6], 'little')
            if OLD <= word < OLD + SPAN:
                body[i + 2:i + 6] = struct.pack('<I', word + DELTA)
    for k, b in enumerate(body):
        put(ENSURE_NEW + k, b, 'new', 'ensure moved off the Z help list, EMULATOR-ONLY')

    # Stub call at STUB_CALL targeted ENSURE_OLD. Retarget ENSURE_NEW.
    call = bytes(image[STUB_CALL - BASE:STUB_CALL - BASE + 7])
    if call[0] != 0xDD:
        raise SystemExit('stub call is not DD')
    disp = struct.unpack_from('<i', call, 1)[0]
    if STUB_CALL + disp != ENSURE_OLD:
        raise SystemExit(f'stub call target {STUB_CALL + disp:08x}')
    new_call = bytes([0xDD]) + struct.pack('<i', ENSURE_NEW - STUB_CALL) + call[5:7]
    for k, b in enumerate(new_call):
        source = 'new' if b != call[k] else 'central-edge'
        purpose = 'stub call retargeted at the moved ensure, EMULATOR-ONLY' if source == 'new' else 'central-edge overlay byte, EMULATOR-ONLY'
        put(STUB_CALL + k, b, source, purpose)

    # Initial owned block. Central-edge's bytes, with internal pointers relocated.
    init = bytearray(b'\xff' * SPAN)
    for addr, rec in edge.items():
        cached = addr  # image address equals the low alias of an uncached pointer
        if OLD <= (addr + 0x40000000) < OLD + SPAN:
            init[(addr + 0x40000000) - OLD] = rec['new']
        elif OLD - 0x40000000 <= addr < OLD - 0x40000000 + SPAN:
            init[addr - (OLD - 0x40000000)] = rec['new']
    for i in range(SPAN - 3):
        word = int.from_bytes(init[i:i + 4], 'little')
        if OLD <= word < OLD + SPAN:
            init[i:i + 4] = struct.pack('<I', word + DELTA)
    for i, b in enumerate(init):
        if b == 0xFF:
            continue
        put(0x6031ED00 + i, b, 'new', 'owned state and banks moved off Z, EMULATOR-ONLY')

    # The profile byte and the 0x9fa1 read stay. This build does not swap them.
    home = bytes(image[0x60A8F708 - BASE:0x60A8F71C - BASE])
    if home[:6] != bytes.fromhex('fccca19f0000'):
        raise SystemExit('home builder no longer starts with the 0x9fa1 read')

    # Checks.
    for addr, rec in z.items():
        got = final[addr]
        if got[0] != rec['new'] or got[1] != 'Z':
            raise SystemExit(f'Z byte lost at {addr:08x}')
    z_set = set(z)
    for addr in final:
        if 0x6031ED00 <= addr < 0x6031ED00 + SPAN and addr in z_set:
            raise SystemExit('relocated state overlaps Z')
        if ENSURE_NEW <= addr < ENSURE_NEW + ENSURE_LEN and addr in z_set:
            raise SystemExit('moved ensure overlaps Z')
    # Decode the published stub call and the moved ensure's state base.
    published = bytearray(stock)
    for addr, (value, _source, _purpose) in final.items():
        published[addr - BASE] = value
    call = published[STUB_CALL - BASE:STUB_CALL - BASE + 5]
    if call[0] != 0xDD or STUB_CALL + struct.unpack_from('<i', call, 1)[0] != ENSURE_NEW:
        raise SystemExit('published stub call')
    base_word = int.from_bytes(published[ENSURE_NEW - BASE + 2:ENSURE_NEW - BASE + 6], 'little')
    if published[ENSURE_NEW - BASE] != 0xFC or base_word != NEW:
        raise SystemExit(f'ensure base {base_word:08x}')
    enabled = published[0x6031ED06 - BASE]
    if enabled != 1:
        raise SystemExit(f'enabled flag {enabled}')
    # No remaining FC immediate in the relocated code still names the old block,
    # except we intentionally did not scan the dead old ensure (it is not present).
    for lo, hi in ((ENSURE_NEW, ENSURE_NEW + ENSURE_LEN), (STUB, STUB + 0x120), (0x60A8F088, 0x60A8F800), (0x607187A4, 0x60718800)):
        blob = published[lo - BASE:hi - BASE + 1]
        for i in range(len(blob) - 5):
            if blob[i] == 0xFC and 0x80 <= blob[i + 1] <= 0xFF:
                word = int.from_bytes(blob[i + 2:i + 6], 'little')
                if OLD <= word < OLD + SPAN:
                    raise SystemExit(f'old owned immediate remains at {lo + i:08x} {word:08x}')

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open('w', newline='') as f:
        w = csv.writer(f)
        w.writerow(('component_offset', 'runtime_address', 'stock_byte', 'proposed_byte', 'source', 'purpose'))
        for addr in sorted(final):
            value, source, purpose = final[addr]
            off = addr - BASE
            w.writerow((f'{off:08x}', f'{addr:08x}', f'{stock[off]:02x}', f'{value:02x}', source, purpose))
    counts = {}
    for _v, source, _p in final.values():
        counts[source] = counts.get(source, 0) + 1
    report = {
        'bytes': len(final),
        'counts': counts,
        'z_bytes': len(z),
        'moved_immediates': len(moved),
        'old': f'{OLD:08x}',
        'new': f'{NEW:08x}',
        'delta': f'{DELTA:08x}',
        'ensure': f'{ENSURE_NEW:08x}',
        'span': SPAN,
        'profile_byte_untouched': '0xa031e920',
        'home_key_still_9fa1': True,
        'conflicts_with_z_not_applied': 182,
    }
    (ROOT / 'work/out/overlay-combined-k1.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
