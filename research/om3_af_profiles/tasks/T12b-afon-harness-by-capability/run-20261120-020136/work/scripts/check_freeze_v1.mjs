// Checks the proof run against the freeze. EMULATOR-ONLY.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

const proof = read('work/out/inventory-v6-proof-exit.json');
const bad = read('work/out/inventory-v6-bad-freeze-exit.json');
const freeze = read('work/harness-freeze.json');
const proofCmd = read('work/out/cmd/v6-proof.json');
const captureCmd = read('work/out/cmd/v6-identity.json');
const problems = [];
if (!proof.ok) problems.push('proof exit ' + (proof.problems || []).join('; '));
const imports = (proof.imports || []).map((row) => row.path);
if (!imports.some((path) => path.endsWith('/work/harness-freeze.json'))) problems.push('freeze was not inventoried');
if (!imports.some((path) => path.endsWith('/harness-freeze.seal.json'))) problems.push('seal was not inventoried');
if (!imports.some((path) => path.endsWith('/entry_v5.mjs'))) problems.push('entry was not inventoried');
if (!freeze.checkout || !/^[0-9a-f]{40}$/.test(freeze.checkout.revision)) problems.push('revision');
if (!freeze.checkout || !/^[0-9a-f]{64}$/.test(freeze.checkout.diffDigest)) problems.push('diff');
if (!freeze.checkout || !freeze.checkout.files || freeze.checkout.files.length < 1) problems.push('checkout empty');
if (proofCmd.captureException != null) problems.push('proof was marked capture');
if (!captureCmd.captureException) problems.push('identity capture was not logged');
if (bad.ok) problems.push('bad freeze was accepted');
const badText = (bad.problems || []).join('; ');
if (!badText.includes('entry_v5.mjs')) problems.push('bad freeze reason ' + badText);
if (problems.length) {
  process.stderr.write(problems.join('\n') + '\n');
  process.exit(1);
}
process.stdout.write(JSON.stringify({
  proofImports: imports.length,
  checkoutFiles: freeze.checkout.files.length,
  executionFiles: freeze.files.length,
  revision: freeze.checkout.revision,
  diffDigest: freeze.checkout.diffDigest,
}) + '\n');
