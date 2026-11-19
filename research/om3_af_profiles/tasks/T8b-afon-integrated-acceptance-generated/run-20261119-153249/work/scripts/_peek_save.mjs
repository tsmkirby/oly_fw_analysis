import { readFileSync } from 'node:fs';
const lines = readFileSync('ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/t8r5.jsonl', 'utf8').trim().split(/\n/);
const row = JSON.parse(lines.find((l) => JSON.parse(l).id === 'k2-save-identity'));
const a = row.actual;
console.log(JSON.stringify({ baseline: a.extra.baseline, added: a.extra.added, highlight: a.extra.highlight, zone: a.zone }, null, 2));
