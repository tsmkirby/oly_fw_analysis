# T3a result

1. **Task identifier and brief version used:**
   T3a, AF-ON zone row on page 27 with a RAM-only profile. Brief version 2026-11-18. Agent Grok 4.7. Section 0 was followed: writes are under `work\`, `om-emu` was not modified, and no firmware image was written. `OM_EMU_NVRAM` stayed off. No persistence-check store was created.

2. **Research baseline used:**
   `ref\PROJECT-STATE.md` §§1–3 and §6 Q4/Q5. `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §1 T1 result, §6, the live third-row experiment, and §8. `ref\analysis\button-af\readiness\t1-page27-mapping\` (row layout and `page27_probe.mjs`). `ref\HARDWARE-STAGE0-RECORD.md` owned RAM and section map. `ref\tasks\T2-cell-ownership\run-20261117-220544\work\out\verdict-v2.md` capacity table. `ref\scripts\om_emu_af_live_probe.mjs` third-row fixture. Main image `inputs\00_0100_50000020.decoded.bin` and resource `inputs\02_0106_458c0020.decoded.bin` (hashes in the manifest).

3. **Work performed:**
   Static scans, then an overlay of the section-1 tail, then OM-Emu probes. Commands that produced the evidence (cwd `ws`, completed output in the JSONL named here or in the tool log):
   - `python -I work\scripts\static_afon_v1.py` → `work\out\static-afon-v1.txt`
   - `python -I work\scripts\static_afon_v2.py` → `work\out\static-afon-v2.txt`
   - `python -I work\scripts\build_overlay_v2.py` → `work\out\overlay-changed-bytes.csv` (140 bytes)
   - `node26 work\scripts\afon_zone_probe_v1.mjs om-emu discover work\out\discover-v1.jsonl`
   - `node26 work\scripts\afon_zone_probe_v2.mjs om-emu discover work\out\discover-v2.jsonl`
   - `node26 work\scripts\afon_zone_probe_v3.mjs om-emu discover work\out\discover-v3.jsonl`
   - `node26 work\scripts\afon_zone_probe_v4.mjs om-emu discover work\out\discover-v4.jsonl`
   - `node26 work\scripts\afon_zone_probe_v5.mjs om-emu discover work\out\discover-v5.jsonl`
   - `node26 work\scripts\afon_zone_probe_v6.mjs om-emu discover work\out\discover-v6.jsonl`
   - `node26 work\scripts\afon_zone_probe_v7.mjs om-emu discover work\out\discover-v7.jsonl`
   - `node26 work\scripts\afon_zone_probe_v8.mjs om-emu discover work\out\discover-v8.jsonl`
   - `node26 work\scripts\afon_zone_probe_v9.mjs om-emu discover work\out\discover-v9.jsonl`
   - `node26 work\scripts\afon_zone_probe_v10.mjs om-emu discover work\out\discover-v10.jsonl` (kind 7)
   - `node26 work\scripts\afon_zone_probe_v10.mjs om-emu control work\out\siblings-v10.jsonl`
   - `node26 work\scripts\afon_zone_probe_v10.mjs om-emu control work\out\siblings-up-v10.jsonl`
   - `node26 work\scripts\afon_zone_probe_v10.mjs om-emu discover work\out\discover-v10b.jsonl`
   - `node26 work\scripts\afon_zone_probe_v10.mjs om-emu discover work\out\discover-v10c.jsonl`
   - `node26 work\scripts\afon_zone_probe_v10.mjs om-emu discover work\out\discover-kind1.jsonl`
   - `node26 work\scripts\afon_zone_probe_v11.mjs om-emu discover work\out\discover-v11.jsonl`
   Probes v1–v4 established the drawn row and the direct get/set. v5–v11 traced why OK does not open the zone list. v8–v10's type and kind overrides are experiments, marked EMULATOR-ONLY in the scripts, and are not the delivered route.

4. **Files examined:**
   Page 27 descriptor `0x6158f0f8`, rows `0x6158dc44` and `0x6158dc68`, source record `0x61529ce8`, zone list `0x6158ba1c`, page 28 descriptor `0x6158f10c`. Getter/setter `0x6041931e`, `0x6041937f`, `0x60419446`, `0x60419696`. Editor lookup `0x604058bc`. Open path `0x61203e81` and draw path `0x61203a81`. Provider constructor `0x611afaa1`, id getter `0x611af938`. Decompiled copies under `ref\analysis\decompiled-main\functions\`.

5. **Files created:**
   Under `work\scripts\`: `static_afon_v1.py`, `static_afon_v2.py`, `build_overlay_v1.py`, `build_overlay_v2.py`, `make_probe_v2.py` through `make_probe_v6.py`, `afon_zone_probe_v1.mjs` through `afon_zone_probe_v11.mjs`.
   Under `work\out\`: `overlay-changed-bytes.csv`, `design.md`, `static-afon-v1.txt`, `static-afon-v2.txt`, `discover-v1.jsonl` through `discover-v11.jsonl`, `discover-v10b.jsonl`, `discover-v10c.jsonl`, `discover-kind1.jsonl`, `siblings-v10.jsonl`, `siblings-up-v10.jsonl`, and the `afon-page-v*.png` / `afon-chooser-v*.png` screenshots those probes wrote.
   `work\result.md` and `work\evidence-manifest.json`. The manifest lists every hashed output.

6. **Findings:**
   1. STATIC. UI id `0x3D6F` is outside every range of `0x60419446` and has no `u32`, `mov`-imm16, or `cmp`-imm16 in the main image.
   2. DATA. The third row at `0x6031e978` points its option list and its alternate list at page 28's 10-record list `0x6158ba1c`, with text id `0x0DD2`.
   3. OBSERVED-EMU. With the overlay and the section-7 redirects, page 27 draws three rows. The third label resolves to `@A040@AF Target Mode`. Two native downs move the highlight onto it.
   4. OBSERVED-EMU. The profile byte at `0xa031e920` and `0x6031e920` starts at 0. A direct call of the hooked getter returns 0; the hooked setter stores 2 and a second call restores 0. `0x60419315(2154)` still returns 1.
   5. OBSERVED-EMU. After the source redirect, the live provider count is 3 and its id list is `2154, 2155, 0x3D6F`. Extending it further is unnecessary.
   6. OBSERVED-EMU. OK on the highlighted third row does not open the 10 zone options. The texts stay the AF Button page (`discover-v4.jsonl` `chooser`, `discover-v6.jsonl` `chooser`, screenshot `afon-chooser-v6.png`).
   7. OBSERVED-EMU. `0x61203470` returns 1 on this page. `0x61203e81` therefore does not take the path that reads the alternate option pointer.
   8. OBSERVED-EMU. Forcing that function to return 2 makes OK match setting `0x3D6F`, then reject editor kind 11. Kinds 4 and 7 draw unrelated sliders. Kind 1 draws no new widget. This force is not part of the delivered route.
   9. OBSERVED-EMU. OK on stock row 0 enters functions in `0x610e0000`–`0x610f0000` that OK on the zone row does not enter.
   10. OBSERVED-EMU. Opening the menu changes custom-size key `0x1dd1` indices 0 and 1 from `[3, 3]` to `[27, 39]` before the zone row is touched. The same change appears in the stock control (`siblings-v10.jsonl`). Priority stays `[1, 1]` in runs that do not confirm a priority row.
   11. INFERRED. The value hooks are sufficient for a direct read and write of the RAM byte and are not sufficient to open the editor. A native open path is still required. See `work\out\design.md`.

7. **Evidence for each claim:**
   1. `work\out\static-afon-v2.txt`. Map ends and the quiet-id scan.
   2. `work\out\overlay-changed-bytes.csv` rows for `0x6031e978`–`0x6031e99b`. `design.md` quotes the 36 bytes.
   3. `work\out\discover-v6.jsonl` steps `af-button-page`, `down-1`, `chooser`. Screenshot `work\out\afon-chooser-v6.png`.
   4. `work\out\discover-v6.jsonl` steps `direct-get`, `direct-set`, `direct-restore`, `stock-get-still-works`.
   5. `work\out\discover-v6.jsonl` step `provider-before`: `size` 3, id bytes `6a 08 6b 08 6f 3d`.
   6. `work\out\discover-v4.jsonl` step `chooser` (texts unchanged, no `sentinel-read`). `work\out\afon-chooser-v6.png`.
   7. `work\out\discover-v5.jsonl` step `open-type`, `d0` 1. No `open-virtual` event. Assembly `0x61203e9b` compares with 2; `0x61203ecd` returns when viewer+`0x13e4` is 0.
   8. `work\out\discover-v8.jsonl` steps `open-match` (`d0` 15727) and `open-reject` (`d0` 11). `work\out\afon-chooser-v9.png` (kind 4). `work\out\discover-v10.jsonl` and the kind-7 frame. `work\out\discover-kind1.jsonl` and its chooser frame. `work\out\discover-v10b.jsonl` `records` and `typeKind` 11.
   9. `work\out\discover-v11.jsonl` step `editor-trace`: `onlyStock` lists 15 addresses, `onlyZone` is empty. Help string `0x127c` is fetched from `0x610e1cb4` inside `FUN_610e1bc4` (`discover-v10c.jsonl` `help-caller`).
   10. `work\out\discover-v6.jsonl` `strings` custom `[3, 3]` versus `cells-before-zone` custom `[27, 39]`. `work\out\siblings-v10.jsonl` `cells-before-zone` shows the same `[27, 39]` with no overlay.
   11. Claims 4 and 6 together. `work\out\design.md` lists the insertion points.

8. **Tests and outcomes:**
   - Three rows, third label `@A040@AF Target Mode`, native downs reach it: PASS (`discover-v6.jsonl`, `afon-chooser-v6.png`).
   - Opening the row shows the 10 zone options: FAIL. OK leaves the AF Button page on screen.
   - Confirm stores the chosen value in the RAM byte: FAIL. The chooser never opened, so no confirm was possible. Direct setter writes are a unit check, not this test.
   - Cancel leaves the byte unchanged: BOUNDARY. The byte stayed 0 because OK did not write it, not because a chooser was cancelled.
   - Stock rows 2154/2155 stay `[1, 1]` when the zone row is only highlighted: PASS (`discover-v6.jsonl` `chooser`). A later extra OK in v5 and v8/v9/v10 confirmed the priority editor instead and is not a zone-row result.
   - Half-press and AF Home cells are not written by the zone row: PASS for the actions that were possible (highlight and a no-op OK). `0x99a1`, `0x9a41`, `0x5962`, `0x9fa1`, `0x99d2`, `0xdfa1`, `0x1ea1` match the pre-edit read. `0x1dd1` changes on menu entry in the stock control as well.
   - Persistence, byte-identical store, and a new session returning the default: not run.
   - Pages 25, 26, and 28 versus a control: not run.
   - Overlay bytes outside compressed sections: PASS for the 140 bytes in `overlay-changed-bytes.csv` (all in section 1, stock `0xFF`). Section 7 edits are runtime writes, not overlay bytes.
   - Every hook used for the delivered route is named `EMULATOR-ONLY` in `afon_zone_probe_v4.mjs` (value getter, setter, mapped getter, index getter).

9. **New versus previously established:**
   1. New. The research left the UI id open.
   2. Confirms AFON-MENU-RESEARCH §6: page 28's list is `0x6158ba1c`, 10 records. New application of text id `0x0DD2` on page 27.
   3. Confirms the live third-row experiment: extending the source record draws the third row. New id and label, not the borrowed setting 1712.
   4. New. RAM profile at `0x6031e920`, as the stage-0 record specified, reached through the value getter and setter rather than a stock key.
   5. Confirms `0x611afaa1` copies the source count. New measurement that the copy already contains `0x3D6F` when the source is patched before the page is entered.
   6. Contradicts the hope that the descriptor redirect plus a setting id is enough to open the editor. The research said the producer and the editor writes were not yet demonstrated.
   7. New. Page 27's list type is 1, and `0x61203e81` returns early on that type.
   8. New. The type-2 path's kind for this page is 11, which that function rejects.
   9. New. The stock priority editor is the `0x610e*` family, not `0x61203e81`.
   10. New measurement. Menu entry moves `0x1dd1` on a stock camera too.
   11. New.

10. **Remaining uncertainties.**
    The widget kind page 28 uses for the same 10-option list was not measured, because that page was not opened. The parent of AF Button on AF menu page 2 is Subject Detection, C-AF Setting, AF Button, and Eye Detection Frame (`siblings-v10.jsonl`); "AF Target Mode" is not on that page. Whether kind 0, 3, or 5 on the forced type-2 path would show the zone icons is untested; kinds 1, 4, and 7 did not. The glyph for value 0 is described from the screen as a grid marked "All"; no string id for that word was read. `0xA70F` was not proved absent from the setting registry.

11. **Recommended next actions.**
    Open stock page 28, log `0x6120345d`'s return and the object at model+`0x58`, and compare it with page 27's kind 11. Then make OK on `0x3D6F` use that same editor with list `0x6158ba1c`, writing only the RAM byte. After that, run the two fresh sessions, the stock control, pages 25/26/28, and the `work\out` NVRAM store comparison the brief asks for.

12. **Deviations from the brief.**
    The 10-option editor does not open, so confirm, cancel, the two-session acceptance, the other shared pages, and the persistence compare were not run. Get and set are EMULATOR-ONLY hooks, which the brief allows as a proof of the value path; they are not presented as native code. No hardware recommendation.
