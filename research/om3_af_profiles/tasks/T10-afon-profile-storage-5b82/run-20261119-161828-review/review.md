# T10 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The static checks substantially support the targeted instruction classifications. However, the capacity calculation establishes the size of an uncompressed representation, not that a lossless encoding cannot fit. The reader audit also omits unresolved sites explicitly retained by the previous review. Stopping without dropping fields was prudent; the claimed definitive capacity failure is not established.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the manifest, seal, encoding document, reader audit, both output JSON files, all supplied scripts, command records, and `audit/`.

   Research checked: both T2 and both T2b reviews; their decisions and correction verdicts; `AFON-MENU-RESEARCH.md` §8; `PROJECT-STATE.md`’s Q7 decision; T3m’s profile layout; T3l’s initialization/custom-size design; T4b’s boot-order README; T3j, T5 and T6 inherited rules; T6’s design and decision; T8’s amended save criterion.

   Independently compared the 47 submitted byte checks and 1,472 additional listing instruction occurrences against the main image: zero mismatches. Also recomputed the table-B scan, five data windows, exact-pointer searches, diagnostic strings, and four-record byte-pattern run. Ran neither Ghidra nor OM-Emu.

3. **Hash verification:** All **55 manifest file entries MATCH**, including byte lengths. Each entry represented below was recomputed using PowerShell; filename ranges include every indicated file.

   - Root/template: `brief.md`, `TASK.md`, `templates/result.md` — **MATCH**.
   - `inputs/`: `00_0100_50000020.decoded.bin`, `02_0106_458c0020.decoded.bin` — **MATCH**.
   - `ref/`: `PROJECT-STATE.md`, `analysis/button-af/AFON-MENU-RESEARCH.md` — **MATCH**.
   - `ref/analysis/button-af/readiness/`: `t6-afon-target-size-position/out/design.md`, `t3m-afon-editor-state-leak/out/profile-layout.md`, `t4b-afon-boot-order/README.md` — **MATCH**.
   - `ref/tasks/`: T2 and T2b `decision.md`; T2b `run-20261118-062119-review/review.md`; T2 `run-20261117-220544/work/out/verdict-v2.md`; T2b `run-20261118-053855/work/out/verdict-v4.md` — **MATCH**.
   - `ref/tasks/`: T3j, T5 and T6 `brief.md`; T6 and T8 `decision.md`; T3l `run-20261119-083228/work/out/design.md` — **MATCH**.
   - `work/scripts/`: `audit_5b82_t10.py`, `audit_5b82_t10b.py`, `build_manifest_t10.mjs`, `hash_image_t10.py`, `make_audit_t10b.py`, `run_logged.mjs`, `scan_run_t10.py`, `seal_t10.mjs` — **MATCH**.
   - `work/result.md` — **MATCH**.
   - `work/out/`: `audit-5b82-t10b.json`, `encoding.md`, `reader-audit.md`, `run-60539e07-t10.json` — **MATCH**.
   - `work/out/cmd/`: `01`–`05`, each with `.cmd.txt`, `.out`, `.err`, `.exit`; `06.cmd.txt` — **MATCH**.

   All repeated command-entry hashes and external-seal entries also **MATCH**, including the manifest itself, command 06’s completed outputs, and `07.cmd.txt`. All **43 host-harvest entries MATCH**, covering the seal and command 07’s completed outputs. The normalized OM-Emu diff matches the pinned `61cd1327…877702`. Execution-time script hashes match current files; the preserved failed script and its generated replacement are consistent.

   Hash agreement does not establish manifest completeness: the consumed `all-functions.asm` and cited T2 review are omitted.

