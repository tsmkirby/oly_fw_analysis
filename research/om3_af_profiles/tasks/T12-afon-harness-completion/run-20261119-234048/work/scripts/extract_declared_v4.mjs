// Disambiguates repeated operation ids in the T11 identity log.
// EMULATOR-ONLY source data. This script does not start an emulator.
import { readFileSync, writeFileSync } from 'node:fs';

const logPath = 'ref/tasks/T11-afon-acceptance-harness/run-20261119-223109/work/out/identity-t11-v10.jsonl';
const lines = readFileSync(logPath, 'utf8').split(/\n/).filter(Boolean);
const steps = {};
const seen = new Map();
let setup = null;
const dupes = [];
for (const line of lines) {
  const row = JSON.parse(line);
  if (row.id === 'k1e-pose-landscape' && row.before && row.before.half && !setup) {
    setup = {
      source: 'T11 identity k1e-pose-landscape before',
      owner: row.before.owner,
      flag: row.before.flag,
      subject: row.before.subject,
      target: row.before.target,
      halfTarget: row.before.halfTarget,
      half: row.before.half,
    };
  }
  if (!row.actual || !row.actual.half || !row.id) continue;
  const n = (seen.get(row.id) || 0) + 1;
  seen.set(row.id, n);
  const id = n === 1 ? row.id : row.id + '#' + n;
  if (n > 1) dupes.push(id);
  steps[id] = {
    source: 'T11 identity ' + id + ' actual',
    owner: row.actual.owner,
    flag: row.actual.flag,
    subject: row.actual.subject,
    target: row.actual.target,
    halfTarget: row.actual.halfTarget,
    half: row.actual.half,
  };
}
const body = 'export const DECLARED = ' + JSON.stringify({ logPath, setup, steps }) + ';\n';
writeFileSync('work/harness/declared_v2.mjs', body);
process.stdout.write(JSON.stringify({ steps: Object.keys(steps).length, dupes }) + '\n');
