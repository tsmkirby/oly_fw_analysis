# T3g-afon-zone-chooser result

1. **Task identifier and brief version used:** T3g, the ten-zone chooser for the AF-ON row, then acceptance. Brief version 2026-11-18. Agent Grok 4.7 High. Brief SHA-256 `743b61bcd21c42f069515d841bdb795e6bff4f215e84b9beed10b20078133690`. Section 0 of the brief governed the run.

2. **Research baseline used:** T3f decision `ref/tasks/T3f-afon-editor-binding/decision.md` and Sol's review `ref/tasks/T3f-afon-editor-binding/run-20261118-104215-review/review.md`. T3f design `ref/tasks/T3f-afon-editor-binding/run-20261118-095558/work/out/design.md`. T3a brief and design, and T3a's overlay CSV, which every experiment and the acceptance sessions load as the section-1 tail. `ref/analysis/button-af/AFON-MENU-RESEARCH.md` for the page-27 editor path and the page-title ids. Decompiled `60405865`, `604058bc`, `6040547b`, `604052d5`, `60405178`, `604050e5`, `604057c8`, `611c7785`, `611c782f`. T3c `phaseA.md` for the earlier descriptor bytes.

   Input hashes, recomputed this run and listed again in `work/evidence-manifest.json`:

   - Main image `inputs/00_0100_50000020.decoded.bin` and the emulator block `om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk00000000.OE.0100.bin` are the same 33554368 bytes, SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`.
   - Resource 0106 `inputs/02_0106_458c0020.decoded.bin`, SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`.
   - Emulator GUI resource `om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin`, whole file SHA-256 `6d2bef74b4b2fa089f271529482f96505a170b91e79ab9b1a13f3ce8f7918226`. The first 10197472 bytes are the model's resource prefix, SHA-256 `119370d5dab0d5fc9b1e58357f3fd60595603076127ab60199a4c2bc5712d724`. The scripts read this file through `loadBlock`. English chooser strings come from it.

   Established by T3f and used here: B4's binding `0x1e6` to `0x3D6F` plus a 2154 descriptor clone opens the two-option priority chooser and commits `(0x3D6F, value)` to the RAM byte. B2's row pointer `0x6158ba1c` changes the row glyph and leaves that chooser in place. B4 was a combined change. This task starts from B2.

3. **Work performed:** Each command was started through `node26 work/scripts/run_logged.mjs`. The requested text below is the line the wrapper stored. No script was edited after it had been launched.

   - 01 `python -I work/scripts/decode_descriptors_g1.py`. Exit 0. Writes `work/out/descriptors-g1.txt`.
   - 02 `tools\bin\run-ghidra.cmd -postScript DisasmRangesG1.java` with the eleven ranges named in `work/out/cmd/02.cmd.txt`, `-noanalysis` and `-readOnly` via the launcher, log `work/out/ghidra-desc-g1.log`. Exit 0.
   - 03 `python -I work/scripts/check_listings_g1.py`. Exit 0. Eleven listings, 0 bad bytes (`work/out/listing-check-g1.txt`).
   - 04 `node26 work/scripts/exp_base_g1.mjs om-emu work/out/exp-base-g1.jsonl`. Exit 0. B2 baseline.
   - 05 `node26 work/scripts/exp_z1_g1.mjs om-emu work/out/exp-z1-g1.jsonl`. Exit 0. Combined descriptor replacement.
   - 06 `node26 work/scripts/exp_z2_g1.mjs om-emu work/out/exp-z2-g1.jsonl`. Exit 0. Byte count only.
   - 07 `node26 work/scripts/exp_z3_g1.mjs om-emu work/out/exp-z3-g1.jsonl`. Exit 0. Value-table pointer only.
   - 08 `node26 work/scripts/accept_g1.mjs om-emu work/out/accept-g1.jsonl`. Exit 1. Stock `patchedFirmware([])` is refused.
   - 09 `node26 work/scripts/accept_g2.mjs om-emu work/out/accept-g2.jsonl`. Exit 1. Pages 25 and 26 rendered; the return search walked into another section.
   - 10 `node26 work/scripts/accept_g3.mjs om-emu work/out/accept-g3.jsonl`. Exit 1. Return to AF Button worked; the store file was nested under `machine` and no save was recorded.
   - 11 `node26 work/scripts/accept_g4.mjs om-emu work/out/accept-g4.jsonl`. Exit 0. Acceptance passed.
   - 12 `node26 -p process.version`. Exit 0. `v26.12.1`.
   - 13 `python -I -c import sys; print(sys.version)`. Exit 0. `3.12.7`.
   - 14 `python -I work/scripts/write_manifest_g1.py`, run after this file was written. It refreshes `work/evidence-manifest.json`.

