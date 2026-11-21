// Fake session adapter, v2: a toy camera model for pure-Node tests and freeze capture. NOT EMULATOR EVIDENCE.
// v2: edge windows sample only within the bound and report sample times; faults lateRedraw and frameOnSet; the full
// refresh record is exposed for persistence.
// Every value is computed from the toy's own state by fixed rules (writer formula, editor moves, owner rules);
// nothing is copied from an expectation, a reference record or the identity table. A run on this adapter
// is marked mode 'fake' or 'capture' by the launcher and can never satisfy a real proof (launch_v2.mjs).
// The accepted refresh_v4.mjs recorder runs unchanged on a small fake lab (observe / hook_rt / passthrough).
import { createHash } from 'node:crypto';
import { FACTORY_HALF, LAYOUT, packHalf } from '../../ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs';
import { ALL, OWNERS, SINGLE, STOCK } from '../../ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs';
import { installRefresh } from './refresh_v4.mjs';
import { createGate, guardDelivery } from './gate_v2.mjs';
import { WRITER_A } from './relations_v2.mjs';

const sha = (x) => createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex');
const clone = (x) => structuredClone(x);
const NAME = Object.fromEntries(LAYOUT.map((r) => [r.key, r.half]));
const STOCK10 = [14, 2, 2, 0, 27, 0, 39, 0, 0, 0];
const ENTRY = 0x61184dd6;
const GET = 0x60063380;

export const DELIVERY_NAMES = ['key', 'press', 'dial_input', 'inject', 'g4_set', 'set', 'switch_input'];

// Toy writer: a fixed function of the cells at the saved bank. Same function for live and mirror cells.
export function toyWriter(c, b) {
  const pos = c.k5962[b];
  return [14 + (c.k99a1[b] & 15), 2, c.k1dd1[0] & 255, 0, c.k1dd1[1] & 255, 0, c.k84d1[0] & 255, 0, pos & 255, (pos >> 8) & 255];
}

export function toyRender(target) {
  const t = Array.from(target);
  const body = { boxes: [{ x: 400 + t[2] * 8, y: 250 + t[4] * 4, w: 19 + t[6], h: 21 }], pixels: t.reduce((a, b) => a + b, 0) * 3, n31: t[0] };
  return { ...body, sha256: sha(body) };
}

// Toy references for display relations in fake mode (the real ones are T9d files; see run_v2 real refs).
export function fakeRefs() {
  return {
    display: {
      k1eFrame: { a: toyRender(WRITER_A), b: toyRender(SINGLE) },
      k2Edges: OWNERS.map(() => toyRender(ALL)),
      k1Frame: toyRender(STOCK),
      idlePeriodMs: 100,
      boundMs: 200,
    },
  };
}

function fakeLab(clock) {
  const observers = new Map();
  const hooks = new Map();
  return {
    hooks,
    lab_time: () => clock.t,
    observe(addr, fn) { if (!observers.has(addr)) observers.set(addr, []); observers.get(addr).push(fn); },
    hook_rt(addr, fn) { hooks.set(addr, fn); },
    passthrough() {},
    fire(addr, r) { for (const fn of observers.get(addr) || []) fn(this, r); },
    ret(addr, r) { const fn = hooks.get(addr); if (fn) fn({}, r); },
  };
}

