# T3b result

1. **Task identifier and brief version used:** T3b, brief version 2026-11-19, correction round in brief §5 after Sol review `run-20261119-062241-review` REJECT. Section 0 overrides the rest. The coordinator amendment replaces §2 item 4's cancel rollback with stock MENU parity.

2. **Research baseline used:** `brief.md`, `TASK.md`, `templates/result.md`, `audit/previous-review.md`, `ref/PROJECT-STATE.md`, `ref/HARDWARE-STAGE0-RECORD.md`, `ref/analysis/button-af/FEATURE-SPEC.md`, `ref/analysis/button-af/AFON-MENU-RESEARCH.md`, `ref/analysis/button-af/readiness/t5-afon-button-handoff/README.md` and `out/target-bytes.md`, `ref/tasks/T2-cell-ownership/run-20261117-220544/work/out/verdict-v2.md`, `ref/tasks/T3j-afon-acceptance-assertions/brief.md` §0, `ref/tasks/T5-afon-button-handoff/brief.md` §0 and §5. Firmware input `inputs/00_0100_50000020.decoded.bin` and the 0106 image. Hashes are in `work/evidence-manifest.json`, written after this file.

3. **Work performed:** Confirmed measurements were kept. Four new experiment versions, which is the cap: `stock_gaps_f1.mjs` (command 19), `stock_gaps_f2.mjs` (command 20), `route_f2.mjs` (command 23), `accept_f3.mjs` (command 25). Static check `flag_bytes_f1.py` (command 18). Summaries are commands 22, 24, 26 and 27. Command 21 is an empty `python -c` whose quotes the shell stripped; it is not evidence. Every command went through `work/scripts/run_logged.mjs`. No script was edited after it ran.

4. **Files examined:** Stock image `inputs/00_0100_50000020.decoded.bin`. Z5 CSV `work/out/overlay-changed-bytes.csv` (3262 rows, unchanged this round). Getter `0x60063380`, setter `0x60063431`, mapped setter `0x6041937f` calling the setter at `0x604193c0` with return `0x604193c7`. Owned tail `0x6031e920`–`0x6031f000`. Mirror `0xa031eeb0`–`0xa031eee6`. Prior scripts `route_e1.mjs`, `accept_e3.mjs`, `stock_probe_m1.mjs`, `stock_edit_m2.mjs` were read and not edited.

5. **Files created:** Under `work/` only. New this round: `work/scripts/flag_bytes_f1.py`, `stock_gaps_f1.mjs`, `stock_gaps_f2.mjs`, `show_f2.py`, `route_f2.mjs`, `show_route_f2.py`, `accept_f3.mjs`, `show_accept_f3.py`, `show_accept_f3b.py`, and the manifest script run after this file. Outputs: `work/out/flag-bytes-f1.json`, `stock-gaps-f1.jsonl` and its screenshots, `stock-gaps-f2.jsonl` and its screenshots, `route-f2.jsonl` and `route-f2-02-ok-up.png`, `accept-f3.jsonl` and `accept-f3-*.png`, `import-inventory-f1.json`, `import-inventory-f3.json`, nvram files for those runs, and `work/out/cmd/18` through the manifest command. `work/result.md`, `work/out/design.md`, `work/out/profile-layout.md`, and `work/out/stock-target-screen.md` were updated in place. The full list and hashes are in the manifest.

