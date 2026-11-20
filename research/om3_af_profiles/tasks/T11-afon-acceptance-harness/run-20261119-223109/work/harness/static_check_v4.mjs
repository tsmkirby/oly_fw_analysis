// Static ban on raw input outside the gate. The session calls this before the emulator.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RULES = [
  { name: 'armPress', re: /armPress/ },
  { name: 'ctx.key', re: /ctx\.key\s*\(/ },
  { name: 'dial_input', re: /dial_input/ },
  { name: 'setPose', re: /setPose\s*\(/ },
  { name: 'setKey', re: /setKey\s*\(/ },
];

const SELF = 'static_check_v4.mjs';
const PRIOR = ['static_check_v1.mjs', 'static_check_v2.mjs', 'static_check_v3.mjs'];
const ALLOW = {
  armPress: new Set([SELF, ...PRIOR]),
  'ctx.key': new Set(['gate_v1.mjs', SELF, ...PRIOR]),
  dial_input: new Set(['gate_v1.mjs', SELF, ...PRIOR]),
  setPose: new Set(['gate_v1.mjs', SELF, ...PRIOR]),
  setKey: new Set(['gate_v1.mjs', 'afon_hooks_v1.mjs', 'afon_hooks_v2.mjs', 'afon_hooks_v3.mjs', 'afon_hooks_v4.mjs', SELF, ...PRIOR]),
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
