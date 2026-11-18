# T3c review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The correction establishes a distinguishing dispatch branch and supports reporting R1 as BLOCKED. E2 and acceptance were correctly skipped. However, the required immediate pre/post-OK snapshots remain incomplete, the first divergence inside the dispatch chain is unresolved, and one file-specific labelling erratum is wrong.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md` including §7, `audit/previous-review.md`, updated `work/result.md`, the manifest, Phase A report, design, complete overlay CSV, correction scripts, new JSONL logs, all eleven correction screenshots, command records and audit files.

   Research checked: T3a `decision.md`, both Sol reviews, brief §§4/7, `design.md` and `design-v12.md`; `AFON-MENU-RESEARCH.md` §6; `PROJECT-STATE.md` §§1–3; relevant dispatch, viewer, getter, setter and store decompilations; `HARDWARE-STAGE0-RECORD.md` section-placement findings.

   Independently inspected input bytes, listing bytes, overlay placement and hashes using PowerShell. Did not run Ghidra, OM-Emu or Python, or write files.

3. **Hash verification:** All **249 manifest file entries MATCH**: two inputs, 21 sources and 226 outputs. All **226 recorded output sizes MATCH**. The separate `brief_sha256` field also MATCHES.

   Each entry represented below was individually recomputed. Ranges are inclusive; grouped extensions identify separate entries.

   - **MATCH — inputs:** `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - **MATCH — sources:** `brief.md`; `TASK.md`; `templates/result.md`; `audit/previous-review.md`; `ref/tasks/T3a-afon-zone-row/decision.md`; `ref/tasks/T3a-afon-zone-row/brief.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`.
   - **MATCH — sources under `ref/analysis/decompiled-main/functions/`:** `611c7785.c`, `611c7894.c`, `61204065.c`, `61203816.c`, `61203082.c`, `6120308d.c`, `6119a2be.c`, `61283b1c.c`, `610cdebf.c`, `610cdf05.c`, `6041937f.c`, `60063431.c`, `611f703b.c`, `611f6e4b.c`.
   - **MATCH — under `work/out/cmd/`, both `.out` and `.err` for every stem:** `04-trace`, `05-callers`, `06-decision`, `07-kind`, `08-page28`, `09-ghidra`, `10-ghidra-tail`, `11-slot`, `12-page28`, `13-page29`, `14-slot`, `15-proto-v1`, `16-callers`, `17-act`, `18-open`, `19-ghidra-caller`, `20-slots`, `21-build`, `22-refresh`, `23-make-v2`, `24-proto-v2`, `25-copy-png`, `26-link`, `27-who`, `28-make-v3`, `29-proto-v3`, `30-make-v4`, `31-proto-v4`, `32-manifest`, `33-node-version`.
   - **MATCH — under `work/out/cmd/`, `.cmd.txt`, `.out`, `.err` and `.exit` for every stem:** `40-static-c1`, `41-ghidra-c1`, `42-e1-c1`, `43-node-c1`, `44-e1-c1`, `45-e3-c1`, `46-e4-c1`, `47-method-c1`, `48-method-static-c1`, `49-manifest-c1`, `50-manifest-c1`.
   - **MATCH:** `work/out/cmd/51-manifest-c1.cmd.txt`; `work/out/cmd/node-check.out`.
   - **MATCH — under `work/out/`:** `design.md`, `phaseA.md`, `overlay-changed-bytes.csv`; `disasm-activate-a3.txt`, `disasm-activate-tail-a3.txt`, `disasm-kind-a3.txt`, `disasm-ok-dispatch-c1.txt`, `disasm-refresh-caller-a4.txt`; `ghidra-activate-tail-a3.log`, `ghidra-decision-a3.log`, `ghidra-ok-dispatch-c1.log`, `ghidra-refresh-caller-a4.log`.
   - **MATCH — under `work/out/`:** `static-callers-a3.txt`, `static-callers-a4.txt`, `static-dispatch-a2.txt`, `static-method-c1.txt`, `static-refresh-a6.txt`, `static-route-a1.json`, `static-route-a1.txt`, `static-rows-c1.txt`.
   - **MATCH — under `work/out/`:** `exp-e1-c1.jsonl`, `exp-e3-c1.jsonl`, `exp-e4-c1.jsonl`; `exp-e1-c1-{2154,2155,base,open,page}.png`; `exp-e3-c1-{2154,caf,open,page}.png`; `exp-e4-c1-{open,page}.png`.
   - **MATCH — under `work/out/`:** `page28-a2.jsonl`, `page28-a3.jsonl`, `page29-a3.jsonl`, and each corresponding `-open.png` and `-ok.png`.
   - **MATCH — under `work/out/`:** `proto-r1-v1.jsonl` through `proto-r1-v4.jsonl`; `proto-r1-v1-page.png` through `proto-r1-v4-page.png`; `proto-r1-v1-open.png` through `proto-r1-v4-open.png`.
   - **MATCH — under `work/out/`:** `trace-a1.jsonl`, `trace-act-a6.jsonl`, `trace-build-a8.jsonl`, `trace-decision-a2.jsonl`, `trace-kind-a3.jsonl`, `trace-method-c1.jsonl`, `trace-open-a7.jsonl`, `trace-slot-a4.jsonl`, `trace-slot-a5.jsonl`, `trace-who-a10.jsonl`, `link-diag-a9.jsonl`.
   - **MATCH — under `work/out/`:** `trace-a1-{2154,2155,3d6f,page}.png`; `trace-a2-{2154,2155,3d6f,caf,page}.png`; `trace-a3-{2154,2155,3d6f}.png`; `trace-a4-caf.png`; `trace-a5-{2154,2155,3d6f}.png`.
   - **MATCH:** `work/result.md`.
   - **MATCH — under `work/scripts/`:** `copy_v2_png.py`, `DisasmRangesA3.java`; `exp_e1_c1.mjs`, `exp_e3_c1.mjs`, `exp_e4_c1.mjs`, `link_diag_a9.mjs`; `make_proto_v2.py`, `make_proto_v3.py`, `make_proto_v4.py`; `proto_r1_v1.mjs` through `proto_r1_v4.mjs`.
   - **MATCH — under `work/scripts/`:** `route_act_a6.mjs`, `route_build_a8.mjs`, `route_decision_a2.mjs`, `route_kind_a3.mjs`, `route_method_c1.mjs`, `route_open_a7.mjs`, `route_page_a2.mjs`, `route_page_a3.mjs`, `route_slot_a4.mjs`, `route_slot_a5.mjs`, `route_trace_a1.mjs`, `route_who_a10.mjs`.
   - **MATCH — under `work/scripts/`:** `run_logged.mjs`, `run_logged_a1.py`, `static_callers_a3.py`, `static_callers_a4.py`, `static_dispatch_a2.py`, `static_method_c1.py`, `static_refresh_a6.py`, `static_route_a1.py`, `static_rows_c1.py`, `static_slots_a5.py`, `write_manifest_a11.py`, `write_manifest_c1.py`.

   Additional audit checks: all **230 harvested-file hashes MATCH**. The normalized emulator diff MATCHES the initial pin `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   The final wrapper’s `51-manifest-c1.out`, `.err` and `.exit` exist but are outside the manifest, as disclosed: they were produced after the manifest was saved.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED.** Task identity and correction brief match.
   - **§2 — CONFIRMED for baseline content; SUPPORTED-NOT-INDEPENDENT for historical execution.** The emulator audit matches its existing pin. Earlier missing exits are disclosed rather than reconstructed.
   - **§3 — SUPPORTED-NOT-INDEPENDENT.** E1/E3/E4 and method-observation artifacts support the reported work. All twelve recorded correction commands have command, stdout, stderr and actual exit records. `42-e1-c1` records the spawn failure; the other eleven record status 0. This verifies the supplied command set, not an exhaustive history of unrecorded commands.
   - **§4 — CONFIRMED.** Independently compared all **220 listing instructions** in `disasm-ok-dispatch-c1.txt` with input bytes using `address − 0x60021020`: zero mismatches.
   - **§5 — CONFIRMED for surviving outputs; OVERSTATED literally.** Manifest sources and inputs are examined material, not files created by this task.

   Findings in §6:

   - **6.1 — CONFIRMED for screenshots; SUPPORTED-NOT-INDEPENDENT for execution.** Both priority choosers visibly contain the expected two options. Logs support the cited chooser path.
   - **6.2 — SUPPORTED-NOT-INDEPENDENT.** Earlier traces contain other `0x610e*` entries for `0x3D6F`, while the specific chooser path is absent.
   - **6.3 — CONFIRMED as a distinguishing downstream branch; UNSUPPORTED as the first divergence.** At `0x6124f7d4`, bytes `a001` compare D0 with 1; `0x6124f7d8`, bytes `aa00`, compare D2 with 0. The traces already show different returns at `0x6124f7c0`; they do not locate the earlier decision producing those returns.
   - **6.4 — SUPPORTED-NOT-INDEPENDENT.** For key `0x900C`, logs report D0/D2 as **4/0 for 2154, 4/0 for 2155, 4/0 for C-AF Area, and 1/0 for `0x3D6F`**. E1 also yields 1/0; E4 yields 4/0. The listing maps D0=4 to dispatch return 3 and routes D0=1/D2=0 through the child call.
   - **6.5 — CONFIRMED statically; SUPPORTED-NOT-INDEPENDENT dynamically.** The supplied trampoline and method-pointer observations support the chain through `FUN_61203082` and `FUN_6120308d`. The callee decision remains untraced.
   - **6.6 — CONFIRMED for row construction and saved rendering; SUPPORTED-NOT-INDEPENDENT for execution.** E1 writes the required stock clone with only its setting ID differing from stock. No chooser appears; monitored setter/store records are empty, profile readback remains 0, and endpoint `0x90a1` remains `[1,1]`.
   - **6.7 — CONFIRMED for construction and rendering; OVERSTATED if interpreted as testing a visible duplicate.** E3 writes an exact stock row copy, but its third slot is blank. Two Down presses highlight that blank slot. Its failed OK does not characterize a rendered duplicate chooser.
   - **6.8 — CONFIRMED for rendering; SUPPORTED-NOT-INDEPENDENT for execution.** E4 changes the provider ID, renders three priority rows and opens the stock priority chooser. It does not demonstrate a `0x3D6F` editor or commit.
   - **6.9 — CONFIRMED for the stock descriptor bytes; SUPPORTED-NOT-INDEPENDENT for runtime lookup results.** The logged mapped returns and linked descriptor match the reported values. The `0x3D6F` descriptor was linked before these “before value hooks” observations.
   - **6.10 — CONFIRMED.** `FUN_611c7894` is byte-to-halfword copying, with no chooser construction or setter.
   - **6.11 — CONFIRMED as bounded search/readback reporting; SUPPORTED-NOT-INDEPENDENT dynamically.** Reference-page endpoint snapshots show the stated menu-entry changes and unchanged listed cells. They do not exclude transient writes or unresolved backing cells.
   - **6.12 — SUPPORTED-NOT-INDEPENDENT.** BLOCKED is justified for the attempted route. Forcing a return of 4 remains an untested proposal.
   - **6.13 — SUPPORTED-NOT-INDEPENDENT within the measured reference construction.** The page-29 OK did not produce the target editor; general impossibility is not established.

   Experiment isolation and bytes:

   - **E1:** The 36-byte row at `0x6031e978` becomes `6f3d00000c00b106b4ae586104ba58610200000000000000b4ae58610000000000000000`. Its final 32 bytes exactly match input row 2154. Against the stated T3a baseline, ten byte values change; the experimental variable is replacement with the stock-shaped row. Provider bytes remain `6a086b086f3d0000`.
   - **E3:** The same address receives the exact stock row `6a0800000c00b106b4ae586104ba58610200000000000000b4ae58610000000000000000`. Provider bytes remain `6a086b086f3d0000`. This isolates the stated whole-row replacement.
   - **E4:** Against E3’s row configuration, provider bytes change from `6a086b086f3d0000` to `6a086b086a080000`; only `0x6031e92c:6f→6a` and `0x6031e92d:3d→08` differ. The explanation is stated before the experiment.
   - **E2:** Correctly not run because E1 failed. No new text-option list, stock zone-label attribution, confirm/store or cancel proof exists.

   **Required snapshots — NOT DONE.** E1’s immediate “before” contains only profile/setter counts, not the selected screen or stock-cell snapshot. Its saved page screenshot precedes the row replacement. E3 and E4 save page screenshots before subsequent navigation; neither captures the selected state immediately before experimental OK. All three have post-OK screens and broader endpoint readbacks. These do not satisfy brief §7’s immediate before-and-after requirement.

   **Write coverage — SUPPORTED-NOT-INDEPENDENT within instrumentation.** Setter and `FUN_60063431` observations are active during traced OK intervals and record empty commit arrays. This supports absence of calls through those monitored paths, not every possible write. E4 exits with Menu outside that tracing interval; confirm is never sent.

   Remaining numbered sections:

   - **§7 — CONFIRMED as artifact references**, subject to the interpretation limits above.
   - **§8 — CONFIRMED as qualified outcomes.** E3’s failed OK is on a blank slot. E4 is stock chooser opening only.
   - **§9 — CONFIRMED for the principal withdrawals and narrower chooser-path wording.**
   - **§10 — CONFIRMED as disclosure.** It acknowledges the unresolved callee decision and missing page-reference write tracing.
   - **§11 — SUPPORTED-NOT-INDEPENDENT as proposed work.** Neither mapped-key nor descriptor causality has been established.
   - **§12 — CONFIRMED for disclosed deviations; incomplete.** It omits the correction experiments’ missing immediate pre-OK snapshots and inaccurate labelling erratum.

   Previous required corrections 2–6:

   - **2 — DONE.** The buffer-copy interpretation is corrected, the earlier hook proposal withdrawn, and R1 remains BLOCKED.
   - **3 — DONE.** Route absence and no-write claims are bounded by searches and endpoint readbacks; missing tracing/backing-cell coverage is identified.
   - **4 — DONE.** Result §9(2) distinguishes the specific chooser path from the entire address family.
   - **5 — DONE for the supplied correction-command records.** Real wrapper records exist, earlier incomplete exits remain unreconstructed, and the overwritten v1 screenshots remain disclosed. Completeness of all historical commands cannot be independently established.
   - **6 — WRONG in part.** File-specific errata and observation/behaviour separation are supplied, but the first erratum incorrectly says every line of `trace-kind-a3.jsonl` is stamped `EMULATOR-ONLY`. Every line actually uses `hook:"observe"`.

   **Acceptance:** Correctly not run. No qualifying session pair, equivalent control sequence, full-cell regression comparison, paired page renders or byte-by-byte native-save store comparison exists.

