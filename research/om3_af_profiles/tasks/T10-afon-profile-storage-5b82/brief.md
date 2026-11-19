# T10: AF-ON profile persistence in the unnamed cells of `0x5b82` (Q7 option a; OM-Emu prototype)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-19 · Workspace: Ghidra + OM-Emu

## 0. Rules that override everything below

- **Owner decision (19 Nov):** Q7 = option (a). Store the AF-ON profile in the unnamed cells of stock key `0x5b82`
  (16 × u16; unnamed indices 0–4, 6–11, 14 and 15, which is 26 bytes). The owner will commission research into
  option (b), a new registered key, later. Keep the encode/decode layer separate from the storage location, so
  the location can be swapped.
- **Inherited rules.** The T3j, T5 and T6 rules apply: each brief's §0 and correction §5, under `ref\tasks\`.
  - Run every command through the wrapper, with script hashes.
  - Never edit a script after it has run. Use new names.
  - Keep a complete manifest, including transitive emulator modules, with an external final seal.
  - Label every behaviour change and every test-setup write `EMULATOR-ONLY`.
  - Make one change per experiment, or label the change as combined.
  - Assert after every key and every edge, with explicit expected values. Stop at the first failed assertion.
- **Emulator only.**
  - No byte goes in section 6 or 7, except the three inherited bytes `0x610bf5e3`–`0x610bf5e5`. Compute each
    overlay row's section from the image.
  - Make no hardware recommendation. No physical-camera operation.
  - Write no new flash writer. Persistence must go through the **stock** settings API and stock bank save.
- **Subject Detect:** assert `0x1e71[0]=0`. Set `OM_EMU_MODEL=E147` before any import of `model.mjs`.
- **Requirement guard.** If a field of the AF-ON profile cannot fit in 26 bytes together with a marker and a
  checksum, **stop and report**. Do not drop it. Dropping one is a change to the functional requirements, and
  only the owner can make it.
- **Every emulator process is an experiment version.** At most six. Static work is not a version.

## 1. Starting point (under `ref\`)

- **Storage research.**
  - `analysis\button-af\AFON-MENU-RESEARCH.md` §8 (the storage model, and the PEN-F tagged-cell precedent).
  - The T2 and T2b decisions (`tasks\T2-cell-ownership\decision.md` and `tasks\T2b-cell-ownership-gaps\decision.md`),
    with their Sol reviews, and the PROJECT-STATE Q7 entry.

  Established:
  - Custom Mode C1 does not store `0x5b82`, so the profile is global.
  - Default and reset write zeros.
  - Factory-adjustment and debug writers are not normal operation.
- **Unresolved after T2b:**
  - data occurrences of `0x5b82` with unidentified structure;
  - the setter-table key fields +0x50 and +0x52;
  - three `mov 0x5b8` explanations.
- **The profile.** The mirror layout is `analysis\button-af\readiness\t3m-afon-editor-state-leak\out\profile-layout.md`.
  What the AF-ON target consumes is in `analysis\button-af\readiness\t6-afon-target-size-position\out\design.md`:
  zone type, size `0x9a41[0]`, position `0x5962[bank]` per pose bank (1, 5, 3), and custom dimensions
  `0x1dd1`/`0x1de1`.
- **Configuration.** The T6 overlay and runner (`readiness\t6-afon-target-size-position\`), and its accepted
  save witness (as amended in the T8 decision: E and an unposted M at session open; the commit posts M).
- **Boot order.** `readiness\t4b-afon-boot-order\README.md`.

## 2. Work (in this order)

1. **Targeted reader audit (static).** This is not a re-run of T2b. For each unresolved item above, decide
   whether it can **read or write an unnamed index** of `0x5b82`: show the index computation and its bounds,
   with bounded listings checked against the image. Classify each item as:
   - SAFE (named indices only);
   - REACHES-UNNAMED (state the effect);
   - UNRESOLVED (state what is missing).

   Also list every normal-operation reader and writer of `0x5b82`, with its index source.
2. **Encoding (static).** Write `out\encoding.md`, covering:
   - the profile fields with their bit widths;
   - the packing into the 13 unnamed u16 slots;
   - a marker, a version and a checksum;
   - decode rules: anything that fails the marker, version, checksum or range checks decodes as **"no
     profile"**, which means the factory initialization accepted in T3l and T8b.

   Show that every field T6 consumes round-trips. Write `codec.mjs` (pure JS) and unit tests covering:
   - round-trip;
   - all-zero (the reset value);
   - all-`FF`;
   - a single-bit corruption;
   - stock-plausible values in the unnamed slots.
3. **Persistence (one combined, labelled change, EMULATOR-ONLY).**
   - **Store.** On the commit point (a labelled test trigger standing in for the editor exit, because the editor
     integration is T8b's), encode the mirror and write it through the stock settings setter for
     `0x5b82[unnamed]`, so the stock bank save carries it.
   - **Load.** After the stock settings load at boot (T4b order), read through the stock getter, decode, and
     republish the mirror. On "no profile", leave the mirror at `FF`.
   - Name every hook site.
4. **Tests.** Use K1 (stock), K2 (T6 overlay, no persistence) and two fresh candidates. Seeding the mirror is
   labelled test setup.
   1. **Save and reopen.** Seed profile A, commit, save, reopen.
      - The mirror is restored exactly.
      - The AF-ON press uses profile A, not the All fallback: assert the ten-byte target and the owner.
      - The release is the stock half-press record.
   2. **Store difference.** Decode M and E against K2. They differ **only** at the `0x5b82` unnamed-slot offsets
      and the bank checksum word. List every offset.
   3. **Reset.** Run the stock settings reset through native menu keys. Afterwards the slots are zero, the
      record decodes as "no profile", and the mirror initializes on the next AF-ON entry.
   4. **Custom modes.** Store C1 through the native menu, then recall it. The AF-ON profile is unchanged
      (global).
   5. **Corruption.** Flip one stored bit (test setup), then reopen. The record decodes as "no profile" and
      the AF-ON press is the All fallback.
   6. **Stock use of the named cells.** Select the art filters that own named `0x5b82` cells (Toy Photo III,
      Vintage III) and change their cursor through native keys. The named cells change as stock, the AF-ON
      record survives, and the stock screens match K1.

   The run ends `ok:true`.
5. **Records.**
   - `result.md` (template), with item 1's classification table at the top.
   - The manifest, with an external seal.
   - `out\cmd\`, JSONL, screenshots and stores.
   - State the OM Workspace backup behaviour as out of scope and unknown.

## 3. Out of scope

- Option (b).
- Workspace backup hooks.
- Display (T9b).
- The editor integration (T8b): the store trigger is a labelled stand-in.
- Packaging and hardware.
