// Static. No emulator. Locate the dispatcher that contains calls at 0x610c8b66,
// and the store that fills (0x38,sp) inside the frame writer.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const hex = (v) => '0x' + (v >>> 0).toString(16);

function insnLen(op, p) {
  if (op <= 0x0f) return (op & 3) ? 3 : 1;
  if (op <= 0x1f) return 1;
  if (op <= 0x23 || (op >= 0x28 && op <= 0x2b)) return 2;
  if (op <= 0x3b) return 3;
  if (op <= 0x3f) return 1;
  if (op <= 0x4f) return (op & 3) >= 2 ? 2 : 1;
  if (op <= 0x57) return 1;
  if (op <= 0x5f) return 2;
  if (op <= 0x7f) return 1;
  if (op <= 0xbf) return ((op >> 2) & 3) === (op & 3) ? 2 : 1;
  if (op <= 0xca) return 2;
  switch (op) {
    case 0xcb: return 1; case 0xcc: return 3; case 0xcd: return 5; case 0xce: case 0xcf: return 2;
    case 0xdc: return 5; case 0xdd: return 7; case 0xde: case 0xdf: return 3; case 0xf7: return 1;
    case 0xf8: case 0xf9: return 3; case 0xfa: case 0xfb: return 4; case 0xfc: case 0xfd: return 6;
    case 0xfe: return (p & 0x80) ? 5 : 7; case 0xff: return 1;
  }
  if (op <= 0xef) return 1;
  return 2;
}

function walk(start, end) {
  const hits = [];
  let pc = start;
  while (pc < end) {
    const o = pc - BASE;
    const op = image[o];
    const pre = op >= 0xf0 && op <= 0xfe && op !== 0xf7;
    const p = pre ? image[o + 1] : 0;
    const len = insnLen(op, p);
    if ((op & 0xfc) === 0x40 && (op & 3) >= 2 && image[o + 1] === 0x38) {
      hits.push({ pc: hex(pc), op: op.toString(16), what: (op & 3) === 2 ? 'store-d' : 'store-a', src: (op >> 2) & 3 });
    }
    if (op >= 0x58 && op <= 0x5b && image[o + 1] === 0x38) {
      hits.push({ pc: hex(pc), op: op.toString(16), what: 'load-d', dst: op & 3 });
    }
    if (op >= 0x5c && op <= 0x5f && image[o + 1] === 0x38) {
      hits.push({ pc: hex(pc), op: op.toString(16), what: 'load-a', dst: op & 3 });
    }
    pc += len;
  }
  return hits;
}

const stores = walk(0x61184e51, 0x61186000);
let prevRet = null;
for (let pc = 0x610c8b66; pc > 0x610c8000; pc--) {
  const o = pc - BASE;
  if (image[o] === 0xdf) { prevRet = pc; break; }
}
const out = { sp38: stores, prevRetBeforeDispatcher: prevRet === null ? null : hex(prevRet) };
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-static-d4.json'), JSON.stringify(out, null, 2));
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
