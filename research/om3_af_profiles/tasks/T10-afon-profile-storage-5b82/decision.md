# T10 decision (Opus)

**Verdict: CLOSED as PARTIAL.** The correction round failed (loop rule: second failure → different approach).
Continued as T10b (static codec domain, no emulator) and, for persistence acceptance, inside the integrated
acceptance task that follows T8c. Date: 2026-11-19.

## Runs

| Run | Sol review | Verdict |
|---|---|---|
| `run-20261119-153249` | `run-20261119-161828-review` | REJECT: stopped at 28 raw bytes against 26; 28 is cell width, not the packed size |
| `run-20261119-163743` (correction, 6 versions) | `run-20261119-173646-review` | REJECT: fit established, but codec domain excludes zero custom values; bank fixed at 1; reset, corruption, art-filter, second candidate not reached; no `ok:true` |

## Accepted (confirmed by Sol, EMULATOR-ONLY unless marked STATIC)

- **Reader audit (STATIC).** Table B has no `0x5b82` key halfword across its 61 records (+0x50/+0x52 bounds
  `0..65535`, excluded by key). `0x616ddb03` is a diagnostic line number; `0x6118bf47`/`0x6118c058` are
  `A2+0x5b8` object pointers. Bulk bank load/save and `FUN_6006398b` (whole-key zero) are REACHES-UNNAMED as
  carriers, not interpreters. **Still UNRESOLVED:** the `0x60539e07` byte-pattern run, five data occurrences, and
  singletons `0x615fbdb0`, `0x615b9d55`, `0x615b9d91`. The normal-operation list is not exhaustive.
- **Capacity (STATIC).** With the implemented domains: 117 payload bits; marker 16 + version 8 + pad 3 + CRC-16
  gives **160 bits = 20 bytes** of the 26 available, **48 spare bits**. The 28-byte figure was cell width. The
  stock setter stores without a clamp; size `0x9a41[0]` keeps its full 8 bits.
- **Store.** After the stock menu save, K2 and c1 M images differ at exactly offsets 2–3 (bank checksum) and
  1446–1455, 1458–1467 (unnamed indices 0–4, 6–10). Named indices 5/12/13 stay `0x0C80`. E is byte-identical
  (196,608 bytes). Sol independently decoded the record and validated marker, version and CRC `0xe408` against
  profile A.
- **Save and reopen (landscape, c1 only).** The reopened mirror equals profile A; AF-ON press is
  `11 02 03 00 01 00 01 00 00 00`, owner 2; release equals K2's half-press record.
- **C1 does not store the key** (cells unchanged across Assign/Recall; completion witness weak).

## Not accepted / defects

1. **Codec domain.** `DIM_V/DIM_H/STEP_V/STEP_H` omit zero, so accepted zero-initialized and partly initialized
   custom states (T3l, registrations at `0x600e4f4c`/`0x600e4f5c`) fail to encode. "Nothing dropped" is false
   for those states. With 48 spare bits this is expected to fit, but it must be recomputed.
2. **Bank selection regressed.** `installRead().bank()` returns 1 always. It must use the accepted reader's
   bank function, which T8c is now changing to the stock editor's saved index.
3. Per-key assertions missing in `menuSave()` and the navigation loops; manifest lacks transitive modules.
4. Reset, corruption reopen, art-filter cursor and the second candidate were not run.

## Different approach

- **T10b (static + unit tests only, no emulator):** fix the codec domain, recompute the packing, and add the
  zero/partial round-trip tests. Keep the codec independent of location and of bank.
- **Persistence acceptance** (save/reopen per bank, native reset via the T8c path *Initialize All Settings →
  Yes*, corruption reopen, art-filter cursor, C1, two candidates) moves into the full integrated acceptance after
  T8c passes, using one hook set (T8c reader bank, T10b codec) and the T8b generated-table method. Keep the
  store-diff check as a separate check there (Sol optional improvement).

## Status

`CLOSED-PARTIAL`. Evidence stays in `tasks\T10-afon-profile-storage-5b82\run-20261119-163743\`.
