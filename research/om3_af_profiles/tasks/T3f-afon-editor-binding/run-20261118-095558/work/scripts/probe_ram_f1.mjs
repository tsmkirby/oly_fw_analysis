// role: observe. See which section-1 addresses keep image bytes at runtime.
// Usage: node26 work/scripts/probe_ram_f1.mjs om-emu work/out/probe-ram-f1.jsonl
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, outPath] = process.argv.slice(2);
process.env.OM_EMU_MODEL = 'E147';
const use = (p) => import(pathToFileURL(resolve(checkout, 'emu', p)).href);
const { loadNand, patchedFirmware, createHash } = await use('checks/lib/env.mjs');
const { Player } = await use('src/lab/player.mjs');
const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
const fw = patchedFirmware([{ block: 'main', offset: 0x6031ea48 - 0x60021020, old: Uint8Array.of(0xff), new: Uint8Array.of(0x5a), source: 'work/scripts/probe_ram_f1.mjs', n: 0 }]);
const pl = new Player(
  { ...PLAYER_PARSER, no_browser: true, idle: 'off', a15: 'on', out: '<out>', no_wait_on_error: true },
  { ...fw, nand: loadNand(), createHash, wallClock: () => performance.now() / 1000, machine: { coverage: { mark() {}, stub() {} } }, patch: fw.summary, patchRanges: fw.changed, loaded: 'on' },
);
const lines = [];
try {
  pl.open_session();
  const l = pl.session.lab;
  const addrs = [0x6031ea00, 0x6031ef00, 0x6031efe0, 0x6031f000, 0x6031f020, 0x6031f100, 0x60320000, 0x60321000];
  for (const a of addrs) {
    const b = Buffer.from(l.sim.read(a, 16)).toString('hex');
    lines.push(JSON.stringify({ hook: 'observe', role: 'observe', addr: '0x' + a.toString(16), bytes: b }));
  }
  const buf = Buffer.alloc(4); buf.writeUInt32LE(0x11223344, 0);
  l.sim.write(0x6031ef00, buf);
  l.sim.write(0x60320000, buf);
  lines.push(JSON.stringify({
    hook: 'EMULATOR-ONLY', role: 'behaviour', step: 'poke',
    label: 'EMULATOR-ONLY probe write',
    at_ef00: Buffer.from(l.sim.read(0x6031ef00, 4)).toString('hex'),
    at_20000: Buffer.from(l.sim.read(0x60320000, 4)).toString('hex'),
  }));
} catch (e) {
  lines.push(JSON.stringify({ hook: 'observe', role: 'observe', step: 'boundary', error: String(e && e.stack ? e.stack : e) }));
  process.exitCode = 1;
} finally {
  if (pl.session) pl.close_session();
  mkdirSync(resolve('work/out'), { recursive: true });
  writeFileSync(outPath, lines.join('\n') + '\n');
}
