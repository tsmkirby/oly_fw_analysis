# Correction-round frames

Emulator only. No storage decision and no hardware recommendation. Subject Detect read 0 on every shot in this round. The producer that schedules `0x610c8b66` was not named. Expected frames were copied from reference runs. The minus-6 sentence was not used.

## Reference frames, hashed before the candidates

K1e profile A is stock. The stock setter wrote half-press kind 3, zone 2, size `[3, 3]`, and position 529. After the measured wait the band held four marks, each 19×21, rgb 31, 444 pixels: (356, 265), (402, 265), (356, 314), (402, 314). The png hash is `f04dc825c77083abfb0096c18d2ffcda2ba04b477f3af8e2eee6e8052f376157`. The geometry word was not read.

K1e profile B is stock. The stock setter wrote kind 7, zone 6, size `[5, 7, 5, 7]`, and position 540. S1 was pressed as soon as the setter returned. The band then held no grey mark and no rgb-31 pixel. The png hash is `572c1a1e0b0a6ee64483c3738102d2adb92c1cec96e206961b92dacd4792fbef`. The geometry word was not read.

Full K2 is the T6 overlay, the T6 profile reader, and the same display hook as the candidates, with the mirror left at `0xFF` and half-press All. All twelve edges kept an empty grey band, the All ten-byte, and the owner list `[1, 0, 2, 0, 1, 2, 1, 0, 2, 2, 2, 0]`. The hook substituted nothing. Those twelve frames are `ref:K2:<edge>`.

## What the candidates matched

Seeded A, owner 2, matched the profile A reference, including 444 rgb-31 pixels. Owner 0 and owner 1 matched the K2 frame at the same edge. The ten-byte was the Small record on owner 2 and the All record otherwise. The cell stayed 526.

Seeded B, owner 2, matched the empty profile B reference. The ten-byte was `[28, 2, 7, 0, 5, 0, 7, 0, 0, 0]`. Owner 0 and owner 1 matched K2. The size branch substituted 18 times, on `0x1dd1` indices 0 and 1. The kind branch substituted 0 times: while the owner byte was 2, the call at `0x6041935b` was not entered with `d0=0x84d1`. That session ends `ok:false`.

Stock K1 kept the centre marks, the stock ten-byte, and owner 255.

## Latency

The bound is 66.73128 ms plus one 600 ms idle, 666.73128 ms. On profile A the frame had already changed before S1, and S1 did not change it again, so that 66.73128 ms is the setter-to-frame time. On profile B the same interval is the time from the S1 press, issued immediately after the setter returned, to the first frame change. Every observed change on the later runs was inside the bound. Edges whose frame did not change have no latency sample.
