# <ID> result

1. **Task identifier and brief version used:**
2. **Research baseline used:** documents and sections read; input hashes verified (container/main/0106/OM-Emu patch).
3. **Work performed:** steps in order, with exact commands.
4. **Files examined:** paths, and addresses for disassembly.
5. **Files created:** paths under `work/` only; every one is listed in `work/evidence-manifest.json`.
6. **Findings:** one numbered claim per line, each tagged with its evidence class:
   `OBSERVED-EMU` (emulator run) · `STATIC` (disassembly or bytes, with addresses) ·
   `DATA` (table bytes) · `INFERRED` (reasoning from the above) · `HYPOTHESIS`.
7. **Evidence for each claim:** file + line, or address range + bytes.
8. **Tests and outcomes:** PASS / FAIL / BOUNDARY. A boundary is not a failure and not a pass.
9. **New versus previously established:** for each claim, "new", "confirms <doc §>" or "contradicts <doc §>".
10. **Remaining uncertainties.**
11. **Recommended next actions.**
12. **Deviations from the brief** (or "none").

`evidence-manifest.json`: `{ "task", "brief_sha256", "inputs":[{path,sha256}], "sources":[{path,sha256}], "outputs":[{path,sha256,bytes}], "commands":[...], "tool_versions":{...} }`
