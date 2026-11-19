// Writes work/scripts/obs_trace_v3.mjs from the version-2 script.
// Does not open an emulator. Do not edit obs_trace_v2.mjs.
import { readFileSync, writeFileSync } from 'node:fs';

let s = readFileSync('work/scripts/obs_trace_v2.mjs', 'utf8');
s = s.replace(
  '// Version 1 opened a session and stopped before bring-up: the png module\n// path omitted emu/. This run uses emu/checks/lib/png.mjs.',
  '// Version 1 stopped on the png path. Version 2 passed the library address\n// 0x50ac4afe through native(). This run uses A() for that address.',
);
s = s.replaceAll('version 2', 'version 3');
s = s.replaceAll('obs_trace_v2', 'obs_trace_v3');
s = s.replaceAll('obs-trace-v2', 'obs-trace-v3');
s = s.replaceAll('v2-', 'v3-');
s = s.replaceAll('v2 stock', 'v3 stock');
s = s.replaceAll('rect-v2', 'rect-v3');
s = s.replace(
  'const { MODEL, IMAGE_BASE } = await import',
  'const { MODEL, IMAGE_BASE, A } = await import',
);
s = s.replace(
  "if (!modelPass) throw new Error('model');",
  "if (!modelPass) throw new Error('model');\n      const API_SET = A(SET_API);",
);
s = s.replace(
  'ctx.l.call(ctx.native(SET_API), { d0: 289, d1: argument }, null, null, 200000);',
  'ctx.l.call(API_SET, { d0: 289, d1: argument }, null, null, 200000);',
);
if (s.includes('native(SET_API)') || !s.includes('API_SET')) throw new Error('rewrite missed the API call');
writeFileSync('work/scripts/obs_trace_v3.mjs', s);
process.stdout.write('wrote obs_trace_v3.mjs ' + s.length + '\n');
