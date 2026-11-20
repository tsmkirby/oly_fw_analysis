# T9d result

1. **Task identifier and brief version used:** T9d, brief version 2026-11-19. Section 0 overrides the rest of the brief. The spec sentences restated here are “Show the AF-ON target while AF-ON is in control.” and “Update the displayed AF target to reflect the active profile.”

2. **Research baseline used:** T9c decision `CLOSED-PARTIAL`, Sol reviews `run-20261119-174959-review` and `run-20261119-184652-review`, and T9c run `run-20261119-175921`. T8c saved-index mapping: landscape reads bank 0. The T6 reader’s change index is unchanged. Stock image `inputs/00_0100_50000020.decoded.bin`, sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, 33554368 bytes. Resource `inputs/02_0106_458c0020.decoded.bin`, sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. OM-Emu E147, `OM_EMU_MODEL` set before `model.mjs` on every session. The T6 overlay has 3262 rows. From the image section table at `0x60029b28`: section 1 has 1308, section 2 has 95, section 4 has 1856, section 7 has the three inherited bytes `0x610bf5e3`, `0x610bf5e4` and `0x610bf5e5`. Section 6 has none. No new image byte was written. No storage decision and no hardware recommendation.

3. **Work performed:** Commands went through `work/scripts/run_logged.mjs`, wrapper sha256 `34e42c59c553a1e4213e2b223034bd31142c7000c6aef4aac2ac9d5e7f1fe0ef`. Five emulator processes ran. The sixth was not started. Each of commands 01 through 11 exited 0.
   - 01: static scan of the writer. No emulator.
   - 02, 04, 05: Ghidra listings of the entry, the mode pointer, the size switch, the getter thunk, and `0x6041a1f9`.
   - 03: version 1, the stock K1e size sweep. Exit 0. `ok:true`.
   - 06: rehash of the Small and Single pngs, before any candidate. Bound 599.60794 ms.
   - 07: version 2, full K2, this display hook, unseeded. Exit 0. `ok:true`.
   - 08: version 3, seeded profile A. Exit 0. `ok:true`.
   - 09: version 4, seeded profile B. Exit 0. `ok:true`.
   - 10: version 5, stock K1. Exit 0. `ok:true`.
   - 11: listing check and section classification. 474 instructions, zero mismatches.
   - 12: recomputed both input hashes. They match the values in section 2. The manifest is the following wrapper command. The seal is written after that wrapper exits, and it is not a wrapper command.

4. **Files examined:** Stock image at file offset `address − 0x60021020`. Frame entry `0x61184dd6`, writer call `0x61184e30`, writer `0x61184e51`, mode pointer `0x61184f0b`, jump table `0x61470350`, size switch `0x6118522e`, getter thunk `0x6041935b`, shared getter `0x6041a1f9`, call `0x6041a1fb`. T9c display hook and the T6 reader. T6 mirror layout in `out/design.md` and `out/target-fields.md`.

5. **Files created:** Runners, listings, logs, screenshots and reference json are under `work/`. The records are `work/result.md`, `work/out/display.md`, `work/evidence-manifest.json` and `work/out/seal-t9d.json`. The display note marks the superseded T9c sentences.

6. **Findings:**
   1. OBSERVED-EMU. At position 529 the stock dial draws visible marks for Single, Small, Cross, Mid, Large, C1, C2, C3, C4 and one custom size. All, zone 0, mode 1, draws none. Every counted grey pixel is rgb 31. Small is four 19×21 marks, 444 pixels, mode 2. Single is four 8×9 marks, 168 pixels, mode 3. The pngs were hashed before either candidate. Object+`0x364` read 523 on every trial. Object+`0x374` at the writer matched the zone’s mode.
   2. OBSERVED-EMU. From entry of `0x61184dd6` through the writer, every settings-getter return landed at `0x6041a202`. The call is `0x6041a1fb`. The keys are `0x6721`, `0x8551`, `0x5681` (return 2 on every zone), `0x3081`, `0xc321`, and `0x1dd1` indices 0 and 1. Key `0x84d1` is absent. Modes 7–10 read `0x1dd1` three times per index; the earlier modes read it once.
   3. STATIC. `(0x5c,sp)` is formed at `0x61184f0b` as object+`0x34c+0x28`, which is object+`0x374`. The size switch reads that word. Mode 2 stores 3 and 3, mode 3 stores 1 and 1, mode 5 stores 9 and 7, mode 6 stores 15 and 11, and modes 7–10 call through `0x60b8696a` with `D0=0x67a` and `D0=0x679`. Those two values arrive at the getter as key `0x1dd1`. The store that writes the mode word was not captured. At function entry the word can still hold the previous mode.
   4. STATIC and OBSERVED-EMU. Cross and Single both returned 1 and 1 from `0x1dd1` and drew different mark sizes, so modes 2 and 3 take their glyph size from the immediates. Custom mode 7, returning 9 and 11, drew a different frame from C1’s 5 and 7. The size input the writer asks for is `0x1dd1` at `0x6041a1fb`. The zone return at `0x6041935b` is the input that selects the mode, carried from the T9c causal result and matched here by the zone-to-mode table.
   5. EMULATOR-ONLY. The display hook, while the owner is 2, returns the saved-bank mirror position and zone from `0x6041935b`, and the mirror size byte from `0x6041a1fb` for `0x1dd1` index 0 through 9. The kind branch is not installed. `0xFF` and `0xFFFF` pass through. The saved bank is the T8c index. Landscape reads bank 0. The T6 reader still reads change-index bank 1, and the seed writes both banks. The reader was not changed.
   6. OBSERVED-EMU. Full K2 substitutes 0 times on every branch. Twelve edges, empty band, All ten-byte, owners `[1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0]`, cell 526, subject 0. No edge’s reference frame changes, and the frame stayed unchanged through 599.60794 ms on each. `ok:true`.
   7. OBSERVED-EMU. Seeded A matches the Small K1e frame and the Small ten-byte on owner 2, and the K2 frame and the All ten-byte on owner 0 and 1. Cell 526, subject 0. Counts: position 16, zone 16, size 6. `ok:true`.
   8. OBSERVED-EMU. Seeded B matches the Single K1e frame and the Single ten-byte on owner 2, and the K2 frame and the All ten-byte otherwise. The marks are 8×9. Counts: position 16, zone 16, size 6. `ok:true`.
   9. OBSERVED-EMU. Stock K1 keeps the centre 19×21 marks, the stock ten-byte, owner 255, cell 526 and subject 0 on all twelve edges. The reference frame does not change, and the frame stayed unchanged through the window. `ok:true`.
   10. OBSERVED-EMU. Refresh, seeded A and seeded B, same times. Bound 599.60794 ms. Edges 0, 1, 4 and 7 do not change: latency null, frame unchanged. Edges 9 and 10 stay on the owner-2 frame: latency null, frame unchanged. Changing edges, first-change milliseconds: edge 2 is 66.73128, edge 3 is 33.36564, edge 5 is 116.77974, edge 6 is 150.14538, edge 8 is 183.51102, edge 11 is 16.68282. Each is inside the bound.

