// E3. Baseline is the T3a overlay, hooks and redirects. One change: the third
// row is a byte-exact copy of row 2154, including setting id 2154. The provider
// id list is left as T3a wrote it. Observation hooks stay separate.
// Usage: node26 work/scripts/exp_e3_c1.mjs om-emu work/out/exp-e3-c1.jsonl
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
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
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const PAGE27 = 0x6158f0f8;
const SOURCE = 0x61529ce8;
const ROW = 0x6031e978;
const STOCK = 0x6158dc44;
const lines = [];
const emit = (role, x) => {
  const row = { hook: role === 'behaviour' ? 'EMULATOR-ONLY' : 'observe', role, ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);
const ranges = [];
for (const line of readFileSync(resolve('ref/analysis/decompiled-main/functions.tsv'), 'utf8').split(/\r?\n/).slice(1)) {
  if (!line) continue;
  const [a, name] = line.split('\t');
  ranges.push([parseInt(a, 16), name]);
}
const fnOf = (addr) => {
  let lo = 0, hi = ranges.length - 1, best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ranges[mid][0] <= addr) { best = ranges[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best ? best[1] : null;
};
const diff = resolve('ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv');
const patches = [];
for (const row of readFileSync(diff, 'utf8').trim().split(/\r?\n/).slice(1)) {
  const [o, , old, next] = row.split(',');
  const off = parseInt(o, 16);
  const last = patches.at(-1);
  if (last && off === last.offset + last.old.length) { last.old.push(parseInt(old, 16)); last.new.push(parseInt(next, 16)); }
  else patches.push({ offset: off, old: [parseInt(old, 16)], new: [parseInt(next, 16)] });
}
const fw = patchedFirmware(patches.map((x, n) => ({ block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.new), source: diff, n })));
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
const state = { phase: 'off', events: [], writes: [] };

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const readByte = (addr) => l.sim.read(addr, 1)[0];
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const bytes = (addr, n) => Buffer.from(l.sim.read(addr, n)).toString('hex');
  const word = (addr) => {
    const a = addr >>> 0;
    if (a < 0x40000000 || a >= 0xc0000000) return null;
    try { return l.sim.u32(a) >>> 0; } catch { return null; }
  };
  const readKey = (key, index) => l.call(native(0x60063380), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff;
  const lookup = (id) => {
    const r = l.call(native(0x604058bc), { d0: id }, null, null, 200000);
    const a0 = r.a0 >>> 0;
    return { d0: hex(r.d0 >>> 0), a0: hex(a0), bytes: a0 > 0x40000000 ? bytes(a0, 20) : null };
  };
  const mappedNative = (id) => l.call(native(0x60419446), { d0: id }, null, null, 200000).d0 & 0xffff;
  const indexNative = (id) => l.call(native(0x60419696), { d0: id }, null, null, 200000).d0 & 0xffff;
  const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  const desc = 0x6031e9a0, node = 0x6031e9b8, bucketFor = (id) => 0x62a84970 + (id & 0x7f) * 4;
  const head = l.sim.u32(bucketFor(UI));
  const nodeBytes = Buffer.alloc(8); nodeBytes.writeUInt32LE(desc, 0); nodeBytes.writeUInt32LE(head, 4); l.sim.write(node, nodeBytes);
  const headBytes = Buffer.alloc(4); headBytes.writeUInt32LE(node, 0); l.sim.write(bucketFor(UI), headBytes);
  const reg = {
    beforeHooks: true,
    lookup2154: lookup(2154),
    lookup3d6f: lookup(UI),
    mapped2154: mappedNative(2154),
    mapped3d6f: mappedNative(UI),
    index2154: indexNative(2154),
    index3d6f: indexNative(UI),
    bucket2154: hex(l.sim.u32(bucketFor(2154))),
    bucket3d6f: hex(l.sim.u32(bucketFor(UI))),
    desc2154: bytes(0x6062132c, 20),
    desc3d6f: bytes(desc, 20),
  };
  const own = (r) => (r.d0 & 0xffff) === UI;
  l.hook(native(0x6041931e), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: readByte(PROFILE) }); }, 'EMULATOR-ONLY afon value getter');
  l.hook(native(0x6041937f), (h, r) => {
    const id = r.d0 & 0xffff, value = r.d1 & 0xffff;
    if (state.phase === 'ok' && state.writes.length < 80) state.writes.push({ part: 'commit', fn: 'FUN_6041937f', id, value, mdr: hex(r.mdr >>> 0), behaviour: id === UI });
    if (!own(r)) { l.passthrough(r); return; }
    writeByte(PROFILE, value); writeByte(PROFILE_CACHED, value);
    h.finish(r, { d0: 0 });
  }, 'EMULATOR-ONLY afon setter');
  l.hook(native(0x60419446), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0xA70F }); }, 'EMULATOR-ONLY afon mapped getter');
  l.hook(native(0x60419696), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon index getter');
  const stock = Buffer.from(l.sim.read(STOCK, 36));
  const beforeRow = Buffer.from(l.sim.read(ROW, 36));
  l.sim.write(ROW, stock);
  const afterRow = Buffer.from(l.sim.read(ROW, 36));
  assert.equal(afterRow.toString('hex'), stock.toString('hex'));
  emit('behaviour', {
    step: 'e3-row', label: 'EMULATOR-ONLY runtime write',
    note: 'third row is a byte-exact copy of 2154, including setting id 2154. Provider id list is unchanged.',
    before: beforeRow.toString('hex'), after: afterRow.toString('hex'), idList: bytes(0x6031e928, 8),
  });
  const storeBefore = { profile: readByte(PROFILE), k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)] };
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return ['read-error ' + e.message]; } };
  const shot = (name) => {
    const frame = walk.read().frame;
    const file = resolve('work/out/exp-e3-c1-' + name + '.png');
    write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
    return file;
  };
  idle(1200);
  press('menu');
  const findRow = (pred) => {
    const seen = new Set();
    for (let n = 0; n < 24; n++) {
      const texts = textsOf();
      const hit = texts.find(pred);
      if (hit) return { hit, texts };
      const sig = texts.join('\n');
      if (seen.has(sig)) return { hit: null, texts };
      seen.add(sig);
      press('left');
    }
    return { hit: null, texts: textsOf() };
  };
  const af = findRow((t) => t.endsWith('AF Button'));
  assert.ok(af.hit, 'AF Button missing');
  walk.to([{ row: [af.hit] }]);
  idle(200);
  const push = (rec) => { if (state.phase === 'ok' && state.events.length < 48) state.events.push(rec); };
  const site = (addr, name, part, extra) => {
    l.observe(native(addr), (lab, r) => {
      const rec = { part, site: name, d0: r.d0 >>> 0, d1: r.d1 >>> 0, d2: r.d2 >>> 0, a0: hex(r.a0 >>> 0), a1: hex(r.a1 >>> 0), a1Name: fnOf(r.a1 >>> 0), mdr: hex(r.mdr >>> 0), caller: fnOf(r.mdr >>> 0) };
      if (extra) Object.assign(rec, extra(r));
      push(rec);
    }, 'obs-' + name);
  };
  site(0x6124f6c7, 'dispatch-entry', 'dispatch', (r) => ({ a0w0: hex(word(r.a0) ?? 0), vt0: hex(word(word(r.a0) ?? 0) ?? 0) }));
  site(0x6124f7be, 'first-virtual', 'dispatch', () => ({}));
  site(0x6124f7c0, 'virtual-return', 'dispatch', () => ({}));
  site(0x6124f7d4, 'cmp-result-1', 'dispatch', (r) => ({ child: hex(word(r.a3) ?? 0), childVt: hex(word(word(r.a3) ?? 0) ?? 0) }));
  site(0x6124f7e2, 'refresh-slot', 'row-refresh', () => ({}));
  site(0x6124f7e6, 'editor-code', 'chooser-construction', () => ({}));
  site(0x6127e750, 'open-tramp', 'chooser-construction', () => ({}));
  site(0x610cdebf, 'chooser-refresh', 'chooser-construction', () => ({}));
  site(0x610cdf05, 'chooser-body', 'chooser-construction', () => ({}));
  site(0x610e2536, 'chooser-widgets', 'chooser-construction', () => ({}));
  site(0x610cdfe9, 'after-focus-call', 'input-focus', () => ({}));
  site(0x61203816, 'page-walk', 'row-refresh', () => ({}));
  l.observe(native(0x60063431), (lab, r) => {
    if (state.phase !== 'ok' || state.writes.length >= 80) return;
    state.writes.push({ part: 'commit', fn: 'FUN_60063431', d0: r.d0 >>> 0, d1: r.d1 >>> 0, a0: hex(r.a0 >>> 0), mdr: hex(r.mdr >>> 0) });
  }, 'obs-store');
  const traced = (label, picture) => {
    state.events = [];
    state.writes = [];
    state.phase = 'ok';
    press('ok');
    state.phase = 'off';
    const texts = textsOf();
    let file = null;
    try { file = shot(picture); } catch (e) { file = 'shot-error ' + e.message; }
    const chooser = state.events.some((e) => e.site === 'chooser-widgets' || e.site === 'open-tramp');
    emit('observe', {
      step: 'ok', label, profile: readByte(PROFILE), texts, file,
      parts: {
        rowRefresh: state.events.some((e) => e.part === 'row-refresh'),
        chooserConstruction: chooser,
        inputFocus: state.events.some((e) => e.part === 'input-focus'),
        commit: state.writes,
      },
      virtual: state.events.filter((e) => e.site === 'first-virtual' || e.site === 'virtual-return').slice(0, 4),
      decision: state.events.filter((e) => e.site === 'cmp-result-1' || e.site === 'editor-code').slice(0, 4),
    });
    return chooser;
  };
  emit('observe', { step: 'page', texts: textsOf(), file: shot('page'), rows: [bytes(0x6031e930, 4), bytes(0x6031e954, 4), bytes(ROW, 4)] });
  const stockOpened = traced('2154', '2154');
  press('menu'); idle(150); press('down'); press('down');
  const dupOpened = traced('e3-duplicate', 'open');
  if (dupOpened) { state.phase = 'ok'; press('menu'); state.phase = 'off'; emit('observe', { step: 'cancel', texts: textsOf(), profile: readByte(PROFILE), writes: state.writes }); }
  const storeAfter = { profile: readByte(PROFILE), k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)] };
  press('menu'); idle(200);
  let caf = findRow((t) => t.includes('C-AF Setting'));
  if (!caf.hit) { press('menu'); idle(300); caf = findRow((t) => t.includes('C-AF Setting')); }
  emit('observe', { step: 'caf-search', found: !!caf.hit, texts: caf.texts.slice(0, 6) });
  if (caf.hit) {
    walk.to([{ row: [caf.hit] }]);
    idle(200);
    for (let n = 0; n < 12; n++) {
      const scr = walk.read();
      const hits = scr.texts.filter((t) => t.text.includes('C-AF Area'));
      if (!hits.length) break;
      const hit = hits.reduce((a, b) => (a.text.length >= b.text.length ? a : b));
      const listed = walk.list(scr, hit);
      const want = listed.rows.indexOf(hit);
      if (listed.cursor === want) break;
      press(listed.cursor === null || listed.cursor < want ? 'down' : 'up');
    }
    traced('caf-area', 'caf');
    press('menu');
  }
  if (dupOpened) emit('observe', { step: 'registration', roleNote: 'comparison of 2154 and 0x3D6F; calls were before the value hooks', ...reg });
  emit('observe', { step: 'done', measured: true, ok: false, stockOpened, dupOpened, storeBefore, storeAfter, note: 'E3; ok is not acceptance' });
} catch (e) {
  emit('observe', { step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
