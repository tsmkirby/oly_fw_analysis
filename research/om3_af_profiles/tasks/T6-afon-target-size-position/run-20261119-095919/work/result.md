# T6 result

1. **Task identifier and brief version used:** T6, brief version 2026-11-19. Section 0 of that brief overrides the rest. This file includes the correction in brief §5. The prototype is EMULATOR-ONLY. It is not a firmware image, not a storage decision, and not Subject Detect On.

2. **Research baseline used:** Z5 from `ref/analysis/button-af/readiness/t5-afon-button-handoff/` (README, `out/design.md`, `out/target-bytes.md`, `out/disasm-home-k1.txt`, `out/disasm-converter-k1.txt`, `out/overlay-changed-bytes-c1.csv`, `scripts/zone_session_k1.mjs`, `scripts/observe_c1.mjs`, `scripts/accept_runner_c3.mjs`, `scripts/accept_table_c3.json`). The mirror layout is T3b `ref/tasks/T3b-afon-target-editor/run-20261119-063452/work/out/profile-layout.md`. Orientation is T7 `pose.mjs`, imported from `ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs` and not edited. The T5 decision carries the reopen release into this task. Main image `inputs/00_0100_50000020.decoded.bin`. Resource image `inputs/02_0106_458c0020.decoded.bin`. File offset is the runtime address minus `0x60021020`. Ghidra was not run. `om-emu` was not modified. NVRAM was the session file passed by `zone_session_k1.mjs`, not `OM_EMU_NVRAM`.

3. **Work performed:** Every command was `node26 work/scripts/run_logged.mjs NN ...` from the workspace root.
   - 01 `check_listings_t6.py` exited 1 (a bool was concatenated into a string). The script is frozen.
   - 02 `check_listings_t6b.py` exited 1 because the home builder in the stock image is `0xFF`. It wrote `work/out/listing-check-t6b.txt` and, at that moment, copied the Z5 CSV onto `work/out/overlay-changed-bytes.csv`.
   - 03 `check_listings_t6c.py` exited 1 on three bank-pointer mismatches after the Z5 CSV was applied. It wrote `work/out/listing-check-t6c.txt`.
   - 04 `build_overlay_t6.py` exited 0. It replaced those 20 bytes' proposed values and rewrote `work/out/overlay-changed-bytes.csv`. Command 02's copy of the Z5 CSV is not the file on disk now.
   - 05 `probe_base_t6.mjs` exited 0. Observation only, on the Z5 CSV, no profile hook.
   - 06 `section_check_t6.py` exited 1. Its call decoder missed the section-load call. Frozen.
   - 07 `exp_q1_t6.mjs` exited 0. `q1-done` is `ok:true`.
   - 08 `section_check_t6b.py` exited 0. `work/out/section-rows-t6.json` is `ok:true`.
   - 09 `exp_q234_t6.mjs` exited 1. Q2 and the linked landscape bank passed. The next pose rewrote the half-press size cells. Frozen.
   - 10 `exp_q34_t6.mjs` exited 0. `q34-done` is `ok:true`.
   - 11 `accept_runner_t6.mjs` exited 1. Phase A produced Small and the runner expected All. Frozen.
   - 12 `make_accept_t6b.mjs` exited 0. It only copied the runner.
   - 13 `accept_runner_t6b.mjs` exited 1. AF-ON release while the shutter was held kept owner 1. Frozen.
   - 14 `make_accept_t6c.mjs` exited 0. It only copied the runner. The copy was corrected before command 15.
   - 15 `accept_runner_t6c.mjs` exited 1. Profile A and profile B passed on session c1. The save check looked at the wrong object. `accept-done` is `ok:false`.
   - 16 `write_manifest_t6.py` exited 0. Its `.out`, `.err` and `.exit` were not hashed by that script. Command 29 hashes them. The script is frozen.
   - 17 `save_v1.mjs` exited 1. The menu baseline compared a stale `k1dd1` literal. Frozen.
   - 18 `show_save_v1.py` exited 0.
   - 19 `make_save_v2.py` exited 0. It only built the next runner.
   - 20 `save_v2.mjs` exited 1. The menu path passed. The completion witness did not. Frozen.
   - 21 `show_save_v2.py` exited 0.
   - 22 `make_save_v3.py` exited 0. It only built the next runner. The witness was corrected before command 23.
   - 23 `save_v3.mjs` exited 0. `save-v3-done` is `ok:true`.
   - 24 `show_save_v3.py` exited 0.
   - 25 `accept_v1.mjs` exited 0. `accept-v1-done` is `ok:true`.
   - 26 `exp_size_v1.mjs` exited 0. `size-v1-done` is `ok:true`.
   - 27 `python -I -c` exited 0 and produced no record. The shell removed the quoted program, so the process was only `import json`.
   - 28 `show_records_v1.py` exited 0. It wrote `work/out/records-v1-summary.json`.
   - 29 `write_manifest_t6v1.py` writes `work/evidence-manifest.json` and `work/out/manifest-supplement-t6v1.json`. That supplement leaves 29's own `.out`, `.err` and `.exit` unhashed, because the wrapper creates them after the script returns.
   - 30 `seal_manifest_t6v1.py` hashes command 29's `.cmd.txt`, `.out`, `.err` and `.exit`, plus the manifest and the preliminary supplement, into `work/out/manifest-seal-t6v1.json`. Command 30's own `.out`, `.err` and `.exit` are written by the wrapper after that process returns. The `.exit` file contains a timestamp, so this process cannot hash it.

