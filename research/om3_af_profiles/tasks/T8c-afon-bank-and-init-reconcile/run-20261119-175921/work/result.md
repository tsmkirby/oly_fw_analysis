# T8c result

## Q1. Which bank the stock editor writes, and which bank the reader uses

Reused from the retained measurement. Stock body, no overlay, T8 bring-up, one Up through native keys. Link cells were read back after the keys.

| Link, read back | Pose | Pose word | EXIF | Editor `0x5962` index | Write | T6 formula |
| --- | --- | --- | --- | --- | --- | --- |
| area 1, point 1 | landscape | 1 | 1 | 0 | 526 → 409 | 1 |
| area 1, point 1 | EXIF 6 | 2 | 6 | 4 | 526 → 409 | 5 |
| area 1, point 1 | EXIF 8 | 4 | 8 | 2 | 526 → 409 | 3 |
| area 0, point 0 | landscape | 1 | 1 | 0 | 409 → 292 | 1 |
| area 0, point 0 | EXIF 6 | 2 | 6 | 0 | 292 → 175 | 1 |
| area 0, point 0 | EXIF 8 | 4 | 8 | 0 | 175 → 58 | 1 |

The T6 column is the design formula, calculated from the pose word and the link. It was not executed as a hook in that measurement, and it was not executed as a hook in this correction. The formula is: both link cells 1 and pose word 2 select 5; both 1 and pose word 4 select 3; otherwise 1.

The stock editor writes the saved index (0, 4, 2 when linked, and 0 for every pose when not). The UI-id table at `0x6062555c` pairs them: 1338/1339, 1646/1647, 1648/1649 are saved/change indices 0/1, 2/3, 4/5. The accepted T6 reader used the change index. `bank()` in this task returns the saved index. On the correction proof's landscape AF-ON press, the running hook's zone read and position read both used bank 0. The static formula for that pose is 1.

The stock ten-byte writer `0x609b3c79` does not read a pose bank. Its immediates are `0x9a41[0]`, `0x1dd1[0]`, `0x1dd1[1]`, `0x84d1[0]`, `0x88b2[0]`, `0x1df1[0]`, and `0x1e01[0]`.

## Q2. Reset, ROM, and the fresh store, all 63 slots

Reused from the retained Initialize All Settings → Yes readback and the ROM registration walk. Reset equals the fresh store at every slot. ROM payloads that the registration records contain are 0. `0x9a41`'s record has count 1, so index 1 is outside that record; the table uses 0 for it, and there is no second hit. Fifty slots differ from that ROM value. Thirteen are 0 in all three columns.

| Key | Index | Reset | ROM | Fresh |
| --- | --- | --- | --- | --- |
| 0x99a1 | 0 | 2 | 0 | 2 |
| 0x99a1 | 1 | 0 | 0 | 0 |
| 0x99a1 | 2 | 2 | 0 | 2 |
| 0x99a1 | 3 | 0 | 0 | 0 |
| 0x99a1 | 4 | 2 | 0 | 2 |
| 0x99a1 | 5 | 0 | 0 | 0 |
| 0x99a1 | 6 | 5 | 0 | 5 |
| 0x99a1 | 7 | 5 | 0 | 5 |
| 0x9a41 | 0 | 0 | 0 | 0 |
| 0x9a41 | 1 | 1 | 0 | 1 |
| 0x5962 | 0 | 526 | 0 | 526 |
| 0x5962 | 1 | 526 | 0 | 526 |
| 0x5962 | 2 | 526 | 0 | 526 |
| 0x5962 | 3 | 526 | 0 | 526 |
| 0x5962 | 4 | 526 | 0 | 526 |
| 0x5962 | 5 | 526 | 0 | 526 |
| 0x1dd1 | 0 | 3 | 0 | 3 |
| 0x1dd1 | 1 | 3 | 0 | 3 |
| 0x1dd1 | 2 | 3 | 0 | 3 |
| 0x1dd1 | 3 | 3 | 0 | 3 |
| 0x1dd1 | 4 | 3 | 0 | 3 |
| 0x1dd1 | 5 | 3 | 0 | 3 |
| 0x1dd1 | 6 | 3 | 0 | 3 |
| 0x1dd1 | 7 | 3 | 0 | 3 |
| 0x1dd1 | 8 | 3 | 0 | 3 |
| 0x1dd1 | 9 | 3 | 0 | 3 |
| 0x84d1 | 0 | 3 | 0 | 3 |
| 0x88b2 | 0 | 526 | 0 | 526 |
| 0x90d1 | 0 | 2 | 0 | 2 |
| 0x90d1 | 1 | 2 | 0 | 2 |
| 0x90d1 | 2 | 2 | 0 | 2 |
| 0x90d1 | 3 | 2 | 0 | 2 |
| 0x90d1 | 4 | 2 | 0 | 2 |
| 0x90d1 | 5 | 2 | 0 | 2 |
| 0x90d1 | 6 | 5 | 0 | 5 |
| 0x90d1 | 7 | 5 | 0 | 5 |
| 0x5a11 | 0 | 1 | 0 | 1 |
| 0x5a11 | 1 | 1 | 0 | 1 |
| 0x5a11 | 2 | 1 | 0 | 1 |
| 0x5a11 | 3 | 0 | 0 | 0 |
| 0x5a11 | 4 | 1 | 0 | 1 |
| 0x5a11 | 5 | 0 | 0 | 0 |
| 0x5a11 | 6 | 0 | 0 | 0 |
| 0x5a11 | 7 | 0 | 0 | 0 |
| 0x5a11 | 8 | 0 | 0 | 0 |
| 0x5a11 | 9 | 1 | 0 | 1 |
| 0x5a11 | 10 | 1 | 0 | 1 |
| 0x1de1 | 0 | 1 | 0 | 1 |
| 0x1de1 | 1 | 1 | 0 | 1 |
| 0x1de1 | 2 | 1 | 0 | 1 |
| 0x1de1 | 3 | 1 | 0 | 1 |
| 0x1de1 | 4 | 1 | 0 | 1 |
| 0x1de1 | 5 | 1 | 0 | 1 |
| 0x1de1 | 6 | 1 | 0 | 1 |
| 0x1de1 | 7 | 1 | 0 | 1 |
| 0x1df1 | 0 | 1 | 0 | 1 |
| 0x1df1 | 1 | 1 | 0 | 1 |
| 0x1df1 | 2 | 1 | 0 | 1 |
| 0x1df1 | 3 | 1 | 0 | 1 |
| 0x1df1 | 4 | 0 | 0 | 0 |
| 0x1df1 | 5 | 0 | 0 | 0 |
| 0x1df1 | 6 | 0 | 0 | 0 |
| 0x1df1 | 7 | 0 | 0 | 0 |

