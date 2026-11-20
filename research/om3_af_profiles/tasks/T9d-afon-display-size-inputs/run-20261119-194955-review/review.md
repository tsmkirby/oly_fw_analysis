# T9d review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Both visible profiles and both controls pass their recorded validation. However, the sweep omits visible marks, retains only selected refresh traces, and does not locate the mode-word producer required by the brief. These leave the investigation incomplete.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, `work/out/display.md`, manifest and seal.

   Read the T9c decision, both Sol reviews, correction display note and addenda, reference/validation runners and logs; T8c’s bank decision; T6 design and target-field sources; and FEATURE-SPEC’s requirement revision, required behavior and interaction policy.

   Inspected current runners, listings, sweep traces, reference JSON, observation/session logs, 60 screenshots representing 18 distinct hashes, command records and audit records. Review remained read-only. Neither Ghidra nor OM-Emu was run.

3. **Hash verification:** Recomputed SHA-256 and recorded byte lengths with PowerShell. Ranges below are zero-based.

   - Manifest `brief_sha256`, `inputs[0–1]`, `sources[0–12]`, `outputs[0–155]`, `modules[0–128]`, and every populated file/script hash in `commands[0–12]` — **MATCH**.
   - Ghidra script basename `DisasmT9d.java`, resolved under `work/scripts/` — **MATCH**.
   - Seal `files[0–2]` and `commands[0–51]` — **MATCH**. The seal covers command 13’s three records unavailable during manifest construction.
   - All 12 execution-time script records and all 13 wrapper digests — **MATCH**.
   - Audit `harvested[0–160]`, brief digest and input digests — **MATCH**.
   - All 17 distinct helper/resource hash records embedded in session logs — **MATCH**.

   No hash mismatch was found. The 129-module inventory closes 478 inspected relative-import references. The three previously omitted T6 baseline files are inventoried.

   `lib_valid_t9d.mjs` has a matching final manifest hash but no execution-time digest in the command/session records. Its unchanged execution-time contents cannot be independently established from those hashes.

4. **Claim-by-claim:** Findings refer to `result.md` §6.

   - **Claim 1 — CONFIRMED for visibility and A/B pixels; WRONG as a complete mark inventory.** All listed non-All trials show marks. Small has four 19×21 marks and 444 rgb-31 pixels; Single has four 8×9 marks and 168 pixels. However, the detector excludes x<280:
     - Large actually has four 19×21 marks at `(233,176)`, `(525,176)`, `(233,403)` and `(525,403)`, totaling 444 pixels. The report counts only two and 222 pixels.
     - Custom actually has four complete 19×21 marks at `(274,198)`, `(484,198)`, `(274,381)` and `(484,381)`, totaling 444 pixels. The reported 300 pixels and clipped rectangles describe the counting window.
     
     Sampled word 523 and writer modes are **SUPPORTED-NOT-INDEPENDENT** runtime observations.

   - **Claim 2 — CONFIRMED for retained traces; OVERSTATED if applied to every refresh.** Saved calls contain the stated keys, returns and multiplicities, all with return address `0x6041a202`. Image bytes confirm the call at `0x6041a1fb`. However, `pickWindow()` retains one writer-bearing window per trial. The records report 37 windows but preserve only 11 selected windows and 97 calls. Other refreshes cannot be audited.

   - **Claim 3 — CONFIRMED for static instructions; UNSUPPORTED as completion of the mode-input investigation.** Independently compared all 474 listed instructions with the image: zero byte mismatches. Pointer formation establishes object+`0x374`; the switch contains the stated constants and indirect calls. The instruction producing the mode word remains unidentified, as the result acknowledges.

   - **Claim 4 — CONFIRMED for the recorded comparisons; WRONG in its mode attribution and OVERSTATED in its derivation.** Cross and Single both return size cells 1/1 and draw different glyphs, but Cross is mode 4, not mode 2. Small is mode 2 and returns 3/3. Thus the Cross/Single comparison does not establish the stated conclusion about modes 2/3. The custom/C1 frames differ, and the retained trace supports `0x1dd1` at the shared getter. The exact zone-return-to-mode-store path is still missing.

   - **Claim 5 — CONFIRMED for current source.** The display hook uses the two named call sites, gates substitutions on owner 2, reads saved-bank position/zone and mirror dimensions, preserves sentinels, and removes the kind branch. Landscape uses saved bank 0; the unchanged reader uses bank 1. Both are seeded. Execution identity of the shared library has the hash limitation stated above.

   - **Claim 6 — CONFIRMED for pixels/configuration; SUPPORTED-NOT-INDEPENDENT for runtime state.** Full K2 includes the T6 overlay, reader and shared display hook without seeding. All 12 frames have an empty target band; logs record the stated target, owners, cell and Subject Detect, zero substitutions and terminal `ok:true`.

   - **Claim 7 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for state and counts.** All seeded-A edge screenshots match the appropriate Small/K2 target marks. Recorded target/owner assertions pass; counts are position 16, zone 16 and size 6; session ends `ok:true`.

   - **Claim 8 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for state and counts.** Seeded B visibly supplies the required different size at a non-centre position. Owner-2 screenshots contain the four 8×9 marks; remaining edges match K2. Counts are 16/16/6 and terminal `ok:true`.

   - **Claim 9 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for state.** Stock K1 retains the four centred 19×21 marks across all 12 edges. Target, owner 255, cell 526, Subject Detect 0 and terminal `ok:true` are recorded.

   - **Claim 10 — SUPPORTED-NOT-INDEPENDENT for timing; CONFIRMED for comparison logic and recorded results.** The bound is 283.60794+316 = 599.60794 ms. Both seeded runs report changing-edge latencies for edges 2/3/5/6/8/11 of 66.73128/33.36564/116.77974/150.14538/183.51102/16.68282 ms. Edges 0/1/4/7/9/10 record no change and `drifted:false`. K2 and K1 record unchanged results on all edges. These are sampled observations, not independent execution measurements.

   Other numbered assertions:

   - **§§1–3, 5, 7–8 — CONFIRMED** for task identity, files, five emulator processes, successful command exits, evidence references and reported test outcomes.
   - **§4 — CONFIRMED** for listed addresses; identifying consumers does not complete the missing producer trace.
   - **§9 — CONFIRMED** for the visible second profile and nonzero remaining branch counts.
   - **§10 — CONFIRMED** as disclosure of uncertainties, but custom clipping is analytical clipping rather than missing screen pixels.
   - **§11 — UNSUPPORTED** insofar as no further task work is needed.
   - **§12 — OVERSTATED** as a sufficient deviations account: incomplete mark coverage, discarded refresh records and the missing mode producer require acknowledgment.

