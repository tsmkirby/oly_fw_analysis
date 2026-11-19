# T9 result

1. **Task identifier and brief version used:** T9, brief version 2026-11-19, including the correction in §5 after Sol’s review `run-20261119-131450-review`. Spec wording from `ref/analysis/button-af/FEATURE-SPEC.md`, 10 November 2026 revision, item 4 line 21: “Show the AF-ON target while AF-ON is in control.” Line 57: “Update the displayed AF target to reflect the active profile.”

2. **Research baseline used:** T6 README, `out/design.md`, `scripts/exp_q1_t6.mjs` and `out/overlay-changed-bytes.csv`. T5 `out/design.md`, `out/target-bytes.md`, `out/overlay-changed-bytes-c1.csv` and `scripts/zone_session_k1.mjs`. T3j, T5 and T6 briefs, §0 and §5. Stock image `inputs/00_0100_50000020.decoded.bin`, sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, 33554368 bytes. Resource `inputs/02_0106_458c0020.decoded.bin`, sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. OM-Emu E147. No new image byte was written. Nothing was added in section 6 or 7.

3. **Work performed:** Every command went through `work/scripts/run_logged.mjs`. The first six experiment versions are the previous run. This correction used five of its six new versions and then stopped.
   - 01–18 are the previous run: stock K1 versions 1–3, the seeded T6 version 5, the aborted version 6, the listings, and the first manifest. Version 6 aborted before `open_session` because the lab was imported as E143.
   - 19 `scan_calls_c1.mjs`. Exit 0. Callers, and the return at `0x609eece0`.
   - 20 Ghidra on the boundary, both callers, the getter thunk and two rectangle sites. Exit 0.
   - 21 `obs_path_v7.mjs`. Experiment version 7. Exit 0. Model E147 asserted before any key.
   - 22 `check_calls_c1.mjs`. Exit 0. 0 mismatches.
   - 23 `scan_calls_c2.mjs`. Exit 0.
   - 24 `sum_path_v7.mjs`. Exit 0.
   - 25 `scan_widget_c1.mjs`. Exit 0. The guessed stack word `0x6135cec4` is the string “[GUI App  ]:sta”.
   - 26 `scan_widget_c2.mjs`. Exit 0. One pointer to `0x610f6649`, at `0x610f62a1`.
   - 27 Ghidra on the update function and the rectangle body. Exit 0.
   - 28 Ghidra on the method-pointer stores. Exit 0.
   - 29 `obs_path_v8.mjs`. Experiment version 8. Exit 0. Model E147 asserted before any key.
   - 30 extract of the version-8 caller, samples and rectangles. Exit 0.
   - 31 Ghidra from `0x610eed00`, 120 instructions. Exit 0. It ends at `0x610eedf1`, short of the call.
   - 32 Ghidra from `0x610eecea`, 40 instructions. Exit 0. That window is the method loop and does not contain `0x610eee13`.
   - 33 `obs_cell_v9.mjs`. Experiment version 9. Exit 0. One test-setup write of `0x88b2`.
   - 34 extract of the version-9 unions. Exit 0.
   - 35 Ghidra from `0x610eedee`, 24 instructions. Exit 0. This window contains `calls (A2)` at `0x610eee11`.
   - 36 `obs_cell_v10.mjs`. Experiment version 10. Exit 0. The same write, with the getter and `0x609eece3` observed.
   - 37 `obs_k2_v11.mjs`. Experiment version 11. Exit 0. Unseeded T6 control.
   - 38 extract of the version-11 edges. Exit 0.
   - 39 `check_calls_c2.mjs`. Exit 0. 0 mismatches on the six later listings.
   - 40 writes `work/evidence-manifest.json` and `work/out/manifest-supplement-t9c.json`.
   - 41 writes `work/out/manifest-seal-t9c.json` and hashes command 40’s four wrapper files, the manifest and the supplement.
   - 42 is the external finalizer. It hashes command 41’s four wrapper files and the seal. The wrapper writes command 42’s `.out`, `.err` and `.exit` after that process returns. The `.exit` file contains a timestamp, so command 42 cannot hash those three files.

