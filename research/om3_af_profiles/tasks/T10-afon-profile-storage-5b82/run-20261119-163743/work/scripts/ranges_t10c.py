# Static dump of editor-descriptor value tables for the AF-ON profile fields.
# Also records the stock setter's store path (no min/max compare) and the
# three singleton 0x5b82 sites. Does not start the emulator.
# Exits 1 on the first failed byte assertion.
import hashlib
import json
import struct
from pathlib import Path

BASE = 0x60021020
IMAGE = Path("inputs/00_0100_50000020.decoded.bin")
DESC_BASE = 0x6061912C
DESC_STRIDE = 20
DESC_COUNT = 0x6B0
MAP_BASE = 0x6062555C
MAP_LAST = 0x8CF
KEYS = {
    0x99A1: "zone 0x99a1",
    0x9A41: "size 0x9a41",
    0x5962: "position 0x5962",
    0x1DD1: "custom size 0x1dd1",
    0x1DE1: "custom step 0x1de1",
}
# UI ids named by earlier tasks. The map scan is the authority for the key.
NAMED_IDS = [
    163, 1333, 1338, 1339, 1303, 1304, 1617, 1618, 1619, 1620,
    1642, 1643, 1644, 1645, 1646, 1647, 1648, 1649,
    1657, 1658, 1659, 1660, 1661, 1662, 1663, 1664, 1665, 1666,
    1667, 1668, 1669, 1670, 1671, 1672, 1673, 1674,
    1803, 85, 40, 238, 1692, 1693,
]

data = IMAGE.read_bytes()
assert len(data) == 33554368, len(data)
digest = hashlib.sha256(data).hexdigest()
assert digest == "5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59"


def off(addr):
    o = addr - BASE
    if o < 0 or o + 1 > len(data):
        raise AssertionError(f"address {addr:#x} outside image")
    return o


def get(addr, n):
    o = off(addr)
    if o + n > len(data):
        raise AssertionError(f"read {addr:#x}+{n} outside image")
    return data[o:o + n]


