// Child-side read and load recording, v2 (code review run-20261120-221318-review correction 2). EMULATOR-ONLY harness.
// Every function of node:fs and node:fs/promises is classified; an unclassified function is refused, so an
// interface cannot read unrecorded. Classes:
//   content  - reads file bytes: recorded with path, length and first-read SHA-256 (copy sources included)
//   fd       - descriptor reads: the descriptor must come from a recorded open, otherwise 'unknown-fd'
//   meta     - metadata and listings (stat, access, exists, readdir, opendir, readlink, realpath, statfs, glob):
//              recorded with path, no hash
//   write    - writes, bounded by the --allow-fs-write grant: passed through
//   refused  - openAsBlob, watch, watchFile, cp and anything unclassified: throws, and is recorded as 'refused'
// Reads made before installation (the nonce, the freeze) are recorded by the caller as 'preread' entries with the
// SHA-256 of the bytes actually consumed. Module loads (ESM, CommonJS, createRequire) go through registerHooks;
// built-ins outside the allowed list are refused at load. Entries are appended at once and hash-chained.
import fs from 'node:fs';
import { registerHooks, syncBuiltinESMExports } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILTINS_ALLOWED, sha256, slash } from './common_v1.mjs';

export const FS_CLASSES = {
  content: ['readFile', 'readFileSync', 'open', 'openSync', 'createReadStream', 'copyFile', 'copyFileSync'],
  fd: ['read', 'readSync', 'readv', 'readvSync', 'fstat', 'fstatSync', 'close', 'closeSync'],
  meta: ['access', 'accessSync', 'exists', 'existsSync', 'stat', 'statSync', 'lstat', 'lstatSync', 'statfs', 'statfsSync',
    'readdir', 'readdirSync', 'opendir', 'opendirSync', 'readlink', 'readlinkSync', 'realpath', 'realpathSync', 'glob', 'globSync'],
  write: ['appendFile', 'appendFileSync', 'chmod', 'chmodSync', 'chown', 'chownSync', 'createWriteStream', 'fchmod', 'fchmodSync',
    'fchown', 'fchownSync', 'fdatasync', 'fdatasyncSync', 'fsync', 'fsyncSync', 'ftruncate', 'ftruncateSync', 'futimes',
    'futimesSync', 'lchown', 'lchownSync', 'link', 'linkSync', 'lutimes', 'lutimesSync', 'mkdir', 'mkdirSync', 'mkdtemp',
    'mkdtempSync', 'mkdtempDisposableSync', 'rename', 'renameSync', 'rm', 'rmSync', 'rmdir', 'rmdirSync', 'symlink', 'symlinkSync',
    'truncate', 'truncateSync', 'unlink', 'unlinkSync', 'utimes', 'utimesSync', 'write', 'writeFile', 'writeFileSync', 'writeSync',
    'writev', 'writevSync', 'unwatchFile', '_toUnixTimestamp'],
  // cp/cpSync: unused by the harness and OM-Emu session; under the permission model they also read the destination's
  // ancestors (probe: promises.cp denied on the grandparent), so they are refused rather than recorded.
  refused: ['openAsBlob', 'openAsBlobSync', 'watch', 'watchFile', 'cp', 'cpSync'],
};
export const PROMISES_CLASSES = {
  content: ['readFile', 'open', 'copyFile'],
  meta: ['access', 'stat', 'lstat', 'statfs', 'readdir', 'opendir', 'readlink', 'realpath', 'glob'],
  write: ['appendFile', 'chmod', 'chown', 'lchmod', 'lchown', 'link', 'lutimes', 'mkdir', 'mkdtemp', 'mkdtempDisposable', 'rename',
    'rm', 'rmdir', 'symlink', 'truncate', 'unlink', 'utimes', 'writeFile'],
  refused: ['watch', 'cp'],
};

