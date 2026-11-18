# T2 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The evidence establishes persistence under the exercised emulator operations. It does not establish ownership. Correct classification: **0x5b82 UNRESOLVED**, with static enumeration, C1 save/recall, and reset coverage gaps.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `work/result.md`, `work/evidence-manifest.json`, `work/out/verdict.md`, `templates/review.md`, and every audit file. Read `AFON-MENU-RESEARCH.md` §8, including storage access, candidate cells, PEN-F precedent, initialization/fallback, and append experiments; also `PROJECT-STATE.md` §§1–3 and relevant T1 methodology. Inspected the use table, listings, scan output, probe scripts, JSONL records, and additional native access/reset routines.

3. **Hash verification:** All **71 manifest entries** recomputed: **MATCH** throughout.

   Each entry below is MATCH; grouped prefixes apply to every listed filename.

   - `inputs/`: `00_0100_50000020.decoded.bin`, `02_0106_458c0020.decoded.bin`. These also match the two hashes required by the brief.
   - Root/template sources: `brief.md`, `TASK.md`, `templates/result.md`.
   - `ref/analysis/decompiled-main/functions/`: `600619a9.c`, `60062d28.c`, `60062d93.c`, `60062fe5.c`, `60062a60.c`, `60063dc0.c`, `60063380.c`, `60063431.c`, `60419446.c`, `60419696.c`.
   - `work/out/`: `dynamic-5b82-control.jsonl`, `dynamic-5b82-mark-a.jsonl`, `dynamic-5b82-mark-b.jsonl`, `dynamic-5b82-mark-c.jsonl`, `dynamic-5b82-mark-d.jsonl`, `dynamic-5b82-mark-e.jsonl`, `dynamic-5b82-mark-f.jsonl`, `dynamic-5b82-mark-g.jsonl`, `dynamic-5b82-mark-h.jsonl`, `dynamic-5b82-mark-i.jsonl`, `dynamic-5b82-mark-j.jsonl`, `dynamic-5b82-mark-k.jsonl`, `dynamic-5b82-mark-l.jsonl`, `dynamic-5b82-mark-m.jsonl`, `dynamic-5b82-mark-n.jsonl`.
   - `work/out/`: `nvram-5b82-control.json`, `nvram-5b82-mark-a.json`, `nvram-5b82-mark-b.json`, `nvram-5b82-mark-c.json`, `nvram-5b82-mark-d.json`, `nvram-5b82-mark-e.json`, `nvram-5b82-mark-f.json`, `nvram-5b82-mark-g.json`, `nvram-5b82-mark-h.json`, `nvram-5b82-mark-i.json`, `nvram-5b82-mark-j.json`, `nvram-5b82-mark-k.json`, `nvram-5b82-mark-l.json`, `nvram-5b82-mark-m.json`, `nvram-5b82-mark-n.json`.
   - `work/out/`: `listings-5b82.txt`, `scan-keys-v2.txt`, `uses-5b82.tsv`, `verdict.md`; also `work/result.md`.
   - `work/scripts/`: `build_manifest_v1.py`, `build_manifest_v2.py`, `dump_strings_v1.py`, `extract_listings_v1.py`, `find_menu_strings_v1.py`, `scan_keys_v1.py`, `scan_keys_v2.py`, `summarize_dyn_v1.py`.
   - `work/scripts/`: `own_5b82_v1.mjs`, `own_5b82_v2.mjs`, `own_5b82_v3.mjs`, `own_5b82_v4.mjs`, `own_5b82_v5.mjs`, `own_5b82_v6.mjs`, `own_5b82_v7.mjs`, `own_5b82_v8.mjs`, `own_5b82_v9.mjs`, `own_5b82_v10.mjs`, `own_5b82_v11.mjs`, `own_5b82_v12.mjs`, `own_5b82_v13.mjs`.

   All 57 harvested-file hashes in `audit/run-log.json`, including the manifest itself, also match. The OM-Emu diff matches pinned SHA-256 `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702` after CRLF-to-LF normalization.

