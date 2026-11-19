// Callers of the thunks that reach 0x609eece3. Reads the stock image only.
// Do not edit after it has run.
// Usage: node26 work/scripts/scan_calls_c2.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
function s16(o) { const n = image[o] | (image[o + 1] << 8); return n & 0x8000 ? n - 0x10000 : n; }
function u32(o) { return (image[o] | (image[o + 1] << 8) | (image[o + 2] << 16) | (image[o + 3] << 24)) >>> 0; }

const targets = new Set([0x603efa5b, 0x603efa50, 0x61a43e59, 0x61a49a3e, 0x609ef3e8, 0x607118c9]);
const hits = [];
for (let o = 0; o < image.length - 7; o++) {
  const op = image[o];
  if (op !== 0xcd && op !== 0xdd) continue;
  const pc = (BASE + o) >>> 0;
  let target, size;
  if (op === 0xcd) { target = (pc + s16(o + 1)) >>> 0; size = image[o + 4]; }
  else { target = (pc + u32(o + 1)) >>> 0; size = image[o + 6]; }
  if (!targets.has(target) || (size & 3) !== 0 || size > 0x80) continue;
  hits.push({ pc: '0x' + pc.toString(16), target: '0x' + target.toString(16), size });
}
const byTarget = {};
for (const hit of hits) {
  if (!byTarget[hit.target]) byTarget[hit.target] = [];
  byTarget[hit.target].push(hit.pc);
}
writeFileSync(resolve('work/out/scan-calls-c2.json'), JSON.stringify({ byTarget, hits }, null, 2) + '\n');
console.log(JSON.stringify(byTarget));
