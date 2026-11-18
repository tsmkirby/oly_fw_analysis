// E4. Stated explanation: E3's exact copy of row 2154 was not shown, and OK still
// returned 1, because the provider id list's third entry stayed 0x3D6F.
// Baseline: that E3 row copy. One change: the third provider id becomes 2154.
// Usage: node26 work/scripts/exp_e4_c1.mjs om-emu work/out/exp-e4-c1.jsonl
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
const ID_LIST = 0x6031e928;
const lines = [];
const emit = (role, x) => {
  const row = { hook: role === 'behaviour' ? 'EMULATOR-ONLY' : 'observe', role, ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => (v === null || v === undefined) ? null : '0x' + (v >>> 0).toString(16);
const ranges = [];
for (const line of readFileSync(resolve('ref/analysis/decompiled-main/functions.tsv'), 'utf8').split(/\r?\n/).slice(1)) {
  if (!line) continue;
  const [a, name] = line.split('\t');
  ranges.push([parseInt(a, 16), name]);
}
const fnOf = (addr) => {
  if (addr === null || addr === undefined) return null;
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
  const pageBuf = Buffer.alloc(8); pageBuf.writeUInt32LE(0x6031e930, 0); pageBuf.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, pageBuf);
  const src = Buffer.alloc(8); src.writeUInt32LE(ID_LIST, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  const desc = 0x6031e9a0, bucketFor = (id) => 0x62a84970 + (id & 0x7f) * 4;
  const head = l.sim.u32(bucketFor(UI));
  const nodeBytes = Buffer.alloc(8); nodeBytes.writeUInt32LE(desc, 0); nodeBytes.writeUInt32LE(head, 4); l.sim.write(0x6031e9b8, nodeBytes);
  const headBytes = Buffer.alloc(4); headBytes.writeUInt32LE(0x6031e9b8, 0); l.sim.write(bucketFor(UI), headBytes);
  const reg = {
    lookup2154: lookup(2154), lookup3d6f: lookup(UI),
    mapped2154: l.call(native(0x60419446), { d0: 2154 }, null, null, 200000).d0 & 0xffff,
    mapped3d6f: l.call(native(0x60419446), { d0: UI }, null, null, 200000).d0 & 0xffff,
    index2154: l.call(native(0x60419696), { d0: 2154 }, null, null, 200000).d0 & 0xffff,
    index3d6f: l.call(native(0x60419696), { d0: UI }, null, null, 200000).d0 & 0xffff,
    desc2154: bytes(0x6062132c, 20), desc3d6f: bytes(desc, 20),
  };
  const own = (r) => (r.d0 & 0xffff) === UI;
  l.hook(native(0x6041931e), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: readByte(PROFILE) }); }, 'EMULATOR-ONLY afon value getter');
  l.hook(native(0x6041937f), (h, r) => {
    const id = r.d0 & 0xffff, value = r.d1 & 0xffff;
    if (state.phase === 'ok' && state.writes.length < 40) state.writes.push({ part: 'commit', fn: 'FUN_6041937f', id, value, behaviour: id === UI });
    if (!own(r)) { l.passthrough(r); return; }
    writeByte(PROFILE, value); writeByte(PROFILE_CACHED, value); h.finish(r, { d0: 0 });
  }, 'EMULATOR-ONLY afon setter');
  l.hook(native(0x60419446), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0xA70F }); }, 'EMULATOR-ONLY afon mapped getter');
  l.hook(native(0x60419696), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon index getter');
  const stock = Buffer.from(l.sim.read(STOCK, 36));
  l.sim.write(ROW, stock);
  const idBefore = Buffer.from(l.sim.read(ID_LIST, 8));
  const idNext = Buffer.from(idBefore);
  idNext.writeUInt16LE(2154, 4);
  l.sim.write(ID_LIST, idNext);
  emit('behaviour', {
    step: 'e4-provider', label: 'EMULATOR-ONLY runtime write',
    explanation: 'E3 copied the row and left the provider id at 0x3D6F; the third row was not shown and OK returned 1. E4 changes only that provider id to 2154.',
    baselineRow: stock.toString('hex'),
    idBefore: idBefore.toString('hex'), idAfter: Buffer.from(l.sim.read(ID_LIST, 8)).toString('hex'),
  });
  const storeBefore = { profile: readByte(PROFILE), k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)] };
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return ['read-error ' + e.message]; } };
  const shot = (name) => {
    const frame = walk.read().frame;
    const file = resolve('work/out/exp-e4-c1-' + name + '.png');
    write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
    return file;
  };
  const push = (rec) => { if (state.phase === 'ok' && state.events.length < 48) state.events.push(rec); };
  const site = (addr, name, part, extra) => {
    l.observe(native(addr), (lab, r) => {
      const rec = { part, site: name, d0: r.d0 >>> 0, d2: r.d2 >>> 0, a0: hex(r.a0 >>> 0), a1: hex(r.a1 >>> 0), a1Name: fnOf(r.a1 >>> 0) };
      if (extra) Object.assign(rec, extra(r));
      push(rec);
    }, 'obs-' + name);
  };
  site(0x6124f7be, 'first-virtual', 'dispatch', (r) => {
    const vt = word(r.a0);
    const method = vt === null ? null : word((vt + 0x68) >>> 0);
    return { vt: hex(vt), method68: hex(method), method68Name: fnOf(method) };
  });
  site(0x6124f7c0, 'virtual-return', 'dispatch', () => ({}));
  site(0x6124f7d4, 'cmp-result-1', 'dispatch', (r) => ({ childVt: hex(word(word(r.a3) ?? 0) ?? 0) }));
  site(0x6127e750, 'open-tramp', 'chooser-construction', () => ({}));
  site(0x610e2536, 'chooser-widgets', 'chooser-construction', () => ({}));
  site(0x610cdfe9, 'after-focus-call', 'input-focus', () => ({}));
  site(0x61203816, 'page-walk', 'row-refresh', () => ({}));
  l.observe(native(0x60063431), (lab, r) => {
    if (state.phase !== 'ok' || state.writes.length >= 40) return;
    state.writes.push({ part: 'commit', fn: 'FUN_60063431', d0: r.d0 >>> 0, d1: r.d1 >>> 0, a0: hex(r.a0 >>> 0) });
  }, 'obs-store');
  const traced = (label, picture) => {
    state.events = []; state.writes = []; state.phase = 'ok';
    press('ok');
    state.phase = 'off';
    const texts = textsOf();
    let file = null;
    try { file = shot(picture); } catch (e) { file = 'shot-error ' + e.message; }
    const chooser = state.events.some((e) => e.site === 'chooser-widgets' || e.site === 'open-tramp');
    emit('observe', {
      step: 'ok', label, texts, file, profile: readByte(PROFILE),
      parts: {
        rowRefresh: state.events.some((e) => e.part === 'row-refresh'),
        chooserConstruction: chooser,
        inputFocus: state.events.some((e) => e.part === 'input-focus'),
        commit: state.writes,
      },
      virtual: state.events.filter((e) => e.site === 'first-virtual' || e.site === 'virtual-return').slice(0, 4),
      decision: state.events.filter((e) => e.site === 'cmp-result-1').slice(0, 2),
    });
    return chooser;
  };
  idle(1200); press('menu');
  const seen = new Set();
  let menuRow = null;
  for (let n = 0; n < 24 && !menuRow; n++) {
    const texts = textsOf();
    menuRow = texts.find((t) => t.endsWith('AF Button'));
    if (menuRow) break;
    const sig = texts.join('\n');
    if (seen.has(sig)) break;
    seen.add(sig);
    press('left');
  }
  assert.ok(menuRow, 'AF Button missing');
  walk.to([{ row: [menuRow] }]);
  idle(200);
  emit('observe', { step: 'page', texts: textsOf(), file: shot('page') });
  press('down'); press('down');
  const opened = traced('e4', 'open');
  if (opened) { press('menu'); idle(150); }
  const storeAfter = { profile: readByte(PROFILE), k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)] };
  emit('observe', { step: 'registration', note: 'native calls ran before the value hooks', ...reg });
  emit('observe', { step: 'done', measured: true, ok: false, opened, storeBefore, storeAfter, note: 'E4; ok is not acceptance' });
} catch (e) {
  emit('observe', { step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
