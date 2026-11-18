# Static dump for T1 page-27 mapping. Read-only over inputs and ref.
import hashlib
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "work" / "out"
OUT.mkdir(parents=True, exist_ok=True)
BASE = 0x60021020
MAIN_SHA = "5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59"
RES_SHA = "3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059"

def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def u16(b, o):
    return struct.unpack_from("<H", b, o)[0]

def u32(b, o):
    return struct.unpack_from("<I", b, o)[0]

def hexb(b):
    return b.hex()

main_path = ROOT / "inputs" / "00_0100_50000020.decoded.bin"
res_path = ROOT / "inputs" / "02_0106_458c0020.decoded.bin"
main_hash = sha256(main_path)
res_hash = sha256(res_path)
main = main_path.read_bytes()
res = res_path.read_bytes()

lines = []
def w(s=""):
    lines.append(s)

w(f"main_bytes={len(main)} sha256={main_hash} match={main_hash == MAIN_SHA}")
w(f"res_bytes={len(res)} sha256={res_hash} match={res_hash == RES_SHA}")
w(f"cpu_base=0x{BASE:08x}")
w()

def off(addr):
    o = addr - BASE
    if not 0 <= o < len(main):
        raise ValueError(hex(addr))
    return o

def dump(addr, n):
    return main[off(addr):off(addr) + n]

w("== page table 0x6158ee8c stride 20, pages 25-29 ==")
for i in range(66):
    a = 0x6158EE8C + i * 20
    page, rows, count, state, handler = struct.unpack_from("<5I", main, off(a))
    if page in (25, 26, 27, 28, 29):
        w(f"page {page} descriptor=0x{a:08x} rows=0x{rows:08x} count={count} state=0x{state:08x} handler=0x{handler:08x}")
        w(f"  raw {hexb(dump(a, 20))}")
        for r in range(count):
            ra = rows + r * 36
            raw = dump(ra, 36)
            sid, kind, label, viewer, options, nopt, tail0, tail1, alt, altn = struct.unpack_from("<IHHIIIIIII", raw)
            w(f"  row[{r}] 0x{ra:08x} raw {hexb(raw)}")
            w(f"    +00 setting_id={sid} +04 kind={kind} +06 id=0x{label:04x} +08 ptr=0x{viewer:08x}")
            w(f"    +0c options=0x{options:08x} +10 count={nopt} +14=0x{tail0:08x} +18=0x{tail1:08x} +1c=0x{alt:08x} +20={altn}")
            if options and 0 < nopt <= 16 and BASE <= options < BASE + len(main):
                for k in range(nopt):
                    oa = options + k * 12
                    oraw = dump(oa, 12)
                    value, okind, oid, optr = struct.unpack_from("<IHH I", oraw)
                    w(f"    opt[{k}] 0x{oa:08x} raw {hexb(oraw)} value={value} kind={okind} id=0x{oid:04x} ptr=0x{optr:08x}")
        if state and BASE <= state < BASE + len(main):
            sraw = dump(state, 12)
            skind = u16(sraw, 0)
            sid_ = u16(sraw, 2)
            sptr = u32(sraw, 4)
            w(f"  title record 0x{state:08x} raw {hexb(sraw)} kind={skind} id=0x{sid_:04x} ptr=0x{sptr:08x}")
w()

w("== UI id map 0x6062555c (u16 key, u16 index) for 2154 and 2155 ==")
for sid in (2154, 2155, 2156, 2157):
    a = 0x6062555C + sid * 4
    key, index = struct.unpack_from("<HH", main, off(a))
    w(f"id {sid} map 0x{a:08x} raw {hexb(dump(a, 4))} key=0x{key:04x} index={index}")
w()

w("== setting names in resource 0106 offset 0x28803f0 stride 52 ==")
for sid in (2154, 2155):
    o = 0x28803F0 + sid * 52
    slot = res[o:o + 52]
    name = slot.split(b"\x00", 1)[0].decode("ascii", "replace")
    w(f"id {sid} res+0x{o:x} name={name!r} raw {slot[:52].hex()}")
w()

w("== bank-7 registration walk, key 0x90a1 ==")
addr = 0x600E4BEC
found = None
records = 0
while addr < 0x6011FE20:
    key, count = struct.unpack_from("<HH", main, off(addr))
    width = (key & 3) or 4
    payload = count * width
    if key == 0x90A1:
        raw = dump(addr, 4 + payload)
        found = (addr, count, width, raw)
    nxt = (addr + 4 + payload + 3) & ~3
    if nxt <= addr:
        break
    addr = nxt
    records += 1
w(f"records={records} end=0x{addr:08x}")
if found:
    addr, count, width, raw = found
    w(f"key 0x90a1 descriptor=0x{addr:08x} count={count} width={width} raw {hexb(raw)}")
