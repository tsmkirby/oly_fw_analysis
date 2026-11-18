// Dynamic ownership probe for bank-7 key 0x5b82, second version.
// Adds art-page dials (id main/sub), art-filter type settings, and a menu walk
// that enters Custom Mode and scans tabs for a settings reset.
// Usage: node26 work/scripts/own_5b82_v2.mjs om-emu <mark|control> <jsonl> <nvram.json>
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, mode, outPath, nvramPath] = process.argv.slice(2);
assert(checkout && (mode === 'mark' || mode === 'control') && outPath && nvramPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadImage, loadBlock, loadNand, createHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { fileNvram } = await use('host/nvram.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');

const KEY = 0x5b82;
const NAMED = [5, 12, 13];
const UNNAMED = [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14, 15];
const marker = (i) => (0x5a00 + i * 7 + 1) & 0xffff;
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const GET = native(0x60063380);
const SET = native(0x60063431);

mkdirSync(dirname(resolve(outPath)), { recursive: true });
const emit = (x) => {
  const line = JSON.stringify({ mode, ...x });
  appendFileSync(outPath, line + '\n');
  console.log(line);
};

const fw = { rom: loadImage(), resBlock: loadBlock() };
const nvramFile = resolve(nvramPath);
const open = () => {
  const pl = new Player(
    { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
    { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000,
      machine: { coverage: { mark() {}, stub() {} } }, nvram: fileNvram(nvramFile) },
  );
  pl.camapp_components = true;
  pl.camapp_native_tra = true;
  pl.open_session();
  return pl;
};

const u16 = (v) => (v >>> 0) & 0xffff;
let pl;
try {
  pl = open();
  const s = pl.session;
  const l = s.lab;
  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const readOne = (index) => u16(l.call(GET, { d0: KEY, d1: index, a0: 0 }, null, null, 2000000).d0);
  const readAll = () => Array.from({ length: 16 }, (_, i) => readOne(i));
  const texts = () => {
    const seen = [];
    const log = l.draw_log;
    for (let i = Math.max(0, log.length - 400); i < log.length; i++) {
      const e = log[i];
      if (e && e.op === 'text' && e.text && !seen.includes(e.text)) seen.push(e.text);
    }
    return seen.slice(-40);
  };
  const press = (id) => {
    pl.run_input({ type: 'key', id, action: 'down' });
    idle(60);
    pl.run_input({ type: 'key', id, action: 'up' });
    idle(350);
  };
  let stock = null;
  const snap = (step, extra = {}) => {
    const cells = readAll();
    const delta = [];
    if (stock) {
      for (let i = 0; i < 16; i++) if (cells[i] !== stock[i]) delta.push({ i, was: stock[i], now: cells[i] });
    }
    const markerLost = mode === 'mark' ? UNNAMED.filter((i) => cells[i] !== marker(i)) : [];
    emit({ step, cells, delta, markerLost, ...extra });
    return cells;
  };
  const safe = (step, fn) => {
    try { return fn(); }
    catch (e) { emit({ step, boundary: String(e && e.stack ? e.stack : e).slice(0, 1200) }); return null; }
  };

  emit({ step: 'boot', imageBase: IMAGE_BASE, get: '0x' + GET.toString(16), set: '0x' + SET.toString(16),
    nvram: nvramFile, nvramLoaded: l.store_log?.nvram?.loaded ?? null });
  idle(2000);
  stock = snap('startup', {
    family: safe('get-897', () => s.get(897)),
    art: safe('get-867', () => s.get(867)),
    colortone: safe('get-111', () => s.get(111)),
    cursor: safe('get-cursors', () => ({ 2017: s.get(2017), 2031: s.get(2031), 2034: s.get(2034) })),
    dial: s.status().mode_dial,
    dialNames: s.status().mode_dial_positions,
    creative: s.status().creative_dial,
  });

  if (mode === 'mark') {
    const wrote = [];
    for (const i of UNNAMED) {
      const value = marker(i);
      const ret = l.call(SET, { d0: KEY, d1: i, a0: 0, a1: value }, null, null, 2000000);
      const back = readOne(i);
      wrote.push({ i, value, ret: ret.d0 >>> 0, back });
    }
    emit({ step: 'mark-write', wrote });
    const cells = readAll();
    stock = cells.map((v, i) => (UNNAMED.includes(i) ? v : stock[i]));
    // stock baseline for later deltas is the post-mark image: named stay at the startup values,
    // unnamed are the markers. Rebuild stock from the read so deltas mean "changed after the mark".
    stock = cells.slice();
    snap('mark-readback');
  }

  safe('creative-dial', () => {
    for (const pos of [0, 1, 2, 3, 4]) {
      pl.run_input({ type: 'switch', id: 'creative_dial', value: pos });
      idle(700);
      snap('creative-' + pos, {
        family: s.get(897),
        art: safe('art', () => s.get(867)),
        texts: texts(),
        screen: s.screen(),
      });
    }
  });

  safe('art-dials', () => {
    pl.run_input({ type: 'switch', id: 'creative_dial', value: 3 });
    idle(700);
    snap('art-page', { texts: texts(), art: safe('art', () => s.get(867)) });
    for (let n = 0; n < 8; n++) {
      pl.run_input({ type: 'dial', id: 'main', detents: 1 });
      idle(400);
      snap('art-main-dial-' + (n + 1), { art: safe('art', () => s.get(867)), type: safe('type', () => s.get(361)), texts: texts() });
    }
    for (let n = 0; n < 4; n++) {
      pl.run_input({ type: 'dial', id: 'sub', detents: 1 });
      idle(400);
      snap('art-sub-dial-' + (n + 1), { art: safe('art', () => s.get(867)), type: safe('type', () => s.get(361)), texts: texts() });
    }
    const keys = ['right', 'right', 'down', 'down', 'ok', 'right', 'up'];
    keys.forEach((key, n) => {
      press(key);
      snap('art-key-' + n + '-' + key, { texts: texts(), art: safe('art', () => s.get(867)), type: safe('type', () => s.get(364)) });
    });
  });

  safe('scalar-settings', () => {
    for (const sid of [867, 897, 361, 362, 363, 364, 365, 366, 367, 368, 111, 2017, 2031, 2034, 568, 2256, 2257, 2258, 2259, 2260, 2391, 2451]) {
      let keys = null, error = null;
      try { keys = l.scalar_keys(sid, 'probe'); }
      catch (e) { error = String(e.message || e).slice(0, 300); }
      const before = safe('get-' + sid, () => s.get(sid));
      emit({ step: 'scalar-info', sid, before, keys, error });
      if (!keys || !keys.length) continue;
      const original = before;
      const sample = keys.length > 12 ? [keys[0], keys[Math.floor(keys.length / 2)], keys[keys.length - 1]] : keys.slice();
      for (const value of sample) {
        if (value === original) continue;
        try {
          s.set(sid, value);
          idle(300);
          snap('set-' + sid + '-' + value, { sid, value, read: s.get(sid), sampled: sample.length !== keys.length });
        } catch (e) {
          emit({ step: 'set-' + sid + '-' + value, boundary: String(e.message || e).slice(0, 400) });
        }
      }
      if (keys.includes(original)) {
        try { s.set(sid, original); idle(200); } catch (e) { emit({ step: 'restore-' + sid, boundary: String(e.message || e).slice(0, 300) }); }
      }
      snap('restored-' + sid);
    }
  });

  safe('mode-dial', () => {
    const names = s.status().mode_dial_positions || [];
    const home = s.status().mode_dial;
    emit({ step: 'mode-dial-names', names, home });
    for (let i = 0; i < names.length; i++) {
      pl.run_input({ type: 'switch', id: 'mode_dial', value: i });
      idle(600);
      snap('mode-dial-' + i, { label: names[i] && (names[i].label || names[i].name), screen: s.screen() });
    }
    pl.run_input({ type: 'switch', id: 'mode_dial', value: home });
    idle(400);
    snap('mode-dial-home');
  });

  safe('menu-reset', () => {
    const interesting = (t) => /reset|initial|custom|assign|recall|save set/i.test(t);
    press('menu');
    snap('menu-open', { texts: texts(), screen: s.screen() });
    press('ok');
    snap('menu-first-ok', { texts: texts(), screen: s.screen() });
    for (let i = 0; i < 6; i++) {
      const t = texts();
      if (t.some(interesting)) {
        press('ok');
        snap('menu-custom-' + i, { texts: texts(), screen: s.screen() });
      }
      press('down');
      snap('menu-down-' + i, { texts: texts(), screen: s.screen() });
    }
    if (s.screen() !== 'menu' && s.screen() !== 'direct') press('menu');
    if (s.screen() === 'direct') press('menu');
    if (s.screen() !== 'menu') press('menu');
    snap('menu-back', { texts: texts(), screen: s.screen() });
    for (let tab = 0; tab < 8 && s.screen() === 'menu'; tab++) {
      press('left');
      snap('menu-tab-' + tab, { texts: texts(), screen: s.screen() });
      const t = texts();
      if (t.some((x) => /reset|initial/i.test(x))) {
        press('right');
        press('ok');
        idle(500);
        snap('menu-reset-enter-' + tab, { texts: texts(), screen: s.screen() });
        press('ok');
        idle(800);
        snap('menu-reset-confirm-' + tab, { texts: texts(), screen: s.screen() });
      }
      press('down');
    }
    if (s.screen() === 'menu' || s.screen() === 'direct') press('menu');
    idle(800);
    snap('menu-close', { saves: l.store_log?.nvram?.saves ?? null, texts: texts(), screen: s.screen() });
  });

  const saves = l.store_log?.nvram?.saves ?? [];
  let fileBytes = null;
  try { fileBytes = statSync(nvramFile).size; } catch (e) { fileBytes = String(e.message || e); }
  emit({ step: 'session-1-end', saves, fileBytes });
  pl.close_session();
  pl = null;

  const pl2 = open();
  try {
    const s2 = pl2.session;
    const l2 = s2.lab;
    const idle2 = (ms) => {
      const to = l2.lab_time() + ms * 1e6;
      while (l2.lab_time() < to) s2.idle_slice(Math.min(to, l2.lab_time() + 50e6));
    };
    const read2 = () => Array.from({ length: 16 }, (_, i) => u16(l2.call(GET, { d0: KEY, d1: i, a0: 0 }, null, null, 2000000).d0));
    idle2(2000);
    const cells = read2();
    const markerLost = mode === 'mark' ? UNNAMED.filter((i) => cells[i] !== marker(i)) : [];
    emit({ step: 'session-2', cells, markerLost, loaded: l2.store_log?.nvram?.loaded ?? null,
      named: NAMED.map((i) => cells[i]) });
  } finally {
    pl2.close_session();
  }
  emit({ step: 'done' });
} catch (e) {
  emit({ step: 'fatal', boundary: String(e && e.stack ? e.stack : e).slice(0, 2000) });
  process.exitCode = 1;
} finally {
  if (pl && pl.session) {
    try { pl.close_session(); } catch { /* already closed */ }
  }
}
