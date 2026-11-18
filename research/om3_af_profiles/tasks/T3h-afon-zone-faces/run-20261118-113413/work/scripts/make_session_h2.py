# Builds session_h2.mjs from the frozen session_h1.mjs and adds the face-key observer.
from pathlib import Path

src = Path("work/scripts/session_h1.mjs").read_text(encoding="utf-8")
src = src.replace(
    "import { runSession } from './session_h1.mjs';",
    "import { runSession } from './session_h2.mjs';",
)
old = """    l.observe(native(0x610e2536), () => {
      if (!live()) return;
      totals.chooser += 1;
    }, 'obs-chooser');
"""
new = """    l.observe(native(0x610e2536), () => {
      if (!live()) return;
      totals.chooser += 1;
    }, 'obs-chooser');
    const faceKeys = [];
    l.observe(native(0x611f7f01), (lab, r) => {
      if (!live()) return;
      const srcAddr = r.a1 >>> 0;
      faceKeys.push({
        at: 'entry', caller: hex(r.mdr >>> 0), a0: hex(r.a0 >>> 0), a1: hex(srcAddr),
        keyHalf: half(srcAddr + 4), head: bytes(srcAddr, 24),
      });
    }, 'obs-face-key');
    l.observe(native(0x611f7f40), (lab, r) => {
      if (!live()) return;
      const rec = r.a2 >>> 0;
      faceKeys.push({
        at: 'match', record: hex(rec), key: half(rec), count: half(rec + 8),
        face: hex(word(rec + 0xc)), help: hex(word(rec + 0x10)), caller: hex(r.mdr >>> 0),
      });
    }, 'obs-face-record');
"""
if old not in src:
    raise SystemExit('anchor missing')
src = src.replace(old, new, 1)
old_take = """        store63380Count: bucket.store63380.length, conversion: bucket.conversion.filter((r) => r.match),
      };
"""
new_take = """        store63380Count: bucket.store63380.length, conversion: bucket.conversion.filter((r) => r.match),
        faceKeys: faceKeys.splice(0, faceKeys.length),
      };
"""
if old_take not in src:
    raise SystemExit('take anchor missing')
src = src.replace(old_take, new_take, 1)
Path("work/scripts/session_h2.mjs").write_text(src, encoding="utf-8")
print("session_h2", len(src))
