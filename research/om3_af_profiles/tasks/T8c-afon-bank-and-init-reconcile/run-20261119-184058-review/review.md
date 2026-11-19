# T8c review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Q1’s retained bank measurements and Q2’s reset/fresh agreement are supported. The bank change is narrowly scoped, and initialization remains unchanged.

   The required integrated proof remains incomplete. `proof6.jsonl` ends `ok:false` at `candidate-af-down`: the candidate target has dimensions 1×1, while K1e’s S1 reference has 3×3. Release, candidate EXIF 6, return-to-landscape and normal-edit parity are unreached. Frozen-script and control-exit requirements also remain violated.

2. **Baseline checked:** Read `TASK.md`, `brief.md` including §5, `review-brief.md`, `templates/review.md`, `audit/previous-review.md`, `work/result.md`, manifest, supplement, listings, generators, checkers, hooks, runners, generated tables, JSONL logs, command records and audit evidence.

   Research checked: T8b decision and both specified reviews completely; T7 decision, “Direct editor banks”; T6 design and decision; T6/T3m final reviews completely; T3m decision; T8/T8b requirements and inherited assertion, inventory and frozen-script rules.

   Used PowerShell for independent hashing, image-byte checks, section reconstruction, registration-table walking and record comparisons. Visually inspected the reset Yes confirmation and candidate editor screenshot. Ran neither Ghidra nor OM-Emu. Changed no files.

