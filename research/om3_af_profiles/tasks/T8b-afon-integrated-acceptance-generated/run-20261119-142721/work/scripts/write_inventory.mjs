// Writes the import inventory a finished runner would have written in its finally block.
// Static. No emulator. Refuses to overwrite.
// Usage: node26 work/scripts/write_inventory.mjs om-emu <script.mjs> <out.json> <tag>
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const [checkout, script, outPath, tag] = process.argv.slice(2);
if (!checkout || !script || !outPath || !tag) {
  process.stderr.write('usage: node26 work/scripts/write_inventory.mjs om-emu <script.mjs> <out.json> <tag>\n');
  process.exit(2);
}
if (existsSync(outPath)) throw new Error('refusing to overwrite ' + outPath);

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
const USE_RE = /use\(\s*['"]([^'"]+)['"]\s*\)/g;
function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, base + '.mjs', base + '.js', join(base, 'index.mjs')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
function inventory(files, extras) {
  const seen = new Map();
  const queue = [...files];
  while (queue.length) {
    const cur = queue.pop();
    if (!cur || seen.has(cur) || !existsSync(cur)) continue;
    const data = readFileSync(cur);
    seen.set(cur, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
    const body = data.toString('utf8');
    for (const re of [IMPORT_RE, USE_RE]) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(body))) {
        const spec = match[1];
        const next = spec.startsWith('.') ? resolveImport(cur, spec) : resolve(checkout, 'emu', spec);
        if (next && existsSync(next)) queue.push(next);
      }
    }
  }
  for (const extra of extras) {
    if (existsSync(extra) && !seen.has(extra)) {
      const data = readFileSync(extra);
      seen.set(extra, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
    }
  }
  return [...seen.entries()].map(([path, meta]) => ({ path: path.replaceAll('\\', '/'), ...meta, hashed: 'execution' }));
}

const extras = [
  resolve(checkout, 'emu/src/lab/menu.mjs'),
  resolve(checkout, 'emu/src/fw/model.mjs'),
  resolve(checkout, 'emu/checks/lib/png.mjs'),
  resolve(checkout, 'emu/src/lab/display.mjs'),
];
const rows = inventory([resolve(script)], extras);
writeFileSync(outPath, JSON.stringify({ tag, rows }, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: true, tag, rows: rows.length }) + '\n');
