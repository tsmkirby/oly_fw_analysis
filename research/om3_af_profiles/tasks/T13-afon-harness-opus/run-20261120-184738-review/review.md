# T13 review (Codex Sol, read-only)

1. **Verdict:** REJECT-DESIGN

   The shared data plan, private session and independent fake are sound directions. The design does not yet close the unchanged acceptance bar: read restrictions do not supply the required execution inventory; launcher enforcement remains bypassable; behavioral relations omit accepted requirements; and the proposed restrictions conflict with the reused session implementation.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/design.md`, `work/result.md` and all five files in `work/perm-probe/` completely.

   Read the T11, T12 and T12b decisions, all six substantive Sol reviews, and the T11 brief completely. Also read the T12/T12b briefs and relevant accepted expectation, table, setup, driver, display, hook, recorder and session sources, plus emulator filesystem/NVRAM interfaces.

   No current manifest, seal, retained probe stdout or harness implementation exists. PowerShell filesystem inspection was read-only. `node26 --version` could not run because `node26` is unavailable. The probe was not repeated. No OM-Emu, Ghidra or Java was run.

3. **Hash verification:** No manifest entries were available to recompute; no MATCH/MISMATCH determination is possible.

   Independently computed these current probe-file hashes. They are unsealed fingerprints, not verification against submitted expected digests:

   - `allowed.txt`, 6 bytes: `5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03`
   - `denied.txt`, 7 bytes: `b37e50cedcd3e3f1ff64f4afc0422084ae694253cf399326868e07a35f4a45fb`
   - `dep.mjs`, 20 bytes: `48ea37336eaa8862757b25572c681c39a2ec3f856a160da9c814f31e03348574`
   - `other.mjs`, 20 bytes: `1258e558365aeb626c4764a0204510170133270be9874662b1537fa3a28c12a8`
   - `probe.mjs`, 1,325 bytes: `7ac5f5f8eebbe9ecf1a7bae8d7c75d74cb5dbb27315e9a868c1aafd6189799f9`

4. **Claim-by-claim:** `result.md` has no numbered claims.

   - **CONFIRMED:** this submission is a design and probe source, with no harness implementation in `work/`.
   - **SUPPORTED-NOT-INDEPENDENT:** reported probe outcomes and historical absence of emulator/Ghidra/Java execution. Probe stdout and command evidence were not retained.
   - **OVERSTATED:** design §0’s claim that its mechanisms close every recurring defect class.

   The following table covers every numbered required correction in the six reviews’ §8. “Closed” means addressed by the proposed design, subject to implementation review; it does not certify implementation.

   | Review / correction | Status | Assessment |
   |---|---|---|
   | T11 `222335` #1: gated full-state assertions and setup | Open | Individual delivery is specified; complete expectation rules and decomposition of reused bring-up remain unresolved. |
   | T11 `222335` #2: identity completeness and enforcement | Open | Shared enumeration helps, but explicit pre-session validation and enforcement for every display/zone/custom commit are missing. |
   | T11 `222335` #3: installed pose protection | Closed | Byte-identical accepted hook retains the native pose latch; add the previously required instrumentation-toggle test. |
   | T11 `222335` #4: early, fatal inventory and command evidence | Open | Command records are planned; permission grants do not record actual imports/reads or first-read hashes. |
   | T11 `222335` #5: recorder repair and final-version tests | Open | Accepted recorder and final imports are named; assertion categories, failure cases and integrated display testing are incompletely specified. |
   | T11 `222335` #6: authorized, successful proofs | Open | Six launches are planned; successful proofs remain future work. Historical exhausted allowances do not authorize retries. |
   | T11 `222335` #7: accurate records and refreshed seal | Closed | §§1/4 require immutable versions, qualified claims, manifest and external seal. |
   | T11 `233249` #1: exact expectations, setup, separate edges | Open | Replay alone leaves behavioral expectations incomplete; reused compound setup needs decomposition. |
   | T11 `233249` #2: dynamic identity coverage and gate classification | Open | Classification is internal, but display enforcement and preflight coverage remain ambiguous. |
   | T11 `233249` #3: inventory identity/seal and execution arguments | Open | `execArgv` is planned; dynamic identity inputs lack explicit inclusion in exit verification and actual-read inventory. |
   | T11 `233249` #4: exact final tests and recorder integration | Open | Test list omits several inherited cases and end-to-end display integration on the fake. |
   | T11 `233249` #5: authorization, release timing and completed proofs | Open | Post-input identity timing is addressed; proof completion and experiment-limit handling remain outstanding. |
   | T11 `233249` #6: narrow guarantees and refreshed records | Closed | Explicitly required by §4. |
   | T12 `002500` #1: individual setup, real frames, bypass rejection | Open | Real frames and private execution are specified; compound bring-up and wrapper compatibility remain unresolved. |
   | T12 `002500` #2: pre-delivery row check and zero deliveries | Closed | Gate ordering and counting-fake test explicitly address this; universal coverage is separately open. |
   | T12 `002500` #3: every input inventoried and early exit handling | Open | Neither first-read inventory nor launcher failure handling before validation is specified. |
   | T12 `002500` #4: assertion categories and integrated recorder test | Open | In-window samples are required; categories, actual return-hook completion and integration tests are not explicit. |
   | T12 `002500` #5: complete freeze and accurate records | Open | Proposed static superset replaces the required execution-derived freeze without closing its evidence requirement. |
   | T12 `010959` #1: remaining raw API bypasses | Closed | Removing executable runners and keeping raw capabilities private makes runner scanner rules inapplicable; trusted harness behavior still needs review. |
   | T12 `010959` #2: output-located inputs and initialization failures | Open | No location exclusion is proposed, but actual-read records, dynamic-input exit checks and early failure records remain unspecified. |
   | T12 `010959` #3: freeze through actual fake execution paths | Open | §1 lists freeze contents; it does not require all six plans to execute through the common implementation on the fake. |
   | T12 `010959` #4: shared definitions including setup/display | Closed | One plan supplies execution, coverage and identity. Require the inherited deletion test. |
   | T12 `010959` #5: corrected handoff and immutable evidence | Closed | Addressed by versioning and §4 records. |
   | T12b `015622` #1: private state, immutable descriptions, import policy | Closed | No runner callbacks or runner imports remain; plans must be validated immutable data without executable payloads. |
   | T12b `015622` #2: freeze and all read forms inventoried | Open | Permission enforcement supplies no read inventory; descriptors and other paths are unprobed. |
   | T12b `015622` #3: mandatory freeze enforcement | Open | Child arguments and a sentinel do not prove launcher validation occurred. |
   | T12b `015622` #4: restore real behavior and fake same paths | Open | Real session/hook/frame use is promised, but payloads, boundaries, settling and common fake execution are not specified sufficiently. |
   | T12b `015622` #5: regenerate execution-derived evidence | Open | Documentation/seals are planned; execution-derived freeze evidence remains absent. |
   | T12b `025921` #1: private real construction and gated access | Closed | §1 places real construction inside the private session closure and exposes no raw adapter. |
   | T12b `025921` #2: faithful behavior and independent fake | Open | Fake independence is addressed; accepted expectations and role-specific execution details remain incomplete. |
   | T12b `025921` #3: descriptor/vector/FileHandle/named imports | Open | No complete inventory or retained probes for those interfaces. |
   | T12b `025921` #4: enforcement before loading, execution derivation | Open | Environment/preload paths, direct child starts and execution-derived evidence remain unresolved. |
   | T12b `025921` #5: final-file tests and consistent records | Open | Final imports and immutable records are planned; the complete inherited test set and common-path execution are not. |

   The separately ruled-on T12 custom-mode defect also needs an explicit fake reachability test. The design names custom traversal without specifying that test.

   **Two-layer expectations (§3): conditionally acceptable in principle, incomplete as written.** A sealed identity-pass field is a single declared source for reproduction. Comparing an independent proof run with it is not inherently circular. It establishes repeatability, however, rather than correctness of the captured value. Identity mode cannot compare a value against its own newly captured value as independent validation.

   Layer 2 can establish behavior when its controls are independent, correctly isolated and matched to explicit operations. The design needs a complete per-operation/per-field source map: literal, named control snapshot, explicit preservation, or sealed observational baseline. Setup deltas must preserve every field absent from the sealed delta, as T12b requires. Absolute after-state replay alone does not enforce that rule when the proof’s before-state differs.

   **Requirements missing or ambiguous in §3.2:**

   - Accepted mirror initialization and editor-save relations, including mirror tail, mode-flag lifecycle and preservation outside declared writes.
   - Expected pose words, saved-bank selection and actual getter-read-bank checks; equality of only `0x5962[0]` after the extra pose case is narrower than the accepted full-bank requirements.
   - Size-record preservation, edge status/enabled values, both ten-byte record expectations and normal S1/control behavior from `table_v2`.
   - Explicit source fields and operation IDs for press/release relations. “Record,” “same state” and “cross-checked” do not identify a reproducible comparison.
   - Exact display routing: seeded A/B use their references on owner-2 edges and the appropriate K2 reference on other edges; controls retain their own expectations. Display owner, target and half-target rules also remain required.
   - K1 stock’s distinct owner behavior. Accepted display code uses owner `255` for stock K1; the unqualified owner `2/0` and `1/0` bullet would reject that control.
   - Exact exit-sequence matching and compared fields, retaining all accepted table mappings.
   - Recorder completeness: passthrough returns, substitutions, declared outside-refresh categories, rejection of null/unclosed/orphan/truncated records and actual in-window sampling.

   **Permission model (§§0–1): does not close both classes.** A permission allow-list can constrain ordinary path reads. It does not identify which allowed files were actually read or hash them at first read. A manifest of permitted files is a different artifact from T11/T12b’s execution inventory.

   Node’s current documentation explicitly identifies existing-descriptor bypasses, symbolic-link escapes, pre-initialization file reads, automatically permitted entry/preload files and filesystem access outside `node:fs`, such as SQLite. It also disclaims malicious-code isolation. These documented limitations require pinned-runtime verification; the available documentation is v26.13.1, not the claimed v26.12.1. [Node permission documentation](https://nodejs.org/api/permissions.html)

   The submitted probe does not test inherited descriptors, `readv`, FileHandle interfaces, streams, `require`, preloads, links/junctions or startup configuration.

   **Launcher/child bypasses and enforcement gaps:**

   - A direct child launch can supply matching arguments and a copied command record without running the parent’s checks. A sentinel proves only one denial.
   - Inherited `NODE_OPTIONS`, alternate startup configuration and preloads are not sanitized or bound to the freeze. The unrestricted launcher itself starts before its validation.
   - An unfrozen module inside an allowed directory can appear after enumeration. Rehashing listed files alone does not reject additions or transient changes.
   - The child can write throughout its tag directory, including the proposed parent command/exit records. Parent evidence needs a separate write boundary.
   - Tag containment, canonical paths, reparse points, runtime identity, inherited handles and complete environment policy are unspecified.
   - Identity output is added dynamically to the read list, but §1 does not explicitly add all its files/seals to the same before/after hash verification.

   **Concrete compatibility problems:**

   - `zone_session_k1.mjs:97,488` creates `work/out/`; its screenshots and default NVRAM paths also live directly there. These conflict with per-tag write permission.
   - That wrapper explicitly constructs `fileNvram()` at line 248. Setting `OM_EMU_NVRAM=off` does not disable that direct API. Its reads need an explicit policy; granting an unfrozen output directory for convenience would reopen the input boundary.
   - Its `bringUp()` contains three native calls plus task activation and settling (`:449` onward). Treating it as one operation repeats grouped setup unless decomposed.
   - `afon_hooks_v7.mjs:66–67` implements getter capture through `ctx.l.call`. A wrapper that throws whenever the gate is not delivering blocks the proposed before/after state capture. Hook writes during settling likewise need a trusted internal execution policy that preserves accepted behavior.

5. **Contradictions with established findings**:

   - Replacing actual-read inventory with permission grants conflicts with T11 brief §1.1/§6.4 and T12b brief §1.2.
   - Replacing execution-derived freeze evidence with a listed superset leaves T12 brief §3.5 and T12b §1.3/§3.4 unmet.
   - Unqualified owner expectations conflict with accepted stock-K1 display behavior in `display_v5.mjs`.
   - Missing mirror/bank/flag/size relations weaken the accepted generated-table expectations rather than preserving them.
   - Compound bring-up conflicts with T11 §6.1 and T12 §3.1’s individual native-mutation comparisons.

   The proposed byte-identical combined hook agrees with the accepted installed writer and pose-latch behavior.

6. **Alternative explanations** not excluded by the evidence.

   - A deterministic candidate error could be sealed and reproduced while affecting a field omitted from Layer 2.
   - Candidate and control comparisons could agree because their initialization, payloads or hooks were accidentally shared.
   - Listed files could match before and after while different bytes were consumed temporarily.
   - A child could satisfy its argument/sentinel checks without a verified launcher run.
   - Pure recorder tests could pass while real setup getters, hook writes or output paths fail under the restricted session.

7. **Scope and safety:** No reviewer files were changed. No emulator, Ghidra or Java was run. The unavailable `node26` version check did not execute.

   The inspected submission contains no image-building implementation, storage decision or hardware recommendation. It specifies `EMULATOR-ONLY` and the inherited section-7 allowance. Historical process absence and protected-tree integrity cannot be independently certified from this design submission.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Complete the expectation-source map and §3.2 relations, preserving accepted table/display semantics. Distinguish reproduction from behavioral validation; retain sealed setup-delta preservation.
   2. Specify complete pre-session identity coverage for every role and plan, including display commits, zone releases and custom traversal. Bind identity records to the frozen plan, role and operation.
   3. Retain actual execution/read inventory and execution-derived fake evidence alongside permission enforcement. Cover the named read/load paths on the pinned runtime and retain exact commands, stdout and exit results.
   4. Define a trusted launch boundary: pinned runtime, sanitized startup environment, controlled handles, canonical contained paths, immutable inputs, separate parent evidence and mandatory final verification. Reject direct-child evidence lacking a verified parent completion.
   5. Resolve session compatibility before freezing: per-tag outputs, explicit NVRAM behavior, individual bring-up mutations, and trusted capture/settling paths compatible with accepted hooks.
   6. Expand §5 to the inherited final-version tests: all six plans through the common fake-backed implementation, identity-bearing deletion, custom-mode reachability, pose instrumentation toggles, dynamic missing rows, recorder integration and initialization/abnormal-exit failures.
   7. State the six-process experiment limit, stop-on-first-failure behavior, freeze/identity seal linkage and both inherited non-blocking T9d uncertainties explicitly. Preserve all executed versions and qualify records to demonstrated guarantees.

   Optional improvements: use a distinct live profile for custom-release preservation, as previously suggested.