# T9c result

1. **Task identifier and brief version used:** T9c, brief version 2026-11-19. Section 0 of `brief.md` overrides the rest of that brief. The spec sentences restated here are “Show the AF-ON target while AF-ON is in control.” and “Update the displayed AF target to reflect the active profile.”

2. **Research baseline used:** T9b decision and its three coordinator corrections. T9b run `run-20261119-153249` (addendum, c1–c6 listings and logs) and Sol review `run-20261119-163010-review`. T9 reviews `run-20261119-131450-review` and `run-20261119-141920-review`. T9 and T9b briefs, including §0 and §5. T5 `zone_session_k1.mjs` and `exp_edges_k1.mjs`. T6 `accept_v1.mjs` and `out/design.md`. `FEATURE-SPEC.md` lines 21 and 57. Stock image `inputs/00_0100_50000020.decoded.bin`, sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, 33554368 bytes. Resource `inputs/02_0106_458c0020.decoded.bin`, sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. OM-Emu E147. No new image byte was written. Nothing was added in section 6 or 7. No storage decision and no hardware recommendation.

3. **Work performed:** Every command went through `work/scripts/run_logged.mjs`. Six emulator processes, then stop. Commands 01–05 and 07–09 and 11 and 13–26 and 28 are static or summaries. Commands 06, 10, 12, 27, 29 and 30 are the six versions.
   - 01–05, 07–09: static scans and Ghidra listings of the dirty byte, the vtable slot, the divider and the dispatcher.
   - 06: version 1, `obs_causal_v1.mjs`. Getter return 412 with the cell left at 526.
   - 10: version 2, `obs_geom_v2.mjs`. Geometry word and a direct-screen dial.
   - 12: version 3, `obs_geom_v3.mjs`. Return 409, then Small against All.
   - 13–26, 28: listings and summaries.
   - 27: version 4, `obs_valid_v4.mjs`. Seeded T6 plus the display change. Exit 1.
   - 29: version 5, `obs_valid_v5.mjs`. Unseeded K2. Exit 0.
   - 30: version 6, `obs_valid_v6.mjs`. Stock K1. Exit 0.

4. **Files examined:** Stock image at file offset `address − 0x60021020`. Frame function `0x61184dd6`, dispatcher `0x610c8b66`, writer `0x61184e51`, divider immediate at `0x61185152`, mode word at object+`0x374`, glyph table `0x6146f990`, thunk call `0x6041935b`, lookup `0x604050be`. T9b listings under that run's `work/out/disasm-*.txt`. This task's listings under `work/out/disasm-*.txt`.

5. **Files created:** Scripts, listings, logs, screenshots and the records under `work/`. The manifest lists each hash. The records are `work/result.md`, `work/result-addendum-t9c.md`, `work/out/display.md`, `work/out/display-addendum-t9c.md` and `work/evidence-manifest.json`.

6. **Findings:**
   1. OBSERVED-EMU. On stock, with `0x88b2` left at 526, making `0x6041935b` return 412 for `d0=0x88b2` moves the four marks to (356, 198), (402, 198), (356, 248) and (402, 248), each 19×21. Subject 0. Two substitutions. The idle dispatch runs without the cell write.
   2. OBSERVED-EMU. The entry of `0x61184dd6` is `calls (A2)` at `0x610c8b66`, vtable+`0x190`, return `0x610c8b68`, object `0x62c54158`. A 500 ms idle enters it twice before the setter and twice after. The dirty byte stays 1 and is not read. The two `0x610cd5ac` checks return 1 when the writer runs. They gate the writer. They do not schedule the entry.
   3. OBSERVED-EMU. Return 409, cell still 526, stores word 409 at object+`0x364`, point (19, 10), marks (417, 198), (464, 198), (417, 248), (464, 248). At rest the same word is 526 and the writer does not store an origin.
   4. STATIC and OBSERVED-EMU. The word is divided by 39 (`0x61185152`). Mode 2 at object+`0x374` sets size constants 3 and 3. The glyph bytes are 19 and 21 at `0x6146f990`. The pixel formula in `work/out/display.md` reproduces the centre frame, the 409 frame and the 406 frame.
   5. OBSERVED-EMU. Half-press All (kind 2, zone 0, size [1, 1]) removes the 444 grey pixels. Stock Small keeps them. The mode word is still 2 at the next entry, and the origin store does not run.
   6. INFERRED. The four measured words fit one rule: if the return modulo 39 is 22, the word is the return minus 6; otherwise the word is the return. The store instruction was not captured.
   7. OBSERVED-EMU. The display change is that one call site, and only while the owner byte is 2. On the seeded run, AF-ON edges draw (356, 265), (402, 265), (356, 314), (402, 314), each 19×21, rgb 31. The ten-byte is the Small record, the owner follows `[1,0,2,0,1,2,1,0,2,2,2,0]`, the cell stays 526 and subject stays 0. Owner 0 and owner 1 draw no grey marks, and their ten-byte is the All record.
   8. OBSERVED-EMU. K2, hook installed and mirror `0xFF`, substitutes nothing. All 12 edges keep the cleared All frame, the All ten-byte and the owner list. `v5-done` passes.
   9. OBSERVED-EMU. K1, no hook, keeps the centre frame, the stock ten-byte and owner 255 on all 12 edges. `v6-done` passes.

