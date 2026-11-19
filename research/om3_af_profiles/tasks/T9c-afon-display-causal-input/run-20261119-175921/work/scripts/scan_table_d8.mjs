// Find a word table where entry 409 is 409 and entry 412 is 406.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
function u32(o) {
  return (image[o] | (image[o + 1] << 8) | (image[o + 2] << 16) | (image[o + 3] << 24)) >>> 0;
}
const hits = [];
for (let o = 0; o + 16 < image.length; o += 4) {
  if (u32(o) !== 406) continue;
  if (o < 12) continue;
  if (u32(o - 12) === 409) {
    const base = o - 412 * 4;
    hits.push({ at: (BASE + o) >>> 0, base: base >= 0 ? (BASE + base) >>> 0 : null, e526: base >= 0 ? u32(base + 526 * 4) : null, e529: base >= 0 && base + 529 * 4 + 4 <= image.length ? u32(base + 529 * 4) : null });
  }
}
process.stdout.write('hits ' + hits.length + '\n');
for (const h of hits.slice(0, 30)) {
  process.stdout.write(JSON.stringify(h) + '\n');
}
