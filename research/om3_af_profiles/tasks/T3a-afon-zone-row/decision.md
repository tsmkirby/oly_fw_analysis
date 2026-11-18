# T3a decision (Opus)

**Verdict: CLOSED as BLOCKED; continued by a different approach (T3c).** Date: 2026-11-18.

## Runs

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-042524` | Third row drawn; OK does not open the chooser | `run-20261118-053253-review`: **REJECT** (acceptance incomplete, Subject Detection mis-navigation, overwritten evidence) |
| `run-20261118-053855` (correction) | Page 28 not reachable; four type-2 experiments failed; BLOCKED | `run-20261118-062612-review`: **REJECT** (BLOCKED honestly reported; page-28 reference missing; "smallest native change" not established; records) |

## Established (confirmed by Sol)

- **Row data.** The third row's data in the uncompressed section-1 tail is confirmed: 140 overlay bytes, all
  stock `0xFF`, none in sections 6 or 7. The data is:
  - the row array at `0x6031e930`, whose first 72 bytes equal the stock rows;
  - the third row at `0x6031e978`: kind 4, label `0x0DD2` "AF Target Mode", class `0x6158aeb4`, and both
    option pointers at `0x6158ba1c` with a count of 10;
  - the provider ID list at `0x6031e928`;
  - the profile byte at `0x6031e920`.
- **Option list.** `0x6158ba1c` decodes to the values 0, 2, 1, 5, 3, 10, 6, 7, 8, 9 (all kind 12), which
  are page 28's records.
- **UI ID.** `0x3D6F` is absent from the four UI-ID maps and from the u32, mov and cmp immediate scans. This
  is a static absence only.
- **Section-7 redirects at runtime.** Changing the page-27 row pointer and count and the source record
  pointer and count draws three rows, and two native Down presses reach the new row.
- **Hooks.** The EMULATOR-ONLY value hooks read and write the RAM byte when called directly. This is a unit
  check, not a UI commit.
- **The OK path.** OK on the row does not open a chooser. Page 27's list model is type 1, kind 11, so
  `0x61203e81` returns early. Forcing type 2 with kinds 0, 1, 3, 4 or 5 never reaches the setter.
- **Stock editors.** The stock editors that take OK (the priority rows and the C-AF Area chooser) use the
  `0x610e*` family, and `0x3D6F` never enters it.
- **Page 28.** Page 28 (group `0x116`) was never built from any menu screen that native keys reached on
  the OM-3.
- **Menu entry.** Opening the menu changes `0x1dd1` from `[3,3,…]` to `[27,39,3,…]` on stock firmware as
  well.

## Not accepted

- The claim that this is the "smallest native change". It is only a candidate.
- The claim that the viewer "cannot host the editor from row data", because it was not established
  without the reference and the routing analysis.

## Next

**T3c**, a different approach: measure how the stock editors are selected (the `0x610e*` dispatch), and
what pages 28 and 29 open (by direct construction, labelled EMULATOR-ONLY, if the menu never builds them).
Then prototype the better route.
