# Copy the T3a overlay CSV and write evidence-manifest.json.
# Hashes are computed from the files. Exit codes are the tool results recorded for each command.
import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
src = ROOT / "ref/tasks/T3a-afon-zone-row/run-20261118-053855/work/out/overlay-changed-bytes.csv"
dst = ROOT / "work/out/overlay-changed-bytes.csv"
shutil.copyfile(src, dst)

def sha(path):
    h = hashlib.sha256()
    data = path.read_bytes()
    h.update(data)
    return h.hexdigest(), len(data)

inputs = [
    "inputs/00_0100_50000020.decoded.bin",
    "inputs/02_0106_458c0020.decoded.bin",
]
sources = [
    "brief.md",
    "TASK.md",
    "templates/result.md",
    "ref/tasks/T3a-afon-zone-row/decision.md",
    "ref/tasks/T3a-afon-zone-row/brief.md",
    "ref/analysis/button-af/AFON-MENU-RESEARCH.md",
    "ref/analysis/decompiled-main/functions/611c7785.c",
    "ref/analysis/decompiled-main/functions/61204065.c",
    "ref/analysis/decompiled-main/functions/61203816.c",
    "ref/analysis/decompiled-main/functions/610cdebf.c",
    "ref/analysis/decompiled-main/functions/610cdf05.c",
    "ref/analysis/decompiled-main/functions/611f703b.c",
    "ref/analysis/decompiled-main/functions/611f6e4b.c",
]
outputs = []
for path in sorted((ROOT / "work").rglob("*")):
    if not path.is_file():
        continue
    rel = path.relative_to(ROOT).as_posix()
    if rel == "work/evidence-manifest.json":
        continue
    digest, size = sha(path)
    outputs.append({"path": rel, "sha256": digest, "bytes": size})

