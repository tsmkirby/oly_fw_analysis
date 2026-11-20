// T8d zone sweep, one emulator process. K1e is the overlay S1 reference.
// The candidate uses the accepted T8c reader. No behaviour change is added here.
// K1e rows are hashed before the candidate session starts. Stop at the first failed assertion.
// EMULATOR-ONLY. Do not edit after this runs.
// Usage: node26 work/scripts/sweep_t8d1.mjs om-emu
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { titleBand } from '../../ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs';
import { installCombined, EXT, MODE, readGetter, setKey } from './hook_t8d_read.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/sweep_t8d1.mjs om-emu\n');
  process.exit(2);
}
const tag = 'sweep-t8d2';
const outJsonl = resolve('work/out/' + tag + '.jsonl');
const sealPath = resolve('work/out/' + tag + '-k1e-seal.json');
if (existsSync(outJsonl) || existsSync(sealPath)) {
  process.stderr.write('refusing to overwrite sweep output\n');
  process.exit(2);
}
mkdirSync(resolve('work/out'), { recursive: true });
const lines = [];
const log = (row) => {
  lines.push(JSON.stringify(row));
  writeFileSync(outJsonl, lines.join('\n') + '\n');
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: (row.problems || []).slice(0, 8) }));
};
const sha = (bytes) => createHash('sha256').update(Buffer.from(bytes)).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const RESET = {
  k99a1: [2, 0, 2, 0, 2, 0, 5, 5],
  k9a41: [0, 1],
  k5962: [526, 526, 526, 526, 526, 526],
  k1dd1: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  k84d1: [3],
  k88b2: [526],
  k1df1: [1, 1, 1, 1, 0, 0, 0, 0],
  k5a11: [1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1],
};
const WIDTH = { k5962: 2, k88b2: 2 };
const LIVE = {
  k99a1: [0x6295946c, 8, 1], k9a41: [0x62959484, 2, 1], k5962: [0x62920bf0, 6, 2],
  k1dd1: [0x62920982, 10, 1], k84d1: [0x62920fa5, 1, 1], k88b2: [0x629526c0, 1, 2],
  k1df1: [0x62920994, 8, 1], k1e01: [0xa33f0000, 0, 1], k5a11: [0x62920c18, 11, 1],
};
const WRITER = 0x609b3c79;
const WRITER_RET = 0x609b3d6d;
const ADJUST = 0x609832f5;
const CALLS = [0x609b3c82, 0x609b3c92, 0x609b3ca3, 0x609b3cb6, 0x609b3cc9, 0x609b3cd9, 0x609b3ce7];
const RETS = [0x609b3c89, 0x609b3c99, 0x609b3caa, 0x609b3cbd, 0x609b3cd0, 0x609b3ce0, 0x609b3cee];
const CALL_NAME = ['0x9a41', '0x1dd1', '0x1dd1', '0x84d1', '0x88b2', '0x1df1', '0x1e01'];
const plan = [];
const k1eRows = [];

function liveCells(ctx) {
  const out = {};
  for (const [name, spec] of Object.entries(LIVE)) {
    if (spec[1] === 0) {
      out[name] = [readGetter(ctx, 0x1e01, 0)];
      continue;
    }
    out[name] = [];
    for (let i = 0; i < spec[1]; i++) {
      const b = ctx.l.sim.read(spec[0] + i * spec[2], spec[2]);
      out[name].push(spec[2] === 2 ? b[0] | (b[1] << 8) : b[0]);
    }
  }
  return out;
}
function readU8(ctx, addr) { return ctx.l.sim.read(addr, 1)[0]; }
function readBlock(ctx, addr, n) { return Array.from(ctx.l.sim.read(addr, n)); }
function identityNow(ctx) {
  const view = ctx.screen();
  return {
    title: view && view.frame ? titleBand(view.frame) : null,
    highlight: view && view.highlight != null ? view.highlight : null,
    texts: view && view.texts ? view.texts.slice(0, 12) : [],
    screen: ctx.s.screen(),
  };
}
function diffBytes(a, b) {
  const out = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) out.push({ off: i, k1e: a[i], candidate: b[i] });
  return out;
}

