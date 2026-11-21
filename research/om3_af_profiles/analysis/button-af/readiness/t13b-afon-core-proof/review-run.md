# T13b review (Codex Sol, read-only)

1. **Verdict:** ACCEPT — **ACCEPT-RUN**.

   The staged core AF-ON proof stands. Both processes completed successfully in real mode under the required external freeze. This establishes the tested T8d and zone behavior and its reproduction across two processes. Display validation and completion criterion A remain outstanding.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, and the evidence manifest.

   Inspected the current execution, expectation, relation, capture, gate, seal, inventory, freeze and launcher implementations; both real-run evidence sets; retained test results and fingerprints; implementation-stage records; and audit evidence. Compared reused harness files with T13.

   Read the specified T13 v3 acceptance, run rejection and v4 rejection; the prior T13b code acceptance; `audit/t13-decision.md`; T13 `design_v2.md` §§0–9, particularly §§4.1–4.3; T14’s accepted review and decision; `PROJECT-STATE.md` §§2–7; and the feature specification’s revised requirements and interaction policy.

   Applied the design’s mistakes-only threat model. Verification used read-only PowerShell parsing, comparisons and hashing. No emulator or harness execution was performed.

3. **Hash verification:** Using zero-based manifest indices:

   - `inputs[0]`: **MATCH**.
   - `sources`: empty.
   - `outputs[0]` through `outputs[154]`: each **MATCH**, including byte lengths.
   - `brief_sha256` and `freeze_sha256`: **MATCH**.

   All **156 manifest file entries** match. All **463 frozen files** match their hashes and lengths. Each frozen directory has the declared file count: harness 55, emulator source 388, unpacked images 2, artifacts 1.

   External freeze digest **MATCH**:

   `03db7d9640965afbb4fa8fe39b58cb088de063f87ce63941cb0caa3d2d03ae92`

   Plan digest **MATCH**:

   `524d065cff1ebd3e268af350d60b048abccbb3631900d5d60064eb43f1545c52`

   Independently verified all **142 exit-listed child outputs**, both inventory chains (**657** and **660** entries), and all **993** recorded load/read/open/preread fingerprints against the freeze or per-run extensions. Both inventories consume every extension input, load the required real modules, and contain no fake-adapter load or prohibited entry kind.

   Identity seal **MATCH**: **2,103,975 bytes**, SHA-256:

   `9965d68dfff7c1a38398354e5e58d54c54d55705b69c4a1f1b9fa8eefabca7b3`

   All **48 reused harness files** match T13; seven versioned files are additional. All **55 test-source fingerprints** match submitted and scratch copies. Both retained test-result copies match. All **951 audit-harvested file fingerprints** match.

