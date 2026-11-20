# T11 result

1. **Task identifier and brief version used:** T11, brief version 2026-11-19, correction round in section 6 after Sol review `run-20261119-222335-review`. `OM_EMU_MODEL=E147`. `OM_EMU_NVRAM=off`. Node v26.12.1 via `node26`.

2. **Research baseline used:** `brief.md` section 0 and section 6; `audit/previous-review.md`; the previous `work/result.md` and `work/harness.md`; T8d `proof_t8d10` and T9d `lib_valid_t9d.mjs` as named by the brief; the sealed T9d references `ref-k1e-a.json`, `ref-k1e-b.json`, and `ref-k2.json`. Behaviour below is EMULATOR-ONLY.

3. **Work performed:** Pure Node first: `node26 work/harness/table_v2.mjs`, `node26 work/harness/check_table_v2.mjs`, `node26 work/harness/test_harness_v2.mjs`, `node26 work/harness/test_allow_v3.mjs`, `node26 work/scripts/preflight_expect_v2.mjs`. Then five emulator processes, each `node26 --import ./work/harness/inventory_register_v2.mjs` under `work/scripts/launch_v2.mjs`:
   - `identity-t11-v7` stopped at `zk1e-z4-s1-down`.
   - `identity-t11-v8` stopped at `zcand-z0-af-down`.
   - `identity-t11-v9` stopped at `zcand-enter-z1`.
   - `identity-t11-v10` ended `ok:true` and was sealed before any acceptance session.
   - `accept-t11-v2` ran the proof and was going to run display A, B, K2, and K1 in that same process. It stopped at `candidate-af-up`. Display did not start.

4. **Files examined:** `brief.md`, `TASK.md`, `audit/previous-review.md`, `templates/result.md`, `work/harness/afon_hooks_v5.mjs`, `work/harness/drive_v6.mjs`, `work/harness/display_v1.mjs`, `work/out/identity-t11-v6.jsonl`, `ref/tasks/T9d-afon-display-size-inputs/run-20261119-202459/work/scripts/lib_valid_t9d.mjs`, `ref/tasks/T8b-afon-integrated-acceptance-generated/run-20261119-153249/work/scripts/lib_map_c1.mjs`. No new disassembly. The only section-7 bytes this task may cite remain `0x610bf5e3`–`0x610bf5e5`.

5. **Files created:** New harness versions under `work/harness/` (`predicates_v3.mjs`, `compare_v2.mjs`, `compare_v3.mjs`, `expect_v2.mjs`, `gate_v2.mjs`, `gate_v3.mjs`, `identity_v2.mjs`, `refresh_v2.mjs`, `inventory_hook_v2.mjs`, `inventory_v2.mjs`, `inventory_register_v2.mjs`, `static_check_v6.mjs`, `static_check_v7.mjs`, `afon_hooks_v6.mjs`, `table_v2.mjs`, `check_table_v2.mjs`, `drive_v7.mjs` through `drive_v10.mjs`, `display_v2.mjs`, `test_harness_v2.mjs`, `test_allow_v3.mjs`). Runners under `work/scripts/`. Session logs and the seal under `work/out/`. `work/harness.md` and this file. The manifest lists every file.

6. **Findings:**
   1. OBSERVED-EMU. `identity-t11-v10` ended `ok:true`. The sealed table has 55 rows, including the four K1e edges, and `coverageProblems` is empty.
   2. OBSERVED-EMU. In that candidate session the writer ran 3 times. The press log shows `fire:true` only when `ownerAtEntry` is 0 and `owner` is 2. Pose refusal count on that session is 4.
   3. OBSERVED-EMU. Zone press and release, including the centre zone and custom, matched the K1e ten-byte records. The centre record is `[14,2,2,0,27,0,39,0,0,0]` on both roles. The zone candidate writer ran 7 times, one AF-ON press per recorded zone.
   4. OBSERVED-EMU. `proof-t11-v2` compared K1e and K2 and the candidate through `candidate-af-down`. `candidate-af-up` refused before the key. Expected title `19a0f247d22625e54bb1ea773998e8886a8591151390eb27af9b5d4ac6e3ea69`. Actual title `166805347ccaf26ddad5750dbfd0a2b169855ffa38b4dbcdfa0717ddd42a3059`. Highlight null and screen `shooting` on both.
   5. OBSERVED-EMU. Display A, B, K2, and K1 did not run. They have no `ok:true`.
   6. STATIC. The gate compares the full state before it returns. The static check rejects a planted raw key, memory write, `tap`, and raw OK. The pose predicate's `decide` takes `poseActive` from the native issue and publish hooks and does not take `watchArmed`.
   7. DATA. Inventory exit records for all five emulator processes and the pure-Node registrar probe have `ok:true`.
   8. INFERRED. `k1e:ke-s1-up` is the K1e screen before S1 up. The candidate check for AF-ON up runs while AF-ON is still down, and that screen is a different title. The rows are both real; they are different moments.

