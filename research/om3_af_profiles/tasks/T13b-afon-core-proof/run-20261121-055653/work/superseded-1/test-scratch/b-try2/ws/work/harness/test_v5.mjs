// T13b unit and boundary tests, v5 (T13b staged proof: plan_v3 identity = T8d + zone; display tests on the fake use
// 'identity-all'; display plans are refused by the launcher until a display identity exists). From v3 (code review
// run-20261120-223058-review corrections 1-2). From v2 (design_v2 §6; design review corrections 1-6; code review
// run-20261120-221318-review corrections 1-7). Pure Node; never starts the emulator.
//   node26 work/harness/test_v5.mjs <run-name>        scratch: work/test-scratch/<run-name> (kept under work/)
// Pure tests run against this harness. Launcher tests copy work/harness into <scratch-dir>/ws, add a 'ref'
// junction to the research tree, build a minimal freeze there with make_freeze_v5.mjs --minimal, and launch.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { outPaths, sha256, validateTag } from './common_v1.mjs';
import { reproduce, rowKey } from './expect_v1.mjs';
import { checkCompletion, checkEntries, checkRefreshFile, readInventory } from './exitcheck_v5.mjs';
import { createFakeAdapter, fakeRefs } from './fake_v2.mjs';
import { evaluateT11, loadT11 } from './fixture_t11_v2.mjs';
import { readGrants, reverify, verifyFreeze } from './freeze_v1.mjs';
import { classifyCommit, createGate, guardDelivery } from './gate_v2.mjs';
import { FS_CLASSES, PROMISES_CLASSES, unclassified } from './inventory_v3.mjs';
import { createPoseGate } from './predicates_v3.mjs';
import { installRefresh } from './refresh_v4.mjs';
import { runPlan } from './exec_v4.mjs';
import { PLAN, commitOps, expectedOps, validatePlans } from './plan_v3.mjs';
import { AFON_PRESS_REFERENCE, PRESS_REFERENCES, createJudge, judgeDisplayEdge, displayWant } from './relations_v2.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WS = path.resolve(HERE, '..', '..');
const NODE = process.execPath;
const runName = process.argv[2];
if (!runName || !/^[a-z0-9][a-z0-9-]{0,40}$/.test(runName)) { console.error('usage: test_v5.mjs <run-name>'); process.exit(2); }
const SCRATCH = path.join(WS, 'work', 'test-scratch', runName);
if (fs.existsSync(SCRATCH)) { console.error('scratch directory exists: ' + SCRATCH); process.exit(2); }
fs.mkdirSync(SCRATCH, { recursive: true });

const results = [];
const FINGERPRINTS = Object.fromEntries(fs.readdirSync(HERE).sort().map((f) => [f, sha256(fs.readFileSync(path.join(HERE, f)))]));
const FIXTURE_INPUTS = ['identity-t11-v10.jsonl', 'identity-t11-v10.json'].map((f) => {
  const p = path.join(WS, 'ref', 'analysis', 'button-af', 'readiness', 't11-afon-acceptance-harness', 'out', f);
  return { path: 'ref/analysis/button-af/readiness/t11-afon-acceptance-harness/out/' + f, sha256: sha256(fs.readFileSync(p)) };
});
const tests = [];
const t = (name, fn) => tests.push({ name, fn });
const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
const fails = async (fn, re) => {
  try { await fn(); } catch (e) { if (re && !re.test(String(e.message))) throw new Error('wrong failure: ' + e.message); return String(e.message); }
  throw new Error('expected a failure' + (re ? ' matching ' + re : ''));
};

// ---------------- pure tests ----------------
let fakeIdentity = null;
const PURE_COMPLETIONS = {};
const runFake = async (planName, faults, identity, outName) => {
  const out = path.join(SCRATCH, 'pure', outName || (planName + '-' + Object.keys(faults || {}).join('-')));
  fs.mkdirSync(out, { recursive: true });
  return runPlan({ planName, mode: 'fake', planSha: 'plan-sha-test', freezeSha: null, adapter: createFakeAdapter(faults || {}), refs: fakeRefs(), outDir: out, identity });
};

t('relations on the retained T11 identity-v10 emulator records', () => {
  const { judge, evaluated } = evaluateT11(loadT11());
  const bad = judge.out.filter((x) => !x.ok);
  assert(evaluated === 80, 'evaluated ' + evaluated);
  assert(judge.out.length > 500, 'relations ' + judge.out.length);
  assert(bad.length === 0, JSON.stringify(bad.slice(0, 3)));
  return { evaluated, relations: judge.out.length };
});

t('T11 records: a wrong AF-ON press byte fails the named press reference', () => {
  const { judge } = evaluateT11(loadT11(), (id, s) => { if (id === 'candidate-af-down') s.target[0] ^= 1; return s; });
  const bad = judge.out.filter((x) => !x.ok);
  assert(bad.some((x) => x.op === 'candidate-af-down' && x.field === 'target' && x.source.includes('[' + AFON_PRESS_REFERENCE + ']')), JSON.stringify(bad));
  return { failed: bad.map((x) => x.op + ':' + x.field) };
});

t('correction 1: pose-after-edit compares all live cells with K2 and keeps the candidate mirror on its own source', () => {
  const t11 = loadT11();
  const cand = t11.lines.find((l) => l.id === 'candidate-pose-after-edit').actual;
  const k2 = t11.lines.find((l) => l.id === 'k2-pose-after-edit').actual;
  assert(cand.seals.mirror !== k2.seals.mirror, 'fixture mirrors differ by role');
  const ok = evaluateT11(t11).judge.out.filter((x) => x.op === 'candidate-pose-after-edit');
  assert(ok.every((x) => x.ok) && ok.some((x) => x.field === 'half' && x.source.includes('all-live-cells')), JSON.stringify(ok));
  assert(ok.some((x) => x.field === 'mirror' && x.source === 'ref:k1e:p-menu:half->mirror'), 'mirror source');
  const bad = evaluateT11(t11, (id, s) => { if (id === 'candidate-pose-after-edit') s.half.k5962[3] += 1; return s; }).judge.out.filter((x) => !x.ok);
  assert(bad.some((x) => x.field === 'half'), 'non-bank cell change must fail');
  return { relations: ok.length };
});

