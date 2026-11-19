# T9b review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- The T9 decision and your two T9 reviews (under `ref\tasks\T9-afon-target-display\`).
- `work\result.md`, `work\out\display.md`, the manifest and its supplements.
- The traces, listings, runners, JSONL logs, screenshots, `work\out\cmd\` and `audit\`.

## Check

1. **Model and versions.** `OM_EMU_MODEL=E147` is set and asserted. Every emulator process is counted, and there
   are at most six.
2. **Coordinate object.**
   - Does the chronological trace from setter `0x60063431` reach the store that fills the memory reloaded at
     `0x610eedee`?
   - Are the object's address, fields and writer supported?
   - Is the route (direct, callback or cached copy) supported?
   - Do the listings match the image?
3. **Invalidation.**
   - Is the repaint trigger and its writer supported?
   - Is it shown whether an AF-ON press reaches it, both seeded and unseeded?
4. **The change, if made.**
   - Is it one labelled change, at the identified writer and invalidation, using the stock writer where
     possible?
   - After every one of the 12 edges, is the full expected frame (four rectangles: position, size and colour)
     asserted with executable expectations derived from the target?
   - Are the ten-byte target and the owner asserted?
   - On the S1-owned edges, is the frame the half-press frame?
   - Do K1 and K2 behave as stock?
5. **No guessing.** If the path was not identified, was that reported rather than a hook being guessed?
6. **Records.**
   - Sections computed from the image; only the three amended section-7 bytes are allowed in section 7.
   - The transitive module inventory.
   - The final seal.
   - No script edited after it ran.
   - `0x1e71[0]` read back.
   - Nothing presented as native, as a storage decision, or as a hardware dependency.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.