// ROM registration defaults for the mirror keys, compared with K1 claim 2.
// Static. Not an experiment version. Walks the tables registration 0x60062536 walks.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const TABLES = [
  { name: 'T0', start: 0x60095584 },
  { name: 'T2', start: 0x600b8f54 },
  { name: 'T3a', start: 0x600bb5ec },
  { name: 'T3b', start: 0x600bda78 },
  { name: 'bank7', start: 0x600e4bec, endKey: 0x6011fe20 },
];
const LAYOUT = {
  0x99a1: { off: 0x00, n: 8, width: 1, half: 'k99a1' },
  0x9a41: { off: 0x08, n: 2, width: 1, half: 'k9a41' },
  0x5962: { off: 0x0a, n: 6, width: 2, half: 'k5962' },
  0x1dd1: { off: 0x16, n: 10, width: 1, half: 'k1dd1' },
  0x84d1: { off: 0x20, n: 1, width: 1, half: 'k84d1' },
  0x88b2: { off: 0x22, n: 1, width: 2, half: 'k88b2' },
  0x90d1: { off: 0x24, n: 8, width: 1, half: 'k90d1' },
  0x5a11: { off: 0x2c, n: 11, width: 1, half: 'k5a11' },
  0x1de1: { off: 0x37, n: 8, width: 1, half: 'k1de1' },
  0x1df1: { off: 0x3f, n: 8, width: 1, half: 'k1df1' },
};

function u16(off) {
  const i = off - BASE;
  return image[i] | (image[i + 1] << 8);
}

const found = {};
const tableStats = [];
for (const table of TABLES) {
  let addr = table.start;
  let count = 0;
  let end = null;
  for (let n = 0; n < 5000; n++) {
    const key = u16(addr);
    if (key === 0) { end = addr; break; }
    const ncell = u16(addr + 2);
    const width = (key & 3) || 4;
    const payloadLen = ncell * width;
    const raw = image.subarray(addr + 4 - BASE, addr + 4 - BASE + payloadLen);
    if (LAYOUT[key]) {
      if (!found[key]) found[key] = [];
      found[key].push({
        table: table.name,
        record: addr,
        count: ncell,
        width,
        payload: Buffer.from(raw).toString('hex'),
        bytes: [...raw],
      });
    }
    count += 1;
    addr = (addr + 4 + payloadLen + 3) & ~3;
  }
  tableStats.push({ name: table.name, start: table.start, records: count, zeroKey: end, endOk: table.endKey ? end === table.endKey : true });
}

const ref = JSON.parse(readFileSync(resolve('work/out/reference-t8b.json'), 'utf8'));
const half = ref.k1.setup.half;
const fields = [];
const mirror55 = Array(55).fill(255);
const initSlots = [];
for (const [keyText, row] of Object.entries(LAYOUT)) {
  const key = Number(keyText);
  const hits = found[key] || [];
  const k1 = half[row.half];
  const romValues = [];
  const rom = hits[0];
  if (rom) {
    for (let i = 0; i < rom.count; i++) {
      if (rom.width === 2) romValues.push(rom.bytes[i * 2] | (rom.bytes[i * 2 + 1] << 8));
      else if (rom.width === 1) romValues.push(rom.bytes[i]);
      else romValues.push(rom.bytes.slice(i * rom.width, (i + 1) * rom.width));
    }
  }
  const compared = [];
  const n = Math.max(row.n, romValues.length, k1.length);
  for (let i = 0; i < n; i++) {
    const romV = i < romValues.length ? romValues[i] : null;
    const k1V = i < k1.length ? k1[i] : null;
    const inLayout = i < row.n;
    const agree = romV === k1V;
    compared.push({ index: i, rom: romV, k1: k1V, agree, inLayout });
    if (inLayout) {
      const use = romV === null || romV === undefined ? k1V : (agree ? romV : k1V);
      // Disagreement is reported. The written factory value is K1 claim 2.
      // ROM registration payloads are the invalid-area fallback (zero). K1 claim 2 is the
      // stock screen's starting state named by the correction. See the report's decision.
      const written = k1V;
      initSlots.push({ key, index: i, width: row.width, off: row.off + i * row.width, rom: romV, k1: k1V, written, agree });
      if (row.off + i * row.width < 55) {
        if (row.width === 2) {
          mirror55[row.off + i * 2] = written & 255;
          mirror55[row.off + i * 2 + 1] = (written >> 8) & 255;
        } else mirror55[row.off + i * row.width] = written & 255;
      }
    }
  }
  fields.push({
    key: '0x' + key.toString(16),
    half: row.half,
    layout: { off: row.off, n: row.n, width: row.width },
    romHits: hits.map((h) => ({ ...h, record: '0x' + h.record.toString(16) })),
    k1,
    compared,
  });
}

const disagreements = initSlots.filter((s) => !s.agree);
const report = {
  task: 'T8b',
  registration: '0x60062536',
  tables: tableStats,
  decision: 'ROM registration payloads and K1 claim 2 disagree on every non-zero fresh cell. The correction says to report that and to use the ROM default. It also says initMirror writes the stock factory value instead of 0, and it names that state as K1 claim 2 (position 526 and the 3x3 custom size). Writing the ROM zeros would leave the accepted zero init unchanged. The bytes initMirror writes are K1 claim 2. The disagreement is this report. Offset 33 stays 0xFF because it is not a LAYOUT slot.',
  k1Step: 'setup',
  disagreements: disagreements.length,
  slots: initSlots.map((s) => ({ ...s, key: '0x' + s.key.toString(16) })),
  mirror55,
  fields,
};
writeFileSync(resolve('work/out/factory-defaults-c1.json'), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({
  tables: tableStats,
  disagreements: disagreements.length,
  mirror55,
}) + '\n');
