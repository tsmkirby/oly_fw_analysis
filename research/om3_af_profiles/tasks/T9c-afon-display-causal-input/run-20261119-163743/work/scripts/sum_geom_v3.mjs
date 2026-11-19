import { readFileSync } from 'node:fs';
const lines = readFileSync('work/out/obs-geom-v3.jsonl', 'utf8').trim().split(/\n/);
for (const line of lines) {
  const r = JSON.parse(line);
  if (r.id === 'v3-word') {
    const a = r.actual;
    process.stdout.write('WORD pass ' + r.pass + ' subs ' + a.subs + '\n');
    process.stdout.write('rest ' + JSON.stringify(a.rest) + '\n');
    process.stdout.write('before ' + JSON.stringify(a.before) + '\n');
    process.stdout.write('after cell ' + a.after.k88b2 + ' union ' + JSON.stringify(a.after.union) + ' px ' + a.after.pixels + ' colour ' + JSON.stringify(a.after.colour) + ' marks ' + JSON.stringify(a.after.marks) + '\n');
    process.stdout.write('probe ' + JSON.stringify(a.afterProbe) + '\n');
  } else if (r.id === 'v3-zone') {
    const a = r.actual;
    process.stdout.write('ZONE pass ' + r.pass + ' changed ' + a.pixelsChanged + '\n');
    process.stdout.write('small ' + JSON.stringify({ u: a.small.union, px: a.small.pixels, colour: a.small.colour, kind: a.small.k84d1, zone: a.small.k99a1, size: a.small.k1dd1, cell: a.small.k88b2 }) + '\n');
    process.stdout.write('smallProbe ' + JSON.stringify(a.smallProbe) + '\n');
    process.stdout.write('poked ' + JSON.stringify(a.poked) + '\n');
    process.stdout.write('all ' + JSON.stringify({ u: a.all.union, px: a.all.pixels, colour: a.all.colour, marks: a.all.marks, kind: a.all.k84d1, zone: a.all.k99a1, size: a.all.k1dd1, cell: a.all.k88b2 }) + '\n');
    process.stdout.write('allProbe ' + JSON.stringify({ entries: a.allProbe.entries, xs: a.allProbe.xs, divs: a.allProbe.divs, stores: a.allProbe.stores.length }) + '\n');
  } else if (r.id === 'v3-done') {
    process.stdout.write('DONE ' + JSON.stringify(r.actual) + '\n');
  }
}
