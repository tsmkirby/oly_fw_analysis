# T6 result

1. **Task identifier and brief version used:** T6, brief version 2026-11-19. Section 0 of that brief overrides the rest. The prototype is EMULATOR-ONLY. It is not a firmware image, not a storage decision, and not Subject Detect On.

2. **Research baseline used:** Z5 from `ref/analysis/button-af/readiness/t5-afon-button-handoff/` (README, `out/design.md`, `out/target-bytes.md`, `out/overlay-changed-bytes-c1.csv`, `scripts/zone_session_k1.mjs`). The mirror layout is T3b `profile-layout.md`. Orientation is T7 `pose.mjs`, imported from `ref/tasks/T7-orientation-producer/run-20261119-072701/work/scripts/pose.mjs` and not edited. The T5 decision carries the reopen release into this task. Main image `inputs/00_0100_50000020.decoded.bin`. Resource image `inputs/02_0106_458c0020.decoded.bin`. File offset is the runtime address minus `0x60021020`. Ghidra was not run. `om-emu` was not modified. NVRAM was the session file passed by `zone_session_k1.mjs`, not `OM_EMU_NVRAM`.

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
   - 15 `accept_runner_t6c.mjs` exited 1. Profile A and profile B passed on session c1. The save log was empty. `accept-done` is `ok:false`.
   - The manifest command is the last one and is named in `work/evidence-manifest.json`.

4. **Files examined:** Stock image at file offset `address - 0x60021020`. Home builder `0x60a8f6bb` through the Z5 window, including `0x60a8f708`, `0x60a8f71c`, `0x60a8f71f`, `0x60a8f726`, `0x60a8f73e` (`0xdfa1`), `0x60a8f75a` (`0x99d2`), `0x60a8f770` (`0x1e01`), `0x60a8f7bb` (kind 2 stores 526). Getter `0x60063380`. Setter `0x60063431`. Converter `0x609b3ecd` and jump table `0x60a7da08`. Half-press writer `0x609b3c79`. Focus converter `0x604050e5`. Consumer `0xa33ca384`. Zone byte `0xa031e920`. Mirror `0xa031eeb0` (cached `0x6031eeb0`), 55 bytes. Pose word `0xa32c568c`. Link cells `0x1db1[0]` and `0x1dc1[0]`. Subject Detect key `0x1e71[0]`. Listings: T5 `out/disasm-home-k1.txt` and `out/disasm-converter-k1.txt`.

5. **Files created:** Under `work/` only. Scripts, `work/out/` (design, field table, CSV, listings, JSONL, screenshots, `cmd/`), this file, and `work/evidence-manifest.json`. The manifest lists them. Nothing was written under `ref/`, `inputs/`, or `om-emu`.

6. **Findings:**
   1. STATIC. The stock image at `0x60a8f708` is 20 bytes of `0xFF`. The home builder is overlay code. The converter listing matches the stock image, 45 instructions, 0 mismatches (`work/out/listing-check-t6b.txt`).
   2. STATIC. Applying the Z5 CSV reproduces the home listing except three bank pointers moved by `+0x3e0` (`0x60a8f6e7`, `0x60a8f6f2`, `0x60a8f6fd`) and the 20-byte window at `0x60a8f708` (`work/out/listing-check-t6c.txt`).
   3. DATA. The one change replaces 15 of those 20 proposed bytes. The new bytes call getter `0x60063380` and return to `0x60a8f71c`. All 15 rows are section 4, source `profile-read`. The CSV still has 3262 rows: section 1 = 1308, section 2 = 95, section 4 = 1856, section 7 = 3. The only section-7 rows are `0x610bf5e3`–`0x610bf5e5`, labelled as the inherited central-edge call site (`work/out/section-rows-t6.json`, `work/out/overlay-profile-diff-t6.txt`).
   4. OBSERVED-EMU. With no profile hook, shutter S1's consumer follows the stock writer `0x609b3c79`. AF-ON's consumer follows the builder. Zone byte 0 makes that builder record the All target `0e 02 02 00 01 00 01 00 00 00`. Poking half-press `0x84d1=2`, `0x1dd1[0]=1`, `0x1dd1[1]=1` and `0x99a1[0]=0` makes the next S1 record that same All target (`work/out/probe-base-t6.jsonl`).
   5. OBSERVED-EMU. `0x1e71[0]` is 0 after S-AF setup, without a write to it. The stock AF-tab highlight is `Subject Detection`, and that screen's texts include `Off` and `On`. 0 is the Off row. `0x90a1` reads `[1, 1]` and is not Subject Detect (`work/out/probe-base-t6.jsonl` step `af-tab`; Q1 subject steps).
   6. OBSERVED-EMU. Q1, one combined change. Half-press is All. The mirror seed is test setup: bank 1 zone Small, position 529. After every one of the 12 edges the AF-ON target is `11 02 03 00 01 00 01 00 00 00`, owner follows `[1,0,2,0,1,2,1,0,2,2,2,0]`, the half-press cells stay the poked All cells, and the 55 mirror bytes stay the seed. K2, Z5 with the same poke and no seed, keeps the All target on AF-ON and the mirror at `0xFF`. K1, no overlay, keeps `0e 02 02 00 1b 00 27 00 00 00` (`work/out/edges-q1-t6.jsonl`).
   7. OBSERVED-EMU. The getter hook's first logged returns include `0x609b3c89` with `inConv` false, and those calls are passed through. Q1's shutter edges stay the All record while AF-ON is Small, so the hook does not replace the stock writer (`work/out/edges-q1-t6.jsonl` step `q1-candidate-hook`).
   8. OBSERVED-EMU. Q2. Mirror C1 is zone 6, position 529, mirror `0x1dd1[2]=5` and `[3]=7`. Half-press `0x1dd1[2]` and `[3]` stay 3. AF-ON is `11 02 07 00 05 00 07 00 00 00`. The hook counted 24 mirror dimension reads. K2 AF-ON stays All (`work/out/edges-q234-t6.jsonl`).
   9. OBSERVED-EMU. Publishing EXIF 6 rewrote half-press `0x84d1` from 2 to 3 and `0x1dd1` from `[1,1,3,...]` to all 3s. Link flags stayed 1. That run stopped there (`work/out/edges-q234-t6.jsonl` step `q3-on-exif6-half`).
   10. OBSERVED-EMU. Q3, after re-applying the All poke as test setup once the pose has published. Orientation Linked on: landscape (pose word 1) Small at 529; EXIF 6 (pose word 2) Single at 532, `14 02 00 00 01 00 01 00 00 00`; EXIF 8 (pose word 4) Cross at 535, `17 02 03 00 01 00 01 00 01 00`, priority 1 from half-press `0x1df1[0]`. Orientation Linked off: all three poses stay Small at 529, bank 1. K2 AF-ON stays All. K1 stays the stock record (`work/out/edges-q34-t6.jsonl`).
   11. OBSERVED-EMU. Q4. Focus sid 289 and active sid 25 are both 1, set through converter `0x604050e5`. The Q1 Small record is unchanged on AF-ON. The half-press stays All (`work/out/edges-q34-t6.jsonl` step `q4b-candidate-e2`).
   12. OBSERVED-EMU. Acceptance session c1, before the save check: profile A is Small at 529 for 12 edges; the pose then changes to EXIF 6 and the mirror gains bank 5 as C1 at position 540 with dimensions 5 and 7; the next AF-ON target is `1c 02 07 00 05 00 07 00 00 00`. The following menu close returns to `shooting` and `store_log.nvram.saves` is empty. The run ends `ok:false`. The reopen press and release were not reached (`work/out/accept-t6c.jsonl`).
   13. INFERRED. The hook's uninitialised path is: mirror `0xFF` uses the zone byte, mirror size `0xFF` uses 0, mirror position `0xFFFF` uses 0, and `+9` is 0. Kind 2 still forces position 526, so a fresh All zone is `0e 02 02 00 01 00 01 00 00 00`. K2 with a `0xFF` mirror produced that record, but K2 does not install this hook, so that observation is the Z5 zone byte, not this fallback branch. The branch itself was not taken in a candidate session.

