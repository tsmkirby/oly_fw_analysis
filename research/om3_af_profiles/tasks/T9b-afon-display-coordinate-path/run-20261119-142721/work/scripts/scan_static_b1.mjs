// Static scan of the stock image. Finds cd/dd calls to the paint and setter
// entries, and immediates used by the frame path. Writes one JSON file.
// Do not edit after it has run.
// Usage: node26 work/scripts/scan_static_b1.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const hi = BASE + image.length;

function u8(addr) { return image[addr - BASE]; }
function u16(addr) { const o = addr - BASE; return image[o] | (image[o + 1] << 8); }
function s16(addr) { const n = u16(addr); return n & 0x8000 ? n - 0x10000 : n; }
function u32(addr) {
  const o = addr - BASE;
  return (image[o] | (image[o + 1] << 8) | (image[o + 2] << 16) | (image[o + 3] << 24)) >>> 0;
}
function hex(v) { return '0x' + (v >>> 0).toString(16); }
function bytes(addr, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(u8(addr + i).toString(16).padStart(2, '0'));
  return out.join('');
}

const targets = new Set([
  0x610eedc5, 0x610eee11, 0x610f6649, 0x610f66df, 0x610f70c5,
  0x610f7b1a, 0x610f74e6, 0x60063431, 0x60063380, 0x600624d3,
]);
const hits = [];
for (let o = 0; o < image.length - 7; o++) {
  const op = image[o];
  if (op !== 0xcd && op !== 0xdd) continue;
  const pc = (BASE + o) >>> 0;
  let target, size, mask, length;
  if (op === 0xcd) {
    const disp = s16(pc + 1);
    target = (pc + disp) >>> 0;
    mask = image[o + 3];
    size = image[o + 4];
    length = 5;
  } else {
    target = (pc + u32(pc + 1)) >>> 0;
    mask = image[o + 5];
    size = image[o + 6];
    length = 7;
  }
  if (!targets.has(target)) continue;
  if (target < BASE || target >= hi) continue;
  hits.push({
    pc: hex(pc),
    op: op === 0xcd ? 'cd' : 'dd',
    target: hex(target),
    mask: hex(mask),
    size,
    bytes: bytes(pc, length),
  });
}
hits.sort((a, b) => a.target.localeCompare(b.target) || a.pc.localeCompare(b.pc));
const byTarget = {};
for (const hit of hits) {
  if (!byTarget[hit.target]) byTarget[hit.target] = [];
  byTarget[hit.target].push(hit.pc);
}

function findImm(pattern, limit) {
  const out = [];
  const n = pattern.length;
  for (let o = 0; o <= image.length - n && out.length < limit; o++) {
    let ok = true;
    for (let i = 0; i < n; i++) if (image[o + i] !== pattern[i]) { ok = false; break; }
    if (!ok) continue;
    const pc = (BASE + o) >>> 0;
    out.push({ addr: hex(pc), before: bytes(pc - 6, 6), at: bytes(pc, n), after: bytes(pc, 10) });
  }
  return out;
}

const report = {
  imageBytes: image.length,
  imageSha256Note: 'caller hashes the file; this scan only reads it',
  hitCount: hits.length,
  byTarget,
  hits,
  imm88b2: findImm([0xb2, 0x88, 0x00, 0x00], 80),
  flagFaad: findImm([0xad, 0xfa, 0x36, 0x60], 40),
  flagFaac: findImm([0xac, 0xfa, 0x36, 0x60], 40),
  scale143f: findImm([0x3f, 0x14], 40),
  scale0f2f: findImm([0x2f, 0x0f], 40),
  paintEntry: { addr: '0x610eedc5', bytes: bytes(0x610eedc5, 96) },
  setterHead: { addr: '0x60063431', bytes: bytes(0x60063431, 64) },
};
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-static-b1.json'), JSON.stringify(report, null, 2) + '\n');
const summary = {
  hitCount: hits.length,
  byTarget,
  imm88b2: report.imm88b2.length,
  flagFaad: report.flagFaad.length,
  flagFaac: report.flagFaac.length,
  scale143f: report.scale143f.length,
  scale0f2f: report.scale0f2f.length,
};
console.log(JSON.stringify(summary, null, 2));
