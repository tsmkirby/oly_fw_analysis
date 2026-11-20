# T12 result

1. **Task identifier and brief version used:** T12, brief version 2026-11-19. Section 0 (zero emulator processes) overrides the rest. This is the correction round after Sol review `run-20261120-002500-review`.

2. **Research baseline used:** T11 run `ref/tasks/T11-afon-acceptance-harness/run-20261119-223109`. The accepted hook, predicates, state, and table copies were hashed against that run. `audit/previous-review.md` is the Sol REJECT this round answers. `templates/result.md` is the result shape. OM-Emu modules were loaded as libraries during the load-only freeze. No OM-Emu session, Ghidra, or Java process was started. `OM_EMU_NVRAM` was `off` on every probe and runner spawn. `OM_EMU_MODEL` was `E147`.

3. **Work performed:** The previous harness stayed in place. New versioned files were added under `work/` and executed files were left as they were. Commands, in the order that matters for this round:

   - `node26 work/scripts/diff_ids_v1.mjs` — generated ids 279, declared ids 279.
   - `node26 work/scripts/check_ids_v2.mjs` — `{"ok":true,"missing":[],"extra":[],"identityKeys":101}`.
   - `node26 work/scripts/peek_setup_v1.mjs` — threw because the probe fake had no `s.screen`.
   - `node26 work/scripts/peek_setup_v2.mjs` — `{"problems":[],"slots":63,"owner":255,"flag":255,"subject":0}`.
   - `node26 work/harness/test_harness_v5.mjs` — `FAIL 2`.
   - `node26 work/harness/test_harness_v6.mjs` — `PASS 0`.
   - `node26 work/scripts/write_freeze_v3.mjs` — `spawnSync node26 ENOENT`. `node26` is `tools/bin/node26.cmd`.
   - `node26 work/scripts/write_freeze_v4.mjs` — exit 0, 169 files. The five `ref/` modules were dropped because the junction realpath is `C:\Dev\OM3-research`.
   - `node26 work/scripts/write_freeze_v5.mjs` — `{"files":177,"runners":7,"checkout":140,"refFiles":5,"missing":0}`.
   - `node26 work/scripts/build_manifest_v2.mjs` — writes `work/evidence-manifest.json` and `work/out/evidence-manifest.seal.json` after this result.

   The freeze children are `process.execPath` of that `node26` command, `C:\Dev\OM3-research\tooling\node-v26.12.1-win-x64\node.exe`. Their command records show `--import ./work/harness/inventory_register_v4.mjs` and `OM_EMU_NVRAM=off`.

4. **Files examined:** `TASK.md`, `brief.md`, `audit/previous-review.md`, `templates/result.md`, the T11 harness copies, `work/harness/display_v3.mjs` and `drive_v11.mjs` as the sources of the new runners, `om-emu/emu/checks/lib/env.mjs`, `om-emu/emu/src/fw/model.mjs`, `om-emu/emu/src/lab/display.mjs`, `om-emu/emu/checks/lib/png.mjs`, and the inventory JSONL under `work/out/`. No disassembly.

5. **Files created:** New harness modules under `work/harness/` (`gate_v5.mjs`, `identity_v4.mjs`, `setup_v2.mjs`, `static_check_v9.mjs`, `refresh_v4.mjs`, `inventory_v4.mjs`, `inventory_register_v4.mjs`, `inventory_hook_v4.mjs`, `inventory_probe_v4.mjs`, `checkout_v1.mjs`, `ops_v1.mjs`, `drive_v12.mjs`, `display_v4.mjs`, `display_v5.mjs`). New scripts under `work/scripts/` (`diff_ids_v1.mjs`, `check_ids_v2.mjs`, `peek_setup_v1.mjs`, `peek_setup_v2.mjs`, `t13_env_v2.mjs`, the six `run_*_t13_v2.mjs` runners, `run_display_job_t13_v2.mjs`, `write_freeze_v3.mjs`, `write_freeze_v4.mjs`, `write_freeze_v5.mjs`, `build_manifest_v2.mjs`). Outputs include `work/harness-freeze.json`, `work/out/test-harness-v5.txt`, `work/out/test-harness-v6.txt`, the inventory and command records, this result, and `work/harness.md`. `work/evidence-manifest.json` lists them.

