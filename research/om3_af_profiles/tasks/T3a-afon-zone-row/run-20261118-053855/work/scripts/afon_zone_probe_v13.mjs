// T3a item 2, experiment 1 of 4. Reuses the confirmed overlay, UI id 0x3D6F,
// and the EMULATOR-ONLY value hooks. Live multi-row pages return list type 1,
// so this does not claim type 2 is page 28's path. It only asks which of the
// still-untried accepted kinds (0, 3, 5) on the row+0x1c branch draws the
// 10-record list. Kinds 1, 4 and 7 were already tried.
// Usage: node26 work/scripts/afon_zone_probe_v13.mjs om-emu discover work/out/discover-v13.jsonl
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, mode, outPath] = process.argv.slice(2);
assert(checkout && mode === 'discover' && outPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadImage, loadBlock, loadNand, patchedFirmware, createHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE, A } = await use('src/fw/model.mjs');
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
const ROW_ARRAY = 0x6031e930;
const ID_LIST = 0x6031e928;
const lines = [];
const emit = (x) => { const row = { mode, hook: 'EMULATOR-ONLY', ...x }; lines.push(JSON.stringify(row)); console.log(JSON.stringify(row)); };
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);
const ctrl = { forceType: false, kind: 0, matched: 0 };

const diff = resolve('work/out/overlay-changed-bytes.csv');
const rows = readFileSync(diff, 'utf8').trim().split(/\r?\n/).slice(1);
const patches = [];
for (const row of rows) {
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
const shot = (file, frame) => { write_png(file, frame[0], frame[1], words_to_rgb(frame[2])); emit({ step: 'screenshot', file }); };

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const readByte = (addr) => l.sim.read(addr, 1)[0];
  const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
  const own = (r) => (r.d0 & 0xffff) === UI;
  l.hook(native(0x6041931e), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: readByte(PROFILE) }); }, 'EMULATOR-ONLY afon value getter');
  l.hook(native(0x6041937f), (h, r) => {
    if (!own(r)) { l.passthrough(r); return; }
    writeByte(PROFILE, r.d1 & 0xff); writeByte(PROFILE_CACHED, r.d1 & 0xff);
    emit({ step: 'setter', value: r.d1 & 0xff, kind: ctrl.kind });
    h.finish(r, { d0: 0 });
  }, 'EMULATOR-ONLY afon setter');
  l.hook(native(0x60419446), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0xA70F }); }, 'EMULATOR-ONLY afon mapped getter');
  l.hook(native(0x60419696), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon index getter');
  // EMULATOR-ONLY. Not a claim about page 28. Forces the branch that reads row+0x1c.
  l.hook(native(0x61203470), (h, r) => { if (!ctrl.forceType) { l.passthrough(r); return; } h.finish(r, { d0: 2 }); }, 'EMULATOR-ONLY list type experiment');
  l.hook(native(0x6120345d), (h, r) => {
    if (ctrl.forceType && (ctrl.matched & 0xffff) === UI) { h.finish(r, { d0: ctrl.kind }); return; }
    l.passthrough(r);
  }, 'EMULATOR-ONLY editor kind experiment');
  const events = [];
  l.observe(native(0x61203f50), (lab, r) => { ctrl.matched = r.d0 >>> 0; events.push({ ev: 'match', d0: ctrl.matched, kind: ctrl.kind }); }, 'obs-match');
  for (const [addr, name] of [[0x61203f61, 'noalt'], [0x61204033, 'reject'], [0x61204050, 'widget']]) {
    l.observe(native(addr), (lab, r) => { events.push({ ev: name, d0: r.d0 >>> 0, kind: ctrl.kind }); }, 'obs-' + name);
  }
  const page = Buffer.alloc(8); page.writeUInt32LE(ROW_ARRAY, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
  const src = Buffer.alloc(8); src.writeUInt32LE(ID_LIST, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
  const desc = 0x6031e9a0, node = 0x6031e9b8, bucket = 0x62a84970 + (UI & 0x7f) * 4;
  const head = l.sim.u32(bucket);
  const nodeBytes = Buffer.alloc(8); nodeBytes.writeUInt32LE(desc, 0); nodeBytes.writeUInt32LE(head, 4); l.sim.write(node, nodeBytes);
  const headBytes = Buffer.alloc(4); headBytes.writeUInt32LE(node, 0); l.sim.write(bucket, headBytes);
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(500); };
  idle(1500);
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 40 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return []; } };
  const frameOf = () => { try { return walk.read().frame; } catch (e) { return null; } };
  const seen = new Set();
  let menuRow = null;
  for (let n = 0; n < 48 && !menuRow; n++) {
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
  press('down'); press('down');
  const onRow = textsOf();
  emit({ step: 'on-row', texts: onRow, profile: readByte(PROFILE) });
  const fr0 = frameOf();
  if (fr0) shot(resolve('work/out/afon-page-v13.png'), fr0);
  for (const kind of [0, 3, 5]) {
    ctrl.kind = kind;
    ctrl.matched = 0;
    ctrl.forceType = true;
    const before = events.length;
    press('ok');
    ctrl.forceType = false;
    const texts = textsOf();
    const fr = frameOf();
    emit({ step: 'kind-try', kind, texts, profile: readByte(PROFILE), events: events.slice(before) });
    if (fr) shot(resolve('work/out/afon-kind' + kind + '-v13.png'), fr);
    press('menu');
    idle(200);
  }
  emit({ step: 'done', ok: false, profile: readByte(PROFILE), note: 'screenshots decide whether any kind drew the zone list; ok is not acceptance' });
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
