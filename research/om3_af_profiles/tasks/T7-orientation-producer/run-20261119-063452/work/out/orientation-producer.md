# Stock orientation producer and the AF target banks

Stock E147 image only. The pose bytes are injected at the accelerometer's register read. Listings were checked against `inputs/00_0100_50000020.decoded.bin` at file offset = address − `0x60021020` (`work/out/listing-bytes-s4.txt`, 0 mismatches).

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

The raw orientation is the halfword at `0xa32c5690`. The task writes it at `0x6007805e` after comparing the corrected axes (`work/out/listings/rotate-task-s3.txt`):

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

`0xe91` is not this variable. The only immediate load of `0xe91` in the stock image is the debug dump at `0x608fd5a0` (`work/out/scan-keys-s1.txt`). Every pose in the sessions below left `0xe91` indices 0–7 at 0.

## 2. What each injected sample became

`work/out/trace-pose-s4.jsonl`. One sample is 14 bytes, little-endian, with the accelerometer at offsets 8, 10, and 12. 16384 is 1 g. The native issue function called the register read, the native completion unpacked it, the cache matched the unpacked halfwords, and `PER_ROTATE` stored the raw code.

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

Orientation Linked is the AF Target Settings page. OK on **AF Target Mode** writes `0x1db1` index 0 = 1. OK on **AF Target Point** writes `0x1dc1` index 0 = 1. A second OK on the same row writes the 0 back. `work/out/bank-s6-000-linked-on.png` shows both rows checked, and the readback is `0x1db1[0] = 1`, `0x1dc1[0] = 1`. `0x1db1` index 1 followed the point row. Subject Detect was not opened.

The direct target screen opens from shooting with the up key. The stock screen starts on All, which has no movable point. One main-dial detent selects a small target, and the right key moves it (`work/out/bank-s6-006-on-exif6-move.png`). Full readbacks are in `work/out/bank-s6.jsonl`.

`AFON-MENU-RESEARCH.md` §1 names the eight `0x99a1` / `0x5962` indices: 0 and 1 normal and its change index, 2 and 3 CCW and its change index, 4 and 5 CW and its change index, 6 and 7 movie. The direct screen writes the change index of one orientation.

With both Orientation Linked rows on:

| Pose | Raw | EXIF | Index written in `0x99a1` and `0x5962` | Name of that index |
|---|---:|---:|---|---|
| `landscape` | 0 | 1 | 1 | normal change |
| `exif8` | 3 | 8 | 3 | CCW change |
| `exif6` | 1 | 6 | 5 | CW change |

The dial wrote `0x99a1` at that index (0 → 1). The arrow wrote `0x5962` at that same index (526 → 529). The getter calls during the move are the same index: `99a1:1` and `5962:1` for landscape, `99a1:3` and `5962:3` for `exif8`, `99a1:5` and `5962:5` for `exif6`. Saved indices 0, 2, and 4 were not written. `0x88b2` index 0 is the live position and follows the arrow in every pose. `0x9a41`, `0x99d2`, `0xdfa1`, and `0xe91` did not change. The ten bytes at `0xa33ca384` stayed 0.

With both rows off, the same three poses all write `0x5962` index 1, and the getters read `0x99a1` index 1 and `0x5962` index 1. Indices 3 and 5 keep the values written while the link was on. The pose does not select a bank while Orientation Linked is off.

The stock function at `0x609b3dfb` (`work/out/listings/bank-s3.txt`) is a different reader. It reads `0x1db1` index 0 and, when the value is not 1, stores zeros. When the value is 1 it reads three `0x99a1` indices together: 0, 2, and 4, or 1, 3, and 5 when `0x5991` index 0 is 1 and `0xe1f1` index 0 is not 0. It does not pick one of them from the current pose.

The T5 home builder's bank addresses `0xa031eaa0`, `0xa031eab0`, and `0xa031eac0` do not occur in this stock image (`work/out/scan-record-s5.txt`). The stock image does load the ten-byte address `0xa33ca384` at `0x60902603`. That record was not written by the direct screen in this session. The per-pose index the live target reads and writes is the change index in the table above.
