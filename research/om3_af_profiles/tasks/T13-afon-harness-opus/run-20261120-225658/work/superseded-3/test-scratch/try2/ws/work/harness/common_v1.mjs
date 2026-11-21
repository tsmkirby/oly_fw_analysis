// Shared constants and pure helpers for the T13 launcher, child and tools. EMULATOR-ONLY harness.
// Imports only Node built-ins.
import { createHash } from 'node:crypto';
import path from 'node:path';

export const NODE_VERSION = 'v26.12.1';
export const RUNTIME_LOGICAL = 'ref/tooling/node-v26.12.1-win-x64/node.exe';
export const PLANS = ['identity', 'proof', 'display-a', 'display-b', 'display-k2', 'display-k1'];
export const MODES = ['real', 'fake', 'capture'];
export const TAG_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
// Built-ins a child may load. Anything else (sqlite, inspector, wasi, child_process, net, http, vm, ...)
// fails the run at load time and again at the parent's exit check.
export const BUILTINS_ALLOWED = new Set([
  'node:assert', 'node:assert/strict', 'node:buffer', 'node:crypto', 'node:events', 'node:fs', 'node:fs/promises',
  'node:module', 'node:os', 'node:path', 'node:perf_hooks', 'node:process', 'node:stream', 'node:string_decoder',
  'node:url', 'node:util', 'node:worker_threads', 'node:zlib', 'node:timers',
]);

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function canonicalJson(value) {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const out = {};
      for (const key of Object.keys(v).sort()) out[key] = v[key];
      return out;
    }
    return v;
  });
}

export function slash(p) {
  return String(p).replaceAll('\\', '/');
}

// Case-insensitive key for Windows paths, forward slashes.
export function pathKey(p) {
  return slash(path.resolve(p)).toLowerCase();
}

export function validateTag(tag) {
  if (typeof tag !== 'string' || !TAG_RE.test(tag)) throw new Error('bad tag ' + JSON.stringify(tag) + ' (want ' + TAG_RE + ')');
  return tag;
}

// Every output path is derived here from a validated tag and checked to stay under work/out.
export function outPaths(wsRoot, tag) {
  validateTag(tag);
  const outRoot = path.resolve(wsRoot, 'work', 'out');
  const child = path.resolve(outRoot, tag);
  const launch = path.resolve(outRoot, tag + '.launch');
  for (const p of [child, launch]) {
    const rel = path.relative(outRoot, p);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel) || rel.includes(path.sep)) throw new Error('output escapes work/out: ' + p);
  }
  if (pathKey(child) === pathKey(launch)) throw new Error('child and parent outputs coincide');
  return { outRoot, child, launch, refusals: path.resolve(outRoot, '_refusals') };
}

export function within(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