4. **Files examined:** The image and both resource files in section 2. Descriptor table `0x6061912c`, stride `0x14`, count `0x6b0`, end `0x606216ec`. 2154 at `0x6062132c`. UI 238 at `0x606200e4`. Value tables `0x606190b7` and `0x606178b1`. Option lists `0x6158ba04` and `0x6158ba1c`. Rows `0x6158dc44`, `0x6158dc68`, `0x6158dc8c`. UI map `0x6062555c`, slot 238 at `0x60625914`. Name table in 0106, stride 52, base `0x28803f0`. Listings checked against the image: `FUN_60405865`, `FUN_604058bc`, `FUN_6040547b`, `FUN_604052d5`, `FUN_60405178`, `FUN_604050e5`, `FUN_604057c8`, `FUN_60405736`, `FUN_60405252`, `FUN_611c7785`, `FUN_611c782f`. Trace sites `0x6041937f`, `0x60063431`, `0x60063380`, `0x611a26e1`, `0x6124f523`. RAM byte `0xa031e920`, cached byte `0x6031e920`.

5. **Files created:** Everything written for this task is under `work/`. `work/evidence-manifest.json` lists every file except itself. Principal files: `work/result.md`, `work/out/descriptors.md`, `work/out/descriptors-g1.txt`, `work/out/design.md`, `work/out/overlay-changed-bytes.csv` (the Z1 overlay, 212 rows, copied from `work/out/overlay-exp-z1-g1.csv`), the eleven disassembly listings, `work/out/listing-check-g1.txt`, `work/out/ghidra-desc-g1.log`, experiment logs `exp-base-g1.jsonl`, `exp-z1-g1.jsonl`, `exp-z2-g1.jsonl`, `exp-z3-g1.jsonl` and their screenshots, acceptance logs `accept-g1.jsonl` through `accept-g4.jsonl`, store files `nvram-accept-control.json`, `nvram-accept-c1.json`, `nvram-accept-c2.json`, and `work/out/cmd/` for commands 01 through 14. Scripts: `run_logged.mjs`, `decode_descriptors_g1.py`, `DisasmRangesG1.java`, `check_listings_g1.py`, `menu_session_g1.mjs`, `menu_session_g2.mjs`, `exp_base_g1.mjs`, `exp_z1_g1.mjs`, `exp_z2_g1.mjs`, `exp_z3_g1.mjs`, `accept_g1.mjs` through `accept_g4.mjs`, `write_manifest_g1.py`.

