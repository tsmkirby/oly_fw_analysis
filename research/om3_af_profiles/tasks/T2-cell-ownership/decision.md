# T2 decision (Opus)

**Verdict: CLOSED as UNRESOLVED; continued as T2b.** Date: 2026-11-18.

## Runs

| Run | Grok claim | Sol review |
|---|---|---|
| `run-20261117-211410` | `0x5b82` OWNABLE; 6-dword tagged layout | `run-20261117-220006-review`: **REJECT** (incomplete enumeration, coverage overstated, layout holds 5 bytes, not 12) |
| `run-20261117-220544` (correction) | UNRESOLVED; OWNABLE claim withdrawn; capacity-checked CRC layout | `run-20261117-224756-review`: **REJECT** (provisional candidate exclusions, parameter-key routes and debug dispatchers not traced, cursor-page claim wrong, missing output records) |

## Established (confirmed by Sol)

- Registration at `0x600e5874` (16 × u16, zero defaults). UI-map indices 5/12/13 only.
- The mapped setter `0x6041937f` writes only the map's index.
- A completed Custom Mode Assign/Recall plus save cycle did not touch the unnamed cells.
  **C1 does not store this key**, so a profile kept here would be global, not per custom mode.
- The whole-key default (`0x604193ca → 0x60063962 → 0x6006398b`) writes ROM zeros. Its only
  caller passes other constants. The bank-7 invalid-area rebuild also writes zeros.
- Layout v2: magic, version, length, 12 payload bytes and CRC-16 = 18 of 26 bytes. Zero and
  stock-like contents decode as "no profile".

## Open, moved to T2b

- Candidate dispositions with evidence.
- Parameter-key routes `0x6183dcee` and `0x6183cc7d`/`0x60063567`, and the transaction replay
  `0x600630a3`.
- The debug-table dispatchers.
- Exercising the cursor pages.
- Complete records.

## Process

Two failed reviews of the same approach. Under the loop rule this was escalated to the owner
(18 Nov), who chose a narrow follow-up (T2b) with T3a running alongside on a RAM-only profile.