7. **Evidence for each claim:**
   1. `work/out/identity-t11-v10.jsonl` id `identity-t11-v10-done` `pass:true`. `work/out/identity-t11-v10.seal.json` SHA-256 `1865a575c63ee414f387a16d2db586653f6324e967f1a790c87e6a23a48dc24d`, 9165 bytes. Coverage check printed `problems:[]` and `required:true`.
   2. `work/out/identity-t11-v10.jsonl` id `writer-calls`, `writer:3`, `fire:true` on `ownerAtEntry:0` to `owner:2`.
   3. Same log, id `zone-z4-press`, both sides `[14,2,2,0,27,0,39,0,0,0]`. Id `zone-writer-calls`, `writer:7`. `work/out/identity-t11-v10-zone-k1e.json` press and release hashes match per zone.
   4. `work/out/proof-t11-v2.jsonl` id `candidate-af-up-identity`, problems `["title"]`, with the two titles above. The process then logged `proof-t11-v2-done` `pass:false` and exited 1.
   5. `work/scripts/run_final_v2.mjs` calls display only after the proof returns. The proof threw, so `display_v2.mjs` was not run. No `display-ab-t11-v2.jsonl` and no `display-controls-t11-v2.jsonl`.
   6. `work/harness/gate_v3.mjs` `operate`, `work/harness/compare_v3.mjs` `compareState`, `work/harness/predicates_v3.mjs` `decide`, `work/harness/afon_hooks_v6.mjs` observers at `0x6006a8ab` and `0x6007805e`. `work/harness/test_harness_v2.mjs` printed `all checks passed`.
   7. `work/out/inventory-identity-t11-v7-exit.json` through `inventory-identity-t11-v10-exit.json`, `inventory-accept-t11-v2-exit.json`, and `inventory-unit-inv-v2-exit.json`, each `ok:true`.
   8. The identity row is stored at the start of K1e `ke-s1-up`. The proof check is at the start of candidate `af-up`. Both logs record screen `shooting` and a different title hash.

8. **Tests and outcomes:**
   - PASS. Pure-Node table check, harness tests, allow-stale test, expectation preflight, and the inventory registrar probe.
   - PASS. Identity session `identity-t11-v10`, including zone press and release.
   - FAIL. Proof `candidate-af-up` title. Stopped there.
   - BOUNDARY. Display A, B, K2, and K1 were not started.
   - FAIL as sessions, then replaced by a later version: `identity-t11-v7` (centre record rejected as stale), `identity-t11-v8` (zone AF-ON also writes the half-press record), `identity-t11-v9` (a second editor enter does not restore the factory mirror).

9. **New versus previously established:**
   - The full-state comparison inside the gate, the identity coverage check, the native pose latch, the fail-closed inventory, and the refresh recorder are new in this correction.
   - The identity session confirms the earlier candidate writer count of 3 on the owner 0 to 2 transition, and confirms the zone press and release bytes from `identity-t11-v6`, including the centre record.
   - The proof contradicts treating `k1e:ke-s1-up` as the candidate screen while AF-ON is down. The previous `proof-t11-v1` had stopped earlier, on a missing row. This round sealed that row, and the title comparison then failed.
   - `0x1e71[0]` stays the named value 0 on every gated operation the passing sessions completed. That confirms the inherited subject rule for those operations.

10. **Remaining uncertainties.** Whether an AF-ON release, captured after the key rather than before it, would show the sealed `ke-s1-up` title. This run did not send the key, so that screen was not recorded. Display behaviour against the hashed K1e frames was not measured.

11. **Recommended next actions.** Seal a new identity row for the candidate AF-ON release at the moment that screen is actually up, point a new driver at it, and run a new proof. Keep the title comparison exact. Run display A, B, K2, and K1 only after that proof ends `ok:true`. Leave persistence, storage, and hardware for a later task. Carry the mode-selecting getter input and the producer that schedules `0x610c8b66` forward unresolved.

12. **Deviations from the brief.** The five authorized emulator processes were used. Three of them stopped on zone expectations and were followed by new versioned files; the fourth identity session is the sealed one. The fifth process contained the proof and, after it, the four display jobs, so a proof failure would not start display. Display did not start. The optional custom release with a distinct live profile was not added. The zone reference capture allows the centre record's `27,39` bytes because those bytes are the K1e record the candidate matched.
