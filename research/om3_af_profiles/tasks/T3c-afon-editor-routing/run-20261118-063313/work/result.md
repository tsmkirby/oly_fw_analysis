# T3c result

1. **Task identifier and brief version used:** T3c, route the AF-ON zone row to a stock editor. Brief version 2026-11-18. Agent Grok 4.7 High.

2. **Research baseline used:** `TASK.md`; `brief.md` (section 0 followed); `templates/result.md`; T3a `decision.md`, brief sections 4 and 7, and the Sol review `run-20261118-062612-review/review.md`; T3a `design.md`, `design-v12.md`, `result.md`, and `overlay-changed-bytes.csv`; `AFON-MENU-RESEARCH.md` section 6; decompiled `FUN_61203696`, `FUN_61203816`, `FUN_61203e81`, `FUN_61204065`, `FUN_611c7785`, `FUN_611f703b`, `FUN_611f6e4b`, `FUN_610cdf05`, `FUN_610cdebf`, `FUN_6129744a`. Input hashes are in `work/evidence-manifest.json`. The main image hash matches T1. OM-Emu was not patched.

3. **Work performed:** Static dumps of the page table, rows, callers, and the OK slot list. Dynamic traces of OK on C-AF Area, 2154, 2155 and `0x3D6F`. EMULATOR-ONLY reference construction of pages 28 and 29, each in its own stock session. Four R1 prototypes. No acceptance run. Commands and exits are in the manifest. Representative commands:

- `python -I work/scripts/static_route_a1.py`
- `python -I work/scripts/static_dispatch_a2.py`
- `python -I work/scripts/static_callers_a3.py`
- `node26 work/scripts/route_trace_a1.mjs om-emu work/out/trace-a1.jsonl`
- `node26 work/scripts/route_decision_a2.mjs om-emu work/out/trace-decision-a2.jsonl`
- `node26 work/scripts/route_kind_a3.mjs om-emu work/out/trace-kind-a3.jsonl`
- `node26 work/scripts/route_page_a2.mjs om-emu 28 work/out/page28-a2.jsonl`
- `node26 work/scripts/route_page_a3.mjs om-emu 28 work/out/page28-a3.jsonl`
- `node26 work/scripts/route_page_a3.mjs om-emu 29 work/out/page29-a3.jsonl`
- `node26 work/scripts/route_build_a8.mjs om-emu work/out/trace-build-a8.jsonl`
- `node26 work/scripts/proto_r1_v1.mjs om-emu work/out/proto-r1-v1.jsonl`
- `node26 work/scripts/proto_r1_v2.mjs om-emu work/out/proto-r1-v2.jsonl`
- `node26 work/scripts/proto_r1_v3.mjs om-emu work/out/proto-r1-v3.jsonl`
- `node26 work/scripts/proto_r1_v4.mjs om-emu work/out/proto-r1-v4.jsonl`
- `tools\bin\run-ghidra.cmd -postScript DisasmRangesA3.java 611f6e4b 25 work\out\disasm-kind-a3.txt 611f703b 40 work\out\disasm-activate-a3.txt -log work\out\ghidra-decision-a3.log`

4. **Files examined:** `inputs/00_0100_50000020.decoded.bin`. Page descriptors `0x6158f0d0` through `0x6158f120`. Rows `0x6158dc44`, `0x6158dc8c`, `0x6158dcf8`, overlay row `0x6031e978`. Source records `0x61529ce8`, `0x61529cf4`, `0x61529d00`. Option lists `0x6158ba04` and `0x6158ba1c`. Decision code `0x611f703b`–`0x611f7096`, `0x611f6e4b`–`0x611f6e85`, `0x61203816`, `0x61204065`, `0x611c7785`, `0x610cdebf`, `0x610cdf05`, `0x610e2536`. Descriptor lookup `0x604058bc`. Bucket `0x62a84b2c`.

5. **Files created:** Everything listed in `work/evidence-manifest.json`. All of it is under `work/`. Reports: `work/out/phaseA.md`, `work/out/design.md`, `work/out/overlay-changed-bytes.csv`, `work/result.md`.

6. **Findings:**

1. OK on 2154 and OK on 2155 open the two-option `0x610e` chooser. `OBSERVED-EMU`
2. OK on `0x3D6F` stays on the page and does not enter `FUN_610cdebf`. `OBSERVED-EMU`
3. On that OK, `FUN_61204065` is called with `0x3D6F`, count 10, and list `0x6158ba1c`. `OBSERVED-EMU`
4. The compares with 1, 3 and 4 in `FUN_611f703b` see 0 for all three rows. `OBSERVED-EMU` `STATIC`
5. Kind 12, a null alternate list, option count 2, and UI 2154's descriptor template pointer each leave the page in place. `OBSERVED-EMU`
6. `FUN_604058bc(0x3D6F)` returns descriptor `0x6031e9a0` in A0. `OBSERVED-EMU`
7. Page 28, built by EMULATOR-ONLY reference construction, shows three "AF Target Mode" rows whose value is the All grid. OK does not open an editor. `OBSERVED-EMU`
8. Page 29, built the same way, shows three "AF Target Point" rows. OK does not open an editor. `OBSERVED-EMU`
9. After those OKs the only changed cell is `0x1dd1[0,1]`, from 3,3 to 27,39. No AF Home cell changes. `OBSERVED-EMU`
10. There is no handler-table key and no extra pointer that opens page 28 or page 29. `STATIC`
11. C-AF Area OK enters the same refresh path as the priority rows and opens its two-option chooser. `OBSERVED-EMU`
12. `FUN_611c7785` calls `FUN_611c7894` for option kinds 1, 2, 5, 6, 7, 8, 9, 10 and 11, and the records at `0x6158ba1c` are kind 12. `STATIC`
13. R1 is possible with code, and the four prototypes are BLOCKED. `INFERRED`
14. R2 is not possible on the OK path that was measured. The target editor's reads and writes were not observed. `INFERRED`

