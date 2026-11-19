# T9 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The correction establishes useful partial findings and honestly reports the unresolved drawing path. The required dependency inventory and final sealing remain incomplete. No validated display change was produced.

2. **Baseline checked:** `TASK.md`, the complete `review-brief.md`, complete T9 brief including §5, `audit/previous-review.md`, updated `work/result.md`, `work/out/display.md`, all submitted manifests and supplements, experiment runners, retained traces and JSONL logs, listings, screenshots, command records and audit records.

   Research checked: FEATURE-SPEC’s 10 November revision and interaction policy; T3j brief §0; T5 and T6 briefs §§0 and 5; T5 handoff design and session helper; T6 design, promoted README including coordinator corrections, profile-read implementation and both consumed overlay CSVs.

   Review remained read-only. Neither Ghidra nor OM-Emu was run. Independent verification used PowerShell.

3. **Hash verification:** Recomputed SHA-256 and recorded byte lengths. Ranges below are zero-based and cover every entry.

   - `evidence-manifest.json`: `brief_sha256`/`brief_bytes`; `inputs[0–16]`, including every `later_sha256`/`later_bytes`; `dependencies[0–35]`; `sources[0–5]`; `outputs[0–314]`; and all four file records in `commands[0–38]` — **MATCH**.
   - `manifest-supplement-t9c.json`: `command_40_cmd`, `dependencies[0–35]`, `outputs[0–313]`, and all four file records in `commands[0–38]` — **MATCH**.
   - `manifest-seal-t9c.json`: `files[0–5]` — **MATCH**.
   - `manifest-final-t9c.json`: `files[0–4]` — **MATCH**.
   - Historical `manifest-supplement-t9.json`: `command_17_cmd`, all command records, and all outputs except `[83]` and `[131]` — **MATCH**. Those two entries are **MISMATCH** because `display.md` and `result.md` were replaced by their correction versions.
   - Historical `manifest-seal-t9.json`: `files[1–5]` — **MATCH**; `files[0]` — **MISMATCH**, referring to the replaced original evidence manifest.
   - Coordinator audit `harvested[0–328]` — **MATCH**, resolving paths relative to `work/`.
   - Execution records for commands 01–42: all 39 recorded script hash/length pairs and all 42 wrapper hashes — **MATCH** current files. No post-execution script edit was detected.

   Matching entries do not establish completeness. The submitted chain leaves `manifest-final-t9c.json` and all four command-42 records uncovered. The coordinator audit independently preserves those files.

4. **Claim-by-claim:** Claims refer to `result.md` §6.

   - **Claim 1 — CONFIRMED.** Independent pixel inspection finds 444 grey pixels within `(417,265)`–`(482,334)`, matching the reported 66×70 union and screenshot hash.
   - **Claim 2 — CONFIRMED.** Small rest, S1-held and release screenshots each contain 444 grey pixels within `(356,198)`–`(420,268)`, matching the 65×71 union.
   - **Claim 3 — SUPPORTED-NOT-INDEPENDENT.** The retained direct-screen runner and logs support the cell changes, unchanged ten-byte record and dirty byte. No runtime rerun was performed.
   - **Claim 4 — SUPPORTED-NOT-INDEPENDENT.** Logs contain actual `0x1e71[0]=0` readbacks and the Subject Detection/Off menu evidence. The correction runners explicitly compare this value with zero.
   - **Claim 5 — SUPPORTED-NOT-INDEPENDENT.** The chronological draw records contain the four stated colour-22 rectangles and return `0x610f66df`. The associated listing bytes independently match the image.
   - **Claim 6 — CONFIRMED.** The image contains `df3010` at `0x609eece0`, followed by the sequence at `0x609eece3`. The getter thunk returns at `0x6041a202`. All 24 listing files were independently compared: 3,022 represented bytes, zero mismatches.
   - **Claim 7 — SUPPORTED-NOT-INDEPENDENT.** The recorded observers show no entries at `0x609eece3` during the stated windows. Withdrawing the previous coordinate-source attribution is justified.
   - **Claim 8 — CONFIRMED.** Independent comparison of the specified band finds exactly 444 differences, all `31,31,31 → 11,11,11`. The revised wording correctly avoids attributing the difference to `0x84d1`.
   - **Claim 9 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for runtime state.** All five seeded candidate edge screenshots have zero band differences from seeded rest. Logs support the ten-byte and owner changes. The earlier comparison is correctly relabelled Z5 without the T6 hook.
   - **Claim 10 — CONFIRMED.** Version 6 records the missing E143-image exception before session opening. No display-edge validation executed.
   - **Claim 11 — SUPPORTED-NOT-INDEPENDENT for execution; CONFIRMED for static bytes.** Version 8 records caller `0x610eee13` and moved-frame arguments `(356,198)`. Image bytes confirm `calls (A2)` at `0x610eee11` and the method-pointer store at `0x610f62a5`.
   - **Claim 12 — CONFIRMED for screenshot movement; SUPPORTED-NOT-INDEPENDENT for the intervention.** Independent inspection confirms the old and new unions. The runner invokes only the identified candidate setter; logs retain `0x5962=[526,526]` and empty monitored getter/position-entry lists.
   - **Claim 13 — SUPPORTED-NOT-INDEPENDENT within the recorded windows.** The OK window contains corner rectangles and display updates; the AF-ON window contains no recorded corner rectangles and preserves the union. Zero CPU watchpoint hits do not themselves trace the OSD engine’s framebuffer writes.
   - **Claim 14 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for runtime state.** Every supplied version-11 shooting screenshot retains 444 grey pixels in the stock union. The script installs the T6 overlay and profile-read hook without seeding the mirror; logs show fallback targets and owner transitions. These are six snapshots, not the full 12-edge acceptance sequence.
   - **Claim 15 — SUPPORTED-NOT-INDEPENDENT as a bounded inference.** Invoking the `0x88b2` setter causally affects the displayed position while `0x5962` remains unchanged. The actual coordinate-producing read remains unidentified, as acknowledged.

   Correction-round §5 status:

   - **Item 1 — DONE.** Versions 7–11 set `OM_EMU_MODEL=E147` before emulator imports and assert the loaded model before bring-up or keys.
   - **Item 2 — NOT DONE, honestly reported.** Boundary correction, getter-thunk accounting, widget caller, draw arguments and the single-cell trial are supplied. The trace does not reach the coordinate-producing instruction or establish the complete invalidation path.
   - **Item 3 — DONE.** Version 11 supplies the requested unseeded T6 configuration; the earlier Z5 control is labelled correctly.
   - **Item 4 — BLOCKED, honestly reported.** The prerequisite path remains unknown. No replacement hook was guessed. Consequently, the changed-frame assertions on all 12 edges, S1-owned preservation and complete K1/K2 validation do not exist.
   - **Item 5 — DONE.** Claim 8 is narrowed. No hardware dependency is claimed.
   - **Item 6 — NOT DONE.** Both CSVs and the named direct imports are inventoried, but transitive modules and final sealing remain incomplete.

