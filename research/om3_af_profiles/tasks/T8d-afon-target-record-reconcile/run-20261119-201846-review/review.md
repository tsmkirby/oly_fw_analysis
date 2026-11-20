# T8d review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The writer discrepancy and two corrected press/release comparisons are supported. The required proof remains incomplete: `proof-t8d5.jsonl` ends `ok:false`; return-to-landscape press/release, normal-edit parity and the post-change zone table were not reached.

   Changing the failed expectation alone is insufficient. The writer feed bypasses the saved position bank, and the proof misses changes to inactive half-press banks.

2. **Baseline checked:** Read `TASK.md`, `brief.md`, `review-brief.md`, `templates/review.md`, `work/result.md`, manifest and seal; inspected listings, sweep evidence, hooks, runner, generator, checker, generated tables, JSONL logs, screenshots and audit.

   Research checked: T8c decision and both specified reviews completely; T6 design completely; T8c correction runner, hook, `proof6.jsonl` and `slots-q2.json`; inherited writer-tail listing; T3h face mapping; T4 section reconstruction method; T8b decision and relevant T8c requirements.

   Used PowerShell for independent hashes, image-byte comparisons, ROM-slot checks, section reconstruction and record comparisons. Ran neither Ghidra nor OM-Emu. Changed no files. `work/out/cmd/` is absent.

