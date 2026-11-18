# T1 page-27 mapping result

1. **Task identifier and brief version used:**
   T1, page-27 ("AF Button") row and value mapping. Brief version 2026-11-17. Agent Grok 4.7 High. Stock E147 1.1 only. Section 0 of the brief was followed: writes are under `work\`, `om-emu` was not modified, `OM_EMU_NVRAM` was left unset, and no overlay or patch was loaded.

2. **Research baseline used:**
   `ref\PROJECT-STATE.md` §§1–3 and the pins in §10.
   `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §§1, 2–3, 6, 8, and 9.
   `ref\analysis\button-af\FEATURE-SPEC.md` requirement revision of 10 November and the 17 November owner status.
   `ref\contribution\docs\features\om-3\AF_BUTTON_PROFILES.md`, menu and settings.
   `templates\result.md`.
   Input hashes verified in this task:
   - Decoded main `inputs\00_0100_50000020.decoded.bin`, 33554368 bytes, SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. Match.
   - Resource `inputs\02_0106_458c0020.decoded.bin`, 143523776 bytes, SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. Match.
   - Container SHA-256 `8c133084414533159f587bf46bfb4152714c4074312a47c8d8503e33d605696d` is the pin in PROJECT-STATE §10. No container file is in this workspace, so it was not re-hashed.
   - OM-Emu pin `4e4ec4ef084542a7e30eecce56970c7e09c123c9` plus local patch, CR-stripped diff `61cd1327…7702`, also from PROJECT-STATE §10. Git is forbidden here, and the patch file was not re-hashed.

3. **Work performed:**
   All commands from `C:\Dev\OM3-tasks\T1-page27-mapping\ws`.
   - `python -I work\scripts\dump_page27.py` wrote `work\out\static-dump.txt`.
   - `python -I work\scripts\glyph_scan.py` wrote `work\out\glyph-scan.txt`.
   - `python -I work\scripts\string_ids.py` wrote `work\out\string-ids.txt`.
   - `node26 work\scripts\page27_probe.mjs om-emu control work\out\menu-toggle-control.jsonl control`
   - `node26 work\scripts\page27_probe.mjs om-emu toggle work\out\menu-toggle-a.jsonl toggle-a`
   - `node26 work\scripts\page27_probe.mjs om-emu toggle work\out\menu-toggle-b.jsonl toggle-b`
   - The first toggle pair pressed Right on the row list, then OK, Down, OK. Both fresh sessions left 2154 and 2155 at 1, and `0x90a1` at `[1, 1]`. OK opened a side-by-side editor. Down did not move it. Those two files were then overwritten by the sequence below. The first-run JSONL was copied out to `work\out\menu-toggle-a-first.jsonl` and `work\out\menu-toggle-b-first.jsonl`.
   - `node26 work\scripts\page27_probe.mjs om-emu toggle work\out\menu-toggle-a.jsonl toggle-a`
   - `node26 work\scripts\page27_probe.mjs om-emu toggle work\out\menu-toggle-b.jsonl toggle-b`
   - The second pair, from fresh sessions, presses OK, Right, OK on cursor 0 and then on cursor 1. Those are the files cited for the value change.
   - `python -I work\scripts\assemble_outputs.py` wrote `work\out\labels.json`, copied the first toggle pair to `work\out\menu-toggle-a-first.jsonl` and `work\out\menu-toggle-b-first.jsonl`, concatenated `work\out\menu-toggle.jsonl` in the order control, first A, first B, second A, second B, and wrote `work\evidence-manifest.json`.

