# T6 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The emulator experiments support the seeded target behavior, but required acceptance is incomplete: save completion failed, the second candidate and acceptance controls never ran, and neither reopen edge was reached. Manifest sealing and assertion coverage also need correction.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, the manifest and supplement, design, field table, scripts, tables, JSONL records, command records and audit evidence. Inspected representative Subject Detection, target, C-AF and acceptance screenshots.

   Research checked: Z5 README, design, target-byte documentation, home/converter listings, overlay CSV and session helper; T3b profile layout; T3j brief §0; T5 brief §§0 and 5 and decision; T7 decision and unchanged `pose.mjs`; `AF-DETECT-OFF-PROOF.md`.

   Independently compared listings and overlay bytes with the decoded image using PowerShell. Did not run Ghidra or OM-Emu. Made no file changes.

3. **Hash verification:** Using zero-based indices in `work/evidence-manifest.json`, the result for **each entry** is:

   - `inputs[0]` through `inputs[668]`: **MATCH**.
   - `sources[0]` through `sources[20]`: **MATCH**.
   - `outputs[0]` through `outputs[353]`: **MATCH**.
   - Every recorded byte length and additional execution/later digest: **MATCH**.
   - `brief_sha256`: **MATCH**.
   - Supplement `cmd_txt` entry: **MATCH**.
   - All 379 `audit/run-log.json` harvested entries: **MATCH**.
   - All executed scripts and wrapper hashes in command records 01–16: **MATCH** against current files.

   `pose.mjs` matches both T6’s entry and T7’s historical digest: `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`.

   **Completeness fails despite these matches.** The supplement explicitly leaves `16.out`, `16.err` and `16.exit` unhashed. Their independently computed hashes are:

   - `16.out`: `452a2a46b4958e2ebbdfa376d4904a09a32f786e0117f7ad43eb51b4de13cc76`
   - `16.err`: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
   - `16.exit`: `71a0d283c4fb7080951f5e900cc12d68d6dd4caf524b95091af766efc56a6380`

   The input inventory also omits consumed home/converter listings and cited T3b profile-layout and Z5 README documents. No missing resolvable literal import/use dependency was found after canonicalizing module paths; this does not turn later hashes into execution-time hashes.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED.** Correct task/version and emulator-only scope.
   - **§2 — CONFIRMED**, with audit support for no task modifications to `om-emu`. The checkout contains inherited local changes. `fileNvram()` selects session files independently of `OM_EMU_NVRAM`.
   - **§3 — CONFIRMED** for command statuses and retained failures. Execution hashes match current scripts. “Only copied” understates the makers: they also transform runner text.
   - **§4 — CONFIRMED** for the identified artifacts and addresses checked. The home builder is overlay code, correctly distinguished from stock.
   - **§5 — OVERSTATED.** Isolation evidence supports writes confined to `work/`; manifest coverage is incomplete as described above.

   Findings under **§6**:

   - **6.1 — CONFIRMED.** Stock swap window is twenty `FF` bytes; all 45 listed converter instructions match stock.
   - **6.2 — CONFIRMED.** The 71-instruction home listing matches Z5 outside the swap except the three relocated bank pointers.
   - **6.3 — CONFIRMED.** Exactly 15 proposed bytes differ from Z5, all marked `profile-read` in section 4. Independently decoded the section table and checked every row: section counts are 1,308 / 95 / 1,856 / 3 for sections 1 / 2 / 4 / 7. Only `0x610bf5e3`–`0x610bf5e5` occupy section 7; none occupy section 6.
   - **6.4 — CONFIRMED** as recorded emulator evidence. Probe targets and writer/builder observations agree with the stated setup.
   - **6.5 — CONFIRMED.** `0x1e71[0]=0` is read back. The screenshot associates **Subject Detection** directly with **Off**; the separate **On** text belongs to Eye Detection Frame. No Subject Detect conclusion relies on `0x90a1`.
   - **6.6 — OVERSTATED literally; CONFIRMED with narrowing.** Small appears on the five AF-ON-owned edges, not after every edge. Other edges restore All. All 12 targets, owners, recorded half-press values and 55 mirror bytes match the expected sequence. K2 and K1 results match their stated configurations.
   - **6.7 — CONFIRMED.** Hook source passes other callers through, including the logged stock half-press caller. Recorded shutter targets support the limited claim that this hook does not replace that writer.
   - **6.8 — CONFIRMED** for C1 target, unchanged recorded half-press dimensions and 24 dimension-hook reads. Mirror invariance is **SUPPORTED-NOT-INDEPENDENT**: the runner compares it, but does not emit the mirror snapshot on these edges.
   - **6.9 — CONFIRMED.** The failed EXIF-6 snapshot shows the stated half-press changes and retained link flags.
   - **6.10 — CONFIRMED** for the candidate’s six pose/link combinations and literal targets. **OVERSTATED** if read as matched control coverage: K2 runs only two linked edges per pose; K1 runs only landscape. Mirror invariance again rests on executed assertions rather than emitted snapshots.
   - **6.11 — CONFIRMED.** Converter-based selection checks both focus IDs as 1; the screenshot shows C-AF. The 12 recorded targets and owners agree.
   - **6.12 — CONFIRMED.** Both 12-edge profiles pass, including the EXIF-6/profile-B change. `c1-save-done` fails with `saves:[]`; terminal `ok:false` is explicit. Reopen was not reached.
   - **6.13 — CONFIRMED as static inference only.** The hook implements the stated fallback. Candidate execution of that branch remains **UNSUPPORTED**, correctly acknowledged in the result.

   Remaining numbered sections:

   - **§7 — OVERSTATED** as a complete evidence inventory; missing inputs and final command seals remain.
   - **§8 — CONFIRMED** as recorded test outcomes. “PASS” applies to the implemented comparisons, not full task acceptance.
   - **§9 — OVERSTATED** for experimental proof of size sourcing: mirror `0x9a41[0]` and legacy size remain zero throughout. The hook statically reads the mirror, but these runs do not distinguish that read from a constant-zero implementation. Position and C1 dimensions are distinguished experimentally. C1 was not tested across multiple pose banks.
   - **§10 — CONFIRMED.** Save/reopen and persistence remain unresolved.
   - **§11 — SUPPORTED-NOT-INDEPENDENT.** The proposed follow-up addresses the save gap, but requires an explicit extension beyond the six-version cap.
   - **§12 — WRONG** in saying “No other deviation.” Unsealed command outputs, incomplete input inventory, incomplete per-key assertions and reduced Q3 controls are additional deviations. The six-version count itself is correct.

