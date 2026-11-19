# Display addendum (T9c)

Emulator only. No storage decision and no hardware recommendation.

The T9b display note placed 436 and 286 at `0x62bd71ec` and `0x62bd71ee`. Those values are the next two halfwords, `0x62bd71f0` and `0x62bd71f2`, in the same four-halfword copy.

On the seeded T6 configuration with the display change, AF-ON draws four grey marks, rgb 31, each 19×21:

| mark | rectangle |
| --- | --- |
| top left | (356, 265) 19×21 |
| top right | (402, 265) 19×21 |
| bottom left | (356, 314) 19×21 |
| bottom right | (402, 314) 19×21 |

That is the frame for mirror position 529 after the measured correction of 6, word 523, point (16, 13). The half-press All frame on the same run has no grey corner marks. `0x88b2` stays 526. The spec sentences are unchanged: “Show the AF-ON target while AF-ON is in control.” and “Update the displayed AF target to reflect the active profile.”
