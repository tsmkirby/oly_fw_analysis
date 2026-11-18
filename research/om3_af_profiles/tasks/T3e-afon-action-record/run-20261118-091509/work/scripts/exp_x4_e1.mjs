// X4. One change against the X1 baseline.
// X1 opened the chooser for 0x3D6F and matched the third record, but confirm
// called 0x6041937f with UI id 2154. That record's second word was still
// 0x1e3, owned in the stock table only by 2154. This run changes that word
// to 0x0e3d. The row, options, redirects, and value hooks stay as in X1.
// Usage: node26 work/scripts/exp_x4_e1.mjs om-emu work/out/exp-x4-e1.jsonl
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, outPath] = process.argv.slice(2);
assert(checkout && outPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadNand, patchedFirmware, createHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { UIIN_ENTRIES, apply_uiin_layout, uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');

const UI = 0x3d6f;
const BASE = 0x60021020;
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const PAGE27 = 0x6158f0f8;
const SOURCE = 0x61529ce8;
const TABLE_PTR = 0x6150f5f0;
const TABLE_RAM = 0x6031ea00;
const ROW = 0x6031e978;
const STOCK_ROW = 0x6158dc44;
const STOCK_TABLE = 0x6150c514;
const lines = [];
const emit = (role, x) => {
  const row = { hook: role === 'behaviour' ? 'EMULATOR-ONLY' : 'observe', role, ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => (v === null || v === undefined) ? null : '0x' + (v >>> 0).toString(16);

const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const csvPath = resolve('ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv');
const byOff = new Map();
for (const row of readFileSync(csvPath, 'utf8').trim().split(/\r?\n/).slice(1)) {
  const [o, , old, next] = row.split(',');
  const off = parseInt(o, 16);
  byOff.set(off, { old: parseInt(old, 16), neu: parseInt(next, 16) });
}
const stockRow = image.subarray(STOCK_ROW - BASE, STOCK_ROW - BASE + 36);
for (let i = 0; i < 36; i++) {
  const off = (ROW - BASE) + i;
  const neu = i < 4 ? [0x6f, 0x3d, 0x00, 0x00][i] : stockRow[i];
  byOff.set(off, { old: image[off], neu });
}
const stockTable = image.subarray(STOCK_TABLE - BASE, STOCK_TABLE - BASE + 48);
const table = Buffer.from(stockTable);
table[48] = 0x01; table[49] = 0x00; table[50] = 0x00; table[51] = 0x00;
const third = Buffer.from(stockTable.subarray(0, 24));
third[4] = 0x6f; third[5] = 0x3d;
third[16] = 0x3d; third[17] = 0x0e; third[18] = 0x00; third[19] = 0x00;
const tableBytes = Buffer.concat([table.subarray(0, 48), third]);
assert.equal(tableBytes.length, 72);
for (let i = 0; i < 72; i++) {
  const off = (TABLE_RAM - BASE) + i;
  if (image[off] !== 0xff) throw new Error('table slot is not FF at ' + hex(BASE + off));
  byOff.set(off, { old: 0xff, neu: tableBytes[i] });
}
const ordered = [...byOff.entries()].sort((a, b) => a[0] - b[0]);
const patches = [];
const csvRows = ['component_offset,runtime_address,stock_byte,proposed_byte,purpose'];
for (const [off, { old, neu }] of ordered) {
  if (image[off] !== old) throw new Error('overlay old mismatch at ' + hex(BASE + off));
  const last = patches.at(-1);
  if (last && off === last.offset + last.old.length) { last.old.push(old); last.neu.push(neu); }
  else patches.push({ offset: off, old: [old], neu: [neu] });
  let purpose = 'E1 section-1 tail';
  if (off >= TABLE_RAM - BASE && off < TABLE_RAM - BASE + 72) purpose = 'page-27 action table copy, third record UI id 0x3D6F, second word 0x0e3d';
  else if (off >= ROW - BASE && off < ROW - BASE + 36) purpose = 'E1 third row, stock 2154 with id 0x3D6F, options 0x6158ba04';
  csvRows.push([off.toString(16).padStart(8, '0'), (BASE + off).toString(16), old.toString(16).padStart(2, '0'), neu.toString(16).padStart(2, '0'), purpose].join(','));
}
writeFileSync(resolve('work/out/overlay-x4-e1.csv'), csvRows.join('\n') + '\n');
const changed = ordered.filter(([, v]) => v.old !== v.neu);
const fw = patchedFirmware(patches.map((x, n) => ({
  block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: 'work/scripts/exp_x4_e1.mjs', n,
})));
const layout = uiin_layout(fw.rom);
const keyEntry = (code) => {
  const entries = layout.groups.flatMap(({ entries }, group) => entries.filter(([, , candidate]) => candidate === code).map((entry) => [group, ...entry]));
  assert.equal(entries.length, 1);
  return entries[0];
};
apply_uiin_layout(fw.rom);
const parked = keyEntry(0x120b);
UIIN_ENTRIES.set(parked.slice(0, 3).join(','), parked);
const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} } }, patch: fw.summary, patchRanges: fw.changed, loaded: 'on' },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

