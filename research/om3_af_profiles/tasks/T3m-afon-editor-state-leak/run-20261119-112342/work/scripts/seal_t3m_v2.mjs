// Seal command 23 and commands 24-40, including the manifest build.
// The wrapper writes this command's own .out, .err, and .exit after exit,
// so those three are not hashed.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function fileRec(name) {
  const data = readFileSync(resolve(name));
  return {
    path: name.replaceAll('\\', '/'),
    sha256: createHash('sha256').update(data).digest('hex'),
    bytes: data.length,
  };
}
function commandRec(n) {
  const nn = String(n).padStart(2, '0');
  const cmdText = readFileSync(resolve('work/out/cmd/' + nn + '.cmd.txt'), 'utf8');
  const exitDoc = JSON.parse(readFileSync(resolve('work/out/cmd/' + nn + '.exit'), 'utf8'));
  return {
    n,
    requested: (cmdText.match(/^requested: (.*)$/m) || [])[1] || '',
    start: (cmdText.match(/^start (.*)$/m) || [])[1] || '',
    status: exitDoc.status,
    script_sha256: exitDoc.scripts && exitDoc.scripts[0] ? exitDoc.scripts[0].sha256 : null,
    wrapper_sha256: exitDoc.wrapper_sha256,
    files: {
      cmd: fileRec('work/out/cmd/' + nn + '.cmd.txt'),
      out: fileRec('work/out/cmd/' + nn + '.out'),
      err: fileRec('work/out/cmd/' + nn + '.err'),
      exit: fileRec('work/out/cmd/' + nn + '.exit'),
    },
  };
}
const commands = [];
for (let n = 23; n <= 41; n++) commands.push(commandRec(n));
const manifest = fileRec('work/evidence-manifest.json');
const prior = fileRec('work/evidence-supplement.json');
const doc = {
  sealed: 'command 23 and commands 24-40',
  note: 'Command 23 wrote evidence-supplement.json and is hashed here, together with commands 24 through 41. Command 41 wrote evidence-manifest.json. Command 42 writes this file. The wrapper writes 42.out, 42.err, and 42.exit after this process exits, so those three are not hashed here.',
  commands,
  prior_supplement: prior,
  manifest: manifest.path,
  manifest_sha256: manifest.sha256,
  manifest_bytes: manifest.bytes,
};
writeFileSync(resolve('work/evidence-supplement-v2.json'), JSON.stringify(doc, null, 2) + '\n');
process.stdout.write('wrote work/evidence-supplement-v2.json commands ' + commands.length + '\n');
