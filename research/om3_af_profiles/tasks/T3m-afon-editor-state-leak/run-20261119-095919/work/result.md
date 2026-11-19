# T3m result

1. **Task identifier and brief version used:** T3m, brief version 2026-11-19. Agent Grok 4.7 High. Coordinator Opus 5.5. Reviewer Codex Sol. Workspace Ghidra + OM-Emu.

2. **Research baseline used:** `brief.md` and `TASK.md`. T3l `decision.md` and Sol's review `ref/tasks/T3l-afon-editor-completion/run-20261119-092300-review/review.md`. The T3l work under `ref/tasks/T3l-afon-editor-completion/run-20261119-083228/work/` (the hook, `entry_m3`, `accept_m6`, `out/profile-layout.md`, the stock measurements, and that run's `result.md`). Inherited §0 from the T3j, T5, T3b, and T3l briefs. Firmware extracts `inputs/00_0100_50000020.decoded.bin` and `inputs/02_0106_458c0020.decoded.bin`. The emulator loads `om-emu/unpacked/E147` resources 0100 and 0101; 0106 is not what `loadBlock` reads. Hashes are in `work/evidence-manifest.json`.

3. **Work performed:** Six experiment versions, in the order of brief §2. Every command went through `work/scripts/run_logged.mjs`.
   - Command 01, syntax check of `leak_p1.mjs`. Command 02, `leak_p1.mjs om-emu` (version 1, observation). Commands 03 and 06, the p1 address dumps. Commands 04 and 05, Ghidra `DisasmLeak.java`.
   - Command 07, syntax check of `leak_p2.mjs`. Command 08, `leak_p2.mjs om-emu` (version 2). It stopped because `l.wrap` had no existing hook.
   - Command 09, `mk_p3.mjs`, failed to find its source text. Command 10, `mk_p3b.mjs`, wrote `leak_p3.mjs`. Command 11, `leak_p3.mjs om-emu` (version 3). `ok:true`.
   - Commands 12 and 13, syntax checks of `accept_lib.mjs` and `accept_run.mjs`. Command 14, `accept_run.mjs om-emu` (version 4). Stopped in K1 `nativeSave`.
   - Command 15, `mk_r2.mjs`, failed to find the `nativeSave` text. Command 16, `mk_r2b.mjs`, wrote `accept_lib_r2.mjs` and `accept_run2.mjs`. Command 17, `accept_run2.mjs om-emu` (version 5). Stopped in K1 `nativeSave` with `no-image-E`.
   - Command 18, `mk_r3.mjs`, failed the same text match. Command 19, `mk_r3b.mjs`, wrote `accept_lib_r3.mjs` and `accept_run3.mjs`. Command 20, `accept_run3.mjs om-emu` (version 6). K1, K2, and c1's keys passed. c1's store compare failed. c2 and the reopen were not started.
   - Command 21, `sum_r3.mjs`, printed the command-20 row list. No further experiment version was run.

4. **Files examined:** The briefs and the T3l run named in item 2. Disassembly of `0x60063480` (0x40 bytes), `0x60063a20` (0x30), `0x6119aee0` (0x40), `0x6119b960` (0x30), `0x6119dde0` (0x24), `0x6119b380` (0x24), `0x600634e0` (0x28), `0x60063a50` (0x16), and `0x6119dd90` (0x28), written to `work/out/disasm-leak-p1.txt` and `work/out/disasm-leak-p1b.txt`. Lab sources `emu/src/lab/hle.mjs`, `emu/src/lab/menu.mjs`, `emu/host/nvram.mjs`, and `emu/src/fw/model.mjs`, hashed at execution in the import inventories.

5. **Files created:** Under `work/` only. Scripts, `work/out/` (JSONL, summaries, screenshots, nvram files, disassembly, command records, the four write-ups), `work/result.md`, `work/evidence-manifest.json`, and `work/evidence-supplement.json`. The manifest lists each file.

