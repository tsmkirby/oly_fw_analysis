# T12b result

1. **Task identifier and brief version used:** T12b, brief version 2026-11-20, file `brief.md` in this workspace. Section 0 was followed: no emulator, Ghidra, or Java; writes under `work/` only; new versioned names; accepted T12 bytes copied and left unchanged.

2. **Research baseline used:** T12 decision `ref/tasks/T12-afon-harness-completion/decision.md` (CLOSED PARTIAL). Sol reviews `ref/tasks/T12-afon-harness-completion/run-20261120-002500-review/review.md` and `ref/tasks/T12-afon-harness-completion/run-20261120-010959-review/review.md`. Start tree `ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/`. The OM-Emu tree was not executed and was not hashed as a research input. Input hashes that were verified are the accepted-copy hashes in section 7 and the inventory hashes recorded for every file the fake runners read, including `brief.md` via the manifest.

3. **Work performed:**
   - `node26 work/harness/test_harness_v1.mjs` exited 1. `--import work/harness/inventory_register_v5.mjs` is not a file specifier on Node 26, so the registrar never loaded and `work/out/cmd/unit-identity.json` was absent.
   - `node26 --import ./work/harness/inventory_register_v5.mjs work/scripts/inventory_probe_v1.mjs` with no tag wrote `work/out/inventory-init-exit.json` (`ok: false`, problem `T12B_INVENTORY_TAG is required`).
   - `node26 work/harness/test_harness_v2.mjs` exited 1. The identity-json check failed. `work/out/inventory-unit-identity-exit.json` from that run recorded `Maximum call stack size exceeded` because `readFileSync` re-entered the wrapped `openSync` before the path was marked. v5 was not edited.
   - `node26 work/harness/test_harness_v3.mjs` exited 0. Output `work/out/test-harness-v3.txt` has 79 PASS lines and no FAIL line. Registrar under test: `./work/harness/inventory_register_v6.mjs`.
   - Fake capture, `T12B_FREEZE_CAPTURE=1`, `T12B_FREEZE_ENFORCE` unset, `OM_EMU_NVRAM=off`, `--import ./work/harness/inventory_register_v6.mjs`:
     - tag `freeze-identity`: `work/scripts/run_identity_t13_v1.mjs` exit 0
     - tag `freeze-proof`: `work/scripts/run_proof_t13_v1.mjs` exit 0
     - tag `freeze-display-a`: `work/scripts/run_display_a_t13_v1.mjs` exit 0
     - tag `freeze-display-b`: `work/scripts/run_display_b_t13_v1.mjs` exit 0
     - tag `freeze-display-k2`: `work/scripts/run_display_k2_t13_v1.mjs` exit 0
     - tag `freeze-display-k1`: `work/scripts/run_display_k1_t13_v1.mjs` exit 0
   - `node26 work/scripts/write_freeze_v1.mjs` wrote `work/harness-freeze.json` with 20 files.
   - tag `freeze-proof-enforce`, `T12B_FREEZE_ENFORCE=1`, same proof runner: exit 0, `work/out/inventory-freeze-proof-enforce-exit.json` `ok: true`.
   - `node26 work/scripts/write_bad_freeze_v1.mjs` wrote `work/out/bad-freeze.json` (the freeze with `entry_v1.mjs` removed, 19 files kept).
   - tag `freeze-proof-refuse`, `T12B_FREEZE_ENFORCE=1`, `T12B_FREEZE_PATH=work/out/bad-freeze.json`: exit 1. Stderr: `refuse to start: missing C:/Dev/OM3-tasks/T12b-afon-harness-by-capability/ws/work/harness/entry_v1.mjs`.
   - `node26 work/scripts/build_manifest_v1.mjs` is the last command, run after this file.

4. **Files examined:** `TASK.md`, `brief.md`, `review-brief.md`, `templates/result.md`, the T12 decision, both T12 Sol reviews, and the T12 harness files that were copied. No disassembly. No emulator process.

