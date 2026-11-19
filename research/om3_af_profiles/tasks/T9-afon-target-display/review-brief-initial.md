# T9 review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- `work\result.md`, `work\evidence-manifest.json` and its supplement.
- `work\out\display.md`, the listings, runners, JSONL logs, screenshots, `work\out\cmd\` and `audit\`.
- The T6 component in `ref\analysis\button-af\readiness\t6-afon-target-size-position\`.

## Check

1. **Emulator capability.**
   - Is the claim about what OM-Emu draws on the shooting screen supported by the screenshots?
   - If an AF frame is claimed, check that it is located by region or hash.
   - If BOUNDARY is claimed, check that the alternatives in §2.1 were actually tried.
2. **Source.**
   - Is the identified frame-positioning routine and what it reads supported by bounded listings that match
     the image, and by dynamic evidence where claimed?
3. **Behaviour.**
   - Is the statement of whether the frame follows the AF-ON target, at each recorded edge, supported?
   - Is it compared with K2?
4. **The change, if made.**
   - Is it one change, and labelled?
   - Is the frame asserted after every one of the 12 edges?
   - Is the half-press frame unchanged on the S1-owned edges?
   - Do K1 and K2 behave as stock?
5. **Records.**
   - Sections computed from the image; only the three amended section-7 bytes are allowed in section 7.
   - Is the manifest complete, including the final outputs?
   - Was any script edited after it ran?
   - Was `0x1e71[0]` read back?
   - Is anything presented as native, as a storage decision, or as a hardware dependency without the
     alternatives having been tried?

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
