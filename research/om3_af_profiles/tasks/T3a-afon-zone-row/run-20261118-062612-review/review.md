# T3a review (Codex Sol, read-only)

1. **Verdict:** REJECT

   Item 2 is honestly reported BLOCKED after four experiments, and skipping acceptance follows brief §7. However, the mandatory stock page-28 reference measurement remains incomplete. The evidence also does not establish that the proposed code branch is the smallest native solution. Recordkeeping and source-comment corrections remain incomplete.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md` completely, including §7, `audit/previous-review.md`, updated `work/result.md`, the complete manifest, both design documents, the overlay CSV, all new JSONL logs and screenshots, and the audit copies.

   Research checked: `PROJECT-STATE.md` §§1–3 and §6; `AFON-MENU-RESEARCH.md` §1, §6, “Live acceptance regression and third menu row,” and §8’s storage/maps discussion; `HARDWARE-STAGE0-RECORD.md` compression and owned-RAM findings; T2’s capacity table. Also inspected the provider constructor, mapped getter, index getter, list-type, editor-kind and open-path decompilations, relevant probe sources and earlier evidence logs.

   Independently checked input bytes, static ID searches, hashes and screenshots. Did not run Ghidra, OM-Emu or Python, or write files.

3. **Hash verification:** All **117 manifest file entries MATCH**. All **110 recorded output sizes MATCH**. The separate `brief_sha256` field MATCHES.

   Each entry represented below was individually recomputed; version ranges are inclusive.

   - **MATCH — inputs:** `inputs/00_0100_50000020.decoded.bin`; `inputs/02_0106_458c0020.decoded.bin`.
   - **MATCH — sources:** `brief.md`; `TASK.md`; `ref/PROJECT-STATE.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`; `ref/HARDWARE-STAGE0-RECORD.md`.
   - **MATCH — under `work/out/`:** `afon-page-v1.png` through `afon-page-v11.png`; `afon-page-v13.png`; `afon-chooser-v1.png` through `afon-chooser-v11.png`.
   - **MATCH — under `work/out/`:** `afon-cancel-v14.png`; `afon-open-v14.png`; `afon-down-v14.png`; `afon-confirm-v14.png`; `afon-open-v15.png`; `afon-down-v15.png`; `afon-confirm-v15.png`; `afon-kind0-v13.png`; `afon-kind3-v13.png`; `afon-kind5-v13.png`; `afon-kind3-v16.png`; `afon-kind5-v16.png`.
   - **MATCH — under `work/out/`:** `stock-page28-v12.png`; `stock-chooser-v12.png`; `stock-page28-v12c.png`; `stock-chooser-v12c.png`; `stock-chooser-v12g.png`.
   - **MATCH — under `work/out/`:** `discover-v1.jsonl` through `discover-v11.jsonl`; `discover-v10b.jsonl`; `discover-v10c.jsonl`; `discover-kind1.jsonl`; `discover-v13.jsonl` through `discover-v16.jsonl`; `siblings-v10.jsonl`; `siblings-up-v10.jsonl`.
   - **MATCH — under `work/out/`:** `stock-page28-v12.jsonl`; `stock-page28-v12b.jsonl`; `stock-page28-v12c.jsonl`; `stock-page28-v12d.jsonl`; `stock-page28-v12e.jsonl`; `stock-zone-v12f.jsonl`; `stock-zone-v12g.jsonl`.
   - **MATCH — under `work/out/`:** `design.md`; `design-v12.md`; `overlay-changed-bytes.csv`; `static-afon-v1.txt`; `static-afon-v2.txt`.
   - **MATCH:** `work/result.md`.
   - **MATCH — under `work/scripts/`:** `afon_zone_probe_v1.mjs` through `afon_zone_probe_v16.mjs`; `afon_zone_probe_v12b.mjs`; `afon_zone_probe_v12c.mjs`; `afon_zone_probe_v12d.mjs`; `afon_zone_probe_v12e.mjs`; `afon_zone_probe_v12f.mjs`; `afon_zone_probe_v12g.mjs`.
   - **MATCH — under `work/scripts/`:** `build_manifest_v12.py`; `build_overlay_v1.py`; `build_overlay_v2.py`; `make_probe_v2.py` through `make_probe_v6.py`; `make_probe_v12g.py`; `static_afon_v1.py`; `static_afon_v2.py`; `static_page28_v12.py`; `static_page28_v12b.py`; `static_page28_v12c.py`; `static_page28_v12d.py`.

   Additional verification: all **111 harvested-file hashes** in `audit/run-log.json` MATCH. The CRLF-normalized emulator diff MATCHES the pinned SHA-256 `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`. All **27 recorded JSONL final lines** match their corresponding files.

4. **Claim-by-claim:**

   **Corrections 1–5:**

   - **1 — NOT DONE.** The reference attempts use stock input loading without the task overlay or behavior-changing value/type hooks. However, none reaches page 28/group `0x116`. Screenshots show AF Target Mode Settings checkboxes, Orientation Linked checkboxes, and C-AF Area’s two-option editor. Consequently, page 28’s list type, editor kind, OK trace and ten-option chooser remain unmeasured. This is accurately disclosed.
   - **2 — BLOCKED (honestly reported).** v13–v16 are four preserved experiment versions, all ending `ok:false`. Kind 0 draws a bubble containing the current “All” glyph; Down moves the page cursor, and subsequent OK opens a stock priority editor. Re-selected kinds 3 and 5 reach the widget event but show no chooser. No logged `0x3D6F` setter call occurs; the profile remains 0. This supports stopping the attempted approach. It does **not** prove that every native-data/model solution is impossible or that the proposed code branch is minimal.
   - **3 — BLOCKED (honestly reported; correctly skipped).** There are no two qualifying acceptance sessions or equivalent control. Neither stock-row regression with matching keys, complete per-action readbacks, paired page renders, native-save store comparison nor new-session reset was demonstrated. Brief §7 expressly says not to run item 3 when item 2 is blocked.
   - **4 — NOT DONE in full.** The result correctly downgrades PASS claims, records Subject Detection navigation and the v9 exception, fixes the v11 count to 14, and withdraws the overwritten kind-7 screenshot. Unsupported comments remain in preserved sources: for example, v8–v10 still call type 2 page 28’s path, and v4–v11 still describe `0xA70F` as unregistered. The addendum retracts these assertions but does not remove or prove them. Original `design.md` also retains its withdrawn kind-7 claim.
   - **5 — NOT DONE in full.** Manifest integrity and final JSONL lines check out, and `done` is explicitly distinguished from acceptance. However, the four `static_page28_v12*` commands lost their completed console output. Individual correction-command exit codes are recorded as constants in `build_manifest_v12.py`; the supplied audit independently records the overall agent exit, not each subprocess exit. These statuses remain supplied records.

   **Numbered result sections:**

   - **§1 — CONFIRMED / SUPPORTED-NOT-INDEPENDENT.** The blocked status and absent acceptance/store artifacts are confirmed. Isolation, unchanged inputs and unchanged producing workspace are supported by the audit.
   - **§2 — CONFIRMED for the cited baseline.** Whether the producer personally read every cited section cannot be independently established.
   - **§3 — SUPPORTED-NOT-INDEPENDENT, with incomplete records.** New experiment artifacts exist and final-line quotations match. Lost static-command stdout prevents complete command-output verification.
   - **§4 — CONFIRMED.** The cited descriptors, source records, option list and relevant decompiled functions exist.
   - **§5 — CONFIRMED for surviving deliverables.** Listed correction artifacts exist and hash correctly. Historical non-overwriting is supported by the preservation record.

   **Findings in §6:**

   - **6.1 — CONFIRMED within the stated scans.** Independently found zero `u32`, selected mov-immediate and selected cmp-immediate byte-pattern matches for `0x3D6F`. Getter ranges exclude it; the assembly search found no occurrence. Computed uses remain unexcluded.
   - **6.2 — CONFIRMED.** Independently checked all **140 distinct overlay bytes** against the input using `address − 0x60021020`: every old value is `FF`, every proposed value differs, and every address lies in uncompressed section 1, between `0x6031e920` and `0x6031e9b3`. None lies in sections 6 or 7. The first 72 row bytes reproduce the two stock rows. The third row matches page 28’s first row except for its setting ID. The ten option values are `0,2,1,5,3,10,6,7,8,9`, all kind 12.
   - **6.3 — CONFIRMED for rendering; SUPPORTED-NOT-INDEPENDENT for execution.** `afon-page-v13.png` shows three rows and the highlighted AF Target Mode row displaying All. The source supports two native Down inputs.
   - **6.4 — SUPPORTED-NOT-INDEPENDENT.** v6 logs direct hooked read/write/restore `0→2→0` and stock getter result 1. Correctly classified as a hook unit check.
   - **6.5 — SUPPORTED-NOT-INDEPENDENT.** v6 reports provider count 3 and IDs `2154,2155,0x3D6F`.
   - **6.6 — CONFIRMED for saved evidence.** Unforced OK does not display the required chooser.
   - **6.7 — SUPPORTED-NOT-INDEPENDENT.** The stock search logs support type-1 observations, kind 11 at model+`0x58`, and failure to construct page 28. These observations cannot characterize page 28 itself.
   - **6.8 — CONFIRMED for screenshots / SUPPORTED-NOT-INDEPENDENT for traces.** The bubble, cursor movement and unrelated priority editor are visible. v16 matches `0x3D6F` for kinds 3 and 5 without producing a chooser. The kind-7 attribution is properly withdrawn.
   - **6.9 — CONFIRMED for trace contents.** `onlyStock` contains 14 addresses; `onlyZone` is empty. The C-AF Area trace includes those addresses. Empty v11 state-text arrays still limit interpretation of the compared UI states.
   - **6.10 — SUPPORTED-NOT-INDEPENDENT.** Candidate and stock logs show the sampled `[3,3]→[27,39]` change. v14 reads all ten custom-size cells. Their equality across its snapshots does not establish complete regression isolation.
   - **6.11 — OVERSTATED.** The delivered row data and tested forces fail. Without the page-28 model/reference, a suitable cloned model or other native-data configuration remains unexcluded. The branch is a proposed implementation direction, not an established smallest native change.
   - **6.12 — CONFIRMED.** Earlier logs show Subject Detection navigation, the v9 exception, and empty v11 state-text arrays. Terminal success records do not establish acceptance.

   **Remaining numbered sections:**

   - **§7 — Generally CONFIRMED as artifact references.** References for the native-minimality inference do not prove that inference.
   - **§8 — CONFIRMED as a qualified account.** No acceptance pair exists. v14 reads all ten `0x1dd1` cells, but only indices 0–1 of the eight-cell zone and six-cell position arrays. Its full snapshots occur before, after attempted confirmation and after cancellation, not after every action. Pages 25/26 appear in stock search logs; page 28 and paired candidate/control renders are absent. No stores exist for byte-by-byte comparison.
   - **§9 — SUPPORTED-NOT-INDEPENDENT**, except item 11’s native-minimality conclusion is **OVERSTATED**.
   - **§10 — CONFIRMED as disclosed uncertainty.** Page 28’s editor and sentinel registration remain unresolved.
   - **§11 — OVERSTATED as necessity/minimality; SUPPORTED-NOT-INDEPENDENT as a proposal.** A code branch may be appropriate, but its necessity and smallest implementation are unproved.
   - **§12 — CONFIRMED for principal deviations.** It accurately reports missing item 1, blocked item 2 and skipped item 3. Its item-4 account describes retractions, not removal/proof of the preserved source assertions.

5. **Contradictions with established findings:** No contradiction in the overlay placement, row layout, option list or separation from AF Home was found.

   `AFON-MENU-RESEARCH.md` §6 establishes rendering prerequisites and identifies remaining assumptions; it does not prove that a data/model solution cannot host the editor. The categorical conclusion in result §6.11 and `design-v12.md` exceeds that evidence. The result otherwise follows `PROJECT-STATE.md` §2 by separating partial observations from complete proof.

   Preserved source comments and original `design.md` conflict with the correction addendum’s explicit withdrawals.

6. **Alternative explanations** not excluded by the evidence:

   - The missing stock page-28 model may supply necessary configuration or event routing that the forced type/kind experiments omitted.
   - The kind-0 bubble may lack focus or input routing; its failure does not establish that the widget cannot support zone selection.
   - Unrelated cursor movement explains the apparent confirmation and cancellation activity.
   - An empty hooked-setter log excludes calls through that monitored path, not every possible memory write.
   - Equal sampled snapshots do not exclude transient changes or omitted-cell changes.

7. **Scope and safety:** The audit reports zero isolation violations, unchanged inputs and unchanged producing workspace. The emulator diff matches the pre-existing pin after line-ending normalization; no task-specific emulator modification is evidenced.

   Scripts construct an in-memory overlay and runtime writes, not a firmware image, component or SD file. Behavior-changing value/type/kind hooks are labelled `EMULATOR-ONLY`; runtime redirects are described as emulator-only. Pass-through observers are identified separately. The result does not present hooked storage as native implementation. No hardware recommendation was found. This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Treat correction 1 as incomplete: obtain the actual stock page-28 reference under a newly authorized approach, or escalate its absence explicitly as an unmet mandatory deliverable. The four-experiment limit should remain respected.
   2. Replace categorical “cannot host from row data alone” and “smallest native change” statements with a qualified proposal, unless supported by the missing model/reference and routing analysis.
   3. Resolve the surviving source/design contradictions through explicit, file-specific errata while preserving experiment artifacts; do not imply that unsupported comments were removed or proved.
   4. Mark correction 5 incomplete because static stdout was lost and individual exit codes lack independent execution records. Preserve completed output and actual subprocess statuses for future commands.

   Optional improvements: Make `design-v12.md` the clear authoritative design entry point and distinguish widget creation, input focus, selection and commit in future instrumentation.