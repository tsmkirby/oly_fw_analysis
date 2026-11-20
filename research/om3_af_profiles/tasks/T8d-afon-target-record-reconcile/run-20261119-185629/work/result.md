# T8d result

## Writer rule

The stock half-press writer `0x609b3c79` does not read `0x99a1`. It reads seven cells and then applies two overrides. The shadow replace at `0xa33f2cbe` did not run on any swept zone (`flagBe` 0).

| Record byte | Writer read | Rule, from the image |
| --- | --- | --- |
| +0 position | `0x88b2[0]` | Copied. Kind 2 stores 526 instead (`0x609b3d1a`). |
| +2 kind | `0x84d1[0]` | Copied. |
| +3 size key | `0x9a41[0]` | Copied. Every swept press returned 0. |
| +4 vertical | `0x1dd1[0]` | Copied. |
| +6 horizontal | `0x1dd1[1]` | Copied. |
| +8 priority | `0x1df1[0]` | Cleared when kind is 0, kind is 2, or kind is 3 and vertical is 3 (`0x609b3d33`). |
| +9 | `0x1e01[0]` | Copied. Every swept press returned 0. The AF-ON feed returns 0. |

The dial writes the zone's kind into `0x84d1[0]` and its dimensions into `0x1dd1[0]` and `0x1dd1[1]` before S1. The writer then copies those cells. That is how the zone changes +4 and +6 without a `0x99a1` immediate in the writer.

The T6 converter `0x609b3ecd` does the opposite for the preset zones. Its jump table `0x60a7da08` sends UI 0 to kind 2 and 1×1, UI 1 to kind 0 and 1×1, UI 2 to kind 3 and 1×1, and UI 3, 5 and 10 to kind 3, 1×1, and the live priority. UI 6–9 (C1–C4) use kind 7 and `0x1dd1` indices 2/3, 4/5, 6/7, 8/9. The builder then stores that kind and those 1×1 dimensions. The two paths diverge at +2, +4 and +6: the writer copies `0x84d1[0]`, `0x1dd1[0]` and `0x1dd1[1]`; the converter invents kind and 1×1 from the zone UI.

Zone values, from descriptor `0x6061fd9c` / table `0x60617864` and the face list `0x6158ba1c`: 0 All, 1 Single, 2 Small, 3 Cross, 5 Mid, 10 Large, 6 C1, 7 C2, 8 C3, 9 C4. The stock dial offers the six whose `0x5a11` bits are 1 at reset. C1–C4 are off.

## Zone table

K1e is the overlay S1 reference. The candidate column is the accepted T8c reader, before the writer change. Hashes of the K1e rows were written to `work/out/sweep-t8d2-k1e-seal.json` before the candidate ran. Identity matched on z0–z5. Custom is K1e only: the candidate title diverged, so that row was not compared.

| Zone | Stored | On screen | K1e S1 record | Candidate AF-ON | Differing bytes |
| --- | --- | --- | --- | --- | --- |
| z0 | 2 | Small | 153,1,3,0,3,0,3,0,0,0 | 153,1,3,0,1,0,1,0,0,0 | +4, +6 |
| z1 | 3 | Cross | 36,1,6,0,7,0,9,0,1,0 | 36,1,3,0,1,0,1,0,1,0 | +2, +4, +6 |
| z2 | 5 | Mid | 175,0,3,0,7,0,9,0,1,0 | 175,0,3,0,1,0,1,0,1,0 | +4, +6 |
| z3 | 10 | Large | 58,0,3,0,11,0,15,0,1,0 | 58,0,3,0,1,0,1,0,1,0 | +4, +6 |
| z4 | 0 | All | 14,2,2,0,27,0,39,0,0,0 | 14,2,2,0,1,0,1,0,0,0 | +4, +6 |
| z5 | 1 | Single | 58,0,0,0,1,0,1,0,0,0 | 58,0,0,0,1,0,1,0,0,0 | none |
| custom | 6 | C1 | 58,0,7,0,3,0,3,0,0,0 | not compared | boundary |

All of those K1e presses entered the writer (`writerDelta` 1) with `flagBe` 0. On All, `0x88b2` returned 58 and the record position is 526, which is the kind-2 force. On Small, `0x1df1` returned 1 and the stored priority is 0, which is the kind-3 vertical-3 clear. Cross kind 6 is kept, with priority 1, because kind 6 is not one of the cleared kinds.

## Proof rows that ran after the change

`proof-t8d5` called `0x609b3c79` after each AF-ON press, with the mirror answering the writer's reads, and wrote those ten bytes over the consumer `0xa33ca384`.

