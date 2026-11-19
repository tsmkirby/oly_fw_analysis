# T3m result

1. **Task identifier and brief version used:** T3m, brief version 2026-11-19, including the correction in brief §5 after Sol's review `run-20261119-111407-review` (REJECT). Agent Grok 4.7. Coordinator Opus. Reviewer Codex Sol. Workspace Ghidra + OM-Emu.

2. **Research baseline used:** `brief.md` and `TASK.md`. Sol's review `audit/previous-review.md`. T3l `decision.md` and Sol's T3l review `ref/tasks/T3l-afon-editor-completion/run-20261119-092300-review/review.md`. The T3l work under `ref/tasks/T3l-afon-editor-completion/run-20261119-083228/work/`. Inherited §0 from the T3j, T5, T3b, and T3l briefs. The T6 save procedure `ref/analysis/button-af/readiness/t6-afon-target-size-position/scripts/save_v3.mjs` and its table `out/save-table-v3.json`. Firmware extracts `inputs/00_0100_50000020.decoded.bin` and `inputs/02_0106_458c0020.decoded.bin`. The emulator loads `om-emu/unpacked/E147` resources 0100 and 0101; 0106 is not what `loadBlock` reads. Stock measurements hashed one by one are listed in `work/evidence-manifest.json` under `stock_measurements`. Hashes of the briefs and extracts are in that manifest.

3. **Work performed:** The first round used six experiment versions (brief §2), commands 01–21, sealed by command 22 and supplement command 23. The correction round was authorized six new experiment versions. All six ran. Every command went through `work/scripts/run_logged.mjs`.
   - Command 24, syntax check of `persist_v1.mjs`. Command 25, `persist_v1.mjs om-emu` (correction version 1). It stopped after K2 when the summary object was written before it existed.
   - Command 26, syntax check of `persist_v1b.mjs`. Command 27, `persist_v1b.mjs om-emu` (correction version 2, the observation). `ok:true`. Command 28, `show_persist_v1b.mjs`, printed the watch log. Not an experiment version.
   - Command 29, syntax check of `fix_v1.mjs`. Command 30, `fix_v1.mjs om-emu` (correction version 3, the one behaviour change). `ok:true`. `compareStores` returned no differences.
   - Command 31, syntax check of `save_v1.mjs`. Command 32, `save_v1.mjs om-emu` (correction version 4). The T6 keys were replayed in the same session and landed on Wireless Shutter. No new E or M.
   - Command 33, a print of that session's screens. Not an experiment version.
   - Command 34, syntax check of `save_v2.mjs`. Command 35, `save_v2.mjs om-emu` (correction version 5). A fresh session reached the AF Button page. The new witness recorded two posted M saves with images and status 0, and no new E. The commit highlighted Priority, not AF Target Mode.
   - Command 36, syntax check of `accept_v4.mjs`. Command 37, syntax check of `accept_lib_v4.mjs`. Command 38, `accept_v4.mjs om-emu` (correction version 6). It stopped on K1 at `n1-up` because `fromControl` required a K1 row that K1 was about to create. No further experiment version was authorized.
   - Command 39, `section_rows_t3m.py`, computed each overlay row's section from the image. Not an experiment version.

4. **Files examined:** The briefs, Sol's review, and the T3l and T6 runs named in item 2. Disassembly listings in `work/out/disasm-leak-p1.txt` and `work/out/disasm-leak-p1b.txt`. `DisasmLeak.java` takes a decimal instruction count per range, and the listing walks that many instructions. The counts in the first-round write-up (0x40, 0x30, 0x28, and the others) are those instruction counts, not byte lengths. Lab sources `emu/src/lab/menu.mjs`, `emu/host/nvram.mjs`, and `emu/src/fw/model.mjs`, hashed at execution in the import inventories.

5. **Files created:** Under `work/` only. The first-round scripts and outputs remain. The correction added `persist_v1.mjs`, `persist_v1b.mjs`, `show_persist_v1b.mjs`, `fix_v1.mjs`, `save_v1.mjs`, `save_v2.mjs`, `accept_v4.mjs`, `accept_lib_v4.mjs`, `section_rows_t3m.py`, their JSONL, summaries, screenshots, nvram files, and command records. `work/out/overlay-changed-bytes-sections.csv` is the section column computed from the image. The original `overlay-changed-bytes.csv` is unchanged because the experiment runs read it. `work/result.md` and `work/evidence-manifest.json` are this round's write-up. The manifest lists each file.

