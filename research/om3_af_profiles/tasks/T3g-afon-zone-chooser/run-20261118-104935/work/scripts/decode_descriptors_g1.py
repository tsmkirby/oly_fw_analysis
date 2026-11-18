# role: observe. Field-by-field decode of the editor descriptors and the lists they do not contain.
import struct
from pathlib import Path

image = Path("inputs/00_0100_50000020.decoded.bin").read_bytes()
res = Path("inputs/02_0106_458c0020.decoded.bin").read_bytes()
BASE = 0x60021020
TABLE = 0x6061912C
NREC = 0x6B0
REC = 20
lines = []


def say(s=""):
    lines.append(s)


def off(addr):
    return addr - BASE


def u16(addr):
    return struct.unpack_from("<H", image, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", image, off(addr))[0]


def raw(addr, n):
    return image[off(addr):off(addr) + n]


def name_of(sid):
    slot = res[0x28803F0 + sid * 52:0x28803F0 + sid * 52 + 52]
    return slot.split(b"\x00", 1)[0].decode("ascii", "replace"), slot.hex()


def decode(addr):
    b = raw(addr, REC)
    ident, flags, data, second, nbytes, stride, tail = struct.unpack_from("<HHIIHHI", b)
    return {
        "addr": addr,
        "raw": b.hex(),
        "id": ident,
        "flags": flags,
        "data": data,
        "second": second,
        "bytes": nbytes,
        "stride": stride,
        "tail": tail,
        "type": b[0x11],
        "elements": (nbytes // stride) if stride else None,
    }


def show(title, rec):
    say(title)
    say("  addr 0x%08x raw %s" % (rec["addr"], rec["raw"]))
    say("  +00 u16 id %d (0x%04x)" % (rec["id"], rec["id"]))
    say("  +02 u16 flags 0x%04x" % rec["flags"])
    say("  +04 u32 value-table 0x%08x" % rec["data"])
    say("  +08 u32 second-pointer 0x%08x" % rec["second"])
    say("  +0c u16 byte-count %d" % rec["bytes"])
    say("  +0e u16 stride %d" % rec["stride"])
    say("  +10 u32 tail 0x%08x  byte+11 type %d" % (rec["tail"], rec["type"]))
    say("  elements byte-count/stride = %s" % rec["elements"])
    if rec["data"] and rec["stride"] in (1, 2) and rec["elements"]:
        blob = raw(rec["data"], rec["bytes"])
        say("  value bytes %s" % blob.hex())
        if rec["stride"] == 1:
            say("  values %s" % list(blob))
        else:
            say("  values %s" % list(struct.unpack("<%dH" % rec["elements"], blob)))
        before = raw(rec["data"] - 24, 24)
        say("  24 bytes before the table %s" % before.hex())


records = [decode(TABLE + i * REC) for i in range(NREC)]
say("table 0x%08x records %d stride %d end 0x%08x" % (TABLE, NREC, REC, TABLE + NREC * REC))
say("2154 on a record boundary: %s" % ((0x6062132C - TABLE) % REC == 0))
say("238 on a record boundary: %s" % ((0x606200E4 - TABLE) % REC == 0))
say("2154 index %d" % ((0x6062132C - TABLE) // REC))
say("238 index %d" % ((0x606200E4 - TABLE) // REC))

d2154 = decode(0x6062132C)
d238 = decode(0x606200E4)
show("== 2154 descriptor ==", d2154)
show("== UI 238 descriptor ==", d238)
show("== record after 2154 ==", decode(0x6062132C + REC))
show("== record after 238 ==", decode(0x606200E4 + REC))
show("== record before 238 ==", decode(0x606200E4 - REC))

say("== records sharing 2154's value table ==")
for rec in records:
    if rec["data"] == d2154["data"]:
        say("  id %d bytes %d stride %d second 0x%x type %d at 0x%08x" % (
            rec["id"], rec["bytes"], rec["stride"], rec["second"], rec["type"], rec["addr"]))
say("== records sharing 238's value table ==")
for rec in records:
    if rec["data"] == d238["data"]:
        nm, _ = name_of(rec["id"]) if rec["id"] < 2915 else ("", "")
        say("  id %d name %s bytes %d stride %d second 0x%x type %d at 0x%08x" % (
            rec["id"], nm, rec["bytes"], rec["stride"], rec["second"], rec["type"], rec["addr"]))

strides = {}
nonzero_second = 0
for rec in records:
    strides[rec["stride"]] = strides.get(rec["stride"], 0) + 1
    if rec["second"]:
        nonzero_second += 1
say("stride histogram " + ", ".join("%s:%d" % (k, strides[k]) for k in sorted(strides)))
say("records with a non-zero +08 pointer %d" % nonzero_second)

say("== names and keys ==")
for sid in (238, 1692, 1693, 2154, 2155, 163):
    nm, slot = name_of(sid)
    map_at = 0x6062555C + sid * 4
    key, index = struct.unpack_from("<HH", image, off(map_at))
    say("  id %d name %s map 0x%08x raw %s key 0x%04x index %d" % (
        sid, nm, map_at, raw(map_at, 4).hex(), key, index))
    say("    name slot raw %s" % slot)

say("== option records ==")


def opts(addr, n, label):
    say(label)
    for i in range(n):
        rec = raw(addr + i * 12, 12)
        value, kind, text, ptr = struct.unpack_from("<IHHI", rec)
        say("  [%d] 0x%08x raw %s value %d kind %d id 0x%04x ptr 0x%08x" % (
            i, addr + i * 12, rec.hex(), value, kind, text, ptr))


opts(0x6158BA04, 2, "priority 0x6158ba04")
opts(0x6158BA1C, 10, "zone 0x6158ba1c")
zone_vals = [struct.unpack_from("<I", raw(0x6158BA1C + i * 12, 12))[0] for i in range(10)]
zone_bytes = list(raw(d238["data"], d238["bytes"]))
say("zone option values %s" % zone_vals)
say("238 value-table bytes %s" % zone_bytes)
say("238 table equals zone values in order: %s" % (zone_bytes == zone_vals))
say("238 table as a set equals zone values: %s" % (sorted(zone_bytes) == sorted(zone_vals)))


def row(addr, label):
    b = raw(addr, 36)
    ident, kind, text, cls, options, count, gap, cls2, alt, altn = struct.unpack_from("<IHHIIIIIII", b)
    say("%s 0x%08x raw %s" % (label, addr, b.hex()))
    say("  +00 id %d +04 kind %d +06 label 0x%04x +08 class 0x%08x" % (ident, kind, text, cls))
    say("  +0c options 0x%08x +10 count %d +14 0x%08x" % (options, count, gap))
    say("  +18 class 0x%08x +1c alternate 0x%08x +20 alternate-count %d" % (cls2, alt, altn))


row(0x6158DC44, "page27 row0")
row(0x6158DC68, "page27 row1")
row(0x6158DC8C, "page28 row0 UI238")

# A stride-0x40 record, the other population in the same table, for the field contrast.
sample = next(rec for rec in records if rec["stride"] == 0x40)
show("== one stride-0x40 record ==", sample)
say("done")
Path("work/out/descriptors-g1.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
