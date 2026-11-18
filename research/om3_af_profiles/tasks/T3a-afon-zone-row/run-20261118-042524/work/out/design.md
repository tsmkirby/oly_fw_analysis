# T3a design: page 27 AF-ON zone row

The row is native data in uncompressed section 1. Section 7 is compressed, so the page descriptor and the provider source record are redirected at run time. Get and set are EMULATOR-ONLY hooks. The 10-option editor does not open yet; the last section says why.

## Owned layout (overlay)

All of these bytes are in `work/out/overlay-changed-bytes.csv`. Stock bytes are `0xFF`. The range is the section-1 tail `0x6031e920`–`0x6031e9b4`, inside section 1 (`0x60134000`–`0x6031f000`, uncompressed). Nothing here is in section 6 or 7.

| Address | Contents |
|---|---|
| `0x6031e920` | Profile head: `u8` zone value `0`, magic `0xA7`, version `1`, pad `0`. Read and written through the uncached alias `0xa031e920`. |
| `0x6031e924`–`0x6031e927` | Left `0xFF`. |
| `0x6031e928` | Provider ID list, four `u16`: `2154`, `2155`, `0x3D6F`, `0`. |
| `0x6031e930` | 108-byte row array. Rows 0 and 1 are the stock page-27 rows. Row 2 is the new row. |
| `0x6031e9a0` | 20-byte editor descriptor cloned from UI 238, with the id replaced by `0x3D6F`. |

Third row, 36 bytes at `0x6031e99c` is not the start; the third row starts at `0x6031e978`:

`6f 3d 00 00  04 00  d2 0d  b4 ae 58 61  1c ba 58 61  0a 00 00 00  00 00 00 00  b4 ae 58 61  1c ba 58 61  0a 00 00 00`

That is setting `0x3D6F`, kind 4, text id `0x0DD2`, class `0x6158aeb4`, options `0x6158ba1c`, count 10, zero, class again, alternate options `0x6158ba1c`, alternate count 10. Page 28's zone row uses that same option list and the same text id.

## Label

Text id `0x0DD2`, the stock label of page 28's first zone-type row. A live string read returns `@A040@AF Target Mode`. No resource 0106 edit. There is no stock string "AF-ON"; `0x0DD2` is the existing zone-type wording, and the row sits on the AF Button page so the page title already says which button the page is about.

## UI id

`0x3D6F` (15727). It is above `0x3C5F`, so it is outside every range the mapped getter `0x60419446` handles (0–`0x8CF`, 3000–3046, 4000–4022, 4500–4521, 10000–10070, 15000–15455). A one-pass scan of the main image (`work/scripts/static_afon_v2.py`, `work/out/static-afon-v2.txt`) found no `u32` equal to `0x3D6F`, no `mov` immediate 16, and no `cmp` immediate 16. `all-functions.asm` has no `mov 0x3d6f`, `cmp 0x3d6f`, or `add 0x3d6f`. Provider IDs are `u16`, and `0x3D6F` fits.

## Runtime redirects (not overlay bytes)

These four fields live in compressed section 7. The probes write them after the image is resident. Each write is logged as `EMULATOR-ONLY` `runtime-redirect`.

| Address | Stock | Written |
|---|---|---|
| `0x6158f0fc` (page 27 row pointer) | `0x6158dc44` | `0x6031e930` |
| `0x6158f100` (page 27 count) | `2` | `3` |
| `0x61529cec` (source id pointer) | `0x61529812` | `0x6031e928` |
| `0x61529cf0` (source count) | `2` | `3` |

The provider constructor `0x611afaa1` copies that source when the page is entered. A live read then shows provider count 3 and ids `2154, 2155, 0x3D6F` (`discover-v6.jsonl`, `provider-before`).

The editor-descriptor hash bucket is RAM built by `0x60405865`. The probe inserts a node at `0x6031e9b8` into bucket `0x62a84b2c` (`0x3D6F & 0x7F`). `0x604058bc(0x3D6F)` then returns `0x6031e9a0`. That link is also EMULATOR-ONLY, because the previous bucket head exists only after boot.

