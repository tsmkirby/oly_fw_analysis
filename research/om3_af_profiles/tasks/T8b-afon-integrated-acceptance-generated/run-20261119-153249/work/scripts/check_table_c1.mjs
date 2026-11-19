// Static checker for the correction table. Not an experiment version.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MAPS, PROV } from './lib_map_c1.mjs';

const [tablePath, reportPath] = process.argv.slice(2);
if (!tablePath || !reportPath) {
  process.stderr.write('usage: node26 work/scripts/check_table_c1.mjs <table.json> <report.json>\n');
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
const ALLOWED = new Set(['setup', 'check', 'key', 'dial', 'edge', 'pose', 'enter', 'size-setup']);
const BASE = ['title', 'mirror', 'zone', 'flag', 'half', 'sizeRecord', 'screen'];
const EDGE = ['target', 'owner', 'status', 'enabled', 'focus'];
const SOURCE = /^(literal|ref:K2:[A-Za-z0-9-]+|ref:K1:[A-Za-z0-9-]+|ref:K1e:[A-Za-z0-9-]+)$/;

function sourcesOf(spec, acc = []) {
  if (!spec || typeof spec !== 'object') return acc;
  if (spec.byRole) {
    for (const role of Object.keys(spec.byRole)) sourcesOf(spec.byRole[role], acc);
    return acc;
  }
  if (spec.source) acc.push(spec);
  return acc;
}
function roleOf(source) {
  if (source.startsWith('ref:K2:')) return 'k2';
  if (source.startsWith('ref:K1e:')) return 'k1e';
  if (source.startsWith('ref:K1:')) return 'k1';
  return null;
}
function stepOf(source) {
  return source.slice(source.lastIndexOf(':') + 1);
}

let pose = 'landscape';
let editorOpen = false;
for (const step of steps) {
  if (step.keys || step.repeat || step.until || step.bound || step.dials) bad(step.id + ' collapsed procedural step');
  if (!ALLOWED.has(step.action)) bad(step.id + ' bad action ' + step.action);
  if (!Array.isArray(step.who) || step.who.length === 0) bad(step.id + ' who empty');
  if (step.who.some((r) => r === 'candidate' || r === 'c')) bad(step.id + ' unexpanded role');
  if (step.action === 'key' && !step.key) bad(step.id + ' key missing');
  if (step.action === 'edge' && !step.measure && (!step.key || !step.dir)) bad(step.id + ' edge key/dir missing');
  if (step.action === 'dial' && (!step.dial || (step.detents !== 1 && step.detents !== -1))) bad(step.id + ' dial missing');
  if (step.action === 'pose' && !step.key) bad(step.id + ' pose missing');
  const blob = JSON.stringify(step);
  if (blob.includes('unresolved') || blob.includes('halfSingle')) bad(step.id + ' placeholder');
  const fields = step.fields || {};
  const need = step.action === 'edge' && !step.measure ? BASE.concat(EDGE) : BASE;
  for (const field of need) {
    const spec = fields[field];
    if (!spec) { bad(step.id + ' missing field ' + field); continue; }
    const leaves = sourcesOf(spec);
    if (!leaves.length) bad(step.id + ' missing source ' + field);
    for (const leaf of leaves) {
      if (!SOURCE.test(leaf.source)) bad(step.id + ' bad source ' + field + ' ' + leaf.source);
      if (leaf.source === 'literal') {
        if (!Object.prototype.hasOwnProperty.call(leaf, 'value')) bad(step.id + ' literal without value ' + field);
        if (!leaf.provenance || !PROV.test(leaf.provenance)) bad(step.id + ' literal provenance ' + field);
      } else {
        const role = roleOf(leaf.source);
        const id = stepOf(leaf.source);
        const named = byId.get(id);
        if (!named) bad(step.id + ' source ' + leaf.source + ' names a missing step');
        else if (!named.who.includes(role)) bad(step.id + ' source ' + leaf.source + ' is not a ' + role + ' step');
      }
      if (leaf.map && !MAPS.includes(leaf.map) && leaf.map !== undefined) bad(step.id + ' bad map ' + leaf.map);
      if (/c1|c2|candidate/.test(leaf.source || '')) bad(step.id + ' candidate field sourced from the candidate');
      if (leaf.field === 'halfTarget' && !String(leaf.source).startsWith('ref:K1e:')) bad(step.id + ' halfTarget is not K1e');
    }
  }
  if (step.action === 'pose' && step.key === 'exif6') pose = 'exif6';
  if (step.action === 'pose' && step.key === 'landscape') pose = 'landscape';
  const expectBank = pose === 'exif6' ? 5 : 1;
  if (step.bank && step.bank !== expectBank) bad(step.id + ' bank ' + step.bank + ' during ' + pose + ' wants ' + expectBank);
  if (step.action === 'enter') editorOpen = true;
  if (step.exit) editorOpen = false;
  if (!step.measure && step.who.includes('c1')) {
    const flagLeaves = sourcesOf(fields.flag);
    const values = flagLeaves.map((leaf) => leaf.source === 'literal' ? leaf.value : 'ref');
    if (editorOpen && step.action !== 'enter' && step.editor && !step.exit) {
      if (values.some((v) => v !== 1)) bad(step.id + ' candidate flag is not 1 inside the editor');
    }
    if (!editorOpen && step.phase === 'main' && step.editor && step.exit) {
      if (values.some((v) => v !== 0)) bad(step.id + ' candidate flag is not 0 on exit');
    }
  }
}

const listed = new Set(table.editorKeys || []);
for (const step of steps) {
  if (step.editor) {
    if (!listed.has(step.id)) bad('editor key not listed ' + step.id);
    if (!step.exit && (step.who.includes('k2') || step.who.includes('k1'))) bad('K2 runs editor key ' + step.id);
    if (!step.who.includes('c1') || !step.who.includes('c2')) bad('editor key missing a candidate ' + step.id);
    if (step.exit) {
      if (!step.k2Exit) bad('editor exit has no K2 match ' + step.id);
      else {
        const match = byId.get(step.k2Exit);
        if (!match) bad('editor exit match missing ' + step.id);
        else if (!match.who.includes('k2')) bad('editor exit match is not a K2 step ' + step.id);
        else if (match.key !== step.key) bad('editor exit key differs from K2 ' + step.id);
      }
    }
  } else if (listed.has(step.id)) bad('listed editor key is not an editor step ' + step.id);
}
for (const id of listed) if (!byId.has(id)) bad('listed editor key missing ' + id);

for (const step of steps) {
  if (step.editor || step.measure) continue;
  const save = step.id.startsWith('save-');
  const exitKey = step.action === 'key' && (step.key === 'ok' || step.key === 'menu' || step.key === 's1');
  const edgeExit = step.action === 'edge';
  if (save || exitKey || edgeExit) {
    for (const role of ['k2', 'c1', 'c2']) {
      if (!step.who.includes(role)) bad('unmatched exit or save step ' + step.id + ' missing ' + role);
    }
  }
}
const k2Save = steps.filter((s) => s.id.startsWith('save-') && s.who.includes('k2')).map((s) => s.id);
const c1Save = steps.filter((s) => s.id.startsWith('save-') && s.who.includes('c1')).map((s) => s.id);
if (k2Save.join() !== c1Save.join()) bad('K2 and candidate save steps differ');

const cS1 = byId.get('c-s1');
if (!cS1 || cS1.key !== 's1' || cS1.action !== 'key' || !cS1.editor) bad('S1 exit is not a real editor S1 key');
const saveJudge = steps.filter((s) => s.saveJudge);
if (saveJudge.length !== 1) bad('save judge count ' + saveJudge.length);
const commit = steps.filter((s) => s.commitStart);
if (commit.length !== 1) bad('commit baseline count ' + commit.length);
const before = byId.get('save-before-commit');
if (!before || !before.assertRow) bad('AF Target Mode is not asserted before the commit');
const tab = steps.filter((s) => s.assertAfTab);
if (tab.length !== 1 || tab[0].id !== 'save-left-19') bad('AF tab identity is not on the twentieth Left');

const owned = steps.filter((s) => s.fields && s.fields.target && sourcesOf(s.fields.target).some((leaf) => leaf.field === 'halfTarget' || (leaf.source === 'literal' && s.id === 'reopen-afon-down')));
if (!owned.length) bad('no owned-edge target');
for (const step of steps) {
  if (!step.fields || !step.fields.target) continue;
  const leaves = sourcesOf(step.fields.target);
  if (step.bank === 5 && leaves.some((leaf) => leaf.field === 'halfTarget') && step.edge === undefined && step.action === 'edge') {
    const from = leaves.find((leaf) => leaf.field === 'halfTarget');
    if (from && stepOf(from.source) !== 'ke-p-s1-down') bad(step.id + ' EXIF 6 target is not the EXIF K1e S1');
  }
}

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
  for (const p of problems.slice(0, 40)) process.stderr.write(p + '\n');
  process.exit(1);
}
