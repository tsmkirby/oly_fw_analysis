import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync('work/out/scan-calls-d5.json', 'utf8'));
const by = new Map();
for (const row of j.rows) {
  const t = row.target;
  if (!by.has(t)) by.set(t, []);
  by.get(t).push(row.pc);
}
for (const [t, pcs] of by) {
  const interesting = pcs.filter((p) => {
    const v = Number(p);
    return (v >= 0x60300000 && v < 0x60600000) || (v >= 0x610c0000 && v < 0x61190000);
  });
  process.stdout.write(t + ' total ' + pcs.length + ' near ' + interesting.length + '\n');
  for (const p of interesting.slice(0, 40)) process.stdout.write('  ' + p + '\n');
}
