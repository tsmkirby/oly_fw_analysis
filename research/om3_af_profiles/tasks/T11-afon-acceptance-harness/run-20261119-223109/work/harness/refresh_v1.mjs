// Every refresh of 0x61184dd6, with getter calls, time and a later frame signature.
const ENTRY = 0x61184dd6;
const GET = 0x60063380;

export function installRefresh(ctx, opts = {}) {
  const windows = [];
  let cur = null;
  let seq = 0;
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
      phase: opts.phase ? opts.phase() : null,
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
      } catch { /* return already hooked */ }
    }
  }, 'obs-refresh-entry');
  function noteGetter(rec) {
    const row = {
      t: rec.t,
      key: rec.key,
      index: rec.index,
      back: rec.back,
      ret: rec.ret,
      refresh: cur ? cur.id : (rec.refresh || null),
    };
    if (cur && cur.calls.length < 500) cur.calls.push(row);
    return row;
  }
  if (opts.hookGetter) {
    l.observe(ctx.native(GET), (lab, r) => {
      const rec = {
        t: lab.lab_time(),
        key: r.d0 & 0xffff,
        index: r.d1 & 0xffff,
        back: r.mdr >>> 0,
        ret: null,
      };
      noteGetter(rec);
      const site = r.mdr >>> 0;
      if (site && !l.hooks.has(site)) {
        try {
          l.hook_rt(site, (_h, rr) => {
            if (rec.ret === null) rec.ret = rr.d0 & 0xffff;
            l.hooks.delete(site);
            l.passthrough(rr);
          }, 'obs-refresh-get-ret', true);
        } catch { /* return already hooked */ }
      }
    }, 'obs-refresh-getter');
  }
  function stamp(sig) {
    let n = 0;
    for (const w of windows) {
      if (w.sig || w.tEnd == null) continue;
      w.sig = sig;
      n += 1;
    }
    if (cur) { cur.sig = sig; n += 1; }
    return n;
  }
  return {
    windows,
    noteGetter,
    stamp,
    currentId: () => (cur ? cur.id : null),
  };
}
