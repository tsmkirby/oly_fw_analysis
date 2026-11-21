# T13 review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-CODE-WITH-CHANGES

   Most corrections are implemented, and the retained evidence is internally consistent. Two gaps remain: glob arguments can escape inventory recording, and existing-tag refusal records can follow an unchecked junction. Complete item 8 before Grok’s six-process stage.

2. **Baseline checked:** Read `TASK.md`, `brief.md`, `review-brief.md`, `templates/review.md`, `work/result.md`, `work/design_v2.md`, `audit/previous-review.md`, and the round-2 design review.

   Inspected every submitted v2 module and `session_v2.diff`, shared execution/boundary modules, the freeze, manifest, retained command records, fake/capture results, and final test/probe evidence. Compared the real path with accepted T12 `drive_v12.mjs`, `display_v5.mjs`, `setup_v2.mjs`, T5 session construction, and relevant emulator NVRAM sources. Read T11 brief §§0–6 and T12b brief §§0–3.

   Used PowerShell reads, comparisons, parsing, and hashing. No files were changed. No test suite, launcher, freeze maker, OM-Emu, Ghidra, or Java was run. `node26` was unavailable through this shell’s command lookup.

3. **Hash verification:** Using zero-based manifest indices:

   - `inputs[0]` through `inputs[416]`: each **MATCH**.
   - `sources[0]` through `sources[40]`: each **MATCH**.
   - `outputs[0]` through `outputs[445]`: each **MATCH**.
   - `brief_sha256`, `design_sha256`, and `freeze_sha256`: each **MATCH**.

   All **904 file entries** match, including declared byte lengths. All **449 frozen files** match. The four frozen directories contain exactly their listed files.

   The freeze matches the external digest:

   `282fc757ba3421d950fb45e7a652e894b591b2bdfddbfe0edfdb33f371187a04`

   Independently verified twelve retained inventory chains, 56 exit-listed output fingerprints, sixteen refresh records’ window/sample/count consistency, and both retained identity seals. All 41 test-start source fingerprints match the submitted files; the two retained test-result copies are identical.

   The 26 v1 source entries remain unchanged against the superseded manifest. The six reused T12 modules are byte-identical. Applying `session_v2.diff` reconstructs `session_v2.mjs` exactly after newline normalization.

