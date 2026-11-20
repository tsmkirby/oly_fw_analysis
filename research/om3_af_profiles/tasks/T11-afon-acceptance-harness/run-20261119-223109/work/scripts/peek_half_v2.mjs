import { readFileSync } from 'node:fs';

const lines = readFileSync('work/out/identity-t11-v6.jsonl', 'utf8').split(/\n/).filter(Boolean);
const rows = lines.map((line) => JSON.parse(line)).filter((row) => row.actual && row.actual.target);
let prev = null;
for (const row of rows) {
  if (!prev || prev.role !== row.role) { prev = row; continue; }
  const ht = JSON.stringify(prev.actual.halfTarget) !== JSON.stringify(row.actual.halfTarget);
  const tt = JSON.stringify(prev.actual.target) !== JSON.stringify(row.actual.target);
  const ow = prev.actual.owner !== row.actual.owner;
  if (!ht && !tt && !ow) { prev = row; continue; }
  if (!/s1|af/.test(row.id)) { prev = row; continue; }
  process.stdout.write(row.role + ' ' + row.id
    + ' owner ' + prev.actual.owner + '->' + row.actual.owner
    + ' target ' + JSON.stringify(row.actual.target)
    + ' half ' + JSON.stringify(row.actual.halfTarget)
    + (ht ? ' HALF-MOVED' : '')
    + (tt ? ' TARGET-MOVED' : '')
    + '\n');
  prev = row;
}
