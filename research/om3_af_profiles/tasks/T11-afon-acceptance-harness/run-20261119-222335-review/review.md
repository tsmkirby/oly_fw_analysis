# T11 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The successful identity run supports the recorded writer and zone comparisons. Acceptance remains incomplete: `proof-t11-v1.jsonl` ends `ok:false`, and display A, B, K2 and K1 did not run.

   The harness also fails several structural requirements independently of that missing proof: assertions remain outside the input gate, identity coverage is incomplete, important imports escape execution-time hashing, and the pose gate depends on runner-controlled instrumentation.

2. **Baseline checked:** Read `TASK.md`, `brief.md`, `review-brief.md`, `templates/review.md`, `work/result.md`, `work/harness.md`, manifest and seals.

   Research checked: T8d and T9d decisions and the four specified substantive Sol reviews; T8b’s generated-table decision; the specified T8d proof, writer hook, generator and checker; T9d validation library, seeded runner and reference generator; T8c’s bank/initialization decision and hook; T4’s image-section loader and end-selector evidence.

   Inspected the harness, unit tests, runners, generated table/checker report, identity table, inventories, JSONL evidence, selected screenshots and audit records. Independently recomputed hashes, reconstructed image section ranges and compared retained numerical records using PowerShell. `work/out/cmd/` is absent. Ran neither Ghidra nor OM-Emu. Changed no files.

