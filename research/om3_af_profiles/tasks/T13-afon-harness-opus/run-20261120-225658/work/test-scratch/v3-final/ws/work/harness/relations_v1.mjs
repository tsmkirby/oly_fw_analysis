// T13 behaviour relations (design_v2 §4.2). EMULATOR-ONLY.
// Port of the accepted table_v2.mjs field rules and display_v5.mjs edgeExpect routing.
// Every relation compares a state with a literal or with another recorded state; none reads an expected value
// written by the code under test. Relations never decide a value from the identity pass: that is §4.1 (expect_v1).
import { createHash } from 'node:crypto';
import { LAYOUT, packHalf } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { ALL, OWNERS, SINGLE, STOCK, frameSame } from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';

// The AF-ON press reference. T14 (accepted with corrections, conclusion (c)) could not show that stock AF-ON
// publishes the same record as stock half-press, so the reference is named here and nowhere else.
// 'k1e-s1-down-halfTarget': the K1e (overlay S1 reference) half-press record of the step named by pressFrom.
// Switching the reference means adding a new name to PRESS_REFERENCES and selecting it; no other edit.
export const PRESS_REFERENCES = {
  'k1e-s1-down-halfTarget': { role: 'k1e', field: 'halfTarget', note: 'K1e S1 down half-press record (T8d writer rule)' },
};
export const AFON_PRESS_REFERENCE = 'k1e-s1-down-halfTarget';

export const WRITER_A = [0x11, 0x02, 0x03, 0x00, 0x03, 0x00, 0x03, 0x00, 0x00, 0x00];
export const DISPLAY_OWNER2 = { 'seed-a': WRITER_A, 'seed-b': SINGLE, k2: ALL, k1: STOCK };
export const WRITER_CALLS = { t8d: 3, zone: 7 };

const sha = (bytes) => createHash('sha256').update(Buffer.from(bytes)).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function bankCell(state, bank) {
  if (!state || !state.half) return undefined;
  return { zone: state.half.k99a1[bank], pos: state.half.k5962[bank] };
}

function tail(half) {
  return half.k1de1.concat(half.k1df1).map((value) => value & 255);
}

// Field readers. A missing field is reported as absent, which is a failure unless the caller evaluates
// a retained historical record that never captured that field (option lenient, used only by the T11 fixture test).
const READ = {
  subject: (s) => s.subject,
  poseWord: (s) => s.poseWord,
  flag: (s) => s.flag,
  owner: (s) => s.owner,
  target: (s) => s.target,
  halfTarget: (s) => s.halfTarget,
  sizeRecord: (s) => s.sizeRecord,
  edge: (s) => s.edge,
  readBank: (s) => s.readBank,
  half: (s) => s.half,
  slots: (s) => s.slots,
  mirrorTail: (s) => (s.mirror71 ? s.mirror71.slice(55) : undefined),
  mirror71: (s) => s.mirror71,
  frame: (s) => s.frame,
  identity: (s) => s.identity,
};

function mirrorSha(state) {
  if (!state) return undefined;
  if (Array.isArray(state.mirror)) return sha(state.mirror);
  if (state.seals && state.seals.mirror) return state.seals.mirror;
  return undefined;
}

export function createJudge(options = {}) {
  const lenient = !!options.lenient;
  const out = [];
  function result(op, field, source, ok, detail) {
    out.push({ op, field, source, ok, detail: detail || null });
  }
  function value(op, field, state, reader) {
    if (!state) return { absent: true };
    const got = reader ? reader(state) : READ[field](state);
    if (got === undefined) return { absent: true };
    return { got };
  }
  function eq(op, field, source, state, want, reader) {
    const v = value(op, field, state, reader);
    if (v.absent) {
      if (lenient) return;
      result(op, field, source, false, 'absent');
      return;
    }
    if (want === undefined) {
      if (lenient) return;
      result(op, field, source, false, 'reference absent');
      return;
    }
    result(op, field, source, same(v.got, want), same(v.got, want) ? null : { got: v.got, want });
  }
  function eqMirror(op, source, state, wantSha) {
    const got = mirrorSha(state);
    if (got === undefined || wantSha === undefined) {
      if (!lenient) result(op, 'mirror', source, false, got === undefined ? 'absent' : 'reference absent');
      return;
    }
    result(op, 'mirror', source, got === wantSha, got === wantSha ? null : { got, want: wantSha });
  }
  function fail(op, field, source, detail) {
    result(op, field, source, false, detail);
  }
  return { out, result, eq, eqMirror, fail, lenient };
}

