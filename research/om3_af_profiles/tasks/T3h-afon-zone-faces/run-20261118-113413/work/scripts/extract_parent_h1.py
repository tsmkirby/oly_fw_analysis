# role: observe. Print the face-key dump from the parent trace.
import json
from pathlib import Path

for line in Path("work/out/trace-parent-h3.jsonl").read_text(encoding="utf-8").splitlines():
    if '"step":"chooser-open"' not in line:
        continue
    rec = json.loads(line)
    for item in rec.get("faceKeys", []):
        print(json.dumps(item, indent=2))
