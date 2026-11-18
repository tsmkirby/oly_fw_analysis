# T5 result

1. **Task identifier and brief version used:** T5, AF-ON button applies the AF-ON zone from the menu row. Brief version 2026-11-18. Section 0 of this brief, and T3j §0 through it, governed the run. Subject Detect stayed Off. No CPU3 path was attempted.

2. **Research baseline used:** `TASK.md`, `brief.md`, `templates/result.md`, T3j brief and the accepted-with-corrections decision, T3i design, the central-edge overlay and its builder, the live-profile relocation map, the home-builder and converter listings, and the T3j page-27 table. Decoded main SHA-256 `5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59`. Resource 0106 SHA-256 `3d9fd4426b45fbe4b715599422af38c6d22392c08543a69f63c28291c5a0b059`. The Z overlay reused from T3j is 368 bytes. OM-Emu was not modified.

3. **Work performed:** Every command went through `work/scripts/run_logged.mjs`. The record is `work/out/cmd/01` through `38`. Static overlay and listing check (01–04). Combined overlay (05): Z first, then central-edge, owned block moved. Session and page-27 table (06, 08). Profile swap (07 and 10 and 12 failed on the patch literal; 14 wrote the CSV). Page-27 acceptance (13) on the combined image, before the swap. Edge trials k1–k6 (16, 19, 22, 24, 26, 28) and P4 (29). Acceptance of the 12 edges (30, 32, 34), store diff (35, 38), reopen (36), and a stock session that opens page 27 (37). Failed scripts were left in place. The next script carried the correction.

4. **Files examined:** Stock image `inputs/00_0100_50000020.decoded.bin`. Listings in `work/out/disasm-*.txt`, checked against `work/out/static-windows-k1.json` (314 instructions, 0 mismatches). Home builder `0x60a8f6bb`, the AF Home read at `0x60a8f708`, converter `0x609b3ecd`, call site `0x610bf5e2`, stub `0x6031eb80`, ensure `0x6031ead0`. Z ranges `0x6031e920`–`0x6031e923`, `0x6031e928`–`0x6031e99b`, `0x6031e9a0`–`0x6031e9b3`, `0x6031ea00`–`0x6031eae3`.

5. **Files created:** Everything under `work/` is listed by `work/evidence-manifest.json`. The deliverables are `work/result.md`, `work/out/target-bytes.md`, `work/out/design.md`, `work/out/overlay-changed-bytes.csv`, the command logs, the JSONL records, and the screenshots.

6. **Findings:**

1. STATIC. The ten-byte record is produced by the home builder. +0 position from `0x99d2` unless kind is 2, which forces 526. +2 kind, +4 vertical, +6 horizontal and +8 priority come from converter `0x609b3ecd`. +3 is `0xdfa1`. +9 is `0x1e01`. The zone type is the converter argument, not a stored field.
2. STATIC. The legacy type read is the twenty bytes at `0x60a8f708`: `fccca19f000089fcdc00000000dd6b3c5dffc00c`. One of those bytes is stock `0xFF`.
3. STATIC. Z and the central-edge image conflict in 182 bytes from `0x6031e921` through `0x6031eae3`. The combined image keeps every Z byte and moves the owned block to `0xa031ed00` (delta `0x3e0`) and ensure to `0x6031eca0`. Sixty immediates move with it. The profile byte stays at `0xa031e920`.
4. STATIC. The one swap replaces the `0x9fa1` read with `movbu (0xa031e920),D0` and a jump to `0x60a8f71c`. `0xdfa1`, `0x99d2` and `0x1e01` stay. After that, the profile byte supplies kind, vertical, horizontal, priority, and position only when kind is 2. Size, the other positions, and +9 stay on the legacy provider.
5. OBSERVED-EMU. Page 27 on the combined image passes the T3j page-27 steps in two sessions and a control. The chooser title is the glyph header. The help sentence is separate. Profile commits store 2 and then 9. Half-press cells do not move.
6. OBSERVED-EMU. With the swap, menu zone 1 (Single) makes AF-ON produce `0e 02 00 00 01 00 01 00 00 00`, owner 2. Zone 2 (Small) produces `0e 02 03 00 01 00 01 00 00 00`. The same Single record is produced in C-AF, Subject Detect Off, focus readback 1 on both `s.get(289)` and `s.get(25)`.
7. OBSERVED-EMU. Releasing AF-ON restores the half-press record `0e 02 03 00 03 00 03 00 00 00` and owner 0, or owner 1 if S1 is still held. The AF-ON record is present only while AF-ON owns.
8. OBSERVED-EMU. A control with no overlay keeps `0e 02 02 00 1b 00 27 00 00 00` on every edge, S1 and AF-ON. AF-ON does not follow a zone.
9. OBSERVED-EMU. Writing `0x9fa1` index 0 to 1 through `0x60063431` does not change the AF-ON record. Setting the profile byte to 2 and pressing again produces the Small record. `0x99a1`, `0x1dd1`, `0x9a41` and `0x90a1` stay put.
10. OBSERVED-EMU. A new session on the saved store reads profile 0. AF-ON then produces the All record `0e 02 02 00 01 00 01 00 00 00`, owner 2. Against a stock session that also opens page 27, M and E are byte-identical (262144 and 196608). The two candidate stores are identical to each other.