5. **Contradictions with established findings**:

   Core overlay layout, stock option records and section placement agree with T3a `decision.md`, “Established,” and `AFON-MENU-RESEARCH.md` §6.

   The narrower `0x610e` wording explicitly corrects T3a’s earlier broad absence statement. The remaining contradiction is internal: result §12’s erratum misdescribes `trace-kind-a3.jsonl`. Treating the downstream compare as the established first divergence would exceed the partial-proof standard in `PROJECT-STATE.md` §2.

6. **Alternative explanations** not excluded by the evidence.

   - The differing return originates in the callee reached through `FUN_6120308d`, before the reported branch.
   - Provider/row-ID mismatch explains E3’s blank slot independently of editor feasibility.
   - Mapped key, descriptor template, count, model state or another registration field may determine chooser routing.
   - Reference construction may omit context supplied by another route.
   - Equal endpoint values permit transient writes and changes outside monitored cells or routines.
   - Opening E4’s stock chooser does not establish confirm or cancel behaviour for `0x3D6F`.

7. **Scope and safety:** No task-specific writes outside `work/` or unapproved emulator changes are evidenced. Isolation audit reports zero violations; the normalized emulator diff matches the initial pin.

   All **140 distinct overlay bytes** have correct stock values `FF` and correct address-to-offset mappings. Every byte lies in uncompressed section 1, between `0x6031e920` and `0x6031e9b3`; none lies in sections 6 or 7. Input section descriptors identify only sections 6 and 7 as compressed.

   Explicit behaviour-changing value hooks carry `EMULATOR-ONLY` code labels. Runtime redirects and descriptor links are distinguished from overlay bytes. Historical JSONL labelling remains incomplete, with retrospective errata supplied; the `trace-kind-a3.jsonl` erratum requires correction.

   No firmware image, component or SD-file construction, persistence run or hardware recommendation was found in the reviewed task outputs and scripts. This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Describe `0x6124f7d4` as the first **measured distinguishing dispatch branch**, and explicitly mark the requested first divergence unresolved unless its originating callee decision is established.
   2. Mark immediate pre/post-OK evidence incomplete. Do not reconstruct missing snapshots. Describe E3 as OK on a blank third provider slot.
   3. Correct the `trace-kind-a3.jsonl` erratum to acknowledge its `observe` labels and the behaviour-changing baseline installed in that session.
   4. Add these remaining gaps to result §12. Preserve the experiment limits and existing artifacts.

   Optional improvements: Preserve complete selected-state snapshots, full event records with explicit truncation indicators, and the entire cancel interval in any authorized follow-up. Fix `static_rows_c1.py`’s direct-call search: it compares component-relative targets with absolute addresses, making its reported `call_count=0` unreliable.