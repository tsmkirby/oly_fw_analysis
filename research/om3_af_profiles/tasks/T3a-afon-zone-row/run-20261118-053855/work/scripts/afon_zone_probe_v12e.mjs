// T3a correction, item 1. Stock session, no overlay.
// Walks the AF menu pages in left-key order and records each sub-page's
// provider group and multi-row page id. Stops on page 28 and opens its zone row.
// Usage: node26 work/scripts/afon_zone_probe_v12e.mjs om-emu stock work/out/stock-page28-v12e.jsonl
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
const shot = (file, frame) => { write_png(file, frame[0], frame[1], words_to_rgb(frame[2])); emit({ step: 'screenshot', file }); };

const STOPS = [
  ['@A02C@AF Scanner', ['@A02C@AF Scanner', '@A02C@AF Limiter']],
  ['AF Illuminator', ['AF Illuminator', 'AF Area Pointer']],
  ['@A065@C-AF Setting', ['Subject Detection', '@A065@C-AF Setting', '@A02C@@A065@AF Button']],
  ['@A02C@AF Mode', ['@A02C@AF Mode', '@A02C@AF by half-pressing @A052@', 'Release Priority']],
];

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const groups = [];
  const pages = [];
  l.observe(native(0x611afaa1), (lab, r) => {
    if (!state.phase.startsWith('visit')) return;
    if (groups.length < 80) groups.push({ phase: state.phase, group: lab.sim.u32((r.a0 >>> 0) + 0x40) >>> 0 });
  }, 'obs-provider');
  l.observe(native(0x61203a81), (lab, r) => {
    if (!state.phase.startsWith('visit')) return;
    const page = lab.sim.u32((r.a0 >>> 0) + 0x13e8);
    if (!page) return;
    const id = lab.sim.u32(page) >>> 0;
    const last = pages.at(-1);
    if (!last || last.page !== page || last.phase !== state.phase) {
      if (pages.length < 50) pages.push({ phase: state.phase, page: hex(page), id });
    }
  }, 'obs-page');
  const calls = [];
  l.observe(native(0x61203470), (lab, r) => {
    if (state.phase !== 'visit-ok' || calls.length >= 12) return;
    const ra = r.mdr >>> 0;
    const p58 = lab.sim.u32((r.a0 >>> 0) + 0x58);
    const rec = { fn: 'list-type', ra: hex(ra), plus58: hex(p58), kind58: p58 > 0x1000 ? lab.sim.u32(p58 + 0x5c) >>> 0 : null };
    calls.push(rec);
    if (ra > 0x1000 && !l.hooks.has(ra)) l.hook_rt(ra, (h, rr) => { rec.d0 = rr.d0 & 0xffff; l.hooks.delete(ra); l.passthrough(rr); }, 'obs-ret', true);
  }, 'obs-type');
  l.observe(native(0x6120345d), (lab, r) => {
    if (state.phase !== 'visit-ok' || calls.length >= 16) return;
    const ra = r.mdr >>> 0;
    const rec = { fn: 'editor-kind', ra: hex(ra), a0: hex(r.a0 >>> 0), kindA0: lab.sim.u32((r.a0 >>> 0) + 0x5c) >>> 0 };
    calls.push(rec);
    if (ra > 0x1000 && !l.hooks.has(ra)) l.hook_rt(ra, (h, rr) => { rec.d0 = rr.d0 & 0xffff; l.hooks.delete(ra); l.passthrough(rr); }, 'obs-retk', true);
  }, 'obs-kind');
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
      l.observe(native(addr), () => { if (state.phase === 'visit-ok') hits.add(addr); }, 'obs-ed-' + addr.toString(16));
    }
  };
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(60); key(k, 'up'); idle(420); };
  idle(1200);
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 24 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return []; } };
  const frameOf = () => { try { return walk.read().frame; } catch (e) { return null; } };
  const find = (fragment) => {
    const seen = new Set();
    for (let n = 0; n < 50; n++) {
      const texts = textsOf();
      if (texts.some((t) => t.includes(fragment))) return texts;
      const sig = texts.join('\n');
      if (seen.has(sig)) return null;
      seen.add(sig);
      press('left');
    }
    return null;
  };
  let opened28 = null;
  let nvisit = 0;
  for (const [anchor, rows] of STOPS) {
    if (opened28) break;
    const parent = find(anchor);
    emit({ step: 'anchor', anchor, found: Boolean(parent), texts: parent });
    if (!parent) continue;
    for (const row of rows) {
      if (!textsOf().some((t) => t === row || t.includes(row))) { emit({ step: 'row-absent', row }); continue; }
      state.phase = 'visit-' + (nvisit++);
      const g0 = groups.length, p0 = pages.length;
      try { walk.to([{ row: [row] }]); }
      catch (e) { emit({ step: 'visit-miss', row, error: String(e.message || e) }); continue; }
      idle(250);
      const texts = textsOf();
      const rec = { step: 'visit', row, texts, groups: groups.slice(g0), pages: pages.slice(p0) };
      emit(rec);
      const hit = rec.pages.some((p) => p.id === 28);
      if (hit || texts.some((t) => t.includes('@A040@') || (t.endsWith('AF Target Mode') && !t.includes('Settings') && t !== row))) {
        opened28 = { row, texts, pages: rec.pages };
        const fr = frameOf();
        if (fr) shot(resolve('work/out/stock-page28-v12e.png'), fr);
        break;
      }
      press('menu');
      idle(200);
    }
  }
  if (!opened28) {
    emit({ step: 'done', ok: false, reason: 'page 28 not opened from the AF menu rows', groups, pages });
  } else {
    const texts = textsOf();
    const zone = texts.find((t) => t.includes('@A040@') || (t.includes('AF Target Mode') && !t.includes('Settings')));
    emit({ step: 'zone-row', text: zone ?? null, opened28 });
    armTrace();
    state.phase = 'visit-ok';
    if (zone) {
      try { walk.to([{ row: [zone] }]); } catch (e) { press('ok'); emit({ step: 'zone-walk', error: String(e.message || e) }); }
    } else press('ok');
    idle(400);
    const fr = frameOf();
    emit({ step: 'chooser', texts: textsOf(), calls });
    if (fr) shot(resolve('work/out/stock-chooser-v12e.png'), fr);
    emit({ step: 'editor-trace', traced, entered: hits.size, addresses: [...hits].sort((a, b) => a - b).map(hex) });
    emit({ step: 'done', ok: true, measured: true });
  }
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
