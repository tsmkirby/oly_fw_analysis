// Acceptance for the Z1 configuration, which is the run that stored a zone value.
// Two fresh candidate sessions and one stock control. The shared key sequence is
// the stock rows and pages 25, 26 and 27. The candidate then cancels once and
// commits two zone values. A native save writes each session's own store file.
// Usage: node26 work/scripts/accept_g1.mjs om-emu work/out/accept-g1.jsonl
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, outPath] = process.argv.slice(2);
assert(checkout && outPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadNand, patchedFirmware, loadBlock, createHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { UIIN_ENTRIES, apply_uiin_layout, uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');
const { layout, record, StringTable } = await use('src/lab/resources.mjs');
const { fileNvram } = await use('host/nvram.mjs');
const { base64Bytes } = await use('src/util/bytes.mjs');

const UI = 0x3d6f;
const BASE = 0x60021020;
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const lines = [];
const emit = (role, x) => {
  const row = { hook: role === 'behaviour' ? 'EMULATOR-ONLY' : 'observe', role, ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const native = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
const hex = (v) => '0x' + (v >>> 0).toString(16);
let failed = null;

const block = loadBlock();
const lay = layout(block);
const stockText = (id) => {
  for (let e = lay.strings[0]; e <= lay.strings[1]; e++) {
    const table = new StringTable(e, record(e, block));
    if (table.lang !== 'en') continue;
    try { return table.text(id); } catch { return null; }
  }
  return null;
};
const titles = { 27: stockText(0x1279), 26: stockText(0x0b90), 25: stockText(0x11c4) };
emit('observe', { step: 'page-titles', titles, note: 'English GUI resource strings for the page-title ids named in AFON-MENU-RESEARCH. The file is the emulator .0101 block loadBlock reads.' });

function buildFirmware(zone) {
  const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
  if (!zone) {
    return patchedFirmware([]);
  }
  const BIND_SRC = 0x615c540c, BIND_COUNT = 416, DESC = 0x6031e9a0, ROW = 0x6031e978, TABLE_RAM = 0x6031ea00;
  const byOff = new Map();
  const csvPath = resolve('ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv');
  for (const row of readFileSync(csvPath, 'utf8').trim().split(/\r?\n/).slice(1)) {
    const [o, , old, next] = row.split(',');
    byOff.set(parseInt(o, 16), { old: parseInt(old, 16), neu: parseInt(next, 16) });
  }
  const desc = Buffer.from(image.subarray(0x606200e4 - BASE, 0x606200e4 - BASE + 20));
  desc.writeUInt16LE(UI, 0);
  for (let i = 0; i < 20; i++) byOff.set((DESC - BASE) + i, { old: image[(DESC - BASE) + i], neu: desc[i] });
  const stockRow = image.subarray(0x6158dc44 - BASE, 0x6158dc44 - BASE + 36);
  for (let i = 0; i < 36; i++) byOff.set((ROW - BASE) + i, { old: image[(ROW - BASE) + i], neu: i < 4 ? [0x6f, 0x3d, 0x00, 0x00][i] : stockRow[i] });
  const zoneOpt = Buffer.alloc(8);
  zoneOpt.writeUInt32LE(0x6158ba1c, 0);
  zoneOpt.writeUInt32LE(10, 4);
  for (let i = 0; i < 8; i++) byOff.set((ROW - BASE) + 12 + i, { old: image[(ROW - BASE) + 12 + i], neu: zoneOpt[i] });
  const bindSrc = image.subarray(BIND_SRC - BASE, BIND_SRC - BASE + BIND_COUNT * 24);
  const used = new Set();
  for (let i = 0; i < BIND_COUNT; i++) used.add(bindSrc.readUInt32LE(i * 24));
  const newId = [0x1e6, 0x1e7, 0x0e3d, 0x3d6f].find((c) => !used.has(c));
  const stockTable = image.subarray(0x6150c514 - BASE, 0x6150c514 - BASE + 48);
  const third = Buffer.from(stockTable.subarray(0, 24));
  third[4] = 0x6f; third[5] = 0x3d;
  third.writeUInt32LE(newId, 16);
  const tableBytes = Buffer.concat([stockTable, third]);
  for (let i = 0; i < 72; i++) {
    if (image[(TABLE_RAM - BASE) + i] !== 0xff) throw new Error('action slot is not FF');
    byOff.set((TABLE_RAM - BASE) + i, { old: 0xff, neu: tableBytes[i] });
  }
  const ordered = [...byOff.entries()].sort((a, b) => a[0] - b[0]);
  const patches = [];
  for (const [off, { old, neu }] of ordered) {
    if (image[off] !== old) throw new Error('overlay old mismatch at ' + hex(BASE + off));
    const last = patches.at(-1);
    if (last && off === last.offset + last.old.length) { last.old.push(old); last.neu.push(neu); }
    else patches.push({ offset: off, old: [old], neu: [neu] });
  }
  return patchedFirmware(patches.map((x, n) => ({
    block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: 'work/scripts/accept_g1.mjs', n,
  })));
}

const HOME_KEYS = [
  ['0x99d2', 0x99d2, 3], ['0x9fa1', 0x9fa1, 3], ['0xdfa1', 0xdfa1, 1], ['0x1ea1', 0x1ea1, 1],
  ['0x9ec1', 0x9ec1, 1], ['0x9ed1', 0x9ed1, 1], ['0x9ee1', 0x9ee1, 1], ['0x9ef1', 0x9ef1, 1], ['0x59b1', 0x59b1, 1],
];
const ORIGINALLY = [2274, 2275, 2276, 2277, 2278, 2279];
const ZONE = [0, 1, 2, 3, 5, 10, 6, 7, 8, 9];
const ZONE_ONLY = [2, 3, 5, 6, 7, 8, 9, 10];

async function session(name, zone, nvramPath) {
  const fw = buildFirmware(zone);
  const layKeys = uiin_layout(fw.rom);
  const keyEntry = (code) => {
    const entries = layKeys.groups.flatMap(({ entries }, group) => entries.filter(([, , candidate]) => candidate === code).map((entry) => [group, ...entry]));
    assert.equal(entries.length, 1);
    return entries[0];
  };
  apply_uiin_layout(fw.rom);
  const parked = keyEntry(0x120b);
  UIIN_ENTRIES.set(parked.slice(0, 3).join(','), parked);
  const nv = fileNvram(resolve(nvramPath));
  const pl = new Player(
    { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
    { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} }, nvram: nv }, patch: fw.summary, patchRanges: fw.changed, loaded: 'on' },
  );
  pl.camapp_components = true;
  pl.camapp_native_tra = true;
  const snapCells = {};
  try {
    pl.open_session();
    const s = pl.session;
    const l = s.lab;
    const readByte = (addr) => l.sim.read(addr, 1)[0];
    const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
    const writeU32 = (addr, value) => { const b = Buffer.alloc(4); b.writeUInt32LE(value >>> 0, 0); l.sim.write(addr, b); };
    const writeU16 = (addr, value) => { const b = Buffer.alloc(2); b.writeUInt16LE(value & 0xffff, 0); l.sim.write(addr, b); };
    const word = (addr) => { try { return l.sim.u32(addr) >>> 0; } catch { return null; } };
    const gate = { reading: false };
    if (zone) {
      emit('behaviour', { step: name + '-hooks', label: 'EMULATOR-ONLY T3a value hooks, Z1 descriptor link, binding copy and section-7 redirects' });
      const own = (r) => (r.d0 & 0xffff) === UI;
      l.hook(native(0x6041931e), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: readByte(PROFILE) }); }, 'EMULATOR-ONLY afon value getter');
      l.hook(native(0x6041937f), (h, r) => {
        if (!own(r)) { l.passthrough(r); return; }
        writeByte(PROFILE, r.d1 & 0xff); writeByte(PROFILE_CACHED, r.d1 & 0xff); h.finish(r, { d0: 0 });
      }, 'EMULATOR-ONLY afon setter');
      l.hook(native(0x60419446), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0xA70F }); }, 'EMULATOR-ONLY afon mapped getter');
      l.hook(native(0x60419696), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon index getter');
      const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(0x6158f0f8 + 4, page);
      const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(0x61529ce8 + 4, src);
      writeU32(0x6150f5f0, 0x6031ea00); writeU32(0x6150f5f4, 3);
      const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
      const bindSrc = image.subarray(0x615c540c - BASE, 0x615c540c - BASE + 416 * 24);
      const used = new Set();
      for (let i = 0; i < 416; i++) used.add(bindSrc.readUInt32LE(i * 24));
      const newId = [0x1e6, 0x1e7, 0x0e3d, 0x3d6f].find((c) => !used.has(c));
      const extra = Buffer.from(image.subarray(0x615c5e14 - BASE, 0x615c5e14 - BASE + 24));
      extra.writeUInt32LE(newId, 0); extra.writeUInt32LE(UI, 8);
      l.sim.write(0x60320000, Buffer.concat([bindSrc, extra]));
      writeU32(0x615cc934 + 4, 0x60320000); writeU16(0x615cc934 + 8, 417);
      const head = word(0x62a84970 + (UI & 0x7f) * 4);
      const node = Buffer.alloc(8); node.writeUInt32LE(0x6031e9a0, 0); node.writeUInt32LE(head >>> 0, 4);
      l.sim.write(0x6031e9b8, node); writeU32(0x62a84970 + (UI & 0x7f) * 4, 0x6031e9b8);
    }
    const readKey = (key, index) => {
      const saved = l.sim.registers(); gate.reading = true;
      try { return l.call(native(0x60063380), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff; }
      finally { gate.reading = false; l.sim.reset(saved); }
    };
    const mapOf = (id) => {
      const saved = l.sim.registers(); gate.reading = true;
      try {
        const key = l.call(native(0x60419446), { d0: id }, null, null, 200000).d0 & 0xffff;
        const index = l.call(native(0x60419696), { d0: id }, null, null, 200000).d0 & 0xffff;
        return { id, key, index };
      } finally { gate.reading = false; l.sim.reset(saved); }
    };
    const cells = () => {
      const home = {};
      for (const [nm, key, n] of HOME_KEYS) home[nm] = Array.from({ length: n }, (_, i) => readKey(key, i));
      return {
        profile: readByte(PROFILE), profileCached: readByte(PROFILE_CACHED),
        k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
        k1dd1: Array.from({ length: 10 }, (_, i) => readKey(0x1dd1, i)),
        k99a1: Array.from({ length: 8 }, (_, i) => readKey(0x99a1, i)),
        k9a41: readKey(0x9a41, 0),
        k5962: Array.from({ length: 6 }, (_, i) => readKey(0x5962, i)),
        home,
        originally: ORIGINALLY.map((id) => mapOf(id)),
      };
    };
    const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
    const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
    const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
    const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
    const screen = () => {
      try { return { texts: walk.read().texts.map((t) => t.text), frame: walk.read().frame }; }
      catch (e) { return { texts: [], error: String(e && e.message || e), frame: null }; }
    };
    const shot = (fileTag) => {
      const view = screen();
      let file = null;
      if (view.frame) {
        file = resolve('work/out/accept-' + name + '-' + fileTag + '.png');
        write_png(file, view.frame[0], view.frame[1], words_to_rgb(view.frame[2]));
      }
      return { texts: view.texts, file };
    };
    const mark = (step, fileTag) => {
      const view = shot(fileTag || step);
      const readback = cells();
      snapCells[step] = readback;
      emit('observe', { step: name + '-' + step, file: view.file, texts: view.texts, cells: readback });
      return { texts: view.texts, cells: readback };
    };
    const check = (what, cond, detail) => {
      emit('observe', { step: name + '-assert', name: what, ok: !!cond, detail: detail ?? null });
      if (!cond) { failed = name + ' ' + what; throw new Error('assertion failed: ' + name + ' ' + what); }
    };
    idle(1200);
    press('menu');
    let menuRow = null;
    const seen = new Set();
    for (let n = 0; n < 24 && !menuRow; n++) {
      menuRow = screen().texts.find((t) => t.endsWith('AF Button'));
      if (menuRow) break;
      const sig = screen().texts.join('\n');
      if (seen.has(sig)) break;
      seen.add(sig);
      press('left');
    }
    check('af-button-tab', !!menuRow, screen().texts);
    walk.to([{ row: [menuRow] }]);
    idle(200);
    const page27 = mark('page27', 'page27');
    check('page27-title', page27.texts.some((t) => t.includes('AF Button')), page27.texts);
    check('page27-90a1', JSON.stringify(page27.cells.k90a1) === '[1,1]', page27.cells.k90a1);
    press('ok');
    const r2154 = mark('2154-open', '2154-open');
    check('2154-opened', r2154.texts.some((t) => t.includes('Priority')), r2154.texts);
    press('menu');
    const c2154 = mark('2154-cancel', '2154-cancel');
    check('2154-cancel-90a1', JSON.stringify(c2154.cells.k90a1) === '[1,1]', c2154.cells.k90a1);
    press('down');
    press('ok');
    const r2155 = mark('2155-open', '2155-open');
    check('2155-opened', r2155.texts.some((t) => t.includes('Priority')), r2155.texts);
    press('menu');
    const c2155 = mark('2155-cancel', '2155-cancel');
    check('2155-cancel-90a1', JSON.stringify(c2155.cells.k90a1) === '[1,1]', c2155.cells.k90a1);
    press('menu');
    const findTab = (fragment) => {
      for (let n = 0; n < 16; n++) {
        const hit = screen().texts.find((t) => fragment && t.includes(fragment));
        if (hit) return hit;
        press('left');
      }
      return null;
    };
    const openPage = (num, fragment) => {
      const tab = findTab(fragment);
      check('tab-' + num, !!tab, { fragment, texts: screen().texts });
      walk.to([{ row: [tab] }]);
      idle(200);
      const view = mark('page' + num, 'page' + num);
      check('page-' + num + '-rendered', view.texts.some((t) => t.includes(fragment)), view.texts);
      press('menu');
      return view;
    };
    const tail = (text) => (text || '').replace(/^@[^@]*@/, '').slice(-18);
    openPage(26, tail(titles[26]) || 'AF');
    openPage(25, tail(titles[25]) || 'AF');
    const back = findTab('AF Button');
    check('return-af-button', !!back, screen().texts);
    walk.to([{ row: [back] }]);
    idle(200);
    mark('page27-return', 'page27-return');
    if (zone) {
      press('down'); press('down');
      const before = mark('zone-before', 'zone-before');
      check('profile-starts-0', before.cells.profile === 0, before.cells.profile);
      press('ok'); press('right'); press('menu');
      const cancelled = mark('zone-cancel', 'zone-cancel');
      check('cancel-keeps-0', cancelled.cells.profile === 0, cancelled.cells.profile);
      press('ok'); press('right'); press('right'); press('ok');
      const first = mark('zone-commit-1', 'zone-commit-1');
      check('first-zone-value', ZONE_ONLY.includes(first.cells.profile), first.cells.profile);
      check('first-in-table', ZONE.includes(first.cells.profile), first.cells.profile);
      const firstValue = first.cells.profile;
      press('ok'); press('right'); press('right'); press('ok');
      const second = mark('zone-commit-2', 'zone-commit-2');
      check('second-zone-value', ZONE.includes(second.cells.profile) && second.cells.profile !== firstValue, { first: firstValue, second: second.cells.profile });
      check('stock-untouched', JSON.stringify(second.cells.k90a1) === '[1,1]', second.cells.k90a1);
    }
    let left = 0;
    for (; left < 6 && (s.screen() === 'menu' || s.screen() === 'direct'); left++) { press('menu'); idle(400); }
    idle(800);
    const saves = l.store_log?.nvram?.saves ?? [];
    emit('observe', { step: name + '-save', screen: s.screen(), menuExits: left, saves });
    check('native-save', saves.length > 0, saves);
    return { cells: snapCells, saves: saves.map((x) => x.store) };
  } finally {
    if (pl.session) pl.close_session();
  }
}

