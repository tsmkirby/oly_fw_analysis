# Display addendum, correction round

`work/out/display.md` is unchanged. The sentences below in that file are superseded by this note. The accepted hook, the K1e references, the K2 and K1 results, and the refresh bound 599.60794 ms stay as written there.

## Superseded: glyph-size sentence

`display.md` says: “Cross and Single both had `0x1dd1` returning 1 and 1, and their marks are 19×21 and 8×9. The glyph size for modes 2 and 3 follows the immediates. Custom mode 7, with `0x1dd1` returning 9 and 11, draws a different frame from C1’s 5 and 7. That is the size input for modes 7–10.”

Replacement. Mode 2 executes the immediates 3 and 3 and draws four 19×21 marks. Mode 3 executes the immediates 1 and 1 and draws four 8×9 marks. Cross is mode 4. It takes the branch at `0x61185251` and draws eight 19×21 marks. Single and Cross both have `0x1dd1` returning 1 and 1. Mode 7 with returns 5 and 7, and mode 7 with returns 9 and 11, both draw four 19×21 marks, at different positions. Modes 8, 9 and 10, with indices 0 and 1 of `0x1dd1` left at 0, draw one 34×38 mark. `0x1dd1` at `0x6041a1fb` is the size input the writer asks for on modes 7–10.

## Superseded: Large and Custom rows

`display.md` lists Large as two 19×21 marks, 222 pixels, and Custom as clipped, 300 pixels. It says the custom marks meet the detector window at x=280.

Replacement, counted over the whole frame. Large is four 19×21 marks at (233, 176), (525, 176), (233, 403) and (525, 403), 444 pixels. Custom is four 19×21 marks at (274, 198), (484, 198), (274, 381) and (484, 381), 444 pixels. The earlier counts came from the window x in [280, 780). The left marks start at x=233 and x=274, so that window cut them. The pixels are on the frame. C2, C3 and C4 stay one 34×38 mark at (361, 270), 272 pixels. That shape is the whole frame, and those three pngs match.

## Mode word

The word at object+`0x374` is written by the memcpy at `0x610cd71c`, length `0x38`, from the slot record at `0x62b926f8`. The value in that record is copied from `0x6247da80` by the memcpy at `0x610cd7b1`. The word at `0x6247daa8` is written by `mov D0,(A0)` at `0x611c7746` from the table at `0x615ba414`. The pairs are zone to mode: 0→1, 1→3, 2→2, 3→4, 5→5, 10→6, 6→7, 7→8, 8→9, 9→10. Cross is mode 4.

In the refresh window, no getter return tracks that mode. `0x5681` returns 2 on every zone, `0x3081` returns 1 on every zone, and `0x99a1` is absent. The key the table compares is stored at `(0x14,sp)` by `0x61238ebf`.

## Refreshes

The first sweep kept one writer window per trial. The other windows from that process were not exported and cannot be reconstructed. The correction sweep recorded 37 refreshes. Each has an identifier, entry and end times, every getter call, and the signature of a later frame. The library digest before that process is `2013f1d2841b7b241567f25ccaa059bc714e1622554e15c12f17752142f3d81b`.
