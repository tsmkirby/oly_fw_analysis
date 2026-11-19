# T3l result

1. **Task identifier and brief version used:** T3l, brief version 2026-11-19. Agent Grok 4.7 High. The brief's section 0, including the T3j, T5, and T3b rules it adopts, governed the run.

2. **Research baseline used:** `ref/tasks/T3b-afon-target-editor/decision.md` (CLOSED PARTIAL), Sol's review `ref/tasks/T3b-afon-target-editor/run-20261119-071657-review/review.md`, the T3b final work under `ref/tasks/T3b-afon-target-editor/run-20261119-063452/work/`, and the bank-7 registration walk. Inputs hashed by the manifest: `inputs/00_0100_50000020.decoded.bin` and `inputs/02_0106_458c0020.decoded.bin`. The Z5 overlay is the T5 handoff table, checked again here.

3. **Work performed:** Every emulator command went through `work/scripts/run_logged.mjs`.
   - 01 `defaults_l0.py` — registration walk and image search.
   - 02 `section_rows_l0.py` — overlay section check.
   - 03 `trace_l1.mjs` — stock GUI transitions for OK, MENU, S1, playback, and the size editor. The size-editor steps after playback are not evidence: the body was already on the warning.
   - 04 `show_trace_l1.py`, 05 `show_calls_l1.py`.
   - 06 `measure_size_l2.mjs` — stock C1 and C2 on a session that was actually on AF Target Settings. 07 `show_size_l2.py`.
   - 08 `exit_l3.mjs` — first exit hook. OK passed, including the following edit. The next entry started while the direct screen was still open.
   - 09 `exit_l4.mjs` — same hook. OK, MENU, and S1 each returned to shooting and the following edit matched K1 and K2. The size compare looked up mirror fields by their decimal names.
   - 10 `show_exit_l4.py`. 11 `exit_l5.mjs` — stopped on a flag check that required 0 before the hook had ever cleared the image value `0xFF`.
   - 12 `exit_l6.mjs` — same hook, hex field names, C1 and C2, playback. Playback's following edit did not reach shooting, and the script stopped there.
   - 13 `show_exit_l6.py`.

4. **Files examined:** The brief, `TASK.md`, the T3b acceptance runner and design notes, `om-emu/emu/src/lab/menu.mjs` (`STATE_LOG`, state-log registers `a0`/`a1`), `om-emu/emu/src/lab/hle.mjs` (`hook`, `wrap`), `om-emu/emu/src/lab/power.mjs` (shutDown, 10000 ms), and `om-emu/emu/src/fw/model.mjs` (`fact`). Addresses are in `work/out/design.md`.

5. **Files created:** Under `work/` only. The manifest lists them. Scripts that have run were not edited afterwards. `exit_l4.mjs`, `exit_l5.mjs`, and `exit_l6.mjs` were copied from the previous script and then edited before their own runs.

6. **Findings:**
   1. OBSERVED-EMU. The Z5 overlay check passes: 3262 rows, sections 1/2/4/7 = 1308/95/1856/3, and the only section-7 bytes are `0x610bf5e3`–`0x610bf5e5`.
   2. STATIC. Every mirror key's factory payload is zeros. The zone-type default is 0.
   3. OBSERVED-EMU. Leaving the direct screen is a GUI transition off `0x0405`: OK `0x900d`, MENU `0x900e`, S1 `0x972b`, playback `0x972b`. A dial stays on `0x0405`. The custom-size editor stays on `0x0b02`; its OK is event `0x900d` after Right `0x900b`, and the setter writes happen before that state-log call.
   4. OBSERVED-EMU. The hook, not the harness, clears both flag aliases to 0 and writes the entry snapshot back to both zone aliases. The snapshot in these sessions is 0.
   5. INFERRED. The zone byte after exit must be that entry snapshot. A normal edit does not write the zone byte, so K2 still holds the image 0. Restoring the snapshot is what makes the next dial match K2. The AF-ON selection remains in the mirror. During the edit the zone byte holds the AF-ON selection.
   6. OBSERVED-EMU. OK, MENU, and S1 each clear the flag, restore the zone byte to 0, leave the direct screen, and the following up/dial/OK matches K2's cells and zone byte and K1's half-press cells.
   7. OBSERVED-EMU. With the flag set, C1 OK writes the mirror to `0x1dd1` = `27,39,5,1,3,3,3,3,3,3`, `0x1df1[4]` = 1, and leaves `0x5a11` unchanged. C2 OK writes `0x1dd1[4]` = 5, `0x1dd1[5]` = 1, `0x1df1[5]` = 1. The half-press cells do not change. The same OK with the flag off writes those values into K1's half-press cells.
   8. OBSERVED-EMU. Playback's hook reason is `direct-972b`. The flag becomes 0, the zone byte returns to 0, and the screen is `0x0105` (state 261), the no-picture warning. Further presses of playback, OK, MENU, and S1 stay on that screen.
   9. OBSERVED-EMU. The entry used here is the session flag at `0xa031eef7`. No menu row was added.