async function reopen(name, nvramPath, zone) {
  const fw = buildFirmware(zone);
  const layKeys = uiin_layout(fw.rom);
  apply_uiin_layout(fw.rom);
  const nv = fileNvram(resolve(nvramPath));
  const pl = new Player(
    { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
    { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} }, nvram: nv }, patch: fw.summary, patchRanges: fw.changed, loaded: 'on' },
  );
  pl.camapp_components = true;
  pl.camapp_native_tra = true;
  try {
    pl.open_session();
    const l = pl.session.lab;
    if (zone) {
      l.hook(native(0x6041931e), (h, r) => {
        if ((r.d0 & 0xffff) !== UI) { l.passthrough(r); return; }
        h.finish(r, { d0: l.sim.read(PROFILE, 1)[0] });
      }, 'EMULATOR-ONLY afon value getter');
    }
    const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) pl.session.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
    idle(800);
    const profile = l.sim.read(PROFILE, 1)[0];
    const saved = l.sim.registers();
    let k0 = null, k1 = null;
    try {
      k0 = l.call(native(0x60063380), { d0: 0x90a1, d1: 0, a0: 0 }, null, null, 200000).d0 & 0xffff;
      k1 = l.call(native(0x60063380), { d0: 0x90a1, d1: 1, a0: 0 }, null, null, 200000).d0 & 0xffff;
    } finally { l.sim.reset(saved); }
    emit('observe', { step: name + '-reopen', profile, k90a1: [k0, k1], loaded: l.store_log?.nvram?.loaded ?? null });
    if (zone && profile !== 0) { failed = name + ' profile not default'; throw new Error('profile persisted ' + profile); }
    if (JSON.stringify([k0, k1]) !== '[1,1]') { failed = name + ' 90a1'; throw new Error('90a1 ' + k0 + ',' + k1); }
    emit('observe', { step: name + '-reopen-assert', ok: true, profile, k90a1: [k0, k1] });
  } finally {
    if (pl.session) pl.close_session();
  }
}

