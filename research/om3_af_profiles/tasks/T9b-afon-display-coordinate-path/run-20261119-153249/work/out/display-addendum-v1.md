# Display addendum v1

This file corrects `work/out/display.md`. That file is unchanged. Emulator only. No storage decision and no hardware recommendation. Subject Detect stays off: `0x1e71[0]` read back 0. The spec sentences are unchanged. “Show the AF-ON target while AF-ON is in control.” “Update the displayed AF target to reflect the active profile.”

## Corrections

The unseeded row in the published table printed a decimal JSON array as hexadecimal and called the position 532. The bytes are `0e 02 02 00 01 00 01 00 00 00`. The first little-endian halfword is 526.

The published sentence “The thunk was entered 1998 times in the 500 ms idle” attributes the getter-entry count to thunk `0x6041a1f9`. That is unsupported. Version 6’s 90 hits at `0x60063a5e` are every execution of that instruction. Two of them have `A0 = 0x629526c0`. In experiment 1 the thunk was entered 1,704 times in the pre-setter window, and two of those entries had key `0x88b2` and index 0.

## What is drawn

Stock K1, S-AF, model E147. Four grey corner marks. The rest union is (417, 265) 66×70. After key `0x88b2` index 0 is written to 412 and the machine idles 500 ms, the union is (356, 198) 65×71. Experiment 1’s moved frame is four marks: (356, 198) 19×21, (402, 198) 19×21, (356, 248) 19×21, (402, 248) 19×21.

| state | cell `0x88b2` | union | where |
| --- | --- | --- | --- |
| rest | 526 | (417, 265) 66×70 | experiments 1–6, same union as the published rest row |
| after the write and 500 ms idle | 412 | (356, 198) 65×71 | experiments 1–6 |
| seeded T6, AF-ON down | 526 | (417, 265) 66×70 | experiment 5 |
| unseeded T6, AF-ON down | 526 | (417, 265) 66×70 | experiment 5 |

## Who writes the origin

Routine `0x61184e51` stores the origin. `0x611852e9` writes X to SP+`0xec` and `0x61185307` writes Y to SP+`0xee`. On the idle after the cell becomes 412, those stores are 356 and 198. The inputs sitting on the stack at that moment are point (16, 10), size constants (3, 3), object `0x62c54158`, and the word 406 at object+`0x364`.

`0x610c8c2e` then copies that pair. `0x610c8c62` writes the X halfword to object+8 and `0x610c8c70` writes the Y halfword to object+`0xa`. The observed addresses are `0x62c546c0` and `0x62c546c2`, so the object is `0x62c546b8`.

The copy loop at `0x610deb9d` then writes the mark pair to `0x62bd71ec` (X) and `0x62bd71ee` (Y). Earlier in the same idle those fields held 417 and 265.

The call that enters `0x61184e51` on that idle is `0x61184e30`, in function `0x61184dd6`. The return address is `0x61184e35`. That function has no direct `cd` or `dd` caller. Dirty byte `0xa32bfb32` was already 1 before the setter in experiment 6.

## AF-ON

| session | owner after AF-ON down | ten-byte target | cell | origin routine entries | flag `0x610f7172` | union |
| --- | --- | --- | --- | --- | --- | --- |
| seeded | 2 | `11 02 03 00 01 00 01 00 00 00` (position 529) | 526 | 0 | 3 | (417, 265) 66×70 |
| unseeded | 2 | `0e 02 02 00 01 00 01 00 00 00` (position 526) | 526 | 0 | 3 | (417, 265) 66×70 |

The press reaches the flag writer. It does not enter `0x61184e51`. The corner-mark union stays on the half-press frame. The requirement is not met. No display change was installed: the routine’s coordinate word is 406, which is not the AF-ON position, and the press does not enter the routine.
