# T9 decision (Opus)

**Verdict: CLOSED as PARTIAL.** Continued as T9b, which traces the coordinate path. Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-122049` | `run-20261119-131450-review` | REJECT: display mismatch confirmed; routine misattributed; the change aborted on model E143 |
| `run-20261119-132229` (correction, 5 versions) | `run-20261119-141920-review` | REJECT: items 1, 3 and 5 done; path not reached (honestly reported, no guess); transitive inventory and final seal incomplete |

## Accepted (confirmed by Sol, EMULATOR-ONLY)

- **The stock frame.**
  - The TFT shooting screen draws four grey corner marks, at rest union (417, 265), 66×70.
  - They move with the half-press position set on the direct screen, and S1 does not move them.
- **The display requirement is not met by T6.** With the seeded T6 configuration and with the unseeded T6
  control:
  - the AF-ON press changes the ten-byte target and the owner (2);
  - the frame stays on the half-press position.
- **The driving cell is `0x88b2`.** One test-setup write of `0x88b2[0]=412`, with `0x5962` left at 526, moves the
  marks. During that write:
  - neither the getter nor `0x609eece3` is entered;
  - the OSD engine paints the marks (zero CPU writes to the corner bytes).
- **Paint call.** `GPI_DRAW_RECT`, return `0x610f66df`; the widget is `0x610f6649`, called from `0x610eee11`
  (`calls (A2)`). The coordinates arrive as `d0`=356 and `d1`=198 for the moved frame.
- **Redraw.** Leaving the direct screen issues the frame bars. An AF-ON press issues none.
- **Corrected attribution.** `0x609eec84` ends at `0x609eece0`. The `0x88b2` read belongs to `0x609eece3`,
  which is **not** entered on any of the observed paths.
- **Model.** `OM_EMU_MODEL=E147` must be set before any import of `model.mjs`.

## Not established (carried to T9b)

- The store that fills the coordinates `0x610eee11` consumes, reloaded at `0x610eedee`, and how the `0x88b2`
  setter `0x60063431` reaches it, directly or through a callback or cached object.
- The invalidation path that triggers the redraw.
- The display change, with full-frame assertions after every edge.
- A complete transitive module inventory: for example, `kernel.mjs`, `rtos.mjs`, `fw/board.mjs`,
  `fw/facts.mjs`, `fw/sections.mjs` and the device modules.

## Status

`CLOSED-PARTIAL`. The evidence stays in `tasks\T9-afon-target-display\run-20261119-132229\`.