// faults: test-only switches that make the toy misbehave (each must make a run fail).
export function createFakeAdapter(faults = {}) {
  return {
    name: 'fake',
    async runSession(spec, body, env) {
      const clock = { t: 0 };
      const lab = fakeLab(clock);
      const display = spec.kind === 'display';
      const stock = spec.image === 'stock';
      const hooks = !!spec.hooks;
      const m = {
        half: clone(FACTORY_HALF), mirror: null, tail: FACTORY_HALF.k1de1.concat(FACTORY_HALF.k1df1).map((v) => v & 255),
        seedHead: null, flag: 255, owner: 255, target: STOCK10.slice(), halfTarget: STOCK10.slice(),
        size: Array.from({ length: 72 }, (_, i) => (i * 7) & 255), pose: 0, bank: 0, screen: 'shooting',
        pressed: new Set(), writer: 0, readBank: null, links: { 0x1db1: 0, 0x1dc1: 0 }, focusArg: null,
      };
      if (display && !stock) { m.target = ALL.slice(); m.halfTarget = ALL.slice(); }
      const live = () => m.half;
      const editCells = () => (hooks && m.flag === 1 && m.mirror ? m.mirror : m.half);
      const movePos = () => {
        const c = editCells();
        c.k5962[m.bank] -= 117;
        if (m.bank === 0) c.k88b2[0] = c.k5962[0];
      };
      // The displayed frame follows the target; with lateRedraw it changes only once the bound has passed.
      let shown = null;
      let shownFrom = 0;
      const displayed = () => {
        if (!faults.lateRedraw || shown === null) return m.target;
        return clock.t - shownFrom > env.refs.display.boundMs * 1e6 ? m.target : shown;
      };
      const frameOf = () => (display ? toyRender(faults.frameOnSet && m.setCount ? m.target.map((v, i) => (i === 9 ? v ^ m.setCount : v)) : displayed()) : null);
      let refresh = null;
      const tick = (ms) => {
        clock.t += ms * 1e6;
        if (refresh) {
          const ra = 0x60001000 + (clock.t % 7);
          lab.fire(ENTRY, { mdr: ra });
          if (stock) {
            lab.fire(GET, { d0: 0x88b2, d1: 0, mdr: 0x60002000 });
            lab.ret(0x60002000, { d0: 526 });
          } else if (hooks) {
            const rec = refresh.noteGetter({ t: clock.t, key: 0x88b2, index: 0, back: 0x60002000, ret: 529, refresh: refresh.currentId() }, null);
            void rec;
          }
          if (!faults.unclosedRefresh) lab.ret(ra, {});
        }
      };
      const mirror71 = () => {
        const head = m.seedHead ? m.seedHead.slice() : packHalf(m.mirror || FACTORY_HALF);
        return head.concat(m.tail);
      };
      const slots = () => {
        const out = [];
        for (const row of LAYOUT) for (let i = 0; i < row.n; i++) out.push({ key: row.key, index: i, value: live()[row.half][i] });
        return out;
      };
      const capture = (frame, op, when) => {
        const s = {
          slots: slots(), half: clone(live()), mirror71: mirror71(), sizeRecord: m.size.slice(), flag: m.flag,
          target: m.target.slice(), halfTarget: m.halfTarget.slice(), owner: m.owner, subject: faults.subject ? 1 : 0,
          poseWord: m.pose, screen: m.screen, edge: { status: 0, enabled: 1 },
          readBank: when === 'after' && op && op.key === 'afon' && op.dir === 'down' && hooks && !display ? m.readBank : null,
          frame: frame || null,
        };
        s.mirror = s.mirror71.slice(0, 55);
        if (faults.dropField && when === 'after' && op && op.id === faults.dropField) delete s.edge;
        return s;
      };
      const toySession = {
        key: (k, d) => toyKey(k, d),
        dial_input: () => toyDial(),
        press: () => { throw new Error('toy press'); },
        set: (key, index, value) => toySet(key, index, value),
        switch_input: () => {},
      };
      function toyKey(k, d) {
        if (k === 'up') {
          if (d === 'down') {
            if (m.screen === 'shooting') m.screen = 'direct';
            movePos();
          }
        } else if (k === 'ok') {
          if (d === 'up' && m.screen === 'direct') { m.screen = 'shooting'; if (m.flag === 1) m.flag = 0; }
        } else if (k === 'menu') {
          if (d === 'down') {
            if (m.screen === 'direct') { m.screen = 'menu'; if (m.flag === 1) m.flag = 0; }
            else if (m.screen === 'menu') m.screen = 'shooting';
          }
        } else if (k === 's1') {
          if (d === 'down') {
            m.pressed.add('s1');
            if (stock) return;
            if (!m.pressed.has('afon')) {
              m.owner = 1;
              const rec = display ? ALL.slice() : toyWriter(live(), m.bank);
              m.halfTarget = rec.slice();
              m.target = rec.slice();
            }
          } else {
            m.pressed.delete('s1');
            if (stock) return;
            m.owner = m.pressed.has('afon') ? 2 : 0;
          }
        } else if (k === 'afon') {
          if (d === 'down') {
            m.pressed.add('afon');
            if (stock) return;
            m.owner = 2;
            if (display) m.target = m.seedHead ? [0x11, 2, m.seedHead[0x20], 0, m.seedHead[0x16], 0, m.seedHead[0x17], 0, 0, 0] : ALL.slice();
            else if (hooks) {
              m.writer += 1;
              m.readBank = faults.readBank != null ? faults.readBank : m.bank;
              m.target = toyWriter(m.mirror || live(), m.bank);
              if (faults.pressByte != null) m.target[faults.pressByte] ^= 1;
            } else m.target = [14, 2, live().k99a1[m.bank] + 1, 0, 1, 0, 1, 0, 0, 0];
          } else {
            m.pressed.delete('afon');
            if (stock) return;
            m.owner = m.pressed.has('s1') ? 1 : 0;
            m.target = display ? ALL.slice() : toyWriter(live(), m.bank);
          }
        }
      }
      function toyDial() {
        if (m.screen === 'direct') { const c = editCells(); c.k99a1[m.bank] = (c.k99a1[m.bank] + 1) % 11; }
      }
      function toySet(key, index, value) {
        if (key === 0x1db1 || key === 0x1dc1) { m.links[key] = value; return; }
        const name = NAME[key];
        if (!name) return;
        const c = hooks && m.flag === 1 && m.mirror ? m.mirror : m.half;
        c[name][index] = value;
      }
      let gate = null;
      const raw = guardDelivery(toySession, DELIVERY_NAMES, () => !!gate && gate.delivering(), 'fake.s');
      const deliver = {
        key: (k, d) => { shown = m.target.slice(); shownFrom = clock.t; return raw.key(k, d); },
        dial: () => raw.dial_input('main', 1),
        pose: (name) => {
          m.pose = name === 'exif6' ? 2 : 1; m.bank = m.pose === 2 ? 4 : 0;
          if (faults.loseLink && name === 'exif6') m.links[0x1db1] = 0;
        },
        set: (key, index, value) => { m.setCount = (m.setCount || 0) + 1; return raw.set(key, index, value); },
        mode: (v) => { m.flag = v; },
        mirror: (bytes) => { m.seedHead = Array.from(bytes); },
        enter: () => {
          if (m.flag === 1) throw new Error('enter while the flag is set');
          m.flag = 1;
          if (!m.mirror) m.mirror = clone(live());
          m.tail = FACTORY_HALF.k1de1.concat(FACTORY_HALF.k1df1).map((v) => v & 255);
        },
        setup: (name) => {
          if (name === 'lever') raw.switch_input('lever', 1);
          if (name === 'focus-arg') { m.focusArg = 0x2a; return m.focusArg; }
          return undefined;
        },
        prepare: () => {
          tick(env.refs.display.idlePeriodMs);
          if (refresh) refresh.sample(toyRender(m.target), clock.t);
        },
      };
      gate = createGate(spec.id, deliver, {
        capture,
        frame: () => frameOf(),
        idle: (ms) => { clock.t += ms * 1e6; },
        settleWindow: async () => {
          const t0 = clock.t;
          const boundNs = env.refs.display.boundMs * 1e6;
          const times = [];
          let shot = null;
          while (clock.t + 25e6 <= t0 + boundNs || faults.sampleLate) {
            tick(25);
            shot = toyRender(faults.frameDrift ? displayed().map((v) => v ^ 1) : displayed());
            times.push(clock.t);
            if (refresh) refresh.sample(shot, clock.t);
            if (faults.sampleLate && clock.t > t0 + boundNs) break;
          }
          return { frame: shot, t0, times, boundNs };
        },
        identityNow: () => ({ title: sha('title:' + m.screen + (faults.title ? ':x' : '')), highlight: null, screen: m.screen }),
        presence: env.presence,
        requireFrame: (op) => !!op.requireFrame,
      });
      if (spec.recorder) {
        refresh = installRefresh({ l: lab, native: (a) => a }, { hookGetter: stock, phase: () => 'edges', category: () => null });
      }
      const observe = {
        hooksRefresh: () => {},
        markReads: () => {},
        armWatches: () => {},
        poseWatch: () => (faults.poseLeak ? ['5962@fake'] : []),
        readGetter: (key) => m.links[key] ?? 0,
        writerCount: () => m.writer + (faults.writerExtra || 0),
        refreshProblems: () => {
          const problems = refresh ? refresh.problems() : ['no recorder'];
          return { problems, windows: refresh ? refresh.windows.length : 0, calls: refresh ? refresh.windows.reduce((n, w) => n + w.calls.length, 0) + refresh.outside.length : 0, outside: refresh ? refresh.outside.length : 0 };
        },
        shot: () => {},
        refreshRecord: () => (refresh ? { windows: refresh.windows, outside: refresh.outside, orphans: refresh.orphans, samples: refresh.samples } : { windows: [], outside: [], orphans: [], samples: [] }),
        guarded: toySession,
      };
      await body({ gate, observe });
    },
  };
}
