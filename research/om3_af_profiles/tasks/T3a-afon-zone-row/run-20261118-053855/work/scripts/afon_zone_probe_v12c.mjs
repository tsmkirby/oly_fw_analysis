// T3a correction, item 1. Stock session, no overlay.
// Opens "Orientation Linked" on AF Target Settings, which is the menu row
// whose page should be the three-orientation zone page (page 28).
// Usage: node26 work/scripts/afon_zone_probe_v12c.mjs om-emu stock work/out/stock-page28-v12c.jsonl
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, mode, outPath] = process.argv.slice(2);
assert(checkout && mode === 'stock' && outPath);
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

const PAGE28 = 0x6158f10c;
const lines = [];
const emit = (x) => {
  const row = { mode, hook: 'observe', ...x };
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify(row));
};
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);
const state = { phase: 'boot' };

const fw = { rom: loadImage(), resBlock: loadBlock() };
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
  { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} } } },
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
  const calls = [];
  const watch = (addr, name) => {
    l.observe(native(addr), (lab, r) => {
      if (state.phase !== 'page' && state.phase !== 'ok') return;
      if (calls.length >= 30) return;
      const ra = r.mdr >>> 0;
      const a0 = r.a0 >>> 0;
      const p58 = lab.sim.u32(a0 + 0x58);
      const rec = {
        fn: name, phase: state.phase, a0: hex(a0), ra: hex(ra),
        kindA0: lab.sim.u32(a0 + 0x5c) >>> 0, plus58: hex(p58),
        kind58: p58 > 0x1000 ? lab.sim.u32(p58 + 0x5c) >>> 0 : null,
        vt58: p58 > 0x1000 ? hex(lab.sim.u32(p58)) : null,
      };
      calls.push(rec);
      if (ra > 0x1000 && !l.hooks.has(ra)) {
        l.hook_rt(ra, (h, rr) => { rec.d0 = rr.d0 & 0xffff; l.hooks.delete(ra); l.passthrough(rr); }, 'obs-ret-' + name, true);
      }
    }, 'obs-' + name);
  };
  watch(0x61203470, 'list-type');
  watch(0x6120345d, 'editor-kind');
  let pageDump = null;
  const pagesSeen = [];
  l.observe(native(0x61203a81), (lab, r) => {
    const viewer = r.a0 >>> 0;
    const page = lab.sim.u32(viewer + 0x13e8);
    if (!page) return;
    const id = lab.sim.u32(page) >>> 0;
    if (!pagesSeen.length || pagesSeen.at(-1).page !== page) {
      if (pagesSeen.length < 20) pagesSeen.push({ phase: state.phase, page: hex(page), id });
    }
    if (page !== PAGE28 || pageDump) return;
    const model = lab.sim.u32(viewer + 0x13e0);
    const typeObj = model ? lab.sim.u32(model + 0x58) : 0;
    pageDump = {
      viewer: hex(viewer), page: hex(page), id, model: hex(model),
      typeObj: hex(typeObj),
      typeKind: typeObj ? lab.sim.u32(typeObj + 0x5c) >>> 0 : null,
      typeVt: typeObj ? hex(lab.sim.u32(typeObj)) : null,
      typeHead: typeObj ? Array.from(lab.sim.read(typeObj, 32)) : null,
    };
  }, 'obs-page');
  l.observe(native(0x61203e81), (lab, r) => {
    calls.push({ fn: 'open-path', phase: state.phase, a0: hex(r.a0 >>> 0) });
  }, 'obs-open');
  const hits = new Set();
  let traced = 0;
  const armTrace = () => {
    const tsv = readFileSync(resolve('ref/analysis/decompiled-main/functions.tsv'), 'utf8');
    for (const line of tsv.split(/\r?\n/).slice(1)) {
      if (!line) continue;
      const addr = parseInt(line.split('\t')[0], 16);
      const inBand = (addr >= 0x610e0000 && addr < 0x610f0000) || (addr >= 0x61203000 && addr < 0x61205000);
      if (!inBand || l.hooks.has(addr)) continue;
      traced += 1;
      l.observe(native(addr), () => { if (state.phase === 'ok') hits.add(addr); }, 'obs-ed-' + addr.toString(16));
    }
  };
  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(500); };
  idle(1500);
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 40 });
  const textsOf = () => {
    try { return walk.read().texts.map((t) => t.text); }
    catch (e) { return []; }
  };
  const seen = new Set();
  let item = null;
  for (let tab = 0; tab < 48 && !item; tab++) {
    const texts = textsOf();
    const sig = texts.join('\n');
    if (seen.has(sig)) break;
    seen.add(sig);
    item = texts.find((t) => t.includes('Orientation Linked'));
    if (!item) press('left');
  }
  if (!item) {
    emit({ step: 'done', ok: false, reason: 'Orientation Linked not visible' });
  } else {
    emit({ step: 'menu-hit', text: item });
    state.phase = 'page';
    walk.to([{ row: [item] }]);
    idle(400);
    const pageTexts = textsOf();
    let frame = null;
    try { frame = walk.read().frame; } catch (e) { emit({ step: 'frame-unread', error: String(e.message) }); }
    emit({ step: 'opened', texts: pageTexts, pagesSeen, pageDump });
    if (frame) shot(resolve('work/out/stock-page28-v12c.png'), frame);
    const onPage28 = Boolean(pageDump && pageDump.page === hex(PAGE28));
    const row = pageTexts.find((t) => t.includes('AF Target Mode') && !t.includes('Settings') && t !== item)
      || pageTexts.find((t) => t.includes('@A040@'));
    emit({ step: 'zone-row', text: row ?? null, onPage28, pageDump });
    if (onPage28 || row) {
      armTrace();
      state.phase = 'ok';
      if (row) walk.to([{ row: [row] }]);
      else press('ok');
      idle(500);
      const chooserTexts = textsOf();
      let chooser = null;
      try { chooser = walk.read().frame; } catch (e) { /* image-only chooser still screenshots below if frame exists */ }
      emit({ step: 'chooser', texts: chooserTexts, calls });
      if (chooser) shot(resolve('work/out/stock-chooser-v12c.png'), chooser);
      emit({ step: 'editor-trace', traced, entered: hits.size, addresses: [...hits].sort((a, b) => a - b).map(hex) });
    } else {
      emit({ step: 'not-page28', calls, pagesSeen });
    }
    emit({ step: 'done', ok: onPage28, onPage28, measured: true, pageDump, pagesSeen });
  }
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
