// Correction-round dynamic probe for key 0x5b82.
// C1 Assign, a deliberate live-cell change, C1 Recall, then the three cursor
// UI ids. A matching control run does the same steps without the marker.
// Usage: node26 work/scripts/own_5b82_v14.mjs om-emu <mark|control> <jsonl> <nvram.json>
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
const { MenuWalk, MenuWalkError } = await use('src/lab/menuwalk.mjs');
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
    idle(450);
  };
  let stock = null;
  const snap = (step, extra = {}) => {
    const cells = readAll();
    const delta = [];
    if (stock) {
      for (let i = 0; i < 16; i++) if (cells[i] !== stock[i]) delta.push({ i, was: stock[i], now: cells[i] });
    }
    const markerLost = mode === 'mark' ? UNNAMED.filter((i) => cells[i] !== marker(i)) : [];
    emit({ step, cells, delta, markerLost, named: NAMED.map((i) => cells[i]), ...extra });
    return cells;
  };
  const walk = new MenuWalk({
    press,
    frame: () => s.frame('boundary'),
    draws: () => l.draw_log,
  }, { limit: 48 });
  const texts = () => {
    try { return walk.read().texts.map((t) => t.text); }
    catch (e) { return ['<read-failed ' + String(e.message || e).slice(0, 240) + '>']; }
  };
  const go = (step, goals) => {
    try {
      walk.to(goals);
      snap(step, { texts: texts(), walk: walk.log.slice(-12) });
      return true;
    } catch (e) {
      emit({
        step, boundary: String(e && e.message ? e.message : e).slice(0, 800),
        texts: texts(), walk: walk.log.slice(-12),
      });
      return false;
    }
  };
  const rowNamed = (pred) => {
    const names = texts();
    return names.find(pred) || null;
  };

  emit({ step: 'boot', imageBase: IMAGE_BASE, nvram: nvramFile });
  idle(2000);
  stock = snap('startup', { dial: s.status().mode_dial, creative: s.status().creative_dial });

  if (mode === 'mark') {
    const wrote = [];
    for (const i of UNNAMED) {
      const value = marker(i);
      const ret = l.call(SET, { d0: KEY, d1: i, a0: 0, a1: value }, null, null, 2000000);
      wrote.push({ i, value, ret: ret.d0 >>> 0, back: readOne(i) });
    }
    emit({ step: 'mark-write', wrote });
    stock = readAll();
    snap('mark-readback');
  }

  // Assign the current settings, including the markers, to C1.
  press('menu');
  idle(600);
  snap('menu-open', { texts: texts(), screen: s.screen() });
  const custom = rowNamed((t) => t.includes('Custom Mode'));
  const opened = custom ? go('c1-custom', [{ row: [custom] }]) : false;
  if (!opened) emit({ step: 'c1-custom', boundary: 'Custom Mode row not found', texts: texts() });
  const c1 = opened ? rowNamed((t) => t === 'C1') : null;
  const entered = c1 ? go('c1-enter', [{ row: [c1] }]) : false;
  if (opened && !entered) emit({ step: 'c1-enter', boundary: 'C1 row not found', texts: texts() });
  const assign = entered ? rowNamed((t) => t === 'Assign') : null;
  const assigned = assign ? go('c1-assign', [{ row: [assign] }]) : false;
  if (entered && !assigned) emit({ step: 'c1-assign', boundary: 'Assign row not found', texts: texts() });
  const confirm = assigned ? rowNamed((t) => t === 'Set' || t === 'Yes') : null;
  if (confirm) go('c1-assign-confirm', [{ row: [confirm] }]);
  else if (assigned) snap('c1-assign-no-confirm', { texts: texts() });

  // Deliberate live change of the unnamed cells, after the assign.
  if (mode === 'mark' || mode === 'control') {
    const wrote = [];
    for (const i of UNNAMED) {
      const value = second(i);
      const ret = l.call(SET, { d0: KEY, d1: i, a0: 0, a1: value }, null, null, 2000000);
      wrote.push({ i, value, ret: ret.d0 >>> 0, back: readOne(i) });
    }
    emit({ step: 'live-change', note: 'probe-induced second pattern, not firmware', wrote });
    snap('live-change-readback');
  }

  // Recall C1. Leave the menu first so the walk starts from a known screen.
  if (s.screen() === 'menu' || s.screen() === 'direct') press('menu');
  idle(400);
  if (s.screen() === 'menu' || s.screen() === 'direct') press('menu');
  idle(400);
  snap('before-recall', { screen: s.screen(), texts: texts() });
  press('menu');
  idle(500);
  const custom2 = rowNamed((t) => t.includes('Custom Mode'));
  const opened2 = custom2 ? go('c1-recall-custom', [{ row: [custom2] }]) : false;
  const c1b = opened2 ? rowNamed((t) => t === 'C1') : null;
  const entered2 = c1b ? go('c1-recall-enter', [{ row: [c1b] }]) : false;
  const recall = entered2 ? rowNamed((t) => t === 'Recall') : null;
  const recalled = recall ? go('c1-recall', [{ row: [recall] }]) : false;
  if (entered2 && !recalled) emit({ step: 'c1-recall', boundary: 'Recall row not found', texts: texts() });
  const confirm2 = recalled ? rowNamed((t) => t === 'Yes' || t === 'Set') : null;
  if (confirm2) go('c1-recall-confirm', [{ row: [confirm2] }]);
  else if (recalled) snap('c1-recall-no-confirm', { texts: texts() });
  snap('after-recall', { texts: texts(), screen: s.screen() });

  // Cursor pages. These are not scalar settings. Walk the open menu for a row
  // whose text names the art filter, then record whatever the screen shows.
  const interesting = (t) => /toy|vintage|partial|cursor|color creator|picture mode|art filter/i.test(t);
  if (s.screen() !== 'menu') {
    press('menu');
    idle(400);
  }
  const seenPages = [];
  for (let tab = 0; tab < 10; tab++) {
    const names = texts();
    const hit = names.filter(interesting);
    seenPages.push({ tab, hit, sample: names.slice(0, 16), screen: s.screen() });
    if (hit.length) break;
    press('left');
  }
  emit({ step: 'cursor-menu-search', seenPages });
  snap('after-cursor-search');

  // Creative-dial art page, type 3 of the three filters, then a short key walk.
  const artNotes = [];
  try {
    pl.run_input({ type: 'switch', id: 'creative_dial', value: 3 });
    idle(700);
    artNotes.push({ at: 'art-page', texts: texts(), art: s.get(867) });
    for (const sid of [364, 367, 368]) {
      let keys = null;
      let error = null;
      try { keys = l.scalar_keys(sid, 'probe'); } catch (e) { error = String(e.message || e).slice(0, 200); }
      artNotes.push({ sid, keys, error, before: s.get(sid) });
      if (keys && keys.includes(3)) {
        s.set(sid, 3);
        idle(400);
        for (const key of ['right', 'down', 'ok', 'right']) press(key);
        artNotes.push({ sid, after: s.get(sid), texts: texts() });
        snap('art-type3-' + sid, { texts: texts() });
      }
    }
  } catch (e) {
    artNotes.push({ boundary: String(e.message || e).slice(0, 400) });
  }
  emit({ step: 'art-type3-pages', artNotes });
  snap('after-art-pages');

  // Stock mapped setter. One call per cursor id, then the whole array.
  for (const sid of CURSORS) {
    const before = readAll();
    let ret = null;
    let error = null;
    try {
      ret = l.call(MAPPED_SET, { d0: sid, d1: 0x2222 }, null, null, 2000000).d0 >>> 0;
    } catch (e) { error = String(e.message || e).slice(0, 400); }
    const after = readAll();
    const changed = after.flatMap((v, i) => (v === before[i] ? [] : [{ i, was: before[i], now: v }]));
    emit({ step: 'mapped-setter-' + sid, ret, error, changed, cells: after, note: 'direct call of FUN_6041937f, the UI mapped setter' });
  }
  snap('after-mapped-setters');

  if (s.screen() === 'menu' || s.screen() === 'direct') press('menu');
  idle(700);
  const saves = l.store_log?.nvram?.saves ?? [];
  let fileBytes = null;
  try { fileBytes = statSync(nvramFile).size; } catch (e) { fileBytes = String(e.message || e); }
  emit({ step: 'session-1-end', saves, fileBytes, screen: s.screen() });
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
      markerLost: mode === 'mark' ? UNNAMED.filter((i) => loaded[i] !== marker(i)) : [],
      loaded: l2.store_log?.nvram?.loaded ?? null });
    // Whole-key default, after the persistence read, so it does not hide it.
    for (const sid of CURSORS) {
      const before = read2();
      let ret = null;
      let error = null;
      try {
        ret = l2.call(WHOLE_KEY, { d0: sid }, null, null, 2000000).d0 >>> 0;
      } catch (e) { error = String(e.message || e).slice(0, 400); }
      const after = read2();
      const changed = after.flatMap((v, i) => (v === before[i] ? [] : [{ i, was: before[i], now: v }]));
      emit({ step: 'whole-key-default-' + sid, ret, error, changed, cells: after,
        note: 'direct call of FUN_604193ca; not a menu press' });
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
