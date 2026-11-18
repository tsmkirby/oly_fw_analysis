// Z1 face trace. Observation only: the configuration is T3g Z1, with no further change.
// Usage: node26 work/scripts/trace_faces_h1.mjs om-emu work/out/trace-faces-h1.jsonl
import { runSession } from './session_h1.mjs';

const [checkout, outPath] = process.argv.slice(2);
await runSession({
  checkout,
  outPath,
  tag: 'trace-faces-h1',
  flow: 'trace',
  cells: false,
  fullTrace: true,
  explanation: 'Z1 already opens ten slots whose values are the UI 238 table, and values 0 and 1 draw the priority strings. This run does not change Z1. It records, for each drawn slot, the list pointer passed to FUN_611c7785 and FUN_611c782f and the kind and id those calls resolve.',
  change: 'none. Z1 configuration only.',
});
