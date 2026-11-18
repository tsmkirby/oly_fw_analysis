# Frozen copy of v1 with the zone-row navigation corrected. v1 is left as it is.
import pathlib
root = pathlib.Path(__file__).resolve().parent
src = (root / "afon_zone_probe_v1.mjs").read_text(encoding="utf-8")
src = src.replace("afon_zone_probe_v1.mjs", "afon_zone_probe_v2.mjs")
src = src.replace("afon-page-v1.png", "afon-page-v2.png")
src = src.replace("afon-chooser-v1.png", "afon-chooser-v2.png")
old = """  const scr = snap('af-button-page');
  shot(resolve('work/out/afon-page-v2.png'), scr.frame);
  if (mode === 'discover') {
    for (let n = 0; n < 4; n++) {
      press('down');
      snap('down-' + n);
    }
    press('ok');
    const chooser = snap('chooser');
    shot(resolve('work/out/afon-chooser-v2.png'), chooser.frame);
    press('right');
    snap('chooser-right');
    press('ok');
    snap('chooser-ok');
  }
"""
new = """  const copies = [];
  l.observe(native(0x611c782f), (lab, r) => {
    if (copies.length >= 80) return;
    const src = r.a1 >>> 0;
    if (src < 0x60000000) return;
    const raw = Buffer.from(lab.sim.read(src, 12));
    copies.push({ src: hex(src), value: raw.readUInt32LE(0), kind: raw.readUInt16LE(4), id: raw.readUInt16LE(6) });
  }, 'obs-desc-copy');
  const scr = snap('af-button-page');
  shot(resolve('work/out/afon-page-v2.png'), scr.frame);
  emit({ step: 'cells-before-zone', cells: cells() });
  if (mode === 'discover') {
    // Entry highlights row 0. Two downs reach the new third row. v1's four
    // downs wrapped onto the AF-ON priority row.
    press('down');
    snap('down-0');
    press('down');
    snap('down-1');
    press('ok');
    const chooser = snap('chooser');
    shot(resolve('work/out/afon-chooser-v2.png'), chooser.frame);
    emit({ step: 'chooser-copies', copies });
    for (let n = 0; n < 10; n++) {
      press('right');
      snap('option-' + n);
    }
    press('menu');
    snap('cancel');
    emit({ step: 'cells-after-cancel', cells: cells(), profile: profile() });
    press('down');
    press('down');
    press('ok');
    snap('chooser-again');
    press('right');
    snap('confirm-highlight');
    press('ok');
    snap('confirmed');
    emit({ step: 'cells-after-confirm', cells: cells(), profile: profile() });
  }
"""
if old not in src:
    raise SystemExit('navigation block not found')
src = src.replace(old, new, 1)
(root / "afon_zone_probe_v2.mjs").write_text(src, encoding="utf-8")
print("wrote v2", len(src))
