# T10 result

## Classification of the unresolved `0x5b82` items

| Item | Class | Effect on an unnamed index |
| --- | --- | --- |
| Setter-table key fields +0x50 and +0x52 | SAFE | No read and no write of key `0x5b82`. The index formula is an unbounded `exthu` sum, and the 61 ROM records do not contain the key. |
| `mov 0x5b8` at `0x616ddb03` | SAFE | Diagnostic line number. Not a cell index. |
| `mov 0x5b8` at `0x6118bf47` | SAFE | Object field pointer `A2+0x5b8`. Not a cell index. |
| `mov 0x5b8` at `0x6118c058` | SAFE | Same object-field pointer. |
| Data `0x607c69f4`, `0x607cb986`, `0x60539e07`, `0x607c8e19`, `0x607e2ef9` | UNRESOLVED | No consumer and no index computation. Not shown to read or write a cell. |

Detail is in `work/out/reader-audit.md`.

1. **Task identifier and brief version used:** T10-afon-profile-storage-5b82, brief version 2026-11-19. Section 0 was applied: Q7 option (a), the T3j, T5 and T6 rules, emulator only, Subject Detect left unattempted because no emulator process ran, and the requirement guard.

2. **Research baseline used:** `brief.md`; `TASK.md`; `templates/result.md`; `ref/PROJECT-STATE.md` Q7; `ref/analysis/button-af/AFON-MENU-RESEARCH.md` §8; T2 decision and `verdict-v2.md`; T2b decision, Sol review `run-20261118-062119-review`, and `verdict-v4.md`; T6 `out/design.md`; T3m `profile-layout.md`; T3l `design.md`; T4b README (boot order, not re-traced); T8 decision (save witness, not re-run). Main image `inputs/00_0100_50000020.decoded.bin`, SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, length 33,554,368 bytes. Resource `inputs/02_0106_458c0020.decoded.bin` was not opened; its hash is in the manifest. No emulator module was imported.

3. **Work performed:** Static audit, then the encoding budget. The budget does not fit, so the work stops before a codec, before any emulator process, and before the six tests.
   - Command 01: `python -I work/scripts/audit_5b82_t10.py`. Exit 1. It asserted length 33554432. The file is 33554368. The script was not edited.
   - Command 02: `python -I work/scripts/hash_image_t10.py`. Exit 0. The digest matches the documented digest.
   - Command 03: `python -I work/scripts/make_audit_t10b.py`. Exit 0. Writes `audit_5b82_t10b.py` with the measured length.
   - Command 04: `python -I work/scripts/audit_5b82_t10b.py`. Exit 0. 47 byte checks, 0 table hits for `0x5b82`, payload 28 bytes.
   - Command 05: `python -I work/scripts/scan_run_t10.py`. Exit 0. The `0x60539e07` halfword is in a 4-record run.
   Every command went through `work/scripts/run_logged.mjs`. Experiment versions used: 0. Static commands are not versions.

4. **Files examined:** The image, at the addresses in `work/out/reader-audit.md` and `work/out/audit-5b82-t10b.json`. Listings in `ref/analysis/decompiled-main/all-functions.asm` for `FUN_601972f1`, `FUN_610cd6bd`, `FUN_6118bed7`, `FUN_6118bfb6`, and `FUN_616a1cfe`. The T2 and T2b verdicts and the Sol review cited above. T6 `design.md`. T3m `profile-layout.md`.

5. **Files created:** Under `work/` only. `result.md`, `out/reader-audit.md`, `out/encoding.md`, `out/audit-5b82-t10b.json`, `out/run-60539e07-t10.json`, `out/cmd/` for commands 01–05 and the manifest and seal commands, `scripts/run_logged.mjs`, `scripts/audit_5b82_t10.py`, `scripts/hash_image_t10.py`, `scripts/make_audit_t10b.py`, `scripts/audit_5b82_t10b.py`, `scripts/scan_run_t10.py`, `scripts/build_manifest_t10.mjs`, `scripts/seal_t10.mjs`, `evidence-manifest.json`, and `out/seal-t10.json`. The manifest lists the hashes.

