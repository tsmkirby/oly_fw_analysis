// Observation v1b. No new behaviour change.
// v1 reached the end of K2 and then threw while writing the summary.
// This run keeps that trace and records the candidate and the stock edit.
// The accepted p3 exit restore stays on the candidate only.
// Watches the bank window the saved M offsets 211472..211516 fall in
// when M is the live bank at 0x62920700, the live half-press cells,
// and the mirror slots. Every watch hit, getter, setter and NAND write
// is appended in order. Nothing is aggregated and nothing is dropped.
// Usage: node26 work/scripts/persist_v1b.mjs om-emu
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout] = process.argv.slice(2);
if (!checkout) {
  process.stderr.write('usage: node26 work/scripts/persist_v1b.mjs om-emu\n');
  process.exit(2);
}
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const OUT = resolve('work/out/persist-v1b.jsonl');
const EVENTS = resolve('work/out/persist-v1b-events.jsonl');
const SUMMARY = resolve('work/out/persist-v1b-summary.json');
const CSV = resolve('work/out/overlay-changed-bytes.csv');
mkdirSync(resolve('work/out'), { recursive: true });
writeFileSync(EVENTS, '');
writeFileSync(OUT, '');

const BASE = 0x60021020;
const GETTER = 0x60063380;
const SETTER = 0x60063431;
const EDITOR_COPY = 0x6119af02;
const GLOBAL_POS = 0x60379d64;
const SHADOW_POS = 0x62953c10;
const BANK = 0x62920700;
const WIN_OFF = 211440;
const WIN_LEN = 176;
const RECORD = 16;
const SHADOW_N = 4;
const OBJECT_OFF = 0x42;
const MODE = 0xa031eef7;
const MODE_CACHED = 0x6031eef7;
const PROFILE = 0xa031e920;
const PROFILE_CACHED = 0x6031e920;
const EXT = 0xa031eeb0;
const EXT_CACHED = 0x6031eeb0;
const DIRECT = 0x0405;
const MENU = 0x0b02;
const SUBJECT = 0x1e71;
const LAYOUT = {
  0x99a1: { off: 0x00, n: 8, width: 1 },
  0x9a41: { off: 0x08, n: 2, width: 1 },
  0x5962: { off: 0x0a, n: 6, width: 2 },
  0x1dd1: { off: 0x16, n: 10, width: 1 },
  0x84d1: { off: 0x20, n: 1, width: 1 },
  0x88b2: { off: 0x22, n: 1, width: 2 },
  0x90d1: { off: 0x24, n: 8, width: 1 },
  0x5a11: { off: 0x2c, n: 11, width: 1 },
  0x1de1: { off: 0x37, n: 8, width: 1 },
  0x1df1: { off: 0x3f, n: 8, width: 1 },
};
const LIVE = {
  k99a1: { addr: 0x6295946c, n: 8, w: 1 },
  k9a41: { addr: 0x62959484, n: 1, w: 1 },
  k5962: { addr: 0x62920bf0, n: 6, w: 2 },
  k1dd1: { addr: 0x62920982, n: 10, w: 1 },
  k84d1: { addr: 0x62920fa5, n: 1, w: 1 },
  k88b2: { addr: 0x629526c0, n: 1, w: 2 },
  k90d1: { addr: 0x62959355, n: 8, w: 1 },
  k5a11: { addr: 0x62920c18, n: 11, w: 1 },
  k1de1: { addr: 0x6292098c, n: 8, w: 1 },
  k1df1: { addr: 0x62920994, n: 9, w: 1 },
};
const WATCH_KEYS = new Set([0x1dd1, 0x1de1, 0x1df1]);
const INTEREST = [211472, 211476, 211480, 211484, 211504, 211508, 211512, 211516, 211552, 211556];

