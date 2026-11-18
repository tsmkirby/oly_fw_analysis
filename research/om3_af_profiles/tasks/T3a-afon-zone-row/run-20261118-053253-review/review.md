# T3a review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The rendering prototype is supported, but brief §4 is incomplete. The zone chooser never opens; selection, confirmation, cancellation, persistence isolation, and shared-viewer regression are unproved. Neither required acceptance repeat completed.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, the evidence manifest, design, complete overlay CSV, all JSONL logs, and all audit files.

   Research checked: `PROJECT-STATE.md` §§1–3 and §6; `AFON-MENU-RESEARCH.md` §1 including T1, §6, §8’s storage/maps discussion and “Live acceptance regression and third menu row”; `HARDWARE-STAGE0-RECORD.md` owned RAM analysis and compression findings; T1’s result, row layouts and probe; T2’s capacity table. Also inspected relevant getter, index-getter, provider-constructor and viewer decompilations, and searched `all-functions.asm`.

   Independently inspected input bytes and screenshots. Did not run Ghidra or OM-Emu or write files.

3. **Hash verification:** All **70 manifest file entries MATCH**; all 63 recorded output sizes also match. The separate `brief_sha256` field MATCHES.

   Each filename below was recomputed; grouped filenames all have status **MATCH**:

   - Inputs: `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - Sources: `brief.md`; `TASK.md`; `ref/PROJECT-STATE.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`; `ref/HARDWARE-STAGE0-RECORD.md`.
   - Under `work/out/`: `afon-chooser-v1.png`, `afon-chooser-v2.png`, `afon-chooser-v3.png`, `afon-chooser-v4.png`, `afon-chooser-v5.png`, `afon-chooser-v6.png`, `afon-chooser-v7.png`, `afon-chooser-v8.png`, `afon-chooser-v9.png`, `afon-chooser-v10.png`, `afon-chooser-v11.png`.
   - Under `work/out/`: `afon-page-v1.png`, `afon-page-v2.png`, `afon-page-v3.png`, `afon-page-v4.png`, `afon-page-v5.png`, `afon-page-v6.png`, `afon-page-v7.png`, `afon-page-v8.png`, `afon-page-v9.png`, `afon-page-v10.png`, `afon-page-v11.png`.
   - Under `work/out/`: `discover-v1.jsonl`, `discover-v2.jsonl`, `discover-v3.jsonl`, `discover-v4.jsonl`, `discover-v5.jsonl`, `discover-v6.jsonl`, `discover-v7.jsonl`, `discover-v8.jsonl`, `discover-v9.jsonl`, `discover-v10.jsonl`, `discover-v10b.jsonl`, `discover-v10c.jsonl`, `discover-kind1.jsonl`, `discover-v11.jsonl`, `siblings-v10.jsonl`, `siblings-up-v10.jsonl`.
   - Under `work/out/`: `design.md`; `overlay-changed-bytes.csv`; `static-afon-v1.txt`; `static-afon-v2.txt`.
   - `work/result.md`.
   - Under `work/scripts/`: `afon_zone_probe_v1.mjs`, `afon_zone_probe_v2.mjs`, `afon_zone_probe_v3.mjs`, `afon_zone_probe_v4.mjs`, `afon_zone_probe_v5.mjs`, `afon_zone_probe_v6.mjs`, `afon_zone_probe_v7.mjs`, `afon_zone_probe_v8.mjs`, `afon_zone_probe_v9.mjs`, `afon_zone_probe_v10.mjs`, `afon_zone_probe_v11.mjs`.
   - Under `work/scripts/`: `build_overlay_v1.py`; `build_overlay_v2.py`; `make_probe_v2.py`; `make_probe_v3.py`; `make_probe_v4.py`; `make_probe_v5.py`; `make_probe_v6.py`; `static_afon_v1.py`; `static_afon_v2.py`.

   Additional audit verification: every harvested-file hash in `audit/run-log.json` matches. `audit/om-emu.diff` matches the pinned local-diff SHA-256 `61cd1327…7702` after CRLF-to-LF normalization, consistent with the established CR-stripped pin. Its raw CRLF hash differs; this is a line-ending difference.

4. **Claim-by-claim:**

   - **Result §1 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT.** Task and brief identity match. Isolation audits report zero violations and unchanged inputs/workspace. Scripts leave NVRAM configuration untouched. Historical environment inheritance is supported by the supplied record, rather than independently observed.
   - **§2 — CONFIRMED.** The cited research supports the stated baseline. Whether the producing agent actually read every section cannot be established retrospectively.
   - **§3 — OVERSTATED.** Evidence exists for the listed investigations, but not uniformly successful completion or preserved reproducibility. `discover-v9.jsonl` ends with `TypeError: t.includes is not a function`. The surviving v10 script differs from earlier v10 runs.
   - **§4 — CONFIRMED.** Relevant descriptors, option bytes and decompiled functions exist at the stated addresses.
   - **§5 — CONFIRMED, with a preservation qualification.** Listed deliverables exist and hash correctly. Some script and screenshot versions were overwritten, so the surviving files do not preserve every experiment.

   Findings in §6:

   - **6.1 — CONFIRMED within the stated static search.** `0x3D6F` is outside all four indexed UI-ID maps, including their highest range ending at `0x3C5F`, and outside the additional getter ranges. Independently repeated the reported u32 and mov/cmp byte-pattern searches: no matches. The assembly search also found no `0x3d6f`. This establishes the reported static absence, not absence of every possible computed use.
   - **6.2 — CONFIRMED.** The third row starts at `0x6031e978`, uses label `0x0DD2`, and has primary and alternate pointers `0x6158ba1c`, both with count 10. Input bytes independently decode to option values **0, 2, 1, 5, 3, 10, 6, 7, 8, 9**, all kind 12. These are page 28’s records.
   - **6.3 — CONFIRMED for the saved rendering; SUPPORTED-NOT-INDEPENDENT for execution.** `afon-chooser-v6.png` visibly shows three rows and highlights “AF Target Mode,” with the value “All.” The script and logs support reaching it through two native Down inputs. The chosen stock wording is documented, although it does not explicitly say AF-ON.
   - **6.4 — SUPPORTED-NOT-INDEPENDENT.** Logs show profile values `0 → 2 → 0` and stock getter 2154 returning 1. The source implements this through labelled JavaScript hooks and simulator memory reads/writes. This is a hooked value-path check, not native implementation or a UI commit.
   - **6.5 — SUPPORTED-NOT-INDEPENDENT.** The v6 provider readback reports count 3 and bytes `6a 08 6b 08 6f 3d`. No `provider-extended` event occurs there, supporting construction from the redirected source.
   - **6.6 — CONFIRMED.** The cited logs and v6 screenshot show the AF Button page remaining visible rather than a ten-option chooser.
   - **6.7 — CONFIRMED statically / SUPPORTED-NOT-INDEPENDENT dynamically.** The decompiled viewer checks for type 2; the recorded type is 1. Its non-type-2 path returns when the editor pointer is zero.
   - **6.8 — PARTLY SUPPORTED-NOT-INDEPENDENT; partly UNSUPPORTED.** Logs support matching `0x3D6F`, rejection of kind 11, and failure to obtain the intended chooser. The v9 screenshot confirms an unrelated slider. The surviving `afon-chooser-v10.png` does **not** show the claimed audio-level slider: later runs overwrote it. The surviving v10 source forces kind 1, so it cannot reproduce the earlier kind-7 experiment as listed.
   - **6.9 — SUPPORTED-NOT-INDEPENDENT, with correction.** v11 records differing function-entry sets, but `onlyStock` contains **14**, not 15, addresses. Its `stock-ok`, `back`, and `chooser` text arrays are empty, limiting independent confirmation of the UI states being compared.
   - **6.10 — SUPPORTED-NOT-INDEPENDENT.** Candidate and control logs both show sampled `0x1dd1[0:1]` changing from `[3,3]` to `[27,39]` between initial inspection and page entry. This supports a shared navigation/startup effect; it does not locate the exact writing operation.
   - **6.11 — CONFIRMED as a limited inference.** The hooks implement direct byte access while the editor remains missing. The proposed native insertion points remain design work.

   Remaining numbered sections:

   - **§7 — OVERSTATED in places.** Most evidence references are accurate. The kind-7 screenshot reference and v11 address count need correction.
   - **§8 — Mixed; acceptance assessment follows.**
     - Three rows and chosen label: **CONFIRMED** in saved evidence.
     - Same ten options: **CONFIRMED statically**, **not demonstrated as an opened UI list**.
     - Confirm/store and cancel: **UNSUPPORTED as acceptance tests**. No zone chooser was entered.
     - Stock rows unchanged: **OVERSTATED** if read as full regression. Unchanged `[1,1]` snapshots during highlighting/no-op OK are supported; both stock rows were not exercised against an equivalent control sequence.
     - Half-press/AF Home unchanged: **OVERSTATED** as complete coverage. Native readbacks support unchanged sampled cells after possible actions. The probe reads only `0x1dd1` indices 0 and 1, omitting indices 2–9. Snapshots also do not exclude transient writes.
     - Save/new-session byte-identical stores and RAM default reset: **UNSUPPORTED; not run**, as disclosed.
     - Pages 25/26/28 unchanged: **UNSUPPORTED; not run**, as disclosed.
     - Overlay safety: **CONFIRMED**. All **140 distinct bytes** have correct old values and component offsets using `address − 0x60021020`; every old byte is `FF`. All addresses lie inside uncompressed section 1. The first 72 relocated row bytes exactly equal the two stock rows. Section descriptors independently confirm compression flags only for sections 6 and 7.
     - Hook labelling: **CONFIRMED** for every explicit behaviour-changing `l.hook` registration. Runtime redirects and provider-extension code are also identified as `EMULATOR-ONLY`.
   - **§9 — Generally SUPPORTED-NOT-INDEPENDENT.** The distinction between established rendering and new investigation is reasonable, subject to the qualifications above.
   - **§10 — CONFIRMED as disclosed uncertainty.** Page 28’s live editor was not measured, and sentinel `0xA70F` was not proved unregistered.
   - **§11 — SUPPORTED-NOT-INDEPENDENT as proposed next work**, not completed evidence.
   - **§12 — CONFIRMED.** It accurately acknowledges the principal missing acceptance work and emulator-only storage routing.

   **Completion of both repeats:** No qualifying pair exists. v2 and v3 both reach terminal `done`, but neither opens the zone chooser; their later “chooser-again”/“confirmed” steps operate on **Subject Detection**. v4 repeats that problem. v9 terminates at an exception. v10 variants report `opened:true` using `String(t)` on text-record objects, which cannot validate the expected widget. Other terminal `done/ok:true` records indicate script termination, not completion of brief §4.

5. **Contradictions with established findings:** No contradiction was found in the core row layout, option list, ownership placement, or separation from AF Home.

   Some source comments exceed established findings: v8–v10 describe type 2 as page 28’s path despite that path remaining unmeasured; several probes call sentinel `0xA70F` “unregistered” without proof. These conflict with the report’s own stated uncertainty. `AFON-MENU-RESEARCH.md` §6 and its live third-row findings establish rendering prerequisites, not a working editor. `PROJECT-STATE.md` §2 expressly excludes partial demonstrations from complete software proof.

6. **Alternative explanations** not excluded by the evidence:

   - Wrong UI state or cursor position explains later apparent confirmation activity: supplied logs show Subject Detection and priority editors being entered.
   - Forced type/kind hooks can create unrelated widgets without demonstrating correct zone-editor routing.
   - Direct hooked setter success does not establish native commit, cancellation, bounds handling, or persistence isolation.
   - Equal sampled before/after values do not exclude omitted-cell changes or transient writes.
   - Matching hashes establish artifact integrity, but do not repair overwritten experiment provenance.

7. **Scope and safety:** No writes outside the allowed producing workspace are indicated. The isolation audit reports zero violations. The emulator diff is the pre-existing pinned diff after line-ending normalization; no task-specific emulator modification is evidenced.

   Scripts construct an in-memory overlay and runtime redirects, not a firmware image, component or SD file. Compressed-section changes are runtime writes, explicitly distinguished from overlay bytes. Behaviour-changing hooks are labelled `EMULATOR-ONLY`, and the result does not present them as native implementation. No hardware recommendation was found. This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Complete the actual ten-option editor, selection/confirmation and cancellation path; demonstrate profile readback through the requested actions.
   2. Complete two fresh acceptance sessions and an equivalent stock control, including both stock rows, all requested cells, pages 25/26/28, native save, store-byte comparison and new-session default reset.
   3. Downgrade current regression PASS statements to their sampled/no-op scope. Record the unintended Subject Detection navigation and v9 exception explicitly.
   4. Preserve separate scripts and screenshots for every experiment. Correct the v10 screenshot attribution, restore reproducible kind-7 evidence if retained, and fix widget-state validation before reporting completion.
   5. Correct the v11 count to 14 and remove unsupported source assertions about page 28’s type and sentinel registration.

   Optional improvements: Include cursor/state assertions, explicit expected readbacks, unique run identifiers, and command exit statuses so a terminal `done` cannot be mistaken for successful acceptance.