// Static ban on raw input, paired press, and ungated native setup.
// The session calls this before the emulator. EMULATOR-ONLY.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RULES = [
  { name: 'armPress', re: /armPress/ },
  { name: 'ctx.key', re: /ctx\.key\s*\(/ },
  { name: 'ctx.s.key', re: /ctx\.s\.key\s*\(/ },
  { name: 'dial_input', re: /dial_input/ },
  { name: 'setPose', re: /setPose\s*\(/ },
  { name: 'setKey', re: /setKey\s*\(/ },
  { name: 'sim.write', re: /\.sim\.write\s*\(/ },
  { name: 'sim.u8', re: /\.sim\.u8\s*\(/ },
  { name: 'sim.word', re: /\.sim\.word\s*\(/ },
  { name: 'writeU32', re: /writeU32\s*\(/ },
  { name: 'writeU16', re: /writeU16\s*\(/ },
  { name: 'nk.svc', re: /\.nk\.svc\s*\(/ },
  { name: 'bringUp', re: /bringUp\s*\(/ },
  { name: 'tap', re: /\btap\s*\(/ },
  { name: 'raw-ok', re: /key\(\s*['"]ok['"]/ },
  { name: 'press', re: /\.press\s*\(/ },
  { name: 'native', re: /\.native\s*\(/ },
  { name: 'l.call', re: /\.l\.call\s*\(|(?:^|[^.\w])l\.call\s*\(/ },
  { name: 'switch_input', re: /switch_input\s*\(/ },
];

const SELF = 'static_check_v9.mjs';
const HOOKS = ['afon_hooks_v7.mjs'];
const GATES = ['gate_v4.mjs', 'gate_v5.mjs'];
const SETUP = ['setup_v1.mjs', 'setup_v2.mjs'];
const RECORDERS = ['refresh_v3.mjs', 'refresh_v4.mjs'];
const CHECKERS = [SELF, 'static_check_v8.mjs'];

const ALLOW = {
  armPress: new Set(CHECKERS),
  'ctx.key': new Set([...GATES, ...CHECKERS]),
  'ctx.s.key': new Set([...GATES, ...CHECKERS]),
  dial_input: new Set([...GATES, ...HOOKS, ...CHECKERS]),
  setPose: new Set([...GATES, ...CHECKERS]),
  setKey: new Set([...GATES, ...HOOKS, ...CHECKERS]),
  'sim.write': new Set([...HOOKS, ...CHECKERS]),
  'sim.u8': new Set(CHECKERS),
  'sim.word': new Set(CHECKERS),
  writeU32: new Set(CHECKERS),
  writeU16: new Set([...HOOKS, ...CHECKERS]),
  'nk.svc': new Set(CHECKERS),
  bringUp: new Set([...SETUP, ...CHECKERS]),
  tap: new Set(CHECKERS),
  'raw-ok': new Set([...GATES, ...CHECKERS]),
  press: new Set(CHECKERS),
  native: new Set([...HOOKS, ...SETUP, ...RECORDERS, ...CHECKERS]),
  'l.call': new Set([...HOOKS, ...SETUP, ...CHECKERS]),
  switch_input: new Set([...SETUP, ...CHECKERS]),
};

export const PLANTS = [
  ['armPress', 'armPress = 1;\n'],
  ['ctx.key', 'ctx.key(1, 2);\n'],
  ['ctx.s.key', 'ctx.s.key(\'up\', \'down\');\n'],
  ['dial_input', 'dial_input();\n'],
  ['setPose', 'setPose(1);\n'],
  ['setKey', 'setKey(1, 2, 3);\n'],
  ['sim.write', 'x.sim.write(1, 2);\n'],
  ['sim.u8', 'ctx.l.sim.u8(1, 2);\n'],
  ['sim.word', 'ctx.l.sim.word(1, 2);\n'],
  ['writeU32', 'ctx.writeU32(1, 2);\n'],
  ['writeU16', 'ctx.writeU16(1, 2);\n'],
  ['nk.svc', 'ctx.l.nk.svc(1);\n'],
  ['bringUp', 'ctx.bringUp();\n'],
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
