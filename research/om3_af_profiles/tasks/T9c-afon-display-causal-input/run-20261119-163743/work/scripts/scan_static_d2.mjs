// Static follow-up. No emulator. Table around the one pointer to 0x61184dd6,
// code immediates that name that table, and 0x364 encodings inside the writer.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const hex = (v) => '0x' + (v >>> 0).toString(16);

function u32(o) {
  return (image[o] | (image[o + 1] << 8) | (image[o + 2] << 16) | (image[o + 3] << 24)) >>> 0;
}
function dump(addr, n) {
  const o = addr - BASE;
  const words = [];
  for (let i = 0; i < n; i++) words.push({ at: hex((addr + i * 4) >>> 0), v: hex(u32(o + i * 4)) });
  return words;
}

const table = dump(0x614704c0, 40);
const refs = [];
const lo = 0x61470400, hi = 0x61470680;
for (let o = 0; o + 4 <= image.length; o++) {
  const v = u32(o);
  if (v >= lo && v < hi) refs.push({ pc: hex((BASE + o) >>> 0), imm: hex(v) });
}

const slot = [];
const start = 0x61184e51 - BASE;
const end = 0x61186200 - BASE;
for (let o = start; o + 2 < end; o++) {
  if (image[o] === 0x64 && image[o + 1] === 0x03) {
    slot.push({ pc: hex((BASE + o - 1) >>> 0), prev: image[o - 1], next: image[o + 2] });
  }
}

const sites = [0x60063550, 0x60063690, 0x60063d70, 0x60063d80];
const bytes = {};
for (const addr of sites) {
  const o = addr - BASE;
  const b = [];
  for (let i = 0; i < 32; i++) b.push(image[o + i].toString(16).padStart(2, '0'));
  bytes[hex(addr)] = b.join('');
}

const summary = { table, refCount: refs.length, refs, slot, bytes };
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-static-d2.json'), JSON.stringify(summary, null, 2));
process.stdout.write(JSON.stringify({ refCount: refs.length, refs, slot, bytes }, null, 2) + '\n');
process.stdout.write('table\n');
for (const w of table) process.stdout.write(w.at + ' ' + w.v + '\n');
