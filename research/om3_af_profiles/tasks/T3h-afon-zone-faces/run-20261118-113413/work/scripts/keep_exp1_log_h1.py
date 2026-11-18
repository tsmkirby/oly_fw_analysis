# role: observe. Keep the crashed run's stdout as the JSONL the script did not flush.
from pathlib import Path
src = Path("work/out/cmd/17.out").read_bytes()
Path("work/out/exp-faces-h1.jsonl").write_bytes(src)
print(len(src))