// recorded[role][stepId] is the state after the step's last phase; recorded[role][stepId + '-down'] is the
// down state of a key step. Same convention as the accepted drive_v12.mjs.
function at(recorded, role, id) {
  return recorded[role] ? recorded[role][id] : undefined;
}

// table_v2 keeps the generated field sources on each step; the raw rule flags are read back from them.
function leafOf(spec, role) {
  if (!spec) return null;
  if (spec.byRole) return spec.byRole[role] ? leafOf(spec.byRole[role], role) : null;
  return spec;
}
export function rawOf(step) {
  const flagLeaf = leafOf(step.fields && step.fields.flag, "candidate");
  const ownerLeaf = leafOf(step.fields && step.fields.owner, step.who[0]);
  return {
    flagOn: !!(flagLeaf && flagLeaf.source === "literal" && flagLeaf.value === 1),
    ownerLit: ownerLeaf && ownerLeaf.source === "literal" ? ownerLeaf.value : null,
    mirror: step.mirror || null,
    mirrorFrom: step.mirrorFrom || null,
    pressFrom: step.pressFrom || null,
    releaseFrom: step.releaseFrom || null,
    crossS1: !!step.crossS1,
    normalHalf: !!step.normalHalf,
    judgeRead: !!step.judgeRead,
  };
}

// The table flag literal is the value after the step. flagClear names the edge that writes it:
// with flagClear "up", the down edge still shows the previous value (preserve).
function flagWant(step, role, phase) {
  if (role !== "candidate" || step.id === "base") return { value: 255, source: "literal:255 (image MODE; flagImage)" };
  if (step.flagClear === "up" && phase === "down") return { preserve: true, source: "preserve (flagClear up: down edge)" };
  const on = rawOf(step).flagOn;
  return on ? { value: 1, source: "literal:1 (flagOn)" } : { value: 0, source: "literal:0 (flagOff)" };
}

