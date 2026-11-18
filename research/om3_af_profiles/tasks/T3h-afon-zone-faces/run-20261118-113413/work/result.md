# T3h result

1. **Task identifier and brief version used:** T3h, brief version 2026-11-18. Section 0 is T3g's brief §0.

2. **Research baseline used:** T3g `decision.md` and Sol's review `run-20261118-112628-review`; T3g `out/design.md`, `out/descriptors.md`, and the Z1 and `accept_g4.mjs` scripts; T3a brief §4 and §7 item 3; `AFON-MENU-RESEARCH.md` on the page-27 editor; decompilations `611c7785`, `611c782f`, `611f81aa`, `611f7f01`, `6124f11a`, `6124f4e5`. Firmware SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` for both `inputs/00_0100_50000020.decoded.bin` and the unpacked `0100` block. Resource block `0101` SHA-256 `6d2bef74b4b2fa089f271529482f96505a170b91e79ab9b1a13f3ce8f7918226`. The T3a overlay CSV SHA-256 `ff14ccafef13d99eae88c5e742ddb304598c31bb01c1257fe71f922c4b3536d2`. Execution-time helper hashes are the first line of `work/out/trace-faces-h1.jsonl` and of `work/out/accept-h1.jsonl`.

3. **Work performed:** Every command went through `node26 work/scripts/run_logged.mjs`. The records are `work/out/cmd/01` through `work/out/cmd/25`, and the manifest command after them. Command 21 writes the overlay CSV. Commands 23, 24 and 25 record node v26.12.1, Python 3.12.7 and OpenJDK 25.0.5. Static dumps 01, 05, 09, 11, 14. Ghidra listings 02, 06, 16, checked by 03, 15, and the listing check after this file. Dynamic traces 04 (Z1 faces), 08 (face-table key), 12 (widget parent). Experiment 17 is the one face change; the process died on the cancel key. 19 is the same change with a shorter walk and records cancel and confirm. 20 is the acceptance.

4. **Files examined:** `brief.md`, `TASK.md`, `review-brief.md`, `templates/result.md`, the T3g and T3a documents above, `ref/analysis/decompiled-main/all-functions.asm` at `FUN_611f81aa`, `FUN_611f7f01`, `FUN_611f7aff`, `FUN_6124f11a`, `FUN_6124f4e5`, and the image `inputs/00_0100_50000020.decoded.bin`. Addresses are in `work/out/faces.md`.

5. **Files created:** Everything under `work/` except the manifest, which is written last. The manifest lists each path.

6. **Findings:**

   1. STATIC. The chooser slot call is `FUN_611c7785` at `0x611f83aa`, return `0x611f83b1`. The list is the word at the face record +0xc and the count is the halfword at +8. The record is `*(object+0xdb8)`.
   2. STATIC. `FUN_611f7f01` selects that record from `0x6037bedc`, stride `0x24`, by the halfword copied from the binding record's word at +0x10.
   3. DATA. Key `0x2d` is record 76 at `0x6037c98c`: count 2, list `0x61575880`, help `0x61576520`. That list is kind 4, value 0 id `0x124f`, value 1 id `0x127b`.
   4. OBSERVED-EMU. In Z1 those two values draw `@A02F@ Priority` and `@A066@ Priority`. The other eight slot values are absent from the list and the slots are blank.
   5. STATIC. The row primary list `0x6158ba1c` is what `FUN_61204065` passes to `FUN_611c7785` for the row glyph. The chooser does not read it. The row alternate pointer is 0.
   6. STATIC. The chooser uses `FUN_611c7785`. Image kinds there are 3, `0xc`, 8 and 7. `FUN_611c782f` is the label decoder and its image kinds are only 3 and `0xc`.
   7. DATA. Editor `0x1e3` (2154) uses face key `0x2d`. Editor `0x1e4` (2155) uses `0x2e`. All 96 table keys are selected by some binding.
   8. OBSERVED-EMU. A private copy of record 76 at `0x6031ea48` with count 10 and list `0x6158ba1c`, stored for UI `0x3D6F` only, makes the ten slots draw All, Single, Small, Cross, Mid, Large, C1, C2, C3 and C4. 2154's chooser still shows the priority strings.
   9. OBSERVED-EMU. Cancel leaves the profile at 0. Confirm stores the table value: 3 in the short run, then 2 and 5 in each acceptance session. The setter writes `0xa031e920` and `0x6031e920`.
   10. OBSERVED-EMU. Two candidate sessions and a stock control match on every shared cell, including getter values 0 for UI ids 2274–2279. The native stores are byte-identical (M 262144, E 196608). A new session reads the profile as 0. `0x90a1` stays `[1,1]`. `0x1dd1` indices 0 and 1 move from 3,3 to 27,39 on the control and on both candidates.
   11. INFERRED. A later firmware needs a face-table record with count 10 and list `0x6158ba1c`, selected by a binding word that is not `0x2d`. The existing table has no unselected key. This result does not choose a place for that record.