7. **Evidence for each claim:**
   1. `work/out/cmd/02.out`.
   2. `work/out/factory-defaults-l0.json` and `work/out/profile-layout.md`.
   3. `work/out/cmd/06.out`, `work/out/cmd/07.out`, and the `seq` arrays on `size-ok` in `work/out/exit-l4.jsonl`.
   4. `exits` on `ok-exit`, `menu-exit`, and `s1-exit` in `work/out/exit-l4.jsonl`, and on `size-ok`, `c2-ok`, and `play-exit` in `work/out/exit-l6.jsonl`. Each record has `flagAfter` 0 and `zoneAfter` equal to `snap` 0.
   5. K2's zone byte stays 0 across `n1`–`n6` in `work/out/cmd/09.out`. The candidate's zone byte is 1, 2, or 3 while the flag is 1 and 0 after the exit.
   6. `ok-compare`, `menu-compare`, and `s1-compare` in `work/out/cmd/09.out` are pass, and so are the matching `*-ok-compare` rows.
   7. `size-compare` and `c2-compare` in `work/out/exit-l6.jsonl`. The mirror objects are on those lines. `size-ok` and `c2-ok` in `work/out/cmd/12.out` have flag 0, zone 0, and pass. The half-frozen checks on those steps passed, which is what `half-moved` would have failed.
   8. `play-exit` and `play-recover-*` in `work/out/cmd/12.out`. State 261 is `0x0105`.
   9. The harness raises the flag; the hook is the only writer that clears it. No overlay row adds a menu entry (`work/out/section-rows-l0.json`).

8. **Tests and outcomes:**
   - Overlay section check: PASS.
   - Factory-default walk: PASS.
   - OK exit and the following edit against K1 and K2: PASS.
   - MENU exit and the following edit: PASS.
   - S1 exit and the following edit: PASS.
   - C1 custom-size edit, mirror only, and the following edit: PASS.
   - C2 custom-size edit, mirror only, matching K1's half-press landing: PASS.
   - Playback exit (flag, zone byte, left the direct screen): PASS. The following edit: BOUNDARY. The body remains on the no-picture warning.
   - Session end: not run.
   - First-entry initialization: not run. The change is in `exit_l6.mjs` and no session enabled it.
   - Acceptance runner, two candidates, save read-back, reopen, store compare: not run. It did not end `ok:true`.
   - Orientations: not run. Item 5 did not pass. `pose.mjs` was not imported. Its hash is in the manifest.

9. **New versus previously established:**
   - Claims 4, 6, and 7 are new. T3b's review said the harness, not the hook, cleared the flag, and that the custom-size candidate was blocked.
   - Claim 2 confirms the T3b / T2 registration result that the descriptor payloads are zeros.
   - Claim 5 confirms the T3b design note that the zone byte has to agree with the half-press side before the next dial, and it names the value that does so: the entry snapshot, which is the Z5 image 0 in these sessions.
   - Claim 8 confirms the T3l trace: playback from the direct screen reaches `ID_ST_WARNING` when the card has no picture.

10. **Remaining uncertainties.** The shutDown hook is installed and was not called, so it is unknown whether session end clears the flag before the 10-second power-off timeout. The initialization change was not executed, so it is unknown whether an all-zero mirror still draws the All title band. The two custom sizes were not left resident in one mirror at the same time, because each entry recopies the half-press over the mirror.

11. **Recommended next actions.** Dismiss or avoid the no-picture warning, then run the playback follow. Call shutDown from the direct screen and read the flag. Enable the initialization already written in `exit_l6.mjs` and run the acceptance against a K2 that repeats only the half-press keys and the same menu leaves. Keep the C1 bytes in the mirror when C2 is entered, instead of recopying the half-press.

12. **Deviations from the brief.** The six experiment versions were used on the exit hook and its harness (`trace_l1`, `measure_size_l2`, `exit_l3`, `exit_l4`, `exit_l5`, `exit_l6`). Initialization, the acceptance runner, the save and reopen, the store compare, and the orientations were not run. Playback's following normal edit was not run, because the warning screen does not return to shooting. The C1 and C2 mirror results are from two entries, not one combined mirror. Local copies that created `exit_l4.mjs`, `exit_l5.mjs`, and `exit_l6.mjs` from the previous script were file preparation before those scripts ran; the runs themselves went through the wrapper.

## Owner decision Q5

The entry stays the session flag at `0xa031eef7` (cached `0x6031eef7`). Nothing in this task adds a visible menu row. The flag is how the prototype enters AF-ON mode, and the hook above is what leaves it.

Three choices remain with the coordinator:

1. Keep this session flag. No visible menu change. This is the entry the runs used.
2. Add a visible row, in the style of a page-29 row. That row is not in the prototype and was not added.
3. Use a key that opens `ID_ST_MENU_DIRECT` with the flag set. That key was not chosen.

No storage decision is made. No hardware recommendation is made. Subject Detect stays off.
