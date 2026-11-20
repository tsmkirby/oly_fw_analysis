// Identity gate. Acceptance refuses OK, MENU, and any marked commit unless the
// sealed table already contains that step's title hash and highlighted row.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function rowKey(identityFrom) {
  if (!identityFrom) return null;
  const m = /^(?:ref:)?(k1e|k2|candidate|K1e|K2):([A-Za-z0-9-]+)$/.exec(identityFrom);
  if (!m) return null;
  const role = m[1] === 'K1e' ? 'k1e' : m[1] === 'K2' ? 'k2' : m[1];
  return role + ':' + m[2];
}

export function commitDecision(sealed, step, actual) {
  if (!step || !step.commit) return { ok: true, skipped: true };
  if (!sealed || sealed.sealed !== true || !sealed.sha256) {
    return { ok: false, problems: ['refuse commit: identity table is not sealed'] };
  }
  const key = rowKey(step.identityFrom);
  if (!key) return { ok: false, problems: ['refuse commit: no expectation key ' + step.id] };
  const want = sealed.rows && sealed.rows[key];
  if (!want) return { ok: false, problems: ['refuse commit: sealed table has no ' + key] };
  const problems = [];
  if (actual.title !== want.title) problems.push('title');
  if (JSON.stringify(actual.highlight) !== JSON.stringify(want.highlight)) problems.push('highlight');
  if (want.screen != null && actual.screen !== want.screen) problems.push('screen');
  return { ok: problems.length === 0, problems, expected: want, actual, key };
}

export function loadSealed(jsonPath, sealPath) {
  const raw = readFileSync(resolve(jsonPath));
  const sha256 = createHash('sha256').update(raw).digest('hex');
  const seal = JSON.parse(readFileSync(resolve(sealPath), 'utf8'));
  if (seal.sha256 !== sha256) throw new Error('identity seal mismatch');
  if (seal.bytes !== raw.length) throw new Error('identity seal length');
  const table = JSON.parse(raw.toString('utf8'));
  table.sealed = true;
  table.sha256 = sha256;
  return table;
}

export function writeSeal(jsonPath, sealPath) {
  const raw = readFileSync(resolve(jsonPath));
  const seal = {
    sha256: createHash('sha256').update(raw).digest('hex'),
    bytes: raw.length,
    path: jsonPath.replaceAll('\\', '/'),
  };
  writeFileSync(resolve(sealPath), JSON.stringify(seal, null, 2) + '\n');
  return seal;
}
