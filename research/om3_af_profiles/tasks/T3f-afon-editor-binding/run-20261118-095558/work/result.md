# T3f-afon-editor-binding result

1. **Task identifier and brief version used:** T3f-afon-editor-binding, brief version 2026-11-18. Section 0 was followed: writes stayed under `work\`, OM-Emu source was not modified, Ghidra ran only through `tools\bin\run-ghidra.cmd`, Node was `node26`, Python was `python -I`.

2. **Research baseline used:** `brief.md`, `TASK.md`, `templates/result.md`. T3e brief, decision, review `run-20261118-094952-review`, and that run's `design.md` and `action-records.md`. T3a brief §4 and §7 item 3, T3a `design.md` and `design-v12.md`, T3a overlay CSV. T3c `phaseA.md` and the T3c brief's text-list note. `AFON-MENU-RESEARCH.md` "How a page-27 row opens its editor". Decompiled `6124f4e5.c`, `6124f11a.c`, `6127e750.c`, `6041937f.c`. Inputs `inputs/00_0100_50000020.decoded.bin` and `inputs/02_0106_458c0020.decoded.bin`. Hashes are in `work/evidence-manifest.json`.

3. **Work performed:** Every command went through `node26 work/scripts/run_logged.mjs`. The requested line of each `work/out/cmd/NN.cmd.txt` is the command. Exits are 0 except 06, 18 and 30, which are 1.
   - 01 `node26 -p process.version` → `v26.12.1`
   - 02 `python -I work/scripts/print_version_f1.py` → Python 3.12.7
   - 03–16 static scans, Ghidra listings, the discovery trace `trace_bind_f1.mjs`
   - 06 `find_binding_refs_f1.py` raised `ValueError` (struct format). 07 is the replacement
   - 17 `exp_b1_f1.mjs` placed the binding table at `0x60320000` as overlay bytes. The CPU read `0xA5A5A5A5`
   - 18 `probe_ram_f1.mjs` threw `PatchRefused: no patches` before a session
   - 19 the same probe with one overlay byte. `0x6031f000` and above read back as `0xA5`; a poke at `0x60320000` read back `0x11223344`
   - 21 `exp_b1_f2.mjs` runtime-wrote the 417 records. The lookup matched. The screen was a blank box
   - 25 `exp_b4_f1.mjs` cloned 2154's descriptor and linked it. Confirm stored 1 for UI `0x3D6F`
   - 28 `exp_b2_f1.mjs` pointed the row at `0x6158ba1c`. The row drew the All grid. The chooser stayed the two priority buttons
   - 30 `dump_template_f1.py` raised `struct.error`. 32 is the replacement
   - 34 `exp_b3_f1.mjs` pointed the row at one kind-4 text record. The row drew "All". The chooser stayed the two priority buttons
   - 35 listing check, 70 to 80 instructions per file, 0 mismatches
   - 36 cell extract

4. **Files examined:** The documents in section 2. Image bytes of the key-8 directory `0x615cc934`, the 416-record array `0x615c540c`, records `0x615c5dcc`–`0x615c5e2c`, rows `0x6158dc44` and `0x6158dc68`, option lists `0x6158ba04` and `0x6158ba1c`, descriptors `0x6062132c` and `0x606200e4`, template `0x606190b7`. Listings, all byte-checked: `0x611a01e8` (48), `0x611a01ee` (40), `0x6127e750` (16), `0x61283b1c` (80), `0x61283d90` (70), `0x61283e70` (40), `0x6124f4e5` (70), `0x6124f11a` (80). `0x61283bd0` (40) also matches the image bytes; the aligned function listing is the one from `0x61283b1c`.

5. **Files created:** Under `work\` only. The manifest lists each file. The ones this result relies on are `work/out/binding.md`, `work/out/design.md`, `work/out/overlay-changed-bytes.csv`, `work/out/exp-b1-f2.jsonl`, `work/out/exp-b4-f1.jsonl`, `work/out/exp-b2-f1.jsonl`, `work/out/exp-b3-f1.jsonl`, `work/out/probe-ram-f1.jsonl`, `work/out/listing-check-f1.txt`, `work/out/cells-f1.txt`, and the screenshots `work/out/exp-b4-f1-3d6f-after.png`, `work/out/exp-b2-f1-3d6f-before.png`, `work/out/exp-b3-f1-3d6f-before.png`.

6. **Findings:**
   1. STATIC. `0x611a01e8` is `movhu (0x54,A0),D0` / `retf`. It returns a halfword. It does not convert the second dispatch word.
   2. OBSERVED-EMU. On the chooser-open path that entry was called with D1 in `{12, 339, 0, 7}`.
   3. STATIC. `FUN_6124f4e5` compares the sought id with the first word of each 24-byte record. The compare is `0x6124f523`. The directory entry for key 8 is at `0x615cc934`: pointer `0x615c540c`, count 416.
   4. DATA. The record is 24 bytes: id, `0x3b`, UI id, `0x42`, a sequential word, 0. The option pointer is not in it. `0x1e0`–`0x1e4` are UI 2156, 2157, 2205, 2154, 2155. `0x1e6` is free. The array and the directory are in compressed section 7.
   5. OBSERVED-EMU. RAM at `0x6031efe0` is image `0xFF`. RAM at `0x6031f000` and at `0x60320000` is `0xA5` until written. A write of `0x11223344` at `0x60320000` read back.
   6. OBSERVED-EMU. With the 417 records written at `0x60320000`, menu OK on 2154 matches editor `0x1e3` and copies UI 2154; 2155 matches `0x1e4` and copies UI 2155; the new row matches `0x1e6` and copies UI `0x3D6F`. A direct call with D1 = `0x1e0` matches and copies UI 2156. Traces were capped at 100000, dropped 0.
   7. OBSERVED-EMU. That binding alone opens a blank box whose help text is the value-0 priority sentence. Confirm called `0x6041937f` with UI `0x3D6F` and D1 `0x60E1A90C`; the stored low byte was 12.
   8. OBSERVED-EMU. Replacing the descriptor at `0x6031e9a0` with a clone of 2154's (`0x6062132c`: template `0x606190b7`, count 2) and linking it makes `FUN_604058bc(0x3D6F)` return `0x6031e9a0`. OK then opens the two priority buttons. Right moves to the other value. Confirm calls `0x6041937f` with `(15727, 1)`. The profile byte becomes 1. Cancel leaves it 0. `0x90a1` stays `[1, 1]`.
   9. OBSERVED-EMU. Pointing the row at `0x6158ba1c` draws the All grid on the row. The chooser stays the two priority buttons. Confirm still stores 1. The ten zone images do not appear.
   10. OBSERVED-EMU. A kind-4 record, value 0, text id `0x0034`, draws the word All on the row. The chooser stays the two priority buttons.
   11. DATA. Text id `0x0034` is the exact English string "All" in resource string record 5. Value 0 of `0x6158ba1c` is image `0x23a3`, which the B2 row drew as that grid. Exact English strings also exist for "Single" (`0x0070`), "C1" (`0x122c`) and "C2" (`0x122d`). No exact English string is "Cross", "Mid" or "Large". No record found here ties Single, C1 or C2 to a zone value.
   12. INFERRED. The row's option pointer selects the glyph drawn on the row. The chooser that OK opens follows the editor descriptor. The word at record +16 was copied unchanged; its role is not established.
   13. HYPOTHESIS. A descriptor whose template presents the ten records at `0x6158ba1c` would open those images. This run did not build that descriptor.

7. **Evidence for each claim:**
   1. `work/out/disasm-01e8-f1.txt` lines 1–2. `work/out/listing-check-f1.txt` says 48/48 bytes match.
   2. `work/out/trace-bind-f1.jsonl` summary of the slot-4 log.
   3. `work/out/disasm-f4e5-f1.txt` lines for `0x6124f522` and `0x6124f523`. Directory decode in `work/out/binding-tail-f1.txt`.
   4. `work/out/binding-table-f1.txt`. Runtime copy in `work/out/summary-b1-f2.txt`.
   5. `work/out/probe-ram-f1.jsonl`.
   6. `work/out/summary-b1-f2.txt` and `work/out/cells-f1.txt` step `caf-1e0`. The C-AF line is a direct call, not a menu OK.
   7. `work/out/exp-b1-f2-3d6f-after.png`. Setter in `work/out/summary-b1-f2.txt`.
   8. `work/out/summary-b4-f1.txt`. `work/out/exp-b4-f1-3d6f-after.png`. `work/out/cells-f1.txt` steps `3d6f-after`, `3d6f-cancel`, `3d6f-confirm`. At `0x611a26e1` the third compare is D0 15727, D1 15727, A2 `0x6031ea30`.
   9. `work/out/exp-b2-f1-3d6f-before.png` and `work/out/exp-b2-f1-3d6f-after.png`. `work/out/summary-b2-f1.txt`.
   10. `work/out/exp-b3-f1-3d6f-before.png` and `work/out/exp-b3-f1-3d6f-after.png`.
   11. `work/out/zone-text-f1.txt`. Zone records in `work/out/template-f2.txt`.
   12. Claims 8–10 together. The +16 word is in the copied record bytes in `work/out/summary-b1-f2.txt`.
   13. Not tested.

   Cell readback on the B4 confirm, after the profile byte had become 1. The same cells on the preceding cancel, with the profile byte still 0, match these except the profile byte. There is no stock control in this task, so this is the session's own before/after, not a control comparison. `0x90a1` `[1, 1]`. `0x1dd1` `[27, 39, 3, 3, 3, 3, 3, 3, 3, 3]`. `0x99a1` `[2, 0, 2, 0, 2, 0, 5, 5]`. `0x9a41` `0`. `0x5962` `[526, 526, 526, 526, 526, 526]`. Home: `0x99d2` `[526, 526, 526]`, `0x9fa1` `[0, 0, 0]`, `0xdfa1` `[0]`, `0x1ea1` `[0]`, `0x9ec1` `[0]`, `0x9ed1` `[1]`, `0x9ee1` `[0]`, `0x9ef1` `[0]`, `0x59b1` `[0]`. Ids 2274–2279 have no backing cell through this UI-map route: the mapped getter returns key 0, and the typed accessor `0x60063a20` was not called. `0x60063431` count on that confirm group is 0. `0x60063380` count is 228. Dropped counters are 0. Cap 100000.

8. **Tests and outcomes:**
   - B1 overlay placement at `0x60320000`: FAIL. The directory redirect was live and every record word was `0xA5A5A5A5`. Chooser did not open.
   - B1 runtime copy of the binding: BOUNDARY. The lookup copies UI `0x3D6F`, and a screen opens. The two buttons do not draw. Confirm stores 12, which is not an option value. Cancel leaves the byte 0. `0x90a1` stays `[1, 1]`.
   - B4 descriptor: PASS for the brief's B1 questions, as a second change. OK opens the two-option chooser. Confirm of the value not currently held calls `0x6041937f` with UI `0x3D6F` and stores 1. Cancel leaves 0. `0x90a1` stays `[1, 1]`.
   - B2 zone images: FAIL. The row draws one zone glyph. The chooser does not show the ten images. Confirm stores the priority value 1.
   - B3 text list: FAIL for the same chooser question. The row draws "All". The chooser stays the two priority buttons.
   - Acceptance (T3a §4 under §7 item 3): not run. B2 and B3 did not commit a zone value from the zone list.

9. **New versus previously established:**
   - Claim 1 is new. T3e left the body of `0x611a01e8` unlisted.
   - Claim 3 is new. T3e had not identified `FUN_6124f4e5`.
   - Claim 4 confirms T3e's record layout for the action record's second word, and adds the binding-table layout.
   - Claim 5 is new. T3e's overlays stayed below `0x6031f000`.
   - Claim 8 confirms T3a: `FUN_604058bc` returns `0x6031e9a0` only after the bucket link. It contradicts the hope that the binding record alone selects the chooser chrome.
   - Claim 9 confirms T3a's description of value 0 as the grid marked All, for the row glyph. It does not open the ten-image editor.
   - The commit of UI `0x3D6F` with value 1 is new.

10. **Remaining uncertainties.** The word at binding-record +16 was not varied. C-AF Area was not opened from a menu. `0xA70F` was not shown to be unregistered. The 10008-byte copy lives at `0x60320000`, which the image does not load; a final placement is open. Whether a different descriptor template would present `0x6158ba1c` was not tested. Cell readbacks were not compared with a stock control. `0x9ed1` was already 1 before the AF-ON confirm.

11. **Recommended next actions.** One experiment, stated before it runs: give `0x3D6F` a descriptor cloned from the zone editor (template `0x606178b1`, count 10) instead of from 2154, keep the binding and the row pointer at `0x6158ba1c`, and see whether the ten images open. Do not treat that as done. Persistence and the T3a acceptance stay gated on that chooser storing a zone value.

12. **Deviations from the brief.** B1's binding alone did not draw the chooser, so the commit that answers B1's questions is B4, a second change (the descriptor). B2 was run against that B4 baseline because B1 had not committed an option value. B2 and B3 did not show the zones, so acceptance was not run. `probe_ram_f1.mjs` was edited after command 18 failed, then run as command 19. Command 06 and command 30 failed and were replaced rather than overwritten. The C-AF trace is a direct call. Traces were capped at 100000 with dropped counters of 0. The manifest command's `.out`, `.err` and `.exit` are absent from `outputs`.
