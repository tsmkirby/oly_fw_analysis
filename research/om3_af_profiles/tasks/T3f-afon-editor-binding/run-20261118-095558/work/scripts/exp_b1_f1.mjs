// B1. One change against the X1 baseline.
// The change is an editor binding of 0x3D6F's own: the key-8 table is copied
// into the section-1 FF tail, one record is appended (2154's record with a free
// editor id and UI id 0x3D6F), and the third action record's second word selects
// that id. The directory pointer and count are runtime writes. The row keeps
// the two-record list 0x6158ba04.
// Usage: node26 work/scripts/exp_b1_f1.mjs om-emu work/out/exp-b1-f1.jsonl
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
const BIND_SRC = 0x615c540c;
const BIND_COUNT = 416;
const BIND_RAM = 0x60320000;
const DIR = 0x615cc934;
const REC_2154 = 0x615c5e14;
const lines = [];
const emit = (role, x) => {
  const row = { hook: role === 'behaviour' ? 'EMULATOR-ONLY' : 'observe', role, ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const native = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
const hex = (v) => (v === null || v === undefined) ? null : '0x' + (v >>> 0).toString(16);

const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const bindSrc = image.subarray(BIND_SRC - BASE, BIND_SRC - BASE + BIND_COUNT * 24);
const used = new Set();
for (let i = 0; i < BIND_COUNT; i++) used.add(bindSrc.readUInt32LE(i * 24));
let newId = null;
for (const cand of [0x1e6, 0x1e7, 0x0e3d, 0x3d6f]) if (!used.has(cand)) { newId = cand; break; }
if (newId === null) throw new Error('no free editor id');
const extra = Buffer.from(image.subarray(REC_2154 - BASE, REC_2154 - BASE + 24));
const stockBinding = extra.toString('hex');
extra.writeUInt32LE(newId, 0);
extra.writeUInt32LE(UI, 8);
const bindBytes = Buffer.concat([bindSrc, extra]);
assert.equal(bindBytes.length, (BIND_COUNT + 1) * 24);

const csvPath = resolve('ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv');
const byOff = new Map();
for (const row of readFileSync(csvPath, 'utf8').trim().split(/\r?\n/).slice(1)) {
  const [o, , old, next] = row.split(',');
  byOff.set(parseInt(o, 16), { old: parseInt(old, 16), neu: parseInt(next, 16) });
}
const stockRow = image.subarray(STOCK_ROW - BASE, STOCK_ROW - BASE + 36);
for (let i = 0; i < 36; i++) {
  const off = (ROW - BASE) + i;
  byOff.set(off, { old: image[off], neu: i < 4 ? [0x6f, 0x3d, 0x00, 0x00][i] : stockRow[i] });
}
const stockTable = image.subarray(STOCK_TABLE - BASE, STOCK_TABLE - BASE + 48);
const third = Buffer.from(stockTable.subarray(0, 24));
third[4] = 0x6f; third[5] = 0x3d;
third.writeUInt32LE(newId, 16);
const tableBytes = Buffer.concat([stockTable, third]);
for (let i = 0; i < 72; i++) {
  const off = (TABLE_RAM - BASE) + i;
  if (image[off] !== 0xff) throw new Error('action slot is not FF at ' + hex(BASE + off));
  byOff.set(off, { old: 0xff, neu: tableBytes[i] });
}
for (let i = 0; i < bindBytes.length; i++) {
  const off = (BIND_RAM - BASE) + i;
  if (image[off] !== 0xff) throw new Error('binding slot is not FF at ' + hex(BASE + off));
  byOff.set(off, { old: 0xff, neu: bindBytes[i] });
}
const ordered = [...byOff.entries()].sort((a, b) => a[0] - b[0]);
const patches = [];
const csvRows = ['component_offset,runtime_address,stock_byte,proposed_byte,purpose'];
for (const [off, { old, neu }] of ordered) {
  if (image[off] !== old) throw new Error('overlay old mismatch at ' + hex(BASE + off));
  const last = patches.at(-1);
  if (last && off === last.offset + last.old.length) { last.old.push(old); last.neu.push(neu); }
  else patches.push({ offset: off, old: [old], neu: [neu] });
  const addr = BASE + off;
  let purpose = 'E1 section-1 tail';
  if (addr >= BIND_RAM && addr < BIND_RAM + BIND_COUNT * 24) purpose = 'relocated key-8 editor binding, stock records';
  else if (addr >= BIND_RAM + BIND_COUNT * 24 && addr < BIND_RAM + bindBytes.length) purpose = 'new editor binding, UI id 0x3D6F';
  else if (addr >= TABLE_RAM && addr < TABLE_RAM + 72) purpose = 'page-27 action table, third record second word is the new editor id';
  else if (addr >= ROW && addr < ROW + 36) purpose = 'E1 third row, options 0x6158ba04';
  csvRows.push([off.toString(16).padStart(8, '0'), addr.toString(16), old.toString(16).padStart(2, '0'), neu.toString(16).padStart(2, '0'), purpose].join(','));
}
writeFileSync(resolve('work/out/overlay-b1-f1.csv'), csvRows.join('\n') + '\n');
const fw = patchedFirmware(patches.map((x, n) => ({
  block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: 'work/scripts/exp_b1_f1.mjs', n,
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
  ['0x99d2', 0x99d2, 3], ['0x9fa1', 0x9fa1, 3], ['0xdfa1', 0xdfa1, 1], ['0x1ea1', 0x1ea1, 1],
  ['0x9ec1', 0x9ec1, 1], ['0x9ed1', 0x9ed1, 1], ['0x9ee1', 0x9ee1, 1], ['0x9ef1', 0x9ef1, 1], ['0x59b1', 0x59b1, 1],
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
  const word = (addr) => { try { return l.sim.u32(addr) >>> 0; } catch { return null; } };
  const half = (addr) => { try { const b = l.sim.read(addr, 2); return b[0] | (b[1] << 8); } catch { return null; } };
  const gate = { reading: false };
  const state = { phase: 'off', group: 'boot' };
  const live = () => !gate.reading && state.phase === 'on';
  const bucket = { compares: [], setters: [], store63431: [], store63380: [], conversion: [], copies: [], chooser: 0 };
  const totals = { compares: 0, setters: 0, store63431: 0, store63380: 0, conversion: 0, copies: 0, chooser: 0 };
  const dropped = { compares: 0, setters: 0, store63431: 0, store63380: 0, conversion: 0, copies: 0, chooser: 0 };
  const CAP = 100000;
  const pushCap = (key, rec) => {
    totals[key] += 1;
    if (bucket[key].length >= CAP) { dropped[key] += 1; return; }
    bucket[key].push(rec);
  };
  emit('behaviour', {
    step: 'explanation',
    explanation: 'X1 opens 2154\'s chooser because the third action record\'s second word is 0x1e3, and FUN_6124f4e5 finds the key-8 record whose first word is 0x1e3 and whose word at +8 is UI 2154. The one change gives 0x3D6F a binding of its own: the 416 stock records are copied into section-1 FF bytes, a 417th record copies the 0x1e3 record with the editor id and the UI id changed, and the third action record\'s second word selects that new id. The directory pointer and count are then aimed at the copy. The row\'s options stay at 0x6158ba04. T3a\'s value hooks stay installed.',
    change: 'relocated key-8 table at 0x60320000 with one new record, directory writes at 0x615cc938 and 0x615cc93c, third action second word',
    baseline: 'X1: T3c E1 row, T3a tail, four section-7 row/source redirects, 3-record action table, T3a value hooks, options 0x6158ba04',
    newEditorId: hex(newId),
    stockBindingRecord: stockBinding,
    newBindingRecord: extra.toString('hex'),
    thirdRecord: tableBytes.subarray(48, 72).toString('hex'),
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
    writeByte(PROFILE, r.d1 & 0xff);
    writeByte(PROFILE_CACHED, r.d1 & 0xff);
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
  l.observe(native(0x6124f523), (lab, r) => {
    if (!live()) return;
    const d0 = r.d0 >>> 0;
    const d1 = r.d1 & 0xffff;
    const a2 = r.a2 >>> 0;
    const rec = { d0, d1, a2: hex(a2), match: d0 === d1 };
    if (rec.match) {
      rec.bytes = bytes(a2, 24);
      rec.ui = word(a2 + 8);
    }
    pushCap('conversion', rec);
  }, 'obs-convert');
  l.observe(native(0x6124f54e), (lab, r) => {
    if (!live()) return;
    pushCap('copies', { value: r.d0 >>> 0, src: hex((r.a3 - 4) >>> 0) });
  }, 'obs-copy');
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
    try { return l.call(native(0x60063380), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff; }
    finally { gate.reading = false; l.sim.reset(saved); }
  };
  const mapOf = (id) => {
    const saved = l.sim.registers();
    gate.reading = true;
    try {
      const key = l.call(native(0x60419446), { d0: id }, null, null, 200000).d0 & 0xffff;
      const index = l.call(native(0x60419696), { d0: id }, null, null, 200000).d0 & 0xffff;
      return { id, key, index };
    } finally { gate.reading = false; l.sim.reset(saved); }
  };
  const cells = () => {
    const home = {};
    for (const [name, key, n] of HOME_KEYS) home[name] = Array.from({ length: n }, (_, i) => readKey(key, i));
    const originally = ORIGINALLY.map((id) => {
      const slot = mapOf(id);
      return { ...slot, backing: slot.key === 0 ? 'no map key; typed accessor 0x60063a20 is not called' : 'mapped' };
    });
    return {
      profile: readByte(PROFILE), profileCached: readByte(PROFILE_CACHED),
      k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
      k1dd1: Array.from({ length: 10 }, (_, i) => readKey(0x1dd1, i)),
      k99a1: Array.from({ length: 8 }, (_, i) => readKey(0x99a1, i)),
      k9a41: readKey(0x9a41, 0),
      k5962: Array.from({ length: 6 }, (_, i) => readKey(0x5962, i)),
      home, originally,
    };
  };
  const take = (group) => {
    const snap = {
      compares: bucket.compares, setters: bucket.setters, store63431: bucket.store63431, store63380: bucket.store63380,
      conversion: bucket.conversion, copies: bucket.copies, chooser: bucket.chooser,
    };
    for (const k of Object.keys(bucket)) bucket[k] = Array.isArray(bucket[k]) ? [] : 0;
    const matches = snap.conversion.filter((r) => r.match);
    return {
      group,
      truncation: { cap: CAP, dropped: { ...dropped } },
      totals: { ...totals },
      matches,
      conversionCount: snap.conversion.length,
      ...snap,
    };
  };
  const beforeDir = bytes(DIR, 12);
  const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  writeU32(TABLE_PTR, TABLE_RAM);
  writeU32(TABLE_PTR + 4, 3);
  writeU32(DIR + 4, BIND_RAM);
  writeU16(DIR + 8, BIND_COUNT + 1);
  emit('behaviour', {
    step: 'redirects',
    label: 'EMULATOR-ONLY section-7 pointer writes',
    actionTable: { at: hex(TABLE_PTR), after: bytes(TABLE_PTR, 8) },
    directory: { at: hex(DIR), before: beforeDir, after: bytes(DIR, 12), pointer: hex(BIND_RAM), count: BIND_COUNT + 1 },
  });
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const shot = (name) => {
    const frame = walk.read().frame;
    const file = resolve('work/out/exp-b1-f1-' + name + '.png');
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
          if (listed && listed.cursor != null && listed.rows[listed.cursor]) { highlight = listed.rows[listed.cursor].text; break; }
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
  const stockHeld = confirmed.readback.k90a1[0] === row2154.cancel.readback.k90a1[0]
    && confirmed.readback.k90a1[1] === row2154.cancel.readback.k90a1[1]
    && confirmed.readback.k90a1[0] === row2155.cancel.readback.k90a1[0]
    && confirmed.readback.k90a1[1] === row2155.cancel.readback.k90a1[1];
  const confirmSetters = confirmed ? null : null;
  emit('observe', {
    step: 'done',
    chooserOpen, profileChanged, cancelHeld, stockHeld, focus,
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
  state.phase = 'on';
  state.group = 'caf-1e0';
  const saved = l.sim.registers();
  let cafError = null;
  try { l.call(native(0x6124f4e5), { d0: 8, d1: 0x1e0 }, null, null, 2000000); }
  catch (e) { cafError = String(e && e.message ? e.message : e); }
  finally { l.sim.reset(saved); }
  emit('observe', {
    step: 'caf-1e0',
    note: 'Direct call of FUN_6124f4e5 with D0=8 and D1=0x1e0, the C-AF Area second word. Registers were restored afterwards. This is the conversion instruction for that id; the C-AF row was not opened from a menu page.',
    error: cafError,
    ...take('caf-1e0'),
  });
  state.phase = 'off';
  void confirmSetters;
} catch (e) {
  emit('observe', { step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(outPath, lines.join('\n') + (lines.length ? '\n' : ''));
}
