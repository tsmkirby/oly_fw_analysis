# T3f review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   The evidence supports the editor-binding discovery and B4’s EMULATOR-ONLY priority-value commit to UI `0x3D6F`. It also supports the negative zone-chooser results. Acceptance and persistence remain untested, as reported.

   Corrections are required for one operand, experimental isolation, incomplete B3 coverage, and evidence provenance.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the complete manifest, `binding.md`, `design.md`, all overlay CSVs, JSONL logs, command records, relevant scripts, and audit records.

   Research checked: T3e’s decision, Sol review, action-record report and design; T3a brief §§4/7 and design addendum; T3c Phase A §§1–3; `AFON-MENU-RESEARCH.md`, “How a page-27 row opens its editor”; relevant lookup, constructor and setter decompilation and listings.

   Independently checked all supplied listing bytes against the main input using `address − 0x60021020`: **1,129 bytes, zero mismatches**. Decoded the binding directory and nearby records directly. Inspected the key screenshots and independently decoded English resource record 5 from the emulator’s GUI resource file.

   Used PowerShell for verification. No Ghidra, OM-Emu or Python execution; no files written.

3. **Hash verification:** All **309 manifest file entries MATCH**: two inputs, 22 sources and 285 outputs. All 285 output sizes MATCH. The separate `brief_sha256` MATCHES.

   Every entry represented below was individually recomputed; grouped names and ranges denote separate entries.

   - **MATCH — inputs:** `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - **MATCH — sources:** `brief.md`; `TASK.md`; `templates/result.md`.
   - **MATCH — sources under `ref/tasks/T3e-afon-action-record/`:** `brief.md`; `decision.md`; `run-20261118-094952-review/review.md`; `run-20261118-091509/work/out/{design.md,action-records.md}`; `run-20261118-091509/work/scripts/run_logged.mjs`.
   - **MATCH — sources under `ref/tasks/T3a-afon-zone-row/`:** `brief.md`; `run-20261118-053855/work/out/{design.md,design-v12.md,overlay-changed-bytes.csv}`; `run-20261118-053855/work/scripts/{build_overlay_v2.py,afon_zone_probe_v16.mjs}`.
   - **MATCH — sources under `ref/tasks/T3c-afon-editor-routing/`:** `brief.md`; `run-20261118-073716/work/out/phaseA.md`.
   - **MATCH — sources:** `ref/analysis/button-af/AFON-MENU-RESEARCH.md`; `ref/analysis/decompiled-main/functions/{6124f4e5,6124f11a,6127e750,6041937f}.c`.
   - **MATCH — command outputs under `work/out/cmd/`:** `01` through `37`, each with `.cmd.txt`, `.out`, `.err` and `.exit`; also `38.cmd.txt`.
   - **MATCH — outputs under `work/out/`:** `binding-directory-f1.txt`; `binding-groups-f2.txt`; `binding-table-f1.txt`; `binding-tail-f1.txt`; `binding-window-refs-f1.txt`; `binding.md`; `callers-f1.txt`; `cells-f1.txt`; `descriptors-f1.txt`; `design.md`.
   - **MATCH — listings under `work/out/`:** `disasm-{01e8,01ee,3b1c,3bd0,3d90,3e70,e750,f11a,f4e5}-f1.txt`.
   - **MATCH — experiment logs under `work/out/`:** `exp-{b1-f1,b1-f2,b2-f1,b3-f1,b4-f1}.jsonl`.
   - **MATCH — screenshots under `work/out/`, for each of `exp-b1-f1`, `exp-b1-f2`, `exp-b2-f1`, `exp-b3-f1`, `exp-b4-f1`:** `-2154-{before,after,cancel}.png`; `-2155-{before,after,cancel}.png`; `-3d6f-{before,after,cancel,chosen,confirm,reopen}.png`.
   - **MATCH — outputs under `work/out/`:** `ghidra-{disasm,lookup,tail,xrefs}-f1.log`; `listing-check-f1.txt`; `overlay-{b1-f1,b1-f2,b2-f1,b3-f1,b4-f1}.csv`; `overlay-changed-bytes.csv`; `probe-ram-f1.jsonl`; `rows-priority-f1.txt`; `scan-ids-f1.txt`; `summary-{b1-f2,b2-f1,b4-f1}.txt`; `template-f2.txt`; `trace-bind-f1.jsonl`; `xrefs-binding-f1.txt`; `zone-text-f1.txt`.
   - **MATCH:** `work/result.md`.
   - **MATCH — scripts under `work/scripts/`:** `check_listings_f1.py`; `decode_binding_f1.py`; `decode_directory_f1.py`; `decode_tail_f1.py`; `DisasmRangesF1.java`; `dump_descriptors_f1.py`; `dump_template_f1.py`; `dump_template_f2.py`; `exp_b1_f1.mjs`; `exp_b1_f2.mjs`; `exp_b2_f1.mjs`; `exp_b3_f1.mjs`; `exp_b4_f1.mjs`; `extract_cells_f1.py`; `find_binding_refs_f1.py`; `find_binding_refs_f2.py`; `find_callers_f1.py`; `find_rows_f1.py`; `find_window_refs_f1.py`; `find_zone_text_f1.mjs`; `print_version_f1.py`; `probe_ram_f1.mjs`; `run_logged.mjs`; `scan_ids_f1.py`; `summarise_b1_f2.py`; `summarise_b2_f1.py`; `summarise_b4_f1.py`; `trace_bind_f1.mjs`; `write_manifest_f1.py`; `XrefsF1.java`.

   Additional checks: every harvested-file hash in `audit/run-log.json` MATCHES. The emulator diff, normalized to LF, MATCHES its initial pin.

   Historical script verification has one genuine exception: command 18 records probe hash `8a4b3591…`, while the surviving, edited probe has hash `bff83ac0…`. This is distinct from the manifest checks, which all match.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED for identity and audited isolation; SUPPORTED-NOT-INDEPENDENT for execution history.** The audit reports zero violations and unchanged workspace/inputs. “Section 0 was followed” is OVERSTATED because the probe filename was reused.
   - **§2 — CONFIRMED for surviving baseline material; SUPPORTED-NOT-INDEPENDENT for historical reading.** The GUI string scan additionally consumes an emulator resource file absent from the manifest.
   - **§3 — CONFIRMED for recorded commands and exits; SUPPORTED-NOT-INDEPENDENT for execution.** All 38 commands have actual `.out`, `.err` and `.exit` files. Exits 06, 18 and 30 are 1; the others are 0. Manifest commands 01–37 match their requested lines. Command 38 is replaced by a null-command note.
   - **§4 — CONFIRMED.** All 1,129 listing bytes match the input. Directory and binding-record addresses and bytes agree.
   - **§5 — CONFIRMED for surviving files.** Final-command output exclusions are disclosed.

   Findings in §6:

   - **6.1 — CONFIRMED.** `0x611a01e8` loads a halfword from A0+`0x54` and returns. In `binding.md`, “3-byte entry” should be “6-byte leaf function”; the load instruction alone is three bytes.
   - **6.2 — CONFIRMED for recorded operands; SUPPORTED-NOT-INDEPENDENT dynamically.** The slot log contains D1 values `{12,339,0,7}`, with A0+`0x54` equal to 1.
   - **6.3 — CONFIRMED.** The lookup compares at `0x6124f523`, strides 24 bytes, and obtains pointer/count from the stated key-8 directory entry.
   - **6.4 — CONFIRMED within the identified array.** Pointer `0x615c540c`, count 416, exclusive end `0x615c7b0c`. IDs `0x1e0`–`0x1e4` map to 2156, 2157, 2205, 2154 and 2155. ID `0x1e6` is absent. The array and directory occupy compressed section 7.
   - **6.5 — CONFIRMED for logged readbacks; SUPPORTED-NOT-INDEPENDENT dynamically.** The probe records `FF` below the loading boundary, `A5` at the sampled higher addresses, and successful runtime writes.
   - **6.6 — CONFIRMED for trace consistency; SUPPORTED-NOT-INDEPENDENT dynamically.** Independently validated every recorded conversion entry against the copied stock array or appended record. Matching addresses and copied UI words agree. C-AF is explicitly a direct call rather than a menu-opening trace.
   - **6.7 — WRONG for the quoted D1 operand; otherwise supported.** The logged D1 is **`0x60E1D50C`**, not `0x60E1A90C`. Its low byte is still 12. The screenshot confirms the blank box and value-0 help text.
   - **6.8 — CONFIRMED for screenshots, logged calls and endpoint comparisons; SUPPORTED-NOT-INDEPENDENT dynamically.** B4 confirms setter `(15727,1)`, profile/cache `0→1`, cancel retaining 0, and `0x90a1=[1,1]`. All other listed cells match the session’s pre-action readbacks. Descriptor lookup changes from zero to `0x6031e9a0` after linking. The causal attribution needs qualification because B4 changes both descriptor contents and registration.
   - **6.9 — CONFIRMED for rendering and logs.** B2’s row displays the All grid; its chooser image is the same two-button priority chooser as B4. Confirm stores 1, without demonstrating zone selection.
   - **6.10 — CONFIRMED.** B3 displays “All” on the row and retains the priority chooser. It tests one text record, not a ten-record text-zone chooser.
   - **6.11 — CONFIRMED for English GUI resource record 5.** Independent decoding yields `0034="All"`, `0070="Single"`, `122c="C1"`, `122d="C2"`; no exact “Cross”, “Mid” or “Large”. The source is the emulator’s `.0101` GUI resource, not input `.0106`.
   - **6.12 — CONFIRMED as a bounded inference.** Row-list changes affect row rendering while the tested chooser remains unchanged. Descriptor contents versus descriptor registration are not isolated.
   - **6.13 — SUPPORTED-NOT-INDEPENDENT as an explicitly untested hypothesis.** No successful ten-zone descriptor is demonstrated.

   Remaining numbered sections:

   - **§7 — CONFIRMED with the operand correction above.** Trace groups separate before-OK, after-OK, cancel and confirm. Required capped arrays report cap 100000, dropped 0. B4 confirm records zero `0x60063431` entries and 228 `0x60063380` entries.
   - **§8 — CONFIRMED within the reported prototype scope.** B4 succeeds for priority values. B2/B3 fail to demonstrate a zone chooser. Acceptance was not run.
   - **§9 — CONFIRMED with qualifications.** The own-UI value-changing commit is new relative to T3e. The descriptor conclusion is a combined-change result.
   - **§10 — CONFIRMED as disclosed limitations.**
   - **§11 — SUPPORTED-NOT-INDEPENDENT as a proposed next experiment.** Its result remains unknown.
   - **§12 — CONFIRMED but incomplete.** Also disclose B4’s combined descriptor/link intervention, B3’s one-record scope, B2’s changed navigation fallback, and command 38’s missing manifest command text.

   Experiment isolation: B1 installs a coherent binding relocation and selector change. B4 changes three descriptor bytes **and** installs its hash link. B2 changes only two overlay bytes representing the row pointer/count, but also changes the navigation fallback. B3 replaces the row list with a single justified text record. These distinctions limit causal claims without invalidating the observed commits.

5. **Contradictions with established findings:** None in the central result.

   T3e decision, “Accepted findings,” leaves the conversion unresolved; the new lookup identification resolves that boundary. T3c Phase A §1 already distinguishes an unlinked descriptor from a linked descriptor, so B4 cannot establish that changing the template alone fixed the chooser. The RAM-only and UI-map qualifications remain consistent with T3a brief §3 and its design corrections.

6. **Alternative explanations** not excluded by the evidence.

   - Linking the existing ten-count descriptor might change the chooser without replacing its template; B4 does not isolate this.
   - Missing descriptor registration may account for B1’s blank chooser and invalid argument.
   - B3 cannot exclude a working complete text-zone descriptor/list.
   - Equal endpoint cells do not exclude transient or same-value writes.
   - The direct C-AF lookup does not establish its complete menu path.
   - No stock-control regression, native implementation, persistence result, or safe final placement for the runtime table is established.

7. **Scope and safety:** No task-specific writes outside `work/`, new emulator-source changes, firmware image/component/SD-file construction, storage decision, or hardware recommendation were found. The pre-existing emulator diff matches its initial pin; isolation reports zero violations.

   All overlay CSV old bytes and offset/address relationships check. The final 212-row overlay lies in uncompressed section 1 below `0x6031f000`. B1’s failed overlay additionally extends into section 1’s nonresident gap. No overlay byte lies in section 6 or 7.

   Main value hooks, runtime redirects, binding copies and descriptor links are labelled `EMULATOR-ONLY` / `role: behaviour`. The probe’s prerequisite `0x5A` overlay at `0x6031ea48` lacks that explicit behaviour label; its later poke is correctly labelled.

   This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Correct §6.7’s D1 to `0x60E1D50C`; correct `binding.md`’s function length to six bytes.
   2. Describe B4 as a combined descriptor-content and hash-registration intervention. Retain the successful commit, but remove any template-only causal conclusion.
   3. Describe B3 as a one-record rendering probe, with the requested complete text-zone experiment unfinished. Disclose B2’s navigation fallback change.
   4. Identify and hash the actual `.0101` GUI resource consumed by the string scan. Distinguish it from input `.0106`.
   5. Preserve command 38’s actual requested command in manifest metadata, while retaining the disclosed self-exclusion. State that command 18’s original probe version was overwritten and cannot be reproduced from the surviving script.
   6. Label the probe’s prerequisite overlay as `EMULATOR-ONLY` / `role: behaviour`, and narrow §1’s blanket compliance statement accordingly.

   Optional improvements: In a separately authorized follow-up, test linking the unchanged ten-count descriptor before changing its template. Preserve the acceptance gate until a chooser actually selects and commits zone values.