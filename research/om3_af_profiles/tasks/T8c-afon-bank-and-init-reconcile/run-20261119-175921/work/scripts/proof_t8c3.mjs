// T8c short proof. One process: K1e, then K2, then one candidate.
// The candidate's reader uses the saved bank the stock editor writes.
// EMULATOR-ONLY. A failed assertion stops the run.
// Usage: node26 work/scripts/proof_t8c3.mjs om-emu work/out/proof-table.json proof1
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { titleBand } from '../../ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs';
import { FACTORY_HALF, packHalf } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { installCombined, EXT, POSE, readGetter, setKey } from './hook_t8c2.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
const [checkout, tablePath, tag] = process.argv.slice(2);
if (!checkout || !tablePath || !tag) {
  process.stderr.write('usage: node26 work/scripts/proof_t8c3.mjs om-emu <table.json> <tag>\n');
  process.exit(2);
}
const table = JSON.parse(readFileSync(resolve(tablePath), 'utf8'));
const outJsonl = resolve('work/out/' + tag + '.jsonl');
if (existsSync(outJsonl)) {
  process.stderr.write('refusing to overwrite ' + outJsonl + '\n');
  process.exit(2);
}
mkdirSync(resolve('work/out'), { recursive: true });
const lines = [];
const log = (row) => {
  lines.push(JSON.stringify(row));
  writeFileSync(outJsonl, lines.join('\n') + '\n');
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: (row.problems || []).slice(0, 4) }));
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const RESET = {
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
const STOCK = [14, 2, 2, 0, 27, 0, 39, 0, 0, 0];
const recorded = { k1e: {}, k2: {}, candidate: {} };

function u16(bytes, at) { return bytes[at] | (bytes[at + 1] << 8); }
function mirrorPos(ctx, bank) { return u16(ctx.l.sim.read(EXT + 0x0a + bank * 2, 2), 0); }
function mirrorZone(ctx, bank) { return ctx.l.sim.read(EXT + bank, 1)[0]; }

function halfOf(ctx) {
  const live = {
    k99a1: 0x6295946c, k9a41: 0x62959484, k5962: 0x62920bf0, k1dd1: 0x62920982,
    k84d1: 0x62920fa5, k88b2: 0x629526c0, k90d1: 0x62959355, k5a11: 0x62920c18,
    k1de1: 0x6292098c, k1df1: 0x62920994,
  };
  const width = { k5962: 2, k88b2: 2 };
  const out = {};
  for (const [name, addr] of Object.entries(live)) {
    const n = RESET[name].length;
    const w = width[name] || 1;
    out[name] = [];
    for (let i = 0; i < n; i++) {
      const b = ctx.l.sim.read(addr + i * w, w);
      out[name].push(w === 2 ? b[0] | (b[1] << 8) : b[0]);
    }
  }
  out.k1db1 = [readGetter(ctx, 0x1db1, 0)];
  out.k1dc1 = [readGetter(ctx, 0x1dc1, 0)];
  return out;
}

function snap(ctx, step) {
  const view = ctx.screen();
  const frame = view && view.frame;
  const own = ctx.readOwn();
  return {
    screen: ctx.s.screen(),
    title: frame ? titleBand(frame) : null,
    highlight: view ? view.highlight : null,
    half: halfOf(ctx),
    target: ctx.readTarget(),
    halfTarget: Array.from(ctx.l.sim.read(0xa33f2ce0, 10)),
    owner: own[4],
    subject: readGetter(ctx, 0x1e71, 0),
    mirror: Array.from(ctx.l.sim.read(EXT, 55)),
    bankPos: mirrorPos(ctx, step.bank),
    bankZone: mirrorZone(ctx, step.bank),
    poseWord: ctx.l.sim.u32(POSE) >>> 0,
  };
}

function identityOrThrow(ctx, step) {
  if (!step.identity) return;
  const view = ctx.screen();
  const title = view && view.frame ? titleBand(view.frame) : null;
  const screen = ctx.s.screen();
  const problems = [];
  if (screen !== step.identity.screen) problems.push('screen ' + screen);
  if ((view && view.highlight) !== step.identity.highlight) problems.push('highlight ' + (view && view.highlight));
  if (title !== step.identity.title) problems.push('title ' + title);
  if (problems.length) throw new Error('identity ' + step.id + ' ' + problems.join('; '));
}

const previous = { k1e: null, k2: null, candidate: null };
function runStep(ctx, step, hooks, pose, role) {
  const seq = [];
  const edge = (key, dir) => {
    ctx.key(key, dir);
    ctx.idle(dir === 'down' ? 80 : 400);
    seq.push({ key, dir });
    const subject = readGetter(ctx, 0x1e71, 0);
    if (subject !== 0) throw new Error('0x1e71[0]=' + subject + ' after ' + key + ' ' + dir);
  };
  if (step.action === 'enter') {
    if (!hooks) throw new Error('enter without the candidate ' + step.id);
    hooks.enter();
    ctx.idle(200);
  } else if (step.action === 'pose') {
    pose.setPose(step.key);
    pose.deliver();
    ctx.idle(600);
    ctx.emit('behaviour', { step: step.id, label: 'EMULATOR-ONLY test setup. pose.mjs stand-in. Role: test setup.' });
    if (hooks) hooks.refresh();
  } else if (step.action === 'key') {
    if (step.exit) identityOrThrow(ctx, step);
    edge(step.key, 'down');
    edge(step.key, 'up');
    if (!step.exit && step.identity) identityOrThrow(ctx, step);
  } else if (step.action === 'edge') {
    if (hooks) hooks.refresh();
    edge(step.key, step.dir);
  } else throw new Error('bad action ' + step.action);
  if (step.exitSeq && !same(seq, step.exitSeq)) {
    throw new Error(step.id + ' sequence ' + JSON.stringify(seq) + ' declared ' + JSON.stringify(step.exitSeq));
  }
  ctx.shot(role + '-' + step.id);
  const actual = snap(ctx, step);
  const problems = [];
  if (actual.subject !== 0) problems.push('subject ' + actual.subject);
  if (actual.poseWord !== step.pose) problems.push('pose word ' + actual.poseWord);
  if (step.expect && step.expect.mirrorFactory && !same(actual.mirror, packHalf(FACTORY_HALF))) problems.push('mirror is not the Q2 reset image');
  if (step.expect && step.expect.bankCell) {
    if (role === 'k1e') {
      const prior = previous[role] ? previous[role].half.k5962 : RESET.k5962;
      const changed = actual.half.k5962.map((v, i) => v !== prior[i] ? i : -1).filter((i) => i >= 0);
      if (!changed.includes(step.bank)) problems.push('editor did not write k5962[' + step.bank + '] now ' + JSON.stringify(actual.half.k5962));
      if (changed.some((i) => i !== step.bank)) problems.push('editor wrote banks ' + JSON.stringify(changed));
    }
    if (role === 'candidate') {
      const want = recorded.k1e[step.id] && recorded.k1e[step.id].half.k5962[step.bank];
      if (actual.bankPos !== want) problems.push('mirror bank ' + step.bank + ' ' + actual.bankPos + ' k1e ' + want);
      if (actual.bankZone !== step.expect.zone) problems.push('mirror zone ' + actual.bankZone);
    }
  }
  if (step.expect && step.expect.positionFrom) {
    const from = recorded.k1e[step.expect.positionFrom.slice(4)];
    const want = from.half.k5962[step.bank];
    const got = actual.target[0] | (actual.target[1] << 8);
    if (got !== want) problems.push('position ' + got + ' bank ' + want);
    if (step.expect.small) {
      const lo = want & 255, hi = (want >> 8) & 255;
      const halfPress = [lo, hi, 3, 0, 3, 0, 3, 0, 0, 0];
      const converter = [lo, hi, 3, 0, 1, 0, 1, 0, 0, 0];
      if (!same(actual.target, halfPress) && !same(actual.target, converter)) problems.push('target ' + JSON.stringify(actual.target));
      if (actual.target[4] === 27 || actual.target[6] === 39) problems.push('stale All target');
    }
  }
  if (step.expect && step.expect.releaseFrom) {
    const from = recorded.k1e[step.expect.releaseFrom.slice(4)];
    if (!same(actual.target, from.target)) problems.push('release target ' + JSON.stringify(actual.target));
    if (!same(from.target, STOCK)) problems.push('K1e target is not the stock half-press record');
  }
  if (step.expect && step.expect.owner != null && actual.owner !== step.expect.owner) problems.push('owner ' + actual.owner);
  if (role === 'candidate' && step.expect && step.expect.halfFrom) {
    const from = recorded.k2[step.expect.halfFrom.slice(3)];
    if (!from) problems.push('missing K2 ' + step.expect.halfFrom);
    else if (!same(actual.halfTarget, from.halfTarget)) problems.push('halfTarget ' + JSON.stringify(actual.halfTarget) + ' k2 ' + JSON.stringify(from.halfTarget));
  }
  recorded[role][step.id] = actual;
  previous[role] = actual;
  log({ id: role + '-' + step.id, role, pass: problems.length === 0, problems, sequence: seq, bank: step.bank, actual });
  if (problems.length) throw new Error(role + '-' + step.id + ' ' + problems.join('; '));
}

async function session(role, menuMod, modelMod) {
  const overlay = role !== 'k1e';
  const hooksOn = role === 'candidate';
  const nv = 'work/out/nvram-' + tag + '-' + role + '.json';
  if (existsSync(resolve(nv)) || existsSync(resolve('work/out/session-' + tag + '-' + role + '.jsonl'))) {
    throw new Error('refusing to overwrite ' + role);
  }
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-' + tag + '-' + role + '.jsonl',
    tag: tag + '-' + role,
    candidate: overlay,
    help: overlay,
    rowLabel: overlay,
    fatalShots: true,
    nvramPath: nv,
    overlayCsv: overlay ? 'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv' : null,
    explanation: hooksOn
      ? 'Candidate. Profile read uses the saved bank the stock editor writes. EMULATOR-ONLY. Role: behaviour.'
      : (overlay ? 'K2. Combined overlay, no hooks, flag off. EMULATOR-ONLY. Role: behaviour.' : 'K1e. Stock. No overlay.'),
    change: hooksOn ? 'EMULATOR-ONLY reader bank. Role: behaviour.' : 'none',
    async drive(ctx) {
      const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
      const pose = attachPose(ctx.l);
      ctx.bringUp();
      ctx.emit('behaviour', { step: 'bring-up', label: 'EMULATOR-ONLY T8 bring-up and TAKE_FOCUS. Role: test setup.' });
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(400);
      const { A } = modelMod;
      const api = A(0x50ac4afe);
      const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
      ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
      ctx.idle(300);
      ctx.emit('behaviour', { step: 's-af', label: 'EMULATOR-ONLY test setup. S-AF through the public focus API. Role: test setup.' });
      pose.setPose('landscape');
      pose.deliver();
      ctx.idle(500);
      const before = halfOf(ctx);
      for (const [name, expect] of Object.entries(RESET)) {
        if (!same(before[name], expect)) throw new Error(role + ' fresh ' + name + ' ' + JSON.stringify(before[name]));
      }
      setKey(ctx, 0x1db1, 0, 1);
      setKey(ctx, 0x1dc1, 0, 1);
      ctx.emit('behaviour', { step: 'link-on', label: 'EMULATOR-ONLY test setup. Setter writes 0x1db1[0]=1 and 0x1dc1[0]=1. Q1 measured the same banks from native keys. Role: test setup.' });
      if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) throw new Error('link did not read back');
      if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('subject before steps');
      if (hooks) hooks.refresh();
      for (const step of table.steps) {
        if (!step.who.includes(role)) continue;
        runStep(ctx, step, hooks, pose, role);
      }
    },
  });
  if (!result.ok) throw new Error(role + ' ' + result.failed);
}

const menuMod = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
const modelMod = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
let failed = null;
try {
  for (const role of ['k1e', 'k2', 'candidate']) await session(role, menuMod, modelMod);
  log({ id: tag + '-done', pass: true, ok: true, problems: [] });
} catch (e) {
  failed = e;
  log({ id: tag + '-done', pass: false, ok: false, problems: [String(e && e.message || e)] });
}
const imports = [
  'work/scripts/proof_t8c3.mjs',
  'work/scripts/hook_t8c.mjs',
  'ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs',
].map((p) => ({ path: p, sha256: createHash('sha256').update(readFileSync(resolve(p))).digest('hex') }));
writeFileSync(resolve('work/out/' + tag + '-imports.json'), JSON.stringify(imports, null, 2) + '\n');
if (failed) process.exitCode = 1;