6. **Findings:**
   1. STATIC. The key fields at table-B record+0x50 and record+0x52 are not `0x5b82` in any of the 61 records, and no aligned halfword in those records is `0x5b82`. The index at the `0x6019757f` setter is `exthu` of a stack counter plus the dword at record+0x64. The index at the `0x6019761f` setter is the low 16 bits of the dword at record+0x68. Those calls do not address this key. Evidence: `work/out/audit-5b82-t10b.json` checks and `table_b`.
   2. STATIC. `mov 0x5b8` at `0x616ddb03` is the line-number argument of a diagnostic whose format is `%s(%u): %s` and whose file string is `CAvpiVenHEVCCodec.cpp`. It is not a cell index. Evidence: the same JSON, `format_string` and `cpp_string`.
   3. STATIC. `mov 0x5b8` at `0x6118bf47` and at `0x6118c058` is added to A2 and passed as a pointer into `FUN_610cd6bd`, which copies from that pointer at `0x610cd71b`. Sibling displacements in the same function are `0x38c`, `0x3e8` and `0x61a`. Not a cell index. Evidence: the same JSON.
   4. STATIC. The five data occurrences of the bytes `82 5b` have no little-endian pointer in the image. `0x60539e07` is the last halfword of one record in a 4-record, 10-byte run (`work/out/run-60539e07-t10.json`). No consumer of that halfword was found. The five stay UNRESOLVED. What is missing is the consumer and the index.
   5. STATIC. Normal operation that addresses the key by index is the UI map at indices 5, 12 and 13, and `FUN_6041937f` for those indices. Registration and `FUN_6006398b` write 0 to every index, including the unnamed ones. The bank-7 image copy carries every byte of the key. Evidence: registration and map bytes in the audit JSON; the setter and the bank copy are carried from T2 and AFON-MENU-RESEARCH §8.
   6. STATIC. The profile fields named in the brief are 28 bytes at cell width: zone banks 1, 5, 3 (3), size `0x9a41[0]` (1), position banks 1, 5, 3 (6), `0x1dd1` indices 0..9 (10), `0x1de1` indices 0..7 (8). The unnamed cells are 26 bytes. The payload does not fit together with a marker and a checksum. Evidence: `work/out/encoding.md` and `budget` in the audit JSON.
   7. INFERRED. No codec and no emulator session were run, because writing a smaller record would drop `0x1de1` or part of `0x1dd1`. Section 0 forbids that drop.

7. **Evidence for each claim:** The file and the addresses are in the finding. Command 04 is `work/out/cmd/04.out` (`checks 47 table_hits 0 payload_bytes 28 stop True`). Command 05 is `work/out/cmd/05.out` (`count 4`, the run contains `0x5b82`).

8. **Tests and outcomes:** The capacity guard is a STOP. It is not a failed emulator assertion. The six tests in brief §2.4 were not started. Outcome of those tests: NOT RUN. The five data sites stay UNRESOLVED, which is a BOUNDARY on ownership, not a pass. Command 01 is a failed script assertion on a wrong length constant; the image digest matches. Commands 02–05 exited 0.

9. **New versus previously established:**
   1. Confirms T2b Sol review claim 4 for the absence of `0x5b82` in table B, and supplies the +0x50 and +0x52 loads that review said were missing.
   2. Confirms the Sol correction for `0x616ddb03`: D2 survives into `0x616a1d41`, and the format string contains `%u`.
   3. Confirms the Sol correction for `0x6118bf47` and `0x6118c058`: the pointer reaches `mov A3,A0` at `0x610cd71b`.
   4. Confirms T2b's five data occurrences as still without a consumer. New: the `0x60539e07` window is a 4-record run, which is not yet a consumer.
   5. Confirms T2: named indices 5, 12, 13; ROM default zeros; C1 is not re-tested here.
   6. New: the T6 field list plus `0x1de1`, at cell width, is 28 bytes and does not fit in 26 with a marker and a checksum. Confirms T2's arithmetic that the custom presets and the step table do not fit, now on the pose banks T6 uses.
   7. New relative to a completed persistence task: the emulator work was not started.

10. **Remaining uncertainties.** The five data occurrences still have no consumer. The +0x50 index is a runtime sum; its cap was not needed because the key is absent. Whether a legal zone, size, position, or custom-dimension value uses fewer bits than the cell is not established. OM Workspace backup behaviour is out of scope and unknown.

11. **Recommended next actions.** The owner decides whether a named field is dropped or whether option (b), a new registered key, is the storage. This task does not choose. Until that decision, do not write the unnamed cells.

12. **Deviations from the brief.** `codec.mjs`, its unit tests, the store and load hooks, and the six emulator tests were not produced. Section 0's requirement guard overrides those steps: the named fields do not fit, and dropping one is not allowed. Command 01's length constant was wrong; the failed script was kept and a new script was used. No other deviation.
