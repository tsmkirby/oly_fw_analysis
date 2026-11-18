# T2b artifact index

Current verdict: **UNRESOLVED** for normal use. See `verdict-v3.md`.

| File | What it is |
|---|---|
| `verdict-v3.md` | Classification. Supersedes T2 `verdict.md` and `verdict-v2.md` for this key. |
| `candidates-5b82-v3.tsv` | All 150 candidate rows. The 29 `mov 0x5b8` rows use control flow. Two data halfwords stay UNRESOLVED. |
| `uses-5b82-v3.tsv` | Use table. Rows marked `carried` were not reopened. Rows marked `corrected` or `new` are from this round. |
| `listings-5b82-v3.txt` | Bounded listings, 572 instructions, 0 mismatches against the main image. |
| `listings-adj-thunks-v1.txt` | Adjustment thunks that the decompiler listing skips, including command 0x9007. |
| `routes-5b82-v1.txt` | Command table, relative callers, queue types, aligned halfwords, filler immediates. |
| `close-5b82-v2.txt` | Control-flow trace of the 29 moves, thunk-gap decode, data-gap bounds. |
| `fillers-5b82-v1.txt` | Eight instructions before every runtime filler call, plus the ROM-key and string checks. |
| `cursor-pages-v1.txt` | The twelve samples from each of the three T2 logs. One distinct sample, the C1 action list. |
| `command-log.txt` | Commands, exit codes, and where the full output went. |

Scripts, in the order they were run: `work/scripts/routes_5b82_v1.py`, `work/scripts/close_5b82_v1.py` (process fault, no output file), `work/scripts/close_5b82_v2.py`, `work/scripts/fillers_5b82_v1.py`. None of those files was overwritten after it ran.

No new emulator session. No new NVRAM file. The cursor steps stay BOUNDARY, for the reason in `cursor-pages-v1.txt` and `verdict-v3.md`.
