# Publish the proposed overlay under the brief's filename.
# The bytes are the X1 overlay. X4 is not the proposal.
from pathlib import Path

src = Path("work/out/overlay-x1-e1.csv")
dst = Path("work/out/overlay-changed-bytes.csv")
data = src.read_bytes()
if dst.exists():
    raise SystemExit("refusing to overwrite " + str(dst))
dst.write_bytes(data)
print("bytes", len(data))
print("lines", data.count(b"\n"))
