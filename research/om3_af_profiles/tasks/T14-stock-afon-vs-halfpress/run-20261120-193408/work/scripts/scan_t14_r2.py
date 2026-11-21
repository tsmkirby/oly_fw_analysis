# T14 correction scan. Read-only on the image. Writes only under work/out/r2.
# Hashes the image and the Ghidra project files before any other use in this process.
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(r"C:\Dev\OM3-tasks\T14-stock-afon-vs-halfpress\ws")
IMAGE = ROOT / "inputs" / "00_0100_50000020.decoded.bin"
RES = ROOT / "inputs" / "02_0106_458c0020.decoded.bin"
OUT = ROOT / "work" / "out" / "r2"
BASE = 0x60021020
EXPECT_MAIN = "5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59"
EXPECT_RES = "3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059"

PROJECT = [
    ROOT / "projects" / "OM3_main_full.gpr",
    ROOT / "projects" / "OM3_main_full.rep" / "project.prp",
    ROOT / "projects" / "OM3_main_full.rep" / "idata" / "00" / "00000000.prp",
    ROOT / "projects" / "OM3_main_full.rep" / "idata" / "00" / "~00000000.db" / "db.1.gbf",
    ROOT / "projects" / "OM3_main_full.rep" / "idata" / "00" / "~00000000.db" / "db.2.gbf",
]

CALL_TARGETS = [
    0x609B3C79, 0x609B3BB2, 0x609B3B98, 0x609B3BA7, 0x609B348A, 0x609B3481,
    0x6071128B, 0x6071129F, 0x60447DE4, 0x60216E4B, 0x60216E6C, 0x60AFAB08,
    0x60AFABDC, 0x60AF40D8, 0x610A5620, 0x610A58C7, 0x610A6323, 0x610A25F1,
    0x610A240C, 0x610A2DF1, 0x610AEF37, 0x610B962A, 0x610B9653, 0x60415E53,
    0x60063431, 0x609B3BCA, 0x60063380, 0x60063356, 0x60873DAF, 0x60873DB4,
    0x60890A0D, 0x6004CDF8, 0x6004CEFD, 0x609024AA, 0x609025AA, 0x610A3735,
    0x61090E0A, 0x60903E55, 0x60900258, 0x609052A1,
]
PTRS = CALL_TARGETS + [
    0xA33D4A94, 0xA33D4A96, 0xA33D4A98, 0xA33D4A9A, 0xA33F2CBE, 0xA33F2CE0,
    0xA33CA30D, 0x612F20C8, 0x612F20A8, 0x61308918,
]
KEYS = [0x9A41, 0x1DD1, 0x84D1, 0x88B2, 0x1DF1, 0x1E01, 0xE951, 0x9FA1, 0xDFA1, 0x90A1]
EVENTS = [0x01000032, 0x01000033, 0x01000002, 0x01000003, 0x010000CC, 0x010000CD,
          0x01050007, 0x01050008, 0x010000CC]


