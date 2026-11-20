// T8d correction proof. One process. K1e is the overlay S1 reference. K2 has no hook.
// The candidate installs the press-path writer hook. The runner never calls applyWriter().
// Identity comes from work/out/identity-t8d8.json, hashed before any session. EMULATOR-ONLY.
// Stop at the first failed assertion.
// Usage: node26 work/scripts/proof_t8d9.mjs om-emu work/out/proof-table-t8d3.json proof-t8d9
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from '../../ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs';
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { titleBand } from '../../ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs';
import { packHalf } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { installCombined, EXT, POSE, MODE, SIZE_REC, SIZE_N, readGetter, setKey } from './hook_t8d_writer8.mjs';

process.env.OM_EMU_MODEL = 'E147';
process.env.OM_EMU_NVRAM = 'off';
const [checkout, tablePath, tag] = process.argv.slice(2);
if (!checkout || !tablePath || !tag) {
  process.stderr.write('usage: node26 work/scripts/proof_t8d9.mjs om-emu <table.json> <tag>\n');
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
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: (row.problems || []).slice(0, 6) }));
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sha = (bytes) => createHash('sha256').update(Buffer.from(bytes)).digest('hex');
const u16 = (bytes) => bytes[0] | (bytes[1] << 8);
const stale = (bytes) => Array.isArray(bytes) && bytes.length >= 7 && bytes[4] === 27 && bytes[6] === 39;
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
const recorded = { k1e: {}, k2: {}, candidate: {} };
const identityPath = resolve('work/out/identity-t8d8.json');
const identityRaw = readFileSync(identityPath);
const identityTable = JSON.parse(identityRaw.toString('utf8'));
const identitySha = createHash('sha256').update(identityRaw).digest('hex');
const stepOrder = table.steps.map((s) => s.id);

function staticT6(pose) {
  // T6 design calculation. Not a hook execution. Linked: pose 2 -> 5, pose 4 -> 3, else 1.
  if (pose === 2) return 5;
  if (pose === 4) return 3;
  return 1;
}

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
  return out;
}

function snap(ctx, step, reads) {
  const half = halfOf(ctx);
  const own = ctx.readOwn();
  const target = ctx.readTarget();
  const halfTarget = Array.from(ctx.l.sim.read(0xa33f2ce0, 10));
  const mirror = Array.from(ctx.l.sim.read(EXT, 55));
  const sizeRecord = Array.from(ctx.l.sim.read(SIZE_REC, SIZE_N));
  const banks = (reads || []).filter((r) => r.kind === 'zone' || r.kind === 'pos').map((r) => r.bank);
  const readBank = banks.length && banks.every((b) => b === banks[0]) ? banks[0] : (banks.length ? null : null);
  return {
    half,
    halfBank: { zone: half.k99a1[step.bank], pos: half.k5962[step.bank] },
    target,
    halfTarget,
    mirror,
    mirror71: Array.from(ctx.l.sim.read(EXT, 71)),
    sizeRecord,
    flag: ctx.l.sim.read(MODE, 1)[0],
    edge: { status: own[5], enabled: own[6] },
    owner: own[4],
    subject: readGetter(ctx, 0x1e71, 0),
    screen: ctx.s.screen(),
    bank: step.bank,
    readBank: banks.length ? readBank : null,
    readCount: banks.length,
    poseWord: ctx.l.sim.u32(POSE) >>> 0,
    seals: {
      target: sha(target),
      halfTarget: sha(halfTarget),
      mirror: sha(mirror),
      sizeRecord: sha(sizeRecord),
    },
  };
}

function leafFor(spec, role) {
  if (!spec) throw new Error('missing field');
  if (spec.byRole) {
    if (!spec.byRole[role]) throw new Error('missing role source ' + role);
    return leafFor(spec.byRole[role], role);
  }
  return spec;
}

