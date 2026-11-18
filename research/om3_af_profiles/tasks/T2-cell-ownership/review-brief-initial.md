# T2 review brief (Codex Sol, read-only)

You are the independent reviewer. You cannot write files; your final message is saved by the host.
Use PowerShell (`Get-FileHash`, `Get-Content`, `Format-Hex`, `Select-String`); Python is not on your
PATH. Do not run Ghidra or OM-Emu.

## Read first

`TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\verdict.md`, the
audit copies in `audit\`, and `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §8.

## Check

1. Recompute every manifest hash and the two input hashes.
2. For the array(s) declared OWNABLE or NOT OWNABLE:
   - **Completeness.** Independently search the raw decoded main
     (`inputs\00_0100_50000020.decoded.bin`) and `ref\analysis\decompiled-main\all-functions.asm`
     for the key value and its slot in plausible encodings (immediate halfword or word,
     little-endian bytes). List hits missing from `out\uses-<key>.tsv`. A single missed writer
     can invalidate OWNABLE.
   - **Classification.** For each *bulk* or *index* entry, check the listing: is the index source
     and its bound as claimed? Recheck the listing bytes against the raw main
     (offset = address − `0x60021020`).
   - **Dynamic.** Confirm that the JSONL shows the marker written through the native setter, read
     back after each step, in both repeats, with a matching control run. Note any step marked PASS
     that was not actually exercised.
3. Check that BOUNDARY items are not counted as passes, and that the verdict does not exceed the evidence.
4. Scope: no OM-Emu source change (see `audit\om-emu.diff` against the pinned diff), no writes
   outside `work\`, and no image.

Answer in the structure of `templates\review.md`.
