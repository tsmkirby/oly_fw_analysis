# T13 result (Opus): harness implementation, for code review

1. **Task identifier and brief version used:** T13-afon-harness-opus, implementation stage. Design: `work/design_v2.md`
   (ACCEPT-DESIGN-WITH-CHANGES, review `run-20261120-185413-review`, six required corrections). Owner decision
   2026-11-20: Opus writes the harness, Grok only runs it, Sol reviews both. EMULATOR-ONLY throughout. The
   design-stage result is kept as `work/result-design-r2.md`.

2. **Research baseline used:** design_v2 and the round-2 review; accepted T12 sources `drive_v12.mjs`, `display_v5.mjs`,
   `setup_v2.mjs`, `gate_v5.mjs`, `state_v1.mjs`, `expect_v3.mjs`, `identity_v4.mjs`, `table_v2.mjs`,
   `check_table_v3.mjs`, `refresh_v4.mjs`, `afon_hooks_v7.mjs` (promoted under
   `ref/analysis/button-af/readiness/t12-afon-harness-completion/harness/`); T12b `operations_v2.mjs`, `gate_v6.mjs`;
   T5 `zone_session_k1.mjs`; T11 identity-v10 records (`ref/analysis/button-af/readiness/t11-afon-acceptance-harness/out/`);
   T9d references. OM-Emu pins (PRIOR, PROJECT-STATE): `4e4ec4ef…`, local diff `61cd1327…7702`. No emulator, Ghidra
   or Java was started. The pinned Node v26.12.1 ran the tests, the probes and the fake plans only.

3. **Work performed:**
   1. Ported the table_v2 field rules and display_v5 routing to `relations_v1.mjs`. Evaluated them on the 80 retained
      T11 identity-v10 emulator operation records before writing anything else (§6 claim 1).
   2. Wrote the plans as data, the gate, the reproduction layer, the executor, the fake, the session derivation and
      real adapter, the launcher, the child, the inventory, the freeze verifier and maker, and the exit checks.
   3. Ran the test suite (`work/out/cmd/test.*`), then the freeze maker on this workspace (`work/out/cmd/make-freeze.*`).
   4. Ran all six plans through the launcher on the fake under that freeze, and one real-mode proof that must be
      refused (`work/out/cmd/fake-*`, `real-refused-proof.*`).
   5. Two earlier freezes are kept under `work/superseded-1/` and `work/superseded-2/`, each with a NOTE explaining why
      it was replaced. Neither is an input to anything.

   Commands are listed verbatim in `work/out/cmd/*.cmd.txt`, with their stdout, stderr and exit files.

4. **Files examined:** the sources in item 2. OM-Emu session import closure (58 files from the twelve `runZone` roots):
   built-ins `crypto fs os path url worker_threads zlib` only; no `new Worker`, no `child_process`, no dynamic import
   (`worker_threads` is imported only for `threadId`/`isMainThread` in `checks/lib/coverage.mjs`).

5. **Files created:** `work/harness/` (26 files), `work/freeze/freeze_v1.json`, `work/out/**`, `work/result-design-r2.md`,
   and `work/evidence-manifest.json`, which lists every source, output, input and command with its SHA-256.

   | File | Role |
   |---|---|
   | `launch_v1.mjs` | only entry; tag checks, runtime, freeze, per-run extension, spawn, exit checks, `exit.json` |
   | `run_v1.mjs` | restricted child; self-checks before any non-built-in load; mount resolve hook; runs the plan |
   | `inventory_v1.mjs` | read/load recording (all fs read forms, descriptors, FileHandle, streams, ESM+CJS loads) |
   | `exitcheck_v1.mjs` | inventory chain, entry policy, completion record (shared by launcher and tests) |
   | `freeze_v1.mjs`, `make_freeze_v1.mjs` | freeze verification and grants; capture-mode freeze maker |
   | `common_v1.mjs` | constants, tag validation, output containment |
   | `plan_v1.mjs` | the six plans as frozen data, validator, expected operations, commit operations |
   | `gate_v1.mjs` | only delivery path; key-only commit class; presence before delivery; delivery guards |
   | `expect_v1.mjs` | §4.1 reproduction, preservation, source map fields |
   | `relations_v1.mjs` | §4.2 behaviour relations; the named AF-ON press reference |
   | `exec_v1.mjs` | interpreter; stops at the first failing operation; writes the identity table |
   | `seal_v1.mjs` | identity table and seal |
   | `session_v1.mjs` + `session_v1.diff` | derived from `zone_session_k1.mjs`; retained diff |
   | `real_v1.mjs` | real adapter (OM-Emu, accepted hook, state capture, recorder) |
   | `fake_v1.mjs` | toy camera adapter, not emulator evidence |
   | `test_v1.mjs`, `probe_v1.mjs`, `fixture_t11_v1.mjs` | tests, read-form probe child, T11 fixture evaluation |
   | `afon_hooks_v7.mjs`, `state_v1.mjs`, `predicates_v3.mjs`, `refresh_v4.mjs`, `table_v2.mjs`, `check_table_v3.mjs` | byte-identical T12 copies (test asserts SHA-256 equality) |

