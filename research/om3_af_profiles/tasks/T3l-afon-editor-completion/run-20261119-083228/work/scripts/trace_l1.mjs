// Experiment l1, measurement only. No overlay and no behaviour hook.
// Records the GUI state around every exit of the direct AF-target screen
// and of the custom-size editor, the call tail of those keys, the live
// cell addresses, and stock C1-C4 size commits. Do not edit after it has run.
// Usage: node26 work/scripts/trace_l1.mjs om-emu
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/trace_l1.mjs om-emu\n');
  process.exit(2);
}
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const OUT = resolve('work/out/trace-l1.jsonl');
const GETTER = 0x60063380;
const SETTER = 0x60063431;
const LOOKUP = 0x600624d3;
const LIVE = {
  0x99a1: [0x6295946c, 8, 1],
  0x9a41: [0x62959484, 1, 1],
  0x5962: [0x62920bf0, 6, 2],
  0x1dd1: [0x62920982, 10, 1],
  0x84d1: [0x62920fa5, 1, 1],
  0x88b2: [0x629526c0, 1, 2],
  0x90d1: [0x62959355, 8, 1],
  0x5a11: [0x62920c18, 11, 1],
  0x1de1: [0x6292098c, 8, 1],
  0x1df1: [0x62920994, 9, 1],
};

const { loadNand, loadImage, loadBlock, createHash: fwHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { apply_uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');
const { fileNvram } = await use('host/nvram.mjs');
const { setExecTrace } = await use('src/core/cpu.mjs');
const { setForceHelper } = await use('src/core/interp.mjs');

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
const USE_RE = /use\(\s*['"]([^'"]+)['"]\s*\)/g;
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, base + '.mjs', base + '.js', join(base, 'index.mjs'), join(base, 'index.js')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
function inventory(files) {
  const seen = new Map();
  const queue = [...files];
  while (queue.length) {
    const cur = queue.pop();
    if (!cur || seen.has(cur) || !existsSync(cur)) continue;
    const data = readFileSync(cur);
    seen.set(cur, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
    const text = data.toString('utf8');
    for (const re of [IMPORT_RE, USE_RE]) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(text))) {
        const spec = match[1];
        const next = spec.startsWith('.') ? resolveSpec(cur, spec) : resolve(checkout, 'emu', spec);
        if (next && existsSync(next)) queue.push(next);
      }
    }
  }
  return [...seen.entries()].map(([path, meta]) => ({ path: path.replaceAll('\\', '/'), ...meta, hashed: 'execution' }));
}

const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(OUT, lines.join('\n') + '\n');
  console.log(JSON.stringify({
    step: row.step, screen: row.screen, state: row.state, diff: row.diff ? row.diff.length : undefined,
    calls: row.callCount, tail: row.callTail ? row.callTail.length : undefined,
  }));
};
const hex = (v) => '0x' + (v >>> 0).toString(16);
const native = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const fw = { rom: loadImage(), resBlock: loadBlock(), summary: null, changed: [] };
apply_uiin_layout(fw.rom);
const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  {
    ...fw, nand: loadNand(), createHash: fwHash, wallClock: () => performance.now() / 1000,
    machine: { coverage: { mark() {}, stub() {} } }, nvram: fileNvram(resolve('work/out/nvram-trace-l1.json')),
    patch: null, patchRanges: [], loaded: 'on',
  },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

