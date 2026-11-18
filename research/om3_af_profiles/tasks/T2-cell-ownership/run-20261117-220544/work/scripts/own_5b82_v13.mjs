// From the C1 action list, step down to Reset and confirm it.
// Usage: node26 work/scripts/own_5b82_v13.mjs om-emu <mark|control> <jsonl> <nvram.json>
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
  const textSince = (from) => {
    const seen = [];
    const log = l.draw_log;
    for (let i = from; i < log.length; i++) {
      const e = log[i];
      if (e && e.op === 'text' && e.text && !seen.includes(e.text)) seen.push(e.text);
    }
    return seen;
  };
  const texts = () => textSince(Math.max(0, l.draw_log.length - 400));
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

  const walk = (step, goals) => {
    const w = new MenuWalk({
      press: (k) => press(k),
      frame: () => s.frame('boundary'),
      draws: () => l.draw_log,
    }, { limit: 16 });
    try {
      w.to(goals);
      emit({ step, log: w.log, texts: texts(), screen: s.screen() });
      return true;
    } catch (e) {
      emit({ step, boundary: String(e.message || e).slice(0, 700), log: w.log, texts: texts(), screen: s.screen() });
      return false;
    }
  };
  const fill = (value) => {
    for (const i of UNNAMED) l.call(SET, { d0: KEY, d1: i, a0: 0, a1: value }, null, null, 2000000);
  };

  safe('custom-mode', () => {
    const markAt = () => l.draw_log.length;
    press('menu');
    let fresh = textSince(0);
    snap('menu-open', { texts: fresh.slice(-20), screen: s.screen() });
    let found = fresh.some((t) => t.includes('@A02C@Custom Mode'));
    for (let tab = 0; tab < 36 && !found && s.screen() === 'menu'; tab++) {
      const at = markAt();
      press('left');
      fresh = textSince(at);
      snap('tab-left-' + tab, { texts: fresh, screen: s.screen() });
      found = fresh.some((t) => t.includes('@A02C@Custom Mode'));
    }
    if (!found) {
      emit({ step: 'custom-not-found', boundary: 'tab walk did not draw Custom Mode or Basic Settings', screen: s.screen() });
    } else {
      const entered = walk('enter-custom', [{ row: ['@A02C@Custom Mode'] }]);
      snap('custom-page', { entered, texts: textSince(Math.max(0, l.draw_log.length - 200)), screen: s.screen() });
      const at = markAt();
      press('ok');
      snap('custom-c1', { texts: textSince(at), screen: s.screen() });
      let saw = false;
      for (let n = 0; n < 6 && !saw; n++) {
        const from = markAt();
        press('down');
        const t = textSince(from);
        snap('action-' + n, { texts: t, screen: s.screen() });
        saw = t.some((x) => x.includes('Initializes the settings'));
      }
      press('ok');
      idle(500);
      const landed = textSince(Math.max(0, l.draw_log.length - 80));
      snap('reset-landed', { texts: landed, screen: s.screen() });
      if (landed.some((t) => t === 'Yes' || t.includes('Initializes'))) press('ok');
      idle(800);
      snap('after-reset', { texts: textSince(Math.max(0, l.draw_log.length - 80)), screen: s.screen() });
    }
    for (let n = 0; n < 4 && s.screen() !== 'shooting'; n++) press('menu');
    idle(600);
    snap('menu-close', { saves: l.store_log?.nvram?.saves ?? null, screen: s.screen(), texts: textSince(Math.max(0, l.draw_log.length - 80)) });
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
