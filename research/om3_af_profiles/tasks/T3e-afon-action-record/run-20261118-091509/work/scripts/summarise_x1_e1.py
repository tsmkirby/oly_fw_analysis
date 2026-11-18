# Compact the X1 JSONL. Reads work/out/exp-x1-e1.jsonl. Writes work/out/exp-x1-e1-summary.txt.
import json
from pathlib import Path

src = Path("work/out/exp-x1-e1.jsonl")
out = []
for i, line in enumerate(src.read_text(encoding="utf-8").splitlines(), 1):
    if not line:
        continue
    row = json.loads(line)
    step = row.get("step")
    keep = {
        "line": i,
        "step": step,
        "role": row.get("role"),
        "highlight": row.get("highlight"),
        "focus": row.get("focus"),
        "chooser": row.get("chooser"),
        "uncapped": row.get("uncapped"),
        "truncation": row.get("truncation"),
    }
    if "cells" in row:
        c = row["cells"]
        keep["profile"] = c.get("profile")
        keep["k90a1"] = c.get("k90a1")
        keep["k1dd1"] = c.get("k1dd1")
        keep["originally"] = c.get("originally")
    if "compares" in row:
        keep["compares"] = row["compares"]
        keep["setters"] = row.get("setters")
        keep["store63431"] = row.get("store63431")
        keep["table"] = row.get("table")
        keep["chooserCount"] = row.get("chooser")
        keep["n63380"] = len(row.get("store63380") or [])
    if step == "done":
        keep["questions"] = row.get("questions")
        keep["confirmProfile"] = row.get("confirmProfile")
        keep["cancelProfile"] = row.get("cancelProfile")
        keep["confirm90a1"] = row.get("confirm90a1")
        keep["chooserOpen"] = row.get("chooserOpen")
    if step in ("live-table", "redirects", "3d6f-move"):
        keep["note"] = row.get("note")
        keep["tablePtr"] = row.get("actionTable") or row.get("table")
        keep["moves"] = row.get("moves")
        keep["count"] = row.get("count")
    out.append(json.dumps(keep, ensure_ascii=False))
text = "\n".join(out) + "\n"
Path("work/out/exp-x1-e1-summary.txt").write_text(text, encoding="utf-8")
print("lines", len(out))
print(text)
