# T2b-cell-ownership-gaps result

1. **Task identifier and brief version used:**
   T2b-cell-ownership-gaps, correction round in brief.md section 7 (after Sol review `run-20261118-052742-review`: REJECT). Section 0 of the brief governs. The brief hash is the `brief_sha256` field of `work/evidence-manifest.json`, computed from `brief.md` as it stands for this round.

2. **Research baseline used:** documents and sections read; input hashes verified (container/main/0106/OM-Emu patch).
   `TASK.md`, `brief.md` (sections 0, 6, and 7), `audit/previous-review.md`, `templates/result.md`, `work/out/verdict-v3.md`, `work/out/uses-5b82-v3.tsv`, `work/out/candidates-5b82-v3.tsv`. Main image `inputs/00_0100_50000020.decoded.bin`, 33554368 bytes, SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. The 0106 image is hashed in the manifest and was not opened. File offset = address − 0x60021020. Listings were checked against the main image (0 mismatches in `listings-setters-v1.txt`). No OM-Emu session. `OM_EMU_NVRAM` was not enabled. No OM-Emu patch was read.

3. **Work performed:** steps in order, with exact commands.
   Each command was `python -I`. Stdout, empty stderr, and exit code are in `work/out/command-log.txt`. In order: `python -I -c "print('ok')"`, `work\scripts\setters_5b82_v1.py`, `work\scripts\candidates_5b82_v4.py`, `work\scripts\setters_5b82_v2.py`, `work\scripts\fa64_d2_v1.py`, `work\scripts\fa64_stubs_v1.py`, `work\scripts\records_5b82_v4.py`, `work\scripts\patch_5b82_v1.py`, `work\scripts\manifest_5b82_v2.py`. Exit code 0 for each. The setter, candidate, and fa64 scripts were run once more after they had already been run, which rewrote their output files with the same results and is the run recorded in the log. No script file was edited after it had been run.

4. **Files examined:** paths, and addresses for disassembly.
   `ref/analysis/decompiled-main/all-functions.asm` at `FUN_6071327d` (0x6071327d..0x607132b4 and 0x607132f6..0x607132f8), `FUN_616a1d83` (0x616a1d83..0x616a1d91), `FUN_610cd6bd` (0x610cd6bd..0x610cd6c1), `FUN_6118c121` (0x6118c121..0x6118c14b), `FUN_6007f366` (0x6007f39b..0x6007f3db), and the caller at 0x6007f5ed. Image bytes at 0x607132b6..0x607132fb, 0x6035a038..0x6035a408, 0x60242324..0x60244850, 0x60195a1f, 0x607135ef, 0x6071365d, 0x607136f6, 0x60626c3c. `work/out/listings-setters-v1.txt` for the setter functions. `work/out/setters-5b82-v2.txt` for the table-B key halfwords.

5. **Files created:** paths under `work/` only; every one is listed in `work/evidence-manifest.json`.
   New this round: `work/scripts/setters_5b82_v1.py`, `candidates_5b82_v4.py`, `setters_5b82_v2.py`, `fa64_d2_v1.py`, `fa64_stubs_v1.py`, `records_5b82_v4.py`, `patch_5b82_v1.py`, `manifest_5b82_v2.py`, and under `work/out/` the matching `setters-5b82-v1.txt`, `listings-setters-v1.txt`, `close-5b82-v4.txt`, `candidates-5b82-v4.tsv`, `setters-5b82-v2.txt`, `fa64-d2-v1.txt`, `fa64-stubs-v1.txt`, `records-5b82-v4.txt`, `uses-5b82-v4.tsv`, `verdict-v4.md`, `INDEX.md`, `command-log.txt`. `work/result.md` and `work/evidence-manifest.json` were refreshed.