5. **Files created:** All under `work/`. The complete list with SHA-256 and length is the `outputs` array of `work/evidence-manifest.json`, written after this file. Primary artifacts: `work/harness.md`, `work/result.md`, `work/harness-freeze.json`, `work/harness/` (accepted copies, `operations_v1.mjs`, `gate_v6.mjs`, `entry_v1.mjs`, `driver_v1.mjs`, `inventory_register_v6.mjs`, `inventory_hook_v5.mjs`, `test_harness_v3.mjs`), `work/scripts/` (six T13 runners, freeze writer, bad-freeze writer, manifest writer), and `work/out/` (unit output, identity seal, runner summaries, inventory exits, command records, seal).

6. **Findings:**
   1. DATA. The v3 unit test passed 79 checks and failed none (`work/out/test-harness-v3.txt`).
   2. DATA. Accepted hook, predicates, state, table, compare, and recorder bytes match the T12 copies (hashes in that test output).
   3. DATA. A planted runner cannot obtain the session. The retained message is `planted runner failed to obtain the session`.
   4. STATIC. Runners and the driver import the harness entry plus allow-listed Node built-ins. The driver iterates `gate.operations()`.
   5. DATA. An identity JSON under `work/out/` is inventoried and re-hashed; a file changed between read and exit fails; a missing tag and an init failure each write a failing exit record.
   6. STATIC. Exit handlers in `inventory_register_v6.mjs` are installed before the tag check. The path is marked before the read so the wrapped `openSync` does not re-enter.
   7. DATA. Six T13 runners finished on the fake under that registrar. Their inventory exits are `ok: true`. The freeze has 20 files. Enforce on the proof runner passed. A freeze missing `entry_v1.mjs` refused the start.
   8. DATA. One `OPERATIONS` array feeds execution, coverage, and identity specs. Deleting `setup-lever` removes it from all three together.
   9. DATA. A fake setup that sets `flag` to 7 is sealed; the proof passes on 7 and fails on 9. The identity runner sealed 25 setup deltas and 145 rows. The proof runner completed 372 operations against that seal (`work/out/proof-t13-v1.json`).
   10. DATA. `createReal` refuses. No OM-Emu, Ghidra, or Java process was started. The T13 runners ran on the fake only.

7. **Evidence for each claim:**
   1. `work/out/test-harness-v3.txt` (79 lines beginning `PASS`, no line beginning `FAIL`). Command record `work/out/cmd/unit-v3.json`.
   2. The six `PASS byte copy` lines in that file, and the source files under `work/harness/`.
   3. `PASS planted runner cannot obtain the session` in that file. Planted source `work/harness/planted_runner_v1.mjs`. Handle construction `work/harness/entry_v1.mjs` (`Object.create(null)`).
   4. `PASS runners and driver import only the entry` and `PASS driver iterates gate.operations` in that file. `work/harness/driver_v1.mjs` lines 7–11. Runner files `work/scripts/run_*_t13_v1.mjs`.
   5. `work/out/inventory-unit-identity-exit.json`, `work/out/inventory-unit-changed-exit.json`, `work/out/inventory-init-exit.json`, `work/out/inventory-unit-init-exit.json`, and the matching PASS lines in the v3 test output.
   6. `work/harness/inventory_register_v6.mjs` lines 249–263 (handlers) and line 292 (tag read). `PASS exit handler is installed before the tag check` in the v3 output. v5's failing notes remain in the earlier inventory exits as the reason v6 exists.
   7. `work/out/inventory-freeze-identity-exit.json`, `inventory-freeze-proof-exit.json`, `inventory-freeze-display-a-exit.json`, `inventory-freeze-display-b-exit.json`, `inventory-freeze-display-k2-exit.json`, `inventory-freeze-display-k1-exit.json` (each `ok: true`). `work/harness-freeze.json`. `work/out/inventory-freeze-proof-enforce-exit.json` (`ok: true`). `work/out/inventory-freeze-proof-refuse-exit.json` problem text as in section 3. Hook check `work/harness/inventory_hook_v5.mjs` lines 54–58.
   8. `work/harness/operations_v1.mjs` line 261 and `coverageIds` / `identitySpecs` at lines 263–280. Group counts and the three `deleting a definition` PASS lines in the v3 output.
   9. `PASS identity pass seals the observed setup delta`, `PASS proof passes on the sealed setup change`, and `PASS proof fails on a different setup change` in the v3 output. `work/out/identity-t13-v1.json` (`rows`, `setupDeltas`). `work/out/identity-t13-v1.seal.json`. `work/out/proof-t13-v1.json`. Display counts in `work/out/display-a-t13-v1.json`, `display-b-t13-v1.json`, `display-k2-t13-v1.json`, `display-k1-t13-v1.json`. Gate order `work/harness/gate_v6.mjs` `classifyCommit` (line 10) and `perform` (presence before delivery at line 59, identity after settle at line 86).
   10. `work/harness/entry_v1.mjs` line 73. `PASS real session is refused` in the v3 output. Successful runner exits record `OM_EMU_NVRAM: off`. The enforce exit records `OM_EMU_MODEL: E147` because `runRunner` sets that variable; it does not start a process.

