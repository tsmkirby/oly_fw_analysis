# T3h review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   The face source, ten rendered zone faces, RAM commits and store comparisons are supported. Complete acceptance remains overstated: assertions still omit navigation steps, page 28 was not rendered, and the third row retains the copied half-press glyph rather than the chosen zone label.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the manifest, `faces.md`, `design.md`, overlay CSVs, scripts, JSONL logs, command records and audit files.

   Research checked: T3g’s decision and Sol review; its descriptor/design reports, Z1 implementation and acceptance script; T3a brief §§4/7; `AFON-MENU-RESEARCH.md`, “How a page-27 row opens its editor”; relevant option-reader, binding, constructor and chooser listings/decompilation.

   Independently checked all **578 instruction records across sixteen listing files against the input bytes**, using address − `0x60021020`: zero mismatches. Decoded the face record, option lists, binding records and section directory. Inspected all **33 distinct screenshot contents**; remaining screenshots are hash-identical copies.

   Verification used PowerShell. No Ghidra, OM-Emu or Python was run. No files were written.

3. **Hash verification:** All **278 manifest file entries MATCH**: five inputs, sixteen sources and 257 outputs. All 257 recorded output sizes MATCH. The separate `brief_sha256` MATCHES.

   Each entry represented below was individually recomputed. Braces and ranges denote separate entries.

   - **MATCH — inputs:** `inputs/{00_0100_50000020,02_0106_458c0020}.decoded.bin`.
   - **MATCH — emulator inputs:** `om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.{blk00000000.OE.0100,blk02000000.OE.0101}.bin`.
   - **MATCH — input:** `ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv`.
   - **MATCH — sources:** `brief.md`; `TASK.md`; `review-brief.md`; `templates/result.md`.
   - **MATCH — T3g sources under `ref/tasks/T3g-afon-zone-chooser/`:** `brief.md`; `decision.md`; `run-20261118-112628-review/review.md`; `run-20261118-104935/work/out/design.md`.
   - **MATCH — sources:** `ref/tasks/T3a-afon-zone-row/brief.md`; `ref/analysis/button-af/AFON-MENU-RESEARCH.md`.
   - **MATCH — decompilation sources under `ref/analysis/decompiled-main/functions/`:** `{611c7785,611c782f,611f81aa,611f7f01,6124f11a,6124f4e5}.c`.
   - **MATCH — command records under `work/out/cmd/`:** `01`–`25`, each `.cmd.txt`, `.out`, `.err`, `.exit`; also `26.cmd.txt`.
   - **MATCH — reports under `work/out/`:** `faces.md`; `design.md`; `static-bind-h1.txt`; `static-faces-h{1,2,3}.txt`; `static-free-keys-h1.txt`; `listing-check-h{1,2,3}.txt`; `ghidra-faces-h{1,2,3}.log`.
   - **MATCH — listings under `work/out/`:** `disasm-{611c7fa7,611f7abb,611f7aff,611f7f01,611f7f40,611f81aa,611f820c,611f83aa,611f8437,61204065,7785,782f}-h1.txt`; `disasm-call-{285c9,28faf,29089,29163}-h1.txt`.
   - **MATCH — logs under `work/out/`:** `accept-h1.jsonl`; `exp-faces-h{1,2}.jsonl`; `exp-faces-h{1,2}-hook.jsonl`; `trace-faces-h1.jsonl`; `trace-key-h2.jsonl`; `trace-parent-h3.jsonl`.
   - **MATCH — stores under `work/out/`:** `nvram-accept-h1-{control,c1,c2}.json`.
   - **MATCH — overlays under `work/out/`:** `overlay-changed-bytes.csv`; `overlay-exp-faces-h{1,2}.csv`; `overlay-trace-faces-h1.csv`; `overlay-trace-key-h2.csv`; `overlay-trace-parent-h3.csv`.
   - **MATCH — acceptance screenshots under `work/out/`, for each of `accept-h1-c1` and `accept-h1-c2`:** `-2154-{open,cancel}.png`; `-2155-{open,cancel}.png`; `-page{25,26,27}.png`; `-page27-return.png`; `-zone-{armed,before,cancel,commit-1,commit-2,open,reopen,reopen-2,right}.png`.
   - **MATCH — control screenshots under `work/out/`:** `accept-h1-control-2154-{open,cancel}.png`; `accept-h1-control-2155-{open,cancel}.png`; `accept-h1-control-page{25,26,27}.png`; `accept-h1-control-page27-return.png`.
   - **MATCH — screenshots under `work/out/`, for each of `exp-faces-h1` and `trace-faces-h1`:** `-chooser-open.png`; `-chooser-nav-{0–8}.png`; `-down-{2155,3d6f}.png`.
   - **MATCH — screenshots under `work/out/`:** `exp-faces-h2-chooser-{open,reopen,cancel,confirm}.png`; `exp-faces-h2-chooser-nav-{0–2}.png`; `exp-faces-h2-chooser-confirm-nav-{0–2}.png`; `exp-faces-h2-down-{2155,3d6f}.png`.
   - **MATCH — screenshots under `work/out/`, for each of `trace-key-h2` and `trace-parent-h3`:** `-chooser-open.png`; `-down-{2155,3d6f}.png`.
   - **MATCH:** `work/result.md`.
   - **MATCH — scripts under `work/scripts/`:** `accept_h1.mjs`; `build_overlay_h1.py`; `check_listings_h{1,2,3}.py`; `DisasmFacesH1.java`; `exp_faces_h{1,2}.mjs`; `extract_parent_h1.py`; `keep_exp1_log_h1.py`; `make_session_h{2,3}.py`; `run_logged.mjs`; `session_h{1,2,3}.mjs`; `static_bind_h1.py`; `static_faces_h{1,2,3}.py`; `static_free_keys_h1.py`; `trace_faces_h1.mjs`; `trace_key_h2.mjs`; `trace_parent_h3.mjs`; `write_manifest_h1.py`.

   Additional checks: all **261 harvested-file hashes** in `audit/run-log.json` MATCH; all **77 execution-time helper/resource hash records** MATCH surviving files. Every recorded entry-script and wrapper execution hash MATCHES. No surviving script differs from its recorded execution hash.

   All 26 commands have actual command text, `.out`, `.err` and `.exit` files. Command 17 records exit `3221225477`; every other command records 0. Command 26’s final three files are explicitly excluded from the self-generated manifest but match the harvest audit.

   Manifest completeness is deficient despite matching hashes: imported emulator helpers are identified and hashed in JSONL records rather than listed as manifest inputs. Claimed research inputs such as `all-functions.asm`, T3g’s descriptor report and baseline scripts are also absent.

