import json
from pathlib import Path
src = Path("work/out/trace-match-d1.jsonl")
out = []
for line in src.read_text(encoding="utf-8").splitlines():
    row = json.loads(line)
    if row.get("step") != "ok":
        continue
    out.append(f"== {row.get('label')} returnD0={row.get('returnD0')} cmpD0={row.get('cmpD0')} highlight={row.get('before', {}).get('highlight')}")
    for ev in row.get("match") or []:
        if ev.get("site") == "table-call":
            recs = ev.get("records") or []
            out.append(f"  table-call count={ev.get('count')} table={ev.get('table')} obj={ev.get('obj')} key1Half={ev.get('key1Half')} records={len(recs)}")
            for rec in recs:
                out.append(f"    [{rec['i']}] w0={rec['w0']} h4={rec['h4']} h6={rec['h6']} fn={rec['fn']} {rec['fnName']}")
        else:
            out.append("  " + json.dumps({k: v for k, v in ev.items() if k != 'part'}, separators=(',', ':')))
Path("work/out/match-summary-d1.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"lines {len(out)}")
