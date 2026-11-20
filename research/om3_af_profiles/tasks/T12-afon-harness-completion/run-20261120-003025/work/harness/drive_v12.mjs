// T12 acceptance driver. Every key, dial, pose, setter and native setup goes through the gate.
// Identity is captured after the key, including candidate AF-ON release and zone AF-ON release.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { titleBand } from '../../ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { bindWriterSetter, installCombined, readGetter, writeMode } from './afon_hooks_v7.mjs';
import { loadCheckout } from './checkout_v1.mjs';
import { expectId, holdAll, setupExpect, stepExpect } from './expect_v3.mjs';
import { createGate } from './gate_v5.mjs';
import { approveCommit, commitPresence, identityFor, loadSealed, opId } from './identity_v4.mjs';
import { readListed } from './inventory_v4.mjs';
import { judgeObserved } from './judge_v3.mjs';
import { ZONE_NAV } from './ops_v1.mjs';
import { runSetup } from './setup_v2.mjs';
import { captureState } from './state_v1.mjs';
import { assertClean } from './static_check_v9.mjs';
import { table } from './table_v2.mjs';

const OVERLAY = 'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv';
const ZONE_SESSION = 'ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';

export async function importDriveModules() {
  const modelMod = await import(pathToFileURL(resolve('om-emu/emu/src/fw/model.mjs')).href);
  const menuMod = await import(pathToFileURL(resolve('om-emu/emu/src/lab/menu.mjs')).href);
  const zone = await import(pathToFileURL(resolve(ZONE_SESSION)).href);
  return { modelMod, menuMod, runZone: zone.runZone };
}

export function bindSession(gate, ctx, pose) {
  if (pose) gate.bindPose(pose);
  bindWriterSetter(gate, ctx);
  gate.bindMode((value) => writeMode(ctx, value));
}

function setupBody(planState, prefix, suffix, idleMs) {
  const expect = suffix === 'bring-up' || suffix === 'focus-1712' ? setupExpect() : holdAll();
  return opBody(planState, { id: prefix + '-' + suffix, idleMs, expect });
}

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
  return actual;
}

function compact(state) {
  if (!state) return null;
  return {
    screen: state.screen, poseWord: state.poseWord, flag: state.flag, owner: state.owner, subject: state.subject,
    target: state.target, halfTarget: state.halfTarget, frame: state.frame,
  };
}

function opBody(planState, body) {
  const ident = identityFor(planState, body.id);
  if (ident) body.identity = ident;
  return body;
}

export async function main(opts) {
  if (opts && opts.loadOnly) {
    await importDriveModules();
    await loadCheckout('om-emu');
    return {};
  }
  const { mode, tag, sealedPath, rows, planState } = opts;
  if (mode !== 'identity' && mode !== 'proof') throw new Error('mode');
  assertClean();
  if (process.env.OM_EMU_MODEL !== 'E147' || process.env.OM_EMU_NVRAM !== 'off') throw new Error('env');
  const outJsonl = resolve('work/out/' + tag + '.jsonl');
  if (existsSync(outJsonl)) throw new Error('refusing to overwrite ' + outJsonl);
  mkdirSync(resolve('work/out'), { recursive: true });
  const sealed = mode === 'proof' ? loadSealed(sealedPath, sealedPath.replace(/\.json$/, '.seal.json')) : null;
  const book = rows || {};
  const lines = [];
  const log = (row) => {
    lines.push(JSON.stringify(row));
    writeFileSync(outJsonl, lines.join('\n') + '\n');
    console.log(JSON.stringify({ id: row.id, pass: row.pass }));
  };
  const recorded = { k1e: {}, k2: {}, candidate: {} };
  const loaded = await importDriveModules();
  await loadCheckout('om-emu');
  const { runZone } = loaded;
  log({ id: 'plan', pass: true, problems: [], mode, steps: table.steps.length, identitySha: sealed ? sealed.sha256 : null });
  for (const role of ['k1e', 'k2', 'candidate']) {
    await runRole({ role, mode, tag, sealed, recorded, rows: book, log, runZone, planState });
  }
  await zonePass({ mode, tag, sealed, recorded, rows: book, log, runZone, planState });
  log({ id: tag + '-drive-done', pass: true, ok: true, problems: [] });
  return book;
}

