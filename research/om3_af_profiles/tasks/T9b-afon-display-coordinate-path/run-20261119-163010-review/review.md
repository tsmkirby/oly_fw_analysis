# T9b review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   Accepted as a partial investigation, subject to the wording corrections below. The coordinate path and frame-specific refresh trigger remain incomplete. No display change or feature acceptance is established. Stopping without guessing a hook follows the brief.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md` including §5, `audit/previous-review.md`, T9 brief and decision, both specified T9 reviews, `work/result.md`, `work/out/display.md`, both correction addenda, manifests and seals.

   Inspected runners, chronological store records, JSONL logs, listings, screenshots, all 54 command records and audit records. Research checked includes FEATURE-SPEC’s display requirements and interaction policy; inherited T3j §0, T5 and T6 rules; and T6 README’s accepted findings, coordinator corrections and target-source design.

   Review remained read-only. Neither Ghidra nor OM-Emu was run.

3. **Hash verification:** Recomputed SHA-256 and recorded byte lengths using PowerShell. Ranges are zero-based.

   - `evidence-manifest-c-v1.json`: brief digest, `inputs[0–1]`, `sources[0–12]`, `outputs[0–406]`, `modules[0–140]`, `execution_hashes[0–16]` including later hashes, and every available file/script/wrapper record in `commands[0–53]` — **MATCH**.
   - `seal-c-v1.json`: `files[0–5]` and `commands[0–215]` — **MATCH**. It covers the correction manifest and all four records for commands 30 and 54. The three command-54 records marked missing in the earlier manifest are covered here.
   - Historical `evidence-manifest.json`: all inputs, sources except `[0]`, outputs, modules, execution hashes and command records — **MATCH**. Its brief digest and `sources[0]` — **MISMATCH** against the amended current brief.
   - Historical `manifest-seal-t9b.json`: `files[0–6]` — **MATCH**.
   - Historical `manifest-final-t9b.json`: `files[0–5]` — **MATCH**.
   - Audit `harvested[0–411]`, current run’s brief digest and both input hashes — **MATCH**. The initial audit’s brief digest likewise refers to the earlier brief and is **MISMATCH** against the current brief.
   - All 54 execution-time script records and 54 wrapper hashes — **MATCH** current files. No post-execution script edit was detected.
   - Original `result.md`, `display.md` and evidence manifest are byte-identical to the preserved previous-run copies.

   The historical brief mismatches reflect the coordinator’s correction-round amendment, rather than alteration of retained evidence.