4. **Files examined:** Stock image at file offset `address - 0x60021020`. Home builder `0x60a8f6bb` through the Z5 window, including `0x60a8f708`, `0x60a8f71c`, `0x60a8f71f`, `0x60a8f726`, `0x60a8f73e` (`0xdfa1`), `0x60a8f75a` (`0x99d2`), `0x60a8f770` (`0x1e01`), `0x60a8f7bb` (kind 2 stores 526). Getter `0x60063380`. Setter `0x60063431`. Converter `0x609b3ecd` and jump table `0x60a7da08`. Half-press writer `0x609b3c79`. Focus converter `0x604050e5`. Consumer `0xa33ca384`. Zone byte `0xa031e920`. Mirror `0xa031eeb0` (cached `0x6031eeb0`), 55 bytes. Pose word `0xa32c568c`. Link cells `0x1db1[0]` and `0x1dc1[0]`. Subject Detect key `0x1e71[0]`. NAND write `menu.mjs` `_s_nand_write`. Listings: T5 `out/disasm-home-k1.txt` and `out/disasm-converter-k1.txt`. T3b profile layout, Placement, for the `0x9a41` cell count.

5. **Files created:** Under `work/` only. Scripts, `work/out/` (design, field table, CSV, listings, JSONL, screenshots, session stores, `cmd/`), this file, and `work/evidence-manifest.json`. The manifest lists them. Nothing was written under `ref/`, `inputs/`, or `om-emu`. Failed runs and their scripts were kept.

