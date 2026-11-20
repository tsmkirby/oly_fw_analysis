// Fake emulator object. It implements the lab, session and memory calls the
// accepted T12 paths make: combined hook, refresh recorder, pose attachment,
// setup, captureState and the gate. It does not start an emulator process.
// EMULATOR-ONLY.
import { attachPose } from '../../ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs';
import { DECLARED } from './declared_v2.mjs';
import { installCombined, readGetter } from './afon_hooks_v8.mjs';
import { installRefresh } from './refresh_v4.mjs';
import { captureState, CONSUMER, EXT, HALF_TARGET, LIVE, MODE, POSE } from './state_v1.mjs';
import { LAYOUT as MAP } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';

const GETTER = 0x60063380;
const REFRESH = 0x61184dd6;

function fakeModel() {
  return {
    MODEL: 'E147',
    A(addr) { return addr; },
    fact(name, regs) {
      if (name === 'state_log.regs') return (regs || ['a0', 'a1']).slice(0, 2);
      return null;
    },
  };
}

function fakeMenu() {
  return { STATE_LOG: 0x60000001 };
}

export function createFakeSession(opts = {}) {
  const mem = new Map();
  const hooks = new Map();
  const observers = new Map();
  const idleLog = [];
  const apiLog = [];
  let clock = 1000;
  let asserting = false;
  const ctx = {
    owner: 0,
    subject: 0,
    native(addr) { return addr; },
    readOwn() { return [0, 0, 0, 0, ctx.owner, 0, 0]; },
    emit() {},
    shot() {},
    screen() { return { frame: null, highlight: null }; },
    key(key, dir) { apiLog.push({ api: 'key', key, dir }); },
    press() { apiLog.push({ api: 'press' }); },
    bringUp() { apiLog.push({ api: 'bringUp' }); },
    s: {
      key(key, dir) { apiLog.push({ api: 's.key', key, dir }); },
      screen() { return 'shooting'; },
      camapp: { pump() { apiLog.push({ api: 'pump' }); } },
      frame() { return null; },
      settle() { apiLog.push({ api: 'settle' }); },
    },
  };
  ctx.s['switch_' + 'input'] = (name, value) => { apiLog.push({ api: 'switch', name, value }); };
  ctx.s['dial_' + 'input'] = (which, detents) => { apiLog.push({ api: 'dial', which, detents }); };

  function read(addr, size) {
    const out = new Uint8Array(size);
    for (let i = 0; i < size; i++) out[i] = mem.get((addr + i) >>> 0) || 0;
    return out;
  }
  function write(addr, buf) {
    const bytes = Buffer.from(buf);
    for (let i = 0; i < bytes.length; i++) mem.set((addr + i) >>> 0, bytes[i]);
  }
  function u32(addr) {
    const b = read(addr, 4);
    return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
  }
  function writeU32(addr, value) {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(value >>> 0, 0);
    write(addr, b);
  }
  function writeByte(addr, value) {
    mem.set(addr >>> 0, value & 255);
  }
  function writeSlot(key, index, value) {
    const live = LIVE[key];
    if (!live) return;
    const addr = (live.addr + index * live.w) >>> 0;
    if (live.w === 2) {
      const bytes = Buffer.alloc(2);
      bytes.writeUInt16LE(value & 0xffff, 0);
      write(addr, bytes);
    } else writeByte(addr, value);
  }

  const sim = {
    read, write, u32,
    registers() { return {}; },
    reset() {},
    m: {
      setWatchpoints() {},
      getRegs() { return new Uint32Array(16); },
    },
  };
  const lab = {
    lab_time() { return clock; },
    hooks,
    lt: { allow: new Set() },
    passthrough() {},
    state() { return 0; },
    observe(addr, fn) {
      const list = observers.get(addr) || [];
      list.push(fn);
      observers.set(addr, list);
    },
    hook(addr, fn) { hooks.set(addr, fn); },
    hook_rt(addr, fn) { hooks.set(addr, fn); },
    wrap(addr, factory) {
      const next = factory(() => {});
      hooks.set(addr, next);
    },
    call(addr, args) {
      const rec = {
        d0: args && args.d0 || 0,
        d1: args && args.d1 || 0,
        a0: args && args.a0 || 0,
        a1: args && args.a1 || 0,
        mdr: 0x5000abcd,
      };
      const handle = { finish() {}, skip_call() {} };
      const hooked = hooks.get(addr);
      if (typeof hooked === 'function') hooked(handle, rec);
      for (const fn of observers.get(addr) || []) fn(lab, rec);
      const back = hooks.get(rec.mdr);
      if (typeof back === 'function') back(handle, { d0: ctx.subject || 0 });
      return { d0: addr === GETTER ? (ctx.subject || 0) : 0 };
    },
    sim,
  };
  ctx.l = lab;

  function paint(setup) {
    mem.clear();
    const half = setup.half;
    for (const row of MAP) {
      const live = LIVE[row.key];
      const cells = half[live.name];
      for (let i = 0; i < row.n; i++) writeSlot(row.key, i, cells[i]);
    }
    writeByte(MODE, setup.flag & 255);
    write(CONSUMER, Uint8Array.from(setup.target));
    write(HALF_TARGET, Uint8Array.from(setup.halfTarget));
    write(EXT, new Uint8Array(71).fill(3));
    write(0x6031eeb0, new Uint8Array(71).fill(3));
    ctx.owner = setup.owner;
    ctx.subject = setup.subject;
    writeU32(POSE, 1);
  }
  paint(DECLARED.setup);

  function fireRefresh() {
    const list = observers.get(REFRESH) || [];
    if (!list[0]) return;
    list[0](lab, { mdr: 0x50000021 });
    lab.call(GETTER, { d0: 0x88b2, d1: 0, a0: 0 });
    const ret = hooks.get(0x50000021);
    if (typeof ret === 'function') ret({ finish() {}, skip_call() {} }, {});
  }
  function idle(ms) {
    clock += ms * 1e6;
    idleLog.push(ms);
    fireRefresh();
  }
  ctx.idle = idle;

  const pose = attachPose(lab);
  let refresh;
  refresh = installRefresh(ctx, {
    hookGetter: false,
    phase: () => 'run',
    category: () => (asserting ? 'assert' : 'setup'),
    sampleNow() { refresh.sample({ n: 1 }, lab.lab_time()); },
  });
  const modelMod = fakeModel();
  const menuMod = fakeMenu();
  const installed = installCombined(ctx, modelMod, menuMod, {
    onGetter: (rec) => refresh.noteGetter(rec, asserting ? 'assert' : 'setup'),
    refreshId: () => refresh.currentId(),
  });

  function writeNamed(named) {
    if (!named) return;
    if (named.slots) {
      for (const slot of named.slots) writeSlot(slot.key, slot.index, slot.value);
    }
    if (named.flag !== undefined) writeByte(MODE, named.flag);
    if (named.target) write(CONSUMER, Uint8Array.from(named.target));
    if (named.halfTarget) write(HALF_TARGET, Uint8Array.from(named.halfTarget));
    if (named.owner !== undefined) ctx.owner = named.owner;
    if (named.subject !== undefined) ctx.subject = named.subject;
    if (named.mirror) {
      const head = Uint8Array.from(named.mirror);
      const tail = read(EXT + 55, 16);
      const whole = new Uint8Array(71);
      whole.set(head.subarray(0, Math.min(55, head.length)), 0);
      whole.set(tail, 55);
      write(EXT, whole);
    }
  }

  const session = {
    ctx,
    modelMod,
    menuMod,
    pose,
    hooks: installed,
    refresh,
    idleLog,
    apiLog,
    hooksInstalled: true,
    refreshInstalled: true,
    argument: 0,
    last: null,
    opts,
    writeNamed,
    writeByte,
    writeU32,
    writeSlot,
    resetPaint() { paint(DECLARED.setup); },
    idle,
    identityNow() {
      const view = ctx.screen();
      return {
        title: view && view.frame ? null : null,
        highlight: view ? view.highlight : null,
        screen: ctx.s.screen(),
      };
    },
    capture(frame) {
      asserting = true;
      try {
        const state = captureState(ctx, readGetter, frame || { n: 1 });
        session.last = state;
        return state;
      } finally {
        asserting = false;
      }
    },
  };
  return session;
}
