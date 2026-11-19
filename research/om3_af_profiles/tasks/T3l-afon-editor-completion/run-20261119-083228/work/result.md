# T3l result

1. **Task identifier and brief version used:** T3l, brief version 2026-11-19. Agent Grok 4.7 High. The brief's section 0, including the T3j, T5, and T3b rules it adopts, governed the run. This file is the correction round after Sol's REJECT (`audit/previous-review.md`).

2. **Research baseline used:** `ref/tasks/T3b-afon-target-editor/decision.md` (CLOSED PARTIAL), Sol's review `ref/tasks/T3b-afon-target-editor/run-20261119-071657-review/review.md`, the T3b final work under `ref/tasks/T3b-afon-target-editor/run-20261119-063452/work/`, and the bank-7 registration walk. Inputs hashed by the manifest: `inputs/00_0100_50000020.decoded.bin` and `inputs/02_0106_458c0020.decoded.bin`. The emulator's own resource files are the unpacked `0100` and `0101` images listed in the manifest `resources` array. `inputs/02_0106_458c0020.decoded.bin` is resource 0106. It is not the file `loadBlock` reads. The Z5 overlay is the T5 handoff table, checked again here. `pose.mjs` from `run-20261119-072701` was not imported.

3. **Work performed:** Every emulator command went through `work/scripts/run_logged.mjs`. Scripts that had already run were not edited.
   - 01–13 are the rejected round: registration, overlay check, stock trace, size measurement, and exit hooks `exit_l3` through `exit_l6`.
   - 14 `manifest_final.py` — the rejected round's manifest. Its `.out`, `.err`, and `.exit` are in this round's manifest.
   - 15 `entry_m1.mjs` — entry copies nothing; `FF` fields become 0. Stopped because the open assertion expected All and zone 0. The screen drew Single and the setter published zone 1.
   - 16 `show_entry_m1.py`, 17 `show_open_m1.py`.
   - 18 `entry_m2.mjs` — same hook. The open assertion passed. A further main dial on a zero `0x5a11` mirror wrote nothing.
   - 19 `show_dial_m2.py`.
   - 20 `entry_m3.mjs` — same hook. Up is the type change and the move. Ended `ok:true`.
   - 21 `show_m3.py`.
   - 22 syntax check of `accept_m4.mjs`. 23 `accept_m4.mjs` — K1 and K2 matched each other through n3. `power_down()` alone did not finish.
   - 24 copy to `accept_m5.mjs`. 25 compared the m4 K1 and K2 rows.
   - 26 `accept_m5.mjs` — the power lever, then `power_down()`, still did not finish under camapp with native transactions.
   - 27 copy to `accept_m6.mjs`. 28 syntax check.
   - 29 `accept_m6.mjs` — K2's menu-close save completed. Candidate c1's first normal Up matched K1's half-press cells and missed K1's title band. The run ended `ok:false`.
   - 30 a split `python -c` that did not run the intended print.

4. **Files examined:** The brief, `TASK.md`, Sol's previous review, the T3b acceptance runner and design notes, `om-emu/emu/src/lab/menu.mjs` (NAND save log, `STORE_MIRRORS`), `om-emu/emu/src/lab/power.mjs` (shutDown, TRA 586, 10000 ms), `om-emu/emu/src/lab/play.mjs` (`power_down` after the lever), `om-emu/emu/src/fw/models.mjs` (`0x1e71`, 0 = OFF), and `om-emu/emu/test/test_nvram.mjs` (menu close saves M). Addresses are in `work/out/design.md`.

5. **Files created:** Under `work/` only. The manifest lists them. `entry_m2.mjs`, `entry_m3.mjs`, `accept_m4.mjs`, `accept_m5.mjs`, and `accept_m6.mjs` were copied from the previous script and edited before their own runs.

6. **Findings:**
   1. OBSERVED-EMU. The Z5 overlay check passes: 3262 rows, sections 1/2/4/7 = 1308/95/1856/3, and the only section-7 bytes are `0x610bf5e3`–`0x610bf5e5`.
   2. STATIC. Every mirror key's factory payload is zeros. The zone-type default is 0.
   3. OBSERVED-EMU. The exit hook clears both flag aliases to 0 and writes the entry snapshot back to both zone aliases. OK, MENU, and S1 did this in `exit_l4.mjs`, and the following edit matched K1 and K2 there. Playback from the direct screen uses the same event as S1 and lands on state 261, `0x0105`. The frame text is "One Moment". That is not a proven no-picture warning. Further presses stayed on that frame. Session end was not read.
   4. OBSERVED-EMU. EMULATOR-ONLY. Entry copies nothing into the mirror. A mirror byte that is still `0xFF`, or a word that is still `0xFFFF`, becomes descriptor 0. An all-`FF` mirror becomes zeros, and the next Up still draws. The title band is Single, not All, because that Up writes Single and zone 1. A mixed mirror keeps the non-`FF` bytes. C1 and C2 both stay after re-entry. The mirror written by the first Up survives one normal half-press edit and the next entry. `entry_m3.mjs` ended `ok:true`.
   5. OBSERVED-EMU. A zone byte of 4 on entry is restored on OK after the screen had published zone 1 (`snap-ok` in command 20).
   6. OBSERVED-EMU. `0x1e71[0]` reads 0. The stock 2.AF row "Subject Detection" shows Off. `0x90a1` is not Subject Detect. The key was not set.
   7. OBSERVED-EMU. The correction-round acceptance did not end `ok:true`. In `accept_m6.mjs`, K1 and K2 agree on every n1–n3 half-press cell and title. K2's menu close after those edits logged a posted M save, and the file holds M (262144 bytes) and E (196608 bytes). Candidate c1 initialized, drew Single, restored zone 0 on OK, and on the next Up matched K1's half-press cells, including all nine `0x1df1` bytes. The title-band hash was `300d23bb9e6959c7e7fb85ca85808e14d5b08992ea2f8d6285406e4b20ba9744`. K1's hash for that Up is the All band `012041e4f3a3879914a8681e55a7ee206f7fe4c1e998177ba0a6f72520bb9d16`. The c1 frame is blank. The run stopped there. c2, the store compare, and the reopen did not run.
   8. OBSERVED-EMU. Calling `power_down` from these camapp sessions does not complete the native power-off. The same timeout remains when the power lever is switched off first. The lab documents that, under camapp with native transactions, `startShutDown` waits on TRA 586 for an HLS answer the lab does not create.