5. **Contradictions with established findings:** `design.md`, “Where size, position and +9 come from,” calls mirror `0x9a41` a descriptor with count 1. T3b `profile-layout.md`, “Placement,” specifies **two** one-byte cells at offset `0x08`. Reading index 0 is consistent with the writer; the descriptor description needs correction.

   No contradiction found with T5’s inherited section-7 amendment, T7’s permitted emulator bank mapping, or the established Subject Detect key. T7’s blocked stock-consumer finding remains unresolved by this overlay experiment.

6. **Alternative explanations** not excluded by the evidence:

   - A constant-zero size implementation would satisfy all recorded size expectations.
   - Reapplying half-press setup after pose publication proves behavior under that setup, not uninterrupted preservation across pose changes.
   - K2 controls the combined profile-read change plus seeding; it does not isolate individual field sources.
   - Q2 candidate alone opens the Subject Detection menu. Its unmatched navigation is a possible confound for store differences.
   - Empty save logs establish failed completion checks, not persistence or storage neutrality.
   - Unemitted mirror snapshots in Q2–Q4 prevent independent reconstruction of those invariants from raw values.

   Independent decoded-store comparisons found zero M/E differences for Q1, Q3/Q34 and Q4 candidate/K2 pairs. **Q2 differs in 49 M bytes**, with E identical. No acceptance K2 store exists. The surviving acceptance-c1 store differs from Q1 K2 in six M bytes; that is an unmatched comparison and proves no acceptance storage conclusion.

7. **Scope and safety:** No task writes outside `work/` or task-added `om-emu` changes were established; the isolation audit reports zero violations. Existing checkout modifications are inherited baseline changes.

   Scripts construct patched firmware buffers in memory for emulator sessions; no installable firmware image or hardware recommendation was found. Behavior hooks are labelled emulator-only, and mirror/half-press writes are identified as test setup. The result explicitly avoids claiming native implementation, a storage decision or Subject Detect On evidence.

8. **Required corrections**:

   1. Keep acceptance marked incomplete. Any authorized follow-up must complete two fresh candidates and matched controls, assert M/E save completion, compare decoded stores, and assert reopen AF-ON press **and release**, ending `ok:true`.
   2. Replace unconditional `check(id, [], …)` menu success with exact expected-state comparisons. Assert every key inside menu-exit loops.
   3. Seal final command outputs and add omitted consumed/cited inputs. Preserve existing scripts and failed evidence.
   4. Narrow size and control claims; disclose Q3’s reduced controls and Q2’s unmatched navigation/store differences. A distinguishing size trial requires differing mirror and legacy values.
   5. Correct the `0x9a41` descriptor count, Q1’s “after every edge” wording, and “No other deviation.”

   **Optional improvements:** Emit complete mirror snapshots and focus/status readbacks on every edge; canonicalize duplicate manifest paths; cover C2–C4, mixed link flags and custom dimensions in additional pose banks when further experiments are authorized.