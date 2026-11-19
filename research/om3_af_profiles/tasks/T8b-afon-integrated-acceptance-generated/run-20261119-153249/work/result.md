# T8b result

1. **Task identifier and brief version used:** T8b, brief version 2026-11-19, including §5 (correction after Sol `run-20261119-151728-review`). Integrated acceptance with a generated step table and the measured save criterion. Agent Grok 4.7 High. Coordinator Opus 5.5. Reviewer Codex Sol.

2. **Research baseline used:** T8b `brief.md` §0 and §5. T8 brief including §5, T8 decision, and Sol's reviews `run-20261119-131023-review` and `run-20261119-141248-review`. Sol's T8b review in `audit/previous-review.md`. T8 run `run-20261119-132229`. T3l decision and `profile-layout.md`. T3m README and `fix_v1.mjs`. T6 README, `out/design.md`, `scripts/save_v3.mjs`, and `out/save-table-v3.json`. T7 decision (banks 1 / 5 / 3). PROJECT-STATE §3. Main image `inputs/00_0100_50000020.decoded.bin` SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. Resource `inputs/02_0106_458c0020.decoded.bin` SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. Pose `pose.mjs` SHA-256 `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`. Round-1 reference `work/out/reference-t8b.json` SHA-256 `649fc573bc46437c55fa54085c52abc01f373b357e618c28e4bfd08264aef2d1`.

   Sections, from the accepted combined overlay and Sol's recount: 1,308 / 95 / 1,856 / 3 rows in sections 1 / 2 / 4 / 7. No row is in section 6. The only section-7 rows are the three inherited bytes `0x610bf5e3`–`0x610bf5e5`. This round did not add overlay bytes.

3. **Work performed:** Commands go through `work/scripts/run_logged.mjs`. Static commands are not versions. Round 1 used emulator commands 04, 07, 11, 15, 19, and 23. This correction used one emulator process, command 34, and stopped there.
   - 27 `factory_defaults_c1.mjs` walks the registration tables and compares them with K1 claim 2.
   - 28 dumps the round-1 K1/K2 half-press rows.
   - 29–33 write `sequence-c1.json`, generate tables, and check them. `table-check-t8b-c1b.json` is `ok:true`, 0 problems, 145 steps.
   - 34 version 1 of this round, `accept_t8b_c1.mjs om-emu k1e … t8bc1`. K1e only. Stopped at `k1e-c-size-ok` because `0x1e71[0]` became 4. `ok:false`. No candidate was started. The K1e hash file was not written, because the process stopped before that write.
   - 35 summarizes the stopped log.

4. **Files examined:** The documents in §2. Registration walk of tables `0x60095584`, `0x600b8f54`, `0x600bb5ec`, `0x600bda78`, and `0x600e4bec` (bank 7 ends at the zero key `0x6011fe20`, 1,215 records). Runner addresses are unchanged from round 1: mirror `0xa031eeb0`, flag `0xa031eef7`, zone `0xa031e920`, getter `0x60063380`, setter `0x60063431`, half-press record `0xa33f2ce0`, consumer record `0xa33ca384`.

5. **Files created:** Under `work/`. `work/evidence-manifest.json` lists each file. This round adds `work/out/factory-defaults-c1.json`, `work/out/sequence-c1.json`, `work/out/accept-table-t8b-c1b.json`, `work/out/table-check-t8b-c1b.json`, `work/out/t8bc1.jsonl`, `work/out/k1e-summary-c1.json`, the K1e screenshots, and `work/scripts/accept_t8b_c1.mjs`. The round-1 manifest omitted the promoted T6 and T3m READMEs and the T6 save witness. Those paths are inputs of this manifest. The supplement seals the commands, including this manifest's own command, the same way round 1 sealed command 25.

