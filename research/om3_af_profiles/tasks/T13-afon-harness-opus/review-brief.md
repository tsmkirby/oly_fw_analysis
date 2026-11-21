# T13 design review brief (Codex Sol, read-only)

The owner decided (2026-11-20) that Opus writes the acceptance harness directly, Grok only runs it, and you review
both. The acceptance bar is unchanged.

## Read

- `work/design.md`, `work/result.md`, `work/perm-probe/`.
- The decisions and your reviews for T11, T12 and T12b (under `ref\tasks\T11-afon-acceptance-harness\`,
  `ref\tasks\T12-afon-harness-completion\`, `ref\tasks\T12b-afon-harness-by-capability\`), and the T11 brief.

## Check

1. For **every** required correction in your six T11/T12/T12b reviews, state whether the design closes it, leaves it
   open, or makes it inapplicable (with the reason). Give a table.
2. Is the two-layer expectation scheme (§3) acceptable as "each field equals a declared value with a single source
   or explicit preservation", and is it non-circular for the behavioural claims? If not, what would be?
3. Does the permission-model approach close the read-inventory and freeze-enforcement classes? Name any read or load
   path it would not cover, and any way the launcher/child split could be bypassed.
4. Anything in the design that would make a T13 proof invalid, or a requirement missing from §3.2.

## Rules

Read-only. Use PowerShell. Do not run Ghidra or OM-Emu. Use the structure of `templates\review.md`; for the verdict
use ACCEPT-DESIGN, ACCEPT-DESIGN-WITH-CHANGES (list them), or REJECT-DESIGN.

## Round 2

Review `work/design_v2.md` against your previous review (`audit/previous-review.md`). For each of its seven required
corrections, and for each row you marked Open in its table, report CLOSED / OPEN / INAPPLICABLE with the reason. Then
the same verdict options. Apply the threat model of design_v2 §0 (mistakes, not malicious code) unless you find it
inconsistent with a stated requirement; if so, cite the requirement.

## Round 3: implementation (code) review

This round supersedes the Read/Check lists above. Opus has implemented the accepted design. Under review:
`work/result.md` (implementation result; the design-stage result is `work/result-design-r2.md`), every file in
`work/harness/`, `work/freeze/freeze_v1.json`, `work/out/` (test, freeze-maker and fake-run records with commands,
stdout, stderr and exit), and `work/evidence-manifest.json`. Your round-2 design review is `audit/previous-review.md`
(round 1 is `audit/review-round1.md`). External freeze digest (recorded by Opus outside the workspace):
`8aef677471b5a2c148521fd7654ab780bd3bc638045f1f89627c614da36b189f`.

Check:
1. For each of the six required corrections of your round-2 review: DONE / NOT DONE / WRONG, with the file and the
   test that shows it.
2. Fidelity of the real path to the accepted sources: `real_v1.mjs`, `session_v1.mjs` (+ `session_v1.diff` against
   `ref\analysis\button-af\readiness\t5-afon-button-handoff\scripts\zone_session_k1.mjs`) and `plan_v1.mjs`, against
   T12 `drive_v12.mjs`, `display_v5.mjs`, `setup_v2.mjs`. Payloads, idle times, order, roles, hook selection,
   overlays, recorder categories. Name every difference that could change emulator behaviour.
3. `relations_v1.mjs` against `table_v2.mjs` and `display_v5.mjs`: is each relation a faithful port, is anything
   missing, is anything circular? Judge the deviations listed in `work/result.md` item 12, and the two T11-derived
   findings (item 6.2).
4. The boundary: launcher, child, inventory, freeze, exit checks. Any accidental way a run could be marked `ok:true`
   or `valid:true` without the plan completing on the real adapter under the freeze; any read or load interface
   still unrecorded; any inconsistency between grants, recorded reads and exit verification.
5. The tests: do they test what they claim, on the final versions? Anything required by design_v2 §6 or the review
   not tested?
6. Whether the harness is ready for the Grok run-only stage (six processes, result item 11), or what must change.

Rules: read-only. You may run the pinned Node (`node26`) only for commands that write nothing (for example
`node26 --input-type=module -e "..."` that imports `work/harness/fixture_t11_v1.mjs` and prints). Do not run
`test_v1.mjs`, `launch_v1.mjs`, `make_freeze_v1.mjs` or anything that starts OM-Emu. Verdict: ACCEPT-CODE,
ACCEPT-CODE-WITH-CHANGES (numbered, minimal), or REJECT-CODE, in the structure of `templates\review.md`.

## Round 4: implementation v2 (code correction round)

This round supersedes round 3. Your round-3 code review (REJECT-CODE) is `audit/previous-review.md`; the design reviews
are `audit/design-review-round1.md` and `audit/design-review-round2.md`. Under review: `work/result.md` (v2), the v2
files in `work/harness/` (`*_v2.mjs`, `fixture_t11_v2.mjs`, `session_v2.diff`; v1 files are unchanged and are not
used by v2), `work/freeze/freeze_v1.json`, `work/out/`, `work/test-scratch/v2-final/`, `work/evidence-manifest.json`.
The v1 submission you reviewed is kept under `work/superseded-3/`. External freeze digest:
`282fc757ba3421d950fb45e7a652e894b591b2bdfddbfe0edfdb33f371187a04`.

Check:
1. For each of your seven round-3 required corrections: DONE / NOT DONE / WRONG, with file and test.
2. Whether any change introduced a new defect, a fidelity loss against `drive_v12.mjs` / `display_v5.mjs` /
   `setup_v2.mjs`, or an inconsistency in the boundary (grants, recorded reads, exit checks).
3. The new deviation (`cp` refused) and the sampling consequence in result item 10.6.
4. Whether the harness is ready for the Grok run-only stage (six processes, result item 11).

Rules as round 3 (read-only; `node26` only for commands that write nothing; do not run `test_v2.mjs`,
`launch_v2.mjs`, `make_freeze_v2.mjs` or anything that starts OM-Emu). Verdict: ACCEPT-CODE,
ACCEPT-CODE-WITH-CHANGES (numbered, minimal), or REJECT-CODE.

## Round 5: implementation v3 (minimal corrections)

This round supersedes round 4. Your round-4 review (ACCEPT-CODE-WITH-CHANGES) is `audit/previous-review.md`; your
round-3 code review is `audit/code-review-round1.md`. Under review: the "v3 addendum" at the top of `work/result.md`,
the v3 files (`inventory_v3`, `run_v3`, `exitcheck_v3`, `launch_v3`, `make_freeze_v3`, `probe_v3`, `test_v3`), and
the regenerated `work/freeze/freeze_v1.json`, `work/out/`, `work/test-scratch/v3-final/`, `work/evidence-manifest.json`.
v2 as reviewed is in `work/superseded-4/`. External freeze digest:
`819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b`.

Check: each of your three round-4 required corrections (DONE / NOT DONE / WRONG); that v3 introduced no new defect
or inconsistency (including the additional refusal of callback `fs.realpath`); and readiness for the Grok run-only
stage. Rules as round 3 (do not run `test_v3.mjs`, `launch_v3.mjs`, `make_freeze_v3.mjs` or OM-Emu). Verdict:
ACCEPT-CODE, ACCEPT-CODE-WITH-CHANGES, or REJECT-CODE.

## Round 6: results of the Grok run-only stage

Grok ran `run-20261120-225658` (run-only brief `brief.md`). One process was started and failed; Grok stopped as the
brief requires. Under review: `work/result.md` (Grok's run report), `work/evidence-manifest.json`,
`work/out/t13-identity/` and `work/out/t13-identity.launch/`, and the audit files. The accepted code is v3 (your
round-5 review, `audit/previous-review.md` is round 4; round 5 is
`ref\tasks\T13-afon-harness-opus\run-20261120-224009-review\review.md`).

Check:
1. Did the run follow the brief (one process, no edits, stop rule, report accuracy)? Do the records support Grok's
   findings, in particular that k1e, k2, candidate, zk1e and zcand completed every operation with zero failing
   relations and both writer counts passed, before `disp-seed-a` failed during its `lever` setup operation?
2. **Cause (static, read-only).** The fault is a NavError in the 400 ms idle after the `lever` setup operation of
   the first display session (`scpu command 0x20041001`, trap at `0xa2100007`). The T8d and zone sessions run the
   same setup operations and passed. Display sessions differ in: (a) T6 overlay with help/rowLabel off; (b) the
   refresh recorder (`refresh_v4`, observer on `0x61184dd6` with return hooks) and the combined hook with `onGetter`
   (return hooks on every passthrough getter site) installed before bring-up; (c) a boundary-frame sample before and
   after every setup operation (`requireFrame`); (d) no pose path. The real T9d display runs
   (`ref\tasks\T9d-afon-display-size-inputs\run-20261119-202459\work\scripts\obs_seed_t9d.mjs`, `lib_valid_t9d.mjs`
   `prepare`) used (a) and (d) but did bring-up and the lever before installing any display hook and without frame
   sampling. Which differences can plausibly cause this fault, and what is the minimal correction faithful to the
   runs that actually worked on the emulator?
3. Anything else in the records that a correction must address.

Rules as round 3 (read-only; no test, launcher, freeze maker or OM-Emu). Verdict: ACCEPT-RUN (the proof stands),
REJECT-RUN with the required corrections (numbered, minimal), or ESCALATE.

## Round 7: implementation v4 (correction after REJECT-RUN)

Your results review (REJECT-RUN) is `audit/previous-review.md`; your v3 code acceptance is
`audit/code-review-round3-accept.md`. Under review: `work/result.md` (v4), the new files `plan_v2`, `gate_v3`,
`exec_v3`, `real_v3`, `fake_v3`, `run_v4`, `exitcheck_v4`, `launch_v4`, `make_freeze_v4`, `test_v4`, and the
regenerated `work/freeze/freeze_v1.json`, `work/out/`, `work/test-scratch/v4-final/`, `work/evidence-manifest.json`.
The failed run and v3 records are preserved in `work/superseded-5/`. External freeze digest:
`4975d34d3d96930a2f570d2988b9a6cea5e32b1e8e51cd74f787a166982c3b0e`.

Check: each of your three required corrections (DONE / NOT DONE / WRONG); whether the passive-frame, assertion-getter
and return-site handling are sound against the OM-Emu and accepted-hook sources; whether T8d/zone behaviour is
unchanged; the declared setup-frame coverage change and wait reconciliation; and readiness for a new run-only stage.
Rules as round 3. Verdict: ACCEPT-CODE, ACCEPT-CODE-WITH-CHANGES, or REJECT-CODE.
