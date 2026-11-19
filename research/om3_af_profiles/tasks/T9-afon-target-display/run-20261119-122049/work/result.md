# T9 result

1. **Task identifier and brief version used:** T9, brief version 2026-11-19. Spec wording from `ref/analysis/button-af/FEATURE-SPEC.md`, 10 November 2026 revision, item 4: “Show the AF-ON target while AF-ON is in control.” Line 57: “Update the displayed AF target to reflect the active profile.”

2. **Research baseline used:** T6 README, `out/design.md` and `out/overlay-changed-bytes.csv`; T6 `scripts/exp_q1_t6.mjs` for the profile-read hook, the Small-at-529 mirror seed, and the half-press All cells. T5 `out/target-bytes.md` and `scripts/zone_session_k1.mjs` for the consumer `0xa33ca384`, the owner block `0xa031ed00`, and the session harness. T5 `out/disasm-home-k1.txt` for the builder return `0x60a8f7d2`. Stock image `inputs/00_0100_50000020.decoded.bin`, sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, 33554368 bytes. Resource `inputs/02_0106_458c0020.decoded.bin`, sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. OM-Emu E147. No new image byte was written, so this task has no overlay row of its own and adds nothing in section 6 or 7.

3. **Work performed:** Every command went through `work/scripts/run_logged.mjs`. Six experiment versions, then stop.
   - 01 `obs_k1_v1.mjs` stock K1. Exit 1. Rest, S1 held and S1 release were recorded. The direct-screen assertion expected zone index 1 and failed because the dial wrote index 0.
   - 02 `scan_png_v1.mjs` located the four corner marks. Exit 0.
   - 03 `obs_k1_v2.mjs` stock K1, Small at a non-centre position. Exit 0.
   - 04 `scan_keys_v1.mjs` plane names. Exit 0.
   - 05 `obs_k1_v3.mjs` getter and small-draw trace. Exit 0.
   - 06 `dump_draws_v1.mjs`. Exit 0.
   - 07, 08, 12, 14 Ghidra `DisasmStockV1.java` on the positioner, the rectangle widget, the kind case and the callers. Exit 0.
   - 09 and 16 checked those listings against the image. Exit 0. 0 mismatches on every file that was checked.
   - 10 `obs_t6_v4.mjs` stopped before a frame because the positioner watch was passed a runtime address. Exit 1.
   - 11 `obs_t6_v5.mjs` T6 candidate and K2. Exit 0.
   - 13 `scan_diff_v1.mjs` viewfinder diffs. Exit 0.
   - 15 `obs_t6_v6.mjs` the one display change. Exit 1 before the session opened.
   - 16 `check_listing_v2.mjs`. Exit 0.
   - 17 writes the manifest and `work/out/manifest-supplement-t9.json`. That supplement cannot hash 17's own `.out`, `.err` and `.exit`, because the wrapper writes them after the script returns.
   - 18 writes `work/out/manifest-seal-t9.json` with those three files plus the manifest and the supplement. Command 18's own `.out`, `.err` and `.exit` are written by the wrapper after that process returns. The `.exit` file contains a timestamp, so this process cannot hash it.

4. **Files examined:** Stock image at file offset `address - 0x60021020`. Positioner `0x609eec84` through the reads at `0x609eed24`–`0x609eed4c`. Kind case `0x609f06a1`. Callers `0x603efa50` and `0x61a43e3f`. Rectangle widget `0x610f6649`–`0x610f66e0`, call at `0x610f66da`. Setting-address store `0x609eff7e`. Getter `0x60063380`. Consumer `0xa33ca384`. Owner byte `0xa031ed00+4`. Half-press cells `0x88b2`, `0x5962`, `0x84d1`, `0x99a1`, `0x1dd1`. Subject Detect `0x1e71[0]`. Builder return `0x60a8f7d2` in the inherited overlay. Listings under `work/out/disasm-*.txt`. Diff `work/out/scan-diff-v1.json`.

5. **Files created:** Under `work/` only. Scripts, `work/out/` (JSONL, PNG, listings, command records, `display.md`), `work/result.md`, `work/evidence-manifest.json` and the supplement. The manifest lists them.

