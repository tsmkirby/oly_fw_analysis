# T8 result

1. **Task identifier and brief version used:** T8, brief version 2026-11-19, correction round after the Sol review. Agent Grok 4.7 High.

2. **Research baseline used:** T6 `analysis/button-af/readiness/t6-afon-target-size-position` (README, design, overlay CSV, `accept_v1.mjs`, `save_v3.mjs`, `out/save-table-v3.json`, `out/accept-v1.jsonl`). T3m `analysis/button-af/readiness/t3m-afon-editor-state-leak` (`fix_v1.mjs`, `accept_lib_v4.mjs`, result). T5 `zone_session_k1.mjs` and `observe_c1.mjs`. T7 `pose.mjs` hash `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`. Input main `inputs/00_0100_50000020.decoded.bin` SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. Resource 0106 `inputs/02_0106_458c0020.decoded.bin` SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. Confirmed static integration `work/out/overlay-diff-t8.json` and `work/out/config.md` were reused and left in place.

3. **Work performed:** The previous six K1 runs (commands 04, 06, 08, 10, 13, 15, tags t8v1–t8v6) stay as they were. This round:
   - Command 18 built `work/out/accept-table-t8-r1.json` (51 steps). Command 19 checked it: 0 problems.
   - Experiment version 1, command 20, tag t8r1. K1 passed every invariant through `size-afon-up`. The save row search opened the Priority chooser. `ok:false`.
   - Experiment version 2, command 21, tag t8r2. The row search left the AF Button page. `ok:false`.
   - Experiment version 3, command 23, tag t8r3. On stock K1 the AF Button page has two Priority rows. `ok:false`.
   - Experiment version 4, command 24, tag t8r4. K2, with the overlay session, highlighted AF Target Mode, changed All to Single, and appended a posted M. No new E after the pre-commit baseline. The run stopped before the K2 reopen.
   - Commands 27 and 28 are diagnostics, not experiment versions. They record which call writes E and M.
   - Experiment version 5, command 29, tag t8r5. K1 and K2 completed the sequence, including both reopens. The reference file and its hash were written. `compareStores` reported 65 offsets. The run ends `ok:false` because the commit does not append a fresh E.
   - One of the six new experiment versions was left unused. Candidates c1 and c2 were not started.

4. **Files examined:** T6 and T3m overlay CSVs; image section table `0x60029b28`; getter `0x60063380`; setter `0x60063431`; editor copy `0x6119af02`; profile mirror `0xa031eeb0`; zone `0xa031e920`; flag `0xa031eef7`; subject `0x1e71`; target `0xa33ca384`; owner record `0xa031ed00`; save callers `0x6006124a` and `0x60061268`. The page-27 third row is installed in `zone_session_k1.mjs` when the session is an overlay session.

5. **Files created:** Everything under `work/` is listed in `work/evidence-manifest.json`. The reference record is `work/out/reference-v1.json`, SHA-256 `16a103fb5acbd0757b1c405ce2d0c0148d1b242b194753ccd504457d566449c8`, with `work/out/reference-v1.sha256` written in the same run. The full K1/K2 store comparison is `work/out/store-diff-t8r5-k1-k2.json`. `work/out/config.md` was not rewritten.

