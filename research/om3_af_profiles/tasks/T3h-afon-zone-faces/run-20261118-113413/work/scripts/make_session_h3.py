# Builds session_h3.mjs. Adds a dump of the widget parent at the face-list store.
from pathlib import Path

src = Path("work/scripts/session_h2.mjs").read_text(encoding="utf-8")
old = """    l.observe(native(0x611f7f40), (lab, r) => {
      if (!live() || faceKeys.length > 40) return;
      const rec = r.a2 >>> 0;
      try {
        faceKeys.push({
          at: 'match', record: hex(rec), key: half(rec), count: half(rec + 8),
          face: hex(word(rec + 0xc)), help: hex(word(rec + 0x10)), caller: hex(r.mdr >>> 0),
        });
      } catch { /* unmapped record */ }
    }, 'obs-face-record');
"""
new = """    l.observe(native(0x611f7f40), (lab, r) => {
      if (!live() || faceKeys.length > 40) return;
      const rec = r.a2 >>> 0;
      try {
        const widget = r.a3 >>> 0;
        const parent = word(widget + 0x998);
        faceKeys.push({
          at: 'match', record: hex(rec), key: half(rec), count: half(rec + 8),
          face: hex(word(rec + 0xc)), help: hex(word(rec + 0x10)), caller: hex(r.mdr >>> 0),
          widget: hex(widget), parent: hex(parent), parentHead: bytes(parent, 48),
          near: bytes(widget + 0x980, 48),
        });
      } catch { /* unmapped record */ }
    }, 'obs-face-record');
"""
if old not in src:
    raise SystemExit('anchor missing')
Path("work/scripts/session_h3.mjs").write_text(src.replace(old, new, 1), encoding="utf-8")
print("session_h3 ok")
