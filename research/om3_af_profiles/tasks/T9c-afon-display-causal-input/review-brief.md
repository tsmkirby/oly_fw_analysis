# T9c review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- The T9b decision and your T9b reviews (under `ref\tasks\T9b-afon-display-coordinate-path\`).
- `work\result.md`, `work\out\display.md`, the addenda, the manifest and seal, the traces, listings, runners,
  JSONL logs, screenshots, `work\out\cmd\` and `audit\`.

## Check

1. **Trigger.**
   - The indirect entry into `0x61184dd6` and its dispatcher and condition are named from a recorded call
     stack.
   - The condition is reproduced without writing the cell.
2. **Causal trial.**
   - The getter return at `0x6041935b` is overridden only for `0x88b2`, as labelled test setup, with the cell at
     526.
   - Did the marks move as predicted, or was a negative result reported?
3. **Geometry.**
   - Is the relation between the getter return, 406, (16, 10) and the pixels supported?
   - Are the width and height sources established?
4. **The change, if made.**
   - Is it one labelled change, scoped to the identified call site and to owner 2, plus the refresh condition?
   - After every one of the 12 edges, is the full frame asserted from the established relation, together with
     the ten-byte target and the owner?
   - On S1-owned edges, is the frame the half-press frame?
   - Do K1 and K2 behave as stock?
   - Does the run end `ok:true`?
5. **No guess.** If item 1 was negative, was the change withheld?
6. **Records.**
   - Sections computed from the image; only the three amended section-7 bytes are allowed in section 7.
   - The T9b corrections, as an addendum.
   - The transitive inventory.
   - The seal.
   - No script edited after it ran.
   - `0x1e71[0]` read back.
## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
## Correction round

Also read `brief.md` §5 and your previous review in `audit\previous-review.md`. For each §5 item, report DONE /
NOT DONE / WRONG / BLOCKED (honestly reported).

Check in particular:
- Expected frames come from K1e and full-K2 reference runs, hashed before the candidate ran; the minus-6 rule is
  not used to derive them.
- K2 carries the same display hook as the candidate, unseeded.
- Both profiles exercise the hook's size/kind branches (non-zero substitution counts).
- Which refresh criterion was used, and whether it was met on every edge.
- Seeded A, seeded B, K2 and K1 each end `ok:true`.
