// Z3. One change against the B2 baseline: the value-table pointer becomes 0x606178b1.
// The byte count stays 2. Binding, registration and the row stay.
// Usage: node26 work/scripts/exp_z3_g1.mjs om-emu work/out/exp-z3-g1.jsonl
import { runExperiment } from './menu_session_g2.mjs';

const [checkout, outPath] = process.argv.slice(2);
const ptr = Buffer.alloc(4);
ptr.writeUInt32LE(0x606178b1, 0);
await runExperiment({
  checkout,
  outPath,
  tag: 'exp-z3-g1',
  descriptorFrom: 0x6062132c,
  overrides: [...ptr].map((value, offset) => ({ offset: 4 + offset, value })),
  cancelNav: ['right'],
  confirmNav: ['right'],
  change: 'descriptor value-table pointer only, 0x606190b7 to 0x606178b1. The byte count stays 2.',
  explanation: 'UI 238\'s table begins 00 01, the same two bytes as 2154\'s whole table. With the count left at 2, the chooser should stay the two priority buttons and Right then OK should store 1. A ten-slot grid from the pointer alone would mean the pointer, not the count, selects the chooser size.',
});
