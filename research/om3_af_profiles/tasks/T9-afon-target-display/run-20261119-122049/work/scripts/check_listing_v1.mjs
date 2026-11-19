// Check the aligned stock listings against the decoded image, and locate the
// function that contains the 0x88b2 read at 0x609eed2d. Reads only.
// Do not edit after it has run.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const files = [
  'work/out/disasm-88b2-v1.txt',
  'work/out/disasm-rect-v1.txt',
  'work/out/disasm-rectb-v1.txt',
  'work/out/disasm-kind-v1.txt',
];
const checked = [];
for (const file of files) {
  const lines = readFileSync(resolve(file), 'utf8').trim().split(/\n/);
  let mismatches = 0;
  const bad = [];
  for (const line of lines) {
    const [addr, hex] = line.split('\t');
    if (!hex || hex === '??') continue;
    const pc = parseInt(addr, 16);
    const bytes = hex.match(/../g).map((b) => parseInt(b, 16));
    for (let i = 0; i < bytes.length; i++) {
      const got = image[pc - BASE + i];
      if (got !== bytes[i]) {
        mismatches += 1;
        if (bad.length < 6) bad.push({ addr, i, listing: bytes[i], image: got });
      }
    }
  }
  checked.push({ file, lines: lines.length, mismatches, bad });
}

const at = 0x609eed2d;
const back = image.subarray(at - BASE - 0x180, at - BASE);
const rets = [];
for (let i = back.length - 3; i >= 0; i--) {
  if (back[i] === 0xdf && (back[i + 1] & 0xf0) === 0xf0) {
    rets.push('0x' + (at - 0x180 + i).toString(16));
    if (rets.length >= 4) break;
  }
}

const table = 0x60a83854;
const entries = [];
for (let n = 0; n < 8; n++) {
  const o = table - BASE + n * 4;
  const p = image[o] | (image[o + 1] << 8) | (image[o + 2] << 16) | (image[o + 3] << 24);
  entries.push('0x' + (p >>> 0).toString(16));
}

const report = { checked, retsBefore88b2: rets, kindTable: '0x' + table.toString(16), kindEntries: entries };
writeFileSync(resolve('work/out/check-listing-v1.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
