# T9c result

1. **Task identifier and brief version used:** T9c, brief version 2026-11-19, including section 5, the correction round after Sol's rejection. Section 0 overrides the rest of the brief. The spec sentences restated here are “Show the AF-ON target while AF-ON is in control.” and “Update the displayed AF target to reflect the active profile.”

2. **Research baseline used:** T9b decision and its three coordinator corrections. T9b run `run-20261119-153249`. Sol reviews `run-20261119-163010-review` and `run-20261119-174959-review` (`audit/previous-review.md`). T9 reviews `run-20261119-131450-review` and `run-20261119-141920-review`. T6 `out/design.md`, `out/target-fields.md`, and `scripts/accept_v1.mjs`. Stock image `inputs/00_0100_50000020.decoded.bin`, sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, 33554368 bytes. Resource `inputs/02_0106_458c0020.decoded.bin`, sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. OM-Emu E147. No new image byte was written. Nothing was added in section 6 or 7. No storage decision and no hardware recommendation.

3. **Work performed:** Commands went through `work/scripts/run_logged.mjs`. The first six emulator processes are unchanged: versions 1–6 in commands 06, 10, 12, 27, 29 and 30. Version 4's failed evidence was not edited. This round added six emulator processes and stopped. Commands 32, 33 and 38 are Ghidra listings. Commands 34, 35, 36, 37, 39 and 40 are the six new versions.
   - 34: K1e profile A, stock, setter writes labelled test setup. Exit 0.
   - 35: K1e profile B, stock, S1 pressed as soon as the setter returned. Exit 0.
   - 36: full K2, T6 overlay, T6 reader, the same display hook, unseeded. Exit 0.
   - 37: seeded profile A. Exit 0. `ok:true`.
   - 39: seeded profile B. Exit 1. Every edge assertion passed. The kind count was 0, so the session is `ok:false`.
   - 40: stock K1. Exit 0. `ok:true`.

4. **Files examined:** Stock image at file offset `address − 0x60021020`. Getter function `0x60419315`, call `0x6041935b`, id-to-key map `0x60419446`, dispatcher `0x610c8b66`, stacked return `0x610cdc4f`, converter kind immediates `0x609b3ee8`, `0x609b3eef` and `0x609b3f13`. Version-4 logs and screenshots. T6 mirror layout.

5. **Files created:** The new runners, listings, logs, screenshots and reference json files are under `work/`. The records are `work/result.md`, `work/result-addendum-t9c.md`, `work/result-addendum-sol-r1.md`, `work/out/display.md`, `work/out/display-addendum-t9c.md`, `work/out/display-addendum-sol-r1.md`, `work/evidence-manifest.json` and `work/out/seal-r1.json`. `work/out/seal-t9c.json` is the previous round's seal and was not rewritten.

6. **Findings:**
   1. OBSERVED-EMU. On stock, with `0x88b2` left at 526, making `0x6041935b` return 412 for `d0=0x88b2` moves the four marks to (356, 198), (402, 198), (356, 248) and (402, 248), each 19×21. The divider input read on that pass is 406. The cell stays 526.
   2. OBSERVED-EMU. The entry of `0x61184dd6` is `calls (A2)` at `0x610c8b66`, vtable+`0x190`, return `0x610c8b68`. The next stacked return is `0x610cdc4f`. A 500 ms idle enters the function twice. The dirty byte stays 1 and is not read. The two `0x610cd5ac` checks return 1 when the writer runs. They gate the writer. The producer that schedules the dispatch is not named.
   3. OBSERVED-EMU. Return 409, cell still 526, is accompanied by a directly read word 409 at object+`0x364` and point (19, 10). At rest the same word reads 526.
   4. STATIC and OBSERVED-EMU. The sampled word is divided by 39 at `0x61185152`. Mode 2 stores size constants 3 and 3. The glyph bytes are 19 and 21 at `0x6146f990`. These operations describe the three sampled frames. They are not a general getter-to-word rule.
   5. OBSERVED-EMU. Half-press All, written together with kind 2 and size `[1, 1]`, removes the 444 grey pixels. The separate contributions of kind, zone and size were not isolated.
   6. HYPOTHESIS. If the return modulo 39 is 22, a fitted sentence says the word is the return minus 6. It fits the directly read pair 412 and 406. The figure 523 was inferred from version 4's screenshot and was not read. The sentence was not used to choose an expected frame.
   7. OBSERVED-EMU. K1e profile A, after the stock setter wrote position 529, zone 2 and size `[3, 3]`, draws (356, 265), (402, 265), (356, 314) and (402, 314), each 19×21, 444 rgb-31 pixels. The png was hashed before either candidate. The geometry word was not read.
   8. OBSERVED-EMU. K1e profile B, after the stock setter wrote position 540, zone 6, kind 7 and size `[5, 7, 5, 7]`, draws no grey mark and no rgb-31 pixel in the band. S1, pressed as soon as the setter returned, reached that frame in 66.73128 ms. The png was hashed before the candidate.
   9. OBSERVED-EMU. Full K2 substitutes nothing. All 12 edges keep the empty band, the All ten-byte and the owner list. `ok:true`.
   10. OBSERVED-EMU. Seeded A matches the profile A frame on owner 2 and the K2 frame on owner 0 and 1, with the Small ten-byte on owner 2, the All ten-byte otherwise, cell 526 and subject 0. Position substitutions 19, zone 19, size 0, kind 0. The key `0x1dd1` was seen and the mirror bytes were 0, so those calls passed through. Every frame change was inside 666.73128 ms. `ok:true`.
   11. OBSERVED-EMU. Seeded B matches the empty profile B frame on owner 2 and the K2 frame on owner 0 and 1. The owner-2 ten-byte is `[28, 2, 7, 0, 5, 0, 7, 0, 0, 0]`. Cell 526, subject 0. Size substitutions 18, on `0x1dd1` indices 0 and 1. Kind substitutions 0. The call was not entered with `d0=0x84d1` while the owner was 2. The twelve edge rows pass. The session is `ok:false`.
   12. OBSERVED-EMU. Stock K1 keeps the centre frame, the stock ten-byte and owner 255. `ok:true`.
   13. STATIC. Version 5 of the first six uses the Z5 csv and a display hook without the size branch, the kind branch, or the current-bank read. It is not full K2.

