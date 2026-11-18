import pathlib
root = pathlib.Path(__file__).resolve().parent
src = (root / "afon_zone_probe_v2.mjs").read_text(encoding="utf-8")
src = src.replace("afon_zone_probe_v2.mjs", "afon_zone_probe_v3.mjs")
src = src.replace("afon-page-v2.png", "afon-page-v3.png")
src = src.replace("afon-chooser-v2.png", "afon-chooser-v3.png")
old = """    emit({
      step: 'runtime-redirect',
"""
new = """    const desc = 0x6031e9a0;
    const node = 0x6031e9b8;
    const bucket = 0x62a84970 + (UI & 0x7f) * 4;
    const head = l.sim.u32(bucket);
    const nodeBytes = Buffer.alloc(8);
    nodeBytes.writeUInt32LE(desc, 0);
    nodeBytes.writeUInt32LE(head, 4);
    l.sim.write(node, nodeBytes);
    const headBytes = Buffer.alloc(4);
    headBytes.writeUInt32LE(node, 0);
    l.sim.write(bucket, headBytes);
    const looked = l.call(native(0x604058bc), { d0: UI }, null, null, 200000);
    emit({
      step: 'editor-descriptor',
      label: 'EMULATOR-ONLY',
      desc: hex(desc),
      node: hex(node),
      bucket: hex(bucket),
      previous: hex(head),
      lookup: hex(looked.a0 >>> 0),
      bytes: Array.from(l.sim.read(desc, 20)),
    });
    emit({
      step: 'runtime-redirect',
"""
if old not in src:
    raise SystemExit('anchor missing')
src = src.replace(old, new, 1)
(root / "afon_zone_probe_v3.mjs").write_text(src, encoding="utf-8")
print("v3", len(src))
