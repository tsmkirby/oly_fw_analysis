# T9c review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The correction supplies independent reference frames, a matched full K2, and passing seeded-A validation. However, size/kind coverage remains incomplete and seeded B ends `ok:false`. The refresh evidence does not establish an every-edge latency result. These failures are honestly reported.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md` including §5, `audit/previous-review.md`, `work/result.md`, `work/out/display.md`, all four addenda, evidence manifest and both seals.

   Inspected runners, retained observations and session logs, reference JSON files, 31 listings, all 101 screenshots through independent decoding of their 19 distinct image hashes, command records and audit records.

   Research checked includes the T9b decision, both T9b reviews, correction addenda and c1–c6 records; both cited T9 reviews; inherited T3j/T5/T6 rules; T6 accepted findings, coordinator corrections and target-source design; and FEATURE-SPEC’s display requirements and interaction policy.

   Review remained read-only. Neither Ghidra nor OM-Emu was run.

3. **Hash verification:** Recomputed SHA-256 and recorded byte lengths using PowerShell. Ranges are zero-based.

   - `evidence-manifest.json`: `brief_sha256`, `inputs[0–1]`, `sources[0–16]`, `outputs[0–393]`, `modules[0–128]`, and every available file/script record in `commands[0–40]` — **MATCH**.
   - `seal-r1.json`: `files[0–6]` and `commands[0–163]` — **MATCH**. This covers the final manifest and command 41’s completed records.
   - Historical `seal-t9c.json`: `files[2]`, `files[4]` and `commands[0–123]` — **MATCH**. `files[0]`, `[1]` and `[3]` — **MISMATCH**, referring respectively to the replaced manifest, result and display document. The historical seal itself is unchanged from the previous submission.
   - All 41 execution-time script records and 41 wrapper hashes — **MATCH** current files. Ghidra script basenames resolve under `work/scripts/`. No post-execution edit of these recorded scripts was detected.
   - Audit `harvested[0–399]`, current run’s brief digest and both input hashes — **MATCH**.
   - Initial `audit/manifest-in.json` brief digest — **MISMATCH** against the amended current brief; it matches the brief digest recorded by the previous submission. Its input hashes and normalized baseline-diff digest — **MATCH**.
   - All 17 distinct helper/resource hash records embedded in session logs — **MATCH**.
   - All 16 inventoried version-4 evidence/script records checked against the previous submission — **MATCH**.

   The 129-module inventory closes the inspected relative-import graph: 478 references, no missing targets. Nevertheless, cited T6 baseline files `out/design.md`, `out/target-fields.md` and `scripts/accept_v1.mjs` are absent from the manifest.

