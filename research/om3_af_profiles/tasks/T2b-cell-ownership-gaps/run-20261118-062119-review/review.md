# T2b-cell-ownership-gaps review (Codex Sol, read-only)

1. **Verdict:** REJECT

   **UNRESOLVED** remains appropriate. The correction round substantially improves the evidence, but setter-field descriptions contain errors, some candidate exclusions still lack concrete structure evidence, and the command log reconstructs output instead of capturing completed commands. The claimed five-item-only residual is not yet established. OWNABLE for normal use does not meet brief §6.

2. **Baseline checked:** Read `TASK.md` and `review-brief.md` completely; `brief.md`, especially §§0, 6–7; `audit/previous-review.md`; `templates/review.md`; `work/result.md`; the manifest; `INDEX.md`; `verdict-v4.md`; both v4 tables; and the new listings, table dumps and relevant scripts.

   Examined the relevant functions in `ref/analysis/decompiled-main/all-functions.asm`, supporting decompilation, and `AFON-MENU-RESEARCH.md` §8’s settings mechanics and ownership requirements.

   Independently checked **3,450 supplied instruction-line occurrences**, **670 additional source instructions**, and **all 150 candidate rows** against the main image: **zero byte mismatches**. This includes all five specifically requested candidate addresses. Offset used: address minus `0x60021020`.

3. **Hash verification:** All **42 manifest entries MATCH**, including recorded byte lengths. The separate `brief_sha256` also **MATCHES**.

   Each entry below is **MATCH**:

   - `inputs/`: `00_0100_50000020.decoded.bin`, `02_0106_458c0020.decoded.bin`.
   - Root/template: `brief.md`, `TASK.md`, `templates/result.md`.
   - `audit/`: `previous-review.md`.
   - `ref/analysis/decompiled-main/`: `all-functions.asm`.
   - `work/out/`: `candidates-5b82-v3.tsv`, `candidates-5b82-v4.tsv`, `close-5b82-v2.txt`, `close-5b82-v4.txt`, `command-log.txt`, `cursor-pages-v1.txt`, `fa64-d2-v1.txt`, `fa64-stubs-v1.txt`, `fillers-5b82-v1.txt`, `INDEX.md`, `listings-5b82-v3.txt`, `listings-adj-thunks-v1.txt`, `listings-setters-v1.txt`, `records-5b82-v4.txt`, `routes-5b82-v1.txt`, `setters-5b82-v1.txt`, `setters-5b82-v2.txt`, `uses-5b82-v3.tsv`, `uses-5b82-v4.tsv`, `verdict-v3.md`, `verdict-v4.md`.
   - `work/`: `result.md`.
   - `work/scripts/`: `candidates_5b82_v4.py`, `close_5b82_v1.py`, `close_5b82_v2.py`, `fa64_d2_v1.py`, `fa64_stubs_v1.py`, `fillers_5b82_v1.py`, `manifest_5b82_v1.py`, `manifest_5b82_v2.py`, `patch_5b82_v1.py`, `records_5b82_v4.py`, `routes_5b82_v1.py`, `setters_5b82_v1.py`, `setters_5b82_v2.py`.

   All **36 harvested-file entries** in `audit/run-log.json` also match their hashes and lengths.

