# T14 review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

   Conclusion **(c)** follows from the submitted evidence. The writer formula is confirmed; equal button-specific inputs, shadow state and publication timing remain unproved. Several dispatch statements and the answer summary still need correction.

2. **Baseline checked:** `TASK.md`, `review-brief.md`, `brief.md` including §4, `work/result.md`, both call-graph notes, both zone tables, listings, scan scripts and outputs, manifests, seals, and `audit/previous-review.md` plus the remaining audit records.

   Research checked: T8d decision, “Accepted” writer rule and zone mapping; T1 decision, Established/Open sections, and readiness result §6; T7 decision, “Blocked or open,” and correction result §6 claims 11/13; T9d decision and all twelve K1 edge records; `AFON-MENU-RESEARCH.md` §1 T1 findings and §8 “Live OM-Emu AF-ON input and dispatcher regression.”

3. **Hash verification:** Recomputed all **88 manifest file entries: each MATCH**. The separately recorded `brief.md` hash also MATCHES.

   - Inputs, each MATCH: both decoded binaries; `projects/OM3_main_full.gpr`; `project.prp`; `idata/00/00000000.prp`; `db.1.gbf`; `db.2.gbf`.
   - Sources, each MATCH: `scan_image_t14.py`, `T14Dump.java`, `seal_t14.py`, `scan_t14_r2.py`, `scan_t14_r2b.py`, `T14R2.java`, `seal_t14_r2.py`, and `ref/scripts/OM3Disasm.java`.
   - Root work outputs, each MATCH: `work/result.md`; `work/out/call-graph.md`, `scan-t14.json`, `zone-table.md`, `seal.json`; logs `ghidra-side.log`, `ghidra-t14.log`, `ghidra-t14b.log`, `ghidra-t14c.log`, `ghidra-use-a.log`.
   - `work/out/listings/`, each MATCH: `accessor-use-a.txt`, `af-init.txt`, `af-release.txt`, `af-reset.txt`, `af-start.txt`, `afon-handlers.txt`, `afon-owner.txt`, `alt-kind-a.txt`, `alt-kind-b.txt`, `alt-position.txt`, `builder-pad.txt`, `cache-entry.txt`, `classifier-head.txt`, `converter.txt`, `dirty-wrappers.txt`, `ghidra-refs.txt`, `handler-9197.txt`, `pose-refresh.txt`, `priority-cache-b.txt`, `priority-cache.txt`, `priority-side.txt`, `priority-use-a.txt`, `priority-use-b.txt`, `reconcile-builder.txt`, `record-copy.txt`, `release-common.txt`, `s1-handler.txt`, `shadow-replace.txt`, `struct-helpers.txt`, `writer-accessor.txt`.
   - `work/out/r2/`, each MATCH: `call-graph-r2.md`, `call-walk.txt`, `ghidra-lookup.log`, `ghidra-lookup2.log`, `ghidra-r2.log`, `hashes-before.json`, `jump-slots.txt`, `reverse-refs.txt`, `scan-r2.json`, `setter-windows.json`, `zone-table-r2.md`, `seal-r2.json`.
   - `work/out/r2/listings/`, each MATCH: `accessor-caller-b.txt`, `alt-entry.txt`, `assign-lookup.txt`, `custom-start.txt`, `direct-entry.txt`, `event-down-held.txt`, `event-down.txt`, `event-up-held.txt`, `event-up.txt`, `fn-0a-other.txt`, `fn-0a-release.txt`, `input-dispatch.txt`, `pose-caller-a.txt`, `pose-caller-b.txt`, `release-dispatch.txt`, `s1-gate.txt`, `shadow-store.txt`, `sync-body.txt`, `sync-cdf8.txt`, `sync-cefd.txt`, `sync-helper.txt`.

   Current seal: **72/72 MATCH**. Retained r1 seal: **38 MATCH; `work/result.md` MISMATCH**, because that file was replaced in r2. This is consistent with the disclosed replacement.

   All 81 audit-harvested file hashes MATCH, including manifest SHA-256 `48943f3fb07b235e190a50d8bea67a3e70fcfbffb17b261545821e57f379ab7f`.

   Independently compared **4,216 address-and-byte listing rows** against the main image at address minus `0x60021020`: **zero mismatches**. All six r1 scan windows and ten r2 fixed rows MATCH. Byte agreement does not validate instruction decoding at acknowledged misaligned starts.

