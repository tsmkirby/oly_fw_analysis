# Static audit of the unresolved 0x5b82 items, plus the profile byte budget.
# Checks listed instruction bytes and table halfwords against the main image.
# Does not start the emulator. Exits 1 on the first failed byte assertion.
import hashlib
import json
import struct
import sys
from pathlib import Path

BASE = 0x60021020
IMAGE = Path("inputs/00_0100_50000020.decoded.bin")
KEY = 0x5B82
TABLE_B = 0x60242324
STRIDE = 0x9C
COUNT_B = 0x3D  # indices 0x00..0x3C
UNNAMED = [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14, 15]
NAMED = {5: 2017, 12: 2031, 13: 2034}

data = IMAGE.read_bytes()
assert len(data) == 33554432, len(data)
image_sha = hashlib.sha256(data).hexdigest()
assert image_sha == "5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59"


def off(addr):
    o = addr - BASE
    if o < 0 or o >= len(data):
        raise AssertionError(f"address {addr:#x} outside image")
    return o


def get(addr, n):
    o = off(addr)
    return data[o : o + n]


def hexb(buf):
    return " ".join(f"{b:02x}" for b in buf)


def need(addr, expected, label):
    got = get(addr, len(expected))
    if got != expected:
        raise AssertionError(f"{label} at {addr:#x}: got {hexb(got)} expected {hexb(expected)}")
    return {"addr": f"{addr:#x}", "bytes": hexb(got), "label": label}


def u16(addr):
    return struct.unpack_from("<H", data, off(addr))[0]


def u32(addr):
    return struct.unpack_from("<I", data, off(addr))[0]


def cstr(addr, limit=80):
    raw = get(addr, limit)
    end = raw.find(b"\x00")
    if end < 0:
        end = limit
    return raw[:end].decode("latin1")


checks = []
checks.append(need(0x60197541, bytes.fromhex("5810"), "mov (0x10,sp),D0"))
checks.append(need(0x60197543, bytes.fromhex("2804"), "add 0x4,D0  -> record+0x50"))
checks.append(need(0x60197545, bytes.fromhex("4214"), "mov D0,(0x14,sp)"))
checks.append(need(0x6019756d, bytes.fromhex("5c10"), "mov (0x10,sp),A0"))
checks.append(need(0x6019756f, bytes.fromhex("f8bd26"), "movhu (0x26,sp),D1"))
checks.append(need(0x60197572, bytes.fromhex("f80c18"), "mov (0x18,A0),D3  record+0x64"))
checks.append(need(0x60197575, bytes.fromhex("5c14"), "mov (0x14,sp),A0"))
checks.append(need(0x60197579, bytes.fromhex("f060"), "movhu (A0),D0  key at record+0x50"))
checks.append(need(0x6019757b, bytes.fromhex("ed"), "add D3,D1"))
checks.append(need(0x6019757c, bytes.fromhex("1d"), "exthu D1  index"))
checks.append(need(0x6019757f, bytes.fromhex("ddb2beecfff028"), "call 0x60063431"))
checks.append(need(0x60197608, bytes.fromhex("5c10"), "mov (0x10,sp),A0"))
checks.append(need(0x6019760a, bytes.fromhex("2006"), "add 0x6,A0  -> record+0x52"))
checks.append(need(0x6019760c, bytes.fromhex("f060"), "movhu (A0),D0  key at record+0x52"))
checks.append(need(0x6019760e, bytes.fromhex("a000"), "cmp 0x0,D0"))
checks.append(need(0x60197610, bytes.fromhex("c816"), "beq skip when key is 0"))
checks.append(need(0x60197617, bytes.fromhex("f8041c"), "mov (0x1c,A0),D1"))
checks.append(need(0x6019761c, bytes.fromhex("1d"), "exthu D1"))
checks.append(need(0x6019761f, bytes.fromhex("dd12beecfff028"), "call 0x60063431"))
checks.append(need(0x6019764d, bytes.fromhex("2006"), "sibling add 0x6,A0 on (0xc,sp)"))
checks.append(need(0x6019764f, bytes.fromhex("f060"), "sibling key load"))

# The saved pointer at (0x10,sp) is record+0x4c. Same prologue as the accepted listing.
checks.append(need(0x601972F8, bytes.fromhex("904c"), "mov 0x4c,A0 inside FUN_601972f1"))

