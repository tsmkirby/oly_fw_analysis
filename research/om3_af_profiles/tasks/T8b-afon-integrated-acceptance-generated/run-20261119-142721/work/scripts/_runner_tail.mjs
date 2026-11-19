function ff(bytes) { return Array.isArray(bytes) && bytes.length === 55 && bytes.every((b) => b === 255); }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function recordOf(actual) {
  return {
    title: actual.title, mirror: actual.mirror, zone: actual.zone, flag: actual.flag,
    half: actual.half, sizeRecord: actual.sizeRecord, target: actual.target,
    owner: actual.owner, status: actual.status, enabled: actual.enabled,
    focus: actual.focus, active: actual.active, screen: actual.screen,
    highlight: actual.highlight, pageTitle: actual.pageTitle, headerHash: actual.headerHash,
    subject: actual.subject,
  };
}

function resolveSource(spec, field) {
  if (!spec || typeof spec.source !== 'string') throw new Error('missing source for ' + field);
  if (spec.source === 'literal') {
    if (!Object.prototype.hasOwnProperty.call(spec, 'value')) throw new Error('literal without value ' + field);
    return spec.value;
  }
  const match = /^ref:(K1|K2):([A-Za-z0-9-]+)$/.exec(spec.source);
  if (!match) throw new Error('bad source ' + spec.source + ' for ' + field);
  const role = match[1] === 'K1' ? 'k1' : 'k2';
  const row = reference[role] && reference[role][match[2]];
  if (!row || !Object.prototype.hasOwnProperty.call(row, field)) {
    throw new Error('missing reference ' + spec.source + ' ' + field);
  }
  return row[field];
}

function invariants(role, step, actual) {
  const problems = [];
  if (actual.subject !== 0) problems.push('subject ' + actual.subject);
  if (!ff(actual.mirror)) problems.push('mirror not FF');
  if (actual.flag !== 255) problems.push('flag ' + actual.flag);
  if (actual.flagCached !== 255) problems.push('flagCached ' + actual.flagCached);
  if (step.action === 'edge' && role === 'k1') {
    if (!same(actual.target, STOCK)) problems.push('target ' + JSON.stringify(actual.target));
    if (actual.owner !== 255) problems.push('owner ' + actual.owner);
    if (actual.status !== 255) problems.push('status ' + actual.status);
    if (actual.enabled !== 255) problems.push('enabled ' + actual.enabled);
  }
  return problems;
}

function fieldProblems(step, actual) {
  const problems = [];
  if (actual.subject !== 0) problems.push('subject ' + actual.subject);
  const fields = step.fields || {};
  for (const [field, spec] of Object.entries(fields)) {
    if (!Object.prototype.hasOwnProperty.call(actual, field)) {
      problems.push('actual missing ' + field);
      continue;
    }
    const want = resolveSource(spec, field);
    if (!same(actual[field], want)) problems.push(field + ' expected ' + JSON.stringify(want) + ' actual ' + JSON.stringify(actual[field]));
    if (field === 'flag' && actual.flagCached !== want) problems.push('flagCached ' + actual.flagCached);
    if (field === 'zone' && actual.zoneCached !== want) problems.push('zoneCached ' + actual.zoneCached);
  }
  return problems;
}

function identityProblems(step, actual) {
  const problems = [];
  if (step.assertAfTab) {
    if (actual.pageTitle !== '2.AF') problems.push('af-tab-title ' + actual.pageTitle);
    if (!String(actual.highlight || '').includes('Subject Detection')) problems.push('af-tab-highlight ' + actual.highlight);
    if (actual.headerHash !== AF_TAB_HEADER) problems.push('af-tab-header ' + actual.headerHash);
  }
  if (step.assertRow && !isModeRow(actual.highlight)) problems.push('row ' + actual.highlight);
  return problems;
}

