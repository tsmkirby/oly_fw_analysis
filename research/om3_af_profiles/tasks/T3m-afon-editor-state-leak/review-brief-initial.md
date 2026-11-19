# T3m review brief (Codex Sol, read-only)

Read `TASK.md`, `brief.md`, `work\result.md`, `work\evidence-manifest.json` and its supplement,
`work\out\leak.md`, `work\out\design.md`, `work\out\accept-lib.md`, `work\scripts\accept_lib.mjs` and
`work\out\overlay-changed-bytes.csv`. Then read the runners, tables, JSONL logs, screenshots, `work\out\cmd\`
and `audit\`. Compare them against the T3l decision and your last T3l review (`ref\tasks\T3l-afon-editor-completion\`).

1. **Leak.** Check the following:
   - The minimal reproduction shows the leak.
   - The trace identifies the first differing value, its address and its writer during the AF-ON session.
   - The explanation of why the exit restore missed it follows from the trace.
2. **Fix.** Check the following:
   - It is one change, and it is labelled.
   - The minimal sequence matches K1 and K2 at every key.
   - AF-ON edits still land only in the mirror.
3. **Harness.** Check the following:
   - `waitTitle` fails on timeout.
   - `nativeSave` asserts M **and** E saves and a status-0 callback, and reads the persisted cells back.
   - `compareStores` reports every differing offset.
   - The assertions carry explicit expected and actual values.
   - K1 and K2 stores match each other, or every differing byte is explained.
4. **Acceptance, if run.** Check the following:
   - Assertions run immediately after every individual key and cover visual identity, every mirror field, the
     zone byte, the flag and every half-press cell.
   - Two candidates, K1 and K2.
   - Save completion after the edits.
   - The reopen state.
   - The run ends `ok:true`.

   Compare the stores with K2's yourself.
5. **Records.** Check the following:
   - The section of every overlay row (only the three amended section-7 bytes are allowed).
   - The manifest is complete, including dynamic imports and the final outputs.
   - No script was edited after it ran.
   - No visible menu entry was added.
   - `0x1e71[0]` was read back.
   - Nothing is presented as native or as a storage decision.

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
