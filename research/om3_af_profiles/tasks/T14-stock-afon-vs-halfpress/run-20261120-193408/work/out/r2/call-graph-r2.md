# T14 call graph, correction round

Image `inputs/00_0100_50000020.decoded.bin`, base `0x60021020`. R1 listings and `work/out/call-graph.md` are unchanged. This note adds the publication chain, the custom-button route, and the corrections from Sol's review. Linear listings are under `work/out/r2/listings/`. Ghidra's function bounds split some prologues (`0x610a2407` is five bytes and the body continues at `0x610a240c`; the same split is at `0x610a2dec` / `0x610a2df1`). The linear listings are the evidence for those bodies.

The second store of cached `0xe951[0]` is `0x609b39f0` `fc82be2c3fa3` `movbu D0,(0xa33f2cbe)`, in `work/out/listings/priority-cache-b.txt`. The r1 call graph's `0x609b39f2` was the middle of that instruction.

## Publication, direct calls only

`0x609b3c79` has two direct calls, both already listed:

- `0x609b3b98` calls it and clears dirty `0xa33f2cea`.
- `0x609b3bbc`, inside accessor `0x609b3bb2`, calls it when dirty is 1.

`work/out/r2/reverse-refs.txt` and `work/out/r2/scan-r2.json` agree on the direct callers:

| Site | Caller chain |
| --- | --- |
| `0x609b3b98` | `0x60711295` in `0x6071128b`, and only when `0xa33f3640` is not 0 |
| `0x6071128b` | `0x60447eb1` in `0x60447de4`, and only when the pose-group compare at `0x60447ead` is not equal |
| `0x609b3ba7` (sets dirty) | `0x607112a9` in `0x6071129f`, called from `0x60447ec3` on that same not-equal path |
| `0x60447de4` | `0x60216e6c` in `0x60216e4b`, and `0x60afabdc` in `0x60afab08` |
| `0x609b3bb2` | `0x60900258`, `0x60903e56`, `0x609052a1` |

`0x60216e4b` calls the pose refresh near its entry, after `0x60447d18`, before the rest of that function (`work/out/r2/listings/pose-caller-a.txt`). `0x60afab08` calls it on the arms that survive the compares with `0x0a` and `0x71`–`0x75` (`work/out/r2/listings/pose-caller-b.txt`). Neither function is a button handler.

No direct call of `0x609b3c79`, `0x609b3b98`, `0x609b3bb2`, `0x6071128b`, or `0x60447de4` sits in `0x610aef37`, `0x610a240c`, `0x610a25f1`, `0x610a5620`, `0x610a2df1`, or `0x610b962a`. The one-level walk in `work/out/r2/call-walk.txt` also found no direct goal call inside the direct callees of those button functions. Deeper calls and the indirect `calls (An)` sites are not closed. The open indirect sites on these bodies are `0x610a24ed`, `0x610a2b53`, `0x610a2b8d`, `0x610a56da`, `0x610a5734`, `0x610a5884`, `0x610a58a7`, `0x610a6346`, and `0x610a63bd`.

A search for the absolute immediates of `0x609b3c79`, `0x609b3b98`, and `0x609b3bb2` in `scan-r2.json` `pointers` is empty. That does not rule out a pointer built in a register.

## S1 handler

Rows `0x61339090` and `0x613390a0` still point at `0x610aef37` (events `0x01000002` and `0x01000003`).

`0x610aef3f` calls `0x610a3735` with `0x31`. The stores of 4, 5, and `0xab` at object `+0x20` run only when that call returns 1 (`0x610aef46`–`0x610aef48`). The up event then calls `0x610a6323` at `0x610aef7c` on the path that does not depend on that return. `0x610a3735` compares `0x31` with a word from `0x62b7f8e8` (`work/out/r2/listings/s1-gate.txt`). That address is past the end of this image (`0x60021020` + 33554368 = `0x62021020`), so the gate result is not in the image.

The handler does not store the word 2 at object `+0x124`. That store is on the mode-1 arm of `0x610a5620`, as in the r1 listing.

## Custom-button route

Assignment entry `0x612f20c8` is `45 00 00 00 0a 00 00 00 45 00 00 00 00 00 00 00`: value 69, function `0x0a`, alternate 0.

`0x610831e6` (`work/out/r2/listings/assign-lookup.txt`) walks that table from `0x612f20a8`, stride `0x10`, for `0x50` entries. On a match whose word at `+0xc` is 0, it returns the word at `+4`. For value 69 that word is `0x0a`, and `+0xc` is 0, so the match returns `0x0a` without calling `0x61094313`.

Event `0x01000032` at row `0x6131be80` (the row the prior live note names while S1 is up) holds handler `0x610a2407`. The linear body calls `0x610830ab` at `0x610a2520`. Return 2 falls through to `0x610a2548`, which calls `0x610a25f1` with D0 equal to D2. D2 is `0x3b` when `(0x4, A3)` is `0xba` (`0x610a2434`–`0x610a243a`); otherwise D2 is the return of `0x61083022` (`0x610a243d`). Return 1 of `0x610830ab` calls `0x610b43f9` instead. Any other return skips both.

`0x610a25f1` saves that D0 at `(0x1c, sp)` (`0x610a25f2`). After the range check `1..0x8c`, `0x610a2666` loads table `0x613086e8`, subtracts 1, and jumps through the word at that index (`work/out/r2/listings/custom-start.txt`, `work/out/r2/jump-slots.txt`):

