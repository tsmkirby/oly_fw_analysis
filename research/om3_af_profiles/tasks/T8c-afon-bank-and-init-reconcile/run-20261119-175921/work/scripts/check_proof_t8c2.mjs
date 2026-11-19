// Static checker for the short proof table. Not an experiment version.
// Exits are action sequences. Bank labels must be the editor's saved index.
// A Small step may not cite the All 27x39 record.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [tablePath, reportPath] = process.argv.slice(2);
const table = JSON.parse(readFileSync(resolve(tablePath), 'utf8'));
const problems = [];
const bad = (m) => problems.push(m);
const steps = table.steps || [];
const byId = new Map(steps.map((s) => [s.id, s]));
const seen = new Set();

function editorBank(pose) {
  if (pose === 2) return 4;
  if (pose === 4) return 2;
  return 0;
}
function sameSeq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

for (const step of steps) {
  if (!step.id || seen.has(step.id)) bad('id ' + step.id);
  seen.add(step.id);
  if (step.repeat || step.until || step.bound || step.dials) bad(step.id + ' collapsed');
  if (!Array.isArray(step.who) || step.who.some((r) => !['k1e', 'k2', 'candidate'].includes(r))) bad(step.id + ' who');
  if (step.editor && step.who.includes('k2')) bad(step.id + ' K2 runs an editor key');
  if (step.bank !== editorBank(step.pose)) bad(step.id + ' bank ' + step.bank + ' is not the saved index for pose ' + step.pose);
  if (step.action === 'key' || step.action === 'edge') {
    if (!step.key) bad(step.id + ' key');
  }
  if (step.exit || step.action === 'edge') {
    const seq = step.exitSeq;
    if (!Array.isArray(seq) || seq.length === 0) bad(step.id + ' exit sequence missing');
    else {
      for (let i = 0; i < seq.length; i++) {
        const ev = seq[i];
        if (!ev || !ev.key || (ev.dir !== 'down' && ev.dir !== 'up')) bad(step.id + ' bad event');
        if (ev.key !== step.key) bad(step.id + ' sequence key is not the step key');
        if (i > 0 && seq[i - 1].dir === 'up' && ev.dir === 'down' && seq[i - 1].key === ev.key) bad(step.id + ' release before press');
        if (i > 0 && seq[i - 1].dir === 'down' && ev.dir !== 'up') bad(step.id + ' press is not followed by release');
      }
      if (step.action === 'key') {
        if (!sameSeq(seq, [{ key: step.key, dir: 'down' }, { key: step.key, dir: 'up' }])) bad(step.id + ' key sequence is not press then release');
      }
      if (step.action === 'edge') {
        if (seq.length !== 1 || seq[0].dir !== step.dir) bad(step.id + ' edge sequence');
      }
    }
  }
  if (step.expect && step.expect.small) {
    const blob = JSON.stringify(step.expect);
    if (blob.includes('27') || blob.includes('39')) bad(step.id + ' stale All size on a Small step');
    if (!step.expect.positionFrom || !step.expect.positionFrom.startsWith('k1e:')) bad(step.id + ' Small position is not a K1e bank cell');
  }
  if (step.expect && step.expect.releaseFrom && !step.expect.releaseFrom.startsWith('k1e:')) bad(step.id + ' release is not K1e');
  if (step.expect && step.expect.halfFrom && !step.expect.halfFrom.startsWith('k2:')) bad(step.id + ' half-press is not K2');
  if (step.matchExit) {
    const other = byId.get(step.matchExit);
    if (!other) bad(step.id + ' match missing');
    else if (!sameSeq(step.exitSeq, other.exitSeq)) bad(step.id + ' exit sequence differs from ' + step.matchExit);
  }
}
const k2ok = steps.find((s) => s.id === 'n-ok' && s.who.includes('k2'));
const cok = steps.find((s) => s.id === 'n-ok' && s.who.includes('candidate'));
if (!k2ok || !cok || !sameSeq(k2ok.exitSeq, cok.exitSeq)) bad('normal OK sequences differ');

const report = { ok: problems.length === 0, steps: steps.length, problems };
writeFileSync(resolve(reportPath), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: report.ok, problems: problems.length }) + '\n');
if (problems.length) {
  for (const p of problems) process.stderr.write(p + '\n');
  process.exit(1);
}
