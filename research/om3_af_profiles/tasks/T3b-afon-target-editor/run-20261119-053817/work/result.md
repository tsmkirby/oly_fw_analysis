# T3b result

1. **Task identifier and brief version used:** T3b, brief dated 2026-11-19. Section 0 of `brief.md` overrides the rest, and it inherits T3j brief §0 (which points at T3i brief §0) and T5 brief §0 and §5. Agent Grok 4.7 High. Emulator only. No firmware image was written. No byte was added in section 6 or 7. The three inherited call-site bytes `0x610bf5e3`–`0x610bf5e5` stay in the overlay, marked as the inherited central-edge patch.

2. **Research baseline used:** `TASK.md`; `brief.md`; `templates/result.md`; `ref/tasks/T3i-afon-zone-acceptance/brief.md` §0; `ref/tasks/T3j-afon-acceptance-assertions/brief.md` §0; `ref/tasks/T5-afon-button-handoff/brief.md` §0 and §5; `ref/PROJECT-STATE.md` Q5; `ref/analysis/button-af/AFON-MENU-RESEARCH.md` §1; `ref/analysis/button-af/FEATURE-SPEC.md` item 2; `ref/analysis/button-af/readiness/t5-afon-button-handoff/out/target-bytes.md`, `out/design.md`, and `out/overlay-changed-bytes.csv`. Input hashes, taken at the stock session and recorded in `work/out/import-inventory-m1.json`: main image `inputs/00_0100_50000020.decoded.bin` and the unpacked `blk00000000` both `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`; resource `blk02000000` `6d2bef74b4b2fa089f271529482f96505a170b91e79ab9b1a13f3ce8f7918226`; `inputs/02_0106_458c0020.decoded.bin` `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`.

3. **Work performed:** every command is `node26 work/scripts/run_logged.mjs NN ...`, recorded in `work/out/cmd/NN.exit`. 01 `gap_scan_m1.py`. 02 `static_keys_m1.py`. 03 `stock_probe_m1.mjs om-emu` (stock, no overlay). 04 `summarize_m1.py`. 05 `run-ghidra.cmd -postScript DisasmStockM2.java` on `0x6041937f`, `0x604193c0`, `0x6041a202`, `0x60063380`, `0x60063431`. 06 `stock_edit_m2.mjs om-emu`. 07 `summarize_m2.py`. 08 `show_a1_m2.py`. 09 `section_rows_e1.py`. 10 `route_e1.mjs om-emu`, the combined hook. 11 `gen_custom_e2.py`. 12 `custom_e2.mjs om-emu`. 13 `show_custom_e2.py`. 14 `accept_e3.mjs om-emu`, exit 1 on the cancel step. 15 `check_listings_e3.py`, 188 instructions match the image. The manifest command follows these.

4. **Files examined:** `brief.md`, `TASK.md`, `templates/result.md`, the T3i, T3j, and T5 briefs, `AFON-MENU-RESEARCH.md`, `FEATURE-SPEC.md`, the T5 readiness `target-bytes.md`, `design.md`, and overlay CSV, `om-emu/emu/src/lab/play.mjs` (key ids), `om-emu/emu/src/lab/hle.mjs` (hook), `om-emu/emu/host/nvram.mjs`, and the T5 runner `accept_runner_c3.mjs` as a pattern. Disassembly addresses: `0x6041937f`, `0x604193c0`, `0x6041a202`, `0x60063380`, `0x60063431`.

5. **Files created:** everything under `work/` listed in `work/evidence-manifest.json`. The reports are `work/out/stock-target-screen.md`, `work/out/profile-layout.md`, `work/out/design.md`, `work/out/overlay-changed-bytes.csv`, this file, and the manifest.

6. **Findings:**

   1. OBSERVED-EMU. From shooting, Up, Down, Left, and Right open `ID_ST_MENU_DIRECT`. OK opens the color-profile screen. The AF Target Settings menu page is a different editor.

   2. OBSERVED-EMU. The direct screen writes the change index (index 1), not saved index 0. The main dial cycles the offered zone and writes the current size into `0x1dd1` index 0 and 1. Arrows move `0x5962` index 1 and `0x88b2`. `0x9a41`, `0x99d2`, and `0xdfa1` do not change. OK does not copy index 1 to index 0. MENU does not restore the change indices.

   3. OBSERVED-EMU. The write value is A1 of cell setter `0x60063431`. The screen reaches that setter from mapped setter `0x6041937f`, whose D0 is the UI id and whose D1 is the value.

   4. STATIC. The listings at those addresses match the stock image, 188 instructions, `work/out/listing-check-e3.json`.

   5. OBSERVED-EMU. `0x1db1` and `0x1dc1` are 0, so the screen uses the normal bank. `rotate` and monitor-closed leave `0xe91` index 3 at 0. A second orientation was not available.

   6. DATA. The 16 bytes at `0x6031e910` cannot hold the mirror. The mirror is 55 bytes at `0xa031eeb0`. The zone byte stays at `0xa031e920`. The mode flag is the session byte `0xa031e91f`.

   7. OBSERVED-EMU. With the flag set, the same keys write the mirror and the zone byte, and the half-press cells stay at the blank-session values. With the flag clear, the same keys change the half-press cells exactly as the stock control and leave the mirror and the zone byte alone.

   8. OBSERVED-EMU. Selecting C1 writes the current size from the profile preset (`0x1dd1` index 2 and 3, here 4 and 6) into index 0 and 1. INFO does not write the preset slots. The dial does not write them either.

   9. OBSERVED-EMU. After OK, native stores M (262144) and E (196608) are byte-identical to a stock session and to a Z5 session that never opened the editor. A new session on the confirm store reads zone byte 0.

   10. OBSERVED-EMU. MENU after the AF-ON edit leaves the edited profile in place. It does not restore the profile from before the edit. Half-press cells stay unchanged.

