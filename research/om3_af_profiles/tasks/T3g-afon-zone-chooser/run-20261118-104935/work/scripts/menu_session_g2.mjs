// Session module g2. Same B2 baseline as g1, plus optional single-byte descriptor overrides.
// g1 has already run and is not edited.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const UI = 0x3d6f;
const BASE = 0x60021020;
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const PAGE27 = 0x6158f0f8;
const SOURCE = 0x61529ce8;
const TABLE_PTR = 0x6150f5f0;
const TABLE_RAM = 0x6031ea00;
const ROW = 0x6031e978;
const DESC = 0x6031e9a0;
const DESC_2154 = 0x6062132c;
const NODE = 0x6031e9b8;
const BUCKET_BASE = 0x62a84970;
const STOCK_ROW = 0x6158dc44;
const STOCK_TABLE = 0x6150c514;
const BIND_SRC = 0x615c540c;
const BIND_COUNT = 416;
const BIND_RAM = 0x60320000;
const DIR = 0x615cc934;
const REC_2154 = 0x615c5e14;

const HOME_KEYS = [
  ['0x99d2', 0x99d2, 3], ['0x9fa1', 0x9fa1, 3], ['0xdfa1', 0xdfa1, 1], ['0x1ea1', 0x1ea1, 1],
  ['0x9ec1', 0x9ec1, 1], ['0x9ed1', 0x9ed1, 1], ['0x9ee1', 0x9ee1, 1], ['0x9ef1', 0x9ef1, 1], ['0x59b1', 0x59b1, 1],
];
const ORIGINALLY = [2274, 2275, 2276, 2277, 2278, 2279];