function openGate(ctx, mode, sealed, rows, log, planState) {
  const gate = createGate(ctx, {
    capture: (frame) => captureState(ctx, readGetter, frame),
    idle: (ms) => ctx.idle(ms),
    identityNow: () => identityNow(ctx),
    plan: () => planState,
    approve: (step, actual) => approveCommit(mode, sealed, step, actual, rows),
    presence: (step) => commitPresence(mode, sealed, step),
    onIdentity: (op, decision, actual) => {
      log({
        id: op.id + '-identity', pass: decision.ok, problems: decision.problems || [],
        expected: decision.expected || null, actual: decision.actual || actual, key: decision.key || null,
      });
    },
    onState: (op, before, after, problems) => {
      log({ id: op.id, pass: problems.length === 0, problems, before: compact(before), actual: compact(after) });
    },
  });
  bindSession(gate, ctx, attachPose(ctx.l));
  return gate;
}

async function boot(ctx, gate, modelMod, planState, role) {
  await runSetup(ctx, modelMod, gate, (suffix, idleMs) => setupBody(planState, role, suffix, idleMs));
  let cursor = gate.pose(opBody(planState, {
    id: role + '-pose-landscape', poseName: 'landscape', idleMs: 500, expect: expectId(role + '-pose-landscape'),
  }));
  cursor = gate.set(opBody(planState, {
    id: role + '-link-1db1', setterKey: 0x1db1, index: 0, value: 1, idleMs: 0, expect: expectId(role + '-link-1db1'),
  }));
  cursor = gate.set(opBody(planState, {
    id: role + '-link-1dc1', setterKey: 0x1dc1, index: 0, value: 1, idleMs: 0, expect: expectId(role + '-link-1dc1'),
  }));
  if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) throw new Error('link did not read back');
  return cursor;
}

async function runRole({ role, mode, tag, sealed, recorded, rows, log, runZone, planState }) {
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
      const { modelMod, menuMod } = await importDriveModules();
      if (ctx && ctx.loadOnly) return;
      const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
      const gate = openGate(ctx, mode, sealed, rows, log, planState);
      await boot(ctx, gate, modelMod, planState, role);
      if (hooks) hooks.refresh();
      for (const step of table.steps) {
        if (!step.who.includes(role)) continue;
        runStep({ ctx, gate, hooks, step, role, recorded, planState, log });
      }
      if (hooks) {
        const writer = hooks.counts.writer;
        log({
          id: 'writer-calls', pass: writer === 3, problems: writer === 3 ? [] : ['writer ' + writer],
          writer, skipped: hooks.counts.skipped || 0, refused: hooks.refused.length,
        });
        if (writer !== 3) throw new Error('writer calls ' + writer);
      }
    },
  });
  if (!result.ok) throw new Error(role + ' ' + result.failed);
}

