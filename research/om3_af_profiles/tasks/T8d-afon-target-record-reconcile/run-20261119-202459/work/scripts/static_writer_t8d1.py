# T8d static writer, converter, and zone-name measurement.
# Reads the decoded main image, resource 0106, the language block, and the T8 overlay CSV.
# Does not modify those files. Do not edit this script after it has run.
import hashlib
import json
from pathlib import Path

ROOT = Path('.').resolve()
IMAGE = ROOT / 'inputs' / '00_0100_50000020.decoded.bin'
RES = ROOT / 'inputs' / '02_0106_458c0020.decoded.bin'
LANG = ROOT / 'om-emu' / 'unpacked' / 'E147' / 'OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin'
CSV = ROOT / 'ref' / 'tasks' / 'T8-afon-integrated-acceptance' / 'run-20261119-132229' / 'work' / 'out' / 'overlay-combined-t8.csv'
OUT = ROOT / 'work' / 'out' / 'static-writer-t8d1.json'
BASE = 0x60021020
EXPECT_MAIN = '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
EXPECT_RES = '3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059'

def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

def load(p, expect):
    digest = sha(p)
    if digest != expect:
        raise SystemExit(p.name + ' sha ' + digest)
    return p.read_bytes(), digest

image, image_sha = load(IMAGE, EXPECT_MAIN)
res, res_sha = load(RES, EXPECT_RES)

def off(addr):
    o = addr - BASE
    if o < 0 or o >= len(image):
        raise SystemExit('addr %x' % addr)
    return o

def at(addr, n):
    o = off(addr)
    return image[o:o + n]

def u16(addr):
    b = at(addr, 2)
    return b[0] | (b[1] << 8)

def u32(addr):
    b = at(addr, 4)
    return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) & 0xffffffff

def hexb(b):
    return b.hex()

# Writer window 0x609b3c79 .. 0x609b3d6d inclusive of the ret.
writer = at(0x609b3c79, 0x609b3d6d + 3 - 0x609b3c79)
# Converter 0x609b3ecd .. 0x609b3fda inclusive of the ret.
converter = at(0x609b3ecd, 0x609b3fda + 3 - 0x609b3ecd)
jump = [u32(0x60a7da08 + i * 4) for i in range(11)]

# Descriptor 0x6061fd9c is UI 1333, stride 20 from 0x6061912c.
desc = at(0x6061fd9c, 20)
desc_ui = u16(0x6061fd9c)
desc_ptr = u32(0x6061fd9c + 4)
desc_count = u16(0x6061fd9c + 0x0c)
desc_stride = u16(0x6061fd9c + 0x0e)
table = at(0x60617864, 10)

# Face records: 12 bytes, u32 value, u16 kind, u16 id, u32 class.
faces = []
for i in range(10):
    a = 0x6158ba1c + i * 12
    raw = at(a, 12)
    faces.append({
        'addr': '0x%08x' % a,
        'bytes': hexb(raw),
        'value': u32(a),
        'kind': u16(a + 4),
        'id': u16(a + 6),
        'class': '0x%08x' % u32(a + 8),
    })

# Resource 0106 names. Stride 52, file base 0x28803f0, ASCII name at +8 of each slot
# (established by T3g for slot 238). Read a window of slots that the UI map ties to zone keys.
RES_BASE = 0x28803f0
RES_STRIDE = 52

def res_name(slot):
    o = RES_BASE + slot * RES_STRIDE
    rec = res[o:o + RES_STRIDE]
    # Name is a NUL-terminated ASCII run inside the record. Take the longest run of printable bytes.
    text = []
    best = ''
    cur = []
    for b in rec:
        if 32 <= b < 127:
            cur.append(chr(b))
        else:
            if len(cur) > len(best):
                best = ''.join(cur)
            cur = []
    if len(cur) > len(best):
        best = ''.join(cur)
    return {'slot': slot, 'file_off': '0x%x' % o, 'name': best, 'head': rec[:16].hex()}

# UI map 0x6062555c, u16 key, u16 index.
def ui_map(ui):
    a = 0x6062555c + ui * 4
    return {'ui': ui, 'addr': '0x%08x' % a, 'key': '0x%04x' % u16(a), 'index': u16(a + 2), 'bytes': hexb(at(a, 4))}

zone_uis = [163, 1333, 1642, 1643, 1644, 1645, 238, 1692, 1693, 1803]
ui_rows = [ui_map(u) for u in zone_uis]
res_rows = [res_name(u) for u in zone_uis]