function watchWriter(ctx) {
  const l = ctx.l;
  const st = { depth: 0, entries: 0, adjust: 0, calls: [], rets: [] };
  const arm = () => st.depth > 0;
  l.observe(ctx.native(WRITER), () => { st.depth += 1; st.entries += 1; st.calls = []; st.rets = []; }, 'obs-writer-entry-t8d1');
  l.observe(ctx.native(WRITER_RET), () => { if (st.depth > 0) st.depth -= 1; }, 'obs-writer-ret-t8d1');
  l.observe(ctx.native(ADJUST), () => { if (arm()) st.adjust += 1; }, 'obs-writer-adjust-t8d1');
  CALLS.forEach((addr, i) => {
    l.observe(ctx.native(addr), (_lab, r) => {
      if (!arm()) return;
      st.calls.push({ name: CALL_NAME[i], at: '0x' + addr.toString(16), key: r.d0 & 0xffff, index: r.d1 & 0xffff });
    }, 'obs-writer-call-t8d1-' + i);
  });
  RETS.forEach((addr, i) => {
    l.observe(ctx.native(addr), (_lab, r) => {
      if (!arm()) return;
      st.rets.push({ name: CALL_NAME[i], at: '0x' + addr.toString(16), value: r.d0 & 0xffff });
    }, 'obs-writer-value-t8d1-' + i);
  });
  return st;
}

function press(ctx, key) {
  ctx.key(key, 'down');
  ctx.idle(80);
  let subject = readGetter(ctx, 0x1e71, 0);
  if (subject !== 0) throw new Error('0x1e71[0]=' + subject + ' after ' + key + ' down');
  ctx.key(key, 'up');
  ctx.idle(400);
  subject = readGetter(ctx, 0x1e71, 0);
  if (subject !== 0) throw new Error('0x1e71[0]=' + subject + ' after ' + key + ' up');
}
function dial(ctx, n) {
  ctx.s.dial_input('main', n);
  ctx.s.camapp.pump();
  ctx.idle(400);
  const subject = readGetter(ctx, 0x1e71, 0);
  if (subject !== 0) throw new Error('0x1e71[0]=' + subject + ' after dial');
}
function edge(ctx, key, dir) {
  ctx.key(key, dir);
  ctx.idle(dir === 'down' ? 80 : 400);
  const subject = readGetter(ctx, 0x1e71, 0);
  if (subject !== 0) throw new Error('0x1e71[0]=' + subject + ' after ' + key + ' ' + dir);
}

function snapMeasure(ctx, id, watch, role) {
  const cells = liveCells(ctx);
  const target = Array.from(ctx.readTarget());
  const halfTarget = readBlock(ctx, 0xa33f2ce0, 10);
  const row = {
    id,
    role,
    zone0: cells.k99a1[0],
    cells,
    target,
    halfTarget,
    targetSha: sha(target),
    halfSha: sha(halfTarget),
    writerEntries: watch.entries,
    adjust: watch.adjust,
    calls: watch.calls.slice(),
    rets: watch.rets.slice(),
    flagBe: readU8(ctx, 0xa33f2cbe),
    shadow: readBlock(ctx, 0xa33d4a94, 8),
    mirror: readBlock(ctx, EXT, 55),
    owner: ctx.readOwn()[4],
  };
  return row;
}

