# T3i review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   The help list, restored row label and glyph, exact commits of 2 and 9, C4 cancellation, reference page-28 rendering, full-cell snapshots and store comparisons are supported. Complete acceptance remains overstated because the required exact assertions do not cover every key. The manifest also omits imported emulator dependencies.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the complete manifest, `help.md`, `crash.md`, `design.md`, overlay CSV, acceptance and experiment scripts, JSONL records, command records and audit files.

   Research checked: T3a brief §§4/7; T3h decision, Sol review, face/design reports and relevant scripts; `AFON-MENU-RESEARCH.md`, “How a page-27 row opens its editor”; `611c7785.c`; the three cited T3h instruction listings; T3c’s page-28 reference-construction script.

   Independently checked **175 instruction records** against `inputs/00_0100_50000020.decoded.bin`, using address minus `0x60021020`: zero mismatches. Independently decoded the help and face records, all ten proposed help records, section boundaries and overlay old bytes. Inspected screenshots covering all ten chooser selections, row glyphs, commits, cancellation, stock choosers and pages 25–28.

   Used PowerShell and image viewing only. No Ghidra, OM-Emu or Python was run. No files were written.

3. **Hash verification:** All **521 manifest file entries MATCH**: 42 inputs, 18 sources and 461 outputs. All recorded sizes MATCH. The separate `brief_sha256` MATCHES.

   Each entry represented below was individually recomputed. Braces and inclusive ranges identify separate entries.

   - **MATCH — inputs:** `inputs/{00_0100_50000020,02_0106_458c0020}.decoded.bin`; `TASK.md`; `brief.md`; `templates/result.md`.
   - **MATCH — emulator inputs under `om-emu/emu/`:** `checks/lib/{env,png}.mjs`; `host/nvram.mjs`; `scenarios/session_replay.mjs`; `src/core/{cpu,interp,mem}.mjs`; `src/fw/model.mjs`; `src/lab/{display,menuwalk,play,player,resources,sim}.mjs`; `src/util/bytes.mjs`.
   - **MATCH — emulator resources:** `om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.{blk00000000.OE.0100,blk02000000.OE.0101}.bin`.
   - **MATCH — research inputs:** `ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`; `ref/analysis/decompiled-main/functions/611c7785.c`; `ref/tasks/T3h-afon-zone-faces/decision.md`; `ref/tasks/T3h-afon-zone-faces/run-20261118-122604-review/review.md`.
   - **MATCH — inputs under `ref/tasks/T3h-afon-zone-faces/run-20261118-113413/work/`:** `result.md`; `out/{faces,design}.md`; `out/static-faces-h1.txt`; `out/disasm-{7785,611f81aa,611f8437}-h1.txt`; `scripts/{accept_h1,exp_faces_h1,exp_faces_h2,session_h3,run_logged}.mjs`; `scripts/{build_overlay_h1,static_faces_h1}.py`.
   - **MATCH — input:** `ref/tasks/T3c-afon-editor-routing/run-20261118-073716/work/scripts/route_page_a3.mjs`.
   - **MATCH — sources under `work/scripts/`:** `{accept_i1,exp_crash_ca,exp_crash_ca2,exp_crash_cb,exp_faces_h1,exp_label_i1,exp_pages_i1,exp_tabpath_i1,run_logged,session_h3,strings_i1,zone_session_i1}.mjs`; `{check_bind_i1,dump_pages_i1,dump_tab_i1,static_help_i1,static_help_i2,write_manifest_i1}.py`.
   - **MATCH — command outputs under `work/out/cmd/`:** `01`–`12`, each `.cmd.txt`, `.out`, `.err`, `.exit`; also `13.cmd.txt`.
   - **MATCH — reports:** `work/result.md`; `work/out/{help,crash,design}.md`; `work/out/static-help-i{1,2}.txt`; `work/out/strings-i1.txt`.
   - **MATCH — JSONL under `work/out/`:** `accept-{c1,c2,control,i1}.jsonl`; `accept-{c1,c2}-reopen.jsonl`; `accept-page28-{c1,control}.jsonl`; `crash-{ca,ca2,cb}.jsonl`; `exp-faces-h1-{hook,rerun}.jsonl`; `label-i1.jsonl`; `page28-{candidate,control}.jsonl`; `pages-{candidate,control}.jsonl`; `tabpath-i1.jsonl`.
   - **MATCH — stores under `work/out/`:** `nvram-accept-{c1,c2,control}.json`; `nvram-accept-page28-{c1,control}.json`; `nvram-crash-{ca,ca2,cb}.json`; `nvram-label-i1.json`; `nvram-page28-{candidate,control}.json`; `nvram-pages-{candidate,control}.json`; `nvram-tabpath-i1.json`; `store-accept-{c1,c2,control}.json`.
   - **MATCH — overlays under `work/out/`:** `overlay-accept-{c1,c2}.csv`; `overlay-accept-{c1,c2}-reopen.csv`; `overlay-accept-page28-c1.csv`; `overlay-changed-bytes.csv`; `overlay-crash-{ca,ca2,cb}.csv`; `overlay-exp-faces-h1.csv`; `overlay-label-i1.csv`; `overlay-page28-candidate.csv`; `overlay-pages-candidate.csv`.
   - **MATCH — traces:** `work/out/crash-{ca,ca2}-pc.bin`.
   - **MATCH — shared acceptance screenshots:** for each prefix `work/out/accept-{c1,c2,control}-`, suffixes `{2154,2155}-{open,cancel}.png`, `back{25,26}.png`, `down-{2155,afbutton,caf}.png`, `down26-{0–4}.png`, `down27-{0,1}.png`, `exit-{0,1}.png`, `leave-27.png`, `left-{0–19}.png`, `menu.png`, `page{1,2}-af.png`, `page{25,26,27}.png`, `page27-return.png`, `up25-{0,1}.png`.
   - **MATCH — additional candidate screenshots:** for each prefix `work/out/accept-{c1,c2}-`, suffixes `commit-{2,9}.png`, `commit2-right-{1,2}.png`, `commit9-right-{3–9}.png`, `reopen-2.png`, `zone-{2155,cancel-c4,open,reopen,row}.png`, `zone-right-{1–9}.png`.
   - **MATCH — reference screenshots:** `work/out/accept-page28-{c1,control}-open.png`; `work/out/page28-{candidate,control}-open.png`.
   - **MATCH — crash screenshots:** for each prefix `work/out/crash-{ca,ca2,cb}-`, suffixes `{cancel,down-2,open,page}.png`, `nav-{0–8}.png`, `tab-{0–20}.png`; additionally `work/out/crash-{ca,cb}-down-1.png`.
   - **MATCH — label screenshots:** prefix `work/out/label-i1-`, suffixes `{cancel,chooser-open,commit,menu,page27,reopen}.png`, `down-{2155,afbutton,caf,zone}.png`, `left-{0–19}.png`, `right-{0,1}.png`.
   - **MATCH — rerun screenshots:** prefix `work/out/exp-faces-h1-`, suffixes `chooser-{cancel,confirm,open,reopen}.png`, `chooser-confirm-nav-{0–2}.png`, `chooser-nav-{0–8}.png`, `down-{2155,3d6f}.png`.

   Additional verification: all **483 harvested-file hashes** in `audit/run-log.json` MATCH; all **285 execution-time helper/resource records** MATCH. Every recorded entry-script and wrapper execution hash MATCHES its surviving file. No surviving script differs from its recorded execution hash.

   All 13 wrapped commands have real command text, `.out`, `.err` and `.exit` files and script hashes; all exited 0. Command 13’s final output/error/exit files are absent from the self-generated manifest but covered by the harvest audit. The earlier unwrapped static invocation lacks equivalent original command records.

   Manifest completeness remains deficient: imported dependencies including `src/lab/camapp.mjs`, `src/lab/rtos.mjs`, `src/fw/expand.mjs` and `src/fw/patch.mjs` are absent. Hash agreement does not establish completeness.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED.** Task identity and brief version agree.
   - **§2 — CONFIRMED** for the identified configuration, input sizes, hashes and cited research baseline. Historical reading claims are **SUPPORTED-NOT-INDEPENDENT**. The input inventory is incomplete as described above.
   - **§3 — CONFIRMED** for the 12 retained commands, their outcomes and the 480 successful assertion records. **WRONG** concerning command 09’s “page 25 and 26 shots”: `exp_pages_i1.mjs` logs those screens through `ctx.screen()` without saving screenshots. Its mistaken navigation is disclosed; command 11 supplies the actual acceptance screenshots.
   - **§4 — CONFIRMED** for the cited addresses and inspected material; historical examination is **SUPPORTED-NOT-INDEPENDENT**.
   - **§5 — CONFIRMED** for retained deliverables, subject to the disclosed final-command manifest exclusions.

   Findings in §6:

   - **6.1 — CONFIRMED.** The byte-checked listings establish the 12-byte stride, value match, kind/ID fields and shared face/help count.
   - **6.2 — CONFIRMED.** Independent decoding gives the two stock records followed by eight records containing only values 0 and 1.
   - **6.3 — CONFIRMED within the search’s scope.** An independent scan found zero contiguous ten-record kind-4 lists beginning with value 0 and containing the zone-value set. This does not exclude every possible representation of per-zone help. Independently decoded English resource record 5 confirms `0x01a8` as “Choose the AF target area.” Using that neutral sentence for every zone is justified.
   - **6.4 — CONFIRMED.** C-a2’s C4 record has no help match; C-b and acceptance resolve value 9 to kind 4, ID 424. Screenshots show the replacement sentence.
   - **6.5 — CONFIRMED** for retained evidence. All three H cancellation variants and C-b complete without a reported fault. The copied T3h experiment and session scripts are byte-identical to their research originals. Dynamic execution is **SUPPORTED-NOT-INDEPENDENT**.
   - **6.6 — CONFIRMED as a bounded inference.** The overrun explains stale help. These successful runs do not identify the earlier access violation’s cause.
   - **6.7 — CONFIRMED.** Screenshots show “AF Target Mode” with All, Small and C4 glyphs. Both candidates read back exactly 2 and exactly 9 after confirmation. Cancellation from C4 leaves both aliases at 0.
   - **6.8 — CONFIRMED.** Candidate/control page-28 screenshots are byte-identical and show the same three rows. Scripts and logs label the construction EMULATOR-ONLY and distinguish it from native routing.
   - **6.9 — CONFIRMED for the recorded checks; OVERSTATED as complete acceptance.** Independently compared 148 candidate cell snapshots with their corresponding control snapshots or the control’s pre-AF-ON baseline: no differences. The script implements full-cell checks after every main-session key and 96 shared-step comparisons. Both sessions commit 2 and 9 and cancel from C4. Independently decoded M/E stores have zero differing bytes, and reopen records show default 0. Pages 25/26 are PNG-identical to control. Exact UI-state assertions remain incomplete.
   - **6.10 — CONFIRMED.** `0x60320000` maps to offset `0x2fefe0` inside section 1; all 10008 examined bytes are `0xFF`. This establishes no native ownership.
   - **6.11 — CONFIRMED.** All 368 CSV rows represent changed bytes, with correct old values and address relationships, entirely in uncompressed section 1. The help list occupies 120 bytes and the row 36.

   Remaining numbered sections:

   - **§7 — CONFIRMED** for the cited evidence locations and their bounded claims.
   - **§8 — CONFIRMED** for recorded successful checks, cancellation outcomes and reference rendering; **OVERSTATED** if “Acceptance … PASS” denotes complete brief compliance.
   - **§9 — CONFIRMED** for the help, label, reference-render and placement corrections. **OVERSTATED** that every-key acceptance gaps are closed.
   - **§10 — CONFIRMED** as the remaining native/crash uncertainties.
   - **§11 — OVERSTATED.** Further acceptance and provenance corrections remain inside this prototype.
   - **§12 — CONFIRMED** for the admitted early unwrapped invocation and manifest-finalization limitation; **OVERSTATED** that the remaining work follows the brief completely.

   **T3a brief §4 is not yet demonstrated in full under the required acceptance checks.** The remaining acceptance gap is exact executable state/readback coverage after every key:

   - Many main-session steps assert only a highlight or substring; chooser navigation checks help-reader values rather than the exact highlighted face. Profile/cached readback is not asserted after every key.
   - `exit-1` has only the cell assertion; shooting-state verification occurs later.
   - Page-28 construction presses Menu, twenty Lefts, two Downs and OK without intermediate assertions.

   The label, ten faces, exact commits, C4 cancellation, full-cell checks, pages 25–28 renders and persistence comparison are now supported.

