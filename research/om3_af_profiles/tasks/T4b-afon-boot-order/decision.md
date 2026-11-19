# T4b decision (Opus)

**Verdict: ACCEPTED WITH CORRECTIONS (bounded emulator observations).** Date: 2026-11-19.
Run `run-20261119-053817`. Sol review `run-20261119-062742-review`: ACCEPT-WITH-CORRECTIONS. The corrections
are wording and bounding only and are applied here; there is no further round.

## Established (as corrected by Sol)

- **Stock session from the first instruction.** The probes were armed at insns 0, PC `0x50000000`, before
  `OsdLab.mm_ctors`. The image hash matched stock, with no overlay and no patch. `OM_EMU_NVRAM=off` was
  recorded. The emulator was unchanged from the supplied baseline: four disclosed pre-existing changes plus
  the host `0x120b` key-matrix adjustment.
- **Order, under staged player initialization:**
  1. `0x6040476d` (caller `0x603f0e16`);
  2. the descriptor builder `FUN_60405865`, with its bucket writes;
  3. two executions of the key-port hook point `0x6017a5fc` (caller `0x60070a13`);
  4. only later, the first directory read and the first walk-1 (on the menu key, caller `0x61283ede`).

  So an installer at `0x6017a5fc` would run after the descriptor build and before the first menu lookup,
  **in this emulator's staged bring-up**. Physical reset ordering is not established. The injected menu keys
  did not enter `0x6017a5fc`, which is consistent with a different injection path than raw keys.
- **Duplicate `0x216` record (`0x615c6234`).**
  - It was not read on the exercised stock paths: bring-up; the AF Button, half-press and Release Priority
    pages with every row OK'd and cancelled; parts of the AF target tab; and the Button, Fn Lever and Dial
    settings.
  - The first record was read 8 times, all at `0x6124f522`. Walk-1 ran 32 times. Walks 2 and 3 never ran, and
    no key-8 scan passed index 151.
  - **Reuse stays a hypothesis.** "No reader on the exercised paths" is not "unused". The computed-index
    search is a proximity heuristic (`*24` sites near the directory immediate), not an exhaustive analysis
    of readers; the remaining 451 multiply sites were not tied to a base.
- **Flash callees.** This was a capped, first-encounter traversal; there is no uniform depth-two guarantee.
  `not-listed` marks an edge left unexpanded at that point, and its target may be listed elsewhere. Three
  level-2 listings are truncated.
  - In what was listed, no instruction sums the copied bytes or inflates a buffer. CRC-style checks and
    hardware processing are not excluded.
  - `FUN_600218ea` writes the descriptor `+0x10` counter-difference word. Its semantic role is not
    established (Sol's correction; "length word" is withdrawn).
  - The section-7 compression contradiction with stage-0 Finding 2 **remains open**.
- **Coverage gaps (brief item 2 incomplete).**
  - Page 28 was not opened. Constructing it would change behaviour, which §0 rightly forbids, and a failed
    navigation attempt does not prove there is no native route.
  - The AF target selection screen and AF Target Mode Settings were not entered.
- **Inventory correction:** 138 emulator modules plus one watch script.

## Consequence

The install-order question has a positive emulator answer. Binding placement still depends on the reuse
hypothesis. Native packaging stays at the layout-pass stage, and no installer is built.