export async function runExperiment(opts) {
  const { checkout, outPath, tag, explanation, change, descriptorFrom, cancelNav, confirmNav, overrides } = opts;
  assert(checkout && outPath && tag && explanation && change);
  assert(Number.isInteger(descriptorFrom));
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
  const desc2154 = Buffer.from(image.subarray(DESC_2154 - BASE, DESC_2154 - BASE + 20));
  const descBytes = Buffer.from(image.subarray(descriptorFrom - BASE, descriptorFrom - BASE + 20));
  const sourceId = descBytes.readUInt16LE(0);
  descBytes.writeUInt16LE(UI, 0);
  for (const ov of overrides || []) descBytes[ov.offset] = ov.value & 0xff;
  const clone2154 = Buffer.from(desc2154);
  clone2154.writeUInt16LE(UI, 0);
  const fieldDiff = [];
  for (let i = 0; i < 20; i++) {
    if (descBytes[i] !== clone2154[i]) fieldDiff.push({ offset: i, from: clone2154[i], to: descBytes[i] });
  }
  for (let i = 0; i < 20; i++) {
    const off = (DESC - BASE) + i;
    byOff.set(off, { old: image[off], neu: descBytes[i] });
  }
  const stockRow = image.subarray(STOCK_ROW - BASE, STOCK_ROW - BASE + 36);
  for (let i = 0; i < 36; i++) {
    const off = (ROW - BASE) + i;
    byOff.set(off, { old: image[off], neu: i < 4 ? [0x6f, 0x3d, 0x00, 0x00][i] : stockRow[i] });
  }
  const zoneOpt = Buffer.alloc(8);
  zoneOpt.writeUInt32LE(0x6158ba1c, 0);
  zoneOpt.writeUInt32LE(10, 4);
  for (let i = 0; i < 8; i++) {
    const off = (ROW - BASE) + 12 + i;
    byOff.set(off, { old: image[off], neu: zoneOpt[i] });
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
  const ordered = [...byOff.entries()].sort((a, b) => a[0] - b[0]);
  const patches = [];
  const csvRows = ['component_offset,runtime_address,stock_byte,proposed_byte,purpose'];
  for (const [off, { old, neu }] of ordered) {
    if (image[off] !== old) throw new Error('overlay old mismatch at ' + hex(BASE + off));
    const last = patches.at(-1);
    if (last && off === last.offset + last.old.length) { last.old.push(old); last.neu.push(neu); }
    else patches.push({ offset: off, old: [old], neu: [neu] });
    const addr = BASE + off;
    let purpose = 'prerequisite section-1 tail from the T3a row overlay';
    if (addr >= TABLE_RAM && addr < TABLE_RAM + 72) purpose = 'page-27 action table; third record editor id 0x1e6';
    else if (addr >= ROW + 12 && addr < ROW + 20) purpose = 'row options at zone list 0x6158ba1c, count 10';
    else if (addr >= ROW && addr < ROW + 36) purpose = 'third row copied from 2154 with UI id 0x3D6F';
    else if (addr >= DESC && addr < DESC + 20) purpose = 'descriptor id 0x3D6F cloned from 0x' + descriptorFrom.toString(16);
    csvRows.push([off.toString(16).padStart(8, '0'), addr.toString(16), old.toString(16).padStart(2, '0'), neu.toString(16).padStart(2, '0'), purpose].join(','));
  }
  writeFileSync(resolve('work/out/overlay-' + tag + '.csv'), csvRows.join('\n') + '\n');
  const fw = patchedFirmware(patches.map((x, n) => ({
    block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: 'work/scripts/menu_session_g2.mjs', n,
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
  let sessionPlayer = pl;

  try {
    sessionPlayer.open_session();
    const s = pl.session;
    const l = s.lab;
    const bytes = (addr, n) => Buffer.from(l.sim.read(addr, n)).toString('hex');
    const readByte = (addr) => l.sim.read(addr, 1)[0];
    const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
    const writeU32 = (addr, value) => { const b = Buffer.alloc(4); b.writeUInt32LE(value >>> 0, 0); l.sim.write(addr, b); };
    const writeU16 = (addr, value) => { const b = Buffer.alloc(2); b.writeUInt16LE(value & 0xffff, 0); l.sim.write(addr, b); };
    const word = (addr) => { try { return l.sim.u32(addr) >>> 0; } catch { return null; } };
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
      tag,
      explanation,
      change,
      combined: opts.combined === true,
      descriptorSource: hex(descriptorFrom),
      sourceId,
      descriptor: descBytes.toString('hex'),
      differsFrom2154Clone: fieldDiff,
      newEditorId: hex(newId),
      stockBindingRecord: stockBinding,
      newBindingRecord: extra.toString('hex'),
      thirdRecord: tableBytes.subarray(48, 72).toString('hex'),
      cancelNav, confirmNav,
    });
    emit('behaviour', {
      step: 'overlay-load',
      label: 'EMULATOR-ONLY overlay. The prerequisite is the T3a section-1 tail (profile head, provider ids, two stock rows). This session also loads the action table, the 2154-shaped third row with zone options, and the descriptor named above.',
      bytes: ordered.length,
      csv: 'work/out/overlay-' + tag + '.csv',
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
      setter: '0x6041937f writes D1 low byte to 0xa031e920 and 0x6031e920 and returns 0',
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
    const sameCells = (a, b) => JSON.stringify({ ...a, profile: 0, profileCached: 0 }) === JSON.stringify({ ...b, profile: 0, profileCached: 0 });
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
    const lookup = (label) => {
      const saved = l.sim.registers();
      let result = null;
      let error = null;
      try { result = l.call(native(0x604058bc), { d0: UI }, null, null, 2000000); }
      catch (e) { error = String(e && e.message || e); }
      const after = l.sim.registers();
      l.sim.reset(saved);
      emit('observe', { step: label, fn: '0x604058bc', d0: after.d0 >>> 0, a0: hex(after.a0 >>> 0), result, error });
    };
    lookup('descriptor-before-link');
    const bucketAddr = BUCKET_BASE + (UI & 0x7f) * 4;
    const head = word(bucketAddr);
    const nodeBytes = Buffer.alloc(8);
    nodeBytes.writeUInt32LE(DESC, 0);
    nodeBytes.writeUInt32LE(head >>> 0, 4);
    l.sim.write(NODE, nodeBytes);
    writeU32(bucketAddr, NODE);
    emit('behaviour', {
      step: 'descriptor-link',
      label: 'EMULATOR-ONLY hash link of the descriptor at 0x6031e9a0',
      descriptor: bytes(DESC, 20),
      node: hex(NODE),
      bucket: hex(bucketAddr),
      previousHead: hex(head >>> 0),
    });
    lookup('descriptor-after-link');
    l.sim.write(BIND_RAM, bindBytes);
    writeU32(DIR + 4, BIND_RAM);
    writeU16(DIR + 8, BIND_COUNT + 1);
    emit('behaviour', {
      step: 'binding-copy',
      label: 'EMULATOR-ONLY runtime write of the key-8 editor table',
      at: hex(BIND_RAM),
      bytes: bindBytes.length,
      head: bytes(BIND_RAM, 8),
      newRecord: bytes(BIND_RAM + BIND_COUNT * 24, 24),
    });
    emit('behaviour', {
      step: 'redirects',
      label: 'EMULATOR-ONLY section-7 pointer writes, including the prerequisite page and source redirects',
      page: { at: hex(PAGE27 + 4), after: bytes(PAGE27 + 4, 8) },
      source: { at: hex(SOURCE + 4), after: bytes(SOURCE + 4, 8) },
      actionTable: { at: hex(TABLE_PTR), after: bytes(TABLE_PTR, 8) },
      directory: { at: hex(DIR), before: beforeDir, after: bytes(DIR, 12), pointer: hex(BIND_RAM), count: BIND_COUNT + 1 },
    });
    const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
    const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
    const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
    const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
    const shot = (name) => {
      const frame = walk.read().frame;
      const file = resolve('work/out/' + tag + '-' + name + '.png');
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
    const snap = (group, fileTag) => {
      const view = screen();
      let file = null;
      try { file = shot(fileTag); } catch (e) { file = 'shot-error ' + String(e && e.message ? e.message : e); }
      const readback = cells();
      const trace = take(group);
      emit('observe', { step: group, file, highlight: view.highlight, texts: view.texts, cells: readback, ...trace });
      return { view, readback, trace };
    };
    const nav = (keys, prefix) => {
      const steps = [];
      for (let i = 0; i < keys.length; i++) {
        press(keys[i]);
        const name = prefix + i;
        const got = snap(name, name);
        steps.push({ key: keys[i], texts: got.view.texts, profile: got.readback.profile, setters: got.trace.setters });
      }
      return steps;
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
    const openCancel = (rowTag) => {
      snap(rowTag + '-before', rowTag + '-before');
      state.phase = 'on';
      state.group = rowTag;
      press('ok');
      const after = snap(rowTag + '-after', rowTag + '-after');
      press('menu');
      const cancel = snap(rowTag + '-cancel', rowTag + '-cancel');
      return { after, cancel };
    };
    const row2154 = openCancel('2154');
    press('down');
    emit('observe', { step: 'down-to-2155', ...take('down-to-2155') });
    const row2155 = openCancel('2155');
    press('down');
    emit('observe', { step: 'down-to-3d6f', ...take('down-to-3d6f') });
    const before = snap('3d6f-before', '3d6f-before');
    state.group = '3d6f';
    const chooserMark = totals.chooser;
    press('ok');
    const opened = snap('3d6f-after', '3d6f-after');
    const cancelSteps = nav(cancelNav, '3d6f-cancel-nav-');
    press('menu');
    const cancelled = snap('3d6f-cancel', '3d6f-cancel');
    press('ok');
    const reopened = snap('3d6f-reopen', '3d6f-reopen');
    const confirmSteps = nav(confirmNav, '3d6f-nav-');
    press('ok');
    const confirmed = snap('3d6f-confirm', '3d6f-confirm');
    state.phase = 'off';
    const ownSetters = confirmed.trace.setters.filter((r) => r.id === UI);
    const confirmValue = ownSetters.length ? ownSetters[ownSetters.length - 1].value : null;
    const zoneOnly = [2, 3, 5, 6, 7, 8, 9, 10];
    emit('observe', {
      step: 'done',
      chooserEntries: totals.chooser - chooserMark,
      profileBefore: before.readback.profile,
      cancelProfile: cancelled.readback.profile,
      confirmProfile: confirmed.readback.profile,
      confirmValue,
      confirmSetters: ownSetters,
      cancelLeftProfile: cancelled.readback.profile === before.readback.profile,
      profileMatchesConfirm: confirmed.readback.profile === confirmValue,
      zoneOnlyValue: zoneOnly.includes(confirmValue),
      stock90a1: confirmed.readback.k90a1,
      stock90a1Held: JSON.stringify(confirmed.readback.k90a1) === JSON.stringify(row2154.cancel.readback.k90a1)
        && JSON.stringify(confirmed.readback.k90a1) === JSON.stringify(row2155.cancel.readback.k90a1),
      cellsHeldExceptProfile: sameCells(before.readback, confirmed.readback) && sameCells(before.readback, cancelled.readback),
      openedTexts: opened.view.texts,
      cancelSteps, confirmSteps,
      priorityHelp: opened.view.texts.some((t) => t.includes('selected AF target position')),
    });
  } catch (e) {
    emit('observe', { step: 'boundary', error: String(e && e.stack ? e.stack : e) });
    process.exitCode = 1;
  } finally {
    if (sessionPlayer && sessionPlayer.session) sessionPlayer.close_session();
    mkdirSync(resolve('work/out'), { recursive: true });
    writeFileSync(outPath, lines.join('\n') + (lines.length ? '\n' : ''));
  }
}
