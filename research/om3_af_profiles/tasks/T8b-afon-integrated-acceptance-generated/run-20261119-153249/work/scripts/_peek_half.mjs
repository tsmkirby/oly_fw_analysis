import { readFileSync } from 'node:fs';
const lines = readFileSync('ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/t8r5.jsonl', 'utf8').trim().split(/\n/);
for (const id of ['k2-setup', 'k2-zone-ok', 'k2-n-ok']) {
  const row = JSON.parse(lines.find((l) => JSON.parse(l).id === id));
  console.log(id, 'k5a11', JSON.stringify(row.actual.half.k5a11), 'k1dd1', JSON.stringify(row.actual.half.k1dd1), 'zone', row.actual.zone, 'screen', row.actual.screen);
}