// One table operation: role, table step, phase ('down' | 'up' | 'enter' | 'pose' | 'check'), before and after.
export function judgeTableOp(judge, recorded, { opId, role, step, phase, before, after }) {
  const raw = rawOf(step);
  judge.eq(opId, 'subject', 'literal:0', after, 0);
  judge.eq(opId, 'poseWord', 'literal:' + step.pose, after, step.pose);
  const flag = flagWant(step, role, phase);
  judge.eq(opId, 'flag', flag.source, after, flag.preserve ? (before ? before.flag : undefined) : flag.value);

  // Mirror head (55 bytes) and tail (16 bytes).
  const k1eBase = at(recorded, 'k1e', 'base');
  if (step.id === 'base') {
    if (role !== 'k1e') judge.eqMirror(opId, 'ref:k1e:base:mirror', after, mirrorSha(k1eBase));
  } else if (role === 'candidate' && (raw.mirror === 'factory' || raw.mirrorFrom)) {
    const from = raw.mirror === 'factory' ? 'base' : raw.mirrorFrom;
    const ref = at(recorded, 'k1e', from);
    judge.eqMirror(opId, 'ref:k1e:' + from + ':half->mirror', after, ref && ref.half ? sha(packHalf(ref.half)) : undefined);
  } else {
    judge.eqMirror(opId, 'preserve', after, mirrorSha(before));
  }
  if (role === 'candidate' && phase === 'enter') {
    judge.eq(opId, 'mirrorTail', 'ref:k1e:base:half-tail', after, k1eBase && k1eBase.half ? tail(k1eBase.half) : undefined);
  } else if (step.id !== 'base') {
    judge.eq(opId, 'mirrorTail', 'preserve', after, before && before.mirror71 ? before.mirror71.slice(55) : undefined);
  }

  // Half-press cells at the saved bank.
  const bank = step.bank;
  const cell = (state) => bankCell(state, bank);
  const cellOf = (r, id) => bankCell(at(recorded, r, id), bank);
  const half = step.half;
  if (half === 'base') {
    if (role !== 'k1e') judge.eq(opId, 'halfBank', 'ref:k1e:base:bank-cell', after, cellOf('k1e', 'base'), cell);
  } else if (half === 'reset') {
    judge.eq(opId, 'halfBank', 'ref:k1e:base:bank-cell', after, cellOf('k1e', 'base'), cell);
  } else if (half === 'k1e-move' || half === 'k1e-hold' || half === 'edited-vs-reset') {
    if (role === 'k1e') {
      if (half === 'k1e-move') judgePosChanged(judge, opId, after, at(recorded, 'k1e', step.halfRef), bank, 'k1e:' + step.halfRef);
      else judge.eq(opId, 'halfBank', 'ref:k1e:' + step.halfRef + ':bank-cell', after, cellOf('k1e', step.halfRef), cell);
    } else judge.eq(opId, 'halfBank', 'ref:k1e:base:bank-cell', after, cellOf('k1e', 'base'), cell);
  } else if (half === 'normal-move') {
    if (role === 'k2') judgePosChanged(judge, opId, after, at(recorded, 'k2', step.halfRef), bank, 'k2:' + step.halfRef);
    else judge.eq(opId, 'halfBank', 'ref:k2:' + step.id + ':bank-cell', after, cellOf('k2', step.id), cell);
  } else if (half === 'normal-hold') {
    judge.eq(opId, 'halfBank', 'ref:k2:' + step.halfRef + ':bank-cell', after, cellOf('k2', step.halfRef), cell);
  } else if (half === 'pose-hold') {
    if (role === 'candidate') {
      // Correction 1: every live half-cell slot equals K2's after the same operations; the mirror stays
      // on the candidate's own declared source (checked above), never K2's.
      const k2 = at(recorded, 'k2', step.id);
      judge.eq(opId, 'halfBank', 'ref:k2:' + step.id + ':bank-cell', after, cellOf('k2', step.id), cell);
      judge.eq(opId, 'half', 'ref:k2:' + step.id + ':all-live-cells', after, k2 ? k2.half : undefined);
      if (after && after.slots) judge.eq(opId, 'slots', 'ref:k2:' + step.id + ':slots', after, k2 ? k2.slots : undefined);
    }
  } else throw new Error('half mode ' + half);

  // Custom-size record: the candidate keeps K1e's base record; the controls keep their own.
  if (step.id === 'base') {
    if (role !== 'k1e') judge.eq(opId, 'sizeRecord', 'ref:k1e:base:sizeRecord', after, k1eBase ? k1eBase.sizeRecord : undefined);
  } else if (role === 'candidate') judge.eq(opId, 'sizeRecord', 'ref:k1e:base:sizeRecord', after, k1eBase ? k1eBase.sizeRecord : undefined);
  else judge.eq(opId, 'sizeRecord', 'preserve', after, before ? before.sizeRecord : undefined);

  // Owner and edge.
  const ownerLit = raw.ownerLit != null ? raw.ownerLit : (step.action === 'edge' && step.key === 's1' ? (step.dir === 'down' ? 1 : 0) : null);
  if (ownerLit != null) judge.eq(opId, 'owner', 'literal:' + ownerLit, after, ownerLit);
  else if (step.id === 'base') {
    if (role !== 'k1e') judge.eq(opId, 'owner', 'ref:k1e:base:owner', after, k1eBase ? k1eBase.owner : undefined);
  } else judge.eq(opId, 'owner', 'preserve', after, before ? before.owner : undefined);
  if (step.key === 'afon') judge.eq(opId, 'edge', 'literal:{status:0,enabled:1}', after, { status: 0, enabled: 1 });
  else if (step.action === 'edge' && step.key === 's1') {
    if (role === 'candidate') {
      const k2 = at(recorded, 'k2', step.id);
      judge.eq(opId, 'edge', 'ref:k2:' + step.id + ':edge', after, k2 ? k2.edge : undefined);
    }
  } else if (step.id === 'base') {
    if (role !== 'k1e') judge.eq(opId, 'edge', 'ref:k1e:base:edge', after, k1eBase ? k1eBase.edge : undefined);
  } else judge.eq(opId, 'edge', 'preserve', after, before ? before.edge : undefined);

  // Ten-byte records.
  if (raw.pressFrom && role === 'candidate') {
    const refName = AFON_PRESS_REFERENCE;
    const ref = PRESS_REFERENCES[refName];
    const src = at(recorded, ref.role, raw.pressFrom);
    judge.eq(opId, 'target', 'ref:' + ref.role + ':' + raw.pressFrom + ':' + ref.field + ' [' + refName + ']', after, src ? src[ref.field] : undefined);
  }
  if (raw.releaseFrom && role === 'candidate') {
    const src = at(recorded, 'candidate', raw.releaseFrom);
    judge.eq(opId, 'target', 'ref:candidate:' + raw.releaseFrom + ':halfTarget', after, src ? src.halfTarget : undefined);
    judge.eq(opId, 'halfTarget', 'ref:candidate:' + raw.releaseFrom + ':halfTarget', after, src ? src.halfTarget : undefined);
  }
  if ((raw.crossS1 || raw.normalHalf) && role === 'candidate') {
    const k2 = at(recorded, 'k2', step.id);
    judge.eq(opId, 'target', 'ref:k2:' + step.id + ':target', after, k2 ? k2.target : undefined);
    judge.eq(opId, 'halfTarget', 'ref:k2:' + step.id + ':halfTarget', after, k2 ? k2.halfTarget : undefined);
  }
  if (raw.judgeRead && role === 'candidate') judge.eq(opId, 'readBank', 'literal:' + bank + ' (T8c Q1 saved index)', after, bank);
}

