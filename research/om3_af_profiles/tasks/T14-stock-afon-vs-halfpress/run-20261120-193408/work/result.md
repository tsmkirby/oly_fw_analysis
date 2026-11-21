# T14 result

1. **Task identifier and brief version used:** T14, brief version 2026-11-20, correction round after Sol's review `audit/previous-review.md` (REJECT). Section 0 fixes the claim labels at `STATIC`, `INFERRED`, and `PRIOR`. R1 listings, `work/out/call-graph.md`, `work/out/zone-table.md`, and `work/out/scan-t14.json` are kept. This file replaces the r1 conclusion.

2. **Research baseline used:** `brief.md`; `TASK.md`; `audit/previous-review.md`; r1 `work/result.md` and its listings; `ref/tasks/T1-page27-mapping/decision.md`; `ref/tasks/T8d-afon-target-record-reconcile/decision.md`; `ref/tasks/T7-orientation-producer/decision.md` and `run-20261119-072701/work/result.md` claim 13; `ref/analysis/button-af/AFON-MENU-RESEARCH.md` section "Live OM-Emu AF-ON input and dispatcher regression"; T9d as cited in brief section 0 (owner 255 and record `14,2,2,0,27,0,39,0,0,0` on the twelve K1 edges). Decompiled `610a25f1.c`, `610831e6.c`, `60873daf.c`, and `60890a0d.c` were maps only. Every cited instruction was checked against a listing or against `work/out/r2/scan-r2.json` / `work/out/r2/jump-slots.txt`.

   Hashes before the r2 scan and before the r2 Ghidra launch are `work/out/r2/hashes-before.json`. Main SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (33554368 bytes). Resource SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. The five Ghidra project files in that JSON match the r1 manifest. Those r1 hashes were taken at r1 seal time, after r1 had already opened the project read-only. This round does not have a hash from before that first open. `seal_t14_r2.py` hashes the same files again after the r2 Ghidra runs.

3. **Work performed:**
   - `python -I work\scripts\scan_t14_r2.py`
   - `python -I work\scripts\scan_t14_r2b.py`
   - `tools\bin\run-ghidra.cmd -postScript T14R2.java -log work\out\r2\ghidra-r2.log`
   - `tools\bin\run-ghidra.cmd -postScript OM3Disasm.java 610831e6 22 work\out\r2\listings\assign-lookup.txt -log work\out\r2\ghidra-lookup.log`
   - `tools\bin\run-ghidra.cmd -postScript OM3Disasm.java 610831e6 30 work\out\r2\listings\assign-lookup.txt -log work\out\r2\ghidra-lookup2.log`
   - `python -I -c "import struct; from pathlib import Path; b=Path(r'inputs/00_0100_50000020.decoded.bin').read_bytes(); BASE=0x60021020; out=[]; tab=0x613086e8`
     `out.append('table 0x613086e8 index=(value-1), each entry u32le code pointer')`
     `for val in (8,10,0x3b):`
     ` addr=tab+(val-1)*4; w=struct.unpack_from('<I', b, addr-BASE)[0]; raw=b[addr-BASE:addr-BASE+4]`
     ` out.append('value %d at %s bytes %s pointer %s'%(val, hex(addr), raw.hex(), hex(w)))`
     `rel=0x61308968; raw=b[rel-BASE:rel-BASE+8]; w=struct.unpack_from('<2I', b, rel-BASE)`
     `out.append('release pair %s bytes %s id %d handler %s'%(hex(rel), raw.hex(), w[0], hex(w[1])))`
     `Path(r'work/out/r2/jump-slots.txt').write_text('\n'.join(out)+'\n', encoding='utf-8'); print('\n'.join(out))"`
   - `python -I work\scripts\seal_t14_r2.py`