6. **Findings:**
   1. `OBSERVED-EMU` After an AF-ON move to 994 and an OK exit, the next normal dial writes `0x5962[1]=994` and `0x88b2[0]=994`. K1 and K2 write 526. p1 reproduced this with the accepted T3l hook and no other behaviour change.
   2. `OBSERVED-EMU` The first read on the following normal Up that is not the half-press value is the halfword at `0x62473182`, value 994, loaded by `0x6119de25`. That address is the editor object `0x62473140` plus `0x42`.
   3. `STATIC` Three copies hold 994 after the exit. `0x62953c10` is written by `0x60063519` on the AF-ON Up. `0x60379d64` is written by `0x6119af20` on the AF-ON OK, from the object's eight halfwords at +`0x42`. The accepted exit restore writes the flag and the zone byte and does not write these three copies.
   4. `OBSERVED-EMU` One EMULATOR-ONLY change, in `leak_p3.mjs`: on the AF-ON exit, write back the entry snapshot of `0x60379d64` and `0x62953c10`, and write the half-press position into the object's halfword at +`0x42`. The mirror is not written. The minimal sequence then matches K1 and K2 at every key, the AF-ON edit stays in the mirror, and the following dial leaves both live position cells at 526. `0x1e71[0]` reads 0.
   5. `OBSERVED-EMU` On the full sequence, K1 and K2 match each other at every key, including the title band, and their store files are equal (0 differing bytes). c1, with the p3 restore, matches K2 at every key through OK, MENU, and S1, through C1 and C2, and through `nativeSave`. `0x1e71[0]` reads 0 at the start of that session.
   6. `OBSERVED-EMU` c1's store differs from K2 at nine M bytes. `compareStores(K2, c1)` returns M+2 (199, 121), then M+211472, +211476, +211480, +211484 (K2 `3,3,3,3`, c1 `1,33,1,33`), then M+211504, +211508, +211512, +211516 (K2 `1,1,1,1`, c1 `5,8,5,8`). The eight spaced values are the C1 and C2 cells (`0x1dd1[2..5]` and `0x1de1[0..3]`). No other byte differs. The run ends `ok:false` on that compare. c2 and the reopen did not run.
   7. `INFERRED` The eight custom-size bytes are the mirror's C1 and C2 values, not the live half-press values. c1's half-press stayed on K2's cells while those mirror cells were written, and K2's saved bytes at those offsets are the untouched `3` and `1` defaults. M+2 is a ninth differing byte and is not one of those cells.
   8. `OBSERVED-EMU` The Z5 overlay's only section-7 bytes are `0x610bf5e3`–`0x610bf5e5`. `accept_run3.mjs` refuses any other section-6 or section-7 row before it opens a session, and the session ran.

7. **Evidence for each claim:**
   1. `work/out/leak.md`. `work/out/leak-p1.jsonl`. `work/out/leak-p1-summary.json` (`getDiffDial`).
   2. `work/out/leak.md`. `work/out/cmd/03.out` and `work/out/cmd/06.out`.
   3. `work/out/disasm-leak-p1.txt` (`0x6119af02`, the `mov 0x42,A1` and the store at `0x6119af20`). `work/out/disasm-leak-p1b.txt` (`0x60063519`, `0x60063a58`). `work/out/leak-p3-summary.json` `sessions.c.exitLeak`: shadow 526, global `ff00ff00ff00ff000000000000000000`, object `0x62473140`, object record `0e023a002002fc01d003f40328004c00`.
   4. `work/out/leak-p3.jsonl` (every row pass, `done` `ok:true`). `work/out/leak-p3-summary.json` `ok:true` and `sessions.c.subject` 0. `work/out/design.md`.
   5. `work/out/accept-r3.jsonl`. `work/out/cmd/21.out`: K1 41 rows, 0 failures; K2 41 rows, 0 failures; `k1-k2-stores` diffs `[]`; c1 keys through `save-close` pass; `candidate save` pass. Subject Detect is the read at `accept_run3.mjs` line 644, which throws before the first c1 row if the value is not 0.
   6. `work/out/accept-r3.jsonl` row `c1` / `store`, and the `done` row `ok:false`. The nine pairs are in `work/out/cmd/21.out`.
   7. `work/out/profile-layout.md` (C1 and C2). The c1 half-press asserts in `work/out/accept-r3.jsonl` (`c1-ok`, `c2-ok`, `final`). The store pairs in claim 6.
   8. `work/out/overlay-changed-bytes.csv` (section column). The section check is `accept_run3.mjs` before `runSession`, and command 20 produced the c1 rows.

