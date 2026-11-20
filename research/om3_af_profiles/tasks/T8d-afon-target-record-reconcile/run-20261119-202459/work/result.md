# T8d result

## Writer rule

The stock half-press writer `0x609b3c79` does not read `0x99a1`. It reads seven cells and then applies two overrides. The shadow replace at `0xa33f2cbe` did not run on any swept zone (`flagBe` 0). During an AF-ON press the installed hook answers the writer's `0x88b2[0]` read from the mirror cell `0x5962[bank()]`, the saved index, rather than from mirror offset `0x22`.

| Record byte | Writer read | Rule, from the image |
| --- | --- | --- |
| +0 position | `0x88b2[0]` | Copied. Kind 2 stores 526 instead (`0x609b3d1a`, `mov 0x20e,D0`). The AF-ON feed returns mirror `0x5962[bank()]`. |
| +2 kind | `0x84d1[0]` | Copied. |
| +3 size key | `0x9a41[0]` | Copied. Every swept press returned 0. |
| +4 vertical | `0x1dd1[0]` | Copied. |
| +6 horizontal | `0x1dd1[1]` | Copied. |
| +8 priority | `0x1df1[0]` | Cleared when kind is 0, kind is 2, or kind is 3 and vertical is 3 (`0x609b3d33`). |
| +9 | `0x1e01[0]` | Copied. Every swept press returned 0. The AF-ON feed returns 0. |

The writer returns at `0x609b3d6d` (`ret [d2,d3,a2],0x20`). The dial writes the zone's kind into `0x84d1[0]` and its dimensions into `0x1dd1[0]` and `0x1dd1[1]` before S1. The writer then copies those cells. That is how the zone changes +4 and +6 without a `0x99a1` immediate in the writer.

The T6 converter `0x609b3ecd` does the opposite for the preset zones. Its jump table `0x60a7da08` sends UI 0 to kind 2 and 1×1, UI 1 to kind 0 and 1×1, UI 2 to kind 3 and 1×1, and UI 3, 5 and 10 to kind 3, 1×1, and the live priority. UI 6–9 (C1–C4) use kind 7 and `0x1dd1` indices 2/3, 4/5, 6/7, 8/9. The builder then stores that kind and those 1×1 dimensions. The converter returns at `0x609b3fda` (`ret [d2,d3,a2],0x14`). The two paths diverge at +2, +4 and +6: the writer copies `0x84d1[0]`, `0x1dd1[0]` and `0x1dd1[1]`; the converter invents kind and 1×1 from the zone UI.

Zone values, from descriptor `0x6061fd9c` / table `0x60617864` and the face list `0x6158ba1c`: 0 All, 1 Single, 2 Small, 3 Cross, 5 Mid, 10 Large, 6 C1, 7 C2, 8 C3, 9 C4. The stock dial offers the six whose `0x5a11` bits are 1 at reset. C1–C4 are off until `0x5a11[5]` is set for the custom row.

## Zone table

Post-change pass/fail from `proof-t8d10`. K1e is the overlay S1 reference. The candidate column is the stock writer fed from the mirror, invoked from the AF-ON press path. z0–z5 were identity-checked against the K1e zone file hashed before the candidate zone session. Custom is the seeded writer-input comparison the brief specifies. Every record matches. Differing bytes: none.

| Zone | Stored | On screen | K1e S1 record | Candidate AF-ON | Result |
| --- | --- | --- | --- | --- | --- |
| z0 | 2 | Small | 153,1,3,0,3,0,3,0,0,0 | 153,1,3,0,3,0,3,0,0,0 | PASS |
| z1 | 3 | Cross | 36,1,6,0,7,0,9,0,1,0 | 36,1,6,0,7,0,9,0,1,0 | PASS |
| z2 | 5 | Mid | 175,0,3,0,7,0,9,0,1,0 | 175,0,3,0,7,0,9,0,1,0 | PASS |
| z3 | 10 | Large | 58,0,3,0,11,0,15,0,1,0 | 58,0,3,0,11,0,15,0,1,0 | PASS |
| z4 | 0 | All | 14,2,2,0,27,0,39,0,0,0 | 14,2,2,0,27,0,39,0,0,0 | PASS |
| z5 | 1 | Single | 58,0,0,0,1,0,1,0,0,0 | 58,0,0,0,1,0,1,0,0,0 | PASS |
| custom | 6 | C1 | 58,0,7,0,3,0,3,0,0,0 | 58,0,7,0,3,0,3,0,0,0 | PASS |