keys = {0x4C: [], 0x4E: [], 0x50: [], 0x52: []}
halfword_hits = []
index_terms = []
for i in range(COUNT_B):
    rec = TABLE_B + i * STRIDE
    for rel in keys:
        value = u16(rec + rel)
        keys[rel].append(value)
        if value == KEY:
            halfword_hits.append({"index": i, "rel": rel, "addr": f"{rec + rel:#x}"})
    # Every aligned halfword in the record.
    for rel in range(0, STRIDE, 2):
        if u16(rec + rel) == KEY:
            halfword_hits.append({"index": i, "rel": rel, "addr": f"{rec + rel:#x}", "any": True})
    index_terms.append(
        {
            "index": i,
            "key_50": u16(rec + 0x50),
            "key_52": u16(rec + 0x52),
            "dword_64": u32(rec + 0x64),
            "dword_68": u32(rec + 0x68),
        }
    )

end = TABLE_B + COUNT_B * STRIDE
assert end == 0x60244850, hex(end)
assert not halfword_hits, halfword_hits
nonzero_50 = sorted({v for v in keys[0x50] if v})
nonzero_52 = sorted({v for v in keys[0x52] if v})

# Three mov 0x5b8 sites. The immediate is 0x5b8, not key 0x5b82.
checks.append(need(0x6118BF47, bytes.fromhex("24b805"), "mov 0x5b8,A0"))
checks.append(need(0x6118BF4A, bytes.fromhex("f178"), "add A2,A0  object+0x5b8"))
checks.append(need(0x6118BF4C, bytes.fromhex("8562"), "mov 0x62,D1"))
checks.append(need(0x6118BF45, bytes.fromhex("801f"), "mov 0x1f,D0 length/id"))
checks.append(need(0x6118C058, bytes.fromhex("24b805"), "mov 0x5b8,A0"))
checks.append(need(0x6118C05B, bytes.fromhex("f178"), "add A2,A0"))
checks.append(need(0x6118C05D, bytes.fromhex("8562"), "mov 0x62,D1"))
checks.append(need(0x610CD5AC, bytes.fromhex("91"), "FUN_610cd5ac mov A0,A1"))
checks.append(need(0x610CD6BD, bytes.fromhex("87"), "FUN_610cd6bd mov D1,D3"))
checks.append(need(0x610CD6BE, bytes.fromhex("97"), "mov A1,A3 keeps object+0x5b8"))
checks.append(need(0x610CD6C1, bytes.fromhex("f8620c"), "movhu (0xc,A2),D0 different pointer"))
checks.append(need(0x610CD71B, bytes.fromhex("9c"), "mov A3,A0 copy source"))
checks.append(need(0x610CD71C, bytes.fromhex("dded51f3ee"), "call 0x50002909"))
checks.append(need(0x616DDB03, bytes.fromhex("2db805"), "mov 0x5b8,D1"))
checks.append(need(0x616DDB01, bytes.fromhex("8002"), "mov 0x2,D0"))
checks.append(need(0x616DDB06, bytes.fromhex("fcddd7317c61"), "mov 0x617c31d7,A1"))
checks.append(need(0x616A1CFE, bytes.fromhex("86"), "mov D1,D2 keeps the immediate"))
checks.append(need(0x616A1D41, bytes.fromhex("4a0c"), "mov D2,(0xc,sp)"))

fmt = cstr(0x617BEAB0)
cpp = cstr(0x617C31D7)
assert "%u" in fmt, fmt
assert "CAvpiVenHEVCCodec.cpp" in cpp, cpp

# Neighbouring field offsets in the same function are other object displacements.
checks.append(need(0x6118BEE0, bytes.fromhex("248c03"), "mov 0x38c,A0 sibling offset"))
checks.append(need(0x6118BEF6, bytes.fromhex("24e803"), "mov 0x3e8,A0 sibling offset"))
checks.append(need(0x6118BF96, bytes.fromhex("241a06"), "mov 0x61a,A0 sibling offset"))