4. **Files examined:** the image and resource above; Ghidra program `00_0100_50000020.decoded.bin` with `-readOnly -noanalysis`; r1 listings named in the claims; r2 listings under `work/out/r2/listings/`. Addresses that decide the correction: `0x609b3c79`, `0x609b3b98`, `0x609b3bbc`, `0x60447de4`, `0x60216e6c`, `0x60afabdc`, `0x610aef37`, `0x610a3735`, `0x610a2407`, `0x610a2548`, `0x610a25f1`, `0x610a2679`, `0x610a267f`, `0x613086e8`, `0x61308968`, `0x610a2fc1`, `0x610831e6`, `0x612f20c8`, `0x60983156`, `0x609024aa`, `0x60873e1f`, `0x60890a5e`, `0x60890a6f`, `0x609b39f0`.

5. **Files created:** r1 files remain. New files are under `work/out/r2/`, `work/scripts/scan_t14_r2.py`, `work/scripts/scan_t14_r2b.py`, `work/scripts/T14R2.java`, `work/scripts/seal_t14_r2.py`, this `work/result.md`, and `work/evidence-manifest.json`. SHA-256 values are in the manifest.

6. **Findings:**

   1. STATIC. The two direct calls of writer `0x609b3c79` are `0x609b3b98` and `0x609b3bbc`. Absolute immediates of that address are absent from the image. A writer reached through a register is not ruled out.
   2. STATIC. The writer reads `0x9a41[0]`, `0x1dd1[0]`, `0x1dd1[1]`, `0x84d1[0]`, `0x88b2[0]`, `0x1df1[0]`, and `0x1e01[0]`, in that order, through getter `0x60063380`. Confirmed on the r1 listing.
   3. STATIC. Kind 2 forces position `0x020e` at `0x609b3d1a`. Kind 0, kind 2, and kind 3 with vertical 3 clear the priority low byte at `0x609b3d33`.
   4. STATIC. If struct `+0x22` is 1, `0x609832f5` replaces kind, position, vertical, and horizontal from `0xa33d4a94`, `0xa33d4a96`, `0xa33d4a98`, and `0xa33d4a9a`. Struct `+0x22` is stored from `0xe951[0]` at `0x609b369b` and again at `0x609b39f0`.
   5. STATIC. Direct rebuilds of the record go through `0x60447de4` at `0x60216e6c` and `0x60afabdc`, and only when the pose group changes and `0xa33f3640` is not 0. The accessor `0x609b3bb2` rebuilds when dirty is 1. Its direct callers are `0x60900258`, `0x60903e56`, and `0x609052a1`. None of these sites is in the S1 handler or in the walked AF-ON down body.
   6. STATIC. S1 rows `0x61339090` and `0x613390a0` point at `0x610aef37`. Stores at object `+0x20` run only when `0x610a3735(0x31)` returns 1. The up event calls `0x610a6323` without that requirement. `0x610a3735` reads `0x62b7f8e8`, outside this image.
   7. STATIC. Event `0x01000032` at `0x6131be80` points at `0x610a2407`. That body calls `0x610a25f1` when `0x610830ab` returns 2, with D0 equal to `0x3b` or to the return of `0x61083022`. `0x610a25f1` jumps through `0x613086e8[(D0-1)]`. Value 10 lands on `0x610a2679`, which calls `0x610a5620` with D0 = 1. Value 8 uses D0 = 3. Value `0x3b` lands on `0x610a2bb8`.
   8. STATIC. `0x610831e6` walks `0x612f20a8`. When the matched entry's word at `+0xc` is 0, it returns the word at `+4`. Entry `0x612f20c8` is assignment 69, function `0x0a`, alternate 0, so a search for 69 returns `0x0a`. The handler listing does not show `0x61083022` returning 69 or 10.
   9. STATIC. Event `0x01000033` at `0x6131be90` continues into `0x610a2df1`, whose id-10 pair `0x61308968` calls `0x610a58c7` with 1, and that path calls `0x610a6323` at `0x610a5921`. S1 up calls `0x610a6323` from `0x610aef7c` without `0x610a58c7`. `0x610a6323` has `calls (A1)` at `0x610a6346` and `0x610a63bd`.
   10. STATIC. The only direct stores of the four shadow words are in `0x60983156`: kind 0, position `0x020e`, vertical 1, horizontal 1. Its only direct caller is `0x6041a848`.
   11. STATIC. The walked button bodies contain no immediate of the seven writer keys, `0xe951`, `0x9fa1`, or `0xdfa1`. No 24-byte window before a direct call of `0x60063431` contains those keys. `0x609b3bca` is called only from `0x60902477`, with key `0x4601`.
   12. STATIC. Cached `0x90a1[1]` is struct `+0x11` at `0x609024b1`. Value 0 calls `0x609025aa` only when `0xa33ca30d` is also 0, and that path then sets the latch to 1. Any other cached value returns at `0x609024cf`. `0x609025aa` reaches `0x60890a0d`, which calls `0x6004cdf8` and, when that returns 0, `0x6004cefd`.
   13. PRIOR T1. Stored value 0 means always the selected AF target. Stored value 1 means detected-subject priority. Row 2155 is `0x90a1[1]`. T1 left the physical-key versus function-`0x0a` binding unresolved.
   14. PRIOR T8d, confirmed on this image in r1. Zone stored values 0, 1, 2, 3, 5, 10, 6, 7, 8, 9 are All, Single, Small, Cross, Mid, Large, C1, C2, C3, C4.
   15. PRIOR AFON-MENU-RESEARCH. Default AF-ON uses key id `0x000b`, which reads assignment 69, and the live start call observed at `0x610a267f` passed mode 1. The same note says the archived wrappers `0x610b962a` / `0x610b9653` did not run on that route.
   16. PRIOR T9d, as stated in brief section 0. On bare stock the twelve K1 edges were owner 255 and record `14,2,2,0,27,0,39,0,0,0`. PRIOR T7 decision: in the T7 session S1 did not enter `0x609b3c79` and the record stayed 0. T7 does not establish the T9d numbers.
   17. INFERRED. Conclusion (c). The shared writer formula does not show that an S1 down and an AF-ON down publish the same ten bytes. No per-byte difference instruction was identified either.

