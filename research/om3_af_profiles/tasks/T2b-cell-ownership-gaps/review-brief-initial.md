# T2b review brief (Codex Sol, read-only)

You reviewed T2 twice; your reviews are in `ref\tasks\T2-cell-ownership\run-*-review\review.md`.
T2b closes your open items. Read `TASK.md`, `brief.md`, `work\result.md`,
`work\evidence-manifest.json`, `work\out\INDEX.md` and `work\out\verdict-v3.md`, then the tables,
listings and dynamic logs they cite, and the audit copies in `audit\`.

For each of brief §4 items 1–5, report DONE / NOT DONE / WRONG with evidence. In particular:

- spot-check at least 15 candidate dispositions in `candidates-5b82-v3.tsv` against the raw bytes;
- verify the caller/source analysis of `0x6183dcee`, `0x6183cc7d`/`0x60063567` and `0x600630a3`
  from the listings;
- verify the two debug-table dispatchers and their classification;
- confirm that the cursor-page steps actually completed in both repeats (or are honestly BOUNDARY);
- recompute every manifest hash.

Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu. Give the overall verdict
in the structure of `templates\review.md`, and state whether the OWNABLE-for-normal-use
classification (if claimed) meets brief §6.