const { loadNand, loadImage, loadBlock, patchedFirmware, createHash: fwHash } = await use('checks/lib/env.mjs');
const { IMAGE_BASE, fact } = await use('src/fw/model.mjs');
const { Player } = await use('src/lab/player.mjs');
const { apply_uiin_layout } = await use('src/lab/play.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const { MenuWalk } = await use('src/lab/menuwalk.mjs');
const { write_png } = await use('checks/lib/png.mjs');
const { words_to_rgb } = await use('src/lab/display.mjs');
const { fileNvram } = await use('host/nvram.mjs');
const { STATE_LOG, NAND_WRITE, STORE_MIRRORS } = await use('src/lab/menu.mjs');

const image = readFileSync(resolve('inputs/00_0100_50000020.decoded.bin'));
const patches = [];
for (const row of readFileSync(CSV, 'utf8').trim().split(/\r?\n/).slice(1)) {
  const [o, , old, next] = row.split(',');
  const off = parseInt(o, 16);
  if (image[off] !== parseInt(old, 16)) throw new Error('overlay stock mismatch at ' + (BASE + off).toString(16));
  const oldB = parseInt(old, 16);
  const neu = parseInt(next, 16);
  const last = patches.at(-1);
  if (last && off === last.offset + last.old.length) { last.old.push(oldB); last.neu.push(neu); }
  else patches.push({ offset: off, old: [oldB], neu: [neu] });
}
const z5fw = patchedFirmware(patches.map((x, n) => ({
  block: 'main', offset: x.offset, old: Uint8Array.from(x.old), new: Uint8Array.from(x.neu), source: CSV, n,
})));
apply_uiin_layout(z5fw.rom);
const stockFw = { rom: loadImage(), resBlock: loadBlock(), summary: null, changed: [] };
apply_uiin_layout(stockFw.rom);

const lines = [];
const summary = {
  experiment: 'persist-v1b',
  change: 'none beyond the accepted p3 exit restore',
  label: 'EMULATOR-ONLY',
  bank: BANK,
  window: { off: WIN_OFF, len: WIN_LEN, addr: BANK + WIN_OFF },
  sessions: {},
};
const emit = (row) => {
  lines.push(JSON.stringify(row));
  console.log(JSON.stringify({ session: row.session, id: row.id, pass: row.pass, problems: row.problems || null }));
  writeFileSync(OUT, lines.join('\n') + '\n');
};
const saveSummary = () => writeFileSync(SUMMARY, JSON.stringify(summary, null, 2) + '\n');
const toDisasm = (address) => (0x50000000 + (address >>> 0) - IMAGE_BASE) >>> 0;
const hex = (n) => '0x' + (n >>> 0).toString(16);

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
const USE_RE = /use\(\s*['"]([^'"]+)['"]\s*\)/g;
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, base + '.mjs', base + '.js', join(base, 'index.mjs'), join(base, 'index.js')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
function inventory(files) {
  const seen = new Map();
  const queue = [...files];
  while (queue.length) {
    const cur = queue.pop();
    if (!cur || seen.has(cur) || !existsSync(cur)) continue;
    const data = readFileSync(cur);
    seen.set(cur, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
    const text = data.toString('utf8');
    for (const re of [IMPORT_RE, USE_RE]) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(text))) {
        const spec = match[1];
        const next = spec.startsWith('.') ? resolveSpec(cur, spec) : resolve(checkout, 'emu', spec);
        if (next && existsSync(next)) queue.push(next);
      }
    }
  }
  return [...seen.entries()].map(([path, meta]) => ({ path: path.replaceAll('\\', '/'), ...meta, hashed: 'execution' }));
}
function boot(overlay, nvramPath) {
  const fw = overlay ? z5fw : stockFw;
  const pl = new Player(
    { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
    {
      ...fw, nand: loadNand(), createHash: fwHash, wallClock: () => performance.now() / 1000,
      machine: { coverage: { mark() {}, stub() {} } }, nvram: fileNvram(resolve(nvramPath)),
      patch: overlay ? fw.summary : null, patchRanges: overlay ? fw.changed : [], loaded: 'on',
    },
  );
  pl.camapp_components = true;
  pl.camapp_native_tra = true;
  return pl;
}
function readStore(file) {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  return { M: Buffer.from(doc.M, 'base64'), E: Buffer.from(doc.E, 'base64') };
}
function compareStores(a, b) {
  const diffs = [];
  for (const bank of ['M', 'E']) {
    const left = a[bank];
    const right = b[bank];
    const n = Math.max(left.length, right.length);
    for (let i = 0; i < n; i++) {
      const av = i < left.length ? left[i] : null;
      const bv = i < right.length ? right[i] : null;
      if (av !== bv) diffs.push({ bank, offset: i, a: av, b: bv });
    }
  }
  return diffs;
}

const [fromReg, toReg] = fact('state_log.regs', ['a0', 'a1']);
let shutdownEntry = null;
try { shutdownEntry = fact('power.off')?.shutdown?.entry >>> 0; }
catch { shutdownEntry = null; }

const PAT_C2 = Buffer.from([1, 0, 0, 0, 33, 0, 0, 0, 1, 0, 0, 0, 33, 0, 0, 0]);
const PAT_C1 = Buffer.from([1, 0, 0, 0, 33, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0]);
const PAT_DE = Buffer.from([5, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0]);

function runSession(name, spec, body) {
  const pl = boot(spec.overlay, spec.nvram);
  let shotN = 0;
  let failed = null;
  const eventLines = [];
  let eventN = 0;
  let currentStep = 'boot';
  const flushEvents = () => {
    if (!eventLines.length) return;
    appendFileSync(EVENTS, eventLines.join('\n') + '\n');
    eventLines.length = 0;
  };
  try {
    summary.sessions[name] = {};
    pl.open_session();
    const s = pl.session;
    const l = s.lab;
    const readByte = (addr) => l.sim.read(addr, 1)[0];
    const writeByte = (addr, value) => { const b = Buffer.alloc(1); b[0] = value & 0xff; l.sim.write(addr, b); };
    const writeU16 = (addr, value) => { const b = Buffer.alloc(2); b.writeUInt16LE(value & 0xffff, 0); l.sim.write(addr, b); };
    const readU16 = (addr) => { const b = l.sim.read(addr, 2); return b[0] | (b[1] << 8); };
    const readBytes = (addr, n) => Buffer.from(l.sim.read(addr >>> 0, n));
    const writeBytes = (addr, buf) => {
      try { l.sim.write(addr >>> 0, buf); return true; }
      catch (e) { return String(e && e.message || e); }
    };
    const aliasOf = (addr) => {
      const a = addr >>> 0;
      if (a >= 0x60000000 && a < 0x80000000) return (a + 0x40000000) >>> 0;
      if (a >= 0xa0000000 && a < 0xc0000000) return (a - 0x40000000) >>> 0;
      return null;
    };
    const slotAddr = (key, index) => {
      const row = LAYOUT[key];
      if (!row || index < 0 || index >= row.n) return null;
      return EXT + row.off + index * row.width;
    };
    const pushEvent = (row) => {
      row.session = name;
      row.n = eventN++;
      row.step = currentStep;
      eventLines.push(JSON.stringify(row));
      if (eventLines.length >= 2000) flushEvents();
    };
    const callerRegs = () => {
      try {
        const g = l.sim.m.getRegs();
        return {
          caller: g[11] >>> 0,
          d0: g[0] >>> 0, d1: g[1] >>> 0, a0: g[4] >>> 0, a1: g[5] >>> 0, sp: g[8] >>> 0,
        };
      } catch (e) {
        return { caller: null, regError: String(e && e.message || e) };
      }
    };
    const onLog = (rec) => {
      try {
        const regs = callerRegs();
        pushEvent({
          dir: rec.dir, addr: rec.addr >>> 0, size: rec.size, value: rec.value >>> 0,
          pc: rec.pc >>> 0, watch: rec.id, flag: readByte(MODE), ...regs,
        });
      } catch (e) {
        pushEvent({ dir: 'watch-error', error: String(e && e.message || e) });
      }
    };
    const getQueue = [];
    const armedRet = new Set();
    const armGetRet = (r) => {
      const key = r.d0 & 0xffff;
      if (!WATCH_KEYS.has(key)) return;
      const mdr = r.mdr >>> 0;
      const index = r.d1 & 0xffff;
      if (!mdr) return;
      if (!armedRet.has(mdr) && l.hooks.has(mdr)) {
        pushEvent({ dir: 'get-ret-blocked', key, index, caller: mdr });
        return;
      }
      getQueue.push({ mdr, key, index });
      if (armedRet.has(mdr)) return;
      try {
        l.hook_rt(mdr, (_h, rr) => {
          for (let i = getQueue.length - 1; i >= 0; i--) {
            if (getQueue[i].mdr === mdr) {
              const job = getQueue.splice(i, 1)[0];
              pushEvent({
                dir: 'get-ret', key: job.key, index: job.index, caller: mdr,
                value: rr.d0 & 0xffff, flag: readByte(MODE),
              });
              break;
            }
          }
          l.passthrough(rr);
        }, 'obs-get-ret', true);
        armedRet.add(mdr);
      } catch (e) {
        pushEvent({ dir: 'get-ret-arm-error', caller: mdr, key, index, error: String(e && e.message || e) });
      }
    };
    const logApi = (dir, r, extra) => {
      const key = r.d0 & 0xffff;
      if (!WATCH_KEYS.has(key)) return;
      pushEvent({
        dir, key, index: r.d1 & 0xffff, value: dir === 'set' ? (r.a1 & 0xffff) : (extra.ret ?? null),
        caller: r.mdr >>> 0, pc: r.pc >>> 0, flag: readByte(MODE), ...extra,
      });
    };
    const watchList = (kind) => {
      const add = (id, lo, n) => ({ id, lo: lo >>> 0, hi: (lo + n) >>> 0, kind });
      const rows = [
        add('bank', BANK + WIN_OFF, WIN_LEN),
        add('bank-alias', (BANK + WIN_OFF + 0x40000000) >>> 0, WIN_LEN),
        add('live-1dd1', 0x62920982, 10),
        add('live-1de1', 0x6292098c, 8),
        add('live-1df1', 0x62920994, 9),
        add('live-1dd1-alias', 0xa2920982, 10),
        add('live-1de1-alias', 0xa292098c, 8),
        add('live-1df1-alias', 0xa2920994, 9),
        add('mirror', EXT + 0x16, 10),
        add('mirror-de', EXT + 0x37, 8),
        add('mirror-df', EXT + 0x3f, 8),
        add('mirror-c', EXT_CACHED + 0x16, 10),
        add('mirror-de-c', EXT_CACHED + 0x37, 8),
        add('mirror-df-c', EXT_CACHED + 0x3f, 8),
      ];
      return rows;
    };
    let watchKind = 0;
    const setWatch = (kind) => {
      if (watchKind === kind) return;
      l.sim.m.setWatchpoints(kind ? watchList(kind) : [], { onLog });
      watchKind = kind;
    };
    const exitLog = [];
    const st = { zoneSnap: null, sizeOpen: false, inited: false, exitAt: 0, held: null, globalSnap: null, shadowSnap: null, heldPos: null };
    let editorObj = null;
    let copiesWhileFlag = 0;
    let armCopy = false;
    const st16 = (v) => (v >>> 0) & 0xffff;
    const restoreLeaks = (why) => {
      const log = { why, editor: editorObj ? hex(editorObj) : null };
      if (st.globalSnap) {
        log.global = writeBytes(GLOBAL_POS, st.globalSnap);
        log.globalAlias = writeBytes(aliasOf(GLOBAL_POS), st.globalSnap);
      }
      if (st.shadowSnap) {
        log.shadow = writeBytes(SHADOW_POS, st.shadowSnap);
        log.shadowAlias = writeBytes(aliasOf(SHADOW_POS), st.shadowSnap);
      }
      if (editorObj && st.heldPos !== null) {
        const at = (editorObj + OBJECT_OFF) >>> 0;
        const rec = readBytes(at, RECORD);
        rec.writeUInt16LE(st.heldPos & 0xffff, 0);
        log.object = writeBytes(at, rec);
        const al = aliasOf(editorObj);
        if (al !== null) log.objectAlias = writeBytes((al + OBJECT_OFF) >>> 0, rec);
      }
      return log;
    };
    const noteEntry = () => {
      if (readByte(MODE) === 1 && st.zoneSnap === null) {
        st.zoneSnap = readByte(PROFILE);
        st.globalSnap = readBytes(GLOBAL_POS, RECORD);
        st.shadowSnap = readBytes(SHADOW_POS, SHADOW_N);
        st.heldPos = st.held ? st.held.k5962[1] : readU16(LIVE.k5962.addr + 2);
        editorObj = null;
        copiesWhileFlag = 0;
        armCopy = false;
      }
    };
    const initMirror = () => {
      if (st.inited || readByte(MODE) !== 1) return;
      st.inited = true;
      for (const row of Object.values(LAYOUT)) {
        for (let i = 0; i < row.n; i++) {
          const addr = EXT + row.off + i * row.width;
          if (row.width === 2) { if (readU16(addr) === 0xffff) writeU16(addr, 0); }
          else if (readByte(addr) === 0xff) writeByte(addr, 0);
        }
      }
    };
    const leave = (why) => {
      if (readByte(MODE) !== 1) return false;
      const restore = st.zoneSnap === null ? readByte(PROFILE) : st.zoneSnap;
      writeByte(MODE, 0);
      writeByte(MODE_CACHED, 0);
      writeByte(PROFILE, restore);
      writeByte(PROFILE_CACHED, restore);
      const leaks = restoreLeaks('leave-' + why);
      armCopy = copiesWhileFlag === 0;
      exitLog.push({ why, restore, leaks });
      st.zoneSnap = null;
      st.sizeOpen = false;
      st.inited = false;
      return true;
    };
    if (spec.hooks) {
      l.hook(toDisasm(GETTER), (h, r) => {
        if (armCopy && readByte(MODE) !== 1 && ((l.state() & 0xffff) === DIRECT)) armCopy = false;
        initMirror();
        noteEntry();
        const key = r.d0 & 0xffff;
        const index = r.d1 & 0xffff;
        const addr = readByte(MODE) === 1 ? slotAddr(key, index) : null;
        if (addr === null) {
          logApi('get', r, { routed: false, ret: null });
          armGetRet(r);
          l.passthrough(r);
          return;
        }
        const ret = LAYOUT[key].width === 2 ? readU16(addr) : readByte(addr);
        logApi('get', r, { routed: true, ret });
        h.finish(r, { d0: ret });
      }, 'EMULATOR-ONLY routing: AF-ON getter, flag 0xa031eef7');
      l.hook(toDisasm(SETTER), (h, r) => {
        initMirror();
        noteEntry();
        const key = r.d0 & 0xffff;
        const index = r.d1 & 0xffff;
        const addr = readByte(MODE) === 1 ? slotAddr(key, index) : null;
        if (addr === null) {
          logApi('set', r, { routed: false });
          l.passthrough(r);
          return;
        }
        if (LAYOUT[key].width === 2) writeU16(addr, r.a1 >>> 0);
        else writeByte(addr, r.a1 >>> 0);
        if (key === 0x99a1 && (index === 0 || index === 1)) {
          writeByte(PROFILE, r.a1 & 0xff);
          writeByte(PROFILE_CACHED, r.a1 & 0xff);
        }
        logApi('set', r, { routed: true });
        h.finish(r, { d0: 0 });
      }, 'EMULATOR-ONLY routing: AF-ON setter, flag 0xa031eef7');
      const pendingCopy = new Map();
      l.hook(toDisasm(EDITOR_COPY), (h, r) => {
        const flag = readByte(MODE) === 1;
        const armed = flag || armCopy;
        if (flag) copiesWhileFlag += 1;
        if (armed && (r.a0 >>> 0) >= 0x60000000) editorObj = r.a0 >>> 0;
        const mdr = r.mdr >>> 0;
        if (armed && mdr) {
          pendingCopy.set(mdr, { flag, arm: armCopy });
          if (!l.hooks.has(mdr)) {
            try {
              l.hook_rt(mdr, (_hh, rr) => {
                const job = pendingCopy.get(mdr);
                pendingCopy.delete(mdr);
                if (job?.flag) restoreLeaks('copy-while-flag');
                else if (job?.arm) { restoreLeaks('copy-after-leave'); armCopy = false; }
                l.passthrough(rr);
              }, 'EMULATOR-ONLY exit: editor copy returned');
            } catch { pendingCopy.delete(mdr); }
          }
        }
        l.passthrough(r);
      }, 'EMULATOR-ONLY exit: restore editor position copies');
      l.wrap(STATE_LOG, (prev) => (h, r) => {
        const event = r.d0 >>> 0;
        const oldSt = st16(r[fromReg]);
        const newSt = st16(r[toReg]);
        const result = prev(h, r);
        if (readByte(MODE) === 1 && oldSt === DIRECT && newSt !== DIRECT) leave('direct-' + (event & 0xffff).toString(16));
        else if (readByte(MODE) === 1 && oldSt === MENU) {
          const ev = event & 0xffff;
          if (ev === 0x900b) st.sizeOpen = true;
          else if (st.sizeOpen && (ev === 0x900d || ev === 0x900e)) leave('size-' + ev.toString(16));
        }
        return result;
      }, 'EMULATOR-ONLY exit: clear 0xa031eef7 and restore 0xa031e920');
      if (shutdownEntry) l.observe(shutdownEntry, () => { leave('session-end'); }, 'EMULATOR-ONLY exit: session-end shutDown');
    } else {
      l.observe(toDisasm(GETTER), (_lab, r) => {
        logApi('get', r, { routed: false, ret: null });
        armGetRet(r);
      }, 'obs-getter');
      l.observe(toDisasm(SETTER), (_lab, r) => logApi('set', r, { routed: false }), 'obs-setter');
    }
    const noteNand = (r) => {
      const src = r.a0 >>> 0;
      const dst = r.a1 >>> 0;
      const size = r.d0 >>> 0;
      let window = null;
      let interest = null;
      try {
        if (size >= WIN_OFF + WIN_LEN) {
          window = readBytes(src + WIN_OFF, WIN_LEN).toString('hex');
          interest = {};
          for (const off of INTEREST) interest[off] = readByte(src + off);
        }
      } catch (e) {
        window = String(e && e.message || e);
      }
      const nameOf = Object.entries(STORE_MIRRORS).find(([, row]) => row[0] === dst);
      pushEvent({
        dir: 'nand', src, dst, size, caller: r.mdr >>> 0, pc: r.pc >>> 0,
        store: nameOf ? nameOf[0] : null, flag: readByte(MODE),
        srcIsBank: src === BANK, window, interest,
      });
    };
    l.wrap(NAND_WRITE, (prev) => (h, r) => {
      noteNand(r);
      return prev(h, r);
    }, 'obs-nand');
    const callSaved = (fn) => {
      const saved = l.sim.registers();
      try { return fn(); }
      finally { l.sim.reset(saved); }
    };
    const readKey = (key, index) => callSaved(() => l.call(toDisasm(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff);
    const cell = (addr, n) => Array.from(readBytes(addr, n));
    const mirrorCells = () => ({
      k1dd1: cell(EXT + 0x16, 10),
      k1de1: cell(EXT + 0x37, 8),
      k1df1: cell(EXT + 0x3f, 8),
    });
    const liveCells = () => ({
      k1dd1: cell(0x62920982, 10),
      k1de1: cell(0x6292098c, 8),
      k1df1: cell(0x62920994, 9),
    });
    const windowBytes = () => readBytes(BANK + WIN_OFF, WIN_LEN);
    const interestOf = (buf, base) => {
      const out = {};
      for (const off of INTEREST) {
        const i = off - base;
        out[off] = i >= 0 && i < buf.length ? buf[i] : null;
      }
      return out;
    };
    const findPat = (buf, base, pat) => {
      const hits = [];
      let from = 0;
      while (from <= buf.length - pat.length) {
        const i = buf.indexOf(pat, from);
        if (i < 0) break;
        hits.push((base + i) >>> 0);
        from = i + 1;
        if (hits.length >= 24) break;
      }
      return { hits, truncated: hits.length >= 24 };
    };
    const scanBank = () => {
      const bank = readBytes(BANK, 0x40000);
      return {
        c1: findPat(bank, BANK, PAT_C1),
        c2: findPat(bank, BANK, PAT_C2),
        de: findPat(bank, BANK, PAT_DE),
      };
    };
    const idle = (ms) => { const to = l.lab_time() + ms * 1e6; while (l.lab_time() < to) s.idle_slice(Math.min(to, l.lab_time() + 50e6)); };
    const press = (k) => { s.key(k, 'down'); s.camapp.pump(); idle(80); s.key(k, 'up'); s.camapp.pump(); idle(500); };
    const dial = (which) => { s.dial_input(which, 1); s.camapp.pump(); idle(500); };
    const walk = new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 48 });
    const titleHash = (frame) => {
      const [w, h, words] = frame;
      const y1 = Math.max(1, Math.min(h, Math.floor(h * 0.16)));
      const x0 = Math.floor(w * 0.22);
      const x1 = Math.floor(w * 0.78);
      const buf = Buffer.alloc((x1 - x0) * y1 * 4);
      let o = 0;
      for (let y = 0; y < y1; y++) for (let x = x0; x < x1; x++) { buf.writeUInt32LE(words[y * w + x] >>> 0, o); o += 4; }
      return createHash('sha256').update(buf).digest('hex');
    };
    const setMode = (value) => { writeByte(MODE, value); writeByte(MODE_CACHED, value); };
    const enter = () => {
      if (readByte(MODE) === 1) throw new Error('enter while the flag is set');
      st.held = { k5962: cell(LIVE.k5962.addr, 12) };
      st.held.k5962 = [readU16(LIVE.k5962.addr), readU16(LIVE.k5962.addr + 2)];
      st.sizeOpen = false;
      st.zoneSnap = null;
      st.inited = false;
      st.globalSnap = null;
      st.shadowSnap = null;
      editorObj = null;
      copiesWhileFlag = 0;
      armCopy = false;
      setMode(1);
      readKey(0x99a1, 0);
      st.exitAt = exitLog.length;
      return st.zoneSnap;
    };
    let prevWindow = null;
    const step = (id, opts = {}) => {
      currentStep = id;
      setWatch(opts.access ? 3 : 2);
      const eventFrom = eventN;
      const frame = (() => {
        try { const f = walk.read().frame; if (f) return f; }
        catch { /* text can fail */ }
        return s.frame('boundary');
      })();
      if (!frame) throw new Error('screenshot failed at ' + name + ' ' + id);
      const file = resolve('work/out/persist-v1b-' + name + '-' + String(shotN).padStart(2, '0') + '-' + id + '.png');
      shotN += 1;
      write_png(file, frame[0], frame[1], words_to_rgb(frame[2]));
      const win = windowBytes();
      const interest = interestOf(win, WIN_OFF);
      let changed = [];
      if (prevWindow) {
        for (let i = 0; i < win.length; i++) if (win[i] !== prevWindow[i]) changed.push(WIN_OFF + i);
      }
      prevWindow = Buffer.from(win);
      flushEvents();
      const row = {
        session: name, id, role: spec.hooks ? 'behaviour' : 'control',
        pass: true, problems: [],
        screen: s.screen(), state: l.state() & 0xffff,
        flag: readByte(MODE), zone: readByte(PROFILE),
        title: titleHash(frame),
        screenshot: file.split(/[/\\]/).pop(),
        saves: (l.store_log?.nvram?.saves ?? []).length,
        live: liveCells(), mirror: mirrorCells(),
        interest, changed, eventFrom, eventTo: eventN,
        exits: exitLog.length,
      };
      if (opts.scan) row.scan = scanBank();
      emit(row);
      return row;
    };
    setWatch(2);
    const texts = () => {
      try { return walk.read().texts.map((t) => t.text); }
      catch { return []; }
    };
    const ctx = {
      press, dial, idle, enter, step, texts, readKey, s,
      toShooting(tag) {
        let i = 0;
        while (s.screen() !== 'shooting' && i < 4) {
          press('menu');
          step(tag + '-' + i, { access: true });
          i += 1;
        }
        if (s.screen() !== 'shooting') throw new Error(tag + ' stayed on ' + s.screen());
      },
      saves: () => (l.store_log?.nvram?.saves ?? []).map((x) => ({ store: x.store, from: x.from, posted: !!x.posted })),
    };
    body(ctx);
    flushEvents();
    Object.assign(summary.sessions[name], { events: eventN, exits: exitLog.length, shots: shotN });
    saveSummary();
  } catch (e) {
    failed = String(e && e.stack ? e.stack : e);
    flushEvents();
    emit({ session: name, id: name + '-stopped', role: spec.hooks ? 'behaviour' : 'control', pass: false, problems: ['stopped'], error: failed });
  } finally {
    try { if (pl.session) pl.close_session(); } catch { /* already closed */ }
    flushEvents();
    writeFileSync(OUT, lines.join('\n') + (lines.length ? '\n' : ''));
  }
  if (failed) throw new Error(name + ' stopped: ' + failed);
}

const sizeNav = (ctx) => {
  ctx.press('menu');
  ctx.step('size-menu');
  let found = false;
  const seen = [];
  for (let i = 0; i < 24; i++) {
    const texts = ctx.texts();
    if (texts.some((t) => String(t).includes('AF Target Settings'))) { found = true; break; }
    seen.push(texts.slice(0, 8));
    ctx.press('left');
    ctx.step('size-tab-' + i);
  }
  if (!found) throw new Error('AF Target Settings not found ' + JSON.stringify(seen.at(-1) || []));
  ctx.press('ok');
  ctx.step('size-page');
  for (let i = 0; i < 5; i++) {
    ctx.press('down');
    ctx.step('size-down-' + i);
  }
};
const editKeys = (ctx, prefix, withFlag) => {
  if (withFlag) {
    ctx.enter();
    ctx.step(prefix + '-enter', { access: true });
  }
  ctx.press('right');
  ctx.step(prefix + '-right', { access: true });
  ctx.dial('main');
  ctx.step(prefix + '-dial', { access: true });
  ctx.dial('sub');
  ctx.step(prefix + '-sub', { access: true });
  ctx.press('ok');
  ctx.step(prefix + '-ok', { access: true, scan: true });
};
const saveMenu = (ctx) => {
  const before = ctx.saves().length;
  ctx.press('menu');
  ctx.step('save-open', { access: true });
  ctx.press('menu');
  ctx.step('save-close', { access: true, scan: true });
  return { before, after: ctx.saves() };
};

let failed = null;
try {
  runSession('k2', { overlay: true, hooks: false, nvram: 'work/out/nvram-persist-v1b-k2.json' }, (ctx) => {
    ctx.idle(700);
    const subject = ctx.readKey(SUBJECT, 0);
    if (subject !== 0) throw new Error('0x1e71[0] is ' + subject);
    ctx.step('base');
    sizeNav(ctx);
    ctx.toShooting('size-leave');
    const saved = saveMenu(ctx);
    summary.sessions.k2.subject = subject;
    summary.sessions.k2.saves = saved;
    saveSummary();
  });
  runSession('c', { overlay: true, hooks: true, nvram: 'work/out/nvram-persist-v1b-c.json' }, (ctx) => {
    ctx.idle(700);
    const subject = ctx.readKey(SUBJECT, 0);
    if (subject !== 0) throw new Error('0x1e71[0] is ' + subject);
    ctx.step('base');
    sizeNav(ctx);
    editKeys(ctx, 'c1', true);
    ctx.press('down');
    ctx.step('c2-down', { access: true });
    editKeys(ctx, 'c2', true);
    ctx.toShooting('size-leave');
    const saved = saveMenu(ctx);
    summary.sessions.c.subject = subject;
    summary.sessions.c.saves = saved;
    saveSummary();
  });
  runSession('k2e', { overlay: true, hooks: false, nvram: 'work/out/nvram-persist-v1b-k2e.json' }, (ctx) => {
    ctx.idle(700);
    const subject = ctx.readKey(SUBJECT, 0);
    if (subject !== 0) throw new Error('0x1e71[0] is ' + subject);
    ctx.step('base');
    sizeNav(ctx);
    editKeys(ctx, 'c1', false);
    ctx.press('down');
    ctx.step('c2-down', { access: true });
    editKeys(ctx, 'c2', false);
    ctx.toShooting('size-leave');
    const saved = saveMenu(ctx);
    summary.sessions.k2e.subject = subject;
    summary.sessions.k2e.saves = saved;
    saveSummary();
  });
  const k2s = readStore('work/out/nvram-persist-v1b-k2.json');
  const cs = readStore('work/out/nvram-persist-v1b-c.json');
  const k2e = readStore('work/out/nvram-persist-v1b-k2e.json');
  const ck = compareStores(k2s, cs);
  const ek = compareStores(k2s, k2e);
  summary.stores = {
    cMinusK2: ck,
    k2eMinusK2: ek,
    cCount: ck.length,
    k2eCount: ek.length,
  };
  emit({
    session: 'compare', id: 'stores', role: 'control', pass: true, problems: [],
    expected: { note: 'every differing offset, no truncation' },
    actual: { cMinusK2: ck, k2eMinusK2: ek },
  });
  summary.ok = true;
  saveSummary();
  emit({ session: 'done', id: 'done', role: 'behaviour', pass: true, problems: [], ok: true });
} catch (e) {
  failed = String(e && e.stack ? e.stack : e);
  summary.ok = false;
  summary.error = failed;
  saveSummary();
  emit({ session: 'done', id: 'done', role: 'behaviour', pass: false, problems: ['stopped'], ok: false, error: failed });
}
writeFileSync(resolve('work/out/import-inventory-persist-v1b.json'), JSON.stringify({
  hashed: 'execution',
  change: 'none beyond the accepted p3 exit restore',
  label: 'EMULATOR-ONLY',
  modules: inventory([
    resolve('work/scripts/persist_v1b.mjs'),
    resolve(checkout, 'emu/src/lab/player.mjs'),
    resolve(checkout, 'emu/src/lab/menu.mjs'),
    resolve(checkout, 'emu/checks/lib/env.mjs'),
    resolve(checkout, 'emu/src/fw/model.mjs'),
    resolve(checkout, 'emu/host/nvram.mjs'),
  ]),
}, null, 2) + '\n');
if (failed) process.exit(1);
