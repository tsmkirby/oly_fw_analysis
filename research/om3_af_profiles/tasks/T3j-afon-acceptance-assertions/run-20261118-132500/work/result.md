# T3j result

1. **Task identifier and brief version used:** T3j, brief version 2026-11-18. Table-driven acceptance with an exact assertion after every key, on T3i's final configuration, OM-Emu prototype.

2. **Research baseline used:** T3i brief §0 (carried into this brief unchanged), `ref/tasks/T3i-afon-zone-acceptance/decision.md`, and the Sol review `ref/tasks/T3i-afon-zone-acceptance/run-20261118-131729-review/review.md`. The configuration is the byte copy of T3i's `zone_session_i1.mjs` at `work/scripts/zone_session_j1.mjs` (sha256 `f9b784c8de3ed13c6bada555689e7bec6283ddcf6b4d546475a54a17b242b043`, the same hash T3i recorded). T3h `faces.md` supplies the ten zone image ids. `AFON-MENU-RESEARCH.md`, "How a page-27 row opens its editor", and T3c `route_page_a3.mjs` are the page-28 reference construction. Input hashes are the execution-time records in `work/out/import-inventory-j1.json` (taken before the acceptance sessions) and the `helper-hashes` lines of the session logs. The decoded main image is 33554368 bytes, sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`.

3. **Work performed:**
   - Command 01: `python -I work/scripts/dump_steps_j0.py`, wrapped. Printed the T3i control and c1 observations.
   - Command 02: `node26 work/scripts/title_check_j0.mjs`, wrapped. Printed page titles for the control dump, then exited 1 on a non-JSON line in that dump. Not acceptance evidence.
   - Command 03: `node26 work/scripts/probe_j1.mjs om-emu`, wrapped. Measured the control, one candidate, and page 28 for both. Exit 0.
   - Command 04: `python -I work/scripts/summarize_probe_j0.py`, wrapped. Shared title, highlight, screen, and non-profile cells matched. No mismatches.
   - Command 05: `node26 work/scripts/check_probe_j0.mjs`, wrapped. Probe M and E stores matched. The probe overlay CSV matched T3i's file.
   - Command 06: `node26 work/scripts/probe_reopen_j1.mjs om-emu`, wrapped. A new session on the probe store. Profile 0, shooting screen, title null.
   - Command 07: `node26 work/scripts/build_table_j1.mjs`, wrapped. Wrote `work/scripts/accept_table_j1.json`, 104 steps, literals copied from commands 03 and 06.
   - Command 08: `node26 work/scripts/accept_runner_j1.mjs om-emu`, wrapped. Control, two fresh candidate sessions, page 28 for all three, store compare, overlay compare, and two reopens. Exit 0. `record: done` is `ok: true`.
   - Command 09: `python -I work/scripts/stats_j1.py`, wrapped. Counted 281 step records, 0 failures, 456 screenshots.
   - Each command was `node26 work/scripts/run_logged.mjs NN ...`. Exit codes are in `work/out/cmd/NN.exit`.

4. **Files examined:** `TASK.md`, `brief.md`, `templates/result.md`; T3i brief, decision, Sol review, `result.md`, `accept_i1.mjs`, `zone_session_i1.mjs`, `run_logged.mjs`, `write_manifest_i1.py`, and the acceptance JSONL; T3h `faces.md`; `AFON-MENU-RESEARCH.md`; T3c `route_page_a3.mjs`; the decoded main and resource images; OM-Emu modules walked from the session (143 modules in the inventory, including `camapp.mjs`, `rtos.mjs`, `expand.mjs`, and `patch.mjs`). Addresses used are the ones already in the copied session: `0x611c7785`, `0x611f7f42`, `0x611f83b1`, `0x611f843e`, `0x6120408f`, `0x61203696`.

5. **Files created:** everything under `work/` listed in `work/evidence-manifest.json`. The acceptance log is `work/out/accept-j1.jsonl`. The table is `work/scripts/accept_table_j1.json`. The runner is `work/scripts/accept_runner_j1.mjs`. Screenshots are `work/out/accept-j1-*.png` and the earlier probe shots. Session behaviour logs are `work/out/session-j1-*.jsonl`.

