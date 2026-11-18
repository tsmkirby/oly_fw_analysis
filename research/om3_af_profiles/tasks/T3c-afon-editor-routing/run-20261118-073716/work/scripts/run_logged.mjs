// Command record wrapper. Spawns one program with no shell and writes the
// command line, stdout, stderr and the real exit status under work/out/cmd/.
// Usage: node26 work/scripts/run_logged.mjs NN program arg...
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
const line = [program, ...args].join(' ');
writeFileSync(resolve(dir, `${nn}.cmd.txt`), `start ${started}\n${line}\n`, 'utf8');
const result = spawnSync(program, args, {
  shell: false,
  windowsHide: true,
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
};
writeFileSync(resolve(dir, `${nn}.exit`), JSON.stringify(record, null, 2) + '\n', 'utf8');
if (result.error) process.exit(1);
process.exit(result.status === null ? 1 : result.status);
