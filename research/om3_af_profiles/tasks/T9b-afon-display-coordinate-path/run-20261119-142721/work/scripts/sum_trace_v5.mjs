import { readFileSync } from 'node:fs';
const rows = readFileSync('work/out/obs-trace-v5.jsonl', 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
const after = rows.find((r) => r.id === 'v5-after');
const a = after.actual;
process.stdout.write(JSON.stringify({
  pass: after.pass,
  marksMoved: a.marksMoved,
  union: a.union,
  restUnion: a.restUnion,
  cells: a.cells,
  cell: a.cell,
  counts: a.counts,
  draws: a.draws,
  callers: a.callers,
  readers: a.readers,
  readSeen: a.readSeen,
}, null, 2) + '\n');