4. **Files examined:**
   `TASK.md`, `brief.md`, `templates\result.md`.
   `ref\PROJECT-STATE.md`, `ref\analysis\button-af\AFON-MENU-RESEARCH.md`, `ref\analysis\button-af\FEATURE-SPEC.md`, `ref\contribution\docs\features\om-3\AF_BUTTON_PROFILES.md`.
   `ref\scripts\om_emu_af_live_probe.mjs`, `ref\scripts\om_emu_af_player.mjs`, `ref\scripts\OM3Disasm.java` (not executed).
   `om-emu\emu\src\lab\menuwalk.mjs`, `om-emu\emu\src\fw\model.mjs`, `om-emu\emu\src\lab\menu.mjs`.
   `inputs\00_0100_50000020.decoded.bin`, `inputs\02_0106_458c0020.decoded.bin`.
   Resource block `om-emu\unpacked\E147\OLY_E_147_1100_0000_0000.BIN.blk02000000.OE.0101.bin`.
   `ref\analysis\decompiled-main\all-functions.asm` and `functions.tsv`. Instruction ranges used:
   `0x611c7785`–`0x611c782e` (170 bytes), `0x611c782f`–`0x611c7893` (101 bytes),
   `0x61203b95`–`0x61203ca7` (275 bytes), `0x61204065`–`0x6120408e`,
   `0x610a5620` (679 bytes), `0x603f03f0`, `0x60b326de`, `0x618cf5bc`–`0x618cf940`.
   Data ranges: page descriptor `0x6158f0f8` (20 bytes), rows `0x6158dc44` (72 bytes), options `0x6158ba04` (24 bytes), title `0x6158af98` (8 bytes), UI map `0x60627704` (8 bytes), registration `0x6011e790` (6 bytes), assignment entry `0x612f20c8` (16 bytes), descriptor window `0x60621300` (96 bytes).