function lookup(source, role) {
  const m = /^ref:(K1e|K2|session):([A-Za-z0-9-]+)$/.exec(source);
  if (!m) throw new Error('bad source ' + source);
  const who = m[1] === 'session' ? role : (m[1] === 'K1e' ? 'k1e' : 'k2');
  const row = recorded[who][m[2]];
  if (!row) throw new Error('missing reference ' + source);
  if (row.seals) {
    for (const key of ['target', 'halfTarget']) {
      if (row.seals[key] && sha(row[key]) !== row.seals[key]) throw new Error('seal drift ' + source + ' ' + key);
    }
  }
  return row;
}

function judge(role, step, actual) {
  const problems = [];
  if (actual.subject !== 0) problems.push('subject ' + actual.subject);
  if (actual.poseWord !== step.pose) problems.push('pose word ' + actual.poseWord);
  if (step.judgeRead) {
    if (!actual.readCount) problems.push('no dynamic profile read');
    if (actual.readBank == null) problems.push('dynamic banks disagree');
  }
  for (const [name, spec] of Object.entries(step.fields || {})) {
    const leaf = leafFor(spec, role);
    if (leaf.source === 'seal') {
      if ((name === 'halfTarget' || name === 'target') && name === 'halfTarget' && stale(actual.halfTarget)) problems.push('stale half-press record');
      continue;
    }
    let want;
    let relation = null;
    if (leaf.source === 'literal') want = leaf.value;
    else {
      const row = lookup(leaf.source, role);
      if (leaf.relation === 'pos-changed-at-bank') {
        relation = row.half;
      } else if (leaf.map === 'half-to-mirror') want = packHalf(row.half);
      else if (leaf.map === 'bank-cell') want = { zone: row.half.k99a1[step.bank], pos: row.half.k5962[step.bank] };
      else want = row[leaf.field || name];
      if (leaf.bankFrom) {
        const cell = recorded.k1e[leaf.bankFrom];
        if (!cell) problems.push('missing bank cell ' + leaf.bankFrom);
        else if (u16(actual.target) !== cell.half.k5962[step.bank]) problems.push('position ' + u16(actual.target) + ' bank cell ' + cell.half.k5962[step.bank]);
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
    if (!same(actual[name], want)) problems.push(name + ' ' + JSON.stringify(actual[name]) + ' expected ' + JSON.stringify(want));
  }
  if (role === 'candidate') {
    const expectHalf = recorded.k2[step.id] ? recorded.k2[step.id].half : RESET;
    for (const name of Object.keys(RESET)) {
      if (!same(actual.half[name], expectHalf[name])) problems.push('half ' + name + ' ' + JSON.stringify(actual.half[name]));
    }
    if (step.id !== 'base') {
      const tail = actual.mirror71.slice(0x37, 0x47);
      const at = stepOrder.indexOf(step.id);
      let wantTail = RESET.k1de1.concat(RESET.k1df1);
      if (stepOrder.indexOf('p-menu') <= at && recorded.k1e['p-menu']) wantTail = recorded.k1e['p-menu'].half.k1de1.concat(recorded.k1e['p-menu'].half.k1df1);
      else if (stepOrder.indexOf('e-ok') <= at && recorded.k1e['e-ok']) wantTail = recorded.k1e['e-ok'].half.k1de1.concat(recorded.k1e['e-ok'].half.k1df1);
      if (!same(tail, wantTail)) problems.push('mirror 0x37-0x46 ' + JSON.stringify(tail) + ' expected ' + JSON.stringify(wantTail));
      if (!same(actual.mirror71.slice(0, 55), actual.mirror)) problems.push('mirror71 prefix');
    }
  }
  return problems;
}

function identityNow(ctx) {
  const view = ctx.screen();
  return {
    title: view && view.frame ? titleBand(view.frame) : null,
    highlight: view && view.highlight != null ? view.highlight : null,
    screen: ctx.s.screen(),
  };
}

function runStep(ctx, step, hooks, pose, role) {
  const seq = [];
  const edge = (key, dir) => {
    const press = hooks && key === 'afon' && dir === 'down';
    if (press) hooks.armPress(true);
    ctx.key(key, dir);
    if (press) hooks.armPress(false);
    ctx.idle(dir === 'down' ? 80 : 400);
    seq.push({ key, dir });
    const subject = readGetter(ctx, 0x1e71, 0);
    if (subject !== 0) throw new Error('0x1e71[0]=' + subject + ' after ' + key + ' ' + dir);
  };
  let identityBefore = null;
  let expectedIdentity = null;
  if (step.commit) {
    const got = identityNow(ctx);
    identityBefore = got;
    const id = step.identityFrom.slice('ref:K1e:'.length);
    const want = identityTable.rows[id];
    expectedIdentity = want || null;
    const problems = [];
    if (!want) problems.push('missing hashed identity ' + step.identityFrom);
    else {
      if (got.title !== want.title) problems.push('title ' + got.title);
      if (!same(got.highlight, want.highlight)) problems.push('highlight ' + JSON.stringify(got.highlight));
      if (got.screen !== want.screen) problems.push('screen ' + got.screen);
    }
    if (problems.length) {
      log({ id: role + '-' + step.id, role, pass: false, problems, identityBefore: got, expectedIdentity: want || null, identitySha });
      throw new Error(role + '-' + step.id + ' identity ' + problems.join('; '));
    }
  }
  const readFrom = hooks ? hooks.reads.length : 0;
  if (step.action === 'enter') {
    if (!hooks) throw new Error('enter without the candidate ' + step.id);
    hooks.enter();
    ctx.idle(200);
  } else if (step.action === 'pose') {
    if (hooks) hooks.armWatches(step.id);
    pose.setPose(step.key);
    pose.deliver();
    ctx.idle(600);
    ctx.emit('behaviour', { step: step.id, label: 'EMULATOR-ONLY test setup. pose.mjs stand-in. Role: test setup.' });
    if (readGetter(ctx, 0x1db1, 0) !== 1 || readGetter(ctx, 0x1dc1, 0) !== 1) {
      setKey(ctx, 0x1db1, 0, 1);
      setKey(ctx, 0x1dc1, 0, 1);
      ctx.emit('behaviour', { step: step.id, label: 'EMULATOR-ONLY test setup. Link setter re-applied after the pose stand-in. Role: test setup.' });
    }
    if (hooks) hooks.refresh();
    if (hooks) {
      const hits = hooks.drainWatches();
      const stores = hits.filter((h) => h.kind === 'store' && h.id !== 'mirror' && h.id !== 'mirrora');
      log({
        id: role + '-' + step.id + '-watches', pass: stores.length === 0, problems: stores.slice(0, 3).map((h) => h.id + '@' + h.pc.toString(16) + '=' + h.value),
        refused: hits.filter((h) => h.kind === 'refused').length, stores: stores.length,
      });
      if (stores.length) throw new Error(role + '-' + step.id + ' live store during pose');
    }
  } else if (step.action === 'key') {
    edge(step.key, 'down');
    edge(step.key, 'up');
  } else if (step.action === 'edge') {
    if (hooks) hooks.refresh();
    edge(step.key, step.dir);
  } else if (step.action !== 'check') throw new Error('bad action ' + step.action);
  if (step.exitSeq && !same(seq, step.exitSeq)) throw new Error(step.id + ' sequence ' + JSON.stringify(seq));
  const reads = hooks ? hooks.reads.slice(readFrom) : [];
  ctx.shot(step.id);
  const actual = snap(ctx, step, reads);
  actual.staticT6Bank = staticT6(step.pose);
  const problems = judge(role, step, actual);
  recorded[role][step.id] = actual;
  log({
    id: role + '-' + step.id, role, pass: problems.length === 0, problems, sequence: seq, bank: step.bank,
    staticT6Bank: actual.staticT6Bank, readBank: actual.readBank, reads, seals: actual.seals, actual,
    identityBefore, expectedIdentity,
  });
  if (problems.length) throw new Error(role + '-' + step.id + ' ' + problems.join('; '));
}

async function session(role, menuMod, modelMod) {
  // Bare stock S1 leaves the image-era All record (proof5; T7: the writer is not entered).
  // K1e therefore uses K2's overlay and does not install the reader hook, so the stock
  // editor still writes the live cells and S1 can emit a half-press record.
  const overlay = true;
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
      ? 'Candidate. AF-ON record is the stock writer record, fed from the mirror. Bank and init are the accepted T8c versions. EMULATOR-ONLY. Role: behaviour.'
      : (role === 'k2'
        ? 'K2. Combined overlay, no hooks, flag off. EMULATOR-ONLY. Role: behaviour.'
        : 'K1e, the overlay S1 reference. Combined overlay, no hooks, flag off. EMULATOR-ONLY. Role: behaviour.'),
    change: hooksOn ? 'EMULATOR-ONLY stock writer fed from the mirror. Role: behaviour.' : 'none',
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
      if (hooks) {
        const writer = hooks.counts.writer;
        log({ id: 'writer-calls', pass: writer === 3, problems: writer === 3 ? [] : ['writer ' + writer], writer, refused: hooks.refused.length });
        if (writer !== 3) throw new Error('writer calls ' + writer);
      }
    },
  });
  if (!result.ok) throw new Error(role + ' ' + result.failed);
}

