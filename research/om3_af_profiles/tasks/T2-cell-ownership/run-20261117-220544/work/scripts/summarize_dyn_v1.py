import json
import sys

path = sys.argv[1]
n = 0
for line in open(path, encoding="utf-8"):
    o = json.loads(line)
    n += 1
    step = o.get("step", "")
    lost = o.get("markerLost") or []
    delta = o.get("delta") or []
    show = step in ("scalar-info", "done", "session-2", "mark-readback") or (lost and step != "startup") or delta
    if not show:
        continue
    extra = ""
    if step == "scalar-info":
        extra = " sid=%s before=%s keys=%s err=%s" % (o.get("sid"), o.get("before"), o.get("keys"), o.get("error"))
    if lost and step != "startup":
        extra += " LOST=" + str(lost)
    if delta:
        extra += " DELTA=" + str(delta)[:240]
    print(step + extra)
print("lines", n)
