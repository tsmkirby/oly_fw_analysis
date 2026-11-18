# T3i decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS (applied here). The functional acceptance is confirmed. Exact per-key assertion coverage is still open.** Date: 2026-11-18.

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-123315` | Help list, row label, page 28 and complete acceptance PASS. The C4 crash did not reproduce. | `run-20261118-131729-review`: **ACCEPT-WITH-CORRECTIONS**. Acceptance is overstated: assertions do not cover every key. |

## Accepted findings (confirmed by Sol)

- **Help list.**
  - Help records are 12 bytes: u32 value, u16 kind, u16 ID, u32 extra.
  - The help scan uses the face record's count, so a count of 10 overran the two-record help list at
    `0x61576520`. That is why the help text was stale.
  - No stock per-zone help exists. A ten-record list (120 bytes, overlay) uses stock ID `0x01a8`, "Choose the
    AF target area.", for every value. The text then updates correctly.
- **C4 crash.** The T3h access violation did not reproduce in four runs: H with a force helper, H inline,
  the T3h script copied byte for byte, and H plus the help list. Its cause is unknown. It is recorded as
  **not reproduced**, not as fixed.
- **Row.** Kind 4, label `0x0DD2`, primary list `0x6158ba1c` with count 10, alternate 0. The row shows
  "AF Target Mode" and the current zone's glyph (2 → Small, 9 → C4), and the chooser opens and commits.
- **Page 28.** Built by reference construction, it renders the same in the control and the candidate. It is
  not a native route.
- **Functional acceptance (two sessions plus a stock control).**
  - Exact commits of 2 and 9 (C4), and a cancel from C4 that leaves the value unchanged.
  - Full-cell snapshots match the control at every shared step and after every AF-ON key. They cover
    `0x90a1`, all of `0x1dd1`, `0x99a1`, `0x9a41`, `0x5962`, every `MODE_AF_HOME*` cell, and the
    `*_ORIGINALLY` 2274–2279 getter values.
  - Pages 25–28.
  - The M and E stores are byte-identical after a native save. The profile byte is back at 0 in a new
    session.
- **Overlay.** 368 bytes in total, all in uncompressed section 1. `0x60320000` (the scratch binding array)
  lies inside section 1's `0xFF` area. It is not a native owner, and the binding array's home is still
  unresolved.

## Still open

- **Exact UI-state and readback assertions after every key**, including chooser navigation, exits and the
  page-28 construction. Without them, the brief's complete acceptance is not met.
- The manifest's inventory of imported emulator dependencies.
- The command-09 screenshot references.

## Next

T3j, a narrow task: rewrite the acceptance as a table-driven script that asserts every key. The
configuration does not change.
