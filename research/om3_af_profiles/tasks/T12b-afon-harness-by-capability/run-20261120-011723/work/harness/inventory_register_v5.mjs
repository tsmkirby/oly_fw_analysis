// Loaded with node --import. Exit handlers are installed before the tag check
// and before any other validation. File-read entry points are wrapped with no
// path exclusion. The registrar's own output files are not inputs. EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PROMISE_READS, PROMISE_WRITES } from './inventory_v5.mjs';

const INVENTORY = Symbol.for('t12b.inventory');
const originals = {
  readFileSync: fs.readFileSync,
  readFile: fs.readFile,
  openSync: fs.openSync,
  open: fs.open,
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
const forced = [];
const seen = new Map();
const outputs = new Set();

function hashBuffer(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function normalize(filePath) {
  if (!filePath) return null;
  if (typeof filePath !== 'string') {
    if (typeof filePath === 'object' && filePath.href) filePath = fileURLToPathSafe(filePath);
    else return null;
  }
  try { return resolve(filePath).replaceAll('\\', '/'); }
  catch { return null; }
}

function fileURLToPathSafe(value) {
  return fileURLToPath(value);
}

function freezeFile() {
  return normalize(process.env.T12B_FREEZE_PATH || 'work/harness-freeze.json');
}

outputs.add(freezeFile());

let freezeMap;
function freezeOf() {
  if (freezeMap !== undefined) return freezeMap;
  if (process.env.T12B_FREEZE_ENFORCE !== '1') {
    freezeMap = null;
    return null;
  }
  let raw;
  try { raw = originals.readFileSync(freezeFile()); }
  catch (error) {
    throw new Error('refuse to start: freeze missing');
  }
  const body = JSON.parse(raw.toString('utf8'));
  freezeMap = new Map();
  for (const row of body.files || []) freezeMap.set(String(row.path).replaceAll('\\', '/'), row);
  return freezeMap;
}

function consider(rec) {
  if (!rec || !rec.sha256) return;
  const map = freezeOf();
  if (!map) return;
  const got = map.get(rec.path);
  if (!got) throw new Error('refuse to start: missing ' + rec.path);
  if (got.sha256 !== rec.sha256 || got.bytes !== rec.bytes) throw new Error('refuse to start: differs ' + rec.path);
}

function appendRow(rec) {
  if (!session) return;
  originals.appendFileSync(session.recordPath, JSON.stringify(rec) + '\n');
}

function note(filePath, at) {
  const key = normalize(filePath);
  if (!key) return;
  if (outputs.has(key) || seen.has(key)) return;
  let rec;
  try {
    const bytes = originals.readFileSync(key);
    rec = { path: key, bytes: bytes.length, sha256: hashBuffer(bytes), at };
  } catch (error) {
    rec = { path: key, bytes: null, sha256: null, at, error: String(error && error.message ? error.message : error) };
  }
  seen.set(key, rec);
  appendRow(rec);
  consider(rec);
}

function isWriteFlag(flags) {
  if (flags === undefined || typeof flags === 'function') return false;
  const flag = String(flags);
  return /^[wa]/.test(flag) && !flag.includes('r') && !flag.includes('+');
}

function wrapFs() {
  fs.readFileSync = function inventoriedReadFileSync(path, ...args) {
    note(path, 'read');
    return originals.readFileSync(path, ...args);
  };
  fs.readFile = function inventoriedReadFile(path, ...args) {
    note(path, 'read');
    return originals.readFile(path, ...args);
  };
  fs.openSync = function inventoriedOpenSync(path, flags, ...args) {
    if (!isWriteFlag(flags)) note(path, 'read');
    return originals.openSync(path, flags, ...args);
  };
  fs.open = function inventoriedOpen(path, flags, ...args) {
    if (!isWriteFlag(flags)) note(path, 'read');
    return originals.open(path, flags, ...args);
  };
  fs.createReadStream = function inventoriedCreateReadStream(path, ...args) {
    note(path, 'read');
    return originals.createReadStream(path, ...args);
  };
  const promises = fs.promises;
  for (const name of Object.keys(promises)) {
    if (typeof promises[name] !== 'function') continue;
    const original = promises[name];
    if (READ_PROMISES.has(name)) {
      promises[name] = function inventoriedPromise(...args) {
        note(args[0], 'read');
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
      T12B_FREEZE_ENFORCE: process.env.T12B_FREEZE_ENFORCE || null,
    },
  };
}

function writeFailing(error) {
  const path = resolve('work/out/inventory-' + (tag || 'init') + '-exit.json');
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
  };
  originals.writeFileSync(path, JSON.stringify(body, null, 2) + '\n');
  return body;
}

function finish() {
  const text = originals.readFileSync(session.recordPath, 'utf8');
  const rows = text.split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
  const imports = [];
  const notes = [];
  const seenPaths = new Set();
  const problems = forced.slice();
  for (const row of rows) {
    if (!row || !row.sha256) {
      notes.push(row);
      if (row && row.path && row.sha256 === null) problems.push('unreadable ' + row.path);
      continue;
    }
    const key = String(row.path).replaceAll('\\', '/');
    if (seenPaths.has(key)) continue;
    seenPaths.add(key);
    let again;
    try { again = originals.readFileSync(key); }
    catch (error) {
      problems.push('missing ' + key);
      continue;
    }
    const sha256 = hashBuffer(again);
    if (sha256 !== row.sha256 || again.length !== row.bytes) problems.push('changed ' + key);
    imports.push({ path: key, sha256, bytes: again.length });
  }
  const exit = {
    tag,
    ok: problems.length === 0,
    finished: new Date().toISOString(),
    argv: process.argv.map(String),
    execArgv: process.execArgv.map(String),
    env: commandRecord().env,
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

fs[INVENTORY] = {
  noted() {
    return [...seen.values()];
  },
  enforceNoted() {
    const problems = [];
    freezeOf();
    for (const rec of seen.values()) {
      try { consider(rec); }
      catch (error) { problems.push(String(error && error.message ? error.message : error)); }
    }
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
  await register(pathToFileURL(resolve('work/harness/inventory_hook_v5.mjs')).href, {
    parentURL: import.meta.url,
    data: { recordPath },
  });
  note(resolve('work/harness/inventory_register_v5.mjs'), 'import');
  note(resolve('work/harness/inventory_hook_v5.mjs'), 'import');
  note(resolve('work/harness/inventory_v5.mjs'), 'import');
} catch (error) {
  initError = error;
  try { runExit(); }
  catch (finishError) { report(finishError); }
  report(error);
  process.exit(1);
}