4. **Claim-by-claim:**

   Findings in `result.md` §6:

   - **Claim 1 — CONFIRMED.** `0x601eff7d–0x601effcf` checks the slot, computes the eight-byte record address, loads its key and index, and calls the setter. The fourteen displayed callers supply nonnegative constants; the out-of-range `0xd4d2` argument is rejected.
   - **Claim 2 — CONFIRMED.** Independently compared all **122 table-A key/index/cache records** with the raw image. Bounds are `0x6035a038–0x6035a408`, exclusive. None names `0x5b82`.
   - **Claim 3 — WRONG as an exhaustive field description.** The record-base calculation is correct, but `FUN_601972f1` also uses keys at **record+0x50 and record+0x52**. For example, `0x60197543` adds four to the saved record+0x4c pointer; `0x6019760a` adds six. Subsequent loads feed setter calls at `0x6019757f` and `0x6019761f`. The later sibling calls do likewise. The supplied key-field dump covers only +0x4c/+0x4e.
   - **Claim 4 — CONFIRMED.** Independently checked the 61 records, all aligned halfwords, and both link fields. No halfword is `0x5b82`; +0x14 is always `0x3e`; the two exceptional +0x6c links match. This broader scan supports key exclusion despite claim 3’s incorrect field inventory.
   - **Claim 5 — CONFIRMED for the instruction and argument load; SUPPORTED-NOT-INDEPENDENT for uniqueness.** Raw bytes `cd d2 18 f0 3c` at `0x60195a1f` resolve to `0x601972f1`; preceding bytes include `58 50`, loading the saved index.
   - **Claim 6 — CONFIRMED for the nine identified callers.** Their listings and bytes show the stated key immediates, none `0x5b82`. The prologue preserves the incoming key/index and reloads them before the setter.
   - **Claim 7 — CONFIRMED.** Raw bytes at `0x607135ef`, `0x6071365d` and `0x607136f6` establish `0xfa64 → A2 → A3 → D2`.
   - **Claim 8 — CONFIRMED.** Independently checked all **16 stubs** and all **16 nonzero dispatch-table entries**. Every stub branches to `0x607132f7` and leaves D2 unchanged. The intervening call-save operands also support preservation.
   - **Claim 9 — CONFIRMED for exclusion within the established record bounds; OVERSTATED as completion of the requested trace.** Table A excludes the key, the entire bounded table B contains no aligned `0x5b82`, the nine caller keys differ, and the `0xfa64` lineage holds. However, the required complete key/index accounting and dumps remain incomplete.
   - **Claim 10 — WRONG in parts of its supporting explanation.** The revised rows improve substantially, including `0x6128c262`’s destination-pointer trace and `0x608f8614`’s diagnostic argument. Two errors remain:
     - At `0x616ddb03`, the argument does **not** die in `FUN_616a1d83`. D2 survives that function and is read by `mov D2,(0xc,sp)` at **`0x616a1d41`**, bytes `4a 0c`. The format string at `0x617beab0` is `%s(%u): %s`; this supports a diagnostic line-number classification, not an unused argument.
     - For `0x6118bf47` and `0x6118c058`, the derived pointer enters `FUN_610cd6bd` in **A1**, then A3 at `0x610cd6be`. The cited load through A2 at `0x610cd6c1` concerns a different pointer. The derived pointer later reaches the copy call through `mov A3,A0` at `0x610cd71b`.
   - **Claim 11 — CONFIRMED.** All five listed byte windows match. Retaining those occurrences as UNRESOLVED is appropriate.
   - **Claim 12 — CONFIRMED for retaining UNRESOLVED and carrying the classified adjustment/debug routes; OVERSTATED for the five-only residual.** In particular, a four-byte “pointer run” at `0x615fbdb0` merely restates that `82 5b 29 61` forms an image-range dword. It does not establish a structure or consumer that excludes halfword access. The analogous singleton-address explanations at `0x615b9d55` and `0x615b9d91` also need concrete layout/consumer evidence.

   Remaining numbered result sections:

   - **§§1–2 — CONFIRMED** for input identity and brief selection; historical reading claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — UNSUPPORTED** as a record of actual completed stdout/stderr/exits. `manifest_5b82_v2.py` constructs command blocks from literals and artifact contents, hard-codes exit 0 and empty stderr, then writes the log at line 73. Its own success block is written before the manifest operation and final checks finish.
   - **§§4–5 — CONFIRMED** for artifact availability and manifest coverage.
   - **§7 — OVERSTATED** where its references imply complete field/consumer tracing.
   - **§8 — CONFIRMED** for byte agreement, table counts and carried cursor BOUNDARY; **OVERSTATED** for conclusive candidate closure.
   - **§9 — OVERSTATED** where it describes all requested source analysis as complete.
   - **§§10–11 — OVERSTATED** because the residual omits insufficiently established address-constant exclusions.
   - **§12 — WRONG.** “None” omits the completed-command logging deviation.

   Brief §7 correction status:

   - **1 — NOT DONE.** Key exclusions are substantially supported, but table B’s field inventory is wrong and its dump does not enumerate every consumed key and corresponding index. The separate caller-record index source for `FUN_601971f5` also needs the requested bounded accounting.
   - **2 — DONE.** The `0x607135ad` lineage is corrected consistently and independently supported.
   - **3 — NOT DONE.** All 29 rows now have individual statuses, and the three named odd-address exclusions were withdrawn. Nevertheless, several consumer explanations are wrong and singleton address values do not supply the requested structure proof.
   - **4 — DONE for the carried route classifications.** The identified setters’ key exclusions are supported by the bounded whole-table checks and constant keys. This does not cure item 1’s incomplete trace documentation or establish ownership.
   - **5 — NOT DONE.** The index and hashes are current, but reconstructed output does not satisfy actual completed-command logging.

5. **Contradictions with established findings** (cite document §), or “none”.

   No contradiction in retaining **UNRESOLVED**, consistent with brief §6 and `AFON-MENU-RESEARCH.md` §8’s ownership-proof requirement.

   The exclusive +0x4c/+0x4e description contradicts the supplied setter listing. The “unused argument” explanation contradicts `all-functions.asm` at `0x616a1d41`. “Deviations: none” contradicts brief §§0 and 7.5’s logging requirements.

6. **Alternative explanations** not excluded by the evidence.

   - Image-range dwords may be interpreted through halfword or computed-offset accesses until their actual structures and consumers are established.
   - A value preserved across a callee can be consumed later; absence of a read inside that callee does not establish that it dies.
   - The five acknowledged data occurrences remain unidentified.
   - Cursor editors remain unexercised under the permitted BOUNDARY classification.

   **UNRESOLVED is justified, but the asserted five-item-only residual is not yet justified by the supplied exclusions.** No newly demonstrated normal-operation writer to an unnamed cell was found.

7. **Scope and safety:** Examined script writes target `work/`. No image construction, hardware recommendation, or prohibited source mutation was found. The supplied isolation audit reports zero violations; its host checks report unchanged workspace and inputs.

   This review performed no writes and ran neither Ghidra nor OM-Emu.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Correct table B’s key-field inventory to include +0x50/+0x52. Supply the requested complete key/index dumps and bounded index-source accounting; synchronize result, verdict and use table.
   2. Correct the three erroneous `mov 0x5b8` explanations identified above. Establish concrete structures/consumers for the singleton address-constant exclusions, or mark those rows UNRESOLVED and expand the residual.
   3. Capture actual completed stdout, stderr and exit status for every command, including the manifest run. Label unavailable historical output honestly; remove reconstructed-output completion claims. Refresh the manifest and index after corrections.

   Optional improvements: distinguish independently supported key exclusion from completeness of the requested field-by-field trace.