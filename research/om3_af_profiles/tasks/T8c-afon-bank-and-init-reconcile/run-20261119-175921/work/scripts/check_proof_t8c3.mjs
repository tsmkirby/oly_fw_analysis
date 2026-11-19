// Static checker for the T8c correction table. Not an experiment version.
// An exit must match a different step's control sequence.
// Ten-byte expectations are references, never literals.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [tablePath, reportPath] = process.argv.slice(2);
const table = JSON.parse(readFileSync(resolve(tablePath), 'utf8'));
const problems = [];
const bad = (m) => problems.push(m);
const steps = table.steps || [];
const byId = new Map(steps.map((s) => [s.id, s]));
const seen = new Set();
const REQUIRED = ['mirror', 'flag', 'halfBank', 'sizeRecord', 'edge', 'owner', 'subject', 'bank'];
const ROLES = ['k1e', 'k2', 'candidate'];

function savedBank(pose) {
  if (pose === 2) return 4;
  if (pose === 4) return 2;
  return 0;
}
function sameSeq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function leavesOf(spec, role, acc = []) {
  if (!spec || typeof spec !== 'object') return acc;
  if (spec.byRole) {
    if (role) {
      if (spec.byRole[role]) leavesOf(spec.byRole[role], role, acc);
      else acc.push({ missingRole: role });
    } else {
      for (const key of Object.keys(spec.byRole)) leavesOf(spec.byRole[key], key, acc);
    }
    return acc;
  }
  acc.push(spec);
  return acc;
}
function earlier(role, id, than) {
  const order = steps.filter((s) => s.who.includes(role)).map((s) => s.id);
  return order.indexOf(id) >= 0 && order.indexOf(id) < order.indexOf(than);
}

