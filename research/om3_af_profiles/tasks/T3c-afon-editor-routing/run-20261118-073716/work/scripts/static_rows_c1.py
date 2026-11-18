# Correction-round static dump. Read-only over inputs. Writes work/out/static-rows-c1.txt.
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = (ROOT / "inputs" / "00_0100_50000020.decoded.bin").read_bytes()
BASE = 0x60021020
OUT = ROOT / "work" / "out" / "static-rows-c1.txt"


def off(addr):
    o = addr - BASE
    if not 0 <= o < len(BIN):
        raise ValueError(hex(addr))
    return o


def dump(addr, n):
    return BIN[off(addr):off(addr) + n]


def u16(addr):
    return struct.unpack_from("<H", BIN, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", BIN, off(addr))[0]


def calls_to(targets):
    want = set(targets)
    found = []
    n = len(BIN)
    start = 0
    while True:
        i = BIN.find(b"\xdd", start)
        if i < 0 or i + 7 > n:
            break
        rel = struct.unpack_from("<i", BIN, i + 1)[0]
        tgt = (i + rel) & 0xFFFFFFFF
        if tgt in want:
            found.append((BASE + i, BASE + tgt, "call32"))
        start = i + 1
    start = 0
    while True:
        i = BIN.find(b"\xcd", start)
        if i < 0 or i + 5 > n:
            break
        rel = struct.unpack_from("<h", BIN, i + 1)[0]
        tgt = (i + rel) & 0xFFFFFFFF
        if tgt in want:
            found.append((BASE + i, BASE + tgt, "call16"))
        start = i + 1
    return found


def calls_inside(start_addr, length):
    blob = dump(start_addr, length)
    found = []
    for i, b in enumerate(blob):
        if b == 0xDD and i + 7 <= length:
            rel = struct.unpack_from("<i", blob, i + 1)[0]
            tgt = (start_addr + i + rel) & 0xFFFFFFFF
            if 0x60000000 <= tgt < 0x62000000:
                found.append((start_addr + i, tgt, "call32"))
        elif b == 0xCD and i + 5 <= length:
            rel = struct.unpack_from("<h", blob, i + 1)[0]
            tgt = (start_addr + i + rel) & 0xFFFFFFFF
            if 0x60000000 <= tgt < 0x62000000:
                found.append((start_addr + i, tgt, "call16"))
    return found


def row(addr):
    raw = dump(addr, 36)
    sid, kind, label, viewer, options, nopt, z, viewer2, alt, altn = struct.unpack_from("<IHHIIIIIII", raw)
    return raw, sid, kind, label, viewer, options, nopt, z, viewer2, alt, altn


lines = []
say = lines.append
say(f"image_bytes={len(BIN)} base=0x{BASE:08x}")
say("== row 2154 and the overlay third row ==")
for name, addr in (("2154", 0x6158DC44), ("2155", 0x6158DC68), ("overlay-3d6f", 0x6031E978), ("page28-0", 0x6158DC8C)):
    raw, sid, kind, label, viewer, options, nopt, z, viewer2, alt, altn = row(addr)
    say(f"{name} 0x{addr:08x} id=0x{sid:04x} kind={kind} label=0x{label:04x} opts=0x{options:08x} n={nopt} alt=0x{alt:08x} altn={altn}")
    say(f"  raw {raw.hex()}")
    if options and 0 < nopt <= 16:
        for k in range(nopt):
            oa = options + k * 12
            value, okind, oid, optr = struct.unpack_from("<IHH I", dump(oa, 12))
            say(f"  opt[{k}] 0x{oa:08x} value={value} kind={okind} text=0x{oid:04x} ptr=0x{optr:08x} raw {dump(oa, 12).hex()}")

say("== free bytes after the T3a overlay, section 1 ends 0x6031f000 ==")
tail = dump(0x6031E9B4, 0x6031F000 - 0x6031E9B4)
ff = 0
for b in tail:
    if b == 0xFF:
        ff += 1
    else:
        break
say(f"leading_ff_from_0x6031e9b4={ff} first_non_ff={None if ff == len(tail) else hex(tail[ff])}")
say(f"head32 {tail[:32].hex()}")

say("== direct calls to the OK-path functions ==")
targets = {
    0x6124F6C7: "FUN_6124f6c7",
    0x61203816: "FUN_61203816",
    0x610CDEBF: "FUN_610cdebf",
    0x610CDF05: "FUN_610cdf05",
    0x610E2536: "FUN_610e2536",
    0x61204065: "FUN_61204065",
    0x61203E81: "FUN_61203e81",
    0x60063431: "FUN_60063431",
    0x6041937F: "FUN_6041937f",
}
found = calls_to(targets)
for site, tgt, kind in sorted(found):
    say(f"  {kind} site=0x{site:08x} target=0x{tgt:08x} {targets[tgt]}")
say(f"call_count={len(found)}")

say("== opcode scan inside FUN_6124f6c7 (316 bytes); Ghidra listing is authoritative ==")
for site, tgt, kind in calls_inside(0x6124F6C7, 316):
    say(f"  {kind} site=0x{site:08x} target=0x{tgt:08x}")

text = "\n".join(lines) + "\n"
OUT.write_text(text, encoding="utf-8")
print(text)