7. **Evidence for each claim:** Claim 1: `work/out/sweep-summary.json` and `work/out/ref-k1e-a.json`, `work/out/ref-k1e-b.json`. Claim 2: `work/out/sweep-calls.json`. Claim 3: `work/out/disasm-modeptr-t9d.txt` at `0x61184f0b`, `work/out/disasm-size-t9d.txt` from `0x6118522e`, `work/out/scan-size-t9d.json` checks, and `work/out/check-records-t9d.json` field `mismatches` 0. Claim 4: the same sweep files, plus `work/out/disasm-thunk-t9d.txt` at `0x6041935b` and `work/out/disasm-getfn-t9d.txt` at `0x6041a1fb`. Claim 5: `work/scripts/lib_valid_t9d.mjs` functions `installDisplay` and `savedBank`. Claim 6: `work/out/obs-k2-t9d.jsonl` rows `k2-e0` through `k2-done`, and `work/out/session-k2-t9d.jsonl` step `done`. Claim 7: `work/out/obs-seed-a.jsonl` and `work/out/session-seed-a.jsonl`. Claim 8: `work/out/obs-seed-b.jsonl` and `work/out/session-seed-b.jsonl`. Claim 9: `work/out/obs-k1-t9d.jsonl` and `work/out/session-k1-t9d.jsonl`. Claim 10: `work/out/check-records-t9d.json` field `edges`, and `work/out/ref-k1e-a.json` field `boundMs`. The section counts are in the same check file.

8. **Tests and outcomes:**
   - Version 1, stock sweep: PASS. Exit 0.
   - Version 2, full K2: PASS. Exit 0. `ok:true`. Substitutions 0.
   - Version 3, seeded A: PASS. Exit 0. `ok:true`. Position 16, zone 16, size 6.
   - Version 4, seeded B: PASS. Exit 0. `ok:true`. Position 16, zone 16, size 6.
   - Version 5, stock K1: PASS. Exit 0. `ok:true`.
   - Listing check: PASS. 474 instructions, zero mismatches. Overlay section check: PASS. The only section 6 or 7 bytes are the three inherited bytes.

9. **New versus previously established:**
   - T9c established the position return at `0x6041935b` and the Small frame at position 529. This run’s Small png hash `c3d3c00bfd28a2b95aca5997a0d4962bbc8165b4321d59a2122c5be085fc1e25` is that frame.
   - The writer-window getter list, the mode pointer at object+`0x374`, and the size-constant switch are new measurements. The kind key’s absence confirms the T9c correction’s kind miss and removes that branch.
   - Profile B is a new reference: Single, four 8×9 marks, hash `5513c70292058bf07648a3eb239433330d57c06e0e595be8f15157c9e6492c43`. It replaces the empty zone-6 frame.
   - Full K2, seeded A, seeded B and stock K1 each end `ok:true` against those references. Seeded B’s kind count of 0 in T9c does not recur, because that branch is gone and the three remaining branches each substitute.

10. **Remaining uncertainties.** The producer that schedules `0x610c8b66` is not named. The instruction that writes object+`0x374` was not captured. `0x5681` returns 2 on every zone and is not the mode. The general relation from a getter return to object+`0x364` stays the T9c hypothesis and was not used. C3 and C4 match C2 because the sweep left `0x1dd1` indices 0 and 1 at 0. The custom 9×11 marks meet the detector window at x=280. For Small and Single the visible glyph size follows the immediates; the `0x1dd1` substitution still ran, and the frames stayed on the K1e references.

11. **Recommended next actions.** None inside this task. The sixth emulator version was not used. Storage, Subject Detect On, the target-record reconciliation, packaging and hardware stay out of scope.

12. **Deviations from the brief.** None that change the requested order. Five of the six permitted emulator versions were used. Expected frames came from the hashed reference runs. The refresh producer was not named; the criterion used is the measured stock setter latency plus one measured idle period, and every changing edge met it. Edges whose reference frame does not change stayed unchanged through that window.