4. **Claim-by-claim:** Claims refer to `result.md` §6.

   - **Claim 1 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for execution.** The PNG contains the four stated 19×21 marks and 444 rgb-31 pixels. The hook substitutes only `0x88b2` at `0x6041935b`; logs record two substitutions, cell 526 and Subject Detect 0.
   - **Claim 2 — CONFIRMED for static instructions; SUPPORTED-NOT-INDEPENDENT for runtime observations.** The recorded stack contains returns `0x610c8b68` and `0x610cdc4f`. Image bytes confirm `calls (A2)` at `0x610c8b66`, using vtable offset `0x190`. Idle reproduces entry without a cell write. The two checks are writer gates; the scheduling producer remains unresolved.
   - **Claim 3 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for sampled state.** The 409 trial records word 409 and point `(19,10)`, with cell 526. Screenshot rectangles agree.
   - **Claim 4 — CONFIRMED for listed static operations.** Independently compared all 31 listings: 4,097 represented bytes, zero mismatches. Division by 39, mode-2 constants 3/3 and glyph dimensions 19/21 are supported. The general conversion and scale-slot producers remain unidentified.
   - **Claim 5 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for setup.** The All setup clears the grey marks. Kind, zone and dimensions changed together, so their individual effects remain unisolated.
   - **Claim 6 — SUPPORTED-NOT-INDEPENDENT as a fitted hypothesis.** The corrected classification is appropriate. Word 523 was inferred from pixels rather than sampled. Correction-round expectations do not use minus-6.
   - **Claim 7 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for execution and chronology.** K1e A has the stated four marks and 444 rgb-31 pixels. Its recorded hash precedes both candidates.
   - **Claim 8 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for timing.** K1e B has an empty grey band. Its log records 66.73128 ms from S1 press to the first observed change after the preceding setter setup.
   - **Claim 9 — CONFIRMED for recorded pixels and runner configuration; SUPPORTED-NOT-INDEPENDENT for state.** Full K2 installs the T6 overlay, reader and shared display hook without seeding. All 12 edges retain the stated target and owners, with zero substitutions and terminal `ok:true`.
   - **Claim 10 — CONFIRMED for recorded pixels; SUPPORTED-NOT-INDEPENDENT for state and timing.** Seeded A matches K1e A on owner-2 edges and the corresponding K2 frame otherwise. All 12 target/owner/frame comparisons pass; terminal `ok:true`. Counts are position 19, zone 19, size 0, kind 0. Six frame changes have measured latencies, maximum 183.51102 ms.
   - **Claim 11 — CONFIRMED for recorded pixels and failure reporting; SUPPORTED-NOT-INDEPENDENT for state.** Seeded B’s 12 edge comparisons pass. Size substitutes 18 times; kind substitutes zero times. The session correctly ends `ok:false`, and command 39 exits 1.
   - **Claim 12 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for state.** K1 retains the centred marks, stock ten-byte target and owner 255 on all 12 edges; terminal `ok:true`.
   - **Claim 13 — CONFIRMED.** Original version 5 uses Z5 and a reduced hook. Its corrected label is accurate.

   Other numbered assertions: §§3 and 8 accurately report the six new processes and seeded-B failure. §§9–10 appropriately retain the unresolved producer and general geometry relation. Section 12’s latency statement supports observed changes, rather than a measured change after every edge.

   Correction-round §5 status:

   - **Item 1 — DONE.** Full K2 uses the same shared display hook as the candidates. Original version 5 is relabelled.
   - **Item 2 — NOT DONE, honestly reported.** A has zero size and kind substitutions; B has nonzero size but zero kind substitutions.
   - **Item 3 — NOT DONE as an every-edge demonstration.** The latency alternative was used, with a 666.73128 ms bound. A’s bound comes from setter latency because its S1 press produced no change; B separately records the same numerical S1-based bound. Only six A edges yield latency samples. All B, K2 and K1 edge latencies are null. Stable matching frames demonstrate presentation, but provide no first-change timing sample.
   - **Item 4 — NOT DONE, honestly reported.** A, full K2 and K1 end `ok:true`; B ends `ok:false`. All four execute 12 target/owner/frame comparisons.
   - **Item 5 — NOT DONE in full.** The requested wording corrections, sampled-versus-inferred distinction, preserved failed evidence and refreshed seal are supplied. The cited T6 baseline files remain uninventoried.

5. **Contradictions with established findings**:

   - Zero branch counts fail T9c brief §5 item 2.
   - Seeded B’s terminal `ok:false` fails §5 item 4.
   - Treating the latency result as demonstrated on every edge would exceed §5 item 3 and `display-addendum-sol-r1.md`, which explicitly reports absent samples on unchanged frames.
   - The missing cited baseline inputs fall short of inherited T3j brief §0’s complete-input inventory requirement.

   No remaining contradiction with accepted T6 target bytes or the corrected T9b address attribution was found.

6. **Alternative explanations** not excluded by the evidence.

   - A lookup, alignment operation or cache may explain the getter-to-word transformation.
   - Idle dispatch may process previously scheduled work; its producer remains unidentified.
   - B’s empty reference and candidate frames can match without demonstrating visible position or size handling.
   - B’s first observed reference change follows both setter setup and S1 press; those contributions were not isolated.
   - An unchanged frame cannot establish when refresh processing occurred.

7. **Scope and safety:** No reviewer writes were made. Isolation records report zero violations, unchanged protected workspace/input state and no new OM-Emu changes.

   Independently reconstructed sections using the image’s loader, table and switch cases. Both consumed CSVs contain 3,262 rows with matching stock bytes and section assignments: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Only permitted `0x610bf5e3–0x610bf5e5` occupy sections 6/7.

   Six original and six newly authorized emulator processes are accounted for. E147 assertions and actual `0x1e71[0]=0` readbacks are present. The display hook is scoped to `0x6041935b` and owner 2. No installable image, storage decision or hardware recommendation was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Keep feature acceptance withheld: seeded B fails, kind coverage is absent, and A also lacks size coverage. Further experiments require renewed authorization.
   2. Narrow refresh conclusions to the six measured A transitions. Distinguish A’s setter-derived bound, B’s S1-based measurement and unchanged edges without latency samples.
   3. Add the three cited T6 baseline files to a supplemental inventory and refresh the external seal using newly named scripts.

   Optional improvements: Use a size profile with visible stock marks, retain separate terminal record IDs, and describe the older addenda explicitly as superseded where their geometry or refresh wording was corrected.