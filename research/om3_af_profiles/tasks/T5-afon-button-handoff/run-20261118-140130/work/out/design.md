# Native changes for the AF-ON button handoff

This extends the T3i list. It is not a storage decision, not a firmware image, and not a hardware recommendation. The live zone value stays in RAM at `0xa031e920`. The image byte at `0x6031e920` remains the default 0. A native save does not gain the value, and a new session reads 0. Every behaviour write is EMULATOR-ONLY.

T3i's data is reused byte for byte. Its native-change list is unchanged:

- Profile head at `0x6031e920`: zone byte, magic `0xA7`, version 1, pad 0. The four bytes `0x6031e924`–`0x6031e927` stay `0xFF`.
- Provider id list and row array at `0x6031e928`–`0x6031e99b`.
- UI-238 descriptor clone, id `0x3D6F`, at `0x6031e9a0`.
- Action table at `0x6031ea00`, face record at `0x6031ea48`, help list at `0x6031ea6c` through `0x6031eae3`. Help text id `0x01a8`. Row label `0x0DD2`.
- Runtime, not image: page pointer `0x6158f0f8` → `0x6031e930` count 3; source `0x61529ce8` → `0x6031e928` count 3; action table `0x6150f5f0` → `0x6031ea00` count 3; binding directory `0x615cc934` → `0x60320000` count 417.
- Getter `0x6041931e` returns the byte at `0xa031e920` for UI `0x3D6F`. Setter `0x6041937f` writes `D1`'s low byte to both aliases and returns 0. Mapped getter `0x60419446` returns `0xA70F`. Index getter `0x60419696` returns 0.
- Face hook at `0x611f7f42` writes the face pointer `0x6031ea48` when the parent halfword at +0x54 is `0x3D6F`.
- Page 28 stays a reference construction. It is not a native route. The binding runtime copy at `0x60320000` is not a native home for the array.

## Edge hook

The classifier call at `0x610bf5e2` (section 7) changes from `call 0x6109227a` to `call 0x6031eb80,[d2],0x4`. Checked bytes of the patched site: `dd 9e f5 25 ff 80 04`.

The stub at `0x6031eb80` (287 bytes, through `0x6031ec9f`) recognises S1 `0x01000002` / `0x01000003` and AF-ON semantic `0x010000cc` / `0x010000cd` with physical source `0x01000032` / `0x01000033`. It reconciles, then tail-calls the stock classifier `0x6109227a`. Any other key falls through to that classifier. The call site is in compressed section 7. This prototype does not prove a packaging or placement for that edit.

## Profile read

The home builder's AF Home read at `0x60a8f708` becomes a read of the RAM byte:

```
60a8f708 fca820e931a0  movbu (0xa031e920),D0
60a8f70e dc0e000000    jmp 0x60a8f71c
```

`0x60a8f71c` is the existing call into converter `0x609b3ecd`. Size `0xdfa1`, position `0x99d2` and `0x1e01` stay. Which ten-byte fields follow the profile byte, and which stay on the legacy provider, is in `target-bytes.md`.

## Placement so the two overlays do not share a byte

Z occupies `0x6031e920`–`0x6031e923`, `0x6031e928`–`0x6031e99b`, `0x6031e9a0`–`0x6031e9b3` and `0x6031ea00`–`0x6031eae3` (368 bytes). The central-edge state machine used the same block: held flags at +0 and +1, the provider list at +8, half banks at `0xa031ea00`, AF-ON banks at `0xa031eaa0`, and the ensure routine at `0x6031ead0` inside Z's help list. Putting both images down as published overlaps 349 addresses, 182 of them with different values, from `0x6031e921` through `0x6031eae3`. Those 182 central-edge bytes are not applied on top of Z.

The combined image moves the owned block `[0xa031e920, 0xa031e920+0x1b0)` to `0xa031ed00` (delta `0x3e0`, 432 bytes) and moves ensure (66 bytes) to `0x6031eca0`. The stub stays at `0x6031eb80`. Its call of ensure, at `0x6031ec4d`, is retargeted from `0x6031ead0` to `0x6031eca0`. Sixty immediates in the stub, the ensure body, the mode guard and the reconciliation move with the block. The enabled flag is published at `0x6031ed06` = 1. The profile byte `0xa031e920` is not part of the moved block.

This relocation is EMULATOR-ONLY placement so the two behaviours can run in one session. It is not a chosen native address. Counts of the combined image, before the profile swap: Z 368, central-edge 2175, new 718, total 3261 (`work/out/cmd/05.out`). The swap changes 15 of those bytes and adds the one stock `0xFF` byte of the old call displacement, 3262 rows (`work/out/cmd/14.out`).

`overlay-changed-bytes.csv` marks every row `Z`, `central-edge`, or `new`.
