# T14 review (Codex Sol, read-only)

1. **Verdict:** REJECT

   The listings match the image, and the writer formula is confirmed. Conclusion (a) is unsupported: a shared writer does not prove that both button paths supply equal inputs, shadow state, or rebuild timing.

2. **Baseline checked:** `TASK.md`, `review-brief.md`, `brief.md` completely; `work/result.md`; all submitted listings, scripts, call-graph notes, zone table, logs, manifest and seal; all four `audit/` files.

   Research checked: T8d decision, “Accepted” writer rule and zone names; T1 decision, Established/Open sections, readiness result and binding note; T7 decision and result §6 claims 11/13; T9d decision and all twelve K1 edge records in `run-20261119-202459/work/out/obs-k1-t9d.jsonl`; `AFON-MENU-RESEARCH.md` §§1, 6 and §8 input/dispatcher findings. Also examined the cited decompilations and supplemental existing assembly around `0x60873daf` and `0x60890a0d`.

3. **Hash verification:** Recomputed every manifest entry: **all MATCH**.

   - `brief.md`: MATCH.
   - Inputs: `inputs/00_0100_50000020.decoded.bin`, `inputs/02_0106_458c0020.decoded.bin`: each MATCH.
   - Project entries: `projects/OM3_main_full.gpr`, `projects/OM3_main_full.rep/project.prp`, `projects/OM3_main_full.rep/idata/00/00000000.prp`, and `db.1.gbf`, `db.2.gbf` under `projects/OM3_main_full.rep/idata/00/~00000000.db/`: each MATCH.
   - Sources: `work/scripts/scan_image_t14.py`, `work/scripts/T14Dump.java`, `work/scripts/seal_t14.py`, `ref/scripts/OM3Disasm.java`: each MATCH.
   - Outputs: `work/result.md`, `work/out/call-graph.md`, `work/out/scan-t14.json`, `work/out/zone-table.md`, `work/out/seal.json`: each MATCH.
   - Logs under `work/out/`: `ghidra-side.log`, `ghidra-t14.log`, `ghidra-t14b.log`, `ghidra-t14c.log`, `ghidra-use-a.log`: each MATCH.
   - Listings under `work/out/listings/`: `accessor-use-a.txt`, `af-init.txt`, `af-release.txt`, `af-reset.txt`, `af-start.txt`, `afon-handlers.txt`, `afon-owner.txt`, `alt-kind-a.txt`, `alt-kind-b.txt`, `alt-position.txt`, `builder-pad.txt`, `cache-entry.txt`, `classifier-head.txt`, `converter.txt`, `dirty-wrappers.txt`, `ghidra-refs.txt`, `handler-9197.txt`, `pose-refresh.txt`, `priority-cache-b.txt`, `priority-cache.txt`, `priority-side.txt`, `priority-use-a.txt`, `priority-use-b.txt`, `reconcile-builder.txt`, `record-copy.txt`, `release-common.txt`, `s1-handler.txt`, `shadow-replace.txt`, `struct-helpers.txt`, `writer-accessor.txt`: each MATCH.

   All 39 seal entries also MATCH. The manifest itself matches the audit’s harvested hash, `8c2638381e6aaed4899f70dd41dc18e2e44bdc45a5478a83192dd2235cfe1c38`.

   Independently compared all **2,967 address-and-byte rows** against the main image at address minus `0x60021020`: **zero mismatches**. All six scan windows MATCH. Byte matching does not validate the acknowledged misaligned instruction interpretations.

