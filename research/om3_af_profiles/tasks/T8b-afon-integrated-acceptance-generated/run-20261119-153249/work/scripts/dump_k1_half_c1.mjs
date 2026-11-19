// Static dump of K1/K2 half-press cells at the reference steps. Not an experiment version.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ref = JSON.parse(readFileSync(resolve('work/out/reference-t8b.json'), 'utf8'));
const keys = ['k99a1', 'k9a41', 'k5962', 'k1dd1', 'k84d1', 'k88b2', 'k90d1', 'k5a11', 'k1de1', 'k1df1', 'k1db1', 'k1dc1'];
const ids = Object.keys(ref.k1);
const rows = [];
for (const id of ids) {
  const k1 = ref.k1[id];
  const k2 = ref.k2[id];
  const row = {
    id,
    k1zone: k1.zone,
    k1flag: k1.flag,
    k1screen: k1.screen,
    k1title: k1.title,
    k1target: k1.target,
    k1owner: k1.owner,
    k1half: {},
  };
  for (const key of keys) row.k1half[key] = k1.half[key];
  if (k2) {
    row.k2zone = k2.zone;
    row.k2flag = k2.flag;
    row.k2screen = k2.screen;
    row.k2target = k2.target;
    row.k2owner = k2.owner;
    row.k2half = {};
    for (const key of keys) row.k2half[key] = k2.half[key];
  }
  rows.push(row);
}
const out = { steps: ids, rows };
writeFileSync(resolve('work/out/k1-half-c1.json'), JSON.stringify(out, null, 2) + '\n');
process.stdout.write(JSON.stringify({ steps: ids.length, ids }) + '\n');
