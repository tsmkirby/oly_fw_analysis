// Child-side read and load recording (design_v2 §0 two layers; review correction 2). EMULATOR-ONLY harness.
// Installed by run_v1.mjs before any non-built-in module other than run_v1, common_v1 and this file, which are
// recorded explicitly as pre-loaded. Repairs against T12b registrar v6: no path exclusions; Buffer, URL and
// numeric-descriptor paths; open/read/readv on descriptors; FileHandle and streams; named built-in exports
// (syncBuiltinESMExports); CommonJS require/createRequire through registerHooks; forbidden built-ins refused.
// Every entry is appended at once (a crash leaves no terminator); the parent recomputes the hash chain.
import fs from 'node:fs';
import { registerHooks, syncBuiltinESMExports } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILTINS_ALLOWED, sha256, slash } from './common_v1.mjs';

export function installInventory({ outFile, preloaded = [] }) {
  const orig = {
    readFileSync: fs.readFileSync, appendFileSync: fs.appendFileSync, realpathNative: fs.realpathSync.native,
  };
  let chain = sha256('t13-inventory-v1');
  let count = 0;
  const firstHash = new Map();
  const fdPath = new Map();
  const seenKind = new Set();
  const problems = [];
  // Re-entrancy guard: the recorder's own hashing and appending call the public fs functions it wraps.
  let inside = 0;
  const quiet = (fn) => { inside += 1; try { return fn(); } finally { inside -= 1; } };
  const append = (entry) => quiet(() => {
    count += 1;
    const line = JSON.stringify({ seq: count, ...entry });
    chain = sha256(chain + '\n' + line);
    orig.appendFileSync(outFile, line + '\n');
  });
  const canonical = (p) => {
    const abs = path.resolve(p);
    try { return orig.realpathNative(abs); } catch { return abs; }
  };
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
    try { bytes = quiet(() => orig.readFileSync(c)); } catch (e) { append({ kind: 'unhashable', api, path: slash(c), error: e.code || String(e) }); problems.push('unhashable ' + c); return c; }
    const h = sha256(bytes);
    const prior = firstHash.get(key);
    if (prior === undefined) firstHash.set(key, h);
    if (prior !== undefined && prior !== h) {
      append({ kind: 'changed', api, path: slash(c), bytes: bytes.length, sha256: h, first: prior });
      problems.push('changed ' + c);
    } else if (!seenKind.has(kind + '|' + key)) {
      // One entry per (kind, path): a module read first by the loader's open is still recorded as a load.
      seenKind.add(kind + '|' + key);
      append({ kind, api, path: slash(c), bytes: bytes.length, sha256: h });
    }
    return c;
  };
  const noteFd = (api, fd) => {
    if (inside || typeof fd !== 'number') return;
    if (fdPath.has(fd)) return;
    append({ kind: 'unknown-fd', api, fd });
    problems.push('unknown fd ' + fd + ' via ' + api);
  };
  const readsFlags = (flags) => flags == null || typeof flags === 'number' || /r|\+/.test(String(flags));

  // Path readers.
  const wrapPathRead = (obj, name, api) => {
    const f = obj[name];
    if (typeof f !== 'function') return;
    obj[name] = function wrapped(p, ...rest) {
      const result = f.call(this, p, ...rest);
      if (typeof p === 'number') noteFd(api, p);
      else {
        const s = toPath(p);
        if (s != null) noteContent('read', api, s);
      }
      return result;
    };
  };
  wrapPathRead(fs, 'readFileSync', 'readFileSync');
  const asyncRead = fs.readFile;
  fs.readFile = function readFile(p, ...rest) {
    const cb = rest[rest.length - 1];
    if (typeof p === 'number') noteFd('readFile', p);
    const s = typeof p === 'number' ? null : toPath(p);
    return asyncRead.call(this, p, ...rest.slice(0, -1), (err, data) => {
      if (!err && s != null) noteContent('read', 'readFile', s);
      cb(err, data);
    });
  };
  // Descriptors.
  const openSync = fs.openSync;
  fs.openSync = function open(p, flags, mode) {
    const fd = openSync.call(this, p, flags, mode);
    const s = toPath(p);
    if (s != null) {
      if (readsFlags(flags)) fdPath.set(fd, noteContent('open', 'openSync', s));
      else fdPath.set(fd, canonical(s));
    }
    return fd;
  };
  const openAsync = fs.open;
  fs.open = function open(p, flags, mode, cb) {
    const done = typeof flags === 'function' ? flags : (typeof mode === 'function' ? mode : cb);
    const fl = typeof flags === 'function' ? 'r' : flags;
    const s = toPath(p);
    const call = (err, fd) => {
      if (!err && s != null) fdPath.set(fd, readsFlags(fl) ? noteContent('open', 'open', s) : canonical(s));
      done(err, fd);
    };
    if (typeof flags === 'function') return openAsync.call(this, p, call);
    if (typeof mode === 'function') return openAsync.call(this, p, flags, call);
    return openAsync.call(this, p, flags, mode, call);
  };
  for (const name of ['readSync', 'readvSync', 'fstatSync']) {
    const f = fs[name];
    fs[name] = function fdRead(fd, ...rest) { noteFd(name, fd); return f.call(this, fd, ...rest); };
  }
  for (const name of ['read', 'readv', 'fstat']) {
    const f = fs[name];
    fs[name] = function fdReadAsync(fd, ...rest) { noteFd(name, fd); return f.call(this, fd, ...rest); };
  }
  const closeSync = fs.closeSync;
  fs.closeSync = function close(fd) { const r = closeSync.call(this, fd); fdPath.delete(fd); return r; };
  // Streams.
  const crs = fs.createReadStream;
  fs.createReadStream = function createReadStream(p, options) {
    const fd = options && typeof options === 'object' ? options.fd : undefined;
    if (typeof fd === 'number') noteFd('createReadStream', fd);
    else if (fd && typeof fd === 'object') { /* FileHandle from fs.promises.open: recorded at open */ }
    else { const s = toPath(p); if (s != null) noteContent('open', 'createReadStream', s); }
    return crs.call(this, p, options);
  };
  // Promises and FileHandle.
  const pr = fs.promises;
  const prRead = pr.readFile;
  pr.readFile = async function readFile(p, ...rest) {
    const isHandle = p && typeof p === 'object' && typeof p.fd === 'number' && !(p instanceof URL) && !Buffer.isBuffer(p);
    const data = await prRead.call(this, p, ...rest);
    if (!isHandle) { const s = toPath(p); if (s != null) noteContent('read', 'promises.readFile', s); }
    return data;
  };
  const prOpen = pr.open;
  pr.open = async function open(p, flags, mode) {
    const handle = await prOpen.call(this, p, flags, mode);
    const s = toPath(p);
    if (s != null) fdPath.set(handle.fd, readsFlags(flags) ? noteContent('open', 'promises.open', s) : canonical(s));
    return handle;
  };
  // Listings and metadata (no content): recorded, not hashed.
  for (const name of ['readdirSync', 'opendirSync', 'existsSync', 'statSync', 'lstatSync', 'accessSync']) {
    const f = fs[name];
    if (typeof f !== 'function') continue;
    fs[name] = function meta(p, ...rest) {
      const r = f.call(this, p, ...rest);
      const s = toPath(p);
      if (s != null && !inside) append({ kind: name.startsWith('read') || name.startsWith('open') ? 'list' : 'stat', api: name, path: slash(path.resolve(s)) });
      return r;
    };
  }
  if (typeof process.binding === 'function') {
    process.binding = () => { throw new Error('process.binding is refused in the T13 child'); };
  }
  syncBuiltinESMExports();

  // Module loads, ESM and CommonJS, including createRequire.
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

  return {
    count: () => count,
    chain: () => chain,
    problems,
    end(extra = {}) {
      const line = JSON.stringify({ seq: count + 1, kind: 'end', count, chain, ...extra });
      orig.appendFileSync(outFile, line + '\n');
    },
  };
}
