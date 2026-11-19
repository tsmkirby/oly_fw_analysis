# T8b result

1. **Task identifier and brief version used:** T8b, brief version 2026-11-19. Integrated acceptance with a generated step table and the measured save criterion. Agent Grok 4.7 High. Coordinator Opus 5.5. Reviewer Codex Sol.

2. **Research baseline used:** T8b `brief.md`. T8 brief including §5, T8 decision, and Sol's reviews `run-20261119-131023-review` and `run-20261119-141248-review`. T8 run `run-20261119-132229` (t8r5 runner, save navigation, result §6). T3l `design.md` and `profile-layout.md` for initMirror and the zero-`0x5a11` dial. PROJECT-STATE §3. Main image `inputs/00_0100_50000020.decoded.bin` SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. Resource `inputs/02_0106_458c0020.decoded.bin` SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. Pose `pose.mjs` SHA-256 `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`. Combined overlay `overlay-combined-t8.csv`. Accepted hooks were copied into the runner and left unchanged. No byte was written into section 6 or 7.

3. **Work performed:** Every command went through `work/scripts/run_logged.mjs`. Static commands are not versions. Emulator versions are commands 04, 07, 11, 15, 19, and 23.
   - 01 `write_sequence.mjs` → `out/sequence.json` (64 actions, 136 keys).
   - 02 `gen_table.mjs` → `out/accept-table-t8b.json` (136 steps, 66 editor keys).
   - 03 `check_table.mjs` → `out/table-check-t8b.json` (`ok:true`, 0 problems).
   - 04 version 1, `accept_t8b_v1.mjs om-emu reference work/out/accept-table-t8b.json t8b1`. K1 then K2. Sessions ended `ok:true`. The process then threw because `inventory` was missing.
   - 05 `make_runner_v2.mjs` restored inventory in `accept_t8b_v2.mjs`. v1 was not edited.
   - 06 `write_inventory.mjs` wrote `out/import-inventory-t8b1.json` (145 rows).
   - 07 version 2, accept on the v1 table, tag t8b2. Stopped at `c1-e-enter`.
   - 08–10 sequence v2, table v2, checker 0 problems. Offset 33 stays `0xFF`.
   - 11 version 3, accept on table v2, tag t8b3. Stopped at `c1-e-up`.
   - 12–14 sequence v3, table v3, checker 0 problems. Bank 0 and the measured Up title.
   - 15 version 4, accept on table v3, tag t8b4. Stopped at `c1-e-dial`.
   - 16–18 sequence v4, table v4, checker 0 problems. The no-write dial, then an enable, then a second dial.
   - 19 version 5, accept on table v4, tag t8b5. `e-dial` and `e-arm` passed. Stopped at `c1-e-dial2`.
   - 20–22 sequence v5, table v5, checker 0 problems. Enable `0x5a11` before Up.
   - 23 version 6, accept on table v5, tag t8b6. `e-arm` passed. Stopped at `c1-e-up`.
   - 24 `witness_t8b1.mjs` → `out/witness-t8b1.json`.
   The version budget is six emulator processes. Nothing further was run on the emulator.

4. **Files examined:** T8b brief, T8 brief §0 and §5, T8 decision, both T8 reviews, T8 run `run-20261119-132229` result and `accept_t8_r5.mjs`, T3l `design.md` and `fix` layout, T3m `fix_v1.mjs` (`initMirror` at the getter `0x60063380` and setter `0x60063431`). Addresses read by the runner: mirror `0xa031eeb0` for 55 bytes (gap at offset 33, `0xa031eed1`); flag `0xa031eef7` and cached `0x6031eef7`; zone `0xa031e920` and cached `0x6031e920`; subject getter key `0x1e71` index 0; size record `0x62954108` for 72 bytes; posted M from `0x60061268` (disasm `0x50040248`). Section placement is the inherited combined overlay. No new disassembly pass.

