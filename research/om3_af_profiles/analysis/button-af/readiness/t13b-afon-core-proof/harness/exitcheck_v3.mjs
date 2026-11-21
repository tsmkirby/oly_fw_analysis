// Parent-side exit checks, v3 (v3: run_v3/inventory_v3 loads, inventory chain v3), from v2 (code review run-20261120-221318-review corrections 2, 3 and the optional mode check).
// Shared by launch_v3.mjs and test_v3.mjs. EMULATOR-ONLY harness.
// One policy: a recorded load/read/open/preread must be in the freeze or the per-run extension with the same SHA-256;
// every extension input (nonce, freeze, identity files) must appear as consumed; changed, unknown-descriptor,
// forbidden, refused or unhashable entries fail; the inventory must end with an intact terminator; the modules of
// the selected adapter must have loaded; the completion record must list exactly the plan's operations; every
// recorder session must have a complete persisted refresh record.
import fs from 'node:fs';
import path from 'node:path';
import { pathKey, sha256, within } from './common_v1.mjs';

export const REQUIRED_LOADS = ['run_v3.mjs', 'inventory_v3.mjs', 'exec_v2.mjs', 'plan_v1.mjs', 'gate_v2.mjs', 'relations_v2.mjs'];
export const MODE_LOADS = { real: ['real_v2.mjs', 'session_v2.mjs'], fake: ['fake_v2.mjs'], capture: ['fake_v2.mjs'] };
export const MODE_FORBIDDEN = { real: ['fake_v2.mjs'], fake: ['real_v2.mjs', 'session_v2.mjs'], capture: ['real_v2.mjs', 'session_v2.mjs'] };
const OUTSIDE = new Set(['setup', 'seed', 'boot', 'link', 'watch', 'assert']);

export function readInventory(file) {
  const problems = [];
  if (!fs.existsSync(file)) return { problems: ['inventory missing'], entries: [], count: 0, chain: null };
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.length);
  let chain = sha256('t13-inventory-v3');
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

// allowed: Map(pathKey -> { sha256 }) or null (capture: record only). extension: [{ canonical, sha256, reason }].
export function checkEntries(entries, allowed, roots, { mode, extension = [] } = {}) {
  const problems = [];
  const reads = new Map();
  const loads = new Set();
  const consumed = new Map();
  for (const row of entries) {
    if (row.kind === 'load' || row.kind === 'read' || row.kind === 'open' || row.kind === 'preread') {
      const key = pathKey(row.path);
      if (row.kind === 'load') loads.add(path.basename(row.path));
      if (!reads.has(key)) reads.set(key, { path: row.path, sha256: row.sha256, bytes: row.bytes });
      consumed.set(key, row.sha256);
      if (allowed) {
        const a = allowed.get(key);
        if (!a) problems.push('read outside the freeze and extension: ' + row.path);
        else if (a.sha256 !== row.sha256) problems.push('first-read hash differs: ' + row.path);
      }
    } else if (row.kind === 'builtin') {
      // The allowed built-in list is enforced at load in the child; a refused one appears as 'forbidden'.
    } else if (row.kind === 'meta') {
      if (allowed && !roots.some((r) => within(r, row.path))) problems.push('metadata access outside the workspace: ' + row.path);
    } else problems.push('inventory ' + row.kind + ': ' + (row.path || row.url || row.api || row.fd));
  }
  for (const need of [...REQUIRED_LOADS, ...((mode && MODE_LOADS[mode]) || [])]) if (!loads.has(need)) problems.push('inventory lacks the load of ' + need);
  for (const bad of (mode && MODE_FORBIDDEN[mode]) || []) if (loads.has(bad)) problems.push('mode ' + mode + ' loaded ' + bad);
  for (const e of extension) {
    const got = consumed.get(pathKey(e.canonical));
    if (got === undefined) problems.push('extension input not recorded as consumed (' + e.reason + '): ' + e.logical);
    else if (got !== e.sha256) problems.push('extension input consumed with another hash (' + e.reason + '): ' + e.logical);
  }
  return { problems, reads: [...reads.values()].sort((a, b) => (a.path < b.path ? -1 : 1)), loads };
}

// A persisted refresh record (exec_v2) must be complete: every window closed, stamped and with every return; no
// orphan; every outside call categorised and returned; counts equal the completion record.
export function checkRefreshFile(childDir, rec, outputs) {
  const problems = [];
  const file = path.join(childDir, rec.file);
  const listed = outputs.find((o) => o.path === rec.file);
  if (!listed || !fs.existsSync(file)) return ['refresh record missing: ' + rec.file];
  if (listed.sha256 !== rec.sha256 || listed.bytes !== rec.bytes) problems.push('refresh record differs from the completion: ' + rec.file);
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const end = lines[lines.length - 1];
  if (!end || end.kind !== 'end') return [...problems, 'refresh record truncated: ' + rec.file];
  const by = (k) => lines.filter((l) => l.kind === k);
  const windows = by('window');
  const counts = { windows: windows.length, outside: by('outside').length, orphans: by('orphan').length, samples: by('sample').length, calls: windows.reduce((n, w) => n + (w.calls || []).length, 0) };
  for (const k of Object.keys(counts)) if (counts[k] !== end[k] || counts[k] !== rec[k]) problems.push('refresh ' + k + ' count ' + counts[k] + ' (end ' + end[k] + ', completion ' + rec[k] + ')');
  if (!counts.windows) problems.push('refresh record has no window');
  if (!counts.calls) problems.push('refresh record has no getter call in a window');
  if (counts.orphans) problems.push('refresh record has ' + counts.orphans + ' orphan getter calls');
  for (const w of windows) {
    if (w.unclosed || w.tEnd == null) problems.push('refresh window ' + w.id + ' unclosed');
    if (w.sampleT == null || w.sig == null) problems.push('refresh window ' + w.id + ' unstamped');
    else if (w.sampleT < w.tEntry || w.sampleT > w.tEnd) problems.push('refresh window ' + w.id + ' sample outside the window');
    for (const c of w.calls || []) if (c.ret == null) problems.push('refresh window ' + w.id + ' null return');
  }
  for (const c of by('outside')) {
    if (!OUTSIDE.has(c.category)) problems.push('outside getter call without a declared category');
    if (c.ret == null) problems.push('outside getter call with a null return');
  }
  return problems;
}

export function checkCompletion(file, want, childDir, outputs) {
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
  const recs = Array.isArray(c.recorder) ? c.recorder : [];
  const sessions = recs.map((r) => r.session);
  if (JSON.stringify(sessions) !== JSON.stringify(want.recorderSessions || [])) problems.push('refresh records for ' + JSON.stringify(sessions) + ', plan needs ' + JSON.stringify(want.recorderSessions || []));
  if (childDir && outputs) for (const r of recs) problems.push(...checkRefreshFile(childDir, r, outputs));
  return {
    problems,
    summary: { executed: (c.executed || []).length, expected: want.expected.length, relations: c.relations, reproduction: c.reproduction, pressReference: c.pressReference, identity: c.identity || null, recorder: recs },
  };
}
