# T10-afon-profile-storage-5b82 result

| Site | Class | What reaches the key | Index |
| --- | --- | --- | --- |
| Registration `0x600e5874` | REACHES-UNNAMED | The 16-cell record is registered. The ROM default is 32 zero bytes. | All 16, including the unnamed cells. |
| UI map indices 5, 12, 13 | SAFE | `FUN_60419446` returns the mapped key and the mapped index. | 5, 12, 13 only. |
| `FUN_6041937f` | SAFE | The mapped setter. Carried from T2. | The map's index. |
| `FUN_6006398b` | REACHES-UNNAMED | Whole-key zero on reset and on a bank-7 invalid-area rebuild. | All 16. |
| Bank-7 load and save | REACHES-UNNAMED | The bulk copy carries the bytes. It does not interpret them. | All 16. |
| Setter-table fields +0x50 and +0x52 | SAFE | The key halfword is absent from the 61 records. The index expression is an `exthu`, so its bounds are 0..65535. | Not a consumer of this key. |
| `0x616ddb03` | SAFE | A diagnostic line number. Not a cell index. | None. |
| `0x6118bf47`, `0x6118c058` | SAFE | Object-field pointers `A2+0x5b8`. Not cell indices. | None. |
| `0x60539e07` | UNRESOLVED | A byte-pattern run of 4 windows, `0x60539dff` through `0x60539e1d`. Not an identified record and not a consumer. | Missing. |
| Data `0x607e2ef9` and the other four data sites in `work/out/reader-audit.md` | UNRESOLVED | No consumer. | Missing. |
| Singleton `0x615fbdb0` | UNRESOLVED | The aligned dword is `0x61295b82`. No image dword points at the site. A base-plus-offset reader is not excluded. | Missing. |
| Singleton `0x615b9d55` | UNRESOLVED | The `82 5b` bytes sit inside dword `0x615b823c` at `0x615b9d54`. No image dword points at the site. | Missing. |
| Singleton `0x615b9d91` | UNRESOLVED | Same shape at `0x615b9d90`. | Missing. |

The normal-operation list is the sites this audit and T2 established. It is not an exhaustive reader list. OM Workspace backup behaviour is out of scope and unknown.

1. **Task identifier and brief version used:** T10-afon-profile-storage-5b82, brief dated 2026-11-19. This is the correction after Sol's review `run-20261119-161828-review`, which rejected the earlier stop. Owner decision Q7 is option (a): the AF-ON profile is stored in the 13 unnamed cells of key `0x5b82`.

2. **Research baseline used:** `brief.md`, `TASK.md`, `audit/previous-review.md`, the T2 final Sol review, T2b's review, `all-functions.asm`, the T6 design, the T3m profile layout, the T8 save decision, and the descriptor tables measured by command 08. Main image SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`, length 33554368. Resource `02_0106` SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. The manifest lists the rest.

3. **Work performed:** Commands 01–08 are the earlier static audit and the legal-range measurement. Command 09 is the codec unit test. Commands 10–15 are the six emulator processes. Command 16 builds the manifest. Command 17 is the external seal. No seventh emulator process was started.

4. **Files examined:** The main image, `ref/analysis/decompiled-main/all-functions.asm` at the setter `FUN_60063431` / `FUN_600634ee` and the descriptor scanners, the UI map at `0x6062555c`, and the research inputs named in the manifest. Addresses used at run time: stock getter `0x60063380`, stock setter `0x60063431`, builder entry `0x60a8f6bb`, boot copy return `0x60063e8a` (the call is `0x60063e85`).

5. **Files created:** Everything under `work/` that the manifest lists. The codec is `work/scripts/codec.mjs`. The encoding is `work/out/encoding.md`. The reader audit is `work/out/reader-audit.md`.

6. **Findings:**

6.1 STATIC. The legal ranges pack into 117 field bits. Marker 16, version 8, three pad bits and CRC-16 make 160 bits, 20 bytes. The record is 26 bytes. It fits. Nothing was dropped. `work/out/encoding.md`.

6.2 STATIC. The stock setter `FUN_600634ee` stores the byte at `0x6006354e` and the halfword at `0x60063534` with no min or max compare. Size `0x9a41[0]` has no descriptor, so it stays 8 bits.

6.3 OBSERVED-EMU. Command 09. Round-trip, all-zero, all-`FF`, thirteen `0x0C80` halfwords, every one of the 208 single-bit flips, an illegal zone code with a valid CRC, and a bad version all behave as the encoding says. Exit status 0.

