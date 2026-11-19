# T10 review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- The T2 and T2b decisions and your reviews of them (`ref\tasks\T2-cell-ownership\`, `ref\tasks\T2b-cell-ownership-gaps\`).
- `work\result.md`, `work\out\encoding.md`, `codec.mjs` and its tests.
- The listings, runners, JSONL logs, screenshots, stores, the manifest and seal, `work\out\cmd\` and `audit\`.

## Check

1. **Reader audit.**
   - Is each unresolved T2b item classified SAFE, REACHES-UNNAMED or UNRESOLVED, with an index computation and
     bounds that match the image?
   - Is the list of normal-operation readers and writers complete enough to support the classification?
   - Flag any reader of an unnamed index.
2. **Encoding.**
   - Does every field T6 consumes round-trip?
   - Is anything dropped? If so, it is a requirement change and must have been reported, not made.
   - Is invalid data decoded as "no profile"?
   - Do the unit tests cover the cases listed in the brief?
3. **Persistence.**
   - Is the store through the stock setter, and the load through the stock getter after the stock settings
     load?
   - No new flash writer.
   - Are the hook sites named and labelled?
4. **Tests.** Check all six:
   - **Save and reopen:** the profile is restored, and the AF-ON press uses it.
   - **Store difference.** Decode it yourself. It must lie only at the unnamed `0x5b82` offsets and the
     checksum word.
   - **Reset:** the record decodes as "no profile".
   - **C1 recall:** the profile is unchanged.
   - **Corruption:** the record decodes as "no profile".
   - **Art-filter cursor:** stock behaviour is unchanged.

   Does the run end `ok:true`?
5. **Records.**
   - Sections computed from the image; only the three amended section-7 bytes are allowed in section 7.
   - The manifest is complete, and the seal is in place.
   - No script was edited after it ran.
   - `0x1e71[0]` was read back.
   - No hardware recommendation.
   - The Workspace backup is stated as unknown.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.

## Correction round

Also read `brief.md` §5 and your previous review in `audit\previous-review.md`. For each §5 item, report DONE /
NOT DONE / WRONG / BLOCKED (honestly reported).

Check in particular:
- Each legal range is cited from firmware evidence. Where a range is unknown, the full width is used.
- Recompute the packed bit total yourself.
- If it fits: every brief §2.2–2.5 item, the six tests and `ok:true`.
- If it does not fit: the exact shortfall.
- The three singleton sites are back on the unresolved list.