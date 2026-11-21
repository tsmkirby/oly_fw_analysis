// Parent-side exit checks shared by launch_v1.mjs and test_v1.mjs. EMULATOR-ONLY harness.
// One policy (review correction 3): a recorded load/read/open must be in the freeze or the per-run extension with
// the same first-read SHA-256; any changed, unknown-descriptor, forbidden or unhashable entry fails; the inventory
// must end with an intact terminator; the completion record must list exactly the plan's operations.
import fs from 'node:fs';
import path from 'node:path';
import { pathKey, sha256, within } from './common_v1.mjs';

export const REQUIRED_LOADS = ['run_v1.mjs', 'inventory_v1.mjs', 'exec_v1.mjs', 'plan_v1.mjs', 'gate_v1.mjs'];

export function readInventory(file) {
  const problems = [];
  if (!fs.existsSync(file)) return { problems: ['inventory missing'], entries: [], count: 0, chain: null };
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.length);
  let chain = sha256('t13-inventory-v1');
  const entries = [];
  let end = null;
  for (let i = 0; i < lines.length; i++) {
    let row;
    try { row = JSON.parse(lines[i]); } catch { problems.push('inventory line ' + (i + 1) + ' unparsable'); break; }
    if (row.kind === 'end') {
      end = row;
      if (i !== lines.length - 1) problems.push('inventory continues after its end record');
      break;
    }
    if (row.seq !== i + 1) problems.push('inventory sequence at line ' + (i + 1));
    chain = sha256(chain + '\n' + lines[i]);
    entries.push(row);
  }
  if (!end) problems.push('inventory truncated: no end record');
  else {
    if (end.count !== entries.length) problems.push('inventory count ' + end.count + ' != ' + entries.length);
    if (end.chain !== chain) problems.push('inventory chain differs');
  }
  if (!entries.length) problems.push('inventory empty');
  return { problems, entries, chain, count: entries.length };
}

// allowed: Map(pathKey -> { sha256 }) or null (capture mode: record only). roots: directories list/stat may touch.
export function checkEntries(entries, allowed, roots) {
  const problems = [];
  const reads = new Map();
  const loads = new Set();
  for (const row of entries) {
    if (row.kind === 'load' || row.kind === 'read' || row.kind === 'open') {
      const key = pathKey(row.path);
      if (row.kind === 'load') loads.add(path.basename(row.path));
      if (!reads.has(key)) reads.set(key, { path: row.path, sha256: row.sha256, bytes: row.bytes });
      if (allowed) {
        const a = allowed.get(key);
        if (!a) problems.push('read outside the freeze and extension: ' + row.path);
        else if (a.sha256 !== row.sha256) problems.push('first-read hash differs: ' + row.path);
      }
    } else if (row.kind === 'builtin') {
      // The allowed built-in list is enforced at load in the child; a refused one appears as 'forbidden'.
    } else if (row.kind === 'list' || row.kind === 'stat') {
      if (allowed && !roots.some((r) => within(r, row.path))) problems.push(row.kind + ' outside the workspace: ' + row.path);
    } else problems.push('inventory ' + row.kind + ': ' + (row.path || row.url || row.fd));
  }
  for (const need of REQUIRED_LOADS) if (!loads.has(need)) problems.push('inventory lacks the load of ' + need);
  return { problems, reads: [...reads.values()].sort((a, b) => (a.path < b.path ? -1 : 1)), loads };
}

export function checkCompletion(file, want) {
  const problems = [];
  if (!fs.existsSync(file)) return { problems: ['completion record missing'], summary: null };
  let c;
  try { c = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { problems: ['completion record unparsable'], summary: null }; }
  if (c.ok !== true) problems.push('completion not ok: ' + (c.error ? String(c.error).split('\n')[0] : 'see complete.json'));
  if (c.plan !== want.plan) problems.push('completion plan ' + c.plan);
  if (c.planSha !== want.planSha) problems.push('completion plan module differs');
  if (c.mode !== want.mode) problems.push('completion mode ' + c.mode);
  if (JSON.stringify(c.executed) !== JSON.stringify(want.expected)) problems.push('completion does not list exactly the plan operations (' + (c.executed || []).length + '/' + want.expected.length + ')');
  if (!c.relations || c.relations.failed !== 0 || !(c.relations.evaluated > 0)) problems.push('completion relations');
  if (want.plan !== 'identity' && (!c.reproduction || c.reproduction.evaluated !== want.expected.length)) problems.push('completion reproduction count');
  if (want.plan === 'identity' && (!c.identity || !c.identity.sha256)) problems.push('completion has no identity seal');
  return {
    problems,
    summary: { executed: (c.executed || []).length, expected: want.expected.length, relations: c.relations, reproduction: c.reproduction, pressReference: c.pressReference, identity: c.identity || null },
  };
}
