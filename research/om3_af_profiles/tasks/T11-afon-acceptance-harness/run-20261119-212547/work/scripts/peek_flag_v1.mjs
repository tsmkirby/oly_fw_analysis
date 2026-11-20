import { readFileSync } from 'node:fs';
const lines = readFileSync(process.argv[2], 'utf8').trim().split('\n');
for (const line of lines) {
  const o = JSON.parse(line);
  if (!o.actual || !o.actual.half) continue;
  const id = String(o.id);
  if (!id.includes('n-open') && !id.includes('n-up') && !id.includes('e-open') && !id.includes('e-up')) continue;
  if (!id.startsWith('candidate') && !id.startsWith('k2')) continue;
  console.log(id, 'flag', o.actual.flag, 'pos', o.actual.half.k5962[0], 'k88', o.actual.half.k88b2[0], 'pass', o.pass);
}