6. **Findings:**

   1. STATIC. `FUN_60405865` clears 128 buckets at `0x62a84970` and walks 1712 records of 20 bytes from `0x6061912c`. `FUN_604058bc` returns the record whose first halfword matches. `FUN_6040547b` is that lookup. Listing check: 0 bad bytes.
   2. DATA. 2154 at `0x6062132c` is `6a088000 b7906160 00000000 02000100 00010000`: id 2154, flags `0x0080`, value table `0x606190b7`, second pointer 0, byte count 2, stride 1, type 1. Bytes at the pointer are `00 01`.
   3. DATA. UI 238 at `0x606200e4` is `ee008000 b1786160 00000000 0a000100 00010000`: id 238, the same flags, stride and type, value table `0x606178b1`, byte count 10. Bytes at the pointer are `00 01 02 03 05 0a 06 07 08 09`.
   4. STATIC. `FUN_604052d5` treats byte-count divided by stride as the element count. Stride 1 reads one byte at pointer plus index. `FUN_60405178` scans that table for a value. `FUN_604050e5` returns the caller's value unchanged when the pointer at +8 is 0. Both records have 0 there. The 146 records with a non-zero +8 pointer, stride 64 and type 6 are a different population. 2154 and 238 are not in it.
   5. DATA. The word earlier notes called a template is a packed list of legal values. With stride 1 the byte count is the number of values. Images and texts are not in the descriptor. A menu option record is 12 bytes, and `FUN_611c7785` multiplies the index by `0xc`. Kind 12 copies an image id. Kind 4 copies a string id. The priority list `0x6158ba04` is two kind-4 records, values 1 and 0. The zone list `0x6158ba1c` is ten kind-12 records. The two lists hold the same set of values in a different order. Value 4 is in neither.
   6. DATA. UI 238's name in resource 0106 is `MODE_AF_HOME_AREA_TYPE`. UI map `0x60625914` bytes `a19f0000`: key `0x9fa1`, index 0. 2154 is `MODE_AF_SUBJECT_PRIORITY_RELEASE`, key `0x90a1`, index 0.
   7. DATA. Page 27 rows 2154 and 2155 are kind 12 with alternate pointer 0. Page 28's UI 238 row is kind 4 and points both lists at `0x6158ba1c`. The prototype's third row is a 2154 copy, so its alternate pointer stays 0.
   8. OBSERVED-EMU. Baseline (B2: binding `0x1e6` to `0x3D6F`, 2154 descriptor clone, row options at `0x6158ba1c` count 10) opens the two priority buttons. Confirm calls the setter with id 15727 and value 1, caller `0x6041937c`, and the RAM byte becomes 1. Cancel leaves it 0. `0x90a1` stays `[1, 1]`. The other listed cells stay put. Trace cap 100000, dropped counters 0. `work/out/exp-base-g1.jsonl`.
   9. OBSERVED-EMU. Z1 replaces that descriptor with the UI 238 clone, id `0x3D6F`: `6f3d8000 b1786160 00000000 0a000100 00010000`. The log labels it a combined change of the pointer and the byte count. OK draws a scrolling grid whose labelled faces are the two priority strings. The other visible slots are blank. The ten zone images do not appear (`work/out/exp-z1-g1-3d6f-after.png` and the three `3d6f-nav` screenshots). Three Rights then OK stores 3, which is index 3 of `0x606178b1`. Setter `{id: 15727, value: 3, d0: 15727, d1: 3, caller: 0x6041937c}`. Cancel leaves the byte at 0. `0x90a1` stays `[1, 1]`. `cellsHeldExceptProfile` is true. Dropped counters stay 0.
   10. OBSERVED-EMU. On that open, the compare at `0x611a26e1` sees the three action records and the third pair is `d0 == d1 == 15727` at `0x6031ea30`. The binding lookup at `0x6124f523` matches `d0 == d1 == 486` and returns UI 15727 from the appended record at `0x60322700`.
   11. OBSERVED-EMU. Z2 changes only the byte count, 2 to 10, pointer still `0x606190b7`. The grid grows and the faces repeat the two priority strings. Three Rights stores 1. Cancel leaves 0. Cells held. `work/out/exp-z2-g1.jsonl`.
   12. OBSERVED-EMU. Z3 changes only the pointer, to `0x606178b1`, count still 2. The first two bytes of that table are `00 01`. The chooser stays the two priority buttons and stores 1. `work/out/exp-z3-g1.jsonl`, screenshot `exp-z3-g1-3d6f-after.png`.
   13. INFERRED. The slot count is the byte count. The committed value is the byte at the value-table pointer plus the cursor index. A face is chosen by that value. Values 0 and 1 resolve to the priority kind-4 strings. The other eight values draw blank slots. The row's kind-12 list changes the row glyph and does not supply those faces. The row's alternate pointer is 0, so the face search is some other list.
   14. OBSERVED-EMU. Acceptance of the Z1 configuration, two fresh sessions plus a stock control (`work/out/accept-g4.jsonl`). Shared keys: AF Button, open and cancel 2154, down, open and cancel 2155, render pages 27, 26 and 25, return to AF Button. Each candidate then cancels once and commits twice. Both sessions store 2, then 5. Both values are in the zone table and outside the priority pair `{0, 1}`. Cancel leaves the byte at 0. `0x90a1` stays `[1, 1]` through both commits. Full-cell comparison against the control, ignoring the profile byte, is identical at `page27`, `2154-cancel`, `2155-cancel`, `page26`, `page25` and `page27-return`.
   15. OBSERVED-EMU. Each session posted a native M save from `0x60061268`. M is 262144 bytes and E is 196608 bytes, and both candidate files match the control byte for byte. A new session on each candidate file reads the profile byte as 0 and `0x90a1` as `[1, 1]`. The value lived only in RAM.
   16. DATA. Page-title strings from the emulator `.0101` block: page 25 `@A02C@AF by half-pressing @A052@`, page 26 `Release Priority`, page 27 `@A02C@@A065@AF Button`.

