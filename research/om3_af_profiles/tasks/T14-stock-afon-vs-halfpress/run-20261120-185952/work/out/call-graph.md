# T14 call graph — stock target record

Image `inputs/00_0100_50000020.decoded.bin`, base `0x60021020`. Listings are linear disassembly. Ghidra prints immediates above `0x7fffffff` as signed values; the instruction bytes are the address. Example: `fc dc e0 2c 3f a3` is `mov 0xa33f2ce0, A0` and prints as `mov -0x5cc0d320, A0`.

## One writer

`0x609b3c79` is the only function that stores the ten-byte record. Absolute immediates of the record fields sit at these instructions (`work/out/scan-t14.json` `abs_hits`, confirmed in `work/out/listings/writer-accessor.txt`):

| Field | Instruction | Store |
| --- | --- | --- |
| +0 position u16 | `0x609b3d3d` `fc83e02c3fa3` | `movhu D0, (0xa33f2ce0)` |
| +2 kind | `0x609b3d4c` `fc82e22c3fa3` | `movbu D0, (0xa33f2ce2)` |
| +3 size key | `0x609b3d55` `fc82e32c3fa3` | `movbu D0, (0xa33f2ce3)` |
| +4 vertical u16 | `0x609b3d5e` `fc83e42c3fa3` | `movhu D0, (0xa33f2ce4)` |
| +6 horizontal u16 | `0x609b3d67` `fc83e62c3fa3` | `movhu D0, (0xa33f2ce6)` |
| +8 priority | `0x609b3d37` `fc8ae82c3fa3` | `movbu D2, (0xa33f2ce8)` |
| +9 | `0x609b3d46` `fc8ee92c3fa3` | `movbu D3, (0xa33f2ce9)` |

`0x609b3bc1` loads the same pointer and returns it. `0x60903e55` copies bytes +0, +2, +3, +4, +6, +8, +9 from that buffer to the caller’s A2.

Direct calls of `0x609b3c79` (call16 `cd`, relative to the instruction):

- `0x609b3b98` calls it, then clears the dirty byte `0xa33f2cea`.
- `0x609b3bbc` calls it when `0xa33f2cea == 1`, inside accessor `0x609b3bb2`, which then returns `0xa33f2ce0`.

Those two sites are reached from:

- `0x60711295` → `0x609b3b98`, and `0x607112a9` → `0x609b3ba7` (sets dirty). Both are called from pose-group refresh `0x60447de4` at `0x60447eb1` and `0x60447ec3`, and only when the compared group changes (`0x60447ead` `cmp A2, D3`).
- `0x60447de4` itself is called from `0x60216e6c` and `0x60afabdc`.
- Init sets dirty at `0x609b348a`, called from `0x608fe1be` inside `0x608fe1b0`.

## Writer inputs, in order

Each key is passed to getter `0x60063380` with the index in D1.

| Address | Instruction | Key | Index | Lands in |
| --- | --- | --- | --- | --- |
| `0x609b3c7a` | `fccc419a0000` | `0x9a41` | 0 | stack byte +4, later record +3 |
| `0x609b3c8c` | `2cd11d` | `0x1dd1` | 0 | stack half +0xc, later record +4 |
| `0x609b3c9c` | `2cd11d` / `8501` | `0x1dd1` | 1 | stack half +0xe, later record +6 |
| `0x609b3cad` | `fcccd1840000` | `0x84d1` | 0 | stack byte +8, later record +2 |
| `0x609b3cc0` | `fcccb2880000` | `0x88b2` | 0 | stack half +0x10, later record +0 |
| `0x609b3cd3` | `2cf11d` | `0x1df1` | 0 | D2, low byte later record +8 |
| `0x609b3ce4` | `2c011e` | `0x1e01` | 0 | D3, low byte later record +9 |

Then `0x609b3cf0` calls `0x609b3481` and reads `(0x22, A0)`, which is `0xa33f2cbe`. That byte was stored from setting `0xe951` index 0 at `0x609b369b` (`fc82be2c3fa3`) and again at `0x609b39f2`.

If that byte is 1, `0x609b3d0c` calls `0x609832f5`. The helper copies:

- kind from `0xa33d4a94` onto the stack kind
- position from `0xa33d4a96`
- vertical from `0xa33d4a98`
- horizontal from `0xa33d4a9a`

Size key, priority, and record +9 stay as the getter results.

After that call the writer reloads the kind and applies two overrides, then stores:

- Kind 2: `0x609b3d1a` `mov 0x20e, D0` overwrites the position half. `0x020e` is 526.
- Priority low byte is cleared at `0x609b3d33` when the kind is 2, or the kind is 0, or the kind is 3 and the vertical half is 3.

The writer’s immediates are these keys and these indices. It has no read of `0x90a1`, `0x99a1`, `0x9fa1`, `0xdfa1`, pose, or a button owner field.

