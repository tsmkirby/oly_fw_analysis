# T1 review (Codex Sol, read-only)

1. **Verdict:** ACCEPT

2. **Baseline checked:** Read `TASK.md`, `review-brief.md`, `brief.md` including §11, `audit/previous-review.md`, updated `work/result.md`, the manifest, required evidence files, and both templates. Read `PROJECT-STATE.md` §§1–3, §9 and reference pins; `AFON-MENU-RESEARCH.md` §§1–3, §6, §8 “How stored settings work” and “Live acceptance regression and third menu row”; `FEATURE-SPEC.md` requirement revision; and `AF_BUTTON_PROFILES.md` “Menu and settings.” Inspected submitted scripts, recorded menu observations, resource strings, and raw main-image bytes. Used PowerShell only; did not execute Ghidra or OM-Emu.

3. **Hash verification:** All **41 manifest entries MATCH**. All declared output sizes also match.

   - Inputs: `inputs/00_0100_50000020.decoded.bin` — MATCH; `inputs/02_0106_458c0020.decoded.bin` — MATCH. Both match the brief’s required hashes.
   - Sources: `brief.md` — MATCH; `ref/PROJECT-STATE.md` — MATCH; `ref/analysis/button-af/AFON-MENU-RESEARCH.md` — MATCH; `ref/analysis/decompiled-main/all-functions.asm` — MATCH; `ref/analysis/decompiled-main/functions.tsv` — MATCH; `ref/scripts/om_emu_af_live_probe.mjs` — MATCH; `om-emu/unpacked/E147/OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin` — MATCH; `om-emu/emu/src/lab/menuwalk.mjs` — MATCH.
   - Outputs under `work/out/`: `afon-binding.txt` — MATCH; `glyph-scan.txt` — MATCH; `glyphs.txt` — MATCH; `labels.json` — MATCH; `menu-toggle-a-first.jsonl` — MATCH; `menu-toggle-a.jsonl` — MATCH; `menu-toggle-b-first.jsonl` — MATCH; `menu-toggle-b.jsonl` — MATCH; `menu-toggle-control.jsonl` — MATCH; `menu-toggle.jsonl` — MATCH; `page27-listing.log` — MATCH; `page27-listing.txt` — MATCH; `page27-rows.txt` — MATCH; `pointer-0x60621340.txt` — MATCH; `readers-0x90a1.txt` — MATCH; `repro-a-first.jsonl` — MATCH; `repro-b-first.jsonl` — MATCH; `repro-control.jsonl` — MATCH; `static-dump.txt` — MATCH; `string-ids.txt` — MATCH.
   - Other outputs: `work/proposed-doc-patch.md` — MATCH; `work/result.md` — MATCH.
   - Scripts under `work/scripts/`: `assemble_outputs.py` — MATCH; `check_pointer.py` — MATCH; `dump_page27.py` — MATCH; `glyph_scan.py` — MATCH; `page27_probe.mjs` — MATCH; `page27_probe_control.mjs` — MATCH; `page27_probe_first.mjs` — MATCH; `Page27List.java` — MATCH; `string_ids.py` — MATCH.

   `brief_sha256` also matches. Every current work file except the manifest itself is listed. Container and OM-Emu patch pins remain reference identities, not independently rehashed artifacts.