6. **Findings:**
   1. `DATA`: `relations_v1` evaluates 532 relations on the 80 T11 identity-v10 T8d operation records plus 7 zone press/release pairs, with 0 failures. The judge runs lenient there only because those records lack mirror71, sizeRecord, edge, readBank and slots.
   2. `DATA`: two rule details came from the real records, not the table text:
      - **Flag edge.** `flagClear: 'up'` means the down edge still shows the previous flag (candidate `e-ok-down` flag 1, `e-ok-up` 0). `flagClear: 'down'` clears on the down edge (`p-menu-down` 0).
      - **Release title.** The candidate AF-ON release title-band hash differs from K1e's S1 release title (`af-up` 1668…, `ke-s1-up` 19a0…; swapped for `p-af-up`/`ke-p-s1-up`), while screen and highlight agree.
      - The cross-role identity relation therefore compares screen and highlight; the title is reproduced per role (§4.1). T12's design keyed the candidate's commit rows to K1e's rows; on these records it would have failed `af-up`.
   3. `OBSERVED` (pure Node): 35/35 tests PASS (`work/out/cmd/test.stdout.txt`, `test-results.json`, exit 0).
   4. `OBSERVED` (pure Node, fake): under freeze `8aef677471b5a2c148521fd7654ab780bd3bc638045f1f89627c614da36b189f`, all six plans pass through launcher and child with `ok:true`, `valid:false`, mode `fake`:
      - **identity:** 432 operations, 1762 relations;
      - **proof:** 324 operations reproduced, 1096 relations;
      - **displays:** 29 / 29 / 28 / 22 operations.
      A real-mode proof given the fake identity is refused before spawn (`identity mode fake != real`; the child output directory stays empty).
   5. `OBSERVED` (pinned runtime): two permission-model facts.
      - **String-based grants.** A grant on a canonical path does not cover the same file read through the `ref` junction path, and vice versa. Grants therefore carry both forms.
      - **Junction realpath.** ES-module resolution of a relative import into the junction realpath-walks the junction and is denied under per-file grants. It is allowed only if the whole junction is granted.
      The child therefore maps imports under the declared mount to the canonical target (resolve hook, `run_v1.mjs` step 5) instead of widening the grant.
   6. `OBSERVED`: per-file grants for 520 files overflowed the Windows command line (`spawn ENAMETOOLONG`, `work/superseded-1/`). Files under a fully enumerated frozen directory are now covered by the directory grant only (`freeze_v1.mjs` `readGrants`).
   7. `INFERRED`: the real path is untested on the emulator, by the owner's role split. What has been checked without running it:
      - the real-path modules load;
      - the reused modules are byte-identical;
      - the session diff stays within the permitted areas;
      - the session import closure needs no worker, child process or dynamic import.

7. **Evidence for each claim:**
   - **1:** `test.stdout.txt` line 1; `fixture_t11_v1.mjs`.
   - **2:** `relations_v1.mjs` `flagWant` and `judgeIdentityFrom`; the T11 jsonl lines `candidate-e-ok-down/up`, `candidate-af-up-identity`, `k1e-ke-s1-up-identity`.
   - **3:** `test-results.json`.
   - **4:** `work/out/*.launch/exit.json`, `work/out/cmd/fake-*.*`.
   - **5:** test "correction 2" (per-file grants under the junction-free probe); the junction behaviour was probed by Opus in a scratch directory during implementation (not retained in `work/`) and is exercised by every launcher run, which imports through the `ref` junction under per-file grants.
   - **6:** `work/superseded-1/out/fake-identity.launch/exit.json`.
   - **7:** tests "real-path modules load", "reused modules are byte-identical", "session_v1.diff …".