4. **Claim-by-claim:**

   - **§1 — CONFIRMED.** Task identity and brief version agree.
   - **§2 — CONFIRMED** for the firmware, resource and overlay hashes, and for execution-time helper records. The claimed reading history is **SUPPORTED-NOT-INDEPENDENT**; several named research inputs are omitted from the manifest.
   - **§3 — CONFIRMED** for the retained commands, outputs, exits and versions. The crashed experiment’s JSONL is byte-identical to command 17’s stdout, as the recovery script specifies.
   - **§4 — CONFIRMED** for the cited locations and checked listing bytes. Historical examination is **SUPPORTED-NOT-INDEPENDENT**.
   - **§5 — CONFIRMED** for the surviving deliverables, subject to the disclosed final-command exclusions.

   Findings in §6:

   - **6.1 — CONFIRMED.** `0x611f820e` reads `object+0xdb8`; record+8 supplies the count and record+`0xc` supplies the face list. The call at `0x611f83aa` targets `FUN_611c7785`, returning at `0x611f83b1`.
   - **6.2 — CONFIRMED.** `FUN_611f7f01` searches 96 records at `0x6037bedc`, stride `0x24`, using the copied halfword key. The binding-copy and key-object instructions support the origin at binding+`0x10`.
   - **6.3 — CONFIRMED.** Input bytes give record 76 at `0x6037c98c`, key `0x2d`, count 2, face pointer `0x61575880` and help pointer `0x61576520`. The two face records are kind 4, values 0/1, IDs `0x124f`/`0x127b`.
   - **6.4 — CONFIRMED.** Across the complete Z1 navigation trace, values 0 and 1 match those records; values 2, 3, 5, 10, 6, 7, 8 and 9 have no match. Screenshots show the priority faces and eight blank slots.
   - **6.5 — CONFIRMED.** The row-glyph call uses `0x6158ba1c` from caller `0x6120408f`. The chooser uses the separate face record. The copied row’s alternate pointer remains zero.
   - **6.6 — CONFIRMED.** `FUN_611c7785` accepts image kinds 3, 12, 8 and 7; `FUN_611c782f` accepts image kinds 3 and 12. The chooser uses the former.
   - **6.7 — CONFIRMED.** Editors `0x1e3`/`0x1e4` contain keys `0x2d`/`0x2e`. Independently scanning 931 binding records yielded 122 distinct keys and zero unselected records in the 96-record face table.
   - **6.8 — CONFIRMED** for the retained emulator evidence. Both experiments preserve the Z1 overlay byte tuples and add the same private-record substitution. Its 36 bytes match record 76 with count 10 and face pointer `0x6158ba1c`. The navigation screenshots highlight All, Single, Small, Cross, Mid, Large, C1, C2, C3 and C4 in order. Stock 2154 retains its priority chooser. Dynamic execution itself is **SUPPORTED-NOT-INDEPENDENT**.
   - **6.9 — CONFIRMED.** The short experiment records cancel with no setter and both profile aliases at 0; confirm records setter `(15727,3)` and both aliases at 3. Each acceptance candidate reads back 2 after its first commit and 5 after its second.
   - **6.10 — CONFIRMED within the stated sampled scope.** All sixteen shared-step cell comparisons agree. The new script calls the actual UI getter for IDs 2274–2279; all return 0. Independently comparing every retained candidate cell snapshot also found equality with the corresponding control snapshot, or the control’s final page-27 baseline for candidate-only steps. Decoded M/E stores have zero differing bytes: 262144/196608 bytes. Reopen records show profile 0 and `0x90a1=[1,1]`. Menu-entry `0x1dd1` values agree with the control.
   - **6.11 — CONFIRMED as a bounded inference.** A dedicated face source and a binding selection mechanism belong in the native-data requirements. The hook proves the prototype flow, not a native implementation or placement.

   Remaining numbered sections:

   - **§7 — CONFIRMED** for the cited evidence locations. The opening trace covers the first visible slots; subsequent navigation records supply the remaining four.
   - **§8 — CONFIRMED** for the trace, crash, shorter successful experiment and successful recorded assertions. **OVERSTATED** if “Acceptance … PASS” means complete acceptance: 75 successful assertion records do not cover every step.
   - **§9 — CONFIRMED** for the new face-source result, narrower reader kind sets, cached-alias correction and added getter coverage.
   - **§10 — CONFIRMED.** The nine-Right/Menu crash remains unexplained; stale priority help is visible after selecting other values.
   - **§11 — CONFIRMED as a bounded proposal.** No storage or binding-array placement is established.
   - **§12 — OVERSTATED.** “No other deviation” omits the remaining acceptance and manifest gaps.

   **T3a brief §4 is not met in full.** Exactly what remains missing:

   - Assertions after every navigation step, checking the expected title/highlight and expected readback. Consecutive Down/Right presses and tab-search/menu-exit loops remain unchecked. Commit assertions accept membership/difference instead of the exact expected values 2 and 5.
   - Executable full-cell invariance assertions around candidate-only AF-ON actions; the script’s full-cell comparison loop covers shared steps only. Retained snapshots support equality but do not implement the required fail-fast checks.
   - Page-28 rendering and comparison in candidate/control, or an explicit accepted exception for the established lack of a native route.
   - The chosen zone-row label. Screenshots show the copied half-press glyph on the third row, not “AF Target Mode” or an AF-ON zone label.

