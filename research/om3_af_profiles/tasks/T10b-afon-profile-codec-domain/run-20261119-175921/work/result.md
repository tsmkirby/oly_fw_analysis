# T10b result

The custom dimension and step domains now include zero. Zone and position are stored by pose. The packed record is 168 bits, 21 of the 26 bytes, with 40 spare bits. The shortfall is 0.

1. **Task identifier and brief version used:** T10b-afon-profile-codec-domain, brief dated 2026-11-19. Section 0 was followed: the T10 decision, Sol's T10 review `run-20261119-173646-review`, T10's encoding, codec, unit test and `ranges-t10c.json`, the T3l initialization design, and the T3m profile layout. No emulator process was started. Q7 option (a) is unchanged.

2. **Research baseline used:** T10 decision (`CLOSED-PARTIAL`). Sol's review of `run-20261119-163743`. T10 `work/out/encoding.md`, `work/scripts/codec.mjs`, `work/scripts/codec_test_t10c.mjs`, and `work/out/ranges-t10c.json`. T3l `run-20261119-083228/work/out/design.md` section Initialization, and that run's `profile-layout.md`. T3m `readiness/t3m-afon-editor-state-leak/out/profile-layout.md`. T8c `q2b-summary.json`, `result.md`, and `hook_t8c2.mjs` `bank()`. Main image `inputs/00_0100_50000020.decoded.bin` SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, length 33554368. Resource `inputs/02_0106_458c0020.decoded.bin` SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`, length 143523776. Node v26.12.1. Python 3.12.7. OM-Emu was not imported, so there is no OM-Emu patch hash for this task.

3. **Work performed:**
   - Command 01: `node26 work/scripts/run_logged.mjs 01 node26 work/scripts/domain_t10b.mjs`. Re-read the descriptor tables, the registration records, and the setter store path. Exit 0. Payload 121, pad 7, used 168, spare 40, shortfall 0.
   - Command 02: `node26 work/scripts/run_logged.mjs 02 node26 work/scripts/codec_v2.test.mjs work/scripts/codec_v2.mjs`. Exit 0. `ok` true, 3713 round-trips, 198628 rejections, 208 bit flips.
   - Command 03: `node26 work/scripts/run_logged.mjs 03 node26 work/scripts/build_manifest_t10b.mjs`. Builds this manifest. Its stdout, stderr and exit are in the seal.
   - Command 04: `node26 work/scripts/run_logged.mjs 04 node26 work/scripts/seal_t10b.mjs`. External seal. Its stdout, stderr and exit are written by the wrapper after the seal process exits.

4. **Files examined:** Main image at base `0x60021020`. Registration records `0x6011ebdc`, `0x6011ec34`, `0x600e575c`, `0x600e4f4c`, `0x600e5fe8`, `0x60117870`, `0x6011e7a8`, `0x600e57c4`, `0x600e4f5c`, `0x600e4f68`. Descriptor table `0x6061912c`, stride 20, count `0x6b0`. Value tables `0x60617864`, `0x60617870`, `0x6061787a`, `0x60617886`, `0x60617890`, `0x6061789c`, `0x606178a1`, `0x60617946`. UI map `0x6062555c`. Setter bytes `0x60063532` through `0x6006354e`. Accepted records: T3l design.md lines 46–54, T8c `q2b-summary.json`, T8c `hook_t8c2.mjs` lines 151–158.

5. **Files created:** Under `work/` only. The manifest lists every one. The codec is `work/scripts/codec_v2.mjs`. The tests are `work/scripts/codec_v2.test.mjs`. The domain listing is `work/out/domain-t10b.json`. The encoding is `work/out/encoding-v2.md`. The wrapper is `work/scripts/run_logged.mjs`.

6. **Findings:**

   1. STATIC. Every listed registration payload is zero, including `0x1dd1` at `0x600e4f4c` (10 bytes) and `0x1de1` at `0x600e4f5c` (8 bytes).
   2. DATA. The pose zone descriptors are the ten values `0, 1, 2, 3, 5, 10, 6, 7, 8, 9`. Vertical dimensions are `1, 3, 5, 7, 9, 11, 15, 19, 23, 27`. Horizontal dimensions add `33, 39`. Vertical steps are `1, 2, 3, 4, 5`. Horizontal steps are `1, 2, 3, 4, 5, 6, 7, 8`. Position is the integers `0..1052`. UI 1803 has no descriptor. The setter stores the byte at `0x6006354e` and the halfword at `0x60063534` after an equality check.
   3. STATIC. The custom domain is the descriptor list with 0 placed first. Zone, position and size gain no new value: 0 and the T8c numbers are already inside. Horizontal step grows from 3 bits to 4 because nine values do not fit in three bits. The other custom fields stay at their T10 widths.
   4. INFERRED. Payload `4*3 + 8 + 11*3 + 4*5 + 4*5 + 3*4 + 4*4 = 121`. Marker 16, version 8, pad 7 and CRC 16 make 168 bits, 21 bytes. Spare `208 - 168 = 40` bits. The record fits. The shortfall is 0. The T10 field set is unchanged.
   5. STATIC. The codec stores landscape, then EXIF 6, then EXIF 8. A profile whose zone keys are the cell indices 1, 5 and 3 is rejected. T8c's saved-index map (linked 0 / 4 / 2, unlinked 0) stays in the reader.
   6. STATIC. T3l's all-zero custom profile, each single zero slot, the C1 and C1-and-C2 partial arrays, and both views of the T8c reset image round-trip. Encode throws `RangeError` for each out-of-domain cell value that the test enumerates. It does not clamp.
   7. STATIC. Version is 2. A zero record, an `0xFF` record, thirteen `0x0C80` halfwords, each of the 208 single-bit flips, an illegal zone code, an illegal dimension code, an illegal step code, position 1053, and version bytes 0, 1 and 255 decode as null.

7. **Evidence for each claim:** (1) `work/out/domain-t10b.json` `registration`, header `d11d0a00` plus ten `00` bytes at `0x600e4f4c`, and `e11d0800` plus eight `00` bytes at `0x600e4f5c`. Command 01 exit 0. (2) The same file, `checks` and `descriptors`. Zone table bytes `00010203050a06070809` at `0x60617864`. Setter `f056` at `0x6006354e` and `f076` at `0x60063534`. (3)(4) `domain` and `packing` in that file: `step_h.bits` 4, `payload_bits` 121, `spare_bits` 40, `fits` true, `shortfall_bits` 0. (5) `work/scripts/codec_v2.mjs` pose list, and the test assertion that the codec source does not contain `0x5962`, `0x99a1`, `0x5b82` or `BANKS`. Reader map: `hook_t8c2.mjs` lines 151–158, copied into `domain-t10b.json` `reader_index_not_in_codec`. (6)(7) `work/out/cmd/02.out`: `ok` true, `round_trips` 3713, `rejected` 198628, `bit_flips` 208, `version` 2. T3l design.md lines 46–54. T8c `q2b-summary.json` `reset` equals `fresh`, and `reset_outside_domain` is empty for every field.

8. **Tests and outcomes:** Command 01 PASS. Command 02 PASS. No emulator process was started.

9. **New versus previously established:** (1) confirms T3l `profile-layout.md`: every mirror key's ROM payload is zeros. (2) confirms T10 `ranges-t10c.json` and the T10 finding that the setter does not clamp and that size keeps 8 bits. (3) is new: it supplies the zero T10's tables omitted, which Sol's review finding 6.1 required. (4) confirms the T10 decision that the packed record fits in 26 bytes, with a recomputed total; it contradicts T10 encoding.md's "nothing is dropped" for the zero custom states. (5) is new relative to T10's banks 1, 5 and 3, and it confirms the T10 decision that the codec stays independent of bank. The index map confirms T8c Q1. (6) confirms T3l's zero and partial custom states and T8c Q2's reset image as encodable profiles. (7) confirms the T10 corruption rule on the new layout.

10. **Remaining uncertainties.** The direct screen's own compare that chooses UI 1338 rather than 1648 was not listed again. T8c already measured the indices, and this codec does not choose them. The domains are the union named in the brief. The setter can still store a byte that none of those sources contains; encode rejects that byte. `0x1df1` remains outside the record, as it did in T10. Forty spare bits are left if a later task adds a field.

11. **Recommended next actions.** The integrated acceptance after T8c can store and reload with this codec and with T8c's reader map. The storage key stays the unnamed cells of `0x5b82`. No hardware recommendation follows from this task.

12. **Deviations from the brief.** None.