for (const step of steps) {
  if (!step.id || seen.has(step.id)) bad('id ' + step.id);
  seen.add(step.id);
  if (step.repeat || step.until || step.bound || step.dials) bad(step.id + ' collapsed');
  if (!Array.isArray(step.who) || step.who.some((r) => !ROLES.includes(r))) bad(step.id + ' who');
  if (step.editor && step.who.includes('k2')) bad(step.id + ' K2 runs an editor key');
  if (step.bank !== savedBank(step.pose)) bad(step.id + ' bank ' + step.bank);
  const fields = step.fields || {};
  for (const name of REQUIRED) if (!fields[name]) bad(step.id + ' missing ' + name);
  for (const [name, spec] of Object.entries(fields)) {
    const leaves = leavesOf(spec, null);
    if (!leaves.length) bad(step.id + ' ' + name + ' has no source');
    if (leaves.length !== 1 && !spec.byRole) bad(step.id + ' ' + name + ' has more than one source');
    if (spec.byRole) {
      for (const role of step.who) {
        if (!spec.byRole[role]) bad(step.id + ' ' + name + ' missing ' + role);
        const one = leavesOf(spec, role);
        if (one.length !== 1 || one[0].missingRole) bad(step.id + ' ' + name + ' ' + role + ' source count');
      }
    }
    for (const role of step.who) {
      for (const leaf of leavesOf(spec, role)) {
        if (!leaf.source) bad(step.id + ' ' + name + ' blank source');
        if (leaf.source === 'literal') {
          if (name === 'target' || name === 'halfTarget' || name === 'mirror') bad(step.id + ' literal ' + name);
          if (!leaf.provenance || leaf.provenance.length < 12) bad(step.id + ' provenance ' + name);
          if (name === 'target' || JSON.stringify(leaf.value || '').includes('27,0,39')) bad(step.id + ' stale literal');
        } else if (leaf.source === 'seal') {
          if (!leaf.provenance) bad(step.id + ' seal provenance ' + name);
        } else {
          const m = /^ref:(K1e|K2|session):([A-Za-z0-9-]+)$/.exec(leaf.source);
          if (!m) bad(step.id + ' bad source ' + leaf.source);
          else if (m[1] === 'session') {
            if (!earlier(role, m[2], step.id)) bad(step.id + ' ' + role + ' session ref ' + m[2] + ' is not earlier');
          } else {
            const prod = m[1] === 'K1e' ? 'k1e' : 'k2';
            const named = byId.get(m[2]);
            if (!named || !named.who.includes(prod)) bad(step.id + ' source ' + leaf.source + ' is not that role');
            if (role === prod && !earlier(prod, m[2], step.id)) bad(step.id + ' ' + role + ' uses a later ' + leaf.source);
          }
        }
        if (leaf.relation && leaf.relation !== 'pos-changed-at-bank') bad(step.id + ' relation');
      }
    }
  }
  const isExit = step.exit === true || step.action === 'edge';
  if (isExit) {
    if (!step.matchExit) bad(step.id + ' exit has no control match');
    else if (step.matchExit === step.id) bad(step.id + ' exit matches itself');
    else {
      const other = byId.get(step.matchExit);
      if (!other) bad(step.id + ' match missing');
      else if (!sameSeq(step.exitSeq, other.exitSeq)) bad(step.id + ' sequence differs from ' + step.matchExit);
    }
    if (!Array.isArray(step.exitSeq) || step.exitSeq.length === 0) bad(step.id + ' sequence missing');
    else {
      for (let i = 0; i < step.exitSeq.length; i++) {
        const ev = step.exitSeq[i];
        if (!ev || ev.key !== step.key || (ev.dir !== 'down' && ev.dir !== 'up')) bad(step.id + ' bad event');
        if (i > 0 && step.exitSeq[i - 1].dir === 'down' && ev.dir !== 'up') bad(step.id + ' press is not followed by release');
        if (i > 0 && step.exitSeq[i - 1].dir === 'up' && ev.dir === 'down') bad(step.id + ' release before the next press');
      }
    }
  }
  if (step.commit) {
    if (!/^ref:K1e:[A-Za-z0-9-]+$/.test(step.identityFrom || '')) bad(step.id + ' commit identity is not K1e');
    else {
      const id = step.identityFrom.slice('ref:K1e:'.length);
      const named = byId.get(id);
      if (!named || !named.who.includes('k1e')) bad(step.id + ' identity step is not K1e');
    }
  }
  if (step.pressFrom) {
    const leaf = leavesOf(fields.target, 'candidate')[0];
    if (!leaf || leaf.source !== 'ref:K1e:' + step.pressFrom || leaf.field !== 'halfTarget') bad(step.id + ' press is not K1e halfTarget');
    if (!leaf || !leaf.bankFrom) bad(step.id + ' press has no bank cell');
  }
  if (step.releaseFrom) {
    const leaf = leavesOf(fields.target, 'candidate')[0];
    if (!leaf || leaf.source !== 'ref:session:' + step.releaseFrom || leaf.field !== 'halfTarget') bad(step.id + ' release is not the session S1');
    const prod = byId.get(step.releaseFrom);
    if (!prod || prod.key !== 's1' || prod.dir !== 'down') bad(step.id + ' release source is not an S1 press');
  }
  if (step.crossS1 && step.who.includes('candidate')) {
    const leaf = leavesOf(fields.halfTarget, 'candidate')[0];
    if (!leaf || leaf.source !== 'ref:K2:' + step.id || leaf.field !== 'halfTarget') bad(step.id + ' S1 is not cross-checked to K2');
  }
  if (step.judgeRead) {
    const leaf = leavesOf(fields.readBank, 'candidate')[0];
    if (!leaf || leaf.source !== 'literal' || leaf.value !== step.bank) bad(step.id + ' read bank');
  }
}

const blob = JSON.stringify(table);
if (blob.includes('STOCK') || blob.includes('halfPress') || blob.includes('converter')) bad('hard-coded target alternative');
if (blob.includes('[14,2,2,0,27')) bad('hard-coded All record');

const report = { ok: problems.length === 0, steps: steps.length, problems };
writeFileSync(resolve(reportPath), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: report.ok, problems: problems.length, steps: steps.length }) + '\n');
if (problems.length) {
  for (const p of problems) process.stderr.write(p + '\n');
  process.exit(1);
}
