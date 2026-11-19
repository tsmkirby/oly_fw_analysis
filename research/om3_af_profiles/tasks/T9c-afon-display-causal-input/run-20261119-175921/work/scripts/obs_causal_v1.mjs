// Version 1 of 6. One emulator process, two stock sessions.
// Session observe: record the call stack at 0x61184dd6 on the idle before and
// after a test-setup write of cell 0x88b2 to 412. That names the dispatcher.
// Session causal: the cell stays 526. The call at 0x6041935b returns 412 only
// when d0 is 0x88b2 (EMULATOR-ONLY test setup). Then the condition named by
// the observe session is raised without writing the cell.
// Expected if that return is the causal input: the marks move to
// (356, 198) 65x71 while 0x88b2 stays 526.
// OM_EMU_MODEL=E147 is set before model.mjs. No display change.
// Usage: node26 work/scripts/obs_causal_v1.mjs om-emu
process.env.OM_EMU_MODEL = 'E147';

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { runZone } = await import(pathToFileURL(resolve('ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs')).href);
const { setProbes } = await import(pathToFileURL(resolve('om-emu/emu/src/core/interp.mjs')).href);
const { dbgRead, setWatchpoints } = await import(pathToFileURL(resolve('om-emu/emu/src/core/mem.mjs')).href);
const { S } = await import(pathToFileURL(resolve('om-emu/emu/src/core/cpu.mjs')).href);

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/obs_causal_v1.mjs om-emu\n');
  process.exit(2);
}

const SET = 0x60063431;
const GET = 0x60063380;
const CONVERTER = 0x604050e5;
const SET_API = 0x50ac4afe;
const ENTRY = 0x61184dd6;
const CALL = 0x6041935b;
const CALL_RET = 0x60419360;
const DIV = 0x611851e9;
const XSTORE = 0x611852e9;
const DIRTY_READ = 0x60063d7d;
const DIRTY_STORE = 0x6006355e;
const CHECK1 = 0x61184e14;
const CHECK2 = 0x61184e2a;
const WRITER_CALL = 0x61184e30;
const DIRTY = 0xa32bfb32;
const CODE_LO = 0x60021020;
const CODE_HI = 0x62021020;
const OUT = resolve('work/out/obs-causal-v1.jsonl');
const lines = [];
const hex = (v) => '0x' + (v >>> 0).toString(16);

function emit(row) {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ id: row.id, pass: row.pass, problems: row.problems, step: row.step }));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
}

function u16at(addr) {
  const b = dbgRead(addr >>> 0, 2);
  if (!b) return null;
  return b[0] | (b[1] << 8);
}
function u32at(addr) {
  const b = dbgRead(addr >>> 0, 4);
  if (!b) return null;
  return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
}
function byteAt(addr) {
  const b = dbgRead(addr >>> 0, 1);
  return b ? b[0] : null;
}

function greyMarks(rgb, w) {
  const x0 = 280, y0 = 60, x1 = 780, y1 = 520;
  const seen = new Uint8Array((x1 - x0) * (y1 - y0));
  const on = (x, y) => {
    const i = (y * w + x) * 3;
    const hi = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]);
    const lo = Math.min(rgb[i], rgb[i + 1], rgb[i + 2]);
    return lo >= 18 && hi <= 60 && hi - lo <= 12;
  };
  const marks = [];
  let pixels = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const si = (x - x0) + (y - y0) * (x1 - x0);
      if (seen[si] || !on(x, y)) continue;
      let minX = x, minY = y, maxX = x, maxY = y, n = 0;
      const stack = [[x, y]];
      seen[si] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        n += 1;
        if (cx < minX) minX = cx;
        if (cy < minY) minY = cy;
        if (cx > maxX) maxX = cx;
        if (cy > maxY) maxY = cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < x0 || ny < y0 || nx >= x1 || ny >= y1) continue;
          const ni = (nx - x0) + (ny - y0) * (x1 - x0);
          if (seen[ni] || !on(nx, ny)) continue;
          seen[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      pixels += n;
      if (n >= 15 && n <= 400) marks.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, n });
    }
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  if (!marks.length) return { marks, pixels, union: null };
  const x = Math.min(...marks.map((m) => m.x));
  const y = Math.min(...marks.map((m) => m.y));
  return {
    marks, pixels,
    union: { x, y, w: Math.max(...marks.map((m) => m.x + m.w)) - x, h: Math.max(...marks.map((m) => m.y + m.h)) - y, n: marks.length },
  };
}

