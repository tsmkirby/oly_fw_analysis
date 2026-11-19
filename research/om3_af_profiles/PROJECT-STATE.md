# OM-3 project state

Opus (coordinator) maintains this file. It **points to** evidence; it does not restate it.
If this file and a linked document disagree, the linked evidence wins: correct this file
and add a decision-log entry.

Last updated: 2026-11-17 (Phase 1 preparation).

## 1. Continuation point

- **Now:** T3m (find and restore the editor state that leaks position across modes; shared acceptance
  harness `accept_lib.mjs`) runs concurrently with the T6 correction round (T5's proven save procedure;
  full acceptance with the reopen press and release; a size trial that distinguishes the sources).
  - **T3l closed as PARTIAL (19 Nov).** Accepted: the hook-side exits and the non-zero zone restore; entry
    that copies nothing and initializes only `FF` fields to factory defaults (zero); C1 kept through C2;
    survival across a normal edit and re-entry; `0x1e71[0]=0` read back (Subject Detect Off).
    - **Defect:** after an AF-ON session, the next normal edit wrote half-press position 994, where K1 and
      K2 wrote 526. It was masked earlier by the old recopy.
    - Acceptance never ended `ok:true`.
    - [decision](tasks/T3l-afon-editor-completion/decision.md).
  - **T6 run 1.** Q1–Q4 passed: the AF-ON target follows the mirror's type, size, position and custom
    dimensions, the per-pose bank with Orientation Linked on and off, and C-AF. Acceptance failed at save
    completion: the menu close produced no M/E write. Sol REJECT (round 1): acceptance incomplete; the size
    source is not distinguished (mirror and legacy sizes were both 0); assertions and manifest need work.
  - **T7 closed as PARTIAL (19 Nov).** The accelerometer → pose producer and `pose.mjs` are accepted, as are
    the direct-editor banks (1/5/3 with Orientation Linked on). The stock ten-byte consumer's per-pose index is
    BLOCKED on stock in this emulator. T6 doesn't need it, because the overlay builds the AF-ON record.
    [T7 decision](tasks/T7-orientation-producer/decision.md); evidence in `analysis/button-af/readiness/t7-orientation-producer/`.
  - **Erratum (19 Nov).** `0x90a1` is the page-27 per-button priority (1 = detected-subject priority), not
    SCP Subject Detect. SCP Subject Detect is `MODE_SUBJECT_DETECT`, key `0x1e71[0]`. Claims in the T3b, T3l
    and T7 results that "`0x90a1` = [1,1] means Subject Detect Off" are withdrawn. T5's Subject Detect Off
    setup comes from the §8 harness matrix, not from `0x90a1`.
  - **T3b closed as PARTIAL (19 Nov).** Accepted from it:
    - the stock direct screen;
    - the stock custom-size editor, AF Target Mode Settings;
    - the owned mirror and flag at `0xa031eeb0`–`0xa031eef7`;
    - routing;
    - MENU parity.

    The acceptance failed twice (stale zone byte after exit), so the work continues as T3l with a different
    change.
  - **T7 round 1 (REJECT).** The accelerometer (I2C channel 6, device `0x6b`) → pose `0xa32c5690` /
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
  dispatch, 16 Nov ([AFON-MENU-RESEARCH.md §8](analysis/button-af/AFON-MENU-RESEARCH.md#live-native-initialization-and-central-button-dispatch-2026-11-16)).
- **Last owner observation:** 17 Nov, stock AF Button setting
  ([AFON-MENU-RESEARCH.md §1](analysis/button-af/AFON-MENU-RESEARCH.md#stock-per-button-subject-detect-setting-likely-answer-to-the-owners-belief)).
- **Readiness: NO-GO.** No installable image exists; the camera has never been flashed.
  Offline prototypes are permitted; deploying anything to the camera is not.

## 2. Objective and completion conditions

Independent AF target profiles for shutter half press and AF-ON on OM-3 E147 1.1 (main build
1100). Authoritative spec: [FEATURE-SPEC.md](analysis/button-af/FEATURE-SPEC.md), starting
with its 10 November revision.

The autonomous programme ends at either of these:

- **A. Verified software proof.** The independent AF-ON profile is implemented and shown
  by reproducible software testing or emulation to have every required behaviour in §3,
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
| AF-ON menu | New row on page 27 (AF Button), after the two priority rows; AEL/AFL page untouched | 13 Nov | AFON-MENU-RESEARCH §6 (owner) |
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
| T1 | Page-27 row and value mapping | **Accepted** (value meaning and row↔storage settled; Q1/Q3 open) | [decision](tasks/T1-page27-mapping/decision.md) |
| T2 | Ownership proof for unclaimed cells `0x5b82` / `0x5b52` | **Closed: UNRESOLVED** (two Sol rejections; escalated) | [decision](tasks/T2-cell-ownership/decision.md) |
| T2b | Close Sol's open items for `0x5b82` | **Closed: UNRESOLVED** (two Sol rejections; storage escalated, Q7) | [decision](tasks/T2b-cell-ownership-gaps/decision.md) |
| T3a | AF-ON zone row on page 27, RAM-only profile (OM-Emu) | **Closed: BLOCKED** (row drawn; no editor opens; two Sol rejections) | [decision](tasks/T3a-afon-zone-row/decision.md) |
| T3c | Route the zone row to a stock editor: measure the editor dispatch and pages 28/29, then prototype R1 | **Closed: BLOCKED** (two Sol rejections; substance confirmed). Dispatch branch `0x6124f7d4`: D0=4 for stock rows, 1 for `0x3D6F`. Provider ID decides (E4). Pages 28/29 dead on OM-3 | [decision](tasks/T3c-afon-editor-routing/decision.md) |
| T3d | Registered-key hypothesis: `0x3D6F` → registered key cell (EMULATOR-ONLY, `0x5b82[0]`) — does the native chooser open and commit? | **Closed: hypothesis refuted; finding accepted (qualified).** The page-27 action table (`0x6150f5f0`, 24-byte records, UI ID at +4, compare `0x611a26e1`) decides | [decision](tasks/T3d-afon-registered-key/decision.md) |
| T3e | Own action record for `0x3D6F`; confirm/cancel into the RAM profile; then the zone list; acceptance | **Accepted with corrections.** Its own record opens a chooser, but with the second word `0x1e3`, confirm commits UI 2154 | [decision](tasks/T3e-afon-action-record/decision.md) |
| T3f | Editor binding of its own: trace `0x611a01e8` (second word → editor → committed UI ID); commit `0x3D6F`; zone list; acceptance | **Accepted with corrections.** First own-value commit, `(0x3D6F, 1)` into the RAM byte (EMULATOR-ONLY, priority chooser). The binding array is at `0x615c540c` (416 records, section 7). The zone chooser is not yet shown | [decision](tasks/T3f-afon-editor-binding/decision.md) |
| T3g | Ten-zone chooser: descriptor decoding; UI-238 descriptor clone; acceptance if zones commit | **Accepted with corrections.** The ten-slot chooser commits zone values to RAM. Partial acceptance passed, including byte-identical stores. The faces are wrong (two priority strings, otherwise blank) | [decision](tasks/T3g-afon-zone-chooser/decision.md) |
| T3h | Trace the chooser's face source; render the ten zone faces; complete acceptance (assertions at every step; `*_ORIGINALLY` getter values) | **Accepted with corrections.** Face table at `0x6037bedc`; the ten zone faces render and commit; stores byte-identical. Acceptance partial: assertions, row label, page 28, and the C4 crash (help-list overrun) | [decision](tasks/T3h-afon-zone-faces/decision.md) |
| T3i | Ten-record help list; isolate the C4 crash; restore the row label; page 28 by reference construction; complete acceptance with exact per-key assertions | **Accepted with corrections.** Functional acceptance confirmed: label, help, exact commits 2/9, cancel from C4, page 28, identical stores. The C4 crash did not reproduce. Per-key assertions still open | [decision](tasks/T3i-afon-zone-acceptance/decision.md) |
| T3j | Table-driven acceptance, exact assertion on every key; T3i configuration unchanged | **Accepted with corrections.** **The AF-ON zone row meets its functional acceptance in full, as an EMULATOR-ONLY prototype:** 281 steps, 0 failures. Evidence promoted to `analysis/button-af/readiness/t3-afon-zone-row/` | [decision](tasks/T3j-afon-acceptance-assertions/decision.md) |
| T4 | Packaging analysis (static): section-7 edit vs runtime installer; home for the binding array; face-table key; descriptor registration; native value routing; byte budget | **Accepted** (correction round; bounded: reuse is a hypothesis, ordering and flash callees unresolved) | [decision](tasks/T4-afon-packaging/decision.md) |
| T5 | AF-ON button applies the zone from the menu row: the RAM profile replaces the legacy AF Home provider in the central-edge handoff; 12 edges; S-AF and C-AF; Subject Detect Off | **Accepted with corrections**, claims narrowed (correction round REJECT on control navigation only; resolved by the coordinator; final reopen release → T6) | [decision](tasks/T5-afon-button-handoff/decision.md) |
| T3b | AF-ON target size and position editor: measure the stock AF target selection screen, profile layout, route the screen to the profile (EMULATOR-ONLY entry; entry options → Q5) | **Closed: PARTIAL** (two REJECTs; components accepted; continued as T3l) | [decision](tasks/T3b-afon-target-editor/decision.md) |
| T3l | AF-ON editor completion: hook-side exit handling and zone-byte restore, factory-default initialization, K1 and K2 controls, AF-ON custom sizes, full acceptance, poses via T7 | **Closed: PARTIAL** (two REJECTs; entry/init/restore accepted; position leak found; continued as T3m) | [decision](tasks/T3l-afon-editor-completion/decision.md) |
| T3m | Editor state isolation: locate and restore the state leaking the AF-ON position into the next normal edit; shared acceptance harness (`waitTitle`, `nativeSave` with M+E and status, `compareStores`, matched K2); full editor acceptance | **Running** (concurrently with the T6 correction) | [tasks/T3m-afon-editor-state-leak](tasks/T3m-afon-editor-state-leak/brief.md) |
| T4b | Stock watch run from reset: boot order (descriptor build, key-port hook, first lookup), duplicate `0x216` readers, flash-read callees | **Accepted with corrections** (bounded; reuse still a hypothesis) | [decision](tasks/T4b-afon-boot-order/decision.md) |
| T7 | Orientation: stock producer, EMULATOR-ONLY pose injection at the sensor read, per-pose AF target banks, reusable pose module | **Closed: PARTIAL** (producer and pose injection accepted; stock consumer per-pose index BLOCKED) | [decision](tasks/T7-orientation-producer/decision.md) |
| T6 | AF-ON button target from the mirror (type, size, position, custom dimensions) per pose; 12 edges; C-AF; full acceptance including the reopen release | **Correcting** (round 1 REJECT: Q1–Q4 confirmed; acceptance incomplete; size not distinguished; 6 versions authorized) | [tasks/T6-afon-target-size-position](tasks/T6-afon-target-size-position/brief.md) |
| — | Beyond T3: persistence, display, hook point (Q4), acceptance matrix | Planned by Opus as results arrive | §2 |
| — | CPU3 request/loader port | Deferred; regression only | AFON-MENU-RESEARCH §9 item 5 |

## 5. Blockers

| Blocker | Blocks | Needs | Source |
|---|---|---|---|
| No proven storage for the AF-ON profile | Persistence (not the RAM-only UI work) | **Owner decision, Q7** | T2/T2b decisions; AFON-MENU-RESEARCH §8 |
| The AF-ON row opens no editor | T3 acceptance | T3c | T3a decision |
| No CPU3 service in OM-Emu; TAKE logger maps `0x50003090` read-only | Detection-on regression cases | Deferred work | AFON-MENU-RESEARCH §8 |
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
- **Q7. Storage for the AF-ON profile. *Owner decision* (escalated 18 Nov).**
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

- **Autonomy.** After T0 passes, Opus runs the loop: choose the next justified task → Grok →
  Sol review → accept, reject or correct → preserve → update this file → next. No owner
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
- **Isolation (every agent run).** See §9. If the lock or the audit reports a problem, the
  task is BLOCKED and autonomous work stops until it is understood.

## 8. Established findings (index)

- Stock inputs and hashes: [HARDWARE-STAGE0-RECORD.md §2](HARDWARE-STAGE0-RECORD.md#2-stock-inputs-verified-8-november-2026)
- Decompilation coverage and limits: [DECOMPILATION.md](DECOMPILATION.md)
- Queue 95, AF start path, gate table: [AF-GAP-CLOSURE-ASSESSMENT.md](AF-GAP-CLOSURE-ASSESSMENT.md)
- Task-context mutex repair; 28/28 profile edges (fixture); proposed 3,612-byte layout: [HARDWARE-STAGE0-RECORD.md](HARDWARE-STAGE0-RECORD.md#completed-verification)
- Menu tables, page 27, viewer/provider registration: [AFON-MENU-RESEARCH.md §6](analysis/button-af/AFON-MENU-RESEARCH.md#6-menu-structure-13-november) and "Live acceptance regression and third menu row"
- Settings registry, bank 7, storage options: [AFON-MENU-RESEARCH.md §8](analysis/button-af/AFON-MENU-RESEARCH.md#8-storage-for-the-af-on-profile-13-november)
- Live OM-Emu handoff (12 edges each in S-AF and C-AF, detection Off); 0/14 full acceptance: [report.json](analysis/button-af/readiness/om-emu-af-native1/matrix-cpu3-final/report.json)
- Hardware plan and stop rules: [HARDWARE-PHASE-PLAN.md](HARDWARE-PHASE-PLAN.md)

A fixture pass, a native result and a physical result are reported separately and never summed.

## 9. Workspaces, isolation and recovery

| Location | Role | Agent access |
|---|---|---|
| `C:\Dev\OM3-research` (not Git) | Research workspace | Read-only via the `ref\` junction; OS write-denied during runs |
| `…\contribution` on `om3-concise` | PR #19 working copy | None. Local `pre-push` hook refuses the PR branch, non-fast-forward updates and deletions |
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
| OM-Emu | `4e4ec4ef084542a7e30eecce56970c7e09c123c9` + local patch (CR-stripped diff `61cd1327…7702`) |
| Archive branch | local `archive/om3-af-research`: see `git log`; fork copy at `a2b6d44` (push pending owner approval) |
| PR #19 head | `af68f58` (fork `research/om3-af-profiles` = local `om3-concise`) |

## 11. Decision log

| Date | Decision | By | Source |
|---|---|---|---|
| 2026-10-31 | Independent stock target profile per button; S-AF/C-AF shared | Owner | FEATURE-SPEC |
| 2026-11-01 | SD installation route in scope | Owner | FEATURE-SPEC |
| 2026-11-09 | Mutex created in task context; IRQ installer makes no OS calls | Research | Stage-0 record |
| 2026-11-10 | Risk accepted for stages 1–3 only; one body; stage-1 Go | Owner | Stage-0 §1 |
| 2026-11-10 | AF-ON gets its own menu zone; AF Home not used | Owner | FEATURE-SPEC revision |
| 2026-11-13 | AF-ON zone row on page 27; AEL/AFL page untouched | Owner | AFON-MENU-RESEARCH §6 |
| 2026-11-15 | PR #19 reduced to concise docs + probe; full history in `archive/om3-af-research` | Owner/research | git reflog |
| 2026-11-17 | Stock AF Button setting handles AF-ON Subject Detect; no firmware bypass | Owner (hardware) | AFON-MENU-RESEARCH §1 |
| 2026-11-17 | Phase 1 approved: archive commit (local), untracked folder kept with a local exclude, push guards, PR #19 drafts archived, documents reconciled, orchestration installed | Owner | session |
| 2026-11-17 | Autonomy after T0; completion conditions A/B; approval boundaries as in §7; stage 1 and container copies unconfirmed | Owner | session |
| 2026-11-17 | Isolation: disposable per-task workspaces + OS deny-write lock + Cursor sandbox + audit; no unrestricted flags | Opus (owner requirement) | §9 |
| 2026-11-17 | Cursor sandbox unavailable on Windows; Grok runs at Low integrity instead, with a Cursor allow list naming the needed programs | Opus | T0 attempts 1–2; §9 |
| 2026-11-18 | After T2's second rejection: run T2b (Sol's open items only) and, alongside it, T3a with a RAM-only AF-ON profile; persistence decided later | Owner | session |
| 2026-11-18 | Concurrent Grok runs: one lock window per batch, a separate Low-labelled agent home per task | Opus | `orchestration\Invoke-Grok.ps1` |
| 2026-11-18 | Sol rejected the first runs of T2b and T3a; one correction round each. T2b: trace the open setter sources. T3a: measure page 28's editor and route the new row to it (at most four experiments, then BLOCKED). | Opus | brief §7 of each |
| 2026-11-18 | Both correction rounds rejected. T2b is closed as UNRESOLVED, and storage is escalated to the owner in writing (Q7). T3a is closed as BLOCKED. T3c is a different approach: measure the stock editor dispatch and pages 28/29, then prototype the row→editor route (R1). | Opus | T2b/T3a decision.md |
| 2026-11-18 | Sol rejected the first T3c run. Correction round: isolated experiments. E1 is row 2154 copied with only the ID changed. E2 is a text zone list built from the stock zone-name strings, because the stock chooser rows use text options and the dead page-28 rows use images. | Opus | T3c brief §7 |
| 2026-11-18 | T3c correction rejected on wording only. Closed as BLOCKED, with Sol's qualifications applied in decision.md. T3d tests the registered-key hypothesis offline. | Opus | T3c decision.md |
| 2026-11-18 | T3d refuted the registered-key hypothesis: the page-27 action table decides. Accepted with Sol's qualifications, without a correction round. The evidence gaps (uncapped traces, compare operands, the `*_ORIGINALLY` cells) are mandatory in T3e. | Opus | T3d decision.md |
| 2026-11-18 | Audit flag in the T3d review: the coordinator edited PROJECT-STATE during the run. New rule: no coordinator edits under the research tree while an agent run is active. | Opus | T3d review `audit-note.md`; §9 |
| 2026-11-18 | T3e accepted with corrections; the corrections are applied in decision.md. The findings were added to AFON-MENU-RESEARCH ("How a page-27 row opens its editor"). T3f briefed. | Opus | T3e decision.md |
| 2026-11-18 | T3f accepted with corrections; it made the first own-value commit. T3g briefed. T4 (packaging) is planned. | Opus | T3f decision.md |
| 2026-11-18 | T3g accepted with corrections. The ten-slot zone commit works, but the acceptance is partial and the faces are wrong. T3h briefed. | Opus | T3g decision.md |
| 2026-11-18 | T3h accepted with corrections: the ten zone faces render. The acceptance is still partial (assertions, label, page 28, C4 crash). T3i briefed to close it. | Opus | T3h decision.md |
| 2026-11-18 | T3i accepted with corrections: the functional acceptance is confirmed. Per-key assertions were raised for the third time, so T3j is a narrow, table-driven acceptance task with no configuration change. | Opus | T3i decision.md |
| 2026-11-18 | T3j accepted: the zone row is a complete EMULATOR-ONLY prototype. Its two harness defects are recorded, with no further round. Evidence promoted. T4 and T5 launched concurrently; T3b follows T5. | Opus | T3j decision.md |
| 2026-11-18 | T5 and T4 round 1 rejected by Sol; one correction round each. Coordinator amendment: T5's three section-7 bytes `0x610bf5e3`–`0x610bf5e5` (call site of the accepted EMULATOR-ONLY central-edge hook) are permitted as a labelled emulator runtime patch; native placement is T4's question. T4 may use stock-image OM-Emu watchpoints (no overlay, NVRAM off) for reader completeness and init order. T4 also finds section 7 stored as plain bytes, challenging the stage-0 compression reading (pending review). | Opus | T5/T4 brief §5 |
| 2026-11-18 | Correction runs `run-20261118-151607` (T5, T4) failed in 22 s before Grok started: `getaddrinfo ENOTFOUND api2.cursor.sh` (network outage). Isolation clean. Infrastructure failure, not a brief failure; relaunched with the same §5 briefs once DNS resolved. | Opus | run-20261118-151607 err |
| 2026-11-18 | Relaunch `run-20261118-152508` (T5, T4) also failed: Grok lost its Cursor connection after 15 min (`RetriableError: Connection failed repeatedly`), with no file written under either `work\`. Isolation clean. Second infrastructure failure; relaunched again after the owner reported internet access restored (19 Nov). | Opus | run-20261118-152508 err |
| 2026-11-19 | Correction runs `run-20261119-044533` completed. During them the Cursor CLI tried to add its install folder to the user PATH (`reg add HKCU\Environment`); Low integrity denied it and the user PATH was verified unchanged. | Opus | run err.txt |
| 2026-11-19 | T4 accepted (Sol ACCEPT). T5 accepted with corrections: Sol's correction review rejected only the control navigation (a stock control has no AF-ON row by construction) and one unasserted reopen release; the coordinator narrowed the claim to store identity and moved the release assertion to T6. Evidence promoted for both. T3b and T4b launched concurrently; T6 planned after T3b. | Opus | T4/T5 decision.md |
| 2026-11-19 | T4b accepted with corrections; Sol's wording and bounding corrections were applied in the decision, with no further round. T3b round 1 rejected; one correction round. Coordinator amendment: MENU on the AF-ON-mode editor must match stock MENU (the stock screen commits each key and MENU does not restore), because the spec requires reusing the stock screen and mechanisms. My original cancel criterion assumed a rollback the stock screen does not have. T7 (orientation) launched alongside. The Cursor CLI's PATH write was denied again. | Opus | T4b decision.md; T3b brief §5 |
| 2026-11-19 | T3b closed as PARTIAL after its correction-round REJECT (acceptance failed at the normal edit after exit). Its components were accepted. T3l was opened with a different change: hook-side exit handling with a zone-byte restore, factory-default initialization of `FF` fields, and a Z5 flag-off control. Coordinator default: AF-ON fields start at the stock factory defaults. T7 round 1 was rejected; amendment: the four I2C stand-ins are permitted, as they supply no data, and only the register-read hook supplies the pose. | Opus | T3b decision.md; T3l brief; T7 brief §5 |
| 2026-11-19 | T7 closed as PARTIAL after its correction-round REJECT. The producer is accepted; the stock consumer is blocked. T3l round 1 rejected; one correction round with six versions, prioritized so that acceptance comes before the remaining exits. The entry-overwrite bug is to be fixed. Erratum: `0x90a1` is not Subject Detect; future tasks assert `0x1e71[0]`. T6 launched concurrently with seeded mirrors (it doesn't depend on the editor). Default for an uninitialized AF-ON profile: stock factory defaults (zero). This is a coordinator choice, to be reported to the owner. | Opus | T7 decision.md; T3l brief §5; T6 brief |
| 2026-11-19 | T3l closed as PARTIAL after its correction-round REJECT. Sol found a position leak (994 vs 526) in the normal edit after an AF-ON session, masked earlier by the old entry recopy. T3m opened with a different approach: locate the leaking editor state, then build a shared acceptance harness for T3m and T6. The T6 Sol review was cut off by the Codex usage limit ("You've hit your usage limit", reset 09:51). No credits were purchased (that needs owner approval); the review is re-run after the reset. | Opus | T3l decision.md; T6 review err |
| 2026-11-19 | T6 round 1 rejected after the re-run review (09:53). One correction round with six versions: reuse T5's proven save procedure (M+E with status 0), full acceptance including the reopen AF-ON press and release, and a size trial that distinguishes mirror from legacy. T3m launched alongside. | Opus | T6 brief §5 |

## 12. Session resumption checklist (Opus)

1. If `C:\Dev\OM3-tasks\.research-lock.json` exists, a run was interrupted: unlock (§9), then
   inspect that task's record.
2. Read this file, then the `STATUS` and latest `decision.md` of every task that is not CLOSED.
3. `orchestration\Test-Pins.ps1` and `orchestration\Test-ArchiveSync.ps1`; fix before delegating.
4. `git -C contribution status`; `git -C C:\Dev\OM3-worktrees\archive status`.
5. Continue from §1. Reassess the whole project only if a check fails or the owner asks.
