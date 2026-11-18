# Phase A — editor route

## 1. How OK chooses an editor

Page 27's stock rows are kind 12. Row 2154 at `0x6158dc44` and row 2155 at `0x6158dc68` each point at the two-record list `0x6158ba04` and have a null alternate list. The overlay row at `0x6031e978` is kind 4, with both option pointers at `0x6158ba1c` and count 10. Page 28's rows at `0x6158dc8c` match that shape. Page 29's rows at `0x6158dcf8` are kind 4 with count 0. (`work/out/static-route-a1.txt`)

OK on 2154 and OK on 2155 each open a two-option chooser. The shutter-button row's chooser and the AF-ON row's chooser are the screens in `work/out/trace-a1-2154.png` and `work/out/trace-a1-2155.png`. The first editor body entered is `FUN_610e2536`, called from `FUN_610cdf05` at `0x610cdf91` (return address `0x610cdf98`). `FUN_610cdf05` is reached from `FUN_610cdebf` (return address `0x610cded9`). That function passes the word at the widget plus `0x300`. The words observed are 323, 334, 322, 333 and 432. The same set appears for 2154, for 2155, and for C-AF Area. They are widget ids. (`work/out/trace-decision-a2.jsonl`, `work/out/trace-open-a7.jsonl`)

OK on UI id `0x3D6F` stays on the AF Button page (`work/out/trace-a1-3d6f.png`, `work/out/trace-a5-3d6f.png`). `FUN_610cdebf` is not entered. `FUN_61203816` is entered from `0x6124f7e4`. `FUN_61204065` then runs three times: `(2154, count 2, list 0x6158ba04)`, `(2155, count 2, list 0x6158ba04)`, and `(0x3D6F, count 10, list 0x6158ba1c)`. (`work/out/trace-build-a8.jsonl`, `work/out/trace-open-a7.jsonl`)

`FUN_611f703b` compares the result of `FUN_611f6e4b` with 1, 3 and 4. The compares are at `0x611f7074`, `0x611f7078` and `0x611f707c` (`work/out/disasm-activate-a3.txt`). On 2154, 2155 and `0x3D6F` the result is 0, read from the list object at `0x6247a210` plus `0x34`. That compare does not choose the editor. (`work/out/trace-kind-a3.jsonl`)

The indirect call at `0x611f708f` is `FUN_611b1685` for 2154, 2155, `0x3D6F` and C-AF Area. On the three AF Button rows it returns 0. (`work/out/trace-slot-a5.jsonl`, `work/out/trace-act-a6.jsonl`)

C-AF Area OK opens its two-option chooser. The help text and the "All" label are in `work/out/trace-decision-a2.jsonl`, and the screen is `work/out/trace-a2-caf.png`. The action method is again `0x611b1685`, and the refresh path runs (22 entries to `FUN_610cdf05`). (`work/out/trace-slot-a4.jsonl`)

The viewer constructor `0x61203696` has one direct caller, the type-`0x40` wrapper `0x61203676`. Pages 27, 28 and 29 have no key in the handler table at `0x6158f3b4`. The only u32 reference to each page's row pointer is the pointer field inside that page's own descriptor. No native menu row, key, or sub-page entry to page 28 or page 29 was found. (`work/out/static-route-a1.txt`)

The value-descriptor lookup `FUN_604058bc` returns the setting id in D0 and the descriptor pointer in A0. After the EMULATOR-ONLY bucket link, `0x3D6F` resolves to `0x6031e9a0` and 2154 resolves to `0x6062132c`. (`work/out/link-diag-a9.jsonl`) That link does not put `0x3D6F` on the chooser path.

## 2. What pages 28 and 29 open

There is no native route. Each page was built in its own stock session by an EMULATOR-ONLY reference construction: the AF Button source record at `0x61529cec` was pointed at that page's id list, and the ushort at the constructor argument plus 4 was rewritten from 27 to the target page id before the constructor copied it. (`work/out/page28-a3.jsonl`, `work/out/page29-a3.jsonl`)

Page 28 shows the title "AF Target Mode" and three rows of that name. Each row's value is a full grid marked All, the first record of `0x6158ba1c`. The screen is `work/out/page28-a3-open.png`. OK on the first row leaves that screen in place (`work/out/page28-a3-ok.png`). List type returns 1. The object at the model plus `0x58` has kind 11. `FUN_61203e81` is entered and returns 0. `FUN_610cdf05` is not entered.

Page 29 shows the title "AF Target Point" and three rows of that name, with no value glyph. The screen is `work/out/page29-a3-open.png`. OK leaves it in place (`work/out/page29-a3-ok.png`). The same list type, kind, and `FUN_61203e81` return were recorded.

Readback, both pages, before any menu and after OK. Unchanged: `0x9fa1` `[0,0,0]`, `0x99d2` `[526,526,526]`, `0xdfa1` `0`, `0x1ea1` `0`, `0x99a1` `[2,0,2,0,2,0,5,5]`, `0x9a41` `0`, `0x5962` `[526,526,526,526,526,526]`. UI ids 238, 517, 1692, 1693, 1713 and 2273 through 2279 stayed 0. UI ids 165, 1694 and 1695 stayed 526. `0x1dd1` changed from `[3,3,3,3,3,3,3,3,3,3]` to `[27,39,3,3,3,3,3,3,3,3]`. That pair is the menu-entry change already known on stock firmware. No `MODE_AF_HOME` or `MODE_AF_HOME_AREA` cell was written by the OK. Nothing was saved.

A construction that rewrote only the page id, and left the source list on 2154 and 2155, drew an empty page whose OK opened the priority chooser (`work/out/page28-a2-open.png`, `work/out/page28-a2-ok.png`). That screen is not page 28. The a3 runs are the ones that show the pages.

## 3. Route ratings

R1. Possible with code. The `0x3D6F` row already arrives at `FUN_61204065` with the 10 records at `0x6158ba1c`. That call does not open a modal chooser. The stock chooser path is `FUN_610cdebf` then `FUN_610e2536`, and `0x3D6F` does not enter it. Page 28's OK does not open a chooser either, so the editor the stock rows use is the `0x610e` family, and page 28 contributes the 10 records as the value the row draws. Phase B's four data trials did not move `0x3D6F` onto the chooser path. See `work/out/design.md`.

R2. Not possible on the OK path that was measured. A page-29 row does not open a target-selection editor. The editor was not entered, so the settings it would read and write were not observed. The cells in section 2 did not change apart from the menu-entry pair in `0x1dd1`.
