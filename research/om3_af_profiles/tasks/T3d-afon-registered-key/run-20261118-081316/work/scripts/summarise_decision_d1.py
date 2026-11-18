# Summarise the decision-trace JSONL. Writes work/out/decision-summary-d1.txt.
import json
from pathlib import Path

src = Path("work/out/trace-decision-d1.jsonl")
out = Path("work/out/decision-summary-d1.txt")
lines = []
for raw in src.read_text(encoding="utf-8").splitlines():
    if not raw:
        continue
    row = json.loads(raw)
    if row.get("step") != "ok":
        lines.append(f"step {row.get('step')} label={row.get('label')} error={row.get('error')}")
        continue
    lines.append(f"== {row['label']} returnD0={row['returnD0']} cmpD0={row['cmpD0']} cmpD2={row['cmpD2']}")
    lines.append(f"  before highlight={row['before'].get('highlight')!r}")
    lines.append(f"  after texts={row['after'].get('texts')!r}")
    for ev in row["chain"]:
        if ev["site"] == "fn-6120308d":
            lines.append(
                f"  6120308d obj={ev.get('obj')} vt={ev.get('vtable')} slot0={ev.get('slot0')} {ev.get('slot0Name')}"
            )
            lines.append(f"    objWords={ev.get('objWords')}")
        elif ev["site"] == "fn-61203082":
            lines.append(f"  61203082 at50={ev.get('at50')} {ev.get('at50Name')} d0={ev.get('d0')}")
        elif ev["site"] == "return-d0":
            lines.append(f"  return d0={ev.get('d0')} d2={ev.get('d2')}")
    reads = row["reads"]
    lines.append(f"  reads {len(reads)}")
    for rd in reads:
        lines.append(f"    {rd['fn']} d0={rd['d0']} d1={rd['d1']} a0={rd['a0']} caller={rd['caller']} mdr={rd['mdr']}")
text = "\n".join(lines) + "\n"
out.write_text(text, encoding="utf-8")
print(text)