6. **Findings:**
   1. STATIC. The stock image at `0x60a8f708` is 20 bytes of `0xFF`. The home builder is overlay code. The converter listing matches the stock image, 45 instructions, 0 mismatches (`work/out/listing-check-t6b.txt`).
   2. STATIC. Applying the Z5 CSV reproduces the home listing except three bank pointers moved by `+0x3e0` (`0x60a8f6e7`, `0x60a8f6f2`, `0x60a8f6fd`) and the 20-byte window at `0x60a8f708` (`work/out/listing-check-t6c.txt`).
   3. DATA. The one change replaces 15 of those 20 proposed bytes. The new bytes call getter `0x60063380` and return to `0x60a8f71c`. All 15 rows are section 4, source `profile-read`. The CSV still has 3262 rows: section 1 = 1308, section 2 = 95, section 4 = 1856, section 7 = 3. The only section-7 rows are `0x610bf5e3`–`0x610bf5e5`, labelled as the inherited central-edge call site (`work/out/section-rows-t6.json`, `work/out/overlay-profile-diff-t6.txt`).
   4. OBSERVED-EMU. With no profile hook, shutter S1's consumer follows the stock writer `0x609b3c79`. AF-ON's consumer follows the builder. Zone byte 0 makes that builder record the All target `0e 02 02 00 01 00 01 00 00 00`. Poking half-press `0x84d1=2`, `0x1dd1[0]=1`, `0x1dd1[1]=1` and `0x99a1[0]=0` makes the next S1 record that same All target (`work/out/probe-base-t6.jsonl`).
   5. OBSERVED-EMU. `0x1e71[0]` is 0 after S-AF setup, without a write to it. The stock AF-tab highlight is `Subject Detection`, and that screen's texts include `Off` and `On`. 0 is the Off row. `0x90a1` reads `[1, 1]` and is not Subject Detect (`work/out/probe-base-t6.jsonl` step `af-tab`; Q1 subject steps). Subject Detect was not set to On.
   6. OBSERVED-EMU. Q1, one combined change. Half-press is All. The mirror seed is test setup: bank 1 zone Small, position 529. Small `11 02 03 00 01 00 01 00 00 00` is the consumer on the five AF-ON-owned edges, indices 2, 5, 8, 9 and 10. The other seven edges restore All `0e 02 02 00 01 00 01 00 00 00`. Owner follows `[1,0,2,0,1,2,1,0,2,2,2,0]`. The half-press cells stay the poked All cells, and the 55 mirror bytes stay the seed. K2, Z5 with the same poke and no seed, keeps the All target on AF-ON and the mirror at `0xFF`. K1, no overlay, keeps `0e 02 02 00 1b 00 27 00 00 00` (`work/out/edges-q1-t6.jsonl`).
   7. OBSERVED-EMU. The getter hook's first logged returns include `0x609b3c89` with `inConv` false, and those calls are passed through. Q1's shutter edges stay the All record while AF-ON is Small, so the hook does not replace the stock writer (`work/out/edges-q1-t6.jsonl` step `q1-candidate-hook`).
   8. OBSERVED-EMU. Q2. Mirror C1 is zone 6, position 529, mirror `0x1dd1[2]=5` and `[3]=7`. Half-press `0x1dd1[2]` and `[3]` stay 3. AF-ON is `11 02 07 00 05 00 07 00 00 00`. The hook counted 24 mirror dimension reads. K2 AF-ON stays All (`work/out/edges-q234-t6.jsonl`). The Q2 candidate alone opens the Subject Detection menu (`exp_q234_t6.mjs`, `showSubject` only when `role === 'candidate'`). Decoded store M differs from that session's K2 at 49 offsets, and E is identical. The offsets are `2, 3, 4, 664, 665, 666, 667, 745, 746, 1029, 1040, 1056, 1174, 1175, 1176, 1180, 2040, 2062, 204952, 207548, 208156, 208256, 208424, 208880, 209532, 210256, 210564, 212472, 212476, 232469, 232636, 232660, 232663, 233334, 233482, 233483, 233484, 233488, 233494, 233495, 233522, 233523, 233524, 233525, 233528, 233688, 234096, 234104, 234285` (`work/out/records-v1-summary.json`, stores.q2). That comparison was not matched navigation, and it is not a storage decision.
   9. OBSERVED-EMU. Publishing EXIF 6 rewrote half-press `0x84d1` from 2 to 3 and `0x1dd1` from `[1,1,3,...]` to all 3s. Link flags stayed 1. That run stopped there (`work/out/edges-q234-t6.jsonl` step `q3-on-exif6-half`).
   10. OBSERVED-EMU. Q3, after re-applying the All poke as test setup once the pose has published. Orientation Linked on: landscape (pose word 1) Small at 529; EXIF 6 (pose word 2) Single at 532, `14 02 00 00 01 00 01 00 00 00`; EXIF 8 (pose word 4) Cross at 535, `17 02 03 00 01 00 01 00 01 00`, priority 1 from half-press `0x1df1[0]`. Orientation Linked off: all three poses stay Small at 529, bank 1 (`work/out/edges-q34-t6.jsonl`). The controls are reduced. K2 ran two linked edges per pose, AF-ON down and AF-ON up, and stayed All. K1 ran landscape only, AF-ON down and AF-ON up, and stayed the stock record. Those controls were not rerun as the candidate's 12-edge list.
   11. OBSERVED-EMU. Q4. Focus sid 289 and active sid 25 are both 1, set through converter `0x604050e5`. The Q1 Small record is unchanged on the AF-ON-owned edges. The half-press stays All (`work/out/edges-q34-t6.jsonl` step `q4b-candidate-e2`).
   12. OBSERVED-EMU. The first acceptance runner's session c1 reached profile A, the EXIF-6 pose change and profile B, then failed its save check because it read `ctx.s.store_log`, which is empty. The log that receives NAND writes is `ctx.l.store_log`. That run ends `ok:false`. Reopen was not reached (`work/out/accept-t6c.jsonl`).
   13. OBSERVED-EMU. The T5 menu commit and menu exit, run on the T6 overlay, writes E and M. `save_v1` failed before the menu because the table's `k1dd1` literal was `[27, 39, ...]` and the live cells were ten 3s. `save_v2` passed every menu step and then failed the completion witness: the replaced `finish` was left in place, and the callback status was recorded before the store name was attached. `save_v3` records both. The log is E then M from `0x6006124a` with `posted` false, then M from `0x60061268` with `posted` true. Each witnessed status is 0. The posted M status is the callback `d0`, callback `1342451092`, not the fact that a log line exists (`work/out/save-v3.jsonl`).
   14. OBSERVED-EMU. Acceptance `accept_v1.mjs` ends `ok:true`. Two fresh candidates and K2 each run profile A for 12 edges, the EXIF-6 pose change, profile B for 12 edges, the T5 menu save, and a new session on that store. K1 runs the landscape 12 edges and does not run the AF-ON chooser, because the stock image has no AF-ON row. On the candidates, AF-ON-owned edges are Small then C1, and the other edges are All. Every key in the menu, including the exit loop, has its own step id and an expected state. Each edge record contains the 55-byte mirror and the focus and status readbacks (`work/out/accept-v1.jsonl`).
   15. OBSERVED-EMU. On reopen the 55-byte mirror is image `FF`, the zone byte is 0, and `0x1e71[0]` is 0. The idle target is `0e 02 02 00 1b 00 27 00 00 00`. AF-ON press is All `0e 02 02 00 01 00 01 00 00 00`, owner 2. AF-ON release is the stock half-press record `0e 02 03 00 03 00 03 00 00 00`, owner 0. K1 press and release stay `0e 02 02 00 1b 00 27 00 00 00`. The stated fallback is: an uninitialised mirror uses zone byte 0, size 0, position 0 and `+9` 0, and kind 2 then forces 526, so the press is All. The candidate overlay no longer reads the zone byte directly; the getter hook supplies it when the mirror byte is `FF` (`work/out/accept-v1.jsonl`, `c1-reopen-afon-down`, `c1-reopen-afon-up`).
   16. OBSERVED-EMU. Decoded M and E of both candidates match K2 at every offset. M is 262144 bytes, sha256 `7ac3baeae47473ad4eebca572365fa3828fc89d948bf00fece522b1354b1a394`. E is 196608 bytes, sha256 `0f47f7d2e52c925a1bd3076cc4e58530da2f40eba8797321d22ca6a3c0adba9f`. The differing-offset lists are empty (`work/out/accept-v1.jsonl`, `c1-store` and `c2-store`). This is a comparison of these session files. It is not a storage decision. The profile itself is not in the reopened mirror: that mirror is `FF`.
   17. OBSERVED-EMU. Size, one trial. The mirror's `0x9a41[0]` (offset `0x08`) is 4. Legacy `0xdfa1` is 0. Live `0x9a41[0]` is 0. Live `0x9a41[1]` is 1 and is not the byte the hook reads. Shutter down, shutter up and AF-ON release stay All, size byte 0, so the half-press consumer still uses the legacy size. AF-ON press is `11 02 03 04 01 00 01 00 00 00`, size byte 4, owner 2, which is the mirror byte and not either legacy cell (`work/out/size-v1.jsonl`, `size-v1-e0` through `size-v1-e3`). The seed is test setup. The behaviour change is the combined profile read already in the overlay.
   18. DATA. T3b places `0x9a41` at mirror offset `0x08` as two one-byte cells, count 2, width 1. The hook reads index 0. `work/out/design.md` now says count 2. Reading index 0 is unchanged.
   19. INFERRED. Kind 2 still forces position 526 after the position read, so a fresh All zone is `0e 02 02 00 01 00 01 00 00 00`. The reopen press shows that record with the mirror at `FF`. The size trial shows that a non-`FF` mirror size is the AF-ON size byte. The reopen does not separately show the size `FF`→0 branch against a non-zero `0xdfa1`, because both were 0.