3. **Hash verification:** Recomputed every manifest entry’s file hash and recorded byte length:

   - `inputs[0–1]`: **MATCH**.
   - `sources[0–39]`: **MATCH**.
   - `scripts[0–35]`: **MATCH**.
   - `outputs[0–289]`: **MATCH**.
   - Manifest command-script records: 28 **MATCH**, three **MISMATCH**:
     - Command 24, `gen_proof_table3.mjs`: recorded `b918fd04…`, 14,276 bytes; current `645c1a7c…`, 14,455 bytes.
     - Commands 26 and 29, `proof_t8c4.mjs`: recorded `0343bae7…`, 15,624 bytes; current `7e771f7e…`, 16,010 bytes.
   - Separate current brief digest: **MATCH**.
   - Supplement: all 131 file-backed records **MATCH**.
   - `q1-imports.json`: all 141 records **MATCH**.
   - Seven proof import inventories: 25 records **MATCH**; the runner entries in `proof4-imports.json` and `proof5-imports.json` **MISMATCH** as above.
   - Command exit records: 30 script records **MATCH**, three **MISMATCH** as above; all 33 wrapper digests **MATCH**.
   - Session logs: all 221 embedded file-hash records **MATCH**.
   - External audit harvest: all 335 records **MATCH**.
   - Initial audit input-image hashes: both **MATCH**.
   - Initial audit brief digest: **MISMATCH against the amended current brief**; the correction audit and current manifest agree.
   - Normalized emulator diff: **MATCH** to inherited baseline `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.
   - All 136 target, half-target, mirror and custom-record seals in `proof6.jsonl`: **MATCH**.

   The supplement seals the current manifest and result; the external audit additionally seals the supplement and final command outputs. This preserves current evidence integrity but does not recover overwritten execution versions.

4. **Claim-by-claim:**

   Correction status under brief §5:

   - **Item 1 — DONE for the specifically listed candidate fields.** All 32 generated rows declare mirror, flag, mapped half-press cells, custom-size record, edge state, owner, Subject Detect and bank, with one source per role. Candidate comparisons are implemented. Independent comparisons reproduce the final target failure.
   - **Item 2 — WRONG.** The checker rejects self-matches but accepts matches to other candidate-only steps. The six AF-ON press/release rows form candidate-only cycles: `af-down → p-af-down → l-af-down → af-down`, and likewise for releases. These are not matched control sequences.
   - **Item 3 — NOT DONE in full.** Candidate commit handling compares title hash, highlight and screen against captured K1e identity. K1e’s own same-step commits only capture identity. Retained Q1/Q2 commits still require a nonempty title hash rather than comparison with an expected hash. Successful identity comparisons are not retained with their expected values.
   - **Item 4 — NOT DONE, honestly reported.** Three correction processes ran. The final candidate stops at the first AF-ON press and ends `ok:false`.
   - **Item 5 — NOT DONE.** The 63-slot table, inferred T7 explanation, static/dynamic distinction and refreshed seal are present. Required promoted baseline artifacts remain absent, correction inventories do not establish the complete emulator import closure at execution time, and executed scripts were overwritten.

   Target-reference correction: the final runner sources press expectations from K1e’s S1 record after the same edit keys, hashes that record immediately, and declares release expectations from the candidate’s preceding S1, cross-checked against K2. The hard-coded `STOCK` expectation and dimension alternatives are removed. However, final K1e uses the combined overlay, contrary to the inherited stock-without-overlay definition. This deviation is disclosed but not authorized by the supplied amendment. Release expectations remain unexercised.

   Numbered sections in `result.md`:

   - **§1 — CONFIRMED** for task and correction identification; complete §0 compliance is **OVERSTATED** because frozen-script and assertion requirements remain unmet.
   - **§2 — CONFIRMED** for image hashes, environment settings and named baselines. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** for commands, three new processes and stopping points.
   - **§4 — CONFIRMED** as evidence locations. All 670 retained listing instructions match image bytes.
   - **§5 — CONFIRMED** for the scoped bank change and read logging; **OVERSTATED** as complete manifest coverage.
   - **§7 — CONFIRMED** as evidence pointers, subject to the qualifications below.
   - **§8 — CONFIRMED** for recorded outcomes and unreached work. Checker PASS establishes its implemented checks, not complete contract compliance.
   - **§9 — CONFIRMED** for the distinction between retained and new observations. The historical selector explanation remains inferred.
   - **§10 — CONFIRMED** as disclosed experimental uncertainties.
   - **§11 — SUPPORTED-NOT-INDEPENDENT** as a proposed coordinator decision. Resolving dimensions alone would leave control-exit and evidence defects.
   - **§12 — CONFIRMED** for disclosed failures, skipped dial, overlay-backed K1e, link setters and unchanged initialization; incomplete concerning overwritten scripts and remaining checker defects.

   Findings under §6:

   - **6.1 — CONFIRMED as retained emulator observations.** Native link readbacks are 1/1 and 0/0. Position writes use 0/4/2 when linked and 0 when unlinked. One Up does not change `0x99a1`; corresponding zone reads are recorded.
   - **6.2 — CONFIRMED statically.** T6’s formula gives 1/5/3 and unlinked 1. It was not dynamically executed in these measurements.
   - **6.3 — CONFIRMED.** The final candidate press records zone and position hook reads at bank 0.
   - **6.4 — CONFIRMED.** All 15 reported UI-table rows match the image, including saved/change pairs 0/1, 2/3 and 4/5.
   - **6.5 — CONFIRMED** for reset/fresh equality across 63 slots. Independently walked registration tables containing 452/544/128/204/1,215 records and verified reported payloads. The “50 ROM disagreements” needs qualification: `0x9a41[1]` is outside its one-cell registration record. Its table zero is a convention, not an observed ROM payload.
   - **6.6 — CONFIRMED as recorded.** `proof4` fails because MODE is 255 rather than its expected 0.
   - **6.7 — CONFIRMED as recorded.** Bare-stock `proof5` retains the image-era All target and rejects it.
   - **6.8 — CONFIRMED.** Overlay-backed K1e’s S1 produces `[36,1,3,0,3,0,3,0,0,0]` at position 292, owner 1; its immediate hash matches.
   - **6.9 — CONFIRMED.** Candidate AF-ON produces `[36,1,3,0,1,0,1,0,0,0]`, owner 2, flag 0, status 0 and enabled 1. Position 292 matches mirror bank 0; live position remains 526. Comparison fails at offsets +4 and +6.
   - **6.10 — CONFIRMED.** Candidate pre-press S1 equals K2’s contemporaneous S1 record. AF-ON release is not executed.
   - **6.11 — SUPPORTED-NOT-INDEPENDENT as an inference.** Saved/change pairs support the explanation, but the selector branch establishing the historical T7-versus-T8 cause remains unlisted.

5. **Contradictions with established findings:** The saved-bank mapping differs from T7 decision, “Direct editor banks,” and T6 design, “What the AF-ON record must read instead.” T8c §§2.2 and 5 explicitly authorize this reconciliation; it is a permitted change.

   The dimension mismatch exposes tension between T8c §5’s exact K1e-reference requirement and T6 design’s fixed 1×1 Small conversion. The result correctly fails the comparison instead of substituting an alternative.

   Overlay-backed K1e conflicts with inherited T8b §5.2. Script overwrites conflict with T8 §0. Candidate-only exit cycles do not satisfy T8c §5 item 2.

   Reset-based initialization follows T8c §1.2, which supersedes the earlier ROM tie-break.

6. **Alternative explanations** not excluded by the evidence:

   - Different stock half-press and AF-ON construction paths may explain the dimensions without indicating a bank-selection defect.
   - Overlay-backed K1e establishes an overlay control result, not bare-stock S1 behavior.
   - Saved/change selector context may explain T7 versus T8 without establishing a universal editor mapping.
   - Reset/fresh equality establishes observed post-reset values; it does not identify every reset write independently.
   - Landscape prefix success cannot establish release restoration, orientation behavior or subsequent normal-edit preservation.

7. **Scope and safety:** Audit reports zero isolation violations and zero task-time checkout changes. The emulator diff matches the inherited baseline.

   Independently reconstructed sections from the image and checked all 3,262 overlay rows, offsets and stock bytes: section counts are 1,308/95/1,856/3 for sections 1/2/4/7. Only `0x610bf5e3–0x610bf5e5` occupy section 7; none occupy section 6.

   Initialization is exactly unchanged and retains `FF`/`FFFF` guards. The correction hook equals the retained T8c hook after removing read logging. The authorized behavioral change remains bank selection.

   The final proof asserts `0x1e71[0]=0` after each key edge and stops at the first failed target comparison. Executed generator/runner files were nevertheless overwritten, violating evidence-preservation rules.

   No firmware-image construction, native-implementation claim, storage decision or hardware recommendation was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Resolve the exact K1e-reference versus accepted-converter discrepancy with the coordinator, including authorization or replacement of overlay-backed K1e. Preserve both failed references and candidate records.
   2. Require every exit match to resolve to an actual control sequence with identical ordered press/release semantics. Reject candidate-only matching cycles.
   3. Complete expected-title/highlight checks before commits and retain successful expected/actual identity evidence.
   4. Complete the short candidate sequence through landscape release, EXIF 6, return to landscape and normal-edit equality with K2, ending `ok:true`, within remaining authorization.
   5. Use new filenames for every subsequent script/table version. Disclose the overwritten historical versions as unrecoverable unless their exact bytes are available. Complete execution-time import coverage and required promoted baseline inventory, then refresh the seal.
   6. Mark uncovered ROM slots explicitly; distinguish verified ROM payload disagreements from comparisons against an assumed zero.

   Optional improvements: retain pre-commit identities in successful JSONL rows and make the checker explicitly verify that each matched exit has a control role.