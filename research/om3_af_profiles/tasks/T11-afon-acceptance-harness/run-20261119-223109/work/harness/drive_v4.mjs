// T11 acceptance driver. Identity mode records title hashes. Proof mode refuses a
// commit that is not in the sealed table. Every key, dial, pose and setter goes
// through the gate, which then asserts the full state. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { titleBand } from '../../ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { bindWriterSetter, installCombined, readGetter } from './afon_hooks_v4.mjs';
import { createGate } from './gate_v1.mjs';
import { commitDecision, loadSealed, rowKey } from './identity_v1.mjs';
import { judge, judgeDown, RESET } from './judge_v2.mjs';
import { captureState, same, structuralProblems } from './state_v1.mjs';
import { assertClean } from './static_check_v4.mjs';
import { table } from './table_v1.mjs';

const OVERLAY = 'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv';
const stepOrder = table.steps.map((s) => s.id);

function sha(bytes) {
  return createHash('sha256').update(Buffer.from(bytes)).digest('hex');
}

function identityNow(ctx) {
  const view = ctx.screen();
  return {
    title: view && view.frame ? titleBand(view.frame) : null,
    highlight: view ? view.highlight : null,
    screen: ctx.s.screen(),
  };
}

function decorate(ctx, actual, step, reads) {
  const own = ctx.readOwn();
  actual.edge = { status: own[5], enabled: own[6] };
  actual.halfBank = { zone: actual.half.k99a1[step.bank], pos: actual.half.k5962[step.bank] };
  actual.bank = step.bank;
  const banks = (reads || []).filter((r) => r.kind === 'zone' || r.kind === 'pos').map((r) => r.bank);
  actual.readCount = banks.length;
  actual.readBank = banks.length && banks.every((b) => b === banks[0]) ? banks[0] : null;
  actual.staticT6Bank = step.pose === 2 ? 5 : step.pose === 4 ? 3 : 1;
  return actual;
}

export async function main({ mode, tag }) {
  if (mode !== 'identity' && mode !== 'proof') throw new Error('mode');
  assertClean();
  if (process.env.OM_EMU_MODEL !== 'E147' || process.env.OM_EMU_NVRAM !== 'off') throw new Error('env');
  const outJsonl = resolve('work/out/' + tag + '.jsonl');
  if (existsSync(outJsonl)) throw new Error('refusing to overwrite ' + outJsonl);
  mkdirSync(resolve('work/out'), { recursive: true });
  const sealed = mode === 'proof'
    ? loadSealed('work/out/identity-t11-v4.json', 'work/out/identity-t11-v4.seal.json')
    : null;
  const lines = [];
  const log = (row) => {
    lines.push(JSON.stringify(row));
    writeFileSync(outJsonl, lines.join('\n') + '\n');
    console.log(JSON.stringify({ id: row.id, pass: row.pass }));
  };
  const recorded = { k1e: {}, k2: {}, candidate: {} };
  const rows = {};
  const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
  let failed = null;
  try {
    log({ id: 'plan', pass: true, problems: [], mode, steps: table.steps.length, identitySha: sealed ? sealed.sha256 : null });
    for (const role of ['k1e', 'k2', 'candidate']) {
      await runRole({ role, mode, tag, sealed, recorded, rows, log, runZone });
    }
    await zonePass({ mode, tag, sealed, rows, log, runZone });
    if (mode === 'identity') {
      const body = { task: 'T11', ok: true, rows };
      writeFileSync(resolve('work/out/identity-t11-v4.json'), JSON.stringify(body, null, 2) + '\n');
    }
    log({ id: tag + '-done', pass: true, ok: true, problems: [] });
  } catch (e) {
    failed = e;
    log({ id: tag + '-done', pass: false, ok: false, problems: [String(e && e.message || e)] });
  }
  if (failed) throw failed;
}

