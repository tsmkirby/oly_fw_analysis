# T14 static scan of the decoded main image and resource 0106.
# Read-only. Writes only under work/out.
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(r'C:\Dev\OM3-tasks\T14-stock-afon-vs-halfpress\ws')
IMAGE = ROOT / 'inputs' / '00_0100_50000020.decoded.bin'
RES = ROOT / 'inputs' / '02_0106_458c0020.decoded.bin'
OUT = ROOT / 'work' / 'out' / 'scan-t14.json'
BASE = 0x60021020
EXPECT_MAIN = '5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59'
EXPECT_RES = '3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059'

CALL_TARGETS = [
    0x609b3c79, 0x609b3bb2, 0x609b3b98, 0x609b3ba7, 0x609b348a, 0x609b3481,
    0x609b3478, 0x609b3ecd, 0x609b3dfb, 0x609832f5, 0x60903e55, 0x609025cf,
    0x60900203, 0x6071128b, 0x6071129f, 0x60447de4, 0x610a5620, 0x610a58c7,
    0x610aef37, 0x610a6323, 0x610a5f10, 0x610a613c, 0x610a5993, 0x610a59da,
    0x610b962a, 0x610b9653, 0x610b9197, 0x610bf5b9, 0x60a8f2be, 0x60a8f4c1,
    0x60a8f6bb, 0x60a8f708, 0x608fe1b0, 0x60063380,
]
ABS_ADDRS = [
    0xa33f2c9c, 0xa33f2cba, 0xa33f2cbe, 0xa33f2ce0, 0xa33f2ce2, 0xa33f2ce3,
    0xa33f2ce4, 0xa33f2ce6, 0xa33f2ce8, 0xa33f2ce9, 0xa33f2cea, 0xa33ca384,
    0xa031ed04, 0xa031ebe0, 0xa031e920, 0xa031eaa0, 0xa031eab0, 0xa031eac0,
    0xa33f2cd8, 0xa33f3640,
]
KEYS = [0x90a1, 0x90b1, 0x086a, 0x086b, 0x84d1, 0x9a41, 0x9fa1, 0xdfa1,
        0x99d2, 0x88b2, 0x1df1, 0x1e01, 0x1dd1, 0x99a1, 0x5ab, 0x5ac, 0x3ba0]