6. **Findings:**

   1. OBSERVED-EMU. The stock direct screen is `SS_MENU_LV/ID_ST_MENU_DIRECT`. Arrows open it. OK opens the color-profile page. MENU does not restore the change index. Confirmed again by `stock-gaps-f2` `cancel-menu` (2657 calls, cap not hit, zone stays 1) and by `accept-f3` control `p-menu`.
   2. OBSERVED-EMU. Open and cancel traces now start before the key. `stock-gaps-f2` `open-up` is 1938 unique calls, cap 20000 not hit, screen `direct`. The earlier 500-entry cap is not the measurement used here.
   3. OBSERVED-EMU. The stock editor that writes `0x1dd1` indices 2–9 is AF Target Mode Settings. Path: menu, Left until "AF Target Settings", OK, five Down, Right, main dial, sub dial, OK. Dials do not write. OK writes `0x1dd1[0]=5`, `[1]=1`, `[2]=5`, `[3]=1` from a 3×3 start, and the setter log also shows `0x1de1[0]`, `0x1de1[1]`, `0x1df1[0]`, `0x1df1[4]`. Caller return `0x604193c7`.
   4. OBSERVED-EMU. A stock direct-screen C1 frame exists: `work/out/stock-gaps-f2-11-custom-direct-hold.png`, after the native setter wrote `0x5a11[0..10]=1`. Dial order from zone 1 is 2, 3, 5, 10, 6. Title-band hashes for All, Single, and C1 are recorded in `work/out/stock-target-screen.md`.
   5. STATIC. The mode flag is `0xa031eef7` / `0x6031eef7`. `0x6031eee7`–`0x6031eef7` are image `FF` and are not Z5 rows (`accept_f3.mjs` boot check, and `flag-bytes-f1.json` for `0x6031eee7`). `0x6031e91f` is outside the owned tail. The 55-byte mirror is unchanged. `0x1de1` is the next 8 bytes and `0x1df1` the 8 after that.
   6. OBSERVED-EMU. With the flag set, the same up/dial/right/menu keys write the profile and leave every tracked half-press cell unchanged. `accept-f3` session `c1` steps `p-up`, `p-dial`, `p-right`, `p-menu`, `p-shoot` passed, including the All and Single title hashes. MENU cleared the flag. The profile matched the control's half-press cells. This is the MENU-parity amendment. `accept-e3`'s cancel failure is kept and is not a pass; the amendment supersedes that expect.
   7. OBSERVED-EMU. The following normal edit is partial. `c1` `h1-up` matched the control. `c1` `h1-dial` showed the Single title and wrote the same type, size, `0x84d1`, and `0x90d1[1]` as the control, and also wrote `0x5962[1]` and `0x88b2` from 526 to 529. The run stopped there with `ok:false`. The zone byte was left at 1 while the half-press change index was still 0.
   8. INFERRED. The extra step is the stale zone byte. The hook writes `0xa031e920` from the profile and clearing the flag does not restore the half-press index. The control has no Z5 overlay, so the same address stayed `0xFF` and that dial did not step position. Restoring the half-press `0x99a1` index 1 into the zone byte on every exit is the smallest change that removes the disagreement. It was not implemented. The experiment cap is four versions.
   9. OBSERVED-EMU. The control session completed a native save after its edits. Menu leave appended a posted M save from `0x60061268` (`savesBefore` length 4, `savesAfterMenu` length 5) and the nvram file hash changed. `power_down` returned null after 10000 ms (`S-SHUTDOWN`, tasks still in WAI). The candidate never reached its save. Store identity and the reopen profile were not measured this round.
   10. OBSERVED-EMU. `route_f2` stopped on the first AF-ON frame because the title band did not yet match the Single hash at 420 ms. The screen was `direct`, the flag was 1, and the zone was 1. That record is a timing failure, not a pass. `accept_f3` waits until the literal hash is present; the title checks it reached did pass.
   11. DATA. `0xFF` in the mirror and in the flag byte is the image value: uninitialised. The hook treats flag `0xFF` as off. The editor then uses the stock half-press defaults. The Z5 zone byte in the image is 0. Subject Detect stays off (`0x90a1` is `[1, 1]`). One orientation only: `0xe91` index 3 stays 0.

