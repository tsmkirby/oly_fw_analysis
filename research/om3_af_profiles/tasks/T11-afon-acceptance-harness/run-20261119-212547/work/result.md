# T11 result

1. **Task identifier and brief version used:** T11, brief version 2026-11-19.

2. **Research baseline used:** T8d decision and brief, T9d decision and brief, T8b decision, and the four Sol reviews `T8d run-20261119-201846`, `T8d run-20261119-211040`, `T9d run-20261119-194955`, `T9d run-20261119-211721`. Behaviour baseline `hook_t8d_writer9.mjs`, `proof_t8d10.mjs`, `gen_proof_table_t8d1.mjs`, `check_proof_t8d1.mjs`, and the T9d validator `lib_valid_t9d.mjs`. Decoded main `0100` SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` and resource `0106` SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`, both recorded again by the session inventory. OM-Emu baseline from `ref/PROJECT-STATE.md`: `4e4ec4ef084542a7e30eecce56970c7e09c123c9`, local patch `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`. No new overlay bytes. Section 7 remains `0x610bf5e3`–`0x610bf5e5`.

3. **Work performed:** Pure Node first: `node26 work/harness/table_v1.mjs`, `node26 work/harness/check_table_v1.mjs work/out/proof-table-t11-v1.json work/out/table-check-t11-v1.json`, `node26 work/harness/test_harness_v1.mjs`. Then six emulator processes, in order: `node26 work/scripts/run_identity_v1.mjs`, `run_identity_v2.mjs`, `run_identity_v3.mjs`, `run_identity_v4.mjs`, `run_identity_v5.mjs`, and `node26 work/scripts/run_accept_v1.mjs`. The last process sealed `work/out/identity-t11-v6.json` and then started the proof. `OM_EMU_MODEL=E147`, `OM_EMU_NVRAM=off`. Tool: `node26` (Node v26.12.1). Ghidra and Java were not run.

4. **Files examined:** `TASK.md`, `brief.md`, `templates/result.md`, the T8d/T9d/T8b decisions and the four reviews, `hook_t8d_writer9.mjs`, `proof_t8d10.mjs`, `lib_map_c1.mjs`, `lib_valid_t9d.mjs`, `zone_session_k1.mjs`, `pose.mjs`. No new disassembly. Hook sites already established and reused: getter `0x60063380`, setter `0x60063431`, writer `0x609b3c79`, reconcile entry `0x60a8f2be`, builder `0x60a8f4c1`, return `0x60a8f647`, pose-copier return `0x604193c7`, display `0x6041935b` and `0x6041a1fb`, owner `0xa031ed04`.

5. **Files created:** everything under `work/harness/`, `work/scripts/`, `work/out/`, plus `work/harness.md`, `work/result.md`, and `work/evidence-manifest.json`. The manifest lists each hashed file. The seal of the manifest is `work/out/evidence-manifest.seal.json` and is not inside the manifest body.

6. **Findings:**
   1. The identity pass `identity-t11-v6` ended `ok:true`, including the seven-zone press and release records and the pose gate after the non-reset normal edit. `OBSERVED-EMU`
   2. The candidate writer ran exactly 3 times. The press log shows the hook itself set fire when the owner went from 0 to 2 after the builder. There is no runner arm flag. `OBSERVED-EMU`
   3. Custom release matched the K1e record `[58,0,7,0,3,0,3,0,0,0]` after the seed also wrote the live half-press cells. `OBSERVED-EMU`
   4. The proof stopped at `candidate-af-down` because the sealed table has no `k1e:ke-s1-down`. That K1e step is not marked `commit`, so the identity pass never stored it. The candidate step names it as `identityFrom`. `OBSERVED-EMU`
   5. The display jobs did not run. The proof threw, and the brief says to stop at the first failed assertion. `OBSERVED-EMU`
   6. Wrapping `h.finish` on every getter call overflows the stack. Wrapping it once does not. `OBSERVED-EMU`
   7. While the editor flag is clear, the stock editor commits the mirror position onto the live cell at setter return `0x604193c7`. Refusing that write whenever the live cell is not the reset value also refuses the normal-edit commit. Refusing it only while a pose change is in progress keeps the commit and still blocks the post-edit pose copy. `OBSERVED-EMU`
   8. `bank()` and `initMirror()` in `afon_hooks_v5.mjs` are the T8c text: linked pose word 2 selects bank 4, pose word 4 selects bank 2, otherwise 0; unlinked selects 0. `initMirror()` fills factory bytes only into `0xFF` / `0xFFFF` cells while the mode flag is 1. `STATIC`
   9. The generated table has 39 steps and the checker reported no problems. `DATA`
   10. The mode-selecting getter input and the producer that schedules `0x610c8b66` are unchanged open items from T9d. This task did not investigate them. `INFERRED`