async function runRole({ role, mode, tag, sealed, recorded, rows, log, runZone }) {
  const nv = 'work/out/nvram-' + tag + '-' + role + '.json';
  const sessionPath = 'work/out/session-' + tag + '-' + role + '.jsonl';
  if (existsSync(resolve(nv)) || existsSync(resolve(sessionPath))) throw new Error('refusing to overwrite ' + role);
  const hooksOn = role === 'candidate';
  const result = await runZone({
    checkout: 'om-emu',
    outPath: sessionPath,
    tag: tag + '-' + role,
    candidate: true,
    help: true,
    rowLabel: true,
    fatalShots: true,
    nvramPath: nv,
    overlayCsv: OVERLAY,
    explanation: hooksOn
      ? 'Candidate. Combined hook, self-armed writer, saved-bank feed, pose gate, display hook. EMULATOR-ONLY. Role: behaviour.'
      : (role === 'k2'
        ? 'K2. Combined overlay, no hooks. EMULATOR-ONLY. Role: behaviour.'
        : 'K1e, the overlay S1 reference. Combined overlay, no hooks. EMULATOR-ONLY. Role: behaviour.'),
    change: hooksOn ? 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.' : 'none',
    async drive(ctx) {
      const gate = createGate(ctx);
      const modelMod = await import(pathToFileURL(resolve('om-emu/emu/src/fw/model.mjs')).href);
      const menuMod = await import(pathToFileURL(resolve('om-emu/emu/src/lab/menu.mjs')).href);
      const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
      const pose = attachPose(ctx.l);
      gate.bindPose(pose);
      bindWriterSetter(gate, ctx);
      ctx.bringUp();
      ctx.emit('behaviour', { step: 'bring-up', label: 'EMULATOR-ONLY T8 bring-up and TAKE_FOCUS. Role: test setup.' });
      ctx.s.switch_input('lever', 1);
      ctx.s.camapp.pump();
      ctx.idle(400);
      const api = modelMod.A(0x50ac4afe);
      const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
      ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
      ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
      ctx.idle(300);
      ctx.emit('behaviour', { step: 's-af', label: 'EMULATOR-ONLY test setup. S-AF through the public focus API. Role: test setup.' });
      gate.pose('landscape');
      ctx.idle(500);
      const fresh = captureState(ctx, readGetter, null);
      const freshProblems = structuralProblems(fresh);
      for (const name of Object.keys(RESET)) {
        if (!same(fresh.half[name], RESET[name])) freshProblems.push('fresh ' + name);
      }
      if (freshProblems.length) throw new Error(role + ' fresh ' + freshProblems.join('; '));
      gate.set(0x1db1, 0, 1);
      gate.set(0x1dc1, 0, 1);
      ctx.emit('behaviour', { step: 'link-on', label: 'EMULATOR-ONLY test setup. Setter writes 0x1db1[0]=1 and 0x1dc1[0]=1. Role: test setup.' });
      if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) throw new Error('link did not read back');
      const linked = captureState(ctx, readGetter, null);
      const linkProblems = structuralProblems(linked);
      if (linkProblems.length) throw new Error(role + ' link ' + linkProblems.join('; '));
      if (hooks) hooks.refresh();
      for (const step of table.steps) {
        if (!step.who.includes(role)) continue;
        runStep({ ctx, gate, hooks, step, role, mode, sealed, recorded, rows, log });
      }
      if (hooks) {
        const writer = hooks.counts.writer;
        log({
          id: 'writer-calls', pass: writer === 3, problems: writer === 3 ? [] : ['writer ' + writer],
          writer, skipped: hooks.counts.skipped || 0, refused: hooks.refused.length, pressLog: hooks.pressLog,
        });
        if (writer !== 3) throw new Error('writer calls ' + writer);
      }
    },
  });
  if (!result.ok) throw new Error(role + ' ' + result.failed);
}

function rememberIdentity(mode, sealed, step, role, ident, rows, log) {
  if (!step.commit) return;
  if (mode === 'proof') {
    const decision = commitDecision(sealed, step, ident);
    log({
      id: role + '-' + step.id + '-identity', role, pass: decision.ok, problems: decision.problems || [],
      expected: decision.expected || null, actual: ident, key: decision.key || step.identityFrom,
    });
    if (!decision.ok) throw new Error(role + '-' + step.id + ' identity ' + (decision.problems || []).join('; '));
    return;
  }
  const key = rowKey(step.identityFrom);
  if (key && key.startsWith(role + ':')) rows[key] = ident;
  rows[role + ':' + step.id] = ident;
  log({ id: role + '-' + step.id + '-identity', role, pass: true, problems: [], recorded: key, actual: ident });
}

