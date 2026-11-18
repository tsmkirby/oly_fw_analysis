# T3i result

1. **Task identifier and brief version used:** T3i, brief version 2026-11-18. Close the AF-ON zone row (help list, the C4 crash, row label, page 28), then complete acceptance on the OM-Emu prototype.

2. **Research baseline used:** T3h decision and the Sol review (`ref/tasks/T3h-afon-zone-faces/decision.md`, `ref/tasks/T3h-afon-zone-faces/run-20261118-122604-review/review.md`); `ref/analysis/button-af/AFON-MENU-RESEARCH.md` section "How a page-27 row opens its editor"; T3h `faces.md`, `design.md`, `accept_h1.mjs`, `session_h3.mjs`, `exp_faces_h1.mjs`, `exp_faces_h2.mjs`; T3c `route_page_a3.mjs`; T3a `overlay-changed-bytes.csv`; `FUN_611c7785` decompile and the T3h disassembly listings. Configuration H is the T3h prototype: T3a overlay and redirects, E1 row id `0x3D6F`, action editor `0x1e6`, binding `0x1e6` → `0x3D6F`, UI-238 descriptor clone, private face record at `0x6031ea48` with help still `0x61576520`. Input hashes are the execution-time records in each session JSONL (`step: helper-hashes`) and the later hashes in `work/evidence-manifest.json`. The decoded main image is 33554368 bytes, sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, taken at execution by the session harness. `all-functions.asm` was not opened.

3. **Work performed:**
   - Command 01: `python -I work/scripts/static_help_i1.py` (the same script had also been run once before the wrapper existed).
   - Command 02: `python -I work/scripts/static_help_i2.py`.
   - Command 03: `node26 work/scripts/strings_i1.mjs om-emu`.
   - Command 04: `node26 work/scripts/exp_crash_ca.mjs om-emu work/out/crash-ca.jsonl` (C-a, force-helper around Menu).
   - Command 05: `node26 work/scripts/exp_crash_ca2.mjs om-emu work/out/crash-ca2.jsonl` (C-a, inline interpreter).
   - Command 06: `node26 work/scripts/exp_crash_cb.mjs om-emu work/out/crash-cb.jsonl` (C-b).
   - Command 07: `node26 work/scripts/exp_faces_h1.mjs om-emu work/out/exp-faces-h1-rerun.jsonl` (byte copy of the T3h script).
   - Command 08: `node26 work/scripts/exp_label_i1.mjs om-emu work/out/label-i1.jsonl`.
   - Command 09: `node26 work/scripts/exp_pages_i1.mjs om-emu`. Page 28 renders match. That script pressed OK on AF Mode, so its page 25 and 26 shots are the AF Mode page.
   - Command 10: `node26 work/scripts/exp_tabpath_i1.mjs om-emu work/out/tabpath-i1.jsonl`. This measured the cursor: five Downs from AF Mode reach Release Priority; two Ups from there reach the half-press row; the return to page 27 is Right, Down, Down, OK.
   - Command 11: `node26 work/scripts/accept_i1.mjs om-emu`. Two fresh final-configuration sessions and one stock control. `done` is `ok:true`. 480 assertions, 0 failures.
   - Command 12: `python -I work/scripts/check_bind_i1.py`.
   - Each of those commands was `node26 work/scripts/run_logged.mjs NN ...`. Exit codes are in `work/out/cmd/NN.exit`.

4. **Files examined:** `TASK.md`, `brief.md`, `templates/result.md`; the T3h decision, review, `faces.md`, `design.md`, and the scripts named above; `ref/analysis/decompiled-main/functions/611c7785.c`; T3h `disasm-7785-h1.txt`, `disasm-611f81aa-h1.txt`, `disasm-611f8437-h1.txt`, `static-faces-h1.txt`; T3c `route_page_a3.mjs`; the decoded main and resource images; OM-Emu `env.mjs`, `model.mjs`, `player.mjs`, `play.mjs`, `session_replay.mjs`, `menuwalk.mjs`, `png.mjs`, `display.mjs`, `resources.mjs`, `nvram.mjs`, `bytes.mjs`, `cpu.mjs`, `interp.mjs`, `mem.mjs`, `sim.mjs`. Addresses used: `0x611c7785`, `0x611f8437`, `0x611f7f42`, `0x6120408f`, `0x61203696`, `0x6041931e`, `0x6041937f`, `0x60419446`, `0x60419696`, `0x60063380`.

5. **Files created:** everything under `work/` listed in `work/evidence-manifest.json`. The reports are `work/out/help.md`, `work/out/crash.md`, `work/out/design.md`, and `work/out/overlay-changed-bytes.csv`. The acceptance log is `work/out/accept-i1.jsonl`.

