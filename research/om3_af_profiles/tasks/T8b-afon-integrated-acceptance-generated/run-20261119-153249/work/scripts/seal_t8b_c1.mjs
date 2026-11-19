// External final seal for the correction round.
// Hashes commands 01-36 in full, plus this command's cmd.txt.
// out, err, and exit for this command are written by the wrapper after exit.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function fileRec(name) {
  const data = readFileSync(resolve(name));
  return { path: name.replaceAll('\\', '/'), sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length };
}
function commandRec(n, full) {
  const nn = String(n).padStart(2, '0');
  const cmdText = readFileSync(resolve('work/out/cmd/' + nn + '.cmd.txt'), 'utf8');
  const files = { cmd: fileRec('work/out/cmd/' + nn + '.cmd.txt') };
  let status = null;
  let scripts = null;
  let wrapper = null;
  if (full) {
    const exitDoc = JSON.parse(readFileSync(resolve('work/out/cmd/' + nn + '.exit'), 'utf8'));
    status = exitDoc.status;
    scripts = exitDoc.scripts || [];
    wrapper = exitDoc.wrapper_sha256;
    files.out = fileRec('work/out/cmd/' + nn + '.out');
    files.err = fileRec('work/out/cmd/' + nn + '.err');
    files.exit = fileRec('work/out/cmd/' + nn + '.exit');
  }
  return {
    n,
    requested: (cmdText.match(/^requested: (.*)$/m) || [])[1] || '',
    status,
    wrapper_sha256: wrapper,
    scripts,
    files,
  };
}
const commands = [];
for (let n = 1; n <= 36; n++) commands.push(commandRec(n, true));
commands.push(commandRec(37, false));
const doc = {
  task: 'T8b',
  sealed: 'External final seal after the correction stop. Commands 01-36 include cmd, out, err, and exit. Command 37 cmd.txt is hashed. 37.out, 37.err, and 37.exit are written by the wrapper after this process exits.',
  manifest: fileRec('work/evidence-manifest.json'),
  result: fileRec('work/result.md'),
  reference_t8b: fileRec('work/out/reference-t8b.json'),
  factory: fileRec('work/out/factory-defaults-c1.json'),
  table: fileRec('work/out/accept-table-t8b-c1b.json'),
  seal_script: fileRec('work/scripts/seal_t8b_c1.mjs'),
  commands,
};
writeFileSync(resolve('work/evidence-supplement.json'), JSON.stringify(doc, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: true, commands: commands.length, manifest: doc.manifest.sha256 }) + '\n');
