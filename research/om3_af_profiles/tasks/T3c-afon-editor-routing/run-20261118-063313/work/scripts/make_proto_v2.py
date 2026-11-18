from pathlib import Path
src = Path("work/scripts/proto_r1_v1.mjs").read_text(encoding="utf-8")
src = src.replace("proto_r1_v1", "proto_r1_v2")
src = src.replace("Phase B v1. One native data change: third-row kind 4 -> 12 at 0x6031e97c.",
                  "Phase B v2. Kind 12, and the alternate option pointer and count set to 0.")
old = """  writeByte(KIND_ADDR, 0x0c);
  emit({ step: 'kind', addr: '0x6031e97c', before: beforeKind, after: l.sim.read(KIND_ADDR, 1)[0], note: 'native data, third row kind 12' });
"""
new = """  writeByte(KIND_ADDR, 0x0c);
  const z = Buffer.alloc(8);
  l.sim.write(0x6031e994, z);
  emit({ step: 'kind', addr: '0x6031e97c', before: beforeKind, after: l.sim.read(KIND_ADDR, 1)[0], alt: [...l.sim.read(0x6031e994, 8)], note: 'kind 12 and alt pointer cleared' });
"""
if old not in src:
    raise SystemExit('pattern missing')
Path("work/scripts/proto_r1_v2.mjs").write_text(src.replace(old, new, 1), encoding="utf-8")
print("wrote v2")
