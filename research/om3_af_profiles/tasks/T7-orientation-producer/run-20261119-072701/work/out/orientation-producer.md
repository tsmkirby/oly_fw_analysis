# Stock orientation producer and the AF target banks

Stock E147 image only. The pose bytes are injected at the accelerometer's register read. Listings were checked against `inputs/00_0100_50000020.decoded.bin` at file offset = address − `0x60021020`. `work/out/listing-bytes-s4.txt` and `work/out/listing-bytes-r1.txt` report 0 mismatches. `work/out/listing-bytes-r1b.txt` checks the four later listings and also reports 0 mismatches.

## 1. Producer

The camera orientation is computed by `PER_ROTATE` from the accelerometer, not from the monitor-rotate switch and not from settings key `0xe91`.

The sensor path, in the order the firmware runs it:

| Step | Address | What it does |
|---|---|---|
| Init | `0x6006a436` | Clears the enable halfword `0x6298d7b0`, stores the copy pointer `0x6006a9c1` at `0x6298d754`, and starts `ACC_MAIN`. One caller, `0x60218ff0`, which the lab boot does not run. |
| Pin setup | `0x6006ab64` | Called from `0x6006a43d`. The data-ready pin is not modelled, so the session skips this call. |
| Probe | `0x6006a791` | Opens I2C channel 6, device `0x6b`, reads register `0x0F`, and continues only when the byte is `0x70`. It then writes register `0x10` = 3 and register `0x0D` = 1. Called from `0x6006a788`. |
| `ACC_MAIN` | `0x6006a660` | While `0x6298d7b0` is 1, calls the copy pointer and then the correction `0x6006ab94`. |
| Sample issue | `0x6006a8ab` | Reads 14 bytes from register `0x20` into `0x6298d7c0` and names completion `0x6006a8ca`. |
| Register read | `0x6006f28e` | The transfer. Callers: the sample issue at `0x6006a8c2`, and the synchronous read `0x6006f3a5` at `0x6006f3ae`. |
| Completion | `0x6006a8ca` | Unpacks little-endian pairs. Bytes 8–9, 10–11, and 12–13 become the accelerometer halfwords at `0x6298d7ce`, `0x6298d7d0`, and `0x6298d7d2`. |
| Copy | `0x6006a9c1` | Copies those halfwords to the sample cache `0x6298d758`, `0x6298d75a`, `0x6298d75c` when the sample counter has moved. |
| `PER_ROTATE` init | `0x60077d18` | Reads settings key `0x1f82` index 0 and starts the task. Callers `0x6007814f` and `0x6021901f`. |
| `PER_ROTATE` task | `0x60077e0a` | Runs while the state word `0x6298e3f4` is 1. Stores the raw orientation and the reported index. |

The raw orientation is the halfword at `0xa32c5690`. Four instructions can store it: `0x60077ff6`, `0x60078025`, `0x60078052`, and `0x6007805e` (`work/out/listings/rotate-task-s3.txt`). Which site runs for each sample is in section 4. The axis tests are:

| Raw code | Axis test |
|---|---|
| 0 | Y positive |
| 2 | Y negative |
| 1 | X positive |
| 3 | X negative |
| 4 | Z positive |
| 5 | Z negative |

The reported index is the word at `0xa32c568c`, stored at `0x600780b3`:

| Raw code | Reported index |
|---|---|
| 0 | 1 |
| 1 | 2 |
| 2 | 3 |
| 3 | 4 |
| 4 or 5 | the current index if it is 2 or 4, otherwise 1 |

The EXIF getter `0x60077de1` returns 1 when the word at `0xa32c5688` is 1. Otherwise it indexes the halfword table at `0x60357e68` with `0xa32c568c`. The table bytes are `0b 00 01 00 06 00 03 00 08 00`: halfwords 11, 1, 6, 3, 8 (`work/out/scan-table-s3.txt`). Reported index 1, 2, 3, 4 therefore returns EXIF 1, 6, 3, 8. A raw getter at `0x60077e01` returns the halfword at `0xa32c5690`. Its callers are `0x6006aba6`, `0x6006b7bb`, `0x6007d6e0`, `0x6007d7f1`, `0x609c82ea`, and `0x61042d0e`. The EXIF getter has eleven callers, listed in `work/out/scan-calls-s2.txt`. One of them, `0x6087458a`, stores the returned byte at `0xa33ac4e2`.