4. **Claim-by-claim:**

   - **Item 1 — CONFIRMED:** task, version separation, retained earlier submission, and emulator-only scope.
   - **Item 2 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** baseline sources are identifiable. Historical execution claims rely on retained records.
   - **Item 3 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** versioned files, commands, scratch evidence, freeze, and six fake results exist. Execution itself was not independently repeated.
   - **Item 4 — OVERSTATED:** function-name classification is present; it does not establish complete handling of every supported argument form.
   - **Item 5 — CONFIRMED:** manifest hashes, fixture inputs, final-source fingerprints, and retained artifacts check out.
   - **Item 6 — mixed:** correction status follows below. The reported six fake runs have the stated operation/relation counts, `ok:true`, and `valid:false`. Real proof with fake identity is refused before spawn.
   - **Item 7 — CONFIRMED / OVERSTATED:** evidence references resolve, but the inventory and output-containment tests establish narrower guarantees than claimed.
   - **Item 8 — SUPPORTED-NOT-INDEPENDENT:** retained stdout, JSON results, and exit record consistently report 42 passing tests. Their source fingerprints match this submission.
   - **Item 9 — CONFIRMED with qualification:** correction work and the `cp` refusal are identifiable. Class-wide closure remains incomplete.
   - **Item 10 — CONFIRMED as limitations:** real determinism, permission behavior, and duration remain unproved. Sampling now ends earlier; this also advances subsequent edge delivery.
   - **Item 11 — UNSUPPORTED as immediate readiness:** the proposed six-process order is appropriate after the remaining corrections.
   - **Item 12 — CONFIRMED with qualification:** frame preservation is restored. The retained deviations and new `cp` refusal are explicit; sampling also changes emulator timing.

   **Seven round-3 required corrections:**

   1. **DONE — display pose construction.** `real_v2.mjs` restricts `attachPose` to non-display roles. Test “code review 1” constructs all nine sessions with injected dependencies and verifies pose/hook/recorder selection. Its empty body tests construction, without exercising native delivery.

   2. **NOT DONE — complete inventory or refusal.** Nonce/freeze prereads, extension-consumption checks, additional wrappers, and retained probes are implemented. However, [inventory_v2.mjs:69](/C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/inventory_v2.mjs:69) accepts only scalar paths in `toPath`; `noteMeta` silently returns for arrays. Glob APIs accept pattern arrays, so these calls can succeed without a metadata entry. Relative glob patterns with `options.cwd` are recorded relative to the process directory instead of their effective search directory.

      The probe tests only an absolute scalar `globSync` pattern. It also omits successful assertions for several supported interfaces, including callback/promise glob, readlink variants, callback/native realpath, and asynchronous statfs variants. Function-name classification does not test their wrappers.

   3. **DONE — detailed refresh evidence.** `exec_v2.mjs` persists windows, calls/returns/substitutions, outside categories, orphans, timestamped signatures, and termination counts. `exitcheck_v2.mjs` requires the planned recorder sessions and checks retained records against output fingerprints and completion counts. “Code review 3” tests missing/truncated records and null returns.

   4. **DONE — deadline enforcement.** Real/fake settling returns actual sample times; relations reject samples beyond the bound. “Code review 4” covers late redraw, late sampling, and a 600 ms sample against a 599.6 ms bound. The gate uses the final settled frame.

   5. **DONE — independent display frame preservation.** Plant, hold, and mirror-seed relations restore frame preservation. “Code review 5” injects a setter-induced frame change and requires failure.

   6. **NOT DONE — canonical output containment.** Normal `work`, `work/out`, child, and launch directories are checked. The redirected-`work/out` test passes in retained evidence. However, [launch_v2.mjs:53](/C:/Dev/OM3-tasks/T13-afon-harness-opus/ws/work/harness/launch_v2.mjs:53) writes existing-tag refusal records into `_refusals` without checking its canonical location or rejecting a junction. A pre-existing redirected `_refusals` can receive writes outside the intended output tree. The current test does not cover this branch.

   7. **DONE — versioning and evidence housekeeping.** New filenames, unchanged v1 sources, scratch under `work/`, final-source fingerprints, fixture inputs, regenerated freeze/manifest/digest, and revised NVRAM payload retention are present. Optional adapter-load checks were adopted.

   **Fidelity and new deviations:** v2 preserves the previously reviewed payloads, roles, hooks, overlays, setup order, and non-display idle times. Removing display pose initialization restores accepted construction. Refresh persistence adds evidence without an additional emulator delivery.

   Refusing `cp`, `cpSync`, and promise `cp` is acceptable: these interfaces are unused by the reviewed real path and refusal fails visibly. The retained probe establishes refusal; it does not reproduce the earlier destination-grandparent permission observation.

   Stopping at approximately 575 ms prevents the previous deadline overshoot. This is conservative but can reject a redraw completed between that sample and the bound. It also shortens each edge’s settling interval relative to `display_v5`, changing subsequent input timing. Successful results would establish the stricter sampled condition; failures would require diagnosis.

5. **Contradictions with established findings**:

   - Glob recording gaps remain inconsistent with T12b brief §1.2 and round-3 correction 2’s complete-recording-or-refusal requirement.
   - The unchecked `_refusals` ancestor leaves round-3 correction 6 incomplete.
   - No new contradiction was found in pose selection, restored frame relations, NVRAM payload retention, or the accepted behavioral source rules.

6. **Alternative explanations** not excluded by the evidence.

   - A permitted glob query can influence execution without an accurate inventory entry.
   - A redirected refusal directory can move evidence writes outside the intended tree.
   - Fake tests do not establish real-adapter determinism or native permission compatibility.
   - Earlier edge delivery can change emulator behavior independently of frame correctness.
   - Fields covered only by sealed reproduction can repeat a deterministic error.

7. **Scope and safety:** This review made no writes and started no prohibited process.

   Retained v2 test commands use scratch under `work/`. No new image packaging, storage decision, hardware recommendation, or unapproved emulator change was found. The inherited firmware construction remains in-memory and emulator-only. The unchecked refusal directory is a remaining potential output-scope escape.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Record glob pattern arrays and effective `cwd` correctly, or refuse unsupported glob forms. Add retained successful recording assertions for every supported interface omitted by the current probe.
   2. Canonically validate `_refusals` before writing there, or emit refusal through an already validated destination. Test an existing tag with `_refusals` redirected and require no write through the redirect.
   3. Apply these changes under new versioned filenames; rerun affected tests and six fake plans, retain final-source fingerprints, and regenerate the freeze, manifest, and external digest before Grok runs.

   Optional improvements: clarify item 10.6 to describe emulator sampling and subsequent input timing; retain a concrete probe if the destination-grandparent `cp` permission claim is kept.