6. **Findings:**
   1. OBSERVED-EMU. Round 1, reused. K1 and K2 over the generated table ended their sessions `ok:true`. `0x1e71[0]` was 0, the mirror was 55 `FF` bytes, and the flag was 255. K1 edge targets were `[14,2,2,0,27,0,39,0,0,0]` with owner, status, and enabled 255. Reference SHA-256 `649fc573bc46437c55fa54085c52abc01f373b357e618c28e4bfd08264aef2d1`.
   2. OBSERVED-EMU. Round 1, reused. K2's save added one posted M from `0x60061268`, status 0, 262,144 bytes, SHA-256 `d678d295d730a876188c46b890834158a21bc9a492adab976a9ebda696754b90`, and no E.
   3. OBSERVED-EMU. Round 1, reused. K1 against K2 is 65 M offsets and zero E offsets. Zero was not required.
   4. STATIC. Every mirror key's ROM registration payload is zero. The walk is `work/out/factory-defaults-c1.json`. K1 claim 2 at `setup` disagrees on 50 layout slots, including `0x5962` = 526, `0x88b2` = 526, `0x1dd1` = ten 3s, `0x84d1` = 3, and `0x99a1` = `[2,0,2,0,2,0,5,5]`. The brief's tie-break says to use the ROM default. `initMirror` in `accept_t8b_c1.mjs` writes the K1 claim 2 values into `FF`/`FFFF` slots instead. That function did not run: K1e has no hooks, and no candidate started.
   5. STATIC. `check_table_c1.mjs` on `accept-table-t8b-c1b.json` reports 0 problems. Editor exits name an existing K2 step with the same key (`k2Exit`). Landscape steps declare bank 1 and EXIF 6 steps declare bank 5. Candidate flag literals are 1 inside an entry and 0 on an exit. Remaining literals carry a decision or claim citation. Mirror sources for AF-ON editor keys are `ref:K1e:<stepId>` with map `half-to-mirror`. Owned-edge targets are `ref:K1e:<s1>` field `halfTarget`, except the reopen press, which is the T6 All record.
   6. OBSERVED-EMU. K1e `ke-base` matches K1 claim 2. Subject is 0. The first direct-screen edit (`e-up`, `e-dial`, `e-right`, `e-ok`) writes index 0: `k99a1[0]=3`, `k5962[0]=412`, `k88b2=412`, `k1dd1[0]=7`, `k1dd1[1]=9`. Index 1 stays type 0 and position 526. `0x1e71[0]` stays 0 through `e-ok`.
   7. OBSERVED-EMU. After the EXIF 6 edit, `k5962` at `p-right` is `[412,526,526,526,412,526]`. Index 5 is 412. Index 1 is still 526. The stock editor wrote the EXIF 6 slot and did not write the landscape consumer slot.
   8. OBSERVED-EMU. `ke-s1-down` leaves `halfTarget` at `[14,2,2,0,27,0,39,0,0,0]`, the same image record K1 keeps. The landscape edit is not in that buffer on the S1 edge. By `c-down-4` the buffer is `[156,1,3,0,3,0,3,0,0,0]` (position 412, kind 3, 3×3).
   9. OBSERVED-EMU. The fixed size-editor path reaches page title `Subject Detection` at `c-down-4`, highlight "Detects birds." `c-size-ok` returns to `2.AF` with highlight `Subject Detection` and `0x1e71[0]=4`. The run stops. `ok:false`. c1, c2, the candidate save, both reopens, and `compareStores` did not run.

7. **Evidence for each claim:**
   1. `work/out/t8b1.jsonl` id `t8b1-done`; `work/out/reference-t8b.sha256`.
   2. `work/out/witness-t8b1.json` ids `k2-save-before-commit` and `k2-save-leave-1`.
   3. `work/out/store-diff-t8b1-k1-k2.json`.
   4. `work/out/factory-defaults-c1.json`; `work/scripts/accept_t8b_c1.mjs` `initMirror`.
   5. `work/out/table-check-t8b-c1b.json`; `work/out/accept-table-t8b-c1b.json`.
   6. `work/out/k1e-summary-c1.json` ids `k1e-ke-base` and `k1e-e-ok`; `work/out/cmd/34.out`.
   7. `work/out/k1e-summary-c1.json` id `k1e-p-right`.
   8. `work/out/k1e-summary-c1.json` ids `k1e-ke-s1-down` and `k1e-c-down-4`.
   9. `work/out/k1e-summary-c1.json` ids `k1e-c-down-4` and `k1e-c-size-ok`; `work/out/cmd/34.out` id `t8bc1-done`.

