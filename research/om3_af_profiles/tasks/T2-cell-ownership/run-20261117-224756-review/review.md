# T2 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The corrected **UNRESOLVED** classification is justified. Ownership remains unproved, and corrections 2 and 6 are incomplete. The cursor-page coverage explanation also overstates what the logs show. Do not release these cells to T3.

2. **Baseline checked:** Read `TASK.md` and `review-brief.md` completely, then `brief.md`, including §11; `audit/previous-review.md`; `templates/review.md`; `work/result.md`; the manifest; both verdicts and use tables; candidate dispositions; new listings, probe scripts, field-width evidence, and dynamic records.

   Research checked: `PROJECT-STATE.md` §§1–3; `AFON-MENU-RESEARCH.md` §1’s AF-target fields and §8’s storage model, candidate cells, ownership requirements, PEN-F precedent, and bank-7 initialization/fallback; T1’s evidence methodology. Also inspected the omitted reset/span routes and both debug-table dispatchers in the decompiled exports.

3. **Hash verification:** Recomputed all **120 manifest entries using PowerShell: MATCH throughout**. Both input hashes match the brief. The separately recorded `brief_sha256` also matches.

   Each entry represented below is MATCH; ranges expand to every indicated filename.

   - `inputs/`: `00_0100_50000020.decoded.bin`, `02_0106_458c0020.decoded.bin`.
   - Root/template sources: `brief.md`, `TASK.md`, `templates/result.md`.
   - `ref/analysis/decompiled-main/functions/`: `600619a9.c`, `60062d28.c`, `60062d93.c`, `60062fe5.c`, `60062a60.c`, `60063dc0.c`, `60063380.c`, `60063431.c`, `60419446.c`, `60419696.c`, `604193ca.c`, `6041937f.c`, `60063962.c`, `6006398b.c`, `60063684.c`, `60063567.c`, `600630a3.c`.
   - `work/out/`: `af-profile-fields-v1.txt`, `c1-cycle-v21.txt`, `candidates-5b82.tsv`, `classify-5b82-v1.txt`, `debug-slot-scan-v1.txt`.
   - `work/out/`: every `dynamic-5b82-mark-a.jsonl` through `dynamic-5b82-mark-x.jsonl`; `dynamic-5b82-control.jsonl`, `dynamic-5b82-control-o.jsonl`, `dynamic-5b82-control-p.jsonl`.
   - `work/out/`: every `nvram-5b82-mark-a.json` through `nvram-5b82-mark-x.json`; `nvram-5b82-control.json`, `nvram-5b82-control-o.json`, `nvram-5b82-control-p.json`.
   - `work/out/`: `listings-5b82.txt`, `listings-5b82-v2.txt`, `scan-keys-v2.txt`, `uses-5b82.tsv`, `uses-5b82-v2.tsv`, `verdict.md`, `verdict-v2.md`.
   - `work/result.md`.
   - `work/scripts/`: `build_manifest_v1.py`, `build_manifest_v2.py`, `build_manifest_v3.py`, `classify_5b82_v1.py`, `dump_strings_v1.py`, `extract_listings_v1.py`, `find_menu_strings_v1.py`, `scan_keys_v1.py`, `scan_keys_v2.py`, `summarize_dyn_v1.py`.
   - `work/scripts/`: every `own_5b82_v1.mjs` through `own_5b82_v21.mjs`.

   All **99 harvested-file entries** in `audit/run-log.json`, including the manifest itself, also match. The normalized OM-Emu diff matches the pinned SHA-256 `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

4. **Claim-by-claim:**

   Findings in `result.md` §6:

   - **Claim 1 — CONFIRMED for counts; OVERSTATED as semantic exclusion.** Independently found 53 raw `82 5b` hits, all represented among the 150 candidate rows; 97 exact `0x5b8` instruction-token occurrences; and zero exact `0x5b82` instruction tokens. Verified 137 candidate instruction contexts against raw bytes with zero mismatches.

     Spot-checked 22 dispositions, including `60045589`, `601b1bd4`, `60300cad`, `607c69f4`, `607cb986`, `60bd0ad6`, `6108f9ba`, `6180c41b`, the registration and three map entries, plus ten slot-immediate sites. The displacement, address-constant, map, and structure-offset examples agree with the bytes.

     However, “no shift in the next eight instructions” does not exclude use through a branch, callee, or later computation. At `6007f39b`, for example, the next operation executed is at branch target `6007f3d5`, outside that linear window. Likewise, absence from `functions.tsv` alone does not establish the meaning of the two aligned data coincidences.

   - **Claim 2 — CONFIRMED for the four identified records.** Registration bytes are `82 5b 10 00`, followed by 32 zero bytes. Map entries encode indices 5, 12, and 13. “Four real key uses” should remain qualified by the unresolved interpretation of other data and computed routes.

   - **Claim 3 — CONFIRMED for the listed direct routes.** The mapped setter fetches both key and index, then calls `60063431`. The default route fetches only the key. At `600639b3–600639b6`, registry count and width determine the whole-key length; `60063a68 → 60061453` obtains the ROM default payload. The two copy calls therefore overwrite all 32 bytes for this key.

     The exported direct calls from `618cfda1` pass other constants, not 2017, 2031, or 2034. Its rejection branch calls `618d0451`, which returns `0x200a`. This supports exclusion of that specific dispatcher route, not all possible default writers.

   - **Claim 4 — CONFIRMED as recorded emulator evidence.** In both repeats, direct mapped-setter calls change only indices 5, 12, and 13 respectively. The first direct whole-key-default call zeros all 16 cells. These are explicitly probe calls, not completed UI operations.

   - **Claim 5 — CONFIRMED as recorded emulator evidence.** `mark-w`, `mark-x`, and `control-p` show C1 Assign → Set, native live changes, Recall → Yes, a posted M save, and a new session loading M and E. The second pattern survives Recall and the new session; named cells remain 3200. The two marked logs agree after excluding their different boot paths. This demonstrates the exercised cycle; it does not establish that C1 carries this key.

   - **Claim 6 — CONFIRMED narrowly; UNSUPPORTED as debug reachability analysis.** The two handler pointers and absence of aligned pointers to their individual slots are supported. But both tables have actual readers:
     - `60215a26` loads base `602ec3d4`, walks eight-byte entries, loads the handler at entry +4, and calls it indirectly.
     - `6021818d` does the same from base `602ed9a8`, including the slot at `602eda1c`.

     Their indirect calls are at `60215a44` and `602181ab`. Neither dispatcher is included in the new bounded listings or traced to establish debug-only reachability. I byte-checked 135 instruction occurrences around these dispatchers/callers with zero mismatches.

   - **Claim 7 — CONFIRMED for the stated selected profile and arithmetic.** Raw records support three one-byte zone fields, one one-byte target-size field, three two-byte position fields, and two one-byte current custom dimensions: **12 payload bytes**. Magic 2 + version 1 + length 1 + payload 12 + CRC 2 = **18 bytes**, leaving **8 of 26 bytes** reserved. Adding the stated 16 preset/step bytes gives **34 bytes**, exceeding capacity by **8**. This excludes the custom preset and step tables; it is not a complete copy of every AF setting.

   - **Claim 8 — CONFIRMED.** Zero defaults and repeated `0x0c80` fail magic `0xa70f`. The proposed version/length/CRC checks provide the stated validity scheme. The old six-dword encoding is explicitly withdrawn.

   - **Claim 9 — CONFIRMED as UNRESOLVED; OVERSTATED where reachability is absolute.** `6183dcee` takes a key from a record before the default call at `6183e9b5`; `6183cc7d` passes a parameter key to the span copier at `6183cd6e`. Their applicability to `0x5b82` remains open. These gaps independently block OWNABLE.

   Remaining numbered result sections:

   - **§§1–2 — CONFIRMED** input hashes and audited scope; historical reading claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — CONFIRMED** preserved versions and recorded probe outcomes; command execution history is **SUPPORTED-NOT-INDEPENDENT**.
   - **§§4–5 — CONFIRMED** cited artifacts and manifest coverage, apart from normal manifest self-exclusion.
   - **§7 — OVERSTATED:** evidence pointers do not make every disposition or reachability claim conclusive.
   - **§8 — CONFIRMED** C1 operations and direct-call effects; **WRONG** that the cursor search demonstrates twelve menu tabs. All twelve samples in each final run show the same C1 action-list text.
   - **§§9–11 — CONFIRMED** withdrawal of OWNABLE, retained uncertainties, and instruction to leave the cells unused.
   - **§12 — WRONG** that all six correction items were completed.

   Correction-list status:

   - **1 — NOT DONE:** enumeration is complete, but some dispositions still rely on the eight-instruction heuristic or “outside any function,” rather than demonstrated meaning.
   - **2 — NOT DONE:** the whole-key mechanism and mapped setter are established, but parameter-key routes remain open; their complete bounded listings are missing. Debug-table dispatch is untraced.
   - **3 — DONE with explicit boundaries:** the C1 cycle completes in both repeats and control. Cursor-page edits do **not** complete in either repeat; direct calls are correctly distinguished. The stated twelve-tab boundary reason needs correction.
   - **4 — DONE:** the selected payload, header, integrity check, and capacity arithmetic are accounted for.
   - **5 — DONE:** the effective verdict is UNRESOLVED, zero-default invalidation is explained, and remaining gaps are listed. The old OWNABLE verdict is explicitly withdrawn.
   - **6 — NOT DONE:** hashes are consistent, but completed output logs remain absent for commands such as `dump_strings_v1.py`, `find_menu_strings_v1.py`, and manifest construction. The debug scan and manual candidate edits also lack a complete command/output record.

5. **Contradictions with established findings:** The effective UNRESOLVED verdict agrees with `AFON-MENU-RESEARCH.md` §8’s ownership standard. The retained round-1 OWNABLE file conflicts with that standard but is expressly withdrawn. No contradiction was found in the corrected field widths or zero-default behavior.

6. **Alternative explanations** not excluded by the evidence:

   - Record-driven default or span-copy operations may reach unnamed cells.
   - A debug dispatcher may be accessible through an untraced entry path.
   - The C1 result may reflect this key being excluded from custom-mode snapshots.
   - Cursor editors remain untested; the search stayed on the C1 action list.
   - Unidentified readers could consume marker values without changing them.

7. **Scope and safety:** No prohibited changes found in the supplied audit: zero isolation violations, unchanged workspace/input checks, and the pinned pre-existing OM-Emu diff. Examined probes use explicit `work/out/` NVRAM paths. No image construction or hardware recommendation was seen. This review performed no writes and ran neither Ghidra nor OM-Emu.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Replace provisional candidate exclusions with concrete data-use or control-flow evidence, or retain them explicitly as unresolved.
   2. Supply bounded listings and caller/source/bounds analysis for the two parameter-key routes. Trace both debug-table dispatchers and classify their entry paths.
   3. Correct the cursor boundary to state that twelve attempts retained the same C1 list. Keep the actual cursor-page operations unexercised until demonstrated.
   4. Supply missing completed command/output records and keep the manifest, use classifications, and completion claims consistent.

   Optional improvements: add a versioned artifact index identifying the current verdict/use table, and log a known C1-managed setting alongside the unnamed-cell patterns to strengthen operation-completion evidence.