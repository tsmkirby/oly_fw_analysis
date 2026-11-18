# role: observe. Summarise the B1 second-run log: matches, setters, truncation, questions.
import json
from pathlib import Path

p = Path("work/out/exp-b1-f2.jsonl")
out = []
for line in p.read_text(encoding="utf-8").splitlines():
    if not line:
        continue
    row = json.loads(line)
    step = row.get("step")
    if step == "binding-copy":
        out.append("binding head %s new %s" % (row.get("head"), row.get("newRecord")))
    if step in ("done", "boundary", "3d6f-move"):
        keep = {k: row.get(k) for k in ("step", "chooserOpen", "profileChanged", "cancelHeld", "stockHeld", "focus", "confirmProfile", "cancelProfile", "confirm90a1", "questions", "error", "moves", "texts")}
        out.append(json.dumps(keep, ensure_ascii=False))
    if step in ("2154-after", "2155-after", "3d6f-after", "3d6f-confirm", "3d6f-cancel", "caf-1e0"):
        matches = row.get("matches") or []
        setters = row.get("setters") or []
        copies = row.get("copies") or []
        dropped = (row.get("truncation") or {}).get("dropped")
        out.append("%s chooserField %s matches %s setters %s copies %s dropped %s texts %s profile %s" % (
            step, row.get("chooser"),
            [(m.get("d0"), m.get("d1"), m.get("a2"), m.get("ui"), m.get("bytes")) for m in matches],
            setters, copies[:8], dropped,
            (row.get("texts") or [])[:6],
            (row.get("cells") or {}).get("profile"),
        ))
Path("work/out/summary-b1-f2.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("\n".join(out[:20]))
