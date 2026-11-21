// Identity table and seal. EMULATOR-ONLY.
// The child writes identity.json and identity.seal.json from memory (it has no read permission on its own
// outputs). A later run reads them only as per-run input extensions, after the launcher has checked them
// against the identity run's exit record.
import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from './common_v1.mjs';

export function writeIdentity(outDir, body) {
  const raw = Buffer.from(JSON.stringify(body) + '\n', 'utf8');
  const seal = { sha256: sha256(raw), bytes: raw.length, file: 'identity.json', planSha: body.planSha, freezeSha: body.freezeSha, mode: body.mode };
  fs.writeFileSync(path.join(outDir, 'identity.json'), raw);
  fs.writeFileSync(path.join(outDir, 'identity.seal.json'), JSON.stringify(seal, null, 2) + '\n');
  return seal;
}

// Child side: read both through the granted extension paths and verify the seal.
export function readIdentity(jsonPath, sealPath, want) {
  const raw = fs.readFileSync(jsonPath);
  const seal = JSON.parse(fs.readFileSync(sealPath, 'utf8'));
  const problems = [];
  if (seal.sha256 !== sha256(raw)) problems.push('identity seal sha256');
  if (seal.bytes !== raw.length) problems.push('identity seal length');
  const body = JSON.parse(raw.toString('utf8'));
  if (body.planSha !== want.planSha) problems.push('identity plan sha ' + body.planSha + ' != ' + want.planSha);
  if (body.freezeSha !== want.freezeSha) problems.push('identity freeze sha');
  if (body.mode !== want.mode) problems.push('identity mode ' + body.mode + ' != ' + want.mode);
  if (body.plan !== 'identity') problems.push('identity plan name ' + body.plan);
  if (problems.length) throw new Error(problems.join('; '));
  return { body, seal };
}