The pre-change sweep (`work/out/sweep-t8d2.jsonl`) is the measurement those rows correct. With the T8c reader, Small, Mid, Large and All differed at +4 and +6, Cross also at +2, and Single matched. On All the writer forced position 526 for kind 2. On Small, kind 3 with vertical 3 cleared priority.

## Integrated proof

`proof-t8d10` ends `ok:true`. The runner never calls `applyWriter()`. The reconcile return sets a flag and the settle wrapper runs `0x609b3c79` after that continue has returned. Three AF-ON presses ran the writer. Live `0x5962[0]` stayed 526 through both pose changes and the return to landscape, then followed K2 on the normal edit (409, then 292).

| Step | Result | Record | Live `0x5962[0]` |
| --- | --- | --- | --- |
| Landscape AF-ON press | PASS, equals K1e S1 | 36,1,3,0,3,0,3,0,0,0 | 526 |
| Landscape AF-ON release | PASS, equals the candidate's own S1 | 14,2,3,0,3,0,3,0,0,0 | 526 |
| EXIF 6 pose | PASS | half-press cells unchanged | 526 |
| EXIF 6 AF-ON press | PASS, equals K1e S1 | 153,1,3,0,3,0,3,0,0,0 | 526 |
| EXIF 6 AF-ON release | PASS, equals the candidate's own S1 | 14,2,3,0,3,0,3,0,0,0 | 526 |
| Return to landscape | PASS | half-press cells still the reset image | 526 |
| Landscape AF-ON press again | PASS, equals K1e landscape S1 | 36,1,3,0,3,0,3,0,0,0 | 526 |
| Landscape AF-ON release | PASS, equals the candidate's own S1 | 14,2,3,0,3,0,3,0,0,0 | 526 |
| Normal edit, open then up | PASS, half-press equals K2 | position 409 then 292, grid `0x88b2` the same | 409, then 292 |
| Normal-edit S1 | PASS | 36,1,3,0,3,0,3,0,0,0 | 292 |

The return-to-landscape press is position 292, the saved landscape cell, while mirror offset `0x22` still held the EXIF 6 position after that edit. `bank()` selected index 0.

## Reset, ROM, and the fresh store

Retained from T8c. Reset equals the fresh store. ROM payloads in the registration records are 0. `0x9a41[1]` is outside the one-cell registration record, so its ROM column is uncovered. There are 49 covered ROM disagreements, one uncovered slot, and 13 slots that are 0 in reset, ROM, and the fresh store.

| Key | Index | Reset | ROM | Fresh |
| --- | --- | --- | --- | --- |
| 0x99a1 | 0 | 2 | 0 | 2 |
| 0x99a1 | 1 | 0 | 0 | 0 |
| 0x99a1 | 2 | 2 | 0 | 2 |
| 0x99a1 | 3 | 0 | 0 | 0 |
| 0x99a1 | 4 | 2 | 0 | 2 |
| 0x99a1 | 5 | 0 | 0 | 0 |
| 0x99a1 | 6 | 5 | 0 | 5 |
| 0x99a1 | 7 | 5 | 0 | 5 |
| 0x9a41 | 0 | 0 | 0 | 0 |
| 0x9a41 | 1 | 1 | uncovered | 1 |
| 0x5962 | 0–5 | 526 | 0 | 526 |
| 0x1dd1 | 0–9 | 3 | 0 | 3 |
| 0x84d1 | 0 | 3 | 0 | 3 |
| 0x88b2 | 0 | 526 | 0 | 526 |
| 0x90d1 | 0–5 | 2 | 0 | 2 |
| 0x90d1 | 6–7 | 5 | 0 | 5 |
| 0x5a11 | 0,1,2,4,9,10 | 1 | 0 | 1 |
| 0x5a11 | 3,5,6,7,8 | 0 | 0 | 0 |
| 0x1de1 | 0–7 | 1 | 0 | 1 |
| 0x1df1 | 0–3 | 1 | 0 | 1 |
| 0x1df1 | 4–7 | 0 | 0 | 0 |

1. **Task identifier and brief version used:** T8d, brief version 2026-11-19, correction round after Sol `run-20261119-201846-review`. Section 0 was followed. K1e is the overlay S1 reference. `bank()` and `initMirror()` are the accepted T8c versions. `OM_EMU_MODEL=E147`. `OM_EMU_NVRAM=off`.

