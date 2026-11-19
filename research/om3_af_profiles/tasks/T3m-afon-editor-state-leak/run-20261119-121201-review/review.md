# T3m review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The focused custom-size restore produces a candidate store byte-identical to its K2 control and retains C1/C2 in the mirror. Required save verification and acceptance remain incomplete. The result honestly reports those failures, but persistence timing and record-completeness claims still need correction.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md`, `audit/previous-review.md`, `templates/review.md`, updated `work/result.md`, both supplements, manifest, leak/design/layout/harness write-ups, and `accept_lib_v4.mjs`.

   Inspected correction runners, sequences, chronological events, JSONL outcomes, summaries, command records, import inventories, stores, screenshots and audit artifacts.

   Research checked: complete T3l decision and last Sol review; inherited brief §0 and correction requirements from T3j, T5, T3b and T3l; complete T6 `save_v3.mjs`, its save table and completion record. Checked emulator NAND save implementation and image section-table entries.

   Used PowerShell for independent verification. Modified no files and ran neither Ghidra nor OM-Emu.

3. **Hash verification:** Recomputed SHA-256 and byte lengths. Every entry in these current-manifest groups is **MATCH**:

   - `inputs[0–4]`: all 5.
   - `research[0–14]`: all 15.
   - `stock_measurements[0–7]`: all 8.
   - `resources[0–1]`: both.
   - `sources[0–33]`: all 34.
   - `dynamic_imports[0–155]`: all 156.
   - `outputs[0–833]`: all 834.
   - `commands[0–39].files`: all 160 file records.
   - Separate brief hash: **MATCH**.
   - Original supplement’s four command-22 file records: **MATCH**.
   - Supplement v2’s 76 command-file records, covering commands 23–41, and prior-supplement record: **MATCH**.
   - Supplement v2’s current-manifest hash and length: **MATCH**.
   - All 1,556 module records across all 11 import inventories: **MATCH**.
   - All 41 executed-script records and 42 wrapper records: **MATCH**.
   - All 877 audit harvest records: **MATCH**.
   - Audit emulator diff after newline normalization: **MATCH** to the initial baseline hash.

   The original supplement’s manifest reference is **MISMATCH against the current file**: it expects hash `4190dec5…`, 155,780 bytes; the refreshed manifest is `626d9843…`, 304,282 bytes. This is a superseded historical reference; the original manifest is not retained at that path.

   Completeness remains insufficient:

   - All four command-42 files are absent from the task manifest/supplements. The external audit harvest hashes them, but does not make the task’s sealing claim correct.
   - The inherited `leak_p2`/`leak_p3` inventory collision remains; both scripts write `import-inventory-p2.json`.
   - New correction versions have separate inventories. No executed-script modification is evidenced.

