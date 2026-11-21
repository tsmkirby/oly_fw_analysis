# T14 result

1. **Task identifier and brief version used:** T14, brief version 2026-11-20. Section 0 fixes the claim labels at `STATIC`, `INFERRED`, and `PRIOR`, and leaves hardware, changes, and storage out of this result.

2. **Research baseline used:** `brief.md`; `TASK.md`; `templates/result.md`; `ref/tasks/T1-page27-mapping/decision.md` (value 0 / value 1, rows 2154 and 2155); `ref/tasks/T8d-afon-target-record-reconcile/decision.md` (writer rule and zone names); `ref/analysis/button-af/AFON-MENU-RESEARCH.md` (S1 rows, default AF-ON key `0x000b`); T1 readiness note naming handlers `0x610b962a` and `0x610b9197`. Image and resource hashes were checked by `work/scripts/scan_image_t14.py` before the byte scan. Main SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (33554368 bytes). Resource SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059` (143523776 bytes). Ghidra project `projects/OM3_main_full`, program `00_0100_50000020.decoded.bin`, opened `-readOnly -noanalysis`. Project-file hashes are in `work/evidence-manifest.json`. OM-Emu was not run.

3. **Work performed:**
   - `python -I work\scripts\scan_image_t14.py` hashed both images, then scanned call encodings and absolute addresses into `work/out/scan-t14.json`.
   - `tools\bin\run-ghidra.cmd -postScript T14Dump.java -log work\out\ghidra-t14.log`
   - `tools\bin\run-ghidra.cmd -postScript T14Dump.java -log work\out\ghidra-t14b.log`
   - `tools\bin\run-ghidra.cmd -postScript T14Dump.java -log work\out\ghidra-t14c.log` (added the `0x90a1` consumers)
   - `tools\bin\run-ghidra.cmd -postScript OM3Disasm.java 609025aa 45 work\out\listings\priority-side.txt -log work\out\ghidra-side.log`
   - `python -I -c` scans for callers of `0x609024aa`, `0x60902452`, `0x609025aa`, `0x609b3bca`, and `0x609b34d1`, and for the handler-pointer immediates.
   - `tools\bin\run-ghidra.cmd -postScript OM3Disasm.java 60900240 36 work\out\listings\accessor-use-a.txt -log work\out\ghidra-use-a.log`
   - Listings were read against the image windows in `scan-t14.json`. The writer window begins `04fccc419a00009000ddfef66affc00c`.

4. **Files examined:** the image and resource above; Ghidra program `00_0100_50000020.decoded.bin`; `tools/ghidra` language files for the call encodings; decompiled `ref/analysis/decompiled-main/functions/60873daf.c` and `6108ad0a.c` as maps only. Disassembly ranges are the files under `work/out/listings/`. Addresses that decide the result: `0x609b3c79`, `0x609b3bb2`, `0x609832f5`, `0x60903e55`, `0x60447de4`, `0x610aef37`, `0x610b962a`, `0x610b9653`, `0x610a5620`, `0x610a58c7`, `0x610a5f10`, `0x610a6323`, `0x609b376d`, `0x609b3783`, `0x60902452`, `0x609024aa`, `0x609025aa`, `0x6158ba04`, `0x60617864`, `0x60627704`, `0x612f20c8`, `0x61339090`, `0x6131c290`.

5. **Files created:** everything under `work/`, listed with SHA-256 in `work/evidence-manifest.json`. The records this brief asks for are `work/result.md`, `work/out/listings/`, `work/out/call-graph.md`, `work/out/zone-table.md`, `work/evidence-manifest.json`, and `work/out/seal.json`.

6. **Findings:**

   1. STATIC. The stock ten-byte record has one writer, `0x609b3c79`. Its two callers are `0x609b3b98` and `0x609b3bbc`.
   2. STATIC. The writer reads `0x9a41[0]`, `0x1dd1[0]`, `0x1dd1[1]`, `0x84d1[0]`, `0x88b2[0]`, `0x1df1[0]`, and `0x1e01[0]`, in that order, through getter `0x60063380`.
   3. STATIC. Kind 2 forces position `0x020e` (526) at `0x609b3d1a`. Kind 0, kind 2, and kind 3 with vertical 3 clear the priority low byte at `0x609b3d33`.
   4. STATIC. Before those overrides, if struct +0x22 is 1, `0x609832f5` replaces kind, position, vertical, and horizontal from `0xa33d4a94`, `0xa33d4a96`, `0xa33d4a98`, and `0xa33d4a9a`. Struct +0x22 is a copy of `0xe951[0]` (`0x609b369b`).
   5. STATIC. S1 rows `0x61339090` and `0x613390a0` point at `0x610aef37`. The down event `0x1000002` stores 4 at object +0x20. The up event `0x1000003` stores 5 and calls `0x610a6323`. The handler has no call of the writer.
   6. STATIC. AF-ON down handler `0x610b962a` (table bytes at `0x6131c290` and two copies) passes key id `0xb` to `0x6108ad0a` and, when that returns 1, calls `0x610a5620` with mode 1. Mode 1 stores the word 2 at object +0x124 (`0x610a580c`, and again at `0x610a5fce` on the other arm). No arm calls the writer.
   7. STATIC. AF-ON up `0x610b9653` and S1 up both call `0x610a6323`. `0x610a6323` has no direct call of the writer.
   8. STATIC. `0x90a1[0]` is cached at `0xa33f2cac` and `0x90a1[1]` at `0xa33f2cad` (`0x609b376d`, `0x609b3783`, repeated at `0x609b3a48` and `0x609b3a5e`). The cache routine’s only direct caller is `0x609ed0a2`. The writer does not read either cached byte.
   9. STATIC. The consumer that still holds the struct base and reads cached index 1 is `0x609024b1`. Value 0 calls `0x609025aa`. Any other value returns at `0x609024cf`. `0x609025aa` does not store the record or the seven input cells.
   10. STATIC. Bytes at the T5/T6 builder addresses are `0xff`, and those addresses have no call16 or call32 hits.
   11. STATIC. Option records at `0x6158ba04` are value 1 with string id `0x127b`, then value 0 with string id `0x124f`. UI map `0x60627704` is `0x90a1` index 0 then `0x90a1` index 1. Assignment table `0x612f20c8` begins `45 00 00 00 0a 00 00 00` (69, function `0x0a`).
   12. PRIOR T1 decision (2026-11-17). Stored value 0 means always the selected AF target ("Always tracks"). Stored value 1 means detected-subject priority. Top row 2154 is `0x90a1[0]`. Bottom row 2155, the custom-switch element, is `0x90a1[1]`. T1 left the physical-key versus function-`0x0a` binding of row 2155 unresolved.
   13. PRIOR T8d decision. Zone stored values 0, 1, 2, 3, 5, 10, 6, 7, 8, 9 are All, Single, Small, Cross, Mid, Large, C1, C2, C3, C4. The image bytes at `0x60617864` match that order.
   14. PRIOR AFON-MENU-RESEARCH. Default AF-ON uses key id `0x000b`. That is the immediate `0x610b9638` passes to the gate.
   15. PRIOR T7 and T9d. On bare stock the emulator saw owner 255 and record `14,2,2,0,27,0,39,0,0,0` on all 12 edges. K2’s differing AF-ON record came from the overlay converter. This task does not use that run as a static proof.
   16. INFERRED. With `0x90a1[1] == 0`, stock AF-ON and stock half-press produce the same ten bytes for every zone and for landscape and EXIF 6, because both are whatever `0x609b3c79` last wrote from the same cells and the same two overrides. Half-press is the correct reference. Conclusion (a).

7. **Evidence for each claim:**
   1. `work/out/listings/writer-accessor.txt` lines 8 and 18 (`cd` at `0x609b3b98` and `0x609b3bbc`). `work/out/scan-t14.json` `calls["0x609b3c79"]` has those two sites. Record immediates: `abs_hits` for `0xa33f2ce0` through `0xa33f2ce9`, each one store inside `0x609b3c79`–`0x609b3d6d`. Accessor caller `0x60900258` (`work/out/listings/accessor-use-a.txt` lines 13–29) saves the returned pointer and reads it; the stores in that window go to the stack and to a different A0.
   2. `writer-accessor.txt` lines 91–125. Indices are `clr D1` or `mov 0x1, D1` immediately before each getter call.
   3. Same listing lines 142–157. `mov 0x20e, D0` is bytes `2c 0e 02`.
   4. `writer-accessor.txt` lines 127–141 and `work/out/listings/shadow-replace.txt` lines 4–15. Flag store: `work/out/listings/struct-helpers.txt` lines 147–151.
   5. Image bytes at `0x61339090`: `02000001010000000100000037ef0a61`. `work/out/listings/s1-handler.txt` lines 11–26.
   6. Image bytes at `0x6131c290`: `0700050101000000010000002a960b61`. `work/out/listings/afon-handlers.txt` lines 6–16. Mode dispatch: `work/out/listings/af-start.txt` lines 48–50 and 149–192. Second owner store: `work/out/listings/afon-owner.txt` lines 67–70. `abs_hits` for `0xa031ed04` and `0xa031ebe0` are empty.
   7. `afon-handlers.txt` lines 21–24. `work/out/listings/af-release.txt` line 34 (`0x610a5921` calls `0x610a6323`). `s1-handler.txt` line 26. `work/out/listings/release-common.txt` has the vtable call and no `0x609b3c79`.
   8. `struct-helpers.txt` lines 216–221 and `work/out/listings/priority-cache.txt` lines 3–7 (`mov 0x1, D1` then the store of index 1). Repeat: `work/out/listings/priority-cache-b.txt` lines 57–66. Caller scan of `0x609b34d1`: one hit, `0x609ed0a2`.
   9. `work/out/listings/priority-use-a.txt` lines 62–72. `work/out/listings/priority-side.txt` lines 1–7. Caller scan: six callers of `0x609024aa`, and `0x609025aa` is called only from `0x6090249a` and `0x609024c2`.
   10. `work/out/listings/builder-pad.txt`. Image bytes at `0x60a8f6bb` and `0x60a8f2be` are `0xff`. `scan-t14.json` call lists for those four addresses are empty.
   11. `scan-t14.json` windows `af-button-options`, `ui`, `assign`, re-read from the image in this session.
   12. `ref/tasks/T1-page27-mapping/decision.md` Q2 and the row table. The open binding is that decision’s Q3.
   13. `ref/tasks/T8d-afon-target-record-reconcile/decision.md` zone-name bullet. Image `0x60617864`: `00010203050a06070809`.
   14. `ref/analysis/button-af/AFON-MENU-RESEARCH.md` on default key `0x000b`. Instruction `0x610b9638` is `80 0b`.
   15. Brief section 0, citing T7 and T9d `obs-k1-t9d.jsonl`. No emulator log was produced here.
   16. Claims 1–10 plus `work/out/zone-table.md`. The copy at `0x60903e55` (`work/out/listings/record-copy.txt` lines 9–25) moves those same bytes out unchanged. The writer’s indices do not include a pose term, so landscape and EXIF 6 share the formula.

8. **Tests and outcomes:**
   - PASS. Main and resource hashes match the brief before the scan.
   - PASS. Writer listing bytes match the `scan-t14.json` writer window, including the T8d head `04fccc419a00009000ddfef66affc00c`.
   - PASS. Call-site scan and the linear listing agree on the two writer callers.
   - BOUNDARY. `priority-cache.txt` and `priority-cache-b.txt` start one or more bytes inside an instruction. The instructions cited above are the ones that realign (`0x609b3783`, `0x609b3a48`). The stray first line of each file is not an instruction.
   - BOUNDARY. Ghidra’s decompiler bounds for `0x609b3c79` are short. The linear listing shows `ret` at `0x609b3d6d` (`df e0 20`). Evidence is the linear listing.
   - No emulator test. Section 0 makes this a static task.

9. **New versus previously established:**
   - Claims 2 and 3 confirm the T8d writer rule on this image.
   - Claim 4 confirms the shadow replace T8d described, and ties its flag to `0xe951[0]` at `0xa33f2cbe`.
   - Claims 5 and 6 confirm the S1 and AF-ON handler entries used in the button research, and add the owner store at object +0x124 on both mode-1 arms.
   - Claim 8 is new relative to the T1 lead list: the real `0x90a1` readers are the cache pair at `0x609b376d` / `0x609b3783` and the duplicate pair at `0x609b3a48` / `0x609b3a5e`.
   - Claim 9 is new: the cached custom-switch byte is branched on at `0x609024b4`, and that branch does not reach the record.
   - Claim 10 confirms, on this image, that the overlay builder region is padding.
   - Claim 16 is the T14 conclusion. It confirms using half-press as the reference when `0x90a1[1]` is 0.

10. **Remaining uncertainties.** The indirect call inside `0x610a6323` has a vtable target, so this listing does not name the function it reaches. Both release edges call `0x610a6323`, so that unknown target is shared. The image has no absolute immediate for the owner RAM address the emulator hooks; the static store is the word 2 at object +0x124. T1’s open question on whether row 2155 follows the physical key or function `0x0a` stays open, and the record writer does not branch on that binding. Live numeric values of the seven cells are settings, not bytes in the image; the equality is the shared formula in `work/out/zone-table.md`.

11. **Recommended next actions.** None.

12. **Deviations from the brief.** Claim labels follow section 0 (`STATIC`, `INFERRED`, `PRIOR`). The template’s `OBSERVED-EMU`, `DATA`, and `HYPOTHESIS` labels are unused. Section 11 is empty because section 0 leaves hardware, changes, and storage out of this result.

## Answers

1. **Half-press path.** The S1 down row points at `0x610aef37`, which stores 4 at object +0x20 and returns. The record is built later by the shared writer, not by the down edge. Chain when the record is rebuilt: pose-group refresh `0x60447de4` → `0x6071128b` → `0x609b3b98` → `0x609b3c79`, and any accessor `0x609b3bb2` while dirty is 1. Init dirties the record from `0x608fe1be`. Inputs and overrides are claims 2–4. The down edge’s stored value is 4 at +0x20, which is a handler state word. The writer never reads it.

2. **AF-ON path.** Down handler `0x610b962a` → gate `0x6108ad0a(0xb, 0)` → `0x610a5620` mode 1 → owner word 2 at object +0x124. The record, when built, is the same writer `0x609b3c79`. There is no second writer and no AF-ON-only helper. Branches on the way: the `0xb` gate can skip `0x610a5620`; inside mode 1, `0x6108a5a0`, `0x6108a68c`, `0x610a375f`, and `0x6108a7f9` choose among return, the owner store, `0x610a613c`, and `0x610a5f10`. None of them calls the writer or reads `0x90a1`. The `0x90a1` branches are the cache consumers in claim 9 and the index-0 setter arm at `0x60902477` (key `0x4601`). Those sit off the button edge, and the index-1 arm does not store the record.

3. **Inputs and transforms.** AF-ON reads, for the record, the same seven cells as half-press, with the same kind-2 position force, the same priority clear, and the same `0xe951` shadow replace. Zone kind, size bytes (record +4 and +6 from `0x1dd1[0]` and `0x1dd1[1]`), position, priority, and record +9 are that one formula. Custom slots C1–C4 do not select a different index in the writer. AF Home keys `0x9fa1` and `0xdfa1` are absent from the writer. Pose does not select an index. No transform is applied on one button path and skipped on the other.

4. **Byte-level prediction.** For All, Single, Small, Cross, Mid, Large, C1, C2, C3, and C4, in landscape and in EXIF 6, with "Always tracks" (`0x90a1[1] == 0`), all ten bytes are equal. The table is `work/out/zone-table.md`. Small’s position half is `0x020e` on both sides because of `0x609b3d1a`. Release is equal: both up edges call `0x610a6323`, which does not write a second record.

5. **Custom-switch element.** Stored value 0 is "Always tracks" (PRIOR T1). Stored value 1 is the other option on that element. On the record, value 1 takes the branch at `0x609024b4` and skips `0x609025aa`. That skipped call does not store the ten-byte record, so value 1 changes no record byte.

6. **Conclusion.** (a) Equal for every zone and both poses. Half-press is the correct reference for stock AF-ON with this AF Button setting.