4. **Files examined:** Stock image at file offset `address - 0x60021020`. Return `0x609eece0`. Function `0x609eece3` through the getter call at `0x609eed3f` and the scale at `0x609eed75`. Thunk `0x607118c9`. Caller `0x60907d9c`. Getter thunk `0x6041a1f9` returning at `0x6041a202`. Widget `0x610f6649`, call at `0x610f66da`, return `0x610f66df`, body `0x610f74e6`. Method store `0x610f62a5`. Caller `0x610eee11` (`calls (A2)`, return `0x610eee13`). Update function `0x610f70c5`, return `0x610f70da`. Getter `0x60063380`. Setter `0x60063431`. Consumer `0xa33ca384`. Owner `0xa031ed00+4`. Mirror `0xa031eeb0`. Cells `0x88b2`, `0x5962`, `0x84d1`, `0x1e71`. Listings under `work/out/disasm-*.txt`.

5. **Files created:** Under `work/` only. The correction adds the scripts named above, the version 7–11 JSONL, PNG and NVRAM files, the new listings, `work/out/display.md`, this `work/result.md`, `work/evidence-manifest.json`, `work/out/manifest-supplement-t9c.json`, `work/out/manifest-seal-t9c.json` and `work/out/manifest-final-t9c.json`. The manifest lists the files present when command 40 runs. Command 41 and command 42 add the seal and the finalizer record after that.

6. **Findings:**
   1. OBSERVED-EMU. Stock K1 on the TFT shooting screen draws four grey corner marks. At rest they occupy (417, 265), (464, 265), (417, 314) and (464, 314), union (417, 265) 66×70. Png `f29e503e88ac6c42974ab698b750d348a2b2e5cd50ed3d1cc5bc46f2cf9bfd69`.
   2. OBSERVED-EMU. Holding S1 and releasing it do not move those marks. After the direct screen sets Small and moves the target, the marks are at (356, 198), (402, 198), (356, 248) and (402, 248), union (356, 198) 65×71. S1 still does not move them.
   3. OBSERVED-EMU. That direct-screen move writes `0x88b2` and `0x5962[0]`, 526 then 409 then 412. `0x5962[1]` stays 526. The dial writes zone index 0. The ten-byte record stays `[14,2,2,0,27,0,39,0,0,0]` and the dirty byte `0xa33f2cea` stays 1.
   4. OBSERVED-EMU. `0x1e71[0]` reads back 0. The Subject Detection row’s highlight is “Subject Detection” and its texts include “Off”. The correction sessions assert the same key before the shooting-screen shots. Version 7 and version 11 record the Off text. Version 9 records the key as 0.
   5. OBSERVED-EMU. The OK repaint enters `GPI_DRAW_RECT` with return `0x610f66df` and draws the four colour-22 bars listed in `display.md`. The same return also draws the colour-34 viewfinder border.
   6. STATIC. `0x609eec84` ends at `0x609eece0` (`df 30 10`, `ret [a2,a3],0x10`). The `0x88b2` getter call at `0x609eed3f` and the kind read through `0x609f0631` belong to the function that starts at `0x609eece3`. Its size-filtered callers are `0x607118ed` and `0x60907dad`. `0x6041a202` is the return address of the getter thunk at `0x6041a1f9`. The checked listings match the image with 0 mismatches.
   7. OBSERVED-EMU. `0x609eece3` is entered zero times on the direct-screen move, the OK repaint, the AF-ON press and the `0x88b2` setter. The previous inference that those reads supply the corner coordinates is withdrawn.
   8. OBSERVED-EMU. Inside x 280–780, y 60–520, `obs-k1-v2-rest.png` and `obs-t6-v5-candidate-rest.png` differ at 444 pixels, all inside (417, 265) 66×70. The stock samples are rgb 31,31,31 and the other samples are rgb 11,11,11. The two sessions also differ in overlay, hook, mirror seed and half-press setup. No trial changed `0x84d1` alone.
   9. OBSERVED-EMU. Under the seeded T6 configuration an AF-ON press sets the ten-byte to `[17,2,3,0,1,0,1,0,0,0]` and the owner byte to 2. `0x88b2` stays 526. The viewfinder differs from its own rest by 0 pixels. The comparison run in version 5 used the Z5 overlay and did not install the T6 hook. That run is Z5 without the T6 hook. Its AF-ON png matches the seeded screen.
   10. OBSERVED-EMU. Version 6 aborted before the session opened. The lab had been imported as E143. The proposed call targeted `0x609eec84`, which returns before the reads. No edge was asserted. The change was not run again.
   11. OBSERVED-EMU. On the OK repaint the only caller of widget `0x610f6649` is `0x610eee13`. That return is `calls (A2)` at `0x610eee11`. The moved frame enters the widget with `d0` = 356 and `d1` = 198. `0x610f62a5` stores `0x610f6649` at `(0x3c,sp)`.
   12. OBSERVED-EMU. One EMULATOR-ONLY test-setup write of `0x88b2` index 0 to 412, with `0x5962` left at [526, 526], moves the marks from (417, 265) 66×70 to (356, 198) 65×71. During that call the getter is not entered for `0x88b2`, `0x5962` or `0x84d1`, and `0x609eece3` is not entered. The following idle issues no colour-22 frame rectangle.
   13. OBSERVED-EMU. Leaving the direct screen is what issues the colour-22 bars. `gpiUpdateDisplay` in that window returns at `0x610f70da`, inside the function at `0x610f70c5` that tests `0x6036faad` and toggles `0x6036faac`. An AF-ON press issues no colour-22 corner bar and leaves the union on the OK box. CPU watchpoints on the corner bytes record 0 writes. The OSD engine paints them.
   14. OBSERVED-EMU. The unseeded T6 control, version 11, installs the T6 overlay and the inherited T6 profile-read hook and writes no mirror seed. The mirror head is `ff ff ff ff ff ff ff ff`. On rest, AF-ON press, AF-ON release, S1, S1 held with AF-ON, and the final release, the union stays (417, 265) 66×70, there are four marks, `0x88b2` stays 526 and `0x1e71[0]` stays 0. Owner is 2 on both AF-ON presses and 0 after release. The hook’s zone, size and position counts rise. AF-ON press publishes ten-byte `[14,2,2,0,1,0,1,0,0,0]`. The four-mark union stays on the stock box while that ten-byte changes.
   15. INFERRED. The cell that drives the painted frame is `0x88b2`. The paint call is `0x610eee11`. The instruction that reads `0x88b2` into the coordinates of that call was not observed, so item 4 is not identified and was not attempted.

