# T2-cell-ownership result

1. **Task identifier and brief version used:** T2-cell-ownership, correction round after Sol review `run-20261117-220006-review` (REJECT). Brief sha256 is in `work/evidence-manifest.json`. Section 0 was followed: writes are under `work/` only, `OM_EMU_NVRAM` points at a file under `work/out/` for each run, and no earlier script or output was overwritten.

2. **Research baseline used:** `TASK.md`, `brief.md` (including section 11), `audit/previous-review.md`, `templates/result.md`, `ref/PROJECT-STATE.md` §§1–3, `ref/analysis/button-af/AFON-MENU-RESEARCH.md` (storage and the AF target table), and the existing decompiled listing `ref/analysis/decompiled-main/all-functions.asm`. Decoded main sha256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` (33554368 bytes). Resource 0106 sha256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. The container pin and the OM-Emu pin were not re-hashed. Ghidra was not launched. The export was byte-checked: 4805945 instruction lines, 0 mismatches (`work/out/classify-5b82-v1.txt`).

3. **Work performed:**
   - `python -I work\scripts\classify_5b82_v1.py` (exit 0). Disposition of every `82 5b` hit and every `0x5b8` immediate, plus the route listings.
   - A later edit of `work/out/candidates-5b82.tsv` changed the two data rows at `0x607c69f4` and `0x607cb986` from "other meaning" to "not code". The classifier report still shows the earlier count.
   - An aligned-word scan for pointers into `0x602ec000..0x602ec500`. Record: `work/out/debug-slot-scan-v1.txt`.
   - Emulator probes, each with its own NVRAM file. `own_5b82_v14.mjs` through `own_5b82_v20.mjs` did not finish a saved C1 cycle. `own_5b82_v21.mjs` did, twice marked (`mark-w`, `mark-x`) and once as control (`control-p`). Summary: `work/out/c1-cycle-v21.txt`.

4. **Files examined:** the round-1 `work/out/uses-5b82.tsv`, `work/out/verdict.md`, and `work/out/listings-5b82.txt`; decompiled functions `604193ca`, `6041937f`, `60063962`, `6006398b`, `60063684`, `60063567`, `600630a3`, `618cfda1`, `6183dcee`; UI map entries at `0x606274e0`, `0x60627518`, `0x60627524`; registration record at `0x600e5874`; debug slots `0x602ec448` and `0x602eda1c`.

5. **Files created:** every file under `work/` is hashed in `work/evidence-manifest.json`. The correction's new products are `work/out/candidates-5b82.tsv`, `work/out/uses-5b82-v2.tsv`, `work/out/listings-5b82-v2.txt`, `work/out/verdict-v2.md`, `work/out/af-profile-fields-v1.txt`, `work/out/c1-cycle-v21.txt`, and the `dynamic-5b82-mark-o` through `mark-x` and `control-o` / `control-p` logs. Round-1 files were left in place.

6. **Findings:**

   1. STATIC. No instruction encodes the immediate `0x5b82`. The image has 53 raw `82 5b` byte hits and 97 instruction immediates whose token is `0x5b8`. All 29 `mov` sites Sol listed are in that set. None of those `mov` sites is followed by a shift that builds key `0x5b82`. Evidence: `work/out/classify-5b82-v1.txt`, `work/out/candidates-5b82.tsv`.

   2. DATA. The four real key uses among those bytes are the registration at `0x600e5874` (count 16, width 2, 32 zero default bytes) and the three UI map entries: id 2017 index 5, id 2031 index 12, id 2034 index 13. Evidence: `work/out/af-profile-fields-v1.txt`.

   3. STATIC. `FUN_6041937f` writes the mapped index only. `FUN_604193ca` calls `FUN_60063962` with the key and no index, and `FUN_6006398b` copies the ROM default over the whole key. The only caller of `FUN_604193ca` is `FUN_618cfda1`, which does not pass 2017, 2031, or 2034. Evidence: `work/out/listings-5b82-v2.txt`, `work/out/uses-5b82-v2.tsv`.

   4. OBSERVED-EMU. A direct call of `FUN_6041937f` with `0x2222` changes one named cell: index 5, 12, or 13. A direct call of `FUN_604193ca(2017)` sets all 16 cells to 0. Evidence: `work/out/dynamic-5b82-mark-w.jsonl`.

   5. OBSERVED-EMU. Two marked sessions and one control completed Assign to C1, a live change of the unnamed cells, Recall, a posted M save, and a second session. The second session restored the live change, not the values from Assign time, and the named cells stayed 3200. The runs agree. Evidence: `work/out/c1-cycle-v21.txt`.

   6. STATIC. The debug handler pointer `0x600619a9` is stored at `0x602ec448` and `0x602eda1c` only. No aligned word points at those slots. Evidence: `work/out/debug-slot-scan-v1.txt`.

   7. DATA. The selected AF profile is 12 bytes: three zone-type bytes (`0x99a1` indices 0, 2, 4), one target-size byte (`0x9a41` index 0), three position halfwords (`0x5962` indices 0, 2, 4), and the current custom height and width (`0x1dd1` indices 0 and 1). With magic, version, length, and a CRC-16, that uses 18 of the 26 unnamed bytes. The four custom presets plus the step table need 16 more bytes and do not fit (34 against 26). Evidence: `work/out/af-profile-fields-v1.txt`, `work/out/verdict-v2.md`.

   8. INFERRED. All-zero fails the magic `0xA70F`. The stock named value `0x0C80` fails it. A ROM-zero reset of this key decodes as no profile. The round-1 six-dword layout is withdrawn.

   9. INFERRED. The key is UNRESOLVED. Normal use that was exercised does not rewrite the unnamed cells, and a direct whole-key default does zero them but is not reached for these UI ids. `FUN_6183dcee` and one parameter-key caller of the span copier are not proved unable to carry `0x5b82`. That gap blocks OWNABLE. Do not hand the cells to T3.

7. **Evidence for each claim:** the file named on that claim. Candidate rows are one per Sol address plus the four key uses and the `0x5b8` immediates (150 data rows). Use-table rows for the omitted routes are the last 12 rows of `work/out/uses-5b82-v2.tsv`.

8. **Tests and outcomes:**
   - PASS. Byte-check of the exported listing, 0 mismatches.
   - PASS. Candidate disposition covers every listed `82 5b` hit and every listed `mov 0x5b8`.
   - PASS. Mapped setter, direct call, one index each. `dynamic-5b82-mark-w.jsonl`.
   - PASS. Whole-key default, direct call, all 16 cells become 0. Same log. This is a direct call, not a menu press.
   - PASS. C1 Assign, live change, Recall, posted save, second session. `mark-w` and `mark-x` agree. Control `control-p` matches on the named cells and also keeps the live change. `c1-cycle-v21.txt`.
   - BOUNDARY. The cursor editor for UI ids 2017, 2031, and 2034 was not opened. The menu tabs that were walked have no Toy Photo, Vintage, or Partial Color row. The movie Custom Mode row (`@A027@Custom Mode`) is present and draws "This item cannot be selected". The stills row (`@A02C@Custom Mode`) is the one the C1 cycle used.
   - BOUNDARY. `own_5b82_v14.mjs` through `v20.mjs` did not complete a saved recall. `v17` exited 1 because `mode_dial` was sent as a dial input. Their logs stay as the record of those attempts. `mark-t` and `mark-u` loaded stock on session 2 because no save had posted; the live cells were still the second pattern at the menu-close read.
   - The round-1 `0x1111` writes are probe-induced.

9. **New versus previously established:** Claims 1–4 and 6–9 are new relative to the rejected round. Claim 5 confirms that unnamed cells can persist across a save, and it adds the C1 cycle the review asked for. Claim 9 contradicts `work/out/verdict.md`, which says OWNABLE. `work/out/verdict-v2.md` is the corrected verdict.

10. **Remaining uncertainties.**
    - `FUN_6183dcee` can whole-key-default a key taken from a record. No static immediate of `0x5b82` was found on that path. A runtime record that names the key was not ruled out.
    - `FUN_6183cc7d` can pass a parameter key to the span copier. The same limit applies.
    - The cursor pages themselves were not operated. The direct setter call shows the index behaviour of the function those pages use.
    - Keys `0x5b52`, `0xf5f1`, and `0xf5e1` were not analysed.

11. **Recommended next actions.** Leave `0x5b82` unused. Close the two parameter-key paths, or move to the next candidate key. Do not treat `work/out/verdict.md` as current.

12. **Deviations from the brief.** The round-1 verdict file was left as it was, and the corrected verdict was written to `work/out/verdict-v2.md`, so a reader who opens the old file still sees OWNABLE there. This result and `verdict-v2.md` withdraw it. The other three candidate keys were not started. `0x5b82` is unresolved, so the stopping rule (one OWNABLE array) was not met. Section 11's six items for this key are the work this round completed.
