import { readFileSync } from 'node:fs';
const file = process.argv[2];
const lines = readFileSync(file, 'utf8').trim().split('\n');
for (const line of lines) {
  const o = JSON.parse(line);
  if (!o.actual || !o.actual.mirror) continue;
  if (!String(o.id).startsWith('candidate-') && !String(o.id).startsWith('k2-e-') && !String(o.id).startsWith('k1e-e-open')) continue;
  const m = o.actual.mirror;
  const pos = m[0x0a] | (m[0x0b] << 8);
  console.log(o.id, 'mirrorPos', pos, 'seal', o.seals && o.seals.mirror);
}
