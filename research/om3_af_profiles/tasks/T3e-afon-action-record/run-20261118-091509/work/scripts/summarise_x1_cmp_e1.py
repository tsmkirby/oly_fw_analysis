# Print the X1 compare and setter records only.
import json
from pathlib import Path

for i, line in enumerate(Path("work/out/exp-x1-e1.jsonl").read_text(encoding="utf-8").splitlines(), 1):
    if not line:
        continue
    row = json.loads(line)
    step = row.get("step")
    if row.get("compares"):
        print(step, "TABLE", row.get("table"))
        for c in row["compares"]:
            print("  cmp", "D0", c["d0"], "D1", c["d1"], "A2", c["a2"], c["bytes"])
    if row.get("setters"):
        print(step, "SETTERS", row["setters"])
    if row.get("store63431"):
        print(step, "STORE", row["store63431"])
    if step == "done":
        print("DONE", row["questions"], "profile", row["confirmProfile"], "cancel", row["cancelProfile"], "90a1", row["confirm90a1"])
