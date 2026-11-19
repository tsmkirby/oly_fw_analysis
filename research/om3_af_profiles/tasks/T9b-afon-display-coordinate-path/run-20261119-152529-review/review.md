# T9b review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Useful partial findings are supported, and stopping without guessing a display hook complies with the brief. Two reported measurements are wrong, and the submitted final seal remains incomplete.

2. **Baseline checked:** Complete `TASK.md`, `review-brief.md`, `brief.md`, T9 brief including §5, T9 decision and both specified T9 reviews; `work/result.md`, `work/out/display.md`, manifests, runners, listings, JSONL traces, screenshots, command records and audit files.

   Research checked: FEATURE-SPEC’s display requirements and interaction policy; T3j brief §0; T5 and T6 briefs §§0 and 5; T5 session helper; T6 README including coordinator corrections, design and overlay CSV.

   Review remained read-only. Neither Ghidra nor OM-Emu was run.

3. **Hash verification:** Recomputed SHA-256 and recorded byte lengths with PowerShell. These zero-based ranges cover every submitted manifest entry:

   - `evidence-manifest.json`: `brief_sha256`, `inputs[0–1]`, `sources[0–7]`, `outputs[0–209]`, `modules[0–140]`, `execution_hashes[0–16]` including every `later_sha256`, and all four file records plus script records in `commands[0–26]` — **MATCH**.
   - `manifest-seal-t9b.json`: `files[0–6]` — **MATCH**.
   - `manifest-final-t9b.json`: `files[0–5]` — **MATCH**.
   - Audit `harvested[0–223]` — **MATCH**, resolving paths under `work/`.
   - All 30 execution-time script records and all 30 wrapper hashes — **MATCH** current files. Ghidra script basenames resolve under `work/scripts/`; no post-execution script edit was detected.
   - Audit input hashes and brief digest — **MATCH**. The baseline diff digest matches its UTF-8/LF text; the saved audit copy adds BOM/CRLF serialization.

   Hash agreement does not establish completeness. The submitted chain omits `manifest-final-t9b.json` and all four command-30 records. The coordinator audit independently preserves them.

4. **Claim-by-claim:** Claims refer to `result.md` §6.

   - **Claim 1 — SUPPORTED-NOT-INDEPENDENT.** Retained probes and readbacks support the direct halfword store, dirty-byte store, unentered queued/callback sites and unchanged `0x5962` and Subject Detect. Associated instruction bytes independently match the image.
   - **Claim 2 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for timing.** Independent PNG decoding finds 444 grey pixels in each frame: rest union `(417,265) 66×70`, moved union `(356,198) 65×71`. The runner and records support movement after idle rather than inside the setter.
   - **Claim 3 — WRONG in the version-6 count.** Version 5 records two cell reads returning 412. Version 6’s count of 90 includes **all** executions of shared instruction `0x60063a5e`; its address-filtered hits contain only two reads with `A0=0x629526c0`. Both runs use a 500 ms idle. The reported getter key and return address are supported.
   - **Claim 4 — CONFIRMED.** Image bytes confirm the unsigned-halfword load, the two listed direct call sites and the getter thunk’s call and return. The shared return does not identify the thunk’s caller.
   - **Claim 5 — SUPPORTED-NOT-INDEPENDENT within the observed window.** Records contain six spill/reload executions and the reported argument pairs and object pointer. The filtered rectangle observer records no matching frame bars. This excludes those sampled executions as the moved corner geometry; it does not identify the geometry producer.
   - **Claim 6 — CONFIRMED for static data flow.** Listings show the stack spill/reload and caller’s stack arguments, prepared through `0x610f5713`. Independently compared all 26 listings: **7,402 represented bytes, zero mismatches**.
   - **Claim 7 — SUPPORTED-NOT-INDEPENDENT.** Recorded stores support the already-set flag, its idle clear/set cycle and absence of watched dirty-byte reads. These observations do not establish the causal corner-frame invalidation path.
   - **Claim 8 — CONFIRMED for pixels; SUPPORTED-NOT-INDEPENDENT for runtime state.** Seeded logs record owner 2 and target `11 02 03 00 01 00 01 00 00 00`. Independent inspection confirms the unchanged frame. Getter and flag-writer activity occurs during the press-plus-idle window; a causal connection from the press is not isolated.
   - **Claim 9 — WRONG in the target bytes.** JSON records decimal `[14,2,2,0,1,0,1,0,0,0]`, which is hexadecimal **`0e 02 02 00 01 00 01 00 00 00`**, position **526**. The claimed `14 02…`, position 532 in `display.md`, is incorrect. Owner 2 and unchanged frame are supported. Both AF-ON PNG hashes match; independent comparison finds zero differences from rest in the scanned viewfinder band.
   - **Claim 10 — CONFIRMED.** Independently reconstructed the image section table and switch-derived bounds. All 3,262 T6 rows match stock bytes and addresses: section 1 = 1,308; section 2 = 95; section 4 = 1,856; section 7 = 3. Only `0x610bf5e3–0x610bf5e5` occupy protected sections.
   - **Claim 11 — SUPPORTED-NOT-INDEPENDENT as a bounded inference.** The intervention supports a causal effect of the live cell on frame position, and idle getter reads are recorded. The link from those reads to pixel-field production remains unproved, as acknowledged. No display hook was installed.

   Other result assertions: six emulator processes are accounted for, including both failures; E147 setup and model assertions are present. The 141-module inventory covers the inspected import closure. Section 12’s “none” deviation statement overlooks the sealing and cited-input omissions. No 12-edge display validation exists; withholding the change follows the explicit no-guessing rule.

