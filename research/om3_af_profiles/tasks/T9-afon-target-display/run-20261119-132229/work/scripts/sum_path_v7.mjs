// Compact the version-7 observation so the draw path can be read without the
// full JSONL lines. Reads work/out/obs-path-v7.jsonl. Do not edit after it has run.
// Usage: node26 work/scripts/sum_path_v7.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rows = readFileSync(resolve('work/out/obs-path-v7.jsonl'), 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
const pick = (id) => rows.find((r) => r.id === id);
const brief = (row) => {
  if (!row) return null;
  const a = row.actual || {};
  return {
    id: row.id,
    pass: row.pass,
    problems: row.problems,
    expect: row.expect,
    union: a.union || null,
    restUnion: a.restUnion || null,
    marks: a.marks || null,
    png: a.png || null,
    cells: a.cells || null,
    target: a.target || null,
    dirty: a.dirty,
    watchCount: a.watchCount,
    watchPcs: a.watchPcs,
    watchError: a.watchError,
    watchSamples: a.watchSamples,
    draws: a.draws,
    updates: a.updates,
    gets: a.gets,
    posSamples: a.posSamples,
    posCount: a.posCount,
    oldCount: a.oldCount,
    unionSameAsOk: a.unionSameAsOk,
    upUnion: a.upUnion,
    colourHits: a.colourHits ? a.colourHits.length : undefined,
    records: a.records,
    note: row.note,
  };
};
const out = {
  model: pick('v7-model'),
  subject: pick('v7-subject'),
  rest: brief(pick('v7-rest')),
  buffers: brief(pick('v7-buffers')),
  idle: brief(pick('v7-idle')),
  direct: brief(pick('v7-direct')),
  ok: brief(pick('v7-ok')),
  afon: brief(pick('v7-afon')),
};
writeFileSync(resolve('work/out/sum-path-v7.json'), JSON.stringify(out, null, 2) + '\n');
const ok = out.ok || {};
console.log(JSON.stringify({
  restUnion: out.rest && out.rest.union,
  okUnion: ok.union,
  okWatch: ok.watchCount,
  okWatchPcs: ok.watchPcs,
  okDraws: (ok.draws || []).map((d) => ({ caller: d.caller, x: d.x, y: d.y, w: d.w, h: d.h, colour: d.colour, chain: (d.chain || []).map((c) => c.ra) })),
  okGets: ok.gets,
  okPos: ok.posSamples,
  okPosCount: ok.posCount,
  okOld: ok.oldCount,
  okUpdates: ok.updates,
  idleWatch: out.idle && out.idle.watchCount,
  idleDraws: out.idle && out.idle.draws,
  afonWatch: out.afon && out.afon.watchCount,
  afonDraws: out.afon && (out.afon.draws || []).length,
  afonSame: out.afon && out.afon.unionSameAsOk,
  afonPosCount: out.afon && out.afon.posCount,
  colourHits: out.buffers && out.buffers.colourHits,
}, null, 2));
