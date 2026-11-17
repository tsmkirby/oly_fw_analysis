Proposed title: OM-3: document autofocus findings and add a stock data probe

This draft documents OM-3 E147 1.1 (main build 1100) research in two topic references and adds one read-only probe. The references pin the container and decoded components by SHA-256, provide reproduction steps, and distinguish stock observations from emulator results and untested behavior.

- AF button profiles: stock menu and settings tables, queue-95 format, and the earlier 28/28 emulator profile-handoff result. The proposed separate AF-ON menu, persistent storage, display behavior and physical autofocus remain unverified.
- Human detection: model-bank selection, candidate processing and the handoff toward AF. No inference or accuracy result is claimed.
- Read-only probe: parses stock menu/settings and all 93 queue-95 handlers, optionally decodes supplied queue envelopes, and checks the Human enum and bank hash.

The [pinned fork archive](https://github.com/tsmkirby/oly_fw_analysis/tree/936f4e090499c677e4cfc4250ef890ce82bbe656/research/om3_af_profiles) preserves the chronological reports, full emulator harness and recorded results, source snapshots, and hardware planning. This PR contains no installable patch.

Validation: exact-build stock probe, all 93 dispatch slots, malformed input rejection, source hashes, links, and 13 utility tests passed. The full repository checker stopped at the host's missing Pillow dependency. The archived native matrix was referenced rather than rerun.
