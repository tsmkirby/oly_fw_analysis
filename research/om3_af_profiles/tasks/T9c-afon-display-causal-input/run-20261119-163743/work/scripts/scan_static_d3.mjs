// Static. No emulator. Bases that could index the handler slot 0x6147050c,
// and every add/mov of 0x364 in the main image.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const hex = (v) => '0x' + (v >>> 0).toString(16);
function u32(o) {
  return (image[o] | (image[o + 1] << 8) | (image[o + 2] << 16) | (image[o + 3] << 24)) >>> 0;
}

const SLOT = 0x6147050c;
const bases = [];
for (let o = 0; o + 4 <= image.length; o++) {
  const v = u32(o);
  if (v >= 0x61470000 && v < 0x61470800 && ((SLOT - v) & 3) === 0) {
    const index = (SLOT - v) / 4;
    if (index >= 0 && index < 256) bases.push({ pc: hex((BASE + o) >>> 0), base: hex(v), index });
  }
}

const enc = [];
const needles = [
  [0xfa, 0xd0, 0x64, 0x03], [0xfa, 0xd1, 0x64, 0x03], [0xfa, 0xd2, 0x64, 0x03], [0xfa, 0xd3, 0x64, 0x03],
  [0x24, 0x64, 0x03], [0x25, 0x64, 0x03], [0x26, 0x64, 0x03], [0x27, 0x64, 0x03],
  [0xfc, 0xcc, 0x64, 0x03, 0x00, 0x00],
];
for (const n of needles) {
  for (let o = 0; o + n.length <= image.length; o++) {
    let ok = true;
    for (let i = 0; i < n.length; i++) if (image[o + i] !== n[i]) { ok = false; break; }
    if (ok) enc.push({ pc: hex((BASE + o) >>> 0), bytes: n.map((b) => b.toString(16).padStart(2, '0')).join('') });
  }
}

const out = { baseHits: bases.length, bases: bases.slice(0, 80), encCount: enc.length, enc: enc.slice(0, 80) };
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-static-d3.json'), JSON.stringify(out, null, 2));
process.stdout.write(JSON.stringify({ baseHits: bases.length, encCount: enc.length }, null, 2) + '\n');
const byIndex = {};
for (const b of bases) {
  const k = String(b.index);
  byIndex[k] = (byIndex[k] || 0) + 1;
}
process.stdout.write('indexes ' + JSON.stringify(byIndex) + '\n');
process.stdout.write('enc ' + JSON.stringify(enc.slice(0, 40)) + '\n');
process.stdout.write('bases sample ' + JSON.stringify(bases.slice(0, 30)) + '\n');