# Five unidentified 82 5b occurrences.
sites = [
    (0x607C69F4, True),
    (0x607CB986, True),
    (0x60539E07, False),
    (0x607C8E19, False),
    (0x607E2EF9, False),
]
site_rows = []
for addr, aligned in sites:
    window = get(addr - 8, 24)
    if aligned:
        assert u16(addr) == KEY
    else:
        assert data[off(addr)] == 0x82 and data[off(addr) + 1] == 0x5B
    refs = []
    needle = struct.pack("<I", addr)
    start = 0
    while True:
        hit = data.find(needle, start)
        if hit < 0:
            break
        refs.append(f"{BASE + hit:#x}")
        start = hit + 1
        if len(refs) > 8:
            break
    site_rows.append(
        {
            "addr": f"{addr:#x}",
            "aligned_u16": aligned,
            "value": f"{u16(addr):#x}" if aligned else None,
            "window": hexb(window),
            "le32_pointers": refs,
        }
    )

# Normal-operation anchors.
checks.append(need(0x600E5874, bytes.fromhex("825b1000"), "registration key 0x5b82 count 16"))
reg_payload = get(0x600E5874 + 4, 32)
assert reg_payload == bytes(32), hexb(reg_payload)
checks.append(need(0x606274E0, bytes.fromhex("825b0500"), "UI 2017 index 5"))
checks.append(need(0x60627518, bytes.fromhex("825b0c00"), "UI 2031 index 12"))
checks.append(need(0x60627524, bytes.fromhex("825b0d00"), "UI 2034 index 13"))

# Capacity. Cell widths are the bit widths: no tighter domain is applied.
fields = [
    {"field": "zone 0x99a1", "indices": "banks 1, 5, 3", "cells": 3, "bits_each": 8},
    {"field": "size 0x9a41[0]", "indices": "0", "cells": 1, "bits_each": 8},
    {"field": "position 0x5962", "indices": "banks 1, 5, 3", "cells": 3, "bits_each": 16},
    {"field": "custom 0x1dd1", "indices": "0..9", "cells": 10, "bits_each": 8},
    {"field": "custom 0x1de1", "indices": "0..7", "cells": 8, "bits_each": 8},
]
payload = sum(f["cells"] * f["bits_each"] for f in fields)
for f in fields:
    f["bits"] = f["cells"] * f["bits_each"]
# Even the smaller set that keeps every 0x1de1 byte and only the eight
# 0x1dd1 indices the converter reads is still 26 bytes before a marker.
smaller = payload - 2 * 8
budget = {
    "unnamed_indices": UNNAMED,
    "unnamed_bytes": len(UNNAMED) * 2,
    "fields": fields,
    "payload_bits": payload,
    "payload_bytes": payload // 8,
    "payload_bytes_if_1dd1_limited_to_indices_2_through_9": smaller // 8,
    "marker_min_bytes": 2,
    "checksum_min_bytes": 2,
    "fits_with_marker_and_checksum": False,
    "reason": "payload alone is 28 bytes, and 26 bytes remain after a 2-byte marker is still short of a checksum",
}

doc = {
    "image_sha256": image_sha,
    "image_bytes": len(data),
    "checks": checks,
    "table_b": {
        "base": f"{TABLE_B:#x}",
        "stride": f"{STRIDE:#x}",
        "count": COUNT_B,
        "end_exclusive": f"{end:#x}",
        "halfword_0x5b82_hits": halfword_hits,
        "distinct_nonzero_key_at_plus_0x50": [f"{v:#x}" for v in nonzero_50],
        "distinct_nonzero_key_at_plus_0x52": [f"{v:#x}" for v in nonzero_52],
        "index_term_sample": index_terms[:3],
    },
    "format_string": fmt,
    "cpp_string": cpp,
    "data_sites": site_rows,
    "registration_payload_32": hexb(reg_payload),
    "named_indices": NAMED,
    "budget": budget,
    "stop": True,
}
text = json.dumps(doc, indent=2) + "\n"
Path("work/out").mkdir(parents=True, exist_ok=True)
Path("work/out/audit-5b82-t10.json").write_text(text, encoding="utf-8")
sys.stdout.write(
    f"checks {len(checks)} table_hits {len(halfword_hits)} "
    f"payload_bytes {budget['payload_bytes']} stop {budget['fits_with_marker_and_checksum'] is False}\n"
)
