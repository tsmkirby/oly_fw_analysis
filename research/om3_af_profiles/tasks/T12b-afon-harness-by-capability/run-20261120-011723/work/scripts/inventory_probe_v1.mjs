// Inventory probe. EMULATOR-ONLY. Not a T13 runner.
import fs from 'node:fs';
import { resolve } from 'node:path';

const mode = process.env.T12B_PROBE;
if (mode === 'identity') {
  const identity = resolve('work/out/probe-identity.json');
  const promiseFile = resolve('work/out/probe-promise.json');
  const openFile = resolve('work/out/probe-open.txt');
  const streamFile = resolve('work/out/probe-stream.txt');
  fs.readFileSync(identity);
  await fs.promises.readFile(promiseFile);
  const fd = fs.openSync(openFile, 'r');
  fs.closeSync(fd);
  await new Promise((done, reject) => {
    fs.readFile(streamFile, (error, data) => (error ? reject(error) : done(data)));
  });
  const stream = fs.createReadStream(identity);
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
