// Loaded with node --import. Exit handlers are installed before the tag check
// and before any other validation. Every read path is hashed, including Buffer
// and URL paths. Descriptor reads record the path at open and hash at the first
// read. The freeze file is an input. The registrar's own output files are not.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PROMISE_READS, PROMISE_WRITES } from './inventory_v5.mjs';

const INVENTORY = Symbol.for('t12b.inventory');
const CAPTURE_REASON = 'capture mode skips freeze enforcement and cannot be combined with proof mode';
const originals = {
  readFileSync: fs.readFileSync,
  readFile: fs.readFile,
  openSync: fs.openSync,
  open: fs.open,
  readSync: fs.readSync,
  read: fs.read,
  createReadStream: fs.createReadStream,
  writeFileSync: fs.writeFileSync,
  appendFileSync: fs.appendFileSync,
  mkdirSync: fs.mkdirSync,
};
const READ_PROMISES = new Set(PROMISE_READS);
const WRITE_PROMISES = new Set(PROMISE_WRITES);

let tag = null;
let session = null;
let exitRan = false;
let initError = null;
let freezeMap;
let loadingFreeze = false;
let logging = 0;
const forced = [];
const seen = new Map();
const outputs = new Set();
const fdToPath = new Map();

function hashBuffer(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function normalize(filePath) {
  if (filePath == null || typeof filePath === 'number' || typeof filePath === 'boolean') return null;
  if (Buffer.isBuffer(filePath)) filePath = filePath.toString();
  else if (filePath instanceof URL) {
    try { filePath = fileURLToPath(filePath); }
    catch { return null; }
  } else if (typeof filePath === 'object' && typeof filePath.href === 'string') {
    try { filePath = fileURLToPath(filePath); }
    catch { return null; }
  } else if (typeof filePath !== 'string') return null;
  if (!filePath) return null;
  try { return resolve(filePath).replaceAll('\\', '/'); }
  catch { return null; }
}

function freezeFile() {
  return normalize(process.env.T12B_FREEZE_PATH || 'work/harness-freeze.json');
}

function sealFile() {
  return normalize(process.env.T12B_FREEZE_SEAL || 'work/out/harness-freeze.seal.json');
}

function shouldEnforce() {
  if (process.env.T12B_FREEZE_CAPTURE === '1') return false;
  if (process.env.T12B_RUNNER !== '1') return false;
  return true;
}

function isExempt(key) {
  return key === freezeFile() || key === sealFile();
}

function appendRow(rec) {
  if (!session || logging) return;
  logging += 1;
  try {
    originals.appendFileSync(session.recordPath, JSON.stringify(rec) + '\n');
  } finally {
    logging -= 1;
  }
}

function freezeOf() {
  if (freezeMap !== undefined) return freezeMap;
  if (!shouldEnforce()) {
    freezeMap = null;
    return null;
  }
  if (loadingFreeze) return null;
  loadingFreeze = true;
  try {
    const path = freezeFile();
    let bytes;
    try { bytes = originals.readFileSync(path); }
    catch { throw new Error('refuse to start: freeze missing'); }
    const rec = { path, bytes: bytes.length, sha256: hashBuffer(bytes), at: 'read' };
    seen.set(path, rec);
    appendRow(rec);
    const body = JSON.parse(bytes.toString('utf8'));
    freezeMap = new Map();
    for (const row of body.files || []) freezeMap.set(String(row.path).replaceAll('\\', '/'), row);
    for (const row of (body.checkout && body.checkout.files) || []) {
      freezeMap.set(String(row.path).replaceAll('\\', '/'), row);
    }
    return freezeMap;
  } finally {
    loadingFreeze = false;
  }
}

function consider(rec) {
  if (!shouldEnforce() || !rec || !rec.sha256 || isExempt(rec.path)) return;
  const map = freezeOf();
  if (!map) return;
  const got = map.get(rec.path);
  if (!got) throw new Error('refuse to start: missing ' + rec.path);
  if (got.sha256 !== rec.sha256 || got.bytes !== rec.bytes) throw new Error('refuse to start: differs ' + rec.path);
}

function hashKey(key, at) {
  if (!key || outputs.has(key) || logging) return;
  const prev = seen.get(key);
  if (prev && prev.sha256) return;
  seen.set(key, { path: key, bytes: null, sha256: null, at, pending: true });
  let rec;
  logging += 1;
  try {
    const bytes = originals.readFileSync(key);
    rec = { path: key, bytes: bytes.length, sha256: hashBuffer(bytes), at };
  } catch (error) {
    rec = { path: key, bytes: null, sha256: null, at, error: String(error && error.message ? error.message : error) };
  } finally {
    logging -= 1;
  }
  seen.set(key, rec);
  appendRow(rec);
  if (rec.sha256) consider(rec);
}

function rememberOpen(filePath, fd) {
  const key = normalize(filePath);
  if (!key || outputs.has(key)) return;
  if (typeof fd === 'number') fdToPath.set(fd, key);
  if (logging) return;
  appendRow({ path: key, bytes: null, sha256: null, at: 'open' });
}

function verifyPair() {
  const freezeRec = seen.get(freezeFile());
  if (!freezeRec || !freezeRec.sha256) throw new Error('refuse to start: freeze missing');
  const path = sealFile();
  let bytes;
  try { bytes = originals.readFileSync(path); }
  catch { throw new Error('refuse to start: freeze seal missing'); }
  const rec = { path, bytes: bytes.length, sha256: hashBuffer(bytes), at: 'read' };
  seen.set(path, rec);
  appendRow(rec);
  const seal = JSON.parse(bytes.toString('utf8'));
  if (seal.sha256 !== freezeRec.sha256 || seal.bytes !== freezeRec.bytes) {
    throw new Error('refuse to start: freeze seal mismatch');
  }
}

function isWriteFlag(flags) {
  if (flags === undefined || typeof flags === 'function') return false;
  const flag = String(flags);
  return /^[wa]/.test(flag) && !flag.includes('r') && !flag.includes('+');
}

function wrapHandle(handle, key) {
  if (!handle || typeof handle.read !== 'function') return handle;
  const origRead = handle.read.bind(handle);
  handle.read = function inventoriedHandleRead(...args) {
    hashKey(key, 'read');
    return origRead(...args);
  };
  if (typeof handle.readFile === 'function') {
    const origReadFile = handle.readFile.bind(handle);
    handle.readFile = function inventoriedHandleReadFile(...args) {
      hashKey(key, 'read');
      return origReadFile(...args);
    };
  }
  return handle;
}

function wrapFs() {
  fs.readFileSync = function inventoriedReadFileSync(path, ...args) {
    hashKey(normalize(path), 'read');
    return originals.readFileSync(path, ...args);
  };
  fs.readFile = function inventoriedReadFile(path, ...args) {
    hashKey(normalize(path), 'read');
    return originals.readFile(path, ...args);
  };
  fs.openSync = function inventoriedOpenSync(path, flags, ...args) {
    const fd = originals.openSync(path, flags, ...args);
    if (!isWriteFlag(flags)) rememberOpen(path, fd);
    return fd;
  };
  fs.open = function inventoriedOpen(path, flags, ...args) {
    const cb = args[args.length - 1];
    if (typeof cb === 'function' && !isWriteFlag(flags)) {
      args[args.length - 1] = function inventoriedOpenCallback(error, fd) {
        if (!error) rememberOpen(path, fd);
        return cb(error, fd);
      };
    }
    return originals.open(path, flags, ...args);
  };
  fs.readSync = function inventoriedReadSync(fd, ...args) {
    hashKey(fdToPath.get(fd), 'read');
    return originals.readSync(fd, ...args);
  };
  fs.read = function inventoriedRead(fd, ...args) {
    hashKey(fdToPath.get(typeof fd === 'number' ? fd : undefined), 'read');
    return originals.read(fd, ...args);
  };
  fs.createReadStream = function inventoriedCreateReadStream(path, ...args) {
    const key = normalize(path);
    rememberOpen(path, null);
    const stream = originals.createReadStream(path, ...args);
    const hash = () => hashKey(key, 'read');
    stream.once('readable', hash);
    stream.once('data', hash);
    return stream;
  };
  const promises = fs.promises;
  const originalOpen = promises.open.bind(promises);
  for (const name of Object.keys(promises)) {
    if (typeof promises[name] !== 'function') continue;
    const original = promises[name];
    if (name === 'open') {
      promises.open = async function inventoriedPromiseOpen(path, flags, ...args) {
        const handle = await originalOpen(path, flags, ...args);
        if (!isWriteFlag(flags)) {
          const key = normalize(path);
          rememberOpen(path, handle && handle.fd);
          wrapHandle(handle, key);
        }
        return handle;
      };
    } else if (READ_PROMISES.has(name)) {
      promises[name] = function inventoriedPromise(...args) {
        hashKey(normalize(args[0]), 'read');
        return original.apply(this, args);
      };
    } else if (WRITE_PROMISES.has(name)) {
      promises[name] = function inventoriedPromiseWrite(...args) {
        return original.apply(this, args);
      };
    } else {
      throw new Error('unclassified fs.promises.' + name);
    }
  }
}

function commandRecord() {
  const capture = process.env.T12B_FREEZE_CAPTURE === '1';
  return {
    tag: tag || 'init',
    started: new Date().toISOString(),
    argv: process.argv.map(String),
    execArgv: process.execArgv.map(String),
    execPath: process.execPath,
    env: {
      OM_EMU_MODEL: process.env.OM_EMU_MODEL || null,
      OM_EMU_NVRAM: process.env.OM_EMU_NVRAM || null,
      T12B_FREEZE_CAPTURE: process.env.T12B_FREEZE_CAPTURE || null,
      T12B_RUNNER: process.env.T12B_RUNNER || null,
      T12B_FREEZE_PATH: process.env.T12B_FREEZE_PATH || null,
    },
    captureException: capture ? CAPTURE_REASON : null,
  };
}

function writeFailing(error) {
  const path = resolve('work/out/inventory-' + (tag || 'missing-tag') + '-exit.json');
  originals.mkdirSync(dirname(path), { recursive: true });
  const body = {
    tag: tag || 'init',
    ok: false,
    finished: new Date().toISOString(),
    problems: [String(error && error.message ? error.message : error)].concat(forced),
    imports: [],
    notes: [],
    argv: process.argv.map(String),
    execArgv: process.execArgv.map(String),
    env: commandRecord().env,
    captureException: commandRecord().captureException,
  };
  originals.writeFileSync(path, JSON.stringify(body, null, 2) + '\n');
  return body;
}

function finish() {
  const text = originals.readFileSync(session.recordPath, 'utf8');
  const rows = text.split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
  const imports = [];
  const notes = [];
  const best = new Map();
  const problems = forced.slice();
  for (const row of rows) {
    if (!row || !row.sha256) {
      notes.push(row);
      continue;
    }
    const key = String(row.path).replaceAll('\\', '/');
    if (!best.has(key)) best.set(key, row);
  }
  for (const [key, row] of best) {
    let again;
    try { again = originals.readFileSync(key); }
    catch {
      problems.push('missing ' + key);
      continue;
    }
    const sha256 = hashBuffer(again);
    if (sha256 !== row.sha256 || again.length !== row.bytes) problems.push('changed ' + key);
    imports.push({ path: key, sha256, bytes: again.length });
  }
  for (const row of notes) {
    if (!row || !row.path || row.sha256 !== null) continue;
    const key = String(row.path).replaceAll('\\', '/');
    if (!best.has(key)) problems.push('unreadable ' + key);
  }
  const exit = {
    tag,
    ok: problems.length === 0,
    finished: new Date().toISOString(),
    argv: process.argv.map(String),
    execArgv: process.execArgv.map(String),
    env: commandRecord().env,
    captureException: commandRecord().captureException,
    imports,
    notes,
    problems,
  };
  originals.writeFileSync(session.exitPath, JSON.stringify(exit, null, 2) + '\n');
  return exit;
}

function runExit() {
  if (exitRan) return null;
  exitRan = true;
  if (!session) return initError ? writeFailing(initError) : null;
  const exit = finish();
  if (!exit.ok) process.exitCode = 1;
  return exit;
}

function report(error) {
  process.exitCode = 1;
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
}

process.on('exit', () => {
  try { runExit(); }
  catch (error) { report(error); }
});
process.on('beforeExit', () => {
  try { runExit(); }
  catch (error) { report(error); }
});
process.on('uncaughtException', (error) => {
  forced.push(String(error && error.message ? error.message : error));
  initError = initError || error;
  try { runExit(); }
  catch (finishError) { report(finishError); }
  report(error);
  process.exit(1);
});
process.on('unhandledRejection', (error) => {
  forced.push(String(error && error.message ? error.message : error));
  initError = initError || error;
  try { runExit(); }
  catch (finishError) { report(finishError); }
  report(error);
  process.exit(1);
});

wrapFs();

function recordsSoFar() {
  const rows = [...seen.values()];
  if (!session) return rows;
  let text = '';
  try { text = originals.readFileSync(session.recordPath, 'utf8'); }
  catch { return rows; }
  for (const line of text.split(/\n/)) {
    if (!line) continue;
    try { rows.push(JSON.parse(line)); }
    catch (error) { rows.push({ path: session.recordPath, sha256: null, at: 'record', error: String(error.message || error) }); }
  }
  return rows;
}

fs[INVENTORY] = {
  noted() { return recordsSoFar(); },
  enforceNoted() {
    const problems = [];
    try { freezeOf(); }
    catch (error) { return [String(error && error.message ? error.message : error)]; }
    for (const rec of recordsSoFar()) {
      if (!rec || rec.ready || rec.event || !rec.path) continue;
      if (!rec.sha256) {
        if (rec.at === 'open') continue;
        problems.push('unreadable ' + rec.path);
        continue;
      }
      try { consider(rec); }
      catch (error) { problems.push(String(error && error.message ? error.message : error)); }
    }
    try { verifyPair(); }
    catch (error) { problems.push(String(error && error.message ? error.message : error)); }
    return problems;
  },
};

try {
  tag = process.env.T12B_INVENTORY_TAG;
  if (!tag) throw new Error('T12B_INVENTORY_TAG is required');
  if (process.env.T12B_INVENTORY_FAIL === '1') throw new Error('inventory init failed');
  const recordPath = resolve('work/out/inventory-' + tag + '.jsonl');
  const exitPath = resolve('work/out/inventory-' + tag + '-exit.json');
  const cmdPath = resolve('work/out/cmd/' + tag + '.json');
  originals.mkdirSync(dirname(recordPath), { recursive: true });
  originals.mkdirSync(dirname(cmdPath), { recursive: true });
  outputs.add(normalize(recordPath));
  outputs.add(normalize(exitPath));
  outputs.add(normalize(cmdPath));
  originals.writeFileSync(recordPath, '');
  originals.writeFileSync(cmdPath, JSON.stringify(commandRecord(), null, 2) + '\n');
  session = { recordPath, exitPath, tag };
  if (process.env.T12B_FREEZE_CAPTURE === '1') {
    appendRow({ event: 'capture-exception', reason: CAPTURE_REASON });
  }
  await register(pathToFileURL(resolve('work/harness/inventory_hook_v6.mjs')).href, {
    parentURL: import.meta.url,
    data: { recordPath },
  });
  hashKey(resolve('work/harness/inventory_register_v8.mjs'), 'import');
  hashKey(resolve('work/harness/inventory_hook_v6.mjs'), 'import');
  hashKey(resolve('work/harness/inventory_v5.mjs'), 'import');
} catch (error) {
  initError = error;
  try { runExit(); }
  catch (finishError) { report(finishError); }
  report(error);
  process.exit(1);
}
