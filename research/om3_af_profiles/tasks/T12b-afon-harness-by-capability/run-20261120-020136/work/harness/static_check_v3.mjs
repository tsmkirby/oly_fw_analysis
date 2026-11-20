// Runners and drivers may import the harness entry and an allow-list of Node built-ins.
// Computed import, createRequire, require, process.binding and node:module are rejected.
// EMULATOR-ONLY.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENTRY = new Set(['./entry_v3.mjs', '../harness/entry_v3.mjs']);

const NODE_ALLOW = new Set([
  'node:fs',
  'node:path',
  'node:url',
  'node:crypto',
  'node:child_process',
]);

export const RUNNER_FILES = [
  'work/scripts/run_identity_t13_v3.mjs',
  'work/scripts/run_proof_t13_v3.mjs',
  'work/scripts/run_display_a_t13_v3.mjs',
  'work/scripts/run_display_b_t13_v3.mjs',
  'work/scripts/run_display_k2_t13_v3.mjs',
  'work/scripts/run_display_k1_t13_v3.mjs',
];

export const DRIVER_FILES = ['work/harness/driver_v3.mjs'];

function literals(text) {
  const found = [];
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) found.push(match[1]);
  }
  return found;
}

export function importProblems(fileName, text) {
  const problems = [];
  for (const spec of literals(text)) {
    if (ENTRY.has(spec) || NODE_ALLOW.has(spec)) continue;
    problems.push(fileName + ' imports ' + spec);
  }
  if (/import\s*\(\s*(?!['"])/.test(text)) problems.push(fileName + ' computed import()');
  if (/\bcreateRequire\b/.test(text)) problems.push(fileName + ' createRequire');
  if (/(?<![\w.])require\s*\(/.test(text)) problems.push(fileName + ' require');
  if (/process\.binding\s*\(/.test(text)) problems.push(fileName + ' process.binding');
  if (text.includes('node:module')) problems.push(fileName + ' node:module');
  return problems;
}

export function checkFiles(paths) {
  const problems = [];
  for (const rel of paths) {
    const text = readFileSync(resolve(rel), 'utf8');
    problems.push(...importProblems(rel, text));
  }
  return problems;
}
