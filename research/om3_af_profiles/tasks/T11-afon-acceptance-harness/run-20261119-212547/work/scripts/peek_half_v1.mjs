import { readFileSync } from 'node:fs';
const file = process.argv[2];
const lines = readFileSync(file, 'utf8').trim().split('\n');
for (const line of lines) {
  const o = JSON.parse(line);
  if (!o.actual || !o.actual.half) continue;
  if (!String(o.id).includes('e-open') && !String(o.id).includes('-base') && !String(o.id).includes('enter')) continue;
  const h = o.actual.half;
  console.log(o.id, o.pass, 'k5962', JSON.stringify(h.k5962), 'k88b2', JSON.stringify(h.k88b2), (o.problems || []).join(';'));
}
