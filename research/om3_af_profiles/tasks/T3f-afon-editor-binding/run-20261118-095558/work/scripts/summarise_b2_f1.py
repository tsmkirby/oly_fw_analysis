# role: observe. Summarise the zone-list trial.
import json
from pathlib import Path

out = []
for line in Path("work/out/exp-b2-f1.jsonl").read_text(encoding="utf-8").splitlines():
    if not line:
        continue
    row = json.loads(line)
    step = row.get("step")
    if step in ("done", "3d6f-move", "3d6f-chosen"):
        out.append(json.dumps({k: row.get(k) for k in ("step", "chooserOpen", "profileChanged", "cancelHeld", "stockHeld", "focus", "confirmProfile", "cancelProfile", "confirm90a1", "moves", "texts", "questions")}, ensure_ascii=False))
    if step in ("3d6f-after", "3d6f-confirm", "3d6f-cancel", "2154-after"):
        out.append("%s setters %s profile %s texts %s" % (
            step, row.get("setters"), (row.get("cells") or {}).get("profile"), (row.get("texts") or [])[:8]))
Path("work/out/summary-b2-f1.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("ok")
