# T5 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Corrections 1, 3, 4 and 5 are DONE. Correction 2 is NOT DONE: acceptance ends `ok:true`, but its control omits candidate navigation, and the final reopen release edge has no assertion.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, the complete `brief.md`, `audit/previous-review.md`, updated `work/result.md`, manifest, both design files, target-byte notes, overlay CSVs, correction runners, tables, JSONL logs, command records and audit records.

   Research checked: T3j brief and decision; promoted T3 README and T3i design; PROJECT-STATE §3; AFON-MENU-RESEARCH §8’s live-input regression and native-initialization/central-dispatch sections.

   Independently checked section membership, listing bytes, manifest and execution hashes, acceptance edge records, P4 records, header pixels and stored banks. Visually inspected three correction screenshots. Used PowerShell only; no Ghidra, OM-Emu execution or filesystem writes.

3. **Hash verification:** Indices below are one-based; every entry in each range was individually recomputed.

   - `brief_sha256`: **MATCH**.
   - `inputs[1–163]`: **MATCH**, every entry.
   - `sources[1–50]`: **MATCH**, every entry.
   - `outputs[1–749]`: **MATCH**, every entry.
   - All 47 script execution-hash records and wrapper hashes in commands 01–55: **MATCH**. No execution-hash evidence of scripts being edited after running.
   - All 588 module/resource hash records across the import inventories agree with the manifested files.
   - All 803 harvested-file hashes in `audit/run-log.json`: **MATCH**.
   - Supplied emulator-diff pin: **MATCH** after CRLF-to-LF normalization.

   The unresolved `DisasmRangesK1.java` path is repaired. Previously missing consumed CSVs/table and command-41 records are present. The manifest excludes only itself and command 55’s subsequently written `.out`, `.err` and `.exit`, explicitly accounting for those files.

4. **Claim-by-claim:**

   For numbered findings in `result.md` §6:

   1. **CONFIRMED.** Checked all 314 listed instructions against the recorded windows, and reconstructed all 1,992 window bytes from stock plus the inherited central-edge CSV: zero mismatches. The field layout is supported and correctly identified as an overlay listing.
   2. **CONFIRMED.** The twenty-byte legacy-provider read matches the reconstructed overlay bytes, including its stock-equal `FF`.
   3. **CONFIRMED** for the combined-overlay construction already accepted in the previous review. Independently verified 349 overlapping addresses, 182 conflicts and preservation of all 368 Z bytes.
   4. **CONFIRMED.** Independently found exactly 15 changed bytes relative to the combined configuration, all within `0x60a8f708–0x60a8f71b`. The RAM-profile read and retained legacy sources are correctly bounded.
   5. **CONFIRMED.** Header identity is now asserted separately from help text. Independently recomputed the T3j reference hash and all 14 header-asserted acceptance screenshots: zero mismatches.
   6. **SUPPORTED-NOT-INDEPENDENT** for the reused P1–P3 experimental conclusions, previously confirmed. Correction acceptance independently corroborates the Single and Small target records.
   7. **CONFIRMED** within the recorded emulator runs. Acceptance edge records show the stated ownership and half-press restoration.
   8. **CONFIRMED** for the recorded controls. Every asserted acceptance control edge uses the literal stock target `[14,2,2,0,27,0,39,0,0,0]`.
   9. **CONFIRMED.** P4 uses profile 1 versus legacy `0x9fa1=2`. Independently checked all 24 candidate/control edge records, targets, candidate owners, profile and invariant preservation. The run ends `ok:true`.
   10. **OVERSTATED.** Two candidate sessions, literal edge targets, fatal screenshots, profile reset and default-zone AF-ON output are supported. All 75 recorded acceptance edges match their table targets and watched cells. Both candidates’ decoded M and E banks match the control byte for byte: zero differences across 262,144 M bytes and 196,608 E bytes each. However:
       - In `accept_table_c3.json`, control phase A leaves page 27 directly after `2155-cancel`; it omits candidate steps `a-zone-row` through `a-commit`.
       - Control phase B contains only `b-menu`, `b-enter` and two exits; it omits the candidate’s row/chooser navigation and provides no cancel counterpart to `b-commit`.
       - `accept_runner_c3.mjs:287` releases AF-ON after reopen outside the table, without capture or assertion.

       Thus `ok:true` accurately describes the implemented checks, but does not establish the required matched-navigation, every-edge acceptance.
   11. **CONFIRMED.** Independently decoded section boundaries from the image and checked all 3,262 CSV rows, offsets, stock bytes and section labels. Counts are section 1: 1,308; section 2: 95; section 4: 1,856; section 7: 3. Section 6 contains none. Only `0x610bf5e3–0x610bf5e5` occupy section 7, with the required EMULATOR-ONLY label. The annotated CSV preserves the original overlay data exactly.

   Correction statuses under brief §5:

   - **1 — DONE:** Independent section verification passes; T4 placement limitation is explicit.
   - **2 — NOT DONE:** The control-navigation and unasserted-release defects above remain.
   - **3 — DONE:** Header pixels are checked independently of help text.
   - **4 — DONE:** Distinguishing legacy value, per-edge assertions and no-overlay edge control are present.
   - **5 — DONE:** Manifest paths, consumed inputs, command accounting and retained-failure reporting are repaired. Acceptance completeness wording remains overstated for the correction-2 reasons above.

   Other result sections appropriately retain the RAM-only and emulator limitations. Sections 6(10), 8 and 9 overstate matched-control acceptance.

5. **Contradictions with established findings:** None demonstrated with PROJECT-STATE §3 or AFON-MENU-RESEARCH §8. The three section-7 bytes comply with the coordinator amendment in T5 brief §5(1).

   Acceptance completeness remains inconsistent with T5 brief §5(2), which requires matched navigation and assertions after every edge.

6. **Alternative explanations** not excluded by the evidence:

   - Identical stores do not establish navigation equivalence: candidate-only chooser activity remains outside the control.
   - The final reopen release’s target and ownership restoration are unmeasured.
   - Invariance applies after the focus writer prepares the watched settings.
   - These emulator records establish target routing under the modeled setup, without demonstrating sensor/lens focus acquisition.

7. **Scope and safety:** No new writes outside permitted areas or unapproved emulator changes were found. The isolation audit reports zero violations; the emulator diff matches the supplied baseline.

   No firmware container, installable image, storage decision or hardware recommendation was found. Behavior changes remain labeled EMULATOR-ONLY, and Subject Detect On remains outside the demonstrated scope.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Complete the control’s required navigation and cancellation counterparts, asserting every step. Resolve any stock-control limitation explicitly with the coordinator instead of claiming navigation equivalence.
   2. Put the final reopen AF-ON release in the table and assert its target, ownership and invariants.
   3. Re-run acceptance under new names, retain prior records, correct the completeness claims and refresh the manifest last.

   Optional improvements: Record native-save completion/readback explicitly at the save step, alongside the existing subsequent store comparison.