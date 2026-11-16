# AF-ON AF zone menu option: research notes

Started 10 November 2026, after the
[requirement revision](FEATURE-SPEC.md#requirement-revision-10-november-2026-supersedes-the-af-home-approach).
Static analysis of stock E147 1.1 only (main SHA-256 `5e8d376e…`). Nothing here
was executed on a camera, and the menu layout has not been found yet.

## 1. Settings involved

UI IDs and names come from the 2,915 fixed-width name slots in resource
component 0106 (`analysis/review/setting-name-candidates.json`). Runtime keys
come from the UI-ID-to-key table at `0x6062555c`, which the native lookups
`0x60419446`/`0x60419696` use (as in `scripts/trace_af_controls.py`).

### AEL/AFL operation (what half press and AF-ON do)

| UI ID | Name | Key / index |
|---:|---|---|
| 65 | `MODE_LOCK` | — |
| 66 | `MODE_LOCK_SAF` | `0x8c71` / 0 |
| 67 | `MODE_LOCK_CAF` | `0x8c81` / 0 |
| 68 | `MODE_LOCK_MF` | `0x8c91` / 0 |
| 1867 | `MODE_LOCK_STAR_AF` | `0xb991` / 0 |

The option-list descriptor table (section 2) gives **3** options for S-AF,
**4** for C-AF and **3** for MF, with values 0…n−1. I believe this matches the
documented AEL/AFL modes (S-AF mode 1–3, C-AF mode 1–4, MF mode 1–3); the
camera menu still has to confirm it.

### Stock per-button Subject Detect setting (likely answer to the owner's belief)

| UI ID | Name | Key / index |
|---:|---|---|
| 2154 | `MODE_AF_SUBJECT_PRIORITY_RELEASE` | `0x90a1` / 0 |
| 2155 | `MODE_AF_SUBJECT_PRIORITY_CUSTOM_SW` | `0x90a1` / 1 |

They share one storage record. Its descriptor at `0x6062132c`/`0x60621340`
gives 2 bytes, 1 byte per element, data `0x606190b7`. "RELEASE" is presumably
the shutter button and "CUSTOM_SW" a custom (assigned) button such as AF-ON.
That fits the owner's statement that a stock setting already makes AF-ON
ignore Subject Detect. **Inference from names only:** its menu location,
values and effect are unverified. Hardware log section G2b tests the effect.
If it holds, the feature needs no Subject Detect bypass of its own, which
removes the earlier open question in FEATURE-SPEC about reproducing complete
"Subject Detect Off" behaviour.

### AF target settings (half-press profile today)

| UI ID | Name | Key / index |
|---:|---|---|
| 163 | `MODE_AF_AREA_TYPE` (dropdown enum) | `0x99a1` / 0 |
| 40 | `MODE_AF_AREA` (internal area) | `0x84d1` / 0 |
| 85 | `MODE_AF_FRAME` (grid position) | `0x88b2` / 0 |
| 1803 | `MODE_AF_TARGET_SIZE` | `0x9a41` / 0 |
| 1657/1658 | `MODE_AF_AREA_SIZE_VERTICAL` / `_HORIZONTAL` | `0x1dd1` / 0, 1 |
| 1659–1666 | `MODE_AF_AREA_SIZE_{V,H}_CUSTOM_1…4` | `0x1dd1` / 2–9 |
| 1667–1674 | `MODE_AF_AREA_STEP_{V,H}_CUSTOM_1…4` | `0x1de1` / 0–7 |
| 1338 | `MODE_AF_FRAME_POS` | `0x5962` / 0 |
| 1642–1649 | area type and frame position for the CCW/CW orientations | `0x99a1` / 2–5, `0x5962` / 2–5 |
| 1362–2144 | `MODE_AF_AREA_TYPE_*_ONOFF` (which zones are offered) | `0x5a11` / 0–10 |

Area type (`0x99a1`) is an 8-element array:

| Index | Use |
|---:|---|
| 0, 1 | normal, CHANGE |
| 2, 3 | CCW, CHANGE_CCW |
| 4, 5 | CW, CHANGE_CW |
| 6, 7 | MOVIE, CHANGE_MOVIE |

`MODE_AF_AREA_TYPE_SAVE` (`0x90d1`) has the same 8-element shape.

### AF Home (must no longer be used for AF-ON)

UI 165 `MODE_AF_HOME` (`0x99d2`, plus CCW/CW at 1, 2), 238 `MODE_AF_HOME_AREA_TYPE`
(`0x9fa1` / 0–2), 517 `MODE_AF_HOME_AREA_TARGET_SIZE` (`0xdfa1`), 1713
`MODE_AF_HOME_STATE_FLAG` (`0x1ea1`), and the 1332/1335–1337 and 1343–1345
switches. Under the revised requirement the feature must read and write none of
these.

## 2. Descriptor tables found

- **Option-list table, `0x6061912c`–`0x60619c94`: 146 entries of 20 bytes**
  (`u16 id, u16 flags, u32 records, u32 values, u16 bytes, u16 stride, u32 class`).
  - Stride is 0x40 (one 64-byte record per option), and the class is always 0x600.
  - `values` points to a u32 list of option values (0, 1, 2 for S-AF).
  - The 64-byte records are mostly zero, with one non-zero word per option.
    Their meaning (availability or constraint masks?) is not established.
  - Entries include `MODE_FOCUS` (10 options), `MODE_AF_FRAME_IAF`/`_PDAF`,
    `MODE_LOCK_*`, `MODE_FOCUS_AF_HOME` and `MODE_LOCK_STAR_AF`. Some IDs
    (3281, 3312, 3313) are past the 2,915 named slots.
- **Small-setting table** containing `0x606212c8`…: same 20-byte layout, class
  0x100, 1-byte elements. Holds `MODE_AF_SUBJECT_PRIORITY_*` and
  `MODE_CAF_SUBJECT_TRACKING_*`. Its full extent and its relation to persistent
  storage have not been mapped.

Neither table is a menu layout. A new AF-ON zone setting would probably need
entries in tables like these as well as a menu row; that is unconfirmed.

## 3. How settings are read

Direct reads by runtime key through `0x60063380(key, index, out)` are rare.
Only seven instructions in the whole main export load the keys checked
(`0x84d1`, `0x1e71` and one data-pattern false positive). The GUI and AF code
mostly reach settings by **UI ID** through descriptor tables and the UI-ID/key
layer. Menu definitions therefore probably list UI IDs in data, not code.

The settings getter `0x603f34ec` dispatches through `0x605bc548` and takes the
UI ID in its first argument.

## 4. Precedent from the upstream project

No upstream body has added a menu item. The nearest precedent is the PEN-F HSL
extension (`docs/color/pen-f/SETTINGS_STORAGE.md` and `EDITOR.md`):
- **Storage.** New persistent values went into spare **alternate cells** (part 1)
  of an existing stock setting array. Stock bank save, recall, C1–C4 and reset
  already carried those cells, so no new flash-write routine was needed.
- **Editing.** Editing reused a stock property-based editor and redirected both
  the numeric text and the graphics.
- **Graphics.** Bitmap text replacement in the resource component was done in
  place with identical dimensions. Any resource edit changes that component's
  checksum, and the updater programs it before main.

## 5. Implications for the AF-ON AF zone option

- **Storage.** The preferred route is spare cells of an existing array that the
  stock bank, save, recall and reset paths already carry, as on the PEN-F.
  - No spare cells have been identified yet.
  - The AF-ON profile needs at least: area type, frame position, target size,
    and possibly the orientation variants.
  - Arrays such as `0x99a1`, `0x5962` and `0x1dd1` must be checked for indices
    that are allocated in every bank but never read. A name existing for an
    index means it is in use.
- **Menu row.**
  - Adding a row needs the menu page definition: where the AEL/AFL rows are
    listed, plus their label resources and handlers.
  - A label that is a new bitmap or text means editing resource component 0106.
    That is a second changed component, updated before main, with its own
    checksum.
  - Not yet located.
- **Editor.** The stock AF target screen must open on the AF-ON profile's cells
  instead of the normal target. Not yet traced.
- **Risk.** Menu tables and settings are touched at boot (settings load and
  defaults), and a resource edit adds a component. Both widen the change
  compared with the AF Home prototype.

## 6. Menu structure (13 November)

Static decode of stock main data. Labels are text-resource IDs whose text has
not been decoded, so row meanings below come from the setting names.

### First level: menu items

- **List.** `0x61520552` is a 244-entry u16 list of menu items in menu order,
  used by My Menu's `IsItemRegisterable` (`0x611a5b6f`).
- **Records.** Each item has a 12-byte record (`u32 id, u16 kind, u16 label,
  u32 viewer`). The table near `0x6151aa1c` uses viewer `0x615189b4`, and there
  are other copies.
- **Sub-page items.** IDs above 2,915 have no setting name; these are items
  that open sub-pages.
- **AF section order:** `MODE_FOCUS_STILL`, `MODE_FOCUS_PLUS_MF`, 5261
  (label `0x0f19`), 5262 (label `0x11c4`), `MODE_AFL_MF`, 5263, …,
  `MODE_SUBJECT_DETECT`.

### Second level: sub-pages ("multi-row" pages)

- **Row table** `0x6158cee8`–`0x6158ee8c`: 225 rows of 36 bytes:
  `u32 setting_id, u16 kind, u16 label, u32 viewer (0x6158aeb4), u32 options,
  u32 option_count, 0, viewer, alt_options, alt_count`.
  - Options are 12-byte records: `u32 value, u16 kind, u16 label, u32 viewer`.
  - Kind 4 is a list.
  - Kind 12 is used by the subject-priority rows and the pixel-shift quality rows.
- **Sub-page table** `0x6158ee8c`–`0x6158f3b4`: 66 entries of 20 bytes:
  `u32 page_id, u32 rows, u32 row_count, u32 state, u32 0x6158b0b0`.
- **Viewer.** `Menu_MultiRows_Values_Viewer`'s constructor (`0x61203696`) finds
  the page by ID in a bounded loop of `0x42` (66) entries. It keeps the entry
  pointer, then looks for a page-specific handler in `0x6158f3b4` (26 entries
  of 12 bytes).
  - Pages 27, 28 and 29 have **no** page-specific handler.
  - So their rows are drawn from the entry's row pointer and count. This is
    inferred from the constructor; row iteration itself is not yet traced.

Relevant sub-pages:

| Page | Rows (options) |
|---:|---|
| 25 | `MODE_HALF_RELEASE_AF_SAF`, `MODE_HALF_RELEASE_AF_CAF` (2 each) |
| 26 | `MODE_RELESE_PRIORITY_SAF`, `MODE_RELESE_PRIORITY_CAF` (2 each) |
| **27** | **`MODE_AF_SUBJECT_PRIORITY_RELEASE`** (label `0x06b1`), **`MODE_AF_SUBJECT_PRIORITY_CUSTOM_SW`** (label `0x282c`); 2 options each, values 1/0 (labels `0x127b`/`0x124f`, probably on/off) |
| 28 | `MODE_AF_HOME_AREA_TYPE`, `_CCW`, `_CW` (10 zone options each) |
| 29 | `MODE_AF_HOME`, `_CCW`, `_CW` (0 options: a special editor, presumably the target-position screen) |

**Page 27 is the stock per-button Subject Detect page:** one row for the
shutter button, one for the custom button. It strongly supports the owner's
recollection. Its effect still needs the stage-2 check (log G2b).

**AEL/AFL rows.** `MODE_LOCK_SAF/CAF/MF` are not in the multi-row table. They
appear as 12-byte records at `0x615978bc` and `0x61598cdc` (viewer
`0x61595b40`), with labels `0x06a1`, `0x06a2` and `0x0659`. The S-AF and C-AF
labels match the labels of the S-AF and C-AF rows elsewhere. This looks like a
dedicated AEL/AFL page with its own viewer, not a generic multi-row page;
not traced further.

### What this means for adding the AF-ON zone option

- **Narrowest UI change found.**
  - Give one generic page an extra row: put a new row array (the stock rows plus
    one) in owned space, and change that page entry's row pointer and count.
    That is 8 changed bytes in the page table plus the new array.
  - Page 27 is the natural host ("per-button AF behaviour"): shutter-button
    subject priority, custom-button subject priority, then a new "AF-ON zone"
    row.
  - The AEL/AFL page itself uses a dedicated viewer and would be harder.
- **The row needs:** a setting ID with storage (still open), an option list
  (the zone choices can reuse page 28's 10-option list `0x6158ba1c`), and a
  label.
  - Reusing an existing text ID avoids editing resource component 0106.
  - A new wording needs a resource edit.
- **Position editor.** Page 29's 0-option rows (`MODE_AF_HOME*`) are the
  pattern for the target position, so a second row may be needed for position.
  Its editor is bound to the AF Home settings and would need redirecting.
  Not traced.
- **Unverified assumptions:**
  - other code does not assume rows are contiguous in `0x6158cee8`, or index
    them by position (`0x60d41c82` holds one direct row pointer, to row 104);
  - My Menu, help text and cursor memory tolerate a third row on page 27.

**Owner decision, 13 November 2026:** the AF-ON AF zone row goes on the
per-button AF page (page 27), after the two subject-priority rows. The AEL/AFL
page is not modified.

### Viewer row iteration (13 November, partial)

- **Row lookup.** `0x61203a81` reads the page entry (object field `+0x13e8`),
  then its row pointer (`+4`) and count (`+8`). It walks the rows with a
  36-byte stride and matches each row's setting ID against an ID supplied by a
  generic list model (`0x6120310a` → `0x611f6add`, list at model `+0x2c`,
  count at `+0x30`).
- **Open: where the visible-row list comes from.** It is built at run time. If
  it is built from the page entry, changing the pointer and count is enough. If
  it comes from separate data, that data needs the new ID too.
- **Page title.** The page entry's fourth field is the page's title record.
  Page 27's title label `0x1279` equals the label of top-level item **5393**,
  so item 5393 opens page 27.
  - Similarly, page 25 matches item 5262 (`0x11c4`) and page 26 matches item
    5263 (`0x0b90`).

## 8. Storage for the AF-ON profile (13 November)

### How stored settings work

- **Keys.** Settings are addressed by a 16-bit **key**: `slot << 4 | type`.
  Distinguish the typed accessor (`0x60063a20`, tests signed bit 3 and masks
  with 7) from the area packing helper (`0x60061333`, masks with 3 and
  maps zero to 4). The latter gives the stored widths 1, 2 or 4 for this
  table. For example, `0x6bcd` stores one byte per element, not five.
- **Registry.** `0x600624d3` finds a key's runtime record in one of two RAM
  registries (`0xa32a990c`/`0xa32b190c`, 8 bytes per slot). Indexed reads are
  **not** bounds-checked.
- **Registration.** Registration (`0x60062536`) walks ROM tables of
  `u16 key, u16 count, count×width defaults`, padded to 4 bytes. These are the
  same ranges `OM3CoreRAMSettingsProof` uses.
  - Bank-7 table `0x600e4bec`–`0x6011fe20`: 1,215 keys.
  - Other tables: 452 keys (`T0`), 128 (`T2`) and 204 (`T3`).
- **ID maps.** UI-ID-to-key maps exist for four ID ranges:
  - IDs below 2,256 at `0x6062555c`;
  - 3000–3046 at `0x606249bc`;
  - 10000–10070 at `0x6061dd72`;
  - 15000–15455 at `0x6061906e`.

### Results (scratch scan of every bank-7 key against all four ID maps)

- **Every AF target array is fully used.** All allocated cells of `0x99a1`
  (8), `0x5962` (6), `0x1dd1` (10), `0x1de1` (8), `0x9a41`, `0x84d1`, `0x88b2`,
  `0x90a1`, `0x99d2`, `0x9fa1`, `0xdfa1`, `0x90d1` and `0x5a11` have a UI ID.
  There is no PEN-F-style spare part.
- **Unnamed cells in AF-related arrays: one byte each.**
  - `0xc021` (`MODE_FOCUS`, 6 cells) index 5;
  - `0x8de1` (`MODE_SAF_MF`) index 5;
  - `0x6761` (`MODE_AF_TRACKING_AF_CHANGE`) index 5;
  - `0xfde1` index 0.

  "Unnamed" is not "unused": code can read an index computed at run time.
  Each would need a reader search, and one byte holds only the zone type.
- **31 bank-7 keys have no UI ID at all.** Examples: `0x1cb4` (76×4),
  `0x6bcd` (128×1), `0x83e4` (20×4), `0x8b54`/`0x8b64` (large) and several
  single bytes.
  - These are internal state or buffers, presumably used by code directly.
  - Ownership is unknown; not usable without proof.

### Options, none established

1. **Pack the profile into unnamed cells.** Zone type fits in one byte.
   Position (u16) and size need more. Only a few bytes exist, and each needs
   reader and ownership proof. Weak.
2. **Add a new registration record.** Put a new key with ~12 bytes (zone,
   position and size for three orientations) in bank 7.
   - This changes the registered layout and probably the stored settings image.
   - Effects to establish: load of settings saved by stock firmware, checksums,
     custom modes and reset, and OM Workspace backups.
   - It touches boot-time settings load, the high-risk category. Strong but
     risky.
3. **Keep the profile in the feature's own RAM, with no persistence.** It
   resets to a default at every power-on. Safe, but fails the requirement that
   the setting survive power-off.
4. **Reuse an existing user-visible setting that the owner gives up.** For
   example, the movie AF target arrays (`0x99a1` indices 6/7 are the movie zone).
   This is what the AF Home design did. The owner has rejected sharing with
   AF Home, and any other reuse would also need the owner's agreement.

### How the PEN-F HSL extension stores its extra values (upstream precedent)

Sources: `docs/color/pen-f/SETTINGS_STORAGE.md`, `STRUCTURES.md`,
`docs/protocols/pen-f/SETTINGS_BACKUP.md`, and
`patches/hsl/pen-f/src/editor_storage/settings.s`, `settings_lifecycle.s` and
`src/settings_backup/settings_backup.s`.

- **No new storage.**
  - Saturation settings 931–966 each have two stock-allocated parts. COLOR
    uses part 0.
  - The 54 reviewed mode/submode filters never select part 1 for these IDs.
    Part 1 of *other* settings is in use, so only these 36 cells were claimed.
- **Tagged cells.**
  - Each claimed cell holds `0x4831CCVV`: a fixed marker, the value byte, and
    its complement.
  - Anything else decodes to neutral. This makes stock or uninitialised
    contents harmless.
- **Stock APIs only.**
  - Reads and writes go through the stock read/write-ACTIVE-alternate routines
    (`stock_active_get/set` with part 1).
  - There is no new flash writer, allocation or counter. Stock bank save,
    recall, C1–C4, reset and checksums carry the cells.
- **Live copy.** A small RAM copy is republished at boot, on commit of a
  settings transaction, and on profile refresh. This uses three hooks into stock
  code.
- **Workspace backup.**
  - Unnamed cells are not in the camera's named backup records, so the
    extension also hooks export and import.
  - It adds one record per bank, `2,PENF_HSL_V1,<hex>`, validated on import.
  - Workspace keeps unknown named records without needing changes.
- **Testing.** Reboot persistence, C1–C4, reset and a Windows backup/restore
  were tested physically.

### Applying it to the OM-3: candidate stock-allocated, unclaimed cells

The OM-3 equivalent of "part 1" is an index inside a stock bank-7 array that
no UI ID names. Arrays with enough unnamed space for a ~12-byte AF-ON profile
(zone type, size and position for three orientations), plus a marker:

| Key | Array | Unnamed cells | Named examples |
|---|---|---|---|
| `0x5b82` | 16 × u16 | 13 (26 B): idx 0–4, 6–11, 14, 15 | `MODE_COLORTONE_TOY_PHOTO_TYPE3_CURSOR`, `…VINTAGE_TYPE3_CURSOR` |
| `0x5b52` | 16 × u16 | 12 (24 B) | `MODE_COLORTONE_FANTASIC_FOCUS_CURSOR`, `…LIGHT_TONE_CURSOR` |
| `0xf5f1` | 25 × u8 | 22 (22 B) | `MODE_ART_EFFECT_HYBRID_TOY_PHOTO_TYPE3`, `…VINTAGE_TYPE3` |
| `0xf5e1` | 25 × u8 | 13 | `MODE_ART_EFFECT_HYBRID_POPART_TYPE2`, … |

These look like the PEN-F case: arrays indexed by art-filter number, where only
the filters that have a type-2 or type-3 variant name a cell. The others are
plausibly unreachable.

**Not yet proven.** Every reader and writer of the key must be shown to index
only the named art-filter positions:
- art-filter menus;
- bracketing;
- reset and default tables;
- the `ORIGINALLY` copies;
- remote and Wi-Fi settings;
- My Menu.

Defaults in the registration table are 0, so a marker word distinguishes
claimed data from stock contents. Without a backup extension, OM Workspace
backups would not carry the AF-ON profile.

### Comparison with adding a new key

| | Claim unnamed stock cells (PEN-F method) | Append a new registered key |
|---|---|---|
| Registered layout | unchanged | grows at the end of bank 7 |
| Stock saves loaded by modified firmware, and the reverse | unaffected by layout | must be established |
| Save, recall, C1–C4, reset | stock code already carries the cells | must be established |
| Main risk | an unproven stock reader of the cells | boot-time settings load and checksum |
| Precedent | physically tested on PEN-F | none |

**Recommendation:** follow the PEN-F method first. Prove ownership of a
candidate (start with `0x5b82` or `0x5b52`) before studying a new key.

Before choosing a new key, test stock-to-modified and modified-to-stock
loads against the packed layout below. In particular, determine how to
initialize a new field on a checksum-valid stock save, and whether stock
save, reset and backup preserve or overwrite it.

### Bank 7 initialization, validity and fallback

Verified for stock OM-3 E147 1.1 / main build 1100. These are CPU addresses
in decoded main component `0100` (base `0x60021020`, SHA-256
`5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`).

- **Stock descriptor.** At `0x600627bf..0x6006282c`, initialization creates
  the bank-7 descriptor at the pointer held in `0xa32bb920`. It takes area
  ID `0x000c` from the first halfword at `0x600e4be4`; the ROM defaults
  records begin eight bytes later at `0x600e4bec`. The descriptor stores
  source slot A = `0xa36fd280`, **slot B = null**, live RAM =
  `0x62920700`, and byte length `0x40000`. The selection helper supports
  two copies in general; this stock initializer does not give bank 7 a
  second source pointer.
- **Per-copy validity.** `0x60060f69` passes each non-null source, its
  byte length and the expected ID to `0x6006137a`. That routine checks
  the unsigned halfword at offset 0 against the expected ID, then adds
  **all 131,072 little-endian halfwords**, including the ID, checksum,
  generation counter and last halfword. The final low 16 bits must be
  zero. The validator returns 0 for valid and 1 for invalid. The area
  header's checksum field is at +2: `0x60061422` stores the additive
  complement computed by `0x6006142e`, which excludes that field. The
  generation counter at +4 is a 32-bit word (`0x6006144c` increments it).
- **Copy selection.** With one valid copy, `0x60060f69` selects it. With
  two, the newer generation must be exactly one greater modulo 2^32
  (including `0xffffffff -> 0`). Equal or non-adjacent generations go
  to the same failure result (`0xfe`) as no valid copy. The generic
  two-absent-pointer path returns `0xff` separately. For the stock
  bank-7 descriptor, the ordinary decision is valid A or fallback.
- **Boot path and what "reset" means.** Boot registration routine
  `0x60062691` calls `0x60063afc` in load mode, which reaches
  `0x60063dc0`. With the bank-7 flag at request +8 enabled, the call at
  `0x60063e85` runs `0x600610d2`. On success the native copy loop
  `0x6006148f` copies the entire selected area into live RAM and the
  caller clears `0xa32bfb30`. On failure the caller copies A's +4
  counter into live RAM (`0x60061107`), sets `0xa32bfb30=1`, and
  dispatches defaults via `0x60062a60(7) -> 0x60062d28 -> 0x60062d93`.
  This rebuilds the packed values from ROM at live +8 and rewrites the
  live ID, then requests a runtime registry rebuild. It does **not**
  clear the whole 256 KiB buffer or write a fresh flash area in this
  branch.
- **Layout and compatibility.** `0x600622b4..0x60062368` feeds the ROM
  descriptor stream and a live payload pointer (`0x62920708`) to
  `0x60062536`. In this mode it assigns value pointers in descriptor
  order, aligning 2- and 4-byte entries, rather than reading keys from
  the saved values. Walking the 1,215 stock ROM records puts the first
  byte beyond the registered values at live +`0x39465`
  (`0x62959b65`), matching the defaults routine's published end.
  `0x6b9b` bytes then remain within the checksummed area; that is a
  size calculation, not proof that the tail or any particular cell is
  available. Inserting a descriptor before later values can change
  their offsets. Appending leaves earlier offsets intact if the layout
  is otherwise unchanged, but a checksum-valid old area can still be
  accepted: the new field would read whatever is already at its offset.
  The validator is not a schema or migration check. No added key,
  reserved-tail ownership, save/restore compatibility or on-camera
  behavior was proved.

**Bounded execution.** [OM3Bank7BootProbe.java](../../scripts/OM3Bank7BootProbe.java)
runs stock `0x60063dc0` with synthetic RAM copies and only the bank-7
load flag enabled. The three stock-shaped cases (valid A, wrong ID with
valid sum, and last-word corruption) and seven synthetic two-copy cases
passed. The probe checks whole-area copying on success and, on fallback,
the restored live ID, preserved A generation, ROM values start, published
end, defaults flag, and unchanged poisoned tail. For the defaults routine
it inherits the bounded multiply model; diagnostics and the post-load
registry rebuild are intercepted. It does not run the physical boot chain
or flash I/O. See [results](readiness/bank7-boot1/results.txt) and
[source/input hashes](readiness/bank7-boot1/evidence-manifest.json).

To repeat, use the existing Ghidra 12.2/JDK 25 workspace with the pinned
MN10300 language and decoded payload imported at `0x60021020`. Run from
the research root, create a fresh output directory, and invoke:

```text
analyzeHeadless ghidra-projects OM3_main_full -process 00_0100_50000020.decoded.bin -noanalysis -readOnly -scriptPath scripts -postScript OM3Bank7BootProbe.java path/to/output
```

For the static end calculation, start a ROM cursor at `0x600e4bec` and a
live offset at 8. Read each little-endian `{u16 key, u16 count}` until a
zero key. Compute `width = (key & 3) or 4`; advance the ROM cursor by
`4 + count * width` rounded up to 4 bytes. Align the live offset to
`width`, then add `count * width`. The zero-key record at
`0x6011fe20` is not a value record.

### OM-Emu cross-check and switching to stills

Primary emulator for OM-3 UI work: [flatpanda/om-emu](https://github.com/flatpanda/om-emu).
Independently verified on E147 1.1, revision
[`4e4ec4ef`](https://github.com/flatpanda/om-emu/tree/4e4ec4ef084542a7e30eecce56970c7e09c123c9),
with Node 26.12.1 and the pinned stock main/resource hashes. The local
[Windows path patch](readiness/om-emu-e147/windows-fileurl.patch) only converts
file URLs to Windows paths in two host helpers; it changes no emulation logic.

**To switch the OM-3 from video to stills:** use the player's
**Still / movie switch** and choose **stills**, position **2**. With the
player focused, **U** steps through the positions; stop when the control
shows **stills**. Positions 0 and 1 are both movie positions. This is a
separate control from the exposure mode dial. With the player input API
use `{"type":"switch","id":"still_movie","value":2}`; on the CLI use
`switch:still_movie=2`. The following explicitly moves from video to stills
in a clean E147 session (run from the OM-Emu checkout):

```sh
node emu/bin/fetch-fw.mjs --model E147 --bin /path/to/OLY_E_147_1100_0000_0000.BIN
node emu/bin/session.mjs --model E147 --no-card wait:1500 switch:still_movie=1 wait:1000 switch:still_movie=2 wait:1000
```

The [upstream switch documentation](https://github.com/flatpanda/om-emu/blob/4e4ec4ef084542a7e30eecce56970c7e09c123c9/emu/README.md#L383-L394)
and [upstream regression test](https://github.com/flatpanda/om-emu/blob/4e4ec4ef084542a7e30eecce56970c7e09c123c9/emu/test/test_smswitch.mjs)
describe this input. Older E147 builds may start in video and lack the
control; use a revision supporting `still_movie`. If a kept session and the
switch label disagree, deliberately move to a movie position, then back to
**stills**: the application updates its movie-mode setting on a switch event.
A clean session on the tested revision starts at position 2.

**Observed locally:** in the [live switch trace](readiness/om-emu-e147/switch-getter.jsonl),
the firmware getter for setting 44 returned 0 at fresh start, 1 at position 1,
1 at position 0, and 0 after switching back to position 2. Movement takes
the stock `0x02021909` input event. The [CLI session](readiness/om-emu-e147/switch-session.jsonl)
also passed with no memory pokes.

**Bank 7:** [all ten equivalent cases](readiness/om-emu-e147/bank7.jsonl)
passed on OM-Emu's CPU interpreter. As in the Ghidra experiment, the
isolated runner supplies synthetic RAM copies and intercepts diagnostics
and the registry rebuild. Separately, instruction coverage in the normal
blank OM-Emu player session reached the stock registry bootstrap, bank-7
load call, validator and defaults builder, and did not hit the bank-7
valid-copy success branch. The bootstrap label `0x50041671` is OM-Emu's
disassembly notation for runtime `0x60062691`. Normal startup still uses
the lab's hardware models; these tests do not establish physical NAND
behavior or modified/stock save compatibility.

From the research root, run the [probe](../../scripts/om_emu_e147_probe.mjs)
with either `bank7` (isolated cases) or `switch` (player startup and getter):

```sh
node scripts/om_emu_e147_probe.mjs tooling/om-emu analysis/decoded/00_0100_50000020.decoded.bin bank7
node scripts/om_emu_e147_probe.mjs tooling/om-emu analysis/decoded/00_0100_50000020.decoded.bin switch
```

See the [evidence manifest](readiness/om-emu-e147/manifest.json) for the
revision, input, probe and result hashes.

### Live stills integration and a bank-7 append experiment

These runs use the same OM-Emu E147 revision and stock hashes as above.
See [the run manifest](readiness/om-emu-af-integration1/manifest.json).
No camera was accessed and no installable image was made.

**What transferred from the previous prototype.** A matched pair of
OM-Emu stills sessions ran stock and the exact 3,612-byte archived AF Home
prototype change set (SHA-256 of the changed main component:
`4a988c57d1a15d2465292a296bfd60dd690cc0c76dd60ae8165848f847c5b325`).
The changes existed only in an OM-Emu overlay. Both sessions enabled
component and native transaction paths, opened and closed the menu to
restart through display, and tested AF-ON alone and during S1.

- The overlay booted in the lab. Its native key IRQ hook ran and changed
  the four shooting-table fields to the exact four wrappers. The installed
  marker was 1; the feature mutex ID remained zero. This confirms the
  placement and installation in this session, and that the interrupt
  path did not create the feature mutex.
- S1 in both sessions moved the stock shooting sequence phase
  `101 -> 103 -> 101` (the lab supplies its documented TAKE-ready event).
  The GUI received `0x01000002` and `0x01000003` while its shooting state
  was `0x5101`. A pass-through observer at `0x610b9feb` saw those
  events select rows **`0x61339090` and `0x613390a0`**, both
  targeting `0x610aef37` in both sessions. The archived installer changes
  other rows (`0x6131bd50` and `0x6131bd60` for S1), so these live
  routes did not hit the feature.
- AF-ON press/release produced UI_IN custom-key events
  `0x0200000b` / `0x0201000b`. Neither session delivered corresponding
  events to the observed GUI engine during those steps. Consequently
  neither view exercised the AF-ON wrappers, queue-95 start, or its
  acknowledgement during this sequence. This is a boundary in the
  current setup, not evidence that AF-ON fails on the camera.
- The upstream control hint's SID 1936 is **not** the E147 button
  assignment: the exact E147 resource setting-name table names it
  `MODE_RECENTLY_PLAY_CURSOR_PAGE_3`. OM-Emu's native setter refused
  value 69 for it (allowed 1..7). Do not force this ID to make the
  experiment pass. Several E147 custom-button IDs accept 69 or 9; that
  does not establish which is used by the AF-ON body key.

The [stock trace](readiness/om-emu-af-integration1/stock-final.jsonl) and
[overlay trace](readiness/om-emu-af-integration1/overlay-final.jsonl) record
each event and selected handler. The earlier 28/28 and native first LOCK_START
remain evidence from the Ghidra shooting-context fixture (including state
`0x5100` and supplied button events), not a live OM-Emu profile pass.
The archived prototype still uses AF Home; neither run implements the
revised independent menu, validates the overlay drawn by the camera, or
establishes physical focus.

**UI storage.** The native E147 string getter confirmed the page-27
title at `0x1279` contains **AF Button** (the returned string includes
icon tags). The [stock page records](readiness/om-emu-af-integration1/menu-layout.json)
pin its descriptor at **`0x6158f0f8`**, with row pointer at
`0x6158f0fc` and count at `0x6158f100`. The two 36-byte rows are
at `0x6158dc44` and `0x6158dc68`, IDs 2154 and 2155. The
next row at `0x6158dc8c` already belongs to page 28. A third row
there would overwrite AF Home's first row.

A candidate arrangement is a separate **108-byte** array with the
two original rows and the new AF-ON row, referenced from page 27.
Keep half press on the normal target control, keep AF Home unchanged,
and use page 28's zone-choice list as a reference or source for matching
options; its 10 entries alone do not prove coverage of all normal target
or custom-size choices. The added row needs a distinct logical setting
ID, a label/resource entry, and a routing decision for opening the
target editor on the correct profile.

The page descriptor is only one layer. Assembly at
`0x61203b95..0x61203ba1` reads the page's row pointer and count.
At `0x61203bec` the viewer resolves a setting ID through the list
model (`0x6120310a -> 0x611f6add`), then the instruction at
`0x61203c20` compares that ID with the 36-byte row's leading word.
The selection path `0x61203e81` also calls the list model and resolves
against the page records. This gives two things to validate: the
expanded descriptor list and the producer of the visible IDs. The
producer for a new row, text-resource placement, and target-editor
writes have not been demonstrated. The string calls for the two stock
row labels returned an icon/value fragment and null, respectively;
that is not proof of their rendered labels or per-button AF behavior.

**Settings storage.** The [append probe](readiness/om-emu-af-integration1/bank7-append.jsonl)
calls stock `0x60062d93` (defaults), `0x60062536` (registry),
`0x60061422` (checksum) and `0x6006137a` (validation) in
OM-Emu. It copies the stock descriptor stream into scratch RAM, appends
one experimental record of four words, and compares the registry byte
for byte against stock except for that added entry. The new value
address is **`0x62959b68`** (bank offset **`0x39468`**); the next
free byte becomes **`0x62959b78`**. Four words are enough for a
candidate version/validity word and one packed word per orientation
(e.g. zone enum, size selector, position). Exact encoding and custom
geometry still need testing. The experimental key was chosen from a
slot absent in five scanned ROM streams; it is **not a production
key reservation**.

- A checksum-valid stock-shaped area kept its existing tail bytes
  (`0x59595959`) when the new descriptor was registered. It did not
  initialize the new field.
- Extended defaults zeroed the new field, preserved the full stock
  value prefix, and left the following bytes untouched.
- The stock validator accepted a synthetic extended area with its
  checksum correctly derived by stock code. The old stock registry
  ignored the added value because its descriptor was absent.
  This does not establish what saving, reset, custom modes, or backups
  subsequently do to those bytes.

The ROM stream cannot be enlarged in place just by replacing its
terminator: after the zero key/count at `0x6011fe20`, the next word
is already `6`, followed by other stock data. A design needs a new
descriptor stream location or another way to register/default only
the new records without changing the stock traversal. The runtime
tail calculation and scratch proof do not establish exclusive ownership
of that tail. Keep a distinct validity marker and reject unknown
versions/invalid fields before ever using old data as a target.

Reproduce locally from the research root using the stills section's
OM-Emu setup:

```sh
node scripts/om_emu_af_player.mjs tooling/om-emu stock
node scripts/om_emu_af_player.mjs tooling/om-emu overlay analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv
node scripts/om_emu_bank7_append_probe.mjs tooling/om-emu analysis/decoded/00_0100_50000020.decoded.bin
```

### Live OM-Emu AF-ON input and dispatcher regression

The live stills input test now reaches the firmware application for both
buttons. The independent-profile test remains open. The experiment uses E147
1.1 (`OLY_E_147_1100_0000_0000`) and OM-Emu
`4e4ec4ef084542a7e30eecce56970c7e09c123c9` with the two local Windows
path-handling fixes described above. The archived AF Home overlay is loaded in
emulator memory for comparison. Its persistent-setting and menu behavior
predates the independent AF-ON zone design.

**Cause of the lost AF-ON edges.** The player initializes the released level
for keys in its control map. E147's active matrix also contains an active-low
`0x120b` key at group 1, byte 0, bit 3. It is missing from the released-level
map, so the stock broker has it marked physically held and published at
`0xa31f1f44`. Default AF-ON uses `0x000b` at group 1, byte 0, bit 1. Its
press reaches `0x60414d9c`; the search at `0x60414cfb` finds the held
`0x120b` entry and the remap returns zero. Release also returns zero on that
setup. The later 75-entry broker filter is empty and receives the zero
already returned by the remap.

Two ways of clearing that conflict both restored AF-ON: a real player release
of `0x120b` after startup, and registering that slot in the player's idle
image before startup. The latter is the preferred test setup. It changes the
virtual key level only. It preserves the default AF-ON binding, the broker
and the normal application dispatch. Binding AF-ON to `0x120b` instead
exercised a distinct custom button and read default assignment 3462 from
setting 49. Setting that other button to 9 or 69 confirmed where its
assignment came from. The default `0x000b` input already reads value 69
(`0x45`), which E147's table at `0x612f20a8` maps to function `0x0a`.
The exact setting ID supplying that default value remains open.

**Native routes observed after the idle correction.** AF-ON down/up reach
`0x60415e53` and emit the custom-button events `0x010000cc/cd` and
`0x01000032/33`. In the default live run, the latter select
`0x6131be80/90` while S1 is up and `0x6131c8f0/900` while it is held.
The raw input sequences cover each button alone and both press/release
orders. S1 reaches the native dispatcher and, in the default case, changes
the modeled shooting phase 101 → 103 → 101 through fallback rows
`0x61339090/a0`. While AF-ON remains held, S1 transitions also replay
`0x01000032` without a fresh AF-ON press. A hook on the generic event has to
distinguish AF-ON from other assigned buttons and repeated dispatch from a
new ownership edge.

The archived installer targets S1 rows `0x6131bd50/60` and AF-ON rows
`0x6131c290/a0` (events `0x01050007/08`). In the default stills session
none of those rows is selected. Selecting S-AF and setting its AF Button
mode to firmware value 0 did select the archived S1 rows and execute both
S1 wrappers, including native mutex creation. AF-ON reached stock
`0x610a5620` through the custom-button route under that configuration.
The start call comes from `0x610a267f` (mode argument 1, raw application
event `0x01000032`). Observed releases reach `0x610a58c7` from the call
ending at `0x610a2fd0`; the release immediately after the first AF start
also selected a separate row, `0x6132add4`. Neither AF-ON wrapper ran.
The S1 wrappers recorded held-edge changes and status 1, with owner
still `0xff`, gate halfwords `0xa33ca314` and `0xa33ca2b8` both
zero, and no published change to the ten-byte AF target. The bounded
prototype had supplied `3` and `0x1700` at those gates. For live work,
trace the native producers: the reset at `0x608fe2f5` writes phase
`0x3000` and calls `0x609025cf`, which writes mode `0x0f7f`.
Those reset values also fail the prototype's transition gates.

Stock and overlay both completed a fresh S-AF mode 0 input sequence.
Separate fresh stock sessions for S-AF modes 1–2 and C-AF modes 0–3
all hit the `0x603f17f1` memory fault during a native setting write
before measuring any button edges. A write while cycling modes after
button input also hit it on both builds. Those are setting-configuration
boundaries in this harness, with no result for the remaining modes.
Neither the queue-95 start nor its downstream queue-94 lock start was
observed in the completed sessions.

Reproduction uses the [live probe](../../scripts/om_emu_af_live_probe.mjs)
and [trace manifest](readiness/om-emu-af-live2/manifest.json). The last argument
`idle-120b` sets the released state before boot. Use `raw` for the
negative control, `release-120b` for the independent validation by key
release, and `idle-120b:0:0` for a fresh S-AF / mode 0 session.

```powershell
$node = 'tooling/node-v26.12.1-win-x64/node.exe'
$diff = 'analysis/button-af/readiness/task-context-placement1/proposed-changed-bytes.csv'
& $node scripts/om_emu_af_live_probe.mjs tooling/om-emu stock - 0xb - raw
& $node scripts/om_emu_af_live_probe.mjs tooling/om-emu stock - 0xb - idle-120b
& $node scripts/om_emu_af_live_probe.mjs tooling/om-emu overlay $diff 0xb - idle-120b:0:0
```

### Live acceptance regression and third menu row

The [acceptance runner](../../scripts/om_emu_af_acceptance.py) starts fresh
OM-Emu player sessions. It checks native UI_IN and application events,
ownership after each real button edge, restoration of the ten-byte AF consumer
target, effective Subject Detect, saved SCP readback, shared AF mode, and
execution at the queue-95 and queue-94 start points. The sequence includes
each button alone and both press/release orders. The runner fails if any
handoff scenario fails. The independent editor and persistence require
separate acceptance once implemented.

**Shutter regression fixed in the emulator overlay.** The archived
task-context wrapper dropped the stock event on status 1, where no profile
has been published. The candidate unlocks and forwards the event to the stock
handler. Four live S1 edges reproduced the loss on the archive and reached
stock on the candidate, in the call order lock → unlock → stock handler.
The target state matched stock. Short conditional branches kept all wrappers
inside the checked placement. The new decoded overlay has 3,617 changed
bytes, SHA-256
`9814e916300c915843f0f9429b482d4dbdf9ad034d789017740e28c75ef81a84`.
The overlay is test input to OM-Emu. It remains based on the AF Home
prototype. One replay also left the prototype's half-press latch set when a
subsequent release selected a stock fallback row. The latch is therefore
unsuitable as a physical button-state oracle across alternate dispatch rows.

**Handoff failed.** The seven S-AF scenarios confirmed the requested
SCP values by native readback and exercised real button inputs. The native
AF consumer target remained zero, independent ownership was absent and
neither AF worker stage was observed. See the
[acceptance report](readiness/om-emu-af-acceptance1/primary-bank/report.json).

The original C-AF configuration attempt passed a scalar as the second
argument to a type-6 settings ID. Disassembly at `0x603f17d2` shows that the
argument is a pointer to a group of 32-bit values. The scalar value 1
accounts for the earlier read at address 1. With the pointer form, the
requested value still does not read back as C-AF. The probe also selected
the primary AF bank with the real Fn lever and attempted the native
settings database setter for key `0xc021`, index 1. The requested value 1
read back as 2 in the stored bank and 0 in the active setting.
Independently, the live stock stills AF Mode menu displayed C-AF, but the
confirmation key hit OM-Emu's event-storm guard at GUI state `0x0b02`.
No C-AF button scenario was measured in those runs.

**Page 27 requires a descriptor and a separate ID provider.** Starting from
live stills and pressing MENU, the probe navigated to AF Button using the
firmware-rendered text and native keys. Stock and the candidate showed the
two priority rows. The viewer resolves each displayed ID using
`0x6120310a` at the call from `0x61203bec`. The observed provider's virtual
getter `0x611af938` reads a count at object `+0x48` and a pointer to
16-bit IDs at `+0x54`. The count was 2 and the live list contained
2154 and 2155.

A RAM-only experiment relocated the page descriptor array, preserved the
two stock entries and added a third descriptor using existing Subject Detect
setting 1712 as a marker. Extending only the descriptor array still drew
two rows. Extending the live provider and its parallel arrays too made the
native viewer resolve ID 1712 and draw a third row. Both stock priority values
stayed at 1. This establishes the rendering path and what must change to
register a row. The borrowed setting was never edited or saved. Its visible
label was the stock `@A02F@ Priority` string. A second experiment reached the
same result by updating the source table only, leaving the native provider
constructor to allocate and fill its arrays. The source record is
`0x61529ce8` in the table at `0x61529ba4`, group `0x115`, with stock
ID pointer `0x61529812` and count 2. Constructor `0x611afaa1` takes the
count from record `+8` and copies from the pointer at `+4`. See the
[source-table experiment](readiness/om-emu-af-acceptance1/stock-menu-source.jsonl).

```powershell
$run = 'analysis/button-af/readiness/om-emu-af-acceptance1'
python scripts/om_emu_af_acceptance.py --candidate "$run/proposed-changed-bytes.csv" --out "$run/replay"
$env:OM3_LIVE_AF_MENU = '1'
$env:OM3_LIVE_AF_MENU_THIRD = 'descriptors' # Repeat with 'source' for both source tables.
& tooling/node-v26.12.1-win-x64/node.exe scripts/om_emu_af_live_probe.mjs tooling/om-emu stock - 0xb - idle-120b
Remove-Item Env:OM3_LIVE_AF_MENU,Env:OM3_LIVE_AF_MENU_THIRD
```

### Live native initialization and central button dispatch (2026-11-16)

The new [bounded live report](readiness/om-emu-af-native1/matrix-cpu3-final/report.json)
supersedes the mode-configuration and routing failures above, but does **not**
establish full AF acceptance. Both S-AF and C-AF with Subject Detect Off pass
the 12-edge profile handoff sequence. The other 12 mode/subject combinations
stop at an unserved CPU3 kernel notification. Full acceptance is **0/14**:
no run demonstrates both native queue-95 and queue-94 AF worker starts.

Inputs are OM-3 1.1, build `OLY_E_147_1100_0000_0000`, decoded main SHA-256
`5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`,
OM-Emu commit `4e4ec4ef084542a7e30eecce56970c7e09c123c9` with local changes.
The report records all unpacked block hashes and tested source hashes; the
[reproduction bundle](readiness/om-emu-af-native1/reproduction/README.md)
preserves the scripts and emulator diff. Runtime addresses below use the
`0x60021020` main-image base, not Ghidra's `0x50000000` notation.

**Observed native bring-up.** Calling stock initializers `0x6071181e`,
`0x608fe1b0`, then `0x609df7e4`, and activating native task 105 at
`0x609df84d`, initializes the AF target and leaves TAKE_FOCUS waiting on
queue 94. The probe checks the task identity and dormant state first. It
does not write the target gates or supply AF completions. This is partial
boot bring-up; TAKE_MAIN and TAKE_FUNC remain emulator stand-ins.

**Observed button handoff.** The emulator-only
[central-edge overlay](readiness/om-emu-af-native1/central-edge-v2.json)
hooks the classifier call at `0x610bf5e2`. It recognizes S1 source 2/3 and
AF-ON semantic `0x010000cc/cd` with physical source `0x01000032/33`, invokes
the existing reconciliation, then preserves stock classification. The
return path must restore MDR as well as registers. The previous handler-row
redirection is disabled. In both Off cases, AF-ON wins while both buttons
are held, both release orders restore ownership correctly, and each of
the 12 edges invokes exactly one matching reconciliation. Native target
records change from `[14,2,3,0,3,0,3,0,0,0]` to
`[14,2,2,0,1,0,1,0,0,0]` and back. The
[negative/stock controls](readiness/om-emu-af-native1/controls.json) exclude
another physical button assigned function 69 and preserve the compared
stock phase, GUI, settings and UI_IN values. This still uses the legacy AF
Home profile provider, not the proposed separate profile settings.

**C-AF selection corrected.** Type-6 settings require both a grouped pointer
and the native menu-to-storage conversion. Raw focus value 1 is MF; public
getter value 1 is C-AF. The probe calls converter `0x604050e5` before the
native grouped setter and selects the primary bank through the real Fn
lever. It asserts stored setting 289 and active setting 25 both read back
as the requested public enum (S-AF 0, C-AF 1). Earlier raw-1 trials were not
C-AF evidence.

**CPU3 boundary isolated, not bypassed.** With opt-in modeled CPU3 delivery,
native callback `0x608418fe` returns and clears the request byte, but posts
doorbell bit 1 through cross-core kernel request routine `0x6004e699`
(write at `0x6004e6ce`). This is not the function ring's bit 8. The deferred
ring at `0xa32c1274` is empty; running deferred IRQ 53 would not service it.
The emulator now reports an explicit unsupported boundary rather than
spinning on the unserved bit. All 12 nonzero-SCP cases reproduce this
boundary before completing their first measured button edge.

Disassembly closes the receiving-object identity:

- [Callback](readiness/om-emu-af-native1/cpu3-callback.txt) loads the halfword
  at `0x6004367a` (`0x3003`) and calls notification wrapper `0x608909a5`.
- [Notification wrapper](readiness/om-emu-af-native1/subject-notify.txt)
  selects native task/interrupt event-flag setters `0x6004cd21/0x6004cd97`.
- [Request task](readiness/om-emu-af-native1/subject-request-task.txt) at
  `0x60841a6b`, task record `0x6003f15c` (ID `0x3004`), waits for bit 1
  on that same flag, then consumes requests via `0x6084db1e`.
- [Command 1](readiness/om-emu-af-native1/subject-command-one.txt) stores
  the requested kind at `0xa33a1d14` and sets bit 2 on flag `0x3004`
  (halfword `0x6004367c`). The adjacent
  [loader task](readiness/om-emu-af-native1/subject-loader-task.txt), entry
  `0x60842bde`, task ID `0x3005`, waits on that flag and calls `0x60842cf1`.

The names MDET_DL_REQ and MDET_DL_LDL are inferred from adjacent task order,
firmware strings and the existing E143 implementation; the E147 entry,
flag and dispatch relationships above are direct disassembly observations.
A returned callback is therefore not a completed Subject Detect operation.
OM-Emu already models this CPU3 task/flag mechanism for E143 in
`emu/src/lab/mdet.mjs`, but E147 has no corresponding validated model facts.
Its address converter leaves unknown addresses unchanged; blindly applying
the E143 configuration would silently reuse unverified addresses.

Native CPU3 IRQ registration also exposed an observer defect: it checked
CPU0's handler table. The local E147 correction validates the table selected
by core register `0x8050` (bases `0xa32600c0`, `0xa3260650`, `0xa3260be0`,
`0xa3261170`) and keeps CPU3 handlers out of CPU0 delivery. This allowed the
native callback to return; it does not implement CPU3's kernel.

An independent attempt to start native TAKE_FUNC/TAKE_MAIN reached their
initialization dependency: the stock logger initializer writes
`0x50003090`, currently mapped read-only in the emulator. See
[trace](readiness/om-emu-af-native1/native-take-v2.jsonl). The mapping and
boot prerequisites remain to be established; memory was not made writable
to suppress the failure.

**Limits.** The overlay edits a section-7 call site without packaging or
placement proof. Its mutex covers reconciliation only. There is no separate
profile editor, persistence acceptance, demonstrated sensor/lens AF cycle,
or flashable image. Detection-Off handoff success proves routing and target
restoration under these modeled conditions, not focus acquisition or
Subject Detect bypass/restoration with a running detection engine.

## 9. Next steps

1. Port the CPU3 request/loader service using independently verified E147
   facts, beginning with flag `0x3003` and task `0x60841a6b`, then flag
   `0x3004` and loader `0x60842bde`. Preserve event-flag wait/clear semantics
   and execute native request bodies; do not substitute success for an
   unsupported wait or acknowledge doorbell bit 1 without its service.
   Verify driver initialization, learning-data dependencies and subsequent
   LAF callbacks before claiming Subject Detect completion. Separately
   resolve the native TAKE logger mapping/boot prerequisite and demonstrate
   queue-95 and queue-94 worker entry. Rerun all 14 live cases, requiring
   actual worker observations, both release orders, effective SCP mode,
   native target records and frame overlay. Existing Off handoff checks
   and C-AF configuration are regression controls, not open routing guesses.
2. Register the new AF-ON zone setting in both page 27 source tables. Route
   the stock target editor's reads and writes to the AF-ON profile while it
   is being edited, then verify commit and cancel through player keys.
3. Test a tagged profile through OM-Emu's kept E147 settings store and
   falsify interference on stock reset/save and C1-C4 transitions. Prove the
   descriptor placement/ownership, and trace named backup import/export.
4. Trace `0x90a1` through the stock AF request and compare its two priorities
   in scenarios where both native button routes are actually observed. A
   separate settings ID on a menu row is not proof of AF behavior.
5. On stock hardware, characterize the actual button assignment and AF Button
   page and record the overlay and focus behavior. No firmware readiness
   conclusion follows from the current tests.