7. **Evidence for each claim:** (1) `work/out/trace-a1.jsonl`, screenshots `work/out/trace-a1-2154.png` and `trace-a1-2155.png`, body entry `0x610e2536` from `0x610cdf98`. (2) `work/out/trace-open-a7.jsonl` hits empty for `3d6f`; screenshot `work/out/trace-a5-3d6f.png`. (3) `work/out/trace-build-a8.jsonl` third build event, d0 15727, d1 10, a1 `0x6158ba1c`. (4) `work/out/disasm-activate-a3.txt` lines for `0x611f7074`–`0x611f7080`; `work/out/trace-kind-a3.jsonl` plus34 0 and ret 0. (5) `work/out/proto-r1-v1.jsonl` through `proto-r1-v4.jsonl`, step `opened: false`. (6) `work/out/link-diag-a9.jsonl` lookup a0 `0x6031e9a0`. (7) `work/out/page28-a3.jsonl` and `work/out/page28-a3-open.png`, `page28-a3-ok.png`. (8) `work/out/page29-a3.jsonl` and `work/out/page29-a3-open.png`, `page29-a3-ok.png`. (9) the `changed` object in those two JSONL files: only `custom`. (10) `work/out/static-route-a1.txt` handler keys and u32 hits. (11) `work/out/trace-decision-a2.jsonl` step `caf-area`; `work/out/trace-a2-caf.png`. (12) `ref/analysis/decompiled-main/functions/611c7785.c` lines 34–50; T3a established the kind-12 records, and the builder was handed that list. (13) `work/out/design.md`. (14) `work/out/phaseA.md` section 3.

8. **Tests and outcomes:**

- Phase A traces: BOUNDARY. They record arguments and screens. `ok` is false because they are not acceptance.
- Page 28 and page 29 reference construction: BOUNDARY. The pages rendered. OK did not open an editor. No AF Home write.
- Prototype v1 kind 12: FAIL. The chooser did not open. Setter not called. Profile stayed 0.
- Prototype v2 kind 12 and null alternate: FAIL. Same.
- Prototype v3 option count 2: FAIL. Same.
- Prototype v4 descriptor template from 2154: FAIL. Same.
- Acceptance: not run. Phase B is BLOCKED.

9. **New versus previously established:** (1) confirms T3a: the priority rows use the `0x610e` family. (2) confirms T3a: `0x3D6F` does not enter that family. (3) new: the 10-record list is the argument of `FUN_61204065` on that OK. (4) new: the 1/3/4 compare is not the split. (5) new. (6) confirms T3a: the descriptor link returns `0x6031e9a0` (in A0; D0 holds the id). (7) new. T3a had not built page 28. (8) new. (9) confirms T3a: menu entry changes `0x1dd1[0,1]` from 3,3 to 27,39. (10) new as a checked absence. (11) confirms T3a: C-AF Area uses the same family. (12) new. (13) new. (14) new.

10. **Remaining uncertainties:** The function that creates the priority chooser, before `FUN_610cdebf` starts refreshing its widgets, was not named. `FUN_61149c48` is that refresh, called from `FUN_610d866e` at `0x610d86ae`, and it runs only after the chooser exists. Whether `FUN_611c7894` would draw the 10 records and call the `0x3D6F` setter was not tested. Page 29's target editor, if it is reached by some key other than OK, was not sought. The `ORIGINALLY` ids 2274–2279 were read with `s.get` and have no map0 key in the readback.

11. **Recommended next actions:** One EMULATOR-ONLY hook at `0x611c7785`, limited to list `0x6158ba1c` while `FUN_61204065` was entered with D0 `0x3D6F`, so kind 12 takes the `FUN_611c7894` branch. Then the same confirm and cancel checks as T3a section 4. Do not run acceptance until a chooser opens and the setter stores the byte. R2 stays with T3b; this measurement says OK on the page-29 row does not enter that editor.

12. **Deviations from the brief:** Acceptance was not run, because Phase B is BLOCKED (T3a brief section 7: when item 2 is blocked, do not run item 3). Prototype v2 wrote its screens to `work/out/proto-r1-v1-page.png` and `work/out/proto-r1-v1-open.png`, so those two files now hold the v2 frames. Copies are saved as `work/out/proto-r1-v2-page.png` and `work/out/proto-r1-v2-open.png`. Both trials had the same outcome. No firmware image was written. OM-Emu and `ref/` were not modified.
