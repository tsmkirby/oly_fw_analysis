# T8c review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- The T8b decision and your two T8b reviews (under `ref\tasks\T8b-afon-integrated-acceptance-generated\`).
- `work\result.md`, the manifest and seal, the listings, runners, the generated table and checker, JSONL logs,
  screenshots, `work\out\cmd\` and `audit\`.

## Check

1. **Q1, banks.**
   - The editor write indices and the reader read indices for each pose and link state.
   - Link cells read back, and set through native keys.
   - Listings of both index computations that match the image.
   - Is the explanation of T7's 1/5/3 against T8b's 0/4 supported?
2. **Q2, initialization.**
   - The stock reset ran through native keys.
   - The values read back.
   - The disagreement table: reset against ROM against the fresh store.
3. **The change.**
   - It is one combined labelled change, limited to the bank mapping and the initialization, or no change at
     all, with the reason.
   - The accepted components are otherwise unchanged.
4. **Short integrated proof.**
   - Identity is asserted before every commit key.
   - `0x1e71[0]=0` after every key.
   - Exits matched as actual sequences.
   - Banks validated against the cells.
   - No stale targets.
   - The AF-ON target expectations come from K1e's half-press target after the same keys.
   - The press and release are asserted per pose.
   - The normal edit equals K2.
   - `ok:true`.
5. **Records.**
   - Sections computed from the image; only the three amended section-7 bytes are allowed in section 7.
   - The required baseline documents are in the manifest.
   - The seal.
   - No script edited after it ran.
   - Nothing presented as native or as a storage decision.
## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.