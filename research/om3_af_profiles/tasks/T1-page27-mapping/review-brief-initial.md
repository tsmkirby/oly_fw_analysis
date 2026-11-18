# T1 review brief (Codex Sol, read-only)

You are the independent reviewer. You cannot write files; your final message is saved by the
host. Do not run Ghidra, OM-Emu or any program that writes files. Use read-only commands only:
file reads, hashing, and `python -I` scripts that print to stdout.

## Read first

1. `TASK.md`, `brief.md` (what was asked, and its acceptance criteria).
2. `work\result.md`, `work\evidence-manifest.json`.
3. Baseline: `ref\PROJECT-STATE.md` §1–3; `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §1, §6,
   §8 "How stored settings work", and "Live acceptance regression and third menu row".

## Check

- Recompute SHA-256 for every manifest entry and for `inputs\*.decoded.bin`.
- For each STATIC/DATA claim, read the raw bytes yourself from
  `inputs\00_0100_50000020.decoded.bin` (file offset = address − `0x60021020`) and compare them
  with `work\out\page27-rows.txt`. Recheck the 36-byte row and 12-byte option decoding independently.
- For each OBSERVED-EMU claim, check that `work\out\menu-toggle.jsonl` actually shows the claimed
  rendered text **and** the readback after a native key step, in both repeats, and that the
  control run stayed 1/1.
- Glyph meanings: is the evidence direct (resource or font data, or a string with an unambiguous
  meaning), or only inferred? Grade accordingly.
- Q3 (AF-ON binding): does the evidence distinguish "the AF-ON key" from "a custom switch"?
- Reconciliation with §6: is the stated correction supported by the bytes?
- Scope: the scripts in `work\scripts\` write only under `work\`, and no overlay or image was produced.

## Output

Use the structure in `templates\review.md` exactly.
