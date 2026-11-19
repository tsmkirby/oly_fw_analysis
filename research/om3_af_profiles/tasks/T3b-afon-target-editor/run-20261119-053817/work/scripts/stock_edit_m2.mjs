// Second stock measurement. One direct-screen session.
// Arrow opens the screen. The main dial changes zone type. This run moves a
// Single target, dials on to a custom zone, confirms, then cancels a second edit.
// Accessors are observed, not replaced. No overlay. Do not edit after it has run.
// Usage: node26 work/scripts/stock_edit_m2.mjs om-emu
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/stock_edit_m2.mjs om-emu\n');
  process.exit(2);
}
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const OUT = resolve('work/out/stock-edit-m2.jsonl');
const GETTER = 0x60063380;
const SETTER = 0x60063431;
const WRAP = 0x6041a202;
const MAPPED = 0x6041937f;

const { loadNand, loadImage, loadBlock, createHash: fwHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { apply_uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');
const { fileNvram } = await use('host/nvram.mjs');

const lines = [];
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({
    step: row.step, screen: row.screen, diff: row.diff, sets: row.sets, wraps: row.wraps, mapped: row.mapped,
  }));
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const hex = (v) => '0x' + (v >>> 0).toString(16);
const native = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
const fw = { rom: loadImage(), resBlock: loadBlock(), summary: null, changed: [] };
apply_uiin_layout(fw.rom);
const nv = fileNvram(resolve('work/out/nvram-stock-m2.json'));
const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  {
    ...fw, nand: loadNand(), createHash: fwHash, wallClock: () => performance.now() / 1000,
    machine: { coverage: { mark() {}, stub() {} } }, nvram: nv, patch: null, patchRanges: [], loaded: 'on',
  },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

function diffCells(a, b, path = '', out = []) {
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) out.push([path + '[' + i + ']', a[i], b[i]]);
    return out;
  }
  if (a && b && typeof a === 'object') {
    for (const k of Object.keys(a)) diffCells(a[k], b[k], path ? path + '.' + k : k, out);
    return out;
  }
  if (a !== b) out.push([path, a, b]);
  return out;
}

let failed = null;
try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const gate = { reading: false, on: false };
  const sets = [];
  const wraps = [];
  const mapped = [];
  const pack = (r) => ({
    d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0, d3: r.d3 >>> 0,
    a0: hex(r.a0 >>> 0), a1: hex(r.a1 >>> 0), caller: hex(r.mdr >>> 0),
  });
  l.observe(native(SETTER), (_lab, r) => {
    if (!gate.on || gate.reading || sets.length >= 40) return;
    sets.push(pack(r));
  }, 'obs-setter');
  l.observe(native(WRAP), (_lab, r) => {
    if (!gate.on || gate.reading || wraps.length >= 40) return;
    wraps.push(pack(r));
  }, 'obs-wrap');
  l.observe(native(MAPPED), (_lab, r) => {
    if (!gate.on || gate.reading || mapped.length >= 40) return;
    mapped.push(pack(r));
  }, 'obs-mapped');
  const callSaved = (fn) => {
    const saved = l.sim.registers();
    gate.reading = true;
    try { return fn(); }
    finally { gate.reading = false; l.sim.reset(saved); }
  };
  const readKey = (key, index) => callSaved(() => l.call(native(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff);
  const arr = (key, n) => Array.from({ length: n }, (_, i) => readKey(key, i));
  const cells = () => ({
    k99a1: arr(0x99a1, 8),
    k9a41: arr(0x9a41, 2),
    k5962: arr(0x5962, 6),
    k1dd1: arr(0x1dd1, 10),
    k84d1: readKey(0x84d1, 0),
    k88b2: readKey(0x88b2, 0),
    k90d1: arr(0x90d1, 8),
    k99d2: arr(0x99d2, 3),
    kdfa1: readKey(0xdfa1, 0),
    k9fa1: arr(0x9fa1, 3),
    k1db1: readKey(0x1db1, 0),
    k1dc1: readKey(0x1dc1, 0),
    ke91: readKey(0xe91, 3),
    k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
  });
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const dial = (which, n) => { s.dial_input(which, n); s.camapp.pump(); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 8 });
  let shotN = 0;
  const clear = () => { sets.length = 0; wraps.length = 0; mapped.length = 0; };
  const snap = (step, before) => {
    let texts = [];
    let frame = null;
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
    const file = resolve('work/out/stock-m2-' + String(shotN).padStart(2, '0') + '-' + step + '.png');
    shotN += 1;
    write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
    const now = cells();
    const row = {
      hook: 'observe', role: 'observe', step,
      screen: s.screen(), texts, textError,
      screenshot: file.split(/[/\\]/).pop(),
      cells: now, diff: before ? diffCells(before, now) : [],
      sets: sets.slice(), wraps: wraps.slice(), mapped: mapped.slice(),
    };
    emit(row);
    return now;
  };
  const act = (step, before, fn) => {
    clear();
    let pressError = null;
    try { fn(); } catch (e) { pressError = String(e && e.message || e); }
    const now = snap(step, before);
    if (pressError) lines[lines.length - 1] = lines[lines.length - 1].replace(/}$/, ',"pressError":' + JSON.stringify(pressError) + '}');
    return now;
  };

  emit({
    hook: 'observe', role: 'observe', step: 'setup',
    note: 'Stock image, fresh nvram. Observed 0x60063431, 0x6041a202 and 0x6041937f. No behaviour hook.',
    imageSha: createHash('sha256').update(fw.rom).digest('hex'),
  });
  gate.on = true;
  idle(1200);
  let before = snap('baseline', null);
  before = act('open-up', before, () => press('up'));
  before = act('dial-single', before, () => dial('main', 1));
  for (const k of ['right', 'right', 'right', 'js_right', 'js_up']) {
    before = act('move-' + k + '-' + shotN, before, () => press(k));
  }
  for (let i = 0; i < 9; i++) before = act('dial-' + i, before, () => dial('main', 1));
  before = act('sub-on-last', before, () => dial('sub', 1));
  before = act('info-on-last', before, () => press('info'));
  const committed = act('confirm-ok', before, () => press('ok'));
  before = act('reopen', committed, () => press('up'));
  before = act('reopen-dial', before, () => dial('main', 1));
  act('cancel-menu', before, () => press('menu'));
  emit({ hook: 'observe', role: 'observe', step: 'done', ok: true });
} catch (e) {
  failed = String(e && e.stack ? e.stack : e);
  emit({ hook: 'observe', role: 'observe', step: 'done', ok: false, error: failed });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(OUT, lines.join('\n') + (lines.length ? '\n' : ''));
}
if (failed) process.exit(1);