7. **Evidence for each claim:**
   1. `work/out/cmd/02.out`.
   2. `work/out/factory-defaults-l0.json` and `work/out/profile-layout.md`.
   3. `ok-compare`, `menu-compare`, and `s1-compare` in `work/out/cmd/09.out`. `play-exit` texts in `work/out/exit-l6.jsonl`.
   4. `work/out/cmd/20.out` and `work/out/entry-m3.jsonl`: `profile-open`, the mixed session, `profile-c1-ok`, `profile-c2-ok`, and the re-entry after the normal edit.
   5. `snap-ok` in `work/out/cmd/20.out`.
   6. `detect-read` in `work/out/entry-m3.jsonl` (`subject` 0) and `work/out/entry-m3-detect-22-detect-row.png`.
   7. `work/out/cmd/29.out` and `work/out/accept-m6.jsonl`: `k2` id `save` pass, `c1` id `n1-up` pass on cells, `n1-up-vs-k1` problems `k1-title`. Screenshot `work/out/accept-m6-c1-04-n1-up.png` against `work/out/accept-m6-k1-01-n1-up.png`.
   8. `save` in `work/out/accept-m4.jsonl` and `work/out/accept-m5.jsonl`. `POWER_OFF_MS` and the TRA 586 comment in `om-emu/emu/src/lab/power.mjs`.

8. **Tests and outcomes:**
   - Overlay section check: PASS.
   - Factory-default walk: PASS.
   - OK, MENU, and S1 exits and their following edits, from the earlier hook that recopied the half-press: PASS (`exit_l4.mjs`).
   - Entry that copies nothing, all-`FF` init, mixed init, C1 then C2 retained, survival across one normal edit and a re-entry, screen still draws: PASS (`entry_m3.mjs`).
   - Non-zero zone snapshot 4 restored: PASS (`entry_m3.mjs`).
   - Subject Detect read back as 0, stock row Off, not set: PASS.
   - Acceptance runner, two candidates, per-key identity, native save, reopen, store compare: FAIL. `accept_m6.mjs` ended `ok:false` on the first candidate title band. The version budget is spent, so it was not rerun.
   - Playback follow-up and session-end flag read: not run. Item 2 did not pass.
   - Orientations: not run. `pose.mjs` from `run-20261119-072701` was not imported. Its hash is in the manifest.

9. **New versus previously established:**
   - Claim 4 replaces the rejected finding that each entry recopies the half-press over the mirror.
   - Claim 5 is the non-zero snapshot the rejected round did not run.
   - Claim 6 removes the rejected claim that `0x90a1 = [1,1]` means Subject Detect Off.
   - Claim 3 corrects the playback description. The earlier OK, MENU, and S1 matches stay the `exit_l4` result.
   - Claim 7 is the acceptance the brief required to end `ok:true`. It did not.

10. **Remaining uncertainties.** The blank c1 title band may be a frame taken before the All title was drawn. The half-press cells already matched K1, so a later frame might have matched the All hash. That was not waited for, and no version remains to check it. Whether c1 and c2 stores match K2, and whether a reopen sees mirror `FF` and zone 0, was not reached. Session end still has no flag reading from the direct screen. The asserted half-press invariance is the LIVE cells listed in `work/out/profile-layout.md`, including nine `0x1df1` bytes. It is not a claim about every settings cell in the camera.

11. **Recommended next actions.** One more acceptance run, same hook, with the title check waiting for K1's title-band hash before it fails a blank frame. Then the playback return to shooting and the shutDown flag read, on a session whose power-off can finish. Import `pose.mjs` from `run-20261119-072701` only after acceptance ends `ok:true`.

12. **Deviations from the brief.** Six correction-round experiment versions were authorized. All six ran: `entry_m1`, `entry_m2`, `entry_m3`, `accept_m4`, `accept_m5`, `accept_m6`. Items 1 and 3 passed in `entry_m3`. Item 2 did not end `ok:true`. Items 4 and 5 were not started, because item 2 had not passed and the versions were used. The native power-off does not complete in these sessions. The save asserted on K2 is the menu-close settings save, which logs M only after the NAND write is answered with status 0. The file was not reopened, because c1 stopped first. File copies that created each new script were preparation before that script ran. The runs themselves went through the wrapper.

## Owner decision Q5

The entry stays the session flag at `0xa031eef7` (cached `0x6031eef7`). Nothing in this task adds a visible menu row. The flag is how the prototype enters AF-ON mode, and the hook above is what leaves it.

Three choices remain with the coordinator:

1. Keep this session flag. No visible menu change. This is the entry the runs used.
2. Add a visible row, in the style of a page-29 row. That row is not in the prototype and was not added.
3. Use a key that opens `ID_ST_MENU_DIRECT` with the flag set. That key was not chosen.

No storage decision and no hardware recommendation.
