# OM-3 project state

Opus (coordinator) maintains this file. It **points to** evidence; it does not restate it.
If this file and a linked document disagree, the linked evidence wins: correct this file
and add a decision-log entry.

Last updated: 2026-11-17 (Phase 1 preparation).

## 1. Continuation point

- **Now:** T13 implementation by Opus (design accepted with changes; reference-agnostic, the AF-ON press reference stays K1e S1 but is named so it can be switched). Open owner item: optional stock-camera visual check (AF Button "Always tracks"; Small, custom size, off-centre: does AF-ON draw the same frame as half-press?), since T14 could not decide statically.
- **Previous step:** escalation resolved by the owner: Opus writes the harness, Grok only runs it, Sol reviews both.
- **Previous step:** T8d and T9d round 1 (both REJECT).
  - **T8d.** After the same edit, the stock half-press writer records size bytes 3/3 for the zone T6 calls
    Small, while the AF-ON converter records 1/1. T8d lists both computations, sweeps every zone against the
    overlay S1 reference (K1e), makes the AF-ON record follow the stock writer, then completes the short proof
    (both poses, release, normal edit).
  - **T9d.** Finds where the AF frame takes its size and kind (the `0x6041935b` site supplies only position),
    extends the display change to those call sites, and validates a second, visibly different size.
  - **Closed this round:** T8c PARTIAL (bank fix and Reset-defined init accepted); T9c PARTIAL (getter causal,
    dispatch found, profile A frame validated against references); **T10b accepted with corrections** (codec
    v2, complete domain, pose-keyed; promoted to `readiness\t10b-afon-profile-codec`).
- **Earlier step (superseded):** the T8c correction, the T9c correction and T10b run concurrently.
  - **T8c correction.** The cause is established (the editor writes the saved index 0/4/2, the reader used
    the change index 1/5/3), and the reader now uses the saved index. Reset equals the fresh store. The proof
    failed on a stale release literal. The correction takes press expectations from K1e's S1 record after the
    same keys and release expectations from the candidate's own S1 record, then completes both poses.
  - **T9c correction.** The getter return is proven causal; the dispatch is `calls (A2)` at `0x610c8b66`. The
    change draws the AF-ON frame, but validation used wrong predicted rectangles and a reduced K2. The
    correction takes frame expectations from K1e and full-K2 reference runs, adds a second profile size, and
    adds a refresh criterion.
  - **T10 closed as PARTIAL.** The record fits (160 of 208 bits) and the store diff is confined to the unnamed
    cells and the checksum. **T10b** (static only) fixes the codec domain, which excluded zero custom values,
    and keys it by pose. Persistence acceptance moves into the full integrated acceptance after T8c.
- **Earlier step (superseded):** T8c, T9c and the T10 correction run concurrently.
  - **T8c.** Reconcile the editor's write bank (measured at index 0/4) with the AF-ON reader's bank (1/5,
    from T7). Define initialization as what the stock settings **Reset** writes; the ROM defaults are all
    zero and the fresh store differs. Then a short integrated proof: edit in landscape and EXIF 6, then the
    AF-ON press uses it.
  - **T9c.** A causal trial: does the getter return at `0x6041935b` move the frame? Find the refresh trigger
    of the frame writer `0x61184e51`, then make one change.
  - **T10 correction.** 28 bytes is the cell-width size, not the packed size. Establish the legal ranges and
    pack losslessly. Report a shortfall only if even the packed record does not fit.
  - **T8b closed as PARTIAL.** Accepted: the generated-table method; the K1/K2 reference; K2's amended save;
    the ROM defaults all zero.
  - **T9b accepted with corrections** (partial investigation). Accepted:
    - the getter path `0x6041935b` â†’ `0x603f15b1`;
    - the frame pixel writer `0x61184e51`, entered indirectly from `0x61184dd6`;
    - **an AF-ON press never enters it.**
