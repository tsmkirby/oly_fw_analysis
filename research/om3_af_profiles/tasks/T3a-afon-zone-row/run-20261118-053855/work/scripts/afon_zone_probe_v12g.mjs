// T3a correction, item 1. Stock session, no overlay.
// The C-AF Area row shows value "All". Open it and, separately, the AF/meter
// key. Log provider group, page id, list type, editor kind, OK entry trace.
// Usage: node26 work/scripts/afon_zone_probe_v12g.mjs om-emu stock work/out/stock-zone-v12g.jsonl
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

const lines = [];
const emit = (x) => { const row = { mode, hook: 'observe', ...x }; lines.push(JSON.stringify(row)); console.log(JSON.stringify(row)); };
const native = (address) => 0x50000000 + address - IMAGE_BASE;
const hex = (v) => '0x' + (v >>> 0).toString(16);
const state = { phase: 'boot' };
const fw = { rom: loadImage(), resBlock: loadBlock() };
const layout = uiin_layout(fw.rom);
const keyEntry = (code) => {
  const entries = layout.groups.flatMap(({ entries }, group) =>
    entries.filter(([, , candidate]) => candidate === code).map((entry) => [group, ...entry]));
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
const shot = (file, frame) => { write_png(file, frame[0], frame[1], words_to_rgb(frame[2])); emit({ step: 'screenshot', file }); };

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const groups = [];
  const pages = [];
  const calls = [];
  l.observe(native(0x611afaa1), (lab, r) => {
    if (!state.phase.startsWith('m')) return;
    if (groups.length < 40) groups.push({ phase: state.phase, group: lab.sim.u32((r.a0 >>> 0) + 0x40) >>> 0 });
  }, 'obs-provider');
  l.observe(native(0x61203a81), (lab, r) => {
    if (!state.phase.startsWith('m')) return;
    const page = lab.sim.u32((r.a0 >>> 0) + 0x13e8);
    if (!page) return;
    const id = lab.sim.u32(page) >>> 0;
    const model = lab.sim.u32((r.a0 >>> 0) + 0x13e0);
    const typeObj = model ? lab.sim.u32(model + 0x58) : 0;
    const last = pages.at(-1);
    if (!last || last.page !== page || last.phase !== state.phase) {
      pages.push({
        phase: state.phase, page: hex(page), id, model: hex(model),
        typeObj: hex(typeObj), typeKind: typeObj ? lab.sim.u32(typeObj + 0x5c) >>> 0 : null,
      });
    }
  }, 'obs-page');
  const watch = (addr, name) => {
    l.observe(native(addr), (lab, r) => {
      if (!state.phase.startsWith('m') || calls.length >= 20) return;
      const ra = r.mdr >>> 0;
      const a0 = r.a0 >>> 0;
      const p58 = lab.sim.u32(a0 + 0x58);
      const rec = { fn: name, phase: state.phase, ra: hex(ra), a0: hex(a0), kindA0: lab.sim.u32(a0 + 0x5c) >>> 0, plus58: hex(p58), kind58: p58 > 0x1000 ? lab.sim.u32(p58 + 0x5c) >>> 0 : null };
      calls.push(rec);
      if (ra > 0x1000 && !l.hooks.has(ra)) l.hook_rt(ra, (h, rr) => { rec.d0 = rr.d0 & 0xffff; l.hooks.delete(ra); l.passthrough(rr); }, 'obs-ret-' + name, true);
    }, 'obs-' + name);
  };
  watch(0x61203470, 'list-type');
  watch(0x6120345d, 'editor-kind');
  const hits = new Set();
  let traced = 0;
  const arm = () => {
    if (traced) return;
    const tsv = readFileSync(resolve('ref/analysis/decompiled-main/functions.tsv'), 'utf8');
    for (const line of tsv.split(/\r?\n/).slice(1)) {
      if (!line) continue;
      const addr = parseInt(line.split('\t')[0], 16);
      if (!((addr >= 0x610e0000 && addr < 0x610f0000) || (addr >= 0x61203000 && addr < 0x61205000)) || l.hooks.has(addr)) continue;
      traced += 1;
      l.observe(native(addr), () => { if (state.phase === 'm-ok') hits.add(addr); }, 'obs-ed-' + addr.toString(16));
    }
  };
  const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
  const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
  const press = (k) => { key(k, 'down'); idle(70); key(k, 'up'); idle(450); };
  idle(1200);
  let fr = null;
  const walkLater = () => new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  let walk = walkLater();
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return []; } };
  const frameOf = () => { try { return walk.read().frame; } catch (e) { return null; } };
  press('menu');
  const find = (fragment) => {
    const seen = new Set();
    for (let n = 0; n < 50; n++) {
      const texts = textsOf();
      if (texts.some((t) => t.includes(fragment))) return true;
      const sig = texts.join('\n');
      if (seen.has(sig)) return false;
      seen.add(sig);
      press('left');
    }
    return false;
  };
  state.phase = 'm-nav';
  const okParent = find('C-AF Setting');
  emit({ step: 'parent', found: okParent, texts: textsOf() });
  if (!okParent) {
    emit({ step: 'done', ok: false, reason: 'C-AF Setting not found' });
  } else {
    state.phase = 'm-caf';
    walk.to([{ row: ['@A065@C-AF Setting'] }]);
    idle(300);
    const mid = textsOf();
    emit({ step: 'caf-page', texts: mid, groups: groups.filter((g) => g.phase === 'm-caf'), pages: pages.filter((p) => p.phase === 'm-caf') });
    const area = mid.find((t) => t.includes('C-AF Area') && t.includes('@A02C@')) || mid.find((t) => t.includes('C-AF Area'));
    emit({ step: 'area-row', text: area ?? null });
    if (!area) {
      emit({ step: 'done', ok: false, reason: 'C-AF Area row missing' });
    } else {
      arm();
      state.phase = 'm-ok';
      walk.to([{ row: [area] }]);
      idle(400);
      fr = frameOf();
      emit({ step: 'chooser', texts: textsOf(), groups: groups.filter((g) => g.phase === 'm-ok'), pages: pages.filter((p) => p.phase === 'm-ok'), calls: calls.filter((c) => c.phase === 'm-ok') });
      if (fr) shot(resolve('work/out/stock-chooser-v12g.png'), fr);
      emit({ step: 'editor-trace', traced, entered: hits.size, addresses: [...hits].sort((a, b) => a - b).map(hex) });
      const page28 = pages.some((p) => p.id === 28);
      emit({ step: 'done', ok: page28, page28, measured: true });
    }
  }
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