5. **Contradictions with established findings:**

   - Claim 9 and `display.md`’s unseeded position contradict T6 README, **“Accepted”** and design **“What the AF-ON record must read instead”**: the uninitialized fallback is `0e 02 02…`, position 526. The retained T9b log agrees with T6.
   - Final records fall short of T9b brief §2 item 5 and inherited T6 brief §5 item 5. Both cited T9 reviews are also absent from the manifest’s source inventory.
   - No other contradiction with accepted functional findings was found.

6. **Alternative explanations** not excluded by the evidence:

   - Getter reads and flag writes may be periodic work rather than the causal frame-update chain.
   - Cached geometry or an engine-side buffer may produce the moved corners outside the monitored stores.
   - AF-ON’s unchanged frame may reflect an unchanged source, stale geometry or missing frame-specific invalidation.
   - The changed whole-screen AF-ON hash can arise outside the scanned frame region.

7. **Scope and safety:** No reviewer writes were made. Isolation records report zero violations and zero workspace changes. Existing OM-Emu modifications match the supplied baseline.

   Six emulator processes ran; version 6 opens three sessions within its single process. Behaviour hooks and setup writes are labelled EMULATOR-ONLY. No new display patch, installable image, storage decision, hardware recommendation or hardware-dependency claim was found. Subject Detect zero is checked in completed observation runs.

8. **Required corrections** and **optional improvements**.

   Required corrections:

   1. Correct claim 9 and the display table: unseeded target `0e 02 02 00 01 00 01 00 00 00`, position 526.
   2. Correct claim 3: 90 shared-instruction hits, two address-filtered cell hits. Also remove `display.md`’s unsupported attribution of all 1,998 getter entries to the thunk.
   3. Add the omitted cited T9 reviews to the source inventory and acknowledge the record deviations.
   4. Finalize externally after the last logged wrapper finishes, covering all command-30 records and `manifest-final-t9b.json`. Preserve executed scripts and retained evidence; issue corrections as uniquely named addenda.

   Optional improvements: In a subsequently authorized investigation, trace the thunk’s caller through the coordinate writer and establish frame-specific invalidation. Only then implement and validate the display change with full-frame, target and owner expectations after every required edge.