8. **Tests and outcomes:**
   - Round-1 table checks: PASS as structural checks only. Sol's exit, bank, flag, and provenance gaps stand for those tables.
   - Correction table `accept-table-t8b-c1b.json`: PASS, 0 checker problems.
   - Round-1 version 1 (K1/K2, amended save, reference hash): PASS for the sessions. Bookkeeping `inventory` throw: FAIL of the finally block only.
   - Round-1 versions 2–6: FAIL at the first candidate assertion. Stopped. Not re-run.
   - Correction version 1 (K1e): FAIL at `k1e-c-size-ok`, subject 4. Stopped. Candidates not started.
   - Candidate save, both reopens, re-initialization to the factory bytes, and `compareStores` of c1 and c2 against K2: not run.
   - BOUNDARY. K1 against K2 remains 65 M offsets.
   - BOUNDARY. ROM zeros and K1 claim 2 disagree. The tie-break and the diagnosis name different bytes. The runner contains the claim-2 write. No hooked session observed it.

   PROJECT-STATE §3:
   - Half press: demonstrated for K1, K2, and this K1e prefix. Not demonstrated for an integrated candidate after an AF-ON edit.
   - Independent AF-ON type, size, and position per orientation: not demonstrated. K1e shows the stock editor writing landscape index 0 and EXIF 6 index 5. No candidate consumed that.
   - AF-ON menu row: demonstrated in round 1 for K2's inherited row. No new visible menu entry.
   - AF-ON Subject Detect: Off (`0x1e71[0]=0`) on the K1e steps through `c-size-h`. The next OK wrote 4 and the run stopped. Subject Detect On: out of scope. The value 4 is an accidental menu commit, not a Subject Detect On test.
   - Shared S-AF/C-AF: S-AF setup ran. C-AF: not demonstrated.
   - AF-ON precedence and release restoration: not demonstrated for an integrated candidate.
   - Persistence: out of scope (Q7).
   - Display: out of scope (T9b).

9. **New versus previously established:**
   1. Confirms T8 §5 item 2 and the round-1 reference.
   2. Confirms the T8 decision's posted-M save on K2.
   3. Confirms the T8 decision's 65 K1-to-K2 M offsets.
   4. Confirms T3l `profile-layout.md`: ROM payloads are zeros. Contradicts reading those zeros as the stock screen's start. K1 claim 2 is the start the correction names. The tie-break ("use the ROM default") was not followed in the unrun `initMirror`.
   5. New checker. Round 1's "the checker gap is closed" was wrong. This checker matches editor exits to K2 by key and checks the declared banks. It does not prove the candidate behaves that way.
   6. Confirms the round-1 K1 dial: the stock landscape edit writes index 0. New measured position 412 from the factory screen, with `0x1e71[0]` still 0.
   7. New. The same stock session writes index 5 under EXIF 6 and leaves index 1 at 526. Bank 0 is the landscape editor write in this harness. It is not the accepted button consumer's landscape bank, which is 1 (T7 decision, T6 design).
   8. New. The S1 immediately after that edit does not publish it into `0xa33f2ce0`. A later sample of that buffer does show position 412.
   9. New stop. The size-editor key count borrowed from the AF-tab path opens Subject Detection. The OK writes `0x1e71[0]=4`.

10. **Remaining uncertainties.** Whether a hooked candidate, once `initMirror` has written claim 2, follows K1e's index-0 landscape edit and index-5 EXIF edit. The AF-ON hook still reads banks 1 and 5, so a landscape edit at index 0 would not be the byte the button reads. Which menu keys reach C1 `[5,7]` without writing `0x1e71`. Playback and session-end exits. Candidate store equality with K2.

11. **Recommended next actions.** Do not spend another emulator version on this key path. The OK that set `0x1e71[0]` to 4 is a wrong page, and the brief says to stop. The next sequence has to be built from a log that already shows the AF Target Settings page, with `0x1e71[0]` asserted 0 after every key. Separately, the landscape editor index (0) and the AF-ON consumer index (1) are different in this harness even when the editor starts from K1 claim 2. That split is measured on stock K1e, so factory initialization does not by itself put the edit on bank 1. Leave persistence to Q7 and display to T9b.

12. **Deviations from the brief.** The correction run did not end `ok:true`. One of the six new emulator versions ran. It stopped at the first failed assertion (`0x1e71[0]=4`). Nothing after that assertion was run, so c1, c2, the save, both reopens, and store equality did not run. `initMirror` writes K1 claim 2 rather than the ROM zeros the tie-break names. That is a deviation, recorded in finding 4, and it was not observed in a hooked session. The K1e record was not appended and hashed, because the failure happened first. Playback and session-end exits remain. No storage decision. No hardware recommendation. No new visible menu entry.