7. **Evidence for each claim:** `work/out/cmd/20.out` and `stock-gaps-f2.jsonl` for claims 1–4. `work/out/cmd/22.out` for the size-editor setter records. `work/out/flag-bytes-f1.json` and the `accept_f3` boot check for claim 5. `work/out/accept-f3.jsonl` sessions `control` and `c1`, plus `work/out/cmd/25.out`, `cmd/26.out`, and `cmd/27.out`, for claims 6–9. `work/out/route-f2.jsonl` and `route-f2-02-ok-up.png` for claim 10. `work/out/stock-target-screen.md` for the orientation and route list.

8. **Tests and outcomes:**

   - `flag_bytes_f1.py`: PASS. `0x6031e91f` is outside the owned tail. `0x6031eee7` and `0x6031e924` are free `FF`.
   - `stock_gaps_f1`: BOUNDARY. Exit 0. The creative dial blocked the direct-screen open. The size-editor path on that run is still valid.
   - `stock_gaps_f2`: PASS. Open, cancel, C1 frame, and size-ok, cap not hit.
   - `route_f2`: FAIL. Stopped at `ok-up` on the title hash. Flag, screen, and zone were already right.
   - `accept_f3` control, including custom size `[5, 1]`, S1, and the menu save: PASS through `save`.
   - `accept_f3` candidate `c1` AF-ON up, dial, right, MENU parity, flag clear, and the first key of the following normal edit: PASS.
   - `accept_f3` candidate `h1-dial`: FAIL. Extra position step. Run ended `ok:false`. Session `c2`, C1 selection, the AF-ON custom-size edit, OK, S1, the candidate save, and reopen did not run.
   - `accept-e3` cancel: FAIL, kept. Superseded by the MENU-parity amendment, not regraded as a pass.
   - Section rows: the Z5 CSV was not changed. `work/out/section-rows-e1.json` remains `ok: true` with the three inherited section-7 bytes `0x610bf5e3`–`0x610bf5e5` only.

9. **New versus previously established:** Claims 1 and the 55-byte mirror confirm the previous T3b findings and the feature spec's reuse of the stock screen. Claim 3 is new: the custom-size editor was found and measured. Claim 5 contradicts the previous result's flag at `0xa031e91f`. Claim 6 confirms the coordinator amendment. Claim 7 is new and is the acceptance failure. Claim 9 partially answers the save gap; the candidate half of it is not done.

10. **Remaining uncertainties.** Whether restoring the zone byte on exit makes the following dial match the control, the AF-ON custom-size edit, C1 selection under the flag, OK and S1 exits, and a candidate save whose store matches the control. `power_down` does not finish in this player setup; the completed save path is the menu leave. The second candidate session was not started.

11. **Recommended next actions.** One new experiment, past this round's cap: on every exit write the half-press `0x99a1` index 1 back to `0xa031e920` and `0x6031e920`, then rerun the acceptance table. Keep the flag at `0xa031eef7` and the 55-byte mirror. Run the control with the Z5 overlay and the flag clear, so the zone byte exists on both sides.

12. **Deviations from the brief.** The acceptance did not end `ok:true`. C1 selection, the AF-ON custom-size edit, the OK exit, the S1 exit, the second candidate, the candidate save, and the reopen assertion were not reached. The zone-byte restore is identified and not implemented, because the four new experiment versions are used. One orientation only, stated above. `accept-e3` is not described as a pass. No firmware image was written. No section 6 or 7 byte was added. No storage decision. No hardware recommendation. Subject Detect was not switched on. The visible menu was not changed.

## Owner decision Q5

The prototype's only entry is the EMULATOR-ONLY session flag at `0xa031eef7`. It adds no row, page, or key.

1. Keep that session flag, set on entry and cleared on exit, and restore the zone byte from the half-press change index on exit. No visible menu change.
2. A second row on the AF-ON button page, or a page-29-style row, whose editor is this stock screen. That is a visible menu change and is not in the prototype.
3. A key that opens `ID_ST_MENU_DIRECT` with the flag set. The arrows already open that screen for the half-press target. Choosing a different key is not done here.
