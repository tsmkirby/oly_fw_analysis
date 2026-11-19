// Section of every T6 overlay row, from the image table at 0x60029b28.
// Also hashes the version-6 screenshots. No emulator. Do not edit after it has run.
// Usage: node26 work/scripts/section_rows_t9b.mjs
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const csv = readFileSync(resolve('ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv'), 'utf8');
const FLASH = 0x50000000;
const ROW = 12;
const LOAD = [0xf1, 0xe3, 0x8f, 0xff, 0xe3, 0xcd, null, null, 0x00, 0x00, 0x82, 0x8c, 0x14, 0xf9, 0x14, 0x0c, 0xf1, 0xe2, 0xfc, 0xd2];
const SWITCH = [0x04, 0xa0, 0x01, 0xc0, null, 0xa0, null, 0xc1, null, 0x28, 0xff, 0x54, 0xfc, 0xdc, null, null, null, null, 0xf3, 0x80, 0xf0, 0xf4];
const PERMITTED = new Set([0x610bf5e3, 0x610bf5e4, 0x610bf5e5]);

function u32(off) {
  return (image[off] | (image[off + 1] << 8) | (image[off + 2] << 16) | (image[off + 3] << 24)) >>> 0;
}
function match(off, pat) {
  if (off < 0 || off + pat.length > image.length) return false;
  return pat.every((p, i) => p === null || image[off + i] === p);
}
function one(pat) {
  const hits = [];
  for (let o = 0; o + pat.length <= image.length; o++) if (match(o, pat)) hits.push(o);
  if (hits.length !== 1) throw new Error('pattern hits ' + hits.length);
  return hits[0];
}
function callAt(o) {
  const op = image[o];
  if (op === 0xdd) {
    let d = u32(o + 1);
    if (d & 0x80000000) d -= 0x100000000;
    return o + d;
  }
  if (op === 0xcd) {
    const d = image[o + 1] | (image[o + 2] << 8);
    return o + (d & 0x8000 ? d - 0x10000 : d);
  }
  throw new Error('not a call at ' + o.toString(16));
}
function imageBase() {
  const hits = [];
  for (let o = 0; o <= Math.min(0x400, image.length - 8); o++) {
    if (image[o] === 0xfc && image[o + 1] === 0xdc && image[o + 6] === 0xf0 && image[o + 7] === 0xf4) hits.push(o);
  }
  if (hits.length !== 1) throw new Error('image base jumps ' + hits.length);
  const target = u32(hits[0] + 2);
  return (target & ~0xfff) | 0x20;
}
function sections(base) {
  const at = one(LOAD);
  const table = u32(at + 20);
  const switchOff = callAt(at + 5);
  if (!match(switchOff, SWITCH)) throw new Error('switch mismatch');
  const count = image[switchOff + 6];
  const jt = u32(switchOff + 14) - base;
  const rows = [];
  for (let n = 1; n <= count; n++) {
    const caseOff = u32(jt + 4 * (n - 1)) - base;
    if (image[caseOff] !== 0xfc || image[caseOff + 1] !== 0xcc) throw new Error('case ' + n);
    const end = u32(caseOff + 2);
    const row = table - base + ROW * (n - 1);
    const start = u32(row);
    rows.push({ n, start, end, src: u32(row + 4), flag: u32(row + 8) });
  }
  if (table !== 0x60029b28) throw new Error('table ' + table.toString(16));
  return { base, table, count, rows };
}
function sectionOf(rows, addr) {
  const c = addr >= 0xa0000000 && addr < 0xc0000000 ? (addr - 0x40000000) >>> 0 : addr >>> 0;
  return rows.find((row) => row.start <= c && c < row.end) || null;
}

const base = imageBase();
const info = sections(base);
const lines = csv.trim().split(/\n/);
const header = lines[0].split(',');
const ai = header.indexOf('runtime_address');
const oi = header.indexOf('component_offset');
const si = header.indexOf('stock_byte');
const counts = {};
const problems = [];
const section7 = [];
for (const line of lines.slice(1)) {
  if (!line) continue;
  const col = line.split(',');
  const addr = parseInt(col[ai], 16);
  const off = parseInt(col[oi], 16);
  const stock = parseInt(col[si], 16);
  if (image[off] !== stock) problems.push('stock ' + addr.toString(16));
  const sec = sectionOf(info.rows, addr);
  if (!sec) { problems.push('none ' + addr.toString(16)); continue; }
  counts[sec.n] = (counts[sec.n] || 0) + 1;
  if ((sec.n === 6 || sec.n === 7) && !PERMITTED.has(addr)) problems.push('forbidden ' + addr.toString(16));
  if (sec.n === 7) section7.push('0x' + addr.toString(16));
}
const pngs = [
  'work/out/obs-trace-v6-stock-rest.png',
  'work/out/obs-trace-v6-stock-after.png',
  'work/out/obs-trace-v6-seeded-rest.png',
  'work/out/obs-trace-v6-seeded-afon.png',
  'work/out/obs-trace-v6-unseeded-rest.png',
  'work/out/obs-trace-v6-unseeded-afon.png',
].map((p) => {
  const b = readFileSync(resolve(p));
  return { path: p, sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
});
const report = {
  table: '0x' + info.table.toString(16),
  base: '0x' + info.base.toString(16),
  sections: info.rows.map((r) => ({ n: r.n, start: '0x' + r.start.toString(16), end: '0x' + r.end.toString(16) })),
  rows: lines.length - 1,
  counts,
  section7,
  problems,
  pngs,
};
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(resolve('work/out/section-rows-t9b.json'), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ rows: report.rows, counts, section7, problems, pngs }) + '\n');
if (problems.length) process.exit(1);
