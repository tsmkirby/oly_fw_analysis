# Supplemental T14 r2 scan: setter windows and shadow-store callers.
# Read-only on the image. Writes work/out/r2/setter-windows.json.
import json
import struct
from pathlib import Path

ROOT = Path(r"C:\Dev\OM3-tasks\T14-stock-afon-vs-halfpress\ws")
IMAGE = ROOT / "inputs" / "00_0100_50000020.decoded.bin"
OUT = ROOT / "work" / "out" / "r2" / "setter-windows.json"
BASE = 0x60021020
KEYS = {
    0x9A41: "9a41", 0x1DD1: "1dd1", 0x84D1: "84d1", 0x88B2: "88b2",
    0x1DF1: "1df1", 0x1E01: "1e01", 0xE951: "e951", 0x9FA1: "9fa1", 0xDFA1: "dfa1",
}
TARGETS = [0x60063431, 0x609B3BCA, 0x60983156, 0x6098310C]


def main():
    image = (IMAGE).read_bytes()
    n = len(image)

    def hits(target):
        found = []
        i = 0
        while i + 7 < n:
            b = image[i]
            addr = BASE + i
            tgt = None
            kind = None
            if b == 0xCD:
                rel = struct.unpack_from("<h", image, i + 1)[0]
                tgt = (addr + rel) & 0xFFFFFFFF
                kind = "call16"
            elif b == 0xDD and i + 5 < n:
                rel = struct.unpack_from("<i", image, i + 1)[0]
                tgt = (addr + rel) & 0xFFFFFFFF
                kind = "call32"
            if tgt == target:
                window = image[max(0, i - 24):i]
                present = []
                for key, name in KEYS.items():
                    pat = struct.pack("<H", key)
                    if pat in window:
                        present.append(name)
                if present or target != 0x60063431:
                    found.append({"at": hex(addr), "kind": kind, "keys_in_prev24": present, "prev": window.hex()})
            i += 1
        return found

    out = {hex(t): hits(t) for t in TARGETS}
    # Keep every 0x60063431 site that names a key, and a count of the rest.
    setter = out["0x60063431"]
    keyed = [s for s in setter if s["keys_in_prev24"]]
    out["0x60063431_keyed"] = keyed
    out["0x60063431_count"] = len(setter)
    out["0x60063431"] = keyed
    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print("setter", len(setter), "keyed", len(keyed))
    for t, rows in out.items():
        if isinstance(rows, list):
            print(t, len(rows))
            for row in rows[:8]:
                print(" ", row["at"], row["kind"], row["keys_in_prev24"])


if __name__ == "__main__":
    main()
