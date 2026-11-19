// Locate the function that returns to 0x6135cec4, and show the call bytes.
// Reads the stock image only. Do not edit after it has run.
// Usage: node26 work/scripts/scan_widget_c1.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
function bytes(addr, n) {
  const o = addr - BASE;
  return [...image.subarray(o, o + n)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function hex(v) { return '0x' + (v >>> 0).toString(16); }

const sites = [0x6135cec4, 0x610f75cc, 0x610f70da, 0x610f66da];
const windows = sites.map((addr) => ({
  addr: hex(addr),
  before: bytes(addr - 16, 16),
  after: bytes(addr, 16),
}));
let entry = null;
for (let a = 0x6135cec4 - 1; a > 0x6135cec4 - 0x400; a--) {
  if (image[a - BASE] === 0xdf) { entry = a + 3; break; }
}
const callers = [];
const target = entry;
if (target) {
  for (let o = 0; o < image.length - 7; o++) {
    const op = image[o];
    if (op !== 0xcd && op !== 0xdd) continue;
    const pc = BASE + o;
    let dest, size;
    if (op === 0xcd) {
      const n = image[o + 1] | (image[o + 2] << 8);
      const d = n & 0x8000 ? n - 0x10000 : n;
      dest = (pc + d) >>> 0;
      size = image[o + 4];
    } else {
      dest = (pc + (image[o + 1] | (image[o + 2] << 8) | (image[o + 3] << 16) | (image[o + 4] << 24))) >>> 0;
      size = image[o + 6];
    }
    if (dest === target && (size & 3) === 0 && size <= 0x80) callers.push(hex(pc));
  }
}
const report = { windows, guessedEntry: entry && hex(entry), callers };
writeFileSync(resolve('work/out/scan-widget-c1.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
