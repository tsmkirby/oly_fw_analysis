# T13 review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-CODE

   All three round-4 required corrections are DONE. No new blocking defect, real-path fidelity loss, or boundary inconsistency was found in v3. The harness is ready for Grok’s six-process run-only stage, using `launch_v3.mjs`, the external digest below, and the stop-at-first-failure rule.

   This accepts the code for execution; successful real-emulator proof remains outstanding.

2. **Baseline checked:** Read `TASK.md`, `brief.md`, `review-brief.md`, `templates/review.md`, `work/result.md`, `work/design_v2.md`, `audit/previous-review.md`, the round-3 code review, and round-2 design review.

   Inspected all seven v3 modules, their differences from v2, affected test assertions, final probe records, command records, fake/capture completions, freeze, manifest, and retained superseded evidence. Checked unchanged-source fingerprints against the previously reviewed v2 submission and searched the real session/emulator sources for uses of the newly refused interfaces.

   Applied design_v2 §0’s mistakes-only threat model. Used PowerShell reads, parsing, comparisons, and hashing. No files were changed or executable harness commands run.

3. **Hash verification:** Using zero-based manifest indices:

   - `inputs[0]` through `inputs[416]`: each **MATCH**.
   - `sources[0]` through `sources[47]`: each **MATCH**.
   - `outputs[0]` through `outputs[458]`: each **MATCH**.
   - `brief_sha256`, `design_sha256`, `freeze_sha256`, and `result_sha256`: each **MATCH**.

   All **924 file entries** match, including declared byte lengths. All **456 frozen files** match. Each of the four frozen directories contains exactly its listed files.

   The freeze matches the external digest:

   `819876c49fef56ceb996bd03a9d5a589c90d51bae8ce1a2145d1447a520f4e2b`

   All 48 test-start source fingerprints match both the submitted files and retained scratch copies. Both fixture-input fingerprints match; both final test-result copies are identical. All 41 previously reviewed source files remain unchanged.

   Independently verified 24 completed-run inventory chains, 113 exit-listed output fingerprints, and both final fake identity seals. No mismatches were found.

4. **Claim-by-claim:**

   **V3 addendum:**

   - **Item 1 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** glob interfaces are refused before processing arguments. Callback `fs.realpath` is refused while native/synchronous/promise variants remain wrapped. Final probe records contain the added successful metadata entries and refusal entries. Historical callback-realpath permission denial is supported by retained `v3-try1` output; its precise internal cause was not independently reproduced.
   - **Item 2 — CONFIRMED:** `_refusals` receives a plain-directory and canonical-location check before record creation. The retained redirected-directory test passes, and its destination is empty.
   - **Item 3 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** new versioned modules, regenerated artifacts, matching final-source fingerprints, 43 passing retained tests, and six successful fake plans are present. Test execution was not independently repeated.
   - **Item 4 — CONFIRMED:** the sampling clarification accurately describes the existing settling loop and earlier subsequent edge delivery.
   - **Item 5 — CONFIRMED:** the v3 launcher and supplied digest are appropriate for the proposed real stage.

   **Round-4 required corrections:**

   1. **DONE — glob handling and missing interface probes.** `inventory_v3.mjs` refuses `glob`, `globSync`, and promise glob uniformly, covering arrays and effective-`cwd` forms without incomplete recording. `probe_v3.mjs` and the “code review 2” interface test retain successful assertions for the previously omitted metadata interfaces. Final evidence reports 47 permitted cases and 19 refused/denied cases, with corresponding inventory entries.

      Additional callback-realpath refusal is acceptable: it fails visibly, remains an inventory failure even if caught, and no use was found in the reviewed real execution sources. `fs.realpath.native` retains its original implementation behind a recording wrapper.

   2. **DONE — canonical refusal destination.** `launch_v3.mjs::refuseExisting` validates `_refusals` before writing. Test “code review v2 correction 2” exercises an existing tag with redirected `_refusals`, requires exit 2, and verifies no redirected write.

   3. **DONE — versioning and regenerated evidence.** `run_v3`, `exitcheck_v3`, `launch_v3`, and `make_freeze_v3` consistently select the new inventory and child versions; inventory-chain seeds agree. The retained final tests and six fake plans use these versions. Freeze, manifest, fingerprints, and external digest agree.

   **Carried v2 numbered claims, read with the superseding addendum:**

   - **Item 1 — CONFIRMED:** task, version separation, and emulator-only scope.
   - **Item 2 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** baseline identity is preserved; historical execution claims rely on records.
   - **Item 3 — CONFIRMED:** retained v2 work is identifiable; current execution records are v3.
   - **Item 4 — CONFIRMED with qualification:** function classification is present; classification alone does not prove every argument form.
   - **Item 5 — CONFIRMED:** current artifacts and final-source fingerprints match.
   - **Item 6 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** prior corrections remain unchanged; current fake completions retain the stated counts and `valid:false`.
   - **Item 7 — CONFIRMED:** evidence references support the corrected claims.
   - **Item 8 — SUPPORTED-NOT-INDEPENDENT:** superseded 42-test result; current retained result is 43/43.
   - **Item 9 — CONFIRMED:** earlier findings remain unchanged.
   - **Item 10 — CONFIRMED as limitations:** real determinism, compatibility, duration, and reproduction-only coverage remain unresolved.
   - **Item 11 — CONFIRMED as readiness:** proceed with the addendum’s v3 substitutions and six-process limit.
   - **Item 12 — CONFIRMED with qualification:** retained deviations are unchanged; v3 additionally refuses glob and callback realpath.

5. **Contradictions with established findings:** none newly introduced.

   The round-4 glob-inventory and refusal-containment contradictions are resolved. No change to previously reviewed payloads, roles, hooks, overlays, recorder behavior, relations, or emulator timing was introduced by v3.

6. **Alternative explanations** not excluded by the evidence.

   - Fake success does not establish real-adapter determinism or permission compatibility.
   - Reproduction-only fields can repeat a deterministic error.
   - Earlier display sampling and subsequent input delivery can affect real outcomes.
   - Retained execution records support reported runs but do not constitute independent reruns.

7. **Scope and safety:** This review made no writes and ran no Node harness, OM-Emu, Ghidra, or Java process.

   Current test scratch and evidence destinations remain under `work/`. No new installable-image construction, hardware recommendation, or unapproved emulator change was found. Inherited firmware construction remains in-memory and emulator-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections: none.

   Optional improvements: update stale v2 labels and probe comments when preparing a later version; do not edit the accepted frozen files before Grok’s run.