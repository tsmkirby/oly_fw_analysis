# One-shot dump of T3i acceptance observations. Do not edit after it runs.
import json
from pathlib import Path

ROOT = Path("ref/tasks/T3i-afon-zone-acceptance/run-20261118-123315/work/out")


def show(name):
    print("==", name)
    for line in (ROOT / name).read_text(encoding="utf-8").splitlines():
        r = json.loads(line)
        if r.get("role") != "observe" or r.get("step") in ("helper-hashes", "done"):
            continue
        if "texts" not in r:
            keys = {k: r[k] for k in ("step", "screen", "exits") if k in r}
            print(keys)
            continue
        help_r = r.get("help")
        glyph = r.get("glyph")
        g = None if not glyph else {"value": glyph.get("value"), "id": glyph.get("id"), "kind": glyph.get("kind")}
        h = None if not help_r else {"value": help_r.get("value"), "id": help_r.get("id"), "kind": help_r.get("kind"), "caller": help_r.get("caller")}
        print(json.dumps({
            "step": r.get("step"),
            "key": r.get("key"),
            "highlight": r.get("highlight"),
            "profile": r.get("profile"),
            "cached": r.get("cached"),
            "texts": r.get("texts"),
            "help": h,
            "glyph": g,
        }, ensure_ascii=False))


for name in ("accept-control.jsonl", "accept-c1.jsonl"):
    show(name)