7. **Evidence for each claim:** The file and step named on that line. The overlay bytes are `work/out/overlay-profile-diff-t6.txt`. The section tally is `work/out/section-rows-t6.json`. Addresses and the field table are `work/out/design.md` and `work/out/target-fields.md`. Store offsets are `work/out/records-v1-summary.json`. Command transcripts are `work/out/cmd/`.

8. **Tests and outcomes:**
   - Listing checks 02 and 03: BOUNDARY. They exited 1 because the builder is overlay and three pointers were relocated. The reports are the evidence.
   - Section check 08: PASS. No row outside the three inherited bytes is in section 6 or 7.
   - Probe 05: PASS as observation. Not a behaviour experiment.
   - Q1: PASS. `ok:true`. Small is the five AF-ON-owned edges. All is the other seven.
   - Q2: PASS for the C1 target, inside the run that later stopped. BOUNDARY for the store: 49 M bytes differ and the candidate alone opened Subject Detection.
   - Q3 first version: FAIL at the EXIF 6 half-press cells. Kept.
   - Q3 and Q4 second version: PASS for the candidate poses. `ok:true`. BOUNDARY for the controls: K2 is two linked edges per pose, and K1 is landscape only.
   - Acceptance t6, t6b and t6c: FAIL. Kept. The last one passed profile A, the pose change and profile B, then failed the save assertion. `ok:false`.
   - Save v1: FAIL. Stale `k1dd1` literal. Kept.
   - Save v2: FAIL. Menu passed, completion witness failed. Kept.
   - Save v3: PASS. M and E completion status 0.
   - Acceptance v1: PASS. `ok:true`. Press and release asserted. Store diffs empty.
   - Size v1: PASS. `ok:true`. AF-ON uses mirror size 4. Half-press uses legacy 0.
   - Command 27: BOUNDARY. It did not inspect a record.

