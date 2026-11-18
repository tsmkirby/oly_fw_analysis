# T3f decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS (Sol's corrections applied here).** Date: 2026-11-18.

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261118-095558` | Editor binding found; `0x3D6F` commits its own value (priority chooser); the zone chooser is not yet shown | `run-20261118-104215-review`: **ACCEPT-WITH-CORRECTIONS** |

## Accepted findings (with Sol's corrections)

**The editor binding.**
- `0x611a01e8` is a 6-byte leaf function that returns the halfword at A0+`0x54`. It does not convert the
  second dispatch word.
- The second word is looked up by `FUN_6124f4e5`, which compares it with each 24-byte record's first word
  (at `0x6124f523`). The directory entry for key 8 is at `0x615cc934`. It points to the record array at
  `0x615c540c`, which holds 416 records and ends at `0x615c7b0c`. The directory and the array are both in
  compressed section 7.
- Record layout: editor ID, `0x3b`, UI ID, `0x42`, a sequential word, 0.
- Editor IDs `0x1e0`–`0x1e4` map to UI IDs 2156, 2157, 2205, 2154 and 2155. Editor ID `0x1e6` is unused.

**B1: binding only.** The binding array (417 records, 10,008 bytes) was relocated to RAM at `0x60320000`,
outside the loaded image, by an EMULATOR-ONLY runtime copy. A new record maps `0x1e6` to `0x3D6F`, and the
row's action record uses `0x1e6`. The lookup returns UI `0x3D6F`. OK opens a blank box. Confirm stores
low byte 12, with D1 = `0x60E1D50C`, which is not an option value.

**B4: binding plus descriptor (milestone).** B4 adds two changes at once: an editor descriptor cloned from
2154's (template `0x606190b7`, count 2) and its hash registration. Together:
- OK opens the native two-option chooser.
- Right moves to the other value. Confirm calls the setter with `(15727, 1)`, and the RAM profile byte goes
  from 0 to 1.
- Cancel leaves the byte at 0.
- `0x90a1` stays `[1,1]`, and all listed cells are unchanged.

This is the **first own-value commit** from the AF-ON row. It is EMULATOR-ONLY and uses priority values,
not zones. Which of the two B4 changes was needed is not isolated.

**B2: zone list on the row.** Pointing the row's options at `0x6158ba1c` changes only the glyph drawn on the
row, the All grid. The chooser stays the priority chooser. B2 also changed the navigation fallback.

**B3: one text record.** A single text record (`0x0034`, "All") is drawn on the row. This tests rendering
only. The full text-zone experiment was not done.

**Zone-name strings.** These come from the emulator's English GUI resource `.0101`, not input `.0106`:
`0x0034` "All", `0x0070` "Single", `0x122c` "C1" and `0x122d` "C2". There is no exact "Cross", "Mid" or
"Large".

**Traces.** Capped at 100,000, with 0 dropped.

## Record defects (Sol)

- Command 18's probe script was edited after it failed, so the original version is not reproducible.
- Command 38's command text is missing from the manifest metadata.
- The prerequisite overlay is not labelled `role: behaviour`.

## Packaging note for a final firmware

Adding a binding record means a contiguous array of 417 × 24 bytes (about 10 KB). The current copy sits
outside the loaded image. A real placement, or another installer strategy, is open. It belongs to the
later packaging task, not to the UI proof.

## Next

T3g: link the zone editor's unchanged 10-count descriptor, template `0x606178b1` (T3a's clone of UI 238),
with binding `0x1e6`. If the ten zones appear and commit, run the acceptance.
