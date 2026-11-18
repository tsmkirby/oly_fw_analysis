// Z1. One descriptor replacement against the B2 baseline. The 20 bytes at 0x6031e9a0
// become an unchanged clone of UI 238, with only the id set to 0x3D6F.
// Against the 2154 clone that is two fields: the value-table pointer and the byte count.
// The binding, the hash registration, and the row options stay.
// Usage: node26 work/scripts/exp_z1_g1.mjs om-emu work/out/exp-z1-g1.jsonl
import { runExperiment } from './menu_session_g1.mjs';

const [checkout, outPath] = process.argv.slice(2);
await runExperiment({
  checkout,
  outPath,
  tag: 'exp-z1-g1',
  descriptorFrom: 0x606200e4,
  cancelNav: ['right'],
  confirmNav: ['right', 'right', 'right'],
  change: 'combined: descriptor value-table pointer 0x606190b7 to 0x606178b1, and byte count 2 to 10. Flags, stride, type and the zero second pointer are unchanged. Reported as one descriptor replacement because those two fields are the whole difference.',
  explanation: 'UI 238\'s value table is the ten zone values 0, 1, 2, 3, 5, 10, 6, 7, 8, 9. The row already points at the ten zone images. If the chooser walks that value table, OK shows ten zone images. Three Rights then OK should store a value other than 0 or 1 if the highlight moves through that table or through the zone list. Cancel after one Right should leave the RAM byte at 0. 2154, 2155 and the listed cells should stay put.',
});
