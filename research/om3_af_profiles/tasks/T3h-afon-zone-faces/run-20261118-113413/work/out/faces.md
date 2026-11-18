# Chooser face source

The ten slots of the `0x3D6F` chooser draw the ten zone faces of list `0x6158ba1c`. Values 0 and 1 are the priority strings in the stock configuration because the chooser searches a different list from the row.

## What the chooser searches

`FUN_611f81aa` at `0x611f81aa` draws the slots. The object is the word at `(0x8,sp)`. The face record is `*(object+0xdb8)` (`work/out/disasm-611f81aa-h1.txt` and `work/out/disasm-611f820c-h1.txt`, bytes checked in `work/out/listing-check-h2.txt`):

- `0x611f820e` `mov (0xdb8,A0),A3`
- `0x611f8219` `movhu (0x8,A3),D0` stores the count at `(0x44,sp)`
- `0x611f8225` loads the list pointer from record+0xc into `(0xc,sp)`
- `0x611f822a` loads the help pointer from record+0x10 into `(0x3c,sp)`

`0x611f8347` copies that count to `(0x14,sp)`. The slot call at `0x611f83aa` is `FUN_611c7785` with A1 = the list, D1 = the count, D0 = the slot value. Return address `0x611f83b1`. The help call at `0x611f8437` uses the help pointer and the same count. Return address `0x611f843e`.

The face record is chosen earlier by `FUN_611f7f01`. It copies the halfword at the source object +4 into the widget at +0x994, then walks `0x6037bedc`, stride `0x24`, at most `0x60` records, and stores the record whose first halfword matches (`0x611f7f35` `add 0x6037bedc,A2`, `0x611f7f40` `mov A2,(A0)`). Listing `work/out/disasm-611f7f01-h1.txt`.

That halfword is the binding record's word at +0x10. `FUN_6124f4e5` copies the 24-byte binding record onto the stack (`0x6124f54c` through `0x6124f551`, six words). `FUN_6124f11a` takes the fifth word, which is record+0x10, and stores its low halfword at the 8-byte key object +4 (`0x6124f215` `mov (0x18,sp),D0`, `0x6124f217` `movhu D0,(0x4,A0)`).

The parent object that `FUN_6119a1aa` builds stores the UI id at +0x54. `FUN_611f7abb` reads the halfword and calls `FUN_611f7aff`. `0x611f7b1c` `movhu D2,(A1)` with A1 = object+0x54 (`work/out/disasm-611f7aff-h1.txt`). The dynamic match recorded parent `0x6247c520` and UI halfword 15727 (`work/out/exp-faces-h1-hook.jsonl`).

## The list, and why 0 and 1 are priority strings

In the Z1 configuration the binding word is `0x2d`, copied from editor `0x1e3` (2154, record `0x615c5e14`). 2155's word is `0x2e` (`0x615c5e2c`). Key `0x2d` is record 76 at `0x6037c98c`: count 2, face list `0x61575880`, help list `0x61576520`. The trace `work/out/trace-faces-h1.jsonl` step `chooser-open` shows `FUN_611c7785` called from `0x611f83b1` with that list and count 2:

| Slot value | Record | Kind | Id | String |
|---:|---|---:|---:|---|
| 0 | `0x61575880` | 4 | `0x124f` | `@A02F@ Priority` |
| 1 | `0x6157588c` | 4 | `0x127b` | `@A066@ Priority` |
| 2, 3, 5, 10, 6, 7, 8, 9 | none | | | blank |

The same two string ids are the page-27 priority options at `0x6158ba04`, in the other order. Values 0 and 1 resolve to them because they are the only records in the list the chooser searches. The row's primary list is already `0x6158ba1c`. The row glyph path `FUN_61204065` calls `FUN_611c7785` from `0x6120408f` with that list. The chooser does not read the row's primary pointer or its alternate pointer.

The help call uses `0x61576520`, also two kind-4 records: value 0 id `0x127d`, value 1 id `0x127c`.

Every one of the 96 table keys is selected by some binding word (`work/out/static-free-keys-h1.txt`). Record 76 is the record editor `0x1e3` uses. Writing it would change 2154's chooser.

## Which reader

The chooser uses `FUN_611c7785`. `FUN_611c782f` is the label decoder (title and button glyphs, callers `0x611c85db`, `0x611c86ab`). Its kind sets are narrower. Both listings were checked against the image (`work/out/listing-check-h1.txt`).

`FUN_611c7785`, kind in D0 after the value match at `0x611c77a1`:

- Image, id stored at output+2: 3, `0xc`, 8, 7 (`0x611c77a3`, `0x611c77ab`, `0x611c77af`, `0x611c77b3`)
- String, id stored at output+4: 4, 1, 2, `0xa`, `0xb`, 9 (`0x611c77bf` through `0x611c77d3`)
- Spawn call: 1, 2, 7, 8, 5, 6, `0xa`, `0xb`, 9 (`0x611c77df` through `0x611c77ff`)

`FUN_611c782f`, kind is the first halfword of one record:

- Image: 3 and `0xc` only (`0x611c7838`, `0x611c783e`)
- String: 4, 1, 2 only (`0x611c784a`, `0x611c784e`, `0x611c7852`)
- Spawn: 1, 2, 5, 6 only (`0x611c785e` through `0x611c786a`)

Kind 12 is an image kind in both. The zone records are kind 12, so `FUN_611c7785` copies their image ids.

## The change that draws them

One change against Z1. The shared record stays as it is. A private copy at `0x6031ea48` (36 bytes, stock `0xFF`, uncompressed section 1) is record 76 with the count set to 10 and the list set to `0x6158ba1c`. The hook at `0x611f7f42`, which runs only on a key match and after the stock pointer has been stored, overwrites that pointer when the parent halfword at +0x54 is `0x3D6F`. Role: behaviour, EMULATOR-ONLY. 2154 keeps key `0x2d` and record 76.

`work/out/exp-faces-h1.jsonl` step `chooser-open` then shows the ten calls from `0x611f83b1` with list `0x6158ba1c` and count 10:

| Value | Image id | Face on the screenshot |
|---:|---:|---|
| 0 | `0x23a3` | All |
| 1 | `0x064a` | Single |
| 2 | `0x028a` | Small |
| 3 | `0x19b5` | Cross |
| 5 | `0x23a4` | Mid |
| 10 | `0x23a5` | Large |
| 6 | `0x23a6` | C1 |
| 7 | `0x23a7` | C2 |
| 8 | `0x23a8` | C3 |
| 9 | `0x23a9` | C4 |

Screenshots: `work/out/exp-faces-h1-chooser-open.png` (All through Large) and `work/out/exp-faces-h1-chooser-nav-8.png` (C1 through C4). The acceptance screenshots `work/out/accept-h1-c1-zone-open.png` and `work/out/accept-h1-c2-zone-open.png` show the same first page. 2154's chooser still shows the priority strings (`accept-h1` assert `2154-opened`).

The count field is shared with the help search. The help pointer stays `0x61576520`. Values other than 0 and 1 do not match a help record, and the previous help sentence stays on the screen.

Confirm stores the table value. `exp-faces-h2` cancelled with profile 0 and confirmed 3 (`work/out/exp-faces-h2.jsonl` steps `chooser-cancel` and `chooser-confirm`). Acceptance committed 2, then 5, in each candidate session, and cancel left 0.
