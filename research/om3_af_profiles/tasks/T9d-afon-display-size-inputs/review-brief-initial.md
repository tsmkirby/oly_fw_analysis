# T9d review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- The T9c decision and your two T9c reviews (under `ref\tasks\T9c-afon-display-causal-input\`).
- `work\result.md`, `work\out\display.md`, listings, traces, runners, JSONL logs, screenshots, the manifest and
  seal, `work\out\cmd\` and `audit\`.

## Check

1. **Sweep.** Every reached zone and the custom size; getter calls recorded per refresh; which zones draw marks.
2. **Inputs.** The call sites and keys for object+`0x374` and the size constants, with listings that match the
   image.
3. **The change.** Limited to the identified call sites, owner 2 and the current bank; unused branches removed;
   every remaining branch has a non-zero substitution count.
4. **Validation.** Expectations from K1e and full-K2 references hashed first; profile B draws visible marks of a
   different size at a non-centre position; seeded A, seeded B, K2 and K1 each `ok:true`; per-edge refresh results
   for changing edges and unchanged-frame assertions for the rest.
5. **Records.** Sections from the image (only the three amended section-7 bytes); complete inventory including the
   T6 baseline files; seal; no script edited after it ran; `0x1e71[0]` read back.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