9. **New versus previously established:**
   - Confirms T5: the half-press consumer follows `0x609b3c79`; AF-ON follows the builder; K1 stays on `0e 02 02 00 1b 00 27 00 00 00`; Subject Detect Off is `0x1e71[0] = 0`.
   - Confirms T5's section tally and the three inherited section-7 bytes.
   - Confirms T5's save shape: menu commit, then menu exit, M and E, completion status 0, and a reopened mirror at image `FF`.
   - Confirms T3b: `0x9a41` is two one-byte cells at offset `0x08`.
   - New: AF-ON size comes from mirror `0x9a41[0]`, position from mirror `0x5962[bank]`, and C1 dimensions from mirror `0x1dd1`, per pose. `+9` is factory 0. The size source is distinguished from legacy `0xdfa1` and from live `0x9a41[0]`, both of which stayed 0 while the AF-ON size byte was 4.
   - Confirms T7's bank map: pose words 1, 2 and 4 select banks 1, 5 and 3 when Orientation Linked is on, and bank 1 when it is off.
   - New observation: a pose publish can rewrite the live half-press `0x84d1` and `0x1dd1`.
   - The correction's acceptance does complete the save and the reopen press and release. The earlier t6c run does not.

10. **Remaining uncertainties.** Q2's 49 M-byte difference was not isolated from the extra Subject Detection navigation. Q3's K2 and K1 were not rerun on the candidate's full edge list. C2, C3 and C4, mixed link flags, and custom dimensions in more than one pose bank were not added. The size `FF` fallback against a non-zero legacy `0xdfa1` was not run. The profile does not survive in the reopened mirror.

11. **Recommended next actions.** None in this task. Five of the six correction experiment versions were used (`save_v1.mjs`, `save_v2.mjs`, `save_v3.mjs`, `accept_v1.mjs`, `exp_size_v1.mjs`). The sixth was not started. No storage decision and no hardware recommendation follow from these runs.

12. **Deviations from the brief.** The first three acceptance runners end `ok:false`, and their reopen press and release were not asserted. Those runs are kept. Q3 re-applies the All poke after the pose publishes; that poke is test setup, and the failed `exp_q234_t6.mjs` run is what showed the pose rewrite. K2 in Q1 uses the same All poke as the candidate so the half-press records match; the unpoked half-press is the probe. Q3's K2 is two linked edges per pose, and Q3's K1 is landscape only. Q2's candidate alone opens Subject Detection, and its M store differs in the 49 offsets listed above. Q1 through Q4 do not emit the 55-byte mirror on every edge; acceptance v1 and the size trial do. Command 27 did not summarise a record. Command 30 cannot hash its own wrapper `.exit`.
