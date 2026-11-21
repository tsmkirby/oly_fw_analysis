# T13 review (Codex Sol, read-only)

1. **Verdict:** REJECT-CODE

   The harness is not ready for Grok’s six-process stage. The freeze and retained fake-run evidence are internally consistent, but the real adapter changes display-session behavior, discards required refresh evidence, and does not enforce the stated display deadline. Read-inventory completeness also remains unresolved.

2. **Baseline checked:** Read `TASK.md`, `brief.md`, `review-brief.md`, `templates/review.md`, `work/result.md`, `work/design_v2.md`, `audit/previous-review.md`, all 26 files in `work/harness/`, the freeze, manifest, and retained command/test/capture/fake-run records.

   Compared the implementation with accepted T12 `drive_v12.mjs`, `display_v5.mjs`, `setup_v2.mjs`, `expect_v3.mjs`, `judge_v3.mjs`, and the six reused modules; T5 `zone_session_k1.mjs`; T11 brief §§1–6 and identity-v10 records; T12b brief §1 and correction round; and relevant T9d reference, pose, NVRAM, and emulator-loading sources.

   Used PowerShell reads, hashes, parsing, and comparisons. No files were changed. No OM-Emu, Ghidra, Java, launcher, freeze maker, or test suite was run. An attempted permitted, non-writing Node probe could not start because `node26` is unavailable in this review shell.

3. **Hash verification:** Using zero-based manifest array indices:

   - `inputs[0]` through `inputs[407]`: each **MATCH**.
   - `sources[0]` through `sources[25]`: each **MATCH**, including recorded byte lengths.
   - `outputs[0]` through `outputs[152]`: each **MATCH**, including recorded byte lengths.
   - `brief_sha256`, `design_sha256`, and `freeze_sha256`: each **MATCH**.

   All **587 file entries** match. The freeze independently matches the externally supplied digest:

   `8aef677471b5a2c148521fd7654ab780bd3bc638045f1f89627c614da36b189f`

   All 434 frozen files match their lengths and hashes. The four frozen directories contain no unlisted files. Independently verified all twelve retained inventory chains and both identity-table seals.

   The six reused T12 modules are byte-identical. Applying `session_v1.diff` to the original T5 session reconstructs `session_v1.mjs` exactly after newline normalization.

