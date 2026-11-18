# T2b result

1. **Task identifier and brief version used:** T2b-cell-ownership-gaps. Brief version 2026-11-18. Section 0 was followed: writes only under `work\`, `ref\` and `inputs\` read only, no OM-Emu change, no network, no Git. `OM_EMU_NVRAM` was left `off` because no emulator session was run.

2. **Research baseline used:** `TASK.md`; `brief.md`; `templates/result.md`; Sol's review `ref/tasks/T2-cell-ownership/run-20261117-224756-review/review.md`; T2 decision and the T2 correction outputs under `ref/tasks/T2-cell-ownership/run-20261117-220544/work/` (`candidates-5b82.tsv`, `uses-5b82-v2.tsv`, the three dynamic JSONL logs). Main image `inputs/00_0100_50000020.decoded.bin`, 33554368 bytes, SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (prefix checked by `routes_5b82_v1.py`; full digest recorded in the manifest). Both input digests are in `work/evidence-manifest.json`. This round's claims cite the main image. Decompiled listing `ref/analysis/decompiled-main/all-functions.asm`, `functions.tsv`, `calls.tsv`.

3. **Work performed:**
   - `python -I work\scripts\routes_5b82_v1.py` from the workspace root. Exit 0. Stdout: wrote `work\out\routes-5b82-v1.txt` (524 lines), `listings-5b82-v3.txt` (572 instructions, 0 mismatches), `cursor-pages-v1.txt`.
   - `python -I work\scripts\close_5b82_v1.py`. Exit `-1073741819` (access violation). No output file. The script is kept and was not overwritten. It tried to retain every instruction string from the listing.
   - `python -I work\scripts\close_5b82_v2.py`. Exit 0. Stdout: `scan done 4805945 kept 9070 bad 0`, then `rows 150 UNRESOLVED 2`. Wrote `close-5b82-v2.txt` and `candidates-5b82-v3.tsv`.
   - `python -I work\scripts\fillers_5b82_v1.py`. Exit 0. Stdout: `sites 64 saved 64`. Wrote `fillers-5b82-v1.txt`.
   - The verdict, the use table, the thunk listing, this file, and the manifest were written from those outputs. The manifest script's own command is in `work\out\command-log.txt`.

4. **Files examined:** the brief, the template, Sol's review, the T2 candidate and use tables, the three T2 JSONL logs (the `cursor-page-search` step only), `all-functions.asm` at the addresses cited in section 6, `functions.tsv`, `calls.tsv`, and the decompiled `6183cc7d.c`, `6183b9aa` as already reflected in the route scan, `604193ca.c`, `603c2731.c`, `6006bf7f.c`, `60196ee3.c`, `618c97a2.c`, `616a192d.c`. Image addresses are main-image addresses. File offset is address minus `0x60021020`.

5. **Files created:** everything under `work\` listed in `work/evidence-manifest.json`. The current tables are named in `work/out/INDEX.md`.

6. **Findings:**

   1. STATIC. The only call to `0x6183dcee` is `0x6183bdef` (`cd ff 1e f0 10`), the thunk for outer adjustment command `0x9029`. Inner command 53 loads the key from record+8 and calls `FUN_60063962` at `0x6183e9b5`. That call is a whole-key ROM default.
   2. STATIC. `FUN_6183cc7d` has two callers: `0x61841ea8` (outer `0x902b`, inner 18, key at record+8) and `0x6183bd67` (outer `0x9007`, key at record+4, bytes in `listings-adj-thunks-v1.txt`). Both can pass a runtime key. For type 2 the function calls the span copier at `0x6183cd6e`.
   3. STATIC. `FUN_6183bc55` consults the handler table only when the halfword at RAM `0x62d31d10` is 1. Command `0x1002` is what stores 1 (`80 01` at `0x6183be63`). The adjustment task is the pointer at `0x6003915c`.
   4. DATA. Of the 31 aligned halfwords `0x5b82`, the key constants are `0x600e5874` and the three map entries `0x606274e0`, `0x60627518`, `0x60627524`. No filler's straight-line D0 immediate is `0x5b82`. The 13 ROM keys at `0x605af01c` do not include it. `FUN_6006bf7f` uses `0x4e7a`..`0x4eea`.
   5. STATIC. The queue is filled only at `0x600634d9` (type 1, `80 01`), `0x60063668` (type 2, `80 02`), and `0x6006397b` (type 4, `80 04`). Replay is `FUN_600630a3`, installed at `0x600631cd`.
   6. STATIC. Both debug tables are 63 command entries. Slot `0x602ec448` and slot `0x602eda1c` are entry 14, name `prm`, handler `0x600619a9`. Dispatcher `FUN_60215a26` is reached only from the `dbgall` handler. Dispatcher `FUN_6021818d` is the `Tsk_USHL` task plus `FUN_602181e3`, and `FUN_618c97a2` calls that shell only when the adjustment flag is already 1.
   7. STATIC. The 29 `mov 0x5b8` sites were followed to a consuming instruction. None is shifted into key `0x5b82`. UI id `0x5b8` maps at `0x60626c3c` to `d1 4b 01 00`.
   8. DATA. `0x607c69f4` and `0x607cb986` are aligned `0x5b82` in the gap `0x60773486`..`0x607e80a3`. No image dword equals either address. The structure is not identified.
   9. STATIC. These one-cell setters still take the key from a record or a stack slot, and the window does not bound the index: `FUN_60196ee3` at `0x60196f73` and the sibling calls in `FUN_601971f5` and `FUN_601972f1`; `FUN_601eff7a` at `0x601effc8`; `FUN_6041ab1d` at `0x6041ab71`; and the A3/D2 copies in `FUN_607135ad`.
   10. DATA. In each of the three T2 logs, all twelve `cursor-page-search` samples are the C1 action list Recall, Assign, Save Settings, Custom Mode Name, Set, Reset.

7. **Evidence for each claim:**
   1. `work/out/routes-5b82-v1.txt` relative-call section and inner-switch line for command 53; `work/out/listings-5b82-v3.txt` range `0x6183e991`..`0x6183e9c9`; `work/out/listings-adj-thunks-v1.txt`.
   2. `routes-5b82-v1.txt` callers of `0x6183cc7d`; `listings-5b82-v3.txt` range `0x61841e83`..`0x61841eb8` and `0x6183cd6e`; `listings-adj-thunks-v1.txt` for `0x6183bd4b`.
   3. `listings-5b82-v3.txt` range `0x6183bc55`..`0x6183be43`; flag bytes in `routes-5b82-v1.txt`; task slot `0x6003915c`.
   4. `routes-5b82-v1.txt` aligned-halfword list, filler-immediate list, and the 13 ROM keys; `fillers-5b82-v1.txt` for `FUN_6006bf7f` and the strings.
   5. `routes-5b82-v1.txt` enqueue section; `listings-5b82-v3.txt` ranges for `0x600634c0`, `0x60063658`, `0x60063962`, `0x600631c8`.
   6. `routes-5b82-v1.txt` debug-table dump and relative callers; string `prm` at both entry-14 name pointers.
   7. `close-5b82-v2.txt` section "control flow of mov 0x5b8"; `candidates-5b82-v3.tsv` source `cf-v3`.
   8. `close-5b82-v2.txt` section "data islands"; `candidates-5b82-v3.tsv` source `data-v3`.
   9. `fillers-5b82-v1.txt` windows for `0x60196f7b`, `0x601effcf`, `0x6041ab7a`, `0x607136b7`, `0x60713754`, `0x60713780`.
   10. `work/out/cursor-pages-v1.txt`.

8. **Tests and outcomes:**
   - Candidate control-flow pass: PASS for the 29 `mov 0x5b8` rows (each consumed without becoming key `0x5b82`). The two data halfwords are UNRESOLVED, which is a recorded disposition, not a failed test.
   - Listing byte check: PASS. 572 instructions, 0 mismatches (`listings-5b82-v3.txt`).
   - Parameter routes and debug dispatchers: PASS as classification. The adjustment span is classified and is not a normal-operation path. Four runtime one-cell groups stay open.
   - Cursor UI edits of 2017, 2031, and 2034: BOUNDARY. The twelve samples never left the C1 action list. No new session was run, so no C1-managed setting was logged beside a cursor change.
   - Ownership verdict: the acceptance test for OWNABLE is not met, because those runtime setters are unresolved and can write a non-zero value into an unnamed cell.

9. **New versus previously established:**
   - Claims 1, 2, and 3: new. They close the two parameter routes Sol left open, and they correct "not closed" on `0x6183dcee` and `0x60063567` in `uses-5b82-v2.tsv`.
   - Claim 4: confirms T2's four real key uses, and adds the negative checks on the ROM table and on `FUN_6006bf7f`.
   - Claim 5: confirms the three queue fillers and the type constants. New as a single checked list.
   - Claim 6: new. Corrects the v2 name on the debug slots. Confirms Sol's two dispatcher addresses and classifies the entry paths.
   - Claim 7: new. Replaces the eight-instruction exclusion Sol rejected.
   - Claim 8: new disposition. The "outside any function" sentence is replaced with the gap bounds and the pointer check, and the rows stay UNRESOLVED.
   - Claim 9: new. These are the remaining blockers.
   - Claim 10: confirms Sol's correction of the twelve-tab claim, from the three logs.
   - Carried, not reopened: registration layout, map indices 5/12/13, mapped setter, ROM-zero whole-key default, bank-7 invalid rebuild, 18-byte profile layout, and the completed C1 cycle.

10. **Remaining uncertainties.** Whether `FUN_60196ee3`, `FUN_601971f5`, `FUN_601972f1`, `FUN_601eff7a`, `FUN_6041ab1d`, and the A3/D2 sites in `FUN_607135ad` can load key `0x5b82` during normal operation, and which index they would write. The record shape of the two data halfwords in the 478237-byte pool. Whether an adjustment host is ever treated as normal operation; this result classifies it as not normal, and the verdict does not depend on that, because the open setters above are enough to withhold OWNABLE.

11. **Recommended next actions.** Trace the record pointer in `FUN_60196ee3` (the value at `(0x10,sp)` / the result of `FUN_6019782e`) back to a table and test that table for halfword `0x5b82`. Do the same for A2 in `FUN_601eff7a`, for `(0x20,sp)` in `FUN_6041ab1d`, and for A3 and D2 in `FUN_607135ad`. Identify the pool that contains `0x607c69f4`. Leave the cursor-page UI as a separate task; the type-3 pages were not on the path the C1 search walked.

12. **Deviations from the brief.** No new dynamic JSONL and no NVRAM file. The cursor steps stayed BOUNDARY, and the C1 cycle Sol already accepted was not repeated, so `OM_EMU_NVRAM` was not pointed at a new file. Ghidra was not launched. The thunk bytes between `0x6183bceb` and `0x6183be06` are absent from `all-functions.asm`; they were decoded from the image with encodings taken from that listing. `close_5b82_v1.py` faulted and was left in place.
