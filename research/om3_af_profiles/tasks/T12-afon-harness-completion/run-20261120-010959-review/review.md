# T12 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The correction resolves pre-delivery identity refusal, splits setup, repairs recorder tests and binds the custom-zone mode writer. Acceptance remains blocked by incomplete scanner coverage, excluded execution inputs, and incomplete compliance with the required freeze and coverage-generation methods.

   This review performed only PowerShell reads and hash calculations. No tests, OM-Emu, Ghidra or Java were run. No files were changed.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `audit/previous-review.md`, `work/result.md` and `work/harness.md` completely.

   Research checked: the T11 decision, both specified T11 reviews, T11 brief §1.2 and correction requirements, accepted harness copies, identity-v10 records and seal, and relevant session/emulator APIs as source.

   Inspected the final harness, unit-test sources and retained outputs, T13 runners, freeze generator, manifest/seal, inventory records, command records and audit. Independently compared all 279 declared operation states and the setup state with their T11 source records; all matched.

3. **Hash verification:** Zero-based ranges identify every manifest and freeze entry recomputed, including byte lengths:

   - Manifest `inputs[0–154]` — **MATCH**, each entry.
   - Manifest `sources[0–31]` — **MATCH**, each entry.
   - Manifest `outputs[0–129]` — **MATCH**, each entry.
   - `brief_sha256` — **MATCH**.
   - Manifest seal — **MATCH**: 79,202 bytes, SHA-256 `0e99e5060d884cfb92d29d62a0f971caf45328e86faf32dc6f5cbdf4503fa6f9`.
   - Freeze `files[0–176]` — **MATCH**, each entry.
   - Inventory JSONL records: all 2,042 file records — **MATCH**.
   - Exit inventories: all 2,041 file records — **MATCH**.
   - External audit harvest: all 132 entries — **MATCH**.
   - Inherited identity-v10 seal — **MATCH**, SHA-256 `1865a575c63ee414f387a16d2db586653f6324e967f1a790c87e6a23a48dc24d`.
   - Accepted hook, predicates, state and table copies — **MATCH**, byte-for-byte against T11.
   - Normalized emulator diff — **MATCH** inherited digest `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   Matching hashes establish integrity of listed files, not completeness of inventory or coverage.

4. **Claim-by-claim:** Numbered claims in `result.md`:

   - **§1 — CONFIRMED:** task and correction-round identification.
   - **§2 — CONFIRMED** for baseline copies and retained source/command evidence. Historical process absence is **SUPPORTED-NOT-INDEPENDENT**; the audit is not a complete process trace.
   - **§3 — CONFIRMED** for implementation and retained records. Reported execution outcomes are **SUPPORTED-NOT-INDEPENDENT**.
   - **§4 — CONFIRMED** for the cited source files and source-only scope.
   - **§5 — CONFIRMED:** named files, manifest and freeze exist.
   - **§6.1 — CONFIRMED:** presence checking precedes delivery; counting-fake tests cover zero deliveries for missing expectations/rows and one for a present row.
   - **§6.2 — CONFIRMED:** setup comprises five gated operations, with the stated expectations and argument flow.
   - **§6.3 — CONFIRMED** for the named planted forms; **OVERSTATED** as closure of the scanner requirement.
   - **§6.4 — CONFIRMED** for return-hook completion, open-window sampling and the retained stock-K1 fake integration test. This establishes the tested fake path.
   - **§6.5 — CONFIRMED:** `bindSession()` binds the mode writer, and the retained fake test reaches it.
   - **§6.6 — CONFIRMED** for the enumerated coverage checks; **OVERSTATED** as generation from actual operation definitions.
   - **§6.7 — CONFIRMED** for the retained probe outcomes and command arguments; **OVERSTATED** as complete execution-input inventory.
   - **§6.8 — CONFIRMED:** accepted behavior remains byte-identical.
   - **§6.9 — CONFIRMED:** freeze contains 177 matching files, including 140 checkout files and five research modules; proof paths were not entered.
   - **§6.10 — CONFIRMED** as a disclosed limitation of stable fake-state tests.
   - **§7 — CONFIRMED** as evidence pointers, subject to the qualifications above.
   - **§8 — SUPPORTED-NOT-INDEPENDENT** for execution outcomes. Source and retained outputs support the stated failures and follow-up results.
   - **§9 — OVERSTATED:** several repairs are real, but inventory, scanner and operation-definition requirements remain incomplete.
   - **§10 — CONFIRMED** for disclosed limitations; incomplete concerning the blockers below.
   - **§11 — UNSUPPORTED** as an immediately usable frozen handoff: proof sessions will fail their required identity-input exit check.
   - **§12 — WRONG:** closed-checklist deviations remain.

   Closed checklist §1 status:

   - **Item 1 — NOT DONE.** Full-value comparisons, separate setup operations and display frame callbacks are implemented. Scanner completeness remains false. `static_check_v9.mjs` has no rules for reachable `ctx.s.inject(...)`, `ctx.s.g4_set(...)` or `ctx.s.set(...)`; these APIs deliver native inputs/setters in `om-emu/emu/src/lab/play.mjs:1782–1804`. An aliased write such as `const sim = ctx.l.sim; sim.write(...)` also escapes its `.sim.write` pattern. Independently applying the scanner’s patterns in PowerShell produced zero matches for these examples. None has a planted test.

   - **Item 2 — DONE** for the existing enumerated operations. Static, zone, custom and display identities are included; proof preparation checks coverage; the gate classifies commits itself and checks row presence before delivery. Release identity is captured after settle, and success retains expected/actual. The coordinator’s stronger generation requirement remains incomplete below.

   - **Item 3 — NOT DONE.** `inventory_v4.mjs:63` excludes every path containing `/work/out/`. This excludes the T13 identity JSON/seal, the T8 overlay and T9d reference JSON inputs. The retained inputs probe confirms the omission: its exit inventory includes the T6 overlay and firmware/resource blocks, but omits those listed overlay/reference inputs. Proof preparation sets `T12_REQUIRE_INPUTS=1`; consequently, even successfully read identity JSON/seal files will be reported as `unread` at exit. The registrar also checks for a missing tag before installing handlers, leaving that initialization failure outside its exit check.

   - **Item 4 — DONE** for the specified minimum tests across retained v5/v6 evidence. They import the final gate, comparator, scanner, judge, predicates, recorder, inventory and coverage modules. Tests cover comparison failures, missing rows, unmarked commits, watch toggles, return-hook completion, substitutions, getter categories and in-window samples. V6 tests the final display module on a fake. These tests do not establish the broader scanner/inventory guarantees that fail above.

   - **Item 5 — NOT DONE in full.** Documentation, runners, manifest and seal exist, and all 177 freeze entries match. However, the required derivation through runners operating on a fake emulator was replaced with `T12_LOAD_ONLY` branches returning before `runZone`, plus the manually selected `CHECKOUT_MODULES` preload list. This improves import coverage but does not provide the prescribed proof-path derivation.

   Correction-round §3 status:

   - **Item 1 — NOT DONE:** setup splitting and display frame wiring are present; remaining reachable scanner bypasses lack rejection and planted tests.
   - **Item 2 — DONE:** missing sealed rows are checked before delivery, with counting-fake evidence.
   - **Item 3 — NOT DONE:** backing-block reads are covered, but identity/overlay/reference exclusions remain; initialization coverage is not universal.
   - **Item 4 — DONE:** explicit assertion category, actual return-hook completion, open-window sample callback and final-display fake integration are demonstrated.
   - **Item 5 — NOT DONE:** matching freeze and narrower documentation exist, but freeze derivation bypasses the required fake execution path.
   - **Coordinator ruling — NOT DONE in full:** the mode binding and reachability test are **DONE**. Coverage generation is **NOT DONE**. `identity_v4.mjs` separately enumerates zone IDs, display jobs and a hard-coded edge count. `ops_v1.mjs` separately reconstructs operation IDs; its pair names and display-job constants are not the driver’s operation definitions. Setup/display operations are absent from `declaredOperationIds()`. Removing keys from this independently enumerated plan proves enforcement of that plan, not agreement with actual operations.

   **OUTSIDE-CHECKLIST:** None newly identified. The previously reported mode-binding defect is fixed and now falls under the coordinator’s explicit ruling.

5. **Contradictions with established findings**:

   - Reachable scanner bypasses conflict with T12 brief §1 item 1 and §3 item 1.
   - Excluded identity, overlay and reference inputs conflict with T12 §1 item 3 and §3 item 3.
   - Load-only preloading instead of fake-runner derivation conflicts with T12 §3 item 5.
   - Independent operation enumerations conflict with the §3 coordinator ruling.

   No contradiction was found with accepted `bank()`, `initMirror()`, writer self-arming, pose latch or display substitution. Their containing hook remains byte-identical. Both T9d mechanism uncertainties remain non-blocking.

6. **Alternative explanations** not excluded by the evidence.

   - The scanner can pass while a runner delivers an ungated native input or aliased memory write.
   - Passing inventory probes can coexist with omitted inputs because the probe tests only selected retained paths.
   - Passing load-only imports can coexist with dependencies introduced only along session execution paths.
   - Stable fake setup/frame data can pass preservation checks that a live session cannot satisfy.
   - Agreement between reconstructed ID lists can persist while actual operation definitions diverge.

7. **Scope and safety:** No reviewer writes or executable tests were performed. Retained command records and source paths support zero OM-Emu sessions, Ghidra launches or Java launches; absolute absence of unrecorded historical processes cannot be independently established.

   Audit reports zero isolation violations, unchanged protected workspace/inputs and zero allowed external changes. The emulator diff matches its inherited baseline. No native image construction, storage decision or hardware recommendation was found. Experimental behavior retains `EMULATOR-ONLY` labels.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Reject and plant tests for remaining reachable input/write APIs, including `s.inject`, `s.g4_set`, `s.set` and aliased simulator writes.
   2. Inventory identity JSON/seal, overlays and references when read, regardless of their `work/out/` location. Verify their exit comparison and cover initialization failures before tag validation.
   3. Derive the freeze through the actual runner/session paths using a fake emulator under inventory, as §3 requires.
   4. Generate operation IDs and identity coverage from definitions shared with the drivers, including setup/display operations.
   5. Update the handoff claims and regenerate the manifest/seal after corrections, preserving executed versions.

   Optional improvements: none required beyond the closed checklist and coordinator ruling.