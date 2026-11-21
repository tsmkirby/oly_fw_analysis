# T13b result (Opus): staged core AF-ON proof, implementation for code review

1. **Task and basis:**
   - **Task:** T13b-afon-core-proof. It follows T13 (CLOSED-PARTIAL); the owner approved the staged approach on 2026-11-21.
   - **Harness basis:** the T13 v3 harness that Sol accepted (`run-20261120-224009-review`, ACCEPT-CODE). With it, every T8d and zone session passed on the real emulator in `run-20261120-225658`, as Sol confirmed in `run-20261120-231437-review`.
   - **Scope:** EMULATOR-ONLY.

2. **Change (the only one):**
   - **The proof is staged.** In `plan_v3.mjs` the launchable `identity` plan is the five T8d and zone sessions (k1e, k2, candidate, zk1e, zcand). `proof` is unchanged: it reproduces exactly those sessions.
   - **Display sessions unchanged.** The four display sessions keep the v1 construction, and `identity-all` keeps them exercisable in the pure-Node fake tests. That plan cannot be launched, because it is not in `common_v1` PLANS.
   - **Display plans refused for now.** The launcher refuses the display plans by identity coverage until a display identity exists, which is a later stage with a corrected display adapter (T13 decision).
   - **New versions, renamed only.** `exec_v4` (identity-all counts as an identity pass; the identity table records its plan name), `run_v5`, `exitcheck_v5`, `launch_v5`, `make_freeze_v5` (captures identity and proof) and `test_v5` change only the version references to `plan_v3`.
   - **Byte-identical.** Every other file is byte-identical to the T13 workspace (checked by this result's generator), including `real_v2`, `fake_v2`, `gate_v2`, `relations_v2`, `session_v2`, `inventory_v3`, `expect_v1`, `seal_v1`, `freeze_v1`, `common_v1` and the six T12 modules. The rejected T13 v4 display files were not copied.
   - **Acceptance bar unchanged.** Display validation remains required as a separate stage.

3. **Results (`OBSERVED`, pure Node):**
   - **Tests:** `node26 work/harness/test_v5.mjs b-final`: 43/43 PASS, and the tested-source fingerprints equal the submitted files. New and changed checks:
     - the core identity has no display session;
     - the proof reproduces on the core identity;
     - a display plan is refused by coverage on the core identity;
     - `identity-all` is not launchable;
     - the display fake tests run on `identity-all`.
   - **Freeze:** `make_freeze_v5` gave `03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92` (463 files).
   - **Fake runs through `launch_v5`:** identity 324 operations / 1096 relations, and proof 324 reproduced, each with `ok:true` and `valid:false`. A real proof given the fake identity is refused.
   - **Records:** `work/out/cmd/`, `work/test-scratch/b-final/`, `work/evidence-manifest.json`.

4. **Expected real behaviour (`INFERRED`):** the real core identity runs the same five sessions with the same construction that passed in `run-20261120-225658` (324 operations, 1094 relations plus 2 writer relations). The new element is the proof process: §4.1 reproduction of every field against the sealed identity, which has not run on the emulator before. Its open risk is determinism, meaning exact equality of the frames, titles and states between two runs.

5. **Next:** Sol code review. If it is accepted, a Grok run-only brief with two processes, stopping at the first failure:
   - `node26 work/harness/launch_v5.mjs identity t13b-identity --freeze-sha 03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92`
   - `node26 work/harness/launch_v5.mjs proof t13b-proof --freeze-sha 03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92 --identity t13b-identity`

   Then Sol's results review. The display stage follows separately.
