# Reproduce the bounded live experiment

This bundle preserves the sources used by `../matrix-cpu3-final/report.json`.
It contains no firmware. Use the exact unpacked E147 1.1 files whose hashes
are in that report, and OM-Emu commit
`4e4ec4ef084542a7e30eecce56970c7e09c123c9`.

`sha256.json` covers the copied inputs and emulator patch. The report hashes
the original tested inputs and each trace separately. Apply
`om-emu-local.patch` to a clean checkout of that commit; do not reapply it
over the current working emulator. It includes earlier Windows path fixes
as well as this experiment's CPU3 callback dispatch, unsupported-doorbell
guard and E147 IRQ-observer correction. Copy the preserved scripts to the
research workspace's `scripts` directory and retain the same directory layout.
The runner expects the bundled Node executable at
`tooling/node-v26.12.1-win-x64/node.exe` and emulator at `tooling/om-emu`.

From the research workspace, generate a fresh overlay (output must not exist):

```powershell
python scripts/om_emu_af_edge_overlay.py analysis/button-af/readiness/om-emu-af-acceptance1/proposed-changed-bytes.csv analysis/button-af/readiness/om-emu-af-native1/replay-overlay.csv
python scripts/om_emu_af_native_acceptance.py --candidate analysis/button-af/readiness/om-emu-af-native1/replay-overlay.csv --out analysis/button-af/readiness/om-emu-af-native1/replay-matrix --cpu3-af
```

Expected result: handoff 2/14, full acceptance 0/14, process exit 1. The two
Subject Detect Off cases complete 12 edges each. Every nonzero subject case
stops at `S-CPU3: unserved doorbell bits 0x00000001`. This is a failure result
with an identified boundary, not an expected-pass waiver. Without `--cpu3-af`,
the unsupported native callback is an earlier boundary. Sessions have a
120-second timeout; timeouts and truncated output count as failures.

The generated decoded image hash should be
`8de9f830d6ca03a177491003dc560ab3b63f0e8b44c04aa74aeb298c4da86cc8`.
The decoded stock input is `analysis/decoded/00_0100_50000020.decoded.bin`;
its SHA-256 is
`5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`.
No firmware container, updater, SD image or hardware write is involved.

Disassembly exports beside this bundle were made with Ghidra 12.2,
`OM3Disasm.java`, read-only/noanalysis, from project `OM3_main_full`.
They use runtime addresses. Task names inferred from adjacency are explicitly
distinguished from proven flag/entry relationships in the research notes.

The earlier `matrix` directory was interrupted and is not a completed suite.
`matrix-bounded` records the earlier run without native CPU3 delivery.
Only `matrix-cpu3-final/report.json` reports the final bounded CPU3 experiment.
