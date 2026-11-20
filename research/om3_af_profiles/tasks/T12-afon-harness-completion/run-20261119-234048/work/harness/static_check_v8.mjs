// Static ban on raw input, paired press, and ungated native setup.
// The session calls this before the emulator. EMULATOR-ONLY.
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
  { name: 'press', re: /\.press\s*\(/ },
  { name: 'native', re: /\.native\s*\(/ },
  { name: 'l.call', re: /\.l\.call\s*\(|(?:^|[^.\w])l\.call\s*\(/ },
  { name: 'switch_input', re: /switch_input\s*\(/ },
];

const SELF = 'static_check_v8.mjs';
const HOOKS = ['afon_hooks_v7.mjs'];
const GATES = ['gate_v4.mjs'];
const SETUP = ['setup_v1.mjs'];
const RECORDERS = ['refresh_v3.mjs'];
const CHECKERS = [SELF];

const ALLOW = {
  armPress: new Set(CHECKERS),
  'ctx.key': new Set([...GATES, ...CHECKERS]),
  dial_input: new Set([...GATES, ...HOOKS, ...CHECKERS]),
  setPose: new Set([...GATES, ...CHECKERS]),
  setKey: new Set([...GATES, ...HOOKS, ...CHECKERS]),
  'sim.write': new Set([...HOOKS, ...CHECKERS]),
  tap: new Set(CHECKERS),
  'raw-ok': new Set([...GATES, ...CHECKERS]),
  press: new Set(CHECKERS),
  native: new Set([...HOOKS, ...SETUP, ...RECORDERS, ...CHECKERS]),
  'l.call': new Set([...HOOKS, ...SETUP, ...CHECKERS]),
  switch_input: new Set([...SETUP, ...CHECKERS]),
};

// Plant strings live in this allowed file. Tests join nothing of their own.
export const PLANTS = [
  ['armPress', 'armPress = 1;\n'],
  ['ctx.key', 'ctx.key(1, 2);\n'],
  ['dial_input', 'dial_input();\n'],
  ['setPose', 'setPose(1);\n'],
  ['setKey', 'setKey(1, 2, 3);\n'],
  ['sim.write', 'x.sim.write(1, 2);\n'],
  ['tap', 'tap(1);\n'],
  ['raw-ok', 'key(\'ok\');\n'],
  ['press', 'gate.press(1);\n'],
  ['native', 'ctx.native(1);\n'],
  ['l.call', 'ctx.l.call(1);\n'],
  ['switch_input', 'switch_input(1);\n'],
];

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
