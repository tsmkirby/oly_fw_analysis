import pathlib
root = pathlib.Path(__file__).resolve().parent
src = (root / "afon_zone_probe_v4.mjs").read_text(encoding="utf-8")
src = src.replace("afon_zone_probe_v4.mjs", "afon_zone_probe_v5.mjs")
src = src.replace("afon-page-v4.png", "afon-page-v5.png").replace("afon-chooser-v4.png", "afon-chooser-v5.png")
old = """    l.observe(native(0x60063380), (lab, r) => {
"""
new = """    for (const [addr, name] of [[0x61203e9b, 'open-type'], [0x61203ede, 'open-virtual'], [0x61203ee9, 'open-default'], [0x61203f50, 'open-match'], [0x61203f61, 'open-noalt']]) {
      l.observe(native(addr), (lab, r) => emit({ step: name, d0: r.d0 >>> 0, a0: hex(r.a0 >>> 0), a1: hex(r.a1 >>> 0) }), 'obs-' + name);
    }
    l.observe(native(0x60063380), (lab, r) => {
"""
if old not in src:
    raise SystemExit('observe anchor missing')
src = src.replace(old, new, 1)
old2 = """    press('down');
    snap('down-0');
    press('down');
    snap('down-1');
    press('ok');
"""
new2 = """    press('ok');
    snap('row0-ok');
    press('menu');
    snap('back');
    press('down');
    press('down');
    press('ok');
"""
if old2 not in src:
    raise SystemExit('nav anchor missing')
src = src.replace(old2, new2, 1)
# Drop the ten-option scan; it never left the page.
src = src.replace("""    for (let n = 0; n < 10; n++) {
      press('right');
      snap('option-' + n);
    }
    press('menu');
    snap('cancel');
""", "")
(root / "afon_zone_probe_v5.mjs").write_text(src, encoding="utf-8")
print('v5')
