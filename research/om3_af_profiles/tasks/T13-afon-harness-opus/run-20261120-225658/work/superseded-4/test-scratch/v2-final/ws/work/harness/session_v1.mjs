// H is the T3h configuration: T3a overlay and redirects, the E1 row, action
// record editor 0x1e6, binding 0x1e6 -> 0x3D6F, the UI 238 descriptor clone,
// and the private face record at 0x6031ea48 (count 10, faces 0x6158ba1c,
// help 0x61576520). opts.help adds the ten-record help list. opts.rowLabel
// restores kind 4 and label 0x0DD2. opts.page28 is the T3c reference construction.
// Copied from T3j zone_session_j1.mjs. Edited before its first run. Do not edit after it runs.
// T13 session_v1.mjs: derived from T5 zone_session_k1.mjs. The retained diff (session_v1.diff) is limited to: outputs
// under opts.outDir (per tag), in-memory NVRAM (no NVRAM file is read or written), bring-up split into five functions,
// and the overlay CSV written under the tag. Hooks, help records, face hook, 0x120b override and overlay application
// are unchanged.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync, writeSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const UI = 0x3d6f;
const BASE = 0x60021020;
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const PAGE27 = 0x6158f0f8;
const SOURCE = 0x61529ce8;
const TABLE_PTR = 0x6150f5f0;
const TABLE_RAM = 0x6031ea00;
const ROW = 0x6031e978;
const DESC = 0x6031e9a0;
const DESC_238 = 0x606200e4;
const NODE = 0x6031e9b8;
const BUCKET_BASE = 0x62a84970;
const STOCK_ROW = 0x6158dc44;
const STOCK_TABLE = 0x6150c514;
const BIND_SRC = 0x615c540c;
const BIND_COUNT = 416;
const BIND_RAM = 0x60320000;
const DIR = 0x615cc934;
const REC_2154 = 0x615c5e14;
const ZONE_LIST = 0x6158ba1c;
const PRIORITY_LIST = 0x6158ba04;
const STOCK_FACE = 0x6037c98c;
const FACE = 0x6031ea48;
const HELP_AT = 0x6031ea6c;
const HELP_STOCK = 0x61576520;
const HELP_TEXT = 0x01a8;
const HELP_EXTRA = 0x61574870;
const HOOK_AT = 0x611f7f42;
const PAGE28_LIST = 0x61529816;
const PAGE28_COUNT = 3;

const ZONE_VALUES = [0, 1, 2, 3, 5, 10, 6, 7, 8, 9];
const HOME_KEYS = [
  ['0x99d2', 0x99d2, 3], ['0x9fa1', 0x9fa1, 3], ['0xdfa1', 0xdfa1, 1], ['0x1ea1', 0x1ea1, 1],
  ['0x9ec1', 0x9ec1, 1], ['0x9ed1', 0x9ed1, 1], ['0x9ee1', 0x9ee1, 1], ['0x9ef1', 0x9ef1, 1], ['0x59b1', 0x59b1, 1],
];
const ORIGINALLY = [2274, 2275, 2276, 2277, 2278, 2279];

