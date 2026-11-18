# C4 cancel

The shared sequence is nine Rights from the start of the zone chooser, then Menu. C4 is value 9, the last UI-238 slot. Both experiments use configuration H. C-b adds the item-1 help list. Neither experiment changes the row label.

## C-a, H unchanged

Command 04 (`exp_crash_ca.mjs`) traced the Menu press with `setForceHelper`, which runs every instruction through the stepping interpreter. The press returned to the AF Button page. Profile 0, cached 0. `work/out/crash-ca.jsonl` step `done` is `ok:true`. That interpreter mode is not the inline path.

Command 05 (`exp_crash_ca2.mjs`) repeats the sequence on the inline interpreter, with no force-helper and no instruction trace. Menu returned to the AF Button page. Texts were the page title and the two priority rows. Profile 0, cached 0. `work/out/crash-ca2.jsonl` step `done` is `ok:true`. At `nav-8` the help call is list `0x61576520`, value 9, count 10, and it carries no kind and no id. The sentence on screen is the previous priority sentence.

Command 07 reran T3h's `exp_faces_h1.mjs` and `session_h3.mjs` as byte copies. Chooser-cancel completed with profile 0, and the script reached `done`. `work/out/exp-faces-h1-rerun.jsonl`. Exit code 0. T3h's original command had exited 3221225477 with an empty stderr and a log that stopped at chooser-nav-8. The same script now passes that key.

The emulator reported no faulting PC and no fault address, because no guest fault and no host access violation occurred.

## C-b, H plus the help list

Command 06 (`exp_crash_cb.mjs`) uses the inline interpreter. Nine Rights show "Choose the AF target area." The help call at `nav-8` is list `0x6031ea6c`, value 9, kind 4, id 424. Menu returns to the AF Button page with profile 0. `work/out/crash-cb.jsonl` step `done` is `ok:true`. Screenshot `work/out/crash-cb-nav-8.png`.

## What the overrun does

The overrun is real. A count of 10 at `0x61576520` reads past the two stock records, matches only values 0 and 1, and leaves the previous sentence in place for every other value, including C4. See `work/out/help.md`.

That missed match is not a spawn. The help call returns without a kind. Cancel then completes on H and on H plus the help list, including under T3h's own observers. The access violation is not reproduced, so this run does not identify a faulting instruction for it. The help list fixes the stale sentence. It is not standing in for a crash fix.