6. **Findings:** one numbered claim per line, each tagged with its evidence class:
   `OBSERVED-EMU` (emulator run) · `STATIC` (disassembly or bytes, with addresses) ·
   `DATA` (table bytes) · `INFERRED` (reasoning from the above) · `HYPOTHESIS`.
   1. STATIC. `FUN_601eff7a` loads the key with `movhu (A2),D0` at 0x601effc8 from the table at 0x6035a038 and rejects slot >= 0x7a before the setter call.
   2. DATA. That table has 122 records of 8 bytes, bound 0x6035a408 exclusive, and key 0x5b82 occurs in none of them.
   3. STATIC. `FUN_60196ee3`, `FUN_601971f5`, and `FUN_601972f1` load the setter key from record+0x4c or record+0x4e. The record base is `index * 0x9c + 0x60242324`.
   4. DATA. Indices 0x00..0x3c of that table contain no halfword 0x5b82. Link+0x14 is 0x3e in every one of those records. Link+0x6c is 0x1a at index 0x02 and 0x3c at index 0x35, and 0x3e otherwise.
   5. STATIC. The only call of `FUN_601972f1` is the raw instruction at 0x60195a1f, bytes `cd d2 18 f0 3c`, and it loads the index from `(0x50,sp)`.
   6. STATIC. The nine callers of `FUN_6041ab1d` pass D0 immediates 0x394, 0xbac1, 0xbbc1, 0x2994, or 0x1cb4. No image dword equals 0x6041ab1d.
   7. STATIC. In `FUN_607135ad`, A2 is 0xfa64 at 0x607135ef (bytes `26 64 fa`), A3 is copied from A2 at 0x6071365d (byte `9b`), and D2 is copied from A3 at 0x607136f6 (bytes `f1 de`).
   8. STATIC. The stubs at 0x607132b6..0x607132f2 write D0 and branch to `extbu D0; retf` at 0x607132f7. They do not write D2, so the later `mov D2,D0` is still 0xfa64.
   9. INFERRED. Those setters cannot name key 0x5b82. `FUN_607135ad` names 0xfa64 only. They are not on the blocker list.
   10. STATIC. Each of the 29 `mov 0x5b8` sites is consumed as an address, a UI id whose map entry is key 0x4bd1, a line number, an unused argument beside `CAvpiVenHEVCCodec.cpp`, or the multiply at 0x6007f3d5 whose product is 0x5742de00.
   11. DATA. 0x607c69f4 and 0x607cb986 are aligned halfwords 0x5b82 in the gap 0x60773486..0x607e80a3. 0x60539e07, 0x607c8e19, and 0x607e2ef9 are the same two bytes at odd addresses. No structure was identified for any of the five.
   12. INFERRED. The verdict stays UNRESOLVED because those five rows are unresolved. The adjustment span and the debug dispatchers stay classified and are not normal-operation writers. Replay's three enqueue sites are not fed key 0x5b82 by the setters in claims 1 through 9.

7. **Evidence for each claim:** file + line, or address range + bytes.
   Claims 1, 3, 5, 6: `work/out/listings-setters-v1.txt` and `work/out/setters-5b82-v1.txt`. Claim 5 bytes `cd d2 18 f0 3c` at 0x60195a1f, also in `work/out/setters-5b82-v2.txt`. Claims 2 and 4: the table dumps in those two files; `work/out/records-5b82-v4.txt` prints `tableA 0x5b82 False` and `tableB 0x5b82 False`. Claims 7 and 8: bytes in `work/out/fa64-stubs-v1.txt` and `work/out/setters-5b82-v2.txt` (the `jmp (A0)` listing). Claim 9: `work/out/verdict-v4.md` and `work/out/uses-5b82-v4.tsv`. Claim 10: one row per site in `work/out/candidates-5b82-v4.tsv`; the product line is in `work/out/records-5b82-v4.txt`. Claim 11: the five UNRESOLVED rows in `work/out/candidates-5b82-v4.tsv`. Claim 12: `work/out/verdict-v4.md`.

8. **Tests and outcomes:** PASS / FAIL / BOUNDARY. A boundary is not a failure and not a pass.
   Listing checks against the main image: PASS (0 mismatches in the kept setter listings; `records_5b82_v4.py` exit 0). Candidate table: 150 rows, 29 mov rows status `not a key`, 5 data rows UNRESOLVED. Cursor pages: BOUNDARY, carried from the previous round, not re-sampled. No emulator run, so no OBSERVED-EMU result this round.

9. **New versus previously established:** for each claim, "new", "confirms <doc §>" or "contradicts <doc §>".
   Claims 1 through 6: new. They close the setters `verdict-v3.md` left open and contradict that file's blocker list for those functions. Claim 7: confirms Sol's review that A2 is 0xfa64 at 0x607135ef and A3 is copied from A2 at 0x6071365d. Claim 8: new. It extends that lineage through the indirect stubs, which `verdict-v3.md` left unresolved. Claim 9: contradicts the blocker list in `verdict-v3.md`. Claim 10: new per-row status. It replaces the blanket PASS in `verdict-v3.md`, which Sol's review rejected. Claim 11: confirms the two aligned halfwords from `verdict-v3.md`, and withdraws the "unaligned data byte" exclusion for the three odd addresses. Claim 12: the verdict remains UNRESOLVED, for the data rows rather than for the setters.

10. **Remaining uncertainties.**
    The structure that contains 0x607c69f4, 0x607cb986, 0x60539e07, 0x607c8e19, and 0x607e2ef9. No image dword equals those addresses, and no stride was identified. They are not shown to be writers, and they are not shown to be unreachable as a key.

11. **Recommended next actions.**
    Name that structure, or bound the bytes so they cannot be read as key 0x5b82. The setter sources do not need another pass.

12. **Deviations from the brief** (or "none").
    none.

`evidence-manifest.json`: `{ "task", "brief_sha256", "inputs":[{path,sha256}], "sources":[{path,sha256}], "outputs":[{path,sha256,bytes}], "commands":[...], "tool_versions":{...} }`
