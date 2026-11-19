# AF profile layout and factory defaults

The mirror is the 71 bytes at `0xa031eeb0`. The flag is the next byte, `0xa031eef7`. The zone byte is separate, at `0xa031e920`.

Factory defaults are the bank-7 registration payloads. The walk is `work/scripts/defaults_l0.py`, recorded in `work/out/factory-defaults-l0.json`. It lands on the known `0x5b82` record (`0x600e5874`, count 16, width 2, zeros) and on `0x99a1`. Every mirror key's ROM payload is zeros. The session patterns `02 00 02 00 02 00 05 05`, the `27 39` size head, and the `0x5a11` ones are not in the image. Boot values that are not zero are runtime values, not a second default table.

The zone-type default is 0 (All). That is the descriptor payload of `0x99a1`, which is eight zero bytes. The separate zone byte's Z5 image value is also 0.

| Key | Mirror offset | Layout count | Width | Descriptor count | Descriptor width | Live address | Record | Payload |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `0x99a1` | `0x00` | 8 | 1 | 8 | 1 | `0x6295946c` | `0x6011ebdc` | 8 zeros |
| `0x9a41` | `0x08` | 2 | 1 | 1 | 1 | `0x62959484` | `0x6011ec34` | 1 zero |
| `0x5962` | `0x0a` | 6 | 2 | 6 | 2 | `0x62920bf0` | `0x600e575c` | 12 zeros |
| `0x1dd1` | `0x16` | 10 | 1 | 10 | 1 | `0x62920982` | `0x600e4f4c` | 10 zeros |
| `0x84d1` | `0x20` | 1 | 1 | 1 | 1 | `0x62920fa5` | `0x600e5fe8` | 1 zero |
| `0x88b2` | `0x22` | 1 | 2 | 1 | 2 | `0x629526c0` | `0x60117870` | 1 zero word |
| `0x90d1` | `0x24` | 8 | 1 | 8 | 1 | `0x62959355` | `0x6011e7a8` | 8 zeros |
| `0x5a11` | `0x2c` | 11 | 1 | 11 | 1 | `0x62920c18` | `0x600e57c4` | 11 zeros |
| `0x1de1` | `0x37` | 8 | 1 | 8 | 1 | `0x6292098c` | `0x600e4f5c` | 8 zeros |
| `0x1df1` | `0x3f` | 8 | 1 | 9 | 1 | `0x62920994` | `0x600e4f68` | 9 zeros |

`0x9a41` has one descriptor byte. The layout's second byte has no descriptor byte. `0x1df1` has nine descriptor bytes; the mirror holds eight.

Custom-size slots measured on the stock editor (`work/out/measure-size-l2.jsonl` and `work/out/exit-l6.jsonl`):

- C1 writes `0x1dd1` indices 2 and 3, `0x1df1` index 4, and `0x1de1` indices 0 and 1.
- C2 writes `0x1dd1` indices 4 and 5, `0x1df1` index 5, and `0x1de1` indices 2 and 3.

`0x5a11` stays at its runtime value. Its descriptor default is zeros, so a direct-screen dial does not reach C1 until those bytes are 1. The menu list still shows C1 with the descriptor zeros.