`initMirror()` already writes these reset values into `FF` fields. It was not changed.

1. **Task identifier and brief version used:** T8c, brief dated 2026-11-19, including section 5 (the correction after `run-20261119-174338-review`). Section 0 was followed: T8b decision, both T8b reviews, the T7 decision "Direct editor banks", and the T6 design. The digest of `brief.md` is `brief_sha256` in `work/evidence-manifest.json`.
2. **Research baseline used:** T6 design, T7 decision, T8 brief and decision, T8b brief and decision, both T8b reviews, T3m and T3l briefs and decisions, T3j, T5, and T3b briefs and decisions, and Sol's T8c review `audit/previous-review.md`. Main image `inputs/00_0100_50000020.decoded.bin` sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. Resource `inputs/02_0106_458c0020.decoded.bin` sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. `OM_EMU_MODEL=E147`, `OM_EMU_NVRAM=off`.
3. **Work performed:** Q1 and Q2 were not re-measured. Command 23 rebuilds the 63-slot table from `work/out/q2b-summary.json` and `work/out/rom-and-writer-q1.json`. Commands 24 and 27 generate the proof table. Commands 25 and 28 run the static checker. Three new emulator processes: command 26 (`proof4`) stopped because image `MODE` is 255; command 29 (`proof5`) stopped because a bare-stock S1 leaves the image-era All record; command 30 (`proof6`) stopped because the AF-ON press ten-byte differs from K1e's S1 half-press ten-byte. Command 30 ran K1e, K2, and the candidate in that one process. K1e and K2 finished. The candidate stopped at `af-down`.
4. **Files examined:** The retained Q1 listings and `work/out/ui-index-q1.json`, `work/out/rom-and-writer-q1.json`, `work/out/q1.jsonl`, `work/out/q2b-summary.json`. T6 design bank formula at "What the AF-ON record must read instead". This correction's `work/out/proof6.jsonl`.
5. **Files created:** Under `work/` only. The behaviour change remains `bank()` returning the saved index, now in `work/scripts/hook_t8c3.mjs`, which adds a read log and leaves `initMirror()` as it was. The manifest lists the files.
6. **Findings:**
   1. OBSERVED-EMU. With the link read back as 1 and 1, one Up writes `0x5962` index 0, 4, or 2 for landscape, EXIF 6, and EXIF 8. With the link read back as 0 and 0, every pose writes index 0. Retained from Q1.
   2. STATIC. The T6 design formula for those inputs is 1, 5, 3, and 1. That number is calculated from the design text. The T6 hook was not run in this correction.
   3. OBSERVED-EMU. On the candidate landscape AF-ON press, the hook's zone return and position return both used bank 0. `work/out/proof6.jsonl` step `candidate-af-down`, `reads`, `readBank` 0, `staticT6Bank` 1.
   4. DATA. At `0x6062555c`, UI ids 1338, 1646, and 1648 are saved indices 0, 2, and 4. UI ids 1339, 1647, and 1649 are change indices 1, 3, and 5. Retained.
   5. OBSERVED-EMU. Reset equals the fresh store at all 63 slots. ROM registration payloads are 0. Fifty slots differ. The thirteen zeros are listed in `work/out/slots-q2.json`.
   6. OBSERVED-EMU. Image `MODE` is 255 before the hook writes it. `proof4` step `k1e-base`.
   7. OBSERVED-EMU. On the bare stock image, after the landscape edit to position 292, S1 leaves both ten-byte buffers at `[14, 2, 2, 0, 27, 0, 39, 0, 0, 0]`. `proof5` step `k1e-ke-s1-down`. That record was rejected as the image-era All target.
   8. OBSERVED-EMU. With the overlay installed and the reader hook absent, the same landscape edit then S1 writes `[36, 1, 3, 0, 3, 0, 3, 0, 0, 0]`, position 292, owner 1. Hash `a339ae3715fecad91a23d9ca277f44d375269a5bfa93366420a6ed85a1ee5822`, taken when the step was read. `proof6` step `k1e-ke-s1-down`.
   9. OBSERVED-EMU. The candidate's AF-ON press writes `[36, 1, 3, 0, 1, 0, 1, 0, 0, 0]`, owner 2, edge status 0 and enabled 1, flag 0. The position halfword is 292, which is the mirror cell at bank 0. The live `0x5962[0]` stays 526. The bytes at +4 and +6 are 1. K1e's S1 record has 3 there. The run stopped on that comparison.
   10. OBSERVED-EMU. Immediately before that press, the candidate's S1 and K2's S1 both wrote `[14, 2, 3, 0, 3, 0, 3, 0, 0, 0]`, position 526. That cross-check passed. The AF-ON release that would have been judged against it was not run.
   11. INFERRED. T7's 1/5/3 and this T8 session's 0/4/2 are the two columns of the UI-id table. The compare that selects UI id 1338 rather than 1648 was not listed. The link state was measured and was not the cause of the split.
