// T3a correction, item 1. Stock session, no overlay, no behaviour hooks.
// Opens page 28 (title "AF Target Mode") with native keys and logs the zone-row editor.
// Observers are pass-through. They are not EMULATOR-ONLY behaviour changes.
// Usage: node26 work/scripts/afon_zone_probe_v12.mjs om-emu stock work/out/stock-page28-v12.jsonl
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

try {
  pl.open_session();
  const s = pl.session;
  const l = s.lab;
  const calls = [];
  const watch = (addr, name) => {
    l.observe(native(addr), (lab, r) => {
      if (state.phase !== 'page' && state.phase !== 'ok') return;
      if (calls.length >= 80) return;
      const ra = r.mdr >>> 0;
      const a0 = r.a0 >>> 0;
      const rec = { step: 'call', fn: name, at: hex(addr), phase: state.phase, a0: hex(a0), ra: hex(ra) };
      const dumpObj = (p, tag) => {
        if (!p || p < 0x1000) { rec[tag] = hex(p); return; }
        rec[tag] = hex(p);
        rec[tag + 'Kind'] = lab.sim.u32(p + 0x5c) >>> 0;
        rec[tag + 'Vt'] = hex(lab.sim.u32(p));
        rec[tag + 'Head'] = Array.from(lab.sim.read(p, 16));
      };
      dumpObj(a0, 'a0obj');
      dumpObj(lab.sim.u32(a0 + 0x58), 'plus58');
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
  let pageDump = null;
  l.observe(native(0x61203a81), (lab, r) => {
    if (pageDump || (state.phase !== 'page' && state.phase !== 'ok')) return;
    const viewer = r.a0 >>> 0;
    if (lab.sim.u32(viewer + 0x13e8) !== PAGE28) return;
    const model = lab.sim.u32(viewer + 0x13e0);
    const typeObj = model ? lab.sim.u32(model + 0x58) : 0;
    const list = model ? lab.sim.u32(model + 0x2c) : 0;
    const count = model ? lab.sim.u32(model + 0x30) >>> 0 : 0;
    pageDump = {
      step: 'page28-model',
      viewer: hex(viewer),
      page: hex(lab.sim.u32(viewer + 0x13e8)),
      model: hex(model),
      typeObj: hex(typeObj),
      typeKind: typeObj ? lab.sim.u32(typeObj + 0x5c) >>> 0 : null,
      typeVt: typeObj ? hex(lab.sim.u32(typeObj)) : null,
      typeBytes: typeObj ? Array.from(lab.sim.read(typeObj, 112)) : null,
      list: hex(list),
      count,
      records: list ? Array.from({ length: Math.min(count, 6) }, (_, i) => {
        const raw = Buffer.from(lab.sim.read(list + i * 8, 8));
        const obj = raw.readUInt32LE(4);
        return {
          a: raw.readUInt16LE(0), b: raw.readUInt16LE(2), obj: hex(obj),
          group: obj ? lab.sim.u32(obj + 0x40) >>> 0 : null,
          kind: obj ? lab.sim.u32(obj + 0x5c) >>> 0 : null,
        };
      }) : [],
    };
  }, 'obs-page28-model');
  const copies = [];
  l.observe(native(0x611c782f), (lab, r) => {
    if (copies.length >= 120) return;
    const src = r.a1 >>> 0;
    if (src < 0x6158af80 || src > 0x6158de00) return;
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
      const inBand = (addr >= 0x610e0000 && addr < 0x610f0000) || (addr >= 0x61200000 && addr < 0x61210000);
      if (!inBand) continue;
      if (l.hooks.has(addr)) continue;
      traced += 1;
      l.observe(native(addr), () => { if (state.phase === 'ok') hits.add(addr); }, 'obs-ed-' + addr.toString(16));
    }
  };
  const getString = A(0x510bb079);
  const label = (id) => {
    const v = l.call(getString, { d0: id }, null, null, 200000).a0 >>> 0;
    return v ? Buffer.from(l.sim.read(v, 240)).toString('utf16le').split(String.fromCharCode(0))[0] : null;
  };
  const idle = (ms) => {
    const to = l.lab_time() + ms * 1e6;
    while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6));
  };
  const key = (k, d) => { const rec = s.key(k, d); s.camapp.pump(); return rec; };
  const press = (k) => { key(k, 'down'); idle(100); key(k, 'up'); idle(700); };
  const readTexts = () => {
    try { return walk.read(); }
    catch (e) { return { frame: null, texts: [], error: String(e && e.message ? e.message : e) }; }
  };
  const textOf = (scr) => scr.texts.map((t) => t.text);
  const tail = (op, n) => {
    const out = [];
    for (let i = l.draw_log.length - 1; i >= 0 && out.length < n; i--) {
      const e = l.draw_log[i];
      if (e.op === op) out.push(e);
    }
    return out.reverse();
  };
  emit({
    step: 'strings',
    strings: Object.fromEntries([0xda4, 0xdd2, 0xdd3, 0xdd4, 0xdcf, 0xda5].map((id) => [hex(id), label(id)])),
  });
  idle(2000);
  state.phase = 'nav';
  press('menu');
  const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 80 });
  const seen = new Set();
  let hit = null;
  let tabs = 0;
  for (; tabs < 40 && !hit; tabs++) {
    const scr = readTexts();
    const texts = textOf(scr);
    const sig = texts.join('\n');
    emit({ step: 'tab', tab: tabs, texts, readError: scr.error ?? null });
    if (scr.error) break;
    if (seen.has(sig)) { emit({ step: 'tabs-wrapped', tab: tabs }); break; }
    seen.add(sig);
    hit = texts.find((t) => t.includes('AF Target Mode'));
    if (hit) break;
    // The AF tab name is drawn on every screen. Scroll only a page whose rows
    // already look like the AF target / AF Home neighbourhood.
    const interesting = texts.some((t) => /Target|Home|AF Button|Subject|half-press|C-AF|AF Mode|Focus Area/.test(t));
    if (interesting) {
      press('right');
      const innerSeen = new Set();
      for (let row = 0; row < 14 && !hit; row++) {
        const inner = readTexts();
        const it = textOf(inner);
        emit({ step: 'scroll', tab: tabs, row, texts: it, readError: inner.error ?? null });
        hit = it.find((t) => t.includes('AF Target Mode'));
        if (hit || inner.error) break;
        const isig = it.join('\n');
        if (innerSeen.has(isig)) break;
        innerSeen.add(isig);
        press('down');
      }
      if (hit) break;
      press('left');
    }
    press('left');
  }
  if (!hit) {
    emit({ step: 'page28-missing', tabs, calls, copies: copies.filter((c) => c.id === 0xda4 || c.id === 0xdd2) });
    emit({ step: 'done', ok: false, reason: 'AF Target Mode was not on a scanned menu tab' });
  } else {
    emit({ step: 'menu-hit', text: hit });
    state.phase = 'page';
    walk.to([{ row: [hit] }]);
    const page = readTexts();
    const pageTexts = textOf(page);
    emit({ step: 'page28', texts: pageTexts, walk: walk.log.slice(-12), readError: page.error ?? null });
    if (page.frame) shot(resolve('work/out/stock-page28-v12.png'), page.frame);
    emit({ step: 'page-copies', copies });
    if (pageDump) emit(pageDump);
    const row = pageTexts.find((t) => t.includes('@A040@') && t.includes('AF Target Mode')) || pageTexts.find((t) => t.includes('AF Target Mode') && t !== hit);
    emit({ step: 'zone-row', text: row ?? null });
    armTrace();
    emit({ step: 'trace-armed', traced });
    state.phase = 'ok';
    const before = calls.length;
    if (row) walk.to([{ row: [row] }]);
    else press('ok');
    idle(600);
    const chooser = readTexts();
    const chooserTexts = textOf(chooser);
    const bitmaps = tail('bitmap', 80).map((e) => ({ x: e.x, y: e.y, w: e.width, h: e.lines, fmt: e.fmt, record: e.record >>> 0 }));
    const textsTail = tail('text', 40).map((e) => e.text);
    emit({ step: 'chooser', texts: chooserTexts, textsTail, bitmapCount: bitmaps.length, bitmaps: bitmaps.slice(0, 40), readError: chooser.error ?? null });
    if (chooser.frame) shot(resolve('work/out/stock-chooser-v12.png'), chooser.frame);
    emit({ step: 'calls', calls });
    emit({ step: 'calls-during-ok', from: before, n: calls.length - before });
    const entered = [...hits].sort((a, b) => a - b);
    emit({ step: 'editor-trace', traced, entered: entered.length, addresses: entered.map(hex) });
    emit({ step: 'chooser-copies', copies: copies.filter((c) => c.phase === 'ok' || c.phase === 'page').slice(0, 80) });
    if (pageDump) emit({ step: 'page28-model-after', ...pageDump, step: 'page28-model-after' });
    const sawTitle = copies.some((c) => c.src === '0x6158afa0' || c.id === 0xda4);
    const sawRow = copies.some((c) => c.id === 0xdd2);
    const opened = chooserTexts.some((t) => t.includes('AF Target')) || bitmaps.length > 8;
    emit({ step: 'done', ok: sawTitle || sawRow, sawTitle, sawRow, opened, measured: true });
  }
} catch (e) {
  emit({ step: 'boundary', error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  writeFileSync(outPath, lines.join('\n') + '\n');
}