function judgePosChanged(judge, opId, after, ref, bank, name) {
  const got = bankCell(after, bank);
  const want = bankCell(ref, bank);
  if (got === undefined || want === undefined) {
    if (!judge.lenient) judge.fail(opId, 'halfBank', 'relation:pos-changed-at-bank ' + name, 'absent');
    return;
  }
  const ok = got.zone === want.zone && got.pos !== want.pos;
  judge.result(opId, 'halfBank', 'relation:pos-changed-at-bank ' + name, ok, ok ? null : { got, ref: want });
}

// Commit identity relation (table_v2 identityFrom): the commit lands on the producing role's screen and highlight.
// The title-band hash is not part of this relation: the retained T11 identity-v10 emulator records show the
// candidate AF-ON release title differing from K1e's S1 release title (af-up, p-af-up) while screen and highlight
// agree. The title is covered per role by §4.1 reproduction (expect_v1) instead.
export function judgeIdentityFrom(judge, opId, actual, producer, producerKey) {
  if (!actual) {
    judge.fail(opId, 'identity', 'ref:' + producerKey, 'absent');
    return;
  }
  if (!producer) {
    judge.fail(opId, 'identity', 'ref:' + producerKey, 'reference absent');
    return;
  }
  const pick = (x) => ({ highlight: x.highlight, screen: x.screen });
  const ok = same(pick(actual), pick(producer));
  judge.result(opId, 'identity', 'ref:' + producerKey, ok, ok ? null : { got: pick(actual), want: pick(producer) });
}

// Zone relations: each zone's candidate AF-ON press and release records equal zone K1e's S1 records of that zone.
export function judgeZone(judge, zoneId, k1ePress, k1eRelease, candPress, candRelease) {
  judge.eq('zone-' + zoneId + '-press', 'target', 'ref:zk1e:' + zoneId + ':s1-down:target', candPress, k1ePress ? k1ePress.target : undefined);
  judge.eq('zone-' + zoneId + '-release', 'target', 'ref:zk1e:' + zoneId + ':s1-up:target', candRelease, k1eRelease ? k1eRelease.target : undefined);
}

