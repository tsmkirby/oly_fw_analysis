# T3a result

1. **Task identifier and brief version used:**
   T3a, AF-ON zone row on page 27 with a RAM-only profile. Brief version 2026-11-18, including §7 (correction after Sol's review `run-20261118-053253-review`: REJECT). Agent Grok 4.7. Section 0 was followed: writes are under `work\`, `om-emu` was not modified, and no firmware image was written. `OM_EMU_NVRAM` stayed off. No persistence store was created. Item 2 is BLOCKED after four experiments, so brief §4 (item 3) was not run. A terminal `done` is script completion, not acceptance.

2. **Research baseline used:**
   `ref\PROJECT-STATE.md` §§1–3 and §6 Q4/Q5. `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §1, §6, the live third-row experiment, and §8. `ref\analysis\button-af\readiness\t1-page27-mapping\`. `ref\HARDWARE-STAGE0-RECORD.md` owned RAM. `ref\tasks\T2-cell-ownership\run-20261117-220544\work\out\verdict-v2.md` capacity table. `audit\previous-review.md`. Main image `inputs\00_0100_50000020.decoded.bin` and resource `inputs\02_0106_458c0020.decoded.bin`. Hashes are in `work\evidence-manifest.json`. The previous `work\result.md` claims are restated below only where this round still supports them, and the overstated PASS lines are downgraded.

3. **Work performed:**
   The confirmed row, label `0x0DD2`, UI id `0x3D6F`, 140-byte overlay, and runtime redirects were reused. No file from an earlier run was overwritten. New scripts and screenshots use new names.

   Correction-round commands (cwd `ws`). The final JSONL line is the last line of the named log. Shell exits below were recorded for this round.

   - `python -I work\scripts\static_page28_v12.py` → exit 0. Printed to the console. No output file was written, so that stdout was not retained.
   - `python -I work\scripts\static_page28_v12b.py` → exit 0. Same: console only, stdout not retained.
   - `python -I work\scripts\static_page28_v12c.py` → exit 0. Same: console only, stdout not retained.
   - `python -I work\scripts\static_page28_v12d.py` → exit 0. Same: console only, stdout not retained.
   - `node26 work\scripts\afon_zone_probe_v12.mjs om-emu stock work\out\stock-page28-v12.jsonl` → exit 0. Final: `{"mode":"stock","hook":"observe","step":"done","ok":false,"sawTitle":false,"sawRow":false,"opened":true,"measured":true}`. `opened:true` is that script's bitmap-count heuristic. `sawTitle` and `sawRow` are false. The screen is AF Target Mode Settings, not page 28.
   - `node26 work\scripts\afon_zone_probe_v12b.mjs om-emu stock work\out\stock-page28-v12b.jsonl` → exit 1. Final line is the `MenuWalkError` boundary (cursor inside the Movie AF list). The census lines before it are valid.
   - `node26 work\scripts\afon_zone_probe_v12c.mjs om-emu stock work\out\stock-page28-v12c.jsonl` → exit 0. Final: `{"mode":"stock","hook":"observe","step":"done","ok":false,"onPage28":false,"measured":true,"pageDump":null,"pagesSeen":[]}`.
   - `node26 work\scripts\afon_zone_probe_v12d.mjs om-emu stock work\out\stock-page28-v12d.jsonl` → exit 0. Final: `done`, `ok:false`, reason `no visited row built group 0x116 or page 28`.
   - `node26 work\scripts\afon_zone_probe_v12e.mjs om-emu stock work\out\stock-page28-v12e.jsonl` → exit 0. Final: `done`, `ok:false`, reason `page 28 not opened from the AF menu rows`. Pages logged: 61, 27, 25, 26.
   - `node26 work\scripts\afon_zone_probe_v12f.mjs om-emu stock work\out\stock-zone-v12f.jsonl` → exit 1. Final line is `PlayError: AF / metering: not wired (0x1225 is not in E147's UI_IN tables)`. No measurement. The script was left as-is.
   - `python -I work\scripts\make_probe_v12g.py` → exit 0. Wrote `work\scripts\afon_zone_probe_v12g.mjs`. No separate log.
   - `node26 work\scripts\afon_zone_probe_v12g.mjs om-emu stock work\out\stock-zone-v12g.jsonl` → exit 0. Final: `{"mode":"stock","hook":"observe","step":"done","ok":false,"page28":false,"measured":true}`.
   - `node26 work\scripts\afon_zone_probe_v13.mjs om-emu discover work\out\discover-v13.jsonl` → exit 0. Final: `{"mode":"discover","hook":"EMULATOR-ONLY","step":"done","ok":false,"profile":0,"note":"screenshots decide whether any kind drew the zone list; ok is not acceptance"}`.
   - `node26 work\scripts\afon_zone_probe_v14.mjs om-emu discover work\out\discover-v14.jsonl` → exit 0. Final: `{"mode":"discover","hook":"EMULATOR-ONLY","step":"done","ok":false,"profile":0,"sets":[]}`.
   - `node26 work\scripts\afon_zone_probe_v15.mjs om-emu discover work\out\discover-v15.jsonl` → exit 0. Final: `{"mode":"discover","hook":"EMULATOR-ONLY","step":"done","ok":false,"profile":0,"sets":[]}`.
   - `node26 work\scripts\afon_zone_probe_v16.mjs om-emu discover work\out\discover-v16.jsonl` → exit 0. Final: `{"mode":"discover","hook":"EMULATOR-ONLY","step":"done","ok":false,"profile":0,"sets":[],"note":"fourth experiment; setter must have fired to count as open"}`.

   Earlier-round commands are listed in the manifest. Their shell exits were not retained. Their final JSONL lines are in the logs. `discover-v9.jsonl` ends on the boundary `TypeError: t.includes is not a function`, and `afon_zone_probe_v9.mjs` sets `process.exitCode = 1` on that path.

4. **Files examined:**
   Page 27 descriptor `0x6158f0f8`, source record `0x61529ce8`, page 28 descriptor `0x6158f10c`, page 28 source `0x61529cf4` (group `0x116`). Zone list `0x6158ba1c`. Open path `FUN_61203e81` at `0x61203e81`, list type `FUN_61203470` at `0x61203470`, editor kind `FUN_6120345d` at `0x6120345d`, widget build `FUN_61209092` / `FUN_612090be`. Value getter `0x6041931e`, setter `0x6041937f`, mapped getter `0x60419446`, index getter `0x60419696`. Editor lookup `0x604058bc`. Provider constructor `0x611afaa1`. Decompiled copies under `ref\analysis\decompiled-main\`.

5. **Files created:**
   This round, under `work\scripts\`: `static_page28_v12.py`, `static_page28_v12b.py`, `static_page28_v12c.py`, `static_page28_v12d.py`, `make_probe_v12g.py`, `afon_zone_probe_v12.mjs` through `afon_zone_probe_v12g.mjs`, `afon_zone_probe_v13.mjs` through `afon_zone_probe_v16.mjs`.
   Under `work\out\`: `design-v12.md`, the `stock-page28-v12*.jsonl` / `stock-zone-v12f.jsonl` / `stock-zone-v12g.jsonl` logs, `discover-v13.jsonl` through `discover-v16.jsonl`, and the new screenshots (`stock-page28-v12.png`, `stock-chooser-v12.png`, `stock-page28-v12c.png`, `stock-chooser-v12c.png`, `stock-chooser-v12g.png`, `afon-page-v13.png`, `afon-kind0-v13.png`, `afon-kind3-v13.png`, `afon-kind5-v13.png`, `afon-open-v14.png`, `afon-down-v14.png`, `afon-confirm-v14.png`, `afon-cancel-v14.png`, `afon-open-v15.png`, `afon-down-v15.png`, `afon-confirm-v15.png`, `afon-kind3-v16.png`, `afon-kind5-v16.png`).
   `work\out\overlay-changed-bytes.csv` and `work\out\design.md` were not rewritten. No new overlay CSV: no new overlay bytes. `work\result.md` and `work\evidence-manifest.json` were refreshed. The manifest lists every hashed output.

6. **Findings:**
   1. STATIC. UI id `0x3D6F` is outside every range of `0x60419446` and has no `u32`, `mov`-imm16, or `cmp`-imm16 in the main image. That is absence from those scans, not absence of every computed use.
   2. DATA. The third row at `0x6031e978` points both option lists at `0x6158ba1c`, count 10, kind 4, text id `0x0DD2`, class `0x6158aeb4`. The 140 overlay bytes are stock `0xFF` and sit in uncompressed section 1.
   3. OBSERVED-EMU. With the overlay and the section-7 redirects, page 27 draws three rows. The third label resolves to `@A040@AF Target Mode`. Two native downs move the highlight onto it (`afon-page-v13.png`).
   4. OBSERVED-EMU. The profile byte at `0xa031e920` starts at 0. A direct call of the hooked getter and setter can store and restore a value, and `0x60419315(2154)` still returns 1. That is a unit check of the hooks, not a chooser confirm.
   5. OBSERVED-EMU. After the source redirect, the live provider count is 3 and its id list is `2154, 2155, 0x3D6F`.
   6. OBSERVED-EMU. OK on the highlighted third row, with no type force, does not open the 10 zone options. The AF Button page stays on screen.
   7. OBSERVED-EMU. On the pages native keys opened (25, 26, 27, 30, 31, and the AF Target Mode Settings / Orientation Linked screens), `0x61203470` returns 1. The object at model+`0x58` is `0x6247a270`, kind 11, vtable `0x6151346c`. `0x6120345d` is not called on that path. Page id 28 and group `0x116` were not constructed.
   8. OBSERVED-EMU. Forcing type 2 is an experiment, not page 28's path. Kind 0 on `0x3D6F` draws a non-modal bubble of the current record (the grid marked All) and does not take Down or OK. Kinds 3 and 5 on `0x3D6F` fire the widget constructor and draw no new control. Kind 4 drew an exposure slider. Kind 1 drew nothing. Kind 7's screenshot was overwritten and is not reproduced. None of these called the setter.
   9. OBSERVED-EMU. OK on stock row 0 enters 14 functions in `0x610e0000`–`0x610f0000` that OK on the zone row does not enter. `onlyZone` is empty. The same family opens the C-AF Area two-option chooser. `0x3D6F` does not enter it.
   10. OBSERVED-EMU. Opening the menu changes `0x1dd1` indices 0 and 1 from `[3, 3]` to `[27, 39]` on a stock session as well. v14, which is not an acceptance run, read all 10 cells as `[27, 39, 3, 3, 3, 3, 3, 3, 3, 3]` before the zone experiment. Priority stays `[1, 1]` when the priority row is not confirmed.
   11. INFERRED. Row data that already points at `0x6158ba1c` is not enough for page 27's viewer to host the 10-record editor. The smallest native change is code on the open path, stated in `work\out\design-v12.md`. Item 2 is BLOCKED.
   12. OBSERVED-EMU. v2–v4 later "chooser" / "confirmed" steps are on Subject Detection, not the zone row (`discover-v4.jsonl` steps `chooser-again`, `confirm-highlight`, `confirmed`). v9 ends `TypeError: t.includes is not a function`. v11's `stock-ok`, `back`, and `chooser` text arrays are empty. `discover-v11.jsonl` `done` has `ok:true`; that is the script finishing, not brief §4.

7. **Evidence for each claim:**
   1. `work\out\static-afon-v2.txt`.
   2. `work\out\overlay-changed-bytes.csv` for `0x6031e978`–`0x6031e99b`. Quoted in `work\out\design.md`.
   3. `work\out\discover-v6.jsonl` steps `af-button-page`, `down-1`. `work\out\discover-v13.jsonl` step `on-row`. `work\out\afon-page-v13.png`.
   4. `work\out\discover-v6.jsonl` steps `direct-get`, `direct-set`, `direct-restore`, `stock-get-still-works`.
   5. `work\out\discover-v6.jsonl` step `provider-before`: size 3, id bytes `6a 08 6b 08 6f 3d`.
   6. `work\out\discover-v4.jsonl` step `chooser`. `work\out\afon-chooser-v6.png`.
   7. `work\out\stock-page28-v12.jsonl` step `calls` (`d0` 1, `plus58` `0x6247a270`, `plus58Kind` 11, return address `0x6120362d`). `work\out\stock-page28-v12d.jsonl` visits: page 30 at `0x6158f134` returns 1 at `0x61203e9a`; groups 364, 341, 342, 280, 281; no group `0x116`. `work\out\stock-page28-v12e.jsonl` pages 61, 27, 25, 26. `work\out\stock-page28-v12.png`, `stock-chooser-v12.png`, `stock-page28-v12c.png`, `stock-chooser-v12c.png`.
   8. `work\out\discover-v13.jsonl` step `kind-try` kind 0 (match `d0` 15727, event `widget`) and `afon-kind0-v13.png`. `work\out\discover-v14.jsonl` steps `moved` and `confirmed` (`sets` empty) and `afon-down-v14.png`, `afon-confirm-v14.png`. `work\out\discover-v15.jsonl` and `afon-down-v15.png`, `afon-confirm-v15.png`. `work\out\discover-v16.jsonl` both `kind-try` lines (match 15727, `sets` empty) and `afon-kind3-v16.png`, `afon-kind5-v16.png`. Kind 4: `work\out\afon-chooser-v9.png`. Kind 1: `work\out\discover-kind1.jsonl`. Kind 7: not reproduced; surviving `work\scripts\afon_zone_probe_v10.mjs` finishes `0x6120345d` with `d0: 1`.
   9. `work\out\discover-v11.jsonl` step `editor-trace`: `onlyStock` has these 14 addresses: `0x610e09ad`, `0x610e0a9f`, `0x610e141c`, `0x610e15f4`, `0x610e2165`, `0x610e22d0`, `0x610e2360`, `0x610e24b5`, `0x610e2536`, `0x610e2da3`, `0x610e6e36`, `0x610eaf3d`, `0x610eafe0`, `0x610eb153`. `onlyZone` is `[]`. `work\out\stock-zone-v12g.jsonl` step `editor-trace` includes that set. `work\out\stock-chooser-v12g.png`.
   10. `work\out\discover-v6.jsonl` custom `[3, 3]` versus `cells-before-zone` `[27, 39]`. `work\out\siblings-v10.jsonl` shows the same `[27, 39]` with no overlay. `work\out\discover-v14.jsonl` step `before` reads all 10 of `0x1dd1`.
   11. Claims 2, 7, and 8. `work\out\design-v12.md`.
   12. `work\out\discover-v4.jsonl` lines for `chooser-again`, `confirm-highlight`, `confirmed` (texts include `Subject Detection`). `work\out\discover-v9.jsonl` final boundary. `work\out\discover-v11.jsonl` steps `stock-ok`, `back`, `chooser`, `done`.

8. **Tests and outcomes:**
   These are sampled observations. None of them is brief §4 acceptance. Item 3 was not run because item 2 is BLOCKED.
   - Three rows, third label `@A040@AF Target Mode`, two native downs reach it: sampled, still seen in v6 and again in v13. Not an acceptance pass.
   - Opening the row shows the 10 zone options: FAIL. Page 28's editor was not opened, and the four type-2 experiments did not present the 10 records as a chooser that takes keys.
   - Confirm stores the chosen value in the RAM byte: FAIL. `0x6041937f` was not called for `0x3D6F` in v13–v16. The profile byte stayed 0. Direct setter writes in earlier probes are a unit check.
   - Cancel leaves the byte unchanged: BOUNDARY. The byte stayed 0 because confirm never wrote it.
   - Stock rows 2154/2155 stay `[1, 1]` when the zone row is only highlighted: sampled in v6. v14's later OK opened the priority editor; that is not a zone-row result, and it was not paired with a stock control under the §4 key sequence.
   - Half-press and AF Home cells: sampled. Earlier probes read `0x1dd1` indices 0 and 1 only. v14 read all 10 and the home keys, and they did not change during that experiment, but that run is not the §4 pair and it did not compare a control at the same step. The menu-entry change `[3, 3]` to `[27, 39]` happens on stock too.
   - Persistence, byte-identical store, and a new session returning the default: not run.
   - Pages 25, 26, and 28 rendered in both a candidate and a control: not run. Pages 25 and 26 were opened during the stock search. Page 28 was not opened.
   - v2–v4 Subject Detection navigation: recorded, not a zone result.
   - v9: BOUNDARY. The run ends on `TypeError: t.includes is not a function`.
   - v11 `done` `ok:true`: script completion. The text arrays for `stock-ok`, `back`, and `chooser` are empty. Not acceptance.
   - Overlay bytes: the existing 140 bytes stay in section 1. No new overlay bytes this round.
   - Hooks that change behaviour are named `EMULATOR-ONLY` in the probe sources and in the JSONL `hook` field. Pass-through observers are named separately.

9. **New versus previously established:**
   1. Confirms the previous static scan. Not a proof that no computed use exists.
   2. Confirms `work\out\design.md` and AFON-MENU-RESEARCH §6. The overlay was not changed.
   3. Confirms the live third-row experiment and `discover-v6.jsonl`.
   4. Confirms the earlier direct get/set. Downgraded: it is not chooser acceptance.
   5. Confirms `discover-v6.jsonl`.
   6. Confirms the earlier no-op OK.
   7. New measurement. Contradicts the source comments in v8–v10 that call type 2 page 28's path. Page 28 was not opened, and sibling pages return type 1.
   8. New for kinds 0, 3, and 5. Corrects the kind-7 screenshot claim: withdrawn. Kind 4 and kind 1 stand as previously logged.
   9. Corrects the previous result: `onlyStock` has 14 addresses, not 15. Confirms the `0x610e*` family, and adds the C-AF Area trace.
   10. Confirms `siblings-v10.jsonl` for indices 0 and 1. The 10-cell read is new and is not an acceptance pair.
   11. New. Item 2 BLOCKED. Contradicts any reading of the previous §8 PASS block as brief §4 acceptance.
   12. New as an explicit record. The review already identified these; the previous result did not.

10. **Remaining uncertainties.**
    Page 28's zone-type editor was not measured, so its list type and widget kind are unknown. The AF Target Mode Settings checkbox list is a different screen and did not copy the `0x6158ba1c` descriptors. `0xA70F` is still not proved absent from the setting registry. The glyph for value 0 is the grid the screen marks "All"; "Single" was not measured. A native key path to page 28 may exist outside the menu rows that were visited (the AF pages' visible rows, Orientation Linked, Set Home, Select Screen, Loop Settings, and C-AF Area). No wired AF-target key was available; `afmeter` (`0x1225`) is not in E147's UI_IN tables.

11. **Recommended next actions.**
    Do not add another type-2 kind force. The next change is code: a branch for `0x3D6F` that presents the 10 records at `0x6158ba1c` and calls `0x6041937f` only on confirm, either in `0x61203e81`'s open path or as a `0x610e*` dispatch. Row bytes already point at the list. After that editor stores the RAM byte and cancel does not, run brief §4: two fresh sessions, a stock control with the same key sequence, all 10 cells of `0x1dd1` plus `0x99a1`, `0x9a41`, `0x5962`, and every `MODE_AF_HOME_AREA_*` key, pages 25, 26, and 28, and separate `OM_EMU_NVRAM` stores under `work\out\`.

12. **Deviations from the brief.**
    Item 1: page 28's zone-type row was not opened with native keys. The screens that were opened are reported in finding 7, and they are not called page 28.
    Item 2: BLOCKED after v13, v14, v15, and v16. Selecting and confirming did not reach the setter. The smallest native change is in `work\out\design-v12.md`.
    Item 3: not run, because item 2 is blocked.
    Item 4: the previous PASS lines are downgraded in §8. Subject Detection (v2–v4), the v9 exception, the v11 count of 14, the overwritten kind-7 screenshot, and the unsupported type-2 and `0xA70F` comments are recorded.
    Get and set remain EMULATOR-ONLY hooks. No hardware recommendation.