7. **Evidence for each claim:**
   1. `work/out/obs-k1-v2.jsonl` line `v2-rest`. Png `work/out/obs-k1-v2-rest.png`.
   2. Same file, `v2-small-rest`, `v2-small-s1`, `v2-small-up`.
   3. Same lines: `cells`, `target`, `dirty`.
   4. `v2-rest` field `k1e71`. `work/out/obs-path-v7.jsonl` line `v7-subject`. `work/out/obs-k2-v11.jsonl` line `v11-subject`. `work/out/obs-cell-v9.jsonl` line `v9-subject`.
   5. `work/out/cmd/30.out` field `rects`. Listing `work/out/disasm-rectb-v1.txt`.
   6. `work/out/disasm-boundary-c1.txt`, `work/out/disasm-getter-c1.txt`, `work/out/disasm-poscall-a-c1.txt`, `work/out/disasm-poscall-b-c1.txt`. `work/out/check-calls-c1.json`. `work/out/check-calls-c2.json` field `retAt609eece0`.
   7. `work/out/obs-path-v7.jsonl` lines `v7-direct` and `v7-ok` (`posCount` empty). `work/out/obs-cell-v10.jsonl` line `v10-write` (`posEntries` empty).
   8. `work/out/scan-diff-v1.json` field `stockVsT6Rest`. The two files are named in `work/scripts/scan_diff_v1.mjs`.
   9. `work/out/obs-t6-v5.jsonl` lines `v5-candidate-afon-down` and `v5-k2-afon-down`. `work/out/scan-diff-v1.json` fields `t6RestVsAfon` and `candidateVsK2Afon`. The version-5 script selects `overlay-changed-bytes-c1.csv` for the role it called K2.
   10. `work/out/obs-t6-v6.jsonl` line `v6-done`. `work/out/cmd/15.out`. Claim 6 for the return.
   11. `work/out/cmd/30.out` fields `callers` and `samples`. `work/out/disasm-callsite-c1.txt`. `work/out/disasm-widgetptr-c1.txt` at `0x610f629f`. `work/out/check-calls-c2.json` field `callsA2At610eee11`.
   12. `work/out/obs-cell-v9.jsonl` line `v9-marks`. `work/out/obs-cell-v10.jsonl` line `v10-write`.
   13. `work/out/obs-path-v7.jsonl` lines `v7-idle`, `v7-ok` and `v7-afon`. `work/out/disasm-update-c1.txt` at `0x610f70c5`. `work/out/cmd/30.out` field `afon`.
   14. `work/out/obs-k2-v11.jsonl` lines `v11-mirror`, `v11-subject`, `v11-rest`, `v11-afon-down`, `v11-afon-up`, `v11-s1-down`, `v11-s1-afon` and `v11-s1-up`.
   15. Claims 11, 12 and 13 together. `work/out/display.md`.