export function judgeWriter(judge, id, count, want) {
  judge.result(id, 'writer', 'literal:' + want, count === want, count === want ? null : { got: count, want });
}

export function judgePoseWatch(judge, opId, leak) {
  if (!Array.isArray(leak)) {
    judge.fail(opId, 'poseWatch', 'installed hook watch record', 'absent');
    return;
  }
  judge.result(opId, 'poseWatch', 'installed hook watch record: no live store of the saved mirror position', leak.length === 0, leak.length ? leak : null);
}

// Display edges (display_v5 routing). job: 'seed-a' | 'seed-b' | 'k2' | 'k1'. refs: { k1eFrame: {a,b}, k2Edges, k1Frame }.
export function displayWant(job, i, refs) {
  const stock = job === 'k1';
  const owner = stock ? 255 : OWNERS[i];
  let frame;
  let frameSource;
  if (job === 'k2') { frame = refs.k2Edges[i]; frameSource = 'ref:T9d:ref-k2:edge-' + i; }
  else if (owner === 2) {
    frame = job === 'seed-a' ? refs.k1eFrame.a : refs.k1eFrame.b;
    frameSource = 'ref:T9d:ref-k1e-' + (job === 'seed-a' ? 'a' : 'b');
  } else if (stock) { frame = refs.k1Frame; frameSource = 'literal:centre mark (K1 stock)'; }
  else { frame = refs.k2Edges[i]; frameSource = 'ref:T9d:ref-k2:edge-' + i; }
  const target = owner === 2 ? DISPLAY_OWNER2[job] : (stock ? STOCK : ALL);
  return { owner, target, frame, frameSource, halfTarget: owner === 1 ? target : null };
}

export function judgeDisplayEdge(judge, opId, job, i, refs, before, after, frameOf) {
  const want = displayWant(job, i, refs);
  judge.eq(opId, 'subject', 'literal:0', after, 0);
  judge.eq(opId, 'owner', 'literal:' + want.owner + ' (T9d OWNERS)', after, want.owner);
  judge.eq(opId, 'target', 'literal:T9d record for owner ' + want.owner, after, want.target);
  if (want.halfTarget) judge.eq(opId, 'halfTarget', 'literal:T9d record (owner 1)', after, want.halfTarget);
  else judge.eq(opId, 'halfTarget', 'preserve', after, before ? before.halfTarget : undefined);
  const got = after ? frameOf(after) : undefined;
  if (!got || !want.frame) {
    judge.fail(opId, 'frame', want.frameSource, got ? 'reference absent' : 'absent');
  } else {
    const ok = frameSame(got, want.frame);
    judge.result(opId, 'frame', want.frameSource, ok, ok ? null : { got: { boxes: got.boxes, pixels: got.pixels, n31: got.n31 }, want: { boxes: want.frame.boxes, pixels: want.frame.pixels, n31: want.frame.n31 } });
  }
  const slot = after && after.slots ? after.slots.find((s) => s.key === 0x88b2 && s.index === 0) : undefined;
  judge.result(opId, 'slot 88b2:0', 'literal:526 (reset 0x88b2)', !!slot && slot.value === 526, slot ? (slot.value === 526 ? null : { got: slot.value }) : 'absent');
  const others = (s) => (s && s.slots ? s.slots.filter((x) => !(x.key === 0x88b2 && x.index === 0)) : undefined);
  judge.eq(opId, 'slots', 'preserve (other than 88b2:0)', { slots: others(after) }, others(before), (s) => s.slots);
  judge.eq(opId, 'mirror71', 'preserve', after, before ? before.mirror71 : undefined);
  judge.eq(opId, 'flag', 'preserve', after, before ? before.flag : undefined);
}

export { bankCell, packHalf, LAYOUT };
