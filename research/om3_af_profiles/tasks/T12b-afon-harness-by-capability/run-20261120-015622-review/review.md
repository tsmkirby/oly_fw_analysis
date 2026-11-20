# T12b review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The shared operation list and fake setup-delta checks are supported. Acceptance remains blocked by capability leakage, incomplete read inventory, optional freeze enforcement, and replacement of accepted T12 execution behavior with fake-only stubs.

   This review used only PowerShell reads and hash calculations. No tests, OM-Emu, Ghidra or Java were run. No files were changed.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md` and `work/harness.md` completely.

   Research checked: the T12 decision, including “Accepted” and “Different approach”; both specified T12 Sol reviews; accepted source copies from `run-20261120-003025/work/harness/`; and relevant prior setup, driver and display implementations.

   Inspected current harness source, unit tests and retained outputs, six runners, freeze generation, manifest/seals, command records, inventory records and audit evidence.

3. **Hash verification:** Zero-based ranges identify every entry recomputed, including recorded byte lengths:

   - Manifest `inputs[0–1]` — **MATCH**, each entry.
   - Manifest `sources[0–24]` — **MATCH**, each entry.
   - Manifest `outputs[0–86]` — **MATCH**, each entry.
   - `brief_sha256` — **MATCH**.
   - Manifest external seal — **MATCH**: 33,460 bytes, SHA-256 `24739f8c6770a4a2b14d611d2c9c0e53f22a97c4e3e0bc3e867fc4fafa244cdf`.
   - `harness-freeze.json` `files[0–19]` — **MATCH**, each entry.
   - Negative fixture `bad-freeze.json` `files[0–18]` — **MATCH**, each retained entry.
   - Identity seal — **MATCH**: 20,701 bytes, SHA-256 `4cdbe9f6a5bf551b6253da88c21934f227b679bd8a3ce1377dc6b9b1d74d9fa6`.
   - Exit inventories: all 114 file records — **MATCH**.
   - Inventory JSONL: 186 of 187 hashed file records — **MATCH**. The original-read record for `probe-changed.txt` — **MISMATCH**, as intentionally required by the changed-file test; its exit record reports the change.
   - External audit harvest: all 89 entries — **MATCH**.
   - Accepted hook, predicates, state, table, comparator and recorder — **MATCH**, byte-for-byte against the specified T12 baseline.
   - Both protected binary inputs — **MATCH** against `audit/manifest-in.json`.
   - Normalized emulator diff — **MATCH**, inherited SHA-256 `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   Independently reconstructed the union of the six capture exit inventories: exactly the freeze’s 20 paths. Hash agreement establishes listed-file integrity, not inventory completeness.

