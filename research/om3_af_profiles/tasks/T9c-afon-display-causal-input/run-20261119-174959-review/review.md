# T9c review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The causal trial supports the getter return affecting the frame while the cell stays unchanged. However, the seeded validation fails all 12 frame assertions and ends `ok:false`. The general geometry relation, refresh scheduling condition and required unseeded T6 control remain incomplete.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md`, `result.md`, `display.md`, both T9c addenda, evidence manifest and external seal.

   Inspected runners, traces, JSONL logs, 25 listings, 49 screenshots, command records and audit records. Research checked includes the T9b decision, both T9b reviews and correction evidence; both cited T9 reviews; inherited T3j/T5/T6 rules; T5 edge definitions; T6 design and coordinator corrections; and FEATURE-SPEC’s display requirements and interaction policy.

   Review remained read-only. Neither Ghidra nor OM-Emu was run.

3. **Hash verification:** Recomputed SHA-256 and byte lengths using PowerShell. Ranges below are zero-based.

   - `evidence-manifest.json`: `brief_sha256`, `inputs[0–1]`, `sources[0–12]`, `outputs[0–261]`, `modules[0–128]`, and every available file/script hash in `commands[0–30]` — **MATCH**.
   - Nine Ghidra script records use the basename `DisasmStockV1.java`; resolving it under `work/scripts/` — **MATCH**.
   - `seal-t9c.json`: `files[0–4]` and `commands[0–123]` — **MATCH**. This covers the final manifest and command 31’s three records marked missing during manifest construction.
   - All 31 execution-time script records and all 31 wrapper hashes — **MATCH** current files. No post-execution script edit was detected.
   - Audit `harvested[0–266]` and its brief digest — **MATCH**.
   - All 17 distinct helper/resource hash records embedded in session logs — **MATCH**.

   The 129-module inventory closes the inspected relative-import graph: 478 import references, no missing targets.

4. **Claim-by-claim:** Claims refer to `result.md` §6.

   - **Claim 1 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for execution.** Independent PNG inspection confirms the four stated 19×21 marks and 444 rgb-31 pixels. The runner substitutes only key `0x88b2` at `0x6041935b`; the causal log records two substitutions, cell 526 and Subject Detect 0.
   - **Claim 2 — CONFIRMED for the indirect call; OVERSTATED as refresh resolution.** The recorded stack contains return `0x610c8b68`; image bytes confirm `calls (A2)` at `0x610c8b66`, loading vtable offset `0x190`. Two entries before and after the setter support dispatch during idle. They do not identify the scheduling producer or establish that waiting is the frame-specific refresh condition. The two successful checks are writer gates.
   - **Claim 3 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for sampled state.** The 409 trial records word 409 and point `(19,10)` with cell 526. Screenshot rectangles match. No instruction storing that word was captured.
   - **Claim 4 — CONFIRMED for the listed static operations and sampled arithmetic; OVERSTATED if generalized.** Division by 39, mode-2 size constants 3/3, and glyph dimensions 19/21 are supported by listings and image bytes. The formula reproduces the three measured frames. Scale-slot producers and the general getter-to-word transformation remain unidentified.
   - **Claim 5 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for state.** Small contains 444 grey pixels; the All setup contains none. Kind, zone and dimensions changed together, so this does not isolate their individual effects.
   - **Claim 6 — SUPPORTED-NOT-INDEPENDENT as a hypothesis.** The modulo/minus-6 rule fits the reported samples. Word 523 is inferred from the version-4 frame, rather than directly measured there. A general conversion rule is not established.
   - **Claim 7 — CONFIRMED for recorded pixels; SUPPORTED-NOT-INDEPENDENT for runtime state.** All five owner-2 edges contain the stated four marks; owner-0/1 edges are cleared. Logs contain the stated targets, owners, unchanged cell and Subject Detect. The hook is scoped to the call site and owner 2, but its size/kind branches have zero substitutions. This is not successful full-frame validation: all 12 expected frames fail.
   - **Claim 8 — CONFIRMED for the recorded Z5 control; WRONG as the required unseeded T6 control.** Version 5 substitutes nothing, preserves the cleared frame and passes its assertions. It uses the T5/Z5 CSV without the T6 profile-reader setup, and its display hook omits version 4’s size/kind branches and current-bank selection.
   - **Claim 9 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for state.** Stock K1 retains the centre frame on all 12 edges, the stated target and owner 255; its session ends `ok:true`.

   Other numbered result assertions:

   - **§3 and §8 — CONFIRMED** for six emulator processes, command exits and the reported version-4 failure.
   - **§9 — OVERSTATED** where it says refresh was resolved and the fitted transformation replaces the open geometry question.
   - **§10 — CONFIRMED** as an accurate statement of the principal geometry limitations.
   - **§11 — UNSUPPORTED** as a sufficient acceptance remedy: replacing expectations with rectangles observed after the failed run would not independently establish the relation.
   - **§12 — WRONG** in “No other deviation”: the substituted K2 configuration and unresolved refresh/geometry requirements also need acknowledgment.

5. **Contradictions with established findings**:

   - Version 5 repeats the control substitution explicitly corrected by T9 brief §5 item 3: K2 must include the T6 overlay and profile-reader hook without seeding.
   - Version 4 does not satisfy T9c brief §1 item 4: every frame assertion fails and the session ends `ok:false`.
   - Calling refresh resolved exceeds T9b decision’s “Coordinator corrections” item 3 and T9c brief §1 item 1. The indirect entry is established; its scheduling condition is not.
   - The T9c addenda correctly apply the T9b address and scheduling-wording corrections. No remaining contradiction with accepted T6 target bytes was found.

6. **Alternative explanations** not excluded by the evidence:

   - A lookup, alignment rule or cached conversion may explain 412→406 and the inferred 529→523 relationship.
   - Idle dispatch may process previously scheduled work or change notifications rather than itself being the refresh trigger.
   - The All setup’s changed kind, zone or dimensions may independently account for clearing the marks.
   - Passing Z5 controls do not establish behavior of the complete unseeded T6 configuration.
   - The sampled Small profile does not establish size handling across other zones, custom dimensions or banks.

7. **Scope and safety:** No reviewer writes were made. Isolation records report zero violations, unchanged protected workspace/input state and no new OM-Emu changes.

   Independently reconstructed sections from the image’s loader, table and switch cases. Both consumed CSVs have 3,262 rows with matching stock bytes and section assignments: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Only permitted `0x610bf5e3–0x610bf5e5` occupy sections 6/7.

   Six emulator processes are accounted for. E147 assertions and actual `0x1e71[0]=0` readbacks are present. Overlays and hooks are emulator experiments; no installable image, storage decision or hardware recommendation was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Describe the submission as a partial investigation with an unvalidated display change. Preserve the failed version-4 evidence.
   2. Retain the refresh scheduling condition and general getter-to-geometry relation as unresolved. Label the minus-6 rule consistently as a fitted hypothesis.
   3. Relabel version 5 as the Z5 control with a reduced display hook. Acknowledge that the required unseeded T6 control was not run.
   4. Withdraw “No other deviation.” Record the control substitution, incomplete size coverage and absence of an implemented edge-triggered refresh condition.
   5. Feature acceptance requires newly authorized experiments with independently derived frame expectations, the complete matched K2 configuration and a seeded run ending `ok:true`. Changing expectations retrospectively is insufficient.

   Optional improvements: Stop on the first failed comparison, use unique terminal record IDs, and distinguish directly sampled words from words inferred from screenshots.