## Get and set (EMULATOR-ONLY hooks, not native code)

Installed on stock code, never on an overlay byte:

| Hook | Behaviour for `0x3D6F` | Other ids |
|---|---|---|
| `0x6041931e` value getter | Returns the byte at `0xa031e920` | passthrough |
| `0x6041937f` setter | Writes `D1`'s low byte to `0xa031e920` and `0x6031e920`, returns 0 | passthrough |
| `0x60419446` mapped getter | Returns sentinel `0xA70F` | passthrough |
| `0x60419696` index getter | Returns 0 | passthrough |

A direct call of `0x60419315` / `0x6041937f` reads 0, stores 2, and restores 0, and `0x60419315(2154)` still returns 1 (`discover-v1.jsonl` through `discover-v6.jsonl`, steps `direct-get`, `direct-set`, `direct-restore`, `stock-get-still-works`). The sentinel was not followed by `0x60063380` or `0x60063431` during OK (`discover-v4.jsonl`). The hooks prove the value path. They do not prove the editor.

## Default

The profile byte is 0. That is the first record of list `0x6158ba1c` (value 0, image `0x23a3`) and the factory zero used for the half-press zone key `0x99a1` in the bank-7 registration window. The drawn row shows that option's glyph. A screen read describes the glyph as a grid marked "All". The text log does not contain the word "All"; the value is a kind-12 image, not a string. "Single" is the brief's example, not a measured name, so the default stays 0 until the chooser can be read.

## Why OK does not open the 10 options

Page 27's list model reports type 1 (`0x61203470`, observed at `0x61203e9b` with `D0 = 1` in `discover-v5.jsonl`). `0x61203e81` takes the type-2 path only when that call returns 2. On the type-1 path the word at viewer+`0x13e4` is 0, so the function returns without opening anything. The stock priority editor is a different family: OK on row 0 enters functions in `0x610e0000`–`0x610f0000` that OK on the zone row does not enter (`discover-v11.jsonl`, `onlyStock`).

Forcing type 2 (EMULATOR-ONLY, not part of the delivered route) does match setting `0x3D6F` at row `0x6031e978` (`discover-v8.jsonl`, `open-match`). The editor kind then comes from the object at model+`0x58`, whose `+0x5c` is 11. `0x61203e81` accepts only kinds 0, 1, 3, 4, 5 and 7, and rejects 11 (`open-reject`). Substituting kind 4 draws an exposure-compensation slider (`afon-chooser-v9.png`). Substituting kind 7 draws an audio-level slider (`afon-chooser-v10.png` from the kind-7 run). Substituting kind 1, which is the kind stored on the group-`0x115` record object, draws no new widget. The list model itself has two 8-byte records; only the first has an object (`0x6247a0a0`, group `0x115`, kind 1). The second object pointer is 0 (`discover-v10b.jsonl`).

## Native insertion points still required

1. A first-use installer in the section-4 code tail (`0x60a8f088`–`0x60a8f800`), not the constructor group at `0x602153fb`. It writes the four section-7 fields above and, after `0x60405865`, links `0x6031e9a0` into the editor-descriptor hash. A 16-bit branch cannot reach section 4 from `0x6041931e`. The long form is `mov imm32, An` (`fc dc` + abs32) plus `jmp (An)` (`f0 f4`). Data loads from packed code use the uncached alias.
2. Value get and set at `0x6041931e` and `0x6041937f`, branching on id `0x3D6F` to the byte at `0xa031e920`.
3. A guard in `0x60419446` and `0x60419696` so this id never binds a stock key. The prototype's sentinel `0xA70F` was not shown to be unregistered; a native guard should return key 0 only if that does not make the editor treat the row as unset, which is what key 0 did in the early probes.
4. The open path. The delivered hooks do not open the zone list. A native version still has to make OK on this row present the 10 records at `0x6158ba1c` and write the chosen value through the setter above, without writing `0x99a1`, `0x9a41`, `0x5962`, `0x1dd1`, or any AF Home key.
