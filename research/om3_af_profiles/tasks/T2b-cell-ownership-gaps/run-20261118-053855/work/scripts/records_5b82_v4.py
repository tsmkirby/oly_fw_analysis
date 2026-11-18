# Correct the v4 candidate table and the use table from the listings already on disk.
# Does not overwrite any script that has already been run.
import struct
from pathlib import Path

ROOT = Path('.').resolve()
MAIN = (ROOT / 'inputs' / '00_0100_50000020.decoded.bin').read_bytes()
BASE = 0x60021020
OUT = ROOT / 'work' / 'out'
LISTING = OUT / 'listings-setters-v1.txt'
OLD_CAND = OUT / 'candidates-5b82-v3.tsv'
OLD_USES = OUT / 'uses-5b82-v3.tsv'
NEW_CAND = OUT / 'candidates-5b82-v4.tsv'
NEW_USES = OUT / 'uses-5b82-v4.tsv'
NOTE = OUT / 'records-5b82-v4.txt'

def off(va):
    return va - BASE

def u16(va):
    return struct.unpack_from('<H', MAIN, off(va))[0]

def u32(va):
    return struct.unpack_from('<I', MAIN, off(va))[0]

def hx(va, n):
    return MAIN[off(va):off(va) + n].hex()

def cstr(va, n=48):
    raw = MAIN[off(va):off(va) + n]
    end = raw.find(b'\x00')
    if end < 0:
        end = n
    return raw[:end].decode('latin1')

lines = []
def w(s=''):
    lines.append(s)

# --- setter key loads in the three table-B functions ---
text = LISTING.read_text(encoding='utf-8').splitlines()
ins = []
for line in text:
    if not line.startswith('0x'):
        continue
    parts = line.split(' ', 2)
    va = int(parts[0], 16)
    rest = parts[2] if len(parts) > 2 else ''
    ins.append((va, rest))

w('== key load before each FUN_60063431 in 0x60196ee3..0x6019766d ==')
bad_key = 0
n_calls = 0
for i, (va, rest) in enumerate(ins):
    if 'call 0x60063431' not in rest:
        continue
    if not (0x60196ee3 <= va < 0x6019766d):
        continue
    n_calls += 1
    key = None
    for j in range(i - 1, max(-1, i - 14), -1):
        prev = ins[j][1]
        if prev.startswith('movhu ') and prev.endswith(',D0'):
            key = (ins[j][0], prev)
            break
    flag = ''
    if key is None or ('(A0),D0' not in key[1] and '(0x2,A0),D0' not in key[1]):
        bad_key += 1
        flag = ' OTHER'
    w('  call 0x%08x key %s%s' % (va, key, flag))
w('setter calls %d other-key-loads %d' % (n_calls, bad_key))

# --- pointer runs around the address-constant hits ---
def in_image(v):
    return BASE <= v < BASE + len(MAIN)

def run_bounds(va):
    start = va
    while start - 4 >= BASE and in_image(u32(start - 4)):
        start -= 4
    end = va + 4
    while end + 4 <= BASE + len(MAIN) and in_image(u32(end)):
        end += 4
    return start, end

w('== address-constant runs ==')
for va in (0x60e29138, 0x615fbdb0, 0x615b9d54, 0x615b9d90):
    aligned = va & ~3
    start, end = run_bounds(aligned)
    w('  0x%08x dword 0x%08x run 0x%08x..0x%08x (%d bytes) raw %s' % (
        va, u32(aligned), start, end, end - start, hx(aligned, 4)))

w('product 0x5b8 * 0xf4240 = 0x%08x low16 0x%04x' % (
    (0x5b8 * 0xf4240) & 0xffffffff, (0x5b8 * 0xf4240) & 0xffff))
w('string 0x60a39f0d %s' % cstr(0x60a39f0d))
w('string 0x60a3a6cd %s' % cstr(0x60a3a6cd))
w('string 0x617c31d7 %s' % cstr(0x617c31d7))
w('map 0x60626c3c %s' % hx(0x60626c3c, 4))
w('stub 0x607132b6 %s bra-target-check' % hx(0x607132b6, 4))
w('bytes 0x607135ef %s' % hx(0x607135ef, 3))
w('bytes 0x6071365d %s' % hx(0x6071365d, 1))
w('bytes 0x607136f6 %s' % hx(0x607136f6, 2))
w('bytes 0x6071374b %s' % hx(0x6071374b, 1))
w('gap-call 0x60195a1f %s' % hx(0x60195a1f, 5))
w('tableA 0x5b82 %s' % any(u16(0x6035a038 + i * 8) == 0x5b82 for i in range(0x7a)))
w('tableB 0x5b82 %s' % any(
    u16(0x60242324 + i * 0x9c + off2) == 0x5b82
    for i in range(0x3d) for off2 in range(0, 0x9c, 2)))

