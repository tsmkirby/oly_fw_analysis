// Restricted child (design_v2 §2), v5 (T13b: plan_v3, exec_v4; v3: inventory_v3). EMULATOR-ONLY harness.
// v2 (code review run-20261120-221318-review correction 2): the nonce and, in real and fake modes, the freeze are
// read before the inventory is installed and are recorded as 'preread' entries with the SHA-256 of the consumed
// bytes; the child also checks the freeze bytes against --freeze-sha itself.
// Static imports are Node built-ins only. Before any other module loads, it checks that it runs under the
// permission model with exactly the launcher's flags, that a path outside its grants is refused, that no NODE_*
// variable is set, and that the launcher's nonce is readable; it echoes the nonce and its flag digest first.
// It then installs the read/load inventory, runs the plan, and writes complete.json. Its output alone is never
// valid: only the launcher's <tag>.launch/exit.json can make a run valid.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function fail(msg) {
  process.stderr.write('run_v5: ' + msg + '\n');
  process.exit(3);
}

function args() {
  const a = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < a.length; i += 2) {
    if (!a[i].startsWith('--') || a[i + 1] === undefined) fail('argument ' + a[i]);
    out[a[i].slice(2)] = a[i + 1];
  }
  for (const k of ['plan', 'tag', 'mode', 'out', 'nonce', 'freeze-sha', 'plan-sha', 'execargv-sha', 'sentinel']) if (!out[k]) fail('missing --' + k);
  return out;
}

const A = args();
// 1. Permission model active, with exactly the launcher's flags.
if (!process.permission) fail('not started under --permission');
const flags = process.execArgv;
if (flags[0] !== '--permission' || flags.filter((f) => f === '--permission').length !== 1) fail('execArgv must start with one --permission');
const writes = flags.filter((f) => f.startsWith('--allow-fs-write='));
if (writes.length !== 1 || path.resolve(writes[0].slice('--allow-fs-write='.length)) !== path.resolve(A.out)) fail('execArgv write grant');
for (const f of flags.slice(1)) if (!f.startsWith('--allow-fs-read=') && !f.startsWith('--allow-fs-write=')) fail('unexpected flag ' + f);
const argvSha = createHash('sha256').update(JSON.stringify(flags)).digest('hex');
if (argvSha !== A['execargv-sha']) fail('execArgv digest differs from the launcher record');
// 2. No inherited Node options.
for (const k of Object.keys(process.env)) if (/^NODE_/i.test(k)) fail('environment ' + k + ' is set');
// 3. A path outside the grants is refused.
let refused = false;
try { fs.readFileSync(A.sentinel); } catch (e) { refused = e.code === 'ERR_ACCESS_DENIED'; }
if (!refused) fail('sentinel read was not refused');
if (process.permission.has('fs.write', path.resolve(A.out, '..'))) fail('parent output directory is writable');
// 4. Nonce.
let nonceBytes;
try { nonceBytes = fs.readFileSync(A.nonce); } catch (e) { fail('nonce unreadable ' + e.code); }
const nonce = nonceBytes.toString('utf8').trim();
let freezeBytes = null;
if (A['freeze-sha'] !== 'none') {
  if (!A.freeze) fail('missing --freeze');
  try { freezeBytes = fs.readFileSync(A.freeze); } catch (e) { fail('freeze unreadable ' + e.code); }
  if (createHash('sha256').update(freezeBytes).digest('hex') !== A['freeze-sha']) fail('freeze bytes differ from --freeze-sha');
}
process.stdout.write(JSON.stringify({ nonce, execArgvSha: argvSha, pid: process.pid }) + '\n');

// 5. Declared mount (freeze "mounts", verified by the launcher). Module resolution follows a relative import into
// the 'ref' junction with a realpath walk that needs read access to the junction itself; the permission model
// grants per path string, so a per-file grant does not cover it (probe: denied with file grants, allowed only with
// the whole junction granted). Instead of widening the grant, imports under the mount are resolved to the mount
// target's canonical path, which is granted file by file.
if (A['mount-from'] && A['mount-to']) {
  const fromUrl = pathToFileURL(path.resolve(A['mount-from'])).href.replace(/\/?$/, '/');
  const toUrl = pathToFileURL(path.resolve(A['mount-to'])).href.replace(/\/?$/, '/');
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if ((specifier.startsWith('.') || specifier.startsWith('file:')) && context.parentURL) {
        let url = null;
        try { url = new URL(specifier, context.parentURL).href; } catch { url = null; }
        if (url && url.toLowerCase().startsWith(fromUrl.toLowerCase())) return nextResolve(toUrl + url.slice(fromUrl.length), context);
      }
      return nextResolve(specifier, context);
    },
  });
}

