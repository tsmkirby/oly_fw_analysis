# T4: Packaging analysis for the AF-ON zone row (static; no prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra (OM-Emu only for read-only checks) · Runs concurrently with T5

## 0. Rules that override everything below

- **Workspace.** This is a disposable execution workspace. Write **only** under `work\`. `ref\` is
  read-only. Run Ghidra only through `tools\bin\run-ghidra.cmd`, and Node as `node26`.
- **Commands.** Run every command through the T3j wrapper (`run_logged`, with script hashes). Never edit a
  script after it has run. Keep the manifest complete.
- **This is analysis only.** No firmware image, no component, no SD file and no hardware recommendation.
  Do not choose storage; storage is the owner's question Q7.
- **Proposals.** Proposals are proposals. Label every claim STATIC, DATA, OBSERVED-EMU, INFERRED or
  HYPOTHESIS.

## 1. Background (read first)

- `ref\analysis\button-af\readiness\t3-afon-zone-row\README.md`, with its "How it works" table, and
  `design\*.md`.
- `ref\HARDWARE-STAGE0-RECORD.md`: section map, compression, owned RAM and owned tails, placement and
  alignment rules.
- `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §8: queue-95 placement and the archived installer.
- `ref\PROJECT-STATE.md` §6: Q4 and Q6.

The prototype changes the following:

**Runtime writes into compressed section 7.** These live in section 7 and the prototype rewrites them at
runtime:
- the page-27 row pointer and count;
- the provider source record;
- the action-table pointer and count;
- the binding directory entry for key 8;
- the descriptor hash link;
- the face-record substitution.

**Overlay bytes and copies.**
- 368 overlay bytes in the section-1 tail.
- A 10,008-byte copy of the binding array at scratch `0x60320000`, inside section 1's `0xFF` area. That
  area is not owned.

**EMULATOR-ONLY hooks.** Value get and set for `0x3D6F`.

## 2. Questions to answer, each with evidence

1. **How section 7 can be modified.**
   - How is section 7 compressed, decompressed and loaded at boot? Give the algorithm, the loader
     addresses and any checksums.
   - Compare two options:
     - (a) editing section 7 and recompressing it, with the size and integrity implications;
     - (b) a runtime installer that rewrites the section-7 fields after decompression, with the hook point
       and the timing (before the first menu use) and where its code lives.
   - The stage-0 record already names candidate placement areas. Re-check them against this payload.
2. **A home for the binding array.** The binding lookup (`FUN_6124f4e5`) walks a pointer and count from the
   key-8 directory entry. Is there any way to add record `0x1e6` without relocating all 10 KB?
   - For example: a spare, unused or duplicate record in the array that could be repurposed (prove it is
     unused); a second directory key; or the lookup falling through to another table.
   - If relocation is unavoidable, find owned space of at least 10,008 bytes. Prove ownership to the
     stage-0 record's standard, or state that none exists.
3. **The face-table key.** All 96 keys are in use. Can a new record be added the same way, by relocating the
   face table and redirecting its pointer and count? Where does that pointer live?
4. **The descriptor registration.** The hash table is built at runtime by `FUN_60405865` from the
   1712-record table at `0x6061912c`. How does a native build register the `0x3D6F` descriptor: by
   extending that table (which section?) or by a post-build link?
5. **Native value routing.** Where do native get and set for `0x3D6F` have to branch? List the code sites
   and the space each one needs. This does **not** decide where the value is stored.
6. **Total payload.** Give a byte budget per area, with the alignment rules, and identify any conflict with
   the archived queue-95 installer placement or the section-4 tail (Q6).

## 3. Deliverables (under `work\`)

`result.md` (template); `evidence-manifest.json`; `out\packaging.md` (answers 1–6, with a recommendation
per item labelled as such); bounded listings; `out\cmd\`; scripts.

## 4. Out of scope

Building or testing an installer, any image, storage choice, and hardware.

## 5. Correction round (Opus, after Sol's review `run-20261118-150331-review`: REJECT)

Your previous work is in `work\`. Sol's full review is `audit\previous-review.md`. Do **not** start over;
the confirmed measurements stand. Save every new script and output under a **new, unique name** (`-c1`
suffix onward); never overwrite a file a run used or wrote. Write the corrected answers to
`out\packaging-c1.md` and update `result.md`.

**New evidence allowed (one change of approach).** Besides static analysis you may run your private
OM-Emu copy on the **stock** image (no overlay, `OM_EMU_NVRAM` off) with read/write/execute watchpoints,
through the command wrapper, to answer items 1 and 5. Patch nothing; log every hit with its PC.

1. **Duplicate binding `0x615c6234`.** Withdraw the unconditional reuse. Either show no reader reaches it
   (for example a stock OM-Emu run with a read watch on `0x615c6234`–`0x615c624b` and on the directory
   entry `0x615cc934`–`0x615cc93b` from boot through opening pages 25–28 and their editors, plus a static
   search for computed indexing into the array), stating exactly which paths were exercised, or keep it as
   a labelled conditional hypothesis with binding placement unresolved.
2. **Face patch.** Replace the five-byte proposal at `0x611f7f42` with a control-flow-preserving design that
   accounts for the incoming `bne` at `0x611f7f3e` → `0x611f7f44`. Give its listing and bytes.
3. **Budget, separated.** Tabulate separately: changed image bytes; reserved resident space; runtime
   destinations; helper code. Budget the eight-byte hash node separately (376 bytes with the node, within
   the existing 452-byte span, before additional code).
4. **Unsized code.** Give each of installer, getter/setter stubs, face helper, node initialization and
   bucket publication, and runtime code-patch synchronization (instruction-cache concerns for section-7
   code patches) a size, or mark it explicitly as an unresolved quantity. Do not claim a complete total.
5. **Bound and order.** Limit checksum and decompression conclusions to the code actually listed (complete
   the flash-entry and flash-read listings through their callees, or label the rest unexamined). Establish,
   by the watchpoint run or by listing the caller chain of `0x6040476d`, the order of: descriptor build
   (`FUN_60405865`), the key-port hook point `0x6017a5fc`, and the first menu access to the binding
   directory. If it is not established, say so.
6. **Wording.** Replace "no owned region exists" with "no qualifying region was established"; keep Q6 and
   the archived-placement conflict open. Fix the head-copy call address (`0x60021187`) and remove listing
   ranges that start inside instructions (`0x60045f70`, `0x60046040`). Refresh the manifest last.
