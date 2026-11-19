# T10b: AF-ON profile codec: complete value domain, pose-keyed layout (static + unit tests; no emulator)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra (read-only listings) · Runs concurrently with the T8c and T9c corrections

## 0. Rules that override everything below

- **Read first:**
  - the T10 decision (`ref\tasks\T10-afon-profile-storage-5b82\decision.md`);
  - Sol's T10 review `ref\tasks\T10-afon-profile-storage-5b82\run-20261119-173646-review\review.md`;
  - T10's `work\out\encoding.md`, `work\scripts\codec.mjs` and its unit tests, and `work\out\ranges-t10c.json`
    (under `ref\tasks\T10-afon-profile-storage-5b82\run-20261119-163743\`);
  - the T3l initialization design and the T3m profile layout
    (`ref\analysis\button-af\readiness\t3m-afon-editor-state-leak\out\profile-layout.md`).
- **No emulator process. No OM-Emu import.** Node unit tests of pure JavaScript are allowed and are not
  experiment versions.
- **Requirement guard (unchanged).** Lossless bit-packing by legal ranges is allowed. Dropping a field, or
  excluding a value the firmware or an accepted initialization can produce, is not. If the record cannot fit in
  26 bytes, stop and report the exact shortfall in bits.
- Wrapper, hashes, frozen scripts (new names, never edit after running), complete manifest including every
  imported module and consumed input, external seal. No storage-location change: Q7 option (a) stands.

## 1. Work

1. **Value domain per field (static).** For each field, the codec's domain is the union of:
   - the descriptor table values T10 cited;
   - every value the image's registration defaults give (`0x600e4f4c`, `0x600e4f5c` and the other mirror keys);
   - every value an accepted initialization produces (T3l zero custom fields; T8c's reset values, which equal
     the fresh store);
   - partly initialized arrays (some indices initialized, some not).

   Cite each addition with a bounded listing or the accepted record. Where the full domain cannot be closed, use
   the full cell width.
2. **Pose-keyed layout.** The record stores fields per **pose** (landscape, EXIF 6, EXIF 8), not per cell
   index. The mapping from pose to `0x5962`/`0x99a1` index belongs to the reader (T8c), not to the codec. Write
   that rule into `encoding.md`.
3. **Recompute** the packed total with marker, version, pad and CRC. State spare bits.
4. **`codec_v2.mjs` and `codec_v2.test.mjs`.** Tests, in addition to T10's:
   - all-zero custom dimensions and steps; each single zero field; mixed initialized/zero arrays;
   - T8c's reset-value profile;
   - every field at the low and high end of its domain;
   - every value of each enumerated domain round-trips;
   - each out-of-domain value on encode is rejected (encode error, not silent clamp);
   - the T10 corruption cases (all 208 single-bit flips, bad version, illegal codes) still decode as "no
     profile".
5. **Records.** `result.md` (template), the new `encoding-v2.md`, the manifest and seal.

## 2. Out of scope

Persistence, store/load hooks, menus, reset, emulator runs (these move to the integrated acceptance after T8c),
the display, and hardware.