# Overlay builder bytes 0x60a8f6bb .. 0x60a8f7d5, stock image vs CSV proposed byte.
overlay = {}
with CSV.open('r', encoding='utf-8') as f:
    next(f)
    for line in f:
        parts = line.rstrip('\n').split(',')
        if len(parts) < 4:
            continue
        addr = int(parts[1], 16)
        if 0x60a8f6bb <= addr < 0x60a8f7e0:
            overlay[addr] = int(parts[3], 16)

builder = []
for addr in range(0x60a8f6bb, 0x60a8f7d5):
    stock = image[off(addr)]
    prop = overlay.get(addr)
    builder.append({
        'addr': '0x%08x' % addr,
        'stock': stock,
        'overlay': prop,
    })

# Language-block UTF-16 search for the zone words, whole-token, Latin.
words = ['All', 'Single', 'Small', 'Cross', 'Mid', 'Large', 'C1', 'C2', 'C3', 'C4', 'AF Target']
lang = LANG.read_bytes() if LANG.exists() else b''
lang_sha = hashlib.sha256(lang).hexdigest() if lang else None

def find_utf16(blob, needle, limit=8):
    pat = needle.encode('utf-16le')
    hits = []
    start = 0
    while len(hits) < limit:
        i = blob.find(pat, start)
        if i < 0:
            break
        a = i
        while a >= 2 and blob[a - 2:a] != b'\x00\x00' and i - a < 80:
            a -= 2
        if blob[a:a + 2] == b'\x00\x00':
            a += 2
        b = i + len(pat)
        while b + 1 < len(blob) and blob[b:b + 2] != b'\x00\x00' and b - i < 160:
            b += 2
        text = blob[a:b].decode('utf-16le', 'replace').replace('\r', '\\r').replace('\n', '\\n')
        hits.append({'off': '0x%x' % a, 'text': text[:180]})
        start = i + 2
    return hits

string_hits = {w: find_utf16(lang, w) for w in words} if lang else {}

# Also search resource 0106 for the same words as UTF-16 and as ASCII mode names.
ascii_needles = [b'MODE_AF_AREA', b'MODE_AF_TARGET', b'MODE_AF_HOME_AREA', b'AF target']
ascii_hits = []
for needle in ascii_needles:
    start = 0
    n = 0
    while n < 12:
        i = res.find(needle, start)
        if i < 0:
            break
        end = i
        while end < len(res) and 32 <= res[end] < 127 and end - i < 80:
            end += 1
        ascii_hits.append({'off': '0x%x' % i, 'text': res[i:end].decode('ascii', 'replace')})
        start = i + 1
        n += 1

out = {
    'image_sha256': image_sha,
    'resource_sha256': res_sha,
    'language_sha256': lang_sha,
    'language_path': str(LANG).replace('\\', '/') if lang else None,
    'writer': {
        'entry': '0x609b3c79',
        'end': '0x609b3d6d',
        'nbytes': len(writer),
        'sha256': hashlib.sha256(writer).hexdigest(),
        'head': writer[:16].hex(),
    },
    'converter': {
        'entry': '0x609b3ecd',
        'end': '0x609b3fda',
        'nbytes': len(converter),
        'sha256': hashlib.sha256(converter).hexdigest(),
        'head': converter[:16].hex(),
    },
    'jump_table': [{'ui': i, 'head': '0x%08x' % p} for i, p in enumerate(jump)],
    'descriptor': {
        'addr': '0x6061fd9c',
        'bytes': hexb(desc),
        'ui': desc_ui,
        'value_ptr': '0x%08x' % desc_ptr,
        'byte_count': desc_count,
        'stride': desc_stride,
        'table_addr': '0x60617864',
        'table_bytes': hexb(table),
        'table_values': list(table),
    },
    'faces': faces,
    'ui_map': ui_rows,
    'resource_names': res_rows,
    'builder_stock_ff': sum(1 for row in builder if row['stock'] == 0xff),
    'builder_rows': len(builder),
    'builder_overlay_rows': sum(1 for row in builder if row['overlay'] is not None),
    'string_hits': string_hits,
    'resource_ascii': ascii_hits,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(out, indent=2), encoding='utf-8')
print('wrote', OUT, 'writer', out['writer']['sha256'][:12], 'faces', len(faces), 'jump', len(jump))