8. **Tests and outcomes:**
   - Stock frame present, and it moves when the direct screen changes the half-press position: PASS (`obs_k1_v2`, exit 0).
   - S1 does not move the marks: PASS.
   - Subject Detect Off: PASS on the completed shooting-screen sessions, including version 7 and the unseeded control.
   - Writing `0x88b2` alone moves the marks, and `0x5962` stays 526: PASS (`obs_cell_v9`, exit 0). The pass bit on that row is the cell readback. The movement is the recorded union.
   - The getter and `0x609eece3` run during that write: the recorded lists are empty. That is the measurement (`obs_cell_v10`, exit 0).
   - Unseeded T6 frame union equals the stock rest union on every recorded edge: PASS (`obs_k2_v11`, exit 0). The ten-byte and the full png are recorded and do change on AF-ON press.
   - Seeded T6 frame follows the AF-ON ten-byte: the pixels do not change. Measured in version 5.
   - Item 4, one display change asserted on all 12 edges: not attempted. BOUNDARY. The coordinate read was not identified, and no hook was guessed.
   - Version 6: FAIL as a session. It aborted before `open_session`.

9. **New versus previously established:**
   - Claims 1–5 confirm the previous T9 result.
   - Claim 6 corrects the previous claim 6. The reads are real. They are in `0x609eece3`, after the return at `0x609eece0`.
   - Claim 7 withdraws the previous claim 7.
   - Claim 8 narrows the previous claim 8 to the cross-session pixel difference.
   - Claim 9 confirms the previous seeded-T6 pixel result and relabels that run’s K2 as Z5 without the T6 hook.
   - Claim 10 confirms the previous version-6 abort and adds the function-boundary reason.
   - Claims 11–15 are new.

10. **Remaining uncertainties.** The setter of `0x88b2` moves the pixels, and it does so without entering the getter or `0x609eece3`. The callee that writes the box consumed by `0x610eee11` was not captured. Full-screen png hashes of a rest frame are not stable across sessions when the union is stable: version 2 rest is `f29e503e88ac6c42974ab698b750d348a2b2e5cd50ed3d1cc5bc46f2cf9bfd69` and the version 7 rest is `bf4c0924a4adccaca1727a314e576e9f12956e21da825d246fa5d41f53de3e75`. The unseeded control’s AF-ON press changes the ten-byte and the full png while the four-mark union stays put. Version 8 records three widget entries during AF-ON; they are not the colour-22 corner bars. Experiment version 12 was not used.

11. **Recommended next actions.** One further observation, in a new task: record the callees of setter `0x60063431` while it writes `0x88b2`, until the store that fills the coordinates reloaded at `0x610eedee`. Only after that store is known should a hook make that read return the AF-ON target while AF-ON owns it, and force the redraw on press and release. No storage choice. No hardware recommendation.

12. **Deviations from the brief.** Item 4 was not performed. The correction had six new experiment versions. Versions 7 through 11 ran. Version 12 was not started, because the remaining version would have been a guess at the unread coordinate source. The cell is identified as `0x88b2`. The instruction that reads it for the paint is not. No image byte was added. Subject Detect was read back as 0 on every completed shooting-screen snapshot in this correction. Nothing here is a storage decision or a hardware recommendation. Command 42 cannot hash its own `.out`, `.err` and `.exit`.