6. **Findings:**

   1. STATIC. The T6 overlay and the T3m overlay differ only in the 15 profile-read bytes. 3262 rows, address sets identical, no other proposed-byte difference. Section counts from `0x60029b28`: 1 = 1308, 2 = 95, 4 = 1856, 7 = 3. The three section-7 bytes are `0x610bf5e3`–`0x610bf5e5`. No section 6.

   2. OBSERVED-EMU. On K1 after bring-up, the public S-AF calls, landscape pose delivery, and the link setters, `0x1e71[0]` is 0, focus modes 289 and 25 are 0, the 55 mirror bytes are `FF`, the zone byte is 255, the flag is 255, `k1dd1` is ten 3s, `k84d1` is 3, and the ownership status byte is 255. The shooting title band is `166805347ccaf26ddad5750dbfd0a2b169855ffa38b4dbcdfa0717ddd42a3059`. The same row passed again on t8r1 and t8r5.

   3. OBSERVED-EMU. Each Up on the direct screen subtracts 117 from `k5962[0]` and from `k88b2`: 526, then 409, then 292. The direct title band is `9d6a92dc9914061304a8f94e2515a22b5fd6ba2846405649f740cc62282aea02`. OK leaves that position in place.

   4. OBSERVED-EMU. One main-dial detent from that screen sets `k99a1` to `[3,0,2,0,2,0,5,5]`, `k1dd1[0]=7`, `k1dd1[1]=9`, `k84d1=6`, `k90d1[0]=3`, `k90d1[1]=2`. The position stays 292. The direct title band becomes `f3e460f19a599a9059655304852b53b15fbbf81cefb3f90b6325e736712c23ca`.

   5. OBSERVED-EMU. OK after that dial returns to shooting with title band `9112224ec051d885fc69664e35ebd0fccef208287eee912bf9792abe560300c0`. The half-press cells stay at the dialled values.

   6. OBSERVED-EMU. On every K1 edge in t8r5, the ten-byte target stays `0e 02 02 00 1b 00 27 00 00 00` and owner, status, and enabled at `0xa031ed00` stay 255.

   7. OBSERVED-EMU. K2 setup on the combined overlay, with no profile-read hook and no editor hooks, has mirror 55 `FF` bytes, flag 255, zone 0, subject 0, status 0, enabled 1, owner 255, and the same stock target.

   8. OBSERVED-EMU. Twenty Left presses from the reopened menu reach the AF tab: page title `2.AF`, highlight Subject Detection, header hash `bb086a5b20fe141fc7db882c015fb47fa34bccd9d86ab709799ef8bb8324225c`.

   9. OBSERVED-EMU. The stock AF Button page shows two rows, both labelled Priority. The overlay session draws a third row, AF Target Mode, showing All. Opening and cancelling the two Priority rows, then Down, lands on that row.

   10. OBSERVED-EMU. On K2, OK, Right, OK on AF Target Mode changes the row from All to Single and sets the zone byte to 1. After the pre-commit baseline the witness has one new save: posted M from `0x60061268`, status 0, 262144 bytes, via callback. There is no new E.

   11. OBSERVED-EMU. E and the unposted M from `0x6006124a` are already in `store_log.nvram.saves` at the first line of `drive()`, before bring-up, the focus API, pose delivery, and the link setters. The menu commit does not call `0x6006124a` again.

   12. OBSERVED-EMU. `compareStores` of the t8r5 K1 file against the t8r5 K2 file returns 65 offsets. The list is complete in `work/out/store-diff-t8r5-k1-k2.json`. The reference run reports them and does not require the count to be zero.

   13. OBSERVED-EMU. K2 reopen keeps the mirror at 55 `FF` bytes, the zone byte at 0, and the flag at 255. The AF-ON down on that reopen has owner 2 and target `[14,2,3,0,1,0,1,0,1,0]`.

