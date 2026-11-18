// T3c Phase A. EMULATOR-ONLY reference construction of page 28 or 29.
// The AF Button source record and the constructor page id are both pointed at the
// target page for this one session. Nothing is written to a firmware image.
// Usage: node26 work/scripts/route_page_a3.mjs om-emu 28 work/out/page28-a3.jsonl
//        node26 work/scripts/route_page_a3.mjs om-emu 29 work/out/page29-a3.jsonl
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, pageArg, outPath] = process.argv.slice(2);
const pageId = Number(pageArg);
assert(checkout && (pageId === 28 || pageId === 29) && outPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadImage, loadBlock, loadNand, createHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { UIIN_ENTRIES, apply_uiin_layout, uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');

const SRC = { 28: { ptr: 0x61529816, count: 3 }, 29: { ptr: 0x6152981c, count: 3 } };
const lines = [];
const emit = (x) => { const row = { hook: 'EMULATOR-ONLY reference construction', pageId, ...x }; lines.push(JSON.stringify(row)); console.log(JSON.stringify(row)); };
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);
const fw = { rom: loadImage(), resBlock: loadBlock() };
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
  { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} } } },
);
pl.camapp_components = true;
pl.camapp_native_tra = true;
const state = { phase: 'off', events: [], replaced: 0 };

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const u16 = (addr) => { const b = l.sim.read(addr, 2); return b[0] | (b[1] << 8); };
  const u32 = (addr) => l.sim.u32(addr) >>> 0;
  const write32 = (addr, value) => { const b = Buffer.alloc(4); b.writeUInt32LE(value >>> 0, 0); l.sim.write(addr, b); };
  const readKey = (key, index) => l.call(native(0x60063380), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 >>> 0;
  const homeIds = [165, 238, 517, 1692, 1693, 1694, 1695, 1713, 2273, 2274, 2275, 2276, 2277, 2278, 2279];
  const cells = () => ({
    homeArea: [0, 1, 2].map((i) => readKey(0x9fa1, i)),
    home: [0, 1, 2].map((i) => readKey(0x99d2, i)),
    homeSize: readKey(0xdfa1, 0),
    homeFlag: readKey(0x1ea1, 0),
    zone: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => readKey(0x99a1, i)),
    size: readKey(0x9a41, 0),
    position: [0, 1, 2, 3, 4, 5].map((i) => readKey(0x5962, i)),
    custom: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => readKey(0x1dd1, i)),
    ui: Object.fromEntries(homeIds.map((id) => [id, s.get(id)])),
  });
  const before = cells();
  const stockPtr = u32(0x61529cec);
  const stockCount = u32(0x61529cf0);
  write32(0x61529cec, SRC[pageId].ptr);
  write32(0x61529cf0, SRC[pageId].count);
  emit({ step: 'source', label: 'EMULATOR-ONLY reference construction', stockPtr: hex(stockPtr), stockCount, ptr: hex(u32(0x61529cec)), count: u32(0x61529cf0) });
  emit({ step: 'before', cells: before });
  const builds = [];
  l.observe(native(0x61203696), (lab, r) => {
    const a1 = r.a1 >>> 0;
    const id = u16(a1 + 4);
    const rec = { saw: id, a1: hex(a1) };
    if (state.phase === 'build' && id === 27 && state.replaced === 0) {
      const b = Buffer.alloc(2); b.writeUInt16LE(pageId, 0); lab.sim.write(a1 + 4, b);
      state.replaced += 1;
      rec.wrote = pageId;
      rec.label = 'EMULATOR-ONLY reference construction';
    }
    builds.push(rec);
  }, 'obs-ctor');
  const note = (addr, name) => {
    l.observe(native(addr), (lab, r) => {
      if (state.phase !== 'ok' || state.events.length >= 12) return;
      const rec = { ev: name, d0: r.d0 >>> 0, a0: hex(r.a0 >>> 0), a2: hex(r.a2 >>> 0), mdr: hex(r.mdr >>> 0) };
      if (name === 'list-type') {
        const p58 = lab.sim.u32(r.a0 + 0x58) >>> 0;
        rec.p58 = hex(p58);
        rec.kind = p58 > 0x1000 ? lab.sim.u32(p58 + 0x5c) >>> 0 : null;
      }
      state.events.push(rec);
      const ra = r.mdr >>> 0;
      if (ra > 0x1000 && !lab.hooks.has(ra)) lab.hook_rt(ra, (h, rr) => { rec.ret = rr.d0 & 0xffff; lab.hooks.delete(ra); lab.passthrough(rr); }, 'obs-ret-' + name, true);
    }, 'obs-' + name);
  };
  note(0x61203470, 'list-type');
  note(0x6120345d, 'editor-kind');
  note(0x61203e81, 'multi-open');
  note(0x610cdf05, 'editor-open');
  note(0x611f708f, 'action');
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(500); };
  idle(1200);
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 40 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return ['read-error']; } };
  const shot = (file) => { const frame = walk.read().frame; write_png(file, frame[0], frame[1], words_to_rgb(frame[2])); emit({ step: 'screenshot', file }); };
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
  state.phase = 'build';
  walk.to([{ row: [menuRow] }]);
  state.phase = 'nav';
  idle(400);
  const stem = 'page' + pageId + '-a3';
  shot(resolve('work/out/' + stem + '-open.png'));
  emit({ step: 'built', texts: textsOf(), builds, replaced: state.replaced });
  state.events = [];
  state.phase = 'ok';
  press('ok');
  state.phase = 'off';
  shot(resolve('work/out/' + stem + '-ok.png'));
  emit({ step: 'ok', texts: textsOf(), events: state.events });
  const after = cells();
  const changed = {};
  for (const k of Object.keys(before)) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) changed[k] = { before: before[k], after: after[k] };
  }
  emit({ step: 'after', cells: after, changed });
  emit({ step: 'done', ok: false, measured: true, note: 'reference construction; ok is not acceptance' });
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