4. **Claim-by-claim:**

   Findings in `result.md` §6:

   - **6.1 — CONFIRMED within the established table bounds.** All aligned halfwords in 61 records at `0x60242324`, stride `0x9c`, ending exclusively at `0x60244850`, exclude `0x5b82`. The +0x50 index is `(stack_u16 + record_dword_64) & 0xffff`; +0x52 uses `record_dword_68 & 0xffff`. Neither expression itself confines indices to named cells, but the absent key supports these calls’ SAFE classification.
   - **6.2 — CONFIRMED.** The immediate at `0x616ddb03` reaches the diagnostic line-number argument. The strings and `mov D2,(0xc,sp)` at `0x616a1d41` match the image.
   - **6.3 — CONFIRMED.** Both `0x5b8` immediates form object pointers. The A0 → A1 → A3 → copy-call trace matches the listing and bytes.
   - **6.4 — CONFIRMED narrowly.** The five windows and absence of exact little-endian pointers are reproducible. The four-record run is a measured byte pattern, not an identified consumer. Retaining these five as UNRESOLVED is appropriate.
   - **6.5 — SUPPORTED-NOT-INDEPENDENT for carried mechanisms; OVERSTATED as a complete inventory.** Registration/map bytes match. Prior findings support named-cell setters, zero-default writes and whole-bank copying. The audit does not establish an exhaustive normal-operation reader list. Bulk load/save reads unnamed bytes and is correctly flagged REACHES-UNNAMED.
   - **6.6 — CONFIRMED for raw-width arithmetic; OVERSTATED as an encoding impossibility.** The selected fields occupy 224 bits at cell width, versus 208 available bits. No legal-domain bounds, dependencies or lossless packing analysis establish that 224 bits are necessary. `encoding.md` explicitly leaves narrower legal ranges unknown. Its marker/checksum sizes are design choices, not demonstrated minimums.
   - **6.7 — CONFIRMED that implementation stopped; UNSUPPORTED that every smaller representation necessarily drops a field.** Lossless packing can reduce representation size without removing fields. Whether it suffices here remains unproved.

   Remaining numbered result sections:

   - **§1 — CONFIRMED** task/version selection and static-only scope. Applying the capacity guard conclusively is **UNSUPPORTED**.
   - **§2 — CONFIRMED** input identity and cited artifacts; historical reading claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** recorded failure/success outputs and absence of delivered emulator experiments; execution history is **SUPPORTED-NOT-INDEPENDENT**.
   - **§4 — CONFIRMED** cited functions and artifacts exist; historical examination is **SUPPORTED-NOT-INDEPENDENT**.
   - **§5 — CONFIRMED** delivered work files. **OVERSTATED** if intended to claim complete evidence coverage: consumed/cited research inputs are missing from the manifest.
   - **§7 — CONFIRMED** command-output references; they do not prove minimum encoding size.
   - **§8 — CONFIRMED** all six tests are NOT RUN. Save/reopen, store difference, reset, C1 recall, corruption and art-filter behavior are unverified. No stores exist to decode. Metadata commands’ `ok:true` is not the required acceptance-run result.
   - **§9.1–§9.5 — CONFIRMED** narrowly for table exclusion, corrected immediate traces, retained unidentified data and carried T2 findings. These do not establish a five-site-only residual.
   - **§9.6 — OVERSTATED:** confirms raw-width arithmetic, not a minimum packed size.
   - **§9.7 — CONFIRMED:** persistence work was not started.
   - **§10 — CONFIRMED** that legal ranges and Workspace backup behavior remain unknown. **OVERSTATED** in limiting ownership uncertainties to five sites.
   - **§11 — OVERSTATED** as the necessary next decision. Establishing legal ranges and lossless packing remains an alternative to dropping fields or changing storage.
   - **§12 — CONFIRMED** missing deliverables and preserved failed version. **UNSUPPORTED** that the guard fully justifies stopping; “No other deviation” overlooks incomplete reader accounting and manifest inputs.

5. **Contradictions with established findings** (cite document §), or “none”.

   - T2b’s final Sol review, **§4 claim 12 and §8 correction 2**, explicitly leaves singleton-address exclusions at `0x615fbdb0`, `0x615b9d55` and `0x615b9d91` insufficiently established. T10’s statement that Sol-confirmed exclusions are carried forward silently omits these unresolved cases.
   - T2’s final Sol review, **§4 claim 7**, confirms arithmetic for a specified uncompressed layout. It does not establish that every lossless encoding of the larger profile exceeds capacity.
   - No contradiction was found in the corrected diagnostic/object-pointer explanations, named indices or zero-default bytes.

6. **Alternative explanations** not excluded by the evidence.

   - Legal ranges or relationships between profile fields may permit lossless packing within 26 bytes; the available evidence proves neither feasibility nor impossibility.
   - Unidentified data, including the omitted singleton sites, may be accessed through base-plus-offset calculations without exact pointers to the sampled addresses.
   - A reader may consume unnamed-cell marker values without modifying them.
   - The apparent four-record run may be encoded data unrelated to settings records.

7. **Scope and safety:** No prohibited writes, new flash writer, image construction or hardware recommendation was found. Script output paths remain under `work/`. The isolation audit reports zero violations; the OM-Emu diff is the pre-existing pinned diff.

   No overlay or persistence hooks were produced, so section-placement and stock setter/getter/load-order requirements have no implementation to verify. No `0x1e71[0]` readback occurred in T10; this is accurately disclosed alongside zero emulator experiments. Workspace backup is explicitly out of scope and unknown.

   This review performed no writes.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Separate the confirmed 28-byte raw layout from the unproved minimum encoded size. Establish legal ranges and lossless packing bounds, or report capacity as unresolved. Do not drop fields.
   2. Restore the three omitted singleton sites to the unresolved inventory unless concrete consumer/bounds evidence excludes them. Qualify the normal-operation inventory accordingly.
   3. Add consumed and cited research inputs, including `all-functions.asm` and the T2 review, to the manifest; refresh the external seal.
   4. Revise completion/deviation wording consistently. If capacity cannot fit is established, retain the guarded stop and explicit NOT RUN outcomes. Otherwise, the codec, persistence hooks and six acceptance tests remain required.

   Optional improvements: report index bounds explicitly as `0..65535`, and label the four-record observation as a byte-pattern run rather than an identified record structure.