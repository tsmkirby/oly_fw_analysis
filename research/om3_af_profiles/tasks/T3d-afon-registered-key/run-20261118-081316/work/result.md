# T3d result

1. **Task identifier and brief version used:** T3d, brief version 2026-11-18. Question: does a registered key open the native chooser for the AF-ON row? `brief.md`.

2. **Research baseline used:** T3c decision and the Sol review of run 20261118-080617; T3c `design.md` and the E1 baseline; T3a decision, brief sections 4 and 7, and the section-1 overlay CSV; `AFON-MENU-RESEARCH.md` section 8 for the UI maps and `0x5b82`; decompiled `FUN_611a2631`, `FUN_611a1229`, `FUN_6119a177`, `FUN_60419446`, `FUN_60419696`. Image `inputs/00_0100_50000020.decoded.bin`. Hashes are in `work/evidence-manifest.json`. T2b left ownership of `0x5b82` unresolved; this result does not resolve it.

3. **Work performed:**
   - Fixed the direct-call search so a call's absolute target is compared with an absolute address. `work/scripts/static_calls_d1.py`, command 02. `new_call_count=604`, `old_call_count=0`.
   - Disassembled the `0x900C` handler from `0x611a13c0` and `FUN_611a2631`, and checked the listings against the image. Commands 15, 16, 20, 21, 22.
   - Traced the match keys for 2154, 2155, `0x3D6F`, and C-AF Area. Command 18.
   - K1, corrected run: mapped getter and index getter return `0x5b82` and 0 only for `0x3D6F`. Command 28. An earlier run, command 25, returned from those hooks whenever `call_depth` was above 0, which is how the menu pump runs, so that run did not stand in for the id.
   - K4: one hook at the deciding compare, so the first page-27 record matches `0x3D6F`. Command 31.
   - Wrote the overlay CSV. Command 33.

4. **Files examined:** `brief.md`, `TASK.md`, `templates/result.md`, the T3c and T3a decisions and briefs, the Sol review, `AFON-MENU-RESEARCH.md`, and the decompiled functions named above. Disassembly at `0x611a1229`, `0x611a13c0`, `0x611a1571`, `0x611a182e`, `0x611a1ab9`, `0x611a2631`, `0x611a2735`, `FUN_61203082`, `FUN_6120308d`. Image bytes at the action tables `0x6150c514` and `0x6150c4cc`, the pointer `0x6150f5f0`, and map slot `0x60627704`.

5. **Files created:** under `work/` only. `work/result.md`, `work/out/decision-point.md`, `work/out/design.md`, `work/out/overlay-changed-bytes.csv`, the scripts, JSONL logs, screenshots, and command records. `work/evidence-manifest.json` lists them. The manifest command's own `.out`, `.err`, and `.exit` are written after the manifest is saved.

6. **Findings:**
   1. The page-27 callee that returns 4 or 1 is the `0x900C` handler entered from `FUN_611a1229` at `0x611a129d`. It calls `FUN_611a2631` at `0x611a12a5`. `FUN_611a2631` returns 4 or 0, and the handler returns that 4, or 1 when the call returns 0. `STATIC` and `OBSERVED-EMU`.
   2. The deciding read is `0x611a26e1`, `cmp D1, D0`. `D1` is the selected row's provider UI id. `D0` is the halfword at offset 4 of the current 24-byte record. `STATIC` and `OBSERVED-EMU`.
   3. For 2154, 2155, and C-AF Area the id matches a record and the value at `0x6124f7d4` is 4. For `0x3D6F` the id is 15727, no record matches, `FUN_611a2631` returns 0, and the value at `0x6124f7d4` is 1. `OBSERVED-EMU`.
   4. The same window calls the mapped getter, the index getter, and the descriptor lookup only with UI id 1448, and the registry and `FUN_60063380` only with key `0x5941`, for all four rows. The row id is not a mapped key, a map index, or a descriptor lookup. `OBSERVED-EMU`.
   5. A matching record with a null handler stores 4 at `0x611a277e` and passes the record's halfwords 8 and `0x1e3` (2154), 8 and `0x1e4` (2155), or 8 and `0x1e0` (C-AF 2156) to `FUN_6119a177`. `STATIC` and `DATA`.
   6. The page-27 table and its only pointer, at `0x6150f5f0` with count 2, are in compressed section 7. The UI map and `FUN_60419446` are in uncompressed section 2. `0x3D6F` is past the last map id 15455. `STATIC`.
   7. The direct-call search that compared a file offset plus displacement with an absolute address found 0 calls. Comparing absolute targets finds 604. `STATIC`.
   8. K1 returned `0x5b82` and index 0 for `0x3D6F` from the two getters, including during OK. The compare still saw 15727, OK stayed at 1, the chooser was not built, and neither `FUN_6041937f` nor `FUN_60063431` ran. Every recorded cell was unchanged. `OBSERVED-EMU`.
   9. K4 made the first page-27 record match. OK returned 4 and opened the two-option chooser. Cancel called no setter and changed no recorded cell. Confirm called `FUN_6041937f` with UI id 2154 and value 1, then `FUN_60063431` with key `0x90a1` and index 0. `0x5b82` was not written. The cell readback matched the before-OK snapshot, including `0x90a1` staying `[1, 1]`. `OBSERVED-EMU`.
   10. A registered key, by itself, does not open this chooser. `INFERRED` from findings 2, 4, and 8.