function shaFile(p) {
  const b = readFileSync(p);
  return { path: p.replaceAll('\\', '/'), sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
}

export function helpRecords() {
  const buf = Buffer.alloc(ZONE_VALUES.length * 12);
  ZONE_VALUES.forEach((value, i) => {
    const o = i * 12;
    buf.writeUInt32LE(value, o);
    buf.writeUInt16LE(4, o + 4);
    buf.writeUInt16LE(HELP_TEXT, o + 6);
    buf.writeUInt32LE(HELP_EXTRA, o + 8);
  });
  return buf;
}

export async function runZone(opts) {
  const { checkout, outPath, tag, drive, outDir } = opts;
  assert(checkout && outPath && tag && drive && outDir);
  const candidate = !!opts.candidate;
  const help = !!opts.help;
  const rowLabel = !!opts.rowLabel;
  const page28 = !!opts.page28;
  process.env.OM_EMU_MODEL = 'E147';
  const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
  const { loadNand, loadImage, loadBlock, patchedFirmware, createHash: fwHash, ORIGINAL, BLOCK, NAND } = await use('checks/lib/env.mjs');
  const { IMAGE_BASE, A } = await use('src/fw/model.mjs');
  const { Player } = await use('src/lab/player.mjs');
  const { UIIN_ENTRIES, apply_uiin_layout, uiin_layout } = await use('src/lab/play.mjs');
  const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
  const { MenuWalk } = await use('src/lab/menuwalk.mjs');
  const { write_png } = await use('checks/lib/png.mjs');
  const { words_to_rgb } = await use('src/lab/display.mjs');
  const { hostNow } = await use('src/lab/nvramdoc.mjs');
  const { setExecTrace, S } = await use('src/core/cpu.mjs');
  const { setForceHelper } = await use('src/core/interp.mjs');
  const GETTER = A(0x503c49ab);
  const native = (address) => (0x50000000 + address - IMAGE_BASE) >>> 0;
  const hex = (v) => (v === null || v === undefined) ? null : '0x' + (v >>> 0).toString(16);
  const lines = [];
  const emit = (role, x) => {
    const row = { hook: role === 'behaviour' ? 'EMULATOR-ONLY' : 'observe', role, tag, ...x };
    lines.push(JSON.stringify(row));
    console.log(JSON.stringify(row));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, lines.join('\n') + '\n');
  };
  const helperRels = [
    'checks/lib/env.mjs', 'src/fw/model.mjs', 'src/lab/player.mjs', 'src/lab/play.mjs',
    'scenarios/session_replay.mjs', 'src/lab/menuwalk.mjs', 'checks/lib/png.mjs', 'src/lab/display.mjs',
    'host/nvram.mjs', 'src/core/cpu.mjs', 'src/core/interp.mjs',
  ];
  const helpers = helperRels.map((rel) => shaFile(resolve(checkout, 'emu', rel)));
  helpers.push(shaFile(fileURLToPath(import.meta.url)));
  const resources = [ORIGINAL, BLOCK, NAND, resolve('inputs/00_0100_50000020.decoded.bin'),
    resolve('inputs/02_0106_458c0020.decoded.bin'),
    resolve('ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv')]
    .filter(Boolean).map((p) => shaFile(p));
  emit('observe', {
    step: 'helper-hashes',
    note: 'SHA-256 taken at this run, before the session starts.',
    helpers, resources,
    flags: { candidate, help, rowLabel, page28 },
  });

  const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
  const helpBuf = helpRecords();
  let fw;
  let csvName = null;
  if (!candidate) {
    fw = { rom: loadImage(), resBlock: loadBlock(), summary: null, changed: [] };
  } else {
    if (opts.overlayCsv) {
      const csvPath = resolve(opts.overlayCsv);
      const patches = [];
      for (const row of readFileSync(csvPath, 'utf8').trim().split(/\r?\n/).slice(1)) {
        const [o, , old, next] = row.split(',');
        const off = parseInt(o, 16);
        const oldB = parseInt(old, 16);
        const neu = parseInt(next, 16);
        if (image[off] !== oldB) throw new Error('overlay stock mismatch at ' + (BASE + off).toString(16));
        const last = patches.at(-1);
        if (last && off === last.offset + last.old.length) { last.old.push(oldB); last.neu.push(neu); }
        else patches.push({ offset: off, old: [oldB], neu: [neu] });
      }
      csvName = opts.overlayCsv.replaceAll('\\', '/');
      fw = patchedFirmware(patches.map((x, n) => ({
        block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: csvPath, n,
      })));
      emit('behaviour', {
        step: 'overlay',
        label: 'EMULATOR-ONLY image from ' + csvName + '. Role: behaviour.',
        csv: csvName,
        bytes: patches.reduce((n, p) => n + p.old.length, 0),
      });
    } else {
    const byOff = new Map();
    const csvPath = resolve('ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv');
    for (const row of readFileSync(csvPath, 'utf8').trim().split(/\r?\n/).slice(1)) {
      const [o, , old, next] = row.split(',');
      byOff.set(parseInt(o, 16), { old: parseInt(old, 16), neu: parseInt(next, 16), purpose: 'prerequisite T3a section-1 tail' });
    }
    const desc = Buffer.from(image.subarray(DESC_238 - BASE, DESC_238 - BASE + 20));
    desc.writeUInt16LE(UI, 0);
    for (let i = 0; i < 20; i++) byOff.set((DESC - BASE) + i, { old: image[(DESC - BASE) + i], neu: desc[i], purpose: 'Z1 descriptor clone of UI 238, id 0x3D6F' });
    const stockRow = Buffer.from(image.subarray(STOCK_ROW - BASE, STOCK_ROW - BASE + 36));
    assert.equal(stockRow.readUInt16LE(4), 12);
    assert.equal(stockRow.readUInt32LE(12), PRIORITY_LIST);
    const row = Buffer.from(stockRow);
    row.writeUInt32LE(UI, 0);
    row.writeUInt32LE(ZONE_LIST, 12);
    row.writeUInt32LE(10, 16);
    row.writeUInt32LE(0, 28);
    row.writeUInt32LE(0, 32);
    let rowPurpose = 'H row: 2154 copy, id 0x3D6F, kind 12, primary 0x6158ba1c count 10, alternate 0';
    if (rowLabel) {
      row.writeUInt16LE(4, 4);
      row.writeUInt16LE(0x0dd2, 6);
      rowPurpose = 'one change against H+help: row kind 4, label 0x0DD2, primary 0x6158ba1c count 10, alternate 0';
    }
    for (let i = 0; i < 36; i++) byOff.set((ROW - BASE) + i, { old: image[(ROW - BASE) + i], neu: row[i], purpose: rowPurpose });
    const stockTable = image.subarray(STOCK_TABLE - BASE, STOCK_TABLE - BASE + 48);
    const third = Buffer.from(stockTable.subarray(0, 24));
    third[4] = 0x6f; third[5] = 0x3d;
    third.writeUInt32LE(0x1e6, 16);
    const tableBytes = Buffer.concat([stockTable, third]);
    for (let i = 0; i < 72; i++) {
      const o = (TABLE_RAM - BASE) + i;
      if (image[o] !== 0xff) throw new Error('action slot is not FF at ' + hex(BASE + o));
      byOff.set(o, { old: 0xff, neu: tableBytes[i], purpose: 'page-27 action table; third record UI 0x3D6F editor 0x1e6' });
    }
    const face = Buffer.from(image.subarray(STOCK_FACE - BASE, STOCK_FACE - BASE + 0x24));
    face.writeUInt16LE(10, 8);
    face.writeUInt32LE(ZONE_LIST, 0x0c);
    face.writeUInt32LE(help ? HELP_AT : HELP_STOCK, 0x10);
    for (let i = 0; i < 0x24; i++) {
      const o = (FACE - BASE) + i;
      if (image[o] !== 0xff) throw new Error('face slot is not FF at ' + hex(BASE + o));
      const pointerByte = i >= 0x10 && i < 0x14;
      const purpose = pointerByte && help
        ? 'combined one change against H: face record +0x10 points at the help list 0x6031ea6c'
        : 'H private face record count 10 list 0x6158ba1c help 0x61576520';
      byOff.set(o, { old: 0xff, neu: face[i], purpose });
    }
    if (help) {
      for (let i = 0; i < helpBuf.length; i++) {
        const o = (HELP_AT - BASE) + i;
        if (image[o] !== 0xff) throw new Error('help slot is not FF at ' + hex(BASE + o));
        byOff.set(o, { old: 0xff, neu: helpBuf[i], purpose: 'combined one change against H: ten-record help list, kind 4, text 0x1a8, EMULATOR-ONLY' });
      }
    }
    const ordered = [...byOff.entries()].sort((a, b) => a[0] - b[0]);
    const patches = [];
    const csvRows = ['component_offset,runtime_address,stock_byte,proposed_byte,purpose'];
    for (const [off, rec] of ordered) {
      if (image[off] !== rec.old) throw new Error('overlay old mismatch at ' + hex(BASE + off));
      const last = patches.at(-1);
      if (last && off === last.offset + last.old.length && last.purpose === rec.purpose) { last.old.push(rec.old); last.neu.push(rec.neu); }
      else patches.push({ offset: off, old: [rec.old], neu: [rec.neu], purpose: rec.purpose });
      csvRows.push([off.toString(16).padStart(8, '0'), (BASE + off).toString(16), rec.old.toString(16).padStart(2, '0'), rec.neu.toString(16).padStart(2, '0'), rec.purpose].join(','));
    }
    csvName = join(outDir, 'overlay-' + tag + '.csv');
    writeFileSync(resolve(csvName), csvRows.join('\n') + '\n');
    if (opts.canonical) writeFileSync(join(outDir, 'overlay-changed-bytes.csv'), csvRows.join('\n') + '\n');
    fw = patchedFirmware(patches.map((x, n) => ({
      block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: 'work/scripts/zone_session_i1.mjs', n,
    })));
    emit('behaviour', {
      step: 'overlay',
      label: 'EMULATOR-ONLY image bytes for this session',
      csv: csvName,
      canonical: !!opts.canonical,
      help: help ? hex(HELP_AT) : null,
      helpBytes: help ? helpBuf.toString('hex') : null,
      faceHelp: help ? hex(HELP_AT) : hex(HELP_STOCK),
      rowLabel,
    });
    }
  }

  const layKeys = uiin_layout(fw.rom);
  const keyEntry = (code) => {
    const entries = layKeys.groups.flatMap(({ entries }, group) => entries.filter(([, , c]) => c === code).map((entry) => [group, ...entry]));
    assert.equal(entries.length, 1, 'key entries for ' + hex(code));
    return entries[0];
  };
  apply_uiin_layout(fw.rom);
  const parked = keyEntry(0x120b);
  UIIN_ENTRIES.set(parked.slice(0, 3).join(','), parked);
  emit('behaviour', {
    step: 'harness-120b',
    label: 'EMULATOR-ONLY harness override. UIIN_ENTRIES.set installs the 0x120b matrix entry. That code is only in UI_IN variant 1; the lab board reads variant 0.',
    code: '0x120b',
  });
  // In-memory NVRAM: load() is null (a blank camera, as OM_EMU_NVRAM=off); saves are kept in memory and logged.
  const nvramSaves = [];
  const nv = {
    file: null,
    doc: () => null,
    load: () => null,
    saveScpuMemory(m) { nvramSaves.push({ kind: 'scpuMemory' }); emit('observe', { step: 'nvram-save', kind: 'scpuMemory' }); void m; },
    save(name, data) { nvramSaves.push({ kind: 'store', name }); emit('observe', { step: 'nvram-save', kind: 'store', name, bytes: data ? data.length : 0 }); },
    saveScpu(words) { nvramSaves.push({ kind: 'scpu' }); emit('observe', { step: 'nvram-save', kind: 'scpu' }); void words; },
    now: hostNow,
  };
  const pl = new Player(
    { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
    { ...fw, nand: loadNand(), createHash: fwHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} } }, nvram: nv, patch: fw.summary, patchRanges: fw.changed, loaded: 'on' },
  );
  pl.camapp_components = true;
  pl.camapp_native_tra = true;
  let failed = null;
  try {
    pl.open_session();
    const s = pl.session;
    const l = s.lab;
    const readByte = (addr) => l.sim.read(addr, 1)[0];
    const writeU32 = (addr, value) => { const b = Buffer.alloc(4); b.writeUInt32LE(value >>> 0, 0); l.sim.write(addr, b); };
    const writeU16 = (addr, value) => { const b = Buffer.alloc(2); b.writeUInt16LE(value & 0xffff, 0); l.sim.write(addr, b); };
    const word = (addr) => l.sim.u32(addr) >>> 0;
    const half = (addr) => { const b = l.sim.read(addr, 2); return b[0] | (b[1] << 8); };
    const gate = { reading: false };
    const faceLog = [];
    if (candidate) {
      emit('behaviour', { step: 'hooks', label: 'EMULATOR-ONLY H: T3a value hooks, descriptor link, binding copy, section-7 redirects, face-record hook' });
      const own = (r) => (r.d0 & 0xffff) === UI;
      l.hook(native(0x6041931e), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: readByte(PROFILE) }); }, 'EMULATOR-ONLY afon value getter');
      l.hook(native(0x6041937f), (h, r) => {
        if (!own(r)) { l.passthrough(r); return; }
        const b = Buffer.alloc(1); b[0] = r.d1 & 0xff; l.sim.write(PROFILE, b); l.sim.write(PROFILE_CACHED, b); h.finish(r, { d0: 0 });
      }, 'EMULATOR-ONLY afon setter');
      l.hook(native(0x60419446), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0xA70F }); }, 'EMULATOR-ONLY afon mapped getter');
      l.hook(native(0x60419696), (h, r) => { if (!own(r)) { l.passthrough(r); return; } h.finish(r, { d0: 0 }); }, 'EMULATOR-ONLY afon index getter');
      const page = Buffer.alloc(8); page.writeUInt32LE(0x6031e930, 0); page.writeUInt16LE(3, 4); l.sim.write(PAGE27 + 4, page);
      const src = Buffer.alloc(8); src.writeUInt32LE(0x6031e928, 0); src.writeUInt16LE(3, 4); l.sim.write(SOURCE + 4, src);
      writeU32(TABLE_PTR, TABLE_RAM); writeU32(TABLE_PTR + 4, 3);
      const bindSrc = image.subarray(BIND_SRC - BASE, BIND_SRC - BASE + BIND_COUNT * 24);
      const extra = Buffer.from(image.subarray(REC_2154 - BASE, REC_2154 - BASE + 24));
      extra.writeUInt32LE(0x1e6, 0); extra.writeUInt32LE(UI, 8);
      l.sim.write(BIND_RAM, Buffer.concat([bindSrc, extra]));
      writeU32(DIR + 4, BIND_RAM); writeU16(DIR + 8, BIND_COUNT + 1);
      const head = word(BUCKET_BASE + (UI & 0x7f) * 4);
      const node = Buffer.alloc(8); node.writeUInt32LE(DESC, 0); node.writeUInt32LE(head >>> 0, 4);
      l.sim.write(NODE, node); writeU32(BUCKET_BASE + (UI & 0x7f) * 4, NODE);
      l.hook(native(HOOK_AT), (h, r) => {
        if (!gate.reading) {
          try {
            const parent = word((r.a3 >>> 0) + 0x998);
            if ((half(parent + 0x54) & 0xffff) === UI) writeU32(r.a0 >>> 0, FACE);
          } catch { /* not this chooser */ }
        }
        l.passthrough(r);
      }, 'EMULATOR-ONLY behaviour: 0x3D6F face record 0x6031ea48');
      emit('behaviour', {
        step: 'h-installed',
        label: help
          ? 'EMULATOR-ONLY combined one change against H: help list at 0x6031ea6c and face record +0x10. Role: behaviour.'
          : 'EMULATOR-ONLY H face record, help pointer still 0x61576520',
        face: hex(FACE), helpAt: help ? hex(HELP_AT) : hex(HELP_STOCK), rowLabel,
      });
    }
    const page28State = { phase: 'off', replaced: 0 };
    if (page28) {
      const stockPtr = word(0x61529cec);
      const stockCount = word(0x61529cf0);
      writeU32(0x61529cec, PAGE28_LIST);
      writeU32(0x61529cf0, PAGE28_COUNT);
      l.hook(native(0x61203696), (h, r) => {
        try {
          const a1 = r.a1 >>> 0;
          const id = half(a1 + 4);
          if (page28State.phase === 'build' && id === 27 && page28State.replaced === 0) {
            writeU16(a1 + 4, 28);
            page28State.replaced += 1;
            emit('behaviour', { step: 'page28-id', label: 'EMULATOR-ONLY reference construction. Constructor page id 27 rewritten to 28.', a1: hex(a1) });
          }
        } catch { /* unreadable argument */ }
        l.passthrough(r);
      }, 'EMULATOR-ONLY reference construction: page 28');
      emit('behaviour', {
        step: 'page28-source',
        label: 'EMULATOR-ONLY reference construction. AF Button source record pointed at the page-28 id list. Not a native route.',
        stockPtr: hex(stockPtr), stockCount, ptr: hex(PAGE28_LIST), count: PAGE28_COUNT,
      });
    }
    l.observe(native(0x611c7785), (lab, r) => {
      if (gate.reading || faceLog.length > 400) return;
      faceLog.push({ caller: hex(r.mdr >>> 0), list: hex(r.a1 >>> 0), value: r.d0 >>> 0, count: r.d1 & 0xffff });
    }, 'obs-611c7785');
    l.observe(native(0x611c77a1), (lab, r) => {
      if (gate.reading || !faceLog.length) return;
      const last = faceLog[faceLog.length - 1];
      if (last.kind !== undefined) return;
      try {
        last.kind = r.d0 & 0xffff;
        last.id = half((r.a2 >>> 0) + 2);
      } catch { /* record unreadable */ }
    }, 'obs-611c77a1');
    const callSaved = (fn) => {
      const saved = l.sim.registers();
      gate.reading = true;
      try { return fn(); }
      finally { gate.reading = false; l.sim.reset(saved); }
    };
    const readKey = (key, index) => callSaved(() => l.call(native(0x60063380), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff);
    const mapOf = (id) => callSaved(() => ({
      id,
      key: l.call(native(0x60419446), { d0: id }, null, null, 200000).d0 & 0xffff,
      index: l.call(native(0x60419696), { d0: id }, null, null, 200000).d0 & 0xffff,
    }));
    const getterValue = (id) => callSaved(() => l.call(GETTER, { d0: id }, null, null, 200000).d0 | 0);
    const cells = () => {
      const home = {};
      for (const [nm, key, n] of HOME_KEYS) home[nm] = Array.from({ length: n }, (_, i) => readKey(key, i));
      return {
        profile: readByte(PROFILE), profileCached: readByte(PROFILE_CACHED),
        k90a1: [readKey(0x90a1, 0), readKey(0x90a1, 1)],
        k1dd1: Array.from({ length: 10 }, (_, i) => readKey(0x1dd1, i)),
        k99a1: Array.from({ length: 8 }, (_, i) => readKey(0x99a1, i)),
        k9a41: readKey(0x9a41, 0),
        k5962: Array.from({ length: 6 }, (_, i) => readKey(0x5962, i)),
        home,
        originally: ORIGINALLY.map((id) => ({ ...mapOf(id), value: getterValue(id) })),
      };
    };
    const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
    const key = (k, d) => { s.key(k, d); s.camapp.pump(); };
    const press = (k) => { key(k, 'down'); idle(80); key(k, 'up'); idle(450); };
    const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 40 });
    const screen = () => {
      try {
        const scr = walk.read();
        const texts = scr.texts.map((t) => t.text);
        let highlight = null;
        for (const t of scr.texts) {
          try {
            const listed = walk.list(scr, t);
            if (listed && listed.cursor != null && listed.rows[listed.cursor]) { highlight = listed.rows[listed.cursor].text; break; }
          } catch { /* not a list */ }
        }
        return { texts, highlight, frame: scr.frame };
      } catch (e) {
        return { texts: [], highlight: null, frame: null, error: String(e && e.message || e) };
      }
    };
    const shot = (name) => {
      const view = screen();
      let file = null;
      if (view.frame) {
        file = join(outDir, tag + '-' + name + '.png');
        write_png(file, view.frame[0], view.frame[1], words_to_rgb(view.frame[2]));
      }
      if (opts.fatalShots !== false && (view.error || !view.frame)) {
        throw new Error('screenshot failed at ' + name + ': ' + (view.error || 'no frame'));
      }
      return { texts: view.texts, highlight: view.highlight, file, error: view.error || null };
    };
    const takeFaces = () => {
      const rows = faceLog.splice(0, faceLog.length);
      return rows;
    };
    const trace = (file, fn) => {
      const fd = openSync(resolve(file), 'w');
      const buf = Buffer.alloc(8);
      let n = 0;
      let last = 0;
      const started = Date.now();
      setForceHelper(true);
      setExecTrace((pc) => {
        last = pc >>> 0;
        n += 1;
        if ((n & 31) === 0) {
          buf.writeUInt32LE(last, 0);
          buf.writeUInt32LE(n >>> 0, 4);
          writeSync(fd, buf, 0, 8, 0);
        }
        if (Date.now() - started > 180000) throw new Error('pc trace cap after ' + n + ' instructions, last ' + hex(last));
      });
      try {
        return fn();
      } catch (e) {
        let regs = null;
        try { regs = l.sim.registers(); } catch { /* sim already dead */ }
        emit('observe', {
          step: 'fault',
          error: String(e && e.stack ? e.stack : e),
          lastPc: hex(last),
          traced: n,
          regs,
          cpuFault: S.fault ? { code: S.fault.code, addr: hex(S.fault.addr) } : null,
        });
        throw e;
      } finally {
        buf.writeUInt32LE(last >>> 0, 0);
        buf.writeUInt32LE(n >>> 0, 4);
        try { writeSync(fd, buf, 0, 8, 0); } catch { /* file already closed */ }
        setExecTrace(null);
        setForceHelper(false);
        try { closeSync(fd); } catch { /* already closed */ }
        emit('observe', { step: 'trace-end', file, lastPc: hex(last), traced: n });
      }
    };
    const ownBase = opts.ownBase ?? 0xa031ed00;
    const readTarget = () => Array.from(l.sim.read(0xa33ca384, 10));
    const readOwn = () => Array.from(l.sim.read(ownBase, 48));
    // Bring-up split into five functions; each is one gated operation (T13 design_v2 §3). Same calls, same order.
    const initCall = (address) => ({ address: hex(address), ret: l.call(native(address), null, null, null, 2000000).d0 >>> 0 });
    const bringUpSteps = {
      'init-6071181e': () => initCall(0x6071181e),
      'init-608fe1b0': () => initCall(0x608fe1b0),
      'init-609df7e4': () => initCall(0x609df7e4),
      'take-focus-act': () => {
        const tid = l.sim.u32(0x60042da0) & 0xffff;
        const entry = native(0x609df84d);
        if (l.nk.entry(tid) !== entry) throw new Error('TAKE_FOCUS entry ' + hex(l.nk.entry(tid)));
        if (l.nk.state(tid) !== 0x10) throw new Error('TAKE_FOCUS state ' + l.nk.state(tid));
        if (l.sim.read(0xa33f3640, 1)[0] !== 1) throw new Error('TAKE_FOCUS flag');
        l.lt.allow.add(entry);
        const act = l.nk.svc('act_tsk', { d0: tid })[0];
        if (act !== 0) throw new Error('act_tsk ' + act);
        return { tid };
      },
      'take-focus-settle': () => {
        s.settle('E147 native TAKE_FOCUS start');
        const tid = l.sim.u32(0x60042da0) & 0xffff;
        return { tid, state: l.nk.state(tid), queue: l.sim.u32(0x60043230) & 0xffff };
      },
    };
    const bringUp = () => {
      const inits = ['init-6071181e', 'init-608fe1b0', 'init-609df7e4'].map((name) => bringUpSteps[name]());
      bringUpSteps['take-focus-act']();
      return { ...bringUpSteps['take-focus-settle'](), inits };
    };
    const ctx = {
      candidate, help, rowLabel, page28, page28State, tag,
      press, idle, key, screen, shot, cells, emit, takeFaces, trace, walk,
      readByte, word, half, writeU32, writeU16, native, hex, l, s,
      PROFILE, PROFILE_CACHED, ZONE_VALUES, ownBase, readTarget, readOwn, bringUp, bringUpSteps, nvramSaves, outDir,
    };
    emit('behaviour', {
      step: 'explanation',
      label: opts.explanation || '',
      change: opts.change || '',
    });
    idle(1200);
    await drive(ctx);
    emit('observe', { step: 'done', ok: true });
    return { ok: true, failed: null };
  } catch (e) {
    failed = String(e && e.stack ? e.stack : e);
    emit('observe', { step: 'done', ok: false, error: failed });
    process.exitCode = 1;
    return { ok: false, failed };
  } finally {
    if (pl.session) pl.close_session();
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, lines.join('\n') + (lines.length ? '\n' : ''));
  }
}