7. **Evidence for each claim:** Claim 1: `work/out/obs-causal-v1.jsonl` row `v1-causal`, and row `v1-trigger` field `postXs` word 406. Claim 2: the same rows' `hits`, plus `work/out/disasm-dispatch2-d1.txt` at `0x610c8b66`. Claim 3: `work/out/obs-geom-v3.jsonl` row `v3-word`, field `afterProbe.xs` word 409 and `before` word 526. Claim 4: `work/out/disasm-divsrc-d5.txt` at `0x61185152` and the glyph bytes in `work/out/cmd/26.out`. Claim 5: `work/out/obs-geom-v3.jsonl` row `v3-zone`. Claim 6: the three directly read words, and version 4's marks, which were not a memory read of 523. Claim 7: `work/out/ref-k1e-a.json`. Claim 8: `work/out/ref-k1e-b.json`. Claim 9: `work/out/obs-k2-r1.jsonl` row `k2-done` and `work/out/ref-k2.json`. Claim 10: `work/out/obs-seed-a.jsonl` rows `seed-a-e0` through `seed-a-done`, and `work/out/session-seed-a.jsonl` step `done`. Claim 11: `work/out/obs-seed-b.jsonl` rows `seed-b-e0` through `seed-b-done`, and `work/out/session-seed-b.jsonl` step `done`. Claim 12: `work/out/obs-k1-r1.jsonl` row `k1-done` and `work/out/session-k1-r1.jsonl`. Claim 13: `work/scripts/obs_valid_v5.mjs` overlay path and hook body.

8. **Tests and outcomes:**
   - Versions 1 and 3 of the first six: PASS, as previously recorded. Version 2 remains BOUNDARY. Version 4 remains FAIL. Its files were not changed.
   - Version 5 of the first six: PASS against the assertions that script made. It is the Z5 control, not full K2.
   - Version 6 of the first six: PASS.
   - K1e A and K1e B: PASS as reference runs. Exit 0.
   - Full K2: PASS. Exit 0. `ok:true`.
   - Seeded A: PASS. Exit 0. `ok:true`.
   - Seeded B: FAIL. The twelve edge comparisons passed. The kind substitution count is 0, and the session is `ok:false`. Exit 1.
   - Stock K1: PASS. Exit 0. `ok:true`.

9. **New versus previously established:**
   - Claims 1, 3, 4 and 5 confirm the first submission's measured pixels and the three directly read words.
   - Claim 2 confirms the indirect entry and withdraws the claim that the refresh condition was resolved.
   - Claim 6 labels the minus-6 sentence as a hypothesis. It contradicts the first submission where that sentence was treated as the measured rule.
   - Claims 7 and 8 are new reference frames. They replace formula-derived expectations.
   - Claim 9 is the full K2 the first submission did not run.
   - Claim 10 is a passing seeded run for profile A.
   - Claim 11 confirms the C1 ten-byte and the size substitutions, and records the kind miss.
   - Claim 12 confirms stock K1.
   - Claim 13 corrects the first submission's name for version 5.

10. **Remaining uncertainties.** The producer that schedules `0x610c8b66` is not named. The instruction that writes object+`0x364` was not captured. The general getter-to-word relation is open. The kind key `0x84d1` is not presented at `0x6041935b` while the owner is 2, on All, on Small, or on zone 6, so that branch cannot substitute. Profile B's reference frame has no grey marks, so the position 540 is not visible as a moved rectangle. The geometry word was not read on the correction-round runs.

11. **Recommended next actions.** Find the caller that would present `0x84d1` at `0x6041935b`, or record that the display never asks this call site for that key. A further profile whose stock frame still has marks would show whether a non-zero size substitution moves those marks. No seventh new emulator process was started.

12. **Deviations from the brief.** The first submission's version 4 does not end as a pass, and its version 5 is not full K2. Those points are restated in `work/result-addendum-sol-r1.md`. In this round the seeded B session does not end `ok:true`, because the kind branch substituted 0 times after every edge comparison had passed. The refresh producer was not named. The latency criterion was used instead, and the measured changes met it. The minus-6 hypothesis was not used to derive a frame.
