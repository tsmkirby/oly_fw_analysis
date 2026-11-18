// Complete acceptance of H plus the help list plus the kind-4 label.
// Two fresh candidate sessions and one stock control, the same shared keys.
// An assertion after every key. A failure ends the run with ok:false.
// Usage: node26 work/scripts/accept_i1.mjs om-emu
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runZone } from './zone_session_i1.mjs';

const [checkout] = process.argv.slice(2);
const HELP = 'Choose the AF target area.';
const HELP_ID = 424;
const ZONE_LABEL = '@A040@AF Target Mode';
const SLOTS = [
  { value: 0, id: 9123 }, { value: 1, id: 1610 }, { value: 2, id: 650 }, { value: 3, id: 6581 },
  { value: 5, id: 9124 }, { value: 10, id: 9125 }, { value: 6, id: 9126 }, { value: 7, id: 9127 },
  { value: 8, id: 9128 }, { value: 9, id: 9129 },
];
const TABS = [
  'Card Formatting', '@A02C@Grid Settings', 'EVF Style', '@A02C@LV Mode', 'LV Close Up Mode',
  'Button Settings', '@A01C@', '@A037@@A035@Function', '@A009@', 'Center Marker',
  'Sound Recording Settings', '@A027@Image Stabilizer', '@A03E@ISO-A Upper/Default',
  '@A027@Picture Mode', '@A027@Custom Mode', 'MF Assist', '@A02C@AF Target Mode Settings',
  '@A027@AF Mode', '@A02C@C-AF Sensitivity', 'AF Illuminator', 'Subject Detection',
];
const EXPECT = {
  k90a1: [1, 1],
  k1dd1: [27, 39, 3, 3, 3, 3, 3, 3, 3, 3],
  k99a1: [2, 0, 2, 0, 2, 0, 5, 5],
  k9a41: 0,
  k5962: [526, 526, 526, 526, 526, 526],
  home: {
    '0x99d2': [526, 526, 526], '0x9fa1': [0, 0, 0], '0xdfa1': [0], '0x1ea1': [0],
    '0x9ec1': [0], '0x9ed1': [1], '0x9ee1': [0], '0x9ef1': [0], '0x59b1': [0],
  },
  originally: [0, 0, 0, 0, 0, 0],
};

function listed(c) {
  return {
    k90a1: c.k90a1, k1dd1: c.k1dd1, k99a1: c.k99a1, k9a41: c.k9a41, k5962: c.k5962,
    home: c.home, originally: c.originally.map((x) => x.value),
  };
}
const expectJson = JSON.stringify(EXPECT);
const lines = [];
const emit = (x) => { lines.push(JSON.stringify(x)); console.log(JSON.stringify(x)); };

function helpFace(faces) {
  return [...faces].reverse().find((f) => f.caller === '0x611f843e') || null;
}
function glyphFace(faces) {
  return [...faces].reverse().find((f) => f.caller === '0x6120408f' && f.list === '0x6158ba1c') || null;
}

