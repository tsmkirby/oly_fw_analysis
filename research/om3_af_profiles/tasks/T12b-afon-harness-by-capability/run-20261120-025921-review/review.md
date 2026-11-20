# T12b review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The shared operation definitions and sealed-delta mechanism remain supported. Acceptance is blocked by exposed real-session capabilities, incomplete read inventory, incomplete freeze enforcement, and failure to restore the accepted T12 execution behavior.

   This review performed read-only source inspection and hash calculations. No tests, OM-Emu, Ghidra or Java were run. No files were changed.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md` §§0–3, `templates/review.md`, `audit/previous-review.md`, `work/result.md` and `work/harness.md`.

   Research checked: the T12 decision, including “Accepted” and “Different approach”; both specified T12 Sol reviews; accepted harness copies; and the relevant `drive_v12.mjs`, `display_v5.mjs`, setup, expectation and session interfaces.

   Inspected current harness modules, unit-test source and retained records, operation definitions, six final runners, freeze generation, manifest/seals, command records and audit evidence.

3. **Hash verification:** Zero-based indices identify every manifest and freeze entry recomputed. Recorded byte lengths were also checked.

   - Manifest `inputs[0–13]` — **MATCH**, each entry.
   - Manifest `sources[1–57]`, `[59]`, `[62–90]` — **MATCH**, each entry.
   - Manifest `sources[0]` — **MISMATCH**: `harness-freeze.json`; recorded 97,122 bytes, current 97,342 bytes.
   - Manifest `sources[58]` — **MISMATCH**: `probe-identity.json`; recorded 20 bytes, current 12 bytes.
   - Manifest `sources[60]` — **MISMATCH**: `probe-promise.json`; recorded 17 bytes, current 8 bytes.
   - Manifest `sources[61]` — **MISMATCH**: `probe-stream.txt`; recorded 7 bytes, current 12 bytes.
   - Manifest `outputs[0–316]` — **MATCH**, each entry.
   - `brief_sha256` — **MATCH**.
   - Manifest external seal — **MATCH**: 129,331 bytes, SHA-256 `b131be632cd02bcca569f6281f5138d9429349aa4a989670218d61b0e6bcf361`.
   - Freeze `files[0–35]` and `checkout.files[0–387]` — **MATCH**, each entry.
   - Freeze external seal — **MATCH**: 97,342 bytes, SHA-256 `c647951ecda5c65455ce1337473e8a6e1c11ab7f26ccf2eb2c5d2d756ba49caa`.
   - Negative fixture `bad-freeze.json`, `files[0–18]` — **MATCH**, each entry.
   - Negative fixture `bad-freeze-v2.json`, `files[0–34]` and `checkout.files[0–387]` — **MATCH**, each entry; its external seal also matches.
   - Identity seals v1, v3, v4 and v5 — **MATCH**. Final v5 identity: 39,198 bytes, SHA-256 `ce859a72e611170fd41c934a9541ac6d83a576a6deb1ffc3f286442691a13709`.
   - Identity seal v2 — **MISMATCH**: it names a 39,198-byte identity record, but that path currently contains a 177-byte summary.
   - Exit inventories: 943 of 948 hashed entries — **MATCH**. Five historical entries differ: the three probe paths above and two older freeze records.
   - External audit harvest: all 319 entries — **MATCH**.
   - Six accepted hook/predicate/state/table/comparator/recorder copies, plus the previous `gate_v6.mjs` — **MATCH**, byte-for-byte.
   - Both protected binary inputs — **MATCH** against `audit/manifest-in.json`.
   - Normalized retained emulator diff — **MATCH**, digest `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   Independently reconstructed the five final capture inventories’ union: exactly the freeze’s 36 execution paths. The checkout tree contains the listed 388 files. Live Git revision verification was unavailable under the reviewer account’s ownership restriction; revision provenance is supported by retained records.

