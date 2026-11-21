# T13 result (run-only)

1. **Task identifier and brief version used:**
   - **Task:** T13-afon-harness-opus.
   - **Brief:** `brief.md`, version 2026-11-20 (run-only stage). SHA-256 `9f9e47156659e2131c93e908422a04e76ea3163145d6187f9f241ee9bddd9684` (`OBSERVED`, `Get-FileHash`).
   - **Stage:** run the accepted acceptance harness. Design, implementation and code review are already complete (Sol `run-20261120-224009-review`, ACCEPT-CODE). This report replaces the implementation-stage `work/result.md`. That earlier text is kept as `work/result-impl-v3.md` and was not edited.
   - **Scope:** EMULATOR-ONLY. No image was built and no physical camera was used.

2. **Research baseline used:**
   - Documents read: `TASK.md`, `brief.md` (section 0 overrides the rest), `templates/result.md`.
   - Freeze digest supplied by the brief and passed as `--freeze-sha`: `819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b`.
   - `OBSERVED-EMU`: `work/out/t13-identity.launch/exit.json` records the same `freezeSha`, mode `real`, and runtime Node `v26.12.1` at `C:/Dev/OM3-research/tooling/node-v26.12.1-win-x64/node.exe` (105319752 bytes, SHA-256 `1c63f1417e2e26d83ca9a9ec1d548524ab1305bc7209d90ebca56257ff0d84ed`).
   - Container, main, resource 0106 and the OM-Emu patch were not re-hashed in this run.

3. **Work performed:**
   - One process was started, from the workspace root, with no added flags and no variables set for the command:

     `node26 work/harness/launch_v3.mjs identity t13-identity --freeze-sha 819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b`

   - **Exit code:** 1 (`OBSERVED`, shell).
   - **Duration:** launcher `start` `2026-11-21T04:03:17.368Z`, `end` `2026-11-21T04:05:55.625Z`, which is 158257 ms (`OBSERVED-EMU`, `exit.json`). The shell reported the command elapsed as 158681 ms (`OBSERVED`).
   - `exit.json`: `"ok": false`, `"valid": false`, `"mode": "real"`. A run is valid only when `ok`, `valid` and `mode` are `true`, `true` and `"real"`. This run is not valid.
   - **`problems`, verbatim:**

     ```json
     [
       "child exit 1",
       "completion not ok: Error: disp-seed-a NavError: idle slice to 4272753460 ns: stopped at 0xa2100007 (disasm 0x920defe7) fault=5: om-emu: scpu command 0x20041001 pc 0x60070b3e #1 (reg0 0x00000000 e8 0x00000000 ec 0x00000000)",
       "completion plan module differs",
       "completion does not list exactly the plan operations (0/432)",
       "completion relations",
       "completion has no identity seal",
       "refresh records for [], plan needs [\"disp-seed-a\",\"disp-seed-b\",\"disp-k2\",\"disp-k1\"]"
     ]
     ```

   - **From `completion` in `exit.json`:** operations executed 0, expected 432. `relations`, `reproduction` and `pressReference` are absent. `identity` is null. `recorder` is `[]`, so the refresh-record count is 0.
   - Section 0 required a stop here. The proof and four display processes were not started.

4. **Files examined:**
   - `TASK.md`, `brief.md`, `templates/result.md`.
   - `work/out/t13-identity.launch/exit.json`, `stderr.txt`, `stdout.txt`.
   - `work/out/t13-identity/complete.json`, `log.jsonl` (first line and lines 303–332; search for `"pass":false` and for writer-call / `disp-` ids).
   - Read to name the in-progress operation, which `log.jsonl` does not record: `work/harness/plan_v1.mjs` (`SETUP`, `displaySession`), `work/harness/gate_v2.mjs` (`perform`), `work/harness/exitcheck_v3.mjs` (`checkCompletion`).

5. **Files created:**
   - The launcher wrote `work/out/t13-identity/` (71 files) and `work/out/t13-identity.launch/` (6 files). Every file is listed in `work/evidence-manifest.json`.
   - This run wrote `work/result.md` and `work/evidence-manifest.json`.
   - `work/result-impl-v3.md` and `work/evidence-manifest-impl-v3.json` were left unchanged.

