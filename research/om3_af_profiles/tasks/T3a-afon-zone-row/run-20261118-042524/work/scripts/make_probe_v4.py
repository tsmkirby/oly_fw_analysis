import pathlib
root = pathlib.Path(__file__).resolve().parent
src = (root / "afon_zone_probe_v3.mjs").read_text(encoding="utf-8")
src = src.replace("afon_zone_probe_v3.mjs", "afon_zone_probe_v4.mjs")
src = src.replace("afon-page-v3.png", "afon-page-v4.png")
src = src.replace("afon-chooser-v3.png", "afon-chooser-v4.png")
old = """    l.hook(native(0x60419446), (h, r) => {
      if (!own(r)) { l.passthrough(r); return; }
      h.finish(r, { d0: 0 });
    }, 'EMULATOR-ONLY afon mapped getter');
"""
new = """    l.hook(native(0x60419446), (h, r) => {
      if (!own(r)) { l.passthrough(r); return; }
      // Non-zero and unregistered. Key 0 makes the editor treat the row as unset.
      h.finish(r, { d0: 0xA70F });
    }, 'EMULATOR-ONLY afon mapped getter');
    l.observe(native(0x60063380), (lab, r) => {
      if ((r.d0 & 0xffff) === 0xA70F) emit({ step: 'sentinel-read', index: r.d1 >>> 0 });
    }, 'obs-sentinel-read');
    l.observe(native(0x60063431), (lab, r) => {
      if ((r.d0 & 0xffff) === 0xA70F) emit({ step: 'sentinel-write', index: r.d1 >>> 0, a1: r.a1 >>> 0 });
    }, 'obs-sentinel-write');
"""
if old not in src:
    raise SystemExit('hook block missing')
src = src.replace(old, new, 1)
(root / "afon_zone_probe_v4.mjs").write_text(src, encoding="utf-8")
print("v4 ok")
