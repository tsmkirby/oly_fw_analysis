// One-shot extraction of declared full-state values from the sealed T11 identity log.
// EMULATOR-ONLY source data. This script does not start an emulator.
import { readFileSync, writeFileSync } from 'node:fs';

const logPath = 'ref/tasks/T11-afon-acceptance-harness/run-20261119-223109/work/out/identity-t11-v10.jsonl';
const lines = readFileSync(logPath, 'utf8').split(/\n/).filter(Boolean);
const want = new Set([
  'k1e-e-open-down', 'k1e-e-up-down', 'k1e-p-up-down',
  'k2-n-open-down', 'k2-n-up-down',
  'k1e-ke-s1-down', 'k2-k2-af-down', 'k2-k2-p-af-down', 'k2-k2-l-af-down',
  'candidate-e-open-down', 'candidate-e-up-down', 'candidate-p-up-down',
  'candidate-n-open-down', 'candidate-n-up-down',
]);
const out = { source: logPath, steps: {} };
for (const line of lines) {
  const row = JSON.parse(line);
  if (row.id === 'k1e-pose-landscape') {
    out.setup = {
      source: 'T11 identity k1e-pose-landscape before',
      owner: row.before.owner,
      flag: row.before.flag,
      subject: row.before.subject,
      target: row.before.target,
      halfTarget: row.before.halfTarget,
      half: row.before.half,
    };
  }
  if (!want.has(row.id)) continue;
  out.steps[row.id] = {
    source: 'T11 identity ' + row.id + ' actual',
    owner: row.actual.owner,
    flag: row.actual.flag,
    subject: row.actual.subject,
    target: row.actual.target,
    halfTarget: row.actual.halfTarget,
    half: row.actual.half,
  };
}
const zone = JSON.parse(readFileSync('ref/tasks/T11-afon-acceptance-harness/run-20261119-223109/work/out/identity-t11-v10-zone-k1e.json', 'utf8'));
out.zones = zone.rows.map((row) => ({
  id: row.id,
  nav: (row.nav || []).map((step) => step.op),
  hasPress: Array.isArray(row.press),
  hasRelease: Array.isArray(row.release),
  snaps: (row.snaps || []).length,
}));
writeFileSync('work/out/declared-extract-v1.json', JSON.stringify(out, null, 2) + '\n');
process.stdout.write(JSON.stringify({ steps: Object.keys(out.steps), zones: out.zones, setupOwner: out.setup && out.setup.owner }) + '\n');
