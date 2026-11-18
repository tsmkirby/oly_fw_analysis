// T3a correction, item 1. Stock session, no overlay.
// Visits each row of "AF Target Settings & Operations" and records the provider
// group (0x611afaa1, object+0x40) and the multi-row page pointer (viewer+0x13e8).
// Page 28's settings are group 0x116. If that page opens, OK its zone row.
// Usage: node26 work/scripts/afon_zone_probe_v12d.mjs om-emu stock work/out/stock-page28-v12d.jsonl
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
const GROUP28 = 0x116;
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

const ROWS = [
  '@A02C@AF Target Mode Settings',
  '@A02C@Orientation Linked @A02F@',
  '@A02C@@A02F@ Set Home',
  '@A02F@Select Screen Settings',
  '@A02F@ Loop Settings',
  'AF Targeting Pad',
];

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const groups = [];
  const pages = [];
  const calls = [];
  l.observe(native(0x611afaa1), (lab, r) => {
    if (!state.phase.startsWith('visit')) return;
    const obj = r.a0 >>> 0;
    if (groups.length < 60) groups.push({ phase: state.phase, group: lab.sim.u32(obj + 0x40) >>> 0, obj: hex(obj) });
  }, 'obs-provider');
  l.observe(native(0x61203a81), (lab, r) => {
    if (!state.phase.startsWith('visit')) return;
    const page = lab.sim.u32((r.a0 >>> 0) + 0x13e8);
    if (!page) return;
    const id = lab.sim.u32(page) >>> 0;
    if (!pages.length || pages.at(-1).page !== page || pages.at(-1).phase !== state.phase) {
      if (pages.length < 40) pages.push({ phase: state.phase, page: hex(page), id });
    }
  }, 'obs-page');
  l.observe(native(0x61203470), (lab, r) => {
    if (!state.phase.startsWith('visit') || calls.length >= 24) return;
    const ra = r.mdr >>> 0;
    const a0 = r.a0 >>> 0;
    const p58 = lab.sim.u32(a0 + 0x58);
    const rec = { phase: state.phase, fn: 'list-type', ra: hex(ra), plus58: hex(p58), kind58: p58 > 0x1000 ? lab.sim.u32(p58 + 0x5c) >>> 0 : null };
    calls.push(rec);
    if (ra > 0x1000 && !l.hooks.has(ra)) {
      l.hook_rt(ra, (h, rr) => { rec.d0 = rr.d0 & 0xffff; l.hooks.delete(ra); l.passthrough(rr); }, 'obs-ret-type', true);
    }
  }, 'obs-type');
  const hits = new Set();
  let traced = 0;
  const armTrace = () => {
    if (traced) return;
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
  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(70); key(k, 'up'); idle(450); };
  idle(1500);
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return []; } };
  const frameOf = () => { try { return walk.read().frame; } catch (e) { return null; } };
  const seen = new Set();
  let onParent = false;
  for (let tab = 0; tab < 48 && !onParent; tab++) {
    const texts = textsOf();
    const sig = texts.join('\n');
    if (seen.has(sig)) break;
    seen.add(sig);
    onParent = texts.some((t) => t.includes('AF Target Settings'));
    if (!onParent) press('left');
  }
  emit({ step: 'parent', found: onParent, texts: textsOf() });
  let found = null;
  for (let i = 0; i < ROWS.length && !found; i++) {
    const row = ROWS[i];
    state.phase = 'visit-' + i;
    const g0 = groups.length;
    const p0 = pages.length;
    const c0 = calls.length;
    try { walk.to([{ row: [row] }]); }
    catch (e) { emit({ step: 'visit-miss', i, row, error: String(e && e.message ? e.message : e) }); continue; }
    idle(300);
    const texts = textsOf();
    const mine = {
      step: 'visit', i, row, texts,
      groups: groups.slice(g0),
      pages: pages.slice(p0),
      calls: calls.slice(c0),
    };
    emit(mine);
    const hit28 = mine.groups.some((g) => g.group === GROUP28) || mine.pages.some((p) => p.id === 28 || p.page === hex(PAGE28));
    if (hit28) {
      const fr = frameOf();
      if (fr) shot(resolve('work/out/stock-page28-v12d.png'), fr);
      found = { i, row, texts };
      break;
    }
    press('menu');
    idle(250);
  }
  if (!found) {
    emit({ step: 'done', ok: false, reason: 'no visited row built group 0x116 or page 28', groups, pages });
  } else {
    const texts = textsOf();
    const zone = texts.find((t) => t.includes('AF Target Mode') && !t.includes('Settings')) || texts.find((t) => t.includes('@A040@'));
    emit({ step: 'zone-row', text: zone ?? null, texts });
    armTrace();
    state.phase = 'visit-ok';
    if (zone && zone !== found.row) walk.to([{ row: [zone] }]);
    else press('ok');
    idle(400);
    const chooserTexts = textsOf();
    const fr = frameOf();
    emit({ step: 'chooser', texts: chooserTexts, calls: calls.filter((c) => c.phase === 'visit-ok') });
    if (fr) shot(resolve('work/out/stock-chooser-v12d.png'), fr);
    emit({ step: 'editor-trace', traced, entered: hits.size, addresses: [...hits].sort((a, b) => a - b).map(hex) });
    emit({ step: 'done', ok: true, measured: true, found });
  }
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