t('the AF-ON press reference is named in one place', () => {
  assert(PLAN.pressReference === AFON_PRESS_REFERENCE && PRESS_REFERENCES[AFON_PRESS_REFERENCE], 'reference');
  const code = fs.readFileSync(path.join(HERE, 'relations_v2.mjs'), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  assert((code.match(/'k1e-s1-down-halfTarget'/g) || []).length === 2, 'defined once and selected once');
  for (const f of ['exec_v4.mjs', 'gate_v2.mjs', 'expect_v1.mjs', 'fake_v2.mjs', 'real_v2.mjs']) {
    assert(!fs.readFileSync(path.join(HERE, f), 'utf8').includes('k1e-s1-down-halfTarget'), 'reference literal in ' + f);
  }
});

t('plan validator accepts the plans and rejects functions, getters, symbols and unknown keys', () => {
  assert(validatePlans().length === 0, validatePlans().join('; '));
  const clone = () => structuredClone(PLAN);
  const p1 = clone(); p1.sessions.k1e.ops[0].run = () => 1;
  const p2 = clone(); Object.defineProperty(p2.sessions.k2.ops[0], 'idleMs', { get: () => 0, enumerable: true });
  const p3 = clone(); p3.sessions.zk1e.ops[0][Symbol('x')] = 1;
  const p4 = clone(); p4.sessions.zcand.ops[0].extra = 1;
  const p5 = clone(); p5.sessions.k1e.ops.push({ ...p5.sessions.k1e.ops[0] });
  const r = [p1, p2, p3, p4, p5].map((p) => validatePlans(p));
  assert(r[0].some((x) => /function/.test(x)), 'function');
  assert(r[1].some((x) => /accessor/.test(x)), 'getter');
  assert(r[2].some((x) => /symbol/.test(x)), 'symbol');
  assert(r[3].some((x) => /unknown key extra/.test(x)), 'unknown key');
  assert(r[4].some((x) => /duplicate/.test(x)), 'duplicate');
  return { identity: expectedOps('identity').length, commits: commitOps('identity').length };
});

t('correction 5: bring-up is five operations and focus-arg stays separate, in setup_v2 order', () => {
  const ids = PLAN.sessions.k1e.ops.slice(0, 9).map((o) => o.setup);
  assert(JSON.stringify(ids) === JSON.stringify(['init-6071181e', 'init-608fe1b0', 'init-609df7e4', 'take-focus-act', 'take-focus-settle', 'lever', 'focus-arg', 'focus-289', 'focus-1712']), ids.join(','));
  for (const s of Object.values(PLAN.sessions)) assert(s.ops.filter((o) => o.setup === 'focus-arg').length === 1, s.id);
});

t('all plans end to end on the fake through the common implementation (core identity, and identity-all for displays)', async () => {
  const core = await runFake('identity', {}, null, 'identity-core');
  assert(core.ok && core.executed.length === expectedOps('identity').length && !core.executed.some((x) => x.startsWith('disp-')), 'core identity');
  const coreRows = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'pure', 'identity-core', 'identity.json'), 'utf8'));
  const proof = await runFake('proof', {}, coreRows, 'proof-core');
  assert(proof.ok && proof.reproduction.evaluated === expectedOps('proof').length, 'proof on the core identity');
  await fails(() => runFake('display-a', {}, coreRows, 'display-a-core'), /identity coverage refused/);
  const id = await runFake('identity-all', {}, null, 'identity');
  assert(id.ok && id.executed.length === expectedOps('identity-all').length, 'identity-all');
  fakeIdentity = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'pure', 'identity', 'identity.json'), 'utf8'));
  const counts = { identity: core.executed.length, 'identity-all': id.executed.length, 'proof-core': proof.executed.length };
  for (const p of ['proof', 'display-a', 'display-b', 'display-k2', 'display-k1']) {
    const c = await runFake(p, {}, fakeIdentity, p);
    PURE_COMPLETIONS[p] = c;
    assert(c.ok && c.reproduction.evaluated === expectedOps(p).length, p);
    counts[p] = c.executed.length;
  }
  return counts;
});

t('identity pass: faults fail on behaviour relations alone', async () => {
  const msgs = {};
  msgs.press = await fails(() => runFake('identity', { pressByte: 6 }), /relation target/);
  msgs.readBank = await fails(() => runFake('identity', { readBank: 3 }), /relation readBank/);
  msgs.poseLeak = await fails(() => runFake('identity', { poseLeak: 1 }), /poseWatch/);
  msgs.writer = await fails(() => runFake('identity', { writerExtra: 1 }), /writer calls/);
  msgs.subject = await fails(() => runFake('identity', { subject: 1 }), /subject/);
  msgs.zoneWriter = await fails(() => runFake('identity', { writerExtra: 1 }, null, 'identity-zw'), /writer calls/);
  return Object.fromEntries(Object.entries(msgs).map(([k, v]) => [k, v.slice(0, 90)]));
});

t('proof: wrong value, changed unexpected field, absent field and identity title each fail', async () => {
  const m = {};
  m.wrong = await fails(() => runFake('proof', { pressByte: 4 }, fakeIdentity), /differs from the sealed identity row/);
  m.drift = await fails(() => runFake('display-a', { frameDrift: 1 }, fakeIdentity), /frame/);
  m.absent = await fails(() => runFake('proof', { dropField: 'k2-k2-af-down' }, fakeIdentity), /field edge absent/);
  m.title = await fails(() => runFake('proof', { title: 1 }, fakeIdentity), /identity title/);
  m.link = await fails(() => runFake('proof', { loseLink: 1 }, fakeIdentity), /links/);
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.slice(0, 90)]));
});

t('preservation rule: a field the identity pass preserved must not change', () => {
  const state = (owner) => ({ slots: [], mirror71: [], sizeRecord: [], flag: 0, target: [], halfTarget: [], owner, subject: 0, poseWord: 1, screen: 's', edge: {}, readBank: null, frame: null });
  const sealed = { before: state(5), after: state(5), ident: null };
  const r = reproduce(sealed, { before: state(5), after: state(6), commit: false });
  assert(r.problems.some((p) => /owner changed where the identity pass preserved it/.test(p)), r.problems.join('; '));
  assert(r.fields.owner === 'sealed+preserve', 'source map');
});

t('static missing row: identity coverage refuses before any session (zero deliveries)', async () => {
  const id = structuredClone(fakeIdentity);
  delete id.rows[rowKey('plan-sha-test', 'candidate', 'candidate-af-down')];
  let delivered = 0;
  const adapter = { runSession: async () => { delivered += 1; } };
  const msg = await fails(() => runPlan({ planName: 'proof', mode: 'fake', planSha: 'plan-sha-test', freezeSha: null, adapter, refs: fakeRefs(), outDir: fs.mkdtempSync(path.join(SCRATCH, 'cov-')), identity: id }), /identity coverage refused/);
  assert(delivered === 0, 'session started');
  return { msg: msg.slice(0, 80) };
});

t('dynamic missing row: the gate refuses a commit with zero deliveries; unmarked commit keys are classified', async () => {
  const calls = [];
  const deliver = new Proxy({}, { get: (_t, k) => (...a) => { calls.push([k, ...a]); } });
  const gate = createGate('s', deliver, {
    capture: () => ({}), frame: () => null, idle: () => {}, settleWindow: async () => null, identityNow: () => ({}),
    presence: () => ({ ok: false, problems: ['no row'] }), requireFrame: () => false,
  });
  await fails(() => gate.perform({ id: 'x', action: 'key', key: 'ok', dir: 'down', idleMs: 0 }), /refused before delivery/);
  assert(calls.length === 0 && gate.deliveries() === 0 && gate.refused() === 1, 'delivered');
  for (const key of ['ok', 'menu', 'afon', 's1']) assert(classifyCommit({ action: 'key', key }), key);
  for (const op of [{ action: 'key', key: 'up' }, { action: 'dial' }, { action: 'set', key: 'ok' }]) assert(!classifyCommit(op), JSON.stringify(op));
});

t('identity is read after the input and its settle', async () => {
  const order = [];
  const gate = createGate('s', { key: () => order.push('deliver') }, {
    capture: (_f, _o, when) => { order.push('capture-' + when); return {}; }, frame: () => null, idle: () => order.push('idle'),
    settleWindow: async () => null, identityNow: () => { order.push('identity'); return {}; }, presence: () => ({ ok: true, problems: [] }), requireFrame: () => false,
  });
  await gate.perform({ id: 'x', action: 'key', key: 's1', dir: 'up', idleMs: 400 });
  assert(JSON.stringify(order) === JSON.stringify(['capture-before', 'deliver', 'idle', 'identity', 'capture-after']), order.join(','));
});