def u16(addr):
    return struct.unpack_from("<H", data, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", data, off(addr))[0]


def hexb(buf):
    return "".join(f"{b:02x}" for b in buf)


def need(addr, expected, label):
    got = get(addr, len(expected))
    if got != expected:
        raise AssertionError(f"{label} at {addr:#x}: got {hexb(got)} expected {hexb(expected)}")
    return {"addr": f"{addr:#x}", "bytes": hexb(got), "label": label}


checks = []
# Table bounds cited by T3g, re-checked as bytes.
checks.append(need(0x60405876, bytes.fromhex("fcdf2c916160"), "mov 0x6061912c,A3"))
checks.append(need(0x604058B3, bytes.fromhex("fac9b006"), "cmp 0x6b0,D1"))
# UI-map load: id 0..0x8cf, index = id*4, halfword at 0x6062555c.
checks.append(need(0x6041944F, bytes.fromhex("facacf08"), "cmp 0x8cf,D2"))
checks.append(need(0x60419455, bytes.fromhex("56"), "asl2 D2"))
checks.append(need(0x60419456, bytes.fromhex("fcdc5c556260"), "mov 0x6062555c,A0"))
checks.append(need(0x6041945C, bytes.fromhex("f488"), "movhu (D2,A0),D0"))
# Known UI 238 record, from T3g.
checks.append(need(0x606200E4, bytes.fromhex("ee008000b1786160000000000a00010000010000"), "UI 238 descriptor"))
checks.append(need(0x606178B1, bytes.fromhex("00010203050a06070809"), "UI 238 value table"))
# Setter store of a byte cell: equality check, then movbu, no min/max compare.
checks.append(need(0x60063544, bytes.fromhex("f16a"), "add D2,A2 byte cell"))
checks.append(need(0x60063546, bytes.fromhex("f046"), "movbu (A2),D1 old"))
checks.append(need(0x60063548, bytes.fromhex("f19d"), "cmp A3,D1"))
checks.append(need(0x6006354A, bytes.fromhex("c81a"), "beq skip if equal"))
checks.append(need(0x6006354C, bytes.fromhex("f1dd"), "mov A3,D1"))
checks.append(need(0x6006354E, bytes.fromhex("f056"), "movbu D1,(A2)"))
# Halfword cell store, same shape.
checks.append(need(0x60063532, bytes.fromhex("f1dd"), "mov A3,D1 half"))
checks.append(need(0x60063534, bytes.fromhex("f076"), "movhu D1,(A2)"))

# UI map.
map_hits = []
for ui in range(0, MAP_LAST + 1):
    addr = MAP_BASE + ui * 4
    key = u16(addr)
    index = u16(addr + 2)
    if key in KEYS:
        map_hits.append({
            "ui": ui,
            "key": f"{key:#x}",
            "name": KEYS[key],
            "index": index,
            "map_addr": f"{addr:#x}",
            "bytes": hexb(get(addr, 4)),
        })

# Descriptor table, indexed by UI id. Duplicates are kept.
by_id = {}
desc_end = DESC_BASE + DESC_COUNT * DESC_STRIDE
assert desc_end == 0x606216EC
for i in range(DESC_COUNT):
    addr = DESC_BASE + i * DESC_STRIDE
    ui = u16(addr)
    by_id.setdefault(ui, []).append(addr)

VALUE_CAP = 64


def value_table(ptr, nbytes, stride):
    if ptr == 0 or nbytes == 0 or stride == 0:
        return {"present": False, "reason": "empty pointer, count, or stride"}
    if ptr < BASE or ptr - BASE + nbytes > len(data):
        return {"present": False, "reason": f"pointer {ptr:#x} count {nbytes} leaves the image"}
    raw = get(ptr, nbytes)
    count = nbytes // stride
    values = []
    if stride == 1:
        values = list(raw[:count])
    elif stride == 2 and nbytes % 2 == 0:
        values = list(struct.unpack_from("<" + "H" * count, raw))
    elif stride == 4 and nbytes % 4 == 0:
        values = list(struct.unpack_from("<" + "I" * count, raw))
    else:
        return {
            "present": True,
            "stride": stride,
            "byte_count": nbytes,
            "decoded": False,
            "head": hexb(raw[:min(32, nbytes)]),
        }
    shown = values[:VALUE_CAP]
    return {
        "present": True,
        "stride": stride,
        "byte_count": nbytes,
        "count": count,
        "decoded": True,
        "min": min(values) if values else None,
        "max": max(values) if values else None,
        "unique": len(set(values)),
        "values_head": shown,
        "values_truncated": len(values) > VALUE_CAP,
        "head_bytes": hexb(raw[:min(32, nbytes)]),
        "ptr": f"{ptr:#x}",
    }


def describe(ui):
    addrs = by_id.get(ui, [])
    rows = []
    for addr in addrs:
        raw = get(addr, 20)
        ptr = u32(addr + 4)
        second = u32(addr + 8)
        nbytes = u16(addr + 0xC)
        stride = u16(addr + 0xE)
        tail = u32(addr + 0x10)
        rows.append({
            "addr": f"{addr:#x}",
            "bytes": hexb(raw),
            "flags": f"{u16(addr + 2):#x}",
            "value_ptr": f"{ptr:#x}",
            "second_ptr": f"{second:#x}",
            "byte_count": nbytes,
            "stride": stride,
            "tail": f"{tail:#x}",
            "type": raw[0x11],
            "table": value_table(ptr, nbytes, stride),
        })
    return rows


wanted = set(NAMED_IDS)
for hit in map_hits:
    wanted.add(hit["ui"])

descriptors = []
for ui in sorted(wanted):
    descriptors.append({"ui": ui, "records": describe(ui)})

# Singleton sites. Dump the aligned dword and say whether an image dword
# equals the site or the aligned dword address. This does not by itself
# name a consumer.
singletons = []
for site in (0x615FBDB0, 0x615B9D55, 0x615B9D91):
    aligned = site & ~1
    window = get(site - 8, 24)
    dword = u32(aligned)
    singletons.append({
        "site": f"{site:#x}",
        "aligned": f"{aligned:#x}",
        "dword": f"{dword:#x}",
        "window": hexb(window),
        "image_range_dword": BASE <= dword < BASE + len(data),
    })

# Count image dwords equal to each singleton address and each aligned address.
targets = {}
for row in singletons:
    targets[int(row["site"], 16)] = 0
    targets[int(row["aligned"], 16)] = 0
for i in range(0, len(data) - 3, 4):
    word = struct.unpack_from("<I", data, i)[0]
    if word in targets:
        targets[word] += 1
for row in singletons:
    row["dword_ptrs_to_site"] = targets[int(row["site"], 16)]
    row["dword_ptrs_to_aligned"] = targets[int(row["aligned"], 16)]

doc = {
    "image_sha256": digest,
    "image_bytes": len(data),
    "checks": checks,
    "map_span": {"base": f"{MAP_BASE:#x}", "last_id": MAP_LAST, "hits": len(map_hits)},
    "map_hits": map_hits,
    "descriptors": descriptors,
    "setter_clamp": "none on the byte and halfword store paths checked above",
    "singletons": singletons,
}
out = Path("work/out/ranges-t10c.json")
out.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")

print(f"checks {len(checks)} map_hits {len(map_hits)} descriptors {len(descriptors)}")
for hit in map_hits:
    print(f"map ui {hit['ui']} key {hit['key']} index {hit['index']} {hit['bytes']}")
for row in descriptors:
    for rec in row["records"]:
        table = rec["table"]
        if table.get("decoded"):
            head = table["values_head"]
            extra = " ..." if table["values_truncated"] else ""
            print(
                f"ui {row['ui']} at {rec['addr']} type {rec['type']} "
                f"n {table['count']} stride {table['stride']} "
                f"min {table['min']} max {table['max']} unique {table['unique']} "
                f"values {head}{extra}"
            )
        else:
            print(f"ui {row['ui']} at {rec['addr']} type {rec['type']} table {table}")
    if not row["records"]:
        print(f"ui {row['ui']} no descriptor")
for row in singletons:
    print(
        f"singleton {row['site']} dword {row['dword']} "
        f"ptrs_site {row['dword_ptrs_to_site']} ptrs_aligned {row['dword_ptrs_to_aligned']}"
    )
