// Callers of the cell-load wrapper 0x60063912. No emulator.
// Do not edit after it has run.
// Usage: node26 work/scripts/scan_static_b4.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const targets = new Set([0x60063912, 0x60063931]);
const byTarget = {};
for (const t of targets) byTarget['0x' + t.toString(16)] = [];
for (let o = 0; o < image.length - 7; o++) {
  const op = image[o];
  if (op !== 0xcd && op !== 0xdd) continue;
  const pc = (BASE + o) >>> 0;
  const disp = op === 0xcd
    ? (image[o + 1] | (image[o + 2] << 8) | ((image[o + 2] & 0x80) ? -0x10000 : 0))
    : (image[o + 1] | (image[o + 2] << 8) | (image[o + 3] << 16) | (image[o + 4] << 24));
  const target = (pc + disp) >>> 0;
  if (!targets.has(target)) continue;
  byTarget['0x' + target.toString(16)].push('0x' + pc.toString(16));
}
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-static-b4.json'), JSON.stringify(byTarget));
process.stdout.write(JSON.stringify(byTarget) + '\n');
