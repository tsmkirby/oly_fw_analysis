# Correction addendum

`design.md` is unchanged. This note records the section-7 decision from the correction round.

The three bytes `0x610bf5e3`–`0x610bf5e5` are a permitted EMULATOR-ONLY runtime call-site patch of the inherited central-edge hook. `work/out/overlay-changed-bytes-c1.csv` marks those three rows `section 7, EMULATOR-ONLY runtime call-site patch (inherited central-edge)`. The section script computes every row from the image section table. No other overlay row is in section 6 or 7 (`work/out/section-rows-c1.json`, 3262 rows, `ok` true). Their native placement is a T4 question. They stay an EMULATOR-ONLY runtime patch.

Sessions still load `work/out/overlay-changed-bytes.csv`. That file is the same bytes, without the section column.

The live zone value stays in RAM at `0xa031e920`. This is not a storage decision, not a firmware image, and not a hardware recommendation.