## Half-press edge

Event rows at `0x61339090` and `0x613390a0` (bytes `02000001…37ef0a61` and `03000001…37ef0a61`) hold handler `0x610aef37`.

`0x610aef37`:

- event `0x1000002`: store 4 at `(0x20, A2)` (`0x610aef65`)
- event `0x1000003`: store 5 at `(0x20, A2)`, then call `0x610a6323` (`0x610aef7c`)
- event `0x1020000`: store `0xab` at `(0x20, A2)`

No instruction in this handler calls `0x609b3c79`. The down edge’s stored value is 4 at object +0x20.

## AF-ON edge

Three table copies (`0x6131c290`, `0x6131cce0`, `0x6131f3ec`, bytes `07000501…2a960b61`) hold handler `0x610b962a`. The paired up handler `0x610b9653` is the pointer in the following rows.

`0x610b962a`:

1. `0x610b9631` passes 1 to `0x610b9828`.
2. `0x610b9638` passes `0xb` and 0 to `0x6108ad0a`.
3. If that returns 1, `0x610b9649` calls `0x610a5620` with D0 still 1 and D1 cleared.

Inside `0x610a5620`, mode 1 is the `cmp 0x1, D3` at `0x610a5697`, which jumps to `0x610a57db`:

- `0x6108a5a0` returning 0 returns immediately (`0x610a57e5`).
- `0x6108a68c` returning 1 calls `0x610a58c7` with the mode, then `0x610a375f`. If that returns 0: `0x610a580a` `mov 0x2, D0` and `0x610a580c` `mov D0, (0x124, A2)`, then `0xb0` at `(0x20, A2)`, then `0x6108a732`. If `(0xbc, A2) == 0x590c`, it calls `0x61090e0a` with 7.
- Otherwise `0x6108a7f9` returning 1 calls `0x610a613c` and returns. The other arm calls `0x610a5f10`, which stores the same word 2 at object +0x124 (`0x610a5fc8` `mov 0xd0, A2`; `add A3, A2`; `mov 0x2, D0`; `mov D0, (0x54, A2)`).

No arm calls `0x609b3c79`. The image contains no absolute immediate of `0xa031ed04` or `0xa031ebe0` (`scan-t14.json` `abs_hits` empty).

`0x610b9653` (up) calls `0x610a58c7` with 1. For argument 1 or 4 that function reaches `0x610a5921`, which calls `0x610a6323`. S1 up calls the same `0x610a6323`.

`0x610a6323` reads setting `0x3ba0`, then an indirect call. On three result arms it passes 1 (`0x610a638c`), 6 (`0x610a63a1`), or the value already in D2 (`0x610a63b6`) through vtable offset `0x1bc`. The listing contains no direct call to `0x609b3c79`.

## Where `0x90a1` is read

Cache routine, entered at `0x609b34d1`, whose only direct caller is `0x609ed0a2`:

- `0x609b376d` getter `0x90a1` index 0 → `0xa33f2cac` (`0x609b377d`)
- `0x609b3783` getter `0x90a1` index 1 → `0xa33f2cad` (`0x609b3794`)
- the same pair again at `0x609b3a48` / `0x609b3a5e`

The writer reads struct +0x22 and does not read +0x10 or +0x11.

Base-relative byte reads of displacement `0x10` or `0x11` in the 48 bytes after a call of `0x609b3481`:

- `0x60902460` and `0x6090246c`: `movbu (0x10, A0), D3` after `0x60902452`. This is cached index 0. One arm then calls setter `0x609b3bca` with key `0x4601` (`0x60902477`). Callers of `0x60902452`: `0x609e43dc`, `0x609e452f`.
- `0x609024b1`: `movbu (0x11, A0), D0` immediately after `0x609024aa`. Compare 0 at `0x609024b4`. Value 0 falls through to `0x609025aa` and sets `0xa33ca30d` to 1. Any other value branches to the return at `0x609024cf`. Callers: `0x609e0701`, `0x609e082c`, `0x609e0927`, `0x609e0a44`, `0x609e0c09`, `0x609e0cf4`.
- `0x609025aa` calls `0x60873db4` and, if bit `0x2000000` of `0xa33f3620` is set, `0x609dd150`, then returns. It stores neither the record nor the seven input cells. `0x60873daf` (body containing `0x60873db4`) calls trace helpers only.
- `0x609e71fc` `movbu (0x11, A0), D0` is after `0x609e71f7` restored A0 from the caller’s saved object. That displacement is the caller object, not the cached `0x90a1` byte.

## Stock overlay addresses

`0x60a8f2be`, `0x60a8f4c1`, `0x60a8f6bb`, and `0x60a8f708` have no call16 or call32 hits. Bytes at `0x60a8f200` and at `0x60a8f6bb` are `0xff`.