# --- candidates ---
MOV = {
    '0x6007f39b': 'not a key. 0x6007f39e bra 0x6007f3d5; 0x6007f3d5 udfu01 0xf4240,D0 bytes fd1440420f00; retf. Product 0x5b8*0xf4240 is 0x5748d400 (low halfword 0xd400). Caller 0x6007f5ed does mov D0,D2 and calls 0x6007f3de, not FUN_60063431.',
    '0x604df354': 'not a key. 0x604df357 add A3,A1; 0x604df365 movhu D0,(D1,A1). The sum is the address of the store.',
    '0x608f8614': 'not a key. 0x608f8604 mov 0x60a39f0d,(0x4,sp); 0x608f860c mov 0x60a3a6cd,(0x8,sp); 0x608f8617 mov D0,(0xc,sp) bytes 420c; call 0x608f3e68. The same call is made with 0x5c4 at 0x608f8656 and 0x5c7 at 0x608f8684. 0x5b8 is the line-number argument beside those two strings. 0x608f861e then loads (0x60365dd4) into D0.',
    '0x60cc0c5a': 'not a key. call 0x60419315 with D0=0x5b8. Map dword at 0x60626c3c (0x6062555c+0x5b8*4) is d14b0100, key 0x4bd1 index 1.',
    '0x60cebcac': 'not a key. call 0x60419315 with D0=0x5b8. Same map dword d14b0100 at 0x60626c3c, key 0x4bd1 index 1.',
    '0x60d68d49': 'not a key. 0x60d68d4c add A2,A0; 0x60d68d4e movhu (A0),D0; 0x60d68d61 movhu D0,(A0). Address.',
    '0x60d68d56': 'not a key. 0x60d68d59 add A2,A0; 0x60d68d5b movhu (A0),D0. Address.',
    '0x61102019': 'not a key. 0x6110201c add A2,A1; 0x6110201e movhu D1,(A1). Address store. 0x6110202e then does mov 0x0,A1.',
    '0x6118bf47': 'not a key. 0x6118bf4a add A2,A0; call 0x610cd5ac. That callee calls 0x610cd6bd, which does mov A0,A2 and movhu (0xc,A2),D0 at 0x610cd6c1. Address.',
    '0x6118c058': 'not a key. 0x6118c05b add A2,A0; call 0x610cd5ac; same movhu (0xc,A2),D0 at 0x610cd6c1. Address.',
    '0x6118c10e': 'not a key. 0x6118c111 add A2,A1; call 0x6118c121. Callee 0x6118c124 mov A1,A2; 0x6118c149 add 0x3b,A2; 0x6118c14b movbu (A2),D0. Address.',
    '0x61195d1d': 'not a key. 0x61195d22 add D2,A3; 0x61195d2c mov (A3),A0. Address.',
    '0x61195d7f': 'not a key. 0x61195d82 add D2,A2; 0x61195d84 mov (A2),D0. Address.',
    '0x61195dc1': 'not a key. 0x61195dc4 add D2,A2; 0x61195dc6 mov (A2),D0. Address.',
    '0x61195e4e': 'not a key. 0x61195e51 add D2,A2; 0x61195e53 mov (A2),D0. Address.',
    '0x61195ec2': 'not a key. 0x61195ec5 add D2,A2; 0x61195ec7 mov (A2),D1. Address.',
    '0x61195ee7': 'not a key. 0x61195eea add D2,A2; 0x61195eec mov (A2),A0. Address.',
    '0x61195f36': 'not a key. 0x61195f39 add D2,A2; 0x61195f3b mov (A2),D0. Address.',
    '0x61195fc3': 'not a key. 0x61195fc6 add D2,A2; 0x61195fc8 mov (A2),D0. Address.',
    '0x611fcdcc': 'not a key. 0x611fcdcf add A2,D1; 0x611fcdd1 mov D1,A1; 0x611fcdd4 movbu D0,(A1). Address store.',
    '0x61206ef6': 'not a key. 0x61206ef9 add A2,D0; 0x61206f51 mov D0,A0; 0x61206f53 movbu D1,(D3,A0). Address store.',
    '0x612072f3': 'not a key. 0x612072fd add A2,A0; 0x61207301 movbu D0,(D1,A0). Address store.',
    '0x6128c262': 'not a key. 0x6128c265 add D2,D3; 0x6128c266 mov D3,D0; call 0x611c782f. Callee 0x611c7832 mov D0,A3; 0x611c7834 movhu (A2),D0; 0x611c7836 movhu D0,(A3). The sum is the destination pointer.',
    '0x6128c9c0': 'not a key. 0x6128c9c6 add D2,A2; 0x6128c9ce mov A2,D0; call 0x611c782f. Same callee store movhu D0,(A3) at 0x611c7836. The sum is the destination pointer.',
    '0x612c37f0': 'not a key. 0x612c37f3 add D3,D0; 0x612c37f4 mov D0,A2; 0x612c37fc mov A0,(0xc,sp); 0x612c3802 mov (0xc,sp),A0; 0x612c3829 movbu D0,(A0). Address store.',
    '0x616cd897': 'not a key. 0x616cd89a add A3,A0; 0x616cd89c mov (A0),D0; 0x616cd89e mov D0,(A0). Address.',
    '0x616cf1d0': 'not a key. 0x616cf1d3 add A0,A1; 0x616cf1d5 mov A1,(0x8,sp); 0x616cf1d7 mov (A1),D0. The stack slot holds that pointer. Address.',
    '0x616ddb03': 'not a key. 0x616ddb06 mov 0x617c31d7,A1; call 0x616a192d with D1=0x5b8. FUN_616a1cfe starts mov D1,D2 and calls 0x616a1d83. That body is mov 0x617beb24,D1; mov D1,(A0); mov D0,(0x4,A0); clr D0; movbu D0,(0x8,A0); retf. It does not read D2, so the copy of 0x5b8 dies.',
    '0x616e369a': 'not a key. 0x616e369d add A3,A0; 0x616e369f mov (A0),D0. Address.',
}