function callInfo(mdr) {
  const b = dbgRead((mdr - 7) >>> 0, 7);
  if (!b) return { kind: 'unreadable' };
  const bytes = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  if (b[5] === 0xf0 && b[6] >= 0xf0 && b[6] <= 0xf3) return { kind: 'calls', at: hex((mdr - 2) >>> 0), reg: b[6] & 3, bytes };
  if (b[2] === 0xcd) return { kind: 'call16', at: hex((mdr - 5) >>> 0), bytes };
  if (b[0] === 0xdd) return { kind: 'call32', at: hex((mdr - 7) >>> 0), bytes };
  return { kind: 'other', bytes };
}

function stackWords(sp) {
  const words = [];
  const code = [];
  for (let i = 0; i < 20; i++) {
    const v = u32at((sp + i * 4) >>> 0);
    words.push(v === null ? null : hex(v));
    if (v !== null && v >= CODE_LO && v < CODE_HI) code.push({ off: i * 4, v: hex(v) });
  }
  return { words, code };
}

const phase = {
  name: 'off',
  m: null,
  armed: false,
  entries: 0,
  hits: [],
  call88: 0,
  returns: [],
  pendingRet: false,
  divs: [],
  xs: [],
  dirtyReads: 0,
  dirtyStores: 0,
  checks: [],
  writerCalls: 0,
  watches: [],
};

function resetPhase(name) {
  phase.name = name;
  phase.entries = 0;
  phase.hits = [];
  phase.call88 = 0;
  phase.returns = [];
  phase.pendingRet = false;
  phase.divs = [];
  phase.xs = [];
  phase.dirtyReads = 0;
  phase.dirtyStores = 0;
  phase.checks = [];
  phase.writerCalls = 0;
  phase.watches = [];
}

function snapshot() {
  return {
    entries: phase.entries,
    hits: phase.hits,
    call88: phase.call88,
    returns: phase.returns,
    divs: phase.divs,
    xs: phase.xs,
    dirtyReads: phase.dirtyReads,
    dirtyStores: phase.dirtyStores,
    checks: phase.checks,
    writerCalls: phase.writerCalls,
    watches: phase.watches,
  };
}

function onProbe(pc) {
  if (!phase.armed || !phase.m) return;
  const r = phase.m.getRegs();
  if (pc === ENTRY) {
    phase.entries += 1;
    if (phase.hits.length >= 4) return;
    const sp = r[8] >>> 0;
    const mdr = r[11] >>> 0;
    phase.hits.push({
      mdr: hex(mdr),
      call: callInfo(mdr),
      a0: hex(r[4] >>> 0), a1: hex(r[5] >>> 0), a2: hex(r[6] >>> 0), a3: hex(r[7] >>> 0),
      d0: r[0] >>> 0, d1: r[1] >>> 0,
      sp: hex(sp),
      stack: stackWords(sp),
      dirty: byteAt(DIRTY),
      insns: S.insns,
    });
    return;
  }
  if (pc === CALL) {
    const key = r[0] & 0xffff;
    if (key === 0x88b2) {
      phase.call88 += 1;
      phase.pendingRet = true;
    }
    return;
  }
  if (pc === CALL_RET && phase.pendingRet) {
    phase.pendingRet = false;
    if (phase.returns.length < 8) phase.returns.push(r[0] & 0xffff);
    return;
  }
  if (pc === DIV) {
    if (phase.divs.length >= 6) return;
    phase.divs.push({ d0: r[0] & 0xffff, d1: r[1] & 0xffff, d2: r[2] >>> 0, insns: S.insns });
    return;
  }
  if (pc === XSTORE) {
    if (phase.xs.length >= 8) return;
    const sp = r[8] >>> 0;
    const obj = u32at(sp + 0x48);
    phase.xs.push({
      d1: r[1] & 0xffff,
      pointX: u16at(sp + 0x9e),
      pointY: u16at(sp + 0x9c),
      sizeX: u32at(sp + 0xc0),
      sizeY: u32at(sp + 0xc4),
      obj: obj === null ? null : hex(obj),
      word: obj === null ? null : u32at((obj + 0x364) >>> 0),
    });
    return;
  }
  if (pc === DIRTY_READ) { phase.dirtyReads += 1; return; }
  if (pc === DIRTY_STORE) { phase.dirtyStores += 1; return; }
  if (pc === CHECK1 || pc === CHECK2) {
    if (phase.checks.length < 8) phase.checks.push({ pc: hex(pc), d0: r[0] & 0xffff });
    return;
  }
  if (pc === WRITER_CALL) phase.writerCalls += 1;
}

