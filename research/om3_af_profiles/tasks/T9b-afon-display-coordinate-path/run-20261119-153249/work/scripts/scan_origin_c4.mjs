// Static scan. Find the function entry that contains 0x611852e9 by walking
// backward through the image for a movm/add-sp prologue, and list cd/dd calls
// whose target is that entry. No emulator import.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const img = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const SITE = 0x611852e9;
const lo = 0x61184800;
const hi = SITE;
const byTarget = new Map();
for (let o = 0; o < img.length - 7; o++) {
  const op = img[o];
  let disp = 0;
  let len = 0;
  if (op === 0xcd) {
    disp = img[o + 1] | (img[o + 2] << 8);
    if (disp & 0x8000) disp -= 0x10000;
    len = 5;
  } else if (op === 0xdd) {
    disp = (img[o + 1] | (img[o + 2] << 8) | (img[o + 3] << 16) | (img[o + 4] << 24)) | 0;
    len = 7;
  } else continue;
  void len;
  const pc = (BASE + o) >>> 0;
  const target = (pc + disp) >>> 0;
  if (target < lo || target > hi) continue;
  const key = '0x' + target.toString(16);
  if (!byTarget.has(key)) byTarget.set(key, []);
  byTarget.get(key).push('0x' + pc.toString(16));
}
const summary = {};
for (const [k, v] of byTarget) summary[k] = v.length;
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-origin-c4.json'), JSON.stringify({ site: '0x' + SITE.toString(16), summary, byTarget: Object.fromEntries(byTarget) }));
process.stdout.write(JSON.stringify(summary) + '\n');
