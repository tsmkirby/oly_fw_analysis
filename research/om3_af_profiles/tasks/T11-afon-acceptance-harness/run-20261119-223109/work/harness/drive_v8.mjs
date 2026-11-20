// T11 acceptance driver. Every key, dial, pose and setter goes through the gate,
// which compares the full state before it returns. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { titleBand } from '../../ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs';
import { packHalf } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { bindWriterSetter, installCombined, plantLive, readGetter, writeMirrorBytes, writeMode } from './afon_hooks_v6.mjs';
import { flagExpect, holdAll, mirrorByteExpect, mirrorBytesExpect, plantExpect, stepExpect } from './expect_v2.mjs';
import { createGate } from './gate_v3.mjs';
import { approveCommit, coverageProblems, loadSealed } from './identity_v2.mjs';
import { judge, judgeDown, RESET } from './judge_v2.mjs';
import { captureState, same } from './state_v1.mjs';
import { assertClean } from './static_check_v7.mjs';
import { table } from './table_v2.mjs';

const OVERLAY = 'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv';
const stepOrder = table.steps.map((step) => step.id);
const ENTER = table.steps.find((step) => step.id === 'enter-land');

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
  const banks = (reads || []).filter((row) => row.kind === 'zone' || row.kind === 'pos').map((row) => row.bank);
  actual.readCount = banks.length;
  actual.readBank = banks.length && banks.every((bank) => bank === banks[0]) ? banks[0] : null;
  actual.staticT6Bank = step.pose === 2 ? 5 : step.pose === 4 ? 3 : 1;
  return actual;
}

function compact(state) {
  if (!state) return null;
  return {
    screen: state.screen, poseWord: state.poseWord, flag: state.flag, owner: state.owner, subject: state.subject,
    half: state.half, target: state.target, halfTarget: state.halfTarget, seals: state.seals, frame: state.frame,
  };
}

export async function main({ mode, tag, sealedPath }) {
  if (mode !== 'identity' && mode !== 'proof') throw new Error('mode');
  assertClean();
  if (process.env.OM_EMU_MODEL !== 'E147' || process.env.OM_EMU_NVRAM !== 'off') throw new Error('env');
  const outJsonl = resolve('work/out/' + tag + '.jsonl');
  if (existsSync(outJsonl)) throw new Error('refusing to overwrite ' + outJsonl);
  mkdirSync(resolve('work/out'), { recursive: true });
  const sealed = mode === 'proof' ? loadSealed(sealedPath, sealedPath.replace(/\.json$/, '.seal.json')) : null;
  if (mode === 'proof') {
    const problems = coverageProblems(table, sealed.rows);
    if (problems.length) throw new Error('identity coverage: ' + problems.join('; '));
  }
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
    await zonePass({ mode, tag, sealed, recorded, rows, log, runZone });
    if (mode === 'identity') {
      const body = { task: 'T11', ok: true, rows };
      const jsonPath = resolve('work/out/' + tag + '.json');
      writeFileSync(jsonPath, JSON.stringify(body, null, 2) + '\n');
      const need = Object.keys(rows);
      writeFileSync(resolve('work/out/' + tag + '-keys.json'), JSON.stringify({ keys: need }, null, 2) + '\n');
    }
    log({ id: tag + '-done', pass: true, ok: true, problems: [] });
  } catch (error) {
    failed = error;
    log({ id: tag + '-done', pass: false, ok: false, problems: [String(error && error.message || error)] });
  }
  if (failed) throw failed;
}

