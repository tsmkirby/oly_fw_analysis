// Every refresh of 0x61184dd6. Passthrough and substituted calls keep the returned value.
// A null return, an unclosed window, or a dropped call fails the session.
const ENTRY = 0x61184dd6;
const GET = 0x60063380;

export function installRefresh(ctx, opts = {}) {
  const windows = [];
  const orphans = [];
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
  function noteGetter(rec) {
    if (rec.ret == null) rec.pending = true;
    rec.refresh = cur ? cur.id : (rec.refresh || null);
    const bucket = cur ? cur.calls : orphans;
    bucket.push(rec);
    return rec;
  }
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
      noteGetter(rec);
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
  function stamp(sig) {
    let n = 0;
    for (const win of windows) {
      if (win.sig || win.tEnd == null) continue;
      win.sig = sig;
      n += 1;
    }
    if (cur) { cur.sig = sig; n += 1; }
    return n;
  }
  function problems() {
    const out = [];
    if (failed) out.push('refresh-hook');
    if (cur) out.push('unclosed-current');
    for (const win of windows) {
      if (win.unclosed || win.tEnd == null) out.push('unclosed ' + win.id);
      for (const call of win.calls) if (call.ret == null) out.push('null ' + win.id);
    }
    for (const call of orphans) {
      out.push('orphan');
      if (call.ret == null) out.push('null-orphan');
    }
    return out;
  }
  return { windows, orphans, noteGetter, stamp, currentId: () => (cur ? cur.id : null), problems };
}
