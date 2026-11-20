// Fail-closed session inventory. Hashing errors propagate.
// Command records keep process.argv and process.execArgv.
// EMULATOR-ONLY.
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { noteFile } from './inventory_hook_v3.mjs';

export const NON_MODULE = [
  'inputs/00_0100_50000020.decoded.bin',
  'inputs/02_0106_458c0020.decoded.bin',
  'ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv',
  'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k1e-a.json',
  'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k1e-b.json',
  'ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/out/ref-k2.json',
];

function hashFile(path) {
  const bytes = readFileSync(path);
  return { path: path.replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export function readListed(path) {
  const abs = resolve(path);
  const info = noteFile(abs);
  const session = globalThis.__t12Inventory;
  if (session) session.note(info);
  return readFileSync(abs);
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
  mkdirSync(dir, { recursive: true });
  const body = commandRecord(tag);
  writeFileSync(resolve(dir, tag + '.json'), JSON.stringify(body, null, 2) + '\n');
  return body;
}

function envInputs() {
  const paths = [];
  if (process.env.T12_IDENTITY_JSON) paths.push(process.env.T12_IDENTITY_JSON);
  if (process.env.T12_IDENTITY_SEAL) paths.push(process.env.T12_IDENTITY_SEAL);
  return paths;
}

export function openInventory(tag) {
  const recordPath = resolve('work/out/inventory-' + tag + '.jsonl');
  const exitPath = resolve('work/out/inventory-' + tag + '-exit.json');
  mkdirSync(dirname(recordPath), { recursive: true });
  const started = new Date().toISOString();
  const noted = [];
  let finished = false;
  function note(info) {
    noted.push(info);
    appendFileSync(recordPath, JSON.stringify(info) + '\n');
  }
  function finish(extraPaths = []) {
    if (finished) return JSON.parse(readFileSync(exitPath, 'utf8'));
    finished = true;
    const text = readFileSync(recordPath, 'utf8');
    const rows = text.split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
    const imports = [];
    const seen = new Set();
    const problems = [];
    for (const row of rows) {
      if (!row.path || !row.sha256) continue;
      const key = row.path.replaceAll('\\', '/');
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
    const required = process.env.T12_REQUIRE_INPUTS === '1';
    for (const extra of [...NON_MODULE, ...envInputs(), ...extraPaths]) {
      let info;
      try { info = hashFile(resolve(extra)); }
      catch (error) {
        if (required || NON_MODULE.includes(extra)) problems.push('missing ' + extra + ' ' + (error && error.message ? error.message : error));
        continue;
      }
      if (!imports.some((row) => row.path === info.path)) imports.push(info);
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
      noted: noted.map((row) => row.path),
      problems,
      ok: problems.length === 0,
    };
    writeFileSync(exitPath, JSON.stringify(exit, null, 2) + '\n');
    return exit;
  }
  return { recordPath, exitPath, finish, note };
}
