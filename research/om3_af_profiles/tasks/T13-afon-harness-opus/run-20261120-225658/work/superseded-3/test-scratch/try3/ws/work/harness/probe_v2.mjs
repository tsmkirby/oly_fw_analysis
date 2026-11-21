// Test-only child, v2: exercises every read, metadata, listing and load interface under --permission with the
// T13 inventory v2 installed (code review correction 2). Each interface uses its own target, so each must leave
// its own inventory entry. Run by test_v2.mjs only; never part of a plan run.
//   node --permission --allow-fs-read=<probe>\ --allow-fs-read=<harness>\ --allow-fs-write=<out>\ probe_v2.mjs <probe> <denied> <out>
import fs from 'node:fs';
import { readFileSync as namedRead } from 'node:fs';
import { readFile as namedPromiseRead } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [dir, denied, out] = process.argv.slice(2);
const here = path.dirname(fileURLToPath(import.meta.url));
const { installInventory, unclassified } = await import(pathToFileURL(path.join(here, 'inventory_v2.mjs')).href);
const rec = installInventory({
  outFile: path.join(out, 'inventory.jsonl'),
  preloaded: [import.meta.url, pathToFileURL(path.join(here, 'inventory_v2.mjs')).href, pathToFileURL(path.join(here, 'common_v1.mjs')).href],
  prereads: [{ path: path.join(dir, 'pre.txt'), bytes: Buffer.from('pre\n'), api: 'probe-preread' }],
});
const P = (n) => path.join(dir, n);
const D = (n) => path.join(denied, n);
const ok = {};
const refused = {};
const run = async (bag, name, fn) => { try { await fn(); bag[name] = 'ok'; } catch (e) { bag[name] = e.code || String(e.message || e); } };
const cb = (f) => new Promise((res, rej) => f((e, v) => (e ? rej(e) : res(v))));

