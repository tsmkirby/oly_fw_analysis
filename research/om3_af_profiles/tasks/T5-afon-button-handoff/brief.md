# T5: AF-ON button applies the AF-ON zone from the menu row (OM-Emu prototype, Subject Detect Off)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-18 · Workspace: Ghidra + OM-Emu · Runs concurrently with T4 (separate workspace)

## 0. Rules that override everything below

- **The T3j rules.** T3j's brief §0 applies (`ref\tasks\T3j-afon-acceptance-assertions\brief.md`).
  - Use the command wrapper for every command, and keep the script hashes.
  - Never edit a script after it has run.
  - Keep a complete manifest, including imported emulator modules.
  - Label everything that changes behaviour `role: behaviour` / `EMULATOR-ONLY`.
  - Make one change per experiment, or label the change as combined.
  - The value stays in RAM. Make no storage decision. Produce no firmware image. Make no hardware
    recommendation.
- **Runner fixes.** Use the corrected runner rules from T3j's decision:
  - Assert the chooser's help text separately from the page header.
  - Stop immediately on a failed comparison.
  - A `controlStep` that cannot be resolved is a failure.
  - Screenshot errors are fatal.
- **Subject Detect stays Off.** With it on, every case stops at the known CPU3 boundary
  (AFON-MENU-RESEARCH §8). Do not attempt to work around CPU3.

## 1. Background (read first)

- `ref\analysis\button-af\readiness\t3-afon-zone-row\README.md` and `design\T3i-design.md`. These describe
  the accepted AF-ON zone-row configuration, called "Z" below. Reuse it byte for byte from
  `ref\tasks\T3j-afon-acceptance-assertions\run-20261118-132500\work\`.
- `ref\analysis\button-af\AFON-MENU-RESEARCH.md` §8, "Live native initialization and central button
  dispatch (2026-11-16)", and "Live OM-Emu AF-ON input and dispatcher regression":
  - the native bring-up (`0x6071181e`, `0x608fe1b0`, `0x609df7e4`, task 105);
  - the `idle-120b` key setup;
  - the EMULATOR-ONLY central-edge overlay (`readiness\om-emu-af-native1\central-edge-v2.json` / `.csv`),
    which hooks `0x610bf5e2` and reconciles ownership on S1 and AF-ON edges;
  - the 12-edge handoff: AF-ON wins while both are held, and both release orders restore the stock target;
  - the ten-byte target `[14,2,3,0,3,0,3,0,0,0]` ↔ `[14,2,2,0,1,0,1,0,0,0]`;
  - the reproduction bundle `readiness\om-emu-af-native1\reproduction\`.

  That handoff still takes the AF-ON target from the **legacy AF Home provider**, which is superseded.
- `ref\PROJECT-STATE.md` §3 (current design).

## 2. Work

1. **The ten-byte target.**
   - Decode the ten-byte AF target and how it is produced: which byte is the zone type, the size, the
     position, and the orientation.
   - Show where the central-edge overlay reads the AF Home profile, in the bytes and in the script.
   - Give bounded listings, checked against the image bytes.
2. **Combined configuration.**
   - Build Z + central-edge (+ bring-up, `idle-120b`) in one session.
   - Show that the combined overlays do not overlap. List every byte; any conflict must be reported.
   - Show that Z's menu-row acceptance steps still pass in this configuration. Re-run the T3j table's
     page-27 portion.
3. **Profile source swap** (one change). Replace the legacy AF Home provider in the reconciliation with the
   **RAM AF-ON profile**:
   - the **zone type** comes from the byte at `0xa031e920`, set through the AF-ON row;
   - size and position stay as the legacy provider supplies them, *stated explicitly as interim* until T3b.

   Report exactly which target bytes now come from the profile, and which do not.
4. **Experiments (at most four).** S-AF, Subject Detect Off, unless stated otherwise.
   - **P1.** Set the AF-ON zone row to a zone different from the half-press zone (for example, half-press
     All and AF-ON Single), with native keys. Exit the menu.
     - Run the 12-edge sequence: AF-ON alone; S1 alone; both orders of press and release.
     - Assert after every edge:
       - the ten-byte target;
       - the owner;
       - the half-press settings `0x99a1`, `0x9a41`, `0x5962` and `0x1dd1`, unchanged;
       - AF Home cells unchanged;
       - `0x90a1` unchanged.
   - **P2.** Repeat with a second AF-ON zone value. The AF-ON target follows the row.
   - **P3.** C-AF, Subject Detect Off. Use the corrected C-AF selection from §8, with converter
     `0x604050e5`.
   - **P4.** Free. State its explanation first.

   Compare each with a control that has no AF-ON overlay and uses the same edges. In the control, AF-ON is
   stock and uses the stock target.
5. **Acceptance (if P1–P3 pass).** Use a table-driven run with exact assertions after every key and edge.
   - Run two fresh sessions and a control.
   - In each session: choose the AF-ON zone through the menu, run the 12 edges, change the zone, and run the
     12 edges again.
   - Do a native save and a new session.
     - The stores must be byte-identical to the control's.
     - The AF-ON zone must be back at its default.
     - The AF-ON press then applies the default zone. Assert this.
6. **Native change.** Update `design.md`'s list of native changes, adding the edge hook and the profile
   read.

## 3. Deliverables (under `work\`)

`result.md` (template); `evidence-manifest.json`; `out\target-bytes.md`; `out\design.md`;
`out\overlay-changed-bytes.csv` (complete, with each source marked as Z, central-edge or new); `out\cmd\`;
scripts, tables, JSONL and screenshots.

## 4. Out of scope

- Subject Detect On (CPU3).
- The size and position editor (T3b).
- Storage and packaging (T4).
- Hardware.
