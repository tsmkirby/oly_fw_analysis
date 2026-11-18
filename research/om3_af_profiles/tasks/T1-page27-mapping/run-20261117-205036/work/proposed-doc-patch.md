Proposed text only. Do not apply it to the research documents.

## AFON-MENU-RESEARCH.md §1, replace the paragraph that begins "Consistent with this"

Consistent with this, the live E147 AF Button page (page 27, title string
`0x1279`) shows two rows. Which row is the shutter and which is AF-ON is
unresolved: the row images were not decoded. An inference, not a settled
mapping, is that the top row is UI ID 2154
`MODE_AF_SUBJECT_PRIORITY_RELEASE`, storage key `0x90a1` index 0, row image
`0x06b1`, and that the bottom row is UI ID 2155
`MODE_AF_SUBJECT_PRIORITY_CUSTOM_SW`, storage key `0x90a1` index 1, row image
`0x282c`. Both rows share one option list. Stored value 1 is
detected-subject priority: string `0x127b` "`@A066@` Priority", editor help
`0x127c` (AF is performed on the detected subject when it is at the selected
AF target). Stored value 0 is always the selected AF target position: string
`0x124f` "`@A02F@` Priority", editor help `0x127d`. A blank OM-Emu session,
with `OM_EMU_NVRAM=off`, reads 1 for both, so both rows render "`@A066@`
Priority" until one is changed. The page help (string `0x127a`) says the two
settings are for the shutter button and the `@A049@` button. Whether 2155
follows the physical AF-ON key, or the assignable function `0x0a` that the
default AF-ON key uses, is still open.

## AFON-MENU-RESEARCH.md §6, replace the page-27 cell of the sub-page table

| **27** | **`MODE_AF_SUBJECT_PRIORITY_RELEASE`** (kind 12, image `0x06b1`), **`MODE_AF_SUBJECT_PRIORITY_CUSTOM_SW`** (kind 12, image `0x282c`). Shared options: value 1 = string `0x127b` "`@A066@` Priority", value 0 = string `0x124f` "`@A02F@` Priority". |

## AFON-MENU-RESEARCH.md §6, paragraph to add after the sub-page table

Page 27's 36-byte stride and the offsets of the setting id, kind, id, class
pointer, options pointer, and count are as previously listed. Nothing in
those offsets moves. The correction is the kind of the id halfword at +6:
kind 12 means image id, and kind 4 means string id. A string getter on
`0x06b1` returns "`@A0BF@`/Value" and a getter on `0x282c` returns nothing
because those numbers are string ids only when the kind is a string kind.
The option records are 12 bytes (value, kind, id, pointer). `0x127b` and
`0x124f` are those option strings, not the row names, and they are not
on/off. Page 27's alternate option pointer at +0x1c is zero. The title
record at `0x6158af98` is 8 bytes: kind 4, string `0x1279`.
