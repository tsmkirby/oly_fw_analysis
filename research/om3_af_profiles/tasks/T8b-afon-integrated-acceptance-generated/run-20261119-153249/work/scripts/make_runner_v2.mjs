// Restores the import inventory that accept_t8b_v1.mjs calls after a finished run.
// v1 ran and is left unchanged. This writes accept_t8b_v2.mjs.
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'work/scripts/accept_t8b_v1.mjs';
const dst = 'work/scripts/accept_t8b_v2.mjs';
let text = readFileSync(src, 'utf8');
if (text.includes('function inventory(')) throw new Error('v1 already defines inventory');
const fn = `
const IMPORT_RE = /(?:from\\\\s+|import\\\\s*\\\\(\\\\s*|import\\\\s+)['"]([^'"]+)['"]/g;
const USE_RE = /use\\\\(\\\\s*['"]([^'"]+)['"]\\\\s*\\\\)/g;
function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, base + '.mjs', base + '.js', join(base, 'index.mjs')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
function inventory(files) {
  const seen = new Map();
  const queue = [...files];
  while (queue.length) {
    const cur = queue.pop();
    if (!cur || seen.has(cur) || !existsSync(cur)) continue;
    const data = readFileSync(cur);
    seen.set(cur, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
    const text = data.toString('utf8');
    for (const re of [IMPORT_RE, USE_RE]) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(text))) {
        const spec = match[1];
        const next = spec.startsWith('.') ? resolveImport(cur, spec) : resolve(checkout, 'emu', spec);
        if (next && existsSync(next)) queue.push(next);
      }
    }
  }
  for (const extra of dynamicImports) {
    if (existsSync(extra) && !seen.has(extra)) {
      const data = readFileSync(extra);
      seen.set(extra, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
    }
  }
  return [...seen.entries()].map(([path, meta]) => ({ path: path.replaceAll('\\\\', '/'), ...meta, hashed: 'execution' }));
}
`;
// The regex source above was double-escaped for this generator. Rebuild the real functions literally.
const real = `const IMPORT_RE = /(?:from\\s+|import\\s*\\(\\s*|import\\s+)['"]([^'"]+)['"]/g;
const USE_RE = /use\\(\\s*['"]([^'"]+)['"]\\s*\\)/g;
function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, base + '.mjs', base + '.js', join(base, 'index.mjs')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
function inventory(files) {
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
  for (const extra of dynamicImports) {
    if (existsSync(extra) && !seen.has(extra)) {
      const data = readFileSync(extra);
      seen.set(extra, { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
    }
  }
  return [...seen.entries()].map(([path, meta]) => ({ path: path.replaceAll('\\\\', '/'), ...meta, hashed: 'execution' }));
}
`;
text = text.replace('async function main()', real + '\nasync function main()');
text = text.replaceAll('accept_t8b_v1.mjs', 'accept_t8b_v2.mjs');
text = text.replace(
  'const IMPORT_RE',
  '// v2 restores inventory after v1 completed its sessions and then threw. v1 is unchanged.\nconst IMPORT_RE',
);
if (!text.includes('function inventory(')) throw new Error('insert failed');
writeFileSync(dst, text);
process.stdout.write(JSON.stringify({ ok: true, bytes: Buffer.byteLength(text) }) + '\n');