function judgeSave(ctx, baseline, nvPath, k2Path) {
  const problems = [];
  const added = holder.events.slice(baseline.callbacks);
  const newE = added.filter((ev) => ev.store === 'E');
  const posted = added.filter((ev) => ev.store === 'M' && ev.posted && ev.via === 'callback');
  if (newE.length) problems.push('new-E ' + newE.length);
  if (posted.length !== 1) problems.push('posted-M ' + posted.length);
  const one = posted[0];
  const file = readStore(resolve(nvPath));
  if (one) {
    if (one.status !== 0) problems.push('posted-M-status ' + one.status);
    if (one.bytes !== 262144) problems.push('posted-M-bytes ' + one.bytes);
    if (!one.sha256) problems.push('posted-M-no-image');
    if (!String(one.from || '').includes('0x60061268')) problems.push('posted-M-from ' + one.from);
    const fileHash = createHash('sha256').update(file.M).digest('hex');
    if (one.sha256 !== fileHash) problems.push('posted-M-file-mismatch');
  }
  if (file.M.length !== 262144) problems.push('M-len ' + file.M.length);
  if (file.E.length !== 196608) problems.push('E-len ' + file.E.length);
  const saves = savesOf(ctx).slice(baseline.storeLog);
  if (saves.some((row) => row.store === 'E')) problems.push('log-new-E');
  if (!saves.some((row) => row.store === 'M' && row.posted)) problems.push('log-no-posted-M');
  if (k2Path) {
    const k2 = readStore(resolve(k2Path));
    const n = Math.max(file.E.length, k2.E.length);
    let diff = 0;
    for (let i = 0; i < n; i++) {
      const a = i < file.E.length ? file.E[i] : null;
      const b = i < k2.E.length ? k2.E[i] : null;
      if (a !== b) diff += 1;
    }
    if (diff) problems.push('E-diff ' + diff);
  }
  return { problems, added: added.map((ev) => ({ store: ev.store, from: ev.from, via: ev.via, posted: ev.posted, status: ev.status, sha256: ev.sha256, bytes: ev.bytes })) };
}

async function perform(ctx, step, hooks, pose) {
  if (step.commitStart) {
    ctx._baseline = {
      storeLog: savesOf(ctx).length,
      callbacks: holder.events.length,
      queue: holder.queue.length,
    };
  }
  if (step.action === 'setup' || step.action === 'check') {
    /* observation only */
  } else if (step.action === 'enter') {
    if (!hooks) throw new Error('enter without hooks ' + step.id);
    hooks.enter();
  } else if (step.action === 'key') ctx.press(step.key);
  else if (step.action === 'dial') {
    ctx.s.dial_input(step.dial, step.detents || 1);
    ctx.s.camapp.pump();
    ctx.idle(500);
  } else if (step.action === 'edge') {
    if (hooks) hooks.refresh();
    ctx.key(step.key, step.dir);
    ctx.idle(250);
  } else if (step.action === 'pose') {
    pose.setPose(step.key);
    pose.deliver();
    ctx.idle(600);
    setKey(ctx, 0x1db1, 0, 1);
    setKey(ctx, 0x1dc1, 0, 1);
    if (hooks) hooks.refresh();
    ctx.emit('behaviour', {
      step: step.id,
      label: 'EMULATOR-ONLY test setup. pose.mjs stand-in, then the link setters are written again. Role: test setup.',
    });
  } else if (step.action === 'size-setup') {
    const buf = Buffer.from([4]);
    ctx.l.sim.write(EXT + 0x08, buf);
    ctx.l.sim.write(EXT_CACHED + 0x08, buf);
    ctx.emit('behaviour', {
      step: step.id,
      label: 'EMULATOR-ONLY test setup. The direct screen cannot set mirror 0x9a41[0]. Write 4 at 0xa031eeb8 and 0x6031eeb8. Role: test setup.',
    });
  } else if (step.action === 'enable-custom') {
    for (let i = 0; i < 11; i++) setKey(ctx, 0x5a11, i, 1);
    ctx.emit('behaviour', {
      step: step.id,
      label: 'EMULATOR-ONLY test setup. Mirror 0x5a11[0..10]=1 while the flag is set, so the direct dial can reach C1. Live half-press cells are not written. Role: test setup.',
    });
  } else if (step.action === 'seed-c1') {
    setKey(ctx, 0x1dd1, 2, 3);
    setKey(ctx, 0x1dd1, 3, 3);
    ctx.emit('behaviour', {
      step: step.id,
      label: 'EMULATOR-ONLY test setup. Mirror C1 slots start at the live 3x3. The size-editor detents then move them to [5,7]. Role: test setup.',
    });
  } else throw new Error('bad action ' + step.action);
  if (step.saveJudge) ctx.idle(1200);
}