function runStep({ ctx, gate, hooks, step, role, recorded, planState, log }) {
  const readFrom = hooks ? hooks.reads.length : 0;
  const run = (phase, idleMs, go) => {
    const id = opId(role, step, phase);
    const body = opBody(planState, {
      id,
      idleMs,
      expect: stepExpect(step, phase, role, recorded),
      check: (_before, after) => judgeObserved(role, step, decorate(ctx, after, step, hooks ? hooks.reads.slice(readFrom) : []), phase),
      key: step.key,
      dir: phase === 'enter' || phase === 'pose' || phase === 'check' ? undefined : (step.dir || phase),
      poseName: step.key,
    });
    const cursor = go(body);
    recorded[role][step.id] = cursor;
    if (phase === 'down' && step.action === 'key') recorded[role][step.id + '-down'] = cursor;
    return cursor;
  };
  if (step.action === 'enter') {
    if (!hooks) throw new Error('enter without the candidate ' + step.id);
    run('enter', 200, (body) => gate.act(body, () => hooks.enter()));
  } else if (step.action === 'pose') {
    if (hooks) hooks.armWatches(step.id);
    run('pose', 600, (body) => gate.pose(body));
    if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) {
      gate.set(opBody(planState, { id: role + '-' + step.id + '-relink-1db1', setterKey: 0x1db1, index: 0, value: 1, idleMs: 0, expect: holdAll() }));
      gate.set(opBody(planState, { id: role + '-' + step.id + '-relink-1dc1', setterKey: 0x1dc1, index: 0, value: 1, idleMs: 0, expect: holdAll() }));
    }
    if (hooks) hooks.refresh();
    if (hooks) {
      const hits = hooks.drainWatches();
      const stores = hits.filter((hit) => hit.kind === 'store' && hit.id !== 'mirror' && hit.id !== 'mirrora');
      let leak = stores.map((hit) => hit.id + '@' + hit.pc.toString(16));
      if (step.id === 'pose-after-edit') {
        const mirrorPos = ctx.l.sim.read(0xa031eeb0 + 0x0a, 2);
        const saved = mirrorPos[0] | (mirrorPos[1] << 8);
        leak = stores.filter((hit) => hit.value === saved).map((hit) => hit.id + '=' + hit.value);
      }
      log({
        id: role + '-' + step.id + '-watches', pass: leak.length === 0, problems: leak,
        refused: hits.filter((hit) => hit.kind === 'refused').length, stores: stores.length,
      });
      if (leak.length) throw new Error(role + '-' + step.id + ' live store during pose');
    }
  } else if (step.action === 'key') {
    run('down', 80, (body) => gate.key(body));
    run('up', 400, (body) => gate.key(body));
  } else if (step.action === 'edge') {
    if (hooks) hooks.refresh();
    run(step.dir, step.dir === 'down' ? 80 : 400, (body) => gate.key(body));
  } else if (step.action === 'check') {
    run('check', 0, (body) => gate.act(body, () => {}));
  } else throw new Error('bad action ' + step.action);
  ctx.shot(step.id);
}

function playNav(gate, planState, prefix, ops) {
  for (const op of ops) {
    if (op === 'dial') {
      const id = prefix + '-dial';
      gate.dial(opBody(planState, { id, idleMs: 400, expect: expectId(id) }));
    } else {
      gate.key(opBody(planState, { id: prefix + '-' + op + '-down', key: op, dir: 'down', idleMs: 80, expect: expectId(prefix + '-' + op + '-down') }));
      gate.key(opBody(planState, { id: prefix + '-' + op + '-up', key: op, dir: 'up', idleMs: 400, expect: expectId(prefix + '-' + op + '-up') }));
    }
  }
}

function seek(gate, planState, n) {
  gate.key(opBody(planState, { id: 'seek-' + n + '-down', key: 'up', dir: 'down', idleMs: 80, expect: expectId('seek-' + n + '-down') }));
  gate.key(opBody(planState, { id: 'seek-' + n + '-up', key: 'up', dir: 'up', idleMs: 400, expect: expectId('seek-' + n + '-up') }));
  gate.dial(opBody(planState, { id: 'seek-' + n + '-dial', idleMs: 400, expect: expectId('seek-' + n + '-dial') }));
}

function pairArgs(row) {
  return [
    [0x99a1, 0, row.zone0, '99a1'],
    [0x84d1, 0, row.cells.k84d1[0], '84d1'],
    [0x1dd1, 0, row.cells.k1dd1[0], '1dd1'],
    [0x1dd1, 1, row.cells.k1dd1[1], '1dd1#2'],
    [0x88b2, 0, row.cells.k88b2[0], '88b2'],
    [0x5962, 0, row.cells.k88b2[0], '5962'],
    [0x9a41, 0, row.cells.k9a41[0], '9a41'],
    [0x1df1, 0, row.cells.k1df1[0], '1df1'],
  ];
}