function walkImports(file, out, seen) {
  const abs = resolve(file);
  if (seen.has(abs)) return;
  let data;
  try { data = readFileSync(abs); } catch { return; }
  seen.add(abs);
  const rel = abs.replaceAll('\\', '/');
  const marker = rel.toLowerCase().includes('/work/') || rel.toLowerCase().includes('/ref/');
  if (!marker) return;
  const short = rel.includes('/ws/') ? rel.slice(rel.toLowerCase().indexOf('/ws/') + 4) : file;
  out.push({ path: short, sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
  const text = data.toString('utf8');
  const re = /from '(\.[^']+)'/g;
  let m;
  while ((m = re.exec(text))) {
    const spec = m[1].endsWith('.mjs') || m[1].endsWith('.js') ? m[1] : m[1] + '.mjs';
    walkImports(resolve(dirname(abs), spec), out, seen);
  }
}

function pressKey(ctx, key) {
  ctx.key(key, 'down');
  ctx.idle(80);
  if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after ' + key + ' down');
  ctx.key(key, 'up');
  ctx.idle(400);
  if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after ' + key + ' up');
}
function dialOnce(ctx) {
  ctx.s.dial_input('main', 1);
  ctx.s.camapp.pump();
  ctx.idle(400);
  if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after dial');
}
function bootZone(ctx, modelMod) {
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
    if (!same(before[name], expect)) throw new Error('zone fresh ' + name + ' ' + JSON.stringify(before[name]));
  }
  setKey(ctx, 0x1db1, 0, 1);
  setKey(ctx, 0x1dc1, 0, 1);
  ctx.emit('behaviour', { step: 'link-on', label: 'EMULATOR-ONLY test setup. Setter writes 0x1db1[0]=1 and 0x1dc1[0]=1. Role: test setup.' });
  if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('subject before zones');
  return pose;
}
async function zonePass(menuMod, modelMod) {
  const prior = JSON.parse(readFileSync(resolve('work/out/sweep-t8d2-k1e-seal.json'), 'utf8'));
  for (const row of prior.rows) {
    if (sha(row.target) !== row.targetSha) throw new Error('sweep seal drift ' + row.id);
  }
  const store = { rows: [] };
  const run = async (role) => {
    const nv = 'work/out/nvram-' + tag + '-' + role + '.json';
    if (existsSync(resolve(nv)) || existsSync(resolve('work/out/session-' + tag + '-' + role + '.jsonl'))) {
      throw new Error('refusing to overwrite ' + role);
    }
    const hooksOn = role === 'zcand';
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
        ? 'Zone candidate. Same writer-reuse change. EMULATOR-ONLY. Role: behaviour.'
        : 'Zone K1e, the overlay S1 reference. EMULATOR-ONLY. Role: behaviour.',
      change: hooksOn ? 'EMULATOR-ONLY stock writer fed from the mirror. Role: behaviour.' : 'none',
      async drive(ctx) {
        const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
        bootZone(ctx, modelMod);
        const take = (steps, id) => {
          if (hooks) {
            if (ctx.l.sim.read(MODE, 1)[0] === 1) throw new Error('flag still set before ' + id);
            hooks.enter();
          }
          for (const step of steps) {
            if (step.op === 'dial') dialOnce(ctx);
            else pressKey(ctx, step.op);
          }
          const ident = identityNow(ctx);
          if (!hooksOn) {
            const target = Array.from(ctx.readTarget());
            store.rows.push({ id, identity: ident, nav: steps, zone0: halfOf(ctx).k99a1[0], cells: halfOf(ctx) });
          } else {
            const want = store.rows.find((r) => r.id === id);
            if (!want) throw new Error('missing K1e zone ' + id);
            if (ident.title !== want.identity.title || !same(ident.highlight, want.identity.highlight) || ident.screen !== want.identity.screen) {
              throw new Error('zone identity ' + id);
            }
            setKey(ctx, 0x99a1, 0, want.zone0);
            setKey(ctx, 0x84d1, 0, want.cells.k84d1[0]);
            setKey(ctx, 0x1dd1, 0, want.cells.k1dd1[0]);
            setKey(ctx, 0x1dd1, 1, want.cells.k1dd1[1]);
            setKey(ctx, 0x88b2, 0, want.cells.k88b2[0]);
            setKey(ctx, 0x5962, 0, want.cells.k88b2[0]);
            setKey(ctx, 0x9a41, 0, want.cells.k9a41[0]);
            setKey(ctx, 0x1df1, 0, want.cells.k1df1[0]);
            if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after zone seed ' + id);
          }
          pressKey(ctx, 'ok');
          if (hooks) hooks.refresh();
          if (hooks) hooks.armPress(true);
          ctx.key('afon', 'down');
          if (hooks) hooks.armPress(false);
          ctx.idle(80);
          if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after afon down');
          const got = Array.from(ctx.readTarget());
          if (!hooksOn) {
            const row = store.rows.find((r) => r.id === id);
            row.target = got;
            row.targetSha = sha(got);
            ctx.key('s1', 'down');
            ctx.idle(80);
            if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after s1 down');
            row.s1 = Array.from(ctx.readTarget());
            ctx.key('s1', 'up');
            ctx.idle(400);
            ctx.key('afon', 'up');
            ctx.idle(400);
          } else {
            const want = store.rows.find((r) => r.id === id);
            if (sha(want.target) !== want.targetSha) throw new Error('zone hash drift ' + id);
            const delta = [];
            for (let i = 0; i < 10; i++) if (got[i] !== want.target[i]) delta.push(i);
            log({ id: 'zone-' + id, pass: delta.length === 0, problems: delta.map((i) => '+' + i), k1e: want.target, candidate: got, zone0: want.zone0 });
            if (delta.length) throw new Error('zone record ' + id + ' +' + delta.join('+'));
            ctx.key('afon', 'up');
            ctx.idle(400);
            if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after afon up');
          }
        };
        if (!hooksOn) {
          const seen = new Set();
          const record = (steps, id) => {
            for (const step of steps) {
              if (step.op === 'dial') dialOnce(ctx);
              else pressKey(ctx, step.op);
            }
            const zone = halfOf(ctx).k99a1.join(',');
            if (seen.has(zone)) { pressKey(ctx, 'ok'); return false; }
            seen.add(zone);
            const ident = identityNow(ctx);
            pressKey(ctx, 'ok');
            ctx.key('s1', 'down');
            ctx.idle(80);
            if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after s1');
            const target = Array.from(ctx.readTarget());
            const cells = halfOf(ctx);
            const priorRow = prior.rows.find((r) => r.id === id);
            if (!priorRow || !same(target, priorRow.target)) log({ id: 'zone-k1e-drift-' + id, pass: true, problems: ['sweep seal differs'], target, sweep: priorRow ? priorRow.target : null });
            ctx.key('s1', 'up');
            ctx.idle(400);
            if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after s1 up');
            store.rows.push({ id, identity: ident, nav: steps, zone0: Number(zone.split(',')[0]), cells, target, targetSha: sha(target) });
            return true;
          };
          if (!record([{ op: 'up' }], 'z0')) throw new Error('reset zone was not recorded');
          for (let i = 1; i < 8; i++) {
            if (!record([{ op: 'up' }, { op: 'dial' }], 'z' + i)) break;
          }
          setKey(ctx, 0x5a11, 5, 1);
          ctx.emit('behaviour', { step: 'offer-custom', label: 'EMULATOR-ONLY test setup. 0x5a11[5]=1 so the direct dial can reach custom 1. Role: test setup.' });
          let found = false;
          for (let i = 0; i < 14 && !found; i++) {
            pressKey(ctx, 'up');
            dialOnce(ctx);
            if (halfOf(ctx).k99a1[0] === 6) {
              const ident = identityNow(ctx);
              pressKey(ctx, 'ok');
              ctx.key('s1', 'down');
              ctx.idle(80);
              if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after custom s1');
              const target = Array.from(ctx.readTarget());
              const cells = halfOf(ctx);
              const priorRow = prior.rows.find((r) => r.id === 'custom');
              if (!priorRow || !same(target, priorRow.target)) log({ id: 'zone-k1e-drift-custom', pass: true, problems: ['sweep seal differs'], target, sweep: priorRow ? priorRow.target : null });
              ctx.key('s1', 'up');
              ctx.idle(400);
              store.rows.push({ id: 'custom', identity: ident, zone0: 6, cells, target, targetSha: sha(target), seeded: false });
              found = true;
            } else pressKey(ctx, 'ok');
          }
          if (!found) throw new Error('custom zone 6 was not reached');
          const path = resolve('work/out/' + tag + '-zone-k1e.json');
          writeFileSync(path, JSON.stringify({ rows: store.rows }, null, 2) + '\n');
          const raw = readFileSync(path);
          const fileSha = createHash('sha256').update(raw).digest('hex');
          log({ id: 'zone-k1e-seal', pass: true, problems: [], sha256: fileSha, zones: store.rows.map((r) => ({ id: r.id, zone0: r.zone0, targetSha: r.targetSha })) });
        } else {
          const dialRows = store.rows.filter((r) => r.id !== 'custom');
          for (const row of dialRows) take(row.nav, row.id);
          const custom = store.rows.find((r) => r.id === 'custom');
          if (ctx.l.sim.read(MODE, 1)[0] === 1) throw new Error('flag still set before custom seed');
          hooks.enter();
          setKey(ctx, 0x99a1, 0, custom.zone0);
          setKey(ctx, 0x84d1, 0, custom.cells.k84d1[0]);
          setKey(ctx, 0x1dd1, 0, custom.cells.k1dd1[0]);
          setKey(ctx, 0x1dd1, 1, custom.cells.k1dd1[1]);
          setKey(ctx, 0x88b2, 0, custom.cells.k88b2[0]);
          setKey(ctx, 0x5962, 0, custom.cells.k88b2[0]);
          setKey(ctx, 0x9a41, 0, custom.cells.k9a41[0]);
          setKey(ctx, 0x1df1, 0, custom.cells.k1df1[0]);
          ctx.l.sim.write(MODE, Buffer.from([0]));
          ctx.l.sim.write(0x6031eef7, Buffer.from([0]));
          ctx.emit('behaviour', { step: 'custom-seed', label: 'EMULATOR-ONLY test setup. Custom 1 is seeded from the K1e writer inputs. The sweep dial replay diverged on the title, so this row is not an identity-checked dial. Role: test setup.' });
          if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('subject after custom seed');
          hooks.refresh();
          hooks.armPress(true);
          ctx.key('afon', 'down');
          hooks.armPress(false);
          ctx.idle(80);
          if (readGetter(ctx, 0x1e71, 0) !== 0) throw new Error('0x1e71[0] after custom afon');
          const got = Array.from(ctx.readTarget());
          const delta = [];
          for (let i = 0; i < 10; i++) if (got[i] !== custom.target[i]) delta.push(i);
          log({ id: 'zone-custom', pass: delta.length === 0, problems: delta.map((i) => '+' + i), k1e: custom.target, candidate: got, zone0: 6, seeded: true });
          if (delta.length) throw new Error('zone record custom +' + delta.join('+'));
          ctx.key('afon', 'up');
          ctx.idle(400);
          log({ id: 'zone-writer-calls', pass: true, problems: [], writer: hooks.counts.writer });
        }
      },
    });
    if (!result.ok) throw new Error(role + ' ' + result.failed);
  };
  await run('zk1e');
  const zoneRaw = readFileSync(resolve('work/out/' + tag + '-zone-k1e.json'));
  const zoneSha = createHash('sha256').update(zoneRaw).digest('hex');
  log({ id: 'zone-identity-before-candidate', pass: true, problems: [], sha256: zoneSha });
  await run('zcand');
}