6.4 OBSERVED-EMU. Subject Detect `0x1e71[0]` read 0 on every press that ran. K1's stock AF-ON target, press and release, is `0e 02 02 00 1b 00 27 00 00 00`.

6.5 OBSERVED-EMU. On K2 and on candidate c1, the menu path lands on `2.AF` and then on `AF Target Mode`. The stock menu save posts M with status 0. The 16 cells of `0x5b82` sit in the live bank at file offset 1446, live `0x62920ca6`.

6.6 OBSERVED-EMU. After save and reopen, c1's 71-byte mirror is profile A and the cells match the committed record. AF-ON press is `11 02 03 00 01 00 01 00 00 00`, owner 2, status 0, enabled 1. Release is `0e 02 03 00 03 00 03 00 00 00`, owner 0. That release equals K2, which took the same menu keys and has no profile. It is the stock half-press writer after the menu's Right. It is not the profile target.

6.7 OBSERVED-EMU. The M images written by command 14, `work/out/nvram-t10g-k2-open.json` and `work/out/nvram-t10g-c1-open.json`, differ at exactly these offsets: 2, 3, 1446–1455, and 1458–1467. Offsets 2 and 3 are the bank checksum halfword (K2 bytes `1a 1b`, c1 bytes `c1 d0`). The others are unnamed indices 0–4 and 6–10. Indices 11, 14 and 15 are 0 on both sides. Named indices 5, 12 and 13 stay 3200 (`0x0C80`). E is 196608 bytes on both and is byte-identical. The key image is not in E.

6.8 OBSERVED-EMU. Storing C1 and recalling it left all 16 cells unchanged. `accept-t10h.jsonl` id `c1-c1`.

6.9 OBSERVED-EMU. A hook that is not a pass-through observer cannot sit on builder entry `0x60a8f6bb`, because that address is overlay code (command 10). A pass-through observer that calls the stock getter from there fails the callee-saved check (command 11). The observer that ran reads the live key image at the offset the getter matched, then the overlay instruction runs.

6.10 The reset, the single-bit corruption reopen, and the art-filter cursor were not completed. See the tests.

7. **Evidence for each claim:** Command logs `work/out/cmd/09` through `work/out/cmd/15`. Session records `work/out/accept-t10h.jsonl` lines for K1, K2, and c1 through `c1-c1`. The store offsets are the byte diff of the two nvram files named in 6.7. The ranges are `work/out/ranges-t10c.json` and `work/out/cmd/08.out`.

8. **Tests and outcomes:**

| Test | Result |
| --- | --- |
| Codec unit tests | PASS. Command 09, exit 0. |
| 1. Save and reopen | PASS. c1 in command 15. Mirror exact. Press is profile A. Release matches K2's half-press. |
| 2. Store difference | PASS on the images command 14 wrote. The session's own assert did not run, because that process stopped at reset. The byte diff is 6.7. |
| 3. Reset | FAIL. Command 14 reached the page and showed rows `Reset Shooting Settings` and `Initialize All Settings`, then found no confirm. Command 15 matched the tab label `Reset/Initialize Settings` and did not enter the page. The cells were not shown to become zero. |
| 4. Custom modes | PASS. C1 assign and recall, cells unchanged. |
| 5. Corruption | Not run. The script stops at the first failed assertion. |
| 6. Stock use of the named cells | Not run. |
| Overall | Not `ok: true`. |

9. **New versus previously established:** 6.1 withdraws the earlier claim that the profile cannot fit. That claim treated the 28-byte cell width as the packed size. 6.5 confirms the T8 menu path. 6.6 confirms the T6 Small target and the All fallback. 6.8 confirms T2: C1 does not store this key. The three singletons stay unresolved, as T2b's review left them.

10. **Remaining uncertainties.** The reset confirm was not reached, so it is not known which of the two rows zeros `0x5b82`. The art-filter cursor was not moved; T2's earlier native-key probe also left the named cells at `0x0C80`. E does not hold this key in the 196608-byte image. The bank checksum at bytes 2 and 3 did change with M, as 6.7 records.

11. **Recommended next actions.** Enter the reset page with Right once the tab `Reset/Initialize Settings` is highlighted, take `Initialize All Settings`, and confirm. Then run the corruption reopen and the art-filter cursor. A new emulator process needs a new allowance: this correction used the six it had.

12. **Deviations from the brief.** The run does not end `ok: true`. Tests 5 and 6 did not run. The republish on AF-ON entry reads the live key image instead of calling the getter from inside the observer; the boot load does call the getter. The release compared with K2 is the half-press record after the menu's Right, not K1's untouched target. OM Workspace backup behaviour is out of scope and unknown.