8. **Tests and outcomes:**
   - Version 1, `leak_p1`: PASS as observation. The defect is reproduced and the three copies are located.
   - Version 2, `leak_p2`: FAIL. `l.wrap` threw `no hook at 0x51179ee2 to wrap`. K1 and K2 had already matched.
   - Version 3, `leak_p3`: PASS. Minimal sequence `ok:true`.
   - Version 4, `accept_run`: FAIL. K1's keys passed. `nativeSave` in `accept_lib.mjs` saw no save added inside the call.
   - Version 5, `accept_run2`: FAIL. The session log had E, and no captured E image, because that write happened before the NAND hook.
   - Version 6, `accept_run3`: FAIL. K1, K2, and c1's keys and `nativeSave` passed. K1 and K2 stores match. c1 differs from K2 at the nine bytes in claim 6. The required `ok:true` was not reached. c2 and the reopen are BOUNDARY: the runner stops at the first failed assertion, so those sessions were not started.
   - Commands 09, 15, and 18 failed as generators (text not found) and were replaced by commands 10, 16, and 19. They are not experiment versions.

9. **New versus previously established:**
   - Claim 1 confirms the T3l defect (`0x5962[1]` and `0x88b2[0]` at 994).
   - Claims 2 and 3 are new. T3l restored the flag and the zone byte. It did not name these three copies.
   - Claim 4 is new. The p3 exit restore is the one behaviour change.
   - Claim 5 confirms the T3l hook still isolates the mirror on the longer sequence, and adds the p3 restore on OK, MENU, and S1.
   - Claims 6 and 7 are new. T3l did not reach a candidate store comparison.
   - Claim 8 confirms the T3l overlay limit.

10. **Remaining uncertainties.** M+2 (K2 199, c1 121) is not mapped to a named cell. Whether the eight custom-size bytes are inside the saved mirror, or were copied into a settings record when the size editor closed, was not separated. c2 was not run, so the second candidate is unseen. The reopen (mirror back to image `FF`, zone 0, next entry initializes) was not run. Playback and session-end remain out of scope, and power-off still does not finish under these sessions.

11. **Recommended next actions.** One more acceptance run is needed before `ok:true` can be claimed. The p3 restore can stay. The store compare has to account for the nine bytes, or the custom-size edits have to stay out of the saved M image so the file matches K2. Then run c2 and the reopen on c1's store. No storage decision and no hardware recommendation come from this task.

12. **Deviations from the brief.** Six experiment versions were authorized and all six ran. Item 1 passed in `leak_p1`. Item 2 passed in `leak_p3`. Item 3's module `accept_lib.mjs` exists and is documented, and its `nativeSave` failed on version 4. The runner that reached the store compare imports `accept_lib_r3.mjs`, because `accept_lib.mjs` was already frozen. Item 4 did not end `ok:true`. c2 and the reopen were not started. No byte was added in section 6 or 7. No visible menu row was added. Values stayed in RAM.

## Owner decision Q5

The entry stays the session flag at `0xa031eef7` (cached `0x6031eef7`). Nothing in this task adds a visible menu row. The flag is how the prototype enters AF-ON mode, and the hook above is what leaves it.

Three choices remain with the coordinator:

1. Keep this session flag. No visible menu change. This is the entry the runs used.
2. Add a visible row, in the style of a page-29 row. That row is not in the prototype and was not added.
3. Use a key that opens `ID_ST_MENU_DIRECT` with the flag set. That key was not chosen.

No storage decision and no hardware recommendation.
