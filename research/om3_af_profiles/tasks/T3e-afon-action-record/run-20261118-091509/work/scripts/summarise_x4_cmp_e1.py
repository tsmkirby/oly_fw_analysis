# Print the X4 compare, setter, and outcome records.
import json
from pathlib import Path

for line in Path("work/out/exp-x4-e1.jsonl").read_text(encoding="utf-8").splitlines():
    if not line:
        continue
    row = json.loads(line)
    step = row.get("step")
    if step == "explanation":
        print("THIRD", row.get("thirdRecord"))
        print("CHANGE", row.get("change"))
    if row.get("compares"):
        print(step, "TABLE", row.get("table"))
        for c in row["compares"]:
            print("  cmp", "D0", c["d0"], "D1", c["d1"], "A2", c["a2"], c["bytes"])
    if row.get("setters"):
        print(step, "SETTERS", row["setters"])
    if row.get("store63431"):
        print(step, "STORE", row["store63431"])
    if step in ("3d6f-after", "3d6f-cancel", "3d6f-confirm", "done", "boundary"):
        keep = {k: row.get(k) for k in ("step", "highlight", "error", "questions", "confirmProfile", "cancelProfile", "confirm90a1", "chooserOpen", "profileChanged", "texts")}
        if step != "done":
            keep.pop("questions", None)
            keep.pop("confirmProfile", None)
            keep.pop("cancelProfile", None)
            keep.pop("confirm90a1", None)
            keep.pop("chooserOpen", None)
            keep.pop("profileChanged", None)
        if "texts" in keep and isinstance(keep["texts"], list):
            keep["texts"] = keep["texts"][:8]
        print("STEP", json.dumps(keep, ensure_ascii=True))