7. **Evidence for each claim:**
   1. `work/out/decision-point.md`. `work/out/disasm-1229-d1.txt` at `0x611a12a5`. `work/out/disasm-2747-d1.txt` at `0x611a277e` and `0x611a278b`. `work/out/trace-match-d1.jsonl` `table-return` and `returnD0`.
   2. `work/out/disasm-2631-d1.txt` at `0x611a26dc` through `0x611a26e1`, bytes `f86204 a4`. `work/out/static-decision-d1.txt`, 0 mismatches on that listing.
   3. `work/out/match-summary-d1.txt`.
   4. `work/out/static-decision-d1.txt` lines `decideReads`.
   5. `work/out/disasm-2747-d1.txt` at `0x611a276e`. Image bytes in `work/out/static-decision-d1.txt`.
   6. `work/out/static-decision-d1.txt` section rows and `work/out/static-tableptr-d1.txt`.
   7. `work/out/static-calls-d1.txt` line `new_call_count=604 old_call_count=0`.
   8. `work/out/exp-k1-d2-summary.txt`. Screenshots `work/out/exp-k1-d2-3d6f-before.png` and `work/out/exp-k1-d2-3d6f-after.png`. Highlight before OK: `@A02F@ Priority`.
   9. `work/out/exp-k4-d1-summary.txt`. Screenshots `work/out/exp-k4-d1-3d6f-before.png`, `exp-k4-d1-3d6f-after.png`, `exp-k4-d1-3d6f-cancel.png`, `exp-k4-d1-3d6f-confirm.png`. After OK the screen text begins "When a specified subject is detected". Setter arguments are in the confirm step. `work/out/overlay-check-d1.txt` for the cell comparison.
   10. Findings 2, 4, and 8.

8. **Tests and outcomes:**
   - K1: FAIL. The getters resolved `0x3D6F` to key `0x5b82` index 0. OK did not return 4 and did not open the chooser. No confirm and no cancel existed to press.
   - K2: not run. K1 did not open a chooser.
   - K3: not run. K2 was not run.
   - K4: BOUNDARY. The action-table match opens the two-option chooser. Confirm writes 2154's key `0x90a1`, not `0x5b82`.
   - Acceptance: not run. The brief runs it only when K2 or K3 commits correctly.

9. **New versus previously established:**
   - (1) (2) (3) new. They locate the 4-versus-1 split that T3c left inside the callee. Confirms T3c that 2154, 2155, and C-AF Area reach `0x6124f7d4` with D0 4, and `0x3D6F` with D0 1.
   - (4) new. The identical getter calls T3c recorded are the fixed id 1448, not the row.
   - (5) (6) new.
   - (7) confirms the Sol review: the old search was not a reliable zero.
   - (8) new. It is the experiment T3c recommended, and it fails. Contradicts the hypothesis that a resolved settings key is what opens the chooser.
   - (9) new.
   - (10) new.

10. **Remaining uncertainties.** The no-match path's `mov 0x1, D0` at `0x611a182e` was not given its own trace event; the measured outer return is 1 and that is the instruction that feeds the return slot. K4's confirm stored the value `0x90a1` already held, so the readback could not show a changed cell. A record whose stored UI id is `0x3D6F`, rather than a forced match against 2154's record, was not built. Whether that record would make the setter receive `0x3D6F` is unmeasured.

11. **Recommended next actions.** One experiment that adds a third 24-byte record with UI id `0x3D6F` and raises the count, as an emulator stand-in for the compressed table, and records the UI id passed to `FUN_6041937f`. Do not treat a mapped-getter hook as that experiment. Do not run acceptance until confirm writes the intended cell and cancel does not. Leave the storage question with its owner.

12. **Deviations from the brief.** K1 was executed twice because the first hooks stood down inside `lab.call`; command 28 is the run that returned `0x5b82`. K2 and K3 were not run, because K1 did not open a chooser. Acceptance was not run. No NVRAM file was used. The manifest command's own three record files are not inside the manifest.
