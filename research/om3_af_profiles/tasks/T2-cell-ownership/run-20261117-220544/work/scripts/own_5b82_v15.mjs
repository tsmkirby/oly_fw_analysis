// Correction-round C1 probe. Finds Custom Mode by walking menu tabs, assigns
// the current settings to C1, changes the unnamed cells, then recalls C1.
// The control run is the same walk without the initial marker.
// Usage: node26 work/scripts/own_5b82_v15.mjs om-emu <mark|control> <jsonl> <nvram.json>
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, mode, outPath, nvramPath] = process.argv.slice(2);
assert(checkout && (mode === 'mark' || mode === 'control') && outPath && nvramPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { fileNvram } = await use('host/nvram.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { loadImage, loadBlock, loadNand, createHash } = await use('checks/lib/env.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');

const KEY = 0x5b82;
const NAMED = [5, 12, 13];
const UNNAMED = [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14, 15];
const CURSORS = [2017, 2031, 2034];
const marker = (i) => (0x5a00 + i * 7 + 1) & 0xffff;
const second = (i) => (0xc300 + i) & 0xffff;
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const GET = native(0x60063380);
const SET = native(0x60063431);
const MAPPED_SET = native(0x6041937f);
const WHOLE_KEY = native(0x604193ca);

mkdirSync(dirname(resolve(outPath)), { recursive: true });
const emit = (x) => {
  const line = JSON.stringify({ mode, ...x });
  appendFileSync(outPath, line + '\n');
  console.log(line);
};

const fw = { rom: loadImage(), resBlock: loadBlock() };
const nvramFile = resolve(nvramPath);
process.env.OM_EMU_NVRAM = nvramFile;
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
  const press = (id) => {
    pl.run_input({ type: 'key', id, action: 'down' });
    idle(80);
    pl.run_input({ type: 'key', id, action: 'up' });
    idle(500);
  };
  let baseline = null;
  const snap = (step, extra = {}) => {
    const cells = readAll();
    const delta = [];
    if (baseline) {
      for (let i = 0; i < 16; i++) if (cells[i] !== baseline[i]) delta.push({ i, was: baseline[i], now: cells[i] });
    }
    const markerLost = mode === 'mark' ? UNNAMED.filter((i) => cells[i] !== marker(i)) : [];
    emit({ step, cells, delta, markerLost, named: NAMED.map((i) => cells[i]), ...extra });
    return cells;
  };
  const walk = new MenuWalk({
    press,
    frame: () => s.frame('boundary'),
    draws: () => l.draw_log,
  }, { limit: 36 });
  const texts = () => {
    try { return walk.read().texts.map((t) => t.text); }
    catch (e) { return ['<read-failed ' + String(e.message || e).slice(0, 180) + '>']; }
  };
  const go = (step, goals) => {
    try {
      walk.to(goals);
      snap(step, { texts: texts(), walk: walk.log.slice(-8) });
      return true;
    } catch (e) {
      emit({ step, boundary: String(e.message || e).slice(0, 700), texts: texts(), walk: walk.log.slice(-8) });
      return false;
    }
  };
  const findCustom = (tag) => {
    const pages = [];
    press('menu');
    idle(500);
    for (let n = 0; n < 16; n++) {
      const names = texts();
      const hit = names.find((t) => t.includes('Custom Mode'));
      pages.push({ n, hit: hit || null, sample: names.slice(0, 8), screen: s.screen() });
      if (hit) {
        emit({ step: tag + '-found', pages, hit });
        return hit;
      }
      press('left');
    }
    emit({ step: tag + '-missing', boundary: 'Custom Mode not on 16 tabs', pages });
    return null;
  };

  emit({ step: 'boot', nvram: nvramFile });
  idle(2000);
  baseline = snap('startup');
  if (mode === 'mark') {
    const wrote = [];
    for (const i of UNNAMED) {
      const value = marker(i);
      const ret = l.call(SET, { d0: KEY, d1: i, a0: 0, a1: value }, null, null, 2000000);
      wrote.push({ i, value, ret: ret.d0 >>> 0, back: readOne(i) });
    }
    emit({ step: 'mark-write', wrote });
    baseline = readAll();
    snap('mark-readback');
  }

  const custom = findCustom('assign');
  let assigned = false;
  if (custom) {
    const opened = go('c1-custom', [{ row: [custom] }]);
    const c1 = opened ? texts().find((t) => t === 'C1') : null;
    const entered = c1 ? go('c1-enter', [{ row: [c1] }]) : false;
    const assign = entered ? texts().find((t) => t === 'Assign') : null;
    assigned = assign ? go('c1-assign', [{ row: [assign] }]) : false;
    const confirm = assigned ? texts().find((t) => t === 'Set' || t === 'Yes') : null;
    if (confirm) go('c1-assign-confirm', [{ row: [confirm] }]);
    else if (assigned) snap('c1-assign-no-confirm', { texts: texts() });
    if (!assigned) emit({ step: 'c1-assign', boundary: 'Assign was not completed', texts: texts() });
  }

  const wrote = [];
  for (const i of UNNAMED) {
    const value = second(i);
    const ret = l.call(SET, { d0: KEY, d1: i, a0: 0, a1: value }, null, null, 2000000);
    wrote.push({ i, value, ret: ret.d0 >>> 0, back: readOne(i) });
  }
  emit({ step: 'live-change', note: 'probe-induced second pattern', wrote, assigned });
  snap('live-change-readback');

  if (s.screen() === 'menu' || s.screen() === 'direct') press('menu');
  idle(300);
  if (s.screen() === 'menu' || s.screen() === 'direct') press('menu');
  idle(300);
  const custom2 = findCustom('recall');
  if (custom2) {
    const opened = go('c1-recall-custom', [{ row: [custom2] }]);
    const c1 = opened ? texts().find((t) => t === 'C1') : null;
    const entered = c1 ? go('c1-recall-enter', [{ row: [c1] }]) : false;
    const recall = entered ? texts().find((t) => t === 'Recall') : null;
    const recalled = recall ? go('c1-recall', [{ row: [recall] }]) : false;
    const confirm = recalled ? texts().find((t) => t === 'Yes' || t === 'Set') : null;
    if (confirm) go('c1-recall-confirm', [{ row: [confirm] }]);
    else if (recalled) snap('c1-recall-no-confirm', { texts: texts() });
    if (!recalled) emit({ step: 'c1-recall', boundary: 'Recall was not completed', texts: texts() });
  }
  snap('after-recall', { screen: s.screen() });

  // The three cursor settings are not rows of the top menu. Record the pages
  // whose text names the art filters, without treating "Menu Cursor Settings" as one.
  if (s.screen() !== 'menu') press('menu');
  const cursorPages = [];
  for (let n = 0; n < 12; n++) {
    const names = texts();
    const hit = names.filter((t) => /toy photo|vintage|partial color/i.test(t));
    cursorPages.push({ n, hit, sample: names.slice(0, 6) });
    if (hit.length) break;
    press('left');
  }
  emit({ step: 'cursor-page-search', cursorPages, boundary: cursorPages.some((p) => p.hit.length) ? undefined : 'no Toy Photo, Vintage, or Partial Color row in 12 tabs' });
  snap('after-cursor-search');

  for (const sid of CURSORS) {
    const before = readAll();
    let ret = null;
    let error = null;
    try { ret = l.call(MAPPED_SET, { d0: sid, d1: 0x2222 }, null, null, 2000000).d0 >>> 0; }
    catch (e) { error = String(e.message || e).slice(0, 300); }
    const after = readAll();
    const changed = after.flatMap((v, i) => (v === before[i] ? [] : [{ i, was: before[i], now: v }]));
    emit({ step: 'mapped-setter-' + sid, ret, error, changed, note: 'direct call of FUN_6041937f' });
  }

  if (s.screen() === 'menu' || s.screen() === 'direct') press('menu');
  idle(600);
  let fileBytes = null;
  try { fileBytes = statSync(nvramFile).size; } catch (e) { fileBytes = String(e.message || e); }
  emit({ step: 'session-1-end', saves: l.store_log?.nvram?.saves ?? [], fileBytes });
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
    const loaded = read2();
    emit({ step: 'session-2', cells: loaded, named: NAMED.map((i) => loaded[i]),
      loaded: l2.store_log?.nvram?.loaded ?? null });
    for (const sid of CURSORS) {
      const before = read2();
      let ret = null;
      let error = null;
      try { ret = l2.call(WHOLE_KEY, { d0: sid }, null, null, 2000000).d0 >>> 0; }
      catch (e) { error = String(e.message || e).slice(0, 300); }
      const after = read2();
      const changed = after.flatMap((v, i) => (v === before[i] ? [] : [{ i, was: before[i], now: v }]));
      emit({ step: 'whole-key-default-' + sid, ret, error, changed, cells: after,
        note: 'direct call of FUN_604193ca; the menu dispatcher does not pass these UI ids' });
    }
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
