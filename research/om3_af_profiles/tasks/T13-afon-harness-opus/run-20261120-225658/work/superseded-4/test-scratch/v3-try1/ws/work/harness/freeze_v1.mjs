// Freeze verification (launcher side, unrestricted). EMULATOR-ONLY harness.
// The freeze is a static file list plus fully enumerated directories. Its own SHA-256 is never inside it:
// the launcher takes the expected digest on the command line (--freeze-sha), recorded by the coordinator
// outside the workspace. Imports only Node built-ins and common_v1.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { pathKey, sha256, slash, within } from './common_v1.mjs';

export const FREEZE_LOGICAL = 'work/freeze/freeze_v1.json';

// Logical paths are workspace-relative ('work/harness/x.mjs', 'ref/tasks/...', 'om-emu/emu/...', 'inputs/...').
export function physicalOf(wsRoot, logical) {
  if (typeof logical !== 'string' || logical.includes('\0') || path.isAbsolute(logical) || logical.split('/').includes('..')) {
    throw new Error('bad logical path ' + JSON.stringify(logical));
  }
  return path.resolve(wsRoot, ...logical.split('/'));
}

// The canonical path a logical path must have: the declared mount replaced by its target, nothing else
// resolved. A link anywhere else on the path makes realpath differ, which is refused.
export function expectedCanonical(wsRoot, logical, mounts) {
  const parts = logical.split('/');
  for (const m of mounts) {
    if (parts[0] === m.logical) return path.resolve(m.target, ...parts.slice(1));
  }
  return path.resolve(fs.realpathSync.native(wsRoot), ...parts);
}

export function checkMounts(wsRoot, mounts) {
  const problems = [];
  for (const m of mounts) {
    const p = path.resolve(wsRoot, m.logical);
    let st;
    try { st = fs.lstatSync(p); } catch (e) { problems.push('mount ' + m.logical + ' ' + e.code); continue; }
    if (!st.isSymbolicLink()) problems.push('mount ' + m.logical + ' is not a junction');
    let real;
    try { real = fs.realpathSync.native(p); } catch (e) { problems.push('mount ' + m.logical + ' ' + e.code); continue; }
    if (pathKey(real) !== pathKey(m.target)) problems.push('mount ' + m.logical + ' -> ' + real + ' (freeze ' + m.target + ')');
  }
  return problems;
}

function fileFact(wsRoot, logical, mounts) {
  const physical = physicalOf(wsRoot, logical);
  const want = expectedCanonical(wsRoot, logical, mounts);
  const st = fs.lstatSync(physical);
  if (st.isSymbolicLink()) throw new Error('link ' + logical);
  if (!st.isFile()) throw new Error('not a file ' + logical);
  const canonical = fs.realpathSync.native(physical);
  if (pathKey(canonical) !== pathKey(want)) throw new Error('link on the path of ' + logical + ' (' + canonical + ')');
  const bytes = fs.readFileSync(physical);
  return { logical, physical, canonical, bytes: bytes.length, sha256: sha256(bytes) };
}

// Recursive enumeration that refuses every link or reparse point below the directory.
export function enumerate(wsRoot, logicalDir, mounts) {
  const root = physicalOf(wsRoot, logicalDir);
  const want = expectedCanonical(wsRoot, logicalDir, mounts);
  const problems = [];
  const files = [];
  const top = fs.realpathSync.native(root);
  if (pathKey(top) !== pathKey(want)) problems.push('link on the path of ' + logicalDir);
  const walk = (dirPhys, dirLogical) => {
    for (const ent of fs.readdirSync(dirPhys, { withFileTypes: true })) {
      const p = path.join(dirPhys, ent.name);
      const lg = dirLogical + '/' + ent.name;
      const st = fs.lstatSync(p);
      if (st.isSymbolicLink()) { problems.push('link inside ' + logicalDir + ': ' + lg); continue; }
      if (st.isDirectory()) walk(p, lg);
      else if (st.isFile()) files.push(lg);
      else problems.push('not a regular file: ' + lg);
    }
  };
  walk(root, logicalDir);
  return { files: files.sort(), problems };
}