6. **Findings:**
   1. `OBSERVED-EMU` After an AF-ON move to 994 and an OK exit, the next normal dial writes `0x5962[1]=994` and `0x88b2[0]=994`. K1 and K2 write 526. p1 reproduced this with the accepted T3l hook and no other behaviour change.
   2. `OBSERVED-EMU` Among the reads p1 watched on the following normal Up, an early differing value is the halfword at `0x62473182`, value 994, loaded by `0x6119de25`. That address is the editor object `0x62473140` plus `0x42`. This is not the first difference across every position-feeding read. K2's watch is `WATCH_POS` and does not include the object field.
   3. `STATIC` Three copies hold 994 after the exit. `0x62953c10` is written by `0x60063519` on the AF-ON Up. `0x60379d64` is written by `0x6119af20` on the AF-ON OK, from the object's eight halfwords at +`0x42`. The p1 object-writer aggregate records `0x6119ddb8`, two writes, and keeps the first value 0. The final 994 is visible afterwards. The writes between that 0 and the final 994 were not retained. The accepted exit restore writes the flag and the zone byte and does not write these three copies.
   4. `OBSERVED-EMU` One EMULATOR-ONLY change, in `leak_p3.mjs`: on the AF-ON exit, write back the entry snapshot of `0x60379d64` and `0x62953c10`, and write the half-press position into the object's halfword at +`0x42`. The mirror is not written. The minimal sequence then matches K1 and K2 at every key, the AF-ON edit stays in the mirror, and the following dial leaves both live position cells at 526. `0x1e71[0]` reads 0.
   5. `OBSERVED-EMU` On the full sequence, K1 and K2 match each other at every key, including the title band, and their store files are equal (0 differing bytes). c1, with the p3 restore, matches K2 at every key through OK, MENU, and S1, through C1 and C2, and through `nativeSave`. `0x1e71[0]` reads 0 at the start of that session.
   6. `OBSERVED-EMU` c1's store differs from K2 at nine M bytes. `compareStores(K2, c1)` returns M+2 (199, 121), then M+211472, +211476, +211480, +211484 (K2 `3,3,3,3`, c1 `1,33,1,33`), then M+211504, +211508, +211512, +211516 (K2 `1,1,1,1`, c1 `5,8,5,8`). The eight spaced values are the C1 and C2 cells (`0x1dd1[2..5]` and `0x1de1[0..3]`). No other byte differs. The run ends `ok:false` on that compare. c2 and the reopen did not run.
   7. `DATA` M+2 is the M-bank checksum word. Sol accounted for it: the word compensates for the eight payload bytes, and the bank's 16-bit word sum is zero. It moves when those eight bytes move, and it matches K2 again when they are restored.
   8. `OBSERVED-EMU` The RAM the save serialises M+211472…+211516 from is the settings bank at `0x62920700`. Offset 211464 is `0x62954108`: ten little-endian words for `0x1dd1`, then eight for `0x1de1`. The packed live cells are a different place in the same bank (`0x1dd1` live is `0x62920982`). During the candidate sub-dial, with the flag at 1, `0x60063519` writes the word and `0x6006351b` writes the uncached alias, caller `mdr` `0x600634fc`. The setter hook at `0x60063431` is entered after that store, from `0x604193c7`, and `finish()` skips the packed-byte store at `0x6006354e`. The live cells stay at K2's values. This is the editor commit, not a getter read at save time. `0x1df1` is not in the word record. The watched set is the bank window, the live cells, the mirror slots, and the getter and setter logs for `0x1dd1`, `0x1de1`, and `0x1df1`. On the shared step ids, the unedited K2 session writes none of those slots. The same keys without the flag (`k2e`) write the word and then the packed live byte. That comparison is exhaustive for the watched set. It is not a trace of every instruction.
   9. `OBSERVED-EMU` `fix_v1` adds one EMULATOR-ONLY change on top of the p3 restore: at AF-ON entry, snapshot the 72 bytes at `0x62954108`; on every exit, write them back to that address and its uncached alias. The mirror is not written. On AF-ON entry, C1, C2, exit, and the session's save, `compareStores(K2, candidate)` returns zero offsets. After C2 the mirror holds `0x1dd1[2]=1`, `[3]=33`, `[4]=1`, `[5]=33`, `0x1de1[0]=5`, `[1]=8`, `[2]=5`, `[3]=8`, `0x1df1[4]=1`, `[5]=1`. The live `0x1dd1[2..5]` stay 3 and the live `0x1de1` stays 1. `0x1e71[0]` reads 0.
   10. `OBSERVED-EMU` Replaying the T6 key table inside the editor session does not perform the T6 commit. The menu reopens on the last tab, twenty Left keys reach Wireless Shutter, and the store log does not grow. A fresh session on the saved file does reach the AF Button page. Its witness, snapshotted before those keys, records two new posted M saves from `0x60061268`, each with a captured image and callback status 0. It records no new E. The highlighted row at the commit is Priority. The AF Target Mode row that T6's own `a-commit` changes is not on the page. The half-press word check and the K2 compare were not reached.
   11. `DATA` The overlay section of each changed byte, read from the image section table at `0x60029b28`, is section 1 for 1308 rows, section 2 for 95, section 4 for 1856, and section 7 for 3. The only section-6 or section-7 rows are `0x610bf5e3`–`0x610bf5e5`. The CSV has 3262 rows. The prose section-7 label in `overlay-changed-bytes.csv` is what `Number(section)` turns into NaN. The computed column is the decimal section number.

