# T2b review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The **UNRESOLVED** ownership verdict is justified, but the closeout remains incomplete. Candidate exclusions still exceed their evidence, the replay analysis retains unresolved sources, and completed command-output records remain incomplete. OWNABLE-for-normal-use is not claimed and does **not** meet brief §6.

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md`, `templates/review.md`, `work/result.md`, the manifest, `INDEX.md`, and `verdict-v3.md`.

   Examined both previous T2 reviews; T2’s correction verdict, candidate/use tables and C1 evidence; `AFON-MENU-RESEARCH.md` §8’s storage mechanics, ownership requirements, PEN-F precedent and bank-7 initialization/fallback; the current tables, listings, scripts and cited dynamic records; and every file in `audit/`.

   Independently checked **1,242 supplied instruction-line occurrences** and **1,421 additional source-listing occurrences** against the main image: **zero byte mismatches**. Offset used: address minus `0x60021020`.

3. **Hash verification:** All **38 manifest file entries** recomputed: **MATCH**, including recorded byte lengths. The separate `brief_sha256` also matches.

   Every filename below is MATCH:

   - `inputs/`: `00_0100_50000020.decoded.bin`, `02_0106_458c0020.decoded.bin`.
   - Root/template: `brief.md`, `TASK.md`, `templates/result.md`.
   - `ref/tasks/T2-cell-ownership/run-20261117-224756-review/`: `review.md`.
   - `ref/tasks/T2-cell-ownership/run-20261117-220544/work/out/`: `candidates-5b82.tsv`, `uses-5b82-v2.tsv`, `dynamic-5b82-mark-w.jsonl`, `dynamic-5b82-mark-x.jsonl`, `dynamic-5b82-control-p.jsonl`.
   - `ref/analysis/decompiled-main/`: `all-functions.asm`, `functions.tsv`, `calls.tsv`.
   - `ref/analysis/decompiled-main/functions/`: `6183cc7d.c`, `603c2731.c`, `6006bf7f.c`, `60196ee3.c`, `618c97a2.c`, `604193ca.c`, `616a192d.c`.
   - `work/out/`: `candidates-5b82-v3.tsv`, `close-5b82-v2.txt`, `command-log.txt`, `cursor-pages-v1.txt`, `fillers-5b82-v1.txt`, `INDEX.md`, `listings-5b82-v3.txt`, `listings-adj-thunks-v1.txt`, `routes-5b82-v1.txt`, `uses-5b82-v3.tsv`, `verdict-v3.md`.
   - `work/`: `result.md`.
   - `work/scripts/`: `close_5b82_v1.py`, `close_5b82_v2.py`, `fillers_5b82_v1.py`, `manifest_5b82_v1.py`, `routes_5b82_v1.py`.

   All **18 harvested-file hashes** in `audit/run-log.json` also match, including the manifest itself. The normalized OM-Emu diff matches pinned SHA-256 `61cd13270e82f9bc5236c36c945783defda4c97a2e99f93b75f11da521877702`.

4. **Claim-by-claim:**

   Findings in `result.md` §6:

   - **Claim 1 — CONFIRMED for the identified route.** Raw thunk bytes at `0x6183bdef` call `0x6183dcee`. Switch slot `0x619537a0` selects `0x6183e991` for inner command 53. The listing loads record+8 into D2, zero-extends it, checks registration and calls `0x60063962` at `0x6183e9b5`. This is a runtime packet key and a whole-key ROM-default operation; for `0x5b82`, the established payload is zeros.

   - **Claim 2 — CONFIRMED.** The two identified callers are `0x6183bd67` and `0x61841ea8`. Their keys come from record+4 and record+8 respectively, and their source pointer comes from record+0x2c. The manually decoded thunk bytes match the image. The wrapper reaches `0x60063567` for type 2; a packet naming `0x5b82` can supply non-zero span contents. The wrapper also calls validation helper `0x6183cac6` and limits the transfer length; the caller controls the requested span within those checks.

   - **Claim 3 — CONFIRMED for the flag gate and task registration.** `0x6183bc95–0x6183bca1` checks the flag and bypasses the command table unless it equals 1. The ungated `0x1002` handler sets it through `0x6183bbf5`. The task pointer at `0x6003915c` is consistent with the adjustment-task identification. This supports the adjustment-path classification.

   - **Claim 4 — CONFIRMED narrowly; OVERSTATED as an exhaustive interpretation of data.** The four established registration/map records and the listed immediate/ROM-key checks are supported. However, “the key constants are” must remain qualified: unidentified data and computed sources have not all been excluded. Alignment and absence from the function export do not identify a structure.

   - **Claim 5 — CONFIRMED for the exported enqueue callers and replay mechanism.** `calls.tsv` lists the three enqueue calls at `0x600634d9`, `0x60063668` and `0x6006397b`; their type values are 1, 2 and 4. Replay dispatches to the stated one-cell, span and default implementations. The callback-pointer bytes at `0x600631cd` match. This does not close the remaining runtime sources feeding those wrappers.

   - **Claim 6 — CONFIRMED for both dispatchers and their identified entry paths.** Both loops compare command names, advance by eight bytes, bound the search to 63 entries, load entry+4 and call it indirectly. Raw entry-14 name pointers resolve to `prm`, with handler `0x600619a9`, at both tables. The first caller chain leads through `dbgall`; the second leads through the shell task or `0x602181e3`. The call from `0x618c97a2` is adjustment-flag gated. These support debug-console/adjustment classifications rather than a normal menu writer.

   - **Claim 7 — OVERSTATED.** The new trace improves branch handling, but its general exclusion rule still stops at the first use. For example, it stops at `add D2,D3` for `0x6128c262` and at a stack store for `0x608f8614`; neither operation intrinsically terminates the value’s lifetime. Independent surrounding listings support address and diagnostic uses in checked examples, but the table’s repeated “no asl … so” explanation is not the requested complete control-flow/data-use justification for all 29 rows.

   - **Claim 8 — CONFIRMED as unresolved data observations.** The two halfwords and following values match the image, and retaining them as UNRESOLVED is appropriate. The reported function-export gap and absence of exact pointers do not establish the pool’s structure or exclude references through a base plus offset.

   - **Claim 9 — CONFIRMED for the displayed loads; OVERSTATED as the blocker list.** Several cited setters still lack sufficient source/index analysis. However, the `0x607135ad` group is presented too broadly as unresolved. At `0x607135ef`, A2 receives `0xfa64`; `0x6071365d` copies A2 into A3. The subsequent A3-derived calls at `0x60713679`, `0x607136b7` and `0x607136fa` therefore use that constant, with intervening setter calls preserving A3. These are not unexplained runtime keys merely because the immediate lies outside an eight-instruction window.

   - **Claim 10 — CONFIRMED.** Independently parsed all three original JSONL logs. Each contains twelve identical C1 action-list samples. Neither marked repeat nor the control demonstrates a target cursor edit.

   Candidate spot-checks against raw bytes covered **23 rows**:

   `60045589`, `601b1bd4`, `60300cad`, `60539e07`, `607c69f4`, `607c8e19`, `607cb986`, `607e2ef9`, `60bd0ad6`, `6108f9ba`, `6007f39b`, `604df354`, `608f8614`, `60cc0c5a`, `60cebcac`, `61195d1d`, `6128c262`, `616ddb03`, `616e369a`, `600e5874`, `606274e0`, `60627518`, `60627524`.

   The instruction/displacement and established record examples agree with the bytes. Rows `0x60539e07`, `0x607c8e19` and `0x607e2ef9` still assert exclusion from “unaligned data byte” and missing function coverage without concrete structure bounds or a demonstrated consumer.

   Remaining numbered result sections:

   - **§§1–2 — CONFIRMED** input identity and audited scope; historical reading claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§3 — SUPPORTED-NOT-INDEPENDENT** execution history; completed-output logging remains incomplete.
   - **§§4–5 — CONFIRMED** artifact availability and manifest coverage; historical reading claims are **SUPPORTED-NOT-INDEPENDENT**.
   - **§7 — OVERSTATED** where evidence pointers are treated as conclusive exclusions.
   - **§8 — CONFIRMED** byte checks, cursor BOUNDARY and failure to meet OWNABLE; **OVERSTATED** for the blanket 29-row PASS and completed route classification.
   - **§9 — OVERSTATED** where it says the remaining source analysis is closed.
   - **§§10–11 — CONFIRMED** that unresolved sources require further tracing; the blocker list needs the constant-key correction above.
   - **§12 — CONFIRMED** disclosed absence of new sessions/NVRAM and retained failed script; command-record omissions remain a deviation.

   Brief §4 completion status:

   - **1 — NOT DONE.** Some exclusions still lack concrete data-use/control-flow evidence and are not marked UNRESOLVED.
   - **2 — NOT DONE overall.** The two parameter routes are substantially traced, and replay types/fillers are identified, but applicable runtime setter sources remain open.
   - **3 — DONE.** Both table readers and their debug/shell/adjustment entry paths are identified.
   - **4 — DONE through the permitted BOUNDARY option.** The twelve-tab claim is corrected. Cursor edits completed in neither repeat; no accompanying completed-cursor/C1-setting evidence is claimed.
   - **5 — NOT DONE.** The index and hashes are consistent, but classifications need correction and the command log lacks actual completed manifest stdout. Its final block describes intended behavior instead of recording the script’s printed output.

5. **Contradictions with established findings** (cite document §), or “none”.

   None in the effective **UNRESOLVED** ownership verdict. It agrees with `AFON-MENU-RESEARCH.md` §8, “Not yet proven,” and brief §6. The reported `0x607135ad` uncertainty conflicts with the fuller source listing, as detailed above.

6. **Alternative explanations** not excluded by the evidence.

   - Untraced record-driven setters may select `0x5b82` and unnamed indices during normal operation.
   - Unidentified data may be accessed through computed offsets without containing an exact pointer to either sampled halfword.
   - A value’s first arithmetic use, store or call may pass it onward; stopping there does not establish its final meaning.
   - Target cursor editors remain unexercised.
   - Marker persistence does not exclude readers that consume values without changing them.

7. **Scope and safety:** No prohibited changes found. The isolation audit reports zero violations and zero allowed changes; host checks report unchanged workspace and inputs. The OM-Emu diff matches the pre-existing pinned diff. Examined script writes target `work/`. No image construction or hardware recommendation was seen.

   This review performed no writes and ran neither Ghidra nor OM-Emu.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Replace unsupported candidate exclusions with bounded structure/consumer evidence, or mark those rows UNRESOLVED. Extend first-use traces where needed and revise the blanket 29-row PASS.
   2. Correct the `0x607135ad` constant-key lineage and synchronize the result, verdict and use table. Keep genuinely untraced setter sources explicitly open.
   3. Distinguish completed parameter-route tracing from incomplete replay-source closure; retain **UNRESOLVED** under brief §6.
   4. Supply actual completed command stdout/stderr and exit records, especially manifest construction. Refresh affected hashes and completion claims.

   Optional improvements: include bounded listings for the span-validation helper and the constant-key propagation, and separate demonstrated normal-operation exclusions from entry-path classifications.