7. **Evidence for each claim:**
   1. R1 `work/out/listings/writer-accessor.txt` lines 8 and 18. `work/out/r2/scan-r2.json` `calls["0x609b3c79"]` and `pointers["0x609b3c79"]`. `work/out/r2/reverse-refs.txt` lines 1–3.
   2. R1 `writer-accessor.txt` lines 91–125.
   3. Same listing lines 142–157.
   4. R1 `shadow-replace.txt` and `struct-helpers.txt` lines 147–151. Second store: `priority-cache-b.txt` line 36, `0x609b39f0`. Bytes in `scan-r2.json` `checks.e951_store_609b39f0`.
   5. `work/out/r2/call-graph-r2.md` publication table. `dirty-wrappers.txt`, `pose-refresh.txt` lines 79–84, `pose-caller-a.txt` line 8, `pose-caller-b.txt`. `call-walk.txt` seeds `610aef37`, `610a240c`, `610a25f1`, `610a5620`: no `GOAL` line on those seeds.
   6. R1 `s1-handler.txt` lines 5–26. `work/out/r2/listings/s1-gate.txt` lines 1–18. Image end `0x62021020` from the byte length in `hashes-before.json`.
   7. `scan-r2.json` fixed row `0x6131be80`. `event-down.txt` lines 21–25 (`0x3b` / `0x61083022`) and 97–112 (`0x610830ab`, then `0x610a25f1`). `custom-start.txt` lines 2–3 and 43–64. `jump-slots.txt`.
   8. `assign-lookup.txt` lines 1–26. `scan-r2.json` fixed row `0x612f20c8`.
   9. Fixed row `0x6131be90`. `release-dispatch.txt`. `fn-0a-release.txt` lines 1–8. R1 `af-release.txt` lines 7–34. `call-walk.txt` seed `610a6323`.
   10. `scan-r2.json` `shadow`. `shadow-store.txt` lines 12–18. `setter-windows.json` key `0x60983156`.
   11. `call-walk.txt` `keys none` on the button seeds. `setter-windows.json` `0x60063431_count` is 0, the count of keyed windows, and the single `0x609b3bca` site is `0x60902477`. R1 `priority-use-a.txt` lines 41–47 for key `0x4601`.
   12. R1 `priority-use-a.txt` lines 62–72. `sync-body.txt` line 39. `sync-helper.txt` lines 35–42. `call-walk.txt` seeds `60873daf`, `60890a0d`, `6004cdf8`, `6004cefd`.
   13. `ref/tasks/T1-page27-mapping/decision.md` Q2 and Q3.
   14. `ref/tasks/T8d-afon-target-record-reconcile/decision.md`. R1 image bytes `00010203050a06070809` at `0x60617864`.
   15. `AFON-MENU-RESEARCH.md` at the live-route paragraphs naming `0x610a267f`, mode 1, event `0x01000032`, and the wrappers that did not run.
   16. Brief section 0 for the T9d record. T7 decision, "Blocked or open": the record stayed 0 and S1 did not enter the writer. T7 result claim 13 says the same for that session.
   17. Claims 5–12. `work/out/r2/zone-table-r2.md`.

