# role: observe. Compact cell and setter readback from the committing run and the two list trials.
import json
from pathlib import Path

out = []
for name in ("exp-b4-f1.jsonl", "exp-b2-f1.jsonl", "exp-b3-f1.jsonl"):
    out.append("== " + name)
    for line in Path("work/out/" + name).read_text(encoding="utf-8").splitlines():
        row = json.loads(line)
        step = row.get("step")
        if step not in ("3d6f-after", "3d6f-cancel", "3d6f-confirm", "2154-cancel", "2155-cancel", "caf-1e0"):
            continue
        cells = row.get("cells") or {}
        keep = {
            "step": step,
            "setters": row.get("setters"),
            "matches": [(m.get("d0"), m.get("d1"), m.get("a2"), m.get("ui")) for m in (row.get("matches") or [])],
            "compares": [(c.get("d0"), c.get("d1"), c.get("a2")) for c in (row.get("compares") or [])][:6],
            "dropped": (row.get("truncation") or {}).get("dropped"),
            "profile": cells.get("profile"),
            "k90a1": cells.get("k90a1"),
            "k1dd1": cells.get("k1dd1"),
            "k99a1": cells.get("k99a1"),
            "k9a41": cells.get("k9a41"),
            "k5962": cells.get("k5962"),
            "home": cells.get("home"),
            "originally": cells.get("originally"),
            "store63431": len(row.get("store63431") or []),
            "store63380": len(row.get("store63380") or []),
        }
        out.append(json.dumps(keep, ensure_ascii=False))
Path("work/out/cells-f1.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("rows", len(out))