async function session(name, candidate) {
  const steps = [];
  let failed = null;
  const result = await runZone({
    checkout,
    outPath: 'work/out/accept-' + name + '.jsonl',
    tag: 'accept-' + name,
    candidate,
    help: true,
    rowLabel: true,
    canonical: candidate && name === 'c1',
    nvramPath: 'work/out/nvram-accept-' + name + '.json',
    explanation: candidate
      ? 'Final configuration acceptance session ' + name + '. H, the ten-record help list, and the kind-4 label.'
      : 'Stock control. The same shared keys, no AF-ON row.',
    change: candidate ? 'final configuration' : 'none',
    async drive(ctx) {
      const check = (what, cond, detail) => {
        emit({ step: 'assert', session: name, name: what, ok: !!cond, detail: detail ?? null });
        if (!cond) throw new Error('assertion failed: ' + name + ' ' + what + ' ' + JSON.stringify(detail));
      };
      const note = (step, key) => {
        let view = ctx.shot(step);
        if (view.highlight == null && !step.includes('open')) {
          ctx.idle(400);
          view = ctx.shot(step);
        }
        const faces = ctx.takeFaces().filter((f) => f.caller === '0x611f843e' || f.caller === '0x6120408f' || f.caller === '0x611f83b1');
        const cells = ctx.cells();
        const row = {
          step, key, texts: view.texts, highlight: view.highlight, file: view.file,
          profile: cells.profile, cached: cells.profileCached, listed: listed(cells),
          help: helpFace(faces), glyph: glyphFace(faces),
        };
        steps.push(row);
        ctx.emit('observe', { step, key, texts: view.texts, highlight: view.highlight, file: view.file, profile: cells.profile, cached: cells.profileCached, cells, help: row.help, glyph: row.glyph });
        check(step + '-cells', JSON.stringify(row.listed) === expectJson, row.listed);
        return row;
      };
      ctx.takeFaces();
      ctx.press('menu');
      let row = note('menu', 'menu');
      check('menu-highlight', row.highlight === TABS[0], row.highlight);
      check('menu-title', row.texts.some((t) => t.includes('Card')), row.texts);
      for (let i = 0; i < 20; i++) {
        ctx.press('left');
        row = note('left-' + i, 'left');
        check('left-' + i + '-highlight', row.highlight === TABS[i + 1], row.highlight);
      }
      ctx.press('down');
      row = note('down-caf', 'down');
      check('down-caf-highlight', row.highlight === '@A065@C-AF Setting', row.highlight);
      ctx.press('down');
      row = note('down-afbutton', 'down');
      check('down-afbutton-highlight', row.highlight === '@A02C@@A065@AF Button', row.highlight);
      ctx.press('ok');
      row = note('page27', 'ok');
      check('page27-title', row.texts.some((t) => t.includes('AF Button')), row.texts);
      check('page27-highlight', row.highlight === '@A066@ Priority', row.highlight);
      if (candidate) check('page27-label', row.texts.includes(ZONE_LABEL), row.texts);
      ctx.press('ok');
      row = note('2154-open', 'ok');
      check('2154-help', row.texts.some((t) => t.includes('selected AF target position')), row.texts);
      check('2154-priority', row.texts.some((t) => t.includes('Priority')), row.texts);
      ctx.press('menu');
      row = note('2154-cancel', 'menu');
      check('2154-back', row.texts.some((t) => t.includes('AF Button')), row.texts);
      check('2154-highlight', row.highlight === '@A066@ Priority', row.highlight);
      ctx.press('down');
      row = note('down-2155', 'down');
      check('down-2155-highlight', row.highlight === '@A066@ Priority', row.highlight);
      ctx.press('ok');
      row = note('2155-open', 'ok');
      check('2155-help', row.texts.some((t) => t.includes('selected AF target position')), row.texts);
      ctx.press('menu');
      row = note('2155-cancel', 'menu');
      check('2155-back', row.texts.some((t) => t.includes('AF Button')), row.texts);
      ctx.press('menu');
      row = note('leave-27', 'menu');
      check('leave-27-highlight', row.highlight === '@A02C@@A065@AF Button', row.highlight);
      ctx.press('left');
      row = note('page1-af', 'left');
      check('page1-title', row.texts.includes('1.') && row.texts.includes('Release Priority'), row.texts);
      check('page1-highlight', row.highlight === '@A02C@AF Mode', row.highlight);
      const down26 = ['@A02C@AF+MF', 'Starry Sky AF Setting', '@A02C@AF by half-pressing @A052@', '@A049@ in MF mode', 'Release Priority'];
      for (let i = 0; i < down26.length; i++) {
        ctx.press('down');
        row = note('down26-' + i, 'down');
        check('down26-' + i + '-highlight', row.highlight === down26[i], row.highlight);
      }
      ctx.press('ok');
      row = note('page26', 'ok');
      check('page26-title', row.texts.includes('Release Priority'), row.texts);
      check('page26-highlight', row.highlight === 'S-AF', row.highlight);
      ctx.press('menu');
      row = note('back26', 'menu');
      check('back26-highlight', row.highlight === 'Release Priority', row.highlight);
      ctx.press('up');
      row = note('up25-0', 'up');
      check('up25-0-highlight', row.highlight === '@A049@ in MF mode', row.highlight);
      ctx.press('up');
      row = note('up25-1', 'up');
      check('up25-1-highlight', row.highlight && row.highlight.includes('half-pressing'), row.highlight);
      ctx.press('ok');
      row = note('page25', 'ok');
      check('page25-title', row.texts.some((t) => t.includes('half-pressing')), row.texts);
      check('page25-highlight', row.highlight === 'S-AF', row.highlight);
      ctx.press('menu');
      row = note('back25', 'menu');
      check('back25-highlight', row.highlight && row.highlight.includes('half-pressing'), row.highlight);
      ctx.press('right');
      row = note('page2-af', 'right');
      check('page2-highlight', row.highlight === 'Subject Detection', row.highlight);
      ctx.press('down');
      row = note('down27-0', 'down');
      check('down27-0-highlight', row.highlight === '@A065@C-AF Setting', row.highlight);
      ctx.press('down');
      row = note('down27-1', 'down');
      check('down27-1-highlight', row.highlight === '@A02C@@A065@AF Button', row.highlight);
      ctx.press('ok');
      row = note('page27-return', 'ok');
      check('return-title', row.texts.some((t) => t.includes('AF Button')), row.texts);
      check('return-highlight', row.highlight === '@A066@ Priority', row.highlight);
      if (candidate) {
        const before = JSON.stringify(row.listed);
        ctx.press('down');
        row = note('zone-2155', 'down');
        check('zone-2155', row.highlight === '@A066@ Priority' && JSON.stringify(row.listed) === before, row.highlight);
        ctx.press('down');
        row = note('zone-row', 'down');
        check('zone-label', row.highlight === ZONE_LABEL, row.highlight);
        check('zone-glyph-all', row.glyph && row.glyph.value === 0 && row.glyph.id === 9123, row.glyph);
        check('zone-profile-0', row.profile === 0 && row.cached === 0, row.profile);
        ctx.press('ok');
        row = note('zone-open', 'ok');
        check('zone-open-help', row.texts.includes(HELP) && row.help && row.help.value === 0 && row.help.id === HELP_ID, row.help);
        check('zone-open-profile', row.profile === 0, row.profile);
        for (let n = 1; n <= 9; n++) {
          ctx.press('right');
          row = note('zone-right-' + n, 'right');
          const slot = SLOTS[n];
          check('zone-right-' + n + '-slot', row.texts.includes(HELP) && row.help && row.help.value === slot.value && row.help.id === HELP_ID, row.help);
          check('zone-right-' + n + '-profile', row.profile === 0 && JSON.stringify(row.listed) === before, row.profile);
        }
        ctx.press('menu');
        row = note('zone-cancel-c4', 'menu');
        check('cancel-c4-profile', row.profile === 0 && row.cached === 0, row.profile);
        check('cancel-c4-label', row.highlight === ZONE_LABEL, row.highlight);
        check('cancel-c4-glyph', row.glyph && row.glyph.value === 0 && row.glyph.id === 9123, row.glyph);
        check('cancel-c4-cells', JSON.stringify(row.listed) === before, row.listed);
        ctx.press('ok');
        row = note('zone-reopen', 'ok');
        check('reopen-help', row.texts.includes(HELP) && row.help && row.help.value === 0, row.help);
        ctx.press('right');
        row = note('commit2-right-1', 'right');
        check('commit2-right-1', row.help && row.help.value === 1 && row.profile === 0, row.help);
        ctx.press('right');
        row = note('commit2-right-2', 'right');
        check('commit2-right-2', row.help && row.help.value === 2 && row.profile === 0, row.help);
        ctx.press('ok');
        row = note('commit-2', 'ok');
        check('commit-2-value', row.profile === 2 && row.cached === 2, { profile: row.profile, cached: row.cached });
        check('commit-2-label', row.highlight === ZONE_LABEL, row.highlight);
        check('commit-2-glyph', row.glyph && row.glyph.value === 2 && row.glyph.id === 650, row.glyph);
        check('commit-2-cells', JSON.stringify(row.listed) === before, row.listed);
        ctx.press('ok');
        row = note('reopen-2', 'ok');
        check('reopen-2-slot', row.texts.includes(HELP) && row.help && row.help.value === 2 && row.profile === 2, row.help);
        for (let n = 3; n <= 9; n++) {
          ctx.press('right');
          row = note('commit9-right-' + n, 'right');
          check('commit9-right-' + n, row.help && row.help.value === SLOTS[n].value && row.profile === 2, row.help);
          check('commit9-cells-' + n, JSON.stringify(row.listed) === before, null);
        }
        ctx.press('ok');
        row = note('commit-9', 'ok');
        check('commit-9-value', row.profile === 9 && row.cached === 9, { profile: row.profile, cached: row.cached });
        check('commit-9-glyph', row.glyph && row.glyph.value === 9 && row.glyph.id === 9129, row.glyph);
        check('commit-9-label', row.highlight === ZONE_LABEL, row.highlight);
        check('commit-9-cells', JSON.stringify(row.listed) === before, row.listed);
      }
      let exits = 0;
      while (exits < 6 && (ctx.s.screen() === 'menu' || ctx.s.screen() === 'direct')) {
        ctx.press('menu');
        row = note('exit-' + exits, 'menu');
        if (exits === 0) {
          check('exit-0-parent', row.texts.some((t) => t.includes('AF')), row.texts);
          check('exit-0-highlight', row.highlight === '@A02C@@A065@AF Button', row.highlight);
        }
        exits += 1;
      }
      ctx.idle(800);
      const saves = ctx.l.store_log?.nvram?.saves ?? [];
      ctx.emit('observe', { step: 'save', screen: ctx.s.screen(), exits, saves });
      check('left-the-menu', ctx.s.screen() === 'shooting', ctx.s.screen());
      check('native-save', saves.length > 0, saves);
    },
  });
  if (!result.ok) failed = result.failed;
  return { steps, ok: result.ok, failed };
}

