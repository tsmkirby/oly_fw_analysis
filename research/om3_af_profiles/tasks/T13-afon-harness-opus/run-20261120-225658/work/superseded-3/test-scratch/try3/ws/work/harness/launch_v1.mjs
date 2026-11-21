// The only entry (design_v2 §2; review corrections 3 and 4). EMULATOR-ONLY harness.
//   node26 work/harness/launch_v1.mjs <plan> <tag> --freeze-sha <hex> [--identity <tag>] [--fake]
//   node26 work/harness/launch_v1.mjs <plan> <tag> --capture [--identity <tag>]      (fake-only freeze bootstrap)
// A run is valid only if work/out/<tag>.launch/exit.json has ok:true; a real proof needs mode "real" throughout.
// Capture mode runs the fake under broad bootstrap grants, records reads for make_freeze_v1.mjs, and always
// writes ok:false (it can never be a proof or an identity reference for a real or fake run).
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NODE_VERSION, PLANS, RUNTIME_LOGICAL, outPaths, pathKey, sha256, slash, validateTag } from './common_v1.mjs';
import { checkCompletion, checkEntries, readInventory } from './exitcheck_v1.mjs';
import { allowedReads, loadFreeze, physicalOf, readGrants, reverify, verifyFreeze } from './freeze_v1.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WS = path.resolve(HERE, '..', '..');
const RESEARCH = 'C:/Dev/OM3-research';

let exitWritten = false;
let launchDir = null;
const record = { ok: false, valid: false, problems: [], start: new Date().toISOString() };

function writeExit() {
  if (exitWritten || !launchDir) return;
  exitWritten = true;
  record.end = new Date().toISOString();
  if (record.problems.length) record.ok = false;
  record.valid = record.ok === true && record.mode === 'real';
  fs.writeFileSync(path.join(launchDir, 'exit.json'), JSON.stringify(record, null, 2) + '\n');
}
process.on('exit', () => { if (!exitWritten && launchDir) { record.problems.push('launcher exited before completion'); writeExit(); } });
process.on('uncaughtException', (e) => { record.problems.push('launcher error: ' + String(e && e.stack ? e.stack : e)); writeExit(); process.exit(1); });

function parse(argv) {
  const pos = [];
  const opt = { fake: false, capture: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fake') opt.fake = true;
    else if (a === '--capture') opt.capture = true;
    else if (a === '--freeze-sha' || a === '--identity' || a === '--workspace') opt[a.slice(2)] = argv[++i];
    else if (a.startsWith('--')) throw new Error('unknown option ' + a);
    else pos.push(a);
  }
  if (pos.length !== 2) throw new Error('usage: launch_v1.mjs <plan> <tag> --freeze-sha <hex> [--identity <tag>] [--fake] | --capture');
  return { plan: pos[0], tag: pos[1], ...opt };
}

function refuseExisting(paths, tag, why) {
  // Preserves the existing tag's evidence: nothing under <tag>/ or <tag>.launch/ is touched.
  fs.mkdirSync(paths.refusals, { recursive: true });
  const f = path.join(paths.refusals, tag + '-' + Date.now() + '.json');
  fs.writeFileSync(f, JSON.stringify({ tag, refused: why, at: new Date().toISOString() }, null, 2) + '\n');
  process.stderr.write('refused: ' + why + ' (' + slash(f) + ')\n');
  process.exit(2);
}

function hashFile(p) {
  const b = fs.readFileSync(p);
  return { bytes: b.length, sha256: sha256(b) };
}

function listOutputs(dir) {
  const out = [];
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) walk(p, r);
      else out.push({ path: r, ...hashFile(p) });
    }
  };
  walk(dir, '');
  return out.sort((a, b) => (a.path < b.path ? -1 : 1));
}