async function zonePass({ mode, tag, sealed, recorded, rows, log, runZone, planState }) {
  const store = { rows: [] };
  const saved = planState.afContext;
  planState.afContext = true;
  const run = async (role, bootId) => {
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
        const { modelMod, menuMod } = await importDriveModules();
        if (ctx && ctx.loadOnly) return;
        const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
        const gate = openGate(ctx, mode, sealed, rows, log, planState);
        await runSetup(ctx, modelMod, gate, (suffix, idleMs) => setupBody(planState, bootId, suffix, idleMs));
        gate.pose(opBody(planState, { id: bootId, poseName: 'landscape', idleMs: 500, expect: expectId(bootId) }));
        gate.set(opBody(planState, { id: bootId.replace('landscape', 'link-1db1'), setterKey: 0x1db1, index: 0, value: 1, idleMs: 0, expect: expectId(bootId.replace('landscape', 'link-1db1')) }));
        gate.set(opBody(planState, { id: bootId.replace('landscape', 'link-1dc1'), setterKey: 0x1dc1, index: 0, value: 1, idleMs: 0, expect: expectId(bootId.replace('landscape', 'link-1dc1')) }));
        if (!hooksOn) driveK1eZone(ctx, gate, planState, store);
        else driveCandidateZone(ctx, gate, hooks, planState, store, recorded, log);
      },
    });
    if (!result.ok) throw new Error(role + ' ' + result.failed);
  };
  await run('zk1e', 'zone-landscape');
  const zonePath = resolve('work/out/' + tag + '-zone-k1e.json');
  writeFileSync(zonePath, JSON.stringify({ rows: store.rows }, null, 2) + '\n');
  log({ id: 'zone-k1e-seal', pass: true, problems: [], sha256: sha(readListed(zonePath)), zones: store.rows.map((row) => row.id) });
  await run('zcand', 'zone-landscape#2');
  planState.afContext = saved;
}

function driveK1eZone(ctx, gate, planState, store) {
  const remember = (id, press, release) => {
    store.rows.push({
      id,
      zone0: press.half.k99a1[0],
      cells: press.half,
      press: press.target,
      pressSha: sha(press.target),
      release: release.target,
      releaseSha: sha(release.target),
    });
  };
  const commitAf = (id, downId, upId) => {
    const down = gate.key(opBody(planState, { id: downId, key: 's1', dir: 'down', idleMs: 80, expect: expectId(downId) }));
    const up = gate.key(opBody(planState, { id: upId, key: 's1', dir: 'up', idleMs: 400, expect: expectId(upId) }));
    remember(id, down, up);
  };
  for (const zone of ZONE_NAV) {
    playNav(gate, planState, 'zk1e-' + zone.id, zone.nav);
    gate.key(opBody(planState, { id: 'zk1e-zone-' + zone.id + '-down', key: 'ok', dir: 'down', idleMs: 80, expect: expectId('zk1e-zone-' + zone.id + '-down') }));
    gate.key(opBody(planState, { id: 'zk1e-zone-' + zone.id + '-up', key: 'ok', dir: 'up', idleMs: 400, expect: expectId('zk1e-zone-' + zone.id + '-up') }));
    commitAf(zone.id, 'zk1e-' + zone.id + '-s1-down', 'zk1e-' + zone.id + '-s1-up');
  }
  playNav(gate, planState, 'zk1e-z6', ['up', 'dial']);
  gate.key(opBody(planState, { id: 'zk1e-zone-dismiss-0-down', key: 'ok', dir: 'down', idleMs: 80, expect: expectId('zk1e-zone-dismiss-0-down') }));
  gate.key(opBody(planState, { id: 'zk1e-zone-dismiss-0-up', key: 'ok', dir: 'up', idleMs: 400, expect: expectId('zk1e-zone-dismiss-0-up') }));
  gate.set(opBody(planState, { id: 'offer-custom', setterKey: 0x5a11, index: 5, value: 1, idleMs: 0, expect: expectId('offer-custom') }));
  for (let i = 0; i < 3; i++) {
    seek(gate, planState, i);
    gate.key(opBody(planState, { id: 'seek-ok-' + i + '-down', key: 'ok', dir: 'down', idleMs: 80, expect: expectId('seek-ok-' + i + '-down') }));
    gate.key(opBody(planState, { id: 'seek-ok-' + i + '-up', key: 'ok', dir: 'up', idleMs: 400, expect: expectId('seek-ok-' + i + '-up') }));
  }
  seek(gate, planState, 3);
  gate.key(opBody(planState, { id: 'zk1e-zone-custom-down', key: 'ok', dir: 'down', idleMs: 80, expect: expectId('zk1e-zone-custom-down') }));
  gate.key(opBody(planState, { id: 'zk1e-zone-custom-up', key: 'ok', dir: 'up', idleMs: 400, expect: expectId('zk1e-zone-custom-up') }));
  commitAf('custom', 'custom-s1-down', 'custom-s1-up');
  void ctx;
}

