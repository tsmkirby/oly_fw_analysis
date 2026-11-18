# T4-afon-packaging result

1. **Task identifier and brief version used:** T4, packaging analysis for the AF-ON zone row. Brief `brief.md` in this workspace, dated 2026-11-18. Section 0 of that brief was followed. Answers are in `work/out/packaging.md`.

2. **Research baseline used:** `brief.md`; `TASK.md`; `templates/result.md`; `ref/HARDWARE-STAGE0-RECORD.md`; `ref/PROJECT-STATE.md` (Q4, Q6, Q7); `ref/analysis/button-af/AFON-MENU-RESEARCH.md`; `ref/analysis/button-af/readiness/t3-afon-zone-row/README.md` and `design/T3f-binding.md`, `T3g-descriptors.md`, `T3h-faces.md`, `T3i-design.md`; `ref/contribution/docs/format/CONTAINERS.md`; `ref/contribution/docs/safety/CODE_SPACE.md`; `ref/tooling/om-emu/docs/model-survey.md`. Measurements read `ref/analysis/button-af/readiness/t3-afon-zone-row/t3j/overlay-changed-bytes.csv` and `ref/analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv`.

   Input hashes, command 10, `python -I`:

   - `brief.md` — `62cf2c9bb55fceba77304a9eb03b1dc5e3577b70b83fd9c70f53ac6893ffbc32` — 4,266 bytes
   - `inputs/00_0100_50000020.decoded.bin` — `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` — 33,554,368 bytes. Same hash as `ref/tasks/T3j-afon-acceptance-assertions/run-20261118-132500/work/evidence-manifest.json`.
   - `inputs/02_0106_458c0020.decoded.bin` — `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059` — 143,523,776 bytes. Same hash as that T3j manifest.

   No OM-Emu patch was applied. This task did not run OM-Emu.

3. **Work performed:** every command through `node26 work/scripts/run_logged.mjs`. Wrapper sha256 `e00170efc367d0ed4c145db59bd6a84738688554f6904980ea382f6494325d15`. All exits 0. Records in `work/out/cmd/`.

   1. `node26 work/scripts/run_logged.mjs 01 python -I work/scripts/pack_static_t4.py` — 2026-11-18T19:16:16Z to 19:16:19Z. Section table, FF runs, binding and face and descriptor scans, overlay overlap.
   2. `node26 work/scripts/run_logged.mjs 02 python -I work/scripts/pack_more_t4.py` — duplicate records, face-key difference, descriptor-end context.
   3. `node26 work/scripts/run_logged.mjs 03 python -I work/scripts/append_ranges_t4.py` — extra disassembly ranges.
   4. `node26 work/scripts/run_logged.mjs 04 tools\bin\run-ghidra.cmd -postScript T4List.java work/out/disasm-ranges-full.txt work/out/xrefs-t4.txt -log work/out/ghidra-t4.log` — 2026-11-18T19:19:47Z to 19:19:51Z. Spawn was `cmd.exe /d /c` of that launcher. Ghidra 12.2 PUBLIC, `-noanalysis -readOnly` from the launcher.
   5. `node26 work/scripts/run_logged.mjs 05 tools\bin\run-ghidra.cmd -postScript T4List.java work/out/disasm-ranges-c.txt work/out/xrefs-t4c.txt -log work/out/ghidra-t4c.log` — 2026-11-18T19:22:44Z to 19:22:47Z. Remainder of the third binding walk, and the default writer.
   6. `node26 work/scripts/run_logged.mjs 06 node26 -p process.version` — v26.12.1.
   7. `node26 work/scripts/run_logged.mjs 07 python -I -c "import sys; print(sys.version)"` — 3.12.7.
   8. `node26 work/scripts/run_logged.mjs 08 java -version` — OpenJDK 25.0.5+8.
   9. `node26 work/scripts/run_logged.mjs 09 python -I work/scripts/check_listings_t4.py` — 1,329 listing rows, 0 mismatches.
   10. `node26 work/scripts/run_logged.mjs 10 python -I work/scripts/hash_inputs_t4.py` — hashes in section 2.
   11. `node26 work/scripts/run_logged.mjs 11 python -I work/scripts/write_manifest_t4.py` — writes `work/evidence-manifest.json`. Its exit is `work/out/cmd/11.exit`, written by the wrapper after the script returns, so the manifest lists commands 01–10 only.

