# What the shooting screen draws

Emulator only. No storage decision and no hardware recommendation. Subject Detect is `0x1e71[0]`, and it read 0 on every recorded shot. Nothing here is a storage decision or a hardware recommendation.

The spec sentences are unchanged. “Show the AF-ON target while AF-ON is in control.” “Update the displayed AF target to reflect the active profile.”

## The four marks

Stock K1, S-AF, draws four grey corner marks, rgb 31, each 19×21 and 111 pixels. The union is (417, 265) 66×70, 444 pixels. Version 6 kept that frame on all 12 edges. The ten-byte stayed `[14,2,2,0,27,0,39,0,0,0]` and `0x88b2` stayed 526.

The same rectangles are what word 526 produces. Word 409 produces (417, 198) with column pitch 47 and row pitch 50. Word 406 produces (356, 198) with column pitch 46 and row pitch 50. Both were measured, and both match the formula below.

## Where the rectangle comes from

`0x61184dd6` is entered by `calls (A2)` at `0x610c8b66`. A2 is the object vtable plus `0x190`. A plain 500 ms idle enters it twice. The setter's dirty byte `0xa32bfb32` is not read on that idle.

Inside the function, two calls through `0x610cd5ac` must return nonzero. Then `0x61184e30` calls the writer `0x61184e51`. The writer reads the word at object+`0x364` (`0x62c54158` in these runs) and divides it by the immediate 39 at `0x61185152`. The remainder is the point's X and the quotient is the point's Y.

Mode 2 at object+`0x374` stores size constants 3 and 3 (`0x61185253`). The glyph table at `0x6146f990` supplies 19 and 21. With the scales sampled on the 412 frame (20, 22, offset 50, bias 6):

- left = (pointX − 1) × 20 + 56 + (floor(pointX / 3) − 5)
- top = (pointY − 1) × 22 + (floor(pointY / 3) − 3)
- column pitch = 46 + (pointX − 16) / 3
- row pitch = 50 − (floor(pointY / 3) − 3)

The four marks sit on that origin and on one pitch in each axis. This reproduces the centre frame, the 409 frame and the 412 frame.

The word equals the value returned by the call at `0x6041935b` for key `0x88b2`, except when that return modulo 39 is 22. Then the word is the return minus 6. Return 412 (22 mod 39) became word 406. Return 529 became the frame of word 523. Return 409 and the resting word 526 are unchanged. The store that writes the word was not captured.

## All against Small

Stock rest is Small: kind `0x84d1` = 3, zone `0x99a1` = 2, size `0x1dd1` = [3, 3], 444 grey pixels. Setting the half-press All cells (kind 2, zone 0, size [1, 1]) removes those grey pixels. The band's rgb-31 count falls to 0. The mode word was still 2 at the next entry of `0x61184dd6`, and the writer did not store a new origin. All changes the grey pixels by not drawing the marks. The size constants themselves are selected by the mode word, not by a direct read of `0x1dd1` in the writer head.

## The one change

While the owner byte at `0xa031ed04` is 2, the call at `0x6041935b` returns the current bank's mirror position for key `0x88b2` and the mirror zone for key `0x99a1` index 0. A mirror byte of `0xFF` or a mirror position of `0xFFFF` is left to the stock call. Owner 0 and owner 1 pass through. Each edge then idles 600 ms, which is long enough for the dispatch at `0x610c8b66` to run. No image byte was written.

On the seeded bank the mirror position is 529 and the zone byte is 2. AF-ON edges draw (356, 265), (402, 265), (356, 314) and (402, 314), each 19×21, rgb 31, 444 pixels. The ten-byte is `[17,2,3,0,1,0,1,0,0,0]`. The cell `0x88b2` stays 526. S1 edges and owner 0 keep the All frame: no grey marks, ten-byte `[14,2,2,0,1,0,1,0,0,0]`.

The unseeded control keeps the mirror at `0xFF`. The hook does not substitute. With half-press All, all 12 edges stay on the cleared frame and the All ten-byte. Stock K1 stays on the centre frame.

Version 4's script had pre-registered the uncorrected 529 rectangles and the centre box for the half-press edges. Those expectations do not match the frames above, so that run's final flag is not a pass. The rectangles in this note are the ones the screenshots contain.
