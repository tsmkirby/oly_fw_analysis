// Command record wrapper, version d1.
// Spawns one program and writes the command line, stdout, stderr and the real
// exit status under work/out/cmd/. Nothing is reconstructed.
// Usage: node26 work/scripts/run_logged.mjs NN program arg...
// node26 is a .cmd, so a Node program is started with process.execPath.
// Any other .cmd or .bat is started with cmd.exe /d /c.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [nn, program, ...args] = process.argv.slice(2);
if (!nn || !program) {
  process.stderr.write('usage: node26 work/scripts/run_logged.mjs NN program arg...\n');
  process.exit(2);
}
const dir = resolve('work/out/cmd');
mkdirSync(dir, { recursive: true });
const started = new Date().toISOString();
const requested = [program, ...args].join(' ');

function quoteCmd(s) {
  if (!/[\s"&|<>^]/.test(s)) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

const lower = program.toLowerCase();
const isNode = lower === 'node26' || lower === 'node26.cmd' || lower.endsWith('\\node26.cmd') || lower.endsWith('/node26.cmd');
const isCmd = !isNode && (lower.endsWith('.cmd') || lower.endsWith('.bat'));
let spawnProgram;
let spawnArgs;
let verbatim = false;
if (isNode) {
  spawnProgram = process.execPath;
  spawnArgs = args;
} else if (isCmd) {
  spawnProgram = 'cmd.exe';
  spawnArgs = ['/d', '/c', [program, ...args].map(quoteCmd).join(' ')];
  verbatim = true;
} else {
  spawnProgram = program;
  spawnArgs = args;
}
const spawnLine = [spawnProgram, ...spawnArgs].join(' ');
writeFileSync(resolve(dir, `${nn}.cmd.txt`), `start ${started}\nrequested: ${requested}\n${spawnLine}\n`, 'utf8');
const result = spawnSync(spawnProgram, spawnArgs, {
  shell: false,
  windowsHide: true,
  windowsVerbatimArguments: verbatim,
  maxBuffer: 128 * 1024 * 1024,
});
writeFileSync(resolve(dir, `${nn}.out`), result.stdout ?? Buffer.alloc(0));
writeFileSync(resolve(dir, `${nn}.err`), result.stderr ?? Buffer.alloc(0));
const record = {
  status: result.status,
  signal: result.signal,
  error: result.error ? String(result.error) : null,
  start: started,
  end: new Date().toISOString(),
  spawn: spawnLine,
};
writeFileSync(resolve(dir, `${nn}.exit`), JSON.stringify(record, null, 2) + '\n', 'utf8');
if (result.error) process.exit(1);
process.exit(result.status === null ? 1 : result.status);
