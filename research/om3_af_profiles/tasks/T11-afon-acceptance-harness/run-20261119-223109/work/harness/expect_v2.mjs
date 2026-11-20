// Turns one generated-table step into the gate expectation for a single operation.
// Named fields are resolved from that step's single source. Every other full-state field is held.
import { packHalf } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { LAYOUT } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';

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

export function resolveField(spec, role, recorded, step) {
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

export function stepExpect(step, phase, role, recorded) {
  const named = { subject: 0 };
  const hold = ['frame'];
  const seal = [];
  const slotExcept = [];
  const slotValues = [];
  const setsFlag = role === 'candidate' && ((step.action === 'enter' && phase === 'enter') || step.flagClear === phase);
  if (setsFlag) named.flag = step.action === 'enter' && phase === 'enter' ? 1 : 0;
  else hold.push('flag');
  if (step.action === 'edge' && step.fields.owner) {
    const got = resolveField(step.fields.owner, role, recorded, step);
    if (got.seal) seal.push('owner');
    else named.owner = got.value;
  } else hold.push('owner');
  for (const field of ['target', 'halfTarget']) {
    if (step.action === 'edge' && step.fields[field]) {
      const got = resolveField(step.fields[field], role, recorded, step);
      if (got.seal) seal.push(field);
      else named[field] = got.value;
    } else hold.push(field);
  }
  if (step.action === 'pose') {
    const base = recorded.k1e.base;
    if (!base) throw new Error('pose before the K1e base row');
    slotValues.push({ key: 0x88b2, index: 0, value: base.half.k88b2[0] });
    slotExcept.push({ key: 0x88b2, index: 0 });
  } else if ((step.half === 'k1e-move' || step.half === 'normal-move') && phase === 'down') {
    slotExcept.push({ key: 0x5962, index: step.bank }, { key: 0x88b2, index: 0 });
  }
  hold.push('slots');
  if (slotValues.length) named.slotValues = slotValues;
  const mirrorMoves = role === 'candidate' && (phase === 'enter' || (step.editor && phase === 'down'));
  if (mirrorMoves) {
    const got = resolveField(step.fields.mirror, role, recorded, step);
    if (got.value) named.mirror = got.value;
    if (phase === 'enter') named.mirrorTail = tailOf(recorded.k1e.base.half);
    else hold.push('mirrorTail');
  } else hold.push('mirror71');
  return { named, hold, seal, slotExcept };
}

export function holdAll(extraNamed = {}) {
  return {
    named: { subject: 0, ...extraNamed },
    hold: ['slots', 'mirror71', 'flag', 'target', 'halfTarget', 'owner', 'frame'],
    seal: [],
    slotExcept: [],
  };
}

export function mirrorByteExpect(before, key, index, value) {
  const row = LAYOUT.find((item) => item.key === key);
  if (!row) throw new Error('mirror key ' + key.toString(16));
  const next = before.mirror71.slice();
  const at = row.off + index * row.width;
  if (row.width === 2) {
    next[at] = value & 255;
    next[at + 1] = (value >> 8) & 255;
  } else next[at] = value & 255;
  return {
    named: { subject: 0, mirror71: next },
    hold: ['slots', 'flag', 'target', 'halfTarget', 'owner', 'frame'],
    seal: [],
    slotExcept: [],
  };
}

export function plantExpect(before, key, index, value) {
  const slots = before.slots.map((slot) => ({ ...slot }));
  const found = slots.find((slot) => slot.key === key && slot.index === index);
  if (!found) throw new Error('plant slot ' + key.toString(16));
  found.value = value;
  return {
    named: { subject: 0, slots },
    hold: ['mirror71', 'flag', 'target', 'halfTarget', 'owner', 'frame'],
    seal: [],
    slotExcept: [],
  };
}

export function flagExpect(value) {
  return {
    named: { subject: 0, flag: value },
    hold: ['slots', 'mirror71', 'target', 'halfTarget', 'owner', 'frame'],
    seal: [],
    slotExcept: [],
  };
}

export function mirrorBytesExpect(bytes) {
  return {
    named: { subject: 0, mirror: Array.from(bytes) },
    hold: ['slots', 'mirrorTail', 'flag', 'target', 'halfTarget', 'owner', 'frame'],
    seal: [],
    slotExcept: [],
  };
}