7. **Evidence for each claim:** Claims 1–7: `work/out/descriptors-g1.txt`, `work/out/descriptors.md`, `work/out/listing-check-g1.txt`, and the listings named in section 4. Claims 8–13: the `done` and `explanation` records of `work/out/exp-base-g1.jsonl`, `exp-z1-g1.jsonl`, `exp-z2-g1.jsonl`, `exp-z3-g1.jsonl`, the `3d6f-after` trace group in the Z1 log, and the screenshots `exp-z1-g1-3d6f-after.png`, `exp-z1-g1-3d6f-nav-0.png`, `exp-z1-g1-3d6f-nav-1.png`, `exp-z1-g1-3d6f-nav-2.png`, `exp-z2-g1-3d6f-after.png`, `exp-z3-g1-3d6f-after.png`. Claims 14–16: `work/out/accept-g4.jsonl` steps `c1-zone-commit-1` (profile 2), `c1-zone-commit-2` (profile 5), the same pair for `c2`, `cell-compare`, `store-compare`, `c1-reopen`, `c2-reopen`, and `page-titles`. Overlay bytes: `work/out/overlay-changed-bytes.csv`, addresses `0x6031e920`–`0x6031ea47`.

8. **Tests and outcomes:**

   - Listing check against the image: PASS. 0 bad bytes in 11 files.
   - Baseline reproduces B2 (two priority buttons, confirm 1, cancel 0, cells held): PASS.
   - Z1, ten zone images on OK: FAIL. The grid shows the two priority faces and blank slots.
   - Z1, confirm a zone value through the setter into the RAM byte: PASS. Value 3, id `0x3D6F`.
   - Z1, cancel leaves the byte unchanged: PASS. Byte stays 0.
   - Z1, 2154, 2155 and the listed cells: PASS.
   - Z2, count alone sets the slot count: PASS. It does not draw zone images.
   - Z3, pointer alone, count 2: PASS as the predicted two-button result. The first two bytes of both tables are `00 01`.
   - Trace caps, all four experiments: PASS. Cap 100000, every dropped counter 0 on the recorded groups.
   - Acceptance, two sessions, two zone values each, one cancel each, assertions after every step: PASS. Values 2 then 5, cancel 0.
   - Acceptance, full-cell comparison with the stock control: PASS. Twelve comparisons, no diffs.
   - Acceptance, pages 25, 26 and 27 rendered: PASS.
   - Acceptance, native save, new session, stores identical, profile back at 0: PASS.

9. **New versus previously established:**

   - Claims 1–6 confirm the descriptor field notes in `AFON-MENU-RESEARCH.md` and re-derive UI 238's name and key from the image. The value table is a packed byte list.
   - Claim 7 confirms T3f: the B2 row's alternate pointer is 0, and the row pointer changes the glyph.
   - Claim 8 confirms T3f B2 and B4's commit path.
   - Claims 9–13 are new. The UI 238 descriptor clone commits zone values and does not draw the ten zone images. The count and the pointer were isolated after the combined Z1 change.
   - Claims 14–15 are new. T3a's acceptance procedure passes for this RAM-only value: stores match the stock control and the byte returns to 0.
   - Claim 16 confirms the page-title ids in the menu research, with the English text taken from `.0101`.

10. **Remaining uncertainties.** The chooser still finds kind-4 faces for values 0 and 1 while this row's primary list is the zone images and its alternate pointer is 0. Which list it searches was not isolated. Z2's first frame highlighted a later slot that also holds value 0, so the initial cursor is not fully described when several slots share a value. The binding array's resident address is open; `0x60320000` is scratch outside the loaded image. The sentinel `0xA70F` returned by the mapped getter was not shown to be an unregistered id. The word `0x2d` in the binding record was copied from 2154 and not varied.

11. **Recommended next actions.** One later experiment, a single change on top of the Z1 descriptor: a ten-record kind-4 text list built from stock strings, installed as the row's option list, with each string id justified. That is the change most likely to fill the blank slots. It was not run here. Keep the value in the RAM byte. Leave the binding array's home and any native store for a later task.

12. **Deviations from the brief.** Z1 is one descriptor replacement and a combined change of the value-table pointer and the byte count. The log says so. Z2 and Z3 then change one field each. The four runs are the baseline, Z1, Z2 and Z3. A fourth variant, the ten-record text list, was the justified next change and was not started, so that the run stayed at four experiments. The acceptance control shares the stock-row and page-render keys and does not receive the candidate's confirm keys, because those keys on the two-row stock page would confirm 2154 and change `0x90a1`. Acceptance attempts `accept_g1.mjs`, `accept_g2.mjs` and `accept_g3.mjs` failed for harness reasons and were replaced by new files; none of those files was edited after it ran. The experiment navigation is a fixed Right sequence. The prototype writes no firmware image and chooses no store and no binding-array home.
