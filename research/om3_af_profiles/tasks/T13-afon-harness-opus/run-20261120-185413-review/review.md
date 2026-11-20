# T13 review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-DESIGN-WITH-CHANGES

   The revised architecture is acceptable under §0’s mistakes-only threat model, subject to the six required corrections in item 8. It substantially resolves the previous design’s omissions, but still contains a contradictory mirror expectation, an undefined freeze-bootstrap path, incomplete inventory guarantees, and several boundary/test omissions.

   This accepts the architectural direction conditionally. It does not accept an implementation, freeze, or emulator proof.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/design.md`, `work/design_v2.md`, `work/result.md`, `audit/previous-review.md`, and all five files in `work/perm-probe/` completely.

   Read the T11, T12 and T12b decisions, all six substantive reviews, and their briefs completely. Inspected relevant accepted table, expectation, setup, driver, display and recorder sources; T12b registrar v6, its loader and inventory helpers; session construction/bring-up paths; and the emulator NVRAM interface. Independently compared the retained T11 identity-v10 pose records.

   No current harness implementation, manifest, freeze, seal or retained probe stdout is present. Only PowerShell reads and hash calculations were performed. No tests, OM-Emu, Ghidra or Java were run. A broad research-file enumeration encountered access-denied directories under `ref/tooling/python-deps`; the task-specific sources used below were readable.

3. **Hash verification:** No current manifest entries were available to recompute.

   Recomputed byte lengths and SHA-256 for all five probe files. Each **MATCHES** the corresponding fingerprint in `audit/previous-review.md`:

   - `allowed.txt`, 6 bytes: `5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03`
   - `denied.txt`, 7 bytes: `b37e50cedcd3e3f1ff64f4afc0422084ae694253cf399326868e07a35f4a45fb`
   - `dep.mjs`, 20 bytes: `48ea37336eaa8862757b25572c681c39a2ec3f856a160da9c814f31e03348574`
   - `other.mjs`, 20 bytes: `1258e558365aeb626c4764a0204510170133270be9874662b1537fa3a28c12a8`
   - `probe.mjs`, 1,325 bytes: `7ac5f5f8eebbe9ecf1a7bae8d7c75d74cb5dbb27315e9a868c1aafd6189799f9`

   These comparisons establish that the probe files are unchanged from the previous review’s fingerprints. They do not verify the reported probe execution.

4. **Claim-by-claim:** `result.md` has no numbered claims.

   - **CONFIRMED:** this is a second-round design submission; `design_v2.md` exists, and no harness implementation is present under `work/`.
   - **CONFIRMED:** the five probe files are unchanged against the previous review’s fingerprints.
   - **SUPPORTED-NOT-INDEPENDENT:** historical absence of emulator/Ghidra/Java execution.
   - **UNSUPPORTED** as demonstrated guarantees: the proposed permission/inventory behavior and future unit-test outcomes. Those are implementation-stage obligations.
   - **OVERSTATED:** §0’s suggestion that parent hashing compensates for an unrecorded permitted read. It supplies integrity checks for listed files, not the required execution/read inventory.

   Status below means **design closure**, subject to implementation verification. “OPEN” identifies a remaining requirement, rather than treating missing implementation evidence alone as a design defect.

   | Previous T13 required correction | Status | Reason |
   |---|---|---|
   | #1: complete expectations, behavior and setup preservation | OPEN | §4 supplies the source-map scheme and preservation rule, but adds incorrect candidate/K2 mirror equality after the non-reset pose case. |
   | #2: complete identity coverage bound to plan/role/operation | CLOSED | §5 requires pre-session coverage for every commit and a second gate check before delivery. Shared definitions cover display, zone and custom operations. |
   | #3: actual inventory and execution-derived fake evidence | OPEN | Both are required now, but v6 is an incomplete starting point; denial probes do not establish successful-read recording. Capture/bootstrap remains undefined. |
   | #4: trusted launch boundary | OPEN | Runtime pinning, sanitized child environment, separate evidence and mandatory parent completion are specified. Output-tag containment and affirmative run-completion validation remain missing. |
   | #5: session compatibility | OPEN | Outputs, NVRAM and bring-up decomposition are addressed. The accepted separate `focus-arg` native operation is omitted from the stated sequence. |
   | #6: inherited final-version tests | OPEN | Most requested cases are now explicit. Unmarked-commit classification, raw-wrapper refusal and successful-read inventory assertions still need explicit coverage. |
   | #7: limits, seal linkage, uncertainties and versions | CLOSED | §§1–2 and §§7–8 specify immutable versions, freeze/plan linkage, six experiments, stop-on-failure and both T9d uncertainties. Successful proofs remain future work. |

   The following covers all corrections from the six historical reviews, including every row previously marked Open.

   | Review / correction | Status | Reason |
   |---|---|---|
   | T11 `222335` #1: gated full-state assertions/setup | OPEN | §4 is substantially complete; mirror relation and omitted setup operation require correction. |
   | T11 `222335` #2: identity completeness/enforcement | CLOSED | Shared plan, pre-session coverage and zero-delivery refusal in §5. |
   | T11 `222335` #3: installed pose protection | CLOSED | Accepted hook retained; instrumentation-toggle test specified. |
   | T11 `222335` #4: early fatal inventory/commands | OPEN | Commands are covered; complete early read/load recording remains unresolved. |
   | T11 `222335` #5: recorder/final-version tests | OPEN | Recorder semantics and integration are specified; remaining inherited negative tests are absent. |
   | T11 `222335` #6: authorized successful proofs | OPEN | New six-process limit is stated; successful sealed proofs do not yet exist. |
   | T11 `222335` #7: accurate records/refreshed seal | CLOSED | Immutable versions and qualified design-stage reporting retained; final artifacts remain implementation obligations. |
   | T11 `233249` #1: exact expectations/setup/separate edges | OPEN | Mirror contradiction and missing `focus-arg`; individual delivery otherwise carried forward. |
   | T11 `233249` #2: dynamic identities/gate classification | CLOSED | Universal commit coverage and gate refusal specified. |
   | T11 `233249` #3: identity/seal inventory/arguments | OPEN | Dynamic identity inputs are hashed, but their relationship to the frozen-read subset is inconsistent. |
   | T11 `233249` #4: final tests/recorder integration | OPEN | Integrated recorder tests specified; inherited classification/wrapper negatives still need stating. |
   | T11 `233249` #5: authorization/release timing/proofs | OPEN | Authorization limits and post-input timing addressed; successful proofs outstanding. |
   | T11 `233249` #6: narrow guarantees/refreshed records | CLOSED | Design-stage result does not claim completed proofs; immutable evidence policy retained. |
   | T12 `002500` #1: individual setup/frames/bypass rejection | OPEN | Real frames and private execution addressed; setup sequence and wrapper tests incomplete. |
   | T12 `002500` #2: pre-delivery row check | CLOSED | Explicit zero-delivery refusal and static/dynamic missing-row tests. |
   | T12 `002500` #3: all inputs/early failure handling | OPEN | Parent handlers are early; bootstrap/dynamic-input inventory and completeness validation need definition. |
   | T12 `002500` #4: getter categories/recorder integration | CLOSED | §4.3 and §6 explicitly cover categories, return hooks, in-window samples and integration. |
   | T12 `002500` #5: complete freeze/accurate records | OPEN | Execution derivation is required, but cannot bootstrap through the launcher as presently specified. |
   | T12 `010959` #1: raw API bypasses | CLOSED | Executable runners are removed and session capabilities remain private; runner scanning is inapplicable. |
   | T12 `010959` #2: output inputs/initialization failures | OPEN | No general output-path exclusion is proposed, but dynamic-input reconciliation and completion checks remain unresolved. |
   | T12 `010959` #3: freeze through fake execution | OPEN | All six paths required; explicit fake-capture bootstrap is missing. |
   | T12 `010959` #4: shared operation definitions | CLOSED | One plan supplies execution, coverage and identity; deletion test specified. |
   | T12 `010959` #5: handoff/immutable evidence | CLOSED | Version preservation and design-stage qualification retained. |
   | T12b `015622` #1: private state/immutable descriptions/import policy | CLOSED | No runner callbacks/import surface remains; validated data and private session replace that mechanism. |
   | T12b `015622` #2: all read forms/freeze inventory | OPEN | Full recording is asserted without specifying repairs to the v6 gaps or proving allowed reads are recorded. |
   | T12b `015622` #3: mandatory freeze enforcement | OPEN | Mandatory parent validation is sound; fake capture and dynamic-input policies remain undefined. |
   | T12b `015622` #4: faithful real behavior/common fake paths | OPEN | Restoration is specified substantially, but the setup omission and mirror contradiction would change accepted behavior. |
   | T12b `015622` #5: execution-derived evidence | OPEN | Generation is planned but its bootstrap is incomplete; evidence not yet produced. |
   | T12b `025921` #1: private real construction | CLOSED | No public raw-session adapter or runner callback is proposed. |
   | T12b `025921` #2: faithful behavior/independent fake | OPEN | Independent fake and real framebuffer required; setup/mirror discrepancies remain. |
   | T12b `025921` #3: descriptor/vector/handle/named reads | OPEN | §6 names permission probes, but does not require successful-read inventory evidence for each form. |
   | T12b `025921` #4: early enforcement/execution derivation | OPEN | Parent completion fixes ordinary direct-child acceptance; capture/bootstrap and early recording remain incomplete. |
   | T12b `025921` #5: final tests/consistent records | OPEN | Final tests and regenerated evidence remain obligations; explicit missing negatives and completion validation need adding. |

   **Two-layer expectations:** acceptable in principle. A sealed field supplies a single declared reproduction value; explicit zero-delta preservation adds the inherited setup protection. Behavioral comparisons must remain independently evaluated against the stated literal/control sources. Fields sourced only from the identity pass demonstrate reproducibility, not independent correctness. §4.2 acknowledges that distinction.

   The previously missing flag, mirror-tail, bank/read-bank, size, record, exit and display-routing requirements are now substantially enumerated. One new relation is wrong: §4.2 requires the candidate mirror to equal K2’s after the extra pose case. Accepted `table_v2.mjs`/`expect_v3.mjs` instead preserve role-specific mirror state. Independently inspected identity-v10 records show:

   - Candidate mirror seal remains `d2167d985aaac2b03e4f587151a481d56d7f6c5bc595da9abbabead40b934d5c`.
   - K2 mirror seal remains `aadaed00a3c5fbb8072ae7f1984ba8199fbe5272de427d11eaf31583af37db51`.
   - Their complete captured half-cell arrays are equal after the pose.

   Retain full-bank equality and role-specific mirror preservation/source rules.

   **Permission and inventory:** the combination can satisfy the mistakes-only model, but permission enforcement does not repair recording omissions. Registrar v6 explicitly excludes the freeze, drops Buffer/numeric paths, lacks descriptor/vector/FileHandle tracking, and does not synchronize named built-in exports. Those behaviors cannot be inherited as “accepted” completeness.

   Remaining read/load paths requiring explicit treatment include named `fs` imports, numeric-descriptor `readFile`, `readv`/`readvSync`, FileHandle reads/streams, Buffer/URL paths, bootstrap modules loaded before registration, and CommonJS loading through `require`/`createRequire`. Built-in non-`fs` access cannot be ruled out merely by absence of a file module from the freeze; review or forbid its use explicitly.

   The proposed parent completion requirement prevents an ordinary direct-child run from becoming valid evidence. Forging parent evidence would involve deliberate misconduct and is outside §0. Remaining accidental boundary problems are:

   - Tags are interpolated into output paths without a stated validation/containment rule.
   - Child exit zero plus matching hashes does not prove the selected plan finished. Missing or empty inventory can satisfy a subset comparison.
   - §5 generates the freeze through a launcher that already requires that freeze.
   - Nonce and identity files are added dynamically, yet §§2/5 say every read must belong to the static freeze. The freeze itself also needs an external digest rather than a self-hash entry.
   - Refusing an existing tag must not overwrite that tag’s previous successful `exit.json`.

5. **Contradictions with established findings**:

   - `design_v2.md` §4.2’s candidate/K2 mirror equality contradicts the accepted role-specific mirror rules in `table_v2.mjs` and `expect_v3.mjs`, and the retained identity-v10 pose records.
   - Its §0 fallback for unrecorded permitted reads does not meet T11 brief §1.1/§6.4 or T12b brief §1.2’s execution-inventory requirement.
   - §3 omits the separately gated `focus-arg` native call present in accepted `setup_v2.mjs:13,33`; preserving individual native setup comparisons remains required by T12 brief §3.1.
   - The mistakes-only threat model itself does not contradict a stated requirement. Malicious-code isolation is not required for this design review.

6. **Alternative explanations** not excluded by the evidence.

   - A deterministic error in a field covered only by reproduction could be sealed and repeated.
   - Permission-denial probes could pass while permitted reads remain absent from the execution inventory.
   - A child could exit zero before completing its plan, leaving partial output that passes the stated parent checks.
   - Candidate/control agreement could result from accidentally shared sessions, payloads or hook selection; implementation review must verify isolation.
   - Before/after hashes alone cannot establish which bytes an unrecorded read consumed during an intervening change.

7. **Scope and safety:** No files were changed. No executable tests, OM-Emu, Ghidra or Java were run.

   The submission remains `EMULATOR-ONLY`, carries the section-7 restriction and both non-blocking T9d uncertainties, and contains no installable-image construction, storage decision or hardware recommendation. Historical process absence cannot be independently certified from the design files.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Correct §4.2’s extra pose case: compare all live half-cell slots with K2, while preserving each role’s mirror against its declared source. Do not require candidate/K2 mirror equality.
   2. Specify complete, early read/load recording, including repairs to registrar v6. Require successful permitted-read probes to verify path, length, first-read hash and exit checking for every named interface. Denial probes and parent hashing are additional checks, not substitutes.
   3. Define an explicit fake-only capture/bootstrap mode that cannot produce a valid real proof. Separate the static freeze from a hashed per-run input extension for nonce and sealed identity inputs; inventory the freeze against an external digest. Apply one consistent policy to permission grants, recorded reads and exit verification.
   4. Validate tags and canonical output containment; keep child outputs and parent evidence disjoint. Require an affirmative final plan-completion record with expected operation coverage and complete inventory before parent `ok:true`. Refusal of an existing tag must preserve its evidence.
   5. Restore the separate accepted `focus-arg` operation, its argument flow and settling semantics alongside the five decomposed bring-up operations, lever and two focus-application calls.
   6. Add explicit final-version tests for unmarked commit classification, raw delivery-wrapper refusal, missing/truncated inventory and missing plan completion. Retain the already specified six-plan fake execution, recorder integration, deletion, reachability and instrumentation tests.

   Optional improvements: use the distinct custom-release live profile already proposed in §8, and include a compact role/session/hook-selection map to simplify implementation review.