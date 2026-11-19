# AF-ON editor: the position copies the exit has to put back

Emulator only. The Z5 overlay is unchanged: 3262 rows, sections 1 (1308), 2 (95), 4 (1856), and the three inherited section-7 bytes `0x610bf5e3`–`0x610bf5e5`. No new menu row. Values stay in RAM. A native build has to restore these copies, or not publish them, when AF-ON mode ends. This task does not choose a store and does not recommend hardware.

## Native sites

- Settings getter `0x60063380`. Settings setter `0x60063431`. The setter body reaches the word store at `0x60063519`.
- Getter helper `0x60063a20`. The dial's word load is `0x60063a58`.
- Mapped setter `0x6041937f`. UI 1339 is the position, UI 85 is the frame. The cell setter returns through `0x6041a202`.
- Editor-record save `0x6119af02`. It copies eight halfwords from the object at offset `0x42` to `0x60379d64`.
- GUI state log: the lab's `STATE_LOG`. Old state in `a0`, new state in `a1`.
- Direct screen `0x0405`. Menu `0x0b02`. Shooting `0x0108`.
- Flag `0xa031eef7`, cached `0x6031eef7`. Value 1 is AF-ON mode. The image byte is `0xFF`. Exit writes 0.
- Zone byte `0xa031e920`, cached `0x6031e920`. The Z5 image byte is 0. K1 reads `0xFF`.
- Mirror base `0xa031eeb0`. Layout in `work/out/profile-layout.md`.
- Settings word that the getter reads for this position: `0x62953c10`. Boot value 526. The uncached alias is `0xa2953c10`.
- Saved editor record: `0x60379d64`, 16 bytes. Boot value is `FF FF FF FF` then zeros.

While the flag is 1, a layout key is answered from the mirror. A write of `0x99a1` index 0 or 1 also stores the low byte in both zone aliases. Any other flag value passes the call through. Entry copies nothing. An `FF` byte, or an `FFFF` word, becomes descriptor 0 the first time the getter or setter runs.

## Exit handling

One behaviour change, EMULATOR-ONLY. The accepted exit still clears both flag aliases and restores both zone aliases from the snapshot taken when the flag was already 1. It now also writes back the entry snapshot of `0x60379d64` and `0x62953c10`, and it writes the half-press position into the editor object's halfword at offset `0x42`.

The object pointer is `a0` at `0x6119af02`. The restore runs when that copy returns and again when the state log leaves the screen, so a copy that happens before the state change and a copy that happens after it both end with the half-press value. A later normal edit's own copy is left alone: the restore is armed only for the AF-ON exit.

- A transition whose old state is `0x0405` and whose new state is not `0x0405` is an exit from the direct screen.
- The custom-size editor stays on `0x0b02`. Right's release `0x900b` marks it open. OK `0x900d` or MENU `0x900e`, while that mark is set, is the exit.

The mirror is not written on the way out. The AF-ON edit stays there. The half-press cells are not written by the hook.

## What a native build has to do

On every AF-ON exit, put these copies back to the values the half-press was using before the session:

- the word at `0x62953c10` (526 on a camera that has not moved the target)
- the 16-byte record at `0x60379d64` (the uninitialized `FF FF FF FF 00…` pattern, until a normal edit has saved its own record)
- the position halfword at editor+`0x42`

Leaving them published is what makes the next normal dial write 994. The mirror is the only place the AF-ON selection is kept.