`0xe91` is not this variable. The only immediate load of `0xe91` in the stock image is the debug dump at `0x608fd5a0` (`work/out/scan-keys-s1.txt`). Its registration count is 12, record `0x600e4c2c` (`work/out/scan-xrefs-r1.txt`). The six-axis trace read all 12 cells after each sample and they were 0. The bank and record snapshots that printed a prefix of those cells were also 0. `trace-pose-s4.jsonl` did not read `0xe91`.

## 2. What each injected sample became

`work/out/trace-pose-s4.jsonl`. One sample is 14 bytes, little-endian, with the accelerometer at offsets 8, 10, and 12. 16384 is 1 g. The native issue function called the register read, the native completion unpacked it, the cache matched the unpacked halfwords, and `PER_ROTATE` stored the raw code at the site named in section 4.

| Sensor X, Y, Z | Raw `0xa32c5690` | Index `0xa32c568c` | EXIF |
|---|---:|---:|---:|
| 0, −16384, 0 | 0 | 1 | 1 |
| 16384, 0, 0 | 1 | 2 | 6 |
| 0, 16384, 0 | 2 | 3 | 3 |
| −16384, 0, 0 | 3 | 4 | 8 |
| 0, 0, 16384 | 4 | 1 | 1 |
| 0, 0, −16384 | 5 | 1 | 1 |

Sensor Y negative produces raw 0, the Y-positive code, so the remap negates Y. Sensor X and Z keep their signs. That is the axis order 1, −2, 3. Lens-up and lens-down (raw 4 and 5) do not select a portrait bank: the reported index stays 1 unless it was already 2 or 4.

The three poses used for the banks are the ones that change the reported index:

| Name in `pose.mjs` | Sample | Raw | Index | EXIF |
|---|---|---:|---:|---:|
| `landscape` | (0, −16384, 0) | 0 | 1 | 1 |
| `exif6` | (16384, 0, 0) | 1 | 2 | 6 |
| `exif8` | (−16384, 0, 0) | 3 | 4 | 8 |

## 3. Banks

Orientation Linked is the AF Target Settings page. OK on **AF Target Mode** writes `0x1db1` index 0 = 1. OK on **AF Target Point** writes `0x1dc1` index 0 = 1. A second OK on the same row writes the 0 back. `work/out/bank-s6-000-linked-on.png` shows both rows checked, and the readback is `0x1db1[0] = 1`, `0x1dc1[0] = 1`. Both keys have descriptor count 1, so each has only index 0. Subject Detect was not opened. Its live value in the correction run is `0x90a1` `[1, 1]`, which T3b finding 11 calls Off. The ROM registration payload of `0x90a1` is `00 00`.

The direct target screen opens from shooting with the up key. The stock screen starts on All, which has no movable point. One main-dial detent selects a small target, and the right key moves it (`work/out/bank-s6-006-on-exif6-move.png`). Full readbacks are in `work/out/bank-s6.jsonl`.

`AFON-MENU-RESEARCH.md` §1 names indices 0 and 1 normal and its change index, 2 and 3 CCW and its change index, 4 and 5 CW and its change index, and 6 and 7 movie. The registration count is 8 for `0x99a1` and 6 for `0x5962` (`work/out/scan-xrefs-r1.txt`). Indices 6 and 7 are cells of `0x99a1`. They are not cells of `0x5962`. The direct screen writes the change index of one orientation. Those editor reads are separate from the ten-byte producer in section 4.

With both Orientation Linked rows on:

| Pose | Raw | EXIF | Index written in `0x99a1` and `0x5962` | Name of that index |
|---|---:|---:|---|---|
| `landscape` | 0 | 1 | 1 | normal change |
| `exif8` | 3 | 8 | 3 | CCW change |
| `exif6` | 1 | 6 | 5 | CW change |

