# T9 correction review (Codex Sol, read-only)

## Read

- `brief.md` §5, and your previous review in `audit\previous-review.md`.
- The updated `work\result.md`, `work\out\display.md`, the manifest and its supplements, the traces, listings,
  runners, JSONL logs, screenshots, `work\out\cmd\` and `audit\`.

## Report

For each of §5 items 1–6, report DONE / NOT DONE / WRONG / BLOCKED (honestly reported), with evidence.

## Check in particular

- **Model.** `OM_EMU_MODEL=E147` was set, and the model is asserted at the start of every session.
- **Drawing path.**
  - A chronological trace runs from the framebuffer writes of the corner pixels back to the coordinate
    computation.
  - The return at `0x609eece0` and the caller `0x6041a202` are accounted for.
  - The single-cell causal trial.
  - What triggers the redraw, and whether an AF-ON press triggers it.
  - The listings match the image.
- **Controls.** K2 is the unseeded T6 configuration. The earlier Z5 control is labelled correctly.
- **The change, if made.**
  - It is one labelled change at the identified path.
  - The frame region is asserted after every one of the 12 edges, with executable expectations.
  - The half-press frame is unchanged on the S1-owned edges.
  - K1 and K2 behave as stock.
- **Wording.** Claim 8 is narrowed. No hardware dependency is claimed without the alternatives having been
  tried.
- **Records.**
  - Sections computed from the image; only the three amended section-7 bytes are allowed in section 7.
  - Manifest completeness, including the transitive modules and the final outputs.
  - No script edited after it ran.
  - `0x1e71[0]` read back.
  - Nothing presented as native, as a storage decision, or as a hardware recommendation.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