w()

w("== bytes at 0x60621300 (small-setting descriptors, 64 bytes) ==")
w(hexb(dump(0x60621300, 96)))
w("== bytes at 0x606190a0 (claimed data 0x606190b7, 32 bytes) ==")
w(hexb(dump(0x606190A0, 48)))
w()

w("== button function table 0x612f20a8, 80 x 16, entries whose +0 is 69 or whose +4 is 0x0a ==")
for i in range(0x50):
    a = 0x612F20A8 + i * 16
    raw = dump(a, 16)
    k, fn, mid, alt = struct.unpack_from("<4I", raw)
    if k in (69, 9, 0x45) or fn in (0x0A, 0x45, 69) or alt in (0x0A,):
        w(f"  [{i}] 0x{a:08x} raw {hexb(raw)} key={k} fn=0x{fn:x} +8=0x{mid:x} alt=0x{alt:x}")
w()

w("== u16 pair 2154,2155 (6a 08 6b 08) and u32 pair ==")
pair = bytes.fromhex("6a086b08")
pair32 = bytes.fromhex("6a0800006b080000")
start = 0
hits = 0
while True:
    i = main.find(pair, start)
    if i < 0 or hits >= 40:
        break
    w(f"  u16pair file+0x{i:x} addr=0x{BASE+i:08x} context {main[i:i+16].hex()}")
    start = i + 1
    hits += 1
w(f"u16 pair hits shown={hits}")
start = 0
hits = 0
while True:
    i = main.find(pair32, start)
    if i < 0 or hits >= 20:
        break
    w(f"  u32pair file+0x{i:x} addr=0x{BASE+i:08x}")
    start = i + 1
    hits += 1
w()

w("== immediate-looking 0x90a1 (preceded by 2c/2d/2e/2f) and all u16 0x90a1 sites, capped ==")
keyb = bytes.fromhex("a190")
start = 0
imm = 0
data_n = 0
shown = 0
while True:
    i = main.find(keyb, start)
    if i < 0:
        break
    prev = main[i - 1] if i else 0
    addr = BASE + i - (1 if prev in (0x2C, 0x2D, 0x2E, 0x2F) else 0)
    if prev in (0x2C, 0x2D, 0x2E, 0x2F):
        imm += 1
        if shown < 30:
            w(f"  IMM addr=0x{BASE+i-1:08x} opcode=0x{prev:02x} raw {main[i-1:i+6].hex()}")
            shown += 1
    else:
        data_n += 1
        if data_n <= 25:
            w(f"  DATA addr=0x{BASE+i:08x} prev=0x{prev:02x} context {main[max(0,i-4):i+8].hex()}")
    start = i + 1
w(f"imm_sites={imm} data_sites={data_n}")
w()

def utf16_strings(blob, needle, limit=12):
    pat = needle.encode("utf-16le")
    out = []
    start = 0
    while len(out) < limit:
        i = blob.find(pat, start)
        if i < 0:
            break
        # walk to UTF-16 NULs, bounded
        a = i
        while a >= 2 and blob[a - 2:a] != b"\x00\x00" and i - a < 160:
            a -= 2
        if blob[a:a + 2] == b"\x00\x00":
            a += 2
        b = i + len(pat)
        while b + 2 <= len(blob) and blob[b:b + 2] != b"\x00\x00" and b - i < 240:
            b += 2
        text = blob[a:b].decode("utf-16le", "replace")
        out.append((i, text))
        start = i + 2
    return out

needles = [
    "@A066@", "@A02F@", "@A0BF@", "@A02C@", "@A065@", "@A052@",
    "Always tracks", "AF Target Point", "AF Button", " Priority",
    "shutter", "AF-ON", "Subject",
]
w("== UTF-16 hits in resource 0106 ==")
for n in needles:
    hits = utf16_strings(res, n, 8)
    w(f"[{n}] count_shown={len(hits)}")
    for off_, text in hits:
        w(f"  res+0x{off_:x} {text!r}")
w()

block = ROOT / "om-emu" / "unpacked" / "E147" / "OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin"
if block.exists():
    blob = block.read_bytes()
    w(f"== UTF-16 hits in res block {block.name} bytes={len(blob)} sha256={hashlib.sha256(blob).hexdigest()} ==")
    for n in needles:
        hits = utf16_strings(blob, n, 8)
        w(f"[{n}] count_shown={len(hits)}")
        for off_, text in hits:
            w(f"  blk+0x{off_:x} {text!r}")
else:
    w(f"res block missing: {block}")

text = "\n".join(lines) + "\n"
(OUT / "static-dump.txt").write_text(text, encoding="utf-8")
print(f"wrote {OUT / 'static-dump.txt'} lines={len(lines)} main_ok={main_hash==MAIN_SHA} res_ok={res_hash==RES_SHA}")
