# T1 review (Codex Sol, read-only)

1. **Verdict:** ACCEPT-WITH-CORRECTIONS

2. **Baseline checked:** Read `TASK.md`, `brief.md`, `review-brief.md`, `work/result.md`, `work/evidence-manifest.json`, and both templates completely. Read `PROJECT-STATE.md` §§1–3 and reference pins; `AFON-MENU-RESEARCH.md` §§1–3, §6, §8 “How stored settings work,” and “Live acceptance regression and third menu row”; `FEATURE-SPEC.md` requirement revision; and `AF_BUTTON_PROFILES.md` “Menu and settings.” Inspected all five submitted scripts, supporting evidence files, raw inputs, and relevant disassembly. No emulator or Ghidra execution was performed.

3. **Hash verification:** All 31 manifest entries recomputed: **MATCH**.

   - Inputs: `inputs/00_0100_50000020.decoded.bin` — MATCH; `inputs/02_0106_458c0020.decoded.bin` — MATCH. Both match the brief’s required hashes.
   - Sources: `brief.md` — MATCH; `ref/PROJECT-STATE.md` — MATCH; `ref/analysis/button-af/AFON-MENU-RESEARCH.md` — MATCH; `ref/analysis/decompiled-main/all-functions.asm` — MATCH; `ref/analysis/decompiled-main/functions.tsv` — MATCH; `ref/scripts/om_emu_af_live_probe.mjs` — MATCH; `om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin` — MATCH; `om-emu/emu/src/lab/menuwalk.mjs` — MATCH.
   - Outputs under `work/out/`: `afon-binding.txt` — MATCH; `glyph-scan.txt` — MATCH; `glyphs.txt` — MATCH; `labels.json` — MATCH; `menu-toggle-a-first.jsonl` — MATCH; `menu-toggle-a.jsonl` — MATCH; `menu-toggle-b-first.jsonl` — MATCH; `menu-toggle-b.jsonl` — MATCH; `menu-toggle-control.jsonl` — MATCH; `menu-toggle.jsonl` — MATCH; `page27-rows.txt` — MATCH; `readers-0x90a1.txt` — MATCH; `static-dump.txt` — MATCH; `string-ids.txt` — MATCH.
   - Other outputs: `work/proposed-doc-patch.md` — MATCH; `work/result.md` — MATCH.
   - Scripts under `work/scripts/`: `assemble_outputs.py` — MATCH; `dump_page27.py` — MATCH; `glyph_scan.py` — MATCH; `page27_probe.mjs` — MATCH; `string_ids.py` — MATCH.

   `brief_sha256` also matches. Every current work file except the manifest itself is listed. Container and OM-Emu patch pins remain baseline references, not independently verified identities.