5. **Files created:**
   Under `work\scripts\`: `dump_page27.py`, `glyph_scan.py`, `string_ids.py`, `page27_probe.mjs`, `assemble_outputs.py`.
   Under `work\out\`: `static-dump.txt`, `glyph-scan.txt`, `string-ids.txt`, `page27-rows.txt`, `labels.json`, `glyphs.txt`, `afon-binding.txt`, `readers-0x90a1.txt`, `menu-toggle-control.jsonl`, `menu-toggle-a.jsonl`, `menu-toggle-b.jsonl`, `menu-toggle-a-first.jsonl`, `menu-toggle-b-first.jsonl`, `menu-toggle.jsonl`.
   `work\result.md`, `work\proposed-doc-patch.md`, `work\evidence-manifest.json`.
   Every one of these is listed in the manifest except the manifest itself.

6. **Findings:**
   1. DATA. Page 27 at `0x6158f0f8` has two 36-byte rows. Row 0 at `0x6158dc44` is setting 2154, kind 12, image `0x06b1`, options `0x6158ba04`, count 2. Row 1 at `0x6158dc68` is setting 2155, kind 12, image `0x282c`, the same options pointer, count 2. `+0x1c` and `+0x20` are 0 on both rows.
   2. STATIC. `0x611c782f` treats kind 12 as an image id at source+2, and kind 4 as a string id at source+2 stored to dest+4. `0x611c7785` walks option records with stride 12, compares the u32 value, and for kind 4 takes the string id at record+6. `0x61203a81` multiplies the row index by 36, compares the setting id at `+0`, copies the descriptor at `row+4`, and loads the options from `row+0xc` with the count at `row+0x10`. `0x61204088` calls the stride-12 matcher.
   3. OBSERVED-EMU. On the live page the hook of `0x611c782f` copied source `0x6158dc48` as kind 12 id 1713 (`0x06b1`) and source `0x6158dc6c` as kind 12 id 10284 (`0x282c`). The title copy was source `0x6158af98`, kind 4, id 4729 (`0x1279`).
   4. DATA. The shared options are value 1, kind 4, string `0x127b`, then value 0, kind 4, string `0x124f`.
   5. OBSERVED-EMU. The stock getter returns `0x127b` = "`@A066@` Priority" and `0x124f` = "`@A02F@` Priority". A blank session renders "`@A066@` Priority" on both rows and reads 1, 1 from `s.get(2154)`, `s.get(2155)`, and `0x60063380(0x90a1, 0/1)`.
   6. OBSERVED-EMU. Cursor 0 is the top value (box y=77). OK, Right, OK on that row changes only 2154 and `0x90a1[0]` from 1 to 0, and the top text becomes "`@A02F@` Priority". The bottom row stays "`@A066@` Priority", 2155 stays 1, and `0x90a1[1]` stays 1. Cursor 1 (box y=141) then changes only 2155 and `0x90a1[1]` to 0. Both fresh toggle sessions agree. The control session, same navigation and no value key, stays 1, 1.
   7. OBSERVED-EMU. In the editor, with the stored value still 1, the help is "When a specified subject is detected at the selected AF target position, AF is performed on the detected subject." Right, before OK, changes the help to "AF is always performed at the selected AF target position." Those are getter strings `0x127c` and `0x127d`. OK then stores 0 and the row shows "`@A02F@` Priority".
   8. DATA and OBSERVED-EMU. String `0x127a` is the page help: settings are configured separately for the shutter button and the `@A049@` button. String `0x11c4` is "`@A02C@`AF by half-pressing `@A052@`". The name slot for 2154 is `MODE_AF_SUBJECT_PRIORITY_RELEASE`. The name slot for 2155 is `MODE_AF_SUBJECT_PRIORITY_CUSTOM_SW`.
   9. INFERRED. The top row, 2154, is the shutter-button row. The bottom row, 2155, is the `@A049@` button row. The page help names those two buttons, the page has those two rows, and the firmware names are RELEASE and CUSTOM_SW in that order. `@A066@` and `@A02F@` distinguish the options, not the rows.
   10. DATA. UI map `0x60627704` / `0x60627708`: 2154 is key `0x90a1` index 0, 2155 is key `0x90a1` index 1. Registration `0x6011e790` is count 2, width 1, payload `00 00`. The blank-session read of 1 is a runtime value, not that payload.
   11. DATA. Assignment entry `0x612f20c8` maps value 69 to function `0x0a`. It is the only such entry in the 80-entry table.
   12. STATIC. No `mov 0x90a1` instruction is present in `all-functions.asm`. The 18 calls of `0x60419408` do not pass 2154 or 2155 as an immediate. `0x610a5620` does not reference this key. The byte site `0x607eb7ab` is outside `FUN_607eb669`.
   13. UNRESOLVED, question 3. Whether 2155 is selected because the physical key is UI_IN `0x000b`, or because the assigned function is `0x0a`, was not shown. The default "AF-ON key reads assignment 69" statement remains the one in AFON-MENU-RESEARCH §8; it was not re-derived here.
   14. The owner's 17 November hardware sentence is left as recorded in §1. This task adds no claim about what focus the body does when a key is pressed.

7. **Evidence for each claim:**
   1. `work\out\static-dump.txt` lines 32–44. Raw hex repeated in `work\out\page27-rows.txt`.
   2. `ref\analysis\decompiled-main\all-functions.asm` at `0x611c782f`, `0x611c7785`, `0x61203b95`–`0x61203ca7`, `0x61204088`. Opcodes and byte counts are copied into `work\out\page27-rows.txt`.
   3. `work\out\menu-toggle-control.jsonl` step `descriptor-copies`. The same two sources appear in both toggle runs.
   4. Option bytes in claim 1's dump: `0100000004007b12b4ae5861` and `0000000004004f12b4ae5861`.
   5. `work\out\labels.json` keys `0x127b` and `0x124f`. `work\out\menu-toggle-control.jsonl` step `af-button-page`: texts both "`@A066@` Priority", `id2154` 1, `id2155` 1, `key90a1` `[1, 1]`.
   6. `work\out\menu-toggle-a.jsonl` steps `row-before`, `chooser-commit`, `toggle-end`. `work\out\menu-toggle-b.jsonl` has the same values and texts. Control step `done` stays `[1, 1]`.
   7. `work\out\menu-toggle-a.jsonl` steps `chooser-open` and `chooser-right`. Getter text in `work\out\labels.json` keys `0x127c` and `0x127d`. Packed order in `work\out\string-ids.txt` lines 62–65, anchored by the getter matches at `0x124f`, `0x1279`, and `0x127b`.
   8. `work\out\labels.json` keys `0x127a` and `0x11c4`. Name slots in `work\out\static-dump.txt` lines 107–108. `@A049@` and `@A052@` neighbours in `work\out\glyphs.txt` and `work\out\string-ids.txt` lines 100–107, and `work\out\glyph-scan.txt` lines 598 and 602.
   9. Combines claims 6 and 8. The rendered row label is an image, so the words "shutter" are in the help string and the name slot, not in the row's drawn text.
   10. `work\out\static-dump.txt` lines 101–102 and 112. Live readback in the control JSONL.
   11. `work\out\static-dump.txt` line 120: `450000000a0000004500000000000000`.
   12. `work\out\readers-0x90a1.txt`. `functions.tsv` entry `607eb669` length 181. Call sites of `0x60419408` listed there.
   13. `work\out\afon-binding.txt`. Gap stated there.
   14. AFON-MENU-RESEARCH §1, the 17 November paragraph. No new body observation was made.

8. **Tests and outcomes:**
   - PASS. Control session reaches the AF Button page and leaves 2154, 2155, and both `0x90a1` indexes at 1.
   - PASS. Toggle session A and toggle session B, each from a fresh stock session, agree on every readback: cursor 0 commits 2154=`0` and `0x90a1`=`[0, 1]`; cursor 1 then commits 2155=`0` and `0x90a1`=`[0, 0]`. Rendered text and help text agree.
   - BOUNDARY. The first key sequence (Right on the list, Down inside the editor) does not change either stored value. The editor's two choices are side by side, so the changing key is Right. Recorded in `menu-toggle-a-first.jsonl` and `menu-toggle-b-first.jsonl`, which also agree with each other.
   - PASS. Main and resource 0106 hashes match the brief.
   - Ghidra was not required for a recheck: each static claim cites an address range, a byte count, and the raw bytes or opcodes.

9. **New versus previously established:**
   1. Confirms AFON-MENU-RESEARCH §6 stride and the setting ids 2154 then 2155. Corrects §6's reading of `0x06b1` and `0x282c` as text labels, and of `0x127b` / `0x124f` as probable on/off row labels.
   2. New. The viewer path for those fields had not been traced (§6 says row iteration was not yet traced).
   3. New live confirmation of claim 2.
   4. Confirms §6's option values 1 then 0 and the ids `0x127b` then `0x124f`. Corrects the on/off guess.
   5. Confirms the blank-session read of 1, 1 in §1, and explains why both rows showed the same Priority text.
   6. New. Settles which screen row writes which id and which index.
   7. New. Settles the stored-value meaning that §1 left open.
   8. New for the help string ids. Confirms the name slots in §1.
   9. New inference from 6 and 8. The open sentence in §1 ("which row is the shutter and which is AF-ON") is answered for shutter versus the `@A049@` button, and is left open for the physical AF-ON key (claim 13).
   10. Confirms §1's key and index. The registration payload `00 00` versus the live value 1 is new.
   11. Confirms the §8 table entry for assignment 69.
   12. New lead list. No AF-path reader is claimed.
   13. Remains open, as the physical-key half of §1's question.
   14. Confirms that the 17 November owner sentence is the only body observation in scope.

10. **Remaining uncertainties:**
    Question 3, claim 13. The consumer that chooses `0x90a1` index 1 on an AF request was not found, so the row is not tied to physical key `0x000b` rather than function `0x0a`.
    The image bits of `0x06b1` and `0x282c` were not decoded. Their meaning is the setting id and the page help, not a drawn glyph name.
    `@A066@` is a reused mark in other menus. On this page its meaning is the option help `0x127c`.
    `@A0BF@` occurs only as "`@A0BF@`/Value" in the Latin-leaning scan. That does not identify a button.
    The editor's choice of help id `0x127c` versus `0x127d` is observed on screen. The option records themselves store only `0x127b` and `0x124f`, so the help-id field was not located.
    The first reader of `0x90a1` on the AF request path remains a lead list.

11. **Recommended next actions:**
    Trace callers that load an id from `0x61529812` or `0x6152d8a6` and then call `0x60419408` or `0x60063380` under the AF request (`0x610a5620`, handlers `0x610b9197` and `0x610b962a`). The compare that picks index 1 is the item that settles question 3.
    If that static reader stays hidden, the owner-camera assignment check in `work\out\afon-binding.txt` is the other way to settle it.
    Apply `work\proposed-doc-patch.md` to AFON-MENU-RESEARCH §1 and §6 when a document edit is in scope. It was not applied here.

12. **Deviations from the brief:**
    Ghidra was not launched. The instruction claims come from the existing linear disassembly, and the data claims are raw bytes of the decoded main, with address, length, and hex. The first toggle sequence used Right and Down and did not change values; the recorded agreeing runs use OK, Right, OK. No other deviation.
