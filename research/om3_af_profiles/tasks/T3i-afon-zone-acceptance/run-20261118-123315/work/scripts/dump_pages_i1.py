# role: observe. Print the shared-path log. No image writes.
import json
from pathlib import Path

rows = [json.loads(line) for line in Path("work/out/pages-control.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
for r in rows:
    step = str(r.get("step"))
    if not (step.startswith("seek") or step.startswith("page") or step.startswith("leave") or step.startswith("2154") or step.startswith("2155") or step == "done"):
        continue
    texts = " | ".join(t.replace("\r", "/").replace("\n", "/") for t in (r.get("texts") or [])[:8])
    print("%-16s hl=%s %s" % (step, r.get("highlight"), texts[:220]))
