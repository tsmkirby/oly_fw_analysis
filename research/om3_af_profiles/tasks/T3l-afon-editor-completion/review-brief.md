# T3l correction review (Codex Sol, read-only)

Read the following:

- `brief.md` §5: the correction list, the authorization and the `0x90a1` erratum;
- your previous review in `audit\previous-review.md`;
- the updated `work\result.md`, `work\evidence-manifest.json` and its supplement;
- `work\out\profile-layout.md`, `work\out\design.md` and `work\out\overlay-changed-bytes.csv`;
- the new runners, tables, JSONL logs and screenshots;
- `work\out\cmd\` and `audit\`.

For each of corrections 1–6 and the erratum, report DONE, NOT DONE, WRONG or BLOCKED (honestly reported), with
evidence.

In particular, check:

- **Entry.** Entry no longer overwrites the mirror. Only `FF` fields are initialized, from descriptor defaults.
  The mixed-mirror case, C1 retained across a C2 edit, and survival across a normal edit and a re-entry are all
  shown.
- **Acceptance.**
  - Assertions after every individual key, with unique step IDs. They cover visual identity, every mirror field,
    the zone byte, the flag and every half-press cell, including all nine bytes of `0x1df1`.
  - Two candidates, K1 and K2.
  - A save after the edits, with completion asserted.
  - The reopen state.
  - `ok:true`.

  Compare the stores with K2 yourself.
- **Restore.** Restore works with a non-zero snapshot.
- **Remaining exits, if run.** Playback's following edit, and session end.
- **Orientations, if run.** `pose.mjs` unchanged, by hash.
- **Subject Detect.** No claim rests on `0x90a1`, and the `0x1e71[0]` readback and its meaning are stated.
- **Records.**
  - Every overlay row's section; only the three amended section-7 bytes are allowed.
  - Manifest completeness.
  - No script edited after it ran.
  - No visible menu entry added.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