8. **Tests and outcomes:** all PASS (35). Mapping to the review's required corrections:

   | Correction | Implementation | Test(s) |
   |---|---|---|
   | 1 pose-after-edit: all live cells vs K2, mirror per role | `relations_v1.mjs` `pose-hold` branch; candidate mirror stays on `ref:k1e:p-menu:half->mirror` | "correction 1 …" (fixture mirrors differ by role and pass; a non-bank cell change fails) |
   | 2 complete early recording; positive probes | `inventory_v1.mjs`: wrappers for every read form; `syncBuiltinESMExports`; `registerHooks` load for ESM/CJS/createRequire; forbidden built-ins; unknown descriptors; re-entrancy guard; one entry per (kind, path) | "correction 2 …": 13 permitted forms each recorded with path, length and first-read hash; 8 refused forms refused; a missing allowed entry is reported by the exit check |
   | 3 fake-only capture; static freeze vs per-run extension; external digest; one policy | `launch_v1.mjs --capture` (bootstrap grants, `ok:false` always, `captureComplete`); `<tag>.launch/inputs.json` extension (nonce, identity files); `--freeze-sha` required (`freeze_v1.mjs` `loadFreeze`); grants, recorded reads and exit verification all use freeze ∪ extension (`exitcheck_v1.mjs`) | "scratch workspace … six capture runs", "wrong freeze digest", "capture identity for a fake proof", "real proof on fake identity" |
   | 4 tags, containment, disjoint outputs, completion record, preserve existing | `common_v1.mjs` `validateTag`/`outPaths`; child writes only `work/out/<tag>/`, parent only `<tag>.launch/`; `checkCompletion` requires exactly `expectedOps(plan)`, zero failed relations, the reproduction count, and the identity seal; an existing tag is refused into `_refusals/` without touching it | "tag validation", "existing tag; evidence preserved", "exit checks …", "abnormal child exit" |
   | 5 focus-arg separate, five bring-up operations | `plan_v1.mjs` `SETUP` (9 operations); `session_v1.mjs` `bringUpSteps`; `real_v1.mjs` setup (focus-arg value flows to focus-289) | "correction 5 …" |
   | 6 tests: unmarked commit, raw wrapper refusal, missing/truncated inventory, missing completion | `gate_v1.mjs` `classifyCommit` (key only), `guardDelivery` | "dynamic missing row … unmarked commit keys", "raw delivery wrappers refuse", "exit checks …" |

   Design §6 items also tested:
   - six plans on the fake;
   - commit refused with zero deliveries, both static (coverage) and dynamic (gate);
   - identity read after the input and its settle;
   - wrong value, changed field, absent field, preservation and title failures;
   - deletion removes execution and coverage together;
   - custom-zone reachability;
   - pose instrumentation toggles;
   - recorder: return-hook completion, substitution, categories, orphan, null, unclosed and in-window sampling;
   - plan validator;
   - launcher refusals: unlisted file, changed file, link, wrong runtime, missing identity seal, drift at exit;
   - child refusals: unrestricted start, wrong flags, `NODE_OPTIONS`, missing nonce;
   - initialization failure and abnormal exit both write a failing `exit.json`.

9. **New versus previously established:**
   - **Claims 1 and 2:** new; they confirm the table_v2 semantics, except that they contradict T12 identity_v4's cross-role title keying.
   - **Claims 5 and 6:** new.
   - **Claim 7:** confirms design_v2 §2.

10. **Remaining uncertainties:**
    1. **Determinism.** Identity-pass versus proof determinism on the emulator: frames, titles and settle timing. §4.1 requires exact equality of every field.
    2. **Permission model on the real session.** All reads should fall inside frozen `om-emu/emu`, `unpacked`, `artifacts` and the listed real-only files. Untested; a read elsewhere fails visibly.
    3. **Duration.** How long the real identity run takes.
    4. **Undeclared fields.** Fields table_v2 marks `seal`, or does not name (for example halfTarget on the AF-ON press), are covered by reproduction only. That shows reproducibility, not independent correctness (design_v2 §4.2).
    5. **Press reference.** The AF-ON press reference is K1e S1 down halfTarget (`AFON_PRESS_REFERENCE`). T14 found conclusion (c), so this is not yet shown to equal stock AF-ON.
    6. **T9d non-blocking items** (template getter input; producer `0x610c8b66`) unchanged.

11. **Recommended next actions:** Sol code review. If it is accepted, Grok runs the six processes in order and stops at the first failure:
    1. `node26 work/harness/launch_v1.mjs identity t13-identity --freeze-sha <F>`
    2. `node26 work/harness/launch_v1.mjs proof t13-proof --freeze-sha <F> --identity t13-identity`
    3. the same command for `display-a`, `display-b`, `display-k2` and `display-k1`, each with `--identity t13-identity`.

    Then Sol reviews the results.

12. **Deviations from design_v2:**
    1. **Cross-role identity relation.** It compares screen and highlight only; the title is reproduced per role (finding 2).
    2. **Display relations.** The display plant, hold and seed relations do not hold the frame (display_v5 did); the frame is covered by §4.1. Reason: setter writes on the shooting screen can redraw the AF frame, and display_v5's frame holds never ran on the emulator.
    3. **Pose relink.** T12's conditional relink operations after a pose are replaced by a link read-back relation that fails. This keeps plan coverage static.
    4. **Commit edges.** Every OK, MENU, S1 and AF-ON key edge is a commit in every session (T12 used table marks for S1/AF-ON in T8d sessions). Each one has a sealed identity row.
    5. **Child mechanics.** The child adds a mount resolve hook (finding 5), and frozen directories are granted as directories (finding 6).
    6. **OM-Emu freeze.** It covers `om-emu/emu`, `om-emu/unpacked`, `om-emu/artifacts` and the four top-level files. `.git`, `.github`, docs, tools and analysis are not granted.
    7. **State capture.** It reuses the T12 `state_v1.mjs` byte-identical, with edge and readBank added in `real_v1.mjs`, instead of a new state module.
    8. **Setup operations.** Their identity-pass validity rests on subject 0. Their values are reproduction-sealed, which is the T12b sealed setup-delta rule generalised by §4.1.
