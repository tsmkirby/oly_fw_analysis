# T8b review (Codex Sol, read-only)

1. **Verdict:** REJECT

   K1/K2 reference observations and K2’s amended save witness are supported. Integrated acceptance is incomplete: all five candidate attempts end `ok:false`, c2 never starts, and neither candidate completes save, reopen, reinitialization or store equality. The result reports these failures honestly. The generated table also retains substantive defects despite its checker passing.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the manifest and supplement, sequences, generators, checker, generated tables, runners, reference file, JSONL records, command records, inventories, stores and audit artifacts.

   Research checked: T8 brief including §5, T8 decision, both specified T8 reviews completely, inherited rules, T6/T3m promoted decisions and implementation references, T6 design/save procedure, T3l initialization/layout and decision, specified T6/T3m reviews, inherited configuration, and `PROJECT-STATE` §3.

   Used PowerShell to recompute hashes, independently reproduce checker predicates, reconstruct image sections, compare reference records and decode stores. All 163 PNGs decode; visually inspected the highlighted AF Target Mode row and final candidate Up screenshot. Ran neither Ghidra nor OM-Emu. Changed no files.

3. **Hash verification:** Every file-backed hash and recorded byte length in the following groups was recomputed:

   - Manifest `inputs[0–21]`: **MATCH**.
   - Manifest `sources[0–162]`: **MATCH**.
   - Manifest `outputs[0–309]`: **MATCH**.
   - Manifest commands: all 121 script/file records **MATCH**.
   - Supplement: all 131 file-backed records **MATCH**.
   - Six standalone import inventories: all 870 module records **MATCH**.
   - Command exit records: all 27 executed-script records and 26 wrapper digests **MATCH**.
   - External audit harvest: all 338 records **MATCH**.
   - Initial audit input-image records: both **MATCH**.
   - Separate brief digests: **MATCH**.
   - Reference sidecar: **MATCH**, `649fc573bc46437c55fa54085c52abc01f373b357e618c28e4bfd08264aef2d1`.
   - Unchanged pose module: **MATCH**, `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`.
   - Normalized emulator diff: **MATCH** to inherited baseline `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   No hash mismatch was found. Static import-closure inspection found no omitted transitive module among the 145 inventory entries per version. The coordinator’s external audit seals the supplement and command 26’s final outputs. Required baseline documents, including the promoted T6/T3m READMEs and T6 save witness/table, remain absent from the submitted inventory.

4. **Claim-by-claim:**

   Numbered sections in `result.md`:

   - **§1 — CONFIRMED.** Task and brief identification agree.
   - **§2 — CONFIRMED** for recorded image/pose hashes and unchanged accepted hook block. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**. “No byte … into section 6 or 7” is **WRONG** as written: the three permitted inherited section-7 rows are present.
   - **§3 — CONFIRMED** for the 26 recorded commands, six emulator processes and stated stopping points. Command 06 is static inventory reconstruction, not another emulator process.
   - **§4 — CONFIRMED** as implementation references and addresses.
   - **§5 — OVERSTATED** as complete manifest coverage. The supplement and external audit complete final-command sealing; required research-input inventory remains incomplete.
   - **§7 — CONFIRMED** as evidence pointers, subject to the qualifications below.
   - **§8 — CONFIRMED** for reported failures and unreached acceptance. Checker PASS establishes its implemented structural checks only.
   - **§9 — CONFIRMED** for observations corresponding to findings 1–5, 7 and 9–13. **§9.6 is WRONG:** the checker gap is not closed. **§9.8 is OVERSTATED:** bank 0 is the observed editor write in this harness, not the accepted button consumer’s landscape bank.
   - **§10 — CONFIRMED** as disclosed uncertainties, but incomplete concerning the deterministic table contradictions below.
   - **§11 — UNSUPPORTED as a sufficient completion plan.** Finding another Small-selection key leaves bank, flag, exit-matching and expectation-provenance defects.
   - **§12 — CONFIRMED** for exhaustion, unchanged accepted components and unreached acceptance; incomplete concerning those remaining table defects.

   Findings under §6:

   - **6.1 — CONFIRMED as recorded observations.** All 134 reference rows match their JSONL counterparts. Subject Detect is 0, mirrors are 55 `FF` bytes, flags are 255, and K1 edge targets/ownership/status/enabled match the stated invariants.
   - **6.2 — CONFIRMED.** The runner records its baseline before the commit-opening OK. The added witness contains one posted M from `0x60061268`, its own callback status 0, 262,144 captured bytes, and no E. Independently decoded K2 M hashes to `d678d295d730a876188c46b890834158a21bc9a492adab976a9ebda696754b90`.
   - **6.3 — CONFIRMED independently.** K1/K2 differ at exactly 65 M offsets and zero E offsets. Both banks have the expected full lengths.
   - **6.4 — CONFIRMED.** Source ordering hashes the reference immediately after writing it; its current bytes match that hash.
   - **6.5 — CONFIRMED.** Command 04 exits 1 because `inventory` is undefined after terminal session `ok:true` and reference hashing. Command 06 reconstructs the inventory without rerunning sessions.
   - **6.6 — CONFIRMED for source syntax and recorded checker outputs; OVERSTATED as contract compliance.** Independent PowerShell reproduction returns zero checker problems for all five tables, with 136/136/136/138/137 rows. Individual navigation keys and detents are expanded, all required fields have declared sources, referenced control rows exist, and no direct candidate reference occurs. The checker nevertheless exempts editor-labelled exits.
   - **6.7 — CONFIRMED.** Entry initializes the measured fields while offset 33 remains `FF`; this follows the unchanged `LAYOUT` initialization loop.
   - **6.8 — CONFIRMED for this harness observation.** The retained Up row contains bank-0 type/position writes and the stated title; half-press cells equal K2’s `zone-ok` snapshot.
   - **6.9 — CONFIRMED.** The next detent leaves the mirror unchanged and produces the stated title.
   - **6.10 — CONFIRMED.** Post-opening enable writes are retained; the following detent still leaves type/zone at 1.
   - **6.11 — CONFIRMED.** Pre-arming changes the subsequent Up outcome as stated; this does not establish the cause.
   - **6.12 — CONFIRMED.** K2 reopen records the stated targets and owners. Candidate fallback acceptance is unreached.
   - **6.13 — CONFIRMED.** Each failed candidate run stops before another sequence action and emits terminal `ok:false`.

   Remaining acceptance-contract defects:

   - **Unmatched exits:** `e-ok`, `p-menu`, `p-back`, `c-size-ok`, `c-tab-leave` and `c-s1` are candidate-only. `check_table.mjs` skips exit matching whenever `editor` is true. Save rows match K2; editor exits do not.
   - **Bank contradiction:** tables v3–v5 place Small at mirror bank 0 and leave bank 1 as All, while asserting a Small AF-ON target. The unchanged accepted hook reads bank 1 in landscape.
   - **Flag contradiction:** shared rows such as `n-up` source flag 255 from K2, whereas the preceding candidate exit explicitly expects—and the accepted exit hook writes—0.
   - **Expectation independence:** later generators explicitly substitute earlier candidate measurements for bank/title literals. Their declared source is syntactically `literal`, but that alone does not establish independent provenance.
   - **Sequence coverage:** no completed candidate demonstrates the Small edit and position, normal-edit restoration, 12 edges, orientation banks, C1 `[5,7]`, size distinction, save or either reopen. Fixed twenty-Left save navigation is asserted only at its endpoint; candidate navigation remains untested.
   - **Persisted expectations:** `judgeSave()` checks image/completion and E equality, but no explicit persisted-cell assertion is implemented; `PERSIST` is unused. Full store comparison is planned later and never reached.

   Independently decoded every available candidate store. Each of `nvram-t8b2-c1.json` through `nvram-t8b6-c1.json` has M/E lengths 262,144/196,608 and differs from K2 at **65 M offsets and zero E offsets**, without truncating the comparison. These are aborted pre-save stores, so the differences do not establish leakage. **No c2 store exists. Neither required completed-candidate comparison is demonstrated.**

   Required `PROJECT-STATE` §3 behaviours:

   - **Stock half-press preservation:** **NOT DEMONSTRATED** after an integrated candidate edit; preliminary control/prefix observations exist.
   - **Independent AF-ON type, size and position per orientation:** **NOT DEMONSTRATED**.
   - **AF-ON menu row:** **DEMONSTRATED** for the inherited emulator configuration and K2 commit.
   - **AF-ON Subject Detect policy:** **NOT DEMONSTRATED** functionally; Off readback is demonstrated. On is **OUT OF SCOPE**.
   - **Shared S-AF/C-AF behaviour:** **NOT DEMONSTRATED**.
   - **AF-ON precedence and release restoration:** **NOT DEMONSTRATED** for integrated candidates.
   - **Persistence:** **OUT OF SCOPE**, Q7.
   - **Display:** **OUT OF SCOPE**, T9b.

5. **Contradictions with established findings:** The bank-0 acceptance literals conflict with T6 design, “What the AF-ON record must read instead,” which selects banks 1/5/3, and with the unchanged runner’s `bank()` implementation. Shared flag references conflict with T3l design, “Exit handling,” and its accepted flag-clear behaviour.

   Result §2’s blanket section-7 statement conflicts with the permitted inherited call-site patch documented in T8 §0. Complete-checker wording conflicts with T8b §2.3’s matched-exit requirement.

   The amended posted-M save finding agrees with T8 decision, “Coordinator decision on the save criterion.”

6. **Alternative explanations** not excluded by the evidence:

   - Harness setup, direct-screen timing or literal errors can explain candidate failures without establishing a defect in an accepted component.
   - Editor writes and button reads may select different banks in this integration.
   - Aborted stores can retain session-open contents; their differences from committed K2 do not prove leakage.
   - Successful K2 saving and hook-free reopening cannot establish candidate restoration, fallback or repeatability.
   - A working Small-selection key would not resolve the unexecuted C1, orientation, exit and save-navigation hypotheses.

7. **Scope and safety:** Audit reports zero isolation violations and zero allowed checkout changes. The emulator diff matches the inherited baseline. Execution hashes show no retained script-content drift.

   Independently reconstructed image sections and checked all 3,262 overlay rows, offsets and stock bytes: section counts are 1,308/95/1,856/3 for sections 1/2/4/7. Only `0x610bf5e3`–`0x610bf5e5` occupy section 7; none occupy section 6. Combined proposed bytes equal T6’s; T3m differs at exactly the 15 profile-read bytes. The combined hook block is unchanged from t8r5 and between both T8b runners.

   Behaviour/setup writes are labelled `EMULATOR-ONLY`. `0x1e71[0]` is read and asserted as 0. No added visible menu entry, firmware-image construction, native-implementation claim, storage decision or hardware recommendation was found. Playback and session-end exits remain untested.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Obtain coordinator authorization before further emulator experiments; all six versions are spent.
   2. Repair the table/checker’s exit matching, bank/target consistency and candidate flag expectations. Establish independent provenance for literal expectations.
   3. Complete both candidates through every required sequence item, explicit persisted expectations, both reopens and reinitializations, full M/E equality against K2, and terminal `ok:true`.
   4. Complete required baseline-input inventory and revise result §§2, 5, 9.6, 9.8, 11 and 12 to reflect these findings.

   Optional improvements: emit save baselines and pose readbacks in retained rows, and distinguish structural checker success from semantic acceptance.