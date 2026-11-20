// Static scan for displacement stores. No emulator.
import { readFileSync } from 'node:fs';
const img = readFileSync('inputs/00_0100_50000020.decoded.bin');
const BASE = 0x60021020;
function region(start, end) {
  const a = start - BASE;
  const b = end - BASE;
  const hits = [];
  for (let i = a; i < b - 6; i++) {
    const op = img[i];
    const p = img[i + 1];
    if (op !== 0xf8 && op !== 0xfa && op !== 0xfc) continue;
    if ((p & 0x10) === 0 || p >= 0x80) continue;
    let disp;
    if (op === 0xf8) disp = img[i + 2] << 24 >> 24;
    else if (op === 0xfa) {
      disp = img[i + 2] | (img[i + 3] << 8);
      if (disp & 0x8000) disp -= 0x10000;
    } else disp = (img[i + 2] | (img[i + 3] << 8) | (img[i + 4] << 16) | (img[i + 5] << 24)) | 0;
    const mw = p < 0x40 ? 4 : p < 0x60 ? 1 : 2;
    if (disp === 0x28 || disp === 0x374 || disp === 0x34c || disp === 0x370 || disp === 0x378 || disp === 0x24 || disp === 0x2c) {
      hits.push({ addr: '0x' + (BASE + i).toString(16), p: '0x' + p.toString(16), disp: '0x' + (disp >>> 0).toString(16), mw });
    }
  }
  return hits;
}
const spans = [
  [0x610cd5ac, 0x610cd900, 'cd5ac'],
  [0x610cdc43, 0x610ce400, 'cdc43'],
  [0x610fd3a3, 0x610fe200, 'fd3a3'],
  [0x61184dd6, 0x61186000, 'frame'],
];
for (const [s, e, name] of spans) {
  const h = region(s, e);
  console.log(name, h.length);
  for (const x of h) console.log(' ', x.addr, 'p', x.p, 'disp', x.disp, 'w', x.mw);
}