4. **Claim-by-claim:**

   - **Item 1 — CONFIRMED:** implementation-stage submission, accepted conditional design, owner role split, and retained design-stage result.
   - **Item 2 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** the named baseline and reused copies are identifiable. Historical claims about which processes Opus started are supported by retained records, not independently certified.
   - **Item 3 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT:** the implementation and command records exist. Execution order, development chronology, and reported test execution remain supported by those records.
   - **Item 4 — SUPPORTED-NOT-INDEPENDENT:** inspected relevant emulator-loading sources, but did not independently reproduce the exact “58 files from twelve roots” closure calculation. This claim does not establish coverage of the harness’s own dynamic imports or unwrapped read interfaces.
   - **Item 5 — CONFIRMED / OVERSTATED:** the 26-file inventory and stated artifacts exist. “All fs read forms” is false. “Every … input” also overstates the manifest: the T11 fixture JSON/JSONL read by `fixture_t11_v1.mjs` and accepted-source files read by tests are not listed as test inputs.
   - **Item 6.1 — SUPPORTED-NOT-INDEPENDENT:** retained test output reports 80 operations, 532 relations, and zero failures. The fixture deliberately skips absent fields; this does not validate the complete current state schema.
   - **Item 6.2 — CONFIRMED:** independently inspected the T11 records. `e-ok-down` retains flag 1, `e-ok-up` clears it, and `p-menu-down` already has flag 0. The named candidate/K1e release titles differ while screen and highlight agree. These findings justify edge-specific flag handling and role-specific title reproduction.
   - **Item 6.3 — SUPPORTED-NOT-INDEPENDENT:** retained stdout, JSON results, and exit record consistently report 35/35 passing tests. They were not rerun.
   - **Item 6.4 — CONFIRMED as retained evidence:** six fake runs have the reported operation/relation counts, intact inventories, matching seals, `ok:true`, and `valid:false`. Parsed operation logs agree with completion counts and contain no failing rows. The real-mode proof using fake identity is refused before child execution.
   - **Item 6.5 — UNSUPPORTED as a general permission-model finding:** successful launcher runs support the chosen mount-resolution approach. They do not independently establish the claimed necessity of whole-junction grants without that hook. The distinguishing scratch probes were not retained, and the retained read-form probe grants its test directory rather than testing the stated junction/per-file distinction.
   - **Item 6.6 — SUPPORTED-NOT-INDEPENDENT:** the reported Windows command-line overflow motivates directory grants. Current grants cover fully enumerated frozen directories.
   - **Item 6.7 — CONFIRMED / OVERSTATED:** reused hashes and session derivation check out. Module-load success does not validate `driveSession`; the unreported display pose initialization demonstrates that limitation.
   - **Item 7 — OVERSTATED:** most references point to relevant evidence. The correction-2 test does not establish the junction claims or coverage of every read interface.
   - **Item 8 — OVERSTATED:** tests cover many advertised negative cases, but several required guarantees remain untested or incompletely tested. Correction status follows below.
   - **Item 9 — CONFIRMED with qualification:** the flag/title observations are supported. Claims that they establish complete table fidelity or launch-boundary correctness are too broad.
   - **Item 10 — CONFIRMED as limitations:** reproduction-only fields establish repeatability, not independent correctness. Real determinism, permission behavior, and duration remain unknown. The explicitly named press reference preserves the stock-AF-ON uncertainty.
   - **Item 11 — UNSUPPORTED as readiness:** the six-process order is appropriate after correction and acceptance. It must not start on this version.
   - **Item 12 — mixed:** see the fidelity/deviation assessment below.

   **Round-2 required corrections:**

   1. **DONE — pose-after-edit:** `relations_v1.mjs` compares all live cells and slots with K2 while retaining the candidate’s declared mirror source. The “correction 1” fixture test changes a non-bank cell and requires failure. Independently confirmed the historical role-specific mirror difference.
   2. **NOT DONE — complete early inventory:** descriptor/open tracking, named exports, streams, and module hooks improve coverage substantially. However, `fs.openAsBlob`, asynchronous metadata/listing APIs, and promise metadata/listing APIs remain unwrapped. The nonce is read before installation. The positive probe exercises only selected interfaces.
   3. **NOT DONE — unified input policy:** fake-only capture, external digest enforcement, and hashed identity extensions are implemented and tested. However, the freeze has no execution-inventory entry, and the nonce is absent from the child inventory despite being consumed. The retained successful fake identity inventory demonstrates that omission.
   4. **DONE for the listed checks:** tag validation, separate child/parent directories, preservation of existing evidence, inventory termination, and affirmative operation completion are implemented. Relevant tests cover missing/truncated inventory, short/missing completion, existing tags, and abnormal exit. Canonical containment still needs the qualification described below.
   5. **DONE — setup sequence:** five decomposed bring-up operations, lever, separate `focus-arg`, and both focus applications are present. Argument flow and 400/300 ms settling match `setup_v2`. The setup test checks enumeration/order; actual native argument flow was verified by inspection.
   6. **DONE for the explicitly requested test cases:** unmarked commit classification, raw-wrapper refusal, missing/truncated inventory, and missing completion tests exist. This does not establish complete design-§6 coverage or real-adapter fidelity.

   **Real-path fidelity and deviations:**

   - T8d/zone payloads, setter pairs, key-edge order, overlays, role selection, and nominal idle times substantially follow `drive_v12`. Hook selection remains candidate-only for these roles.
   - Decomposed bring-up adds state/getter observations between native calls. This is the requested decomposition, but its emulator effect remains untested.
   - Replacing conditional pose relinking with a failing read-back check is disclosed and fail-closed; it can reject a run the old driver would repair.
   - **Unreported behavior change:** `real_v1.mjs:103` calls `attachPose(ctx.l)` for every display session, including stock K1. `display_v5` does not. `attachPose` installs accelerometer hooks and invokes native ACC and PER_ROTATE initialization outside the plan. The fake and load-only tests do not exercise this.
   - The session’s NVRAM replacement starts blank as designed, but its save methods retain metadata only and discard the supplied data. The claim that saves are kept in memory is inaccurate.
   - Recorder phases/categories broadly follow `display_v5`, with additional assertion categorization. However, detailed windows, getter records, substitutions, sample times, and signatures are discarded; only aggregate counts survive.
   - **Deviation 12.1:** acceptable with the stated limitation. Cross-role screen/highlight relations remain independent; each role’s title is reproduced separately.
   - **Deviation 12.2:** not justified by current evidence. Removing independent frame preservation from plant/hold/seed operations permits a deterministic frame error to be sealed and repeated. “Could redraw” is not evidence establishing a replacement expectation.
   - **Deviations 12.3–12.7:** generally reasonable, subject to the inventory and recorder defects above. Directory grants remain bounded by complete enumeration and before/after hashing.
   - **Deviation 12.8:** consistent with the accepted two-layer scheme, provided setup reproduction is not described as independently proving setup correctness.

   The table relations substantially retain flag, mirror, half-cell, size, owner, edge, press/release, read-bank, and pose rules. Display routing and owner/target selection follow the accepted references. Static `matchExit` sequence checking remains present. The behavioral layer is not generally circular; the weakened display-frame checks are a specific loss of independent coverage.

   **Boundary assessment:** ordinary missing completion, partial execution, wrong identity mode, or direct unrestricted-child invocation cannot produce an accepted launcher result through the reviewed normal path. Capture and fake modes remain invalid for real proof. Deliberate evidence forgery is outside §0.

   Nevertheless, a successful result can omit required consumed-input records and detailed refresh evidence. It can also accept a frame first matching after the declared deadline: `settleWindow` advances by 25 ms until it crosses a bound of **599.60794 ms**, then judges the final sample without checking its timestamp. The nominal last sample can be at 600 ms.

   Output containment is lexical. `outPaths` does not verify that existing `work/out` ancestors resolve inside the intended workspace. A pre-existing junction can redirect both evidence and write grants. No malicious code is needed for that configuration mistake.

