# T3c result

1. **Task identifier and brief version used:** T3c, route the AF-ON zone row to a stock editor. Brief version 2026-11-18, including section 7 (correction after Sol's review `run-20261118-073208-review`). Agent Grok 4.7 High.

2. **Research baseline used:** `TASK.md`; `brief.md`; `templates/result.md`; T3a `decision.md`; T3a brief sections 4 and 7; `AFON-MENU-RESEARCH.md` section 6; `PROJECT-STATE.md` sections 1–3; the prior T3c result and Sol's review in `audit/previous-review.md`. Decompiled `FUN_6124f6c7` was checked against `work/out/disasm-ok-dispatch-c1.txt`. Also read: `FUN_61283b1c`, `FUN_6119a2be`, `FUN_61203082`, `FUN_6120308d`, `FUN_611c7894`, `FUN_6041937f`, `FUN_60063431`, `FUN_610cdebf`, `FUN_610cdf05`. Input hashes are in `work/evidence-manifest.json`. OM-Emu source was not modified. The earlier command records have no `.exit` files; those exits were not reconstructed.

3. **Work performed:** Kept the Phase A traces and the four Phase B prototypes. Added isolated experiments E1, E3 and E4, plus an observation of the method pointer. E2 was not run. No acceptance run. New commands go through `work/scripts/run_logged.mjs`. Representative commands:

- `node26 work/scripts/run_logged.mjs 40-static-c1 python -I work/scripts/static_rows_c1.py`
- `node26 work/scripts/run_logged.mjs 41-ghidra-c1 cmd.exe /d /s /c tools\bin\run-ghidra.cmd -postScript DisasmRangesA3.java 6124f6c7 220 work\out\disasm-ok-dispatch-c1.txt -log work\out\ghidra-ok-dispatch-c1.log`
- `node26 work/scripts/run_logged.mjs 44-e1-c1 cmd.exe /d /s /c node26 work/scripts/exp_e1_c1.mjs om-emu work/out/exp-e1-c1.jsonl`
- `node26 work/scripts/run_logged.mjs 45-e3-c1 cmd.exe /d /s /c node26 work/scripts/exp_e3_c1.mjs om-emu work/out/exp-e3-c1.jsonl`
- `node26 work/scripts/run_logged.mjs 46-e4-c1 cmd.exe /d /s /c node26 work/scripts/exp_e4_c1.mjs om-emu work/out/exp-e4-c1.jsonl`
- `node26 work/scripts/run_logged.mjs 47-method-c1 cmd.exe /d /s /c node26 work/scripts/route_method_c1.mjs om-emu work/out/trace-method-c1.jsonl`

4. **Files examined:** `inputs/00_0100_50000020.decoded.bin`. Rows `0x6158dc44`, `0x6158dc68`, overlay row `0x6031e978`. Option lists `0x6158ba04` and `0x6158ba1c`. Dispatch `FUN_6124f6c7` (`0x6124f6c7`–`0x6124f800`), caller `FUN_61283b1c`, `FUN_6119a2be`, `FUN_61203082`, `FUN_6120308d`. Chooser path `FUN_610cdebf`, `FUN_610cdf05`, `FUN_610e2536`. Descriptors `0x6062132c` and `0x6031e9a0`.

5. **Files created:** Everything listed in `work/evidence-manifest.json`. Reports: `work/out/phaseA.md`, `work/out/design.md`, `work/out/overlay-changed-bytes.csv` (T3a's 140 bytes; the correction added no overlay addresses), `work/result.md`.

6. **Findings:**

1. OK on 2154 and OK on 2155 open the two-option chooser through `FUN_610cdebf` → `FUN_610cdf05` → `FUN_610e2536`. `OBSERVED-EMU`
2. The same OK enters other functions in the `0x610e` range for `0x3D6F`, including `FUN_610e5fe1`. It does not enter `FUN_610cdebf`. `OBSERVED-EMU`
3. The branch that separates those paths is `FUN_6124f6c7` at `0x6124f7d4` (`cmp 1, D0`) and `0x6124f7d8` (`cmp 0, D2`), on key `0x900C`. `STATIC` `OBSERVED-EMU`
4. At that compare, D0 is 4 and D2 is 0 for 2154, 2155 and C-AF Area. D0 is 1 and D2 is 0 for `0x3D6F`. `OBSERVED-EMU`
5. D0 is the return of `FUN_6119a2be`. That function calls `FUN_61203082`, which calls `FUN_6120308d`. Both 2154 and `0x3D6F` enter `FUN_6120308d`. `OBSERVED-EMU` `STATIC`
6. E1, copying 2154's row except the setting id, still returns D0 1 and does not open a chooser. The profile byte stays 0. `0x90a1` stays `[1, 1]`. `OBSERVED-EMU`
7. E3, copying all 36 bytes including id 2154 while the provider list still says `0x3D6F`, draws two rows. OK returns D0 1. `OBSERVED-EMU`
8. E4, changing only that provider id to 2154, draws three rows and opens 2154's chooser. D0 is 4. `0x90a1` stays `[1, 1]`. `OBSERVED-EMU`
9. `FUN_60419446(2154)` returns `0x90A1`. `FUN_60419446(0x3D6F)` returns 0 before the value hook. The linked descriptor `0x6031e9a0` has template `0x606178b1` and count 10; 2154's descriptor `0x6062132c` has template `0x606190b7` and count 2. `OBSERVED-EMU` `DATA`
10. `FUN_611c7894` copies up to a halfword count of bytes. It does not build a chooser or call a setter. `STATIC`
11. In the handler table, the u32 reference search, and the direct-call search, no route to page 28 or 29 was found. Reference-constructed pages 28 and 29 stay up on OK. The endpoint snapshots change `0x1dd1[0,1]` from 3,3 to 27,39 and leave the listed AF Home cells unchanged. `STATIC` `OBSERVED-EMU`
12. R1 is BLOCKED. A code change that makes the chain return 4 for `0x3D6F` was not run. `INFERRED`
13. On the reference-constructed page 29, OK did not enter a target editor, so that editor's reads and writes were not observed. `OBSERVED-EMU`

7. **Evidence for each claim:** (1) `work/out/trace-a1.jsonl`, `work/out/exp-e1-c1.jsonl` step `2154`, body entry `0x610e2536` from `0x610cdf98`. (2) `work/out/trace-a1.jsonl` step `3d6f`; `work/out/trace-open-a7.jsonl`. (3) `work/out/disasm-ok-dispatch-c1.txt` `0x6124f7d4`–`0x6124f7e4`; `FUN_61283b1c` calls `FUN_6124f6c7` and calls `FUN_6127e750` when the return is 3. (4) `work/out/exp-e1-c1.jsonl` steps `2154`, `2155`, `baseline-3d6f`; `work/out/exp-e3-c1.jsonl` step `caf-area`. (5) `work/out/exp-e4-c1.jsonl` virtual record `method68` `FUN_61203082`; `work/out/trace-method-c1.jsonl` `at50` `FUN_6120308d`; `61203082.c` and `6120308d.c`. (6) `work/out/exp-e1-c1.jsonl` steps `e1-row` and `e1`. (7) `work/out/exp-e3-c1.jsonl` steps `page` and `e3-duplicate`. (8) `work/out/exp-e4-c1.jsonl` steps `page`, `e4`, `done`. (9) `work/out/exp-e4-c1.jsonl` step `registration`. `0x90A1` is 37025. (10) `611c7894.c`. (11) `work/out/static-route-a1.txt`; `work/out/page28-a3.jsonl`; `work/out/page29-a3.jsonl`. (12) `work/out/design.md`. (13) `work/out/page29-a3.jsonl`.

8. **Tests and outcomes:**

- Phase A traces: BOUNDARY. They record arguments and screens.
- Page 28 and page 29 reference construction: BOUNDARY. The pages rendered. OK did not open an editor. Endpoint readback is in finding 11.
- Prototypes v1–v4: FAIL. No chooser. Setter not called. Profile stayed 0.
- E1: FAIL. No chooser. Setter not called. Profile stayed 0. `0x90a1` stayed `[1, 1]`.
- E2: not run.
- E3: FAIL. The duplicate row was not drawn. No chooser.
- E4: BOUNDARY. 2154's chooser opened from the third slot. It is not an editor for `0x3D6F`. No `0x3D6F` setter call. `0x90a1` stayed `[1, 1]`.
- Acceptance: not run.

9. **New versus previously established:** (1) confirms T3a for the chooser path, and narrows the earlier wording that said the whole `0x610e` family. (2) corrects the previous result's claim that `0x3D6F` does not enter that family: the supported distinction is the chooser path. (3) new. (4) new. The `FUN_611f703b` compare remains a non-split, as in the previous result. (5) new. (6) new. (7) new. (8) new. (9) confirms the T3a descriptor link and adds the native mapped-getter returns. (10) withdraws the previous result's reading of `FUN_611c7894` as an editor. (11) confirms the previous endpoint snapshots, bounded to the searches and the readback. (12) corrects the previous "possible with code" wording: the code was not shown to work. (13) confirms the page 29 OK result, without a claim about every other key.

10. **Remaining uncertainties:** The instruction inside `FUN_6120308d`'s callee that chooses 4 or 1 was not separated from the rest of that call. E4 shows that provider id 2154 produces 4; it does not show whether `0x3D6F` would produce 4 if only its mapped key, or only its descriptor template, were copied from 2154. Page 28 and 29 still have no settings-write trace. A native route through a computed id was not ruled out.

11. **Recommended next actions:** One experiment, on the E1 row, that changes only the native mapped-getter result for `0x3D6F` from 0 to a stock chooser key, or only the descriptor template and count, and records D0 at `0x6124f7d4`. Do not treat `FUN_611c7894` as that experiment. Do not run acceptance until a chooser for `0x3D6F` opens and the setter stores the profile byte. R2 stays with T3b.

12. **Deviations from the brief:** Acceptance was not run, because no `0x3D6F` chooser opened. E2 was not run, because E1 did not open a chooser. Command records from the first round have stdout and stderr for most commands and no `.exit` files; `write_manifest_a11.py` had hard-coded those exits. They were not reconstructed. `42-e1-c1` is a failed spawn (`node26` is a `.cmd`, so `spawnSync` without `cmd.exe` returned ENOENT); the experiment ran as `44-e1-c1`. Prototype v2 overwrote `work/out/proto-r1-v1-page.png` and `work/out/proto-r1-v1-open.png`. No firmware image was written.

**Labelling errata.** Observation hooks are the `obs-*` callbacks. Behaviour-changing hooks are the four value hooks, the descriptor-link writes, the section-7 pointer writes, and the E1/E3/E4 row or provider writes.

- `trace-a1.jsonl`, `trace-decision-a2.jsonl`, `trace-kind-a3.jsonl`, `proto-r1-v1.jsonl`, `proto-r1-v2.jsonl`, `proto-r1-v3.jsonl`, `proto-r1-v4.jsonl`: every line is stamped `hook: EMULATOR-ONLY`. The value hooks, the descriptor link, and the prototype byte writes are behaviour. The trace and screenshot lines are observations recorded in that same session.
- `trace-open-a7.jsonl`, `trace-build-a8.jsonl`, `trace-slot-a4.jsonl`, `trace-slot-a5.jsonl`, `trace-act-a6.jsonl`, `trace-who-a10.jsonl`: stamped `hook: observe`. Each of those sessions also installed the behaviour-changing value hooks and the section-7 redirects.
- `link-diag-a9.jsonl`: no emulator-only label. The writes of the descriptor node at `0x6031e9b8` and the bucket head are EMULATOR-ONLY behaviour. The lookup calls are observation.
- `page28-a3.jsonl` and `page29-a3.jsonl`: the source and page-id rewrites are marked EMULATOR-ONLY reference construction. The lines that only record list type and screens are observations.
- `exp-e1-c1.jsonl`, `exp-e3-c1.jsonl`, `exp-e4-c1.jsonl`: lines with `role: behaviour` are the runtime writes. Lines with `role: observe` are observations taken while the behaviour hooks were installed.
- `trace-method-c1.jsonl`: observations only, in a session that also had the behaviour hooks installed.
