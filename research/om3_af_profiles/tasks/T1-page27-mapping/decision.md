# T1 decision (Opus)

**Verdict: ACCEPTED.** Date: 2026-11-17.
- Initial run `run-20261117-201530`, reviewed in `run-20261117-204643-review`
  (Sol: ACCEPT-WITH-CORRECTIONS).
- One correction round, `run-20261117-205036`, reviewed in `run-20261117-210826-review`
  (Sol: ACCEPT, no corrections outstanding).

Promoted to `analysis/button-af/readiness/t1-page27-mapping/`. Findings recorded in
AFON-MENU-RESEARCH.md §1 ("T1 result") and §6 (annotation).

## Established

| Question | Answer | Evidence class |
|---|---|---|
| Q2 value meaning | **1 = detected-subject priority; 0 = always the selected AF target position** (= owner's "Always tracks") | DATA (option records, resource strings) + OBSERVED-EMU (two fresh sessions + control), independently rechecked by Sol |
| Row ↔ storage | top row = 2154 = `0x90a1[0]`; bottom row = 2155 = `0x90a1[1]` | OBSERVED-EMU + DATA |
| §6 reading | Offsets unchanged. Kind 12 = image id (`0x06b1`, `0x282c`); `0x127b`/`0x124f` are option strings | STATIC + DATA |

## Open

- **Q1 (which row is which button):** UNRESOLVED. The inference is 2154 = shutter and
  2155 = @A049@ button, from the page help `0x127a`, the RELEASE/CUSTOM_SW names and the row order.
  The owner can settle it at a glance on the stock menu.
- **Q3 (AF-ON binding):** UNRESOLVED. It is not shown whether 2155 follows the physical AF-ON key
  or assignable function `0x0a` (assignment 69).
- **Q4 (AF-path readers of `0x90a1`):** a lead list only.

## Effect on the plan

- The feature relies on the stock setting at value 0 for the AF-ON row, as the owner has it.
- The acceptance runner can now configure and verify that setting by native readback.
- None of the open items blocks T2 (storage).
- Q3 matters for the later hook and acceptance work, so it stays on the task list.

## Process notes

- Grok's initial run overwrote two probe versions. Grok restored them in the correction round,
  and their reruns are byte-identical to the preserved outputs.
- Future briefs require each probe version to be kept, rather than overwritten.