8. **Tests and outcomes:**
   - PASS. `test_harness_v3.mjs` on the fake, exit 0.
   - FAIL, then replaced. `test_harness_v1.mjs` did not load the registrar. `test_harness_v2.mjs` ran registrar v5; the identity-json inventory failed closed on the re-entrant read. v5 was left as that run wrote it. v6 and v3 are the passing pair.
   - PASS. Six fake T13 captures, inventory `ok: true`.
   - PASS. Proof enforce against `work/harness-freeze.json`.
   - PASS. Proof refuse against `work/out/bad-freeze.json` (exit 1, failing exit record).
   - BOUNDARY. The fake setup deltas are flag values written by the fake, and the freeze does not contain OM-Emu modules. Both are stated in `work/harness.md`. They are the boundary of this task, which forbids starting the emulator.

9. **New versus previously established:**
   1. New for T12b. Confirms the T12 decision that the deny-list scanner, the path-excluding inventory, the hand-picked freeze, and the separate operation lists were not accepted.
   2. Confirms T12 decision "Accepted" for the hook, predicates, state, table, full-value compare, and the recorder.
   3. New. Replaces the T12 scanner.
   4. New. Replaces separate runner imports of the session.
   5. New. Replaces the T12 inventory that excluded `/work/out/` and checked the tag before installing handlers (second Sol review).
   6. New. Required to make the wrap actually hash the first read on Node 26.
   7. New. Replaces the T12 freeze that used a load-only branch and a preload list.
   8. New. Replaces `identity_v4` zone and display lists and `ops_v1` `declaredOperationIds`.
   9. New. Replaces the T12 setup check that ran on a fake whose setup did not change state.
   10. Confirms brief section 0 and section 2: emulator proof, persistence, Subject Detect On, packaging, and hardware stay out of scope.

10. **Remaining uncertainties.** The two T9d items stay unresolved and non-blocking: the mode-selecting getter input, and the producer of `0x610c8b66`. This freeze covers the six fake runners. A later emulator import is outside it and would be refused until a freeze is taken from that run. `module.register` on Node 26 prints a deprecation warning; the hook still recorded loads and refused the bad freeze. No `audit/` directory was written; the low-integrity workspace allows writes under `work/`, and the retained records are there.

11. **Recommended next actions.** Keep the accepted bytes and the single operation module. Take any future freeze from a complete run of the runners that will actually load, under the same registrar. Leave the two T9d items to their own task. No storage decision. No hardware step.

12. **Deviations from the brief:** none. Registrar v5 failed its first run and was superseded by v6 under a new name, which is the versioning rule in section 0. The checklist items were met with v6, the v3 unit test, and the fake runner outputs above.