7. **Evidence for each claim:**
   1. `work/out/overlay-diff-t8.json` and `work/out/config.md`.
   2. `work/out/t8r5.jsonl` row `k1-setup`. Screenshot `work/out/t8r5-k1-setup.png`.
   3. `work/out/t8r5.jsonl` rows `k1-zone-up` and `k1-n-up`.
   4. `work/out/t8r5.jsonl` row `k1-n-dial`.
   5. `work/out/t8r5.jsonl` row `k1-n-ok`.
   6. `work/out/t8r5.jsonl` rows `k1-edge-0` through `k1-edge-11`, each `pass:true`.
   7. `work/out/t8r5.jsonl` row `k2-setup`.
   8. `work/out/t8r5.jsonl` save trace inside `k2-save-identity`, shots `save-seek-0` through `save-seek-19`.
   9. `work/out/t8r3-k1-save-afbutton-open.png` and `work/out/t8r4-k2-save-before-commit.png`. `zone_session_k1.mjs` installs the third row only when `candidate` is set.
   10. `work/out/t8r4-k2-save-commit-open.png`, `work/out/t8r4-k2-save-commit-right.png`, `work/out/t8r4-k2-save-commit-ok.png`, and `work/out/t8r5.jsonl` row `k2-save-identity` (`save no-new-E`, `save log-E`).
   11. `work/out/probe-saves-t8b.json` mark `boot`, count 2. `work/out/probe-saves-t8.json` mark `after-commit` adds only the posted M.
   12. `work/out/t8r5.jsonl` row `t8r5-k1-k2-stores`, count 65, and `work/out/store-diff-t8r5-k1-k2.json`.
   13. `work/out/t8r5.jsonl` rows `k2-reopen-base` and `k2-reopen-afon-down`.

8. **Tests and outcomes:**
   - Static overlay compare: PASS.
   - Table check, command 19: PASS, 51 steps, 0 problems.
   - t8v1–t8v6: FAIL, preserved from the previous round.
   - t8r1, t8r2, t8r3: FAIL in the save navigation. Screenshots were taken. A screenshot error did not occur, and there is no boundary-frame fallback.
   - t8r4: FAIL. The AF Target Mode commit is visible. The fresh-E check fails.
   - t8r5: FAIL on the same fresh-E check. K1 invariants, K2 invariants other than that save check, both reopens, the reference hash, and the full store diff were recorded.
   - c1, c2, the C1 `[5,7]` editor, and the candidate `compareStores`: not run. BOUNDARY. The reference run did not end `ok:true`.
   - Subject Detect On: not attempted. `0x1e71[0]` stayed 0.
   - Playback and session-end exits: not exercised.

9. **New versus previously established:**
   1. Confirms the overlay relationship required by this brief.
   2. Confirms the previous K1 setup claim on this boot path.
   3. Confirms the previous Up-by-117 claim.
   4. Confirms the previous one-detent claim. The cells are a Cross record. The old preset name `halfSingle` is retired in the r1 table.
   5. Confirms the previous return-to-shooting claim.
   6. Confirms claim 6 of the previous result on all twelve K1 edges, where the earlier run had stopped at the first edge.
   7. New. K2 with the combined overlay and the flag left at 255.
   8. Confirms the T6 AF-tab identity (page title `2.AF`, header hash, Subject Detection).
   9. Confirms T3m's observation that stock page 27 has no AF Target Mode row, and T6's observation that the overlay session draws it.
   10. New for this boot path. The commit posts M. It does not append E.
   11. New. The `0x6006124a` pair is a session-open write. T6's whole-log check counted that pair together with the posted M.
   12. New. The K1 and K2 files differ at 65 offsets.
   13. New. Recorded for the overlay reopen. Acceptance did not assert it.

10. **Remaining uncertainties.** The candidate editor, including C1 `[5,7]`, the EXIF-6 bank edit, and the size byte, was not run. Candidate `compareStores` against K2 was not run. Playback and session-end exits were not exercised. Whether a later AF Target Mode commit can append a second E, after the session-open write, was not observed: the one commit that was measured appended only the posted M. The profile mirror staying `FF` after reopen is the open storage question and is the measured reopen state.

11. **Recommended next actions.** Leave the accepted hooks and the overlay unchanged. Reconcile the fresh-E requirement with the session-open write at `0x6006124a` before starting c1 and c2. One new experiment version remains. The reference file is `work/out/reference-v1.json`.

12. **Deviations from the brief.** The reference run ends `ok:false`. A fresh E after the pre-commit baseline did not occur, and emitting one would be a new behaviour change, which this round does not add. K1 does not commit the AF Target Mode row: that row is drawn only for the overlay session, and committing a Priority row would be a different procedure. Candidates were not started. The guessed editor literals in the r1 table were not executed. No storage decision and no hardware recommendation.
