# T13b result (run-only)

1. **Task identifier and brief version used:**
   - **Task:** T13b-afon-core-proof.
   - **Brief:** `brief.md`, version 2026-11-21 (run-only stage). SHA-256 `db9a18e0bbc508c7097161a63edd627c4d1fdcd772a5fc300ee8b66dc1b9ce00` (3051 bytes, `python -I` `hashlib.sha256`).
   - **Stage:** run the staged core AF-ON proof. The brief states that Opus wrote the harness and Sol accepted it (`run-20261121-054631-review`, ACCEPT-CODE). This report replaces the implementation-stage `work/result.md`. That earlier text is kept as `work/result-impl.md`. `work/evidence-manifest-impl.json` is the implementation-stage manifest. Neither impl file was edited.
   - **Scope:** EMULATOR-ONLY. These findings are emulator records. Stock-camera behaviour and hardware are outside this report.

2. **Research baseline used:**
   - Documents read: `TASK.md`, `brief.md` (section 0 overrides the rest), `templates/result.md`.
   - Freeze digest supplied by the brief and passed as `--freeze-sha`: `03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92`.
   - `OBSERVED-EMU`: both `exit.json` records store that `freezeSha`, `mode` `"real"`, `planSha` `524d065cff1ebd3e268af350d60b048abccbb3631900d5d60064eb43f1545c52`, and runtime Node `v26.12.1` at `C:/Dev/OM3-research/tooling/node-v26.12.1-win-x64/node.exe` (105319752 bytes, SHA-256 `1c63f1417e2e26d83ca9a9ec1d548524ab1305bc7209d90ebca56257ff0d84ed`).
   - The decoded main image, resource 0106, and the OM-Emu patch were not re-hashed as separate files in this run. Each child's `stdout.txt` helper-hashes line records `inputs/00_0100_50000020.decoded.bin` SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (33554368 bytes) and `inputs/02_0106_458c0020.decoded.bin` SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059` (143523776 bytes).

3. **Work performed:**
   - Two processes, from the workspace root, in the brief's order, each started once. No flags were added and no variables were set for the commands. The shell waited until each process exited.
   - **Identity**

     `node26 work/harness/launch_v5.mjs identity t13b-identity --freeze-sha 03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92`

     - **Exit code:** 0 (`OBSERVED`, shell). `childExit` in `exit.json` is 0.
     - **Duration:** launcher `start` `2026-11-21T11:03:00.269Z`, `end` `2026-11-21T11:05:47.121Z`, which is 166852 ms (`OBSERVED-EMU`, `exit.json`). The shell reported the command elapsed as 167298 ms (`OBSERVED`).
     - `exit.json`: `"ok": true`, `"valid": true`, `"mode": "real"`.
     - **`problems`, verbatim:**

       ```json
       []
       ```

     - **From `completion` in `exit.json`:** operations executed 324, expected 324. Relations evaluated 1096, failed 0. Reproduction evaluated 0. Press reference `k1e-s1-down-halfTarget`. Identity file `identity.json`, 2103975 bytes, SHA-256 `9965d68dfff7c1a38398354e5e58d54c54d55705b69c4a1f1b9fa8eefabca7b3`, `mode` `"real"`. `recorder` is `[]`.

   - **Proof**

     `node26 work/harness/launch_v5.mjs proof t13b-proof --freeze-sha 03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92 --identity t13b-identity`

     - **Exit code:** 0 (`OBSERVED`, shell). `childExit` in `exit.json` is 0.
     - **Duration:** launcher `start` `2026-11-21T11:05:55.840Z`, `end` `2026-11-21T11:08:43.665Z`, which is 167825 ms (`OBSERVED-EMU`, `exit.json`). The shell reported the command elapsed as 168257 ms (`OBSERVED`).
     - `exit.json`: `"ok": true`, `"valid": true`, `"mode": "real"`. `identityTag` is `t13b-identity`.
     - **`problems`, verbatim:**

       ```json
       []
       ```

     - **From `completion` in `exit.json`:** operations executed 324, expected 324. Relations evaluated 1096, failed 0. Reproduction evaluated 324. Press reference `k1e-s1-down-halfTarget`. `identity` is null. `recorder` is `[]`.
   - After both processes had exited 0, `python -I` `hashlib.sha256` hashed every file under the two tag directories and the two launch directories for `work/evidence-manifest.json`.

4. **Files examined:**
   - `TASK.md`, `brief.md`, `templates/result.md`.
   - `work/out/t13b-identity.launch/exit.json`, `stderr.txt`, `stdout.txt`.
   - `work/out/t13b-proof.launch/exit.json`, `stderr.txt`, `stdout.txt`.
   - `work/out/t13b-identity/complete.json`, `identity.seal.json`, `log.jsonl`.
   - `work/out/t13b-proof/complete.json`, `log.jsonl`.
   - `work/result-impl.md` (implementation-stage text, read for the prior fake-run counts; not edited).