const here = path.dirname(fileURLToPath(import.meta.url));
const local = (f) => pathToFileURL(path.join(here, f)).href;
const outDir = path.resolve(A.out);
const inv = await import(local('inventory_v3.mjs'));
const recorder = inv.installInventory({
  outFile: path.join(outDir, 'inventory.jsonl'),
  preloaded: [import.meta.url, local('common_v1.mjs'), local('inventory_v3.mjs')],
  prereads: [{ path: A.nonce, bytes: nonceBytes, api: 'nonce' }, ...(freezeBytes ? [{ path: A.freeze, bytes: freezeBytes, api: 'freeze' }] : [])],
});

const completionPath = path.join(outDir, 'complete.json');
let code = 1;
try {
  const { sha256 } = await import(local('common_v1.mjs'));
  const planBytes = fs.readFileSync(path.join(here, 'plan_v3.mjs'));
  const planSha = sha256(planBytes);
  if (planSha !== A['plan-sha']) throw new Error('plan module digest ' + planSha + ' differs from the launcher record');
  const { validatePlans } = await import(local('plan_v3.mjs'));
  const planProblems = validatePlans();
  if (planProblems.length) throw new Error('plan validation: ' + planProblems.slice(0, 5).join('; '));
  const { runPlan } = await import(local('exec_v4.mjs'));
  const freezeSha = A['freeze-sha'] === 'none' ? null : A['freeze-sha'];
  let adapter;
  let refs;
  if (A.mode === 'real') {
    const real = await import(local('real_v2.mjs'));
    adapter = real.createRealAdapter();
    const REF = 'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/';
    const k1eA = JSON.parse(fs.readFileSync(REF + 'ref-k1e-a.json', 'utf8'));
    const k1eB = JSON.parse(fs.readFileSync(REF + 'ref-k1e-b.json', 'utf8'));
    const k2 = JSON.parse(fs.readFileSync(REF + 'ref-k2.json', 'utf8'));
    const { CENTRE } = await import(pathToFileURL(path.resolve('ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs')).href);
    refs = {
      display: {
        k1eFrame: { a: real.asFrame(k1eA.frame), b: real.asFrame(k1eB.frame) },
        k2Edges: k2.edges.map((e) => real.asFrame(e)),
        k1Frame: real.asFrame({ marks: CENTRE, pixels: 444, n31: 444 }),
        idlePeriodMs: k1eA.idlePeriodMs,
        boundMs: k1eA.boundMs,
      },
    };
  } else if (A.mode === 'fake' || A.mode === 'capture') {
    const fake = await import(local('fake_v2.mjs'));
    adapter = fake.createFakeAdapter();
    refs = fake.fakeRefs();
  } else throw new Error('mode ' + A.mode);
  let identity = null;
  if (A.plan !== 'identity') {
    if (!A['identity-json'] || !A['identity-seal']) throw new Error('identity inputs missing');
    const { readIdentity } = await import(local('seal_v1.mjs'));
    identity = readIdentity(A['identity-json'], A['identity-seal'], { planSha, freezeSha, mode: A.mode }).body;
  }
  const completion = await runPlan({ planName: A.plan, mode: A.mode, planSha, freezeSha, adapter, refs, outDir, identity });
  completion.inventoryProblems = recorder.problems.slice();
  if (recorder.problems.length) completion.ok = false;
  fs.writeFileSync(completionPath, JSON.stringify(completion, null, 2) + '\n');
  code = completion.ok ? 0 : 1;
} catch (error) {
  const body = { ok: false, plan: A.plan, mode: A.mode, error: String(error && error.stack ? error.stack : error), inventoryProblems: recorder.problems.slice() };
  try { fs.writeFileSync(completionPath, JSON.stringify(body, null, 2) + '\n'); } catch { /* reported by the parent */ }
  process.stderr.write(body.error + '\n');
  code = 1;
} finally {
  recorder.end({ exitCode: code });
}
process.exitCode = code;
