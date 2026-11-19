# T8 result

1. **Task identifier and brief version used:** T8, brief version 2026-11-19. Agent Grok 4.7 High. Coordinator Opus 5.5. Reviewer Codex Sol.

2. **Research baseline used:** T6 `analysis/button-af/readiness/t6-afon-target-size-position` (README, design, overlay CSV, `accept_v1.mjs`, `save_v3.mjs`, save table). T3m `analysis/button-af/readiness/t3m-afon-editor-state-leak` (`fix_v1.mjs`, profile layout, `accept_lib_v4.mjs`). T3l decision. T6 review `run-20261119-110745-review` and T3m review `run-20261119-121201-review`. T7 `pose.mjs` hash `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`. Input main `inputs/00_0100_50000020.decoded.bin` SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. Resource 0106 `inputs/02_0106_458c0020.decoded.bin` SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`.

3. **Work performed:** Static overlay compare, command 01. Combined configuration in `work/out/config.md`. Table-driven runner `work/scripts/accept_t8_v1.mjs`. Six control runs, K1 only, each stopped at the first failed assertion:
   - command 04, tag t8v1, table v1, failed `k1-setup`
   - command 06, tag t8v2, table v2, failed `k1-zone-up`
   - command 08, tag t8v3, table v3, failed `k1-n-up`
   - command 10, tag t8v4, table v4, failed `k1-n-dial`
   - command 13, tag t8v5, table v5, failed `k1-n-ok`
   - command 15, tag t8v6, table v6, failed `k1-edge-0`
   Each later table keeps the previous run's failing control literals. The runner was not edited after command 02.

4. **Files examined:** T6 and T3m overlay CSVs; image section table `0x60029b28`; getter `0x60063380`; setter `0x60063431`; editor copy `0x6119af02`; profile mirror `0xa031eeb0`; zone `0xa031e920`; flag `0xa031eef7`; subject `0x1e71`; half-press cells at the live addresses in `work/out/config.md`; target `0xa33ca384`; owner record `0xa031ed00`.

5. **Files created:** Everything under `work/` listed in `work/evidence-manifest.json`. The combined overlay is `work/out/overlay-combined-t8.csv` with one numeric `section` column.

6. **Findings:**

   1. STATIC. The T6 overlay and the T3m overlay differ only in the 15 profile-read bytes. 3262 rows, address sets identical, no other proposed-byte difference. Section counts from `0x60029b28`: 1 = 1308, 2 = 95, 4 = 1856, 7 = 3. The three section-7 bytes are `0x610bf5e3`–`0x610bf5e5`. No section 6.

   2. OBSERVED-EMU. On K1 after bring-up, the public S-AF calls, landscape pose delivery, and the link setters, `0x1e71[0]` is 0, focus modes 289 and 25 are 0, the 55 mirror bytes are `FF`, the zone byte is 255, the flag is 255, `k1dd1` is ten 3s, `k84d1` is 3, and the ownership status byte is 255. The shooting title band is `166805347ccaf26ddad5750dbfd0a2b169855ffa38b4dbcdfa0717ddd42a3059`.

   3. OBSERVED-EMU. Each Up on the direct screen subtracts 117 from `k5962[0]` and from `k88b2`: 526, then 409, then 292. The direct title band is `9d6a92dc9914061304a8f94e2515a22b5fd6ba2846405649f740cc62282aea02`. OK leaves that position in place.

   4. OBSERVED-EMU. One main-dial detent from that screen sets `k99a1` to `[3,0,2,0,2,0,5,5]`, `k1dd1[0]=7`, `k1dd1[1]=9`, `k84d1=6`, `k90d1[0]=3`, `k90d1[1]=2`. The position stays 292. The direct title band becomes `f3e460f19a599a9059655304852b53b15fbbf81cefb3f90b6325e736712c23ca`.

   5. OBSERVED-EMU. OK after that dial returns to shooting with title band `9112224ec051d885fc69664e35ebd0fccef208287eee912bf9792abe560300c0`. The half-press cells stay at the dialled values.

   6. OBSERVED-EMU. The following K1 S1-down keeps the ten-byte target at `0e 02 02 00 1b 00 27 00 00 00`. Owner, status, and enabled at `0xa031ed00` stay 255. Subject, focus, mirror, zone, and flag match the pre-edge row.

   7. INFERRED. Those three ownership bytes are the image value. The T6 owner/status/enabled expects (1, 0, and 1 on that edge) were measured on overlay sessions, which install the central-edge hook at `0x610bf5e3`–`0x610bf5e5`. K1 is stock and does not install that hook. K2 was not reached.

7. **Evidence for each claim:**
   1. `work/out/overlay-diff-t8.json` and command 01 stdout. Combined CSV `work/out/overlay-combined-t8.csv`.
   2. `work/out/t8v2.jsonl` row `k1-setup` pass true, after `work/out/t8v1.jsonl` row `k1-setup` recorded the title and the cell deltas. Screenshot `work/out/t8v6-k1-setup.png`.
   3. `work/out/t8v3.jsonl` `k1-zone-up` pass true (409) and `work/out/t8v4.jsonl` `k1-n-up` pass true (292). Screenshots `t8v6-k1-zone-up.png` and `t8v6-k1-n-up.png`.
   4. `work/out/t8v5.jsonl` `k1-n-dial` pass true. The full cell object is the `halfSingle` preset in `work/out/accept-table-t8-v5.json`, copied from `work/out/t8v4.jsonl` `k1-n-dial` actual. Screenshot `t8v6-k1-n-dial.png`.
   5. `work/out/t8v6.jsonl` `k1-n-ok` pass true. The title was the actual in `work/out/t8v5.jsonl` `k1-n-ok`. Screenshot `t8v6-k1-n-ok.png`.
   6. `work/out/t8v6.jsonl` `k1-edge-0`. The problems are status, owner, and enabled. The target was the table literal `0e 02 02 00 1b 00 27 00 00 00`. Screenshot `work/out/t8v6-k1-edge-0.png`.
   7. Same edge row, plus the hook map in `work/out/config.md`.

8. **Tests and outcomes:**
   - Static overlay compare: PASS.
   - t8v1 through t8v5: FAIL, each on one control literal, and the next table uses that literal.
   - t8v6: FAIL at `k1-edge-0` on owner 255, status 255, enabled 255. The rows before that edge PASS, including the ten-byte target.
   - K2, c1, c2, save, reopen, and `compareStores`: not run. BOUNDARY for the integration. The six-version budget ended on this K1 edge.
   - Subject Detect On: not attempted. `0x1e71[0]` stayed 0 on every passing row.
   - Playback and session-end exits: not exercised.

9. **New versus previously established:**
   1. Confirms the T6/T3m overlay relationship required by this brief.
   2. New for this boot path. The 3×3 / `k84d1=3` cells confirm the T6 factory read after bring-up. The title band is new.
   3. New. Up moves the live position by 117 on this factory screen.
   4. New. One detent from that screen writes 7×9 and `k84d1=6`, and leaves the position at 292.
   5. New title band for the return to shooting.
   6. New for this K1 edge. The target value confirms the T6 stock All record. The ownership bytes staying 255 are the K1 readback the T6 review required and that earlier K1 logs omitted.
   7. Inferred from claim 6 and the T6 hook placement.

10. **Remaining uncertainties.** K2 with the combined overlay and the flag off is unmeasured. The candidate editor sequence, the EXIF 6 bank, the C1 `[5,7]` record, the size byte, the save witness, the reopen, and `compareStores` are unmeasured. Whether an overlay session writes owner 2 on this same S1-down is unmeasured. Playback and session-end exits are unmeasured. The profile mirror is still expected to be absent after a reopen, which is the open storage question and is not a defect.

11. **Recommended next actions.** Spend the next controls run on the same t8v6 table with K1 edge owner, status, and enabled set to 255, then continue into K2. Start c1 and c2 only after that controls run ends `ok:true`. Keep the runner and correct literals only in a new table.

12. **Deviations from the brief.** The six experiment versions were all K1 control runs. The acceptance candidates were not started. The K1 edge assertion used the T6 overlay owner/status/enabled values, and the stock readback is 255. No firmware byte was added. No storage decision and no hardware recommendation.
