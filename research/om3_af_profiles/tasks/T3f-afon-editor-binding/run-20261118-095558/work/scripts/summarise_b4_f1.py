# role: observe. Summarise the descriptor experiment.
import json
from pathlib import Path

p = Path("work/out/exp-b4-f1.jsonl")
out = []
for line in p.read_text(encoding="utf-8").splitlines():
    if not line:
        continue
    row = json.loads(line)
    step = row.get("step")
    if step in ("descriptor-before-link", "descriptor-after-link", "descriptor-link", "done", "3d6f-move"):
        out.append(json.dumps({k: row.get(k) for k in ("step", "d0", "a0", "error", "descriptor", "bucket", "previousHead", "chooserOpen", "profileChanged", "cancelHeld", "stockHeld", "focus", "confirmProfile", "cancelProfile", "confirm90a1", "questions", "moves", "texts")}, ensure_ascii=False))
    if step in ("2154-after", "3d6f-after", "3d6f-confirm", "3d6f-cancel"):
        matches = row.get("matches") or []
        out.append("%s chooser %s setters %s profile %s texts %s match %s" % (
            step, row.get("chooser"), row.get("setters"),
            (row.get("cells") or {}).get("profile"),
            (row.get("texts") or [])[:5],
            [(m.get("d0"), m.get("ui")) for m in matches],
        ))
Path("work/out/summary-b4-f1.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("lines", len(out))
