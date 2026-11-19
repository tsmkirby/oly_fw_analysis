// T8c combined hook. Accepted T6 read and T3m restore.
// The one behaviour change is bank(): the saved index the stock direct screen writes.
// initMirror is unchanged. Q2 reset values are the values it already writes.
// This copy adds a read log. bank() and initMirror() are the confirmed functions.
// EMULATOR-ONLY. Role: behaviour. Do not edit after this runs.
import { FACTORY_HALF, factorySlots } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';

const GETTER = 0x60063380;
const SETTER = 0x60063431;
const EDITOR_COPY = 0x6119af02;
const GLOBAL_POS = 0x60379d64;
const SHADOW_POS = 0x62953c10;
const SIZE_REC = 0x62954108;
const SIZE_N = 72;
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
const POSE = 0xa32c568c;
const RET_ZONE = 0x60a8f71c;
const RET_SIZE = 0x60a8f757;
const RET_POS = 0x60a8f76e;
const RET_PLUS9 = 0x60a8f789;
const CALL_CONV = 0x60a8f71f;
const BACK_CONV = 0x60a8f726;
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
const FACTORY = factorySlots();
const LIVE = { k5962: { addr: 0x62920bf0, n: 6, w: 2 } };

function callSaved(ctx, fn) {
  const saved = ctx.l.sim.registers();
  try { return fn(); }
  finally { ctx.l.sim.reset(saved); }
}
function readGetter(ctx, key, index) {
  return callSaved(ctx, () => ctx.l.call(ctx.native(GETTER), { d0: key, d1: index, a0: 0 }, null, null, 200000).d0 & 0xffff);
}
function setKey(ctx, key, index, value) {
  callSaved(ctx, () => ctx.l.call(ctx.native(SETTER), { d0: key, d1: index, a1: value }, null, null, 200000));
}
export { FACTORY_HALF, GETTER, SETTER, MODE, EXT, POSE, LAYOUT, SIZE_REC, SIZE_N, readGetter, setKey };
export function installCombined(ctx, modelMod, menuMod) {
  const l = ctx.l;
  const readByte = (a) => l.sim.read(a, 1)[0];
  const writeByte = (a, v) => { l.sim.write(a >>> 0, Buffer.from([v & 0xff])); };
  const readU16 = (a) => { const b = l.sim.read(a, 2); return b[0] | (b[1] << 8); };
  const writeU16 = (a, v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v & 0xffff, 0); l.sim.write(a >>> 0, b); };
  const readBytes = (a, n) => Buffer.from(l.sim.read(a, n));
  const writeBytes = (a, buf) => { try { l.sim.write(a >>> 0, buf); return true; } catch (e) { return String(e && e.message || e); } };
  const aliasOf = (addr) => {
    const a = addr >>> 0;
    if (a >= 0x60000000 && a < 0x80000000) return (a + 0x40000000) >>> 0;
    if (a >= 0xa0000000 && a < 0xc0000000) return (a - 0x40000000) >>> 0;
    return null;
  };
  const st = { zoneSnap: null, sizeOpen: false, inited: false, globalSnap: null, shadowSnap: null, heldPos: null, sizeSnap: null };
  let editorObj = null;
  let copiesWhileFlag = 0;
  let armCopy = false;
  let inConv = false;
  const link = { area: 0, pos: 0 };
  const counts = { zone: 0, size: 0, pos: 0, plus9: 0, dim: 0 };
  const reads = [];
  const slotAddr = (key, index) => {
    const row = LAYOUT[key];
    if (!row || index >= row.n) return null;
    return (EXT + row.off + index * row.width) >>> 0;
  };
  const initMirror = () => {
    if (st.inited || readByte(MODE) !== 1) return;
    st.inited = true;
    for (const slot of FACTORY) {
      const addr = slotAddr(slot.key, slot.index);
      if (addr === null) continue;
      if (slot.width === 2) { if (readU16(addr) === 0xffff) writeU16(addr, slot.value); }
      else if (readByte(addr) === 0xff) writeByte(addr, slot.value);
    }
  };
  const noteEntry = () => {
    if (readByte(MODE) === 1 && st.zoneSnap === null) {
      st.zoneSnap = readByte(PROFILE);
      st.globalSnap = readBytes(GLOBAL_POS, RECORD);
      st.shadowSnap = readBytes(SHADOW_POS, SHADOW_N);
      st.sizeSnap = readBytes(SIZE_REC, SIZE_N);
      st.heldPos = readU16(LIVE.k5962.addr + 2);
      editorObj = null;
      copiesWhileFlag = 0;
      armCopy = false;
    }
  };
  const restoreLeaks = (why) => {
    const log = { why, editor: editorObj ? (editorObj >>> 0).toString(16) : null };
    if (st.globalSnap) {
      log.global = writeBytes(GLOBAL_POS, st.globalSnap);
      log.globalAlias = writeBytes(aliasOf(GLOBAL_POS), st.globalSnap);
    }
    if (st.shadowSnap) {
      log.shadow = writeBytes(SHADOW_POS, st.shadowSnap);
      log.shadowAlias = writeBytes(aliasOf(SHADOW_POS), st.shadowSnap);
    }
    if (st.sizeSnap) {
      log.size = writeBytes(SIZE_REC, st.sizeSnap);
      const sizeAlias = aliasOf(SIZE_REC);
      if (sizeAlias !== null) log.sizeAlias = writeBytes(sizeAlias, st.sizeSnap);
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
  const leave = (why) => {
    if (readByte(MODE) !== 1) return false;
    const restore = st.zoneSnap === null ? readByte(PROFILE) : st.zoneSnap;
    writeByte(MODE, 0);
    writeByte(MODE_CACHED, 0);
    writeByte(PROFILE, restore);
    writeByte(PROFILE_CACHED, restore);
    restoreLeaks('leave-' + why);
    armCopy = copiesWhileFlag === 0;
    st.zoneSnap = null;
    st.sizeSnap = null;
    st.sizeOpen = false;
    st.inited = false;
    return true;
  };
  const refresh = () => {
    link.area = readGetter(ctx, 0x1db1, 0);
    link.pos = readGetter(ctx, 0x1dc1, 0);
  };
  const bank = () => {
    // Stock direct screen, T8c Q1: saved index. Linked pose word 2 -> 4,
    // pose word 4 -> 2, otherwise 0. Not linked -> 0.
    if (!(link.area === 1 && link.pos === 1)) return 0;
    const pose = l.sim.u32(POSE) >>> 0;
    if (pose === 2) return 4;
    if (pose === 4) return 2;
    return 0;
  };
  l.observe(ctx.native(CALL_CONV), () => { inConv = true; }, 'obs-builder-converter');
  l.observe(ctx.native(BACK_CONV), () => { inConv = false; }, 'obs-builder-converter-back');
  l.hook(ctx.native(GETTER), (h, r) => {
    if (armCopy && readByte(MODE) !== 1 && ((l.state() & 0xffff) === DIRECT)) armCopy = false;
    initMirror();
    noteEntry();
    const back = r.mdr >>> 0;
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    const b = bank();
    const noteRead = (kind) => {
      reads.push({ kind, bank: b, pose: l.sim.u32(POSE) >>> 0, key, index });
    };
    if (back === RET_ZONE) {
      counts.zone += 1;
      noteRead('zone');
      let v = readByte(EXT + b);
      if (v === 0xff) v = readByte(PROFILE);
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_SIZE) {
      counts.size += 1;
      let v = readByte(EXT + 0x08);
      if (v === 0xff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_POS) {
      counts.pos += 1;
      noteRead('pos');
      let v = readU16(EXT + 0x0a + b * 2);
      if (v === 0xffff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    if (back === RET_PLUS9) { counts.plus9 += 1; h.finish(r, { d0: 0 }); return; }
    if (inConv && key === 0x1dd1) {
      counts.dim += 1;
      let v = readByte(EXT + 0x16 + (index & 0xff));
      if (v === 0xff) v = 0;
      h.finish(r, { d0: v });
      return;
    }
    const addr = readByte(MODE) === 1 ? slotAddr(key, index) : null;
    if (addr === null) { l.passthrough(r); return; }
    const ret = LAYOUT[key].width === 2 ? readU16(addr) : readByte(addr);
    h.finish(r, { d0: ret });
  }, 'EMULATOR-ONLY profile read. The bank is the saved index the stock editor writes. Role: behaviour.');
  l.hook(ctx.native(SETTER), (h, r) => {
    initMirror();
    noteEntry();
    const key = r.d0 & 0xffff;
    const index = r.d1 & 0xffff;
    const addr = readByte(MODE) === 1 ? slotAddr(key, index) : null;
    if (addr === null) { l.passthrough(r); return; }
    if (LAYOUT[key].width === 2) writeU16(addr, r.a1 >>> 0);
    else writeByte(addr, r.a1 >>> 0);
    if (key === 0x99a1 && (index === 0 || index === 1)) {
      writeByte(PROFILE, r.a1 & 0xff);
      writeByte(PROFILE_CACHED, r.a1 & 0xff);
    }
    h.finish(r, { d0: 0 });
  }, 'EMULATOR-ONLY editor setter routing. Role: behaviour.');
  const pendingCopy = new Map();
  l.hook(ctx.native(EDITOR_COPY), (h, r) => {
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
            if (job && job.flag) restoreLeaks('copy-while-flag');
            else if (job && job.arm) { restoreLeaks('copy-after-leave'); armCopy = false; }
            l.passthrough(rr);
          }, 'EMULATOR-ONLY exit: editor copy returned');
        } catch { pendingCopy.delete(mdr); }
      }
    }
    l.passthrough(r);
  }, 'EMULATOR-ONLY exit: restore editor position copies and the 72-byte record. Role: behaviour.');
  const [fromReg, toReg] = modelMod.fact('state_log.regs', ['a0', 'a1']);
  l.wrap(menuMod.STATE_LOG, (prev) => (h, r) => {
    const event = r.d0 >>> 0;
    const oldSt = (r[fromReg] >>> 0) & 0xffff;
    const newSt = (r[toReg] >>> 0) & 0xffff;
    const result = prev(h, r);
    if (readByte(MODE) === 1 && oldSt === DIRECT && newSt !== DIRECT) leave('direct-' + (event & 0xffff).toString(16));
    else if (readByte(MODE) === 1 && oldSt === MENU) {
      const ev = event & 0xffff;
      if (ev === 0x900b) st.sizeOpen = true;
      else if (st.sizeOpen && (ev === 0x900d || ev === 0x900e)) leave('size-' + ev.toString(16));
    }
    return result;
  }, 'EMULATOR-ONLY exit: clear the flag and restore the zone byte. Role: behaviour.');
  let shutdownEntry = null;
  try { shutdownEntry = modelMod.fact('power.off')?.shutdown?.entry >>> 0; } catch { shutdownEntry = null; }
  if (shutdownEntry) l.observe(shutdownEntry, () => { leave('session-end'); }, 'EMULATOR-ONLY exit: session-end shutDown');
  const enter = () => {
    if (readByte(MODE) === 1) throw new Error('enter while the flag is set');
    st.sizeOpen = false;
    st.zoneSnap = null;
    st.inited = false;
    st.globalSnap = null;
    st.shadowSnap = null;
    st.sizeSnap = null;
    st.heldPos = null;
    editorObj = null;
    copiesWhileFlag = 0;
    armCopy = false;
    writeByte(MODE, 1);
    writeByte(MODE_CACHED, 1);
    readGetter(ctx, 0x99a1, 0);
  };
  return { refresh, counts, enter, readByte, reads, bank };
}

