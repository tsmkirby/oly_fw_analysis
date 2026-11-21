# T13 result (Opus): harness implementation v3 (minimal corrections after run-20261120-223058-review)

## v3 addendum (supersedes the v2 run records below; the v2 analysis still applies)

Code review `run-20261120-223058-review` returned ACCEPT-CODE-WITH-CHANGES with two required corrections plus the
re-run. The v2 submission as reviewed is kept in `work/superseded-4/`.

1. **Glob recording (correction 1, `OBSERVED`).** `inventory_v3` refuses `glob`, `globSync` and `fs.promises.glob` in every form, because pattern arrays and `cwd` made the searched paths unrecordable. The harness and OM-Emu session never use them.
   - **Callback realpath also refused.** The callback `fs.realpath` is now refused too, because the v3 probe found it denied on ancestors above the grant. Nothing uses it. `fs.realpath.native`, `realpathSync`, `realpathSync.native` and `fs.promises.realpath` stay recorded.
   - **Probe coverage.** `probe_v3` adds retained successful-recording assertions for:
     - `readlinkSync`, the callback `readlink` and `promises.readlink` (on junctions);
     - callback `realpath.native`;
     - callback `statfs` and `promises.statfs`;
     - callback `exists`, `lstat` and `opendir`.
     It adds refusal assertions for the glob scalar, array, callback and promise forms, and for callback realpath.
2. **Refusal folder (correction 2, `OBSERVED`).** `launch_v3` checks `work/out/_refusals` like `work/out` before writing a refusal record: it must be a plain directory at its real path. Otherwise the refusal goes to stderr only and the launcher exits 2. Test: an existing tag with `_refusals` redirected through a junction writes nothing through the redirect.
3. **Re-run (correction 3).** New versioned files `inventory_v3`, `run_v3`, `exitcheck_v3`, `launch_v3`, `make_freeze_v3`, `probe_v3` and `test_v3`. All other v2 modules are unchanged and still used. Results:
   - **Tests:** `node26 work/harness/test_v3.mjs v3-final`: 43/43 PASS, and the tested-source fingerprints equal the submitted files.
   - **Freeze:** `make_freeze_v3` gave `819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b` (456 files).
   - **Fake plans:** all six pass through `launch_v3` with `ok:true` and `valid:false`, and the operation and relation counts are the same as v2. The real proof given the fake identity is refused.
   - **Records:** `work/out/cmd/`, `work/test-scratch/v3-final/` and `work/evidence-manifest.json`.
4. **Sampling note (optional improvement adopted; clarifies v2 item 10.6).** On the emulator, each display edge's settle now ends at the last 25 ms step at or before 599.6 ms (about 575 ms). The next edge is therefore delivered about 25 ms earlier in lab time than under display_v5, which changes subsequent input timing as well as the judged sample.
5. **Grok stage commands:** as v2 item 11 below, with `launch_v3.mjs` and `--freeze-sha 819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b`.

## v2 result (as reviewed)

1. **Task identifier and brief version used:**
   - **Task:** T13-afon-harness-opus, implementation correction round.
   - **Design:** `work/design_v2.md` (ACCEPT-DESIGN-WITH-CHANGES, `run-20261120-185413-review`).
   - **Code review being answered:** `run-20261120-221318-review` (REJECT-CODE, seven required corrections).
   - **Earlier versions kept:** the v1 implementation as reviewed (result, manifest, freeze `8aef6774…189f`, run records) is in `work/superseded-3/`; earlier freezes are in `superseded-1/2`; the design-stage result is `work/result-design-r2.md`.
   - **Scope:** EMULATOR-ONLY. Owner decision 2026-11-20: Opus writes the harness, Grok only runs it.

2. **Research baseline used:** as v1 (accepted T12/T12b/T5 sources, T11 identity-v10 records, T9d references, OM-Emu pins `4e4ec4ef…` / `61cd1327…7702`, PRIOR). No emulator, Ghidra or Java was started. The pinned Node v26.12.1 ran the tests, the probe, the freeze maker and the fake plans only.

3. **Work performed:**
   1. New versioned files for every changed module; v1 files are unchanged and stay in `work/harness/`:
      - `launch_v2`, `run_v2`, `inventory_v2`, `exitcheck_v2`, `exec_v2`, `gate_v2`, `relations_v2`;
      - `real_v2`, `fake_v2`, `session_v2` + `session_v2.diff`;
      - `make_freeze_v2`, `probe_v2`, `test_v2`, `fixture_t11_v2`.
   2. Tests: `node26 work/harness/test_v2.mjs v2-final`. Scratch output is under `work/test-scratch/v2-final/`; that folder is kept and includes the probe's command, stdout, stderr and inventory.
   3. Freeze: `node26 work/harness/make_freeze_v2.mjs freeze-cap` gave `282fc757ba3421d950fb45e7a652e894b591b2bdfddbfe0edfdb33f371187a04` (449 files).
   4. Six fake plans through `launch_v2` under that freeze, plus one real-mode proof that must be refused.

   Every command, with its stdout, stderr and exit, is in `work/out/cmd/`.

