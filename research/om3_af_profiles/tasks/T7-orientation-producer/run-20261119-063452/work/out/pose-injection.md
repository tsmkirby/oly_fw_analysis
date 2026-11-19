# EMULATOR-ONLY pose injection

Module: `work/scripts/pose.mjs`. It imports nothing. A runner imports it and passes an open lab.

```javascript
import { attachPose, POSES, disasm, LABEL } from './pose.mjs';

const pose = attachPose(lab);
pose.setPose('landscape'); // or 'exif6' or 'exif8', or pose.setSample(x, y, z)
pose.deliver();            // one register read and the native completion
idle(400);                 // the running ACC_MAIN and PER_ROTATE tasks publish
const now = pose.read();  // { raw, index, exif, unpacked, cache, enable, state }
```

`attachPose(lab)` is called once, after `open_session`. It allows the stock task entries `0x6006a660`, `0x6006a720`, `0x60077e0a`, and `0x6007d7bb`, calls the stock accelerometer init `0x6006a436` and the stock `PER_ROTATE` init `0x60077d18`, and installs the hooks below. The lab boot does not call those inits.

`LABEL` is `'EMULATOR-ONLY'`. Every hook name starts with it.

## Where the sample enters

The pose bytes are written only in the hook on the register read `0x6006f28e`. When the register is `0x20`, the hook writes 14 bytes to the buffer in A0 and returns. The native sample-issue function `0x6006a8ab` is what calls that read: `deliver()` calls it with frame `[0, 0]`, and the call at `0x6006a8c2` hits the hook. The trace records that return address (`work/out/trace-pose-s4.jsonl`, step `async-read`, `from` `0x6006a8c7`).

`deliver()` then calls the native completion `0x6006a8ca` with frame `[0, 0]`. The stock driver would call that completion when the transfer finishes. That completion call lives in the unmodelled bus driver, so the lab calls the completion after the read returns. The completion body runs natively: the halfwords at `0x6298d7ce`, `0x6298d7d0`, and `0x6298d7d2` match the injected sample. The caller of that entry is the lab trampoline, not a firmware address.

The bytes are little-endian int16 at offsets 8, 10, and 12. 16384 is 1 g. Temperature and gyro bytes stay 0.

After `deliver()`, the caller idles so `ACC_MAIN` copies the sample and `PER_ROTATE` stores the orientation. `pose.read()` then returns the halfword at `0xa32c5690` (`raw`), the word at `0xa32c568c` (`index`), and the value of the native EXIF getter `0x60077de1`.

## The three poses

Measured in `work/out/trace-pose-s4.jsonl` and used by the bank session:

| `setPose` | Sensor X, Y, Z | Raw | Index | EXIF | `0x99a1` / `0x5962` index written while Orientation Linked is on |
|---|---|---:|---:|---:|---|
| `landscape` | 0, −16384, 0 | 0 | 1 | 1 | 1 |
| `exif6` | 16384, 0, 0 | 1 | 2 | 6 | 5 |
| `exif8` | −16384, 0, 0 | 3 | 4 | 8 | 3 |

`setSample(x, y, z)` sets an arbitrary sample. `POSES` holds the three rows above, including the `raw`, `index`, and `exif` fields measured for each.

## Other stand-ins

These do not supply a pose. They exist because the emulator has no I2C bus and no data-ready pin, and without them the native probe and the native completion do not return.

| Hook | Address | Behaviour |
|---|---|---|
| Pin setup skipped | call at `0x6006a43d` | `skip_call` |
| Bus open | `0x6006f1bf` | returns 0 |
| Bus close | `0x6006f39a` | returns 0 |
| Register write | `0x6006f3bb` | returns 0 |
| Synchronous read | `0x6006f3a5` | register `0x0F` writes `0x70` to the buffer so the native probe accepts the part; any other read writes zeros |

The native probe, the native completion, the native copy, and the native `PER_ROTATE` task still run. `pose.counts` counts `async-read`, `sync-read`, `publish`, and the bus stand-ins. `pose.publishes` records the raw code in D0 at the store `0x6007805e`, up to 24 values.

NVRAM is the caller's choice. These sessions pass no NVRAM store, and `OM_EMU_NVRAM` is `off`.
