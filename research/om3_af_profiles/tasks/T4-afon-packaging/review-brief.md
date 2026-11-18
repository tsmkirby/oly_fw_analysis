# T4 review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json` and `work\out\packaging.md`,
then the listings, `work\out\cmd\` and `audit\`.

For each of the six questions in brief §2, report one of: ANSWERED (supported), ANSWERED (overstated),
NOT ANSWERED or WRONG, with evidence. In particular, check:

1. **Section 7.** Check the compression format, the loader and the checksum claims against the listings.
   Check the listings against `inputs\00_0100_50000020.decoded.bin`
   (offset = address − `0x60021020`).
2. **Unused binding records.** Check every claim that a binding record is spare or unused. Each one needs
   proof, not absence of a search hit.
3. **Owned space.** Check every claim of owned space against the standard in `HARDWARE-STAGE0-RECORD.md`.
4. **Pointer locations.** Check the face-table and descriptor-table pointer locations.
5. **Native routing sites.** Check the native value-routing sites and their sizes.
6. **Byte budget.** Check the byte budget and the alignment rules.

Recommendations must be labelled as recommendations. No storage decision may be implied.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