5. **Contradictions with established findings**:

   - T9d brief §1 item 1 requires all mark rectangles and every refresh’s getter calls. The clipped detector and selected-window export fall short.
   - T9d brief §1 item 2 requires call sites and keys setting the mode word. Its consumer is located; its producer is not.
   - T9c decision’s “Accepted — Causal input” establishes the position override. It does not independently establish the complete zone-to-mode-store path attributed to it here.

   No contradiction with the accepted saved-bank mapping or T6 target-byte findings was found.

6. **Alternative explanations** not excluded by the evidence.

   - Mode-dependent glyph selection can explain Cross/Single differences without the claimed modes-2/3 inference.
   - Discarded refresh windows may contain different getter activity from the retained window.
   - The counting window explains Large’s missing marks and Custom’s clipped components.
   - Idle dispatch may consume previously scheduled work; its producer remains unidentified.
   - Nonzero dimension substitutions in fixed-size profiles establish branch execution without isolating their effect on displayed size.

7. **Scope and safety:** No reviewer writes were made. Audit records report zero violations, unchanged protected workspace/inputs and no new OM-Emu changes.

   Independently reconstructed section boundaries from the image loader, table and switch. The 3,262 overlay rows have matching stock bytes: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Only `0x610bf5e3–0x610bf5e5` occupy sections 6/7.

   Five emulator processes are accounted for. E147 checks and actual `0x1e71[0]=0` readbacks are present. Changes are emulator overlays/hooks. No installable image, storage decision or hardware recommendation was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Reanalyse the retained sweep screenshots over the complete target area. Correct Large and Custom rectangles, counts and clipping descriptions.
   2. Supply getter records for every refresh, rather than one selected window per trial. Preserve existing evidence; acknowledge that discarded windows cannot be reconstructed from the current exports.
   3. Locate and document the mode-word producer and its input path with image-matching listings. Correct Cross’s mode attribution and narrow the glyph-size inference.
   4. Update completion/deviation wording and refresh the manifest and seal. For further executions, record the shared validation library’s digest before the run.

   Optional improvements: Retain timestamped per-refresh identifiers and per-sample frame signatures so call coverage and refresh-window assertions can be audited directly.