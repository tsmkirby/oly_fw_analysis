import { readFileSync } from 'node:fs';
const lines = readFileSync('work/out/obs-geom-c3.jsonl', 'utf8').trim().split(/\n/);
const row = lines.map((l) => JSON.parse(l)).find((r) => r.id === 'c3-idle');
const hits = row.actual.hits;
const real = hits.filter((h) => h.v < 0x10000);
const fake = hits.filter((h) => h.v >= 0x10000);
process.stdout.write('real ' + real.length + ' fake ' + fake.length + '\n');
process.stdout.write(JSON.stringify(real) + '\n');
process.stdout.write('fake0 ' + JSON.stringify(fake[0]) + '\n');