async function main() {
  const opt = parse(process.argv.slice(2));
  if (!PLANS.includes(opt.plan)) throw new Error('unknown plan ' + opt.plan);
  validateTag(opt.tag);
  const paths = outPaths(WS, opt.tag);
  if (fs.existsSync(paths.child) || fs.existsSync(paths.launch)) refuseExisting(paths, opt.tag, 'tag exists');
  fs.mkdirSync(paths.outRoot, { recursive: true });
  try { fs.mkdirSync(paths.launch); } catch (e) { refuseExisting(paths, opt.tag, 'launch directory ' + e.code); }
  launchDir = paths.launch;
  fs.mkdirSync(paths.child);
  const mode = opt.capture ? 'capture' : (opt.fake ? 'fake' : 'real');
  Object.assign(record, { mode, plan: opt.plan, tag: opt.tag, identityTag: opt.identity || null });
  if (opt.capture && (opt.fake || opt['freeze-sha'])) throw new Error('--capture takes neither --fake nor --freeze-sha');

  // Runtime.
  if (process.version !== NODE_VERSION) record.problems.push('runtime version ' + process.version);
  const runtimeCanon = fs.realpathSync.native(physicalOf(WS, RUNTIME_LOGICAL));
  if (pathKey(fs.realpathSync.native(process.execPath)) !== pathKey(runtimeCanon)) record.problems.push('runtime path ' + process.execPath);
  const runtimeHash = hashFile(process.execPath);
  record.runtime = { path: slash(process.execPath), version: process.version, ...runtimeHash };

  // Freeze (real, fake) or bootstrap grants (capture).
  let freeze = null;
  let check = null;
  let reads;
  if (mode !== 'capture') {
    const loaded = loadFreeze(WS, opt['freeze-sha']);
    freeze = loaded.freeze;
    record.freezeSha = loaded.sha256;
    check = verifyFreeze(WS, freeze);
    record.problems.push(...check.problems.map((p) => 'freeze: ' + p));
    const rt = check.facts.get(freeze.runtime.path);
    if (!rt || rt.sha256 !== runtimeHash.sha256) record.problems.push('runtime sha256 not the frozen one');
  } else {
    record.freezeSha = null;
  }
  if (record.problems.length) return;

  const planFile = path.join(HERE, 'plan_v1.mjs');
  const planSha = sha256(fs.readFileSync(planFile));
  if (check && (!check.facts.get('work/harness/plan_v1.mjs') || check.facts.get('work/harness/plan_v1.mjs').sha256 !== planSha)) record.problems.push('plan module not frozen');
  record.planSha = planSha;

  // Per-run input extension: nonce and, for proof/display plans, the sealed identity files.
  const extension = [];
  const nonce = randomBytes(32).toString('hex');
  const noncePath = path.join(paths.launch, 'nonce');
  fs.writeFileSync(noncePath, nonce + '\n');
  const ext = (p, reason) => {
    const h = hashFile(p);
    extension.push({ logical: slash(path.relative(WS, p)), physical: p, canonical: fs.realpathSync.native(p), reason, ...h });
  };
  ext(noncePath, 'nonce');
  let identityPaths = null;
  if (opt.plan !== 'identity') {
    if (!opt.identity) { record.problems.push('plan ' + opt.plan + ' needs --identity <tag>'); return; }
    const idPaths = outPaths(WS, opt.identity);
    const exitFile = path.join(idPaths.launch, 'exit.json');
    if (!fs.existsSync(exitFile)) { record.problems.push('identity exit record missing'); return; }
    const idExit = JSON.parse(fs.readFileSync(exitFile, 'utf8'));
    const want = mode === 'capture' ? idExit.captureComplete === true : idExit.ok === true;
    if (!want) record.problems.push('identity run ' + opt.identity + ' is not ok');
    if (idExit.mode !== mode) record.problems.push('identity mode ' + idExit.mode + ' != ' + mode);
    if (idExit.plan !== 'identity') record.problems.push('identity tag ran plan ' + idExit.plan);
    if (idExit.freezeSha !== record.freezeSha) record.problems.push('identity freeze differs');
    if (idExit.planSha !== planSha) record.problems.push('identity plan module differs');
    for (const name of ['identity.json', 'identity.seal.json']) {
      const listed = (idExit.outputs || []).find((o) => o.path === name);
      const p = path.join(idPaths.child, name);
      if (!listed || !fs.existsSync(p)) { record.problems.push('identity output ' + name + ' missing'); continue; }
      const h = hashFile(p);
      if (h.sha256 !== listed.sha256 || h.bytes !== listed.bytes) record.problems.push('identity output ' + name + ' changed since its run');
      ext(p, 'identity');
    }
    if (record.problems.length) return;
    const seal = JSON.parse(fs.readFileSync(path.join(idPaths.child, 'identity.seal.json'), 'utf8'));
    if (seal.sha256 !== hashFile(path.join(idPaths.child, 'identity.json')).sha256) record.problems.push('identity seal does not verify');
    identityPaths = { json: path.join(idPaths.child, 'identity.json'), seal: path.join(idPaths.child, 'identity.seal.json') };
  }
  if (record.problems.length) return;
  fs.writeFileSync(path.join(paths.launch, 'inputs.json'), JSON.stringify(extension.map(({ physical, canonical, ...e }) => ({ ...e, canonical: slash(canonical) })), null, 2) + '\n');
  record.extensionSha = hashFile(path.join(paths.launch, 'inputs.json')).sha256;

  if (mode === 'capture') {
    reads = [path.join(WS, 'work', 'harness') + path.sep, path.join(WS, 'om-emu') + path.sep, path.join(WS, 'ref') + path.sep,
      path.resolve(RESEARCH) + path.sep, ...extension.flatMap((e) => [e.physical, e.canonical])];
  } else reads = readGrants(check, extension);
  const sentinel = path.join(WS, 'work', 'freeze', 'sentinel-not-granted.txt');
  const flags = ['--permission', ...[...new Set(reads)].map((r) => '--allow-fs-read=' + r), '--allow-fs-write=' + paths.child + path.sep];
  const entry = path.join(HERE, 'run_v1.mjs');
  const childArgs = ['--plan', opt.plan, '--tag', opt.tag, '--mode', mode, '--out', paths.child, '--nonce', noncePath,
    '--freeze-sha', record.freezeSha || 'none', '--plan-sha', planSha, '--execargv-sha', sha256(JSON.stringify(flags)), '--sentinel', sentinel];
  if (identityPaths) childArgs.push('--identity-json', identityPaths.json, '--identity-seal', identityPaths.seal);
  const mount = freeze ? freeze.mounts.find((m) => m.logical === 'ref') : { logical: 'ref', target: fs.realpathSync.native(path.join(WS, 'ref')) };
  if (mount) childArgs.push('--mount-from', path.join(WS, 'ref'), '--mount-to', path.resolve(mount.target));
  const env = { OM_EMU_MODEL: 'E147', OM_EMU_NVRAM: 'off', SystemRoot: process.env.SystemRoot || 'C:\\Windows', PATH: path.dirname(process.execPath) };
  fs.writeFileSync(path.join(paths.launch, 'cmd.json'), JSON.stringify({ execPath: process.execPath, flags, entry, childArgs, env, cwd: WS, start: record.start, freezeSha: record.freezeSha, extensionSha: record.extensionSha }, null, 2) + '\n');
  const stdoutFile = path.join(paths.launch, 'stdout.txt');
  const stderrFile = path.join(paths.launch, 'stderr.txt');
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [...flags, entry, ...childArgs], { cwd: WS, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const so = fs.createWriteStream(stdoutFile);
    const se = fs.createWriteStream(stderrFile);
    child.stdout.pipe(so);
    child.stderr.pipe(se);
    child.on('error', (e) => { record.problems.push('spawn ' + e.message); });
    child.on('close', (c, sig) => { let n = 2; const done = () => { if (--n === 0) resolve(sig ? 'signal ' + sig : c); }; so.end(done); se.end(done); });
  });
  record.childExit = code;
  if (code !== 0) record.problems.push('child exit ' + code);

  // After exit.
  const first = fs.readFileSync(stdoutFile, 'utf8').split('\n')[0];
  let echo = null;
  try { echo = JSON.parse(first); } catch { /* reported below */ }
  if (!echo || echo.nonce !== nonce) record.problems.push('child did not echo the nonce first');
  if (!echo || echo.execArgvSha !== sha256(JSON.stringify(flags))) record.problems.push('child flag digest differs');
  if (check) record.problems.push(...reverify(WS, freeze, check.facts));
  for (const e of extension) {
    const h = hashFile(e.physical);
    if (h.sha256 !== e.sha256) record.problems.push('extension input changed: ' + e.logical);
  }
  const inv = readInventory(path.join(paths.child, 'inventory.jsonl'));
  record.problems.push(...inv.problems);
  record.inventory = { count: inv.count, chain: inv.chain };
  const allowed = check ? allowedReads(check, extension) : null;
  const entryCheck = checkEntries(inv.entries, allowed, [WS, path.resolve(RESEARCH)]);
  record.problems.push(...entryCheck.problems);
  if (mode === 'capture') record.reads = entryCheck.reads;

  // Affirmative completion.
  const { expectedOps } = await import(pathToFileURL(planFile).href);
  const comp = checkCompletion(path.join(paths.child, 'complete.json'), { plan: opt.plan, planSha, mode, expected: expectedOps(opt.plan) });
  record.problems.push(...comp.problems);
  record.completion = comp.summary;
  record.outputs = listOutputs(paths.child);
  if (comp.summary && comp.summary.identity) {
    const listed = record.outputs.find((o) => o.path === 'identity.json');
    if (!listed || listed.sha256 !== comp.summary.identity.sha256) record.problems.push('identity.json does not match the child seal');
  }
  if (mode === 'capture') {
    record.captureComplete = record.problems.length === 0;
    record.problems.push('capture mode: fake-only freeze bootstrap, never a valid run');
    record.ok = false;
  } else record.ok = record.problems.length === 0;
}

main().then(() => { writeExit(); process.exit(record.ok ? 0 : 1); }, (e) => {
  record.problems.push(String(e && e.message ? e.message : e));
  writeExit();
  process.exit(1);
});