export function driveCandidateZone(ctx, gate, hooks, planState, store, recorded, log) {
  const setPairs = (prefix, row) => {
    for (const [key, index, value, name] of pairArgs(row)) {
      const id = prefix + name;
      gate.set(opBody(planState, { id, setterKey: key, index, value, idleMs: 0, expect: expectId(id) }));
    }
  };
  for (const row of store.rows.filter((item) => item.id !== 'custom')) {
    gate.act(opBody(planState, { id: 'zcand-enter-' + row.id, idleMs: 200, expect: expectId('zcand-enter-' + row.id) }), () => hooks.enter());
    playNav(gate, planState, 'zcand-' + row.id, ZONE_NAV.find((zone) => zone.id === row.id).nav);
    gate.key(opBody(planState, { id: 'zcand-zone-' + row.id + '-down', key: 'ok', dir: 'down', idleMs: 80, expect: expectId('zcand-zone-' + row.id + '-down') }));
    gate.key(opBody(planState, { id: 'zcand-zone-' + row.id + '-up', key: 'ok', dir: 'up', idleMs: 400, expect: expectId('zcand-zone-' + row.id + '-up') }));
    setPairs('zcand-' + row.id + '-set-', row);
    if (hooks) hooks.refresh();
    const press = gate.key(opBody(planState, { id: 'zcand-' + row.id + '-af-down', key: 'afon', dir: 'down', idleMs: 80, expect: expectId('zcand-' + row.id + '-af-down') }));
    const pressDelta = [];
    for (let i = 0; i < 10; i++) if (press.target[i] !== row.press[i]) pressDelta.push(i);
    log({ id: 'zone-' + row.id + '-press', pass: pressDelta.length === 0, problems: pressDelta.map((i) => '+' + i), k1e: row.press, candidate: press.target });
    if (pressDelta.length) throw new Error('zone press ' + row.id);
    const release = gate.key(opBody(planState, { id: 'zcand-' + row.id + '-af-up', key: 'afon', dir: 'up', idleMs: 400, expect: expectId('zcand-' + row.id + '-af-up') }));
    const releaseDelta = [];
    for (let i = 0; i < 10; i++) if (release.target[i] !== row.release[i]) releaseDelta.push(i);
    log({ id: 'zone-' + row.id + '-release', pass: releaseDelta.length === 0, problems: releaseDelta.map((i) => '+' + i), k1e: row.release, candidate: release.target });
    if (releaseDelta.length) throw new Error('zone release ' + row.id);
  }
  const custom = store.rows.find((item) => item.id === 'custom');
  gate.act(opBody(planState, { id: 'zcand-enter-custom', idleMs: 200, expect: expectId('zcand-enter-custom') }), () => hooks.enter());
  setPairs('custom-mirror-', custom);
  gate.mode(opBody(planState, { id: 'custom-flag-clear', value: 0, idleMs: 0, expect: expectId('custom-flag-clear') }));
  setPairs('custom-live-', custom);
  if (hooks) hooks.refresh();
  const press = gate.key(opBody(planState, { id: 'zcand-custom-af-down', key: 'afon', dir: 'down', idleMs: 80, expect: expectId('zcand-custom-af-down') }));
  const pressDelta = [];
  for (let i = 0; i < 10; i++) if (press.target[i] !== custom.press[i]) pressDelta.push(i);
  log({ id: 'zone-custom-press', pass: pressDelta.length === 0, problems: pressDelta.map((i) => '+' + i), k1e: custom.press, candidate: press.target });
  if (pressDelta.length) throw new Error('zone press custom');
  const release = gate.key(opBody(planState, { id: 'zcand-custom-af-up', key: 'afon', dir: 'up', idleMs: 400, expect: expectId('zcand-custom-af-up') }));
  const releaseDelta = [];
  for (let i = 0; i < 10; i++) if (release.target[i] !== custom.release[i]) releaseDelta.push(i);
  log({ id: 'zone-custom-release', pass: releaseDelta.length === 0, problems: releaseDelta.map((i) => '+' + i), k1e: custom.release, candidate: release.target });
  if (releaseDelta.length) throw new Error('zone release custom');
  const writer = hooks.counts.writer;
  log({ id: 'zone-writer-calls', pass: writer === 7, problems: writer === 7 ? [] : ['writer ' + writer], writer });
  if (writer !== 7) throw new Error('zone writer calls ' + writer);
  void recorded;
  void ctx;
}