- **Earlier step (superseded):** three concurrent runs.
  - **T8b correction.** One authorized change: the AF-ON mirror initializes to the stock **factory values**
    (ROM defaults, confirmed against K1's fresh store) instead of zero. A new stock role, K1e, presses the
    same editor keys in normal mode and supplies the candidate's independent expectations.
  - **T9b correction.** It traces the getter-thunk caller to the frame geometry and the refresh trigger, then
    makes one change.
  - **T10, persistence via `0x5b82`.** This follows the owner's Q7 decision. It covers:
    - a targeted audit of the leftover readers;
    - a codec with a marker and a checksum;
    - store and load through the stock API;
    - tests for save and reopen, reset, C1 recall, corruption and art-filter cursors.
  - **Owner decision (19 Nov): Q7 = (a)**; research (b) later.
- **Previous step:** T8b and T9b round 1 (both REJECT; candidate stalled on the zero init; display path not
  yet traced).
  - **T8b:** integrated acceptance with a step table generated from a declarative sequence and a complete
    checker. Every emulator process counts as a version, and the run stops at the first failure. The save
    criterion is amended from the evidence: a fresh posted M, no new E, E equal to K2.
  - **T9b:** traces the setter `0x60063431` â†’ coordinate object â†’ OSD invalidation, then one display change
    with full-frame assertions on all 12 edges.
  - **T8 closed as PARTIAL.**
    - Controls pass through save and reopen.
    - **E is written at session open; the commit posts only M.** This qualifies T6's E witness. Its store
      equality stands.
    - No candidate ran. [decision](tasks/T8-afon-integrated-acceptance/decision.md).
  - **T9 closed as PARTIAL.**
    - The frame does **not** follow AF-ON with T6.
    - The driving cell is `0x88b2`. The OSD paints the frame through `0x610eee11`, and an AF-ON press issues
      no repaint.
    - The coordinate path is not yet traced. [decision](tasks/T9-afon-target-display/decision.md).
- **Previous step:** the T8 and T9 correction rounds.
  - **T8 round 1:** REJECT. All six versions were spent on K1 literals. The coordinator changed the method:
    a static table check, then a K1/K2 reference run, then candidates against the same-step references.
  - **T9 round 1:** REJECT.
    - Confirmed: the stock frame (four corner marks) moves with the half-press position.
    - Confirmed: with T6, AF-ON changes the target but **not the frame**.
    - The positioning routine was misidentified, and the change aborted on the wrong emulator model.
    - The correction traces the real drawing path, then makes one change.
- **Previous step:** T8 and T9 launched.
  - **T8, integrated acceptance.** The AF-ON profile is made in the editor (T3m components), drives the AF-ON
    target (T6 component), and works per orientation. It carries a save caused by the final call with
    identity-guided navigation, the reopen, and stores equal to K2. Controls must pass first, and no new
    behaviour change is allowed.
  - **T9, display.** Does the shooting-screen AF frame follow the AF-ON target? It establishes what OM-Emu
    draws first.
  - **Condition A** then needs only persistence, which is **blocked on owner decision Q7**.
  - **T3m closed as PARTIAL (19 Nov).** Accepted:
    - the p3 restore of the three position copies;
    - the 72-byte custom-size record restore at `0x62954108`, since the stock size editor's OK commit writes
      that record directly. Sol found zero store differences against K2.

    Save and acceptance failed on harness defects. [decision](tasks/T3m-afon-editor-state-leak/decision.md).
  - **T6 closed as PARTIAL (19 Nov).** Sol confirmed:
    - the profile read;
    - Q1â€“Q4;
    - the size distinguished (AF-ON uses mirror `0x9a41[0]`; half-press uses live `0x9a41[0]`, not
      `0xdfa1`);
    - the T5 save, with M+E witnessed at status 0;
    - acceptance `ok:true`, with the reopen AF-ON press (All) and release (stock) asserted, and both
      candidates' stores **byte-identical to K2**.

    The correction REJECT was for evidence gaps only, which carry to T8. The profile does not survive a reopen
    (Q7). [decision](tasks/T6-afon-target-size-position/decision.md).
  - **T3m round 1 (REJECT).**
    - Leak found and fixed: three editor copies (`0x62953c10`, `0x60379d64`, object +`0x42`) are restored on
      exit.
    - Acceptance failed: c1's saved M carried the mirror's C1/C2 custom sizes into the half-press record
      (8 bytes, plus the checksum word).
  - **T3l closed as PARTIAL (19 Nov).** Accepted: the hook-side exits and the non-zero zone restore; entry
    that copies nothing and initializes only `FF` fields to factory defaults (zero); C1 kept through C2;
    survival across a normal edit and re-entry; `0x1e71[0]=0` read back (Subject Detect Off).
    - **Defect:** after an AF-ON session, the next normal edit wrote half-press position 994, where K1 and
      K2 wrote 526. It was masked earlier by the old recopy.
    - Acceptance never ended `ok:true`.
    - [decision](tasks/T3l-afon-editor-completion/decision.md).
  - **T6 run 1.** Q1â€“Q4 passed: the AF-ON target follows the mirror's type, size, position and custom
    dimensions, the per-pose bank with Orientation Linked on and off, and C-AF. Acceptance failed at save
    completion: the menu close produced no M/E write. Sol REJECT (round 1): acceptance incomplete; the size
    source is not distinguished (mirror and legacy sizes were both 0); assertions and manifest need work.
  - **T7 closed as PARTIAL (19 Nov).** The accelerometer â†’ pose producer and `pose.mjs` are accepted, as are
    the direct-editor banks (1/5/3 with Orientation Linked on). The stock ten-byte consumer's per-pose index is
    BLOCKED on stock in this emulator. T6 doesn't need it, because the overlay builds the AF-ON record.
    [T7 decision](tasks/T7-orientation-producer/decision.md); evidence in `analysis/button-af/readiness/t7-orientation-producer/`.
  - **Erratum (19 Nov).** `0x90a1` is the page-27 per-button priority (1 = detected-subject priority), not
    SCP Subject Detect. SCP Subject Detect is `MODE_SUBJECT_DETECT`, key `0x1e71[0]`. Claims in the T3b, T3l
    and T7 results that "`0x90a1` = [1,1] means Subject Detect Off" are withdrawn. T5's Subject Detect Off
    setup comes from the Â§8 harness matrix, not from `0x90a1`.
  - **T3b closed as PARTIAL (19 Nov).** Accepted from it:
    - the stock direct screen;
    - the stock custom-size editor, AF Target Mode Settings;
    - the owned mirror and flag at `0xa031eeb0`â€“`0xa031eef7`;
    - routing;
    - MENU parity.

    The acceptance failed twice (stale zone byte after exit), so the work continues as T3l with a different
    change.
  - **T7 round 1 (REJECT).** The accelerometer (I2C channel 6, device `0x6b`) â†’ pose `0xa32c5690` /
    `0xa32c568c` path is confirmed. With Orientation Linked on, the direct editor writes indices 1, 5 and 3
    for landscape, EXIF 6 and EXIF 8. Still missing: which index the ten-byte target's producer reads per
    pose.
  - **T3b round 1 (REJECT, 19 Nov).** The stock direct target screen (opened from shooting with the arrow
    keys) is routed to a 55-byte RAM mirror while an EMULATOR-ONLY flag is set. Confirm, the normal-edit
    control and identical stores passed.
    - Corrections: the flag must move into owned RAM and be scoped to the editor's lifetime; the custom-size
      editor must be found and routed; the measurement gaps must be filled; acceptance needs complete
      assertions.
    - **Coordinator amendment:** MENU follows stock behaviour (it keeps the edit), not a rollback.
  - **T4b accepted with corrections (19 Nov).** In the emulator's staged bring-up, the descriptor build runs
    before the key-port hook `0x6017a5fc`, and the hook runs before the first menu lookup. Nothing read the
    duplicate `0x216` record on the exercised paths; it remains a hypothesis. The flash callees show no
    listed sum or inflate, within capped coverage.
    [readiness/t4b-afon-boot-order](analysis/button-af/readiness/t4b-afon-boot-order/README.md).
  - **T5 accepted with corrections (19 Nov):** in OM-Emu, Subject Detect Off, pressing AF-ON applies the
    zone chosen in the page-27 row (S-AF and C-AF); release restores the half-press target; legacy AF Home
    no longer drives AF-ON; stores byte-identical after save. Navigation equivalence with the stock control
    is not claimed; the final reopen release assertion moves to T6.
    [readiness/t5-afon-button-handoff](analysis/button-af/readiness/t5-afon-button-handoff/README.md).
  - **T4 accepted (19 Nov):** section 7 is stored and copied as plain bytes by the upper loader
    (contradicts stage-0 Finding 2; lower callees open, T4b). No qualifying home for the binding array; the
    duplicate `0x216` record is a reuse hypothesis; face patch design preserved control flow; 376 data
    bytes plus a 48-byte helper; 349 of 368 addresses collide with the archived installer placement, so a
    native build needs a layout pass.
    [readiness/t4-afon-packaging](analysis/button-af/readiness/t4-afon-packaging/README.md).
  - **Milestone (T3j, 18 Nov):** the AF-ON zone row on page 27 meets its functional acceptance in full as
    an EMULATOR-ONLY prototype. Sol confirmed it. Evidence:
    [readiness/t3-afon-zone-row](analysis/button-af/readiness/t3-afon-zone-row/README.md).
  - Still open for condition A:
    - target size and position: editor (T3b) and button target (T6);
    - persistence (Q7, owner);
    - display;
    - Subject Detect On (CPU3 boundary);
    - native packaging: boot order (T4b), then a layout pass reconciling the AF-ON payload with the
      archived installer.
  - T3h (accepted with corrections): the ten zone faces render in the AF-ON chooser, commit to the RAM
    profile, and leave the stores byte-identical to the stock control's.
  - T3g (accepted with corrections): the AF-ON row opens a ten-slot chooser and commits zone values to
    the RAM profile. The partial acceptance passed, including stores byte-identical after a save. Only
    the faces are wrong.
  - T3f (accepted) achieved the first own-value commit from the AF-ON row (EMULATOR-ONLY). The row has its
    own action record, editor binding `0x1e6` and a registered descriptor. The chooser was the priority
    one, because the chooser's contents follow the descriptor.
  - T3e (accepted): the action record's second word selects the editor and its bound setting.
  - T3d showed that the page-27 action table, not a registered key, decides whether OK opens a chooser.
  - Storage (Q7) is not a prerequisite for the UI prototype.
  - T2b, T3a, T3c and T3d are closed (18 Nov); T3e is accepted.
  - **T2b:** UNRESOLVED. The `0x5b82` line was rejected four times. The storage question is with the
    owner (Q7).
  - **T3a:** BLOCKED. The row draws and native keys reach it (label `0x0DD2` "AF Target Mode", UI ID
    `0x3D6F`, 140 overlay bytes in the section-1 tail), but OK opens no editor. Page 28 never appears
    in the OM-3 menu.
- **T1 outcome:** on page 27, value 0 = "always the selected AF target" and value 1 =
  detected-subject priority. The top row is 2154 = `0x90a1[0]` and the bottom row is
  2155 = `0x90a1[1]`. Which row is the shutter (inference: top) and the AF-ON key binding are open.
- **Last research result:** live OM-Emu native AF initialization and central button
  dispatch, 16 Nov ([AFON-MENU-RESEARCH.md Â§8](analysis/button-af/AFON-MENU-RESEARCH.md#live-native-initialization-and-central-button-dispatch-2026-11-16)).
- **Last owner observation:** 17 Nov, stock AF Button setting
  ([AFON-MENU-RESEARCH.md Â§1](analysis/button-af/AFON-MENU-RESEARCH.md#stock-per-button-subject-detect-setting-likely-answer-to-the-owners-belief)).
- **Readiness: NO-GO.** No installable image exists; the camera has never been flashed.
  Offline prototypes are permitted; deploying anything to the camera is not.

## 2. Objective and completion conditions

Independent AF target profiles for shutter half press and AF-ON on OM-3 E147 1.1 (main build
1100). Authoritative spec: [FEATURE-SPEC.md](analysis/button-af/FEATURE-SPEC.md), starting
with its 10 November revision.

The autonomous programme ends at either of these:

- **A. Verified software proof.** The independent AF-ON profile is implemented and shown
  by reproducible software testing or emulation to have every required behaviour in Â§3,
  with Sol's independent review. Partial demonstrations, isolated fixtures and plausible
  static readings are reported as such, never as complete proof.
- **B. Genuine hardware dependency.** No further feasible software method (better emulation,
  instrumentation, static analysis, targeted experiments, alternative offline checks) can
  resolve what remains. The report states exactly what is unproven, why software cannot
  settle it, and the minimum hardware tests that would. An emulator limitation is not
  declared a hardware limitation without investigating the alternatives first.

## 3. Current design

| Aspect | Current design | Since | Source |
|---|---|---|---|
| Half press | Normal stock AF target; Subject Detect follows SCP | 31 Oct | FEATURE-SPEC |
| AF-ON profile | Own saved AF-ON zone (type, size, position per orientation) | 10 Nov | FEATURE-SPEC revision |
| AF-ON menu | New row on page 27 (AF Button), after the two priority rows; AEL/AFL page untouched | 13 Nov | AFON-MENU-RESEARCH Â§6 (owner) |
| AF-ON Subject Detect | Stock AF Button setting "Always tracks focus on the selected AF Target Point"; no firmware bypass | 17 Nov | owner, stock hardware |
| S-AF/C-AF | Shared | 31 Oct | FEATURE-SPEC |
| Precedence | AF-ON wins while both held; release restores (proposed, not hardware-tested) | 31 Oct | FEATURE-SPEC |
| Persistence | AF-ON profile survives power-off | 10 Nov | FEATURE-SPEC revision |
| Display | AF-ON target shown while AF-ON controls AF | 10 Nov | FEATURE-SPEC revision |

**Superseded:** AF Home as the AF-ON source (10 Nov) and the firmware Subject Detect bypass
(17 Nov). Their evidence remains valid as a record of the button path only.

## 4. Tasks

| ID | Task | Status | Record |
|---|---|---|---|
| T0 | Isolation and tool canary | **Accepted (qualified)**, attempt 7 | [decision](tasks/T0-canary/decision.md) |
| T1 | Page-27 row and value mapping | **Accepted** (value meaning and rowâ†”storage settled; Q1/Q3 open) | [decision](tasks/T1-page27-mapping/decision.md) |
| T2 | Ownership proof for unclaimed cells `0x5b82` / `0x5b52` | **Closed: UNRESOLVED** (two Sol rejections; escalated) | [decision](tasks/T2-cell-ownership/decision.md) |
| T2b | Close Sol's open items for `0x5b82` | **Closed: UNRESOLVED** (two Sol rejections; storage escalated, Q7) | [decision](tasks/T2b-cell-ownership-gaps/decision.md) |
| T3a | AF-ON zone row on page 27, RAM-only profile (OM-Emu) | **Closed: BLOCKED** (row drawn; no editor opens; two Sol rejections) | [decision](tasks/T3a-afon-zone-row/decision.md) |
| T3c | Route the zone row to a stock editor: measure the editor dispatch and pages 28/29, then prototype R1 | **Closed: BLOCKED** (two Sol rejections; substance confirmed). Dispatch branch `0x6124f7d4`: D0=4 for stock rows, 1 for `0x3D6F`. Provider ID decides (E4). Pages 28/29 dead on OM-3 | [decision](tasks/T3c-afon-editor-routing/decision.md) |
| T3d | Registered-key hypothesis: `0x3D6F` â†’ registered key cell (EMULATOR-ONLY, `0x5b82[0]`) â€” does the native chooser open and commit? | **Closed: hypothesis refuted; finding accepted (qualified).** The page-27 action table (`0x6150f5f0`, 24-byte records, UI ID at +4, compare `0x611a26e1`) decides | [decision](tasks/T3d-afon-registered-key/decision.md) |
| T3e | Own action record for `0x3D6F`; confirm/cancel into the RAM profile; then the zone list; acceptance | **Accepted with corrections.** Its own record opens a chooser, but with the second word `0x1e3`, confirm commits UI 2154 | [decision](tasks/T3e-afon-action-record/decision.md) |
| T3f | Editor binding of its own: trace `0x611a01e8` (second word â†’ editor â†’ committed UI ID); commit `0x3D6F`; zone list; acceptance | **Accepted with corrections.** First own-value commit, `(0x3D6F, 1)` into the RAM byte (EMULATOR-ONLY, priority chooser). The binding array is at `0x615c540c` (416 records, section 7). The zone chooser is not yet shown | [decision](tasks/T3f-afon-editor-binding/decision.md) |
| T3g | Ten-zone chooser: descriptor decoding; UI-238 descriptor clone; acceptance if zones commit | **Accepted with corrections.** The ten-slot chooser commits zone values to RAM. Partial acceptance passed, including byte-identical stores. The faces are wrong (two priority strings, otherwise blank) | [decision](tasks/T3g-afon-zone-chooser/decision.md) |
| T3h | Trace the chooser's face source; render the ten zone faces; complete acceptance (assertions at every step; `*_ORIGINALLY` getter values) | **Accepted with corrections.** Face table at `0x6037bedc`; the ten zone faces render and commit; stores byte-identical. Acceptance partial: assertions, row label, page 28, and the C4 crash (help-list overrun) | [decision](tasks/T3h-afon-zone-faces/decision.md) |
| T3i | Ten-record help list; isolate the C4 crash; restore the row label; page 28 by reference construction; complete acceptance with exact per-key assertions | **Accepted with corrections.** Functional acceptance confirmed: label, help, exact commits 2/9, cancel from C4, page 28, identical stores. The C4 crash did not reproduce. Per-key assertions still open | [decision](tasks/T3i-afon-zone-acceptance/decision.md) |
| T3j | Table-driven acceptance, exact assertion on every key; T3i configuration unchanged | **Accepted with corrections.** **The AF-ON zone row meets its functional acceptance in full, as an EMULATOR-ONLY prototype:** 281 steps, 0 failures. Evidence promoted to `analysis/button-af/readiness/t3-afon-zone-row/` | [decision](tasks/T3j-afon-acceptance-assertions/decision.md) |
| T4 | Packaging analysis (static): section-7 edit vs runtime installer; home for the binding array; face-table key; descriptor registration; native value routing; byte budget | **Accepted** (correction round; bounded: reuse is a hypothesis, ordering and flash callees unresolved) | [decision](tasks/T4-afon-packaging/decision.md) |
| T5 | AF-ON button applies the zone from the menu row: the RAM profile replaces the legacy AF Home provider in the central-edge handoff; 12 edges; S-AF and C-AF; Subject Detect Off | **Accepted with corrections**, claims narrowed (correction round REJECT on control navigation only; resolved by the coordinator; final reopen release â†’ T6) | [decision](tasks/T5-afon-button-handoff/decision.md) |
| T3b | AF-ON target size and position editor: measure the stock AF target selection screen, profile layout, route the screen to the profile (EMULATOR-ONLY entry; entry options â†’ Q5) | **Closed: PARTIAL** (two REJECTs; components accepted; continued as T3l) | [decision](tasks/T3b-afon-target-editor/decision.md) |
| T3l | AF-ON editor completion: hook-side exit handling and zone-byte restore, factory-default initialization, K1 and K2 controls, AF-ON custom sizes, full acceptance, poses via T7 | **Closed: PARTIAL** (two REJECTs; entry/init/restore accepted; position leak found; continued as T3m) | [decision](tasks/T3l-afon-editor-completion/decision.md) |
| T3m | Editor state isolation: locate and restore the state leaking the AF-ON position into the next normal edit; shared acceptance harness (`waitTitle`, `nativeSave` with M+E and status, `compareStores`, matched K2); full editor acceptance | **Closed: PARTIAL** (two REJECTs; position and custom-size restores accepted; save and acceptance â†’ T8) | [decision](tasks/T3m-afon-editor-state-leak/decision.md) |
| T4b | Stock watch run from reset: boot order (descriptor build, key-port hook, first lookup), duplicate `0x216` readers, flash-read callees | **Accepted with corrections** (bounded; reuse still a hypothesis) | [decision](tasks/T4b-afon-boot-order/decision.md) |
| T7 | Orientation: stock producer, EMULATOR-ONLY pose injection at the sensor read, per-pose AF target banks, reusable pose module | **Closed: PARTIAL** (producer and pose injection accepted; stock consumer per-pose index BLOCKED) | [decision](tasks/T7-orientation-producer/decision.md) |
| T6 | AF-ON button target from the mirror (type, size, position, custom dimensions) per pose; 12 edges; C-AF; full acceptance including the reopen release | **Closed PARTIAL** (Q1â€“Q4, size, save, reopen press and release, and stores equal to K2 confirmed; evidence-contract gaps â†’ T8) | [decision](tasks/T6-afon-target-size-position/decision.md) |
| T8 | Integrated acceptance: editor-made AF-ON profile drives the AF-ON target, per pose; controls first; final-call save; reopen; stores equal to K2; no new change | **Closed: PARTIAL** (two REJECTs; controls and save timing established; candidates â†’ T8b) | [decision](tasks/T8-afon-integrated-acceptance/decision.md) |
| T9 | Display: does the shooting-screen AF frame follow the AF-ON target? Emulator capability first; one change only if needed | **Closed: PARTIAL** (two REJECTs; mismatch confirmed; driving cell `0x88b2`; path â†’ T9b) | [decision](tasks/T9-afon-target-display/decision.md) |
| T8b | Integrated acceptance: generated per-key table and complete checker; reference run; candidates; amended save criterion (fresh posted M, no new E, E equal to K2) | **Closed: PARTIAL** (two REJECTs; method, reference and save accepted; bank 0/4 vs 1/5 and init â†’ T8c) | [decision](tasks/T8b-afon-integrated-acceptance-generated/decision.md) |
| T9b | Display: trace setter â†’ coordinate object â†’ OSD invalidation; one change; full-frame assertions on 12 edges | **Accepted with corrections** (partial investigation; frame writer found; AF-ON never enters it) | [decision](tasks/T9b-afon-display-coordinate-path/decision.md) |
| T10 | Persistence in the unnamed `0x5b82` cells (Q7 = a): leftover-reader audit; codec; stock-API store and load; save/reopen, reset, C1, corruption and art-filter tests | **Closed: PARTIAL** (two REJECTs; fits in 20 of 26 bytes; store diff confined; codec domain and bank defects; reset/corruption/art-filter not run â†’ T10b and the integrated acceptance) | [decision](tasks/T10-afon-profile-storage-5b82/decision.md) |
| T8c | Bank reconciliation (editor 0/4 against reader 1/5), Reset-defined initialization, short integrated proof | **Closed: PARTIAL** (two REJECTs; saved-index bank fix and Reset init accepted; size-byte mismatch with the stock writer â†’ T8d) | [decision](tasks/T8c-afon-bank-and-init-reconcile/decision.md) |
| T9c | Display: causal trial of the getter return, the refresh trigger of `0x61184dd6`, one change, 12-edge frame validation | **Closed: PARTIAL** (two REJECTs; getter causal, dispatch found, profile A validated; size/kind inputs â†’ T9d) | [decision](tasks/T9c-afon-display-causal-input/decision.md) |
| T10b | Codec: complete value domain (zero and partial custom values), pose-keyed layout, unit tests; static only | **Accepted with corrections** (custom-slot prose corrected in the decision) | [decision](tasks/T10b-afon-profile-codec-domain/decision.md) |
| T8d | AF-ON target record equal to the stock half-press writer (size bytes); zone sweep; short proof through both poses | **Closed: PARTIAL** (two REJECTs; record equals the stock writer, leak fixed, `proof-t8d10` `ok:true`; arming, edge, identity and inventory rigor â†’ T11) | [decision](tasks/T8d-afon-target-record-reconcile/decision.md) |
| T9d | Display: size and kind inputs of the AF frame; extend the change; validate a visible second size | **Closed: PARTIAL** (two REJECTs; A and B frames match references, K2 and K1 stock; mode trace non-blocking; every-refresh records â†’ T11) | [decision](tasks/T9d-afon-display-size-inputs/decision.md) |
| T11 | Shared acceptance harness (import inventory, gated input with full state after every edge, sealed identity table); combined hook set with self-arming writer; re-prove T8d and T9d | **Closed: PARTIAL** (two REJECTs; self-arming writer, native pose latch, zone press/release accepted; proofs stopped at identity capture; harness rigor â†’ T12) | [decision](tasks/T11-afon-acceptance-harness/decision.md) |
| T12 | Complete and freeze the acceptance harness in pure Node (closed checklist; no emulator) | **Closed: PARTIAL** (two REJECTs; pre-delivery identity refusal, split setup, recorder tests, mode binding accepted; scanner, inventory, freeze and coverage-generation classes â†’ T12b) | [decision](tasks/T12-afon-harness-completion/decision.md) |
| T12b | Close the harness defect classes by construction: capability passing, fs-level inventory, freeze from execution, one operation-definition module, sealed setup deltas (pure Node) | **Closed: PARTIAL** (two REJECTs; shared operation module and sealed setup deltas accepted; circular fake, unrestored runners â†’ escalation) | [decision](tasks/T12b-afon-harness-by-capability/decision.md) |
| T13 | Acceptance harness written by Opus (owner decision: escalation option 4); Node permission model, no runner code, one plan module, two-layer expectations; Grok runs only | **Design accepted with changes** (round 2; six corrections to apply in implementation; implementation held for T14) | [tasks/T13-afon-harness-opus](tasks/T13-afon-harness-opus/brief.md) |
| T14 | Owner request: does stock AF-ON ("Always tracks") write the same target record as stock half-press, byte for byte? Static trace (bare stock does not reach the writer in OM-Emu) | **Accepted with corrections: undecided (c)** (writer formula and 1×1 centre shadow replacement confirmed; reachability from each button, shadow selection and publication timing unresolved; deciding evidence = paired stock publication records) | [decision](tasks/T14-stock-afon-vs-halfpress/decision.md) |
| â€” | Q7 option (b): new registered settings key (owner wants it researched later) | **Planned**, not started | owner, 19 Nov |
| â€” | Beyond T3: persistence, display, hook point (Q4), acceptance matrix | Planned by Opus as results arrive | Â§2 |
| â€” | CPU3 request/loader port | Deferred; regression only | AFON-MENU-RESEARCH Â§9 item 5 |

## 5. Blockers

| Blocker | Blocks | Needs | Source |
|---|---|---|---|
| No proven storage for the AF-ON profile | Persistence (not the RAM-only UI work) | **Owner decision, Q7** | T2/T2b decisions; AFON-MENU-RESEARCH Â§8 |
| The AF-ON row opens no editor | T3 acceptance | T3c | T3a decision |
| No CPU3 service in OM-Emu; TAKE logger maps `0x50003090` read-only | Detection-on regression cases | Deferred work | AFON-MENU-RESEARCH Â§8 |
| Repeated AF-ON presses blocked by the display-completion fixture | Stress evidence | Stock display state; stage-2 G1 | Stage-0 record, "Next work" #1 |
| Gate 1 secondary-chip reply; gate 4 updater and recovery | GO | Hardware stages | AF-GAP-CLOSURE-ASSESSMENT gate table |

## 6. Open questions

- **Q1. Unconfirmed:** whether hardware stage 1 (stock re-flash rehearsal) was run. No log exists. *Owner.*
- **Q2. Unconfirmed:** whether two off-camera copies of the stock container have been verified. *Owner.*
  Neither Q1 nor Q2 blocks offline work.
- **Q3.** Value meaning settled by T1 (0 = always the selected target). Still open: which row is
  the shutter and which the AF-ON button (inference: 2154 = shutter), and whether 2155 follows
  the physical AF-ON key or function `0x0a`. *Owner glance at the menu icons; later hook task.*
- **Q4.** Final hook point. The archived installer redirects rows `0x6131bd50`/`0x6131bd60`;
  the 16 Nov live S1 selected `0x61339090`/`0x613390a0`; the working emulator path hooks
  `0x610bf5e2` (section 7, no placement proof). Phase-plan stage 6 still assumes the table redirect.
- **Q5.** Does the AF-ON position editor need a second row (page-29 pattern)? *T3.*
- **Q6.** Section-4 tail run-time use; secondary-CPU/DMA ownership of the reserved tails.
- **Q7. Storage for the AF-ON profile. DECIDED by the owner, 19 Nov: option (a)**, the unnamed cells of
  `0x5b82`, "for now". The owner wants option (b), a new registered key, researched later, so keep the
  codec independent of the location. Implemented as EMULATOR-ONLY in T10. History:
  - **What is established.** The unnamed cells of `0x5b82` (26 bytes) fit the 18-byte CRC layout. Custom
    Mode C1 does not store this key, so the profile would be global, not per custom mode. The default and
    reset paths write zeros, which decode as "no profile". The factory adjustment and debug paths can
    write any key and are classified as not normal operation.
  - **What is unresolved.** After four Sol reviews, the following are still open: a few data occurrences
    of `0x5b82` whose structure is unidentified, the key fields +0x50/+0x52 of one setter table, and
    three `mov 0x5b8` explanations.
  - **Options.**
    - (a) Accept `0x5b82` with that residual risk; the CRC protects against misreading.
    - (b) Commission a different storage approach, for example a new registered key or another owned area.
      This is larger work and needs its own research.
    - (c) Keep the profile RAM-only, resetting at power-on. This contradicts FEATURE-SPEC's persistence
      requirement.
  - **Update 18 Nov (T3c):** I suspected the menu row depends on this choice.
  - **Corrected by T3d (confirmed by Sol):** mapping the row to a registered key alone did **not** open the
    chooser. What decides is a page-27 action table: 24-byte records keyed by UI ID, at `0x6150f5f0`,
    count 2, compared at `0x611a26e1`. The menu row needs an action record, so the storage choice is
    again not a prerequisite for the UI prototype.

## 7. Operating rules (owner, 17 Nov)

- **Autonomy.** After T0 passes, Opus runs the loop: choose the next justified task â†’ Grok â†’
  Sol review â†’ accept, reject or correct â†’ preserve â†’ update this file â†’ next. No owner
  approval per cycle. Every substantive result gets a Sol review.
- **Owner approval still required for:** any physical-camera operation or flashing;
  irreversible hardware steps; new API charges or subscriptions; destructive repository or
  research-data operations; any push or GitHub change (including the archive branch and
  PR #19); material changes to the functional requirements. A storage design that changes
  user-visible behaviour (for example, giving up an existing setting) is treated as a requirement change.
- **Loop limits.**
  - A task gets at most one correction round; a second failure of the same approach means a
    different approach, or a written escalation to the owner.
  - Timeouts: Grok 180 min, Sol 60 min.
  - Never re-run an identical failed brief.
  - Record any usage figures the CLIs report in each run log. If an agent reports a
    subscription limit, stop and write the state down; do not switch to paid usage.
- **Isolation (every agent run).** See Â§9. If the lock or the audit reports a problem, the
  task is BLOCKED and autonomous work stops until it is understood.

## 8. Established findings (index)

- Stock inputs and hashes: [HARDWARE-STAGE0-RECORD.md Â§2](HARDWARE-STAGE0-RECORD.md#2-stock-inputs-verified-8-november-2026)
- Decompilation coverage and limits: [DECOMPILATION.md](DECOMPILATION.md)
- Queue 95, AF start path, gate table: [AF-GAP-CLOSURE-ASSESSMENT.md](AF-GAP-CLOSURE-ASSESSMENT.md)
- Task-context mutex repair; 28/28 profile edges (fixture); proposed 3,612-byte layout: [HARDWARE-STAGE0-RECORD.md](HARDWARE-STAGE0-RECORD.md#completed-verification)
- Menu tables, page 27, viewer/provider registration: [AFON-MENU-RESEARCH.md Â§6](analysis/button-af/AFON-MENU-RESEARCH.md#6-menu-structure-13-november) and "Live acceptance regression and third menu row"
- Settings registry, bank 7, storage options: [AFON-MENU-RESEARCH.md Â§8](analysis/button-af/AFON-MENU-RESEARCH.md#8-storage-for-the-af-on-profile-13-november)
- Live OM-Emu handoff (12 edges each in S-AF and C-AF, detection Off); 0/14 full acceptance: [report.json](analysis/button-af/readiness/om-emu-af-native1/matrix-cpu3-final/report.json)
- Hardware plan and stop rules: [HARDWARE-PHASE-PLAN.md](HARDWARE-PHASE-PLAN.md)

A fixture pass, a native result and a physical result are reported separately and never summed.

## 9. Workspaces, isolation and recovery

| Location | Role | Agent access |
|---|---|---|
| `C:\Dev\OM3-research` (not Git) | Research workspace | Read-only via the `ref\` junction; OS write-denied during runs |
| `â€¦\contribution` on `om3-concise` | PR #19 working copy | None. Local `pre-push` hook refuses the PR branch, non-fast-forward updates and deletions |
| `C:\Dev\OM3-worktrees\archive` on `archive/om3-af-research` | Versioned text mirror | None (write-denied during runs) |
| `C:\Dev\OM3-tasks\<ID>\ws` | Disposable execution workspace per task | Grok writes `work\` (and `om-emu\` if the brief allows); Sol read-only |
| `tasks\<ID>\` | Task record: brief, STATUS, harvested runs, decision | Opus only |

**Primary boundary: Windows integrity levels.** The Cursor CLI's own sandbox is macOS/Linux
only (T0 attempt 1). Grok therefore runs as a Low-integrity copy of the CLI
(`C:\Dev\OM3-tasks\_agent`, built by `orchestration\Initialize-AgentRuntime.ps1`), and every
process it starts inherits Low integrity. Windows refuses Low-integrity writes to anything
labelled Medium, which is the default for all user files. Only the agent's home and the task's
`work\`, `state\`, `projects\` and `om-emu\` are labelled Low. Your sign-in
(`%APPDATA%\Cursor\auth.json`) is read in place, never copied.
Verified without the agent on 17 Nov: research tree, task root, user profile and other
`C:\Dev` projects all refused; Ghidra headless works at Low.

Run sequence (`orchestration\Invoke-Grok.ps1`, `Invoke-Sol.ps1`):
1. Pre-checks: pins, archive sync, no open Ghidra project.
2. Build the task workspace with copies of the pinned inputs, a private Ghidra project copy
   and launcher, and a private OM-Emu copy.
3. **OS lock:** a deny-write rule for this user on the research tree, the archive worktree,
   `~\.om-emu` and the workspace's supplied inputs.
4. Run the agent at Low integrity, with Cursor's allow list and deny rules (Cursor's own
   sandbox is unavailable on Windows, so it is not used), `OM_EMU_NVRAM=off`, TEMP inside the
   workspace, and the pinned tools on PATH (`java`, `node26`).
5. Unlock, always (in a `finally` block).
6. Audit: rule still present before unlock, workspace snapshot unchanged, inputs re-hashed,
   OM-Emu diff.
7. Harvest `work\` into `tasks\<ID>\run-<stamp>\`.

**Recovery after a crash during a run:** if `C:\Dev\OM3-tasks\.research-lock.json` exists,
the workspace is still write-denied. Run
`powershell -NoProfile -ExecutionPolicy Bypass -File C:\Dev\OM3-research\orchestration\Lock-Research.ps1 -Mode Unlock`
(the machine's execution policy blocks plain `powershell -File`).
It removes the rules and verifies that writing works again.

**Coordinator rule (18 Nov).** Opus makes no edits under the research tree while a Grok or Sol run is
active. The snapshot audit counts any such edit as a violation, and one did: see the T3d review
`audit-note.md`.

**Residual risks (documented, not hidden):**
- **Read access.** A Low-integrity process can still *read* anything the user can, including
  tokens in the user profile. Network access is also unrestricted. This is inherent to running
  a cloud agent as this user; no secret material is placed in task workspaces.
- The ACL lock alone could be removed by a process at the owner's integrity level; the agent
  runs at Low, which cannot modify a DACL on Medium objects. The rule's presence is still
  checked before unlock, and the snapshot audit still runs.
- The snapshot audit cannot see in-place edits inside the heavy generated trees, but both
  the integrity boundary and the ACL lock cover them.

**Incident, 17 Nov 2026 (resolved).** While preparing labels, a recursive `icacls /grant /T`
on `C:\Dev\OM3-tasks` followed the task workspaces' `ref\` junctions into the research tree
and added an explicit Full Control entry for the owner's account to its 4,545 directories.
No file contents changed, and the account already had Modify there. All 4,545 entries were
removed (the five `tooling\python-deps` directories with their own pre-existing ACLs were
left untouched), and sampled ACLs match their original shape. Rule since then: no recursive
ACL or label operation on any tree containing a junction; the scripts check for this and refuse.

## 10. Reference pins

| Item | Value |
|---|---|
| Container | `8c133084414533159f587bf46bfb4152714c4074312a47c8d8503e33d605696d` |
| Decoded main `0100` (base `0x60021020`) | `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59` |
| Resource `0106` | `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059` |
| OM-Emu | `4e4ec4ef084542a7e30eecce56970c7e09c123c9` + local patch (CR-stripped diff `61cd1327â€¦7702`) |
| Archive branch | local `archive/om3-af-research`: see `git log`; fork copy at `a2b6d44` (push pending owner approval) |
| PR #19 head | `af68f58` (fork `research/om3-af-profiles` = local `om3-concise`) |

## 11. Decision log

| Date | Decision | By | Source |
|---|---|---|---|
| 2026-10-31 | Independent stock target profile per button; S-AF/C-AF shared | Owner | FEATURE-SPEC |
| 2026-11-01 | SD installation route in scope | Owner | FEATURE-SPEC |
| 2026-11-09 | Mutex created in task context; IRQ installer makes no OS calls | Research | Stage-0 record |
| 2026-11-10 | Risk accepted for stages 1â€“3 only; one body; stage-1 Go | Owner | Stage-0 Â§1 |
| 2026-11-10 | AF-ON gets its own menu zone; AF Home not used | Owner | FEATURE-SPEC revision |
| 2026-11-13 | AF-ON zone row on page 27; AEL/AFL page untouched | Owner | AFON-MENU-RESEARCH Â§6 |
| 2026-11-15 | PR #19 reduced to concise docs + probe; full history in `archive/om3-af-research` | Owner/research | git reflog |
| 2026-11-17 | Stock AF Button setting handles AF-ON Subject Detect; no firmware bypass | Owner (hardware) | AFON-MENU-RESEARCH Â§1 |
| 2026-11-17 | Phase 1 approved: archive commit (local), untracked folder kept with a local exclude, push guards, PR #19 drafts archived, documents reconciled, orchestration installed | Owner | session |
| 2026-11-17 | Autonomy after T0; completion conditions A/B; approval boundaries as in Â§7; stage 1 and container copies unconfirmed | Owner | session |
| 2026-11-17 | Isolation: disposable per-task workspaces + OS deny-write lock + Cursor sandbox + audit; no unrestricted flags | Opus (owner requirement) | Â§9 |
| 2026-11-17 | Cursor sandbox unavailable on Windows; Grok runs at Low integrity instead, with a Cursor allow list naming the needed programs | Opus | T0 attempts 1â€“2; Â§9 |
| 2026-11-18 | After T2's second rejection: run T2b (Sol's open items only) and, alongside it, T3a with a RAM-only AF-ON profile; persistence decided later | Owner | session |
| 2026-11-18 | Concurrent Grok runs: one lock window per batch, a separate Low-labelled agent home per task | Opus | `orchestration\Invoke-Grok.ps1` |
| 2026-11-18 | Sol rejected the first runs of T2b and T3a; one correction round each. T2b: trace the open setter sources. T3a: measure page 28's editor and route the new row to it (at most four experiments, then BLOCKED). | Opus | brief Â§7 of each |
| 2026-11-18 | Both correction rounds rejected. T2b is closed as UNRESOLVED, and storage is escalated to the owner in writing (Q7). T3a is closed as BLOCKED. T3c is a different approach: measure the stock editor dispatch and pages 28/29, then prototype the rowâ†’editor route (R1). | Opus | T2b/T3a decision.md |
| 2026-11-18 | Sol rejected the first T3c run. Correction round: isolated experiments. E1 is row 2154 copied with only the ID changed. E2 is a text zone list built from the stock zone-name strings, because the stock chooser rows use text options and the dead page-28 rows use images. | Opus | T3c brief Â§7 |
| 2026-11-18 | T3c correction rejected on wording only. Closed as BLOCKED, with Sol's qualifications applied in decision.md. T3d tests the registered-key hypothesis offline. | Opus | T3c decision.md |
| 2026-11-18 | T3d refuted the registered-key hypothesis: the page-27 action table decides. Accepted with Sol's qualifications, without a correction round. The evidence gaps (uncapped traces, compare operands, the `*_ORIGINALLY` cells) are mandatory in T3e. | Opus | T3d decision.md |
| 2026-11-18 | Audit flag in the T3d review: the coordinator edited PROJECT-STATE during the run. New rule: no coordinator edits under the research tree while an agent run is active. | Opus | T3d review `audit-note.md`; Â§9 |
| 2026-11-18 | T3e accepted with corrections; the corrections are applied in decision.md. The findings were added to AFON-MENU-RESEARCH ("How a page-27 row opens its editor"). T3f briefed. | Opus | T3e decision.md |
| 2026-11-18 | T3f accepted with corrections; it made the first own-value commit. T3g briefed. T4 (packaging) is planned. | Opus | T3f decision.md |
| 2026-11-18 | T3g accepted with corrections. The ten-slot zone commit works, but the acceptance is partial and the faces are wrong. T3h briefed. | Opus | T3g decision.md |
| 2026-11-18 | T3h accepted with corrections: the ten zone faces render. The acceptance is still partial (assertions, label, page 28, C4 crash). T3i briefed to close it. | Opus | T3h decision.md |
| 2026-11-18 | T3i accepted with corrections: the functional acceptance is confirmed. Per-key assertions were raised for the third time, so T3j is a narrow, table-driven acceptance task with no configuration change. | Opus | T3i decision.md |
| 2026-11-18 | T3j accepted: the zone row is a complete EMULATOR-ONLY prototype. Its two harness defects are recorded, with no further round. Evidence promoted. T4 and T5 launched concurrently; T3b follows T5. | Opus | T3j decision.md |
| 2026-11-18 | T5 and T4 round 1 rejected by Sol; one correction round each. Coordinator amendment: T5's three section-7 bytes `0x610bf5e3`â€“`0x610bf5e5` (call site of the accepted EMULATOR-ONLY central-edge hook) are permitted as a labelled emulator runtime patch; native placement is T4's question. T4 may use stock-image OM-Emu watchpoints (no overlay, NVRAM off) for reader completeness and init order. T4 also finds section 7 stored as plain bytes, challenging the stage-0 compression reading (pending review). | Opus | T5/T4 brief Â§5 |
| 2026-11-18 | Correction runs `run-20261118-151607` (T5, T4) failed in 22 s before Grok started: `getaddrinfo ENOTFOUND api2.cursor.sh` (network outage). Isolation clean. Infrastructure failure, not a brief failure; relaunched with the same Â§5 briefs once DNS resolved. | Opus | run-20261118-151607 err |
| 2026-11-18 | Relaunch `run-20261118-152508` (T5, T4) also failed: Grok lost its Cursor connection after 15 min (`RetriableError: Connection failed repeatedly`), with no file written under either `work\`. Isolation clean. Second infrastructure failure; relaunched again after the owner reported internet access restored (19 Nov). | Opus | run-20261118-152508 err |
| 2026-11-19 | Correction runs `run-20261119-044533` completed. During them the Cursor CLI tried to add its install folder to the user PATH (`reg add HKCU\Environment`); Low integrity denied it and the user PATH was verified unchanged. | Opus | run err.txt |
| 2026-11-19 | T4 accepted (Sol ACCEPT). T5 accepted with corrections: Sol's correction review rejected only the control navigation (a stock control has no AF-ON row by construction) and one unasserted reopen release; the coordinator narrowed the claim to store identity and moved the release assertion to T6. Evidence promoted for both. T3b and T4b launched concurrently; T6 planned after T3b. | Opus | T4/T5 decision.md |
| 2026-11-19 | T4b accepted with corrections; Sol's wording and bounding corrections were applied in the decision, with no further round. T3b round 1 rejected; one correction round. Coordinator amendment: MENU on the AF-ON-mode editor must match stock MENU (the stock screen commits each key and MENU does not restore), because the spec requires reusing the stock screen and mechanisms. My original cancel criterion assumed a rollback the stock screen does not have. T7 (orientation) launched alongside. The Cursor CLI's PATH write was denied again. | Opus | T4b decision.md; T3b brief Â§5 |
| 2026-11-19 | T3b closed as PARTIAL after its correction-round REJECT (acceptance failed at the normal edit after exit). Its components were accepted. T3l was opened with a different change: hook-side exit handling with a zone-byte restore, factory-default initialization of `FF` fields, and a Z5 flag-off control. Coordinator default: AF-ON fields start at the stock factory defaults. T7 round 1 was rejected; amendment: the four I2C stand-ins are permitted, as they supply no data, and only the register-read hook supplies the pose. | Opus | T3b decision.md; T3l brief; T7 brief Â§5 |
| 2026-11-19 | T7 closed as PARTIAL after its correction-round REJECT. The producer is accepted; the stock consumer is blocked. T3l round 1 rejected; one correction round with six versions, prioritized so that acceptance comes before the remaining exits. The entry-overwrite bug is to be fixed. Erratum: `0x90a1` is not Subject Detect; future tasks assert `0x1e71[0]`. T6 launched concurrently with seeded mirrors (it doesn't depend on the editor). Default for an uninitialized AF-ON profile: stock factory defaults (zero). This is a coordinator choice, to be reported to the owner. | Opus | T7 decision.md; T3l brief Â§5; T6 brief |
| 2026-11-19 | T3l closed as PARTIAL after its correction-round REJECT. Sol found a position leak (994 vs 526) in the normal edit after an AF-ON session, masked earlier by the old entry recopy. T3m opened with a different approach: locate the leaking editor state, then build a shared acceptance harness for T3m and T6. The T6 Sol review was cut off by the Codex usage limit ("You've hit your usage limit", reset 09:51). No credits were purchased (that needs owner approval); the review is re-run after the reset. | Opus | T3l decision.md; T6 review err |
| 2026-11-19 | T6 round 1 rejected after the re-run review (09:53). One correction round with six versions: reuse T5's proven save procedure (M+E with status 0), full acceptance including the reopen AF-ON press and release, and a size trial that distinguishes mirror from legacy. T3m launched alongside. | Opus | T6 brief Â§5 |
| 2026-11-19 | T6 closed as PARTIAL after its correction-round REJECT. Sol independently confirmed every functional result, including both candidates' stores byte-identical to K2 and the asserted reopen press and release. The rejection covered one leftover empty check, K1 status and reopened-focus comparisons, a size-source misattribution (corrected in the decision to live `0x9a41[0]`) and manifest coverage. Those are carried to a final combined acceptance (T8), not to another T6 round. T3m round 1 rejected: the leak was fixed, but the saved M carried the mirror's C1/C2 sizes. One correction round with six versions: trace the persistence route, fix it, and verify the save with T6's accepted witness. Sol explained M+2 as the bank checksum word. | Opus | T6 decision.md; T3m brief Â§5 |
| 2026-11-19 | T3m closed as PARTIAL after its correction-round REJECT. The custom-size persistence route was found (the stock size editor's OK commit writes the `0x62954108` record before the routed setter) and fixed by a record restore, with zero store differences confirmed. Save and acceptance failed on harness defects (the menu reopens on the last tab; a K1 self-reference). Different approach: T8 integrates only accepted components on one runner, controls first, with identity-guided save navigation. T9 (display) opened in parallel. Condition A cannot complete without Q7 (persistence), which is an owner decision. | Opus | T3m decision.md; T8 and T9 briefs |
| 2026-11-19 | T8 round 1 rejected: six versions stopped in K1, each fixing one guessed control literal. This was a coordinator brief flaw: controls cannot be asserted against values never measured. Correction method: a static table check (no version), then a K1/K2 reference run asserting only accepted invariants and recorded with its hash, then candidates asserted against same-step references. T9 round 1 rejected: the display does not follow the AF-ON target (confirmed); the routine was misattributed; the change aborted on model E143. The correction traces from framebuffer writes back to the coordinates, adds an unseeded T6 control, and sets `OM_EMU_MODEL=E147`. | Opus | T8/T9 brief Â§5 |
| 2026-11-19 | T8 and T9 closed as PARTIAL after their correction-round REJECTs. Both stopped honestly at real limits. Coordinator decision on the save criterion: E and an unposted M are written at session open, and the AF Target Mode commit posts only M. The "fresh E" requirement came from misreading T6's whole-log witness. It is replaced by: a fresh posted M with status 0, no new E, and E byte-identical to K2. This is a test correction, not a functional change. T8b takes a different approach (a declarative sequence, a generated per-key table, a complete static checker, every emulator process counted, stop at the first failure). T9b traces the coordinate object and the invalidation before any change. | Opus | T8/T9 decision.md; T8b/T9b briefs |
| 2026-11-19 | **Owner decision: Q7 = option (a)**, the unnamed `0x5b82` cells ("We will go with A for now, but I will want to research B later"). T10 opened. T8b round 1 rejected: the candidate stalled because `initMirror` writes 0 while the stock factory state is position 526 and 3Ã—3. Coordinator amendment for the T8b correction: initialize the mirror to the ROM factory defaults, which keeps the stated "stock factory defaults" rule with the true values, and add K1e as the independent reference. T9b round 1 rejected on two measurement corrections and the seal; the correction continues the trace. | owner; Opus | T8b/T9b brief Â§5; T10 brief |
| 2026-11-19 | T8b closed as PARTIAL. K1e committed a wrong page, and init used fresh-store values instead of the ROM tie-break. Sol confirmed the ROM defaults are all zero and the editor writes indices 0/4 while the reader reads 1/5. Different approach (T8c): first resolve the bank mismatch and define initialization by the stock Reset, with a short integrated proof, before any full acceptance. T9b accepted with corrections as a partial investigation; T9c runs a causal trial before any change. T10 round 1 rejected: the capacity stop was premature, because 28 bytes is the cell width, not the minimum encoding. Coordinator ruling: lossless bit-packing is permitted, and dropping a field still is not. | Opus | T8b/T9b decision.md; T8c/T9c briefs; T10 brief Â§5 |
| 2026-11-19 | T10 closed as PARTIAL after its correction round: the packed record fits (160 of 208 bits) and Sol independently decoded the stored record, but the codec domain excluded zero custom values, the bank was fixed at 1, and reset, corruption and art-filter were not run. Different approach: T10b (static codec domain, pose-keyed) now; persistence acceptance folds into the full integrated acceptance after T8c. T8c round 1 rejected: the editor writes the saved index and the reader used the change index (fixed); Reset equals the fresh store; the proof stopped on a stale release literal. Coordinator ruling: press expectations from K1e's S1 record after the same keys, release expectations from the candidate's own S1 record in the same state; no literals. T9c round 1 rejected: the getter return is causal and the dispatch is found, but validation used formula-predicted rectangles and a reduced K2. Coordinator ruling: frame expectations from K1e and full-K2 reference runs; minus-6 stays a hypothesis; refresh by a named producer or by a latency bound against stock. | Opus | T10 decision.md; T8c/T9c brief Â§5; T10b brief |
| 2026-11-19 | T10b accepted with corrections: codec v2 covers the complete domain and is keyed by pose; the slot prose is corrected in the decision. T8c closed PARTIAL: the saved-index bank fix and Reset-defined initialization are accepted, but the AF-ON Small record (size bytes 1/1) differs from the stock half-press writer (3/3) after the same edit. Coordinator ruling: the AF-ON record must equal what the stock writer emits for the AF-ON values; K1e is authorized as the overlay S1 reference (T5/T6 overlay, reader hook absent, mirror unset), because bare-stock S1 does not enter the writer in the emulator. T9c closed PARTIAL: profile A validated against references; the frame size/kind inputs are not at `0x6041935b`. Different approaches: T8d and T9d. | Opus | T8c/T9c/T10b decision.md; T8d/T9d briefs |
| 2026-11-19 | T8d round 1 rejected: AF-ON press records now equal the overlay S1 reference in landscape and EXIF 6, but the live half-press position took the AF-ON edit (292) during the EXIF 6 portion, and the writer feed read the position without the saved bank. Coordinator ruling: this is a state leak; expectations stay; trace and fix it. T9d round 1 rejected: both profiles and both controls pass, but the mark inventory was clipped, the mode-word producer is not located, and refresh traces were partial. Correction rounds for both. Sol's first T8d review attempt failed on the Codex usage limit; it was rerun after the reset, with no paid upgrade. | Opus | T8d/T9d brief Â§5 |
| 2026-11-19 | T8d and T9d closed PARTIAL after their correction rounds. Behaviour is accepted: the AF-ON record equals the stock writer in every pose and zone, the pose leak is fixed (`proof-t8d10` `ok:true`), and the AF-ON frame matches the stock references for Small and Single. Both failed on recurring rigor defects (runner-armed behaviour, edges and commits not all asserted, incomplete inventories). Different approach: T11 builds a shared harness that enforces these checks by construction and re-proves both on one combined hook set. Coordinator scope ruling: the display requirement is behavioural, so the mode-selecting getter input and the `0x610c8b66` scheduling producer are non-blocking unresolved items. | Opus | T8d/T9d decision.md; T11 brief |
| 2026-11-19 | T11 round 1 REJECT (`run-20261119-222335-review`). Confirmed: shared `bank()`/`initMirror()` equal T8c; writer self-arms on owner 0â†’2 without a runner flag; identity-mode press, release, normal-edit and 14 zone comparisons. Not done: sealed T8d proof (4 missing K1e rows), display A/B/K2/K1. Structural defects: comparisons not made inside the gate, ungated setup writes, identity completeness unchecked, pose predicate reads runner-set `watchArmed`, inventory registered late and fails open, refresh recorder drops returns and substituted calls. Correction round authorized with five new emulator versions (brief Â§6). | Opus | T11 brief Â§6; review.md |
| 2026-11-19 | T11 closed PARTIAL after its correction round (`run-20261119-233249-review`: REJECT). Accepted: native pose latch independent of instrumentation; self-arming writer; zone press/release (14 equalities); identity v10 `ok:true`. Proof stopped at the candidate AF-ON release title (identity captured before the key); display not run; full-state, identity-completeness, inventory and test-version gaps remain. Different approach: T12 completes and freezes the harness in pure Node against a closed checklist with zero emulator processes, reviewed by Sol before T13 runs the proofs on the frozen harness. | Opus | T11 decision.md; T12 brief |
| 2026-11-20 | T12 round 1 REJECT (`run-20261120-002500-review`). Confirmed: accepted hook byte-identical, 279 operation rows reproduce T11 sources, tests target the final modules. Not done: per-mutation setup comparisons and display frames, commit refusal before delivery, non-module inventory and early exit handling, recorder integration, complete freeze. Coordinator ruling: the unbound custom-zone `gate.mode()` is fixed in the correction. Correction round, still pure Node. | Opus | T12 brief Â§3; review.md |
| 2026-11-20 | T12 closed PARTIAL (`run-20261120-010959-review`: REJECT; items 2 and 4 DONE). Remaining defects recur as classes (deny-list scanner, inventory with exclusions, hand-picked freeze, separately enumerated coverage), plus an unproven live-setup preservation risk. Different approach: T12b replaces each with a class-closing design (capability passing, fs-level read inventory, freeze from end-to-end fake runs, one operation-definition module, sealed observed setup deltas), pure Node. | Opus | T12 decision.md; T12b brief |
| 2026-11-20 | T12b round 1 REJECT (`run-20261120-015622-review`): items 4 (shared operation module) and 5 (sealed setup deltas) DONE; capability leak, inventory exclusions and optional freeze enforcement remain, and the runners regressed to fake-only stubs. Correction round orders the real T12 implementation restored behind the private entry. Escalation memo written for the owner (`tasks/ESCALATION-2026-11-20-harness-rigor.md`): continue, accept with documented limits, or narrow the harness requirements. | Opus | T12b brief Â§3; escalation memo |
| 2026-11-20 | T12b closed PARTIAL (`run-20261120-025921-review`: REJECT; restored implementation WRONG: fake delivery copies expected values, frame sample is the reference). Loop rule: written escalation to the owner; recommendation option 3 (narrow the harness bar to defect-hiding checks, run T13 on the T12 correction run's real harness). No task launched pending the owner. | Opus | T12b decision.md; escalation memo |
| 2026-11-20 | Owner resolved the harness escalation: option 4, Opus writes the harness directly, Grok only runs checks, Sol reviews; the acceptance bar is not relaxed. T13 opened; design under Sol review first (Node permission model for reads and freeze, no runner code, one plan module, sealed full-state reproduction plus cross-role behavioural relations). | Owner / Opus | escalation memo; T13 design.md |
| 2026-11-20 | T13 design round 1 REJECT-DESIGN, round 2 ACCEPT-DESIGN-WITH-CHANGES (six corrections: pose-case mirror per role, complete early read recording, fake-only bootstrap and per-run input extension, tag containment and completion record, restore focus-arg, extra tests). Owner asked to confirm stock AF-ON equals stock half-press before more proof work; existing data cannot decide it (bare-stock K1 never changes the record; K2 AF-ON 1x1 is the T6 converter, not stock). T14 opened: static trace. | Owner / Opus | T13 reviews; T14 brief |
| 2026-11-20 | T14 accepted with corrections, conclusion (c): static evidence cannot decide whether stock AF-ON and stock half-press publish the same record (shared writer confirmed; a shadow replacement exists that yields a 1×1 centre record; button reachability, shadow selection and timing unresolved). The K1e S1 reference is not yet confirmed stock-equivalent; T13 will name its reference explicitly. Owner camera check suggested. | Opus | T14 decision.md |

## 12. Session resumption checklist (Opus)

1. If `C:\Dev\OM3-tasks\.research-lock.json` exists, a run was interrupted: unlock (Â§9), then
   inspect that task's record.
2. Read this file, then the `STATUS` and latest `decision.md` of every task that is not CLOSED.
3. `orchestration\Test-Pins.ps1` and `orchestration\Test-ArchiveSync.ps1`; fix before delegating.
4. `git -C contribution status`; `git -C C:\Dev\OM3-worktrees\archive status`.
5. Continue from Â§1. Reassess the whole project only if a check fails or the owner asks.