6. **Findings:**
   1. STATIC. `FUN_611c7785` records are 12 bytes: value u32, kind u16, id u16, extra u32. The help call uses the face record's count for both the face scan and the help scan.
   2. DATA. `0x61576520` has two kind-4 records, values 0 and 1. A count of 10 continues into later help lists whose values are also only 0 and 1.
   3. DATA. No kind-4 list of the ten zone values exists. The sentence used for every new record is stock id `0x01a8`, "Choose the AF target area."
   4. OBSERVED-EMU. On H, value 9 misses the help scan and the previous sentence stays. On H plus the help list, value 9 matches id 424 from `0x6031ea6c` and the screen says "Choose the AF target area."
   5. OBSERVED-EMU. Cancel from C4 completed on H (force-helper, inline, and the byte-copied T3h script) and on H plus the help list. Profile stayed 0. The emulator reported no fault.
   6. INFERRED. The help overrun accounts for the stale sentence. It does not account for an access violation in these runs, because the violation did not occur.
   7. OBSERVED-EMU. Kind 4 and label `0x0DD2`, with primary `0x6158ba1c` count 10 and alternate 0, shows "AF Target Mode" and the current zone glyph. The chooser opens and commits. Value 2 stores 2 and draws Small (id 650). Value 9 stores 9 and draws C4 (id 9129).
   8. OBSERVED-EMU. The page 28 reference construction renders the same three "AF Target Mode" rows on the stock control and on the final configuration. It is a reference construction, not a native route.
   9. OBSERVED-EMU. Acceptance: both sessions committed exactly 2 and exactly 9, cancelled once from C4 with the byte still 0, and matched the control on `0x90a1`, all 10 cells of `0x1dd1`, `0x99a1`, `0x9a41`, `0x5962`, every `MODE_AF_HOME*` cell, and `*_ORIGINALLY` ids 2274–2279, at every shared step and after every AF-ON key. Pages 25 and 26 matched the control. Page 27 adds the zone row. M (262144 bytes) and E (196608 bytes) matched the control. A new session read the profile as 0.
   10. STATIC. `0x60320000` is file offset `0x2fefe0` inside the 33554368-byte image, uncompressed section 1, and the 10008 bytes there are `0xFF`. That is not a native owner. The binding array's home stays unresolved.
   11. DATA. The final overlay is 368 bytes, all in section 1. The help list is 120 of them and the kind-4 row is 36.

7. **Evidence for each claim:** (1) `work/out/static-help-i1.txt` lines 1–6. (2) same file lines 7–18. (3) same file lines 208–209; `work/out/strings-i1.txt` line 26. (4) `work/out/crash-ca2.jsonl` step `nav-8`; `work/out/accept-i1.jsonl` assertion `zone-right-9-slot`; `work/out/accept-c1-zone-right-9.png`. (5) `done` records in `crash-ca.jsonl`, `crash-ca2.jsonl`, `crash-cb.jsonl`, `exp-faces-h1-rerun.jsonl`; command exits 04–07 are 0. (6) claims 4 and 5. (7) `work/out/label-i1.jsonl`; `work/out/accept-i1.jsonl` assertions `zone-label`, `commit-2-value`, `commit-9-value`, `commit-9-glyph`; `work/out/accept-c1-zone-row.png`, `work/out/accept-c1-commit-9.png`. (8) `work/out/accept-i1.jsonl` step `page28-assert`; `work/out/accept-page28-control-open.png`, `work/out/accept-page28-c1-open.png`. (9) `work/out/accept-i1.jsonl` steps `cell-compare`, `render-compare`, `store-compare`, `reopen-assert`, `done`. (10) `work/out/cmd/12.out`. (11) `work/out/overlay-changed-bytes.csv`, 368 data rows, written by the c1 session with `canonical: true`.

8. **Tests and outcomes:**
   - PASS. C-a force-helper, C-a inline, T3h script rerun, C-b. All exit 0, `ok:true`. No fault record.
   - PASS. Label experiment, command 08. Row text, glyph, commit of 2, cancel leaves 2.
   - PASS. Acceptance command 11. `ok:true`. Exact values 2 and 9. Cancel from C4 leaves 0. Cells match. Stores match. Reopen profile 0.
   - PASS. Page 28 reference construction, control and candidate, same texts and the same highlight.
   - BOUNDARY. Command 09 opened AF Mode where pages 25 and 26 were required. Command 10 measured the cursor, and command 11 opened the two pages. The command 09 page 25 and 26 shots are not the acceptance evidence.
   - BOUNDARY. The T3h access violation does not reproduce, so there is no faulting PC to record.

9. **New versus previously established:**
   - Claims 1 and 2 confirm T3h and the `611c7785` decompile.
   - Claim 3 is new: one neutral stock sentence, id `0x01a8`, for all ten records.
   - Claims 4 and 5 are new measurements. Claim 6 is the conclusion those measurements support.
   - Claim 7 closes the T3h row-label correction.
   - Claim 8 closes the T3h page-28 correction and confirms T3c's construction.
   - Claim 9 closes the T3h acceptance gaps (every key, exact values, cells, stores).
   - Claim 10 contradicts T3h `design.md` on `0x60320000` being outside the image, and confirms the Sol review.
   - Claim 11 is the final overlay, new relative to T3h's 248-byte CSV.

10. **Remaining uncertainties.** The T3h access violation has no reproduced fault, so its instruction is unknown. A native home for the 10008-byte binding array is unresolved. A new face-table key is unresolved; the prototype still substitutes the pointer. Page 28 still has no native route.

11. **Recommended next actions.** None inside this prototype. A later firmware task would still have to choose a binding-array home and a face key. This result does not choose either.

12. **Deviations from the brief.** `static_help_i1.py` ran once before `run_logged.mjs` existed; command 01 is the wrapped rerun of that same script. The manifest process cannot include `work/out/cmd/13.exit`, because the wrapper writes that file after the manifest process exits. The experiments, the acceptance, and the reports follow the brief.
