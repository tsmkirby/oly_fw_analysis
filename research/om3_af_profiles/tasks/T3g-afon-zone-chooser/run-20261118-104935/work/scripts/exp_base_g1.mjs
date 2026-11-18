// Baseline. B2's configuration: editor id 0x1e6 bound to 0x3D6F, the descriptor cloned
// from 2154 (value table 0x606190b7, byte count 2), and the row's primary options at
// 0x6158ba1c count 10. No field of that configuration is changed here.
// Usage: node26 work/scripts/exp_base_g1.mjs om-emu work/out/exp-base-g1.jsonl
import { runExperiment } from './menu_session_g1.mjs';

const [checkout, outPath] = process.argv.slice(2);
await runExperiment({
  checkout,
  outPath,
  tag: 'exp-base-g1',
  descriptorFrom: 0x6062132c,
  cancelNav: ['right'],
  confirmNav: ['right'],
  change: 'none. This is the B2 baseline: binding 0x1e6 to 0x3D6F, 2154 descriptor clone, row options 0x6158ba1c count 10.',
  explanation: 'B2 already commits UI 0x3D6F through the 2154 value table [0, 1] while the row glyph comes from the zone list. This run repeats that configuration and records each chooser step. Right once should move to the other priority value. Confirm should call the setter with (0x3D6F, 1). Cancel after one Right should leave the RAM byte at 0. The ten zone images are not expected.',
});
