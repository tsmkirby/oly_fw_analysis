// Check the correction listings against the stock image, and find callers of
// the two functions that call 0x609eece3. Reads only. Do not edit after it has run.
// Usage: node26 work/scripts/check_calls_c1.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));

function s16(o) { const n = image[o] | (image[o + 1] << 8); return n & 0x8000 ? n - 0x10000 : n; }
function u32(o) { return (image[o] | (image[o + 1] << 8) | (image[o + 2] << 16) | (image[o + 3] << 24)) >>> 0; }

const files = [
  'work/out/disasm-boundary-c1.txt',
  'work/out/disasm-poscall-a-c1.txt',
  'work/out/disasm-poscall-b-c1.txt',
  'work/out/disasm-getter-c1.txt',
  'work/out/disasm-rectcall-a-c1.txt',
  'work/out/disasm-rectcall-b-c1.txt',
];
const checked = [];
for (const file of files) {
  const lines = readFileSync(resolve(file), 'utf8').trim().split(/\n/);
  let mismatches = 0;
  let bytes = 0;
  const bad = [];
  for (const line of lines) {
    const [addr, hex] = line.split('\t');
    if (!hex || hex === '??') continue;
    const pc = parseInt(addr, 16);
    const raw = hex.match(/../g).map((b) => parseInt(b, 16));
    bytes += raw.length;
    for (let i = 0; i < raw.length; i++) {
      if (image[pc - BASE + i] !== raw[i]) {
        mismatches += 1;
        if (bad.length < 4) bad.push(addr);
      }
    }
  }
  checked.push({ file, lines: lines.length, bytes, mismatches, bad });
}

const targets = new Set([0x607118c9, 0x60907d9c, 0x609eece3, 0x610f6649]);
const hits = [];
for (let o = 0; o < image.length - 7; o++) {
  const op = image[o];
  if (op !== 0xcd && op !== 0xdd) continue;
  const pc = (BASE + o) >>> 0;
  let target, size;
  if (op === 0xcd) {
    target = (pc + s16(o + 1)) >>> 0;
    size = image[o + 4];
  } else {
    target = (pc + u32(o + 1)) >>> 0;
    size = image[o + 6];
  }
  if (!targets.has(target)) continue;
  if ((size & 3) !== 0 || size > 0x80) continue;
  hits.push({ pc: '0x' + pc.toString(16), op: op === 0xcd ? 'cd' : 'dd', target: '0x' + target.toString(16), size });
}
const byTarget = {};
for (const hit of hits) {
  if (!byTarget[hit.target]) byTarget[hit.target] = [];
  byTarget[hit.target].push(hit.pc);
}
const report = { checked, byTarget, hits };
writeFileSync(resolve('work/out/check-calls-c1.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checked, byTarget }));
