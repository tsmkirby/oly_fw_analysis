// Binds each operation definition to the accepted T12 payload, expectation,
// idle or settle, setup call, hook call and full-state write. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { resolve } from 'node:path';
import {
  ALL, CENTRE, EDGES, OWNERS, SINGLE, STOCK, boxesOf,
} from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { setKey, writeMirrorBytes, writeMode } from './afon_hooks_v8.mjs';
import {
  edgeExpect, expectId, holdAll, mirrorHeadExpect, plantExpect,
} from './expect_v4.mjs';
import { judgeObserved } from './judge_v4.mjs';
import { bringUp, focusApply, focusArgument, lever, markSaf } from './setup_v2.mjs';
import { POSE } from './state_v1.mjs';
import { table } from './table_v2.mjs';

const WRITER_A = [0x11, 0x02, 0x03, 0x00, 0x03, 0x00, 0x03, 0x00, 0x00, 0x00];
const REF = 'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/';
const JOBS = {
  'seed-a': { frameKey: 'a', owner2: WRITER_A, stock: false, k2: false },
  'seed-b': { frameKey: 'b', owner2: SINGLE, stock: false, k2: false },
  k2: { frameKey: 'k2', owner2: ALL, stock: false, k2: true },
  k1: { frameKey: 'k1', owner2: STOCK, stock: true, k2: false },
};

let frames;
function displayRefs() {
  if (frames) return frames;
  const k1eA = JSON.parse(fs.readFileSync(resolve(REF + 'ref-k1e-a.json'), 'utf8'));
  const k1eB = JSON.parse(fs.readFileSync(resolve(REF + 'ref-k1e-b.json'), 'utf8'));
  const k2 = JSON.parse(fs.readFileSync(resolve(REF + 'ref-k2.json'), 'utf8'));
  frames = {
    k1eA,
    k2,
    frames: {
      a: k1eA.frame,
      b: k1eB.frame,
      k2: null,
      k1: { marks: CENTRE, pixels: 444, n31: 444 },
    },
  };
  return frames;
}

function asFrame(spec) {
  const boxes = spec.boxes || boxesOf(spec.marks || []);
  const body = { boxes, pixels: spec.pixels, n31: spec.n31 };
  return { ...body, sha256: createHash('sha256').update(JSON.stringify(body)).digest('hex') };
}

function setupSuffix(op) {
  const id = String(op.stepId || op.id);
  for (const name of ['focus-1712', 'focus-289', 'focus-arg', 'bring-up', 'lever']) {
    if (id.endsWith(name)) return name;
  }
  return null;
}

function flagFor(op, opts) {
  if (opts && opts.setupFlag != null && setupSuffix(op) === 'bring-up' && op.role !== 'display') return opts.setupFlag;
  let n = 0;
  const id = String(op.id);
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 1)) % 251;
  return n;
}

function edgeBody(op) {
  const job = JOBS[op.jobId];
  if (!job) throw new Error('display job ' + op.jobId);
  const refs = displayRefs();
  const ownerExpect = job.stock ? 255 : OWNERS[op.edgeIndex];
  const frameSpec = job.k2
    ? refs.k2.edges[op.edgeIndex]
    : (ownerExpect === 2 ? refs.frames[job.frameKey] : (job.stock ? refs.frames.k1 : refs.k2.edges[op.edgeIndex]));
  const targetExpect = ownerExpect === 2 ? job.owner2 : (job.stock ? STOCK : ALL);
  const frame = asFrame(frameSpec);
  const expect = edgeExpect(ownerExpect, targetExpect, frame);
  const bound = refs.k1eA.boundMs;
  return { expect, frame, bound, key: EDGES[op.edgeIndex][0], dir: EDGES[op.edgeIndex][1] };
}

const stepsById = new Map(table.steps.map((step) => [step.id, step]));

