// Test-only child: exercises every read and load interface under --permission with the T13 inventory installed.
// Review correction 2: successful permitted reads must be recorded with path, length and first-read hash;
// refused reads must be refused. Run by test_v1.mjs only; never part of a plan run.
//   node --permission --allow-fs-read=<probe dir>\ --allow-fs-read=<harness>\ --allow-fs-write=<out>\ probe_v1.mjs <probeDir> <deniedDir> <out>
import fs from 'node:fs';
import { readFileSync as namedRead } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [dir, denied, out] = process.argv.slice(2);
const here = path.dirname(fileURLToPath(import.meta.url));
const { installInventory } = await import(pathToFileURL(path.join(here, 'inventory_v1.mjs')).href);
const rec = installInventory({
  outFile: path.join(out, 'inventory.jsonl'),
  preloaded: [import.meta.url, pathToFileURL(path.join(here, 'inventory_v1.mjs')).href, pathToFileURL(path.join(here, 'common_v1.mjs')).href],
});
const P = (n) => path.join(dir, n);
const D = (n) => path.join(denied, n);
const ok = {};
const refused = {};
const tryRun = async (bag, name, fn) => {
  try { await fn(); bag[name] = 'ok'; } catch (e) { bag[name] = e.code || String(e.message || e); }
};
await tryRun(ok, 'named-import', () => namedRead(P('a01.txt')));
await tryRun(ok, 'buffer-path', () => fs.readFileSync(Buffer.from(P('a02.txt'))));
await tryRun(ok, 'url-path', () => fs.readFileSync(pathToFileURL(P('a03.txt'))));
await tryRun(ok, 'open-read', () => { const fd = fs.openSync(P('a04.txt'), 'r'); const b = Buffer.alloc(4); fs.readSync(fd, b, 0, 4, 0); fs.closeSync(fd); });
await tryRun(ok, 'readv', () => { const fd = fs.openSync(P('a05.txt'), 'r'); fs.readvSync(fd, [Buffer.alloc(3)], 0); fs.closeSync(fd); });
await tryRun(ok, 'promises-readFile', () => fs.promises.readFile(P('a06.txt')));
await tryRun(ok, 'filehandle', async () => { const h = await fs.promises.open(P('a07.txt'), 'r'); await h.read(Buffer.alloc(2), 0, 2, 0); await h.close(); });
await tryRun(ok, 'stream', () => new Promise((res, rej) => { const s = fs.createReadStream(P('a08.txt')); s.on('data', () => {}); s.on('end', res); s.on('error', rej); }));
await tryRun(ok, 'callback-readFile', () => new Promise((res, rej) => fs.readFile(P('a09.txt'), (e) => (e ? rej(e) : res()))));
await tryRun(ok, 'createRequire', () => createRequire(P('x.js'))('./a10.cjs'));
await tryRun(ok, 'dynamic-import', () => import(pathToFileURL(P('a11.mjs')).href));
await tryRun(ok, 'fd-readFile', () => { const fd = fs.openSync(P('a12.txt'), 'r'); fs.readFileSync(fd); fs.closeSync(fd); });
await tryRun(ok, 'stat', () => fs.statSync(P('a01.txt')));
await tryRun(refused, 'readFileSync', () => fs.readFileSync(D('b.txt')));
await tryRun(refused, 'openSync', () => fs.openSync(D('b.txt'), 'r'));
await tryRun(refused, 'promises', () => fs.promises.readFile(D('b.txt')));
await tryRun(refused, 'import', () => import(pathToFileURL(D('b.mjs')).href));
await tryRun(refused, 'require', () => createRequire(D('x.js'))('./b.cjs'));
await tryRun(refused, 'stat', () => fs.statSync(D('b.txt')));
await tryRun(refused, 'forbidden-builtin', () => import('node:sqlite'));
await tryRun(refused, 'unknown-fd', () => fs.readSync(987, Buffer.alloc(1), 0, 1, 0));
rec.end({ probe: true });
process.stdout.write(JSON.stringify({ ok, refused, problems: rec.problems }) + '\n');
