// module.register load hook. A hashing or record error fails the load.
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let recordPath = null;

export function initialize(data) {
  recordPath = data && data.recordPath;
  if (!recordPath) throw new Error('inventory hook has no record path');
  appendFileSync(recordPath, JSON.stringify({ ready: true }) + '\n');
}

export function noteFile(path) {
  const bytes = readFileSync(path);
  return {
    path: path.replaceAll('\\', '/'),
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    at: 'import',
  };
}

function note(url) {
  if (!recordPath) throw new Error('inventory hook is not initialised');
  if (!url.startsWith('file:')) return;
  const path = fileURLToPath(url);
  const row = noteFile(path);
  appendFileSync(recordPath, JSON.stringify(row) + '\n');
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  note(url);
  return result;
}