5. **Files created:**
   - The launcher wrote `work/out/t13b-identity/` (72 files) and `work/out/t13b-identity.launch/` (6 files).
   - The launcher wrote `work/out/t13b-proof/` (70 files) and `work/out/t13b-proof.launch/` (6 files).
   - This run wrote `work/result.md` and `work/evidence-manifest.json`.
   - Every file under the four launcher directories, and `work/result.md`, is listed in `work/evidence-manifest.json`.

6. **Findings:**
   1. `OBSERVED-EMU`. The identity process exited 0. `work/out/t13b-identity.launch/exit.json` has `ok` true, `valid` true, `mode` `"real"`, `childExit` 0, `plan` `"identity"`, `tag` `"t13b-identity"`, and `problems` `[]`. Launcher duration 166852 ms. Shell elapsed 167298 ms.
   2. `OBSERVED-EMU`. Identity `completion`: executed 324, expected 324, relations evaluated 1096 and failed 0, reproduction evaluated 0, press reference `k1e-s1-down-halfTarget`. The sealed identity is `identity.json`, 2103975 bytes, SHA-256 `9965d68dfff7c1a38398354e5e58d54c54d55705b69c4a1f1b9fa8eefabca7b3`, `mode` `"real"`. `recorder` is `[]`.
   3. `OBSERVED-EMU`. `work/out/t13b-identity/complete.json` has `ok` true, `expected` 324, `deliveries` 324, an `executed` array of length 324, relations evaluated 1096 and failed 0, reproduction evaluated 0, and `inventoryProblems` `[]`. The key `error` is absent. `identity.seal.json` records the same identity SHA-256, byte length, `planSha`, `freezeSha`, and `mode` `"real"`.
   4. `OBSERVED-EMU`. `work/out/t13b-identity/log.jsonl` has 328 lines. Line 1 is the plan record (`id` `"plan"`, `mode` `"real"`, sessions `k1e`, `k2`, `candidate`, `zk1e`, `zcand`, press reference `k1e-s1-down-halfTarget`). 324 rows are operation rows. 327 rows have `"pass": true` (every row except the plan record). Rows with a `problems` array all have `problems` `[]`. Writer rows: `candidate-writer-calls` line 118 and `zcand-writer-calls` line 327, each `"pass": true` and `"problems": []`. Line 328 is `identity-done`, `"pass": true`, relations evaluated 1096 and failed 0, reproduction evaluated 0. No row has `"pass": false`. No row has `"active": true`.
   5. `OBSERVED-EMU`. Identity `stderr.txt` is 0 bytes. Identity `stdout.txt` has five `"step":"done"` hooks, `k1e`, `k2`, `candidate`, `zk1e`, and `zcand`, each with `"ok": true`.
   6. `OBSERVED-EMU`. The proof process exited 0. `work/out/t13b-proof.launch/exit.json` has `ok` true, `valid` true, `mode` `"real"`, `childExit` 0, `plan` `"proof"`, `tag` `"t13b-proof"`, `identityTag` `"t13b-identity"`, and `problems` `[]`. Launcher duration 167825 ms. Shell elapsed 168257 ms.
   7. `OBSERVED-EMU`. Proof `completion`: executed 324, expected 324, relations evaluated 1096 and failed 0, reproduction evaluated 324, press reference `k1e-s1-down-halfTarget`. `identity` is null. `recorder` is `[]`.
   8. `OBSERVED-EMU`. `work/out/t13b-proof/complete.json` has `ok` true, `expected` 324, `deliveries` 324, an `executed` array of length 324, relations evaluated 1096 and failed 0, reproduction evaluated 324, and `inventoryProblems` `[]`. The key `error` is absent.
   9. `OBSERVED-EMU`. `work/out/t13b-proof/log.jsonl` has 329 lines. Line 1 is `identity-coverage`, `"pass": true`, `missing` `[]`. Line 2 is the plan record (`id` `"plan"`, `plan` `"proof"`, `mode` `"real"`, the same five sessions, the same press reference). 324 rows are operation rows. 328 rows have `"pass": true` (every row except the plan record). Rows with a `problems` array all have `problems` `[]`. Writer rows: `candidate-writer-calls` line 119 and `zcand-writer-calls` line 328, each `"pass": true` and `"problems": []`. Line 329 is `proof-done`, `"pass": true`, relations evaluated 1096 and failed 0, reproduction evaluated 324. No row has `"pass": false`. No row has `"active": true`.
   10. `OBSERVED-EMU`. Proof `stderr.txt` is 0 bytes. Proof `stdout.txt` has five `"step":"done"` hooks, `k1e`, `k2`, `candidate`, `zk1e`, and `zcand`, each with `"ok": true`.
   11. `OBSERVED`. `python -I` `hashlib.sha256` of the 72 files in `work/out/t13b-identity/` and the 70 files in `work/out/t13b-proof/` matches `exit.json` `outputs` for path, SHA-256, and byte length. Each child directory's file set equals that `outputs` list.
   12. `INFERRED`. A run is valid when `exit.json` has `ok` true, `valid` true, and `mode` `"real"`. Both processes meet that condition. The figures above are the harness records from this emulator run.