4. **Files examined:** the decoded main image and resource image above. Ghidra program `00_0100_50000020.decoded.bin` in the private project `projects/OM3_main_full`, read only. Disassembly ranges and the listings they produced:

   - `0x60045ed5` loader, `0x60045e6c` end selector, `0x600232d1` flash entry, `0x600455c5` boot task, `0x60045f44` section init
   - `0x6124f4e5`, `0x6124f55e`, `0x6124f63d` (continued from `0x6124f67c`) binding walks
   - `0x60405865` descriptor builder, `0x604058bc` lookup, `0x604048f5` and `0x60405a6c` uses of the table end
   - `0x6041931e` getter, `0x6041937f` setter, `0x604193ca` default writer, `0x60419446` mapped, `0x60419696` index
   - `0x611f7f01` face walk, `0x6017a5fc` key-port hook, `0x600210e0` reset head copies
   - directory `0x615cc934`, key-8 array `0x615c540c`, face table `0x6037bedc`, descriptor table `0x6061912c`

   Xrefs from Ghidra's reference manager: `work/out/xrefs-t4.txt`.

5. **Files created:** everything under `work/`, and nothing outside it. The manifest lists each file with sha256 and byte length. Principal outputs: `work/out/packaging.md`, `work/out/static-t4.txt`, `work/out/static-t4b.txt`, `work/out/listings/*.txt`, `work/out/xrefs-t4.txt`, `work/out/cmd/01` through `11`, `work/scripts/*.py`, `work/scripts/T4List.java`, `work/scripts/run_logged.mjs`, this file, and `work/evidence-manifest.json`.

6. **Findings:**

   1. STATIC. The section loader at `0x60045ed5` copies source to destination for length `end - dest`, mode `0x10200`, and never reads the descriptor's third word. A non-zero flash status is logged. There is no sum of the copied bytes.
   2. DATA. Section 7 is destination `0x6103f000`, source `0x5101e000`, third word `0x1`, in place, length 6,340,608, end immediate `0x6164b000` at `0x60045ea2`. Sections 6 and 7 are the only rows with third word 1.
   3. DATA. Neither decoded image contains an `olycompress` magic. Section 7's stored bytes at `0x6124f4e5` are the plain instruction `f8972004`.
   4. INFERRED. This loader would not expand an LZ4 or `olycompress` body. A length-preserving edit of section 7 has no section checksum to repair. The `OE` additive trailer is not in this input.
   5. DATA. Key 8's 416 records occupy `0x615c540c`–`0x615c7b0c`. The next bytes are key 15's first record. Editor `0x1e6` is absent from all fourteen arrays. Editor `0x216` occurs twice, at `0x615c59dc` and `0x615c6234`, and the 24 bytes are identical. No image word points at either address. The only word equal to the array base is the directory pointer at `0x615cc938`.
   6. STATIC. All three functions that embed `0x615cc934` (`0x6124f4e5`, `0x6124f55e`, `0x6124f63d`) return on the first matching editor id. A miss returns. There is no second-table fall-through.
   7. DATA. No loaded section has a `0xFF` run of 10,008 bytes. The longest are 1,912 bytes (section 4) and 1,776 bytes (section 1). `0x60320000` for 10,008 bytes is `0xFF` and lies in the unloaded gap `0x6031f000`–`0x603ba800`.
   8. DATA. The face table `0x6037bedc` has 96 records of `0x24` bytes and 96 unique keys, and every key is selected by some binding record's word at +16. The 36 bytes at `0x6037cc5c` are a live pointer table.
   9. STATIC. The face base is the immediate of `add 0x6037bedc,A2` at `0x611f7f35`, once in the image. The count is `cmp 0x60,D2` at `0x611f7f47`. The table is inside the reset-head copy `0x60357000`–`0x60387094`, mode `0x10200`, and not inside any of the ten loaded sections.
   10. DATA. The descriptor table `0x6061912c` has 1,712 records of 20 bytes in uncompressed section 2. `0x3D6F` is absent. `0x606216ec` is the base of the next structure (`add 0x606216ec,A2` at `0x604048f5`), and the bytes there are not `0xFF`.
   11. STATIC. `FUN_60405865` builds 128 RAM buckets at `0x62a84970`. The bucket for `0x3D6F` is `0x62a84b2c`. The lookup walks that chain.
   12. STATIC. For id `0x3D6F` the index getter and the mapped getter both return 0 (`cmp 0x3c5f` then `clr D0`). The getter at `0x6041931e` is 5 bytes to an instruction boundary. The setter at `0x6041937f` is 6 bytes. The default writer at `0x604193ca` is 7 bytes and does not store when the mapped key is 0.
   13. DATA. The archived placement changes 3,612 bytes in sections 1, 2, and 4, including the 5-byte prologue at `0x6017a5fc` and section-4 bytes through `0x60a8f7d4` (43 bytes left). 349 of the 368 overlay addresses are in that set, including the help list overlapping the installer at `0x6031ead0`.
   14. DATA. The three stage-0 tails are `0xFF`. A whole-image pointer scan found 3 hits in the section-1 tail, 0 in the section-2 tail, and 9 in the section-4 tail. One is the constructor immediate `0x60a8f088` at `0x60215407`, and that constructor's count is still 0.

