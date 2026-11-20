// Pure inventory helpers. The registrar installs the wrappers; this module does not.
// Every fs.promises function is classified. An unclassified function fails closed.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import fs from 'node:fs';

export const PROMISE_READS = [
  'access', 'copyFile', 'cp', 'glob', 'lstat', 'open', 'opendir', 'readFile',
  'readdir', 'readlink', 'realpath', 'stat', 'statfs', 'watch',
];

export const PROMISE_WRITES = [
  'appendFile', 'chmod', 'chown', 'lchmod', 'lchown', 'link', 'lutimes',
  'mkdir', 'mkdtemp', 'mkdtempDisposable', 'rename', 'rm', 'rmdir', 'symlink',
  'truncate', 'unlink', 'utimes', 'writeFile',
];

export function promiseFunctions() {
  return Object.keys(fs.promises).filter((name) => typeof fs.promises[name] === 'function').sort();
}

export function unclassifiedPromises() {
  const known = new Set([...PROMISE_READS, ...PROMISE_WRITES]);
  return promiseFunctions().filter((name) => !known.has(name));
}

export function hashBuffer(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function freezeProblems(noted, freeze) {
  const problems = [];
  const files = (freeze && freeze.files) || [];
  const byPath = new Map(files.map((row) => [String(row.path).replaceAll('\\', '/'), row]));
  for (const row of noted || []) {
    if (!row || !row.path || !row.sha256) continue;
    const key = String(row.path).replaceAll('\\', '/');
    const got = byPath.get(key);
    if (!got) problems.push('missing ' + key);
    else if (got.sha256 !== row.sha256 || got.bytes !== row.bytes) problems.push('differs ' + key);
  }
  return problems;
}