5. **Files created:** Everything written for this task is under `work/`. `work/evidence-manifest.json` lists each file with its SHA-256. Principal artifacts: `work/result.md`, `work/out/sequence.json` and `sequence-v2.json` through `sequence-v5.json`, `work/out/accept-table-t8b.json` and `accept-table-t8b-v2.json` through `v5`, the five `table-check-t8b*.json` reports, `work/out/reference-t8b.json` and `reference-t8b.sha256`, `work/out/witness-t8b1.json`, `work/out/store-diff-t8b1-k1-k2.json`, `work/out/t8b1.jsonl` through `t8b6.jsonl`, the import inventories, the nvram snapshots, the screenshots, and `work/out/cmd/01` through the seal command.

6. **Findings:**
   1. OBSERVED-EMU. Version 1 recorded K1 and K2 over the generated table. `t8b1-done` is `ok:true`. On every recorded step `0x1e71[0]` was 0, the 55-byte mirror was `FF`, and the flag and its cache were 255. K1 edge targets were the stock record `[14,2,2,0,27,0,39,0,0,0]` with owner, status, and enabled 255. No screenshot error was emitted.
   2. OBSERVED-EMU. K2's save met the amended criterion. Before the commit OK the highlighted row was `@A040@AF Target Mode` on page `@A02C@@A065@AF Button`. The baseline was taken before that OK. After the leave to shooting, the only added callback was one posted M from `0x60061268` (disasm `0x50040248`), status 0, 262144 bytes, SHA-256 `d678d295d730a876188c46b890834158a21bc9a492adab976a9ebda696754b90`. The added list contains no E. The zone byte became 1. The flag stayed 255. The mirror stayed 55 `FF` bytes.
   3. OBSERVED-EMU. `compareStores` of K1 against K2 after the main phase and before reopen listed 65 M offsets. Zero was not required. The diff is `work/out/store-diff-t8b1-k1-k2.json`. E was not reported in that diff list.
   4. DATA. `work/out/reference-t8b.json` was written at the end of the successful sessions and hashed at once: SHA-256 `649fc573bc46437c55fa54085c52abc01f373b357e618c28e4bfd08264aef2d1`, 137242 bytes.
   5. OBSERVED-EMU. Command 04's process status is 1. The throw is `inventory is not defined` in the finally block, after `t8b1-done` with `ok:true` and after the hash write. The sessions were not re-run. Command 06 wrote the missing inventory from the same runner and the four dynamic modules.
   6. STATIC. Each generated table passed `check_table.mjs` with 0 problems: v1 (136 steps), v2 (136), v3 (136), v4 (138), v5 (137). Every required field has one source, `literal` or `ref:K1:<stepId>` or `ref:K2:<stepId>`. Editor keys are candidate-only. The save tail is on K2 and both candidates. `assertAfTab` is only `save-left-19`. One `commitStart` and one `saveJudge`.
   7. OBSERVED-EMU. On c1, AF-ON entry initialises the mirror from `FF` to zeros except offset 33, which stays `0xFF`. Zone stays 0, flag becomes 1, and the screen stays shooting. `initMirror` clears only LAYOUT slots, so the unused byte between `0x84d1` and `0x88b2` is untouched.
   8. OBSERVED-EMU. With mirror `0x5a11` still zero, AF-ON Up writes bank index 0: type 1, position 994 (`0x03e2`), `k90d1[0]=1`, `k88b2=994`, the other bank positions 526, zone 1, flag 1, screen direct. The title hash is `9d6a92dc9914061304a8f94e2515a22b5fd6ba2846405649f740cc62282aea02`. Half-press cells stay equal to K2 at `zone-ok`.
   9. OBSERVED-EMU. The next main-dial detent writes no mirror byte and leaves zone 1. The title becomes `42a83c79ead5126577e529b063c94c43e6d6d7a3177476b1be78a8c12c09b1a7`.
   10. OBSERVED-EMU. Writing mirror `0x5a11[0..10]=1` after that screen is open leaves the following detent on type 1, zone 1, and the same title. The ones are present in the mirror.
   11. OBSERVED-EMU. Writing those ones before Up, then pressing Up, writes no type and no position. The mirror stays the armed zeros plus the ones and offset 33. Zone stays 0. The title is `300d23bb9e6959c7e7fb85ca85808e14d5b08992ea2f8d6285406e4b20ba9744`.
   12. OBSERVED-EMU. K2's reopen, with the combined overlay and without editor hooks, keeps a 55-byte `FF` mirror and zone 0. AF-ON down is owner 2 and target `[14,2,3,0,1,0,1,0,1,0]`. AF-ON up is owner 0 and target `[175,0,3,0,7,0,9,0,1,0]`. This is the recorded K2 reference. The candidate All press was not reached.
   13. INFERRED. The candidate sequence did not publish Small, did not reach the normal-edit match, the 12 edges, the pose banks, C1 `[5,7]`, the size-byte check, the candidate save, the candidate reopen, or `compareStores` against K2. c2 did not start. Each failed run stopped at the first failed assertion and emitted `ok:false`.

