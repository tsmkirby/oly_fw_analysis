# T4-afon-packaging result

1. **Task identifier and brief version used:** T4, packaging analysis for the AF-ON zone row. Brief `brief.md` in this workspace, version 2026-11-18, including section 5 (correction round after Sol's review `run-20261118-150331-review`, REJECT). Section 0 of that brief was followed. Corrected answers are in `work/out/packaging-c1.md`. The first-round answers in `work/out/packaging.md` are unchanged.

2. **Research baseline used:** `brief.md`; `TASK.md`; `templates/result.md`; `audit/previous-review.md`; `ref/HARDWARE-STAGE0-RECORD.md`; `ref/PROJECT-STATE.md` (Q4, Q6, Q7); `ref/analysis/button-af/AFON-MENU-RESEARCH.md`; `ref/analysis/button-af/readiness/t3-afon-zone-row/README.md` and `design/T3f-binding.md`, `T3g-descriptors.md`, `T3h-faces.md`, `T3i-design.md`; `ref/contribution/docs/format/CONTAINERS.md`; `ref/contribution/docs/safety/CODE_SPACE.md`; `ref/tooling/om-emu/docs/model-survey.md`. Measurements read `ref/analysis/button-af/readiness/t3-afon-zone-row/t3j/overlay-changed-bytes.csv` and `ref/analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv`.

   Input hashes, first-round command 10:

   - `inputs/00_0100_50000020.decoded.bin` — `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` — 33,554,368 bytes. Same hash as `ref/tasks/T3j-afon-acceptance-assertions/run-20261118-132500/work/evidence-manifest.json`, and the same hash the stock emulator reported for the image it loaded.
   - `inputs/02_0106_458c0020.decoded.bin` — `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059` — 143,523,776 bytes. Same hash as that T3j manifest. The stock emulator session loads its own resource block and does not read this file.

   The current `brief.md` includes section 5, so its hash is the `brief_sha256` field of `work/evidence-manifest.json`. The hash recorded in the first-round result (`62cf2c9bb55fceba77304a9eb03b1dc5e3577b70b83fd9c70f53ac6893ffbc32`, 4,266 bytes) is the brief from before section 5.

   The correction-round emulator run applied no image patch and no overlay. `OM_EMU_NVRAM` was off (no nvram file).

3. **Work performed:** every command through `node26 work/scripts/run_logged.mjs`. Wrapper sha256 `e00170efc367d0ed4c145db59bd6a84738688554f6904980ea382f6494325d15`. All exits 0. Records in `work/out/cmd/`.

   First round:

   1. `node26 work/scripts/run_logged.mjs 01 python -I work/scripts/pack_static_t4.py` — 2026-11-18T19:16:16Z to 19:16:19Z.
   2. `node26 work/scripts/run_logged.mjs 02 python -I work/scripts/pack_more_t4.py` — 19:18:45Z to 19:18:45Z.
   3. `node26 work/scripts/run_logged.mjs 03 python -I work/scripts/append_ranges_t4.py` — 19:19:44Z.
   4. `node26 work/scripts/run_logged.mjs 04 tools\bin\run-ghidra.cmd -postScript T4List.java work/out/disasm-ranges-full.txt work/out/xrefs-t4.txt -log work/out/ghidra-t4.log` — 19:19:47Z to 19:19:51Z. Ghidra 12.2 PUBLIC, `-noanalysis -readOnly`.
   5. `node26 work/scripts/run_logged.mjs 05 tools\bin\run-ghidra.cmd -postScript T4List.java work/out/disasm-ranges-c.txt work/out/xrefs-t4c.txt -log work/out/ghidra-t4c.log` — 19:22:44Z to 19:22:47Z.
   6. `node26 work/scripts/run_logged.mjs 06 node26 -p process.version` — v26.12.1.
   7. `node26 work/scripts/run_logged.mjs 07 python -I -c "import sys; print(sys.version)"` — 3.12.7.
   8. `node26 work/scripts/run_logged.mjs 08 java -version` — OpenJDK 25.0.5+8.
   9. `node26 work/scripts/run_logged.mjs 09 python -I work/scripts/check_listings_t4.py` — 1,329 listing rows, 0 mismatches.
   10. `node26 work/scripts/run_logged.mjs 10 python -I work/scripts/hash_inputs_t4.py`.
   11. `node26 work/scripts/run_logged.mjs 11 python -I work/scripts/write_manifest_t4.py` — first-round manifest. Its own exit is recorded after the script returns, so that manifest listed commands 01–10 only.

   Correction round. New script names. No script that had already run was edited.

   12. `node26 work/scripts/run_logged.mjs 12 python -I work/scripts/static_c1.py` — 2026-11-19T10:05:22Z to 10:05:22Z. Dword scan, stride-24 sites, section-7 branch into the face window, helper and site bytes, mid-instruction bytes.
   13. `node26 work/scripts/run_logged.mjs 13 tools\bin\run-ghidra.cmd -postScript T4ListC1.java work/out/disasm-ranges-c1.txt work/out/xrefs-t4-c1.txt -log work/out/ghidra-t4-c1.log` — 10:06:09Z to 10:06:17Z. Same launcher and the same truststore warning.
   14. `node26 work/scripts/run_logged.mjs 14 python -I work/scripts/find_gap_c1.py` — 10:06:21Z. Tail windows of 48 bytes.
   15. `node26 work/scripts/run_logged.mjs 15 python -I work/scripts/check_listings_c1.py` — 10:09:54Z. 14 files, 976 rows, 0 mismatches. Image listings only.
   16. `node26 work/scripts/run_logged.mjs 16 node26 work/scripts/watch_c1.mjs om-emu` — 10:05:22Z to 10:05:44Z. Stock session, wall about 22 seconds, `ok true`, `timedOut false`.
   17. `node26 work/scripts/run_logged.mjs 17 python -I work/scripts/search_ctor_c1.py` — 10:09:55Z. Stored words for the builder chain and the hook.
   18. `node26 work/scripts/run_logged.mjs 18 python -I work/scripts/ctor_window_c1.py` — 10:10:09Z. Words around those two hits.
   19. `node26 work/scripts/run_logged.mjs 19 python -I work/scripts/write_manifest_c1.py` — refreshes `work/evidence-manifest.json` after `packaging-c1.md` and this file. The wrapper writes `19.exit` after the script returns, so the manifest lists the exits that exist when the script runs.

4. **Files examined:** the decoded main image and resource image above. Ghidra program `00_0100_50000020.decoded.bin` in the private project `projects/OM3_main_full`, read only. Sol's review `audit/previous-review.md`. First-round listings under `work/out/listings/` and `work/out/xrefs-t4.txt`.

   Correction-round disassembly, each range starting on an instruction boundary:

   - `0x600232d1` flash entry through its `ret` at `0x6002332c` (`flash-entry-c1.txt`)
   - `0x60023389` flash read through its `ret` at `0x60023479` (`flash-read-c1.txt`)
   - partial callees `0x600213f0`, `0x600235b5`, `0x600235ff`, `0x6002347c`, `0x60023653`, `0x600236ea`, `0x60021812`, `0x60023042`, `0x60023228`
   - `0x60045f44` section init, 200 instructions (`section-init-c1.txt`), covering `0x60045f6e` and `0x6004603b`
   - `0x611f7f01` face walk (`face-c1.txt`) and the candidate site and helper blobs
   - `0x6040476d` call site (`call-site-c1.txt`) and the caller walk in `work/out/callers-c1.txt`

   Head copy remains `work/out/listings/head.txt`: call at `0x60021187`, setup at `0x60021169`.

5. **Files created:** everything under `work/`, and nothing outside it. The manifest lists each file with sha256 and byte length. Principal correction-round outputs: `work/out/packaging-c1.md`, `work/out/static-c1.txt`, `work/out/face-patch-bytes-c1.txt`, `work/out/disasm-ranges-c1.txt`, `work/out/listings/*-c1.txt`, `work/out/face-helper-c1.txt`, `work/out/face-site-c1.txt`, `work/out/xrefs-t4-c1.txt`, `work/out/callers-c1.txt`, `work/out/gaps-c1.txt`, `work/out/ctor-ptrs-c1.txt`, `work/out/ctor-window-c1.txt`, `work/out/watch-c1.jsonl`, `work/out/watch-c1-hits.json`, `work/out/ghidra-t4-c1.log`, `work/out/cmd/12` through `19`, `work/scripts/static_c1.py`, `T4ListC1.java`, `find_gap_c1.py`, `check_listings_c1.py`, `watch_c1.mjs`, `search_ctor_c1.py`, `ctor_window_c1.py`, `write_manifest_c1.py`, this file, and `work/evidence-manifest.json`.

6. **Findings:**

   1. STATIC. The section loader at `0x60045ed5` copies source to destination for length `end - dest`, mode `0x10200`, and never reads the descriptor's third word. That listing is the first-round `loader.txt`.
   2. DATA. Section 7 is destination `0x6103f000`, source `0x5101e000`, third word `0x1`, length 6,340,608, end immediate `0x6164b000` at `0x60045ea2`.
   3. DATA. Neither decoded image contains an `olycompress` magic. That is a statement about file bytes.
   4. STATIC. Flash entry `0x600232d1` through `ret` at `0x6002332c` sends mode `0x10200` to flash read `0x60023389`. Flash read through `ret` at `0x60023479` calls `0x60021812`, then `0x60023042` or `0x60023228`, then `0x600218ea`, `0x600236ea`, and `0x600236a2`. No byte-sum of the copy appears in those two bodies. Their callees were listed only in part and call further routines that were not listed.
   5. INFERRED, limited to the listed bodies in finding 4. The upper `0x10200` path transfers bytes and does not itself sum them. A checksum or a decompression step in an unexamined callee is unresolved. The general claim that a length-preserving edit has no section checksum to repair is withdrawn.
   6. DATA. Key 8's 416 records occupy `0x615c540c`–`0x615c7b0c`. Editor `0x216` occurs twice, identical 24-byte records, at `0x615c59dc` (index 62) and `0x615c6234` (index 151). No image word points at `0x615c6234`.
   7. STATIC. The three functions that embed `0x615cc934` return on the first matching editor id. A scan whose id is past index 151 still reads the second record's bytes.
   8. OBSERVED-EMU. On the stock paths in finding 16, the range `0x615c6234` for 24 bytes was not read. Walk-1 ran six times and was the only directory reader observed. Walk-2 and walk-3 did not run. Watches were armed after boot.
   9. HYPOTHESIS. The second `0x216` record is not the record those three walks return. Binding placement is unresolved.
   10. DATA. No loaded section has a `0xFF` run of 10,008 bytes. No qualifying region of that size was established. `0x60320000` for 10,008 bytes is `0xFF` and lies in the unloaded gap `0x6031f000`–`0x603ba800`.
   11. STATIC. The face base immediate is `add 0x6037bedc,A2` at `0x611f7f35`. The count compare is `cmp 0x60,D2` at `0x611f7f47`. The head-copy call is at `0x60021187` (`call 0x6002332f`). The instruction at `0x60021169` is `mov (0x62960798),D0`. The table lies in the copy whose end word `0x60387094` is stored at `0x60021105`.
   12. STATIC. Stock face bytes at `0x611f7f3e` are `c9 06 f0 18 ca 08` (`bne 0x611f7f44`, `mov A2,(A0)`, `bra 0x611f7f4a`). The only section-7 branch into `[0x611f7f3e, 0x611f7f4a)` is that `bne`. A six-byte site `dc 82 6a 12 ff cb` (`jmp` plus `nop`) replaces those three instructions and leaves `inc D2` at `0x611f7f44` intact. The 48-byte helper retests the flags, performs the stock store, and on UI `0x3D6F` stores `0x6031ea48`. Ghidra decoded both blobs. The candidate home `0x6031e9c0` is stock `0xFF` and free of the overlay CSV, and the archived CSV occupies all 48 bytes. No other 48-byte window free of both CSVs was found in the three tails.
   13. DATA. Overlay rows in the span `0x6031e920`–`0x6031eae4` (452 bytes) number 368. Overlay rows on the node `0x6031e9b8`–`0x6031e9c0` number 0. `84 + 36 + 20 + 72 + 36 + 120 = 368`. The node adds 8. The data subtotal is 376, inside the 452-byte span, before further code.
   14. STATIC. Getter site `0x6041931e` is 5 bytes. Setter site `0x6041937f` is 6 bytes. Default writer `0x604193ca` is 7 bytes. Installer, getter stub, setter stub, node publication, and I-cache synchronization for a runtime section-7 code patch have no size.
   15. STATIC. The caller chain of `0x6040476d` ends at `FUN_602182d0`, which has no direct call reference. The only word equal to `0x602182d0` is at `0x6003954c`, in a record of small integers. The hook `0x6017a5fc` has no direct call reference. The only word equal to it is at `0x6017a5d8`, inside the preceding bytes.
   16. OBSERVED-EMU. After the probes were armed, builder, builder-call, and hook counts stayed 0. The first directory read in that window was walk-1 at the menu key (`0x6124f4fc`). The session reached the date prompt, then Card/Folder/File, then `2. AF`, then page 27 and its editor twice (the second OK reopened the same editor; Down did not move the highlight), then the `1. AF` tab. That tab contains both Release Priority and AF by half-pressing. OK there did not open a distinct editor. Page 28 was not opened.
   17. INFERRED. The order of `FUN_60405865`, the key-port hook `0x6017a5fc`, and the first menu access to the binding directory is unresolved.
   18. STATIC. In `section-init-c1.txt`, which starts at `0x60045f44`, `0x60045f6e` is `mov sp,A0` and `0x60045f6f` is `add 0x14,A0`, so `0x60045f70` is inside that add. `0x6004603b` is `call 0x60215425`, seven bytes through `0x60046041`, so `0x60046040` is inside that call.
   19. DATA. 349 of the 368 overlay addresses are in the archived CSV. The section-4 tail leaves 43 bytes. The twelve pointer hits in the three tails stand, and Q6 was not re-tested.

7. **Evidence for each claim:**

   1. `work/out/listings/loader.txt`.
   2. `work/out/static-t4.txt` and `work/out/listings/end-selector.txt` at `0x60045ea2`.
   3. `work/out/static-t4.txt` magic scan.
   4. `work/out/listings/flash-entry-c1.txt` (call at `0x6002330e`, `ret` at `0x6002332c`) and `flash-read-c1.txt` (`cmp 0x10200` at `0x600233f3`, calls at `0x6002340f`, `0x6002341f`, `0x60023430`, `0x60023437`, `0x60023443`, `0x60023449`, `ret` at `0x60023479`). Partial callees are the `callee-*-c1.txt` files.
   5. The same listings. The withdrawn general claim is the first-round finding 4.
   6. `work/out/static-t4.txt`, `work/out/static-t4b.txt`, and `work/out/static-c1.txt` dword lines.
   7. `work/out/listings/binding.txt`, `binding-next.txt`, `binding-third.txt`. Stride-24 counts in `work/out/static-c1.txt`.
   8. `work/out/watch-c1-hits.json`: `byId` has `dir` only; probes `walk-1` n=6 and the other five probes n=0. Armed record is the `armed` line of `work/out/watch-c1.jsonl`.
   9. Findings 6, 7, and 8. The hypothesis is stated because those three do not close it.
   10. `work/out/static-t4.txt` FF runs. Wording in `work/out/packaging-c1.md` section 6.
   11. `work/out/listings/face.txt` at `0x611f7f35` and `0x611f7f47`. `work/out/listings/head.txt` lines for `0x60021105`, `0x60021169`, and `0x60021187`.
   12. `work/out/static-c1.txt` branch line and helper lines. `work/out/face-site-c1.txt`. `work/out/face-helper-c1.txt`. `work/out/gaps-c1.txt` (0 windows). Command 15: 976 rows, 0 mismatches.
   13. `work/out/static-c1.txt` span lines: overlay rows in span 368, node rows 0, span 452 bytes.
   14. First-round `getter.txt`, `setter.txt`, `default-writer.txt`. Unsized rows in `work/out/packaging-c1.md` section 4.
   15. `work/out/callers-c1.txt` roots `6040476d`, `60405865`, `6017a5fc`. `work/out/ctor-ptrs-c1.txt`. `work/out/ctor-window-c1.txt`. `work/out/listings/call-site-c1.txt`.
   16. `work/out/watch-c1.jsonl` steps `after-boot-idle` through `done`.
   17. Findings 15 and 16. Boot was already finished when the probes were armed.
   18. `work/out/listings/section-init-c1.txt` at `0x60045f6e` and `0x6004603b`. Byte check in `work/out/static-c1.txt`: `3c201400` and `ddeaf31c00a00c`.
   19. `work/out/static-t4.txt` overlap and tail-pointer sections. `work/out/static-c1.txt` archived rows in the helper hole: 48.

8. **Tests and outcomes:**

   - Commands 01–18: PASS (exit 0). Command 19 is the manifest refresh and is recorded the same way.
   - First-round listing bytes: PASS (1,329 rows, 0 mismatches, command 09).
   - Correction-round image listings: PASS (14 files, 976 rows, 0 mismatches, command 15). The helper and site blobs were checked by Ghidra's own decode, and they were kept out of `listings/` so the byte checker does not compare them with the stock image.
   - Input hashes against the T3j manifest: PASS.
   - Stock emulator session: PASS for the paths it actually opened (`ok true`, image hash match, no overlay, no nvram). BOUNDARY for boot order and for the duplicate record: watches were armed after `open_session`, page 28 was not opened, and the page 25/26 steps did not open a distinct editor.
   - Ghidra logged an OS-truststore "Access is denied" on commands 04, 05, and 13, and continued. Listings match the image. No ACL change was attempted.
   - No installer and no image were built. That is the brief's scope.

9. **New versus previously established:**

   1. Confirms the loader in `HARDWARE-STAGE0-RECORD.md` and the first-round listing.
   2. Confirms the section-7 range and flag.
   3. Confirms the first-round magic scan. It does not settle decompression inside unexamined callees.
   4. New listings. Extends the first-round flash-entry fragment, which stopped at `0x6002330d`.
   5. Withdraws the first-round general checksum claim. Confines the inference to the listed bodies.
   6. Confirms the first-round duplicate-record measurement.
   7. Confirms first-match in all three walkers.
   8. New. The stock watch run.
   9. Withdraws the first-round recommendation to rewrite `0x615c6234`. The reuse is a conditional hypothesis, and the home is unresolved.
   10. Confirms the tail sizes. Replaces "no owned region exists" with "no qualifying region was established".
   11. Corrects the head-copy address from `0x60021169` to `0x60021187`.
   12. Replaces the five-byte proposal at `0x611f7f42`. New encoding, confirmed by Ghidra. Home unresolved.
   13. Corrects the first-round table that counted the hash node inside the 368. The node is 8 bytes beside that 368, and 376 is inside the 452-byte span.
   14. Confirms the site sizes. Marks the stub bodies, the installer, node publication, and I-cache sync unresolved. Withdraws any complete total.
   15. New. The caller chain and the stored-word search. The first round had not walked the caller of `0x6040476d`.
   16. New. The paths the stock session actually opened.
   17. Withdraws the first-round inference that the key-port hook is after the builder. Order is unresolved.
   18. New. Bounds the section-init listings that started at `0x60045f70` and `0x60046040`.
   19. Confirms the 349-address overlap and the twelve pointer hits. Q6 and the archived conflict stay open.

10. **Remaining uncertainties.** Whether any reader selects or reads `0x615c6234` on a path this session did not run, including boot, walk-2, walk-3, a scan past index 151, and page 28. The order of the descriptor builder, the key-port hook, and the first directory access. A home for the 48-byte face helper that is free of the archived installer. The sizes of the installer, the getter and setter stubs, node publication, and runtime I-cache synchronization. Whether an unexamined callee of flash read sums or decompresses the copy. Q6 for the three tails. Q7, which this task does not choose. The instruction counter in the watch log is not monotonic, so it is not used as a timeline.

11. **Recommended next actions.** Follow `work/out/packaging-c1.md`. Do not rewrite `0x615c6234`. Use the six-byte face site and the 48-byte helper, and treat `0x6031e9c0` as a candidate whose archived conflict is open. Budget 376 image data bytes inside the 452-byte span, plus the 5-byte getter site and the 6-byte setter site, and leave the face site, the helper, the binding record, and every unresolved code size off any single total. Keep the three section-7 pointer stores and the bucket word as runtime destinations. Limit checksum and decompression claims to the listed flash-entry and flash-read bodies. Leave Q6, Q7, and the archived placement open. Do not build an installer in this pass.

12. **Deviations from the brief:** none. `work/out/packaging.md` remains the first-round text, as section 5 requires. The corrected answers are `work/out/packaging-c1.md`.

`evidence-manifest.json`: `{ "task", "brief_sha256", "inputs":[{path,sha256}], "sources":[{path,sha256}], "outputs":[{path,sha256,bytes}], "commands":[...], "tool_versions":{...} }`
