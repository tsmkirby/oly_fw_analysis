# T3e decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS. Sol's corrections are applied in this record.** Date: 2026-11-18.

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-091509` | The `0x3D6F` action record opens a chooser, but confirm commits UI 2154 | `run-20261118-094952-review`: **ACCEPT-WITH-CORRECTIONS** |

## Accepted findings (with Sol's corrections)

- **Page-27 action record layout (24 bytes).**

  | Offset | Field | Value in all three records |
  |---|---|---|
  | `+0` | match key | 1 |
  | `+4` | UI ID | per record |
  | `+6` | sub-key | 0 |
  | `+8` | handler | 0 |
  | `+0xc` | first dispatch word | 8 |
  | `+0x10` | second dispatch word | per record |
  | `+0x14` | callback | 0 |

  Stock records (bytes verified):

  | Address | UI ID | Second word |
  |---|---|---|
  | `0x6150c514` | 2154 | `0x1e3` |
  | `0x6150c52c` | 2155 | `0x1e4` |
  | `0x6150c4cc` (C-AF Area) | 2156 | `0x1e0` |

  No field directly supplies an option list, a text ID or a help pointer.
- **What happens to the pair.** On a match, `FUN_6119a177` stores it at `0x60379d44`/`0x60379d46`. The value
  8 is a dispatch value that passes the `0x23` discard check (`FUN_6124f82b` / `FUN_611a3655`); its full
  meaning is not established. `FUN_6127e750` passes D0/D1 to vtable slot +4, whose image word at
  `0x61513470` is `0x611a01e8`. The conversion from the second word to the committed UI ID is **not yet
  traced**.
- **The relocated table works.** A runtime redirect to a 3-record table at `0x6031ea00` (EMULATOR-ONLY) is
  live. On OK, the compare at `0x611a26e1` records D0 = D1 = 15727, with A2 `0x6031ea30`, the third record.
- **X1.** A third record copied from 2154's, with only the UI ID changed, opens **2154's two-option
  chooser**. Confirm calls the setter with (2154, 1), so this is a same-value stock write. The RAM profile
  stays 0. Cancel changes nothing. It is a **failed `0x3D6F` commit**.
- **X4.** Changing the second word to `0x0e3d` matches the record but opens no chooser, in this
  configuration only. The idea that the second word is reverse-looked-up to a setting is an **unproven
  hypothesis**.
- **Traces.** Traces were capped at 100,000 entries, with zero dropped. All endpoint cells were equal to
  the pre-OK snapshot. There was no control at the same step.
- **AF Home IDs 2274–2279** have **no backing cell through the UI-map route**: both getters return key 0
  and index 0. Other internal state is not excluded.

## Next

T3f: trace `0x611a01e8` from the second word to the committed UI ID. Then give `0x3D6F` its own editor
binding, and continue toward the gated X2/X3 and acceptance.
