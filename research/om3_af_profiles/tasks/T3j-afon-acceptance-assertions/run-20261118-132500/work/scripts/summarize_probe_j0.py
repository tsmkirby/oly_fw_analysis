# Compact view of probe-j1. Do not edit after it has run.
import json
from pathlib import Path

rows = [json.loads(line) for line in Path("work/out/probe-j1.jsonl").read_text(encoding="utf-8").splitlines() if line]
by = {}
for row in rows:
    if row.get("step") == "done":
        print("DONE", row)
        continue
    by.setdefault(row["id"], {})[row["session"]] = row

print("steps", len(by))
for sid, sessions in by.items():
    names = sorted(sessions)
    a = sessions[names[0]]
    bits = [sid, "shared" if a["shared"] else "afon"]
    for name in names:
        r = sessions[name]
        bits.append(
            f"{name}:title={r['title']!r}:hl={r['highlight']!r}:scr={r['screen']}:p={r['profile']}/{r['profileCached']}:slot={r['slotValue']}:help={r['helpId']}:glyph={r['glyph']}:saves={r['saves']}:err={r['error']}"
        )
    print(" | ".join(bits))

print("--- shared mismatches ---")
for sid, sessions in by.items():
    if "control" in sessions and "cprobe" in sessions:
        c, d = sessions["control"], sessions["cprobe"]
        if c["title"] != d["title"] or c["highlight"] != d["highlight"] or c["screen"] != d["screen"]:
            print("MAIN", sid, c["title"], d["title"], c["highlight"], d["highlight"], c["screen"], d["screen"])
        if c["invariant"] != d["invariant"]:
            print("CELLS", sid)
    if "p28-control" in sessions and "p28-cprobe" in sessions:
        c, d = sessions["p28-control"], sessions["p28-cprobe"]
        if c["title"] != d["title"] or c["highlight"] != d["highlight"] or c["screen"] != d["screen"]:
            print("P28", sid, c["title"], d["title"], c["highlight"], d["highlight"], c["screen"], d["screen"])
        if c["invariant"] != d["invariant"]:
            print("P28CELLS", sid)
