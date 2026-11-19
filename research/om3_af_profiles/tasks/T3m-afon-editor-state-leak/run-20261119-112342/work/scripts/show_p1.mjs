// Read leak-p1-summary.json and print the position-994 cells.
// Observation helper. No emulator. Do not edit after it has run.
import { readFileSync } from 'node:fs';

const doc = JSON.parse(readFileSync('work/out/leak-p1-summary.json', 'utf8'));
const find = doc.sessions.find.leaked;
const before = new Map(doc.sessions.trace.before.map((x) => [x.addr, x]));
const after = new Map(doc.sessions.trace.after.map((x) => [x.addr, x]));

function u16(hex, start, addr) {
  const base = Number(start);
  const at = Number(addr);
  const off = (at - base) * 2;
  if (off < 0 || off + 4 > hex.length) return null;
  const lo = Number.parseInt(hex.slice(off, off + 2), 16);
  const hi = Number.parseInt(hex.slice(off + 2, off + 4), 16);
  return lo | (hi << 8);
}

for (const row of find) {
  const b = before.get(row.addr);
  const a = after.get(row.addr);
  const fb = b ? u16(b.blob.hex, b.blob.start, row.addr) : null;
  const fa = a ? u16(a.blob.hex, a.blob.start, row.addr) : null;
  const ff = u16(row.blob.hex, row.blob.start, row.addr);
  console.log([row.addr, 'find', row.value, 'blob', ff, 'boot', b && b.value, 'bootBlob', fb, 'exit', a && a.value, 'exitBlob', fa].join(' '));
}

const trace = doc.sessions.trace;
console.log('--- up reads ---');
for (const r of trace.upReads) console.log(r.label, r.dir, r.addr, 'v', r.value, 'sz', r.size, 'pc', r.pc, 'n', r.n);
console.log('--- dial reads ---');
for (const r of trace.dialReads) console.log(r.label, r.dir, r.addr, 'v', r.value, 'sz', r.size, 'pc', r.pc, 'n', r.n);
console.log('--- writes of 994 or the global ---');
for (const r of trace.writes) {
  if (r.value === 994 || r.addr === '0x60379d64' || r.addr === '0x62953c10' || r.addr === '0xa2953c10') {
    console.log(r.label, r.dir, r.addr, 'v', r.value, 'sz', r.size, 'pc', r.pc, 'n', r.n);
  }
}
console.log('getDiffUp', JSON.stringify(trace.getDiffUp));
console.log('getDiffDial', JSON.stringify(trace.getDiffDial));
