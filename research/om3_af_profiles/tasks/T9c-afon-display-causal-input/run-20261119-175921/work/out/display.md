# What the shooting screen draws

Emulator only. No storage decision and no hardware recommendation. Subject Detect is `0x1e71[0]`, and it read 0 on every recorded shot. Nothing here is a storage decision or a hardware recommendation.

The spec sentences are unchanged. “Show the AF-ON target while AF-ON is in control.” “Update the displayed AF target to reflect the active profile.”

## The four marks on stock

Stock K1, S-AF, draws four grey corner marks, rgb 31, each 19×21 and 111 pixels. The union is (417, 265) 66×70, 444 pixels. The correction-round K1 kept that frame on all 12 edges. The ten-byte stayed `[14, 2, 2, 0, 27, 0, 39, 0, 0, 0]`, `0x88b2` stayed 526, and the owner stayed 255.

## Where a rectangle comes from

`0x61184dd6` is entered by `calls (A2)` at `0x610c8b66`. A2 is the object vtable plus `0x190`. The return on the stack is `0x610c8b68`. The next stacked return in the version-1 trace is `0x610cdc4f`. That names the caller of the dispatcher function. It does not name the producer that schedules the dispatch. The producer stays unresolved.

Inside the function, two calls through `0x610cd5ac` must return nonzero. Then `0x61184e30` calls the writer `0x61184e51`. The writer reads the word at object+`0x364`. Three of those words were read on the machine: 526 at rest, 409 when the getter return was 409, and 406 when the return was 412. The divider immediate is 39 at `0x61185152`. Mode 2 stores size constants 3 and 3. The glyph bytes are 19 and 21 at `0x6146f990`.

A fitted description of those three sampled frames is recorded in the first submission. It is not a located conversion, and it was not used to choose the frames in the correction round. Word 523 was inferred from a screenshot. It was not read.

## All against Small, from the earlier trial

Stock rest is Small: kind `0x84d1` = 3, zone `0x99a1` = 2, and 444 grey pixels. Setting the half-press All cells removes those grey pixels. Kind, zone and size were written together, so that trial does not isolate them.

## The one change

While the owner byte at `0xa031ed04` is 2, the call at `0x6041935b` returns the current bank's mirror position for key `0x88b2`, the mirror zone for key `0x99a1` index 0, a non-zero mirror size for key `0x1dd1`, and the converter kind for key `0x84d1` when the zone is 0, 1, 2 or 6. A mirror byte of `0xFF` or a position of `0xFFFF` is left to the stock call. Owner 0 and owner 1 pass through. No image byte was written.

The correction round did not raise a named scheduler. Each edge was held until the K1e bound, 666.73128 ms, which is the measured stock interval plus one 600 ms idle.

On seeded profile A the owner-2 frame is the K1e frame: (356, 265), (402, 265), (356, 314), (402, 314), each 19×21, 444 rgb-31 pixels. The ten-byte is the Small record. The cell stays 526. Owner 0 and owner 1 match the full K2 frame, which is empty, and their ten-byte is the All record. The size mirror bytes are 0, so the size branch does not substitute. The kind key is not presented at the call.

On seeded profile B the K1e frame is empty, and the owner-2 frame matches it. The ten-byte is `[28, 2, 7, 0, 5, 0, 7, 0, 0, 0]`. The size branch substitutes 18 times. The kind branch substitutes 0 times, and that session ends `ok:false`.

Full K2, unseeded, substitutes nothing and keeps the All ten-byte and the empty frame. The first submission's version 5 is a Z5 control with a reduced hook, not this K2.
