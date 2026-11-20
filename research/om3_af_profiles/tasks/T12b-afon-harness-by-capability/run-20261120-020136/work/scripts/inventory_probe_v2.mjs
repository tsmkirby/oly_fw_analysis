// Inventory probe for string, Buffer, URL and descriptor reads. EMULATOR-ONLY. Not a T13 runner.
import fs from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const mode = process.env.T12B_PROBE;
if (mode === 'forms') {
  const identity = resolve('work/out/probe-identity.json');
  const bufferFile = resolve('work/out/probe-buffer.txt');
  const urlFile = resolve('work/out/probe-url.txt');
  const fdFile = resolve('work/out/probe-fd.txt');
  const promiseFile = resolve('work/out/probe-promise.json');
  const streamFile = resolve('work/out/probe-stream.txt');
  fs.readFileSync(identity);
  fs.readFileSync(Buffer.from(bufferFile));
  fs.readFileSync(pathToFileURL(urlFile));
  const fd = fs.openSync(fdFile, 'r');
  const buf = Buffer.alloc(8);
  fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  const handle = await fs.promises.open(promiseFile, 'r');
  await handle.read(Buffer.alloc(8), 0, 8, 0);
  await handle.close();
  await fs.promises.readFile(promiseFile);
  const stream = fs.createReadStream(streamFile);
  await new Promise((done, reject) => {
    stream.on('error', reject);
    stream.on('end', done);
    stream.resume();
  });
} else if (mode === 'changed') {
  const path = resolve('work/out/probe-changed.txt');
  fs.readFileSync(path);
  fs.writeFileSync(path, 'changed-after-read\n');
} else {
  throw new Error('probe mode');
}
