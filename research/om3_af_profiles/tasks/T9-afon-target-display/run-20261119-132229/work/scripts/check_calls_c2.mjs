// Check the later correction listings against the stock image. Reads only.
// Do not edit after it has run.
// Usage: node26 work/scripts/check_calls_c2.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const files = [
  'work/out/disasm-update-c1.txt',
  'work/out/disasm-drawbody-c1.txt',
  'work/out/disasm-widgetptr-c1.txt',
  'work/out/disasm-widgetcaller-c1.txt',
  'work/out/disasm-widgetcall-c1.txt',
  'work/out/disasm-callsite-c1.txt',
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
const call = image[(0x610eee11 - BASE)] === 0xf0 && image[(0x610eee12 - BASE)] === 0xf2;
const ret = [0xdf, 0x30, 0x10].every((b, i) => image[(0x609eece0 - BASE) + i] === b);
const report = { checked, callsA2At610eee11: call, retAt609eece0: ret };
writeFileSync(resolve('work/out/check-calls-c2.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
if (checked.some((c) => c.mismatches !== 0) || !call || !ret) process.exit(1);