function storeBytes(file) {
  const doc = JSON.parse(readFileSync(resolve(file), 'utf8'));
  const { base64Bytes } = storeBytes.fn;
  const out = {};
  for (const name of ['M', 'E']) out[name] = doc[name] ? Buffer.from(base64Bytes(doc[name])) : null;
  out.clock = doc.clock_offset ?? null;
  return out;
}

const runs = {};
try {
  const { base64Bytes } = await import(pathToFileURL(resolve(checkout, 'emu/src/util/bytes.mjs')).href);
  storeBytes.fn = { base64Bytes };
  runs.control = await session('control', false);
  if (!runs.control.ok) throw new Error('control failed');
  runs.c1 = await session('c1', true);
  if (!runs.c1.ok) throw new Error('c1 failed');
  runs.c2 = await session('c2', true);
  if (!runs.c2.ok) throw new Error('c2 failed');
  const shared = runs.control.steps.map((s) => s.step);
  for (const who of ['c1', 'c2']) {
    for (const step of shared) {
      const a = runs.control.steps.find((s) => s.step === step);
      const b = runs[who].steps.find((s) => s.step === step);
      const same = JSON.stringify(a.listed) === JSON.stringify(b.listed);
      emit({ step: 'cell-compare', who, at: step, same });
      if (!same) throw new Error('cell diff ' + who + ' ' + step);
    }
    const pagePairs = [['page26', 'page26'], ['page25', 'page25']];
    for (const [st] of pagePairs) {
      const a = runs.control.steps.find((s) => s.step === st);
      const b = runs[who].steps.find((s) => s.step === st);
      const same = JSON.stringify(a.texts) === JSON.stringify(b.texts) && a.highlight === b.highlight;
      emit({ step: 'render-compare', who, at: st, same, control: a.texts, candidate: b.texts });
      if (!same) throw new Error('render diff ' + who + ' ' + st);
    }
  }
  const stores = {
    control: storeBytes('work/out/nvram-accept-control.json'),
    c1: storeBytes('work/out/nvram-accept-c1.json'),
    c2: storeBytes('work/out/nvram-accept-c2.json'),
  };
  for (const who of ['c1', 'c2']) {
    const sameM = stores.control.M.equals(stores[who].M);
    const sameE = stores.control.E.equals(stores[who].E);
    emit({
      step: 'store-compare', who, sameM, sameE,
      mBytes: stores.control.M.length, eBytes: stores.control.E.length,
      clock: { control: stores.control.clock, candidate: stores[who].clock },
    });
    if (!sameM || !sameE) throw new Error('store diff ' + who);
  }
  for (const who of ['control', 'c1', 'c2']) {
    copyFileSync('work/out/nvram-accept-' + who + '.json', 'work/out/store-accept-' + who + '.json');
  }
  for (const who of ['c1', 'c2']) {
    const again = await runZone({
      checkout,
      outPath: 'work/out/accept-' + who + '-reopen.jsonl',
      tag: 'accept-' + who + '-reopen',
      candidate: true,
      help: true,
      rowLabel: true,
      nvramPath: 'work/out/nvram-accept-' + who + '.json',
      explanation: 'New session on the saved store. The profile byte must be the default 0.',
      change: 'final configuration, no new keys',
      async drive(ctx) {
        const cells = ctx.cells();
        ctx.emit('observe', { step: 'reopen', profile: cells.profile, cached: cells.profileCached, cells });
        if (cells.profile !== 0 || cells.profileCached !== 0) throw new Error(who + ' profile persisted ' + cells.profile);
        if (JSON.stringify(listed(cells)) !== expectJson) throw new Error(who + ' reopen cells');
        emit({ step: 'reopen-assert', who, ok: true, profile: cells.profile });
      },
    });
    if (!again.ok) throw new Error(who + ' reopen failed ' + again.failed);
  }
  for (const [who, candidate] of [['control', false], ['c1', true]]) {
    const page = await runZone({
      checkout,
      outPath: 'work/out/accept-page28-' + who + '.jsonl',
      tag: 'accept-page28-' + who,
      candidate,
      help: true,
      rowLabel: true,
      page28: true,
      explanation: 'EMULATOR-ONLY reference construction of page 28. Not a native route.',
      change: 'reference construction',
      async drive(ctx) {
        ctx.page28State.phase = 'build';
        ctx.press('menu');
        for (let i = 0; i < 20; i++) ctx.press('left');
        ctx.press('down'); ctx.press('down'); ctx.press('ok');
        ctx.page28State.phase = 'off';
        ctx.idle(300);
        const view = ctx.shot('open');
        ctx.emit('observe', {
          step: 'page28', texts: view.texts, highlight: view.highlight, file: view.file,
          replaced: ctx.page28State.replaced, label: 'EMULATOR-ONLY reference construction',
        });
        if (ctx.page28State.replaced !== 1) throw new Error('page 28 was not constructed');
        if (!view.texts.includes(ZONE_LABEL)) throw new Error('page 28 title missing');
        emit({ step: 'page28-assert', who, texts: view.texts, highlight: view.highlight, file: view.file });
      },
    });
    if (!page.ok) throw new Error('page28 ' + who + ' ' + page.failed);
  }
  emit({ step: 'done', ok: true });
} catch (e) {
  emit({ step: 'done', ok: false, error: String(e && e.stack ? e.stack : e), runs: Object.fromEntries(Object.entries(runs).map(([k, v]) => [k, { ok: v.ok, failed: v.failed }])) });
  process.exitCode = 1;
} finally {
  writeFileSync('work/out/accept-i1.jsonl', lines.join('\n') + (lines.length ? '\n' : ''));
}
