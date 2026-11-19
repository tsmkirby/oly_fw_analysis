# T4b flash callees

Listings are in `work/out/listings`. The call tree is `work/out/flash-calls-b2.txt`. Every instruction row was compared with `inputs/00_0100_50000020.decoded.bin` at offset `address - 0x60021020` by command 08: 71 files, 2323 rows, 0 mismatches.

## Depth

From `work/out/flash-roots-b1.txt`:

- Level 0: the six functions, cap 500 instructions.
- Level 1: each direct callee, cap 250.
- Level 2: each of those callees, cap 80.
- A call below level 2 is named in the call tree and not listed. Each address is listed once.

All six level-0 bodies return inside the cap. Three level-2 listings hit the cap and are marked `TRUNCATED` in the file: `FUN_600219ed` (last listed instruction `0x60021aec`), `FUN_60035feb` (last listed `0x600360a2`), `FUN_60068a54` (last listed `0x60068c9b`, which jumps to `0x60068d20`). Their tails are unexamined.

## The six functions

`FUN_60021812` (`d0-flash-21812-60021812.txt`, 65 instructions, `ret` at `0x600218e7`). Builds a descriptor at A3 from a counter and stores argument words into it. Calls `0x6002172b`, `0x60075f73`, `0x6005cec3`, `0x6005d00e`, `0x60075fbc`, `0x60023c05`, `0x60023deb`, `0x60023f80`. No sum of a copied range in this body.

`FUN_60023042` (`d0-flash-23042-60023042.txt`, 182 instructions, `ret` at `0x600231ea`). Calls `0x60023210` and `0x60023218`, range-checks the destination, calls `0x6002269f` (one immediate move and `retf`), then `0x60021d89` and `0x600226c0`.

`FUN_60023228` (`d0-flash-23228-60023228.txt`, 49 instructions, `ret` at `0x6002328a`). Calls `0x60022f49` (loads `0x800000` and `retf`) and then `0x600229c2` one or more times.

`FUN_600218ea` (`d0-flash-218ea-600218ea.txt`, 15 instructions, `ret` at `0x60021907`). Compares D0 with the word at A0+0x10 and stores a difference back to that word. On the borrow path it calls `0x6008200e`. This updates a length word. It does not walk payload bytes.

`FUN_600236ea` (`d0-flash-236ea-600236ea.txt`, 9 instructions, `ret` at `0x600236ff`). If D1 is 0, call `0x60023208`. If D1 is 1, call `0x600232a9`. `0x60023208` only calls `0x60022696`, which stores D0 at `0xa32a97a4` and `retf`. `0x600232a9` only calls `0x60022f1f`, which stores D0 at `0xa32a97ac` and `retf`.

`FUN_600236a2` (`d0-flash-236a2-600236a2.txt`, 20 instructions, `ret` at `0x600236e7`). Reads the flag byte at `0xa32a97bc`. When that byte is 0 and D0 is 0 or 1, it loads a halfword from `0x60042f02` or `0x60042f04`, calls `0x6004d43f`, points A0 at `0x60025ea6` or `0x60025eae`, and calls `0x6004ddd7`. Returns 0. No byte-sum loop in this body.

## Where the copy goes

`FUN_600229c2` (`d1-callee-600229c2.txt`) reads the word at `0xa32a97ac`. When it is `0x20000` or `0x10000`, it loops, calling `0x60022f52` and `0x60022c32` with a chunk of at most `0x800000`. Otherwise it calls `0x60023f80` and returns. The listed body does not add loaded bytes into a sum.

`FUN_60022c32` (`d2-callee-60022c32.txt`, complete, `ret` at `0x60022d58`) programs the controller. Stores in this listing:

- `0x98d00200`, `0x98d00428`, `0x98d0048c`
- `0x98d00310`, `0x98d00268`, `0x98d00270`, `0x98d00274`
- `0x98d00308`, `0x98d00314`, `0x98d00320`, `0x98d00324`
- `0x98d002f0` (twice)

It calls `0x6004d7b1`, `0x60076082`, `0x600760c7`, `0x60022f67`, `0x60076096`, `0x600760d2`, `0x60022e48`, and `0x60023f80`. Of those, `0x60022f67` and `0x60022e48` are below level 2 on this path and are not listed. The listed body has no checksum loop.

`FUN_60021d89` (`d1-callee-60021d89.txt`, called from `0x60023042`) also programs the controller: `0x98d01108`, `0x98d011c0`, `0x98d01800`, `0x98d01804` (three writes), and a read of `0x98d01194`. Its listed body does not sum payload bytes.

`FUN_600226c0` (`d1-callee-600226c0.txt`) is a copy. After alignment checks it has three loops, selected by the low bits of the pointers and the length: `movbu (A2),D0` / `movbu D0,(A0)` at `0x600226fd`, `movhu` at `0x60022726`, and `mov (A2),D0` / `mov D0,(A0)` at `0x6002273f`. Each loop stores the value it loaded and counts the transfers. It does not add the loaded value into another register.

`FUN_60023deb` (`d1-callee-60023deb.txt`) also copies bytes: `movbu (A3),D0` then `movbu D0,(A2)` at `0x60023ea3`, and a second loop that stores the loaded byte through an index at `0x60023edf`. The `add` instructions in this function add a stack slot (`mov (0x4,sp),D0` / `add D0,D1` at `0x60023e7b`, and `add D1,D0` at `0x60023ec6` before an `and 0x1fff`). Those adds are index arithmetic. They are not a sum of the copied bytes. A scan of all 71 listings for "load a register from memory, then add that register within the next five instructions" found only these stack-slot adds.

`FUN_6004d7b1` compares the halfword at the fixed address `0x60357008` with `0xbeef` (`0x6004d7be`). That is a marker at a constant address, not a sum of the copy. Its further calls (`0x60030363`, `0x6004ddd7`, and the others named under it in the call tree) are not listed.

## Checksum and decompression, bounded to the listings

In the listed instructions, no function adds a byte or word loaded from the copy source into a running sum. The loops that load a source byte store that byte onward. `FUN_600218ea` updates a length word. `FUN_6004d7b1` compares a halfword at a fixed address with `0xbeef`. No listed instruction tests an olycompress header or inflates a buffer. The copy that is listed is controller-register programming (`FUN_60022c32`, `FUN_60021d89`) or a plain byte, halfword, or word move (`FUN_600226c0`, `FUN_60023deb`).

That bound stops at the listed instructions. The tails of `FUN_600219ed`, `FUN_60035feb`, and `FUN_60068a54` are not listed. Every call the tree marks `not-listed` is not listed. A checksum or a decompressor in those unlisted instructions is outside this answer.