4. **Claim-by-claim:**

   Findings in `result.md` §6:

   - **Claim 1 — OVERSTATED.** Independently confirmed zero exact `0x5b82` tokens in `all-functions.asm`. Raw searches covered `82 5b`, `82 5b 00 00`, `b8 05`, and `b8 05 00 00`: respectively 53, 1, 378, and 40 hits. The script’s split-immediate search covers particular local constructions, not every possible computed key.
     
     The 49 raw `82 5b` hits absent from the use table are:
     
     `60045589, 6016abc3, 601b1bd4, 601bc4cb, 601e50b3, 6020217a, 60300cad, 6030a9e5, 6030ac1c, 6030ac50, 6030ac80, 6030acb1, 60496c13, 60539e07, 6057f43c, 60590a44, 605952fc, 605ae1e7, 607c69f4, 607c8e19, 607cb986, 607e2ef9, 60855691, 60856974, 60856a4c, 6085ba42, 6085ba5a, 6085ba6d, 6085c33c, 6085daef, 6085f547, 60860006, 60860565, 6086cbd8, 6087a8e0, 609aa986, 60b4d6c8, 60bd0ad6, 60c575a2, 60e29138, 6108f9ba, 611aeb7c, 615b9d55, 615b9d91, 615fbdb0, 6180c41b, 6180c42d, 618309c4, 6187d443`.
     
     These are candidates, not established key uses. For example, `6108f9ba` lies inside a call displacement; `60bd0ad6` is part of address `0x60e75b82`.
     
     The independent slot search also found 97 positive `0x5b8` instruction occurrences absent from the table. The 29 immediate `mov` sites are:
     
     `6007f39b, 604df354, 608f8614, 60cc0c5a, 60cebcac, 60d68d49, 60d68d56, 61102019, 6118bf47, 6118c058, 6118c10e, 61195d1d, 61195d7f, 61195dc1, 61195e4e, 61195ec2, 61195ee7, 61195f36, 61195fc3, 611fcdcc, 61206ef6, 612072f3, 6128c262, 6128c9c0, 612c37f0, 616cd897, 616cf1d0, 616ddb03, 616e369a`.
     
     Several are clearly structure offsets or other UI IDs. Their existence does not prove a missed writer, but a slot-search count without disposition is not a completeness proof.

   - **Claim 2 — CONFIRMED.** Raw registration bytes at `0x600e5874` encode key `0x5b82`, count 16, and 32 zero default bytes. Width is two bytes under the established packing rule.

   - **Claim 3 — CONFIRMED.** Raw map entries at `0x606274e0`, `0x60627518`, and `0x60627524` contain indices 5, 12, and 13.

   - **Claim 4 — OVERSTATED.** The key/index resolvers use stored map fields. That does not constrain every subsequent operation to the stored index. Missing from `uses-5b82.tsv` is:
     
     `0x604193ca → 0x60419446 → 0x60063962 → 0x6006398b`.
     
     This route resolves the key but does **not** fetch the named index. `0x6006398b` operates on a whole-key byte count derived from registry count and width. Its source lookup, `0x60063a68 → 0x60061453`, searches the bank’s descriptor/default stream. Caller reachability for the target IDs remains unproved. Also omitted is the ordinary mapped setter `0x6041937f`, which explicitly calls both resolvers and the native setter.

   - **Claim 5 — CONFIRMED for the listed paths; UNSUPPORTED as an exhaustive restriction.** The defaults walker copies all 16 zero halfwords; the documented bank-7 boot branch follows a failed load. Valid-area copying is supported. These findings do not exclude the omitted per-key route above.

   - **Claim 6 — CONFIRMED for the listed debug path; UNSUPPORTED as exclusion of other writers.** The size helper calls the defaults walker. Absence of direct callers to a handler with registered function pointers does not establish that the handler is unreachable.

   - **Claim 7 — CONFIRMED.** Both full marked runs log all 13 native setter calls and matching immediate getter readbacks. Startup named cells are 3200; unnamed cells are zero.

   - **Claim 8 — CONFIRMED for recorded operations; OVERSTATED as coverage.** Mark-b and mark-n have identical step sequences and cell snapshots. Their 97 post-marker snapshots retain the markers. Control named cells match; its unnamed cells remain zero. New sessions load stores M and E and restore the expected arrays.
     
     However, selecting C1 on the mode dial is not a demonstrated C1 assignment/save/recall cycle. Attempts in other runs encounter boundaries; mark-k’s “Save Settings” opens the Hold/Reset behavior option, not proof of saving a marked snapshot. The target cursor IDs 2017, 2031, and 2034 are rejected as scalar settings and never edited through that loop. Complete coverage of their menu pages is not demonstrated.

   - **Claim 9 — CONFIRMED with qualification.** Custom Mode and C1 action-list text are logged; reset confirmation is not established. The blanket statement that markers never changed during exploratory runs needs qualification: several probes deliberately overwrite them with `0x1111` at `scribbled`, then fail to complete recall. Those changes are probe-induced, not evidence of stock disturbance.

   - **Claim 10 — UNSUPPORTED.** The static enumeration is incomplete. In addition to the omitted mapped routes, `0x60063684` copies caller-supplied data into indexed spans; its classification as harmless “bulk carry” requires tracing callers `0x60063567` and `0x600630a3`, their indices, lengths, and sources. The evidence does not establish that all relevant reset, ORIGINALLY, bracketing, remote/Wi-Fi, My Menu, backup, and custom-mode paths are safe.

   Independent byte verification found **2,009 matching instruction-line occurrences and zero mismatches** in the supplied listings, including windows. Another **431 instruction lines** covering omitted routes matched raw bytes using address minus `0x60021020`. Correct bytes support the listings’ authenticity, not completeness.

   Remaining numbered result sections:

   - **§1 — CONFIRMED** scope compliance by audit.
   - **§2 — CONFIRMED** input hashes; baseline-reading history is **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — SUPPORTED-NOT-INDEPENDENT** command exit history. The manifest lacks completed output logs for several commands.
   - **§4 — CONFIRMED** cited bytes/functions; historical file-reading claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§5 — CONFIRMED** delivered files and manifest coverage, excluding normal self-hashing of the manifest.
   - **§7 — OVERSTATED:** cited evidence does not support the exhaustive ownership inference.
   - **§8 — OVERSTATED:** persistence passes are supported; C1 save/recall and complete target-page coverage are missing. Reset BOUNDARY items are correctly not labeled PASS.
   - **§9 — OVERSTATED:** the “ownable range” is not established.
   - **§10 — OVERSTATED:** uncertainties omit the static and C1 gaps.
   - **§11 — WRONG as a sufficient profile layout:** six `0x4831CCVV` dwords carry six independent value bytes. Reserving one for version leaves **five profile bytes**, not the approximately 12-byte profile required by the brief. No alternative packing proof is supplied.
   - **§12 — WRONG:** “No other deviation” and stopping because ownership was proved are unsupported.

