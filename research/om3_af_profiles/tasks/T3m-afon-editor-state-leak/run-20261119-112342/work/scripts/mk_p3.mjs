// One-shot helper. Builds leak_p3.mjs from the frozen leak_p2.mjs.
// p2's wrap() had no existing hook to layer on. p3 hooks the copy
// function itself and restores when that call returns.
import { readFileSync, writeFileSync } from 'node:fs';
let s = readFileSync('work/scripts/leak_p2.mjs', 'utf8');
s = s.replaceAll('leak-p2', 'leak-p3').replaceAll('leak_p2', 'leak_p3').replaceAll("experiment: 'p2'", "experiment: 'p3'");
s = s.replace('// Experiment p2.', '// Experiment p3. p2 could not wrap 0x6119af02 (no hook there).');
const old = `      l.wrap(toDisasm(EDITOR_COPY), (prev) => (h, r) => {
        const flag = readByte(MODE) === 1;
        if (flag) copiesWhileFlag += 1;
        if ((flag || armCopy) && (r.a0 >>> 0) >= 0x60000000) editorObj = r.a0 >>> 0;
        const result = prev(h, r);
        if (flag) restoreLeaks('copy-while-flag');
        else if (armCopy) { restoreLeaks('copy-after-leave'); armCopy = false; }
        return result;
      }, 'EMULATOR-ONLY exit: restore editor position copies');`;
const neu = `      const pendingCopy = new Map();
      l.hook(toDisasm(EDITOR_COPY), (h, r) => {
        const flag = readByte(MODE) === 1;
        const armed = flag || armCopy;
        if (flag) copiesWhileFlag += 1;
        if (armed && (r.a0 >>> 0) >= 0x60000000) editorObj = r.a0 >>> 0;
        const mdr = r.mdr >>> 0;
        if (armed && mdr) {
          pendingCopy.set(mdr, { flag, arm: armCopy });
          if (!l.hooks.has(mdr)) {
            l.hook_rt(mdr, (_hh, rr) => {
              const job = pendingCopy.get(mdr);
              pendingCopy.delete(mdr);
              if (job?.flag) restoreLeaks('copy-while-flag');
              else if (job?.arm) { restoreLeaks('copy-after-leave'); armCopy = false; }
              l.passthrough(rr);
            }, 'EMULATOR-ONLY exit: editor copy returned');
          }
        }
        l.passthrough(r);
      }, 'EMULATOR-ONLY exit: restore editor position copies');`;
if (!s.includes(old)) throw new Error('wrap block not found');
s = s.replace(old, neu);
writeFileSync('work/scripts/leak_p3.mjs', s);
