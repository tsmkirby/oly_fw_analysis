// Static scan for callers of the cell load 0x60063a20.
// Does not open an emulator. Do not edit after it has run.
// Usage: node26 work/scripts/scan_static_b3.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const targets = new Set([0x60063a20, 0x60063a68, 0x60063380]);
const hits = [];
for (let o = 0; o < image.length - 7; o++) {
  const op = image[o];
  if (op !== 0xcd && op !== 0xdd) continue;
  const pc = (BASE + o) >>> 0;
  let target;
  if (op === 0xcd) target = (pc + (image[o + 1] | (image[o + 2] << 8) | ((image[o + 2] & 0x80) ? -0x10000 : 0))) >>> 0;
  else target = (pc + (image[o + 1] | (image[o + 2] << 8) | (image[o + 3] << 16) | (image[o + 4] << 24))) >>> 0;
  if (!targets.has(target)) continue;
  hits.push({ pc: '0x' + pc.toString(16), target: '0x' + target.toString(16) });
}
const byTarget = {};
for (const hit of hits) {
  if (!byTarget[hit.target]) byTarget[hit.target] = [];
  byTarget[hit.target].push(hit.pc);
}
const out = { calls: hits.length, byTarget };
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-static-b3.json'), JSON.stringify(out));
const summary = {};
for (const [k, v] of Object.entries(byTarget)) summary[k] = v.length;
process.stdout.write(JSON.stringify({
  calls: hits.length,
  summary,
  load: byTarget['0x60063a20'] || [],
  helper: byTarget['0x60063a68'] || [],
}) + '\n');
