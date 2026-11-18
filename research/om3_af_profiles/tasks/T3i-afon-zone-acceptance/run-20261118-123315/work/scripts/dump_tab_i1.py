# role: observe. Print tabpath-i1 highlights.
import json
from pathlib import Path

rows = [json.loads(line) for line in Path("work/out/tabpath-i1.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
for r in rows:
    step = str(r.get("step"))
    if step in ("helper-hashes", "explanation", "harness-120b", "done") or step.startswith("overlay"):
        continue
    if r.get("role") == "behaviour" and step not in ("page27",):
        if step not in ("explanation",):
            continue
    texts = " | ".join(t.replace("\r", "/").replace("\n", "/") for t in (r.get("texts") or [])[:6])
    if "texts" not in r:
        continue
    print("%-16s hl=%s %s" % (step, r.get("highlight"), texts[:200]))
