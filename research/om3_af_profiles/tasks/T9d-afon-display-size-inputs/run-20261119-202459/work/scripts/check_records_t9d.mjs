// Listing check, T6 section classification, and the per-edge table.
// No emulator. Do not edit after it has run.
// Usage: node26 work/scripts/check_records_t9d.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 0x60021020;
const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
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
    rows.push({ n, start, end });
  }
  if (table !== 0x60029b28) throw new Error('table ' + table.toString(16));
  return { base, table, count, rows };
}
function sectionOf(rows, addr) {
  const c = addr >= 0xa0000000 && addr < 0xc0000000 ? (addr - 0x40000000) >>> 0 : addr >>> 0;
  return rows.find((row) => row.start <= c && c < row.end) || null;
}

const base = imageBase();
if (base !== BASE) throw new Error('base ' + base.toString(16));
const info = sections(base);
const csv = readFileSync(resolve('ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv'), 'utf8');
const lines = csv.trim().split(/\n/);
const header = lines[0].split(',');
const ai = header.indexOf('runtime_address');
const oi = header.indexOf('component_offset');
const si = header.indexOf('stock_byte');
const counts = {};
const problems = [];
const section67 = [];
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
  if (sec.n === 6 || sec.n === 7) section67.push({ addr: '0x' + addr.toString(16), section: sec.n });
}

const listings = [];
let mismatches = 0;
let checked = 0;
for (const name of readdirSync(resolve('work/out'))) {
  if (!/^disasm-.*-t9d\.txt$/.test(name)) continue;
  const text = readFileSync(resolve('work/out', name), 'utf8');
  let bad = 0;
  let n = 0;
  for (const line of text.split(/\n/)) {
    const m = line.match(/^([0-9a-fA-F]{8})\t([0-9a-fA-F]+)\t/);
    if (!m) continue;
    const addr = parseInt(m[1], 16);
    const bytes = m[2];
    const off = addr - BASE;
    n += 1;
    const got = Buffer.from(image.subarray(off, off + bytes.length / 2)).toString('hex');
    if (got !== bytes.toLowerCase()) bad += 1;
  }
  checked += n;
  mismatches += bad;
  listings.push({ file: 'work/out/' + name, instructions: n, mismatches: bad });
}

const edges = {};
for (const [name, file] of [
  ['k2', 'work/out/obs-k2-t9d.jsonl'],
  ['a', 'work/out/obs-seed-a.jsonl'],
  ['b', 'work/out/obs-seed-b.jsonl'],
  ['k1', 'work/out/obs-k1-t9d.jsonl'],
]) {
  const rows = readFileSync(resolve(file), 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
  edges[name] = rows.filter((r) => r.step === 'edge' || r.step === 'done').map((r) => ({
    id: r.id,
    pass: r.pass,
    problems: r.problems,
    owner: r.actual && r.actual.owner,
    latencyMs: r.actual && r.actual.latencyMs,
    referenceChanged: r.actual && r.actual.referenceChanged,
    drifted: r.actual && r.actual.drifted,
    pixels: r.actual && r.actual.pixels,
    n31: r.actual && r.actual.n31,
    marks: r.actual && r.actual.marks,
    counts: r.actual && r.actual.counts,
  }));
}

const report = {
  imageBase: '0x' + base.toString(16),
  table: '0x' + info.table.toString(16),
  overlayRows: lines.length - 1,
  sectionCounts: counts,
  section67,
  overlayProblems: problems,
  listings,
  checked,
  mismatches,
  edges,
};
writeFileSync(resolve('work/out/check-records-t9d.json'), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({
  overlayRows: report.overlayRows,
  sectionCounts: counts,
  section67,
  overlayProblems: problems.length,
  checked,
  mismatches,
}) + '\n');
if (problems.length || mismatches) process.exit(1);