| Value in D0 | Slot | Bytes | Lands on |
| --- | --- | --- | --- |
| 8 | `0x61308704` | `73 26 0a 61` | `0x610a2673`, which sets D0 to 3 and branches to the call |
| 10 (`0x0a`) | `0x6130870c` | `79 26 0a 61` | `0x610a2679`, which sets D0 to 1 and falls into the call |
| 59 (`0x3b`) | `0x613087d0` | `b8 2b 0a 61` | `0x610a2bb8`, not the call below |

`0x610a267f` is `cd a1 2f f0 44`, `call 0x610a5620` with D1 cleared. The prior live note records this call with mode argument 1. The static slot that produces mode 1 is value 10. The instructions from `0x61083022`'s return to the value 10 are not in the handler listing, so this image does not by itself show that every AF-ON down arrives with 10. The `0xba` shortcut arrives with 59, which is a different slot.

While S1 is held, the prior note names rows `0x6131c8f0` and `0x6131c900`. Their handlers are `0x610a3035` and `0x610a3225`. The first 40 instructions of `0x610a3035` call `0x6108ad0a` and can return; the rest of that body was not walked (`work/out/r2/listings/event-down-held.txt`).

## Release

Event `0x01000033` at `0x6131be90` holds `0x610a2dec`, which continues as `0x610a2df1`. That function indexes the pair table at `0x61308918` (`work/out/r2/listings/release-dispatch.txt`). The pair at `0x61308968` is bytes `0a 00 00 00 c1 2f 0a 61`: id 10, handler `0x610a2fc1`.

`0x610a2fc1` sets D0 to 1 and calls `0x610a58c7` (`work/out/r2/listings/fn-0a-release.txt`). In `0x610a58c7`, argument 1 takes `0x610a58ea`, calls `0x610a5ab8`, and then `0x610a5921` calls `0x610a6323` (`work/out/listings/af-release.txt`).

S1 up calls `0x610a6323` from `0x610aef7c` and does not call `0x610a58c7`. The shared tail is `0x610a6323`. That tail calls through `(A1)` at `0x610a6346` and `0x610a63bd`.

The archived AF-ON up `0x610b9653` is a different row (`0x6131c2a0`, event `0x01050008`). It calls `0x610a58c7` with 1, then has `calls (A1)` at `0x610b9684` and a call of `0x61090e0a` at `0x610b96a7`. The prior live note says that wrapper did not run on the default route.

## Shadow and the seven inputs

Absolute immediates of `0xa33d4a94`, `0xa33d4a96`, `0xa33d4a98`, and `0xa33d4a9a` occur twice each (`scan-r2.json` `shadow`). The loads are the r1 helper `0x609832f5`. The stores are `0x60983156` (`work/out/r2/listings/shadow-store.txt`): byte `0xa33d4a94` = 0, half `0xa33d4a96` = `0x020e`, halves `0xa33d4a98` and `0xa33d4a9a` = 1. The only direct call of `0x60983156` is `0x6041a848` (`work/out/r2/setter-windows.json`). That site is not in the button bodies walked above.

`0x609b3bca`, the setter wrapper used with key `0x4601` at `0x60902477`, has that one direct call. A 24-byte window before every direct call encoding of `0x60063431` contains none of `0x9a41`, `0x1dd1`, `0x84d1`, `0x88b2`, `0x1df1`, `0x1e01`, `0xe951`, `0x9fa1`, or `0xdfa1`. The walked button bodies contain none of those key immediates (`call-walk.txt` `keys none`). `0x609eff6b`–`0x609eff97` call `0x60063356` for `0x84d1`, `0x88b2`, and `0x9a41` and store the returned pointer; that is the r1 `alt-kind-a` listing, not a store of the cell value. A write through a returned pointer, or a key loaded more than 24 bytes before `0x60063431`, is outside this scan.

## `0x90a1[1]`

`0x609024aa` calls `0x609b3481` and reads struct `+0x11`, the cached `0x90a1[1]` (`work/out/listings/priority-use-a.txt`):

- A nonzero byte branches to the return at `0x609024cf`.
- A zero byte also returns there when `0xa33ca30d` is nonzero (`0x609024b8`–`0x609024c0`).
- Both zero: `0x609024c2` calls `0x609025aa`, then `0x609024c9` stores 1 at `0xa33ca30d`.

`0x609025aa` calls `0x60873db4`. That body calls `0x60890a0d` at `0x60873e1f` with bytes `dd ee cb 01 00 f0 2c` (`work/out/r2/listings/sync-body.txt`). `0x60890a5e` calls `0x6004cdf8`. When that returns 0, `0x60890a6f` calls `0x6004cefd` (`work/out/r2/listings/sync-helper.txt`). Those two callees do not themselves call `0x609b3c79` or contain the seven key immediates (`call-walk.txt`). `0x6004cdf8` continues into `0x6004dfd0`, `0x6004e20e`, and `0x60038ea5` (`work/out/r2/listings/sync-cdf8.txt`). `0x6004cefd` continues into `0x6004dfd0`, `0x6004e29a`, `0x60030bcf`, and `0x6004ddd7`. Those further calls are not tied to the record, and they are not shown to be unable to reach it.
