# T8 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Static integration is confirmed. Integrated acceptance is not demonstrated: all six experiments stop during K1, each ends `ok:false`, and none reaches K2, either candidate, save verification or reopen. The result reports this honestly. Additional harness defects mean correcting only the last K1 assertion would be insufficient.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the manifest and supplement, configuration, runners, table builders, six step tables, JSONL records, command records, import inventories, stores and audit artifacts.

   Research checked: inherited briefs §0 and applicable §5; T6 and T3m promoted READMEs with coordinator corrections; T6 design, overlay, profile-read implementation and save procedure/table; T3m layout, routing and restore implementation; T3l decision; both specified previous Sol reviews completely; `PROJECT-STATE` §§2–3.

   Used PowerShell for independent hashing, image-section reconstruction, overlay comparison and store decoding. All 25 screenshots decode successfully; inspected the direct-screen Cross screenshot. Ran neither Ghidra nor OM-Emu. Changed no files.

3. **Hash verification:** Zero-based indices; every recorded SHA-256 and byte length in these groups was recomputed:

   - Manifest `inputs[0–4]`: **MATCH**.
   - Manifest `sources[0–8]`: **MATCH**.
   - Manifest `outputs[0–132]`: **MATCH**.
   - Manifest `commands[0–14]`: all executed-script and command-file records **MATCH**.
   - Manifest `dynamic_imports[0–5]`: all six inventory-file records and all 864 module records **MATCH**.
   - Separate `brief_sha256` and wrapper digest: **MATCH**.
   - Supplement manifest record, command 01–16 script/file records and command 17 `cmd.txt`: **MATCH**.
   - All 864 records in the six standalone import inventories: **MATCH**.
   - Script and wrapper execution digests in all 17 command exit records: **MATCH**.
   - All 142 external audit harvest records, resolved relative to `work/`: **MATCH**.
   - Normalized emulator diff: **MATCH** to inherited baseline `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.
   - Unchanged T7 `pose.mjs`: **MATCH**, `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`.

   No digest mismatch was found. Completeness nevertheless fails: `17.out`, `17.err` and `17.exit` are absent from the submitted manifest/supplement. The external audit preserves their hashes. Consumed historical JSONL inputs to `static_overlay_t8.py`, and several cited research documents, are also absent from the submitted inventory.

4. **Claim-by-claim:**

   Numbered sections in `result.md`:

   - **§1 — CONFIRMED.** Task and brief identification agree.
   - **§2 — CONFIRMED** for named baseline files and recorded input/pose hashes. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED.** Commands 04/06/08/10/13/15 are the six failed controls runs. Retained tables preserve successive K1 observations. Execution digests show no subsequent runner-content change.
   - **§4 — CONFIRMED** as implementation references; candidate addresses being referenced does not establish their exercised behavior.
   - **§5 — OVERSTATED.** The submitted manifest does not list every final output.
   - **§7 — CONFIRMED** as evidence pointers, subject to the qualifications below.
   - **§8 — CONFIRMED.** Every experiment ends `ok:false`; K2, c1, c2, save, reopen and store comparison are unreached.
   - **§9 — CONFIRMED** for the distinction between static integration and recorded K1 observations. Claims of novelty are **SUPPORTED-NOT-INDEPENDENT**.
   - **§10 — CONFIRMED.** The principal unmeasured behavior is accurately disclosed.
   - **§11 — UNSUPPORTED as a sufficient completion plan.** Changing three K1 edge literals leaves the structural defects below.
   - **§12 — CONFIRMED but incomplete.** Exhaustion and unreached acceptance are disclosed; remaining table, control, save and inventory defects are omitted.

   Findings under §6:

   - **6.1 — CONFIRMED independently.** Reconstructed sections from the image, including section ends. All 3,262 combined rows have correct offsets, stock bytes and numeric sections. Combined proposed bytes equal T6’s. T3m differs at exactly 15 `profile-read` bytes. Counts are 1,308/95/1,856/3 in sections 1/2/4/7; only `0x610bf5e3–0x610bf5e5` enter section 7, and none enter section 6.
   - **6.2 — CONFIRMED** as retained emulator observations: Subject Detect and focus readbacks are zero; mirror, zone, flag and stated cells agree.
   - **6.3 — CONFIRMED** for the exercised sequence: positions 526 → 409 → 292, with OK retaining the position.
   - **6.4 — CONFIRMED.** Recorded cells agree; the screenshot visibly identifies Cross.
   - **6.5 — CONFIRMED** for the recorded shooting title and retained cells.
   - **6.6 — CONFIRMED.** The first S1-down retains target `0e 02 02 00 1b 00 27 00 00 00`; owner/status/enabled remain 255.
   - **6.7 — CONFIRMED** that the stock image contains `FF` at those ownership bytes. Hook placement supports the explanation, but K2’s behavior remains unmeasured.

   Acceptance-contract findings:

   - **Controls:** No successful K1/K2-only run exists. The planned K2 skips candidate `c-s1` and `c-s1-up` edges, so it is not matched on every required edge. Its editor-key skip list exists.
   - **Step table:** All 107 IDs are unique and required top-level fields exist. There is no `check(id, [])`. However, 27 title expectations remain `unresolved-*` placeholders.
   - **References:** `resolveValue()` resolves table expectations rather than recorded K2 observations. Reopen half-cell expectations explicitly reference `save-witness`, contrary to the same-step-ID requirement.
   - **C1 sequence:** `mirrorC1` retains bank-1 type 2, Small, while expecting a kind-7 C1 target. No intervening direct-editor C1 selection exists. It also discards the previously expected bank-5 edit. The planned S1 exit follows entry from shooting without opening the direct editor.
   - **Save:** Navigation uses fixed key counts; `afTabHash` does not guide a bounded identity-search loop. A precommit highlighted-row expectation exists, but its title is unresolved. `save-mark` records only witness-event length, not the required store-log and callback baselines. Fresh-image/status judging is present but never executes.
   - **Reopen:** Both candidates have planned press, release, focus and reinitialization checks; none executes.
   - **Stores:** Independently decoded all six available K1 stores: each has identical M/E contents, lengths 262,144/196,608 bytes. K2 and both candidate stores do not exist. Therefore neither required candidate-versus-K2 comparison can be performed, and zero differences are **not demonstrated**.

   Required behaviors in `PROJECT-STATE` §3:

   - **Half press:** **NOT DEMONSTRATED** as integrated preservation; only preliminary stock observations exist.
   - **Independent AF-ON type, size and position per orientation:** **NOT DEMONSTRATED** by T8.
   - **AF-ON menu row:** **NOT DEMONSTRATED** by this run; inherited component evidence exists, and a new entry is out of scope.
   - **AF-ON Subject Detect policy:** **NOT DEMONSTRATED** functionally; Off readback is demonstrated. Subject Detect On is **OUT OF SCOPE**.
   - **Shared S-AF/C-AF behavior:** **NOT DEMONSTRATED** by T8; only S-AF setup executes.
   - **AF-ON precedence and release restoration:** **NOT DEMONSTRATED**.
   - **Persistence:** **OUT OF SCOPE**, Q7.
   - **Display:** **OUT OF SCOPE**, T9.

5. **Contradictions with established findings:** No contradiction was found in the narrowly reported K1 observations or static overlay result.

   The proposed C1 target conflicts with its own Small mirror expectation and T6 design’s type-to-converter mapping. Claiming a complete inventory conflicts with brief §0 and inherited record requirements. Cross-step reopen references conflict with brief §2.3’s same-step expectation rule.

6. **Alternative explanations** not excluded by the evidence:

   - Incorrect control expectations explain the stopping points without establishing a defect in the accepted components.
   - Component-level success does not establish correct interaction between the merged getter routing and editor restores.
   - Repeated K1 store equality can reflect unchanged initial stores; it proves neither final-call saving nor candidate isolation.
   - The unexecuted C1, orientation, size and reopen expectations may contain further errors.

7. **Scope and safety:** Audit reports zero isolation violations and zero allowed checkout changes; emulator modifications match the inherited baseline. No executed-script content change is evidenced.

   The configuration composes accepted components and is labelled `EMULATOR-ONLY`; dynamic equivalence remains untested. No firmware-image construction, added visible menu entry, native-implementation claim, storage decision or hardware recommendation was found. Subject Detect `0x1e71[0]` is read back as zero throughout the retained K1 steps.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Obtain coordinator authorization before further experiments: all six versions are exhausted.
   2. Repair the complete table before another run: role-specific K1 ownership expectations, real title hashes, matched K2 edges/exits, coherent C1 selection and bank preservation, and an actual editor S1 exit.
   3. Use same-step K1/K2 references and reject missing required fields/references. Make screenshot errors fatal without silently falling back after `ctx.screen()` throws.
   4. Implement bounded identity-guided save navigation and record store-log/callback baselines. Demonstrate fresh E and M images with individually associated status-0 completion, including posted M, and explicit persisted expectations.
   5. Complete controls first, then both fresh candidates, every acceptance item, both reopens and reinitializations, independent decoded-store comparisons against K2, and terminal `ok:true`.
   6. Complete final-command and consumed-input inventory coverage; revise §5 and the next-action recommendation accordingly. Preserve executed scripts and historical evidence.

   Optional improvements: rename misleading presets such as `halfSingle`, which now contains Cross observations, and validate table consistency before spending an experiment version.