4. **Claim-by-claim:** Numbering refers to `result.md` §6.

   - **1 — OVERSTATED.** Confirmed the writer body and independently rescanned its two direct call sites, `0x609b3b98` and `0x609b3bbc`. Absolute-immediate searches do not establish that no pointer-relative or indirect writer exists. Correct class: STATIC for the identified writer and direct references; uniqueness remains unproved.
   - **2 — CONFIRMED.** Independently checked all seven getter arguments, indices and their order in `writer-accessor.txt`.
   - **3 — CONFIRMED.** Kind 2 forces position 526 at `0x609b3d1a`; the listed conditions reach `clr D2` at `0x609b3d33`.
   - **4 — CONFIRMED.** The cached `0xe951[0]` gate and four shadow replacements follow from the listings. Their equality across button executions is not established.
   - **5 — OVERSTATED.** Table pointers, state values and the direct release call are confirmed. The down/up state stores require `0x610a3735(0x31)` to return 1 (`0x610aef46–48`). This handler does not establish the requested downstream S1 owner or writer chain.
   - **6 — OVERSTATED.** Confirmed key `0xb`, conditional mode-1 dispatch and the two owner-2 stores. Confirmed absence of a direct writer call in the displayed bodies. Unlisted callees and indirect calls prevent the broader claim that every reachable arm excludes the writer or setting-dependent effects.
   - **7 — CONFIRMED.** Both displayed release routes reach `0x610a6323`, which has no direct writer call. This does not establish equal release effects.
   - **8 — CONFIRMED.** Both cache pairs and the writer’s lack of direct cache-byte reads are supported. Independently rescanned the sole direct caller of `0x609b34d1`.
   - **9 — OVERSTATED.** Value 0 calls `0x609025aa` only when `0xa33ca30d` is also zero (`0x609024b8–c0`). Absence of direct record stores in that helper does not exclude downstream effects. The supporting assertion that `0x60873daf` calls “trace helpers only” is **WRONG**: image bytes `dd ee cb 01 00 f0 2c` at `0x60873e1f` call `0x60890a0d`; that routine calls `0x6004cdf8` at `0x60890a5e` and conditionally `0x6004cefd` at `0x60890a6f`. These synchronization operations must not be dismissed as tracing.
   - **10 — CONFIRMED.** Independently checked padding at all four cited overlay addresses and rescanned the listed direct call/jump encodings: no hits.
   - **11 — CONFIRMED.** Option records, UI-map bytes and assignment-entry bytes match the image.
   - **12 — SUPPORTED-NOT-INDEPENDENT.** T1 establishes value meanings and row/storage mapping. Its physical-key versus assigned-function binding remains unresolved.
   - **13 — SUPPORTED-NOT-INDEPENDENT.** Zone names remain PRIOR T8d. Independently confirmed the ten stored-value bytes.
   - **14 — SUPPORTED-NOT-INDEPENDENT.** Default physical-key identity is PRIOR research; independently confirmed immediate `0xb` in this handler.
   - **15 — OVERSTATED.** T9d’s twelve K1 records confirm owner 255 and the stated record. T7’s cited correction result instead reports zero-filled buffers and no writer execution; it does not establish those same numeric observations.
   - **16 — UNSUPPORTED.** Equal output follows conditionally from equal writer inputs and shadow state. The evidence never establishes those conditions for the two stock button paths. Constant getter indices also do not exclude pose-dependent changes to the cells. The unconditional zone/release table and “half-press is the correct reference” conclusion therefore do not follow.

5. **Contradictions with established findings:**

   - `AFON-MENU-RESEARCH.md` §8, “Live OM-Emu AF-ON input and dispatcher regression,” records stock AF-ON reaching `0x610a5620` through `0x610a267f`, while neither archived AF-ON wrapper ran. The submitted analysis does not cover that established route.
   - T7 correction result §6 claims 11/13 reports zero record buffers and an unentered writer, contradicting attribution of T9d’s exact nonzero K1 record to T7.
   - T8d’s writer rule and T1’s value mapping are consistent with the independently checked evidence.

6. **Alternative explanations** not excluded by the evidence.

   Button-specific callees, queued work or indirect dispatch could change the seven cells, cached shadow gate, shadow values, or rebuild timing before publication. Stores through returned pointers are not excluded by absolute-address scans.

   Release paths share a helper but have different surrounding work. AF-ON up additionally contains an indirect call at `0x610b9684` and a call to `0x61090e0a` at `0x610b96a7`. Shared helper identity does not establish equal incoming state or complete effects.

7. **Scope and safety:** No emulator run, firmware construction, firmware change proposal or hardware recommendation appears in the submitted work. Evidence scripts write under `work/`; the isolation audit reports zero violations and zero allowed changes. This review used read-only PowerShell operations and ran neither Ghidra nor OM-Emu.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Replace conclusion (a) with (c) for the submitted evidence. Retain the confirmed writer formula, but make every zone/release equality conditional on equal inputs, shadow state and publication timing.
   2. Explicitly mark the missing S1 owner/dispatch chain, established custom-button route, unresolved callees and release-specific effects as blockers. Remove claims that direct-call or immediate scans close those paths.
   3. Correct the `0x609024aa` condition and remove the “trace helpers only” assertion. Withdraw the claim that changing `0x90a1[1]` cannot affect any record byte.
   4. Correct the T7 attribution. For conclusion (c), specify the minimal deciding evidence: paired stock record-publication observations with button/owner, pose, setting, seven inputs and shadow state identified. This is an evidence requirement, not authorization for an emulator run or hardware recommendation.

   Optional improvements: fix `0x609b39f2` to `0x609b39f0` in `call-graph.md`; distinguish final project hashes from evidence of hashing before first use; preserve exact commands for the supplemental caller scans.