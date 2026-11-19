# T9 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The screenshots support the recorded display mismatch, but the frame-positioning routine is misidentified, the required change validation did not execute, and the manifest is incomplete.

2. **Baseline checked:** `TASK.md`, the complete T9 brief and review brief, `work/result.md`, `work/out/display.md`, the evidence manifest, supplement and seal; listings, runners, JSONL records, screenshots, command records and isolation audit.

   Research checked: FEATURE-SPEC’s 10 November revision and interaction policy; T3j brief §0; T5 brief §§0 and 5 and handoff design; T6 brief §§0 and 5, promoted README including coordinator corrections, design, overlay CSV, Q1 profile-read/setup code and acceptance control definitions.

   Review remained read-only. Neither Ghidra nor OM-Emu was run.

3. **Hash verification:** Recomputed SHA-256 and byte lengths with PowerShell. The following zero-based ranges include every entry, with no exceptions:

   - `evidence-manifest.json`: `inputs[0]` through `[16]` — **MATCH**, including every `later_sha256`/`later_bytes` pair.
   - Its `brief_sha256`/`brief_bytes` and `sources[0]` — **MATCH**.
   - Its `outputs[0]` through `[148]` — **MATCH**.
   - Its `commands[0]` through `[15]`: every `cmd_file`, `out_file`, `err_file` and `exit_file` hash/length — **MATCH**.
   - `manifest-supplement-t9.json`: `command_17_cmd`, `outputs[0]` through `[147]`, and all four file records in `commands[0]` through `[15]` — **MATCH**.
   - `manifest-seal-t9.json`: `files[0]` through `[5]` — **MATCH**.
   - Independently checked the audit’s 158 harvested-file hashes — **MATCH**.
   - Execution-time script hashes for commands 01–18 and their wrapper hashes — **MATCH** current files. No post-execution script edit was detected.

   Matching hashes do not establish completeness. The submitted records omit consumed dependencies, command 18’s four records and coverage of the seal itself. The coordinator audit preserves the final artifacts independently.

4. **Claim-by-claim:** Claims refer to `result.md` §6.

   - **Claim 1 — CONFIRMED.** The stock shooting-screen PNG visibly contains four grey corner marks at the reported region. Its screenshot hash matches.
   - **Claim 2 — CONFIRMED.** The moved frame occupies `(356,198)` through `(420,268)`, a 65×71 union. Independent pixel inspection found 444 grey pixels with identical bounds in Small rest, S1-held and release screenshots. The stock S1 screenshots also retain the centred frame.
   - **Claim 3 — SUPPORTED-NOT-INDEPENDENT.** The recorded cells show live position 526 → 409 → 412, changes to `0x5962[0]`, unchanged index 1, unchanged ten-byte consumer record and dirty byte 1. The runner uses direct-screen keys. These are retained runtime observations, not a rerun.
   - **Claim 4 — SUPPORTED-NOT-INDEPENDENT.** The scripts and JSONL records contain actual `0x1e71[0]=0` readbacks on completed shooting snapshots and the stated focus checks. Subject Detection menu captures support Off.
   - **Claim 5 — SUPPORTED-NOT-INDEPENDENT.** The draw trace records the two 4×63 rectangles at the stated coordinates and return address. Independently checked listing bytes support the rectangle-widget call at `0x610f66da`. This shared widget does not establish the frame’s coordinate producer.
   - **Claim 6 — WRONG in routine attribution; CONFIRMED for the local reads.** The image contains `df 30 10` at `0x609eece0`, a `ret [a2,a3],0x10`, between claimed entry `0x609eec84` and the reads at `0x609eed24` onward. The next instruction sequence starts at `0x609eece3`. Thus the two listed callers of `0x609eec84` do not establish callers of the routine containing those reads.

     The local `0x88b2` getter, case-3 `0x84d1` getter and conditional position-526 assignment match the image. Independently compared all 12 listing files: 1,434 represented bytes, zero mismatches. Byte agreement does not validate function boundaries.
   - **Claim 7 — OVERSTATED.** Correct class: **INFERRED candidate coordinate source, unconfirmed call path**. Pixel movement correlates with both `0x88b2` and `0x5962[0]`; the monitored site was not hit. The function-boundary error further weakens the claimed source identification.
   - **Claim 8 — CONFIRMED as a screenshot comparison.** Independent decoding found exactly 444 changed pixels, all `31,31,31 → 11,11,11`, in the reported 66×70 union, with no other differences in the scanned band. Attribution solely to changing `0x84d1` was not isolated: the comparison spans stock and T6 sessions with additional setup changes.
   - **Claim 9 — CONFIRMED for recorded pixels; SUPPORTED-NOT-INDEPENDENT for runtime state.** Each recorded candidate edge has zero differences from candidate rest in the scanned viewfinder band. Candidate and recorded K2 PNGs match exactly at rest, AF-ON press/release, S1 press/release and S1-held AF-ON. Logs support the stated target and owner changes.

     Qualification: this K2 uses the **T5/Z5 CSV without the T6 profile-read hook**, not T9’s literal “T6 overlay with no seed.” That matches the inherited T6 control convention, but equivalence to the newly requested control was not demonstrated.
   - **Claim 10 — CONFIRMED.** Version 6 aborted while hashing a missing E143 image, before opening a session. No changed-frame edge assertion executed. The early `sim.mjs` import supports the reported model-selection explanation.

