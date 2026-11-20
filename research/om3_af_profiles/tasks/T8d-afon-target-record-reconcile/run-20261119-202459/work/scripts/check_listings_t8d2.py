# Check the T8d correction listings against the decoded main image. Do not edit after this runs.
import hashlib
import json
from pathlib import Path

ROOT = Path('.').resolve()
IMAGE = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
EXPECT = '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
digest = hashlib.sha256(IMAGE).hexdigest()
if digest != EXPECT:
    raise SystemExit('image sha ' + digest)

LISTINGS = [
    'work/out/disasm-writer-t8d2.txt',
    'work/out/disasm-converter-t8d2.txt',
]

def check(path):
    rows = []
    bad = []
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        parts = line.split('\t')
        if len(parts) < 3:
            bad.append(line)
            continue
        addr = int(parts[0], 16)
        raw = parts[1]
        if raw == '??':
            bad.append(line)
            continue
        want = bytes.fromhex(raw)
        got = IMAGE[addr - BASE:addr - BASE + len(want)]
        ok = got == want
        rows.append({'addr': '0x%08x' % addr, 'bytes': raw, 'ok': ok, 'text': parts[2]})
        if not ok:
            bad.append(line + ' image ' + got.hex())
    return {'path': path, 'instructions': len(rows), 'mismatches': bad, 'first': rows[0]['addr'] if rows else None, 'last': rows[-1]['addr'] if rows else None}

report = {'image_sha256': digest, 'listings': [check(p) for p in LISTINGS]}
for item in report['listings']:
    print(item['path'], item['instructions'], 'mismatches', len(item['mismatches']))
out = ROOT / 'work' / 'out' / 'listing-check-t8d2.json'
# Keep the mismatch text, drop the full instruction echo.
slim = {
    'image_sha256': digest,
    'listings': [{k: v for k, v in item.items()} for item in report['listings']],
}
out.write_text(json.dumps(slim, indent=2), encoding='utf-8')
print('wrote', out)
