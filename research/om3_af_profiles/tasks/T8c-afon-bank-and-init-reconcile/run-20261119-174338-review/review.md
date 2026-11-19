1. **Verdict:** REJECT

   Q1’s measured bank mismatch and Q2’s reset readbacks are supported. The combined hook changes only the bank selection and its label; initialization remains unchanged.

   The required integrated proof is incomplete. `proof3.jsonl` ends `ok:false` at `candidate-af-up`. EXIF 6 press/release, return-to-landscape checks and candidate normal-edit parity were not reached. Target-reference and checker defects also remain.

2. **Baseline checked:** `TASK.md`, `brief.md`, `review-brief.md`, `templates/review.md`, `work/result.md`, manifest, supplement, scripts, generated tables, listings, JSONL records, command records and external audit.

   Research read: T8b decision and both specified reviews; T7 decision, “Direct editor banks”; T6 design; T8 brief and decision; T6/T3m final reviews and T3m decision; inherited T3j/T5/T3b rules. Visually inspected the reset Yes confirmation and candidate direct-editor screenshot.

   Used PowerShell for hashing, image-byte checks, registration-table walking, section reconstruction and record comparisons. Ran neither Ghidra nor OM-Emu. Changed no files.

3. **Hash verification:** Recomputed every manifest file hash and recorded byte length:

   - `inputs[0–1]`: **MATCH**.
   - `sources[0–29]`: **MATCH**.
   - `scripts[0–27]`: **MATCH**.
   - `outputs[0–183]`: **MATCH**.
   - `commands[0–19].scripts`: all 20 **MATCH**, resolving the three `DisasmQ1.java` records to `work/scripts/DisasmQ1.java`.
   - Separate brief digest: **MATCH**.
   - Supplement: all 87 file-backed records **MATCH**.
   - `q1-imports.json`: all 141 module records **MATCH**.
   - Three proof import inventories: all nine records **MATCH**.
   - Command exit records: all 22 script records and 22 wrapper digests **MATCH**.
   - Session logs: all 136 embedded file hashes **MATCH**.
   - External audit harvest: all 221 records **MATCH**.
   - Initial audit input hashes: both **MATCH**.
   - Normalized emulator diff: **MATCH** to inherited baseline `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   No content-hash mismatch was found. The external audit seals the supplement and command 22’s final outputs.

   Inventory completeness remains deficient: the proof inventories name `hook_t8c.mjs` even when the runner imports `hook_t8c2.mjs`; imported `accept_lib_v4.mjs` lacks a submitted file-hash record. Required inherited briefs and promoted baseline artifacts also remain absent.

4. **Claim-by-claim:**

   Numbered sections in `result.md`:

   - **§1 — CONFIRMED** for task identification. Complete compliance with section 0 is **OVERSTATED**, given the assertion and inventory gaps below.
   - **§2 — CONFIRMED** for image hashes, environment settings and identified baselines. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** for six emulator processes and final stopping point. It omits the failed stock-reset search in command 05 from its work summary.
   - **§4 — CONFIRMED** as evidence locations. All 670 retained listing instructions match image bytes.
   - **§5 — CONFIRMED** for the limited hook change; **OVERSTATED** as complete manifest coverage.
   - **§7 — CONFIRMED** as evidence pointers, subject to the qualifications below.
   - **§8 — CONFIRMED** for recorded outcomes and unreached work. Its identity-check PASS wording does not cover all stock-menu commits.
   - **§9 — CONFIRMED** for the measured bank difference and reset/fresh agreement. The historical cause of T7’s different bank selection remains inferred.
   - **§10 — CONFIRMED** as disclosed uncertainties, but incomplete concerning stale references and checker omissions.
   - **§11 — UNSUPPORTED** as a sufficient completion plan. Replacing the release literal alone would leave independent-reference and assertion defects.
   - **§12 — CONFIRMED** for the failed proof, six processes, skipped dial and unchanged initialization. It omits the remaining contract defects.

   Findings under §6:

   - **6.1 — CONFIRMED as recorded emulator observations.** Native link readbacks are 1/1 and 0/0. Position writes use 0/4/2 when linked and 0 in every unlinked pose. Zone getters address the corresponding indices; one Up does not change `0x99a1`.
   - **6.2 — CONFIRMED statically.** The accepted T6 hook formula gives 1/5/3 and unlinked 1. Q1 computes this formula; it does not dynamically execute the T6 hook.
   - **6.3 — CONFIRMED.** The listed UI-key/index lookup and wrapper calls match the image.
   - **6.4 — CONFIRMED.** All 15 reported UI-table rows match the image, including saved/change position pairs 0/1, 2/3 and 4/5.
   - **6.5 — CONFIRMED within the stated writer window.** The fixed-key immediates and absence checks agree with image bytes and established writer findings.
   - **6.6 — CONFIRMED for retained readbacks.** Native Initialize All Settings reaches Yes. Reset and fresh values agree across 63 slots; 50 are nonzero. Independently walked all five registration tables, obtaining counts 452/544/128/204/1,215, and checked the reported zero payloads.
   - **6.7 — CONFIRMED numerically.** The candidate initializes the observed mirror, edits bank 0 to 409 then 292, preserves the recorded live position cells, and produces `[36,1,3,0,1,0,1,0,0,0]` with owner 2. This does **not** establish the required K1e-derived ten-byte expectation.
   - **6.8 — CONFIRMED.** Release produces `[14,2,3,0,3,0,3,0,0,0]`, owner 0, and immediately fails against the cited K1e record.
   - **6.9 — SUPPORTED-NOT-INDEPENDENT** as a causal explanation. Saved/change index pairs are established, but the submitted listings do not close the selector branch explaining T7 versus T8.

   Remaining proof defects:

   - **Target provenance:** `positionFrom` supplies only K1e’s position cell. The runner hard-codes and accepts either 3×3 or 1×1 dimensions. K1e never performs the S1 action needed to establish the required half-press ten-byte target after the same edit keys.
   - **Stale release reference:** `releaseFrom: k1e:e-ok` cites the unchanged image-era All target. The runner additionally requires equality to hard-coded `STOCK`. This does not establish the current stock half-press reference.
   - **Incomplete generated assertions:** table `fields` contain only `subject` and `bank`. Required mirror, flag, half-press-cell, custom-size-record and edge-state assertions are not fully declared or judged.
   - **Exit matching:** executed declared sequences are compared correctly. However, the checker does not require every exit to have a control match; `n-ok` matches itself, and candidate-only `back-shoot` has no matched control sequence.
   - **Identity before commits:** proof exit keys compare exact title/highlight identity. Stock Q1/Q2 `commitOk()` checks text/highlight substrings and merely requires a nonempty title hash; it never compares that hash with an expected hash.
   - **Completion:** Subject Detect assertions and stop-on-failure behavior are present. The required orientation and normal-edit proof remains unexecuted.

5. **Contradictions with established findings:** Q1 differs from T7 decision, “Direct editor banks,” and T6 design, “What the ten bytes are / Position.” T8c explicitly authorizes reconciliation using the measured stock-editor layout, so the scoped mapping change is permitted; its historical explanation remains incomplete.

   Initialization now follows T8c §1.2’s reset-based definition, which supersedes T8b’s ROM tie-break.

   The target-source and incomplete-table behavior conflict with T8c §2.3 and inherited T8b §2.2–3. The release expectation reuses the stale-target problem identified in the second T8b review.

6. **Alternative explanations** not excluded by the evidence:

   - The release failure may reflect a stale reference rather than defective restoration: the candidate’s released target equals its contemporaneous half-target buffer.
   - Saved/change selector state or harness context may explain T7 versus T8 without establishing a universal stock-editor mapping.
   - Reset/fresh equality establishes the measured post-reset state; an unperturbed reset trial does not distinguish every reset write from a retained value.
   - Landscape success does not establish orientation independence or subsequent normal-edit preservation.

7. **Scope and safety:** Audit reports zero isolation violations and zero task-time checkout changes. The emulator diff matches the inherited baseline.

   Independently reconstructed image sections and checked all 3,262 overlay rows, offsets and stock bytes. Counts are 1,308/95/1,856/3 in sections 1/2/4/7. Only `0x610bf5e3–0x610bf5e5` occupy section 7; none occupy section 6.

   The combined hook function is unchanged after normalizing the authorized bank replacement and label. Initialization retains its `FF`/`FFFF` guards. Recorded execution hashes show no retained script-content drift.

   No firmware-image construction, native-implementation claim, storage decision or hardware recommendation was found.

8. **Required corrections** and **optional improvements:**

   Required corrections:

   1. Obtain coordinator authorization before further emulator experiments; all six processes are spent.
   2. Capture synchronized K1e half-press ten-byte references after the same edit keys. Replace stale release references and the permissive hard-coded target alternatives with independently justified expectations.
   3. Restore complete generated field assertions, require actual control-exit matching, and compare expected title hashes before every commit.
   4. Complete the short proof through both poses, return to landscape, normal-edit equality with K2 and terminal `ok:true`.
   5. Complete import/baseline inventories and immediate reference hashing. Add the requested per-slot reset/ROM/fresh disagreement table and qualify the saved/change causal explanation.

   Optional improvements: record pre-commit identity in each proof row and distinguish static T6 bank calculation from dynamically observed hook reads.