4. **Claim-by-claim:** Numbering follows `result.md`.

   - **Item 1 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** task, brief fingerprint, accepted-code reference, retained implementation files and emulator-only scope agree. Historical preservation is supported by audit records.
   - **Item 2 — CONFIRMED:** runtime, freeze, plan and decoded-image identities agree with the records and recomputed frozen-file hashes. “Not re-hashed” accurately describes the absence of Grok’s separate manual check; the execution machinery recorded hashes.
   - **Item 3 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** command records, process order, child exits, launcher durations, completion summaries and identity linkage agree. Identity ended before proof began. Exact shell elapsed times, absence of user-set variables and once-only invocation are supported by retained execution/audit evidence, not independently observed.
   - **Item 4 — CONFIRMED:** cited evidence files exist and support the report.
   - **Item 5 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** directory counts are **72 + 6** identity files and **70 + 6** proof files. The manifest additionally includes `result.md`. Historical creation is supported by the audit.
   - **Item 6.1 — CONFIRMED:** identity has `ok:true`, `valid:true`, `mode:"real"`, `childExit:0`, empty problems and launcher duration **166852 ms**. Shell elapsed time remains supported execution evidence.
   - **Item 6.2 — CONFIRMED:** identity completion and seal match the stated counts, reference and identity fingerprint.
   - **Item 6.3 — CONFIRMED:** identity completion lists 324 executed operations, 324 deliveries, 1096 relations, zero failures and zero reproduction; inventory problems are empty and `error` is absent.
   - **Item 6.4 — CONFIRMED:** identity log has 328 rows, 324 operation rows and 327 passing rows; both writer summaries pass. No failing or active row was found.
   - **Item 6.5 — CONFIRMED:** identity stderr is empty; all five session done records report success.
   - **Item 6.6 — CONFIRMED:** proof has the stated successful status, identity tag and launcher duration **167825 ms**. Shell elapsed time remains supported execution evidence.
   - **Item 6.7 — CONFIRMED:** proof completion reports 324/324 operations, 1096 relations, zero failures and 324 reproduced operations.
   - **Item 6.8 — CONFIRMED:** proof completion, inventory-problem list and absence of `error` agree.
   - **Item 6.9 — CONFIRMED:** proof log has 329 rows, passing identity coverage, 324 operation rows and 328 passing rows. Both writer summaries pass; no failing or active row was found.
   - **Item 6.10 — CONFIRMED:** proof stderr is empty; all five session done records report success.
   - **Item 6.11 — CONFIRMED:** independently recomputed every child-output hash and length and checked the output inventories.
   - **Item 6.12 — CONFIRMED:** both runs satisfy the brief’s validity condition.
   - **Item 7 — CONFIRMED:** evidence references support the findings with the historical-execution qualifications above.
   - **Item 8 — CONFIRMED:** both retained real runs pass.
   - **Item 9 — CONFIRMED:** real sealed reproduction is new relative to the implementation-stage fake evidence.
   - **Item 10 — CONFIRMED as limitations:** full-field reproduction is recorded by the reviewed executor; the report correctly distinguishes its summaries from an outside re-evaluation.
   - **Item 11 — CONFIRMED:** results review and a separate display stage are consistent with the authorized staging.
   - **Item 12 — SUPPORTED-NOT-INDEPENDENT:** run and audit evidence support two ordered attempts, no edits and no deviation.

   **Independent operation and relation checks:**

   Each run contains **30/36/50/81/127** operations for `k1e/k2/candidate/zk1e/zcand`. Their 1094 declared operation relations plus two writer checks account for all **1096** relations.

   All 324 operation keys and retained compact before/after states match the sealed identity; all **110 commit identities** match. Proof source maps contain all **4212 field expectations**, including **3905 preservation expectations**, without mismatch.

   Independently checked **26 press/release, zone and read-bank comparisons per run**: candidate presses equal the named K1e S1 `halfTarget`; releases restore the candidate’s named S1 record; read banks are **0/4/0**; zone `z0`–`z5` and custom press/release targets equal their zone K1e references. The sealed pose-after-edit state has all 63 slots and live half cells equal to K2; its source map retains the separate mirror and pose-watch rules. Session records independently contain exactly **3** candidate writer events and **7** zone-candidate writer events.

5. **Contradictions with established findings:** none.

   Approved staging supersedes the combined execution sequence in T13 `design_v2.md` §§5 and 7 while preserving core §§4.1–4.2 and deferring §4.3.

   T14 conclusion **(c)** remains unchanged: the reference is **K1e’s S1 half-press record**, not demonstrated byte-for-byte stock AF-ON equivalence. Shared writer code does not establish equal button-specific inputs, shadow selection or publication timing.

6. **Alternative explanations** not excluded by the evidence.

   Deterministic errors can reproduce in fields without independent behavior relations. Proof logs retain compact states rather than every raw captured field, so outside rechecking of omitted fields relies on the frozen executor and its per-operation results.

   The custom case uses matched live/reference inputs; it does not establish restoration against every distinct live profile. These sessions also do not establish display timing, complete persistence/lifecycle behavior, physical-camera behavior or successful AF acquisition.

   Completion criterion A (`PROJECT-STATE.md` §2) requires reviewed, reproducible evidence for every required behavior. This run closes the staged core reproduction gap. Corrected display instrumentation, display identity and successful display proofs remain necessary, alongside any remaining integrated feature requirements. It does not establish a genuine hardware dependency under criterion B.

7. **Scope and safety:** No files were changed during this review. No tests, launcher, freeze maker, OM-Emu, Ghidra or hardware process was run.

   Audit records report unchanged protected workspace/inputs and zero isolation violations. Frozen emulator files match the approved baseline. Reviewed evidence destinations remain under `work/`; inherited image construction is in-memory and emulator-only. No installable-image construction, hardware recommendation or unapproved emulator change was found.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections: none for acceptance of this core run.

   Optional improvements:

   1. State the K1e S1 reference and T14 conclusion (c) explicitly in the results report.
   2. Preserve full proof states in a future version if independent offline comparison of every reproduced field is desired.