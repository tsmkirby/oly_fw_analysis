// Experiment l2, measurement only. No overlay and no behaviour hook.
// GUI-state transitions and cell diffs for the stock custom-size editor,
// C1 and C2. Do not edit after it has run.
// Usage: node26 work/scripts/measure_size_l2.mjs om-emu
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/measure_size_l2.mjs om-emu\n');
  process.exit(2);
}
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const OUT = resolve('work/out/measure-size-l2.jsonl');
const GETTER = 0x60063380;

const { loadNand, loadImage, loadBlock, createHash: fwHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { apply_uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');
const { fileNvram } = await use('host/nvram.mjs');

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
  console.log(JSON.stringify({ step: row.step, screen: row.screen, state: row.state, diff: row.diff, trans: row.transitions }));
};
const native = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
const hex = (v) => '0x' + (v >>> 0).toString(16);

const fw = { rom: loadImage(), resBlock: loadBlock(), summary: null, changed: [] };
apply_uiin_layout(fw.rom);
const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  {
    ...fw, nand: loadNand(), createHash: fwHash, wallClock: () => performance.now() / 1000,
    machine: { coverage: { mark() {}, stub() {} } }, nvram: fileNvram(resolve('work/out/nvram-measure-size-l2.json')),
    patch: null, patchRanges: [], loaded: 'on',
  },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

let failed = null;
try {
  const self = resolve('work/scripts/measure_size_l2.mjs');
  const seeds = [self];
  USE_RE.lastIndex = 0;
  let match;
  const text = readFileSync(self, 'utf8');
  while ((match = USE_RE.exec(text))) seeds.push(resolve(checkout, 'emu', match[1]));
  writeFileSync(resolve('work/out/import-inventory-l2.json'), JSON.stringify({ hashed: 'execution', modules: inventory(seeds) }, null, 2) + '\n');
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const names = [];
  for (const [n, name] of l.state_names) {
    if (/DIRECT|SIZE|CUSTOM|TARGET|AREA|AF/.test(name)) names.push(hex(n) + ' ' + name);
  }
  emit({ step: 'state-names', role: 'observe', names });
  const sets = [];
  l.observe(native(0x60063431), (_lab, r) => {
    if (sets.length >= 40) return;
    const key = r.d0 & 0xffff;
    if (key === 0x1dd1 || key === 0x1de1 || key === 0x1df1 || key === 0x5a11 || key === 0x99a1) {
      sets.push({ key: hex(key), index: r.d1 & 0xffff, a1: hex(r.a1 >>> 0), caller: hex(r.mdr >>> 0) });
    }
  }, 'obs-setter-l2');
  const callSaved = (fn) => {
    const saved = l.sim.registers();
    try { return fn(); }
    finally { l.sim.reset(saved); }
  };
  const readKey = (key, index) => callSaved(() => l.call(native(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff);
  const cells = () => ({
    k99a1: [readKey(0x99a1, 0), readKey(0x99a1, 1)],
    k1dd1: Array.from({ length: 10 }, (_, i) => readKey(0x1dd1, i)),
    k1de1: Array.from({ length: 8 }, (_, i) => readKey(0x1de1, i)),
    k1df1: Array.from({ length: 9 }, (_, i) => readKey(0x1df1, i)),
    k5a11: Array.from({ length: 11 }, (_, i) => readKey(0x5a11, i)),
  });
  const diffOf = (a, b) => {
    const out = [];
    for (const k of Object.keys(a)) {
      const x = a[k];
      const y = b[k];
      if (Array.isArray(x)) {
        for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) out.push([k + '[' + i + ']', x[i], y[i]]);
      } else if (x !== y) out.push([k, x, y]);
    }
    return out;
  };
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const press = (k) => { s.key(k, 'down'); s.camapp.pump(); idle(80); s.key(k, 'up'); s.camapp.pump(); idle(500); };
  const dial = (which) => { s.dial_input(which, 1); s.camapp.pump(); idle(500); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 8 });
  let shotN = 0;
  let before = null;
  const snap = (step) => {
    let frame = null;
    let texts = [];
    let textError = null;
    try {
      const scr = walk.read();
      texts = scr.texts.map((t) => t.text);
      frame = scr.frame;
    } catch (e) {
      textError = String(e && e.message || e);
      frame = s.frame('boundary');
    }
    if (!frame) throw new Error('screenshot failed at ' + step);
    const file = resolve('work/out/measure-size-l2-' + String(shotN).padStart(2, '0') + '-' + step + '.png');
    shotN += 1;
    write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
    const now = cells();
    const n = l.state();
    emit({
      step, role: 'observe', screen: s.screen(), state: hex(n) + ' ' + l.state_name(n),
      texts, textError, screenshot: file.split(/[/\\]/).pop(),
      diff: before ? diffOf(before, now) : [], cells: now, sets: sets.splice(0, sets.length),
    });
    before = now;
  };
  const act = (step, fn) => {
    const ev0 = l.events.length;
    const from = l.state();
    fn();
    snap(step);
    const transitions = l.events.slice(ev0).filter((e) => e[0] === 'state');
    const row = JSON.parse(lines[lines.length - 1]);
    row.from = hex(from) + ' ' + l.state_name(from);
    row.transitions = transitions;
    lines[lines.length - 1] = JSON.stringify(row);
    writeFileSync(OUT, lines.join('\n') + '\n');
    console.log(JSON.stringify({ step, from: row.from, to: row.state, ntrans: transitions.length, diff: row.diff }));
  };
  idle(700);
  snap('baseline');
  act('menu', () => press('menu'));
  for (let i = 0; i < 24; i++) {
    let texts = [];
    try { texts = walk.read().texts.map((t) => t.text); } catch { texts = []; }
    if (texts.some((t) => String(t).includes('AF Target Settings'))) break;
    act('tab-' + i, () => press('left'));
  }
  act('page-ok', () => press('ok'));
  for (let i = 0; i < 5; i++) act('c1-down-' + i, () => press('down'));
  act('c1-right', () => press('right'));
  act('c1-dial', () => dial('main'));
  act('c1-sub', () => dial('sub'));
  act('c1-ok', () => press('ok'));
  act('c2-down', () => press('down'));
  act('c2-right', () => press('right'));
  act('c2-dial', () => dial('main'));
  act('c2-sub', () => dial('sub'));
  act('c2-ok', () => press('ok'));
  act('back-menu', () => press('menu'));
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
