// Same one change as exp_faces_h1. That run drew the ten zone faces and then the
// process died on the cancel key, before confirm. This run keeps the change and
// shortens the chooser walk so cancel and confirm are reached.
// Usage: node26 work/scripts/exp_faces_h2.mjs om-emu work/out/exp-faces-h2.jsonl
import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { runSession } from './session_h3.mjs';

const BASE = 0x60021020;
const STOCK = 0x6037c98c;
const FACE = 0x6031ea48;
const ZONE = 0x6158ba1c;
const UI = 0x3d6f;
const HOOK_AT = 0x611f7f42;
const hookPath = 'work/out/exp-faces-h2-hook.jsonl';

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
  tag: 'exp-faces-h2',
  flow: 'commit',
  cells: false,
  fullTrace: false,
  nav: ['right', 'right', 'right'],
  confirmNav: ['right', 'right', 'right'],
  explanation: 'Same change as exp-faces-h1. The ten zone faces rendered, and the process died on the cancel key before confirm was recorded. This run walks three slots, cancels, reopens, and confirms value 3.',
  change: 'one change, EMULATOR-ONLY behaviour. Private face record at 0x6031ea48 (copy of 0x6037c98c with count 10 and list 0x6158ba1c). Hook at 0x611f7f42 writes that address into the chooser only when parent+0x54 is 0x3D6F.',
  one: {
    type: 'runtime',
    label: 'behaviour. 0x3D6F face record 0x6031ea48 count 10 list 0x6158ba1c. Shared record 0x6037c98c is not written.',
    explanation: 'Binding word +0x10 selects face-table record 76 for both 0x3D6F and editor 0x1e3. The private copy is the face source this chooser uses.',
    apply(ctx) {
      ctx.l.sim.write(FACE, record);
      ctx.l.hook(ctx.native(HOOK_AT), (h, r) => {
        try {
          const widget = r.a3 >>> 0;
          const parent = ctx.word(widget + 0x998);
          if ((ctx.half(parent + 0x54) & 0xffff) === UI) ctx.writeU32(r.a0 >>> 0, FACE);
        } catch { /* not this chooser */ }
        appendFileSync(hookPath, JSON.stringify({ a0: ctx.hex(r.a0 >>> 0) }) + '\n');
        ctx.l.passthrough(r);
      }, 'EMULATOR-ONLY behaviour: 0x3D6F face list 0x6158ba1c count 10');
      return { face: ctx.hex(FACE), record: record.toString('hex'), hook: ctx.hex(HOOK_AT) };
    },
  },
});