async function session(role, menuMod, modelMod) {
  const hooksOn = role === 'candidate';
  const nv = 'work/out/nvram-' + tag + '-' + role + '.json';
  const result = await runZone({
    checkout,
    outPath: 'work/out/session-' + tag + '-' + role + '.jsonl',
    tag: tag + '-' + role,
    candidate: true,
    help: true,
    rowLabel: true,
    fatalShots: true,
    nvramPath: nv,
    overlayCsv: 'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv',
    explanation: hooksOn
      ? 'Candidate. Accepted T8c reader, mirror seeded by the same editor keys. EMULATOR-ONLY. Role: behaviour.'
      : 'K1e. Overlay S1 reference. Reader hook absent, mirror unset. EMULATOR-ONLY. Role: behaviour.',
    change: hooksOn ? 'EMULATOR-ONLY T8c reader. Role: behaviour.' : 'none',
    async drive(ctx) {
      const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
      const watch = watchWriter(ctx);
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
      const before = liveCells(ctx);
      for (const [name, expect] of Object.entries(RESET)) {
        if (!same(before[name], expect)) throw new Error(role + ' fresh ' + name + ' ' + JSON.stringify(before[name]));
      }
      setKey(ctx, 0x1db1, 0, 1);
      setKey(ctx, 0x1dc1, 0, 1);
      ctx.emit('behaviour', { step: 'link-on', label: 'EMULATOR-ONLY test setup. Setter writes 0x1db1[0]=1 and 0x1dc1[0]=1. Role: test setup.' });
      if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) throw new Error('link did not read back');
      if (hooks) hooks.refresh();
      const runSteps = (steps) => {
        for (const step of steps) {
          if (step.op === 'up') {
            if (hooks && readU8(ctx, MODE) !== 1) hooks.enter();
            press(ctx, 'up');
          }
          else if (step.op === 'ok') press(ctx, 'ok');
          else if (step.op === 'dial') dial(ctx, step.n);
          else if (step.op === 'set') {
            setKey(ctx, step.key, step.index, step.value);
            ctx.emit('behaviour', { step: 'offer-custom', label: 'EMULATOR-ONLY test setup. 0x5a11[5]=1 so the direct dial can reach custom 1. Role: test setup.' });
          } else throw new Error('bad step ' + step.op);
        }
      };
      const measure = (id, kind) => {
        const ident = identityNow(ctx);
        if (!ident.title) throw new Error(role + ' ' + id + ' has no title identity');
        ctx.shot(id + '-id');
        const writerBefore = watch.entries;
        const adjustBefore = watch.adjust;
        const shotEdge = (key) => {
          const calls = [];
          const rets = [];
          const beforeE = watch.entries;
          const beforeA = watch.adjust;
          edge(ctx, key, 'down');
          calls.push(...watch.calls);
          rets.push(...watch.rets);
          const down = snapMeasure(ctx, id, watch, role);
          down.writerDelta = watch.entries - beforeE;
          down.adjustDelta = watch.adjust - beforeA;
          down.calls = calls;
          down.rets = rets;
          edge(ctx, key, 'up');
          const up = snapMeasure(ctx, id + '-up', watch, role);
          return { down, up };
        };
        let pair;
        if (kind === 's1') pair = shotEdge('s1');
        else {
          if (hooks) hooks.refresh();
          pair = shotEdge('afon');
        }
        const row = pair.down;
        row.release = { target: pair.up.target, halfTarget: pair.up.halfTarget, writerDelta: pair.up.writerDelta };
        row.identity = ident;
        row.writerDelta = pair.down.writerDelta;
        row.adjustDelta = pair.down.adjustDelta;
        row.kind = kind;
        if (kind === 's1' && row.writerDelta < 1) throw new Error(role + ' ' + id + ' writer was not entered');
        ctx.shot(id + '-' + kind);
        log({ id: role + '-' + id, pass: true, problems: [], zone0: row.zone0, target: row.target, targetSha: row.targetSha, writerDelta: row.writerDelta, calls: row.calls, rets: row.rets, flagBe: row.flagBe, adjustDelta: row.adjustDelta });
        return row;
      };
      if (role === 'k1e') {
        const seen = new Set();
        const take = (steps, id) => {
          runSteps(steps);
          const cells = liveCells(ctx);
          const sig = cells.k99a1.join(',');
          const ident = identityNow(ctx);
          if (seen.has(sig)) {
            press(ctx, 'ok');
            return false;
          }
          seen.add(sig);
          ctx.shot(id + '-editor');
          press(ctx, 'ok');
          const row = measure(id, 's1');
          row.signature = sig;
          row.nav = steps;
          plan.push({ id, steps, signature: sig, identity: ident, targetSha: row.targetSha });
          k1eRows.push(row);
          return true;
        };
        if (!take([{ op: 'up' }], 'z0')) throw new Error('reset zone was not recorded');
        for (let i = 1; i < 14; i++) {
          const id = 'z' + i;
          const steps = [{ op: 'up' }, { op: 'dial', n: 1 }];
          if (!take(steps, id)) break;
        }
        // One custom size. Stock reset leaves CUSTOM_1 off, so the dial does not offer it.
        setKey(ctx, 0x5a11, 5, 1);
        ctx.emit('behaviour', { step: 'offer-custom', label: 'EMULATOR-ONLY test setup. 0x5a11[5]=1 so the direct dial can reach custom 1. Role: test setup.' });
        let found = false;
        const customSteps = [{ op: 'set', key: 0x5a11, index: 5, value: 1 }];
        for (let i = 0; i < 14 && !found; i++) {
          press(ctx, 'up');
          dial(ctx, 1);
          customSteps.push({ op: 'up' }, { op: 'dial', n: 1 });
          const zone0 = liveCells(ctx).k99a1[0];
          if (zone0 === 6) {
            const ident = identityNow(ctx);
            ctx.shot('custom-editor');
            press(ctx, 'ok');
            const row = measure('custom', 's1');
            row.signature = 'custom';
            plan.push({ id: 'custom', steps: customSteps.slice(), signature: '6', identity: ident, targetSha: row.targetSha });
            k1eRows.push(row);
            found = true;
          } else {
            press(ctx, 'ok');
            customSteps.push({ op: 'ok' });
          }
        }
        if (!found) log({ id: 'k1e-custom', pass: true, problems: ['custom zone 6 not reached by the dial'], boundary: true });
        const seal = {
          rows: k1eRows.map((row) => ({
            id: row.id, zone0: row.zone0, target: row.target, targetSha: row.targetSha,
            halfTarget: row.halfTarget, halfSha: row.halfSha, calls: row.calls, rets: row.rets,
            flagBe: row.flagBe, adjustDelta: row.adjustDelta, writerDelta: row.writerDelta, cells: row.cells,
          })),
        };
        writeFileSync(sealPath, JSON.stringify(seal, null, 2));
        for (const row of seal.rows) {
          if (sha(row.target) !== row.targetSha) throw new Error('seal drift ' + row.id);
        }
        log({ id: 'k1e-seal', pass: true, problems: [], zones: seal.rows.map((r) => ({ id: r.id, zone0: r.zone0, targetSha: r.targetSha })) });
      } else {
        const sealed = JSON.parse(readFileSync(sealPath, 'utf8'));
        for (const item of plan) {
          if (hooks && readU8(ctx, MODE) === 1) throw new Error('flag still set before ' + item.id);
          if (hooks) hooks.enter();
          // Keep the custom offer visible to the hooked getter as well as the live cell.
          if (item.id === 'custom') {
            setKey(ctx, 0x5a11, 5, 1);
            ctx.l.sim.write(0x62920c18 + 5, Buffer.from([1]));
            ctx.l.sim.write((EXT + 0x2c + 5) >>> 0, Buffer.from([1]));
            ctx.emit('behaviour', { step: 'offer-custom-mirror', label: 'EMULATOR-ONLY test setup. Live and mirror 0x5a11[5]=1 so the direct dial can reach custom 1. Role: test setup.' });
          }
          runSteps(item.steps.filter((step) => step.op !== 'set'));
          const ident = identityNow(ctx);
          const want = item.identity;
          const problems = [];
          if (ident.title !== want.title) problems.push('title');
          if (!same(ident.highlight, want.highlight)) problems.push('highlight');
          if (ident.screen !== want.screen) problems.push('screen ' + ident.screen);
          if (problems.length) {
            log({ id: 'candidate-' + item.id + '-identity', pass: false, problems, got: ident, want });
            throw new Error('candidate ' + item.id + ' identity ' + problems.join(','));
          }
          press(ctx, 'ok');
          const row = measure(item.id, 'afon');
          const k1e = sealed.rows.find((r) => r.id === item.id);
          if (sha(k1e.target) !== k1e.targetSha) throw new Error('k1e seal drift ' + item.id);
          const delta = diffBytes(k1e.target, row.target);
          row.k1eTarget = k1e.target;
          row.k1eSha = k1e.targetSha;
          row.delta = delta;
          log({
            id: 'compare-' + item.id, pass: true, problems: [], zone0: row.zone0,
            k1e: k1e.target, candidate: row.target, delta, k1eSha: k1e.targetSha,
          });
        }
      }
    },
  });
  if (!result.ok) throw new Error(role + ' ' + result.failed);
}

const menuMod = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
const modelMod = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
let failed = null;
try {
  await session('k1e', menuMod, modelMod);
  await session('candidate', menuMod, modelMod);
  log({ id: tag + '-done', pass: true, ok: true, problems: [] });
} catch (e) {
  failed = e;
  log({ id: tag + '-done', pass: false, ok: false, problems: [String(e && e.message || e)] });
}
if (failed) process.exit(1);
