# T12b result

1. **Task identifier and brief version used:** T12b, brief version 2026-11-20. Brief SHA-256 `55442058022bb048fb8f821312a02ada7ae7e285f45c114580d1b4217cbda347` (6924 bytes).

2. **Research baseline used:** `brief.md` (sections 0, 1, and 3), `TASK.md`, `templates/result.md`, `audit/previous-review.md`, the T12 decision at `ref/tasks/T12-afon-harness-completion/decision.md`, and the accepted T12 harness in `ref/tasks/T12-afon-harness-completion/run-20261120-003025/work/`. OM-Emu revision `4e4ec4ef084542a7e30eecce56970c7e09c123c9`. The checkout diff digest, SHA-256 of `git diff HEAD` in `om-emu`, is `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`. Node v26.12.1 via `node26`. `OM_EMU_MODEL=E147`, `OM_EMU_NVRAM=off`. No emulator, Ghidra, or Java process was started.

3. **Work performed:** The correction was applied in new versioned files. The decisive commands, from the workspace root, were:
   - `node26 work/scripts/invoke_v1.mjs v2-unit-v5 work/harness/test_harness_v5.mjs`
   - `node26 work/scripts/run_close_v2.mjs`
   The second command ran `capture_v7.mjs` (forms probe plus identity and four display captures), `write_freeze_v4.mjs`, `prove_v3.mjs` (proof, then the bad freeze), and `check_freeze_v1.mjs`.

4. **Files examined:** The T12 accepted hook, predicates, state, table, compare, and refresh sources; `gate_v6.mjs`; Sol's reject notes in `audit/previous-review.md`; display references `ref-k1e-a.json`, `ref-k1e-b.json`, and `ref-k2.json`; the OM-Emu tree `om-emu/emu` (hashed, not executed). No disassembly addresses were produced.

5. **Files created:** All new and updated files are under `work/`. `work/evidence-manifest.json` lists every output. The guarantees live in `work/harness/entry_v5.mjs`, `execute_v2.mjs`, `operations_v2.mjs`, `fake_session_v1.mjs`, `inventory_register_v10.mjs`, `inventory_hook_v6.mjs`, the six `work/scripts/run_*_t13_v5.mjs` runners, `work/harness-freeze.json`, `work/out/harness-freeze.seal.json`, `work/harness.md`, and `work/result.md`.

6. **Findings:**
   1. The six accepted T12 files in `work/harness/` match the T12 bytes. `gate_v6.mjs` matches the previous run. `STATIC`
   2. Runners and `driver_v5.mjs` import only the harness entry and the Node allow-list. Computed import, `createRequire`, `require`, `process.binding`, and `node:module` are rejected by `static_check_v5.mjs`. `STATIC`
   3. The handle returns frozen descriptions and accepts only a string id. No runner callback receives backing state. `DATA`
   4. A resolvable import of `om-emu/emu/src/fw/model.mjs` is refused with `POLICY_REFUSED` / `policy-refuse: emulator module`. The module body did not run. `STATIC`
   5. `createReal` contains `runZone`, `zone_session_k1.mjs`, and `emu/src/fw/model.mjs`. `runRunner` does not call it. The unit test observed `realInvocationCount() === 0`. `STATIC`
   6. Identity on the fake executed 372 operations, installed the combined hook and the recorder, made 536 API calls, recorded 1362 idles, and reported no refresh problems. The sealed record has 145 rows and 25 setup deltas (`work/out/identity-t13-v5.json`, `work/out/summary-identity-t13-v5.json`). `DATA`
   7. Proof replayed those 372 operations against the sealed rows and deltas and finished with the same hook, recorder, API, and idle counts (`work/out/summary-proof-t13-v5.json`). `DATA`
   8. Display passes executed 24, 24, 23, and 17 operations, each with the hook and recorder installed and no refresh problems. `DATA`
   9. Bring-up sealed `{changed:{flag:7}}`. Proof accepted flag 7 and rejected flag 9. A planted flag on `k1e-pose-landscape` failed the comparison. `DATA`
   10. Deleting an identity-bearing operation removed it from execution, from coverage, and from the identity generator together. `DATA`
   11. String, Buffer, URL, descriptor, promise, and stream reads were inventoried. A file changed after the read failed the exit record. A missing tag and an init failure each wrote a failing exit record. The proof inventory includes the freeze file and its seal. `DATA`
   12. The freeze has 36 execution files and 388 checkout files at the revision and diff digest in section 2. Proof started only after that freeze validated. Capture combined with proof was refused, and the refusal is logged. A seal-matched freeze missing `entry_v5.mjs` was refused with that path. `DATA`
   13. The fake exercises the restored delivery path. Firmware was not started, so this is not an emulator observation of writer counts or native reconcile. `BOUNDARY`

