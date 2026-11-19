// Static. Locate halfword stores to sp+0x9c and sp+0x9e in the origin routine,
// and print the bytes around the flag-set caller 0x6004d46c. No emulator.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const img = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const b = (addr) => img[addr - BASE];
const hexb = (addr, n) => {
  const parts = [];
  for (let i = 0; i < n; i++) parts.push(b(addr + i).toString(16).padStart(2, '0'));
  return parts.join(' ');
};
const stores = [];
for (let a = 0x61184e00; a < 0x61185400; a++) {
  if (b(a) !== 0xf8) continue;
  const op = b(a + 1);
  const disp = b(a + 2);
  if (disp !== 0x9c && disp !== 0x9e && disp !== 0xc0 && disp !== 0xc4) continue;
  stores.push({ addr: '0x' + a.toString(16), bytes: hexb(a, 3), op: op.toString(16), disp: disp.toString(16) });
}
const out = {
  stores,
  flagCaller: hexb(0x6004d440, 48),
  entry: hexb(0x61184e40, 32),
};
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/scan-slots-c4.json'), JSON.stringify(out, null, 2));
process.stdout.write(JSON.stringify(stores) + '\n');
process.stdout.write('flag ' + out.flagCaller + '\n');
process.stdout.write('entry ' + out.entry + '\n');
