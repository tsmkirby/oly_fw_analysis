# Compact cell snapshots from the two experiment logs.
import json
from pathlib import Path

def show(path, steps):
    print("==", path)
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if not line:
            continue
        row = json.loads(line)
        if row.get("step") not in steps:
            continue
        cells = row.get("cells") or {}
        texts = row.get("texts") or []
        print(row["step"],
              "hl", row.get("highlight"),
              "ntexts", len(texts),
              "texts", texts[:6],
              "profile", cells.get("profile"),
              "cached", cells.get("profileCached"),
              "90a1", cells.get("k90a1"),
              "1dd1", cells.get("k1dd1"),
              "99a1", cells.get("k99a1"),
              "9a41", cells.get("k9a41"),
              "5962", cells.get("k5962"),
              "home", cells.get("home"),
              "trunc", row.get("truncation"),
              "uncapped", row.get("uncapped"),
              "setters", len(row.get("setters") or []),
              "chooser", row.get("chooser"))

want = {"2154-before", "2154-cancel", "2155-cancel", "3d6f-before", "3d6f-after", "3d6f-cancel", "3d6f-confirm", "done"}
show("work/out/exp-x1-e1.jsonl", want)
show("work/out/exp-x4-e1.jsonl", {"3d6f-before", "3d6f-after", "3d6f-cancel", "3d6f-confirm", "done"})
