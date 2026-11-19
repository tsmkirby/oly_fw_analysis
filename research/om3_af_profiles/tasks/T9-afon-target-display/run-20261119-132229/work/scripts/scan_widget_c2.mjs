// Find pointers and jumps to the rectangle widget 0x610f6649.
// Reads the stock image only. Do not edit after it has run.
// Usage: node26 work/scripts/scan_widget_c2.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const target = 0x610f6649;
const needle = Buffer.from([0x49, 0x66, 0x0f, 0x61]);
const pointers = [];
let from = 0;
for (;;) {
  const at = image.indexOf(needle, from);
  if (at < 0) break;
  pointers.push('0x' + (BASE + at).toString(16));
  from = at + 1;
  if (pointers.length > 40) break;
}
const jumps = [];
for (let o = 0; o < image.length - 6; o++) {
  const pc = (BASE + o) >>> 0;
  if (image[o] === 0xcc) {
    const n = image[o + 1] | (image[o + 2] << 8);
    const d = n & 0x8000 ? n - 0x10000 : n;
    if (((pc + d) >>> 0) === target) jumps.push({ pc: '0x' + pc.toString(16), op: 'cc' });
  } else if (image[o] === 0xfc && image[o + 1] === 0xff) {
    const d = (image[o + 2] | (image[o + 3] << 8) | (image[o + 4] << 16) | (image[o + 5] << 24)) >>> 0;
    if (((pc + d) >>> 0) === target) jumps.push({ pc: '0x' + pc.toString(16), op: 'fcff' });
  }
}
const report = { pointers, jumps };
writeFileSync(resolve('work/out/scan-widget-c2.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
