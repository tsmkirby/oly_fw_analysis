# T8b review brief (Codex Sol, read-only)

## Read

- `TASK.md` and `brief.md`.
- The T8 decision and your two T8 reviews (under `ref\tasks\T8-afon-integrated-acceptance\`).
- `work\result.md`, the manifest and its supplements.
- `out\sequence.json`, `gen_table.mjs`, `check_table.mjs` and its output.
- The generated table and `out\reference-t8b.json`.
- The runners, JSONL logs, screenshots, stores, `work\out\cmd\` and `audit\`.

## Check

1. **No new behaviour change.** Only the accepted components are used, and they are unchanged.
2. **Version accounting.** Every emulator process is counted, and there are at most six. The run stopped at the
   first failed assertion.
3. **Generated table.**
   - One row per individual key and per edge, including each save-navigation Left and each dial detent.
   - Every required field, each with exactly one declared source.
   - No candidate field is sourced from the candidate itself.
   - The exits and the save are matched with K2, and the skipped AF-ON editor keys are listed.
   - Run the checker logic against the table yourself (reading only).
4. **Reference run.**
   - Only the permitted invariants are asserted.
   - The amended save criterion holds: a fresh posted M after the baseline, with a captured image and its own
     status 0; no new E; E byte-identical to K2's.
   - The reference file is hashed at once.
5. **Acceptance.**
   - Every field at every step is asserted against its declared source.
   - Every item of the T8 §2.3 sequence.
   - Both reopens, with re-initialization.
   - `ok:true`.
   - **Decode both candidates' stores and compare M and E with K2 yourself.**
6. **Behaviour.** State plainly whether each PROJECT-STATE §3 behaviour is demonstrated, not demonstrated, or
   out of scope (persistence is Q7; display is T9b).
7. **Records.**
   - Sections computed from the image; only the three amended section-7 bytes are allowed in section 7.
   - The manifest, including the transitive modules.
   - The final seal.
   - No script edited after it ran.
   - `0x1e71[0]` read back.
   - Nothing presented as native or as a storage decision.

## Rules

Recompute every manifest hash. Use PowerShell (Python is not on your PATH). Do not run Ghidra or OM-Emu.
Give the verdict in the structure of `templates\review.md`.
## Correction round

Also read `brief.md` §5 and your previous review in `audit\previous-review.md`. For each §5 item, report DONE /
NOT DONE / WRONG / BLOCKED (honestly reported).

Check in particular:
- The factory-initialization change is the only change. Its values come from the ROM default tables, are
  confirmed against K1's fresh store, and only `FF` fields are initialized.
- K1e presses the same editor keys in normal mode. The mapping from its half-press cells to the mirror (field
  and bank) is static, stated and checker-validated.
- Every remaining literal cites its source.
- The exits, banks and flags are consistent.
- Both candidates run to `ok:true`.
- On both reopens, the next entry initializes to the factory values.
- Decode the M and E stores against K2 yourself.