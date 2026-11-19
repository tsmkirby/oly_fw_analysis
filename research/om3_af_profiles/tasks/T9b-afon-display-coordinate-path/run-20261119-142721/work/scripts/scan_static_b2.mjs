// Second static scan. Call targets into the paint-caller window, the live
// setter, and the invalidation writers. Do not edit after it has run.
// Usage: node26 work/scripts/scan_static_b2.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));

function u16(addr) { const o = addr - BASE; return image[o] | (image[o + 1] << 8); }
function s16(addr) { const n = u16(addr); return n & 0x8000 ? n - 0x10000 : n; }
function u32(addr) {
  const o = addr - BASE;
  return (image[o] | (image[o + 1] << 8) | (image[o + 2] << 16) | (image[o + 3] << 24)) >>> 0;
}
function hex(v) { return '0x' + (v >>> 0).toString(16); }
function bytes(addr, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(image[addr - BASE + i].toString(16).padStart(2, '0'));
  return out.join('');
}

const named = new Set([0x60063116, 0x600634ee, 0x60070fd4, 0x610f7106, 0x610f6114, 0x610f32c0, 0x610ee200]);
const namedHits = [];
const windowHits = [];
for (let o = 0; o < image.length - 7; o++) {
  const op = image[o];
  if (op !== 0xcd && op !== 0xdd) continue;
  const pc = (BASE + o) >>> 0;
  let target, length;
  if (op === 0xcd) {
    target = (pc + s16(pc + 1)) >>> 0;
    length = 5;
  } else {
    target = (pc + u32(pc + 1)) >>> 0;
    length = 7;
  }
  if (named.has(target)) {
    namedHits.push({ pc: hex(pc), op: op === 0xcd ? 'cd' : 'dd', target: hex(target), bytes: bytes(pc, length) });
  }
  if (target >= 0x610edc00 && target <= 0x610ee2a8) {
    windowHits.push({ pc: hex(pc), target: hex(target) });
  }
}
namedHits.sort((a, b) => a.target.localeCompare(b.target) || a.pc.localeCompare(b.pc));
windowHits.sort((a, b) => a.target.localeCompare(b.target) || a.pc.localeCompare(b.pc));

function findImm(pattern, limit) {
  const out = [];
  const n = pattern.length;
  for (let o = 0; o <= image.length - n && out.length < limit; o++) {
    let ok = true;
    for (let i = 0; i < n; i++) if (image[o + i] !== pattern[i]) { ok = false; break; }
    if (!ok) continue;
    const pc = (BASE + o) >>> 0;
    out.push({ addr: hex(pc), before: bytes(pc - 4, 4), after: bytes(pc, 8) });
  }
  return out;
}

const byNamed = {};
for (const hit of namedHits) {
  if (!byNamed[hit.target]) byNamed[hit.target] = [];
  byNamed[hit.target].push(hit.pc);
}
const report = {
  byNamed,
  namedHits,
  windowCallCount: windowHits.length,
  windowHits,
  dirty: findImm([0x32, 0xfb, 0x2b, 0xa3], 20),
};
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-static-b2.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ byNamed, windowCallCount: windowHits.length, windowTargets: [...new Set(windowHits.map((h) => h.target))], dirty: report.dirty.length }, null, 2));