7. **Evidence for each claim:**
   1. `work/harness/test_harness_v5.mjs` byte comparisons against the T12 run `run-20261120-003025` and against the previous `gate_v6.mjs`.
   2. `work/harness/static_check_v5.mjs`; the static check printed `static ok` from `work/scripts/capture_v7.mjs`.
   3. `work/harness/entry_v5.mjs` `describe`, `perform`, and `operations`; unit-test lines for the frozen handle.
   4. `work/harness/planted_import_v1.mjs` stdout `POLICY_REFUSED` under `inventory_register_v7.mjs` during the unit test. `inventory_hook_v6.mjs` `resolve` throws `POLICY_EMULATOR` after `nextResolve`.
   5. `work/harness/entry_v5.mjs` `createReal` and `runRunner`; unit-test lines `createReal has not been called` and `createReal stayed uncalled after the drives`.
   6. `work/out/summary-identity-t13-v5.json` and `work/out/identity-t13-v5.json`. Inventory `work/out/inventory-v6-identity-exit.json` (`ok`, 36 imports).
   7. `work/out/summary-proof-t13-v5.json`. Inventory `work/out/inventory-v6-proof-exit.json`.
   8. `work/out/summary-display-a-t13-v5.json`, `summary-display-b-t13-v5.json`, `summary-display-k2-t13-v5.json`, `summary-display-k1-t13-v5.json`.
   9. Unit-test lines `bring-up seals the flag it wrote`, `proof accepts the sealed bring-up delta`, `proof rejects a different bring-up flag`, and `a planted flag mismatch fails the real comparison`.
   10. Unit-test lines for the identity-bearing deletion.
   11. `work/out/inventory-v6-forms-exit.json`; unit-test probes under tags `v2-forms`, `v2-changed`, `missing-tag`, and `v2-init-fail`. Proof imports include `work/harness-freeze.json` (`work/scripts/check_freeze_v1.mjs`).
   12. `work/harness-freeze.json`, `work/out/harness-freeze.seal.json`, `work/out/cmd/v6-identity.json` (`captureException`), `work/out/cmd/v6-proof.json`, and `work/out/inventory-v6-bad-freeze-exit.json`.
   13. `work/harness/fake_session_v1.mjs` and `work/harness/execute_v2.mjs`. No emulator process was launched.

8. **Tests and outcomes:**
   - PASS. `work/harness/test_harness_v5.mjs`: 48/48, including accepted bytes, the frozen handle, policy refusal, sealed flag 7 versus 9, the fault, the identity-bearing deletion, read-form probes, missing freeze, and capture combined with proof.
   - PASS. Identity, display-a, display-b, display-k2, and display-k1 captures (`v6-*` exit records `ok`).
   - PASS. Proof against `work/harness-freeze.json` (`v6-proof` exit `ok`, 33 imports).
   - PASS. Bad freeze refused: `missing .../work/harness/entry_v5.mjs`.
   - PASS. `work/scripts/check_freeze_v1.mjs`: proof inventory contains the freeze and the seal; checkout has 388 files; the logged capture exception is present; proof is not marked capture.
   - BOUNDARY. The delivery path runs on the fake. Firmware was not started.

9. **New versus previously established:** The byte copies confirm the accepted T12 hook, predicates, state, table, compare, and refresh. Findings 2 through 12 replace the rejected T12b result: the runners now call the restored payloads through the private entry, the handle no longer accepts a state callback, the inventory no longer drops the freeze or Buffer, URL, and descriptor reads, and a non-capture run refuses to start unless the freeze and the OM-Emu source tree listing validate. The two T9d mechanism items stay unresolved and non-blocking, as in the brief.

10. **Remaining uncertainties.** The mode-selecting getter input and the producer of `0x610c8b66` stay unresolved and non-blocking. `module.register` on Node 26 prints a deprecation warning; the hook still recorded loads, refused the planted emulator import, and refused the bad freeze. A named `readFileSync` import inside a dependency does not go through the patched `fs.readFileSync`; `execute_v2.mjs` uses the default `fs` export, which the probes and the reference-JSON inventory show is wrapped. The checkout listing covers `om-emu/emu` without loading those modules.

11. **Recommended next actions.** Keep the accepted bytes and `operations_v2.mjs`. A later emulator session can use `createReal` only under a freeze that was taken from that session; this freeze already lists the checkout files that session would import. Leave the two T9d items to their own task. No storage decision. No hardware step.

12. **Deviations from the brief:** none. New versioned names were used because executed files are not edited. The manifest and its seal are written after this file.