6. **Findings:**
   1. OBSERVED-EMU. Stock K1 on the TFT shooting screen draws four grey corner marks. At rest they occupy (417, 265), (464, 265), (417, 314) and (464, 314), union (417, 265) 66×70. Png `f29e503e88ac6c42974ab698b750d348a2b2e5cd50ed3d1cc5bc46f2cf9bfd69`.
   2. OBSERVED-EMU. Holding S1 and releasing it do not move those marks. After the direct screen sets Small and moves the target, the marks are at (356, 198), (402, 198), (356, 248) and (402, 248), union (356, 198) 65×71, and S1 still does not move them.
   3. OBSERVED-EMU. That move is `0x88b2` and `0x5962[0]`, 526 then 409 then 412. `0x5962[1]` stays 526. `0x99a1[1]` stays 0. The dial writes zone index 0. The ten-byte record stays `[14,2,2,0,27,0,39,0,0,0]` and the dirty byte stays 1.
   4. OBSERVED-EMU. `0x1e71[0]` reads back 0. The Subject Detection row’s highlight is “Subject Detection” and its texts include “Off”. Focus sid 289 and sid 25 are 0.
   5. OBSERVED-EMU. The repaint on leaving the direct screen includes a 4×63 rectangle from return address `0x610f66df` at (356, 202) and another at (417, 202).
   6. STATIC. `0x609eec84` reads `0x88b2` through getter `0x60063380` at `0x609eed3f`, reads the kind through `0x609f0631` case 3 (`0x609f06a1`, key `0x84d1`), and when that kind is 2 stores position 526 at `0x609eed4c`. The listings match the image. The function does not read `0xa33ca384`.
   7. INFERRED. Those reads are the source of the corner position. The corners move with `0x88b2` while the ten-byte record does not change, and the other `0x88b2` immediate at `0x609eff7e` only stores the setting’s address. The OK-window trace did not enter `0x609eed46`.
   8. OBSERVED-EMU. With half-press All (`0x84d1` = 2), the 444 grey pixels of the rest union become rgb 11,11,11 and no other viewfinder pixel in the scanned band changes.
   9. OBSERVED-EMU. Under the reused T6 configuration the candidate’s AF-ON press sets the ten-byte to `[17,2,3,0,1,0,1,0,0,0]` and the owner byte to 2. `0x88b2` stays 526. The viewfinder differs from its own rest by 0 pixels, and it differs from K2’s AF-ON screen by 0 pixels. K2’s ten-byte is `[14,2,2,0,1,0,1,0,0,0]`, owner 2. Release, S1 alone, and S1 held with AF-ON likewise match K2 pixel for pixel. The displayed frame does not follow the AF-ON target.
   10. OBSERVED-EMU. Version 6, the one EMULATOR-ONLY display change, aborted before the session. The lab had been imported as E143. No edge of the 12-edge list was asserted for that change.

7. **Evidence for each claim:**
   1. `work/out/obs-k1-v2.jsonl` line `v2-rest`. Png `work/out/obs-k1-v2-rest.png`.
   2. Same file, `v2-small-rest`, `v2-small-s1`, `v2-small-up`. Png `work/out/obs-k1-v2-small-rest.png`.
   3. Same lines: `cells`, `target`, `dirty`.
   4. `v2-rest` field `k1e71`, and `work/out/obs-t6-v5.jsonl` lines `v5-candidate-subject` and `v5-k2-subject`.
   5. `work/out/draw-samples-v3.json`. Listing `work/out/disasm-rectb-v1.txt`.
   6. `work/out/disasm-88b2-v1.txt`, `work/out/disasm-kind3-v1.txt`, `work/out/disasm-caller-a-v1.txt`, `work/out/disasm-pos-entry-v1.txt`. Checks `work/out/check-listing-v1.json` and `work/out/check-listing-v2.json`.
   7. Claim 3 together with claim 6. `work/out/disasm-88b2c-v1.txt` for `0x609eff7e`. `work/out/obs-k1-v3.jsonl` line `v3-moved` for the getter callers that did run.
   8. `work/out/scan-diff-v1.json` field `stockVsT6Rest`.
   9. `work/out/obs-t6-v5.jsonl` lines `v5-candidate-afon-down`, `v5-k2-afon-down`, and the matching rest, release, S1 and S1-held lines. `work/out/scan-diff-v1.json` fields `t6RestVsAfon` and `candidateVsK2Afon`.
   10. `work/out/obs-t6-v6.jsonl` line `v6-done`, and `work/out/cmd/15.out`.

8. **Tests and outcomes:**
   - Stock frame present, and it moves with the half-press position: PASS (`obs_k1_v2`, exit 0).
   - S1 does not move the marks: PASS (same run, same union box on Small rest, S1 held and release).
   - Subject Detect Off: PASS on K1 and on both T6 roles.
   - T6 frame follows the AF-ON ten-byte: FAIL as a behaviour. The ten-byte and the owner change; the viewfinder does not. This is the measurement item 3 asked for, and the assertions in `obs_t6_v5` passed.
   - Item 4, one change asserted on all 12 edges, with K1 and K2 left as stock: not run to completion. Version 6 aborted. BOUNDARY was not claimed. No seventh version was started.

9. **New versus previously established:**
   - Claim 1 is new. The shooting-screen frame is drawn on this emulator.
   - Claim 3 confirms the T6 description that `0x88b2` is the live grid position and that the AF-ON builder does not read it. It also records that this session’s direct screen wrote index 0, while T3b described index 1.
   - Claim 6 is new.
   - Claim 9 is new. T6 established the ten-byte and the owner. It did not measure the shooting-screen pixels.
   - Claim 10 is new and is a harness failure, not a firmware result.

10. **Remaining uncertainties.** The OK-window trace did not enter `0x609eec84`, so the pixel movement is tied to `0x88b2` by the values and by the listing, not by a hit at `0x609eed46` during that repaint. The version-6 change was not executed, so it is not known whether calling the positioner from the builder return would paint the Small corners at position 529. `work/out/disasm-pos-tail-v1.txt` was started mid-instruction and is not used.

11. **Recommended next actions.** Run the version-6 change only after `OM_EMU_MODEL=E147` is set before any import of `emu/src/fw/model.mjs`, and assert the 12 edges. That is a new experiment version beyond this brief’s six. No storage choice. No hardware recommendation.

12. **Deviations from the brief.** Item 4 did not complete. Version 6 is the sixth experiment version and it aborted before `open_session`, so the 12-edge frame assertions, the S1-owned half-press check, and the K1/K2 stock check for that change were not produced. The script was not edited after that run and no seventh version was started. No image byte was added. Subject Detect was read back as 0 on every completed shooting-screen snapshot. Nothing here is a storage decision or a hardware recommendation.