6. **Findings:**

   1. INFERRED. The gate refuses a commit before the key function runs when the expectation key is missing or the sealed row is missing. The counting fake recorded 0 deliveries in both cases, and 1 delivery when the sealed row was present. The post-key approval still compared title, highlight, and screen.
   2. INFERRED. `runSetup` is five separate gated operations. The focus argument returned by the first call was the `d1` of the second call. Bring-up and focus-1712 compared `setupExpect()`. The middle three compared `holdAll()` against a stable fake capture.
   3. INFERRED. `static_check_v9.mjs` rejects the planted forms `ctx.s.key`, `sim.u8`, `sim.word`, `writeU32`, `writeU16`, `nk.svc`, and `bringUp`, plus the forms already planted in v8. `assertClean` accepted the tree.
   4. INFERRED. With `hookGetter` enabled, the getter return hook filled `ret` and called `passthrough`. `sampleNow` stored a sample while the refresh window was open. The stock K1 `driveJob` on the painted fake reported a passing refresh record, every window sample inside its entry and end times, and an `0x1e71` getter in category `assert` with a non-null return.
   5. INFERRED. `bindSession` binds `gate.mode` to `writeMode`. `driveCandidateZone` reached `custom-flag-clear` on a one-row fake and wrote the mode address. The writer count on that fake was supplied as 7.
   6. DATA. `declaredGaps()` matched the 279 declared operation ids. `operationPlan()` has 101 keys, and dropping any one of them fails coverage.
   7. INFERRED. The exit check runs when the inputs probe finishes, when the probe throws, and when registrar initialisation throws after the empty record exists. The inputs exit lists the T6 overlay, `blk00000000`, `blk02000000`, and an empty NAND note. Command records include `argv` and `execArgv`.
   8. STATIC. The four accepted copies match the T11 bytes cited in `work/harness.md`. The hook's `decide` line does not mention the watch.
   9. INFERRED. The load-only freeze contains 177 files, including `zone_session_k1.mjs`, `model.mjs`, `menu.mjs`, `display.mjs`, `png.mjs`, and the registrar modules. `proofRun` is false.
   10. HYPOTHESIS. A live bring-up that changes a held field or the picture would fail `setupExpect()` or `holdAll()` on that step. The unit tests used a stable painted state and `frameSample`. T13 cannot edit the harness if that happens.

7. **Evidence for each claim:** Claims 1–5 and 8 are the PASS lines in `work/out/test-harness-v5.txt` and `work/out/test-harness-v6.txt`. Claim 6 is `work/scripts/check_ids_v2.mjs` stdout and `work/scripts/diff_ids_v1.mjs`. Claim 7 is `work/out/inventory-unit-inputs-v4-exit.json`, `work/out/inventory-unit-throw-v4-exit.json`, `work/out/inventory-unit-init-v4-exit.json`, and `work/out/cmd/unit-inputs-v4.json`. Claim 9 is `work/harness-freeze.json` and `work/out/inventory-freeze-identity-v3.jsonl` (the zone path realpath is under `C:/Dev/OM3-research` and is stored as `ref/...`). Claim 10 is the expectation in `setupExpect()` / `holdAll()` together with the stable fake in `peek_setup_v2.mjs` and `test_harness_v6.mjs`.

8. **Tests and outcomes:**

   - PASS `diff_ids_v1.mjs`: 279 and 279.
   - PASS `check_ids_v2.mjs`: ok, 101 identity keys.
   - FAIL `peek_setup_v1.mjs`: probe fake lacked `s.screen`. Superseded by v2.
   - PASS `peek_setup_v2.mjs`: setup comparison problems empty, 63 slots.
   - FAIL `test_harness_v5.mjs`: two failures. The changed-frame case ignored the frame argument, so the hold did not fail. `display_v4.mjs` imported `om-emu/checks/lib/png.mjs`, which is not on disk. The other v5 lines passed, including the sealed-row count, the five setup steps, the 101-key coverage, the scanner plants, the return hook, the open-window sample, the custom-zone mode write, and the inventory probes.
   - PASS `test_harness_v6.mjs`: changed frame fails the hold; the scanner accepts the tree; `display_v5.mjs` `driveJob` passes on the fake.
   - FAIL `write_freeze_v3.mjs`: ENOENT spawning the `node26` shim.
   - BOUNDARY `write_freeze_v4.mjs`: exit 0, and the written set omitted the five junction targets. `write_freeze_v5.mjs` is the set to use.
   - PASS `write_freeze_v5.mjs`: 177 files, required paths present, `proofRun` false.
   - BOUNDARY. The T13 proof path was not entered. Load-only returned before `runZone`.
   - `test_harness_v3.mjs` remains the earlier FAIL and was not re-run. `test_harness_v4.mjs` remains the earlier PASS of `gate_v4.mjs` and was not re-run.

9. **New versus previously established:** The byte copies confirm the T11 hook, predicates, state, and table. Claims 1–7 and 9 are new relative to the rejected T12 result: presence runs before delivery, setup is split, the scanner covers the additional raw forms, the recorder samples inside the window and marks assertion reads, the mode binding is reached from `driveCandidateZone`, coverage is generated from the operation plan, and the freeze is the loaded import graph. Claim 10 is the remaining live-session uncertainty the unit tests do not close. The two T9d mechanism items stay unresolved and non-blocking, as in the brief.

10. **Remaining uncertainties.** The middle setup steps and the setup frame hold were demonstrated on a fake whose memory and sample did not change. A live bring-up or focus call that changes a held field fails that gate, and T13 is not allowed to edit the harness. The display end-to-end used `frameSample`, so it does not show a captured screenshot. The custom-zone writer count was supplied by the fake. The mode-selecting getter input and the producer of `0x610c8b66` stay unresolved.

11. **Recommended next actions.** T13 runs the v2 runners against `display_v5.mjs`, `drive_v12.mjs`, `gate_v5.mjs`, and the freeze in `work/harness-freeze.json`. The proof path is the one those runners take when `T12_LOAD_ONLY` is unset, after an identity seal exists. No storage decision. No hardware recommendation.

12. **Deviations from the brief:** none of the closed checklist. `display_v4.mjs` is the failed png import and is not the runner import. `write_freeze_v3.mjs` could not spawn the `node26` cmd shim; v5 uses the node.exe that shim launches, invoked from `node26 work/scripts/write_freeze_v5.mjs`.