UNALIGNED = {
    '0x60539e07': '82 5b at this odd address, window 825be82ea3fa43c8. The v3 exclusion "unaligned data byte / no function coverage" is withdrawn. No image dword equals this address and no record stride was identified. UNRESOLVED.',
    '0x607c8e19': '82 5b at this odd address, window 825bc8a2cea5f2eb. The v3 exclusion "unaligned data byte / no function coverage" is withdrawn. No image dword equals this address and no record stride was identified. UNRESOLVED.',
    '0x607e2ef9': '82 5b at this odd address, window 825b196ef929661f. The v3 exclusion "unaligned data byte / no function coverage" is withdrawn. No image dword equals this address and no record stride was identified. UNRESOLVED.',
}

rows = OLD_CAND.read_text(encoding='utf-8').splitlines()
header = rows[0].split('\t')
header[-1] = 'v4'
out_rows = ['\t'.join(header)]
n_mov = 0
n_un = 0
for row in rows[1:]:
    cols = row.split('\t')
    addr = cols[0]
    if addr in MOV:
        cols[3] = 'not a key'
        cols[4] = 'cf-v4'
        cols[5] = MOV[addr]
        cols[6] = 'not a key'
        n_mov += 1
    elif addr in UNALIGNED:
        cols[3] = 'UNRESOLVED'
        cols[4] = 'data-v4'
        cols[5] = UNALIGNED[addr]
        cols[6] = 'UNRESOLVED'
        n_un += 1
    elif addr in ('0x60e29138', '0x615fbdb0'):
        aligned = int(addr, 16)
        start, end = run_bounds(aligned)
        cols[3] = 'not a key'
        cols[4] = 'ptr-v4'
        cols[5] = 'dword 0x%08x at 0x%08x bytes %s. Pointer run 0x%08x..0x%08x (%d bytes), every dword is an address inside the image. Not key 0x5b82.' % (
            u32(aligned), aligned, hx(aligned, 4), start, end, end - start)
        cols[6] = 'not a key'
    elif addr in ('0x615b9d55', '0x615b9d91'):
        aligned = int(addr, 16) & ~3
        cols[3] = 'not a key'
        cols[4] = 'ptr-v4'
        cols[5] = 'the 82 5b bytes sit inside dword 0x%08x at 0x%08x (raw %s), one address constant. Not a halfword key.' % (
            u32(aligned), aligned, hx(aligned, 4))
        cols[6] = 'not a key'
    elif addr in ('0x607c69f4', '0x607cb986'):
        cols[6] = 'UNRESOLVED data, not a demonstrated writer'
        n_un += 1
    else:
        cols[6] = 'carried'
    out_rows.append('\t'.join(cols))
NEW_CAND.write_text('\n'.join(out_rows) + '\n', encoding='utf-8')
w('candidates rows %d mov-fixed %d unresolved-marked %d' % (len(out_rows) - 1, n_mov, n_un))

