// Halfword windows around the stable leak cells. No emulator.
// Do not edit after it has run.
import { readFileSync } from 'node:fs';
const doc = JSON.parse(readFileSync('work/out/leak-p1-summary.json', 'utf8'));
const want = ['0x60379d64', '0x62953c10', '0x62473176', '0x62473182'];
function words(row, n) {
  const hex = row.blob.hex;
  const base = Number(row.blob.start);
  const at = Number(row.addr);
  const off = (at - base) * 2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const o = off + i * 4;
    const lo = Number.parseInt(hex.slice(o, o + 2), 16);
    const hi = Number.parseInt(hex.slice(o + 2, o + 4), 16);
    out.push((lo | (hi << 8)).toString(16));
  }
  return out.join(' ');
}
for (const addr of want) {
  const b = doc.sessions.trace.before.find((x) => x.addr === addr);
  const a = doc.sessions.trace.after.find((x) => x.addr === addr);
  console.log(addr, 'boot', words(b, 8));
  console.log(addr, 'exit', words(a, 8));
}
