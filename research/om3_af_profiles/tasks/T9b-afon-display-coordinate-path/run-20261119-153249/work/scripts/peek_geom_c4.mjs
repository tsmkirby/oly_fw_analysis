import { readFileSync } from 'node:fs';
const lines = readFileSync('work/out/obs-geom-c4.jsonl', 'utf8').trim().split(/\n/);
for (const line of lines) {
  const r = JSON.parse(line);
  if (r.id === 'c4-rest' || r.id === 'c4-done') {
    process.stdout.write(r.id + ' ' + JSON.stringify(r.actual) + '\n');
    continue;
  }
  if (r.id !== 'c4-idle') continue;
  const a = r.actual;
  process.stdout.write('moved ' + a.moved + ' union ' + JSON.stringify(a.union) + '\n');
  process.stdout.write('stores ' + a.stores + ' n356 ' + a.n356 + ' n198 ' + a.n198 + ' writerN ' + a.writerN + ' wall ' + a.wallMs + '\n');
  process.stdout.write('hits ' + JSON.stringify(a.hits) + '\n');
  process.stdout.write('obj ' + JSON.stringify(a.obj) + '\n');
  process.stdout.write('writer ' + JSON.stringify(a.writer) + '\n');
}
