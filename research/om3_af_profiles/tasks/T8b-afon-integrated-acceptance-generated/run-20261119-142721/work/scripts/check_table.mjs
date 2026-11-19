// Complete static check of the generated T8b table. Not an experiment version.
// Usage: node26 work/scripts/check_table.mjs <table.json> <report.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [tablePath, reportPath] = process.argv.slice(2);
if (!tablePath || !reportPath) {
  process.stderr.write('usage: node26 work/scripts/check_table.mjs <table.json> <report.json>\n');
  process.exit(2);
}
const table = JSON.parse(readFileSync(resolve(tablePath), 'utf8'));
const problems = [];
function bad(msg) { problems.push(msg); }

const steps = table.steps || [];
const seen = new Set();
for (const step of steps) {
  if (!step.id) bad('blank id');
  else if (seen.has(step.id)) bad('duplicate id ' + step.id);
  else seen.add(step.id);
}
const byId = new Map(steps.map((s) => [s.id, s]));
const ALLOWED = new Set(['setup', 'check', 'key', 'dial', 'edge', 'pose', 'enter', 'size-setup', 'enable-custom', 'seed-c1']);
const BASE = ['title', 'mirror', 'zone', 'flag', 'half', 'sizeRecord', 'screen'];
const EDGE = ['target', 'owner', 'status', 'enabled', 'focus'];
const SOURCE = /^(literal|ref:K2:[A-Za-z0-9-]+|ref:K1:[A-Za-z0-9-]+)$/;

function roleOf(source) {
  if (source.startsWith('ref:K2:')) return 'k2';
  if (source.startsWith('ref:K1:')) return 'k1';
  return null;
}
function stepOf(source) {
  const i = source.lastIndexOf(':');
  return source.slice(i + 1);
}

for (const step of steps) {
  if (step.keys || step.repeat || step.until || step.bound || step.dials) bad(step.id + ' collapsed procedural step');
  if (!ALLOWED.has(step.action)) bad(step.id + ' bad action ' + step.action);
  if (!Array.isArray(step.who) || step.who.length === 0) bad(step.id + ' who empty');
  if (step.who.some((r) => r === 'candidate' || r === 'c')) bad(step.id + ' unexpanded role');
  if (step.action === 'key' && !step.key) bad(step.id + ' key missing');
  if (step.action === 'edge' && (!step.key || !step.dir)) bad(step.id + ' edge key/dir missing');
  if (step.action === 'dial' && (!step.dial || (step.detents !== 1 && step.detents !== -1))) bad(step.id + ' dial missing');
  if (step.action === 'pose' && !step.key) bad(step.id + ' pose missing');
  const blob = JSON.stringify(step);
  if (blob.includes('unresolved') || blob.includes('halfSingle')) bad(step.id + ' placeholder');
  const fields = step.fields || {};
  const need = step.action === 'edge' ? BASE.concat(EDGE) : BASE;
  for (const field of need) {
    const spec = fields[field];
    if (!spec || !spec.source) bad(step.id + ' missing field ' + field);
    else if (!SOURCE.test(spec.source)) bad(step.id + ' bad source ' + field + ' ' + spec.source);
    else if (spec.source === 'literal' && !Object.prototype.hasOwnProperty.call(spec, 'value')) bad(step.id + ' literal without value ' + field);
    else if (spec.source !== 'literal') {
      const role = roleOf(spec.source);
      const id = stepOf(spec.source);
      const named = byId.get(id);
      if (!named) bad(step.id + ' source ' + spec.source + ' names a missing step');
      else if (!named.who.includes(role)) bad(step.id + ' source ' + spec.source + ' is not a ' + role + ' step');
    }
    if (spec && /c1|c2|candidate/.test(spec.source || '')) bad(step.id + ' candidate field sourced from the candidate');
  }
  if (fields.mirror && fields.mirror.source === 'literal' && (!Array.isArray(fields.mirror.value) || fields.mirror.value.length !== 55)) {
    bad(step.id + ' mirror literal is not 55 bytes');
  }
  if (fields.target && fields.target.source === 'literal' && (!Array.isArray(fields.target.value) || fields.target.value.length !== 10)) {
    bad(step.id + ' target literal is not 10 bytes');
  }
}

const listed = new Set(table.editorKeys || []);
for (const step of steps) {
  if (step.editor) {
    if (!listed.has(step.id)) bad('editor key not listed ' + step.id);
    if (step.who.includes('k1') || step.who.includes('k2')) bad('K2 runs editor key ' + step.id);
    if (!step.who.includes('c1') || !step.who.includes('c2')) bad('editor key missing a candidate ' + step.id);
  } else if (listed.has(step.id)) bad('listed editor key is not an editor step ' + step.id);
}
for (const id of listed) {
  if (!byId.has(id)) bad('listed editor key missing ' + id);
}

function sameRoles(step, roles) {
  for (const role of roles) if (!step.who.includes(role)) return false;
  return true;
}
for (const step of steps) {
  const save = step.id.startsWith('save-');
  const exitKey = step.action === 'key' && (step.key === 'ok' || step.key === 'menu' || step.key === 's1');
  if (step.editor) continue;
  if (save || exitKey) {
    if (!sameRoles(step, ['k2', 'c1', 'c2'])) bad('unmatched exit or save step ' + step.id);
  }
}
const k2Save = steps.filter((s) => s.id.startsWith('save-') && s.who.includes('k2')).map((s) => s.id);
const c1Save = steps.filter((s) => s.id.startsWith('save-') && s.who.includes('c1')).map((s) => s.id);
if (k2Save.join() !== c1Save.join()) bad('K2 and candidate save steps differ');

for (const step of steps) {
  if (step.editor || step.id.startsWith('save-') || step.phase !== 'main') continue;
  if (step.action === 'key' || step.action === 'dial' || step.action === 'edge' || step.action === 'pose' || step.action === 'setup') {
    if (!sameRoles(step, ['k1', 'k2', 'c1', 'c2'])) bad('shared step missing a role ' + step.id);
  }
}

const cS1 = byId.get('c-s1');
if (!cS1 || cS1.key !== 's1' || cS1.action !== 'key' || !cS1.editor) bad('S1 exit is not a real editor S1 key');
if (cS1) {
  const prev = steps[steps.indexOf(cS1) - 1];
  if (!prev || !prev.editor) bad('S1 exit does not follow an editor step');
}
const saveJudge = steps.filter((s) => s.saveJudge);
if (saveJudge.length !== 1) bad('save judge count ' + saveJudge.length);
const commit = steps.filter((s) => s.commitStart);
if (commit.length !== 1) bad('commit baseline count ' + commit.length);
const before = byId.get('save-before-commit');
if (!before || !before.assertRow) bad('AF Target Mode is not asserted before the commit');
const tab = steps.filter((s) => s.assertAfTab);
if (tab.length !== 1 || tab[0].id !== 'save-left-19') bad('AF tab identity is not on the twentieth Left');

const report = {
  ok: problems.length === 0,
  steps: steps.length,
  editorKeys: (table.editorKeys || []).length,
  saveSteps: k2Save.length,
  problems,
};
writeFileSync(resolve(reportPath), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: report.ok, problems: problems.length, steps: steps.length }) + '\n');
if (problems.length) {
  for (const p of problems) process.stderr.write(p + '\n');
  process.exit(1);
}