4. **Claim-by-claim:** Numbered claims in `result.md`:

   - **§1 — CONFIRMED:** task identification, brief digest and length.
   - **§2 — CONFIRMED** for source paths and retained diff; historical tool versions, reading activity and process absence are **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — SUPPORTED-NOT-INDEPENDENT:** command records and generated outputs support the reported sequence.
   - **§4 — CONFIRMED** for cited source material; historical examination is **SUPPORTED-NOT-INDEPENDENT**.
   - **§5 — OVERSTATED:** named artifacts exist, but the manifest has four stale source entries.
   - **§6.1 — CONFIRMED:** accepted copies and previous gate match.
   - **§6.2 — CONFIRMED** for final literal imports and the specifically planted syntax checks; broader capability isolation is **OVERSTATED**.
   - **§6.3 — CONFIRMED** for frozen descriptions, string identifiers and removal of the setup callback. Isolation of the entire public entry remains **OVERSTATED**.
   - **§6.4 — CONFIRMED** for the resolvable planted path and policy-specific rejection logic; execution outcome is **SUPPORTED-NOT-INDEPENDENT**.
   - **§6.5 — CONFIRMED** that `createReal` contains the named imports and is absent from `runRunner`. Its counter test targets `entry_v2.mjs`, not the final entry.
   - **§§6.6–6.8 — CONFIRMED** as contents of retained summaries; execution outcomes are **SUPPORTED-NOT-INDEPENDENT**. These counts do not establish restored T12 behavior.
   - **§6.9 — CONFIRMED** for the synthetic flag-delta demonstration; **OVERSTATED** as evidence of restored setup behavior.
   - **§6.10 — CONFIRMED** for the non-vacuous identity-bearing deletion test’s source mechanics; execution is **SUPPORTED-NOT-INDEPENDENT**.
   - **§6.11 — CONFIRMED** for the enumerated probes and final proof inventory. Universal read coverage is **OVERSTATED**.
   - **§6.12 — CONFIRMED** for matching freeze entries, logged capture exception and retained missing-entry refusal. Mandatory enforcement across all startup paths is **OVERSTATED**.
   - **§6.13 — WRONG** concerning restoration of the delivery path. The no-firmware boundary is supported.
   - **§7 — CONFIRMED** as evidence pointers, subject to the qualifications above.
   - **§8 — SUPPORTED-NOT-INDEPENDENT** for execution outcomes. The reported unit suite exercises older entry, driver, registrar and static-check versions.
   - **§9 — OVERSTATED:** several corrections are real, but the rejected defect classes remain incompletely closed.
   - **§10 — CONFIRMED** for disclosed limitations; incomplete concerning the blockers below.
   - **§11 — UNSUPPORTED** as a usable emulator handoff: `createReal` is disconnected from gated execution.
   - **§12 — WRONG:** checklist deviations remain.

   Closed checklist status:

   - **Item 1 — NOT DONE.** Fake backing state is closure-private and descriptions are frozen. However, the allowed entry exports `createReal()`, and `runWithGate({session:'real'}, ...)` returns its unrestricted adapter. That adapter exposes `runZone` and `start(drive, zoneOpts)`, forwarding the supplied callback directly to the session constructor. A runner importing only the permitted entry can therefore request a callback receiving the raw emulator context. See [entry_v5.mjs:64](/C:/Dev/OM3-tasks/T12b-afon-harness-by-capability/ws/work/harness/entry_v5.mjs:64), particularly lines 85–105. The valid-import policy test fixes the previous resolution-error ambiguity, but does not close this public-entry capability route.

   - **Item 2 — NOT DONE.** The freeze and seal are inventoried, Buffer/URL paths are normalized, and handlers precede tag validation. Read coverage remains incomplete: `wrapFs()` does not wrap `readv`/`readvSync`; `wrapHandle()` covers only `read` and `readFile`, omitting `FileHandle.readv()` and other handle read interfaces. Numeric `readFile` arguments are normalized away instead of explicitly mapped through `fdToPath`. Consequently, valid descriptor reads are not universally hashed at first read. The result also explicitly acknowledges a named-import dependency limitation. See [inventory_register_v10.mjs:177](/C:/Dev/OM3-tasks/T12b-afon-harness-by-capability/ws/work/harness/inventory_register_v10.mjs:177).

   - **Item 3 — NOT DONE.** The final freeze correctly matches five completed capture inventories and the checkout listing. Nevertheless, `RUNNER_SOURCES` is an explicit preload list: capture reads all six runner files to add their bytes, while the generator consumes only identity and four display captures. Proof execution occurs afterward. This does not meet the prescribed every-runner derivation without preloading.

     Enforcement also depends on startup environment. The loader’s `loadFreeze()` caches `null` when `T12B_RUNNER` is initially unset; setting that variable later inside `runRunner()` does not repair the cached loader policy. The retained proof supplies the variable before startup, so it does not establish enforcement for every normal runner launch. See `inventory_hook_v6.mjs:20–43` and `entry_v5.mjs:176–191`.

   - **Item 4 — DONE** for the shared-definition mechanism. Driver iteration, execution coverage and identity specifications derive from `OPERATIONS`. The deletion test now selects an identity-bearing operation. This confirms common enumeration, not preservation of operation payloads.

   - **Item 5 — DONE** for the prescribed fake demonstration. `diffState()` seals changed full comparison fields; `expectFromDelta()` preserves fields absent from that delta. The retained final identity has 145 rows and 25 setup deltas. Actual live setup remains untested, as required.

   - **Item 6 — NOT DONE.** Records exist, but documentation overstates restored behavior and the manifest contains stale source hashes. The real runner implementation remains incomplete:
     - `runRunner()` always drives the fake. The real branch returns an adapter instead of constructing the same gated session.
     - `deliver()` writes `body.expect.named` into fake memory and writes an artificial operation-derived setup flag. Passing comparisons therefore partly follow from copying expectations into observations.
     - Display `body.frame()` returns the reference expectation itself; fallback and recorder samples are `{n:1}`. The accepted T12 path sampled actual frames during settling.
     - Zone/custom setter definitions omit setter arguments and fall through to `ctx.press()`, replacing accepted `setKey` payloads.
     - Role isolation and hook selection changed: one fake session installs the combined hook for every role, including stock K1.
     - Table expectations use `expectId()` rather than the accepted `stepExpect()` mirror-overlay logic.

     See [execute_v2.mjs:109](/C:/Dev/OM3-tasks/T12b-afon-harness-by-capability/ws/work/harness/execute_v2.mjs:109), lines 138–141 and 187–188; compare accepted `drive_v12.mjs:196–238,366–405` and `display_v5.mjs:154–280`.

   Correction-round §3 status:

   - **Restored real implementation — WRONG:** imports and API calls were added, but real gated execution, independent observations, payloads and role behavior were not restored.
   - **Item 1, capabilities — NOT DONE:** frozen descriptions and policy-specific import rejection are implemented; the public real adapter still exposes unrestricted session callbacks.
   - **Item 2, inventory — NOT DONE:** requested common forms improved; complete read-interface coverage remains absent.
   - **Item 3, mandatory freeze — NOT DONE:** retained configured runs enforce it, but startup-dependent loader caching and the unrestricted real entry remain.
   - **Item 4, records — NOT DONE:** identity-bearing deletion is corrected and freeze hashes match; final-version unit coverage, faithful execution and consistent records remain incomplete. `test_harness_v5.mjs:6–16,53–60,173` targets v2 entry/driver/static checker and v7 registrar rather than final v5/v10 modules.

   **OUTSIDE-CHECKLIST:** None newly identified. These findings concern explicit checklist or preservation requirements. The inherited T9d uncertainties remain non-blocking.