5. **Contradictions with established findings:** None found with the accepted T6 functional findings after applying its README’s “Coordinator corrections to the record.”

   The unresolved requirements contradict **completion**, which the result acknowledges: T9 brief §2 items 2 and 4 require a supported frame source and validation of the display change. The submission supplies neither completely. Its manifest also falls short of T3j brief §0 and T6 brief §5 item 5.

6. **Alternative explanations** not excluded by the evidence:

   - The frame may be updated through another path, including the observed `0x6041a202` getter caller. The proposed positioning site had no captured hit.
   - Correlated live-position cells do not distinguish which one causally drives the repaint.
   - An unchanged frame can reflect missing refresh/invalidation rather than an incorrect coordinate read.
   - The recorded Z5 control’s equality does not establish equality with an unseeded T6 configuration.
   - Nothing establishes that calling `0x609eec84` would redraw the frame. The intervening return directly undermines that proposal.

7. **Scope and safety:** No reviewer writes were made. The isolation audit reports zero violations and zero changes outside allowed outputs. Existing OM-Emu modifications are recorded in the supplied baseline; no new task modification was established.

   Independently recomputed section boundaries from the image’s table at `0x60029b28` and section-switch cases. Both consumed CSVs contain 3,262 rows: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Stock-byte comparisons pass. The only section-6/7 rows are permitted `0x610bf5e3`–`0x610bf5e5`.

   Behaviour changes and mirror/setup writes are identified as EMULATOR-ONLY. No installable image, storage decision or hardware recommendation was found. BOUNDARY was not claimed; the conditional alternative-path requirement was therefore not triggered.

8. **Required corrections** and **optional improvements**.

   Required corrections:

   1. Correct the routine attribution in `result.md` and `display.md`. Account for the return at `0x609eece0`; establish the actual function boundary and call path before proposing a redraw call.
   2. Keep the display change unvalidated. Acceptance requires frame assertions after all 12 edges, unchanged half-press presentation on S1-owned edges, and K1/K2 stock checks. The six-version limit was respected; further experiments require a newly authorized scope.
   3. Identify the recorded control explicitly as Z5 without the T6 hook. Supply the requested unseeded-T6 comparison, or obtain acceptance of this control substitution.
   4. Complete the dependency inventory, including both consumed overlay CSVs, directly imported `menu.mjs` and `sim.mjs`, transitive emulator modules and cited research inputs. Seal final outputs and command records through the last command using an external finalization step.
   5. Narrow claim 8 to the observed cross-session pixel difference unless a distinguishing trial establishes the causal setting.

   Optional improvements: replace unconditional comparison `pass:true` records with executable pixel expectations, and record complete expected/actual frame regions on each asserted edge.