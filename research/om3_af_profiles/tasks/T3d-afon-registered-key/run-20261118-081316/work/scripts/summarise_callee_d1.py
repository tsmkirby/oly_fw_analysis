# Summarise trace-callee-d1.jsonl. Writes work/out/callee-summary-d1.txt.
import json
from pathlib import Path

src = Path("work/out/trace-callee-d1.jsonl")
out = Path("work/out/callee-summary-d1.txt")
lines = []
for raw in src.read_text(encoding="utf-8").splitlines():
    if not raw:
        continue
    row = json.loads(raw)
    if row.get("step") != "ok":
        lines.append(f"step {row.get('step')} error={row.get('error')} texts={row.get('texts')}")
        continue
    lines.append(f"== {row['label']} returnD0={row.get('returnD0')} cmpD0={row.get('cmpD0')}")
    lines.append(f"  before={row['before'].get('highlight')!r} after0={row['after'].get('texts', [''])[0][:60]!r}")
    for ev in row.get("chain", []):
        site = ev.get("site")
        if site == "decide-call":
            lines.append(
                f"  decide-call d0={ev.get('d0')} target={ev.get('a1')} {ev.get('targetName')} "
                f"field50={ev.get('field50')} field4c={ev.get('field4c')} a0={ev.get('a0')}"
            )
        elif site in ("decide-return", "decide-entry", "field-50", "return-d0", "cmp-1"):
            keep = {k: ev.get(k) for k in ("site", "d0", "d1", "name", "obj", "at4c", "a0", "a1") if k in ev}
            lines.append(f"  {keep}")
    lines.append(f"  decideReads {len(row.get('decideReads', []))}")
    for rd in row.get("decideReads", []):
        lines.append(f"    {rd['fn']} d0={rd['d0']} d1={rd['d1']} caller={rd['caller']} mdr={rd['mdr']}")
text = "\n".join(lines) + "\n"
out.write_text(text, encoding="utf-8")
print(text)