4. **Claim-by-claim:** Numbering follows `result.md` §6.

   - **1 — CONFIRMED.** Independently decoded the page descriptor and both 36-byte rows from main-image bytes. IDs, kinds, image numbers, shared pointer, counts, and zero alternate fields match `page27-rows.txt`.
   - **2 — CONFIRMED.** Checked the descriptor-copy branches, stride-12 value matcher, stride-36 row lookup, primary option pointer/count, and matcher call. Compared 376 instruction encodings in the relevant neighborhoods against raw main-image bytes: zero mismatches. The submitted listing is nevertheless incomplete.
   - **3 — CONFIRMED.** Control and both successful toggle logs contain the claimed descriptor sources, kinds, and IDs. This confirms the recorded observation; execution was not independently repeated.
   - **4 — CONFIRMED.** Raw records at `0x6158ba04` and `0x6158ba10` decode to `(1, kind 4, 0x127b)` and `(0, kind 4, 0x124f)`.
   - **5 — CONFIRMED.** Getter results and initial rendered texts agree with native ID/key readback of `[1,1]`. Independently read the corresponding strings from the resource block.
   - **6 — CONFIRMED.** Both successful repeats show top-row commit producing `[0,1]`, then bottom-row commit producing `[0,0]`, with the claimed rendered text and matching ID/key readback after native OK steps. Control remains `[1,1]`. The combined log exactly concatenates the five declared component logs.
   - **7 — CONFIRMED.** Both repeats show detected-subject help before Right, selected-target help after Right, and value 0 after OK. Raw resource strings independently support those meanings. The help-selection implementation remains untraced, as disclosed.
   - **8 — CONFIRMED.** Independently read both resource-0106 name slots and the cited help strings. The page help names the shutter and `@A049@` buttons; it does not establish which row image represents each.
   - **9 — SUPPORTED-NOT-INDEPENDENT.** RELEASE/CUSTOM_SW names, row order, and page help support the inference. Neither image was decoded, and the observations identify screen rows with setting IDs rather than directly identifying their button symbols. Q1 must explicitly remain **UNRESOLVED** under brief §8.
   - **10 — CONFIRMED.** Raw map bytes are `a1900000a1900100`; registration bytes are `a19002000000`. The recorded runtime `[1,1]` differs from the zero payload.
   - **11 — CONFIRMED.** Independently scanned all 80 assignment entries. Entry 2 uniquely matches assignment 69 or function `0x0a`, with the stated bytes.
   - **12 — CONFIRMED.** The exported disassembly contains no `mov 0x90a1`; its 18 direct getter calls have no immediate 2154/2155 argument. The cited AF-start function contains no direct reference to these IDs/key. The byte site lies outside the exported function extent. These are bounded export findings, not proof that indirect readers do not exist.
   - **13 — CONFIRMED.** UNRESOLVED is appropriate: the evidence does not distinguish physical AF-ON input from an assigned function or another custom-switch selector.
   - **14 — CONFIRMED.** The owner observation matches research §1. No new physical AF behavior is established.

5. **Contradictions with established findings:** The correction to `AFON-MENU-RESEARCH.md` §6 is supported: field offsets and strides remain valid; kind-12 row IDs require image interpretation, and `0x127b`/`0x124f` are option strings rather than on/off choices. There is no supported off-by-one field correction.

   `result.md` §1 says `OM_EMU_NVRAM` was “left unset,” conflicting with the required `off` configuration in brief §0 and `PROJECT-STATE.md` §9. The submitted probe does not unset it; the statement needs correction or supporting execution evidence.

6. **Alternative explanations:** The bottom setting could follow the physical AF-ON input, its assigned function, or another custom-switch identifier. Page-help order and RELEASE/CUSTOM_SW names do not directly decode the row images. Option help establishes menu semantics without proving physical AF behavior. Indirect/table-driven readers remain possible despite the negative immediate searches.

7. **Scope and safety:** Submitted Python scripts write beneath `work/`. The probe’s output path is caller-controlled; all listed invocations target `work/out/`. No submitted script writes the OM-Emu checkout or constructs an overlay, firmware image, component, or SD file. No flashing recommendation appears. `afon-binding.txt` describes a conditional owner-camera check; it is not evidence of an executed hardware action. Checkout immutability and inherited NVRAM configuration require the host audit; these artifacts alone cannot prove them. This review remained read-only.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections:

   1. Mark Q1 explicitly **UNRESOLVED**, retaining claim 9 as an inference. State Q2’s supported mapping directly: **1 = detected-subject priority; 0 = always selected-target priority**.
   2. Preserve the actual earlier probe versions, or disclose their absence as a reproducibility deviation. The current script cannot reproduce the control’s label-ID set or the first toggle sequence. `labels.json` also omits IDs touched in those earlier runs, including `0xff0`, `0xff2`, `0x5b4`, and `0xc6`.
   3. Supply complete bounded instruction listings for the claimed ranges. `page27-rows.txt` currently contains selected instructions, despite claiming full ranges and byte counts.
   4. Correct `readers-0x90a1.txt`: the pointer following the 2155 descriptor at `0x60621340` is **`0x606190b7`**, not `0x606190b9`.
   5. Reconcile the NVRAM statement with the required `off` environment. Describe §6’s correction as kind/meaning interpretation, not a demonstrated field-offset shift.

   Optional improvements: Give initial and successful repeats distinct run IDs; clarify that the control checks navigation to the page without exercising the editors.