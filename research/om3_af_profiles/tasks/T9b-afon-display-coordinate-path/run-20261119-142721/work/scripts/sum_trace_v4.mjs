import { readFileSync } from 'node:fs';
const rows = readFileSync('work/out/obs-trace-v4.jsonl', 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
for (const row of rows) {
  const a = row.actual || {};
  const brief = {
    id: row.id, pass: row.pass, problems: row.problems,
    union: a.union, restUnion: a.restUnion, marksMoved: a.marksMoved,
    cells: a.cells, counts: a.counts, objects: a.objects, rects: a.rects,
    storeSeen: a.storeSeen, stores: a.stores, rewriteStores: a.rewriteStores,
    watched: a.watched, object: a.object, restored: a.restored, rewritten: a.rewritten,
    note: row.note,
  };
  process.stdout.write(JSON.stringify(brief) + '\n');
}