7. **Evidence for each claim:**
   1. `work/out/leak.md`. `work/out/leak-p1.jsonl`. `work/out/leak-p1-summary.json` (`getDiffDial`).
   2. `work/out/leak.md`. `work/out/cmd/03.out` and `work/out/cmd/06.out`. The watch limit is the qualification in claim 2.
   3. `work/out/disasm-leak-p1.txt` (`0x6119af02`, the `mov 0x42,A1` and the store at `0x6119af20`). `work/out/disasm-leak-p1b.txt`. `work/out/leak-p3-summary.json` `sessions.c.exitLeak`. The object-writer aggregate is the p1 writer summary named in `work/out/leak.md`.
   4. `work/out/leak-p3.jsonl` (every row pass, `done` `ok:true`). `work/out/leak-p3-summary.json`. `work/out/design.md`.
   5. `work/out/accept-r3.jsonl`. `work/out/cmd/21.out`. Subject Detect is the read in `accept_run3.mjs` that throws before the first c1 row if the value is not 0.
   6. `work/out/accept-r3.jsonl` row `c1` / `store`, and the `done` row `ok:false`. The nine pairs are in `work/out/cmd/21.out`. The logged difference list there is truncated to 80; these nine are the whole list.
   7. Sol's review, and `work/out/fix-v1-summary.json` `stores.cMinusK2` `[]`, which includes M+2 once the eight payload bytes match.
   8. `work/out/persist-v1b.jsonl`, `work/out/persist-v1b-events.jsonl`, `work/out/cmd/28.out`, and `work/out/persist-v1b-summary.json`. The word stores are the `c1-sub` and `c2-sub` rows: pc `0x60063519`, then the alias at `0x6006351b`, then the setter log at `0x60063431`.
   9. `work/out/fix-v1.jsonl` `done` `ok:true` and `compare` / `stores` pass. `work/out/fix-v1-summary.json` `stores.cCount` 0 and `sessions.c.mirror`.
   10. `work/out/save-v1.jsonl` `t6-save` problems `no-new-M`, `no-new-E`, `no-posted-M-callback`, and `work/out/save-v1-k2-50-t6-page27.png` (Wireless Shutter). `work/out/save-v2.jsonl` `k2t6` / `t6-save`: `beforeLog` 0, two posted M rows, status 0, no E. `work/out/save-v2-k2t6-34-t6-a-commit.png` shows Priority. T6's own `save-v3-a-commit.png` shows AF Target Mode Single, and `save-v3.jsonl` records E from `0x6006124a` plus the posted M.
   11. `work/out/section-rows-t3m.json` (`table` `0x60029b28`, counts, `ok` true) and `work/out/overlay-changed-bytes-sections.csv`. `work/out/cmd/39.out`.