7. **Evidence for each claim:**
   1. `work/out/t8b1.jsonl` id `t8b1-done`; `work/out/cmd/04.out`.
   2. `work/out/witness-t8b1.json` ids `k2-save-before-commit` and `k2-save-leave-1`.
   3. `work/out/witness-t8b1.json` id `t8b1-k1-k2-stores`; `work/out/store-diff-t8b1-k1-k2.json`.
   4. `work/out/reference-t8b.sha256` and `work/out/witness-t8b1.json` id `t8b1-reference-hash`.
   5. `work/out/cmd/04.err` and `work/out/cmd/04.exit` status 1; `work/out/import-inventory-t8b1.json`.
   6. `work/out/table-check-t8b.json`, `table-check-t8b-v2.json`, `v3`, `v4`, `v5`.
   7. `work/out/cmd/07.out` id `c1-e-enter`; T3m `fix_v1.mjs` `initMirror`.
   8. `work/out/cmd/11.out` id `c1-e-up`.
   9. `work/out/cmd/15.out` id `c1-e-dial`.
   10. `work/out/cmd/19.out` ids `c1-e-arm` pass and `c1-e-dial2` fail.
   11. `work/out/cmd/23.out` ids `c1-e-arm` pass and `c1-e-up` fail.
   12. `work/out/witness-t8b1.json` ids `k2-reopen-base`, `k2-reopen-afon-down`, `k2-reopen-afon-up`.
   13. `work/out/cmd/07.out`, `11.out`, `15.out`, `19.out`, `23.out`, each id `t8b*-done` with `ok:false`.

8. **Tests and outcomes:**
   - Table checks v1 through v5: PASS (0 problems).
   - Version 1 reference, K1 and K2 invariants, K2 amended save, screenshot capture, reference hash: PASS. Process status after the missing inventory call: FAIL of the bookkeeping finally block. The session result stays PASS.
   - Version 2 `c1-e-enter` mirror: FAIL. Stopped. c2 not started.
   - Version 3 `c1-e-up` bank and title: FAIL. Stopped.
   - Version 4 `c1-e-dial` type write: FAIL. Stopped.
   - Version 5 `c1-e-dial` and `c1-e-arm`: PASS. `c1-e-dial2`: FAIL. Stopped.
   - Version 6 `c1-e-arm`: PASS. `c1-e-up` after a pre-armed mirror: FAIL. Stopped.
   - Candidate save, candidate reopen, `compareStores` of c1 and c2 against K2: not run.
   - BOUNDARY. K1 against K2 is 65 M offsets. Zero is not the criterion.
   - BOUNDARY. K2 reopen AF-ON down is owner 2 and is not the All record. K2 has no editor hooks. The All press is a candidate assertion and was not reached.

   PROJECT-STATE §3:
   - Half press: demonstrated for K1 and K2 in the reference run (keys ran, invariants held, fields stored). Candidate equality with K2 after an AF-ON edit: not demonstrated.
   - Independent AF-ON type, size, and position per orientation: not demonstrated. Up published Single at bank 0 when `0x5a11` was zero. Small, the EXIF banks, and C1 were not published.
   - AF-ON menu row: demonstrated for K2. The inherited row accepted the commit. No new visible menu entry was added.
   - AF-ON Subject Detect: Off readback demonstrated (`0x1e71[0]=0` on the recorded steps). Subject Detect On: out of scope.
   - Shared S-AF/C-AF: S-AF setup ran. C-AF: not demonstrated.
   - AF-ON precedence and release restoration: K1 stock edges met the invariant. Candidate precedence and release: not demonstrated.
   - Persistence: out of scope (Q7).
   - Display: out of scope (T9b).