function openGate(ctx, hooks, mode, sealed, rows, log) {
  const gate = createGate(ctx, {
    capture: (frame) => captureState(ctx, readGetter, frame),
    idle: (ms) => ctx.idle(ms),
    identityNow: () => identityNow(ctx),
    approve: (op, actual) => approveCommit(mode, sealed, op.identity, actual, rows),
    onIdentity: (op, decision, actual) => {
      log({
        id: op.id + '-identity', pass: decision.ok, problems: decision.problems || [],
        expected: decision.expected || null, actual: decision.actual || actual, key: decision.key || null,
      });
    },
    onState: (op, before, after, problems) => {
      log({
        id: op.id, pass: problems.length === 0, problems, before: compact(before), actual: compact(after),
      });
    },
  });
  const pose = attachPose(ctx.l);
  gate.bindPose(pose);
  bindWriterSetter(gate, ctx);
  gate.bindPlant((key, index, value) => plantLive(ctx, key, index, value));
  gate.bindMode((value) => writeMode(ctx, value));
  gate.bindMirror((bytes) => writeMirrorBytes(ctx, bytes));
  return { gate, pose };
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
      ? 'Candidate. Combined hook, self-armed writer, saved-bank feed, native pose gate. EMULATOR-ONLY. Role: behaviour.'
      : (role === 'k2' ? 'K2. Combined overlay, no hooks. EMULATOR-ONLY. Role: behaviour.' : 'K1e, the overlay S1 reference. EMULATOR-ONLY. Role: behaviour.'),
    change: hooksOn ? 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.' : 'none',
    async drive(ctx) {
      const modelMod = await import(pathToFileURL(resolve('om-emu/emu/src/fw/model.mjs')).href);
      const menuMod = await import(pathToFileURL(resolve('om-emu/emu/src/lab/menu.mjs')).href);
      const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
      const { gate } = openGate(ctx, hooks, mode, sealed, rows, log);
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
      let cursor = gate.pose({
        id: role + '-pose-landscape', poseName: 'landscape', idleMs: 500,
        expect: holdAll(),
        check: (_before, after) => {
          const problems = [];
          for (const name of Object.keys(RESET)) if (!same(after.half[name], RESET[name])) problems.push('fresh ' + name);
          return problems;
        },
      });
      cursor = gate.set({ id: role + '-link-1db1', setterKey: 0x1db1, index: 0, value: 1, idleMs: 0, expect: holdAll() });
      cursor = gate.set({ id: role + '-link-1dc1', setterKey: 0x1dc1, index: 0, value: 1, idleMs: 0, expect: holdAll() });
      if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) throw new Error('link did not read back');
      if (hooks) hooks.refresh();
      for (const step of table.steps) {
        if (!step.who.includes(role)) continue;
        cursor = runStep({ ctx, gate, hooks, step, role, cursor, recorded, log });
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

function runStep({ ctx, gate, hooks, step, role, cursor, recorded, log }) {
  const readFrom = hooks ? hooks.reads.length : 0;
  const finishJudge = (phase) => (before, after) => {
    const reads = hooks ? hooks.reads.slice(readFrom) : [];
    const actual = decorate(ctx, after, step, reads);
    if (phase === 'down' && step.action === 'key') return judgeDown(role, step, actual, recorded, stepOrder);
    return judge(role, step, actual, recorded, stepOrder);
  };
  const op = (phase, idleMs, run) => {
    const first = step.action === 'key' ? phase === 'down' : true;
    const body = {
      id: role + '-' + step.id + (step.action === 'key' ? '-' + phase : ''),
      idleMs,
      expect: stepExpect(step, phase, role, recorded),
      check: finishJudge(phase),
      commitClass: !!step.commit && first,
      identity: { ...step, recordRole: role },
      key: step.key,
      dir: phase === 'enter' || phase === 'pose' || phase === 'check' ? undefined : (step.dir || phase),
      poseName: step.key,
    };
    cursor = run(body);
    const slot = phase === 'down' && step.action === 'key' ? step.id + '-down' : step.id;
    if (phase !== 'down' || step.action !== 'key') recorded[role][step.id] = cursor;
    if (phase === 'down' && step.action === 'key') recorded[role][step.id + '-down'] = cursor;
    if (slot) recorded[role][slot] = cursor;
    return cursor;
  };
  if (step.action === 'enter') {
    if (!hooks) throw new Error('enter without the candidate ' + step.id);
    op('enter', 200, (body) => gate.act(body, () => hooks.enter()));
  } else if (step.action === 'pose') {
    if (hooks) hooks.armWatches(step.id);
    op('pose', 600, (body) => gate.pose(body));
    if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) {
      cursor = gate.set({ id: role + '-' + step.id + '-relink-1db1', setterKey: 0x1db1, index: 0, value: 1, idleMs: 0, expect: holdAll() });
      cursor = gate.set({ id: role + '-' + step.id + '-relink-1dc1', setterKey: 0x1dc1, index: 0, value: 1, idleMs: 0, expect: holdAll() });
    }
    if (hooks) hooks.refresh();
    if (hooks) {
      const hits = hooks.drainWatches();
      const stores = hits.filter((hit) => hit.kind === 'store' && hit.id !== 'mirror' && hit.id !== 'mirrora');
      let leak = [];
      if (step.id === 'pose-after-edit') {
        const mirrorPos = ctx.l.sim.read(0xa031eeb0 + 0x0a, 2);
        const saved = mirrorPos[0] | (mirrorPos[1] << 8);
        leak = stores.filter((hit) => hit.value === saved);
      }
      const problems = step.id === 'pose-after-edit' ? leak.map((hit) => hit.id + '=' + hit.value) : stores.map((hit) => hit.id + '@' + hit.pc.toString(16));
      log({
        id: role + '-' + step.id + '-watches', pass: problems.length === 0, problems,
        refused: hits.filter((hit) => hit.kind === 'refused').length, stores: stores.length,
      });
      if (problems.length) throw new Error(role + '-' + step.id + ' live store during pose');
    }
  } else if (step.action === 'key') {
    op('down', 80, (body) => gate.key(body));
    op('up', 400, (body) => gate.key(body));
  } else if (step.action === 'edge') {
    if (hooks) hooks.refresh();
    op(step.dir, step.dir === 'down' ? 80 : 400, (body) => gate.key(body));
  } else if (step.action === 'check') {
    op('check', 0, (body) => gate.act(body, () => {}));
  } else throw new Error('bad action ' + step.action);
  ctx.shot(step.id);
  return cursor;
}

function k1eMenuExpect() {
  return { named: { subject: 0 }, hold: ['mirror71', 'flag', 'frame', 'target', 'halfTarget', 'owner'], seal: ['slots'], slotExcept: [] };
}

function candidateMenuExpect(half) {
  return {
    named: { subject: 0, mirror: packHalf(half) },
    hold: ['slots', 'mirrorTail', 'flag', 'target', 'halfTarget', 'owner', 'frame'],
    seal: [],
    slotExcept: [],
  };
}

async function zonePass({ mode, tag, sealed, recorded, rows, log, runZone }) {
  const store = { rows: [] };
  const boot = async (ctx, gate, modelMod) => {
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
    let cursor = gate.pose({ id: 'zone-landscape', poseName: 'landscape', idleMs: 500, expect: holdAll() });
    cursor = gate.set({ id: 'zone-link-1db1', setterKey: 0x1db1, index: 0, value: 1, idleMs: 0, expect: holdAll() });
    cursor = gate.set({ id: 'zone-link-1dc1', setterKey: 0x1dc1, index: 0, value: 1, idleMs: 0, expect: holdAll() });
    return cursor;
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
      explanation: hooksOn ? 'Zone candidate. Same combined hook. EMULATOR-ONLY. Role: behaviour.' : 'Zone K1e, the overlay S1 reference. EMULATOR-ONLY. Role: behaviour.',
      change: hooksOn ? 'EMULATOR-ONLY combined AF-ON hook. Role: behaviour.' : 'none',
      async drive(ctx) {
        const modelMod = await import(pathToFileURL(resolve('om-emu/emu/src/fw/model.mjs')).href);
        const menuMod = await import(pathToFileURL(resolve('om-emu/emu/src/lab/menu.mjs')).href);
        const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
        const { gate } = openGate(ctx, hooks, mode, sealed, rows, log);
        await boot(ctx, gate, modelMod);
        const commitOk = (id) => {
          const identity = { id: 'zone-' + id, commit: true, identityFrom: 'k1e:zone-' + id, recordRole: hooksOn ? 'zcand' : 'k1e' };
          let cursor = gate.key({
            id: role + '-zone-' + id + '-down', key: 'ok', dir: 'down', idleMs: 80, commitClass: true, identity,
            expect: hooksOn ? holdAll({ flag: 1 }) : k1eMenuExpect(),
          });
          cursor = gate.key({
            id: role + '-zone-' + id + '-up', key: 'ok', dir: 'up', idleMs: 400,
            expect: hooksOn ? flagExpect(0) : k1eMenuExpect(),
          });
          return cursor;
        };
        if (!hooksOn) {
          const seen = new Set();
          let dismissN = 0;
          const record = (steps, id) => {
            let cursor = null;
            const snaps = [];
            for (const step of steps) {
              if (step.op === 'dial') cursor = gate.dial({ id: role + '-' + id + '-dial', idleMs: 400, expect: k1eMenuExpect() });
              else {
                cursor = gate.key({ id: role + '-' + id + '-' + step.op + '-down', key: step.op, dir: 'down', idleMs: 80, expect: k1eMenuExpect() });
                cursor = gate.key({ id: role + '-' + id + '-' + step.op + '-up', key: step.op, dir: 'up', idleMs: 400, expect: k1eMenuExpect() });
              }
              snaps.push(cursor.half);
            }
            const zone = cursor.half.k99a1.join(',');
            if (seen.has(zone)) { commitOk('dismiss-' + dismissN); dismissN += 1; return false; }
            seen.add(zone);
            const ident = identityNow(ctx);
            commitOk(id);
            const press = gate.key({
              id: role + '-' + id + '-s1-down', key: 's1', dir: 'down', idleMs: 80,
              commitClass: true,
              identity: { id: 'zone-' + id + '-s1', commit: true, identityFrom: 'k1e:zone-' + id + '-s1', recordRole: 'k1e' },
              expect: { named: { subject: 0, owner: 1 }, hold: ['slots', 'mirror71', 'flag', 'frame'], seal: ['target', 'halfTarget'], allowStale: true, slotExcept: [] },
            });
            const release = gate.key({
              id: role + '-' + id + '-s1-up', key: 's1', dir: 'up', idleMs: 400,
              expect: { named: { subject: 0, owner: 0 }, hold: ['slots', 'mirror71', 'flag', 'frame', 'target', 'halfTarget'], seal: [], slotExcept: [] },
            });
            store.rows.push({
              id, identity: ident, nav: steps, snaps, zone0: Number(zone.split(',')[0]),
              cells: press.half, press: press.target, pressSha: sha(press.target),
              release: release.target, releaseSha: sha(release.target),
            });
            return true;
          };
          if (!record([{ op: 'up' }], 'z0')) throw new Error('reset zone was not recorded');
          for (let i = 1; i < 8; i++) {
            if (!record([{ op: 'up' }, { op: 'dial' }], 'z' + i)) break;
          }
          gate.set({ id: 'offer-custom', setterKey: 0x5a11, index: 5, value: 1, idleMs: 0, expect: plantExpect(captureState(ctx, readGetter, null), 0x5a11, 5, 1) });
          let found = false;
          for (let i = 0; i < 14 && !found; i++) {
            let cursor = gate.key({ id: 'seek-' + i + '-down', key: 'up', dir: 'down', idleMs: 80, expect: k1eMenuExpect() });
            cursor = gate.key({ id: 'seek-' + i + '-up', key: 'up', dir: 'up', idleMs: 400, expect: k1eMenuExpect() });
            cursor = gate.dial({ id: 'seek-' + i + '-dial', idleMs: 400, expect: k1eMenuExpect() });
            if (cursor.half.k99a1[0] === 6) {
              commitOk('custom');
              const press = gate.key({
                id: 'custom-s1-down', key: 's1', dir: 'down', idleMs: 80, commitClass: true,
                identity: { id: 'zone-custom-s1', commit: true, identityFrom: 'k1e:zone-custom-s1', recordRole: 'k1e' },
                expect: { named: { subject: 0, owner: 1 }, hold: ['slots', 'mirror71', 'flag', 'frame'], seal: ['target', 'halfTarget'], allowStale: true, slotExcept: [] },
              });
              const release = gate.key({
                id: 'custom-s1-up', key: 's1', dir: 'up', idleMs: 400,
                expect: { named: { subject: 0, owner: 0 }, hold: ['slots', 'mirror71', 'flag', 'frame', 'target', 'halfTarget'], seal: [], slotExcept: [] },
              });
              store.rows.push({
                id: 'custom', zone0: 6, cells: press.half, seeded: false,
                press: press.target, pressSha: sha(press.target), release: release.target, releaseSha: sha(release.target),
              });
              found = true;
            } else {
              gate.key({
                id: 'seek-ok-' + i + '-down', key: 'ok', dir: 'down', idleMs: 80, commitClass: true,
                identity: { id: 'zone-seek-' + i, commit: true, identityFrom: 'k1e:zone-seek-' + i, recordRole: 'k1e' },
                expect: k1eMenuExpect(),
              });
              gate.key({ id: 'seek-ok-' + i + '-up', key: 'ok', dir: 'up', idleMs: 400, expect: k1eMenuExpect() });
            }
          }
          if (!found) throw new Error('custom zone 6 was not reached');
        } else {
          const apply = (cursor, key, index, value, id, flag) => {
            const expect = flag === 1 ? mirrorByteExpect(cursor, key, index, value) : plantExpect(cursor, key, index, value);
            return gate.set({ id, setterKey: key, index, value, idleMs: 0, expect });
          };
          for (const row of store.rows.filter((item) => item.id !== 'custom')) {
            let cursor = gate.act({
              id: 'zcand-enter-' + row.id, idleMs: 200,
              expect: stepExpect(ENTER, 'enter', 'candidate', recorded),
            }, () => hooks.enter());
            for (let n = 0; n < row.nav.length; n++) {
              const step = row.nav[n];
              const expect = candidateMenuExpect(row.snaps[n]);
              if (step.op === 'dial') cursor = gate.dial({ id: 'zcand-' + row.id + '-dial', idleMs: 400, expect });
              else {
                cursor = gate.key({ id: 'zcand-' + row.id + '-' + step.op + '-down', key: step.op, dir: 'down', idleMs: 80, expect });
                cursor = gate.key({ id: 'zcand-' + row.id + '-' + step.op + '-up', key: step.op, dir: 'up', idleMs: 400, expect });
              }
            }
            commitOk(row.id);
            const pairs = [[0x99a1, 0, row.zone0], [0x84d1, 0, row.cells.k84d1[0]], [0x1dd1, 0, row.cells.k1dd1[0]], [0x1dd1, 1, row.cells.k1dd1[1]], [0x88b2, 0, row.cells.k88b2[0]], [0x5962, 0, row.cells.k88b2[0]], [0x9a41, 0, row.cells.k9a41[0]], [0x1df1, 0, row.cells.k1df1[0]]];
            cursor = captureState(ctx, readGetter, null);
            for (const [key, index, value] of pairs) cursor = apply(cursor, key, index, value, 'zcand-' + row.id + '-set-' + key.toString(16), 0);
            hooks.refresh();
            const press = gate.key({
              id: 'zcand-' + row.id + '-af-down', key: 'afon', dir: 'down', idleMs: 80, commitClass: true,
              identity: { id: 'zone-' + row.id + '-s1', commit: true, identityFrom: 'k1e:zone-' + row.id + '-s1', recordRole: 'zcand' },
              expect: { named: { subject: 0, owner: 2, target: row.press }, hold: ['slots', 'mirror71', 'flag', 'halfTarget', 'frame'], seal: [], slotExcept: [] },
            });
            const pressDelta = [];
            for (let i = 0; i < 10; i++) if (press.target[i] !== row.press[i]) pressDelta.push(i);
            log({ id: 'zone-' + row.id + '-press', pass: pressDelta.length === 0, problems: pressDelta.map((i) => '+' + i), k1e: row.press, candidate: press.target });
            if (pressDelta.length) throw new Error('zone press ' + row.id);
            const release = gate.key({
              id: 'zcand-' + row.id + '-af-up', key: 'afon', dir: 'up', idleMs: 400,
              expect: { named: { subject: 0, owner: 0, target: row.release }, hold: ['slots', 'mirror71', 'flag', 'halfTarget', 'frame'], seal: [], slotExcept: [] },
            });
            const releaseDelta = [];
            for (let i = 0; i < 10; i++) if (release.target[i] !== row.release[i]) releaseDelta.push(i);
            log({ id: 'zone-' + row.id + '-release', pass: releaseDelta.length === 0, problems: releaseDelta.map((i) => '+' + i), k1e: row.release, candidate: release.target });
            if (releaseDelta.length) throw new Error('zone release ' + row.id);
          }
          const custom = store.rows.find((item) => item.id === 'custom');
          let cursor = gate.act({
            id: 'zcand-enter-custom', idleMs: 200, expect: stepExpect(ENTER, 'enter', 'candidate', recorded),
          }, () => hooks.enter());
          const pairs = [[0x99a1, 0, custom.zone0], [0x84d1, 0, custom.cells.k84d1[0]], [0x1dd1, 0, custom.cells.k1dd1[0]], [0x1dd1, 1, custom.cells.k1dd1[1]], [0x88b2, 0, custom.cells.k88b2[0]], [0x5962, 0, custom.cells.k88b2[0]], [0x9a41, 0, custom.cells.k9a41[0]], [0x1df1, 0, custom.cells.k1df1[0]]];
          for (const [key, index, value] of pairs) cursor = apply(cursor, key, index, value, 'custom-mirror-' + key.toString(16), 1);
          cursor = gate.mode({ id: 'custom-flag-clear', value: 0, idleMs: 0, expect: flagExpect(0) });
          for (const [key, index, value] of pairs) cursor = apply(cursor, key, index, value, 'custom-live-' + key.toString(16), 0);
          hooks.refresh();
          const press = gate.key({
            id: 'zcand-custom-af-down', key: 'afon', dir: 'down', idleMs: 80, commitClass: true,
            identity: { id: 'zone-custom-s1', commit: true, identityFrom: 'k1e:zone-custom-s1', recordRole: 'zcand' },
            expect: { named: { subject: 0, owner: 2, target: custom.press }, hold: ['slots', 'mirror71', 'flag', 'halfTarget', 'frame'], seal: [], slotExcept: [] },
          });
          const pressDelta = [];
          for (let i = 0; i < 10; i++) if (press.target[i] !== custom.press[i]) pressDelta.push(i);
          log({ id: 'zone-custom-press', pass: pressDelta.length === 0, problems: pressDelta.map((i) => '+' + i), k1e: custom.press, candidate: press.target, seeded: true });
          if (pressDelta.length) throw new Error('zone press custom');
          const release = gate.key({
            id: 'zcand-custom-af-up', key: 'afon', dir: 'up', idleMs: 400,
            expect: { named: { subject: 0, owner: 0, target: custom.release }, hold: ['slots', 'mirror71', 'flag', 'halfTarget', 'frame'], seal: [], slotExcept: [] },
          });
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
  log({ id: 'zone-k1e-seal', pass: true, problems: [], sha256: sha(readFileSync(zonePath)), zones: store.rows.map((row) => row.id) });
  await run('zcand');
}
