// Writes work/harness/declared_v1.mjs from the sealed T11 identity log.
// EMULATOR-ONLY source data. This script does not start an emulator.
import { readFileSync, writeFileSync } from 'node:fs';

const logPath = 'ref/tasks/T11-afon-acceptance-harness/run-20261119-223109/work/out/identity-t11-v10.jsonl';
const lines = readFileSync(logPath, 'utf8').split(/\n/).filter(Boolean);
const steps = {};
let setup = null;
for (const line of lines) {
  const row = JSON.parse(line);
  if (row.id === 'k1e-pose-landscape' && row.before && row.before.half) {
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
  if (!row.actual || !row.actual.half) continue;
  steps[row.id] = {
    source: 'T11 identity ' + row.id + ' actual',
    owner: row.actual.owner,
    flag: row.actual.flag,
    subject: row.actual.subject,
    target: row.actual.target,
    halfTarget: row.actual.halfTarget,
    half: row.actual.half,
  };
}
const body = 'export const DECLARED = ' + JSON.stringify({ logPath, setup, steps }) + ';\n';
writeFileSync('work/harness/declared_v1.mjs', body);
process.stdout.write(JSON.stringify({ steps: Object.keys(steps).length, bytes: body.length }) + '\n');