The dial wrote `0x99a1` at that index (0 → 1). The arrow wrote `0x5962` at that same index (526 → 529). The getter calls during the move are the same index: `99a1:1` and `5962:1` for landscape, `99a1:3` and `5962:3` for `exif8`, `99a1:5` and `5962:5` for `exif6`. Saved indices 0, 2, and 4 were not written. `0x88b2` has descriptor count 1, and index 0 is the live position; it follows the arrow in every pose. `0x9a41` has count 1 and did not change. `0x99d2` has count 3. `0xe91` has count 12. The ten bytes at `0xa33ca384` were 0 at the bank-s6 snapshots. Section 4 bounds that claim.

With both rows off, the same three poses all write `0x5962` index 1, and the getters read `0x99a1` index 1 and `0x5962` index 1. Indices 3 and 5 keep the values written while the link was on. The pose does not select a bank while Orientation Linked is off.

The stock function at `0x609b3dfb` (`work/out/listings/bank-s3.txt`) is a different reader. It reads `0x1db1` index 0 and, when the value is not 1, stores zeros. When the value is 1 it reads three `0x99a1` indices together: 0, 2, and 4, or 1, 3, and 5 when `0x5991` index 0 is 1 and `0xe1f1` index 0 is not 0. It does not pick one of them from the current pose.

The T5 home builder's bank addresses `0xa031eaa0`, `0xa031eab0`, and `0xa031eac0` do not occur in this stock image (`work/out/scan-record-s5.txt`). The stock image does load the ten-byte address `0xa33ca384` at `0x60902603`. The change index in the table above is the direct editor's result. Section 4 gives the indices the ten-byte producer reads, and the evidence that S1 did not enter that producer.

## 4. Correction

### Which store writes each raw code

`work/out/trace-stores-r1.jsonl` observes all four store sites and the copy entry `0x6006a9c1`. The positive branch stores the even code and skips `0x6007805e`. The opposite sign stores a provisional code at the earlier site, then the final code at `0x6007805e`. The task loops, so a site can be hit more than once per sample. `publishes` records only `0x6007805e`, which is why a positive-axis sample has an empty list.

| Sample | Raw | Final store | What the trace saw |
|---|---:|---|---|
| X positive (16384, 0, 0) | 1 | `0x60078052` | D1 = 1 there. `0x6007805e` did not run. |
| X negative (−16384, 0, 0) | 3 | `0x6007805e` | `0x60078052` stored D1 = 1, then `0x6007805e` stored 3. |
| Y positive (0, 16384, 0) | 2 | `0x6007805e` | `0x60078025` stored D1 = 0, then `0x6007805e` stored 2. |
| Y negative (0, −16384, 0) | 0 | `0x60078025` | D1 = 0 there. `0x6007805e` did not run. |
| Z positive (0, 0, 16384) | 4 | `0x60077ff6` | D1 = 4 there. `0x6007805e` did not run. |
| Z negative (0, 0, −16384) | 5 | `0x6007805e` | `0x60077ff6` stored D1 = 4, then `0x6007805e` stored 5. |

Each row's unpacked halfwords and the cache matched the injected sample. The copy entry ran 7, 8, 7, 9, 8, and 8 times. Completion ran once per `deliver()`. `0xe91` was twelve zeros after every sample. The script process exited 1 because it required `0x90a1` to be 0. The read value was `[1, 1]` at the start and at the end.

### Ten-byte producer

The stock writer is `0x609b3c79` (`work/out/listings/refresh-r1.txt`). It returns at `0x609b3d6d`. It calls the settings getter with these fixed indices and does not read `0x99a1` or `0x5962`:

| Key | Index | Where the value goes |
|---|---:|---|
| `0x9a41` | 0 | record byte +3 |
| `0x1dd1` | 0 | record halfword +4 |
| `0x1dd1` | 1 | record halfword +6 |
| `0x84d1` | 0 | record byte +2, the kind |
| `0x88b2` | 0 | record halfword +0, unless kind is 2, which stores `0x20e` |
| `0x1df1` | 0 | record byte +8, cleared for kind 0, kind 2, or kind 3 with the `0x1dd1` index 0 value equal to 3 |
| `0x1e01` | 0 | record byte +9 |

The store of the position halfword is `0x609b3d3d`, into `0xa33f2ce0`. The T5 home builder is not in this image. The converter `0x609b3ecd` is called only from the triple reader `0x609b3dfb`, at `0x609b3ea5`, `0x609b3eae`, and `0x609b3eb9` (`work/out/scan-xrefs-r1.txt`). That reader still reads three `0x99a1` indices together. It does not read `0xa32c568c`.

