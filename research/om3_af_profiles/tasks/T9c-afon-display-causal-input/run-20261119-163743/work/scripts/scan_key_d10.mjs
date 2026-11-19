import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const ranges = [[0x610c8000, 0x610e2000], [0x61184000, 0x61187000], [0x603f1000, 0x60406000]];
for (const [lo, hi] of ranges) {
  const a = lo - BASE, b = hi - BASE;
  const hits = [];
  for (let o = a; o + 1 < b; o++) {
    if (image[o] === 0xb2 && image[o + 1] === 0x88) hits.push((BASE + o - 1) >>> 0);
  }
  process.stdout.write(lo.toString(16) + ' count ' + hits.length + '\n');
  for (const h of hits.slice(0, 25)) process.stdout.write('  ' + h.toString(16) + '\n');
}
