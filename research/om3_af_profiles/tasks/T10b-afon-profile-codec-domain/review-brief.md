# T10b review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- The T10 decision and your T10 reviews (under `ref\tasks\T10-afon-profile-storage-5b82\`).
- `work\result.md`, `work\out\encoding-v2.md`, `codec_v2.mjs`, its tests and their recorded output, the
  listings, the manifest and seal, `work\out\cmd\` and `audit\`.

## Check

1. **Domain.** Every field's domain includes the descriptor values, the registration defaults, the accepted
   initialization values (zero custom fields, T8c reset values) and partly initialized arrays. Each addition is
   cited. Unestablished ranges use full width.
2. **Packing.** Recompute the bit total yourself, with marker, version, pad and CRC. It fits in 26 bytes, or the
   exact shortfall is reported with the fields named.
3. **Pose-keyed layout.** The codec does not hard-code cell indices; the pose-to-index mapping is left to the
   reader.
4. **Tests.** Every case in brief §1.4 is present in the source and passed in the recorded output. Rerun them if
   Node is available to you; otherwise say so.
5. **Scope.** No emulator process, no OM-Emu import, no storage-location change, no field dropped.
6. **Records.** Complete manifest (every import and input), seal, no script edited after it ran.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
