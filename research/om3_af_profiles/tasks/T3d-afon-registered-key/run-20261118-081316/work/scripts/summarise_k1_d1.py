import json
from pathlib import Path
out = []
for line in Path("work/out/exp-k1-d2.jsonl").read_text(encoding="utf-8").splitlines():
    row = json.loads(line)
    step = row.get("step")
    if step == "before-ok":
        out.append(f"before highlight={row.get('highlight')} file={row.get('file')} getter={json.dumps(row.get('getter'))}")
        out.append("before texts: " + " | ".join(row.get("texts") or []))
        out.append("before cells " + json.dumps(row.get("cells")))
    elif step == "after-ok":
        out.append(f"after highlight={row.get('highlight')} chooser={row.get('chooser')} returnD0={row.get('returnD0')} cmpD0={row.get('cmpD0')} cmpD2={row.get('cmpD2')}")
        out.append("after texts: " + " | ".join(row.get("texts") or []))
        out.append("getter " + json.dumps(row.get("getter")))
        out.append("match " + json.dumps(row.get("match")))
        out.append("parts " + json.dumps(row.get("parts")))
        out.append("decideReads " + json.dumps(row.get("decideReads")))
        out.append("after cells " + json.dumps(row.get("cells")))
    elif step in ("no-chooser", "cancel", "confirm", "done", "k1-hook", "boundary"):
        keep = {k: v for k, v in row.items() if k not in ("hook", "role")}
        out.append(step + " " + json.dumps(keep)[:2000])
    elif step in ("overlay", "redirects", "cells-before"):
        out.append(step + " " + json.dumps({k: v for k, v in row.items() if k in ("step", "changed", "valueHooks", "descriptorLink", "k5b82", "k90a1", "page27", "source")}))
Path("work/out/exp-k1-d2-summary.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("\n".join(out[:30]))