9. **New versus previously established:**
   1. Confirms T8 §5 item 2 for K1 and K2, and confirms the T8 decision's posted-M save on K2, including the image hash from t8r5.
   2. Confirms the T8 decision. The same posted-M hash, source, status, and length. No new E.
   3. Confirms the T8 decision's 65 K1-to-K2 M offsets.
   4. New file. The T8b reference, hashed at once.
   5. New harness fault in the v1 splice. The sessions themselves confirm claim 1.
   6. New. The T8 checker gap (metadata only) is closed on these tables.
   7. New measurement of offset 33. Confirms T3l `initMirror`: only LAYOUT slots that are `FF`/`FFFF` become 0.
   8. New for this harness. The live landscape bank index is 0. T3l's Up still publishes type 1 and position 994. The title `9d6a92dc` is the post-Up band here; T3l called `42a83c79` the Single band.
   9. Confirms T3l design.md: a further main-dial detent while mirror `0x5a11` is zero writes nothing. New: that detent is what moves the title to `42a83c79`.
   10. New. Enabling `0x5a11` after the direct screen is open does not make the next detent publish Small.
   11. New timing. The same ones, written before Up, suppress the Up publish. The title `300d23bb` confirms the hash T3l recorded on a candidate Up.
   12. New record of K2's hook-free reopen target. The candidate All record remains the T8b acceptance literal and was not executed.
   13. New bound. Six versions were not sufficient to publish Small and finish acceptance.

10. **Remaining uncertainties.** The dial that publishes Small from this direct screen, once `0x5a11` is zero at the Up and ones are not visible to that Up. Bank 5 under EXIF 6, including whether Right adds 3 to 994. The size-editor detent map from a seeded 3×3 to C1 `[5,7]`. Whether sixteen Rights return the menu to the first tab before the save. Whether the candidate's last menu tab desynchronizes the twenty Left presses from K2. Playback exit and session-end exit. Candidate `compareStores` against K2, which T3m's restore is meant to make empty and which this run did not reach.

11. **Recommended next actions.** One acceptance sequence that keeps the measured prefix: entry, Up with `0x5a11` still zero, the no-write detent, and the Single title `42a83c79`. Find the key that publishes Small without pre-arming Up, using the measured bank-0 mirror as the literal, and spend the next version only after that key is identified from a trace of the direct-screen dial handler. Then continue with the shared K2-referenced steps, which this table already names. Keep playback and session-end as a later pass. Leave persistence to Q7 and display to T9b.

12. **Deviations from the brief.** The acceptance run did not end `ok:true`. Versions 2–6 each stopped at the first failed candidate assertion, and the six-version budget was then exhausted, so c2, the candidate save, the candidate reopen, and `compareStores` did not run. The v1 runner's finally block called `inventory` after the splice had removed it; the reference file and `ok:true` were already written, and the inventory was produced by a later static command. Later tables kept the shared step ids and replaced candidate literals with the measurements above. No accepted component was edited. No storage decision. No hardware recommendation. `0x1e71[0]` stayed 0. Playback and session-end exits remain.