def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def main():
    image_sha = sha(IMAGE)
    res_sha = sha(RES)
    if image_sha != EXPECT_MAIN:
        raise SystemExit('main sha ' + image_sha)
    if res_sha != EXPECT_RES:
        raise SystemExit('res sha ' + res_sha)
    image = IMAGE.read_bytes()
    res = RES.read_bytes()
    n = len(image)
    targets = set(CALL_TARGETS)
    calls = {hex(t): [] for t in CALL_TARGETS}
    range_calls = []  # calls whose target is in 0x60a8f000..0x60a91000
    builder_lo, builder_hi = 0x60a8f000, 0x60a91000

    def add_call(kind, addr, tgt, extra):
        if tgt in targets:
            calls[hex(tgt)].append({'at': hex(addr), 'kind': kind, 'extra': extra})
        if builder_lo <= tgt < builder_hi:
            range_calls.append({'at': hex(addr), 'kind': kind, 'target': hex(tgt), 'extra': extra})

    i = 0
    while i + 7 < n:
        b = image[i]
        addr = BASE + i
        if b == 0xcd and i + 4 < n:
            rel = struct.unpack_from('<h', image, i + 1)[0]
            tgt = (addr + rel) & 0xffffffff
            add_call('call16', addr, tgt, image[i + 3])
        elif b == 0xdd and i + 6 < n:
            rel = struct.unpack_from('<i', image, i + 1)[0]
            tgt = (addr + rel) & 0xffffffff
            add_call('call32', addr, tgt, image[i + 5])
        elif b == 0xcc and i + 2 < n:
            rel = struct.unpack_from('<h', image, i + 1)[0]
            tgt = (addr + rel) & 0xffffffff
            add_call('jmp16', addr, tgt, 0)
        elif b == 0xdc and i + 4 < n:
            rel = struct.unpack_from('<i', image, i + 1)[0]
            tgt = (addr + rel) & 0xffffffff
            add_call('jmp32', addr, tgt, 0)
        elif b == 0xfa and i + 4 < n and image[i + 1] == 0xff:
            rel = struct.unpack_from('<h', image, i + 2)[0]
            tgt = (addr + rel) & 0xffffffff
            add_call('calls16', addr, tgt, 0)
        elif b == 0xfc and i + 6 < n and image[i + 1] == 0xff:
            rel = struct.unpack_from('<i', image, i + 2)[0]
            tgt = (addr + rel) & 0xffffffff
            add_call('calls32', addr, tgt, 0)
        i += 1

    # Absolute little-endian address immediates.
    abs_hits = {}
    for a in ABS_ADDRS:
        pat = struct.pack('<I', a)
        hits = []
        start = 0
        while len(hits) < 40:
            j = image.find(pat, start)
            if j < 0:
                break
            hits.append(hex(BASE + j))
            start = j + 1
        abs_hits[hex(a)] = hits

    # 16-bit and 32-bit mov immediates of setting keys.
    # short: 0x2c..0x2f + u16 (D0..D3); 0x24..0x27 + u16 (A0..A3)
    # long: fc, op1 in cc..cf (D) or fc, 0x37-ish. Record raw window.
    key_hits = {}
    for key in KEYS:
        pat16 = struct.pack('<H', key)
        hits = []
        start = 0
        while len(hits) < 80:
            j = image.find(pat16, start)
            if j < 0:
                break
            prev = image[j - 1] if j else 0
            kind = None
            if prev in (0x2c, 0x2d, 0x2e, 0x2f, 0x24, 0x25, 0x26, 0x27):
                kind = 'mov16'
            elif j >= 2 and image[j - 2] == 0xfc and image[j - 1] in (0xcc, 0xcd, 0xce, 0xcf, 0xd0, 0xd1, 0xd2, 0xd3):
                # only if the following halfword is zero (imm32)
                if j + 3 < n and image[j + 2] == 0 and image[j + 3] == 0:
                    kind = 'mov32'
            if kind:
                hits.append({'at': hex(BASE + j - (1 if kind == 'mov16' else 2)), 'kind': kind, 'prev': prev})
            start = j + 1
        key_hits[hex(key)] = hits

    def at(addr, nbytes):
        o = addr - BASE
        return image[o:o + nbytes]

    windows = {}
    for addr, nbytes, name in (
        (0x609b3c79, 0x609b3d70 - 0x609b3c79, 'writer'),
        (0x6158ba04, 24, 'af-button-options'),
        (0x60617864, 10, 'zone-value-table'),
        (0x60627704, 8, 'ui-2154-2155'),
        (0x612f20c8, 8, 'assign-69'),
        (0x60a8f6bb, 32, 'builder-head'),
    ):
        windows[name] = {'addr': hex(addr), 'hex': at(addr, nbytes).hex()}

    # Resource ASCII / UTF-16 needles for the AF Button phrases.
    needles = [
        b'Always tracks', b'AF Target Point', b'Subject', b'Priority',
        b'MODE_AF_SUBJECT', b'@A02F@', b'@A066@',
    ]
    res_hits = []
    for needle in needles:
        start = 0
        count = 0
        while count < 6:
            j = res.find(needle, start)
            if j < 0:
                break
            end = j
            while end < len(res) and 32 <= res[end] < 127 and end - j < 90:
                end += 1
            res_hits.append({'off': hex(j), 'text': res[j:end].decode('ascii', 'replace')})
            start = j + 1
            count += 1
        # UTF-16LE
        pat = needle.decode('ascii').encode('utf-16le')
        start = 0
        count = 0
        while count < 4:
            j = res.find(pat, start)
            if j < 0:
                break
            res_hits.append({'off': hex(j), 'utf16': needle.decode('ascii')})
            start = j + 2
            count += 1

    # Trim call lists for the getter (it will be huge). Keep a count and the
    # sites that sit within 12 bytes after a mov of one of the record keys.
    getter = calls['0x60063380']
    interesting_keys = {0x90a1, 0x84d1, 0x9a41, 0x9fa1, 0xdfa1, 0x99d2, 0x88b2, 0x1df1, 0x1e01, 0x1dd1, 0x99a1}
    getter_near_key = []
    key_sites = []
    for key, hits in key_hits.items():
        if int(key, 16) not in interesting_keys:
            continue
        for h in hits:
            key_sites.append((int(h['at'], 16), key, h['kind']))
    key_sites.sort()
    getter_set = {int(h['at'], 16) for h in getter}
    for site, key, kind in key_sites:
        # a call within the next 16 bytes
        for g in range(site, site + 18):
            if g in getter_set:
                getter_near_key.append({'mov': hex(site), 'key': key, 'mov_kind': kind, 'call': hex(g)})
                break
    calls_out = {}
    for k, v in calls.items():
        if k == '0x60063380':
            calls_out[k] = {'count': len(v), 'near_record_keys': getter_near_key}
        else:
            calls_out[k] = v

    out = {
        'image': str(IMAGE),
        'image_sha256': image_sha,
        'image_bytes': n,
        'resource_sha256': res_sha,
        'resource_bytes': len(res),
        'base': hex(BASE),
        'calls': calls_out,
        'builder_range_calls': range_calls,
        'abs_hits': abs_hits,
        'key_hits': {k: v for k, v in key_hits.items()},
        'windows': windows,
        'resource_string_hits': res_hits,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2), encoding='utf-8')
    print('image', image_sha)
    print('resource', res_sha)
    print('bytes', n)
    for k, v in calls_out.items():
        if k == '0x60063380':
            print(k, 'count', v['count'], 'near', len(v['near_record_keys']))
        else:
            print(k, len(v), [h['at'] for h in v[:8]])
    print('builder-range', len(range_calls))
    for a, hits in abs_hits.items():
        if hits:
            print('abs', a, len(hits), hits[:6])
    for k, hits in key_hits.items():
        if hits and int(k, 16) in (0x90a1, 0x086a, 0x086b, 0x9fa1, 0xdfa1, 0x84d1):
            print('key', k, len(hits), hits[:8])
    print('wrote', OUT)


if __name__ == '__main__':
    main()
