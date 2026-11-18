# Help list for the AF-ON zone row

The private face record's count is 10, and the help reader uses that same count. H still pointed +0x10 at `0x61576520`, a two-record list. This change adds a ten-record list and points +0x10 at it. It is one combined change against H.

## Record format

`FUN_611c7785` (`0x611c7785`) indexes `A1` with stride 12 (`udfu01 0xc`). `D0` is the value to match, `D1` is the scan count. A record is:

- +0 `u32` value
- +4 `u16` kind
- +6 `u16` text or image id
- +8 `u32` extra

The help call at `0x611f8437` passes face-record+0x10 as `A1` and the halfword at record+8 as `D1`. Kind 4 returns the string id and does not spawn. Source: `work/out/static-help-i1.txt` lines 1–6, and `ref/analysis/decompiled-main/functions/611c7785.c`.

## What a count of 10 reads at the stock pointer

`0x61576520` has two records, both kind 4, extra `0x61574870`:

- value 0, id `0x127d`
- value 1, id `0x127c`

The next eight records the scan would enter are also kind 4, and their values are only 0 and 1 (ids `0x127d`, `0x127c`, then `0x10d5`/`0x10d6`, then `0x10c3`–`0x10c6`). None is value 9. `work/out/static-help-i1.txt` lines 7–18.

A lookup of C4 (value 9) therefore matches nothing. The previous sentence stays on screen. C-a2 recorded that: the help call for value 9 has list `0x61576520` and no kind or id, and the text is still "When a specified subject is detected…". `work/out/crash-ca2.jsonl` step `nav-8`.

## No stock per-zone help list

The zone face list `0x6158ba1c` is ten kind-12 image records (All, Small, Single, Mid, Cross, Large, C1, C2, C3, C4). It is a glyph list, not a help list. `work/out/static-help-i1.txt` lines 20–31.

A search for a kind-4 run of ten whose values are the zone values returned 0 hits (`static-help-i1.txt` lines 208–209). No face-table record points its face list at `0x6158ba1c`. The English string used for every new record is id `0x01a8`, "Choose the AF target area." (`work/out/strings-i1.txt` line 26). Id `0x0DD2` is the row label "@A040@AF Target Mode", not a help sentence.

## The list that was added

Ten records at `0x6031ea6c`, 120 bytes. Stock bytes there are `0xFF`. The address is in uncompressed section 1 (`0x60134000`–`0x603ba7ff`). Each record is kind 4, text `0x01a8`, extra `0x61574870`, and the values follow the UI-238 table order: 0, 1, 2, 3, 5, 10, 6, 7, 8, 9. The face record at `0x6031ea48` has +0x10 set to `0x6031ea6c`. Both parts are the one combined change. Role: behaviour. Label: EMULATOR-ONLY.

On the final configuration, nine Rights land on C4 with help text "Choose the AF target area.", caller `0x611f843e`, list `0x6031ea6c`, value 9, kind 4, id 424. `work/out/accept-i1.jsonl` assertion `zone-right-9-slot`, and `work/out/accept-c1-zone-right-9.png`.