const classOf = (table, name) => Object.keys(table).find((k) => table[k].includes(name)) || null;
const fnNames = (o) => Object.keys(o).filter((n) => typeof o[n] === 'function' && !/^[A-Z]/.test(n));

export function unclassified() {
  return [
    ...fnNames(fs).filter((n) => !classOf(FS_CLASSES, n)).map((n) => 'fs.' + n),
    ...fnNames(fs.promises).filter((n) => !classOf(PROMISES_CLASSES, n)).map((n) => 'fs.promises.' + n),
  ];
}

export function installInventory({ outFile, prereads = [], preloaded = [] }) {
  const orig = { readFileSync: fs.readFileSync, appendFileSync: fs.appendFileSync, realpathNative: fs.realpathSync.native };
  let chain = sha256('t13-inventory-v2');
  let count = 0;
  const firstHash = new Map();
  const seenKind = new Set();
  const fdPath = new Map();
  const problems = [];
  let inside = 0;
  const quiet = (fn) => { inside += 1; try { return fn(); } finally { inside -= 1; } };
  const append = (entry) => quiet(() => {
    count += 1;
    const line = JSON.stringify({ seq: count, ...entry });
    chain = sha256(chain + '\n' + line);
    orig.appendFileSync(outFile, line + '\n');
  });
  const canonical = (p) => { const abs = path.resolve(p); try { return orig.realpathNative(abs); } catch { return abs; } };
  const toPath = (p) => {
    if (typeof p === 'string') return p;
    if (Buffer.isBuffer(p)) return p.toString('utf8');
    if (p instanceof URL) return fileURLToPath(p);
    return null;
  };
  const noteContent = (kind, api, p) => {
    if (inside) return path.resolve(p);
    const c = canonical(p);
    const key = slash(c).toLowerCase();
    let bytes;
    try { bytes = quiet(() => orig.readFileSync(c)); } catch (e) {
      if (e.code === 'EISDIR') { append({ kind: 'meta', api, path: slash(c) }); return c; }
      append({ kind: 'unhashable', api, path: slash(c), error: e.code || String(e) });
      problems.push('unhashable ' + c);
      return c;
    }
    const h = sha256(bytes);
    const prior = firstHash.get(key);
    if (prior === undefined) firstHash.set(key, h);
    if (prior !== undefined && prior !== h) {
      append({ kind: 'changed', api, path: slash(c), bytes: bytes.length, sha256: h, first: prior });
      problems.push('changed ' + c);
    } else if (!seenKind.has(kind + '|' + key)) {
      seenKind.add(kind + '|' + key);
      append({ kind, api, path: slash(c), bytes: bytes.length, sha256: h });
    }
    return c;
  };
  const noteMeta = (api, p) => {
    if (inside) return;
    const s = toPath(p);
    if (s == null) return;
    const where = slash(path.resolve(s));
    const key = 'meta|' + api + '|' + where.toLowerCase();
    if (seenKind.has(key)) return;
    seenKind.add(key);
    append({ kind: 'meta', api, path: where });
  };
  const noteFd = (api, fd) => {
    if (inside || typeof fd !== 'number') return;
    if (fdPath.has(fd)) return;
    append({ kind: 'unknown-fd', api, fd });
    problems.push('unknown fd ' + fd + ' via ' + api);
  };
  const readsFlags = (flags) => flags == null || typeof flags === 'number' || /r|\+/.test(String(flags));
  const isHandle = (p) => p && typeof p === 'object' && typeof p.fd === 'number' && !(p instanceof URL) && !Buffer.isBuffer(p);
  const refuse = (where, name) => function refused() {
    append({ kind: 'refused', api: where + name });
    problems.push('refused interface ' + where + name);
    throw new Error(where + name + ' is refused in the T13 child');
  };
  const copyProps = (from, to) => { for (const k of Object.keys(from)) to[k] = from[k]; return to; };

  // ---- node:fs ----
  const W = {};
  W.readFileSync = (f) => function readFileSync(p, ...rest) {
    const r = f.call(this, p, ...rest);
    if (typeof p === 'number') noteFd('readFileSync', p); else { const s = toPath(p); if (s != null) noteContent('read', 'readFileSync', s); }
    return r;
  };
  W.readFile = (f) => function readFile(p, ...rest) {
    const cb = rest[rest.length - 1];
    if (typeof p === 'number') noteFd('readFile', p);
    const s = typeof p === 'number' ? null : toPath(p);
    return f.call(this, p, ...rest.slice(0, -1), (err, data) => { if (!err && s != null) noteContent('read', 'readFile', s); cb(err, data); });
  };
  W.openSync = (f) => function openSync(p, flags, mode) {
    const fd = f.call(this, p, flags, mode);
    const s = toPath(p);
    if (s != null) fdPath.set(fd, readsFlags(flags) ? noteContent('open', 'openSync', s) : canonical(s));
    return fd;
  };
  W.open = (f) => function open(p, flags, mode, cb) {
    const done = typeof flags === 'function' ? flags : (typeof mode === 'function' ? mode : cb);
    const fl = typeof flags === 'function' ? 'r' : flags;
    const s = toPath(p);
    const call = (err, fd) => { if (!err && s != null) fdPath.set(fd, readsFlags(fl) ? noteContent('open', 'open', s) : canonical(s)); done(err, fd); };
    if (typeof flags === 'function') return f.call(this, p, call);
    if (typeof mode === 'function') return f.call(this, p, flags, call);
    return f.call(this, p, flags, mode, call);
  };
  W.createReadStream = (f) => function createReadStream(p, options) {
    const fd = options && typeof options === 'object' ? options.fd : undefined;
    if (typeof fd === 'number') noteFd('createReadStream', fd);
    else if (!(fd && typeof fd === 'object')) { const s = toPath(p); if (s != null) noteContent('open', 'createReadStream', s); }
    return f.call(this, p, options);
  };
  const syncSource = (name) => (f) => function copySync(src, ...rest) { const r = f.call(this, src, ...rest); const s = toPath(src); if (s != null) noteContent('read', name, s); return r; };
  const cbSource = (name) => (f) => function copy(src, ...rest) {
    const cb = rest[rest.length - 1];
    const s = toPath(src);
    return f.call(this, src, ...rest.slice(0, -1), (err) => { if (!err && s != null) noteContent('read', name, s); cb(err); });
  };
  W.copyFileSync = syncSource('copyFileSync');
  W.copyFile = cbSource('copyFile');
  for (const name of ['read', 'readSync', 'readv', 'readvSync', 'fstat', 'fstatSync']) {
    W[name] = (f) => function fdRead(fd, ...rest) { noteFd(name, fd); return f.call(this, fd, ...rest); };
  }
  W.closeSync = (f) => function closeSync(fd) { const r = f.call(this, fd); fdPath.delete(fd); return r; };
  W.close = (f) => function close(fd, ...rest) { fdPath.delete(fd); return f.call(this, fd, ...rest); };
  for (const name of FS_CLASSES.meta) {
    if (name === 'exists') {
      W.exists = (f) => copyProps(f, function exists(p, cb) { return f.call(this, p, (ok) => { noteMeta('exists', p); cb(ok); }); });
    } else if (name.endsWith('Sync')) {
      W[name] = (f) => copyProps(f, function metaSync(p, ...rest) { const r = f.call(this, p, ...rest); noteMeta(name, p); return r; });
    } else {
      W[name] = (f) => copyProps(f, function meta(p, ...rest) {
        const cb = rest[rest.length - 1];
        if (typeof cb !== 'function') return f.call(this, p, ...rest);
        return f.call(this, p, ...rest.slice(0, -1), (err, ...out) => { if (!err) noteMeta(name, p); cb(err, ...out); });
      });
    }
  }
  for (const name of fnNames(fs)) {
    const cls = classOf(FS_CLASSES, name);
    const f = fs[name];
    if (cls === 'refused' || cls === null) fs[name] = refuse('fs.', name);
    else if (W[name]) fs[name] = W[name](f);
  }
  // realpathSync.native is used by the module loader; the recorder keeps its own original.
  const rpNative = orig.realpathNative;
  fs.realpathSync.native = function realpathSyncNative(p, ...rest) { const r = rpNative.call(this, p, ...rest); noteMeta('realpathSync.native', p); return r; };
  if (fs.realpath.native) {
    const rpa = fs.realpath.native;
    fs.realpath.native = function realpathNative(p, ...rest) { const cb = rest[rest.length - 1]; return rpa.call(this, p, ...rest.slice(0, -1), (e, r) => { if (!e) noteMeta('realpath.native', p); cb(e, r); }); };
  }

  // ---- node:fs/promises ----
  const pr = fs.promises;
  const P = {};
  P.readFile = (f) => async function readFile(p, ...rest) { const d = await f.call(this, p, ...rest); if (!isHandle(p)) { const s = toPath(p); if (s != null) noteContent('read', 'promises.readFile', s); } return d; };
  P.open = (f) => async function open(p, flags, mode) {
    const h = await f.call(this, p, flags, mode);
    const s = toPath(p);
    if (s != null) fdPath.set(h.fd, readsFlags(flags) ? noteContent('open', 'promises.open', s) : canonical(s));
    return h;
  };
  P.copyFile = (f) => async function copyFile(src, ...rest) { const r = await f.call(this, src, ...rest); const s = toPath(src); if (s != null) noteContent('read', 'promises.copyFile', s); return r; };
  for (const name of PROMISES_CLASSES.meta) {
    P[name] = (f) => (name === 'glob'
      ? function glob(p, ...rest) { noteMeta('promises.glob', p); return f.call(this, p, ...rest); }
      : async function meta(p, ...rest) { const r = await f.call(this, p, ...rest); noteMeta('promises.' + name, p); return r; });
  }
  for (const name of fnNames(pr)) {
    const cls = classOf(PROMISES_CLASSES, name);
    const f = pr[name];
    if (cls === 'refused' || cls === null) pr[name] = refuse('fs.promises.', name);
    else if (P[name]) pr[name] = P[name](f);
  }
  if (typeof process.binding === 'function') process.binding = () => { throw new Error('process.binding is refused in the T13 child'); };
  syncBuiltinESMExports();

  registerHooks({
    load(url, context, nextLoad) {
      if (url.startsWith('node:') || !url.includes(':')) {
        const name = url.startsWith('node:') ? url : 'node:' + url;
        if (!BUILTINS_ALLOWED.has(name)) {
          append({ kind: 'forbidden', url: name });
          problems.push('forbidden built-in ' + name);
          throw new Error('built-in ' + name + ' is refused in the T13 child');
        }
        append({ kind: 'builtin', url: name });
        return nextLoad(url, context);
      }
      if (!url.startsWith('file:')) {
        append({ kind: 'forbidden', url });
        problems.push('non-file module ' + url);
        throw new Error('module scheme refused: ' + url);
      }
      const result = nextLoad(url, context);
      noteContent('load', 'module:' + (result.format || '?'), fileURLToPath(url));
      return result;
    },
  });
  for (const url of preloaded) noteContent('load', 'preloaded', fileURLToPath(url));
  for (const r of prereads) {
    const c = canonical(r.path);
    const h = sha256(r.bytes);
    firstHash.set(slash(c).toLowerCase(), h);
    append({ kind: r.kind || 'preread', api: r.api || 'before-install', path: slash(c), bytes: r.bytes.length, sha256: h });
  }

  return {
    count: () => count,
    chain: () => chain,
    problems,
    end(extra = {}) {
      orig.appendFileSync(outFile, JSON.stringify({ seq: count + 1, kind: 'end', count, chain, ...extra }) + '\n');
    },
  };
}
