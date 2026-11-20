// Loader hook. Every file URL loaded after registration is hashed.
// In enforce mode a module missing from the freeze refuses the load. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let recordPath = null;
let freezeMap;

function norm(path) {
  return String(path).replaceAll('\\', '/');
}

function freezeFile() {
  return norm(resolve(process.env.T12B_FREEZE_PATH || 'work/harness-freeze.json'));
}

function loadFreeze() {
  if (freezeMap !== undefined) return freezeMap;
  if (process.env.T12B_FREEZE_ENFORCE !== '1') {
    freezeMap = null;
    return null;
  }
  let raw;
  try { raw = readFileSync(freezeFile()); }
  catch (error) {
    throw new Error('refuse to start: freeze missing');
  }
  const body = JSON.parse(raw.toString('utf8'));
  freezeMap = new Map();
  for (const row of body.files || []) freezeMap.set(norm(row.path), row);
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
  if (path === freezeFile()) return;
  const bytes = readFileSync(fileURLToPath(url));
  const rec = {
    path,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    at: 'import',
  };
  const map = loadFreeze();
  if (map) {
    const got = map.get(path);
    if (!got) throw new Error('refuse to start: missing ' + path);
    if (got.sha256 !== rec.sha256 || got.bytes !== rec.bytes) throw new Error('refuse to start: differs ' + path);
  }
  appendFileSync(recordPath, JSON.stringify(rec) + '\n');
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  note(url);
  return result;
}
