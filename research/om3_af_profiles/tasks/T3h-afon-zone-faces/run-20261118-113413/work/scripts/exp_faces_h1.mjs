// Experiment 1, one change against Z1.
// The face table record for key 0x2d is shared with editor 0x1e3. This run does not
// write that record. It points only the 0x3D6F chooser's stored face-record pointer
// at a private copy whose count is 10 and whose list is the zone list.
// Usage: node26 work/scripts/exp_faces_h1.mjs om-emu work/out/exp-faces-h1.jsonl
import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { runSession } from './session_h3.mjs';

const BASE = 0x60021020;
const STOCK = 0x6037c98c;
const FACE = 0x6031ea48;
const ZONE = 0x6158ba1c;
const UI = 0x3d6f;
const HOOK_AT = 0x611f7f42;
const hookPath = 'work/out/exp-faces-h1-hook.jsonl';

const image = readFileSync('inputs/00_0100_50000020.decoded.bin');
const record = Buffer.from(image.subarray(STOCK - BASE, STOCK - BASE + 0x24));
if (image[FACE - BASE] !== 0xff) throw new Error('face record address is not FF');
record.writeUInt16LE(10, 8);
record.writeUInt32LE(ZONE, 0x0c);
writeFileSync(hookPath, '');

const [checkout, outPath] = process.argv.slice(2);
await runSession({
  checkout,
  outPath,
  tag: 'exp-faces-h1',
  flow: 'commit',
  cells: false,
  fullTrace: false,
  explanation: 'The chooser reads its face list from the table record selected by the binding word at +0x10. For 0x3D6F that word is 0x2d, the same word as editor 0x1e3, and the record at 0x6037c98c holds list 0x61575880 count 2. Pointing that shared record at the zone list would also change 2154. This run leaves record 76 and editor 0x1e3 untouched. The one change is the face record this chooser stores: a private copy at 0x6031ea48 with count 10 and list 0x6158ba1c, selected only when the chooser parent halfword at +0x54 is 0x3D6F.',
  change: 'one change, EMULATOR-ONLY behaviour. Private face record at 0x6031ea48 (copy of 0x6037c98c with count 10 and list 0x6158ba1c). Hook at 0x611f7f42 writes that address into the chooser only when parent+0x54 is 0x3D6F.',
  one: {
    type: 'runtime',
    label: 'behaviour. 0x3D6F face record 0x6031ea48 count 10 list 0x6158ba1c. Shared record 0x6037c98c is not written.',
    explanation: 'Binding word +0x10 selects face-table record 76 for both 0x3D6F and editor 0x1e3. The private copy is the face source this chooser uses, and the hook is what makes the store point at it.',
    apply(ctx) {
      ctx.l.sim.write(FACE, record);
      ctx.l.hook(ctx.native(HOOK_AT), (h, r) => {
        let ui = null;
        let wrote = false;
        try {
          const widget = r.a3 >>> 0;
          const parent = ctx.word(widget + 0x998);
          ui = ctx.half(parent + 0x54) & 0xffff;
          if (ui === UI) {
            ctx.writeU32(r.a0 >>> 0, FACE);
            wrote = true;
          }
        } catch (e) {
          ui = null;
        }
        appendFileSync(hookPath, JSON.stringify({
          ui, wrote, a0: ctx.hex(r.a0 >>> 0), a3: ctx.hex(r.a3 >>> 0),
        }) + '\n');
        ctx.l.passthrough(r);
      }, 'EMULATOR-ONLY behaviour: 0x3D6F face list 0x6158ba1c count 10');
      return { face: ctx.hex(FACE), record: record.toString('hex'), hook: ctx.hex(HOOK_AT) };
    },
  },
});