let failed = null;
try {
  const self = resolve('work/scripts/trace_l1.mjs');
  const text = readFileSync(self, 'utf8');
  const seeds = [self];
  USE_RE.lastIndex = 0;
  let match;
  while ((match = USE_RE.exec(text))) seeds.push(resolve(checkout, 'emu', match[1]));
  const modules = inventory(seeds);
  writeFileSync(resolve('work/out/import-inventory-l1.json'), JSON.stringify({ hashed: 'execution', modules }, null, 2) + '\n');
  emit({ step: 'imports', modules: modules.length, role: 'observe' });

  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const sets = [];
  let tracing = false;
  let lastPc = 0;
  let lastOp = 0;
  const callTail = [];
  const callSeen = new Set();
  const callUniq = [];
  l.observe(native(SETTER), (_lab, r) => {
    if (sets.length >= 80) return;
    sets.push({ key: hex(r.d0 & 0xffff), index: r.d1 & 0xffff, a1: hex(r.a1 >>> 0), caller: hex(r.mdr >>> 0) });
  }, 'obs-setter-l1');
  const onInsn = (pc, op) => {
    if (!tracing) return;
    const p = pc >>> 0;
    const delta = (p - lastPc) >>> 0;
    if (lastPc && (delta > 6 || p < lastPc)) {
      let call = lastOp === 0xdd || lastOp === 0xcd;
      if (!call && (lastOp === 0xfc || lastOp === 0xfa)) {
        try { call = l.sim.read(lastPc, 2)[1] === 0xff; } catch { /* unreadable */ }
      }
      if (call) {
        callTail.push(hex(p));
        if (callTail.length > 80) callTail.shift();
        if (!callSeen.has(p) && callUniq.length < 3000) { callSeen.add(p); callUniq.push(hex(p)); }
      }
    }
    lastPc = p;
    lastOp = op & 0xff;
  };
  const clearTrace = () => { callTail.length = 0; callSeen.clear(); callUniq.length = 0; lastPc = 0; lastOp = 0; sets.length = 0; };
  const callSaved = (fn) => {
    const saved = l.sim.registers();
    try { return fn(); }
    finally { l.sim.reset(saved); }
  };
  const readKey = (key, index) => callSaved(() => l.call(native(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff);
  const arr = (key, n) => Array.from({ length: n }, (_, i) => readKey(key, i));
  const cells = () => ({
    k99a1: arr(0x99a1, 8), k9a41: arr(0x9a41, 2), k5962: arr(0x5962, 6),
    k1dd1: arr(0x1dd1, 10), k1de1: arr(0x1de1, 8), k1df1: arr(0x1df1, 9),
    k84d1: readKey(0x84d1, 0), k88b2: readKey(0x88b2, 0), k90d1: arr(0x90d1, 8),
    k5a11: arr(0x5a11, 11), zoneByte: l.sim.read(0xa031e920, 1)[0],
  });
  const diffOf = (a, b) => {
    const out = [];
    const walk = (x, y, path) => {
      if (Array.isArray(x) && Array.isArray(y)) {
        for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) out.push([path + '[' + i + ']', x[i], y[i]]);
      } else if (x !== y) out.push([path, x, y]);
    };
    for (const k of Object.keys(a)) walk(a[k], b[k], k);
    return out;
  };
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(550); };
  const dial = (which, n) => { s.dial_input(which, n); s.camapp.pump(); idle(550); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 8 });
  let shotN = 0;
  const shot = (step) => {
    let frame = null;
    let texts = [];
    let textError = null;
    try {
      const scr = walk.read();
      texts = scr.texts.map((t) => t.text);
      frame = scr.frame;
    } catch (e) {
      textError = String(e && e.message || e);
      try { frame = s.frame('boundary'); } catch (e2) { textError += ' frame ' + String(e2 && e2.message || e2); }
    }
    if (!frame) throw new Error('screenshot failed at ' + step + ': ' + textError);
    const file = resolve('work/out/trace-l1-' + String(shotN).padStart(2, '0') + '-' + step + '.png');
    shotN += 1;
    write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
    return { texts, textError, screenshot: file.split(/[/\\]/).pop() };
  };
  const stateOf = () => {
    const n = l.state();
    let name = null;
    try { name = l.state_name(n); } catch { name = null; }
    return { n: hex(n), name, screen: s.screen() };
  };
  let before = null;
  const snap = (step, extra = {}) => {
    const view = extra.shot === false ? { texts: [], textError: null, screenshot: null } : shot(step);
    const now = cells();
    const row = {
      role: 'observe', step, ...stateOf(), ...view,
      diff: before ? diffOf(before, now) : [],
      cells: now,
      sets: sets.slice(),
      callCount: callUniq.length,
      callTail: extra.trace ? callTail.slice() : undefined,
      callUniq: extra.trace ? callUniq.slice() : undefined,
      note: extra.note || null,
    };
    emit(row);
    before = now;
    return row;
  };
  const act = (step, fn, extra) => {
    const ev0 = l.events.length;
    const from = stateOf();
    clearTrace();
    fn();
    const row = snap(step, extra);
    const transitions = l.events.slice(ev0).filter((e) => e[0] === 'state').map((e) => [e[1], e[2], e[3]]);
    row.from = from;
    row.transitions = transitions;
    lines[lines.length - 1] = JSON.stringify(row);
    writeFileSync(OUT, lines.join('\n') + '\n');
    console.log(JSON.stringify({ step, from: from.screen, to: row.screen, transitions: transitions.length, state: row.state }));
    return row;
  };
  const traced = (step, fn) => {
    const ev0 = l.events.length;
    const from = stateOf();
    clearTrace();
    tracing = true;
    setExecTrace(onInsn);
    setForceHelper(true);
    try { fn(); }
    finally { tracing = false; setExecTrace(null); setForceHelper(false); }
    const row = snap(step, { trace: true });
    row.from = from;
    row.transitions = l.events.slice(ev0).filter((e) => e[0] === 'state').map((e) => [e[1], e[2], e[3]]);
    lines[lines.length - 1] = JSON.stringify(row);
    writeFileSync(OUT, lines.join('\n') + '\n');
    console.log(JSON.stringify({ step, from: from.name, to: row.state, calls: row.callCount, tail: (row.callTail || []).slice(-4) }));
    return row;
  };
  const toShooting = (tag) => {
    for (let i = 0; i < 8 && s.screen() !== 'shooting'; i++) act(tag + '-' + i, () => press('menu'), { shot: false });
  };

  idle(800);
  const pointers = {};
  for (const [key, [expect, count, width]] of Object.entries(LIVE)) {
    const id = Number(key);
    let pointer = null;
    let error = null;
    try {
      const ret = callSaved(() => l.call(native(LOOKUP), { d0: id, a0: 0 }, null, null, 200000));
      const desc = ret.a0 >>> 0;
      pointer = desc ? l.sim.u32(desc + 4) >>> 0 : 0;
    } catch (e) { error = String(e && e.message || e); }
    const mem = [];
    if (pointer) {
      const raw = l.sim.read(pointer, count * width);
      for (let i = 0; i < count; i++) {
        mem.push(width === 2 ? raw[i * 2] | (raw[i * 2 + 1] << 8) : raw[i]);
      }
    }
    const via = arr(id, count);
    pointers[hex(id)] = { expect: hex(expect), pointer: pointer === null ? null : hex(pointer), match: pointer === expect, mem, via, error };
  }
  emit({ step: 'live-pointers', role: 'observe', pointers });
  snap('baseline', { shot: true });

  const opened = act('open-up', () => press('up'));
  if (opened.screen !== 'direct') throw new Error('open stayed on ' + opened.screen + ' ' + opened.state);
  traced('dial', () => dial('main', 1));
  traced('ok', () => press('ok'));
  toShooting('after-ok');

  act('open-menu', () => press('up'), { shot: false });
  traced('menu', () => press('menu'));
  toShooting('after-menu');

  act('open-s1', () => press('up'), { shot: false });
  traced('s1', () => press('s1'));
  toShooting('after-s1');

  act('open-play', () => press('up'), { shot: false });
  traced('play', () => press('play'));
  toShooting('after-play');

  act('menu-open', () => press('menu'), { shot: false });
  for (let i = 0; i < 24; i++) {
    let texts = [];
    try { texts = walk.read().texts.map((t) => t.text); } catch { texts = []; }
    if (texts.some((t) => String(t).includes('AF Target Settings'))) { emit({ step: 'tab', role: 'observe', i, texts }); break; }
    act('tab-' + i, () => press('left'), { shot: false });
  }
  act('page-ok', () => press('ok'), { shot: true });
  for (let i = 0; i < 5; i++) act('c1-down-' + i, () => press('down'), { shot: false });
  act('c1-right', () => press('right'), { shot: true });
  traced('size-dial', () => dial('main', 1));
  act('size-sub', () => dial('sub', 1), { shot: false });
  traced('size-ok', () => press('ok'));
  for (const slot of ['c2', 'c3', 'c4']) {
    act(slot + '-down', () => press('down'), { shot: false });
    act(slot + '-right', () => press('right'), { shot: slot === 'c2' });
    act(slot + '-dial', () => dial('main', 1), { shot: false });
    act(slot + '-sub', () => dial('sub', 1), { shot: false });
    act(slot + '-ok', () => press('ok'), { shot: true });
  }

  toShooting('before-power');
  act('power-open', () => press('up'), { shot: false });
  let powerError = null;
  try { act('power', () => { s.power_down(); }, { shot: false, trace: false }); }
  catch (e) { powerError = String(e && e.message || e); }
  emit({ step: 'power-result', role: 'observe', powerError, ...stateOf(), screen: (() => { try { return s.screen(); } catch { return null; } })() });
  emit({ step: 'done', role: 'observe', ok: true });
} catch (e) {
  failed = String(e && e.stack ? e.stack : e);
  emit({ step: 'done', role: 'observe', ok: false, error: failed });
  process.exitCode = 1;
} finally {
  try { if (pl.session) pl.close_session(); } catch { /* closed */ }
  writeFileSync(OUT, lines.join('\n') + (lines.length ? '\n' : ''));
}
if (failed) process.exit(1);