5. **Contradictions with established findings**:

   - Incomplete recording contradicts T11 brief §1.1/§6.4, T12b brief §1.2, and round-2 corrections 2–3. Permission enforcement and parent hashing do not replace execution inventory.
   - Discarding every-refresh records contradicts T11 brief §1.4, §3.2, and §6.6.
   - Unconditional display pose initialization contradicts the accepted `display_v5` construction and design_v2 §2/§3 fidelity commitments.
   - Removing display frame preservation weakens design_v2 §4.2’s unchanged behavioral port.
   - Deadline overshoot does not establish design_v2 §4.2’s bounded redraw requirement.

   The flag-edge adjustment and role-specific release-title finding are supported corrections, not contradictions to preserve.

6. **Alternative explanations** not excluded by the evidence.

   - A deterministic display-frame regression can pass identity and reproduction after independent preservation checks are removed.
   - Additional pose initialization can change display behavior while all fake tests still pass.
   - Allowed reads can remain unrecorded through uncovered interfaces.
   - Aggregate recorder counts can appear valid without retained evidence sufficient to inspect individual returns, categories, windows, or samples.
   - A frame matching only after the deadline can pass the current final-sample comparison.
   - Retained test summaries do not independently bind the external scratch workspace’s tested bytes to every final submitted source.

7. **Scope and safety:** This review made no writes and started no emulator or analysis process.

   The submission remains EMULATOR-ONLY. No installable-image packaging, storage decision, or hardware recommendation was found. Session firmware patching remains the inherited in-memory emulator construction.

   The retained `test.cmd.txt` targets a user-profile temporary scratch directory outside `work/`. `test_v1.mjs` creates, copies, writes, and removes files there. This is an explicit output-scope departure from the workspace instructions, and those detailed scratch artifacts are not retained here.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Restrict pose installation/native initialization to roles that use the accepted pose path. Add a non-emulator test of real-adapter construction proving display roles, especially stock K1, receive no added pose hooks or native calls.
   2. Complete read/load recording or explicitly refuse uncovered interfaces. Record the consumed bootstrap nonce and freeze input against their declared hashes. Add distinct successful-read assertions for every supported interface, including metadata/listing variants, and retain probe evidence.
   3. Persist detailed refresh windows, getter returns/substitutions, outside categories, and timestamped frame samples. Require their presence and completeness before launcher acceptance.
   4. Enforce redraw deadlines using actual sample timestamps and samples taken no later than the declared bound. Add a test where the expected frame appears just after the deadline and must fail.
   5. Restore independent display plant/hold/seed frame checks, or supply an explicit, independently justified replacement relation. Reproduction alone is insufficient.
   6. Verify canonical output ancestors before creating outputs or granting writes. Test refusal of a redirected `work/out`.
   7. Make corrections under new versioned filenames; rerun applicable pure-Node tests and six fake plans; regenerate the freeze, manifest, and external digest. Keep test scratch outputs under `work/`, retain tested-source fingerprints and missing fixture inputs, and correct the inventory/NVRAM/readiness claims before another code review.

   Optional improvements: require mode-specific real/fake adapter loads in exit verification, and retain actual NVRAM save payloads if describing the adapter as an in-memory store.