| Step | Result | Record the writer produced |
| --- | --- | --- |
| Landscape AF-ON press | PASS, equals K1e S1 | 36,1,3,0,3,0,3,0,0,0 |
| Landscape AF-ON release | PASS, equals the candidate's own S1 | restored |
| EXIF 6 AF-ON press | PASS, equals K1e S1 | 153,1,3,0,3,0,3,0,0,0 |
| EXIF 6 AF-ON release | PASS, equals the candidate's own S1 | restored |
| Return to landscape | FAIL | live `0x5962[0]` was 292; the table expected the reset 526 |
| Normal edit | not run | the proof stops at the first failed assertion |

292 is K1e's edited landscape position (`k1e-ke-s1-down` has `0x5962[0]` 292). The candidate cell was still 526 after the landscape release and had become 292 by the EXIF 6 release. The zone pass/fail with this hook did not run.

## Reset, ROM, and the fresh store

Retained from T8c. Reset equals the fresh store. ROM payloads in the registration records are 0. `0x9a41[1]` is outside the one-cell registration record, so its ROM column is uncovered. The 0 that older tables put there is a convention, not an observed ROM payload. Fifty of the other slots differ from ROM 0. Thirteen are 0 in all three columns.

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

1. **Task identifier and brief version used:** T8d, brief version 2026-11-19. Section 0 was followed. K1e is the overlay S1 reference. `bank()` and `initMirror()` are the accepted T8c versions.

2. **Research baseline used:** T8c decision, both T8c Sol reviews (`run-20261119-174338-review`, `run-20261119-184058-review`), T6 `out/design.md`, T8c run `20261119-175921` runners and the 63-slot table. Main image `inputs/00_0100_50000020.decoded.bin` sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, length 33554368, base `0x60021020`. Resource `inputs/02_0106_458c0020.decoded.bin` sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. Overlay CSV `ref/tasks/T8-afon-integrated-acceptance/run-20261119-132229/work/out/overlay-combined-t8.csv`, 3262 bytes. `OM_EMU_MODEL=E147`. `OM_EMU_NVRAM=off`.

3. **Work performed:** Static listings, then one zone-sweep process, then five proof processes. The sixth emulator process is `proof-t8d5`. No seventh was started.
   - `tools\bin\run-ghidra.cmd -postScript DisasmT8d1.java 609b3481 80 work\out\disasm-gate-t8d1.txt 609832f5 180 work\out\disasm-adjust-t8d1.txt 609b3c79 55 work\out\disasm-writer-t8d1.txt 609b3ecd 90 work\out\disasm-converter-t8d1.txt -log work\out\ghidra-t8d1.log`
   - `python -I work/scripts/static_writer_t8d1.py`
   - `python -I work/scripts/check_listings_t8d1.py`
   - `node26 work/scripts/sweep_t8d2.mjs om-emu`
   - `node26 work/scripts/gen_proof_table_t8d1.mjs` and `node26 work/scripts/check_proof_t8d1.mjs` on each table
   - `node26 work/scripts/proof_t8d1.mjs om-emu work/out/proof-table-t8d1.json proof-t8d1`
   - `node26 work/scripts/proof_t8d2.mjs om-emu work/out/proof-table-t8d1.json proof-t8d2`
   - `node26 work/scripts/proof_t8d2.mjs om-emu work/out/proof-table-t8d2.json proof-t8d3`
   - `node26 work/scripts/proof_t8d4.mjs om-emu work/out/proof-table-t8d2.json proof-t8d4`
   - `node26 work/scripts/proof_t8d5.mjs om-emu work/out/proof-table-t8d3.json proof-t8d5`

4. **Files examined:** Stock writer `0x609b3c79`–`0x609b3d6d`, gate `0x609b3481` (two instructions, then the next function), adjust `0x609832f5`–`0x60983319`, converter `0x609b3ecd`–`0x609b3fda`, jump table `0x60a7da08`, builder `0x60a8f6bb`–`0x60a8f7d2`, reconcile call of the builder at `0x60a8f4c1`, writer call site `0x60a8f3a9` frame mask `0xe0` size `0x20`. Descriptor `0x6061fd9c`, value table `0x60617864`, face list `0x6158ba1c`, UI map `0x6062555c`. Consumer `0xa33ca384`. Half buffer `0xa33f2ce0`. Dirty `0xa33f2cea`. Shadow flag `0xa33f2cbe`.

5. **Files created:** Under `work/` only. Every file is listed in `work/evidence-manifest.json`. The behaviour change that ran in the last proof is `work/scripts/hook_t8d_writer3.mjs` `applyWriter()`. `bank()` and `initMirror()` are unchanged.

