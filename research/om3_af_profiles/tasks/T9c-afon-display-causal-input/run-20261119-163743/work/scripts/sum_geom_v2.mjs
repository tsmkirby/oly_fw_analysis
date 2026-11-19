import { readFileSync } from 'node:fs';
const lines = readFileSync('work/out/obs-geom-v2.jsonl', 'utf8').trim().split(/\n/);
for (const line of lines) {
  const r = JSON.parse(line);
  if (r.id === 'v2-field') {
    const a = r.actual;
    process.stdout.write('FIELD pass ' + r.pass + '\n');
    process.stdout.write('rest ' + JSON.stringify(a.rest.union) + ' px ' + a.rest.pixels + '\n');
    process.stdout.write('after cell ' + a.after.k88b2 + ' union ' + JSON.stringify(a.after.union) + ' px ' + a.after.pixels + ' sub ' + a.after.subject + '\n');
    process.stdout.write('stores ' + JSON.stringify(a.stores) + '\n');
    process.stdout.write('divs ' + JSON.stringify(a.divs) + '\n');
    process.stdout.write('xs ' + JSON.stringify(a.xs) + '\n');
    process.stdout.write('ys ' + JSON.stringify(a.ys) + '\n');
  } else if (r.id === 'v2-zone') {
    const a = r.actual;
    process.stdout.write('ZONE pass ' + r.pass + ' differ ' + a.pixelsDiffer + '\n');
    process.stdout.write('all ' + JSON.stringify({ u: a.all.union, px: a.all.pixels, cell: a.all.k88b2, zone: a.all.k99a1, kind: a.all.k84d1, size: a.all.k1dd1, k9a41: a.all.k9a41, sub: a.all.subject }) + '\n');
    process.stdout.write('dials ' + JSON.stringify(a.dials) + '\n');
    process.stdout.write('smallCentre ' + JSON.stringify({ u: a.smallCentre.union, px: a.smallCentre.pixels, marks: a.smallCentre.marks, cell: a.smallCentre.k88b2, zone: a.smallCentre.k99a1, kind: a.smallCentre.k84d1, size: a.smallCentre.k1dd1, k9a41: a.smallCentre.k9a41 }) + '\n');
    process.stdout.write('centreXs ' + JSON.stringify(a.centreXs) + '\n');
    process.stdout.write('centreDivs ' + JSON.stringify(a.centreDivs) + '\n');
    process.stdout.write('centreStores ' + JSON.stringify(a.centreStores) + '\n');
    process.stdout.write('move cell ' + a.before + ' -> ' + a.movedCell + '\n');
    process.stdout.write('smallMove ' + JSON.stringify({ u: a.smallMove.union, px: a.smallMove.pixels, marks: a.smallMove.marks, cell: a.smallMove.k88b2, zone: a.smallMove.k99a1, kind: a.smallMove.k84d1, size: a.smallMove.k1dd1 }) + '\n');
    process.stdout.write('moveXs ' + JSON.stringify(a.moveXs) + '\n');
    process.stdout.write('moveDivs ' + JSON.stringify(a.moveDivs) + '\n');
    process.stdout.write('moveStores ' + JSON.stringify(a.moveStores) + '\n');
  } else if (r.id === 'v2-done') {
    process.stdout.write('DONE ' + JSON.stringify(r.actual) + ' pass ' + r.pass + '\n');
  }
}
