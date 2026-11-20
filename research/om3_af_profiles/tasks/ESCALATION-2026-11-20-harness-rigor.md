# Escalation: acceptance-harness rigor loop (Opus, 2026-11-20)

**Status: RESOLVED 2026-11-20 — owner chose option 4 (Opus writes the harness; Grok only runs; Sol reviews; bar unchanged).** T12b closed PARTIAL after its correction round; under the loop rules this is
the written escalation. No task is running.

## Situation

Since T8d/T9d, AF-ON **behaviour** has been accepted by Sol on every point tested (EMULATOR-ONLY):

- the AF-ON target record equals the stock half-press writer in every pose and zone, including custom;
- the AF-ON position no longer leaks into the normal half-press position, also after a non-reset edit;
- the AF frame shown while AF-ON owns the target equals the stock frame (Small, Single) within stock latency;
- the fix arms itself on the AF-ON press; the orientation guard depends only on the installed fix.

Every rejection since then concerns **evidence rigor**. Eight consecutive rounds (T8d and T9d corrections; T11, T12,
T12b two each) failed on harness completeness. Gaps close and new ones open; the latest rounds regressed (T12b
replaced working runners with stubs, then with a fake that copies the expected values, making comparisons circular).

## Options

1. **Continue as now.** Another harness task. Low chance of converging on the current trend.
2. **Accept the best harness so far with documented limits** (T12 correction run, real runners, its known gaps
   listed) and go straight to T13; Sol reviews the proofs (behaviour, sealed identity, `ok:true`) instead of harness
   completeness. Fastest; weakest evidence on the listed points.
3. **Narrow the harness requirements** to what could hide a behaviour defect: full-state comparison after every
   individual edge and operation, the sealed expected screen checked before every commit, frozen and hashed code with
   a module inventory, and a non-circular reference (expectations from K1e/K2 reference runs on the real emulator).
   Drop exhaustive read-interface inventory and bypass-proof capability isolation; replace them with a code-review
   check by Sol that runners call only the gate. T13 then builds on the **T12 correction run's** real runners, which
   already met most of this, with a small fix list.
4. **Change who implements the harness** (e.g. Opus writes it directly; Grok only runs proofs). A change to the agreed
   roles.

**Recommendation: option 3**, implemented as a single T13 that takes the T12 correction run's real harness, fixes the
known items that matter under the narrowed bar (the `/work/out/` inventory exclusion that would fail the proof's own
exit check, setup deltas sealed rather than assumed), and runs the identity pass, the T8d proof and the four display
proofs on the emulator. Options 2, 3 and 4 each change the acceptance bar or the roles, so they need your approval.
