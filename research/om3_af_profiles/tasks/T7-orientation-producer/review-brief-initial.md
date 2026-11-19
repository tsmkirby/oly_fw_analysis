# T7 review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\orientation-producer.md`
and `work\out\pose-injection.md`, then the pose module, scripts, JSONL, screenshots, listings, `work\out\cmd\`
and `audit\`.

1. **Producer.** Check the claimed path from the sensor or peripheral read to the pose variable and to bank
   selection. Check the listings against `inputs\00_0100_50000020.decoded.bin`
   (offset = address − `0x60021020`).
2. **Injection.** Check that it is the narrowest point claimed, that the native producer code still runs (entry
   trace), that it is labelled `EMULATOR-ONLY`, and that it is the only behaviour change.
3. **Banks.** For each pose, with Orientation Linked on and off, check the full-cell readbacks, which index is
   written, and which the ten-byte target reads. Check that Orientation Linked was set through the stock menu
   with native keys.
4. **Harness.** Check that the module is importable unchanged and that its interface is documented.
5. **Records.** Check manifest completeness, the command records and script hashes, that no script was edited
   after running, and that nothing is presented as native, a storage decision, or hardware evidence.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
