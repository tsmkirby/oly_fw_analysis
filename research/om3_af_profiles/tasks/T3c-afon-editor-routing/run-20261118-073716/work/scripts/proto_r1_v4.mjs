// T3c Phase B v4. Kind 12, alt cleared, descriptor template pointer copied from UI 2154, count 10.
// The option pointer stays 0x6158ba1c, count 10. EMULATOR-ONLY value hooks unchanged.
// Usage: node26 work/scripts/proto_r1_v4.mjs om-emu work/out/proto-r1-v1.jsonl
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
const KIND_ADDR = 0x6031e97c;
const PAGE27 = 0x6158f0f8;
const SOURCE = 0x61529ce8;
const lines = [];
const emit = (x) => { const row = { hook: 'EMULATOR-ONLY', ...x }; lines.push(JSON.stringify(row)); console.log(JSON.stringify(row)); };
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);
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
const state = { set: [] };

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const own = (r) => (r.d0 & 0xffff) === UI;
  l.hook(native(0x6041931e), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: l.sim.read(PROFILE, 1)[0] }); }, 'EMULATOR-ONLY afon value getter');
  l.hook(native(0x6041937f), (h, r) => { if (!own(r)) { l.passthrough(r); return; } writeByte(PROFILE, r.d1); writeByte(PROFILE_CACHED, r.d1); state.set.push(r.d1 & 0xff); h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon setter');
  l.hook(native(0x60419446), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0xA70F }); }, 'EMULATOR-ONLY afon mapped getter');
  l.hook(native(0x60419696), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon index getter');
  const desc = 0x6031e9a0, node = 0x6031e9b8, bucket = 0x62a84970 + (UI & 0x7f) * 4;
  const head = l.sim.u32(bucket);
  const nodeBytes = Buffer.alloc(8); nodeBytes.writeUInt32LE(desc, 0); nodeBytes.writeUInt32LE(head, 4); l.sim.write(node, nodeBytes);
  const headBytes = Buffer.alloc(4); headBytes.writeUInt32LE(node, 0); l.sim.write(bucket, headBytes);
  const lookup = l.call(native(0x604058bc), { d0: UI }, null, null, 200000).d0 >>> 0;
  emit({ step: 'link', label: 'EMULATOR-ONLY descriptor link', bucket: hex(bucket), head: hex(head), lookup: hex(lookup) });
  const beforeKind = l.sim.read(KIND_ADDR, 1)[0];
  writeByte(KIND_ADDR, 0x0c);
  const z = Buffer.alloc(8);
  l.sim.write(0x6031e994, z);
  l.sim.write(0x6031e9a0, Buffer.from([111,61,128,0,183,144,97,96,0,0,0,0,10,0,1,0,0,1,0,0]));
  emit({ step: 'kind', addr: '0x6031e97c', before: beforeKind, after: l.sim.read(KIND_ADDR, 1)[0], alt: [...l.sim.read(0x6031e994, 8)], note: 'kind 12 and alt pointer cleared' });
  const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return []; } };
  const shot = (name) => { const frame = walk.read().frame; const file = resolve('work/out/proto-r1-v4-' + name + '.png'); write_png(file, frame[0], frame[1], words_to_rgb(frame[2])); return file; };
  idle(1200);
  press('menu');
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
  press('down');
  press('down');
  const pageFile = shot('page');
  emit({ step: 'page', texts: textsOf(), file: pageFile, profile: l.sim.read(PROFILE, 1)[0] });
  state.set = [];
  press('ok');
  const openFile = shot('open');
  const openTexts = textsOf();
  emit({ step: 'open', texts: openTexts, file: openFile, setter: [...state.set], profile: l.sim.read(PROFILE, 1)[0] });
  const opened = !openTexts.some((t) => t.endsWith('AF Button'));
  if (!opened) {
    emit({ step: 'done', ok: false, opened: false, note: 'kind 12 did not leave the page' });
  } else {
    press('menu');
    const cancelFile = shot('cancel');
    emit({ step: 'cancel', texts: textsOf(), file: cancelFile, setter: [...state.set], profile: l.sim.read(PROFILE, 1)[0] });
    state.set = [];
    press('ok');
    press('down');
    press('ok');
    const confirmFile = shot('confirm');
    emit({ step: 'confirm', texts: textsOf(), file: confirmFile, setter: [...state.set], profile: l.sim.read(PROFILE, 1)[0] });
    emit({ step: 'done', ok: false, opened: true, measured: true });
  }
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
