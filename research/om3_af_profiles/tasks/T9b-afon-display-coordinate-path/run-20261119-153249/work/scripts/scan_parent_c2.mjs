// Static callers of the idle getter parent 0x603f15b1 and the lookup 0x604050be.
// Does not open an emulator. Do not edit after it has run.
// Usage: node26 work/scripts/scan_parent_c2.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const want = [0x603f15b1, 0x604050be, 0x60419315, 0x610eedc5];
const byTarget = Object.fromEntries(want.map((t) => ['0x' + t.toString(16), []]));
for (let o = 0; o < image.length - 7; o++) {
  const op = image[o];
  let disp = 0;
  let len = 0;
  if (op === 0xcd) {
    disp = image[o + 1] | (image[o + 2] << 8);
    if (disp & 0x8000) disp -= 0x10000;
    len = 5;
  } else if (op === 0xdd) {
    disp = (image[o + 1] | (image[o + 2] << 8) | (image[o + 3] << 16) | (image[o + 4] << 24)) | 0;
    len = 7;
  } else continue;
  const pc = (BASE + o) >>> 0;
  const target = (pc + disp) >>> 0;
  const key = '0x' + target.toString(16);
  if (!byTarget[key]) continue;
  byTarget[key].push('0x' + pc.toString(16));
}
const summary = {};
for (const [k, v] of Object.entries(byTarget)) summary[k] = v.length;
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-parent-c2.json'), JSON.stringify({ summary, byTarget }));
process.stdout.write(JSON.stringify(summary) + '\n');
for (const [k, v] of Object.entries(byTarget)) process.stdout.write(k + ' ' + v.slice(0, 24).join(' ') + '\n');
