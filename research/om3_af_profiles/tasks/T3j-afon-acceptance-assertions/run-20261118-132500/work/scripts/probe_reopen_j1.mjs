// One new session on the probe store. Do not edit after it has run.
// Usage: node26 work/scripts/probe_reopen_j1.mjs om-emu
import { writeFileSync } from 'node:fs';
import { runZone } from './zone_session_j1.mjs';
import { capture } from './observe_j1.mjs';

const [checkout] = process.argv.slice(2);
const lines = [];
const emit = (row) => {
  const text = JSON.stringify(row);
  lines.push(text);
  console.log(text);
};
try {
  const result = await runZone({
    checkout,
    outPath: 'work/out/probe-reopen-session.jsonl',
    tag: 'probe-reopen',
    candidate: true,
    help: true,
    rowLabel: true,
    nvramPath: 'work/out/nvram-probe-c1.json',
    explanation: 'New session on the probe store. The profile byte is expected at its default.',
    change: 'T3i final configuration, no new keys',
    async drive(ctx) {
      ctx.takeFaces();
      const got = capture(ctx, 'reopen');
      emit({
        id: 'reopen',
        title: got.title,
        highlight: got.highlight,
        screen: got.screen,
        profile: got.profile,
        profileCached: got.profileCached,
        helpId: got.helpId,
        slotValue: got.slotValue,
        glyph: got.glyph,
        invariant: got.invariant,
        screenshot: got.screenshot,
        error: got.error,
      });
    },
  });
  if (!result.ok) throw new Error(result.failed);
  emit({ step: 'done', ok: true });
} catch (e) {
  emit({ step: 'done', ok: false, error: String(e && e.stack ? e.stack : e) });
  process.exitCode = 1;
} finally {
  writeFileSync('work/out/probe-reopen-j1.jsonl', lines.join('\n') + (lines.length ? '\n' : ''));
}
