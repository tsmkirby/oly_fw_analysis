// Static callers of the function that calls the origin routine. No emulator.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const want = [0x61184dd6, 0x61184e51, 0x61184e30];
const byTarget = Object.fromEntries(want.map((t) => ['0x' + t.toString(16), []]));
for (let o = 0; o < image.length - 7; o++) {
  const op = image[o];
  let disp = 0;
  if (op === 0xcd) {
    disp = image[o + 1] | (image[o + 2] << 8);
    if (disp & 0x8000) disp -= 0x10000;
  } else if (op === 0xdd) {
    disp = (image[o + 1] | (image[o + 2] << 8) | (image[o + 3] << 16) | (image[o + 4] << 24)) | 0;
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
writeFileSync(resolve('work/out/scan-origincaller-c6.json'), JSON.stringify({ summary, byTarget }));
process.stdout.write(JSON.stringify(summary) + '\n');
for (const [k, v] of Object.entries(byTarget)) process.stdout.write(k + ' ' + v.join(' ') + '\n');
