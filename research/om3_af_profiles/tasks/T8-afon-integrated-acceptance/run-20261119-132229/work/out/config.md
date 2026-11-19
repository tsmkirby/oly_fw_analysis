# T8 combined configuration

One labelled configuration. No new behaviour. EMULATOR-ONLY. Role: behaviour.

The overlay is `work/out/overlay-combined-t8.csv`. The static check `work/out/overlay-diff-t8.json` shows the T6 overlay and the T3m overlay differ only in the 15 profile-read bytes (addresses beginning `0x60a8f709`, stock bytes `ff` on both sides, 3262 rows, no other diffs). Each row's `section` is one numeric column, recomputed from the image section table at `0x60029b28`. Counts: section 1 = 1308, section 2 = 95, section 4 = 1856, section 7 = 3. The only section-7 addresses are the inherited bytes `0x610bf5e3`–`0x610bf5e5`. No section 6.

K1 is stock. K2 loads this overlay and does not install the profile-read hook or the editor hooks. The flag stays at its image value `0xFF`. Candidates load the same overlay and install the hooks below.

## Composition

The getter `0x60063380` is shared. The hook answers a T6 profile-read return address first. Otherwise, when the flag at `0xa031eef7` is 1 and the key is a layout key, it answers from the mirror the way T3m does. Every other caller passes through. The setter, the editor-copy restore, and the exit restore are the T3m hooks and run only on a candidate.

## Runtime hooks

| Hook | Address | Integration | Accepted source |
| --- | --- | --- | --- |
| Profile-read returns, then editor getter routing | `0x60063380` | `work/scripts/accept_t8_v1.mjs` lines 310–351 | T6 `accept_v1.mjs` lines 214–249; T3m `fix_v1.mjs` lines 408–424 |
| Builder converter observers | `0x60a8f71f`, `0x60a8f726` | `accept_t8_v1.mjs` lines 308–309 | T6 `accept_v1.mjs` lines 212–213 |
| Editor setter routing | `0x60063431` | `accept_t8_v1.mjs` lines 352–366 | T3m `fix_v1.mjs` lines 425–444 |
| Editor-copy restore, including the 72-byte record at `0x62954108` | `0x6119af02` | `accept_t8_v1.mjs` lines 368–389; restore writes at lines 260–272 | T3m `fix_v1.mjs` lines 343–367 and 446–467 |
| Direct-screen and custom-size exit | state log | `accept_t8_v1.mjs` lines 391–403 | T3m `fix_v1.mjs` lines 468–480 |
| Session-end exit | `power.off` shutdown entry, when the model fact provides it | `accept_t8_v1.mjs` line 406 | T3m `fix_v1.mjs` line 481 |
| Z5 menu row, only when the overlay session is opened | `0x6041931e`, `0x6041937f`, `0x60419446`, `0x60419696` | `zone_session_k1.mjs` lines 270–276 | T5/T6 overlay session |
| Pose stand-in | accelerometer entries in `pose.mjs` | imported unchanged, hash `09cb38618024a749ba4b15ee3be4e5140257d6c5145347567887196a81665358`, hooks from `pose.mjs` line 83 | T7 `pose.mjs` |

`initMirror` is `accept_t8_v1.mjs` lines 233–244, from T3m `fix_v1.mjs` lines 380–390. `enter` sets the flag and calls the getter once, lines 407–422.

Profile-read return addresses, from T6: zone `0x60a8f71c`, size `0x60a8f757`, position `0x60a8f76e`, plus-9 `0x60a8f789`. Bank selection uses pose word `0xa32c568c` and the cached Orientation Linked flags. Bank 1, 5 and 3 are indexes 1, 5 and 3.

## Test setup, not a behaviour change

- Native bring-up `0x6071181e`, `0x608fe1b0`, `0x609df7e4`, task 105.
- Public focus API: mode 289 S-AF, mode 1712 = 0.
- Setter writes `0x1db1[0]=1` and `0x1dc1[0]=1` after pose delivery. The half-press zone is set with direct-screen keys.
- If the editor cannot set mirror `0x9a41[0]`, the size check writes 4 at `0xa031eeb8` and `0x6031eeb8`.

Subject Detect is only read at `0x1e71[0]` and must be 0.