function fileInfo(p) {
  const data = readFileSync(resolve(p));
  return { path: p.replaceAll('\\', '/'), sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length };
}
const importsBefore = [];
walkImports('work/scripts/proof_t8d9.mjs', importsBefore, new Set());
const baselines = [
  'TASK.md',
  'brief.md',
  'audit/previous-review.md',
  'ref/tasks/T8c-afon-bank-and-init-reconcile/decision.md',
  'ref/tasks/T8c-afon-bank-and-init-reconcile/run-20261119-174338-review/review.md',
  'ref/tasks/T8c-afon-bank-and-init-reconcile/run-20261119-184058-review/review.md',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/design.md',
  'ref/tasks/T8c-afon-bank-and-init-reconcile/run-20261119-175921/work/out/slots-q2.json',
  'work/out/identity-t8d8.json',
  'work/out/proof-table-t8d3.json',
  'inputs/00_0100_50000020.decoded.bin',
  'inputs/02_0106_458c0020.decoded.bin',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv',
];
mkdirSync(resolve('work/out/cmd'), { recursive: true });
writeFileSync(resolve('work/out/cmd/' + tag + '.json'), JSON.stringify({
  tag,
  when: 'before-session',
  command: 'node26 work/scripts/proof_t8d9.mjs om-emu work/out/proof-table-t8d3.json ' + tag,
  OM_EMU_MODEL: process.env.OM_EMU_MODEL,
  OM_EMU_NVRAM: process.env.OM_EMU_NVRAM,
  identitySha,
  imports: importsBefore,
  baselines: baselines.map(fileInfo),
}, null, 2) + '\n');
const menuMod = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href);
const modelMod = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
let failed = null;
try {
  log({ id: 'inventory', pass: true, problems: [], identitySha, imports: importsBefore.length });
  for (const role of ['k1e', 'k2', 'candidate']) await session(role, menuMod, modelMod);
  await zonePass(menuMod, modelMod);
  log({ id: tag + '-done', pass: true, ok: true, problems: [] });
} catch (e) {
  failed = e;
  log({ id: tag + '-done', pass: false, ok: false, problems: [String(e && e.message || e)] });
}
const imports = [];
walkImports('work/scripts/proof_t8d9.mjs', imports, new Set());
writeFileSync(resolve('work/out/' + tag + '-imports.json'), JSON.stringify({ imports, identitySha }, null, 2) + '\n');
if (failed) process.exitCode = 1;
