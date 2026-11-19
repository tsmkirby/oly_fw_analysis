// Compare shooting-screen PNGs and locate the function that reads 0x88b2.
// Reads files only. Do not edit after it has run.
import { inflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readPng(file) {
  const data = readFileSync(file);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  const idat = [];
  for (let pos = 8; pos < data.length;) {
    const length = data.readUInt32BE(pos);
    const kind = data.toString('latin1', pos + 4, pos + 8);
    if (kind === 'IDAT') idat.push(data.subarray(pos + 8, pos + 8 + length));
    pos += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    raw.copy(rgb, y * width * 3, (3 * width + 1) * y + 1, (3 * width + 1) * y + 1 + width * 3);
  }
  return { width, height, rgb };
}

function diff(a, b, x0, y0, x1, y1) {
  let n = 0;
  let minX = x1, minY = y1, maxX = x0, maxY = y0;
  const samples = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * a.width + x) * 3;
      if (a.rgb[i] !== b.rgb[i] || a.rgb[i + 1] !== b.rgb[i + 1] || a.rgb[i + 2] !== b.rgb[i + 2]) {
        n += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        if (samples.length < 8) samples.push({ x, y, a: [a.rgb[i], a.rgb[i + 1], a.rgb[i + 2]], b: [b.rgb[i], b.rgb[i + 1], b.rgb[i + 2]] });
      }
    }
  }
  return { n, box: n ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null, samples };
}

const stock = readPng(resolve('work/out/obs-k1-v2-rest.png'));
const moved = readPng(resolve('work/out/obs-k1-v2-small-rest.png'));
const rest = readPng(resolve('work/out/obs-t6-v5-candidate-rest.png'));
const afon = readPng(resolve('work/out/obs-t6-v5-candidate-afon-down.png'));
const k2 = readPng(resolve('work/out/obs-t6-v5-k2-afon-down.png'));
const view = [280, 60, 780, 520];
const report = {
  stockVsT6Rest: diff(stock, rest, ...view),
  t6RestVsAfon: diff(rest, afon, ...view),
  candidateVsK2Afon: diff(afon, k2, ...view),
  stockVsMoved: diff(stock, moved, ...view),
};

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const from = 0x609eec84;
const to = 0x609eed46;
const rets = [];
for (let pc = from; pc < to; pc++) {
  const i = pc - BASE;
  if (image[i] === 0xdf && (image[i + 1] & 0xf0) === 0xf0) rets.push('0x' + pc.toString(16));
}
const entry = rets.length ? null : '0x609eec84';
const fn = entry ? parseInt(entry, 16) : parseInt(rets.at(-1), 16) + 3;
const fileOff = (fn - BASE) >>> 0;
const callers = [];
for (let p = 0; p < image.length - 7; p++) {
  if (image[p] === 0xcd && p + 5 <= image.length) {
    const disp = image[p + 1] | (image[p + 2] << 8);
    const signed = disp & 0x8000 ? disp - 0x10000 : disp;
    if (((p + signed) >>> 0) === fileOff && callers.length < 12) callers.push('0x' + (BASE + p).toString(16));
  } else if (image[p] === 0xdd && p + 7 <= image.length) {
    const disp = image[p + 1] | (image[p + 2] << 8) | (image[p + 3] << 16) | (image[p + 4] << 24);
    if (((p + disp) >>> 0) === fileOff && callers.length < 12) callers.push('0x' + (BASE + p).toString(16));
  }
}
report.positioner = { retsBetween: rets, assumedEntry: '0x' + fn.toString(16), callers };

writeFileSync(resolve('work/out/scan-diff-v1.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
