import { readFileSync } from 'node:fs';
const lines = readFileSync('work/out/obs-sched-c5.jsonl', 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
for (const r of lines) {
  if (r.id.endsWith('-model') || r.id === 'c5-plan') continue;
  const a = r.actual;
  const brief = {
    id: r.id,
    pass: r.pass,
    union: a.union,
    restUnion: a.restUnion,
    subject: a.subject,
    cell: a.k88b2 ?? a.cell,
    owner: a.owner,
    target: a.target,
    marksMoved: a.marksMoved,
    entry: a.entry,
    xN: a.xN,
    yN: a.yN,
    flag: a.flag,
    xs: a.xs,
    ys: a.ys,
    stock: a.stock,
    seeded: a.seeded,
    unseeded: a.unseeded,
  };
  process.stdout.write(JSON.stringify(brief) + '\n');
}
