// Hash every static import of the T13 runners. Does not import or run them.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const RUNNERS = [
  'work/scripts/run_identity_t13.mjs',
  'work/scripts/run_proof_t13.mjs',
  'work/scripts/run_display_a_t13.mjs',
  'work/scripts/run_display_b_t13.mjs',
  'work/scripts/run_display_k2_t13.mjs',
  'work/scripts/run_display_k1_t13.mjs',
];
const EXTRA = [
  'work/scripts/run_display_job_t13.mjs',
  'work/scripts/t13_env_v1.mjs',
  'ref/analysis/button-af/readiness/t5-afon-button-handoff/scripts/zone_session_k1.mjs',
];

function fileRec(rel) {
  const abs = resolve(rel);
  const raw = readFileSync(abs);
  return {
    path: rel.replaceAll('\\', '/'),
    bytes: raw.length,
    sha256: createHash('sha256').update(raw).digest('hex'),
  };
}

function specifiers(text) {
  const out = [];
  const patterns = [
    /from\s+['"](\.[^'"]+)['"]/g,
    /import\s+['"](\.[^'"]+)['"]/g,
    /import\s*\(\s*['"](\.[^'"]+)['"]/g,
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(text))) out.push(match[1]);
  }
  return out;
}

const files = new Map();
const queue = [...RUNNERS, ...EXTRA];
while (queue.length) {
  const rel = queue.pop().replaceAll('\\', '/');
  if (files.has(rel)) continue;
  const abs = resolve(rel);
  if (!existsSync(abs)) throw new Error('missing ' + rel);
  const raw = readFileSync(abs);
  files.set(rel, {
    path: rel,
    bytes: raw.length,
    sha256: createHash('sha256').update(raw).digest('hex'),
    notRun: RUNNERS.includes(rel),
  });
  const text = raw.toString('utf8');
  for (const spec of specifiers(text)) {
    const next = resolve(dirname(abs), spec).replaceAll('\\', '/');
    const relNext = next.startsWith(resolve('.').replaceAll('\\', '/') + '/')
      ? next.slice(resolve('.').replaceAll('\\', '/').length + 1)
      : null;
    if (!relNext) continue;
    if (relNext.startsWith('om-emu/')) continue;
    queue.push(relNext);
  }
}

const body = {
  task: 'T12',
  note: 'T13 runners are listed and hashed. T12 did not run them. No emulator process was started.',
  files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)),
};
writeFileSync(resolve('work/harness-freeze.json'), JSON.stringify(body, null, 2) + '\n');
process.stdout.write(JSON.stringify({ files: body.files.length, runners: body.files.filter((row) => row.notRun).length }) + '\n');
void fileRec;
