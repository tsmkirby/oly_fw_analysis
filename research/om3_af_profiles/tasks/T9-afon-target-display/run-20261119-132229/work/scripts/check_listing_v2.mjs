// Check the later stock listings against the decoded image. Reads only.
// Do not edit after it has run.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const files = [
  'work/out/disasm-pos-entry-v1.txt',
  'work/out/disasm-kind3-v1.txt',
  'work/out/disasm-caller-a-v1.txt',
  'work/out/disasm-caller-b-v1.txt',
  'work/out/disasm-88b2c-v1.txt',
  'work/out/disasm-pos-head-v1.txt',
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
      if (image[pc - BASE + i] !== bytes[i]) {
        mismatches += 1;
        if (bad.length < 4) bad.push(addr);
      }
    }
  }
  checked.push({ file, lines: lines.length, mismatches, bad });
}
const small = JSON.parse(readFileSync(resolve('work/out/obs-k1-v2.jsonl'), 'utf8').trim().split(/\n/).find((l) => l.includes('"id":"v2-small-rest"')));
const report = { checked, smallUnionSha256: small.unionSha256 };
writeFileSync(resolve('work/out/check-listing-v2.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