8. **Tests and outcomes:**
   - PASS. Main and resource hashes match the brief before the r2 scan.
   - PASS. R2 project-file hashes before the r2 Ghidra launch match the r1 manifest. See claim 2 for what that does not prove.
   - PASS. Writer call bytes `cde100e020` and `cdbd00e020`, sync call bytes `ddeecb0100f02c`, and the `0x609024aa` latch bytes match `scan-r2.json` `checks`.
   - BOUNDARY. Ghidra's function manager splits `0x610a2407` and `0x610a2dec` after the prologue. The linear listings are the bodies used here.
   - BOUNDARY. `0x610a3035` and `0x610a3225`, the handlers on the S1-held rows, are only partly listed.
   - BOUNDARY. Sliding call encodings can sit inside another instruction. The button-path calls cited above were read back from the linear listings. The setter-window scan is the sliding encoding plus a 24-byte lookbehind.
   - No emulator test. Section 0 makes this a static task.

9. **New versus previously established:**
   - Claims 2–4 confirm the T8d writer rule and correct the r1 call graph's `0x609b39f2` to `0x609b39f0`.
   - Claim 5 is the direct publication chain. It contradicts r1 claim 16, which treated a shared writer as equal button output.
   - Claim 6 corrects r1 claim 5: the `+0x20` stores are gated, and the up call of `0x610a6323` is not.
   - Claims 7–9 add the custom-button route from `AFON-MENU-RESEARCH.md` that r1 did not follow. They confirm the live call address `0x610a267f` and the mode-1 encoding for table value 10.
   - Claim 12 corrects r1 claim 9. The r1 sentence that `0x60873daf` calls trace helpers only is withdrawn. The r1 sentence that `0x90a1[1]` cannot affect any record byte is withdrawn.
   - Claim 16 corrects r1 claim 15. The T9d numbers stay with T9d. T7's session left the record 0.
   - Claim 17 replaces r1 conclusion (a) with (c).

