# T4b review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json`, `work\out\boot-order.md` and
`work\out\flash-callees.md`, then the watch logs, listings, scripts, `work\out\cmd\` and `audit\`.

1. **Stock only.** Check that the session used the stock image (hash), no overlay or behaviour change, and
   NVRAM off, with the environment value recorded.
2. **Arming point.** Check when the probes were armed relative to reset, and whether that supports the
   ordering claims.
3. **Coverage.** Check which pages and editors were actually opened (page titles and highlighted rows), and
   whether page 28 was reached natively or by construction.
4. **Order.** Check each ordering claim against the hit logs (PC, step, caller).
5. **Duplicate record.** Check the reader list, the walker scans past index 151, and the static
   computed-index search. Grade the reuse hypothesis as the evidence supports: "no reader on the exercised
   paths" is not "unused".
6. **Flash callees.** Check the listings against `inputs\00_0100_50000020.decoded.bin`
   (offset = address − `0x60021020`), the stated depth, and whether the checksum and decompression answer is
   bounded to what was listed.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