def sha(p):
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    image_sha = sha(IMAGE)
    res_sha = sha(RES)
    if image_sha != EXPECT_MAIN:
        raise SystemExit("main sha " + image_sha)
    if res_sha != EXPECT_RES:
        raise SystemExit("res sha " + res_sha)
    before = {
        "when": "before r2 scan and before r2 Ghidra launch",
        "image_sha256": image_sha,
        "image_bytes": IMAGE.stat().st_size,
        "resource_sha256": res_sha,
        "resource_bytes": RES.stat().st_size,
        "project": [{"path": str(p.relative_to(ROOT)).replace("\\", "/"), "sha256": sha(p), "bytes": p.stat().st_size} for p in PROJECT],
    }
    (OUT / "hashes-before.json").write_text(json.dumps(before, indent=2) + "\n", encoding="utf-8")

    image = IMAGE.read_bytes()
    n = len(image)

    def addr_of(i):
        return BASE + i

    def in_image(tgt):
        return BASE <= tgt < BASE + n

    calls = {hex(t): [] for t in CALL_TARGETS}
    i = 0
    while i + 7 < n:
        b = image[i]
        addr = addr_of(i)
        kind = None
        tgt = None
        if b == 0xCD and i + 4 < n:
            rel = struct.unpack_from("<h", image, i + 1)[0]
            tgt = (addr + rel) & 0xFFFFFFFF
            kind = "call16"
        elif b == 0xDD and i + 6 < n:
            rel = struct.unpack_from("<i", image, i + 1)[0]
            tgt = (addr + rel) & 0xFFFFFFFF
            kind = "call32"
        elif b == 0xCC and i + 2 < n:
            rel = struct.unpack_from("<h", image, i + 1)[0]
            tgt = (addr + rel) & 0xFFFFFFFF
            kind = "jmp16"
        elif b == 0xDC and i + 4 < n:
            rel = struct.unpack_from("<i", image, i + 1)[0]
            tgt = (addr + rel) & 0xFFFFFFFF
            kind = "jmp32"
        if kind and tgt in CALL_TARGETS:
            calls[hex(tgt)].append({"at": hex(addr), "kind": kind, "bytes": image[i:i + 7].hex()})
        i += 1

    ptrs = {}
    for a in PTRS:
        pat = struct.pack("<I", a)
        hits = []
        start = 0
        while len(hits) < 60:
            j = image.find(pat, start)
            if j < 0:
                break
            hits.append(hex(addr_of(j)))
            start = j + 1
        ptrs[hex(a)] = hits

    def next_call(j, limit=20):
        end = min(n - 7, j + limit)
        k = j
        while k < end:
            b = image[k]
            addr = addr_of(k)
            if b == 0xCD:
                rel = struct.unpack_from("<h", image, k + 1)[0]
                return {"at": hex(addr), "kind": "call16", "target": hex((addr + rel) & 0xFFFFFFFF)}
            if b == 0xDD:
                rel = struct.unpack_from("<i", image, k + 1)[0]
                return {"at": hex(addr), "kind": "call32", "target": hex((addr + rel) & 0xFFFFFFFF)}
            k += 1
        return None

    key_sites = {}
    for key in KEYS:
        sites = []
        pat16 = struct.pack("<H", key)
        # 16-bit mov to D0: 2c imm16. 32-bit mov to D0: fc cc imm32.
        start = 0
        while len(sites) < 80:
            j = image.find(pat16, start)
            if j < 0:
                break
            start = j + 1
            kind = None
            at = None
            if j >= 1 and image[j - 1] == 0x2C:
                kind = "mov16-d0"
                at = j - 1
            elif j >= 2 and image[j - 2] == 0xFC and image[j - 1] == 0xCC and j + 4 <= n and image[j + 2] == 0 and image[j + 3] == 0:
                kind = "mov32-d0"
                at = j - 2
            if kind is None:
                continue
            sites.append({
                "at": hex(addr_of(at)),
                "kind": kind,
                "next_call": next_call(at + (4 if kind == "mov16-d0" else 6)),
            })
        key_sites[hex(key)] = sites

    shadow = {}
    for a in (0xA33D4A94, 0xA33D4A96, 0xA33D4A98, 0xA33D4A9A):
        pat = struct.pack("<I", a)
        hits = []
        start = 0
        while True:
            j = image.find(pat, start)
            if j < 0:
                break
            prev = image[max(0, j - 2):j].hex()
            hits.append({"imm_at": hex(addr_of(j)), "prev2": prev})
            start = j + 1
        shadow[hex(a)] = hits

    def row(addr):
        off = addr - BASE
        raw = image[off:off + 16]
        words = struct.unpack_from("<4I", raw)
        return {"at": hex(addr), "hex": raw.hex(), "w0": hex(words[0]), "w1": hex(words[1]), "w2": hex(words[2]), "w3": hex(words[3])}

    fixed_rows = [row(a) for a in (
        0x61339090, 0x613390A0, 0x6131C290, 0x6131BE80, 0x6131BE90,
        0x6131C8F0, 0x6131C900, 0x6132ADD4, 0x612F20A8, 0x612F20C8,
    )]

    event_hits = {}
    for ev in (0x01000032, 0x01000033, 0x01000002, 0x01000003, 0x010000CC, 0x010000CD, 0x01050007, 0x01050008):
        pat = struct.pack("<I", ev)
        hits = []
        start = 0
        while len(hits) < 30:
            j = image.find(pat, start)
            if j < 0:
                break
            start = j + 1
            a = addr_of(j)
            if not (0x61200000 <= a < 0x61480000):
                continue
            raw = image[j:j + 16]
            words = struct.unpack_from("<4I", raw)
            hits.append({"at": hex(a), "hex": raw.hex(), "w3": hex(words[3])})
        event_hits[hex(ev)] = hits

    # Release dispatch pairs. Decompiler bound is 0x61308918..0x61308a17; read a wider window and keep plausible pairs.
    table_off = 0x61308918 - BASE
    pairs = []
    for k in range(0, 0x400, 8):
        w0, w1 = struct.unpack_from("<2I", image, table_off + k)
        if w0 == 0 and w1 == 0:
            continue
        if w0 < 0x100 and 0x60000000 <= w1 < 0x62000000:
            pairs.append({"at": hex(0x61308918 + k), "id": w0, "handler": hex(w1)})

    checks = {
        "writer_call_609b3b98": image[0x609B3B98 - BASE:0x609B3B98 - BASE + 5].hex(),
        "writer_call_609b3bbc": image[0x609B3BBC - BASE:0x609B3BBC - BASE + 5].hex(),
        "e951_store_609b39f0": image[0x609B39E0 - BASE:0x609B39F6 - BASE].hex(),
        "sync_call_60873e1f": image[0x60873E1F - BASE:0x60873E1F - BASE + 7].hex(),
        "gate_610aef3d": image[0x610AEF3D - BASE:0x610AEF4A - BASE].hex(),
        "latch_609024b8": image[0x609024AA - BASE:0x609024D2 - BASE].hex(),
    }

    out = {
        "image_sha256": image_sha,
        "base": hex(BASE),
        "calls": calls,
        "pointers": ptrs,
        "key_sites": key_sites,
        "shadow": shadow,
        "fixed_rows": fixed_rows,
        "event_hits": event_hits,
        "release_table_pairs": pairs,
        "checks": checks,
    }
    (OUT / "scan-r2.json").write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print("calls", {k: len(v) for k, v in calls.items() if v})
    print("release pairs", len(pairs))
    print("shadow", {k: len(v) for k, v in shadow.items()})
    for ev, hits in event_hits.items():
        print(ev, len(hits), hits[:4])


if __name__ == "__main__":
    main()