4. **Files examined:** as v1, plus Node v26.12.1's `fs` and `fs/promises` function lists (all classified, finding 2).

5. **Files created:** the files above, `work/freeze/freeze_v1.json` (format version 1, the v2 content), `work/out/**`, `work/test-scratch/v2-final/**`, and `work/superseded-3/`.
   - `work/evidence-manifest.json` lists every source, output and command. Its inputs now include the T11 fixture files and the accepted sources the tests compare against.
   - `testedSourcesMatchFinal: true`: the SHA-256 of every harness file at test start equals the submitted file.

6. **Findings (the code review's required corrections):**
   1. **Correction 1, display pose path (`OBSERVED`, pure Node).** `real_v2` installs `attachPose` only for the T8d and zone roles (drive_v12), so display roles, including stock K1, get no pose hooks (display_v5). Construction is injectable (`driveSession(..., deps)`, `constructionOf`). The test builds all nine sessions with stub dependencies and checks:
      - `attachPose` is installed once for non-display roles and never for display roles;
      - the hook is installed exactly for the hooked roles, and the recorder exactly for display roles;
      - no native call is made during construction.
   2. **Correction 2, read and load recording (`OBSERVED`).** `inventory_v2` classifies every function of `fs` and `fs/promises` on the pinned runtime; the test asserts none is unclassified, and any unclassified function would be refused.
      - **Classes:** content (hashed), descriptor, metadata/listing (path recorded), write, refused.
      - **Refused:** `openAsBlob(Sync)`, `watch`, `watchFile`, `fs.promises.watch`, `cp`, `cpSync`, `fs.promises.cp`. `cp` was moved from content to refused because under the permission model `promises.cp` needs read access on the destination's grandparent (probe), and neither the harness nor the OM-Emu session uses it.
      - **Pre-install reads.** The nonce and the freeze are read before installation and recorded as `preread` entries with the SHA-256 of the consumed bytes. The child also checks the freeze bytes against `--freeze-sha`.
      - **Extension consumption.** The freeze is now a per-run extension input. The exit check requires every extension input (nonce, freeze, identity files) to appear as consumed with its hash.
      - **Probe.** `probe_v2` exercises 19 content forms, 19 metadata/listing forms (async, sync and promise variants, `realpathSync.native`, `statfs`, `glob`), a preread, and 14 refused or denied forms. Each permitted form has its own target, and the test requires each target's own entry with path, length and hash (content) or path (metadata). Probe evidence is kept under `work/test-scratch/v2-final/probe-out/`.
   3. **Correction 3, refresh records (`OBSERVED`, fake).** `exec_v2` writes `refresh-<session>.jsonl` for every display session:
      - every window with its getter calls, returns and substitutions;
      - outside calls with categories;
      - orphans;
      - timestamped samples;
      - an end record with counts.
      The completion lists each record's SHA-256 and counts. `exitcheck_v2.checkRefreshFile` refuses the run unless:
      - the record is present, listed and matches its hash;
      - its counts agree with the end record and the completion;
      - every window is closed and stamped with an in-window sample, and every call has a return;
      - there are no orphans, every outside call is categorised and returned, and there is at least one window and one call.
      The launcher requires one record per recorder session of the plan.
   4. **Correction 4, redraw deadline (`OBSERVED`, fake).** The settle window samples only while `t + 25 ms ≤ t0 + bound` and returns every sample time. `relations_v2.judgeDisplayEdge` requires at least one sample, every sample within `t0 + bound`, and the judged frame to be the last sample. Tests:
      - a redraw that appears only after the bound (`lateRedraw`) fails;
      - sampling past the bound (`sampleLate`) fails;
      - a hand-built settle with a 600 ms sample against a 599.6 ms bound fails;
      - every edge in the retained display-a log has all samples within the bound.
   5. **Correction 5, display frame holds (`OBSERVED`, fake).** The display plant, hold and seed relations hold the frame again, as display_v5's `plantExpect`, `holdAll` and `mirrorHeadExpect` did. A frame that changes on a setter write (`frameOnSet`) fails the identity pass on the first plant operation. v1 deviation 12.2 is withdrawn.
   6. **Correction 6, output root (`OBSERVED`).** `launch_v2.checkOutputRoot` runs before anything is written. `work` and `work/out` must be plain directories whose real paths are the workspace's own, and the new child and launch directories are checked the same way. Test: with `work/out` replaced by a junction, the launcher exits 2 and writes nothing through the redirect.
   7. **Correction 7, housekeeping.** New versioned names; test scratch under `work/`; tested-source fingerprints and fixture inputs retained; the freeze, manifest and external digest regenerated. Corrected v1 claims:
      - "all fs read forms" was false (now every function is classified, with refusal for the rest);
      - v1's NVRAM saves kept only metadata; `session_v2` keeps a copy of each payload;
      - readiness is claimed only for review.
      Optional improvement adopted: the exit check requires the selected adapter's modules (real: `real_v2`, `session_v2`; fake and capture: `fake_v2`) and refuses the other adapter's modules.
   8. **Run results (`OBSERVED`).** 42/42 tests PASS. Under freeze `282fc757…7a04`, all six fake plans pass through launcher and child with `ok:true`, `valid:false`, mode `fake`:
      - **identity:** 432 operations, 1830 relations, four refresh records (97 windows each);
      - **proof:** 324 operations reproduced, 1096 relations;
      - **displays:** 29 / 29 / 28 / 22 operations, 200 / 200 / 191 / 143 relations, one refresh record each.
      A real-mode proof given the fake identity is refused before spawn.

7. **Evidence for each claim:**
   - **Finding 1:** test "code review 1".
   - **Finding 2:** tests "code review 2" (classification; interfaces; nonce and freeze consumed) and `work/test-scratch/v2-final/probe-out/`.
   - **Finding 3:** test "code review 3" and `work/out/fake-display-*/refresh-*.jsonl`.
   - **Finding 4:** test "code review 4".
   - **Finding 5:** test "code review 5".
   - **Finding 6:** test "code review 6".
   - **Finding 7:** `work/evidence-manifest.json`, `work/out/cmd/test-results.json` (`fingerprints`, `fixtureInputs`).
   - **Finding 8:** `work/out/cmd/*`, `work/out/*.launch/exit.json`.

8. **Tests and outcomes:** 42 PASS (`work/out/cmd/test.stdout.txt`, `test-results.json`, exit 0). All v1 tests are kept against the v2 modules, and the 7 new ones cover the code review's corrections.

   | Code review correction | Status | Where |
   |---|---|---|
   | 1 pose path only where accepted; construction test | done | `real_v2.mjs` `constructionOf`, `driveSession`; test "code review 1" |
   | 2 complete or refuse every interface; nonce and freeze recorded; per-interface probes retained | done | `inventory_v2.mjs`, `run_v2.mjs`, `exitcheck_v2.checkEntries`; tests "code review 2" ×3 |
   | 3 persist full refresh records and require them | done | `exec_v2.mjs`, `exitcheck_v2.checkRefreshFile`, `launch_v2.mjs`; test "code review 3" |
   | 4 deadline from actual sample times; late frame fails | done | `real_v2`/`fake_v2` `settleWindow`, `relations_v2.judgeDisplayEdge`; test "code review 4" |
   | 5 restore display frame holds | done | `exec_v2.judgeOpRelation`; test "code review 5" |
   | 6 canonical output ancestors; redirected `work/out` refused | done | `launch_v2.checkOutputRoot`; test "code review 6" |
   | 7 versions, reruns, freeze, manifest, digest, scratch under work, fingerprints, claims | done | items 3, 5, 6.7 |

9. **New versus previously established:**
   - **Findings 1–7:** answer the code review.
   - **The cp behaviour in finding 2:** new.
   - **The T11-derived flag and title findings:** unchanged from v1, and confirmed by the review.

10. **Remaining uncertainties:** the same as v1, with one addition (item 6).
    1. **Determinism.** Exact equality of every field between the identity pass and the proof on the emulator.
    2. **Permission model on the real session.** Untested; a read outside the freeze fails visibly.
    3. **Duration.** How long the real runs take.
    4. **Undeclared fields.** Fields table_v2 seals or does not name are covered by reproduction only.
    5. **Press reference.** The AF-ON press reference is K1e S1 down halfTarget (T14 conclusion (c)).
    6. **Sampling change.** Display sampling now stops at the last 25 ms step within 599.6 ms, so the last sample is at about 575 ms after the edge, where display_v5 judged one at about 600 ms. A redraw that real hardware completes between 575 and 600 ms would now fail. That is the stricter reading of the bound the review asked for.
    7. **T9d non-blocking items:** unchanged.

11. **Recommended next actions:** Sol code review of v2. If it is accepted, Grok runs the six processes in order and stops at the first failure:
    1. `node26 work/harness/launch_v2.mjs identity t13-identity --freeze-sha <F>`
    2. `node26 work/harness/launch_v2.mjs proof t13-proof --freeze-sha <F> --identity t13-identity`
    3. the same command for `display-a`, `display-b`, `display-k2` and `display-k1`, each with `--identity t13-identity`.

    Then Sol reviews the results.

12. **Deviations from design_v2:**
    - **v1 deviations kept:** 12.1 (cross-role identity on screen and highlight), 12.3 (failing link read-back instead of relinking), 12.4 (every commit-key edge is a commit), 12.5 (mount resolve hook; directory grants), 12.6 (OM-Emu folders frozen), 12.7 (`state_v1` reused), 12.8 (setup operations reproduction-sealed).
    - **v1 deviation 12.2:** withdrawn.
    - **New:** `cp`, `cpSync` and `fs.promises.cp` are refused interfaces (finding 2).
