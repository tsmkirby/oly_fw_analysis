import pathlib
root = pathlib.Path(__file__).resolve().parent
src = (root / "afon_zone_probe_v4.mjs").read_text(encoding="utf-8").replace("\r\n", "\n")
src = src.replace("afon_zone_probe_v4.mjs", "afon_zone_probe_v6.mjs")
src = src.replace("afon-page-v4.png", "afon-page-v6.png").replace("afon-chooser-v4.png", "afon-chooser-v6.png")
old = """    const copies = [];
"""
new = r"""    let providerLogged = false;
    l.observe(native(0x61203a81), (lab, r) => {
      const viewer = r.a0 >>> 0;
      if (lab.sim.u32(viewer + 0x13e8) !== PAGE27) return;
      const model = lab.sim.u32(viewer + 0x13e0);
      const category = lab.sim.u32(model + 0x2c);
      const provider = lab.sim.u32(category + 4);
      const size = lab.sim.u32(provider + 0x48) & 0xffff;
      const dump = (off, n) => {
        const p = lab.sim.u32(provider + off);
        return { p: hex(p), bytes: p ? Array.from(lab.sim.read(p, n)) : null };
      };
      if (!providerLogged) {
        providerLogged = true;
        emit({
          step: 'provider-before', label: 'EMULATOR-ONLY', size,
          modelCount: lab.sim.u32(model + 0x30) >>> 0,
          ids: dump(0x54, 8), flags: dump(0x4c, 8), extra: dump(0x50, 16),
        });
      }
      if (size === 3) return;
      if (size !== 2) {
        emit({ step: 'provider-unexpected', size });
        return;
      }
      // EMULATOR-ONLY. The page descriptor already names three rows, but the
      // live provider was built from the stock source and still has two IDs.
      // Index 2 then reads as the invalid id 0xc80 and OK does nothing.
      for (const offset of [0x4c, 0x50, 0x54]) {
        const pointer = lab.sim.u32(provider + offset);
        if (!pointer) continue;
        const firstTwo = Buffer.from(lab.sim.read(pointer, 4));
        const third = Buffer.from(firstTwo.subarray(0, 2));
        if (offset === 0x54) third.writeUInt16LE(UI);
        const replacement = Buffer.alloc(4);
        replacement.writeUInt32LE(lab.alloc(Buffer.concat([firstTwo, third]), 2));
        lab.sim.write(provider + offset, replacement);
      }
      const newSize = Buffer.alloc(2);
      newSize.writeUInt16LE(3);
      lab.sim.write(provider + 0x48, newSize);
      emit({
        step: 'provider-extended', label: 'EMULATOR-ONLY',
        size: lab.sim.u32(provider + 0x48) & 0xffff,
        ids: Array.from(lab.sim.read(lab.sim.u32(provider + 0x54), 6)),
      });
    }, 'obs-provider-extend');
    const copies = [];
"""
if old not in src:
    raise SystemExit('anchor missing')
src = src.replace(old, new, 1)
src = src.replace("""    for (let n = 0; n < 10; n++) {
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
""", """    press('down');
    snap('option-down');
    press('ok');
    snap('option-ok');
    emit({ step: 'after-ok', cells: cells(), profile: profile() });
""")
(root / "afon_zone_probe_v6.mjs").write_text(src, encoding="utf-8")
print('v6')
