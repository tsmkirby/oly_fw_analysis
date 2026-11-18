from pathlib import Path
src = Path("work/scripts/proto_r1_v2.mjs").read_text(encoding="utf-8")
src = src.replace("proto_r1_v2", "proto_r1_v4").replace("proto-r1-v1-", "proto-r1-v4-")
src = src.replace("Phase B v2. Kind 12, and the alternate option pointer and count set to 0.",
                  "Phase B v4. Kind 12, alt cleared, descriptor template pointer copied from UI 2154, count 10.")
old = "  l.sim.write(0x6031e994, z);\n"
desc = bytes.fromhex("6f3d8000b7906160000000000a00010000010000")
new = "  l.sim.write(0x6031e994, z);\n  l.sim.write(0x6031e9a0, Buffer.from([" + ",".join(str(b) for b in desc) + "]));\n"
if old not in src:
    raise SystemExit('pattern missing')
Path("work/scripts/proto_r1_v4.mjs").write_text(src.replace(old, new, 1), encoding="utf-8")
print("ok", "proto-r1-v4-" in Path("work/scripts/proto_r1_v4.mjs").read_text(encoding="utf-8"))