function storeBytes(file) {
  const doc = JSON.parse(readFileSync(resolve(file), 'utf8'));
  const out = {};
  for (const name of ['M', 'E']) out[name] = doc[name] ? Buffer.from(base64Bytes(doc[name])).toString('hex') : null;
  out.clock_offset = doc.clock_offset ?? null;
  return out;
}

try {
  emit('behaviour', {
    step: 'explanation',
    label: 'EMULATOR-ONLY acceptance of the Z1 descriptor. The value stays in RAM at 0xa031e920. No firmware image is written.',
    sharedKeys: 'menu, AF Button, open and cancel 2154, down, open and cancel 2155, render pages 27 then 26 then 25, return to AF Button',
    candidateOnly: 'down down, OK Right MENU (cancel), OK Right Right OK, OK Right Right OK',
  });
  const runs = {};
  runs.control = await session('control', false, 'work/out/nvram-accept-control.json');
  runs.c1 = await session('c1', true, 'work/out/nvram-accept-c1.json');
  runs.c2 = await session('c2', true, 'work/out/nvram-accept-c2.json');
  const ignore = new Set(['profile', 'profileCached']);
  const diffCells = (a, b) => {
    const out = [];
    const walk = (x, y, path) => {
      if (Array.isArray(x) || typeof x !== 'object' || x === null) {
        if (JSON.stringify(x) !== JSON.stringify(y)) out.push({ path, control: x, candidate: y });
        return;
      }
      for (const k of Object.keys(x)) {
        if (ignore.has(k)) continue;
        walk(x[k], y[k], path ? path + '.' + k : k);
      }
    };
    walk(a, b, '');
    return out;
  };
  for (const who of ['c1', 'c2']) {
    for (const step of ['page27', '2154-cancel', '2155-cancel', 'page26', 'page25', 'page27-return']) {
      const d = diffCells(runs.control.cells[step], runs[who].cells[step]);
      emit('observe', { step: 'cell-compare', who, at: step, same: d.length === 0, diffs: d });
      if (d.length) { failed = 'cells ' + who + ' ' + step; throw new Error('cell diff ' + who + ' ' + step); }
    }
  }
  const stores = {
    control: storeBytes('work/out/nvram-accept-control.json'),
    c1: storeBytes('work/out/nvram-accept-c1.json'),
    c2: storeBytes('work/out/nvram-accept-c2.json'),
  };
  for (const who of ['c1', 'c2']) {
    const sameM = stores.control.M === stores[who].M;
    const sameE = stores.control.E === stores[who].E;
    emit('observe', {
      step: 'store-compare', who, sameM, sameE,
      mBytes: (stores.control.M || '').length / 2, eBytes: (stores.control.E || '').length / 2,
      clock: { control: stores.control.clock_offset, candidate: stores[who].clock_offset },
    });
    if (!sameM || !sameE) { failed = 'store ' + who; throw new Error('store diff ' + who); }
  }
  await reopen('c1', 'work/out/nvram-accept-c1.json', true);
  await reopen('c2', 'work/out/nvram-accept-c2.json', true);
  emit('observe', { step: 'done', ok: true });
} catch (e) {
  emit('observe', { step: 'done', ok: false, failed, error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(outPath, lines.join('\n') + (lines.length ? '\n' : ''));
}
