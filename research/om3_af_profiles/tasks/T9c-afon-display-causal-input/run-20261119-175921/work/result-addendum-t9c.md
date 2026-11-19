# T9c addendum to the T9b record

This file applies the three coordinator corrections in `ref\tasks\T9b-afon-display-coordinate-path\decision.md`. It does not edit the T9b run. Evidence already recorded there stays in place.

## 1. Addresses of 436 and 286

T9b addendum finding 3 named `0x62bd71ec` and `0x62bd71ee` as the slots that received 436 and 286. Those two values occupy the next two halfwords, `0x62bd71f0` and `0x62bd71f2`. They are the third and fourth halfwords of the four-halfword copy, not the first pair. The earlier pair in that copy remains the pair the T9b log already showed.

## 2. What the AF-ON window showed about the flag writer

The press-plus-400 ms window, seeded and unseeded, is observed activity. In that window the origin routine had 0 entries and the flag writer `0x610f7172` ran 3 times. A stock idle also executes the flag writer. Those counts do not prove that AF-ON schedules the flag writer, and they do not prove that AF-ON cannot schedule the origin routine.

## 3. What T9c resolved, and what stays open

T9b left four items open. This task measured three of them and left one store unnamed.

- The indirect entry of `0x61184dd6` is the `calls (A2)` at `0x610c8b66`. A2 is the object's vtable plus `0x190`. The return address on the stack is `0x610c8b68`. Version 1 recorded that entry twice in a 500 ms idle, before any cell write and again after it.
- The refresh that follows the setter is that same idle dispatch. The dirty byte `0xa32bfb32` stayed 1 and was not read. The two calls through `0x610cd5ac` are gates inside `0x61184dd6`. Both returned 1 when the writer ran. They are not the scheduler. Idling without writing the cell reproduced the entry.
- Width and height of the corner glyphs are the bytes 19 and 21 in the table at `0x6146f990`. The size constants that enter the pixel formula are selected from the mode word at object+`0x374`. Mode 2 stores 3 and 3 at `0x61185253`. The stack scales sampled with the 412 frame were 20 and 22, with offsets 50 and 0 and biases 6 and 0. The instructions that write those scale slots were not named.
- The getter return at `0x6041935b` is a causal input of the frame. Forcing it to 412 with `0x88b2` left at 526 moved the marks to the 412 frame. The word at object+`0x364` was 406 for that return, 409 for a return of 409, and 526 at rest. Version 4's AF-ON frame matches word 523, which is 529 minus 6. The rule that fits these four values is: when `return % 39` is 22, the word is the return minus 6; otherwise the word is the return. The instruction that stores the word was not captured. A watch on object+`0x364` saw no store in the same window in which the word changed.

The geometry relation and the idle dispatch are measured. The store that writes object+`0x364`, and the writers of the scale slots, remain open. This addendum does not close them.
