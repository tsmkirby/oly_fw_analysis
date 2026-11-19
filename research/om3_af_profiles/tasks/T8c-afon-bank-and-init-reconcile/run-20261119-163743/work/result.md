# T8c result

## Q1. Which bank the stock editor writes, and which bank the reader uses

Stock body, no overlay, T8 bring-up, one Up through native keys. Link cells were read back after the keys. `0x5991[0]` stayed 1 and `0xe1f1[0]` stayed 0.

| Link, read back | Pose | Pose word | EXIF | Editor `0x5962` index | Write | T6 reader index |
| --- | --- | --- | --- | --- | --- | --- |
| area 1, point 1 | landscape | 1 | 1 | 0 | 526 → 409 | 1 |
| area 1, point 1 | EXIF 6 | 2 | 6 | 4 | 526 → 409 | 5 |
| area 1, point 1 | EXIF 8 | 4 | 8 | 2 | 526 → 409 | 3 |
| area 0, point 0 | landscape | 1 | 1 | 0 | 409 → 292 | 1 |
| area 0, point 0 | EXIF 6 | 2 | 6 | 0 | 292 → 175 | 1 |
| area 0, point 0 | EXIF 8 | 4 | 8 | 0 | 175 → 58 | 1 |

A later setter poke of the same link cells, labelled test setup, wrote the same indices: EXIF 6 index 4, EXIF 8 index 2. Landscape did not move because the cell was already at the top of travel, and the getter still addressed index 0.

The link cells were on. The editor writes the saved index of that pose (0, 4, 2), and index 0 for every pose when the link is off. The accepted T6 reader uses the change index, one higher (1, 5, 3, and 1 when not linked). The UI-id table at `0x6062555c` is the same split: UI id 1338 / 1648 / 1646 are `0x5962` indices 0 / 4 / 2, and 1339 / 1649 / 1647 are 1 / 5 / 3.

The stock ten-byte writer `0x609b3c79` does not read a pose bank. Its immediates are `0x9a41[0]`, `0x1dd1[0]`, `0x1dd1[1]`, `0x84d1[0]`, `0x88b2[0]`, `0x1df1[0]`, and `0x1e01[0]`. One Up never entered it.

## Q2. What stock reset writes

Reset was Initialize All Settings, confirmed with Yes, from tab 6 page 6. Every half-press cell the mirror copies was read before and after. Reset equals the fresh store at all 63 slots. The ROM registration payload of every one of those keys is 0. Fifty slots therefore disagree with the ROM, and reset and the fresh store agree with each other. The thirteen slots that are 0 in all three are `0x99a1[1]`, `0x99a1[3]`, `0x99a1[5]`, `0x9a41[0]`, `0x5a11[3]`, `0x5a11[5]`, `0x5a11[6]`, `0x5a11[7]`, `0x5a11[8]`, `0x1df1[4]`, `0x1df1[5]`, `0x1df1[6]`, and `0x1df1[7]`.

`initMirror()` already writes these reset values into FF fields. That part was not changed.

