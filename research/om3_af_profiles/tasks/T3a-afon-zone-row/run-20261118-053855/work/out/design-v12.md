# T3a design addendum (correction round)

The 140-byte overlay in `work/out/overlay-changed-bytes.csv` is unchanged. `work/out/design.md` still describes that layout, the label `0x0DD2`, UI id `0x3D6F`, the four section-7 redirects, and the EMULATOR-ONLY value hooks. This file corrects the open-path claims in that document. It does not replace the byte listing.

## Corrections to the earlier design

- Type 2 is not a measured path for page 28. Page 28 was not opened. Every multi-row page that native keys did open returns 1 from `0x61203470`.
- Sentinel `0xA70F`, returned by the EMULATOR-ONLY mapped getter for `0x3D6F`, was not proved unregistered. The hook still returns it. That is not evidence about the registry.
- The kind-7 audio-slider claim is withdrawn. `afon-chooser-v10.png` was overwritten by a later v10 run. The surviving `afon_zone_probe_v10.mjs` forces kind 1 (`d0: 1`). Kind 7 was not reproduced under a new name.

## What the stock menu actually opens

Page id 28 and source group `0x116` (`0x61529cf4`) were not constructed. The page-id observer did log pages 25, 26, 27, 30, 31, and 61, so a miss of page 28 is a real miss.

| Screen reached | What it is | List type |
|---|---|---|
| AF Target Mode Settings | Checkbox list (All, Single, Cross, Mid, Large, C1, C2). Group 364. Not a single-value commit. `stock-page28-v12.png`. | 1, at `0x6120362d`. Object at model+`0x58` is `0x6247a270`, kind 11, vtable `0x6151346c`. `0x61203e81` was not entered. |
| Orientation Linked, Set Home | Two checkboxes, "AF Target Mode" and "AF Target Point". Groups 341 and 342. | 1. `0x6120345d` was not called. |
| Select Screen Settings, Loop Settings | Pages 30 and 31. | 1, including the call inside `0x61203e81` at `0x61203e9a`. |
| C-AF Area | Two-option chooser (All versus a cluster icon). `stock-chooser-v12g.png`. | No `0x61203470` call on OK. Trace is the `0x610e*` family, including the 14 addresses v11 saw only on the priority editor. |

The shared list object is type 1, kind 11. `0x61203e81` reads the alternate option pointer at row+`0x1c` only when `0x61203470` returns 2. On type 1, with viewer+`0x13e4` equal to 0, it returns without opening anything. Cloning `0x6247a270` would not change that type. Page 28's runtime model was never built, so it cannot be cloned from a live dump.

## Item 2, four experiments, then stopped

The row already has page 28's kind (4), class (`0x6158aeb4`), and both option pointers at `0x6158ba1c` with count 10. Further row bytes were not added. Each experiment below is an EMULATOR-ONLY force of the type-2 branch, and only around OK, on top of the confirmed value hooks and section-7 redirects.

| Version | What was forced on `0x3D6F` | Result |
|---|---|---|
| v13 | Kind 0, then 3, then 5 without re-selecting the row | Kind 0 matched 15727 and created a widget (`0x61204050`). The screen is a value bubble showing the current record, the grid marked All (`afon-kind0-v13.png`). Kinds 3 and 5 then matched stock id 2154, because the cursor had left the row. Profile stayed 0. No setter call. |
| v14 | Kind 0, then Down, then OK | Down left the bubble and moved the page cursor onto the first priority row (`afon-down-v14.png`). The next OK opened the stock priority editor (`afon-confirm-v14.png`). Setter was not called. Profile stayed 0. |
| v15 | Kind 0, force held across Down and OK | The bubble stayed on screen and the page cursor still moved (`afon-down-v15.png`). OK again opened the priority editor. Setter was not called. |
| v16 | Kinds 3 and 5, row re-selected before each | Both matched 15727 and fired the widget event. The screenshots show the AF Button page with no new control (`afon-kind3-v16.png`, `afon-kind5-v16.png`). Setter was not called. |

Earlier experiments, not repeated: kind 4 drew an exposure slider (`afon-chooser-v9.png`); kind 1 drew no new widget (`discover-kind1.jsonl`). Kind 7 is not cited.

Selecting and confirming never reached `0x6041937f` for `0x3D6F`. Item 2 is BLOCKED. Brief §4 was not run.

## Smallest native change that would host the editor

Page 27's viewer cannot host the 10-record editor from row data alone. The open path needs code.

The narrow change is a branch for setting `0x3D6F` that presents the 10 records at `0x6158ba1c`, calls `0x6041937f` with that id on confirm, and does not call it on cancel. Returning 2 from `0x61203470` and an accepted kind from `0x6120345d` is not that branch: kind 0 creates a widget that does not take Down or OK, and kinds 3 and 5 create a widget that draws nothing. The stock editors that do take OK are the `0x610e*` family, and `0x3D6F` does not enter it (`discover-v11.jsonl`, `onlyZone` empty).

The value store stays the byte at `0xa031e920`, written by the setter hook (or by the same branch in native code at `0x6041931e` / `0x6041937f`). The four section-7 redirects stay runtime writes. No new overlay bytes.