7. **Evidence for each claim:**

   1. `work/out/listings/loader.txt` (`0x60045ed5` through the status check and the bit set at `0x60045f33`). `work/out/listings/boot-task.txt` line with `mov 0x7,D0` at `0x600457ea`. `work/out/xrefs-t4.txt` target `0x60045ed5`.
   2. `work/out/static-t4.txt` section-descriptor dump. End immediate in `work/out/listings/end-selector.txt` at `0x60045ea2`.
   3. `work/out/static-t4.txt` magic scan. `work/out/listings/binding.txt` first line `6124f4e5 f8972004`.
   4. Same listings, plus `ref/contribution/docs/format/CONTAINERS.md` for the trailer that is not in this input. File start is not `OE` (`work/out/static-t4.txt`).
   5. `work/out/static-t4.txt` directory and id scans. `work/out/static-t4b.txt` the two `0x216` records.
   6. `work/out/listings/binding.txt`, `binding-next.txt`, `binding-third.txt`, `binding-scan.txt` (`0x6124f68d` `bne`, `0x6124f691` `bra`).
   7. `work/out/static-t4.txt` FF-run section and the `0x60320000` check.
   8. `work/out/static-t4.txt` face keys. `work/out/static-t4b.txt` the words at `0x6037cc5c`.
   9. `work/out/listings/face.txt` at `0x611f7f35` and `0x611f7f47`. `work/out/listings/head.txt` end word `0x60387094` and the copy at `0x60021169`.
   10. `work/out/static-t4.txt` descriptor scan. `work/out/listings/desc-end-a.txt` at `0x604048f5`.
   11. `work/out/listings/builder.txt` `cmp 0x6b0,D1` at `0x604058b3` and the bucket base. `work/out/listings/lookup.txt`.
   12. `work/out/listings/index.txt` `0x604196ed` and `0x60419704`. `work/out/listings/mapped.txt` `0x6041962d` and `0x6041968c`. `work/out/listings/getter.txt`, `setter.txt`, `default-writer.txt`.
   13. `work/out/static-t4.txt` archived-span and overlap sections. Prologue bytes in `work/out/listings/hook.txt`.
   14. `work/out/static-t4.txt` tail-pointer scan. Constructor bytes noted there and in the stage-0 record.

   Command 09 compared every listing hex byte with the main image: `work/out/cmd/09.out` says `rows 1329 mismatches 0`.