# --- uses ---
USES = {
    '0x607135ad': (
        '0x607135ad', 'FUN_607135ad', 'a', 'write', 'immediate indices 0x10..0x1a',
        'cannot name 0x5b82; key 0xfa64 only',
        '0x607135ef bytes 2664fa mov 0xfa64,A2. 0x6071365d byte 9b mov A2,A3. 0x607136f6 bytes f1de mov A3,D2. Call 0x6071327d ends jmp (A0). Stubs 0x607132b6..0x607132f2 are mov imm,D0; bra to 0x607132f7 (extbu D0; retf) and do not write D2. 0x6071374b byte 88 mov D2,D0 still 0xfa64. Removed from the blocker list.',
        'corrected-v4'),
    '0x60196ee3': (
        '0x60196ee3', 'FUN_60196ee3', 'a', 'write', 'index from the record, key from table B +0x4c',
        'cannot name 0x5b82',
        '0x60196eea mov 0x4c,A0; add A2,A0; mov A0,(0x10,sp). 0x60196f73 movhu (A0),D0. Table 0x60242324 stride 0x9c indices 0..0x3c, end 0x60244850. No halfword in those 61 records is 0x5b82. Sibling calls in this function reload the same pointer.',
        'corrected-v4'),
    '0x601eff7a': (
        '0x601eff7a', 'FUN_601eff7a', 'a', 'write', 'index is the u16 at record+2',
        'cannot name 0x5b82',
        'cmp 0x7a,D3; bge skips the setter. 0x601eff84 bytes fcde38a03560 mov 0x6035a038,A2. 0x601effc8 movhu (A2),D0 is the key; 0x601effce mov D2,D1 is the index. Table 0x6035a038..0x6035a408, 0x7a records of 8 bytes. 0x5b82 occurs in none of the 122 keys.',
        'corrected-v4'),
    '0x6041ab1d': (
        '0x6041ab1d', 'FUN_6041ab1d', 'a', 'write', 'D1 from the caller, reloaded at (0x22,sp)',
        'cannot name 0x5b82',
        '0x6041ab22 bytes f89320 stores incoming D0 at (0x20,sp). 0x6041ab71 movhu (0x20,sp),D0. Nine calls, no image dword equals 0x6041ab1d. D0 immediates are 0x394, 0xbac1, 0xbbc1, 0x2994, 0x1cb4. None is 0x5b82.',
        'corrected-v4'),
    '0x600630a3': (
        '0x600630a3', 'FUN_600630a3', 'c', 'copy', 'replay of the queued record',
        'replay',
        'type 1 -> 0x600634ee, type 2 -> 0x60063684, type 4 -> 0x6006398b. Only three enqueue sites. v4: FUN_60196ee3, FUN_601971f5, FUN_601972f1, FUN_601eff7a, FUN_6041ab1d and FUN_607135ad cannot name 0x5b82, so they do not feed this replay with that key. The adjustment span and the debug prm handler stay classified and are not normal-operation writers.',
        'corrected-v4'),
}
EXTRA = [
    ('0x601971f5', 'FUN_601971f5', 'a', 'write', 'index from the caller record, key from table B +0x4c or +0x4e',
     'cannot name 0x5b82',
     '0x60197201 mov 0x4c,A1; add A0,A1; mov A1,(0x1c,sp). Call 0x601972a6 uses movhu (A0),D0 from that pointer. Call 0x601972e6 uses movhu (0x2,A0),D0, which is record+0x4e, and movhu (0x48,A0),D1 for the index. Same 61 records, 0x5b82 absent.',
     'new-v4'),
    ('0x601972f1', 'FUN_601972f1', 'a', 'write', 'same table index as FUN_60196ee3',
     'cannot name 0x5b82',
     'Prologue matches FUN_60196ee3: call 0x60196ecc, mov 0x4c,A0, add A2,A0, mov A0,(0x10,sp). No asm call and no image dword pointer. The raw call is 0x60195a1f bytes cdd218f03c (cd rel16 0x18d2, target 0x60195a1f+0x18d2). The preceding bytes end 5850, mov (0x50,sp),D0, the same index slot. Keys are the table halfwords at +0x4c and +0x4e.',
     'new-v4'),
]
use_lines = OLD_USES.read_text(encoding='utf-8').splitlines()
uh = use_lines[0].split('\t')
uh[-1] = 'v4'
use_out = ['\t'.join(uh)]
seen = set()
for row in use_lines[1:]:
    cols = row.split('\t')
    if cols[0] in USES:
        cols = list(USES[cols[0]])
        seen.add(cols[0])
    else:
        cols[-1] = 'carried'
    use_out.append('\t'.join(cols))
for extra in EXTRA:
    use_out.append('\t'.join(extra))
NEW_USES.write_text('\n'.join(use_out) + '\n', encoding='utf-8')
w('uses rows %d' % (len(use_out) - 1))

text_out = '\n'.join(lines) + '\n'
NOTE.write_text(text_out, encoding='utf-8')
print(text_out)
print('DONE')
