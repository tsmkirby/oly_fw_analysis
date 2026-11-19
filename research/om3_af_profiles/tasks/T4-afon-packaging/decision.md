# T4 decision (Opus)

**Verdict: ACCEPTED (bounded analysis).** Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261118-140130` | `run-20261118-150331-review` | REJECT: unproven duplicate-record reuse; face patch broke the branch into `0x611f7f44`; incomplete budget; overstated checksum and owned-space claims |
| `run-20261118-151607`, `run-20261118-152508` | none | Infrastructure failures; not counted |
| `run-20261119-044533` (correction, stock OM-Emu watchpoints allowed) | `run-20261119-053008-review` | **ACCEPT**, no required corrections |

## Established (packaging answers, as accepted)

- **Q1 Section 7.**
  - The upper loader (`0x60045ed5`, mode `0x10200`) copies `end − dest` bytes and does not read the
    descriptor's third word. There is no `olycompress` magic in either decoded image, and the stored bytes
    at `0x6124f4e5` are plain instructions.
  - A checksum or decompression step in unexamined flash-reader callees is **not excluded**.
  - This contradicts the reading in `HARDWARE-STAGE0-RECORD.md` Finding 2, that the section is compressed
    and must be re-encoded. That contradiction is open, not settled.
- **Q2 Binding array.**
  - There is no qualifying 10,008-byte home.
  - The second identical `0x216` record at `0x615c6234` (index 151) is a **hypothesis** for reuse. The
    three walkers stop at their first match, and no read occurred on the exercised post-boot paths. It is
    not proven unused: boot, walks 2 and 3, page 28, and the distinct page-25/26 editors were not covered.
- **Q3 Face table.**
  - The table is in the reset-head copy `0x60357000`–`0x60387094`. Its base immediate is at `0x611f7f37`,
    and its count byte is at `0x611f7f48`.
  - **Proposed site:** six bytes `dc 82 6a 12 ff cb` at `0x611f7f3e`, plus a 48-byte helper. The design
    preserves the incoming `bne` → `0x611f7f44`.
  - The only 48-byte hole the helper fits (`0x6031e9c0`) is already used by the archived installer
    placement.
- **Q4 Descriptor.** The table can't grow in place, because `0x606216ec` is a live base. The fit is a
  post-build link into the 128 RAM buckets: the `0x3D6F` bucket is `0x62a84b2c`, and the node takes
  8 bytes. The ordering against the builder and first lookup is **unresolved**.
- **Q5 Routing sites.** Getter `0x6041931e` (5 bytes), setter `0x6041937f` (6 bytes), and default
  writer `0x604193ca` (7 bytes).
- **Q6 Budget.**
  - 368 data bytes plus an 8-byte node gives 376, within the existing 452-byte span. The face helper is
    48 bytes.
  - The installer, getter and setter stubs, node publication, and I-cache synchronization for runtime
    section-7 code patches are **unsized**.
  - 349 of the 368 addresses collide with the archived queue-95 placement. The section-4 tail has 43
    bytes left. Q6 (secondary-CPU and DMA ownership) remains open.

## Consequences

- A native build needs a **layout pass** that reconciles the AF-ON payload with the archived installer.
  The two cannot both use the section-1 owned span and its holes as currently drawn.
- Before any native image exists:
  - prove the reuse hypothesis or find another binding mechanism;
  - establish the install order (a boot-from-reset watch run);
  - close the flash-callee question.

## Evidence

Promoted to `analysis/button-af/readiness/t4-afon-packaging/` (README).
