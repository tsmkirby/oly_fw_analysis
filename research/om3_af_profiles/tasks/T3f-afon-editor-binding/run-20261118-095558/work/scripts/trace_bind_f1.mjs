// role: observe. X1 row, then log CPU reads of the 24-byte editor table while OK runs.
// Usage: node26 work/scripts/trace_bind_f1.mjs om-emu work/out/trace-bind-f1.jsonl
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

const UI = 0x3d6f;
const BASE = 0x60021020;
const TABLE = 0x615c59f4;
const TABLE_BYTES = 47 * 24;
const REC_1E3 = 0x615c5e14;
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
const native = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
const hex = (v) => (v === null || v === undefined) ? null : '0x' + (v >>> 0).toString(16);

const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
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
const tableBytes = Buffer.concat([stockTable, third]);
for (let i = 0; i < 72; i++) {
  const off = (TABLE_RAM - BASE) + i;
  if (image[off] !== 0xff) throw new Error('table slot is not FF at ' + hex(BASE + off));
  byOff.set(off, { old: 0xff, neu: tableBytes[i] });
}
const ordered = [...byOff.entries()].sort((a, b) => a[0] - b[0]);
const patches = [];
for (const [off, { old, neu }] of ordered) {
  if (image[off] !== old) throw new Error('overlay old mismatch at ' + hex(BASE + off));
  const last = patches.at(-1);
  if (last && off === last.offset + last.old.length) { last.old.push(old); last.neu.push(neu); }
  else patches.push({ offset: off, old: [old], neu: [neu] });
}
const fw = patchedFirmware(patches.map((x, n) => ({
  block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: 'work/scripts/trace_bind_f1.mjs', n,
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

const hits = [];
const byPc = new Map();
let dropped = 0;
const CAP = 4000;
const state = { phase: 'off', group: 'boot' };
const note = (rec) => {
  const pc = rec.pc >>> 0;
  const prev = byPc.get(pc) ?? { pc: hex(pc), n: 0, groups: {}, addrs: {}, values: {} };
  prev.n += 1;
  prev.groups[state.group] = (prev.groups[state.group] ?? 0) + 1;
  const addr = hex(rec.addr >>> 0);
  prev.addrs[addr] = (prev.addrs[addr] ?? 0) + 1;
  const rel = (rec.addr >>> 0) - REC_1E3;
  if (rec.addr >>> 0 >= REC_1E3 && rec.addr >>> 0 < REC_1E3 + 24) prev.rel1e3 = rel;
  const val = hex(rec.value >>> 0);
  if (Object.keys(prev.values).length < 8) prev.values[val] = (prev.values[val] ?? 0) + 1;
  byPc.set(pc, prev);
  if (state.phase !== 'on') return;
  if (hits.length >= CAP) { dropped += 1; return; }
  hits.push({ group: state.group, pc: hex(pc), addr: addr, size: rec.size, dir: rec.dir, value: val });
};

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const readByte = (addr) => l.sim.read(addr, 1)[0];
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const writeU32 = (addr, value) => { const b = Buffer.alloc(4); b.writeUInt32LE(value >>> 0, 0); l.sim.write(addr, b); };
  const writeU16 = (addr, value) => { const b = Buffer.alloc(2); b.writeUInt16LE(value & 0xffff, 0); l.sim.write(addr, b); };
  const bytes = (addr, n) => Buffer.from(l.sim.read(addr, n)).toString('hex');
  emit('behaviour', {
    step: 'overlay',
    label: 'EMULATOR-ONLY X1 action table, so 0x3D6F reaches the same OK path as 2154',
    third: tableBytes.subarray(48, 72).toString('hex'),
  });
  const own = (r) => (r.d0 & 0xffff) === UI;
  l.hook(native(0x6041931e), (h, r) => {
    if (!own(r)) { l.passthrough(r); return; }
    h.finish(r, { d0: readByte(0xa031e920) });
  }, 'EMULATOR-ONLY afon value getter');
  l.hook(native(0x6041937f), (h, r) => {
    if (state.phase === 'on') emit('observe', { step: 'setter', group: state.group, id: r.d0 & 0xffff, value: r.d1 & 0xffff, caller: hex(r.mdr >>> 0) });
    if (!own(r)) { l.passthrough(r); return; }
    writeByte(0xa031e920, r.d1 & 0xff);
    writeByte(0x6031e920, r.d1 & 0xff);
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
  const slot = [];
  l.observe(native(0x611a01e8), (lab, r) => {
    if (state.phase !== 'on' || slot.length >= 40) return;
    let half = null;
    try { half = lab.sim.read((r.a0 >>> 0) + 0x54, 2); } catch { half = null; }
    slot.push({
      group: state.group, d0: r.d0 & 0xffff, d1: r.d1 & 0xffff, a0: hex(r.a0 >>> 0),
      half54: half ? (half[0] | (half[1] << 8)) : null, caller: hex(r.mdr >>> 0),
    });
  }, 'obs-slot4');
  const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  writeU32(TABLE_PTR, TABLE_RAM);
  writeU32(TABLE_PTR + 4, 3);
  emit('behaviour', { step: 'redirects', label: 'EMULATOR-ONLY section-7 pointer writes', action: bytes(TABLE_PTR, 8) });
  l.sim.m.setWatchpoints([{ id: 'bind', lo: TABLE, hi: TABLE + TABLE_BYTES, kind: 1, stop: false }], { onLog: note });
  emit('observe', { step: 'watch', label: 'logging read watch of the 47-record table', lo: hex(TABLE), hi: hex(TABLE + TABLE_BYTES) });
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, 'down' === d ? 'down' : d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const screen = () => {
    try {
      const scr = walk.read();
      return { texts: scr.texts.map((t) => t.text) };
    } catch (e) {
      return { texts: [], error: String(e && e.message ? e.message : e) };
    }
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
    state.phase = 'on';
    state.group = tag;
    const before = hits.length;
    press('ok');
    const afterOpen = hits.length;
    press('menu');
    state.phase = 'off';
    emit('observe', { step: tag, readsDuringOk: afterOpen - before, readsThroughCancel: hits.length - before, texts: screen().texts.slice(0, 12) });
  };
  openCancel('2154');
  press('down');
  openCancel('2155');
  press('down');
  openCancel('3d6f');
  const pcs = [...byPc.values()].sort((a, b) => b.n - a.n);
  emit('observe', {
    step: 'summary',
    kept: hits.length,
    dropped,
    cappedAt: CAP,
    uniquePcs: pcs.length,
    pcs: pcs.slice(0, 30),
    slot4: slot,
  });
} catch (e) {
  emit('observe', { step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  try { if (pl.session) pl.session.lab.sim.m.setWatchpoints([]); } catch { /* session already closed */ }
  if (pl.session) pl.close_session();
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(outPath, lines.join('\n') + (lines.length ? '\n' : ''));
}
