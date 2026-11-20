// Every refresh of 0x61184dd6. A frame sample links only when its time is inside that window.
// Getters outside a window need a declared category. EMULATOR-ONLY.
const ENTRY = 0x61184dd6;
const GET = 0x60063380;

export const OUTSIDE = new Set(['setup', 'seed', 'boot', 'link', 'watch']);

export function installRefresh(ctx, opts = {}) {
  const windows = [];
  const orphans = [];
  const outside = [];
  const samples = [];
  let cur = null;
  let seq = 0;
  let failed = null;
  const l = ctx.l;
  l.observe(ctx.native(ENTRY), (lab, r) => {
    if (cur) {
      cur.tEnd = lab.lab_time();
      cur.unclosed = true;
      windows.push(cur);
      cur = null;
    }
    const win = {
      id: 'r' + seq,
      tEntry: lab.lab_time(),
      tEnd: null,
      calls: [],
      sig: null,
      sampleT: null,
      phase: opts.phase ? opts.phase() : null,
      unclosed: false,
    };
    seq += 1;
    cur = win;
    const ra = r.mdr >>> 0;
    if (ra >= 0x50000000 && ra < 0x70000000 && !l.hooks.has(ra)) {
      try {
        l.hook_rt(ra, (_h, rr) => {
          if (cur === win) {
            win.tEnd = lab.lab_time();
            windows.push(win);
            cur = null;
          }
          l.hooks.delete(ra);
          l.passthrough(rr);
        }, 'obs-refresh-ret', true);
      } catch (error) {
        failed = error;
      }
    }
  }, 'obs-refresh-entry');
  if (opts.hookGetter) {
    l.observe(ctx.native(GET), (lab, r) => {
      const rec = {
        t: lab.lab_time(),
        key: r.d0 & 0xffff,
        index: r.d1 & 0xffff,
        back: r.mdr >>> 0,
        ret: null,
        refresh: cur ? cur.id : null,
      };
      noteGetter(rec, opts.category ? opts.category() : null);
      const site = r.mdr >>> 0;
      if (site && !l.hooks.has(site)) {
        try {
          l.hook_rt(site, (_h, rr) => {
            if (rec.ret == null) rec.ret = rr.d0 & 0xffff;
            l.hooks.delete(site);
            l.passthrough(rr);
          }, 'obs-refresh-get-ret', true);
        } catch (error) {
          failed = error;
        }
      }
    }, 'obs-refresh-getter');
  }
  function link(sample) {
    if (cur && sample.t >= cur.tEntry && cur.tEnd == null && cur.sampleT == null) {
      cur.sig = sample.sig;
      cur.sampleT = sample.t;
    }
    for (const win of windows) {
      if (win.sampleT != null) continue;
      if (win.tEnd == null) continue;
      if (sample.t >= win.tEntry && sample.t <= win.tEnd) {
        win.sig = sample.sig;
        win.sampleT = sample.t;
      }
    }
  }
  function noteGetter(rec, category) {
    if (rec.ret == null) rec.pending = true;
    if (cur) {
      rec.refresh = cur.id;
      rec.category = 'refresh';
      cur.calls.push(rec);
      return rec;
    }
    const cat = category || rec.category || null;
    rec.refresh = null;
    if (cat && OUTSIDE.has(cat)) {
      rec.category = cat;
      outside.push(rec);
    } else {
      rec.category = null;
      orphans.push(rec);
    }
    return rec;
  }
  function sample(sig, t) {
    if (t == null) throw new Error('frame sample needs the time it was taken');
    const row = { sig, t };
    samples.push(row);
    link(row);
    return row;
  }
  function problems() {
    const out = [];
    if (failed) out.push('refresh-hook');
    if (cur) out.push('unclosed-current');
    for (const win of windows) {
      if (win.unclosed || win.tEnd == null) out.push('unclosed ' + win.id);
      if (win.tEnd != null && win.sampleT == null) out.push('unstamped ' + win.id);
      for (const call of win.calls) if (call.ret == null) out.push('null ' + win.id);
    }
    for (const call of orphans) {
      out.push('orphan');
      if (call.ret == null) out.push('null-orphan');
    }
    for (const call of outside) if (call.ret == null) out.push('null-outside');
    return out;
  }
  return {
    windows, orphans, outside, samples, noteGetter, sample, stamp: sample,
    currentId: () => (cur ? cur.id : null), problems,
  };
}