// content (expected kind read/open/load, each its own file)
await run(ok, 'c01 named readFileSync', () => namedRead(P('c01.txt')));
await run(ok, 'c02 Buffer path', () => fs.readFileSync(Buffer.from(P('c02.txt'))));
await run(ok, 'c03 URL path', () => fs.readFileSync(pathToFileURL(P('c03.txt'))));
await run(ok, 'c04 openSync+readSync', () => { const fd = fs.openSync(P('c04.txt'), 'r'); fs.readSync(fd, Buffer.alloc(2), 0, 2, 0); fs.closeSync(fd); });
await run(ok, 'c05 readvSync', () => { const fd = fs.openSync(P('c05.txt'), 'r'); fs.readvSync(fd, [Buffer.alloc(2)], 0); fs.closeSync(fd); });
await run(ok, 'c06 promises.readFile', () => fs.promises.readFile(P('c06.txt')));
await run(ok, 'c07 FileHandle read', async () => { const h = await fs.promises.open(P('c07.txt'), 'r'); await h.read(Buffer.alloc(2), 0, 2, 0); await h.close(); });
await run(ok, 'c08 createReadStream', () => new Promise((res, rej) => { const s = fs.createReadStream(P('c08.txt')); s.on('data', () => {}); s.on('end', res); s.on('error', rej); }));
await run(ok, 'c09 readFile callback', () => cb((k) => fs.readFile(P('c09.txt'), k)));
await run(ok, 'c10 createRequire', () => createRequire(P('x.js'))('./c10.cjs'));
await run(ok, 'c11 dynamic import', () => import(pathToFileURL(P('c11.mjs')).href));
await run(ok, 'c12 readFileSync(fd)', () => { const fd = fs.openSync(P('c12.txt'), 'r'); fs.readFileSync(fd); fs.closeSync(fd); });
await run(ok, 'c13 open callback + read', () => cb((k) => fs.open(P('c13.txt'), 'r', k)).then((fd) => cb((k) => fs.read(fd, Buffer.alloc(2), 0, 2, 0, k)).then(() => fs.closeSync(fd))));
await run(ok, 'c14 copyFileSync source', () => fs.copyFileSync(P('c14.txt'), path.join(out, 'copy14.txt')));
await run(ok, 'c15 copyFile callback source', () => cb((k) => fs.copyFile(P('c15.txt'), path.join(out, 'copy15.txt'), k)));
await run(ok, 'c16 promises.copyFile source', () => fs.promises.copyFile(P('c16.txt'), path.join(out, 'copy16.txt')));
await run(ok, 'c17 cpSync source', () => fs.cpSync(P('c17.txt'), path.join(out, 'copy17.txt')));
await run(ok, 'c18 promises.cp source', () => fs.promises.cp(P('c18.txt'), path.join(out, 'copy18.txt')));
await run(ok, 'c19 named promises readFile', () => namedPromiseRead(P('c19.txt')));
// metadata and listings (expected kind meta, each its own target)
await run(ok, 'm01 statSync', () => fs.statSync(P('m01.txt')));
await run(ok, 'm02 stat callback', () => cb((k) => fs.stat(P('m02.txt'), k)));
await run(ok, 'm03 promises.stat', () => fs.promises.stat(P('m03.txt')));
await run(ok, 'm04 lstatSync', () => fs.lstatSync(P('m04.txt')));
await run(ok, 'm05 promises.lstat', () => fs.promises.lstat(P('m05.txt')));
await run(ok, 'm06 accessSync', () => fs.accessSync(P('m06.txt')));
await run(ok, 'm07 promises.access', () => fs.promises.access(P('m07.txt')));
await run(ok, 'm08 existsSync', () => { if (!fs.existsSync(P('m08.txt'))) throw new Error('absent'); });
await run(ok, 'm09 readdirSync', () => fs.readdirSync(P('d09')));
await run(ok, 'm10 readdir callback', () => cb((k) => fs.readdir(P('d10'), k)));
await run(ok, 'm11 promises.readdir', () => fs.promises.readdir(P('d11')));
await run(ok, 'm12 opendirSync', () => fs.opendirSync(P('d12')).closeSync());
await run(ok, 'm13 promises.opendir', async () => (await fs.promises.opendir(P('d13'))).close());
await run(ok, 'm14 realpathSync', () => fs.realpathSync(P('m14.txt')));
await run(ok, 'm15 realpathSync.native', () => fs.realpathSync.native(P('m15.txt')));
await run(ok, 'm16 promises.realpath', () => fs.promises.realpath(P('m16.txt')));
await run(ok, 'm17 statfsSync', () => fs.statfsSync(P('m17.txt')));
await run(ok, 'm18 globSync', () => fs.globSync(P('d18') + '/*'));
await run(ok, 'm19 access callback', () => cb((k) => fs.access(P('m19.txt'), k)));
// refused or denied
await run(refused, 'outside grant readFileSync', () => fs.readFileSync(D('b.txt')));
await run(refused, 'outside grant openSync', () => fs.openSync(D('b.txt'), 'r'));
await run(refused, 'outside grant promises.readFile', () => fs.promises.readFile(D('b.txt')));
await run(refused, 'outside grant import', () => import(pathToFileURL(D('b.mjs')).href));
await run(refused, 'outside grant require', () => createRequire(D('x.js'))('./b.cjs'));
await run(refused, 'outside grant stat', () => fs.statSync(D('b.txt')));
await run(refused, 'interface openAsBlob', () => fs.openAsBlob(P('c01.txt')));
await run(refused, 'interface watch', () => fs.watch(P('c01.txt')));
await run(refused, 'interface watchFile', () => fs.watchFile(P('c01.txt'), () => {}));
await run(refused, 'interface promises.watch', () => fs.promises.watch(P('c01.txt')));
await run(refused, 'forbidden built-in', () => import('node:sqlite'));
await run(refused, 'unknown descriptor', () => fs.readSync(987, Buffer.alloc(1), 0, 1, 0));
rec.end({ probe: true });
process.stdout.write(JSON.stringify({ ok, refused, unclassified: unclassified(), problems: rec.problems }) + '\n');
