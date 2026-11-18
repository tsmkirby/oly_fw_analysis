from pathlib import Path
src = Path("work/scripts/proto_r1_v2.mjs").read_text(encoding="utf-8")
src = src.replace("proto_r1_v2", "proto_r1_v3").replace("proto-r1-v1-", "proto-r1-v3-")
src = src.replace("Phase B v2. Kind 12, and the alternate option pointer and count set to 0.",
                  "Phase B v3. Kind 12, alt cleared, option count forced to 2.")
old = "  l.sim.write(0x6031e994, z);\n"
new = "  l.sim.write(0x6031e994, z);\n  const count = Buffer.alloc(4); count.writeUInt32LE(2, 0); l.sim.write(0x6031e988, count);\n"
if old not in src:
    raise SystemExit('pattern missing')
Path("work/scripts/proto_r1_v3.mjs").write_text(src.replace(old, new, 1), encoding="utf-8")
print("v3", "proto-r1-v3-" in Path("work/scripts/proto_r1_v3.mjs").read_text(encoding="utf-8"))