7. **Evidence for each claim:**
   1. `work/out/identity-t11-v6.jsonl` line 136 `identity-t11-v6-done` `ok:true`; line 134 `zone-custom-release` pass; `work/out/identity-t11-v6.json` `ok:true` with 28 rows.
   2. `work/out/identity-t11-v6.jsonl` line 105 `writer-calls` `writer:3`, press log `ownerAtEntry:0`, `owner:2`, `fire:true`. `work/harness/afon_hooks_v5.mjs` has no `armPress`.
   3. `work/out/identity-t11-v6.jsonl` line 134, both sides `[58,0,7,0,3,0,3,0,0,0]`.
   4. `work/out/proof-t11-v1.jsonl` line 65, problem `refuse commit: sealed table has no k1e:ke-s1-down`. `work/harness/table_v1.mjs` step `af-down` `identityFrom: 'k1e:ke-s1-down'`; step `ke-s1-down` has no `commit`. The sealed keys are listed by reading `work/out/identity-t11-v6.json`.
   5. `work/out/proof-t11-v1.jsonl` line 66. No `work/out/display-ab-t11-v1.jsonl`.
   6. `work/out/identity-t11-v1.jsonl` done row, `Maximum call stack size exceeded` at `afon_hooks_v1.mjs`. Later runs use the one-time wrap in `afon_hooks_v5.mjs`.
   7. `work/out/identity-t11-v4.jsonl` `candidate-n-up` failed `half k5962` after `pose-copy-restore` of value 292. `work/harness/predicates_v2.mjs` `shouldRefusePoseWrite` adds `duringPose`. `work/out/identity-t11-v6.jsonl` then passed `candidate-n-up` and `candidate-pose-after-edit`.
   8. `work/harness/afon_hooks_v5.mjs` `initMirror` and `bank`.
   9. `work/out/table-check-t11-v1.json` `ok:true`, `steps:39`.
   10. T9d decision, carried forward. No new trace.

8. **Tests and outcomes:**
   - `test_harness_v1.mjs`: PASS (pure Node, before any emulator process).
   - `check_table_v1.mjs`: PASS, 39 steps, 0 problems.
   - `identity-t11-v1`: FAIL, getter-hook stack overflow.
   - `identity-t11-v2`: FAIL, `candidate-n-up` down half.
   - `identity-t11-v3`: FAIL, `candidate-e-open` down half after writing every editor set into the live cell.
   - `identity-t11-v4`: FAIL, `candidate-n-up` release half; the pose gate had swallowed the editor commit.
   - `identity-t11-v5`: FAIL, `zone-custom-release` (press matched; release rebuilt the previous zone).
   - `identity-t11-v6`: PASS, `ok:true`.
   - `proof-t11-v1`: FAIL, missing sealed row `k1e:ke-s1-down`.
   - Display A, B, K2, K1: not run.

9. **New versus previously established:**
   1. Confirms T8d `proof-t8d10` `ok:true` on the same sequence, now with a down-edge record and a release compare.
   2. New relative to the rejected T8d proof: the writer arms inside the hook. Confirms the T8d writer count of 3.
   3. Confirms the T8d custom record bytes, and adds the release compare the earlier proof did not make.
   4. New defect. The T8d table did not ask the candidate AF-ON commit to match a pre-sealed K1e screen for that edge.
   5. The T9d display result is not re-established here.
   6. New. The T8d hook did not wrap `h.finish`.
   7. New. The T8d gate refused the copier only when the live cell was still the reset value. The wider gate needs the pose-in-progress split or it blocks the editor commit.
   8. Confirms T8c `bank()` and `initMirror()`.
   9. Confirms the T8b generated-table method, extended with the zone press/release rule and the K2 AF-ON commits.
   10. Confirms T9d: both items stay unresolved and non-blocking.

10. **Remaining uncertainties.** The display frames, the every-refresh getter records, and the proof's later commits were not reached. Whether `k1e:ke-p-s1-down` is the next missing row is visible in the table and was not executed. The two T9d items, the getter input that selects the mode template and the producer of `0x610c8b66`, stay unresolved.

11. **Recommended next actions.** In a new table file, mark the K1e steps that a candidate commit names (`ke-s1-down`, `ke-p-s1-down`) as commits, seal a new identity file, and rerun the proof and then the display jobs on `afon_hooks_v5.mjs`. Persistence and codec v2 wait until those proofs end `ok:true`. No storage choice and no hardware step.

12. **Deviations from the brief.** The T8d proof did not end `ok:true`. The T9d display proof did not run. Six emulator processes were used. The successful identity pass and the failed proof shared the sixth process; the seal was written after the identity sessions returned and before the proof sessions started. Earlier identity processes failed and were kept under new filenames.
