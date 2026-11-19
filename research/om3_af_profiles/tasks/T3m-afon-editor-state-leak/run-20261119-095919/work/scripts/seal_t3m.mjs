// Seal command 22, the manifest build. The wrapper writes this command's own
// .out, .err, and .exit after this process exits, so those three are not hashed.
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
const cmdText = readFileSync(resolve('work/out/cmd/22.cmd.txt'), 'utf8');
const exitDoc = JSON.parse(readFileSync(resolve('work/out/cmd/22.exit'), 'utf8'));
const manifest = fileRec('work/evidence-manifest.json');
const doc = {
  sealed: 'after the manifest hash',
  note: 'Command 22 builds evidence-manifest.json. This file hashes that command\'s wrapper outputs and the manifest. Command 23 writes this supplement. The wrapper writes 23.out, 23.err, and 23.exit after this process exits, so those three files are not hashed here.',
  command: {
    n: 22,
    requested: (cmdText.match(/^requested: (.*)$/m) || [])[1] || '',
    start: (cmdText.match(/^start (.*)$/m) || [])[1] || '',
    status: exitDoc.status,
    script: 'work/scripts/manifest_t3m.mjs',
    script_sha256: exitDoc.scripts && exitDoc.scripts[0] ? exitDoc.scripts[0].sha256 : null,
    wrapper_sha256: exitDoc.wrapper_sha256,
    files: {
      cmd: fileRec('work/out/cmd/22.cmd.txt'),
      out: fileRec('work/out/cmd/22.out'),
      err: fileRec('work/out/cmd/22.err'),
      exit: fileRec('work/out/cmd/22.exit'),
    },
  },
  manifest: manifest.path,
  manifest_sha256: manifest.sha256,
  manifest_bytes: manifest.bytes,
};
writeFileSync(resolve('work/evidence-supplement.json'), JSON.stringify(doc, null, 2) + '\n');
process.stdout.write('sealed command 22 manifest ' + manifest.sha256 + '\n');
