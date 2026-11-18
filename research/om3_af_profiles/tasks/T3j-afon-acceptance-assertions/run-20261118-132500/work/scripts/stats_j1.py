# Counts for the result. Do not edit after it has run.
import json
from collections import Counter
from pathlib import Path

rows = [json.loads(line) for line in Path("work/out/accept-j1.jsonl").read_text(encoding="utf-8").splitlines() if line]
steps = [r for r in rows if "pass" in r]
print("records", len(rows), "steps", len(steps), "fail", sum(1 for r in steps if not r["pass"]))
print("by session", dict(Counter(r["session"] for r in steps)))
missing = [r["session"] + ":" + r["id"] for r in steps if r.get("action") not in ("store-compare", "overlay-compare") and not r.get("screenshot")]
print("missing screenshots", missing)
inv = json.loads(Path("work/out/import-inventory-j1.json").read_text(encoding="utf-8"))
print("modules", len(inv["modules"]), "resources", len(inv["resources"]))
print("png", len(list(Path("work/out").glob("*.png"))))
