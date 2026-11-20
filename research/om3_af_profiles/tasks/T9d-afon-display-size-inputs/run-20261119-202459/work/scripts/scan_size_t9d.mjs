// Static scan of the frame writer. No emulator. Do not edit after it has run.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const hex = (v) => '0x' + (v >>> 0).toString(16);
function u16(o) { return image[o] | (image[o + 1] << 8); }
function u32(o) {
  return (image[o] | (image[o + 1] << 8) | (image[o + 2] << 16) | (image[o + 3] << 24)) >>> 0;
}
function off(addr) { return (addr - BASE) >>> 0; }

const calls = [];
const lo = off(0x61184000);
const hi = off(0x61188000);
for (let o = lo; o + 7 < hi; o++) {
  const op = image[o];
  if (op !== 0xcd && op !== 0xdd) continue;
  const w = op === 0xcd ? 2 : 4;
  let disp = 0;
  for (let i = 0; i < w; i++) disp |= image[o + 1 + i] << (8 * i);
  if (w === 2 && (disp & 0x8000)) disp -= 0x10000;
  const pc = (BASE + o) >>> 0;
  const target = (pc + disp) >>> 0;
  if (target === 0x60063380 || target === 0x60419315 || target === 0x6041935b || target === 0x60b8696a) {
    calls.push({ pc: hex(pc), op: hex(op), target: hex(target), next: hex((pc + (op === 0xdd ? 7 : 5)) >>> 0) });
  }
}

const stores = [];
for (let o = lo; o + 1 < hi; o++) {
  const b0 = image[o];
  const b1 = image[o + 1];
  if (b1 === 0x5c && b0 >= 0x42 && b0 <= 0x47) {
    stores.push({ pc: hex((BASE + o) >>> 0), bytes: b0.toString(16) + b1.toString(16) });
  }
}

const adds = [];
const needles = [
  [0xfa, 0xd0, 0x74, 0x03], [0xfa, 0xd1, 0x74, 0x03], [0xfa, 0xd2, 0x74, 0x03], [0xfa, 0xd3, 0x74, 0x03],
];
for (const n of needles) {
  for (let o = 0; o + n.length <= image.length; o++) {
    let ok = true;
    for (let i = 0; i < n.length; i++) if (image[o + i] !== n[i]) { ok = false; break; }
    if (ok) adds.push({ pc: hex((BASE + o) >>> 0), bytes: n.map((b) => b.toString(16).padStart(2, '0')).join('') });
  }
}

const tableAt = off(0x61470350);
const table = [];
for (let i = 0; i < 12; i++) table.push({ index: i, target: hex(u32(tableAt + i * 4)) });

const head = off(0x61184e20);
const headBytes = [];
for (let i = 0; i < 32; i++) headBytes.push(image[head + i].toString(16).padStart(2, '0'));

const known = [
  { pc: 0x61185231, bytes: [0xa0, 0x02] },
  { pc: 0x61185253, bytes: [0x80, 0x03] },
  { pc: 0x61185257, bytes: [0x80, 0x01] },
  { pc: 0x6118525f, bytes: [0x80, 0x09] },
  { pc: 0x61185267, bytes: [0x80, 0x0f] },
  { pc: 0x61185280, bytes: [0x2c, 0x7a, 0x06] },
  { pc: 0x61185296, bytes: [0x2c, 0x79, 0x06] },
];
const checks = known.map((row) => {
  const o = off(row.pc);
  const got = Array.from(image.subarray(o, o + row.bytes.length));
  return {
    pc: hex(row.pc),
    expect: row.bytes.map((b) => b.toString(16).padStart(2, '0')).join(''),
    got: got.map((b) => b.toString(16).padStart(2, '0')).join(''),
    match: got.every((b, i) => b === row.bytes[i]),
  };
});

const out = { calls, stores, adds, table, headBytes: headBytes.join(''), checks };
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-size-t9d.json'), JSON.stringify(out, null, 2) + '\n');
process.stdout.write(JSON.stringify({
  calls: calls.length, stores: stores.length, adds: adds.length,
  checks: checks.every((c) => c.match),
}, null, 2) + '\n');
for (const c of calls) process.stdout.write(c.pc + ' -> ' + c.target + ' next ' + c.next + '\n');
process.stdout.write('stores ' + JSON.stringify(stores) + '\n');
process.stdout.write('adds ' + JSON.stringify(adds) + '\n');
process.stdout.write('table ' + JSON.stringify(table) + '\n');
process.stdout.write('head ' + headBytes.join(' ') + '\n');