The only calls of `0x609b3c79` are `0x609b3b98` and `0x609b3bbc`. The accessor `0x609b3bb2` reads the dirty byte `0xa33f2cea` and calls the writer only when that byte is 1 (`work/out/listings/accessor-r1.txt`). `0x609b3ba9` sets the byte. `0x609b3b9e` clears it.

`work/out/record-r1.jsonl` half-pressed S1 after each of the three poses, with Orientation Linked on and then off. The menu screenshots are `work/out/record-r1-000-linked-on.png` and `work/out/record-r1-010-linked-off.png`. For every combination the entry counts of `0x609b3c79`, `0x609b3d3d`, `0x609b3ecd`, and `0x609b3dfb` stayed 0. The capture record `0xa33f2ce0`, the consumer record `0xa33ca384`, and the dirty byte were 0 before the half-press, while it was held, and after it was released. No stock action in this session built the ten-byte record.

The lines labelled `producer` in `work/out/record-r1-summary.txt` are getter calls during that S1 window. They come from `0x6041a1fb`, the same wrapper as the direct editor. They are not calls inside `0x609b3c79`.

### Direct editor, kept separate

The settings getter call observed during the editor and during the S1 window is `0x6041a1fb`. The listing `work/out/listings/editor-call-r1.txt` shows a four-instruction wrapper at `0x6041a1f9`: extend D0, extend D1, call `0x60063380`, return. D0 and D1 arrive from the wrapper's callers. `work/out/scan-wrapper-r1.txt` lists 52 calls of `0x6041a1f9`. The 24 bytes before those calls do not contain the immediates `0x99a1`, `0x5962`, or the pose address.

`record-r1` asserted each pose, a successful move, and one completion, and ended `ok: true`. Descriptor lengths were used: `0x99a1` 8, `0x5962` 6, `0x9a41` 1, `0x1dd1` 10, `0x90a1` 2. Subject Detect stayed `[1, 1]`.

With both link rows on, the editor's repeated reads and the move were:

| Pose | Reached | `0x99a1` / `0x5962` index read most often | Move of `0x5962` |
|---|---|---|---|
| landscape | raw 0, index 1, EXIF 1 | 1, caller `0x6041a1fb` | index 1, 526 → 529 |
| EXIF 6 | raw 1, index 2, EXIF 6 | 5 | index 5, 526 → 529 |
| EXIF 8 | raw 3, index 4, EXIF 8 | 3 | index 3, 526 → 529 |

With both rows off, all three poses read index 1, and the right key moved `0x5962` index 1 (412 → 415, then 298 → 301, then 184 → 187). Indices 3 and 5 kept the linked-on values. `0x9a41` index 0 stayed 0. The editor also read `0x1dd1` indices 0 and 1 on every pose; those two cells changed to 1, 1 when the dial selected a small target, and they are not a pose-selected index.

### Path from the pose variable

Absolute uses of `0xa32c568c` are `0x60077d32`, `0x60077deb`, `0x60078094`, `0x600780a9`, and `0x600780b3` (`work/out/scan-xrefs-r1.txt`). `0x600780b3` is the store inside `PER_ROTATE`. `0x60077deb` is the load inside the EXIF getter `0x60077de1`. The other three are the task's own tests. The getter has eleven callers, listed in that scan. None of them is `0x6041a1fb`.

`0x6087458a` stores the getter's byte at `0xa33ac4e2`. That cache has 41 readers, all in `0x60874`–`0x60875`, including `0x60875ead`, which compares the byte with 1, 6, 3, and 8 (`work/out/listings/orient-cmp-r1.txt`). `0x61834a42` groups EXIF 1 or 2, 6 or 7, 3 or 4, and 8 or 5. `0x61042d0e` calls the raw getter and branches when the raw code is 1 or 3. None of those is the settings-index selector.

The ten-byte producer does not read the pose variable, so it does not select a pose index of `0x99a1` or `0x5962`. The pose-dependent index is the direct editor's, observed at `0x6041a1fb`: linked on, landscape index 1, EXIF 6 index 5, EXIF 8 index 3; linked off, index 1 for all three. The instruction that computes that D1 from `0xa32c568c` was not in the disassembled readers of the pose word.
