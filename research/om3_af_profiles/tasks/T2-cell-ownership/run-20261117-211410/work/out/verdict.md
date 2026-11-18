# Verdict

Key 0x5b82 is OWNABLE.

Own the 13 unnamed u16 cells, indices 0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14 and 15. That is 26 bytes. The named cells stay the camera's: index 5 (UI id 2017, Toy Photo type 3 cursor), index 12 (UI id 2031, Vintage type 3 cursor), index 13 (UI id 2034, Partial Color type 3 cursor). Stop here. Keys 0x5b52, 0xf5f1 and 0xf5e1 were not taken.

## Why these cells are free

No instruction loads the immediate 0x5b82. The key exists in one registration record, at 0x600e5874 (bytes `82 5b 10 00`, count 16, width 2, 32 zero default bytes), and in three UI-map entries that store indices 5, 12 and 13. There is no map entry, and no other (key, index) pair, for an unnamed index.

Every UI-id immediate (0x7e1, 0x7ef, 0x7f2) passes that id into a menu builder or into FUN_60419446 / FUN_60419696, which return the map's stored key and the map's stored index. The index is not the current art-filter number. FUN_60062d93 is the only writer that walks every index of the record. It writes the ROM defaults. It runs for bank 7 in two places: the boot path that rebuilds an invalid area (`mov 0x7,D0` at 0x60063eb0, then `call 0x60062a60`), and the prmdbg console handler FUN_600619a9 (`set_def`, and `size` via FUN_60062fe5). FUN_600619a9 has no direct caller. Its only absolute pointers are the handler slots at 0x602ec448 and 0x602eda1c. A valid settings save does not take the boot rebuild: the next session restored the marked cells.

## Dynamic result

Markers were written with the native setter FUN_60063431 and read back with FUN_60063380. Two full marked runs (dynamic-5b82-mark-b.jsonl and dynamic-5b82-mark-n.jsonl) and the control (dynamic-5b82-control.jsonl) agree. Named cells stayed at the stock value 3200 (0x0C80) in the control and in every marked run. Unnamed cells stayed at the marker in the marked runs and at 0 in the control.

PASS, marker intact and named cells unchanged:

- creative dial positions 0 through 4, including Art (the picture-mode page opened on Pop Art)
- main dial and sub dial on that page, which changed the art-filter name and the type value of setting 361
- arrow keys on that page, including Add Effects and Color Filter
- setting 867 (MODE_ART_EFFECT) through every allowed value 0 through 9
- setting 897 (picture-mode family) through every allowed value
- art-filter type settings 362 through 368, including Toy Photo type 364 values 1, 2 and 3
- mode dial positions S, A, P, C5, C4, C3, C2, C1, B, M, then back
- menu open and menu close, which posted the native settings save
- a new session on the same NVRAM file (stores M and E loaded; all 13 markers and the three named cells came back)

BOUNDARY:

- The stills Custom Mode Reset row was opened (C1 action list: Recall, Assign, Save Settings, Custom Mode Name, Reset; the help line "Initializes the settings." was drawn in dynamic-5b82-mark-b.jsonl). The confirm control was not activated reliably. The cursor reader either could not tell which short row was highlighted, or a counted Down did not redraw a new row. No completed confirm. Markers were unchanged through every key that did run.
- No separate full-camera reset row, outside that Custom Mode Reset, was opened. The groups walked were setup, playback, movie and stills. File-name Reset and Reset All Images were on screen and were not confirmed.
- Three byte-scan addresses for UI id 0x7f2 (0x610f2144, 0x610f2159, 0x61217ec4) are not instruction-start lines in the export. The other 0x7f2 site, 0x604800c0, is a menu-builder argument. Nothing at those three addresses is an index into this key.

## Recommended layout

Use the PEN-F tagged dword 0x4831CCVV. 0x48 and 0x31 are the fixed marker, VV is the value byte, CC is the complement of VV (VV xor 0xFF). A dword that is not that shape decodes as neutral, including the ROM default of zero.

Pack six dwords, little-endian, across these index pairs, in this order:

1. indices 0 and 1 — version in the value byte
2. indices 2 and 3
3. indices 4 and 6
4. indices 7 and 8
5. indices 9 and 10
6. indices 11 and 14

Index 15 stays 0 and is unused. That is 24 bytes of tagged storage plus one spare cell. Do not write indices 5, 12 or 13.

The camera's own settings save carries the cells, as the second session showed. A backup that records only named settings does not. Carrying the profile in an OM Workspace backup would be a separate change, and it is out of scope here.