4. **Claim-by-claim:** Original claims refer to `result.md` §6, interpreted with the addenda.

   - **Claim 1 — SUPPORTED-NOT-INDEPENDENT.** Retained probes and readbacks support the direct cell store, dirty-byte write and unchanged `0x5962` and Subject Detect. Relevant instruction bytes match the image.
   - **Claim 2 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for timing.** Independent PNG decoding finds 444 grey pixels at rest union `(417,265) 66×70` and moved union `(356,198) 65×71`. Logs support movement during the subsequent idle.
   - **Claim 3 — CONFIRMED as corrected.** Version 6 records 90 executions of the shared load instruction, with two address-filtered cell reads. The addendum withdraws the unsupported attribution of 1,998 getter entries to the thunk.
   - **Claim 4 — CONFIRMED for static instructions.** The load, getter call and thunk return match the image.
   - **Claim 5 — SUPPORTED-NOT-INDEPENDENT within the sampled executions.** The recorded spill/reload values differ from the moved corner coordinates. This excludes those sampled executions as the claimed geometry source.
   - **Claim 6 — CONFIRMED for static data flow.** The stack spill/reload and caller argument preparation match the listings and image.
   - **Claim 7 — SUPPORTED-NOT-INDEPENDENT.** Recorded flag stores and absence of watched dirty-byte reads are supported; they do not establish frame-specific invalidation.
   - **Claim 8 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for runtime state.** Seeded target and owner changes are recorded while the frame stays centred. Getter and flag activity are observations within the press-plus-idle window.
   - **Claim 9 — CONFIRMED as corrected for target decoding and pixels; SUPPORTED-NOT-INDEPENDENT for execution.** The unseeded bytes are `0e 02 02 00 01 00 01 00 00 00`, position 526.
   - **Claim 10 — CONFIRMED.** Independently reconstructed image-derived section bounds and checked all 3,262 overlay rows and stock bytes: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3.
   - **Claim 11 — SUPPORTED-NOT-INDEPENDENT as a bounded inference.** The intervention supports the cell’s effect on displayed position. The complete getter-to-geometry and refresh chain remains unproved.

   Correction addendum §4 findings:

   - **Finding 1 — SUPPORTED-NOT-INDEPENDENT for runtime observations; CONFIRMED for listed calls.** The thunk return `0x60419360` and parent return `0x603f15df` are recorded. Both caller-following windows end without geometry hits.
   - **Finding 2 — SUPPORTED-NOT-INDEPENDENT within the monitored idle.** The first captured exact-value stores of 356 and 198 occur at `0x611852e9` and `0x61185307`. The sampled inputs and object word 406 are recorded. Their causal connection to the preceding getter remains incomplete.
   - **Finding 3 — WRONG in one address attribution; otherwise supported.** The X/Y writes to object `0x62c546b8` at offsets `+8/+0xa`, followed by copies to `0x62bd71ec/ee`, are supported. However, the earlier values 436 and 286 were written to **`0x62bd71f0/f2`**, not subsequently to `0x62bd71ec/ee`. They are the next two halfwords of the four-halfword copy.
   - **Finding 4 — SUPPORTED-NOT-INDEPENDENT for execution; CONFIRMED for the conditional call instructions.** The observed return `0x61184e35`, dirty-byte readbacks and two checks are supported. They do not identify what schedules entry.
   - **Finding 5 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for state and counts.** Seeded AF-ON records owner 2, the stated target, zero origin entries and three flag-writer hits.
   - **Finding 6 — OVERSTATED.** Correct class: **observed activity during the press-plus-400-ms window**. Three flag-writer hits and zero origin entries do not prove that AF-ON schedules the writer or categorically cannot schedule the origin routine. Stock idle also executes the flag writer.
   - **Finding 7 — SUPPORTED-NOT-INDEPENDENT for the reported limitation.** No display change or 12-edge validation was performed.

   Independently compared all 42 listing files: **10,422 represented bytes, zero mismatches**. Byte agreement alone does not establish complete function boundaries or runtime causality.

   Correction-round §5 status:

   - **Record correction 1 — DONE.** Unseeded bytes and position corrected in uniquely named addenda.
   - **Record correction 2 — DONE.** Shared-instruction count corrected and thunk attribution withdrawn.
   - **Record correction 3 — DONE.** Both T9 reviews inventoried and earlier record deviations acknowledged.
   - **Work item 1 — NOT DONE, honestly reported.** The thunk caller and later geometry stores are identified separately. No continuous causal trace reaches full geometry for both 412 and 526; width/height fields remain unidentified.
   - **Work item 2 — NOT DONE; scheduling conclusion OVERSTATED.** The frame-specific refresh trigger remains unidentified.
   - **Work item 3 — BLOCKED, honestly reported.** Prerequisites remain unresolved. No hook was guessed; full-frame, target and owner assertions after all 12 edges, S1 preservation and complete K1/K2 validation therefore do not exist.
   - **Work item 4 — DONE.** The inspected 141-module import closure is inventoried, and the external seal covers the final manifest and every command record.

5. **Contradictions with established findings:** No remaining contradiction with accepted T6 functional findings after applying the addenda and T6 README’s coordinator corrections.

   The complete coordinate and invalidation paths requested by T9b §5 items 1–2 remain unestablished. The no-guessing provision in §5 item 3 supports withholding the change; it does not establish feature completion.

6. **Alternative explanations** not excluded by the evidence:

   - Getter activity and geometry generation may be connected through an untraced cache, callback or event path.
   - Flag-writer activity may be periodic work independent of AF-ON.
   - The observed zero origin entries applies to the recorded window and setup.
   - Word 406 may be a transformed coordinate representation; its numerical difference from 412 does not establish an unrelated source.
   - The repeatedly reused `0x62bd71ec` region may be drawing scratch space rather than a persistent AF-specific object.

7. **Scope and safety:** No reviewer writes were made. The isolation audit reports zero violations and unchanged protected workspace/input state. Existing OM-Emu modifications remain the supplied baseline.

   Six original emulator processes and six newly authorized correction processes are accounted for, including failed original attempts. Correction experiment 5 opens three sessions within one process. E147 setup and session assertions are present; completed observations retain `0x1e71[0]=0` readbacks.

   The only protected-section overlay bytes are permitted `0x610bf5e3–0x610bf5e5`. No new display patch, firmware image, storage decision, hardware recommendation or hardware-dependency claim was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Correct addendum finding 3: 436 and 286 occupy `0x62bd71f0/f2`; preserve the existing evidence and issue a new uniquely named addendum.
   2. Replace “AF-ON schedules the flag writer” and categorical scheduling exclusions with the measured counts and observation window.
   3. Explicitly retain the unresolved continuous getter-to-geometry path, width/height fields and frame-specific refresh trigger. Describe the result as partial investigation.

   Optional improvements: If further experiments are authorized, connect the caller trace to complete geometry for both positions and isolate refresh scheduling before implementing one labelled change and running the required 12-edge assertions.