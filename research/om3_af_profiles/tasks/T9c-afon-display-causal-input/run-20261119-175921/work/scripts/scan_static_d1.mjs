// Static scan of the stock image. No emulator. No behaviour change.
// Pointers to the indirect frame function, dirty-byte immediates, and the
// geometry jump table. Addresses are image addresses (file offset + 0x60021020).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const resource = readFileSync(resolve('inputs/02_0106_458c0020.decoded.bin'));
const hex = (v) => '0x' + (v >>> 0).toString(16);

function u32(buf, o) {
  return (buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16) | (buf[o + 3] << 24)) >>> 0;
}
function find32(buf, value, base) {
  const b0 = value & 0xff, b1 = (value >>> 8) & 0xff, b2 = (value >>> 16) & 0xff, b3 = (value >>> 24) & 0xff;
  const hits = [];
  for (let o = 0; o + 4 <= buf.length; o++) {
    if (buf[o] === b0 && buf[o + 1] === b1 && buf[o + 2] === b2 && buf[o + 3] === b3) {
      hits.push(base === null ? o : (base + o) >>> 0);
    }
  }
  return hits;
}
function windowOf(buf, addr, n) {
  const o = addr - BASE;
  const words = [];
  for (let i = 0; i < n; i++) words.push(hex(u32(buf, o + i * 4)));
  return words;
}

const ptr = 0x61184dd6;
const mainPtrs = find32(image, ptr, BASE);
const resPtrs = find32(resource, ptr, null);
const dirtyA = find32(image, 0xa32bfb32, BASE);
const dirtyC = find32(image, 0x632bfb32, BASE);
const tableAt = 0x61470350;
const table = windowOf(image, tableAt, 12);

const fnLo = 0x61184e51 - BASE;
const fnHi = 0x61186200 - BASE;
const imm364 = [];
const calls = [];
for (let o = fnLo; o + 7 < fnHi && o + 7 < image.length; o++) {
  const op = image[o];
  if (op === 0xfc || op === 0xfa || op === 0xf8) {
    const w = op === 0xfc ? 4 : op === 0xfa ? 2 : 1;
    if (w === 4 && o + 6 < image.length) {
      const imm = u32(image, o + 2);
      if (imm === 0x364 || imm === 0x88b2 || imm === 0x62c54158) {
        imm364.push({ pc: hex((BASE + o) >>> 0), op: hex(op), imm: hex(imm) });
      }
    }
  }
  if (op === 0xcd || op === 0xdd) {
    const w = op === 0xcd ? 2 : 4;
    let disp = 0;
    for (let i = 0; i < w; i++) disp |= image[o + 1 + i] << (8 * i);
    if (w === 2 && (disp & 0x8000)) disp -= 0x10000;
    const pc = (BASE + o) >>> 0;
    const target = (pc + disp) >>> 0;
    if (target === 0x6041a1f9 || target === 0x603f15b1 || target === 0x60419315 || target === 0x60063380 || target === 0x610cd5ac) {
      calls.push({ pc: hex(pc), target: hex(target) });
    }
  }
}

const around = mainPtrs.slice(0, 40).map((addr) => {
  const aligned = addr & ~3;
  const start = aligned - 16;
  let words = null;
  if (start >= BASE && start - BASE + 48 <= image.length) words = windowOf(image, start, 12);
  return { addr: hex(addr), aligned: hex(aligned), words };
});

const summary = {
  mainPtrCount: mainPtrs.length,
  mainPtrs: mainPtrs.map(hex),
  resourcePtrCount: resPtrs.length,
  resourcePtrs: resPtrs.slice(0, 20),
  dirtyUncached: dirtyA.map(hex),
  dirtyCached: dirtyC.map(hex),
  jumpTable: { at: hex(tableAt), words: table },
  fnImmediates: imm364,
  fnCalls: calls,
  around,
};
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-static-d1.json'), JSON.stringify(summary, null, 2));
process.stdout.write(JSON.stringify({
  mainPtrCount: summary.mainPtrCount,
  mainPtrs: summary.mainPtrs,
  resourcePtrCount: summary.resourcePtrCount,
  dirtyUncached: summary.dirtyUncached,
  dirtyCached: summary.dirtyCached,
  jumpTable: summary.jumpTable,
  fnImmediates: summary.fnImmediates,
  fnCalls: summary.fnCalls,
}, null, 2) + '\n');