6. **Findings:**
   1. `OBSERVED-EMU`. The identity process exited 1. `exit.json` has `ok` false, `valid` false, `mode` `"real"`, `childExit` 1, `plan` `"identity"`, `tag` `"t13-identity"`.
   2. `OBSERVED-EMU`. `complete.json` `ok` is false. Its `error` is the `disp-seed-a` `NavError` quoted in finding 6. `inventoryProblems` is `[]`. `stderr.txt` is that same exception (18 lines).
   3. `OBSERVED-EMU`. `log.jsonl` has 332 lines. Line 1 is the plan record (`mode` `"real"`, `pressReference` `"k1e-s1-down-halfTarget"`, sessions `k1e`, `k2`, `candidate`, `zk1e`, `zcand`, `disp-seed-a`, `disp-seed-b`, `disp-k2`, `disp-k1`). Lines 2–332 are operation rows. A search found no `"pass":false`. The last row is `disp-seed-a-take-focus-settle` with `"pass":true` and `"problems":[]`.
   4. `OBSERVED-EMU`. Logged writer-call rows with `"pass":true` and `"problems":[]`: `candidate-writer-calls` (line 118), `zcand-writer-calls` (line 327). The next rows are `disp-seed-a` setup operations, lines 328–332, each `"pass":true` and `"problems":[]`.
   5. `INFERRED`. `log.jsonl` has no failing operation row. `complete.json` `error` is thrown from `gate.perform` during `idle` (`gate_v2.mjs:70`, `session_v2.mjs:382`) before another log row could be written. `plan_v1.mjs` `SETUP` places `lever` (`idleMs` 400) immediately after `take-focus-settle`, and `displaySession` prefixes the id with `disp-seed-a`, so the operation in progress is `disp-seed-a-lever`. That id is not in `log.jsonl`. Its problems were not recorded as an operation row; the exception text is finding 6.
   6. `OBSERVED-EMU`. Exception text, verbatim, from `work/out/t13-identity.launch/stderr.txt`:

      ```
      Error: disp-seed-a NavError: idle slice to 4272753460 ns: stopped at 0xa2100007 (disasm 0x920defe7) fault=5: om-emu: scpu command 0x20041001 pc 0x60070b3e #1 (reg0 0x00000000 e8 0x00000000 ec 0x00000000)
      om-emu: vsc ERROR UNWRITTEN pc 0xa2100400 ch 2 off 0x04e0 value 0x00000000 args 0x0 0x0 0x0
      om-emu: vsc ERROR PAL_UNWRITTEN pc 0xa2100400 ch 2 off 0x4c00 value 0x0007926a args 0x4 0xff 0x0
      om-emu: MN10300 trap reason=5 pc=0xa2100007 address=0xa2100007
        step idle; GUI state 0x0108 SS_COMMON/ID_ST_CA_REQ_DISP; messages taken []; GESetEvent 0 from []; hook stops 86, top [["get_tid(scoped)", 42], ["OlySmSi(native)", 6], ["OlySmWt(native)", 6], ["memset", 5], ["OlyQeRd(S-DISPQ DISPLAY cmd 16)", 4], ["S-MODACK", 3], ["obs-tsnd", 2], ["obs-tsnd-return-5002c1f8", 2], ["S-HISTEND", 2], ["idle", 2]]; kernel events ["[\"errlog\", \"0x39000903\", \"0x3 0x304 0x304 0x0 0x62460830 0x6047ef05\", \"0x6046eedf (disasm 0x5044debf", "[\"errlog\", \"0x39000903\", \"0x3 0x304 0x304 0x0 0x62460830 0x6047ef05\", \"0x6046eedf (disasm 0x5044debf", "[\"rtos\", \"OlyEvCl\", \"d0=0x100 d1=0x0\", \"0x6020d407 (disasm 0x501ec3e7)\"]", "[\"rtos\", \"OlyEvWt\", \"d0=0x100 d1=0x1 a0=0xa20efe58\", \"0x6020d427 (disasm 0x501ec407)\"]", "[\"rtos\", \"iOlyEvSt\", \"d0=0x100 d1=0x1 a0=0x62f1dcb4\", \"0x6020d2a1 (disasm 0x501ec281)\"]", "[\"print\", \"puts2\", \"damage_info uninitialized!\\n\", \"0x60024d24 (disasm 0x50003d04)\"]"]; tasks {2: "0x5089b8ac WAI", 10: "0x50044861 WAI", 13: "0x508ae684 WAI", 14: "0x508b3770 WAI", 16: "0x500541a0 WAI", 58: "0x50ac6296 WAI", 59: "0x5105fd77 WAI", 85: "0x50156805 WAI", 91: "0x502d0ceb WAI", 92: "0x5011f82d WAI", 93: "0x502ce98f WAI", 105: "0x509be82d WAI", 122: "0x5005806c WAI", 140: "0x501d3ec8 WAI", 147: "0x501e3eca WAI", 160: "0xa2300100 RUN", 161: "0x50db7bf8 WAI", 162: "0x50acc3fd WAI", 163: "0x50ace582 WAI", 164: "0x50acff91 WAI", 165: "0x510a711e WAI", 166: "0x510a711e WAI", 167: "0x510db30f WAI", 168: "0x51179075 WAI"}
          at PlaySession.idle_slice (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/om-emu/emu/src/lab/play.mjs:1728:45)
          at Object.idle (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/session_v2.mjs:382:92)
          at Object.idle (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/real_v2.mjs:181:23)
          at Object.perform (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/gate_v2.mjs:70:30)
          at adapter.runSession.presence.presence (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/exec_v2.mjs:109:30)
          at async driveSession (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/real_v2.mjs:228:3)
          at async drive (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/real_v2.mjs:61:11)
          at async runZone (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/session_v2.mjs:502:5)
          at async Object.runSession (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/real_v2.mjs:48:22)
          at async runPlan (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/exec_v2.mjs:96:5)
          at Object.runSession (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/real_v2.mjs:64:29)
          at async runPlan (file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/exec_v2.mjs:96:5)
          at async file:///C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/run_v3.mjs:133:22
      ```

   7. `OBSERVED-EMU`. Because `complete.json` is an error record, `checkCompletion` reports executed length 0 against 432 expected operations, missing relations, no identity seal, and refresh sessions `[]` where the plan needs `disp-seed-a`, `disp-seed-b`, `disp-k2`, `disp-k1`. `planSha` is absent, which is the "completion plan module differs" problem.
   8. `OBSERVED-EMU`. `stdout.txt` line 1 is the child nonce echo. Later lines record sessions `k1e`, `k2`, `candidate`, `zk1e` and `zcand` reaching `"step":"done","ok":true`. The `disp-seed-a` done hook is `"ok":false` with the same `NavError`.
   9. `OBSERVED`. `Get-FileHash` SHA-256 of the 71 files in `work/out/t13-identity/`, in directory order, matches the `outputs` hashes and byte lengths in `exit.json`.
   10. `INFERRED`. No claim is made about stock-camera behaviour, packaging, or hardware. The records are emulator-run records.

