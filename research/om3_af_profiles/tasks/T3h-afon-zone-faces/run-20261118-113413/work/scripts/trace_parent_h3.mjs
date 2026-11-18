// Observation only. Dumps the widget parent when the face record is selected.
// Usage: node26 work/scripts/trace_parent_h3.mjs om-emu work/out/trace-parent-h3.jsonl
import { runSession } from './session_h3.mjs';

const [checkout, outPath] = process.argv.slice(2);
await runSession({
  checkout,
  outPath,
  tag: 'trace-parent-h3',
  flow: 'trace',
  cells: false,
  fullTrace: false,
  nav: [],
  explanation: 'The face record is selected by binding word +0x10. This run dumps the widget and the parent pointer at object+0x998 when that record is stored, to see whether UI 0x3D6F is identifiable there. No bytes are changed.',
  change: 'none. Z1 configuration only.',
});
