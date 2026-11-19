import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const files = [
  ['main', 'inputs/00_0100_50000020.decoded.bin', 0x60021020],
  ['res', 'inputs/02_0106_458c0020.decoded.bin', 0],
];
function scan(name, path, base) {
  const b = readFileSync(resolve(path));
  let n = 0;
  for (let o = 0; o + 8 < b.length; o += 2) {
    const a = b[o] | (b[o + 1] << 8);
    if (a !== 409) continue;
    const c = b[o + 6] | (b[o + 7] << 8);
    if (c !== 406) continue;
    n += 1;
    if (n <= 20) {
      const origin = o - 409 * 2;
      let e529 = null;
      if (origin >= 0 && origin + 529 * 2 + 2 <= b.length) e529 = b[origin + 529 * 2] | (b[origin + 529 * 2 + 1] << 8);
      process.stdout.write(name + ' at ' + (base + o).toString(16) + ' origin ' + (origin >= 0 ? (base + origin).toString(16) : 'neg') + ' e529 ' + e529 + '\n');
    }
  }
  process.stdout.write(name + ' hits ' + n + '\n');
}
for (const [n, p, base] of files) scan(n, p, base);