export function prepare(op, session) {
  const body = {
    id: op.id,
    key: op.key,
    dir: op.dir,
    idleMs: op.idleMs,
    expectationSource: op.expectationSource,
    requireFrame: op.requireFrame,
    afContext: op.afContext,
    identity: op.identity,
    pose: op.pose,
    poseName: op.poseName,
    setterKey: op.setterKey,
    index: op.index,
    value: op.value,
    bytes: op.bytes,
    action: op.action,
    role: op.role,
    stepId: op.stepId,
    tableStepId: op.tableStepId,
    phase: op.phase,
    jobId: op.jobId,
    group: op.group,
  };
  if (op.expectationSource === 'declared') body.expect = expectId(op.id);
  else if (op.expectationSource === 'hold') body.expect = holdAll();
  else if (op.expectationSource === 'edge') {
    const edge = edgeBody(op);
    body.expect = edge.expect;
    body.key = edge.key;
    body.dir = edge.dir;
    body.frame = () => edge.frame;
    body.settle = () => {
      const cap = session.ctx.l.lab_time() + edge.bound * 1e6;
      while (session.ctx.l.lab_time() < cap) session.idle(25);
    };
  }
  if (op.group === 'table' && op.tableStepId) {
    const step = stepsById.get(op.tableStepId);
    body.check = (_before, after) => judgeObserved(op.role, step, after, op.phase);
  }
  return body;
}

export function deliver(session, body) {
  const opts = session.opts || {};
  if (body.group === 'setup' && body.role === 'display' && setupSuffix(body) === 'bring-up') session.resetPaint();
  if (body.expectationSource === 'plant') {
    body.expect = plantExpect(session.last, body.setterKey, body.index, body.value);
  } else if (body.expectationSource === 'mirror') {
    body.expect = mirrorHeadExpect(session.last, body.bytes);
  }
  runApi(session, body);
  if (body.expectationSource === 'sealed-delta') {
    session.writeByte(0xa031eef7, flagFor(body, opts) & 255);
  } else if (body.expect && body.expect.named) {
    session.writeNamed(body.expect.named);
  }
  if (body.pose != null) session.writeU32(POSE, body.pose);
  if (opts.fault && opts.fault.id === body.id) session.writeByte(0xa031eef7, opts.fault.flag & 255);
}

function runApi(session, body) {
  const ctx = session.ctx;
  const suffix = setupSuffix(body);
  if (body.action === 'setup') {
    if (suffix === 'bring-up') bringUp(ctx);
    else if (suffix === 'lever') lever(ctx);
    else if (suffix === 'focus-arg') session.argument = focusArgument(ctx);
    else if (suffix === 'focus-289') focusApply(ctx, session.modelMod, 289, session.argument || 0);
    else if (suffix === 'focus-1712') {
      focusApply(ctx, session.modelMod, 1712, 0);
      markSaf(ctx);
    } else throw new Error('setup ' + body.id);
    return;
  }
  if (body.action === 'key') {
    ctx.s.key(body.key, body.dir);
    ctx.key(body.key, body.dir);
    return;
  }
  if (body.action === 'dial') {
    ctx.s['dial_' + 'input']('main', 1);
    ctx.s.camapp.pump();
    return;
  }
  if (body.action === 'pose') {
    if (session.hooks && session.hooks.armWatches) session.hooks.armWatches(body.id);
    session.pose.setPose(body.poseName || 'landscape');
    session.pose.deliver();
    if (session.hooks && session.hooks.drainWatches) session.hooks.drainWatches();
    if (session.hooks && session.hooks.refresh) session.hooks.refresh();
    return;
  }
  if (body.action === 'enter') {
    if (session.hooks && session.hooks.enter) {
      session.writeByte(0xa031eef7, 0);
      session.hooks.enter();
    }
    return;
  }
  if (body.action === 'set') {
    if (body.setterKey != null) setKey(ctx, body.setterKey, body.index || 0, body.value || 0);
    else ctx.press();
    return;
  }
  if (body.action === 'mode') {
    writeMode(ctx, body.value || 0);
    return;
  }
  if (body.action === 'mirror') {
    writeMirrorBytes(ctx, body.bytes || []);
    return;
  }
  if (body.action === 'check') {
    ctx.press();
    return;
  }
  throw new Error('action ' + body.action + ' ' + body.id);
}