7. **Evidence for each claim:** (1) `work/out/disasm-home-k1.txt` lines 21–70 and `work/out/disasm-converter-k1.txt`; `work/out/cmd/04.out`. (2) `work/out/target-bytes.md` and `work/out/cmd/14.out`. (3) `work/out/cmd/05.out`: 3261 bytes, Z 368, central-edge 2175, new 718, 182 conflicts not applied. (4) `work/out/overlay-changed-bytes.csv`, source `new` at `0x60a8f708`. (5) `work/out/accept-k1.jsonl`, record `done` ok, no failed step. (6) `work/out/edges-k6.jsonl` P1 edge 2, P2 edge 2, P3 edge 2. (7) same file, P1 edge 3 and edge 11. (8) `work/out/edges-k6.jsonl` control-saf, every edge. (9) `work/out/edges-k7.jsonl`. (10) `work/out/accept-reopen-k1.jsonl` and `work/out/cmd/38.out`.

8. **Tests and outcomes:**

- Page-27 portion, combined overlay, control plus two sessions: PASS. `work/out/cmd/13.exit` status 0.
- P1 S-AF, zone Single, 12 edges: PASS. `edges-k6.jsonl`.
- P2 S-AF, zone Small, 12 edges: PASS. Same file.
- P3 C-AF, Subject Detect Off, zone Single, 12 edges: PASS. Same file. Focus set through converter `0x604050e5`.
- P4, `0x9fa1` versus the profile byte: PASS. `work/out/cmd/29.exit` status 0.
- Acceptance, two sessions, zone 1 then zone 2, 12 edges each, plus control edges: PASS. `accept-edges-k3.jsonl`.
- Reopen, profile 0, AF-ON applies All: PASS. `accept-reopen-k1.jsonl`.
- Stores against a control that never opened the menu: the M bank differs in 51 bytes, E matches. BOUNDARY of that control, not of the zone. Against a stock session that opens page 27 and runs the same edges, M and E match. `work/out/cmd/38.out`.
- Listing check: PASS, 0 mismatches.
- Swap scripts k1–k3: FAIL, patch construction, no CSV written. Kept.

9. **New versus previously established:** The field layout and the converter heads confirm the home builder and `stock-target-type-conversion.asm`. The Z menu row confirms T3i/T3j. The relocation, the profile read, the Single and Small records, the release restoration under this overlay, and the All record on a fresh session are new. The no-overlay target `0e 02 02 00 1b 00 27 00 00 00` is new for this bring-up. It is not the documented half-press record. The overlay's own half-press record is that documented `0e 02 03 00 03 00 03 00 00 00`.

10. **Remaining uncertainties:** The section-7 call site still has no packaging proof. UI values 6–9 still take their dimensions from `0x1dd1` inside the converter. That path was not used. Size and position, other than the kind-2 position force, are still the legacy provider. The 51 M bytes that differ from a no-menu control were not decoded field by field. They are absent once the control opens page 27.

11. **Recommended next actions:** T3b can take size and position off `0xdfa1` and `0x99d2`. T4 can decide storage. The section-7 call still needs a placement proof before any image is built. Subject Detect On remains the CPU3 boundary and was not touched.

12. **Deviations from the brief:** The page-27 portion is the entry to page 27 and the zone row. Pages 25, 26, 28 and the leave/return detour are not in it. The owned block could not share Z's addresses, so it was moved. That move is recorded in `design.md` and in the CSV as source `new`. The first store comparison used a control that had not opened the menu, so M differed. The comparison that opens page 27 matches. `0x1dd1` index 0 and 1 are 27 and 39 in the menu acceptance, and 3 and 3 after the focus writer, on both the control and the candidate, before any edge. No firmware image was written. No storage decision was made. No hardware recommendation is made.

The value stays in RAM. A native save does not restore it.
