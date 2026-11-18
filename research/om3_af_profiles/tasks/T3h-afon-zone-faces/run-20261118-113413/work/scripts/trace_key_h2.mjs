// Z1 again, observation only. Records the key FUN_611f7f01 matches in the face table.
// Usage: node26 work/scripts/trace_key_h2.mjs om-emu work/out/trace-key-h2.jsonl
import { runSession } from './session_h2.mjs';

const [checkout, outPath] = process.argv.slice(2);
await runSession({
  checkout,
  outPath,
  tag: 'trace-key-h2',
  flow: 'trace',
  cells: false,
  fullTrace: false,
  nav: [],
  explanation: 'The slot faces came from list 0x61575880, which is record 76 of the table at 0x6037bedc, key 0x2d. This run records the object whose halfword at +4 is that key, and the table record FUN_611f7f01 selects. No bytes are changed.',
  change: 'none. Z1 configuration only.',
});
