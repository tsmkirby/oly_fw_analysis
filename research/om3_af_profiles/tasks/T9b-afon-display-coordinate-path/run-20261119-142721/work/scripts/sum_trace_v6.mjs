import { readFileSync } from 'node:fs';
const rows = readFileSync('work/out/obs-trace-v6.jsonl', 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
for (const row of rows) {
  if (!row.actual) {
    process.stdout.write(JSON.stringify({ id: row.id, pass: row.pass }) + '\n');
    continue;
  }
  const a = row.actual;
  process.stdout.write(JSON.stringify({
    id: row.id, pass: row.pass,
    marksMoved: a.marksMoved, restUnion: a.restUnion, union: a.union,
    counts: a.counts, hits: a.hits,
    owner: a.owner, restOwner: a.restOwner, target: a.target, restTarget: a.restTarget,
    cell: a.cell, restCell: a.restCell, getterCalls: a.getterCalls, loads: a.loads,
  }) + '\n');
}
