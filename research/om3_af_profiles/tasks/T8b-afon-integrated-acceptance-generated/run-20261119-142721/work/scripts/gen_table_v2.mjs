// Expands a sequence into one row per key and per edge. Static. Not an experiment version.
// Honours titleHash as a literal title. Usage: node26 work/scripts/gen_table_v2.mjs <sequence.json> <table.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [sequencePath, tablePath] = process.argv.slice(2);
if (!sequencePath || !tablePath) {
  process.stderr.write('usage: node26 work/scripts/gen_table.mjs <sequence.json> <table.json>\n');
  process.exit(2);
}
const sequence = JSON.parse(readFileSync(resolve(sequencePath), 'utf8'));
const lit = (value) => ({ source: 'literal', value });
const ref = (role, id) => ({ source: 'ref:' + role + ':' + id });

function whoOf(who) {
  const out = [];
  for (const role of who) {
    if (role === 'candidate') out.push('c1', 'c2');
    else out.push(role);
  }
  return out;
}

function mirrorSource(step) {
  if (step.mirror === 'k2') return ref('K2', step.id);
  const bytes = sequence.profiles[step.mirror];
  if (!bytes) throw new Error(step.id + ' unknown profile ' + step.mirror);
  return lit(bytes);
}

function baseFields(step) {
  if (step.shared) {
    return {
      title: ref('K2', step.id),
      mirror: mirrorSource(step),
      zone: ref('K2', step.id),
      flag: ref('K2', step.id),
      half: ref('K2', step.id),
      sizeRecord: ref('K2', step.id),
      screen: ref('K2', step.id),
    };
  }
  const anchor = step.anchor;
  if (!anchor) throw new Error(step.id + ' has no anchor');
  const fields = {
    title: step.titleHash ? lit(step.titleHash) : ref('K2', step.titleFrom || anchor),
    mirror: mirrorSource(step),
    zone: lit(step.zone),
    flag: lit(step.flag),
    half: ref('K2', anchor),
    sizeRecord: ref('K2', anchor),
    screen: step.screenFrom === 'k2' ? ref('K2', step.id) : lit(step.screen),
  };
  return fields;
}

function edgeFields(step, fields) {
  const edge = step.edge;
  fields.owner = lit(edge.owner);
  fields.status = lit(0);
  fields.enabled = lit(1);
  fields.focus = ref('K2', step.id);
  if (edge.target === 'k2' || !edge.owned) fields.target = ref('K2', step.id);
  else fields.target = lit(sequence.targets[edge.target]);
  return fields;
}

const steps = [];
for (const action of sequence.actions) {
  const pieces = action.keys || [action];
  for (const piece of pieces) {
    const step = { ...action, ...piece };
    delete step.keys;
    if (!step.id || !step.action) throw new Error('step missing id or action');
    const fields = baseFields(step);
    if (step.action === 'edge') edgeFields(step, fields);
    steps.push({
      id: step.id,
      action: step.action,
      who: whoOf(step.who),
      phase: step.phase,
      editor: !!step.editor,
      k1Skip: !!step.k1Skip,
      key: step.key || null,
      dir: step.dir || null,
      dial: step.dial || null,
      detents: step.detents || null,
      commitStart: !!step.commitStart,
      saveJudge: !!step.saveJudge,
      assertAfTab: !!step.assertAfTab,
      assertRow: !!step.assertRow,
      fields,
    });
  }
}

const editorKeys = steps.filter((s) => s.editor).map((s) => s.id);
const table = {
  task: 'T8b',
  table: 'accept-table-t8b',
  afTabHeader: sequence.afTabHeader,
  afTabTitle: sequence.afTabTitle,
  bank1Position: sequence.bank1Position,
  bank5Position: sequence.bank5Position,
  c1Dimensions: sequence.c1Dimensions,
  sizeByte: sequence.sizeByte,
  targets: sequence.targets,
  editorKeys,
  steps,
};
writeFileSync(resolve(tablePath), JSON.stringify(table, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: true, steps: steps.length, editorKeys: editorKeys.length }) + '\n');
