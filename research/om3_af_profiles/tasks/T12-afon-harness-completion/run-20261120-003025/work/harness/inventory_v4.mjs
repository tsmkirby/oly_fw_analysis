// Fail-closed session inventory. Hashing errors propagate.
// Non-module files are recorded when they are read. The exit check compares those hashes.
// Command records keep process.argv and process.execArgv.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { noteFile } from './inventory_hook_v4.mjs';

export const NON_MODULE = [
  'inputs/00_0100_50000020.decoded.bin',
  'inputs/02_0106_458c0020.decoded.bin',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv',
  'ref/analysis/button-af/readiness/t6-afon-target-size-position/out/overlay-changed-bytes.csv',
  'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k1e-a.json',
  'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k1e-b.json',
  'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k2.json',
];

let originalRead = fs.readFileSync;

export function hashFile(path) {
  const bytes = originalRead(path);
  return { path: path.replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export function readListed(path) {
  return fs.readFileSync(resolve(path));
}

export function commandRecord(tag) {
  return {
    tag,
    started: new Date().toISOString(),
    argv: process.argv.map(String),
    execArgv: process.execArgv.map(String),
    execPath: process.execPath,
    env: {
      OM_EMU_MODEL: process.env.OM_EMU_MODEL || null,
      OM_EMU_NVRAM: process.env.OM_EMU_NVRAM || null,
    },
  };
}

export function writeCommand(tag) {
  const dir = resolve('work/out/cmd');
  fs.mkdirSync(dir, { recursive: true });
  const body = commandRecord(tag);
  fs.writeFileSync(resolve(dir, tag + '.json'), JSON.stringify(body, null, 2) + '\n');
  return body;
}

function envInputs() {
  const paths = [];
  if (process.env.T12_IDENTITY_JSON) paths.push(process.env.T12_IDENTITY_JSON);
  if (process.env.T12_IDENTITY_SEAL) paths.push(process.env.T12_IDENTITY_SEAL);
  return paths;
}

function shouldNote(path) {
  if (typeof path !== 'string' || !path) return false;
  const norm = path.replaceAll('\\', '/');
  if (norm.includes('/work/out/')) return false;
  if (norm.includes('/node_modules/')) return false;
  return true;
}

export function installReadNote(session) {
  originalRead = fs.readFileSync;
  const patched = function patchedRead(path, ...args) {
    const data = originalRead(path, ...args);
    if (shouldNote(path)) {
      const info = hashFile(path);
      info.at = 'read';
      session.note(info);
    }
    return data;
  };
  fs.readFileSync = patched;
  return patched;
}

export function openInventory(tag) {
  const recordPath = resolve('work/out/inventory-' + tag + '.jsonl');
  const exitPath = resolve('work/out/inventory-' + tag + '-exit.json');
  fs.mkdirSync(dirname(recordPath), { recursive: true });
  const started = new Date().toISOString();
  const noted = [];
  let finished = false;
  function note(info) {
    noted.push(info);
    fs.appendFileSync(recordPath, JSON.stringify(info) + '\n');
  }
  function finish() {
    if (finished) return JSON.parse(originalRead(exitPath, 'utf8'));
    finished = true;
    const text = originalRead(recordPath, 'utf8');
    const rows = text.split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
    const imports = [];
    const notes = [];
    const seen = new Set();
    const problems = [];
    for (const row of rows) {
      if (!row) continue;
      if (!row.sha256) {
        notes.push(row);
        continue;
      }
      const key = String(row.path).replaceAll('\\', '/');
      if (seen.has(key)) continue;
      seen.add(key);
      let again;
      try { again = hashFile(row.path); }
      catch (error) {
        problems.push('missing ' + key + ' ' + (error && error.message ? error.message : error));
        continue;
      }
      if (again.sha256 !== row.sha256 || again.bytes !== row.bytes) problems.push('changed ' + key);
      imports.push({ path: again.path, sha256: again.sha256, bytes: again.bytes });
    }
    if (process.env.T12_REQUIRE_INPUTS === '1') {
      for (const extra of envInputs()) {
        const abs = resolve(extra).replaceAll('\\', '/');
        if (!imports.some((row) => row.path === abs)) problems.push('unread ' + extra);
      }
    }
    const exit = {
      tag,
      finished: new Date().toISOString(),
      started,
      argv: process.argv.map(String),
      execArgv: process.execArgv.map(String),
      env: {
        OM_EMU_MODEL: process.env.OM_EMU_MODEL || null,
        OM_EMU_NVRAM: process.env.OM_EMU_NVRAM || null,
      },
      imports,
      notes,
      noted: noted.map((row) => row.path).filter(Boolean),
      problems,
      ok: problems.length === 0,
    };
    fs.writeFileSync(exitPath, JSON.stringify(exit, null, 2) + '\n');
    return exit;
  }
  return { recordPath, exitPath, finish, note };
}

void noteFile;