function runStep({ ctx, gate, hooks, step, role, mode, sealed, recorded, rows, log }) {
  if (step.commit) rememberIdentity(mode, sealed, step, role, identityNow(ctx), rows, log);
  const readFrom = hooks ? hooks.reads.length : 0;
  const seq = [];
  const edge = (key, dir, idleMs) => {
    gate.key(key, dir);
    ctx.idle(idleMs);
    seq.push({ key, dir });
  };
  if (step.action === 'enter') {
    if (!hooks) throw new Error('enter without the candidate ' + step.id);
    if (ctx.l.sim.read(0xa031eef7, 1)[0] === 1) throw new Error('flag still set before ' + step.id);
    hooks.enter();
    ctx.idle(200);
  } else if (step.action === 'pose') {
    if (hooks) hooks.armWatches(step.id);
    gate.pose(step.key);
    ctx.idle(600);
    ctx.emit('behaviour', { step: step.id, label: 'EMULATOR-ONLY test setup. pose.mjs stand-in. Role: test setup.' });
    if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) {
      gate.set(0x1db1, 0, 1);
      gate.set(0x1dc1, 0, 1);
      ctx.emit('behaviour', { step: step.id, label: 'EMULATOR-ONLY test setup. Link setter re-applied after the pose stand-in. Role: test setup.' });
    }
    if (hooks) hooks.refresh();
    if (hooks) {
      const hits = hooks.drainWatches();
      const stores = hits.filter((h) => h.kind === 'store' && h.id !== 'mirror' && h.id !== 'mirrora');
      let leak = [];
      if (step.id === 'pose-after-edit') {
        const mirrorPos = ctx.l.sim.read(0xa031eeb0 + 0x0a, 2);
        const saved = mirrorPos[0] | (mirrorPos[1] << 8);
        leak = stores.filter((h) => h.value === saved);
      }
      const problems = step.id === 'pose-after-edit' ? leak.map((h) => h.id + '=' + h.value) : stores.map((h) => h.id + '@' + h.pc.toString(16));
      log({
        id: role + '-' + step.id + '-watches', pass: problems.length === 0, problems,
        refused: hits.filter((h) => h.kind === 'refused').length, stores: stores.length,
      });
      if (problems.length) throw new Error(role + '-' + step.id + ' live store during pose');
    }
  } else if (step.action === 'key') {
    edge(step.key, 'down', 80);
    const down = decorate(ctx, captureState(ctx, readGetter, null), step, hooks ? hooks.reads.slice(readFrom) : []);
    recorded[role][step.id + '-down'] = down;
    const downProblems = judgeDown(role, step, down, recorded, stepOrder);
    log({ id: role + '-' + step.id + '-down', role, pass: downProblems.length === 0, problems: downProblems, seals: down.seals, actual: down });
    if (downProblems.length) throw new Error(role + '-' + step.id + ' down ' + downProblems.join('; '));
    if (role === 'candidate') recorded.candidate.prevMirror = down.mirror;
    edge(step.key, 'up', 400);
  } else if (step.action === 'edge') {
    if (hooks) hooks.refresh();
    edge(step.key, step.dir, step.dir === 'down' ? 80 : 400);
  } else if (step.action !== 'check') throw new Error('bad action ' + step.action);
  if (step.exitSeq && !same(seq, step.exitSeq)) throw new Error(step.id + ' sequence');
  const reads = hooks ? hooks.reads.slice(readFrom) : [];
  ctx.shot(step.id);
  const actual = decorate(ctx, captureState(ctx, readGetter, null), step, reads);
  const problems = judge(role, step, actual, recorded, stepOrder);
  recorded[role][step.id] = actual;
  if (role === 'candidate') recorded.candidate.prevMirror = actual.mirror;
  log({
    id: role + '-' + step.id, role, pass: problems.length === 0, problems, sequence: seq,
    bank: step.bank, readBank: actual.readBank, seals: actual.seals, actual,
  });
  if (problems.length) throw new Error(role + '-' + step.id + ' ' + problems.join('; '));
}

