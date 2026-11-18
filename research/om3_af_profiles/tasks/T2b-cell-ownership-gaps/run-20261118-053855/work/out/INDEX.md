# T2b artifact index

Current verdict: **UNRESOLVED** for normal use. See `verdict-v4.md`. The open setters are closed. Five data rows stay unresolved.

| File | What it is |
|---|---|
| `verdict-v4.md` | Classification for this correction round. The parameter routes and debug dispatchers are the ones in `verdict-v3.md`. |
| `candidates-5b82-v4.tsv` | All 150 candidate rows. Each of the 29 `mov 0x5b8` rows names its consumer. Five data rows stay UNRESOLVED. |
| `uses-5b82-v4.tsv` | Use table. `FUN_607135ad` is key 0xfa64 only. The four setter groups cannot name 0x5b82. |
| `records-5b82-v4.txt` | Key-load check (26 calls, 4 of them at record+0x4e), pointer-run bounds, product 0x5742de00, and the three strings. |
| `setters-5b82-v1.txt` | Table A dump, table B scan, caller windows, absolute-pointer scan. |
| `listings-setters-v1.txt` | Bounded listings checked against the image, 0 mismatches. |
| `setters-5b82-v2.txt` | Key halfwords and links for indices 0x00..0x3c, the raw call at 0x60195a1f, and the listed body of `FUN_6071327d`. |
| `fa64-stubs-v1.txt` | The 64 bytes the asm listing skips after `jmp (A0)`, plus the nonzero jump-table ids. |
| `fa64-d2-v1.txt` | First handler check. Its targets are not function entries, so the verdict does not use it. |
| `close-5b82-v4.txt` | Control-flow trace that the per-row statuses were checked against. The tracer's own UNRESOLVED marks are not the final status. |
| `verdict-v3.md` | Previous classification. Kept. |
| `candidates-5b82-v3.tsv` | Previous candidate table. Kept. |
| `uses-5b82-v3.tsv` | Previous use table. Kept. |
| `command-log.txt` | Commands from this correction round, with the stdout that was printed. |

Scripts, in the order they were run this round: `setters_5b82_v1.py`, `candidates_5b82_v4.py`, `setters_5b82_v2.py`, `fa64_d2_v1.py`, `fa64_stubs_v1.py`, `records_5b82_v4.py`, `patch_5b82_v1.py`, `manifest_5b82_v2.py`. None of those files was overwritten after it ran. Earlier scripts (`routes_5b82_v1.py`, `close_5b82_v1.py`, `close_5b82_v2.py`, `fillers_5b82_v1.py`, `manifest_5b82_v1.py`) are unchanged.

No new emulator session. No new NVRAM file. The cursor steps stay BOUNDARY.
