// T3a discovery probe. EMULATOR-ONLY hooks route one unused UI id to a RAM byte.
// The row array itself is native data in the overlay CSV. Section 7 pointers are
// written at run time because that section is compressed and is not in the overlay.
// Usage: node26 work/scripts/afon_zone_probe_v7.mjs om-emu <discover|control> <out.jsonl>
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, mode, outPath] = process.argv.slice(2);
assert(checkout && (mode === 'discover' || mode === 'control') && outPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadImage, loadBlock, loadNand, patchedFirmware, createHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE, A } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { BY_ID, UIIN_ENTRIES, apply_uiin_layout, uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');

const UI = 0x3d6f;
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const PAGE27 = 0x6158f0f8;
const SOURCE = 0x61529ce8;
const ROW_ARRAY = 0x6031e930;
const ID_LIST = 0x6031e928;
const lines = [];
const emit = (x) => {
  const row = { mode, hook: 'EMULATOR-ONLY', ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);

let fw = { rom: loadImage(), resBlock: loadBlock() };
if (mode === 'discover') {
  const diff = resolve('work/out/overlay-changed-bytes.csv');
  const rows = readFileSync(diff, 'utf8').trim().split(/\r?\n/).slice(1);
  const patches = [];
  for (const row of rows) {
    const [o, , old, next] = row.split(',');
    const off = parseInt(o, 16);
    const last = patches.at(-1);
    if (last && off === last.offset + last.old.length) {
      last.old.push(parseInt(old, 16));
      last.new.push(parseInt(next, 16));
    } else patches.push({ offset: off, old: [parseInt(old, 16)], new: [parseInt(next, 16)] });
  }
  fw = patchedFirmware(patches.map((x, n) => ({
    block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.new), source: diff, n,
  })));
}

const layout = uiin_layout(fw.rom);
const keyEntry = (code) => {
  const entries = layout.groups.flatMap(({ entries }, group) =>
    entries.filter(([, , candidate]) => candidate === code).map((entry) => [group, ...entry]));
  assert.equal(entries.length, 1, 'one active UI_IN key for ' + code.toString(16));
  return entries[0];
};
apply_uiin_layout(fw.rom);
const parked = keyEntry(0x120b);
assert.equal(parked[4], 2);
UIIN_ENTRIES.set(parked.slice(0, 3).join(','), parked);

const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  {
    ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000,
    machine: { coverage: { mark() {}, stub() {} } },
    ...(mode === 'discover' ? { patch: fw.summary, patchRanges: fw.changed, loaded: 'on' } : {}),
  },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;

const shot = (file, frame) => {
  write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
  emit({ step: 'screenshot', file });
};

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const readByte = (addr) => l.sim.read(addr, 1)[0];
  const writeByte = (addr, value) => {
    const b = Buffer.alloc(1);
    b[0] = value & 0xff;
    l.sim.write(addr, b);
  };
  const profile = () => ({
    uncached: readByte(PROFILE),
    cached: readByte(PROFILE_CACHED),
    head: Array.from(l.sim.read(PROFILE, 4)),
  });
  if (mode === 'discover') {
    // EMULATOR-ONLY. These four hooks are not native code. 0x6041931e is the
    // value getter that calls the mapped getter 0x60419446 and the index
    // getter 0x60419696. Returning any real key from those two would read or
    // write a stock cell, so the value getter and the setter 0x6041937f move
    // the RAM byte, and the mapped getter and index getter refuse this id.
    const own = (r) => (r.d0 & 0xffff) === UI;
    l.hook(native(0x6041931e), (h, r) => {
      if (!own(r)) { l.passthrough(r); return; }
      h.finish(r, { d0: readByte(PROFILE) });
    }, 'EMULATOR-ONLY afon value getter');
    l.hook(native(0x6041937f), (h, r) => {
      if (!own(r)) { l.passthrough(r); return; }
      writeByte(PROFILE, r.d1 & 0xff);
      writeByte(PROFILE_CACHED, r.d1 & 0xff);
      h.finish(r, { d0: 0 });
    }, 'EMULATOR-ONLY afon setter');
    l.hook(native(0x60419446), (h, r) => {
      if (!own(r)) { l.passthrough(r); return; }
      // Non-zero and unregistered. Key 0 makes the editor treat the row as unset.
      h.finish(r, { d0: 0xA70F });
    }, 'EMULATOR-ONLY afon mapped getter');
    l.observe(native(0x60063380), (lab, r) => {
      if ((r.d0 & 0xffff) === 0xA70F) emit({ step: 'sentinel-read', index: r.d1 >>> 0 });
    }, 'obs-sentinel-read');
    l.observe(native(0x60063431), (lab, r) => {
      if ((r.d0 & 0xffff) === 0xA70F) emit({ step: 'sentinel-write', index: r.d1 >>> 0, a1: r.a1 >>> 0 });
    }, 'obs-sentinel-write');
    l.hook(native(0x60419696), (h, r) => {
      if (!own(r)) { l.passthrough(r); return; }
      h.finish(r, { d0: 0 });
    }, 'EMULATOR-ONLY afon index getter');
    // Runtime redirect of compressed section 7. Not overlay bytes.
    const page = Buffer.alloc(8);
    page.writeUInt32LE(ROW_ARRAY, 0);
    page.writeUInt16LE(3, 4);
    l.sim.write(PAGE27 + 4, page);
    const src = Buffer.alloc(8);
    src.writeUInt32LE(ID_LIST, 0);
    src.writeUInt16LE(3, 4);
    l.sim.write(SOURCE + 4, src);
    const desc = 0x6031e9a0;
    const node = 0x6031e9b8;
    const bucket = 0x62a84970 + (UI & 0x7f) * 4;
    const head = l.sim.u32(bucket);
    const nodeBytes = Buffer.alloc(8);
    nodeBytes.writeUInt32LE(desc, 0);
    nodeBytes.writeUInt32LE(head, 4);
    l.sim.write(node, nodeBytes);
    const headBytes = Buffer.alloc(4);
    headBytes.writeUInt32LE(node, 0);
    l.sim.write(bucket, headBytes);
    const looked = l.call(native(0x604058bc), { d0: UI }, null, null, 200000);
    emit({
      step: 'editor-descriptor',
      label: 'EMULATOR-ONLY',
      desc: hex(desc),
      node: hex(node),
      bucket: hex(bucket),
      previous: hex(head),
      lookup: hex(looked.a0 >>> 0),
      bytes: Array.from(l.sim.read(desc, 20)),
    });
    emit({
      step: 'runtime-redirect',
      label: 'EMULATOR-ONLY',
      page: hex(PAGE27),
      rows: hex(l.sim.u32(PAGE27 + 4)),
      count: l.sim.u32(PAGE27 + 8) & 0xffff,
      source: hex(SOURCE),
      idPointer: hex(l.sim.u32(SOURCE + 4)),
      idCount: l.sim.u32(SOURCE + 8) & 0xffff,
      ids: Array.from(l.sim.read(ID_LIST, 8)),
    });
  }
  const getString = A(0x510bb079);
  const label = (id) => {
    const v = l.call(getString, { d0: id }, null, null, 200000).a0 >>> 0;
    return v ? Buffer.from(l.sim.read(v, 400)).toString('utf16le').split(String.fromCharCode(0))[0] : null;
  };
  const readKey = (key, index) => l.call(native(0x60063380), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 >>> 0;
  const cells = () => ({
    zone: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => readKey(0x99a1, i)),
    size: readKey(0x9a41, 0),
    position: [0, 1, 2, 3, 4, 5].map((i) => readKey(0x5962, i)),
    custom: [0, 1].map((i) => readKey(0x1dd1, i)),
    homeArea: [0, 1, 2].map((i) => readKey(0x9fa1, i)),
    homePos: [0, 1, 2].map((i) => readKey(0x99d2, i)),
    homeSize: readKey(0xdfa1, 0),
    homeFlag: readKey(0x1ea1, 0),
    priority: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
    ui: { id2154: s.get(2154), id2155: s.get(2155), area: s.get(163), homeArea: s.get(238) },
  });
  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const key = (k, d) => {
    const rec = s.key(k, d);
    s.camapp.pump();
    return rec;
  };
  const press = (k) => {
    key(k, 'down');
    idle(100);
    key(k, 'up');
    idle(800);
  };
  const ids = [0x1279, 0xda4, 0xdd2, 0xdd3, 0xdd4, 0xdcf, 0x127b, 0x124f];
  emit({ step: 'strings', strings: Object.fromEntries(ids.map((id) => [hex(id), label(id)])), profile: profile(), cells: cells() });
  if (mode === 'discover') {
    const got = l.call(native(0x60419315), { d0: UI }, null, null, 200000);
    emit({ step: 'direct-get', d0: got.d0 >>> 0, profile: profile() });
    l.call(native(0x6041937f), { d0: UI, d1: 2 }, null, null, 200000);
    emit({ step: 'direct-set', want: 2, profile: profile() });
    l.call(native(0x6041937f), { d0: UI, d1: 0 }, null, null, 200000);
    emit({ step: 'direct-restore', profile: profile() });
    const stock = l.call(native(0x60419315), { d0: 2154 }, null, null, 200000);
    emit({ step: 'stock-get-still-works', d0: stock.d0 >>> 0, ui: s.get(2154) });
  }
  idle(2000);
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log });
  let menuRow;
  const visited = new Set();
  while (!menuRow) {
    const visible = walk.read().texts.map((row) => row.text);
    menuRow = visible.find((text) => text.endsWith('AF Button'));
    if (menuRow) break;
    const page = visible.join('\n');
    assert.ok(!visited.has(page) && visited.size < 64, 'AF Button missing');
    visited.add(page);
    press('left');
  }
  walk.to([{ row: [menuRow] }]);
  const snap = (step) => {
    const scr = walk.read();
    const texts = scr.texts.map((t) => t.text);
    emit({ step, texts, profile: profile(), priority: [s.get(2154), s.get(2155)], afon: mode === 'discover' ? s.get(UI) : null });
    return scr;
  };
  let providerLogged = false;
  l.observe(native(0x61203a81), (lab, r) => {
    const viewer = r.a0 >>> 0;
    if (lab.sim.u32(viewer + 0x13e8) !== PAGE27) return;
    const model = lab.sim.u32(viewer + 0x13e0);
    const category = lab.sim.u32(model + 0x2c);
    const provider = lab.sim.u32(category + 4);
    const size = lab.sim.u32(provider + 0x48) & 0xffff;
    const dump = (off, n) => {
      const p = lab.sim.u32(provider + off);
      return { p: hex(p), bytes: p ? Array.from(lab.sim.read(p, n)) : null };
    };
    if (!providerLogged) {
      providerLogged = true;
      emit({
        step: 'provider-before', label: 'EMULATOR-ONLY', size,
        modelCount: lab.sim.u32(model + 0x30) >>> 0,
        ids: dump(0x54, 8), flags: dump(0x4c, 8), extra: dump(0x50, 16),
      });
    }
    if (size === 3) return;
    if (size !== 2) {
      emit({ step: 'provider-unexpected', size });
      return;
    }
    // EMULATOR-ONLY. The page descriptor already names three rows, but the
    // live provider was built from the stock source and still has two IDs.
    // Index 2 then reads as the invalid id 0xc80 and OK does nothing.
    for (const offset of [0x4c, 0x50, 0x54]) {
      const pointer = lab.sim.u32(provider + offset);
      if (!pointer) continue;
      const firstTwo = Buffer.from(lab.sim.read(pointer, 4));
      const third = Buffer.from(firstTwo.subarray(0, 2));
      if (offset === 0x54) third.writeUInt16LE(UI);
      const replacement = Buffer.alloc(4);
      replacement.writeUInt32LE(lab.alloc(Buffer.concat([firstTwo, third]), 2));
      lab.sim.write(provider + offset, replacement);
    }
    const newSize = Buffer.alloc(2);
    newSize.writeUInt16LE(3);
    lab.sim.write(provider + 0x48, newSize);
    emit({
      step: 'provider-extended', label: 'EMULATOR-ONLY',
      size: lab.sim.u32(provider + 0x48) & 0xffff,
      ids: Array.from(lab.sim.read(lab.sim.u32(provider + 0x54), 6)),
    });
  }, 'obs-provider-extend');
  const copies = [];
  l.observe(native(0x611c782f), (lab, r) => {
    if (copies.length >= 80) return;
    const src = r.a1 >>> 0;
    if (src < 0x60000000) return;
    const raw = Buffer.from(lab.sim.read(src, 12));
    copies.push({ src: hex(src), value: raw.readUInt32LE(0), kind: raw.readUInt16LE(4), id: raw.readUInt16LE(6) });
  }, 'obs-desc-copy');
  const scr = snap('af-button-page');
  shot(resolve('work/out/afon-page-v7.png'), scr.frame);
  emit({ step: 'cells-before-zone', cells: cells() });
  if (mode === 'discover') {
    // Entry highlights row 0. Two downs reach the new third row. v1's four
    // downs wrapped onto the AF-ON priority row.
    press('down');
    snap('down-0');
    press('down');
    snap('down-1');
    const hits = { idle: new Set(), ok: new Set(), down: new Set() };
    const first = { idle: {}, ok: {}, down: {} };
    let phase = 'idle';
    const tsv = readFileSync(resolve('ref/analysis/decompiled-main/functions.tsv'), 'utf8');
    let traced = 0;
    for (const line of tsv.split(/\r?\n/).slice(1)) {
      if (!line) continue;
      const addr = parseInt(line.split('\t')[0], 16);
      if (addr < 0x61203696 || addr >= 0x61208000) continue;
      if (l.hooks && l.hooks.has(native(addr))) continue;
      traced += 1;
      l.observe(native(addr), (lab, r) => {
        hits[phase].add(addr);
        if (first[phase][addr] === undefined) first[phase][addr] = r.d0 >>> 0;
      }, 'obs-trace-' + addr.toString(16));
    }
    idle(400);
    phase = 'ok';
    press('ok');
    phase = 'down';
    press('down');
    phase = 'idle';
    const list = (name) => [...hits[name]].sort((a, b) => a - b).map((a) => ({ a: hex(a), d0: first[name][a] }));
    const okNotIdle = [...hits.ok].filter((a) => !hits.idle.has(a)).sort((a, b) => a - b);
    const downNotIdle = [...hits.down].filter((a) => !hits.idle.has(a)).sort((a, b) => a - b);
    emit({
      step: 'ok-trace', traced,
      okNotIdle: okNotIdle.map((a) => ({ a: hex(a), d0: first.ok[a] })),
      downNotIdle: downNotIdle.map((a) => ({ a: hex(a), d0: first.down[a] })),
      okOnly: okNotIdle.filter((a) => !hits.down.has(a)).map((a) => hex(a)),
      counts: { idle: hits.idle.size, ok: hits.ok.size, down: hits.down.size },
    });
    const chooser = snap('chooser');
    shot(resolve('work/out/afon-chooser-v7.png'), chooser.frame);
    emit({ step: 'chooser-copies', copies });
    press('down');
    snap('option-down');
    press('ok');
    snap('option-ok');
    emit({ step: 'after-ok', cells: cells(), profile: profile() });
  }
  emit({ step: 'done', ok: true, profile: profile(), cells: cells() });
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