4. **Claim-by-claim:** Numbering follows `result.md` §6.

   - **1 — CONFIRMED.** Independently decoded the page descriptor, both 36-byte rows, shared options pointer/count, and zero alternate fields from raw main-image bytes.
   - **2 — CONFIRMED.** Checked the descriptor branches, option matcher, row stride and field accesses, and matcher call. Both listing files contain all **620 instructions covering 1,340 bytes**, with no gaps or raw-byte mismatches: `0x611c7785–0x611c782e` (170 bytes), `0x611c782f–0x611c7893` (101), `0x61203a81–0x61203e80` (1,024), and `0x61204065–0x61204091` (45).
   - **3 — CONFIRMED.** Independently inspected the recorded descriptor-copy observations for both row sources and the title. Emulator execution was not repeated.
   - **4 — CONFIRMED.** Raw option records decode to value 1/kind 4/string `0x127b`, then value 0/kind 4/string `0x124f`.
   - **5 — CONFIRMED.** Recorded getter strings, rendered initial texts, and native ID/key readbacks agree. Independently read the corresponding resource strings.
   - **6 — CONFIRMED.** Both successful logs show `[1,1] → [0,1] → [0,0]`, with matching setting IDs, native-key commits, and rendered texts. Control remains `[1,1]`. The combined log exactly concatenates its five declared components.
   - **7 — CONFIRMED.** Both logs show detected-subject help before Right and selected-target help afterward, followed by storing 0 on OK. Independently read both help strings from resource bytes. Help-selection implementation remains untraced.
   - **8 — CONFIRMED.** Independently read both resource-0106 name slots and page-help text. These identify RELEASE/CUSTOM_SW names and the two named buttons, without decoding the row images.
   - **9 — SUPPORTED-NOT-INDEPENDENT.** The shutter = 2154 / `@A049@` button = 2155 inference is supported by names, order, and help. Q1 now correctly remains **UNRESOLVED**.
   - **10 — CONFIRMED.** Raw map bytes are `a1900000a1900100`; registration bytes are `a19002000000`. Recorded runtime values differ from the zero payload.
   - **11 — CONFIRMED.** Independently scanned all 80 assignment entries. Only entry 2 matches assignment 69 or function `0x0a`.
   - **12 — CONFIRMED.** Rechecked the negative immediate search, 18 direct getter-call neighborhoods, AF-start listing, and exported function extent. These support the bounded export findings, without excluding indirect readers. The corrected descriptor pointer independently matches raw bytes.
   - **13 — CONFIRMED.** UNRESOLVED appropriately describes the missing distinction between physical AF-ON input, assigned function, and another custom-switch selector.
   - **14 — CONFIRMED.** The owner observation agrees with `AFON-MENU-RESEARCH.md` §1. No additional physical AF behavior is established.

5. **Contradictions with established findings:** None requiring correction. The interpretation update to `AFON-MENU-RESEARCH.md` §6 is supported: existing offsets remain valid; kind 12 identifies images and kind 4 identifies strings. The NVRAM wording now agrees with brief §0 and `PROJECT-STATE.md` §9. Historical environment inheritance is not independently proven by these artifacts; the present reviewer shell has that variable unset.

6. **Alternative explanations:** The bottom setting could follow physical AF-ON input, its assigned function, or another custom-switch identifier. Names and page-help order do not decode the row images. Menu semantics do not independently establish physical AF behavior. Indirect or table-driven AF-path readers remain possible.

7. **Scope and safety:** This review made no writes. Submitted scripts direct their listed outputs beneath `work/`; no submitted code constructs a firmware image, component, overlay, or SD file. No checkout writes or flashing recommendations were identified. The result and binding evidence describe a conditional owner-camera check already contemplated by brief §8; no hardware action is recorded. Historical checkout immutability requires the host audit.

8. **Required corrections** (numbered, minimal) and **optional improvements**.

   Required corrections: **none outstanding**. Corrections 1–5 are assessed as follows:

   1. **DONE.** `result.md` §6 explicitly marks Q1 UNRESOLVED, preserves claim 9 as INFERRED, and directly states **1 = detected-subject priority; 0 = always the selected AF target position**.
   2. **DONE.** §12 discloses overwritten probe versions. Restored control/first-toggle scripts preserve the relevant label sets, 180-byte reads, and original key sequence. All three reproduction files are byte-identical to their preserved originals. `labels.json` covers all 21 explicitly queried IDs, including `0xff0`, `0xff2`, `0x5b4`, and `0xc6`.
   3. **DONE.** Complete bounded listings include every instruction, address, and byte. Independently verified all ranges against the decoded main using offset = address − `0x60021020`. `Page27List.java` does not modify the program; the supplied Ghidra log records read-only processing and execution of that script.
   4. **DONE.** Raw bytes at `0x60621344` are `b7906160`, confirming **`0x606190b7`** after the 2155 descriptor. `0x606190b9` follows 2156 at `0x60621358`.
   5. **DONE.** Sections 1 and 12 reconcile the NVRAM statement with the prescribed `off` environment. Sections 6 and 9 and `page27-rows.txt` consistently describe a kind/meaning correction with unchanged offsets.

   Optional improvements: Qualify the final sentence of `readers-0x90a1.txt` as the *inferred* shutter/index mapping. Record the effective NVRAM environment in future probe logs. Distinct initial/repeat names and the control’s editor limitation are now documented.