5. **Contradictions with established findings:** None found with the accepted functional findings after applying T6 README’s “Coordinator corrections to the record.”

   The records still fail T9 brief §5 item 6 and the inherited T3j brief §0 manifest requirement. For example, `menu.mjs` statically imports omitted `kernel.mjs`, `rtos.mjs` and `fw/board.mjs`; `sim.mjs` imports omitted `fw/facts.mjs` and `fw/sections.mjs`; `machine.mjs` imports omitted device modules.

   T9 §5 item 4 expressly permits reporting an unidentified path instead of guessing. The submission follows that restriction, but does not establish feature completion.

6. **Alternative explanations** not excluded by the evidence:

   - The `0x88b2` setter may update a cached drawing object through callbacks; the trial does not prove that painting directly reads that cell.
   - Unchanged AF-ON pixels can reflect missing invalidation, a stale coordinate object, or an unchanged source. The complete chain remains unresolved.
   - Display-update calls occur without corner rectangles. A display update alone does not establish frame regeneration.
   - Zero CPU watchpoint hits do not identify the engine-side writes or prove when the pixels changed.
   - Equal frame unions do not establish identical frame contents. Version 11’s executable expectations compare union and mark count rather than every expected pixel.

7. **Scope and safety:** No reviewer writes were made. The isolation audit reports zero violations and zero changes outside allowed outputs. Existing OM-Emu modifications are recorded; no new task modification was established.

   Independently reconstructed section boundaries from the image table at `0x60029b28` and section-switch cases. Each consumed CSV has 3,262 rows: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Stock-byte comparisons pass. The only section-6/7 rows are the permitted `0x610bf5e3`–`0x610bf5e5`, appropriately labelled.

   Behaviour hooks and candidate-cell writes are labelled EMULATOR-ONLY. No installable image, storage decision or hardware recommendation was found. Five correction experiment versions ran. The unresolved boundary is software investigation; it is not presented as a hardware dependency.

8. **Required corrections** and **optional improvements**.

   Required corrections:

   1. Complete the manifest’s transitive dependency inventory, including the omitted static imports identified above. Preserve execution-time versus later hashing distinctions.
   2. Finalize externally after the logged wrapper has finished, covering command 42’s four records and `manifest-final-t9c.json`. Clearly identify historical supplements as superseded.

   Optional improvements: In a subsequent authorized investigation, trace the setter’s coordinate-object updates and invalidation path. Once identified, validate one labelled display change with explicit full-frame expectations after every required edge, including S1-owned preservation and matched controls.