3. **Hash verification:** Every file-backed manifest entry was recomputed, including recorded byte lengths:

   - `inputs[0–3]`: **MATCH**, each entry.
   - `sources[0–10]`: **MATCH**, each entry.
   - `outputs[0–317]`: **MATCH**, each entry.
   - Separate `brief_sha256`: **MATCH**.
   - Manifest digest and length against `seal-t8d.json`: **MATCH**; digest `590b62b57d622f362f50b370d1eebb4adb708646c9943119c785921c348903c2`.
   - Five proof import inventories, six entries each: all 30 **MATCH**.
   - Session-log embedded helper/resource hashes: all 289 **MATCH**.
   - Final proof record seals: all 204 **MATCH**.
   - Sweep target/half-target seals: all 14 **MATCH**.
   - External audit harvest: all 320 entries **MATCH**.
   - Normalized emulator diff: **MATCH** to inherited digest `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   No content-hash mismatch was found. These matches do not establish complete execution-time inventories: `walkImports()` runs after the experiment, omits dynamic imports, and command-time script records are absent.

4. **Claim-by-claim:**

   Numbered sections in `result.md`:

   - **§1 — CONFIRMED** for task identification, authorized overlay-backed K1e and unchanged `bank()`/`initMirror()`. Complete §0 compliance is **OVERSTATED** because evidence-preservation and inventory requirements are not fully demonstrated.
   - **§2 — CONFIRMED** for image/resource hashes, overlay identification and recorded environment settings. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — SUPPORTED-NOT-INDEPENDENT** for exactly six processes. Six experiment tags and their failures are retained, but the required command records are missing.
   - **§4 — CONFIRMED** as research locations, with a coverage qualification: the submitted writer listing stops at `0x609b3d1a`, and the converter listing stops at `0x609b3fba`. They do not cover their reported complete windows. All 405 submitted listing instructions match image bytes. An additional 23 inherited writer-tail instructions also match.
   - **§5 — CONFIRMED** for the retained files and unchanged named functions; **OVERSTATED** as complete evidence coverage and a complete behavioral implementation. `applyWriter()` is explicitly invoked by the runner after settling an AF-ON press; installing the hook alone does not invoke it.
   - **§7 — CONFIRMED** for the principal evidence pointers, subject to the limitations here.
   - **§8 — CONFIRMED** for reported failures, unreached work and the two recorded press/release comparisons. Checker PASS establishes its implemented checks, not full contract compliance.
   - **§9 — CONFIRMED** for the new numerical comparisons. Calling findings 1–3 confirmation of T6 needs qualification: T6’s converter rule is established; its equivalence to the stock writer is contradicted.
   - **§10 — CONFIRMED** as disclosed uncertainties, but incomplete concerning position-bank bypass, inactive-cell changes and truncated mirror checks.
   - **§11 — UNSUPPORTED** as a sufficient completion plan. Replacing 526 with 292 would accept a live-cell change without resolving its cause or the subsequent writer-position defect.
   - **§12 — CONFIRMED** for the disclosed incomplete proof, skipped zone table and settled-code writer call. Remaining assertion and inventory defects are omitted.

   Findings under §6:

   - **6.1 — CONFIRMED, with scope qualification.** The seven reads, kind-2 position force and priority-clearing rules agree with image-backed listings. The copy rules are conditional on the shadow-adjust path not replacing the corresponding values; swept rows have `flagBe=0` and `adjustDelta=0`.
   - **6.2 — CONFIRMED** for the converter’s preset construction and the observed divergence at +2/+4/+6.
   - **6.3 — CONFIRMED** from descriptor/table bytes, face records, established T3h glyph mapping and retained screenshots. The new script’s unrelated UTF-16 substring hits alone would not establish the names.
   - **6.4 — CONFIRMED** for six retained comparison records and their differing offsets. Custom candidate comparison is incomplete.
   - **6.5 — CONFIRMED as recorded emulator observations.** Both candidate press records equal the corresponding K1e S1 records. Both releases equal the candidate’s preceding S1, independently matching K2. These observations follow an explicit harness writer call and consumer overwrite.
   - **6.6 — CONFIRMED.** Return-to-landscape records position 292 against expected 526 and stops.
   - **6.7 — CONFIRMED.** `0x9a41` registration count is one; index 1 is uncovered, with reset/fresh value 1.
   - **6.8 — SUPPORTED-NOT-INDEPENDENT as causation.** The timing interval is supported, but “flush” is not traced. More precisely, `candidate-pose-exif6` already records landscape position 292.

   Additional proof defects:

   - **Saved-bank bypass:** During `inWriterForAfon`, getter `0x88b2[0]` reads mirror offset `0x22`, without using `bank()`. At the final retained state this cell is 409, while saved landscape `0x5962[0]` is 292. With unchanged mirror state, the next landscape writer call would overwrite the bank-selected position with 409.
   - **Incomplete half-press checks:** `halfBank` checks only the current bank. Landscape position changes to 292 during `pose-exif6`, yet that row passes because it checks bank 4. At `pose-land`, bank 4 has also changed to 409.
   - **Incomplete mirror checks:** `snap()` and `packHalf()` cover 55 bytes, excluding mapped `0x1de1` and `0x1df1` cells at offsets `0x37–0x46`. The new writer reads priority from that unchecked region.
   - **Identity:** Candidate commit comparisons retain expected/actual identities. K1e’s own commits assign the observed identity as its expectation; sweep K1e commits similarly lack independent expected-title/highlight assertions.
   - **Exit matching:** The retained table resolves candidate exits to actual control-role sequences with matching ordered edge semantics. The previous candidate-only-cycle defect is corrected.
   - **ROM count:** The prose’s “fifty other slots” is **WRONG**. There are 49 covered ROM disagreements, one uncovered slot and 13 all-zero slots.

5. **Contradictions with established findings:**

   - The new writer feed bypasses the saved-bank behavior accepted in T8c decision, **“Accepted — Banks,”** despite preserving the text of `bank()`.
   - Accepting the changed live position merely by updating expectations would conflict with inherited half-press preservation requirements and T8c brief §2.3’s mapped-cell checks.
   - K1e self-derived identity expectations do not satisfy T8c brief §0, **“Identity before commit,”** carried forward by T8d §1.4.
   - Incomplete execution-time inventories conflict with T8d §0 and §1.5.
   - Overlay-backed K1e is explicitly authorized by T8c decision, **Coordinator ruling 1**; it is not a remaining contradiction.

6. **Alternative explanations** not excluded by the evidence:

   - Pose delivery or deferred editor-copy activity may explain the live-position changes; the records do not isolate the responsible write.
   - Passing snapshots may reflect the explicit writer call and immediate consumer overwrite without establishing correct behavior throughout subsequent reconciliation.
   - Reset Small dimensions do not establish correct editor-driven mirror updates for Cross, Mid, Large, All or custom sizes.
   - Matching current and post-run hashes cannot exclude an earlier overwrite without execution-time records.

7. **Scope and safety:** Audit reports zero isolation violations and zero task-time checkout changes. The emulator diff matches the inherited baseline.

   Independently reconstructed section ranges from the image and checked all 3,262 overlay rows, stock bytes and offsets: section counts are 1,308/95/1,856/3 in sections 1/2/4/7. Only `0x610bf5e3–0x610bf5e5` occupy section 7; none occupy section 6.

   The change is labelled `EMULATOR-ONLY`. No firmware-image output, storage decision or hardware recommendation was found. The final runner asserts Subject Detect after each executed key edge and stops at its first detected failure. Frozen-script compliance cannot be fully certified from the available records.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Obtain coordinator authorization before further emulator experiments; the submitted six-version allowance is exhausted.
   2. Preserve saved-bank position semantics in the writer feed and exercise the behavior through its intended invocation path.
   3. Trace the pose-time live-cell changes. Check all required half-press cells and the complete mapped mirror region; do not resolve preservation failures solely by changing expectations.
   4. Complete custom comparison, the post-change zone table, return-to-landscape press/release and normal-edit parity with K2, ending `ok:true`.
   5. Assert independently established title/highlight expectations before every control and candidate commit, retaining successful comparisons.
   6. Supply complete bounded writer/converter evidence and execution-time import, baseline and command inventories. Preserve every executed version under a new filename.
   7. Correct the covered ROM disagreement count to 49.

   Optional improvements: log writer getter values and consumer records before and after `applyWriter()`, and capture every pose-triggered write to the saved/live position cells.