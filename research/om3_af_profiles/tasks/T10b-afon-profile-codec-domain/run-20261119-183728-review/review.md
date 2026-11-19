# T10b review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   The codec covers the required descriptor, registration, zero-initialized, reset and partly initialized states. Packing fits, pose mapping remains outside the codec, and the evidence hashes match. One slot-description error needs correction; the implementation and test fixtures use the correct slots.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, encoding, codec, tests, domain evidence, all supporting scripts, command records, manifest, seal and audit records.

   Research checked: the T10 decision and both T10 reviews; T10 encoding, codec, tests and ranges; T3l’s initialization design and profile layout; T3m’s profile layout; T8c’s brief, result, reset summary and reader `bank()` implementation.

   Independently compared 60 submitted byte assertions with the main image, checked all 24 zone/custom descriptor rows and their complete value tables, verified six position tables contain exactly `0..1052`, and confirmed UI 1803 has no descriptor. Independently checked the reset/fresh equality and both reset-profile mappings.

   Ran neither Ghidra nor OM-Emu. `node26` is unavailable in this review environment, so the unit suite was not rerun.

3. **Hash verification:** Every entry below was recomputed using PowerShell. All hashes and recorded byte lengths **MATCH**. Array ranges include every entry individually.

   - Manifest `inputs[0–18]`: **19 MATCH**.
   - Manifest `sources[0–5]`: **6 MATCH**.
   - Manifest `outputs[0–11]`: **12 MATCH**.
   - Manifest `commands[0–2]`: all **12 nested file/script references MATCH**.
   - External seal: all **22 nested file/script references MATCH**, including the manifest and commands 01–03.
   - Audit host-harvest `harvested[0–26]`: **27 MATCH**, including the seal and command 04’s completed outputs.
   - Commands 01–04: all **5 execution-time script references MATCH** current sources; all **4 wrapper hashes MATCH**.
   - Normalized OM-Emu diff: **MATCH** to pinned `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

   Manifest SHA-256: `6665fb0e0952d5b700c4252074b8e1153a54d24c7d5280f5261dbf8de7dd9b81`.

   Import inspection found only Node built-ins and the manifested local codec. Consumed file inputs are covered. The manifest, external seal and host harvest together cover the completed records.

4. **Claim-by-claim:**

   Numbered findings in `result.md` §6:

   - **6.1 — CONFIRMED.** All ten registration headers and payloads match the image; their payload values are zero.
   - **6.2 — CONFIRMED.** Descriptor values, position range, absent size descriptor and cited setter bytes match the image. The no-clamp interpretation also agrees with the established T10 review.
   - **6.3 — CONFIRMED for the brief’s specified domain union.** Zero is added to every custom domain. Registration and reset values fit; zero/initialized mixtures remain representable independently at every array index. Size retains its full byte.
   - **6.4 — CONFIRMED.** Independently recomputed payload: `12 + 8 + 33 + 20 + 20 + 12 + 16 = 121` bits. Marker 16, version 8, padding 7 and CRC 16 give **168 bits = 21 bytes**, leaving **40 spare bits** and **zero shortfall**. No T10 field was removed.
   - **6.5 — CONFIRMED.** Zone and position use `landscape`, `exif6`, `exif8`; the codec contains no pose-to-settings-index mapping. Cell-index keys are rejected by source logic. The documented reader mapping agrees with T8c’s `bank()`.
   - **6.6 — CONFIRMED for source coverage; SUPPORTED-NOT-INDEPENDENT for execution.** Tests include all-zero custom fields, each single zero, mixed arrays, C1/C2 partial states, both reset views, every field’s endpoints, every enumerated value and exhaustive out-of-domain cell-value rejection. Command 02 records exit 0, 3,713 round-trips and 198,628 rejections.
   - **6.7 — CONFIRMED for source coverage; SUPPORTED-NOT-INDEPENDENT for execution.** Tests cover zero/FF/stock-like records, all 208 bit positions on two profiles, illegal zone/dimension/step codes, position 1053 and bad versions with recomputed CRCs. Recorded execution passed.

   Remaining numbered sections:

   - **§1 — CONFIRMED** task/version and scope; historical reading claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§2 — CONFIRMED** input identities and research artifacts; tool versions are **SUPPORTED-NOT-INDEPENDENT** from recorded metadata.
   - **§3 — CONFIRMED** command contents, recorded outcomes and packing arithmetic; historical execution is **SUPPORTED-NOT-INDEPENDENT**.
   - **§4 — CONFIRMED** cited addresses and accepted-record references.
   - **§5 — CONFIRMED** delivered files and evidence coverage when the external seal and harvest are included.
   - **§7 — CONFIRMED** evidence references, subject to the execution qualification above.
   - **§8 — SUPPORTED-NOT-INDEPENDENT** recorded PASS outcomes.
   - **§9 — CONFIRMED** zero-domain correction, recomputed capacity and removal of bank mapping from the codec.
   - **§10 — CONFIRMED** disclosed scope and uncertainties. Arbitrary setter values outside the established domain union remain excluded.
   - **§11 — CONFIRMED** next-action scope and unchanged storage choice; integrated persistence remains future work.
   - **§12 — CONFIRMED** no substantive implementation deviation, subject to the documentation correction below.

5. **Contradictions with established findings**:

   `encoding-v2.md`, **“Pose-keyed layout,”** incorrectly describes indices 0/1 as the current “size and step” and then assigns C1/C2 to 2/3 and 4/5 collectively. T3l’s **“Custom-size slots”** and T3m’s **“Custom sizes from a zeroed mirror”** establish distinct layouts:

   - C1 dimensions: `0x1dd1[2,3]`; C1 steps: `0x1de1[0,1]`.
   - C2 dimensions: `0x1dd1[4,5]`; C2 steps: `0x1de1[2,3]`.

   The codec preserves all slots, and its C1/C2 test fixtures agree with those established findings. No other contradiction found.

6. **Alternative explanations** not excluded by the evidence.

   - Recorded test success was not independently reproduced because `node26` is unavailable.
   - Pure codec tests cannot establish persistence, reader integration or reset/fallback behavior in the emulator.
   - The established domain union does not prove that every possible caller of the unclamped setter produces only those values; this limitation is disclosed.

7. **Scope and safety:** No emulator import/process, storage-location change, field removal, image construction or hardware recommendation was found. Submitted script writes target `work/`. The isolation audit reports zero violations, and the OM-Emu diff matches the pre-existing pin.

   Execution-time script and wrapper hashes match current files; no post-execution source change is evidenced. This review performed no writes.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Correct `encoding-v2.md`’s custom-slot paragraph to distinguish dimension slots from step slots, using the C1/C2 mappings in §5 above. Refresh the affected evidence hashes and seal without editing executed scripts.

   Optional improvements: report that 208 bit positions were tested on each of two profiles, giving 416 single-bit corruption assertions.