const PROBES = [ENTRY, CALL, CALL_RET, DIV, XSTORE, DIRTY_READ, DIRTY_STORE, CHECK1, CHECK2, WRITER_CALL];
const WATCH_HOOK = {
  stop() {},
  log(rec) {
    if (phase.watches.length >= 16) return;
    phase.watches.push({ dir: rec.dir, pc: hex(rec.pc >>> 0), value: rec.value >>> 0, insns: rec.insns });
  },
};

function arm(ctx) {
  phase.m = ctx.l.sim.m;
  phase.armed = true;
  setProbes(PROBES, onProbe);
  setWatchpoints([{ id: 'dirty', lo: DIRTY, hi: DIRTY + 1, kind: 3, stop: false }], WATCH_HOOK);
}
function disarm() {
  phase.armed = false;
  setProbes([], null);
  setWatchpoints([], { stop() {}, log() {} });
}

async function boot(ctx, tag) {
  const { A } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
  const { words_to_rgb } = await import(pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href);
  const { write_png } = await import(pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href);
  ctx.bringUp();
  ctx.s.switch_input('lever', 1);
  ctx.s.camapp.pump();
  ctx.idle(250);
  const argument = ctx.l.call(ctx.native(CONVERTER), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
  ctx.l.call(A(SET_API), { d0: 289, d1: argument }, null, null, 200000);
  ctx.idle(150);
  const readKey = (key, index) => ctx.l.call(ctx.native(GET), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
  const shot = (id) => {
    const fr = ctx.s.frame('boundary');
    if (!fr) throw new Error('screenshot failed at ' + id);
    const rgb = words_to_rgb(fr[2]);
    const file = resolve('work/out/obs-causal-v1-' + tag + '-' + id + '.png');
    write_png(file, fr[0], fr[1], rgb);
    const g = greyMarks(rgb, fr[0]);
    return {
      sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
      union: g.union,
      marks: g.marks,
      pixels: g.pixels,
      subject: readKey(0x1e71, 0),
      k88b2: readKey(0x88b2, 0),
      target: ctx.readTarget(),
      owner: ctx.readOwn()[4],
    };
  };
  return { readKey, shot };
}

function sameUnion(u, x, y, w, h) {
  return !!(u && u.x === x && u.y === y && u.w === w && u.h === h && u.n === 4);
}

try {
  const envPass = process.env.OM_EMU_MODEL === 'E147';
  emit({
    id: 'v1-plan', step: 'plan', pass: envPass, problems: envPass ? [] : ['env'],
    expect: { model: 'E147' }, actual: { modelEnv: process.env.OM_EMU_MODEL },
    note: 'Version 1 of 6. Find the dispatcher of 0x61184dd6, then force the call at 0x6041935b to return 412 for d0=0x88b2 without writing the cell. EMULATOR-ONLY test setup.',
  });
  if (!envPass) process.exit(1);

  let observed = null;
  const obs = await runZone({
    checkout,
    outPath: 'work/out/session-obs-causal-v1.jsonl',
    tag: 'obs-causal-v1',
    candidate: false,
    fatalShots: true,
    explanation: 'v1 observe. Stock. Record the call stack at 0x61184dd6 during the idle before and after the 0x88b2 write. EMULATOR-ONLY test-setup write only.',
    change: 'EMULATOR-ONLY test-setup write of 0x88b2 only',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v1-obs-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { shot } = await boot(ctx, 'obs');
      const rest = shot('rest');
      if (rest.subject !== 0 || rest.k88b2 !== 526) throw new Error('rest ' + rest.subject + ' ' + rest.k88b2);
      const restFrame = sameUnion(rest.union, 417, 265, 66, 70);
      emit({
        id: 'v1-obs-rest', step: 'rest', pass: restFrame && rest.subject === 0, problems: restFrame ? [] : ['union'],
        expect: { subject: 0, k88b2: 526, union: { x: 417, y: 265, w: 66, h: 70 } },
        actual: { subject: rest.subject, k88b2: rest.k88b2, union: rest.union, marks: rest.marks, pixels: rest.pixels, sha256: rest.sha256, owner: rest.owner },
      });
      if (!restFrame) throw new Error('rest union ' + JSON.stringify(rest.union));
      resetPhase('pre');
      const dirtyPre = byteAt(DIRTY);
      arm(ctx);
      ctx.idle(500);
      disarm();
      const pre = snapshot();
      emit({
        id: 'v1-obs-pre', step: 'pre', pass: true, problems: [],
        expect: { cell: 526 }, actual: { dirty: dirtyPre, ...pre },
        note: 'Idle before any cell write. entries is how often 0x61184dd6 ran.',
      });
      const dirtyBefore = byteAt(DIRTY);
      ctx.l.call(ctx.native(SET), { d0: 0x88b2, d1: 0, a1: 412 }, null, null, 200000);
      const dirtyAfterSet = byteAt(DIRTY);
      resetPhase('post');
      arm(ctx);
      ctx.idle(500);
      disarm();
      const post = snapshot();
      const after = shot('after');
      const moved = sameUnion(after.union, 356, 198, 65, 71);
      emit({
        id: 'v1-obs-post', step: 'post', pass: after.subject === 0 && after.k88b2 === 412 && moved && post.entries > 0,
        problems: [],
        expect: { subject: 0, k88b2: 412, union: { x: 356, y: 198, w: 65, h: 71 }, entries: '>0' },
        actual: {
          subject: after.subject, k88b2: after.k88b2, union: after.union, marks: after.marks, pixels: after.pixels,
          sha256: after.sha256, dirtyBefore, dirtyAfterSet, ...post,
        },
        note: 'EMULATOR-ONLY test-setup write of 0x88b2 only. hits are entries of 0x61184dd6.',
      });
      if (after.subject !== 0 || after.k88b2 !== 412 || !moved || post.entries < 1) throw new Error('post control');
      observed = { pre, post, dirtyPre, dirtyBefore, dirtyAfterSet };
    },
  });
  if (!obs.ok || !observed) {
    emit({ id: 'v1-done', step: 'done', pass: false, problems: ['observe'], expect: { ok: true }, actual: { ok: obs.ok } });
    process.exit(1);
  }

  const periodic = observed.pre.entries > 0;
  const dirtyEdge = !periodic && (observed.post.dirtyReads > 0 || observed.post.watches.some((w) => w.dir === 'r'));
  const mode = periodic ? 'idle' : (dirtyEdge ? 'dirty' : 'dirty');
  const caller = observed.post.hits[0] ? observed.post.hits[0].call : null;
  emit({
    id: 'v1-trigger', step: 'trigger', pass: true, problems: [],
    expect: { named: true },
    actual: {
      periodic, dirtyEdge, mode, caller,
      preEntries: observed.pre.entries, postEntries: observed.post.entries,
      preDirtyReads: observed.pre.dirtyReads, postDirtyReads: observed.post.dirtyReads,
      preWatches: observed.pre.watches, postWatches: observed.post.watches,
      preReturns: observed.pre.returns, postReturns: observed.post.returns,
      postDivs: observed.post.divs, postXs: observed.post.xs, postChecks: observed.post.checks,
    },
    note: periodic
      ? '0x61184dd6 ran on the idle before the setter. The refresh condition reproduced next is that same idle, with no cell write.'
      : '0x61184dd6 did not run before the setter. The setter raises dirty byte 0xa32bfb32. The next session raises that byte and does not write the cell.',
  });

  let subs = 0;
  const causal = await runZone({
    checkout,
    outPath: 'work/out/session-causal-v1.jsonl',
    tag: 'causal-v1',
    candidate: false,
    fatalShots: true,
    explanation: 'v1 causal. Stock. Cell stays 526. The call at 0x6041935b returns 412 only for d0=0x88b2. EMULATOR-ONLY test setup. Then the refresh condition named by the observe session.',
    change: 'EMULATOR-ONLY test setup: call 0x6041935b returns 412 when d0 is 0x88b2. No other call site. No cell write.',
    async drive(ctx) {
      const { MODEL } = await import(pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href);
      if (MODEL !== 'E147') throw new Error('model ' + MODEL);
      emit({ id: 'v1-causal-model', step: 'model', pass: true, problems: [], expect: { model: 'E147' }, actual: { model: MODEL }, note: 'Read before bring-up and before any key.' });
      const { shot } = await boot(ctx, 'causal');
      const rest = shot('rest');
      if (rest.subject !== 0 || rest.k88b2 !== 526 || !sameUnion(rest.union, 417, 265, 66, 70)) {
        throw new Error('causal rest ' + JSON.stringify(rest.union) + ' cell ' + rest.k88b2);
      }
      ctx.l.hook(ctx.native(CALL), (h, r) => {
        if ((r.d0 & 0xffff) === 0x88b2) {
          subs += 1;
          r.d0 = 412;
          h.skip_call(r);
          return;
        }
        ctx.l.passthrough(r);
      }, 'EMULATOR-ONLY test setup: 0x6041935b returns 412 for d0=0x88b2');
      let dirtyAction = null;
      if (mode === 'dirty') {
        const before = byteAt(DIRTY);
        const zero = Buffer.from([0]);
        const one = Buffer.from([1]);
        ctx.l.sim.write(DIRTY, zero);
        ctx.l.sim.write(DIRTY, one);
        dirtyAction = { before, after: byteAt(DIRTY) };
      }
      resetPhase('causal');
      arm(ctx);
      ctx.idle(500);
      disarm();
      const snap = snapshot();
      const after = shot('after');
      const cellStays = after.k88b2 === 526;
      const moved = sameUnion(after.union, 356, 198, 65, 71);
      const pass = after.subject === 0 && cellStays && moved && subs > 0 && snap.entries > 0;
      emit({
        id: 'v1-causal', step: 'causal', pass, problems: pass ? [] : ['outcome'],
        expect: { subject: 0, k88b2: 526, union: { x: 356, y: 198, w: 65, h: 71 }, entries: '>0', substitutions: '>0' },
        actual: {
          mode, dirtyAction, subs, subject: after.subject, k88b2: after.k88b2,
          union: after.union, marks: after.marks, pixels: after.pixels, sha256: after.sha256,
          restUnion: rest.union, owner: after.owner, target: after.target, ...snap,
        },
        note: 'EMULATOR-ONLY test setup at 0x6041935b only. The cell was not written. pass is true only when the marks move to (356, 198) 65x71 while 0x88b2 stays 526.',
      });
    },
  });
  emit({
    id: 'v1-done', step: 'done', pass: obs.ok && causal.ok, problems: obs.ok && causal.ok ? [] : ['session'],
    expect: { ok: true }, actual: { observe: obs.ok, causal: causal.ok, mode, subs },
  });
  if (!obs.ok || !causal.ok) process.exit(1);
} catch (e) {
  try { disarm(); } catch { /* probes may already be clear */ }
  emit({ id: 'v1-done', step: 'done', pass: false, problems: ['exception'], expect: { ok: true }, actual: { ok: false, error: String(e && e.stack ? e.stack : e) } });
  process.exit(1);
}
