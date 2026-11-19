import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync('work/out/scan-calls-d5.json', 'utf8'));
const ranges = [
  ['gate', 0x610cd500, 0x610ce400],
  ['writer', 0x61184dd6, 0x61186200],
  ['helper', 0x6128ab00, 0x6128b400],
  ['preface', 0x610fd3a3, 0x610fd700],
];
for (const row of j.rows) {
  const pc = Number(row.pc);
  for (const [name, lo, hi] of ranges) {
    if (pc >= lo && pc < hi) {
      process.stdout.write(name + ' ' + row.pc + ' -> ' + row.target + '\n');
    }
  }
}