3. **Hash verification:** Zero-based ranges below identify every file-backed manifest entry recomputed, including byte lengths:

   - `inputs[0–143]` — **MATCH**, each entry.
   - `sources[0–24]` — **MATCH**, each entry.
   - `outputs[0–478]` — **MATCH**, each entry.
   - `brief_sha256` — **MATCH**.
   - Manifest seal — **MATCH**: 147,029 bytes, SHA-256 `b1f6b1caee867124b8aea8fa2cc964c7d207fdd8facc9bde6085c4ae0900052e`.
   - Identity seal — **MATCH**: 4,682 bytes, SHA-256 `c5298796aaa5010c9f873cec7c5ee065553523a84dccdd5c562ff810612564a9`.
   - Emulator import-time inventories: all 905 file records — **MATCH**.
   - Unit inventory fixture import record — **MISMATCH**, intentionally: the test changes its fixture, and its exit report correctly records failure.
   - All 912 exit-inventory file records — **MATCH** current files.
   - Session helper/resource records: all 425 — **MATCH**.
   - State-record seals: all 1,350 target, half-target and mirror digests — **MATCH**.
   - External audit harvest: all 481 entries — **MATCH**.
   - Normalized emulator diff — **MATCH** inherited digest `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   Matching hashes do not establish inventory completeness. The acceptance import log omits `table_v1.mjs`, `check_table_v1.mjs`, `identity_v1.mjs`, `static_check_v5.mjs`, `inventory_v1.mjs` and its loader hook because registration occurs after their loading. The runner itself receives only an exit-time hash. The manifest’s input list also omits non-module inputs, including the decoded images and combined overlay, despite some being hashed separately by the inherited session wrapper.

4. **Claim-by-claim:** Numbered sections in `result.md`:

   - **§1 — CONFIRMED:** task identifier and brief version.
   - **§2 — CONFIRMED** for image/resource hashes, inherited emulator revision/diff and section-7 allowance. Historical reading activity is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** for the six recorded emulator-process versions, their order and environment. Pure-Node command execution and PASS reporting are **SUPPORTED-NOT-INDEPENDENT**; complete command output is absent.
   - **§4 — CONFIRMED** as source and hook-site identification. No new disassembly was submitted.
   - **§5 — CONFIRMED** for retained files and external manifest seal; **OVERSTATED** if interpreted as a complete execution-time inventory.
   - **§7 — CONFIRMED** for the principal evidence pointers, with the coverage qualifications below.
   - **§8 — CONFIRMED** for recorded emulator failures, identity success, proof failure and absent display runs. The unit-test PASS does not validate the final implementation: tests import `judge_v1`, `predicates_v1` and `static_check_v1`, while the final runner uses later versions. They do not exercise `createGate` or refresh recording.
   - **§9 — OVERSTATED** where identity-mode observations are described as confirmation of an acceptance proof or complete harness guarantees. Numerical comparisons are supported; sealed acceptance is incomplete.
   - **§10 — CONFIRMED** for disclosed unreached work, but incomplete concerning the structural defects below.
   - **§11 — UNSUPPORTED** as a sufficient repair plan. Four distinct K1e expectation rows are missing, including releases; adding only the two proposed down rows is insufficient.
   - **§12 — CONFIRMED** for the disclosed failed proof, skipped display work and six-process usage. It omits remaining assertion, identity, inventory and instrumentation dependencies.

   Findings under §6:

   - **6.1 — CONFIRMED as retained observations.** Identity mode ends `ok:true` with 28 rows. Independently checked three press equalities, three release equalities, normal-edit/K2 half-cell parity, the post-edit pose snapshot and all 14 zone press/release comparisons. This is **OVERSTATED** as sealed acceptance: identity mode bypasses expectation comparisons.
   - **6.2 — CONFIRMED** for three writer calls in the integrated candidate session and owner-transition self-arming without `armPress`. The separate zone session records seven additional writer calls.
   - **6.3 — CONFIRMED numerically:** custom release equals `[58,0,7,0,3,0,3,0,0,0]`. It follows direct planting of the reference values into live half-press cells, so it does not establish custom release preservation with a distinct live profile.
   - **6.4 — CONFIRMED:** proof refuses `candidate-af-down` for missing `k1e:ke-s1-down`. Independently found four missing keys: `ke-s1-down`, `ke-s1-up`, `ke-p-s1-down`, `ke-p-s1-up`, affecting six candidate commits.
   - **6.5 — CONFIRMED:** display jobs were not reached.
   - **6.6 — SUPPORTED-NOT-INDEPENDENT** as runtime causation; the retained overflow and subsequent one-time wrapping change support the account.
   - **6.7 — CONFIRMED** for the recorded failure and revised predicate; **OVERSTATED** as autonomous pose protection. `duringPose` receives `watchArmed`, which the runner controls.
   - **6.8 — CONFIRMED:** `bank()` and `initMirror()` are textually unchanged from the accepted T8c hook. Reader, writer feed and display use the shared `bank()`.
   - **6.9 — CONFIRMED:** 39 generated steps and a retained checker PASS. Independently checked all 28 declared exit-sequence matches. Checker PASS does not establish identity completeness.
   - **6.10 — CONFIRMED:** both T9d mechanism questions remain unresolved and non-blocking under its coordinator ruling.

   Additional structural defects:

   - **Input assertions:** [gate_v1.mjs](C:/Dev/OM3-tasks/T11-afon-acceptance-harness/ws/work/harness/gate_v1.mjs:16) delivers inputs without capturing or asserting state. Multiple setup setters execute before any capture. `judgeDown()` omits expected flag, owner, record contents and mirror-tail comparisons; control-role down checks return after structural checks. Zone navigation generally checks dimensions/types and Subject Detect, while zone target edges compare only consumer bytes and Subject Detect. Capturing full arrays is not asserting their values.
   - **Ungated setup:** `drive_v6.mjs` directly plants custom live cells and clears the flag outside the gate. Display seeding also writes simulator memory directly. The static scanner does not reject these bypasses.
   - **Identity coverage:** the checker verifies that an identity source step exists, but not that identity mode records it. Gate delivery itself does not require identity approval. Zone AF-ON edges lack identity checks, and custom traversal’s `tap(..., 'ok')` bypasses `commitOk`. Successful zone proof comparisons would omit the expected identity from their logs.
   - **Pose instrumentation changes behavior:** [afon_hooks_v5.mjs](C:/Dev/OM3-tasks/T11-afon-acceptance-harness/ws/work/harness/afon_hooks_v5.mjs:317) passes runner-controlled `watchArmed` into the refusal predicate. For an active-bank, non-reset live cell differing from the mirror, toggling this flag changes whether the same write is refused. The comment that watches do not change behavior is wrong.
   - **Inventory fails open:** the loader suppresses hash-recording errors. `finish()` is explicitly invoked rather than guaranteed on every exit. Pre-registration imports cannot be checked for import-to-exit drift.
   - **Display recorder is incomplete before execution:** [refresh_v1.mjs](C:/Dev/OM3-tasks/T11-afon-acceptance-harness/ws/work/harness/refresh_v1.mjs:42) copies `rec.ret` into another object; return hooks later update the original, leaving stored passthrough returns null. Display substitutions use `skip_call()` and bypass getter-entry recording. Calls beyond 500 are silently dropped. Final checks do not reject null returns or truncated/unclosed coverage.

5. **Contradictions with established findings**:

   - Incomplete edge/zone assertions conflict with T11 brief §1.2 and T8d decision, “Not accepted,” item 2.
   - Incomplete identity coverage conflicts with T11 §1.3 and T8d decision, “Not accepted,” item 3.
   - Missing execution-time coverage conflicts with T11 §1.1 and the inherited inventory requirement.
   - Runner-dependent pose refusal leaves T8d decision, “Not accepted,” item 5 incompletely resolved as installed behavior.
   - The display recorder does not satisfy T9d decision, “Coordinator ruling,” which retains every-refresh seeded getter records as required.

   Saved-bank mapping, reset initialization and the authorized overlay-backed K1e definition agree with T8c.

6. **Alternative explanations** not excluded by the evidence.

   - Values unchecked between edges or setup writes could change and later be restored without failing the harness.
   - Custom release equality may follow from planting identical live reference inputs.
   - Runner-armed watches may suppress writes that the installed pose hook would otherwise allow.
   - Identity-mode success may include commits that sealed proof mode would reject.
   - Matching final hashes cannot establish unchanged execution contents for omitted imports.
   - The unexecuted display recorder could report coverage while omitting substituted calls or retaining null returns.

7. **Scope and safety:** No reviewer writes were made. Audit reports zero isolation violations, unchanged protected workspace/inputs and no task-time emulator changes. The emulator diff matches the inherited baseline.

   Independently reconstructed all ten loaded section ranges from image descriptors and the end-selector jump table. All 3,262 combined-overlay rows have correct offsets, stock bytes and section labels: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Only `0x610bf5e3–0x610bf5e5` occupy section 7; none occupy section 6.

   Actual `0x1e71[0]` getter readbacks are present. No executed-script drift was detected in recorded import hashes, but omitted imports prevent full certification. Changes are labelled `EMULATOR-ONLY`; no installable image, storage decision or hardware recommendation was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Make the input gate enforce and retain expected full-state comparisons after every individual edge, setter, pose and zone operation. Route setup mutations through it.
   2. Validate identity-table completeness before acceptance starts, including all four missing K1e edge rows. Enforce identity approval for every required commit and retain expected/actual success records.
   3. Derive pose protection from installed behavior independently of watch instrumentation. Preserve normal edits and test non-reset pose changes.
   4. Register inventory before task imports, record failures as fatal, guarantee exit checking and include non-module inputs and command evidence.
   5. Repair refresh recording to retain returned values and substituted calls; reject truncation and incomplete windows. Test the final gate, judge, predicates, scanner and recorder.
   6. Obtain coordinator authorization before further emulator experiments; the six-process allowance is exhausted. Then complete sealed T8d acceptance and A/B/K2/K1 display proofs, each ending `ok:true`.
   7. Correct `result.md` and `harness.md` guarantees and repair instructions; preserve executed versions and refresh the manifest/seal.

   Optional improvements: use a distinct live profile for custom-release preservation, and retain full state plus explicit expectation sources in every zone record.