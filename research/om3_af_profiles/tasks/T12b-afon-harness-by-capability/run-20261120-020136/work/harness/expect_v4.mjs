// One declared source or explicit preservation for every full-state field.
// Position cells and sealed ten-byte records take their values from the T11 identity log.
// Copied from T12 expect_v3.mjs. The op-id import is the local spelling module so this
// file does not load the T12 inventory registrar. EMULATOR-ONLY.
import { LAYOUT, packHalf } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { DECLARED } from './declared_v2.mjs';
import { opId } from './op_id_v1.mjs';
import { LIVE } from './state_v1.mjs';

export function slotsFromHalf(half) {
  const slots = [];
  for (const row of LAYOUT) {
    const live = LIVE[row.key];
    if (!live) throw new Error('no live ' + row.key.toString(16));
    const cells = half[live.name];
    if (!cells) throw new Error('half ' + live.name);
    for (let i = 0; i < row.n; i++) slots.push({ key: row.key, index: i, value: cells[i] });
  }
  if (slots.length !== 63) throw new Error('slot count ' + slots.length);
  return slots;
}

export function fromRow(row) {
  if (!row) return null;
  return {
    named: {
      subject: row.subject,
      owner: row.owner,
      flag: row.flag,
      target: row.target,
      halfTarget: row.halfTarget,
      slots: slotsFromHalf(row.half),
    },
    hold: ['mirror71', 'frame'],
    slotExcept: [],
    source: row.source,
  };
}

export function fromDeclared(id) {
  return fromRow(DECLARED.steps[id]);
}

export function setupExpect() {
  const plan = fromRow(DECLARED.setup);
  if (!plan) throw new Error('no declared setup state');
  return plan;
}

export function expectId(id) {
  const plan = fromDeclared(id);
  if (!plan) throw new Error('no declared state ' + id);
  return plan;
}

function leafFor(spec, role) {
  if (!spec) throw new Error('missing field');
  if (spec.byRole) {
    if (!spec.byRole[role]) throw new Error('missing role source ' + role);
    return leafFor(spec.byRole[role], role);
  }
  return spec;
}

function lookup(source, role, recorded) {
  const match = /^ref:(K1e|K2|session):([A-Za-z0-9-]+)$/.exec(source);
  if (!match) throw new Error('bad source ' + source);
  const who = match[1] === 'session' ? role : (match[1] === 'K1e' ? 'k1e' : 'k2');
  const row = recorded[who][match[2]];
  if (!row) throw new Error('missing reference ' + source);
  return row;
}

function resolveField(spec, role, recorded) {
  const leaf = leafFor(spec, role);
  if (leaf.source === 'seal') return { seal: true };
  if (leaf.source === 'literal') return { value: leaf.value };
  const row = lookup(leaf.source, role, recorded);
  if (leaf.map === 'half-to-mirror') return { value: packHalf(row.half) };
  if (leaf.field) return { value: row[leaf.field] };
  return { value: row };
}

function tailOf(half) {
  return half.k1de1.concat(half.k1df1).map((value) => value & 255);
}

function mirrorOverlay(step, phase, role, recorded) {
  const mirrorMoves = role === 'candidate' && (phase === 'enter' || (step.editor && phase === 'down'));
  if (!mirrorMoves || !step.fields || !step.fields.mirror) return null;
  const got = resolveField(step.fields.mirror, role, recorded);
  if (!got || got.seal || !got.value) return null;
  const named = { mirror: got.value };
  if (phase === 'enter' && recorded.k1e && recorded.k1e.base && recorded.k1e.base.half) {
    named.mirrorTail = tailOf(recorded.k1e.base.half);
  }
  return named;
}

export function stepExpect(step, phase, role, recorded) {
  const plan = fromDeclared(opId(role, step, phase));
  if (!plan) throw new Error('no declared state ' + opId(role, step, phase));
  const named = { ...plan.named };
  const hold = new Set(plan.hold);
  const moved = mirrorOverlay(step, phase, role, recorded);
  if (moved) {
    if (moved.mirror) named.mirror = moved.mirror;
    if (moved.mirrorTail) named.mirrorTail = moved.mirrorTail;
    else hold.add('mirrorTail');
    hold.delete('mirror71');
  }
  return { named, hold: [...hold], slotExcept: [], source: plan.source };
}

export function holdAll(extraNamed = {}) {
  return {
    named: { subject: 0, ...extraNamed },
    hold: ['slots', 'mirror71', 'flag', 'target', 'halfTarget', 'owner', 'frame'],
    slotExcept: [],
  };
}

export function plantExpect(before, key, index, value) {
  const slots = before.slots.map((slot) => ({ ...slot }));
  const found = slots.find((slot) => slot.key === key && slot.index === index);
  if (!found) throw new Error('plant slot ' + key.toString(16));
  found.value = value;
  return {
    named: { subject: before.subject, owner: before.owner, flag: before.flag, target: before.target, halfTarget: before.halfTarget, slots },
    hold: ['mirror71', 'frame'],
    slotExcept: [],
    source: 'previous full state with one declared slot write',
  };
}

export function mirrorHeadExpect(before, bytes) {
  return {
    named: {
      subject: before.subject,
      owner: before.owner,
      flag: before.flag,
      target: before.target,
      halfTarget: before.halfTarget,
      slots: before.slots.map((slot) => ({ ...slot })),
      mirror: Array.from(bytes),
    },
    hold: ['mirrorTail', 'frame'],
    slotExcept: [],
    source: 'declared mirror head written by the display seed',
  };
}

export function edgeExpect(ownerExpect, targetExpect, frameExpect) {
  const named = {
    subject: 0,
    owner: ownerExpect,
    target: Array.from(targetExpect),
    frame: frameExpect,
    slotValues: [{ key: 0x88b2, index: 0, value: 526, source: 'reset 0x88b2' }],
  };
  const hold = ['slots', 'mirror71', 'flag'];
  if (ownerExpect === 1) named.halfTarget = Array.from(targetExpect);
  else hold.push('halfTarget');
  return { named, hold, slotExcept: [], source: 'T9d reference frame and owner record' };
}