5. **Contradictions with established findings** (cite document §), or “none”.

   No contradiction in the central face-source or commit result. It extends T3g decision, “Accepted findings,” and corrects the previously unresolved face source.

   Complete-acceptance wording conflicts with T3h brief §2 item 3 and T3a brief §7 item 3’s per-step assertions. The page-28 and chosen-label gaps concern T3a brief §4. `AFON-MENU-RESEARCH.md`, “How a page-27 row opens its editor,” explains the page-28 routing limitation but does not demonstrate its rendering regression here.

   `design.md`, “Binding record,” incorrectly says `0x60320000` is outside the loaded image. Its input offset is `0x2fefe0`, inside the 33554368-byte decoded image and uncompressed section 1. The 10008 bytes checked there are `0xff`; that does not establish native ownership or placement suitability.

6. **Alternative explanations** not excluded by the evidence.

   - The access violation after nine Rights and Menu may involve emulator behavior, chooser state or the intervention; its cause was not isolated. Shorter successful cancellation does not establish cancellation from C4.
   - Raising the shared count to 10 also makes the help reader scan beyond the original two-record help list. The screenshots establish stale help, not a valid ten-option help implementation.
   - Matching sampled cells and final stores do not exclude transient changes between observations.
   - No native firmware implementation, new-table placement, storage choice or hardware behavior is established.

7. **Scope and safety:** No task-specific writes outside `work/`, new emulator-source changes, firmware image/component/SD-file construction, storage decision or hardware recommendation were found. Isolation reports zero violations. The emulator diff, normalized to LF, matches the initial pin `61cd1327…`.

   Every overlay old byte and offset/address relationship checks. The five experiment/trace CSVs contain 212 rows each; the complete CSV contains 248, adding the 36-byte face record. All lie in uncompressed section 1; none lies in section 6 or 7.

   The two experiments use the same single face-source intervention against Z1: a private record with count/list changed together, selected through the UI-specific pointer hook. Runtime redirects, value hooks, registration, scratch binding and the `0x120b` harness override are labelled EMULATOR-ONLY behaviour. The result does not present them as a completed native implementation.

   This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Mark acceptance as partial in §§8/12 and explicitly list the four outstanding acceptance items above. Preserve the confirmed rendering, commits, getter reads and persistence findings.
   2. Before claiming complete acceptance, use a new script version with exact state/readback assertions after every step and full-cell invariance checks around every AF-ON action; complete or explicitly resolve the label/page-28 requirements. Preserve historical scripts.
   3. Add the imported helpers and omitted research inputs to the manifest, referencing the existing execution-time hash records where available. Distinguish historical hashes from hashes collected later.
   4. Correct `design.md`’s statement that `0x60320000` is outside the loaded image; retain native placement as unresolved.

   Optional improvements: isolate the C4 cancellation crash in a separately named experiment and provide a correctly sized zone-help source before proposing the face record as complete native data.