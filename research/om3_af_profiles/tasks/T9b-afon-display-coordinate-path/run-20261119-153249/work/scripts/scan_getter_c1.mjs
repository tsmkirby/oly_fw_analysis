// Static callers of the setting getter 0x60419312 and 0x6041931e.
// Does not open an emulator. Do not edit after it has run.
// Usage: node26 work/scripts/scan_getter_c1.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const targets = new Set([0x60419312, 0x6041931e, 0x6041a1f9]);
const byTarget = { '0x60419312': [], '0x6041931e': [], '0x6041a1f9': [] };
for (let o = 0; o < image.length - 7; o++) {
  const op = image[o];
  if (op !== 0xcd && op !== 0xdd) continue;
  const pc = (BASE + o) >>> 0;
  let disp;
  let len;
  if (op === 0xcd) {
    disp = image[o + 1] | (image[o + 2] << 8);
    if (disp & 0x8000) disp -= 0x10000;
    len = 5;
  } else {
    disp = image[o + 1] | (image[o + 2] << 8) | (image[o + 3] << 16) | (image[o + 4] << 24);
    len = 7;
  }
  const target = (pc + disp) >>> 0;
  const key = '0x' + target.toString(16);
  if (!byTarget[key]) continue;
  const mask = image[o + len - 2];
  const size = image[o + len - 1];
  byTarget[key].push('0x' + pc.toString(16) + ' m' + mask.toString(16) + ' s' + size.toString(16));
}
const summary = {};
for (const [k, v] of Object.entries(byTarget)) summary[k] = v.length;
const out = { base: '0x60021020', summary, byTarget };
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-getter-c1.json'), JSON.stringify(out));
process.stdout.write(JSON.stringify(summary) + '\n');
for (const [k, v] of Object.entries(byTarget)) {
  process.stdout.write(k + ' ' + v.slice(0, 40).join(' ') + (v.length > 40 ? ' ...' : '') + '\n');
}
