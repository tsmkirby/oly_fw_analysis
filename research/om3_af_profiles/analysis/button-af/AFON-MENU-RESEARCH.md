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

Before choosing a new key, the registration/save path needs study: how bank 7 is sized,
saved, check-summed and loaded, and what a stock image does when it loads a
settings record with an extra key. That decides whether option 2 is viable.

## 9. Next steps

1. Done in part (section 6): generic sub-pages are decoded and the
   subject-priority page is page 27. Still open:
   - trace the multi-row viewer's row iteration, to confirm it uses only the
     page entry's pointer and count;
   - decode the text-resource IDs (`0x06b1`, `0x282c`, `0x0f19`, `0x11c4`) to
     confirm the labels;
   - locate the dedicated AEL/AFL page viewer `0x61595b40`.
2. Trace one reader of `0x606190b7`/key `0x90a1` to confirm it gates Subject
   Detect per button.
3. Map the bank layout of `0x99a1`, `0x5962`, `0x1dd1` and `0x9a41` (size per
   bank, which indices are read) to look for safe spare cells.
4. Trace the stock AF target selection screen's entry and its setting writes.
5. On the camera (stage 2): photograph the AEL/AFL page, the page holding the
   subject-priority setting, and the AF target screen.

Scratch scripts used for sections 1–2 are reproducible from this note's tables;
they read only the decoded stock main and resource components.