10. **Remaining uncertainties.** These are the blockers. Each one is enough to keep conclusion (c).
    - Whether an S1 down or an AF-ON down reaches `0x60447de4` or `0x609b3bb2` before the record is consumed. The direct calls do not. The indirect calls listed in claim 5's evidence are unresolved, and so is the unwalked tail of `0x610a3035` / `0x610a3225`.
    - Whether `0x61083022` returns the value 10 on the default AF-ON edge. The assignment lookup returns `0x0a` for search key 69, and value 10 is the mode-1 arm, but the handler does not show that return.
    - Whether any callee writes one of the seven cells, `0xe951[0]`, or the shadow words through a pointer. The direct stores and the direct setter windows do not.
    - `0x610a3735(0x31)` reads a table outside this image, so the S1 `+0x20` stores are not decided here. The up call of `0x610a6323` does not use that gate, and that function's indirect targets are unresolved.
    - `0x6004cdf8` and `0x6004cefd` are reached from cached `0x90a1[1] == 0` when the latch is 0. Their further callees were not walked to the record.
    - T1's open question, physical key versus function `0x0a` for row 2155, is still open.

    The observations that would decide it are paired stock record-publication records for S1 and for AF-ON, each with the button, the owner, the pose, the AF Button setting, the seven input cells, and the shadow words identified. That is an evidence requirement. This task does not run the emulator and does not recommend a hardware step.

11. **Recommended next actions.** None inside this task's scope. The deciding evidence is the set in section 10.

12. **Deviations from the brief.** Claim labels follow section 0. R1 evidence files were left in place and the new listings are under `work/out/r2/`. `work/result.md` was replaced so the conclusion the review reads is (c).

## Answers

1. **Half-press path.** S1 down is row `0x61339090` → `0x610aef37`. It stores 4 at object `+0x20` only when `0x610a3735(0x31)` returns 1, and it does not call the writer. The direct rebuilds are `0x60216e4b` and `0x60afab08` → `0x60447de4` → `0x6071128b` → `0x609b3b98` → `0x609b3c79`, when the pose group changes, and accessor `0x609b3bb2` when dirty is 1. Writer inputs and overrides are claims 2–4. This image does not show that the S1 down edge is what causes that rebuild.

2. **AF-ON path.** The default-route down row in the prior live note is `0x6131be80` → `0x610a2407`. When `0x610830ab` returns 2 it calls `0x610a25f1`. Value 10 in that function calls `0x610a5620` with mode 1 at `0x610a267f`, which is the call the prior live note recorded. Mode 1 can store word 2 at object `+0x124` (r1 `af-start.txt` / `afon-owner.txt`). No direct call from this body reaches `0x609b3c79`. The setting branch that is tied to a record-side call is claim 12, and it is not on this edge's direct calls. Branches that skip `0x610a5620`: `0x610830ab` returning something other than 2, D0 being `0x3b` or any table value other than 10, and the gates inside `0x610a5620` already listed in r1.

3. **Inputs and transforms.** On the direct calls, both edges use the writer's seven cells, the kind-2 position force, the priority clear, and the `0xe951` shadow replace. No direct store of those cells or of the shadow words was found in the walked button bodies. The shadow store `0x60983156` writes constants, from caller `0x6041a848`, which was not found on those bodies. Custom slots C1–C4 do not select another index in the writer. AF Home keys `0x9fa1` and `0xdfa1` have no `mov` immediate in the r2 key scan. The unclosed difference is indirect calls and pointer stores, not a second writer.

4. **Byte-level prediction.** For every zone in the table, in landscape and in EXIF 6, with "Always tracks", each record byte is not decided. The writer formula is in `work/out/r2/zone-table-r2.md`. No instruction was found that stores a different byte for one button. Release is also not decided: the two up edges meet at `0x610a6323` by different calls, and that function's indirect targets are unresolved.

5. **Custom-switch element.** Stored value 0 is "Always tracks" (PRIOR T1). Stored value 1 is the other option on that element. At `0x609024b4`, value 0 continues, and it calls `0x609025aa` only when `0xa33ca30d` is 0. Any other cached value skips that call. The call reaches `0x6004cdf8` and sometimes `0x6004cefd`. Those routines are synchronization calls, not a direct store of the ten-byte record. Their effect on a later record is open, so this result does not say that value 1 changes no record byte.

6. **Conclusion.** (c) Cannot be decided statically. The shared writer is confirmed. Equal inputs, equal shadow state, and a rebuild on each button edge before the record is consumed are not shown. The blockers and the deciding evidence are section 10.