7. **Evidence for each claim:** Claim 1: `work/out/obs-causal-v1.jsonl` row `v1-causal`, screenshot `work/out/obs-causal-v1-causal-after.png`. Claim 2: the same row's `hits`, plus `work/out/disasm-dispatch2-d1.txt` at `0x610c8b66`. Claim 3: `work/out/obs-geom-v3.jsonl` row `v3-word`. Claim 4: `work/out/disasm-divsrc-d5.txt` at `0x61185152`, the T9b listing `ref/tasks/T9b-afon-display-coordinate-path/run-20261119-153249/work/out/disasm-origin-c4.txt` at `0x61185253`, and `work/out/cmd/26.out` for the glyph bytes. The formula check is the start of `work/scripts/obs_valid_v4.mjs`. Claim 5: `work/out/obs-geom-v3.jsonl` row `v3-zone`. Claim 6: claims 1 and 3 together with version 4's AF-ON marks. Claim 7: `work/out/obs-valid-v4.jsonl` rows `v4-e0` through `v4-e11`. Claim 8: `work/out/obs-valid-v5.jsonl` row `v5-done`. Claim 9: `work/out/obs-valid-v6.jsonl` row `v6-done`.

8. **Tests and outcomes:**
   - Version 1 causal trial: PASS. Cell stayed 526 and the marks moved to the 412 frame.
   - Version 2: BOUNDARY. The marks moved after the cell write, and the watch on object+`0x364` saw no store. The direct-screen dial changed the position cell on the first detent, so it did not isolate zone.
   - Version 3: PASS for the two questions it asked. Return 409 moved the marks with the cell at 526. All removed the grey pixels.
   - Version 4: FAIL against its pre-registered rectangles. Owner, ten-byte, subject and cell matched on every edge. The half-press edges have no grey marks, and the AF-ON edges match word 523 rather than the uncorrected word 529 that the script expected. `v4-done` is pass false. Exit 1.
   - Version 5: PASS. Exit 0.
   - Version 6: PASS. Exit 0.

9. **New versus previously established:**
   - Claim 1 is new. T9b had not shown the getter return moving the marks while the cell stayed 526.
   - Claim 2 resolves the indirect entry and the refresh, which the T9b decision left open.
   - Claims 3, 4 and 6 are new. They replace the open statement that 406 is neither 412 nor the AF-ON position with the measured rule.
   - Claim 5 confirms the T9 observation that All changes the grey pixels, and names the inputs that did not change.
   - Claim 7 is the display change. The rectangles are new measurements. The run's own expected values do not match them.
   - Claims 8 and 9 confirm that K2 and K1 stay on their stock frames.

10. **Remaining uncertainties.** The instruction that writes object+`0x364` was not captured; the watch saw no store while the word changed. The writers of the scale slots 20 and 22 were not named. The minus-6 rule is the fit of four measured returns, not a located subtract instruction. Version 4 therefore did not end as a passing assertion of the rectangles that were later read off its screenshots.

11. **Recommended next actions.** Name the store of object+`0x364` with a watch armed before the first translation of that instruction, and re-state version 4's expected rectangles as the cleared All frame for owner 0 and owner 1 and as `marksFor(523)` for owner 2. No further emulator version was run here: six had already been used.

12. **Deviations from the brief.** Version 4's final flag is not a pass. The script expected the centre box on the half-press edges and the uncorrected 529 box on the AF-ON edges. The screenshots show the cleared All frame and the 523 frame. Versions 5 and 6 ended pass true. No other deviation.