4. **Claim-by-claim:** Numbering refers to `result.md` §6.

   - **1 — CONFIRMED.** Independently rescanned the two direct writer calls and absence of its absolute pointer immediate. Indirect reachability remains explicitly open.
   - **2 — CONFIRMED.** Checked all seven getter arguments, indices, order and destinations.
   - **3 — CONFIRMED.** Checked position 526 at `0x609b3d1a` and priority-clear conditions reaching `0x609b3d33`.
   - **4 — CONFIRMED.** Checked the shadow replacement and both cached `0xe951[0]` stores, including corrected address `0x609b39f0`.
   - **5 — CONFIRMED.** Direct publication/accessor references and displayed guards are supported. This establishes the bounded direct-call findings, not button-triggered publication.
   - **6 — CONFIRMED.** S1 state stores require the gate result 1; the release helper call bypasses that gate. Both possible table reads in `0x610a3735` are outside this image.
   - **7 — OVERSTATED.** Event pointer, dispatch call and slots 8/10/59 are confirmed. The claimed dispatch-input alternatives omit `0x610a24f3`, which changes D2 from `0x3b` to `0x70` when the indirect call at `0x610a24ed` returns 1. Correct class: STATIC for the listed conditional route, with this additional substitution.
   - **8 — CONFIRMED.** Checked assignment entry 69 and lookup return `0x0a` when alternate is zero. The missing connection through `0x61083022` is honestly reported.
   - **9 — CONFIRMED.** Checked release table pair 10 → `0x610a2fc1`, mode-1 release call, common tail and unresolved indirect calls.
   - **10 — CONFIRMED.** Independently rescanned absolute shadow-address occurrences and the sole direct caller of `0x60983156`; checked its constant stores. Pointer-relative stores remain unexcluded.
   - **11 — CONFIRMED.** Supported within the stated scan bounds. Independently found 366 sliding direct-call encodings for `0x60063431`, with zero matching key windows. The reported zero is the keyed-window count, as explained in the result.
   - **12 — CONFIRMED.** Checked cached-byte condition, latch guard/store, and synchronization call chain through `0x60890a0d`.
   - **13 — SUPPORTED-NOT-INDEPENDENT.** T1 supports value meanings and row/storage mapping; physical-key versus assigned-function binding remains unresolved.
   - **14 — SUPPORTED-NOT-INDEPENDENT.** Zone names are PRIOR T8d. Independently checked the stored-value bytes.
   - **15 — SUPPORTED-NOT-INDEPENDENT.** The cited prior live note supports key `0x000b`, assignment 69, mode-1 start at `0x610a267f`, and unentered archived wrappers.
   - **16 — SUPPORTED-NOT-INDEPENDENT.** Independently inspected the prior records: all twelve T9d edges contain the stated owner/record; T7 reports zero buffers and no writer execution. Attribution is corrected.
   - **17 — CONFIRMED.** Conclusion (c) is justified as “not decided by this submitted static analysis.” Neither equality nor a button-specific byte difference has been established.

   Additional answer-summary issues:

   - **Answers 2 — WRONG.** “Any table value other than 10” does not necessarily skip `0x610a5620`: slot 8 reaches it with mode 3.
   - **Answers 3 — OVERSTATED.** “Both edges use the writer” and “not a second writer” exceed the evidence. Only the identified writer’s formula and bounded absence findings are established.

   Correction-round status against `brief.md` §4:

   - **Item 1 — BLOCKED (honestly reported).** Publication timing and indirect dispatcher/vtable targets remain unresolved.
   - **Item 2 — BLOCKED (honestly reported).** Pointer stores, deeper callees and button-specific input/shadow changes remain unresolved.
   - **Item 3 — BLOCKED (honestly reported).** S1 owner propagation, default assignment-to-dispatch connection, held-button tails and complete release effects remain unresolved. The added custom route is useful but needs the dispatch corrections above.
   - **Item 4 — DONE for the condition and withdrawal; BLOCKED for downstream record effects.** Value 0 plus latch 0 calls synchronization; value 1 skips that call.
   - **Item 5 — NOT DONE completely.** T7 attribution and `0x609b39f0` are corrected. Exact r2 commands are retained, but the r1 supplemental caller scan remains a placeholder in `seal_t14.py`.
   - **Item 6 — DONE.** Conclusion (c), named blockers and the required paired publication evidence follow the correction brief.

5. **Contradictions with established findings:** No remaining contradiction in the revised numbered PRIOR claims. T7 attribution now agrees with its decision’s “Blocked or open” section and correction result §6 claims 11/13. The custom route now agrees with `AFON-MENU-RESEARCH.md` §8.

   Retained r1 call-graph and zone-table assertions remain superseded historical claims; their unconditional equality statements must not be used as current findings.

6. **Alternative explanations** not excluded by the evidence.

   Button-specific callees, queued work, indirect dispatch or pointer stores could change writer inputs, cached shadow state, record selection or rebuild timing. Either button could consume an earlier record. Another indirect writer is not excluded.

   Release paths perform different surrounding work before the shared helper. Pose-dependent cell updates and setting-dependent synchronization effects remain open. These alternatives prevent conclusion (a), without establishing conclusion (b).

7. **Scope and safety:** No emulator run, firmware-image construction, firmware change proposal or hardware recommendation appears in the submitted task work. Evidence scripts target `work/`; Ghidra logs show read-only project processing. The isolation audit reports zero violations and zero allowed changes.

   This review made no writes and ran neither Ghidra nor OM-Emu. The result discloses replacing `result.md` and the manifest; the lookup listing was also overwritten between the 22- and 30-instruction commands, contrary to the correction round’s “new versioned files only” instruction.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Correct claim 7 and Answers 2: include the `0x3b` → `0x70` substitution at `0x610a24f3`; distinguish slot 8’s mode-3 call from slot 10’s mode-1 call.
   2. Rewrite Answers 3 conditionally. Preserve the confirmed writer formula while leaving button-to-writer reachability and alternative writers unresolved.
   3. Supply the exact retained r1 supplemental scan command, or explicitly report it unavailable. Preserve versioned result, manifest and listing snapshots; identify the r1 seal as historical.
   4. State conclusion (c) as undecided by the submitted static evidence. Retain the named blockers and paired stock publication evidence requirement.

   Optional improvements: add an explicit supersession notice for the retained r1 notes/table, and extend the pose-caller listing through `0x60afabdc` so the cited call appears directly in its listing.