8. **Tests and outcomes:**

   - Commands 01–10: PASS (exit 0).
   - Listing bytes against the image: PASS (1,329 rows, 0 mismatches).
   - Input hashes against the T3j manifest: PASS.
   - Ghidra logged an OS-truststore "Access is denied" and continued. The listings still match the image. PASS for the disassembly, with that warning left as it was. No ACL change was attempted.
   - OM-Emu was not run. BOUNDARY. Prior menu acceptance stays in the T3j record and was not repeated.
   - No installer and no image were built. That is the brief's scope, not a test.

9. **New versus previously established:**

   1. Confirms the loader addresses in `HARDWARE-STAGE0-RECORD.md`. New: the listing shows the third word is not read and the copy is mode `0x10200`.
   2. Confirms the section-7 range and flag value in that record.
   3. New. Contradicts the algorithm half of `HARDWARE-STAGE0-RECORD.md` Finding 2 (compressed stream that must be re-encoded). The flag value is not contradicted.
   4. New, from claim 1 and `CONTAINERS.md`.
   5. Confirms key 8, count 416, and the absence of `0x1e6` from the T3 binding notes. New: the identical second `0x216` record, and the proof that the next 24 bytes belong to key 15.
   6. Confirms the first walker's first-match behavior. New: the same behavior in the second and third walkers, including the scan that starts at `0x6124f67c`.
   7. Confirms the stage-0 tail sizes. New: no loaded `0xFF` run reaches 10,008, and `0x60320000` is outside every loaded range and every head copy.
   8. Confirms `T3h-faces.md` that all 96 table keys are selected. New: the following pointer table blocks an append.
   9. New measurement of the head-copy range that contains the table. Confirms the base immediate used by the prototype.
   10. Confirms the table base, stride, and count in `T3g-descriptors.md`. New: the end address is a live base, so the table cannot grow in place.
   11. Confirms the builder and the bucket formula. The post-build link is the recommendation in `work/out/packaging.md` section 4, not a new executed registration.
   12. New. The prototype's routing question is answered with site sizes. No store was chosen.
   13. Confirms the archived hook and the 43 bytes left in the section-4 tail (`HARDWARE-STAGE0-RECORD.md`). New: 349 shared addresses with the 368-byte overlay.
   14. Confirms the stage-0 "12 candidates" count. Q6 stays open.

10. **Remaining uncertainties.** No immediate names the second `0x216` record; a computed index would not store that address, and a reader this scan did not see remains possible. No Ghidra reference names the page, source, action, or directory pointer fields; a computed read during boot, before the key-port hook, was not ruled out by a dynamic run. The caller of `0x6040476d` was not walked, so "the builder runs at section-2 init" is inferred from where the code sits. Q6 (secondary CPU or DMA of the reserved tails) was not re-tested. The routing stubs were not assembled, because their bodies depend on a store this task does not choose.

11. **Recommended next actions.** Follow the labelled recommendations in `work/out/packaging.md`: keep section 7's stored bytes, rewrite the second `0x216` record at runtime, do not relocate the face table or the descriptor table, branch the getter (5 bytes) and the setter (6 bytes) only, and do not put this payload in the section-4 tail. A later layout pass has to share the key-port prologue and the section-1 tail with the archived installer, or place the 368 bytes somewhere else that is loaded and uncompressed. Leave Q7 storage to the owner. Do not build the installer in a packaging pass.

12. **Deviations from the brief:** none.

`evidence-manifest.json`: `{ "task", "brief_sha256", "inputs":[{path,sha256}], "sources":[{path,sha256}], "outputs":[{path,sha256,bytes}], "commands":[...], "tool_versions":{...} }`
