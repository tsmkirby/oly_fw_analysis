# T5 decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS, claims narrowed.** Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261118-140130` | `run-20261118-145847-review` | REJECT: three section-7 bytes; acceptance not fully asserted, runner ended `ok:false`; header derived from help text; P4 did not separate the providers; manifest gaps |
| `run-20261118-151607`, `run-20261118-152508` | none | Infrastructure failures (DNS outage, then lost Cursor connection); Grok wrote nothing. Not counted as rounds |
| `run-20261119-044533` (correction) | `run-20261119-052528-review` | REJECT: corrections 1, 3, 4, 5 DONE; correction 2 NOT DONE (control navigation not matched; final reopen release unasserted) |

## Why accept rather than escalate

This was the single correction round, so no further round is allowed. Sol confirmed every functional
claim, and the remaining gap concerns the control, not the candidate:

- **The control navigation is structurally limited.** A no-overlay control has no third row and no AF-ON
  chooser, so it cannot perform the candidate's `a-zone-row`…`a-commit` and `b-*` chooser steps. Sol asked
  the coordinator to resolve this explicitly rather than claim equivalence.
  - **Resolution:** T5 does **not** claim navigation equivalence.
  - It claims that the saved M and E banks are byte-identical to a no-overlay control that entered page 27,
    exercised the stock 2155 chooser and cancelled, and ran the same edges, save and reopen. Sol decoded and
    compared these independently: zero differences across 262,144 M and 196,608 E bytes for both
    candidates.
  - Chooser-only activity is outside the control by construction.
- **The final reopen AF-ON release** (`accept_runner_c3.mjs:287`) was not asserted. Release restoration
  is asserted on every other edge (75 recorded edges, including both release orders), so this one edge is
  carried as an open item into T6's acceptance (the button target takes size and position from the profile), which reuses this runner.

## Established (confirmed by Sol), EMULATOR-ONLY, Subject Detect Off

- Combined configuration: the T3j zone row (368 bytes) plus the central-edge overlay, relocated by
  `0x3e0` because of 182 conflicting bytes. 3,262 overlay rows: section 1 1,308; section 2 95; section 4
  1,856; section 7 3.
  - The three section-7 bytes `0x610bf5e3`–`0x610bf5e5` are the call site of the inherited central-edge
    hook, permitted by coordinator amendment (brief §5.1).
- One 15-byte swap at `0x60a8f708`. The AF-ON target's zone type comes from the RAM profile byte
  `0xa031e920`, not legacy AF Home `0x9fa1`.
  - **From the profile:** kind, vertical, horizontal, priority, and position when the kind is 2.
  - **Still from the legacy provider (interim until T3b):** size `0xdfa1`, position `0x99d2`, +9 `0x1e01`.
  - Custom zones C1–C4 still take dimensions from `0x1dd1`.
- **Behaviour:**
  - AF-ON applies the menu-row zone: Single gives `0e 02 00 00 01 00 01 00 00 00`, and Small gives
    `0e 02 03 00 01 00 01 00 00 00`, with owner 2.
  - Both release orders restore the half-press record. This holds in S-AF and in C-AF (289 and 25 both 1).
- **P4:** profile Single against legacy `0x9fa1` Small. AF-ON follows the profile on all 12 edges, and the
  no-overlay control stays on stock. This shows the legacy provider no longer drives AF-ON.
- **Persistence:** RAM-only. After a save and reopen, the profile reads 0, and AF-ON applies the All
  record `0e 02 02 00 01 00 01 00 00 00`.
- **Chooser header** is identified by a pixel hash, independently of the help text.

## Open

- Final reopen release assertion → T6 acceptance.
- Size and position from the profile (T3b).
- Native placement of the section-7 call site (T4 follow-up).
- Storage (Q7).
- Display.
- Subject Detect On (CPU3).

## Evidence

Promoted to `analysis/button-af/readiness/t5-afon-button-handoff/` (README). NVRAM dumps and
screenshots stay local, listed by hash.
