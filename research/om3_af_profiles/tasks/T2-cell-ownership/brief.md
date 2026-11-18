# T2: Ownership proof for unclaimed bank-7 cells (AF-ON profile storage)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-17 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

- You are in a disposable execution workspace (`TASK.md`). Write **only** under `work\`
  (`work\result.md`, `work\evidence-manifest.json`, `work\out\`, `work\scripts\`).
- `ref\` is the research workspace and is read-only (enforced by the operating system).
- Ghidra: `tools\bin\run-ghidra.cmd` only (private project copy, `-readOnly -noanalysis`).
- OM-Emu: use the private copy `om-emu`. **Do not modify its source.** Run Node as `node26`.
  For persistence tests, set `OM_EMU_NVRAM` to a file under `work\out\` (for example
  `work\out\nvram-<run>.json`), one per run. Never use the default `~\.om-emu` store.
- Writing marker values into emulator settings is allowed (it is the experiment). It happens only
  in emulator memory and in your `work\out\` NVRAM files.
- Keep **every** probe version: never overwrite a script you have already run; save the next
  version under a new name.
- Call tools by name; do not start a command with a parenthesis. No network, no Git, no ACL or
  permission commands, no installs. No firmware image, component or SD file.
  Make no hardware or flashing recommendation.
- If a part cannot be done within these rules, stop that part and explain it in `work\result.md`.

## 1. Objective

Decide, for each candidate array, whether its unnamed cells can hold the AF-ON profile safely:
**OWNABLE** (with the exact cells), **NOT OWNABLE** (with the offending code path), or
**UNRESOLVED** (with the exact gap). Do this in the order below, and stop as soon as one array is
proven OWNABLE with at least **16 bytes**: about 12 bytes of profile plus a validity marker.

1. `0x5b82` (16 × u16; unnamed indices 0–4, 6–11, 14, 15 = 26 bytes)
2. `0x5b52` (16 × u16; 12 unnamed cells = 24 bytes)
3. `0xf5f1` (25 × u8; 22 unnamed), then `0xf5e1` (25 × u8; 13 unnamed): only if 1 and 2 fail

## 2. Read first (under `ref\`; do not re-derive)

- `PROJECT-STATE.md` §1–§3.
- `analysis\button-af\AFON-MENU-RESEARCH.md` §8:
  - "How stored settings work": key = `slot << 4 | type`; typed accessor `0x60063a20`; area
    packing helper `0x60061333` (widths 1, 2 or 4); registry lookup `0x600624d3` (indexed reads
    **not** bounds-checked); registration `0x60062536`; bank-7 table `0x600e4bec`–`0x6011fe20`;
    the four UI-ID maps.
  - "Results (scratch scan …)", "Options, none established".
  - "How the PEN-F HSL extension stores its extra values": the precedent being reproduced, with
    tagged cells, stock APIs only and physical tests on PEN-F.
  - "Applying it to the OM-3": the candidate table and the "Not yet proven" list.
  - "Bank 7 initialization, validity and fallback", and the bank-7 append experiment.
- `analysis\button-af\readiness\t1-page27-mapping\result.md` (method style: two evidence classes).

## 3. Established findings to build on

- Every AF target array is fully used; there is no spare AF cell (§8 scratch scan).
- The candidates look like arrays indexed by art-filter number, where only filters with a
  type-2/type-3 variant name a cell (§8). **"Unnamed" is not "unused"**: code can compute an index
  at run time, and the registry read is not bounds-checked.
- The OM-Emu NVRAM store saves natively (down to the NAND write `0x5003d9da`) and restores the
  settings images at the next session's registry bootstrap. See OM-Emu `emu/src/lab/camapp.mjs`
  (S-NVRAM description) in your private `om-emu` copy.

## 4. What must be shown for an array (the "Not yet proven" list from §8)

Enumerate **every** reader and writer of the key, and classify each one:

- **(a) Direct key uses:** every instruction that loads the key value (for example `0x5b82`) or its
  slot, and every call that passes it to the settings accessors, setters or registry routines.
  Search the decompiled exports (`ref\analysis\decompiled-main\`) **and** the raw bytes, since
  immediates can be split across instructions; state the search patterns.
- **(b) Table uses:** the four UI-ID maps, default/registration records, reset/default tables, the
  `ORIGINALLY` copies, remote/Wi-Fi (OI.Share) settings lists, My Menu, bracketing and backup
  record lists that include the key.
- **(c) Bulk paths:** code that copies or clears whole banks or areas (save, recall, C1–C4,
  reset, backup/restore). Show whether they carry the cells unchanged (desirable) or clear or
  rewrite them.
- **(d) Index computation:** for each indexed reader or writer, show the index source and its
  bounds. The decisive question is whether any path can read or write an **unnamed** index, for
  example from the current art-filter number without a type-variant check.

Classify every use as: *named-index only* / *bulk carry* / *bulk clear-or-rewrite* /
*unbounded or unknown index*. Any *bulk clear-or-rewrite* or *unknown index* that can reach the
proposed cells blocks OWNABLE unless it is shown to be unreachable.

## 5. Dynamic test in OM-Emu (required for OWNABLE)

1. Write a distinctive marker pattern into all the array's unnamed cells, using the native setter
   for the key and index (never by poking memory). Record the native readback.
2. Exercise the paths that could disturb them, reading back the whole array after each one:
   - entering and changing art filters and their types;
   - each art-filter menu page that touches this key;
   - picture-mode changes;
   - a settings reset (and, if the stock menu offers it, a full reset);
   - saving to C1 and recalling C1;
   - a native settings save followed by a **new session with the same NVRAM file**.
3. Run a control session that is identical but without the marker. Its stock values must match
   the marked session's named cells.

Report each step as PASS (marker intact, named cells unchanged), DISTURBED (which cells, which
step), or BOUNDARY (the emulator cannot exercise it; say why).

## 6. Authorised actions

- Read anything under `ref\`, `inputs\` and `om-emu\`.
- Ghidra headless through the launcher, with read-only scripts you write in `work\scripts\`.
- Python (`python -I`) static scans of the decoded main and the exports.
- OM-Emu probes (`node26`) built on `ref\scripts\om_emu_af_player.mjs` /
  `om_emu_af_live_probe.mjs` / `om_emu_bank7_append_probe.mjs` (import or copy their logic into
  `work\scripts\`).

## 7. Deliverables (under `work\`)

- `result.md` (follow `templates\result.md`) and `evidence-manifest.json`.
- `out\uses-<key>.tsv`: one row per use, with address, function, kind (a/b/c/d), access
  (read/write/copy/clear), index source, classification and evidence pointer.
- `out\listings-<key>.txt`: a complete bounded instruction listing for every function classified
  under (c) or (d), and for every *unknown index* case.
- `out\dynamic-<key>-<run>.jsonl` and the NVRAM files used, plus a control run.
- `out\verdict.md`: per array OWNABLE / NOT OWNABLE / UNRESOLVED, the exact cells, and the
  recommended layout if OWNABLE (marker, version, complement scheme in the PEN-F style).

## 8. Acceptance criteria

- **OWNABLE** needs both:
  - the static enumeration (a)–(d) complete for the key, with no unresolved *unknown index* that
    can reach the chosen cells;
  - the dynamic test, PASS on every exercised step, with BOUNDARY steps listed.
- **NOT OWNABLE** needs the concrete code path (with a listing) and, where possible, a dynamic
  DISTURBED observation.
- Every search states its patterns and scope; "no hits" claims name what was searched.
- Inputs verified: decoded main `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`,
  resource 0106 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`.
- Every output is in the manifest with SHA-256; every command is listed, repeats included, with
  its completed output logged.

## 9. Testing and verification

- Dynamic runs from fresh sessions, repeated twice; the results must agree.
- Static claims cite address ranges and byte counts, so the reviewer can recheck them from the
  raw bytes without running Ghidra.

## 10. Out of scope

- Implementing the AF-ON storage, menu or editor (T3).
- Appending a new key (option 2; only if every candidate fails, and as a separate task).
- Backup-file (OM Workspace) format changes. Do note whether the backup path includes the key.
- Any hardware step.