7. **Evidence for each claim:** (1)(2) `work/out/disasm-611f81aa-h1.txt`, `work/out/disasm-611f820c-h1.txt`, `work/out/disasm-611f7f01-h1.txt`, `work/out/listing-check-h2.txt`. (3) `work/out/static-faces-h2.txt` record 76 and the face-list dump. (4) `work/out/trace-faces-h1.jsonl` step `chooser-open`, screenshots `work/out/trace-faces-h1-chooser-open.png`. (5) the same log, caller `0x6120408f`, and the row bytes in `work/out/exp-faces-h2.jsonl` step `row-bytes`. (6) `work/out/disasm-7785-h1.txt`, `work/out/disasm-782f-h1.txt`. (7) `work/out/static-bind-h1.txt`, `work/out/static-free-keys-h1.txt`. (8) `work/out/exp-faces-h1-chooser-open.png`, `work/out/exp-faces-h1-chooser-nav-8.png`, `work/out/exp-faces-h1.jsonl` step `chooser-open`, `work/out/accept-h1.jsonl` assert `2154-opened`. (9) `work/out/exp-faces-h2.jsonl` steps `chooser-cancel` and `chooser-confirm`; `work/out/accept-h1.jsonl` steps `c1-zone-commit-1` (profile 2) and `c1-zone-commit-2` (profile 5), and the same for `c2`. (10) `work/out/accept-h1.jsonl` steps `cell-compare`, `store-compare`, `c1-reopen-assert`, `c2-reopen-assert`, `done`. (11) `work/out/design.md`, `work/out/static-free-keys-h1.txt`.

8. **Tests and outcomes:**
   - Z1 face trace: PASS. List `0x61575880`, count 2, priority strings for 0 and 1.
   - Experiment, one change, nine Rights: BOUNDARY. The ten faces rendered (`exp-faces-h1-chooser-nav-0.png` through `chooser-nav-8.png`). The process then died with exit `3221225477` on the cancel key. No confirm was recorded in that process.
   - Same change, three Rights, cancel, confirm: PASS. Profile 0 after cancel, profile 3 after confirm.
   - Acceptance, two sessions plus stock control: PASS. `work/out/accept-h1.jsonl` step `done` is `ok: true`. No assertion record has `ok: false`.

9. **New versus previously established:** (1)(2)(3) new. The face source was unidentified in T3g. (4) confirms T3g's description of the priority strings and the blank slots. (5) confirms T3g: the row list changes the row glyph. (6) confirms Sol's review that `FUN_611c782f`'s kind sets are narrower, and contradicts T3g's statement that the two functions share the kind split. (8) new. T3g's design said the chooser does not draw the zone images; that is true of the row list and false of the face list. (9) confirms T3g's commit path, and confirms Sol's correction that the setter writes the cached alias. (10) confirms T3g's store comparison and adds the getter values T3g did not read. (11) new.

10. **Remaining uncertainties.** The access violation after nine Rights and Menu was not isolated. Cancel from an earlier slot completes. The help pointer is still the two-record priority help list, so values other than 0 and 1 keep the previous help sentence. Where a firmware would put a new face-table record is not chosen.

11. **Recommended next actions.** Keep the face source in the native-data list: a record with count 10 and list `0x6158ba1c`, selected by a binding word other than `0x2d`. Do not treat the `0x611f7f42` hook or the scratch binding array as native. Do not choose storage for the profile byte.

12. **Deviations from the brief.** The first experiment's process died on the cancel key after the nine navigation screenshots. Cancel and confirm were recorded by running the same change again with a three-step walk (`exp_faces_h2.mjs`). No other deviation. The text-list fallback was not used, because the zone images rendered.