const HOME_KEYS = [
  ['0x99d2', 0x99d2, 3],
  ['0x9fa1', 0x9fa1, 3],
  ['0xdfa1', 0xdfa1, 1],
  ['0x1ea1', 0x1ea1, 1],
  ['0x9ec1', 0x9ec1, 1],
  ['0x9ed1', 0x9ed1, 1],
  ['0x9ee1', 0x9ee1, 1],
  ['0x9ef1', 0x9ef1, 1],
  ['0x59b1', 0x59b1, 1],
];
const ORIGINALLY = [2274, 2275, 2276, 2277, 2278, 2279];

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const bytes = (addr, n) => Buffer.from(l.sim.read(addr, n)).toString('hex');
  const readByte = (addr) => l.sim.read(addr, 1)[0];
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const writeU32 = (addr, value) => { const b = Buffer.alloc(4); b.writeUInt32LE(value >>> 0, 0); l.sim.write(addr, b); };
  const writeU16 = (addr, value) => { const b = Buffer.alloc(2); b.writeUInt16LE(value & 0xffff, 0); l.sim.write(addr, b); };
  const word = (addr) => {
    try { return l.sim.u32(addr) >>> 0; } catch { return null; }
  };
  const half = (addr) => {
    try { const b = l.sim.read(addr, 2); return b[0] | (b[1] << 8); } catch { return null; }
  };
  const gate = { reading: false };
  const live = () => !gate.reading && state.phase === 'on';
  const state = { phase: 'off', group: 'boot' };
  const bucket = { compares: [], setters: [], store63431: [], store63380: [], chooser: 0, table: [] };
  const totals = { compares: 0, setters: 0, store63431: 0, store63380: 0, chooser: 0, table: 0 };
  const dropped = { compares: 0, setters: 0, store63431: 0, store63380: 0, chooser: 0, table: 0 };
  const CAP = 100000;
  const pushCap = (key, rec) => {
    totals[key] += 1;
    if (bucket[key].length >= CAP) { dropped[key] += 1; return; }
    bucket[key].push(rec);
  };
  emit('behaviour', {
    step: 'explanation',
    explanation: 'X1 matched the third record (D0 and D1 both 0x3D6F at A2 0x6031ea30) and opened the two-option chooser, but confirm called 0x6041937f with UI id 2154 and value 1, and the RAM byte stayed 0. The third record still carried second word 0x1e3, and the only stock record with that word is 2154 at 0x6150c514. The live table\'s first record has the same word, so a lookup by it finds 2154 before 0x3D6F. The one change against X1 is that second word, from 0x1e3 to 0x0e3d. No aligned action record in 0x6150b000..0x61511000 uses 0x0e3d. The row, the option list, the section-7 redirects, and the value hooks stay as in X1.',
    change: 'third record second word 0x1e3 -> 0x0e3d',
    baseline: 'X1: 72-byte table at 0x6031ea00, third record second word 0x1e3, row options 0x6158ba04 count 2, section-7 redirects, T3a value hooks',
    options: '0x6158ba04 count 2',
    thirdRecord: tableBytes.subarray(48, 72).toString('hex'),
  });
  emit('behaviour', {
    step: 'overlay',
    label: 'EMULATOR-ONLY in-memory overlay',
    changed: changed.length,
    table: hex(TABLE_RAM),
    tableBytes: tableBytes.toString('hex'),
    row: Buffer.from(ordered.filter(([off]) => off >= ROW - BASE && off < ROW - BASE + 36).map(([, v]) => v.neu)).toString('hex'),
  });
  const own = (r) => (r.d0 & 0xffff) === UI;
  l.hook(native(0x6041931e), (h, r) => {
    if (!own(r)) { l.passthrough(r); return; }
    h.finish(r, { d0: readByte(PROFILE) });
  }, 'EMULATOR-ONLY afon value getter');
  l.hook(native(0x6041937f), (h, r) => {
    const rec = { id: r.d0 & 0xffff, value: r.d1 & 0xffff, d0: r.d0 >>> 0, d1: r.d1 >>> 0, caller: hex(r.mdr >>> 0) };
    if (live()) pushCap('setters', rec);
    if (!own(r)) { l.passthrough(r); return; }
    const value = r.d1 & 0xff;
    writeByte(PROFILE, value);
    writeByte(PROFILE_CACHED, value);
    h.finish(r, { d0: 0 });
  }, 'EMULATOR-ONLY afon setter');
  l.hook(native(0x60419446), (h, r) => {
    if (!own(r)) { l.passthrough(r); return; }
    h.finish(r, { d0: 0xA70F });
  }, 'EMULATOR-ONLY afon mapped getter');
  l.hook(native(0x60419696), (h, r) => {
    if (!own(r)) { l.passthrough(r); return; }
    h.finish(r, { d0: 0 });
  }, 'EMULATOR-ONLY afon index getter');
  emit('behaviour', {
    step: 'value-hooks',
    label: 'EMULATOR-ONLY T3a value hooks for 0x3D6F',
    getter: '0x6041931e returns the byte at 0xa031e920',
    setter: '0x6041937f writes D1\'s low byte to 0xa031e920 and 0x6031e920 and returns 0',
    mapped: '0x60419446 returns 0xA70F',
    index: '0x60419696 returns 0',
    otherIds: 'passthrough',
  });
  l.observe(native(0x611a26e1), (lab, r) => {
    if (!live()) return;
    const rec = r.a2 >>> 0;
    pushCap('compares', { d0: r.d0 & 0xffff, d1: r.d1 & 0xffff, a2: hex(rec), bytes: bytes(rec, 24) });
  }, 'obs-compare');
  l.observe(native(0x611a12a5), (lab, r) => {
    if (!live()) return;
    pushCap('table', { table: hex(r.a1 >>> 0), count: r.d0 & 0xffff, obj: hex(r.a0 >>> 0) });
  }, 'obs-table-call');
  l.observe(native(0x60063431), (lab, r) => {
    if (!live()) return;
    pushCap('store63431', { d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0, a0: hex(r.a0 >>> 0), a1: hex(r.a1 >>> 0), caller: hex(r.mdr >>> 0) });
  }, 'obs-store-63431');
  l.observe(native(0x60063380), (lab, r) => {
    if (!live()) return;
    pushCap('store63380', { d0: r.d0 >>> 0, d1: r.d1 >>> 0, caller: hex(r.mdr >>> 0) });
  }, 'obs-store-63380');
  l.observe(native(0x610e2536), () => {
    if (!live()) return;
    totals.chooser += 1;
    bucket.chooser += 1;
  }, 'obs-chooser');
  const readKey = (key, index) => {
    const saved = l.sim.registers();
    gate.reading = true;
    try {
      return l.call(native(0x60063380), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
    } finally {
      gate.reading = false;
      l.sim.reset(saved);
    }
  };
  const mapOf = (id) => {
    const saved = l.sim.registers();
    gate.reading = true;
    try {
      const key = l.call(native(0x60419446), { d0: id }, null, null, 200000).d0 & 0xffff;
      const index = l.call(native(0x60419696), { d0: id }, null, null, 200000).d0 & 0xffff;
      return { id, key, index };
    } finally {
      gate.reading = false;
      l.sim.reset(saved);
    }
  };
  const cells = () => {
    const home = {};
    for (const [name, key, n] of HOME_KEYS) home[name] = Array.from({ length: n }, (_, i) => readKey(key, i));
    const originally = ORIGINALLY.map((id) => {
      const slot = mapOf(id);
      return { ...slot, backing: slot.key === 0 ? 'no map key; typed accessor 0x60063a20 is not called' : 'mapped' };
    });
    return {
      profile: readByte(PROFILE),
      profileCached: readByte(PROFILE_CACHED),
      k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
      k1dd1: Array.from({ length: 10 }, (_, i) => readKey(0x1dd1, i)),
      k99a1: Array.from({ length: 8 }, (_, i) => readKey(0x99a1, i)),
      k9a41: readKey(0x9a41, 0),
      k5962: Array.from({ length: 6 }, (_, i) => readKey(0x5962, i)),
      home,
      originally,
    };
  };
  const take = (group) => {
    const snap = {
      compares: bucket.compares, setters: bucket.setters, store63431: bucket.store63431, store63380: bucket.store63380,
      chooser: bucket.chooser, table: bucket.table,
    };
    for (const k of Object.keys(bucket)) bucket[k] = Array.isArray(bucket[k]) ? [] : 0;
    return {
      group, truncation: { ...dropped }, totals: { ...totals },
      uncapped: Object.values(dropped).every((n) => n === 0),
      ...snap,
    };
  };
  const beforePage = bytes(PAGE27 + 4, 8);
  const beforeSrc = bytes(SOURCE + 4, 8);
  const beforeTable = bytes(TABLE_PTR, 8);
  const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  writeU32(TABLE_PTR, TABLE_RAM);
  writeU32(TABLE_PTR + 4, 3);
  emit('behaviour', {
    step: 'redirects',
    label: 'EMULATOR-ONLY section-7 pointer writes',
    page27: { at: hex(PAGE27 + 4), before: beforePage, after: bytes(PAGE27 + 4, 8) },
    source: { at: hex(SOURCE + 4), before: beforeSrc, after: bytes(SOURCE + 4, 8) },
    actionTable: { at: hex(TABLE_PTR), before: beforeTable, after: bytes(TABLE_PTR, 8), count: 3 },
  });
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const shot = (name) => {
    const frame = walk.read().frame;
    const file = resolve('work/out/exp-x4-e1-' + name + '.png');
    write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
    return file;
  };
  const screen = () => {
    try {
      const scr = walk.read();
      const texts = scr.texts.map((t) => t.text);
      let highlight = null;
      for (const t of scr.texts) {
        try {
          const listed = walk.list(scr, t);
          if (listed && listed.cursor != null && listed.rows[listed.cursor]) {
            highlight = listed.rows[listed.cursor].text;
            break;
          }
        } catch { /* not a list */ }
      }
      return { texts, highlight };
    } catch (e) {
      return { texts: [], highlight: null, error: String(e && e.message ? e.message : e) };
    }
  };
  const focusedValue = (texts) => {
    const blob = texts.join('\n');
    if (blob.includes('When a specified subject is detected')) return 1;
    if (blob.includes('AF is always performed')) return 0;
    return null;
  };
  const snap = (group, fileTag) => {
    const view = screen();
    let file = null;
    try { file = shot(fileTag); } catch (e) { file = 'shot-error ' + String(e && e.message ? e.message : e); }
    const readback = cells();
    emit('observe', { step: group, file, highlight: view.highlight, texts: view.texts, cells: readback, ...take(group) });
    return { view, readback };
  };
  idle(1200);
  press('menu');
  const seen = new Set();
  let menuRow = null;
  for (let n = 0; n < 24 && !menuRow; n++) {
    menuRow = screen().texts.find((t) => t.endsWith('AF Button'));
    if (menuRow) break;
    const sig = screen().texts.join('\n');
    if (seen.has(sig)) break;
    seen.add(sig);
    press('left');
  }
  assert.ok(menuRow, 'AF Button missing');
  walk.to([{ row: [menuRow] }]);
  idle(200);
  const known = 0x6247a270;
  let liveTable = word(known + 0x78);
  let liveCount = half(known + 0x7c);
  let liveObj = known;
  if (liveTable !== TABLE_RAM && liveTable !== STOCK_TABLE) {
    liveObj = null;
    for (let a = 0x62470000; a < 0x62480000; a += 4) {
      if (word(a) === STOCK_TABLE && half(a + 4) === 2 && word(a - 0x78) === 0x6151346c) { liveObj = (a - 0x78) >>> 0; break; }
    }
    if (liveObj !== null) {
      liveTable = word(liveObj + 0x78);
      liveCount = half(liveObj + 0x7c);
    }
  }
  if (liveObj !== null && liveTable === STOCK_TABLE) {
    const before = bytes(liveObj + 0x78, 8);
    writeU32(liveObj + 0x78, TABLE_RAM);
    writeU16(liveObj + 0x7c, 3);
    emit('behaviour', {
      step: 'live-table',
      label: 'EMULATOR-ONLY write of the already-copied action-table pointer',
      obj: hex(liveObj),
      before,
      after: bytes(liveObj + 0x78, 8),
      note: 'The section-7 word was written before the page opened. The live object still held the stock pointer, so the same pointer and count were written at object+0x78.',
    });
  } else {
    emit('observe', {
      step: 'live-table',
      obj: liveObj === null ? null : hex(liveObj),
      table: hex(liveTable),
      count: liveCount,
      note: 'No stock pointer remained in the checked object. The section-7 write is the redirect.',
    });
  }
  const openCancel = (tag) => {
    snap(tag + '-before', tag + '-before');
    state.phase = 'on';
    state.group = tag;
    press('ok');
    const after = snap(tag + '-after', tag + '-after');
    press('menu');
    const cancel = snap(tag + '-cancel', tag + '-cancel');
    return { after, cancel };
  };
  const row2154 = openCancel('2154');
  press('down');
  emit('observe', { step: 'down-to-2155', ...take('down-to-2155') });
  const row2155 = openCancel('2155');
  press('down');
  emit('observe', { step: 'down-to-3d6f', ...take('down-to-3d6f') });
  snap('3d6f-before', '3d6f-before');
  state.group = '3d6f';
  const chooserMark = totals.chooser;
  press('ok');
  const opened = snap('3d6f-after', '3d6f-after');
  const openedBlob = opened.view.texts.join('\n');
  const chooserOpen = totals.chooser > chooserMark
    || openedBlob.includes('When a specified subject is detected')
    || openedBlob.includes('AF is always performed');
  press('menu');
  const cancelled = snap('3d6f-cancel', '3d6f-cancel');
  press('ok');
  const reopened = snap('3d6f-reopen', '3d6f-reopen');
  let focus = focusedValue(reopened.view.texts);
  const moves = [];
  for (const k of ['down', 'right', 'up']) {
    if (focus === 1) break;
    press(k);
    const view = screen();
    focus = focusedValue(view.texts);
    moves.push({ key: k, focus, highlight: view.highlight });
  }
  emit('observe', { step: '3d6f-move', focus, moves, texts: screen().texts });
  let chosenFile = null;
  try { chosenFile = shot('3d6f-chosen'); } catch (e) { chosenFile = 'shot-error ' + String(e && e.message ? e.message : e); }
  emit('observe', { step: '3d6f-chosen', file: chosenFile, focus, texts: screen().texts, ...take('3d6f-chosen') });
  press('ok');
  const confirmed = snap('3d6f-confirm', '3d6f-confirm');
  state.phase = 'off';
  const profileChanged = confirmed.readback.profile !== 0;
  const cancelHeld = cancelled.readback.profile === 0;
  const stockHeld = confirmed.readback.k90a1[0] === 1 && confirmed.readback.k90a1[1] === 1
    && row2154.cancel.readback.k90a1[0] === 1 && row2154.cancel.readback.k90a1[1] === 1;
  const setterIds = confirmed.readback ? null : null;
  emit('observe', {
    step: 'done',
    chooserOpen,
    profileChanged,
    cancelHeld,
    stockHeld,
    confirmProfile: confirmed.readback.profile,
    cancelProfile: cancelled.readback.profile,
    confirm90a1: confirmed.readback.k90a1,
    questions: {
      okOpensChooser: chooserOpen,
      confirmCallsSetterFor3d6f: 'see 3d6f-confirm setters',
      ramByteChanges: profileChanged,
      cancelLeavesRam: cancelHeld,
      stock90a1Untouched: stockHeld,
    },
  });
} catch (e) {
  emit('observe', { step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(outPath, lines.join('\n') + (lines.length ? '\n' : ''));
}
