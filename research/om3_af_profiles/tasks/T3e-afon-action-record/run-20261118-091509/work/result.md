# T3e-afon-action-record result

1. **Task identifier and brief version used:** T3e-afon-action-record, brief version 2026-11-18. Section 0 was followed: writes stayed under `work\`, the emulator tree and `ref\` were not modified, Ghidra ran through `tools\bin\run-ghidra.cmd`, Node ran as `node26`, and `OM_EMU_NVRAM` stayed off. No persistence run was started.

2. **Research baseline used:** `brief.md`, `TASK.md`, `templates/result.md`, T3d `decision.md`, T3d review `run-20261118-090732-review\review.md`, T3d `decision-point.md` and `design.md`, T3a `decision.md`, `brief.md`, `design.md` and overlay CSV, T3c `decision.md`, `ref\analysis\button-af\AFON-MENU-RESEARCH.md`, `ref\analysis\review\setting-name-candidates.json`, and the decompiled functions named in section 4. Input hashes are the `inputs` entries of `work/evidence-manifest.json`. The main image is `inputs/00_0100_50000020.decoded.bin`. Resource 0106 was not edited and was not used to decode new strings. The screen strings came from the emulator text log. The OM-Emu checkout was used read-only; this task did not hash a separate patch file.

3. **Work performed:** Every command went through `work/scripts/run_logged.mjs`. The wrapper records its own SHA-256 and the SHA-256 of each script.
   - 01 `node26 -p process.version` → v26.12.1
   - 02 `python -I work/scripts/print_version_e1.py` → 3.12.7
   - 03 `python -I work/scripts/static_records_e1.py`
   - 04 `tools\bin\run-ghidra.cmd` with `DisasmRangesE1.java` over the nine ranges in section 4
   - 05 `python -I work/scripts/check_listings_e1.py`
   - 06 `node26 work/scripts/exp_x1_e1.mjs om-emu work/out/exp-x1-e1.jsonl`
   - 07 `python -I work/scripts/summarise_x1_e1.py`
   - 08 `python -I work/scripts/summarise_x1_cmp_e1.py`
   - 09 `python -I work/scripts/static_editor_id_e1.py`
   - 10 `python -I work/scripts/static_second_words_e1.py` (exit 1, format error)
   - 11 `python -I work/scripts/static_second_words_e2.py`
   - 12 `python -I work/scripts/make_x4_e1.py`
   - 13 `node26 work/scripts/exp_x4_e1.mjs om-emu work/out/exp-x4-e1.jsonl`
   - 14 `python -I work/scripts/summarise_x4_cmp_e1.py`
   - 15 `python -I work/scripts/summarise_cells_e1.py`
   - 16 `python -I work/scripts/copy_overlay_csv_e1.py`
   - The last command is `python -I work/scripts/write_manifest_e1.py`. Its `.out`, `.err` and `.exit` are written after the manifest and are absent from `outputs`.

4. **Files examined:** The documents in section 2. Image bytes of the page-27 table `0x6150c514`, the C-AF table `0x6150c4cc`, the pointer words `0x6150f5f0` and `0x6150f5cc`, the rows `0x6158dc44` and `0x6158dc68`, the option lists `0x6158ba04` and `0x6158ba1c`, and the section-1 tail `0x6031e920`–`0x6031f000`. Listings, checked by command 05: `0x611a2631` (140), `0x6119a177` (12), `0x6119a162` (12), `0x6124f82b` (16), `0x6124f7c0` (40), `0x61283f10` (30), `0x61283d90` (20), `0x611a36a0` (30), `0x611a129d` (16). Decompiled functions: `611a2631.c`, `6119a177.c`, `6119a162.c`, `6124f82b.c`, `611a3655.c`, `61283b1c.c`, `61283f10.c`, `6127e750.c`, `60419446.c`, `60419696.c`, `60063a20.c`, `60419368.c`, `6041937f.c`.

5. **Files created:** Everything under `work/` is listed in `work/evidence-manifest.json`, except the manifest command's own `.out`, `.err` and `.exit`. The primary files are `work/result.md`, `work/out/action-records.md`, `work/out/design.md`, `work/out/overlay-changed-bytes.csv`, `work/out/exp-x1-e1.jsonl`, `work/out/exp-x4-e1.jsonl`, the `exp-x1-e1-*.png` and `exp-x4-e1-*.png` screenshots, and `work/out/cmd/`.

6. **Findings:**
   1. STATIC. Each page-27 action record is 24 bytes. `+0` is the match key 1, `+4` is the UI id, `+6` is the sub-key 0, `+8` is the handler 0, `+0xc` is the first dispatch word 8, `+0x10` is the second dispatch word, `+0x14` is the callback 0.
   2. DATA. Page 27 at `0x6150c514` is `010000006a0800000000000008000000e301000000000000` (2154, pair 8/`0x1e3`) then `010000006b0800000000000008000000e401000000000000` (2155, pair 8/`0x1e4`). C-AF Area at `0x6150c4cc` is `010000006c0800000000000008000000e001000000000000` (2156, pair 8/`0x1e0`).
   3. STATIC. On a match, `FUN_6119a177` stores the 8 at `0x60379d44` and the second id at `0x60379d46`. The 8 is the keep value. The discard sentinel is 0x23, written by `FUN_6124f82b` when the object pointer is 0 and tested by `FUN_611a3655`.
   4. STATIC. `FUN_6127e750` calls the virtual method at vtable+4 with D0 and D1 still holding the pair. The image word at `0x61513470` is `0x611a01e8`.
   5. STATIC. The 12-byte table at `0x615e32d8` has 36 kind-8 entries and none with halfword `0x1e0`–`0x1e4`. Those ids do not select a row of that table. No action-record field is an option-list pointer, a text id, or a help id.
   6. STATIC. In `0x6150b000`–`0x61511000` the second word `0x1e3` belongs only to the stock record at `0x6150c514` (UI 2154), and `0x1e4` only to `0x6150c52c` (UI 2155). `0x0e3d` is unused there. No packed table of UI ids 2156, 2157, 2205, 2154, 2155 exists in the main image.
   7. STATIC. UI ids 2274–2279 are outside every range of `FUN_60419446` and `FUN_60419696`. Both getters return key 0 and index 0. `FUN_60063a20` was not called for them, because it needs a key.
   8. OBSERVED-EMU. X1's section-7 write left the live object `0x6247a270` holding table `0x6031ea00` and count 3. The extra live-object write did not run.
   9. OBSERVED-EMU. On OK for 2154, the compare at `0x611a26e1` was D0 2154, D1 2154, A2 `0x6031ea00`. On OK for 2155 it was D0 2154 then D0 2155, both against D1 2155. On OK for `0x3D6F` it was D0 2154, D0 2155, then D0 15727 against D1 15727 at A2 `0x6031ea30`. The 24 bytes at that A2 were the third record.
   10. OBSERVED-EMU. OK on `0x3D6F` in X1 opened the two-option chooser. The screen text was the value-1 help, "When a specified subject is detected", plus `@A066@ Priority` and `@A02F@ Priority`. The highlighted row before OK was `@A02F@ Priority`.
   11. OBSERVED-EMU. X1 confirm called `0x6041937f` with id 2154 and value 1, caller `0x6041937c`. It did not call it with `0x3D6F`. The RAM byte stayed 0. Cancel left it at 0. `0x90a1` read back `[1, 1]` before OK and after confirm. The confirm interval also called `0x60063431` with key `0x8b54` index 2154 and with key `0x90a1` index 0.
   12. OBSERVED-EMU. X4's one change was the third record's second word, `0x1e3` to `0x0e3d`. The compare still matched D0 15727, D1 15727, A2 `0x6031ea30`, and the record bytes contained `3d0e0000`. The screen stayed on the three-row page. Chooser count for that OK was 0. No setter ran. The RAM byte stayed 0 and `0x90a1` stayed `[1, 1]`.
   13. OBSERVED-EMU. Both experiments reported `uncapped: true` and dropped counters of 0 for compares, setters, `0x60063431`, `0x60063380`, the chooser, and the table call. The arrays had a safety cap of 100000.
   14. OBSERVED-EMU. Across the X1 and X4 snapshots the other readbacks stayed put: `0x1dd1` `[27, 39, 3, 3, 3, 3, 3, 3, 3, 3]`, `0x99a1` `[2, 0, 2, 0, 2, 0, 5, 5]`, `0x9a41` 0, `0x5962` six 526s, `0x99d2` `[526, 526, 526]`, `0x9fa1` `[0, 0, 0]`, `0xdfa1` `[0]`, `0x1ea1` `[0]`, `0x9ec1` `[0]`, `0x9ed1` `[1]`, `0x9ee1` `[0]`, `0x9ef1` `[0]`, `0x59b1` `[0]`. There was no stock control at the same step.
   15. INFERRED. The UI id at `+4` is what `0x611a26e1` matches. The second word at `+0x10` is what the editor path requires. `0x1e3` opens the editor that commits UI 2154. A second word with no stock owner does not open an editor. Copying 2154's record and changing only the UI id therefore opens 2154's chooser.
   16. INFERRED. X1 did not commit `0x3D6F`, so the brief's X2 and X3 were not run, and the acceptance in section 5 was not run.

7. **Evidence for each claim:**
   1. `work/out/action-records.md` layout table; `work/out/disasm-2631-e1.txt`; `work/out/listing-check-e1.txt`.
   2. `work/out/static-records-e1.txt`; `work/out/action-records.md` stock-byte tables.
   3. `work/out/disasm-a177-e1.txt`, `work/out/disasm-f82b-e1.txt`, `work/out/disasm-36a0-e1.txt`; `work/out/action-records.md`.
   4. `work/out/disasm-3d90-e1.txt`; `work/out/cmd/11.out` line `vtable+4 0x611a01e8`.
   5. `work/out/static-records-e1.txt` dispatch-table section; `work/out/disasm-3f10-e1.txt`.
   6. `work/out/cmd/11.out`; `work/out/cmd/09.out`.
   7. `work/out/action-records.md` UI-map section; `work/out/home-map-e1.json`; snapshot `originally` arrays in `work/out/exp-x1-e1.jsonl`.
   8. `work/out/exp-x1-e1.jsonl` step `live-table`; compare `table` fields in `work/out/cmd/08.out`.
   9. `work/out/cmd/08.out` lines for `2154-after`, `2155-after`, `3d6f-after`.
   10. `work/out/cmd/15.out` X1 `3d6f-before` and `3d6f-after`; screenshots `work/out/exp-x1-e1-3d6f-before.png` and `work/out/exp-x1-e1-3d6f-after.png`.
   11. `work/out/cmd/08.out` `3d6f-confirm SETTERS` and `STORE`; `work/out/cmd/15.out` X1 `3d6f-cancel` and `3d6f-confirm`.
   12. `work/out/cmd/14.out`; `work/out/cmd/15.out` X4 rows; `work/out/exp-x4-e1-3d6f-after.png`.
   13. `work/out/cmd/15.out` `trunc` and `uncapped` on every listed snapshot.
   14. `work/out/cmd/15.out`.
   15. Claims 9–12.
   16. `brief.md` section 2 items X2, X3, and section 5; claim 11.

8. **Tests and outcomes:**
   - Listing check, 316 instructions, 0 mismatches: PASS (`work/out/listing-check-e1.txt`).
   - X1 harness, exit 0, traces uncapped: PASS.
   - X1 question "does OK open a chooser for `0x3D6F`": PASS.
   - X1 question "does confirm call `0x6041937f` with `0x3D6F`": FAIL. The call was `(2154, 1)`.
   - X1 question "does the RAM byte change": FAIL. It stayed 0. The confirmed value was 1, which differs from the RAM byte and equals the value already stored for 2154.
   - X1 question "does cancel leave the RAM byte unchanged": PASS. It stayed 0.
   - X1 question "does `0x90a1` stay unchanged": PASS as a readback (`[1, 1]` before and after). The confirm path did call `0x60063431` for key `0x90a1` index 0 with that same value.
   - X4 harness, exit 0: PASS. The chooser did not open. That is the result of the one change.
   - X2, X3, and the section-5 acceptance: not run. BOUNDARY. The gate is "if X1 commits", and X1 did not.
   - Command 10: FAIL of a helper script. Command 11 is the corrected script. Command 10's output was not reconstructed.

9. **New versus previously established:**
   - Claims 1–3 and 5 confirm T3d: the OK gate is the action table, and the pair is stored by `FUN_6119a177`. New detail: 8 is the keep value against the 0x23 discard, and the second word is the editor id.
   - Claim 4 is new: the page-27 vtable slot +4 is `0x611a01e8`.
   - Claim 6 is new.
   - Claim 7 confirms the UI-map ranges and adds the runtime readback of key 0 for ids 2274–2279.
   - Claims 8–11 are new. They contradict the hope that changing only the UI id would make confirm call the setter with `0x3D6F`.
   - Claim 12 is new.
   - Claim 15 is new, inferred from 9–12.
   - The option list staying on the row, and the absence of a help id in the 24-byte record, confirm T3a and T1 as already used by T3d.

10. **Remaining uncertainties.** The body of `0x611a01e8` was not listed, so the instruction that turns `0x1e3` into UI id 2154 was not shown. Confirming the other chooser row (value 0) was not tried; value 1 was already focused and was the value the script confirmed. `0xA70F` was not shown to be unregistered. The editor-descriptor hash link was not installed, and this pair of runs does not say whether some other editor needs it. The cell readbacks were not compared with a stock control at the same step. `0x1dd1` was already `[27, 39, 3, ...]` before the first OK, which is the menu-open pattern, and that was not re-proven against a control here.

11. **Recommended next actions.** List `0x611a01e8` and find where `0x1e3` becomes UI 2154. A later experiment should change one thing that makes `0x6041937f` receive `0x3D6F`. Until that happens, leave the row's options at `0x6158ba04`. X2, X3, and the acceptance run wait on a real `0x3D6F` commit.

12. **Deviations from the brief.** X2, X3, and the acceptance were not run, because X1 did not commit `0x3D6F`. X4 was the free experiment; its explanation is the first JSONL line of `work/out/exp-x4-e1.jsonl`. Command 10 failed and was replaced by command 11 rather than overwritten. The live-object write was coded and did not run. Trace arrays had a safety cap of 100000; the dropped counters were 0. Ids 2274–2279 have no map key, so `FUN_60063a20` was not called for them. The mapped getter still returns T3a's `0xA70F` for `0x3D6F`. Persistence was not run. Pages 25, 26, 27, and 28 were not rendered as an acceptance set; the screenshots are the AF Button page and, in X1, its chooser. The manifest command's `.out`, `.err` and `.exit` are absent from `outputs`.
