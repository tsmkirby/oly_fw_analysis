// Freeze maker (design_v2 §5; review correction 3). EMULATOR-ONLY harness. Never starts the emulator.
//   node26 work/harness/make_freeze_v2.mjs <capture-prefix> [--minimal]   (v2: runs launch_v2.mjs)
// --minimal (unit tests in a scratch workspace only): directories work/harness only, real-only inputs = runtime only.
// Runs all six plans through the same launcher and child in capture mode (fake adapter, bootstrap grants), then
// writes work/freeze/freeze_v1.json as: the union of the capture runs' recorded reads, plus the fully enumerated
// directories work/harness and om-emu (the whole OM-Emu checkout), plus real-only inputs with reasons.
// Prints the freeze SHA-256, which the coordinator records outside the workspace; the launcher requires it.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLANS, RUNTIME_LOGICAL, outPaths, pathKey, sha256, slash, validateTag } from './common_v1.mjs';
import { FREEZE_LOGICAL, enumerate, physicalOf } from './freeze_v1.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WS = path.resolve(HERE, '..', '..');
const RESEARCH = fs.realpathSync.native(path.join(WS, 'ref'));
const MOUNTS = [{ logical: 'ref', target: slash(RESEARCH) }];
const MINIMAL = process.argv.includes('--minimal');
// OM-Emu: the folders a session reads (code, ROM blocks, artifacts) are frozen whole; .git, .github, docs, tools and
// analysis are not granted at all, so a read there fails visibly and copy-specific git metadata cannot fail the freeze.
const DIRS = MINIMAL ? ['work/harness'] : ['work/harness', 'om-emu/emu', 'om-emu/unpacked', 'om-emu/artifacts'];
const REAL_ONLY = [
  ['inputs/00_0100_50000020.decoded.bin', 'real-only: decoded main image read by session_v1 (overlay check, helper hashes)'],
  ['inputs/02_0106_458c0020.decoded.bin', 'real-only: decoded resource 0106 hashed by session_v1'],
  ['ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv', 'real-only: T8 combined overlay (T8d and zone sessions)'],
  ['ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv', 'real-only: T6 overlay (display sessions)'],
  ['ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv', 'real-only: T3a overlay hashed by session_v1 helper record'],
  ['ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k1e-a.json', 'real-only: T9d display reference A (frame, idle period, bound)'],
  ['ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k1e-b.json', 'real-only: T9d display reference B'],
  ['ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k2.json', 'real-only: T9d K2 display reference edges'],
  ['ref/analysis/button-af/readiness/t3m-afon-editor-state-leak/scripts/accept_lib_v4.mjs', 'real-only: titleBand (real_v1)'],
  ['ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs', 'real-only: attachPose (real_v1)'],
  ['om-emu/BLOBS.sha256', 'OM-Emu checkout top level (blob digests)'],
  ['om-emu/BLOBS.md', 'OM-Emu checkout top level'],
  ['om-emu/README.md', 'OM-Emu checkout top level'],
  ['om-emu/LICENSE', 'OM-Emu checkout top level'],
  [RUNTIME_LOGICAL, 'pinned runtime (launcher compares process.execPath and its SHA-256)'],
];

function logicalOf(canonical) {
  const c = path.resolve(canonical);
  const wsCanon = fs.realpathSync.native(WS);
  if (pathKey(c).startsWith(pathKey(RESEARCH) + '/')) return 'ref/' + slash(path.relative(RESEARCH, c));
  if (pathKey(c).startsWith(pathKey(wsCanon) + '/')) return slash(path.relative(wsCanon, c));
  throw new Error('read outside workspace and research tree: ' + canonical);
}

function fileEntry(logical, why) {
  const b = fs.readFileSync(physicalOf(WS, logical));
  const e = { path: logical, bytes: b.length, sha256: sha256(b) };
  if (why) e.why = why;
  return e;
}

function capture(prefix) {
  const tags = {};
  for (const plan of PLANS) {
    const tag = validateTag(prefix + '-' + plan);
    const args = [path.join(HERE, 'launch_v2.mjs'), plan, tag, '--capture'];
    if (plan !== 'identity') args.push('--identity', tags.identity);
    const r = spawnSync(process.execPath, args, { cwd: WS, stdio: 'inherit' });
    const exitFile = path.join(outPaths(WS, tag).launch, 'exit.json');
    const exit = JSON.parse(fs.readFileSync(exitFile, 'utf8'));
    if (!exit.captureComplete) throw new Error('capture ' + plan + ' incomplete: ' + exit.problems.join('; ') + ' (exit ' + r.status + ')');
    tags[plan] = tag;
  }
  return tags;
}

function main() {
  const prefix = process.argv[2];
  if (!prefix) throw new Error('usage: make_freeze_v2.mjs <capture-prefix>');
  const tags = capture(prefix);
  const files = new Map();
  const captured = {};
  for (const [plan, tag] of Object.entries(tags)) {
    const exit = JSON.parse(fs.readFileSync(path.join(outPaths(WS, tag).launch, 'exit.json'), 'utf8'));
    captured[plan] = { tag, reads: exit.reads.length, exitSha: sha256(fs.readFileSync(path.join(outPaths(WS, tag).launch, 'exit.json'))) };
    for (const r of exit.reads) {
      let logical;
      try { logical = logicalOf(r.path); } catch (e) { throw new Error(plan + ': ' + e.message); }
      if (logical.startsWith('work/out/')) continue; // per-run extension (identity inputs), not frozen
      if (!files.has(logical)) files.set(logical, fileEntry(logical, DIRS.some((d) => logical.startsWith(d + '/')) ? null : 'capture read (' + plan + ')'));
      if (files.get(logical).sha256 !== r.sha256) throw new Error('changed during capture: ' + logical);
    }
  }
  for (const d of DIRS) {
    const listed = enumerate(WS, d, MOUNTS);
    if (listed.problems.length) throw new Error(listed.problems.join('; '));
    for (const lg of listed.files) if (!files.has(lg)) files.set(lg, fileEntry(lg, null));
  }
  for (const [lg, why] of REAL_ONLY) if ((!MINIMAL || lg === RUNTIME_LOGICAL) && !files.has(lg)) files.set(lg, fileEntry(lg, why));
  const freeze = {
    version: 1,
    task: 'T13',
    minimal: MINIMAL,
    method: 'union of six capture-mode runs (fake adapter, same launcher and child) + every file under work/harness, om-emu/emu, om-emu/unpacked and om-emu/artifacts + the OM-Emu top-level files + real-only inputs with reasons',
    captures: captured,
    pins: { omEmuRevision: '4e4ec4ef084542a7e30eecce56970c7e09c123c9', omEmuDiffDigest: '61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702', source: 'PRIOR: PROJECT-STATE.md pins (Test-Pins.ps1)' },
    runtime: { path: RUNTIME_LOGICAL, version: process.version },
    mounts: MOUNTS,
    dirs: DIRS,
    files: [...files.values()].sort((a, b) => (a.path < b.path ? -1 : 1)),
  };
  const out = physicalOf(WS, FREEZE_LOGICAL);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (fs.existsSync(out)) throw new Error('refusing to overwrite ' + FREEZE_LOGICAL);
  const raw = Buffer.from(JSON.stringify(freeze, null, 1) + '\n');
  fs.writeFileSync(out, raw);
  process.stdout.write(JSON.stringify({ freeze: FREEZE_LOGICAL, sha256: sha256(raw), bytes: raw.length, files: freeze.files.length }) + '\n');
}

main();
