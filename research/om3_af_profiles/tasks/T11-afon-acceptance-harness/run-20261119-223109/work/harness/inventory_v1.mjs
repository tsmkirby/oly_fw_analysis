// Session inventory. Call beginSession before any emulator import. finish() re-hashes.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function hashFile(path) {
  const bytes = readFileSync(path);
  return { path: path.replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export async function beginSession(tag) {
  const recordPath = resolve('work/out/inventory-' + tag + '.jsonl');
  mkdirSync(dirname(recordPath), { recursive: true });
  writeFileSync(recordPath, '');
  const started = new Date().toISOString();
  const meta = {
    tag,
    started,
    argv: process.argv.map(String),
    execPath: process.execPath,
    env: {
      OM_EMU_MODEL: process.env.OM_EMU_MODEL || null,
      OM_EMU_NVRAM: process.env.OM_EMU_NVRAM || null,
    },
  };
  writeFileSync(resolve('work/out/inventory-' + tag + '-meta.json'), JSON.stringify(meta, null, 2) + '\n');
  register(pathToFileURL(fileURLToPath(new URL('./inventory_hook_v1.mjs', import.meta.url))).href, {
    parentURL: import.meta.url,
    data: { recordPath },
  });
  const deadline = Date.now() + 5000;
  let ready = false;
  while (Date.now() < deadline) {
    const text = readFileSync(recordPath, 'utf8');
    if (text.includes('"ready":true')) { ready = true; break; }
    await new Promise((r) => setTimeout(r, 20));
  }
  if (!ready) throw new Error('inventory hook did not start');
  return {
    recordPath,
    metaPath: resolve('work/out/inventory-' + tag + '-meta.json'),
    finish(extraPaths = []) {
      const rows = readFileSync(recordPath, 'utf8').split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
      const imports = [];
      const seen = new Set();
      const problems = [];
      for (const row of rows) {
        if (!row.path || !row.sha256) continue;
        if (seen.has(row.path)) continue;
        seen.add(row.path);
        let again;
        try { again = hashFile(row.path); } catch (e) {
          problems.push('missing ' + row.path);
          continue;
        }
        if (again.sha256 !== row.sha256 || again.bytes !== row.bytes) problems.push('changed ' + row.path);
        imports.push({ path: again.path, sha256: again.sha256, bytes: again.bytes });
      }
      for (const extra of extraPaths) {
        const info = hashFile(resolve(extra));
        if (!seen.has(resolve(extra)) && !imports.some((row) => row.path === info.path)) imports.push(info);
      }
      const exit = {
        tag,
        finished: new Date().toISOString(),
        started,
        argv: meta.argv,
        env: meta.env,
        imports,
        problems,
        ok: problems.length === 0,
      };
      writeFileSync(resolve('work/out/inventory-' + tag + '-exit.json'), JSON.stringify(exit, null, 2) + '\n');
      return exit;
    },
  };
}
