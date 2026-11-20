// Static ban on raw input and ungated setup writes. The session calls this before the emulator.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RULES = [
  { name: 'armPress', re: /armPress/ },
  { name: 'ctx.key', re: /ctx\.key\s*\(/ },
  { name: 'dial_input', re: /dial_input/ },
  { name: 'setPose', re: /setPose\s*\(/ },
  { name: 'setKey', re: /setKey\s*\(/ },
  { name: 'sim.write', re: /\.sim\.write\s*\(/ },
  { name: 'tap', re: /\btap\s*\(/ },
  { name: 'raw-ok', re: /key\(\s*['"]ok['"]/ },
];

const PRIOR = ['static_check_v1.mjs', 'static_check_v2.mjs', 'static_check_v3.mjs', 'static_check_v4.mjs', 'static_check_v5.mjs', 'static_check_v6.mjs'];
const SELF = 'static_check_v7.mjs';
const FROZEN_DRIVES = ['drive_v1.mjs', 'drive_v2.mjs', 'drive_v3.mjs', 'drive_v4.mjs', 'drive_v5.mjs', 'drive_v6.mjs', 'display_v1.mjs'];
const FROZEN_TESTS = ['test_harness_v1.mjs'];
const HOOKS = ['afon_hooks_v1.mjs', 'afon_hooks_v2.mjs', 'afon_hooks_v3.mjs', 'afon_hooks_v4.mjs', 'afon_hooks_v5.mjs', 'afon_hooks_v6.mjs'];
const GATES = ['gate_v1.mjs', 'gate_v2.mjs', 'gate_v3.mjs'];
const CHECKERS = [SELF, ...PRIOR];

const ALLOW = {
  armPress: new Set(CHECKERS),
  'ctx.key': new Set([...GATES, ...CHECKERS]),
  dial_input: new Set([...GATES, ...HOOKS, ...CHECKERS]),
  setPose: new Set([...GATES, ...CHECKERS]),
  setKey: new Set([...GATES, ...HOOKS, ...CHECKERS]),
  'sim.write': new Set([...HOOKS, ...FROZEN_DRIVES, 'display_v1.mjs', ...CHECKERS]),
  tap: new Set([...FROZEN_DRIVES, ...CHECKERS]),
  'raw-ok': new Set([...GATES, ...FROZEN_DRIVES, ...FROZEN_TESTS, ...CHECKERS]),
};

export function scanText(fileName, text) {
  const problems = [];
  for (const rule of RULES) {
    if (!rule.re.test(text)) continue;
    if (ALLOW[rule.name].has(fileName)) continue;
    problems.push(fileName + ' ' + rule.name);
  }
  return problems;
}

export function assertClean(root = 'work') {
  const problems = [];
  for (const dir of ['harness', 'scripts']) {
    const abs = resolve(root, dir);
    let names = [];
    try { names = readdirSync(abs); } catch { continue; }
    for (const name of names) {
      if (!name.endsWith('.mjs')) continue;
      problems.push(...scanText(name, readFileSync(resolve(abs, name), 'utf8')));
    }
  }
  if (problems.length) throw new Error('raw input outside the gate: ' + problems.join('; '));
  return problems;
}
