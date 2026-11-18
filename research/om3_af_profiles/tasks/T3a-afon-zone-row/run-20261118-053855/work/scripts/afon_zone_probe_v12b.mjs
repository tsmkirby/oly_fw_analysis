// T3a correction, item 1 continued. Stock session, no overlay.
// A left-only menu census, then open the page whose row text ends in
// "AF Target Mode" (not "AF Target Mode Settings"). Observers only.
// Usage: node26 work/scripts/afon_zone_probe_v12b.mjs om-emu stock work/out/stock-page28-v12b.jsonl
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, mode, outPath] = process.argv.slice(2);
assert(checkout && mode === 'stock' && outPath);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadImage, loadBlock, loadNand, createHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE, A } = await use('src/fw/model.mjs');
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

const zoneRow = (t) => t.endsWith('AF Target Mode') && !t.includes('Settings');

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const calls = [];
  const watch = (addr, name) => {
    l.observe(native(addr), (lab, r) => {
      if (state.phase !== 'page' && state.phase !== 'ok') return;
      if (calls.length >= 40) return;
      const ra = r.mdr >>> 0;
      const a0 = r.a0 >>> 0;
      const rec = { step: 'call', fn: name, at: hex(addr), phase: state.phase, a0: hex(a0), ra: hex(ra) };
      const p58 = lab.sim.u32(a0 + 0x58);
      rec.kindA0 = lab.sim.u32(a0 + 0x5c) >>> 0;
      rec.plus58 = hex(p58);
      if (p58 > 0x1000) {
        rec.kind58 = lab.sim.u32(p58 + 0x5c) >>> 0;
        rec.vt58 = hex(lab.sim.u32(p58));
      }
      calls.push(rec);
      if (ra > 0x1000 && !l.hooks.has(ra)) {
        l.hook_rt(ra, (h, rr) => {
          rec.d0 = rr.d0 & 0xffff;
          l.hooks.delete(ra);
          l.passthrough(rr);
        }, 'obs-ret-' + name, true);
      }
    }, 'obs-' + name);
  };
  watch(0x61203470, 'list-type');
  watch(0x6120345d, 'editor-kind');
  const pagesSeen = [];
  let pageDump = null;
  l.observe(native(0x61203a81), (lab, r) => {
    const viewer = r.a0 >>> 0;
    const page = lab.sim.u32(viewer + 0x13e8);
    if (!page) return;
    const id = lab.sim.u32(page) >>> 0;
    const last = pagesSeen.at(-1);
    if (!last || last.page !== page) {
      if (pagesSeen.length < 30) pagesSeen.push({ phase: state.phase, page: hex(page), id });
    }
    if (page !== PAGE28 || pageDump) return;
    const model = lab.sim.u32(viewer + 0x13e0);
    const typeObj = model ? lab.sim.u32(model + 0x58) : 0;
    const list = model ? lab.sim.u32(model + 0x2c) : 0;
    const count = model ? lab.sim.u32(model + 0x30) >>> 0 : 0;
    pageDump = {
      viewer: hex(viewer), page: hex(page), id,
      model: hex(model),
      typeObj: hex(typeObj),
      typeKind: typeObj ? lab.sim.u32(typeObj + 0x5c) >>> 0 : null,
      typeVt: typeObj ? hex(lab.sim.u32(typeObj)) : null,
      typeBytes: typeObj ? Array.from(lab.sim.read(typeObj, 96)) : null,
      list: hex(list), count,
      records: list ? Array.from({ length: Math.min(count, 4) }, (_, i) => {
        const raw = Buffer.from(lab.sim.read(list + i * 8, 8));
        const obj = raw.readUInt32LE(4);
        return { a: raw.readUInt16LE(0), b: raw.readUInt16LE(2), obj: hex(obj), kind: obj ? lab.sim.u32(obj + 0x5c) >>> 0 : null };
      }) : [],
    };
  }, 'obs-page');
  l.observe(native(0x61203e81), () => {
    if (calls.length < 40) calls.push({ step: 'call', fn: 'open-path', at: '0x61203e81', phase: state.phase });
  }, 'obs-open-path');
  const copies = [];
  l.observe(native(0x611c782f), (lab, r) => {
    if (state.phase !== 'page' && state.phase !== 'ok') return;
    if (copies.length >= 40) return;
    const src = r.a1 >>> 0;
    const raw = Buffer.from(lab.sim.read(src, 8));
    copies.push({ src: hex(src), kind: raw.readUInt16LE(0), id: raw.readUInt16LE(2), phase: state.phase });
  }, 'obs-desc-copy');
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
  const key = (k, d) => { const rec = s.key(k, d); s.camapp.pump(); return rec; };
  const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(550); };
  idle(1500);
  state.phase = 'nav';
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 60 });
  const readTexts = () => {
    try { return walk.read().texts.map((t) => t.text); }
    catch (e) { return { error: String(e && e.message ? e.message : e) }; }
  };
  const seen = new Set();
  const census = [];
  for (let tab = 0; tab < 48; tab++) {
    const texts = readTexts();
    if (texts.error) { emit({ step: 'census-read', tab, error: texts.error }); break; }
    const sig = texts.join('\n');
    if (seen.has(sig)) { emit({ step: 'census-wrap', tab }); break; }
    seen.add(sig);
    census.push(texts);
    emit({ step: 'tab', tab, texts });
    press('left');
  }
  const ranked = [];
  census.forEach((texts, tab) => {
    for (const t of texts) {
      if (zoneRow(t)) ranked.push({ tab, text: t, why: 'ends-with-AF-Target-Mode' });
      else if (t.includes('Set Home')) ranked.push({ tab, text: t, why: 'set-home' });
      else if (t.includes('Orientation Linked')) ranked.push({ tab, text: t, why: 'orientation' });
    }
  });
  emit({ step: 'candidates', ranked });
  const choice = ranked.find((r) => r.why === 'ends-with-AF-Target-Mode') || ranked.find((r) => r.why === 'set-home') || ranked[0];
  if (!choice) {
    emit({ step: 'done', ok: false, reason: 'no page-28 candidate in the left-only census', pagesSeen });
  } else {
    emit({ step: 'choice', ...choice });
    for (let n = 0; n < choice.tab; n++) press('left');
    state.phase = 'page';
    walk.to([{ row: [choice.text] }]);
    idle(400);
    const opened = readTexts();
    let frame = null;
    try { frame = walk.read().frame; } catch (e) { emit({ step: 'frame-unread', error: String(e && e.message ? e.message : e) }); }
    emit({ step: 'opened', texts: Array.isArray(opened) ? opened : opened, pagesSeen, pageDump });
    if (frame) shot(resolve('work/out/stock-page28-v12b.png'), frame);
    const texts = Array.isArray(opened) ? opened : [];
    const row = texts.find((t) => zoneRow(t) && t !== choice.text) || texts.find((t) => t.includes('@A040@'));
    const onPage28 = pageDump && pageDump.page === hex(PAGE28);
    emit({ step: 'zone-row', text: row ?? null, onPage28 });
    if (onPage28 || row) {
      armTrace();
      emit({ step: 'trace-armed', traced });
      state.phase = 'ok';
      const before = calls.length;
      if (row) walk.to([{ row: [row] }]);
      else press('ok');
      idle(500);
      const chooserTexts = readTexts();
      const chooserFrame = (() => { try { return walk.read().frame; } catch (e) { return null; } })();
      emit({ step: 'chooser', texts: chooserTexts, calls, callsFrom: before });
      if (chooserFrame) shot(resolve('work/out/stock-chooser-v12b.png'), chooserFrame);
      const entered = [...hits].sort((a, b) => a - b);
      emit({ step: 'editor-trace', traced, entered: entered.length, addresses: entered.map(hex) });
    } else {
      emit({ step: 'chooser-skipped', reason: 'opened screen is not page 28 and has no zone row', calls });
    }
    emit({ step: 'copies', copies });
    emit({ step: 'done', ok: Boolean(onPage28), onPage28, measured: true, pagesSeen, pageDump });
  }
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
