// Loader hook. Every file URL loaded after registration is hashed, including the freeze.
// A resolvable emulator module is refused unless createReal has armed T12B_ALLOW_EMULATOR.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let recordPath = null;
let freezeMap;

function norm(path) {
  return String(path).replaceAll('\\', '/');
}

function freezeFile() {
  return norm(pathResolve(process.env.T12B_FREEZE_PATH || 'work/harness-freeze.json'));
}

function shouldEnforce() {
  if (process.env.T12B_FREEZE_CAPTURE === '1') return false;
  if (process.env.T12B_RUNNER !== '1') return false;
  return true;
}

function isEmulator(value) {
  return norm(value).toLowerCase().includes('/om-emu/emu/');
}

function policyError(specifier) {
  const error = new Error('policy-refuse: emulator module ' + specifier);
  error.code = 'POLICY_EMULATOR';
  return error;
}

function loadFreeze() {
  if (freezeMap !== undefined) return freezeMap;
  if (!shouldEnforce()) {
    freezeMap = null;
    return null;
  }
  let raw;
  try { raw = readFileSync(freezeFile()); }
  catch {
    throw new Error('refuse to start: freeze missing');
  }
  const body = JSON.parse(raw.toString('utf8'));
  freezeMap = new Map();
  for (const row of body.files || []) freezeMap.set(norm(row.path), row);
  for (const row of (body.checkout && body.checkout.files) || []) freezeMap.set(norm(row.path), row);
  return freezeMap;
}

export function initialize(data) {
  recordPath = data && data.recordPath;
  if (!recordPath) throw new Error('inventory hook has no record path');
  appendFileSync(recordPath, JSON.stringify({ ready: true }) + '\n');
}

function note(url) {
  if (!recordPath) throw new Error('inventory hook is not initialised');
  if (!url.startsWith('file:')) return;
  const path = norm(fileURLToPath(url));
  const bytes = readFileSync(fileURLToPath(url));
  const rec = {
    path,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    at: 'import',
  };
  const map = loadFreeze();
  if (map && path !== freezeFile()) {
    const got = map.get(path);
    if (!got) throw new Error('refuse to start: missing ' + path);
    if (got.sha256 !== rec.sha256 || got.bytes !== rec.bytes) throw new Error('refuse to start: differs ' + path);
  }
  appendFileSync(recordPath, JSON.stringify(rec) + '\n');
}

export async function resolve(specifier, context, nextResolve) {
  if (process.env.T12B_ALLOW_EMULATOR === '1') return nextResolve(specifier, context);
  const resolved = await nextResolve(specifier, context);
  const url = resolved && resolved.url ? resolved.url : '';
  if (isEmulator(url) || isEmulator(specifier)) throw policyError(url || specifier);
  return resolved;
}

export async function load(url, context, nextLoad) {
  if (process.env.T12B_ALLOW_EMULATOR !== '1' && isEmulator(url)) throw policyError(url);
  const result = await nextLoad(url, context);
  note(url);
  return result;
}
