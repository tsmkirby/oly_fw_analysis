# T11 decision (Opus)

**Verdict: CLOSED as PARTIAL.** The correction round failed (loop rule → different approach). Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-212547` (6 versions) | `run-20261119-222335-review` | REJECT: identity pass `ok:true`; proof stopped on missing sealed K1e rows; display not run; assertions outside the gate, runner-read pose predicate, late inventory, lossy refresh recorder |
| `run-20261119-223109` (correction, 5 versions) | `run-20261119-233249-review` | REJECT: identity v10 `ok:true` (55 rows); proof stopped at `candidate-af-up` title; display not run; §6 items 1, 2, 4, 5, 7 not done in full, item 3 done |

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **Combined hook set** (`afon_hooks` in the correction run): `bank()` and `initMirror()` textually equal T8c; reader,
  writer feed and display share `bank()`; the writer self-arms on the owner 0→2 transition with no runner flag
  (three calls, three `fire:true`).
- **Pose protection from installed behaviour:** the pose latch is set by native issue/publish observers; the refusal
  predicate reads no watch or runner state (§6 item 3 DONE). Normal-edit half cells equal K2; the non-reset
  pose-after-edit snapshot equals K2 (identity mode).
- **Zone press and release:** all 14 equalities including centre and custom; seven zone writer calls.
- **Harness parts that hold:** inventory registered before task imports, hashing errors fatal, exit checks on the
  recorded failure paths; sealed identity table checked before acceptance for the generated-table steps; refresh
  recorder retains returns and substitutions, no call cap, null/unclosed records fail.
- Section/overlay records, `0x1e71[0]=0` on all 279 identity-v10 records, 28 exit matches.

## Not accepted (carried forward)

1. Shape/type-only comparisons and undeclared slot exceptions (`compare_v3` seal fields, `k1eMenuExpect`,
   `stepExpect` position exemption, control-role `judgeDown`); paired `press()`; native setup calls outside the gate.
2. Identity completeness excludes dynamic zone/custom/display operations; `commitClass` is caller-supplied;
   zone AF-ON releases lack identity approval; display approval is unconditional.
3. Inventory omits the identity table and seal; command records lack `process.execArgv`.
4. Unit tests target earlier versions (gate v2, compare v2, scanner v6) rather than the final ones; recorder
   integration orphans legitimate getters and stamps refreshes with a later sample.
5. The candidate AF-ON release identity was captured at the wrong moment; T8d proof and display A/B/K2/K1 unproven.

## Different approach (coordinator ruling)

Two rounds spent most emulator versions on harness defects found mid-experiment. The harness is therefore split off
and accepted **before** any emulator run: **T12** completes the harness in pure Node (zero emulator versions) against
a closed checklist (the five items above, as Sol stated them), and Sol must ACCEPT it. **T13** then runs the proofs on
the frozen accepted harness, with no harness edits permitted. Sol reviews T12 against that checklist; new findings
outside it are reported and ruled on by the coordinator rather than added to the checklist automatically.

## Status

`CLOSED-PARTIAL`. Evidence stays in `tasks\T11-afon-acceptance-harness\run-20261119-223109\`.
