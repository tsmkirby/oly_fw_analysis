// Z2. One change against the B2 baseline: the descriptor byte count goes from 2 to 10.
// The value-table pointer stays 0x606190b7. Binding, registration and the row stay.
// Usage: node26 work/scripts/exp_z2_g1.mjs om-emu work/out/exp-z2-g1.jsonl
import { runExperiment } from './menu_session_g2.mjs';

const [checkout, outPath] = process.argv.slice(2);
await runExperiment({
  checkout,
  outPath,
  tag: 'exp-z2-g1',
  descriptorFrom: 0x6062132c,
  overrides: [{ offset: 12, value: 10 }],
  cancelNav: ['right'],
  confirmNav: ['right', 'right', 'right'],
  change: 'descriptor byte count only, 2 to 10. The value-table pointer stays 0x606190b7.',
  explanation: 'Z1 changed the pointer and the count together and opened a six-slot grid whose fourth slot committed value 3, the fourth byte of UI 238\'s table. This run changes only the count. The bytes after 0x606190b7 are 00 01 00 01, so three Rights land on index 3 and the stored value should be 1 if the count is the slot count and the pointer is the value source. A two-button chooser would mean the count alone does not add slots.',
});
