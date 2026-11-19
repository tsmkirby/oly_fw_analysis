// Static call scan of the stock image. Reads the image and writes one JSON file.
// Finds cd/dd calls whose target is one of the listed entries, and dumps the
// bytes after the return at 0x609eece0. Do not edit after it has run.
// Usage: node26 work/scripts/scan_calls_c1.mjs
import { readFileSync, writeFileSync } from 'node:fs';
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

const ret = { addr: hex(0x609eece0), bytes: bytes(0x609eece0, 3), next: hex(0x609eece3), nextBytes: bytes(0x609eece3, 48) };
const window = [];
for (let a = 0x609eec70; a < 0x609eee40; a += 16) window.push({ addr: hex(a), bytes: bytes(a, 16) });

const targets = new Set([
  0x609eec84, 0x609eece3, 0x609eed00, 0x609eed24,
  0x610f6649, 0x610f74e6, 0x6041a202, 0x60063380,
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
  if ((size & 3) !== 0 || size > 0x80) continue;
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

const report = {
  imageBytes: image.length,
  ret,
  window,
  getterCaller: { addr: '0x6041a1e0', bytes: bytes(0x6041a1e0, 64) },
  rectEntry: { addr: '0x610f6649', bytes: bytes(0x610f6649, 16) },
  hitCount: hits.length,
  byTarget,
  hits,
};
writeFileSync(resolve('work/out/scan-calls-c1.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ hitCount: hits.length, byTarget, retBytes: ret.bytes, nextBytes: ret.nextBytes }));
