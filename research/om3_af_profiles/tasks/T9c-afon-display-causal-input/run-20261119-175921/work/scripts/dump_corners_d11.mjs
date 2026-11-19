import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const start = 0x6146f990 - BASE;
const bytes = image.subarray(start, start + 64);
const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ');
process.stdout.write(hex + '\n');
for (let i = 0; i < 8; i++) {
  const o = start + i * 4;
  const id = image[o] | (image[o + 1] << 8);
  process.stdout.write('id ' + id + ' b2 ' + image[o + 2] + ' b3 ' + image[o + 3] + '\n');
}
