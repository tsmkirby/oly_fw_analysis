# T14: Does stock AF-ON write the same target record as stock half-press? (static, Ghidra)

Agent: Grok 4.7 High · Coordinator: Opus 5.5 · Reviewer: Codex Sol
Brief version: 2026-11-20 · Workspace: Ghidra (read-only project copy); OM-Emu source for reference only

## 0. Why this task exists, and rules that override everything below

Every AF-ON proof so far compares the AF-ON target record with the **half-press** record for the same settings
(K1e S1). The owner asked to confirm first that this is what **stock** AF-ON does: with **Menu > AF > AF Button** set to
"Always tracks focus on the selected AF Target Point" (AF-ON ignores Subject Detect), is the ten-byte target record
that stock AF-ON produces byte-for-byte equal to the one stock half-press produces with the same AF target settings?
If not, the correct reference for the AF-ON profile is stock AF-ON, not half-press.

The emulator cannot answer this on bare stock: in the bare-stock K1 role neither button changes the target record
(owner 255, record `14,2,2,0,27,0,39,0,0,0` on all 12 edges; T7, T9d `obs-k1-t9d.jsonl`). K2's AF-ON record
(`14,2,3,0,1,0,1,0,0,0` vs S1 `14,2,3,0,3,0,3,0,0,0`) comes from the T5/T6 overlay converter, **not** stock. So this
task is static.

- **Static analysis only.** Ghidra on the task's project copy; do not run OM-Emu. Image: main SHA-256
  `5e8d376e…7d59`, base `0x60021020` (file offset = address − `0x60021020`). Every listing must match the image bytes.
- Label every claim `STATIC`, `INFERRED` or `PRIOR` (with the prior task/decision). No hardware recommendation, no
  change proposal, no storage decision.

## 1. Questions

1. **Half-press path.** From the S1 (half-press) down edge to the stock target-record writer `0x609b3c79` (T8d writer
   rule): the call chain, the owner value written, and the exact inputs the writer reads (T8d: `0x9a41[0]`,
   `0x1dd1[0..1]`, `0x84d1[0]`, `0x88b2[0]`, `0x1df1[0]`, `0x1e01[0]`; position 526 forced for kind 2; priority
   cleared for kinds 0, 2, 3 with vertical 3). Confirm or correct from the image.
2. **AF-ON path.** From the stock AF-ON down edge (custom-switch AF, owner 2) to wherever the target record is built:
   does it reach `0x609b3c79`, another writer, or a shared helper? Give the call chain and every branch that depends on
   the AF Button setting (`0x90a1`, element for the custom switch; T1 mapping of stored values) or on the button
   identity/owner.
3. **Inputs and transforms.** For the AF-ON path, list every input it reads to build the record and every transform
   applied that the half-press path does not apply (or vice versa): zone kind, size bytes (record bytes 4 and 6),
   position, priority/subject bits, vertical/pose handling, custom-size slots (C1–C4), AF Home or other substitutions.
4. **Byte-level prediction.** For each zone (All, Single, Small, Cross, Mid, Large, C1, C2, C3, C4) in landscape and
   EXIF 6, with "Always tracks" selected, state per record byte whether stock AF-ON equals stock half-press, and if not,
   the predicted values and the instruction that causes the difference. Also the release path (AF-ON up vs S1 up).
5. **Subject Detect setting.** Confirm which stored value of the custom-switch element means "Always tracks", and what
   the other value changes on the AF-ON path (for the record only).
6. **Conclusion.** One of: (a) equal for every zone and pose — half-press is the correct reference; (b) differs — list
   exactly where, so the reference can be changed to stock AF-ON; (c) cannot be decided statically — say what blocks
   it and what minimal dynamic evidence would decide it.

## 2. Records

`result.md` (template), listings (`work\out\listings\`, address ranges with bytes), call-graph notes, the per-zone
table, manifest and seal. Hash the image and the Ghidra project inputs before use.

## 3. Out of scope

Any change, emulator run, persistence, display, hardware.

## 4. Correction round (Opus, after Sol's review `run-20261120-192849-review`: REJECT)

Your previous work is in `work\`, and Sol's full review is `audit\previous-review.md`. Read it completely. Do not
start over; new versioned files only. Still static only.

**Confirmed, reuse:** all listings match the image; the writer formula (`0x609b3c79`, seven inputs in order, kind-2
position 526, priority clear, the `+0x22` shadow replacement from `0xa33d4a94..9a`); the S1 and AF-ON handler entry
points and the owner-2 store; the `0x90a1` caches.

**Required:** a shared writer does not show that both buttons give the same record. Close, or explicitly mark as
blocked, each of:
1. **Publication and timing.** Who calls the writer's callers `0x609b3b98`/`0x609b3bbc`, on which events, and whether
   an S1 down and an AF-ON down each cause a rebuild before the record is consumed (or the consumer reads a record
   built earlier). Follow vtable and dispatcher calls, not only direct `call` immediates.
2. **Inputs.** Whether anything on either button's path writes any of the seven input cells, or the shadow source
   `0xe951[0]` / `0xa33d4a94..9a`, before the rebuild (button-specific values, AF Home, AF-ON-specific substitution).
3. **S1 owner/dispatch chain** and the **custom-button route** (function `0x0a`, assignment table `0x612f20c8`),
   including unresolved callees and release-specific effects.
4. **`0x90a1[1]`.** Correct the `0x609024aa` condition; state precisely what value 0 vs 1 changes, and whether any path
   from it reaches the record or its inputs. Withdraw the absolute "cannot affect any record byte" unless shown.
5. **Corrections:** the T7 attribution; `0x609b39f2` → `0x609b39f0`; retain exact commands for every scan.
6. **Conclusion.** (a) only if every item above is closed with listings; otherwise (c), naming each remaining blocker
   and the minimal deciding evidence (as Sol stated: paired stock record-publication observations with button/owner,
   pose, setting, the seven inputs and shadow state identified). No emulator run; no hardware recommendation.