7. **Evidence for each claim:**
   - Finding 1: `work/out/t13-identity.launch/exit.json` (`ok`, `valid`, `mode`, `childExit`, `start`, `end`, `problems`, `completion`). Shell exit code 1, elapsed 158681 ms.
   - Finding 2: `work/out/t13-identity/complete.json` (`ok`, `error`, `inventoryProblems`); `work/out/t13-identity.launch/stderr.txt`.
   - Findings 3–4: `work/out/t13-identity/log.jsonl` lines 1, 118, 327–332. No line contains `"pass":false`.
   - Finding 5: `work/harness/plan_v1.mjs` `SETUP` entries `take-focus-settle` then `lever`; `displaySession` id prefix `disp-` + job. `work/harness/gate_v2.mjs` calls `deps.idle` when `op.idleMs` is set. The id `disp-seed-a-lever` is not a `log.jsonl` row.
   - Finding 6: `stderr.txt` in full, and the same text as `complete.json` `error`.
   - Finding 7: `work/harness/exitcheck_v3.mjs` `checkCompletion`; `exit.json` `problems` and `completion`.
   - Finding 8: `work/out/t13-identity.launch/stdout.txt` (nonce line; done hooks for `k1e`, `k2`, `candidate`, `zk1e`, `zcand`, `disp-seed-a`).
   - Finding 9: `Get-FileHash -Algorithm SHA256` on `work/out/t13-identity` compared with `exit.json` `outputs`. Launch-file hashes are in `work/evidence-manifest.json`.

8. **Tests and outcomes:**
   - **FAIL.** `identity` / `t13-identity`. Exit code 1, `ok` false, `valid` false, `mode` `"real"`.
   - **BOUNDARY.** `proof` / `t13-proof` was not started.
   - **BOUNDARY.** `display-a` / `t13-display-a` was not started.
   - **BOUNDARY.** `display-b` / `t13-display-b` was not started.
   - **BOUNDARY.** `display-k2` / `t13-display-k2` was not started.
   - **BOUNDARY.** `display-k1` / `t13-display-k1` was not started.

9. **New versus previously established:**
   - Finding 1 is new: the first real-mode identity launch of this accepted harness in this workspace. The implementation-stage fake identity (`work/result-impl-v3.md`, tag `fake-identity`, `mode` `"fake"`, `valid` false, `ok` true, 432/432) is a different mode and is not confirmed or contradicted as a real run.
   - Findings 2–8 are new real-mode records.
   - Finding 10 confirms the brief's emulator-only limit.

10. **Remaining uncertainties.**
    - `disp-seed-a-lever` is inferred from plan order and the idle stack. `log.jsonl` does not name it.
    - Relation totals for the 331 logged passing rows were not summed. The completion record has no `relations` field.
    - Input image hashes and the OM-Emu patch hash were not recomputed in this run. The launcher recorded `freezeSha` equal to the brief digest.

11. **Recommended next actions.**
    - Stop. A retry, another tag, or a diagnostic process needs the coordinator's written authorization (brief section 0).

12. **Deviations from the brief:** none. The five later commands were not started because the identity process exited 1 and `exit.json` has `"ok": false`.