4. **Claim-by-claim:** Numbered claims in `result.md`:

   - **§1 — OVERSTATED.** Accepted files are unchanged and retained evidence supports the process restrictions. Accepted execution behavior is not preserved by the replacement runners.
   - **§2 — CONFIRMED** for baseline paths and copied hashes. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — SUPPORTED-NOT-INDEPENDENT** for execution outcomes. Retained source, command records and outputs support the described runs; none was repeated.
   - **§4 — SUPPORTED-NOT-INDEPENDENT** for historical examination and process claims.
   - **§5 — CONFIRMED.** Named artifacts exist and manifest hashes match.
   - **§6.1 — CONFIRMED** that the retained v3 output contains 79 PASS lines and no FAIL lines; actual execution is **SUPPORTED-NOT-INDEPENDENT**.
   - **§6.2 — CONFIRMED.** All six accepted copies match independently.
   - **§6.3 — OVERSTATED.** The retained planted failure does not establish capability isolation; a sanctioned callback exposes mutable fake state, and the import attempt accepts any resolution error.
   - **§6.4 — CONFIRMED** for current literal imports and driver iteration. Enforcement of the import restriction is **OVERSTATED**.
   - **§6.5 — CONFIRMED** for the named retained probes, with execution **SUPPORTED-NOT-INDEPENDENT**. Universal read coverage remains unestablished.
   - **§6.6 — CONFIRMED.** Handlers precede the tag check, and marking precedes the hashing read.
   - **§6.7 — CONFIRMED** for retained successful exits, the 20-file union and the missing-entry refusal. General mandatory enforcement is **OVERSTATED**.
   - **§6.8 — CONFIRMED** for shared execution and coverage definitions. The identity-generator deletion assertion is **OVERSTATED**: `setup-lever` has no required identity row before deletion, making that assertion vacuous.
   - **§6.9 — CONFIRMED** for source mechanics, 25 retained setup deltas, 145 identity rows and the recorded 372-operation summary. Execution outcomes are **SUPPORTED-NOT-INDEPENDENT**; these are synthetic fake operations.
   - **§6.10 — CONFIRMED** that `createReal` refuses and runners select the fake. Historical absence of unrecorded processes is **SUPPORTED-NOT-INDEPENDENT**.
   - **§7 — CONFIRMED** as evidence pointers, subject to the qualifications above.
   - **§8 — SUPPORTED-NOT-INDEPENDENT** for reported execution outcomes. Treating omitted emulator execution paths as merely the task boundary is **OVERSTATED**.
   - **§9.1 — CONFIRMED** against the T12 decision.
   - **§9.2 — OVERSTATED.** Byte preservation does not preserve behavior when the runners never install or use those modules.
   - **§9.3–9.7 — OVERSTATED** as complete replacements closing the defect classes.
   - **§9.8 — CONFIRMED** for shared list generation.
   - **§9.9 — CONFIRMED** for the prescribed changing-fake demonstration.
   - **§9.10 — CONFIRMED** for stated scope.
   - **§10 — CONFIRMED** for the disclosed fake-only freeze and inherited uncertainties; incomplete concerning the blockers below.
   - **§11 — OVERSTATED** as a sufficient handoff. Restoring actual execution behavior is required before the proposed future freeze.
   - **§12 — WRONG.** Checklist deviations remain.

   Closed checklist status:

   - **Item 1 — NOT DONE.** The session itself is closure-private, and results are copied. However, `entry_v1.mjs:43–46` calls runner-supplied `opts.setupApply(state, op)` with the mutable backing state. A caller through the allowed `runWithGate` entry can retain that reference and mutate it outside `perform()`. The handle also returns the mutable shared operation array at line 109. The static checker recognizes only selected literal import syntax and allows `node:module`; computed imports and `createRequire()` calls are not checked (`static_check_v1.mjs:8–45`). The planted runtime attempt at `test_harness_v3.mjs:419` uses a bare package specifier and treats every import error as success. It does not establish policy rejection of a valid emulator import.

   - **Item 2 — NOT DONE.** The specified probes and early tag-failure handling are supported. Nevertheless, the registrar explicitly excludes the freeze input through `outputs.add(freezeFile())` and `outputs.has(key)` (`inventory_register_v6.mjs:55,92`), although that file is read, not written by the registrar. `normalize()` silently drops Buffer paths and numeric descriptors (`:37–45`). Wrapping selected functions therefore does not inventory every valid read form. The probes exercise string paths through the default `fs` object and do not establish universal coverage.

   - **Item 3 — NOT DONE.** The freeze is correctly generated from six completed fake-run inventories, without load-only branches or a preload list. However, enforcement is optional: both freeze loaders return without checking unless `T12B_FREEZE_ENFORCE === '1'`, and `runRunner()` does not require enforcement outside an explicit capture mode (`entry_v1.mjs:149–160`). A normally launched runner can proceed with the registrar but no freeze validation. Moreover, the captured paths belong to replacement fake-only execution, not the retained T12 proof implementation.

   - **Item 4 — DONE** for the shared-definition mechanism. `OPERATIONS` feeds driver execution, coverage and identity specifications. Definitions carry the required classification fields. The retained deletion test supports coupled execution/coverage removal. This does not establish preservation of the original operation semantics.

   - **Item 5 — DONE** for the prescribed fake demonstration. `diffState()` records changed full fields; `expectFromDelta()` names their sealed values and preserves the remaining fields. The identity seal includes setup deltas. Source and retained output support passing on flag 7 and failing on flag 9. Actual live setup effects remain untested, as required by the no-emulator scope.

   - **Item 6 — NOT DONE.** Documentation, result, manifest and external seal exist, and no emulator runner execution appears in retained evidence. But the six scripts are fake-only wrappers: `runRunner()` hard-codes `session: 'fake'`, while `createReal()` only throws. `createFake().apply()` ignores every non-setup action; identity and frame are constant; idle is empty. Operations replace non-setup expectations with `hold` and set every `idleMs` to zero. The accepted hook, full state capture and recorder are never installed along these runner paths. The brief prohibited executing emulator proofs, not writing their implementation. These substitutions are not required by checklist items.

   **OUTSIDE-CHECKLIST:** None newly identified. The findings above concern the closed checklist or its explicit preservation baseline. The two inherited T9d uncertainties remain non-blocking.

5. **Contradictions with established findings**:

   - `result.md` §§1, 9.2 and 12 conflict with `brief.md` §0 and the T12 decision’s “Accepted” section. Copied source is unchanged, but accepted execution behavior is bypassed.
   - Mutable state exposure and incomplete import enforcement conflict with `brief.md` §1 item 1.
   - Excluding the freeze input and silently omitting valid path forms conflict with §1 item 2.
   - Optional enforcement and fake-only replacement paths conflict with §1 items 3 and 6.

   No byte-level contradiction was found in the accepted copies.

6. **Alternative explanations** not excluded by the evidence.

   - The planted import can fail because its bare package cannot resolve, independently of any capability restriction.
   - All 372 fake operations can pass because non-setup delivery does nothing and every identity/frame is constant.
   - Passing selected inventory probes can coexist with omitted reads through unsupported argument forms.
   - Matching freeze entries can coexist with unchecked execution when enforcement is unset.
   - Recorder unit tests can pass while no recorder is installed by any T13 runner.

7. **Scope and safety:** No reviewer writes or executable tests were performed. Retained command records and inspected entry paths support zero OM-Emu, Ghidra and Java launches. Absolute absence of unrecorded historical processes cannot be independently established from these records.

   Audit reports zero isolation violations, unchanged protected workspace/inputs and zero allowed external changes. The emulator diff matches the inherited baseline. No image construction, storage decision or hardware recommendation was found. Experimental files retain `EMULATOR-ONLY` labels.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Keep backing state private; remove runner-controlled callbacks receiving it. Expose immutable operation descriptions or validated operation identifiers. Make import enforcement cover computed/indirect loading, and demonstrate rejection using a valid planted import.
   2. Inventory every read input, including the freeze, and handle valid Buffer paths and descriptor-based reads. Extend retained probes beyond the current string/default-object cases.
   3. Require freeze enforcement for proof execution, with an explicit fake-capture exception. Refuse unchecked starts.
   4. Restore accepted T12 operation payloads, expectations, settling, state capture, hook installation and recorder integration behind the private harness entry. Write the emulator-capable runners without executing them; exercise those same paths using the fake.
   5. Regenerate execution-derived freeze evidence, documentation, manifest and seal after correction, preserving prior executed versions.

   Optional improvements: use an identity-bearing operation for the identity-generator deletion assertion, so its removal is demonstrated non-vacuously.