7. **Evidence for each claim:** The file and step named on that line. The overlay bytes are `work/out/overlay-profile-diff-t6.txt`. The section tally is `work/out/section-rows-t6.json`. Addresses and the field table are `work/out/design.md` and `work/out/target-fields.md`.

8. **Tests and outcomes:**
   - Listing checks 02 and 03: BOUNDARY. They exited 1 because the builder is overlay and three pointers were relocated. The reports are the evidence.
   - Section check 08: PASS. No row outside the three inherited bytes is in section 6 or 7.
   - Probe 05: PASS as observation. Not a behaviour experiment.
   - Q1: PASS. `ok:true`.
   - Q2: PASS, inside the run that later stopped.
   - Q3 first version: FAIL at the EXIF 6 half-press cells. Kept.
   - Q3 and Q4 second version: PASS. `ok:true`.
   - Acceptance, three versions: FAIL. The last one passed profile A, the pose change and profile B, then failed the save-completion assertion. `ok:false`. The version cap stopped a further runner.

9. **New versus previously established:**
   - Confirms T5: the half-press consumer follows `0x609b3c79`; AF-ON follows the builder; K1 stays on `0e 02 02 00 1b 00 27 00 00 00`; Subject Detect Off is `0x1e71[0] = 0`.
   - Confirms T5's section tally and the three inherited section-7 bytes.
   - New: AF-ON size comes from mirror `0x9a41[0]`, position from mirror `0x5962[bank]`, and C1 dimensions from mirror `0x1dd1`, per pose. `+9` is factory 0.
   - Confirms T7's bank map: pose words 1, 2 and 4 select banks 1, 5 and 3 when Orientation Linked is on, and bank 1 when it is off.
   - New observation: a pose publish can rewrite the live half-press `0x84d1` and `0x1dd1`.
   - Does not confirm T5's save-and-reopen for this profile. That run did not complete.

10. **Remaining uncertainties.** The menu close used here returned to shooting without an S-NVRAM M or E write, so it is not known whether a completed native save leaves the mirror at image `0xFF` or changes any store byte relative to K2. The hook's `0xFF` fallback branch was not taken on a candidate. Whether the half-press poke would have been inside a saved store was not measured.

11. **Recommended next actions.** One new acceptance runner, past this task's six-version cap: dirty the settings store the way T5's menu commit does, assert `store_log.nvram.saves` contains M and E, compare those banks with K2, then assert the reopen AF-ON press and its release. Do not treat this result as that acceptance.

12. **Deviations from the brief.** The acceptance run does not end `ok:true`, and the reopen press and release were not asserted. Six experiment versions had already been used (`exp_q1_t6.mjs`, `exp_q234_t6.mjs`, `exp_q34_t6.mjs`, `accept_runner_t6.mjs`, `accept_runner_t6b.mjs`, `accept_runner_t6c.mjs`), so no further runner was started. Q3 re-applies the All poke after the pose publishes; that poke is test setup, and the failed `exp_q234_t6.mjs` run is what showed the pose rewrite. K2 uses the same All poke as the candidate so the half-press records match; the unpoked half-press is the probe. No other deviation.