6. **Findings:**
   1. OBSERVED-EMU. The acceptance log has 281 step records and 0 failures. `work/out/accept-j1.jsonl` line 283 is `ok: true`. The control ran 50 main steps and 25 page-28 steps. Each candidate ran 76 main steps, 25 page-28 steps, and one reopen.
   2. OBSERVED-EMU. On the AF-ON chooser, each Right asserts the highlighted face image id. From All to C4 the ids are 9123, 1610, 650, 6581, 9124, 9125, 9126, 9127, 9128, 9129, and the slot values are 0, 1, 2, 3, 5, 10, 6, 7, 8, 9. The title is "Choose the AF target area." and the help id is 424. The profile byte stays 0. Line 135 is C4, image id 9129, slot value 9.
   3. OBSERVED-EMU. Cancel from C4 returns to "@A040@AF Target Mode" with glyph value 0, image id 9123, and profile 0 (line 136). Commit of 2 stores profile 2 and glyph id 650. Commit of 9 stores profile 9 and glyph id 9129 (line 149). The same sequence passed on c2.
   4. OBSERVED-EMU. Shared steps match the control on title, highlight, screen, and every listed cell other than the profile byte. That set is `0x90a1`, all 10 of `0x1dd1`, `0x99a1`, `0x9a41`, `0x5962`, every `MODE_AF_HOME*` cell, and `*_ORIGINALLY` values 2274–2279. `controlSame` is true on the shared candidate steps, including exit-1 (line 151) and page 28 (line 253).
   5. OBSERVED-EMU. Page 28 is the EMULATOR-ONLY reference construction. Menu, twenty Lefts, two Downs, and OK each have a record. The open title is "AF Target Mode" and the highlight is "@A040@AF Target Mode" on the control and both candidates. The glyph is value 0, id 9123, on the control as well.
   6. OBSERVED-EMU. After the native save, M is 262144 bytes and E is 196608 bytes. Both candidates match the control (line 279). A new session on each saved store reads profile 0 and profileCached 0, screen "shooting", and the same listed cells as the control baseline (lines 281 and 282).
   7. OBSERVED-EMU. The stock 2154 and 2155 choosers highlight "@A066@ Priority", slot value 1, help id 4732, on the control and both candidates (line 102). Cancelling them returns to page 27.
   8. OBSERVED-EMU. exit-1 is the shooting screen in that same step: title null, highlight null, screen "shooting". The candidate profile is still 9. The control's byte at the profile address reads 255.
   9. DATA. `work/out/overlay-changed-bytes.csv` is byte-identical to T3i's file, 32758 bytes (line 280). No configuration byte differs from T3i.
   10. OBSERVED-EMU. The profile address is not the same number on the control and the candidate. The table states both literals: candidate 0 until the commits, then 2, then 9; control 255 on every step. The runner checks each session against its own literal. It does not require those two literals to equal each other.

7. **Evidence for each claim:** (1) `work/out/accept-j1.jsonl` line 283 and `work/out/cmd/09.out`. (2) line 135, and the `zone-right-1` through `zone-right-9` records in sessions c1 and c2; screenshots `work/out/accept-j1-c1-zone-right-9.png`. (3) lines 136 and 149; `work/out/accept-j1-c1-commit-9.png`. (4) `controlSame: true` on shared c1 and c2 records; the `cells` object on line 151. (5) line 253; `work/out/session-j1-p28-c1.jsonl` behaviour records `page28-source` and `p28-arm`, labelled EMULATOR-ONLY. (6) line 279; lines 281 and 282. (7) line 102. (8) line 151. (9) line 280; `work/scripts/zone_session_j1.mjs` sha256 in `work/out/import-inventory-j1.json`. (10) `expect.readback.profile` and `profileControl` in `work/scripts/accept_table_j1.json` for `baseline` and `exit-1`.

8. **Tests and outcomes:**
   - PASS. Command 08, acceptance. 281 step records, 0 failures, `ok: true`. Exact commits of 2 and 9. Cancel from C4 leaves 0. Cells other than the profile byte match the control. Stores match. Reopen profile is 0. Page 28 matches, with an assertion on every key of the construction.
   - PASS. Command 05. Probe stores matched, and the overlay CSV matched T3i, before the table was frozen.
   - PASS. Every acceptance step has a screenshot. `work/out/cmd/09.out` reports no missing screenshot.
   - BOUNDARY. Command 02 exited 1. The title print was cut off by one non-JSON line in the command 01 dump. The acceptance did not use that process.

9. **New versus previously established:**
   - Claims 2, 3, 5, 7, and 8 are the exact per-key assertions T3i's Sol review left open. They confirm T3i decision § "Functional acceptance" and T3h `faces.md` image ids.
   - Claim 4 confirms T3i's full-cell comparison for every shared step, including chooser navigation, exits, and the page-28 keys.
   - Claim 6 confirms T3i's store and reopen result.
   - Claim 9 confirms the configuration was not changed. The overlay file matches T3i's.
   - Claim 10 is the comparison rule for the profile byte. It confirms T3i's separate handling of that byte: the control does not implement it, so the unread value is 255 while the candidate's RAM value is 0, 2, or 9.

10. **Remaining uncertainties.** The T3h access violation is outside this task and still has no reproduced fault. A native home for the binding array is unresolved. Page 28 still has no native route; the construction is EMULATOR-ONLY. The profile value lives in RAM only.

11. **Recommended next actions.** None inside this prototype. This result does not choose a binding-array home, a storage layout, or a hardware change.

12. **Deviations from the brief.** The control comparison of a shared step checks title, highlight, screen, and every listed cell except the profile byte and its cache. Those two are checked against the literal for that role, because the table's two literals differ (claim 10). Command 02 exited 1 as described in §8; the acceptance command did not. The copied session file still contains the string `zone_session_i1.mjs` in its patch-source label; the overlay bytes are unchanged. No firmware configuration was changed.
