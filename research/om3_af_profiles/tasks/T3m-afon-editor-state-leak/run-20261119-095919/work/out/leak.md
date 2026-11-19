# Where the position leaks

The defect is the one T3l carried forward. After an AF-ON edit that moves the target, the next normal dial writes position 994 into the half-press. K1 and K2, with the same dial and no AF-ON edit, write 526. p1 reproduced that on a fresh Z5 session and traced the reads. No behaviour was added in p1. The hook was the accepted T3l hook.

## The value that differs first

On the normal Up that follows the AF-ON exit, the half-press cells still match K2. The title settles on All. The first read that is not the half-press value is the halfword at `0x62473182`, value 994, loaded by `0x6119de25`. The sibling halfword at `0x62473176` is read as 526 on that same Up, then as 994 on the dial.

`0x62473182` is the editor object at `0x62473140` plus `0x42`. The eight halfwords there are the position record. After the AF-ON exit they are `994, 58, 544, 508, 976, 1012, 40, 76`. At boot, before the editor exists, those addresses hold heap pointers (`0x6247`), not a position.

The dial then reads that record and the settings word at `0x62953c10`. The getter helper at `0x60063a58` loads the word at `0x62953c10` and the getter of `0x5962` index 1 returns 994. K2's getter at the same step returns 526 for index 2, and the candidate's returns 994 for index 1 (`work/out/leak-p1-summary.json`, `getDiffDial`). The mapped setter is called with UI 1339 and UI 85, value 994, and the live cells `0x5962[1]` and `0x88b2[0]` become 994.

## Who writes it during the AF-ON session

Three copies hold 994 after the exit. Each one is written by the screen while the mirror getter is feeding it 994.

| Address | Boot value | After exit | Writer | When |
| --- | --- | --- | --- | --- |
| `0x62953c10` | 526 | 994 | `0x60063519` (uncached alias `0x6006351b`) | AF-ON Up |
| `0x62473182` | heap pointer | the 8-halfword record | the screen's editor object, source of the copy below | during the edit |
| `0x60379d64` | `FF FF FF FF 00…` | the same 8-halfword record | `0x6119af20` | AF-ON OK |

`0x60063519` is inside the cell setter that starts at `0x60063431`. The load the dial uses is `0x60063a58`: `mov (D2,A0),D0` after the index is shifted by 2 (`work/out/disasm-leak-p1b.txt`).

`0x6119af02` is the exit save. It takes the object in `a0`, sets `a1` to object+`0x42`, and copies eight halfwords to the immediate `0x60379d64` (`work/out/disasm-leak-p1.txt`):

```
6119af0f  mov 0x42,A1
6119af11  add A3,A1
6119af13  mov 0x60379d64,A0
6119af20  movhu D0,(A0)     ; eight times
```

p3 saw that object pointer as `0x62473140` (`work/out/leak-p3-summary.json`, `exitLeak.object`).

Other addresses that contain the halfword 994 are a generated position table (`0x62475af8`) and heap that the dial writes as a destination. They are not the cell the Up reads first.

## Why the exit restore missed it

The accepted exit restore writes two bytes. It clears both flag aliases to 0 and writes the zone snapshot back to both zone aliases. It does not read or write `0x60379d64`, `0x62953c10`, or the editor object. The screen has already stored 994 in those three places, so they are still 994 when the next dial asks for a position.

## The restore

p3 extends that same exit. At entry it snapshots the 16 bytes at `0x60379d64` and the 4 bytes at `0x62953c10`, and it keeps the half-press position (`0x5962` index 1). When the copy at `0x6119af02` runs, or when the state log leaves the direct screen, those snapshots are written back and the object's position halfword at +`0x42` is set to the half-press position. The mirror is not touched.

After that restore the minimal sequence matches K1 and K2 at every key (`work/out/leak-p3.jsonl`). The AF-ON Up still lands only in the mirror (`OPEN`, half-press frozen). The following dial leaves `0x5962[1]` and `0x88b2[0]` at 526. Subject Detect `0x1e71[0]` reads 0.
