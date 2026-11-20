# T9d review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The corrected mark inventory and recorded A/B validation are supported. The correction remains incomplete: the mode-selecting getter input is untraced, seeded refresh getter records are absent, and the supplemental inventory omits correction evidence. The revised Cross branch attribution is also wrong.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md` including §5, `audit/previous-review.md`, `work/result.md`, both display notes, both manifests and both seals.

   Read the T9c decision and both reviews; its correction display notes, reference/validation runners and relevant logs; T8c’s bank decision; T6’s design and target-field sources; and FEATURE-SPEC’s requirement revision, required behavior and interaction policy.

   Inspected current runners, listings, traces, reference records, command records and audit records. Independently decoded all 72 screenshots through their 21 distinct hashes. Neither Ghidra nor OM-Emu was run. Review remained read-only.

3. **Hash verification:** Recomputed SHA-256 and byte lengths using PowerShell. Indices below are zero-based.

   - Original manifest `inputs[0–1]`, `sources[1]`, `sources[3–12]`, `outputs[0–142]`, `outputs[144–155]`, `modules[0–128]`, and every populated file/script digest in `commands[0–12]` — **MATCH**.
   - Original manifest `brief_sha256` and `sources[0]` — **MISMATCH** against the amended brief. They record the earlier brief.
   - Original manifest `sources[2]` and `outputs[143]` — **MISMATCH** against the updated result. Their digest **MATCHES** `work/out/sealed-r1/result.md`.
   - Supplemental manifest `files[0–25]`, `commands[0–116]` and `libValid` — **MATCH**.
   - Original seal `files[0]`, `files[2]`, `commands[0–51]` — **MATCH**. `files[1]` — **MISMATCH** against the updated result; **MATCH** against its archived original.
   - Refreshed seal `files[0–4]`, `commands[0–119]` — **MATCH**.
   - All 29 execution-time script records and all 30 wrapper digests — **MATCH** current files. Ghidra script basenames resolve under `work/scripts/`.
   - Audit `harvested[0–305]`, current run’s brief digest and both input digests — **MATCH**. Initial audit brief digest — **MISMATCH** against the amended brief, consistent with its historical value.
   - All 17 distinct helper/resource digest records embedded in session logs — **MATCH**.
   - Correction pre-run library/reference digests — **MATCH**. Commands 15, 20 and 22 record the library digest before execution.

   These expected historical mismatches do not indicate evidence corruption. However, the supplemental inventory is incomplete: matching audit hashes do not replace the required submission inventory.

4. **Claim-by-claim:** Findings refer to `result.md` §6.

   - **Claim 1 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for runtime words and modes.** The full-frame recount confirms all eleven trials. Large and Custom each contain four complete 19×21 marks and 444 rgb-31 pixels at the corrected coordinates. Single has four 8×9 marks; Cross has eight 19×21 marks; All has none.

   - **Claim 2 — CONFIRMED for retained records.** The correction sweep preserves 37 closed, untruncated refresh windows containing 227 getter calls, with no null returns. Keys and multiplicities agree with the report. Every window links to a later sample among 169 recorded samples. This establishes coverage of the new sweep, not seeded A/B refreshes.

   - **Claim 3 — CONFIRMED for static bytes and documented copy/store path; SUPPORTED-NOT-INDEPENDENT for execution; UNSUPPORTED as a complete mode-input investigation.** Independently checked 1,712 listed instructions against the image: zero mismatches. The ten zone-to-mode pairs also match. Records identify the object copy at `0x610cd71c`, its slot/template sources, and template store `0x611c7746`. The indirect getter input through `0x61291ebb` remains unrecorded, as disclosed in §10.

   - **Claim 4 — CONFIRMED for corrected modes, constants and frame comparisons; WRONG for Cross’s branch attribution.** Cross is mode 4. The image’s jump-table entry at `0x61470360` sends it to `0x6118558f`, as the original display note states. The correction instead asserts execution of `0x61185251`, without an execution trace establishing that route. The narrowed comparisons of Small, Single and custom frames are otherwise supported.

   - **Claim 5 — CONFIRMED for current source.** Substitutions are limited to the two named call sites, owner 2, saved-bank position/zone and mirror dimensions. Sentinels pass through; the unused kind branch is removed. The inherited reader still uses the change bank, with both banks seeded. Original candidate runs lack a pre-run digest of the shared library; the correction records do not retroactively supply one.

   - **Claim 6 — CONFIRMED for recorded target pixels and configuration; SUPPORTED-NOT-INDEPENDENT for runtime state.** Full K2 includes the overlay, reader and matching display hook without seeding. All twelve edges pass, substitutions are zero, Subject Detect reads zero, and the session ends `ok:true`.

   - **Claim 7 — CONFIRMED for target pixels; SUPPORTED-NOT-INDEPENDENT for state and counts.** All twelve seeded-A screenshots match the appropriate reference’s full-frame rgb-31 coordinates. Counts are position 16, zone 16 and size 6; terminal `ok:true`.

   - **Claim 8 — CONFIRMED for target pixels; SUPPORTED-NOT-INDEPENDENT for state and counts.** Seeded B visibly supplies four 8×9 marks at the non-centre position. All twelve comparisons agree with the corresponding references; counts are 16/16/6; terminal `ok:true`.

   - **Claim 9 — CONFIRMED for target pixels; SUPPORTED-NOT-INDEPENDENT for state.** Stock K1 retains the centred marks throughout all twelve edges and ends `ok:true`.

   - **Claim 10 — SUPPORTED-NOT-INDEPENDENT for timing; CONFIRMED for recorded results and comparison logic.** Both seeded runs record changing-edge latencies of 66.73128, 33.36564, 116.77974, 150.14538, 183.51102 and 16.68282 ms on edges 2/3/5/6/8/11. Remaining edges record no change and `drifted:false`; K2/K1 remain unchanged. All satisfy the 599.60794 ms bound. The comparison logic checks target-mark summaries within its detector window, rather than complete screenshot equality.

   Other numbered assertions:

   - **§§1–4 — CONFIRMED** for task identity, baseline, addresses, five original processes and three correction processes.
   - **§5 — CONFIRMED** for named files and preservation of the original result; **OVERSTATED** if read as a complete correction inventory.
   - **§7 — CONFIRMED** for evidence locations, subject to the coverage limitations above.
   - **§8 — CONFIRMED** for recorded outcomes. The correction sweep’s internal `r2-done` failure is accurately disclosed despite the session ending `ok:true`.
   - **§9 — CONFIRMED** for the visible second profile and nonzero remaining substitution branches.
   - **§10 — CONFIRMED** as disclosure of unresolved inputs and scheduling.
   - **§§11–12 — OVERSTATED** as completion wording: they disclose omitted reruns but do not clearly classify the remaining correction requirements as incomplete.

   Correction-round §5 status:

   - **Item 1 — DONE.** Full-frame Large/Custom inventory and clipping corrections agree with independent decoding.
   - **Item 2 — NOT DONE, honestly reported.** Store watches were armed before execution, and copy/template-store evidence was added. The selecting getter return/key is still missing. Cross’s mode is corrected, but its branch attribution is wrong.
   - **Item 3 — NOT DONE.** The new sweep has complete retained windows and sample links, and discarded original windows are acknowledged. Seeded A/B have no equivalent getter records and were not rerun.
   - **Item 4 — NOT DONE in full.** New process digests, amended wording and a refreshed seal exist. The supplemental inventory omits evidence, and the wording does not explicitly retain all incomplete items.