7. **Evidence for each claim:** (1) `work/out/stock-probe-m1.jsonl` steps `open-up`, `open-ok`, `open-up-down`, `open-up-left`, `open-up-right`. (2) same file `open-up-dial-main` and `open-up-dial-sub`; `work/out/stock-edit-m2.jsonl` move and `confirm-ok`; `work/out/cmd/07.out`. (3) `work/out/cmd/08.out` and `work/out/disasm-mapped-m2.txt` at `0x6041937f` and `0x604193c0`. (4) `work/out/listing-check-e3.json`. (5) `stock-probe-m1.jsonl` `rotate-1` and `monitor-0`; `accept-e3` `store-stock` `rotate`. (6) `work/out/ram-gaps-m1.json` and `work/out/profile-layout.md`. (7) `work/out/accept-e3.jsonl` sessions `confirm` and `normal`, every step `pass: true` through `save`. (8) `work/out/cmd/12.out` steps `afon-type-3` and `c1-info`; screenshot `work/out/route-e1-08-afon-type-3.png`. (9) `accept-e3.jsonl` record `store` (`sameZ5` true, `sameStock` true, both diffs −1) and session `reopen`. (10) `accept-e3.jsonl` session `cancel` step `menu`, and `work/out/cmd/12.out` step `c1-menu`.

8. **Tests and outcomes:**

   - PASS. AF-ON confirm, two fresh candidate sessions' shared edit, plus the stock control. Move, type change, and C1 current size 4×6 land in the profile. Every listed half-press cell stays at the blank-session value. `accept-e3` session `confirm`, steps `base` through `save`.
   - PASS. A normal edit on Z5 with the flag clear matches the stock control on screen and half-press cells, and the zone byte stays 0 and the mirror's first byte stays 255. Session `normal`.
   - PASS. Stores match the stock idle session and the Z5 idle session. Reopen reads zone byte 0.
   - PASS. Section check: 3262 rows, sections 1, 2, 4, and the three permitted section-7 bytes. `work/out/section-rows-e1.json`.
   - FAIL. Cancel. The brief says a repeated edit that is cancelled changes nothing. MENU leaves the screen and leaves the edited profile where the edit put it. The expect was the pre-edit profile. `accept-e3` step `cancel` `menu` failed, and the run stopped with `ok: false`. Stock MENU does the same to the half-press change indices.
   - BOUNDARY. Custom preset slots. The screen reads them and copies them into the current size. No key tried on this screen writes index 2–9.
   - BOUNDARY. Orientations. One pose. `0xe91` index 3 stayed 0 after rotate and after closing the monitor.

9. **New versus previously established:** Findings 1–3 are new measurements of the direct screen. The cell ids and the UI ids confirm `AFON-MENU-RESEARCH.md` §1. Finding 6 confirms the T5 placement of the zone byte and the relocated block, and adds the mirror beside it. Finding 7 is new. Finding 9 confirms that the zone byte is not kept in the native stores. Finding 10 is new and is why the cancel criterion fails.

10. **Remaining uncertainties.** The code addresses of the `AF_Target_Actuator` methods are not resolved from the strings; the executed path is the getter and the setter. The direct screen's custom-preset editor, if it has one, was not found: INFO, both dials, and the arrows do not write `0x1dd1` index 2–9. CCW and CW banks were not selected because the emulator did not change the pose. Whether a native build should branch at `0x6041937f` or at `0x60063431` is the same behaviour; the prototype uses the getter and the setter.

11. **Recommended next actions.** Owner decision Q5, in `work/out/design.md`: (1) keep the session flag, which is what this prototype uses; (2) a second row on the AF-ON button page, or a page-29-style row, whose editor is this stock screen; (3) a key that opens the same direct screen with the flag set. The prototype adds none of those visible entries. Storage of the mirror is a later task. The button does not yet read these fields; that is T6.

12. **Deviations from the brief.** The cancel criterion fails, and that failure is kept: the script was not re-run with a weaker expect. The stock screen writes each key into the change index immediately, and MENU does not restore it, so a routed cancel cannot restore the profile without adding behaviour the screen does not have. No other deviation. No firmware image was written. No storage decision was made. No hardware recommendation is made. Subject Detect was not switched on: `0x90a1` stayed `[1, 1]`, and S1 and AF-ON were not pressed.