7. **Evidence for each claim:** (1)(4) `work/out/q1.jsonl` and `work/out/ui-index-q1.json`. (2) T6 design, the bank bullets under "What the AF-ON record must read instead"; the runner logs the same arithmetic as `staticT6Bank`. (3)(8)(9)(10) `work/out/proof6.jsonl`. (5) `work/out/slots-q2.json`. (6) `work/out/proof4.jsonl` step `k1e-base`. (7) `work/out/proof5.jsonl` step `k1e-ke-s1-down`. (11) the UI-id pairs plus the Q1 rows; no listing of the selector branch.
8. **Tests and outcomes:** Q1 rows PASS, retained. Q2 63-slot comparison PASS, retained. Generated-table checker PASS (`work/out/proof-check5.json`, 32 steps, 0 problems). `proof4` FAIL at `k1e-base` on the image flag. `proof5` FAIL at `k1e-ke-s1-down` on the unchanged All record. `proof6` K1e and K2 PASS through their steps, including identity before K1e's OK, MENU, and the return-to-shooting key. Candidate landscape edit PASS: mirror bank 0 moved 526 → 409 → 292, live `0x5962[0]` stayed 526, zone stayed 2. Candidate pre-press S1 PASS against K2. Candidate AF-ON press FAIL: full ten-byte differs at the size bytes. `0x1e71[0]` stayed 0 through the last step. The EXIF 6 candidate press, the return to landscape, and the normal edit were not run. Terminal `ok` is false.
9. **New versus previously established:** (1)(2)(4)(5) confirm the retained T8c measurement and the T6 formula. (3) is the dynamic read of the saved-index hook, beside the static formula. (8) confirms the stock half-press shape K2 produced in the previous proof, now from K1e's own S1 and hashed at that step. (9) confirms the converter's Small 1×1 from the previous candidate press, now judged against that K1e record. The full-record comparison fails. (11) is the same inference as the previous result, stated as inference because the selector branch was not listed.
10. **Remaining uncertainties.** The AF-ON release, the EXIF 6 press, the return to landscape, and the normal-edit comparison were not reached. K1e's own EXIF 6 S1 did run, in K1e's session, and wrote `[153, 1, 3, 0, 3, 0, 3, 0, 0, 0]` at bank 4 position 409 (`proof6` step `k1e-ke-p-s1-down`). The candidate never pressed AF-ON in that pose, so that record was not used as a judged expectation. Whether the release would have restored `[14, 2, 3, 0, 3, 0, 3, 0, 0, 0]` was not tested. The selector branch behind T7's change index and this session's saved index remains unlisted.
11. **Recommended next actions.** The press comparison needs a coordinator decision: the stock half-press writer emitted 3 at the size bytes, and the AF-ON converter emitted 1, at the same position 292. This run did not accept either shape as a substitute. No storage decision and no hardware recommendation follow from this task.
12. **Deviations from the brief.** The proof did not end `ok: true`. It stopped at the first failed assertion, the landscape AF-ON press ten-byte. The zone was already Small (stored value 2) at reset, so the dial was not turned. A bare-stock K1e S1 does not replace the All record, which matches the T7 finding that stock S1 does not enter the writer; the K1e session that produced the press reference used the same overlay as K2 and did not install the reader hook, so the editor still wrote the live cells. The link cells in the proof were written with the setter and labelled test setup. Three new emulator processes were used, of the six authorized. `initMirror()` was not modified. The reader change is labelled EMULATOR-ONLY.