async function zonePass({ mode, tag, sealed, rows, log, runZone }) {
  const store = { rows: [] };
  const boot = (ctx, gate) => {
    const pose = attachPose(ctx.l);
    gate.bindPose(pose);
    bindWriterSetter(gate, ctx);
    ctx.bringUp();
    ctx.emit('behaviour', { step: 'bring-up', label: 'EMULATOR-ONLY T8 bring-up and TAKE_FOCUS. Role: test setup.' });
    ctx.s.switch_input('lever', 1);
    ctx.s.camapp.pump();
    ctx.idle(400);
    return pose;
  };
  const finishBoot = async (ctx, gate, modelMod) => {
    const api = modelMod.A(0x50ac4afe);
    const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
    ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
    ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
    ctx.idle(300);
    gate.pose('landscape');
    ctx.idle(500);
    const fresh = captureState(ctx, readGetter, null);
    const problems = structuralProblems(fresh);
    for (const name of Object.keys(RESET)) if (!same(fresh.half[name], RESET[name])) problems.push(name);
    if (problems.length) throw new Error('zone fresh ' + problems.join('; '));
    gate.set(0x1db1, 0, 1);
    gate.set(0x1dc1, 0, 1);
    const linked = captureState(ctx, readGetter, null);
    const linkProblems = structuralProblems(linked);
    if (linkProblems.length) throw new Error('zone link ' + linkProblems.join('; '));
  };
  const tap = (ctx, gate, key) => {
    gate.key(key, 'down');
    ctx.idle(80);
    const down = captureState(ctx, readGetter, null);
    const downProblems = structuralProblems(down);
    if (downProblems.length) throw new Error(key + ' down ' + downProblems.join('; '));
    gate.key(key, 'up');
    ctx.idle(400);
    const up = captureState(ctx, readGetter, null);
    const upProblems = structuralProblems(up);
    if (upProblems.length) throw new Error(key + ' up ' + upProblems.join('; '));
    return up;
  };
  const detent = (ctx, gate) => {
    gate.dial();
    ctx.idle(400);
    const actual = captureState(ctx, readGetter, null);
    const problems = structuralProblems(actual);
    if (problems.length) throw new Error('dial ' + problems.join('; '));
    return actual;
  };
  const run = async (role) => {
    const nv = 'work/out/nvram-' + tag + '-' + role + '.json';
    const sessionPath = 'work/out/session-' + tag + '-' + role + '.jsonl';
    if (existsSync(resolve(nv)) || existsSync(resolve(sessionPath))) throw new Error('refusing to overwrite ' + role);
    const hooksOn = role === 'zcand';
    const result = await runZone({
      checkout: 'om-emu',
      outPath: sessionPath,
      tag: tag + '-' + role,
      candidate: true,
      help: true,
      rowLabel: true,
      fatalShots: true,
      nvramPath: nv,
      overlayCsv: OVERLAY,
      explanation: hooksOn
        ? 'Zone candidate. Same combined hook. EMULATOR-ONLY. Role: behaviour.'
        : 'Zone K1e, the overlay S1 reference. EMULATOR-ONLY. Role: behaviour.',
      change: hooksOn ? 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.' : 'none',
      async drive(ctx) {
        const gate = createGate(ctx);
        const modelMod = await import(pathToFileURL(resolve('om-emu/emu/src/fw/model.mjs')).href);
        const menuMod = await import(pathToFileURL(resolve('om-emu/emu/src/lab/menu.mjs')).href);
        const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
        boot(ctx, gate);
        await finishBoot(ctx, gate, modelMod);
        const commitOk = (id) => {
          const ident = identityNow(ctx);
          const step = { id, commit: true, identityFrom: 'k1e:zone-' + id };
          if (mode === 'proof') {
            const decision = commitDecision(sealed, step, ident);
            log({ id: role + '-zone-' + id + '-identity', pass: decision.ok, problems: decision.problems || [], actual: ident });
            if (!decision.ok) throw new Error('zone identity ' + id);
          } else if (!hooksOn) {
            rows['k1e:zone-' + id] = ident;
            log({ id: role + '-zone-' + id + '-identity', pass: true, problems: [], actual: ident });
          } else {
            log({ id: role + '-zone-' + id + '-identity', pass: true, problems: [], actual: ident, recorded: false });
          }
          tap(ctx, gate, 'ok');
          return ident;
        };
        if (!hooksOn) {
          const seen = new Set();
          let dismissN = 0;
          const record = (steps, id) => {
            for (const step of steps) {
              if (step.op === 'dial') detent(ctx, gate);
              else tap(ctx, gate, step.op);
            }
            const zone = captureState(ctx, readGetter, null).half.k99a1.join(',');
            if (seen.has(zone)) { commitOk('dismiss-' + dismissN); dismissN += 1; return false; }
            seen.add(zone);
            const ident = commitOk(id);
            gate.key('s1', 'down');
            ctx.idle(80);
            const press = captureState(ctx, readGetter, null);
            if (press.subject !== 0) throw new Error('subject after s1 down ' + id);
            gate.key('s1', 'up');
            ctx.idle(400);
            const release = captureState(ctx, readGetter, null);
            if (release.subject !== 0) throw new Error('subject after s1 up ' + id);
            store.rows.push({
              id, identity: ident, nav: steps, zone0: Number(zone.split(',')[0]),
              cells: press.half, press: press.target, pressSha: sha(press.target),
              release: release.target, releaseSha: sha(release.target),
            });
            return true;
          };
          if (!record([{ op: 'up' }], 'z0')) throw new Error('reset zone was not recorded');
          for (let i = 1; i < 8; i++) {
            if (!record([{ op: 'up' }, { op: 'dial' }], 'z' + i)) break;
          }
          gate.set(0x5a11, 5, 1);
          ctx.emit('behaviour', { step: 'offer-custom', label: 'EMULATOR-ONLY test setup. 0x5a11[5]=1 so the direct dial can reach custom 1. Role: test setup.' });
          let found = false;
          for (let i = 0; i < 14 && !found; i++) {
            tap(ctx, gate, 'up');
            detent(ctx, gate);
            if (captureState(ctx, readGetter, null).half.k99a1[0] === 6) {
              const ident = commitOk('custom');
              gate.key('s1', 'down');
              ctx.idle(80);
              const press = captureState(ctx, readGetter, null);
              if (press.subject !== 0) throw new Error('subject after custom s1');
              gate.key('s1', 'up');
              ctx.idle(400);
              const release = captureState(ctx, readGetter, null);
              if (release.subject !== 0) throw new Error('subject after custom release');
              store.rows.push({
                id: 'custom', identity: ident, zone0: 6, cells: press.half, seeded: false,
                press: press.target, pressSha: sha(press.target), release: release.target, releaseSha: sha(release.target),
              });
              found = true;
            } else tap(ctx, gate, 'ok');
          }
          if (!found) throw new Error('custom zone 6 was not reached');
        } else {
          for (const row of store.rows.filter((r) => r.id !== 'custom')) {
            if (ctx.l.sim.read(0xa031eef7, 1)[0] === 1) throw new Error('flag still set before ' + row.id);
            hooks.enter();
            for (const step of row.nav) {
              if (step.op === 'dial') detent(ctx, gate);
              else tap(ctx, gate, step.op);
            }
            commitOk(row.id);
            gate.set(0x99a1, 0, row.zone0);
            gate.set(0x84d1, 0, row.cells.k84d1[0]);
            gate.set(0x1dd1, 0, row.cells.k1dd1[0]);
            gate.set(0x1dd1, 1, row.cells.k1dd1[1]);
            gate.set(0x88b2, 0, row.cells.k88b2[0]);
            gate.set(0x5962, 0, row.cells.k88b2[0]);
            gate.set(0x9a41, 0, row.cells.k9a41[0]);
            gate.set(0x1df1, 0, row.cells.k1df1[0]);
            const seeded = captureState(ctx, readGetter, null);
            if (seeded.subject !== 0) throw new Error('subject after zone seed ' + row.id);
            hooks.refresh();
            gate.key('afon', 'down');
            ctx.idle(80);
            const press = captureState(ctx, readGetter, null);
            if (press.subject !== 0) throw new Error('subject after afon down ' + row.id);
            const pressDelta = [];
            for (let i = 0; i < 10; i++) if (press.target[i] !== row.press[i]) pressDelta.push(i);
            log({ id: 'zone-' + row.id + '-press', pass: pressDelta.length === 0, problems: pressDelta.map((i) => '+' + i), k1e: row.press, candidate: press.target });
            if (pressDelta.length) throw new Error('zone press ' + row.id);
            gate.key('afon', 'up');
            ctx.idle(400);
            const release = captureState(ctx, readGetter, null);
            if (release.subject !== 0) throw new Error('subject after afon up ' + row.id);
            const releaseDelta = [];
            for (let i = 0; i < 10; i++) if (release.target[i] !== row.release[i]) releaseDelta.push(i);
            log({ id: 'zone-' + row.id + '-release', pass: releaseDelta.length === 0, problems: releaseDelta.map((i) => '+' + i), k1e: row.release, candidate: release.target });
            if (releaseDelta.length) throw new Error('zone release ' + row.id);
          }
          const custom = store.rows.find((r) => r.id === 'custom');
          if (ctx.l.sim.read(0xa031eef7, 1)[0] === 1) throw new Error('flag still set before custom seed');
          hooks.enter();
          gate.set(0x99a1, 0, custom.zone0);
          gate.set(0x84d1, 0, custom.cells.k84d1[0]);
          gate.set(0x1dd1, 0, custom.cells.k1dd1[0]);
          gate.set(0x1dd1, 1, custom.cells.k1dd1[1]);
          gate.set(0x88b2, 0, custom.cells.k88b2[0]);
          gate.set(0x5962, 0, custom.cells.k88b2[0]);
          gate.set(0x9a41, 0, custom.cells.k9a41[0]);
          gate.set(0x1df1, 0, custom.cells.k1df1[0]);
          ctx.l.sim.write(0xa031eef7, Buffer.from([0]));
          ctx.l.sim.write(0x6031eef7, Buffer.from([0]));
          ctx.emit('behaviour', { step: 'custom-seed', label: 'EMULATOR-ONLY test setup. Custom 1 is seeded from the K1e writer inputs. Role: test setup.' });
          const afterSeed = captureState(ctx, readGetter, null);
          if (afterSeed.subject !== 0) throw new Error('subject after custom seed');
          hooks.refresh();
          gate.key('afon', 'down');
          ctx.idle(80);
          const press = captureState(ctx, readGetter, null);
          if (press.subject !== 0) throw new Error('subject after custom afon');
          const pressDelta = [];
          for (let i = 0; i < 10; i++) if (press.target[i] !== custom.press[i]) pressDelta.push(i);
          log({ id: 'zone-custom-press', pass: pressDelta.length === 0, problems: pressDelta.map((i) => '+' + i), k1e: custom.press, candidate: press.target, seeded: true });
          if (pressDelta.length) throw new Error('zone press custom');
          gate.key('afon', 'up');
          ctx.idle(400);
          const release = captureState(ctx, readGetter, null);
          if (release.subject !== 0) throw new Error('subject after custom release');
          const releaseDelta = [];
          for (let i = 0; i < 10; i++) if (release.target[i] !== custom.release[i]) releaseDelta.push(i);
          log({ id: 'zone-custom-release', pass: releaseDelta.length === 0, problems: releaseDelta.map((i) => '+' + i), k1e: custom.release, candidate: release.target });
          if (releaseDelta.length) throw new Error('zone release custom');
          log({ id: 'zone-writer-calls', pass: true, problems: [], writer: hooks.counts.writer });
        }
      },
    });
    if (!result.ok) throw new Error(role + ' ' + result.failed);
  };
  await run('zk1e');
  const zonePath = resolve('work/out/' + tag + '-zone-k1e.json');
  writeFileSync(zonePath, JSON.stringify({ rows: store.rows }, null, 2) + '\n');
  const zoneSha = createHash('sha256').update(readFileSync(zonePath)).digest('hex');
  log({ id: 'zone-k1e-seal', pass: true, problems: [], sha256: zoneSha, zones: store.rows.map((r) => r.id) });
  await run('zcand');
}