2. **Research baseline used:** T8c decision, both T8c Sol reviews (`run-20261119-174338-review`, `run-20261119-184058-review`), T6 `out/design.md`, T8c run `20261119-175921` (`slots-q2.json`, 63 slots), and `audit/previous-review.md`. Main image `inputs/00_0100_50000020.decoded.bin` sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, length 33554368, base `0x60021020`. Resource `inputs/02_0106_458c0020.decoded.bin` sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. Overlay CSV `ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv`, 3262 bytes. Identity table `work/out/identity-t8d8.json` sha256 `52206dcb1d7bc5a31f240eeb6764cf939cfe198ac970003b6f2418e31e7fb6e0`, hashed before the proof session. Zone identity file sha256 `2a1ed2e2b08aa913e7bed27b952f507bbd793712a00f1d1364438b8cdead6345`, recorded again before the candidate zone session.

3. **Work performed:** The earlier listings, sweep, and `proof-t8d5` stand. This correction added complete writer and converter windows, traced the pose leak, and ran three proof processes. The passing process is the sixth new emulator process.
   - `tools\bin\run-ghidra.cmd -postScript DisasmT8d2.java 609b3c79 140 work\out\disasm-writer-t8d2.txt 609b3ecd 160 work\out\disasm-converter-t8d2.txt -log work\out\ghidra-t8d2.log`
   - `python -I work/scripts/check_listings_t8d2.py`
   - `tools\bin\run-ghidra.cmd -postScript DisasmT8d2.java 60419380 30 work\out\disasm-pose-caller-t8d2.txt 60063431 40 work\out\disasm-setter-t8d2.txt -log work\out\ghidra-pose-t8d2.log`
   - `tools\bin\run-ghidra.cmd -postScript DisasmT8d2.java 604193b0 25 work\out\disasm-pose-caller-b-t8d2.txt -log work\out\ghidra-pose-b-t8d2.log`
   - `tools\bin\run-ghidra.cmd -postScript DisasmT8d2.java 60419c80 45 work\out\disasm-pose-sites-t8d2.txt -log work\out\ghidra-sites-t8d2.log`
   - `node26 work/scripts/trace_t8d6.mjs`, `trace_t8d7.mjs`, `trace_t8d8.mjs` (the leak capture)
   - `node26 work/scripts/proof_t8d8.mjs om-emu work/out/proof-table-t8d3.json proof-t8d8`
   - `node26 work/scripts/proof_t8d9.mjs om-emu work/out/proof-table-t8d3.json proof-t8d9`
   - `node26 work/scripts/proof_t8d10.mjs om-emu work/out/proof-table-t8d3.json proof-t8d10`
   - `python -I work/scripts/manifest_t8d2.py`

4. **Files examined:** Stock writer `0x609b3c79`–`0x609b3d6d`, converter `0x609b3ecd`–`0x609b3fda`, jump table `0x60a7da08`, reconcile entry `0x60a8f2be`, builder call `0x60a8f4c1`, reconcile return `0x60a8f647`. Pose copier call `0x604193c0` to setter `0x60063431`, return `0x604193c7`. The traced store is `0x60063534` (alias store `0x60063536`) writing 292 to `0x62920bf0`. Consumer `0xa33ca384`. Half buffer `0xa33f2ce0`. Descriptor `0x6061fd9c`, value table `0x60617864`.

5. **Files created:** Under `work/` only. Every file is listed in `work/evidence-manifest.json`. The behaviour change that the passing proof ran is `work/scripts/hook_t8d_writer9.mjs`. `bank()` and `initMirror()` are unchanged. The proof runner is `work/scripts/proof_t8d10.mjs`.