7. **Evidence for each claim:**
   - Finding 1: `work/out/t13b-identity.launch/exit.json` (`ok`, `valid`, `mode`, `childExit`, `plan`, `tag`, `problems`, `start`, `end`). Shell exit code 0, elapsed 167298 ms.
   - Finding 2: the same file, `completion`.
   - Finding 3: `work/out/t13b-identity/complete.json` (`ok`, `expected`, `deliveries`, `executed`, `relations`, `reproduction`, `inventoryProblems`; `error` absent); `work/out/t13b-identity/identity.seal.json`.
   - Finding 4: `work/out/t13b-identity/log.jsonl` line 1, line 118, line 327, line 328; row counts from a full parse (328 lines, 324 operation rows, 327 rows with `"pass": true`, zero `"pass": false`, zero `"active": true`, every present `problems` array empty).
   - Finding 5: `work/out/t13b-identity.launch/stderr.txt` (0 bytes, SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`); `stdout.txt` lines whose `step` is `done`.
   - Finding 6: `work/out/t13b-proof.launch/exit.json` (`ok`, `valid`, `mode`, `childExit`, `plan`, `tag`, `identityTag`, `problems`, `start`, `end`). Shell exit code 0, elapsed 168257 ms.
   - Finding 7: the same file, `completion`.
   - Finding 8: `work/out/t13b-proof/complete.json` (`ok`, `expected`, `deliveries`, `executed`, `relations`, `reproduction`, `inventoryProblems`; `error` absent).
   - Finding 9: `work/out/t13b-proof/log.jsonl` line 1, line 2, line 119, line 328, line 329; row counts from a full parse (329 lines, 324 operation rows, 328 rows with `"pass": true`, zero `"pass": false`, zero `"active": true`, every present `problems` array empty).
   - Finding 10: `work/out/t13b-proof.launch/stderr.txt` (0 bytes, same empty-file SHA-256); `stdout.txt` lines whose `step` is `done`.
   - Finding 11: `python -I` `hashlib.sha256` compared with each `exit.json` `outputs` list. Launch-file hashes are in `work/evidence-manifest.json`.
   - Finding 12: brief section 1 validity condition, applied to the two `exit.json` records.

8. **Tests and outcomes:**
   - **PASS.** `identity` / `t13b-identity`. Exit code 0, `ok` true, `valid` true, `mode` `"real"`. 324/324 operations, 1096 relations evaluated, 0 failed.
   - **PASS.** `proof` / `t13b-proof`. Exit code 0, `ok` true, `valid` true, `mode` `"real"`. 324/324 operations, 1096 relations evaluated, 0 failed, reproduction evaluated 324.

9. **New versus previously established:**
   - Findings 1–5 are new real-mode records for the staged core identity in this workspace. `work/result-impl.md` reports a fake identity (`mode` `"fake"`, `ok` true, `valid` false) at the same 324/324 operations and 1096 relations. The counts agree. That fake run is a different mode from this real run.
   - Findings 6–10 are new. `work/result-impl.md` section 4 states that proof reproduction of every field against the sealed identity had not yet run on the emulator. This run's proof `completion` records reproduction evaluated 324, with `problems` `[]`.
   - The relation total 1096 evaluated and 0 failed confirms the count `work/result-impl.md` section 4 expected for these five sessions (1094 relations plus 2 writer relations).
   - Finding 12 confirms the brief's validity condition and the emulator-only limit.

10. **Remaining uncertainties.**
    - The decoded main image, resource 0106, and the OM-Emu patch were not recomputed by a separate hash in this run. Both launchers recorded `freezeSha` equal to the brief digest. Each child stdout records the two decoded-image hashes in section 2.
    - Relation totals and the reproduction count are the harness `completion` and `log.jsonl` summaries. This run did not re-evaluate each relation or each reproduced field outside those records.
    - Shell elapsed time includes wrapper time around the launcher `start`/`end` interval.

11. **Recommended next actions.**
    - Results review of this run. The implementation result names that review as the next step, with the display stage separate from this brief. This brief authorized only the two processes above.

12. **Deviations from the brief:** none. Both section 2 processes were started once, in order. Each exited 0 and each `exit.json` has `"ok": true`.
