# T3d decision (Opus)

**Verdict: CLOSED. Core finding accepted with Sol's qualifications; the hypothesis was refuted. Continued by T3e.**
Date: 2026-11-18.

## Run

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-081316` | The page-27 action table decides; a registered key alone does not open the chooser | `run-20261118-090732-review`: **REJECT** on evidence completeness. The static decision is confirmed. See `audit-note.md` there for the coordinator-caused audit flag. |

## Accepted (confirmed by Sol)

- **Where the decision is made.** The `0x900C` handler calls `FUN_611a2631` at `0x611a12a5`. At
  `0x611a26de` it loads the halfword at record+4, and at `0x611a26e1` (`cmp D1,D0`) it compares that
  halfword with the selected row's provider UI ID. A matching record gives 4, which opens the chooser.
  No match gives 1, which does nothing.
- **The action table.** The page-27 table holds 24-byte records. Its sole literal pointer, at `0x6150f5f0`,
  is followed by count 2. Both are in **compressed section 7**.
  - Matching records with a null handler pass two halfwords to `FUN_6119a177`: 8/`0x1e3` (2154),
    8/`0x1e4` (2155), and 8/`0x1e0` (C-AF, 2156).
- **The UI map.** The UI map and `FUN_60419446` are in uncompressed section 2. `0x3D6F` is past the last
  mapped range (15455).
- **K1.** Substituting key `0x5b82` and index 0 through the two getters does not open the chooser in the
  tested configuration. The registered-key hypothesis is refuted for this gate.
- **K4.** Forcing a match against 2154's record opens the stock two-option chooser. Cancel makes no recorded
  change. Confirm calls the setter with (2154, 1) and stores to `0x90a1` index 0, the same value. It also
  makes a store call for `0x8b54`, index 2154.
- **Search counts.** The corrected search finds 604 CALL byte-pattern candidates. They are not validated
  instruction boundaries.

## Qualifications (Sol), carried into T3e as requirements

- K1's statement that no setter or store ran covers only the first 80 trace entries (the buffer saturated).
- There is no direct D0/D1/A2 measurement at `0x611a26e1`. The finding is a static reconstruction plus
  observed outcomes.
- The AF Home `*_ORIGINALLY` IDs 2274–2279 were not resolved to backing cells or read back.
- The overlay lines were not labelled `role: behaviour`. The summarizer version was overwritten. Cancel
  and confirm events were not emitted as separate groups.

## Consequence for the design

The AF-ON row needs **its own record in the page-27 action table**. The storage choice (Q7) is not a
prerequisite for the UI prototype.

Because the table pointer and count are in compressed section 7, a final firmware needs either:
- a section-7 change, or
- a runtime installer that redirects them, as T3a's design already needs for its four section-7 fields.