6. **Findings:**
   1. STATIC. The writer copies `0x9a41[0]`, `0x1dd1[0]`, `0x1dd1[1]`, `0x84d1[0]`, `0x88b2[0]`, `0x1df1[0]` and `0x1e01[0]`, then forces position 526 for kind 2 and clears priority for kind 0, kind 2, or kind 3 with vertical 3. It does not read `0x99a1`. The window through the `ret` at `0x609b3d6d` matches the image. The converter window through the `ret` at `0x609b3fda` matches the image. Preset zones are forced to 1×1.
   2. DATA. On-screen names for stored values 0, 1, 2, 3, 5, 10, 6, 7, 8, 9 are All, Single, Small, Cross, Mid, Large, C1, C2, C3, C4.
   3. OBSERVED-EMU. The AF-ON writer runs from the press-path settle wrapper. Landscape press `36,1,3,0,3,0,3,0,0,0`, EXIF 6 press `153,1,3,0,3,0,3,0,0,0`, and the return-to-landscape press `36,1,3,0,3,0,3,0,0,0` each equal the matching K1e S1. Each release equals the candidate's own preceding S1. The return uses saved index 0.
   4. OBSERVED-EMU. During the EXIF 6 pose the setter was called with return address `0x604193c7`, key `0x5962`, index 0, value 292, MODE 0. The labelled change refuses that copier write when MODE is not 1 and the write would replace a reset live cell with the mirror's saved value, or when the index is not `bank()`. Store watches on both poses recorded 0 live stores. One write was refused on the way to EXIF 6 and two on the return to landscape. Live `0x5962[0]` stayed 526 until the normal edit.
   5. OBSERVED-EMU. The normal edit's half-press cells, including every bank and `0x88b2`, equal K2: 409 after the open, 292 after the up. The post-change zone table, including custom C1 `58,0,7,0,3,0,3,0,0,0`, matches K1e on all ten bytes.
   6. DATA. Covered ROM disagreements: 49. Uncovered: `0x9a41[1]` (reset 1, fresh 1). All-zero slots: 13.
   7. OBSERVED-EMU. After every candidate step the full half-press image of every bank was checked, and mirror bytes `0x37`–`0x46` were checked. `0x1e71[0]` stayed 0. Commit titles and highlights came from `identity-t8d8.json`, including K1e's own commits.

7. **Evidence for each claim:** Writer and converter listings `work/out/disasm-writer-t8d2.txt` line 79 and `work/out/disasm-converter-t8d2.txt` line 104. `work/out/listing-check-t8d2.json` reports 0 mismatches (140 and 160 instructions). Pose call `work/out/disasm-pose-caller-b-t8d2.txt`. Leak capture `work/out/trace-t8d8-hits.json`. Passing rows `work/out/proof-t8d10.jsonl`: `candidate-af-down`, `candidate-p-af-down`, `candidate-l-af-down`, `candidate-pose-exif6-watches` (`refused` 1, `stores` 0), `candidate-pose-land-watches` (`refused` 2, `stores` 0), `candidate-n-up`, `writer-calls` (3), `zone-z0` through `zone-z5`, `zone-custom`. Slot count from `slots-q2.json`: 49 rows with `romCovered` and not `resetEqualsRom`. Identity hash is `work/out/cmd/proof-t8d10.json`, written before the session.

8. **Tests and outcomes:**

| Test | Result |
| --- | --- |
| Listing check, writer through `0x609b3d6d` and converter through `0x609b3fda` | PASS. 0 mismatches. |
| `proof-t8d10` landscape, EXIF 6, and return-to-landscape press/release | PASS. |
| `proof-t8d10` pose leak watches | PASS. 0 live stores. |
| `proof-t8d10` normal edit equals K2 | PASS. |
| `proof-t8d10` zone table including custom | PASS. Seven writer calls in the zone session. |
| `0x1e71[0]` after every key | PASS. |
| Terminal `ok` | true. |
| `proof-t8d8` | FAIL at `candidate-e-open`. The first leak gate also blocked editor writes while MODE was 1. Superseded by `hook_t8d_writer9.mjs`. |
| `proof-t8d9` | FAIL at `candidate-n-open`. The gate also blocked the normal editor's `0x88b2` write. Superseded. The pose rows in that run had already passed. |

9. **New versus previously established:** Findings 1 and 2 confirm the T6 design and the writer/converter divergence Sol confirmed. Finding 3 confirms the landscape and EXIF 6 press/release results and adds the return-to-landscape press on the saved-bank feed, from the press path. Finding 4 is the leak trace and the one labelled fix. Finding 5 is the completed normal edit and the post-change zone table, including custom. Finding 6 corrects the covered ROM disagreement count to 49.

10. **Remaining uncertainties.** None that leave a required check open. The pose watches covered every live `0x5962` and `0x99a1` cell, `0x88b2[0]`, and the 71-byte mirror, and they recorded no live store.

11. **Recommended next actions.** None for this task. Storage and the display are out of scope.

12. **Deviations from the brief.** None. `bank()` and `initMirror()` were not changed. No storage decision and no hardware recommendation. The passing proof is the sixth new emulator process.