t('correction 6: raw delivery wrappers refuse outside the gate', async () => {
  let delivering = false;
  const obj = { key: () => 'k', dial_input: () => 'd', inject: () => 'i', g4_set: () => 'g', set: () => 's', switch_input: () => 'w' };
  const raw = guardDelivery(obj, Object.keys(obj), () => delivering, 'session');
  for (const name of Object.keys(obj)) {
    await fails(() => obj[name](), new RegExp('raw session.' + name + ' outside the gate'));
    delivering = true; assert(obj[name]() === raw[name](), name); delivering = false;
  }
  let fakeRaw = null;
  const spec = PLAN.sessions.k1e;
  await createFakeAdapter().runSession(spec, async ({ observe }) => { fakeRaw = observe.guarded; }, { presence: () => ({ ok: true, problems: [] }), refs: fakeRefs() });
  await fails(() => fakeRaw.key('ok', 'down'), /outside the gate/);
});

t('deleting an identity-bearing operation removes it from execution and coverage together', () => {
  const p = structuredClone(PLAN);
  const ops = p.sessions.candidate.ops;
  const at = ops.findIndex((o) => o.id === 'candidate-af-down');
  ops.splice(at, 1);
  assert(!expectedOps('proof', p).includes('candidate:candidate-af-down'), 'execution');
  assert(!commitOps('proof', p).includes('candidate:candidate-af-down'), 'coverage');
  assert(expectedOps('proof', p).length === expectedOps('proof').length - 1, 'one fewer');
});

