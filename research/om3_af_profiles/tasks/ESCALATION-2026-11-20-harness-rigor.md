# Escalation: acceptance-harness rigor loop (Opus, 2026-11-20)

**For the owner. Nothing here needs action unless you want to change course.** Work continues meanwhile under the
loop rules (T12b correction round, pure Node, no emulator).

## Situation

Since T8d/T9d, AF-ON **behaviour** has been accepted by Sol on every point tested (EMULATOR-ONLY):

- the AF-ON target record equals the stock half-press writer in every pose and zone, including custom;
- the AF-ON position no longer leaks into the normal half-press position, also after a non-reset edit;
- the AF frame shown while AF-ON owns the target equals the stock frame (Small, Single) within stock latency;
- the fix arms itself on the AF-ON press; the orientation guard depends only on the installed fix.

Every rejection since then has been about **evidence rigor**: proving that every edge was asserted, every commit
compared with a sealed expected screen, every file recorded. Six consecutive rounds (T11 ×2, T12 ×2, T12b ×1, plus
T8d/T9d corrections) failed on that, each closing some gaps and exposing others. T12b round 1 also regressed:
Grok replaced the real runners with fake-only stubs.

## Options

1. **Continue as now (default).** T12b correction round, then T13 proofs. Likely more rounds; each costs ~1–2 h.
2. **Accept the harness with documented limits.** I would freeze the best harness so far, list its known gaps in
   the record, and go to T13; Sol would then review the proofs (behaviour, sealed identity, `ok:true`) rather than
   harness completeness. Faster; the evidence is weaker on the listed points. This relaxes the acceptance bar for
   completion criterion A, so it needs your approval.
3. **Narrow the harness requirements** to the items that could actually hide a behaviour defect (full-state
   comparison after each edge, sealed identity before commit, frozen code), dropping the rest (exhaustive read
   inventory, bypass-proof capability isolation). Middle ground; also a change to the acceptance bar.

**My recommendation:** let the T12b correction run (already started). If it is rejected, take option 3 with your
approval. Option 2 only if you prefer speed over evidence strength.
