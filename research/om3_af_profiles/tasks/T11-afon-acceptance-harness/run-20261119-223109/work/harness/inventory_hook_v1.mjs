// module.register load hook. Records every imported file's path, length and SHA-256.
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let recordPath = null;

export function initialize(data) {
  recordPath = data && data.recordPath;
  if (!recordPath) return;
  appendFileSync(recordPath, JSON.stringify({ ready: true }) + '\n');
}

function note(url) {
  if (!recordPath || !url.startsWith('file:')) return;
  let path;
  try { path = fileURLToPath(url); } catch { return; }
  let bytes;
  try { bytes = readFileSync(path); } catch { return; }
  appendFileSync(recordPath, JSON.stringify({
    path,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    at: 'import',
  }) + '\n');
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  try { note(url); } catch { /* a record failure must not replace the loaded module */ }
  return result;
}