export function loadFreeze(wsRoot, digest) {
  const p = physicalOf(wsRoot, FREEZE_LOGICAL);
  const raw = fs.readFileSync(p);
  const got = sha256(raw);
  if (!digest || !/^[0-9a-f]{64}$/.test(digest)) throw new Error('--freeze-sha missing or malformed');
  if (got !== digest) throw new Error('freeze digest ' + got + ' is not the external digest ' + digest);
  const freeze = JSON.parse(raw.toString('utf8'));
  if (freeze.version !== 1 || !Array.isArray(freeze.files) || !Array.isArray(freeze.dirs) || !Array.isArray(freeze.mounts)) {
    throw new Error('freeze shape');
  }
  return { freeze, sha256: got, bytes: raw.length, physical: p };
}

// Full verification: every listed file (length, SHA-256, canonical path, no link), every directory enumerated
// with no unlisted file and no link, runtime listed. Returns facts for grants and later re-verification.
export function verifyFreeze(wsRoot, freeze) {
  const problems = checkMounts(wsRoot, freeze.mounts);
  const facts = new Map();
  const seen = new Set();
  for (const f of freeze.files) {
    if (seen.has(f.path)) { problems.push('duplicate ' + f.path); continue; }
    seen.add(f.path);
    let fact;
    try { fact = fileFact(wsRoot, f.path, freeze.mounts); } catch (e) { problems.push(String(e.message || e)); continue; }
    if (fact.bytes !== f.bytes) problems.push('length ' + f.path + ' ' + fact.bytes + ' != ' + f.bytes);
    if (fact.sha256 !== f.sha256) problems.push('sha256 ' + f.path);
    facts.set(f.path, fact);
  }
  const dirs = [];
  for (const d of freeze.dirs) {
    const listed = enumerate(wsRoot, d, freeze.mounts);
    problems.push(...listed.problems);
    for (const lg of listed.files) if (!seen.has(lg)) problems.push('unlisted file in ' + d + ': ' + lg);
    const phys = physicalOf(wsRoot, d);
    dirs.push({ logical: d, physical: phys, canonical: fs.realpathSync.native(phys) });
  }
  for (const f of freeze.files) {
    const inDir = freeze.dirs.some((d) => f.path.startsWith(d + '/'));
    if (!inDir && !f.why) problems.push('listed outside a frozen directory without a reason: ' + f.path);
  }
  if (!freeze.runtime || !seen.has(freeze.runtime.path)) problems.push('runtime not listed');
  return { problems, facts, dirs };
}

// Re-verification after the child exits: same files, same hashes, no additions in the directories.
export function reverify(wsRoot, freeze, facts) {
  const again = verifyFreeze(wsRoot, freeze);
  const problems = again.problems.map((p) => 'at exit: ' + p);
  for (const [lg, fact] of facts) {
    const now = again.facts.get(lg);
    if (!now || now.sha256 !== fact.sha256 || now.bytes !== fact.bytes) problems.push('at exit: changed ' + lg);
  }
  return problems;
}

// Grants: both the logical (junction) form and the canonical form of every file and directory, because
// the permission model compares path strings (probe: a canonical grant does not cover the junction path).
// Files inside a frozen directory are covered by the directory grant (the directory is enumerated in full, with no
// unlisted file and no link, so the grant adds no access); per-file grants are only for files outside them. This
// also keeps the command line under the Windows limit (520 files in two forms overflow it: ENAMETOOLONG).
export function readGrants(freezeCheck, extension) {
  const set = new Set();
  const inDir = (fact) => freezeCheck.dirs.some((d) => fact.logical.startsWith(d.logical + '/'));
  for (const fact of freezeCheck.facts.values()) { if (!inDir(fact)) { set.add(fact.physical); set.add(fact.canonical); } }
  for (const d of freezeCheck.dirs) { set.add(d.physical + path.sep); set.add(d.canonical + path.sep); }
  for (const e of extension) { set.add(e.physical); set.add(e.canonical); }
  return [...set];
}

// The allowed-read map used at the exit check: canonical path key -> { sha256, bytes, source }.
export function allowedReads(freezeCheck, extension) {
  const map = new Map();
  for (const fact of freezeCheck.facts.values()) map.set(pathKey(fact.canonical), { sha256: fact.sha256, bytes: fact.bytes, source: 'freeze', logical: fact.logical });
  for (const e of extension) map.set(pathKey(e.canonical), { sha256: e.sha256, bytes: e.bytes, source: 'extension:' + e.reason, logical: e.logical });
  return map;
}

export function describe(fact) {
  return { path: slash(fact.logical), bytes: fact.bytes, sha256: fact.sha256 };
}

export { within };