5. **Contradictions with established findings** (cite document §), or “none”.

   No contradiction in the central help, face-source, row-label or persistence findings. The corrected binding-address statement agrees with T3h’s Sol review §7 and supersedes T3h `design.md`, “Binding record.”

   Complete-acceptance wording conflicts with T3i brief §2 item 5 and T3a brief §7 item 3. Manifest completeness conflicts with T3i brief §0. The continued absence of native page-28 routing agrees with `AFON-MENU-RESEARCH.md`, “How a page-27 row opens its editor.”

6. **Alternative explanations** not excluded by the evidence.

   - The historical access violation could depend on emulator state, instrumentation or host behavior. C-a and C-b use the same chooser key sequence, but their tracing/observation arrangements differ; successful cancellation does not isolate the historical cause.
   - Correct help-reader values do not independently prove the rendered highlight. The inspected screenshots supply that evidence, but the script does not assert it.
   - Snapshot and final-store equality do not exclude transient changes between observations.
   - The bounded help search does not exclude differently ordered or differently structured stock help.
   - No native firmware implementation, binding-array ownership, storage choice or hardware behavior is established.

7. **Scope and safety:** No task-specific writes outside `work/`, new emulator-source changes, firmware image/component/SD-file construction, storage decision or hardware recommendation were found. Isolation reports zero violations. The normalized emulator diff matches the initial pinned hash `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   Every final overlay byte’s old value and section were independently checked. None lies in section 6 or 7. Runtime redirects, descriptor registration, binding copy, value hooks, face substitution, harness override and page-28 construction are labelled EMULATOR-ONLY behaviour.

   Comparing C-a2 with C-b yields only the 120-byte help list and four-byte help-pointer change. Comparing C-b with the label experiment yields only the three changed kind/label bytes. These support the stated experiment separation.

   This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Mark acceptance as partial in `result.md` §§8/9/11/12 and list the exact assertion gaps above. Preserve the confirmed functional results.
   2. Before claiming complete acceptance, create a new immutable script version asserting the exact expected UI state and readback after every key, including chooser navigation, exits and page-28 construction. Retain the existing full-cell/control checks.
   3. Complete the manifest’s imported emulator dependency inventory, marking later hashes honestly. Preserve the disclosed provenance gap for the first unwrapped invocation; do not substitute rerun records for missing historical records.
   4. Correct the command-09 screenshot references: those steps produced screen logs, while command 11 produced the acceptance screenshots.

   Optional improvements: add an executable page-28 candidate/control render comparison, and preserve a precisely matched instrumentation configuration for any future crash reproduction.