4. **Claim-by-claim:**

   For `result.md` §6:

   - **6.1 — CONFIRMED.** The retained p1 evidence records candidate position 994 versus control 526 after the following normal dial.
   - **6.2 — CONFIRMED with the revised qualification.** The object halfword and reader are supported. The result now explicitly excludes an exhaustive first-divergence claim.
   - **6.3 — CONFIRMED content; classification is mixed static/dynamic.** The three copies and restore omission are supported. The incomplete object-write aggregate is now disclosed.
   - **6.4 — CONFIRMED for the focused p3 sequence.** Recorded following-edit parity and Subject Detect 0 are supported. This does not prove every possible exit.
   - **6.5 — CONFIRMED normal-edit parity; OVERSTATED full per-key parity.** Historical n1–n3 parity and K1/K2 store equality hold. The first-round custom-size steps still lack complete independent expectations, and the historical save check cannot establish the required final save.
   - **6.6 — CONFIRMED independently.** Decoded both banks. Historical K1/K2 match completely. Historical c1 differs from K2 at exactly nine M bytes and zero E bytes: M+2 `199→121`; +211472/+211476/+211480/+211484 `3→1/33/1/33`; +211504/+211508/+211512/+211516 `1→5/8/5/8`. Historical c2 is absent.
   - **6.7 — CONFIRMED independently.** Historical K2/c1 and focused fixed-candidate M banks have 16-bit word sums of zero. M+2 compensates for the payload changes.
   - **6.8 — CONFIRMED writer/order observations; WRONG action attribution; SUPPORTED-NOT-INDEPENDENT precise save source.** The chronological trace records word writes at `0x60063519`/`0x6006351b`, followed by routed setter calls, while packed live cells remain unchanged. However, `currentStep` changes inside `step()`, after the key runs. Events labelled `c1-sub` and `c2-sub` therefore occur during the following **OK commits**, not the sub-dials. The snapshots confirm this: custom words remain unchanged at `c1-sub` and change at `c1-ok`. The observation trace contains **zero `nand` events**; its installed witness does not directly capture the serialization source. The record addresses and restoration effect strongly support the route, but are not a captured save-source trace.
   - **6.9 — CONFIRMED for the focused sequence.** The labelled change snapshots/restores the 72-byte record on top of p3. Independently decoded `nvram-fix-v1-k2.json` and `nvram-fix-v1-c.json`: **zero differing offsets in both banks**. C1/C2 remain in the recorded mirror through `save-close`; listed live custom-size cells remain unchanged. The final menu call itself adds no save: the count is already 3 before it and remains 3.
   - **6.10 — CONFIRMED failed-save outcome.** `save-v1` records no new M/E. `save-v2` records two new posted M images with callback status 0 and no E. Screenshots independently show Wireless Shutter in v1 and Priority in v2. The persisted-size judge executes, but the candidate run and subsequent store comparison are unreached.
   - **6.11 — CONFIRMED section values; defective CSV format.** Independently read section starts from the image and checked all 3,262 rows, offsets and stock bytes. Counts match: section 1: 1,308; section 2: 95; section 4: 1,856; section 7: 3. Only the three permitted addresses enter sections 6/7. However, the generated CSV has **two `section` headers**, causing ordinary PowerShell `Import-Csv` to fail.

   For the remaining numbered sections:

   - **§1 — CONFIRMED** task/correction identification.
   - **§2 — CONFIRMED** named baselines and eight individually inventoried stock inputs; historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** six correction-version outcomes and exhaustion.
   - **§4 — CONFIRMED** instruction-count correction and named implementation references.
   - **§5 — OVERSTATED** complete inventory; command 42 and historical inventory separation remain unresolved.
   - **§7.1–7.11 — CONFIRMED as evidence pointers**, subject to the qualifications above.
   - **§8 — CONFIRMED** reported failures and unreached acceptance.
   - **§9 — CONFIRMED** distinction between historical and new observations.
   - **§10 — CONFIRMED** observed menu discrepancy; its proposed explanation remains **SUPPORTED-NOT-INDEPENDENT**.
   - **§11 — UNSUPPORTED as a sufficient completion plan.** Repairing the initial K1 lookup and save setup alone leaves substantial assertion defects.
   - **§12 — CONFIRMED** exhaustion and save/acceptance failures; **OVERSTATED** corrections 1 and 5 as fully completed.
   - **Owner decision Q5 — CONFIRMED.** Session-flag entry remains; no visible menu entry or storage decision was added.

   Correction status:

   - **Correction 1 — NOT DONE, substantially supported.** Chronological writes identify the second record and writer. Event/action attribution is wrong, and actual save-source capture is absent. Old first-difference qualifications are corrected.
   - **Correction 2 — DONE for the focused demonstration.** One labelled restore change, retained mirror sizes and independently verified zero store differences.
   - **Correction 3 — NOT DONE, honestly reported.** No demonstrated final call produces both required fresh banks with images and completion status.
   - **Correction 4 — NOT DONE, honestly reported.** `accept_v4` stops on K1’s unresolved self-reference and ends `ok:false`. Neither candidate store exists, so neither requested candidate comparison can be performed. Reopen is unreached.
   - **Correction 5 — NOT DONE.** Command 23, consumed measurements, numerical section computation and wording improved. Final sealing, historical inventory preservation and CSV formatting remain incomplete.

   Acceptance also remains structurally deficient: there is no complete editor step table; custom-size steps omit title/zone/full mirror expectations; later expectations reuse candidate observations such as `opened.mirror` and `c1.mirror`. `runT6()` calls `applyStep()` without judging its returned observations. Only c1 has a planned reopen. In `accept_lib_v4.nativeSave()`, a logged bank can still pass without a captured image, and callbacks are not associated with each bank; the separate `judgeFreshSaves()` is stronger.

5. **Contradictions with established findings:** No contradiction with T3l decision’s accepted initialization, Subject Detect erratum or Q5 boundary.

   Full acceptance remains contrary to T3m brief §5.3–4 and inherited T3j assertion requirements. The sub-dial attribution contradicts the runner’s action ordering and recorded snapshots. Record-completeness wording conflicts with brief §5.5.

6. **Alternative explanations** not excluded by the evidence:

   - A serialization copy or intermediate buffer could connect the watched record to the saved bank; no dynamic NAND source event establishes that final link.
   - Earlier saves explain the focused run’s final file without any save caused by its final menu call.
   - Other editor caches or exit paths may still leak; focused store equality does not establish full acceptance.
   - Missing candidates and reopen leave fresh-session repeatability and reinitialization untested.

7. **Scope and safety:** No task-time writes outside `work/` or new unapproved emulator changes are evidenced. Audit reports zero violations and unchanged workspace/inputs; the normalized emulator diff matches the inherited baseline.

   Changes are labelled `EMULATOR-ONLY`. No firmware-image/SD construction, visible menu addition, storage decision or hardware recommendation was found. Native-build prose describes proposed requirements, not a demonstrated native implementation. Subject Detect `0x1e71[0]` is read and asserted as 0 in the focused runs.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Obtain coordinator authorization before additional experiments; all six correction versions are exhausted.
   2. Correct event/action attribution to the OK commits. Capture the actual save source, including the posted-write path, or explicitly qualify the serialization-source conclusion.
   3. Complete a fresh final-call save with recorded pre-call log/callback baselines, new E/M images and associated status 0, including posted M completion; assert persisted cells against explicit expectations.
   4. Replace incomplete procedural acceptance with a complete independently expected step table. Judge every key, eliminate candidate-derived expectations, complete K1/K2 and both fresh candidates, reopen each candidate, verify next-entry initialization and full store equality, ending `ok:true`.
   5. Seal command 42’s final records, preserve or clearly supersede historical manifest references, document the unrecoverable inventory collision, and emit one numeric `section` column.

   Optional improvements: record the upcoming action before executing it and report witness-event counts explicitly, so empty traces cannot be mistaken for successful capture.