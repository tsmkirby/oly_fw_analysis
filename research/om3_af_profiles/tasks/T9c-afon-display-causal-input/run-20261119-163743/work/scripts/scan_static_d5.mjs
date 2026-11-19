// Static scan. Call sites of the position thunk and the gate, whole main image.
// No emulator.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const hex = (v) => '0x' + (v >>> 0).toString(16);
const want = new Set([0x60419315, 0x6041931e, 0x6041935b, 0x60063380, 0x610cdc43, 0x610fd3a3]);

const hits = [];
for (let o = 0; o + 6 < image.length; o++) {
  const op = image[o];
  if (op !== 0xcd && op !== 0xdd) continue;
  const w = op === 0xcd ? 2 : 4;
  let disp = 0;
  for (let i = 0; i < w; i++) disp |= image[o + 1 + i] << (8 * i);
  if (w === 2 && (disp & 0x8000)) disp -= 0x10000;
  const pc = (BASE + o) >>> 0;
  const target = (pc + disp) >>> 0;
  if (want.has(target)) hits.push({ pc: hex(pc), op: hex(op), target: hex(target) });
}
const out = { hits: hits.length, rows: hits };
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-calls-d5.json'), JSON.stringify(out, null, 2) + '\n');
process.stdout.write('hits ' + hits.length + '\n');
for (const row of hits) process.stdout.write(row.pc + ' ' + row.op + ' -> ' + row.target + '\n');
