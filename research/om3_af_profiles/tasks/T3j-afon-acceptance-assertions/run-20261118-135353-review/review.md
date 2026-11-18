# T3j review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   The recorded functional acceptance is confirmed. Configuration, per-key coverage, readbacks, stores and dependency provenance check out. Two harness corrections remain: chooser help text is misidentified as the page title, and the store-comparison failure path does not immediately stop.

   **T3a brief §4’s functional criteria are now met in full as an EMULATOR-ONLY prototype**, including page 28 by the explicitly permitted reference construction. T3j’s stricter title-assertion and first-failure requirements are not fully met.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md` and `brief.md` completely; checked `templates/review.md`, `work/result.md`, the complete manifest, all 104 table entries, runner, capture/session helpers, probe/table-generation scripts, acceptance and session JSONL records, command records and `audit/`.

   Research checked: T3a brief §§4/7; T3i brief, decision and Sol review; T3i’s final session configuration and overlay; T3h `faces.md`; `AFON-MENU-RESEARCH.md`, “How a page-27 row opens its editor”; and T3c’s page-28 construction script.

   Independently checked all 281 acceptance records and 150 shared candidate/control comparisons. Inspected **30 screenshots**: c1’s `menu`, `left-{0,4,9,15,19}`, `page27`, `{2154,2155}-open`, `zone-open`, `zone-right-{1–9}`, `zone-cancel-c4`, `commit-{2,9}`, `page{25,26}`, `exit-{0,1}`, `save`; plus page-28 c1, reopen c1 and c2 commit-9.

   Used PowerShell and image viewing only. Did not run Python, Ghidra or OM-Emu.

3. **Hash verification:** **Every manifest entry MATCHES**, including its recorded byte count. The following inclusive, zero-based ranges identify every individually recomputed entry in `work/evidence-manifest.json`:

   - **MATCH — each `inputs[0..159]`:** all 160 inputs.
   - **MATCH — each `sources[0..13]`:** all 14 sources.
   - **MATCH — each `outputs[0..530]`:** all 531 outputs.
   - **MATCH — `brief_sha256`.**
   - **MATCH — every additional `later_sha256` and `execution_sha256` field present.**

   Additional verification:

   - All **549 harvested-file hashes** in `audit/run-log.json` MATCH.
   - All **148 inventory hashes**—143 modules and five resources—MATCH.
   - All **221 session helper/resource hash records** MATCH.
   - Every entry-script and wrapper hash in commands 01–10 MATCHES its surviving file.
   - The copied session module is byte-identical to T3i’s, SHA-256 `f9b784c8de3ed13c6bada555689e7bec6283ddcf6b4d546475a54a17b242b043`.
   - All ten surviving overlay CSVs match T3i’s CSV: 368 changed-byte records, 32,758 file bytes.

   The inventory contains **140 emulator modules and three task modules**. Independent inspection of their relative-import closure and the session’s dynamic import seeds found no missing emulator module. Hash timing is marked.

   Command 10’s final `.out`, `.err` and `.exit` are explicitly excluded from the self-generated manifest and covered by the harvest audit. Its actual exit status is 0.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED.** Task identity, brief version and intended configuration agree.
   - **§2 — CONFIRMED** for configuration identity, input size/hash and retained provenance. Historical reading claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** for recorded commands and outcomes. Command 02 exited 1 on the disclosed non-JSON line; acceptance command 08 exited 0.
   - **§4 — CONFIRMED** for retained materials, addresses and dependency inventory. Historical examination is **SUPPORTED-NOT-INDEPENDENT**.
   - **§5 — CONFIRMED**, subject to the disclosed manifest-finalization exclusions.

   Findings in §6:

   - **6.1 — CONFIRMED.** There are 281 successful step records, zero recorded failures and terminal `ok:true`. Session counts agree.
   - **6.2 — CONFIRMED** for all ten face IDs, slot values, help ID and unchanged profile. **WRONG** to call “Choose the AF target area.” the chooser’s title: it is the help sentence below the options. The screenshot’s header is a glyph.
   - **6.3 — CONFIRMED.** Both candidates cancel from C4 with profile/cache 0, commit exactly 2 with glyph 650, then commit exactly 9 with glyph 9129.
   - **6.4 — CONFIRMED.** Independently compared all 150 shared candidate/control records. Their asserted title/highlight/screen fields and complete invariant snapshots agree. Profile/cache are separately checked against role-specific literals.
   - **6.5 — CONFIRMED.** Page-28 construction and every navigation key have records. Both candidate page-28 PNGs are byte-identical to the control PNG.
   - **6.6 — CONFIRMED.** Independently decoded and compared both candidates’ stores: M is 262,144 bytes and E is 196,608 bytes, with zero differing bytes against control. Both reopen records show profile/cache 0 and control-baseline cells.
   - **6.7 — CONFIRMED.** Both stock choosers show the expected priority selection, slot value 1 and help ID 4732; cancellation returns to page 27.
   - **6.8 — CONFIRMED.** `exit-1` asserts shooting state immediately, with null title/highlight and candidate profile 9.
   - **6.9 — CONFIRMED.** Overlay CSVs and the configuration/session implementation match T3i. Runtime-write identity follows from the identical session source and matching configuration flags.
   - **6.10 — CONFIRMED.** Candidate and control profile/cache literals are intentionally distinct and independently asserted.

   Remaining numbered sections:

   - **§7 — CONFIRMED** for the cited evidence, subject to the chooser-title correction.
   - **§8 — CONFIRMED** for the successful recorded checks and screenshot availability; **OVERSTATED** if “PASS” denotes complete T3j compliance. `pageTitle()` substitutes help text for chooser headers. Also, `runStoreSteps()` sets `stopped` after store failure but continues to the overlay step.
   - **§9 — CONFIRMED** for newly completed navigation/highlight/readback coverage, configuration identity and persistence evidence. **OVERSTATED** concerning complete exact-title coverage.
   - **§10 — CONFIRMED** as retained limitations. Native placement, storage and the historical crash cause remain outside what these runs establish.
   - **§11 — OVERSTATED.** The two harness corrections remain inside this prototype’s scope.
   - **§12 — CONFIRMED** for disclosed deviations, but incomplete: it omits the chooser-title substitution and store-failure continuation.

5. **Contradictions with established findings** (cite document §), or “none”.

   No contradiction with T3i decision’s functional findings, T3h’s face mapping, or the research section’s reference-only page-28 boundary.

   Complete T3j compliance conflicts with brief §2 item 1’s exact page-title requirement and item 2’s first-failure stop requirement:

   - `observe_j1.mjs:17–38` classifies chooser help sentences as headers.
   - `accept_runner_j1.mjs:245–246` continues into overlay comparison after a failed store comparison.

6. **Alternative explanations** not excluded by the evidence.

   - A chooser-header regression could pass because the asserted “title” is help text.
   - Chooser highlight identity comes from observed face-reader calls; screenshots independently support the 30 inspected states, rather than every rendered frame.
   - Snapshot and final-store equality do not exclude transient changes between observations.
   - Successful emulator runs establish neither native firmware integration nor hardware behavior, and do not explain the historical T3h access violation.

7. **Scope and safety:** No task-specific writes outside `work/`, new emulator-source changes, firmware-image construction, storage decision or hardware recommendation were found. Isolation reports zero violations.

   The normalized emulator diff hashes to the initial pinned value, `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`. Behaviour-changing overlays, runtime redirects, hooks and reference construction are labelled EMULATOR-ONLY.

   This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Correct `result.md`’s chooser-title claim and qualify complete T3j compliance. Preserve the confirmed functional acceptance.
   2. In a new immutable capture/table/runner version, distinguish chooser help from the actual header. Represent glyph-only headers explicitly and assert their expected identity; retain help as a separate assertion.
   3. Return or throw immediately after a failed store comparison, before executing the overlay step. Preserve existing scripts and records; verify the corrected failure path and refresh provenance.

   Optional improvements: fail explicitly when a non-null `controlStep` cannot be resolved, and make screenshot/capture errors fatal.