8. **Tests and outcomes:**
   - First round, versions 1–6: `leak_p1` PASS as observation. `leak_p2` FAIL (`no hook at 0x51179ee2`). `leak_p3` PASS. `accept_run` FAIL (`nativeSave` saw no save inside the call). `accept_run2` FAIL (`no-image-E`). `accept_run3` FAIL (nine-byte store difference). c2 and the reopen were not started.
   - Correction version 1, `persist_v1`: FAIL. K2 finished. The summary write threw. The K2 trace is in `work/out/persist-v1.jsonl`.
   - Correction version 2, `persist_v1b`: PASS as observation. The store inequality is the finding. `0x1e71[0]` is 0 on k2, c, and k2e.
   - Correction version 3, `fix_v1`: PASS. Zero store differences, mirror holds C1 and C2, live half-press custom-size cells unchanged.
   - Correction version 4, `save_v1`: FAIL. The T6 keys in that session did not cause a new E or a new M.
   - Correction version 5, `save_v2`: FAIL. New posted M images with status 0 were recorded after the snapshot. No new E. The commit was not the AF Target Mode commit from the T6 table.
   - Correction version 6, `accept_v4`: FAIL. Stopped on K1 before any candidate, any save, or any store compare. `accept_lib_v4.mjs` is imported and was not exercised past that throw.
   - The six correction versions are spent. Acceptance did not end `ok:true`.

9. **New versus previously established:**
   - Claim 1 confirms the T3l defect.
   - Claims 2 and 3 confirm the p1 copies, with the qualifications Sol required.
   - Claim 4 confirms `leak_p3`.
   - Claims 5 and 6 confirm the first-round acceptance run.
   - Claim 7 confirms Sol's checksum account.
   - Claims 8 and 9 are new.
   - Claim 10 is new and is a failed save check.
   - Claim 11 confirms the T3l overlay limits by reading the image table instead of the CSV label.

10. **Remaining uncertainties.** The T6 procedure's E write from `0x6006124a` did not occur when the same key list was driven by this runner's `press`, because the AF Target Mode row was absent and the commit changed Priority. Whether `runZone`'s own `press` and bring-up, called from `accept_v4.mjs`, would have produced that E was not observed: the runner stopped on K1 first. c2 and the reopen were not started in either round. Playback, session-end, orientations, the button target, storage, display, packaging, and hardware remain out of scope.

11. **Recommended next actions.** A later round needs one acceptance runner that does not call `fromControl` for the K1 row it is about to create, drives the T6 commit with the session setup Sol accepted (`runZone` and `save_v3.mjs`), and only then compares both candidates with K2. The `fix_v1` restore can stay. No storage decision and no hardware recommendation come from this task.

12. **Deviations from the brief.** The correction authorized six experiment versions and all six ran. Item 1 of §5 passed in `persist_v1b`. Item 2 passed in `fix_v1`. Item 3 did not pass: the final call did not produce a new E with a captured image and status 0. Item 4 did not end `ok:true`. Item 5 is this write-up: command 23 and the later commands are sealed in the supplement, the stock measurements are hashed individually, the overlay sections are computed from the image, the disassembly ranges are described as instruction counts, claims 2 and 3 carry Sol's qualifications, and the wording that the values stayed in RAM is not used. No byte was added in section 6 or 7 beyond `0x610bf5e3`–`0x610bf5e5`. No visible menu row was added. The custom-size words are a record in the settings bank. The exit restore puts that record back before the save. This task does not choose a store and does not recommend hardware.

## Owner decision Q5

The entry stays the session flag at `0xa031eef7` (cached `0x6031eef7`). Nothing in this task adds a visible menu row. The flag is how the prototype enters AF-ON mode, and the hook above is what leaves it.

Three choices remain with the coordinator:

1. Keep this session flag. No visible menu change. This is the entry the runs used.
2. Add a visible row, in the style of a page-29 row. That row is not in the prototype and was not added.
3. Use a key that opens `ID_ST_MENU_DIRECT` with the flag set. That key was not chosen.

No storage decision and no hardware recommendation.