t('custom zone is reached and judged', () => {
  const log = fs.readFileSync(path.join(SCRATCH, 'pure', 'identity', 'log.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const press = log.find((r) => r.id === 'zcand-custom-af-down');
  assert(press && press.pass && press.sourceMap.relations.some((x) => x.source === 'ref:zk1e:custom:s1-down:target'), 'custom press');
  const rel = log.find((r) => r.id === 'zcand-custom-af-up');
  assert(rel && rel.sourceMap.relations.some((x) => x.source === 'ref:zk1e:custom:s1-up:target'), 'custom release');
});

t('pose instrumentation toggles change no refusal (accepted predicates_v3)', () => {
  let n = 0;
  for (const poseActive of [false, true]) for (const mode of [0, 1]) for (const key of [0x5962, 0x99a1, 0x1dd1]) for (const index of [0, 4]) for (const value of [526, 409]) {
    const write = { mode, key, index, value, live: 526, mirrored: 409, bank: 0, reset: 526 };
    const a = createPoseGate(); const b = createPoseGate();
    if (poseActive) { a.issue(); b.issue(); }
    b.setWatch(true);
    assert(a.decide(write) === b.decide(write), JSON.stringify(write));
    n += 1;
  }
  return { cases: n };
});

t('recorder: return-hook completion, substitution, categories, orphan, null, unclosed, in-window sampling', () => {
  const mk = () => {
    const obs = new Map(); const hooks = new Map(); const clock = { t: 0 };
    const l = { hooks, lab_time: () => clock.t, observe: (a, f) => obs.set(a, f), hook_rt: (a, f) => hooks.set(a, f), passthrough() {} };
    return { l, obs, hooks, clock, fire: (a, r) => obs.get(a)(l, r), ret: (a, r) => { const f = hooks.get(a); f({}, r); } };
  };
  const E = 0x61184dd6; const G = 0x60063380;
  // Complete window with a getter, in-window sample, a substitution and an assert getter outside.
  const a = mk();
  let cat = null;
  const ra = installRefresh({ l: a.l, native: (x) => x }, { hookGetter: true, category: () => cat, sampleNow: () => ra.sample({ s: 1 }, a.clock.t) });
  a.clock.t = 10; a.fire(E, { mdr: 0x60001000 });
  a.fire(G, { d0: 0x88b2, d1: 0, mdr: 0x60002000 }); a.ret(0x60002000, { d0: 526 });
  ra.noteGetter({ t: 11, key: 0x99a1, index: 0, ret: 2, substituted: true }, null);
  a.clock.t = 12; a.ret(0x60001000, {});
  cat = 'assert'; a.fire(G, { d0: 0x1e71, d1: 0, mdr: 0x60003000 }); a.ret(0x60003000, { d0: 0 });
  assert(ra.problems().length === 0, ra.problems().join(','));
  assert(ra.windows.length === 1 && ra.windows[0].sampleT === 10 && ra.windows[0].calls.length === 2 && ra.outside.length === 1, 'window');
  assert(ra.windows[0].calls.some((c) => c.substituted), 'substitution');
  // Orphan getter (no category), null return, unclosed window.
  const b = mk();
  const rb = installRefresh({ l: b.l, native: (x) => x }, { hookGetter: true, category: () => null });
  b.fire(G, { d0: 1, d1: 0, mdr: 0x60004000 });
  b.fire(E, { mdr: 0x60005000 });
  b.fire(G, { d0: 2, d1: 0, mdr: 0x60006000 });
  b.ret(0x60005000, {});
  b.fire(E, { mdr: 0x60008000 });
  const p = rb.problems();
  assert(p.includes('orphan') && p.includes('null-orphan') && p.includes('unclosed-current') && p.some((x) => /^null r0/.test(x)), p.join(','));
  // A sample outside the window does not stamp it.
  const c = mk();
  const rc = installRefresh({ l: c.l, native: (x) => x }, {});
  c.clock.t = 5; c.fire(E, { mdr: 0x60007000 }); c.clock.t = 6; c.ret(0x60007000, {});
  rc.sample({ s: 2 }, 9);
  assert(rc.problems().includes('unstamped r0'), rc.problems().join(','));
});

t('correction 4: tag validation and output containment', async () => {
  for (const bad of ['', 'A', '../x', 'a/b', 'a\\b', 'a.launch', '-a', 'x'.repeat(49), 'a b']) await fails(() => validateTag(bad), /bad tag/);
  const p = outPaths('C:/w', 'ok-tag-1');
  assert(p.child !== p.launch && p.launch.endsWith('ok-tag-1.launch'), 'paths');
});

t('exit checks: missing, truncated, reordered and tampered inventory; missing or short completion', () => {
  const dir = fs.mkdtempSync(path.join(SCRATCH, 'inv-'));
  const f = path.join(dir, 'inventory.jsonl');
  assert(readInventory(f).problems.includes('inventory missing'), 'missing');
  let chain = sha256('t13-inventory-v3');
  const lines = [];
  for (let i = 1; i <= 3; i++) { const line = JSON.stringify({ seq: i, kind: 'load', path: 'C:/x/' + ['run_v5.mjs', 'inventory_v3.mjs', 'exec_v4.mjs'][i - 1], sha256: 'h', bytes: 1 }); chain = sha256(chain + '\n' + line); lines.push(line); }
  fs.writeFileSync(f, lines.join('\n') + '\n' + JSON.stringify({ seq: 4, kind: 'end', count: 3, chain }) + '\n');
  assert(readInventory(f).problems.length === 0, readInventory(f).problems.join(','));
  fs.writeFileSync(f, lines.join('\n') + '\n');
  assert(readInventory(f).problems.some((x) => /truncated/.test(x)), 'truncated');
  fs.writeFileSync(f, [lines[0], lines[2], lines[1]].join('\n') + '\n' + JSON.stringify({ seq: 4, kind: 'end', count: 3, chain }) + '\n');
  assert(readInventory(f).problems.some((x) => /sequence|chain/.test(x)), 'reordered');
  fs.writeFileSync(f, lines.join('\n').replace('"h"', '"g"') + '\n' + JSON.stringify({ seq: 4, kind: 'end', count: 3, chain }) + '\n');
  assert(readInventory(f).problems.some((x) => /chain/.test(x)), 'tampered');
  const want = { plan: 'proof', planSha: 'p', mode: 'fake', expected: ['a', 'b'] };
  assert(checkCompletion(path.join(dir, 'none.json'), want).problems.includes('completion record missing'), 'missing completion');
  fs.writeFileSync(path.join(dir, 'c.json'), JSON.stringify({ ok: true, plan: 'proof', planSha: 'p', mode: 'fake', executed: ['a'], relations: { evaluated: 3, failed: 0 }, reproduction: { evaluated: 1 } }));
  assert(checkCompletion(path.join(dir, 'c.json'), want).problems.some((x) => /exactly the plan operations/.test(x)), 'short completion');
  const e = checkEntries([{ kind: 'load', path: 'C:/x/run_v5.mjs', sha256: 'h' }], new Map(), ['C:/x'], { mode: 'real' });
  assert(e.problems.some((x) => /outside the freeze/.test(x)) && e.problems.some((x) => /lacks the load of exec_v4/.test(x)) && e.problems.some((x) => /lacks the load of real_v2/.test(x)), e.problems.join(','));
  const f2 = checkEntries([{ kind: 'load', path: 'C:/x/real_v2.mjs', sha256: 'h' }], null, ['C:/x'], { mode: 'fake' });
  assert(f2.problems.some((x) => /mode fake loaded real_v2/.test(x)), 'mode-specific forbidden load');
  const ext = [{ logical: 'work/out/t.launch/nonce', canonical: 'C:/x/nonce', sha256: 'n', reason: 'nonce' }];
  assert(checkEntries([], null, ['C:/x'], { extension: ext }).problems.some((x) => /not recorded as consumed \(nonce\)/.test(x)), 'nonce consumption');
  assert(checkEntries([{ kind: 'preread', path: 'C:/x/nonce', sha256: 'm' }], null, ['C:/x'], { extension: ext }).problems.some((x) => /another hash/.test(x)), 'nonce hash');
  assert(checkCompletion(path.join(dir, 'c.json'), { ...want, recorderSessions: ['disp-k1'] }).problems.some((x) => /refresh records for/.test(x)), 'recorder session required');
});

t('reused modules are byte-identical to the accepted T12 copies', () => {
  const src = path.join(WS, 'ref', 'analysis', 'button-af', 'readiness', 't12-afon-harness-completion', 'harness');
  const out = {};
  for (const f of ['afon_hooks_v7.mjs', 'state_v1.mjs', 'predicates_v3.mjs', 'refresh_v4.mjs', 'table_v2.mjs', 'check_table_v3.mjs']) {
    const a = sha256(fs.readFileSync(path.join(src, f)));
    assert(a === sha256(fs.readFileSync(path.join(HERE, f))), f);
    out[f] = a.slice(0, 12);
  }
  return out;
});

t('real-path modules load without starting the emulator; delivery names cover the design list', async () => {
  const real = await import('./real_v2.mjs');
  const session = await import('./session_v2.mjs');
  assert(typeof real.createRealAdapter === 'function' && typeof session.runZone === 'function', 'exports');
  for (const n of ['key', 'dial_input', 'inject', 'g4_set', 'set', 'switch_input']) assert(real.DELIVERY_S.includes(n), n);
  for (const n of ['key', 'press']) assert(real.DELIVERY_CTX.includes(n), n);
  const f = real.asFrame({ marks: [{ x: 1, y: 2, w: 3, h: 4 }], pixels: 5, n31: 5 });
  assert(f.boxes.length === 1 && /^[0-9a-f]{64}$/.test(f.sha256), 'asFrame');
});

t('session_v2.diff is the retained diff of session_v2.mjs against zone_session_k1.mjs', () => {
  const src = path.join(WS, 'ref', 'analysis', 'button-af', 'readiness', 't5-afon-button-handoff', 'scripts', 'zone_session_k1.mjs');
  const a = fs.readFileSync(src, 'utf8').replaceAll('\r\n', '\n').split('\n');
  const b = fs.readFileSync(path.join(HERE, 'session_v2.mjs'), 'utf8').replaceAll('\r\n', '\n').split('\n');
  const diff = fs.readFileSync(path.join(HERE, 'session_v2.diff'), 'utf8').split('\n');
  const removed = diff.filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1));
  const added = diff.filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
  for (const l of removed) assert(a.includes(l) && !b.includes(l) || b.filter((x) => x === l).length < a.filter((x) => x === l).length, 'removed line still present: ' + l);
  for (const l of added) assert(b.includes(l), 'added line absent: ' + l);
  const keep = a.filter((l) => !removed.includes(l));
  for (const l of keep) assert(b.includes(l), 'unchanged line lost: ' + l);
  // The permitted areas are outputs, NVRAM, bring-up and the overlay CSV path. Every hook, observer, overlay,
  // help-record, face-record and 0x120b line of the original must survive unchanged.
  const anchors = a.filter((l) => /l\.hook\(|l\.observe\(|UIIN_ENTRIES|apply_uiin_layout|patchedFirmware|helpRecords|byOff\.set|face\.write|HELP_|writeU32\(|l\.sim\.write\(|PLAYER_PARSER|new Player|camapp_/.test(l));
  for (const l of anchors) assert(!removed.includes(l), 'protected line changed: ' + l.trim());
  const removedText = removed.join('\n');
  for (const word of ['fileNvram', 'work/out', 'const inits = [];', 'checkout, outPath, tag, drive }', "from 'node:path'"]) assert(removedText.includes(word), 'expected change missing: ' + word);
  assert(removed.length <= 30 && added.length <= 70, 'diff size ' + removed.length + '/' + added.length);
  return { removed: removed.length, added: added.length, protectedLines: anchors.length };
});

// ---------------- launcher and child tests (scratch workspace) ----------------
const SWS = path.join(SCRATCH, 'ws');
const SH = path.join(SWS, 'work', 'harness');
let FREEZE_SHA = null;
const launch = (args, opts = {}) => spawnSync(NODE, [path.join(SH, 'launch_v5.mjs'), ...args], { cwd: SWS, encoding: 'utf8', ...opts });
const exitOf = (tag) => JSON.parse(fs.readFileSync(path.join(SWS, 'work', 'out', tag + '.launch', 'exit.json'), 'utf8'));

t('scratch workspace: copy, junction, minimal freeze through six capture runs', () => {
  fs.mkdirSync(SH, { recursive: true });
  for (const f of fs.readdirSync(HERE)) {
    fs.copyFileSync(path.join(HERE, f), path.join(SH, f));
    assert(sha256(fs.readFileSync(path.join(SH, f))) === FINGERPRINTS[f], 'copy differs from the tested source: ' + f);
  }
  const j = spawnSync('cmd', ['/c', 'mklink', '/J', path.join(SWS, 'ref'), fs.realpathSync.native(path.join(WS, 'ref'))], { encoding: 'utf8' });
  assert(j.status === 0, 'junction ' + j.stderr);
  const r = spawnSync(NODE, [path.join(SH, 'make_freeze_v5.mjs'), 'cap', '--minimal'], { cwd: SWS, encoding: 'utf8' });
  assert(r.status === 0, 'make_freeze ' + r.stderr + r.stdout);
  const out = JSON.parse(r.stdout.trim().split('\n').pop());
  FREEZE_SHA = out.sha256;
  for (const p of ['identity', 'proof']) {
    const e = exitOf('cap-' + p);
    assert(e.mode === 'capture' && e.ok === false && e.valid === false && e.captureComplete === true, 'capture ' + p);
  }
  return { files: out.files, sha256: FREEZE_SHA.slice(0, 16) };
});

t('fake runs through the launcher: core identity then proof ok but never valid; display plans refused without a display identity', () => {
  const out = {};
  let r = launch(['identity', 'f-identity', '--freeze-sha', FREEZE_SHA, '--fake']);
  let e = exitOf('f-identity');
  assert(r.status === 0 && e.ok === true && e.valid === false && e.mode === 'fake', JSON.stringify(e.problems));
  assert(e.completion.recorder.length === 0, 'core identity has no recorder session');
  out.identity = e.completion.executed;
  r = launch(['proof', 'f-proof', '--freeze-sha', FREEZE_SHA, '--fake', '--identity', 'f-identity']);
  e = exitOf('f-proof');
  assert(r.status === 0 && e.ok === true && e.valid === false, 'proof ' + JSON.stringify(e.problems));
  out.proof = e.completion.reproduction.evaluated;
  r = launch(['display-a', 'f-display-a', '--freeze-sha', FREEZE_SHA, '--fake', '--identity', 'f-identity']);
  e = exitOf('f-display-a');
  assert(r.status === 1 && e.ok === false && JSON.stringify(e.problems).includes('identity coverage refused'), 'display refused ' + JSON.stringify(e.problems));
  const ident = launch(['identity-all', 'f-identity-all', '--freeze-sha', FREEZE_SHA, '--fake']);
  assert(ident.status === 1 && /unknown plan identity-all/.test(fs.readFileSync(path.join(SWS, 'work', 'out', 'f-identity-all.launch', 'exit.json'), 'utf8')), 'identity-all not launchable');
  return out;
});

t('refused: wrong freeze digest writes a failing exit record', () => {
  const r = launch(['identity', 'bad-digest', '--freeze-sha', '0'.repeat(64), '--fake']);
  const e = exitOf('bad-digest');
  assert(r.status === 1 && e.ok === false && e.problems.some((p) => /freeze digest/.test(p)), JSON.stringify(e.problems));
});

t('refused: an existing tag; its evidence is preserved', () => {
  const before = fs.readFileSync(path.join(SWS, 'work', 'out', 'f-identity.launch', 'exit.json'));
  const r = launch(['identity', 'f-identity', '--freeze-sha', FREEZE_SHA, '--fake']);
  assert(r.status === 2 && /tag exists/.test(r.stderr), r.stderr);
  assert(Buffer.compare(before, fs.readFileSync(path.join(SWS, 'work', 'out', 'f-identity.launch', 'exit.json'))) === 0, 'exit.json changed');
  assert(fs.readdirSync(path.join(SWS, 'work', 'out', '_refusals')).some((f) => f.startsWith('f-identity-')), 'refusal record');
});

t('refused: unlisted file in a frozen directory, changed file, link inside a frozen directory', () => {
  const extra = path.join(SH, 'planted.mjs');
  fs.writeFileSync(extra, 'export const x = 1;\n');
  launch(['identity', 'bad-unlisted', '--freeze-sha', FREEZE_SHA, '--fake']);
  fs.rmSync(extra);
  assert(exitOf('bad-unlisted').problems.some((p) => /unlisted file in work\/harness: work\/harness\/planted.mjs/.test(p)), 'unlisted');
  const target = path.join(SH, 'common_v1.mjs');
  const saved = fs.readFileSync(target);
  fs.appendFileSync(target, '// changed\n');
  launch(['identity', 'bad-changed', '--freeze-sha', FREEZE_SHA, '--fake']);
  fs.writeFileSync(target, saved);
  assert(exitOf('bad-changed').problems.some((p) => /sha256 work\/harness\/common_v1.mjs|length work\/harness\/common_v1.mjs/.test(p)), 'changed');
  const link = path.join(SH, 'linked');
  spawnSync('cmd', ['/c', 'mklink', '/J', link, path.join(SWS, 'ref')]);
  launch(['identity', 'bad-link', '--freeze-sha', FREEZE_SHA, '--fake']);
  fs.rmdirSync(link);
  assert(exitOf('bad-link').problems.some((p) => /link inside work\/harness/.test(p)), 'link ' + JSON.stringify(exitOf('bad-link').problems));
});

t('refused: missing identity, identity of another mode, capture identity for a fake proof', () => {
  launch(['proof', 'bad-noid', '--freeze-sha', FREEZE_SHA, '--fake']);
  assert(exitOf('bad-noid').problems.some((p) => /needs --identity/.test(p)), 'no identity');
  launch(['proof', 'bad-capid', '--freeze-sha', FREEZE_SHA, '--fake', '--identity', 'cap-identity']);
  assert(exitOf('bad-capid').problems.some((p) => /not ok|mode capture != fake/.test(p)), 'capture identity');
  launch(['proof', 'bad-realid', '--freeze-sha', FREEZE_SHA, '--identity', 'f-identity']);
  assert(exitOf('bad-realid').problems.some((p) => /identity mode fake != real/.test(p)), 'real proof on fake identity ' + JSON.stringify(exitOf('bad-realid').problems));
  const idj = path.join(SWS, 'work', 'out', 'f-identity', 'identity.seal.json');
  const saved = fs.readFileSync(idj);
  fs.appendFileSync(idj, ' ');
  launch(['proof', 'bad-seal', '--freeze-sha', FREEZE_SHA, '--fake', '--identity', 'f-identity']);
  fs.writeFileSync(idj, saved);
  assert(exitOf('bad-seal').problems.some((p) => /identity output identity.seal.json changed/.test(p)), 'seal');
});

t('refused: runtime not the frozen one', () => {
  const f = path.join(SWS, 'work', 'freeze', 'freeze_v1.json');
  const raw = fs.readFileSync(f);
  const fr = JSON.parse(raw);
  const rt = fr.files.find((x) => x.path === fr.runtime.path);
  rt.sha256 = '0'.repeat(64);
  const alt = Buffer.from(JSON.stringify(fr, null, 1) + '\n');
  fs.writeFileSync(f, alt);
  launch(['identity', 'bad-runtime', '--freeze-sha', sha256(alt), '--fake']);
  fs.writeFileSync(f, raw);
  assert(exitOf('bad-runtime').problems.some((p) => /sha256 ref\/tooling|runtime sha256/.test(p)), JSON.stringify(exitOf('bad-runtime').problems));
});

t('grants: files inside frozen directories are covered by the directory grant only', () => {
  const facts = new Map();
  for (let i = 0; i < 1000; i++) facts.set('om-emu/f' + i, { logical: 'om-emu/f' + i, physical: 'C:\\w\\om-emu\\f' + i, canonical: 'C:\\w\\om-emu\\f' + i });
  facts.set('ref/x.mjs', { logical: 'ref/x.mjs', physical: 'C:\\w\\ref\\x.mjs', canonical: 'C:\\r\\x.mjs' });
  const g = readGrants({ facts, dirs: [{ logical: 'om-emu', physical: 'C:\\w\\om-emu', canonical: 'C:\\w\\om-emu' }] }, []);
  assert(g.length === 3 && g.includes('C:\\w\\om-emu\\') && g.includes('C:\\w\\ref\\x.mjs') && g.includes('C:\\r\\x.mjs'), JSON.stringify(g));
});

t('drift at exit: a frozen file changed after verification is reported', () => {
  const ws2 = SWS;
  const fr = JSON.parse(fs.readFileSync(path.join(ws2, 'work', 'freeze', 'freeze_v1.json'), 'utf8'));
  const check = verifyFreeze(ws2, fr);
  assert(check.problems.length === 0, check.problems.join(','));
  const target = path.join(SH, 'seal_v1.mjs');
  const saved = fs.readFileSync(target);
  fs.appendFileSync(target, '//x\n');
  const p = reverify(ws2, fr, check.facts);
  fs.writeFileSync(target, saved);
  assert(p.some((x) => /at exit: changed work\/harness\/seal_v1.mjs/.test(x)), p.join(','));
});

const childFlags = (out, extra = []) => {
  const reads = [SH + path.sep, path.join(SWS, 'ref') + path.sep, fs.realpathSync.native(path.join(SWS, 'ref')) + path.sep];
  return ['--permission', ...reads.map((r) => '--allow-fs-read=' + r), ...extra, '--allow-fs-write=' + out + path.sep];
};
const childArgs = (out, flags, nonce) => ['--plan', 'identity', '--tag', 'x', '--mode', 'fake', '--out', out, '--nonce', nonce, '--freeze-sha', 'none', '--plan-sha', 'x', '--execargv-sha', createHash('sha256').update(JSON.stringify(flags)).digest('hex'), '--sentinel', path.join(SWS, 'not-granted.txt')];
const cleanEnv = { SystemRoot: process.env.SystemRoot, PATH: path.dirname(NODE) };

t('child refuses an unrestricted start, wrong flags, NODE_OPTIONS and a missing nonce', () => {
  const out = fs.mkdtempSync(path.join(SCRATCH, 'child-'));
  const nonce = path.join(SH, 'nonce-missing.txt');
  const flags = childFlags(out);
  const run = (f, env) => spawnSync(NODE, [...f, path.join(SH, 'run_v5.mjs'), ...childArgs(out, f, nonce)], { cwd: SWS, encoding: 'utf8', env });
  const a = spawnSync(NODE, [path.join(SH, 'run_v5.mjs'), ...childArgs(out, [], nonce)], { cwd: SWS, encoding: 'utf8', env: cleanEnv });
  assert(a.status === 3 && /not started under --permission/.test(a.stderr), a.stderr);
  const extra = childFlags(out, ['--allow-addons']);
  const b = run(extra, cleanEnv);
  assert(b.status === 3 && /unexpected flag --allow-addons/.test(b.stderr), b.stderr);
  const c = run(flags, { ...cleanEnv, NODE_OPTIONS: '--max-old-space-size=512' });
  assert(c.status === 3 && /environment NODE_OPTIONS is set/.test(c.stderr), c.stderr);
  const d = run(flags, cleanEnv);
  assert(d.status === 3 && /nonce unreadable/.test(d.stderr), d.stderr);
  return { unrestricted: a.status, flags: b.status, nodeOptions: c.status, nonce: d.status };
});

t('abnormal child exit writes a failing exit record', async () => {
  const tag = 'killed';
  const child = spawn(NODE, [path.join(SH, 'launch_v5.mjs'), 'identity', tag, '--freeze-sha', FREEZE_SHA, '--fake'], { cwd: SWS, stdio: 'ignore' });
  const stdout = path.join(SWS, 'work', 'out', tag + '.launch', 'stdout.txt');
  let pid = null;
  for (let i = 0; i < 400 && pid == null; i++) {
    await new Promise((r) => setTimeout(r, 25));
    try { const line = fs.readFileSync(stdout, 'utf8').split('\n')[0]; if (line) pid = JSON.parse(line).pid; } catch { /* not yet */ }
  }
  assert(pid, 'child pid');
  process.kill(pid);
  await new Promise((r) => child.on('close', r));
  const e = exitOf(tag);
  assert(e.ok === false && e.problems.some((p) => /child exit|completion|inventory truncated/.test(p)), JSON.stringify(e.problems));
  return { problems: e.problems.slice(0, 3) };
});

t('code review 2: every fs and fs/promises function on the pinned runtime is classified', () => {
  const left = unclassified();
  assert(left.length === 0, 'unclassified: ' + left.join(', '));
  return { fs: Object.values(FS_CLASSES).flat().length, promises: Object.values(PROMISES_CLASSES).flat().length };
});

t('code review 2: every content, metadata and listing interface records its own target; refused ones are refused', () => {
  const pdir = path.join(SCRATCH, 'probe-ok');
  const ddir = path.join(SCRATCH, 'probe-denied');
  const out = path.join(SCRATCH, 'probe-out');
  for (const d of [pdir, ddir, out]) fs.mkdirSync(d, { recursive: true });
  const content = {};
  for (let i = 1; i <= 19; i++) {
    const n = 'c' + String(i).padStart(2, '0') + (i === 10 ? '.cjs' : i === 11 ? '.mjs' : '.txt');
    const body = i === 10 ? 'module.exports = 10;\n' : i === 11 ? 'export default 11;\n' : 'content ' + i + '\n';
    fs.writeFileSync(path.join(pdir, n), body);
    content[n] = sha256(Buffer.from(body));
  }
  const meta = [];
  fs.mkdirSync(path.join(pdir, 'jt'));
  for (let i = 1; i <= 28; i++) {
    const id = String(i).padStart(2, '0');
    if ([9, 10, 11, 12, 13, 28].includes(i)) { fs.mkdirSync(path.join(pdir, 'd' + id)); fs.writeFileSync(path.join(pdir, 'd' + id, 'x.txt'), 'x\n'); meta.push('d' + id); }
    else if ([18, 20, 21].includes(i)) {
      const j = spawnSync('cmd', ['/c', 'mklink', '/J', path.join(pdir, 'L' + id), path.join(pdir, 'jt')], { encoding: 'utf8' });
      assert(j.status === 0, 'junction L' + id);
      meta.push('L' + id);
    } else { fs.writeFileSync(path.join(pdir, 'm' + id + '.txt'), 'm\n'); meta.push('m' + id + '.txt'); }
  }
  fs.writeFileSync(path.join(pdir, 'pre.txt'), 'pre\n');
  for (const n of ['b.txt', 'b.mjs', 'b.cjs']) fs.writeFileSync(path.join(ddir, n), 'x\n');
  // The probe may also read its own output directory (copy destinations are checked there).
  const flags = ['--permission', '--allow-fs-read=' + pdir + path.sep, '--allow-fs-read=' + SH + path.sep, '--allow-fs-read=' + out + path.sep, '--allow-fs-write=' + out + path.sep];
  const r = spawnSync(NODE, [...flags, path.join(SH, 'probe_v3.mjs'), pdir, ddir, out], { cwd: SWS, encoding: 'utf8', env: cleanEnv });
  fs.writeFileSync(path.join(out, 'probe.stdout.txt'), r.stdout);
  fs.writeFileSync(path.join(out, 'probe.stderr.txt'), r.stderr);
  fs.writeFileSync(path.join(out, 'probe.cmd.json'), JSON.stringify({ node: NODE, flags, entry: path.join(SH, 'probe_v3.mjs'), args: [pdir, ddir, out], exit: r.status }, null, 2) + '\n');
  assert(r.status === 0, r.stderr);
  const res = JSON.parse(r.stdout.trim().split('\n').pop());
  for (const [k, v] of Object.entries(res.ok)) assert(v === 'ok', 'permitted ' + k + ': ' + v);
  for (const [k, v] of Object.entries(res.refused)) assert(v !== 'ok', 'refused ' + k + ' was allowed');
  assert(res.unclassified.length === 0, 'unclassified after install');
  const inv = readInventory(path.join(out, 'inventory.jsonl'));
  assert(inv.problems.length === 0, inv.problems.join(','));
  const at = (name) => inv.entries.filter((e) => e.path && path.basename(e.path) === name);
  for (const [n, h] of Object.entries(content)) {
    const es = at(n).filter((e) => ['read', 'open', 'load'].includes(e.kind));
    assert(es.length && es.every((e) => e.sha256 === h && e.bytes > 0), 'content not recorded with path, length and hash: ' + n);
  }
  for (const n of meta) {
    const es = at(n).filter((e) => e.kind === 'meta');
    assert(es.length, 'metadata/listing not recorded: ' + n);
  }
  const pre = at('pre.txt').find((e) => e.kind === 'preread');
  assert(pre && pre.sha256 === sha256(Buffer.from('pre\n')), 'preread');
  for (const api of ['fs.openAsBlob', 'fs.watch', 'fs.watchFile', 'fs.promises.watch', 'fs.cpSync', 'fs.promises.cp', 'fs.globSync', 'fs.glob', 'fs.promises.glob', 'fs.realpath']) assert(inv.entries.some((e) => e.kind === 'refused' && e.api === api), 'refusal recorded: ' + api);
  assert(inv.entries.some((e) => e.kind === 'forbidden' && e.url === 'node:sqlite'), 'forbidden built-in');
  assert(inv.entries.some((e) => e.kind === 'unknown-fd' && e.fd === 987), 'unknown descriptor');
  assert(!inv.entries.some((e) => e.path && e.path.includes('probe-denied')), 'denied path recorded');
  const allowed = new Map();
  for (const n of [...Object.keys(content), 'pre.txt']) allowed.set(path.join(pdir, n).replaceAll('\\', '/').toLowerCase(), { sha256: sha256(fs.readFileSync(path.join(pdir, n))) });
  for (const f of ['probe_v3.mjs', 'inventory_v3.mjs', 'common_v1.mjs']) allowed.set(path.join(SH, f).replaceAll('\\', '/').toLowerCase(), { sha256: sha256(fs.readFileSync(path.join(SH, f))) });
  const c = checkEntries(inv.entries, allowed, [SCRATCH]);
  const unexpected = c.problems.filter((p) => !/forbidden|unknown-fd|refused|lacks the load of/.test(p));
  assert(unexpected.length === 0, unexpected.join(' | '));
  allowed.delete(path.join(pdir, 'c07.txt').replaceAll('\\', '/').toLowerCase());
  assert(checkEntries(inv.entries, allowed, [SCRATCH]).problems.some((p) => /outside the freeze.*c07.txt/.test(p)), 'unlisted read detected');
  return { permitted: Object.keys(res.ok).length, refused: Object.keys(res.refused).length, entries: inv.count, evidence: path.relative(WS, out).replaceAll('\\', '/') };
});

t('code review 2: launcher runs record the nonce and the freeze as consumed inputs', () => {
  const inv = readInventory(path.join(SWS, 'work', 'out', 'f-identity', 'inventory.jsonl'));
  const ext = JSON.parse(fs.readFileSync(path.join(SWS, 'work', 'out', 'f-identity.launch', 'inputs.json'), 'utf8'));
  for (const reason of ['nonce', 'freeze']) {
    const e = ext.find((x) => x.reason === reason);
    assert(e, 'extension lacks ' + reason);
    assert(inv.entries.some((r) => r.kind === 'preread' && r.path.toLowerCase() === e.canonical.toLowerCase() && r.sha256 === e.sha256), reason + ' not recorded as consumed');
  }
  const p = JSON.parse(fs.readFileSync(path.join(SWS, 'work', 'out', 'f-proof.launch', 'inputs.json'), 'utf8'));
  assert(p.filter((x) => x.reason === 'identity').length === 2, 'identity extension');
});

t('code review 1: display roles get no pose path; stock K1 gets no hook; construction makes no native call', async () => {
  const real = await import('./real_v2.mjs');
  const out = {};
  for (const spec of Object.values(PLAN.sessions)) {
    const calls = { attachPose: 0, installCombined: 0, installRefresh: 0, labCall: 0 };
    const deps = {
      attachPose: () => { calls.attachPose += 1; return { setPose() {}, deliver() {} }; },
      installCombined: () => { calls.installCombined += 1; return { reads: [], counts: { writer: 0 }, refresh() {}, enter() {}, armWatches() {}, drainWatches: () => [] }; },
      installRefresh: () => { calls.installRefresh += 1; return { windows: [], outside: [], orphans: [], samples: [], problems: () => [], sample() {}, noteGetter() {}, currentId: () => null }; },
      captureState: () => ({}),
    };
    const s = { key() {}, dial_input() {}, inject() {}, g4_set() {}, set() {}, switch_input() {}, camapp: { pump() {} }, frame: () => null, screen: () => 'shooting' };
    const ctx = { s, l: { lab_time: () => 0, call: () => { calls.labCall += 1; return { d0: 0 }; }, sim: {} }, key() {}, press() {}, readOwn: () => [], bringUpSteps: {}, emit() {}, idle() {}, screen: () => ({}), shot() {} };
    await real.driveSession(ctx, spec, async () => {}, { refs: { display: {} }, outDir: SCRATCH, presence: () => ({ ok: true, problems: [] }), modelMod: {}, menuMod: {}, wordsToRgb: () => [], writePng() {} }, deps);
    const want = real.constructionOf(spec);
    assert(calls.attachPose === (spec.kind === 'display' ? 0 : 1), spec.id + ' attachPose ' + calls.attachPose);
    assert(calls.installCombined === (spec.hooks ? 1 : 0), spec.id + ' hook ' + calls.installCombined);
    assert(calls.installRefresh === (spec.recorder ? 1 : 0), spec.id + ' recorder ' + calls.installRefresh);
    assert(calls.labCall === 0, spec.id + ' native call during construction');
    assert(want.pose === (spec.kind !== 'display'), spec.id + ' constructionOf');
    out[spec.id] = calls;
  }
  assert(out['disp-k1'].attachPose === 0 && out['disp-k1'].installCombined === 0, 'stock K1');
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [v.attachPose, v.installCombined, v.installRefresh].join('')]));
});

t('code review 3: refresh records are persisted, listed and complete; incomplete ones are refused', () => {
  const childDir = path.join(SCRATCH, 'pure', 'display-k1');
  const comp = PURE_COMPLETIONS['display-k1'];
  const rec = comp.recorder;
  assert(rec.length === 1 && rec[0].session === 'disp-k1' && rec[0].windows > 0 && rec[0].calls > 0 && rec[0].samples > 0, JSON.stringify(rec));
  const listed = fs.readdirSync(childDir).map((f) => { const b = fs.readFileSync(path.join(childDir, f)); return { path: f, sha256: sha256(b), bytes: b.length }; });
  assert(checkRefreshFile(childDir, rec[0], listed).length === 0, 'good record');
  const dir = fs.mkdtempSync(path.join(SCRATCH, 'refresh-'));
  const lines = fs.readFileSync(path.join(childDir, rec[0].file), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const w = lines.find((l) => l.kind === 'window');
  w.calls[0].ret = null;
  const bad = Buffer.from(lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  fs.writeFileSync(path.join(dir, rec[0].file), bad);
  const outputs = [{ path: rec[0].file, sha256: sha256(bad), bytes: bad.length }];
  assert(checkRefreshFile(dir, { ...rec[0], sha256: sha256(bad), bytes: bad.length }, outputs).some((p) => /null return/.test(p)), 'null return refused');
  assert(checkRefreshFile(dir, { ...rec[0], file: 'missing.jsonl' }, outputs).some((p) => /missing/.test(p)), 'missing record refused');
  const trunc = Buffer.from(lines.slice(0, -1).map((l) => JSON.stringify(l)).join('\n') + '\n');
  fs.writeFileSync(path.join(dir, 't.jsonl'), trunc);
  assert(checkRefreshFile(dir, { ...rec[0], file: 't.jsonl', sha256: sha256(trunc), bytes: trunc.length }, [{ path: 't.jsonl', sha256: sha256(trunc), bytes: trunc.length }]).some((p) => /truncated/.test(p)), 'truncated record refused');
  return { windows: rec[0].windows, calls: rec[0].calls, samples: rec[0].samples };
});

t('code review 4: a redraw after the deadline fails; every sample is within the bound', async () => {
  const late = await fails(() => runFake('identity-all', { lateRedraw: 1 }), /seed-a-e|seed-b-e|k2-e|frame/);
  const over = await fails(() => runFake('display-a', { sampleLate: 1 }, fakeIdentity), /deadline/);
  const log = fs.readFileSync(path.join(SCRATCH, 'pure', 'display-a', 'log.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const edges = log.filter((r) => r.settle);
  assert(edges.length === 12 && edges.every((r) => r.settle.times.length && r.settle.times.every((t) => t - r.settle.t0 <= r.settle.boundNs)), 'samples within bound');
  const j = createJudge();
  const refs = fakeRefs().display;
  const want = displayWant('seed-a', 0, refs);
  const st = { subject: 0, owner: want.owner, target: want.target, halfTarget: want.target, frame: want.frame, slots: [{ key: 0x88b2, index: 0, value: 526 }], mirror71: [], flag: 0 };
  judgeDisplayEdge(j, 'x', 'seed-a', 0, refs, st, st, (s) => s.frame, { t0: 0, times: [25e6, 600e6], boundNs: 599.6e6 });
  assert(j.out.some((x) => x.field === 'deadline' && !x.ok), 'late sample time fails');
  return { late: late.slice(0, 70), over: over.slice(0, 70) };
});

t('code review 5: display plant, hold and seed operations hold the frame again', async () => {
  const msg = await fails(() => runFake('identity-all', { frameOnSet: 1 }), /relation frame \[preserve\]/);
  const log = fs.readFileSync(path.join(SCRATCH, 'pure', 'identity', 'log.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  for (const id of ['seed-a-set-84d1-0', 'seed-a-set-1db1', 'seed-a-seed']) {
    const row = log.find((r) => r.id === id);
    assert(row && row.sourceMap.relations.some((x) => x.field === 'frame' && x.source === 'preserve'), id);
  }
  return { msg: msg.slice(0, 80) };
});

t('code review 6: a redirected work/out is refused before anything is written', () => {
  const outDir = path.join(SWS, 'work', 'out');
  const aside = path.join(SWS, 'work', 'out-aside');
  const elsewhere = path.join(SCRATCH, 'elsewhere');
  fs.mkdirSync(elsewhere, { recursive: true });
  fs.renameSync(outDir, aside);
  const j = spawnSync('cmd', ['/c', 'mklink', '/J', outDir, elsewhere], { encoding: 'utf8' });
  let r;
  try {
    assert(j.status === 0, 'junction ' + j.stderr);
    r = launch(['identity', 'redirected', '--freeze-sha', FREEZE_SHA, '--fake']);
  } finally {
    try { fs.rmdirSync(outDir); } catch { /* junction absent */ }
    fs.renameSync(aside, outDir);
  }
  assert(r.status === 2 && /work.out is not a plain directory/.test(r.stderr), r.stderr);
  assert(fs.readdirSync(elsewhere).length === 0, 'wrote through the redirect');
});

t('code review v2 correction 2: an existing tag with a redirected _refusals writes nothing through the redirect', () => {
  const ref = path.join(SWS, 'work', 'out', '_refusals');
  const aside = path.join(SWS, 'work', 'out', '_refusals-aside');
  const elsewhere = path.join(SCRATCH, 'refusals-elsewhere');
  fs.mkdirSync(elsewhere, { recursive: true });
  if (fs.existsSync(ref)) fs.renameSync(ref, aside);
  const j = spawnSync('cmd', ['/c', 'mklink', '/J', ref, elsewhere], { encoding: 'utf8' });
  let r;
  try {
    assert(j.status === 0, 'junction ' + j.stderr);
    r = launch(['identity', 'f-identity', '--freeze-sha', FREEZE_SHA, '--fake']);
  } finally {
    try { fs.rmdirSync(ref); } catch { /* junction absent */ }
    if (fs.existsSync(aside)) fs.renameSync(aside, ref);
  }
  assert(r.status === 2 && /_refusals is not a plain directory/.test(r.stderr), r.stderr);
  assert(fs.readdirSync(elsewhere).length === 0, 'wrote through the redirect');
});

// ---------------- run ----------------
let failed = 0;
for (const test of tests) {
  const t0 = Date.now();
  try {
    const info = await test.fn();
    results.push({ name: test.name, pass: true, ms: Date.now() - t0, info: info || null });
    console.log('PASS ' + test.name + (info ? ' ' + JSON.stringify(info) : ''));
  } catch (e) {
    failed += 1;
    results.push({ name: test.name, pass: false, ms: Date.now() - t0, error: String(e && e.stack ? e.stack : e) });
    console.log('FAIL ' + test.name + ': ' + String(e && e.message ? e.message : e));
  }
}
fs.writeFileSync(path.join(SCRATCH, 'test-results.json'), JSON.stringify({ node: process.version, scratch: path.relative(WS, SCRATCH).replaceAll('\\', '/'), fingerprints: FINGERPRINTS, fixtureInputs: FIXTURE_INPUTS, passed: tests.length - failed, failed, results }, null, 2) + '\n');
console.log(JSON.stringify({ tests: tests.length, passed: tests.length - failed, failed }));
process.exitCode = failed ? 1 : 0;
