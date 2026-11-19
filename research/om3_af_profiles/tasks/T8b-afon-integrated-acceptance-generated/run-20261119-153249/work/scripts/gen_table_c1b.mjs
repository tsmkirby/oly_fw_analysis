// Expands sequence-c1.json. Titles for editor-only steps come from the K2 anchor.
// Static. Not an experiment version.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FACTORY_MIRROR, FACTORY_TARGET, FF55 } from './lib_map_c1.mjs';

const [sequencePath, tablePath] = process.argv.slice(2);
if (!sequencePath || !tablePath) {
  process.stderr.write('usage: node26 work/scripts/gen_table_c1b.mjs <sequence.json> <table.json>\n');
  process.exit(2);
}
const sequence = JSON.parse(readFileSync(resolve(sequencePath), 'utf8'));

const P_FLAG_ON = 'T3l decision: entry sets the flag';
const P_FLAG_OFF = 'T3l decision: exit clears the flag';
const P_ZONE0 = 'T8 decision: K2 zone byte is 0; T3l decision: exit restores the entry snapshot';
const P_OWNER = 'T5 edge list and T6 design: AF-ON owner 2, release owner 0, S1 owner 1';
const P_STATUS = 'T8 decision: K2 status 0 and enabled 1 on the combined overlay';
const P_FACTORY = 'K1 claim 2: position 526 and the 3x3 custom size. ROM registration payloads disagree and are recorded in factory-defaults-c1.json';
const P_FF = 'T8 decision: the reopen mirror is 55 FF bytes';
const P_ALL = 'T6 design: an FF mirror builds the All record 0e 02 02 00 01 00 01 00 00 00';
const P_SIZE = 'T6 design: the AF-ON size byte follows mirror 0x9a41[0] while the half-press size follows live 0x9a41[0]';
const P_SCREEN = 'T3l decision: entry stays on the shooting screen until the direct editor opens';

function lit(value, provenance) {
  return { source: 'literal', value, provenance };
}
function ref(role, id, extra = {}) {
  return { source: 'ref:' + role + ':' + id, ...extra };
}
function whoOf(who) {
  const out = [];
  for (const role of who || []) {
    if (role === 'candidate') out.push('c1', 'c2');
    else out.push(role);
  }
  return out;
}
function flagSpec(kind, id) {
  if (kind === 'on') return { byRole: { c1: lit(1, P_FLAG_ON), c2: lit(1, P_FLAG_ON) } };
  if (kind === 'off') return { byRole: { c1: lit(0, P_FLAG_OFF), c2: lit(0, P_FLAG_OFF) } };
  return ref('K2', id);
}
function mirrorSpec(step) {
  if (step.mirrorFrom === 'factory') return lit(FACTORY_MIRROR, P_FACTORY);
  if (step.mirrorFrom === 'ff') return lit(FF55, P_FF);
  if (step.mirrorFrom === 'k1e') return ref('K1e', step.id, { map: 'half-to-mirror' });
  if (step.mirrorFrom === 'k1e-hold') return ref('K1e', step.hold, { map: 'half-to-mirror' });
  if (step.mirrorFrom === 'size') return ref('K1e', step.hold, { map: 'half-to-mirror', sizeByte: 4, sizeProvenance: P_SIZE });
  return ref('K2', step.id);
}
function zoneSpec(step) {
  if (step.zoneFrom === 'k1e') return ref('K1e', step.id, { map: 'zone-byte' });
  if (step.zoneFrom === 'literal') return lit(step.zone, P_ZONE0);
  return ref('K2', step.id);
}
function screenSpec(step) {
  if (step.screenFrom === 'k1e') return ref('K1e', step.id, { field: 'screen' });
  if (step.screenFrom === 'literal') return lit(step.screen, P_SCREEN);
  return ref('K2', step.id);
}
function titleSpec(step) {
  if (step.screenFrom === 'k1e') return ref('K1e', step.id, { field: 'title' });
  if (step.anchor && !step.shared) return ref('K2', step.anchor);
  return ref('K2', step.id);
}
function baseFields(step) {
  if (step.measure) {
    const idle = ref('K2', 'setup');
    return { title: idle, mirror: idle, zone: idle, flag: idle, half: idle, sizeRecord: idle, screen: idle };
  }
  const anchor = step.anchor || step.id;
  const same = step.shared && !step.anchor ? step.id : anchor;
  return {
    title: titleSpec(step),
    mirror: mirrorSpec(step),
    zone: zoneSpec(step),
    flag: flagSpec(step.flagFrom || (step.shared ? 'k2' : 'off'), step.id),
    half: ref('K2', same),
    sizeRecord: ref('K2', same),
    screen: screenSpec(step),
  };
}
function edgeFields(step, fields) {
  const edge = step.edge;
  fields.owner = lit(edge.owner, P_OWNER);
  fields.status = lit(0, P_STATUS);
  fields.enabled = lit(1, P_STATUS);
  fields.focus = ref('K2', step.id);
  if (edge.targetFrom === 'k2') fields.target = ref('K2', step.id);
  else if (edge.targetFrom === 'factory-all') fields.target = lit(FACTORY_TARGET, P_ALL);
  else if (edge.targetFrom === 'sized') fields.target = ref('K1e', edge.k1eStep, { field: 'halfTarget', sizeByte: 4, sizeProvenance: P_SIZE });
  else fields.target = ref('K1e', edge.k1eStep, { field: 'halfTarget' });
  return fields;
}

const steps = [];
for (const action of sequence.actions) {
  const pieces = action.keys || [action];
  for (const piece of pieces) {
    const step = { ...action, ...piece };
    delete step.keys;
    if (piece.exit === false) step.exit = false;
    if (!step.id || !step.action) throw new Error('step missing id or action');
    const fields = baseFields(step);
    if (step.action === 'edge' && step.edge) edgeFields(step, fields);
    steps.push({
      id: step.id, action: step.action, who: whoOf(step.who), phase: step.phase,
      editor: !!step.editor, measure: !!step.measure, exit: !!step.exit, k1Skip: !!step.k1Skip,
      k2Exit: step.k2Exit || null, bank: step.bank || (step.edge && step.edge.bank) || null,
      key: step.key || null, dir: step.dir || null, dial: step.dial || null, detents: step.detents || null,
      commitStart: !!step.commitStart, saveJudge: !!step.saveJudge, assertAfTab: !!step.assertAfTab,
      assertRow: !!step.assertRow, fields,
    });
  }
}
const editorKeys = steps.filter((s) => s.editor).map((s) => s.id);
writeFileSync(resolve(tablePath), JSON.stringify({
  task: 'T8b', table: 'accept-table-t8b-c1b', afTabHeader: sequence.afTabHeader, afTabTitle: sequence.afTabTitle,
  map: 'half-to-mirror packs K1e half-press cells into the 55-byte mirror using LAYOUT. Offset 33 stays 255. zone-byte is K1e k99a1[0] when it differs from K1 claim 2, otherwise 0. halfTarget is the ten bytes at 0xa33f2ce0 after K1e S1.',
  banks: { landscape: 1, exif6: 5 }, editorKeys, steps,
}, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: true, steps: steps.length, editorKeys: editorKeys.length }) + '\n');
