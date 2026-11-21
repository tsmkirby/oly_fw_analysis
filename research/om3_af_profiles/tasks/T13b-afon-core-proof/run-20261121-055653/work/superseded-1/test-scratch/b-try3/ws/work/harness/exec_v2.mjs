// Plan interpreter, v2 (code review run-20261120-221318-review corrections 3-5). EMULATOR-ONLY.
// v2: display plant/hold/seed relations hold the frame again (display_v5); display edges judge the redraw deadline
// from the sample times; every display session persists its full refresh record (windows, getter calls with returns
// and substitutions, outside calls with categories, orphans, timestamped samples) and the completion lists it.
// Runs plan data (plan_v1.mjs) through a session adapter (session_v1.mjs real, fake_v1.mjs fake). The adapter
// builds the gate with its private delivery functions; this module only sees { gate, observe }.
// Stops at the first failing operation. Returns the completion record the parent checks.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expectedOps, commitOps, sessionsOf, table } from './plan_v1.mjs';
import { reproduce, rowKey, shapeProblems } from './expect_v1.mjs';
import {
  AFON_PRESS_REFERENCE, createJudge, judgeDisplayEdge, judgeIdentityFrom, judgePoseWatch, judgeTableOp, judgeWriter,
} from './relations_v2.mjs';
import { writeIdentity } from './seal_v1.mjs';

