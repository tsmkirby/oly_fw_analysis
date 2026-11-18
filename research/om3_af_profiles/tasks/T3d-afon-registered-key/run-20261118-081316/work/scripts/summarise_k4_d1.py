import json
from pathlib import Path
rows = [json.loads(line) for line in Path("work/out/exp-k4-d1.jsonl").read_text(encoding="utf-8").splitlines()]
out = []
for row in rows:
    step = row.get("step")
    if step == "after-ok":
        writes = row.get("parts", {}).get("commit") or []
        kinds = {}
        for w in writes:
            kinds[w.get("fn")] = kinds.get(w.get("fn"), 0) + 1
        out.append(f"after chooser={row.get('chooser')} returnD0={row.get('returnD0')} cmpD0={row.get('cmpD0')} highlight={row.get('highlight')}")
        out.append("texts: " + " | ".join(row.get("texts") or []))
        out.append("match: " + json.dumps(row.get("match")))
        out.append("getter: " + json.dumps(row.get("getter")))
        out.append("parts: " + json.dumps({k: v for k, v in (row.get("parts") or {}).items() if k != "commit"}))
        out.append("write kinds: " + json.dumps(kinds))
        setters = [w for w in writes if w.get("fn") in ("setter", "store-63431")]
        out.append("setter/store: " + json.dumps(setters))
        out.append("cells 5b82 " + json.dumps((row.get("cells") or {}).get("k5b82")))
        out.append("cells 90a1 " + json.dumps((row.get("cells") or {}).get("k90a1")))
    elif step in ("before-ok", "cancel", "confirm", "no-chooser", "done", "k4-hook", "boundary"):
        brief = {k: row.get(k) for k in ("step", "highlight", "note", "chooser", "explanation", "error") if k in row or k == "step"}
        if step in ("cancel", "confirm"):
            writes = row.get("commit") or []
            kinds = {}
            for w in writes:
                kinds[w.get("fn")] = kinds.get(w.get("fn"), 0) + 1
            setters = [w for w in writes if w.get("fn") in ("setter", "store-63431")]
            brief["writeKinds"] = kinds
            brief["setter"] = setters
            brief["k5b82"] = (row.get("cells") or {}).get("k5b82")
            brief["k90a1"] = (row.get("cells") or {}).get("k90a1")
            brief["texts"] = row.get("texts")
        out.append(json.dumps(brief)[:2500])
Path("work/out/exp-k4-d1-summary.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("\n".join(out))