async function main() {
  const poseFile = resolve('ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs');
  const poseHash = createHash('sha256').update(readFileSync(poseFile)).digest('hex');
  if (poseHash !== POSE_SHA) throw new Error('pose hash ' + poseHash);
  emit({ id: tag + '-pose-import', step: 'pose-import', pass: true, problems: [], expected: { sha256: POSE_SHA }, actual: { sha256: poseHash } });

  process.env.OM_EMU_MODEL = 'E147';
  const menuHref = pathToFileURL(resolve(checkout, 'emu/src/lab/menu.mjs')).href;
  const modelHref = pathToFileURL(resolve(checkout, 'emu/src/fw/model.mjs')).href;
  const pngHref = pathToFileURL(resolve(checkout, 'emu/checks/lib/png.mjs')).href;
  const rgbHref = pathToFileURL(resolve(checkout, 'emu/src/lab/display.mjs')).href;
  dynamicImports.push(
    resolve(checkout, 'emu/src/lab/menu.mjs'),
    resolve(checkout, 'emu/src/fw/model.mjs'),
    resolve(checkout, 'emu/checks/lib/png.mjs'),
    resolve(checkout, 'emu/src/lab/display.mjs'),
  );
  const menuMod = await import(menuHref);
  const modelMod = await import(modelHref);
  const pngMod = await import(pngHref);
  const rgbMod = await import(rgbHref);
  png = { write_png: pngMod.write_png, words_to_rgb: rgbMod.words_to_rgb };
  await installWitness(menuMod);

  const stores = {};
  const mainPaths = {};
  for (const role of ROLES) {
    holder.events = [];
    holder.queue = [];
    const nv = 'work/out/nvram-' + tag + '-' + role + '.json';
    const overlay = role !== 'k1';
    const hooksOn = role === 'c1' || role === 'c2';
    let baseline = null;
    const runPhase = async (phase, suffix) => {
      const phaseSteps = table.steps.filter((s) => s.phase === phase && s.who.includes(role));
      const result = await runZone({
        checkout,
        outPath: 'work/out/session-' + tag + '-' + role + suffix + '.jsonl',
        tag: tag + '-' + role + suffix,
        candidate: overlay,
        help: overlay,
        rowLabel: overlay,
        fatalShots: true,
        nvramPath: nv,
        overlayCsv: overlay ? OVERLAY : null,
        explanation: hooksOn
          ? role + ' combined profile read and editor restore. EMULATOR-ONLY. Role: behaviour.'
          : (overlay
            ? role + ' combined overlay, no profile-read hook and no editor hooks, flag off. EMULATOR-ONLY. Role: behaviour.'
            : role + ' stock. No overlay.'),
        change: hooksOn ? 'EMULATOR-ONLY combined configuration. Role: behaviour.' : 'none',
        async drive(ctx) {
          const hooks = hooksOn ? installCombined(ctx, modelMod, menuMod) : null;
          const pose = phase === 'main' ? attachPose(ctx.l) : null;
          const brought = ctx.bringUp();
          ctx.emit('behaviour', {
            step: 'bring-up',
            label: 'EMULATOR-ONLY native bring-up 0x6071181e, 0x608fe1b0, 0x609df7e4, task 105. Role: behaviour.',
            ...brought,
          });
          ctx.s.switch_input('lever', 1);
          ctx.s.camapp.pump();
          ctx.idle(500);
          const { A } = modelMod;
          const api = A(0x50ac4afe);
          const argument = ctx.l.call(ctx.native(0x604050e5), { d0: 289, d1: 0 }, null, null, 200000).d0 >>> 0;
          ctx.l.call(api, { d0: 289, d1: argument }, null, null, 200000);
          ctx.l.call(api, { d0: 1712, d1: 0 }, null, null, 200000);
          ctx.idle(500);
          ctx.emit('behaviour', {
            step: 's-af',
            label: 'EMULATOR-ONLY test setup. Public focus API sets mode 289 to S-AF and 1712 to 0. Role: test setup.',
          });
          if (pose) {
            pose.setPose('landscape');
            pose.deliver();
            ctx.idle(600);
          }
          setKey(ctx, 0x1db1, 0, 1);
          setKey(ctx, 0x1dc1, 0, 1);
          ctx.emit('behaviour', {
            step: 'link-on',
            label: 'EMULATOR-ONLY test setup. Setter writes 0x1db1[0]=1 and 0x1dc1[0]=1. The half-press zone is set with keys. Role: test setup.',
          });
          if (hooks) hooks.refresh();
          for (const step of phaseSteps) {
            if (step.editor && !hooks) throw new Error('editor step without hooks ' + step.id);
            await perform(ctx, step, hooks, pose);
            if (step.commitStart) baseline = ctx._baseline;
            const view = capture(ctx, role, (suffix ? 're-' : '') + step.id);
            const actual = snapshot(ctx, view);
            if (pose) {
              const now = pose.read();
              actual.poseIndex = now.index;
              actual.poseExif = now.exif;
              actual.poseWord = ctx.l.sim.u32(POSE) >>> 0;
            }
            let saveMeta = null;
            const problems = mode === 'reference' ? invariants(role, step, actual) : fieldProblems(step, actual);
            problems.push(...identityProblems(step, actual));
            if (step.saveJudge) {
              if (!baseline) throw new Error('save judged without a baseline');
              const k2Path = mode === 'accept' ? reference.nvramMain.k2 : null;
              saveMeta = judgeSave(ctx, baseline, nv, k2Path);
              if (role === 'k2' || role === 'c1' || role === 'c2') problems.push(...saveMeta.problems.map((p) => 'save ' + p));
            }
            const row = recordOf(actual);
            if (mode === 'reference') recorded[role][step.id] = row;
            emit({
              id: role + '-' + step.id, role, step: step.action, key: step.key || null,
              pass: problems.length === 0, problems, actual: row,
              save: saveMeta,
            });
            if (problems.length) throw new Error(role + '-' + step.id + ' ' + problems.join(','));
          }
        },
      });
      if (!result.ok) throw new Error(role + ' ' + phase + ' ' + result.failed);
    };
    await runPhase('main', '');
    const mainFile = resolve('work/out/nvram-' + tag + '-' + role + '-main.json');
    writeFileSync(mainFile, readFileSync(resolve(nv)));
    mainPaths[role] = 'work/out/nvram-' + tag + '-' + role + '-main.json';
    stores[role] = readStore(mainFile);
    await runPhase('reopen', '-reopen');
  }

  if (mode === 'reference') {
    const diffs = compareStores(stores.k1, stores.k2);
    const diffPath = resolve('work/out/store-diff-' + tag + '-k1-k2.json');
    writeFileSync(diffPath, JSON.stringify({ count: diffs.length, diffs }, null, 2) + '\n');
    emit({
      id: tag + '-k1-k2-stores', role: 'k1', step: 'store', pass: true, problems: [],
      expected: { report: 'every offset, zero not required' }, actual: { count: diffs.length, diffs },
    });
    const body = {
      tag, mode, nvramMain: mainPaths, k1: recorded.k1, k2: recorded.k2,
      storeDiffCount: diffs.length, storeDiffFile: 'work/out/store-diff-' + tag + '-k1-k2.json',
    };
    writeFileSync(REF_PATH, JSON.stringify(body) + '\n');
    const hash = createHash('sha256').update(readFileSync(REF_PATH)).digest('hex');
    writeFileSync(HASH_PATH, hash + '  work/out/reference-t8b.json\n');
    emit({ id: tag + '-reference-hash', step: 'hash', pass: true, problems: [], expected: { file: 'work/out/reference-t8b.json' }, actual: { sha256: hash, bytes: statSync(REF_PATH).size } });
  } else {
    const k2 = readStore(resolve(reference.nvramMain.k2));
    for (const role of ['c1', 'c2']) {
      const diffs = compareStores(stores[role], k2);
      const problems = diffs.length ? ['store ' + diffs.length] : [];
      emit({
        id: role + '-store', role, step: 'store', pass: problems.length === 0, problems,
        expected: { diffs: [] }, actual: { count: diffs.length, diffs },
      });
      if (problems.length) throw new Error(role + '-store ' + diffs.length);
    }
  }
  emit({ id: tag + '-done', step: 'done', pass: true, ok: true, problems: [], expected: { ok: true }, actual: { ok: true } });
}

try {
  await main();
} catch (error) {
  emit({
    id: tag + '-done', step: 'done', pass: false, ok: false,
    problems: [String(error && error.message ? error.message : error)],
    expected: { ok: true }, actual: { ok: false, error: String(error && error.stack ? error.stack : error) },
  });
  process.exitCode = 1;
} finally {
  if (!existsSync(inventoryPath)) {
    const rows = inventory([resolve('work/scripts/accept_t8b_v1.mjs')]);
    writeFileSync(inventoryPath, JSON.stringify({ tag, rows }, null, 2) + '\n');
  }
}