const STEP = new Map(table.steps.map((s) => [s.id, s]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function compact(state) {
  if (!state) return null;
  return {
    screen: state.screen, poseWord: state.poseWord, flag: state.flag, owner: state.owner, subject: state.subject,
    target: state.target, halfTarget: state.halfTarget, readBank: state.readBank, edge: state.edge,
    frame: state.frame ? { boxes: state.frame.boxes, pixels: state.frame.pixels, n31: state.frame.n31, sha256: state.frame.sha256 } : null,
  };
}

function holdFields(judge, opId, before, after, fields) {
  for (const f of fields) judge.eq(opId, f, 'preserve', after, before ? before[f] : undefined);
}

function judgeOpRelation(judge, op, opId, before, after) {
  if (op.relation === 'plant') {
    const slots = before.slots.map((s) => ({ ...s }));
    const hit = slots.find((s) => s.key === op.setterKey && s.index === op.index);
    if (!hit) judge.fail(opId, 'slots', 'plant', 'no slot ' + op.setterKey.toString(16) + ':' + op.index);
    else hit.value = op.value;
    judge.eq(opId, 'slots', 'previous slots with one declared write (display_v5 plantExpect)', after, slots);
    holdFields(judge, opId, before, after, ['owner', 'flag', 'target', 'halfTarget', 'mirror71', 'frame']);
  } else if (op.relation === 'hold') {
    holdFields(judge, opId, before, after, ['slots', 'mirror71', 'flag', 'target', 'halfTarget', 'owner', 'frame']);
  } else if (op.relation === 'mirror-seed') {
    judge.eq(opId, 'mirror', 'literal:declared seed (display_v5 mirrorHeadExpect)', after, op.bytes, (s) => (s.mirror71 ? s.mirror71.slice(0, 55) : undefined));
    judge.eq(opId, 'mirrorTail', 'preserve', after, before.mirror71 ? before.mirror71.slice(55) : undefined, (s) => (s.mirror71 ? s.mirror71.slice(55) : undefined));
    holdFields(judge, opId, before, after, ['slots', 'owner', 'flag', 'target', 'halfTarget', 'frame']);
  } else if (op.relation) throw new Error('relation ' + op.relation);
}

export async function runPlan(env) {
  const { planName, mode, planSha, freezeSha, adapter, refs, outDir } = env;
  const sessions = sessionsOf(planName);
  const isIdentity = planName === 'identity';
  const logPath = path.join(outDir, 'log.jsonl');
  const log = (row) => fs.appendFileSync(logPath, JSON.stringify(row) + '\n');
  const sealedRows = isIdentity ? null : (env.identity && env.identity.rows);
  if (!isIdentity && !sealedRows) throw new Error('plan ' + planName + ' needs the sealed identity table');

  // Identity coverage before any session starts (design_v2 §5): one sealed row with identity per commit.
  if (!isIdentity) {
    const missing = [];
    for (const key of commitOps(planName)) {
      const [sid, ...rest] = key.split(':');
      const row = sealedRows[rowKey(planSha, sid, rest.join(':'))];
      if (!row || !row.ident) missing.push(key);
    }
    for (const key of expectedOps(planName)) {
      const [sid, ...rest] = key.split(':');
      if (!sealedRows[rowKey(planSha, sid, rest.join(':'))]) missing.push('state ' + key);
    }
    log({ id: 'identity-coverage', pass: missing.length === 0, missing });
    if (missing.length) throw new Error('identity coverage refused before any session: ' + missing.slice(0, 5).join(', ') + (missing.length > 5 ? ' (+' + (missing.length - 5) + ')' : ''));
  }

  const judge = createJudge();
  const rows = {};
  const executed = [];
  const recorded = { k1e: {}, k2: {}, candidate: {} };
  const producers = {};
  const zone = { zk1e: {}, states: {} };
  let reproduced = 0;
  const recorder = [];
  let deliveries = 0;
  log({ id: 'plan', plan: planName, mode, planSha, freezeSha, pressReference: AFON_PRESS_REFERENCE, sessions: sessions.map((s) => s.id) });

  const presence = (sid, op) => {
    if (isIdentity) return { ok: true, problems: [] };
    const row = sealedRows[rowKey(planSha, sid, op.id)];
    if (!row) return { ok: false, problems: ['sealed table has no row ' + sid + ':' + op.id] };
    if (!row.ident) return { ok: false, problems: ['sealed row ' + sid + ':' + op.id + ' has no identity'] };
    return { ok: true, problems: [] };
  };

  for (const s of sessions) {
    await adapter.runSession(s, async ({ gate, observe }) => {
      for (const op of s.ops) {
        const key = rowKey(planSha, s.id, op.id);
        observe.markReads();
        if (op.refreshBefore) observe.hooksRefresh();
        if (op.watch) observe.armWatches(op.table.step);
        let value = op.value;
        if (op.valueFrom) {
          const st = zone.states[op.valueFrom.op];
          if (!st) throw new Error(op.id + ' value source ' + op.valueFrom.op + ' not recorded');
          value = st.half[op.valueFrom.cell][op.valueFrom.index];
          if (typeof value !== 'number') throw new Error(op.id + ' value source cell');
        }
        const r = await gate.perform(op, value);
        if (op.refreshAfter) observe.hooksRefresh();
        const problems = [...shapeProblems(r.before, 'before'), ...shapeProblems(r.after, 'after')];
        const sourceMap = { fields: {}, relations: [] };
        if (isIdentity) {
          rows[key] = { before: r.before, after: r.after, ident: r.ident };
          sourceMap.fields = 'recorded (identity pass)';
        } else {
          const rp = reproduce(sealedRows[key], r);
          problems.push(...rp.problems);
          sourceMap.fields = rp.fields;
          reproduced += 1;
        }
        const mark = judge.out.length;
        judge.eq(op.id, 'subject', 'literal:0 (0x1e71[0])', r.after, 0);
        if (op.table) {
          const step = STEP.get(op.table.step);
          const { role, phase } = op.table;
          judgeTableOp(judge, recorded, { opId: op.id, role, step, phase, before: r.before, after: r.after });
          if (r.commit && step.commit) {
            const upKey = step.action === 'key' && phase === 'up';
            const producerKey = upKey ? step.who[0] + ':' + step.id + '-up' : step.identityFrom;
            const ownKey = role + ':' + step.id + (upKey ? '-up' : '');
            if (producerKey !== ownKey && (phase === 'down' || step.action === 'edge' || upKey)) {
              judgeIdentityFrom(judge, op.id, r.ident, producers[producerKey], producerKey);
            }
          }
          recorded[role][step.id] = r.after;
          if (phase === 'down' && step.action === 'key') recorded[role][step.id + '-down'] = r.after;
          if (r.commit) producers[role + ':' + step.id + (step.action === 'key' && phase === 'up' ? '-up' : '')] = r.ident;
        }
        if (op.action === 'pose' && !op.table) judge.eq(op.id, 'poseWord', 'literal:1 (landscape)', r.after, 1);
        if (op.watch) judgePoseWatch(judge, op.id, observe.poseWatch(op.table.step));
        if (op.linkCheck) {
          const links = [observe.readGetter(0x1db1, 0), observe.readGetter(0x1dc1, 0)];
          judge.result(op.id, 'links', 'literal:[1,1] (0x1db1, 0x1dc1 read back)', same(links, [1, 1]), same(links, [1, 1]) ? null : { got: links });
        }
        if (op.relation) judgeOpRelation(judge, op, op.id, r.before, r.after);
        if (op.display) judgeDisplayEdge(judge, op.id, op.display.job, op.display.edge, refs.display, r.before, r.after, (st) => st.frame, r.settle);
        if (op.zoneRef) {
          if (s.id === 'zk1e') zone.zk1e[op.zoneRef.zone + ':' + op.zoneRef.which] = r.after;
          else {
            const ref = zone.zk1e[op.zoneRef.zone + ':' + op.zoneRef.which];
            const src = 'ref:zk1e:' + op.zoneRef.zone + ':s1-' + (op.zoneRef.which === 'press' ? 'down' : 'up') + ':target';
            if (ref) judge.eq(op.id, 'target', src, r.after, ref.target);
            else if (sessions.some((x) => x.id === 'zk1e')) judge.fail(op.id, 'target', src, 'reference absent');
          }
        }
        if (s.id === 'zk1e') zone.states[op.id] = r.after;
        const rels = judge.out.slice(mark);
        sourceMap.relations = rels.map((x) => ({ field: x.field, source: x.source }));
        for (const x of rels) if (!x.ok) problems.push('relation ' + x.field + ' [' + x.source + '] ' + JSON.stringify(x.detail));
        log({ id: op.id, session: s.id, pass: problems.length === 0, problems, commit: r.commit, sourceMap, settle: r.settle ? { t0: r.settle.t0, times: r.settle.times, boundNs: r.settle.boundNs } : null, before: compact(r.before), after: compact(r.after), ident: r.ident });
        if (problems.length) throw new Error(s.id + ':' + op.id + ' ' + problems.slice(0, 4).join(' | '));
        if (op.shotAfter) observe.shot(op.shotAfter);
        executed.push(s.id + ':' + op.id);
      }
      if (s.writerCalls != null) {
        const mark = judge.out.length;
        judgeWriter(judge, s.id + '-writer-calls', observe.writerCount(), s.writerCalls);
        const bad = judge.out.slice(mark).filter((x) => !x.ok);
        log({ id: s.id + '-writer-calls', session: s.id, pass: bad.length === 0, problems: bad.map((x) => JSON.stringify(x.detail)) });
        if (bad.length) throw new Error(s.id + ' writer calls');
      }
      if (s.recorder) {
        const record = observe.refreshRecord();
        const lines = [
          ...record.windows.map((w) => JSON.stringify({ kind: 'window', ...w })),
          ...record.outside.map((c) => JSON.stringify({ kind: 'outside', ...c })),
          ...record.orphans.map((c) => JSON.stringify({ kind: 'orphan', ...c })),
          ...record.samples.map((x) => JSON.stringify({ kind: 'sample', t: x.t, sig: x.sig && x.sig.sha256 ? x.sig.sha256 : null })),
        ];
        const counts = { windows: record.windows.length, outside: record.outside.length, orphans: record.orphans.length, samples: record.samples.length, calls: record.windows.reduce((n, w) => n + w.calls.length, 0) };
        lines.push(JSON.stringify({ kind: 'end', ...counts }));
        const buf = Buffer.from(lines.join('\n') + '\n');
        const file = 'refresh-' + s.id + '.jsonl';
        fs.writeFileSync(path.join(outDir, file), buf);
        recorder.push({ session: s.id, file, bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex'), ...counts });
        const rec = observe.refreshProblems();
        const problems = [...rec.problems];
        if (!rec.windows) problems.push('no-refresh');
        if (!rec.calls) problems.push('no-getters');
        judge.result(s.id + '-refresh', 'recorder', 'refresh_v4 rules', problems.length === 0, problems.length ? problems : null);
        log({ id: s.id + '-refresh', session: s.id, pass: problems.length === 0, problems, windows: rec.windows, calls: rec.calls, outside: rec.outside });
        if (problems.length) throw new Error(s.id + ' recorder ' + problems.join(','));
      }
      deliveries += gate.deliveries();
    }, { presence, mode, refs, outDir });
  }

  const failed = judge.out.filter((x) => !x.ok);
  let identity = null;
  if (isIdentity) identity = writeIdentity(outDir, { plan: 'identity', planSha, freezeSha, mode, pressReference: AFON_PRESS_REFERENCE, rows });
  const completion = {
    plan: planName, mode, planSha, freezeSha, pressReference: AFON_PRESS_REFERENCE,
    executed, expected: expectedOps(planName).length, deliveries,
    relations: { evaluated: judge.out.length, failed: failed.length },
    reproduction: { evaluated: reproduced },
    identity, recorder, ok: failed.length === 0 && same(executed, expectedOps(planName)),
  };
  log({ id: planName + '-done', pass: completion.ok, relations: completion.relations, reproduction: completion.reproduction });
  return completion;
}
