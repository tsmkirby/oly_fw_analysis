// Field judge for one generated-table step. Down edges use the same half-press
// preservation rule and, on an editor step, the K1e down image as the one mirror source.
import { packHalf } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { same } from './state_v1.mjs';

export const RESET = {
  k99a1: [2, 0, 2, 0, 2, 0, 5, 5],
  k9a41: [0, 1],
  k5962: [526, 526, 526, 526, 526, 526],
  k1dd1: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  k84d1: [3],
  k88b2: [526],
  k90d1: [2, 2, 2, 2, 2, 2, 5, 5],
  k5a11: [1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1],
  k1de1: [1, 1, 1, 1, 1, 1, 1, 1],
  k1df1: [1, 1, 1, 1, 0, 0, 0, 0],
};

const u16 = (bytes) => bytes[0] | (bytes[1] << 8);
const stale = (bytes) => Array.isArray(bytes) && bytes.length >= 7 && bytes[4] === 27 && bytes[6] === 39;

function leafFor(spec, role) {
  if (!spec) throw new Error('missing field');
  if (spec.byRole) {
    if (!spec.byRole[role]) throw new Error('missing role source ' + role);
    return leafFor(spec.byRole[role], role);
  }
  return spec;
}

function lookup(source, role, recorded) {
  const m = /^ref:(K1e|K2|session):([A-Za-z0-9-]+)$/.exec(source);
  if (!m) throw new Error('bad source ' + source);
  const who = m[1] === 'session' ? role : (m[1] === 'K1e' ? 'k1e' : 'k2');
  const row = recorded[who][m[2]];
  if (!row) throw new Error('missing reference ' + source);
  return row;
}

export function preservedHalf(step, recorded) {
  if (recorded.k2[step.id]) return recorded.k2[step.id].half;
  if (recorded.k2[step.id + '-down']) return recorded.k2[step.id + '-down'].half;
  return RESET;
}

function mirrorTail(step, actual, recorded, stepOrder) {
  if (step.id === 'base') return [];
  const tail = actual.mirror71.slice(0x37, 0x47);
  const at = stepOrder.indexOf(step.id);
  let wantTail = RESET.k1de1.concat(RESET.k1df1);
  if (stepOrder.indexOf('p-menu') <= at && recorded.k1e['p-menu']) wantTail = recorded.k1e['p-menu'].half.k1de1.concat(recorded.k1e['p-menu'].half.k1df1);
  else if (stepOrder.indexOf('e-ok') <= at && recorded.k1e['e-ok']) wantTail = recorded.k1e['e-ok'].half.k1de1.concat(recorded.k1e['e-ok'].half.k1df1);
  const problems = [];
  if (!same(tail, wantTail)) problems.push('mirror 0x37-0x46');
  if (!same(actual.mirror71.slice(0, 55), actual.mirror)) problems.push('mirror71 prefix');
  return problems;
}

export function judge(role, step, actual, recorded, stepOrder) {
  const problems = [];
  if (actual.subject !== 0) problems.push('subject ' + actual.subject);
  if (actual.poseWord !== step.pose) problems.push('pose word ' + actual.poseWord);
  if (actual.slots.length !== 63) problems.push('slots ' + actual.slots.length);
  if (!actual.mirror71 || actual.mirror71.length !== 71) problems.push('mirror71');
  if (step.judgeRead) {
    if (!actual.readCount) problems.push('no dynamic profile read');
    if (actual.readBank == null) problems.push('dynamic banks disagree');
  }
  for (const [name, spec] of Object.entries(step.fields || {})) {
    const leaf = leafFor(spec, role);
    if (leaf.source === 'seal') {
      if (name === 'halfTarget' && stale(actual.halfTarget)) problems.push('stale half-press record');
      continue;
    }
    let want;
    let relation = null;
    if (leaf.source === 'literal') want = leaf.value;
    else {
      const row = lookup(leaf.source, role, recorded);
      if (leaf.relation === 'pos-changed-at-bank') relation = row.half;
      else if (leaf.map === 'half-to-mirror') want = packHalf(row.half);
      else if (leaf.map === 'bank-cell') want = { zone: row.half.k99a1[step.bank], pos: row.half.k5962[step.bank] };
      else want = row[leaf.field || name];
      if (leaf.bankFrom) {
        const cell = recorded.k1e[leaf.bankFrom];
        if (!cell) problems.push('missing bank cell ' + leaf.bankFrom);
        else if (u16(actual.target) !== cell.half.k5962[step.bank]) problems.push('position bank cell');
      }
    }
    if (relation) {
      const now = actual.half.k5962;
      const prev = relation.k5962;
      if (now[step.bank] === prev[step.bank]) problems.push('position did not change at ' + step.bank);
      for (let i = 0; i < now.length; i++) if (i !== step.bank && now[i] !== prev[i]) problems.push('k5962[' + i + '] changed');
      if (actual.half.k99a1[step.bank] !== relation.k99a1[step.bank]) problems.push('zone changed at ' + step.bank);
      continue;
    }
    if ((name === 'halfTarget' || (name === 'target' && step.pressFrom)) && (stale(want) || stale(actual[name]))) problems.push('stale ' + name);
    if (!same(actual[name], want)) problems.push(name);
  }
  if (role === 'candidate') {
    const expectHalf = preservedHalf(step, recorded);
    for (const name of Object.keys(RESET)) {
      if (!same(actual.half[name], expectHalf[name])) problems.push('half ' + name);
    }
    problems.push(...mirrorTail(step, actual, recorded, stepOrder));
  }
  return problems;
}

function previousHalf(recorded, stepOrder, step) {
  const at = stepOrder.indexOf(step.id);
  for (let i = at - 1; i >= 0; i--) {
    const prior = recorded.candidate[stepOrder[i]];
    if (prior && prior.half) return prior.half;
  }
  return null;
}

export function judgeDown(role, step, actual, recorded, stepOrder) {
  const problems = [];
  if (actual.subject !== 0) problems.push('subject ' + actual.subject);
  if (actual.poseWord !== step.pose) problems.push('pose word ' + actual.poseWord);
  if (actual.slots.length !== 63) problems.push('slots');
  if (!actual.mirror71 || actual.mirror71.length !== 71) problems.push('mirror71');
  if (actual.target.length !== 10 || actual.halfTarget.length !== 10) problems.push('records');
  if (role !== 'candidate') return problems;
  const expectHalf = recorded.k2[step.id + '-down'] ? recorded.k2[step.id + '-down'].half : RESET;
  const halfProblems = [];
  for (const name of Object.keys(RESET)) {
    if (!same(actual.half[name], expectHalf[name])) halfProblems.push('half ' + name);
  }
  // The combined hook edits the mirror while the editor flag is set and the stock
  // path commits that mirror onto the live half-press cells at key release.
  // A down edge that has not moved the live half yet still records all 63 slots.
  // A down edge that does move the half has to match the K2 down half.
  if (halfProblems.length) {
    const prior = previousHalf(recorded, stepOrder || [], step);
    if (!prior || !same(actual.half, prior)) problems.push(...halfProblems);
  }
  if (step.who.includes('k1e') && recorded.k1e[step.id + '-down']) {
    const want = packHalf(recorded.k1e[step.id + '-down'].half);
    if (!same(actual.mirror, want)) problems.push('mirror');
  } else if (recorded.candidate.prevMirror && !same(actual.mirror, recorded.candidate.prevMirror)) {
    problems.push('mirror moved');
  }
  return problems;
}