5. **Contradictions with established findings**:

   - `brief.md` §5 item 2 requires the getter input selecting the mode; `result.md` §10 acknowledges that this input was not traced.
   - `brief.md` §5 item 3 requires every-refresh records; the correction supplies these only for the sweep.
   - `display-addendum-r3.md`, “Superseded: glyph-size sentence,” contradicts `display.md`, “The frame function,” and the image’s mode-4 jump-table destination.
   - The incomplete supplemental inventory falls short of `brief.md` §1 item 5 and the review brief’s Records requirement.

   No contradiction with the accepted saved-bank mapping or inherited section-7 byte allowance was found.

6. **Alternative explanations** not excluded by the evidence.

   - A cached value or another upstream path may select the mode before the traced copy/store chain; the getter-to-mode path remains incomplete.
   - Seeded refresh windows may contain getter activity absent from the stock sweep.
   - Nonzero dimension substitutions on fixed-size profiles establish branch execution without isolating their effect on glyph size.
   - Matching mark summaries cannot exclude other pixel differences or changes between sampled frames.
   - Idle dispatch may consume previously scheduled work; its scheduling producer remains unidentified.

7. **Scope and safety:** No reviewer writes were made. Audit records report zero isolation violations, unchanged protected inputs/workspace and no newly introduced OM-Emu changes.

   Independently reconstructed section boundaries from the image’s loader, table and switch. All 3,262 overlay stock bytes match: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Only `0x610bf5e3–0x610bf5e5` occupy sections 6/7.

   Eight emulator processes are accounted for within the original and correction authorizations. E147 setup and actual `0x1e71[0]=0` readbacks are present. No post-execution edit was detected in the recorded scripts. Original execution-time identity of the shared validation library remains unproven. No installable image, storage decision or hardware recommendation was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Complete the mode-selecting getter trace, or explicitly retain §5 item 2 as incomplete. Correct Cross’s branch attribution to match the image and distinguish static routing from observed execution.
   2. Supply every-refresh getter records for seeded A/B, or explicitly retain §5 item 3 as incomplete. Preserve existing executions and discarded-window disclosures.
   3. Complete the supplemental inventory and refresh its seal under new names. Missing evidence includes `samples-r2.json`, correction session/observation logs, `mode-copies-r4.jsonl`, correction screenshots and additional listings. Preserve historical manifests and executed files.
   4. Revise completion wording to state the remaining unmet requirements and retain the original shared-library execution-digest limitation.

   Optional improvements: Record explicit per-sample comparison signatures in future candidate runs and describe validation precisely as target-mark comparison where complete pixel equality is not checked.