1. **Task identifier and brief version used:** T8c, brief dated 2026-11-19. Section 0 was followed: T8b decision, both T8b reviews, the T7 decision, and the T6 design.
2. **Research baseline used:** T6 design, T7 decision, T8 brief section 5 and decision, T8b brief and decision, the two T8b reviews, and the accepted hook in the T8b runner. Main image `inputs/00_0100_50000020.decoded.bin` sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. Resource `inputs/02_0106_458c0020.decoded.bin` sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. `OM_EMU_MODEL=E147`, `OM_EMU_NVRAM=off`.
3. **Work performed:** Static ROM and writer check (command 01). Stock bank observation (02), which stopped at a wrong-page identity check before any OK on reset. Immediate scan (03) and three read-only disassemblies (04, 07, 12). Menu map (09) and UI-id table (10). Stock reset (11). Generated proof table and checker (13, 15, 18, 19). Three proof processes (16, 17, 20). Six emulator processes in all. The sixth stopped at the release assertion and nothing after that assertion was run.
4. **Files examined:** Image at the addresses below. `work/out/listings/editor-wrap-q1.txt` (`0x6041931e` through `0x604193c7`). `work/out/listings/ui-index-q1.txt` (`0x60419696`). `work/out/ui-index-q1.json`. `work/out/rom-and-writer-q1.json`. `work/out/q1.jsonl`, `work/out/q2b-summary.json`, `work/out/proof3.jsonl`.
5. **Files created:** Under `work/` only. The manifest lists them. The behaviour change is `work/scripts/hook_t8c2.mjs`: `bank()` returns the saved index. `initMirror()` is the accepted function.
6. **Findings:**
   1. OBSERVED-EMU. With the link read back as 1 and 1, one Up writes `0x5962` index 0, 4, or 2 for landscape, EXIF 6, and EXIF 8. With the link read back as 0 and 0, every pose writes index 0.
   2. OBSERVED-EMU. The T6 formula for those same inputs is 1, 5, 3, and 1. The two indices differ by one on every measured row.
   3. STATIC. `0x6041931e` turns a UI id into a key (`0x60419446`) and an index (`0x60419696`) and calls the settings wrapper `0x6041a1f9`. The call returns at `0x60419360`, which is the return captured on the direct-screen read.
   4. DATA. At `0x6062555c`, stride 4, the halfword at +2 is the index. UI ids 1338, 1646, and 1648 are `0x5962` indices 0, 2, and 4. UI ids 1339, 1647, and 1649 are indices 1, 3, and 5.
   5. STATIC. The writer window `0x609b3c79` contains the fixed key immediates listed above and does not contain the pose word, `0x99a1`, `0x1db1`, or `0x1dc1`.
   6. OBSERVED-EMU. Reset equals the fresh half-press image. ROM payloads are 0. Fifty slots disagree, and on each of them reset and the fresh store are the same non-zero value.
   7. OBSERVED-EMU. On the candidate, AF-ON entry fills the mirror with that reset image. The editor then writes mirror bank 0 to 409 and then 292, zone 2, while the live cells stay at 526. AF-ON press writes ten-byte `[36, 1, 3, 0, 1, 0, 1, 0, 0, 0]`, position 292, Small 1×1, owner 2.
   8. OBSERVED-EMU. AF-ON release sets owner 0 and writes `[14, 2, 3, 0, 3, 0, 3, 0, 0, 0]`, position 526 and size 3×3. That is not K1e's pre-press record `[14, 2, 2, 0, 27, 0, 39, 0, 0, 0]`. The run stopped on that assertion.
   9. INFERRED. The editor and the reader differ because one uses the saved index and the other uses the change index. The link was not the cause. T7's 1/5/3 is the change set; this T8 session, with `0xe1f1[0]` at 0, uses the saved set.
7. **Evidence for each claim:** (1)(2) `work/out/q1.jsonl` steps `native-on-landscape`, `native-on-exif6`, `native-on-exif8`, `native-off-landscape`, `native-off-exif6`, `native-off-exif8`. (3) `work/out/listings/editor-wrap-q1.txt` lines for `0x60419345` and `0x6041935b`. (4) `work/out/ui-index-q1.json`. (5) `work/out/rom-and-writer-q1.json`, `writerChecksOk` true. (6) `work/out/q2b-summary.json`, `disagreements` empty, and the ROM report. (7)(8) `work/out/proof3.jsonl` steps `candidate-enter-land`, `candidate-e-up`, `candidate-af-down`, `candidate-af-up`.
8. **Tests and outcomes:** Q1 bank rows PASS. Q2 reset comparison PASS. Direct-screen identity before OK PASS on K1e, K2, and the candidate (`9d6a92dc9914061304a8f94e2515a22b5fd6ba2846405649f740cc62282aea02`, highlight null, screen `direct`). `0x1e71[0]` stayed 0. Candidate press PASS: Small 1×1 at the edited bank, owner 2. Candidate release FAIL: owner 0, record was the 3×3 center record rather than K1e's All record. The run stopped. EXIF 6 press and release, the return to landscape, and the candidate's normal-edit comparison were not run. K2's own normal edit and half-press did complete, in a separate session: after the same two Ups and OK, S1 wrote `[36, 1, 3, 0, 3, 0, 3, 0, 0, 0]` and owner 1 (`work/out/proof2.jsonl` step `k2-n-s1`).
9. **New versus previously established:** (1) contradicts the T7 decision's 1/5/3 for this T8 setup, and confirms the T8b measurement that landscape wrote index 0 and EXIF 6 wrote index 4. (2) confirms the T6 design's reader formula and shows it is the change index. (6) confirms the T8b count of 50 ROM disagreements and replaces that task's ROM tie-break: the stock reset writes the fresh values, not the ROM zeros. (7) is new.
10. **Remaining uncertainties.** The direct screen's own pose branch, the code that chooses UI id 1338 rather than 1648, was not listed as a single compare. The measured indices and the UI-id table identify which id was used. The release record's 3×3 center value was not followed with another session. Whether an EXIF 6 press would write position 409 at index 4 was not reached.
11. **Recommended next actions.** One more candidate session whose release expectation is the half-press record the stock writer actually emits, then the EXIF 6 press and the K2 comparison. No storage decision and no hardware recommendation follow from this task.
12. **Deviations from the brief.** The proof did not end `ok: true`. It stopped at the first failed assertion, the release record. The zone was already Small (stored value 2) at reset, so the dial was not turned; a detent would have selected Cross. The direct screen was identity-checked before OK. The link cells in the proof were written with the setter and labelled test setup, after Q1 had measured the same indices from native keys. Six emulator processes were used. `initMirror()` was not modified. The reader change is labelled EMULATOR-ONLY and is not a storage decision.