5. **Contradictions with established findings**:

   - Claims of restored behavior and no deviations contradict `brief.md` §§0 and 3 and the T12 decision’s “Accepted” baseline. Byte-identical accepted modules do not preserve behavior when observations and payloads are replaced.
   - Public raw-session callback access contradicts §1 item 1 and §3 item 1.
   - Incomplete read-interface coverage contradicts §1 item 2.
   - Preloaded runner sources and startup-dependent enforcement contradict §1 item 3 and §3 item 3.
   - Stale manifest source entries contradict the complete-record claims under §1 item 6 and §3 item 4.

6. **Alternative explanations** not excluded by the evidence.

   - Comparisons pass because delivery copies expected values into fake memory.
   - Display checks pass because the observed frame is the reference frame.
   - Empty recorder problems coexist with constant samples and overly broad setup categorization.
   - Operation counts remain correct while setters execute `press()` instead of their required payloads.
   - Tests pass against older modules while final runner versions retain defects.
   - Manifest mismatches arise because the builder retains the first historical inventory entry for a path, rather than reconciling it with current bytes.

7. **Scope and safety:** No reviewer writes or tests were performed. Retained command records and inspected paths support zero OM-Emu, Ghidra or Java executions during the submitted work. Absolute absence of unrecorded historical processes cannot be independently confirmed from these records.

   Audit reports zero isolation violations, zero allowed external changes, and unchanged protected workspace/inputs. Accepted copies and protected input hashes match. No image construction, storage decision or hardware recommendation was found. Experimental files retain `EMULATOR-ONLY` labels.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Keep real-session construction private. Both real and fake runners must receive only the gated handle; remove public adapters accepting raw-context callbacks.
   2. Restore accepted payloads, role/session boundaries, hook selection, mirror expectations, actual frame capture and recorder integration. Keep fake effects inside the fake emulator API, independent of comparison expectations.
   3. Complete descriptor, vector and FileHandle read inventory. Ensure supported named imports receive the same enforcement.
   4. Make freeze enforcement active before module loading for every non-capture entry. Remove runner-source preloading and derive execution evidence through the required runner paths.
   5. Exercise final module versions on the fake, then regenerate consistent records, manifest and seals. Preserve historical records under distinct paths and qualify documentation to demonstrated guarantees.

   Optional improvements: none beyond the closed checklist.