6. **Findings:**
   1. STATIC. The writer copies `0x9a41[0]`, `0x1dd1[0]`, `0x1dd1[1]`, `0x84d1[0]`, `0x88b2[0]`, `0x1df1[0]` and `0x1e01[0]`, then forces position 526 for kind 2 and clears priority for kind 0, kind 2, or kind 3 with vertical 3. It does not read `0x99a1`.
   2. STATIC. The converter and the builder derive kind and +4/+6 from the zone UI. Preset zones are 1×1. That is the divergence.
   3. DATA. On-screen names for stored values 0, 1, 2, 3, 5, 10, 6, 7, 8, 9 are All, Single, Small, Cross, Mid, Large, C1, C2, C3, C4.
   4. OBSERVED-EMU. On the six dial zones the overlay S1 record differs from the T8c AF-ON record at +4 and +6, and on Cross also at +2. Single matches. The shadow flag was 0.
   5. OBSERVED-EMU. After the change, the landscape AF-ON press is `36,1,3,0,3,0,3,0,0,0` and the EXIF 6 press is `153,1,3,0,3,0,3,0,0,0`. Each equals that pose's K1e S1. Each release equals the candidate's own preceding S1.
   6. OBSERVED-EMU. On the return to landscape the candidate's live `0x5962[0]` is 292. K1e's edited landscape cell is 292. The generated table still expected the reset 526. The proof stopped there.
   7. DATA. `0x9a41[1]` has no ROM payload. Its registration count is 1. Reset and fresh are 1.
   8. INFERRED. The live landscape position was still 526 after the landscape AF-ON release and was 292 by the EXIF 6 release, so the flush happened during the EXIF 6 portion, not during `applyWriter`'s landscape call.

7. **Evidence for each claim:** Listings `work/out/disasm-writer-t8d1.txt`, `work/out/disasm-converter-t8d1.txt`, `work/out/disasm-gate-t8d1.txt`, `work/out/disasm-adjust-t8d1.txt`, and `work/out/listing-check-t8d1.json` (0 mismatches). Names in `work/out/static-writer-t8d1.json`. Zone rows in `work/out/sweep-t8d2.jsonl` and `work/out/sweep-t8d2-k1e-seal.json`. Proof rows in `work/out/proof-t8d5.jsonl`: `candidate-af-down`, `candidate-af-up`, `candidate-p-af-down`, `candidate-p-af-up` pass; `candidate-pose-land` fails. Writer bytes are the `step: writer` lines in that file. The slot table is the T8c table with `0x9a41[1]` marked uncovered.

8. **Tests and outcomes:**

| Test | Result |
| --- | --- |
| Listing check, four windows | PASS. 0 mismatches. |
| Table checker, 38 steps, control exits reach K1e or K2 | PASS. `work/out/check-proof-t8d3.json`. |
| Zone sweep, six dial zones, identity and records | PASS as a measurement. Records differ as in the zone table. |
| Zone sweep, custom candidate title | BOUNDARY. K1e reached stored value 6. The candidate title did not match, so the records were not compared. |
| `proof-t8d5` landscape AF-ON press and release | PASS. |
| `proof-t8d5` EXIF 6 edit, MENU exit, AF-ON press and release | PASS. |
| `proof-t8d5` return to landscape | FAIL. `halfBank` position 292, table expected 526. |
| `proof-t8d5` normal edit and the post-change zone table | Not run. Stopped at the first failed assertion. |
| `0x1e71[0]` after every key through the failed step | PASS. It stayed 0. |
| Terminal `ok` | false. |

9. **New versus previously established:** Findings 1–3 confirm the T6 design and the T8c writer description, and they name the divergence T8c carried forward. Finding 4 is the measurement that T8c's review required before the change. Finding 5 is new: with the mirror feeding `0x609b3c79`, the AF-ON press equals the overlay S1 record on landscape and on EXIF 6. Finding 6 is new and is why the run is not `ok: true`. Finding 7 confirms T8c and marks the uncovered ROM cell the way the second review required.

10. **Remaining uncertainties.** Whether the editor's own setter writes, without the explicit seed used for the unrun zone rows, put dialed `0x84d1` and `0x1dd1[0]`/`[1]` into the mirror for Cross, Mid, Large and All. The landscape and EXIF 6 presses used the editor-written mirror and matched, at reset dimensions. The custom candidate row was not compared. The normal-edit equality with K2 was not reached.

11. **Recommended next actions.** One new proof file, not an edit of `proof_t8d5.mjs`. On `pose-land` and the later landscape steps, expect the candidate's `0x5962[0]` to be K1e's edited cell (292), and expect K2 to stay at 526. Then run the return, the normal edit, and the zone rows. That is a seventh emulator process; this task's six are used.

12. **Deviations from the brief.** The integrated proof does not end `ok: true`. The post-change zone pass/fail table was not run. Custom C1 was reached on K1e only after `0x5a11[5]=1`, which is emulator-only test setup; the candidate dial replay diverged on the title. The stock writer is called from settled code after the AF-ON press. A hook on the overlay builder epilogue is refused unless it is a pass-through, and calling the writer from that pass-through faulted `proof-t8d3`. `bank()` and `initMirror()` were not changed. No storage decision and no hardware recommendation.