5. **Contradictions with established findings:** The OWNABLE verdict conflicts with the proof standard in `AFON-MENU-RESEARCH.md` §8, “Not yet proven”: every relevant reader/writer must be shown safe, including resets and ORIGINALLY copies. The PEN-F precedent establishes its own reviewed cells and lifecycle behavior; it does not establish OM-3 ownership. No contradiction was found in the reported registration bytes, named indices, or valid-save persistence observations.

6. **Alternative explanations** not excluded by the evidence:

   - A key-wide default/reset operation can overwrite unnamed cells despite receiving a named UI ID.
   - C1 dial changes may leave live settings intact because no marked custom-mode snapshot was assigned or recalled.
   - Untested target pages, transaction paths, or table-driven operations may reach unnamed cells.
   - Marker persistence does not detect readers that consume marker values without changing them.

7. **Scope and safety:** No prohibited changes found. Isolation audit reports zero violations; host audit reports unchanged workspace and inputs. The normalized OM-Emu diff matches the pre-existing pinned diff. Probe output and NVRAM paths are under `work/`; explicit `fileNvram(...)` supplies persistence storage. No image construction or hardware recommendations were seen. This review performed no writes and ran neither Ghidra nor OM-Emu.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Change `0x5b82` to **UNRESOLVED** and withdraw the instruction to use these cells for T3 until ownership is proved.
   2. Complete the use table and bounded listings for omitted mapped setters, whole-key default/copy routines, and indexed transaction callers. Establish caller reachability, bounds, and source data; classify unresolved paths accordingly.
   3. Report C1 save/recall and unexercised target pages as coverage gaps. Demonstrate completed operations in repeated fresh marked sessions with matching controls, or retain explicit boundaries.
   4. Qualify exploratory-run claims to distinguish deliberate `0x1111` writes from firmware disturbances. Preserve the existing reset BOUNDARY classifications.
   5. Replace the insufficient tagged layout with a capacity-accounted encoding for the required profile, version, and validity information.
   6. Supply missing completed command-output logs and update the manifest and result consistently.

   Optional improvements: log operation-completion evidence alongside array snapshots, and include explicit dispositions for raw key/slot candidates so byte-pattern hits cannot be mistaken for verified uses.