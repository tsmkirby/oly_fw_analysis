# T3g decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS, applied here. The acceptance is PARTIAL.** Date: 2026-11-18.

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-104935` | Descriptors decoded; the ten-slot chooser commits zone values; full acceptance passed; faces wrong | `run-20261118-112628-review`: **ACCEPT-WITH-CORRECTIONS** (acceptance overstated) |

## Accepted findings

- **Editor descriptor (20 bytes).**
  - The table is at `0x6061912c`: 1712 records, hashed into 128 buckets by `FUN_60405865` and looked up
    by `FUN_604058bc`.
  - Fields: ID, flags `0x0080`, **value-table pointer**, a second pointer (0), byte count, stride and type.
  - With stride 1, the byte count is the number of slots. The committed value is
    `table[cursor index]`.
  - 2154 (`0x6062132c`) uses the values `00 01`. UI 238 `MODE_AF_HOME_AREA_TYPE` (`0x606200e4`, key
    `0x9fa1`) uses `00 01 02 03 05 0a 06 07 08 09`.
  - The descriptor holds no images or text.
- **Z1 (UI-238 descriptor clone for `0x3D6F`; pointer and count changed together).**
  - OK opens a ten-slot chooser.
  - Confirm calls the setter with `(0x3D6F, 3)`, and the RAM byte becomes 3.
  - Cancel leaves 0.
  - `0x90a1` and the listed cells are unchanged.
  - **The faces are wrong.** Values 0 and 1 show the two priority strings, and the other eight slots are
    blank. The ten zone images do not appear.
- **Z2 (count only)** and **Z3 (pointer only)** behave as the decoding predicts.
- **The source of the faces is unidentified.** The row's kind-12 list changes only the row glyph. The
  chooser's face source has not been traced. A text list is only a hypothesis.
- **Acceptance (PARTIAL).** Two sessions plus a stock control (Z1 configuration):
  - Each session cancels once, then commits 2 and then 5. Cancel leaves 0. `0x90a1` stays `[1,1]`.
  - Twelve full-cell comparisons against the control show no differences, excluding the profile byte.
  - Pages 25, 26 and 27 render.
  - After a native save, the M and E stores are byte-identical to the control's. A new session reads the
    profile as 0.
  - **Not complete:**
    - The AF Home `*_ORIGINALLY` IDs 2274–2279 were checked for key and index mappings only. Their getter
      values were not read.
    - Not every step has an assertion.
    - The faces do not show the zone options, so brief §4's "shows the 10 zone options" is not met.

## Wording corrections (Sol)

- §6.5's matching-set statement and the cached-byte statement in `design.md` are corrected.
- The kind sets of `FUN_611c782f` are narrower than those of `FUN_611c7785`.
- The harness override of `0x120b` is EMULATOR-ONLY behaviour.

## Next

T3h:
1. Trace the chooser's face-list source.
2. Make the ten zone faces render, with one change at a time.
3. Re-run the acceptance with an assertion at every step and with the `*_ORIGINALLY` getter values read.