commands = [
    {"cmd": "python -I work/scripts/static_route_a1.py", "exit": 0, "stdout": "work/out/static-route-a1.txt", "note": "tool result; stdout is the script report"},
    {"cmd": "python -I work/scripts/static_dispatch_a2.py", "exit": 0, "stdout": "work/out/static-dispatch-a2.txt", "note": "tool result; stdout is the script report"},
    {"cmd": "python -I work/scripts/static_callers_a3.py", "exit": 0, "stdout": "work/out/cmd/05-callers.out", "stderr": "work/out/cmd/05-callers.err"},
    {"cmd": "node26 work/scripts/route_trace_a1.mjs om-emu work/out/trace-a1.jsonl", "exit": 0, "stdout": "work/out/cmd/04-trace.out", "stderr": "work/out/cmd/04-trace.err"},
    {"cmd": "node26 work/scripts/route_decision_a2.mjs om-emu work/out/trace-decision-a2.jsonl", "exit": 0, "stdout": "work/out/cmd/06-decision.out", "stderr": "work/out/cmd/06-decision.err"},
    {"cmd": "node26 work/scripts/route_kind_a3.mjs om-emu work/out/trace-kind-a3.jsonl", "exit": 0, "stdout": "work/out/cmd/07-kind.out", "stderr": "work/out/cmd/07-kind.err"},
    {"cmd": "node26 work/scripts/route_page_a2.mjs om-emu 28 work/out/page28-a2.jsonl", "exit": 0, "stdout": "work/out/cmd/08-page28.out", "stderr": "work/out/cmd/08-page28.err"},
    {"cmd": "tools\\bin\\run-ghidra.cmd -postScript DisasmRangesA3.java 611f6e4b 25 work\\out\\disasm-kind-a3.txt 611f703b 40 work\\out\\disasm-activate-a3.txt -log work\\out\\ghidra-decision-a3.log", "exit": 0, "stdout": "work/out/cmd/09-ghidra.out", "stderr": "work/out/cmd/09-ghidra.err"},
    {"cmd": "tools\\bin\\run-ghidra.cmd -postScript DisasmRangesA3.java 611f707c 18 work\\out\\disasm-activate-tail-a3.txt -log work\\out\\ghidra-activate-tail-a3.log", "exit": 0, "stdout": "work/out/cmd/10-ghidra-tail.out", "stderr": "work/out/cmd/10-ghidra-tail.err"},
    {"cmd": "node26 work/scripts/route_slot_a4.mjs om-emu work/out/trace-slot-a4.jsonl", "exit": 1, "stdout": "work/out/cmd/11-slot.out", "stderr": "work/out/cmd/11-slot.err", "note": "AF Button search failed after the C-AF chooser; the C-AF record was written"},
    {"cmd": "node26 work/scripts/route_page_a3.mjs om-emu 28 work/out/page28-a3.jsonl", "exit": 0, "stdout": "work/out/cmd/12-page28.out", "stderr": "work/out/cmd/12-page28.err"},
    {"cmd": "node26 work/scripts/route_page_a3.mjs om-emu 29 work/out/page29-a3.jsonl", "exit": 0, "stdout": "work/out/cmd/13-page29.out", "stderr": "work/out/cmd/13-page29.err"},
    {"cmd": "node26 work/scripts/route_slot_a5.mjs om-emu work/out/trace-slot-a5.jsonl", "exit": 0, "stdout": "work/out/cmd/14-slot.out", "stderr": "work/out/cmd/14-slot.err"},
    {"cmd": "node26 work/scripts/proto_r1_v1.mjs om-emu work/out/proto-r1-v1.jsonl", "exit": 0, "stdout": "work/out/cmd/15-proto-v1.out", "stderr": "work/out/cmd/15-proto-v1.err"},
    {"cmd": "python -I work/scripts/static_callers_a4.py", "exit": 0, "stdout": "work/out/cmd/16-callers.out", "stderr": "work/out/cmd/16-callers.err"},
    {"cmd": "node26 work/scripts/route_act_a6.mjs om-emu work/out/trace-act-a6.jsonl", "exit": 0, "stdout": "work/out/cmd/17-act.out", "stderr": "work/out/cmd/17-act.err"},
    {"cmd": "node26 work/scripts/route_open_a7.mjs om-emu work/out/trace-open-a7.jsonl", "exit": 0, "stdout": "work/out/cmd/18-open.out", "stderr": "work/out/cmd/18-open.err"},
    {"cmd": "tools\\bin\\run-ghidra.cmd -postScript DisasmRangesA3.java 61154f10 30 work\\out\\disasm-refresh-caller-a4.txt -log work\\out\\ghidra-refresh-caller-a4.log", "exit": 0, "stdout": "work/out/cmd/19-ghidra-caller.out", "stderr": "work/out/cmd/19-ghidra-caller.err"},
    {"cmd": "python -I work/scripts/static_slots_a5.py", "exit": 0, "stdout": "work/out/cmd/20-slots.out", "stderr": "work/out/cmd/20-slots.err"},
    {"cmd": "node26 work/scripts/route_build_a8.mjs om-emu work/out/trace-build-a8.jsonl", "exit": 0, "stdout": "work/out/cmd/21-build.out", "stderr": "work/out/cmd/21-build.err"},
    {"cmd": "python -I work/scripts/static_refresh_a6.py", "exit": 0, "stdout": "work/out/cmd/22-refresh.out", "stderr": "work/out/cmd/22-refresh.err"},
    {"cmd": "python -I work/scripts/make_proto_v2.py", "exit": 0, "stdout": "work/out/cmd/23-make-v2.out", "stderr": "work/out/cmd/23-make-v2.err"},
    {"cmd": "node26 work/scripts/proto_r1_v2.mjs om-emu work/out/proto-r1-v2.jsonl", "exit": 0, "stdout": "work/out/cmd/24-proto-v2.out", "stderr": "work/out/cmd/24-proto-v2.err"},
    {"cmd": "python -I work/scripts/copy_v2_png.py", "exit": 0, "stdout": "work/out/cmd/25-copy-png.out", "stderr": "work/out/cmd/25-copy-png.err"},
    {"cmd": "node26 work/scripts/link_diag_a9.mjs om-emu work/out/link-diag-a9.jsonl", "exit": 0, "stdout": "work/out/cmd/26-link.out", "stderr": "work/out/cmd/26-link.err"},
    {"cmd": "node26 work/scripts/route_who_a10.mjs om-emu work/out/trace-who-a10.jsonl", "exit": 0, "stdout": "work/out/cmd/27-who.out", "stderr": "work/out/cmd/27-who.err"},
    {"cmd": "python -I work/scripts/make_proto_v3.py", "exit": 0, "stdout": "work/out/cmd/28-make-v3.out", "stderr": "work/out/cmd/28-make-v3.err"},
    {"cmd": "node26 work/scripts/proto_r1_v3.mjs om-emu work/out/proto-r1-v3.jsonl", "exit": 0, "stdout": "work/out/cmd/29-proto-v3.out", "stderr": "work/out/cmd/29-proto-v3.err"},
    {"cmd": "python -I work/scripts/make_proto_v4.py", "exit": 0, "stdout": "work/out/cmd/30-make-v4.out", "stderr": "work/out/cmd/30-make-v4.err"},
    {"cmd": "node26 work/scripts/proto_r1_v4.mjs om-emu work/out/proto-r1-v4.jsonl", "exit": 0, "stdout": "work/out/cmd/31-proto-v4.out", "stderr": "work/out/cmd/31-proto-v4.err"},
    {"cmd": "python -I work/scripts/write_manifest_a11.py", "exit": 0, "stdout": "work/out/cmd/32-manifest.out", "stderr": "work/out/cmd/32-manifest.err", "note": "first manifest build; this file is the refreshed manifest"},
    {"cmd": "node26 --version", "exit": 0, "stdout": "work/out/cmd/33-node-version.out", "stderr": "work/out/cmd/33-node-version.err"},
]

manifest = {
    "task": "T3c-afon-editor-routing",
    "brief_sha256": sha(ROOT / "brief.md")[0],
    "inputs": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in inputs if (ROOT / p).is_file()],
    "sources": [{"path": p, "sha256": sha(ROOT / p)[0]} for p in sources if (ROOT / p).is_file()],
    "outputs": outputs,
    "commands": commands,
    "tool_versions": {
        "python": sys.version.split()[0],
        "node26": (ROOT / "work/out/cmd/33-node-version.out").read_text(encoding="utf-16").strip(),
    },
}
(ROOT / "work/evidence-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("outputs", len(outputs))
print("brief", manifest["brief_sha256"])
print("csv", sha(dst)[0], sha(dst)[1])
